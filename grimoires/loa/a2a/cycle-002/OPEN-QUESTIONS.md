# CORONA cycle-002 — Open Questions (ranked by blocking severity)

**Total**: 8 questions. Answer P0s before Sprint 0 closes. P1s before Sprint 1. P2s before Sprint 3. P3 before Sprint 5.

> Format per question: severity tier · what's blocked · default recommendation · alternatives · why it matters.

---

## P0 — must answer before Sprint 0 charter

### Q1. RLMF certificate scope: in-scope (mutable) or out-of-scope (frozen)?

**Blocks**: Sprint 0 charter; the entire cycle-002 architectural posture.

**Default recommendation**: **out of scope (frozen)**. Cycle-002 keeps `src/rlmf/certificates.js` unchanged at `version: '0.1.0'`. All bucket-shape adaptation lives in backtest scoring/*. Runtime `current_position` shapes per theatre stay as today (T1/T2/T3/T5 scalar; T4 array of 5).

**Alternatives**:

- **In-scope, version bump**: cycle-002 widens T1/T2 runtime to emit 6-bucket distributions; cert version bumps to `'0.2.0'`; Sprint 0 declares migration note for downstream RLMF consumers; Sprint 6 closeout adds a CHANGELOG-equivalent for the cert change.
- **Hybrid**: keep cert format frozen but add an OPTIONAL `extended_position` field carrying the bucket distribution. Cert reads `current_position` when present, falls back to scalar — migration-friendly but adds parallel-write complexity.

**Why it matters**: this is the gate between "cycle-002 is contained to the backtest seam" and "cycle-002 mutates Echelon RLMF training-data shape for T1/T2". Once decided, Sprint 1's PredictionTrajectory contract derives directly from the answer.

---

### Q2. T3 posture: WSA-Enlil-canonical or CORONA-emits-T3-prediction?

**Blocks**: Sprint 0 (scoping), Sprint 4 (posture decision).

**Default recommendation**: **WSA-Enlil canonical**. CORONA does not predict CME arrival today; the corpus's `wsa_enlil_predicted_arrival_time` (sourced from NASA DONKI) IS the prediction. T3 stays diagnostic-only for "predictive uplift" purposes; T3 backtest scoring continues to measure WSA-Enlil's accuracy + CORONA's uncertainty pricing — neither changes in cycle-002.

**Alternatives**:

- **Widen CORONA scope**: cycle-002 builds a CORONA T3 prediction (could blend WSA-Enlil with solar wind precursor signals). Large scope; pulls in [src/theatres/cme-arrival.js:241-258](src/theatres/cme-arrival.js:241) shock detection logic, makes T3 multi-input. Operator should bless explicitly.
- **Deprecate T3 from composite verdict**: declare T3 settlement-only and remove it from the cycle-002 calibration-improved evidence count (composite still includes for reporting transparency).

**Why it matters**: misclassifying T3 as "runtime-scoreable" leads to false-positive uplift claims. The cycle-001 closeout is explicit on this: "T3 measures WSA-Enlil accuracy against L1 observation, not CORONA prediction quality."

---

### Q3. T5 posture: keep quality-of-behavior, or wire detection-trace replay?

**Blocks**: Sprint 0 (scoping), Sprint 4 (posture decision).

**Default recommendation**: **keep quality-of-behavior settlement**. T5 has no external ground truth; FP rate / p50 / switch-handled metrics ARE the meaningful settlement. T5 stays diagnostic-only for predictive uplift. The runtime detection state ([src/theatres/solar-wind-divergence.js:114-186](src/theatres/solar-wind-divergence.js:114)) remains a runtime-only artifact.

**Alternatives**:

- **Add T5 detection-trace replay**: backtest replays Bz volatility computation against corpus solar-wind windows; compare runtime-detected signals against `corpus_fp_label`. Medium scope. Surfaces runtime detection accuracy but does NOT make T5 a probabilistic-Brier theatre.
- **Defer T5 entirely**: skip T5 in cycle-002 backtest scoring (loader still validates T5 corpus; scoring just emits a "diagnostic-only, see cycle-N" placeholder). Smallest scope.

**Why it matters**: converting T5 quality-of-behavior into a probabilistic uplift would change pass/fail semantics and contaminate the "calibration-improved" framing.

---

## P1 — must answer before Sprint 0 closes / Sprint 2 starts

### Q4. Calibration-manifest re-anchor strategy

**Blocks**: Sprint 0 charter; Sprint 3 ability to commit cycle-002-run-1 without breaking the manifest_regression_test.

**Default recommendation**: **additive, separate file**. Commit `grimoires/loa/calibration/corona/calibration-manifest.cycle-002.json` (or `manifest-revisions/cycle-002.json`) at Sprint 3, carrying cycle-002 `corpus_hash` (unchanged) + `script_hash` (new). Cycle-001 manifest stays immutable. `manifest_regression_test.js` extended to read both — additive, not mutating.

**Alternatives**:

- **In-place mutation**: rewrite all 30 entries' `corpus_hash` / `script_hash` to cycle-002 values. Smallest file footprint; destroys cycle-001 hash anchor; breaks v0.2.0 reproducibility claim.
- **Append revision array**: extend each manifest entry with `revisions: [{cycle, corpus_hash, script_hash, run_id}, …]`. Cleaner per-entry history; bigger schema change.
- **Frozen manifest, separate gate**: keep cycle-001 manifest immutable; introduce a NEW gate (`cycle-002-regression-test.js`) anchored to cycle-002 hashes. Decouples cycles cleanly; doubles test maintenance going forward.

**Why it matters**: the wrong choice either (a) destroys v0.2.0 reproducibility evidence, or (b) creates schema drift that future cycles inherit. Operator owns this.

---

### Q5. Replay-clock injection mechanism

**Blocks**: Sprint 2.

**Default recommendation**: **additive function arg with default**. Theatre create/process functions accept `{ now: () => Date.now() }` as an optional last-arg context. Existing callers (live `CoronaConstruct.pollSWPC` / `pollDONKI`) pass nothing → unchanged behavior, all 160 tests stay green. Backtest replay passes `{ now: () => corpus_event.event_time }`.

**Alternatives**:

- **`withClock(now)` adapter wrapper**: backtest wraps imported runtime functions in a clock-substituting decorator. No runtime edits at all. Slightly more magic; harder to type-check.
- **Refactor: receive `event_time` from bundle exclusively**: theatre processors stop calling `Date.now()` entirely and rely on `bundle.payload.event_time` / `bundle.created_at`. Cleanest long-term but largest change footprint; affects every theatre and every test.

**Why it matters**: the wrong choice either pollutes runtime hot path (option C) or hides nondeterminism behind decorator magic (option B). The default option is the most surgical and least risky.

---

## P2 — must answer before Sprint 3 starts

### Q6. Predeclared cycle-002 baseline for "calibration-improved" claim

**Blocks**: Sprint 3 closeout claim; Sprint 6 honest-framing gate.

**Default recommendation**: **predeclare cycle-001 Run-3-final numerics as the binding baseline**. Cycle-002-run-1 must beat: T1 Brier ≤ 0.1389, T2 Brier ≤ 0.1389, T4 Brier ≤ 0.1600 — strictly. (T3 and T5 carry forward unchanged per Q2/Q3.) "Beat" = lower Brier on the same frozen corpus.

**Alternatives**:

- **Predeclare a NEW baseline at Sprint 0**: e.g., the score the harness produces on T1/T2/T4 when using the runtime's CURRENT (cycle-001) `current_position` projected through the chosen scalar-to-bucket function (Q7). This isolates "did the wiring help?" from "is the runtime model better than uniform prior?". More honest given the prior was always a no-information floor.
- **No baseline, sensitivity-only**: declare cycle-002 explicitly "measurement-seam, no calibration claim". Sprint 5 two-direction test is the only success metric. Lowest-risk closeout posture.

**Why it matters**: claim discipline. Comparing cycle-002 wired-runtime score against cycle-001 uniform-prior is unfair-to-runtime (any non-trivial runtime model beats no-model floor on bucket-Brier). The honest comparison is wired vs. wired.

---

### Q7. T1/T2 scalar-to-bucket projection function

**Blocks**: Sprint 3 implementation.

**Default recommendation**: **document a published, deterministic projection** that fans the scalar P(≥threshold) into a bucket distribution using a parametric prior (e.g., shifted geometric or Wheatland-derived shape). Specifically:

- For T1 with threshold M1.0, runtime `current_position = p`:
  - P(`<M`) = 1 - p
  - P(`M1-M4`) ∝ p · w₁ ; P(`M5-M9`) ∝ p · w₂ ; P(`X1-X4`) ∝ p · w₃ ; … with weights w from solar-flare class frequency literature (already cited in `empirical-evidence.md`).
- Same shape for T2 (threshold Kp ≥ N → fan over G0..G5).

**Alternatives**:

- **2-bucket Brier instead of 6-bucket**: REPLACE the 6-bucket scoring path for runtime-wired runs with a binary `[<threshold, ≥threshold]` Brier matching the runtime's binary-gate semantics. Cleaner; abandons the 6-bucket calibration framing of cycle-001.
- **Empirical projection from corpus**: use observed bucket frequencies in the (frozen) corpus as the within-class weights. Risk: overfitting to 5 events/theatre.

**Why it matters**: the projection IS the prediction model on T1/T2. Choosing it is a non-trivial calibration call; reviewers will ask for the literature anchor. Sprint 1 contract should declare which option is binding before Sprint 3 implements.

---

## P3 — must answer before Sprint 5 starts

### Q8. Sensitivity-proof perturbation knob

**Blocks**: Sprint 5 two-direction test (the binding "runtime-sensitive" evidence).

**Default recommendation**: **`flareThresholdProbability` σ** in [src/processor/uncertainty.js](src/processor/uncertainty.js) — a single numeric parameter, well-cited in [calibration-manifest.json](grimoires/loa/calibration/corona/calibration-manifest.json) entries (corona-evidence-002 family), affects T1 directly and T2 indirectly (CME→Kp pathway). Perturbation: ±25% σ shift.

**Alternatives**:

- **T4 Wheatland λ** in [src/theatres/proton-cascade.js:101-105](src/theatres/proton-cascade.js:101): direct effect on T4 expected count → bucket distribution shift. Most isolated; T4-only.
- **`buildCMEArrivalUncertainty` σ_hours**: affects T2 pending_cmes → kp_threshold path; smallest absolute-magnitude effect (T3 settlement-only path doesn't see it).
- **T1/T2 base_rate**: simplest perturbation but contaminates priors rather than likelihood; less defensible as evidence the SEAM is exercising the runtime model.

**Why it matters**: the chosen knob constrains what the two-direction test can demonstrate. Pick a knob whose perturbation a reviewer would expect to move T1/T2/T4 score; pick the cleanest fan-out so the diff is interpretable.

---

## Summary table

| # | Severity | Question | Blocks |
|---|----------|----------|--------|
| Q1 | P0 | RLMF cert scope: frozen vs. mutable | Sprint 0 charter; entire architectural posture |
| Q2 | P0 | T3 posture: WSA-Enlil canonical vs. CORONA emits T3 | Sprint 0 scoping; Sprint 4 |
| Q3 | P0 | T5 posture: quality-of-behavior vs. detection-trace replay | Sprint 0 scoping; Sprint 4 |
| Q4 | P1 | Manifest re-anchor: additive file, in-place, revisions[], or separate gate | Sprint 0; Sprint 3 commit |
| Q5 | P1 | Clock injection: function arg, decorator, or refactor | Sprint 2 |
| Q6 | P2 | Predeclared baseline: cycle-001 numerics, NEW projected baseline, or no-baseline | Sprint 3 + Sprint 6 |
| Q7 | P2 | T1/T2 scalar-to-bucket projection: parametric prior, 2-bucket Brier, or empirical | Sprint 1 contract; Sprint 3 |
| Q8 | P3 | Sensitivity-proof knob: flare σ, Wheatland λ, CME σ_hours, or base_rate | Sprint 5 |

Eight questions, no more. Operator answers in any order; Sprint 0 cannot exit until P0s + P1s are answered.
