# CORONA Cycle-004 — Sprint Plan

> **Status:** DRAFT — awaiting operator review. Sprint planning only.
> **Branch:** `cycle-004` (from `main` @ `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6`)
> **Date:** 2026-06-02 · **Phase:** `/sprint-plan` output. Next after operator approval: `/run sprint-plan` (or per-sprint `/implement` → `/review-sprint` → `/audit-sprint`).
> **Binding spec set:** [PRD.md](PRD.md) · [SDD.md](SDD.md) · [PLAN-AND-ANALYZE-REPORT.md](PLAN-AND-ANALYZE-REPORT.md)
> **This document creates no code, no commit, no tag, no release. It mutates no source/test/runtime/loader/replay file, no prior-cycle artifact, no README, no BUTTERFREEZONE, no `package.json`.**

---

## 1. Executive Summary

Cycle-004 is a **deterministic T2 evidence-consumption wiring cycle**. It is theatre-qualified:

- **T2 is the primary implementation target.** Wire Layer-B (`deriveEvidenceT2`) + Layer-A (`replay_T2_event`) so the runtime deterministically consumes cycle-003's pre-cutoff `kp_observations[]` **through the existing, byte-frozen `processGeomagneticStormGate`**.
- **T1 is honestly BLOCKED** and retained as a **negative control** (raw `xray_flux_observations[]` flux samples cannot map to the `solar_flare`-event gate contract without inventing semantics or editing the gate — both forbidden). T1 source is left exactly as cycle-003 shipped it.
- **T4 remains deferred** to a separate operator-gated cycle.

The wiring is **additive, field-presence-gated, and opt-in (default-off)** via a `wireEvidence` options-bag flag mirroring the existing T4 `lambdaScalar` precedent — so the cycle-002 frozen-corpus replay is byte-identical **by construction**.

### 1.1 Claim ceiling (load-bearing, preserved)

Allowed posture (verbatim — carried into every implement/review/audit/closeout report, SDD §15):

> "Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."

**Cycle-004 MAY prove only:** T2 wiring implemented; T2 pre-cutoff `kp_observations[]` consumed through `processGeomagneticStormGate`; wired ≠ ablated (deterministic); ablated == pre-cycle-004 baseline fixture; replay-twice byte-identical; frozen cycle-002 corpus replay byte-identical; T1 remains blocked / negative-control only.

**Cycle-004 does NOT prove (forbidden as positive claims — PRD §4.3, SDD §15):** calibration improvement; forecasting accuracy; empirical performance improvement; predictive uplift; verifiable track record; L2 readiness; T1 runtime sensitivity; T2 runtime sensitivity **as a banked rung**; T1/T2 calibration improvement; Baseline A vs Baseline B uplift; new-corpus baseline uplift; any new rung; release readiness.

**Historical claim ceiling stands unweakened: "CORONA demonstrated T4 runtime sensitivity only." No new rung is banked in cycle-004.**

### 1.2 Operator decisions already resolved (binding inputs to this plan)

| OD | Decision | Encoding in this plan |
|----|----------|------------------------|
| **OD-1** | `quality.composite = 1.0`, phrased as **"a uniform neutral/default runtime quality weight required by the existing T2 gate contract."** NOT source-derived, NOT in the corpus, NOT fitted/tuned/optimized/quality-measured, NOT a parameter-refit. | Sprint 02, T2.4. |
| **OD-2** | **Do NOT edit `package.json`** — no `scripts.test` change, no version change, no dependency change. New tests run via explicit `node --test …` commands, documented in sprint/proof reports. | All sprints. The existing `scripts.test` line stays byte-identical; §6 lists the explicit commands. |
| **OD-3** | **T1 BLOCKED / negative-control only.** Do NOT wire T1, do NOT edit `t1-replay.js` / `deriveEvidenceT1` / `src/theatres/flare-gate.js`, do NOT map `xray_flux_observations[]` into manufactured `solar_flare` events, do NOT reanimate T1. | All sprints (forbidden-path lists); Sprint 03 negative-control proof. |
| **OD-4** | **Capture `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` from the unmodified pre-cycle-004 replay before any source edit.** First implementation sprint's first load-bearing step. | Sprint 01, T1.2 (gating step before any T2 wiring). |

### 1.3 Sprint shape

| Sprint | Theme | Scope | Branch (non-slash) |
|--------|-------|-------|--------------------|
| **Sprint 01** | Baseline fixture + proof-harness skeleton (no wiring) | SMALL | `cycle-004-s01-baseline-harness` |
| **Sprint 02** | T2 Layer-B + Layer-A evidence wiring (opt-in, default-off) | MEDIUM | `cycle-004-s02-t2-evidence-wiring` |
| **Sprint 03** | Determinism, ablation, regression, proof closeout | MEDIUM | `cycle-004-s03-proof-closeout` |

Process artifacts live under `grimoires/loa/a2a/cycle-004/sprint-NN/`. Proof artifacts live under `grimoires/loa/a2a/cycle-004/proof/`.

---

## 2. Frozen Invariants (encoded into every sprint's gate)

Verified against the repo at `main`/`cycle-004` @ `ccd6eea` during sprint planning (read-only):

| ID | Invariant | Verified value / mechanism | Check |
|----|-----------|----------------------------|-------|
| I1 | `scripts/corona-backtest.js` (cycle-001 entrypoint) sha256 frozen | git-blob (LF) `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` | File never imported/touched; cycle-004 entrypoint refuses cycle-001 output dirs. `git cat-file -p HEAD:scripts/corona-backtest.js \| sha256sum`. |
| I2 | cycle-001 corpus_hash frozen | `b1caef3f…11bb1` | Frozen corpus never written. |
| — | cycle-003 corpus_hash frozen | `7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003` (in `corpus-cycle-003-manifest.json`) | cycle-003 records read-only; never modified. |
| — | cycle-003 held-out seal frozen | `f7a851…a5ea` | Not read for fitting/eval; **no scoring at all**; seal file untouched. |
| I3 | RLMF cert frozen | `src/rlmf/certificates.js:100` → `version: '0.1.0'` | Not imported by the backtest seam; untouched. |
| — | `package.json` version frozen | `0.2.0`, `dependencies: {}` | No version/deps/`scripts.test` edit (OD-2). |
| I5 | replay-twice byte-identical, incl. frozen cycle-002 corpus | injected clock + canonical JSON + SHA-256 | Sprint 03 gates 4 & 7. |
| I6 | no `Date.now()` / `Math.random()` on replay path | injected clock only | Sprint 03 grep gate. |
| I7 | zero new dependencies | only intra-repo modules imported (`geomag-gate.js`, `uncertainty.js`) | `package.json` `dependencies` stays `{}`. |
| — | no runtime parameter / gate logic / threshold / `base_rate` / σ / λ / formula change | no `src/theatres/*` edit | Sprint 03 no-param-diff check. |
| — | no prior-cycle artifact / frozen manifest mutation | writes confined to authorized paths | Forbidden-path audit, every sprint. |
| — | no tag / release / version bump | none performed | All sprints. |

**Globally authorized write surface for cycle-004 (entire cycle):**
- `scripts/corona-backtest/ingestors/corpus-loader.js` — `deriveEvidenceT2` only (additive, field-gated). **Sprint 02.**
- `scripts/corona-backtest/replay/t2-replay.js` — `replay_T2_event` only (additive, opt-in). **Sprint 02.**
- `scripts/corona-backtest-cycle-004-evidence-wiring.js` — **new** entrypoint, no scoring. **Sprint 01 skeleton → Sprint 02/03 fill.**
- New additive tests under `tests/`. **Sprint 02/03.**
- Artifacts under `grimoires/loa/a2a/cycle-004/` (incl. `proof/`, `sprint-NN/`). **All sprints.**

**Globally forbidden write surface (entire cycle — touching any of these is a hard stop):**
`src/theatres/flare-gate.js` · `src/theatres/geomag-gate.js` · any other `src/theatres/*` · `src/rlmf/certificates.js` · `scripts/corona-backtest.js` (I1) · `scripts/corona-backtest-cycle-002.js` (cycle-002 entrypoint) · `scripts/corona-backtest/replay/t1-replay.js` · `deriveEvidenceT1` (in `corpus-loader.js`) · `package.json` · any cycle-001/002/003 corpus record, manifest, or frozen artifact · the held-out seal · `README.md` · `BUTTERFREEZONE.md` · root generic Loa docs (`grimoires/loa/{prd,sdd,sprint}.md`, `grimoires/loa/ledger.json`).

---

## 3. Goal Traceability (PRD §5 → sprints)

PRD goals G1–G7 are theatre-qualified to T2 (T1 = negative control). Mapping:

| PRD Goal | Description (T2-scoped) | Sprint(s) |
|----------|--------------------------|-----------|
| **G1** | Layer-B `deriveEvidenceT2` derives `pre_cutoff` from `kp_observations[]`, strict `< cutoff`, sorted, leakage-free; field-less → `[]`. | S02 (T2.1, T2.2) |
| **G2** | Layer-A `replay_T2_event` routes bundles **through** `processGeomagneticStormGate` in a clock-advancing loop; `position_history` gains real updates; `evidence_bundles_consumed` reflects consumed bundle ids. | S02 (T2.3, T2.4) |
| **G3** | Observable: wired ≠ ablated T2 trajectory hashes, over a stated/reported count of events. | S03 (T3.3) |
| **G4** | Reversible: ablated == reverted == pre-cycle-004 baseline fixture. | S01 (baseline) + S03 (T3.4) |
| **G5** | Determinism: replay-twice byte-identical per state; no `Date.now()` / `Math.random()` in new paths. | S03 (T3.2, T3.6) |
| **G6** | Frozen invariants preserved; cycle-002 frozen-corpus replay byte-identical before/after. | S02 + S03 (T3.5) |
| **G7** | Honest-framing holds: claim-grep gate passes; "no rung banked" posture + verbatim sentences carried into closeout. | S03 (T3.7, T3.8) |

**T1 negative-control verification** (PRD §4.3 / SDD §4): T1 wired == ablated == baseline → S03 (T3.6a).

No end-to-end *forecasting/accuracy* validation task exists by design — this is a wiring proof, not a scoring/eval cycle (PRD §6 / SDD §2.3). The cycle's terminal validation is the **proof closeout** (S03), not an E2E goal-validation in the calibration sense.

---

## 4. Sprint 01 — Baseline Fixture + Proof-Harness Skeleton

**Branch:** `cycle-004-s01-baseline-harness` (from `cycle-004` @ `ccd6eea`)
**Scope:** SMALL (3 tasks)
**Process artifacts:** `grimoires/loa/a2a/cycle-004/sprint-01/`

### 4.1 Sprint Goal
Capture the pre-change baseline trajectory hashes from the **unmodified** pre-cycle-004 replay, before any runtime/loader/replay source edit, and stand up the no-scoring proof-harness skeleton. **This sprint does not wire T2.**

### 4.2 Posture (required)
This sprint captures the reference fixture and creates the proof-harness skeleton only. No T2 wiring; no T1 edit; no scoring; no `package.json` edit; no commit/push.

### 4.3 Authorized file/path scope
- **Create** `grimoires/loa/a2a/cycle-004/proof/`.
- **Create** `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` (captured from unmodified pre-cycle-004 replay).
- **Create** `scripts/corona-backtest-cycle-004-evidence-wiring.js` as a **no-scoring harness skeleton** (arg parsing, `loadCorpusWithCutoff`, per-theatre dispatch wiring to the **unmodified** `replay_T1_event` / `replay_T2_event`, frozen-output-dir guard extended to cycle-001 + cycle-002 dirs; emits hash tables; **no Brier, no baseline-delta, no skill metric**). Skeleton may compute and print T1/T2 trajectory hashes only.
- **Create** Sprint 01 process artifacts under `grimoires/loa/a2a/cycle-004/sprint-01/`.

### 4.4 Forbidden in Sprint 01
- No T2 wiring; **no** `deriveEvidenceT2` edit; **no** `t2-replay.js` evidence-consumption edit (the harness calls the *current* unmodified `replay_T2_event`).
- No T1 edit (`t1-replay.js`, `deriveEvidenceT1`, `flare-gate.js`).
- No `src/theatres/*` edit.
- No scoring / Brier / baseline comparison / skill metric.
- No `package.json` edit (tests, if any, run via explicit `node --test …`).
- No commit / push.
- Any globally-forbidden write surface (§2).

### 4.5 Tasks

- [ ] **T1.1 — Stand up proof-harness skeleton.** Create `scripts/corona-backtest-cycle-004-evidence-wiring.js` (no scoring). It loads the **cycle-003** corpus via `loadCorpusWithCutoff`, dispatches T1 via the unmodified `replay_T1_event` and T2 via the unmodified `replay_T2_event` (no `wireEvidence` option passed → default behavior), and emits per-event 64-hex SHA-256 trajectory hashes. Reuse/extend the `FROZEN_CYCLE001_OUTPUT_DIRS` guard to also refuse cycle-002 output dirs. → **[G4 prep]**
- [ ] **T1.2 — Capture baseline fixture (LOAD-BEARING, must precede any source edit in the entire cycle).** Run the skeleton against the **unmodified** pre-cycle-004 replay and write the per-event hash table to `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json`. Record the **exact capture command** in the Sprint 01 report. This fixture is the immutable reference for Sprint 03's ablated==baseline gate. → **[G4]**
- [ ] **T1.3 — Document harness behavior + baseline provenance.** In `sprint-01/implementation-report.md`: exact baseline-capture command; harness behavior (inputs, outputs, no-scoring guarantee, frozen-dir guard); confirmation no source/runtime/loader/replay/test/`package.json` file was edited; `git status --short`; forbidden-path audit; frozen-invariant checks (I1 hash, cycle-003 hash unchanged, `package.json` `0.2.0`/`{}`); claim-grep output; hard-stop status.

### 4.6 Exact tests / validation commands (Sprint 01)
> OD-2: `package.json` is NOT edited. Commands are explicit `node --test …` / `node …` invocations, documented in the report.

```bash
# Baseline capture (the load-bearing step — run BEFORE any cycle-004 source edit):
node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes \
  > grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json

# Reproducibility cross-check (run twice, compare byte-identical):
node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes > /tmp/cycle004-baseline-rerun.json
diff grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json /tmp/cycle004-baseline-rerun.json   # expect: no diff

# Frozen-invariant spot checks:
git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum   # expect: 17f6380b…1730f1 (I1)
node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"  # expect: 0.2.0 {}

# Existing suite still green (no new tests yet in S01; confirm baseline harness did not perturb anything):
npm test    # runs the FROZEN scripts.test line verbatim — must stay green
```
> The exact `--emit-hashes` (or equivalent) flag name is fixed by the implementer in T1.1 and documented verbatim in the report; the proof report records the literal command used.

### 4.7 Acceptance criteria (Sprint 01)
- [ ] Baseline fixture `proof/baseline-hashes.json` exists.
- [ ] Baseline fixture was captured **before** any source wiring edit (verifiable: no edit to `corpus-loader.js`/`t2-replay.js`/`t1-replay.js`/`src/theatres/*` in this sprint's diff).
- [ ] Baseline capture is **reproducible** (run-twice byte-identical).
- [ ] No scoring / Brier / baseline comparison performed.
- [ ] No T1 mapping; no T1 edit.
- [ ] No `package.json` edit.
- [ ] No claim drift (claim-grep clean).
- [ ] Frozen invariants still pass (I1 hash; cycle-003 hash; `package.json` `0.2.0`/`{}`).

### 4.8 Hard stops (Sprint 01)
- HS-1 baseline cannot be captured deterministically (run-twice differs) → stop; investigate hidden non-determinism before any wiring.
- HS-8 any edit to a globally-forbidden artifact (§2) → stop.
- HS-10 any scoring/Brier/baseline-delta enters the skeleton → stop.

### 4.9 Proof / report outputs (Sprint 01)
- `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json`
- `grimoires/loa/a2a/cycle-004/sprint-01/implementation-report.md`
- `grimoires/loa/a2a/cycle-004/sprint-01/review-feedback.md` (from `/review-sprint`)
- `grimoires/loa/a2a/cycle-004/sprint-01/auditor-feedback.md` + `COMPLETED` marker (from `/audit-sprint`)

### 4.10 Gates (Sprint 01)
1. `/implement sprint-01`
2. `/review-sprint sprint-01`
3. fixes if needed
4. `/audit-sprint sprint-01`
5. **operator HITL approval**
6. **commit only after explicit operator approval**
7. **push only after explicit operator approval**

---

## 5. Sprint 02 — T2 Layer-B + Layer-A Evidence Wiring

**Branch:** `cycle-004-s02-t2-evidence-wiring` (from `cycle-004` after Sprint 01 lands)
**Scope:** MEDIUM (5 tasks)
**Process artifacts:** `grimoires/loa/a2a/cycle-004/sprint-02/`

### 5.1 Sprint Goal
Implement the actual T2 evidence-consumption path — Layer-B `deriveEvidenceT2` + Layer-A `replay_T2_event` — **opt-in and default-off**, so the runtime genuinely consumes pre-cutoff `kp_observations[]` through `processGeomagneticStormGate`, while the default (off) path stays byte-identical to pre-cycle-004.

### 5.2 Authorized file/path scope
- **Edit** `scripts/corona-backtest/ingestors/corpus-loader.js` — `deriveEvidenceT2` **only** (additive, field-gated), plus a shared strict-`<`-cutoff + numeric-sort filter helper, re-exported via the existing `_`-prefixed test-export block.
- **Edit** `scripts/corona-backtest/replay/t2-replay.js` — `replay_T2_event` **only** (additive, opt-in `{ wireEvidence }`, default `false`). Import `processGeomagneticStormGate` from `src/theatres/geomag-gate.js` and `buildKpUncertainty` from `src/processor/uncertainty.js` (both existing intra-repo runtime code — **no new dependency**).
- **Create** additive Layer-B / Layer-A unit tests under `tests/` (run via explicit `node --test …`; OD-2).
- **Create** Sprint 02 process artifacts under `grimoires/loa/a2a/cycle-004/sprint-02/`.

### 5.3 Forbidden in Sprint 02
- No T1 wiring; **no** `t1-replay.js` edit; **no** `deriveEvidenceT1` edit; **no** `src/theatres/flare-gate.js` edit.
- **No** `src/theatres/geomag-gate.js` edit (the gate is **called**, never modified).
- No gate parameter change; no runtime parameter / `base_rate` / threshold / σ / λ / formula change.
- No scoring / Brier / baseline comparison / skill metric.
- No `package.json` edit.
- No commit / push.
- Any globally-forbidden write surface (§2).

### 5.4 Tasks

- [ ] **T2.1 — Shared strict-`<`-cutoff filter helper (DRY).** In `corpus-loader.js`, extract a pure function that filters a `kp_observations[]`-shaped list to strict `< cutoff.time_ms` and sorts ascending by numeric `event_time_ms` (mirror `deriveEvidenceT4`'s record shape, `corpus-loader.js:534-540`). Re-export via the `_`-prefixed test block (`:616-630`). Used by both Layer B (T2.2) and Layer A (T2.3) so derivations cannot diverge. `Date.now()`-free; field-less input → `[]`, no throw. → **[G1]**
- [ ] **T2.2 — Layer-B `deriveEvidenceT2` (additive, field-gated).** Replace the hardcoded `pre_cutoff: []` with: `if (Array.isArray(event.kp_observations))` → use the T2.1 helper, map to `{ event_time_ms, time, kp, index, provenance, satellite }`; else `pre_cutoff: []`. `settlement` block unchanged. `deriveEvidenceT2` signature gains the `cutoff` arg (dispatch already calls `evFn(event, cutoff)`, `:608`). Strict `<` (mirror `deriveEvidenceT4`); cutoff = `deriveCutoffT2(event)` = `kp_window_end` (`:465-469`). → **[G1]**
- [ ] **T2.3 — Layer-A bundle construction + gate-processing loop (opt-in).** Add `replay_T2_event(corpus_event, ctx, options = {})` with `const { wireEvidence = false } = options;` (mirror `t4-replay.js:71-73`). When `wireEvidence === true` **and** `Array.isArray(corpus_event.kp_observations)`: build pinned `kp_index` bundles via the T2.1 helper, then **after** `createGeomagneticStormGate` loop in time order advancing the injected clock per bundle and calling `processGeomagneticStormGate(live, bundle, { now })` (SDD §8). Build `position_history_at_cutoff` from `live.position_history`; set `current_position_at_cutoff = live.current_position`; `evidence_bundles_consumed = kpBundles.map(b => b.bundle_id)`. Default/falsy/field-absent path = **exact current behavior** (create once, no loop, `evidence_bundles_consumed: []`). `outcome` derivation unchanged (still from settlement labels). → **[G2]**
- [ ] **T2.4 — Pin the bundle payload incl. the one constructed field.** Per SDD §6.4: `event_type: 'kp_index'`, `event_time` = numeric ms epoch of `obs.time`, `kp.value = obs.kp` (corpus-native), `kp.uncertainty = buildKpUncertainty({ kp: obs.kp, source: obs.provenance === 'gfz_definitive' ? 'GFZ' : 'SWPC' })` (existing runtime model), `evidence_class: 'provisional'` (gradual path, never resolves — SDD §6.3), `quality: { composite: 1.0 }`. **`quality.composite = 1.0` is documented in code + report as: "a uniform neutral/default runtime quality weight required by the existing T2 gate contract."** It is NOT source-derived, NOT in the corpus, NOT fitted/tuned/optimized/quality-measured, NOT a parameter-refit (OD-1). GFZ-lag handling: derive evidence from **all** strictly-pre-cutoff observations regardless of `regression_tier_eligible` / `kp_gfz_observed == null` (SDD §6.6); provenance flows into `buildKpUncertainty` σ; no entry dropped. → **[G2]**
- [ ] **T2.5 — Additive Layer-B/Layer-A unit tests + report.** Author the tests below (run via explicit `node --test …`); write `sprint-02/implementation-report.md` (exact files changed; `git status --short`; forbidden-path audit; frozen-invariant checks; test outputs; claim-grep; hard-stop status; whether any operator decision is needed). → **[G1, G2]**

### 5.5 Exact tests / validation commands (Sprint 02)
> OD-2: new tests are NOT added to `package.json` `scripts.test`. They run via explicit `node --test …`, documented verbatim in the report.

```bash
# New additive T2 unit tests (SDD §11 — proposed filenames; implementer fixes final names + documents them):
node --test \
  tests/corpus-loader-t2-precutoff-test.js \
  tests/corpus-loader-t2-gfz-lag-test.js \
  tests/replay-t2-genuine-consumption-test.js \
  tests/layer-ab-agreement-test.js

# Existing suite must stay green (FROZEN scripts.test line, unchanged):
npm test

# Frozen-invariant spot checks (must hold after the edits):
git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum                 # I1: 17f6380b…1730f1
node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"   # 0.2.0 {}
git diff --name-only                                                        # only corpus-loader.js + t2-replay.js + new tests/* + sprint-02/*
```

Test assertions (SDD §11):
- `corpus-loader-t2-precutoff-test.js` — Layer-B derives `pre_cutoff` from `kp_observations[]`; **strict `<` (zero entries `>= cutoff`)**; ascending `event_time_ms`; field-less → `[]` (no throw).
- `corpus-loader-t2-gfz-lag-test.js` — a `kp_gfz_observed == null` event still derives evidence (OQ-5).
- `replay-t2-genuine-consumption-test.js` — `wireEvidence:true` invokes the gate (`position_history.length > 1`; `evidence_bundles_consumed` non-empty); `wireEvidence:false` == baseline (length 1, `[]`).
- `layer-ab-agreement-test.js` — Layer-A bundle times == Layer-B `pre_cutoff` times per event (shared-helper consistency).

### 5.6 Acceptance criteria (Sprint 02)
- [ ] T2 wired path produces **real** `position_history` updates (length > 1 for events with ≥1 pre-cutoff observation).
- [ ] `processGeomagneticStormGate` is **actually exercised** (consumption is structural, not metadata — verified by the genuine-consumption test).
- [ ] **Metadata-only proof is impossible / rejected** (HS-3): if the only achievable "consumption" were metadata churn, stop.
- [ ] Field-less corpus event remains a **no-op** (`pre_cutoff: []`, baseline trajectory).
- [ ] Default-off (`wireEvidence:false` / option absent) behavior is **byte-identical** to pre-cycle-004.
- [ ] No gate edits (`src/theatres/*` untouched).
- [ ] No parameter edits (no `base_rate`/threshold/σ/λ/formula diff).
- [ ] No scoring.
- [ ] No `package.json` edit.
- [ ] `quality.composite = 1.0` documented exactly as the OD-1 wording; not described as source-derived/fitted.

### 5.7 Hard stops (Sprint 02)
- **HS-1 (no-refit):** wiring appears to require any runtime parameter / threshold / `base_rate` / formula change → stop.
- **HS-2 (gate edit):** T2 cannot be wired without editing `src/theatres/geomag-gate.js` → stop.
- **HS-3 (hollow proof):** the only achievable T2 consumption is metadata-only (gate not actually exercised; `position_history` unchanged) → stop, report honestly.
- **HS-5 (leakage):** any T2 `pre_cutoff` entry `>= cutoff`, or any settlement label inside a series entry → stop.
- **HS-8 (frozen-artifact touch):** any edit to a globally-forbidden artifact (§2) → stop.
- **HS-9 (T1 reanimation):** any attempt to wire T1 / map flux to `solar_flare` → stop.
- **HS-10 (scope creep):** any scoring/Brier/baseline-delta/T4-fetch/rung-banking enters the sprint → stop.

### 5.8 Proof / report outputs (Sprint 02)
- Edited `corpus-loader.js` (`deriveEvidenceT2` + helper) + `t2-replay.js` (`replay_T2_event`).
- New tests under `tests/`.
- `grimoires/loa/a2a/cycle-004/sprint-02/implementation-report.md`
- `grimoires/loa/a2a/cycle-004/sprint-02/review-feedback.md`
- `grimoires/loa/a2a/cycle-004/sprint-02/auditor-feedback.md` + `COMPLETED` marker

### 5.9 Gates (Sprint 02)
1. `/implement sprint-02` → 2. `/review-sprint sprint-02` → 3. fixes → 4. `/audit-sprint sprint-02` → 5. **operator HITL approval** → 6. **commit only after explicit approval** → 7. **push only after explicit approval**.

---

## 6. Sprint 03 — Determinism, Ablation, Regression, Proof Closeout

**Branch:** `cycle-004-s03-proof-closeout` (from `cycle-004` after Sprint 02 lands)
**Scope:** MEDIUM (8 tasks)
**Process artifacts:** `grimoires/loa/a2a/cycle-004/sprint-03/`

### 6.1 Sprint Goal
Prove the T2 wiring deterministically and safely: wired ≠ ablated, ablated == baseline fixture, replay-twice byte-identical, T1 negative-control identity, frozen cycle-002 corpus regression byte-identical — and produce the honest, no-rung proof closeout.

### 6.2 Authorized file/path scope
- **Fill** `scripts/corona-backtest-cycle-004-evidence-wiring.js` to produce the three proof states (WIRED / ABLATED / BASELINE) by toggling the `wireEvidence` option (SDD §9.2), emit wired/ablated hash tables, and the wired-vs-ablated diff count/list. **No scoring.**
- **Create** the proof/determinism/regression/claim-grep tests under `tests/` (run via explicit `node --test …`).
- **Create** `grimoires/loa/a2a/cycle-004/proof/{wired-hashes.json, ablated-hashes.json, PROOF-SUMMARY.md}`.
- **Create** Sprint 03 process artifacts + `CLOSEOUT.md` under `grimoires/loa/a2a/cycle-004/sprint-03/`.

### 6.3 Forbidden in Sprint 03
- No scoring / Brier / skill metrics.
- No held-out evaluation; the cycle-003 seal stays untouched/read-only.
- No Baseline-A-vs-Baseline-B delta; no cross-regime comparison.
- No T1 unblock; no T4 fetch/unblock.
- No parameter refit; no gate/runtime parameter change.
- No `package.json` edit.
- No tag / release / version bump.
- No commit / push **without operator approval**.
- Any globally-forbidden write surface (§2).

### 6.4 Tasks

- [ ] **T3.1 — Complete the entrypoint's three-state production.** Fill `corona-backtest-cycle-004-evidence-wiring.js` to emit: WIRED hashes (`replay_T2_event(event, ctx, { wireEvidence: true })`), ABLATED hashes (`wireEvidence: false`), and load BASELINE from `proof/baseline-hashes.json` (Sprint 01). Write `proof/wired-hashes.json` + `proof/ablated-hashes.json`. **No scoring.** → **[G3, G4]**
- [ ] **T3.2 — Replay-twice determinism test.** Run each of {wired, ablated} twice; assert byte-identical trajectory hash within each state (`replay-t2-determinism-wired-test.js`). → **[G5]**
- [ ] **T3.3 — Wired-vs-ablated diff (observable).** Count **and list** T2 events where `wired ≠ ablated`; report the count explicitly (no silent truncation) (`replay-t2-wired-vs-ablated-test.js`). Expect all T2 events with ≥1 pre-cutoff observation to differ. → **[G3]**
- [ ] **T3.4 — Ablated == baseline (reversible).** Assert `ablated == proof/baseline-hashes.json` for all events (`replay-t2-ablated-equals-baseline-test.js`). → **[G4]**
- [ ] **T3.5 — Frozen cycle-002 corpus regression.** Run `corona-backtest-cycle-002.js` (or its `dispatchCycle002Replay` export) against the **frozen** cycle-002 corpus before vs. after the Sprint-02 code change; assert byte-identical T1/T2/T4 trajectory hashes (`cycle-002-frozen-corpus-regression-test.js`). This proves the additive/opt-in change did not perturb cycle-002 (I5). → **[G6]**
- [ ] **T3.6 — Determinism grep gate + no-param-diff.** `no-walltime-no-random-test.js`: grep new cycle-004 files for `Date.now(` / `Math.random(` → none (I6). `no-param-diff-test.js`: gate `base_rate`, thresholds, `CYCLE_002_T2_GATE_PARAMS` unchanged (no-refit). → **[G5, G6]**
- [ ] **T3.6a — T1 negative-control identity.** Assert T1 `wired == ablated == baseline` (no consumption; block verified) (`replay-t1-negative-control-test.js`). → **[T1 negative control]**
- [ ] **T3.7 — Claim-grep gate.** `claim-grep-gate-test.js`: forbidden-claim patterns (SDD §15 list) appear in cycle-004 artifacts only as negations / definitions / historical-ceiling statements. → **[G7]**
- [ ] **T3.8 — Proof closeout (honest framing).** Write `proof/PROOF-SUMMARY.md` (hash tables + counts + identity assertions; **no scoring, no Brier, no baseline-delta, no skill claim**) and `sprint-03/CLOSEOUT.md` carrying the verbatim allowed posture (§1.1), the "no rung banked" statement, and the theatre-qualified result statement (SDD §15). → **[G7]**

### 6.5 Exact tests / validation commands (Sprint 03)
> OD-2: tests run via explicit `node --test …`, documented verbatim in the report.

```bash
# Produce the three proof states (no scoring):
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state wired   > grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state ablated > grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json

# Reversibility (ablated == committed baseline) — byte identity:
diff grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json   # expect: no diff

# Full additive cycle-004 proof/determinism/regression/claim suite:
node --test \
  tests/replay-t2-determinism-wired-test.js \
  tests/replay-t2-wired-vs-ablated-test.js \
  tests/replay-t2-ablated-equals-baseline-test.js \
  tests/replay-t1-negative-control-test.js \
  tests/cycle-002-frozen-corpus-regression-test.js \
  tests/no-walltime-no-random-test.js \
  tests/no-param-diff-test.js \
  tests/claim-grep-gate-test.js

# Existing suite stays green (FROZEN scripts.test line):
npm test

# Frozen-invariant final sweep:
git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum   # I1: 17f6380b…1730f1
node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"   # 0.2.0 {}
```
> Exact entrypoint flag names (`--state`, `--emit-hashes`, etc.) are fixed by the implementer and recorded verbatim in the proof report.

### 6.6 Acceptance criteria (Sprint 03)
- [ ] **Wired ≠ ablated** for T2 events with pre-cutoff observations.
- [ ] **Diff count is reported explicitly** (count + event list; no silent truncation).
- [ ] **Ablated == baseline fixture** (byte identity, all events).
- [ ] **Replay-twice byte-identical** within each of {wired, ablated}.
- [ ] **T1 wired == ablated == baseline** (negative control).
- [ ] **Cycle-002 frozen corpus replay byte-identical** before/after (T1/T2/T4).
- [ ] No `Date.now()` / `Math.random()` in new replay paths.
- [ ] No parameter / gate / source invariant drift (I1 hash; cycle-003 hash; RLMF `0.1.0`; `package.json` `0.2.0`/`{}`).
- [ ] No forbidden positive claims (claim-grep clean — negations/definitions/ceiling only).
- [ ] No rung banked.
- [ ] No tag / release / version bump.

### 6.7 Hard stops (Sprint 03)
- **HS-4 (frozen-replay drift):** cycle-002 frozen-corpus replay hashes change (T3.5 fails) → stop; redesign to default-off/additive.
- **HS-6 (no signal / no revert):** wired == ablated for all T2 events (no observable consumption), or ablated ≠ baseline → report the negative result honestly; **do not manufacture a difference**.
- **HS-7 (claim-gate):** a forbidden-claim pattern appears as a positive claim → stop; reword.
- **HS-8 (frozen-artifact touch):** any edit to a globally-forbidden artifact (§2) → stop.
- **HS-9 (T1 reanimation) / HS-10 (scope creep):** any T1 unblock, T4 fetch, scoring, baseline-delta, refit, or rung-banking → stop.

### 6.8 Proof / report outputs (Sprint 03)
- `grimoires/loa/a2a/cycle-004/proof/{wired-hashes.json, ablated-hashes.json, PROOF-SUMMARY.md}`
- New tests under `tests/`.
- `grimoires/loa/a2a/cycle-004/sprint-03/implementation-report.md`
- `grimoires/loa/a2a/cycle-004/sprint-03/review-feedback.md`
- `grimoires/loa/a2a/cycle-004/sprint-03/auditor-feedback.md` + `COMPLETED` marker
- `grimoires/loa/a2a/cycle-004/sprint-03/CLOSEOUT.md`

### 6.9 Gates (Sprint 03)
1. `/implement sprint-03` → 2. `/review-sprint sprint-03` → 3. fixes → 4. `/audit-sprint sprint-03` → 5. **operator HITL approval** → 6. **commit only after explicit approval** → 7. **push only after explicit approval**.

---

## 7. Review / Audit Discipline (binding for every sprint)

Each sprint MUST go through, in order:

1. `/implement sprint-NN`
2. `/review-sprint sprint-NN`
3. fixes if needed
4. `/audit-sprint sprint-NN`
5. **operator HITL approval**
6. **commit only after explicit operator approval**
7. **push only after explicit operator approval**

Every implementation / review / audit report MUST include:
- exact files changed;
- `git status --short`;
- forbidden-path audit (§2 forbidden surface);
- frozen-invariant checks (I1 hash, cycle-003 hash, RLMF `0.1.0`, `package.json` `0.2.0`/`{}`, no-param-diff);
- tests / validation outputs (the explicit `node --test …` commands + results);
- claim-language grep output;
- whether any hard stop occurred;
- whether any operator decision is needed.

This cycle proceeds via `/run sprint-plan` (implement→review→audit cycle with circuit breaker) or per-sprint `/implement`→`/review-sprint`→`/audit-sprint`. **Never ad-hoc implementation; never skip review/audit (PRD AC9).**

### 7.1 Before COMMIT (every sprint)
- implementation complete · review complete · audit complete · tests pass · frozen invariants intact · no claim drift · **operator explicitly approves commit.**

### 7.2 Before PUSH (every sprint)
- commit hash recorded · branch correct · working tree clean · ahead/behind understood · **operator explicitly approves push.**

---

## 8. Branch Discipline

- Keep `cycle-004` separate from `main` until final closeout.
- Sprint branches use **non-slash** names (avoid git ref conflicts with the existing `cycle-004` branch):
  - `cycle-004-s01-baseline-harness`
  - `cycle-004-s02-t2-evidence-wiring`
  - `cycle-004-s03-proof-closeout`
- **Do NOT** use slash-form names (`cycle-004/s01-*`, etc.).
- **No final merge to `main`** until cycle closeout and explicit operator approval.
- `main` remains untouched throughout (currently `ccd6eea`).

---

## 9. Claim-Grep Posture (carried into every report + the closeout)

Forbidden as **positive** claims (allowed only as negations / definitions / historical-ceiling statements; enforced by the claim-grep gate, HS-7 / SDD §15):

`calibration improved` · `forecasting accuracy` · `predictive uplift` · `empirical performance improvement` · `L2 publish-ready` · `T1/T2 runtime-sensitive` · `T1/T2 calibration-improved` · `new rung earned` · `Baseline A vs Baseline B uplift` · `new-corpus baseline uplift`.

The closeout carries the verbatim allowed posture (§1.1) and the theatre-qualified result statement (SDD §15) and the **"no rung banked"** posture.

---

## 10. Open Operator Decisions Remaining

All four SDD operator decisions are **resolved** (OD-1 `quality.composite = 1.0` as a uniform neutral/default weight; OD-2 no `package.json` edit / explicit `node --test`; OD-3 T1 BLOCKED; OD-4 baseline fixture first). **No new operator decisions are required to begin Sprint 01.** Any hard stop encountered during implementation surfaces a fresh operator decision per §7.

---

## 11. Self-Review Checklist

- [x] All in-scope PRD/SDD requirements accounted for (T2 wiring; T1 negative control; T4 deferred).
- [x] Sprints build logically (baseline → wiring → proof).
- [x] Each sprint is feasible as a single iteration (SMALL/MEDIUM, ≤8 tasks).
- [x] All deliverables + acceptance have checkboxes.
- [x] Acceptance criteria testable; exact `node --test …` commands given (OD-2: no `package.json` edit).
- [x] Technical approach aligns with SDD (opt-in `wireEvidence`, additive Layer-A/B, shared helper, `quality.composite = 1.0` per OD-1).
- [x] Risks → hard stops (per-sprint HS lists trace to PRD §9 / SDD §14).
- [x] Dependencies explicit (S02 needs S01 baseline; S03 needs S02 wiring + S01 baseline).
- [x] Frozen invariants encoded into every sprint gate (§2).
- [x] Goal traceability mapped (§3).
- [x] Claim ceiling + "no rung banked" posture carried throughout (§1.1, §9).
- [x] Operator decisions encoded (§1.2); no new decision blocks Sprint 01 (§10).

---

*End of cycle-004 sprint plan (draft). No code, commit, tag, release, version bump, or `main`/prior-cycle mutation was produced by this document. Awaiting operator review.*
