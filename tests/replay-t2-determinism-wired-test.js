/**
 * tests/replay-t2-determinism-wired-test.js
 *
 * Cycle-004 Sprint 03 — T3.2 (replay-twice determinism). SPRINT-PLAN §6.4/§6.6 [G5].
 *
 * Runs each of the WIRED and ABLATED proof states TWICE and asserts the emitted
 * per-event hash table is byte-identical (and canonical-identical) within each
 * state. Determinism is the Rung-1 honesty floor: a wall-clock or RNG dependency
 * in the proof/replay path would make two runs differ. (The dedicated
 * stub-to-throw walltime/random gate is tests/no-walltime-no-random-test.js — T3.6.)
 *
 * No scoring. No Brier. Per-event hash tables only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHashTable } from '../scripts/corona-backtest-cycle-004-evidence-wiring.js';

// Mirror the CLI's exact emission: JSON.stringify(table, null, 2) + '\n'.
const emit = (state) => JSON.stringify(buildHashTable({ state }), null, 2) + '\n';

for (const state of ['wired', 'ablated']) {
  test(`replay-twice byte-identical within state="${state}"`, () => {
    const run1 = emit(state);
    const run2 = emit(state);
    assert.equal(run1, run2,
      `${state}: two fresh runs MUST emit byte-identical JSON (determinism / Rung-1 floor)`);
    // Representation-independent cross-check (parsed objects).
    assert.deepEqual(JSON.parse(run1), JSON.parse(run2),
      `${state}: parsed hash tables MUST be canonical-identical`);

    const table = JSON.parse(run1);
    assert.equal(table.state, state, `${state}: state label`);
    assert.equal(table.event_count, 60, `${state}: 60 events`);
    assert.equal(table.events.length, 60, `${state}: 60 event rows`);
    for (const r of table.events) {
      assert.match(r.trajectory_hash, /^[0-9a-f]{64}$/,
        `${state}/${r.theatre}/${r.event_id}: 64-hex trajectory hash`);
    }
  });
}

test('wired and ablated are genuinely distinct (determinism is not trivial sameness)', () => {
  // If wired==ablated for ALL events the determinism proof would be vacuous; the
  // depth check (which events differ, and why) is replay-t2-wired-vs-ablated-test.js.
  const wired = buildHashTable({ state: 'wired' });
  const ablated = buildHashTable({ state: 'ablated' });
  const wi = Object.fromEntries(wired.events.map((r) => [`${r.theatre}/${r.event_id}`, r.trajectory_hash]));
  const ai = Object.fromEntries(ablated.events.map((r) => [`${r.theatre}/${r.event_id}`, r.trajectory_hash]));
  const diff = Object.keys(wi).filter((k) => wi[k] !== ai[k]);
  assert.ok(diff.length > 0,
    'wired and ablated MUST differ for at least one event (else the toggle is inert — HS-6)');
});
