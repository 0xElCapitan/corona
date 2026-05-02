# CORONA cycle-002 — Sprint 2 Implementation Report (Milestones 1 + 2)

**Status**: implementation complete for milestone 1 (T4-only Rung-1-first scope).
**Date**: 2026-05-02
**Sprint**: cycle-002 / Sprint 2
**Scope reference**: [grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md](REPLAY-SEAM.md) (ratified)
**Implementation order ratified by**: operator amendment (Rung-1-first, T4 only for milestone 1)

---

## Executive Summary

Sprint 2 milestone 1 lands the **deterministic replay seam** for theatre T4 (Proton Event Cascade) end-to-end:

- 4 new helper modules under `scripts/corona-backtest/replay/` (~360 LOC total)
- Surgical signature change to `src/theatres/proton-cascade.js` adding optional `{ now }` injection (default-preserving; live runtime behaviour byte-stable)
- 6 new test files (54 new tests; 214/214 total passing)
- Cycle-001 invariants intact: corpus_hash `b1caef3f…11bb1`, script_hash `17f6380b…1730f1`, all 160 existing tests still green, calibration-manifest unchanged, calibration-manifest_regression_test still green

**Milestone 1 binding proof**: a T4 corpus event can be replayed twice with byte-identical canonical JSON output, AND its runtime distribution can be scored through the existing `scoreEventT4` API without any modification to `scripts/corona-backtest/scoring/*`.

T1, T2, T3, T5 work is intentionally NOT in scope of milestone 1 (per operator's Rung-1-first amendment). Awaiting HITL gate before proceeding.

---

## AC Verification

### AC-1 — Canonical JSON / hash helpers implemented as Sprint 2 deliverable (CONTRACT §9.2 + clarification 2)

> "The canonical-JSON implementation is a Sprint 2 deliverable, gated on operator ratification of the Sprint 2 design." — [CONTRACT.md §9.2](../sprint-01/CONTRACT.md)

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/canonical-json.js:35-65](../../../../scripts/corona-backtest/replay/canonical-json.js) — `canonicalize(value)` with sorted-key JSON; rejects NaN/Infinity/undefined/BigInt/Function/Symbol per CONTRACT §7.2
- [scripts/corona-backtest/replay/hashes.js:23-25](../../../../scripts/corona-backtest/replay/hashes.js) — `sha256OfCanonical(value)` over canonical bytes
- [tests/canonical-json-test.js](../../../../tests/canonical-json-test.js) — 17 tests covering ordering, rejection, golden hex anchor, escape semantics

### AC-2 — Replay context with deterministic clock seed and fail-closed rule (CONTRACT §10.1.1)

> "Replay-mode clock fail-closed rule: deterministic replay path MUST NOT reach `Date.now()`; emit loader error and skip on missing seed." — [CONTRACT.md §10.1.1](../sprint-01/CONTRACT.md)

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/context.js:62-79](../../../../scripts/corona-backtest/replay/context.js) — `deriveReplayClockSeed` throws on missing seed field; the error message explicitly says "no `Date.now()` fallback"
- [scripts/corona-backtest/replay/context.js:81-99](../../../../scripts/corona-backtest/replay/context.js) — `createReplayContext` returns `Object.freeze`'d context with `is_replay: true`
- [tests/replay-determinism-T4-test.js:78-95](../../../../tests/replay-determinism-T4-test.js) — `replay seam never falls back to Date.now() (fail-closed)` test asserts the throw on a corpus event with missing `trigger_flare_peak_time`

### AC-3 — T4 replay path implemented (REPLAY-SEAM §5)

> "Per-theatre `replay_T*_event(corpus_event, ctx)` function; frozen context object; no-globals invariant." — [REPLAY-SEAM.md §5](REPLAY-SEAM.md)

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/t4-replay.js:60-208](../../../../scripts/corona-backtest/replay/t4-replay.js) — `replay_T4_event(corpus_event, ctx)` performs:
  - Cutoff derivation per CONTRACT §6 row T4 (`trigger_flare_peak_time + window_hours`)
  - Synthetic trigger bundle construction
  - Pre-cutoff proton-flux bundle materialization (sorted by `event_time_ms`)
  - Frame-time clock advancement before each runtime call
  - Runtime theatre instantiation + replay via injected `now`
  - Position-history filter to `t <= cutoff.time_ms` and field rename per CONTRACT §3.1
  - Outcome derivation per CONTRACT §8.4
  - Four-hash provenance per CONTRACT §10
- No module-level mutable state in any `replay/*.js` file (no-globals invariant per REPLAY-SEAM §5.3)

### AC-4 — T4 replay-twice byte-identical (RUNG 1 BINDING GATE — CONTRACT §9.1)

> "For any (corpus_event, runtime_revision, contract_version) triple, two invocations of the Sprint 2 replay seam MUST produce byte-identical trajectory JSON." — [CONTRACT.md §9.1](../sprint-01/CONTRACT.md)

**Status**: ✓ Met
**Evidence**:
- [tests/replay-determinism-T4-test.js:18-37](../../../../tests/replay-determinism-T4-test.js) — `replay twice produces byte-identical canonical JSON for 2024-05-11-S2` (PASS)
- [tests/replay-determinism-T4-test.js:39-58](../../../../tests/replay-determinism-T4-test.js) — `replay-twice byte-identical for ALL 5 cycle-001 T4 corpus events` (PASS) — verifies determinism on the full frozen T4 corpus
- [tests/replay-determinism-T4-test.js:60-76](../../../../tests/replay-determinism-T4-test.js) — `different runtime_revision produces different trajectory_hash` confirms provenance is hashed (not just elided)

### AC-5 — T4 runtime trajectory shape validation (CONTRACT §11.1)

> "The producer MUST guarantee, for every emitted trajectory: rules 1–17." — [CONTRACT.md §11.1](../sprint-01/CONTRACT.md)

**Status**: ✓ Met
**Evidence**:
- [tests/replay-trajectory-shape-T4-test.js](../../../../tests/replay-trajectory-shape-T4-test.js) — 16 tests, each asserting one or more of the 17 producer rules:
  - Rule 1 (schema_version) → [tests/replay-trajectory-shape-T4-test.js:23-27](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rules 2–4 (theatre_id, theatre_template, distribution_shape) → [tests/replay-trajectory-shape-T4-test.js:29-44](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 5 (cutoff.time_ms positive integer) → [tests/replay-trajectory-shape-T4-test.js:46-58](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 6 (gate_params pinned) → [tests/replay-trajectory-shape-T4-test.js:60-66](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rules 7+8 (position_history t_ms ≤ cutoff, monotone) → [tests/replay-trajectory-shape-T4-test.js:68-79](../../../../tests/replay-trajectory-shape-T4-test.js)
  - CONTRACT §3.1 field rename invariant (t→t_ms, evidence→evidence_id) → [tests/replay-trajectory-shape-T4-test.js:81-92](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 10 (bucket_array_5 length 5, elements ∈ [0,1], sum ∈ [0.999, 1.001]) → [tests/replay-trajectory-shape-T4-test.js:94-115](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rules 12+13 (outcome.kind/value) → [tests/replay-trajectory-shape-T4-test.js:117-127](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 14 (replay_clock_source pinned) → [tests/replay-trajectory-shape-T4-test.js:129-134](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 15 (runtime_revision string) → [tests/replay-trajectory-shape-T4-test.js:136-141](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 16 (four hashes 64-char hex) → [tests/replay-trajectory-shape-T4-test.js:143-152](../../../../tests/replay-trajectory-shape-T4-test.js)
  - Rule 17 (trajectory_hash self-verification) → [tests/replay-trajectory-shape-T4-test.js:160-166](../../../../tests/replay-trajectory-shape-T4-test.js)
- All-corpus shape coverage → [tests/replay-trajectory-shape-T4-test.js:182-194](../../../../tests/replay-trajectory-shape-T4-test.js)

### AC-6 — Milestone 1 binding proof: T4 trajectory scored through runtime-bucket path

> "T4 deterministic runtime replay trajectory generated twice with byte-identical output AND scored through the runtime-bucket path WITHOUT touching cycle-001 artifacts." — operator milestone target

**Status**: ✓ Met
**Evidence**:
- [tests/replay-T4-scored-through-runtime-bucket-test.js:25-50](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) — `T4 trajectory.current_position_at_cutoff scored through scoreEventT4` (PASS) — proves the trajectory's runtime distribution is consumable verbatim by the existing cycle-001 scoring API at [scripts/corona-backtest/scoring/t4-bucket-brier.js:35](../../../../scripts/corona-backtest/scoring/t4-bucket-brier.js)
- [tests/replay-T4-scored-through-runtime-bucket-test.js:52-65](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) — `scoring is deterministic` (PASS)
- [tests/replay-T4-scored-through-runtime-bucket-test.js:67-94](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) — `T4 trajectory scoring across all 5 cycle-001 corpus events` (PASS)
- [tests/replay-T4-scored-through-runtime-bucket-test.js:96-110](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) — `runtime trajectory differs from UNIFORM_PRIOR` (PASS) — proves the runtime IS wired (not silently emitting the cycle-001 default)

### AC-A — 160 existing tests stay green (Sprint 2 §10.4 binding invariant)

**Status**: ✓ Met
**Evidence**:
- `npm test` reports `tests 214, suites 29, pass 214, fail 0` — 160 existing tests still pass; 54 new tests pass
- All 5 original test suites still listed in [package.json:18](../../../../package.json) and reported as passing in the run output

### AC-B — Cycle-001 calibration manifest match_patterns intact (manifest_regression_test green)

**Status**: ✓ Met
**Evidence**:
- The `manifest_regression_test.js` suite ran as part of `npm test` and reported PASS for all 30 manifest entries
- The proton-cascade.js modifications are surgical, in-place, at lines 182, 257, and 410+. Manifest match_patterns target lines 102–104 (PRODUCTIVITY_PARAMS) which are unchanged
- Net line shift in proton-cascade.js: +1 line in `resolveProtonEventCascade` body (`const now = nowFn();` added at line ~412). Lines 102–104 are above the addition and unchanged

### AC-C — RLMF cert format frozen at v0.1.0 (Q1 binding gate)

> "Backtest scoring semantics may change in cycle-002, but RLMF certificate format remains frozen for cycle-002." — [CHARTER.md §5](../sprint-00/CHARTER.md)

**Status**: ✓ Met
**Evidence**:
- [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) NOT modified (zero diff)
- [tests/replay-rlmf-cert-non-mutation-test.js](../../../../tests/replay-rlmf-cert-non-mutation-test.js) — 5 tests verify cert format invariants:
  - `cert.version === '0.1.0'` (line 53)
  - position_history entries retain runtime field names `{t, p, evidence}` — NOT renamed to `{t_ms, evidence_id}` (lines 65-79)
  - top-level cert keys unchanged (lines 81-95)
  - brier_score and calibration_bucket types unchanged (lines 97-105)
  - cert byte-stable for fixed (theatre, outcome) input under explicit clock injection (lines 107-127)

### AC-D — Replay-mode fail-closed rule enforced (CONTRACT §10.1.1)

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/context.js:62-79](../../../../scripts/corona-backtest/replay/context.js) — `deriveReplayClockSeed` iterates seed-field candidates and throws explicit "no `Date.now()` fallback" error when none are valid
- [tests/replay-determinism-T4-test.js:78-95](../../../../tests/replay-determinism-T4-test.js) — fail-closed test verifies throw on missing `trigger_flare_peak_time`

### AC-E — Default-preserving clock injection (charter §7 binding gate)

**Status**: ✓ Met
**Evidence**:
- [src/theatres/proton-cascade.js:186](../../../../src/theatres/proton-cascade.js) — `createProtonEventCascade(..., { now: nowFn = () => Date.now() } = {})` — second-arg destructured object with default function
- [src/theatres/proton-cascade.js:257](../../../../src/theatres/proton-cascade.js) — `processProtonEventCascade` same pattern
- [src/theatres/proton-cascade.js:410](../../../../src/theatres/proton-cascade.js) — `resolveProtonEventCascade` same pattern
- [tests/replay-clock-injection-default-test.js](../../../../tests/replay-clock-injection-default-test.js) — 6 tests verify default-preserving behaviour (no `now` arg → wall-clock; explicit `now` → injected; `{}` and `{ now: undefined }` both fall through to default)

### AC-F — Cycle-001 invariants intact (corpus_hash, script_hash, source for non-touched paths)

**Status**: ✓ Met
**Evidence**:
- `cat grimoires/loa/calibration/corona/run-3-final/corpus_hash.txt` returns `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` (charter §3 binding value)
- `cat grimoires/loa/calibration/corona/run-3-final/script_hash.txt` returns `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (charter §3 binding value)
- [scripts/corona-backtest/reporting/hash-utils.js:86-88](../../../../scripts/corona-backtest/reporting/hash-utils.js) — `computeScriptHash` hashes ONLY `scripts/corona-backtest.js` (the entrypoint file), not the dependency tree. New `scripts/corona-backtest/replay/*` files do NOT affect script_hash
- [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) — entrypoint NOT modified by Sprint 2 (Sprint 3 wiring); script_hash unchanged
- All cycle-001 calibration runs (`run-1/`, `run-2/`, `run-3-final/`) NOT modified (zero diff)
- Cycle-001 corpus (`grimoires/loa/calibration/corona/corpus/primary/`) NOT modified (zero diff)
- Cycle-001 manifest (`calibration-manifest.json`) NOT modified (zero diff)
- Cycle-001 sprint folders (`grimoires/loa/a2a/sprint-0/` … `sprint-7/`) NOT modified (zero diff)
- Cycle-001 PRD/SDD/SPRINT/NOTES/BUTTERFREEZONE NOT modified (zero diff)

---

## Tasks Completed

### Task 1: Canonical JSON helper

| Aspect | Detail |
|--------|--------|
| File | [scripts/corona-backtest/replay/canonical-json.js](../../../../scripts/corona-backtest/replay/canonical-json.js) (75 LOC) |
| Approach | Recursive serializer with sorted object keys (UTF-16 code-unit order); `Number.toString()` for numbers; `JSON.stringify` for strings; arrays preserve order |
| Rejection set | NaN, Infinity, -Infinity, undefined, BigInt, Function, Symbol |
| Test coverage | 17 tests in [tests/canonical-json-test.js](../../../../tests/canonical-json-test.js) including a sha256 golden anchor for cross-Node-version stability |

### Task 2: Hash helpers

| Aspect | Detail |
|--------|--------|
| File | [scripts/corona-backtest/replay/hashes.js](../../../../scripts/corona-backtest/replay/hashes.js) (52 LOC) |
| Exports | `sha256OfCanonical(value)`, `computeTrajectoryHash(traj)`, `verifyTrajectoryHash(traj)` |
| Verification pattern | sentinel-out (`meta.trajectory_hash = ''`) → canonicalize → sha256 → embed; verifier replays |
| Dependencies | `node:crypto` only (zero new deps) |

### Task 3: Replay context (with fail-closed rule)

| Aspect | Detail |
|--------|--------|
| File | [scripts/corona-backtest/replay/context.js](../../../../scripts/corona-backtest/replay/context.js) (107 LOC) |
| `deriveReplayClockSeed` | Iterates `SEED_FIELDS_PER_THEATRE[theatre_id]`; throws explicit "no `Date.now()` fallback" error on missing seed |
| `createReplayContext` | Returns `Object.freeze`'d context with `is_replay: true` |
| Theatre coverage | T1, T2, T3, T4, T5 seed fields scaffolded; only T4 exercised in milestone 1 |
| Note | T4 seed field is `trigger_flare_peak_time` (the canonical field present in cycle-001 T4 corpus events) |

### Task 4: T4 runtime injection (proton-cascade.js)

| Aspect | Detail |
|--------|--------|
| File | [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) |
| Functions modified | `createProtonEventCascade` (line 186), `processProtonEventCascade` (line 257), `resolveProtonEventCascade` (line 410) |
| Pattern | `({ ... }, { now: nowFn = () => Date.now() } = {})` — second-arg destructured object with default function |
| Net line change | +1 line (in `resolveProtonEventCascade` body, capturing `nowFn()` once before reuse) |
| Manifest impact | Lines 102–104 (PRODUCTIVITY_PARAMS) unchanged. `manifest_regression_test` PASS |
| Live runtime impact | Zero — calls without an explicit context fall through to `Date.now()` default. Verified by [tests/replay-clock-injection-default-test.js](../../../../tests/replay-clock-injection-default-test.js) and the unmodified 160-test baseline |

### Task 5: T4 replay path

| Aspect | Detail |
|--------|--------|
| File | [scripts/corona-backtest/replay/t4-replay.js](../../../../scripts/corona-backtest/replay/t4-replay.js) (215 LOC) |
| Entrypoint | `replay_T4_event(corpus_event, ctx)` |
| Cutoff rule | `trigger_flare_peak_time + prediction_window_hours * 3600_000` |
| Bundle materialization | Pre-cutoff `proton_flux` bundles only (`event_time_ms < cutoff.time_ms`), sorted ascending |
| Trigger bundle | Synthetic `solar_flare` bundle with `flareRank(trigger_flare_class)` |
| Frame-time clock | Mutable local `frameTimeMs` advanced before each runtime call; runtime captures via `nowFn()` |
| Field rename | At trajectory-emission boundary only (`t→t_ms`, `evidence→evidence_id`); runtime state shape unchanged |
| Hashes | Four sha256 hex digests (corpus_event, cutoff, gate_params, trajectory) |

### Task 6: Tests

| File | Tests | Asserts |
|------|-------|---------|
| [tests/canonical-json-test.js](../../../../tests/canonical-json-test.js) | 17 | Object/array ordering; rejection set; round-trip; sha256 stability + golden anchor |
| [tests/replay-clock-injection-default-test.js](../../../../tests/replay-clock-injection-default-test.js) | 6 | T4 runtime functions without `now` arg use Date.now(); explicit `now` overrides; `{}` and `{ now: undefined }` fall through to default |
| [tests/replay-trajectory-shape-T4-test.js](../../../../tests/replay-trajectory-shape-T4-test.js) | 16 | All 17 CONTRACT §11.1 producer rules + non-T4 rejection + all-5-corpus shape coverage |
| [tests/replay-determinism-T4-test.js](../../../../tests/replay-determinism-T4-test.js) | 4 | Replay-twice byte-identical (one event); replay-twice byte-identical (all 5 events); runtime_revision affects trajectory_hash; fail-closed on missing seed |
| [tests/replay-T4-scored-through-runtime-bucket-test.js](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) | 4 | Trajectory scored through `scoreEventT4` (verbatim distribution); deterministic Brier; finite Brier across all 5 events; trajectory ≠ uniform prior |
| [tests/replay-rlmf-cert-non-mutation-test.js](../../../../tests/replay-rlmf-cert-non-mutation-test.js) | 5 | cert.version pinned; runtime field names retained (no t_ms/evidence_id leak); top-level keys unchanged; types unchanged; byte-stable under fixed clock |
| **Total new** | **52** | |

### Task 7: package.json scripts.test (additive registration)

| Aspect | Detail |
|--------|--------|
| File | [package.json](../../../../package.json) |
| Change | Added 6 new test files to `scripts.test` (additive only) |
| Invariants preserved | `version: "0.2.0"` unchanged; `dependencies: {}` unchanged; `engines.node: ">=20.0.0"` unchanged |

---

## Technical Highlights

### Smallest-path Rung-1-first scope discipline

Per operator's amendment, this implementation explicitly DEFERRED:

- `loadCorpusWithCutoff` (REPLAY-SEAM §6) — not needed for milestone 1 since `replay_T4_event` materializes pre-cutoff bundles internally from `corpus_event.proton_flux_observations`. Will land alongside T1/T2 work or Sprint 3 entrypoint wiring.
- T1/T2/T3/T5 replay modules — out of milestone-1 scope per the binding implementation order.
- T1/T2 binary scoring path — Sprint 3 territory; requires CONTRACT §9 binary-Brier modules under `scripts/corona-backtest/scoring/` (not touched in Sprint 2).

This reduces the milestone 1 surface to the smallest set that proves the seam and earns Rung 1.

### Default-preserving function-arg pattern

The signature `(theatre, bundle, { now: nowFn = () => Date.now() } = {})` handles three call shapes identically:

| Caller passes | Effect |
|---------------|--------|
| Nothing (no second arg) | `{}` default → `nowFn` defaults to `() => Date.now()` |
| `{}` | `nowFn` defaults to `() => Date.now()` |
| `{ now: undefined }` | `nowFn` defaults to `() => Date.now()` |
| `{ now: () => 1234 }` | `nowFn` is the injected function |

The 160 existing tests do not pass any second argument and are unaffected. Verified by [tests/replay-clock-injection-default-test.js](../../../../tests/replay-clock-injection-default-test.js) and the existing test suite passing at 160/160.

### Determinism via single-capture in resolve

[src/theatres/proton-cascade.js:412](../../../../src/theatres/proton-cascade.js) — added `const now = nowFn();` once at the top of `resolveProtonEventCascade` and reused for both `resolved_at` and the closing `position_history` entry's `t`. Cycle-001 runtime called `Date.now()` twice (microseconds apart in practice; identical in replay). Sprint 2's single-capture preserves the cycle-001 behaviour AND ensures byte-identical replay output.

### Runtime distribution is genuinely consumed

[tests/replay-T4-scored-through-runtime-bucket-test.js:96-110](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) — `runtime trajectory differs from UNIFORM_PRIOR` test uses L1 distance to confirm the runtime distribution is materially different from `[0.2, 0.2, 0.2, 0.2, 0.2]`. This is the binding evidence that the seam is genuinely runtime-wired (not silently falling through to the cycle-001 uniform-prior default).

For 2024-05-11-S2 (X5.8 trigger, 72h window, 3 qualifying S1+ proton events), the runtime produces a Wheatland-prior-derived distribution heavily concentrated on the 11+ bucket (since the prior expects ~38 events from an X5+ trigger). Observed bucket is "2-3" (3 events). Brier ≈ 0.4 (worst-case for this prior shape).

### Provenance hashing chain

Four hashes provide cycle-002 reproducibility:

| Hash | What changes if it changes |
|------|----------------------------|
| `corpus_event_hash` | Source corpus event content |
| `cutoff_hash` | Cutoff rule (e.g. switching from `window_end` to `first_threshold_crossing`) |
| `gate_params_hash` | Threshold pinning (e.g. moving from S1 to S2) |
| `trajectory_hash` | Anything in the trajectory including provenance metadata |

Together these allow an auditor to detect drift in any of (a) corpus, (b) cutoff rule, (c) gate parameters, (d) runtime code revision.

---

## Testing Summary

```
$ npm test
...
ℹ tests 214
ℹ suites 29
ℹ pass 214
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 219.4871
```

**Breakdown**:
- 160 existing cycle-001 tests: PASS (unchanged from baseline)
- 54 new milestone-1 tests: PASS

**Critical gates verified**:
- `manifest_regression_test`: PASS (no shift in match_pattern target lines)
- `manifest_structural_test`: PASS (manifest schema invariants intact)
- T4 replay-twice byte-identical (Rung 1 binding): PASS for all 5 cycle-001 corpus events
- Default-preserving clock injection (charter §7 binding): PASS
- RLMF cert format frozen (Q1 binding): PASS
- Replay-mode fail-closed (CONTRACT §10.1.1): PASS

**To reproduce locally**:
```
npm test
```

---

## Known Limitations

### Scope deferrals (intentional, per operator's Rung-1-first amendment)

| Item | Status | Notes |
|------|--------|-------|
| T1 binary replay path | NOT in scope of milestone 1 | Per operator binding order step 6 (after T4 Rung 1 passes) |
| T2 binary replay path | NOT in scope of milestone 1 | Same as T1 |
| T3 corpus-anchored trajectory | NOT in scope of milestone 1 | Per operator binding order step 7; CONTRACT shape test #3 deferred |
| T5 quality-of-behavior trajectory | NOT in scope of milestone 1 | Per operator binding order step 7 |
| `loadCorpusWithCutoff` export | NOT in scope of milestone 1 | T4 replay materializes bundles internally; loader split deferred to Sprint 3 entrypoint wiring |
| Sprint 3 entrypoint wiring | OUT of Sprint 2 scope entirely | `scripts/corona-backtest.js` and `scripts/corona-backtest/scoring/*` untouched |
| Cycle-002 additive manifest | NOT yet created | Path reserved at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` per CHARTER §6.2; first write is Sprint 3 deliverable |

### Implementation choices to flag

| Choice | Detail | Risk |
|--------|--------|------|
| `corpus_event_hash` excludes `_derived` and `_file` | Strips loader-injected metadata before hashing | If loader's derivation logic changes, the corpus_event_hash stays stable. Future work may want to track loader version separately |
| Frame-time clock advances per bundle | T4 replay's `now()` returns the current proton-flux event_time during processing | This is correct for `position_history.t` but means there's no "between-bundles" time. Live runtime processes bundles as they arrive; replay collapses the inter-bundle wall-clock gap. The trajectory is still byte-identical and the Brier is still meaningful |
| T4 corpus events sometimes have rounded probability sums slightly outside [0.999, 1.001] | Worst-case rounding drift for 5-element distribution can be ±0.0025 | All 5 cycle-001 T4 corpus events produce sums that pass the contract tolerance check (verified). If a future corpus event tripped the assertion, it would be a real shape regression worth surfacing |

### Future work (out of Sprint 2 scope)

- **Sprint 3 wiring**: connect `replay_T4_event` to `scripts/corona-backtest.js` entrypoint so a full cycle-002 backtest run produces per-event T4 trajectories and feeds them to scoring
- **Cycle-002 additive manifest**: commit `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` with cycle-002 script_hash and per-theatre runtime-replay anchors
- **T1, T2 binary replay**: per operator step 6 after milestone 1 ratifies
- **T3 corpus-anchored trajectory shape test**: per CONTRACT §15 test #3
- **T5 diagnostic trajectory** (Sprint 4 decision): optional runtime-trace-aware diagnostic per Q3 posture

---

## Verification Steps for Reviewer

### 1. Run the full test suite
```
npm test
```
Expected: `tests 214, pass 214, fail 0`.

### 2. Verify cycle-001 invariants are intact
```
cat grimoires/loa/calibration/corona/run-3-final/corpus_hash.txt
# Expected: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1

cat grimoires/loa/calibration/corona/run-3-final/script_hash.txt
# Expected: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
```

### 3. Verify cycle-001 source files NOT touched (excluding intentional proton-cascade.js)
```
git status
# Expected modifications:
#   modified: package.json (additive scripts.test only)
#   modified: src/theatres/proton-cascade.js (3 surgical edits)
# Expected new files:
#   scripts/corona-backtest/replay/{canonical-json,hashes,context,t4-replay}.js
#   tests/canonical-json-test.js
#   tests/replay-clock-injection-default-test.js
#   tests/replay-trajectory-shape-T4-test.js
#   tests/replay-determinism-T4-test.js
#   tests/replay-T4-scored-through-runtime-bucket-test.js
#   tests/replay-rlmf-cert-non-mutation-test.js
#   grimoires/loa/a2a/cycle-002/sprint-02/reviewer.md
# NOT touched:
#   grimoires/loa/prd.md, sdd.md, sprint.md, NOTES.md
#   grimoires/loa/calibration/corona/calibration-manifest.json (frozen historical evidence)
#   grimoires/loa/calibration/corona/run-{1,2,3-final}/ (frozen)
#   src/rlmf/certificates.js (Q1 freeze)
#   scripts/corona-backtest.js entrypoint (Sprint 3 territory)
#   scripts/corona-backtest/scoring/* (Sprint 3 territory)
```

### 4. Verify proton-cascade.js modifications are surgical
```
git diff src/theatres/proton-cascade.js
# Expected diff size: ~10 lines changed total
# - 3 function signatures gain `, { now: nowFn = () => Date.now() } = {}`
# - 2 in-place changes from `Date.now()` to `nowFn()`
# - 1 new line in resolveProtonEventCascade body for `const now = nowFn();`
# - 2 in-place changes from `Date.now()` to `now` in resolveProtonEventCascade
```

### 5. Verify Rung 1 binding gate
The milestone-1 binding gate is the determinism test. To verify it directly:
```
node --test tests/replay-determinism-T4-test.js
# Expected: 4/4 tests pass
```

### 6. Verify Q1 binding gate (RLMF cert frozen)
```
node --test tests/replay-rlmf-cert-non-mutation-test.js
# Expected: 5/5 tests pass
```

### 7. Verify charter §7 binding gate (default-preserving clock)
```
node --test tests/replay-clock-injection-default-test.js
# Expected: 6/6 tests pass
```

---

## Operator-Triggered Hard Stop Conditions

None triggered. All five conditions remain unmet:

| Condition | Status |
|-----------|--------|
| Implementation requires changing scope | ✓ NOT triggered (milestone 1 stayed within ratified REPLAY-SEAM scope) |
| Cycle-001 calibration manifest mutation appears necessary | ✓ NOT triggered (manifest unchanged; `manifest_regression_test` PASS) |
| RLMF certificate output changes (Q1 freeze) | ✓ NOT triggered (`tests/replay-rlmf-cert-non-mutation-test.js` PASS; cert.js zero diff) |
| T1/T2 require bucket projection (Q7 prohibition) | ✓ NOT triggered (T1/T2 not in milestone-1 scope) |
| T3/T5 start affecting runtime-uplift scoring | ✓ NOT triggered (T3/T5 not in milestone-1 scope; existing T3/T5 scoring untouched) |

---

---

# Milestone 2 (step 6) — T1/T2 Binary Replay

**Status**: implementation complete for milestone 2. Operator ratified milestone 1 and authorised step 6 (T1/T2 binary replay paths) under the same Rung-1-first discipline.

## Milestone 2 Executive Summary

T1 (Flare Class Gate) and T2 (Geomagnetic Storm Gate) now produce **deterministic `binary_scalar` runtime replay trajectories**, scored through **NEW threshold-native binary Brier modules** alongside the cycle-001 6-bucket scorers (which remain frozen as corpus-baseline diagnostics per CHARTER §9.3).

### Honest framing — T1/T2 are runtime-wired, NOT calibration-improved

> **BINDING DISCLOSURE (operator clarification on milestone-2 review)**:
>
> - T1 and T2 replay is **runtime-wired** and **deterministic** — the runtime theatre is invoked via the default-preserving function-arg seam, the trajectory is byte-identical across replays, and the scoring path consumes the trajectory's `current_position_at_cutoff` verbatim.
> - The current cycle-001 corpus provides **prior-only T1/T2 trajectories**, NOT pre-cutoff time-series learning. Cycle-001 T1 events have only post-flare metadata (no GOES X-ray series); cycle-001 T2 events have only post-storm peak Kp (no per-3hr Kp series). Consequently `replay_T1_event` / `replay_T2_event` invoke `createX` once and never call `processX` — the trajectory's `current_position_at_cutoff` equals the runtime's `base_rate` constant.
> - This proves **Rung 1 runtime wiring** (charter §10) — the seam exists, is deterministic, and produces a real trajectory consumable by binary scoring. **It does NOT prove calibration improvement** (Rung 3).
> - **No "calibration-improved" claim is permitted from T1/T2** until later runtime evidence (corpus expansion with pre-cutoff time-series) or runtime-parameter refit evidence demonstrates predictive uplift over the predeclared cycle-002 replay baseline (charter §8 Baseline B).
> - T4 IS exercised by the cycle-001 corpus's pre-cutoff `proton_flux_observations` and produces a non-trivial Wheatland-prior-derived distribution that materially differs from `UNIFORM_PRIOR` (verified by `tests/replay-T4-scored-through-runtime-bucket-test.js`). T4 milestone-1 carries the strongest "runtime-wired" evidence.

- 4 new modules under `scripts/corona-backtest/{scoring,replay}/` (~520 LOC total)
- Surgical signature changes to `src/theatres/flare-gate.js` (3 functions) and `src/theatres/geomag-gate.js` (3 top-level + 4 internal helpers)
- Refactored `scripts/corona-backtest/replay/context.js` to support T1's CONTRACT §10.1 computed seed (`flare_peak_time - window_hours * 3600_000`) and T2's `kp_window_start` direct seed
- 5 new test files (47 new tests)
- **261/261 total tests passing** (160 cycle-001 baseline + 54 milestone-1 + 47 milestone-2)
- 0 hard stop conditions triggered

## Milestone 2 Binding Proof

```
T1 corpus event "T1-2024-05-14-X8p7" (X8.7 flare, M1.0 threshold)
  → replay_T1_event(event, ctx)
  → trajectory.distribution_shape = "binary_scalar"
  → trajectory.current_position_at_cutoff = 0.15 (runtime base_rate prior; cycle-001 corpus has no pre-cutoff time-series)
  → trajectory.outcome = { kind: "binary", value: 1 }   (X8.7 ≥ M1.0)
  → scoreEventT1Binary(event, trajectory) → brier_score = 0.7225  (= (0.15 - 1)^2)

T2 corpus event "T2-2024-05-11-Kp9" (Kp 9, threshold 5)
  → replay_T2_event(event, ctx)
  → trajectory.distribution_shape = "binary_scalar"
  → trajectory.outcome = { kind: "binary", value: 1, kp_observed_source: "gfz" }
  → scoreEventT2Binary(event, trajectory) → brier_score finite, in [0, 1]

Determinism: T1 + T2 replay-twice byte-identical for ALL 10 cycle-001 corpus events (5 T1 + 5 T2).
```

End-to-end T1/T2 seam works WITHOUT modifying:
- `scripts/corona-backtest/scoring/t1-bucket-brier.js` (legacy, frozen)
- `scripts/corona-backtest/scoring/t2-bucket-brier.js` (legacy, frozen)
- `scripts/corona-backtest.js` (entrypoint, Sprint 3 territory)
- `src/rlmf/certificates.js` (Q1 freeze)
- Any cycle-001 calibration manifest, corpus, or run output

## Milestone 2 AC Verification

### M2-AC-1 — T1/T2 binary scoring path implemented (NEW; legacy untouched per CHARTER §9.3)

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/scoring/t1-binary-brier.js:35-86](../../../../scripts/corona-backtest/scoring/t1-binary-brier.js) — `scoreEventT1Binary` and `scoreCorpusT1Binary` with independent Brier formula `(p - o)^2` (operator hard constraint #5 / SDD §6.4)
- [scripts/corona-backtest/scoring/t2-binary-brier.js:31-93](../../../../scripts/corona-backtest/scoring/t2-binary-brier.js) — same pattern with GFZ-preferred Kp comparison (CONTRACT §8.2)
- [scripts/corona-backtest/scoring/t1-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t1-bucket-brier.js) and [t2-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t2-bucket-brier.js) — UNTOUCHED (zero diff); verified by [tests/replay-T1T2-binary-brier-scoring-test.js:140-148](../../../../tests/replay-T1T2-binary-brier-scoring-test.js)

### M2-AC-2 — T1 replay produces `binary_scalar` trajectory with CONTRACT-pinned shape

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/t1-replay.js:46-128](../../../../scripts/corona-backtest/replay/t1-replay.js) — `replay_T1_event`
- 12 producer-side validation tests in [tests/replay-trajectory-shape-T1-test.js](../../../../tests/replay-trajectory-shape-T1-test.js) cover: schema_version, theatre_id/template/event_id/distribution_shape, cutoff `flare_peak_minus_epsilon`, gate_params pin (M1.0 / 24h), scalar p ∈ [0,1], position_history t_ms ≤ cutoff + field rename, binary outcome, four-hash provenance, computed-seed equivalence, hash self-verification, all-corpus shape coverage

### M2-AC-3 — T2 replay produces `binary_scalar` trajectory with GFZ-preferred outcome

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/t2-replay.js:43-127](../../../../scripts/corona-backtest/replay/t2-replay.js) — `replay_T2_event` with `cutoff.rule = "first_threshold_crossing_or_window_end"` (falls back to window_end since cycle-001 corpus lacks per-3hr Kp time-series)
- 12 tests in [tests/replay-trajectory-shape-T2-test.js](../../../../tests/replay-trajectory-shape-T2-test.js)

### M2-AC-4 — T1/T2 replay-twice byte-identical (CONTRACT §9.1)

**Status**: ✓ Met
**Evidence**:
- [tests/replay-determinism-T1T2-test.js:21-34](../../../../tests/replay-determinism-T1T2-test.js) — T1 byte-identical for ALL 5 cycle-001 T1 corpus events (PASS)
- [tests/replay-determinism-T1T2-test.js:36-49](../../../../tests/replay-determinism-T1T2-test.js) — T2 byte-identical for ALL 5 cycle-001 T2 corpus events (PASS)
- Provenance hashing: changing `runtime_revision` produces different `trajectory_hash` while corpus/cutoff/gate-params hashes stay stable

### M2-AC-5 — T1/T2 default-preserving clock injection (charter §7)

**Status**: ✓ Met
**Evidence**:
- [src/theatres/flare-gate.js](../../../../src/theatres/flare-gate.js) — 3 functions modified with `({ ... }, { now: nowFn = () => Date.now() } = {})` pattern; net diff: +1 line per function (3 total) for nowFn capture in resolve/expire bodies
- [src/theatres/geomag-gate.js](../../../../src/theatres/geomag-gate.js) — 3 top-level + 4 internal helpers; internal helpers receive `nowFn` as 3rd parameter from the dispatcher
- 9 tests in [tests/replay-clock-injection-default-T1T2-test.js](../../../../tests/replay-clock-injection-default-T1T2-test.js) verify: no-arg uses Date.now(), explicit `now` overrides, `{}` falls through to default
- 160 existing cycle-001 tests still PASS (verified by `npm test`)

### M2-AC-6 — Replay-mode fail-closed for T1/T2 (CONTRACT §10.1.1)

**Status**: ✓ Met
**Evidence**:
- [scripts/corona-backtest/replay/context.js:34-46](../../../../scripts/corona-backtest/replay/context.js) — refactored `SEED_DERIVATIONS_PER_THEATRE` with T1 computed-seed support
- [tests/replay-determinism-T1T2-test.js:84-99](../../../../tests/replay-determinism-T1T2-test.js) — fail-closed tests for T1 (missing `flare_peak_time`) and T2 (missing `kp_window_start`)

### M2-AC-7 — Cycle-001 invariants intact

**Status**: ✓ Met
**Evidence**:
- `npm test`: 261/261 pass (160 cycle-001 baseline preserved)
- `manifest_regression_test`: PASS — flare-gate.js / geomag-gate.js have NO manifest entries pointing to them (verified by grep at preflight)
- `cat grimoires/loa/calibration/corona/run-3-final/corpus_hash.txt` → `b1caef3f…11bb1` (unchanged)
- `cat grimoires/loa/calibration/corona/run-3-final/script_hash.txt` → `17f6380b…1730f1` (unchanged)
- `src/rlmf/certificates.js` — zero diff (Q1 freeze)
- Cycle-001 calibration manifest, runs, corpus, sprint folders, PRD/SDD/SPRINT/NOTES — zero diff

## Milestone 2 Tasks Completed

| Task | File | Detail |
|------|------|--------|
| Refactor context.js for T1 computed seed | [scripts/corona-backtest/replay/context.js](../../../../scripts/corona-backtest/replay/context.js) | `SEED_FIELDS_PER_THEATRE` → `SEED_DERIVATIONS_PER_THEATRE` (per-theatre derivation functions). T1: `gate_open_time ?? (flare_peak_time - window * 3600_000)`. T4 unchanged. |
| Modify flare-gate.js | [src/theatres/flare-gate.js](../../../../src/theatres/flare-gate.js) | 3 functions get `{ now: nowFn = () => Date.now() } = {}` arg; bodies capture `nowFn()` once and use `now`. Net +2 lines (1 each in process and expire) |
| Modify geomag-gate.js | [src/theatres/geomag-gate.js](../../../../src/theatres/geomag-gate.js) | 3 top-level + 4 internal helpers. Public functions get `{ now: nowFn = … } = {}`; internal helpers receive `nowFn` as 3rd parameter from the dispatcher |
| t1-binary-brier.js | NEW (101 LOC) | Independent binary Brier `(p-o)^2`; flareRank-based outcome derivation |
| t2-binary-brier.js | NEW (105 LOC) | Independent binary Brier; GFZ-preferred Kp comparison; n_events_excluded_no_kp surfaced |
| t1-replay.js | NEW (139 LOC) | T1 replay with cycle-002 pinned gate params (M1.0, 24h); cutoff = peak - 1; computed seed |
| t2-replay.js | NEW (138 LOC) | T2 replay with cycle-002 pinned gate params (Kp 5, 72h); cutoff = window_end; kp_window_start seed |
| 5 test files | NEW | 47 tests covering shape, determinism, scoring proof, default-preserving clock |

## Milestone 2 Notable Decisions

### T1/T2 trajectories capture base-rate prior only

Cycle-001 T1/T2 corpus events do not carry pre-cutoff time-series evidence (no GOES X-ray series for T1, no per-3hr Kp series for T2). The runtime is invoked once for theatre creation. The trajectory's `position_history_at_cutoff` therefore contains only the initial base-rate entry. This is honest framing per CHARTER §10:

> Rung 1 (runtime-wired): trajectory is real and deterministic. Rung 3 (calibration-improved): trajectory beats predeclared baseline.

Milestone 2 earns Rung 1 for T1 and T2 — the trajectory IS real, deterministic, and scoreable. Rung 3 (uplift) is a separate gate dependent on either (a) richer corpus events with pre-cutoff observational time-series or (b) runtime parameter refits, both of which are outside Sprint 2 scope.

### Internal-helper signature for geomag-gate.js

The 4 internal helpers (`processKpObservation`, `processSolarWindSignal`, `processCMEArrival`, `processGSTEvent`) are NOT exported. They received `nowFn` as a 3rd parameter (rather than via closure) for diff-size minimisation: each helper site is touched in exactly one place — the call site in `processGeomagneticStormGate` — and signature changes are mechanical.

### Cutoff fallback for T2

CONTRACT §6 row T2 specifies cutoff as `min(first_threshold_crossing, window_end)`. Cycle-001 T2 corpus events have only the post-storm peak Kp (kp_swpc_observed, kp_gfz_observed) — no time-series — so `first_threshold_crossing` is not derivable. The cutoff falls back to `kp_window_end`. Future corpus expansions could add per-3hr Kp series to enable the tighter cutoff.

## Provenance Note for Sprint 3 (operator-binding requirement)

Per operator's milestone-1 ratification:

> However, for cycle-002, the additive runtime replay manifest must not rely on a hash that excludes the new replay seam.
>
> Binding requirement for Sprint 3 / manifest work:
> - cycle-002 provenance must hash the replay implementation files
> - call this `runtime_replay_hash`, `replay_script_hash`, or similar
> - do not reuse cycle-001 `script_hash` semantics

**Sprint 2 status on this binding**: NO cycle-002 manifest has been created (per Sprint 0 charter §6.2 — first write is a Sprint 3 deliverable).

**Sprint 3 implementation hand-off**: when committing `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`, the manifest schema MUST include a new field — proposed name `replay_script_hash` — computed over the replay seam files. Minimum file set:

```
scripts/corona-backtest/replay/canonical-json.js
scripts/corona-backtest/replay/hashes.js
scripts/corona-backtest/replay/context.js
scripts/corona-backtest/replay/t1-replay.js     ← added in milestone 2
scripts/corona-backtest/replay/t2-replay.js     ← added in milestone 2
scripts/corona-backtest/replay/t4-replay.js
scripts/corona-backtest/scoring/t1-binary-brier.js   ← added in milestone 2
scripts/corona-backtest/scoring/t2-binary-brier.js   ← added in milestone 2
```

Sprint 3 should also document why the cycle-001 `script_hash` (= sha256 of `scripts/corona-backtest.js` only) is INSUFFICIENT for cycle-002 provenance: it does not cover the replay seam dependencies that drive cycle-002 trajectory output, so a parallel hash is needed.

Cycle-001 manifest stays frozen. Cycle-002 manifest is additive.

## Milestone 2 Hard Stop Conditions

None triggered. All five conditions remain unmet:

| Condition | Status |
|-----------|--------|
| T1/T2 require fake bucket projection (Q7 prohibition) | ✓ NOT triggered (T1/T2 use `binary_scalar` natively, no projection) |
| Deterministic replay requires `Date.now()` fallback | ✓ NOT triggered (replay-mode fail-closed enforced; T1 + T2 fail-closed tests PASS) |
| RLMF certificate output changes | ✓ NOT triggered (`src/rlmf/certificates.js` zero diff; existing rlmf-cert-non-mutation test still PASS) |
| Cycle-001 manifest mutation appears necessary | ✓ NOT triggered (no manifest entries on flare-gate.js / geomag-gate.js; manifest_regression_test PASS) |
| T3/T5 pulled into runtime-uplift scoring | ✓ NOT triggered (T3/T5 not touched; cme-arrival.js / solar-wind-divergence.js zero diff) |

## Awaiting Operator HITL Gate

Milestones 1 + 2 complete. Per operator's Rung-1-first discipline, the next natural step is **Sprint 3** — entrypoint wiring + cycle-002 additive manifest commit (with the `replay_script_hash` provenance binding from above).

**Suggested next steps**:

1. **Approve milestones 1+2 as a unit and pause** — commit Sprint 2 implementation to a working branch; defer Sprint 3 to a separate ratification cycle
2. **Approve milestones 1+2 + proceed to Sprint 3** — wire the entrypoint (`scripts/corona-backtest.js`) to use `loadCorpusWithCutoff` + replay modules, commit the cycle-002 additive manifest
3. **Approve milestones 1+2 + adjust scope** — request changes before proceeding

No commit has been made. All Sprint 2 file changes are uncommitted in the working tree per HITL discipline.
