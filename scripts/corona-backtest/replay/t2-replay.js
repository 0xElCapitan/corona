/**
 * scripts/corona-backtest/replay/t2-replay.js
 *
 * T2 Geomagnetic Storm Gate deterministic replay producer (cycle-002 step 6).
 *
 * Per:
 *   - CONTRACT §3 (top-level shape)
 *   - CONTRACT §5 row T2 (binary_scalar)
 *   - CONTRACT §6 row T2 (cutoff = first_threshold_crossing_or_window_end)
 *   - CONTRACT §8.2 (binary outcome via GFZ-preferred Kp comparison)
 *   - CONTRACT §10 + §10.1.1 (provenance + replay-mode fail-closed clock)
 *   - CHARTER §12 (pinned cycle-002 gate params: kp_threshold 5, window_hours 72)
 *
 * Cycle-001 T2 corpus events carry only the post-storm peak Kp values
 * (kp_swpc_observed, kp_gfz_observed) and the storm window bounds
 * (kp_window_start, kp_window_end), with NO per-3hr Kp time-series. Without
 * a time-series, "first_threshold_crossing" is not derivable from the
 * corpus; the cutoff falls back to kp_window_end. Position history captures
 * the runtime's base-rate prior only — same honest framing as T1.
 *
 * Determinism: clock seed = gate_open_time = kp_window_start.
 * Replay-mode never falls back to Date.now() (CONTRACT §10.1.1).
 */

import { createGeomagneticStormGate, processGeomagneticStormGate } from '../../../src/theatres/geomag-gate.js';
import { buildKpUncertainty } from '../../../src/processor/uncertainty.js';
// Cycle-004 Sprint 02 (SDD §7/§8): the DRY strict-`<`-cutoff + sort helper that
// Layer B (deriveEvidenceT2) also uses, so Layer-A bundle times cannot diverge
// from evidence.pre_cutoff. Exposed via corpus-loader's `_`-prefixed block.
import { _deriveKpPreCutoffObservations as deriveKpPreCutoffObservations } from '../ingestors/corpus-loader.js';

import { sha256OfCanonical, computeTrajectoryHash } from './hashes.js';
import { assertReplayMode } from './context.js';

const CYCLE_002_T2_GATE_PARAMS = Object.freeze({
  kp_threshold: 5,
  window_hours: 72,
});

function parseIsoMs(iso) {
  if (typeof iso === 'number' && Number.isFinite(iso)) return iso;
  if (typeof iso !== 'string') return NaN;
  return new Date(iso).getTime();
}

function corpusEventForHash(event) {
  const { _file, _derived, ...rest } = event;
  return rest;
}

/**
 * Produce a PredictionTrajectory for one T2 corpus event.
 *
 * @param {object} corpus_event - T2 event from loadCorpus
 * @param {object} ctx - frozen context from createReplayContext({ theatre_id: 'T2', ... })
 * @param {object} [options]
 * @param {boolean} [options.wireEvidence=false] - Cycle-004 Sprint 02 opt-in T2
 *   evidence-consumption seam (SDD §8). When true AND the corpus event carries
 *   a kp_observations[] series, the strictly-pre-cutoff readings are built into
 *   pinned kp_index evidence bundles (shared Layer-B helper) and fed through the
 *   EXISTING processGeomagneticStormGate in ascending-time order. Default false
 *   is byte-identical to pre-cycle-004 behavior; the cycle-002 entrypoint and
 *   the cycle-004 baseline harness both call replay_T2_event(event, ctx) with no
 *   options, so all live cycle-002 replays remain unperturbed by construction
 *   (the t4-replay.js lambdaScalar precedent).
 * @returns {object} PredictionTrajectory matching CONTRACT §3
 */
export function replay_T2_event(corpus_event, ctx, options = {}) {
  assertReplayMode(ctx);
  const { wireEvidence = false } = options;
  if (corpus_event?.theatre !== 'T2') {
    throw new Error(`replay_T2_event: expected T2 corpus event, got theatre="${corpus_event?.theatre}"`);
  }

  // ---- 1. Gate-open and cutoff per CONTRACT §6 row T2 ----
  const gateOpenMs = parseIsoMs(corpus_event.kp_window_start);
  if (!Number.isFinite(gateOpenMs)) {
    throw new Error(`replay_T2_event: invalid kp_window_start for ${corpus_event.event_id}`);
  }
  const windowEndMs = parseIsoMs(corpus_event.kp_window_end);
  if (!Number.isFinite(windowEndMs)) {
    throw new Error(`replay_T2_event: invalid kp_window_end for ${corpus_event.event_id}`);
  }
  // Cycle-001 T2 corpus lacks a per-3hr Kp time-series; first_threshold_crossing
  // is not derivable. Fall back to window_end per CONTRACT §6 row T2.
  const cutoffMs = windowEndMs;

  // ---- 2. Gate params (cycle-002 pinned per CHARTER §12) ----
  const gateParams = { ...CYCLE_002_T2_GATE_PARAMS };

  // ---- 3. Frame-time clock for runtime calls ----
  let frameTimeMs = gateOpenMs;
  const now = () => frameTimeMs;

  // ---- 4. Open theatre at gate_open_time ----
  let theatre = createGeomagneticStormGate(
    {
      kp_threshold: gateParams.kp_threshold,
      window_hours: gateParams.window_hours,
    },
    { now },
  );

  // ---- 4b. Cycle-004 Sprint 02 opt-in T2 evidence consumption (default-off) ----
  // SDD §8 / SPRINT-PLAN §5.4 (T2.3 + T2.4). When the caller opts in AND the
  // corpus event carries a kp_observations[] series, build pinned kp_index
  // evidence bundles from the STRICTLY pre-cutoff observations (via the shared
  // Layer-B helper, so bundle times cannot diverge from evidence.pre_cutoff) and
  // feed them through the EXISTING, byte-frozen processGeomagneticStormGate in
  // ascending event_time order, advancing the injected clock per bundle. The
  // gate is CALLED, never modified. evidence_class 'provisional' routes every
  // bundle through the gradual provisional-update path and NEVER resolves the
  // gate (resolution requires ground_truth / provisional_mature — SDD §6.3),
  // producing real intermediate position_history updates rather than a trivial
  // jump to 1.0.
  //
  // GFZ-lag handling (SDD §6.6): evidence is derived from ALL strictly-pre-cutoff
  // observations regardless of regression_tier_eligible / kp_gfz_observed; no
  // entry is dropped for provenance — provenance instead flows into the
  // uncertainty source (GFZ → narrower σ, SWPC → wider σ).
  //
  // Default-off / field-absent path is byte-identical to pre-cycle-004: no
  // bundles, no process loop, evidence_bundles_consumed: [] (the lambdaScalar
  // precedent — t4-replay.js). outcome (§6) and corpus_event_hash (§7) are
  // unaffected by wiring. No scoring.
  let kpBundles = [];
  if (wireEvidence === true && Array.isArray(corpus_event.kp_observations)) {
    const preCutoff = deriveKpPreCutoffObservations(corpus_event.kp_observations, cutoffMs);
    kpBundles = preCutoff.map((obs) => ({
      bundle_id: `replay-t2-kp-${corpus_event.event_id}-${obs.time}`,
      evidence_class: 'provisional',
      payload: {
        event_type: 'kp_index',
        event_time: obs.event_time_ms,
        kp: {
          value: obs.kp,
          uncertainty: buildKpUncertainty({
            kp: obs.kp,
            source: obs.provenance === 'gfz_definitive' ? 'GFZ' : 'SWPC',
          }),
        },
        // OD-1 / SDD §6.5: a uniform neutral/default runtime quality weight
        // required by the existing T2 gate contract (processKpObservation reads
        // payload.quality.composite). It is NOT source-derived, NOT in the
        // corpus, NOT fitted, NOT tuned, NOT optimized, NOT quality-measured,
        // NOT a parameter-refit — a single documented deterministic constant.
        quality: { composite: 1.0 },
      },
    }));
    for (const bundle of kpBundles) {
      frameTimeMs = bundle.payload.event_time;          // advance injected clock
      theatre = processGeomagneticStormGate(theatre, bundle, { now });
    }
  }

  // ---- 5. Position history filter + field rename per CONTRACT §3.1 ----
  const positionHistoryAtCutoff = theatre.position_history
    .filter((entry) => entry.t <= cutoffMs)
    .map((entry) => ({
      t_ms: entry.t,
      p: entry.p,
      evidence_id: entry.evidence ?? null,
      reason: entry.reason,
    }));

  // ---- 6. Outcome (CONTRACT §8.2): GFZ-preferred Kp comparison ----
  const kpObserved = corpus_event.kp_gfz_observed ?? corpus_event.kp_swpc_observed;
  if (typeof kpObserved !== 'number' || !Number.isFinite(kpObserved)) {
    throw new Error(
      `replay_T2_event: ${corpus_event.event_id} has no usable Kp observation ` +
      `(gfz=${corpus_event.kp_gfz_observed}, swpc=${corpus_event.kp_swpc_observed})`,
    );
  }
  const outcomeValue = kpObserved >= gateParams.kp_threshold ? 1 : 0;

  // ---- 7. Cutoff and gate-params hashes ----
  const cutoffObj = { time_ms: cutoffMs, rule: 'first_threshold_crossing_or_window_end' };
  const corpusEventHash = sha256OfCanonical(corpusEventForHash(corpus_event));
  const cutoffHash = sha256OfCanonical(cutoffObj);
  const gateParamsHash = sha256OfCanonical(gateParams);

  // ---- 8. Build trajectory with sentinel trajectory_hash ----
  const trajectory = {
    schema_version: '0.1.0',
    theatre_id: 'T2',
    theatre_template: 'geomagnetic_storm_gate',
    event_id: corpus_event.event_id,
    distribution_shape: 'binary_scalar',
    cutoff: cutoffObj,
    gate_params: gateParams,
    position_history_at_cutoff: positionHistoryAtCutoff,
    current_position_at_cutoff: theatre.current_position,
    evidence_bundles_consumed: kpBundles.map((bundle) => bundle.bundle_id),
    outcome: {
      kind: 'binary',
      value: outcomeValue,
      derivation: 'T2 binary outcome via GFZ-preferred Kp comparison per CONTRACT §8.2',
    },
    meta: {
      runtime_revision: ctx.runtime_revision,
      contract_version: '0.1.0',
      corpus_event_hash: corpusEventHash,
      cutoff_hash: cutoffHash,
      gate_params_hash: gateParamsHash,
      replay_clock_source: 'corpus_event_time',
      replay_clock_seed: ctx.replay_clock_seed,
      trajectory_hash: '',
    },
  };

  trajectory.meta.trajectory_hash = computeTrajectoryHash(trajectory);
  return trajectory;
}

export { CYCLE_002_T2_GATE_PARAMS };
