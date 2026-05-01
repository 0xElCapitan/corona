/**
 * tests/security/proton-cascade-pex1-test.js
 *
 * Sprint 6 / corona-a6z — PEX-1 (Sprint 2 audit carry-forward) regression coverage.
 *
 * Verifies that `processProtonEventCascade` does not throw when invoked with
 * a bundle whose `payload` is undefined / null / missing. Pre-Sprint-6, the
 * direct property access at proton-cascade.js:266, 284 (`payload.event_type`)
 * threw `TypeError: Cannot read properties of undefined (reading 'event_type')`
 * for any bundle with `bundle.payload === undefined`. The Sprint 6 defensive
 * fix changes those two access sites to optional chaining (`payload?.event_type`),
 * which routes any non-`proton_flux` bundle (including malformed) through the
 * line 284 fallthrough branch.
 *
 * Per Sprint 6 handoff §6.4 option (A) — defensive fix; PEX-1 closed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { processProtonEventCascade } from '../../src/theatres/proton-cascade.js';

// Build a minimal in-flight T4 theatre that satisfies the early-return
// guards (state !== 'resolved' / 'expired'). The fields not consumed by the
// malformed-payload code path are seeded with placeholders.
function makeOpenTheatre() {
  return {
    id: 'T4-PROTON-CASCADE-pex1-test',
    template: 'proton_event_cascade',
    question: 'pex1 fixture',
    trigger: { event_id: 'pex1-trigger', class_string: 'M5.0', rank: 45, time: Date.now(), active_region: null },
    s_scale_threshold: 'S1',
    count_threshold_pfu: 10,
    opens_at: Date.now() - 3600_000,
    closes_at: Date.now() + 3600_000,
    state: 'open',
    outcome: null,
    productivity: { expected_count: 1, model: 'wheatland_modified' },
    bucket_labels: ['0-1', '2-3', '4-6', '7-10', '11+'],
    current_position: [0.5, 0.3, 0.15, 0.04, 0.01],
    qualifying_event_count: 0,
    qualifying_events: [],
    last_qualifying_event_time: null,
    position_history: [],
    evidence_bundles: ['seed-bundle'],
    resolving_bundle_id: null,
    resolved_at: null,
  };
}

describe('PEX-1 (Sprint 2 carry-forward) — proton-cascade defensive payload access', () => {
  it('does not throw when bundle.payload is undefined', () => {
    const theatre = makeOpenTheatre();
    const malformedBundle = { bundle_id: 'pex1-undefined-payload', payload: undefined };
    let result;
    assert.doesNotThrow(() => {
      result = processProtonEventCascade(theatre, malformedBundle);
    });
    // The bundle is recorded in evidence_bundles regardless (line 261).
    assert.ok(result.evidence_bundles.includes('pex1-undefined-payload'),
      'malformed bundle should be tracked in evidence_bundles');
    // The line 284 fallthrough returns without mutating qualifying_event_count.
    assert.equal(result.qualifying_event_count, 0,
      'malformed bundle must not increment qualifying_event_count');
  });

  it('does not throw when bundle.payload is null', () => {
    const theatre = makeOpenTheatre();
    const malformedBundle = { bundle_id: 'pex1-null-payload', payload: null };
    let result;
    assert.doesNotThrow(() => {
      result = processProtonEventCascade(theatre, malformedBundle);
    });
    assert.ok(result.evidence_bundles.includes('pex1-null-payload'));
    assert.equal(result.qualifying_event_count, 0);
  });

  it('does not throw when bundle has no payload key at all', () => {
    const theatre = makeOpenTheatre();
    const malformedBundle = { bundle_id: 'pex1-missing-payload' };
    let result;
    assert.doesNotThrow(() => {
      result = processProtonEventCascade(theatre, malformedBundle);
    });
    assert.ok(result.evidence_bundles.includes('pex1-missing-payload'));
    assert.equal(result.qualifying_event_count, 0);
  });

  it('preserves happy-path behavior for well-formed flare bundles', () => {
    // Regression check: optional chaining must not change semantics for
    // valid payloads. A solar_flare bundle should be logged into
    // position_history with a reason string per lines 268-279.
    const theatre = makeOpenTheatre();
    const flareBundle = {
      bundle_id: 'pex1-flare-bundle',
      payload: {
        event_type: 'solar_flare',
        flare: { class_string: 'M5.2', rank: 45 },
      },
    };
    const result = processProtonEventCascade(theatre, flareBundle);
    assert.ok(result.evidence_bundles.includes('pex1-flare-bundle'));
    // Flare-correlation entry appended to position_history (line 271-280).
    const last = result.position_history[result.position_history.length - 1];
    assert.equal(last.evidence, 'pex1-flare-bundle');
    assert.match(last.reason, /M5\.2 flare/, 'reason should reference the flare class');
    // qualifying_event_count is not incremented for flare bundles.
    assert.equal(result.qualifying_event_count, 0);
  });

  it('preserves happy-path behavior for non-proton/non-flare bundles', () => {
    // kp_index, solar_wind, etc. should fall through line 284 → return
    // updated theatre with bundle tracked but no qualifying-count change.
    const theatre = makeOpenTheatre();
    const kpBundle = {
      bundle_id: 'pex1-kp-bundle',
      payload: { event_type: 'kp_index', kp: 5.3 },
    };
    const result = processProtonEventCascade(theatre, kpBundle);
    assert.ok(result.evidence_bundles.includes('pex1-kp-bundle'));
    assert.equal(result.qualifying_event_count, 0,
      'non-proton/non-flare bundles must not increment qualifying_event_count');
  });

  it('returns the theatre unchanged when state is "resolved"', () => {
    // Pre-existing early-return guard at line 258. Verify it is unaffected.
    const theatre = { ...makeOpenTheatre(), state: 'resolved' };
    const malformedBundle = { bundle_id: 'pex1-resolved', payload: undefined };
    const result = processProtonEventCascade(theatre, malformedBundle);
    // No mutation: same evidence_bundles array reference returned.
    assert.equal(result, theatre);
  });
});
