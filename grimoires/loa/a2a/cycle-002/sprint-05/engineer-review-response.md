# Sprint 05 — Engineer Review Response (Path B)

**Authored**: 2026-05-02
**Cycle / Sprint**: cycle-002 / sprint-05
**Status**: Path B implementation complete; awaiting `/review-sprint sprint-05`.
**In response to**: [engineer-feedback.md](engineer-feedback.md) (CHANGES REQUIRED, blocking issue: post-runtime substitution).
**Operator decision**: Path B — real runtime injection seam, with explicit authorization for one default-preserving `src/` edit at [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js).

---

## Summary

The reviewer's blocking concern was that Sprint 05's previous implementation invoked the cycle-002 runtime, then **discarded** the runtime's `current_position_at_cutoff` and substituted a test-side hand-computed distribution. That proved scoring-path sensitivity, not harness sensitivity. Direction A's proof was indirect; the test could pass even if the runtime ignored `PRODUCTIVITY_PARAMS` entirely.

This response implements Path B per the operator's authorization: a real runtime injection seam in `src/theatres/proton-cascade.js` (default-preserving option-bag arg `lambdaScalar`), forwarded through `scripts/corona-backtest/replay/t4-replay.js`. Direction A now applies the perturbation BEFORE the runtime is invoked; the perturbation flows through `createProtonEventCascade` and every `processProtonEventCascade` qualifying-event blend; scoring consumes `trajectory.current_position_at_cutoff` directly. Direction B uses the option-bag default (`lambdaScalar=1.0`); IEEE-754 guarantees `params.lambda * 1.0 === params.lambda` byte-identically; Direction B's per-event trajectory hashes match the cycle-002-run-1 anchor verbatim.

The previous test-side reimplementation (`perturbedT4Distribution`, `estimateExpectedCountPerturbed`, `countToBucketProbabilities`, `poissonPMF`, `logFactorial`, `brierEventT4`, the post-substitution `computeT4Direction_A`) is **deleted**. The new test imports the real scorer and invokes the real runtime exclusively.

| Direction | Brier | Δ vs Baseline B | trajectory_hashes vs run-1 anchor |
|---|---|---|---|
| Baseline B | `0.38183588` | `+0.00000000` | (anchor) |
| Direction A (lambdaScalar=1.25) | `0.39533664` | `+0.01350076` | All five **differ** (perturbation observable through full runtime) |
| Direction B (lambdaScalar=1.0) | `0.38183588` | `+0.00000000` | All five **byte-identical** |

Test totals: **296 pass / 0 fail / 0 skip** (was 293; +3 new gates required by Path B review: byte-identical trajectory_hashes for Direction B, scoring-consumes-runtime-output programmatic gate, Direction A trajectory differs from Baseline B).

---

## Per-concern responses

### Critical Issue #1 — "Direction A's perturbation does not flow through the runtime path."

**Resolved.** Direction A's call chain now is:

```
runT4Direction({ lambdaScalar: 1.25, label: 'A' })
  for each T4 corpus event:
    ctx = createReplayContext({ corpus_event, theatre_id: 'T4', runtime_revision })
    trajectory = replay_T4_event(event, ctx, { lambdaScalar: 1.25 })   ← perturbation BEFORE runtime call
    score = scoreEventT4(event, trajectory.current_position_at_cutoff)  ← consumes runtime output directly
```

`replay_T4_event` is in the cycle-002 replay file set (covered by `replay_script_hash`). It now accepts a third optional `options` arg and destructures `{ lambdaScalar = 1.0 }`. The option flows into:

```
createProtonEventCascade({ triggerBundle, s_scale_threshold, window_hours }, { now, lambdaScalar })
```

`createProtonEventCascade` accepts `lambdaScalar` in its second-arg option-bag (default 1.0) and forwards into:

```
estimateExpectedCount(triggerClass, windowHours, lambdaScalar)
  → const lambda = params.lambda * lambdaScalar
  → const expectedN = lambda * intensityMultiplier * (1 - decay^days) / (1 - decay)
```

For `lambdaScalar = 1.25`:
- `params.lambda` for X-class = 8 → `lambda = 10`. For M-class = 4 → `lambda = 5`. Default = 3 → `lambda = 3.75`.
- `expectedCount` is shifted (typically larger), changing both the prior `initialProbs` AND the rounded `theatre.productivity.expected_count = Math.round(expectedCount * 10) / 10` value that `processProtonEventCascade` blends with qualifying-event projections.
- Every qualifying-event step at [src/theatres/proton-cascade.js — blendedExpected formula in processProtonEventCascade](../../../../src/theatres/proton-cascade.js) uses the perturbed `theatre.productivity.expected_count`. The resulting `current_position_at_cutoff` is the runtime's actual output under perturbation.

For `lambdaScalar = 1.0` (Direction B and the live runtime default):
- `params.lambda * 1.0 === params.lambda` byte-identically (IEEE-754).
- All downstream computations are byte-identical to pre-Sprint-05.
- Direction B trajectory_hash = run-1 trajectory_hash for every event.

The previous adversarial test ("could pass even if the runtime ignored PRODUCTIVITY_PARAMS?") now fails: if `estimateExpectedCount` ignored its `lambdaScalar` argument or `params.lambda`, Direction A's trajectory_hash would not change between `lambdaScalar=1.0` and `lambdaScalar=1.25` and the "Direction A trajectory differs from Baseline B at ≥1 event" gate would fail. The test now actually depends on the runtime exercising the perturbation.

### Critical Issue #1 sub-concern: the `processProtonEventCascade` post-event blend

**Resolved.** All 5 T4 corpus events have qualifying proton observations pre-cutoff, so all 5 trajectories pass through `processProtonEventCascade`'s blend formula at [src/theatres/proton-cascade.js — `blendedExpected = priorWeight * theatre.productivity.expected_count + obsWeight * projectedTotal`](../../../../src/theatres/proton-cascade.js). Under perturbation, `theatre.productivity.expected_count` is set during `createProtonEventCascade` with the perturbed lambda. Every blend step uses the perturbed value. The trajectory's `current_position_at_cutoff` reflects the full perturbed runtime path, not just the prior step.

This is observable in the per-event Brier deltas:
- T4-2017-09-06-S2 (X9.3 trigger): Direction A predicted `[0,0,0,0,1.000]` vs Baseline B `[0,0,0,0,1.000]` — both saturated at bucket 4; Brier 0.40 in both. trajectory_hash differs anyway because position_history evolution recorded under perturbed `expected_count`.
- T4-2022-01-20-S1 (M5.5 trigger): Direction A `[0,0,0.001,0.032,0.967]` vs Baseline B `[0,0,0.011,0.141,0.847]`. Brier 0.387 vs 0.347. Brier delta `+0.0397`.
- T4-2024-05-15-S1 (X1.0 trigger): Direction A `[0,0,0.001,0.025,0.974]` vs Baseline B `[0,0,0.006,0.093,0.901]`. Brier 0.389 vs 0.362. Brier delta `+0.0278`.

Aggregate Brier delta `+0.01350076` is real and is observable through the runtime path including post-event blending. Note this differs from the prior iteration's `+0.01391700` (test-side substituted distribution); the new value reflects the correct full runtime path.

### Critical Issue #1 sub-concern: spec-mechanism authorization

**Resolved.** The Path B implementation matches CYCLE-002-SPRINT-PLAN.md §4.3.1 line 449 example explicitly:
> "test fixture that constructs a runtime theatre with overridden parameters (e.g., a parameter-injection seam exposed via the existing `createX` constructor or a Sprint 05-introduced parameter-injection seam scoped to test code only)"

`createProtonEventCascade` is the existing `createX` constructor; the new `lambdaScalar` option-bag arg is the parameter-injection seam. It is also a literal match for line 450:
> "Sprint 05-introduced narrowly-scoped option-bag arg that flows perturbed parameter values from the replay context, with the live runtime path's default-preserving behavior fully preserved (analogous to the Sprint 02 `{ now }` pattern)"

The pattern is structurally identical to Sprint 02's `{ now }` clock injection: an option-bag arg with a default that the live runtime path always uses (cycle-002 entrypoint never supplies `lambdaScalar`), and a Sprint-05-only test fixture that supplies a non-default value. Default-preservation is verified by Direction B byte-identity to Baseline B trajectory hashes plus all 279 pre-existing tests staying green.

The halt rule (§4.3.1 line 453) was previously bypassed; this iteration is the post-halt response: operator authorization for the `src/` edit was explicitly granted in the review feedback.

### Critical Issue #1 sub-concern: cycle-002 mission alignment

**Resolved.** Cycle-002's mission ("Make CORONA's backtest score CORONA's runtime predictions") requires the harness to MEASURE the runtime. The Path B implementation:
- Direction A's Brier value is determined entirely by the runtime's output (the `trajectory.current_position_at_cutoff` field). The test does not compute any substitute distribution.
- Direction B's Brier byte-identity is a stronger guarantee than before: it's anchored to the cycle-002-run-1 trajectory hashes, which include the entire trajectory canonical JSON. Any drift in the runtime's behavior under default lambdaScalar=1.0 would break Direction B byte-identity. The test fails fast.
- The "Direction A: scoring consumes the runtime trajectory output directly (no post-runtime substitution)" gate is asserted programmatically: the test re-invokes `replay_T4_event` and asserts the recorded `predicted_distribution_from_trajectory` field equals the runtime's actual `current_position_at_cutoff` and that scoring reproduces.

The Rung 2 claim is now valid under the strict cycle-002 mission frame.

### Adversarial Analysis Concern #1 (runtime path bypassed)

**Resolved.** See Critical Issue #1 above. The runtime is invoked WITH the perturbation applied; the runtime's output is what's scored.

### Adversarial Analysis Concern #2 (`processProtonEventCascade` blend not exercised)

**Resolved.** The blend IS exercised because `theatre.productivity.expected_count` is set with the perturbed lambda at theatre creation time, and every qualifying-event blend step uses that perturbed value.

### Adversarial Analysis Concern #3 (deviation from authorized perturbation mechanisms)

**Resolved.** The Path B mechanism is explicitly authorized by lines 449 and 450 of the spec. See Critical Issue #1 sub-concern above.

### Adversarial Analysis Concern #4 (halt rule not invoked)

**Resolved.** The halt rule was bypassed in iteration 1. This iteration is the response after the halt-and-surface step: operator review feedback explicitly authorized the Path B src/ edit. The src_theatres_proton_cascade_dependency_note in the manifest documents the authorization frame.

### Adversarial Analysis Concern #5 (cycle-002 mission framing)

**Resolved.** See Critical Issue #1 sub-concern above. The Rung 2 claim now matches strict mission framing.

### Adversarial Analysis Concern #6 (run-2/run-3 artifact format diverges from run-1)

**Acknowledged, addressed pragmatically.** Run-2 and run-3 still contain `sensitivity-summary.md` (rather than `runtime-uplift-summary.md` + `diagnostic-summary.md`). Spec line 462 "(or analogous) output" gives latitude. The sensitivity-summary format records strictly more information than runtime-uplift-summary would for these specifically-Sprint-05 directories: it includes the perturbation mechanism, lambda scalar, baseline-B reference, delta, per-event Brier with predicted distributions and trajectory_hash prefixes, and honest framing.

The `runtime-uplift-summary.md` and `diagnostic-summary.md` formats are designed for the cycle-002 entrypoint's standard runs. They include cycle-level honest-framing language (e.g., "T1/T2 are runtime-wired but prior-only") that doesn't apply to a sensitivity-proof artifact (which is T4-only by binding scope). Reproducing those formats with Brier values that reflect the substituted/perturbed scoring would be misleading. The current sensitivity-summary format is honest about what these directories are.

If the reviewer / auditor specifically requires runtime-uplift-summary + diagnostic-summary alongside sensitivity-summary, that can be added as a follow-up at minimal cost. Marked NB-1 in the prior feedback as non-blocking; the follow-up status remains the same.

### Adversarial Analysis Assumption challenge: faithfulness of test-side reimplementation

**No longer applicable.** The test-side reimplementation is gone. The test now uses the real runtime via imported `replay_T4_event` and `scoreEventT4`. The faithfulness concern (silent drift between test-side and runtime math) is dissolved.

### Adversarial Analysis Alternative: runtime-parameter injection seam

**Adopted.** This is precisely Path B. Implemented as described in the alternative analysis: option-bag arg in `createProtonEventCascade` (analogous to Sprint 02's `{ now }`), default-preserving (`lambdaScalar = 1.0` is byte-identical to pre-Sprint-05), forwarded through `replay_T4_event`'s third options arg, default-preserving at every layer.

### Non-Blocking NB-1 (per-event saturation)

**Acknowledged.** 3/5 events saturate to bucket-4 in both lambda regimes; aggregate signal is driven by 2/5 events. This is corpus-shape-foreclosed for cycle-002 (extreme corpus, intentional). Per the prior feedback, "Larger / cooler corpus would distribute sensitivity more evenly" — that's a future-cycle item. Sprint 05 does not enlarge the corpus (out of scope).

### Non-Blocking NB-2 (run-2/run-3 artifact format)

See Adversarial Concern #6 response above.

### Non-Blocking NB-3 (`delta_vs_baseline_B` IEEE-754 noise)

**Partially addressed.** The new manifest schema records both the precise float (`direction_A.delta_vs_baseline_B`) and a labeled string (`direction_A.delta_vs_baseline_B_label: "+0.01350076 (~3.5% relative)"`) for audit aesthetics. The precise float is needed for programmatic verification; the label is for human read.

### Non-Blocking NB-4 (`trajectory_hashes_unchanged` field name)

**Resolved by removal.** The previous schema's `trajectory_hashes_unchanged` field is replaced by a new schema where:
- `direction_A.trajectory_hashes` records the **post-perturbation** trajectory hashes (which DIFFER from baseline; the perturbation IS observable in the trajectory).
- `direction_A.trajectory_hashes_differ_from_baseline_B: true` flag explicitly states the difference.
- `direction_B.trajectory_hashes` records hashes that byte-identically match Baseline B (verified by gate).

The misleading "unchanged" naming from the prior iteration is gone.

---

## Sprint 05 hard-stop checklist (operator's required gates)

| Hard stop | Status |
|---|---|
| more than one `src/` file needs editing | NOT triggered. `git diff --stat src/` reports `1 file changed`. Only `src/theatres/proton-cascade.js`. |
| the injection seam cannot be made default-preserving | NOT triggered. `lambdaScalar=1.0` default produces byte-identical output (verified by Direction B trajectory_hash equality to run-1 anchor). |
| default T4 runtime output changes | NOT triggered. All 279 pre-existing tests stay green; Direction B byte-identity proven. |
| Direction A still requires post-runtime distribution substitution | NOT triggered. All test-side substitution helpers are deleted; Direction A's scoring input is the runtime's actual `trajectory.current_position_at_cutoff`. |
| Direction A does not change T4 Brier | NOT triggered. Δ = `+0.01350076` ≥ 0.01 floor. |
| Direction B does not restore Baseline B byte-identically | NOT triggered. Direction B Brier = `0.38183588` byte-identical; trajectory_hashes byte-identical to run-1 anchor. |
| T1/T2/T3/T5 enter the sensitivity proof | NOT triggered. All replay calls limited to `theatres: ['T4']`. |
| RLMF certificate behavior changes | NOT triggered. `git diff src/rlmf/certificates.js` empty. |
| new dependencies appear necessary | NOT triggered. `package.json` `dependencies: {}`. |
| cycle-001 manifest mutation appears necessary | NOT triggered. sha256 unchanged. |
| `scripts/corona-backtest.js` edit appears necessary | NOT triggered. sha256 unchanged. |

All hard stops clear.

---

## Operator-required post-implementation reports

| Item | Result |
|---|---|
| `npm test` ran | ✓ |
| New test total | **296 / 0 / 0** (was 279 baseline + 17 sensitivity tests, replacing the prior 14 + 3 new Path B gates) |
| Changed files | `src/theatres/proton-cascade.js`, `scripts/corona-backtest/replay/t4-replay.js`, `tests/sensitivity-proof-T4-test.js`, `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`, `grimoires/loa/calibration/corona/cycle-002-run-2/{corpus_hash.txt, replay_script_hash.txt, cycle_001_script_hash.txt, sensitivity-summary.md}`, `grimoires/loa/calibration/corona/cycle-002-run-3/{...}`, `package.json` (test wiring carry-forward), `grimoires/loa/a2a/cycle-002/sprint-05/reviewer.md`, `grimoires/loa/a2a/cycle-002/sprint-05/engineer-review-response.md` (this file) |
| Exact `src/` diff | `src/theatres/proton-cascade.js` only — `+27 / -5` (option-bag arg additions to `estimateExpectedCount` and `createProtonEventCascade`, JSDoc comments). `src/rlmf/certificates.js` unchanged. All other `src/` paths unchanged. |
| Baseline B T4 Brier | `0.38183588` |
| Direction A T4 Brier and delta | `0.39533664`, delta `+0.01350076` (~3.5% relative; ≥ 0.01 floor) |
| Direction B T4 Brier and byte-identity | `0.38183588`, byte-identical to Baseline B (`assert.strictEqual` IEEE-754 + per-event trajectory_hash deepStrictEqual to run-1 anchor) |
| Whether Direction A scoring now consumes runtime trajectory output directly | **YES**. Programmatic gate: re-invokes `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })` and asserts `e.predicted_distribution_from_trajectory === traj.current_position_at_cutoff` and `reScore.brier_score === e.brier_score`. No test-side substitute distribution is computed. |
| Replay_script_hash / provenance changes | Sprint 03 anchor `bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60` preserved verbatim in cycle-002-run-1/replay_script_hash.txt (historical). Post-Sprint-05 hash `a919ec7d3f472f65435b0e6bec9b2c4e082e40186ceecc8921b527013470940b` recorded in `manifest.sensitivity_proof.provenance.replay_script_hash_at_sprint_05`. New dependency: `src/theatres/proton-cascade.js` sha256 `095ef077541ba0bfc994b253d0c1572abbd0479db10e2de7e06ddd1e0d38d549` recorded in `manifest.sensitivity_proof.provenance.src_theatres_proton_cascade_hash_at_sprint_05`. Drift reason and dependency note documented in adjacent provenance fields. |

---

Awaiting `/review-sprint sprint-05`. Do not commit. Do not tag. Sprint 06 not started.
