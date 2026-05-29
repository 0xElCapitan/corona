# CORONA cycle-003 — Sprint Plan

**Status**: planning document (NOT a charter, NOT a contract, NOT an implementation report). Implementation is forbidden until the operator ratifies this plan and routes execution through `/run sprint-plan` / `/run sprint-N` / `/bug`. A charter is optional and created only on explicit operator request (Golden Path is PRD → SDD → sprint plan).
**Version:** 1.0
**Authored:** 2026-05-28
**Cycle:** cycle-003 (cycle-002 closed at **Rung 2, T4 runtime-sensitive only**; published version **v0.2.0**).
**Binding inputs:**
- PRD: [`grimoires/loa/a2a/cycle-003/PRD.md`](PRD.md) (amended 2026-05-28)
- SDD: [`grimoires/loa/a2a/cycle-003/SDD.md`](SDD.md) (OQ-2 answered)
- Routing ledger: [`grimoires/loa/a2a/cycle-003/SPRINT-LEDGER.md`](SPRINT-LEDGER.md)

**Base commit:** `2e5dc1dd0f4a700fca961d0d61ec8520e49e083f` (= `origin/main`, clean tree; the only untracked path is `grimoires/loa/a2a/cycle-003/`).
**Mission (one line, verbatim from PRD §3.1 / SDD §7):** *Build the historical-corpus expansion and held-out evaluation substrate that a future cycle would need — without refitting, without claiming improvement.*

> This plan does not invent scope. It expands the SDD §11 sprint-implications table (S01–S06) into actionable sprints, preserving the load-bearing dependency edges. Where this plan and the SDD/PRD disagree, the SDD then the PRD govern; where the PRD and any frozen cycle-001/cycle-002 source disagree, the **frozen source is authoritative**. Cycle-001 PRD/SDD/sprint files at `grimoires/loa/{prd,sdd,sprint}.md` are **FROZEN historical** and are NOT active routing targets.

---

## Executive Summary

Cycle-003 is a **corpus-shape / data-substrate cycle**. It assembles an expanded, verified, correctly-shaped historical corpus plus a frozen, leakage-free train/held-out evaluation methodology — the *substrate* a later, separately-gated cycle would need. It **earns no new rung** in the cycle-002 ladder and **advances no theatre's rung** (PRD §9, SDD §1; OQ-8). It is **NOT** a refit cycle, **NOT** a calibration-improvement cycle, **NOT** an L2 publish-ready cycle, and **NOT** a release.

The keystone design fact (SDD §2, the answered first architecture blocker OQ-2): **corpus shape alone does NOT unlock T1/T2 runtime evidence updates.** Two additive code layers — Layer A (replay modules `t1-replay.js`/`t2-replay.js`) and Layer B (loader derivers `deriveEvidenceT1`/`deriveEvidenceT2` in `corpus-loader.js`) — would be required and are **HS-2 territory, explicitly OUT OF SCOPE for cycle-003**. Cycle-003 therefore ships **wired-*capable*** T1/T2 corpus shape (a Rung-1/2 prerequisite), not wiring, and may not state or imply T1/T2 sensitivity or calibration improvement.

**Total Sprints:** 6 (S01–S06). Two optional, operator-gated, default-OFF sprints (T3/T5 diagnostic expansion; pre-2017 secondary-tier T4) are listed but excluded from default scope.
**Sprint Duration:** 2.5 days each (nominal; data-fetch sprints may run longer pending archive verification — see R1).
**Critical path:** S01 → S02 → S03 → S05 → S06, with S04 parallelizable after S02.

### Scope ceiling (binding — what this cycle does NOT do)

Carried from PRD §3.2 (NG-1..7), SDD §1.1, SDD §11 "Explicitly NOT in any cycle-003 sprint":

- No runtime parameter / threshold / `base_rate` / `PRODUCTIVITY_PARAMS` / σ / formula change (no-refit covenant; HS-1).
- No edit to `src/`, `tests/`, `scripts/` (including `t1-replay.js` / `t2-replay.js` / `corpus-loader.js`), the RLMF cert, a **frozen** manifest, a frozen script, or a frozen run output (HS-2). The §2 Layer-A/B change is explicitly deferred to a future cycle (OQ-9).
- No mutation of any frozen cycle-001 / cycle-002 artifact (HS-3); new corpus = new namespace + new hash.
- No T1/T2 runtime-sensitivity run; no Layer-A/B implementation; no refit; no baseline/uplift comparison; no release.
- No T3 CORONA-prediction emission; no T5 probabilistic-Brier conversion (Q2/Q3 freezes; HS-6).
- No README / BUTTERFREEZONE / `package.json` version / tag / release / CHANGELOG action (HS-5).

---

## Goals (extracted from PRD §9 success criteria; IDs auto-assigned for traceability)

> The cycle-003 PRD frames success as **substrate-defined**, not rung-defined (PRD §9). The success criteria SC-1..SC-8 are the cycle's goals. IDs G-1..G-8 are auto-assigned to SC-1..SC-8 here for sprint traceability (logged to trajectory). G-8 is an *explicit non-achievement* goal — its "achievement" is verified absence of forbidden claims.

| ID | Goal (from PRD §9) | Measurement | Validation method |
|----|--------------------|-------------|-------------------|
| **G-1** | SC-1: Expanded corpus in a NEW namespace with its own `corpus_hash` + additive manifest; cycle-001 (`b1caef3f…`) and cycle-002 corpora/hashes byte-unchanged. | New `corpus_hash` computed over new tree only; frozen-invariant diff = zero. | `git diff` on frozen paths empty; new manifest self-contained (S02, S06). |
| **G-2** | SC-2: T1/T2 events carry validated, leakage-free **pre-cutoff time-series** that are **wired-capable**. | §2.3 substrate-conformance probe: series exists, strictly time-ordered, every entry `event_time_ms < cutoff.time_ms`. | Conformance probe report; framed per HAZ-1 (capability not calibration) (S03). |
| **G-3** | SC-3: T4 corpus expanded to its honest GOES-R-era supply ceiling with documented bucket distribution; T4 Rung-2 preserved; no refit. | Achievable S1+ count + per-bucket histogram against `[0-1,2-3,4-6,7-10,11+]`; `PRODUCTIVITY_PARAMS` diff = zero. | T4 expansion report; no-refit diff check (S04). |
| **G-4** | SC-4: Frozen, leakage-free **train/held-out methodology** + sealed assignment, with honest per-theatre minimums and the T4-underpowered caveat. | `heldout-split.json` declared + hashed into manifest before any fit; no-sequence-straddle invariant. | Split seal + leakage audit (S05). |
| **G-5** | SC-5: Data-source assumptions (PRD §5) verified by sanity-sample; every count/coverage figure confirmed or revised; `REQUIRES_LIVE_ARCHIVE_VERIFICATION` resolved for load-bearing figures. | Bounded N sanity-sample per theatre; tag flips to cited `verified`. | Verification ledger in corpus README (S01). |
| **G-6** | SC-6: T3/T5 posture preserved verbatim; no uplift attribution. | Four verbatim posture sentences (CLOSEOUT §6) present + unweakened; T3/T5 excluded from uplift targets. | Posture-sentence presence check (S06). |
| **G-7** | SC-7: All frozen invariants (§0) intact; honest-framing grep gate clean; no refit/improvement/L2/release claim. | Frozen-invariant sha256 set matches; grep gate returns only negations/zero. | Frozen-invariant + grep gate (S06). |
| **G-8** | SC-8 (explicit non-achievement): NO calibration-improved, NO L2 publish-ready, NO T1/T2 runtime-sensitivity claim, NO release — recorded as deliberate non-achievements. | Closeout records the four non-achievements explicitly. | Closeout non-achievement section (S06). |

---

## Sprint Overview

| Sprint | Theme | Scope | Tasks | Key Deliverables | Dependencies |
|--------|-------|-------|-------|------------------|--------------|
| S01 | Archive verification / sanity samples | SMALL | 3 | Verified §5 data-source assumptions; GOES-R-era S1+ supply answer; verification ledger | None |
| S02 | Corpus namespace + schema skeleton | SMALL | 3 | `corpus-cycle-003/` sibling tree; pinned series field names; manifest + `corpus_hash` machinery | S01 |
| S03 | T1/T2 corpus construction (wired-capable) | LARGE | 7 | Leakage-free, strictly-pre-cutoff `xray_flux_observations[]` / `kp_observations[]`; conformance probe report | S02 |
| S04 | T4 expansion + bucket report | SMALL | 3 | T4 events to supply ceiling; honest count + bucket-distribution report | S02 |
| S05 | Held-out split sealing | MEDIUM | 5 | Frozen `heldout-split.json`; leakage audit; seal hashed into manifest | S03, S04 |
| S06 | Review / audit / closeout | MEDIUM | 5 | Grep gate clean; frozen invariants verified; SC-8 non-achievements recorded; CLOSEOUT | S01–S05 |

Optional (default-OFF, operator-gated): **S0X-T35** (T3/T5 diagnostic-only expansion, OQ-6) and **S0X-T4sec** (pre-2017 secondary-tier T4, OQ-3 / T4X-5). Neither is in default scope; see "Optional Sprints" below.

---

## Sprint S01: Archive Verification / Sanity Samples

**Scope:** SMALL (3 tasks)
**Duration:** 2.5 days (may extend pending live-archive access)

### Sprint Goal
Empirically verify the PRD §5 data-source assumptions by bounded sanity-sampling — confirming or revising every load-bearing count/coverage figure before any corpus target is committed.

### Deliverables
- [ ] A verification ledger (in the eventual `corpus-cycle-003/README.md`, created here as a standalone artifact under `grimoires/loa/a2a/cycle-003/sprint-01/` if the corpus tree does not yet exist) recording, per theatre, the source archive, the sampled windows, and the `REQUIRES_LIVE_ARCHIVE_VERIFICATION → verified` transition.
- [ ] A documented answer to the **binding supply question**: the GOES-R-era (2017+) S1+ proton-event count, with its rough per-bucket spread.
- [ ] Confirmation (or revision) that T1 NCEI GOES-R XRS 1-min 1–8Å flux and T2 per-3hr Kp series are retrievable for sampled windows and join to their outcome labels.

### Acceptance Criteria
- [ ] For T1, T2, T4: bounded N events spanning 2017→2026 sanity-sampled (N pinned per OQ-7 decision below); each fetch is per-event-window, never an archive crawl.
- [ ] T1: 1-min 1–8Å flux retrievable for sampled windows + joins to SWPC/DONKI FLR label (note: live `services.swpc.noaa.gov/.../xrays-*-day.json` is *tail-only*; historical series is in the NCEI archive — confirm NCEI retrievability).
- [ ] T2: per-3hr Kp series retrievable + GFZ ~30-day publication-lag handling correct (regression-tier eligibility only when definitive Kp available).
- [ ] T4: GOES-R-era S1+ event list confirmed; achievable count + bucket spread recorded honestly (not inflated to hit 30).
- [ ] Every figure that S02–S05 depend on is either `verified` (with source + retrieval date + sample) or explicitly revised; no figure remains load-bearing while still tagged `REQUIRES_LIVE_ARCHIVE_VERIFICATION` (HS-9).

### Technical Tasks
- [ ] Task S01.1: Resolve OQ-7 — pin sanity-sample N per theatre (proposed default: **N=5 per theatre**, mirroring the cycle-001 `donki-sanity.js` `SAMPLE_EVENTS` pattern and the cycle-001 HITL-2 live-validation precedent). Reuse the existing `ingestors/donki-sanity.js --online` pattern + `swpc-fetch.js` / `gfz-fetch.js` / `donki-fetch.js`; honor `config.js` auth/throttle ceilings (DONKI authenticated ≤900/hr, demo ≤35/hr; documented endpoints only, no scraping). → **[G-5]**
- [ ] Task S01.2: Execute bounded sanity-sample for T1 (NCEI XRS 1-min retrievability + label join) and T2 (per-3hr Kp + GFZ-lag). Record results in the verification ledger; flip verified tags. → **[G-5]**
- [ ] Task S01.3: Execute the **T4 supply probe** — enumerate GOES-R-era S1+ events from the SWPC Solar Proton Events list + DONKI SEP; record the achievable count and the per-bucket `[0-1,2-3,4-6,7-10,11+]` spread. This answer gates S04 (count target) and S05 (T4 held-out feasibility). → **[G-5, G-3]**

### Dependencies
- None (first sprint). Bounded live fetch requires explicit operator authorization of this plan (DV-5); until then, S01 may only sanity-sample, never bulk-fetch.

### Security Considerations
- **Trust boundaries**: external NASA/NOAA/GFZ archives are untrusted inputs; sanity-sample output is validated against the frozen envelope before any corpus admission (S02/S03). No archive content is executed.
- **External dependencies**: zero new code dependencies (zero-dep invariant carried from cycle-001: `node:fs/path/url/crypto`, native `fetch`, `node:test` only). Uses existing ingestors.
- **Sensitive data**: `NASA_API_KEY` (DONKI) read from env only; never logged, never committed. Demo-key fallback documented.

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Live archive shape drifted since cycle-001 | Med | High | Sanity-sample is exactly the drift detector; halt + surface on shape mismatch (cycle-001 HITL-2 pattern). |
| T4 S1+ supply too thin for a meaningful held-out split | Med | High | This is an honest finding, not a defect — feeds S05 HO-6 (underpowered, documented). Do not pad (HAZ-2). |
| Bounded fetch creeps toward archive mirroring | Low | High | Per-event-window only; N capped; reviewable; HS-10 halt on any wholesale-download attempt. |

### Success Metrics
- N events/theatre sanity-sampled (target N=5; confirm).
- 100% of S02–S05-load-bearing figures resolved (`verified` or revised); zero remaining `REQUIRES_LIVE_ARCHIVE_VERIFICATION` on a load-bearing figure.
- GOES-R-era S1+ count: documented integer + bucket spread.

---

## Sprint S02: Corpus Namespace + Schema Skeleton

**Scope:** SMALL (3 tasks)
**Duration:** 2.5 days

### Sprint Goal
Stand up the isolated `corpus-cycle-003/` sibling corpus tree, pin the additive T1/T2 series field names, and build the new `corpus_hash` + additive-manifest machinery — touching zero frozen files.

### Deliverables
- [ ] A new sibling corpus root `grimoires/loa/calibration/corona/corpus-cycle-003/` (exact leaf name finalized here per OQ-5 default), selected by the existing `CORONA_CORPUS_DIR` seam — the frozen `corpus/` tree is never opened for write.
- [ ] Pinned additive series field names (OQ-1 resolution): **`xray_flux_observations[]`** (T1) and **`kp_observations[]`** (T2), with their entry sub-schemas (SDD §4.2 / §5.2).
- [ ] A cycle-003 manifest skeleton `corpus-cycle-003-manifest.json` with a fresh `corpus_hash` computed by the same canonicalization the cycle-001 manifest used (sorted-key canonical JSON → SHA-256, via `replay/canonical-json.js` + `replay/hashes.js` conventions, read-only).

### Acceptance Criteria
- [ ] CN-1: frozen `corpus/` tree, `corpus-manifest.json`, and `corpus_hash b1caef3f…11bb1` are byte-unchanged (`git diff` empty on those paths).
- [ ] CN-2: the new `corpus_hash` is a distinct value over the distinct cycle-003 file set; it is never substituted for or compared against `b1caef3f…` as if measuring the same corpus.
- [ ] CN-3: the manifest is additive and self-contained — lives only in `corpus-cycle-003/`, references only cycle-003 files, is not a wrapper around the frozen manifests (mirrors cycle-002 additive precedent).
- [ ] CN-4: a single placeholder/sample event per theatre validates against the **frozen** common-envelope + per-theatre schema via the existing `corpus-loader.js` `loadCorpus` path with `CORONA_CORPUS_DIR` pointed at the new tree, with **no loader edit** (the loader tolerates additive top-level keys).
- [ ] The series field names are documented as **additive annotations** the existing loader ignores at the `evidence.pre_cutoff` layer (surfacing them is the deferred Layer-B change, HS-2).

### Technical Tasks
- [ ] Task S02.1: Create the `corpus-cycle-003/` directory tree per SDD §3.2 (`primary/{T1-flare-class,T2-geomag-storm,T4-proton-cascade}/`, empty `secondary/`, `README.md` with the S01 verification ledger). T3/T5 subdirs ABSENT by default (OQ-6 default OFF). → **[G-1]**
- [ ] Task S02.2: Pin OQ-1 field names + entry sub-schemas (`xray_flux_observations[]`: `{time, long_channel_wm2, energy_channel, satellite}`; `kp_observations[]`: `{time, kp, index, provenance, satellite}`) and document them in the corpus README as additive-only. Verify via a load-path smoke test that a sample event with these keys loads cleanly through `loadCorpus` (no loader edit). → **[G-1, G-2]**
- [ ] Task S02.3: Build the additive-manifest skeleton + `corpus_hash` machinery (CN-2/CN-3) in the cycle-003 namespace, reusing the cycle-001 canonicalization convention read-only. Confirm CN-1 frozen-tree zero-diff. → **[G-1]**

### Dependencies
- S01: verified shapes (so the schema is designed against confirmed archive reality, not assumptions).

### Security Considerations
- **Trust boundaries**: corpus events are author/archive-sourced data, validated structurally at load; never executed.
- **External dependencies**: none new. `canonical-json.js`/`hashes.js` are read-only references.
- **Sensitive data**: none (no keys in corpus files; provenance notes cite public archives only).

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Accidental inclusion of the new tree in the frozen manifest's coverage | Low | High | Sibling root (not subtree under `corpus/`); manifest references only cycle-003 files (CN-3); explicit CN-1 diff check. |
| New `corpus_hash` mistaken for a comparable measurement vs cycle-001 | Med | Med | CN-2 binding caption; HAZ-3 cross-regime prohibition documented in the manifest. |
| Loader silently rejects the additive keys | Low | Med | CN-4 load-path smoke test catches it; loader is known to tolerate unknown top-level keys (composes `{...body,_derived,_file}`). |

### Success Metrics
- Frozen-path `git diff` = 0 bytes.
- New `corpus_hash` computed and recorded; distinct from `b1caef3f…`.
- 1 sample event/theatre loads cleanly with the additive keys (no loader edit).

---

## Sprint S03: T1/T2 Corpus Construction (Wired-Capable)

**Scope:** LARGE (7 tasks)
**Duration:** 2.5 days (may extend with bounded fetch volume)

### Sprint Goal
Populate the expanded T1 and T2 corpus with leakage-free, strictly-pre-cutoff time-series so the corpus is **wired-capable** (a future Layer-A/B change reading the series would feed `processX`) — proven by a read-only substrate-conformance probe, framed strictly as capability, never as calibration or sensitivity.

### Deliverables
- [ ] Expanded T1 corpus (target ~30 events, S01-confirmed) — each event carrying `xray_flux_observations[]` (1-min 1–8Å flux from gate-open toward cutoff), strictly pre-`flare_peak_time − 1 ms`.
- [ ] Expanded T2 corpus (target ~30 events, S01-confirmed) — each event carrying `kp_observations[]` (per-3hr Kp lead-in), strictly pre-`kp_window_end`, with `provenance` tags (`gfz_definitive` | `swpc_provisional`).
- [ ] A **substrate-conformance probe report** (§2.3): for every T1/T2 event, the series exists, is strictly time-ordered, and every entry satisfies `event_time_ms < cutoff.time_ms` (cutoff via the existing `deriveCutoffT1` / `deriveCutoffT2` rules).

### Acceptance Criteria
- [ ] T1S-1 / T2S-1: **strictly pre-cutoff** — every series entry is strictly before its event's cutoff (T1: `flare_peak_time − 1 ms`; T2: `kp_window_end`). A single at/after-cutoff sample is a leak and a HARD failure (HS-7).
- [ ] T1S-2 / T2S-3: settlement labels (`flare_class_observed`, `flare_peak_time`, `flare_peak_xray_flux`, `flare_end_time`; `kp_swpc_observed`, `kp_gfz_observed`) stay in the event body / settlement set — never copied into the series (FR-C6-4).
- [ ] T2S-2: GFZ ~30-day lag honored — events whose definitive Kp is still inside the lag window are regression-tier-ineligible (matching `validateT2` semantics + protocol §3.6); pre-cutoff provisional series allowed for *shape* only.
- [ ] T1S-3 / T2S-4: series is replay-ingestible (time-keyed, sortable, structurally analogous to `proton_flux_observations[]`).
- [ ] Each event records provenance + the `REQUIRES_LIVE_ARCHIVE_VERIFICATION → verified` transition (FR-C6-7).
- [ ] The conformance probe is **read-only**: it loads via existing `loadCorpus`, asserts shape, and produces a report. It does **NOT** call `processFlareClassGate`/`processGeomagneticStormGate`, does NOT produce a trajectory, does NOT score (CSG-3). It cannot be characterized as a sensitivity test (HAZ-1).
- [ ] T1S-4 / T2S-5 framing: the report states the corpus is **wired-capable** (Rung-1/2 prerequisite), never wired/sensitive/calibration-improved (HS-8).

### Technical Tasks
- [ ] Task S03.1: Build/extend the T1 corpus events with `xray_flux_observations[]` from the S01-verified NCEI XRS archive (bounded per-event-window fetch, sprint-authorized per DV-5); cutoff = `flare_peak_time − 1 ms`. → **[G-2]**
- [ ] Task S03.2: Build/extend the T2 corpus events with `kp_observations[]` from S01-verified GFZ definitive + SWPC provisional Kp; cutoff = `kp_window_end`; tag `provenance` per entry. → **[G-2]**
- [ ] Task S03.3: Enforce leakage prevention at construction time — assert no series entry ≥ cutoff; assert no settlement label appears in any series entry (CSG-1, FR-C6-4). → **[G-2]**
- [ ] Task S03.4: Honor T2 GFZ-lag eligibility — mark regression-tier-ineligible events whose definitive Kp is inside the ~30-day lag (T2S-2). → **[G-2]**
- [ ] Task S03.5: Author the read-only substrate-conformance probe (§2.3) — loads via `loadCorpus`, asserts series existence + strict ordering + strict-pre-cutoff for every event; emits a conformance report. The substrate-conformance probe may be an ad-hoc command, transcript, or cycle-003-local validation artifact, but it MUST NOT create or edit files under `scripts/`, `src/`, or `tests/`. Any durable probe artifact MUST live under `grimoires/loa/a2a/cycle-003/sprint-03/` or the authorized new `corpus-cycle-003/` namespace, and must remain report/validation-only. It must not become production replay wiring, must not call `processX`, must not produce trajectories, and must not score (HS-2, CSG-3). → **[G-2]**
- [ ] Task S03.6: Record per-event provenance + verified tags in the corpus README / manifest (FR-C6-7). → **[G-2, G-5]**
- [ ] Task S03.7: Write the conformance-report framing section asserting wired-*capable* only, with explicit HAZ-1 disclaimer (capability, not calibration; the Layer-A/B change is a future cycle, OQ-9). → **[G-2, G-8]**

### Dependencies
- S02: corpus tree + pinned field names + manifest skeleton.
- S01: verified T1/T2 archive shapes and retrievability.

### Security Considerations
- **Trust boundaries**: fetched archive data is untrusted; the construction-time leakage assertions (S03.3) are the structural gate before admission. Conformance probe treats corpus as data only.
- **External dependencies**: none new; bounded fetch reuses existing ingestors under operator authorization.
- **Sensitive data**: `NASA_API_KEY` env-only; provenance cites public archives.

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Off-by-one / boundary leak (a sample exactly at cutoff) | Med | High | Strict `<` comparison (not `≤`); construction-time assert + conformance probe both enforce; HS-7 halt. |
| "Series now runs processX" misread as calibration improvement | Med | High | HAZ-1 is binding; S03.7 framing section; CSG-3/CSG-4 gates; probe is read-only and explicitly not a sensitivity test. |
| GFZ lag mis-handled → settlement leak via "definitive" that is actually provisional | Low | High | T2S-2 provenance tagging + regression-tier-ineligibility mirrors `validateT2`. |
| Short-horizon nowcast inflated to "forecasting" | Med | Med | HAZ-5 binding; framing reviewed in S06 grep gate. |

### Success Metrics
- ~30 T1 + ~30 T2 events (or S01-revised count) with series fields.
- Conformance probe: 100% of T1/T2 events pass strict-pre-cutoff + strict-ordering; 0 leaks.
- 0 settlement labels in any series entry.

---

## Sprint S04: T4 Expansion + Bucket Report

**Scope:** SMALL (3 tasks)
**Duration:** 2.5 days

### Sprint Goal
Expand the T4 corpus to the honest GOES-R-era S1+ supply ceiling (never padded to a fixed number) and produce a truthful count + bucket-distribution report — preserving T4's Rung-2 status with zero refit.

### Deliverables
- [ ] Additional T4 events in the existing `proton_flux_observations[]` shape, in the `corpus-cycle-003/` namespace, up to the S01-confirmed GOES-R-era S1+ supply ceiling.
- [ ] An honest T4 **count + bucket-distribution report** against the frozen runtime buckets `[0-1, 2-3, 4-6, 7-10, 11+]` (the `T4_BUCKETS_RUNTIME` labels, identical to the runtime `BUCKETS` export consumed by `t4-bucket-brier.js`).

### Acceptance Criteria
- [ ] T4X-1: count is **supply-bounded, not 30** — no padding to a number (HAZ-2).
- [ ] T4X-2 / T4X-3: the per-bucket histogram is a *report artifact*, recorded as-is; a skewed distribution is the honest finding, never optimized toward balance by event selection.
- [ ] T4X-4: all primary-tier T4 events satisfy `event_time ≥ 2017-01-01T00:00:00Z` (GOES-R-era rule); no silent pre-2017 admission.
- [ ] T4X-6: `PRODUCTIVITY_PARAMS` / Wheatland λ / any runtime parameter unchanged (`git diff` on `src/theatres/proton-cascade.js` empty; HS-1). `t4-replay.js` / `t4-bucket-brier.js` are read-only references, not edit targets.
- [ ] T4X-7: if S1+ supply is thin, the limit is recorded honestly (underpowered), not padded.

### Technical Tasks
- [ ] Task S04.1: Add T4 events from the S01 supply probe into `corpus-cycle-003/primary/T4-proton-cascade/`, each in the existing T4 shape (`trigger_flare_class`, `trigger_flare_peak_time`, `prediction_window_hours`, `proton_flux_observations[]`); validate via `loadCorpus` (no loader edit). → **[G-3]**
- [ ] Task S04.2: Produce the count + per-bucket histogram report against `[0-1,2-3,4-6,7-10,11+]`; record it in the corpus README/manifest as an honest artifact (T4X-2/3). → **[G-3]**
- [ ] Task S04.3: Verify no-refit — assert `src/theatres/proton-cascade.js` and all runtime parameters are byte-unchanged; document that any pre-2017 high-S coverage is an operator-gated secondary-tier decision (OQ-3 / T4X-5), default OFF. → **[G-3]**

### Dependencies
- S02: corpus tree + manifest skeleton.
- S01: the GOES-R-era S1+ supply answer (the binding count input).
- (Parallelizable with S03 once S02 lands.)

### Security Considerations
- **Trust boundaries**: same as S03 — archive data validated structurally; no execution.
- **External dependencies**: none new.
- **Sensitive data**: none beyond env-only `NASA_API_KEY`.

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pressure to pad T4 to ~30 to "match" T1/T2 | Med | High | T4X-1/7 binding; supply-bounded by design; underpowered is a valid outcome (HAZ-2). |
| Pre-2017 events sneak into primary tier for high-S coverage | Low | High | T4X-4 era rule enforced at admission; pre-2017 is secondary-tier + operator-gated (default OFF). |
| Accidental runtime-parameter touch while "improving" T4 | Low | High | HS-1 no-refit covenant; explicit `git diff` assert in S04.3. |

### Success Metrics
- T4 event count: documented integer = achievable S1+ supply (not 30).
- Per-bucket histogram: recorded for all 5 buckets.
- `src/theatres/proton-cascade.js` diff = 0 bytes.

---

## Sprint S05: Held-Out Split Sealing

**Scope:** MEDIUM (5 tasks)
**Duration:** 2.5 days

### Sprint Goal
Declare, document, and **freeze** a leakage-free train/held-out split methodology + sealed assignment — producing the substrate a future cycle would evaluate against, while performing **no fit** of any kind.

### Deliverables
- [ ] A `heldout-split.json` (in `corpus-cycle-003/`) declaring the assignment rule, ratio, stratification, seed, and per-theatre minimums — frozen before any future fit.
- [ ] A leakage audit confirming no sequence straddles the split and no settlement is exposed on the feature side.
- [ ] The split seal (hash) recorded in `corpus-cycle-003-manifest.json`.

### Acceptance Criteria
- [ ] HO-1: split protocol declared in `heldout-split.json` and hashed into the cycle-003 manifest **before** any fit; cycle-003 performs no fit.
- [ ] HO-2: the methodology pre-records, as forbidden, any future cycle touching the held-out set for *fitting* (vs evaluation).
- [ ] HO-3: settlement never leaks pre-cutoff; an event's settlement + its series travel together on the same side; no single event's series spans both sides.
- [ ] HO-4: temporal-leakage discipline — no solar-rotation/storm sequence straddles the split (e.g., the May-2024 Gannon sequence stays on one side). The exact mechanism is resolved here (OQ-4 decision below); the **invariant** is no sequence straddle.
- [ ] HO-5: T1/T2 stratified so both sides carry comparable outcome-class coverage (loader-derived `T1_BUCKETS` 6-class, `T2_BUCKETS` G-scale), feasible at the ~30-event target.
- [ ] HO-6: T4 may be **underpowered** — if supply can't support full 5-bucket coverage on both sides, specify a coarser granularity (S1 vs S2+) OR mark T4 held-out underpowered; never pad, never admit pre-2017.
- [ ] HO-7: per-theatre minimum events-per-side stated; a theatre below its minimum (likely T4) is documented as a limit.
- [ ] HO-8 / HO-9: assignment committed + hashed (seal pointer in manifest); the methodology pre-records that any future expanded-corpus baseline on this split is a **new regime**, never deltaed against Baseline A or Baseline B as uplift (CSG-2, HAZ-3).

### Technical Tasks
- [ ] Task S05.1: Resolve OQ-4 — pin the split method. **Proposed default: stratified-random-with-sequence-grouping** for T1/T2 (stratify on outcome class; group co-sequence events so none straddles), ratio **train 0.7 / heldout 0.3**, with a **deterministic seed** recorded in `heldout-split.json`. Document the rationale vs the alternatives (pure temporal cut; by-solar-rotation). → **[G-4]**
- [ ] Task S05.2: Compute and write the T1/T2 stratified assignment (HO-5); verify both sides carry comparable outcome-class coverage. → **[G-4]**
- [ ] Task S05.3: Compute the T4 assignment honestly (HO-6/7) — if underpowered, mark it; choose coarser S1-vs-S2+ granularity OR the explicit underpowered marker; never pad. → **[G-4, G-3]**
- [ ] Task S05.4: Run the leakage audit (HO-3/4) — assert no sequence straddles the split; assert settlement stays with its event on one side; assert no series spans both sides. A detected leak is HS-7. → **[G-4]**
- [ ] Task S05.5: Freeze + seal — write the `no_fit_against_heldout: true` flag and the `regime_note`, hash `heldout-split.json`, and record the seal pointer in the cycle-003 manifest (HO-1/8/9). → **[G-4]**

### Dependencies
- S03: T1/T2 corpus (with series + sequence metadata for grouping).
- S04: T4 corpus + bucket distribution (for the T4 split feasibility decision).

### Security Considerations
- **Trust boundaries**: the split operates on already-validated corpus events; the leakage audit is the structural guard against train→held-out leakage.
- **External dependencies**: none new; seed/hash use `node:crypto`.
- **Sensitive data**: none.

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sequence straddle leaks held-out predictability | Med | High | HO-4 sequence-grouping; S05.4 audit asserts no straddle; HS-7 halt. |
| T4 split forced to balance by padding | Med | High | HO-6 underpowered-is-valid; S05.3 honest path; HAZ-2. |
| Future reader fits against the held-out set | Low | High | HO-2 pre-records the prohibition; seal + `no_fit_against_heldout` flag; this is a methodology violation by definition. |
| Split baseline misread as uplift vs Baseline A/B | Med | High | HO-9 regime_note in the JSON; CSG-2; the split produces no baseline in cycle-003 anyway. |

### Success Metrics
- `heldout-split.json` declared + hashed; seal pointer in manifest.
- Leakage audit: 0 sequence straddles, 0 settlement-on-feature-side, 0 series spanning both sides.
- Per-theatre minimums + T4 underpowered status: documented.

---

## Sprint S06 (Final): Review / Audit / Closeout

**Scope:** MEDIUM (5 tasks)
**Duration:** 2.5 days

### Sprint Goal
Validate the full cycle-003 substrate against the honest-framing perimeter, verify all frozen invariants intact, record the SC-8 explicit non-achievements, and close the cycle with no release.

### Task S06.E2E: End-to-End Goal Validation

**Priority:** P0 (Must Complete)
**Goal Contribution:** All goals (G-1 … G-8)

**Description:** Validate that all PRD §9 success criteria (the cycle-003 goals) are achieved as a coherent substrate, and that every binding non-achievement is recorded as deliberate.

**Validation Steps:**

| Goal ID | Goal | Validation Action | Expected Result |
|---------|------|-------------------|-----------------|
| G-1 | New-namespace corpus + hash; frozen artifacts byte-unchanged | `git diff` on frozen paths; confirm new `corpus_hash` distinct + self-contained manifest | Frozen diff empty; new hash recorded |
| G-2 | T1/T2 wired-capable pre-cutoff series | Re-run §2.3 conformance probe over full T1/T2 set | 100% strict-pre-cutoff + strict-ordering; 0 leaks; framed as capability |
| G-3 | T4 supply-ceiling expansion, Rung-2 preserved, no refit | Confirm count = supply ceiling + bucket report; `proton-cascade.js` diff empty | Honest count + histogram; 0-byte runtime diff |
| G-4 | Frozen leakage-free held-out methodology + seal | Confirm `heldout-split.json` hashed into manifest; leakage audit clean | Seal present; 0 leakage findings |
| G-5 | Data-source assumptions verified | Confirm verification ledger; no load-bearing `REQUIRES_LIVE_ARCHIVE_VERIFICATION` remains | All load-bearing figures verified/revised |
| G-6 | T3/T5 posture preserved verbatim | Grep the four verbatim posture sentences (CLOSEOUT §6) present + unweakened | 4/4 sentences present; T3/T5 excluded from uplift |
| G-7 | Frozen invariants intact; grep gate clean | sha256 of frozen set; honest-framing grep gate | All sha256 match; grep returns only negations/zero |
| G-8 | Explicit non-achievements recorded | Confirm closeout records: no calibration-improved, no L2, no T1/T2 sensitivity, no release | All four recorded as deliberate |

**Acceptance Criteria:**
- [ ] Each goal validated with documented evidence.
- [ ] No goal marked "not achieved" without explicit justification (G-8 is an explicit-non-achievement goal by design).

### Deliverables
- [ ] `/review-sprint` (or per-sprint review) outputs for S01–S05.
- [ ] `/audit-sprint` security/quality outputs; APPROVED before closeout.
- [ ] A cycle-003 `CLOSEOUT.md` (in `sprint-06/`) recording the substrate outcome, the SC-8 explicit non-achievements, and the frozen-invariant verification.

### Acceptance Criteria
- [ ] CSG-9 honest-framing grep gate clean over **every** cycle-003 closeout-relevant artifact:
  `grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"`
  returns only NEGATIONS or zero matches outside an explicit, theatre-qualified, baseline-citing claim section (cycle-003 has none) (HS-8).
- [ ] The four verbatim T3/T5 + "calibration-attempted, not improved" posture sentences (CLOSEOUT §6) carried forward unweakened (G-6).
- [ ] Frozen-invariant set verified intact (G-7): `scripts/corona-backtest.js` `17f6380b…1730f1`; cycle-001 `calibration-manifest.json` `e53a40d1…5db34a`; `corpus_hash b1caef3f…11bb1`; cycle-002 `runtime-replay-manifest.json`; RLMF cert `0.1.0`; `package.json` `0.2.0`; no annotated tag created.
- [ ] CSG-2..CSG-8: no cross-regime uplift comparison, no T1/T2 sensitivity claim, no calibration-improved claim, no forecasting-accuracy claim, no L2 claim, no T3/T5 uplift claim, no release/tag/version bump.
- [ ] SC-8 non-achievements recorded explicitly as deliberate (G-8).

### Technical Tasks
- [ ] Task S06.1: Run the honest-framing grep gate over all cycle-003 artifacts; remediate any positive match in non-claim prose (HS-8). → **[G-7, G-8]**
- [ ] Task S06.2: Verify the full frozen-invariant set by sha256/`git diff`; record results in `CLOSEOUT.md` §frozen-invariant table. → **[G-7, G-1]**
- [ ] Task S06.3: Confirm the four verbatim posture sentences present + unweakened; confirm T3/T5 excluded from every uplift-bearing target (G-6). → **[G-6]**
- [ ] Task S06.4: Author `CLOSEOUT.md` recording: substrate outcome (no new rung; no theatre rung advance — OQ-8); SC-1..SC-7 evidence; SC-8 explicit non-achievements; the OQ-9 note that the Layer-A/B change belongs to a future separately-gated cycle. → **[G-8, all]**
- [ ] Task S06.5: Run S06.E2E end-to-end goal validation table; route `/review-sprint` → `/audit-sprint`; confirm APPROVED; **stop** — no commit/tag/release without explicit operator authorization (HS-5). → **[all]**

### Dependencies
- S01–S05 all complete.

### Security Considerations
- **Trust boundaries**: closeout reads artifacts only; the grep gate + frozen-invariant check are the perimeter validators.
- **External dependencies**: none new.
- **Sensitive data**: none.

### Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| A closeout sentence silently weakens the v0.2.0 posture | Med | High | CSG-9 grep gate + verbatim-posture-sentence check; HS-8 halt. |
| A frozen artifact drifted during the cycle | Low | High | S06.2 full sha256 set verification; HS-3 halt on any drift. |
| Closeout drifts toward a calibration/sensitivity claim | Med | High | G-8 explicit non-achievement section; HAZ-1/3/5; audit gate. |

### Success Metrics
- Grep gate: 0 positive matches in non-claim prose.
- Frozen-invariant sha256 set: 100% match.
- 4/4 verbatim posture sentences present; SC-8 4/4 non-achievements recorded.

---

## Optional Sprints (default-OFF, operator-gated)

These are **NOT in default cycle-003 scope** (SDD §11). They run only if the operator explicitly opts in.

| Sprint | Theme | Gate | Why default-OFF |
|--------|-------|------|-----------------|
| S0X-T35 | T3/T5 diagnostic-only corpus expansion | OQ-6 operator opt-in | T3 `[external-model]` / T5 `[quality-of-behavior]` growth sharpens a diagnostic only; excluded from any uplift target (HAZ-4, CSG-7). Default: out of scope. |
| S0X-T4sec | Pre-2017 secondary-tier T4 events (e.g., 2003 Halloween) | OQ-3 / T4X-5 operator decision | Pre-GOES-R admission is a `secondary/`-tier operator decision; secondary events do not enter regression scoring by default (protocol §3.3). Default: underpowered + documented, no pre-2017. |

**Explicitly NOT in any cycle-003 sprint (default or optional):** the §2 Layer-A/B replay+loader change (OQ-9, HS-2); any refit (HS-1); any T1/T2 sensitivity run; any baseline/uplift comparison (CSG-2); any release (HS-5, CSG-8). Those belong to a future, separately-gated cycle.

---

## Risk Register

| ID | Risk | Sprint | Probability | Impact | Mitigation | Owner |
|----|------|--------|-------------|--------|------------|-------|
| R1 | Live-archive shape/access drifted since cycle-001; bounded fetch blocked | S01, S03, S04 | Med | High | Sanity-sample is the drift detector; HS-9 keeps unverified figures non-load-bearing; bounded fetch is sprint-authorized only (DV-5). | Eng |
| R2 | T4 GOES-R-era S1+ supply too thin for a meaningful held-out split | S01, S04, S05 | Med | High | Honest finding, not a defect: HO-6 underpowered path; HAZ-2 no-padding. | Eng |
| R3 | "Series exercises processX" misread as T1/T2 calibration improvement | S03, S06 | Med | High | HAZ-1 binding; conformance probe is read-only; CSG-3/4 gates; S03.7 + G-8 framing. | Eng + Reviewer |
| R4 | Boundary/off-by-one leak (sample exactly at cutoff) | S03 | Med | High | Strict `<` (not `≤`); construction-time assert + conformance probe; HS-7. | Eng |
| R5 | Accidental frozen-artifact mutation (corpus_hash, manifest, runtime) | S02, S04, S06 | Low | High | Sibling tree + additive manifest (CN-1/3); `git diff` asserts; HS-3 halt. | Eng |
| R6 | Cross-regime uplift comparison (new corpus vs Baseline A/B) | S05, S06 | Med | High | HAZ-3 / CSG-2; HO-9 regime_note; no baseline computed in cycle-003. | Reviewer |
| R7 | Bounded fetch creeps to archive mirroring / bulk download | S01, S03, S04 | Low | High | Per-event-window only; N capped; reviewable; HS-10 halt. | Eng |
| R8 | Honest-framing posture silently weakened in any artifact | All | Med | High | CSG-9 grep gate every sprint-relevant artifact; verbatim-sentence check; HS-8. | Reviewer + Auditor |
| R9 | T2 GFZ lag mishandled → provisional Kp treated as definitive settlement | S01, S03 | Low | High | T2S-2 provenance tagging + regression-tier-ineligibility mirrors `validateT2` + protocol §3.6. | Eng |
| R10 | A design step is found to *require* the Layer-A/B code edit | S03, S05 | Low | High | HS-2/HS-11 halt; Layer-A/B is OQ-9 future-cycle territory; cycle-003 ships shape only. | Eng |

---

## Success Metrics Summary

| Metric | Target | Measurement Method | Sprint |
|--------|--------|-------------------|--------|
| Load-bearing data figures verified | 100% (0 unresolved `REQUIRES_LIVE_ARCHIVE_VERIFICATION`) | Verification ledger | S01 |
| GOES-R-era S1+ count | Documented integer + bucket spread | T4 supply probe | S01 |
| Frozen-path diff | 0 bytes | `git diff` on frozen paths | S02, S04, S06 |
| New `corpus_hash` | Computed, distinct from `b1caef3f…` | canonical-JSON → SHA-256 | S02 |
| T1/T2 events with pre-cutoff series | ~30 each (or S01-revised) | corpus count | S03 |
| T1/T2 conformance | 100% strict-pre-cutoff + ordered; 0 leaks | §2.3 conformance probe | S03, S06 |
| T4 expansion | = supply ceiling (not padded) | T4 count + histogram | S04 |
| Runtime-parameter diff | 0 bytes (`proton-cascade.js` etc.) | `git diff` | S04, S06 |
| Held-out split sealed | `heldout-split.json` hashed into manifest | seal pointer | S05 |
| Leakage audit | 0 straddles / 0 settlement-leaks / 0 spanning series | leakage audit | S05 |
| Honest-framing grep gate | 0 positive matches in non-claim prose | grep -niE gate | S06 |
| Frozen-invariant set | 100% sha256 match | sha256 verification | S06 |
| Explicit non-achievements (SC-8) | 4/4 recorded | closeout review | S06 |

---

## Dependencies Map

```
S01 (verify) ──┬──▶ S02 (namespace+schema) ──┬──▶ S03 (T1/T2 series) ──┐
               │                              │                         ├──▶ S05 (held-out seal) ──▶ S06 (review/audit/closeout)
               └──────────────────────────────┴──▶ S04 (T4 expand) ─────┘
                  (S01 S1+ supply answer feeds both S04 count and S05 T4 feasibility)
```

- S01 gates everything (no corpus target before verification — HS-9).
- S02 gates S03 + S04 (the tree + field names + manifest must exist first).
- S03 + S04 both feed S05 (split needs both corpora).
- S06 gates the cycle close (no release without operator authorization — HS-5).

---

## Appendix

### A. PRD Requirement Mapping

| PRD Requirement | Sprint | Status |
|-----------------|--------|--------|
| FR-C6-1 (new namespace, new hash) | S02 | Planned |
| FR-C6-2 (envelope conformance) | S02, S03, S04 | Planned |
| FR-C6-3 (T1/T2 series fields — core deliverable) | S03 | Planned |
| FR-C6-4 (leakage prevention structural) | S03, S05 | Planned |
| FR-C6-5 (count targets per theatre, honest) | S03, S04 | Planned |
| FR-C6-6 (era discipline 2017+) | S04 | Planned |
| FR-C6-7 (provenance) | S03, S04 | Planned |
| FR-C7-1..6 (train/held-out methodology) | S05 | Planned |
| OBJ-T1-1..3 / OBJ-T2-1..3 (escape prior-only via shape, wired-capable) | S03 | Planned |
| OBJ-T4-1..3 (expand supply honestly, Rung-2 preserved) | S04 | Planned |
| OBJ-T3-1 / OBJ-T5-1 (posture preserved) | S06 | Planned |
| NG-1..7 (non-goals) | All (gates) | Enforced |

### B. SDD Component Mapping

| SDD Section | Sprint | Status |
|-------------|--------|--------|
| §2 OQ-2 answer (Layer-A/B out of scope) | S03 (boundary), S06 (OQ-9 closeout) | Honored as scope boundary |
| §3 Corpus namespace (sibling tree via `CORONA_CORPUS_DIR`) | S02 | Planned |
| §4 T1 schema (`xray_flux_observations[]`) | S02 (pin), S03 (populate) | Planned |
| §5 T2 schema (`kp_observations[]`) | S02 (pin), S03 (populate) | Planned |
| §6 T4 expansion (supply-bounded) | S04 | Planned |
| §7 Held-out methodology | S05 | Planned |
| §8 Data-source verification (sanity-sample) | S01 | Planned |
| §9 Leakage + claim-safety gates (CSG-1..9) | All (gates) | Enforced |
| §10 Hard stops (HS-1..12) | All (gates) | Enforced |

### C. PRD Goal Mapping

| Goal ID | Goal Description (PRD §9 SC-N) | Contributing Tasks | Validation Task |
|---------|-------------------------------|--------------------|-----------------|
| G-1 | SC-1: new-namespace corpus + hash; frozen byte-unchanged | S02.1, S02.2, S02.3, S03.6, S06.2 | S06.E2E |
| G-2 | SC-2: T1/T2 wired-capable pre-cutoff series | S02.2, S03.1, S03.2, S03.3, S03.4, S03.5, S03.6, S03.7 | S06.E2E |
| G-3 | SC-3: T4 supply-ceiling expansion, Rung-2, no refit | S01.3, S04.1, S04.2, S04.3, S05.3 | S06.E2E |
| G-4 | SC-4: frozen leakage-free held-out methodology + seal | S05.1, S05.2, S05.3, S05.4, S05.5 | S06.E2E |
| G-5 | SC-5: data-source assumptions verified | S01.1, S01.2, S01.3, S03.6 | S06.E2E |
| G-6 | SC-6: T3/T5 posture preserved verbatim | S06.3 | S06.E2E |
| G-7 | SC-7: frozen invariants intact; grep gate clean | S06.1, S06.2 | S06.E2E |
| G-8 | SC-8: explicit non-achievements recorded | S03.7, S06.1, S06.4 | S06.E2E |

**Goal Coverage Check:**
- [x] All PRD goals (SC-1..SC-8 → G-1..G-8) have at least one contributing task.
- [x] All goals have a validation task in the final sprint (S06.E2E).
- [x] No orphan tasks — every task annotates at least one goal.

**Per-Sprint Goal Contribution:**

- S01: G-5 (data verification), G-3 (partial: T4 supply answer)
- S02: G-1 (namespace + hash + manifest), G-2 (partial: pinned field names)
- S03: G-2 (complete: T1/T2 wired-capable series), G-5 (provenance), G-8 (partial: framing)
- S04: G-3 (complete: T4 expansion, no refit)
- S05: G-4 (complete: held-out seal), G-3 (T4 split feasibility)
- S06: G-1, G-6, G-7, G-8 (verification + closeout) + E2E validation of all goals

---

## Open Decisions Pinned by This Plan (with assumptions flagged)

Adopted from the PRD/SDD explicit defaults because no interactive operator clarification was available at planning time; each is falsifiable and may be overridden at ratification.

| OQ | Decision pinned | Source / default | If wrong |
|----|-----------------|------------------|----------|
| OQ-1 | Field names `xray_flux_observations[]` (T1), `kp_observations[]` (T2) | SDD §4.2/§5.2 proposal | S02.2 re-pins; downstream S03 schema follows |
| OQ-3 | T4 default = underpowered + documented, no pre-2017 (secondary-tier is opt-in) | SDD §12 default | Operator opts into S0X-T4sec |
| OQ-4 | Split = stratified-random-with-sequence-grouping; ratio 0.7/0.3; deterministic seed | Plan proposal grounded in SDD §7 illustrative shape | S05.1 re-pins method/ratio/seed |
| OQ-5 | Sibling root `corpus-cycle-003/` via `CORONA_CORPUS_DIR` | SDD §3.2 default | S02.1 relocates leaf |
| OQ-6 | T3/T5 expansion OUT of scope | SDD §12 default | Operator opts into S0X-T35 |
| OQ-7 | Sanity-sample N = 5 per theatre | Mirrors cycle-001 `donki-sanity.js` + HITL-2 | S01.1 re-pins N |
| OQ-8 | Cycle-003 defines its own substrate success; advances no rung | PRD §9 / SDD §1 (confirmed) | n/a — binding |
| OQ-9 | Layer-A/B replay+loader change OUT of scope (future cycle) | SDD §2.2 / §12 (HS-2) | n/a — binding |

> **Note on numbering & routing:** Cycle-003 uses the per-cycle `grimoires/loa/a2a/cycle-003/` namespace and its own [SPRINT-LEDGER.md](SPRINT-LEDGER.md), mirroring the cycle-002 convention. The root `grimoires/loa/ledger.json` is **frozen at cycle-001** and is NOT updated by this plan. Sprint IDs S01–S06 are cycle-local; they do not consume the root `global_sprint_counter`.

---

*Generated by Sprint Planner. Cycle-003 is a corpus-shape / data-substrate cycle: NOT refit, NOT calibration-improvement, NOT T1/T2 sensitivity, NOT L2 publish-ready, NOT release. Cycle-002's earned ceiling — "CORONA demonstrated T4 runtime sensitivity only," v0.2.0 — is preserved unweakened. This plan grants no implementation permission; the operator ratifies and routes execution through `/run sprint-plan` / `/run sprint-N` / `/bug`. No SDD-§2 Layer-A/B change, no commit, no tag, no release performed or authorized by this artifact.*
