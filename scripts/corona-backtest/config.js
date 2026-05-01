/**
 * scripts/corona-backtest/config.js
 *
 * Shared paths, env-var keys, and tuning constants for the CORONA
 * offline backtest harness. Imported by the entrypoint
 * (scripts/corona-backtest.js), the ingestors, the scoring modules,
 * the reporting modules, and the corpus loader.
 *
 * Zero runtime dependency surface: the only imports here are
 * node:fs / node:path / node:url. No third-party packages.
 *
 * Source-of-truth references:
 *   - SDD §6.1 (module structure)
 *   - SDD §6.2 (entry-point env contract)
 *   - SDD §6.6 (auth + rate limit)
 *   - calibration-protocol.md §3 + §3.7 (corpus rules)
 *   - calibration-protocol.md §6 (pass/marginal/fail thresholds)
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Repo root resolves up out of scripts/corona-backtest/.
export const REPO_ROOT = resolve(__dirname, '..', '..');

// Calibration tree paths.
export const CALIBRATION_DIR = resolve(REPO_ROOT, 'grimoires', 'loa', 'calibration', 'corona');
export const CORPUS_DIR_DEFAULT = resolve(CALIBRATION_DIR, 'corpus');
export const RUNS_DIR = CALIBRATION_DIR;
export const PROTOCOL_FILE = resolve(CALIBRATION_DIR, 'calibration-protocol.md');
export const AUTHORITY_FILE = resolve(CALIBRATION_DIR, 'theatre-authority.md');

// Cache for raw DONKI fetches — gitignored. Created on first use.
export const CACHE_DIR = resolve(__dirname, 'cache');

// Backtest entrypoint (used by hash-utils to compute the script_hash).
export const BACKTEST_ENTRY = resolve(REPO_ROOT, 'scripts', 'corona-backtest.js');

// Theatre IDs, in canonical order.
export const THEATRES = ['T1', 'T2', 'T3', 'T4', 'T5'];

// Per-theatre scoring module paths (for documentation + dispatch).
export const SCORING_MODULES = {
  T1: 'scoring/t1-bucket-brier.js',
  T2: 'scoring/t2-bucket-brier.js',
  T3: 'scoring/t3-timing-error.js',
  T4: 'scoring/t4-bucket-brier.js',
  T5: 'scoring/t5-quality-of-behavior.js',
};

// Per-theatre primary corpus subdirectories.
export const CORPUS_SUBDIRS = {
  T1: 'primary/T1-flare-class',
  T2: 'primary/T2-geomag-storm',
  T3: 'primary/T3-cme-arrival',
  T4: 'primary/T4-proton-cascade',
  T5: 'primary/T5-solar-wind-divergence',
};

// Pass/marginal/fail thresholds — calibration-protocol.md §6 verbatim.
// Sprint 5 may re-baseline; the regression gate compares against the most
// recent committed thresholds. Keep these in sync if Sprint 5 amends §6.
export const THRESHOLDS = {
  T1: {
    pass:     { brier_max: 0.15, calibration_min: 0.85 },
    marginal: { brier_max: 0.20, calibration_min: 0.75 },
  },
  T2: {
    pass:     { brier_max: 0.15, convergence_min: 0.85 },
    marginal: { brier_max: 0.20, convergence_min: 0.75 },
  },
  T3: {
    pass:     { mae_hours_max: 6,  hit_rate_min: 0.65 },
    marginal: { mae_hours_max: 9,  hit_rate_min: 0.50 },
  },
  T4: {
    pass:     { brier_max: 0.20, calibration_min: 0.75 },
    marginal: { brier_max: 0.25, calibration_min: 0.65 },
  },
  T5: {
    pass:     { fp_rate_max: 0.10, stale_p50_max_seconds: 120, switch_handled_min: 0.95 },
    marginal: { fp_rate_max: 0.15, stale_p50_max_seconds: 300, switch_handled_min: 0.90 },
  },
};

// DONKI auth + rate-limit posture (SDD §6.6).
//
// The DONKI archive's DEMO_KEY is rate-limited to 40 requests/hr; the
// authenticated NASA_API_KEY ceiling is 1000/hr. We throttle below the cap
// to stay clear of the 429 cliff. These knobs are read by donki-fetch.js
// and the sanity-sample harness; the harness itself is offline-capable so
// these are only consulted when a fetch is actually attempted.
export const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI';
export const DONKI_DEMO_KEY = 'DEMO_KEY';
export const DONKI_THROTTLE_PER_HOUR_AUTHENTICATED = 900;
export const DONKI_THROTTLE_PER_HOUR_DEMO = 35;

export function getNasaApiKey() {
  return process.env.NASA_API_KEY || DONKI_DEMO_KEY;
}

export function isAuthenticated() {
  return Boolean(process.env.NASA_API_KEY) && process.env.NASA_API_KEY !== DONKI_DEMO_KEY;
}

// Public NOAA SWPC endpoints. We only consume documented JSON products.
// No undocumented endpoints, no scraping.
export const SWPC_BASE_URL = 'https://services.swpc.noaa.gov';

// GFZ Potsdam definitive Kp service. The definitive Kp publishes with a
// ~30-day lag (PRD §10 R5); the regression-tier authority for T2 per
// theatre-authority.md.
export const GFZ_KP_BASE_URL = 'https://kp.gfz-potsdam.de';

// Output dir resolution. Honors the SDD §6.2 env contract:
//   CORONA_OUTPUT_DIR=run-N (defaults to run-1; harness picks next-available
//   when not explicitly set and run-1 is already populated).
export function resolveOutputDir(envValue) {
  const requested = envValue || process.env.CORONA_OUTPUT_DIR || 'run-1';
  return resolve(CALIBRATION_DIR, requested);
}

export function resolveCorpusDir(envValue) {
  const requested = envValue || process.env.CORONA_CORPUS_DIR || CORPUS_DIR_DEFAULT;
  return resolve(requested);
}

// Theatre filter from CORONA_THEATRES=T1,T2,...
export function resolveTheatreFilter(envValue) {
  const requested = envValue || process.env.CORONA_THEATRES || THEATRES.join(',');
  const parts = requested.split(',').map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    if (!THEATRES.includes(p)) {
      throw new Error(`config: unknown theatre "${p}" in CORONA_THEATRES (allowed: ${THEATRES.join(',')})`);
    }
  }
  return parts;
}
