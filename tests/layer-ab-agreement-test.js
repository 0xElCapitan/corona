/**
 * tests/layer-ab-agreement-test.js
 *
 * CORONA cycle-004 Sprint 02 — Layer-A / Layer-B shared-helper agreement
 * (SDD §7 DRY invariant).
 *
 * Pins SPRINT-PLAN §5.5 / SDD §11 (layer-ab-agreement-test):
 *   - Layer-A bundle event_time values match Layer-B evidence.pre_cutoff
 *     event_time_ms values for each event;
 *   - both layers use the SAME strict-`<` cutoff and the SAME ascending sort;
 *   - no divergence between loader evidence (Layer B) and replay bundle times
 *     (Layer A).
 *
 * Mechanism: both layers derive from the single shared helper
 * deriveKpPreCutoffObservations (corpus-loader.js, exposed as the `_`-prefixed
 * test export). Layer B maps it into evidence.pre_cutoff; Layer A maps it into
 * kp_index bundles with bundle_id `replay-t2-kp-${event_id}-${obs.time}` and
 * payload.event_time = obs.event_time_ms. This test proves they cannot diverge.
 *
 * Additive test, run via explicit `node --test` (OD-2: package.json untouched).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { CALIBRATION_DIR } from '../scripts/corona-backtest/config.js';
import {
  loadCorpusWithCutoff,
  _deriveKpPreCutoffObservations,
  _CUTOFF_DERIVATIONS,
} from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T2_event } from '../scripts/corona-backtest/replay/t2-replay.js';

const RUNTIME_REVISION = 'test-rev-layer-ab-agreement';
const deriveCutoffT2 = _CUTOFF_DERIVATIONS.T2;

function loadT2WithObservations() {
  const corpus = resolve(CALIBRATION_DIR, 'corpus-cycle-003');
  const { events, evidence, cutoffs, errors } = loadCorpusWithCutoff(corpus, { theatres: ['T2'] });
  assert.equal(errors.length, 0, `corpus load errors: ${errors.join(', ')}`);
  const withObs = events.T2.filter((e) => Array.isArray(e.kp_observations) && e.kp_observations.length > 0);
  assert.ok(withObs.length > 0, 'expected >=1 cycle-003 T2 event with kp_observations');
  return { withObs, evidence, cutoffs };
}

// Reconstruct each consumed observation's time string from its bundle_id by
// stripping the deterministic `replay-t2-kp-${event_id}-` prefix.
function obsTimeFromBundleId(bundleId, eventId) {
  const prefix = `replay-t2-kp-${eventId}-`;
  assert.ok(bundleId.startsWith(prefix), `bundle_id "${bundleId}" missing expected prefix`);
  return bundleId.slice(prefix.length);
}

test('layer-ab: Layer-B pre_cutoff == shared-helper output (Layer B uses the helper)', () => {
  const { withObs, evidence, cutoffs } = loadT2WithObservations();
  for (const event of withObs) {
    const cutoff = cutoffs[event.event_id];
    const helperOut = _deriveKpPreCutoffObservations(event.kp_observations, cutoff.time_ms);
    assert.deepEqual(evidence[event.event_id].pre_cutoff, helperOut, `${event.event_id}: Layer-B diverged from helper`);
  }
});

test('layer-ab: both layers use the SAME strict cutoff', () => {
  const { withObs, cutoffs } = loadT2WithObservations();
  for (const event of withObs) {
    // Layer B cutoff (loader) vs an independent recompute from kp_window_end.
    const layerBCutoff = cutoffs[event.event_id].time_ms;
    const recompute = deriveCutoffT2(event).time_ms;
    // Layer A computes cutoffMs = new Date(kp_window_end).getTime() internally.
    const layerACutoff = new Date(event.kp_window_end).getTime();
    assert.equal(layerBCutoff, recompute, `${event.event_id}: loader cutoff drift`);
    assert.equal(layerACutoff, layerBCutoff, `${event.event_id}: Layer-A vs Layer-B cutoff drift`);
  }
});

test('layer-ab: Layer-A bundle event_time values match Layer-B pre_cutoff event_time_ms', () => {
  const { withObs, evidence } = loadT2WithObservations();
  for (const event of withObs) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: RUNTIME_REVISION });
    const wired = replay_T2_event(event, ctx, { wireEvidence: true });

    const layerB = evidence[event.event_id].pre_cutoff;
    const layerBTimesMs = layerB.map((r) => r.event_time_ms);

    // (1) Same count.
    assert.equal(
      wired.evidence_bundles_consumed.length,
      layerB.length,
      `${event.event_id}: Layer-A bundle count != Layer-B pre_cutoff count`,
    );

    // (2) Same observation set + order: bundle ids are exactly the Layer-B
    // entries' times, in Layer-B order.
    const expectedBundleIds = layerB.map((r) => `replay-t2-kp-${event.event_id}-${r.time}`);
    assert.deepEqual(
      wired.evidence_bundles_consumed,
      expectedBundleIds,
      `${event.event_id}: Layer-A consumed-bundle order/set diverged from Layer-B`,
    );

    // (3) Numeric event_time agreement: reconstruct each bundle's obs time and
    // re-parse to ms, comparing to Layer-B event_time_ms (and ascending).
    const layerATimesMs = wired.evidence_bundles_consumed.map((id) =>
      new Date(obsTimeFromBundleId(id, event.event_id)).getTime(),
    );
    assert.deepEqual(layerATimesMs, layerBTimesMs, `${event.event_id}: Layer-A event_time != Layer-B event_time_ms`);

    // (4) Both ascending, no divergence.
    const ascending = [...layerBTimesMs].sort((a, b) => a - b);
    assert.deepEqual(layerBTimesMs, ascending, `${event.event_id}: Layer-B not ascending`);
    assert.deepEqual(layerATimesMs, ascending, `${event.event_id}: Layer-A not ascending`);
  }
});
