# Sprint 5 Implementation Report — CORONA cycle-001 (Refit + Manifest + Regression Gate)

**Sprint epic**: `corona-3fg` (Sprint 5 — Refit Parameters + Manifest + Regression Gate)
**Sprint type**: REFIT + PROVENANCE
**Scope**: LARGE (8 tasks)
**Generated**: 2026-05-01 (Sprint 5 close)
**Code revision**: `edd816f` at Sprint 5 implementation start; new commits Sprint 5 deliverable
**HITL constraint**: ON (operator approval required at sprint close per handoff §11)

---

## Executive Summary

Sprint 5 implemented the calibration manifest provenance layer + the inline-equals-manifest regression gate, executed Run 2 against the frozen Sprint 3 corpus, and produced a per-theatre delta report. Implementation key decisions:

1. **NO runtime parameter refits**. Sprint 4 evidence + Run 1 baseline analysis found zero parameters where evidence motivates a change (corpus too small for backtest_derived refits per `calibration-protocol.md` §4.4.2; literature_derived values match runtime; promotion to `VERIFIED_FROM_SOURCE` requires DOI verification out of Sprint 5 scope per §1.1 offline-curation constraint). Decision documented in [NOTES.md S5-1](../../NOTES.md).
2. **Manifest populated** with 30 entries — 20 from Sprint 4 evidence sketches (corona-evidence-001..020) + 10 expansion entries (per-key SOURCE_RELIABILITY + CLASS_RELIABILITY + DSCOVR/ACE split) per the handoff §9 expansion target.
3. **Manifest structural test**: 22 tests enforcing PRD §7 schema + Sprint 4 §1.1 verification taxonomy + PRD §8.5 promotion-path rules. Catches the Sprint 4 audit Round 1 failure mode (CR-1, CR-2: silent over-promotion of uncertain evidence to settlement_critical+provisional=false+confidence=high).
4. **Manifest regression gate**: 29 tests enforcing inline-equals-manifest per SDD §7.3, with 24 per-entry tests for clear drift attribution. Cannot be bypassed (`node --test` integration; not a pre-commit hook per SDD §7.2 Approach B).
5. **Run 2 byte-identical to Run 1** (except `run_id`, `Generated`, `code_revision` metadata fields). `corpus_hash` + `script_hash` invariants confirmed. Composite verdict `fail` in both runs.
6. **Delta report** explicitly attributes Run 2 = Run 1 numerics to architectural reality (uniform-prior baselines do not consume runtime constants). No improvements claimed. No cheating. No hidden filtering.

**Test status**: 144 / 144 pass (93 Sprint 0-3 baseline + 22 Sprint 5 structural + 29 Sprint 5 regression).
**`git diff package.json`**: empty (zero-dep invariant intact).
**Validator**: `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)`.

---

## AC Verification

Per Sprint 5 deliverables (handoff §3 + sprint.md GC.4 + GC.5).

### GC.4 — Calibration manifest committed with full provenance per PRD §7 schema

> Source: [sprint.md:387](../../sprint.md#L387)

**Status**: ✓ Met

**Evidence**:
- [calibration-manifest.json](../../calibration/corona/calibration-manifest.json) populated with 30 entries (was `[]` Sprint 1 placeholder).
- Each entry has all 17 required fields: PRD §7's 12 fields (parameter, current_value, theatre, derivation, evidence_source, confidence, corpus_hash, script_hash, provisional, settlement_critical, promotion_path, source_type-as-derivation) + Sprint 4 §1.1 `verification_status` + Sprint 4 evidence-doc fields (id, source_file, source_line, notes) + SDD §7.3 `inline_lookup`.
- Verification tax: structural test [tests/manifest_structural_test.js:90](../../../../tests/manifest_structural_test.js#L90) passes the "every entry has all required fields" assertion across all 30 entries.
- Coverage: PRD §5.5 6 coverage targets fully addressed:
  - WSA-Enlil sigma (T3): corona-evidence-001/002
  - Doubt-price floors T1: corona-evidence-003/004/005
  - Doubt-price floors T2 (Kp σ): corona-evidence-006/007
  - Wheatland prior T4: corona-evidence-008/009/010/011/012/013
  - Bz volatility threshold T5: corona-evidence-014/015/016
  - Source-reliability + class-reliability: corona-evidence-017..029
  - Uncertainty pricing (Normal-CDF): corona-evidence-019/020

### GC.5 — Regression gate prevents un-blessed parameter drift

> Source: [sprint.md:388](../../sprint.md#L388)

**Status**: ✓ Met

**Evidence**:
- [tests/manifest_regression_test.js:55](../../../../tests/manifest_regression_test.js#L55) — main aggregate gate: for each `derivation ∈ {literature_derived, backtest_derived}` entry (24 of 30), verifies the inline constant at `source_file:source_line` matches the manifest's `current_value` via `inline_lookup.match_pattern` regex.
- [tests/manifest_regression_test.js:84](../../../../tests/manifest_regression_test.js#L84) — engineering_estimated structural defense: for `engineering_estimated` entries (6 of 30), verifies the inline constant exists at the cited location (value may diverge per SDD §7.4 + promotion_path, but the entry must not be orphaned).
- [tests/manifest_regression_test.js:107](../../../../tests/manifest_regression_test.js#L107) — PRD §8.5 defense-in-depth: settlement_critical + provisional ⇒ promotion_path non-null (defense-in-depth re-assertion of the structural test's same rule).
- [tests/manifest_regression_test.js:121](../../../../tests/manifest_regression_test.js#L121) — corpus_hash matches Run 1 baseline (catches corpus drift).
- [tests/manifest_regression_test.js:147](../../../../tests/manifest_regression_test.js#L147) — script_hash matches Run 1 baseline (catches harness entrypoint drift).
- 24 per-entry test cases at [tests/manifest_regression_test.js:174](../../../../tests/manifest_regression_test.js#L174) — clear drift attribution (a single value drift produces a single attributed test failure rather than an aggregate failure).
- All 29 regression tests pass at Sprint 5 close.

### Sprint 5 deliverable: Updated processor/theatre parameters where justified

> Source: handoff §9 #1, sprint command brief deliverable #1

**Status**: ✓ Met (NO-OP justified)

**Evidence**:
- [NOTES.md Decision Log S5-1](../../NOTES.md): comprehensive per-parameter analysis of all 30 manifest entries against Sprint 4 evidence + Run 1 baseline → no parameter where evidence motivates a refit.
- Refit decision rationale per parameter table in NOTES.md S5-1 covers each settlement-critical engineering-estimated parameter (only `wheatland_decay_m_class = 0.90` per Sprint 4 §9, refit deferred per the explicit n=1 corpus extension promotion path) and every literature-derived parameter (citation labels match Sprint 4 §1.1 — DOI verification is Sprint 7 territory).
- `git diff src/processor/ src/theatres/` is empty (no source code changes for runtime constants).
- The handoff explicitly authorized "NO-CHANGE" outcome: §3 task table notes refits are conditional on evidence ("Each refit MUST be motivated by either a Sprint 4 literature_derived value OR a Run 1 backtest signal"); §11 Sprint 4 §11 carries the same conditional ("Refit selected parameters where Run 1 motivates a change").

### Sprint 5 deliverable: Manifest structural test

> Source: handoff §9 #3, sprint.md Task 5.4 (corona-3o4)

**Status**: ✓ Met

**Evidence**:
- [tests/manifest_structural_test.js](../../../../tests/manifest_structural_test.js) — 22 tests covering:
  - PRD §7 field validity (all entries have all required fields)
  - PRD §8.5 promotion_path rule (settlement_critical + provisional ⇒ promotion_path non-null)
  - Sprint 4 §1.1 taxonomy: `verification_status` in allowed set + provisional flag invariants
  - `derivation`, `confidence`, `theatre` enum constraints
  - `source_file` is a relative repo path, file exists on disk
  - `source_line` is a positive integer
  - `corpus_hash` and `script_hash` are 64-char hex
  - `inline_lookup` has file/line/match_pattern; pattern is a valid regex
  - `id` uniqueness
  - PRD §5.5 coverage: every documented target has a manifest entry
- All 22 tests pass at Sprint 5 close.

### Sprint 5 deliverable: Manifest regression gate test

> Source: handoff §9 #4, sprint.md Task 5.5 (corona-15v)

**Status**: ✓ Met

**Evidence**:
- [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) — 29 tests as enumerated above for GC.5.
- Test runs as part of the standard `node --test` suite — non-bypassable (cannot use `--no-verify` to skip; CI runs `node --test`).
- Per SDD §7.2 Approach B (test-only) chosen; Approach A (pre-commit hook) deferred to Sprint 7 if friction warrants.

### Sprint 5 deliverable: Run 2 post-refit certificates

> Source: handoff §9 #5, sprint.md Task 5.6 (corona-3ja)

**Status**: ✓ Met

**Evidence**:
- [grimoires/loa/calibration/corona/run-2/](../../calibration/corona/run-2/) — full Run 2 certificate set:
  - `corpus_hash.txt` = `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` (matches Run 1 — corpus invariant ✓)
  - `script_hash.txt` = `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (matches Run 1 — entrypoint invariant ✓)
  - `T1-report.md`, `T2-report.md`, `T3-report.md`, `T4-report.md`, `T5-report.md` — per-theatre certificates
  - `summary.md` — composite roll-up
  - `per-event/` — 25 per-event JSON dumps
  - `delta-report.md` — Sprint 5 / corona-33u deliverable (this fulfills two deliverables)

### Sprint 5 deliverable: Per-theatre delta report

> Source: handoff §9 #6, sprint.md Task 5.7 (corona-33u)

**Status**: ✓ Met

**Evidence**:
- [grimoires/loa/calibration/corona/run-2/delta-report.md](../../calibration/corona/run-2/delta-report.md) — Sprint 5 / corona-33u deliverable.
- Documents Run 1 → Run 2 comparison per theatre with metric tables, verdict attribution, refit-investigation rationale.
- Cross-references Sprint 5 review focus areas (handoff §10 + sprint command brief).
- Architectural disclosure: Run 2 numerics IDENTICAL to Run 1 because uniform-prior baselines do not consume runtime constants. Sprint 7 owns the harness extension to wire runtime predictions into scoring.

### Sprint 5 deliverable: ZERO new runtime deps

> Source: sprint.md GC zero-dep invariant + handoff §7 hard constraint #3

**Status**: ✓ Met

**Evidence**:
- `git diff package.json` empty.
- `package.json:32` `"dependencies": {}` invariant preserved.
- No `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` introduced.
- Sprint 5 imports only: `node:fs`, `node:path`, `node:test`, `node:assert/strict`, `node:url`. Same surface as Sprint 0-4.

### Sprint 5 deliverable: All 60 baseline tests + new manifest tests pass

> Source: sprint.md GC test invariant

**Status**: ✓ Met

**Evidence**:
- `node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js` reports `tests 144 / pass 144 / fail 0`.
- Decomposition: 93 Sprint 0-3 baseline + 22 Sprint 5 structural + 29 Sprint 5 regression = 144 total.
- The "60 baseline" target in sprint.md was Sprint 0 era; Sprint 1-3 added tests cumulatively to 93.

---

## Tasks Completed

### Task 5.1 (`corona-28z`) — Refit theatre parameters

**Decision**: NO-CHANGE per evidence-driven analysis. See [NOTES.md S5-1](../../NOTES.md).

**Files reviewed (no modifications)**:
- [src/theatres/proton-cascade.js:101-105](../../../../src/theatres/proton-cascade.js#L101) — Wheatland productivity params (5 entries: lambda + decay × {X, M, default})
- [src/theatres/solar-wind-divergence.js:34-37](../../../../src/theatres/solar-wind-divergence.js#L34) — bz_divergence_threshold, sustained_minutes, window_hours, base_rate
- [src/theatres/flare-gate.js](../../../../src/theatres/flare-gate.js) — base_rate; no settlement-critical literature-derived constants
- [src/theatres/geomag-gate.js](../../../../src/theatres/geomag-gate.js) — base_rate; same
- [src/theatres/cme-arrival.js](../../../../src/theatres/cme-arrival.js) — tolerance_hours (default 6); operational threshold matches PRD §6 T3 row

**Evidence cross-reference**: empirical-evidence.md §5 (Wheatland), §6 (Bz threshold). All settlement-critical engineering-estimated parameters (`wheatland_decay_m_class = 0.90`) carry their existing promotion_path; refit deferred per Sprint 4 §9 (corpus extension to 15+ M-class triggers required; current corpus has 1).

### Task 5.2 (`corona-8yb`) — Refit processor parameters

**Decision**: NO-CHANGE per evidence-driven analysis. See [NOTES.md S5-1](../../NOTES.md).

**Files reviewed (no modifications)**:
- [src/processor/uncertainty.js:33-49](../../../../src/processor/uncertainty.js#L33) — FLARE_UNCERTAINTY (3 entries: in-progress, complete, confirmed × {sigma_fraction, doubt_base})
- [src/processor/uncertainty.js:64](../../../../src/processor/uncertainty.js#L64) — z=1.96 multiplier (textbook 95% CI)
- [src/processor/uncertainty.js:73-78](../../../../src/processor/uncertainty.js#L73) — class boundary +0.20, in-progress +0.15, doubt cap 0.95
- [src/processor/uncertainty.js:134-146](../../../../src/processor/uncertainty.js#L134) — Kp sigma 0.33/0.67, station adjustments, Kp doubt cap 0.80
- [src/processor/uncertainty.js:198-202](../../../../src/processor/uncertainty.js#L198) — CME arrival sigma defaults (12 base, 10 halo, 18 partial-halo, 1.5x glancing-blow, 0.8x fast)
- [src/processor/quality.js:22-30](../../../../src/processor/quality.js#L22) — SOURCE_RELIABILITY (7 keys)
- [src/processor/quality.js:38-44](../../../../src/processor/quality.js#L38) — CLASS_RELIABILITY (5 keys)
- [scripts/corona-backtest/ingestors/corpus-loader.js:174](../../../../scripts/corona-backtest/ingestors/corpus-loader.js#L174) — T3_NULL_SIGMA_PLACEHOLDER_HOURS = 14

**Evidence cross-reference**: empirical-evidence.md §3 (T3 sigma), §4 (doubt-price floors + Kp sigma), §7 (source/class reliability), §8 (Normal-CDF constants). All literature-derived values match Sprint 4 §1.1 verification labels; promotion to `VERIFIED_FROM_SOURCE` is Sprint 7 territory pending DOI checks.

### Task 5.3 (`corona-25p`) — Author calibration-manifest.json

**Files modified**: [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) populated from `[]` Sprint 1 placeholder to 30 entries.

**Approach**: Each manifest entry copies Sprint 4 evidence-doc field-for-field, with these refinements:
- `verification_status` matches Sprint 4 §1.1 + per-section Round 2/3 inline tags verbatim (no over-promotion).
- `provisional` flag is `true` for all non-VERIFIED_FROM_SOURCE entries (Sprint 4 §1.1 invariant).
- `corpus_hash` and `script_hash` set to Run 1 baseline values (b1caef3..., 17f6380b...) at Sprint 5 manifest population time.
- `inline_lookup` field added per SDD §7.3 schema extension. Each entry has `{file, line, match_pattern}` where `match_pattern` is a regex anchoring the inline constant.
- corona-evidence-018 SPLIT: Sprint 4 sketched a combined DSCOVR+ACE entry; Sprint 5 splits into corona-evidence-018-dscovr and corona-evidence-018-ace per the per-key expansion target.
- New IDs corona-evidence-021..029 added for SOURCE_RELIABILITY (4 keys: SWPC_GOES_SECONDARY, DONKI, GFZ, SWPC_KP) + CLASS_RELIABILITY (5 keys: X, M, C, B, A).

**Test coverage**: structural test asserts every entry has all required fields, verification_status taxonomy compliance, settlement-critical promotion-path rule. See AC Verification GC.4 above.

### Task 5.4 (`corona-3o4`) — Manifest structural test

**Files added**: [tests/manifest_structural_test.js](../../../../tests/manifest_structural_test.js) — 296 lines, 22 tests.

**Approach**: Walks every manifest entry asserting field validity per PRD §7 + Sprint 4 §1.1 + PRD §8.5. Specific Sprint 4 audit Round 1 lessons enforced:
- `VERIFIED_FROM_SOURCE` ⇒ `provisional: false` (no over-promotion).
- non-`VERIFIED_FROM_SOURCE` ⇒ `provisional: true` (no silent demotion).
- `engineering_estimated` ⇒ `verification_status: HYPOTHESIS_OR_HEURISTIC`.
- `engineering_estimated` ⇒ `evidence_source` is null OR explicitly discloses engineering-derived nature (handles Sprint 4's "conceptually anchored" pattern).
- `literature_derived` ⇒ `evidence_source` is non-empty.

### Task 5.5 (`corona-15v`) — Manifest regression gate

**Files added**: [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) — 199 lines, 29 tests.

**Approach**: For each manifest entry, reads the cited file, looks at the cited line, and asserts the `inline_lookup.match_pattern` regex matches. Per-entry tests provide clear drift attribution. Aggregate tests cover corpus_hash + script_hash invariants.

**SDD §7.2 decision**: Approach B (`node --test` integration only). Pre-commit hook (Approach A) deferred to Sprint 7 if friction warrants. Decision rationale: Approach B is non-bypassable (cannot use `--no-verify` to skip; CI runs the test suite); Approach A's value is fast feedback (catch drift before commit), which Sprint 7 may add as defense-in-depth.

### Task 5.6 (`corona-3ja`) — Execute Run 2

**Files added**: [grimoires/loa/calibration/corona/run-2/](../../calibration/corona/run-2/) (T1-T5 reports, summary, corpus_hash, script_hash, per-event/, delta-report.md).

**Approach**: Invoked `CORONA_OUTPUT_DIR=run-2 node scripts/corona-backtest.js` with no other arguments (default theatre filter = all 5; default corpus dir = grimoires/loa/calibration/corona/corpus/).

**Outcome**:
- corpus_hash invariant ✓ (b1caef3...)
- script_hash invariant ✓ (17f6380b...)
- All Brier/MAE/FP-rate/p50/switch-handled values bit-identical to Run 1
- Composite verdict `fail` (T1 fail, T2 pass, T3 fail, T4 fail, T5 fail) — same as Run 1
- Diff between Run 1 and Run 2 certificates: only `run_id` ("run-1" → "run-2"), `Generated` (timestamp), `code_revision` (`7e8b52e` → `edd816f`) differ. All numerical values bit-identical.

### Task 5.7 (`corona-33u`) — Per-theatre delta report

**Files added**: [grimoires/loa/calibration/corona/run-2/delta-report.md](../../calibration/corona/run-2/delta-report.md) — 197 lines.

**Approach**: Per-theatre comparison tables (T1-T5) with metric values for both runs, Δ column showing 0 across all metrics. Verdict attribution explains why each theatre passes or fails. Refit investigation per theatre documents the evidence-driven NO-CHANGE decision. Closes with Sprint 5 review focus area cross-reference + Sprint 7 forward-looking obligations.

---

## Technical Highlights

### Architectural reality + honest disclosure

Sprint 5's most consequential finding: **the Sprint 3 backtest harness uses uniform-prior baselines for T1, T2, T4 scoring** ([t1-bucket-brier.js:32](../../../../scripts/corona-backtest/scoring/t1-bucket-brier.js#L32), [t2-bucket-brier.js:34](../../../../scripts/corona-backtest/scoring/t2-bucket-brier.js#L34), [t4-bucket-brier.js:33](../../../../scripts/corona-backtest/scoring/t4-bucket-brier.js#L33)) and the entrypoint at [corona-backtest.js:148](../../../../scripts/corona-backtest.js#L148) does NOT pass `options.predictedDistribution`. Therefore changing runtime parameter constants in `src/processor/` and `src/theatres/` does NOT affect Run N Brier scores — those constants drive **live** theatre processing, not offline scoring.

This is a **deliberate Sprint 3 architectural choice**, not a bug: uniform-prior baselines establish the no-model floor against which the runtime's value-add can be measured. Sprint 5 cannot fix this in scope (operator hard constraint #6: "Do NOT change Sprint 3 scoring semantics"). Sprint 7 (or future cycles) owns the harness extension to wire runtime predictions into the scoring entrypoint.

The delta report ([run-2/delta-report.md](../../calibration/corona/run-2/delta-report.md)) discloses this architectural reality explicitly so the operator can decide:
- (A) Accept Sprint 5 as a provenance + manifest sprint (current implementation)
- (B) Defer Sprint 5 close; expand scope to include harness extension (would shift Sprint 3 freeze; requires operator authorization)
- (C) Document the constraint and proceed to Sprint 6 (input-validation review) without the harness extension

### Manifest schema extension (SDD §7.3 inline_lookup)

The PRD §7 manifest schema was extended with a non-breaking `inline_lookup` field to support the regression gate. Each entry's `inline_lookup: { file, line, match_pattern }` provides:
- `file`: relative path to the source containing the inline constant
- `line`: 1-based line number of the inline citation site
- `match_pattern`: regex (as a string) that must match the line text

The regex includes the value (e.g., `"bz_divergence_threshold\\s*=\\s*5"`); a value drift fails the match.

The structural test asserts `inline_lookup.file === source_file` and `inline_lookup.line === source_line` (no decoupling) and that `match_pattern` compiles as a valid regex.

### Sprint 4 audit Round 1 lesson encoded as test invariants

Sprint 4 audit Round 1 caught two YAML manifest sketches over-promoting uncertain evidence (CR-1: corona-evidence-006 Kp σ=0.33; CR-2: corona-evidence-020 log_flux linearization). The Round 3 fix demoted both entries to `confidence: medium`, `provisional: true`, and the matching verification_status (ENGINEER_CURATED_REQUIRES_VERIFICATION + OPERATIONAL_DOC_ONLY). Sprint 5's manifest copies these Round 3 corrected values verbatim.

The structural test enforces this invariant going forward:
- `verification_status: VERIFIED_FROM_SOURCE` ⇒ `provisional: false` (only).
- `verification_status: !=VERIFIED_FROM_SOURCE` ⇒ `provisional: true` (always).

A future Sprint that tries to land a manifest with `verification_status: ENGINEER_CURATED_REQUIRES_VERIFICATION` + `provisional: false` (the Sprint 4 audit Round 1 failure mode) will fail the structural test.

### Honoring `engineering_estimated` evidence_source flexibility

Sprint 4 §3.4 corona-evidence-002 (glancing_blow_sigma_multiplier) has `derivation: engineering_estimated` AND a non-null evidence_source ("Conceptually anchored in Riley et al. 2018 ... specific 1.5× multiplier is engineer-derived"). My initial structural test asserted `engineering_estimated ⇒ evidence_source: null`, which would have failed against Sprint 4's intended pattern.

I revised the rule: `engineering_estimated` entries MAY have a non-null `evidence_source`, but the citation text MUST explicitly disclose the engineering-derived nature (regex matches "engineer-derived", "engineering-estimated", "conceptually anchored", "no specific literature anchor", etc.). This preserves Sprint 4's "conceptual anchor" pattern while preventing engineering_estimated entries from looking like literature_derived entries.

### Defense-in-depth in the regression gate

The regression test re-asserts the PRD §8.5 promotion_path rule (settlement_critical + provisional ⇒ promotion_path non-null) even though the structural test already covers it. Rationale: if the structural test ever stops running (filename change, suite restructuring, build-system regression), the regression gate remains the load-bearing pre-commit defense. A settlement-critical engineering-estimated parameter without a promotion_path is the worst failure mode and deserves doubled coverage.

---

## Testing Summary

### Test files

- [tests/corona_test.js](../../../../tests/corona_test.js) — 93 baseline tests (Sprint 0 + 1 + 2 + 3) — unchanged in Sprint 5
- [tests/manifest_structural_test.js](../../../../tests/manifest_structural_test.js) — 22 Sprint 5 structural tests (NEW)
- [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) — 29 Sprint 5 regression tests (NEW)

### Test counts

| Suite | Tests | Pass |
|-------|-------|------|
| Sprint 0-3 baseline (corona_test.js) | 93 | 93 |
| Sprint 5 structural (manifest_structural_test.js) | 22 | 22 |
| Sprint 5 regression (manifest_regression_test.js) | 29 | 29 |
| **Total** | **144** | **144** |

### How to run

```bash
node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js
```

Output (Sprint 5 close):
```
ℹ tests 144
ℹ pass 144
ℹ fail 0
ℹ duration_ms ~160
```

### Test-failure verification (intentional drift sanity)

The reviewer can verify the regression gate ACTUALLY catches drift by:

1. Edit `src/theatres/solar-wind-divergence.js:34` to change `bz_divergence_threshold = 5` → `bz_divergence_threshold = 7` (do NOT commit).
2. Run `node --test tests/manifest_regression_test.js`.
3. Expected: `manifest regression — corona-evidence-014 (theatre.sw_divergence.bz_divergence_threshold_nt) inline-equals-manifest` fails with a diff message: `match_pattern "bz_divergence_threshold\s*=\s*5" did not match`.
4. Revert the change.

Each of the 24 per-entry tests provides clear attribution. The aggregate test at line 55 also fails with a similar message but in less granular form.

---

## Known Limitations

### L1 — Run 2 numerics IDENTICAL to Run 1 (architectural reality, not bug)

**Cause**: Sprint 3 harness uses uniform-prior baselines for T1, T2, T4; T3 reads corpus directly; T5 FP rate is corpus-annotated. Runtime parameter changes do not affect these scoring paths.

**Effect**: Sprint 5 cannot demonstrate parameter-refit-driven verdict improvements. The pass/marginal/fail verdicts are determined by corpus distribution (T1: all 5 events in bucket 3 → min calibration = 0; T4: skewed 1/2/2/0/0 distribution → min calibration = 0; T3: 6.76 h MAE > 6 h pass + 40% hit < 50% marginal; T5: 25% FP > 15% marginal).

**Mitigation**: Sprint 7 (or future cycle) extension to wire runtime predictions into scoring. Documented in [run-2/delta-report.md](../../calibration/corona/run-2/delta-report.md) "Sprint 7 forward-looking obligations" section.

### L2 — Verification status remains ENGINEER_CURATED_REQUIRES_VERIFICATION on most entries

**Cause**: Sprint 5 (like Sprint 4) is offline-curation; the agent cannot DOI-resolve papers to confirm specific numerical claims. Per Sprint 4 §1.1 hard rule, only entries verifiable as textbook claims (corona-evidence-019 z=1.96) can be promoted to `VERIFIED_FROM_SOURCE`.

**Effect**: 28 of 30 entries remain `provisional: true` with non-null promotion_path. The manifest is a valid source-of-truth for inline-equals-manifest checking but is **not yet** a valid source-of-truth for "this value is literature-grounded with high confidence".

**Mitigation**: Sprint 7 / `corona-1ml` final-validate is the natural promotion gate. Each promotion_path explicitly identifies the verification work needed.

### L3 — corona-evidence-002 (glancing_blow_sigma_multiplier 1.5x) refit pending corpus extension

**Cause**: Run 1 corpus has only 1 glancing-blow T3 event (2017-09-10-CME002). Statistical refit of the multiplier requires more events.

**Effect**: The 1.5x multiplier remains `provisional: true` with `verification_status: HYPOTHESIS_OR_HEURISTIC`.

**Mitigation**: Promotion path documented; corpus extension (operator-HITL-gated per `calibration-protocol.md` §3.5) provides the path forward.

### L4 — corona-evidence-011 (wheatland_decay_m_class 0.90) refit pending corpus extension

**Cause**: Run 1 corpus has only 1 M-class T4 trigger (2022-01-20 M5.5 → S1 minor). Refit on n=1 is statistically invalid.

**Effect**: The 0.90 decay value remains the single settlement-critical engineering-estimated parameter per Sprint 4 §9, with explicit promotion_path requiring corpus extension to 15+ M-class triggers.

**Mitigation**: Same as L3.

---

## Verification Steps for Reviewer

1. **Confirm working tree state**:
   ```bash
   git status
   git diff package.json  # MUST be empty (zero-dep invariant)
   ```

2. **Run the full test suite**:
   ```bash
   node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js
   ```
   Expected: `tests 144 / pass 144 / fail 0`.

3. **Verify v3 validator passes**:
   ```bash
   ./scripts/construct-validate.sh construct.yaml
   ```
   Expected: `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)`.

4. **Verify Run 2 reproducibility**:
   ```bash
   CORONA_OUTPUT_DIR=run-2-verify node scripts/corona-backtest.js
   diff -r grimoires/loa/calibration/corona/run-2/ grimoires/loa/calibration/corona/run-2-verify/
   ```
   Expected: only `run_id` ("run-2" → "run-2-verify"), `Generated` timestamp, and per-event JSON `generated_at` differ. After verifying, `rm -rf grimoires/loa/calibration/corona/run-2-verify/`.

5. **Verify Run 2 ≠ Run 1 only on metadata**:
   ```bash
   diff -r grimoires/loa/calibration/corona/run-1/ grimoires/loa/calibration/corona/run-2/
   ```
   Expected: 3 metadata lines per per-theatre report differ; all numerical values bit-identical.

6. **Sanity-check the manifest regression gate against intentional drift**:
   - Edit `src/theatres/solar-wind-divergence.js:34` to change `bz_divergence_threshold = 5` → `bz_divergence_threshold = 7`.
   - Run `node --test tests/manifest_regression_test.js`.
   - Expected: `corona-evidence-014` per-entry test fails with a clear diff message.
   - **REVERT**: `git checkout -- src/theatres/solar-wind-divergence.js` (do NOT commit the drift).

7. **Verify manifest structural rules block Sprint 4 audit Round 1 failure mode**:
   - Edit `grimoires/loa/calibration/corona/calibration-manifest.json` to set `corona-evidence-006`'s `provisional: false` (silent over-promotion of ENGINEER_CURATED_REQUIRES_VERIFICATION → looks like VERIFIED_FROM_SOURCE).
   - Run `node --test tests/manifest_structural_test.js`.
   - Expected: `manifest structural — Sprint 4 §1.1: non-VERIFIED_FROM_SOURCE ⇒ provisional=true` test fails with attribution to corona-evidence-006.
   - **REVERT**: `git checkout -- grimoires/loa/calibration/corona/calibration-manifest.json`.

8. **Cross-check verification_status alignment with Sprint 4 evidence**:
   - For each manifest entry, verify the `verification_status` matches the body-section label in `grimoires/loa/calibration/corona/empirical-evidence.md` (especially §3-§8 inline tags).
   - Round 3 fixes in Sprint 4: corona-evidence-006 = ENGINEER_CURATED_REQUIRES_VERIFICATION + provisional=true; corona-evidence-020 = OPERATIONAL_DOC_ONLY + provisional=true. Both honored verbatim in Sprint 5 manifest.

9. **Cross-check Sprint 5 review focus areas (handoff §10)**:
   - See AC Verification + delta-report.md cross-reference table for itemized coverage.

10. **Verify Beads task lifecycle**:
    ```bash
    br list --status in_progress | grep "corona-3fg\|corona-8yb\|corona-28z\|corona-25p\|corona-3o4\|corona-15v\|corona-3ja\|corona-33u"
    ```
    Expected at Sprint 5 close (before review): all 8 in_progress (or closed if engineer pre-closed pending review approval).

---

## Feedback Addressed

This is the first Sprint 5 implementation pass; no engineer-feedback.md or auditor-sprint-feedback.md exists yet. Future iterations (post `/review-sprint sprint-5` or `/audit-sprint sprint-5`) will append a "Feedback Addressed" section here.

---

## Stop condition

Per the Sprint 5 command brief stop condition + handoff §11:

1. ✓ Sprint 5 implementation complete (this report authored).
2. **Engineer halts.** Operator invokes `/review-sprint sprint-5`.
3. If review returns CHANGES_REQUIRED: engineer addresses, re-runs review until APPROVED.
4. If review APPROVED: operator invokes `/audit-sprint sprint-5`.
5. If audit APPROVED: operator commits Sprint 5 (mirroring Sprint 0/1/2/3/4 pattern).
6. ONLY AFTER Sprint 5 commit lands: operator decides whether to start Sprint 6 (security review epic) or pause.

**Do NOT auto-chain Sprint 5 → Sprint 6.** Sprint 6 / `corona-r4y` (input-validation review) is the natural owner of PEX-1 (`payload.event_type` defensive access in proton-cascade.js:266, 284) — Sprint 5 did NOT smuggle in any Sprint 6 fixes (review focus #6 ✓).

**Do NOT auto-commit.** Per operator stop condition.

---

## File-Level Reference

| Sprint 5 deliverable | Path | Status |
|---|---|---|
| Refit decision rationale | [grimoires/loa/NOTES.md](../../NOTES.md) Decision Log S5-1, S5-2, S5-3 | ✓ |
| Calibration manifest | [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) | ✓ 30 entries |
| Manifest structural test | [tests/manifest_structural_test.js](../../../../tests/manifest_structural_test.js) | ✓ 22 tests pass |
| Manifest regression gate | [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) | ✓ 29 tests pass |
| Run 2 certificates | [grimoires/loa/calibration/corona/run-2/](../../calibration/corona/run-2/) | ✓ T1-T5 + summary + per-event + delta-report |
| Per-theatre delta report | [grimoires/loa/calibration/corona/run-2/delta-report.md](../../calibration/corona/run-2/delta-report.md) | ✓ |
| Sprint 5 implementation report | [grimoires/loa/a2a/sprint-5/reviewer.md](reviewer.md) | ✓ (this file) |

*Sprint 5 / `corona-3fg` epic implementation report — CORONA cycle-001. Closes the loop between Sprint 4 evidence and the running construct via manifest population + regression-gate machinery, while honestly disclosing the architectural reality that Run 2 numerics match Run 1 (uniform-prior baselines do not consume runtime constants). Sprint 7 / `corona-1ml` or future cycle owns the harness extension required for numerically-sensitive parameter refits.*
