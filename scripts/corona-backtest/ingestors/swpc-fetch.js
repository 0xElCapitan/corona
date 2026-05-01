/**
 * scripts/corona-backtest/ingestors/swpc-fetch.js
 *
 * SWPC archive fetch helpers for the CORONA backtest harness.
 *
 * Sprint 3 contract:
 *   - fetchXrayDay(yyyymmdd) -> raw GOES X-ray 1-day product as [{...}]
 *   - fetchKpRange({startDate, endDate}) -> raw provisional Kp 3-hour product
 *   - fetchProtonsDay(yyyymmdd) -> raw integral proton ≥10 MeV daily product
 *
 * SWPC products are public, no auth required. We still cache so a Run 1
 * walk doesn't spam services.swpc.noaa.gov on retry.
 *
 * Settlement authority cross-reference (theatre-authority.md):
 *   - GOES/SWPC X-ray IS the live + regression authority for T1.
 *   - SWPC provisional Kp IS the live authority for T2 (regression authority
 *     is GFZ definitive Kp — see gfz-fetch.js).
 *   - GOES integral proton ≥10 MeV IS the live + regression authority for T4.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { CACHE_DIR, SWPC_BASE_URL } from '../config.js';

const SWPC_CACHE_DIR = resolve(CACHE_DIR, 'swpc');

function cacheKey(label, key) {
  const hash = createHash('sha256').update(`${label}::${key}`).digest('hex').slice(0, 16);
  return resolve(SWPC_CACHE_DIR, `${label}-${hash}.json`);
}

async function fetchJson(url, label, key, options = {}) {
  if (!existsSync(SWPC_CACHE_DIR)) {
    mkdirSync(SWPC_CACHE_DIR, { recursive: true });
  }
  const cacheFile = cacheKey(label, key);
  if (!options.bypassCache && existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf8'));
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`swpc-fetch: HTTP ${res.status} on ${label} (${url})`);
  }
  const body = await res.json();
  writeFileSync(cacheFile, JSON.stringify(body, null, 2), 'utf8');
  return body;
}

/**
 * Fetch the GOES X-ray flux 1-day product for the most recent 24h.
 * Returns the raw array of {time_tag, satellite, flux, energy} records.
 *
 * Note: SWPC's archive interface for arbitrary historical days lives at
 * separate endpoints; corpus events from prior years should be sourced
 * from corpus/<event>.json fixtures rather than synthesized at fetch time.
 */
export async function fetchXrayDay(options = {}) {
  const url = `${SWPC_BASE_URL}/json/goes/primary/xrays-1-day.json`;
  return fetchJson(url, 'xrays-1-day', 'primary', options);
}

/**
 * Fetch the provisional Kp index 3-hour product (recent 30 days window).
 */
export async function fetchKpRecent(options = {}) {
  const url = `${SWPC_BASE_URL}/json/planetary_k_index_1m.json`;
  return fetchJson(url, 'kp-1m', 'recent', options);
}

/**
 * Fetch the integral proton ≥10 MeV 1-day product (most recent 24h).
 *
 * Note: T4 settlement uses the ≥10 MeV channel specifically — substring
 * matching against ≥100 MeV would over-count. The runtime regex
 * (src/theatres/proton-cascade.js:298) is the binding for live; the
 * corpus loader applies the same exact match at corpus-load time.
 */
export async function fetchProtonsDay(options = {}) {
  const url = `${SWPC_BASE_URL}/json/goes/primary/integral-protons-1-day.json`;
  return fetchJson(url, 'integral-protons-1-day', 'primary', options);
}
