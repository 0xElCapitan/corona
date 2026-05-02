/**
 * tests/replay-clock-injection-default-T1T2-test.js
 *
 * Sprint 2 milestone-2 (step 6) charter §7 binding gate for T1/T2.
 *
 * Verifies that calling flare-gate / geomag-gate functions WITHOUT an explicit
 * `now` argument behaves bit-for-bit like cycle-001 runtime — wall-clock-style
 * timestamps via Date.now() default. The 160-test cycle-001 suite already
 * exercises this path; this test is the explicit regression guard for T1/T2.
 *
 * If this test fails, the operator amendment (charter §7) is violated for T1/T2.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { flareRank } from '../src/oracles/swpc.js';
import {
  createFlareClassGate,
  processFlareClassGate,
  expireFlareClassGate,
} from '../src/theatres/flare-gate.js';
import {
  createGeomagneticStormGate,
  processGeomagneticStormGate,
  expireGeomagneticStormGate,
} from '../src/theatres/geomag-gate.js';

function makeFlareTriggerBundle(classString = 'M5.0') {
  return {
    bundle_id: 'test-T1-trigger',
    evidence_class: 'ground_truth',
    payload: {
      event_type: 'solar_flare',
      event_id: 'flare-test',
      flare: {
        class_string: classString,
        rank: flareRank(classString),
        uncertainty: { sigma: 0.1, sigma_class_units: 0.1 },
      },
      timing: { begin: Date.now() - 600_000 },
      quality: { composite: 0.8 },
      status: 'in_progress',
    },
  };
}

function makeKpBundle(kp = 5) {
  return {
    bundle_id: 'test-T2-kp',
    evidence_class: 'ground_truth',
    payload: {
      event_type: 'kp_index',
      event_time: Date.now(),
      kp: { value: kp, uncertainty: { sigma: 0.5 } },
      quality: { composite: 0.8 },
    },
  };
}

// ===== T1 =====

test('T1 default-clock: createFlareClassGate without now arg uses Date.now()', () => {
  const before = Date.now();
  const theatre = createFlareClassGate({ threshold_class: 'M1.0', window_hours: 24 });
  const after = Date.now();
  assert.ok(theatre.position_history[0].t >= before && theatre.position_history[0].t <= after);
  assert.ok(theatre.opens_at >= before && theatre.opens_at <= after);
});

test('T1 default-clock: processFlareClassGate without now arg uses Date.now()', () => {
  const theatre = createFlareClassGate({ threshold_class: 'M1.0', window_hours: 24 });
  const before = Date.now();
  const updated = processFlareClassGate(theatre, makeFlareTriggerBundle('M5.0'));
  const after = Date.now();
  // Resolution path: state becomes 'resolved', resolved_at is wall-clock
  assert.equal(updated.state, 'resolved');
  assert.ok(updated.resolved_at >= before && updated.resolved_at <= after);
  // The pushed position_history entry should also be wall-clock
  const newEntries = updated.position_history.slice(theatre.position_history.length);
  for (const entry of newEntries) {
    assert.ok(entry.t >= before && entry.t <= after);
  }
});

test('T1 default-clock: expireFlareClassGate without now arg uses Date.now()', () => {
  const theatre = createFlareClassGate({ threshold_class: 'M1.0', window_hours: 24 });
  const before = Date.now();
  const expired = expireFlareClassGate(theatre);
  const after = Date.now();
  assert.equal(expired.state, 'resolved');
  assert.ok(expired.resolved_at >= before && expired.resolved_at <= after);
});

test('T1 default-clock: explicit now arg overrides Date.now()', () => {
  const FIXED = 1715392980000;
  const theatre = createFlareClassGate(
    { threshold_class: 'M1.0', window_hours: 24 },
    { now: () => FIXED },
  );
  assert.equal(theatre.opens_at, FIXED);
  assert.equal(theatre.position_history[0].t, FIXED);
});

// ===== T2 =====

test('T2 default-clock: createGeomagneticStormGate without now arg uses Date.now()', () => {
  const before = Date.now();
  const theatre = createGeomagneticStormGate({ kp_threshold: 5, window_hours: 72 });
  const after = Date.now();
  assert.ok(theatre.opens_at >= before && theatre.opens_at <= after);
  assert.ok(theatre.position_history[0].t >= before && theatre.position_history[0].t <= after);
});

test('T2 default-clock: processGeomagneticStormGate dispatches to internal helpers without now arg', () => {
  const theatre = createGeomagneticStormGate({ kp_threshold: 5, window_hours: 72 });
  const before = Date.now();
  const updated = processGeomagneticStormGate(theatre, makeKpBundle(5));
  const after = Date.now();
  // Resolution path: state becomes 'resolved'
  assert.equal(updated.state, 'resolved');
  assert.ok(updated.resolved_at >= before && updated.resolved_at <= after);
});

test('T2 default-clock: expireGeomagneticStormGate without now arg uses Date.now()', () => {
  const theatre = createGeomagneticStormGate({ kp_threshold: 5, window_hours: 72 });
  const before = Date.now();
  const expired = expireGeomagneticStormGate(theatre);
  const after = Date.now();
  assert.equal(expired.state, 'resolved');
  assert.ok(expired.resolved_at >= before && expired.resolved_at <= after);
});

test('T2 default-clock: explicit now arg overrides Date.now()', () => {
  const FIXED = 1715392980000;
  const theatre = createGeomagneticStormGate(
    { kp_threshold: 5, window_hours: 72 },
    { now: () => FIXED },
  );
  assert.equal(theatre.opens_at, FIXED);
});

test('T2 default-clock: empty {} context still defaults', () => {
  const before = Date.now();
  const theatre = createGeomagneticStormGate({ kp_threshold: 5, window_hours: 72 }, {});
  const after = Date.now();
  assert.ok(theatre.opens_at >= before && theatre.opens_at <= after);
});
