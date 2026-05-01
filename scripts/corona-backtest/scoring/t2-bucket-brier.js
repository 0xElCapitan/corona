/**
 * scripts/corona-backtest/scoring/t2-bucket-brier.js
 *
 * T2 Geomagnetic Storm Gate scoring (calibration-protocol.md §4.2).
 *
 * Result shape (§4.2):
 *   { brier, gfz_vs_swpc_convergence, n_events }
 *
 * Operator hard constraint #5: this module owns its own Brier formula,
 * its own bucket boundaries (G0..G5 derived from Kp), its own threshold
 * check. NO shared scoring code with t1/t4-bucket-brier.js. The Brier
 * formula here LOOKS the same as T1 — that's expected; duplication is
 * the lesser evil per SDD §6.4.
 *
 * Run 1 baseline prediction model: same as T1 — uniform prior over the
 * 6 G-scale buckets. Sprint 5 will refit by injecting runtime
 * geomag-gate.js predictions.
 *
 * GFZ-vs-SWPC convergence (§4.2 supplementary): for events with both
 * kp_gfz_observed and kp_swpc_observed populated,
 *   convergence = mean(1 - |kp_gfz - kp_swpc| / 9)
 * Used as a regression-tier sanity check; not part of bucket-Brier.
 *
 * GFZ-lag exclusion (§3.6): events with kp_gfz_observed === null are
 * excluded from regression-tier Brier scoring (loader's
 * regression_tier_eligible flag). They MAY appear in the live tier; we
 * compute Brier on regression-tier-eligible events only.
 */

import { THRESHOLDS } from '../config.js';

const T2_BUCKETS = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
const T2_BUCKET_COUNT = T2_BUCKETS.length;
const UNIFORM_PRIOR = T2_BUCKETS.map(() => 1 / T2_BUCKET_COUNT);

export function scoreEventT2(event, predictedDistribution = UNIFORM_PRIOR) {
  if (event.theatre !== 'T2') {
    throw new Error(`scoreEventT2: expected T2 event, got ${event.theatre}`);
  }
  const observedBucket = event._derived?.bucket_observed;
  if (typeof observedBucket !== 'number' || observedBucket < 0) {
    throw new Error(`scoreEventT2: ${event.event_id} missing _derived.bucket_observed`);
  }
  if (!Array.isArray(predictedDistribution) || predictedDistribution.length !== T2_BUCKET_COUNT) {
    throw new Error(`scoreEventT2: predicted distribution must be length ${T2_BUCKET_COUNT}`);
  }

  let sumSq = 0;
  for (let b = 0; b < T2_BUCKET_COUNT; b++) {
    const obs = b === observedBucket ? 1 : 0;
    const pred = predictedDistribution[b];
    const diff = pred - obs;
    sumSq += diff * diff;
  }
  const brierScore = sumSq / T2_BUCKET_COUNT;

  let predictedBucket = 0;
  let maxP = predictedDistribution[0];
  for (let i = 1; i < T2_BUCKET_COUNT; i++) {
    if (predictedDistribution[i] > maxP) {
      maxP = predictedDistribution[i];
      predictedBucket = i;
    }
  }

  // GFZ↔SWPC delta (per-event sanity input to the aggregate convergence):
  const kpGfz = event.kp_gfz_observed;
  const kpSwpc = event.kp_swpc_observed;
  const gfzSwpcDelta =
    typeof kpGfz === 'number' && typeof kpSwpc === 'number'
      ? Math.abs(kpGfz - kpSwpc)
      : null;

  return {
    event_id: event.event_id,
    kp_swpc_predicted: T2_BUCKETS[predictedBucket],
    kp_gfz_observed: kpGfz,
    kp_swpc_observed: kpSwpc,
    bucket_predicted: predictedBucket,
    bucket_observed: observedBucket,
    predicted_distribution: [...predictedDistribution],
    brier_score: brierScore,
    gfz_swpc_delta: gfzSwpcDelta,
    regression_tier_eligible: event._derived?.regression_tier_eligible ?? false,
  };
}

export function scoreCorpusT2(events, options = {}) {
  if (!Array.isArray(events)) {
    throw new Error('scoreCorpusT2: events must be an array');
  }
  // Per §3.6: regression-tier scoring excludes GFZ-lag events.
  const regressionEvents = events.filter((ev) => ev._derived?.regression_tier_eligible);
  const dist = options.predictedDistribution ?? UNIFORM_PRIOR;
  const perEvent = regressionEvents.map((ev) => scoreEventT2(ev, dist));

  const brier = perEvent.length === 0
    ? 0
    : perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length;

  // GFZ-vs-SWPC convergence: only events with BOTH values present contribute.
  const convergencePairs = perEvent.filter((r) => r.gfz_swpc_delta !== null);
  const convergence = convergencePairs.length === 0
    ? 0
    : convergencePairs.reduce((s, r) => s + (1 - r.gfz_swpc_delta / 9), 0) / convergencePairs.length;

  return {
    brier,
    gfz_vs_swpc_convergence: convergence,
    n_events: perEvent.length,
    n_events_total: events.length,
    n_events_excluded_gfz_lag: events.length - regressionEvents.length,
    per_event: perEvent,
    predicted_distribution_used: dist,
    bucket_labels: [...T2_BUCKETS],
    baseline_model: options.predictedDistribution ? 'caller_supplied' : 'uniform_prior_run_1',
  };
}

export function verdictT2(aggregate) {
  const { brier, gfz_vs_swpc_convergence } = aggregate;
  const t = THRESHOLDS.T2;
  if (brier <= t.pass.brier_max && gfz_vs_swpc_convergence >= t.pass.convergence_min) return 'pass';
  if (brier <= t.marginal.brier_max && gfz_vs_swpc_convergence >= t.marginal.convergence_min) return 'marginal';
  return 'fail';
}

export { T2_BUCKETS, UNIFORM_PRIOR as T2_UNIFORM_PRIOR };
