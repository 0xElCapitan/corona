# CORONA cycle-002 — Software Design Document (synthesis)

**Status**: cycle-level synthesis SDD. Consolidates already-ratified cycle-002 architectural decisions; does NOT invent new design beyond what [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md) already allows.
**Authored**: 2026-05-01
**Cycle**: cycle-002 (post-Sprint-02 commit `c9535386`; sprint plan commit `da53606`).
**Companion document**: [PRD.md](PRD.md).

> This SDD is a synthesis document. It distills the architectural decisions in [sprint-00/CHARTER.md](sprint-00/CHARTER.md), [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md), [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md), and [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md) into a single cycle-level architectural reference. When this document and any canonical source appear to disagree, the canonical sources are authoritative. The cycle-001 SDD at [grimoires/loa/sdd.md](../../sdd.md) is FROZEN historical and is NOT a target for this SDD.

---

## 1. Architecture overview

### 1.1 Two-zone runtime/backtest model

CORONA cycle-002 introduces a **measurement seam** without restructuring the existing runtime. The architecture has two clearly separated zones, both pre-existing from cycle-001:

| Zone | Purpose | Cycle-002 mutation surface |
|---|---|---|
| **Runtime** ([src/](../../../../src/)) | Live theatre processing; emits `current_position` + `position_history` per theatre; exports RLMF certificates via [src/rlmf/certificates.js](../../../../src/rlmf/certificates.js). | Surgical default-preserving `{ now }` injection only. RLMF cert FROZEN by Q1. |
| **Backtest** (cycle-001 entrypoint [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) + cycle-002 entrypoint `scripts/corona-backtest-cycle-002.js` (NEW, Sprint 03) + [scripts/corona-backtest/](../../../../scripts/corona-backtest/)) | Offline calibration scoring on a frozen corpus; emits per-theatre + summary reports. | New `replay/` seam (Sprint 02); new `scoring/t{1,2}-binary-brier.js` (Sprint 02); NEW separate cycle-002 entrypoint at `scripts/corona-backtest-cycle-002.js` (Sprint 03); additive cycle-002 manifest (Sprint 03). Legacy 6-bucket scorers FROZEN. **Cycle-001 entrypoint `scripts/corona-backtest.js` stays byte-frozen — never edited in cycle-002.** |

The seam is the new **PredictionTrajectory** boundary type ([sprint-01/CONTRACT.md §3](sprint-01/CONTRACT.md)) — a backtest-side artifact that descriptively serializes runtime state. The trajectory does NOT propagate into the RLMF certificate path; it does NOT mutate the runtime.

### 1.2 The seam at a glance

```
                  Cycle-002 measurement seam (additive; two separate entrypoints)
                  ═══════════════════════════════════════════════════════════════

  ┌──────────────────────┐                                  ┌──────────────────────────┐
  │ Frozen corpus        │                                  │ Cycle-001 reproducibility │
  │ (5 events / theatre) │                                  │ lane: script_hash =       │
  │ corpus_hash =        │                                  │ 17f6380b…1730f1           │
  │ b1caef3f…11bb1       │                                  │ (frozen by I1)            │
  └──────────┬───────────┘                                  └──────────────┬───────────┘
             │                                                             │ invoke
             │                                                             ▼
             │                       ┌──────────────────────────────────────────────────┐
             │   cycle-001 lane      │ scripts/corona-backtest.js                       │
             ├──────────────────────▶│ FROZEN cycle-001 reproducibility entrypoint —    │
             │   loadCorpus           │ Sprint 03 does NOT edit this file. Path:         │
             │   (existing, frozen)  │   loadCorpus → legacy scoreCorpusT{1..5} →       │
             │                       │   run-N/ output, script_hash = 17f6380b…1730f1   │
             │                       └──────────────────────────────────────────────────┘
             │
             │                       ┌──────────────────────────────────────────────────┐
             │   cycle-002 lane      │ scripts/corona-backtest-cycle-002.js (NEW)       │
             └──────────────────────▶│ Sprint 03 entrypoint. Owns:                      │
                 loadCorpusWithCutoff │   • runtime replay dispatch                      │
                 (additive, Sprint 03)│   • two-summary reporting                        │
                                      │   • cycle-002-run-N/ output dir creation         │
                                      │   • additive runtime-replay-manifest.json write  │
                                      │   • replay_script_hash provenance computation    │
                                      └────────────────────────┬─────────────────────────┘
                                                               │
                                                               ▼
                                      ┌────────────────────────┐
                                      │ replay/                │
                                      │  ├ context.js          │
                                      │  ├ canonical-json.js   │
                                      │  ├ hashes.js           │
                                      │  ├ t1-replay.js        │ ── invokes ──▶ src/theatres/
                                      │  ├ t2-replay.js        │   {flare-gate,                ┌──────────────────┐
                                      │  └ t4-replay.js        │    geomag-gate,             ─▶│ src/rlmf/        │
                                      └───────────┬────────────┘    proton-cascade}.js          │ certificates.js  │
                                                  │   {now} injection                            │ FROZEN @ 0.1.0   │
                                                  ▼   default-preserving                         └──────────────────┘
                                      ┌────────────────────────┐                                  (NEVER mutated)
                                      │ PredictionTrajectory   │
                                      │ (binary_scalar /       │
                                      │  bucket_array_5 /      │
                                      │  corpus_anchored_      │
                                      │  external)             │
                                      └───────────┬────────────┘
                                                  │
                                                  ▼
                  ┌────────────────────────────┐       ┌────────────────────────────┐
                  │ scoring/                   │ T4    │ scoring/                   │
                  │  t{1,2}-binary-brier.js   │  ◀──  │  t{1,2,4}-bucket-brier.js  │
                  │  (NEW, Sprint 02)          │       │  (LEGACY; corpus-baseline  │
                  │  t4-bucket-brier.js        │       │   diagnostic only; FROZEN) │
                  │  (existing; consumes       │       └────────────────────────────┘
                  │   trajectory bucket array) │
                  └──────────────┬─────────────┘
                                 │
                                 ▼
       ┌────────────────────────────────────────────────┐    ┌────────────────────────────────────┐
       │ Two-summary reporting (cycle-002 entrypoint)   │    │ cycle-002/runtime-replay-          │
       │  ├ runtime-uplift-summary.md (T1+T2+T4 only)   │───▶│ manifest.json (additive, Sprint 03)│
       │  └ diagnostic-summary.md (all 5; tagged        │    │  carries replay_script_hash field  │
       │    [diagnostic])                               │    └────────────────────────────────────┘
       └────────────────────────────────────────────────┘
```

### 1.3 Architectural invariants (binding cycle-wide)

| # | Invariant | Source |
|---|---|---|
| I1 | Default-mode entrypoint reproduces cycle-001 `script_hash = 17f6380b…1730f1` byte-identically. | [SPRINT-PLAN §4.1.2](CYCLE-002-SPRINT-PLAN.md), [sprint-00/CHARTER.md §3](sprint-00/CHARTER.md) |
| I2 | Cycle-001 `corpus_hash = b1caef3f…11bb1` preserved across the entire cycle (corpus frozen). | [CHARTER §3.4](sprint-00/CHARTER.md) |
| I3 | RLMF certificate format (`src/rlmf/certificates.js` `version: '0.1.0'`, schema, brier formulas, position_history shape) unchanged through Sprint 06. | [CHARTER §1 Q1, §5](sprint-00/CHARTER.md) |
| I4 | Cycle-001 calibration manifest entries' hashes are NEVER mutated. Cycle-002 manifest is additive. | [CHARTER §6](sprint-00/CHARTER.md), [Q4](OPEN-QUESTIONS.md) |
| I5 | Replay-twice byte-identical canonical JSON for any (corpus_event, runtime_revision, contract_version) triple. | [CONTRACT §9.1](sprint-01/CONTRACT.md) |
| I6 | Replay path NEVER falls back to `Date.now()` (fail-closed). Live runtime path keeps `Date.now()` default. | [CONTRACT §10.1.1](sprint-01/CONTRACT.md) |
| I7 | No new runtime dependencies. `package.json dependencies: {}` invariant holds. | [CHARTER §3.5](sprint-00/CHARTER.md) |
| I8 | All existing tests stay green at every sprint commit (Sprint 02 baseline: 261/261). | [CHARTER §2.4](sprint-00/CHARTER.md), [SPRINT-PLAN §4.1.6](CYCLE-002-SPRINT-PLAN.md) |
| I9 | No permanent runtime parameter change between Sprint 03 close (Baseline B anchor) and a future Rung 3 cycle. | [CHARTER §8.3](sprint-00/CHARTER.md) |

---

## 2. Current Sprint 02 replay seam (shipped)

Source: [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md), [sprint-02/reviewer.md](sprint-02/reviewer.md), committed at `c9535386`.

### 2.1 Module layout

```
scripts/corona-backtest/replay/
├── canonical-json.js   # ~75 LOC, zero deps. canonicalize(value); rejects NaN/Infinity/undefined/BigInt/Function/Symbol.
├── hashes.js           # ~52 LOC. sha256OfCanonical, computeTrajectoryHash, verifyTrajectoryHash.
├── context.js          # ~107 LOC. createReplayContext, assertReplayMode, deriveReplayClockSeed (fail-closed).
├── t1-replay.js        # replay_T1_event(corpus_event, ctx)  → binary_scalar trajectory.
├── t2-replay.js        # replay_T2_event(corpus_event, ctx)  → binary_scalar trajectory (GFZ-preferred outcome).
└── t4-replay.js        # replay_T4_event(corpus_event, ctx)  → bucket_array_5 trajectory (Wheatland-prior-derived).

scripts/corona-backtest/scoring/
├── t1-binary-brier.js  # NEW — scoreEventT1Binary, scoreCorpusT1Binary; (p-o)² formula.
└── t2-binary-brier.js  # NEW — scoreEventT2Binary, scoreCorpusT2Binary; GFZ-preferred Kp comparison.

src/theatres/
├── flare-gate.js       # Sprint 02: createFlareClassGate, processFlareClassGate, expireFlareClassGate gain { now: nowFn = () => Date.now() } = {} arg.
├── geomag-gate.js      # Sprint 02: 3 top-level + 4 internal helpers gain nowFn parameter.
└── proton-cascade.js   # Sprint 02: createProtonEventCascade, processProtonEventCascade, resolveProtonEventCascade gain { now: nowFn } arg.
```

### 2.2 PredictionTrajectory shape (canonical)

Per [sprint-01/CONTRACT.md §3](sprint-01/CONTRACT.md), trajectories carry: `schema_version`, `theatre_id`, `theatre_template`, `event_id`, `distribution_shape`, `cutoff`, `gate_params`, `position_history_at_cutoff`, `current_position_at_cutoff`, `evidence_bundles_consumed`, `outcome`, `meta`.

Closed set of `distribution_shape` values:

| Value | Used by | Outcome kind |
|---|---|---|
| `binary_scalar` | T1, T2 | `binary` (0/1 derived from corpus settlement) |
| `bucket_array_5` | T4 | `bucket_index` (integer 0..4 via BUCKETS.findIndex) |
| `corpus_anchored_external` | T3 | `timing_minutes` (WSA-Enlil − L1 shock) |
| `quality_of_behavior` | T5 (opt-in, deferred by default in cycle-002) | `quality_of_behavior` (settlement object passthrough) |

`bucket_projected` is closed by [CHARTER §9.4](sprint-00/CHARTER.md); not active in cycle-002.

### 2.3 Sprint 02 evidence (binding gates)

- T4 replay-twice byte-identical for ALL 5 cycle-001 T4 corpus events ([tests/replay-determinism-T4-test.js](../../../../tests/replay-determinism-T4-test.js)).
- T1+T2 replay-twice byte-identical for ALL 10 cycle-001 T1+T2 corpus events ([tests/replay-determinism-T1T2-test.js](../../../../tests/replay-determinism-T1T2-test.js)).
- T4 trajectory's `current_position_at_cutoff` materially differs from `UNIFORM_PRIOR` ([tests/replay-T4-scored-through-runtime-bucket-test.js](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js) lines 96–110).
- RLMF cert format byte-stable under fixed clock injection ([tests/replay-rlmf-cert-non-mutation-test.js](../../../../tests/replay-rlmf-cert-non-mutation-test.js)).
- 261/261 tests pass (160 cycle-001 baseline + 54 milestone-1 + 47 milestone-2).
- T1/T2 prior-only honest-framing disclosure surfaced in [reviewer.md M2 Executive Summary lines 456–464](sprint-02/reviewer.md): cycle-001 corpus events lack pre-cutoff time-series; `replay_T{1,2}_event` invokes `createX` once and never calls `processX`; `current_position_at_cutoff` equals runtime `base_rate`. T1/T2 cannot earn Rung 3 on the cycle-001 corpus shape.

---

## 3. Sprint 03 — Replay entrypoint design target

Source: [SPRINT-PLAN §4.1](CYCLE-002-SPRINT-PLAN.md). Operator ratification: Sprint 03 intentionally skips a separate `ENTRYPOINT-MANIFEST.md`. The existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts are the binding Sprint 03 implementation spec. `/implement sprint-03` routes through the cycle-002 ledger and proceeds directly against those documents. This SDD constrains the design surface, not the implementation.

### 3.1 Two separate entrypoints (binding architecture)

Sprint 03 introduces a NEW cycle-002 entrypoint at `scripts/corona-backtest-cycle-002.js`. The cycle-001 entrypoint at [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) stays **byte-frozen** — Sprint 03 does NOT edit it.

This is the design that resolves the I1 invariant (cycle-001 default-mode `script_hash = 17f6380b…1730f1` byte-identical) by construction: if the cycle-001 entrypoint file is never edited, its sha256 cannot change. Earlier proposals to add a replay-mode flag/env-var to `scripts/corona-backtest.js` are explicitly retired — they would require even one byte of change to the entrypoint file, which would invalidate I1.

| Lane | Invocation | Loader | Per-theatre scoring | Output dir | Provenance hash |
|---|---|---|---|---|---|
| **Cycle-001 reproducibility lane** | `node scripts/corona-backtest.js [args]` (unchanged surface) | `loadCorpus` (unchanged) | `scoreCorpusT{1..5}` legacy | `run-N/` (anywhere except cycle-001 frozen `run-{1,2,3-final}/`) | `script_hash = 17f6380b…1730f1` byte-identical to cycle-001 v0.2.0. |
| **Cycle-002 replay lane** (NEW) | `node scripts/corona-backtest-cycle-002.js [args]` (NEW Sprint 03 file) | `loadCorpusWithCutoff` (NEW additive export) | `scoreCorpusT4(events, { predictedDistribution: trajectory.current_position_at_cutoff })` for T4; `scoreCorpusT{1,2}Binary(events, trajectories)` for T1+T2; `scoreCorpusT{3,5}` unchanged | `cycle-002-run-N/` (NEW dir under calibration tree) | `replay_script_hash` (NEW field) anchored in cycle-002 manifest; covers replay-seam file set per [§6](#6-replay_script_hash--runtime_replay_hash-file-set-strategy). |

### 3.1a Responsibilities of the NEW cycle-002 entrypoint

`scripts/corona-backtest-cycle-002.js` owns (per operator amendment):

1. **Runtime replay dispatch** — invokes `replay_T1_event`, `replay_T2_event`, `replay_T4_event` from `scripts/corona-backtest/replay/`; passes trajectories to the appropriate scoring path; passes T3/T5 corpus-anchored / quality-of-behavior data to their unchanged scoring paths.
2. **Two-summary reporting** — produces both `runtime-uplift-summary.md` (T1+T2+T4 only) and `diagnostic-summary.md` (all 5, tagged `[diagnostic]`) per [§4](#4-two-summary-reporting-architecture).
3. **Cycle-002 output directory creation** — writes `cycle-002-run-N/` under the calibration tree (NEW dir; never `run-N/` which is the cycle-001 lane).
4. **Additive runtime replay manifest generation** — writes `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` per [§5](#5-additive-cycle-002-manifest-architecture).
5. **`replay_script_hash` / `runtime_replay_hash` provenance computation** — computes the hash over the file set declared in [§6.2](#62-file-set-binding) and writes it to the cycle-002-run-N/ provenance file and the cycle-002 manifest entries.

The cycle-002 entrypoint MAY share helpers with the cycle-001 entrypoint via existing modules under `scripts/corona-backtest/` (e.g., reuse [config.js](../../../../scripts/corona-backtest/config.js) for path resolution, [hash-utils.js](../../../../scripts/corona-backtest/reporting/hash-utils.js) for `computeCorpusHash`). It MAY also introduce new cycle-002-specific reporting/manifest helpers under `scripts/corona-backtest/` (e.g., `scripts/corona-backtest/reporting/runtime-uplift-summary.js`, `scripts/corona-backtest/reporting/diagnostic-summary.js`, `scripts/corona-backtest/manifest/runtime-replay-manifest.js`); any such new helper file is added to the `replay_script_hash` file set ([§6.2](#62-file-set-binding)).

### 3.1b What Sprint 03 MUST NOT do to the cycle-001 entrypoint

- MUST NOT edit [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) — not even whitespace. Any byte-level change invalidates `script_hash = 17f6380b…1730f1` and breaks I1.
- MUST NOT add a `--replay` flag, env-var dispatch, or any other mode selector to `scripts/corona-backtest.js`.
- MUST NOT rename `scripts/corona-backtest.js` or move it.

Editing `scripts/corona-backtest.js` is a HARD STOP unless explicitly authorized by the operator with binding revert protocol; see [§13 HS-22](#13-hard-stops-binding-cycle-wide).

### 3.2 Per-theatre dispatch in the cycle-002 entrypoint

Inside `scripts/corona-backtest-cycle-002.js` (the NEW Sprint 03 entrypoint), per-theatre dispatch follows [PRD §8 theatre posture](PRD.md):

- **T1**: `replay_T1_event(corpus_event, ctx)` → `binary_scalar` trajectory → `scoreCorpusT1Binary(events, trajectories)` → row tagged `[runtime-binary]`.
- **T2**: `replay_T2_event(corpus_event, ctx)` → `binary_scalar` trajectory (GFZ-preferred outcome) → `scoreCorpusT2Binary(events, trajectories)` → row tagged `[runtime-binary]`.
- **T3**: corpus-anchored. Trajectory recorded for shape uniformity (per [CONTRACT §5](sprint-01/CONTRACT.md)) but NOT consumed by scoring. `scoreCorpusT3` unchanged. Row tagged `[external-model]`.
- **T4**: `replay_T4_event(corpus_event, ctx)` → `bucket_array_5` trajectory → `scoreCorpusT4(events, { predictedDistribution })` → row tagged `[runtime-bucket]`.
- **T5**: trajectory emit DEFERRED by default (Sprint 04 Option A). `scoreCorpusT5` unchanged. Row tagged `[quality-of-behavior]`.

Posture tags appear verbatim in both summary reports per [§4 below](#4-two-summary-reporting-architecture).

The cycle-001 entrypoint (`scripts/corona-backtest.js`) does NOT participate in this dispatch — it remains the legacy 6-bucket / corpus-anchored scoring path only.

### 3.3 Loader-side cutoff split (`loadCorpusWithCutoff`)

NEW additive export per [CONTRACT §7.3](sprint-01/CONTRACT.md), [REPLAY-SEAM §6](sprint-02/REPLAY-SEAM.md):

```
loadCorpusWithCutoff(corpusDir, options) returns {
  events,                                      // unchanged from loadCorpus
  errors,                                      // unchanged + replay-clock-seed errors
  stats,                                       // unchanged + per-theatre cutoff_derived_count
  cutoffs: { [event_id]: { time_ms, rule } },
  evidence: {
    [event_id]: {
      pre_cutoff: [...],                       // bundles / observations strictly before cutoff
      settlement: {...},                       // outcome fields
    },
  },
}
```

Existing `loadCorpus` export is unchanged. Cycle-001 callers continue to use it. `loadCorpusWithCutoff` is the structural fix for evidence-leakage prevention ([§9 below](#9-evidence-leakage-prevention)).

### 3.4 What Sprint 03 does NOT redesign

- Runtime theatre signatures beyond the Sprint 02 default-preserving `{ now }` injection (already shipped).
- Legacy 6-bucket scorers (`scoring/t{1,2,4}-bucket-brier.js`) — frozen as corpus-baseline diagnostics per [CHARTER §9.3](sprint-00/CHARTER.md).
- T3 and T5 scoring paths.
- RLMF cert export pipeline ([src/index.js:235-251](../../../../src/index.js)).
- Cycle-001 entrypoint [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) — byte-frozen; ZERO byte-level edits in Sprint 03.
- Cycle-001 hash algorithm in [hash-utils.js](../../../../scripts/corona-backtest/reporting/hash-utils.js)'s `computeScriptHash` — continues to hash ONLY the cycle-001 entrypoint file (cycle-001 reproducibility lane requires this). `replay_script_hash` is a NEW separate computation that does NOT use `computeScriptHash` ([§6 below](#6-replay_script_hash--runtime_replay_hash-file-set-strategy)).

---

## 4. Two-summary reporting architecture

Source: [CHARTER §4.1](sprint-00/CHARTER.md) operator amendment 1, [PRD §10.4](PRD.md).

### 4.1 Two summaries, never blended

Every cycle-002 backtest run that uses replay mode MUST emit BOTH:

| Summary | Theatres included | Authority |
|---|---|---|
| `runtime-uplift-summary.md` | T1 `[runtime-binary]`, T2 `[runtime-binary]`, T4 `[runtime-bucket]` | The ONLY summary that may underwrite Rung 1+ closeout claims. |
| `diagnostic-summary.md` | All five: T1, T2, T3 `[external-model]`, T4, T5 `[quality-of-behavior]`. Every section title and table caption tagged `[diagnostic]`. | Transparency / full-system view. May NOT underwrite calibration-improved or runtime-uplift claims. |

The two summaries are separate files. Bare "composite verdict" is reserved for the runtime-uplift composite. The diagnostic summary uses `[diagnostic] composite verdict` if a verdict-style line is needed; never bare.

### 4.2 Per-theatre rows in both summaries

Both summaries list rows in the same theatre order (T1, T2, T3, T4, T5) with binding posture tags (T1 `[runtime-binary]`, T2 `[runtime-binary]`, T3 `[external-model]`, T4 `[runtime-bucket]`, T5 `[quality-of-behavior]`). The runtime-uplift composite simply omits T3 and T5 rows; their posture tags do NOT appear there.

### 4.3 Per-theatre report files

Per-theatre reports at `cycle-002-run-N/T<N>-report.md` mirror the cycle-001 layout with the cycle-002 posture tag added in the header. Report bodies state which scoring path was used (e.g., "T1 binary Brier via scoreCorpusT1Binary on runtime trajectory") so the reader can audit.

### 4.4 Cross-regime presentation (when cycle-001 and cycle-002 numerics share a report)

Per [CHARTER §8.2](sprint-00/CHARTER.md): if a single table shows both Baseline A (cycle-001 uniform-prior 6-bucket) and Baseline B (cycle-002 runtime-replay binary or bucket) numerics, columns are explicitly labeled `[corpus-uniform-prior cycle-001]` and `[runtime-replay cycle-002]`. The two are NEVER blended into a single column.

---

## 5. Additive cycle-002 manifest architecture

Source: [CHARTER §6](sprint-00/CHARTER.md), [sprint-02/reviewer.md "Provenance Note for Sprint 3"](sprint-02/reviewer.md).

### 5.1 Path

`grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`. NEW file. First write is a Sprint 03 deliverable.

### 5.2 Cycle-001 manifest is immutable

[grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) (693 lines, 30 entries) is FROZEN historical evidence. Its `corpus_hash` and `script_hash` per-entry fields stay as cycle-001 anchored. The `manifest_regression_test.js` and `manifest_structural_test.js` continue to validate cycle-001 entries against cycle-001 hashes; any drift is a HARD FAIL.

### 5.3 Cycle-002 manifest is additive (not a replacement)

Cycle-002 manifest schema declares additivity explicitly (a top-level `cycle: "cycle-002"` field or equivalent), points back to the cycle-001 manifest as its predecessor, and carries:

- `corpus_hash` — expected `b1caef3f…11bb1` (corpus frozen).
- `replay_script_hash` (NEW field) — see [§6](#6-replay_script_hash--runtime_replay_hash-file-set-strategy).
- Per-theatre runtime-replay anchor entries for T1, T2, T4 with their pinned cycle-002 thresholds ([CONTRACT §12](sprint-01/CONTRACT.md)): T1 `{threshold_class: "M1.0", window_hours: 24}`; T2 `{kp_threshold: 5, window_hours: 72}`; T4 `{s_scale_threshold: "S1", window_hours: 72}`.
- A doc-string field or accompanying note explaining why cycle-001 `script_hash` (= sha256 of `scripts/corona-backtest.js` only) is INSUFFICIENT for cycle-002 provenance — it does not cover the replay seam dependencies that drive cycle-002 trajectory output.

### 5.4 Manifest regression-test extension

[tests/manifest_regression_test.js](../../../../tests/manifest_regression_test.js) is EXTENDED, not rewritten:

- Continues to validate cycle-001 entries against cycle-001 hashes (hard-fail on drift).
- Adds validation of cycle-002 entries against cycle-002 hashes once Sprint 03 anchors `cycle-002-run-1/`.
- Cycle-001 entries' hashes are NEVER mutated.

In-place mutation of cycle-001 manifest entries is forbidden at every sprint. There is no escape hatch in cycle-002.

### 5.5 Manifest growth model across cycle-002

| Sprint | Manifest growth |
|---|---|
| Sprint 03 close | Cycle-002 manifest first write: anchor for `cycle-002-run-1/` (Baseline B). |
| Sprint 04 (Option A default) | No manifest write. |
| Sprint 04 (Option B, only if ratified) | Optional T5-trajectory-related entries; no scoring-numerics drift. |
| Sprint 05 | Additive entries for `cycle-002-run-2/` (Direction A perturbation) and `cycle-002-run-3/` (Direction B revert). Two-direction provenance chain. |
| Sprint 06 | No manifest write unless Rung 4 + tag triggers a final anchor. |

---

## 6. `replay_script_hash` / `runtime_replay_hash` file-set strategy

Source: [sprint-02/reviewer.md "Provenance Note for Sprint 3"](sprint-02/reviewer.md), [SPRINT-PLAN §4.1.2](CYCLE-002-SPRINT-PLAN.md).

### 6.1 Why a new hash field

Cycle-001's `script_hash` is `sha256(scripts/corona-backtest.js)` — entrypoint only. That definition is correct for cycle-001's reproducibility lane and MUST stay byte-stable to preserve I1 (default-mode `script_hash = 17f6380b…1730f1`). However, it does NOT cover the replay seam dependencies that drive cycle-002's trajectory output. Cycle-002 introduces a separate, parallel hash field — proposed name `replay_script_hash` (alias `runtime_replay_hash` is acceptable; Sprint 03 spec pins the exact name) — that hashes the file set that ACTUALLY determines cycle-002 trajectory bytes.

### 6.2 File set (binding)

The `replay_script_hash` is computed over the canonical concatenation of the following files (path-sorted):

```
scripts/corona-backtest-cycle-002.js                 ← NEW Sprint 03 entrypoint
scripts/corona-backtest/replay/canonical-json.js
scripts/corona-backtest/replay/hashes.js
scripts/corona-backtest/replay/context.js
scripts/corona-backtest/replay/t1-replay.js
scripts/corona-backtest/replay/t2-replay.js
scripts/corona-backtest/replay/t4-replay.js
scripts/corona-backtest/scoring/t1-binary-brier.js
scripts/corona-backtest/scoring/t2-binary-brier.js
```

Plus, additively, **any new cycle-002-specific reporting / manifest helper files added in Sprint 03** under `scripts/corona-backtest/` — for example (Sprint 03 spec ratifies the exact file names):

```
scripts/corona-backtest/reporting/runtime-uplift-summary.js   (if added)
scripts/corona-backtest/reporting/diagnostic-summary.js       (if added)
scripts/corona-backtest/manifest/runtime-replay-manifest.js   (if added)
```

The file set is canonical and binding once Sprint 03 anchors `cycle-002-run-1/`. Adding a file to the cycle-002 entrypoint's import graph WITHOUT adding it to the `replay_script_hash` file set is a process violation — it would mean trajectory bytes can change without provenance detection.

The cycle-001 entrypoint [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) is **explicitly NOT in the `replay_script_hash` file set**. It remains covered by cycle-001 `script_hash` only.

### 6.3 Coexistence with cycle-001 `script_hash`

Two hashes coexist, each owned by exactly one entrypoint:

| Hash | File set | Owning entrypoint | Purpose |
|---|---|---|---|
| `script_hash` (cycle-001 definition) | `scripts/corona-backtest.js` only | [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js) (frozen) | Cycle-001 reproducibility invariant (I1). MUST stay `17f6380b…1730f1` in default mode. |
| `replay_script_hash` (cycle-002 definition) | The file set in [§6.2](#62-file-set-binding) | `scripts/corona-backtest-cycle-002.js` (NEW Sprint 03) | Cycle-002 trajectory provenance. Anchored in `cycle-002-run-1/` and the cycle-002 manifest. Will change whenever any file in the set changes. |

**Sprint 03 design (binding)**: a NEW separate cycle-002 entrypoint file at `scripts/corona-backtest-cycle-002.js`. The cycle-001 entrypoint at `scripts/corona-backtest.js` is **byte-frozen** — Sprint 03 produces zero byte-level edits to it. The cycle-001 `script_hash` is preserved by construction, not by hoping a careful in-place edit happens to leave the sha256 unchanged.

Earlier proposals to add a replay-mode flag/env-var to `scripts/corona-backtest.js` are **explicitly retired**. Even a single byte of change to the cycle-001 entrypoint invalidates I1; in practice any meaningful code addition guarantees a sha256 change. The two-entrypoint design eliminates the entire failure mode.

**If Sprint 03 cannot land the design without editing `scripts/corona-backtest.js`** — for example, if some unforeseen integration with the existing entrypoint is required — Sprint 03 HALTS and asks the operator before any byte-level edit to the cycle-001 entrypoint ([§13 HS-22](#13-hard-stops-binding-cycle-wide)). The operator decides whether to (a) authorize a temporary surgical edit with binding revert protocol verified against `17f6380b…1730f1`, or (b) defer Sprint 03 until a clean two-entrypoint factoring is engineered. Option (b) is strongly preferred.

### 6.4 Hash recomputation

`replay_script_hash` is recomputed at every cycle-002 run that touches the replay seam. The cycle-002 manifest's `replay_script_hash` matches the recomputed hash over the declared file set; otherwise the manifest_regression_test extension (cycle-002 portion) hard-fails.

---

## 7. Default cycle-001 reproducibility lane

Source: [I1](#13-architectural-invariants-binding-cycle-wide), [SPRINT-PLAN §4.1.2](CYCLE-002-SPRINT-PLAN.md).

### 7.1 Mechanism

The cycle-001 reproducibility lane lives entirely in the FROZEN entrypoint [scripts/corona-backtest.js](../../../../scripts/corona-backtest.js). Sprint 03 does NOT edit this file. Default-mode invocation follows the cycle-001 path verbatim:

- Loads via `loadCorpus` (unchanged export).
- Dispatches per theatre via `scoreCorpusT1`, `scoreCorpusT2`, `scoreCorpusT3`, `scoreCorpusT4`, `scoreCorpusT5` (all from existing legacy modules; unchanged).
- Writes `run-N/` outputs (NOT `cycle-002-run-N/`).
- Computes `corpus_hash` via `computeCorpusHash` ([hash-utils.js:69-80](../../../../scripts/corona-backtest/reporting/hash-utils.js)) — byte-identical to cycle-001.
- Computes `script_hash` via `computeScriptHash()` ([hash-utils.js:86-88](../../../../scripts/corona-backtest/reporting/hash-utils.js)) — byte-identical to `17f6380b…1730f1` because `scripts/corona-backtest.js` is byte-frozen.

The cycle-002 replay lane is invoked via the SEPARATE NEW entrypoint `scripts/corona-backtest-cycle-002.js` (per [§3.1](#31-two-separate-entrypoints-binding-architecture)). The two entrypoints share helpers under `scripts/corona-backtest/` but are independent invocation surfaces — `node scripts/corona-backtest.js` is always the cycle-001 lane; `node scripts/corona-backtest-cycle-002.js` is always the cycle-002 lane.

### 7.2 Test coverage

A Sprint 03 test asserts:

- `node scripts/corona-backtest.js` against the frozen corpus produces output where `corpus_hash.txt` matches `b1caef3f…11bb1` and `script_hash.txt` matches `17f6380b…1730f1` byte-identically.
- `sha256(scripts/corona-backtest.js)` equals `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` exactly (a direct file-hash assertion that catches even whitespace drift).

These tests are the binding gates for I1.

### 7.3 Live runtime path is also default-preserved

Per [CHARTER §7](sprint-00/CHARTER.md), [REPLAY-SEAM §4.1](sprint-02/REPLAY-SEAM.md): theatre signatures gained an OPTIONAL last-arg `{ now: nowFn = () => Date.now() } = {}`. Live callers in [src/index.js](../../../../src/index.js) pass nothing. Behavior bit-stable. Verified by [tests/replay-clock-injection-default-test.js](../../../../tests/replay-clock-injection-default-test.js) and [tests/replay-clock-injection-default-T1T2-test.js](../../../../tests/replay-clock-injection-default-T1T2-test.js) at Sprint 02 close.

---

## 8. Deterministic replay / clock rules

Source: [CONTRACT §9, §10](sprint-01/CONTRACT.md), [REPLAY-SEAM §9](sprint-02/REPLAY-SEAM.md).

### 8.1 Replay-twice byte-identical (Rung 1 binding gate)

For any (corpus_event, runtime_revision, contract_version) triple, two invocations of any `replay_T*_event` produce byte-identical canonical JSON. Verified at Sprint 02 close on all 5 T4, all 5 T1, all 5 T2 cycle-001 corpus events.

### 8.2 Canonical JSON

[scripts/corona-backtest/replay/canonical-json.js](../../../../scripts/corona-backtest/replay/canonical-json.js) implements RFC-8785-spirit canonicalization without taking RFC 8785 as a runtime dependency. Rules:

- Object keys sorted lexicographically (UTF-16 code-unit order) at every nesting level.
- No whitespace between tokens.
- Numbers via `Number.prototype.toString()`; floats per JSON-spec shortest round-trip.
- Strings via standard JSON escaping; no NFC normalization.
- Arrays preserve order.
- Rejects `NaN`, `Infinity`, `-Infinity`, `undefined`, `BigInt`, `Function`, `Symbol`.

Stable hex sha256 output for fixed golden inputs is anchored by [tests/canonical-json-test.js](../../../../tests/canonical-json-test.js) (17 tests).

### 8.3 Clock injection pattern (default-preserving)

```
// Pattern applied per Sprint 02 to flare-gate.js, geomag-gate.js, proton-cascade.js
export function processX(theatre, bundle, { now: nowFn = () => Date.now() } = {}) { ... }
```

| Caller passes | Effect |
|---|---|
| Nothing | `nowFn` defaults to `() => Date.now()` (cycle-001 behavior). |
| `{}` | Same as nothing. |
| `{ now: undefined }` | Same as nothing. |
| `{ now: () => 1234 }` | `nowFn` is the injected function (replay path). |

### 8.4 Replay-mode fail-closed rule

Per [CONTRACT §10.1.1](sprint-01/CONTRACT.md), [REPLAY-SEAM §9.3](sprint-02/REPLAY-SEAM.md):

```
// scripts/corona-backtest/replay/context.js
deriveReplayClockSeed({ corpus_event, theatre_id })
   → throws "no Date.now() fallback" error on missing seed
```

The replay seam catches this error at the trajectory-emission boundary and emits a `corpus_load_errors` entry. The trajectory is NOT produced for that event. Live runtime path is unaffected (it never reaches `deriveReplayClockSeed`).

### 8.5 Replay clock seed derivation per theatre

Per [CONTRACT §10.1](sprint-01/CONTRACT.md):

| Theatre | Seed source field(s) |
|---|---|
| T1 | `gate_open_time` ?? (`flare_peak_time` − `window_hours` × 3,600,000 ms) |
| T2 | `gate_open_time` ?? `kp_window_start` ?? `window_start` |
| T3 | `cme_observed_time` ?? `cme.start_time` |
| T4 | `trigger_time` (via `trigger_flare_peak_time`) |
| T5 | `detection_window_start` |

If a corpus event lacks the canonical seed field, the replay path fails closed (no `Date.now()` fallback).

### 8.6 Provenance hashing (4 hashes)

Per [CONTRACT §10](sprint-01/CONTRACT.md):

| Hash | Computed from |
|---|---|
| `corpus_event_hash` | Canonical JSON of source corpus event (loader strips `_derived` and `_file` before hashing) |
| `cutoff_hash` | Canonical JSON of `trajectory.cutoff` |
| `gate_params_hash` | Canonical JSON of `trajectory.gate_params` |
| `trajectory_hash` | Canonical JSON of full trajectory with `meta.trajectory_hash = ''` sentinel; computed last and embedded |

Verifier ([hashes.js verifyTrajectoryHash](../../../../scripts/corona-backtest/replay/hashes.js)): clone, sentinel out, recompute, compare embedded.

---

## 9. Evidence leakage prevention

Source: [CONTRACT §7](sprint-01/CONTRACT.md), Sprint 02 audit finding [§A1](sprint-02/auditor-sprint-feedback.md).

### 9.1 The hazard

Corpus events carry both pre-cutoff observations (allowed evidence) and settlement fields (forbidden post-cutoff). A misuse — e.g., reading `_derived.qualifying_event_count_observed_derived` (T4 settlement) and feeding it into a pre-cutoff bundle — would silently launder settlement into prediction.

Sprint 02 mitigates by author convention: `t4-replay.js` reads settlement only for outcome derivation ([line 154](../../../../scripts/corona-backtest/replay/t4-replay.js)) and pre-cutoff observations only for bundle materialization ([line 110](../../../../scripts/corona-backtest/replay/t4-replay.js)). This is correct in the committed code but is a future-proofing concern — a careless future contributor could leak. Audit finding §A1 surfaces this.

### 9.2 Sprint 03 structural fix

`loadCorpusWithCutoff` ([§3.3 above](#33-loader-side-cutoff-split-loadcorpuswithcutoff)) returns `evidence: { [event_id]: { pre_cutoff: [...], settlement: {...} } }` with the split done at the loader boundary. Replay modules consume only `evidence.pre_cutoff`; outcome derivation reads only `evidence.settlement`. The split is structural — a misuse becomes a type-shape bug in code review rather than a silent data-flow bug in production.

### 9.3 Allowed pre-cutoff evidence

Per [CONTRACT §7.1](sprint-01/CONTRACT.md):

- Any corpus observation with `event_time_ms < cutoff.time_ms`.
- Any oracle data with `event_time_ms < cutoff.time_ms`.
- Loader-derived structural metadata that is NOT settlement: `_derived.regression_tier_eligible`, `_derived.glancing_blow_flag` (T3), `_derived.sigma_hours_effective` (T3), `_derived.sigma_source` (T3).
- `gate_params` per [CONTRACT §12](sprint-01/CONTRACT.md).

### 9.4 Forbidden post-cutoff evidence

Per [CONTRACT §7.2](sprint-01/CONTRACT.md):

- `_derived.bucket_observed`, `_derived.qualifying_event_count_observed_derived` (T4 settlement), `_derived.anomaly_bulletin_refs` (T5 settlement).
- `flare_class_observed` (T1 outcome), `kp_swpc_observed` / `kp_gfz_observed` (T2 outcome interpretation), `observed_l1_shock_time` (T3), `divergence_signals[*].false_positive_label` (T5).
- The qualifying flare event itself once at-or-after peak time (T1).
- The kp observation that crossed and any thereafter (T2).
- Any proton-flux observation at-or-after cutoff (T4).

### 9.5 Scorer-side assertion

Per [CONTRACT §11.2](sprint-01/CONTRACT.md), [REPLAY-SEAM §11.2](sprint-02/REPLAY-SEAM.md): the consumer asserts `every(trajectory.position_history_at_cutoff, h => h.t_ms <= trajectory.cutoff.time_ms)` before scoring. A violation is a HARD scoring failure with exit code 3 (matching existing convention at [corona-backtest.js:151-152](../../../../scripts/corona-backtest.js)).

---

## 10. RLMF certificate freeze boundary

Source: [CHARTER §1 Q1, §5](sprint-00/CHARTER.md).

### 10.1 Frozen surface

| Field | Value | Frozen status |
|---|---|---|
| Cert `version` | `'0.1.0'` | Pinned through Sprint 06. |
| Cert schema (top-level keys) | `certificate_id`, `construct`, `version`, `exported_at`, `theatre`, `performance`, `temporal`, `on_chain` | Unchanged. |
| `performance.brier_score` formula | `brierScoreBinary(closing_position, outcome)` for scalars; `brierScoreMultiClass(closing_position, outcomeIndex)` for arrays | Unchanged. |
| `performance.position_history` shape | `{t, p, evidence}` (runtime field names, NOT the cycle-002 `t_ms` / `evidence_id` rename) | Unchanged. |
| `performance.calibration_bucket` logic | `Math.max(...closing_position)` for arrays | Unchanged. |
| `temporal.time_weighted_brier` semantics | Unchanged | Pinned. |
| Runtime cert export pipeline | [src/index.js:235-251](../../../../src/index.js) | Unchanged. |
| `theatre.current_position` shape per theatre | T1/T2/T3/T5 scalar; T4 array of 5 | Unchanged (cert reads this verbatim; a widening would break downstream). |

### 10.2 Why this boundary exists

The cert is the boundary to the downstream Echelon RLMF training-data pipeline. Any silent widening of T1/T2 runtime `current_position` from scalar to array would mutate every downstream RLMF cert field and contaminate training data. The cycle-002 architecture confines all bucket-shape adaptation to the **backtest seam** (`scripts/corona-backtest/replay/`, `scripts/corona-backtest/scoring/`); the runtime path stays scalar-emitting; the cert reads scalars; the cert format is bit-stable.

### 10.3 Field-rename localization

[CONTRACT §3.1](sprint-01/CONTRACT.md) renames `t → t_ms` and `evidence → evidence_id` only AT the trajectory-emission boundary inside `replay/*.js`. Runtime state is NOT mutated; `theatre.position_history` continues to carry the original `{t, p, evidence}` field names; the cert continues to read those names. The rename is a backtest-side cosmetic, never a runtime-side change.

### 10.4 Cert non-mutation test

[tests/replay-rlmf-cert-non-mutation-test.js](../../../../tests/replay-rlmf-cert-non-mutation-test.js) (Sprint 02; T4 path) covers the binding case. T1 cert path is covered by cycle-001 baseline ([tests/corona_test.js:784-820](../../../../tests/corona_test.js)). T2/T3/T5 cert paths are covered structurally (cert.js zero-diff + theatre.current_position shapes unchanged + brierScoreBinary unchanged). Sprint 03 hardening MAY extend explicit T1/T2 cert non-mutation coverage (audit finding S2-C3).

---

## 11. Test architecture

Source: [CONTRACT §15](sprint-01/CONTRACT.md), [REPLAY-SEAM §10](sprint-02/REPLAY-SEAM.md), [SPRINT-PLAN §4.1.6](CYCLE-002-SPRINT-PLAN.md).

### 11.1 Existing test suite (post-Sprint-02 baseline)

`npm test` reports 261/261 pass at Sprint 02 commit `c9535386`:

- 160 cycle-001 baseline tests (frozen).
- 54 milestone-1 tests (T4 replay seam: canonical-json, hashes, context, t4-replay, T4 trajectory shape, determinism, scored-through-runtime-bucket, RLMF cert non-mutation, clock-injection-default).
- 47 milestone-2 tests (T1/T2 binary scoring, T1/T2 trajectory shape, T1/T2 determinism, T1/T2 scored-through-binary-Brier, T1/T2 clock-injection-default).

Test framework: `node --test`. Zero new dependencies. `package.json` `scripts.test` is extended additively per sprint.

### 11.2 Test-class taxonomy

| Class | What it asserts | Examples |
|---|---|---|
| **Determinism** | Replay-twice byte-identical canonical JSON for a fixed (event, revision, contract_version). | `replay-determinism-T4-test.js`, `replay-determinism-T1T2-test.js` |
| **Trajectory shape** | All 17 [CONTRACT §11.1](sprint-01/CONTRACT.md) producer rules pass. | `replay-trajectory-shape-T{1,2,4}-test.js` |
| **Scoring proof** | Trajectory's `current_position_at_cutoff` consumed verbatim by the scoring API; brier finite; differs from no-information baseline. | `replay-T4-scored-through-runtime-bucket-test.js`, `replay-T1T2-binary-brier-scoring-test.js` |
| **Clock-injection default-preserving** | Theatre functions called WITHOUT a `now` arg behave bit-for-bit like cycle-001. | `replay-clock-injection-default-test.js`, `replay-clock-injection-default-T1T2-test.js` |
| **RLMF cert non-mutation** | Cert format byte-stable under fixed clock injection (Q1 binding gate). | `replay-rlmf-cert-non-mutation-test.js` |
| **Canonical JSON helper** | RFC-8785-spirit invariants; rejection set; sha256 golden anchor. | `canonical-json-test.js` |
| **Manifest regression** | Cycle-001 entries' hashes immutable (hard-fail on drift); cycle-002 entries match recomputed hashes. | `manifest_regression_test.js` (extension lands Sprint 03) |
| **Manifest structural** | Cycle-001 + cycle-002 manifest schema invariants. | `manifest_structural_test.js` |
| **Cycle-001 reproducibility lane** (Sprint 03) | Default-mode entrypoint produces `script_hash = 17f6380b…1730f1` byte-identically. | New Sprint 03 test, name TBD. |
| **Two-summary tagging** (Sprint 03) | Reports tag rows with binding posture tags; `[diagnostic]` prefix on diagnostic-summary section titles. | New Sprint 03 test, name TBD. |
| **Sensitivity proof** (Sprint 05) | T4 Brier moves under perturbation; reverts byte-identically; corpus_hash stable across both directions. | New Sprint 05 test, name TBD. |

### 11.3 Test invariants (binding cycle-wide)

- Every existing test passes at every sprint commit.
- New tests are additive; no test renaming, no test deletion (other than tests deliberately retired with explicit operator authorization, which has not happened in cycle-002).
- Cycle-001 manifest_regression hard-fails on any cycle-001 entry hash drift.

### 11.4 Test growth model across cycle-002

| Sprint | Net test delta |
|---|---|
| Sprint 02 close (committed) | +101 (160 → 261). |
| Sprint 03 | + entrypoint replay-mode tests, two-summary tagging tests, cycle-002 manifest regression, optional hardening (S2-C3 cert coverage extension; §A3 base_rate guard). |
| Sprint 04 (Option A default) | 0 new. |
| Sprint 04 (Option B if ratified) | + T5 trajectory shape, T5 no-scoring-impact, T5 clock-injection-default. |
| Sprint 05 | + sensitivity-proof-T4 (two-direction). |
| Sprint 06 | 0 new (closeout / docs). |

---

## 12. Review / audit / commit discipline

Source: [SPRINT-PLAN §6](CYCLE-002-SPRINT-PLAN.md), [SPRINT-LEDGER.md](SPRINT-LEDGER.md).

### 12.1 Per-sprint command sequence

For Sprints 03, 04, 05, 06, in order, in a working tree dedicated to that sprint:

1. **Spec ratification (operator gate)**: operator drafts and ratifies `grimoires/loa/a2a/cycle-002/sprint-NN/<SPEC>.md`. No implementation begins until ratified.
2. **`/implement sprint-NN`**: implementation against the ratified spec. Routing source: [SPRINT-LEDGER.md](SPRINT-LEDGER.md). The Loa Sprint Ledger does NOT contain cycle-002 entries; the cycle-002 ledger is binding. Cycle-001 `grimoires/loa/sprint.md` is NOT a target.
3. **`/review-sprint sprint-NN`**: produces `engineer-feedback.md`. Verdict must be APPROVED before audit.
4. **`/audit-sprint sprint-NN`**: produces `auditor-sprint-feedback.md`. Verdict must be APPROVED.
5. **Tests green**: `npm test` reports zero failures.
6. **Operator commit gate (HITL)**: single commit per sprint. Conventional-commit format with cycle-002 prefix.
7. **Operator stop**: sprint exits; await "Sprint NN ratified, draft Sprint NN+1" signal.

### 12.2 Inviolable commit rule

No commit before review + audit + tests green:

- Commit landing without both `engineer-feedback.md` AND `auditor-sprint-feedback.md` at APPROVED is a process violation.
- Commit landing with any test failure is a process violation.
- Tag-readiness check (Sprint 06) is a separate command from tag creation; the operator inspects readiness before authorizing the tag.

### 12.3 Working-tree discipline

Sprints 03, 04, 05, 06 do not share a working tree. Each sprint is its own implement → review → audit → commit cycle in its own working tree (or its own series of cleanly separated commits). No batched commits; no mixed diffs; no drive-by changes.

### 12.4 Honest-framing memory binding

Every closeout-relevant artifact (Sprint 06's `CLOSEOUT.md`, conditional README/BFZ additive sections, commit message at closeout, tag message if v0.3.0 lands) is subject to the honest-framing grep gate ([PRD §10.1](PRD.md)). Cycle-001 memory binding governs cycle-002 closeout.

---

## 13. Hard stops (binding cycle-wide)

Aggregated from per-sprint hard-stop sections in [SPRINT-PLAN §4.1.9, §4.2.9, §4.3.9, §4.4.9](CYCLE-002-SPRINT-PLAN.md):

| # | Hard stop | Trigger sprint(s) |
|---|---|---|
| HS-1 | Cycle-001 calibration manifest mutation appears necessary. | All. |
| HS-2 | RLMF certificate format change appears necessary (Q1 violation). | All. |
| HS-3 | Bucket-projection for T1/T2 appears necessary (Q7 / CHARTER §9.4 violation). | Sprint 03 onward. |
| HS-4 | T3 CORONA-prediction emission appears necessary (Q2 violation). | Sprint 03, 04. |
| HS-5 | T5 probabilistic-Brier conversion appears necessary (Q3 violation). | Sprint 03, 04. |
| HS-6 | Runtime parameter change appears necessary (CHARTER §8.3 no-refit covenant violation). | Sprint 03 onward. |
| HS-7 | Cycle-001 `script_hash = 17f6380b…1730f1` cannot be reproduced in default mode. | Sprint 03. |
| HS-22 | Editing `scripts/corona-backtest.js` (the cycle-001 reproducibility entrypoint) — even whitespace — without explicit operator authorization. The default Sprint 03 design uses a NEW separate entrypoint at `scripts/corona-backtest-cycle-002.js`; touching the cycle-001 entrypoint is forbidden by default. If implementation determines it is necessary, HALT and ask the operator. | Sprint 03 onward. |
| HS-8 | New runtime dependency required (`dependencies: {}` invariant violation). | All. |
| HS-9 | Replay-twice byte-identical determinism breaks for any T1/T2/T4 trajectory. | Sprint 03 onward. |
| HS-10 | Sprint 04 Option B work begun without explicit operator ratification. | Sprint 04. |
| HS-11 | Sprint 05: Direction B does NOT restore byte-identical T4 Brier (replay nondeterminism). | Sprint 05. |
| HS-12 | Sprint 05: perturbation does NOT change T4 Brier in Direction A (harness not exercising runtime). | Sprint 05. |
| HS-13 | Sprint 05: net `src/` diff non-empty at sprint close. | Sprint 05. |
| HS-14 | Sprint 05: engineer determines no fixture/injection path exists and source mutation appears necessary — HALT and ask operator before any `src/` edit. | Sprint 05. |
| HS-15 | Sprint 05: any permanent runtime parameter change attempted. | Sprint 05. |
| HS-16 | Sprint 05: sensitivity proof attempted on T1/T2/T3/T5. | Sprint 05. |
| HS-17 | Sprint 06: honest-framing grep gate flags a positive match in non-claim prose. | Sprint 06. |
| HS-18 | Sprint 06: closeout artifact attempts cross-regime baseline comparison (Baseline A vs Baseline B) as "uplift". | Sprint 06. |
| HS-19 | Sprint 06: closeout extends "calibration-improved" to T1/T2 absent corpus-shape prerequisite, or to T3/T5 (Q2/Q3 forbid). | Sprint 06. |
| HS-20 | Sprint 06: cycle-001 README/BFZ/manifest/closeout text mutated. | Sprint 06. |
| HS-21 | Sprint 06: tag attempted at v0.3.0 without Rung 4 evidence + operator authorization. | Sprint 06. |

When any hard stop triggers, the implementing skill HALTS, surfaces the situation in writing, and awaits operator instruction. Hard stops are not advisory.

---

## 14. Cross-references

### 14.1 Canonical cycle-002 sources (authoritative if this SDD disagrees)

- [SPRINT-LEDGER.md](SPRINT-LEDGER.md), [PLANNING-FRAME.md](PLANNING-FRAME.md), [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md), [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md).
- [sprint-00/CHARTER.md](sprint-00/CHARTER.md), [sprint-01/CONTRACT.md](sprint-01/CONTRACT.md), [sprint-02/REPLAY-SEAM.md](sprint-02/REPLAY-SEAM.md), [sprint-02/reviewer.md](sprint-02/reviewer.md), [sprint-02/engineer-feedback.md](sprint-02/engineer-feedback.md), [sprint-02/auditor-sprint-feedback.md](sprint-02/auditor-sprint-feedback.md).

### 14.2 Cycle-001 frozen references (consult, never edit)

- [grimoires/loa/prd.md](../../prd.md), [sdd.md](../../sdd.md), [sprint.md](../../sprint.md).
- [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) (frozen, 30 entries).
- [grimoires/loa/calibration/corona/run-3-final/](../../calibration/corona/run-3-final/) and predecessors.
- [BUTTERFREEZONE.md](../../../../BUTTERFREEZONE.md), [README.md](../../../../README.md).

### 14.3 Companion synthesis doc

- [PRD.md](PRD.md) — cycle-level PRD synthesis (problem, mission, stakeholders, in/out scope, success criteria, claim ladder, theatre posture, non-goals, honest-framing rules).

---

## 15. Document scope guarantees

This SDD ships:

- `grimoires/loa/a2a/cycle-002/SDD.md` (the only SDD file written by this synthesis task).

This SDD does NOT:

- Invent new design beyond what the canonical cycle-002 sources already ratify.
- Rename sprints or change the sprint sequence in [CYCLE-002-SPRINT-PLAN.md](CYCLE-002-SPRINT-PLAN.md).
- Override any canonical source. Where this SDD and a canonical source disagree, the canonical source binds.
- Replace the cycle-001 SDD at [grimoires/loa/sdd.md](../../sdd.md). The cycle-001 SDD remains FROZEN historical.
- Modify any source, test, script, manifest, or runtime file.
- Bind any commit, tag, or version change.
- Constitute a Sprint 03 spec. Operator ratification: Sprint 03 intentionally skips a separate `ENTRYPOINT-MANIFEST.md`. The existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts are the binding Sprint 03 implementation spec. `/implement sprint-03` routes through the cycle-002 ledger and proceeds directly against those documents.

---

*Cycle-002 synthesis SDD authored 2026-05-01. Post-Sprint-02 commit `c9535386`; post-sprint-plan commit `da53606`. corpus_hash invariant `b1caef3f…11bb1` (cycle-001 anchor; preserved). RLMF cert format unchanged at version `0.1.0`. Cycle-001 honest-framing memory binding governs. Operator ratification gate pending.*
