/**
 * tests/replay-t2-genuine-consumption-test.js
 *
 * CORONA cycle-004 Sprint 02 — Layer-A genuine evidence consumption (SDD §8).
 *
 * Pins SPRINT-PLAN §5.5 / SDD §11 (replay-t2-genuine-consumption-test) +
 * acceptance §5.6 (HS-3 hollow-proof rejection):
 *   - replay_T2_event(event, ctx, { wireEvidence: true }) produces REAL
 *     position_history updates for events with pre-cutoff observations;
 *   - wired position_history length > default-off baseline;
 *   - evidence_bundles_consumed is non-empty when wired;
 *   - current_position_at_cutoff changes when evidence genuinely moves the gate;
 *   - default-off (option-absent AND { wireEvidence:false }) stays baseline with
 *     evidence_bundles_consumed: [];
 *   - NO metadata-only proof: the position_history MUST grow by exactly one
 *     entry per consumed bundle (each bundle ran through processGeomagneticStorm-
 *     Gate's provisional path), so consumption is structural, not a bundle-id
 *     label change. If evidence_bundles_consumed changed but position_history /
 *     current_position did not reflect the gate, these assertions fail.
 *
 * Additive test, run via explicit `node --test` (OD-2: package.json untouched).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { CALIBRATION_DIR } from '../scripts/corona-backtest/config.js';
import { loadCorpusWithCutoff } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T2_event } from '../scripts/corona-backtest/replay/t2-replay.js';

const RUNTIME_REVISION = 'test-rev-genuine-consumption-T2';

function loadT2EventsWithObservations() {
  const corpus = resolve(CALIBRATION_DIR, 'corpus-cycle-003');
  const { events, errors } = loadCorpusWithCutoff(corpus, { theatres: ['T2'] });
  assert.equal(errors.length, 0, `corpus load errors: ${errors.join(', ')}`);
  const withObs = events.T2.filter(
    (e) => Array.isArray(e.kp_observations) && e.kp_observations.length > 0,
  );
  assert.ok(withObs.length > 0, 'expected >=1 cycle-003 T2 event with kp_observations');
  return withObs;
}

function mkCtx(event) {
  return createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
}

test('genuine-consumption-T2: wired produces real position_history updates (len > baseline)', () => {
  for (const event of loadT2EventsWithObservations()) {
    const baseline = replay_T2_event(event, mkCtx(event)); // option absent
    const wired = replay_T2_event(event, mkCtx(event), { wireEvidence: true });
    assert.ok(
      wired.position_history_at_cutoff.length > baseline.position_history_at_cutoff.length,
      `${event.event_id}: wired position_history (${wired.position_history_at_cutoff.length}) ` +
        `must exceed baseline (${baseline.position_history_at_cutoff.length})`,
    );
    assert.equal(baseline.position_history_at_cutoff.length, 1, `${event.event_id}: baseline must be prior-only (len 1)`);
  }
});

test('genuine-consumption-T2: evidence_bundles_consumed non-empty when wired', () => {
  for (const event of loadT2EventsWithObservations()) {
    const wired = replay_T2_event(event, mkCtx(event), { wireEvidence: true });
    assert.ok(Array.isArray(wired.evidence_bundles_consumed));
    assert.ok(wired.evidence_bundles_consumed.length > 0, `${event.event_id}: expected consumed bundles`);
    // Bundle ids are event- and observation-specific (deterministic, stable).
    for (const id of wired.evidence_bundles_consumed) {
      assert.match(id, new RegExp(`^replay-t2-kp-${event.event_id}-`));
    }
    // Unique bundle ids (one per observation).
    assert.equal(new Set(wired.evidence_bundles_consumed).size, wired.evidence_bundles_consumed.length);
  }
});

test('genuine-consumption-T2: current_position changes when evidence moves the gate', () => {
  let movedAtLeastOne = 0;
  for (const event of loadT2EventsWithObservations()) {
    const baseline = replay_T2_event(event, mkCtx(event));
    const wired = replay_T2_event(event, mkCtx(event), { wireEvidence: true });
    // The cycle-003 lead-in series always contains threshold-adjacent Kp that
    // shifts the provisional position off the base rate. Track and require >=1.
    if (wired.current_position_at_cutoff !== baseline.current_position_at_cutoff) movedAtLeastOne += 1;
  }
  assert.ok(movedAtLeastOne > 0, 'expected at least one event where wired evidence moved current_position');
});

test('genuine-consumption-T2: NOT metadata-only — history grows one entry per consumed bundle', () => {
  for (const event of loadT2EventsWithObservations()) {
    const baseline = replay_T2_event(event, mkCtx(event));
    const wired = replay_T2_event(event, mkCtx(event), { wireEvidence: true });
    // Structural anti-hollow-proof (HS-3): each consumed kp_index bundle runs
    // through processGeomagneticStormGate's provisional path, which appends
    // exactly one position_history entry (never resolves under evidence_class
    // 'provisional'). So wired history length == baseline (1 prior) + N consumed.
    assert.equal(
      wired.position_history_at_cutoff.length,
      baseline.position_history_at_cutoff.length + wired.evidence_bundles_consumed.length,
      `${event.event_id}: position_history did not grow 1:1 with consumed bundles ` +
        `(would indicate metadata-only consumption)`,
    );
    // The trajectory hash differs (history + current_position changed), proving
    // the difference is not a bundle-id label swap.
    assert.notEqual(wired.meta.trajectory_hash, baseline.meta.trajectory_hash);
    // Every wired history entry beyond the prior cites a consumed bundle id.
    const consumed = new Set(wired.evidence_bundles_consumed);
    const cited = wired.position_history_at_cutoff
      .map((e) => e.evidence_id)
      .filter((id) => id != null);
    assert.equal(cited.length, wired.evidence_bundles_consumed.length);
    for (const id of cited) assert.ok(consumed.has(id), `${event.event_id}: history cites unconsumed bundle ${id}`);
  }
});

test('genuine-consumption-T2: default-off (absent AND wireEvidence:false) stays baseline', () => {
  for (const event of loadT2EventsWithObservations()) {
    const absent = replay_T2_event(event, mkCtx(event));
    const explicitOff = replay_T2_event(event, mkCtx(event), { wireEvidence: false });
    // Both default paths: empty consumption, prior-only history, identical hash.
    assert.deepEqual(absent.evidence_bundles_consumed, []);
    assert.deepEqual(explicitOff.evidence_bundles_consumed, []);
    assert.equal(absent.position_history_at_cutoff.length, 1);
    assert.equal(explicitOff.position_history_at_cutoff.length, 1);
    assert.equal(
      absent.meta.trajectory_hash,
      explicitOff.meta.trajectory_hash,
      `${event.event_id}: option-absent and wireEvidence:false must be byte-identical`,
    );
  }
});

test('genuine-consumption-T2: field-less event remains a no-op even when wired', () => {
  // A T2 event without kp_observations[] must stay baseline even with
  // wireEvidence:true (field-presence gate, SDD §3.3).
  const fieldless = {
    event_id: 'T2-fieldless',
    theatre: 'T2',
    kp_window_start: '2024-03-01T00:00:00Z',
    kp_window_end: '2024-03-04T00:00:00Z',
    kp_swpc_observed: 6.0,
    kp_gfz_observed: 6.0,
  };
  const ctx = () => createReplayContext({ corpus_event: fieldless, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
  const off = replay_T2_event(fieldless, ctx());
  const onButFieldless = replay_T2_event(fieldless, ctx(), { wireEvidence: true });
  assert.deepEqual(onButFieldless.evidence_bundles_consumed, []);
  assert.equal(onButFieldless.position_history_at_cutoff.length, 1);
  assert.equal(off.meta.trajectory_hash, onButFieldless.meta.trajectory_hash);
});
