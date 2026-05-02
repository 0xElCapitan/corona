/**
 * tests/replay-determinism-T1T2-test.js
 *
 * Sprint 2 milestone-2 (step 6) determinism test for T1 + T2 binary_scalar
 * trajectories.
 *
 * Per CONTRACT §9.1 (replay-twice byte-identical) and CHARTER §10 Rung 1:
 * the byte-identical determinism is the binding gate for "runtime-wired"
 * claims on T1/T2 (the same way it was on T4 in milestone 1).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T1_event } from '../scripts/corona-backtest/replay/t1-replay.js';
import { replay_T2_event } from '../scripts/corona-backtest/replay/t2-replay.js';
import { canonicalize } from '../scripts/corona-backtest/replay/canonical-json.js';

const RUNTIME_REVISION_FIXTURE = 'test-rev-determinism-T1T2';

test('determinism-T1: replay-twice byte-identical for ALL 5 cycle-001 T1 corpus events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T1'] });
  assert.equal(events.T1.length, 5);
  for (const event of events.T1) {
    const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const traj1 = replay_T1_event(event, ctx1);
    const traj2 = replay_T1_event(event, ctx2);
    assert.equal(canonicalize(traj1), canonicalize(traj2),
      `T1 byte-identical replay failed for ${event.event_id}`);
    assert.equal(traj1.meta.trajectory_hash, traj2.meta.trajectory_hash);
  }
});

test('determinism-T2: replay-twice byte-identical for ALL 5 cycle-001 T2 corpus events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T2'] });
  assert.equal(events.T2.length, 5);
  for (const event of events.T2) {
    const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const traj1 = replay_T2_event(event, ctx1);
    const traj2 = replay_T2_event(event, ctx2);
    assert.equal(canonicalize(traj1), canonicalize(traj2),
      `T2 byte-identical replay failed for ${event.event_id}`);
    assert.equal(traj1.meta.trajectory_hash, traj2.meta.trajectory_hash);
  }
});

test('determinism-T1: different runtime_revision produces different trajectory_hash', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T1'] });
  const event = events.T1[0];
  const ctxA = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: 'rev-A' });
  const ctxB = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: 'rev-B' });
  const trajA = replay_T1_event(event, ctxA);
  const trajB = replay_T1_event(event, ctxB);
  assert.notEqual(trajA.meta.trajectory_hash, trajB.meta.trajectory_hash);
  // Corpus / cutoff / gate-params hashes are revision-independent
  assert.equal(trajA.meta.corpus_event_hash, trajB.meta.corpus_event_hash);
  assert.equal(trajA.meta.cutoff_hash, trajB.meta.cutoff_hash);
  assert.equal(trajA.meta.gate_params_hash, trajB.meta.gate_params_hash);
});

test('determinism-T2: different runtime_revision produces different trajectory_hash', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T2'] });
  const event = events.T2[0];
  const ctxA = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: 'rev-A' });
  const ctxB = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: 'rev-B' });
  const trajA = replay_T2_event(event, ctxA);
  const trajB = replay_T2_event(event, ctxB);
  assert.notEqual(trajA.meta.trajectory_hash, trajB.meta.trajectory_hash);
});

test('determinism-T1T2: replay seam fail-closed on missing seed (T1 missing flare_peak_time)', () => {
  const fakeT1 = { theatre: 'T1', event_id: 'T1-fail-closed', prediction_window_hours: 24 };
  // Missing flare_peak_time AND gate_open_time → seed cannot be computed
  assert.throws(
    () => createReplayContext({ corpus_event: fakeT1, theatre_id: 'T1', runtime_revision: 'rev-test' }),
    /cannot derive replay_clock_seed/,
  );
});

test('determinism-T1T2: replay seam fail-closed on missing seed (T2 missing kp_window_start)', () => {
  const fakeT2 = { theatre: 'T2', event_id: 'T2-fail-closed' };
  assert.throws(
    () => createReplayContext({ corpus_event: fakeT2, theatre_id: 'T2', runtime_revision: 'rev-test' }),
    /cannot derive replay_clock_seed/,
  );
});
