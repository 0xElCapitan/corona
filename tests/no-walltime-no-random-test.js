/**
 * tests/no-walltime-no-random-test.js
 *
 * Cycle-004 Sprint 03 — T3.6 (no walltime / no random in proof + replay path).
 * SPRINT-PLAN §6.4 (invariant I6) [G5].
 *
 * Two independent mechanisms:
 *   (1) BEHAVIORAL (authoritative): stub Date.now and Math.random to THROW, then
 *       run the cycle-004 proof dispatch for all three states. If the proof/replay
 *       path touched wall-clock or RNG it would throw; it does not. Immune to
 *       comments/strings (it observes actual runtime behavior).
 *   (2) TEXTUAL (defense-in-depth): comment-stripped source scan of the new
 *       cycle-004 harness and the Sprint-02-changed replay path (t2-replay.js) for
 *       real `Date.now(` / `Math.random(` CALLS. Comments (e.g. "NO Date.now()")
 *       are stripped first so historical/negation text does not falsely fail (the
 *       T3.6 "allowed historical text" requirement).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { dispatchHashes } from '../scripts/corona-backtest-cycle-004-evidence-wiring.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('proof/replay path never calls Date.now() or Math.random() (stub-to-throw)', () => {
  const realNow = Date.now;
  const realRandom = Math.random;
  Date.now = () => { throw new Error('Date.now() called in cycle-004 proof/replay path'); };
  Math.random = () => { throw new Error('Math.random() called in cycle-004 proof/replay path'); };
  try {
    for (const state of ['baseline', 'wired', 'ablated']) {
      const { records, errors } = dispatchHashes({ state });
      assert.deepEqual(errors, [], `${state}: no loader errors`);
      assert.equal(records.length, 60, `${state}: 60 deterministic records without walltime/random`);
    }
  } finally {
    Date.now = realNow;
    Math.random = realRandom;
  }
});

// Strip block + line comments before scanning so documentation that mentions
// "Date.now()" as a negation does not falsely fail.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

for (const rel of [
  'scripts/corona-backtest-cycle-004-evidence-wiring.js',
  'scripts/corona-backtest/replay/t2-replay.js',
]) {
  test(`no real Date.now( / Math.random( call in ${rel} (comment-stripped)`, () => {
    const src = stripComments(readFileSync(resolve(REPO_ROOT, rel), 'utf8'));
    const hits = src.match(/Date\.now\s*\(|Math\.random\s*\(/g) || [];
    assert.deepEqual(hits, [],
      `${rel}: no wall-clock/RNG call in code (comments/historical text excluded). Found: ${hits.join(', ')}`);
  });
}
