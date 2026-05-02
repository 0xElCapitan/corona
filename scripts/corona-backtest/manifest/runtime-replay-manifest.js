/**
 * scripts/corona-backtest/manifest/runtime-replay-manifest.js
 *
 * Cycle-002 additive manifest builder + replay_script_hash computation.
 *
 * Sprint 03 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/PRD.md §4 (cycle-002 in-scope)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §5 (additive cycle-002 manifest)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §6 (replay_script_hash file-set strategy)
 *   - grimoires/loa/a2a/cycle-002/sprint-02/reviewer.md "Provenance Note for Sprint 3"
 *   - operator ratification (Sprint 03 instruction): cycle-002 entrypoint owns the
 *     additive manifest write; cycle-001 calibration manifest stays immutable.
 *
 * The cycle-001 calibration manifest at
 * grimoires/loa/calibration/corona/calibration-manifest.json is FROZEN. This
 * helper writes a SEPARATE additive manifest at
 * grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json.
 *
 * `replay_script_hash` covers the cycle-002 trajectory-driving file set per
 * SDD §6.2 (path-sorted canonical concatenation). It is recomputed on every
 * cycle-002 run; manifest_regression hard-fails if recomputation diverges
 * from the recorded value. `runtime_replay_hash` is recorded as an alias of
 * `replay_script_hash` per the operator instruction listing both names —
 * same bytes, two field names so downstream consumers can read either.
 *
 * Zero new runtime dependencies (uses node:crypto + node:fs).
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

import { REPO_ROOT } from '../config.js';

// =====================================================================
// File set (binding per SDD §6.2 — path-sorted at hash time)
// =====================================================================

export const REPLAY_SCRIPT_HASH_FILES = Object.freeze([
  'scripts/corona-backtest-cycle-002.js',
  'scripts/corona-backtest/replay/canonical-json.js',
  'scripts/corona-backtest/replay/hashes.js',
  'scripts/corona-backtest/replay/context.js',
  'scripts/corona-backtest/replay/t1-replay.js',
  'scripts/corona-backtest/replay/t2-replay.js',
  'scripts/corona-backtest/replay/t4-replay.js',
  'scripts/corona-backtest/scoring/t1-binary-brier.js',
  'scripts/corona-backtest/scoring/t2-binary-brier.js',
  // Cycle-002-specific reporting + manifest helpers added in Sprint 03 per
  // SDD §6.2 "any new cycle-002-specific reporting / manifest helper files
  // added in Sprint 03 ... is added to the replay_script_hash file set".
  'scripts/corona-backtest/reporting/runtime-uplift-summary.js',
  'scripts/corona-backtest/reporting/diagnostic-summary.js',
  'scripts/corona-backtest/manifest/runtime-replay-manifest.js',
]);

// Cycle-001 entrypoint that MUST NOT appear in this set (preserves I1 by
// construction — see SDD §6.3).
export const CYCLE_001_ENTRYPOINT_RELATIVE = 'scripts/corona-backtest.js';

/**
 * Compute the cycle-002 replay_script_hash over the canonical concatenation
 * of the file set. Path-sorted; relative path + NUL + bytes + NUL per file
 * (matches the cycle-001 computeCorpusHash construction in
 * scripts/corona-backtest/reporting/hash-utils.js).
 *
 * @param {string} [repoRoot] - default REPO_ROOT.
 * @returns {{hex:string, file_count:number, files:string[]}}
 */
export function computeReplayScriptHash(repoRoot = REPO_ROOT) {
  const files = [...REPLAY_SCRIPT_HASH_FILES].sort();
  const hash = createHash('sha256');
  for (const rel of files) {
    const abs = resolve(repoRoot, rel);
    if (!existsSync(abs)) {
      throw new Error(
        `runtime-replay-manifest: replay_script_hash file missing on disk: ${rel}. ` +
        `The Sprint 03 file set is binding; missing a covered file means trajectory ` +
        `bytes can change without provenance detection.`,
      );
    }
    const buf = readFileSync(abs);
    hash.update(rel);
    hash.update(Buffer.from([0]));
    hash.update(buf);
    hash.update(Buffer.from([0]));
  }
  return { hex: hash.digest('hex'), file_count: files.length, files };
}

// =====================================================================
// Additive cycle-002 manifest construction
// =====================================================================

const CYCLE_002_MANIFEST_SCHEMA_VERSION = '0.1.0';

const CYCLE_002_THEATRE_THRESHOLDS = Object.freeze({
  T1: { threshold_class: 'M1.0', window_hours: 24 },
  T2: { kp_threshold: 5, window_hours: 72 },
  T4: { s_scale_threshold: 'S1', window_hours: 72 },
});

const CYCLE_002_THEATRE_POSTURE = Object.freeze({
  T1: 'runtime-binary',
  T2: 'runtime-binary',
  T3: 'external-model',
  T4: 'runtime-bucket',
  T5: 'quality-of-behavior',
});

const POSTURE_INCLUDED_IN_RUNTIME_UPLIFT = Object.freeze({
  T1: true,
  T2: true,
  T3: false,
  T4: true,
  T5: false,
});

/**
 * Build the cycle-002 runtime-replay manifest object.
 *
 * @param {object} args
 * @param {string} args.runId                       - e.g. 'cycle-002-run-1'
 * @param {string} args.corpusHash                  - hex sha256
 * @param {string} args.scriptHash                  - cycle-001 entrypoint sha256 (preserved as cross-reference)
 * @param {{hex:string, file_count:number, files:string[]}} args.replayScriptHash
 * @param {string} args.codeRevision                - git rev (or 'unknown')
 * @param {Record<string, object>} args.aggregates  - per-theatre aggregates
 * @param {Record<string, object>} args.trajectoryHashes - { T1: { event_id: trajectory_hash }, ... }
 * @returns {object}
 */
export function buildCycle002Manifest({
  runId,
  corpusHash,
  scriptHash,
  replayScriptHash,
  codeRevision,
  aggregates,
  trajectoryHashes,
}) {
  const generatedAt = new Date().toISOString();
  const entries = [];
  for (const theatre of ['T1', 'T2', 'T4']) {
    const aggregate = aggregates[theatre];
    if (!aggregate) continue;
    const thresholds = CYCLE_002_THEATRE_THRESHOLDS[theatre];
    const trajectories = trajectoryHashes[theatre] ?? {};
    entries.push({
      id: `cycle-002-${theatre.toLowerCase()}-runtime-replay-anchor`,
      cycle: 'cycle-002',
      theatre,
      posture: CYCLE_002_THEATRE_POSTURE[theatre],
      included_in_runtime_uplift_composite: true,
      gate_thresholds: thresholds,
      scoring_path: theatre === 'T4' ? 't4_bucket_brier_runtime_wired_cycle002' : `${theatre.toLowerCase()}_binary_brier_cycle002`,
      n_events: aggregate.n_events ?? 0,
      brier: typeof aggregate.brier === 'number' ? aggregate.brier : null,
      trajectory_hashes: trajectories,
    });
  }
  // T3, T5 entries are diagnostic-only; recorded for transparency, NEVER
  // counted toward Rung 1 runtime-uplift composite per CHARTER §4.1.
  for (const theatre of ['T3', 'T5']) {
    const aggregate = aggregates[theatre];
    if (!aggregate) continue;
    entries.push({
      id: `cycle-002-${theatre.toLowerCase()}-diagnostic-only`,
      cycle: 'cycle-002',
      theatre,
      posture: CYCLE_002_THEATRE_POSTURE[theatre],
      included_in_runtime_uplift_composite: false,
      diagnostic_only: true,
      n_events: aggregate.n_events ?? 0,
    });
  }
  return {
    schema_version: CYCLE_002_MANIFEST_SCHEMA_VERSION,
    cycle: 'cycle-002',
    additive: true,
    predecessor_manifest: {
      path: 'grimoires/loa/calibration/corona/calibration-manifest.json',
      cycle: 'cycle-001',
      immutable: true,
      note: 'Cycle-001 manifest entries\' hashes are NEVER mutated. Cycle-002 ' +
            'is an additive separate file per CHARTER §6 / OPEN-QUESTIONS Q4.',
    },
    run_id: runId,
    generated_at: generatedAt,
    code_revision: codeRevision,
    corpus_hash: corpusHash,
    cycle_001_script_hash: scriptHash,
    cycle_001_script_hash_note:
      'cycle-001 script_hash = sha256(scripts/corona-backtest.js) covers ONLY the ' +
      'cycle-001 entrypoint file. It is INSUFFICIENT for cycle-002 provenance because ' +
      'it does not cover the replay seam dependencies (replay/*.js, scoring/t{1,2}-binary-brier.js) ' +
      'that drive cycle-002 trajectory output. Cycle-002 introduces replay_script_hash to ' +
      'cover the trajectory-driving file set per SDD §6.',
    replay_script_hash: replayScriptHash.hex,
    runtime_replay_hash: replayScriptHash.hex,
    replay_script_hash_file_count: replayScriptHash.file_count,
    replay_script_hash_files: replayScriptHash.files,
    theatre_posture: CYCLE_002_THEATRE_POSTURE,
    runtime_uplift_composite_membership: POSTURE_INCLUDED_IN_RUNTIME_UPLIFT,
    entries,
  };
}

/**
 * Recompute replay_script_hash from disk and assert it matches a value
 * carried in a manifest. Used by manifest_regression_test for cycle-002.
 *
 * @param {object} manifest
 * @returns {{ok:boolean, recomputed:string, recorded:string, message?:string}}
 */
export function verifyReplayScriptHash(manifest, repoRoot = REPO_ROOT) {
  const recorded = manifest?.replay_script_hash;
  if (typeof recorded !== 'string' || recorded.length !== 64) {
    return { ok: false, recomputed: '', recorded: String(recorded), message: 'recorded replay_script_hash missing or malformed' };
  }
  const recomputedRes = computeReplayScriptHash(repoRoot);
  if (recomputedRes.hex !== recorded) {
    return {
      ok: false,
      recomputed: recomputedRes.hex,
      recorded,
      message: 'recomputed replay_script_hash does not match recorded value',
    };
  }
  return { ok: true, recomputed: recomputedRes.hex, recorded };
}

export const _CYCLE_002_THEATRE_POSTURE = CYCLE_002_THEATRE_POSTURE;
export const _CYCLE_002_THEATRE_THRESHOLDS = CYCLE_002_THEATRE_THRESHOLDS;
