/**
 * Proton Event Cascade Theatre (T4)
 *
 * Multi-class market: "Given X-class flare at T₀, how many S1+
 * proton events in N hours?"
 *
 * Buckets: 0-1, 2-3, 4-6, 7-10, 11+ — pinned at Sprint 2 freeze
 * (grimoires/loa/calibration/corona/calibration-protocol.md §T4).
 * Sprint 5 may re-baseline against Run 1 distribution if pass/marginal
 * thresholds drop.
 *
 * This is the solar equivalent of TREMOR's Aftershock Cascade.
 * After a major flare, an active region often produces additional
 * flares and proton events in a cascade pattern.
 *
 * The key prior model is the Wheatland (2001) waiting-time distribution
 * for solar flares, which follows a piecewise power law similar to
 * the Omori law for aftershocks. The Wheatland model captures the
 * correlation between flares (the trigger) and S-scale proton events
 * (the qualifying outcome). Sprint 2 (corona-19q) bound direct
 * S-scale proton-flux qualifying-event logic, retiring the cycle-001
 * Sprint 0 flare-class proxy that previously stood in for proton flux.
 *
 * S-scale (NOAA Solar Radiation Storm Scale, ≥10 MeV proton flux):
 *   S1: ≥10 pfu        (Minor)
 *   S2: ≥100 pfu       (Moderate)
 *   S3: ≥1,000 pfu     (Strong)
 *   S4: ≥10,000 pfu    (Severe)
 *   S5: ≥100,000 pfu   (Extreme)
 *
 * Cleanup history:
 *   Sprint 0 (corona-222): renamed from R-scale (radio blackout) framing.
 *     CORONA's T4 has always been declared Proton Event Cascade in
 *     spec/construct.json:T4. R-scale theatre is deferred to a future
 *     construct pack per operator.
 *   Sprint 2 (corona-19q): retired flare-class proxy.
 *     processProtonEventCascade now qualifies on proton_flux bundles
 *     with flux ≥ S-scale PFU threshold AND ≥10 MeV energy channel.
 *     Flare events demoted to correlation/informational evidence
 *     (logged to position_history but not counted).
 */

import { flareRank } from '../oracles/swpc.js';

// Bucket boundaries pinned by Sprint 2 freeze (calibration-protocol.md §T4).
// Same scaffold inherited from Sprint 0 (matches Wheatland prior decay shape
// and TREMOR's bucket-Brier pattern). Sprint 5 may re-baseline based on
// Run 1 distribution if pass/marginal thresholds drop.
const BUCKETS = [
  { label: '0-1',  min: 0,  max: 1 },
  { label: '2-3',  min: 2,  max: 3 },
  { label: '4-6',  min: 4,  max: 6 },
  { label: '7-10', min: 7,  max: 10 },
  { label: '11+',  min: 11, max: Infinity },
];

/**
 * S-scale qualifying-event PFU thresholds (NOAA Solar Radiation Storm Scale).
 *
 * A proton_flux bundle qualifies as an S<level> event when:
 *   1. payload.proton.energy_channel includes "10" (≥10 MeV channel)
 *   2. payload.proton.flux ≥ the level's PFU threshold
 *   3. it falls outside the SEP_DEDUP_WINDOW_MINUTES of the most recent
 *      qualifying event (one discrete event per ≥30-min onset window;
 *      consecutive 1-min above-threshold readings within the window
 *      coalesce into a single SEP event per NOAA convention)
 *
 * Sprint 2 freeze (corona-19q): direct proton-flux qualifying logic
 * replaces the cycle-001 Sprint 0 flare-class proxy
 * (S1↔M1.0, S2↔M5.0, S3↔X1.0). The Wheatland prior productivity model
 * is preserved as the trigger-conditioned forecast; only the qualifying
 * check changed.
 */
const S_SCALE_THRESHOLDS_PFU = {
  S1: 10,
  S2: 100,
  S3: 1000,
  S4: 10000,
  S5: 100000,
};

// SEP onset / dedup window: NOAA defines an SEP event onset as flux
// sustained above threshold for ≥30 min. Consecutive 1-min above-threshold
// readings within this window coalesce into a single qualifying event.
// See calibration-protocol.md §T4 for the freeze rationale.
const SEP_DEDUP_WINDOW_MINUTES = 30;

/**
 * Active region productivity parameters.
 *
 * After a large flare, an active region's flare rate follows
 * a modified Wheatland waiting-time distribution.
 *
 * Parameters by McIntosh classification complexity:
 *   - Simple (alpha/beta): lower productivity
 *   - Complex (beta-gamma-delta): higher productivity
 *
 * Since we often don't have McIntosh class in real-time,
 * we estimate from the triggering flare's class.
 */
const PRODUCTIVITY_PARAMS = {
  X_class: { lambda: 8,  decay: 0.85 },  // X-class trigger → very productive
  M_class: { lambda: 4,  decay: 0.90 },  // M-class trigger
  default: { lambda: 3,  decay: 0.92 },
};

/**
 * Estimate expected S1+ event count from productivity model.
 *
 * @param {string} triggerClass - Flare class of triggering event (e.g. "X2.5")
 * @param {number} windowHours - Prediction window
 * @param {number} [lambdaScalar=1.0] - Sprint 05 sensitivity-proof injection
 *   seam (CYCLE-002-SPRINT-PLAN.md §4.3.1 lines 449–451). Multiplicative
 *   scalar on PRODUCTIVITY_PARAMS lambda. Default 1.0 is byte-identical to
 *   pre-Sprint-05 behavior: `params.lambda * 1.0 === params.lambda` per
 *   IEEE-754, so the live runtime path (which never supplies this argument)
 *   produces identical output. Non-default values are used by
 *   tests/sensitivity-proof-T4-test.js to demonstrate the cycle-002 replay
 *   harness is sensitive to a controlled T4 runtime parameter perturbation.
 *   No-refit covenant (CHARTER §8.3) holds: this seam never mutates
 *   PRODUCTIVITY_PARAMS itself; it only scales at call time when the caller
 *   asks for a sensitivity perturbation.
 * @returns {number} Expected count of S1+ proton events
 */
function estimateExpectedCount(triggerClass, windowHours, lambdaScalar = 1.0) {
  const letter = (triggerClass ?? 'M1.0')[0].toUpperCase();
  const params = letter === 'X' ? PRODUCTIVITY_PARAMS.X_class :
    letter === 'M' ? PRODUCTIVITY_PARAMS.M_class :
    PRODUCTIVITY_PARAMS.default;

  // Flare number within class affects productivity
  const number = parseFloat((triggerClass ?? 'M1.0').slice(1)) || 1;
  const intensityMultiplier = letter === 'X' ? (1 + number * 0.15) : (1 + number * 0.05);

  // Integrate decaying rate: N(T) = lambda * (1 - decay^(T/24)) / (1 - decay).
  // lambdaScalar=1.0 (default) is a no-op: params.lambda * 1.0 === params.lambda
  // in IEEE-754, so the multiplication is byte-identical to the pre-Sprint-05
  // form `params.lambda * intensityMultiplier * ...`.
  const days = windowHours / 24;
  const expectedN = params.lambda * lambdaScalar * intensityMultiplier *
    (1 - Math.pow(params.decay, days)) / (1 - params.decay);

  return Math.max(0, expectedN);
}

/**
 * Convert expected count to bucket probabilities using Poisson distribution.
 */
function countToBucketProbabilities(expectedCount) {
  const probs = BUCKETS.map(({ min, max }) => {
    let p = 0;
    const upper = Math.min(max, 40);
    for (let k = min; k <= upper; k++) {
      p += poissonPMF(expectedCount, k);
    }
    if (max === Infinity) {
      let tailP = 0;
      for (let k = 0; k < min; k++) {
        tailP += poissonPMF(expectedCount, k);
      }
      p = Math.max(p, 1 - tailP);
    }
    return p;
  });

  const total = probs.reduce((s, p) => s + p, 0);
  return probs.map((p) => Math.round((p / total) * 1000) / 1000);
}

function poissonPMF(lambda, k) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  const logP = k * Math.log(lambda) - lambda - logFactorial(k);
  return Math.exp(logP);
}

function logFactorial(n) {
  if (n <= 1) return 0;
  let sum = 0;
  for (let i = 2; i <= n; i++) sum += Math.log(i);
  return sum;
}

// =========================================================================
// Theatre lifecycle
// =========================================================================

/**
 * Create a Proton Event Cascade theatre.
 *
 * @param {object} params
 * @param {object} params.triggerBundle - Evidence bundle for the triggering flare
 * @param {string} [params.s_scale_threshold] - Minimum S-scale for counting (default S1) — maps to PFU via S_SCALE_THRESHOLDS_PFU
 * @param {number} [params.window_hours] - Prediction window (default 72)
 * @param {object} [options]
 * @param {Function} [options.now] - Default-preserving clock-injection seam (Sprint 02; CONTRACT §10.1).
 * @param {number} [options.lambdaScalar=1.0] - Sprint 05 sensitivity-proof
 *   injection seam (CYCLE-002-SPRINT-PLAN.md §4.3.1 lines 449–451). Forwarded
 *   to estimateExpectedCount; default 1.0 is byte-identical to pre-Sprint-05
 *   behavior. Used only by tests/sensitivity-proof-T4-test.js to demonstrate
 *   harness sensitivity to a T4 runtime parameter perturbation. The live
 *   runtime path never supplies this argument.
 * @returns {object|null} Theatre definition
 */
export function createProtonEventCascade({
  triggerBundle,
  s_scale_threshold = 'S1',
  window_hours = 72,
}, { now: nowFn = () => Date.now(), lambdaScalar = 1.0 } = {}) {
  const flare = triggerBundle.payload.flare;
  if (!flare) return null;

  // Require M5+ trigger to open a cascade theatre
  const triggerRank = flare.rank;
  if (triggerRank < flareRank('M5.0')) return null;

  const now = nowFn();
  const countThresholdPfu = S_SCALE_THRESHOLDS_PFU[s_scale_threshold] ?? S_SCALE_THRESHOLDS_PFU.S1;
  const expectedCount = estimateExpectedCount(flare.class_string, window_hours, lambdaScalar);
  const initialProbs = countToBucketProbabilities(expectedCount);

  return {
    id: `T4-PROTON-CASCADE-${triggerBundle.payload.event_id}-${now}`,
    template: 'proton_event_cascade',
    question: `${flare.class_string} trigger: how many ${s_scale_threshold}+ proton events within ${window_hours}h?`,

    trigger: {
      event_id: triggerBundle.payload.event_id,
      class_string: flare.class_string,
      rank: triggerRank,
      time: triggerBundle.payload.timing?.begin ?? now,
      active_region: triggerBundle.payload.active_region ?? null,
    },

    s_scale_threshold,
    count_threshold_pfu: countThresholdPfu,

    opens_at: now,
    closes_at: now + window_hours * 60 * 60 * 1000,
    state: 'open',
    outcome: null,

    // Productivity model
    productivity: {
      expected_count: Math.round(expectedCount * 10) / 10,
      model: 'wheatland_modified',
    },

    bucket_labels: BUCKETS.map((b) => b.label),
    current_position: initialProbs,
    qualifying_event_count: 0,
    qualifying_events: [],
    last_qualifying_event_time: null,

    position_history: [
      {
        t: now,
        p: initialProbs,
        qualifying_count: 0,
        evidence: triggerBundle.bundle_id,
        reason: `Wheatland prior: expected ${expectedCount.toFixed(1)} ${s_scale_threshold}+ events from ${flare.class_string} trigger`,
      },
    ],
    evidence_bundles: [triggerBundle.bundle_id],
    resolving_bundle_id: null,
    resolved_at: null,
  };
}

/**
 * Process evidence against a Proton Event Cascade.
 *
 * Sprint 2 freeze (corona-19q): qualifying events are proton_flux bundles
 * with flux ≥ count_threshold_pfu AND ≥10 MeV energy channel, deduplicated
 * within SEP_DEDUP_WINDOW_MINUTES of the most recent qualifying event.
 * Flare events are correlation/informational — logged to position_history
 * but not counted (Wheatland prior carries the trigger-conditioned forecast
 * via createProtonEventCascade; subsequent flares no longer qualify).
 */
export function processProtonEventCascade(theatre, bundle, { now: nowFn = () => Date.now() } = {}) {
  if (theatre.state === 'resolved' || theatre.state === 'expired') return theatre;

  const updated = { ...theatre };
  updated.evidence_bundles = [...theatre.evidence_bundles, bundle.bundle_id];

  const payload = bundle.payload;
  const now = nowFn();

  if (payload?.event_type === 'solar_flare' || payload?.event_type === 'donki_flare') {
    // Sprint 2: flare events are correlation/informational. Wheatland trigger
    // forecast already accounts for productivity; in-window flares do not
    // qualify as proton-event count.
    const flareLabel = payload.flare?.class_string ?? 'unknown';
    updated.position_history = [
      ...theatre.position_history,
      {
        t: now,
        p: theatre.current_position,
        qualifying_count: theatre.qualifying_event_count,
        evidence: bundle.bundle_id,
        reason: `${flareLabel} flare — correlation evidence (proton-flux qualifying logic, Sprint 2)`,
      },
    ];
    return updated;
  }

  if (payload?.event_type !== 'proton_flux') {
    // Other bundle types (kp_index, solar_wind, donki_cme, ...) are
    // off-topic for T4 qualification but may still be ingested via the
    // routing rules in src/processor/bundles.js. Drop without note.
    return updated;
  }

  const peakPfu = payload.proton?.flux;
  const energyChannel = payload.proton?.energy_channel ?? '';
  // S-scale is defined on the ≥10 MeV proton channel specifically.
  // The ≥100 MeV / ≥50 MeV channels are useful diagnostic data but are NOT
  // the S-scale channel. Match the canonical SWPC channel label "≥10 MeV"
  // (or ">=10 MeV") explicitly to avoid the substring-match collision with
  // ">=100 MeV" that bundles.js's above_s1 heuristic suffers from.
  const isAtTenMev = /(?:^|\D)10\s*MeV\b/i.test(energyChannel);
  const eventTime = payload.event_time ?? now;

  if (peakPfu == null || !isAtTenMev) {
    // Wrong energy channel or null flux — informational, no count change
    updated.position_history = [
      ...theatre.position_history,
      {
        t: now,
        p: theatre.current_position,
        qualifying_count: theatre.qualifying_event_count,
        evidence: bundle.bundle_id,
        reason: `proton_flux off-channel (energy=${energyChannel || 'null'}) — not counted`,
      },
    ];
    return updated;
  }

  if (peakPfu < theatre.count_threshold_pfu) {
    // Sub-threshold proton flux — informational
    updated.position_history = [
      ...theatre.position_history,
      {
        t: now,
        p: theatre.current_position,
        qualifying_count: theatre.qualifying_event_count,
        evidence: bundle.bundle_id,
        reason:
          `Sub-${theatre.s_scale_threshold} proton flux ${peakPfu.toFixed(1)} pfu ` +
          `(< ${theatre.count_threshold_pfu} pfu) — no count change`,
      },
    ];
    return updated;
  }

  // Above-threshold proton flux: dedup against most recent qualifying event
  const lastTime = theatre.last_qualifying_event_time;
  if (lastTime != null) {
    const gapMinutes = (eventTime - lastTime) / 60_000;
    if (gapMinutes < SEP_DEDUP_WINDOW_MINUTES) {
      // Within onset/dedup window of prior event — coalesce, do not count
      updated.position_history = [
        ...theatre.position_history,
        {
          t: now,
          p: theatre.current_position,
          qualifying_count: theatre.qualifying_event_count,
          evidence: bundle.bundle_id,
          reason:
            `${theatre.s_scale_threshold}+ proton flux ${peakPfu.toFixed(1)} pfu ` +
            `within ${SEP_DEDUP_WINDOW_MINUTES}-min onset window — coalesced into ongoing event`,
        },
      ];
      return updated;
    }
  }

  // New qualifying event
  const newCount = theatre.qualifying_event_count + 1;
  updated.qualifying_event_count = newCount;
  updated.last_qualifying_event_time = eventTime;
  updated.qualifying_events = [
    ...theatre.qualifying_events,
    {
      bundle_id: bundle.bundle_id,
      peak_pfu: peakPfu,
      energy_channel: energyChannel,
      time: eventTime,
      evidence_class: bundle.evidence_class,
    },
  ];

  // Recompute bucket probabilities
  const elapsed = (now - theatre.opens_at) / 3600_000;
  const remaining = Math.max(1, (theatre.closes_at - now) / 3600_000);
  const totalWindow = (theatre.closes_at - theatre.opens_at) / 3600_000;

  // Observed rate extrapolation with productivity decay correction
  const rate = elapsed > 0 ? newCount / elapsed : newCount;
  const projectedTotal = newCount + rate * remaining * 0.75; // decay correction

  // Blend Wheatland prior with observed projection
  const priorWeight = Math.max(0.1, 1 - (elapsed / totalWindow));
  const obsWeight = 1 - priorWeight;
  const blendedExpected =
    priorWeight * theatre.productivity.expected_count +
    obsWeight * projectedTotal;

  const newProbs = countToBucketProbabilities(blendedExpected);

  updated.current_position = newProbs;
  updated.position_history = [
    ...theatre.position_history,
    {
      t: now,
      p: newProbs,
      qualifying_count: newCount,
      evidence: bundle.bundle_id,
      reason:
        `${theatre.s_scale_threshold}+ proton event #${newCount} ` +
        `(${peakPfu.toFixed(1)} pfu) — ` +
        `rate=${rate.toFixed(2)}/hr, projected=${projectedTotal.toFixed(1)}, ` +
        `blended=${blendedExpected.toFixed(1)} (prior_w=${priorWeight.toFixed(2)})`,
    },
  ];

  return updated;
}

/**
 * Resolve the Proton Event Cascade at theatre close.
 */
export function resolveProtonEventCascade(theatre, { now: nowFn = () => Date.now() } = {}) {
  if (theatre.state === 'resolved') return theatre;

  const now = nowFn();
  const count = theatre.qualifying_event_count;
  const outcomeIndex = BUCKETS.findIndex(
    ({ min, max }) => count >= min && count <= max
  );

  return {
    ...theatre,
    state: 'resolved',
    outcome: outcomeIndex >= 0 ? outcomeIndex : BUCKETS.length - 1,
    resolved_at: now,
    position_history: [
      ...theatre.position_history,
      {
        t: now,
        p: theatre.current_position,
        qualifying_count: count,
        evidence: null,
        reason: `Theatre closed — final count: ${count} → bucket "${BUCKETS[outcomeIndex >= 0 ? outcomeIndex : BUCKETS.length - 1].label}"`,
      },
    ],
  };
}

export { BUCKETS, S_SCALE_THRESHOLDS_PFU, SEP_DEDUP_WINDOW_MINUTES };
