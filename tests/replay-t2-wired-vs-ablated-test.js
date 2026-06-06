/**
 * tests/replay-t2-wired-vs-ablated-test.js
 *
 * Cycle-004 Sprint 03 — T3.3 (wired-vs-ablated observable diff). SPRINT-PLAN §6.4 [G3].
 *
 * Counts AND lists the T2 events whose WIRED (wireEvidence:true) trajectory hash
 * differs from the ABLATED (wireEvidence:false) hash. Every T2 event with at
 * least one strictly-pre-cutoff Kp observation is expected to differ — that is
 * the observable signature of genuine evidence consumption flowing through the
 * (unmodified) processGeomagneticStormGate and moving position_history /
 * current_position. No silent truncation: the full diff list is asserted against
 * the independently-derived pre-cutoff set.
 *
 * This is a deterministic wiring-observability check. It is NOT a rung, NOT
 * forecasting accuracy, NOT calibration improvement, NOT predictive uplift.
 * No scoring.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCorpusWithCutoff,
  _deriveKpPreCutoffObservations,
} from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import {
  buildHashTable,
  _DEFAULT_CORPUS_DIR,
} from '../scripts/corona-backtest-cycle-004-evidence-wiring.js';

// Mirror t2-replay.js: cutoff = kp_window_end; strictly-pre-cutoff via the SAME
// shared helper the wired path uses, so the cross-check tracks the real mechanism.
function parseIsoMs(iso) {
  if (typeof iso === 'number' && Number.isFinite(iso)) return iso;
  if (typeof iso !== 'string') return NaN;
  return new Date(iso).getTime();
}

test('T2 wired != ablated exactly for events with >=1 strictly-pre-cutoff Kp observation', () => {
  const wired = buildHashTable({ state: 'wired' });
  const ablated = buildHashTable({ state: 'ablated' });
  const t2idx = (t) =>
    Object.fromEntries(t.events.filter((r) => r.theatre === 'T2').map((r) => [r.event_id, r.trajectory_hash]));
  const W = t2idx(wired);
  const A = t2idx(ablated);
  const t2Ids = Object.keys(W).sort();
  assert.equal(t2Ids.length, 30, '30 T2 events in the cycle-003 corpus');

  // Observable diff set.
  const diffIds = t2Ids.filter((id) => W[id] !== A[id]).sort();

  // Independently-derived "has >=1 strictly-pre-cutoff observation" set.
  const { events } = loadCorpusWithCutoff(_DEFAULT_CORPUS_DIR, { theatres: ['T2'] });
  const withPreCutoff = [];
  for (const ev of events.T2) {
    const cutoffMs = parseIsoMs(ev.kp_window_end);
    const pre = Array.isArray(ev.kp_observations)
      ? _deriveKpPreCutoffObservations(ev.kp_observations, cutoffMs)
      : [];
    if (pre.length > 0) withPreCutoff.push(ev.event_id);
  }
  withPreCutoff.sort();

  // Explicit, non-truncated report.
  console.log(`[T3.3] T2 events: ${t2Ids.length}`);
  console.log(`[T3.3] T2 events with >=1 strictly-pre-cutoff Kp obs: ${withPreCutoff.length}`);
  console.log(`[T3.3] T2 wired != ablated count: ${diffIds.length}`);
  console.log(`[T3.3] wired!=ablated event ids:\n  ${diffIds.join('\n  ')}`);

  assert.ok(diffIds.length > 0,
    'at least one T2 event MUST differ wired-vs-ablated (else wiring is inert — HS-6)');
  assert.deepEqual(diffIds, withPreCutoff,
    'the wired!=ablated set MUST equal the set of T2 events with a strictly-pre-cutoff observation ' +
    '(genuine consumption, not metadata-only)');
});
