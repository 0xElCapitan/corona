/**
 * tests/replay-clock-injection-default-test.js
 *
 * Sprint 2 milestone-1 test #9 per REPLAY-SEAM.md §10 and CONTRACT.md §10.1.1.
 *
 * Charter §7 binding gate: calling theatre create/process/expire/resolve
 * functions WITHOUT an explicit `now` argument must behave bit-for-bit like
 * cycle-001 runtime — wall-clock-style timestamps via Date.now() default.
 *
 * Milestone 1 scope: T4 (proton-cascade) only. T1/T2/T3/T5 invariants
 * verified by the existing 160-test suite which calls runtime functions
 * without the new `{ now }` argument.
 *
 * If this test fails, the operator amendment (charter §7) is violated:
 * the live runtime path is no longer default-preserving.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { flareRank } from '../src/oracles/swpc.js';
import {
  createProtonEventCascade,
  processProtonEventCascade,
  resolveProtonEventCascade,
} from '../src/theatres/proton-cascade.js';

function makeTriggerBundle(classString = 'X5.8') {
  return {
    bundle_id: 'test-trigger-001',
    evidence_class: 'ground_truth',
    payload: {
      event_type: 'solar_flare',
      event_id: 'flare-test-001',
      flare: {
        class_string: classString,
        rank: flareRank(classString),
      },
      timing: { begin: Date.now() - 3600_000 },
    },
  };
}

function makeProtonBundle(peakPfu = 50, eventTime = Date.now()) {
  return {
    bundle_id: `test-proton-${eventTime}`,
    evidence_class: 'ground_truth',
    payload: {
      event_type: 'proton_flux',
      event_time: eventTime,
      proton: {
        flux: peakPfu,
        energy_channel: '>=10 MeV',
      },
    },
  };
}

test('clock-injection-default: createProtonEventCascade without now arg uses Date.now()', () => {
  const before = Date.now();
  const theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  const after = Date.now();
  assert.ok(theatre != null, 'X5.8 trigger should open T4 theatre');
  assert.ok(theatre.position_history.length > 0, 'initial position_history entry should exist');
  const t = theatre.position_history[0].t;
  assert.ok(typeof t === 'number' && t >= before && t <= after,
    `expected wall-clock t in [${before}, ${after}], got ${t}`);
  assert.ok(typeof theatre.opens_at === 'number' && theatre.opens_at >= before && theatre.opens_at <= after,
    `expected opens_at in [${before}, ${after}], got ${theatre.opens_at}`);
});

test('clock-injection-default: processProtonEventCascade without now arg uses Date.now()', () => {
  const theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  const before = Date.now();
  const updated = processProtonEventCascade(theatre, makeProtonBundle(50));
  const after = Date.now();
  // The new position_history entry pushed by process should have wall-clock t.
  const newEntries = updated.position_history.slice(theatre.position_history.length);
  assert.ok(newEntries.length > 0, 'process should push at least one position_history entry');
  for (const entry of newEntries) {
    assert.ok(entry.t >= before && entry.t <= after,
      `expected wall-clock t in [${before}, ${after}] for new entry, got ${entry.t}`);
  }
});

test('clock-injection-default: resolveProtonEventCascade without now arg uses Date.now()', () => {
  const theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  const before = Date.now();
  const resolved = resolveProtonEventCascade(theatre);
  const after = Date.now();
  assert.equal(resolved.state, 'resolved');
  assert.ok(typeof resolved.resolved_at === 'number' && resolved.resolved_at >= before && resolved.resolved_at <= after,
    `expected resolved_at in [${before}, ${after}], got ${resolved.resolved_at}`);
  // The closing position_history entry should have wall-clock t == resolved_at (per Sprint 2 single-capture pattern).
  const closingEntry = resolved.position_history[resolved.position_history.length - 1];
  assert.equal(closingEntry.t, resolved.resolved_at,
    'resolveProtonEventCascade should capture nowFn() once and reuse for resolved_at and closing position');
});

test('clock-injection-default: explicit now arg overrides Date.now()', () => {
  const FIXED_TIME = 1715392980000; // 2024-05-11T01:23:00Z
  const theatre = createProtonEventCascade(
    { triggerBundle: makeTriggerBundle() },
    { now: () => FIXED_TIME },
  );
  assert.equal(theatre.opens_at, FIXED_TIME, 'opens_at should match injected now');
  assert.equal(theatre.position_history[0].t, FIXED_TIME, 'initial position_history.t should match injected now');

  const updated = processProtonEventCascade(
    theatre,
    makeProtonBundle(50, FIXED_TIME + 3600_000),
    { now: () => FIXED_TIME + 7200_000 },
  );
  const newEntry = updated.position_history[updated.position_history.length - 1];
  assert.equal(newEntry.t, FIXED_TIME + 7200_000, 'process position_history.t should match injected now');

  const resolved = resolveProtonEventCascade(updated, { now: () => FIXED_TIME + 10800_000 });
  assert.equal(resolved.resolved_at, FIXED_TIME + 10800_000, 'resolved_at should match injected now');
});

test('clock-injection-default: explicit { now } object with falsy now should still default', () => {
  // Edge case: { now: undefined } — destructuring default kicks in.
  const before = Date.now();
  const theatre = createProtonEventCascade(
    { triggerBundle: makeTriggerBundle() },
    { now: undefined },
  );
  const after = Date.now();
  assert.ok(theatre.opens_at >= before && theatre.opens_at <= after,
    'undefined now should fall back to Date.now() default');
});

test('clock-injection-default: empty {} context object preserves default', () => {
  const before = Date.now();
  const theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() }, {});
  const after = Date.now();
  assert.ok(theatre.opens_at >= before && theatre.opens_at <= after,
    'empty context object should fall back to Date.now() default');
});
