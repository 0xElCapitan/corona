# CORONA cycle-002 — Sprint 06 CLOSEOUT

**Status**: Cycle-002 closeout document. Docs-only deliverable.
**Authored**: 2026-05-28
**Cycle / Sprint**: cycle-002 / sprint-06
**Routing**: cycle-002 [SPRINT-LEDGER.md](../SPRINT-LEDGER.md). Binding spec = the existing cycle-002 doc set (PRD, SDD, sprint plan §4.4, T3-T5-POSTURE §4, Sprint 05 closeout). No separate sprint-06 spec doc — consistent with the Sprint 03 / Sprint 05 operator-ratified precedent.
**Base commit**: `70fd2da` (Sprint 05 content commit `424cac2` + one framework-maintenance chore `70fd2da`; the chore touched none of `src/`, `scripts/`, the calibration tree, the cycle-002 namespace, `README.md`, `BUTTERFREEZONE.md`, or `package.json`).
**Published version**: `v0.2.0` — unchanged. No tag, no version bump (not authorized at the earned rung).

> This document closes CORONA cycle-002, framed honestly against the rung the cycle actually earned. Closeout language is bound to evidence, never to aspiration. The cycle-001 honest-framing memory binding — "calibration-attempted, not improved" — governs in full and is carried forward unweakened. Cross-regime "uplift" framing is forbidden ([CHARTER §8.2](../sprint-00/CHARTER.md), [PRD §9 #8](../PRD.md)).

---

## 1. Earned rung

Cycle-002 earned **Rung 2 (runtime-sensitive)** and no higher. Source of truth: [CHARTER §10](../sprint-00/CHARTER.md) claim ladder; Sprint 05 audit verdict [sprint-05/auditor-sprint-feedback.md](../sprint-05/auditor-sprint-feedback.md) ("AUDIT PASSED ... Sprint 05 earns Rung 2 (runtime-sensitive) for T4").

| Rung | Name | Status | Basis |
|---|---|---|---|
| 1 | runtime-wired | **EARNED** | Sprint 02 (T4 trajectory ≠ `UNIFORM_PRIOR`, replay-twice byte-identical) + Sprint 03 (entrypoint wires T1/T2/T4) |
| 2 | runtime-sensitive | **EARNED (T4 only)** | Sprint 05 two-direction T4 perturbation test (real runtime injection) |
| 3 | calibration-improved | **NOT earned** | No refit performed (no-refit covenant held); no post-refit T4 Brier strictly below Baseline B |
| 4 | L2 publish-ready | **NOT earned** | Gated on Rung 3 |

**T4 `[runtime-bucket]` earned runtime-sensitive (Rung 2).** Runtime sensitivity is **not** generalized to T1, T2, T3, or T5. T1/T2 sensitivity was explicitly out of scope (corpus-shape-foreclosed); T3/T5 are diagnostic-only.

---

## 2. Evidence walk (Sprints 02 → 05)

| Sprint | What landed | Rung effect | Tests |
|---|---|---|---|
| 02 — replay seam | Deterministic replay seam (`scripts/corona-backtest/replay/*`), default-preserving clock injection, threshold-native binary Brier for T1/T2. T4 trajectory proven materially different from `UNIFORM_PRIOR`; replay-twice byte-identical. | T4 Rung 1; T1/T2 Rung 1 narrow (prior-only) | 261/261 |
| 03 — entrypoint + manifest | New cycle-002 entrypoint `scripts/corona-backtest-cycle-002.js`; additive manifest with `replay_script_hash`; **Baseline B anchored**; two-summary reporting. Cycle-001 entrypoint byte-frozen. | Rung 1 entrypoint-wired (T4 + T1/T2 narrow) | 279/279 |
| 04 — T3/T5 posture | T3 `[external-model]` and T5 `[quality-of-behavior]` locked as diagnostic-only (Option A; no T5 trajectory emit, no `src/` touch). | No rung (posture lock) | 279/279 |
| 05 — sensitivity proof | T4 two-direction perturbation test via real runtime injection (`lambdaScalar`); Direction A moves T4 Brier, Direction B restores byte-identically. One default-preserving `src/theatres/proton-cascade.js` edit (operator-authorized); `PRODUCTIVITY_PARAMS` literals unchanged. | **T4 Rung 2** | 296/296 |

Theatre summary going into closeout:

- **T4 `[runtime-bucket]`** — runtime-wired **and** runtime-sensitive. The clean owned-uplift theatre.
- **T1 `[runtime-binary]` / T2 `[runtime-binary]`** — runtime-wired but **prior-only** on the current cycle-001 corpus shape. The corpus lacks pre-cutoff time-series (no GOES X-ray series for T1; no per-3hr Kp series for T2); `replay_T{1,2}_event` invoke `createX` once and never call `processX`, so `current_position_at_cutoff` equals the runtime `base_rate` constant. Source: [sprint-02/reviewer.md](../sprint-02/reviewer.md) M2 Executive Summary lines 456–464, carried forward verbatim.
- **T3 `[external-model]` / T5 `[quality-of-behavior]`** — posture-locked as diagnostic-only ([sprint-04/T3-T5-POSTURE.md](../sprint-04/T3-T5-POSTURE.md)). Scoring paths unchanged (Q2/Q3 freezes).

---

## 3. Baseline regime separation (NOT an uplift comparison)

Two baselines exist, in **two different scoring regimes**. They are presented below under separate labeled regime columns. **They are not blended, and no cross-column delta is computed or implied.** Cross-regime comparison as "uplift" is forbidden ([CHARTER §8.2](../sprint-00/CHARTER.md)).

- **Baseline A** = cycle-001 uniform-prior / corpus-annotated baseline. Source: [run-3-final/summary.md](../../../calibration/corona/run-3-final/summary.md). T1/T2/T4 scored with a **6-bucket Brier under a `UNIFORM_PRIOR` no-information floor**.
- **Baseline B** = cycle-002 runtime-replay baseline anchored at Sprint 03 close at cycle-001 parameter values (no refit). Source: [cycle-002-run-1/runtime-uplift-summary.md](../../../calibration/corona/cycle-002-run-1/runtime-uplift-summary.md) + [diagnostic-summary.md](../../../calibration/corona/cycle-002-run-1/diagnostic-summary.md). T1/T2 scored with **threshold-native binary Brier**; T4 scored with **runtime-bucket Brier** consuming the runtime trajectory.

| Theatre | Baseline A — cycle-001 regime `[uniform-prior, 6-bucket / corpus-annotated]` | Baseline B — cycle-002 regime `[runtime-replay]` |
|---|---|---|
| T1 | 6-bucket Brier `0.1389` (uniform-prior no-information floor) | binary Brier `0.7225` `[runtime-binary]`, prior-only |
| T2 | 6-bucket Brier `0.1389` (uniform-prior no-information floor) | binary Brier `0.8100` `[runtime-binary]`, prior-only (excl no-Kp: 0) |
| T3 | MAE `6.76h`, ±6h hit `40.0%` | MAE `6.76h`, ±6h hit `40.0%` `[external-model]`, diagnostic-only |
| T4 | 6-bucket Brier `0.1600` (uniform-prior no-information floor) | bucket Brier `0.3818` (`0.38183588`) `[runtime-bucket]`, runtime-wired |
| T5 | FP `25.0%`, p50 `90.0s`, switch `100.0%` | FP `25.0%`, p50 `90.0s`, switch `100.0%` `[quality-of-behavior]`, diagnostic-only |

**Why the columns are non-comparable (binding caption):**

1. The Baseline A T1/T2/T4 Brier values are **uniform-prior no-information floors** — the score of *not committing to a prediction*. A uniform prior spread across 6 buckets produces a deceptively low Brier on this corpus shape. It measures the absence of a model, not calibration quality.
2. The Baseline B T1/T2/T4 values are produced by CORONA's runtime trajectories under a **different scoring method** (binary for T1/T2; runtime-bucket for T4).
3. Because the two columns use different scoring methods, the lower Baseline A numbers are an **artifact of the no-information floor**, not evidence that cycle-001 "scored better." Conversely, the higher Baseline B numbers are **not** a regression. **No row-wise delta between the columns is interpretable, and none is presented as uplift in either direction.**
4. T3 and T5 numerics are **byte-identical** across both columns because their scoring paths are unchanged in cycle-002 (Q2/Q3 freezes; same scorers). They are diagnostic-only in both regimes.

---

## 4. T4 sensitivity evidence (Rung 2)

The Sprint 05 two-direction test ([sprint-05/reviewer.md](../sprint-05/reviewer.md); [sprint-05/auditor-sprint-feedback.md](../sprint-05/auditor-sprint-feedback.md); manifest [`sensitivity_proof`](../../../calibration/corona/cycle-002/runtime-replay-manifest.json)) perturbs one T4 runtime knob (`PRODUCTIVITY_PARAMS` Wheatland λ) via real runtime injection (`lambdaScalar`), flowing through the runtime path before the trajectory is produced:

| Direction | Mechanism | T4 Brier | Δ vs Baseline B | Trajectory hashes (5 T4 events) |
|---|---|---|---|---|
| Baseline B (cycle-002-run-1) | `lambdaScalar` implicit `1.0` | `0.38183588` | — | run-1 anchor |
| Direction A (cycle-002-run-2) | `lambdaScalar = 1.25` | `0.39533664` | `+0.01350076` | **5/5 differ** from Baseline B |
| Direction B (cycle-002-run-3) | `lambdaScalar = 1.0` (default) | `0.38183588` | `+0.00000000` | **5/5 byte-identical** to run-1 anchor |

- The perturbation flows `replay_T4_event(..., { lambdaScalar })` → `createProtonEventCascade` → `estimateExpectedCount(..., lambdaScalar)` → `lambda = params.lambda * lambdaScalar`, and every `processProtonEventCascade` blend uses the perturbed prior. Scoring consumes the runtime trajectory output directly (no post-runtime distribution substitution).
- **Direction A** moved the T4 Brier by a documented, measurable amount (`+0.01350076`, above the `0.01` floor) and changed all 5/5 T4 runtime trajectory hashes.
- **Direction B** restored Baseline B **byte-identically** — aggregate Brier `0.38183588` and all 5/5 per-event trajectory hashes match the run-1 anchor. The `src/` edit is genuinely default-preserving.
- `corpus_hash = b1caef3f…11bb1` invariant preserved across run-1 / run-2 / run-3.

**Claim earned, and the only claim made here: T4 runtime sensitivity demonstrated** (Rung 2, runtime-sensitive). Nothing beyond this is claimed for T4.

---

## 5. Summary discipline (two summaries, carried into closeout)

Per the two-summary discipline ([CHARTER §4.1](../sprint-00/CHARTER.md) operator amendment 1; [SDD §4](../SDD.md)): a CORONA-owned runtime-scope summary (T1+T2+T4 only) and a full-picture diagnostic summary (all five, tagged `[diagnostic]`) are kept separate and never conflated.

### 5.1 CORONA-owned runtime-scope summary — T1 + T2 + T4 only

This summary states **runtime wiring** (T1/T2/T4) and **T4 runtime sensitivity** (Rung 2). It is **not** a predictive-uplift, calibration-improved, empirical-performance, or L2 claim.

| Theatre | Posture | Baseline B metric | Rung status |
|---|---|---|---|
| T4 | `[runtime-bucket]` | bucket Brier `0.3818` (`0.38183588`) | runtime-wired (Rung 1) + runtime-sensitive (Rung 2) |
| T1 | `[runtime-binary]` | binary Brier `0.7225` | runtime-wired (Rung 1), prior-only |
| T2 | `[runtime-binary]` | binary Brier `0.8100` | runtime-wired (Rung 1), prior-only |

### 5.2 Full-picture diagnostic summary `[diagnostic]` — all five theatres

T3 and T5 are reported here for transparency only. **They do not count toward CORONA-owned predictive uplift.**

| Theatre `[diagnostic]` | Primary metric `[diagnostic]` | Secondary metric `[diagnostic]` |
|---|---|---|
| T1 `[runtime-binary]` | binary Brier `0.7225` | scoring path `t1_binary_brier_cycle002` |
| T2 `[runtime-binary]` | binary Brier `0.8100` | excl no-Kp: 0 |
| T3 `[external-model]` | MAE `6.76h` | ±6h hit-rate `40.0%` — diagnostic-only |
| T4 `[runtime-bucket]` | bucket Brier `0.3818` | scoring path `t4_bucket_brier_runtime_wired_cycle002` |
| T5 `[quality-of-behavior]` | FP rate `25.0%` | p50 stale-feed `90.0s`, switch handled `100.0%` — diagnostic-only |

---

## 6. Binding honest-framing sentences (verbatim — [sprint-04/T3-T5-POSTURE.md §4](../sprint-04/T3-T5-POSTURE.md))

The following four sentences are reproduced verbatim and may not be weakened:

> T3 [external-model] is not counted toward CORONA-owned predictive uplift.

> T5 [quality-of-behavior] is not counted toward CORONA-owned predictive uplift.

> Cycle-002 runtime-uplift claims are restricted to T1/T2/T4, with T4 as the clean owned-uplift theatre.

> T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape and cannot claim calibration improvement in cycle-002.

---

## 7. Mandatory audit notes ([PRD §10.5](../PRD.md))

> RLMF certificate format (src/rlmf/certificates.js version: '0.1.0') unchanged in cycle-002.

> Cycle-001 calibration manifest corpus_hash = b1caef3f…11bb1 and script_hash = 17f6380b…1730f1 unchanged across cycle-002.

---

## 8. Forbidden claims — explicit negations (cycle-002 does NOT make these)

To bind the honest-framing perimeter, this closeout records, as explicit negations, the claims cycle-002 does **not** make:

- Cycle-002 makes **no calibration-improved claim** (no Rung 3 evidence; no refit was performed).
- Cycle-002 makes **no L2 publish-ready claim** (no Rung 4 evidence).
- Cycle-002 makes **no forecasting accuracy improvement claim**.
- Cycle-002 makes **no empirical performance improvement claim**.
- Cycle-002 makes **no verifiable track record claim**.
- Cycle-002 makes **no T1/T2 calibration-improved claim** (corpus-shape-foreclosed).
- Cycle-002 makes **no T1/T2 runtime-sensitivity claim** (only T4 earned runtime sensitivity).
- Cycle-002 makes **no T3/T5 predictive uplift claim** (`[external-model]` / `[quality-of-behavior]`; Q2/Q3 freezes).
- Cycle-002 makes **no Baseline A vs Baseline B uplift comparison** (different scoring regimes; cross-regime comparison is meaningless per [CHARTER §8.2](../sprint-00/CHARTER.md)).

The cycle-001 "calibration-attempted, not improved" posture stands, unweakened. No cycle-001 closeout language, manifest, run output, or README/BUTTERFREEZONE text was altered by cycle-002.

---

## 9. Frozen-invariant verification (at base commit `70fd2da`)

| Invariant | Expected | Status |
|---|---|---|
| `scripts/corona-backtest.js` sha256 | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` | ✓ unchanged |
| cycle-001 `calibration-manifest.json` sha256 | `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` | ✓ unchanged |
| `corpus_hash` | `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` | ✓ unchanged |
| RLMF cert `src/rlmf/certificates.js` `version` | `'0.1.0'` | ✓ unchanged |
| `package.json` `version` | `0.2.0` | ✓ no bump |
| Annotated tag | none | ✓ none created |

---

## 10. Cycle-002 closeout status

Cycle-002 closes at **Rung 2 (runtime-sensitive, T4)**. CORONA's runtime prediction trajectories now feed the backtest scoring path for T1/T2/T4, and the T4 harness is proven sensitive to a runtime parameter change in both directions. That is the full extent of what cycle-002 earned.

- **Published version remains `v0.2.0`.** No tag, no version bump — the earned rung does not authorize a release (a `v0.3.0` tag would require Rung 4 + explicit operator authorization, neither of which exists).
- **README.md and BUTTERFREEZONE.md were intentionally left untouched.** At Rung 2 the additive cycle-002 closeout section is not warranted (the full additive section is reserved for Rung 3/4 per sprint plan §4.4.2.2); the public v0.2.0 documentation surface is preserved.
- **Engineering is complete.** This is a docs-only closeout artifact. The `/review-sprint sprint-06` → `/audit-sprint sprint-06` → `COMPLETED` → operator commit gate are subsequent operator-gated steps, not performed here.

---

*CORONA cycle-002 Sprint 06 closeout authored 2026-05-28. Earned rung: Rung 2 (runtime-sensitive, T4). Frozen invariants verified intact at `70fd2da`. Cycle-001 honest-framing memory binding governs; no laundered claims, no cross-regime baseline comparison, no calibration-improved / L2 publish-ready / forecasting accuracy / empirical performance improvement / verifiable track record assertion. Published version v0.2.0 unchanged. No commit, tag, or release performed by this artifact.*
