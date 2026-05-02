/**
 * scripts/corona-backtest/scoring/t2-binary-brier.js
 *
 * T2 Geomagnetic Storm Gate threshold-native binary Brier scoring (cycle-002 path).
 *
 * Per:
 *   - grimoires/loa/a2a/cycle-002/sprint-00/CHARTER.md §9 (T1/T2 binary scoring decision, no fake bucket projection)
 *   - grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md §8.2 (T2 GFZ-preferred outcome derivation)
 *
 * Cycle-001 6-bucket scoring at scoring/t2-bucket-brier.js is FROZEN
 * (corpus-baseline diagnostic per CHARTER §9.3). This module is the
 * cycle-002 runtime-wired scoring path.
 *
 * GFZ-preferred outcome (CONTRACT §8.2):
 *   kp_observed = event.kp_gfz_observed ?? event.kp_swpc_observed
 *   o = 1 iff kp_observed >= gate_params.kp_threshold
 *
 * GFZ-lag exclusion: events with no observable Kp at all (both gfz and swpc null)
 * are skipped from corpus-level scoring and surfaced via n_events_excluded.
 *
 * Operator hard constraint #5 / SDD §6.4: independent Brier formula; no
 * code sharing with t1-binary-brier.js, t2-bucket-brier.js, etc.
 */

/**
 * Score one T2 corpus event against its replay trajectory.
 */
export function scoreEventT2Binary(event, trajectory) {
  if (event.theatre !== 'T2') {
    throw new Error(`scoreEventT2Binary: expected T2 event, got "${event.theatre}"`);
  }
  if (trajectory?.theatre_id !== 'T2') {
    throw new Error(`scoreEventT2Binary: expected T2 trajectory, got "${trajectory?.theatre_id}"`);
  }
  if (trajectory.distribution_shape !== 'binary_scalar') {
    throw new Error(`scoreEventT2Binary: expected binary_scalar shape, got "${trajectory.distribution_shape}"`);
  }
  const p = trajectory.current_position_at_cutoff;
  if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error(`scoreEventT2Binary: invalid predicted scalar ${p} for ${event.event_id}`);
  }
  const kpThreshold = trajectory.gate_params?.kp_threshold;
  if (typeof kpThreshold !== 'number' || !Number.isFinite(kpThreshold)) {
    throw new Error(`scoreEventT2Binary: trajectory.gate_params.kp_threshold must be a number for ${event.event_id}`);
  }
  // CONTRACT §8.2: GFZ-preferred Kp comparison (definitive trumps preliminary).
  const kpObserved = event.kp_gfz_observed ?? event.kp_swpc_observed;
  if (typeof kpObserved !== 'number' || !Number.isFinite(kpObserved)) {
    throw new Error(
      `scoreEventT2Binary: ${event.event_id} has no usable Kp observation ` +
      `(gfz=${event.kp_gfz_observed}, swpc=${event.kp_swpc_observed})`,
    );
  }
  const observed = kpObserved >= kpThreshold ? 1 : 0;
  const diff = p - observed;
  const brierScore = diff * diff;
  return {
    event_id: event.event_id,
    predicted_p: p,
    observed,
    kp_observed: kpObserved,
    kp_observed_source: event.kp_gfz_observed != null ? 'gfz' : 'swpc',
    kp_threshold: kpThreshold,
    brier_score: brierScore,
    regression_tier_eligible: event._derived?.regression_tier_eligible ?? false,
    trajectory_hash: trajectory.meta?.trajectory_hash ?? null,
  };
}

/**
 * Score corpus events with optional GFZ-lag exclusion.
 * Events lacking ANY Kp observation are surfaced via n_events_excluded.
 */
export function scoreCorpusT2Binary(eventTrajectoryPairs) {
  if (!Array.isArray(eventTrajectoryPairs)) {
    throw new Error('scoreCorpusT2Binary: argument must be an array of { event, trajectory } pairs');
  }
  const eligible = [];
  let excluded = 0;
  for (const pair of eventTrajectoryPairs) {
    const { event } = pair;
    const hasGfz = typeof event?.kp_gfz_observed === 'number';
    const hasSwpc = typeof event?.kp_swpc_observed === 'number';
    if (hasGfz || hasSwpc) {
      eligible.push(pair);
    } else {
      excluded += 1;
    }
  }
  const perEvent = eligible.map(({ event, trajectory }) => scoreEventT2Binary(event, trajectory));
  const brier = perEvent.length === 0
    ? 0
    : perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length;
  return {
    brier,
    n_events: perEvent.length,
    n_events_excluded_no_kp: excluded,
    per_event: perEvent,
    scoring_path: 't2_binary_brier_cycle002',
  };
}
