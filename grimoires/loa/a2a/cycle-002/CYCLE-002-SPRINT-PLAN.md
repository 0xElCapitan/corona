# CORONA cycle-002 — Sprint Plan (post-Sprint-02)

**Status**: planning document (NOT a charter, NOT a contract, NOT an implementation report).
**Authored**: 2026-05-01 (operator request immediately after cycle-002 Sprint 02 closeout).
**Cycle**: cycle-002.
**Anchor commits**:
- Sprint 02 implementation: `c9535386aff2a02c6aeee60480cd57dfc7f880a0`
- Cycle-002 ledger: `6e711be4122d43bea97be018dd29e2c7eb8e429f`
- HEAD at plan-time: `6e711be` (working tree clean).

**Cycle-002 mission (carried forward verbatim)**: *Make CORONA's backtest score CORONA's runtime predictions.*

> This document does not invent new scope. It routes the remaining cycle-002 sprints (03–06) through the binding decisions already ratified by [sprint-00/CHARTER.md](sprint-00/CHARTER.md) and [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md), and consolidates them into a single sequenced plan suitable for `/implement` → `/review-sprint` → `/audit-sprint` routing per the [cycle-002 SPRINT-LEDGER.md](SPRINT-LEDGER.md).
>
> Cycle-001 PRD/SDD/sprint-plan files at `grimoires/loa/{prd,sdd,sprint}.md` are FROZEN historical artifacts and are not active sprint routing targets.

---

## 1. Completed sprints (00–02) — what they ratified, what they proved

### 1.1 Sprint 00 — Charter / freeze line ([sprint-00/CHARTER.md](sprint-00/CHARTER.md))

**Status**: Ratified (with operator amendment 1: two-summary reporting rule, [CHARTER §4.1](sprint-00/CHARTER.md)).

**Ratified outputs** (binding for the entire cycle):

| Decision | Binding answer | Source |
|---|---|---|
| Q1 — RLMF cert scope | FROZEN. `src/rlmf/certificates.js` `version: '0.1.0'` preserved verbatim. Bucket-shape work lives at backtest seam only. | CHARTER §1, §5 |
| Q2 — T3 posture | WSA-Enlil canonical / external-model. T3 NOT counted toward predictive uplift. | CHARTER §1, §4 |
| Q3 — T5 posture | Quality-of-behavior / settlement-semantics. T5 NOT counted toward predictive uplift. | CHARTER §1, §4 |
| Q4 — Manifest re-anchor | Additive only. Cycle-001 manifest immutable. Cycle-002 gets a separate file at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`. | CHARTER §6 |
| Q5 — Replay clock | Default-preserving function-arg `now` injection. No decorator wrappers. | CHARTER §7 |
| Q6 — Baselines | Two baselines, clearly labeled. Baseline A = cycle-001 historical (uniform-prior). Baseline B = cycle-002 replay baseline at Sprint 03 close, before refit. | CHARTER §8 |
| Q7 — T1/T2 scoring | No fake bucket-projection. NEW threshold-native binary Brier path for T1/T2. Legacy 6-bucket scorers preserved as corpus-baseline diagnostics. | CHARTER §9 |
| Q8 — Sensitivity knob | T4 first. Primary perturbation = T4 PRODUCTIVITY_PARAMS / Wheatland λ. T1/T2 only after binary scoring lands. | CHARTER §1, §10 |

**Two-summary discipline (operator amendment 1)**: every cycle-002 backtest summary report MUST emit (1) a runtime-uplift composite over T1+T2+T4 only, and (2) a full-picture diagnostic summary tagged `[diagnostic]` for all five theatres. Bare "composite verdict" is reserved for the runtime-uplift composite. ([CHARTER §4.1](sprint-00/CHARTER.md))

**Success ladder** (Rung 1–4): see [§3 below](#3-claim-ladder-binding).

### 1.2 Sprint 01 — PredictionTrajectory contract ([sprint-01/CONTRACT.md](sprint-01/CONTRACT.md))

**Status**: Ratified (with operator clarification 1: replay-mode fail-closed; operator clarification 2: canonical-JSON helper is a Sprint 02 deliverable, not Sprint 01).

**Ratified outputs**:

- **Top-level shape** (`schema_version`, `theatre_id`, `theatre_template`, `event_id`, `distribution_shape`, `cutoff`, `gate_params`, `position_history_at_cutoff`, `current_position_at_cutoff`, `evidence_bundles_consumed`, `outcome`, `meta`) — [CONTRACT §3](sprint-01/CONTRACT.md).
- **Closed set** of `distribution_shape`: `binary_scalar`, `bucket_array_5`, `corpus_anchored_external`, `quality_of_behavior`. `bucket_projected` is closed by [CHARTER §9.4](sprint-00/CHARTER.md) escape hatch (not active in cycle-002). — [CONTRACT §4](sprint-01/CONTRACT.md).
- **Per-theatre shape table**: T1=`binary_scalar`; T2=`binary_scalar`; T3=`corpus_anchored_external`; T4=`bucket_array_5`; T5=`quality_of_behavior` (opt-in diagnostic). — [CONTRACT §5](sprint-01/CONTRACT.md).
- **Per-theatre cutoff rules** (`flare_peak_minus_epsilon`, `first_threshold_crossing_or_window_end`, `observed_l1_shock_or_window_close`, `window_end`, `signal_settlement`). — [CONTRACT §6](sprint-01/CONTRACT.md).
- **Outcome derivation** per theatre (T1 binary via flareRank; T2 binary GFZ-preferred; T3 timing-minutes external-model; T4 bucket index via BUCKETS.findIndex; T5 settlement object passthrough). — [CONTRACT §8](sprint-01/CONTRACT.md).
- **Determinism contract**: replay-twice byte-identical canonical JSON. — [CONTRACT §9](sprint-01/CONTRACT.md).
- **Provenance**: four sha256 hashes (`corpus_event_hash`, `cutoff_hash`, `gate_params_hash`, `trajectory_hash`). — [CONTRACT §10](sprint-01/CONTRACT.md).
- **Replay-mode fail-closed rule**: replay path MUST NOT silently fall back to `Date.now()`; live runtime keeps `Date.now()` default. — [CONTRACT §10.1.1](sprint-01/CONTRACT.md).
- **Pinned cycle-002 gate thresholds**: T1=`{threshold_class: "M1.0", window_hours: 24}`; T2=`{kp_threshold: 5, window_hours: 72}`; T4=`{s_scale_threshold: "S1", window_hours: 72}`. — [CONTRACT §12](sprint-01/CONTRACT.md).
- **Producer + consumer validation rules** (17 producer, 5 consumer). — [CONTRACT §11](sprint-01/CONTRACT.md).

### 1.3 Sprint 02 — Deterministic replay seam ([sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md), [reviewer.md](sprint-02/reviewer.md), [engineer-feedback.md](sprint-02/engineer-feedback.md), [auditor-sprint-feedback.md](sprint-02/auditor-sprint-feedback.md))

**Status**: Implemented, reviewed (APPROVED with non-blocking concerns), audited (APPROVED with two recommended fixes), committed at `c9535386`.

**Shipped (verified on disk)**:

- New helpers under `scripts/corona-backtest/replay/`:
  - [canonical-json.js](../../../../scripts/corona-backtest/replay/canonical-json.js) (~75 LOC, zero deps)
  - [hashes.js](../../../../scripts/corona-backtest/replay/hashes.js) (~52 LOC)
  - [context.js](../../../../scripts/corona-backtest/replay/context.js) (~107 LOC, fail-closed enforcer)
  - [t1-replay.js](../../../../scripts/corona-backtest/replay/t1-replay.js), [t2-replay.js](../../../../scripts/corona-backtest/replay/t2-replay.js), [t4-replay.js](../../../../scripts/corona-backtest/replay/t4-replay.js)
- New scoring modules (NEW path; legacy 6-bucket scorers preserved unchanged):
  - [scripts/corona-backtest/scoring/t1-binary-brier.js](../../../../scripts/corona-backtest/scoring/t1-binary-brier.js)
  - [scripts/corona-backtest/scoring/t2-binary-brier.js](../../../../scripts/corona-backtest/scoring/t2-binary-brier.js)
- Surgical signature changes (default-preserving optional `{ now }` arg):
  - [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) — `createProtonEventCascade`, `processProtonEventCascade`, `resolveProtonEventCascade`
  - [src/theatres/flare-gate.js](../../../../src/theatres/flare-gate.js) — `createFlareClassGate`, `processFlareClassGate`, `expireFlareClassGate`
  - [src/theatres/geomag-gate.js](../../../../src/theatres/geomag-gate.js) — `createGeomagneticStormGate`, `processGeomagneticStormGate`, `expireGeomagneticStormGate` + 4 internal helpers
- 11 new test files; **261/261 passing** (160 cycle-001 baseline + 54 milestone-1 (T4) + 47 milestone-2 (T1/T2)).

**What Sprint 02 proved**:

- **Rung 1 (T4)**: Cycle-002 wired CORONA's runtime T4 prediction trajectory into a deterministic replay path. Replay-twice byte-identical canonical JSON for ALL 5 cycle-001 T4 corpus events ([tests/replay-determinism-T4-test.js](../../../../tests/replay-determinism-T4-test.js)). T4 trajectory's runtime distribution is materially different from `UNIFORM_PRIOR` ([tests/replay-T4-scored-through-runtime-bucket-test.js](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js)). T4 trajectory is consumable by the existing `scoreEventT4` API verbatim.
- **Rung 1 (T1/T2 — narrow)**: T1 and T2 produce deterministic `binary_scalar` trajectories scored through new threshold-native binary Brier modules. Replay-twice byte-identical for ALL 10 cycle-001 T1+T2 corpus events. **HONEST-FRAMING DISCLOSURE BINDING ON CYCLE**: cycle-001 T1/T2 corpus events lack pre-cutoff time-series evidence (no GOES X-ray series for T1; no per-3hr Kp series for T2). `replay_T1_event` / `replay_T2_event` invoke `createX` once and never call `processX`. The trajectory's `current_position_at_cutoff` equals the runtime `base_rate` constant. This satisfies Rung 1 (trajectory is real, deterministic, scoreable) but does NOT exercise the runtime evidence-update logic. T1/T2 cannot earn Rung 3 calibration-improved on the cycle-001 corpus shape — separate corpus-expansion work would be required.
- **Cycle-001 invariants intact**: `corpus_hash = b1caef3f…11bb1`, `script_hash = 17f6380b…1730f1` (`scripts/corona-backtest.js` entrypoint zero-diff in Sprint 02). RLMF cert format frozen; `src/rlmf/certificates.js` zero-diff. All cycle-001 manifests, sprint folders, run outputs, README, BFZ — zero-diff.
- **Provenance binding for Sprint 03** (operator instruction in milestone-1 ratification): the cycle-002 additive manifest MUST carry a NEW field — proposed name `replay_script_hash` — that hashes the replay seam's source files, because cycle-001 `script_hash` (sha256 of `scripts/corona-backtest.js` only) does NOT cover the replay seam dependencies that drive cycle-002 trajectory output. ([reviewer.md "Provenance Note for Sprint 3"](sprint-02/reviewer.md))

**Sprint 02 audit findings — disposition**:

Resolved before Sprint 02 commit at `c9535386`:

| ID | Finding | Resolution |
|---|---|---|
| S2-C2 / §A5 | T1/T2 prior-only trajectories: framing was correct but buried in `reviewer.md` "Notable Decisions". | RESOLVED before commit. Honest-framing disclosure promoted into [reviewer.md M2 Executive Summary "Honest framing — T1/T2 are runtime-wired, NOT calibration-improved"](sprint-02/reviewer.md) (lines 456–464). |
| S2-C4 / §A4 | `gitHeadRevision()` exported by `t4-replay.js` was dead code and the only `child_process` import in the replay seam. | RESOLVED before commit. `gitHeadRevision()` removed; `child_process` import eliminated from the entire `scripts/corona-backtest/replay/` directory (verified post-commit by grep — no `gitHeadRevision`, `child_process`, or `execSync` matches in `t4-replay.js`). |

Open as optional Sprint 03 hardening candidates (NOT blockers; NOT required for Rung 1 entrypoint wiring):

| ID | Finding | Audit verdict |
|---|---|---|
| S2-C3 / §A2 | RLMF cert non-mutation test covers T4 only; T2/T3/T5 covered structurally (cert.js zero-diff). | Test gap is residual; hardening item. |
| §A1 | Evidence-leakage prevention is by author convention, not structural invariant on the corpus event object. | Non-blocking; `loadCorpusWithCutoff` (Sprint 03) provides the structural fix. |
| §A3 | T1/T2 lack a `current_position_at_cutoff == base_rate` (or `≠ base_rate` post-corpus-expansion) regression guard. | Non-blocking; corpus-shape-dependent. |

---

## 2. State going into Sprint 03

| Asset | State | Notes |
|---|---|---|
| `scripts/corona-backtest.js` (entrypoint) | UNCHANGED from cycle-001. Still calls `loadCorpus` + legacy `scoreCorpusT*` from `scoring/`. | Sprint 03 wires the replay path here. |
| `scripts/corona-backtest/ingestors/corpus-loader.js` | `loadCorpus` export unchanged. `loadCorpusWithCutoff` does NOT yet exist. | Sprint 03 adds `loadCorpusWithCutoff` as additive export per [CONTRACT §7.3](sprint-01/CONTRACT.md), [REPLAY-SEAM §6](sprint-02/REPLAY-SEAM.md). |
| `scripts/corona-backtest/replay/` | All 6 modules present (`canonical-json`, `hashes`, `context`, `t1-replay`, `t2-replay`, `t4-replay`). | Sprint 03 imports and orchestrates these from the entrypoint. |
| `scripts/corona-backtest/scoring/t{1,2}-binary-brier.js` | Present. | Sprint 03 wires entrypoint to call these on the `binary_scalar` trajectories from T1/T2 replay. |
| `scripts/corona-backtest/scoring/t{1,2,4}-bucket-brier.js` (legacy) | Frozen by [CHARTER §9.3](sprint-00/CHARTER.md) as corpus-baseline diagnostics. | Sprint 03 does NOT modify; full-picture diagnostic summary may still surface their numerics. |
| `scripts/corona-backtest/scoring/t{3,5}-*` | Unchanged. | Sprint 03 does NOT modify; T3 stays corpus-anchored, T5 stays quality-of-behavior. |
| `src/rlmf/certificates.js` | Zero-diff. `version: '0.1.0'` pinned. | FROZEN by [CHARTER §1, §5 (Q1)](sprint-00/CHARTER.md) for the entire cycle. |
| `src/theatres/{cme-arrival,solar-wind-divergence}.js` | Zero-diff (Sprint 02 did not touch). | Sprint 03 does NOT touch. |
| `grimoires/loa/calibration/corona/calibration-manifest.json` | Frozen historical evidence (cycle-001 anchor). 30 entries. | Cycle-001 manifest IS NEVER mutated in cycle-002. |
| `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` | DOES NOT YET EXIST. | First write is Sprint 03 deliverable per [CHARTER §6.2](sprint-00/CHARTER.md). |
| `grimoires/loa/calibration/corona/cycle-002-run-1/` (or analogous output dir) | DOES NOT YET EXIST. | First write is Sprint 03 deliverable per [PLANNING-FRAME §9](PLANNING-FRAME.md). |
| `tests/manifest_regression_test.js`, `tests/manifest_structural_test.js` | Cycle-001-anchored. PASS as of `c9535386`. | Sprint 03 EXTENDS additively (does not rewrite); cycle-001 entries' hashes never mutated. |
| `package.json` `version` | `0.2.0`. `dependencies: {}`. `engines.node: ">=20.0.0"`. | Frozen until [Rung 4](#3-claim-ladder-binding); Sprint 03 may extend `scripts.test` additively but does NOT bump version. |

---

## 3. Claim ladder (binding)

Cycle-002 may earn each rung by meeting ALL conditions on that rung. Higher rungs do NOT skip lower rungs. Closeout language is bound to whichever rung the cycle has actually earned. Source: [CHARTER §10](sprint-00/CHARTER.md). Honest-framing memory binding (cycle-001 carryover) governs every closeout artifact.

| Rung | Name | Earned when | Owner sprint |
|---|---|---|---|
| 1 | **runtime-wired** | Replay seam exists; replay-twice byte-identical; ≥1 theatre's runtime trajectory is materially different from no-information baseline; 160 cycle-001 tests still green; cycle-001 manifest unchanged. | Sprint 02 (T4) earned; Sprint 03 extends to T4+T1+T2 entrypoint-wired. |
| 2 | **runtime-sensitive** | Rung 1 + a controlled perturbation of one T4 knob (per Q8) changes T4's cycle-002-replay Brier by a measurable amount; reverting the perturbation restores the Brier byte-identically; perturbation diff documented; corpus_hash invariant preserved across both directions. | Sprint 05. |
| 3 | **calibration-improved** (gated) | Rung 2 + post-refit T4 cycle-002-replay Brier strictly less than Baseline B on the frozen corpus; cycle-002 manifest re-anchored to post-refit `replay_script_hash`; structural+regression gates green; honest-framing grep gate clean. NEVER bare; always cited as "T<N> calibration-improved vs cycle-002 replay baseline". | Conditional / future cycle. |
| 4 | **L2 publish-ready** (gated) | Rung 3 + trajectory scoring landed for T4 (mandatory) and T1/T2 (only if pre-cutoff time-series evidence exists in corpus); honest theatre-specific posture documented for T3+T5; RLMF cert frozen note in closeout; README+BFZ additive cycle-002 sections; tag posture decided. | Sprint 06 (gate). |

**Forbidden across the cycle (cycle-001 honest-framing memory binding, applied verbatim to cycle-002)**:

- Bare "calibration improved" / "empirical performance improvement" / "forecasting accuracy" / "verifiable track record" — these strings should return only NEGATIONS or zero matches in cycle-002 closeout artifacts.
- Cross-regime comparison of cycle-001 numerics (Baseline A; uniform-prior 6-bucket) against cycle-002 numerics (Baseline B; runtime-replay binary or bucket) as evidence of uplift. Scoring regimes are different; cross-regime comparison is meaningless. ([CHARTER §8.2](sprint-00/CHARTER.md))
- Composite-verdict pass/fail flips counted as "calibration-improved". A verdict flip without a sensitivity-proof artifact is a false claim.
- Generalizing T4 sensitivity proof to T1/T2 unless a separate two-direction test on a T1/T2 knob runs (and only after T1/T2 binary-runtime scoring lands AND the corpus exercises the process* code path).

---

## 4. Remaining sprint plan (Sprints 03–06)

Each sprint section follows the same structure: objective, scope, out-of-scope, likely files, forbidden files, tests, review/audit gates, exit criteria, hard stops. Sprints are routed via the [cycle-002 SPRINT-LEDGER.md](SPRINT-LEDGER.md) (NOT cycle-001 sprint folders).

Sprint folders use the cycle-002 zero-padded namespace under `grimoires/loa/a2a/cycle-002/sprint-NN/`.

---

### 4.1 Sprint 03 — Runtime replay entrypoint + additive cycle-002 manifest

**Folder**: `grimoires/loa/a2a/cycle-002/sprint-03/`
**Spec**: Operator ratification: Sprint 03 intentionally skips a separate `ENTRYPOINT-MANIFEST.md`. The existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts are the binding Sprint 03 implementation spec. `/implement sprint-03` routes through the cycle-002 ledger and proceeds directly against those documents.
**Earns**: Rung 1 (full entrypoint-wired form for T4; T1/T2 narrow form per Sprint 02 honest-framing disclosure).
**Anchors**: Baseline B at Sprint 03 close.

#### 4.1.1 Objective

Wire the cycle-002 deterministic replay seam (Sprint 02 deliverable) into the top-level backtest entrypoint so a real `npm run` (or equivalent) end-to-end backtest invocation exercises CORONA's runtime predictions, emits the two-summary report (charter §4.1), records `cycle-002-run-1/` outputs under the calibration tree, and commits the additive `runtime-replay-manifest.json` with `replay_script_hash` provenance binding. Existing cycle-001 path is preserved as a default-mode reproducibility lane (legacy uniform-prior scoring still callable; cycle-001 invariants unchanged when replay path is not selected).

#### 4.1.2 In-scope

1. **Entrypoint wiring** in [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js):
   - Add a replay-mode selector: flag (e.g., `--replay`), env var (e.g., `CORONA_RUNTIME_REPLAY=1`), or named output target. Cycle-001 default path (legacy `loadCorpus` + 6-bucket scorers) MUST remain reachable AND produce the cycle-001 `script_hash = 17f6380b…1730f1` byte-identically.
   - Replay path: dispatches per theatre using ledger-defined replay modules:
     - T4 → `replay_T4_event` → `scoreCorpusT4` consuming `current_position_at_cutoff` via `options.predictedDistribution`.
     - T1 → `replay_T1_event` → `scoreCorpusT1Binary` (NEW path).
     - T2 → `replay_T2_event` → `scoreCorpusT2Binary` (NEW path).
     - T3 → unchanged `scoreCorpusT3` (corpus-anchored external; trajectory recorded but does NOT feed scoring).
     - T5 → unchanged `scoreCorpusT5` (quality-of-behavior; trajectory emit/omit decision deferred to Sprint 04).
2. **Loader extension** (additive only) in [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js):
   - NEW export `loadCorpusWithCutoff(corpusDir, options)` per [CONTRACT §7.3](sprint-01/CONTRACT.md) and [REPLAY-SEAM §6](sprint-02/REPLAY-SEAM.md). Returns existing `events`/`errors`/`stats` PLUS `cutoffs` and `evidence: { pre_cutoff: [...], settlement: {...} }`. The structural split closes audit finding §A1 from Sprint 02.
   - Existing `loadCorpus` export unchanged. Cycle-001 callers continue to use it.
3. **Two-summary reporting** ([CHARTER §4.1](sprint-00/CHARTER.md), operator amendment 1):
   - `cycle-002-run-1/runtime-uplift-summary.md` — composite over T1+T2+T4 only.
   - `cycle-002-run-1/diagnostic-summary.md` — full-picture for all 5 theatres, every section title and table caption tagged `[diagnostic]`.
   - Per-theatre rows tagged `T1 [runtime-binary]`, `T2 [runtime-binary]`, `T3 [external-model]`, `T4 [runtime-bucket]`, `T5 [quality-of-behavior]`.
4. **Cycle-002 additive manifest** at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`:
   - Schema clearly declares it as additive cycle-002 manifest (not replacement).
   - Carries `corpus_hash` (expected `b1caef3f…11bb1`; corpus frozen) + `replay_script_hash` (NEW field per Sprint 02 provenance binding) covering at minimum: `scripts/corona-backtest/replay/{canonical-json,hashes,context,t1-replay,t2-replay,t4-replay}.js` + `scripts/corona-backtest/scoring/{t1-binary-brier,t2-binary-brier}.js` + entrypoint replay-mode delta in `scripts/corona-backtest.js`.
   - Per-theatre runtime-replay anchor entries for T1, T2, T4 with their pinned cycle-002 thresholds ([CONTRACT §12](sprint-01/CONTRACT.md)).
   - Documents (as a doc-string field or accompanying note) why cycle-001 `script_hash` is INSUFFICIENT for cycle-002 provenance.
5. **Manifest regression test extension** in [tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) — additive only:
   - Continues to validate cycle-001 manifest entries against cycle-001 hashes (hard-fail on drift).
   - Adds validation of cycle-002 manifest entries against cycle-002 hashes once cycle-002-run-1 is anchored.
   - Cycle-001 manifest entries' hashes are NEVER mutated.
6. **Cycle-002 baseline run output** at `grimoires/loa/calibration/corona/cycle-002-run-1/` (or equivalent path; Sprint 03 spec confirms the exact name) — produced by running entrypoint in replay mode against the cycle-001 corpus AT cycle-001 runtime parameter values, no parameter changes. THIS IS Baseline B per [CHARTER §8.1](sprint-00/CHARTER.md).
7. **Optional Sprint 02 hardening pickup** (any subset; non-blocking; S2-C2 and S2-C4 already resolved before Sprint 02 commit):
   - Extend `replay-rlmf-cert-non-mutation-test.js` to T1/T2 paths (S2-C3).
   - Add explicit `current_position_at_cutoff == base_rate` regression guard for T1/T2 cycle-001 corpus shape (§A3).

#### 4.1.3 Out-of-scope (Sprint 03 MUST NOT do)

- ANY modification to `src/rlmf/certificates.js` (Q1 freeze).
- ANY mutation of cycle-001 `calibration-manifest.json` entries' `corpus_hash` / `script_hash` / `current_value` / `verification_status` / `provisional` fields.
- ANY change to runtime parameters, thresholds, base_rates, PRODUCTIVITY_PARAMS, or formulas. (No-refit covenant per [CHARTER §8.3](sprint-00/CHARTER.md); refit is gated on Rung 2 sensitivity proof.)
- ANY change to legacy 6-bucket scoring modules (`scoring/t{1,2,4}-bucket-brier.js`). They are FROZEN as corpus-baseline diagnostics per [CHARTER §9.3](sprint-00/CHARTER.md).
- ANY widening of T1/T2 runtime `current_position` from scalar to array (Q1+Q7 violation).
- ANY emission of T3 CORONA-prediction (Q2 freeze).
- ANY conversion of T5 scoring from quality-of-behavior to probabilistic-Brier (Q3 freeze).
- ANY tag, version bump, GitHub Release, CHANGELOG, README, or BFZ change.
- ANY new runtime dependency (`dependencies: {}` invariant).
- ANY edit to the cycle-001 sprint folders (`grimoires/loa/a2a/sprint-{0..7}/`), cycle-001 PRD/SDD/sprint plan, or cycle-001 runs (`run-1/`, `run-2/`, `run-3-final/`).
- ANY use of bucket-projection for T1/T2 (CHARTER §9.4 escape hatch is closed for cycle-002).

#### 4.1.4 Likely files (writes, edits, new)

| Path | Action |
|---|---|
| `scripts/corona-backtest.js` | Edit (additive replay-mode dispatch). |
| `scripts/corona-backtest/ingestors/corpus-loader.js` | Edit (NEW additive export `loadCorpusWithCutoff`; existing `loadCorpus` unchanged). |
| `scripts/corona-backtest/reporting/write-summary.js` and/or new `runtime-uplift-summary.js` + `diagnostic-summary.js` | Edit / new — implement two-summary discipline. |
| `scripts/corona-backtest/reporting/write-report.js` | Edit (per-theatre report tagging). |
| `tests/manifest_regression_test.js` | Edit (additive cycle-002 manifest validation). |
| `tests/` — new tests (Sprint 03 spec confirms count) | New (entrypoint replay-mode smoke; cycle-002 manifest regression; two-summary tagging). |
| `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` | New (additive). |
| `grimoires/loa/calibration/corona/cycle-002-run-1/runtime-uplift-summary.md` | New. |
| `grimoires/loa/calibration/corona/cycle-002-run-1/diagnostic-summary.md` | New. |
| `grimoires/loa/calibration/corona/cycle-002-run-1/T{1,2,3,4,5}-report.md` | New. |
| `grimoires/loa/calibration/corona/cycle-002-run-1/corpus_hash.txt` | New (expected `b1caef3f…11bb1`). |
| `grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt` (or named per Sprint 03 spec) | New. |
| `package.json` | Edit (additive `scripts.test` entries only; version unchanged). |
| `grimoires/loa/a2a/cycle-002/sprint-03/{reviewer,engineer-feedback,auditor-sprint-feedback}.md` | New (after implement / review / audit). Operator ratification: Sprint 03 intentionally skips a separate `ENTRYPOINT-MANIFEST.md`. The existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts are the binding Sprint 03 implementation spec. |

#### 4.1.5 Forbidden files (Sprint 03 MUST NOT touch)

| Path | Reason |
|---|---|
| `src/rlmf/certificates.js` | Q1 freeze (CHARTER §5). |
| `src/theatres/cme-arrival.js` | T3 posture freeze (Q2). |
| `src/theatres/solar-wind-divergence.js` | T5 posture freeze (Q3). |
| `src/processor/settlement.js` | Settlement authority semantics frozen (CHARTER §3.5). |
| `src/processor/uncertainty.js` and any runtime-parameter file | No-refit covenant (CHARTER §8.3); refit is gated on Rung 2. |
| `scripts/corona-backtest/scoring/t{1,2,4}-bucket-brier.js` | Legacy diagnostic, frozen (CHARTER §9.3). |
| `scripts/corona-backtest/scoring/t3-timing-error.js` | Q2 — T3 scoring unchanged. |
| `scripts/corona-backtest/scoring/t5-quality-of-behavior.js` | Q3 — T5 scoring unchanged. |
| `grimoires/loa/calibration/corona/calibration-manifest.json` | Cycle-001 manifest immutable (CHARTER §6.1). |
| `grimoires/loa/calibration/corona/calibration-protocol.md`, `empirical-evidence.md`, `security-review.md`, `theatre-authority.md` | Frozen historical artifacts (CHARTER §3.4). |
| `grimoires/loa/calibration/corona/{run-1,run-2,run-3-final}/` | Frozen historical run outputs. |
| `grimoires/loa/calibration/corona/corpus/{primary,secondary}/` | Frozen; corpus_hash invariant. |
| `grimoires/loa/{prd,sdd,sprint,NOTES}.md` | Cycle-001 historical / append-only with `[cycle-002]` prefix only (NOTES). |
| `grimoires/loa/a2a/sprint-{0..7}/` | Cycle-001 sprint folders frozen. |
| `BUTTERFREEZONE.md`, `README.md` | Frozen at v0.2.0 closeout (CHARTER §3.6); cycle-002 changes are Sprint 06 closeout territory only. |
| `schemas/construct.schema.json`, `construct.yaml` | Frozen schema commit `b98e9ef`. |
| `package.json` `version`, `dependencies` | `0.2.0` and `{}` invariants. |

#### 4.1.6 Tests

Sprint 03 implementation MUST keep all 261 existing tests green and add tests covering (at minimum):

- Entrypoint replay-mode dispatch produces `cycle-002-run-1/` outputs and the two-summary pair.
- Entrypoint cycle-001 (default) mode produces `script_hash = 17f6380b…1730f1` byte-identically (cycle-001 reproducibility invariant).
- `loadCorpusWithCutoff` returns structurally separated `evidence.pre_cutoff` / `settlement` per CONTRACT §7.3.
- `runtime-replay-manifest.json` validates against `manifest_structural_test`-style schema; cycle-002 manifest entries' `replay_script_hash` matches recomputed hash over the declared file set.
- `manifest_regression_test` extension PASSES for both cycle-001 (hard-anchored) and cycle-002 (newly anchored at Sprint 03 close) entries.
- Per-theatre report tagging matches operator amendment 1 (`[runtime-binary]`, `[external-model]`, `[runtime-bucket]`, `[quality-of-behavior]`).
- Optional: T1/T2 `current_position_at_cutoff == base_rate` regression guard (audit finding §A3); RLMF cert non-mutation extended to T1/T2 (audit finding §A2/S2-C3).

**Test invariant**: every existing test from Sprint 02 closeout (261/261) stays green. New cycle-002-anchored tests are additive only.

#### 4.1.7 Review / audit gates

| Gate | Skill | Output path |
|---|---|---|
| Implementation | `/implement sprint-03` | Updates listed in §4.1.4. |
| Review | `/review-sprint sprint-03` | `grimoires/loa/a2a/cycle-002/sprint-03/engineer-feedback.md` (review of `reviewer.md`). |
| Audit | `/audit-sprint sprint-03` | `grimoires/loa/a2a/cycle-002/sprint-03/auditor-sprint-feedback.md`. |
| Operator commit gate | (manual; HITL discipline) | Single commit AFTER both gates pass and tests are green. |

Per [SPRINT-LEDGER.md](SPRINT-LEDGER.md) command-routing rule: when `/implement sprint-03` (etc.) is invoked, the cycle-002 ledger is the binding routing source — NOT cycle-001 sprint files.

#### 4.1.8 Exit criteria

Sprint 03 exits when ALL hold:

- [ ] Replay-mode entrypoint lands; cycle-001 default mode reproduces `script_hash = 17f6380b…1730f1`.
- [ ] `loadCorpusWithCutoff` additive export shipped; `loadCorpus` unchanged.
- [ ] Two-summary reports produced (runtime-uplift composite + full-picture diagnostic), per-theatre rows tagged.
- [ ] `cycle-002-run-1/` directory written with replay-mode outputs; `corpus_hash` matches `b1caef3f…11bb1`.
- [ ] `runtime-replay-manifest.json` written with `replay_script_hash` field; cycle-002 manifest entries anchored to that hash.
- [ ] `manifest_regression_test` extension green for BOTH cycle-001 (immutable) and cycle-002 (newly anchored) entries.
- [ ] All existing 261 tests still pass; new Sprint 03 / cycle-002 tests are additive.
- [ ] `npm test` reports `pass N, fail 0` for the new total.
- [ ] `/review-sprint sprint-03` returns APPROVED (with or without non-blocking concerns).
- [ ] `/audit-sprint sprint-03` returns APPROVED (with or without recommendations).
- [ ] Operator authorizes commit; commit lands.

#### 4.1.9 Hard stops (any of these triggered → halt sprint, surface to operator)

- Cycle-001 manifest mutation appears necessary (forbidden by Q4 / CHARTER §6.1).
- RLMF certificate format change appears necessary (forbidden by Q1).
- Bucket-projection for T1/T2 appears necessary (forbidden by CHARTER §9.4).
- T3 CORONA-prediction emission appears necessary (forbidden by Q2).
- T5 probabilistic-Brier conversion appears necessary (forbidden by Q3).
- Runtime parameter change appears necessary (forbidden by CHARTER §8.3 no-refit covenant).
- Cycle-001 `script_hash = 17f6380b…1730f1` cannot be reproduced in default mode (cycle-001 reproducibility regression).
- New runtime dependency required (`dependencies: {}` invariant).
- Replay-twice byte-identical determinism breaks for any T4 / T1 / T2 trajectory.

#### 4.1.10 Sprint 03 allowed claims (cycle closeout discipline applies)

In `cycle-002-run-1/runtime-uplift-summary.md`, `reviewer.md`, and any Sprint 03 artifact, the following claims are allowed when supported by evidence:

- "cycle-002 wired runtime prediction trajectories into the T4 scoring path" (T4 deterministic, scored through runtime-bucket path).
- "cycle-002 wired runtime prediction trajectories into the T1 / T2 scoring path under threshold-native binary Brier" — qualified by the [Sprint 02 honest-framing disclosure](#13-sprint-02-deterministic-replay-seam-sprint-02replay-seammd-reviewermd-engineer-feedbackmd-auditor-sprint-feedbackmd) that cycle-001 T1/T2 corpus events lack pre-cutoff time-series and the trajectory equals runtime base_rate.
- "Baseline B (cycle-002 replay baseline) anchored at Sprint 03 close at runtime parameter values from cycle-001."
- "cycle-002 run 1 produced; verdicts emitted; manifest re-anchored additively to cycle-002 `replay_script_hash`."
- "Replay-twice byte-identical determinism preserved end-to-end through entrypoint."
- "cycle-001 reproducibility lane preserved: default-mode `script_hash = 17f6380b…1730f1` invariant."
- "RLMF certificate format unchanged in cycle-002 (audit-noted)."
- "Two-summary reporting discipline applied: runtime-uplift composite separated from full-picture diagnostic."

#### 4.1.11 Sprint 03 forbidden claims

The following claims are FORBIDDEN in any Sprint 03 artifact:

- Bare or qualified "calibration-improved" / "calibration improved" / "empirical performance improvement" / "forecasting accuracy" / "verifiable track record" / "predictive uplift demonstrated" / "L2 publish-ready". (Honest-framing grep gate applies.)
- Any cross-regime comparison: cycle-001 Baseline A numerics (uniform-prior, 6-bucket) vs cycle-002 Baseline B numerics (runtime-replay, binary or bucket) presented as "uplift". Comparison must be wired-vs-wired only.
- "T1/T2 calibration-improved" — corpus shape forecloses Rung 3 for T1/T2 in cycle-002.
- "Composite verdict pass" referenced as evidence of calibration improvement. Composite verdict transitions are a function of corpus characteristics, not runtime parameter quality, until the [Sprint 05](#43-sprint-05--sensitivity-proof-two-direction-test) sensitivity proof is in hand.
- "Harness sensitivity demonstrated" — that is Sprint 05 territory, not Sprint 03.
- "L2 publish-ready" — that is Sprint 06 + Rung 4 territory.
- Any framing that implies the cycle-001 honest-framing posture has been weakened or that v0.2.0's "calibration-attempted, not improved" stance has been refuted.

---

### 4.2 Sprint 04 — T3/T5 posture documentation

**Folder**: `grimoires/loa/a2a/cycle-002/sprint-04/`
**Spec name**: `T3-T5-POSTURE.md` (proposed; ratified at Sprint 04 entry)
**Earns**: no rung (documentation sprint that locks honest framing for T3/T5 in closeout artifacts).
**Default posture**: **Option A — T5 trajectory emit DEFERRED**. T3/T5 posture documentation is the main (and, by default, only) Sprint 04 deliverable. No T5 replay module created. No `src/theatres/solar-wind-divergence.js` touch. Option B (T5 diagnostic trajectory emit) is ratification-gated and only opens if the operator explicitly authorizes it at Sprint 04 entry.

#### 4.2.1 Objective

Lock T3 [external-model] and T5 [quality-of-behavior] posture as durable closeout-discipline framing, per [CHARTER §1 Q2/Q3](sprint-00/CHARTER.md) and [CHARTER §4](sprint-00/CHARTER.md). Produce the prose addendum that [Sprint 06](#44-sprint-06--closeout--honest-framing) can cite verbatim. Decide whether T5 trajectories are emitted in cycle-002 — **default decision is "no" (Option A)**; flipping to Option B (opt-in diagnostic, no scoring effect) requires an explicit operator ratification of Sprint 04's spec.

#### 4.2.2 In-scope

1. Posture document at `grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md` covering:
   - T3: WSA-Enlil canonical / external-model / NOT counted toward predictive uplift. Why: CORONA does not predict CME arrival; the corpus's `wsa_enlil_predicted_arrival_time` IS the prediction. Cycle-002 backtest scoring of T3 measures WSA-Enlil quality + CORONA's uncertainty-pricing wrapper, neither of which is CORONA-owned predictive uplift.
   - T5: quality-of-behavior settlement / NOT counted toward predictive uplift. Why: T5 has no external probabilistic ground truth; FP rate / p50 / switch-handled / hit-rate-diagnostic ARE the meaningful settlement.
   - Composite-verdict tagging rule (`T3 [external-model]`, `T5 [quality-of-behavior]`) matches Sprint 03 entrypoint output.
   - Honest-framing language Sprint 06 can cite verbatim ("T3 [external-model] not counted toward predictive uplift", "T5 [quality-of-behavior] not counted toward predictive uplift").
2. Decision on T5 trajectory emit ([CONTRACT §13](sprint-01/CONTRACT.md)):
   - **Option A (DEFAULT)**: emit nothing. T5 trajectory remains DEFERRED for cycle-002. Existing T5 scoring numerics unchanged byte-for-byte. No `replay_T5_event` module is created. `src/theatres/solar-wind-divergence.js` is NOT touched. `tests/` is NOT extended for T5 replay shape.
   - **Option B (ratification-gated)**: emit `quality_of_behavior` trajectory with `current_position_at_cutoff = null` and runtime detection state in `position_history_at_cutoff[].aux` for diagnostic visibility. The trajectory MUST NOT feed any scoring path; existing `fp_rate` / `stale_feed_p50_seconds` / `satellite_switch_handled_rate` / `hit_rate_diagnostic` numerics MUST stay byte-stable. Option B requires the operator to explicitly authorize it at Sprint 04 entry (e.g., a written ratification line in `T3-T5-POSTURE.md`); without that explicit authorization, Sprint 04 ships Option A and Option B is closed for cycle-002.
   - Rationale for default = Option A: smallest scope; zero risk to T5 settlement-authority numerics; preserves cycle-001 honest-framing posture; T5 replay-trace-aware diagnostic remains a future-cycle item if it ever becomes interesting.
3. Optional additive entry at `grimoires/loa/calibration/corona/theatre-authority.md` IF and ONLY IF Sprint 04 explicitly authorizes — additive addendum, never in-place mutation. (Per [CHARTER §3.4](sprint-00/CHARTER.md): "Frozen unless Sprint 4 posture decision authorizes additive addendum.")

#### 4.2.3 Out-of-scope

Default Option A (binding unless Sprint 04 entry explicitly ratifies Option B):

- ANY mutation of `src/theatres/cme-arrival.js` (T3 freeze).
- ANY mutation of `src/theatres/solar-wind-divergence.js` (T5 freeze; Option A keeps this file zero-diff).
- ANY new `replay_T5_event` module under `scripts/corona-backtest/replay/` (Option A defers).
- ANY new T5 replay tests (Option A defers).
- ANY change to `scoring/t3-timing-error.js`.
- ANY change to `scoring/t5-quality-of-behavior.js` (numerics MUST stay byte-stable).
- ANY change that converts T3 or T5 to a probabilistic-uplift-counted theatre (Q2/Q3 freezes).
- ANY README, BFZ, or version change.

Conditional out-of-scope override under Option B (only if explicitly ratified):

- The default-preserving `{ now: nowFn = () => Date.now() } = {}` injection on `src/theatres/solar-wind-divergence.js` becomes permitted ONLY because and ONLY to the extent `replay_T5_event` requires it. Live runtime behavior MUST stay bit-stable; existing T5 scoring numerics MUST stay byte-stable; `src/rlmf/certificates.js` stays zero-diff.

#### 4.2.4 Likely files

Default (Option A — Sprint 04 ships docs only):

| Path | Action |
|---|---|
| `grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md` | New. |
| `grimoires/loa/calibration/corona/theatre-authority.md` | Edit ONLY IF Sprint 04 explicitly authorizes additive addendum (preferred: leave frozen; instead extend cycle-002 namespace). |
| `grimoires/loa/a2a/cycle-002/sprint-04/{reviewer,engineer-feedback,auditor-sprint-feedback}.md` | New. |

Conditional (only if Option B is ratified at Sprint 04 entry):

| Path | Action |
|---|---|
| `scripts/corona-backtest/replay/t5-replay.js` | New. |
| `src/theatres/solar-wind-divergence.js` | Edit — same default-preserving `{ now }` injection pattern as Sprint 02. |
| `tests/replay-trajectory-shape-T5-test.js`, `tests/replay-T5-no-scoring-impact-test.js` | New. |

#### 4.2.5 Forbidden files

Same set as [Sprint 03 forbidden files](#415-forbidden-files-sprint-03-must-not-touch), plus:
- `scripts/corona-backtest/scoring/t3-timing-error.js`, `scoring/t5-quality-of-behavior.js` — numerics must stay byte-stable.
- `src/theatres/cme-arrival.js` — T3 freeze.

#### 4.2.6 Tests

Default (Option A): no new tests required; all existing tests stay green; `src/theatres/solar-wind-divergence.js` zero-diff is the structural invariant.

Conditional (Option B; only if explicitly ratified):
- Replay-trajectory-shape-T5 (CONTRACT §11.1 producer rules subset for `quality_of_behavior` shape; `current_position_at_cutoff == null`).
- Replay-T5-no-scoring-impact: assert that with the trajectory emitted, the existing `fp_rate` / `p50` / `switch_handled` / `hit_rate_diagnostic` numerics remain byte-stable vs Option A baseline.
- Default-preserving clock injection on `solar-wind-divergence.js` (analogous to Sprint 02's pattern) — all 160 cycle-001 tests + every test added through Sprint 03 still green.

#### 4.2.7 Review / audit gates

| Gate | Skill | Output |
|---|---|---|
| Implementation | `/implement sprint-04` | Posture doc; optional Option B code+tests. |
| Review | `/review-sprint sprint-04` | `engineer-feedback.md`. |
| Audit | `/audit-sprint sprint-04` | `auditor-sprint-feedback.md`. |
| Commit gate | HITL | Single commit after gates pass. |

#### 4.2.8 Exit criteria

- [ ] `T3-T5-POSTURE.md` ratified.
- [ ] Sprint defaults to Option A (T5 emit deferred). If Option B is to be exercised, the spec carries an explicit operator-ratified line authorizing it; absent that line, Option A is binding.
- [ ] If Option A (default): no new replay module, no `src/theatres/solar-wind-divergence.js` touch, no new T5 replay tests.
- [ ] If Option B (only on explicit ratification): T5 trajectory shape emitted; existing T5 scoring numerics byte-stable; tests green; `src/theatres/solar-wind-divergence.js` change is surgical default-preserving injection only.
- [ ] All existing tests still pass.
- [ ] `/review-sprint sprint-04` APPROVED.
- [ ] `/audit-sprint sprint-04` APPROVED.
- [ ] Honest-framing language ready for Sprint 06 to cite.

#### 4.2.9 Hard stops

- Any change request that would cause T3 or T5 to be counted toward predictive uplift.
- Any change to T3 / T5 scoring numerics (must stay byte-stable).
- Any decision to widen CORONA scope to emit a T3 prediction (Q2 forbids; would require charter amendment).
- Any change to `src/rlmf/certificates.js`.
- Option B work begun without an explicit operator ratification line in `T3-T5-POSTURE.md` authorizing it — halt and return to Option A default.

---

### 4.3 Sprint 05 — Sensitivity proof (two-direction test)

**Folder**: `grimoires/loa/a2a/cycle-002/sprint-05/`
**Spec name**: `SENSITIVITY-PROOF.md` (proposed; ratified at Sprint 05 entry)
**Earns**: Rung 2 (runtime-sensitive) per [CHARTER §10](sprint-00/CHARTER.md).

#### 4.3.1 Objective

Demonstrate that the cycle-002 backtest harness IS sensitive to runtime parameter changes — i.e., a controlled perturbation of one T4 runtime parameter (per [Q8 / CHARTER §1](sprint-00/CHARTER.md)) deterministically changes the T4 cycle-002-replay Brier score, AND reverting the perturbation restores the prior score byte-identically. This is the binding evidence the harness is exercising the runtime model rather than a constant.

The chosen knob is T4-only per [CHARTER §1 Q8](sprint-00/CHARTER.md): T4 PRODUCTIVITY_PARAMS / Wheatland λ. T1/T2 sensitivity proof is explicitly deferred; the cycle-001 corpus shape would render any T1/T2 perturbation invisible (trajectory is base_rate-only).

**Perturbation-mechanism preference (binding for Sprint 05 design)**:

1. **Preferred**: fixture-based or injection-based perturbation that does NOT touch `src/`. Examples:
   - A test fixture that constructs a runtime theatre with overridden parameters (e.g., a parameter-injection seam exposed via the existing `createX` constructor or a Sprint 05-introduced parameter-injection seam scoped to test code only).
   - A Sprint 05-introduced narrowly-scoped option-bag arg that flows perturbed parameter values from the replay context, with the live runtime path's default-preserving behavior fully preserved (analogous to the Sprint 02 `{ now }` pattern).
   - A purely test-side wrapper that intercepts the parameter at the boundary and substitutes the perturbed value before the runtime function is called.
2. **Discouraged**: editing `src/theatres/proton-cascade.js` (or any other `src/` file) to apply the perturbation, even if the edit is reverted at sprint close. The auditability of "no permanent runtime change" is much stronger when `src/` was never touched at all.
3. **Halt rule (binding)**: if the engineer or implementation discovers that no fixture/injection path exists and source mutation appears necessary to apply or revert the perturbation, **HALT and ask the operator before proceeding**. Do not unilaterally edit `src/` even with a planned revert. The operator decides whether to (a) authorize a temporary surgical edit with binding revert protocol, (b) authorize a Sprint 05-scoped parameter-injection seam (analogous to Sprint 02's `{ now }`), or (c) defer Sprint 05 until a fixture path is engineered.
4. **Permanent runtime parameter change is FORBIDDEN under all options**. Sprint 05 is sensitivity proof, not refit. The no-refit covenant ([CHARTER §8.3](sprint-00/CHARTER.md)) binds across the full duration of Sprint 05. At Sprint 05 close, every `src/` file must be byte-identical to the Sprint 04 close state — verified by `git diff` returning empty for `src/`.

#### 4.3.2 In-scope

1. Pick the perturbation knob and amount (Sprint 05 spec ratifies):
   - Default per [CHARTER §1 Q8](sprint-00/CHARTER.md): one numeric value in [src/theatres/proton-cascade.js PRODUCTIVITY_PARAMS](../../../../src/theatres/proton-cascade.js) (or another single isolated T4 knob).
   - Magnitude: small enough to be reversible (e.g., ±25%); large enough to produce a measurable Brier delta on the 5-event T4 corpus.
2. Two-direction test fixture (or runtime-replay invocation pattern), implemented via the §4.3.1 perturbation-mechanism preference (fixture/injection preferred; source mutation only on operator authorization):
   - Direction A — applies the perturbation via fixture/injection; runs cycle-002 entrypoint in replay mode; produces `cycle-002-run-2/` (or analogous) output. Records the resulting T4 Brier vs Baseline B.
   - Direction B — reverts the perturbation (runtime parameter value byte-identical to pre-test, ideally because `src/` was never touched); reruns; produces `cycle-002-run-3/` output. Asserts the resulting T4 Brier is byte-identical to Baseline B (cycle-002-run-1) numerics.
3. Manifest update — additive cycle-002 manifest entries for `cycle-002-run-2/` and `cycle-002-run-3/`, recording the perturbation and revert in the provenance chain. Cycle-001 manifest stays immutable; cycle-002 manifest is extended additively.
4. Perturbation diff documented (which file, which line, which value, which delta).
5. Optional: lay groundwork for [Sprint 06](#44-sprint-06--closeout--honest-framing) Rung 3 evaluation if literature evidence justifies a refit (NOT required by Sprint 05; Rung 3 is conditional).

#### 4.3.3 Out-of-scope

- Sensitivity proof on T1/T2 (corpus shape forecloses; explicitly deferred per [CHARTER §10 Rung 2 closeout-prohibition clause](sprint-00/CHARTER.md)).
- ANY perturbation of T3 or T5 (Q2/Q3 freezes).
- Permanent runtime parameter refit. After Direction B, runtime parameter value is byte-identical to Baseline B's. Refit (if any) is Rung 3 / future-cycle territory and requires a separate plan.
- ANY change to `src/rlmf/certificates.js` (Q1 freeze).
- ANY change to the cycle-002 entrypoint that wasn't in [Sprint 03 §4.1.4 Likely files](#414-likely-files-writes-edits-new). Sprint 05 reuses the entrypoint; doesn't redesign it.
- ANY use of bucket-projection for T1/T2 (CHARTER §9.4 closed).
- README, BFZ, version, or tag changes.

#### 4.3.4 Likely files

| Path | Action |
|---|---|
| `grimoires/loa/a2a/cycle-002/sprint-05/SENSITIVITY-PROOF.md` | New (Sprint 05 spec). |
| `tests/sensitivity-proof-T4-test.js` (or similar) | New — programmatic two-direction assertion. |
| `grimoires/loa/calibration/corona/cycle-002-run-2/` | New (perturbation direction). |
| `grimoires/loa/calibration/corona/cycle-002-run-3/` | New (revert direction). |
| `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` | Edit (additive entries; cycle-001 manifest still immutable). |
| `grimoires/loa/a2a/cycle-002/sprint-05/{reviewer,engineer-feedback,auditor-sprint-feedback}.md` | New. |

**No source code change is expected.** The default Sprint 05 implementation applies the perturbation via fixture or injection; `src/` is never touched. If during implementation the engineer determines no fixture/injection path exists, Sprint 05 HALTS and surfaces the situation to the operator (per §4.3.1 halt rule). Only if the operator explicitly authorizes a temporary perturbation directly in `src/theatres/proton-cascade.js` (or another `src/` file) for the perturbation run, the post-revert state MUST be byte-identical to pre-test, verified by `git diff` returning empty for that file at Sprint 05 close. Permanent runtime parameter change remains forbidden under all options.

#### 4.3.5 Forbidden files

Same set as [Sprint 03 forbidden files](#415-forbidden-files-sprint-03-must-not-touch). Plus tighter rules specific to Sprint 05:

- At Sprint 05 close, `git diff` against pre-test commit MUST show zero diff in any `src/` file. Mechanism preference: the perturbation is fixture-only or injection-only and `src/` is never touched at all.
- Source mutation in `src/` to apply the perturbation is FORBIDDEN by default. It becomes permitted only if the operator explicitly authorizes it after Sprint 05 has halted and surfaced the lack of fixture/injection path (per §4.3.1 halt rule). Even with authorization, the operator may still prefer option (c) — defer Sprint 05 until a fixture is engineered — over option (a) — temporary `src/` edit with revert.
- Permanent runtime parameter change in `src/` is FORBIDDEN under every option. The no-refit covenant ([CHARTER §8.3](sprint-00/CHARTER.md)) binds across the full duration of Sprint 05.

#### 4.3.6 Tests

- Two-direction assertion: T4 Brier(Direction A) ≠ T4 Brier(Baseline B) by at least the documented magnitude AND T4 Brier(Direction B) byte-identical to T4 Brier(Baseline B).
- corpus_hash invariant preserved across both directions.
- Replay-twice byte-identical determinism preserved within each direction.
- Cycle-001 manifest hashes still match (immutability gate).
- All existing 261+Sprint03 tests still green.

#### 4.3.7 Review / audit gates

| Gate | Skill | Output |
|---|---|---|
| Implementation | `/implement sprint-05` | Sensitivity proof artifacts. |
| Review | `/review-sprint sprint-05` | `engineer-feedback.md`. |
| Audit | `/audit-sprint sprint-05` | `auditor-sprint-feedback.md`. |
| Commit gate | HITL | Single commit after gates pass. |

#### 4.3.8 Exit criteria

- [ ] Two-direction test ratified and executed.
- [ ] T4 Brier moved measurably under Direction A.
- [ ] T4 Brier reverted byte-identically under Direction B.
- [ ] Perturbation diff documented with file:line and magnitude.
- [ ] cycle-002 manifest extended additively for run-2 and run-3.
- [ ] `git diff` of `src/` files between pre-test and Sprint 05 close is empty (no permanent runtime change).
- [ ] cycle-001 manifest hashes and reproducibility lane intact.
- [ ] `/review-sprint sprint-05` APPROVED.
- [ ] `/audit-sprint sprint-05` APPROVED.

#### 4.3.9 Hard stops

- Direction B does NOT restore byte-identical T4 Brier (would imply nondeterminism on the replay path; halt and surface immediately).
- Perturbation does NOT change T4 Brier in Direction A (would imply harness is not actually exercising the runtime; halt and surface).
- Cycle-001 manifest mutation appears necessary.
- Net `src/` diff non-empty at Sprint 05 close.
- Sensitivity proof attempted on T1/T2/T3/T5 (explicitly forbidden by [CHARTER §10 Rung 2](sprint-00/CHARTER.md)).
- Engineer determines no fixture/injection path exists and source mutation appears necessary — HALT and ask operator before any `src/` edit (per §4.3.1 halt rule). Do NOT edit `src/` unilaterally even with a planned revert.
- Any permanent runtime parameter change is attempted (Sprint 05 is sensitivity proof, not refit; permanent change is Rung 3 / future-cycle territory).

---

### 4.4 Sprint 06 — Closeout / honest framing

**Folder**: `grimoires/loa/a2a/cycle-002/sprint-06/`
**Spec name**: `CLOSEOUT.md` (proposed; ratified at Sprint 06 entry)
**Earns**: Rung 4 ONLY IF Rung 3 was earned. Otherwise stays at the highest rung actually earned (Rung 1 or Rung 2).

#### 4.4.1 Objective

Produce cycle-002 closeout artifacts honestly framed against whichever rung the cycle has actually earned. Bind cycle-closeout language to evidence; never to aspiration. Reconcile Sprint 03 Baseline B with cycle-001 Baseline A under separate columns ([CHARTER §8.2](sprint-00/CHARTER.md)). Decide tag posture (v0.3.0 only if Rung 4 earned). Close the cycle.

#### 4.4.2 In-scope

1. Closeout document at `grimoires/loa/a2a/cycle-002/sprint-06/CLOSEOUT.md`:
   - Evidence walk: Sprint 02 (T4 Rung 1 earned; T1/T2 Rung 1 narrow form earned with prior-only disclosure); Sprint 03 (Baseline B anchored; entrypoint wired; manifest additively committed); Sprint 04 (T3+T5 posture locked); Sprint 05 (Rung 2 earned IF two-direction test green; otherwise NOT earned and the closeout halts at Rung 1).
   - Side-by-side comparison: Baseline A `[corpus-uniform-prior cycle-001]` columns vs Baseline B `[runtime-replay cycle-002]` columns, never blended ([CHARTER §8.2](sprint-00/CHARTER.md)).
   - Two-summary discipline applied to closeout: runtime-uplift composite (T1+T2+T4) and full-picture diagnostic (all 5).
   - Explicit theatre-tagged rung claims (e.g., "T4 [runtime-bucket] Rung 1 earned (runtime-wired)", "T4 [runtime-bucket] Rung 2 earned (runtime-sensitive)").
   - Explicit T1/T2 prior-only honest-framing carry-forward.
   - Explicit T3 [external-model] / T5 [quality-of-behavior] non-uplift framing.
   - One-line audit note: "RLMF certificate format (`src/rlmf/certificates.js` `version: '0.1.0'`) unchanged in cycle-002."
   - One-line audit note: "Cycle-001 calibration manifest `corpus_hash = b1caef3f…11bb1` and `script_hash = 17f6380b…1730f1` unchanged across cycle-002."
2. README + BFZ updates — ADDITIVE cycle-002 sections only ([CHARTER §3.6](sprint-00/CHARTER.md)):
   - **Only if Rung 3 or Rung 4 earned**, AND only the additive cycle-002 section. Cycle-001 closeout language is preserved verbatim. Honest-framing grep gate runs on the full README+BFZ, not just the new section.
   - If only Rung 1 or Rung 2 earned: README+BFZ get a small "cycle-002 wired runtime trajectories into backtest scoring; calibration-improved NOT claimed" addendum, with the binding "calibration-attempted, not improved" framing carried forward verbatim.
3. Tag posture decision:
   - Rung 4 earned → v0.3.0 annotated tag MAY be created (Sprint 06 deliverable); the bump is a fresh annotated tag, never a retag of v0.2.0.
   - Rung 3 earned but Rung 4 conditions incomplete → tag deferred; cycle stays v0.2.x.
   - Rung 1 or Rung 2 only → tag NOT created; cycle stays v0.2.x.
4. Honest-framing grep gate:
   - `grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"` on cycle-002 closeout artifacts MUST return only NEGATIONS or zero matches outside an explicit, theatre-qualified, evidence-citing claim section.
5. Cycle-002 archive — finalize cycle-002 namespace; mark cycle-002 closed; update memory accordingly.

#### 4.4.3 Out-of-scope

- ANY new feature, source change, scoring change, or test addition. Sprint 06 is closeout; engineering complete.
- ANY GitHub Release creation (tag-only at most; release is a separate gate per cycle-001 carryover).
- ANY rewrite of cycle-001 closeout language (BFZ, README, calibration tree, sprint-{0..7}/, NOTES — all immutable).
- ANY mutation of cycle-001 manifest.
- ANY relaxation of the cycle-001 honest-framing memory binding.

#### 4.4.4 Likely files

| Path | Action |
|---|---|
| `grimoires/loa/a2a/cycle-002/sprint-06/CLOSEOUT.md` | New. |
| `BUTTERFREEZONE.md` | Edit ONLY IF Rung-N closeout language earned; cycle-002 additive section only. |
| `README.md` | Edit ONLY IF Rung-N closeout language earned; cycle-002 additive section only. |
| `package.json` `version` | Edit IFF Rung 4 earned (v0.2.x → v0.3.0). |
| Annotated tag (v0.3.0) | Created IFF Rung 4 earned + operator authorization. |
| `grimoires/loa/a2a/cycle-002/sprint-06/{reviewer,engineer-feedback,auditor-sprint-feedback}.md` | New. |

#### 4.4.5 Forbidden files

Same set as [Sprint 03 forbidden files](#415-forbidden-files-sprint-03-must-not-touch). Plus:
- Cycle-001 closeout language in BFZ, README, BUTTERFREEZONE, calibration tree, sprint-{0..7}/, NOTES — append-only with `[cycle-002]` prefix only.

#### 4.4.6 Tests

No new tests. Existing test count from Sprint 05 close stays green.

Honest-framing grep gate is the closeout-time binding:

```
grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record" \
  -- BUTTERFREEZONE.md README.md \
     grimoires/loa/a2a/cycle-002/sprint-06/CLOSEOUT.md \
     [other Sprint 06 closeout artifacts]
```

The grep must return only NEGATIONS (e.g., "calibration NOT improved", "calibration-attempted, not improved") or zero matches outside an explicit theatre-qualified, Baseline-B-citing claim section. Any positive match in non-claim prose is a hard stop.

#### 4.4.7 Review / audit gates

| Gate | Skill | Output |
|---|---|---|
| Implementation | `/implement sprint-06` | Closeout doc; conditional README/BFZ edits; conditional tag. |
| Review | `/review-sprint sprint-06` | `engineer-feedback.md`. |
| Audit | `/audit-sprint sprint-06` | `auditor-sprint-feedback.md`. |
| README+BFZ patch round | (operator-driven, optional, per cycle-001 pattern) | Round 1 / Round 2 patches if any final-doc audit raises an honest-framing concern. |
| Commit gate | HITL | Final commit; tag (if Rung 4); operator-authorized. |

#### 4.4.8 Exit criteria

- [ ] Closeout document captures actual rung earned with theatre tags.
- [ ] Side-by-side Baseline A vs Baseline B presentation under separated regime columns.
- [ ] T1/T2 prior-only honest-framing carry-forward present and prominent.
- [ ] T3 [external-model] / T5 [quality-of-behavior] non-uplift framing present and prominent.
- [ ] RLMF cert frozen audit-note present.
- [ ] Cycle-001 manifest immutability audit-note present.
- [ ] Honest-framing grep gate clean.
- [ ] If Rung 3 or 4 earned: README+BFZ additive cycle-002 sections committed; cycle-001 closeout language unchanged.
- [ ] If Rung 4 earned + operator authorization: v0.3.0 annotated tag created (fresh, not retag).
- [ ] `/review-sprint sprint-06` APPROVED.
- [ ] `/audit-sprint sprint-06` APPROVED.
- [ ] Memory updated: cycle-002 status (closed/paused) and rung outcome captured.

#### 4.4.9 Hard stops

- Honest-framing grep gate flags a positive match in non-claim prose.
- Any closeout artifact attempts to cite cycle-001 vs cycle-002 cross-regime numerics as "uplift".
- Any closeout artifact attempts to extend "calibration-improved" to T1/T2 absent the corpus-shape prerequisite.
- Any closeout artifact attempts to extend "calibration-improved" to T3 or T5 (forbidden under Q2/Q3).
- Cycle-001 README/BFZ/manifest/closeout text mutated.
- Tag attempted at v0.3.0 without Rung 4 evidence + operator authorization.

---

## 5. Carry-forward risks (cycle-002 wide)

Source register: [PLANNING-FRAME §6](PLANNING-FRAME.md). Mitigations updated to reflect post-Sprint-02 state.

| # | Risk | Severity | Status post-Sprint-02 | Sprint owners |
|---|---|---|---|---|
| R1 | Nondeterministic replay | CRITICAL | Mitigated for T4/T1/T2 via Sprint 02 default-preserving clock injection + replay-mode fail-closed. Must remain green through entrypoint wiring. | Sprint 03 (entrypoint preserves), Sprint 05 (cross-direction). |
| R2 | Evidence leakage (settlement → prediction) | CRITICAL | Author-discipline currently. Audit finding §A1 from Sprint 02 surfaces it. Sprint 03 `loadCorpusWithCutoff` provides the structural fix. | Sprint 03. |
| R3 | False "calibration-improved" claim in closeout | HIGH (binding) | Honest-framing memory binding from cycle-001 carries forward. Two-summary discipline ([CHARTER §4.1](sprint-00/CHARTER.md)) is the structural mitigation. Honest-framing grep gate runs at Sprint 06. | Sprint 03 (claims discipline), Sprint 06 (gate). |
| R4 | T3 semantic corruption (treating WSA-Enlil scoring as CORONA prediction quality) | HIGH | Posture pinned by [Q2 / CHARTER §4](sprint-00/CHARTER.md). Documentation pin in Sprint 04. | Sprint 04. |
| R5 | T5 semantic corruption (converting quality-of-behavior to probabilistic uplift) | HIGH | Posture pinned by [Q3 / CHARTER §4](sprint-00/CHARTER.md). Existing T5 numerics must stay byte-stable through any Sprint 04 Option B work. | Sprint 04. |
| R6 | Overwriting cycle-001 artifacts | HIGH | Cycle-002 namespace `grimoires/loa/a2a/cycle-002/` is binding. Cycle-001 freeze list ([CHARTER §3](sprint-00/CHARTER.md)) holds. | All sprints (compliance). |
| R7 | Manifest churn (script_hash drift trips 30 regression entries) | MEDIUM | Cycle-001 manifest immutable; cycle-002 manifest additive; tests extend additively. `replay_script_hash` is the new field. | Sprint 03. |
| R8 | Test churn (160-test suite breaks under runtime clock-injection) | MEDIUM | Mitigated. 261/261 green at Sprint 02 close. Sprint 03 entrypoint wiring must preserve. | Sprint 03. |
| R9 | Overfitting to tiny corpus slices (5 events/theatre) | MEDIUM | Cycle-002 is measurement-seam, not parameter-refit. Sensitivity proof uses ONE knob. Larger corpus is future-cycle. | Sprint 05 (knob discipline), Sprint 06 (closeout discipline). |
| R10 | Release-hygiene distraction | MEDIUM | Cycle-002 explicitly NOT a release-hygiene cycle ([CHARTER §2.3](sprint-00/CHARTER.md)). Tag posture is conditional. | Sprint 06. |
| R11 | RLMF cert format drift | MEDIUM | Pinned by Q1; cert.js zero-diff at Sprint 02 close; cert non-mutation test in Sprint 02. Sprint 03 hardening may extend coverage to T1/T2/T3/T5 cert paths. | Sprint 03 (optional hardening). |
| R12 | T1/T2 scalar-to-6-bucket projection design | LOW | Closed by [CHARTER §9 (Q7)](sprint-00/CHARTER.md). Bucket-projection escape hatch ([CHARTER §9.4](sprint-00/CHARTER.md)) is gated and not active in cycle-002. | All sprints (compliance). |
| **R13** | **T1/T2 prior-only trajectories on cycle-001 corpus** (NEW; surfaced at Sprint 02 close) | LOW-MEDIUM | Honest-framing disclosure binding on cycle ([reviewer.md M2 BINDING DISCLOSURE](sprint-02/reviewer.md)). T1/T2 cannot earn Rung 3 absent corpus expansion. Sprint 03 may add a `current_position_at_cutoff == base_rate` regression guard (audit finding §A3). Sprint 06 carries the framing forward. | Sprint 03 (guard), Sprint 06 (closeout language). |
| **R14** | **`base_rate` / runtime-parameter silent drift on T1/T2** (NEW; surfaced as audit §A3) | LOW | Manifest has no entries on `flare-gate.js` / `geomag-gate.js`; `manifest_regression_test` does not catch silent base_rate change. Mitigation: Sprint 03 adds a `base_rate`-equality guard for T1/T2 OR a manifest entry pinning the constant. | Sprint 03 (optional). |

---

## 6. Command discipline (binding for Sprints 03–06)

### 6.1 Sprint command sequence

For each remaining sprint (03, 04, 05, 06), the operator runs exactly this sequence, in order, in a single working tree dedicated to that sprint:

1. **Spec ratification (operator gate)** — operator drafts and ratifies `grimoires/loa/a2a/cycle-002/sprint-NN/<SPEC>.md` per the structure in [§4](#4-remaining-sprint-plan-sprints-0306). No implementation begins until ratified.
2. **`/implement sprint-NN`** — implementation proceeds against the ratified spec. Routing source: [cycle-002 SPRINT-LEDGER.md](SPRINT-LEDGER.md). The Loa Sprint Ledger does NOT contain cycle-002 entries; the cycle-002 ledger is the binding routing source. Cycle-001 `grimoires/loa/sprint.md` is FROZEN and is NOT a target.
3. **`/review-sprint sprint-NN`** — produces `grimoires/loa/a2a/cycle-002/sprint-NN/engineer-feedback.md`. Verdict must be APPROVED before audit.
4. **`/audit-sprint sprint-NN`** — produces `grimoires/loa/a2a/cycle-002/sprint-NN/auditor-sprint-feedback.md`. Verdict must be APPROVED.
5. **Tests green** — `npm test` reports zero failures.
6. **Operator commit gate (HITL)** — operator authorizes a single commit for the sprint. Commit message uses cycle-002-prefixed conventional-commit format (e.g., `feat(corona): wire runtime replay entrypoint for cycle-002 sprint 3`).
7. **Operator stop** — sprint exits; await operator's "Sprint NN ratified, draft Sprint NN+1" signal.

### 6.2 Inviolable commit rule

**No commit before review + audit + tests green.** Hooks may enforce this; the operator HITL discipline binds it as well. Specifically:

- A commit landing without `engineer-feedback.md` + `auditor-sprint-feedback.md` BOTH at APPROVED is a process violation.
- A commit landing with `npm test` reporting any failure is a process violation.
- Tag-readiness check at Sprint 06 is a separate command from tag creation; the operator inspects readiness before authorizing the tag.

### 6.3 Working-tree discipline

**Do not combine Sprints 03/04/05/06 in one working tree.** Each sprint is its own implement → review → audit → commit cycle in its own working tree (or its own series of cleanly separated commits). Specifically:

- Sprint 03 implementation, review, audit, and commit complete BEFORE Sprint 04 starts.
- Sprint 04 begins in a clean working tree (post-Sprint-03 commit as base).
- Sprint 05 begins in a clean working tree (post-Sprint-04 commit as base).
- Sprint 06 begins in a clean working tree (post-Sprint-05 commit as base).
- No cross-sprint mixed diffs; no "while I'm in here" drive-by changes; no batched "I'll review them all together" rolling commits.

This preserves the auditability of the cycle-002 sprint chain and matches the cycle-001 closeout discipline.

### 6.4 Ledger routing

[SPRINT-LEDGER.md](SPRINT-LEDGER.md) governs `/implement` / `/review-sprint` / `/audit-sprint` routing for cycle-002:

- `sprint-00` → `grimoires/loa/a2a/cycle-002/sprint-00/CHARTER.md` (ratified).
- `sprint-01` → `grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md` (ratified).
- `sprint-02` → `grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md` + reviewer/engineer/auditor (committed at `c9535386`).
- `sprint-03` → existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts (operator ratification: Sprint 03 intentionally skips a separate `ENTRYPOINT-MANIFEST.md`; `/implement sprint-03` routes through the cycle-002 ledger and proceeds directly against those documents).
- Sprint folders 04, 05, 06 — likewise.

When the operator invokes `/implement sprint-03` (etc.), routing resolves through THIS ledger, not through frozen cycle-001 sprint files at `grimoires/loa/a2a/sprint-{0..7}/`.

### 6.5 Safety rule (carry-forward from ledger §safety)

If a command would write outside `grimoires/loa/a2a/cycle-002/`, or would touch source / tests / scripts / manifests, state that explicitly before proceeding. Full path audit is required for: writing outside cycle-002 a2a namespace; editing existing files; touching source/tests/scripts/runtime/RLMF; touching manifests; detecting collision risk; changing command routing or sprint ledger structure.

For normal cycle-002 planning docs (like THIS document, which is new and inside `grimoires/loa/a2a/cycle-002/`), compact path assertion suffices.

---

## 7. Cross-references

### 7.1 Cycle-002 inputs

- [SPRINT-LEDGER.md](SPRINT-LEDGER.md) — command-routing source of truth.
- [PLANNING-FRAME.md](PLANNING-FRAME.md) — repo findings, risk register, candidate sprint sequence.
- [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) — eight P0/P1/P2/P3 questions and their default recommendations.
- [sprint-00/CHARTER.md](sprint-00/CHARTER.md) — cycle-002 charter (binding decisions Q1–Q8; theatre posture; success ladder).
- [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md) — `PredictionTrajectory` contract.
- [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md) — Sprint 02 design.
- [sprint-02/reviewer.md](sprint-02/reviewer.md) — Sprint 02 implementation report (milestones 1+2; T1/T2 prior-only honest-framing disclosure).
- [sprint-02/engineer-feedback.md](sprint-02/engineer-feedback.md) — Sprint 02 review (APPROVED, non-blocking concerns).
- [sprint-02/auditor-sprint-feedback.md](sprint-02/auditor-sprint-feedback.md) — Sprint 02 audit (APPROVED, two recommendations).

### 7.2 Cycle-001 frozen references (consult, never edit)

- [grimoires/loa/prd.md](../../prd.md) — cycle-001 PRD (historical).
- [grimoires/loa/sdd.md](../../sdd.md) — cycle-001 SDD (historical).
- [grimoires/loa/sprint.md](../../sprint.md) — cycle-001 sprint plan (historical; NOT a cycle-002 routing target).
- [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) — frozen historical evidence.
- [grimoires/loa/calibration/corona/run-3-final/](../../calibration/corona/run-3-final/) — cycle-001 final run; `corpus_hash = b1caef3f…11bb1`, `script_hash = 17f6380b…1730f1`.
- [grimoires/loa/calibration/corona/run-3-final/delta-report.md](../../calibration/corona/run-3-final/delta-report.md) — architectural-reality framing for Run 1 = Run 2 = Run-3-final identity.
- [BUTTERFREEZONE.md](../../../../BUTTERFREEZONE.md) — cycle-001 closeout snapshot at v0.2.0.
- [README.md](../../../../README.md) — cycle-001 closeout posture.

### 7.3 Source files (read-only baseline; cycle-002 source touches restricted to charter-permitted seams)

- [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) — Sprint 02 modified (default-preserving `{ now }` injection).
- [src/theatres/flare-gate.js](../../../../src/theatres/flare-gate.js) — Sprint 02 modified.
- [src/theatres/geomag-gate.js](../../../../src/theatres/geomag-gate.js) — Sprint 02 modified.
- [src/theatres/cme-arrival.js](../../../../src/theatres/cme-arrival.js) — UNCHANGED in cycle-002 (T3 freeze).
- [src/theatres/solar-wind-divergence.js](../../../../src/theatres/solar-wind-divergence.js) — UNCHANGED in cycle-002 (T5 freeze; possible Sprint 04 Option B exception).
- [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js) — FROZEN at `version: '0.1.0'` (Q1 freeze).
- [src/processor/settlement.js](../../../../src/processor/settlement.js) — FROZEN.
- [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) — entrypoint; unchanged at Sprint 02 close; Sprint 03 wires replay mode.
- [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) — Sprint 03 adds `loadCorpusWithCutoff` (additive export).
- [scripts/corona-backtest/replay/](../../../../scripts/corona-backtest/replay/) — Sprint 02 deliverables.
- [scripts/corona-backtest/scoring/](../../../../scripts/corona-backtest/scoring/) — `t{1,2}-binary-brier.js` Sprint 02 deliverables; `t{1,2,4}-bucket-brier.js` legacy frozen; `t3-timing-error.js`/`t5-quality-of-behavior.js` unchanged.

---

## 8. Plan-completion / non-implementation guarantees

This planning document ships:

- `grimoires/loa/a2a/cycle-002/CYCLE-002-SPRINT-PLAN.md` (the only file written by this planning task).

This planning document does NOT ship:

- Any source-code change.
- Any test change.
- Any scripts change.
- Any manifest creation.
- Any runtime change.
- Any commit, tag, or version bump.
- Any modification to cycle-001 docs, manifests, sprint folders, or run outputs.
- Any new dependency.
- Any modification to existing cycle-002 sprint folders (sprint-00, sprint-01, sprint-02 stay as committed at `c9535386` / `6e711be`).

This plan exits when the operator either (a) ratifies it as the binding cycle-002 sprint plan and authorizes Sprint 03 spec drafting, OR (b) instructs amendments to specific sections and re-routes accordingly.

---

*Cycle-002 sprint plan authored 2026-05-01. Post-Sprint-02 state. Routing source: [SPRINT-LEDGER.md](SPRINT-LEDGER.md). corpus_hash invariant `b1caef3f…11bb1` (cycle-001 anchor; preserved). RLMF cert format unchanged. Cycle-001 honest-framing memory binding governs. No implementation. No source/test/scripts/manifest/runtime changes. Operator ratification gate pending.*
