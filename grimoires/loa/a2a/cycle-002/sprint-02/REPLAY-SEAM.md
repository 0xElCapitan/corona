# CORONA cycle-002 — Sprint 2 Deterministic Replay Seam Design

**Status**: design specification (NOT implementation, NOT a sprint plan).
**Authored**: 2026-05-01
**Cycle**: cycle-002 / Sprint 2 (design phase)
**Predecessors**:
- [sprint-00/CHARTER.md](../sprint-00/CHARTER.md) — charter (ratified, with operator amendment 1)
- [sprint-01/CONTRACT.md](../sprint-01/CONTRACT.md) — PredictionTrajectory contract (ratified, with operator clarifications 1 and 2)

> Sprint 2 ships THIS design document. The Sprint 2 implementation (source code, tests, canonical-JSON helper) is a separate HITL-gated deliverable, ratified by the operator AFTER this design is approved. **No source/test/helper files are created during Sprint 2's design phase.**

---

## 1. Purpose

Specify the architecture, file layout, function signatures, test plan, and determinism guarantees that Sprint 2 implementation will follow. After operator ratification of this design, Sprint 2 implementation:

- Adds a default-preserving optional `now` argument to runtime theatre functions (charter §7 / Q5).
- Creates `scripts/corona-backtest/replay/` with per-theatre replay modules and a canonical-JSON helper.
- Adds an additive `loadCorpusWithCutoff` export to [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) without modifying the existing `loadCorpus` export.
- Ships the 10 tests pinned in [CONTRACT §15](../sprint-01/CONTRACT.md#15-test-plan-inheritance-to-sprint-2) plus one helper test.
- Touches no other files outside the lists in §3.

This document is the input to that implementation. Implementation cannot start until the operator ratifies §3 (module layout), §4 (runtime touch points), and §10 (test plan).

---

## 2. Inheritance and binding constraints

| Source | Binding effect on Sprint 2 |
|--------|----------------------------|
| Charter §1 Q1 (RLMF cert frozen) | No edits to `src/rlmf/certificates.js`. Test #8 enforces non-mutation. |
| Charter §1 Q5 (clock injection) | Default-preserving function-arg `now` injection only. No decorator wrappers. No full refactor. |
| Charter §7 | Live runtime callers continue receiving `Date.now()` via default; replay passes corpus-derived `() => seed_value`. |
| Charter §10 Rung 1 ("runtime-wired") | Replay-twice byte-identical determinism is a Rung 1 prerequisite. Sprint 2's determinism test is the binding gate. |
| Contract §3.1 | Position-history field rename (`t → t_ms`, `evidence → evidence_id`) happens at trajectory-emission boundary; runtime state shape unchanged. |
| Contract §6 | Per-theatre cutoff derivation rules — Sprint 2 implements the helpers. |
| Contract §7.3 | Loader-side split (`evidence_pre_cutoff` / `settlement_post_cutoff`) — Sprint 2 implements via additive `loadCorpusWithCutoff`. |
| Contract §8 | Outcome derivation per theatre — Sprint 2 wires into the trajectory-emission boundary. |
| Contract §9.2 | Canonical JSON rule (RFC 8785-spirit, no dep) — Sprint 2 implements ~50 LOC zero-dep helper. |
| Contract §10 | Four hashes (`corpus_event_hash`, `cutoff_hash`, `gate_params_hash`, `trajectory_hash`) — Sprint 2 implements computation. |
| Contract §10.1.1 (operator clarification 1) | Replay-mode fail-closed rule — Sprint 2 enforces in `replay/context.js`. |
| Contract §11.1 producer rules | Sprint 2 enforces all 17 rules at trajectory emission. |
| Contract §15 test plan | 10 tests pinned by name — Sprint 2 ships all of them. |
| Contract §16 (operator clarification 2) | Sprint 1 does NOT ship the helper; Sprint 2 implementation does. |

---

## 3. Module layout (Sprint 2 implementation will create exactly this)

### 3.1 New files (created by Sprint 2 implementation)

```
scripts/corona-backtest/replay/
├── canonical-json.js       # ~50 LOC, zero deps. Exports: canonicalize(value), parseCanonical(bytes).
├── context.js              # ~80 LOC. Exports: createReplayContext(...), assertReplayMode(ctx), deriveReplayClockSeed(...).
├── hashes.js               # ~40 LOC. Exports: sha256OfCanonical(value), computeTrajectoryHash(traj), verifyTrajectoryHash(traj).
├── t1-replay.js            # ~120 LOC. Exports: replay_T1_event(corpus_event, ctx).
├── t2-replay.js            # ~120 LOC. Exports: replay_T2_event(corpus_event, ctx).
├── t3-replay.js            # ~80 LOC.  Exports: replay_T3_event(corpus_event, ctx) — corpus-anchored, no runtime exec.
├── t4-replay.js            # ~120 LOC. Exports: replay_T4_event(corpus_event, ctx).
└── t5-replay.js            # ~100 LOC. Exports: replay_T5_event(corpus_event, ctx) — opt-in diagnostic per Sprint 4.
```

LOC estimates are guidance, not contracts. Sprint 2 implementation may add internal helper files within `scripts/corona-backtest/replay/` if a single module exceeds ~150 LOC, but MUST NOT add files elsewhere under `scripts/`, `src/`, or `tests/` (other than the test files listed in §10).

### 3.2 Touched files (additive, surgical, no semantic change to existing exports)

| File | Modification |
|------|--------------|
| [src/theatres/flare-gate.js](../../../../src/theatres/flare-gate.js) | Add optional last-arg `{ now } = {}` to `createFlareClassGate`, `processFlareClassGate`, `expireFlareClassGate`. |
| [src/theatres/geomag-gate.js](../../../../src/theatres/geomag-gate.js) | Same pattern for `createGeomagneticStormGate`, `processGeomagneticStormGate`, `expireGeomagneticStormGate`. Internal helpers `processKpObservation`, `processSolarWindSignal`, `processCMEArrival`, `processGSTEvent` receive `now` via closure or explicit pass-through (Sprint 2 picks the most surgical pattern). |
| [src/theatres/cme-arrival.js](../../../../src/theatres/cme-arrival.js) | Same pattern for `createCMEArrival`, `processCMEArrival`, `expireCMEArrival`. Internal helpers `processSolarWindForArrival`, `processStormAsArrival`, `processRevisedCME`. |
| [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) | Same pattern for `createProtonEventCascade`, `processProtonEventCascade`, `resolveProtonEventCascade`. |
| [src/theatres/solar-wind-divergence.js](../../../../src/theatres/solar-wind-divergence.js) | Same pattern for `createSolarWindDivergence`, `processSolarWindDivergence`, `expireSolarWindDivergence`. |
| [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) | ADD new export `loadCorpusWithCutoff(corpusDir, options)`. Do NOT modify existing `loadCorpus` export. |
| New tests under `tests/` | The 10 tests pinned in CONTRACT §15 plus one canonical-JSON helper test (see §10). |

### 3.3 Files explicitly NOT touched

- [src/index.js](../../../../src/index.js) — live runtime polling loop. The default-preserving signature means existing call sites compile and run unchanged. Test #9 verifies this.
- [src/processor/*](../../../../src/processor/) — no theatre-side concerns.
- [src/oracles/*](../../../../src/oracles/) — no theatre-side concerns.
- [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) — Q1 freeze. Test #8 enforces non-mutation.
- [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) entrypoint — Sprint 3 wiring; Sprint 2 just lands the seam.
- [scripts/corona-backtest/scoring/*](../../../../scripts/corona-backtest/scoring/) — Sprint 3 wiring.
- All cycle-001 docs, manifests, and run outputs.
- [package.json](../../../../package.json) `dependencies: {}` and `engines.node: ">=20.0.0"` invariants.
- [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) and [tests/manifest_structural_test.js](../../../../tests/manifest_structural_test.js) — re-anchor only via cycle-002 additive manifest at Sprint 3, never silent test edits.

---

## 4. Runtime theatre `now` injection

### 4.1 Function signature pattern

Every runtime theatre function that currently calls `Date.now()` gets an optional last-arg context object:

```
// Before (cycle-001):
export function createFlareClassGate({ id, threshold_class, window_hours, base_rate = 0.15 }) { ... }

// After (cycle-002 Sprint 2):
export function createFlareClassGate({ id, threshold_class, window_hours, base_rate = 0.15 }, { now = () => Date.now() } = {}) { ... }
```

The argument is an OBJECT with optional `now` field, defaulting to `() => Date.now()`. The default is a function expression (not a captured snapshot) so each invocation produces fresh wall-clock time, exactly matching cycle-001 semantics.

Live callers in [src/index.js](../../../../src/index.js) pass nothing → context object defaults to `{}` → `now` defaults to `() => Date.now()` → behavior unchanged.

Replay callers pass `{ now: deterministic_clock }` derived from the corpus event per [CONTRACT §10.1](../sprint-01/CONTRACT.md#101-replay_clock_seed-derivation-per-theatre).

### 4.2 Per-theatre touch points

| Theatre file | Top-level functions getting the new arg | Internal helper handling |
|--------------|------------------------------------------|--------------------------|
| `flare-gate.js` | `createFlareClassGate`, `processFlareClassGate`, `expireFlareClassGate` | None (all `Date.now()` calls live in top-level functions). |
| `geomag-gate.js` | `createGeomagneticStormGate`, `processGeomagneticStormGate`, `expireGeomagneticStormGate` | Internal: `processKpObservation`, `processSolarWindSignal`, `processCMEArrival`, `processGSTEvent` receive `now` via closure or explicit pass-through. Sprint 2 picks the pattern with smallest diff. |
| `cme-arrival.js` | `createCMEArrival`, `processCMEArrival`, `expireCMEArrival` | Internal: `processSolarWindForArrival`, `processStormAsArrival`, `processRevisedCME` same pattern. |
| `proton-cascade.js` | `createProtonEventCascade`, `processProtonEventCascade`, `resolveProtonEventCascade` | None. |
| `solar-wind-divergence.js` | `createSolarWindDivergence`, `processSolarWindDivergence`, `expireSolarWindDivergence` | None. |

### 4.3 Live runtime call-site preservation

Sprint 2 confirms via test #9 (`replay-clock-injection-default-test.js`) that:

- Calling each theatre function with NO explicit context object behaves bit-for-bit like cycle-001 runtime — same `position_history.t` shape, same wall-clock semantics, same `current_position` evolution given the same bundle inputs.
- The 160-test existing suite stays green (test #10).

### 4.4 What Sprint 2 does NOT do to runtime

- Does NOT remove `Date.now()` from internal helpers' default behavior.
- Does NOT introduce `theatre._replay_now` or any state-bag pattern.
- Does NOT introduce a global clock service or singleton.
- Does NOT pass `now` through `bundle.replay_now` (would mutate bundle shape and bleed into `src/processor/bundles.js`).
- Does NOT change ANY runtime parameter, threshold, base_rate, constant, or formula.

---

## 5. Replay seam architecture

### 5.1 Per-theatre replay function shape

Each replay module in `scripts/corona-backtest/replay/` exports one primary function. The shape (pseudocode for design clarity; not implementation):

```
// scripts/corona-backtest/replay/t4-replay.js
export function replay_T4_event(corpus_event, replay_context) {
  // 1. Validate inputs (CONTRACT §11.1 producer-side rules 1–6).
  // 2. Derive cutoff per CONTRACT §6 row T4.
  // 3. Materialize pre-cutoff bundle list from corpus_event evidence.
  // 4. Compute replay_clock_seed via deriveReplayClockSeed({ corpus_event, theatre_id: 'T4' }).
  // 5. Build a `now` injector returning deterministic times derived from corpus event_time fields.
  // 6. Instantiate runtime theatre via createProtonEventCascade(..., { now }).
  // 7. Replay each pre-cutoff bundle via processProtonEventCascade(theatre, bundle, { now }).
  // 8. Build trajectory object from theatre.position_history (filtered to t <= cutoff.time_ms).
  // 9. Compute four hashes (corpus_event_hash, cutoff_hash, gate_params_hash, trajectory_hash).
  // 10. Return canonicalized PredictionTrajectory matching CONTRACT §3.
}
```

T1, T2, T5 follow the same skeleton with their respective runtime theatres. T3 differs (no runtime exec): the replay simply records the corpus's WSA-Enlil prediction as a `corpus_anchored_external` trajectory.

### 5.2 Single replay context object

```
// scripts/corona-backtest/replay/context.js
export function createReplayContext({ corpus_event, theatre_id, runtime_revision }) {
  const seed = deriveReplayClockSeed({ corpus_event, theatre_id });  // throws on missing seed (§6.3)
  return Object.freeze({
    corpus_event,
    theatre_id,
    runtime_revision,
    replay_clock_seed: seed,
    now_for_event: (event_time_ms) => /* deterministic resolution; details in §6.2 */,
    is_replay: true,
  });
}

export function assertReplayMode(ctx) {
  if (!ctx?.is_replay) {
    throw new Error('replay-context: not in replay mode but caller expected it');
  }
}
```

The context is `Object.freeze`'d to prevent mid-replay mutation. Each `replay_T*_event` call gets its own context — no shared state across replays.

### 5.3 No-globals invariant

Sprint 2 implementation MUST satisfy:

- No module-level mutable variables in any `replay/*.js` file.
- No static caches that persist across `replay_T*_event` invocations.
- No `process.env` reads outside the existing `config.js` (`scripts/corona-backtest/config.js` is the single source of env-var resolution).
- The frozen context is the ONLY state carried into a replay invocation.

---

## 6. Loader extension

### 6.1 New additive export

```
// scripts/corona-backtest/ingestors/corpus-loader.js (additive — new export only)
export function loadCorpusWithCutoff(corpusDir, options = {}) {
  // 1. Reuse existing loadCorpus(corpusDir, options) — internal call, do NOT mutate that path.
  // 2. For each event, derive cutoff per CONTRACT §6 row [theatre].
  // 3. Materialize evidence_pre_cutoff[] (bundles, observations with event_time_ms < cutoff.time_ms).
  // 4. Materialize settlement_post_cutoff{} (outcome fields per CONTRACT §7.2).
  // 5. Return:
  //    {
  //      events,                          // unchanged from loadCorpus
  //      errors,                          // unchanged + replay-clock-seed errors
  //      stats,                           // unchanged + per-theatre cutoff_derived_count
  //      cutoffs: { [event_id]: { time_ms, rule } },
  //      evidence: { [event_id]: { pre_cutoff: [...], settlement: {...} } },
  //    }
}
```

The existing `loadCorpus` export is unchanged. Cycle-001 callers continue to use it as-is. The cycle-002 backtest entrypoint (Sprint 3 deliverable) switches to `loadCorpusWithCutoff`.

### 6.2 Cutoff derivation helpers (internal, per theatre)

Sprint 2 implementation adds five internal (non-exported) helpers inside `corpus-loader.js`:

```
function deriveCutoff_T1(event) { /* CONTRACT §6 row T1: flare_peak_time - 1 */ }
function deriveCutoff_T2(event) { /* CONTRACT §6 row T2: first_threshold_crossing_or_window_end */ }
function deriveCutoff_T3(event) { /* CONTRACT §6 row T3: observed_l1_shock_or_window_close */ }
function deriveCutoff_T4(event) { /* CONTRACT §6 row T4: detection_window_end */ }
function deriveCutoff_T5(event, signal) { /* CONTRACT §6 row T5: signal.signal_resolution_time, per-signal */ }
```

These are non-exported because they are loader-internal details; the public surface is `loadCorpusWithCutoff` only.

### 6.3 Pre-cutoff bundle materialization

For T1, T2, T4 (time-series evidence theatres):

- Sort all corpus event observations by `event_time_ms` ascending.
- Filter strictly: `event_time_ms < cutoff.time_ms`.
- Convert each kept observation into a runtime bundle shape compatible with `processFlareClassGate`/`processGeomagneticStormGate`/`processProtonEventCascade` inputs. The bundle conversion is local to the loader's new export; does NOT call the live runtime polling path (`pollSWPC`, `pollDONKI` are out of scope).

For T3: no runtime execution. The replay records the corpus's `wsa_enlil_predicted_arrival_time` directly into a `corpus_anchored_external` trajectory; `position_history_at_cutoff` is empty.

For T5: per-signal sub-event materialization. Each candidate divergence signal gets its own cutoff (`signal.signal_resolution_time`); pre-cutoff Bz history feeds the runtime detection state. T5 is opt-in per Sprint 4 decision; if Sprint 4 chooses not to enable, `loadCorpusWithCutoff` returns empty `evidence.pre_cutoff` for T5 and the trajectory is omitted.

---

## 7. Canonical JSON helper specification

### 7.1 Implementation requirements

- Zero runtime dependencies. No new `npm install`.
- ~50 LOC.
- Spirit of RFC 8785 (JSON Canonicalization Scheme), without taking the RFC as a runtime dependency.
- Exports two functions:

```
// scripts/corona-backtest/replay/canonical-json.js
export function canonicalize(value) {
  // Deterministic UTF-8 string per CONTRACT §9.2:
  //   1. Object keys sorted lexicographically (UTF-16 code-unit order) at every nesting level.
  //   2. No whitespace between tokens.
  //   3. Numbers via Number.prototype.toString() for integers; floats per JSON-spec shortest round-trip.
  //   4. Strings via standard JSON escaping (\", \\, control chars \uXXXX). No reordering, no normalization.
  //   5. Arrays preserve order.
}

export function parseCanonical(bytes) {
  // Standard JSON.parse — canonicalization is one-way for hashing.
  // Parse round-trips are validation-only and may not be byte-identical to input.
}
```

### 7.2 Edge-case handling

| Input | Behavior |
|-------|----------|
| `NaN`, `Infinity`, `-Infinity` | `canonicalize` THROWS. Cycle-002 trajectories should never produce these — if a probability becomes NaN, it's a runtime bug to surface, not silently round. |
| `null` | Rendered as `null`. |
| `undefined` (object value or array element) | `canonicalize` THROWS. JSON has no undefined; cycle-002 trajectories use `null` for missing fields. |
| Nested numeric precision | Use `Number.prototype.toString()`. Probabilities at runtime are already rounded to 3 decimals via the existing `Math.round(x * 1000) / 1000` pattern in theatre files — no new rounding logic. |
| Unicode | Preserve runtime-emitted JSON escaping (`\uXXXX` for control chars). No NFC normalization. |
| BigInt | NOT supported. Cycle-002 theatres do not produce BigInt. `canonicalize` THROWS. |
| Symbol-keyed properties | Ignored (JSON.stringify behavior matches; canonicalize follows). |
| Function values | THROWS. JSON has no function. |

### 7.3 Helper test invariants

Sprint 2 ships `tests/canonical-json-test.js` (in addition to the 10 from CONTRACT §15) covering:

- Object key ordering at single and nested levels.
- Array order preservation.
- No-whitespace output.
- NaN/Infinity/undefined/BigInt rejection.
- Round-trip via JSON.parse for non-edge inputs.
- Stable hex sha256 output for fixed golden inputs.

---

## 8. Provenance and hash computation

### 8.1 Four hashes (recap from CONTRACT §10)

| Hash | Computed from | When |
|------|---------------|------|
| `corpus_event_hash` | Canonical JSON of the source corpus event | At loader time inside `loadCorpusWithCutoff`; recorded once per event. |
| `cutoff_hash` | Canonical JSON of the trajectory's `cutoff` object | At trajectory-emission boundary inside each `replay_T*_event`. |
| `gate_params_hash` | Canonical JSON of the trajectory's `gate_params` object | At trajectory-emission boundary. |
| `trajectory_hash` | Canonical JSON of the entire trajectory with `meta.trajectory_hash` itself omitted (sentinel during computation) | LAST, at trajectory-emission boundary, after all other fields are populated. |

### 8.2 Hash computation order

1. Build trajectory object with `meta.trajectory_hash = ""` (empty-string sentinel).
2. Canonicalize the trajectory.
3. Compute sha256 of the canonical bytes.
4. Replace `meta.trajectory_hash` with the computed hex digest.
5. Return the populated trajectory.

This ordering is verifier-friendly: a reader can replay the procedure (sentinel out, recompute, compare embedded value) and the result must match.

### 8.3 Verification helper

```
// scripts/corona-backtest/replay/hashes.js
export function verifyTrajectoryHash(trajectory) {
  const clone = structuredClone(trajectory);
  const embedded = clone.meta.trajectory_hash;
  clone.meta.trajectory_hash = '';
  const recomputed = sha256OfCanonical(clone);
  return embedded === recomputed;
}
```

CONTRACT §11.2 rule 3 mandates consumer-side recomputation. Sprint 3 calls `verifyTrajectoryHash` before scoring.

---

## 9. Determinism enforcement

### 9.1 Single replay invocation = one frozen context

- One `createReplayContext` call per (corpus_event, theatre) pair.
- Context is `Object.freeze`'d.
- No global state survives a replay invocation.

### 9.2 Audit list of nondeterminism sources Sprint 2 verifies eliminated from the replay path

| Source | Sprint 2 action |
|--------|------------------|
| `Date.now()` | Replay path uses `replay_context.now_for_event(...)` exclusively. Live runtime path (no context object) keeps `Date.now()` via the function-arg default. |
| `Set` / `Map` iteration order | Audit confirms current runtime uses arrays for `position_history`. If any iteration-sensitive code path is found mid-implementation, Sprint 2 either documents it as deterministic-by-insertion-order or refactors to array. Surface in the implementation handoff. |
| `Math.random()` | Audit confirms zero usage in any theatre file; canonicalize rejects NaN if a future Math.random misuse leaks in. |
| File-modification timestamps embedded in any trajectory field | None today. Audit confirms no trajectory field reads file metadata. |
| Wall-clock seeds in `meta` | `replay_clock_seed` derives from corpus event fields per CONTRACT §10.1. Never `Date.now()` on the replay path. |

### 9.3 Replay-mode fail-closed enforcement (per CONTRACT §10.1.1)

Sprint 2 implements the fail-closed enforcement in `replay/context.js`:

```
// scripts/corona-backtest/replay/context.js
export function deriveReplayClockSeed({ corpus_event, theatre_id }) {
  const SEED_FIELDS = {
    T1: ['gate_open_time', 'flare_peak_time'],   // first present wins
    T2: ['gate_open_time', 'window_start'],
    T3: ['cme_observed_time', 'cme.start_time'],
    T4: ['trigger_time'],
    T5: ['detection_window_start'],
  };
  const candidates = SEED_FIELDS[theatre_id];
  for (const field of candidates) {
    const value = readNestedField(corpus_event, field);
    if (value != null && Number.isFinite(parseIso(value))) {
      return parseIso(value);
    }
  }
  throw new Error(
    `replay-context: cannot derive replay_clock_seed for ${theatre_id} from corpus event ` +
    `(tried fields: ${candidates.join(', ')}). Replay mode requires corpus-derived timestamp; ` +
    `no Date.now() fallback. Skipping this corpus event.`,
  );
}
```

The replay seam catches this error at the trajectory-emission boundary and emits a `corpus_load_errors` entry. The trajectory is NOT produced for that event. The Sprint 3 entrypoint surfaces this in `corpus_load_errors` and continues; whether the run exits with code 1 (matching existing convention at [corona-backtest.js:124-132](../../../../scripts/corona-backtest.js:124)) is a Sprint 3 decision.

The fail-closed behavior is enforced HERE, in the replay seam — never inside the runtime theatres themselves. Runtime theatres remain agnostic to replay vs. live.

---

## 10. Test plan

### 10.1 New tests Sprint 2 ships

| # | Test file (proposed) | Asserts |
|---|----------------------|---------|
| 1 | `tests/replay-trajectory-shape-T1-test.js` | Construct a synthetic T1 corpus event; invoke `replay_T1_event`; assert all 17 CONTRACT §11.1 producer rules; assert `distribution_shape === "binary_scalar"`; assert `outcome.kind === "binary"`. |
| 2 | `tests/replay-trajectory-shape-T2-test.js` | Same shape with T2 binding, including the GFZ-lag exclusion path. |
| 3 | `tests/replay-trajectory-shape-T3-test.js` | T3 corpus-anchored trajectory; assert `current_position_at_cutoff === null`, `outcome.kind === "timing_minutes"`, position_history is empty. |
| 4 | `tests/replay-trajectory-shape-T4-test.js` | T4 5-bucket array; assert array length 5, sum ∈ [0.999, 1.001]; `outcome.kind === "bucket_index"`; bucket index derivation matches CONTRACT §8.4. |
| 5 | `tests/replay-determinism-T4-test.js` | Replay one cycle-001 T4 corpus event twice; canonicalize both; byte-compare via `Buffer.equals`. **Rung 1 binding gate.** |
| 6 | `tests/replay-cutoff-assertion-test.js` | Inject a synthetic post-cutoff entry into `position_history_at_cutoff`; consumer-side validator (Sprint 3 import) rejects with hard error. |
| 7 | `tests/replay-shape-rejection-test.js` | T4 trajectory mutated to `distribution_shape: "binary_scalar"` is rejected by the consumer validator with a clear error message. |
| 8 | `tests/replay-rlmf-cert-non-mutation-test.js` | Round-trip: produce a runtime cert via existing `exportCertificate` for a fixed (theatre, outcome) input. Run twice (before-Sprint-2-changes baseline simulated by passing no `now`; after-Sprint-2 with explicit `now` injected to a fixed value). Byte-compare both certs. **Q1 binding gate.** |
| 9 | `tests/replay-clock-injection-default-test.js` | Call `createFlareClassGate(...)` (no second arg); assert `position_history[0].t` is a wall-clock-style integer near `Date.now()`. Repeat for all 5 theatres. **Charter §7 binding gate.** |
| 10 | All existing `npm test` (160/160) | Stays green after Sprint 2 lands. **160-test invariant.** |
| 11 | `tests/canonical-json-test.js` | Helper test (additional to CONTRACT §15) covering §7.3 invariants. |

### 10.2 Test-list registration

[package.json](../../../../package.json) `scripts.test` currently lists 5 test files. Sprint 2 implementation adds the new tests to that list (additive). The 160/160 count grows by ~30–50 (rough estimate) once Sprint 2 lands; the new total becomes the cycle-002 baseline.

### 10.3 Test execution order during Sprint 2 implementation

1. `canonical-json-test.js` first (helper foundation).
2. `replay-clock-injection-default-test.js` (verify runtime behavior preservation; gates §4.3).
3. `replay-trajectory-shape-T4-test.js` (cleanest theatre — bucket_array_5 already matches runtime).
4. `replay-determinism-T4-test.js` (Rung 1 prerequisite).
5. `replay-trajectory-shape-T1`, `T2`, `T3` (binary_scalar + corpus_anchored shapes).
6. `replay-cutoff-assertion-test.js`, `replay-shape-rejection-test.js` (consumer-side validation utilities; Sprint 3 wires in but Sprint 2 ships the assertion helpers).
7. `replay-rlmf-cert-non-mutation-test.js` (final guard; Q1 cannot regress).

### 10.4 Existing test invariants

- All 160 existing tests stay green after Sprint 2 lands.
- The manifest-regression test (29 inline-equals-manifest checks in [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js)) MUST stay green — Sprint 2's signature changes must not trip any `inline_lookup.match_pattern` regex. Sprint 2 implementation reviews each manifest entry's `match_pattern` before committing and confirms regex stability.
- Existing tests do not pass any `{ now }` context object; they continue to receive `Date.now()` via the default.

---

## 11. Risk register specific to Sprint 2

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| S2-R1 | Adding optional last-arg `{ now } = {}` to a runtime theatre function trips an `inline_lookup.match_pattern` regex in the cycle-001 calibration manifest | MEDIUM | Sprint 2 implementation reviews each of the 30 manifest entries' `match_pattern` and confirms regex stability against the new signature. If any pattern breaks, the additive cycle-002 manifest from charter §6 is the only place the updated pattern goes — cycle-001 manifest stays frozen. |
| S2-R2 | Internal helper functions in geomag-gate.js / cme-arrival.js need `now` access but their signatures are not exported; closure-vs-pass-through choice affects the diff size | LOW | Sprint 2 implementation prefers closure; explicit pass-through is acceptable if closure adds excessive nesting. The choice is implementation-time, not design-time. |
| S2-R3 | Live runtime call site in [src/index.js](../../../../src/index.js) inadvertently passes a falsy `now` object that bypasses the default | LOW | Test #9 covers this. The destructuring pattern `({ now = () => Date.now() } = {})` handles `{}`, `{ now: undefined }`, and absent argument identically. |
| S2-R4 | Corpus event lacks the canonical seed field per CONTRACT §10.1 → trajectory not emitted, scoring incomplete for that event | MEDIUM | Sprint 2 emits explicit error per §9.3. Sprint 3 entrypoint surfaces this in `corpus_load_errors`. Operator decides whether to back-fill the corpus seed field — corpus mutation is out of scope for cycle-002 unless explicitly authorized. |
| S2-R5 | `canonical-json.js` produces different bytes across Node versions due to subtle float rendering differences | LOW | Engines pinned at `node: ">=20.0.0"` per package.json. Sprint 2 implementation pins behavior via test #11 with golden inputs/outputs. |
| S2-R6 | RLMF cert non-mutation test (#8) is hard to set up because cert output depends on runtime `theatre.position_history` timestamps that Sprint 2 may marginally alter | MEDIUM | Test uses round-trip with `now` injected to a fixed deterministic value. The cert serialization is deterministic given a deterministic theatre — Sprint 2 implementation must demonstrate this on concrete fixtures. If the test reveals a real-but-tiny diff (e.g., a ms-precision artifact), Sprint 2 surfaces it for charter amendment rather than papering over. |
| S2-R7 | Sprint 2 implementation diff is larger than expected because every theatre file changes | LOW | The signature change is additive and surgical (one optional last-arg per public function, plus closure or pass-through for internal helpers). Diff is mechanical; review burden is bounded. |
| S2-R8 | A determinism-sensitive runtime path is missed in the §9.2 audit (e.g., a hidden `Date.now()` in a helper) | MEDIUM | Sprint 2 implementation does a `grep -rn 'Date.now\|Math.random\|new Date()' src/theatres/` before committing. Any hit not handled is a hard-stop for the implementation review. |

---

## 12. Sprint 2 design — open questions

None blocking. The Sprint 0 charter and Sprint 1 contract together close all the foundational decisions; this design is a faithful realization of those decisions with implementation-time choices flagged inline (§4.2 closure vs. pass-through; §10.2 test-list registration mechanics).

If the operator has feedback on §3 module layout, §4 function signatures, or §10 test plan, those are the natural amendment points before Sprint 2 implementation begins.

---

## 13. What Sprint 2 implementation will NOT do

Reaffirmed for clarity (Sprint 2 implementation, not this design phase):

- Will NOT modify [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) entrypoint (Sprint 3 wiring).
- Will NOT modify any file under [scripts/corona-backtest/scoring/](../../../../scripts/corona-backtest/scoring/) (Sprint 3 wiring).
- Will NOT create the cycle-002 additive manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (Sprint 3 deliverable per charter §6).
- Will NOT modify [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) (Q1 freeze).
- Will NOT modify any oracle, processor, or non-theatre source file in `src/`.
- Will NOT add new corpus events or modify existing ones.
- Will NOT add new runtime parameters or change existing ones.
- Will NOT add new dependencies.
- Will NOT modify cycle-001 manifest, sprint folders, or run outputs.
- Will NOT modify cycle-001 PRD/SDD/SPRINT/NOTES.md.
- Will NOT create a JSON Schema artifact for the trajectory (kept as prose in CONTRACT).
- Will NOT introduce a global clock service or singleton.
- Will NOT pass `now` through bundle shape.

---

## 14. Sprint 2 design closeout / non-implementation guarantees

Sprint 2 design (this document) ships:

- `grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md` (the only file written by Sprint 2 design phase).

Sprint 2 design phase does NOT ship:

- Any source code.
- Any test code.
- Any helper file under `scripts/corona-backtest/replay/`.
- Any modification to `src/`.
- Any modification to `tests/`.
- Any modification to `scripts/corona-backtest.js` or its descendants.
- Any modification to corpus, manifest, or run outputs.
- Any modification to cycle-001 docs.
- Any cycle-002 manifest write.
- Any modification to CHARTER.md or CONTRACT.md beyond operator-instructed clarifications already applied in this turn.
- Any commit, tag, or version bump.

Sprint 2 design exits when:

- Operator ratifies §3 (module layout) — or amends specific paths.
- Operator ratifies §4 (runtime function-arg pattern) — or amends.
- Operator ratifies §10 (test plan) — or amends individual tests.
- Operator confirms Sprint 2 implementation may begin (or instructs further design work).

Sprint 2 implementation (separate HITL deliverable) is gated on this design's ratification.

---

## 15. Cross-references

### 15.1 Inputs Sprint 2 design consumed

- [sprint-00/CHARTER.md](../sprint-00/CHARTER.md) (with operator amendment 1 applied — §4.1 two-summary discipline).
- [sprint-01/CONTRACT.md](../sprint-01/CONTRACT.md) (with operator clarifications 1 and 2 applied — §9.2, §9.3, §10.1.1).
- All five runtime theatre files: [flare-gate.js](../../../../src/theatres/flare-gate.js), [geomag-gate.js](../../../../src/theatres/geomag-gate.js), [cme-arrival.js](../../../../src/theatres/cme-arrival.js), [proton-cascade.js](../../../../src/theatres/proton-cascade.js), [solar-wind-divergence.js](../../../../src/theatres/solar-wind-divergence.js).
- [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js).
- [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) entrypoint.
- [src/index.js](../../../../src/index.js) live runtime polling loop.

### 15.2 Outputs Sprint 2 design produces for Sprint 2 implementation

- §3 module layout — exact files Sprint 2 implementation creates.
- §4 runtime touch points — exact functions getting the new signature.
- §5 replay context shape — Sprint 2 implements `createReplayContext`, `assertReplayMode`, `deriveReplayClockSeed`.
- §6 loader extension — Sprint 2 adds `loadCorpusWithCutoff` and the five internal cutoff-derivation helpers.
- §7 canonical JSON helper — Sprint 2 implements the ~50 LOC zero-dep file.
- §8 hash computation order — Sprint 2 implements `replay/hashes.js`.
- §9.3 fail-closed enforcement — Sprint 2 implements in `replay/context.js`.
- §10 test plan — Sprint 2 ships all 11 tests.

### 15.3 Outputs Sprint 2 design produces for Sprint 3

- After Sprint 2 implementation lands, Sprint 3 has working `replay_T*_event` functions to consume from a new wired backtest entrypoint (or extension of the existing one).
- Sprint 3 inherits the consumer-side validation utilities (`verifyTrajectoryHash`, `assertReplayMode`) from `replay/hashes.js` and `replay/context.js`.
- Sprint 3 inherits the loader's new `loadCorpusWithCutoff` for cutoff-aware ingestion.

---

*Sprint 2 design authored 2026-05-01. cycle-002 / Sprint 2 design phase. corpus_hash invariant `b1caef3f…11bb1` (cycle-001 anchor; preserved). RLMF cert format unchanged. No source changes. No test changes. No helper files. No manifest writes. Operator gate pending.*
