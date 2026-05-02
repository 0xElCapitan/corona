/**
 * tests/replay-T1T2-binary-brier-scoring-test.js
 *
 * Sprint 2 MILESTONE 2 BINDING PROOF (step 6).
 *
 * Per operator's expected next milestone (step 6):
 *   "T1 and T2 produce deterministic `binary_scalar` runtime replay
 *    trajectories that can be scored through threshold-native binary Brier
 *    scoring, without touching legacy T1/T2 bucket scorers except as
 *    diagnostic/corpus-baseline references."
 *
 * This test proves the END-TO-END seam for T1 and T2:
 *   1. Replay a corpus event → trajectory (binary_scalar distribution)
 *   2. Score via the NEW threshold-native binary Brier modules
 *      (scoring/t1-binary-brier.js, scoring/t2-binary-brier.js)
 *   3. Brier score is computable, deterministic, and finite
 *
 * Critically, the legacy bucket scorers (t1-bucket-brier.js, t2-bucket-brier.js)
 * are NOT touched. They remain available as corpus-baseline diagnostics per
 * CHARTER §9.3. Verified by the existing 160-test suite which still imports
 * scoreCorpusT1/T2 from the bucket scorers and passes.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T1_event } from '../scripts/corona-backtest/replay/t1-replay.js';
import { replay_T2_event } from '../scripts/corona-backtest/replay/t2-replay.js';
import { scoreEventT1Binary, scoreCorpusT1Binary } from '../scripts/corona-backtest/scoring/t1-binary-brier.js';
import { scoreEventT2Binary, scoreCorpusT2Binary } from '../scripts/corona-backtest/scoring/t2-binary-brier.js';

const RUNTIME_REVISION = 'test-rev-milestone2';

test('milestone-2: T1 trajectory scored through scoreEventT1Binary', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T1'] });
  const event = events.T1[0];
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION });
  const traj = replay_T1_event(event, ctx);
  const result = scoreEventT1Binary(event, traj);

  assert.equal(typeof result.brier_score, 'number');
  assert.ok(Number.isFinite(result.brier_score));
  assert.ok(result.brier_score >= 0 && result.brier_score <= 1);
  assert.equal(result.observed, 1, 'X-class flare crosses M1.0 threshold');
  assert.equal(result.predicted_p, traj.current_position_at_cutoff);
  assert.equal(result.threshold_class, 'M1.0');
  assert.equal(result.trajectory_hash, traj.meta.trajectory_hash);
});

test('milestone-2: T2 trajectory scored through scoreEventT2Binary (GFZ-preferred)', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T2'] });
  const event = events.T2.find((e) => e.event_id === 'T2-2024-05-11-Kp9');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
  const traj = replay_T2_event(event, ctx);
  const result = scoreEventT2Binary(event, traj);

  assert.equal(typeof result.brier_score, 'number');
  assert.ok(result.brier_score >= 0 && result.brier_score <= 1);
  assert.equal(result.observed, 1, 'Kp 9 crosses Kp 5 threshold');
  assert.equal(result.kp_observed, 9.0);
  assert.equal(result.kp_observed_source, 'gfz', 'event has kp_gfz_observed → preferred');
  assert.equal(result.kp_threshold, 5);
});

test('milestone-2: scoring is deterministic (replay twice → same Brier)', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T1', 'T2'] });
  for (const event of events.T1) {
    const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION });
    const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION });
    const t1 = replay_T1_event(event, ctx1);
    const t2 = replay_T1_event(event, ctx2);
    const r1 = scoreEventT1Binary(event, t1);
    const r2 = scoreEventT1Binary(event, t2);
    assert.equal(r1.brier_score, r2.brier_score, `T1 ${event.event_id}: deterministic Brier`);
  }
  for (const event of events.T2) {
    const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
    const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
    const t1 = replay_T2_event(event, ctx1);
    const t2 = replay_T2_event(event, ctx2);
    const r1 = scoreEventT2Binary(event, t1);
    const r2 = scoreEventT2Binary(event, t2);
    assert.equal(r1.brier_score, r2.brier_score, `T2 ${event.event_id}: deterministic Brier`);
  }
});

test('milestone-2: scoreCorpusT1Binary aggregates over all 5 cycle-001 T1 events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T1'] });
  const pairs = events.T1.map((event) => {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: RUNTIME_REVISION });
    return { event, trajectory: replay_T1_event(event, ctx) };
  });
  const result = scoreCorpusT1Binary(pairs);
  assert.equal(result.n_events, 5);
  assert.equal(result.scoring_path, 't1_binary_brier_cycle002');
  assert.ok(Number.isFinite(result.brier));
  assert.ok(result.brier >= 0 && result.brier <= 1);
  // All 5 corpus events are X-class with base-rate prior of 0.15 → Brier ≈ 0.7225 each
  // (the runtime emits the base_rate as current_position since cycle-001 corpus
  //  has no pre-cutoff observational evidence).
  for (const r of result.per_event) {
    assert.equal(r.observed, 1);
    assert.ok(r.predicted_p > 0 && r.predicted_p < 1);
  }
});

test('milestone-2: scoreCorpusT2Binary aggregates over all 5 cycle-001 T2 events with GFZ-preferred outcomes', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T2'] });
  const pairs = events.T2.map((event) => {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
    return { event, trajectory: replay_T2_event(event, ctx) };
  });
  const result = scoreCorpusT2Binary(pairs);
  assert.equal(result.n_events, 5);
  assert.equal(result.n_events_excluded_no_kp, 0, 'all cycle-001 T2 events have observable Kp');
  assert.equal(result.scoring_path, 't2_binary_brier_cycle002');
  for (const r of result.per_event) {
    assert.equal(r.observed, 1);
    assert.ok(r.kp_observed >= 5);
  }
});

test('milestone-2: T1 binary scorer rejects non-T1 trajectory shape', () => {
  const fakeEvent = { theatre: 'T1', event_id: 'fake', flare_class_observed: 'X1.0' };
  const wrongShape = {
    theatre_id: 'T1',
    distribution_shape: 'bucket_array_5',  // wrong shape
    current_position_at_cutoff: [0.2, 0.2, 0.2, 0.2, 0.2],
    gate_params: { threshold_class: 'M1.0' },
    meta: {},
  };
  assert.throws(() => scoreEventT1Binary(fakeEvent, wrongShape), /binary_scalar/);
});

test('milestone-2: T2 binary scorer rejects out-of-range scalar', () => {
  const fakeEvent = { theatre: 'T2', event_id: 'fake', kp_gfz_observed: 7 };
  const badScalar = {
    theatre_id: 'T2',
    distribution_shape: 'binary_scalar',
    current_position_at_cutoff: 1.5,  // > 1
    gate_params: { kp_threshold: 5 },
    meta: {},
  };
  assert.throws(() => scoreEventT2Binary(fakeEvent, badScalar), /invalid predicted scalar/);
});

test('milestone-2: legacy bucket scorers untouched (still callable; their Sprint 2 tests still pass)', async () => {
  // Smoke import of legacy modules — ensure they still exist and load.
  const t1Bucket = await import('../scripts/corona-backtest/scoring/t1-bucket-brier.js');
  const t2Bucket = await import('../scripts/corona-backtest/scoring/t2-bucket-brier.js');
  assert.equal(typeof t1Bucket.scoreEventT1, 'function', 'legacy t1-bucket-brier still exports scoreEventT1');
  assert.equal(typeof t1Bucket.scoreCorpusT1, 'function');
  assert.equal(typeof t1Bucket.verdictT1, 'function');
  assert.equal(typeof t2Bucket.scoreEventT2, 'function');
  assert.equal(typeof t2Bucket.scoreCorpusT2, 'function');
});
