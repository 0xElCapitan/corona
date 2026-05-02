/**
 * tests/replay-T4-scored-through-runtime-bucket-test.js
 *
 * Sprint 2 MILESTONE 1 BINDING PROOF.
 *
 * Per operator's expected first implementation milestone:
 *   "T4 deterministic runtime replay trajectory generated twice with
 *    byte-identical output AND scored through the runtime-bucket path
 *    without touching cycle-001 artifacts."
 *
 * This test proves the END-TO-END seam:
 *   1. Replay a T4 corpus event → trajectory.current_position_at_cutoff (5-bucket array)
 *   2. Pass it as predictedDistribution to existing scoreEventT4 (cycle-001 scoring API, unchanged)
 *   3. Brier score is computable, deterministic, and bounded
 *
 * No modification to scripts/corona-backtest/scoring/* (Sprint 3 territory).
 * No modification to cycle-001 manifest, run outputs, or any other frozen artifact.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T4_event } from '../scripts/corona-backtest/replay/t4-replay.js';
import { scoreEventT4 } from '../scripts/corona-backtest/scoring/t4-bucket-brier.js';

const RUNTIME_REVISION_FIXTURE = 'test-rev-milestone1';

test('milestone-1: T4 trajectory.current_position_at_cutoff scored through scoreEventT4 (unchanged cycle-001 scoring)', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  const event = events.T4.find((e) => e.event_id === 'T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);

  const result = scoreEventT4(event, traj.current_position_at_cutoff);

  assert.equal(typeof result.brier_score, 'number');
  assert.ok(Number.isFinite(result.brier_score));
  assert.ok(result.brier_score >= 0);
  assert.ok(result.brier_score <= 1);

  // Verify the scoring path used the trajectory's distribution
  // (scoreEventT4 returns this field as `s_event_count_predicted_distribution` per t4-bucket-brier.js:65)
  assert.deepStrictEqual(result.s_event_count_predicted_distribution, traj.current_position_at_cutoff,
    'scoreEventT4 should consume the trajectory distribution verbatim');

  // Verify outcome bucket consistency between trajectory and scoring
  assert.equal(result.bucket_observed, traj.outcome.value,
    'trajectory outcome.value should equal scoring bucket_observed');
});

test('milestone-1: scoring is deterministic (replay twice → same Brier score)', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  const event = events.T4.find((e) => e.event_id === 'T4-2024-05-11-S2');
  const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj1 = replay_T4_event(event, ctx1);
  const traj2 = replay_T4_event(event, ctx2);
  const r1 = scoreEventT4(event, traj1.current_position_at_cutoff);
  const r2 = scoreEventT4(event, traj2.current_position_at_cutoff);
  assert.equal(r1.brier_score, r2.brier_score, 'two replays must produce identical Brier scores');
});

test('milestone-1: T4 trajectory scoring across all 5 cycle-001 corpus events produces finite Brier in [0, 1]', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  assert.equal(events.T4.length, 5);
  const summary = [];
  for (const event of events.T4) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const traj = replay_T4_event(event, ctx);
    const result = scoreEventT4(event, traj.current_position_at_cutoff);
    assert.ok(Number.isFinite(result.brier_score), `${event.event_id}: brier_score not finite`);
    assert.ok(result.brier_score >= 0 && result.brier_score <= 1, `${event.event_id}: brier_score out of [0,1]`);
    summary.push({
      event_id: event.event_id,
      observed_count: event._derived.qualifying_event_count_observed_derived,
      observed_bucket: traj.outcome.value,
      predicted_distribution: traj.current_position_at_cutoff,
      brier: result.brier_score,
    });
  }
  // Sanity: at least one of the 5 events produces a non-trivial Brier (not all zero, not all max).
  // The runtime trajectory is a real prediction, so Brier scores should reflect model error.
  const briers = summary.map((s) => s.brier);
  assert.ok(briers.some((b) => b > 0), 'at least one corpus event should produce non-zero Brier');
});

test('milestone-1: runtime trajectory differs from UNIFORM_PRIOR (proves runtime is wired, not falling through to default)', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  const event = events.T4.find((e) => e.event_id === 'T4-2024-05-11-S2');
  const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const traj = replay_T4_event(event, ctx);

  const UNIFORM_PRIOR_5 = [0.2, 0.2, 0.2, 0.2, 0.2];
  // Compute L1 distance to uniform prior — runtime distribution should NOT be uniform.
  const l1 = traj.current_position_at_cutoff.reduce((s, p, i) => s + Math.abs(p - UNIFORM_PRIOR_5[i]), 0);
  assert.ok(l1 > 0.1,
    `runtime trajectory should differ measurably from uniform prior (L1 = ${l1}); ` +
    `if l1 ≈ 0, the runtime path is silently emitting the default distribution and Sprint 2 is NOT runtime-wired`);
});
