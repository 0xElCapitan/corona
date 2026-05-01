/**
 * scripts/corona-backtest/scoring/t4-bucket-brier.js
 *
 * T4 Proton Event Cascade S-scale scoring (calibration-protocol.md §4.4).
 *
 * Result shape (§4.4.4):
 *   { brier, bucket_distribution: number[], n_events }
 *
 * Operator hard constraint #5: this module owns its own Brier formula,
 * its own bucket boundaries, its own threshold check. NO shared scoring
 * code with t1/t2-bucket-brier.js. The Brier formula here is structurally
 * identical to T1/T2 — that's expected; duplication is the lesser evil
 * per SDD §6.4.
 *
 * Bucket boundaries (§4.4.2): [0-1, 2-3, 4-6, 7-10, 11+] — pinned at
 * Sprint 2 freeze. Imported from src/theatres/proton-cascade.js
 * (BUCKETS export). Bucket-boundary CONSTANTS are facts, not scoring
 * code; importing a constant from the runtime is permitted and is
 * preferable to hard-coding the same numbers in two places.
 *
 * Run 1 baseline prediction model:
 *   Each event's predicted distribution is a UNIFORM PRIOR over the 5
 *   T4 buckets (1/5 each). This is the no-model floor. Sprint 5 will
 *   refit by injecting runtime proton-cascade.js predictions
 *   (countToBucketProbabilities of the Wheatland-prior expected count).
 */

import { THRESHOLDS } from '../config.js';
import { BUCKETS as RUNTIME_T4_BUCKETS } from '../../../src/theatres/proton-cascade.js';

const T4_BUCKETS = RUNTIME_T4_BUCKETS.map((b) => b.label);
const T4_BUCKET_COUNT = T4_BUCKETS.length;
const UNIFORM_PRIOR = T4_BUCKETS.map(() => 1 / T4_BUCKET_COUNT);

export function scoreEventT4(event, predictedDistribution = UNIFORM_PRIOR) {
  if (event.theatre !== 'T4') {
    throw new Error(`scoreEventT4: expected T4 event, got ${event.theatre}`);
  }
  const observedBucket = event._derived?.bucket_observed;
  if (typeof observedBucket !== 'number' || observedBucket < 0) {
    throw new Error(`scoreEventT4: ${event.event_id} missing _derived.bucket_observed`);
  }
  if (!Array.isArray(predictedDistribution) || predictedDistribution.length !== T4_BUCKET_COUNT) {
    throw new Error(`scoreEventT4: predicted distribution must be length ${T4_BUCKET_COUNT}`);
  }

  let sumSq = 0;
  for (let b = 0; b < T4_BUCKET_COUNT; b++) {
    const obs = b === observedBucket ? 1 : 0;
    const pred = predictedDistribution[b];
    const diff = pred - obs;
    sumSq += diff * diff;
  }
  const brierScore = sumSq / T4_BUCKET_COUNT;

  let predictedBucket = 0;
  let maxP = predictedDistribution[0];
  for (let i = 1; i < T4_BUCKET_COUNT; i++) {
    if (predictedDistribution[i] > maxP) {
      maxP = predictedDistribution[i];
      predictedBucket = i;
    }
  }

  return {
    event_id: event.event_id,
    s_event_count_predicted_distribution: [...predictedDistribution],
    s_event_count_observed: event._derived?.qualifying_event_count_observed_derived ?? null,
    bucket_predicted: predictedBucket,
    bucket_observed: observedBucket,
    bucket_labels: [...T4_BUCKETS],
    brier_score: brierScore,
    qualifying_events: event._derived?.qualifying_events_derived ?? [],
    window_override: event._derived?.window_override ?? false,
    annotation_warning: event._derived?.annotation_warning ?? null,
  };
}

export function scoreCorpusT4(events, options = {}) {
  if (!Array.isArray(events)) {
    throw new Error('scoreCorpusT4: events must be an array');
  }
  const dist = options.predictedDistribution ?? UNIFORM_PRIOR;
  const perEvent = events.map((ev) => scoreEventT4(ev, dist));

  // Aggregate Brier
  const brier = perEvent.length === 0
    ? 0
    : perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length;

  // Bucket distribution: observed-bucket histogram (normalized).
  const observedCounts = T4_BUCKETS.map(() => 0);
  for (const r of perEvent) observedCounts[r.bucket_observed] += 1;
  const bucketDistribution = perEvent.length === 0
    ? observedCounts
    : observedCounts.map((c) => c / perEvent.length);

  // §4.4 secondary metric — bucket calibration (analogous to T1/T2):
  // For each bucket b, agreement between observed-frequency and
  // predicted-mass on that bucket.
  const bucketCalibration = T4_BUCKETS.map((_, b) => {
    const weighted = perEvent.reduce((s, r) => s + r.s_event_count_predicted_distribution[b], 0);
    if (weighted === 0) return 0;
    const ratio = observedCounts[b] / weighted;
    return Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio)));
  });

  return {
    brier,
    bucket_distribution: bucketDistribution,
    bucket_calibration: bucketCalibration,
    n_events: perEvent.length,
    per_event: perEvent,
    predicted_distribution_used: dist,
    bucket_labels: [...T4_BUCKETS],
    baseline_model: options.predictedDistribution ? 'caller_supplied' : 'uniform_prior_run_1',
  };
}

export function verdictT4(aggregate) {
  const { brier, bucket_calibration } = aggregate;
  const minCalibration = bucket_calibration.length === 0 ? 0 : Math.min(...bucket_calibration);
  const t = THRESHOLDS.T4;
  if (brier <= t.pass.brier_max && minCalibration >= t.pass.calibration_min) return 'pass';
  if (brier <= t.marginal.brier_max && minCalibration >= t.marginal.calibration_min) return 'marginal';
  return 'fail';
}

export { T4_BUCKETS, UNIFORM_PRIOR as T4_UNIFORM_PRIOR };
