/**
 * tests/replay-trajectory-shape-T4-test.js
 *
 * Sprint 2 milestone-1 test #4 per REPLAY-SEAM.md §10 and CONTRACT.md §11.1.
 *
 * Verifies all 17 producer-side validation rules from CONTRACT §11.1 hold for
 * a T4 trajectory produced by replay_T4_event against a real cycle-001 corpus
 * event.
 *
 * Cycle-001 corpus is FROZEN (charter §3.4); this test reads the corpus
 * read-only.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T4_event } from '../scripts/corona-backtest/replay/t4-replay.js';
import { verifyTrajectoryHash } from '../scripts/corona-backtest/replay/hashes.js';

const RUNTIME_REVISION_FIXTURE = 'test-rev-trajectory-shape-T4';

function loadOneT4Event(eventId) {
  const { events, errors } = loadCorpus(undefined, { theatres: ['T4'] });
  assert.ok(errors.length === 0, `corpus load errors: ${errors.join(', ')}`);
  const evt = events.T4.find((e) => e.event_id === eventId);
  assert.ok(evt != null, `expected T4 event ${eventId}; available: ${events.T4.map((e) => e.event_id).join(', ')}`);
  return evt;
}

test('trajectory-shape-T4: schema_version pinned to 0.1.0', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.schema_version, '0.1.0');
});

test('trajectory-shape-T4: theatre_id and theatre_template are correct', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.theatre_id, 'T4');
  assert.equal(traj.theatre_template, 'proton_event_cascade');
  assert.equal(traj.event_id, event.event_id);
});

test('trajectory-shape-T4: distribution_shape is bucket_array_5', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.distribution_shape, 'bucket_array_5');
});

test('trajectory-shape-T4: cutoff is window_end + positive integer time_ms', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.cutoff.rule, 'window_end');
  assert.equal(typeof traj.cutoff.time_ms, 'number');
  assert.ok(traj.cutoff.time_ms > 0);
  assert.ok(Number.isInteger(traj.cutoff.time_ms));
  // Sanity: cutoff = trigger_peak + 72h
  const triggerMs = new Date(event.trigger_flare_peak_time).getTime();
  assert.equal(traj.cutoff.time_ms, triggerMs + 72 * 3600_000);
});

test('trajectory-shape-T4: gate_params includes pinned cycle-002 thresholds', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.gate_params.s_scale_threshold, 'S1');
  assert.equal(traj.gate_params.window_hours, 72);
});

test('trajectory-shape-T4: position_history_at_cutoff entries have t_ms <= cutoff and monotone-non-decreasing', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.ok(Array.isArray(traj.position_history_at_cutoff));
  assert.ok(traj.position_history_at_cutoff.length > 0, 'position_history should have at least the initial entry');
  let lastT = -Infinity;
  for (const entry of traj.position_history_at_cutoff) {
    assert.ok(entry.t_ms <= traj.cutoff.time_ms, `t_ms ${entry.t_ms} exceeds cutoff ${traj.cutoff.time_ms}`);
    assert.ok(entry.t_ms >= lastT, `t_ms ${entry.t_ms} regressed from ${lastT}`);
    lastT = entry.t_ms;
  }
});

test('trajectory-shape-T4: position_history_at_cutoff entries have correct field names (t_ms not t, evidence_id not evidence)', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  for (const entry of traj.position_history_at_cutoff) {
    assert.ok('t_ms' in entry, 'expected t_ms field (CONTRACT §3.1 rename from runtime t)');
    assert.ok('evidence_id' in entry, 'expected evidence_id field (CONTRACT §3.1 rename from runtime evidence)');
    assert.ok('p' in entry);
    assert.ok('reason' in entry);
    assert.ok(!('t' in entry), 'should not carry runtime field name `t`');
    assert.ok(!('evidence' in entry), 'should not carry runtime field name `evidence`');
  }
});

test('trajectory-shape-T4: bucket_array_5 has length 5, elements in [0,1], sum ~1', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  const arr = traj.current_position_at_cutoff;
  assert.ok(Array.isArray(arr));
  assert.equal(arr.length, 5);
  for (const p of arr) {
    assert.ok(typeof p === 'number' && p >= 0 && p <= 1, `bucket probability out of [0,1]: ${p}`);
  }
  // Runtime rounds to 3 decimals; CONTRACT §11.1 rule 10 requires sum ∈ [0.999, 1.001].
  // Worst-case rounding drift is ±0.0025 across 5 elements (5 × 0.0005); when the
  // un-rounded sum is exactly 1, the post-rounding sum lands within tolerance for
  // the cycle-001 corpus events.
  const sum = arr.reduce((s, x) => s + x, 0);
  assert.ok(sum >= 0.999 && sum <= 1.001, `sum ${sum} outside CONTRACT [0.999, 1.001] tolerance`);

  // Position-history p arrays must satisfy the same invariant per CONTRACT §11.1 rule 10.
  for (const entry of traj.position_history_at_cutoff) {
    if (Array.isArray(entry.p)) {
      assert.equal(entry.p.length, 5);
      const psum = entry.p.reduce((s, x) => s + x, 0);
      assert.ok(psum >= 0.999 && psum <= 1.001, `position_history.p sum ${psum} outside tolerance`);
    }
  }
});

test('trajectory-shape-T4: outcome.kind is bucket_index, value in [0,4]', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.outcome.kind, 'bucket_index');
  assert.ok(Number.isInteger(traj.outcome.value));
  assert.ok(traj.outcome.value >= 0 && traj.outcome.value <= 4);
  // For 2024-05-11-S2 (3 qualifying events at S1+) → bucket "2-3" → index 1.
  assert.equal(traj.outcome.value, 1, 'expected bucket index 1 for 3 qualifying events (bucket "2-3")');
});

test('trajectory-shape-T4: meta.replay_clock_source pinned to corpus_event_time', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.meta.replay_clock_source, 'corpus_event_time');
});

test('trajectory-shape-T4: meta.runtime_revision matches injected fixture', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.meta.runtime_revision, RUNTIME_REVISION_FIXTURE);
});

test('trajectory-shape-T4: all four hash fields are 64-char lowercase hex', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  for (const field of ['corpus_event_hash', 'cutoff_hash', 'gate_params_hash', 'trajectory_hash']) {
    const v = traj.meta[field];
    assert.equal(typeof v, 'string', `${field} should be string`);
    assert.equal(v.length, 64, `${field} should be 64 hex chars`);
    assert.match(v, /^[0-9a-f]{64}$/, `${field} should be lowercase hex`);
  }
});

test('trajectory-shape-T4: meta.replay_clock_seed equals trigger_flare_peak_time as ms epoch', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.equal(traj.meta.replay_clock_seed, new Date(event.trigger_flare_peak_time).getTime());
});

test('trajectory-shape-T4: trajectory_hash self-verifies (sentinel-out / recompute / compare)', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.ok(verifyTrajectoryHash(traj), 'trajectory_hash should self-verify');
});

test('trajectory-shape-T4: evidence_bundles_consumed lists pre-cutoff bundle ids in time order', () => {
  const event = loadOneT4Event('T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);
  assert.ok(Array.isArray(traj.evidence_bundles_consumed));
  // 2024-05-11-S2 has 3 proton observations all pre-cutoff → 3 bundles consumed.
  assert.equal(traj.evidence_bundles_consumed.length, 3);
  for (const id of traj.evidence_bundles_consumed) {
    assert.match(id, /^replay-t4-proton-T4-2024-05-11-S2-/, `bundle id format: ${id}`);
  }
});

test('trajectory-shape-T4: rejects non-T4 corpus event', () => {
  const fakeT1Event = { theatre: 'T1', event_id: 'fake-T1', _derived: {} };
  const ctx = {
    corpus_event: fakeT1Event,
    theatre_id: 'T4',
    runtime_revision: RUNTIME_REVISION_FIXTURE,
    replay_clock_seed: 0,
    is_replay: true,
  };
  assert.throws(() => replay_T4_event(fakeT1Event, Object.freeze(ctx)), /expected T4 corpus event/);
});

test('trajectory-shape-T4: shape holds for all 5 cycle-001 T4 corpus events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  assert.equal(events.T4.length, 5, 'cycle-001 T4 corpus has 5 events');
  for (const event of events.T4) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const traj = replay_T4_event(event, ctx);
    assert.equal(traj.theatre_id, 'T4');
    assert.equal(traj.distribution_shape, 'bucket_array_5');
    assert.equal(traj.outcome.kind, 'bucket_index');
    assert.ok(verifyTrajectoryHash(traj), `trajectory_hash should self-verify for ${event.event_id}`);
  }
});
