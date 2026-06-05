/**
 * tests/corpus-loader-t2-gfz-lag-test.js
 *
 * CORONA cycle-004 Sprint 02 — Layer-B GFZ-lag handling (SDD §6.6 / OQ-5).
 *
 * Pins SPRINT-PLAN §5.5 / SDD §11 (corpus-loader-t2-gfz-lag-test):
 *   - a kp_gfz_observed == null (or regression-tier-INELIGIBLE) T2 event STILL
 *     derives pre_cutoff evidence when kp_observations[] are present + pre-cutoff;
 *   - provenance is preserved on every derived entry;
 *   - no event/observation is skipped solely due to GFZ-lag.
 *
 * Rationale (SDD §6.6): cycle-004 does NO scoring, so regression-tier
 * eligibility (which gates scoring, not evidence) is irrelevant to the
 * consumption proof. Provenance flows into the uncertainty source at Layer A;
 * no entry is dropped for provenance.
 *
 * Additive test, run via explicit `node --test` (OD-2: package.json untouched).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  _EVIDENCE_DERIVATIONS,
  _CUTOFF_DERIVATIONS,
} from '../scripts/corona-backtest/ingestors/corpus-loader.js';

const deriveEvidenceT2 = _EVIDENCE_DERIVATIONS.T2;
const deriveCutoffT2 = _CUTOFF_DERIVATIONS.T2;

// A GFZ-lagged event: definitive Kp not yet published (kp_gfz_observed == null),
// regression-tier-ineligible, but it DOES carry strictly-pre-cutoff SWPC
// provisional observations plus one GFZ-definitive lead-in reading.
function gfzLaggedEvent() {
  return {
    event_id: 'T2-gfz-lag',
    theatre: 'T2',
    kp_window_start: '2024-02-01T00:00:00Z',
    kp_window_end: '2024-02-01T12:00:00Z',
    kp_swpc_observed: 5.667,
    kp_gfz_observed: null, // GFZ ~30-day publication lag — definitive absent
    regression_tier_eligible: false, // ineligible for the (non-existent) scoring tier
    kp_observations: [
      { time: '2024-02-01T03:00:00Z', kp: 2.0, index: 'Kp', provenance: 'swpc_provisional', satellite: null },
      { time: '2024-02-01T06:00:00Z', kp: 4.333, index: 'Kp', provenance: 'gfz_definitive', satellite: null },
      { time: '2024-02-01T09:00:00Z', kp: 5.333, index: 'Kp', provenance: 'swpc_provisional', satellite: null },
    ],
  };
}

test('gfz-lag-T2: kp_gfz_observed == null event STILL derives pre_cutoff evidence', () => {
  const event = gfzLaggedEvent();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  // All three observations are strictly pre-cutoff → all derived. None skipped.
  assert.equal(ev.pre_cutoff.length, 3, 'GFZ-lagged event must NOT skip its pre-cutoff observations');
  for (const entry of ev.pre_cutoff) {
    assert.ok(entry.event_time_ms < cutoff.time_ms);
  }
  // Settlement still reflects the null definitive (honest absence, not dropped).
  assert.equal(ev.settlement.kp_gfz_observed, null);
});

test('gfz-lag-T2: provenance is preserved on every derived entry', () => {
  const event = gfzLaggedEvent();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  // Order is ascending: 03:00 (swpc), 06:00 (gfz), 09:00 (swpc).
  assert.deepEqual(
    ev.pre_cutoff.map((e) => e.provenance),
    ['swpc_provisional', 'gfz_definitive', 'swpc_provisional'],
  );
  // Both provenance classes survive — nothing dropped for being provisional.
  const provs = new Set(ev.pre_cutoff.map((e) => e.provenance));
  assert.ok(provs.has('swpc_provisional'));
  assert.ok(provs.has('gfz_definitive'));
});

test('gfz-lag-T2: no observation skipped solely due to GFZ-lag / ineligibility', () => {
  const event = gfzLaggedEvent();
  const cutoff = deriveCutoffT2(event);
  const ev = deriveEvidenceT2(event, cutoff);
  // The count of derived entries equals the count of strictly-pre-cutoff
  // observations, independent of regression_tier_eligible / null gfz.
  const strictlyPre = event.kp_observations.filter(
    (o) => new Date(o.time).getTime() < cutoff.time_ms,
  );
  assert.equal(ev.pre_cutoff.length, strictlyPre.length);
  assert.equal(event.regression_tier_eligible, false); // ineligible, yet evidence still derived
});
