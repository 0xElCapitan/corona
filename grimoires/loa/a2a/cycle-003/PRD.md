# CORONA cycle-003 — Product Requirements Document

**Status**: cycle-003 PRD (planning artifact only). NOT a charter, NOT an SDD, NOT a sprint plan, NOT an implementation report. Implementation is forbidden until a downstream **SDD and sprint plan** are ratified; a separate charter is **optional** and created only if the operator explicitly approves one (the preferred Golden Path is PRD → SDD → sprint plan).
**Authored**: 2026-05-28
**Cycle**: cycle-003 (cycle-002 closed at **Rung 2, T4 runtime-sensitive only**; published version **v0.2.0**; HEAD/`origin/main` = `2e5dc1dd0f4a700fca961d0d61ec8520e49e083f`).
**Mission (one line)**: *Build the historical-corpus and held-out-evaluation substrate that a future cycle would need — without refitting, without claiming improvement.*

> This PRD is grounded in a read-only pass over the live repo at HEAD `2e5dc1d` (branch `main`, clean tree, confirmed on `origin/main`). It distills the binding cycle-002 closeout posture and proposes cycle-003 **scope and requirements only**. Where this PRD and any frozen cycle-001/cycle-002 source appear to disagree, the frozen source is authoritative. The root cycle-001 PRD at [grimoires/loa/prd.md](../../prd.md) is FROZEN historical and is NOT a target of this document. Cycle-003 writes only inside `grimoires/loa/a2a/cycle-003/`.

---

## 0. Grounding pass (read-only, performed before drafting)

| Check | Result |
|---|---|
| Branch / tree / HEAD | `main`, clean working tree, HEAD = `2e5dc1dd0f4a700fca961d0d61ec8520e49e083f`. |
| Cycle-002 closed on `origin/main` at target commit | ✓ `git rev-parse origin/main` = `2e5dc1dd0f4a700fca961d0d61ec8520e49e083f`; `origin/main` and `origin/HEAD` contain it. |
| Cycle-002 closeout chain | [CLOSEOUT.md](../cycle-002/sprint-06/CLOSEOUT.md) (Rung 2, T4 only), [engineer-feedback.md](../cycle-002/sprint-06/engineer-feedback.md) (APPROVED), [auditor-sprint-feedback.md](../cycle-002/sprint-06/auditor-sprint-feedback.md) (APPROVED), [COMPLETED](../cycle-002/sprint-06/COMPLETED). |
| Cycle-002 planning authorities | [PRD.md](../cycle-002/PRD.md), [SDD.md](../cycle-002/SDD.md), [CYCLE-002-SPRINT-PLAN.md](../cycle-002/CYCLE-002-SPRINT-PLAN.md), [SPRINT-LEDGER.md](../cycle-002/SPRINT-LEDGER.md). |
| Current corpus shape (read on disk) | **T1** events = point labels only (`flare_class_observed`, `flare_peak_time`, `flare_peak_xray_flux`); **T2** events = point labels only (`kp_swpc_observed`, `kp_gfz_observed`, window); **T4** events = `proton_flux_observations[]` (a real timestamped series). 5 events/theatre. |
| Replay / scoring / ingestor seams (read on disk) | `replay/{canonical-json,hashes,context,t1-replay,t2-replay,t4-replay}.js` (no T3/T5 replay); `scoring/{t1,t2,t4}-bucket-brier.js` + `t1-binary-brier.js` + `t2-binary-brier.js` + `t3-timing-error.js` + `t5-quality-of-behavior.js`; `ingestors/{donki-sanity,donki-fetch,swpc-fetch,gfz-fetch,corpus-loader}.js`. `corpus-loader.js` exposes `loadCorpus` + `loadCorpusWithCutoff` (latter returns `evidence:{pre_cutoff,settlement}`). |
| Existing cycle-003 artifacts | **None.** `grimoires/loa/a2a/cycle-003/**` and `grimoires/loa/cycles/cycle-003*/**` both empty. This PRD is the first cycle-003 artifact. |
| Frozen invariants | Intact at closeout: `scripts/corona-backtest.js` sha256 `17f6380b…1730f1`; cycle-001 `calibration-manifest.json` sha256 `e53a40d1…5db34a`; `corpus_hash b1caef3f…11bb1`; `package.json` `0.2.0`; RLMF cert `version: '0.1.0'`. |

---

## 1. Background and cycle-002 outcome

CORONA is a five-theatre space-weather calibration construct (T1 Flare Class Gate, T2 Geomagnetic Storm Gate, T3 CME Arrival, T4 Proton Event Cascade, T5 Solar Wind Divergence). Settlement authority is theatre-specific and instrument-grounded ([theatre-authority.md](../../calibration/corona/theatre-authority.md), frozen): GOES/SWPC X-ray (T1), SWPC provisional / GFZ definitive Kp (T2), observed L1 shock (T3), GOES integral proton ≥10 MeV / S-scale (T4), self-resolving DSCOVR–ACE Bz divergence (T5).

**Cycle-001** built the offline backtest harness, the frozen calibration protocol, the empirical-evidence index, and a 5-event/theatre corpus (`corpus_hash b1caef3f…11bb1`). It closed at v0.2.0 with the binding honest-framing posture **"calibration-attempted, not improved."**

**Cycle-002** was a *measurement-seam cycle*: it wired CORONA's runtime prediction trajectories into the backtest scoring path (a new `scripts/corona-backtest-cycle-002.js` entrypoint, a deterministic replay seam, threshold-native binary Brier for T1/T2, and an additive `runtime-replay-manifest.json`). Per [CLOSEOUT.md §1](../cycle-002/sprint-06/CLOSEOUT.md) and [COMPLETED](../cycle-002/sprint-06/COMPLETED), cycle-002 earned:

| Rung | Name | Cycle-002 status |
|---|---|---|
| 1 | runtime-wired | EARNED (T4; T1/T2 narrow/prior-only) |
| 2 | runtime-sensitive | **EARNED — T4 only** (two-direction `lambdaScalar` perturbation: Brier `0.38183588` → `0.39533664` in Direction A, byte-identical restore in Direction B) |
| 3 | calibration-improved | **NOT earned** (no refit performed; no-refit covenant held) |
| 4 | L2 publish-ready | **NOT earned** (gated on Rung 3) |

The closeout is binding and carried forward verbatim into cycle-003:

> "T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape and cannot claim calibration improvement in cycle-002." — [CLOSEOUT.md §6](../cycle-002/sprint-06/CLOSEOUT.md)

The mechanism behind "prior-only" is the load-bearing fact for cycle-003: cycle-001 T1/T2 corpus events carry **no pre-cutoff time-series** (no GOES X-ray series for T1; no per-3hr Kp series for T2). Consequently `replay_T1_event` / `replay_T2_event` invoke `createX` once and never call `processX`, so `current_position_at_cutoff` equals the runtime `base_rate` constant ([CYCLE-002-SPRINT-PLAN.md §1.3](../cycle-002/CYCLE-002-SPRINT-PLAN.md), [SDD §2.3](../cycle-002/SDD.md)). T4, by contrast, carries `proton_flux_observations[]` — the timestamped series that the runtime ingests — which is precisely why T4 is the only theatre that exercises the evidence-update path and the only theatre that earned Rung 2.

Cycle-002's own forward hooks point directly at cycle-003:
- [Cycle-002 PRD §6 / §5](../cycle-002/PRD.md): Rung 4 trajectory scoring for T1/T2 is conditioned on *"only if pre-cutoff time-series corpus exists"*, and "corpus expansion (5 events/theatre stays). The '30-event corpus' idea is future-cycle."
- [Cycle-002 CHARTER §2.3](../cycle-002/sprint-00/CHARTER.md): the 30-event corpus is an explicit future-cycle carry-forward.

Cycle-003 is that future cycle — scoped narrowly to building the **data substrate**, not to using it.

---

## 2. Problem statement

Three structural gaps block CORONA from ever *honestly* attempting a calibration-quality claim, and none of them is a tuning problem:

1. **The corpus is too small for evaluation.** 5 events/theatre cannot support a train/held-out split. Any future refit fit-and-evaluated on the same 5 events would be circular; [cycle-001 NOTES HITL-1](../../NOTES.md) accepted the 5-event corpus only as a documented starter, with "no theatre … claimed as well-calibrated below the lower bound."
2. **T1/T2 corpus events are the wrong *shape*.** They are terminal point-labels, not pre-cutoff series. The runtime evidence-update path (`processX`) is never exercised for T1/T2; the prediction can only equal the prior. This is corpus-shape, not a runtime defect — the runtime, replay modules, and `loadCorpusWithCutoff` already exist.
3. **There is no held-out evaluation methodology.** The frozen calibration protocol ([calibration-protocol.md §7](../../calibration/corona/calibration-protocol.md)) scores the whole corpus as one set. A defensible Rung-3 attempt in any future cycle would require a pre-declared, frozen, leakage-free train/held-out split that does not yet exist.

**The problem cycle-003 addresses:** assemble an expanded, verified, correctly-shaped historical corpus and a frozen held-out evaluation methodology — the *substrate* a later cycle would need to (a) run a T1/T2 runtime-sensitivity test and (b) attempt a held-out calibration evaluation — **without performing any refit, and without making any calibration-improvement or publish-readiness claim.**

---

## 3. Mission and non-goals

### 3.1 Mission

Build the historical-corpus expansion and held-out evaluation substrate for CORONA's theatres, framed honestly as a **corpus-shape / data-substrate cycle**.

Cycle-003 IS:
- a corpus-expansion cycle (well beyond 5 events/theatre, with honest per-theatre supply limits);
- a corpus-shape cycle (give T1/T2 events the pre-cutoff time-series shape T4 already has);
- a held-out-methodology cycle (define, document, and freeze a leakage-free train/held-out split);
- a data-provenance cycle (a new corpus with its own hash + manifest, leaving all cycle-001/cycle-002 artifacts byte-frozen);
- an honest-framing cycle (the cycle-001/cycle-002 framing carried forward unweakened).

### 3.2 Non-goals (binding for the full cycle)

| # | Non-goal | Why |
|---|---|---|
| NG-1 | **NOT a parameter-refit cycle.** No runtime parameter, threshold, `base_rate`, `PRODUCTIVITY_PARAMS`, σ, or formula changes. The no-refit covenant ([cycle-002 CHARTER §8.3](../cycle-002/sprint-00/CHARTER.md)) carries forward. | Refit on a new corpus is a *separate, later* cycle gated on the substrate cycle-003 produces. |
| NG-2 | **NOT a calibration-improvement cycle.** Cycle-003 makes no Rung 3 claim for any theatre. Building a held-out set is not the same as beating a baseline on it. | Rung 3 requires a post-refit held-out result that does not exist and is out of scope. |
| NG-3 | **NOT an L2 publish-ready cycle.** No Rung 4 claim. | Gated on Rung 3 ([cycle-002 CHARTER §10](../cycle-002/sprint-00/CHARTER.md)). |
| NG-4 | **NOT a release cycle.** No tag, no `v0.3.0`, no version bump, no GitHub Release, no CHANGELOG, no README/BFZ change. | Release posture is gated on Rung 4 + explicit operator authorization. |
| NG-5 | **No mutation of any frozen cycle-001 or cycle-002 artifact.** New corpus = new namespace + new hash; the cycle-001 corpus (`b1caef3f…`), cycle-001 manifest, cycle-002 manifest, and all frozen run outputs stay byte-identical. | Preserves Baseline A reproducibility and the cycle-002 Baseline B anchor. |
| NG-6 | **No T3 CORONA-prediction emission; no T5 probabilistic-uplift conversion.** | Q2/Q3 freezes ([cycle-002 CHARTER §1](../cycle-002/sprint-00/CHARTER.md)) carry forward. |
| NG-7 | **No uncontrolled archive mirroring or wholesale dataset download, and no bulk ingestion during the PRD/architecture phase.** Data-source feasibility is verified by *sanity-sample* (the existing `donki-sanity.js` pattern). This does NOT forbid the corpus-building deliverable: a later implementation MAY perform **bounded, event-window historical fetches** to assemble the expanded corpus — if and only if the SDD/sprint plan explicitly authorizes them, they are scoped per event window, and they are kept reviewable (still no archive mirroring / wholesale download). | Operator constraint; keeps the cycle reviewable while still permitting the bounded fetches the corpus expansion needs. |

---

## 4. Theatre-specific objectives

Posture tags carry forward verbatim from cycle-002: `T1 [runtime-binary]`, `T2 [runtime-binary]`, `T3 [external-model]`, `T4 [runtime-bucket]`, `T5 [quality-of-behavior]`.

### 4.1 T1 — Flare Class Gate `[runtime-binary]`  (objective: escape prior-only via corpus shape)

- **OBJ-T1-1**: Assemble an expanded GOES-R-era T1 corpus (target ≫ 5; ~30 realistic — see §6) of flare events with validated outcome labels.
- **OBJ-T1-2**: Each T1 event MUST carry a **pre-cutoff GOES X-ray flux time-series** (1-minute 1–8Å flux from gate-open toward the prediction cutoff) so that, on replay, `processFlareClassGate` ingests evidence bundles and `current_position_at_cutoff` can move off `base_rate`.
- **OBJ-T1-3 (acceptance, not a claim)**: On the expanded corpus, replay MUST be able to drive T1 `current_position_at_cutoff ≠ base_rate` for at least the events that carry genuine pre-cutoff signal — proving the corpus is **wired-capable**. This is a substrate-shape acceptance criterion, **not** a sensitivity or calibration-improvement claim (see §8 HAZ-1).
- **Settlement authority unchanged**: GOES/SWPC X-ray flux. Pinned gate (`{threshold_class:"M1.0", window_hours:24}`, [cycle-002 CONTRACT §12](../cycle-002/CYCLE-002-SPRINT-PLAN.md)) is carried forward unless a future charter revisits it.

### 4.2 T2 — Geomagnetic Storm Gate `[runtime-binary]`  (objective: escape prior-only via corpus shape)

- **OBJ-T2-1**: Assemble an expanded GOES-R-era T2 corpus (target ≫ 5; ~30 realistic) of geomagnetic-storm events with validated outcome labels (GFZ-preferred per [cycle-002 SDD §8.5](../cycle-002/SDD.md)).
- **OBJ-T2-2**: Each T2 event MUST carry a **pre-cutoff per-3hr Kp time-series** (the sequence of Kp/Hp readings leading into storm onset) so that `processGeomagneticStormGate` ingests evidence bundles and `current_position_at_cutoff` can move off `base_rate`.
- **OBJ-T2-3 (acceptance, not a claim)**: same wired-capable acceptance as OBJ-T1-3, T2-scoped. Substrate-shape only; not a sensitivity/calibration claim.
- **Settlement authority unchanged**: SWPC provisional Kp (live), GFZ definitive Kp (regression). GFZ ~30-day publication lag exclusion ([calibration-protocol.md §3.6](../../calibration/corona/calibration-protocol.md)) applies to recent events and MUST be honored in corpus eligibility.

### 4.3 T4 — Proton Event Cascade `[runtime-bucket]`  (objective: expand supply, honestly)

- **OBJ-T4-1**: Expand the T4 corpus as far as the GOES-R-era S-scale event supply *honestly allows*. The corpus shape is already correct (`proton_flux_observations[]`); the constraint is **event rarity and bucket diversity**, not shape.
- **OBJ-T4-2**: The count target is **supply-bounded, not fixed at 30.** Document the achievable count and the per-bucket distribution against the `[0-1, 2-3, 4-6, 7-10, 11+]` buckets ([calibration-protocol.md §4.4.2](../../calibration/corona/calibration-protocol.md)). Do NOT pad to 30 by over-weighting low-S events and do NOT silently admit pre-GOES-R-era events to hit a number (see §6, §11 OQ-3).
- **OBJ-T4-3**: Preserve T4's Rung-2 status. Cycle-003 does NOT refit `PRODUCTIVITY_PARAMS` / Wheatland λ; it only enlarges the corpus the substrate offers a future refit study.

### 4.4 T3 / T5 — posture preserved (no change of standing)

- **OBJ-T3-1**: T3 remains **`[external-model]`, diagnostic-only**. Corpus expansion for T3 (more WSA-Enlil/L1-shock pairs) would sharpen an *external-model* diagnostic only; it does NOT create CORONA-owned predictive uplift. T3 MUST NOT be moved into any runtime-uplift set. Cycle-003 emits no CORONA T3 prediction (Q2 freeze).
- **OBJ-T5-1**: T5 remains **`[quality-of-behavior]`, diagnostic-only**. T5 is self-resolving with no external probabilistic ground truth; more DSCOVR/ACE windows would sharpen the quality-of-behavior diagnostic only. T5 MUST NOT be converted to a probabilistic-Brier theatre (Q3 freeze).
- **Binding**: the four verbatim posture sentences from [T3-T5-POSTURE.md §4](../cycle-002/sprint-04/T3-T5-POSTURE.md) carry forward and may not be weakened. T3/T5 are explicitly **excluded** from any cycle-003 corpus-count or held-out target that implies CORONA-owned predictive uplift.

---

## 5. Data-source assumptions (REQUIRE LIVE ARCHIVE VERIFICATION)

> **Epistemic discipline (mirrors [empirical-evidence.md §1.1](../../calibration/corona/empirical-evidence.md))**: every source, cadence, coverage window, and event-count figure below is an **assumption tagged `REQUIRES_LIVE_ARCHIVE_VERIFICATION`**. The PRD author cannot fetch or DOI-resolve archives. No figure here is load-bearing until a sanity-sample verification (NG-7) confirms the source's *current* shape and access. Counts are order-of-magnitude planning estimates only.

| Theatre | Pre-cutoff series source (assumed) | Outcome-label source (assumed) | Existing ingestor | Verification obligation |
|---|---|---|---|---|
| **T1** | NOAA NCEI GOES-R XRS 1-min 1–8Å flux archive (2017+). NOTE: the live `services.swpc.noaa.gov/.../xrays-*-day.json` endpoints are *tail-only*; the historical series lives in the NCEI archive. | NOAA SWPC edited solar events + DONKI FLR | `swpc-fetch.js`, `donki-fetch.js` | Sanity-sample N events spanning 2017→2026; confirm 1-min flux retrievable + label join. |
| **T2** | GFZ Potsdam definitive Kp (3-hr cadence; Matzka et al. 2021 product) + SWPC provisional Kp | NOAA G-scale storm events + DONKI GST | `gfz-fetch.js`, `swpc-fetch.js`, `donki-fetch.js` | Sanity-sample; confirm per-3hr Kp series + GFZ-lag handling. |
| **T4** | NOAA NCEI GOES integral proton ≥10 MeV archive (already corpus-shaped) | NOAA SWPC Solar Proton Events list (≥10 MeV ≥10 pfu) + DONKI SEP | `swpc-fetch.js`, `donki-fetch.js` | Sanity-sample; confirm S-scale event list + flux series; **verify the GOES-R-era S1+ event count** (the binding supply question). |
| T3 (diagnostic) | DSCOVR/ACE L1 + DONKI WSA-Enlil | DONKI CME + L1 shock | `donki-fetch.js` | Only if T3 diagnostic expansion is in scope (see OQ-6). |
| T5 (diagnostic) | DSCOVR + ACE Bz | (self-resolving) | n/a | Only if T5 diagnostic expansion is in scope (see OQ-6). |

**Decision-unblocking answer this substrate rests on** (planning posture, pending verification): the per-3hr Kp series (T2) and the GOES-R XRS 1-min series (T1) are believed *abundantly available* — easily ≫30 events with pre-cutoff series — while the T4 S1+ event supply in the GOES-R era is believed *constrained and bucket-skewed*. Cycle-003 must confirm this empirically before committing corpus targets.

---

## 6. Corpus-shape requirements

- **FR-C6-1 (new namespace, new hash)**: The expanded corpus MUST live in a **new** location (e.g., a cycle-003 corpus namespace or a new primary tier) with its **own `corpus_hash`** and its own manifest. The cycle-001 corpus at `grimoires/loa/calibration/corona/corpus/primary|secondary/` and its `corpus_hash b1caef3f…11bb1` MUST remain byte-frozen (NG-5, HS-C10-3).
- **FR-C6-2 (envelope conformance)**: Every new corpus event MUST validate against the frozen common envelope + per-theatre annotation schema in [calibration-protocol.md §3.7](../../calibration/corona/calibration-protocol.md) (`event_id`, `theatre`, `tier`, `event_time`, `donki_record_ref`, `goes_satellite`, …) at load time via `corpus-loader.js`.
- **FR-C6-3 (T1/T2 series fields — the core deliverable)**: T1 and T2 events MUST additionally carry a **pre-cutoff observation series** consumable by `loadCorpusWithCutoff` as `evidence.pre_cutoff` — strictly time-ordered bundles with `event_time_ms < cutoff.time_ms`. Exact field names are an SDD decision (OQ-1); the *requirement* is that the series exists, is pre-cutoff, and is replay-ingestible.
- **FR-C6-4 (leakage prevention is structural)**: Settlement/outcome fields (`flare_class_observed`, `kp_*_observed`, proton observations at/after cutoff, etc.) MUST remain in `evidence.settlement`, never in `evidence.pre_cutoff`. The cycle-002 forbidden/allowed evidence rules ([cycle-002 SDD §9.3–9.4](../cycle-002/SDD.md)) carry forward as hard corpus-construction rules. A leak is a HARD failure (HS-C10-7).
- **FR-C6-5 (count targets, per theatre, honest)**:
  - T1, T2: target **~30 events/theatre** (planning figure; the §5 verification may revise). Headroom is believed large.
  - T4: target = **the achievable GOES-R-era S1+ count**, documented with its bucket distribution; explicitly NOT forced to 30.
  - T3, T5: any expansion is **diagnostic-only** and excluded from uplift-bearing targets.
- **FR-C6-6 (era discipline)**: Primary-tier events MUST satisfy the GOES-R-era rule (`event_time ≥ 2017-01-01`) per [calibration-protocol.md §3.2](../../calibration/corona/calibration-protocol.md). Any proposal to admit pre-era events (e.g., for T4 high-S coverage) is a **secondary-tier / operator decision**, not a default (OQ-3).
- **FR-C6-7 (provenance)**: Each event records its source archive, retrieval basis, and DONKI cross-reference in `notes`, sufficient for an auditor to re-derive it. Unverifiable events are excluded or tiered secondary.

---

## 7. Train / held-out methodology requirements

> A held-out methodology is a **new** capability — the frozen protocol scores the whole corpus as one set. Cycle-003 *defines and freezes* it; it does not *use* it to fit anything (NG-1, NG-2).

- **FR-C7-1 (pre-declared & frozen)**: The split protocol (assignment rule, ratio, stratification, seal) MUST be declared and frozen **before** any future fitting. Cycle-003 produces the methodology + the assignment; it performs no fit against it.
- **FR-C7-2 (leakage-free)**: The split MUST prevent train→held-out leakage: temporal ordering respected where applicable, no single event's pre-cutoff series spanning both sides, and settlement never exposed pre-cutoff (FR-C6-4).
- **FR-C7-3 (stratification)**: For T1/T2 the split SHOULD be stratified so both sides carry comparable outcome-class coverage. For T4 the split MUST honestly document that full 5-bucket coverage on both sides may be **infeasible** given supply — in which case the methodology specifies a coarser granularity (e.g., S1 vs S2+) or marks the T4 held-out set **underpowered** rather than forcing balance (HAZ-2).
- **FR-C7-4 (sealed held-out)**: The held-out assignment MUST be committed and hashed; a future cycle that touches the held-out set for fitting (rather than evaluation) is a methodology violation that this PRD pre-records as forbidden.
- **FR-C7-5 (minimums)**: The methodology states per-theatre minimum events-per-side for the split to be meaningful; if a theatre cannot meet its minimum (likely T4), that is documented as a limit, not padded around.
- **FR-C7-6 (no refit, no eval-claim)**: Cycle-003 produces the *substrate*. Any "T<N> calibration-improved vs held-out" claim is **out of scope** and reserved for a future, separately-gated cycle.

---

## 8. Claim-language hazards (binding)

The cycle-001/cycle-002 honest-framing memory binding carries forward in full. The grep gate is binding on every cycle-003 closeout-relevant artifact:

```
grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"
```
— it MUST return only NEGATIONS or zero matches outside an explicit, theatre-qualified, baseline-citing claim section (of which cycle-003 has none).

| ID | Hazard | Binding rule |
|---|---|---|
| **HAZ-1** | Conflating "escaped prior-only / processX now runs" with "calibration-improved." | Exercising the evidence-update path is **substrate wiring-capability** (Rung-1/2 *prerequisite*), NOT held-out skill (Rung 3). Cycle-003 may state "the expanded T1/T2 corpus is wired-capable"; it may NOT state or imply calibration improvement. |
| **HAZ-2** | "30 events" implying a calibrated or balanced corpus. | A count is not coverage. T4 bucket diversity is supply-bound; report the achievable count and distribution honestly; never pad. |
| **HAZ-3** | Cross-regime comparison. | A cycle-003 expanded-corpus baseline is a **new regime**. It may NOT be deltaed against Baseline A (cycle-001 uniform-prior) or Baseline B (cycle-002 runtime-replay) as "uplift" ([cycle-002 CHARTER §8.2](../cycle-002/sprint-00/CHARTER.md)). |
| **HAZ-4** | Laundering T3/T5 diagnostic expansion into CORONA-owned uplift. | T3 `[external-model]` and T5 `[quality-of-behavior]` corpus growth sharpens diagnostics only; never cite as predictive uplift (Q2/Q3 freezes). |
| **HAZ-5** | Treating short-horizon nowcasting as "forecasting accuracy." | T1 (final class from rising limb) and T2 (peak Kp from lead-in) are short-horizon nowcasts. Do not inflate to "forecasting." |
| **HAZ-6** | Unverified data figures becoming load-bearing. | Every §5 count/coverage figure is `REQUIRES_LIVE_ARCHIVE_VERIFICATION` until a sanity-sample confirms it. Substrate decisions wait on verification. |
| **HAZ-7** | Silent weakening of the v0.2.0 posture. | Dropping the T1/T2 prior-only disclosure, the posture tags, or the "calibration-attempted, not improved" stance is a hard stop (HS-C10-8). |

---

## 9. Success criteria

Cycle-003 success is **substrate-defined**, not rung-defined. It earns **no new rung** in the cycle-002 ladder and advances **no theatre's rung**; it makes a future advance *possible*. Success =

- **SC-1**: An expanded corpus exists in a new namespace with its own `corpus_hash` and additive manifest; cycle-001 (`b1caef3f…`) and cycle-002 corpora/hashes are byte-unchanged (NG-5).
- **SC-2**: T1 and T2 events carry validated, leakage-free **pre-cutoff time-series** (FR-C6-3/4) that are **wired-capable** (OBJ-T1-3 / OBJ-T2-3) — demonstrated as a substrate-shape acceptance, framed per HAZ-1.
- **SC-3**: T4 corpus expanded to its honest GOES-R-era supply ceiling, with documented bucket distribution (OBJ-T4-2); T4 Rung-2 status preserved; no refit (NG-1).
- **SC-4**: A frozen, leakage-free **train/held-out methodology** + sealed assignment exists (§7), with honest per-theatre minimums and the T4-underpowered caveat recorded.
- **SC-5**: Data-source assumptions (§5) verified by sanity-sample (NG-7); every count/coverage figure either confirmed or revised, with `REQUIRES_LIVE_ARCHIVE_VERIFICATION` resolved.
- **SC-6**: T3/T5 posture preserved verbatim; no uplift attribution (§4.4).
- **SC-7**: All frozen invariants (§0) intact; the honest-framing grep gate clean; no refit/improvement/L2/release claim anywhere (NG-1..4).
- **SC-8 (explicit non-achievement)**: Cycle-003 makes **no** calibration-improved claim, **no** L2 publish-ready claim, **no** T1/T2 runtime-sensitivity claim, and **no** release. These are recorded as deliberate non-achievements, not omissions.

---

## 10. Hard stops (HALT and surface to operator)

| ID | Hard stop |
|---|---|
| HS-C10-1 | Any runtime parameter / threshold / `base_rate` / `PRODUCTIVITY_PARAMS` / σ / formula change appears necessary (no-refit covenant — NG-1). |
| HS-C10-2 | Any edit to `src/`, `tests/`, `scripts/`, the RLMF cert, a **frozen** manifest, a frozen script, or a frozen run output appears necessary. (This PRD/amendment requires none; such a need is a scope question for the SDD/sprint plan.) **Carve-out (not a hard stop):** a NEW cycle-003 corpus manifest, additive corpus metadata, or validation artifact is *required* by FR-C6-1 / SC-1 — it is permitted only when later authorized by the SDD/sprint plan and MUST live in the cycle-003 / new-corpus namespace; it is NEVER delivered by mutating a frozen manifest. |
| HS-C10-3 | Mutation of any **frozen** artifact appears necessary: cycle-001 corpus / `corpus_hash b1caef3f…`, cycle-001 manifest (`e53a40d1…`), `scripts/corona-backtest.js` (`17f6380b…`), cycle-002 `runtime-replay-manifest.json`, any frozen run output, RLMF cert `0.1.0`, calibration-protocol / theatre-authority / empirical-evidence. |
| HS-C10-4 | Editing the root cycle-001 PRD/SDD/sprint (`grimoires/loa/{prd,sdd,sprint}.md`) or any cycle-001/cycle-002 artifact. |
| HS-C10-5 | Any README / BUTTERFREEZONE / `package.json` version / tag / release / CHANGELOG action. |
| HS-C10-6 | Any move of T3 into a runtime-uplift set, T3 CORONA-prediction emission, or T5 probabilistic-Brier conversion (Q2/Q3 freezes). |
| HS-C10-7 | A corpus event leaks settlement into `evidence.pre_cutoff`, or a held-out leakage path is detected (FR-C6-4, FR-C7-2). |
| HS-C10-8 | A cycle-003 artifact weakens the v0.2.0 / cycle-002 honest-framing posture, or the grep gate flags a positive match in non-claim prose (HAZ-7). |
| HS-C10-9 | A count/coverage figure is about to become load-bearing without sanity-sample verification (HAZ-6). |
| HS-C10-10 | Uncontrolled archive mirroring / wholesale dataset download attempted, or any bulk ingestion during the PRD/architecture phase (NG-7). Bounded, reviewable, event-window historical fetches are NOT a hard stop once the SDD/sprint plan authorizes them. |
| HS-C10-11 | This PRD step is found to require creating an SDD, sprint plan, implementation, commit, or push — all explicitly forbidden here. |
| HS-C10-12 | Pre-existing cycle-003 artifacts are discovered (none at authoring — confirmed §0). If found later, HALT and report before any write. |

---

## 11. Open questions for SDD / sprint planning

These are deliberately **deferred** — a PRD states requirements, not design. Each must be resolved by a future SDD/sprint plan, not by this document.

> **First architecture blocker — resolve OQ-2 before all other cycle-003 design.** Before designing the cycle-003 corpus schema (§6) or the held-out methodology (§7), the SDD MUST first answer whether **corpus-shape alone** unlocks T1/T2 replay evidence-updates, or whether **additive replay-module code is required**. The corpus-schema design depends on this answer. This is an **architecture blocker, not implementation permission**: if additive code is required, that is **not** a PRD amendment and must be separately scoped and gated in the SDD/sprint plan (any `src/`/`scripts/` edit stays HS-C10-2 territory until then).

- **OQ-1 (T1/T2 series schema)**: What exact corpus fields carry the pre-cutoff series (e.g., `xray_flux_observations[]` for T1, `kp_observations[]` for T2), and how do they map to `loadCorpusWithCutoff`'s `evidence.pre_cutoff`? (SDD / [calibration-protocol §3.7](../../calibration/corona/calibration-protocol.md) additive schema decision.)
- **OQ-2 (replay-module sufficiency) — FIRST SDD BLOCKER; answer before OQ-1 and before the §6 corpus schema**: Do `t1-replay.js` / `t2-replay.js` already iterate `evidence.pre_cutoff` to call `processX` (so a correctly-shaped corpus alone unlocks T1/T2 evidence updates), or is a separately-gated, additive replay-module change required? The cycle-003 corpus schema (§6) cannot be finalized until this is answered. This is an **architecture blocker, not implementation permission**: if additive code is required, it is out of scope for this PRD/amendment and must be separately scoped/gated in the SDD/sprint plan (any `src/`/`scripts/` edit stays HS-C10-2 territory until then). This determines whether cycle-003 is purely data or whether a later code step is implied.
- **OQ-3 (T4 supply vs era rule)**: If GOES-R-era S1+ supply is insufficient for a meaningful T4 held-out split, does the operator admit secondary-tier pre-2017 events (operator decision per [calibration-protocol §3.3/§3.5](../../calibration/corona/calibration-protocol.md)), accept a coarser T4 split, or accept a documented underpowered T4? (HAZ-2.)
- **OQ-4 (split protocol choice)**: Temporal split vs stratified random vs by-solar-rotation? Ratio? Seed determinism? (§7.)
- **OQ-5 (corpus namespace & hashing)**: New tier under the existing corpus tree vs a cycle-003 corpus directory; how the new `corpus_hash` and additive manifest relate to the frozen cycle-001/cycle-002 manifests (additive-only, per the cycle-002 precedent [SDD §5](../cycle-002/SDD.md)).
- **OQ-6 (T3/T5 diagnostic expansion)**: Is any T3/T5 corpus expansion in scope at all (diagnostic-only), or are T3/T5 frozen at 5 events for cycle-003? Default assumption: out of scope unless explicitly added.
- **OQ-7 (verification depth)**: How many sanity-sample events per theatre satisfy §5 verification without tripping NG-7 (bulk-fetch)? Reuse `donki-sanity.js`'s `--online` pattern and the [cycle-001 HITL-2](../../NOTES.md) live-validation precedent.
- **OQ-8 (cycle-003 rung framing)**: Confirm cycle-003 defines its own substrate success criteria (§9) and does NOT advance the cycle-002 rung ladder — i.e., a future cycle, not cycle-003, would attempt T1/T2 Rung 2 and any Rung 3.

---

## 12. Document scope guarantees

This PRD ships:
- `grimoires/loa/a2a/cycle-003/PRD.md` (the only file written by this task).

This PRD does NOT:
- Write `grimoires/loa/{prd,sdd,sprint}.md`, any cycle-001 artifact, any cycle-002 artifact, README, BUTTERFREEZONE, `package.json`, `src/`, `scripts/`, `tests/`, any manifest, or any calibration run output.
- Create an SDD or sprint plan, implement anything, commit, push, tag, bump version, or release.
- Refit any parameter, claim any calibration improvement, or imply L2 publish-readiness.
- Mutate any frozen invariant (§0) — all remain byte-identical.

*Cycle-003 PRD authored 2026-05-28 against a read-only grounding pass at HEAD `2e5dc1d` (= `origin/main`). Cycle-002 closed at Rung 2 (T4 runtime-sensitive) / v0.2.0; that posture is preserved unweakened. Corpus-shape / data-substrate cycle only: not refit, not calibration-improvement, not L2, not release. Operator ratification gate pending; no SDD/sprint plan exists yet (a charter is optional, created only if the operator requests one).*

*Amended 2026-05-28 (narrow wording pass, mission unchanged): (1) NG-7 + HS-C10-10 — distinguish forbidden archive-mirroring/bulk-download from later SDD-authorized bounded event-window fetches; (2) HS-C10-2 — scope the hard stop to **frozen** manifests and carve out the required new cycle-003 corpus manifest (FR-C6-1 / SC-1); (3) charter softened to optional downstream (header + footer + FR-C6-6 + OQ-3 wording); (4) OQ-2 elevated to the first SDD architecture blocker.*
