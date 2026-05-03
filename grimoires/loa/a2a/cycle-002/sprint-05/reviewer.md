# Sprint 05 Implementation Report — T4 Two-Direction Sensitivity Proof (Path B, real runtime injection)

**Status**: Path B implementation complete; awaiting `/review-sprint sprint-05`.
**Authored**: 2026-05-02
**Cycle / Sprint**: cycle-002 / sprint-05
**Routing**: cycle-002 [SPRINT-LEDGER.md](../SPRINT-LEDGER.md) — operator ratification: no separate `SENSITIVITY-PROOF.md` spec; the binding spec is the existing cycle-002 document set + Sprint 05 review feedback (Path B authorized; one default-preserving `src/` edit at [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) authorized to expose a Wheatland-lambda injection seam).
**Predecessor commit**: `d93cada` (Sprint 04 commit on `main`).
**Working tree pre-sprint**: clean.

---

## Executive summary

Sprint 05 lands the **two-direction T4 sensitivity proof** that earns Rung 2 (`runtime-sensitive`) per [CHARTER §10](../sprint-00/CHARTER.md). The proof is now via **real runtime injection** (Path B): a controlled perturbation of one T4 runtime parameter (`PRODUCTIVITY_PARAMS lambda` × 1.25 — the Wheatland productivity scalar at [src/theatres/proton-cascade.js:101–105](../../../../src/theatres/proton-cascade.js)) flows **through** the cycle-002 replay path **before** the runtime function is called, **changes the runtime's actual trajectory output** including post-event blending, and is **byte-identically reversible**.

| Direction | Mechanism | T4 Brier | Δ vs Baseline B | Trajectory hashes |
|---|---|---|---|---|
| Baseline B (cycle-002-run-1) | Sprint 03 anchor, lambdaScalar implicit 1.0 | `0.38183588` | `+0.00000000` | Sprint 03 anchor (`16c6…`, `839f…`, `7a43…`, `2815…`, `c1ca…`) |
| Direction A (cycle-002-run-2) | `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })` — perturbation flows runtime path | `0.39533664` | `+0.01350076` | All five differ from Baseline B (perturbation observable) |
| Direction B (cycle-002-run-3) | `replay_T4_event(event, ctx, { lambdaScalar: 1.0 })` — default-preserving | `0.38183588` | `+0.00000000` | All five **byte-identical** to Baseline B trajectory hashes |

**Direction A IS true harness sensitivity**, not scorer-only sensitivity:
- The `lambdaScalar` argument flows: `replay_T4_event` → `createProtonEventCascade({...}, { now, lambdaScalar })` → `estimateExpectedCount(triggerClass, windowHours, lambdaScalar)` → `lambda = params.lambda * lambdaScalar`. The line-by-line trace is in [src/theatres/proton-cascade.js:114–138](../../../../src/theatres/proton-cascade.js) (perturbed `estimateExpectedCount`) and [scripts/corona-backtest/replay/t4-replay.js:71–144](../../../../scripts/corona-backtest/replay/t4-replay.js) (perturbed createX call).
- Every `processProtonEventCascade` qualifying-event blend at [src/theatres/proton-cascade.js:382–386](../../../../src/theatres/proton-cascade.js) uses `theatre.productivity.expected_count` — which was set by createProtonEventCascade with the perturbed lambda. The perturbation propagates through the full runtime path, not just the prior step.
- Scoring at [tests/sensitivity-proof-T4-test.js — runT4Direction](../../../../tests/sensitivity-proof-T4-test.js) calls `scoreEventT4(event, trajectory.current_position_at_cutoff)` — consuming the **runtime's actual trajectory output**, with no post-runtime distribution substitution. The previous engineer-feedback's adversarial gate ("scoring must consume that trajectory output directly") is satisfied verbatim.
- The "scoring consumes the runtime trajectory output directly" gate is asserted programmatically: the test re-invokes `replay_T4_event` and asserts `e.predicted_distribution_from_trajectory === traj.current_position_at_cutoff` and `reScore.brier_score === e.brier_score`.

**Direction B byte-identity is a stronger guarantee than before**: the test now asserts not only that aggregate Brier matches `0.38183588` byte-identically, but that **all five per-event trajectory_hash values byte-identically match the cycle-002-run-1 T4 anchor** stored in [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json](../../../../grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json) entries. Since `trajectory_hash` is computed over the entire trajectory's canonical JSON (CONTRACT §10), this proves every trajectory field including `current_position_at_cutoff` is byte-identical — meaning the Sprint 05 `src/` edit + replay-seam edit is genuinely default-preserving.

**Frozen invariants — all preserved.** `scripts/corona-backtest.js` sha256 = `17f6380b…1730f1` ✓. cycle-001 calibration-manifest.json sha256 = `e53a40d1…5db34a` ✓. corpus_hash = `b1caef3f…11bb1` (run-1, run-2, run-3) ✓. cycle-002-run-1 directory artifacts byte-identically preserved ✓. `src/rlmf/certificates.js` zero diff ✓. T1/T2/T3/T5 behavior unchanged ✓. PRODUCTIVITY_PARAMS literal values unchanged (no-refit covenant CHARTER §8.3) ✓. package version `0.2.0` ✓. Dependencies `{}` ✓.

**replay_script_hash drifted honestly** (operator-authorized per Sprint 05 review #6). Sprint 03 anchor: `bfbfd70d…380a60`. Post-Sprint-05: `a919ec7d…40940b`. The Sprint 03 anchor value is preserved verbatim in [grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt](../../../../grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt) (cycle-002-run-1 directory not mutated); the new value is recorded honestly in the manifest's `sensitivity_proof.provenance.replay_script_hash_at_sprint_05` field, and run-2/run-3 directories carry the new hash because they were generated under post-Sprint-05 code.

**`src/theatres/proton-cascade.js` is the one and only `src/` file modified** (`+27 / -5` lines, additive option-bag plumbing); operator authorization explicitly granted in the Sprint 05 review. The file's sha256 (`095ef077…d38d549`) is recorded in the manifest's `sensitivity_proof.provenance.src_theatres_proton_cascade_hash_at_sprint_05` field.

**No source/runtime mutation of literal parameters; no calibration claim; no L2-publish claim; no version bump; no tag; no README/BFZ/Sprint 06 work.** Sprint 05 remains a sensitivity proof. The no-refit covenant ([CHARTER §8.3](../sprint-00/CHARTER.md)) holds across the full duration.

Test totals: **296 pass / 0 fail / 0 skip** (Sprint 04 baseline 279 + 17 sensitivity-proof tests, replacing the prior 14 with 3 additional gates required by the Path B review).

---

## AC Verification

The binding Sprint 05 spec is the existing cycle-002 document set + Sprint 05 review's Path B requirements. Acceptance criteria below quote the spec / review verbatim.

| # | AC (verbatim) | Status | Evidence |
|---|---------------|--------|----------|
| AC-1 | Review #2: "Direction A must perturb the T4 runtime parameter before or during the runtime replay path, not after runtime output is produced." | ✓ Met | `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })` is invoked at [tests/sensitivity-proof-T4-test.js — runT4Direction line "const trajectory = replay_T4_event(event, ctx, { lambdaScalar })"](../../../../tests/sensitivity-proof-T4-test.js). `lambdaScalar` flows into `createProtonEventCascade` ([scripts/corona-backtest/replay/t4-replay.js — `{ now, lambdaScalar }` option-bag line](../../../../scripts/corona-backtest/replay/t4-replay.js)) and from there into `estimateExpectedCount(triggerClass, windowHours, lambdaScalar)` at [src/theatres/proton-cascade.js — estimateExpectedCount call inside createProtonEventCascade](../../../../src/theatres/proton-cascade.js). The perturbation reaches the runtime BEFORE the trajectory is produced. |
| AC-2 | Review #2: "scoring must consume that trajectory output directly. It must not consume a hand-computed test-side replacement distribution." | ✓ Met | At [tests/sensitivity-proof-T4-test.js — runT4Direction loop](../../../../tests/sensitivity-proof-T4-test.js), scoring is `scoreEventT4(event, trajectory.current_position_at_cutoff)`. The test does NOT compute any substitute distribution. Programmatic gate "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" re-invokes `replay_T4_event` independently and asserts `predicted_distribution_from_trajectory === traj.current_position_at_cutoff` and `reScore.brier_score === e.brier_score`. The previous test's `perturbedT4Distribution` / `estimateExpectedCountPerturbed` / `countToBucketProbabilities` / `poissonPMF` test-side reimplementations are **deleted entirely** from the test file. |
| AC-3 | Review #1.1: "Remove or retire the test-side pattern where Direction A: calls dispatchCycle002Replay; discards runtime current_position_at_cutoff; substitutes perturbedT4Distribution(...)" | ✓ Met (removed) | The previous test's `perturbedT4Distribution`, `estimateExpectedCountPerturbed`, `countToBucketProbabilities`, `poissonPMF`, `logFactorial`, `brierEventT4`, `computeT4Direction_A` (post-substitution variant) are deleted. New `runT4Direction({ lambdaScalar })` calls real runtime + real scorer only. |
| AC-4 | Review #2: "Add a real default-preserving injection seam: optional T4 productivity / lambda scalar passed through the runtime/replay context" | ✓ Met | [src/theatres/proton-cascade.js — createProtonEventCascade option-bag with lambdaScalar default 1.0](../../../../src/theatres/proton-cascade.js). [scripts/corona-backtest/replay/t4-replay.js — replay_T4_event third arg `options = {}` with `{ lambdaScalar = 1.0 } = options`](../../../../scripts/corona-backtest/replay/t4-replay.js). Both default 1.0; live runtime (cycle-002 entrypoint and existing test fixtures) never supply the option, so `lambdaScalar` defaults to 1.0 and the math becomes `params.lambda * 1.0 === params.lambda` (IEEE-754 byte-identical). |
| AC-5 | Review #2: "default must preserve current behavior byte-for-byte" | ✓ Met | Direction B byte-identity gate ("Direction B (lambdaScalar=1.0): trajectory_hashes byte-identical to cycle-002-run-1 anchor") asserts deepStrictEqual of all five per-event trajectory hashes against the on-disk cycle-002-run-1 T4 anchor. Trajectory_hash captures the entire trajectory canonical JSON including `current_position_at_cutoff`; equality of the hash implies equality of every field. All 279 pre-existing tests stay green (T4 trajectory shape, determinism, scored-through-runtime-bucket, RLMF-cert non-mutation, cycle-002-entrypoint replay-twice, etc.) — none of these tests pass `lambdaScalar`, and they remain green, proving default-preservation. |
| AC-6 | Review #2: "perturbation value for Direction A: lambda × 1.25" | ✓ Met | `PERTURBATION_LAMBDA_SCALAR = 1.25` in [tests/sensitivity-proof-T4-test.js](../../../../tests/sensitivity-proof-T4-test.js). |
| AC-7 | Review #2: "Direction B must use the default/unperturbed path" | ✓ Met | `runT4Direction({ lambdaScalar: 1.0, label: 'B' })` — the option-bag default, byte-identical to omitting the option. |
| AC-8 | Review #3: "`replay_T4_event` must pass the perturbation into the T4 runtime function" | ✓ Met | [scripts/corona-backtest/replay/t4-replay.js — `{ now, lambdaScalar }` passed into `createProtonEventCascade`](../../../../scripts/corona-backtest/replay/t4-replay.js). |
| AC-9 | Review #3: "the resulting PredictionTrajectory.current_position_at_cutoff must change under Direction A" | ✓ Met | "Direction A: runtime trajectory current_position_at_cutoff differs from Baseline B at ≥1 event" test. Empirical: per-event predicted distributions (recorded in [run-2 sensitivity-summary.md per-event table](../../../../grimoires/loa/calibration/corona/cycle-002-run-2/sensitivity-summary.md)) show: T4-2022-01-20-S1 distribution `[0,0,0.001,0.032,0.967]` (Direction A) vs `[0,0,0.011,0.141,0.847]` (Baseline B) — different. T4-2024-05-15-S1 `[0,0,0.001,0.025,0.974]` (A) vs `[0,0,0.006,0.093,0.901]` (B) — different. All five trajectory_hashes differ from Baseline B's. |
| AC-10 | Review #3: "scoring must consume that trajectory output directly" | ✓ Met | Same as AC-2; programmatic gate "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" verifies. |
| AC-11 | Review #4: "Direction B must run the unperturbed cycle-002 replay path" | ✓ Met | Direction B calls `replay_T4_event` with `lambdaScalar=1.0` (option-bag default). Additionally, the gate "Baseline B anchor (cycle-002-run-1): cycle-002 dispatch produces T4 Brier 0.38183588 byte-identically" calls `dispatchCycle002Replay({ theatres: ['T4'] })` directly (live entrypoint, no lambdaScalar) and asserts the Brier matches Baseline B byte-identically — proving the live entrypoint path itself is unperturbed. |
| AC-12 | Review #4: "Direction B T4 Brier must restore Baseline B byte-identically: 0.38183588" | ✓ Met | `assert.strictEqual(directionB.brier, BASELINE_B_T4_BRIER)` test passes. Recorded in run-3 sensitivity-summary.md: `T4 Brier (this direction): 0.38183588`, `Delta vs Baseline B: +0.00000000`. |
| AC-13 | Review #5: T4 only | ✓ Met | All `dispatchCycle002Replay` and `loadCorpusWithCutoff` calls in the test pass `theatres: ['T4']`. T1/T2/T3/T5 not exercised. |
| AC-14 | Review #5: no T1/T2/T3/T5 sensitivity proof, no parameter refit, no calibration-improved claim, no L2-publish claim | ✓ Met (negative) | reviewer.md uses "Rung 2 (runtime-sensitive)" only; no "calibration-improved" / "L2-publish" / "uplift demonstrated" verbiage. PRODUCTIVITY_PARAMS literal values unchanged. |
| AC-15 | Review #5: no README/BFZ/version/tag/Sprint 06 work | ✓ Met (negative) | `git status` shows no README, no BFZ, no tag. `package.json` version `0.2.0`. No `grimoires/loa/a2a/cycle-002/sprint-06/`. |
| AC-16 | Review #6: "If changing covered replay files changes replay_script_hash, update the cycle-002 manifest honestly" | ✓ Met | New replay_script_hash `a919ec7d3f472f65435b0e6bec9b2c4e082e40186ceecc8921b527013470940b` recorded in `manifest.sensitivity_proof.provenance.replay_script_hash_at_sprint_05`. Sprint 03 anchor preserved at `manifest.sensitivity_proof.provenance.replay_script_hash_at_sprint_03_anchor`. Drift reason documented in `manifest.sensitivity_proof.provenance.replay_script_hash_drift_reason`. The on-disk cycle-002-run-1 directory's `replay_script_hash.txt` is preserved verbatim with the Sprint 03 anchor value. The test gate "replay_script_hash drifted honestly: Sprint 03 anchor preserved historically; current code recorded post-Sprint-05" asserts this structurally. |
| AC-17 | Review #6: "If `src/theatres/proton-cascade.js` becomes part of the sensitivity proof dependency, add an explicit provenance field for it" | ✓ Met | `manifest.sensitivity_proof.provenance.src_theatres_proton_cascade_hash_at_sprint_05` records `095ef077541ba0bfc994b253d0c1572abbd0479db10e2de7e06ddd1e0d38d549` (current sha256). `src_theatres_proton_cascade_dependency_note` explains why this file is now a dependency. The test gate "src/theatres/proton-cascade.js dependency tracked in manifest provenance" asserts it. |
| AC-18 | Review #6: "Existing Sprint 03 run-1 evidence must remain historically preserved. Do not mutate cycle-001 artifacts." | ✓ Met | Test gate "cycle-002-run-1 directory artifacts NOT mutated (Sprint 03 anchor preserved)" reads each cycle-002-run-1 file and asserts each contains the Sprint 03 anchor value. cycle-001 calibration-manifest.json sha256 `e53a40d1…5db34a` unchanged (verified). |
| AC-19 | Review #7: "Direction A runtime trajectory current_position_at_cutoff differs from Baseline B T4 trajectory" | ✓ Met | "Direction A: runtime trajectory current_position_at_cutoff differs from Baseline B at ≥1 event" test asserts trajectory_hash differs for ≥1 event. Empirically all 5 differ; the gate is set to ≥1 to remain meaningful even if some events saturate. |
| AC-20 | Review #7: "Direction A T4 Brier differs from Baseline B by a documented measurable delta" | ✓ Met | Direction A Brier `0.39533664` − Baseline B `0.38183588` = `+0.01350076` (~3.5% relative). `PERTURBATION_MAGNITUDE_MIN = 0.01` floor; gate `delta >= 0.01` passes. |
| AC-21 | Review #7: "Direction A scoring consumes the perturbed runtime trajectory output directly" | ✓ Met | Same as AC-2 / AC-10. |
| AC-22 | Review #7: "Direction B runtime trajectory current_position_at_cutoff is byte-identical to Baseline B T4 trajectory" | ✓ Met | "Direction B: trajectory_hashes byte-identical to cycle-002-run-1 anchor" test deepStrictEqual gate. trajectory_hash equality implies trajectory canonical-JSON equality, which implies current_position_at_cutoff equality. |
| AC-23 | Review #7: "Direction B T4 Brier is byte-identical to Baseline B" | ✓ Met | `assert.strictEqual(directionB.brier, BASELINE_B_T4_BRIER)` gate. |
| AC-24 | Review #7: "corpus_hash invariant preserved across run-1/run-2/run-3" | ✓ Met | "corpus_hash unchanged across run-1, run-2, run-3" test reads each run dir's `corpus_hash.txt` and asserts strict equality with `b1caef3f…11bb1`. |
| AC-25 | Review #7: "replay determinism preserved" | ✓ Met | "Direction A: replay-twice byte-identical determinism" + "Direction B: replay-twice byte-identical determinism" tests. Each direction's runT4Direction is invoked twice; aggregate Brier, per-event distributions, per-event Brier, and per-event trajectory_hashes are all asserted strict-equal across the two passes. |
| AC-26 | Review #7: "cycle-001 manifest remains untouched" | ✓ Met | "cycle-001 calibration-manifest.json sha256 unchanged" gate asserts sha256 = `e53a40d1…5db34a`. |
| AC-27 | Review #7: "scripts/corona-backtest.js remains byte-frozen" | ✓ Met | "scripts/corona-backtest.js sha256 unchanged" gate asserts sha256 = `17f6380b…1730f1`. |
| AC-28 | Review #8: only one `src/` file edited | ✓ Met | `git status --short src/` shows only `src/theatres/proton-cascade.js` modified. `git diff --stat src/` reports `1 file changed`. |
| AC-29 | Review #8: injection seam is default-preserving | ✓ Met | Direction B byte-identity (Brier + trajectory hashes) demonstrated programmatically. All 279 pre-existing tests still green. |
| AC-30 | Review #8: default T4 runtime output unchanged | ✓ Met | Same as AC-29; pre-existing T4 trajectory tests in `tests/replay-trajectory-shape-T4-test.js`, `tests/replay-determinism-T4-test.js`, `tests/replay-T4-scored-through-runtime-bucket-test.js` (none of which pass `lambdaScalar`) all remain green. |
| AC-31 | Review #8: Direction A still requires post-runtime distribution substitution → forbidden | ✓ Met (negative) | Direction A has zero post-runtime substitution. The previous test's substitution helpers are deleted from the file. |
| AC-32 | Review #8: T1/T2/T3/T5 enter the sensitivity proof → forbidden | ✓ Met (negative) | All replay calls limited to `theatres: ['T4']`. |
| AC-33 | Review #8: RLMF certificate behavior changes → forbidden | ✓ Met (negative) | `git diff src/rlmf/certificates.js` returns empty. |
| AC-34 | Review #8: new dependencies appear necessary → forbidden | ✓ Met (negative) | `package.json` dependencies `{}`. |
| AC-35 | Review #8: cycle-001 manifest mutation appears necessary → forbidden | ✓ Met (negative) | sha256 unchanged. |
| AC-36 | Review #8: `scripts/corona-backtest.js` edit appears necessary → forbidden | ✓ Met (negative) | sha256 unchanged. |

Result: **36 / 36 ACs met**. No partials, no deferrals.

---

## Tasks completed

### T1 — Default-preserving runtime injection seam (`src/theatres/proton-cascade.js`)

**Path**: [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js).

**Edit** (`+27 / -5` lines, additive option-bag plumbing only):
- `estimateExpectedCount(triggerClass, windowHours)` → `estimateExpectedCount(triggerClass, windowHours, lambdaScalar = 1.0)`. The math becomes `params.lambda * lambdaScalar * intensityMultiplier * (1 - decay^days) / (1 - decay)`. For default `lambdaScalar = 1.0`, IEEE-754 guarantees `params.lambda * 1.0 === params.lambda` and the rest is byte-identical to pre-Sprint-05.
- `createProtonEventCascade({...}, { now })` → `createProtonEventCascade({...}, { now, lambdaScalar = 1.0 })`. The option flows from the second-arg option-bag into `estimateExpectedCount`.
- JSDoc comments document the seam, citing CYCLE-002-SPRINT-PLAN.md §4.3.1 lines 449–451 as the authorization frame and CHARTER §8.3 (no-refit covenant) as the binding constraint.

**Default-preservation invariant**: When `lambdaScalar = 1.0` is supplied (or the default applies), every IEEE-754 floating-point operation produces bit-identical output to pre-Sprint-05. Verified by:
- All 279 pre-existing tests (which never pass `lambdaScalar`) remain green.
- Direction B trajectory_hash byte-identity to cycle-002-run-1 anchor (5/5 events).
- Direction B aggregate Brier byte-identical to Baseline B (`0.38183588`).

**No parameter refit**: PRODUCTIVITY_PARAMS literal values (X_class lambda=8 decay=0.85, M_class lambda=4 decay=0.90, default lambda=3 decay=0.92) are byte-unchanged. The seam scales at call time; it does not mutate the `const` table.

### T2 — Replay-seam forwarding (`scripts/corona-backtest/replay/t4-replay.js`)

**Path**: [scripts/corona-backtest/replay/t4-replay.js](../../../../scripts/corona-backtest/replay/t4-replay.js).

**Edit** (`+12 / -1` lines, additive third-arg plumbing only):
- `replay_T4_event(corpus_event, ctx)` → `replay_T4_event(corpus_event, ctx, options = {})`. `options.lambdaScalar` defaults to `1.0`.
- The `lambdaScalar` is forwarded into `createProtonEventCascade({...}, { now, lambdaScalar })`.
- JSDoc documents the seam and confirms: the cycle-002 entrypoint at [scripts/corona-backtest-cycle-002.js — calls to replay_T4_event](../../../../scripts/corona-backtest-cycle-002.js) does NOT supply `options`, so the live cycle-002 replay path always operates with `lambdaScalar = 1.0` (default-preserving).

**Provenance impact**: This file is in the cycle-002 `replay_script_hash` file set ([cycle-002 manifest replay_script_hash_files](../../../../grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json)). The modification changes its sha256, hence the aggregate `replay_script_hash`. Sprint 03 anchor: `bfbfd70d…380a60`. Post-Sprint-05: `a919ec7d…40940b`. The drift is honestly recorded in the manifest's `sensitivity_proof.provenance` block per Sprint 05 review #6. The historical Sprint 03 anchor value remains in [grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt](../../../../grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt) (cycle-002-run-1 directory not mutated).

### T3 — Sensitivity-proof test rewrite (`tests/sensitivity-proof-T4-test.js`)

**Path**: [tests/sensitivity-proof-T4-test.js](../../../../tests/sensitivity-proof-T4-test.js).

**Removed** (the prior post-runtime-substitution mechanism):
- `perturbedT4Distribution`, `estimateExpectedCountPerturbed`, `countToBucketProbabilities`, `poissonPMF`, `logFactorial`, `brierEventT4` — all test-side reimplementation of runtime math is **deleted**. The new test imports the real scorer from [scripts/corona-backtest/scoring/t4-bucket-brier.js — scoreEventT4 export](../../../../scripts/corona-backtest/scoring/t4-bucket-brier.js).
- The prior `computeT4Direction_A` (which substituted distributions after runtime invocation) is replaced.

**Added**:
- `runT4Direction({ lambdaScalar, label })`: loads T4 corpus events, creates replay context, calls `replay_T4_event(event, ctx, { lambdaScalar })`, scores via `scoreEventT4(event, trajectory.current_position_at_cutoff)`. Records `predicted_distribution_from_trajectory` (a copy of the runtime's actual `current_position_at_cutoff`, NOT a substitute) for audit purposes.
- New gate: "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" — re-invokes `replay_T4_event` independently and asserts `predicted_distribution_from_trajectory === traj.current_position_at_cutoff` and `reScore.brier_score === e.brier_score`. This is the binding programmatic proof that scoring uses the runtime path's output.
- New gate: "Direction A (lambdaScalar=1.25): runtime trajectory current_position_at_cutoff differs from Baseline B at ≥1 event" — asserts perturbation is observable.
- New gate: "cycle-002-run-1 directory artifacts NOT mutated (Sprint 03 anchor preserved)" — explicitly verifies the historical run-1 directory is untouched.
- New gate: "replay_script_hash drifted honestly" — verifies the Sprint 03 anchor is preserved in cycle-002-run-1 directory + the post-Sprint-05 hash is recorded in the manifest's `sensitivity_proof.provenance` + run-2/run-3 record the post-Sprint-05 hash.
- New gate: "src/theatres/proton-cascade.js dependency tracked in manifest provenance" — verifies the dependency is recorded.
- New gate: "cycle-002 manifest top-level run-1 anchor fields preserved verbatim" — verifies the Sprint 03 anchor's top-level fields (run_id, corpus_hash, cycle_001_script_hash, replay_script_hash, T4 anchor entry brier and trajectory_hashes) are byte-identical to the pre-sprint state.

**Test count delta**: 17 sensitivity-proof tests (was 14 before review). Old + new structure: 8 in "T4 sensitivity proof" describe block + 9 in "frozen invariants" describe block.

### T4 — Direction A artifact set (`cycle-002-run-2/`)

**Path**: [grimoires/loa/calibration/corona/cycle-002-run-2/](../../../../grimoires/loa/calibration/corona/cycle-002-run-2/).

**Files**:
- `corpus_hash.txt` — `b1caef3f…11bb1` (frozen invariant; same as run-1).
- `replay_script_hash.txt` — `a919ec7d3f472f65435b0e6bec9b2c4e082e40186ceecc8921b527013470940b` (post-Sprint-05 hash; **differs** from run-1 because run-2 was generated under post-Sprint-05 code).
- `cycle_001_script_hash.txt` — `17f6380b…1730f1` (frozen invariant).
- `sensitivity-summary.md` — Direction A: aggregate Brier `0.39533664`, delta `+0.01350076`, lambda scalar `1.25`, mechanism documentation, per-event Brier table with predicted distributions and trajectory hashes, honest framing block.

### T5 — Direction B artifact set (`cycle-002-run-3/`)

**Path**: [grimoires/loa/calibration/corona/cycle-002-run-3/](../../../../grimoires/loa/calibration/corona/cycle-002-run-3/).

Same artifact set. Direction B: aggregate Brier `0.38183588` (byte-identical to Baseline B), delta `+0.00000000`, lambda scalar `1.0` (default-preserving). Per-event Brier and trajectory_hash values byte-identically reproduce cycle-002-run-1's T4 anchor.

### T6 — Cycle-002 manifest extension

**Path**: [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json](../../../../grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json).

**Edit**: additive `sensitivity_proof` block (replacing the previous Sprint 05 iteration's block). Top-level Sprint 03 anchor fields (`run_id` = `cycle-002-run-1`, `generated_at`, `corpus_hash`, `cycle_001_script_hash`, `replay_script_hash` = Sprint 03 anchor value, `replay_script_hash_files`, `theatre_posture`, `runtime_uplift_composite_membership`, `entries[]`) preserved verbatim.

**`sensitivity_proof` sub-blocks** (Path B schema):
- `sprint`: `cycle-002/sprint-05`
- `earned_rung`: `Rung 2 (runtime-sensitive)` — now valid under strict reading because perturbation flows the runtime path.
- `operator_authorization`: documents the Path B authorization, scope (one src/ file, default-preserving, no other src/ change, no RLMF/T1/T2/T3/T5/PRODUCTIVITY_PARAMS literal change).
- `perturbation`: knob = `PRODUCTIVITY_PARAMS lambda`, scalar = `1.25`, mechanism = "Real runtime injection. Direction A passes lambdaScalar=1.25 to replay_T4_event's third options arg. The option flows: replay_T4_event → createProtonEventCascade(...) → estimateExpectedCount(...) → lambda = params.lambda * lambdaScalar. ... NO post-runtime distribution substitution." `reverted_in_direction_B: true`. `reversibility_proof` cites Direction B byte-identity gates.
- `baseline_B`: `{ run_id, t4_brier, t4_trajectory_hashes }` — the cycle-002-run-1 anchor's T4 hashes are quoted explicitly so future sprints can compare.
- `direction_A`: run-2 anchor with delta_vs_baseline_B label, per_event_brier map, trajectory_hashes (post-perturbation), `trajectory_hashes_differ_from_baseline_B: true` flag.
- `direction_B`: run-3 anchor with `byte_identical_to_baseline_B: true` and trajectory_hashes (which match Baseline B's verbatim).
- `invariants_verified`: nine flags all `true` — corpus_hash, cycle_001_script_hash, cycle_001_manifest_hash, cycle_002_run_1_artifacts_preserved, no_t1_t2_t3_t5_perturbation, no_rlmf_certificate_change, no_dependency_change, package_version_unchanged.
- `provenance`: code revision, corpus_hash, cycle_001_script_hash, **`replay_script_hash_at_sprint_05`** (current code: `a919ec7d…40940b`), **`replay_script_hash_at_sprint_03_anchor`** (historical: `bfbfd70d…380a60`), **`replay_script_hash_drift_reason`** (Sprint 05 added default-preserving option-bag forwarding through t4-replay.js), **`src_theatres_proton_cascade_hash_at_sprint_05`** (`095ef077…d38d549`), **`src_theatres_proton_cascade_dependency_note`** (Path B authorization, default-preserving, no PRODUCTIVITY_PARAMS literal change).

### T7 — npm test wiring

**Path**: [package.json:18](../../../../package.json).

**Edit**: appended `tests/sensitivity-proof-T4-test.js` to the `node --test` script (carried forward from prior Sprint 05 iteration).

**No version bump**: `package.json:3` `"version": "0.2.0"` unchanged.
**No new dependencies**: `package.json` `dependencies` field is `{}` unchanged.

---

## Direct answers to the operator's required reports

| Item | Result |
|---|---|
| `npm test` ran | ✓ |
| New test total | **296 pass / 0 fail / 0 skip** (was 279; +17 sensitivity tests) |
| Changed files | (a) `src/theatres/proton-cascade.js` (M, `+27 / -5`); (b) `scripts/corona-backtest/replay/t4-replay.js` (M, `+12 / -1`); (c) `tests/sensitivity-proof-T4-test.js` (M, full rewrite); (d) `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (M, sensitivity_proof block updated); (e) `grimoires/loa/calibration/corona/cycle-002-run-2/{corpus_hash.txt, replay_script_hash.txt, cycle_001_script_hash.txt, sensitivity-summary.md}` (M for the file types not changing, sensitivity-summary.md content updated); (f) `grimoires/loa/calibration/corona/cycle-002-run-3/{...}` same; (g) `package.json` (M, test script wiring; carry-forward); (h) `grimoires/loa/a2a/cycle-002/sprint-05/reviewer.md` (M, this file); (i) `grimoires/loa/a2a/cycle-002/sprint-05/engineer-review-response.md` (NEW). |
| Exact `src/` diff | `src/theatres/proton-cascade.js` is the **only** `src/` file modified. `git diff --stat src/` reports `1 file changed, 27 insertions(+), 5 deletions(-)`. `src/rlmf/certificates.js`, all of `src/oracles/`, `src/processor/`, `src/index.js`: zero diff. |
| Baseline B T4 Brier | `0.38183588` (cycle-002-run-1 anchor; matches `manifest.entries[id=cycle-002-t4-runtime-replay-anchor].brier`). |
| Direction A T4 Brier and delta | Brier `0.39533664`. Delta vs Baseline B = `+0.01350076` absolute (~3.5% relative). Above the documented `PERTURBATION_MAGNITUDE_MIN = 0.01` floor. |
| Direction B T4 Brier and byte-identity result | Brier `0.38183588`. Byte-identical to Baseline B (verified by `assert.strictEqual` IEEE-754 equality). All five per-event trajectory_hash values byte-identically match the cycle-002-run-1 T4 anchor (verified by `deepStrictEqual`). |
| Whether Direction A scoring now consumes runtime trajectory output directly | **Yes.** Scoring is `scoreEventT4(event, trajectory.current_position_at_cutoff)` where `trajectory` is the actual runtime output from `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })`. Programmatic gate "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" verifies by re-invoking the runtime and asserting equality. No test-side hand-computed distribution is used in scoring. |
| Replay_script_hash / provenance changes | Sprint 03 anchor `bfbfd70d…380a60` is preserved in cycle-002-run-1/replay_script_hash.txt (historical). Post-Sprint-05 hash `a919ec7d…40940b` recorded in `manifest.sensitivity_proof.provenance.replay_script_hash_at_sprint_05` + run-2/run-3 directories. New dependency: `src/theatres/proton-cascade.js` sha256 `095ef077…d38d549` recorded in `manifest.sensitivity_proof.provenance.src_theatres_proton_cascade_hash_at_sprint_05`. Drift reason and dependency note documented in adjacent fields. |

---

## Frozen-invariant verification (operator-binding hashes)

| Invariant | Expected sha256 | Actual sha256 | Status |
|---|---|---|---|
| scripts/corona-backtest.js | `17f6380b…1730f1` | `17f6380b…1730f1` | ✓ Preserved (cycle-001 entrypoint frozen by construction; never touched). |
| cycle-001 calibration-manifest.json | `e53a40d1…5db34a` | `e53a40d1…5db34a` | ✓ Preserved. |
| corpus_hash | `b1caef3f…11bb1` | `b1caef3f…11bb1` | ✓ Preserved across run-1/2/3. |
| Sprint 03 replay_script_hash anchor (in cycle-002-run-1/) | `bfbfd70d…380a60` | `bfbfd70d…380a60` | ✓ Preserved (run-1 directory not mutated). |
| **NEW**: post-Sprint-05 replay_script_hash | n/a | `a919ec7d…40940b` | Recorded honestly in manifest provenance. |
| **NEW**: src/theatres/proton-cascade.js sha256 | n/a | `095ef077…d38d549` | Recorded as new sensitivity-proof dependency. |

All four operator-binding invariants verified by both (a) automated tests in `tests/sensitivity-proof-T4-test.js`, and (b) on-disk re-verification via `openssl dgst -sha256` at Sprint 05 close.

---

## What changed vs the prior Sprint 05 iteration

| Aspect | Iteration 1 (post-runtime substitution, REJECTED) | Iteration 2 (Path B, this) |
|---|---|---|
| Mechanism | Test-side substitute predicted distribution AFTER runtime | Real runtime injection BEFORE runtime call |
| `src/` changes | None | `src/theatres/proton-cascade.js` (+27/-5, default-preserving) |
| `replay_script_hash` | Unchanged at Sprint 03 anchor | Drifted to post-Sprint-05 value (recorded honestly) |
| Direction A trajectory | Discarded | Consumed directly |
| Direction A Brier | `0.39575288` (test-side prior-only) | `0.39533664` (full perturbed runtime path) |
| Direction A → B reversibility | Different mechanism per direction | Same code path; only `lambdaScalar` differs |
| Adversarial test ("could pass even if runtime ignored PRODUCTIVITY_PARAMS?") | YES (failure) | NO — Direction B byte-identity to cycle-002-run-1 trajectory hashes proves the runtime exercised PRODUCTIVITY_PARAMS |
| Earns Rung 2 under strict reading? | NO (only scoring-path sensitivity) | YES (full harness sensitivity through runtime path) |

The previous iteration's empirical Direction A Brier `0.39575288` is now superseded by `0.39533664`. The new value reflects the correct full perturbed runtime path including the `processProtonEventCascade` qualifying-event blend (which uses the perturbed prior's `expected_count` field). The previous test missed this blend — it only perturbed the prior step and ignored the post-event evolution.

---

## Honest framing — preserved cycle-002 disciplines

- Sprint 05 is a **measurement-seam** sprint earning Rung 2. It is not a parameter-refit sprint, not a calibration-improved claim, not L2 publish-ready, not a release-hygiene sprint.
- T4 is the clean owned-uplift theatre; T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape (Sprint 02 honest-framing disclosure carries forward verbatim, unchanged by Sprint 05).
- T3 `[external-model]` and T5 `[quality-of-behavior]` postures from Sprint 04 hold verbatim. Sprint 05 does not touch them.
- The `lambdaScalar` injection seam in `src/theatres/proton-cascade.js` is **default-preserving plumbing** for sensitivity testing only. The live runtime path never supplies the option; `PRODUCTIVITY_PARAMS` literal values are byte-unchanged. The no-refit covenant ([CHARTER §8.3](../sprint-00/CHARTER.md)) holds.
- Direction A's Brier delta `+0.01350076` is concentrated on 2/5 events (T4-2022-01-20-S1 with M5.5 trigger and T4-2024-05-15-S1 with X1.0 trigger). 3/5 events (X9.3, X8.2, X8.7 triggers) saturate to bucket-4 in both lambda regimes (lambda=8 and lambda=10), so their Brier remains 0.40. This is corpus-shape-foreclosed for cycle-002, not a defect.
- replay_script_hash drift from Sprint 03 anchor is documented honestly in the manifest. The Sprint 03 anchor value is preserved verbatim in cycle-002-run-1 directory. The new value covers the new replay behavior (which adds the lambdaScalar option-bag forwarding); we do NOT claim the old hash still covers the new behavior.

---

## Verification steps for `/review-sprint sprint-05`

The reviewer should verify:

1. **All tests green**: `npm test` → 296 pass / 0 fail / 0 skip.
2. **Sprint 05 tests in particular**: `node --test tests/sensitivity-proof-T4-test.js` → 17 pass / 0 fail.
3. **Frozen invariants** (re-verify):
   ```
   openssl dgst -sha256 scripts/corona-backtest.js
   openssl dgst -sha256 grimoires/loa/calibration/corona/calibration-manifest.json
   cat grimoires/loa/calibration/corona/cycle-002-run-1/{corpus_hash.txt,replay_script_hash.txt,cycle_001_script_hash.txt}
   ```
   Expected: `17f6380b…1730f1`, `e53a40d1…5db34a`, then run-1 hash files unchanged.
4. **`src/` diff scope**: `git diff --stat src/` → exactly one file (`src/theatres/proton-cascade.js`) modified. `git diff src/rlmf/` → empty. `git diff src/oracles/ src/processor/ src/index.js src/theatres/cme-arrival.js src/theatres/flare-gate.js src/theatres/geomag-gate.js src/theatres/solar-wind-divergence.js` → empty.
5. **Default-preservation**: read [src/theatres/proton-cascade.js diff](../../../../src/theatres/proton-cascade.js) and confirm `lambdaScalar` defaults to `1.0` in both `estimateExpectedCount` and `createProtonEventCascade`. Confirm the math expression `params.lambda * lambdaScalar * intensityMultiplier * ...` reduces to `params.lambda * intensityMultiplier * ...` for `lambdaScalar = 1.0` (IEEE-754 byte-identical).
6. **Replay-seam forwarding**: read [scripts/corona-backtest/replay/t4-replay.js diff](../../../../scripts/corona-backtest/replay/t4-replay.js) and confirm the third-arg `options = {}` with `{ lambdaScalar = 1.0 } = options` destructure, plus the forward into `createProtonEventCascade({...}, { now, lambdaScalar })`.
7. **Direction A flow** in [tests/sensitivity-proof-T4-test.js — runT4Direction](../../../../tests/sensitivity-proof-T4-test.js): confirm the test calls `replay_T4_event(event, ctx, { lambdaScalar })` and scores `trajectory.current_position_at_cutoff` via `scoreEventT4`. Confirm there is NO `perturbedT4Distribution`, `estimateExpectedCountPerturbed`, or other test-side reimplementation of runtime math.
8. **Direction B byte-identity to Sprint 03 anchor**: read [grimoires/loa/calibration/corona/cycle-002-run-3/sensitivity-summary.md per-event Brier table](../../../../grimoires/loa/calibration/corona/cycle-002-run-3/sensitivity-summary.md) and confirm trajectory hashes match cycle-002-run-1 manifest's T4 anchor entry (`16c69988…`, `839fbf32…`, `7a43441a…`, `2815728f…`, `c1cad8e0…`).
9. **Cycle-002-run-1 directory not mutated**: `git status grimoires/loa/calibration/corona/cycle-002-run-1/` → empty. `git diff grimoires/loa/calibration/corona/cycle-002-run-1/` → empty.
10. **Cycle-002 manifest extension**: read [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json sensitivity_proof block](../../../../grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json) and confirm the `provenance.replay_script_hash_at_sprint_05`, `provenance.replay_script_hash_at_sprint_03_anchor`, `provenance.replay_script_hash_drift_reason`, `provenance.src_theatres_proton_cascade_hash_at_sprint_05`, and `provenance.src_theatres_proton_cascade_dependency_note` fields are all present.
11. **Per-event Brier deltas**: confirm at least one event's Brier moves measurably between Direction A and Baseline B.
12. **No Sprint 06 work**: `ls grimoires/loa/a2a/cycle-002/sprint-06/ 2>/dev/null` → directory absent.

If any of (1)–(12) does not hold, halt and surface the discrepancy. Otherwise approve and proceed to `/audit-sprint sprint-05`.

Awaiting `/review-sprint sprint-05`.
