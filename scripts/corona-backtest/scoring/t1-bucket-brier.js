/**
 * scripts/corona-backtest/scoring/t1-bucket-brier.js
 *
 * T1 Flare Class Gate scoring (calibration-protocol.md §4.1).
 *
 * Result shape (§4.1):
 *   { brier, bucket_calibration: number[], n_events }
 *
 * Operator hard constraint #5: this module owns its OWN Brier formula,
 * its OWN bucket boundaries, its OWN threshold check. No shared scoring
 * code paths with t2-bucket-brier.js, t3-timing-error.js,
 * t4-bucket-brier.js, or t5-quality-of-behavior.js. Duplication is the
 * lesser evil per SDD §6.4.
 *
 * Run 1 baseline prediction model:
 *   Each event's predicted distribution is a UNIFORM PRIOR over the 6
 *   T1 buckets — i.e., predicted_p_b = 1/6 for all b. This is the
 *   no-model floor; Sprint 5 will refit by swapping in the runtime
 *   flare-gate.js prediction. The Run 1 number reveals what the harness
 *   measures when given no information; the Sprint 5 number reveals the
 *   value the runtime provides over that floor. This decision is
 *   documented in the per-event report (§5).
 *
 * Bucket boundaries (mirrors corpus-loader.js T1_BUCKETS):
 *   ['<M', 'M1-M4', 'M5-M9', 'X1-X4', 'X5-X9', 'X10+']
 */

import { THRESHOLDS } from '../config.js';

const T1_BUCKETS = ['<M', 'M1-M4', 'M5-M9', 'X1-X4', 'X5-X9', 'X10+'];
const T1_BUCKET_COUNT = T1_BUCKETS.length;
const UNIFORM_PRIOR = T1_BUCKETS.map(() => 1 / T1_BUCKET_COUNT);

/**
 * Per-event Brier on flare-class buckets.
 * Reads bucket_observed from the loaded event's _derived block.
 */
export function scoreEventT1(event, predictedDistribution = UNIFORM_PRIOR) {
  if (event.theatre !== 'T1') {
    throw new Error(`scoreEventT1: expected T1 event, got ${event.theatre}`);
  }
  const observedBucket = event._derived?.bucket_observed;
  if (typeof observedBucket !== 'number' || observedBucket < 0) {
    throw new Error(`scoreEventT1: ${event.event_id} missing _derived.bucket_observed`);
  }
  if (!Array.isArray(predictedDistribution) || predictedDistribution.length !== T1_BUCKET_COUNT) {
    throw new Error(`scoreEventT1: predicted distribution must be length ${T1_BUCKET_COUNT}`);
  }

  // Brier = sum_b (predicted_p_b - observed_b)^2 / B
  // observed_b is 1 for the observed bucket, 0 elsewhere.
  let sumSq = 0;
  for (let b = 0; b < T1_BUCKET_COUNT; b++) {
    const obs = b === observedBucket ? 1 : 0;
    const pred = predictedDistribution[b];
    const diff = pred - obs;
    sumSq += diff * diff;
  }
  const brierScore = sumSq / T1_BUCKET_COUNT;

  // Predicted-bucket: argmax of the distribution. For the uniform prior
  // baseline this resolves to bucket 0 (ties broken by index); this is
  // documented behavior, not a bug.
  let predictedBucket = 0;
  let maxP = predictedDistribution[0];
  for (let i = 1; i < T1_BUCKET_COUNT; i++) {
    if (predictedDistribution[i] > maxP) {
      maxP = predictedDistribution[i];
      predictedBucket = i;
    }
  }
  return {
    event_id: event.event_id,
    flare_class_predicted: T1_BUCKETS[predictedBucket],
    flare_class_observed: event.flare_class_observed,
    bucket_predicted: predictedBucket,
    bucket_observed: observedBucket,
    predicted_distribution: [...predictedDistribution],
    brier_score: brierScore,
  };
}

/**
 * Score the full T1 corpus.
 *
 * @param {object[]} events - T1 events from the corpus loader
 * @param {object} [options]
 * @param {number[]} [options.predictedDistribution] - override uniform prior
 * @returns {object} { brier, bucket_calibration, n_events, per_event[] }
 */
export function scoreCorpusT1(events, options = {}) {
  if (!Array.isArray(events)) {
    throw new Error('scoreCorpusT1: events must be an array');
  }
  if (events.length === 0) {
    return {
      brier: 0,
      bucket_calibration: T1_BUCKETS.map(() => 0),
      n_events: 0,
      per_event: [],
      predicted_distribution_used: options.predictedDistribution ?? UNIFORM_PRIOR,
      bucket_labels: [...T1_BUCKETS],
      baseline_model: options.predictedDistribution ? 'caller_supplied' : 'uniform_prior_run_1',
    };
  }
  const dist = options.predictedDistribution ?? UNIFORM_PRIOR;
  const perEvent = events.map((ev) => scoreEventT1(ev, dist));
  const totalBrier = perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length;

  // Bucket calibration (§4.1 secondary metric):
  // For each bucket b, ratio of actual_outcomes_in_b / total_predictions_for_b.
  // For the uniform prior, every event "predicts" every bucket equally, so
  // calibration = (count of observed_b across corpus) / total_events.
  // For non-uniform priors, it's count(observed_b) / sum_events(predicted_p_b * 1).
  const observedCounts = T1_BUCKETS.map(() => 0);
  for (const r of perEvent) observedCounts[r.bucket_observed] += 1;
  const totalPredWeight = perEvent.length; // sum of predicted_p_b across events = N (probabilities sum to 1)
  const bucketCalibration = T1_BUCKETS.map((_, b) => {
    const weighted = perEvent.reduce((s, r) => s + r.predicted_distribution[b], 0);
    if (weighted === 0) return 0;
    // Ratio of observed-in-b to predicted-mass-in-b
    const ratio = observedCounts[b] / weighted;
    // Calibration "agreement" — 1 means perfectly calibrated; clip to [0,1]
    // for reporting per §6 threshold check structure.
    return Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio)));
  });

  return {
    brier: totalBrier,
    bucket_calibration: bucketCalibration,
    n_events: perEvent.length,
    per_event: perEvent,
    predicted_distribution_used: dist,
    bucket_labels: [...T1_BUCKETS],
    baseline_model: options.predictedDistribution ? 'caller_supplied' : 'uniform_prior_run_1',
  };
}

/**
 * §6 verdict: PASS / MARGINAL / FAIL.
 * Compares aggregate Brier + minimum bucket-calibration vs §6 thresholds.
 */
export function verdictT1(aggregate) {
  const { brier, bucket_calibration } = aggregate;
  const minCalibration = bucket_calibration.length === 0 ? 0 : Math.min(...bucket_calibration);
  const t = THRESHOLDS.T1;
  if (brier <= t.pass.brier_max && minCalibration >= t.pass.calibration_min) return 'pass';
  if (brier <= t.marginal.brier_max && minCalibration >= t.marginal.calibration_min) return 'marginal';
  return 'fail';
}

export { T1_BUCKETS, UNIFORM_PRIOR as T1_UNIFORM_PRIOR };
