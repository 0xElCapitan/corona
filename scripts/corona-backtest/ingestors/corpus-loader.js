/**
 * scripts/corona-backtest/ingestors/corpus-loader.js
 *
 * Reads the primary corpus tree at grimoires/loa/calibration/corona/corpus/
 * and validates each event file against the §3.7 corpus annotation schema
 * defined in calibration-protocol.md.
 *
 * Sprint 3 (corona-1ks) deliverable. Closes Round 2 review residue C6:
 * derived-at-load-time fields (bucket_observed, glancing_blow_flag,
 * g_scale_observed, qualifying_event_count_observed) are computed here,
 * not at scoring time.
 *
 * Hard rules:
 *   - Schema violations REJECT the event (do not silently coerce). The
 *     scoring layer must NEVER see a malformed event — that is the
 *     loader's contract per §4.3.5 "no scoring-layer filtering".
 *   - T3 events with `wsa_enlil_predicted_arrival_time === null` are
 *     primary-corpus-INELIGIBLE per §3.2 #2 — the loader REJECTS them
 *     with a clear error. (Round 2 fix.)
 *   - T5 events without all four required arrays
 *     (divergence_signals, corroborating_alerts, stale_feed_events,
 *      satellite_switch_events) are REJECTED. Empty arrays are allowed
 *     (per §3.7.6 explicit permission).
 *   - T4 events without a 72-hour prediction_window_hours are flagged
 *     as overrides per §4.4.0 — the loader does not reject (operator may
 *     have authored a non-default window for a special-case event), but
 *     surfaces the override so the per-theatre report can flag it.
 *
 * The loader returns a structured result; the harness decides whether to
 * halt-on-error, emit a per-theatre warning bundle, or continue.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

import { CORPUS_SUBDIRS, THEATRES, resolveCorpusDir } from '../config.js';
import {
  S_SCALE_THRESHOLDS_PFU,
  SEP_DEDUP_WINDOW_MINUTES,
} from '../../../src/theatres/proton-cascade.js';

// =====================================================================
// Schema rules (§3.7) — common envelope + per-theatre extensions.
// =====================================================================

const COMMON_FIELDS = ['event_id', 'theatre', 'tier', 'event_time', 'goes_satellite'];

// donki_record_ref MAY be null only for T5 (per §3.7.1).
function validateCommonEnvelope(event, file) {
  const errors = [];
  for (const f of COMMON_FIELDS) {
    if (!(f in event)) {
      errors.push(`missing required field "${f}"`);
    }
  }
  if (event.tier && !['primary', 'secondary'].includes(event.tier)) {
    errors.push(`tier must be "primary" or "secondary" (got "${event.tier}")`);
  }
  if (event.theatre && !THEATRES.includes(event.theatre)) {
    errors.push(`theatre must be one of ${THEATRES.join(',')} (got "${event.theatre}")`);
  }
  if (!('donki_record_ref' in event)) {
    errors.push('missing required field "donki_record_ref" (use null only for T5)');
  } else if (event.donki_record_ref === null && event.theatre !== 'T5') {
    errors.push(`donki_record_ref: null only permitted for T5; theatre is ${event.theatre}`);
  }
  if (errors.length) {
    return { ok: false, errors: errors.map((e) => `${basename(file)}: ${e}`) };
  }
  return { ok: true };
}

// =====================================================================
// T1 — flare_class_observed → bucket index
// =====================================================================

// T1 buckets follow the runtime flare-gate scaffold: A/B/C below trigger;
// M-class buckets resolved on the M-letter; X-class collapsed to X+.
// Six-bucket scheme (matching src/theatres/flare-gate.js intent).
const T1_BUCKETS = ['<M', 'M1-M4', 'M5-M9', 'X1-X4', 'X5-X9', 'X10+'];

export function classifyFlareToBucket(classString) {
  if (typeof classString !== 'string' || classString.length === 0) return -1;
  const letter = classString[0].toUpperCase();
  const numStr = classString.slice(1);
  const num = Number.parseFloat(numStr);
  if (letter === 'A' || letter === 'B' || letter === 'C') return 0;
  if (letter === 'M') {
    if (!Number.isFinite(num)) return 1;
    if (num >= 5) return 2;
    return 1;
  }
  if (letter === 'X') {
    if (!Number.isFinite(num)) return 3;
    if (num >= 10) return 5;
    if (num >= 5) return 4;
    return 3;
  }
  return -1;
}

function validateT1(event, file) {
  const errors = [];
  for (const f of [
    'flare_class_observed',
    'flare_peak_time',
    'flare_peak_xray_flux',
    'flare_end_time',
    'donki_flr_class_type',
    'prediction_window_hours',
  ]) {
    if (!(f in event)) errors.push(`missing T1 field "${f}"`);
  }
  if (errors.length) return { ok: false, errors: errors.map((e) => `${basename(file)}: ${e}`) };
  const bucket = classifyFlareToBucket(event.flare_class_observed);
  if (bucket < 0) {
    return { ok: false, errors: [`${basename(file)}: unrecognised flare class "${event.flare_class_observed}"`] };
  }
  return { ok: true, derived: { bucket_observed: bucket, bucket_labels: [...T1_BUCKETS] } };
}

// =====================================================================
// T2 — Kp → G-scale → bucket
// =====================================================================

const T2_BUCKETS = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];

export function kpToGScaleIndex(kp) {
  if (typeof kp !== 'number' || !Number.isFinite(kp)) return -1;
  if (kp < 5) return 0;     // G0
  if (kp < 6) return 1;     // G1 (Kp 5)
  if (kp < 7) return 2;     // G2 (Kp 6)
  if (kp < 8) return 3;     // G3 (Kp 7)
  if (kp < 9) return 4;     // G4 (Kp 8)
  return 5;                 // G5 (Kp 9)
}

function validateT2(event, file) {
  const errors = [];
  for (const f of ['kp_swpc_observed', 'kp_window_start', 'kp_window_end', 'donki_gst_id']) {
    if (!(f in event)) errors.push(`missing T2 field "${f}"`);
  }
  if (!('kp_gfz_observed' in event)) {
    errors.push('missing T2 field "kp_gfz_observed" (use null only when GFZ-lag-excluded; such events are not regression-tier eligible)');
  }
  if (errors.length) return { ok: false, errors: errors.map((e) => `${basename(file)}: ${e}`) };
  const kpForBucket = event.kp_gfz_observed ?? event.kp_swpc_observed;
  const bucket = kpToGScaleIndex(kpForBucket);
  if (bucket < 0) {
    return { ok: false, errors: [`${basename(file)}: unrecognised Kp value (gfz=${event.kp_gfz_observed}, swpc=${event.kp_swpc_observed})`] };
  }
  return {
    ok: true,
    derived: {
      bucket_observed: bucket,
      bucket_labels: [...T2_BUCKETS],
      g_scale_observed: T2_BUCKETS[bucket],
      // Regression-tier-eligible only when GFZ definitive is present.
      regression_tier_eligible: event.kp_gfz_observed != null,
    },
  };
}

// =====================================================================
// T3 — WSA-Enlil non-null check + glancing-blow flag
// =====================================================================

const T3_GLANCING_HALO_THRESHOLD_DEGREES = 45;
// §4.3.3 supplementary-diagnostic z_score: when wsa_enlil_sigma_hours is
// null, the harness picks a deterministic placeholder so the diagnostic
// remains computable. Sprint 4 (corona-2zs) provides the literature prior;
// 14h is the midpoint of the 10-18h BFZ-cited range and is documented in
// run-N/T3-report.md per Round 2 review residue C7.
export const T3_NULL_SIGMA_PLACEHOLDER_HOURS = 14;

function validateT3(event, file) {
  const errors = [];
  for (const f of ['cme_id', 'wsa_enlil_predicted_arrival_time', 'wsa_enlil_halo_angle_degrees', 'observed_l1_shock_time', 'observed_l1_source']) {
    if (!(f in event)) errors.push(`missing T3 field "${f}"`);
  }
  if (errors.length) return { ok: false, errors: errors.map((e) => `${basename(file)}: ${e}`) };
  if (event.wsa_enlil_predicted_arrival_time === null) {
    return {
      ok: false,
      errors: [
        `${basename(file)}: T3 event with wsa_enlil_predicted_arrival_time=null is NOT primary-corpus eligible (calibration-protocol.md §3.2 #2 T3). Move to secondary tier or remove.`,
      ],
    };
  }
  const halo = event.wsa_enlil_halo_angle_degrees;
  const glancingBlow = typeof halo === 'number' && halo >= T3_GLANCING_HALO_THRESHOLD_DEGREES;
  return {
    ok: true,
    derived: {
      glancing_blow_flag: glancingBlow,
      sigma_hours_effective:
        typeof event.wsa_enlil_sigma_hours === 'number'
          ? event.wsa_enlil_sigma_hours
          : T3_NULL_SIGMA_PLACEHOLDER_HOURS,
      sigma_source:
        typeof event.wsa_enlil_sigma_hours === 'number'
          ? 'corpus_value'
          : 'placeholder_14h_per_round_2_C7',
    },
  };
}

// =====================================================================
// T4 — proton flux observations + qualifying-event derivation
// =====================================================================

// Strict ≥10 MeV channel match — mirrors src/theatres/proton-cascade.js:298
// to avoid the substring collision with ≥100 MeV that bundles.js's
// above_s1 heuristic suffers from. The runtime exports the regex implicitly
// through the proxy retirement; we replicate the literal pattern here so
// the corpus loader is self-contained.
const T4_TEN_MEV_REGEX = /(?:^|\D)10\s*MeV\b/i;

function deriveT4QualifyingEvents(observations) {
  // Per §4.4.1: filter to ≥10 MeV channel, threshold via S_SCALE_THRESHOLDS_PFU.S1
  // (10 pfu), apply 30-min SEP dedup window from the most recent counted event.
  const sorted = [...observations].sort((a, b) => {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });
  const out = [];
  let lastTime = null;
  for (const obs of sorted) {
    if (typeof obs.peak_pfu !== 'number') continue;
    if (typeof obs.energy_channel !== 'string' || !T4_TEN_MEV_REGEX.test(obs.energy_channel)) continue;
    if (obs.peak_pfu < S_SCALE_THRESHOLDS_PFU.S1) continue;
    const t = new Date(obs.time).getTime();
    if (!Number.isFinite(t)) continue;
    if (lastTime != null && (t - lastTime) / 60_000 < SEP_DEDUP_WINDOW_MINUTES) continue;
    out.push({ time: obs.time, peak_pfu: obs.peak_pfu, energy_channel: obs.energy_channel, satellite: obs.satellite ?? null });
    lastTime = t;
  }
  return out;
}

const T4_BUCKETS_RUNTIME = [
  { label: '0-1', min: 0, max: 1 },
  { label: '2-3', min: 2, max: 3 },
  { label: '4-6', min: 4, max: 6 },
  { label: '7-10', min: 7, max: 10 },
  { label: '11+', min: 11, max: Infinity },
];

export function countToT4Bucket(count) {
  for (let i = 0; i < T4_BUCKETS_RUNTIME.length; i++) {
    const { min, max } = T4_BUCKETS_RUNTIME[i];
    if (count >= min && count <= max) return i;
  }
  return T4_BUCKETS_RUNTIME.length - 1;
}

function validateT4(event, file) {
  const errors = [];
  for (const f of ['trigger_flare_class', 'trigger_flare_peak_time', 'prediction_window_hours', 'proton_flux_observations']) {
    if (!(f in event)) errors.push(`missing T4 field "${f}"`);
  }
  if (errors.length) return { ok: false, errors: errors.map((e) => `${basename(file)}: ${e}`) };
  if (!Array.isArray(event.proton_flux_observations)) {
    return { ok: false, errors: [`${basename(file)}: T4 proton_flux_observations must be an array`] };
  }
  const qualifying = deriveT4QualifyingEvents(event.proton_flux_observations);
  const count = qualifying.length;
  const bucket = countToT4Bucket(count);
  // §4.4.0 override surfacing — primary-corpus events MUST be windowed at 72h.
  // We do not REJECT a non-72 window because operator-authored override is
  // permitted per §4.4.0 ("requires manifest entry"), but the harness flags it
  // for the per-theatre report.
  const windowOverride = event.prediction_window_hours !== 72;
  // Annotation sanity check (NOT used by scoring): if the corpus author
  // pre-computed qualifying_event_count_observed, surface a warning when it
  // disagrees with the harness's derivation. Per §3.7.5 the count is
  // "computed at corpus-load time as a sanity check, NOT used directly by
  // scoring (scoring re-derives from proton_flux_observations)."
  let annotationWarning = null;
  if (typeof event.qualifying_event_count_observed === 'number'
      && event.qualifying_event_count_observed !== count) {
    annotationWarning = `qualifying_event_count_observed=${event.qualifying_event_count_observed} disagrees with derived count ${count}`;
  }
  return {
    ok: true,
    derived: {
      qualifying_events_derived: qualifying,
      qualifying_event_count_observed_derived: count,
      bucket_observed: bucket,
      bucket_labels: T4_BUCKETS_RUNTIME.map((b) => b.label),
      window_override: windowOverride,
      annotation_warning: annotationWarning,
    },
  };
}

// =====================================================================
// T5 — four required arrays
// =====================================================================

const T5_REQUIRED_ARRAYS = [
  'divergence_signals',
  'corroborating_alerts',
  'stale_feed_events',
  'satellite_switch_events',
];

function validateT5(event, file) {
  const errors = [];
  for (const f of ['detection_window_start', 'detection_window_end']) {
    if (!(f in event)) errors.push(`missing T5 field "${f}"`);
  }
  for (const arr of T5_REQUIRED_ARRAYS) {
    if (!(arr in event)) {
      errors.push(`missing T5 array "${arr}" (empty array permitted per §3.7.6, but field must be present)`);
    } else if (!Array.isArray(event[arr])) {
      errors.push(`T5 field "${arr}" must be an array`);
    }
  }
  if (!('anomaly_bulletin_refs' in event)) {
    // anomaly_bulletin_refs is documented as "Empty array permitted"; the
    // FIELD itself is required. We default it to [] for the diagnostic-only
    // hit_rate computation per §4.5.2.
  } else if (!Array.isArray(event.anomaly_bulletin_refs)) {
    errors.push('T5 field "anomaly_bulletin_refs" must be an array (or omitted)');
  }
  // Sprint 6 / C-006 (Sprint 3 LOW-1 carry-forward): reject stale_feed_events
  // entries where detection_time precedes actual_onset_time. The schema
  // (calibration-protocol.md §3.7.6) defines latency_seconds as
  // `detection_time - actual_onset_time`, which must be ≥ 0 by physical
  // semantics (detection cannot precede the underlying onset). Without this
  // guard, a corpus-authoring error silently slips through to scoring where
  // t5-quality-of-behavior.js:183 clamps via Math.max(0, …) — masking the
  // error. Hard constraint #9 forbids changing scoring; the fix is loader
  // tightening per Sprint 6 handoff §6.5 option A.
  if (Array.isArray(event.stale_feed_events)) {
    for (let i = 0; i < event.stale_feed_events.length; i++) {
      const entry = event.stale_feed_events[i];
      if (entry == null) continue;
      const onsetMs = entry.actual_onset_time != null
        ? new Date(entry.actual_onset_time).getTime() : null;
      const detectMs = entry.detection_time != null
        ? new Date(entry.detection_time).getTime() : null;
      if (Number.isFinite(onsetMs) && Number.isFinite(detectMs) && detectMs < onsetMs) {
        errors.push(
          `stale_feed_events[${i}]: detection_time (${entry.detection_time}) precedes actual_onset_time (${entry.actual_onset_time}); negative latency violates §3.7.6 schema invariant`
        );
      }
    }
  }
  if (errors.length) return { ok: false, errors: errors.map((e) => `${basename(file)}: ${e}`) };
  return { ok: true, derived: { anomaly_bulletin_refs: event.anomaly_bulletin_refs ?? [] } };
}

// =====================================================================
// Per-theatre dispatch.
// =====================================================================

const VALIDATORS = {
  T1: validateT1,
  T2: validateT2,
  T3: validateT3,
  T4: validateT4,
  T5: validateT5,
};

function loadEventFile(file) {
  let body;
  try {
    body = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    return { ok: false, errors: [`${basename(file)}: invalid JSON — ${err.message}`] };
  }
  const envelope = validateCommonEnvelope(body, file);
  if (!envelope.ok) return envelope;
  const validator = VALIDATORS[body.theatre];
  if (!validator) {
    return { ok: false, errors: [`${basename(file)}: unsupported theatre "${body.theatre}"`] };
  }
  const theatreResult = validator(body, file);
  if (!theatreResult.ok) return theatreResult;
  // Compose the loaded event with derived fields. Source fields are preserved.
  return {
    ok: true,
    event: { ...body, _derived: theatreResult.derived ?? {}, _file: file },
  };
}

/**
 * Load all primary-corpus events from a corpus root directory.
 *
 * @param {string} [corpusDir] - default resolveCorpusDir()
 * @param {{theatres?: string[]}} [options]
 * @returns {{ events: Record<string, object[]>, errors: string[], stats: Record<string, {loaded:number, rejected:number}> }}
 */
export function loadCorpus(corpusDir, options = {}) {
  const root = resolveCorpusDir(corpusDir);
  const wantedTheatres = options.theatres ?? THEATRES;
  const events = {};
  const errors = [];
  const stats = {};
  for (const theatre of wantedTheatres) {
    events[theatre] = [];
    stats[theatre] = { loaded: 0, rejected: 0 };
    const subdir = resolve(root, CORPUS_SUBDIRS[theatre]);
    if (!existsSync(subdir)) {
      // Empty theatre subdir — surface as info; not a hard error so a sprint
      // can ship partial coverage.
      errors.push(`${theatre}: corpus subdir does not exist (${subdir})`);
      continue;
    }
    const files = readdirSync(subdir).filter((n) => n.endsWith('.json'));
    for (const name of files) {
      const file = resolve(subdir, name);
      if (!statSync(file).isFile()) continue;
      const result = loadEventFile(file);
      if (!result.ok) {
        stats[theatre].rejected += 1;
        errors.push(...result.errors);
        continue;
      }
      const ev = result.event;
      if (ev.theatre !== theatre) {
        stats[theatre].rejected += 1;
        errors.push(`${name}: filename theatre subdir is ${theatre} but event.theatre is ${ev.theatre}`);
        continue;
      }
      events[theatre].push(ev);
      stats[theatre].loaded += 1;
    }
  }
  return { events, errors, stats };
}

// Re-export internals for unit-test access.
export {
  validateCommonEnvelope as _validateCommonEnvelope,
  validateT1 as _validateT1,
  validateT2 as _validateT2,
  validateT3 as _validateT3,
  validateT4 as _validateT4,
  validateT5 as _validateT5,
  loadEventFile as _loadEventFile,
  deriveT4QualifyingEvents as _deriveT4QualifyingEvents,
  T1_BUCKETS,
  T2_BUCKETS,
  T4_BUCKETS_RUNTIME,
};
