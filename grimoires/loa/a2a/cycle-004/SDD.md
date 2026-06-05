# CORONA Cycle-004 — Software Design Document (SDD)

> **Status:** DRAFT — awaiting operator review. Architecture only.
> **Branch:** `cycle-004` (from `main` @ `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6`)
> **Date:** 2026-06-02 · **Phase:** `/architect`. Next after approval: `/sprint-plan`.
> **Companion:** [PRD.md](PRD.md), [PLAN-AND-ANALYZE-REPORT.md](PLAN-AND-ANALYZE-REPORT.md)
> **This document creates no code, no sprint artifacts, no commit. It mutates no source, test, runtime, loader, replay, prior-cycle artifact, README, BUTTERFREEZONE, package.json, tag, or release.**

---

## 1. Executive Summary

Cycle-004 wires CORONA's **T2 (Geomagnetic Storm Gate)** replay + loader so the runtime deterministically **consumes** the pre-cutoff `kp_observations[]` time-series that cycle-003 built, and proves that consumption is real (wired ≠ ablated), deterministic (replay-twice byte-identical), and reversible (ablated == pre-cycle-004 baseline). This is a **wiring / evidence-consumption proof only** — not calibration, not scoring, not a rung advancement.

The load-bearing architecture question (**OQ-7**) was resolved against the *actual* gate contracts:

- **T2 is WIRED.** `kp_observations[]` are exactly the `kp_index` readings `processGeomagneticStormGate` consumes. The mapping is type-exact and uses corpus-native values plus the runtime's existing uncertainty model. One field (`payload.quality.composite`) has no corpus source and is set to a documented deterministic constant — the single honesty-boundary item flagged for operator confirmation (§16).
- **T1 is BLOCKED (honestly).** `xray_flux_observations[]` are raw 1-minute flux samples; `processFlareClassGate` consumes discrete classified `solar_flare` *events*. Bridging the two requires manufacturing flare-event semantics from flux samples (forbidden) or editing the gate (forbidden). T1 is left exactly as cycle-003 shipped it and serves as a **negative control** in the proof. A future, separately-gated cycle can add a native `xray_flux` evidence type to the gate or build a pre-cutoff flare-*event* corpus.

Per the operator's binding requirement, **T2 success does not depend on T1** — they are architected as independent theatre boundaries (§4).

---

## 2. Mission, Scope, Claim Ceiling

### 2.1 Mission
Wire T2 Layer-A (replay) + Layer-B (loader) to deterministically consume cycle-003's pre-cutoff `kp_observations[]` through the existing `processGeomagneticStormGate`, and produce a deterministic, ablation-confirmed, revert-clean wiring proof. T1 is blocked honestly.

### 2.2 In scope
- Additive, field-presence-gated, **opt-in (default-off)** edits to `scripts/corona-backtest/replay/t2-replay.js` (Layer A) and `scripts/corona-backtest/ingestors/corpus-loader.js` `deriveEvidenceT2` (Layer B).
- A new cycle-004 entrypoint `scripts/corona-backtest-cycle-004-evidence-wiring.js` (no scoring).
- New additive tests under `tests/`.
- Cycle-004 artifacts + proof outputs under `grimoires/loa/a2a/cycle-004/`.

### 2.3 Out of scope (non-goals)
- T1 gate wiring (blocked — §5); any edit to `src/theatres/flare-gate.js` or `src/theatres/geomag-gate.js` (gate logic/params frozen — the gates are *called*, never modified).
- Any scoring (no Brier, no baseline, no held-out evaluation — OQ-3). Trajectories + hashes only.
- Any runtime parameter / threshold / `base_rate` / formula change (no-refit covenant).
- T4 unblock (deferred to a separate operator-gated cycle — OQ-9).
- Any release, tag, version bump; `package.json` stays `0.2.0`.
- Any mutation of cycle-001/002/003 frozen artifacts, frozen manifests, RLMF cert, or the held-out seal.

### 2.4 Claim ceiling (preserved)
Cycle-002's historical ceiling stands unweakened: **CORONA demonstrated T4 runtime sensitivity only.** Cycle-001's posture stands: "calibration-attempted, not improved." Cycle-004 banks **no new rung**. See §15 (claim language) for the exact allowed posture and the forbidden-claim prohibitions.

---

## 3. System Architecture

### 3.1 Where cycle-004 sits in the replay seam
The cycle-002 replay seam is unchanged in shape:

```
corpus-cycle-003/ (T1/T2 records w/ pre-cutoff series)
        │
        ▼
loadCorpusWithCutoff()  ──►  events{}, cutoffs{}, evidence{}      ← Layer B (deriveEvidenceT2 additive)
        │
        ▼
createReplayContext()   ──►  frozen ctx (replay_clock_seed = kp_window_start)   [unchanged]
        │
        ▼
replay_T2_event(event, ctx, { wireEvidence })  ──►  PredictionTrajectory       ← Layer A (opt-in consumption)
        │                         │
        │                         └─ builds kp_index bundles, calls processGeomagneticStormGate per bundle
        ▼
computeTrajectoryHash()  [unchanged]  ──►  trajectory.meta.trajectory_hash
        │
        ▼
cycle-004 entrypoint  ──►  wired / ablated / baseline hash sets + proof report   ← new, no scoring
```

### 3.2 Determinism harness (reused, unchanged)
- Injected clock: `replay_T2_event` advances `frameTimeMs` per bundle and passes `{ now: () => frameTimeMs }`. No `Date.now()` on the replay path (`context.js` fail-closed; `hashes.js`/`canonical-json.js` reject non-finite/undefined → any accidental NaN throws rather than silently differing).
- Canonical JSON (RFC 8785 spirit) + SHA-256 trajectory hash (`hashes.js:28`, `canonical-json.js`).
- Replay-twice byte-identical is the Rung-1 binding invariant (I5).

### 3.3 Isolation strategy — the `lambdaScalar` precedent (resolves OQ-6)
`t4-replay.js` already established the exact isolation pattern cycle-004 needs: an **options-bag flag that defaults to the pre-existing behavior**, which the cycle-002 entrypoint never passes (`t4-replay.js:62-73, 144`; the cycle-002 entrypoint calls `replay_T4_event(event, ctx)` with no options at `corona-backtest-cycle-002.js:188,266`).

Cycle-004 mirrors this for T2: evidence consumption is an **opt-in option `wireEvidence` (default `false`)**. Consequences:
- The cycle-002 entrypoint calls `replay_T2_event(event, ctx)` with no option → **default path = exact cycle-003 behavior** → cycle-002 replays are byte-identical **by construction** (not merely by corpus-field absence). This is the strongest form of I5 preservation.
- Field-presence gating (`Array.isArray(event.kp_observations)`) is an **additional** guard: even with `wireEvidence: true`, an event lacking the series yields zero bundles → baseline trajectory.
- The cycle-004 entrypoint produces the three proof states by toggling this one option (§9).

---

## 4. Theatre-Level Success Boundaries (operator requirement)

T1 and T2 are independent. The cycle succeeds on T2 regardless of T1.

| Theatre | Cycle-004 outcome | Consumption | Role in proof |
|---------|-------------------|-------------|---------------|
| **T2** | **WIRED** | Genuine: `kp_observations[]` → `kp_index` bundles → `processGeomagneticStormGate` → real `position_history` updates | **Primary deliverable**: wired ≠ ablated; ablated == baseline; replay-twice identical |
| **T1** | **BLOCKED** | None (left as cycle-003 shipped: `createFlareClassGate` once, no `processX`) | **Negative control**: wired == ablated == baseline (proves no T1 consumption, by design) |

**Acceptance is evaluated per theatre.** A failed/narrowed T1 cannot block T2. If, during implementation, T2 itself proves unwireable honestly (it should not, per §6), that is a hard stop (§14), not a silent narrowing.

---

## 5. OQ-7 Resolution — T1 mapping (the load-bearing decision)

### 5.1 The gate contract (verified against `src/theatres/flare-gate.js`)
`processFlareClassGate(theatre, bundle, { now })` (`flare-gate.js:77-148`):
- Ignores everything unless `bundle.payload.event_type === 'solar_flare'` (`:87`).
- **Resolution path** (`:95-114`): if `flare.rank >= threshold_rank` **and** `bundle.evidence_class ∈ {ground_truth, provisional_mature}` → resolve YES, `current_position = 1.0`. Reads `flare.rank`, `flare.class_string`, `evidence_class`.
- **Provisional path** (`:117-145`): reads `flareThresholdProbability(flare.uncertainty, threshold_class)` and `payload.quality.composite` (`:118-119`). `flareThresholdProbability` (`uncertainty.js:102`) reads `uncertainty.value` and `uncertainty.sigma`.

### 5.2 The corpus reality (verified against the schema + a record)
`xray_flux_observations[]` element (`xray-flux-observations.schema.json`; `T1-2024-05-14-X8p7.json:15-21`): `{ time, long_channel_wm2, energy_channel, satellite }`. **Raw 1-minute flux samples.** No `rank`, no `class_string`, no `uncertainty`, no `quality`, no flare-event identity.

### 5.3 What a mapping would require — and why each path is dishonest
A physical flux→class map **does** exist (`swpc.js:classifyFlux` `:72-81`, `flareRank` `:100-106`; GOES decades A=1e-8 … X=1e-4 — physical definitions, not fitted). But routing flux samples through the gate still fails honesty:

1. **Type mismatch (the core).** A `solar_flare` bundle asserts "a flare of class/rank R was detected." A 1-minute flux sample is a *measurement*, not a detected flare. Emitting one `solar_flare` event per flux minute **manufactures flare detections the corpus never asserts** — "inventing semantics" (forbidden).
2. **Resolution path → trivial + leakage-adjacent.** In `T1-2024-05-14-X8p7`, pre-cutoff flux rises through M1.0 (1e-5) and X1.0 (1e-4) well before `flare_peak_time − 1 ms`. Mapping those samples as `evidence_class='ground_truth'` resolves the gate to `1.0` pre-cutoff for essentially every (M+/X) corpus event — directly observing the in-progress flare. Asserting a single flux sample is "ground truth" of a confirmed flare is an unsupported semantic claim, and the trivial resolution would invite misreading as predictive skill.
3. **Provisional path → invents fields.** Avoiding resolution by tagging `evidence_class='provisional'` requires `payload.quality.composite` (a data-quality score with **no corpus source**) and a `flare.uncertainty` object. The flux value alone cannot honestly supply a per-sample quality score; supplying one is "inventing a mapping merely to make hashes differ."

### 5.4 Decision
**T1 is BLOCKED for genuine gate consumption in cycle-004** (operator-offered outcome #2). `deriveEvidenceT1` and `replay_T1_event` are **left unchanged** (T1 trajectories remain prior-only, `pre_cutoff: []`, `evidence_bundles_consumed: []`). T1 participates in the proof only as a negative control (wired == ablated == baseline).

A half-measure — deriving `evidence.pre_cutoff` for T1 in the loader (Layer B) but not consuming it through the gate — is **explicitly rejected**: it would be the metadata-only "hollow proof" OQ-2 forbids. T1 stays untouched at both layers.

### 5.5 Honest future-unblock path (informational, not authorized here)
A future separately-gated cycle could either (a) add a native `xray_flux` evidence type to `processFlareClassGate` that consumes flux samples and derives an in-gate provisional signal (a runtime change → its own SDD + gate-edit authorization), or (b) build a pre-cutoff **flare-event** corpus (begin/peak/end + classification with provenance) that matches the existing `solar_flare` bundle contract without invention.

---

## 6. T2 Design Detail

### 6.1 Why T2 is honestly wirable
`processGeomagneticStormGate` dispatches `payload.event_type === 'kp_index'` → `processKpObservation` (`geomag-gate.js:96-97, 121-185`), which consumes:
- `payload.kp.value` (`:123`) ← **corpus-native** (`obs.kp`).
- `payload.event_time` (`:130`) ← **corpus-native** (`obs.time` → ms epoch).
- `payload.kp.uncertainty` (`:124`, used by `kpThresholdProbability` `:156`→`uncertainty.js:164`, needs `.value`/`.sigma`) ← derived via **existing runtime code** `buildKpUncertainty({ kp, source })` (`uncertainty.js:128-159`), `source` from `obs.provenance`.
- `bundle.evidence_class` (`:137`) ← set to `'provisional'` (see §6.3).
- `payload.quality.composite` (`:157`) ← **the one field with no corpus source** (§6.4).

`kp_observations[]` *are* Kp index readings (`kp-observations.schema.json`; `T2-2024-05-11-Kp9.json:14-...`). The mapping is type-exact; nothing is manufactured except the quality weight.

### 6.2 Cutoff & windowing (mirror `deriveEvidenceT4`)
Filter `kp_observations[]` to **strict `< cutoff.time_ms`** where `cutoff = deriveCutoffT2(event)` = `kp_window_end` (`corpus-loader.js:465-469`). Sort ascending by numeric `event_time_ms`. This mirrors `deriveEvidenceT4` (`corpus-loader.js:527-542`) and `t4-replay.js:110-131` exactly. (Note: the cycle-003 series may include lead-in readings before `kp_window_start`/gate-open; like T4, the only filter is `< cutoff` — pre-gate-open evidence is admissible and harmless.)

### 6.3 `evidence_class = 'provisional'` (deliberate)
Using `'provisional'` (not `'ground_truth'`) routes every bundle through the **gradual** provisional update path (`geomag-gate.js:156-184`) and **never resolves** the gate (resolution requires `ground_truth`/`provisional_mature`, `:137`). This is honest — a pre-cutoff observation is provisional evidence, not a final settlement — and it yields the "real intermediate updates" `position_history` that OQ-2 requires, rather than a trivial jump to `1.0`. Even a high pre-cutoff Kp (≥ threshold) produces a strong-but-non-resolving shift (`:160-162`).

### 6.4 OQ-8 — pinned T2 bundle payload
Constructed by `replay_T2_event` for each pre-cutoff observation (illustrative shape; not implemented here):

```
{
  bundle_id: `replay-t2-kp-${event_id}-${obs.time}`,
  evidence_class: 'provisional',
  payload: {
    event_type: 'kp_index',
    event_time: <ms epoch of obs.time>,        // numeric, deterministic
    kp: {
      value: obs.kp,                            // corpus-native
      uncertainty: buildKpUncertainty({         // existing runtime model
        kp: obs.kp,
        source: obs.provenance === 'gfz_definitive' ? 'GFZ' : 'SWPC'
      })
    },
    quality: { composite: <CONSTRUCTED_CONSTANT> }   // §6.5 — operator-confirm
  }
}
```
Every field read by `processKpObservation` is present; nothing else is read. `index`/`satellite` from the corpus are not consumed by the gate and are omitted from the bundle (kept in the loader's `evidence.pre_cutoff` record for completeness).

### 6.5 The one constructed field — `quality.composite` (honesty boundary → §16 operator decision)
`quality.composite` scales only the **near-threshold** provisional nudge (`geomag-gate.js:163-165`); the dominant behavior (strong shift on/above threshold `:160-162`, decay below `:166-169`, resolution never) is driven by the **real** Kp value. It has no corpus source. **Recommended:** a single documented deterministic constant `composite = 1.0` ("archival observation, full data-quality weight"), applied uniformly — deterministic, parameter-free, not fitted-to-outcome, not a threshold. This is the single item the SDD will not unilaterally finalize; see §16 OD-1 for the recommendation and the zero-construction fallback (resolution-only mode).

### 6.6 OQ-5 — GFZ-lag handling
Because cycle-004 does **no scoring** (OQ-3), regression-tier eligibility (which gates *scoring*, not *evidence*) is irrelevant to a consumption proof. Resolution:
- **Derive evidence from all strictly-pre-cutoff `kp_observations` regardless of the event's `regression_tier_eligible` flag or `kp_gfz_observed == null`.** No event is skipped for GFZ-lag reasons.
- Per-entry `provenance` flows into `buildKpUncertainty`'s `source` (GFZ → σ 0.33; SWPC → σ 0.67, `uncertainty.js:134`), so provisional readings carry honestly-wider uncertainty. No entry is dropped for provenance.
- This is deterministic and documented; a test covers a `kp_gfz_observed == null` event (evidence still derived).

---

## 7. Layer B Design — `corpus-loader.js`

Additive, field-gated change to `deriveEvidenceT2` (`corpus-loader.js:509-517`) only. `deriveEvidenceT1` is **unchanged** (T1 blocked).

- Replace the hardcoded `pre_cutoff: []` with: if `Array.isArray(event.kp_observations)`, filter strict `< cutoff.time_ms`, sort by `event_time_ms`, map to `{ event_time_ms, time, kp, index, provenance, satellite }` (mirror `deriveEvidenceT4`'s record shape, `:534-540`). Else `pre_cutoff: []` (field-less frozen corpus unchanged). `settlement` block unchanged.
- `deriveEvidenceT2` signature gains the `cutoff` argument (it currently takes only `event`); the dispatch in `loadCorpusWithCutoff` already calls `evFn(event, cutoff)` (`:608`), so this is signature-compatible — `deriveEvidenceT4` already uses `(event, cutoff)`.
- **Shared helper** (DRY): extract the strict-`<`-cutoff + numeric-sort filter into one pure function used by both Layer B (record list) and Layer A (bundle construction), so the two derivations cannot diverge. A test asserts Layer-A bundle times == Layer-B `pre_cutoff` times for every event.
- Re-export the helper via the existing `_`-prefixed test-export block (`:616-630`) for unit-test access.

**Determinism:** `parseIsoMsLocal` (`:453-458`) is `Date.now()`-free; numeric `event_time_ms` sort is stable; strict `<` prevents settlement leakage. Field-less inputs → `[]`, no throw.

---

## 8. Layer A Design — `t2-replay.js`

Additive, opt-in (`wireEvidence`, default `false`) change to `replay_T2_event` (`t2-replay.js:53-145`). `t1-replay.js` is **unchanged**.

- Add an options bag: `replay_T2_event(corpus_event, ctx, options = {})` with `const { wireEvidence = false } = options;` (mirrors `t4-replay.js:71-73`).
- When `wireEvidence === true` **and** `Array.isArray(corpus_event.kp_observations)`: build the pinned `kp_index` bundles (§6.4) via the shared filter helper (§7), then **after** `createGeomagneticStormGate` (`:80-86`) loop in time order:
  ```
  let frameTimeMs = gateOpenMs;
  let live = theatre;
  for (const bundle of kpBundles) {
    frameTimeMs = bundle.payload.event_time;          // advance injected clock
    live = processGeomagneticStormGate(live, bundle, { now });
  }
  ```
  Then build `position_history_at_cutoff` from `live.position_history` (existing filter+rename, `:89-96`), set `current_position_at_cutoff = live.current_position`, and `evidence_bundles_consumed = kpBundles.map(b => b.bundle_id)`.
- When `wireEvidence` is falsy or the field is absent: **exact current behavior** (create once, no process loop, `evidence_bundles_consumed: []`). Byte-identical to cycle-003.
- Import `processGeomagneticStormGate` from `../../../src/theatres/geomag-gate.js` and `buildKpUncertainty` from `../../../src/processor/uncertainty.js` (both existing runtime code; **no new dependency**, `package.json` `dependencies: {}` preserved).
- `corpus_event_hash` (`:110`, strips `_file`/`_derived`) is unaffected — the corpus record is unchanged; only the trajectory's `position_history` / `evidence_bundles_consumed` differ between wired and baseline. `outcome` (`:98-106`) is **unchanged** (still derived from settlement labels) — wiring changes the *trajectory*, never the scored outcome label.

**Genuine consumption (OQ-2) is structural:** `position_history` length and values change because `processGeomagneticStormGate` actually ran. A test asserts wired `position_history.length > 1` (vs baseline length 1) for events with pre-cutoff observations.

---

## 9. Entry Point & Proof Harness (OQ-6, Section G)

### 9.1 New entrypoint
`scripts/corona-backtest-cycle-004-evidence-wiring.js` — modeled structurally on `corona-backtest-cycle-002.js` (arg parsing, `loadCorpusWithCutoff`, per-theatre dispatch, frozen-output-dir guard) **with all scoring removed**. It imports the unchanged `replay_T1_event` and the modified `replay_T2_event`; it does **not** import or invoke `scripts/corona-backtest.js` (cycle-001, byte-frozen, I1) and does not write cycle-001/002 output dirs (reuse the `FROZEN_CYCLE001_OUTPUT_DIRS` guard, extend to cycle-002 dirs). Default corpus = the **cycle-003** corpus tree.

### 9.2 The three states (one option toggles them)
| State | How produced | Expectation |
|-------|--------------|-------------|
| **WIRED** | `replay_T2_event(event, ctx, { wireEvidence: true })` | T2 trajectory consumes evidence |
| **ABLATED** | `replay_T2_event(event, ctx, { wireEvidence: false })` | identical to pre-cycle-004 behavior |
| **BASELINE (pre-cycle-004)** | hashes captured at cycle-003 HEAD from the **unmodified** `replay_T2_event`, committed as a proof fixture (`grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json`) | the reference |

Because ABLATED uses the default (off) path, **ablated output is the pre-cycle-004 baseline by construction**; the committed baseline fixture is the independent cross-check that the default path did not drift.

### 9.3 Proof gates (Section G items 1-7)
1. **Wired replay** — produce wired hashes for all 60 T1/T2 events.
2. **Ablated replay** — produce ablated hashes.
3. **Baseline comparison** — `ablated == baseline-hashes.json` for all events (byte identity). *(Section G item 6 = item 3 here.)*
4. **Replay-twice** — run each state twice; assert byte-identical within each state (I5).
5. **Wired-vs-ablated diff count** — count and **list** T2 events where `wired ≠ ablated` (report the count explicitly; no silent truncation). Expect: all T2 events with ≥1 pre-cutoff observation differ; all T1 events do **not** differ (negative control).
6. **Identity** — `ablated == baseline` (= gate 3); plus `T1 wired == T1 ablated == T1 baseline`.
7. **Frozen cycle-002 corpus stability** — run `corona-backtest-cycle-002.js` (or its `dispatchCycle002Replay` export) against the **frozen** corpus before vs. after the code change; assert byte-identical trajectory hashes for T1/T2/T4. This is the I5 regression that proves the additive/opt-in change did not perturb cycle-002.

**No scoring. No Brier. No baseline-vs-baseline delta. No skill claim.** Outputs are hash tables + a `PROOF-SUMMARY.md` under `grimoires/loa/a2a/cycle-004/proof/`.

---

## 10. Data Architecture

- **Inputs (read-only):** cycle-003 corpus (`corpus-cycle-003/primary/T{1,2}-*/*.json`); frozen cycle-001/002 corpus (for the I5 regression). No corpus file is modified; corpus hashes unchanged.
- **Trajectory shape:** unchanged PredictionTrajectory (CONTRACT §3). The wired T2 trajectory differs from baseline only in `position_history_at_cutoff` (longer, real updates), `current_position_at_cutoff`, `evidence_bundles_consumed`, and the derived `meta.trajectory_hash`. `schema_version`, `theatre_id`, `cutoff`, `gate_params`, `outcome` unchanged.
- **Proof artifacts:** `grimoires/loa/a2a/cycle-004/proof/{baseline-hashes.json, wired-hashes.json, ablated-hashes.json, PROOF-SUMMARY.md}` (64-hex SHA-256 per event; counts; identity assertions).

---

## 11. Tests (Section H)

All additive, under `tests/`, runner `node --test` (no framework change). Proposed files:

| Test | Asserts |
|------|---------|
| `corpus-loader-t2-precutoff-test.js` | Layer-B `deriveEvidenceT2` derives `pre_cutoff` from `kp_observations[]`; **strict `<` cutoff (zero entries `>= cutoff`)**; ascending `event_time_ms` sort; field-less event → `pre_cutoff: []` (no throw). |
| `corpus-loader-t2-gfz-lag-test.js` | A `kp_gfz_observed == null` event still derives evidence from its pre-cutoff observations (OQ-5). |
| `replay-t2-genuine-consumption-test.js` | `wireEvidence:true` invokes `processGeomagneticStormGate` (position_history length > 1; `evidence_bundles_consumed` non-empty); `wireEvidence:false` == baseline (length 1, `[]`). |
| `replay-t2-determinism-wired-test.js` | Replay-twice byte-identical trajectory hash in each of wired / ablated. |
| `replay-t2-wired-vs-ablated-test.js` | Wired ≠ ablated for events with pre-cutoff observations; the diff count is reported. |
| `replay-t2-ablated-equals-baseline-test.js` | Ablated hashes == committed baseline fixture for all events. |
| `replay-t1-negative-control-test.js` | T1 wired == ablated == baseline (no consumption; block verified). |
| `cycle-002-frozen-corpus-regression-test.js` | Cycle-002 dispatch over the **frozen** corpus is byte-identical before/after (I5). |
| `layer-ab-agreement-test.js` | Layer-A bundle times == Layer-B `pre_cutoff` times per event (shared-helper consistency). |
| `no-walltime-no-random-test.js` | grep new files for `Date.now(` / `Math.random(` → none. |
| `no-param-diff-test.js` | `CYCLE_002_T2_GATE_PARAMS`, gate `base_rate`, thresholds unchanged (no-refit). |
| `claim-grep-gate-test.js` | Forbidden-claim patterns appear in cycle-004 artifacts only as negations/definitions (§15). |

The existing suite (per `package.json` `scripts.test`) stays green; new tests are added to the runner list (a `package.json` `scripts.test` line append is the *only* `package.json` change considered, and it is additive and version-neutral — **OD-2** confirms whether the operator permits editing the test-runner line, since the PRD listed `package.json` as do-not-modify).

---

## 12. Frozen Invariants (Section I)

| ID | Invariant | How preserved / verified |
|----|-----------|--------------------------|
| I1 | `scripts/corona-backtest.js` sha256 `17f6380b…1730f1` | File never imported/touched; cycle-004 entrypoint refuses cycle-001 output dirs. |
| I2 | cycle-001 corpus_hash `b1caef3f…11bb1` | Frozen corpus never written. |
| — | cycle-003 corpus_hash `7b6c5b48…d5003` | cycle-003 records never modified (read-only consumption). |
| — | cycle-003 held-out seal `f7a851…a5ea` | Not read for fitting/evaluation; no scoring at all; seal file untouched. |
| I3 | RLMF cert `src/rlmf/certificates.js` `0.1.0` | Not imported by the backtest seam; untouched. |
| — | `package.json` version `0.2.0` | No version field change (see OD-2 re: the test-runner line). |
| I7 | `dependencies: {}` | Only existing intra-repo modules imported (`geomag-gate.js`, `uncertainty.js`). |
| I5 | replay-twice byte-identical, incl. frozen cycle-002 corpus | §9.3 gates 4 & 7. |
| I6 | no `Date.now()` on replay path | Injected clock only; grep test (§11). |
| — | no runtime parameter / gate logic / threshold change | No edit to `src/theatres/*`; gate params constants unchanged; no-param-diff test. |
| — | no prior-cycle artifact / frozen manifest mutation | Cycle-004 writes only under `grimoires/loa/a2a/cycle-004/` + new `scripts/.../t2-replay.js`/`corpus-loader.js` (the authorized Layer-A/B files) + new entrypoint + new tests. |
| — | no tag / release / version bump | None performed. |

---

## 13. Component Design Summary

| Component | File | Change |
|-----------|------|--------|
| Layer B | `scripts/corona-backtest/ingestors/corpus-loader.js` | `deriveEvidenceT2` derives `pre_cutoff` (field-gated, strict `<`, sorted); shared filter helper + test re-export. **Additive.** |
| Layer A | `scripts/corona-backtest/replay/t2-replay.js` | `replay_T2_event` gains `{ wireEvidence }` (default off); builds `kp_index` bundles + processes them. **Additive, opt-in.** |
| Entrypoint | `scripts/corona-backtest-cycle-004-evidence-wiring.js` | **New.** No scoring; emits proof hash sets. |
| Tests | `tests/*` (§11) | **New, additive.** |
| Gates | `src/theatres/{geomag-gate,flare-gate}.js` | **Unchanged** (called, not edited). |
| T1 replay/loader | `t1-replay.js`, `deriveEvidenceT1` | **Unchanged** (blocked). |

---

## 14. Hard Stops

The cycle **halts and reports honestly** (no over-claim, no workaround) if:

- **HS-1 (no-refit):** wiring appears to require any runtime parameter / threshold / `base_rate` / formula change. Stop.
- **HS-2 (gate edit):** T2 cannot be wired without editing `src/theatres/geomag-gate.js`. Stop (it can be wired without — §6; if disproven, stop).
- **HS-3 (hollow proof):** the only achievable T2 "consumption" is metadata-only (gate not actually exercised; `position_history` unchanged). Stop.
- **HS-4 (frozen-replay drift):** the change perturbs cycle-002 frozen-corpus replay hashes (§9.3 gate 7 fails). Stop; redesign to default-off/additive.
- **HS-5 (leakage):** any T2 `pre_cutoff` entry `>= cutoff`, or any settlement label inside a series entry. Stop.
- **HS-6 (no signal / no revert):** wired == ablated for all T2 events (no consumption observable), or ablated ≠ baseline. Report the negative result honestly; do not manufacture a difference.
- **HS-7 (claim-gate):** a forbidden-claim pattern appears as a positive claim. Stop; reword.
- **HS-8 (frozen-artifact touch):** any edit to `src/theatres/*` logic/params, `src/rlmf/certificates.js`, `scripts/corona-backtest.js`, frozen manifests, cycle-001/002/003 records, or the held-out seal. Stop.
- **HS-9 (T1 reanimation):** any attempt to wire T1 by manufacturing flare-event semantics from flux samples. Stop (T1 is blocked; §5).
- **HS-10 (scope creep):** any scoring/Brier/baseline-delta, T4 external fetch, or rung-banking enters cycle-004. Stop.

---

## 15. Claim Language (Section J)

**Allowed posture (verbatim, for implement/review/audit/closeout):**

> "Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."

Cycle-004's accurate, theatre-qualified result statement: *"T2 runtime evidence-consumption wiring is implemented and demonstrated deterministically (wired ≠ ablated, ablated == byte-identical baseline, replay-twice identical); T1 evidence-consumption wiring is honestly blocked (raw flux samples cannot map to the flare-event gate contract without inventing semantics) and serves as a negative control."*

**Forbidden as positive claims** (allowed only as negations / definitions / historical-ceiling statements; enforced by the claim-grep gate, HS-7): "calibration improved"; "forecasting accuracy"; "predictive uplift"; "empirical performance improvement"; "L2 publish-ready"; "T1/T2 runtime-sensitive"; "T1/T2 calibration-improved"; "new rung earned"; "Baseline A vs Baseline B uplift"; "new-corpus baseline uplift".

---

## 16. Remaining Operator Decisions (before `/sprint-plan`)

- **OD-1 — `quality.composite` construction (the one honesty boundary).** T2's gradual wiring needs a `quality.composite` value with no corpus source (§6.5). **Recommendation:** a single documented deterministic constant `1.0` (full data quality for archival observations), applied uniformly — deterministic, parameter-free, not fitted, affecting only the near-threshold nudge magnitude. **Alternative (zero-construction):** a resolution-only mode (feed only threshold-crossing GFZ-definitive observations as `ground_truth`) that needs no constructed numeric field but yields a thinner proof (single jump to `1.0`, only for events with a pre-cutoff crossing, and discards sub-threshold lead-in). Recommended: the constant-`1.0` provisional mode. Operator to confirm.
- **OD-2 — `package.json` test-runner line.** New tests must be registered. The PRD listed `package.json` as do-not-modify. **Recommendation:** permit the single additive edit to the `scripts.test` line (no `version`/`dependencies` change), OR run cycle-004 tests via an explicit `node --test tests/replay-t2-*.js …` invocation documented in the proof report (zero `package.json` change). Operator to choose.
- **OD-3 — confirm T1 BLOCKED.** Confirm the §5 determination (T1 blocked, negative control) rather than forcing a manufactured T1 mapping.
- **OD-4 — baseline fixture capture.** Confirm capturing `proof/baseline-hashes.json` at cycle-003 HEAD (pre-change) via the unmodified replay, committed as the proof's reference (§9.2).

---

## 17. Report Summary (for this `/architect` invocation)

- **OQ-7 (T1):** BLOCKED honestly — raw flux samples ≠ flare-event gate contract; bridging requires inventing semantics or editing the gate. T1 = negative control.
- **OQ-5 (T2 GFZ-lag):** derive evidence from all strictly-pre-cutoff observations regardless of regression-tier eligibility (no scoring ⇒ eligibility moot); provenance flows into uncertainty σ; no event skipped.
- **OQ-6 (isolation):** new cycle-004 entrypoint + opt-in `wireEvidence` (default off, the `lambdaScalar` precedent) + field-gating ⇒ cycle-002 byte-identical by construction; frozen-corpus regression test.
- **OQ-8 (payloads):** T2 `kp_index` bundle pinned (§6.4) against the real `processKpObservation` contract; T1 N/A (blocked).
- **T1:** BLOCKED. **T2:** cleanly architected and independent of T1.
- **Determinism/ablation/revert:** §9 — opt-in toggle yields wired/ablated; ablated == committed baseline; replay-twice + frozen-corpus regression.
- **Frozen invariants:** §12 — all preserved; verification mechanisms specified.
- **Claim posture:** §15 — allowed posture verbatim; forbidden list enforced by grep gate.
- **Hard stops:** §14.
- **Open operator decisions:** §16 (OD-1 quality.composite; OD-2 package.json test line; OD-3 confirm T1 block; OD-4 baseline fixture).

---

*End of cycle-004 SDD (draft). No code, sprint artifact, commit, tag, release, version bump, or prior-cycle mutation was produced by this document.*
