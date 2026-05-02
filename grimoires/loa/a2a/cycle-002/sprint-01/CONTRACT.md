# CORONA cycle-002 — Sprint 1 PredictionTrajectory Contract

**Status**: contract specification (NOT implementation, NOT a sprint plan).
**Authored**: 2026-05-01
**Cycle**: cycle-002 / Sprint 1
**Predecessor**: [sprint-00/CHARTER.md](../sprint-00/CHARTER.md) — ratified with operator amendment 1 (§4.1 two-summary reporting rule).
**Successor**: Sprint 2 (deterministic replay seam) implements this contract.

> Sprint 1 ships this single document. No source code, no tests, no schema files, no manifest writes. The contract specifies SHAPE and SEMANTICS only; Sprint 2 implements producers, Sprint 3 implements consumers.

---

## 1. Purpose

Define the canonical `PredictionTrajectory` object — the single boundary type between (a) the CORONA runtime theatre state and (b) the cycle-002 backtest scoring path. Every cycle-002 measurement-seam decision flows through this contract.

A `PredictionTrajectory` represents:

- one corpus event,
- replayed against one runtime theatre,
- with all evidence pre-cutoff and no evidence post-cutoff,
- with deterministic provenance metadata sufficient to reproduce it byte-for-byte.

The contract is **descriptive of runtime state**, not transformative of it. Trajectories serialize what runtime theatres already emit (`current_position`, `position_history`); they do not invent new shapes that would force runtime mutations or RLMF certificate changes.

---

## 2. Inheritance from Sprint 0 charter (binding)

| Charter clause | Effect on this contract |
|----------------|-------------------------|
| §1 Q1 (RLMF cert frozen) | No contract field may require `src/rlmf/certificates.js` to be modified to read it. Trajectories are backtest-side artifacts; they do not propagate into RLMF cert export. |
| §1 Q2 (T3 = WSA-Enlil canonical) | T3 trajectories MUST declare `distribution_shape = "corpus_anchored_external"` and MUST NOT carry a CORONA prediction. The T3 trajectory exists only as a uniform record-keeping shape; T3 scoring continues to read corpus's `wsa_enlil_predicted_arrival_time` directly per [t3-timing-error.js](../../../../scripts/corona-backtest/scoring/t3-timing-error.js). |
| §1 Q3 (T5 = quality-of-behavior) | T5 trajectories MAY exist with `distribution_shape = "quality_of_behavior"` for diagnostic purposes only (Sprint 4 owns the decision to enable). T5 scoring continues unchanged via [t5-quality-of-behavior.js](../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js); the trajectory does NOT feed scoring. |
| §1 Q5 (default-preserving clock injection) | Contract specifies `meta.replay_clock_source = "corpus_event_time"` and Sprint 2 must implement the function-arg `now` injection without altering live runtime behavior. |
| §1 Q7 (no fake bucket projection) | T1, T2 trajectories MUST declare `distribution_shape = "binary_scalar"`. The contract has NO `"bucket_projected"` shape. The legacy 6-bucket scoring path stays untouched (corpus-baseline diagnostic, charter §9.3). |
| §4 theatre posture table | Authoritative source for `distribution_shape` per theatre. Contract §5 reproduces the table for fast reference. |
| §5 RLMF non-goal | Closes off any "trajectory feeds cert export" pathway. Trajectories live in `scripts/corona-backtest/replay/` (proposed) and the cycle-002 manifest only. |
| §7 replay clock | Source of `meta.replay_clock_source` and `meta.replay_clock_seed`. |
| §9 binary scoring | T1, T2 outcome derivation rules in §8 of this contract are the canonical mappings. |
| §10 success criteria ladder | This contract is a prerequisite for Rung 1 ("runtime-wired") via T4. |

---

## 3. Top-level shape (canonical)

A `PredictionTrajectory` is a single JSON object with the field set below. The field order in this section is reference-only; Sprint 2 emits trajectories in canonicalized form (sorted keys at every nesting level — see §9).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `schema_version` | string | yes | Pinned to `"0.1.0"` for cycle-002. Increments only via charter amendment. Distinct from RLMF cert `version: '0.1.0'` (no shared schema). |
| `theatre_id` | string | yes | One of `"T1"`, `"T2"`, `"T3"`, `"T4"`, `"T5"`. |
| `theatre_template` | string | yes | Matches runtime `theatre.template`: `"flare_class_gate"`, `"geomagnetic_storm_gate"`, `"cme_arrival"`, `"proton_event_cascade"`, `"solar_wind_divergence"`. |
| `event_id` | string | yes | Source corpus event identifier. Must match the `event_id` field in the corresponding corpus JSON. |
| `distribution_shape` | string | yes | One of: `"binary_scalar"`, `"bucket_array_5"`, `"corpus_anchored_external"`, `"quality_of_behavior"`. See §5 for per-theatre permitted values. |
| `cutoff` | object | yes | `{ "time_ms": int, "rule": string }`. `time_ms` is the replay deadline. `rule` is the human-readable label per §6. |
| `gate_params` | object | yes | Theatre instantiation parameters used by the runtime at replay open: e.g., `{ "threshold_class": "M1.0", "window_hours": 24 }` for T1. Must include the cycle-002 pinned thresholds from §12. |
| `position_history_at_cutoff` | array | yes | Array of `position_history_entry` objects with `t_ms <= cutoff.time_ms` strictly. See §3.1. May be empty for T3 (external-model) and may be empty for T5 if the diagnostic posture is not enabled. |
| `current_position_at_cutoff` | scalar OR array OR null | yes | Matches `distribution_shape` (see §5). For `"corpus_anchored_external"` and `"quality_of_behavior"` (settlement-only): MUST be `null`. |
| `evidence_bundles_consumed` | array of string | yes | List of bundle IDs whose `event_time_ms <= cutoff.time_ms` that fed the trajectory. Provenance-helpful; may be empty for theatres with empty position_history. |
| `outcome` | object | yes | `{ "kind": string, "value": scalar OR object, "derivation": string }`. See §8. |
| `meta` | object | yes | Provenance + determinism. See §10. |

### 3.1 `position_history_entry` shape

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `t_ms` | integer | yes | ms epoch. Strictly `<= cutoff.time_ms`. Strictly monotone-non-decreasing across entries. |
| `p` | scalar OR array OR null | yes | Matches enclosing `distribution_shape` (see §5). |
| `evidence_id` | string OR null | yes | Bundle ID that produced this position update; `null` for the initial entry pushed at theatre creation. |
| `reason` | string | yes | The runtime's reason string verbatim (e.g., `"WSA-Enlil prediction: arrival …"` from cme-arrival.js). |
| `aux` | object OR null | optional | Optional theatre-specific auxiliary fields (e.g., T4's `qualifying_count` per-step) when emitted by the runtime. Schema-free; reviewers/scorers may ignore. |

The runtime already stores entries with these field names (`t`, `p`, `evidence`, `reason`); the contract renames `t → t_ms` and `evidence → evidence_id` for cycle-002 explicitness, and Sprint 2 produces the renamed shape WITHOUT mutating runtime state — the rename happens at the trajectory-emission boundary only.

---

## 4. Distribution shape declaration

`distribution_shape` is the single field that tells the scoring layer WHICH lane the trajectory belongs to. Permitted values:

| Value | Meaning | `p` and `current_position_at_cutoff` shape | `outcome.kind` |
|-------|---------|---------------------------------------------|-----------------|
| `"binary_scalar"` | Threshold-gate runtime market with scalar P(crossing). | `number` ∈ [0, 1] | `"binary"` |
| `"bucket_array_5"` | T4 multi-class market with 5-bucket Poisson distribution. | `[n0, n1, n2, n3, n4]` with each `nᵢ` ∈ [0, 1] and Σ ∈ [0.999, 1.001] | `"bucket_index"` |
| `"corpus_anchored_external"` | Theatre whose prediction comes from the corpus, not from CORONA runtime (T3). | `null` | `"timing_minutes"` |
| `"quality_of_behavior"` | Settlement-only theatre (T5); no probabilistic prediction. | `null` | `"quality_of_behavior"` |

**Forbidden values** (closed-set guarantee):

- `"bucket_projected"` — explicitly forbidden by charter §9.4 escape hatch (gated, not active in cycle-002).
- Any combination not in the permitted-values table.

Sprint 2 producers MUST declare exactly one permitted value. Sprint 3 consumers MUST reject trajectories with any other value (loud assertion failure).

---

## 5. Per-theatre shape table (authoritative)

| Theatre | `theatre_template` | Permitted `distribution_shape` | Runtime source for `current_position_at_cutoff` | Counted toward runtime-uplift composite (charter §4.1)? |
|---------|---------------------|-------------------------------|-------------------------------------------------|---------------------------------------------------------|
| T1 | `flare_class_gate` | `"binary_scalar"` (only) | Runtime [theatre.current_position](../../../../src/theatres/flare-gate.js) (scalar). | YES |
| T2 | `geomagnetic_storm_gate` | `"binary_scalar"` (only) | Runtime [theatre.current_position](../../../../src/theatres/geomag-gate.js) (scalar). | YES |
| T3 | `cme_arrival` | `"corpus_anchored_external"` (only) | `null`. CORONA runtime does emit a scalar [theatre.current_position](../../../../src/theatres/cme-arrival.js) but cycle-002 backtest scoring does NOT consume it (per Q2). | NO (diagnostic only — full-picture summary, not runtime-uplift composite) |
| T4 | `proton_event_cascade` | `"bucket_array_5"` (only) | Runtime [theatre.current_position](../../../../src/theatres/proton-cascade.js) (array of 5). | YES |
| T5 | `solar_wind_divergence` | `"quality_of_behavior"` (only); trajectory may be omitted entirely if Sprint 4 chooses not to emit. | `null`. The runtime detection state (`divergence_history`, `current_streak`, `peak_divergence`) MAY be serialized into `position_history_at_cutoff[].aux` for diagnostic visibility, but is not consumed by any scoring path in cycle-002. | NO (diagnostic only) |

**Cross-shape rejection rule**: a `theatre_id` paired with a non-permitted `distribution_shape` is a contract violation. Sprint 3 scoring rejects the trajectory; Sprint 2 producer must not emit it.

---

## 6. Cutoff semantics per theatre

The cutoff is the moment after which corpus evidence becomes settlement and may not feed the prediction. Sprint 2 derives `cutoff.time_ms` for each corpus event using the per-theatre rule below; Sprint 1 contract pins the rules.

| Theatre | `cutoff.rule` value | `cutoff.time_ms` derivation | Forbidden post-cutoff fields (settlement) |
|---------|---------------------|------------------------------|--------------------------------------------|
| T1 | `"flare_peak_minus_epsilon"` | `cutoff.time_ms = parseIso(corpus_event.flare_peak_time) - 1` (1 ms before peak). Pre-cutoff evidence ends strictly before the qualifying flare's peak. | `_derived.bucket_observed`, `flare_class_observed` (when interpreted as outcome), the flare event itself once at-or-after peak time. |
| T2 | `"first_threshold_crossing_or_window_end"` | `cutoff.time_ms = min(first_t_where_kp_crosses_kp_threshold, window_end_ms)` derived from the corpus event's `kp_observations[]` series. If no crossing in the corpus event, cutoff = window-end. | `_derived.bucket_observed`, the kp observation that crossed (and any thereafter), `kp_gfz_observed` settlement value, `kp_swpc_observed` settlement value. |
| T3 | `"observed_l1_shock_or_window_close"` | `cutoff.time_ms = min(parseIso(corpus_event.observed_l1_shock_time), window_close_ms)`. T3 cutoff is informational; CORONA does not predict T3, so position_history is empty by §5. | `observed_l1_shock_time`, any solar-wind shock signature at-or-after cutoff. (T3 backtest scoring continues to read corpus's WSA-Enlil prediction, NOT the trajectory.) |
| T4 | `"window_end"` | `cutoff.time_ms = parseIso(corpus_event.detection_window_end)` (the cascade theatre's `closes_at`). Pre-cutoff evidence: trigger flare + qualifying proton-flux events with `event_time < cutoff`. | `_derived.qualifying_event_count_observed_derived`, `_derived.qualifying_events_derived[]`, any proton-flux observation at-or-after cutoff. |
| T5 | `"signal_settlement"` | Per-signal: `cutoff.time_ms = parseIso(signal.signal_resolution_time)`. The T5 trajectory, if emitted, is per-signal. If not emitted, the cutoff field is absent and the trajectory is omitted. | `signal.false_positive_label`, `signal.signal_resolution_time`, all settlement-derived fields. |

### 6.1 Strict-inequality rule

For all theatres: `position_history_at_cutoff[*].t_ms <= cutoff.time_ms` (non-strict on the LHS). The `<= cutoff.time_ms - 1` formulation for T1 (peak_minus_epsilon) is what produces the strict-inequality semantics in practice — the predicted distribution must be set BEFORE the qualifying event occurred.

### 6.2 Cutoff hash

`meta.cutoff_hash` (see §10) covers the cutoff object, ensuring any cutoff-rule mutation produces a different trajectory hash and therefore a visible regression-test signal.

---

## 7. Allowed pre-cutoff evidence vs. forbidden post-cutoff evidence

### 7.1 Allowed before cutoff

- Any corpus observation with `event_time_ms < cutoff.time_ms`.
- Any oracle data (SWPC, DONKI) with `event_time_ms < cutoff.time_ms`.
- Loader-derived structural metadata that is NOT settlement: `_derived.regression_tier_eligible`, `_derived.glancing_blow_flag` (T3 only — flag of the CME's geometry, not its arrival), `_derived.sigma_hours_effective` (T3 only — uncertainty parameter, not outcome), `_derived.sigma_source` (T3 only).
- Theatre instantiation parameters (`gate_params`): pinned per §12.

### 7.2 Forbidden after cutoff

- Any field in the per-theatre "Forbidden post-cutoff fields" column of §6.
- Any `_derived` field that encodes the outcome: `bucket_observed` (T1, T2, T4), `qualifying_event_count_observed_derived` (T4), `anomaly_bulletin_refs` (T5 — these are post-hoc bulletins).
- `corpus_event.flare_class_observed` interpreted as outcome (T1).
- `corpus_event.observed_l1_shock_time` (T3 — settlement value).
- `corpus_event.kp_swpc_observed` and `kp_gfz_observed` interpreted as outcome (T2 — but the kp observation series WITH `t_ms < cutoff` IS allowed).
- `corpus_event.divergence_signals[*].false_positive_label` (T5 — corpus FP label is settlement, not pre-cutoff evidence).

### 7.3 Loader-side enforcement

Sprint 2 extends [corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) (new export, additive — does NOT mutate existing exports) to split corpus events into:

- `evidence_pre_cutoff[]`: bundles / observations / oracle data with `event_time_ms < cutoff.time_ms`.
- `settlement_post_cutoff{}`: outcome fields.

The PredictionTrajectory carries only references to `evidence_pre_cutoff[]` (via `evidence_bundles_consumed`). The settlement object goes to the OUTCOME path (see §8).

### 7.4 Scorer-side assertion

Sprint 3 scoring asserts `every(trajectory.position_history_at_cutoff, h => h.t_ms <= trajectory.cutoff.time_ms)`. A violation is a HARD scoring failure (exit code 3 per [corona-backtest.js:151](../../../../scripts/corona-backtest.js:151)). The assertion runs before any Brier computation.

---

## 8. Outcome derivation contract

`outcome` is a single object per trajectory. Its `kind`, `value`, and `derivation` are pinned per theatre.

### 8.1 T1 outcome (binary)

```
outcome.kind = "binary"
outcome.value = 1 iff flareRank(corpus_event.flare_class_observed) >= flareRank(gate_params.threshold_class)
outcome.value = 0 otherwise
outcome.derivation = "T1 binary outcome via flareRank() per Sprint 1 §8.1"
```

`flareRank()` is the runtime export from [src/oracles/swpc.js](../../../../src/oracles/swpc.js). Cycle-002 reuses this helper at the trajectory-emission boundary; runtime helper is unchanged.

### 8.2 T2 outcome (binary, GFZ-lag aware)

```
let kp_observed = corpus_event.kp_gfz_observed ?? corpus_event.kp_swpc_observed;
   // GFZ definitive preferred; SWPC fallback if GFZ-lag exclusion forces it.

outcome.kind = "binary"
outcome.value = 1 iff kp_observed >= gate_params.kp_threshold
outcome.value = 0 otherwise
outcome.derivation = "T2 binary outcome via GFZ-preferred Kp comparison per Sprint 1 §8.2"
```

If `_derived.regression_tier_eligible === false` AND no SWPC fallback is available, the trajectory is NOT emitted for that corpus event (loader skips per existing GFZ-lag exclusion rule [t2-bucket-brier.js:93](../../../../scripts/corona-backtest/scoring/t2-bucket-brier.js:93)). Cycle-002 backtest reports the skip in its corpus_load_stats.

### 8.3 T3 outcome (timing, NOT a CORONA prediction)

```
outcome.kind = "timing_minutes"
outcome.value = (parseIso(corpus_event.observed_l1_shock_time) - parseIso(corpus_event.wsa_enlil_predicted_arrival_time)) / 60_000
   // signed minutes — positive = WSA-Enlil predicted earlier than observed, negative = predicted later.
outcome.derivation = "T3 WSA-Enlil timing error per Sprint 1 §8.3 — NOT a CORONA-owned prediction"
```

T3 trajectories are emitted for shape-uniformity only. Existing T3 scoring continues to read the corpus directly per [t3-timing-error.js:67](../../../../scripts/corona-backtest/scoring/t3-timing-error.js:67); the trajectory is a non-feeding record.

### 8.4 T4 outcome (bucket index)

```
let count = corpus_event._derived.qualifying_event_count_observed_derived;
let outcomeIndex = BUCKETS.findIndex(({ min, max }) => count >= min && count <= max);
   // BUCKETS imported from src/theatres/proton-cascade.js — already a cross-boundary import per t4-bucket-brier.js:29.

outcome.kind = "bucket_index"
outcome.value = outcomeIndex (integer 0..4)
outcome.derivation = "T4 bucket index via BUCKETS.findIndex per Sprint 1 §8.4"
```

This is the SAME logic as `resolveProtonEventCascade` at [proton-cascade.js:413-417](../../../../src/theatres/proton-cascade.js:413). The trajectory boundary reuses the runtime constant; runtime function unchanged.

### 8.5 T5 outcome (quality-of-behavior settlement)

```
outcome.kind = "quality_of_behavior"
outcome.value = {
  fp_count: int,           // count(signal where computed_false_positive === true)
  total_signals: int,
  stale_p50_seconds: float, // existing scoring path output
  switch_handled_count: int,
  total_switches: int,
  hit_rate_diagnostic_count: int,
  bulletin_count: int,
}
outcome.derivation = "T5 settlement object per Sprint 1 §8.5 — passthrough from existing t5-quality-of-behavior.js"
```

If the T5 trajectory is omitted entirely (Sprint 4 decision), the outcome object lives only in the T5 scoring report, not in any trajectory.

---

## 9. Determinism contract

### 9.1 Replay-twice invariant

For any (corpus_event, runtime_revision, contract_version) triple, two invocations of the Sprint 2 replay seam MUST produce **byte-identical** trajectory JSON.

Byte-identical means: the canonicalized JSON bytes (per §9.2) of the two trajectories are equal under direct `===` comparison after `Buffer.from(jsonBytes)` round-trip.

### 9.2 JSON canonicalization rule

Sprint 2 implements canonicalization following the spirit of RFC 8785 (JSON Canonicalization Scheme), without taking on the RFC as a runtime dependency:

1. Object keys sorted lexicographically (UTF-16 code-unit order) at every nesting level.
2. No whitespace between tokens.
3. Numbers rendered using `Number.prototype.toString()` for integers; floats per JSON-spec shortest-round-trip representation. Cycle-002 trajectories should not produce floats that hit IEEE-754 edge cases (probabilities are rounded to 3 decimals at runtime per existing `Math.round(x * 1000) / 1000` pattern in theatres).
4. Strings rendered with standard JSON escaping (`\"`, `\\`, control chars `\uXXXX`). No reordering, no normalization.
5. Arrays: order preserved (arrays are positional).

The canonical-JSON implementation is a Sprint 2 deliverable, gated on operator ratification of the Sprint 2 design. Proposed location: `scripts/corona-backtest/replay/canonical-json.js` (~50 LOC; zero deps). **Sprint 1 ships only the canonicalization rules above; no implementation file is created during Sprint 1** (operator clarification 2).

### 9.3 Sources of nondeterminism that Sprint 2 MUST eliminate

- `Date.now()` in theatre create/process/expire/resolve modules — the deterministic replay path MUST NOT reach `Date.now()` (it injects a corpus-derived `now()` instead). The live runtime path (charter §7's default-preserving function-arg pattern) continues to use `Date.now()` via the optional argument's default. See §10.1.1 for the per-path table.
- `Set` and `Map` iteration order — only relevant if the runtime uses them in iteration-sensitive contexts; current runtime uses plain arrays for `position_history` so this is mostly precautionary.
- `Math.random()` — runtime does not use random in any theatre, but Sprint 2 audit must confirm.
- File-modification timestamps embedded in any trajectory field — none today, must remain none.
- Wall-clock timestamps in `meta.replay_clock_seed` — must derive from corpus event fields, never from `Date.now()`.

### 9.4 Determinism test (Sprint 2 ships)

Per §15. Sprint 2 ships at minimum:

- `tests/replay-determinism-T4-test.js` — replay one cycle-001 T4 corpus event twice, assert byte-identical trajectory JSON.
- Same shape per theatre as binary-runtime scoring lands (T1, T2 in Sprint 3).

---

## 10. Provenance fields (`meta`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `runtime_revision` | string | yes | Output of `git rev-parse HEAD` at trajectory production time. Full SHA. Sprint 2 captures this once per replay invocation; trajectories produced in the same invocation share the same revision. |
| `contract_version` | string | yes | Pinned to `"0.1.0"` for cycle-002 (matches §3 `schema_version`). |
| `corpus_event_hash` | string | yes | sha256 of the canonicalized source corpus event JSON (loader handles the canonicalization; trajectory just records the resulting hash). |
| `cutoff_hash` | string | yes | sha256 of the canonicalized `cutoff` object — guards against silent cutoff-rule drift. |
| `gate_params_hash` | string | yes | sha256 of canonicalized `gate_params` — guards against silent threshold drift. |
| `replay_clock_source` | string | yes | Pinned to `"corpus_event_time"`. Any other value rejected. |
| `replay_clock_seed` | integer | yes | The `now` value passed to the runtime theatre's `create*` function — derived from a corpus field per §10.1. |
| `trajectory_hash` | string | yes | sha256 of the canonicalized trajectory JSON with `trajectory_hash` itself omitted (computed last; included in the final emitted object). |

### 10.1 `replay_clock_seed` derivation per theatre

| Theatre | Source field | Notes |
|---------|--------------|-------|
| T1 | `corpus_event.gate_open_time` (if present) OR `corpus_event.flare_peak_time - window_hours * 3600 * 1000` | The runtime theatre opens at gate_open; replay clock starts there. Sprint 2 confirms which corpus field is canonical. |
| T2 | `corpus_event.gate_open_time` (if present) OR `corpus_event.window_start` | Same pattern as T1. |
| T3 | `corpus_event.cme_observed_time` OR `corpus_event.cme.start_time` | The CME detection time (when WSA-Enlil prediction would have been issued). |
| T4 | `corpus_event.trigger_time` (the M5+ flare's begin time) | Cascade theatre opens at trigger. |
| T5 | `corpus_event.detection_window_start` | Divergence theatre opens at the start of the detection window. |

If a corpus event lacks the canonical seed field, the trajectory is NOT emitted (Sprint 2 surfaces a loader error). No fallback to `Date.now()` under any circumstance — but only on the replay path; see §10.1.1.

### 10.1.1 Replay-mode clock fail-closed rule (operator clarification 1)

The "no fallback to `Date.now()`" rule applies ONLY to the deterministic replay path (Sprint 2's `scripts/corona-backtest/replay/<theatre>-replay.js` modules and any code reachable from a backtest invocation).

The live runtime path (`src/index.js`'s polling loop and any caller invoking theatres without an explicit `now` argument) continues to use `Date.now()` via the default-preserving function-arg pattern (charter §7). This is required to preserve cycle-001 runtime behavior bit-for-bit.

| Path | Source of `now` | If injection unavailable |
|------|------------------|--------------------------|
| Live runtime (e.g. `src/index.js` polling) | Implicit default `() => Date.now()` | Continues with `Date.now()` (cycle-001 behavior, unchanged) |
| Deterministic replay (`scripts/corona-backtest/replay/`) | Explicit `() => corpus_event.<seed_field>` | **Fail closed** — emit a loader error and skip the trajectory; never silently use `Date.now()` |

The fail-closed behavior is enforced by Sprint 2 in the replay seam itself, not by the runtime theatres (which remain agnostic to which clock source is in use). This preserves both invariants:

- cycle-001 runtime behavior unchanged by default
- cycle-002 replay deterministic and auditable

---

## 11. Validation rules

### 11.1 Producer-side (Sprint 2 emits a valid trajectory)

The producer MUST guarantee, for every emitted trajectory:

1. `schema_version === "0.1.0"`.
2. `theatre_id` ∈ {T1, T2, T3, T4, T5}.
3. `theatre_template` matches the runtime theatre's declared template.
4. `distribution_shape` is permitted for the theatre per §5.
5. `cutoff.time_ms` is a positive integer (ms epoch).
6. `gate_params` includes the cycle-002 pinned thresholds (§12).
7. `position_history_at_cutoff[*].t_ms <= cutoff.time_ms` for every entry.
8. `position_history_at_cutoff[*].t_ms` is monotone-non-decreasing.
9. For `binary_scalar`: every `p` ∈ [0, 1] and `current_position_at_cutoff` ∈ [0, 1].
10. For `bucket_array_5`: every `p` is a 5-element array with elements ∈ [0, 1] and sum ∈ [0.999, 1.001]; `current_position_at_cutoff` follows the same constraint.
11. For `corpus_anchored_external` and `quality_of_behavior`: `current_position_at_cutoff === null`.
12. `outcome.kind` matches §8 for the theatre.
13. `outcome.value` shape matches `outcome.kind`.
14. `meta.replay_clock_source === "corpus_event_time"`.
15. `meta.runtime_revision` is a 40-char SHA (or 7-char short SHA — Sprint 2 picks one and pins it).
16. All four hash fields (`corpus_event_hash`, `cutoff_hash`, `gate_params_hash`, `trajectory_hash`) are 64-char hex strings.
17. The recomputed `trajectory_hash` (over the canonicalized object with `trajectory_hash` omitted) equals the embedded value — self-consistency check.

### 11.2 Consumer-side (Sprint 3 scoring asserts on read)

Before scoring, the consumer MUST assert:

1. All producer-side rules (1–17 above) — defensive re-validation.
2. The theatre/distribution_shape pairing is permitted per §5; otherwise hard reject with explicit error.
3. The recomputed `trajectory_hash` matches the embedded value — corruption / tamper detection.
4. The `corpus_event_hash` matches the loader's recomputed hash for the same corpus event — guards against trajectory-vs-corpus drift.
5. For T1, T2, T4: the trajectory's `current_position_at_cutoff` is the input to the scoring formula (§9 of the per-theatre scoring module). For T3, T5: the trajectory is recorded but not scored.

A failed assertion exits the backtest with code 3 (matching existing convention at [corona-backtest.js:152](../../../../scripts/corona-backtest.js:152)) and emits an explicit error message identifying the violated rule.

### 11.3 RLMF certificate non-mutation invariant (smoke test)

Sprint 2 ships a smoke test that confirms: after the function-arg `now` injection lands, the runtime cert export pipeline ([src/index.js:235-251](../../../../src/index.js:235), [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js)) produces certificates that are byte-identical to the cycle-001 cert format for any given (theatre, outcome) input. This guards Q1.

---

## 12. Pinned cycle-002 gate thresholds

Binary-Brier on a mixed-threshold corpus is meaningless. Cycle-002 pins one threshold per binary-runtime theatre; future cycles may add more (each adding its own scoring row).

| Theatre | Pinned `gate_params` (cycle-002) | Rationale |
|---------|----------------------------------|-----------|
| T1 | `{ "threshold_class": "M1.0", "window_hours": 24 }` | M1.0 is the lowest threshold class above the baseline noise floor; matches the runtime default base_rate framing in [flare-gate.js:35](../../../../src/theatres/flare-gate.js:35). 24h window matches typical short-horizon market shape. |
| T2 | `{ "kp_threshold": 5, "window_hours": 72 }` | Kp ≥ 5 = G1 storm onset (NOAA G-scale). 72h matches solar-wind-to-magnetosphere lead-time per [empirical-evidence.md](../../../calibration/corona/empirical-evidence.md). |
| T4 | `{ "s_scale_threshold": "S1", "window_hours": 72 }` | S1 = NOAA Solar Radiation Storm Scale minor; matches the runtime default in [proton-cascade.js:184](../../../../src/theatres/proton-cascade.js:184). 72h matches Wheatland decay shape. |

These pins are recorded in the cycle-002 additive manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (per charter §6.2) when Sprint 3 commits cycle-002-run-1. They are NOT mutated mid-cycle.

T3 has no `gate_params` of its own (CORONA does not predict T3); the T3 trajectory's `gate_params` carries the corpus event's `tolerance_hours` and `theatre_padding_hours` for record-keeping.

T5 carries `{ "bz_divergence_threshold": 5, "sustained_minutes": 30, "window_hours": 24 }` matching runtime defaults from [solar-wind-divergence.js:32-37](../../../../src/theatres/solar-wind-divergence.js:32) — for record-keeping only since T5 scoring is settlement-anchored.

---

## 13. T5 trajectory posture

T5 trajectories are **opt-in diagnostic** for cycle-002. The Sprint 4 charter clause governs whether they are emitted at all.

If emitted:

- `distribution_shape = "quality_of_behavior"`.
- `current_position_at_cutoff = null`.
- `position_history_at_cutoff` MAY include the runtime's `divergence_history` and `current_streak` entries (renamed via the `aux` field per §3.1).
- The trajectory does NOT feed any scoring path. It exists so that a future reviewer can inspect runtime detection state alongside the existing t5-quality-of-behavior.js metrics.
- Adding the diagnostic does NOT change `fp_rate`, `stale_feed_p50_seconds`, `satellite_switch_handled_rate`, or `hit_rate_diagnostic` numerics — those stay byte-stable per charter §4.

If omitted: the T5 row in the diagnostic summary (charter §4.1, summary 2) reports unchanged numerics, no trajectory file is written, no contract violation.

---

## 14. Non-goals (closed)

The following are explicitly NOT part of this contract and may not be added without a charter amendment:

- **`"bucket_projected"` distribution_shape** — closed by charter §9.4 escape hatch (gated, not active).
- **A T3 CORONA-prediction shape** — closed by Q2.
- **A T5 probabilistic-uplift shape** — closed by Q3.
- **Any contract field that would require modification to `src/rlmf/certificates.js`** — closed by Q1.
- **Sharing scoring formulas across theatres** — operator hard constraint #5 / SDD §6.4 binds; trajectories carry shape, not formula.
- **A standalone JSON Schema artifact** — Sprint 1 ships this prose contract only; if a JSON Schema file becomes useful, it is a Sprint 2 deliverable scoped narrowly and committed under `scripts/corona-backtest/replay/trajectory.schema.json` (proposed).
- **Mutation of the corpus or corpus loader's existing exports** — Sprint 2 may ADD new exports (e.g., `loadCorpusWithCutoff`) but not rewrite `loadCorpus`.
- **New runtime parameters or constants in `src/`** — runtime parameters frozen until Sprint 5 sensitivity proof gate.
- **New runtime dependencies** — `package.json dependencies: {}` invariant binds.

---

## 15. Test plan inheritance to Sprint 2

Sprint 2 ships these tests as a non-negotiable set. Sprint 1 contract is the source of truth for what each test asserts.

| # | Test | Asserts |
|---|------|---------|
| 1 | `tests/replay-trajectory-shape-T1-test.js` (proposed name) | T1 trajectory has `distribution_shape === "binary_scalar"`; rejects any other shape; producer §11.1 rules 1–17 hold. |
| 2 | `tests/replay-trajectory-shape-T2-test.js` | Same as T1 with T2 binding. |
| 3 | `tests/replay-trajectory-shape-T3-test.js` | T3 trajectory has `distribution_shape === "corpus_anchored_external"`; `current_position_at_cutoff === null`; `outcome.kind === "timing_minutes"`. |
| 4 | `tests/replay-trajectory-shape-T4-test.js` | T4 trajectory has `distribution_shape === "bucket_array_5"`; array of 5 floats summing to ~1.0; `outcome.kind === "bucket_index"`. |
| 5 | `tests/replay-determinism-T4-test.js` | Replay-twice byte-identical for one cycle-001 T4 corpus event. |
| 6 | `tests/replay-cutoff-assertion-test.js` | An injected post-cutoff entry in `position_history_at_cutoff` triggers a hard scoring rejection. |
| 7 | `tests/replay-shape-rejection-test.js` | T4 trajectory with `distribution_shape === "binary_scalar"` is rejected by the consumer. |
| 8 | `tests/replay-rlmf-cert-non-mutation-test.js` | After clock injection lands, runtime cert export is byte-identical to cycle-001 baseline for a fixed (theatre, outcome) input — guards Q1. |
| 9 | `tests/replay-clock-injection-default-test.js` | Calling theatre create/process/expire WITHOUT a `now` argument behaves bit-for-bit like the cycle-001 runtime — guards charter §7. |
| 10 | All existing `npm test` (160/160) | Stays green after Sprint 2 lands. |

Sprint 3 extends with consumer-side tests (binary-Brier scoring path, T4 bucket scoring path consuming trajectories, etc.).

---

## 16. Sprint 1 closeout / non-implementation guarantees

Sprint 1 ships:

- This contract at `grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md` (the only file written by Sprint 1).

Sprint 1 does NOT ship:

- Any source-code change.
- Any test change.
- Any new file under `scripts/corona-backtest/replay/`.
- Any new file under `scripts/corona-backtest/scoring/`.
- Any modification to `scripts/corona-backtest.js` or its descendants.
- Any modification to `src/`.
- Any modification to `tests/`.
- Any modification to the cycle-001 calibration manifest.
- Any creation of the cycle-002 additive manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (Sprint 3 deliverable per charter §6.2).
- Any modification to cycle-001 docs, manifests, sprint folders, or run outputs.
- Any commit (operator decides commit timing).
- Any tag, release, or version bump.
- Any README or BFZ change.
- Any new dependency.

Sprint 1 exits when:

- Operator ratifies §3 (top-level shape) — or amends specific fields with explicit additions.
- Operator ratifies §5 (per-theatre shape table).
- Operator ratifies §8 (outcome derivation contract) — particularly §8.1 (T1 binary), §8.2 (T2 GFZ-aware binary), and §8.4 (T4 bucket index).
- Operator ratifies §12 (pinned cycle-002 gate thresholds).
- Operator confirms Sprint 2 may begin (or instructs further Sprint 1 work).

Sprint 1 does NOT exit on its own clock — the contract sits idle until the operator gives the explicit "Sprint 1 ratified, draft Sprint 2" signal.

---

## 17. Cross-references

### 17.1 Inputs Sprint 1 consumed

- [sprint-00/CHARTER.md](../sprint-00/CHARTER.md) — charter and operator amendment 1.
- [PLANNING-FRAME.md](../PLANNING-FRAME.md) — repo findings (§2), risk register (§6).
- [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md) — Q1–Q8 binding answers.
- Runtime theatres: [flare-gate.js](../../../../src/theatres/flare-gate.js), [geomag-gate.js](../../../../src/theatres/geomag-gate.js), [cme-arrival.js](../../../../src/theatres/cme-arrival.js), [proton-cascade.js](../../../../src/theatres/proton-cascade.js), [solar-wind-divergence.js](../../../../src/theatres/solar-wind-divergence.js).
- Existing scoring modules: [t1-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t1-bucket-brier.js), [t2-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t2-bucket-brier.js), [t3-timing-error.js](../../../../scripts/corona-backtest/scoring/t3-timing-error.js), [t4-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t4-bucket-brier.js), [t5-quality-of-behavior.js](../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js).
- RLMF cert: [certificates.js](../../../../src/rlmf/certificates.js) (frozen reference).

### 17.2 Outputs Sprint 1 produces for Sprint 2

- §3 top-level shape — direct producer specification.
- §5 per-theatre shape table — the closed-set of permitted (theatre, distribution_shape) pairs.
- §6 cutoff semantics — derivation rules Sprint 2 implements.
- §7 evidence-leakage prevention — the loader-side split Sprint 2 adds.
- §8 outcome derivation — Sprint 2 wires into the trajectory-emission boundary.
- §9 determinism contract — Sprint 2 implements canonical-JSON.
- §10 provenance fields — Sprint 2 computes the four hashes.
- §11 validation rules — Sprint 2 producer-side; Sprint 3 consumer-side.
- §15 test plan — Sprint 2 ships these tests.

### 17.3 Outputs Sprint 1 produces for Sprint 3

- §8 outcome derivation — Sprint 3 binary-Brier scoring path uses §8.1, §8.2; bucket scoring uses §8.4.
- §11.2 consumer-side validation — Sprint 3 enforces.
- §12 pinned thresholds — Sprint 3 records in the cycle-002 additive manifest.
- §4.1 forbidden values — Sprint 3 rejects on read.

### 17.4 Outputs Sprint 1 produces for Sprint 4

- §13 T5 trajectory posture — Sprint 4 decides emit-or-omit; contract supports both.

### 17.5 Outputs Sprint 1 produces for Sprint 5

- §10 provenance fields — Sprint 5 sensitivity-proof test relies on `runtime_revision` / `gate_params_hash` to confirm two-direction perturbation is captured in the manifest hash chain.

---

*Contract authored 2026-05-01. cycle-002 Sprint 1. corpus_hash invariant `b1caef3f…11bb1` (cycle-001 anchor; preserved). RLMF cert format unchanged. No source changes. No test changes. No manifest writes. Operator gate pending.*
