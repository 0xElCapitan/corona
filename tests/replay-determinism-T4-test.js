/**
 * tests/replay-determinism-T4-test.js
 *
 * Sprint 2 milestone-1 test #5 per REPLAY-SEAM.md §10 and CONTRACT.md §9.1.
 *
 * RUNG 1 BINDING GATE: replay-twice byte-identical trajectory JSON across
 * (corpus_event, runtime_revision, contract_version) triples. If this test
 * fails, the replay path is non-deterministic and Rung 1 is not earned.
 *
 * Tests all 5 cycle-001 T4 corpus events.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { loadCorpus } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T4_event } from '../scripts/corona-backtest/replay/t4-replay.js';
import { canonicalize } from '../scripts/corona-backtest/replay/canonical-json.js';

const RUNTIME_REVISION_FIXTURE = 'test-rev-determinism-T4';

test('determinism-T4: replay twice produces byte-identical canonical JSON for 2024-05-11-S2', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  const event = events.T4.find((e) => e.event_id === 'T4-2024-05-11-S2');
  assert.ok(event != null, '2024-05-11-S2 should be in cycle-001 T4 corpus');

  // Two independent replay contexts with identical inputs.
  const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
  assert.notEqual(ctx1, ctx2, 'contexts should be distinct objects');

  const traj1 = replay_T4_event(event, ctx1);
  const traj2 = replay_T4_event(event, ctx2);

  const bytes1 = canonicalize(traj1);
  const bytes2 = canonicalize(traj2);

  assert.equal(bytes1, bytes2, 'two independent replays must produce byte-identical canonical JSON');
  assert.equal(traj1.meta.trajectory_hash, traj2.meta.trajectory_hash, 'trajectory_hash must be identical');
});

test('determinism-T4: replay-twice byte-identical for ALL 5 cycle-001 T4 corpus events', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  assert.equal(events.T4.length, 5);

  for (const event of events.T4) {
    const ctx1 = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });
    const ctx2 = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: RUNTIME_REVISION_FIXTURE });

    const traj1 = replay_T4_event(event, ctx1);
    const traj2 = replay_T4_event(event, ctx2);

    const bytes1 = canonicalize(traj1);
    const bytes2 = canonicalize(traj2);

    assert.equal(bytes1, bytes2,
      `byte-identical replay failed for ${event.event_id}\n` +
      `bytes1: ${bytes1.slice(0, 200)}\n` +
      `bytes2: ${bytes2.slice(0, 200)}`);
  }
});

test('determinism-T4: different runtime_revision produces different trajectory_hash (provenance is hashed)', () => {
  const { events } = loadCorpus(undefined, { theatres: ['T4'] });
  const event = events.T4.find((e) => e.event_id === 'T4-2024-05-11-S2');
  const ctxA = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: 'rev-A' });
  const ctxB = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: 'rev-B' });
  const trajA = replay_T4_event(event, ctxA);
  const trajB = replay_T4_event(event, ctxB);
  assert.notEqual(trajA.meta.trajectory_hash, trajB.meta.trajectory_hash,
    'changing runtime_revision must change trajectory_hash');
  // But corpus_event_hash, cutoff_hash, gate_params_hash should match (those don't depend on revision).
  assert.equal(trajA.meta.corpus_event_hash, trajB.meta.corpus_event_hash);
  assert.equal(trajA.meta.cutoff_hash, trajB.meta.cutoff_hash);
  assert.equal(trajA.meta.gate_params_hash, trajB.meta.gate_params_hash);
});

test('determinism-T4: replay seam never falls back to Date.now() (fail-closed)', () => {
  // Construct a corpus event missing the canonical seed field.
  const event = {
    theatre: 'T4',
    event_id: 'T4-fail-closed-test',
    // intentionally missing trigger_flare_peak_time
    prediction_window_hours: 72,
    proton_flux_observations: [],
    _derived: {
      qualifying_event_count_observed_derived: 0,
      bucket_observed: 0,
    },
  };
  // createReplayContext should throw because deriveReplayClockSeed has no valid field.
  assert.throws(
    () => createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: 'rev-test' }),
    /cannot derive replay_clock_seed/,
    'replay-mode fail-closed: missing seed field must throw, not fall back to Date.now()',
  );
});
