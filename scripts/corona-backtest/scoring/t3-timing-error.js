/**
 * scripts/corona-backtest/scoring/t3-timing-error.js
 *
 * T3 CME Arrival timing-error scoring (calibration-protocol.md §4.3).
 *
 * Result shape (§4.3.5):
 *   { mae_hours, within_6h_hit_rate,
 *     glancing_blow_within_12h_hit_rate: number | null,
 *     mean_z_score, n_events }
 *
 * Operator hard constraint #5: this module owns its own metric formulas.
 * NO shared scoring code with t1/t2/t4-bucket-brier.js (timing-error is
 * conceptually different from bucket-Brier — sharing would force
 * premature abstraction).
 *
 * Prediction model:
 *   T3 is unique among CORONA's theatres — the prediction is NOT
 *   computed by CORONA; it comes directly from the corpus
 *   (`wsa_enlil_predicted_arrival_time`, populated by NASA DONKI's
 *   WSA-Enlil ensemble). The settlement is the observed L1 shock time.
 *   Sprint 3 scores WSA-Enlil's accuracy against L1 observation; CORONA's
 *   value-add is in wrapping that as evidence with appropriate
 *   uncertainty pricing (which is downstream of T3 settlement).
 *
 * No scoring-layer filtering (§4.3.5):
 *   Every primary-corpus T3 event has a non-null
 *   wsa_enlil_predicted_arrival_time per §3.2 #2 + corpus-loader
 *   enforcement. This module MUST NOT re-implement null-handling — that
 *   is the loader's job.
 *
 * Glancing-blow widening (§4.3.2):
 *   Events with glancing_blow_flag === true score against a ±12h window
 *   for the secondary hit-rate metric only. Primary MAE is computed
 *   without widening — a glancing blow that arrives 10h late still has
 *   a 10h error.
 *
 * z_score (§4.3.3, §4.3.5):
 *   z_score = |t_predicted - t_observed| / sigma_predicted
 *   sigma_predicted comes from corpus's wsa_enlil_sigma_hours when
 *   non-null; else uses the corpus-loader's
 *   T3_NULL_SIGMA_PLACEHOLDER_HOURS (14h, midpoint of literature range).
 *   z_score is supplementary diagnostic only; not in pass/marginal/fail.
 *   This decision (the 14h placeholder) closes Round 2 review residue C7.
 *
 * glancing_blow_within_12h_hit_rate semantics (Round 2 C8):
 *   null = no glancing-blow events in the corpus window.
 *   number in [0, 1] = ratio of glancing-blow events that hit within ±12h.
 *   Document this in run-N/T3-report.md per-event table.
 */

import { THRESHOLDS } from '../config.js';

const HIT_WINDOW_HOURS_PRIMARY = 6;
const HIT_WINDOW_HOURS_GLANCING = 12;
const MS_PER_HOUR = 3600 * 1000;

function parseIsoMs(iso) {
  if (typeof iso !== 'string') return NaN;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

export function scoreEventT3(event) {
  if (event.theatre !== 'T3') {
    throw new Error(`scoreEventT3: expected T3 event, got ${event.theatre}`);
  }
  const tPredictedIso = event.wsa_enlil_predicted_arrival_time;
  const tObservedIso = event.observed_l1_shock_time;
  const tPredictedMs = parseIsoMs(tPredictedIso);
  const tObservedMs = parseIsoMs(tObservedIso);
  if (!Number.isFinite(tPredictedMs) || !Number.isFinite(tObservedMs)) {
    throw new Error(`scoreEventT3: ${event.event_id} has invalid timestamps (predicted=${tPredictedIso}, observed=${tObservedIso})`);
  }

  const errorHours = Math.abs(tPredictedMs - tObservedMs) / MS_PER_HOUR;
  const within6h = errorHours <= HIT_WINDOW_HOURS_PRIMARY;
  const glancingBlow = Boolean(event._derived?.glancing_blow_flag);
  const within12hGlancing = glancingBlow && errorHours <= HIT_WINDOW_HOURS_GLANCING;

  // §4.3.3 z_score using the loader-resolved sigma (corpus value or 14h
  // placeholder). The placeholder choice is documented per-event so the
  // report can flag which events used the fallback.
  const sigmaHours = event._derived?.sigma_hours_effective ?? 14;
  const sigmaSource = event._derived?.sigma_source ?? 'placeholder_14h_per_round_2_C7';
  const zScore = sigmaHours > 0 ? errorHours / sigmaHours : NaN;

  return {
    event_id: event.event_id,
    cme_id: event.cme_id ?? null,
    t_predicted: tPredictedIso,
    t_observed: tObservedIso,
    error_hours: errorHours,
    within_6h: within6h,
    glancing_blow_flag: glancingBlow,
    within_12h_glancing: glancingBlow ? within12hGlancing : null,
    z_score: zScore,
    sigma_hours_used: sigmaHours,
    sigma_source: sigmaSource,
    wsa_enlil_null_flag: false, // protected by loader; always false in primary corpus
    observed_l1_source: event.observed_l1_source ?? null,
  };
}

export function scoreCorpusT3(events) {
  if (!Array.isArray(events)) {
    throw new Error('scoreCorpusT3: events must be an array');
  }
  if (events.length === 0) {
    return {
      mae_hours: 0,
      within_6h_hit_rate: 0,
      glancing_blow_within_12h_hit_rate: null, // §4.3.5 / Round 2 C8 semantics
      mean_z_score: 0,
      n_events: 0,
      per_event: [],
    };
  }
  const perEvent = events.map((ev) => scoreEventT3(ev));

  const mae = perEvent.reduce((s, r) => s + r.error_hours, 0) / perEvent.length;
  const within6hCount = perEvent.filter((r) => r.within_6h).length;
  const within6hRate = within6hCount / perEvent.length;

  // Glancing-blow subset
  const glancingEvents = perEvent.filter((r) => r.glancing_blow_flag);
  const glancingHitRate = glancingEvents.length === 0
    ? null  // Round 2 C8 — null = no glancing-blow events in scored corpus
    : glancingEvents.filter((r) => r.within_12h_glancing).length / glancingEvents.length;

  // Mean z-score across events with finite z (sigma > 0). NaN events excluded.
  const zEvents = perEvent.filter((r) => Number.isFinite(r.z_score));
  const meanZ = zEvents.length === 0
    ? 0
    : zEvents.reduce((s, r) => s + r.z_score, 0) / zEvents.length;

  return {
    mae_hours: mae,
    within_6h_hit_rate: within6hRate,
    glancing_blow_within_12h_hit_rate: glancingHitRate,
    mean_z_score: meanZ,
    n_events: perEvent.length,
    n_glancing_blow_events: glancingEvents.length,
    per_event: perEvent,
  };
}

export function verdictT3(aggregate) {
  const { mae_hours, within_6h_hit_rate } = aggregate;
  const t = THRESHOLDS.T3;
  if (mae_hours <= t.pass.mae_hours_max && within_6h_hit_rate >= t.pass.hit_rate_min) return 'pass';
  if (mae_hours <= t.marginal.mae_hours_max && within_6h_hit_rate >= t.marginal.hit_rate_min) return 'marginal';
  return 'fail';
}

export { HIT_WINDOW_HOURS_PRIMARY, HIT_WINDOW_HOURS_GLANCING };
