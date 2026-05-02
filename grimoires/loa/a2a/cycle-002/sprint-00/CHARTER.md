# CORONA cycle-002 — Sprint 0 Charter

**Status**: charter (NOT a sprint plan, NOT a PRD). Implementation forbidden until charter is ratified.
**Authored**: 2026-05-01
**Cycle**: cycle-002 (cycle-001 closed at v0.2.0; HEAD `d137a18`)
**Mission carry-over from PLANNING-FRAME**: *Make CORONA's backtest score CORONA's runtime predictions.*

> Sprint 0 produces this charter and nothing else. Sprint 0's exit gate is operator ratification of every section below — particularly the freeze list (§3), theatre posture table (§4), and success-criteria ladder (§10). No code, no tests, no commits, no manifest writes during Sprint 0.

---

## 1. Operator-bound decisions (cycle-002 entry conditions)

The eight open questions from [PLANNING-FRAME.md §5](../PLANNING-FRAME.md) are answered. Each answer below is **binding** for the entire cycle and may not be relitigated mid-cycle except via an explicit charter amendment.

| # | Question | Binding answer |
|---|----------|----------------|
| Q1 | RLMF certificate scope | **FROZEN.** No mutation of `src/rlmf/certificates.js`. No schema bump. Cert version stays `'0.1.0'`. All bucket-shape work lives at backtest/replay seam. |
| Q2 | T3 posture | **WSA-Enlil canonical / external-model scoring.** No CORONA T3 prediction emission in cycle-002. T3 NOT counted toward predictive uplift. |
| Q3 | T5 posture | **Quality-of-behavior / settlement-semantics.** No probabilistic-Brier conversion. T5 may be runtime-trace-aware diagnostically; T5 NOT counted toward predictive uplift. |
| Q4 | Manifest re-anchor | **Additive only.** Cycle-001 manifest at [grimoires/loa/calibration/corona/calibration-manifest.json](../../../calibration/corona/calibration-manifest.json) is frozen historical evidence. Cycle-002 gets a separate file (path declared in §6). |
| Q5 | Replay clock | **Default-preserving function-arg injection.** Optional `now` / `clock` provider; defaults to `Date.now()`; avoid decorator magic and full refactor. |
| Q6 | Baselines | **Two baselines, clearly labeled.** (a) Cycle-001 historical baseline = uniform-prior / corpus-annotated numerics, immutable; (b) cycle-002 replay baseline = first runtime-replay output BEFORE any parameter refit. No "no-baseline" closeout. |
| Q7 | T1/T2 scoring semantics | **No fake bucket-projection.** Add threshold-native binary scoring for T1/T2 when runtime-wired. Existing 6-bucket scoring path stays as legacy / corpus-baseline diagnostic. Bucket-projection ONLY if a defensible deterministic mapping is justified in writing AND ratified. T4 stays clean first target. |
| Q8 | Sensitivity-proof knob | **T4 first.** Primary perturbation = T4 proton-cascade distribution parameter (e.g., Wheatland λ or PRODUCTIVITY_PARAMS values) in a controlled diagnostic fixture. T1/T2 scalar-threshold knob only AFTER binary-runtime scoring semantics ship. CME σ_hours forbidden for primary sensitivity proof (T3 is WSA-Enlil-owned). |

---

## 2. Cycle-002 charter

### 2.1 Mission (one line)

Wire CORONA's runtime prediction trajectories into the offline backtest harness so a runtime-side change can deterministically and auditably move the backtest score.

### 2.2 What cycle-002 IS

- A **measurement-seam cycle**.
- An **architecture cycle** that adds: PredictionTrajectory contract, deterministic replay clock seam, T4 runtime-wired scoring path, T1/T2 binary runtime-wired scoring path (new, alongside legacy 6-bucket), and an additive cycle-002 calibration manifest carrying cycle-002-run-1 hashes.
- A **sensitivity-proof cycle** in the narrow sense of a controlled two-direction perturbation test on T4.
- A **honest-framing cycle** continuing the cycle-001 closeout discipline.

### 2.3 What cycle-002 is NOT

- NOT a **parameter-refit cycle.** Runtime parameters stay at cycle-001 values until the harness is proven sensitive (Sprint 5 prerequisite).
- NOT an **L2-publish cycle.** L2 publish-ready language is gated by the §10 success-criteria ladder; cycle-002 may earn it but will not assume it.
- NOT a **release-hygiene cycle.** No CHANGELOG creation, no GitHub Release, no v0.3.0 bump on a vacuum claim. Tag posture is a Sprint 6 closeout question.
- NOT a **schema/cert cycle.** RLMF cert format is frozen (Q1); v3 construct schema commit `b98e9ef` is frozen.
- NOT a **corpus-expansion cycle.** Primary corpus stays at 5 events/theatre. The "30-event corpus" idea remains a future-cycle carry-forward (Sprint 4 §4.5 entry-006).
- NOT a **T3 prediction-modeling cycle** (Q2).
- NOT a **T5 probabilistic-uplift cycle** (Q3).

### 2.4 Composition (proposed sprint shape — non-binding numeric labels)

Per [PLANNING-FRAME.md §7](../PLANNING-FRAME.md), with charter-time refinements:

| Sprint | Title | Charter-time scope refinement |
|--------|-------|--------------------------------|
| 0 | This charter | (this document) |
| 1 | PredictionTrajectory contract | Per-theatre `distribution_shape`: `'binary_scalar'` (T1, T2 runtime-wired path), `'bucket_array_5'` (T4), `'corpus_anchored_external'` (T3), `'quality_of_behavior'` (T5). |
| 2 | Deterministic replay seam | Default-preserving function-arg `now` injection (Q5). 160/160 test invariant must hold. |
| 3 | T4 runtime-wired scoring + T1/T2 binary-runtime scoring | T4 first (clean). T1/T2 binary scoring lands as NEW path alongside legacy 6-bucket. Cycle-002 manifest committed at this sprint's end. |
| 4 | T3/T5 posture documentation | Posture is bound by §4; sprint produces the prose addendum, not new code. May add T5 runtime-trace-aware diagnostic IF strictly diagnostic and not conflated with uplift. |
| 5 | T4 sensitivity proof (two-direction test) | Primary perturbation knob per Q8. Cycle-002 manifest's regression baseline updated. |
| 6 | Closeout / honest framing | Run-1 vs replay-baseline comparison; calibration-improved claim only if §10 ladder is met. |

Sprint 0 ratifies these slots; later sprints may compress (Sprint 4 may roll into Sprint 6 if T5 stays purely settlement) but may NOT skip the contract / replay / sensitivity gates.

---

## 3. Frozen artifact list (RATIFIED)

The list below is binding for the entire cycle-002. No file in this list may be mutated, renamed, deleted, or re-purposed without a written charter amendment.

### 3.1 Cycle-001 planning artifacts

- [grimoires/loa/prd.md](../../../prd.md) — cycle-001 PRD (historical; copy-on-revise into cycle-002 namespace if needed)
- [grimoires/loa/sdd.md](../../../sdd.md) — cycle-001 SDD (historical)
- [grimoires/loa/sprint.md](../../../sprint.md) — cycle-001 sprint plan (historical)

### 3.2 Cycle-001 sprint folders

- [grimoires/loa/a2a/sprint-0/](../../sprint-0/) through [sprint-7/](../../sprint-7/) — frozen. NO rename, mutate, continue, or copy-into-cycle-002.

### 3.3 Cross-cycle and cycle-001 closeout artifacts

- [grimoires/loa/a2a/trajectory/](../../trajectory/) — append-only across cycles (cycle-002 may append; may not rewrite history)
- [grimoires/loa/a2a/readme-audit-v0.2.0.md](../../readme-audit-v0.2.0.md), [readme-patch-v0.2.0.md](../../readme-patch-v0.2.0.md) — frozen
- [grimoires/loa/NOTES.md](../../../NOTES.md) — append-only with explicit `[cycle-002]` prefix per session-continuity protocol; cycle-001 entries immutable

### 3.4 Calibration tree

- [grimoires/loa/calibration/corona/calibration-manifest.json](../../../calibration/corona/calibration-manifest.json) — **frozen historical evidence (693 lines, 30 entries, anchored to corpus_hash `b1caef3f…11bb1` + script_hash `17f6380b…1730f1`)**
- [grimoires/loa/calibration/corona/calibration-protocol.md](../../../calibration/corona/calibration-protocol.md) — frozen (Sprint 2 closure, 523 lines)
- [grimoires/loa/calibration/corona/empirical-evidence.md](../../../calibration/corona/empirical-evidence.md) — frozen (Sprint 4 closure)
- [grimoires/loa/calibration/corona/security-review.md](../../../calibration/corona/security-review.md) — frozen (Sprint 6 closure)
- [grimoires/loa/calibration/corona/theatre-authority.md](../../../calibration/corona/theatre-authority.md) — frozen unless Sprint 4 posture decision authorizes additive addendum
- [grimoires/loa/calibration/corona/corpus/primary/](../../../calibration/corona/corpus/primary/), `secondary/` — frozen (corpus_hash invariant)
- [grimoires/loa/calibration/corona/run-1/](../../../calibration/corona/run-1/), `run-2/`, `run-3-final/` — frozen historical run outputs

### 3.5 Runtime / source

- [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) — **frozen by Q1** (cert `version: '0.1.0'`, schema, brier formulas, position_history shape, calibration_bucket logic)
- [src/processor/settlement.js](../../../../src/processor/settlement.js) — frozen (settlement authority semantics: ground_truth / provisional_mature / cross_validated / provisional / degraded)
- All runtime parameter values: `flareThresholdProbability` σ, `kpThresholdProbability` σ, `buildCMEArrivalUncertainty`, T4 `PRODUCTIVITY_PARAMS` (lambda, decay), `S_SCALE_THRESHOLDS_PFU`, `SEP_DEDUP_WINDOW_MINUTES`, T1/T2/T5 `base_rate` defaults — frozen until §10 "runtime-sensitive" claim is earned (Sprint 5)
- [package.json](../../../../package.json) `dependencies: {}` — frozen (zero-dependency posture)
- v3 schema: [schemas/construct.schema.json](../../../../schemas/construct.schema.json) commit `b98e9ef`, [construct.yaml](../../../../construct.yaml) — frozen
- [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js), [tests/manifest_structural_test.js](../../../../tests/manifest_structural_test.js) — re-anchor only via §6 (additive cycle-002 manifest); NEVER silent test edits

### 3.6 Closeout language and posture

- [BUTTERFREEZONE.md](../../../../BUTTERFREEZONE.md) — frozen at v0.2.0 closeout snapshot. Cycle-002 changes (if any earn the right) are additive at cycle-002 closeout only.
- [README.md](../../../../README.md) — frozen at v0.2.0 honest-no-refit posture. Cycle-002 closeout may amend per §10 ladder; cycle-002 mid-cycle never edits README.
- All "L1-tested" / "calibration-attempted" / "calibration-improved" / "L2 publish-ready" language is governed by §10 ladder. No premature relaxation.

### 3.7 Out-of-scope (explicitly NOT touched in cycle-002)

These are valid future work but are NOT cycle-002 scope:

- Promoting any calibration-manifest entry from `ENGINEER_CURATED_REQUIRES_VERIFICATION` / `OPERATIONAL_DOC_ONLY` / `HYPOTHESIS_OR_HEURISTIC` → `VERIFIED_FROM_SOURCE`
- Corpus expansion (5 events/theatre stays)
- New runtime dependencies of any kind (`dependencies: {}` invariant)
- Test framework changes (still `node --test`)
- L2 publish language changes
- GitHub Release creation
- CHANGELOG.md creation
- Tag creation (Sprint 6 closeout question, conditional on §10 ladder)
- v0.3.0 version bump (Sprint 6 closeout, conditional)
- T3 CORONA prediction emission (Q2)
- T5 probabilistic-uplift conversion (Q3)
- RLMF cert format / version changes (Q1)
- Construct schema commit changes
- Larger T1/T2 6-bucket calibration framing (deferred — see §9)

---

## 4. Theatre posture table (BINDING)

Per Q2, Q3, Q7, Q8. This table is the single source of truth for cycle-002 theatre handling.

| Theatre | Runtime emits | Cycle-002 scoring path | Counts toward predictive uplift? | Notes |
|---------|---------------|------------------------|----------------------------------|-------|
| **T1** Flare Class Gate | scalar `current_position` ∈ [0,1] (binary "≥ threshold class?") | **NEW: threshold-native binary Brier** scoring path (`scoring/t1-binary-brier.js`, proposed name). Legacy 6-bucket scoring at [t1-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t1-bucket-brier.js) preserved as corpus-baseline diagnostic. | YES (when binary-runtime scoring is wired and operating on the runtime trajectory). | Bucket-projection forbidden unless a written justification is ratified separately. |
| **T2** Geomag Storm Gate | scalar `current_position` ∈ [0,1] (binary "Kp ≥ N?") | Same shape as T1: **NEW threshold-native binary Brier** scoring path (`scoring/t2-binary-brier.js`, proposed name). Legacy 6-bucket at [t2-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t2-bucket-brier.js) preserved as corpus-baseline diagnostic. | YES (same conditions as T1). | Same bucket-projection prohibition. |
| **T3** CME Arrival | scalar `current_position` (CORONA's binary "arrives within ±tol of WSA-Enlil?") — but the **prediction itself comes from corpus's `wsa_enlil_predicted_arrival_time`**, not CORONA. | **UNCHANGED.** [t3-timing-error.js](../../../../scripts/corona-backtest/scoring/t3-timing-error.js) continues to score the corpus's WSA-Enlil prediction against L1 observations. CORONA's T3 `current_position` is NOT consumed by cycle-002 backtest scoring. | **NO.** T3 is reported as "external model timing score / settlement-evidence diagnostic / non-CORONA-owned predictive component" per Q2. | T3 row in any composite-verdict table MUST be tagged `[external-model]` to prevent misattribution. Settlement authority for T3 stays canonical (CORONA's runtime uncertainty pricing wraps WSA-Enlil; that wrapping is unchanged). |
| **T4** Proton Event Cascade | array of 5 (Poisson over BUCKETS — already matches scoring shape) | **WIRED.** [t4-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t4-bucket-brier.js) consumes the runtime trajectory's pre-cutoff `current_position` array directly. | **YES.** Primary uplift evidence theatre. First sensitivity-proof target (Q8). | Cleanest seam; no shape adaptation. T4 also gets the cycle-002 baseline anchor (§8) before any other theatre. |
| **T5** Solar Wind Divergence | scalar `current_position` + detection state (`divergence_history`, `current_streak`, `peak_divergence`) | **UNCHANGED for primary scoring.** [t5-quality-of-behavior.js](../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js) continues to score FP-rate / p50 / switch-handled / hit-rate-diagnostic. Sprint 4 may add a runtime-trace-aware diagnostic (e.g., compare runtime-detected divergence signals against `corpus_fp_label`) BUT only as a `[diagnostic-only]` field. | **NO.** Quality-of-behavior is the canonical settlement; converting to probabilistic uplift is forbidden by Q3. | T5 row in composite-verdict tables MUST be tagged `[quality-of-behavior]`. Adding the optional diagnostic must NOT change the existing `fp_rate` / `stale_p50` / `switch_handled` numerics — those stay byte-stable. |

### 4.1 Two-summary reporting rule (cycle-002) — operator amendment 1

Every cycle-002 backtest summary report MUST produce TWO clearly labeled summaries. They may not be conflated, blended, or implied to be the same artifact.

**1. Runtime-uplift composite**

- Includes ONLY theatres eligible for CORONA runtime predictive uplift in cycle-002.
- Current set: **T1, T2, T4**.
- T1 and T2 use threshold-native binary scoring once it is defined (§9).
- T4 uses runtime bucket-distribution scoring.
- This is the ONLY summary that may be referenced when claiming runtime-uplift, calibration-improved, or any §10 ladder rung above Rung 1.

**2. Full-picture diagnostic summary**

- Includes all five theatres (T1, T2, T3, T4, T5).
- MUST be explicitly labeled `diagnostic` / `non-uplift` in every section title, table caption, and report body.
- MUST NOT be referred to as a "composite verdict" without the `[diagnostic]` prefix. Bare "composite verdict" is reserved for the runtime-uplift composite.
- MUST NOT be used to claim calibration-improved or runtime predictive uplift, regardless of its numerics.
- Exists to give reviewers a transparent full-system view; that is its only purpose.

**Per-theatre rows**

Both summaries list per-theatre rows WITH posture tags: `T1 [runtime-binary]`, `T2 [runtime-binary]`, `T3 [external-model]`, `T4 [runtime-bucket]`, `T5 [quality-of-behavior]`.

**Claim discipline**

Any "calibration-improved" claim MUST cite the SPECIFIC theatres it covers (e.g., "T4 calibration-improved vs cycle-002 replay baseline"; never bare "calibration-improved"). Bare claims, claims sourced from the diagnostic summary, or claims that mix uplift and diagnostic numerics are forbidden.

**Why this matters (binding rationale per operator amendment)**

T3 (external-model, WSA-Enlil-owned) and T5 (quality-of-behavior, settlement-anchored) numerics could make the full-picture summary look better or worse without that change reflecting any CORONA-owned predictive uplift. The two-summary discipline prevents semantic laundering where a movement in T3 or T5 quietly inflates or deflates the cycle's apparent calibration result.

---

## 5. RLMF / certificate non-goal (binding per Q1)

> **Sprint 0 declaration**: Backtest scoring semantics may change in cycle-002, but RLMF certificate format remains frozen for cycle-002. If later work needs certificate changes, that becomes a separate versioned cycle.

Concretely:

- [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) is **not edited in cycle-002**. Cert `version: '0.1.0'` is preserved verbatim through Sprint 6.
- The cert's `performance.brier_score`, `performance.position_history`, `performance.calibration_bucket`, and `temporal.time_weighted_brier` semantics stay byte-identical (subject to runtime state shape staying byte-identical, which §3.5 enforces).
- The runtime cert export pipeline ([src/index.js:235-251](../../../../src/index.js:235)) is not modified.
- The bucket-shape adaptation for T1/T2 binary-runtime scoring lives **only** at the backtest seam (a new module under `scripts/corona-backtest/scoring/` per §4). Runtime `current_position` shapes per theatre are unchanged.
- Cycle-002 closeout doc (Sprint 6) MUST include a one-line audit note: "RLMF certificate format (`src/rlmf/certificates.js` `version: '0.1.0'`) unchanged in cycle-002."
- If during Sprint 4 a runtime-trace-aware T5 diagnostic is added, the diagnostic data lives in **backtest-only** report fields and is NOT propagated into the runtime cert.

**Failure mode to watch for**: a Sprint 3 PR that "innocently" widens T1/T2 runtime `current_position` from scalar to bucket-array would silently mutate every downstream RLMF cert. The Sprint 1 PredictionTrajectory contract enforces this boundary by separating "runtime trajectory shape" (frozen) from "scoring distribution shape" (computed at backtest seam).

---

## 6. Manifest freeze + additive cycle-002 manifest strategy (binding per Q4)

### 6.1 Freeze

[grimoires/loa/calibration/corona/calibration-manifest.json](../../../calibration/corona/calibration-manifest.json) is **immutable historical evidence** for cycle-002. Its `corpus_hash` (`b1caef3f…11bb1`) and `script_hash` (`17f6380b…1730f1`) anchor v0.2.0's reproducibility claim and remain valid as long as no cycle-002 work mutates the cycle-001 corpus or scripts (which §3 forbids).

### 6.2 Additive cycle-002 manifest path (RATIFIED)

The cycle-002 additive manifest goes here:

```
grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json
```

Rationale: it is calibration data, so it lives in the calibration tree alongside the cycle-001 manifest. The `cycle-002/` subdirectory mirrors the cycle-001 layout cleanly and makes the cycle boundary visually obvious in any future repo review. (The alternative path `grimoires/loa/a2a/cycle-002/runtime-replay-manifest-plan.md` is reserved for the *design plan* of the manifest — that doc, if needed, is a Sprint 1/Sprint 3 deliverable, not Sprint 0.)

### 6.3 Manifest scope

`runtime-replay-manifest.json` carries entries for the cycle-002 runtime-replay path:

- `corpus_hash` for cycle-002-run-1 (expected unchanged: `b1caef3f…11bb1` since corpus is frozen)
- `script_hash` for cycle-002-run-1 (will differ from cycle-001 once new scoring modules land)
- Per-theatre runtime-replay anchor entries for T1, T2, T4 (T3 entries reuse cycle-001 manifest content unchanged; T5 entries unchanged)
- Pointer back to `calibration-manifest.json` for cycle-001-anchored evidence
- Schema version field declaring this is an additive cycle-002 manifest, not a replacement

### 6.4 Regression-test handling

[tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) is extended (not rewritten) so it:

- Continues to validate cycle-001 manifest entries against cycle-001 hashes (these are the historical-truth gate)
- Adds validation of cycle-002 manifest entries against cycle-002 hashes once Sprint 3 commits cycle-002-run-1
- Treats hash drift on cycle-001 manifest as a hard fail (any drift = corruption of historical evidence)
- Treats hash drift on cycle-002 manifest only after Sprint 3 anchors it

In-place mutation of cycle-001 manifest entries is **forbidden** at every sprint. There is no escape hatch for this in cycle-002.

---

## 7. Replay clock decision (binding per Q5)

### 7.1 Pattern

**Default-preserving optional function-arg injection.** Theatre create / process / expire / resolve functions accept an optional context parameter, e.g.:

```js
// proposed signature shape — final shape is Sprint 1 deliverable
processFlareClassGate(theatre, bundle, { now = () => Date.now() } = {})
```

Existing live callers ([src/index.js:208-224](../../../../src/index.js:208)) pass nothing → `now: Date.now()` default → existing runtime behavior preserved bit-for-bit. Backtest replay passes `{ now: () => corpus_event.event_time_ms }` for deterministic replay.

### 7.2 Constraints

- 160/160 existing tests MUST stay green through Sprint 2 (`npm test` invariant).
- No theatre file may call `Date.now()` directly without going through the injected `now()` once Sprint 2 lands. Direct `Date.now()` calls remain in the LIVE callers (`src/index.js`, polling loop) and in non-theatre modules — those are out of scope.
- Decorator wrappers and full refactors are forbidden unless function-arg injection demonstrably fails (Sprint 2 must surface this in writing if encountered; charter amendment required to switch).
- The injected `now` is monotone within a single replay (corpus event_time_ms increases as replay proceeds). The trajectory contract (Sprint 1) asserts this.

### 7.3 Backtest replay surface

Sprint 2 introduces (proposed names; Sprint 1 contract confirms):

- `scripts/corona-backtest/replay/<theatre>-replay.js` — instantiates the runtime theatre with injected clock, replays pre-cutoff bundles, returns a `PredictionTrajectory`.
- Replay determinism test: replay the same corpus event twice → byte-identical trajectory JSON. This test ships alongside Sprint 2 code.

---

## 8. Baseline policy (binding per Q6)

### 8.1 Two baselines, clearly separated and labeled

**Baseline A — Cycle-001 historical baseline (immutable):**

- T1 Brier = 0.1389 (uniform-prior over 6 buckets)
- T2 Brier = 0.1389 (uniform-prior over 6 buckets)
- T3 MAE = 6.760 h, ±6h hit rate = 40.0% (WSA-Enlil from corpus)
- T4 Brier = 0.1600 (uniform-prior over 5 buckets)
- T5 FP=25.0%, p50=90.0s, switch=100.0% (corpus_fp_label-anchored)
- Composite verdict = `fail`
- Anchor: corpus_hash `b1caef3f…11bb1` + script_hash `17f6380b…1730f1` + code_revision `cf489ee`

This baseline IS the run-3-final result. It is never compared against post-cycle-002 numerics directly, only documented as "historical-truth pre-runtime-wiring."

**Baseline B — Cycle-002 replay baseline (anchored at Sprint 3 close, before any parameter refit):**

- Produced by running the cycle-002 backtest with the runtime-replay scoring path on every uplift-counted theatre (T1 binary-Brier, T2 binary-Brier, T4 bucket-Brier with runtime trajectory) AT cycle-001 runtime parameter values. No parameter changes.
- T3 row is unchanged (still WSA-Enlil corpus scoring).
- T5 row is unchanged (still quality-of-behavior).
- Anchor: corpus_hash `b1caef3f…11bb1` (same — corpus frozen) + cycle-002 script_hash (new) + code_revision (cycle-002 Sprint 3 close)
- Recorded in `grimoires/loa/calibration/corona/cycle-002-run-1/` (NEW directory, naming TBD by Sprint 3) and anchored in the additive manifest from §6.

**Baseline B is the binding comparator for "calibration-improved" claims.** Any post-Sprint-3 score on T1/T2/T4 must beat Baseline B (lower Brier on the same frozen corpus) to qualify.

### 8.2 Reporting discipline

- **Never** compare Sprint-3-or-later T1/T2/T4 numerics against Baseline A as evidence of uplift. The scoring regimes are different (cycle-001 = uniform-prior; cycle-002 = runtime-replay binary-Brier or bucket-Brier-with-trajectory). Cross-regime comparison is meaningless.
- Reports MUST display Baseline A and Baseline B side-by-side with their respective scoring regimes named explicitly.
- Composite-verdict tables MUST NOT mix regimes silently. If a single table shows both, columns must be labeled `[corpus-uniform-prior cycle-001]` and `[runtime-replay cycle-002]`.

### 8.3 No-refit covenant

- No runtime parameter change is permitted between Sprint 3 close (Baseline B anchor) and Sprint 5 start (sensitivity-proof perturbation).
- Any incidental parameter touch in the interim (review feedback, etc.) requires re-anchoring Baseline B and a written note in the cycle-002 manifest.

---

## 9. T1/T2 scoring semantics decision (binding per Q7)

### 9.1 Posture

T1 and T2 are threshold-gate runtime markets emitting **scalar** `current_position` ∈ [0,1]. They are NOT 6-bucket distributions. Cycle-002 will NOT launder these scalars into fake 6-bucket distributions for scoring purposes. Instead, cycle-002 introduces a **threshold-native binary Brier** scoring path for T1 and T2.

### 9.2 What "threshold-native binary Brier" means

For each T1 (or T2) corpus event:

- Predicted: `p` = runtime trajectory's `current_position_at_cutoff` (scalar).
- Observed: `o` ∈ {0, 1} — 1 if the event's flare class (or peak Kp) crossed the gate's threshold, 0 otherwise. This binary outcome is derived from corpus settlement data, NOT from the 6-bucket label.
- Brier = `(p − o)²`.

This is the same formula already used by [src/rlmf/certificates.js:24](../../../../src/rlmf/certificates.js:24)'s `brierScoreBinary`. Cycle-002 explicitly does NOT share that runtime-cert function (per Q1: cert untouched); cycle-002 reimplements the binary-Brier formula in its own backtest scoring module to preserve the existing duplication discipline (operator hard constraint #5 / SDD §6.4).

### 9.3 What "legacy 6-bucket scoring" becomes

[t1-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t1-bucket-brier.js) and [t2-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t2-bucket-brier.js) stay in the codebase **unchanged**. Their role is recast:

- Cycle-001 reproducibility (re-run at corpus_hash + script_hash anchor).
- Corpus-uniform-prior baseline diagnostic for any cycle that wants to compare against the no-information floor.

These modules are NOT extended to consume runtime trajectories. The legacy 6-bucket framing is retained as a calibration-meaning artifact, not as a runtime-uplift scoring path.

### 9.4 The bucket-projection escape hatch (gated)

If a future sprint (cycle-002 or later) proposes a deterministic, defensible mapping from runtime evidence to a 6-bucket distribution (e.g., a parametric prior anchored in [empirical-evidence.md](../../../calibration/corona/empirical-evidence.md) literature), it may be added as a SEPARATE scoring path with these gates:

1. Written justification (literature anchor + numerical mapping spec).
2. Non-canonical until ratified by the operator with a charter amendment.
3. Reports tag bucket-projected scores `[bucket-projected; non-canonical]` until ratified.

This escape hatch is documented but NOT exercised in cycle-002 unless the operator explicitly opens it.

### 9.5 Outcome derivation contract

Sprint 1 must specify, in writing, the corpus → binary-outcome derivation function for T1 and T2:

- T1: `o = 1 iff event.flare_class_observed crosses threshold_class` (e.g., for T1 ≥ M1.0 gate, M5.7 → o=1; C9.4 → o=0).
- T2: `o = 1 iff max(event.kp_swpc_observed, event.kp_gfz_observed) ≥ kp_threshold` (existing GFZ-lag exclusion logic from corpus-loader applies).

These derivations are deterministic from existing corpus fields; they do NOT add new corpus annotations.

---

## 10. Success criteria ladder (BINDING)

Cycle-002 may earn each rung by meeting ALL conditions on that rung. Higher rungs do NOT skip lower rungs. Closeout language is bound to whichever rung the cycle has actually earned — overclaiming is forbidden per the cycle-001 honest-framing memory binding.

### Rung 1 — runtime-wired (minimum success)

**Earned when ALL of**:

- T4 backtest scoring consumes a `PredictionTrajectory` produced by replaying corpus events against the runtime [proton-cascade.js](../../../../src/theatres/proton-cascade.js) with deterministic clock injection.
- A non-trivial runtime-state change (e.g., flipping one ingested bundle's payload) produces a deterministic, non-zero delta in the cycle-002 backtest's per-theatre report numerics for T4.
- Replay-twice determinism test passes (byte-identical trajectory JSON).
- 160/160 existing tests still green; no new runtime dependencies; cycle-001 manifest unchanged.

**Closeout permission**: may say "cycle-002 wired runtime prediction trajectories into the T4 scoring path."
**Closeout prohibition**: may NOT say "calibration-improved."

### Rung 2 — runtime-sensitive (strong success)

**Earned when Rung 1 AND**:

- A controlled perturbation of T4 [PRODUCTIVITY_PARAMS](../../../../src/theatres/proton-cascade.js:101) (or another single T4 knob declared at Sprint 5 open per Q8) changes T4's cycle-002-replay Brier by a measurable, documented amount.
- Reverting the perturbation restores the prior T4 Brier byte-identically.
- Perturbation diff is documented in `cycle-002-run-N/` (with N reflecting the perturbation index) and tracked in the additive manifest from §6.
- corpus_hash invariant preserved across both directions of the test.

**Closeout permission**: may say "cycle-002 demonstrated harness sensitivity to runtime parameter changes for T4 (two-direction test green)."
**Closeout prohibition**: may NOT generalize to T1/T2 unless T1/T2 binary-runtime scoring landed AND a separate two-direction test on a T1/T2 knob was run.

### Rung 3 — calibration-improved (gated claim)

**Earned when Rung 2 AND**:

- T4 cycle-002-replay Brier on the frozen corpus, after a refit motivated by literature evidence, beats Baseline B (§8) — strictly less, with the diff captured in the manifest.
- (And/or, if T1/T2 binary-runtime scoring landed in Sprint 3 and is included in the uplift count) T1 and/or T2 binary-Brier on the frozen corpus beats their respective Baseline B numerics.
- Cycle-002 manifest re-anchored to post-refit script_hash; structural + regression gates green.
- Honest-framing grep gate clean across cycle-002 closeout artifacts (the cycle-001 grep pattern: `grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"` should return only NEGATIONS or zero matches outside the explicit "calibration-improved" claim sections).

**Closeout permission**: may say "T4 calibration-improved vs cycle-002 replay baseline" (or equivalent specific-theatre claim). Generic "calibration-improved" without a theatre qualifier is forbidden.

**Closeout prohibition**: may NOT extend the claim to T3 (WSA-Enlil-owned per Q2) or T5 (quality-of-behavior per Q3) under any circumstance.

### Rung 4 — L2 publish-ready (gated)

**Earned when Rung 3 AND ALL of**:

- Trajectory scoring landed (Sprint 3) for at least T4; T1/T2 if and only if binary-runtime scoring landed and is producing stable numerics.
- Deterministic replay landed (Sprint 2).
- Manifest/provenance updates ratified additively (§6).
- Honest theatre-specific settlement posture documented (§4 table) for T3 and T5; closeout document explicitly enumerates "T3 [external-model] not counted toward predictive uplift" and "T5 [quality-of-behavior] not counted toward predictive uplift."
- Downstream RLMF/Brier export implications accounted for (§5; cycle-002 closeout has a one-line "cert format unchanged in cycle-002" audit note).
- README + BUTTERFREEZONE.md updates (additive, cycle-002 sections only) reflect the L2-ready posture WITHOUT touching cycle-001 closeout language.
- Tag posture decided (v0.3.0 bump permissible at this rung; the bump itself is a Sprint 6 deliverable and requires a fresh annotated tag, not a re-tag).

**Closeout permission**: may say "L2 publish-ready" after listing the specific theatres carrying the claim and the specific Brier deltas vs Baseline B.

**Closeout prohibition**: may NOT use bare "L2 publish-ready" without the qualifying theatre list and the Baseline B comparison table.

### Rung-failure handling

If cycle-002 closes at Rung 1 or Rung 2:

- v0.2.x stays the published version. No version bump.
- Closeout language stays "calibration-attempted, not improved" with the explicit cycle-002 wiring + sensitivity addendum.
- Future cycles can re-attempt Rungs 3–4 from the cycle-002 wired baseline.

If a hard blocker appears mid-cycle (e.g., the replay-twice determinism test fails in a way Sprint 2 cannot resolve):

- Cycle-002 halts and produces a closeout doc explaining the blocker.
- No claim is made above Rung 0 ("cycle-002 attempted").
- The cycle-001 honest-framing memory binding governs that closeout.

---

## 11. Cross-references and what Sprint 1 must inherit

Sprint 1 (PredictionTrajectory contract) carries forward from this charter the following hard inputs:

- §4 theatre posture table is the canonical set of `distribution_shape` values.
- §5 RLMF non-goal forbids any contract field that requires runtime cert mutation.
- §7 replay-clock pattern dictates that the trajectory's `meta.replay_clock_source = 'corpus_event_time'` and that the contract include a determinism assertion.
- §9 binary-runtime scoring decision means the contract must accommodate `'binary_scalar'` shape natively, not as a degenerate of 6-bucket.

Sprint 1 may not introduce:

- A `'bucket_projected'` shape (closed by §9 escape hatch unless explicitly opened).
- A T3 CORONA-prediction shape (closed by Q2).
- A T5 probabilistic-uplift shape (closed by Q3).
- Any field that requires src/rlmf/certificates.js to read it (closed by Q1).

---

## 12. Sprint 0 closeout / non-implementation guarantees

Sprint 0 ships:

- This charter at `grimoires/loa/a2a/cycle-002/sprint-00/CHARTER.md` (the only file written by Sprint 0).

Sprint 0 does NOT ship:

- Any source-code change.
- Any test change.
- Any cycle-001 doc edit.
- Any cycle-001 manifest edit.
- Any cycle-001 corpus edit.
- Any cycle-001 sprint folder edit.
- Any cycle-002 manifest file (the additive file at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` is named here but NOT yet written; its first write is a Sprint 3 deliverable per §6).
- Any commit (operator decides commit timing per the cycle-001 HITL discipline binding).
- Any tag, release, or version bump.
- Any README or BFZ change.
- Any new dependency.

Sprint 0 exits when:

- Operator ratifies §3 (frozen artifact list) — or amends specific entries with explicit additions.
- Operator ratifies §4 (theatre posture table).
- Operator ratifies §10 (success criteria ladder).
- Operator confirms Sprint 1 may begin (or instructs further Sprint 0 work).

Sprint 0 does NOT exit on its own clock — the charter sits idle until the operator gives the explicit "Sprint 0 ratified, draft Sprint 1" signal.

---

*Charter authored 2026-05-01. cycle-002 Sprint 0. corpus_hash invariant `b1caef3f…11bb1` (cycle-001 anchor; preserved). No source changes. No test changes. No manifest writes. Operator gate pending.*
