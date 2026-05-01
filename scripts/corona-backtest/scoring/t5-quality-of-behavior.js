/**
 * scripts/corona-backtest/scoring/t5-quality-of-behavior.js
 *
 * T5 Solar Wind Divergence quality-of-behavior scoring
 * (calibration-protocol.md §4.5).
 *
 * Result shape (§4.5.3):
 *   { fp_rate, stale_feed_p50_seconds, stale_feed_p95_seconds,
 *     satellite_switch_handled_rate, hit_rate_diagnostic,
 *     n_signals, n_stale_events, n_switches }
 *
 * Operator hard constraint #5: this module owns its own metric formulas.
 * NO shared scoring code with t1/t2/t4-bucket-brier.js or t3-timing-error.js.
 *
 * T5 has no external ground truth — settlement is internal (DSCOVR-ACE Bz
 * divergence with sustained streak detection). Sprint 2 binds
 * quality-of-behavior metrics that capture whether T5 is doing its job
 * correctly, not whether it "predicts the future".
 *
 * Three primary metrics per §4.5.1:
 *   a) FP rate: false-positive divergence signals (resolved within 60 min
 *      AND no external corroboration). 60-min corroboration window matches
 *      typical NOAA SWPC alert latency.
 *   b) Stale-feed detection latency: p50 and p95 in seconds.
 *   c) Satellite-switch behavior: handled = pause + annotate +
 *      no spurious signal in first 10 min post-switch. The pause window
 *      is the corpus-supplied transition_end_time (defaulting to 15 min
 *      from switch_time per §4.5.1.c — corpus loader does not enforce a
 *      default; this scoring module reads what the corpus provides).
 *
 * Diagnostic metric (§4.5.2):
 *   hit_rate_diagnostic = matches against anomaly_bulletin_refs.
 *   NOT in pass/marginal/fail composite (§6) — surfaces in T5-report.md
 *   for transparency and Sprint 4 cross-reference.
 */

import { THRESHOLDS } from '../config.js';

const FP_CORROBORATION_WINDOW_MINUTES = 60;
const SWITCH_POST_QUIET_WINDOW_MINUTES = 10;
const MS_PER_MINUTE = 60_000;

function parseIsoMs(iso) {
  if (typeof iso !== 'string') return NaN;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

function isWithinMs(reference, target, windowMinutes) {
  const ref = parseIsoMs(reference);
  const tgt = parseIsoMs(target);
  if (!Number.isFinite(ref) || !Number.isFinite(tgt)) return false;
  return Math.abs(ref - tgt) <= windowMinutes * MS_PER_MINUTE;
}

/**
 * Classify a single divergence signal as false-positive or true-positive.
 *
 * §4.5.1.a: a signal is FP when:
 *   - it resolves within 60 minutes of raise time AND
 *   - no satellite-switch event within the 60-min window AND
 *   - no NOAA SWPC alert / DONKI IPS or GST corroboration within the
 *     60-min window
 */
function classifySignal(signal, satelliteSwitchEvents, corroboratingAlerts) {
  const raisedMs = parseIsoMs(signal.signal_time);
  const resolvedIso = signal.signal_resolution_time;
  const resolvedMs = resolvedIso == null ? null : parseIsoMs(resolvedIso);

  // First gate: did the signal resolve within 60 minutes?
  let resolvedQuickly = false;
  if (resolvedMs != null && Number.isFinite(resolvedMs) && Number.isFinite(raisedMs)) {
    resolvedQuickly = (resolvedMs - raisedMs) <= FP_CORROBORATION_WINDOW_MINUTES * MS_PER_MINUTE
      && (resolvedMs - raisedMs) >= 0;
  }
  if (!resolvedQuickly) {
    return { false_positive: false, reason: 'persisted_or_unresolved_at_60min' };
  }

  // Second gate: any satellite switch within 60 min?
  const switchMatch = satelliteSwitchEvents.some((sw) =>
    isWithinMs(signal.signal_time, sw.switch_time, FP_CORROBORATION_WINDOW_MINUTES),
  );
  if (switchMatch) {
    return { false_positive: false, reason: 'satellite_switch_within_60min' };
  }

  // Third gate: any corroborating alert within 60 min?
  const alertMatch = corroboratingAlerts.some((alert) =>
    isWithinMs(signal.signal_time, alert.signal_time ?? alert.time, FP_CORROBORATION_WINDOW_MINUTES),
  );
  if (alertMatch) {
    return { false_positive: false, reason: 'corroborated_within_60min' };
  }

  // Resolved fast + no switch + no corroboration → false positive.
  return { false_positive: true, reason: 'resolved_fast_no_corroboration' };
}

function classifySwitchHandled(sw, divergenceSignals) {
  // §4.5.1.c: handled when pause + annotate + no spurious signal in
  // first 10 min post-switch.
  // Without a runtime trace we can only check the third criterion against
  // the corpus signals — i.e., "is there a divergence signal raised within
  // 10 min after the switch_time?".
  const switchMs = parseIsoMs(sw.switch_time);
  if (!Number.isFinite(switchMs)) {
    return { handled: false, reason: 'invalid_switch_time' };
  }
  const spurious = divergenceSignals.find((sig) => {
    const sigMs = parseIsoMs(sig.signal_time);
    if (!Number.isFinite(sigMs)) return false;
    const deltaMin = (sigMs - switchMs) / MS_PER_MINUTE;
    if (deltaMin < 0 || deltaMin > SWITCH_POST_QUIET_WINDOW_MINUTES) return false;
    // A signal that's marked false_positive_label=true in corpus is
    // explicitly a spurious one — counts against handled. A signal not
    // labeled FP that happens to fall in the window is NOT counted as
    // spurious here; it may be a real divergence the switch happened
    // alongside. The corpus author owns the classification.
    return Boolean(sig.false_positive_label);
  });
  return {
    handled: spurious == null,
    reason: spurious == null ? 'no_spurious_signal_in_post_quiet_window' : `spurious_fp_signal_at_${spurious.signal_time}`,
  };
}

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const rank = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sortedAsc[lo];
  const frac = rank - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

export function scoreEventT5(event) {
  if (event.theatre !== 'T5') {
    throw new Error(`scoreEventT5: expected T5 event, got ${event.theatre}`);
  }
  const signals = Array.isArray(event.divergence_signals) ? event.divergence_signals : [];
  const corroboratingAlerts = Array.isArray(event.corroborating_alerts) ? event.corroborating_alerts : [];
  const staleEvents = Array.isArray(event.stale_feed_events) ? event.stale_feed_events : [];
  const switches = Array.isArray(event.satellite_switch_events) ? event.satellite_switch_events : [];
  const bulletinRefs = Array.isArray(event._derived?.anomaly_bulletin_refs)
    ? event._derived.anomaly_bulletin_refs
    : (Array.isArray(event.anomaly_bulletin_refs) ? event.anomaly_bulletin_refs : []);

  // Per-signal FP classification
  const signalRecords = signals.map((sig) => {
    const cls = classifySignal(sig, switches, corroboratingAlerts);
    return {
      signal_time: sig.signal_time,
      signal_resolution_time: sig.signal_resolution_time ?? null,
      corpus_fp_label: Boolean(sig.false_positive_label),
      computed_false_positive: cls.false_positive,
      classification_reason: cls.reason,
      anomaly_classification: sig.anomaly_classification ?? null,
    };
  });
  const fpCount = signalRecords.filter((r) => r.computed_false_positive).length;

  // Stale-feed latencies in seconds. We MUST preserve indices/identity
  // between staleEvents[i] and the computed result — the per-event report
  // joins them by source order, and filtering invalid entries before the
  // join would silently misalign the latency for any event that follows
  // an invalid one. Each record carries its source index + raw fields so
  // the per-event report block at lines 218-225 can emit typed entries
  // with `latency_seconds: null` for invalid input rather than the
  // following event's latency.
  const staleRecords = staleEvents.map((s, sourceIndex) => {
    const onset = parseIsoMs(s.actual_onset_time);
    const detect = parseIsoMs(s.detection_time);
    const valid = Number.isFinite(onset) && Number.isFinite(detect);
    return {
      source_index: sourceIndex,
      actual_onset_time: s.actual_onset_time ?? null,
      detection_time: s.detection_time ?? null,
      end_time: s.end_time ?? null,
      satellite: s.satellite ?? null,
      latency_seconds: valid ? Math.max(0, (detect - onset) / 1000) : null,
    };
  });

  // Switch-handled classification
  const switchRecords = switches.map((sw) => {
    const cls = classifySwitchHandled(sw, signals);
    return {
      switch_time: sw.switch_time,
      from: sw.from ?? null,
      to: sw.to ?? null,
      reason: sw.reason ?? null,
      transition_end_time: sw.transition_end_time ?? null,
      handled: cls.handled,
      handling_note: cls.reason,
    };
  });

  // Diagnostic hit rate (§4.5.2):
  // For each anomaly bulletin, check whether T5 raised at least one signal
  // within the bulletin's time window.
  const bulletinHits = bulletinRefs.map((b) => {
    const startMs = parseIsoMs(b.time_window_start);
    const endMs = parseIsoMs(b.time_window_end);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { bulletin_id: b.bulletin_id ?? null, hit: false, reason: 'invalid_window' };
    }
    const matched = signals.find((sig) => {
      const sigMs = parseIsoMs(sig.signal_time);
      return Number.isFinite(sigMs) && sigMs >= startMs && sigMs <= endMs;
    });
    return {
      bulletin_id: b.bulletin_id ?? null,
      classification: b.classification ?? null,
      hit: matched != null,
      hit_signal_time: matched?.signal_time ?? null,
    };
  });

  return {
    event_id: event.event_id,
    detection_window_start: event.detection_window_start,
    detection_window_end: event.detection_window_end,
    signal_count: signalRecords.length,
    signals: signalRecords,
    false_positive_count: fpCount,
    // staleRecords preserves the source order of staleEvents 1:1 — the i-th
    // staleRecord corresponds to staleEvents[i], invalid entries surface as
    // latency_seconds: null. The aggregate p50/p95 filters nulls at the call
    // site (scoreCorpusT5 below) so a single malformed entry does not pollute
    // the percentile.
    stale_feed_events: staleRecords,
    stale_feed_count: staleRecords.length,
    stale_latencies_sec: staleRecords.map((r) => r.latency_seconds),
    switches: switchRecords,
    switch_count: switchRecords.length,
    bulletin_hits: bulletinHits,
    hit_rate_diagnostic_count: bulletinHits.filter((b) => b.hit).length,
    bulletin_count: bulletinRefs.length,
  };
}

export function scoreCorpusT5(events) {
  if (!Array.isArray(events)) {
    throw new Error('scoreCorpusT5: events must be an array');
  }
  const perEvent = events.map((ev) => scoreEventT5(ev));

  const totalSignals = perEvent.reduce((s, r) => s + r.signal_count, 0);
  const totalFp = perEvent.reduce((s, r) => s + r.false_positive_count, 0);
  const fpRate = totalSignals === 0 ? 0 : totalFp / totalSignals;

  // stale_latencies_sec may contain nulls for malformed timestamps after
  // the CI-1 / Round 2 fix; filter at the percentile call site so the
  // p50/p95 reflects only valid latencies. The null count surfaces in the
  // per-event report so reviewers can see how many entries were dropped.
  const allLatencies = perEvent
    .flatMap((r) => r.stale_latencies_sec)
    .filter((v) => v != null)
    .sort((a, b) => a - b);
  const totalStale = allLatencies.length;
  const stalep50 = percentile(allLatencies, 50);
  const stalep95 = percentile(allLatencies, 95);

  const allSwitches = perEvent.flatMap((r) => r.switches);
  const totalSwitches = allSwitches.length;
  const handledSwitches = allSwitches.filter((s) => s.handled).length;
  const switchHandledRate = totalSwitches === 0 ? 1 : handledSwitches / totalSwitches;

  const totalBulletins = perEvent.reduce((s, r) => s + r.bulletin_count, 0);
  const totalHits = perEvent.reduce((s, r) => s + r.hit_rate_diagnostic_count, 0);
  const hitRateDiagnostic = totalBulletins === 0 ? 0 : totalHits / totalBulletins;

  return {
    fp_rate: fpRate,
    stale_feed_p50_seconds: stalep50,
    stale_feed_p95_seconds: stalep95,
    satellite_switch_handled_rate: switchHandledRate,
    hit_rate_diagnostic: hitRateDiagnostic,
    n_signals: totalSignals,
    n_stale_events: totalStale,
    n_switches: totalSwitches,
    n_bulletins: totalBulletins,
    n_events: perEvent.length,
    per_event: perEvent,
  };
}

export function verdictT5(aggregate) {
  const { fp_rate, stale_feed_p50_seconds, satellite_switch_handled_rate } = aggregate;
  const t = THRESHOLDS.T5;
  if (
    fp_rate <= t.pass.fp_rate_max
    && stale_feed_p50_seconds <= t.pass.stale_p50_max_seconds
    && satellite_switch_handled_rate >= t.pass.switch_handled_min
  ) return 'pass';
  if (
    fp_rate <= t.marginal.fp_rate_max
    && stale_feed_p50_seconds <= t.marginal.stale_p50_max_seconds
    && satellite_switch_handled_rate >= t.marginal.switch_handled_min
  ) return 'marginal';
  return 'fail';
}

export {
  FP_CORROBORATION_WINDOW_MINUTES,
  SWITCH_POST_QUIET_WINDOW_MINUTES,
};
