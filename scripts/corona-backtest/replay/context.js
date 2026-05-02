/**
 * scripts/corona-backtest/replay/context.js
 *
 * Deterministic replay context for cycle-002 PredictionTrajectory production.
 *
 * Sprint 2 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/sprint-00/CHARTER.md §7 (default-preserving clock)
 *   - grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md §10.1 + §10.1.1
 *     (replay-mode clock fail-closed rule, operator clarification 1)
 *   - grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md §5 + §9.3
 *
 * Fail-closed semantics:
 *   The deterministic replay path MUST NOT reach Date.now(). If a corpus event
 *   lacks the canonical seed field, deriveReplayClockSeed() throws — the
 *   replay seam catches the throw and skips the event with an explicit
 *   loader-style error. There is no Date.now() fallback on the replay path.
 *
 *   The live runtime path is unaffected: it never goes through
 *   createReplayContext / deriveReplayClockSeed and continues to use
 *   Date.now() via the function-arg default in the runtime theatres.
 *
 * Scope: T1, T2, T4 active replay paths. T3/T5 derivations scaffolded for
 * future cycles per charter §4 posture (T3 external-model, T5 quality-of-behavior).
 *
 * Zero runtime dependencies. Node 20+.
 */

function parseIsoMs(iso) {
  if (typeof iso === 'number' && Number.isFinite(iso)) return iso;
  if (typeof iso !== 'string') return NaN;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

// Per CONTRACT §10.1 — per-theatre seed derivation. Each function returns
// the gate-open timestamp in ms epoch, or NaN if the corpus event lacks
// the canonical fields.
//
// CONTRACT §10.1 explicitly allows T1's computed fallback
// (flare_peak_time - window_hours * 3600_000) when no explicit gate_open_time
// is present in the corpus.
const SEED_DERIVATIONS_PER_THEATRE = {
  T1: (event) => {
    const explicit = parseIsoMs(event?.gate_open_time);
    if (Number.isFinite(explicit)) return explicit;
    const peak = parseIsoMs(event?.flare_peak_time);
    const windowHours = event?.prediction_window_hours;
    if (!Number.isFinite(peak)) return NaN;
    if (typeof windowHours !== 'number' || !Number.isFinite(windowHours)) return NaN;
    return peak - windowHours * 3600_000;
  },
  T2: (event) => {
    const explicit = parseIsoMs(event?.gate_open_time);
    if (Number.isFinite(explicit)) return explicit;
    return parseIsoMs(event?.kp_window_start);
  },
  T3: (event) => {
    const explicit = parseIsoMs(event?.cme_observed_time);
    if (Number.isFinite(explicit)) return explicit;
    return parseIsoMs(event?.cme?.start_time);
  },
  T4: (event) => parseIsoMs(event?.trigger_flare_peak_time),
  T5: (event) => parseIsoMs(event?.detection_window_start),
};

export function deriveReplayClockSeed({ corpus_event, theatre_id }) {
  const fn = SEED_DERIVATIONS_PER_THEATRE[theatre_id];
  if (!fn) {
    throw new Error(`replay-context: no seed-derivation for theatre_id "${theatre_id}"`);
  }
  const ms = fn(corpus_event);
  if (Number.isFinite(ms)) return ms;
  const eventId = corpus_event?.event_id ?? '<no-id>';
  throw new Error(
    `replay-context: cannot derive replay_clock_seed for ${theatre_id} from corpus event ${eventId}. ` +
    `Replay mode requires corpus-derived timestamp; no Date.now() fallback. Skipping this corpus event.`,
  );
}

export function createReplayContext({ corpus_event, theatre_id, runtime_revision }) {
  if (!corpus_event || typeof corpus_event !== 'object') {
    throw new Error('replay-context: corpus_event must be an object');
  }
  if (typeof theatre_id !== 'string' || !(theatre_id in SEED_DERIVATIONS_PER_THEATRE)) {
    throw new Error(`replay-context: theatre_id must be one of T1..T5 (got "${theatre_id}")`);
  }
  if (typeof runtime_revision !== 'string' || runtime_revision.length === 0) {
    throw new Error('replay-context: runtime_revision must be a non-empty string');
  }
  const seed = deriveReplayClockSeed({ corpus_event, theatre_id });
  return Object.freeze({
    corpus_event,
    theatre_id,
    runtime_revision,
    replay_clock_seed: seed,
    is_replay: true,
  });
}

export function assertReplayMode(ctx) {
  if (!ctx || ctx.is_replay !== true) {
    throw new Error('replay-context: not in replay mode but caller expected it');
  }
}

// Re-export for unit-test access.
export { SEED_DERIVATIONS_PER_THEATRE as _SEED_DERIVATIONS_PER_THEATRE, parseIsoMs as _parseIsoMs };
