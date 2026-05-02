/**
 * scripts/corona-backtest/replay/canonical-json.js
 *
 * Deterministic JSON canonicalization for cycle-002 PredictionTrajectory hashing.
 *
 * Sprint 2 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md §9.2
 *   - grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md §7
 *
 * Spirit of RFC 8785 (JSON Canonicalization Scheme), without the RFC dependency:
 *   1. Object keys sorted lexicographically (UTF-16 code-unit order) at every level.
 *   2. No whitespace between tokens.
 *   3. Numbers via Number.prototype.toString() (JSON-spec shortest round-trip).
 *   4. Strings via standard JSON escaping (\", \\, control chars \uXXXX).
 *   5. Arrays preserve order.
 *
 * Strict rejection (per CONTRACT §7.2):
 *   NaN, Infinity, -Infinity, undefined, BigInt, Function, Symbol → THROW.
 *
 * Zero runtime dependencies. Node 20+.
 */

function rejectUnsupported(value) {
  if (value === undefined) {
    throw new Error('canonical-json: undefined not permitted (use null for missing fields)');
  }
  const t = typeof value;
  if (t === 'bigint') {
    throw new Error('canonical-json: BigInt not permitted in canonical JSON');
  }
  if (t === 'function') {
    throw new Error('canonical-json: Function not permitted in canonical JSON');
  }
  if (t === 'symbol') {
    throw new Error('canonical-json: Symbol not permitted in canonical JSON');
  }
}

export function canonicalize(value) {
  rejectUnsupported(value);
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`canonical-json: non-finite number not permitted (${value})`);
    }
    // Number.toString() matches JSON-spec shortest-round-trip representation
    // for finite values. Cycle-002 trajectories round probabilities to 3
    // decimals at runtime per the existing Math.round(x * 1000) / 1000 pattern.
    return String(value);
  }
  if (t === 'string') {
    return JSON.stringify(value); // standard JSON escaping
  }
  if (Array.isArray(value)) {
    const parts = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      parts[i] = canonicalize(value[i]);
    }
    return '[' + parts.join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      const v = value[k];
      if (v === undefined) {
        // Per CONTRACT §7.2: undefined object values are forbidden — surface, do not silently drop.
        throw new Error(`canonical-json: object value for key "${k}" is undefined; use null instead`);
      }
      parts.push(JSON.stringify(k) + ':' + canonicalize(v));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error(`canonical-json: unsupported type ${t}`);
}

export function parseCanonical(bytesOrString) {
  const s = typeof bytesOrString === 'string'
    ? bytesOrString
    : Buffer.from(bytesOrString).toString('utf8');
  return JSON.parse(s);
}
