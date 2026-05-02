/**
 * scripts/corona-backtest/replay/t4-replay.js
 *
 * T4 (Proton Event Cascade) deterministic replay producer.
 *
 * Sprint 2 milestone-1 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md
 *     §3 (top-level shape), §5 row T4, §6 row T4, §8.4, §10
 *   - grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md §5
 *
 * Replays the runtime proton-cascade theatre against pre-cutoff proton-flux
 * observations from a single T4 corpus event, returning a canonical
 * PredictionTrajectory with byte-identical output across invocations
 * (REPLAY-SEAM §9.1 — Rung 1 binding gate).
 *
 * Determinism guarantees:
 *   - The injected `now` function returns deterministic timestamps derived
 *     from corpus event_time fields (CONTRACT §10.1.1 fail-closed rule).
 *   - The runtime captures `nowFn()` once per call (Sprint 2 modifications
 *     to proton-cascade.js).
 *   - position_history filter is strict <= cutoff.time_ms.
 *   - Trajectory hash is computed last with empty-string sentinel
 *     (REPLAY-SEAM §8.2).
 *
 * Zero new runtime dependencies.
 */

import {
  createProtonEventCascade,
  processProtonEventCascade,
  resolveProtonEventCascade,
  BUCKETS,
} from '../../../src/theatres/proton-cascade.js';
import { flareRank } from '../../../src/oracles/swpc.js';

import { sha256OfCanonical, computeTrajectoryHash } from './hashes.js';
import { assertReplayMode } from './context.js';

function parseIsoMs(iso) {
  if (typeof iso === 'number' && Number.isFinite(iso)) return iso;
  if (typeof iso !== 'string') return NaN;
  return new Date(iso).getTime();
}

/**
 * Strip loader-injected metadata (_file, _derived) before hashing.
 * The corpus_event_hash reflects the corpus author's content only.
 * _file is filesystem-dependent; _derived is loader-derived and could
 * shift if the loader's derivation logic changes.
 */
function corpusEventForHash(event) {
  const { _file, _derived, ...rest } = event;
  return rest;
}

/**
 * Produce a PredictionTrajectory for one T4 corpus event.
 *
 * @param {object} corpus_event - T4 event from loadCorpus (with _derived populated by the loader)
 * @param {object} ctx - frozen replay context from createReplayContext({ theatre_id: 'T4', ... })
 * @returns {object} PredictionTrajectory matching CONTRACT §3
 */
export function replay_T4_event(corpus_event, ctx) {
  assertReplayMode(ctx);
  if (corpus_event?.theatre !== 'T4') {
    throw new Error(`replay_T4_event: expected T4 corpus event, got theatre="${corpus_event?.theatre}"`);
  }

  // ---- 1. Cutoff (CONTRACT §6 row T4: window_end = trigger_peak + window_hours) ----
  const triggerPeakMs = parseIsoMs(corpus_event.trigger_flare_peak_time);
  if (!Number.isFinite(triggerPeakMs)) {
    throw new Error(`replay_T4_event: invalid trigger_flare_peak_time for ${corpus_event.event_id}`);
  }
  const windowHours = corpus_event.prediction_window_hours;
  if (typeof windowHours !== 'number' || !Number.isFinite(windowHours) || windowHours <= 0) {
    throw new Error(`replay_T4_event: invalid prediction_window_hours for ${corpus_event.event_id}`);
  }
  const cutoffMs = triggerPeakMs + windowHours * 3600_000;

  // ---- 2. Synthetic trigger bundle for the M5+ flare opening the cascade theatre ----
  const triggerRank = flareRank(corpus_event.trigger_flare_class);
  if (typeof triggerRank !== 'number' || !Number.isFinite(triggerRank)) {
    throw new Error(`replay_T4_event: flareRank returned non-number for class "${corpus_event.trigger_flare_class}"`);
  }
  const triggerBundle = {
    bundle_id: `replay-t4-trigger-${corpus_event.event_id}`,
    evidence_class: 'ground_truth',
    payload: {
      event_type: 'solar_flare',
      event_id: `replay-flare-${corpus_event.event_id}`,
      flare: {
        class_string: corpus_event.trigger_flare_class,
        rank: triggerRank,
      },
      timing: {
        begin: triggerPeakMs,
      },
    },
  };

  // ---- 3. Pre-cutoff proton-flux bundles, sorted by event_time ----
  // Strict pre-cutoff filter: event_time_ms < cutoff.time_ms (CONTRACT §6.1).
  const protonBundles = [];
  const observations = Array.isArray(corpus_event.proton_flux_observations) ? corpus_event.proton_flux_observations : [];
  for (const obs of observations) {
    const obsMs = parseIsoMs(obs.time);
    if (!Number.isFinite(obsMs)) continue;
    if (obsMs >= cutoffMs) continue;
    protonBundles.push({
      bundle_id: `replay-t4-proton-${corpus_event.event_id}-${obs.time}`,
      evidence_class: 'ground_truth',
      payload: {
        event_type: 'proton_flux',
        event_time: obsMs,
        proton: {
          flux: obs.peak_pfu,
          energy_channel: obs.energy_channel,
        },
      },
    });
  }
  protonBundles.sort((a, b) => a.payload.event_time - b.payload.event_time);

  // ---- 4. Frame-time clock advanced before each runtime call ----
  let frameTimeMs = triggerPeakMs;
  const now = () => frameTimeMs;

  // ---- 5. Open theatre at trigger time ----
  let theatre = createProtonEventCascade(
    {
      triggerBundle,
      s_scale_threshold: 'S1',
      window_hours: windowHours,
    },
    { now },
  );
  if (theatre == null) {
    throw new Error(
      `replay_T4_event: createProtonEventCascade returned null for ${corpus_event.event_id} ` +
      `(trigger class="${corpus_event.trigger_flare_class}", rank=${triggerRank}). ` +
      `Cycle-001 runtime requires M5+ trigger.`,
    );
  }

  // ---- 6. Replay each pre-cutoff proton bundle in time order ----
  for (const bundle of protonBundles) {
    frameTimeMs = bundle.payload.event_time;
    theatre = processProtonEventCascade(theatre, bundle, { now });
  }

  // ---- 7. Build position_history_at_cutoff: strict <= cutoff filter + field rename ----
  const positionHistoryAtCutoff = theatre.position_history
    .filter((entry) => entry.t <= cutoffMs)
    .map((entry) => {
      const out = {
        t_ms: entry.t,
        p: entry.p,
        evidence_id: entry.evidence ?? null,
        reason: entry.reason,
      };
      if (entry.qualifying_count !== undefined) {
        out.aux = { qualifying_count: entry.qualifying_count };
      }
      return out;
    });

  // ---- 8. Outcome (CONTRACT §8.4): bucket_index from corpus _derived count ----
  const observedCount = corpus_event._derived?.qualifying_event_count_observed_derived;
  if (typeof observedCount !== 'number' || !Number.isFinite(observedCount)) {
    throw new Error(
      `replay_T4_event: corpus event ${corpus_event.event_id} missing ` +
      `_derived.qualifying_event_count_observed_derived (loader did not run?)`,
    );
  }
  let outcomeIndex = BUCKETS.findIndex(({ min, max }) => observedCount >= min && observedCount <= max);
  if (outcomeIndex < 0) outcomeIndex = BUCKETS.length - 1;

  // ---- 9. Cutoff and gate-params objects (used in trajectory + hashed separately) ----
  const cutoffObj = { time_ms: cutoffMs, rule: 'window_end' };
  const gateParams = {
    s_scale_threshold: 'S1',
    window_hours: windowHours,
  };

  // ---- 10. Hashes (CONTRACT §10) ----
  const corpusEventHash = sha256OfCanonical(corpusEventForHash(corpus_event));
  const cutoffHash = sha256OfCanonical(cutoffObj);
  const gateParamsHash = sha256OfCanonical(gateParams);

  // ---- 11. Build trajectory with sentinel trajectory_hash, then compute final hash ----
  const trajectory = {
    schema_version: '0.1.0',
    theatre_id: 'T4',
    theatre_template: 'proton_event_cascade',
    event_id: corpus_event.event_id,
    distribution_shape: 'bucket_array_5',
    cutoff: cutoffObj,
    gate_params: gateParams,
    position_history_at_cutoff: positionHistoryAtCutoff,
    current_position_at_cutoff: theatre.current_position,
    evidence_bundles_consumed: protonBundles.map((b) => b.bundle_id),
    outcome: {
      kind: 'bucket_index',
      value: outcomeIndex,
      derivation: 'T4 bucket index via BUCKETS.findIndex per Sprint 1 §8.4',
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
