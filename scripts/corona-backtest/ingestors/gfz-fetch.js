/**
 * scripts/corona-backtest/ingestors/gfz-fetch.js
 *
 * GFZ Potsdam definitive Kp helper for T2 regression-tier scoring.
 *
 * Authority context (theatre-authority.md §T2):
 *   GFZ definitive Kp is the REGRESSION authority for T2. SWPC provisional
 *   Kp is LIVE; GFZ publishes with a ~30-day lag and is the ground truth
 *   for backtest. The corpus loader rejects T2 events newer than the GFZ
 *   publication frontier from the regression tier per §3.6 GFZ-lag exclusion.
 *
 * Sprint 3 surface: optional. The primary corpus carries `kp_gfz_observed`
 * directly (per §3.7.3), so the harness does not strictly need a live GFZ
 * fetch to compute T2 scores against the committed corpus. This module is
 * here so corpus-extension cycles can use it; Run 1 reads `kp_gfz_observed`
 * from the corpus and trusts it.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { CACHE_DIR, GFZ_KP_BASE_URL } from '../config.js';

const GFZ_CACHE_DIR = resolve(CACHE_DIR, 'gfz');

function cacheKey(label, key) {
  const hash = createHash('sha256').update(`${label}::${key}`).digest('hex').slice(0, 16);
  return resolve(GFZ_CACHE_DIR, `${label}-${hash}.txt`);
}

/**
 * Fetch the GFZ definitive Kp text product for a given year.
 *
 * Returns the raw text (GFZ publishes a fixed-width plaintext file per year).
 * Parsing into per-3-hour Kp records is left to the caller — this helper
 * exists so corpus-extension scripts can pull the source with cache, not
 * to run-time-feed Sprint 3's Run 1 (which trusts corpus-supplied values).
 *
 * @param {number} year - 4-digit year, e.g. 2024
 * @param {object} [options]
 * @returns {Promise<string>} raw text body
 */
export async function fetchGfzKpYear(year, options = {}) {
  if (!Number.isInteger(year) || year < 1932) {
    throw new Error(`gfz-fetch: invalid year ${year}`);
  }
  if (!existsSync(GFZ_CACHE_DIR)) {
    mkdirSync(GFZ_CACHE_DIR, { recursive: true });
  }
  const cacheFile = cacheKey('kp-year', String(year));
  if (!options.bypassCache && existsSync(cacheFile)) {
    return readFileSync(cacheFile, 'utf8');
  }
  // GFZ Kp index page links to per-year ASCII tables under /app/files/.
  // We use the documented Kp data URL pattern; if GFZ refactors, the cache
  // miss surfaces an explicit error.
  const url = `${GFZ_KP_BASE_URL}/app/files/Kp_ap_Ap_SN_F107_since_1932.txt`;
  const res = await fetch(url, { headers: { Accept: 'text/plain' } });
  if (!res.ok) {
    throw new Error(`gfz-fetch: HTTP ${res.status} on Kp year ${year} (${url})`);
  }
  const body = await res.text();
  writeFileSync(cacheFile, body, 'utf8');
  return body;
}
