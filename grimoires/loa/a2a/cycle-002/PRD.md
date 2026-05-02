# CORONA cycle-002 — Product Requirements Document (synthesis)

**Status**: cycle-level synthesis PRD. Consolidates already-ratified cycle-002 decisions; does NOT invent new scope.
**Authored**: 2026-05-01
**Cycle**: cycle-002 (post-Sprint-02 commit `c9535386`; sprint plan commit `da53606`).
**Anchor (cycle-001 ref state)**: `corpus_hash = b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1`; `script_hash = 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1`; v0.2.0 final tag `adf53ff`.

> This PRD is a synthesis document. It distills the binding decisions in [sprint-00/CHARTER.md](sprint-00/CHARTER.md), [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md), [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md), [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md), and [PLANNING-FRAME.md](PLANNING-FRAME.md) into a single cycle-level reference. When this document and any of those canonical sources appear to disagree, the canonical sources are authoritative. The cycle-001 PRD at [grimoires/loa/prd.md](../../prd.md) is FROZEN historical and is NOT a target for this PRD.

---

## 1. Problem statement

CORONA cycle-001 produced a calibration backtest harness whose scoring path is **structurally disconnected** from the construct's runtime prediction state ([PLANNING-FRAME §1](PLANNING-FRAME.md)):

- T1, T2, T4 scoring used `UNIFORM_PRIOR` no-information baselines.
- T3 read `wsa_enlil_predicted_arrival_time` directly from the corpus — that is NASA DONKI's prediction, not CORONA's.
- T5 settled quality-of-behavior on corpus signals + bulletins.

Consequence (recorded in [run-3-final/delta-report.md:50-54](../../calibration/corona/run-3-final/delta-report.md)): Run 1 = Run 2 = Run-3-final by architectural reality. Any future runtime parameter change cannot demonstrate predictive uplift on this harness. Cycle-001 closed at v0.2.0 with the explicit "calibration-attempted, not improved" honest-framing posture.

**The problem cycle-002 addresses**: until CORONA's runtime prediction trajectories actually feed the backtest scoring path, "calibration improvement" cannot be measured. Cycle-002 wires the seam.

---

## 2. Cycle-002 mission

> Make CORONA's backtest score CORONA's runtime predictions.

Verbatim from [PLANNING-FRAME.md](PLANNING-FRAME.md), [sprint-00/CHARTER.md §2.1](sprint-00/CHARTER.md), [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md). Cycle-002 is a **measurement-seam cycle**, not a parameter-refit cycle, not an L2-publish cycle, not a release-hygiene cycle.

---

## 3. Users / stakeholders

| Stakeholder | Role | Interest |
|---|---|---|
| **Operator** (project owner) | Sole HITL gate-holder; ratifies charter / contract / design / spec / commit at every sprint boundary. | Honest framing; binding evidence; auditable cycle-001 freeze; provenance for cycle-002 additions. |
| **CORONA construct itself** | The system under measurement. | Runtime trajectories actually scored; cert format unchanged for downstream RLMF compatibility. |
| **RLMF certificate consumers** (downstream Echelon RLMF pipeline) | Consume `src/rlmf/certificates.js` `version: '0.1.0'` outputs. | Cert schema, fields, formulas, position_history shape MUST stay byte-identical through cycle-002 (cert frozen by Q1). |
| **Future-cycle reviewer** | Reads cycle-002 closeout artifacts months later. | Two-summary discipline; theatre-tagged claims; honest-framing grep gate clean; no laundered "calibration-improved" claims. |
| **Cycle-001 reproducibility lane** (not a person; a binding invariant) | The v0.2.0 reproducibility claim. | `corpus_hash` + `script_hash` + cycle-001 manifest + run-{1,2,3-final}/ output unchanged across all of cycle-002. |
| **Honest-framing memory binding** (cycle-001 carryover) | The cycle-level discipline that closed v0.2.0. | "Calibration-attempted, not improved" framing preserved; cycle-002 closeout artifacts subject to the honest-framing grep gate. |

---

## 4. In-scope (cycle-002)

Verbatim from [sprint-00/CHARTER.md §2.2](sprint-00/CHARTER.md):

- **PredictionTrajectory contract** — canonical boundary type per [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md). [shipped]
- **Deterministic replay clock seam** — default-preserving function-arg `now` injection per [sprint-00/CHARTER.md §7](sprint-00/CHARTER.md), [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md). [shipped Sprint 02]
- **T4 runtime-wired bucket scoring path** — runtime trajectory feeds existing `scoreCorpusT4`. [shipped Sprint 02 milestone 1]
- **T1/T2 binary runtime-wired scoring path** — NEW threshold-native binary Brier scoring; legacy 6-bucket scorers preserved as corpus-baseline diagnostics. [shipped Sprint 02 milestone 2; corpus shape forces prior-only trajectories — see §10 honest-framing rules]
- **Runtime replay entrypoint wiring** — [Sprint 03](CYCLE-002-SPRINT-PLAN.md#41-sprint-03--runtime-replay-entrypoint--additive-cycle-002-manifest) introduces a NEW cycle-002 entrypoint at `scripts/corona-backtest-cycle-002.js` that owns runtime replay dispatch, two-summary reporting, cycle-002 output directory creation, additive manifest generation, and the new `replay_script_hash` provenance field. The cycle-001 entrypoint at [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) stays **byte-frozen** — Sprint 03 does NOT edit it — so `script_hash = 17f6380b…1730f1` is preserved by construction. Editing `scripts/corona-backtest.js` is a hard stop unless explicitly authorized by the operator.
- **Loader cutoff split** (`loadCorpusWithCutoff`) — additive export per [sprint-01/CONTRACT.md §7.3](sprint-01/CONTRACT.md), [sprint-02/REPLAY-SEAM.md §6](sprint-02/REPLAY-SEAM.md); existing `loadCorpus` unchanged. [Sprint 03]
- **Two-summary reporting** — runtime-uplift composite (T1+T2+T4) + full-picture diagnostic (all 5) per [sprint-00/CHARTER.md §4.1](sprint-00/CHARTER.md) operator amendment 1. [Sprint 03]
- **Additive cycle-002 manifest** at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` carrying NEW `replay_script_hash` provenance field per [sprint-00/CHARTER.md §6](sprint-00/CHARTER.md), [sprint-02/reviewer.md "Provenance Note"](sprint-02/reviewer.md). [Sprint 03]
- **Cycle-002 baseline anchor** (Baseline B) at Sprint 03 close — runtime-replay numerics on the frozen corpus AT cycle-001 runtime parameter values; the binding comparator for any "calibration-improved" claim per [sprint-00/CHARTER.md §8](sprint-00/CHARTER.md).
- **T3 / T5 posture documentation** — locks "T3 [external-model], NOT counted toward predictive uplift" + "T5 [quality-of-behavior], NOT counted toward predictive uplift" framing for closeout artifacts per [sprint-00/CHARTER.md §4](sprint-00/CHARTER.md), [Q2/Q3](OPEN-QUESTIONS.md). [Sprint 04, default = Option A docs only]
- **Sensitivity proof on T4 (two-direction test)** — controlled perturbation of one T4 knob (e.g., `PRODUCTIVITY_PARAMS` / Wheatland λ); revert restores byte-identical Brier; perturbation diff documented per [sprint-00/CHARTER.md §10 Rung 2](sprint-00/CHARTER.md), [Q8](OPEN-QUESTIONS.md). [Sprint 05; fixture/injection preferred over `src/` mutation per [CYCLE-002-SPRINT-PLAN.md §4.3.1](CYCLE-002-SPRINT-PLAN.md)]
- **Cycle-002 closeout / honest framing** — closeout document; conditional README/BFZ additive cycle-002 sections; conditional v0.3.0 tag IFF Rung 4 earned. [Sprint 06]

---

## 5. Out-of-scope (cycle-002)

Verbatim from [sprint-00/CHARTER.md §2.3, §3.7](sprint-00/CHARTER.md):

- **Parameter refit** — runtime parameters stay at cycle-001 values until the harness is proven sensitive (Sprint 05 prerequisite). No-refit covenant ([CHARTER §8.3](sprint-00/CHARTER.md)) binds across the full cycle.
- **L2 publish-readiness** as an assumption — Rung 4 is gated by the success ladder; cycle-002 may earn it but does not assume it.
- **Release hygiene** — no CHANGELOG creation, no GitHub Release, no v0.3.0 bump on a vacuum claim. Tag posture is a Sprint 06 closeout question.
- **Schema / cert changes** — RLMF cert format frozen at `version: '0.1.0'`; v3 construct schema commit `b98e9ef` frozen.
- **Corpus expansion** — primary corpus stays 5 events/theatre. The "30-event corpus" idea is future-cycle.
- **T3 CORONA-prediction emission** — Q2 freeze.
- **T5 probabilistic-uplift conversion** — Q3 freeze.
- **Promoting any calibration-manifest entry** from `ENGINEER_CURATED_REQUIRES_VERIFICATION` / `OPERATIONAL_DOC_ONLY` / `HYPOTHESIS_OR_HEURISTIC` → `VERIFIED_FROM_SOURCE`.
- **New runtime dependencies** — `package.json dependencies: {}` invariant.
- **Test framework changes** — still `node --test`.
- **Larger T1/T2 6-bucket calibration framing** — bucket-projection escape hatch ([CHARTER §9.4](sprint-00/CHARTER.md)) is gated and not active in cycle-002.

---

## 6. Success criteria (rung-aligned)

Cycle-002 success is rung-aligned, not boolean. The cycle earns a rung when ALL conditions on that rung are met. Higher rungs do NOT skip lower rungs. Closeout language binds to the rung actually earned.

| Rung | Name | Earned when |
|---|---|---|
| 1 | runtime-wired | Replay seam exists; replay-twice byte-identical; ≥1 theatre's runtime trajectory differs materially from the no-information baseline; 160 cycle-001 tests still green; cycle-001 manifest unchanged. |
| 2 | runtime-sensitive | Rung 1 + a controlled perturbation of one T4 knob changes T4 Brier by a measurable amount; reverting restores byte-identical Brier; perturbation diff documented; corpus_hash invariant preserved. |
| 3 | calibration-improved (gated) | Rung 2 + post-refit T4 Brier strictly less than Baseline B on the frozen corpus; cycle-002 manifest re-anchored to post-refit `replay_script_hash`; structural+regression gates green; honest-framing grep gate clean. NEVER bare; always theatre-qualified. |
| 4 | L2 publish-ready (gated) | Rung 3 + trajectory scoring landed for T4 (mandatory) and T1/T2 (only if pre-cutoff time-series corpus exists); honest theatre-specific posture documented for T3+T5; RLMF cert frozen note in closeout; README+BFZ additive cycle-002 sections; tag posture decided. |

Source of truth: [sprint-00/CHARTER.md §10](sprint-00/CHARTER.md). Repeated in [CYCLE-002-SPRINT-PLAN.md §3](CYCLE-002-SPRINT-PLAN.md) for sprint routing.

---

## 7. Claim ladder (binding)

The success criteria above ARE the claim ladder. Closeout artifacts may use the language listed below ONLY when the rung is earned, ONLY with the theatre qualifier, and ONLY citing Baseline B (the cycle-002 replay baseline).

| Rung | Allowed claim | Forbidden absent rung |
|---|---|---|
| 1 — runtime-wired | "cycle-002 wired runtime prediction trajectories into the T<N> scoring path." | "calibration-improved", "predictive uplift demonstrated", any non-T<N> generalization. |
| 2 — runtime-sensitive | "cycle-002 demonstrated harness sensitivity to runtime parameter changes for T4 (two-direction test green)." | Generalization to T1/T2 absent a separate two-direction test on a T1/T2 knob AND a corpus that exercises T1/T2 process* paths. |
| 3 — calibration-improved | "T<N> calibration-improved vs cycle-002 replay baseline." | Bare "calibration-improved"; extension to T3 (Q2 forbids) or T5 (Q3 forbids). |
| 4 — L2 publish-ready | "L2 publish-ready" with theatre list and Baseline B comparison table. | Bare "L2 publish-ready" without qualifying list. |

The honest-framing grep gate ([§10 below](#10-honest-framing-rules)) is the closeout-time enforcement.

---

## 8. Theatre posture (binding)

Source of truth: [sprint-00/CHARTER.md §4](sprint-00/CHARTER.md), [sprint-01/CONTRACT.md §5](sprint-01/CONTRACT.md). Posture tags appear verbatim in cycle-002 reports.

| Theatre | Tag | Runtime emits | Cycle-002 scoring path | Counts toward runtime-uplift composite? |
|---|---|---|---|---|
| **T1** Flare Class Gate | `[runtime-binary]` | scalar `current_position` ∈ [0,1] | NEW threshold-native binary Brier ([scoring/t1-binary-brier.js](../../../../scripts/corona-backtest/scoring/t1-binary-brier.js)). Legacy 6-bucket frozen as corpus-baseline diagnostic. | YES (Rung 1 narrow form earned; Rung 3 corpus-shape-foreclosed for cycle-002). |
| **T2** Geomag Storm Gate | `[runtime-binary]` | scalar `current_position` ∈ [0,1] | NEW threshold-native binary Brier ([scoring/t2-binary-brier.js](../../../../scripts/corona-backtest/scoring/t2-binary-brier.js)). Legacy 6-bucket frozen. GFZ-preferred outcome. | YES (same posture as T1). |
| **T3** CME Arrival | `[external-model]` / `[diagnostic]` | scalar `current_position` (CORONA wraps WSA-Enlil with uncertainty pricing). | UNCHANGED. [scoring/t3-timing-error.js](../../../../scripts/corona-backtest/scoring/t3-timing-error.js) scores corpus's WSA-Enlil prediction against L1 observation. CORONA's T3 `current_position` is NOT consumed by cycle-002 scoring. | NO. T3 is reported in the diagnostic summary only and tagged `[external-model]` to prevent misattribution. |
| **T4** Proton Event Cascade | `[runtime-bucket]` | array of 5 (Poisson over BUCKETS). | WIRED. [scoring/t4-bucket-brier.js](../../../../scripts/corona-backtest/scoring/t4-bucket-brier.js) consumes runtime trajectory's `current_position_at_cutoff` array directly. | YES. Primary uplift evidence theatre. First sensitivity-proof target. |
| **T5** Solar Wind Divergence | `[quality-of-behavior]` / `[diagnostic]` | scalar `current_position` + detection state. | UNCHANGED. [scoring/t5-quality-of-behavior.js](../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js) continues quality-of-behavior settlement (FP rate / p50 / switch-handled / hit-rate-diagnostic). Sprint 04 default = Option A (no T5 trajectory emitted). | NO. Quality-of-behavior is the canonical settlement; converting to probabilistic uplift is forbidden by Q3. |

**Two-summary discipline** ([CHARTER §4.1](sprint-00/CHARTER.md)): every cycle-002 backtest report MUST emit (1) a runtime-uplift composite over T1+T2+T4 only, and (2) a full-picture diagnostic summary over all 5 theatres tagged `[diagnostic]`. The two summaries may not be conflated, blended, or implied to be the same artifact. Bare "composite verdict" is reserved for the runtime-uplift composite.

---

## 9. Non-goals (binding)

These constraints bind across the full cycle. Each is repeated here from its canonical source for ergonomic reference; the source is authoritative.

| # | Non-goal | Source |
|---|---|---|
| 1 | **No refit before sensitivity proof.** No runtime parameter change is permitted between Sprint 03 close (Baseline B anchor) and Sprint 05 start. Permanent runtime parameter change is forbidden under all options for the entirety of Sprints 03–05; refit (if any) is Rung 3 / future-cycle territory. | [CHARTER §8.3](sprint-00/CHARTER.md), [SPRINT-PLAN §4.3.1](CYCLE-002-SPRINT-PLAN.md) |
| 2 | **No RLMF certificate mutation.** [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) `version: '0.1.0'`, schema, brier formulas, position_history shape, calibration_bucket logic — all frozen verbatim through Sprint 06. | [CHARTER §1 Q1, §5](sprint-00/CHARTER.md) |
| 3 | **No cycle-001 manifest mutation.** [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) (693 lines, 30 entries, anchored to cycle-001 hashes) is immutable historical evidence. Cycle-002 adds an additive separate file at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`. | [CHARTER §6](sprint-00/CHARTER.md), [Q4](OPEN-QUESTIONS.md) |
| 4 | **No T3 / T5 predictive-uplift laundering.** T3 [external-model] and T5 [quality-of-behavior] numerics may not be cited as evidence of CORONA-owned predictive uplift, calibration-improved, or any rung above Rung 1. The two-summary discipline is the structural mitigation. | [CHARTER §4, §4.1, §1 Q2/Q3](sprint-00/CHARTER.md) |
| 5 | **No release / tag / version bump in Sprint 03.** v0.2.x stays the published version through Sprints 03–05. Tag posture is a Sprint 06 closeout decision and only enabled at Rung 4. v0.3.0 (if ever) is a fresh annotated tag, never a retag of v0.2.0. | [CHARTER §2.3, §3.7, §10 Rung 4](sprint-00/CHARTER.md), [SPRINT-PLAN §4.4](CYCLE-002-SPRINT-PLAN.md) |
| 6 | **No edits to cycle-001 artifacts.** Cycle-001 PRD, SDD, sprint plan, sprint folders, run outputs (`run-1/`, `run-2/`, `run-3-final/`), corpus, calibration-protocol, empirical-evidence, security-review, theatre-authority, BUTTERFREEZONE, README — all frozen. NOTES.md is append-only with explicit `[cycle-002]` prefix. | [CHARTER §3](sprint-00/CHARTER.md), [SPRINT-LEDGER.md](SPRINT-LEDGER.md) |
| 7 | **No bucket-projection for T1/T2.** The bucket-projection escape hatch ([CHARTER §9.4](sprint-00/CHARTER.md)) is gated and NOT active in cycle-002. T1/T2 stay `binary_scalar`. | [CHARTER §9](sprint-00/CHARTER.md), [Q7](OPEN-QUESTIONS.md), [CONTRACT §4](sprint-01/CONTRACT.md) |
| 8 | **No cross-regime baseline comparison.** Cycle-001 Baseline A (uniform-prior, 6-bucket) vs cycle-002 Baseline B (runtime-replay, binary or bucket) is meaningless across regimes; presenting it as "uplift" is forbidden. Reports must show both side-by-side under labeled regime columns. | [CHARTER §8.2](sprint-00/CHARTER.md) |

---

## 10. Honest-framing rules (binding cycle-level)

Cycle-001's honest-framing memory binding carries forward in full. Cycle-002 closeout artifacts MUST satisfy all of the following:

### 10.1 Honest-framing grep gate

The grep pattern from cycle-001 closeout ([memory: feedback_honest_framing.md](../../../../.claude/projects/C--Users-0x007-corona/memory/feedback_honest_framing.md)) is the binding gate:

```
grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"
```

On cycle-002 closeout artifacts (Sprint 06's `CLOSEOUT.md`, any cycle-002 README/BFZ additive section, any commit message or tag message authored at closeout), this grep MUST return only NEGATIONS (e.g., "calibration NOT improved", "calibration-attempted, not improved") or zero matches outside an explicit theatre-qualified, Baseline-B-citing claim section. Any positive match in non-claim prose is a hard stop.

### 10.2 Theatre-qualified claim discipline

- Every "calibration-improved" claim cites the SPECIFIC theatre(s) it covers ("T4 calibration-improved vs cycle-002 replay baseline"); never bare.
- Every "L2 publish-ready" claim lists the qualifying theatres and the Baseline B comparison table; never bare.
- T1/T2 claims carry the prior-only honest-framing disclosure: cycle-001 corpus events lack pre-cutoff time-series; `replay_T{1,2}_event` invokes `createX` once and never calls `processX`; `current_position_at_cutoff` equals runtime `base_rate` constant. T1/T2 cannot earn Rung 3 on the cycle-001 corpus shape — it is corpus-shape-foreclosed. Source: [sprint-02/reviewer.md M2 Executive Summary lines 456–464](sprint-02/reviewer.md).

### 10.3 Two-baseline discipline

- Baseline A (cycle-001, uniform-prior, immutable) — historical truth pre-runtime-wiring.
- Baseline B (cycle-002, runtime-replay, anchored at Sprint 03 close before any refit) — binding comparator for "calibration-improved" claims.
- The two are presented under labeled regime columns. Cross-regime "uplift" claims are forbidden.

### 10.4 Two-summary discipline

- Runtime-uplift composite — T1+T2+T4 only. The ONLY summary that may underwrite Rung 1+ closeout claims.
- Full-picture diagnostic — all five theatres, every section title and table caption tagged `[diagnostic]`. Numerics from this summary may NOT underwrite calibration-improved or runtime-uplift claims.

### 10.5 Cert and manifest immutability audit notes

Cycle-002 closeout MUST include:

- "RLMF certificate format (`src/rlmf/certificates.js` `version: '0.1.0'`) unchanged in cycle-002."
- "Cycle-001 calibration manifest `corpus_hash = b1caef3f…11bb1` and `script_hash = 17f6380b…1730f1` unchanged across cycle-002."

### 10.6 No silent regression of cycle-001 honest-framing

If any cycle-002 closeout document quietly weakens v0.2.0's "calibration-attempted, not improved" framing — e.g., by dropping the T1/T2 prior-only disclosure, conflating Baseline A with Baseline B, or removing posture tags — it is a silent honest-framing regression and a hard stop. The cycle-001 memory binding is binding.

---

## 11. Cross-references

### 11.1 Canonical cycle-002 sources (authoritative if this PRD disagrees)

- [SPRINT-LEDGER.md](SPRINT-LEDGER.md) — command-routing source of truth.
- [sprint-00/CHARTER.md](sprint-00/CHARTER.md) — operator-bound decisions Q1–Q8; theatre posture; success ladder; freeze list.
- [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md) — `PredictionTrajectory` shape, distribution_shape closed set, cutoff semantics, outcome derivation, determinism contract, provenance fields, validation rules.
- [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md) — Sprint 02 design.
- [sprint-02/reviewer.md](sprint-02/reviewer.md), [engineer-feedback.md](sprint-02/engineer-feedback.md), [auditor-sprint-feedback.md](sprint-02/auditor-sprint-feedback.md) — Sprint 02 implementation report + review + audit.
- [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md) — sprint sequence Sprint 03–06; allowed/forbidden claims per sprint.
- [PLANNING-FRAME.md](PLANNING-FRAME.md) — repo findings, risk register, candidate sprint sequence.
- [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) — Q1–Q8 closed answers.

### 11.2 Cycle-001 frozen references (consult, never edit)

- [grimoires/loa/prd.md](../../prd.md), [sdd.md](../../sdd.md), [sprint.md](../../sprint.md) — cycle-001 historical.
- [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) — frozen historical evidence.
- [grimoires/loa/calibration/corona/run-3-final/](../../calibration/corona/run-3-final/) + [delta-report.md](../../calibration/corona/run-3-final/delta-report.md).
- [BUTTERFREEZONE.md](../../../../BUTTERFREEZONE.md), [README.md](../../../../README.md) — v0.2.0 closeout snapshots.

### 11.3 Companion synthesis doc

- [SDD.md](SDD.md) — cycle-level SDD synthesis (architecture, replay seam, manifest, test architecture, hard stops).

---

## 12. Document scope guarantees

This PRD ships:

- `grimoires/loa/a2a/cycle-002/PRD.md` (the only PRD file written by this synthesis task).

This PRD does NOT:

- Invent new scope beyond what [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md), [CHARTER.md](sprint-00/CHARTER.md), [CONTRACT.md](sprint-01/CONTRACT.md), and [REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md) already ratify.
- Rename sprints or change the sprint sequence.
- Override any canonical source. Where this PRD and a canonical source disagree, the canonical source binds.
- Replace the cycle-001 PRD at [grimoires/loa/prd.md](../../prd.md). The cycle-001 PRD remains FROZEN historical.
- Modify any source, test, script, manifest, or runtime file.
- Bind any commit, tag, or version change.

---

*Cycle-002 synthesis PRD authored 2026-05-01. Post-Sprint-02 commit `c9535386`; post-sprint-plan commit `da53606`. corpus_hash invariant `b1caef3f…11bb1` (cycle-001 anchor; preserved). RLMF cert format unchanged. Cycle-001 honest-framing memory binding governs. Operator ratification gate pending.*
