/**
 * tests/cycle-002-frozen-corpus-regression-test.js
 *
 * Cycle-004 Sprint 03 — T3.5 (frozen cycle-002 corpus regression / invariant I5).
 * SPRINT-PLAN §6.4 [G6].
 *
 * Proves the cycle-004 Sprint 02 additive/opt-in change (the wireEvidence seam in
 * t2-replay.js + the deriveEvidenceT2 helper in corpus-loader.js) did NOT perturb
 * the frozen cycle-002 runtime replay. It re-runs the PURE, file-free
 * dispatchCycle002Replay() against the frozen cycle-002 corpus and asserts every
 * T1/T2/T4 trajectory hash is byte-identical to the FROZEN anchor — the committed
 * cycle-002 runtime-replay manifest's per-entry trajectory_hashes.
 *
 * NON-MUTATING by construction:
 *   - dispatchCycle002Replay() writes no files (it is the in-process dispatch
 *     helper, distinct from main() which writes run dirs + the manifest);
 *   - corona-backtest-cycle-002.js is NOT edited;
 *   - the committed manifest is read via `git cat-file` (no working-tree dependency).
 *   Trajectory hashes are independent of replay_script_hash / code_revision
 *   (manifest-level provenance), so the Sprint-02 replay_script_hash churn does
 *   not affect this comparison.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { dispatchCycle002Replay } from '../scripts/corona-backtest-cycle-002.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = 'grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json';

function frozenManifestHashes() {
  const lf = execFileSync('git', ['cat-file', '-p', `HEAD:${MANIFEST_PATH}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  const manifest = JSON.parse(lf);
  const frozen = {};
  for (const e of manifest.entries || []) {
    if (['T1', 'T2', 'T4'].includes(e.theatre) && e.trajectory_hashes) {
      frozen[e.theatre] = e.trajectory_hashes;
    }
  }
  return frozen;
}

test('cycle-002 frozen-corpus replay byte-identical to committed manifest anchor (I5)', () => {
  const frozen = frozenManifestHashes();
  assert.deepEqual(Object.keys(frozen).sort(), ['T1', 'T2', 'T4'],
    'committed cycle-002 manifest carries T1/T2/T4 trajectory_hashes anchors');

  const { trajectoryHashes, errors } = dispatchCycle002Replay({});
  assert.deepEqual(errors, [], 'no loader errors on the frozen cycle-002 corpus');

  let total = 0;
  for (const theatre of ['T1', 'T2', 'T4']) {
    const frozenT = frozen[theatre];
    const freshT = trajectoryHashes[theatre] || {};
    const ids = Object.keys(frozenT).sort();
    assert.equal(ids.length, 5, `${theatre}: 5 frozen cycle-002 anchors`);
    for (const id of ids) {
      total++;
      assert.equal(freshT[id], frozenT[id],
        `${theatre}/${id}: fresh replay hash MUST equal frozen cycle-002 manifest anchor ` +
        `(additive/opt-in change must not perturb cycle-002 — HS-4)`);
    }
  }
  assert.equal(total, 15, '15 frozen cycle-002 trajectory anchors verified (T1/T2/T4 x 5)');
});
