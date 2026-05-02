# CORONA cycle-002 — Planning Frame

**Status**: planning frame (NOT a PRD/SDD/sprint plan; pre-implementation).
**Authored**: 2026-05-01
**Cycle-001 ref state**: HEAD `d137a18`; v0.2.0 → `adf53ff`; corpus_hash `b1caef3f…11bb1`; script_hash `17f6380b…1730f1`; final composite verdict `fail`; calibration-attempted (not improved); not L2 publish-ready.
**Cycle-002 mission**: *Make CORONA's backtest score CORONA's runtime predictions.* Measurement-seam cycle. Not a parameter-refit cycle. Not an L2-publish cycle. Not a release-hygiene cycle.

> Planning posture: this document IS the planning frame. It is not a PRD or SDD. The cycle-001 PRD/SDD/SPRINT.md files at `grimoires/loa/*.md` are historical and remain frozen unless explicitly copied into the cycle-002 namespace under an additive name.

---

## 1. Likely problem statement

CORONA cycle-001 produced a calibration harness (`scripts/corona-backtest/`) whose scoring is **structurally disconnected** from the construct's runtime prediction state.

- T1, T2, T4 scoring uses a `UNIFORM_PRIOR` baseline (no-information floor) ([t1-bucket-brier.js:32](scripts/corona-backtest/scoring/t1-bucket-brier.js:32), [t2:34](scripts/corona-backtest/scoring/t2-bucket-brier.js:34), [t4:33](scripts/corona-backtest/scoring/t4-bucket-brier.js:33)).
- T3 reads `wsa_enlil_predicted_arrival_time` directly from the corpus — this is NASA DONKI's prediction, not CORONA's ([t3-timing-error.js:17-23](scripts/corona-backtest/scoring/t3-timing-error.js:17)).
- T5 settles on quality-of-behavior (FP rate, stale-feed p50, switch-handled rate) anchored on `corpus_fp_label` ([t5-quality-of-behavior.js:36-49](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:36)). Module explicitly notes "without a runtime trace we can only check the third criterion against the corpus signals" ([t5:100-105](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:100)).

Consequence (recorded in [run-3-final/delta-report.md:50-54](grimoires/loa/calibration/corona/run-3-final/delta-report.md:50)):

> "The harness scores against UNIFORM_PRIOR baselines (T1, T2, T4) and corpus-anchored ground truth (T3 WSA-Enlil predictions, T5 FP labels). The runtime CORONA processor parameters are NOT exercised by the offline scoring layer."

Therefore Run 1 = Run 2 = Run-3-final by architectural reality, and any future runtime parameter refit cannot demonstrate predictive uplift on this harness. **Cycle-002 wires runtime prediction trajectories into the backtest scoring layer so calibration improvement becomes measurable.**

Minimum success: a runtime parameter or runtime prediction change can change the backtest score in a deterministic, auditable way.

Strong success: a controlled runtime perturbation changes score, and reverting it restores the prior score (two-direction test).

Calibration-improved (gated; do NOT claim absent evidence): runtime replay beats the predeclared cycle-002 baseline on the frozen corpus without violating regression gates.

---

## 2. Repo findings

### 2.1 Backtest harness (entrypoint, scoring, report)

| File | LOC | Role |
|------|-----|------|
| [scripts/corona-backtest.js](scripts/corona-backtest.js) | 224 | Top-level orchestrator. Loads corpus, dispatches to per-theatre scorer, writes per-theatre + summary reports + `corpus_hash.txt` + `script_hash.txt`. |
| [scripts/corona-backtest/config.js](scripts/corona-backtest/config.js) | 142 | THEATRES, CORPUS_SUBDIRS, THRESHOLDS, env-var resolution, REPO_ROOT. |
| [scripts/corona-backtest/ingestors/corpus-loader.js](scripts/corona-backtest/ingestors/corpus-loader.js) | 447 | Schema validation, `_derived` block (bucket_observed, regression_tier_eligible, glancing_blow_flag, sigma_hours_effective, qualifying_event_count_observed_derived, anomaly_bulletin_refs). |
| [scripts/corona-backtest/scoring/t1-bucket-brier.js](scripts/corona-backtest/scoring/t1-bucket-brier.js) | 152 | T1 scoring; **accepts `options.predictedDistribution`**; defaults to UNIFORM_PRIOR. |
| [scripts/corona-backtest/scoring/t2-bucket-brier.js](scripts/corona-backtest/scoring/t2-bucket-brier.js) | 128 | T2 scoring; **accepts `options.predictedDistribution`**; defaults to UNIFORM_PRIOR. |
| [scripts/corona-backtest/scoring/t3-timing-error.js](scripts/corona-backtest/scoring/t3-timing-error.js) | 155 | T3 timing-error; reads `event.wsa_enlil_predicted_arrival_time` from corpus. **No predictedDistribution input.** |
| [scripts/corona-backtest/scoring/t4-bucket-brier.js](scripts/corona-backtest/scoring/t4-bucket-brier.js) | 129 | T4 scoring; **accepts `options.predictedDistribution`**; imports `BUCKETS` from runtime [proton-cascade.js:29](src/theatres/proton-cascade.js:29). |
| [scripts/corona-backtest/scoring/t5-quality-of-behavior.js](scripts/corona-backtest/scoring/t5-quality-of-behavior.js) | 310 | T5 quality-of-behavior; FP/p50/switch-handled metrics on corpus-supplied signals + bulletins. |
| [scripts/corona-backtest/reporting/hash-utils.js](scripts/corona-backtest/reporting/hash-utils.js) | 88 | `computeCorpusHash`, `computeScriptHash` — script_hash is invariant across runs by design. |

### 2.2 Runtime prediction state per theatre

| Theatre | Runtime file | `current_position` shape | `position_history` entry shape | Bucket-shape match with scoring? |
|---------|--------------|--------------------------|--------------------------------|----------------------------------|
| T1 | [src/theatres/flare-gate.js](src/theatres/flare-gate.js) | **scalar** ∈ [0,1] (binary threshold "≥ M1.0/X1.0?") | `{t, p (scalar), evidence, reason}` | ❌ Scoring expects 6-bucket dist over `['<M','M1-M4','M5-M9','X1-X4','X5-X9','X10+']`. Adapter required. |
| T2 | [src/theatres/geomag-gate.js](src/theatres/geomag-gate.js) | **scalar** ∈ [0,1] (binary threshold "Kp ≥ N?") | `{t, p (scalar), evidence, reason}` + `peak_kp_observed`, `kp_observations[]`, `pending_cmes[]` | ❌ Scoring expects 6-bucket dist over `['G0',…,'G5']`. Adapter required. |
| T3 | [src/theatres/cme-arrival.js](src/theatres/cme-arrival.js) | **scalar** ∈ [0,1] (binary "arrives in WSA-Enlil window ±tol?") | `{t, p (scalar), evidence, reason}` + `solar_wind_history[]`, `arrival_detected`, `arrival_time` | N/A — scoring uses corpus's WSA-Enlil prediction, not CORONA's. CORONA does not predict CME arrival. |
| T4 | [src/theatres/proton-cascade.js](src/theatres/proton-cascade.js) | **array of 5** (Poisson over `BUCKETS`) | `{t, p (array), qualifying_count, evidence, reason}` | ✅ **Direct match.** Sprint-3 wiring is one-line `scoreCorpusT4(events, { predictedDistribution: theatre.current_position })`. |
| T5 | [src/theatres/solar-wind-divergence.js](src/theatres/solar-wind-divergence.js) | **scalar** ∈ [0,1] (binary "sustained ≥ N nT?") | `{t, p (scalar), evidence, reason}` + `divergence_history[]`, `current_streak`, `peak_divergence` | N/A — scoring is quality-of-behavior, not Brier. |

**All theatres** call `Date.now()` directly inside `process*` and `expire*` for `position_history.t` and lifecycle gates — **wall-clock dependency is pervasive** and is the primary replay-determinism risk.

### 2.3 RLMF certificate (downstream provenance)

[src/rlmf/certificates.js](src/rlmf/certificates.js) emits one certificate per resolved theatre via [src/index.js:235-251](src/index.js:235). Schema:

- `certificate_id`, `construct`, `version: '0.1.0'`, `exported_at`, `theatre`, `performance`, `temporal`, `on_chain`
- `performance.brier_score` is `brierScoreBinary(closing_position, outcome)` for scalar `current_position`, or `brierScoreMultiClass(closing_position, outcomeIndex)` for array (T4).
- `performance.position_history` serializes the runtime trace verbatim (`{t, p, evidence}`).
- `performance.calibration_bucket` reads `Math.max(...closing_position)` for arrays.

**Critical**: the RLMF certificate format **reads `theatre.current_position` directly**. If cycle-002 widens T1/T2 runtime to emit a 6-bucket distribution (rather than scalar binary), every downstream RLMF cert field for those theatres changes shape — this is downstream contamination of training data and must NOT be silent.

The backtest harness does NOT emit RLMF certificates today; cert export is exclusively a runtime path. So the backtest seam can be wired without touching RLMF — IF the bucket-shape adaptation lives at the backtest seam, not in runtime.

### 2.4 Calibration manifest binding

[grimoires/loa/calibration/corona/calibration-manifest.json](grimoires/loa/calibration/corona/calibration-manifest.json) — 30 entries; **each entry contains `corpus_hash` and `script_hash` fields** keyed to Run-3-final invariants. The regression test [tests/manifest_regression_test.js](tests/manifest_regression_test.js) enforces hash stability AND `inline_lookup.match_pattern` regex hits in source files.

Implications for cycle-002:

- ANY change under `scripts/corona-backtest/**` mutates `script_hash` → manifest_regression_test fails on all 30 entries → re-anchor strategy required (Open Q4).
- Some manifest entries reference runtime files via `inline_lookup` (e.g., `corona-evidence-002` → `src/processor/uncertainty.js`). Runtime-side edits MAY trip regex matches even when intended to be additive.

---

## 3. Theatre-by-theatre readiness classification

| Theatre | Class | Reason | Adapter / contract scope |
|---------|-------|--------|--------------------------|
| **T1** | scoreable after adapter work | Scalar `current_position` does not match 6-bucket scoring shape. | Backtest-side projection: scalar P(≥threshold) → 6-bucket dist. Projection function must be specified, deterministic, documented; choice of projection is a design question (Open Q7). |
| **T2** | scoreable after adapter work | Same scalar↔6-bucket mismatch as T1. | Same projection contract; threshold is Kp, not flare class. |
| **T3** | should not be counted toward predictive uplift yet | CORONA does not predict T3 — the corpus-supplied `wsa_enlil_predicted_arrival_time` IS the prediction; CORONA only wraps with uncertainty pricing. | Posture decision (Open Q2): keep WSA-Enlil scoring as canonical and exclude T3 from the uplift count, OR widen CORONA scope to emit a T3 prediction (much larger). |
| **T4** | clean runtime-scoreable now | `current_position` is already a 5-bucket array matching scoring shape. `BUCKETS` constant already imported across the boundary. | One-call wiring after determinism + cutoff seams land. **The easy win.** |
| **T5** | diagnostic-only for now | Scoring is quality-of-behavior, not Brier. Runtime detection state exists but is not a probabilistic prediction. | Posture decision (Open Q3): keep quality-of-behavior settlement and exclude T5 from uplift count, OR add runtime detection-trace replay (medium scope). |

**Recommendation (subject to operator approval)**: cycle-002 counts T1, T2, T4 toward predictive-uplift evidence; T3 and T5 remain diagnostic / settlement-authority territory and are explicitly NOT counted toward "calibration-improved" claims.

---

## 4. RLMF / certificate implications

| Question | Repo evidence | Default posture |
|----------|---------------|-----------------|
| Does wiring touch RLMF certificate **shape**? | Only if T1/T2/T5 runtime widens `current_position` from scalar → array. | **Out of scope by default** — keep all bucket-shape work at backtest seam. RLMF cert format unchanged. |
| Does wiring touch RLMF Brier **semantics**? | Only if `brierScoreBinary` / `brierScoreMultiClass` formulas change. | **Out of scope by default** — backtest's per-event Brier formula is local to scoring/*; runtime cert formula is in `src/rlmf/certificates.js` and is independent. |
| Does wiring touch downstream **training data**? | RLMF cert format is the boundary to Echelon RLMF pipeline. | **Out of scope by default** — see above. |
| Does wiring touch certificate **provenance** (script_hash anchors, cert version `0.1.0`)? | The cert version is hard-coded in `certificates.js:100`. Manifest entries carry `script_hash` independently. | **Surface as risk** — if any change ripples into runtime and cert export semantics, version `0.1.0` → `0.2.0` bump is required, and the bump itself is a downstream signal to RLMF consumers. |

**Default posture (operator may override at Sprint 0)**:

- RLMF certificate format is **frozen** for cycle-002. No `version` bump. `current_position` shapes per theatre stay as today.
- All bucket-shape adaptation lives in backtest scoring/* (or a new `scripts/corona-backtest/adapters/` module).
- If operator chooses Open Q1 = "in-scope", this entire posture inverts and Sprint 0 must declare a cert version bump path.

---

## 5. Key design questions

These are not rhetorical — every one of them requires an explicit cycle-002 decision before Sprint 1 can finalize the `PredictionTrajectory` contract. Sprint 0 must close the most-blocking ones (see `OPEN-QUESTIONS.md`).

### 5.1 Canonical runtime trajectory format

Proposed shape:

```js
PredictionTrajectory = {
  theatre_id: string,                    // T1..T5
  event_id: string,                      // matches corpus event_id
  cutoff_time: number,                   // ms epoch — replay deadline
  position_history_at_cutoff: Array<{    // verbatim subset of theatre.position_history with t <= cutoff_time
    t: number, p: number | number[], evidence: string | null, reason: string,
  }>,
  current_position_at_cutoff: number | number[],  // theatre.current_position at cutoff
  distribution_shape: 'binary_scalar' | 'bucket_array_5' | 'corpus_anchored',  // declares scoring projection
  meta: {
    runtime_revision: string,            // git rev of the runtime code at replay time
    corpus_event_hash: string,           // hash of the source corpus event (per-event reproducibility)
    replay_clock_source: 'corpus_event_time',  // not Date.now() (Open Q5)
  },
}
```

Open: whether trajectory captures **all** intermediate positions (full history) or **only** the final pre-cutoff position. Recommendation: full history — needed for `time_weighted_brier` (cert temporal field is already designed around this) and inexpensive at 5-event corpus scale.

### 5.2 Prediction cutoff

For each theatre, the cutoff is the moment after which corpus evidence becomes "ground truth" for resolution and may not feed the prediction:

- T1 (flare gate): cutoff = window-end of the flare event. Pre-cutoff evidence: GOES X-ray observations strictly before the qualifying flare's `peak_time`.
- T2 (geomag gate): cutoff = first observation that crosses Kp threshold (or window-end if no crossing). Pre-cutoff evidence: solar wind, Kp predictions, CME arrivals.
- T3 (CME arrival): cutoff = `observed_l1_shock_time` (or window-close). Pre-cutoff evidence: CME catalog at `start_time`, WSA-Enlil prediction at issue time, intermediate solar wind.
- T4 (proton cascade): cutoff = window-end (closes_at). Pre-cutoff evidence: trigger flare + qualifying proton-flux events strictly before each cutoff sub-window. (Note: T4 has multiple intermediate "qualifying events" — definition of cutoff is per-event-count or per-window?)
- T5 (divergence): N/A if T5 stays diagnostic. Otherwise cutoff = `signal_time` of each candidate divergence signal.

### 5.3 Allowed evidence before cutoff / forbidden after cutoff

- **Allowed before**: any corpus observation with `event_time < cutoff` AND any oracle data older than cutoff.
- **Forbidden after**: any observation, model run, or human label dated after cutoff. Specifically the corpus's `_derived.bucket_observed`, `observed_l1_shock_time`, `qualifying_event_count_observed_derived`, `anomaly_bulletin_refs` are SETTLEMENT data and must NEVER feed the prediction.
- Loader-derived fields are pre-baked: cycle-002 must declare WHICH `_derived` fields are settlement (forbidden) vs. allowed-before (e.g., `regression_tier_eligible` is admissible structural metadata, not future evidence).

### 5.4 Final pre-resolution prediction vs. time-weighted trajectory

Recommendation: backtest scoring uses **the final pre-cutoff `current_position`** as the primary scored prediction (matches RLMF cert's `closing_position` semantics). Time-weighted Brier remains a secondary diagnostic (matches cert `temporal.time_weighted_brier`). This preserves continuity with cycle-001 cert format.

### 5.5 Evidence leakage prevention

- Loader must split corpus events into `evidence_pre_cutoff[]` and `settlement_post_cutoff[]` with explicit cutoff timestamps, and the scoring path must consume only the former.
- Each `PredictionTrajectory.meta` carries a `cutoff_time` — scoring asserts `position_history_at_cutoff.every(h => h.t <= cutoff_time)` and fails loudly otherwise.
- No "_derived" settlement field may appear in the trajectory.

### 5.6 Deterministic replay

- Inject `now()` into runtime theatres (Open Q5). Default to `Date.now()` so non-replay runtime is unchanged.
- Backtest replay calls `theatre = createX({...}, { now: () => corpus_event.start_time })` and feeds events with explicit `event_time`.
- Determinism test: replay same corpus twice → byte-identical trajectory JSON.

### 5.7 Backtest imports runtime directly OR mirrors runtime logic?

Recommendation: **import directly.** Precedents:

- [t4-bucket-brier.js:29](scripts/corona-backtest/scoring/t4-bucket-brier.js:29) already imports `BUCKETS` from `src/theatres/proton-cascade.js`. SDD §6.4 permits importing constants.
- Mirroring runtime logic would create a second copy of `processFlareClassGate` etc. — drift risk; violates the "pre-existing architectural reality" framing.
- Importing means cycle-002 backtest IS scoring runtime predictions, which is the whole point.

Implementation seam: `scripts/corona-backtest/replay/<theatre>-replay.js` instantiates a runtime theatre with injected clock, replays pre-cutoff bundles, returns `PredictionTrajectory`.

### 5.8 Preserving cycle-001 run truth

- Run 1 / Run 2 / Run-3-final under `grimoires/loa/calibration/corona/run-{1,2,3-final}/` are FROZEN. Cycle-002 first run is `cycle-002-run-1/` (NEW directory).
- corpus_hash invariant must be preserved on cycle-002-run-1 (corpus is frozen). script_hash WILL change once scoring/replay code lands. Manifest re-anchor is one-time, additive (Open Q4).
- The cycle-001 delta-report stays binding: "Run 1 = Run 2 = Run-3-final" framing is the architectural reality the cycle-002 work demonstrates IS now refutable.

### 5.9 Schema/version note for RLMF / Brier export

Default posture: cert version stays at `'0.1.0'` because backtest scoring change is OUT-OF-CERT-SCOPE.

If operator picks the in-scope option (Open Q1) → cert version bump to `'0.2.0'` becomes binding and Sprint 0 owns that decision and the migration note.

---

## 6. Risks

| # | Risk | Severity | Mitigation handle |
|---|------|----------|-------------------|
| R1 | Nondeterministic replay (Date.now() pervasive in runtime theatres) | CRITICAL | Sprint 2 clock-injection seam with default-preserving signature |
| R2 | Evidence leakage (settlement data feeds prediction) | CRITICAL | Loader split into `evidence_pre_cutoff` / `settlement_post_cutoff` + scoring assertion |
| R3 | False "calibration-improved" claim in closeout docs | HIGH (binding closeout discipline) | Predeclared baseline + two-direction sensitivity test; honest-framing grep gate stays in cycle-closeout artifacts |
| R4 | T3 semantic corruption (treating WSA-Enlil scoring as CORONA prediction quality) | HIGH | Posture decision in Sprint 4 (Open Q2); explicit "T3 not counted toward predictive uplift" framing if WSA-Enlil stays canonical |
| R5 | T5 semantic corruption (converting quality-of-behavior into probabilistic uplift inadvertently) | HIGH | Posture decision in Sprint 4 (Open Q3); keep T5 settlement authority untouched |
| R6 | Overwriting cycle-001 artifacts (run-1/, run-2/, run-3-final/, sprint-N/, PRD/SDD/SPRINT.md) | HIGH | Cycle-002 namespace `grimoires/loa/a2a/cycle-002/`; new `cycle-002-run-1/` under calibration/; Sprint 0 freeze list (§8) |
| R7 | Manifest churn (script_hash drift trips 30 regression entries) | MEDIUM | Sprint 0 declares re-anchor strategy (Open Q4); regression test re-baseline is one-time + additive, not mutating |
| R8 | Test churn (160-test suite breaks under runtime clock-injection) | MEDIUM | Default `now: () => Date.now()` keeps existing tests green; new replay tests are additive |
| R9 | Overfitting to tiny corpus slices (5 events/theatre) | MEDIUM | Cycle-002 is measurement-seam, NOT parameter-refit. Sensitivity proof uses one knob, not a search. Larger corpus stays Sprint 4 §4.5 entry-006 carry-forward to a future cycle. |
| R10 | Release hygiene (CHANGELOG, GitHub Release, version bump) distracting from the real frontier | MEDIUM | Cycle-002 explicitly NOT a release-hygiene cycle. Version bump only at closeout if calibration-improved evidence is binding; otherwise stay v0.2.x. |
| R11 | RLMF certificate format implications (cert `version`, position_history shape, brier semantics) | MEDIUM-to-HIGH depending on Q1 | Default posture: cert frozen. If operator picks "in-scope" path, Sprint 0 declares migration note + version bump path. |
| R12 | T1/T2 scalar-to-6-bucket projection function design (no obvious canonical choice) | MEDIUM | Open Q7 decides; document projection in trajectory `meta.distribution_shape` and per-event report. |

---

## 7. Candidate sprint sequence

> Subject to revision after operator answers `OPEN-QUESTIONS.md`. Do not implement.

| Sprint | Title | Charter (one line) | Exits when |
|--------|-------|--------------------|------------|
| **Sprint 0** | Cycle-002 charter / freeze line | Open-question gate; freeze cycle-001 artifacts; declare RLMF cert posture; declare manifest re-anchor strategy; declare cycle-002 baseline anchoring | All P0 questions answered; freeze list ratified; baseline anchoring decided |
| **Sprint 1** | PredictionTrajectory contract | Define canonical trajectory shape; specify evidence-pre-cutoff / settlement-post-cutoff split; cutoff semantics per theatre; shape-validation tests (no implementation) | Contract approved; tests for shape validation green |
| **Sprint 2** | Deterministic replay seam | Inject `now()` into runtime theatres with `Date.now()` default; build `scripts/corona-backtest/replay/` to instantiate runtime + replay corpus events pre-cutoff; determinism test (replay-twice byte-identical) | Determinism test passes; runtime tests still 160/160 |
| **Sprint 3** | T1/T2/T4 runtime scoring integration | Wire trajectories into `scoreCorpusT{1,2,4}`. T4 first (clean). T1/T2 with documented scalar-to-bucket projection (Open Q7). Manifest re-anchor (one-time). | cycle-002-run-1 produced; verdicts emitted; manifest re-anchored to new script_hash |
| **Sprint 4** | T3/T5 posture decision (operator gate) | Lock T3 + T5 posture per Open Q2/Q3. Document non-uplift framing for whichever stays settlement-anchored. | Posture documented; theatre-authority.md addendum or cycle-002 carry-forward note |
| **Sprint 5** | Sensitivity proof | Two-direction perturbation test on one chosen knob (Open Q8). Demonstrate score moves and reverts. Update regression gate baseline. | Two-direction test green; perturbation diff documented |
| **Sprint 6** | Closeout / honest framing | README + BFZ updates IF cycle-002-run-1 differs from cycle-001 baseline; calibration-improved claim only if predeclared baseline beaten + regression gate green. Tag posture decision. | Honest-framing grep clean; tag created OR explicitly deferred |

---

## 8. Files / areas that must NOT be touched

| Asset | Path | Freeze posture |
|-------|------|----------------|
| Cycle-001 PRD | [grimoires/loa/prd.md](grimoires/loa/prd.md) | Frozen — historical. Copy into cycle-002 namespace if revision needed. |
| Cycle-001 SDD | [grimoires/loa/sdd.md](grimoires/loa/sdd.md) | Frozen — historical. |
| Cycle-001 sprint plan | [grimoires/loa/sprint.md](grimoires/loa/sprint.md) | Frozen — historical. |
| NOTES.md | [grimoires/loa/NOTES.md](grimoires/loa/NOTES.md) | Append-only with explicit cycle-002 prefix; do not rewrite cycle-001 entries. |
| Sprint folders 0-7 | [grimoires/loa/a2a/sprint-{0..7}/](grimoires/loa/a2a/) | Frozen. NO rename/mutate/continue. |
| Trajectory log | [grimoires/loa/a2a/trajectory/](grimoires/loa/a2a/trajectory/) | Append-only across cycles. |
| README closeout artifacts | [readme-audit-v0.2.0.md](grimoires/loa/a2a/readme-audit-v0.2.0.md), [readme-patch-v0.2.0.md](grimoires/loa/a2a/readme-patch-v0.2.0.md) | Frozen. |
| **Calibration manifest** | **[grimoires/loa/calibration/corona/calibration-manifest.json](grimoires/loa/calibration/corona/calibration-manifest.json)** (693 lines, 30 entries) | **Frozen unless Sprint 0 / Sprint 3 explicitly authorizes a re-anchor**. Re-anchor strategy = additive new revision OR new file `calibration-manifest.cycle-002.json` (Open Q4). NOT in-place mutation. |
| Calibration protocol | [grimoires/loa/calibration/corona/calibration-protocol.md](grimoires/loa/calibration/corona/calibration-protocol.md) (523 lines) | Frozen — Sprint 2 closure. |
| Empirical evidence | [grimoires/loa/calibration/corona/empirical-evidence.md](grimoires/loa/calibration/corona/empirical-evidence.md) | Frozen — Sprint 4 closure. |
| Security review | [grimoires/loa/calibration/corona/security-review.md](grimoires/loa/calibration/corona/security-review.md) | Frozen — Sprint 6 closure. |
| Theatre authority | [grimoires/loa/calibration/corona/theatre-authority.md](grimoires/loa/calibration/corona/theatre-authority.md) | Frozen unless Sprint 4 T3/T5 posture decision authorizes addendum. |
| Cycle-001 corpus | [grimoires/loa/calibration/corona/corpus/primary/](grimoires/loa/calibration/corona/corpus/primary/), `secondary/` | **Frozen** — corpus_hash `b1caef3f…11bb1` invariant must hold. |
| Cycle-001 runs | `run-1/`, `run-2/`, `run-3-final/` under [grimoires/loa/calibration/corona/](grimoires/loa/calibration/corona/) | Frozen. Cycle-002 emits to `cycle-002-run-1/` (NEW). |
| BFZ | [BUTTERFREEZONE.md](BUTTERFREEZONE.md) | Cycle-001 closeout snapshot — do not rewrite; cycle-002 changes need explicit additive framing only at cycle-002 closeout. |
| Runtime parameters | All `flareThresholdProbability`, `kpThresholdProbability`, `buildCMEArrivalUncertainty`, T4 Wheatland λ, base_rates | Frozen until harness sensitivity proven (Sprint 5 prerequisite for any refit). |
| Settlement authority semantics | [src/processor/settlement.js](src/processor/settlement.js) | Frozen — ground_truth / provisional_mature / cross_validated / provisional / degraded classes are the construct's contract surface. |
| Zero-dependency posture | [package.json](package.json) `dependencies: {}` | Frozen. NO new runtime deps in cycle-002. |
| L2 publish language | README / BFZ | Frozen — do not weaken or strengthen "L1-tested" / "calibration-attempted" framing without binding evidence. |
| RLMF certificate format | [src/rlmf/certificates.js](src/rlmf/certificates.js) (cert `version: '0.1.0'`, schema, brier formulas, position_history shape) | **Frozen by default**. In-scope only if Open Q1 = "in-scope" — then Sprint 0 owns the version-bump migration note. |
| Brier export semantics | `brierScoreBinary`, `brierScoreMultiClass` in `src/rlmf/certificates.js`; per-theatre Brier in `scripts/corona-backtest/scoring/*` | Frozen unless Open Q1 changes posture. Backtest can extend its own scoring inputs (predictedDistribution) without changing Brier formula. |
| Manifest regression gate | [tests/manifest_regression_test.js](tests/manifest_regression_test.js), [tests/manifest_structural_test.js](tests/manifest_structural_test.js) | Re-anchor only via Sprint 0/3 explicit authorization (Open Q4); NOT silent test edits. |
| v3 schema commit | [schemas/construct.schema.json](schemas/construct.schema.json) `b98e9ef`, [construct.yaml](construct.yaml) | Frozen. |

---

## 9. Proposed new artifact paths under cycle-002 namespace

| Path | Purpose | Sprint |
|------|---------|--------|
| `grimoires/loa/a2a/cycle-002/PLANNING-FRAME.md` | This document | (now) |
| `grimoires/loa/a2a/cycle-002/OPEN-QUESTIONS.md` | Ranked unresolved questions | (now) |
| `grimoires/loa/a2a/cycle-002/sprint-00/` | Sprint 0 charter, freeze ratification, P0 answers | Sprint 0 |
| `grimoires/loa/a2a/cycle-002/sprint-01/` | Sprint 1 PredictionTrajectory contract | Sprint 1 |
| `grimoires/loa/a2a/cycle-002/sprint-02/` | Sprint 2 deterministic replay seam | Sprint 2 |
| `grimoires/loa/a2a/cycle-002/sprint-03/` | Sprint 3 T1/T2/T4 wiring | Sprint 3 |
| `grimoires/loa/a2a/cycle-002/sprint-04/` | Sprint 4 T3/T5 posture | Sprint 4 |
| `grimoires/loa/a2a/cycle-002/sprint-05/` | Sprint 5 sensitivity proof | Sprint 5 |
| `grimoires/loa/a2a/cycle-002/sprint-06/` | Sprint 6 closeout | Sprint 6 |
| `grimoires/loa/calibration/corona/cycle-002-run-1/` (NEW under calibration tree) | First cycle-002 backtest run output | Sprint 3 |
| `grimoires/loa/calibration/corona/calibration-manifest.cycle-002.json` (proposed; Sprint 0 confirms) | Cycle-002 manifest re-anchor (additive) | Sprint 0 / Sprint 3 |

(Cycle-001 namespace `grimoires/loa/a2a/sprint-0/`..`sprint-7/` remains untouched — cycle-002 sprints use `sprint-00/`..`sprint-06/` (zero-padded) inside the new namespace, eliminating any naming collision risk even if a flat `grep -r sprint-` is run later.)

---

## 10. Calibration manifest — exact path and freeze posture

**Path**: `grimoires/loa/calibration/corona/calibration-manifest.json` (693 lines, 30 entries).

**Freeze posture**:

- Manifest values: **frozen**. No in-place edits to `current_value`, `confidence`, `verification_status`, `provisional`, `evidence_source`, etc.
- Manifest hashes (`corpus_hash`, `script_hash` per entry): currently anchored to Run-3-final. Will need re-anchoring once cycle-002 changes ripple `script_hash`. Re-anchor strategy is Open Q4.
- Recommended additive strategy (subject to Q4): commit a NEW file `grimoires/loa/calibration/corona/calibration-manifest.cycle-002.json` (or `manifest-revisions/cycle-002.json`) carrying cycle-002 hashes, leaving the cycle-001 manifest immutable.
- `inline_lookup.match_pattern` regexes: any cycle-002 runtime edit MUST keep these regex matches green or explicitly migrate the manifest entry. A regex collision is a Sprint 0 / Sprint 2 hazard.

---

## 11. RLMF certificate / Brier export implications

See §4 for detail. Default posture for cycle-002:

- Cert format **frozen** at `version: '0.1.0'`.
- Bucket-shape adaptation lives in backtest scoring/* (or a new `scripts/corona-backtest/adapters/`), NOT in `src/`.
- Backtest's Brier formula stays local; it is NOT shared with `src/rlmf/certificates.js`.
- Cycle-002 closeout doc must explicitly state "RLMF certificate format unchanged in cycle-002" OR "RLMF certificate version bumped from 0.1.0 → 0.2.0; migration: …".
- If any Sprint 4 T3/T5 posture decision pulls runtime detection-trace into cert serialization, the version-bump path engages — Sprint 4 owns surfacing this.

---

## 12. Evidence required to prove success

| Claim | Required evidence | Owner sprint |
|-------|-------------------|--------------|
| **runtime-wired** | A non-trivial runtime-state change (e.g., flipping one ingested bundle's payload) produces a deterministic, non-zero delta in the per-theatre report numerics for at least one of T1, T2, T4. | Sprint 3 |
| **runtime-sensitive** (= STRONG SUCCESS) | Two-direction test: (a) controlled perturbation of one runtime parameter (Open Q8 chooses which) changes the cycle-002 backtest score by a measurable amount; (b) reverting the perturbation restores the prior score byte-identically. The report MUST show the diff and the revert, with corpus_hash invariant preserved across both. | Sprint 5 |
| **calibration-improved** | All three: (i) Sprint 3 cycle-002-run-1 score on T1/T2/T4 BETTER than the predeclared cycle-002 baseline (per Open Q6); (ii) regression gate green (manifest, structural, security tests); (iii) honest-framing grep clean on closeout docs. Run 1 = Run 2 byte-identical (replay determinism). | Sprint 6 |
| **L2 publish-ready** | All FIVE: (1) trajectory scoring landed (Sprint 3); (2) deterministic replay landed (Sprint 2); (3) manifest/provenance updates ratified (Sprint 0/3); (4) honest theatre-specific settlement posture documented for T3/T5 (Sprint 4); (5) downstream RLMF/Brier export implications resolved per Q1 (Sprint 0/6). All 4 prior claims met. | Sprint 6 (gate) |

**Discipline carry-forward (binding)**: Do NOT claim "calibration-improved" merely because composite verdict moves from `fail` to `pass`. The composite verdict is a function of corpus characteristics (5 events/theatre, observed_count=0 in 5/6 buckets); a verdict flip without a sensitivity-proof artifact would be a false claim. The cycle-001 honest-framing memory binding applies in full to cycle-002.

---

## 13. Cross-references

- Cycle-001 PRD: [grimoires/loa/prd.md](grimoires/loa/prd.md)
- Cycle-001 SDD: [grimoires/loa/sdd.md](grimoires/loa/sdd.md)
- Cycle-001 sprint plan: [grimoires/loa/sprint.md](grimoires/loa/sprint.md)
- Run-3-final delta-report: [grimoires/loa/calibration/corona/run-3-final/delta-report.md](grimoires/loa/calibration/corona/run-3-final/delta-report.md)
- Calibration manifest: [grimoires/loa/calibration/corona/calibration-manifest.json](grimoires/loa/calibration/corona/calibration-manifest.json)
- Calibration protocol: [grimoires/loa/calibration/corona/calibration-protocol.md](grimoires/loa/calibration/corona/calibration-protocol.md)
- BFZ snapshot: [BUTTERFREEZONE.md](BUTTERFREEZONE.md)
- Open questions: [grimoires/loa/a2a/cycle-002/OPEN-QUESTIONS.md](grimoires/loa/a2a/cycle-002/OPEN-QUESTIONS.md)
