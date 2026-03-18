/**
 * Flare Class Gate Theatre
 *
 * Binary threshold market: "Will an M-class (or X-class) flare occur within Nh?"
 *
 * The solar equivalent of TREMOR's Magnitude Gate. Resolves against
 * GOES X-ray flux confirmed by DONKI classification.
 *
 * Base rates from NOAA SWPC historical solar flare statistics:
 *   - M-class: ~2-5 per day during solar maximum, ~0.1/day during minimum
 *   - X-class: ~0.1-0.5 per day during maximum, ~0.01/day during minimum
 *
 * GOES X-ray classification:
 *   A < B < C < M < X
 *   Each class is 10× the previous in W/m² at 1-8 Angstrom
 */

import { flareThresholdProbability } from '../processor/uncertainty.js';
import { flareRank } from '../oracles/swpc.js';

/**
 * Create a Flare Class Gate theatre.
 *
 * @param {object} params
 * @param {string} [params.id] - Theatre ID
 * @param {string} params.threshold_class - Minimum flare class (e.g. "M1.0", "X1.0")
 * @param {number} params.window_hours - Duration
 * @param {number} params.base_rate - Historical probability
 * @returns {object} Theatre definition
 */
export function createFlareClassGate({
  id,
  threshold_class,
  window_hours,
  base_rate = 0.15,
}) {
  const now = Date.now();
  const closes_at = now + window_hours * 60 * 60 * 1000;
  const thresholdRank = flareRank(threshold_class);

  return {
    id: id || `T1-FLARE-${threshold_class}-${window_hours}H-${now}`,
    template: 'flare_class_gate',
    question: `Will a ≥${threshold_class} flare occur within ${window_hours}h?`,
    threshold_class,
    threshold_rank: thresholdRank,
    opens_at: now,
    closes_at,
    state: 'open',
    outcome: null,

    position_history: [
      {
        t: now,
        p: base_rate,
        evidence: null,
        reason: `Base rate for ≥${threshold_class} flare over ${window_hours}h`,
      },
    ],
    current_position: base_rate,
    evidence_bundles: [],

    resolving_bundle_id: null,
    resolved_at: null,
  };
}

/**
 * Process an evidence bundle against a Flare Class Gate.
 *
 * Position updates based on:
 *   - In-progress flare near threshold → shift up using doubt pricing
 *   - Completed flare crossing threshold → resolve YES
 *   - Sub-threshold activity → mild positive signal
 *   - Solar wind / Kp conditions → ambient adjustment
 */
export function processFlareClassGate(theatre, bundle) {
  if (theatre.state === 'resolved' || theatre.state === 'expired') return theatre;

  const updated = { ...theatre };
  updated.evidence_bundles = [...theatre.evidence_bundles, bundle.bundle_id];

  const payload = bundle.payload;

  // Only process flare events for resolution
  if (payload.event_type !== 'solar_flare') return updated;

  const flare = payload.flare;
  const eventRank = flare.rank;
  const thresholdRank = theatre.threshold_rank;
  const crossesThreshold = eventRank >= thresholdRank;

  // Ground truth or provisional_mature crossing threshold → resolve YES
  if (
    crossesThreshold &&
    (bundle.evidence_class === 'ground_truth' || bundle.evidence_class === 'provisional_mature')
  ) {
    updated.state = bundle.evidence_class === 'ground_truth' ? 'resolved' : 'provisional_hold';
    updated.outcome = true;
    updated.resolving_bundle_id = bundle.bundle_id;
    updated.resolved_at = Date.now();
    updated.current_position = 1.0;
    updated.position_history = [
      ...theatre.position_history,
      {
        t: Date.now(),
        p: 1.0,
        evidence: bundle.bundle_id,
        reason: `${flare.class_string} flare — threshold ≥${theatre.threshold_class} crossed (${bundle.evidence_class})`,
      },
    ];
    return updated;
  }

  // Provisional flare — update position using uncertainty
  if (bundle.evidence_class === 'provisional' || bundle.evidence_class === 'cross_validated') {
    const crossingProb = flareThresholdProbability(flare.uncertainty, theatre.threshold_class);
    const qualityWeight = payload.quality.composite;
    const evidenceWeight = 0.3 * qualityWeight;

    let newPosition;
    if (crossesThreshold) {
      // Automatic flare crosses threshold — strong shift but not resolution
      newPosition = theatre.current_position + (1 - theatre.current_position) * evidenceWeight * 0.8;
    } else if (crossingProb > 0.1) {
      // Near-threshold — uncertainty makes crossing possible
      newPosition = theatre.current_position + (crossingProb - theatre.current_position) * evidenceWeight * 0.3;
    } else {
      // Sub-threshold flare — mild positive (solar activity exists)
      newPosition = theatre.current_position * (1 + 0.03 * qualityWeight);
    }

    newPosition = Math.max(0.01, Math.min(0.99, newPosition));
    updated.current_position = Math.round(newPosition * 1000) / 1000;
    updated.position_history = [
      ...theatre.position_history,
      {
        t: Date.now(),
        p: updated.current_position,
        evidence: bundle.bundle_id,
        reason: `${flare.class_string} (${payload.status}) — crossing_prob=${crossingProb.toFixed(3)}, quality=${qualityWeight.toFixed(3)}`,
      },
    ];
  }

  return updated;
}

/**
 * Expire a Flare Class Gate that ran out of time without a qualifying event.
 */
export function expireFlareClassGate(theatre) {
  if (theatre.state === 'resolved') return theatre;

  return {
    ...theatre,
    state: 'resolved',
    outcome: false,
    resolved_at: Date.now(),
    position_history: [
      ...theatre.position_history,
      {
        t: Date.now(),
        p: theatre.current_position,
        evidence: null,
        reason: 'Theatre expired — no qualifying flare',
      },
    ],
  };
}
