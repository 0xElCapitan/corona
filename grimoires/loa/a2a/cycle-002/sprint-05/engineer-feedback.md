# Sprint 05 Review Feedback — Senior Lead (Re-Review After Path B Fix)

**Verdict**: **APPROVED WITH NON-BLOCKING CONCERNS**
**Authored**: 2026-05-02
**Cycle / Sprint**: cycle-002 / sprint-05
**Reviewer scope**: [reviewer.md](reviewer.md), [engineer-review-response.md](engineer-review-response.md), [tests/sensitivity-proof-T4-test.js](../../../../tests/sensitivity-proof-T4-test.js), [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js), [scripts/corona-backtest/replay/t4-replay.js](../../../../scripts/corona-backtest/replay/t4-replay.js), [cycle-002-run-2/](../../../../grimoires/loa/calibration/corona/cycle-002-run-2/), [cycle-002-run-3/](../../../../grimoires/loa/calibration/corona/cycle-002-run-3/), [cycle-002 manifest](../../../../grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json), full git diff, `npm test` re-run.

This file supersedes the previous CHANGES_REQUIRED feedback at this same path. The blocking concern from that iteration is now resolved.

---

## Executive summary

The Path B implementation is correct. The previously-blocking concern — Direction A's post-runtime distribution substitution — is fully resolved. The perturbation now flows through the actual cycle-002 runtime path (`replay_T4_event` → `createProtonEventCascade({...}, { lambdaScalar })` → `estimateExpectedCount(triggerClass, windowHours, lambdaScalar)` → `params.lambda * lambdaScalar`), the runtime's `current_position_at_cutoff` is the runtime's actual output under perturbation (verified by a programmatic gate), and Direction B byte-identically reproduces the Sprint 03 run-1 anchor at the trajectory-hash level for all five T4 events.

**Sprint 05 may proceed to `/audit-sprint sprint-05`.**

---

## Adversarial Analysis

### Concerns Identified (3, all non-blocking)

1. **Concern**: The `lambdaScalar` option is plumbed through `createProtonEventCascade` and `estimateExpectedCount`, but `processProtonEventCascade` does not accept it. This works *for now* because `theatre.productivity.expected_count` is set once at theatre creation with the perturbed lambda (line [src/theatres/proton-cascade.js — `productivity.expected_count = Math.round(expectedCount * 10) / 10`](../../../../src/theatres/proton-cascade.js)) and the post-event blend at [src/theatres/proton-cascade.js — `blendedExpected = priorWeight * theatre.productivity.expected_count + obsWeight * projectedTotal`](../../../../src/theatres/proton-cascade.js) reads that perturbed value. A future change that recomputes the productivity prior mid-trajectory (e.g., adaptive Bayesian update on observation) would silently bypass `lambdaScalar` unless that recompute path also accepts the option. **Mitigation**: the current runtime does not do mid-trajectory productivity recompute; if Sprint 06+ introduces it, the sensitivity-proof test will catch the drift via Direction B byte-identity gate (trajectory_hash deepStrictEqual to run-1 anchor). Non-blocking — the design is correct under current runtime semantics.

2. **Concern**: `lambdaScalar` has no input validation in [src/theatres/proton-cascade.js — estimateExpectedCount](../../../../src/theatres/proton-cascade.js). Passing `lambdaScalar = 0` produces `expectedCount = 0`, making `countToBucketProbabilities(0)` return `[1, 0, 0, 0, 0]` (degenerate). Passing `NaN` propagates NaN through to the trajectory and Brier. Passing negative values would produce NaN from `Math.log(negative)` inside `poissonPMF`. The test only exercises 1.0 and 1.25; the seam is documented as test-only and the live runtime never supplies the option. **Recommendation**: optionally guard the input (e.g., `if (!Number.isFinite(lambdaScalar) || lambdaScalar <= 0) throw new Error(...)`) — but only if a future iteration extends the seam beyond Sprint 05's narrow test purpose. Non-blocking for Sprint 05.

3. **Concern**: The test file's `runT4Direction` function ([tests/sensitivity-proof-T4-test.js — runT4Direction loop](../../../../tests/sensitivity-proof-T4-test.js)) replicates the per-event T4 aggregation logic that exists in `dispatchCycle002Replay`'s `scoreCorpusT4PerEventDispatch` at [scripts/corona-backtest-cycle-002.js:144–164](../../../../scripts/corona-backtest-cycle-002.js). The duplication is necessary because the test needs to flow `lambdaScalar` through, and `dispatchCycle002Replay` does not (and per the operator's authorization scope, must not) accept that option. The duplication is benign but may confuse a future engineer who modifies the entrypoint and forgets to mirror in the test. **Recommendation**: a comment in `runT4Direction` cross-referencing `scoreCorpusT4PerEventDispatch` would help future-proof the structural relationship. Non-blocking.

### Assumptions Challenged

- **Assumption**: The implementation assumes IEEE-754 multiplication by 1.0 is exactly bit-identical (`x * 1.0 === x` for all finite x, including denormals and edge cases). This is correct per the IEEE-754 spec, but the engineer also implicitly assumes V8's JIT does not legally re-order multiplications in `params.lambda * lambdaScalar * intensityMultiplier * (...)` in a way that would change the IEEE-754 result for `lambdaScalar = 1.0`. In practice V8 preserves IEEE-754 semantics rigorously and `(x * 1.0) * y === x * y` holds bit-for-bit. **Risk if wrong**: Direction B trajectory_hash byte-identity to run-1 anchor would fail. **Mitigation**: the test catches this fast — Direction B trajectory_hash deepStrictEqual gate runs every test invocation and asserts byte-equality with the Sprint 03 anchor. If a future Node version subtly changes float ordering, the gate fails immediately. **Recommendation**: this is a real but extraordinarily unlikely risk; the gate provides the necessary safety net. Non-blocking.

### Alternatives Not Considered

- **Alternative**: Expose `estimateExpectedCount` as an export rather than plumbing `lambdaScalar` through `createProtonEventCascade`. The test would then call the exported `estimateExpectedCount(triggerClass, windowHours, 1.25)`, get the perturbed expected count, build a synthetic theatre object with `productivity.expected_count = perturbed`, and pass it to `processProtonEventCascade`. **Tradeoff**: smaller `src/` change surface (only the `estimateExpectedCount` export, no createX option-bag); but the test would be heavier (manual theatre construction) AND the test-side path would diverge from the live-path more visibly. The current option-bag approach exercises the *same* code path that the live runtime uses (just with a non-default option-bag value). **Verdict**: current approach is superior — it stays closer to the live path and matches Sprint 02's `{ now }` precedent verbatim.

---

## Critical Issues (must fix)

**None.** The previous review's critical issue ("Direction A's perturbation does not flow through the runtime path") is fully resolved. Programmatic gate "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" verifies it; adversarial simulation in this re-review confirms the test would fail if the runtime ignored `lambdaScalar`.

---

## Verification of previous feedback items

The previous engineer-feedback (now superseded by this file) raised one Critical Issue and four Adversarial Concerns. Verification of each:

| Previous concern | Status |
|---|---|
| **Critical Issue #1**: "Direction A bypasses runtime output... discards runtime current_position_at_cutoff... substitutes a test-computed perturbed distribution" | **RESOLVED**. `runT4Direction` calls `replay_T4_event(event, ctx, { lambdaScalar })` and scores `trajectory.current_position_at_cutoff` directly. No substitution. The previous test's `perturbedT4Distribution`, `estimateExpectedCountPerturbed`, `countToBucketProbabilities`, `poissonPMF`, `logFactorial`, `brierEventT4` helpers are deleted (verified by `grep -c` returning 0 for each). |
| **Adversarial Concern #1**: "Direction A bypasses the runtime path for the predicted distribution" | **RESOLVED**. Runtime path IS exercised under perturbation. Adversarial simulation: I monkey-shimmed an alternate path where the runtime ignores `lambdaScalar`; Direction A delta drops to 0 and the magnitude-floor gate fails. The current test does not have this failure mode — its proof genuinely depends on the runtime exercising `lambdaScalar`. |
| **Adversarial Concern #2**: "processProtonEventCascade post-event blend not exercised" | **RESOLVED**. The blend uses `theatre.productivity.expected_count` which is set during `createProtonEventCascade` with the perturbed lambda. Every blend step under Direction A sees the perturbed value. Empirical evidence: per-event Brier deltas at non-saturating triggers (T4-2022-01-20-S1 M5.5, T4-2024-05-15-S1 X1.0) show movement that includes both prior and blend effects. All 5 trajectory_hashes differ from Baseline B (full trajectory-evolution divergence captured). |
| **Adversarial Concern #3**: "deviation from authorized perturbation mechanisms" | **RESOLVED**. Path B implementation is a literal match to spec line 449 ("test fixture that constructs a runtime theatre with overridden parameters... a parameter-injection seam exposed via the existing `createX` constructor") and line 450 ("Sprint 05-introduced narrowly-scoped option-bag arg... analogous to the Sprint 02 `{ now }` pattern"). Default preservation matches "the live runtime path's default-preserving behavior fully preserved" verbatim. |
| **Adversarial Concern #4**: "halt rule not invoked" | **RESOLVED**. The halt-and-surface step happened (the previous CHANGES_REQUIRED gate caused the engineer to stop and ask the operator). Operator authorized Path B explicitly in the review feedback. The implementation is the post-halt response. |
| **Adversarial Concern #5**: "cycle-002 mission framing" | **RESOLVED**. The harness now genuinely measures the runtime: the Brier value is determined by `trajectory.current_position_at_cutoff` which is the runtime's actual output. The Rung 2 claim is valid under the strict cycle-002 mission frame. |
| **Adversarial Concern #6**: "run-2/run-3 artifact format diverges from run-1" | **ACKNOWLEDGED, ACCEPTED**. The engineer's response correctly notes that `runtime-uplift-summary.md` and `diagnostic-summary.md` formats include cycle-level honest-framing language ("T1/T2 are runtime-wired but prior-only") that does not apply to Sprint 05's T4-only sensitivity-proof artifacts. The `sensitivity-summary.md` format is honest about what these directories represent. The non-blocking flag from the previous feedback is downgraded to "accepted"; no further action needed. |
| **Assumption challenge — faithfulness of test-side reimplementation** | **DISSOLVED**. The test-side reimplementation is gone. The faithfulness concern no longer applies because the test now uses the real runtime via imported `replay_T4_event` and `scoreEventT4`. |
| **Alternative — runtime-parameter injection seam** | **ADOPTED**. Implemented exactly as described. |
| **NB-1** (per-event saturation) | **ACKNOWLEDGED**. 3/5 events saturate to bucket-4 in both lambda regimes; aggregate signal is driven by 2/5 events. Documented in reviewer.md. Corpus-shape-foreclosed for cycle-002. |
| **NB-2** (run-2/run-3 artifact format) | See Adversarial Concern #6 above. |
| **NB-3** (`delta_vs_baseline_B` IEEE-754 noise) | **PARTIALLY ADDRESSED**. New schema records both the precise float (`direction_A.delta_vs_baseline_B`) and a labeled string (`direction_A.delta_vs_baseline_B_label: "+0.01350076 (~3.5% relative)"`). Acceptable. |
| **NB-4** (`trajectory_hashes_unchanged` field name) | **RESOLVED**. The misleading "unchanged" field is gone. New schema: `direction_A.trajectory_hashes` records the perturbation-observable hashes (which DIFFER from baseline) plus `direction_A.trajectory_hashes_differ_from_baseline_B: true` flag; `direction_B.trajectory_hashes` records hashes that byte-identically match Baseline B. |

All 12 previous-feedback items addressed.

---

## Path B verification matrix

| Operator's required check | Status | Evidence |
|---|---|---|
| Direction A no longer discards runtime `current_position_at_cutoff` | ✓ | [tests/sensitivity-proof-T4-test.js — runT4Direction line `const score = scoreEventT4(event, trajectory.current_position_at_cutoff)`](../../../../tests/sensitivity-proof-T4-test.js). |
| Direction A no longer substitutes a hand-computed distribution after runtime replay | ✓ | `grep -c "perturbedT4Distribution\|estimateExpectedCountPerturbed\|function countToBucketProbabilities\|function poissonPMF\|function logFactorial\|function brierEventT4" tests/sensitivity-proof-T4-test.js` → all return 0. |
| Test-side Wheatland reimplementation gone | ✓ | Same as above. |
| Direction A scoring consumes the actual runtime replay trajectory output directly | ✓ | "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" gate re-invokes `replay_T4_event` and asserts `e.predicted_distribution_from_trajectory === traj.current_position_at_cutoff` AND `reScore.brier_score === e.brier_score`. |
| The test would fail if `src/theatres/proton-cascade.js` ignored `lambdaScalar` | ✓ | Adversarial simulation: monkey-patched call path that always supplies `lambdaScalar=1.0` regardless of "Direction A" intent produces `delta = 0.0`. The "Direction A: T4 Brier ≠ Baseline B by ≥ PERTURBATION_MAGNITUDE_MIN" gate would FAIL with `delta < 0.01`. The "notStrictEqual" gate would also FAIL. |
| Only `src/theatres/proton-cascade.js` modified under `src/` | ✓ | `git diff --stat src/` reports `1 file changed, 27 insertions(+), 5 deletions(-)`. No other src/ paths in `git status --short`. |
| `lambdaScalar` is default-preserving | ✓ | Direction B byte-identity at trajectory_hash level (deepStrictEqual gate, 5/5 events match cycle-002-run-1 anchor). All 279 pre-existing tests stay green (none pass `lambdaScalar`). |
| RLMF certificate behavior unchanged | ✓ | `git diff src/rlmf/` returns 0 lines. |
| T1/T2/T3/T5 behavior unchanged | ✓ | All replay calls limited to `theatres: ['T4']`. T1/T2/T3/T5 not exercised. The pre-existing replay-trajectory-shape-T1, T2, determinism-T1T2, T1T2-binary-brier-scoring tests stay green. |
| No permanent runtime parameter change | ✓ | `PRODUCTIVITY_PARAMS` literal values (X_class lambda=8, M_class lambda=4, default lambda=3, plus decays) are byte-unchanged. The lambdaScalar seam scales at call time only. |
| `replay_T4_event` forwards `lambdaScalar` into the T4 runtime path | ✓ | [scripts/corona-backtest/replay/t4-replay.js:67–76](../../../../scripts/corona-backtest/replay/t4-replay.js) destructures `{ lambdaScalar = 1.0 } = options`; line 144 forwards `{ now, lambdaScalar }` into `createProtonEventCascade`. |
| Direction A perturbation happens before/during runtime replay, not after | ✓ | The option flows BEFORE the createX call, BEFORE any runtime computation. `current_position_at_cutoff` reflects the perturbed runtime. |
| Direction B uses the default/unperturbed path | ✓ | `runT4Direction({ lambdaScalar: 1.0 })` — default value, byte-identical to omitting the option. |
| Baseline B T4 Brier `0.38183588` | ✓ | `assert.strictEqual(directionB.brier, 0.38183588)` passes. |
| Direction A T4 Brier `0.39533664` | ✓ | Recorded in `manifest.sensitivity_proof.direction_A.t4_brier` and run-2 sensitivity-summary.md. |
| Direction A delta `+0.01350076` | ✓ | `0.39533664 - 0.38183588 = 0.01350076`. Above floor 0.01. Recorded in summary. |
| Direction B T4 Brier `0.38183588` | ✓ | Recorded; byte-identical strictEqual gate. |
| Direction B trajectory hashes match cycle-002-run-1 for all 5 T4 events | ✓ | Verified via deepStrictEqual gate against on-disk run-1 anchor's `trajectory_hashes` map. All 5/5 byte-identical: `16c69988…`, `839fbf32…`, `7a43441a…`, `2815728f…`, `c1cad8e0…`. |
| `scripts/corona-backtest.js` zero diff, sha256 = `17f6380b…1730f1` | ✓ | Re-verified by `openssl dgst -sha256`. |
| cycle-001 calibration manifest sha256 = `e53a40d1…5db34a` | ✓ | Re-verified. |
| cycle-001 corpus_hash = `b1caef3f…11bb1` | ✓ | Same value across run-1, run-2, run-3 corpus_hash.txt files. |
| `src/rlmf/certificates.js` zero diff | ✓ | `git diff src/rlmf/` empty. |
| Package version `0.2.0` | ✓ | `package.json:3` `"version": "0.2.0"`. |
| Dependencies `{}` | ✓ | `package.json` `"dependencies": {}`. |
| cycle-002 manifest update is additive | ✓ | Top-level Sprint 03 anchor fields preserved verbatim. New `sensitivity_proof` block appended. `entries[]` unchanged (5 entries: T1/T2/T4 anchors + T3/T5 diagnostic-only). |
| Sprint 03 run-1 evidence remains historically preserved | ✓ | `git diff grimoires/loa/calibration/corona/cycle-002-run-1/` empty. The directory is untouched. |
| run-1 `replay_script_hash.txt` = `bfbfd70d…380a60` (Sprint 03 anchor) | ✓ | `cat` returns the Sprint 03 anchor verbatim. |
| post-Sprint-05 replay_script_hash = `a919ec7d…40940b` | ✓ | `computeReplayScriptHash(REPO_ROOT)` returns `a919ec7d3f472f65435b0e6bec9b2c4e082e40186ceecc8921b527013470940b`. Recorded in `manifest.sensitivity_proof.provenance.replay_script_hash_at_sprint_05` and run-2/run-3 directory `replay_script_hash.txt` files. |
| Manifest explains why replay_script_hash drifted | ✓ | `manifest.sensitivity_proof.provenance.replay_script_hash_drift_reason` field documents the drift cause (default-preserving lambdaScalar option-bag added to t4-replay.js). |
| Manifest records `src/theatres/proton-cascade.js` hash as new sensitivity-proof dependency | ✓ | `manifest.sensitivity_proof.provenance.src_theatres_proton_cascade_hash_at_sprint_05` records `095ef077541ba0bfc994b253d0c1572abbd0479db10e2de7e06ddd1e0d38d549`. `src_theatres_proton_cascade_dependency_note` field explains the rationale. |
| cycle-001 manifest not mutated | ✓ | sha256 unchanged. |
| `npm test` passes 296/0/0 | ✓ | Re-run at review time: 296 tests, 0 failures, 0 skips. |
| New Path B gates are meaningful (not circular) | ✓ | Each new gate tests a distinct, falsifiable property: (a) Direction B trajectory_hash deepStrictEqual to run-1 → catches any default-preservation drift; (b) Direction A trajectory_hash differs ≥1 → catches "runtime ignores option" bug; (c) scoring-consumes-trajectory programmatic gate → re-invokes runtime independently and asserts equality. |
| No previous tests removed/skipped/weakened | ✓ | `package.json` test script lists all the prior tests + the new file. `git diff package.json` shows only the test wiring (carry-forward from previous Sprint 05 iteration). All 279 prior tests still green. |
| Sprint 05 may claim "runtime-sensitive" only for T4 | ✓ | Manifest `sensitivity_proof.earned_rung: "Rung 2 (runtime-sensitive)"`. Scope limited to T4 throughout. |
| No "calibration-improved" claim | ✓ | Verbiage absent from reviewer.md, manifest, summaries (except as negative declarations like "not a calibration-improved claim"). |
| No "forecasting accuracy improved" / "empirical performance improvement" / "verifiable track record" | ✓ | All absent. |
| No Baseline A vs Baseline B uplift comparison | ✓ | reviewer.md does not compare cycle-001 Baseline A against cycle-002 Baseline B. |
| No T1/T2/T3/T5 sensitivity generalization | ✓ | All scope confined to T4. |
| No README/BFZ/version/tag/Sprint 06 work | ✓ | `git status` shows no README/BFZ; package version `0.2.0`; no tag; `grimoires/loa/a2a/cycle-002/sprint-06/` does not exist. |

40/40 operator-required checks pass.

---

## Answer to the main adversarial question

**Q: Does the Path B fix now prove T4 runtime replay harness sensitivity, not merely scorer sensitivity?**

**A: Yes.**

The proof is now genuinely a runtime-harness-sensitivity proof, not scoring-path sensitivity:

1. **The perturbation flows through the runtime path**: `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })` → `createProtonEventCascade({...}, { now, lambdaScalar: 1.25 })` → `estimateExpectedCount(triggerClass, windowHours, 1.25)` → `lambda = params.lambda * 1.25`. Every downstream computation in the runtime — including all 5 events' `processProtonEventCascade` qualifying-event blends — reads the perturbed `theatre.productivity.expected_count`. The `current_position_at_cutoff` is the runtime's actual output under perturbation.

2. **Scoring consumes runtime output directly**: `scoreEventT4(event, trajectory.current_position_at_cutoff)`. No post-runtime substitution. Programmatic gate re-invokes `replay_T4_event` independently and asserts the recorded distribution equals the runtime's actual output and that scoring reproduces.

3. **The test depends on the runtime exercising the perturbation**: adversarial simulation confirmed that if the runtime ignored `lambdaScalar`, Direction A delta would be 0 and the magnitude-floor gate plus the `notStrictEqual` gate would both FAIL. The test cannot pass while the runtime is broken.

4. **Direction B byte-identity is at the trajectory-hash level for all 5 events**: stronger than the previous iteration's "Brier byte-identical" gate. trajectory_hash is computed over the entire trajectory canonical JSON (CONTRACT §10), so equality implies byte-identity at every field including `current_position_at_cutoff`, `position_history_at_cutoff`, `gate_params`, `outcome`, and `meta.{corpus_event_hash, cutoff_hash, gate_params_hash}`. The default-preservation invariant is verified at the deepest level.

5. **The Rung 2 claim now matches CHARTER §10's strict reading**: "controlled perturbation of one T4 knob (per Q8) changes T4's cycle-002-replay Brier by a measurable amount; reverting the perturbation restores the Brier byte-identically." Both halves are now satisfied through the actual cycle-002 runtime path.

The cycle-002 mission frame ("Make CORONA's backtest score CORONA's runtime predictions") is honored: the harness measures the runtime; the runtime responds to the parameter; the perturbation is reversible byte-identically.

---

## Decision

**APPROVED WITH NON-BLOCKING CONCERNS**.

Sprint 05 may proceed to `/audit-sprint sprint-05`.

The 3 non-blocking concerns above (post-event blend coupling, lambdaScalar input validation, runT4Direction duplication) are minor hardening recommendations that the engineer may address in a future cycle if desired. None of them block the Rung 2 claim, the audit, or the cycle's progression.

No commit. No tag. No Sprint 06 work.

---

## Karpathy principles check

| Principle | Status | Evidence |
|---|---|---|
| **Think Before Coding** | ✓ | Engineer halted on the previous review's blocking concern, surfaced the absence of a public injection seam, awaited operator authorization, then implemented Path B exactly as authorized. The reviewer.md surfaces all assumptions explicitly. |
| **Simplicity First** | ✓ | The src/ change is `+27 / -5` lines — only the necessary option-bag plumbing, no speculative features. The replay-seam change is `+12 / -1` lines (minimal forward). The test rewrite removed ~80 lines of test-side reimplementation in favor of importing the real runtime. Net simpler. |
| **Surgical Changes** | ✓ | Only 4 files modified (1 src/, 1 replay-seam, 1 manifest, 1 package.json) plus 4 new files (test, run-2/, run-3/, sprint-05/ doc dir). No drive-by edits. PRODUCTIVITY_PARAMS literal values byte-unchanged; the seam scales at call time only. |
| **Goal-Driven** | ✓ | Every test assertion is verifiable. The new gates each test a distinct falsifiable property (default-preservation, perturbation-observable, scoring-consumes-runtime). The AC table walks 36 ACs with file:line evidence for each. |

All four principles satisfied.

---

## Auditor briefing (for `/audit-sprint sprint-05`)

For the auditor's reference — what to focus on:

1. **Security check on the `lambdaScalar` seam**: confirm no path in production runtime can supply a non-default value. The cycle-002 entrypoint ([scripts/corona-backtest-cycle-002.js](../../../../scripts/corona-backtest-cycle-002.js)) does not pass `options` to `replay_T4_event`. Ad-hoc CLI users of the cycle-002 entrypoint cannot inject the value. The seam is reachable only from test code that imports `replay_T4_event` directly.
2. **Provenance integrity**: confirm cycle-002 manifest's top-level fields preserve Sprint 03's run-1 anchor verbatim, and the new `sensitivity_proof` block records the post-Sprint-05 hashes honestly.
3. **No-refit covenant**: confirm `PRODUCTIVITY_PARAMS` literal values (X_class.lambda=8, M_class.lambda=4, default.lambda=3, plus decays) are byte-unchanged. The seam scales at call time; it does not mutate the constant.
4. **Honest framing language**: confirm reviewer.md, manifest, and run-2/run-3 sensitivity-summary.md never claim "calibration-improved", "L2-publish-ready", "uplift demonstrated", "forecasting accuracy improved", or "verifiable track record". The Rung 2 ("runtime-sensitive") claim is the strongest claim made, and it is now valid.
