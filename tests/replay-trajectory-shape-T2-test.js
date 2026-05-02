/**
 * tests/replay-trajectory-shape-T2-test.js
 *
 * Sprint 2 milestone-2 (step 6) test for T2 binary_scalar trajectory shape.
 * Pinned by REPLAY-SEAM.md §10 (test #2) and CONTRACT.md §11.1 producer rules.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T2_event } from '../scripts/corona-backtest/replay/t2-replay.js';
import { verifyTrajectoryHash } from '../scripts/corona-backtest/replay/hashes.js';

const RUNTIME_REVISION_FIXTURE = 'test-rev-trajectory-shape-T2';

function loadOneT2Event(eventId) {
  const { events, errors } = loadCorpus(undefined, { theatres: ['T2'] });
  assert.ok(errors.length === 0, `T2 corpus load errors: ${errors.join(', ')}`);
  const evt = events.T2.find((e) => e.event_id === eventId);
  assert.ok(evt != null, `expected T2 event ${eventId}; available: ${events.T2.map((e) => e.event_id).join(', ')}`);
  return evt;
}

test('trajectory-shape-T2: schema_version pinned to 0.1.0', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.schema_version, '0.1.0');
});

test('trajectory-shape-T2: theatre_id, template, event_id, distribution_shape', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.theatre_id, 'T2');
  assert.equal(traj.theatre_template, 'geomagnetic_storm_gate');
  assert.equal(traj.event_id, event.event_id);
  assert.equal(traj.distribution_shape, 'binary_scalar');
});

test('trajectory-shape-T2: cutoff is first_threshold_crossing_or_window_end (defaults to window_end)', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.cutoff.rule, 'first_threshold_crossing_or_window_end');
  const windowEndMs = new Date(event.kp_window_end).getTime();
  assert.equal(traj.cutoff.time_ms, windowEndMs);
});

test('trajectory-shape-T2: gate_params pinned to cycle-002 (Kp 5, 72h)', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.gate_params.kp_threshold, 5);
  assert.equal(traj.gate_params.window_hours, 72);
});

test('trajectory-shape-T2: current_position_at_cutoff is scalar in [0,1]', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  const p = traj.current_position_at_cutoff;
  assert.equal(typeof p, 'number');
  assert.ok(p >= 0 && p <= 1);
});

test('trajectory-shape-T2: position_history_at_cutoff entries renamed (t_ms, evidence_id)', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.ok(Array.isArray(traj.position_history_at_cutoff));
  assert.ok(traj.position_history_at_cutoff.length > 0);
  for (const entry of traj.position_history_at_cutoff) {
    assert.ok(entry.t_ms <= traj.cutoff.time_ms);
    assert.ok('t_ms' in entry);
    assert.ok('evidence_id' in entry);
    assert.ok(!('t' in entry));
    assert.ok(!('evidence' in entry));
  }
});

test('trajectory-shape-T2: outcome.kind=binary, GFZ-preferred Kp ≥ threshold', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.outcome.kind, 'binary');
  // Kp 9 ≥ 5 threshold → outcome 1
  assert.equal(traj.outcome.value, 1);
});

test('trajectory-shape-T2: meta provenance fields complete', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.meta.replay_clock_source, 'corpus_event_time');
  for (const field of ['corpus_event_hash', 'cutoff_hash', 'gate_params_hash', 'trajectory_hash']) {
    const v = traj.meta[field];
    assert.match(v, /^[0-9a-f]{64}$/);
  }
});

test('trajectory-shape-T2: replay_clock_seed = kp_window_start', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.equal(traj.meta.replay_clock_seed, new Date(event.kp_window_start).getTime());
});

test('trajectory-shape-T2: trajectory_hash self-verifies', () => {
  const event = loadOneT2Event('T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T2_event(event, ctx);
  assert.ok(verifyTrajectoryHash(traj));
});

test('trajectory-shape-T2: rejects non-T2 corpus event', () => {
  const fakeT1 = { theatre: 'T1', event_id: 'fake-T1' };
  const fakeCtx = Object.freeze({ is_replay: true, runtime_revision: 'rev', replay_clock_seed: 0 });
  assert.throws(() => replay_T2_event(fakeT1, fakeCtx), /expected T2 corpus event/);
});

test('trajectory-shape-T2: shape holds for ALL 5 cycle-001 T2 corpus events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T2'] });
  assert.equal(events.T2.length, 5);
  for (const event of events.T2) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const traj = replay_T2_event(event, ctx);
    assert.equal(traj.theatre_id, 'T2');
    assert.equal(traj.distribution_shape, 'binary_scalar');
    assert.equal(traj.outcome.kind, 'binary');
    // All cycle-001 T2 corpus events have observed Kp ≥ 7 ≥ threshold 5 → outcome 1
    assert.equal(traj.outcome.value, 1, `${event.event_id}: expected outcome=1 for Kp≥5`);
    assert.ok(verifyTrajectoryHash(traj));
  }
});
