/**
 * scripts/corona-backtest/replay/t1-replay.js
 *
 * T1 Flare Class Gate deterministic replay producer (cycle-002 step 6).
 *
 * Per:
 *   - CONTRACT §3 (top-level shape)
 *   - CONTRACT §5 row T1 (binary_scalar)
 *   - CONTRACT §6 row T1 (cutoff = flare_peak_time - 1)
 *   - CONTRACT §8.1 (binary outcome via flareRank)
 *   - CONTRACT §10 + §10.1.1 (provenance + replay-mode fail-closed clock)
 *   - CHARTER §12 (pinned cycle-002 gate params: threshold_class M1.0, window_hours 24)
 *
 * Cycle-001 T1 corpus events do not carry pre-cutoff time-series evidence
 * (just the post-flare outcome metadata). The trajectory's
 * position_history_at_cutoff therefore contains only the initial base-rate
 * entry from createFlareClassGate. This is honest: the runtime's prior
 * is what's captured, and Rung 1 success is "trajectory is real and
 * deterministic", not "trajectory beats uniform prior" (Rung 3).
 *
 * Determinism: clock seed = gate_open_time = flare_peak_time - window_hours * 3600_000.
 * Replay-mode never falls back to Date.now() (CONTRACT §10.1.1).
 */

import { createFlareClassGate } from '../../../src/theatres/flare-gate.js';
import { flareRank } from '../../../src/oracles/swpc.js';

import { sha256OfCanonical, computeTrajectoryHash } from './hashes.js';
import { assertReplayMode } from './context.js';

const CYCLE_002_T1_GATE_PARAMS = Object.freeze({
  threshold_class: 'M1.0',
  window_hours: 24,
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
 * Produce a PredictionTrajectory for one T1 corpus event.
 *
 * @param {object} corpus_event - T1 event from loadCorpus
 * @param {object} ctx - frozen context from createReplayContext({ theatre_id: 'T1', ... })
 * @returns {object} PredictionTrajectory matching CONTRACT §3
 */
export function replay_T1_event(corpus_event, ctx) {
  assertReplayMode(ctx);
  if (corpus_event?.theatre !== 'T1') {
    throw new Error(`replay_T1_event: expected T1 corpus event, got theatre="${corpus_event?.theatre}"`);
  }

  // ---- 1. Cutoff (CONTRACT §6 row T1: flare_peak_time - 1) ----
  const flarePeakMs = parseIsoMs(corpus_event.flare_peak_time);
  if (!Number.isFinite(flarePeakMs)) {
    throw new Error(`replay_T1_event: invalid flare_peak_time for ${corpus_event.event_id}`);
  }
  const cutoffMs = flarePeakMs - 1;

  // ---- 2. Gate params (cycle-002 pinned per CHARTER §12) ----
  const gateParams = { ...CYCLE_002_T1_GATE_PARAMS };
  const gateOpenMs = flarePeakMs - gateParams.window_hours * 3600_000;

  // ---- 3. Frame-time clock for runtime calls ----
  // Cycle-001 T1 corpus has no pre-cutoff time-series evidence; the runtime
  // is invoked once for theatre creation. The clock returns gate_open_time.
  let frameTimeMs = gateOpenMs;
  const now = () => frameTimeMs;

  // ---- 4. Open theatre at gate_open_time ----
  const theatre = createFlareClassGate(
    {
      threshold_class: gateParams.threshold_class,
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

  // ---- 6. Outcome (CONTRACT §8.1): binary via flareRank ----
  const observedRank = flareRank(corpus_event.flare_class_observed);
  const thresholdRank = flareRank(gateParams.threshold_class);
  if (typeof observedRank !== 'number' || !Number.isFinite(observedRank)
      || typeof thresholdRank !== 'number' || !Number.isFinite(thresholdRank)) {
    throw new Error(
      `replay_T1_event: flareRank returned non-number for ` +
      `observed="${corpus_event.flare_class_observed}" or threshold="${gateParams.threshold_class}"`,
    );
  }
  const outcomeValue = observedRank >= thresholdRank ? 1 : 0;

  // ---- 7. Cutoff and gate-params hashes ----
  const cutoffObj = { time_ms: cutoffMs, rule: 'flare_peak_minus_epsilon' };
  const corpusEventHash = sha256OfCanonical(corpusEventForHash(corpus_event));
  const cutoffHash = sha256OfCanonical(cutoffObj);
  const gateParamsHash = sha256OfCanonical(gateParams);

  // ---- 8. Build trajectory with sentinel trajectory_hash ----
  const trajectory = {
    schema_version: '0.1.0',
    theatre_id: 'T1',
    theatre_template: 'flare_class_gate',
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
      derivation: 'T1 binary outcome via flareRank() per CONTRACT §8.1',
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

export { CYCLE_002_T1_GATE_PARAMS };
