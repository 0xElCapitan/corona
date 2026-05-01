/**
 * scripts/corona-backtest/ingestors/donki-fetch.js
 *
 * Era-aware DONKI archive ingestor for the CORONA backtest harness.
 *
 * Sprint 3 contract (per SDD §6.3):
 *   fetchEvent(eventType, eventDate, options) ->
 *     { era, raw, normalised } OR throws on rate-limit / 404 / shape unknown
 *   detectEra(eventTimeIso) -> era bucket string
 *   normaliseFLR / normaliseCME / normaliseGST / normaliseIPS
 *
 * The era-detector + per-type normalisers are imported from donki-sanity.js
 * so the production ingestor and the P0 sanity sample share one
 * implementation. (Sprint 3 hard rule: 5/5 sanity-sample passes BEFORE
 * the ingestor build proceeds — verified by donki-sanity.js exit 0.)
 *
 * Auth + throttle posture (PRD §10 R4, SDD §6.6):
 *   - reads NASA_API_KEY from env, falls back to DEMO_KEY with a warning
 *   - throttles below the relevant ceiling (900/hr authenticated,
 *     35/hr DEMO_KEY) by spacing requests
 *   - caches raw responses to scripts/corona-backtest/cache/donki/
 *     keyed by (event-type, query-window) to avoid re-hitting on retry
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import {
  DONKI_BASE_URL,
  CACHE_DIR,
  getNasaApiKey,
  isAuthenticated,
  DONKI_THROTTLE_PER_HOUR_AUTHENTICATED,
  DONKI_THROTTLE_PER_HOUR_DEMO,
} from '../config.js';
import {
  detectEra,
  normalise,
  normaliseFLR,
  normaliseCME,
  normaliseGST,
  normaliseIPS,
} from './donki-sanity.js';

export { detectEra, normaliseFLR, normaliseCME, normaliseGST, normaliseIPS };

const DONKI_CACHE_DIR = resolve(CACHE_DIR, 'donki');
const SUPPORTED_EVENT_TYPES = new Set(['FLR', 'CME', 'GST', 'IPS', 'SEP']);

// Track request timestamps in-process to enforce a soft throttle. The
// harness is single-process and short-lived (a Run 1 walk completes in
// minutes), so an in-memory ring buffer is sufficient.
const requestLog = [];

function throttleCeiling() {
  return isAuthenticated()
    ? DONKI_THROTTLE_PER_HOUR_AUTHENTICATED
    : DONKI_THROTTLE_PER_HOUR_DEMO;
}

async function awaitThrottleSlot() {
  const ceilingPerHour = throttleCeiling();
  const now = Date.now();
  // Drop entries older than 1 hour.
  while (requestLog.length > 0 && now - requestLog[0] > 3_600_000) {
    requestLog.shift();
  }
  if (requestLog.length < ceilingPerHour) return;
  // At ceiling — sleep until oldest entry rolls off.
  const sleepMs = 3_600_000 - (now - requestLog[0]) + 50;
  await new Promise((res) => setTimeout(res, sleepMs));
}

function recordRequest() {
  requestLog.push(Date.now());
}

function cacheKey(eventType, query) {
  const queryNormalized = JSON.stringify(query, Object.keys(query).sort());
  const hash = createHash('sha256').update(queryNormalized).digest('hex').slice(0, 16);
  return resolve(DONKI_CACHE_DIR, `${eventType}-${hash}.json`);
}

async function fetchRaw(eventType, query, options = {}) {
  if (!SUPPORTED_EVENT_TYPES.has(eventType)) {
    throw new Error(`donki-fetch: unsupported event type "${eventType}" (expected one of ${[...SUPPORTED_EVENT_TYPES].join(', ')})`);
  }
  if (!existsSync(DONKI_CACHE_DIR)) {
    mkdirSync(DONKI_CACHE_DIR, { recursive: true });
  }
  const cacheFile = cacheKey(eventType, query);
  if (!options.bypassCache && existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf8'));
  }
  await awaitThrottleSlot();
  const params = new URLSearchParams({ ...query, api_key: getNasaApiKey() });
  const url = `${DONKI_BASE_URL}/${eventType}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  recordRequest();
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(`donki-fetch: HTTP 429 rate-limit on ${eventType} (${JSON.stringify(query)}). Provide NASA_API_KEY or wait.`);
    }
    if (res.status === 404) {
      throw new Error(`donki-fetch: HTTP 404 on ${eventType} (${JSON.stringify(query)})`);
    }
    throw new Error(`donki-fetch: HTTP ${res.status} on ${eventType}`);
  }
  const body = await res.json();
  writeFileSync(cacheFile, JSON.stringify(body, null, 2), 'utf8');
  return body;
}

/**
 * Fetch and normalise a DONKI event window.
 *
 * @param {'FLR'|'CME'|'GST'|'IPS'} eventType
 * @param {{ startDate: string, endDate: string }} dateWindow ISO YYYY-MM-DD
 * @param {object} [options]
 * @param {boolean} [options.bypassCache] - skip cache layer
 * @param {number} [options.pickIndex] - which array element to normalise (default 0)
 * @returns {Promise<{era: string, raw: object[], normalised: object|null}>}
 */
export async function fetchEvent(eventType, dateWindow, options = {}) {
  if (!dateWindow || !dateWindow.startDate || !dateWindow.endDate) {
    throw new Error('fetchEvent: dateWindow.startDate + endDate are required');
  }
  const raw = await fetchRaw(eventType, dateWindow, options);
  if (!Array.isArray(raw)) {
    throw new Error(`fetchEvent: expected array response from DONKI ${eventType}, got ${typeof raw}`);
  }
  if (raw.length === 0) {
    return { era: 'unknown', raw, normalised: null };
  }
  const idx = options.pickIndex ?? 0;
  if (idx < 0 || idx >= raw.length) {
    throw new Error(`fetchEvent: pickIndex ${idx} out of range (0..${raw.length - 1})`);
  }
  const record = raw[idx];
  const eventTimeIso =
    eventType === 'FLR' ? record.beginTime
      : eventType === 'CME' ? record.startTime
        : eventType === 'GST' ? record.startTime
          : eventType === 'IPS' ? record.eventTime
            : null;
  const era = detectEra(eventTimeIso);
  const normalised = normalise(eventType, [record], era);
  return { era, raw, normalised };
}
