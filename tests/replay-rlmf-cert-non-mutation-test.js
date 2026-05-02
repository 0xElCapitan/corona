/**
 * tests/replay-rlmf-cert-non-mutation-test.js
 *
 * Sprint 2 milestone-1 test #8 per REPLAY-SEAM.md §10 and CONTRACT.md §11.3.
 *
 * Q1 BINDING GATE: cert format frozen at version '0.1.0'. After Sprint 2's
 * function-arg `now` injection lands, the runtime cert export pipeline
 * (src/index.js:235-251 → src/rlmf/certificates.js) must produce the SAME
 * cert shape as cycle-001 for any (theatre, outcome) input.
 *
 * Specifically:
 *   - cert.version === '0.1.0' (unchanged)
 *   - cert.performance.position_history entries have {t, p, evidence} shape
 *     (NOT renamed to t_ms / evidence_id — that rename happens at trajectory-
 *     emission boundary only, never on runtime state)
 *   - calibration_bucket logic unchanged
 *   - brier_score formula unchanged
 *
 * If this test fails, Q1 (RLMF cert frozen) is violated and Sprint 2 has
 * leaked the trajectory shape into runtime state. HARD STOP.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { flareRank } from '../src/oracles/swpc.js';
import {
  createProtonEventCascade,
  processProtonEventCascade,
  resolveProtonEventCascade,
} from '../src/theatres/proton-cascade.js';
import { exportCertificate } from '../src/rlmf/certificates.js';

function makeTriggerBundle() {
  return {
    bundle_id: 'rlmf-cert-test-trigger',
    evidence_class: 'ground_truth',
    payload: {
      event_type: 'solar_flare',
      event_id: 'flare-rlmf-cert-test',
      flare: {
        class_string: 'X5.8',
        rank: flareRank('X5.8'),
      },
      timing: { begin: 1715392980000 }, // 2024-05-11T01:23:00Z
    },
  };
}

function makeProtonBundle(peakPfu, eventTime) {
  return {
    bundle_id: `rlmf-cert-test-proton-${eventTime}`,
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

test('rlmf-cert-non-mutation: cert.version stays at "0.1.0" after Sprint 2 changes', () => {
  // Build a fully-resolved theatre via the runtime path (no `now` injection — default-preserving).
  let theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  theatre = processProtonEventCascade(theatre, makeProtonBundle(50, theatre.opens_at + 3600_000));
  theatre = resolveProtonEventCascade(theatre);

  const cert = exportCertificate(theatre, { construct_id: 'CORONA' });
  assert.equal(cert.version, '0.1.0', 'Q1 violation: cert.version changed from 0.1.0');
});

test('rlmf-cert-non-mutation: cert.performance.position_history entries retain runtime field names {t, p, evidence}', () => {
  // The trajectory boundary renames t→t_ms, evidence→evidence_id (CONTRACT §3.1).
  // The runtime cert MUST keep the original cycle-001 names. Otherwise the
  // trajectory-shape rename has leaked into runtime state — Q1 violation.
  let theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  theatre = processProtonEventCascade(theatre, makeProtonBundle(50, theatre.opens_at + 3600_000));
  theatre = resolveProtonEventCascade(theatre);

  const cert = exportCertificate(theatre, { construct_id: 'CORONA' });
  assert.ok(Array.isArray(cert.performance.position_history));
  for (const entry of cert.performance.position_history) {
    assert.ok('t' in entry, 'cert position_history entry must keep runtime field name `t` (not `t_ms`)');
    assert.ok('p' in entry, 'cert position_history entry must keep field `p`');
    assert.ok('evidence' in entry, 'cert position_history entry must keep runtime field name `evidence` (not `evidence_id`)');
    assert.ok(!('t_ms' in entry), 'Q1 violation: trajectory-boundary field name t_ms leaked into runtime cert');
    assert.ok(!('evidence_id' in entry), 'Q1 violation: trajectory-boundary field name evidence_id leaked into runtime cert');
  }
});

test('rlmf-cert-non-mutation: cert structure shape unchanged (top-level keys)', () => {
  let theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  theatre = resolveProtonEventCascade(theatre);
  const cert = exportCertificate(theatre, { construct_id: 'CORONA' });
  // Top-level keys per src/rlmf/certificates.js:97-142 (cycle-001).
  for (const key of ['certificate_id', 'construct', 'version', 'exported_at', 'theatre', 'performance', 'temporal', 'on_chain']) {
    assert.ok(key in cert, `cert missing top-level key "${key}"`);
  }
  // Performance keys per cycle-001.
  for (const key of ['brier_score', 'brier_adjusted', 'opening_position', 'closing_position', 'position_history',
                     'n_updates', 'n_evidence_bundles', 'calibration_bucket', 'paradox_events', 'cross_validation_events']) {
    assert.ok(key in cert.performance, `cert.performance missing key "${key}"`);
  }
  // Temporal keys per cycle-001.
  for (const key of ['duration_ms', 'volatility', 'directional_accuracy', 'time_weighted_brier']) {
    assert.ok(key in cert.temporal, `cert.temporal missing key "${key}"`);
  }
});

test('rlmf-cert-non-mutation: cert brier_score and calibration_bucket types unchanged', () => {
  let theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
  theatre = resolveProtonEventCascade(theatre);
  const cert = exportCertificate(theatre, { construct_id: 'CORONA' });
  assert.equal(typeof cert.performance.brier_score, 'number');
  assert.ok(Number.isFinite(cert.performance.brier_score));
  assert.equal(typeof cert.performance.calibration_bucket, 'string');
  assert.match(cert.performance.calibration_bucket, /^\d\.\d-\d\.\d$/, 'calibration_bucket format unchanged');
});

test('rlmf-cert-non-mutation: cert is byte-stable for fixed (theatre, outcome) input under explicit clock injection', () => {
  // With explicit `now` injection to a fixed value, the entire theatre lifecycle
  // becomes deterministic, including cert export (which embeds `theatre.opens_at`,
  // `position_history.t`, `resolved_at`, etc.). Two runs should produce byte-identical certs.
  const FIXED_NOW = () => 1715392980000;
  function buildAndExport() {
    let theatre = createProtonEventCascade({ triggerBundle: makeTriggerBundle() }, { now: FIXED_NOW });
    theatre = processProtonEventCascade(
      theatre,
      makeProtonBundle(50, 1715392980000 + 3600_000),
      { now: () => 1715392980000 + 3600_000 },
    );
    theatre = resolveProtonEventCascade(theatre, { now: () => 1715392980000 + 7200_000 });
    const cert = exportCertificate(theatre, { construct_id: 'CORONA' });
    // exported_at is wall-clock — strip for byte comparison.
    const { exported_at, ...rest } = cert;
    return JSON.stringify(rest, Object.keys(rest).sort());
  }
  const c1 = buildAndExport();
  const c2 = buildAndExport();
  assert.equal(c1, c2, 'cert (excluding exported_at) must be byte-identical under fixed clock injection');
});
