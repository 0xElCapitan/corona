/**
 * scripts/corona-backtest/reporting/hash-utils.js
 *
 * SHA-256 hashing utilities for the CORONA backtest harness.
 *
 * Sprint 3 (corona-2ox) deliverable per SDD §6.5.
 *
 * Functions:
 *   - computeFileHash(path)      — sha256 of a single file's contents
 *   - computeCorpusHash(corpusDir) — sha256 over the canonical concatenation
 *     of every primary-corpus file, sorted by path. The result is the
 *     `corpus_hash` written to run-N/corpus_hash.txt and recorded in
 *     calibration-manifest.json entries (PRD §7).
 *   - computeScriptHash(scriptPath) — sha256 of the entrypoint script.
 *
 * Zero-dep: uses node:crypto.createHash exclusively.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

import { CORPUS_SUBDIRS, THEATRES, BACKTEST_ENTRY } from '../config.js';

/**
 * Compute SHA-256 of a file's bytes (hex string).
 */
export function computeFileHash(path) {
  if (!existsSync(path)) {
    throw new Error(`computeFileHash: file does not exist (${path})`);
  }
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * List all primary-corpus event JSONs under a corpus root directory.
 * Sorted by path for deterministic hashing.
 *
 * Excludes corpus-manifest.json + secondary tier (which doesn't enter
 * regression scoring per §3.3).
 */
function listPrimaryCorpusFiles(corpusDir) {
  const out = [];
  for (const theatre of THEATRES) {
    const subdir = resolve(corpusDir, CORPUS_SUBDIRS[theatre]);
    if (!existsSync(subdir)) continue;
    for (const name of readdirSync(subdir)) {
      if (!name.endsWith('.json')) continue;
      const full = resolve(subdir, name);
      if (statSync(full).isFile()) out.push(full);
    }
  }
  out.sort();
  return out;
}

/**
 * Compute the canonical corpus hash.
 *
 * Definition: concatenate, in path-sorted order, the relative path
 * followed by a NUL byte and the file bytes for each primary-corpus
 * file. Hash the resulting stream. Including the relative path makes
 * a rename-only change (which would alter the manifest) detectable.
 *
 * @param {string} corpusDir
 * @returns {{hex: string, file_count: number, files: string[]}}
 */
export function computeCorpusHash(corpusDir) {
  const files = listPrimaryCorpusFiles(corpusDir);
  const hash = createHash('sha256');
  for (const f of files) {
    const rel = relative(corpusDir, f).replace(/\\/g, '/');
    hash.update(rel);
    hash.update(Buffer.from([0])); // separator
    hash.update(readFileSync(f));
    hash.update(Buffer.from([0])); // separator
  }
  return { hex: hash.digest('hex'), file_count: files.length, files };
}

/**
 * SHA-256 of the backtest entrypoint script. Default points to
 * scripts/corona-backtest.js per SDD §6.5.
 */
export function computeScriptHash(scriptPath = BACKTEST_ENTRY) {
  return computeFileHash(scriptPath);
}
