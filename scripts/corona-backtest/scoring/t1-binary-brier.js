/**
 * scripts/corona-backtest/scoring/t1-binary-brier.js
 *
 * T1 Flare Class Gate threshold-native binary Brier scoring (cycle-002 path).
 *
 * Per:
 *   - grimoires/loa/a2a/cycle-002/sprint-00/CHARTER.md §9 (T1/T2 binary scoring decision, no fake bucket projection)
 *   - grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md §8.1 (T1 outcome derivation)
 *
 * Cycle-001 6-bucket scoring at scoring/t1-bucket-brier.js is FROZEN
 * (corpus-baseline diagnostic per CHARTER §9.3). This module is the
 * cycle-002 runtime-wired scoring path that consumes a PredictionTrajectory's
 * `current_position_at_cutoff` as the predicted scalar.
 *
 * Operator hard constraint #5 / SDD §6.4: independent Brier formula; no
 * code sharing with t1-bucket-brier.js, t2-binary-brier.js, t4-bucket-brier.js,
 * or src/rlmf/certificates.js.
 *
 * Brier formula (binary): brier = (p - o)^2
 *   where p = trajectory.current_position_at_cutoff (scalar in [0, 1])
 *         o = 1 iff flareRank(event.flare_class_observed) >= flareRank(gate_params.threshold_class)
 *
 * Result shape:
 *   { brier, n_events, per_event[], scoring_path }
 */

import { flareRank } from '../../../src/oracles/swpc.js';

/**
 * Score one T1 corpus event against its replay trajectory.
 *
 * @param {object} event - T1 corpus event from loadCorpus (with flare_class_observed)
 * @param {object} trajectory - PredictionTrajectory with theatre_id="T1", binary_scalar shape
 * @returns {object} per-event scoring record
 */
export function scoreEventT1Binary(event, trajectory) {
  if (event.theatre !== 'T1') {
    throw new Error(`scoreEventT1Binary: expected T1 event, got "${event.theatre}"`);
  }
  if (trajectory?.theatre_id !== 'T1') {
    throw new Error(`scoreEventT1Binary: expected T1 trajectory, got "${trajectory?.theatre_id}"`);
  }
  if (trajectory.distribution_shape !== 'binary_scalar') {
    throw new Error(`scoreEventT1Binary: expected binary_scalar shape, got "${trajectory.distribution_shape}"`);
  }
  const p = trajectory.current_position_at_cutoff;
  if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error(`scoreEventT1Binary: invalid predicted scalar ${p} for ${event.event_id}`);
  }
  const thresholdClass = trajectory.gate_params?.threshold_class;
  if (typeof thresholdClass !== 'string') {
    throw new Error(`scoreEventT1Binary: trajectory.gate_params.threshold_class must be a string for ${event.event_id}`);
  }
  const observedRank = flareRank(event.flare_class_observed);
  const thresholdRank = flareRank(thresholdClass);
  if (typeof observedRank !== 'number' || !Number.isFinite(observedRank)
      || typeof thresholdRank !== 'number' || !Number.isFinite(thresholdRank)) {
    throw new Error(
      `scoreEventT1Binary: flareRank returned non-number for ` +
      `observed="${event.flare_class_observed}" or threshold="${thresholdClass}"`,
    );
  }
  const observed = observedRank >= thresholdRank ? 1 : 0;
  const diff = p - observed;
  const brierScore = diff * diff;
  return {
    event_id: event.event_id,
    predicted_p: p,
    observed,
    flare_class_observed: event.flare_class_observed,
    threshold_class: thresholdClass,
    brier_score: brierScore,
    trajectory_hash: trajectory.meta?.trajectory_hash ?? null,
  };
}

/**
 * Score the corpus by mapping (event, trajectory) pairs through scoreEventT1Binary.
 * The caller pairs corpus events with their replay trajectories by event_id.
 */
export function scoreCorpusT1Binary(eventTrajectoryPairs) {
  if (!Array.isArray(eventTrajectoryPairs)) {
    throw new Error('scoreCorpusT1Binary: argument must be an array of { event, trajectory } pairs');
  }
  const perEvent = eventTrajectoryPairs.map(({ event, trajectory }) => scoreEventT1Binary(event, trajectory));
  const brier = perEvent.length === 0
    ? 0
    : perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length;
  return {
    brier,
    n_events: perEvent.length,
    per_event: perEvent,
    scoring_path: 't1_binary_brier_cycle002',
  };
}
