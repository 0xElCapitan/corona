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

import { createGeomagneticStormGate } from '../../../src/theatres/geomag-gate.js';

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
 * @returns {object} PredictionTrajectory matching CONTRACT §3
 */
export function replay_T2_event(corpus_event, ctx) {
  assertReplayMode(ctx);
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
  const theatre = createGeomagneticStormGate(
    {
      kp_threshold: gateParams.kp_threshold,
      window_hours: gateParams.window_hours,
    },
    { now },
  );

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
    evidence_bundles_consumed: [],
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
