/**
 * tests/replay-t2-ablated-equals-baseline-test.js
 *
 * Cycle-004 Sprint 03 — T3.4 (ablated == baseline, reversibility). SPRINT-PLAN §6.4 + §6.10 [G4].
 *
 * Proves the ABLATED (wireEvidence:false) run reproduces the committed Sprint 01
 * BASELINE fixture for all 60 events (T1 30/30, T2 30/30). This is the
 * reversibility guarantee: the opt-in T2 wiring is a true no-op when off.
 *
 * §6.10 LINE-ENDING-ROBUST COMPARISON (BINDING). The committed baseline blob is
 * LF; under core.autocrlf=true it may check out as CRLF in the working tree, so a
 * raw working-tree byte `diff` is FORBIDDEN as the authoritative gate. This test
 * uses BOTH accepted robust methods:
 *   (method 2) read the committed blob via `git cat-file -p HEAD:<path>` (LF), and
 *   (method 1) JSON.parse both sides and compare canonical objects (line endings
 *              are inter-token whitespace, ignored by the parser).
 * The fresh ablated side is produced in-process (no dependency on a generated
 * working-tree file).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildHashTable } from '../scripts/corona-backtest-cycle-004-evidence-wiring.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = 'grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json';

function committedBaseline() {
  // §6.10 method 2 — committed LF blob, not the working-tree (possibly CRLF) copy.
  const lf = execFileSync('git', ['cat-file', '-p', `HEAD:${BASELINE_PATH}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return JSON.parse(lf); // §6.10 method 1 — parse → representation-independent.
}

test('ablated == committed Sprint 01 baseline for all 60 events (§6.10 robust)', () => {
  const baseline = committedBaseline();
  const ablated = buildHashTable({ state: 'ablated' });

  assert.equal(baseline.events.length, 60, 'committed baseline fixture carries 60 events');
  assert.equal(ablated.events.length, 60, 'ablated run carries 60 events');

  // Whole per-event table identity (canonical objects; both sorted identically
  // by the harness's (theatre, event_id) order).
  assert.deepEqual(ablated.events, baseline.events,
    'ablated per-event hash table MUST equal the committed baseline (reversibility — HS-6)');

  // Per-theatre split: T1 30/30, T2 30/30.
  const bIdx = Object.fromEntries(baseline.events.map((r) => [`${r.theatre}/${r.event_id}`, r.trajectory_hash]));
  const aIdx = Object.fromEntries(ablated.events.map((r) => [`${r.theatre}/${r.event_id}`, r.trajectory_hash]));
  for (const theatre of ['T1', 'T2']) {
    const keys = Object.keys(bIdx).filter((k) => k.startsWith(`${theatre}/`));
    assert.equal(keys.length, 30, `${theatre}: 30 baseline events`);
    const mismatches = keys.filter((k) => aIdx[k] !== bIdx[k]);
    assert.deepEqual(mismatches, [], `${theatre}: all 30 ablated hashes equal baseline`);
  }

  assert.equal(ablated.wire_evidence, false, 'ablated is the default-off path (wire_evidence:false)');
});
