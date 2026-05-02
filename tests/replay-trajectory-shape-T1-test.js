/**
 * tests/replay-trajectory-shape-T1-test.js
 *
 * Sprint 2 milestone-2 (step 6) test for T1 binary_scalar trajectory shape.
 * Pinned by REPLAY-SEAM.md §10 (test #1) and CONTRACT.md §11.1 producer rules.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T1_event } from '../scripts/corona-backtest/replay/t1-replay.js';
import { verifyTrajectoryHash } from '../scripts/corona-backtest/replay/hashes.js';

const RUNTIME_REVISION_FIXTURE = 'test-rev-trajectory-shape-T1';

function loadOneT1Event(eventId) {
  const { events, errors } = loadCorpus(undefined, { theatres: ['T1'] });
  assert.ok(errors.length === 0, `T1 corpus load errors: ${errors.join(', ')}`);
  const evt = events.T1.find((e) => e.event_id === eventId);
  assert.ok(evt != null, `expected T1 event ${eventId}; available: ${events.T1.map((e) => e.event_id).join(', ')}`);
  return evt;
}

test('trajectory-shape-T1: schema_version pinned to 0.1.0', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.equal(traj.schema_version, '0.1.0');
});

test('trajectory-shape-T1: theatre_id, template, event_id, distribution_shape', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.equal(traj.theatre_id, 'T1');
  assert.equal(traj.theatre_template, 'flare_class_gate');
  assert.equal(traj.event_id, event.event_id);
  assert.equal(traj.distribution_shape, 'binary_scalar');
});

test('trajectory-shape-T1: cutoff is flare_peak_minus_epsilon (peak - 1 ms)', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.equal(traj.cutoff.rule, 'flare_peak_minus_epsilon');
  const peakMs = new Date(event.flare_peak_time).getTime();
  assert.equal(traj.cutoff.time_ms, peakMs - 1);
});

test('trajectory-shape-T1: gate_params pinned to cycle-002 (M1.0, 24h)', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.equal(traj.gate_params.threshold_class, 'M1.0');
  assert.equal(traj.gate_params.window_hours, 24);
});

test('trajectory-shape-T1: current_position_at_cutoff is scalar in [0,1]', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  const p = traj.current_position_at_cutoff;
  assert.equal(typeof p, 'number');
  assert.ok(p >= 0 && p <= 1, `current_position_at_cutoff ${p} out of [0,1]`);
});

test('trajectory-shape-T1: position_history_at_cutoff entries have t_ms <= cutoff and renamed fields', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.ok(Array.isArray(traj.position_history_at_cutoff));
  assert.ok(traj.position_history_at_cutoff.length > 0, 'should have at least the initial base-rate entry');
  for (const entry of traj.position_history_at_cutoff) {
    assert.ok(entry.t_ms <= traj.cutoff.time_ms);
    assert.ok('t_ms' in entry);
    assert.ok('evidence_id' in entry);
    assert.ok('p' in entry);
    assert.ok('reason' in entry);
    assert.ok(!('t' in entry), 'should not carry runtime field name `t`');
    assert.ok(!('evidence' in entry), 'should not carry runtime field name `evidence`');
    assert.ok(typeof entry.p === 'number' && entry.p >= 0 && entry.p <= 1);
  }
});

test('trajectory-shape-T1: outcome.kind=binary, value in {0,1}', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.equal(traj.outcome.kind, 'binary');
  assert.ok(traj.outcome.value === 0 || traj.outcome.value === 1);
  // X8.7 crosses M1.0 threshold → outcome 1
  assert.equal(traj.outcome.value, 1);
});

test('trajectory-shape-T1: meta provenance fields complete', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.equal(traj.meta.replay_clock_source, 'corpus_event_time');
  assert.equal(traj.meta.runtime_revision, RUNTIME_REVISION_FIXTURE);
  assert.equal(traj.meta.contract_version, '0.1.0');
  for (const field of ['corpus_event_hash', 'cutoff_hash', 'gate_params_hash', 'trajectory_hash']) {
    const v = traj.meta[field];
    assert.equal(typeof v, 'string');
    assert.equal(v.length, 64);
    assert.match(v, /^[0-9a-f]{64}$/);
  }
});

test('trajectory-shape-T1: replay_clock_seed = flare_peak_time - window_hours (computed seed)', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  const peakMs = new Date(event.flare_peak_time).getTime();
  const expectedSeed = peakMs - 24 * 3600_000;
  assert.equal(traj.meta.replay_clock_seed, expectedSeed);
});

test('trajectory-shape-T1: trajectory_hash self-verifies', () => {
  const event = loadOneT1Event('T1-2024-05-14-X8p7');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T1_event(event, ctx);
  assert.ok(verifyTrajectoryHash(traj));
});

test('trajectory-shape-T1: rejects non-T1 corpus event', () => {
  const fakeT4 = { theatre: 'T4', event_id: 'fake-T4', _derived: {} };
  const fakeCtx = Object.freeze({ is_replay: true, runtime_revision: 'rev', replay_clock_seed: 0 });
  assert.throws(() => replay_T1_event(fakeT4, fakeCtx), /expected T1 corpus event/);
});

test('trajectory-shape-T1: shape holds for ALL 5 cycle-001 T1 corpus events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T1'] });
  assert.equal(events.T1.length, 5);
  for (const event of events.T1) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const traj = replay_T1_event(event, ctx);
    assert.equal(traj.theatre_id, 'T1');
    assert.equal(traj.distribution_shape, 'binary_scalar');
    assert.equal(traj.outcome.kind, 'binary');
    // All cycle-001 T1 corpus events are X-class flares ≥ M1.0 threshold → outcome 1
    assert.equal(traj.outcome.value, 1, `${event.event_id}: expected outcome=1 for X-class flare`);
    assert.ok(verifyTrajectoryHash(traj));
  }
});
