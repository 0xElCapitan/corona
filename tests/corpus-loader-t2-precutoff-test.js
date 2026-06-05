/**
 * tests/corpus-loader-t2-precutoff-test.js
 *
 * CORONA cycle-004 Sprint 02 — Layer-B deriveEvidenceT2 pre-cutoff derivation.
 *
 * Pins SPRINT-PLAN §5.5 / SDD §11 (corpus-loader-t2-precutoff-test):
 *   - deriveEvidenceT2 derives evidence.pre_cutoff from kp_observations[];
 *   - every entry is STRICTLY < cutoff (zero entries >= cutoff — leakage-free);
 *   - ascending event_time_ms sort;
 *   - field-less event → pre_cutoff: [] and does NOT throw;
 *   - settlement block remains present and unchanged;
 *   - no settlement label appears inside a pre_cutoff entry.
 *
 * Additive test, run via explicit `node --test` (OD-2: package.json untouched).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { CALIBRATION_DIR } from '../scripts/corona-backtest/config.js';
import {
  loadCorpusWithCutoff,
  _EVIDENCE_DERIVATIONS,
  _CUTOFF_DERIVATIONS,
  _deriveKpPreCutoffObservations,
} from '../scripts/corona-backtest/ingestors/corpus-loader.js';

const deriveEvidenceT2 = _EVIDENCE_DERIVATIONS.T2;
const deriveCutoffT2 = _CUTOFF_DERIVATIONS.T2;

const CUTOFF_ISO = '2024-01-01T12:00:00Z';
const CUTOFF_MS = new Date(CUTOFF_ISO).getTime();

// The five canonical kpObservation keys (kp-observations.schema.json $defs).
const PRE_CUTOFF_KEYS = ['event_time_ms', 'time', 'kp', 'index', 'provenance', 'satellite'];
// Settlement labels that MUST NEVER appear inside a pre_cutoff entry (T2S-3).
const SETTLEMENT_LABELS = ['kp_swpc_observed', 'kp_gfz_observed'];

// Synthetic T2 event: out-of-order observations, one EXACTLY at cutoff (must be
// excluded by strict `<`), settlement peak Kp lives only in the event body.
function syntheticT2Event(overrides = {}) {
  return {
    event_id: 'T2-synthetic-precutoff',
    theatre: 'T2',
    kp_window_start: '2024-01-01T00:00:00Z',
    kp_window_end: CUTOFF_ISO, // deriveCutoffT2 = kp_window_end
    kp_swpc_observed: 6.0,
    kp_gfz_observed: 6.333,
    kp_observations: [
      { time: '2024-01-01T06:00:00Z', kp: 2.0, index: 'Kp', provenance: 'gfz_definitive', satellite: null },
      { time: '2024-01-01T09:00:00Z', kp: 3.667, index: 'Kp', provenance: 'swpc_provisional', satellite: null },
      { time: CUTOFF_ISO, kp: 9.0, index: 'Kp', provenance: 'gfz_definitive', satellite: null }, // AT cutoff → excluded
      { time: '2024-01-01T03:00:00Z', kp: 1.0, index: 'Kp', provenance: 'gfz_definitive', satellite: null }, // earliest, out of order
    ],
    ...overrides,
  };
}

test('precutoff-T2: derives pre_cutoff from kp_observations[] (non-empty)', () => {
  const event = syntheticT2Event();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  assert.ok(Array.isArray(ev.pre_cutoff));
  // 4 observations, one AT cutoff excluded → 3 derived.
  assert.equal(ev.pre_cutoff.length, 3);
  for (const entry of ev.pre_cutoff) {
    assert.equal(typeof entry.event_time_ms, 'number');
    assert.equal(typeof entry.time, 'string');
    assert.equal(typeof entry.kp, 'number');
  }
});

test('precutoff-T2: every entry is STRICTLY < cutoff (zero entries >= cutoff)', () => {
  const event = syntheticT2Event();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  const violations = ev.pre_cutoff.filter((e) => e.event_time_ms >= cutoff.time_ms);
  assert.equal(violations.length, 0, `expected 0 entries >= cutoff, got ${violations.length}`);
  for (const entry of ev.pre_cutoff) {
    assert.ok(entry.event_time_ms < cutoff.time_ms);
  }
  // The settlement-window sample exactly AT cutoff (kp=9) must NOT appear.
  assert.equal(ev.pre_cutoff.some((e) => e.time === CUTOFF_ISO), false);
  assert.equal(ev.pre_cutoff.some((e) => e.kp === 9.0), false);
});

test('precutoff-T2: ascending event_time_ms sort', () => {
  const event = syntheticT2Event();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  const times = ev.pre_cutoff.map((e) => e.event_time_ms);
  const sorted = [...times].sort((a, b) => a - b);
  assert.deepEqual(times, sorted);
  // Concretely: 03:00 < 06:00 < 09:00.
  assert.deepEqual(
    ev.pre_cutoff.map((e) => e.time),
    ['2024-01-01T03:00:00Z', '2024-01-01T06:00:00Z', '2024-01-01T09:00:00Z'],
  );
});

test('precutoff-T2: field-less event → pre_cutoff: [] and does NOT throw', () => {
  const cutoff = { time_ms: CUTOFF_MS, rule: 'first_threshold_crossing_or_window_end' };
  // (a) kp_observations key absent entirely.
  const noField = { event_id: 'T2-no-field', theatre: 'T2', kp_swpc_observed: 5.0, kp_gfz_observed: null };
  let ev;
  assert.doesNotThrow(() => { ev = deriveEvidenceT2(noField, cutoff); });
  assert.deepEqual(ev.pre_cutoff, []);
  // (b) kp_observations explicitly undefined / null / non-array.
  for (const bad of [undefined, null, 'not-an-array', 42, {}]) {
    const evt = { event_id: 'T2-bad', theatre: 'T2', kp_observations: bad };
    let out;
    assert.doesNotThrow(() => { out = deriveEvidenceT2(evt, cutoff); });
    assert.deepEqual(out.pre_cutoff, []);
  }
  // Helper itself is field-less-safe (Layer A relies on this).
  assert.deepEqual(_deriveKpPreCutoffObservations(undefined, CUTOFF_MS), []);
  assert.deepEqual(_deriveKpPreCutoffObservations(null, CUTOFF_MS), []);
});

test('precutoff-T2: settlement block present and unchanged', () => {
  const event = syntheticT2Event();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  assert.deepEqual(ev.settlement, {
    kp_swpc_observed: 6.0,
    kp_gfz_observed: 6.333,
  });
  // null gfz settlement is preserved as null (not dropped).
  const lagged = syntheticT2Event({ kp_gfz_observed: null });
  const evLag = deriveEvidenceT2(lagged, deriveCutoffT2(lagged));
  assert.equal(evLag.settlement.kp_gfz_observed, null);
  assert.equal(evLag.settlement.kp_swpc_observed, 6.0);
});

test('precutoff-T2: no settlement label appears inside a pre_cutoff entry', () => {
  const event = syntheticT2Event();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  for (const entry of ev.pre_cutoff) {
    const keys = Object.keys(entry).sort();
    assert.deepEqual(keys, [...PRE_CUTOFF_KEYS].sort());
    for (const label of SETTLEMENT_LABELS) {
      assert.equal(label in entry, false, `settlement label "${label}" leaked into pre_cutoff entry`);
    }
  }
});

test('precutoff-T2: holds for ALL real cycle-003 T2 corpus events (leakage-free)', () => {
  const corpus = resolve(CALIBRATION_DIR, 'corpus-cycle-003');
  const { events, evidence, cutoffs, errors } = loadCorpusWithCutoff(corpus, { theatres: ['T2'] });
  assert.equal(errors.length, 0, `corpus load errors: ${errors.join(', ')}`);
  assert.ok(events.T2.length > 0, 'expected >0 cycle-003 T2 events');
  let withObs = 0;
  for (const event of events.T2) {
    const ev = evidence[event.event_id];
    const cutoff = cutoffs[event.event_id];
    assert.ok(ev != null && cutoff != null, `${event.event_id}: missing evidence/cutoff`);
    // Every derived entry strictly < cutoff; ascending; no settlement label.
    let prev = -Infinity;
    for (const entry of ev.pre_cutoff) {
      assert.ok(entry.event_time_ms < cutoff.time_ms, `${event.event_id}: entry >= cutoff (leak)`);
      assert.ok(entry.event_time_ms >= prev, `${event.event_id}: not ascending`);
      prev = entry.event_time_ms;
      assert.deepEqual(Object.keys(entry).sort(), [...PRE_CUTOFF_KEYS].sort());
    }
    if (Array.isArray(event.kp_observations) && event.kp_observations.length > 0) {
      withObs += 1;
      assert.ok(ev.pre_cutoff.length > 0, `${event.event_id}: has kp_observations but empty pre_cutoff`);
    }
  }
  assert.ok(withObs > 0, 'expected at least one cycle-003 T2 event with kp_observations');
});
