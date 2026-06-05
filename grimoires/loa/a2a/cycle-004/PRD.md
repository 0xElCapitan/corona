# CORONA Cycle-004 — Product Requirements Document (PRD)

> **Status:** DRAFT — awaiting operator review. Planning only.
> **Branch:** `cycle-004` (from `main` @ `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6`)
> **Date:** 2026-06-02
> **Phase:** `/plan-and-analyze` output. Next step after operator approval: `/architect` (SDD).
> **This document creates no code, no SDD, no sprint artifacts. It mutates no cycle-001/002/003 artifact, no root doc, no `package.json`, no tag/release.**

---

## 1. Mission Statement

**Wire CORONA's T1 (flare-class) and T2 (geomagnetic-storm) replay + loader so the runtime deterministically *consumes* the pre-cutoff evidence time-series that cycle-003 already built — and prove that consumption is real, deterministic, and reversible.**

Cycle-003 produced the substrate: every T1 record carries `xray_flux_observations[]` and every T2 record carries `kp_observations[]`, strictly pre-cutoff and leakage-free. The runtime evidence-update path still ignores them (`deriveEvidenceT1` / `deriveEvidenceT2` return `pre_cutoff: []` unconditionally; `t1-replay.js` / `t2-replay.js` never call `processFlareClassGate` / `processGeomagneticStormGate`). Cycle-004 is the **named, explicitly-deferred** cycle (cycle-003 SDD §2 OQ-9 / HS-2) that closes that gap and demonstrates it deterministically.

This is a **wiring / evidence-consumption proof**, not a calibration cycle. See §4 (Claim Ceiling) — the line is load-bearing.

---

## 2. Problem / Motivation

### 2.1 The gap
Cycle-003 deliberately shipped **wired-capable shape, not wiring**. From cycle-003's own closeout (SDD §2.1): *"t1-replay.js and t2-replay.js never import or call processFlareClassGate / processGeomagneticStormGate; corpus-loader.js deriveEvidenceT1 / deriveEvidenceT2 hardcode pre_cutoff: [] unconditionally. The new T1/T2 series fields are loaded but ignored at the evidence layer."*

So the pre-cutoff time-series exist in the corpus but never reach the runtime. The runtime's T1/T2 trajectories still emit the scalar `base_rate` constant only — exactly as they did on the cycle-001 corpus shape that *had* no pre-cutoff series. The substrate investment is, at runtime, inert.

### 2.2 Why now
- The work is the **single named deferral** of cycle-003 (OQ-9 / HS-2), to be done "in a future, separately-gated cycle with its own SDD + sprint plan." Cycle-004 is that cycle.
- A **working reference implementation already exists**: T4 does precisely this. `deriveEvidenceT4` filters `proton_flux_observations[]` by strict `< cutoff` and `t4-replay.js` loops calling `processProtonEventCascade` with an advancing injected clock. Cycle-004 mirrors that pattern for T1/T2.
- The mission is **self-contained**: it needs no new data, no internet, no external archive — only the in-repo cycle-003 substrate and the already-implemented runtime gates.

### 2.3 What "consumed" must mean (a design caution, not optional)
A trajectory hash can be made to differ *trivially* by stuffing an `evidence_bundles_consumed[]` list into trajectory metadata while the gate logic stays prior-only. **That is a hollow proof and is explicitly rejected.** Genuine consumption (the cycle-003 deferral language) requires that the pre-cutoff evidence flow *through* `processFlareClassGate` / `processGeomagneticStormGate` and move `position_history` / `current_position` — i.e., the runtime computes a different trajectory *because it processed the evidence*. The gate code and all of its parameters remain byte-frozen; cycle-004 only feeds the existing, unchanged runtime the evidence it was always designed to consume.

---

## 3. Source-of-Truth Prior-Cycle Summary

All claims below are grounded in repo artifacts (cited), which are the source of truth.

### 3.1 Cycle-001 (frozen, verdict: fail; posture: "calibration-attempted, not improved")
- Composite verdict **fail** across all runs. (`grimoires/loa/calibration/corona/run-3-final/delta-report.md`)
- Binding hash invariants: corpus_hash `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1`; script_hash `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1`.
- Honest-framing closure: runtime processor parameters are **not** exercised by the offline scoring layer; cycle-001 scores against UNIFORM_PRIOR baselines. Posture verbatim: **"calibration-attempted, not improved."**

### 3.2 Cycle-002 (ceiling: T4 runtime sensitivity only — Rung 2, T4 only)
- Earned exactly **Rung 2 (runtime-sensitive) for T4 only**, via a two-direction perturbation test (lambdaScalar 1.0 → 1.25 → 1.0 byte-identical revert). No higher rung. (`grimoires/loa/a2a/cycle-002/sprint-06/CLOSEOUT.md`)
- Rung ladder (binding): **Rung 1 = runtime-wired; Rung 2 = runtime-sensitive; Rung 3 = calibration-improved (gated); Rung 4 = L2 publish-ready (gated).** Higher rungs never skip lower ones.
- T1/T2: **runtime-wired but prior-only** on the cycle-001 corpus shape — `createX` called once, `processX` never called, `current_position_at_cutoff` == `base_rate`. Foreclosed from a higher rung by corpus shape.
- Baseline regime separation (binding): Baseline A (cycle-001 uniform-prior) and Baseline B (cycle-002 runtime-replay) are **non-comparable**; cross-regime "uplift" is forbidden (CHARTER §8.2).
- New entrypoint `scripts/corona-backtest-cycle-002.js` introduced specifically to preserve cycle-001's byte-frozen entrypoint (invariant I1).
- Published version **v0.2.0**; no tag/bump. RLMF certificate frozen at **0.1.0**.

### 3.3 Cycle-003 (corpus-expansion substrate; no rung; the source of cycle-004's substrate)
- Mission (verbatim, PRD §3.1): *"Build the historical-corpus expansion and held-out evaluation substrate that a future cycle would need — without refitting, without claiming improvement."*
- **T1 substrate:** 30 flare records, each with `xray_flux_observations[]` (NOAA NCEI GOES-R XRS 1-min long-channel, W/m²), strictly pre-cutoff (`flare_peak_time − 1 ms`); **5,197** total series entries.
- **T2 substrate:** 30 geomagnetic-storm records, each with `kp_observations[]` (GFZ definitive per-3hr Kp + provisional), strictly pre-cutoff (`kp_window_end`); **360** total series entries.
- Substrate-conformance probe: **0 leakage violations over 5,557 series entries**.
- **T4:** BLOCKED-PARTIAL (operator Option B, 2026-05-31). Supply characterized at **46 S1+ events** (GOES-R era); **0 T4 records** built; cascade-bucket distribution reported BLOCKED (not derivable from the SEP list alone).
- Final **corpus_hash = `7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003`** (over the 60 primary T1/T2 files; T4 = 0).
- Held-out split sealed: seal `f7a851362929a43c8165e0367952fdd7479e1dad8fbb2155ac3fb7e6d4c2a5ea`; method `stratified_random_seqgrouped`; ratio 0.7/0.3; seed `corona-cycle-003-heldout-v1`; T1 21 train / 9 held-out, T2 21 train / 9 held-out, T4 0.
- **No new rung; no theatre rung advanced; v0.2.0 preserved.** Cycle-002 ceiling preserved unweakened.
- **Explicit deferral (OQ-9 / HS-2):** the Layer-A replay + Layer-B loader change to consume the new series is out of cycle-003 scope and belongs to a future separately-gated cycle. **← this is cycle-004's mission.**

### 3.4 Code reality (current `main` @ `ccd6eea`)
- **Layer B** — `scripts/corona-backtest/ingestors/corpus-loader.js`: `deriveEvidenceT1` / `deriveEvidenceT2` return `{ pre_cutoff: [], settlement: {...} }`. `deriveEvidenceT4` (the **reference**) filters `proton_flux_observations[]` by strict `< cutoff.time_ms`, sorts by `event_time_ms`, returns time-keyed bundles. `loadCorpusWithCutoff` orchestrates per-theatre cutoff + evidence derivation.
- **Layer A** — `scripts/corona-backtest/replay/t1-replay.js` & `t2-replay.js`: call `createFlareClassGate` / `createGeomagneticStormGate` once, score directly from corpus settlement labels (`flare_class_observed`, `kp_gfz_observed`), hardcode `evidence_bundles_consumed: []`, never call `processX`. `t4-replay.js` (the **reference**) builds bundles from the series and loops `processProtonEventCascade(theatre, bundle, { now })` advancing the clock per bundle.
- **Gates (already implemented, live path)** — `src/theatres/flare-gate.js` `processFlareClassGate(theatre, bundle, { now })`; `src/theatres/geomag-gate.js` `processGeomagneticStormGate(theatre, bundle, { now })` (dispatches `kp_index` → `processKpObservation`, etc.).
- **Determinism harness** — injected `now`, canonical JSON (RFC 8785 spirit), SHA-256 trajectory hashes; replay never falls back to `Date.now()` (fail-closed). Existing replay tests live in `tests/` (per `package.json`): `replay-trajectory-shape-T1/T2`, `replay-determinism-T1T2`, `replay-T1T2-binary-brier-scoring`, `replay-clock-injection-default-T1T2`, plus T4 equivalents.

---

## 4. Explicit Claim Ceiling (load-bearing)

Cycle-004 **preserves** the historical ceiling and adds one narrow, carefully-bounded demonstration.

### 4.1 Preserved unweakened
- Cycle-002 ceiling stands: **CORONA demonstrated T4 runtime sensitivity only** (Rung 2, T4). This is a historical-ceiling statement, carried forward verbatim.
- Cycle-001 posture stands: **"calibration-attempted, not improved."**
- v0.2.0 stands; RLMF cert 0.1.0 stands; no-refit covenant stands; held-out seal stands.

### 4.2 What cycle-004 MAY demonstrate (if it succeeds)
- That the T1/T2 runtime evidence-update path is **wired**, and the runtime **deterministically consumes** the pre-cutoff `xray_flux_observations[]` / `kp_observations[]` through the existing `processFlareClassGate` / `processGeomagneticStormGate`.
- That the consumption is **observable** (wired vs. ablated trajectories differ deterministically) and **reversible** (ablating the evidence / reverting the wiring restores a byte-identical pre-cycle-004 baseline).

### 4.3 What cycle-004 must NOT claim (prohibitions)
Cycle-004 does **NOT** claim, and its artifacts must not assert as positive results, any of:
- "calibration improved" / any calibration improvement;
- "forecasting accuracy" / any forecasting-accuracy gain;
- "empirical performance improvement";
- "predictive uplift";
- "verifiable track record";
- "L2 publish-ready" / L2 readiness;
- "T1/T2 calibration-improved";
- "T1/T2 runtime-sensitive" **as a banked success-ladder badge** (see §11 OQ-1 — the ablation harness is sensitivity-*shaped*, but cycle-004 deliberately does **not** bank a new rung for T1/T2);
- any "Baseline A vs Baseline B uplift" or "new-corpus baseline uplift" or other cross-regime comparison;
- any new rung; any release, tag, or version bump.

**Default posture: NO new rung is earned.** The demonstration proves *plumbing* (evidence reaches and moves the runtime, deterministically and reversibly). Promotion of that demonstration into a Rung-2 "T1/T2 runtime-sensitive" claim — analogous to how T4 earned Rung 2 — is a **separate, operator-gated decision** explicitly out of scope here (§11 OQ-1).

---

## 5. Goals

| # | Goal | Verification |
|---|------|--------------|
| G1 | Layer B derives `evidence.pre_cutoff` for T1 from `xray_flux_observations[]` and for T2 from `kp_observations[]`, by strict `< cutoff` filter, deterministically sorted — mirroring `deriveEvidenceT4`. | Unit tests: zero entries `≥ cutoff` over all 60 events; byte-identical output on repeated load. |
| G2 | Layer A (`t1-replay.js` / `t2-replay.js`) builds pre-cutoff bundles and routes them **through** `processFlareClassGate` / `processGeomagneticStormGate` in a clock-advancing loop (mirroring `t4-replay.js`); `position_history` gains real intermediate positions; `evidence_bundles_consumed` reflects the actual consumed bundles. | Trajectory inspection: `position_history` is no longer base-rate-only when evidence is present; replay test asserts `processX` was exercised. |
| G3 | **Consumption is observable**: with evidence wired, T1/T2 trajectory hashes differ from the evidence-ablated run, across a stated, reported number of events. | Hash diff report (wired vs. ablated). |
| G4 | **Consumption is reversible**: ablating evidence / reverting the wiring yields trajectory hashes **byte-identical** to the pre-cycle-004 baseline. | Hash-equality gate (ablated == reverted == pre-cycle-004 baseline). |
| G5 | **Determinism preserved**: replay-twice byte-identical within each state; no `Date.now()` / `Math.random()` in the new paths. | `replay-determinism-T1T2`-style tests pass; grep gate for `Date.now`/`Math.random` in new code. |
| G6 | **Frozen invariants preserved**: cycle-002 frozen-corpus replays are byte-identical before vs. after the wiring (additive + field-presence-gated); cycle-001/002/003 hashes, RLMF cert, params unchanged. | Determinism regression vs. a captured pre-change baseline; invariant manifest check. |
| G7 | **Honest-framing holds**: claim-grep gate passes; the four verbatim honest-framing sentences and the "no rung banked" posture are carried into the closeout. | Grep gate; reviewer/auditor confirmation. |

---

## 6. Non-Goals

- **NOT a calibration / refit cycle.** No change to any runtime parameter, threshold, `base_rate`, `PRODUCTIVITY_PARAMS`, σ, λ, or scoring formula. (If wiring appears to *require* such a change, that is a hard stop — §9.)
- **NOT a scoring / evaluation cycle.** Default: compute trajectories + hashes only. No Brier, no skill score, no held-out evaluation, no baseline. (Keeps the cycle unambiguously wiring-only; see §11 OQ-3.)
- **NOT a rung-advancement cycle.** No new rung banked for any theatre (see §4.3, §11 OQ-1).
- **NOT a T4 cycle.** The T4 raw-proton-flux unblock (Option A′ sanity-sample / Option A full expansion) is **deferred to a separate, operator-gated cycle** (rationale in the planning report). It depends on external NOAA archive availability + DV-5 fetch authorization, only partially unblocks T4 (the cascade-bucket blocker is structural), and would dilute cycle-004's single-mission honest-framing discipline.
- **NOT a corpus-expansion cycle.** Cycle-003's 60 primary records are the input as-is; no new records.
- **NOT a release cycle.** v0.2.0 stands; no tag, no `package.json` bump, no CHANGELOG/README/BUTTERFREEZONE change beyond (if any) honest-framing carry-forward.
- **NOT an RLMF-cert / src/theatres gate-logic change cycle.** The gates and the cert are byte-frozen; cycle-004 *calls* the gates, it does not modify them.
- **NOT a T3 / T5 cycle.** T3 stays `[external-model]` (WSA-Enlil wrap), T5 stays `[quality-of-behavior]`; both diagnostic-only, neither counted toward any composite.
- **NOT a held-out-set modification cycle.** The cycle-003 seal is frozen and read-only.

---

## 7. Target Achievements

A **deterministic T1/T2 evidence-wiring proof**, consisting of:

1. **Layer B wired** — `deriveEvidenceT1` / `deriveEvidenceT2` populate `evidence.pre_cutoff` from the cycle-003 series fields, deterministically, leakage-free, additively (no-op for the field-less frozen cycle-002 corpus).
2. **Layer A wired** — `t1-replay.js` / `t2-replay.js` consume that evidence through the existing `processX` runtime gates, producing trajectories whose `position_history` genuinely reflects the pre-cutoff series.
3. **Observable consumption** — a wired-vs-ablated trajectory-hash diff over the 60 primary events, reported as a count/table (no scoring).
4. **Deterministic reversibility** — ablation / revert restores a byte-identical pre-cycle-004 baseline; replay-twice byte-identical within each state.
5. **Invariant preservation** — cycle-001/002/003 frozen artifacts, hashes, RLMF cert, parameters, and the cycle-002 frozen-corpus replay outputs all unchanged.
6. **Honest closeout** — the artifact set states plainly: *wiring/consumption proven, deterministic, reversible; no rung banked; no calibration/accuracy/uplift claim; cycle-002 T4-only Rung-2 ceiling and v0.2.0 preserved.*

The proof remains **sensitivity-/wiring-only by construction**, never calibration improvement.

---

## 8. Risks / Hazards

| ID | Risk | Mitigation |
|----|------|-----------|
| R1 | **T1 semantic-mapping gap.** `xray_flux_observations[]` are raw flux samples; `processFlareClassGate` expects flare-class *events* (a `flare.rank`). Naïve wiring may not map, or may tempt a gate edit. | SDD must specify a **deterministic, parameter-free** flux→signal mapping (physical GOES X-ray class thresholds are definitions, not fitted parameters) **or** scope T1 more conservatively (e.g., prove T2 cleanly, treat T1 as a separately-bounded item). No edit to `flare-gate.js` logic/params. (§11 OQ-7) |
| R2 | **Hollow-proof temptation.** Passing evidence into trajectory *metadata* only (gates stay prior-only) makes hashes differ trivially without real consumption. | Acceptance requires `processX` to be exercised and `position_history` to reflect the series (G2). Reviewer/auditor verify genuine consumption, not metadata churn. |
| R3 | **Frozen-corpus replay drift.** Editing `t1-replay.js`/`t2-replay.js`/`corpus-loader.js` could change cycle-002 frozen-corpus replay outputs (breaks I5). | Wiring is **additive and gated on series-field presence** (`Array.isArray(...)`); the field-less cycle-002 corpus takes the unchanged path. A determinism-regression test compares cycle-002 replay hashes before/after (G6, hard stop §9). |
| R4 | **Refit creep.** A "small tweak" to a threshold/base_rate to make a trajectory "look right" is calibration. | No-refit covenant is a hard stop (§9 HS-1). Zero parameter diffs; reviewer confirms parameter immutability across wired/ablated/reverted. |
| R5 | **Settlement leakage.** Using `<=` instead of `<`, or copying settlement labels into the series, violates T1S-1/T2S-1. | Strict `<` filter (mirror `deriveEvidenceT4`); unit tests assert no entry `≥ cutoff`; settlement stays settlement. (§9 HS-7) |
| R6 | **Claim inflation.** "Runtime now consumes T1/T2 evidence" misread as "T1/T2 runtime-sensitive" (rung) / "predictive uplift" / "calibration improved". | Claim ceiling §4; grep gate §9 HS-8; closeout carries the "no rung banked" posture and the four verbatim honest-framing sentences. |
| R7 | **Cross-regime comparison.** Any baseline on the cycle-003 corpus deltaed against Baseline A/B reads as "uplift". | No scoring/baseline in default scope (§6); if any number is computed it is labeled a new regime and cross-regime deltas are forbidden. |
| R8 | **GFZ-lag ambiguity (T2).** Regression-tier-ineligible events (`kp_gfz_observed == null`) — derive from provisional or skip? Undefined behavior risks non-determinism. | SDD decides explicitly (skip vs. provisional+marker); documented in loader; covered by a test. (§11 OQ-5) |
| R9 | **Determinism brittleness.** A hidden `Date.now()`/`Math.random()`/unstable sort surfaces in the new path. | Numeric `event_time_ms` sort (stable), injected clock, grep gate, replay-twice test (G5). |
| R10 | **Scope creep collapses honest-framing.** Adding T4 unblock, refit, or held-out evaluation alongside wiring conflates claims. | Single-mission discipline; non-goals §6 are binding; T4 explicitly out (§6). |

---

## 9. Hard Stops

The cycle **halts and reports honestly** (no over-claim, no workaround) if any of the following occurs:

- **HS-1 (no-refit):** wiring would require changing any runtime parameter / threshold / `base_rate` / formula. That is calibration/refit — out of scope; stop.
- **HS-2 (genuine-consumption):** the only achievable "proof" is metadata-only (gates not actually exercised). A hollow proof must not be dressed as consumption; stop and report.
- **HS-3 (frozen-replay drift):** the wiring changes cycle-002 frozen-corpus replay trajectory hashes (non-additive / not field-gated). Stop; redesign to additive.
- **HS-4 (no deterministic/reversible signal):** wired-vs-ablated hashes do not differ, or revert is not byte-identical. The wiring proof has failed; report the negative result honestly, do not manufacture a difference.
- **HS-5 (leakage):** any `pre_cutoff` entry `≥ cutoff`, or any settlement label inside a series entry. Stop (T1S-1/T2S-1 hard invariants).
- **HS-6 (frozen-artifact touch):** any edit to cycle-001/002/003 frozen artifacts, frozen manifests, `src/theatres/*` gate logic/params, `src/rlmf/certificates.js`, `scripts/corona-backtest.js` (cycle-001 entrypoint), or the cycle-002 entrypoint. Stop.
- **HS-7 (claim-gate):** the honest-framing grep gate returns a positive forbidden claim outside a negation/definition/ceiling context. Stop; reword.
- **HS-8 (external-data creep):** any T4-style external NOAA fetch / internet dependency enters cycle-004. Stop; that belongs to the separate T4 cycle.
- **HS-9 (rung creep):** any artifact banks a new rung (esp. "T1/T2 runtime-sensitive") without an explicit, separate operator authorization. Stop.

---

## 10. Acceptance Criteria

Cycle-004 is complete when **all** hold (machine-checkable where possible):

- **AC1 (Layer B):** for all 60 primary events, `evidence.pre_cutoff` is derived from the series by strict `< cutoff`, sorted by `event_time_ms`; a unit test asserts zero entries `≥ cutoff` and byte-identical derivation on repeat. Field-less inputs yield `pre_cutoff: []` without error.
- **AC2 (Layer A genuine consumption):** `t1-replay.js` / `t2-replay.js` invoke `processFlareClassGate` / `processGeomagneticStormGate` for each pre-cutoff bundle with an advancing injected clock; resulting `position_history` reflects the series (not base-rate-only); `evidence_bundles_consumed` lists the actual bundles. A test asserts `processX` is exercised.
- **AC3 (observable):** a wired-vs-ablated trajectory-hash comparison over the 60 events reports the differing-event set; the count is stated explicitly (no silent truncation). Acceptance threshold for "observable" is fixed in the SDD (e.g., ≥ N events) and reported.
- **AC4 (reversible & deterministic):** ablated trajectory hashes == reverted (pre-cycle-004) trajectory hashes == pre-cycle-004 baseline, for all 60 events; replay-twice is byte-identical within each of {wired, ablated, reverted}.
- **AC5 (frozen-corpus stability — hard):** replaying the **frozen cycle-002 corpus** through the modified modules yields trajectory hashes byte-identical to a captured pre-change baseline (proves the wiring is additive/field-gated; I5 preserved).
- **AC6 (invariants):** `scripts/corona-backtest.js` hash `17f6380b…` unchanged (I1); cycle-001 corpus_hash `b1caef3f…` and cycle-003 corpus_hash `7b6c5b48…` unchanged; RLMF cert `0.1.0` unchanged (I3); `package.json` `0.2.0` unchanged; zero new dependencies (I7); no parameter diffs (no-refit).
- **AC7 (tests green):** existing test suite stays green; new tests (T1/T2 pre-cutoff derivation, genuine-consumption, wired/ablated/revert determinism, frozen-corpus regression) are additive and pass.
- **AC8 (claim ceiling):** claim-grep gate (§ the forbidden-pattern list) returns only negations/definitions/ceiling statements; closeout carries the "no rung banked" posture and the four verbatim honest-framing sentences; no tag/release/bump.
- **AC9 (review + audit):** `/review-sprint` and `/audit-sprint` pass for each sprint; the cycle goes through `/run sprint-plan` (implement→review→audit cycle), never ad-hoc implementation.

---

## 11. Open Questions / Operator Decisions

> These should be resolved at operator review and/or during `/architect`. **OQ-1 and OQ-2 are the load-bearing ones.**

- **OQ-1 (rung posture — central):** Confirm cycle-004 **banks no new rung** — it proves wiring/consumption (deterministic, reversible) but deliberately does **not** assert "T1/T2 runtime-sensitive" as an earned Rung-2 badge, even though the ablation harness is sensitivity-shaped. *Recommendation: confirm the conservative no-rung posture (matches the brief and the forbidden-claim list); treat any future Rung-2 promotion as a separate gated decision.*
- **OQ-2 (genuine consumption vs. metadata-only):** Confirm the target is genuine consumption through `processX` moving `position_history` (W1), not metadata-only (W2). *Recommendation: W1 — it is the named cycle-003 deferral and the only honest "consumption" proof. W2 is rejected (R2/HS-2).*
- **OQ-3 (any scoring at all?):** Default is **no scoring** — trajectories + hashes only. Confirm no Brier/baseline/held-out evaluation is computed in cycle-004. *Recommendation: no scoring; keeps it unambiguously wiring-only and avoids cross-regime / calibration traps.*
- **OQ-4 (event scope):** Run the wiring/determinism proof over all 60 primary events, or the 42-event train split only (held-out 18 untouched)? *Recommendation: all 60 for the determinism/consumption demonstration (replay ≠ fit, so the seal is not violated by mere replay), with an explicit note that no fitting/evaluation occurs and the held-out seal is untouched. Operator to confirm.*
- **OQ-5 (T2 GFZ-lag):** For regression-tier-ineligible T2 events (`kp_gfz_observed == null`), should evidence be derived from SWPC provisional + marked, or skipped? *Architect to decide deterministically in SDD.*
- **OQ-6 (entrypoint strategy):** New cycle-004 entrypoint(s) (e.g., `scripts/corona-backtest-cycle-004-*.js`) plus additive edits to `t1/t2-replay.js` + `corpus-loader.js`, OR a different isolation scheme — such that frozen entrypoints stay byte-frozen and cycle-002 replays stay byte-identical. *Recommendation: new entrypoint + additive field-gated module edits + frozen-corpus regression test (AC5).*
- **OQ-7 (T1 mapping):** Resolve R1 — does the X-ray flux series map onto `processFlareClassGate`'s bundle contract without editing the gate? If a deterministic flux→signal derivation is required, specify it (parameter-free, physical thresholds only). Could T1 wiring be more limited than T2? *Architect to pin against `flare-gate.js`.*
- **OQ-8 (bundle payload shape):** Exact `evidence_bundles_consumed[]` element fields and the `bundle.payload` shape each `processX` expects (event_type mapping: T2 `kp_observations` → `kp_index`; T1 → TBD per OQ-7). *Architect to pin against the gates.*
- **OQ-9 (T4):** Confirm T4 unblock is **deferred** to a separate operator-gated cycle (recommended), rather than bundled into cycle-004 even as an optional Option-A′ side-sprint.

---

## 12. Dependency Map

**Cycle-004 consumes (read-only):**
- Cycle-003 corpus substrate: `xray_flux_observations[]` (T1), `kp_observations[]` (T2), strictly pre-cutoff; schemas under `grimoires/loa/calibration/corona/corpus-cycle-003/schema/`; corpus_hash `7b6c5b48…`.
- Cycle-002 replay seam: `loadCorpusWithCutoff`, PredictionTrajectory contract, canonical-JSON hashing, injected-clock determinism.
- Existing runtime gates (live path, unchanged): `processFlareClassGate` (`src/theatres/flare-gate.js`), `processGeomagneticStormGate` (`src/theatres/geomag-gate.js`).
- Reference pattern: `deriveEvidenceT4` (`corpus-loader.js`) + `t4-replay.js` process loop.

**Cycle-004 modifies (the named deferred Layer-A/B work, authorized by this PRD once approved):**
- `scripts/corona-backtest/ingestors/corpus-loader.js` — `deriveEvidenceT1` / `deriveEvidenceT2` (and possibly additive validation), additively + field-gated.
- `scripts/corona-backtest/replay/t1-replay.js`, `t2-replay.js` — call `processX` in a clock-advancing loop, additively + field-gated.
- New cycle-004 entrypoint(s) + new additive tests under `tests/`.
- New cycle-004 artifacts under `grimoires/loa/a2a/cycle-004/` (+ proof artifacts).

**Cycle-004 must preserve (frozen, hard):**
- I1 `scripts/corona-backtest.js` `17f6380b…`; I2 cycle-001 corpus_hash `b1caef3f…`; cycle-003 corpus_hash `7b6c5b48…`; I3 RLMF cert `0.1.0`; I5 replay-twice byte-identical (incl. cycle-002 frozen corpus); I6 no `Date.now()` in replay; I7 zero deps; no-refit covenant; held-out seal `f7a851…`; `src/theatres/*` gate logic/params; `package.json` `0.2.0`.

**Cycle-004 does NOT depend on:** external data, internet, NOAA archives, or DV-5 fetch authorization (this is what distinguishes it from the T4 mission).

---

## 13. Recommended Next Golden Path Step

1. **Operator reviews this PRD** — especially OQ-1 (no rung banked) and OQ-2 (genuine consumption), plus OQ-7 (T1 mapping) which may shape scope.
2. On approval → **`/architect`** to produce the cycle-004 SDD, resolving: T1 flux→signal mapping (OQ-7), bundle payload shapes (OQ-8), GFZ-lag handling (OQ-5), additive/field-gated wiring + entrypoint strategy (OQ-6), the frozen-corpus determinism-regression design (AC5), and the explicit ablation/revert proof harness.
3. → **`/sprint-plan`** (register sprints; create beads tasks).
4. → **`/run sprint-plan`** (implement → review → audit cycle with circuit breaker). Never ad-hoc implementation; never skip review/audit.
5. → cycle-004 closeout, keeping `cycle-004` off `main` until final operator-approved merge (cycle-003 pattern). No tag/release/bump unless a higher rung is separately earned and authorized (not expected).

---

*End of cycle-004 PRD (draft). No code, SDD, sprint artifact, tag, release, version bump, or `main` mutation was produced by this document.*
