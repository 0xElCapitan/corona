/**
 * CORONA test suite.
 *
 * Uses Node.js built-in test runner (node --test).
 * Zero external dependencies.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { classifyFlux, classToFlux, flareRank, kpToGScale } from '../src/oracles/swpc.js';
import { parseSourceLocation, getBestCMEAnalysis, getEarthArrival } from '../src/oracles/donki.js';
import { computeQuality } from '../src/processor/quality.js';
import {
  buildFlareUncertainty, flareThresholdProbability,
  buildKpUncertainty, kpThresholdProbability,
  buildCMEArrivalUncertainty, cmeArrivalWindowProbability,
} from '../src/processor/uncertainty.js';
import { assessSettlement } from '../src/processor/settlement.js';
import { buildBundle } from '../src/processor/bundles.js';
import { brierScoreBinary, brierScoreMultiClass, calibrationBucket, exportCertificate } from '../src/rlmf/certificates.js';
import { createFlareClassGate, processFlareClassGate, expireFlareClassGate } from '../src/theatres/flare-gate.js';
import { createGeomagneticStormGate, processGeomagneticStormGate, expireGeomagneticStormGate } from '../src/theatres/geomag-gate.js';
import { createCMEArrival, processCMEArrival, expireCMEArrival } from '../src/theatres/cme-arrival.js';
import {
  createProtonEventCascade,
  processProtonEventCascade,
  resolveProtonEventCascade,
  S_SCALE_THRESHOLDS_PFU,
  SEP_DEDUP_WINDOW_MINUTES,
} from '../src/theatres/proton-cascade.js';
import { createSolarWindDivergence, processSolarWindDivergence, expireSolarWindDivergence } from '../src/theatres/solar-wind-divergence.js';

// =========================================================================
// Test fixtures
// =========================================================================

function makeFlareEvent(overrides = {}) {
  return {
    type: 'solar_flare',
    data: {
      source: 'SWPC_GOES',
      begin_time: Date.now() - 3600_000,
      max_time: Date.now() - 3000_000,
      end_time: Date.now() - 2400_000,
      max_class: 'M2.5',
      current_class: 'M2.5',
      max_xray_flux: 2.5e-5,
      satellite: 16,
      status: 'complete',
      event_id: 'flare-test-001',
      ...overrides,
    },
    polledAt: Date.now(),
  };
}

function makeDonkiFlareEvent(overrides = {}) {
  return {
    type: 'donki_flare',
    data: {
      flr_id: '2026-03-15T12:30:00-FLR-001',
      begin_time: Date.now() - 7200_000,
      peak_time: Date.now() - 6600_000,
      end_time: Date.now() - 6000_000,
      class_type: 'X1.5',
      source_location: { latitude: 15, longitude: 33, raw: 'N15E33' },
      active_region: 4392,
      instruments: ['GOES-16: EXIS 1.0-8.0A'],
      linked_events: ['2026-03-15T13:00:00-CME-001'],
      ...overrides,
    },
    polledAt: Date.now(),
  };
}

function makeKpEvent(overrides = {}) {
  return {
    type: 'kp_index',
    data: {
      time_tag: '2026-03-15 12:00:00.000',
      time: Date.now() - 3600_000,
      kp: 4,
      kp_fraction: 4.33,
      station_count: 8,
      ...overrides,
    },
    polledAt: Date.now(),
  };
}

function makeSolarWindEvent(overrides = {}) {
  return {
    type: 'solar_wind',
    data: {
      mag: { bz_gsm: -8, bt: 12, bx_gsm: 3, by_gsm: -5 },
      plasma: { speed: 450, density: 8, temperature: 150000 },
      time: Date.now() - 60_000,
      ...overrides,
    },
    polledAt: Date.now(),
  };
}

function makeProtonFluxEvent(overrides = {}) {
  return {
    type: 'proton_flux',
    data: {
      flux: 50, // pfu — defaults above S1 (≥10 pfu)
      energy: '>=10 MeV',
      time: Date.now() - 60_000,
      time_tag: '2026-03-15 12:00:00.000',
      satellite: 16,
      ...overrides,
    },
    polledAt: Date.now(),
  };
}

function makeFlareBundle(overrides = {}) {
  const event = makeFlareEvent(overrides);
  return buildBundle(event);
}

// =========================================================================
// Flare classification
// =========================================================================

describe('classifyFlux', () => {
  it('classifies X-class correctly', () => {
    const c = classifyFlux(1.5e-4);
    assert.equal(c.letter, 'X');
    assert.equal(c.number, 1.5);
  });

  it('classifies M-class correctly', () => {
    const c = classifyFlux(2.5e-5);
    assert.equal(c.letter, 'M');
    assert.equal(c.number, 2.5);
  });

  it('classifies C-class correctly', () => {
    const c = classifyFlux(5e-6);
    assert.equal(c.letter, 'C');
    assert.equal(c.number, 5);
  });

  it('handles null flux', () => {
    const c = classifyFlux(null);
    assert.equal(c.letter, 'A');
  });
});

describe('classToFlux', () => {
  it('converts M1.0 to 1e-5', () => {
    assert.equal(classToFlux('M1.0'), 1e-5);
  });

  it('converts X10.0 to 1e-3', () => {
    assert.equal(classToFlux('X10.0'), 1e-3);
  });

  it('returns null for invalid input', () => {
    assert.equal(classToFlux(''), null);
    assert.equal(classToFlux(null), null);
  });
});

describe('flareRank', () => {
  it('ranks X-class higher than M-class', () => {
    assert.ok(flareRank('X1.0') > flareRank('M9.9'));
  });

  it('ranks within same class by number', () => {
    assert.ok(flareRank('M5.0') > flareRank('M1.0'));
  });
});

describe('kpToGScale', () => {
  it('maps Kp 5 to G1', () => {
    const g = kpToGScale(5);
    assert.equal(g.level, 1);
    assert.equal(g.label, 'G1');
  });

  it('maps Kp 9 to G5', () => {
    const g = kpToGScale(9);
    assert.equal(g.level, 5);
  });

  it('maps Kp 3 to G0', () => {
    const g = kpToGScale(3);
    assert.equal(g.level, 0);
  });
});

// =========================================================================
// DONKI helpers
// =========================================================================

describe('parseSourceLocation', () => {
  it('parses N15E33', () => {
    const loc = parseSourceLocation('N15E33');
    assert.deepEqual(loc, { latitude: 15, longitude: 33, raw: 'N15E33' });
  });

  it('parses S20W45', () => {
    const loc = parseSourceLocation('S20W45');
    assert.equal(loc.latitude, -20);
    assert.equal(loc.longitude, -45);
  });

  it('returns null for invalid input', () => {
    assert.equal(parseSourceLocation(null), null);
    assert.equal(parseSourceLocation('invalid'), null);
  });
});

// =========================================================================
// Quality scoring
// =========================================================================

describe('computeQuality', () => {
  it('scores complete flares higher than in-progress', () => {
    const complete = computeQuality(makeFlareEvent({ status: 'complete' }));
    const inProgress = computeQuality(makeFlareEvent({ status: 'eventInProgress' }));
    assert.ok(complete.composite > inProgress.composite);
  });

  it('scores X-class flares higher reliability than C-class', () => {
    const xClass = computeQuality(makeFlareEvent({ max_class: 'X1.0' }));
    const cClass = computeQuality(makeFlareEvent({ max_class: 'C1.0' }));
    assert.ok(xClass.composite > cClass.composite);
  });

  it('scores Kp events', () => {
    const q = computeQuality(makeKpEvent());
    assert.ok(q.composite > 0);
    assert.equal(q.data_type, 'kp_index');
  });
});

// =========================================================================
// Uncertainty pricing
// =========================================================================

describe('buildFlareUncertainty', () => {
  it('returns lower doubt for complete vs in-progress', () => {
    const complete = buildFlareUncertainty({ max_class: 'M2.5', max_xray_flux: 2.5e-5, status: 'complete' });
    const inProg = buildFlareUncertainty({ max_class: 'M2.5', max_xray_flux: 2.5e-5, status: 'eventInProgress' });
    assert.ok(complete.doubt_price < inProg.doubt_price);
  });

  it('produces a 95% confidence interval', () => {
    const u = buildFlareUncertainty({ max_class: 'M2.5', max_xray_flux: 2.5e-5, status: 'complete' });
    assert.ok(u.confidence_interval_95[0] < u.value);
    assert.ok(u.confidence_interval_95[1] > u.value);
  });
});

describe('flareThresholdProbability', () => {
  it('returns high probability for flux well above threshold', () => {
    const u = buildFlareUncertainty({ max_class: 'X5.0', max_xray_flux: 5e-4, status: 'complete' });
    const prob = flareThresholdProbability(u, 'M1.0');
    assert.ok(prob > 0.95);
  });

  it('returns low probability for flux well below threshold', () => {
    const u = buildFlareUncertainty({ max_class: 'C1.0', max_xray_flux: 1e-6, status: 'complete' });
    const prob = flareThresholdProbability(u, 'X1.0');
    assert.ok(prob < 0.01);
  });
});

describe('buildKpUncertainty', () => {
  it('returns lower doubt for GFZ definitive', () => {
    const gfz = buildKpUncertainty({ kp: 5, source: 'GFZ', station_count: 10 });
    const swpc = buildKpUncertainty({ kp: 5, station_count: 10 });
    assert.ok(gfz.doubt_price < swpc.doubt_price);
  });
});

describe('kpThresholdProbability', () => {
  it('returns high probability for Kp well above threshold', () => {
    const u = buildKpUncertainty({ kp: 8, station_count: 10 });
    const prob = kpThresholdProbability(u, 5);
    assert.ok(prob > 0.95);
  });

  it('returns low probability for Kp well below threshold', () => {
    const u = buildKpUncertainty({ kp: 2, station_count: 10 });
    const prob = kpThresholdProbability(u, 7);
    assert.ok(prob < 0.1);
  });
});

// =========================================================================
// Settlement logic
// =========================================================================

describe('assessSettlement', () => {
  it('returns ground_truth for DONKI-confirmed flares', () => {
    const event = makeDonkiFlareEvent();
    const quality = computeQuality(event);
    const result = assessSettlement(event, quality);
    assert.equal(result.evidence_class, 'ground_truth');
    assert.equal(result.resolution_eligible, true);
  });

  it('returns provisional for in-progress flares', () => {
    const event = makeFlareEvent({ status: 'eventInProgress' });
    const quality = computeQuality(event);
    const result = assessSettlement(event, quality);
    assert.equal(result.evidence_class, 'provisional');
    assert.equal(result.resolution_eligible, false);
  });

  it('returns provisional_mature for old complete flares', () => {
    const event = makeFlareEvent({
      status: 'complete',
      begin_time: Date.now() - 10800_000, // 3h ago
    });
    const quality = computeQuality(event);
    const result = assessSettlement(event, quality);
    assert.equal(result.evidence_class, 'provisional_mature');
  });
});

// =========================================================================
// Bundle building
// =========================================================================

describe('buildBundle', () => {
  it('returns null for missing data', () => {
    assert.equal(buildBundle({ type: null, data: null }), null);
  });

  it('returns null for flare without begin_time', () => {
    const event = makeFlareEvent({ begin_time: null });
    assert.equal(buildBundle(event), null);
  });

  it('builds a valid flare bundle', () => {
    const bundle = buildBundle(makeFlareEvent());
    assert.ok(bundle);
    assert.equal(bundle.construct, 'CORONA');
    assert.equal(bundle.source, 'SWPC_GOES');
    assert.ok(bundle.bundle_id.startsWith('corona-'));
    assert.ok(bundle.payload.quality.composite > 0);
  });

  it('builds a valid Kp bundle', () => {
    const bundle = buildBundle(makeKpEvent());
    assert.ok(bundle);
    assert.equal(bundle.payload.event_type, 'kp_index');
    assert.equal(bundle.payload.kp.value, 4);
  });

  it('builds a valid solar wind bundle', () => {
    const bundle = buildBundle(makeSolarWindEvent());
    assert.ok(bundle);
    assert.equal(bundle.payload.event_type, 'solar_wind');
    assert.ok(bundle.payload.indicators);
  });
});

// =========================================================================
// Brier scoring
// =========================================================================

describe('brierScoreBinary', () => {
  it('returns 0 for perfect forecast', () => {
    assert.equal(brierScoreBinary(1.0, true), 0);
    assert.equal(brierScoreBinary(0.0, false), 0);
  });

  it('returns 1 for worst forecast', () => {
    assert.equal(brierScoreBinary(0.0, true), 1);
    assert.equal(brierScoreBinary(1.0, false), 1);
  });

  it('returns 0.25 for coin flip', () => {
    assert.equal(brierScoreBinary(0.5, true), 0.25);
  });
});

describe('brierScoreMultiClass', () => {
  it('returns 0 for perfect multi-class forecast', () => {
    const score = brierScoreMultiClass([0, 0, 1, 0, 0], 2);
    assert.equal(score, 0);
  });
});

describe('calibrationBucket', () => {
  it('assigns correct buckets', () => {
    assert.equal(calibrationBucket(0.15), '0.1-0.2');
    assert.equal(calibrationBucket(0.73), '0.7-0.8');
    assert.equal(calibrationBucket(0.0), '0.0-0.1');
  });

  it('handles array (multi-class) input', () => {
    const bucket = calibrationBucket([0.1, 0.6, 0.2, 0.05, 0.05]);
    assert.equal(bucket, '0.6-0.7');
  });
});

// =========================================================================
// Theatre: Flare Class Gate
// =========================================================================

describe('Flare Class Gate', () => {
  it('creates a theatre with correct structure', () => {
    const t = createFlareClassGate({
      threshold_class: 'M1.0',
      window_hours: 24,
      base_rate: 0.15,
    });
    assert.equal(t.template, 'flare_class_gate');
    assert.equal(t.state, 'open');
    assert.equal(t.current_position, 0.15);
    assert.equal(t.position_history.length, 1);
  });

  it('resolves YES on confirmed threshold-crossing flare', () => {
    const t = createFlareClassGate({
      threshold_class: 'M1.0',
      window_hours: 24,
    });

    const bundle = buildBundle(makeDonkiFlareEvent({ class_type: 'X1.5' }));
    const updated = processFlareClassGate(t, bundle);
    assert.equal(updated.state, 'resolved');
    assert.equal(updated.outcome, true);
    assert.equal(updated.current_position, 1.0);
  });

  it('updates position on provisional sub-threshold activity', () => {
    const t = createFlareClassGate({
      threshold_class: 'X1.0',
      window_hours: 24,
      base_rate: 0.05,
    });

    const bundle = buildBundle(makeFlareEvent({ max_class: 'M5.0', status: 'complete' }));
    const updated = processFlareClassGate(t, bundle);
    // Position should have moved but not resolved
    assert.equal(updated.state, 'open');
    assert.ok(updated.current_position !== t.current_position);
  });

  it('expires as NO when time runs out', () => {
    const t = createFlareClassGate({
      threshold_class: 'X10.0',
      window_hours: 1,
    });

    const expired = expireFlareClassGate(t);
    assert.equal(expired.state, 'resolved');
    assert.equal(expired.outcome, false);
  });
});

// =========================================================================
// Theatre: Geomagnetic Storm Gate
// =========================================================================

describe('Geomagnetic Storm Gate', () => {
  it('creates with G-scale mapping', () => {
    const t = createGeomagneticStormGate({
      kp_threshold: 5,
      window_hours: 72,
      base_rate: 0.10,
    });
    assert.equal(t.template, 'geomagnetic_storm_gate');
    assert.equal(t.g_scale.label, 'G1');
    assert.equal(t.current_position, 0.10);
  });

  it('resolves YES when Kp crosses threshold', () => {
    const t = createGeomagneticStormGate({
      kp_threshold: 5,
      window_hours: 72,
    });

    const bundle = buildBundle(makeKpEvent({
      kp: 6,
      time: Date.now() - 25200_000, // 7h ago (past update cycle)
    }));
    // Force evidence class for test
    bundle.evidence_class = 'provisional_mature';

    const updated = processGeomagneticStormGate(t, bundle);
    assert.equal(updated.state, 'provisional_hold');
    assert.equal(updated.outcome, true);
  });

  it('updates position on solar wind storm conditions', () => {
    const t = createGeomagneticStormGate({
      kp_threshold: 5,
      window_hours: 72,
      base_rate: 0.10,
    });

    const bundle = buildBundle(makeSolarWindEvent({
      mag: { bz_gsm: -15, bt: 20, bx_gsm: 3, by_gsm: -5 },
      plasma: { speed: 550, density: 15, temperature: 300000 },
    }));

    const updated = processGeomagneticStormGate(t, bundle);
    assert.ok(updated.current_position > t.current_position);
  });

  it('expires as NO when quiet', () => {
    const t = createGeomagneticStormGate({
      kp_threshold: 7,
      window_hours: 24,
    });

    const expired = expireGeomagneticStormGate(t);
    assert.equal(expired.state, 'resolved');
    assert.equal(expired.outcome, false);
  });
});

// =========================================================================
// Theatre: CME Arrival
// =========================================================================

describe('CME Arrival', () => {
  function makeCMEBundle() {
    return buildBundle({
      type: 'donki_cme',
      data: {
        activity_id: '2026-03-15T13:00:00-CME-001',
        start_time: Date.now() - 86400_000,
        source_location: { latitude: 15, longitude: 33 },
        active_region: 4392,
        instruments: ['SOHO: LASCO/C2'],
        analysis: {
          speed: 1200,
          half_angle: 45,
          type: 'S',
          is_most_accurate: true,
        },
        earth_arrival: {
          estimated_arrival: Date.now() + 86400_000, // +24h from now
          is_glancing_blow: false,
          kp_18: 7,
          kp_90: 6,
        },
        linked_events: [],
      },
      polledAt: Date.now(),
    });
  }

  it('creates theatre for Earth-directed CME', () => {
    const cmeBundle = makeCMEBundle();
    const t = createCMEArrival({ cmeBundle });
    assert.ok(t);
    assert.equal(t.template, 'cme_arrival');
    assert.ok(t.current_position > 0);
    assert.ok(t.current_position < 1);
  });

  it('returns null for CME without Earth arrival', () => {
    const bundle = buildBundle({
      type: 'donki_cme',
      data: {
        activity_id: 'test',
        start_time: Date.now(),
        earth_arrival: null,
      },
      polledAt: Date.now(),
    });
    const t = createCMEArrival({ cmeBundle: bundle });
    assert.equal(t, null);
  });

  it('expires with outcome based on arrival detection', () => {
    const cmeBundle = makeCMEBundle();
    const t = createCMEArrival({ cmeBundle });
    const expired = expireCMEArrival(t);
    assert.equal(expired.state, 'resolved');
    assert.equal(expired.outcome, false); // No arrival detected
  });
});

// =========================================================================
// Theatre: Proton Event Cascade
// =========================================================================

describe('Proton Event Cascade', () => {
  function makeTriggerBundle() {
    return buildBundle(makeDonkiFlareEvent({ class_type: 'X2.5' }));
  }

  it('creates theatre for M5+ trigger', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    assert.ok(t);
    assert.equal(t.template, 'proton_event_cascade');
    assert.equal(t.qualifying_event_count, 0);
    assert.equal(t.bucket_labels.length, 5);
    assert.ok(t.productivity.expected_count > 0);
    // Probabilities sum to ~1
    const sum = t.current_position.reduce((s, p) => s + p, 0);
    assert.ok(Math.abs(sum - 1) < 0.01, `Probabilities sum to ${sum}`);
  });

  it('returns null for C-class trigger', () => {
    const weakBundle = buildBundle(makeFlareEvent({ max_class: 'C5.0' }));
    const t = createProtonEventCascade({ triggerBundle: weakBundle });
    assert.equal(t, null);
  });

  it('increments count on qualifying proton-flux event', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const protonBundle = buildBundle(makeProtonFluxEvent({ flux: 50 }));
    const updated = processProtonEventCascade(t, protonBundle);
    assert.equal(updated.qualifying_event_count, 1);
    assert.equal(updated.qualifying_events.length, 1);
    assert.equal(updated.qualifying_events[0].peak_pfu, 50);
  });

  it('does not count sub-threshold proton-flux events', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const weak = buildBundle(makeProtonFluxEvent({ flux: 5 }));
    const updated = processProtonEventCascade(t, weak);
    assert.equal(updated.qualifying_event_count, 0);
  });

  it('does not count off-channel proton-flux events (energy != 10 MeV)', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const offChannel = buildBundle(makeProtonFluxEvent({ flux: 200, energy: '>=100 MeV' }));
    const updated = processProtonEventCascade(t, offChannel);
    assert.equal(updated.qualifying_event_count, 0);
  });

  it('does not count flare events (correlation evidence only, Sprint 2)', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const afterFlare = buildBundle(makeDonkiFlareEvent({ class_type: 'M2.0' }));
    const updated = processProtonEventCascade(t, afterFlare);
    assert.equal(updated.qualifying_event_count, 0);
    // Flare bundle is logged to position_history as correlation evidence
    const lastEntry = updated.position_history[updated.position_history.length - 1];
    assert.match(lastEntry.reason, /correlation evidence/);
  });

  it('coalesces qualifying flux within SEP onset window (no double-count)', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const t0 = Date.now();
    const first = buildBundle(makeProtonFluxEvent({ flux: 50, time: t0 }));
    const second = buildBundle(makeProtonFluxEvent({ flux: 60, time: t0 + 10 * 60_000 })); // +10 min, within 30-min window
    const afterFirst = processProtonEventCascade(t, first);
    const afterSecond = processProtonEventCascade(afterFirst, second);
    assert.equal(afterSecond.qualifying_event_count, 1, 'within 30-min onset window → coalesced');
  });

  it('counts a second qualifying event outside SEP onset window', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const t0 = Date.now();
    const first = buildBundle(makeProtonFluxEvent({ flux: 50, time: t0 }));
    const second = buildBundle(makeProtonFluxEvent({ flux: 80, time: t0 + 45 * 60_000 })); // +45 min, outside 30-min dedup
    const afterFirst = processProtonEventCascade(t, first);
    const afterSecond = processProtonEventCascade(afterFirst, second);
    assert.equal(afterSecond.qualifying_event_count, 2);
  });

  it('resolves to bucket on expiry', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    const resolved = resolveProtonEventCascade(t);
    assert.equal(resolved.state, 'resolved');
    assert.equal(resolved.outcome, 0); // 0 events → bucket 0
  });
});

// =========================================================================
// Theatre: Proton Event Cascade — S-scale binding regression (Sprint 2 corona-19q)
//
// Locks in the Sprint 2 freeze:
//   1. The s_scale_threshold parameter (renamed from r_scale framing in
//      Sprint 0 corona-222) maps directly to PFU thresholds via
//      S_SCALE_THRESHOLDS_PFU — no flare-class proxy.
//   2. The theatre exposes count_threshold_pfu, NOT the deprecated
//      count_threshold_class / count_threshold_rank.
//   3. The qualifying check is proton_flux ≥ PFU AND ≥10 MeV channel.
//
// Pairs the Sprint 0 carry-forward C4 (parameter-rename regression test)
// with the Sprint 2 proxy retirement.
// =========================================================================

describe('Proton Event Cascade — S-scale binding (Sprint 2 freeze)', () => {
  function makeTriggerBundle() {
    return buildBundle(makeDonkiFlareEvent({ class_type: 'X2.5' }));
  }

  it('S_SCALE_THRESHOLDS_PFU exposes canonical NOAA boundaries', () => {
    assert.equal(S_SCALE_THRESHOLDS_PFU.S1, 10);
    assert.equal(S_SCALE_THRESHOLDS_PFU.S2, 100);
    assert.equal(S_SCALE_THRESHOLDS_PFU.S3, 1000);
    assert.equal(S_SCALE_THRESHOLDS_PFU.S4, 10000);
    assert.equal(S_SCALE_THRESHOLDS_PFU.S5, 100000);
  });

  it('s_scale_threshold defaults to S1 (10 pfu)', () => {
    const t = createProtonEventCascade({ triggerBundle: makeTriggerBundle() });
    assert.equal(t.s_scale_threshold, 'S1');
    assert.equal(t.count_threshold_pfu, S_SCALE_THRESHOLDS_PFU.S1);
  });

  it('s_scale_threshold "S2" binds count_threshold_pfu to 100 pfu', () => {
    const t = createProtonEventCascade({
      triggerBundle: makeTriggerBundle(),
      s_scale_threshold: 'S2',
    });
    assert.equal(t.s_scale_threshold, 'S2');
    assert.equal(t.count_threshold_pfu, 100);
    // Sub-threshold (50 pfu < 100) — should NOT count for S2
    const sub = buildBundle(makeProtonFluxEvent({ flux: 50 }));
    const afterSub = processProtonEventCascade(t, sub);
    assert.equal(afterSub.qualifying_event_count, 0);
    // Above threshold (200 pfu > 100) — should count
    const above = buildBundle(makeProtonFluxEvent({ flux: 200, time: Date.now() + 60 * 60_000 }));
    const afterAbove = processProtonEventCascade(afterSub, above);
    assert.equal(afterAbove.qualifying_event_count, 1);
    assert.equal(afterAbove.qualifying_events[0].peak_pfu, 200);
  });

  it('s_scale_threshold "S3" binds count_threshold_pfu to 1000 pfu', () => {
    const t = createProtonEventCascade({
      triggerBundle: makeTriggerBundle(),
      s_scale_threshold: 'S3',
    });
    assert.equal(t.count_threshold_pfu, 1000);
  });

  it('theatre state does NOT carry the deprecated count_threshold_class/rank fields', () => {
    const t = createProtonEventCascade({
      triggerBundle: makeTriggerBundle(),
      s_scale_threshold: 'S2',
    });
    assert.equal(t.count_threshold_class, undefined);
    assert.equal(t.count_threshold_rank, undefined);
    assert.equal(typeof t.count_threshold_pfu, 'number');
    assert.equal(t.last_qualifying_event_time, null);
  });

  it('SEP_DEDUP_WINDOW_MINUTES is exported and matches NOAA onset criterion', () => {
    assert.equal(SEP_DEDUP_WINDOW_MINUTES, 30);
  });
});

// =========================================================================
// Theatre: Solar Wind Divergence
// =========================================================================

describe('Solar Wind Divergence', () => {
  it('creates theatre with correct structure', () => {
    const t = createSolarWindDivergence({
      bz_divergence_threshold: 5,
      sustained_minutes: 30,
      window_hours: 24,
    });
    assert.equal(t.template, 'solar_wind_divergence');
    assert.equal(t.state, 'open');
  });

  it('expires as NO when no sustained divergence', () => {
    const t = createSolarWindDivergence({
      bz_divergence_threshold: 5,
      sustained_minutes: 30,
      window_hours: 24,
    });
    const expired = expireSolarWindDivergence(t);
    assert.equal(expired.state, 'resolved');
    assert.equal(expired.outcome, false);
  });
});

// =========================================================================
// RLMF Certificate export
// =========================================================================

describe('exportCertificate', () => {
  it('exports valid certificate from resolved binary theatre', () => {
    const t = createFlareClassGate({
      threshold_class: 'X1.0',
      window_hours: 24,
      base_rate: 0.05,
    });
    const expired = expireFlareClassGate(t);
    const cert = exportCertificate(expired);

    assert.ok(cert.certificate_id);
    assert.equal(cert.construct, 'CORONA');
    assert.equal(cert.theatre.outcome, false);
    assert.ok(cert.performance.brier_score >= 0);
    assert.ok(cert.performance.brier_score <= 1);
    assert.ok(cert.performance.calibration_bucket);
    assert.ok(cert.temporal.volatility >= 0);
  });

  it('exports valid certificate from multi-class theatre', () => {
    const trigger = buildBundle(makeDonkiFlareEvent({ class_type: 'X2.5' }));
    const t = createProtonEventCascade({ triggerBundle: trigger });
    const resolved = resolveProtonEventCascade(t);
    const cert = exportCertificate(resolved);

    assert.ok(cert.certificate_id);
    assert.equal(cert.construct, 'CORONA');
    assert.equal(typeof cert.theatre.outcome, 'number');
    assert.ok(cert.performance.brier_score >= 0);
  });

  it('throws for unresolved theatres', () => {
    const t = createFlareClassGate({
      threshold_class: 'M1.0',
      window_hours: 24,
    });
    assert.throws(() => exportCertificate(t));
  });
});

// =========================================================================
// Backtest harness — Sprint 3 (corona-d4u epic)
// =========================================================================
// Per SDD §11.2: "Sprint 3 | Backtest sanity-sample test (one DONKI event
// normalises end-to-end) | Smoke for ingestor".
// We extend with smoke tests for each scoring module + corpus loader so a
// future regression in the harness cannot land silently.

describe('Backtest harness — DONKI sanity sample (Sprint 3 R3 mitigation)', () => {
  it('runs 5/5 events offline without shape mismatches', async () => {
    const { runSanity } = await import('../scripts/corona-backtest/ingestors/donki-sanity.js');
    const summary = await runSanity({ useOffline: true });
    assert.equal(summary.mode, 'offline');
    assert.equal(summary.total, 5);
    assert.equal(summary.passed, 5);
    for (const r of summary.results) assert.equal(r.pass, true, `${r.label} failed: ${r.error}`);
  });

  it('detects era buckets across the 2017→2026 span', async () => {
    const { detectEra } = await import('../scripts/corona-backtest/ingestors/donki-sanity.js');
    assert.equal(detectEra('2017-09-06T11:53Z'), '2017-2019');
    assert.equal(detectEra('2019-05-10T08:00Z'), '2017-2019');
    assert.equal(detectEra('2022-02-03T18:00Z'), '2020-2022');
    assert.equal(detectEra('2024-05-14T16:51Z'), '2023-2026');
    assert.equal(detectEra(''), 'unknown');
    assert.equal(detectEra(null), 'unknown');
  });

  it('FLR normaliser surfaces missing-field errors with the offending fields', async () => {
    const { normaliseFLR } = await import('../scripts/corona-backtest/ingestors/donki-sanity.js');
    assert.throws(() => normaliseFLR({}, '2017-2019'), /missing required field/);
    assert.throws(() => normaliseFLR(null, '2017-2019'), /not an object/);
  });

  it('CME normaliser picks the most-accurate analysis when present', async () => {
    const { normaliseCME } = await import('../scripts/corona-backtest/ingestors/donki-sanity.js');
    const raw = {
      activityID: 'CME-001',
      startTime: '2024-05-10T00:00Z',
      cmeAnalyses: [
        { isMostAccurate: false, time21_5: '2024-05-10T01:00Z', enlilList: [] },
        { isMostAccurate: true, time21_5: '2024-05-10T02:00Z', enlilList: [
          { estimatedShockArrivalTime: '2024-05-12T00:00Z', estimatedDuration: 12 },
        ] },
      ],
    };
    const out = normaliseCME(raw, '2023-2026');
    assert.equal(out.most_accurate_analysis.time21_5, '2024-05-10T02:00Z');
    assert.equal(out.wsa_enlil.estimated_shock_arrival_time, '2024-05-12T00:00Z');
    assert.equal(out.wsa_enlil.estimated_duration_hours, 12);
  });
});

describe('Backtest harness — corpus loader §3.7 schema (Sprint 3 corona-1ks)', () => {
  it('classifyFlareToBucket handles A/B/C/M/X/X10+ correctly', async () => {
    const { classifyFlareToBucket } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    assert.equal(classifyFlareToBucket('B5.0'), 0);
    assert.equal(classifyFlareToBucket('C9.9'), 0);
    assert.equal(classifyFlareToBucket('M1.0'), 1);
    assert.equal(classifyFlareToBucket('M4.9'), 1);
    assert.equal(classifyFlareToBucket('M5.0'), 2);
    assert.equal(classifyFlareToBucket('M9.9'), 2);
    assert.equal(classifyFlareToBucket('X1.0'), 3);
    assert.equal(classifyFlareToBucket('X4.9'), 3);
    assert.equal(classifyFlareToBucket('X5.0'), 4);
    assert.equal(classifyFlareToBucket('X9.3'), 4);
    assert.equal(classifyFlareToBucket('X10.0'), 5);
    assert.equal(classifyFlareToBucket('X45.0'), 5);
    assert.equal(classifyFlareToBucket('Z1.0'), -1);
  });

  it('kpToGScaleIndex follows G0..G5 boundaries', async () => {
    const { kpToGScaleIndex } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    assert.equal(kpToGScaleIndex(0.0), 0);
    assert.equal(kpToGScaleIndex(4.99), 0);
    assert.equal(kpToGScaleIndex(5.0), 1);
    assert.equal(kpToGScaleIndex(5.99), 1);
    assert.equal(kpToGScaleIndex(6.0), 2);
    assert.equal(kpToGScaleIndex(7.0), 3);
    assert.equal(kpToGScaleIndex(8.33), 4);
    assert.equal(kpToGScaleIndex(9.0), 5);
  });

  it('countToT4Bucket follows the §4.4.2 boundaries', async () => {
    const { countToT4Bucket } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    assert.equal(countToT4Bucket(0), 0);
    assert.equal(countToT4Bucket(1), 0);
    assert.equal(countToT4Bucket(2), 1);
    assert.equal(countToT4Bucket(3), 1);
    assert.equal(countToT4Bucket(4), 2);
    assert.equal(countToT4Bucket(7), 3);
    assert.equal(countToT4Bucket(11), 4);
    assert.equal(countToT4Bucket(50), 4);
  });

  it('rejects T3 events with null wsa_enlil_predicted_arrival_time per §3.2 #2', async () => {
    const { _validateT3 } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    const result = _validateT3({
      cme_id: 'CME-X',
      wsa_enlil_predicted_arrival_time: null,
      wsa_enlil_halo_angle_degrees: 30,
      observed_l1_shock_time: '2024-01-01T00:00Z',
      observed_l1_source: 'DSCOVR_PRIMARY',
    }, 'fake.json');
    assert.equal(result.ok, false);
    assert.match(result.errors[0], /NOT primary-corpus eligible/);
  });

  it('T3 glancing_blow_flag derived from halo angle ≥45°', async () => {
    const { _validateT3 } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    const ok = _validateT3({
      cme_id: 'CME-X',
      wsa_enlil_predicted_arrival_time: '2024-01-02T00:00Z',
      wsa_enlil_halo_angle_degrees: 50,
      observed_l1_shock_time: '2024-01-02T03:00Z',
      observed_l1_source: 'DSCOVR_PRIMARY',
    }, 'fake.json');
    assert.equal(ok.ok, true);
    assert.equal(ok.derived.glancing_blow_flag, true);
  });

  it('T3 sigma_source falls back to placeholder_14h_per_round_2_C7 when corpus sigma is null', async () => {
    const { _validateT3, T3_NULL_SIGMA_PLACEHOLDER_HOURS } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    const result = _validateT3({
      cme_id: 'CME-X',
      wsa_enlil_predicted_arrival_time: '2024-01-02T00:00Z',
      wsa_enlil_halo_angle_degrees: 30,
      // no wsa_enlil_sigma_hours
      observed_l1_shock_time: '2024-01-02T03:00Z',
      observed_l1_source: 'DSCOVR_PRIMARY',
    }, 'fake.json');
    assert.equal(result.ok, true);
    assert.equal(result.derived.sigma_hours_effective, T3_NULL_SIGMA_PLACEHOLDER_HOURS);
    assert.equal(result.derived.sigma_source, 'placeholder_14h_per_round_2_C7');
  });

  it('T4 derives qualifying-events with strict ≥10 MeV regex (no ≥100 MeV collision)', async () => {
    const { _deriveT4QualifyingEvents } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    const observations = [
      { time: '2024-05-14T18:00Z', peak_pfu: 200, energy_channel: '>=10 MeV' },     // qualifies S1+
      { time: '2024-05-14T18:15Z', peak_pfu: 500, energy_channel: '>=10 MeV' },     // dedup-coalesced
      { time: '2024-05-14T19:00Z', peak_pfu: 800, energy_channel: '>=100 MeV' },    // off-channel — must NOT qualify
      { time: '2024-05-14T19:30Z', peak_pfu: 50,  energy_channel: '>=10 MeV' },     // qualifies (outside 30-min dedup)
    ];
    const out = _deriveT4QualifyingEvents(observations);
    assert.equal(out.length, 2);
    assert.equal(out[0].peak_pfu, 200);
    assert.equal(out[1].peak_pfu, 50);
  });

  it('T5 rejects events missing the four required arrays', async () => {
    const { _validateT5 } = await import('../scripts/corona-backtest/ingestors/corpus-loader.js');
    // Missing all four arrays
    const r1 = _validateT5({ detection_window_start: 'a', detection_window_end: 'b' }, 'fake.json');
    assert.equal(r1.ok, false);
    assert.equal(r1.errors.length >= 4, true);
    // Empty arrays explicitly permitted (§3.7.6)
    const r2 = _validateT5({
      detection_window_start: 'a', detection_window_end: 'b',
      divergence_signals: [], corroborating_alerts: [], stale_feed_events: [], satellite_switch_events: [],
    }, 'fake.json');
    assert.equal(r2.ok, true);
  });
});

describe('Backtest harness — scoring modules (Sprint 3 corona-2iu/70s/aqh)', () => {
  it('T1 bucket-Brier with uniform prior + single-bucket corpus', async () => {
    const { scoreCorpusT1 } = await import('../scripts/corona-backtest/scoring/t1-bucket-brier.js');
    const events = [
      { theatre: 'T1', flare_class_observed: 'M5.0', _derived: { bucket_observed: 2 } },
      { theatre: 'T1', flare_class_observed: 'M6.0', _derived: { bucket_observed: 2 } },
    ];
    const r = scoreCorpusT1(events);
    assert.equal(r.n_events, 2);
    assert.ok(r.brier > 0 && r.brier < 1);
    assert.equal(r.bucket_labels.length, 6);
    assert.equal(r.predicted_distribution_used.length, 6);
  });

  it('T2 GFZ-lag-excluded events do not enter regression Brier', async () => {
    const { scoreCorpusT2 } = await import('../scripts/corona-backtest/scoring/t2-bucket-brier.js');
    const events = [
      { theatre: 'T2', kp_swpc_observed: 7.5, kp_gfz_observed: 7.7, _derived: { bucket_observed: 3, regression_tier_eligible: true } },
      { theatre: 'T2', kp_swpc_observed: 6.5, kp_gfz_observed: null, _derived: { bucket_observed: 2, regression_tier_eligible: false } },
    ];
    const r = scoreCorpusT2(events);
    assert.equal(r.n_events, 1);
    assert.equal(r.n_events_total, 2);
    assert.equal(r.n_events_excluded_gfz_lag, 1);
  });

  it('T3 MAE + ±6h hit rate compute correctly', async () => {
    const { scoreCorpusT3 } = await import('../scripts/corona-backtest/scoring/t3-timing-error.js');
    const events = [
      {
        theatre: 'T3', event_id: 'cme-1', cme_id: 'CME-1',
        wsa_enlil_predicted_arrival_time: '2024-01-01T00:00Z',
        observed_l1_shock_time: '2024-01-01T03:00Z', // 3h error
        observed_l1_source: 'DSCOVR_PRIMARY',
        _derived: { glancing_blow_flag: false, sigma_hours_effective: 14, sigma_source: 'corpus_value' },
      },
      {
        theatre: 'T3', event_id: 'cme-2', cme_id: 'CME-2',
        wsa_enlil_predicted_arrival_time: '2024-01-02T00:00Z',
        observed_l1_shock_time: '2024-01-02T08:00Z', // 8h error
        observed_l1_source: 'DSCOVR_PRIMARY',
        _derived: { glancing_blow_flag: false, sigma_hours_effective: 14, sigma_source: 'corpus_value' },
      },
    ];
    const r = scoreCorpusT3(events);
    assert.equal(r.n_events, 2);
    assert.equal(r.mae_hours, 5.5);
    assert.equal(r.within_6h_hit_rate, 0.5);
    // No glancing-blow events → null per Round 2 C8
    assert.equal(r.glancing_blow_within_12h_hit_rate, null);
  });

  it('T4 bucket-Brier with single-bucket corpus matches the runtime BUCKETS export', async () => {
    const { scoreCorpusT4, T4_BUCKETS } = await import('../scripts/corona-backtest/scoring/t4-bucket-brier.js');
    const { BUCKETS } = await import('../src/theatres/proton-cascade.js');
    assert.deepEqual(T4_BUCKETS, BUCKETS.map((b) => b.label));
    const events = [
      { theatre: 'T4', _derived: { bucket_observed: 0, qualifying_event_count_observed_derived: 1, qualifying_events_derived: [], window_override: false, annotation_warning: null } },
    ];
    const r = scoreCorpusT4(events);
    assert.equal(r.n_events, 1);
    assert.ok(r.brier >= 0);
  });

  it('T5 FP classification: signal resolved ≤60min with no corroboration → FP', async () => {
    const { scoreCorpusT5 } = await import('../scripts/corona-backtest/scoring/t5-quality-of-behavior.js');
    const events = [{
      theatre: 'T5',
      event_id: 't5-1',
      detection_window_start: '2024-01-01T00:00Z',
      detection_window_end: '2024-01-02T00:00Z',
      divergence_signals: [
        { signal_time: '2024-01-01T01:00Z', signal_resolution_time: '2024-01-01T01:30Z', false_positive_label: true },
        { signal_time: '2024-01-01T03:00Z', signal_resolution_time: '2024-01-01T05:00Z', false_positive_label: false },
      ],
      corroborating_alerts: [],
      stale_feed_events: [],
      satellite_switch_events: [],
    }];
    const r = scoreCorpusT5(events);
    assert.equal(r.n_signals, 2);
    // One signal resolves <60min with no corroboration; the other persists
    // (>60min). Computed FP rate = 1/2 = 0.5.
    assert.equal(r.fp_rate, 0.5);
  });

  it('T5 corroborating alert within 60min suppresses FP classification', async () => {
    const { scoreCorpusT5 } = await import('../scripts/corona-backtest/scoring/t5-quality-of-behavior.js');
    const events = [{
      theatre: 'T5',
      event_id: 't5-2',
      detection_window_start: '2024-01-01T00:00Z',
      detection_window_end: '2024-01-02T00:00Z',
      divergence_signals: [
        { signal_time: '2024-01-01T01:00Z', signal_resolution_time: '2024-01-01T01:30Z', false_positive_label: false },
      ],
      corroborating_alerts: [
        { signal_time: '2024-01-01T01:15Z', source: 'NOAA_SWPC_ALERT', alert_id: 'ALERT-1', time: '2024-01-01T01:15Z' },
      ],
      stale_feed_events: [],
      satellite_switch_events: [],
    }];
    const r = scoreCorpusT5(events);
    assert.equal(r.fp_rate, 0); // alert within 60min ⇒ NOT FP
  });

  // CI-1 / Round 2 regression test:
  // The pre-fix implementation filtered invalid stale-latency entries before
  // re-zipping with staleEvents.map((s, i) => ...), shifting indices and
  // assigning the wrong latency to any event after an invalid one. The fix
  // preserves source order with latency_seconds=null for invalid entries.
  // This test would FAIL on the pre-fix code (event at index 2 would get
  // either the third valid latency or undefined, never null with the source
  // event preserved).
  it('T5 stale-feed: invalid timestamp in middle does not shift later latencies (CI-1 regression)', async () => {
    const { scoreCorpusT5 } = await import('../scripts/corona-backtest/scoring/t5-quality-of-behavior.js');
    const events = [{
      theatre: 'T5',
      event_id: 't5-stale-mix',
      detection_window_start: '2024-01-01T00:00Z',
      detection_window_end: '2024-01-02T00:00Z',
      divergence_signals: [],
      corroborating_alerts: [],
      satellite_switch_events: [],
      stale_feed_events: [
        // Index 0: VALID — 60s latency
        { actual_onset_time: '2024-01-01T01:00:00Z', detection_time: '2024-01-01T01:01:00Z', satellite: 'DSCOVR' },
        // Index 1: INVALID timestamp — must produce latency_seconds=null,
        //   AND must NOT consume the index-2 record's latency.
        { actual_onset_time: 'not-a-date',           detection_time: 'also-not-a-date',     satellite: 'DSCOVR' },
        // Index 2: VALID — 240s latency. In the pre-fix code, this latency
        //   was assigned to staleEvents[1] (wrong) and staleEvents[2] got
        //   undefined→null. Post-fix, staleEvents[2] keeps its 240s value.
        { actual_onset_time: '2024-01-01T03:00:00Z', detection_time: '2024-01-01T03:04:00Z', satellite: 'ACE' },
      ],
    }];
    const r = scoreCorpusT5(events);

    // Per-event report integrity: source order preserved, exactly one null,
    // latencies on the valid entries are correct AND attached to the right
    // satellite (the satellite field is identity-preserving — DSCOVR for
    // index 0, ACE for index 2 — so a misalignment would also swap the
    // satellite field).
    const perEv = r.per_event[0];
    assert.equal(perEv.stale_feed_count, 3);
    assert.equal(perEv.stale_feed_events.length, 3);

    // Index 0: DSCOVR, 60s
    assert.equal(perEv.stale_feed_events[0].satellite, 'DSCOVR');
    assert.equal(perEv.stale_feed_events[0].latency_seconds, 60);
    // Index 1: invalid, null. The pre-fix code would have assigned 240s here.
    assert.equal(perEv.stale_feed_events[1].latency_seconds, null);
    // Index 2: ACE, 240s. The pre-fix code would have assigned undefined→null here.
    assert.equal(perEv.stale_feed_events[2].satellite, 'ACE');
    assert.equal(perEv.stale_feed_events[2].latency_seconds, 240);

    // Aggregate p50/p95 must filter the null and report on the two valid entries:
    //   sorted = [60, 240]; p50 = 150 (linear interp), p95 = 60 + 0.95*(240-60) = 231
    assert.equal(r.stale_feed_p50_seconds, 150);
    assert.equal(r.stale_feed_p95_seconds, 231);
    // n_stale_events counts valid entries only (used for percentile computation).
    assert.equal(r.n_stale_events, 2);
  });
});

describe('Backtest harness — hashing (Sprint 3 corona-2ox)', () => {
  it('computeFileHash returns deterministic SHA-256 hex', async () => {
    const { computeFileHash } = await import('../scripts/corona-backtest/reporting/hash-utils.js');
    // Hash this very test file twice; must agree.
    const path = new URL('./corona_test.js', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const h1 = computeFileHash(path);
    const h2 = computeFileHash(path);
    assert.equal(h1, h2);
    assert.match(h1, /^[0-9a-f]{64}$/);
  });
});

describe('Backtest harness — verdict thresholds (§6 conformance)', () => {
  it('T1 verdict pass/marginal/fail bands', async () => {
    const { verdictT1 } = await import('../scripts/corona-backtest/scoring/t1-bucket-brier.js');
    assert.equal(verdictT1({ brier: 0.10, bucket_calibration: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9] }), 'pass');
    assert.equal(verdictT1({ brier: 0.18, bucket_calibration: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8] }), 'marginal');
    assert.equal(verdictT1({ brier: 0.30, bucket_calibration: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }), 'fail');
  });

  it('T3 verdict pass/marginal/fail bands', async () => {
    const { verdictT3 } = await import('../scripts/corona-backtest/scoring/t3-timing-error.js');
    assert.equal(verdictT3({ mae_hours: 5, within_6h_hit_rate: 0.7 }), 'pass');
    assert.equal(verdictT3({ mae_hours: 8, within_6h_hit_rate: 0.55 }), 'marginal');
    assert.equal(verdictT3({ mae_hours: 12, within_6h_hit_rate: 0.30 }), 'fail');
  });

  it('T5 verdict requires ALL three primary metrics in band', async () => {
    const { verdictT5 } = await import('../scripts/corona-backtest/scoring/t5-quality-of-behavior.js');
    assert.equal(verdictT5({ fp_rate: 0.05, stale_feed_p50_seconds: 60, satellite_switch_handled_rate: 0.97 }), 'pass');
    // FP slips to marginal band — should NOT be pass even though others pass.
    assert.equal(verdictT5({ fp_rate: 0.13, stale_feed_p50_seconds: 60, satellite_switch_handled_rate: 0.97 }), 'marginal');
    assert.equal(verdictT5({ fp_rate: 0.20, stale_feed_p50_seconds: 60, satellite_switch_handled_rate: 0.97 }), 'fail');
  });
});
