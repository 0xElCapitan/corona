/**
 * tests/replay-t1-negative-control-test.js
 *
 * Cycle-004 Sprint 03 — T3.6a (T1 negative-control identity). SPRINT-PLAN §6.4.
 *
 * T1 (flare class) is BLOCKED in cycle-004 (PRD/SDD §5: raw xray_flux samples
 * cannot map to the flare-EVENT gate contract without inventing semantics). It is
 * retained as a NEGATIVE CONTROL: the wireEvidence toggle is never passed to
 * replay_T1_event, so T1 trajectory hashes are identical across wired, ablated,
 * and the committed baseline, and T1 consumes zero evidence.
 *
 * Asserts:
 *   - T1 wired == ablated == committed baseline for all 30 T1 events;
 *   - T1 trajectories carry empty evidence_bundles_consumed (no consumption);
 *   - t1-replay.js committed blob is byte-frozen (no T1 wiring / no flux mapping).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { CALIBRATION_DIR } from '../scripts/corona-backtest/config.js';
import { loadCorpusWithCutoff } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T1_event } from '../scripts/corona-backtest/replay/t1-replay.js';
import {
  buildHashTable,
  _RUNTIME_REVISION,
} from '../scripts/corona-backtest-cycle-004-evidence-wiring.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const T1_REPLAY_PATH = 'scripts/corona-backtest/replay/t1-replay.js';
// Frozen committed-blob sha256 (LF) captured at Sprint 03 entry (cycle-004 @ 2c83bc6).
const T1_REPLAY_FROZEN_SHA256 = '9c46c8ad0e174f587a248dabed7a276b549622d75ec10b6af3c0570898ba5979';

function committedBaselineT1() {
  const lf = execFileSync(
    'git',
    ['cat-file', '-p', 'HEAD:grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  const fix = JSON.parse(lf);
  return Object.fromEntries(
    fix.events.filter((r) => r.theatre === 'T1').map((r) => [r.event_id, r.trajectory_hash]),
  );
}

test('T1 wired == ablated == baseline for all 30 events (negative control)', () => {
  const wired = buildHashTable({ state: 'wired' });
  const ablated = buildHashTable({ state: 'ablated' });
  const baseT1 = committedBaselineT1();

  const t1 = (t) =>
    Object.fromEntries(t.events.filter((r) => r.theatre === 'T1').map((r) => [r.event_id, r.trajectory_hash]));
  const W = t1(wired);
  const A = t1(ablated);
  const ids = Object.keys(baseT1).sort();
  assert.equal(ids.length, 30, '30 T1 baseline events');
  for (const id of ids) {
    assert.equal(W[id], baseT1[id], `T1/${id}: wired == baseline`);
    assert.equal(A[id], baseT1[id], `T1/${id}: ablated == baseline`);
    assert.equal(W[id], A[id], `T1/${id}: wired == ablated`);
  }
});

test('T1 trajectories consume zero evidence (no consumption, no flux->solar_flare mapping)', () => {
  const CORPUS = resolve(CALIBRATION_DIR, 'corpus-cycle-003');
  const { events } = loadCorpusWithCutoff(CORPUS, { theatres: ['T1'] });
  assert.equal(events.T1.length, 30, '30 T1 corpus events');
  for (const ev of events.T1) {
    const ctx = createReplayContext({
      corpus_event: ev,
      theatre_id: 'T1',
      runtime_revision: _RUNTIME_REVISION,
    });
    const traj = replay_T1_event(ev, ctx);
    assert.deepEqual(traj.evidence_bundles_consumed, [],
      `T1/${ev.event_id}: evidence_bundles_consumed MUST be empty (T1 blocked / negative control)`);
  }
});

test('t1-replay.js committed blob is byte-frozen (no T1 wiring this sprint)', () => {
  const blob = execFileSync('git', ['cat-file', '-p', `HEAD:${T1_REPLAY_PATH}`], { cwd: REPO_ROOT });
  const hash = createHash('sha256').update(blob).digest('hex');
  assert.equal(hash, T1_REPLAY_FROZEN_SHA256,
    't1-replay.js committed blob MUST stay frozen (no T1 wiring; no flux->solar_flare mapping; deriveEvidenceT1 untouched)');
});
