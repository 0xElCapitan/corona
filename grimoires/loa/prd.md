# PRD — CORONA: v3 Construct-Network Readiness + Hybrid Calibration

> **Brownfield grounding banner**: This PRD was created without `/ride` codebase analysis. Reality grounding is provided by the existing provenance-tagged BUTTERFREEZONE.md (CODE-FACTUAL / DERIVED / OPERATIONAL annotations) rather than `/ride`-extracted reality artifacts. `/ride` was deliberately skipped on 2026-04-30 by joint operator-agent decision because BFZ already substantiates code-grounded claims. If reality drift is suspected at any future point, run `/ride` and `/plan-and-analyze --fresh` to refresh.

> **Sources**: User amendment block (2026-04-30 `/discovering-requirements` invocation), README.md, BUTTERFREEZONE.md, spec/construct.json, spec/corona_construct.yaml, src/index.js, package.json, grimoires/loa/context/Construct Creater README.md, TREMOR (`C:\Users\0x007\tremor`, read-only reference), BREATH (`C:\Users\0x007\breath`, read-only reference), `.loa.config.yaml`.

---

## 1. Executive Summary

CORONA is a partially-implemented Echelon construct (5 theatres, 60 tests passing, version 0.1.0) that requires two parallel uplifts before it is network-deployable:

1. **Migration to construct-network/v3 conventions** established by construct-creator's dogfooding (PR #11, MERGED 2026-04-22 per `grimoires/loa/context/Construct Creater README.md:78`).
2. **Parameter calibration** against historical SWPC/DONKI data using a **hybrid recipe** — TREMOR-style backtest for theatres with clean ground truth + BREATH-style literature research for sigma priors and uncertainty constants.

Calibration alone is insufficient because v3 readiness is required for construct-network deployment. v3 readiness alone is insufficient because Echelon's RLMF pipeline assumes calibrated certificates. The work is sequenced as **8 sprints (0-7)** with HITL gates at Sprint 0 and Sprint 1; full autonomous execution for Sprints 2-7 is revisited post-Sprint-1.

> **Sources**: User amendment block; README.md:1-5,99-110,114-122; BUTTERFREEZONE.md:1-23,46; package.json:1-7,32; `Construct Creater README.md:78-88`.

---

## 2. Problem & Vision

### 2.1 Problem Statement

CORONA was authored before construct-creator dogfooded the v3 conventions required for the upcoming construct network. Its sister constructs (TREMOR, BREATH) are calibrated but pre-v3; CORONA is pre-v3 AND uncalibrated. The construct cannot be deployed to the network in its current state, and even after migration its parameters lack provenance.

> User amendment: *"I did not build TREMOR/BREATH through construct-creator, but construct-creator now dogfoods the v3 conventions required for the upcoming construct network."*

> README.md:99: *"CORONA is the second Echelon construct. It follows the same architectural patterns."*

### 2.2 Vision

CORONA becomes a **v3-compliant, calibrated, deployable** space-weather construct whose parameters carry full provenance via a calibration manifest, whose theatre-by-theatre settlement authority is explicit and defensible, and whose backtest harness produces regression-gated artifacts. The calibration recipe is **hybrid (TREMOR-leaning) and theatre-specific**, not uniformly Brier-bucketed.

### 2.3 Why Now

The construct network is approaching deployment. CORONA is the second Echelon construct after TREMOR, and Echelon's value scales with the number of v3-ready, calibrated constructs. Deferring v3 migration risks bit rot against an evolving schema (PR #11 merged 2026-04-22). Deferring calibration risks shipping a construct whose certificates have no defensible accuracy baseline.

> **Sources**: User amendment; `Construct Creater README.md:78-93`; BUTTERFREEZONE.md:14-23 (ecosystem block).

---

## 3. Goals & Success Metrics

### 3.1 Sprint 0 Acceptance — v3 Readiness + Authority Map

| # | Criterion | Verification |
|---|-----------|--------------|
| G0.1 | `schema_version: 3` set in canonical spec file | Validator green against v3 schema |
| G0.2 | Explicit `streams:` block (Intent + Operator-Model in / Verdict + Artifact + Signal out) | Per `Construct Creater README.md:32,82` |
| G0.3 | `identity/CORONA.md` persona file written | Distinct voice; observer-of-the-Sun framing |
| G0.4 | `composition_paths:` declared, including `calibration: grimoires/loa/calibration/corona/` | Path committed and referenced by Sprint 1+ |
| G0.5 | `commands:` array enumerates all 5 theatre commands | T1-T5 present (sourced from spec/construct.json:13-19) |
| G0.6 | `compose_with: [tremor]` declared with reciprocity documentation | TREMOR is read-only reference; reciprocity may be one-sided in this cycle (R2) |
| G0.7 | `pack_dependencies:` declared (likely empty initially) | Empty array acceptable; presence is the gate |
| G0.8 | `construct-validate.sh` acquired from construct-base or construct-creator + run green against CORONA | Script source documented in Sprint 0 notes |
| G0.9 | Butterfreezone marker for CONSTRUCT-README.md autogen path declared | Existing BUTTERFREEZONE.md migrated or aliased |
| G0.10 | ≥1 reference composition: **TREMOR** (RLMF cert pipeline integration example) | Reference composition file/example committed |
| G0.11 | Theatre authority map committed at `grimoires/loa/calibration/corona/theatre-authority.md` | Per Section 6 |
| G0.12 | T4 naming/question/buckets cleaned to NOAA S-scale (proton flux) | spec/construct.json, README.md, src/theatres/proton-cascade.js consistent |

### 3.2 Calibration Acceptance — Sprints 2-5

| # | Criterion | Artifact path |
|---|-----------|---------------|
| GC.1 | Frozen calibration protocol committed (Sprint 2) | `grimoires/loa/calibration/corona/calibration-protocol.md` |
| GC.2 | Backtest harness runs against full primary corpus (Sprint 3) | `scripts/corona-backtest.js` + `grimoires/loa/calibration/corona/run-1/` |
| GC.3 | Research doc covers all non-backtestable priors (Sprint 4) | `grimoires/loa/calibration/corona/empirical-evidence.md` |
| GC.4 | Calibration manifest with full provenance (Sprint 5) | `grimoires/loa/calibration/corona/calibration-manifest.json` per Section 7 schema |
| GC.5 | Regression gate prevents un-blessed parameter drift (Sprint 5) | Test or pre-commit hook fails if inline parameters diverge from manifest |

### 3.3 Final Acceptance — Sprint 7

| # | Criterion |
|---|-----------|
| GF.1 | `construct-validate.sh` green against post-calibration spec |
| GF.2 | BFZ refresh: BUTTERFREEZONE.md (or v3 equivalent) reflects post-calibration provenance |
| GF.3 | Final calibration certificates committed at `grimoires/loa/calibration/corona/run-N-final/` |
| GF.4 | Test suite green; baseline 60 tests + new tests for v3 + manifest-regression gate (README.md:115-122) |

> **Sources**: User amendment; `Construct Creater README.md:32-38,78-88`; spec/construct.json:13-19; README.md:115-122.

---

## 4. Users & Stakeholders

### 4.1 Primary

- **Construct author** (El Capitan, spec/construct.json:8) — owns CORONA, makes execution decisions, gates HITL transitions for Sprint 0 and Sprint 1.

### 4.2 Secondary

- **Future operators** discovering CORONA via construct network — need v3 metadata for `/explore-network` wayfinding (`Construct Creater README.md:44-58`).
- **Echelon platform** — consumes CORONA's RLMF certificates; schema declared `compatible_with: [tremor]` (spec/construct.json:91-95).
- **CURATOR persona** (construct-creator) — CORONA must read defensible to its 5-lens critique: knowledge, craft, depth, structure, perceptual (`Construct Creater README.md:48-58`).
- **Sibling constructs**: TREMOR and BREATH share RLMF certificate schema (spec/construct.json:91-95; BUTTERFREEZONE.md:46).

> **Sources**: spec/construct.json:8,91-95; BUTTERFREEZONE.md:14-23,46; `Construct Creater README.md:44-58`; user amendment scope note.

---

## 5. Functional Requirements (Sprint Plan)

> **Per user amendment**: Sprint order 0 → 7. Sprint 0 + Sprint 1 are HITL; full autonomous execution for Sprints 2-7 is revisited post-Sprint-1.

### 5.1 Sprint 0 — v3 Construct-Network Readiness Audit + Theatre Authority Map

**Inputs**: User amendment, `Construct Creater README.md`, existing spec/construct.json + spec/corona_construct.yaml, TREMOR's compose_with declarations (read-only).

**Outputs**:
- `construct-validate.sh` acquired from construct-base or construct-creator (source documented in `grimoires/loa/calibration/corona/sprint-0-notes.md`).
- v3-compliant canonical spec file (format **TBD** post-validator inspection — see §11).
- `identity/CORONA.md` (voice = construct as observer-of-the-Sun / space-weather sentinel).
- Theatre authority map at `grimoires/loa/calibration/corona/theatre-authority.md` (per Section 6).
- T4 cleanup: rename + question text + bucket scaffold aligned to NOAA S-scale across README.md, spec/construct.json, src/theatres/proton-cascade.js.
- Butterfreezone marker for CONSTRUCT-README.md autogen (existing BUTTERFREEZONE.md migrated or aliased).
- Reference composition: TREMOR ⟷ CORONA RLMF-cert-pipeline example (one-way if reciprocity is asymmetric — see R2).

**Acceptance**: G0.1-G0.12.

**HITL gate**: ON. Operator confirms before Sprint 1 begins.

### 5.2 Sprint 1 — `composition_paths` Spec Decision for Calibration Artifacts

**Inputs**: Sprint 0 outputs (validator + v3 spec).

**Outputs**:
- `composition_paths.calibration: grimoires/loa/calibration/corona/` declared in canonical spec.
- All Sprint 2-7 artifact paths reserved/documented.
- `grimoires/loa/calibration/corona/` directory scaffolded with placeholder files: `calibration-protocol.md`, `calibration-manifest.json`, `empirical-evidence.md`, `theatre-authority.md` (the latter populated from Sprint 0).

**Acceptance**:
- composition_paths declarations validated by `construct-validate.sh`.
- Path scaffolding committed.
- Sprint 2-7 plans updated with absolute paths.

**HITL gate**: ON. Operator confirms before Sprint 2 begins. **Post-Sprint-1 review revisits autonomous-execution decision for Sprints 2-7.**

### 5.3 Sprint 2 — Frozen Calibration Protocol

**Inputs**: Sprint 1 paths, Theatre authority map (from Sprint 0).

**Outputs** at `grimoires/loa/calibration/corona/calibration-protocol.md`:

- **Primary calibration corpus**: GOES-R era only (2017+), ~15-25 events per theatre, sourced from DONKI archive + GOES X-ray archive + GFZ Kp + DSCOVR L1. Used for parameter fitting, scoring thresholds, and regression gates.
- **Secondary historical stress corpus**: Selected major Solar Cycle 24/25 + exceptional historical events (e.g., Halloween 2003, Carrington-class anomalies). Used for sanity checks, edge-case coverage, narrative confidence. **NOT** used for settlement-critical parameter tuning unless evidence quality is demonstrably comparable to primary.
- **Per-theatre scoring rules** (no TREMOR wholesale reuse):

  | Theatre | Primary metric | Secondary | TREMOR pattern reuse? |
  |---------|----------------|-----------|------------------------|
  | T1 Flare Class | Bucket / Brier | Per-bucket calibration | Pattern: yes; thresholds: per-theatre |
  | T2 Geomagnetic Storm | Bucket / Brier | GFZ-vs-SWPC convergence in regression tier | Pattern: yes; thresholds: per-theatre |
  | T3 CME Arrival | Arrival-window timing-error (MAE in hours) | Within-±6h hit rate (supplementary) | **NO** — TREMOR's bucket model does not apply |
  | T4 Proton Event Cascade (S-scale) | TBD post-Sprint-0 cleanup; expected: bucket-based S-event count over a window | TBD | TBD |
  | T5 Solar Wind Divergence | False-positive rate + stale-feed detection latency + satellite-switch behavior | Hit rate (deprioritized) | **NO** — quality-of-behavior over hit rate |

- **Settlement authority** per Section 6.
- **Pass/marginal/fail thresholds** per theatre — defined per-theatre, NOT inherited from TREMOR wholesale.
- **Regression policy**: any parameter change requires re-run; gate fails if pass/marginal threshold drops.

**Acceptance**: GC.1.

**HITL gate**: revisit per Sprint 1 outcome.

### 5.4 Sprint 3 — Backtest Harness

**Inputs**: Sprint 2 protocol, primary corpus event list.

**Outputs**:
- `scripts/corona-backtest.js` (analog to TREMOR's `scripts/omori-backtest.js`).
- Era-aware DONKI ingestor; **first** a 5-event sanity sample across 2017-2026 before the full ingestor (per assumption #3 mitigation).
- Per-theatre report templates: `grimoires/loa/calibration/corona/run-N/T<id>-report.md`.
- Run 1 baseline (pre-refit) certificates committed at `grimoires/loa/calibration/corona/run-1/`.

**Acceptance**: GC.2.

### 5.5 Sprint 4 — Research Doc for Non-Backtestable Priors

**Inputs**: Sprint 3 baseline (identifies what backtest can/cannot tune); domain literature.

**Outputs** at `grimoires/loa/calibration/corona/empirical-evidence.md`:

- Each non-backtestable parameter documented with:
  - Current value
  - Citation(s) (primary literature preferred)
  - Confidence rating (high / medium / low)
  - `engineering_estimated` flag if applicable
- Settlement-critical engineering-estimated parameters require documented promotion path.
- Coverage targets:
  - **WSA-Enlil sigma** (T3) — primary literature on arrival-time forecast error
  - **Doubt-price floors** (T1, T2) — flare reclassification rates, Kp preliminary-vs-definitive divergence
  - **Wheatland prior** (T4 post-cleanup) — proton-event waiting-time priors
  - **Bz volatility threshold** (T5) — DSCOVR-ACE divergence literature
  - **Source-reliability scores** (GOES primary/secondary, DSCOVR-ACE)
  - **Uncertainty pricing constants** (Normal-CDF threshold-crossing model)

**Acceptance**: GC.3.

### 5.6 Sprint 5 — Refit Parameters + Regression Gate

**Inputs**: Sprint 3 baseline, Sprint 4 evidence.

**Outputs**:
- Updated theatre + processor code with refitted parameters (in-place edits to `src/theatres/*.js` and `src/processor/*.js`; inline citations to manifest entries).
- `grimoires/loa/calibration/corona/calibration-manifest.json` populated per Section 7 schema.
- **Regression gate**: pre-commit hook OR test that fails if any inline parameter diverges from its manifest entry without a corresponding manifest update.
- Run 2 (post-refit) certificates at `grimoires/loa/calibration/corona/run-2/`.
- Per-theatre delta report: pass/marginal/fail vs Sprint 2 thresholds.

**Acceptance**: GC.4, GC.5.

### 5.7 Sprint 6 — Lightweight Security/Input Review

**Inputs**: codebase post-Sprint-5.

**Outputs** at `grimoires/loa/calibration/corona/security-review.md`:

- Input-validation review focused on:
  - SWPC JSON parsing (`src/oracles/swpc.js`) — malformed/null flux handling, satellite-switch robustness, eclipse-season data gaps.
  - DONKI JSON parsing (`src/oracles/donki.js`) — date parsing, missing-field handling, rate-limit / 429 handling.
  - Backtest harness — corpus file integrity, archive-fetch validation.
- **NOT** a deep crypto/auth audit (per user direction; surface area is read-only HTTP, zero auth, zero deps).

**Acceptance**: report committed; no findings block Sprint 7 unless a critical input-injection / infinite-loop / data-loss vector is identified.

### 5.8 Sprint 7 — `construct-validate.sh` + BFZ Refresh + Final Calibration Certificates

**Inputs**: all prior sprint outputs.

**Outputs**:
- `construct-validate.sh` re-run against post-calibration spec — green.
- BUTTERFREEZONE.md (or v3 equivalent) regenerated with post-calibration provenance tags.
- Full primary-corpus run committed at `grimoires/loa/calibration/corona/run-N-final/`.
- Version bump: package.json `0.1.0` → `0.2.0` (or per operator discretion).
- Updated tests reflecting new theatre logic + manifest-regression gate.

**Acceptance**: GF.1-GF.4.

> **Sources**: User amendment (sprint order, theatre authority, manifest schema, scoring rules, scope, execution mode); README.md:115-122; spec/construct.json:13-19,29-50,52-89,91-95; BUTTERFREEZONE.md:35-46; TREMOR reference (omori-backtest pattern); BREATH reference (literature-research pattern).

---

## 6. Theatre Authority Map

> Source: User amendment block (theatre authority is theatre-specific, not DONKI-universal).

| Theatre | Settlement authority — live | Settlement authority — regression | DONKI role |
|---------|-----------------------------|-----------------------------------|------------|
| **T1 Flare Class Gate** | GOES/SWPC X-ray flux | GOES/SWPC X-ray flux | Discovery + label correlation + cross-validation of flare class |
| **T2 Geomagnetic Storm Gate** | SWPC provisional Kp | **GFZ definitive Kp** | Discovery + GST event labels + multi-input enrichment (Bz, speed, CME-arrival linkages) |
| **T3 CME Arrival** | **Observed L1 shock signature** (DSCOVR/ACE — speed jump + Bt increase) | Observed L1 shock signature | Forecast/evidence (WSA-Enlil arrival prediction + halo angle metadata); **NOT settlement** |
| **T4 Proton Event Cascade (S-scale)** | TBD per Sprint 0 cleanup; expected: GOES integral proton flux ≥10 MeV crossing S-scale thresholds | TBD | Discovery + flare-cascade correlation + proton event labels |
| **T5 Solar Wind Divergence** | **Self-resolving** via DSCOVR-ACE Bz volatility comparison + sustained streak detection. Stale-feed and satellite-switch are first-class quality signals, NOT settlement events. | Self-resolving | (none — internal divergence logic) |

**Operative rule**: DONKI is **NOT** a universal settlement oracle. It supplies discovery, labels, correlations, and evidence enrichment. Settlement authority is theatre-specific and instrument-grounded.

---

## 7. Calibration Manifest Schema

> Source: User amendment block (required artifact, not just inline tuned constants).

Each calibrated parameter is recorded as a manifest entry at `grimoires/loa/calibration/corona/calibration-manifest.json`:

```json
{
  "parameter": "string (fully-qualified, e.g. 'theatre.flare_gate.doubt_price_in_progress')",
  "value": "<typed>",
  "theatre": "T1 | T2 | T3 | T4 | T5 | shared",
  "source_type": "backtest | literature | engineering",
  "evidence_source": "string (file path, DOI, PMC ID, URL, or backtest run ID)",
  "confidence": "high | medium | low",
  "corpus_hash": "string (SHA256 of corpus event list at calibration time, or null for non-backtest)",
  "script_hash": "string (SHA256 of corona-backtest.js at calibration time, or null for non-backtest)",
  "derivation": "backtest_derived | literature_derived | engineering_estimated",
  "provisional": "boolean (true if engineering_estimated AND not yet promoted)",
  "settlement_critical": "boolean (true if parameter affects theatre resolution outcome)",
  "promotion_path": "string | null (REQUIRED if provisional AND settlement_critical, e.g. 'Sprint X: backtest with corpus Y')"
}
```

**Source-of-truth rule**: The manifest is the source of truth for parameter provenance. Inline code constants must match manifest values. The Sprint 5 regression gate enforces this.

---

## 8. Technical & Non-Functional Requirements

### 8.1 Stack constraints (preserved)

- Node ≥20.0.0 (package.json:6)
- Zero runtime dependencies (package.json:32)
- Test runner: `node --test`; baseline 60 tests across 21 suites (README.md:115-122)
- All v3 + calibration work MUST preserve the zero-dep posture.

### 8.2 v3 Conventions (target state)

Per `Construct Creater README.md:78-88`:

- `schema_version: 3`
- Explicit `streams:` block (Intent + Operator-Model in / Verdict + Artifact + Signal out)
- `identity/CORONA.md` persona file
- Butterfreezone marker for CONSTRUCT-README.md autogen
- `composition_paths:` (grimoires-as-interface per doctrine v5 §17.4)
- `commands:` array — 5 theatre commands (`/flare-gate`, `/geomag-gate`, `/cme-arrival`, `/proton-cascade`, `/sw-divergence` from spec/construct.json:13-19)
- `compose_with:` declarations (TREMOR for Sprint 0; future cycles may add more)
- `pack_dependencies:` (likely empty initially; document intent)

### 8.3 Calibration Corpus (two-tier)

> Source: User amendment block (Phase 4-5 batch Q4).

| Tier | Window | Approx size | Used for |
|------|--------|-------------|----------|
| Primary | GOES-R era (2017+) | ~15-25 events per theatre | Parameter fitting, scoring thresholds, regression gates |
| Secondary | SC24/25 + exceptional historical | ad hoc, evidence-quality-gated | Sanity checks, edge-case coverage; NOT settlement-critical tuning unless evidence matches primary |

### 8.4 Per-Theatre Scoring (no TREMOR wholesale reuse)

| Theatre | Primary metric | Secondary metric |
|---------|----------------|------------------|
| T1 | Bucket-Brier | Per-bucket calibration |
| T2 | Bucket-Brier | GFZ-vs-SWPC convergence (regression tier) |
| T3 | Arrival-window timing error (MAE in hours) | Within-±6h hit rate |
| T4 | TBD post-Sprint-0 S-scale cleanup | TBD |
| T5 | False-positive rate + stale-feed detection latency + satellite-switch behavior | Hit rate (deprioritized) |

### 8.5 Engineering-Estimated Parameter Policy

> Source: User amendment §6.

- Engineering-estimated parameters are allowed.
- MUST be marked `provisional: true` in manifest.
- Settlement-critical engineering-estimated parameters MUST have a documented `promotion_path` to `literature_derived` or `backtest_derived`.
- Non-settlement-critical or clearly-bounded parameters MAY remain provisional indefinitely.

### 8.6 Schema Stability Risk Mitigation

The v3 schema landed 2026-04-22 (`Construct Creater README.md:78`). Mitigations:

- Sprint 0 acquires `construct-validate.sh` source, not just runs it.
- Schema commit hash recorded in `pack_dependencies` if construct-base/construct-creator schema is referenced.
- BUTTERFREEZONE.md (or v3 equivalent) records the schema version in effect at calibration time.

> **Sources**: package.json:6,32; README.md:115-122; `Construct Creater README.md:78-88`; user amendment §3-§5.

---

## 9. Scope & Prioritization

### 9.1 In Scope (this cycle)

- CORONA v3 readiness migration (Sprint 0).
- composition_paths spec decision (Sprint 1).
- CORONA hybrid calibration for all 5 theatres (Sprints 2-5).
- Theatre authority map (Sprint 0).
- Calibration manifest with provenance schema (Sprint 5).
- Lightweight input-validation security review (Sprint 6).
- Reference composition with TREMOR (Sprint 0).
- Final validate.sh + BFZ refresh + final certificates (Sprint 7).

### 9.2 Out of Scope (this cycle)

> Source: User amendment scope note.

- TREMOR v3 migration (deferred to a separate cycle).
- BREATH v3 migration (deferred to a separate cycle).
- Echelon theatre-api integration as Sprint 0 reference composition (defer; documented as future canonical integration target).
- Deep crypto/auth security audit (surface area is read-only HTTP, zero auth, zero deps).
- Cross-construct `compose_with` declarations beyond TREMOR (defer).
- R-scale radio-blackout theatre (deferred; T4 stays proton/S-scale per user direction; if a future R-scale theatre is desired, it gets its own slot).
- Pre-2017 calibration corpus inclusion as primary tier (secondary stress-corpus only).

### 9.3 MVP Definition

The MVP is **"construct-network deployable + first calibration run committed"**:

- Sprint 0-1 complete (v3 ready, paths locked).
- Sprint 2 protocol committed (corpus + scoring rules).
- Sprint 3 baseline backtest run (Run 1 certificates).
- Sprint 4 evidence doc covers non-backtestable priors.
- Sprint 5 refit + regression gate active.

Sprints 6-7 polish the MVP; Sprint 7 cuts the v0.2.0 tag.

---

## 10. Risks & Dependencies

| # | Risk / Dependency | Impact | Mitigation |
|---|-------------------|--------|-----------|
| R1 | `construct-validate.sh` not found in construct-base or construct-creator | Sprint 0 scope expands ~1-2 days to build a local validator | Sprint 0 first task: acquire validator. If not found, surface as blocker BEFORE schema migration. |
| R2 | TREMOR's `compose_with` declarations don't reciprocate cleanly | Sprint 0 reference composition weakens (CURATOR's structure-lens critique) | Read TREMOR's spec read-only first; if reciprocity is one-sided, document the asymmetry rather than mutate TREMOR. |
| R3 | DONKI archive returns inconsistent shapes across 2017-2026 | Sprint 3 harness needs era-aware response normalization | Sprint 3 begins with 5-event sanity sample before full ingestor. |
| R4 | DONKI rate limit (`DEMO_KEY` = 40 req/hr per IP) bottlenecks backtest | Backtest run time extends; calibration cycle slows | Use authenticated `NASA_API_KEY` (1000 req/hr) for backtest; document key handling in Sprint 3. |
| R5 | GFZ Kp definitive lag (~30 days) | T2 regression tier cannot include events from last 30 days | Acceptable — secondary corpus and live tier cover this; document explicitly in Sprint 2 protocol. |
| R6 | DSCOVR launched Feb 2015; pre-2015 events lack L1 solar wind | Pre-2017 events are secondary corpus only; not used for settlement-critical tuning | Already addressed by primary/secondary corpus split (§8.3). |
| R7 | v3 schema is fresh (landed 2026-04-22); may evolve mid-cycle | Sprint 0 work could become rework | Pin schema commit hash; revisit at Sprint 7 (§8.6). |
| R8 | T3 timing-error metric specifics TBD | Sprint 2 protocol freeze cannot complete without metric definition | Sprint 2 explicitly owns metric definition; Sprint 0/1 do not block on it. |
| R9 | T5 quality-of-behavior metrics TBD | Sprint 2 protocol freeze cannot complete without metric definition | Same as R8 — Sprint 2 owns it. |
| R10 | T4 S-scale code-vs-naming may already be inconsistent | Sprint 0 cleanup scope may expand | Sprint 0 first inspects `src/theatres/proton-cascade.js` before deciding cleanup scope. |
| R11 | v3 `streams:` taxonomy (Intent / Operator-Model / Verdict / Artifact / Signal) may not map cleanly to CORONA's existing oracle-bundle model | Sprint 0 stream-typing may require non-trivial conceptual mapping | Sprint 0 dedicates a planning subtask to map CORONA's `bundles` / `theatre_refs` model onto v3 stream taxonomy before the schema rewrite. |

> **Sources**: User amendment; BUTTERFREEZONE.md:35-46,156-159; spec/construct.json:97-103; `Construct Creater README.md:78`; src/index.js:23-58.

---

## 11. Open Decisions (Deferred to Specific Sprints)

> User instruction: lock the current plan, mark deferred decisions to the sprint where they belong.

| Decision | Owner sprint | Default if not decided |
|----------|--------------|------------------------|
| Canonical spec format (`construct.yaml` vs `construct.json`) | **Sprint 0** (post-validator inspection) | Default to YAML if validator expects YAML; preserve both files until decision is final. Do NOT delete spec/corona_construct.yaml or spec/construct.json prematurely. |
| T3 arrival-window scoring metric specifics (MAE? RMS? within-window hit-rate weight?) | **Sprint 2** (protocol freeze) | Sprint 2 must produce concrete metric definition before backtest harness consumes it. |
| T5 false-positive / stale-feed / satellite-switch concrete metric specifics | **Sprint 2** (protocol freeze) | Sprint 2 must produce concrete metric definition. |
| T4 S-scale bucket boundaries post-cleanup | **Sprint 0** (cleanup) feeds **Sprint 2** (scoring) | Sprint 0 produces clean naming + bucket scaffold; Sprint 2 binds to corpus. |
| Full autonomous execution mode for Sprints 2-7 | **Revisit post-Sprint-1** | Default: HITL until authority map / T4 / validator / paths are locked. |
| Echelon theatre-api integration as canonical compose target | **Future cycle** | Documented as future canonical, not Sprint 0. |
| Engineering-estimated parameter promotion deadline (per-param vs global) | **Sprint 5** (refit + manifest) | Per-parameter `promotion_path` field; no global deadline. |
| `compose_with:` symmetry — reciprocate from TREMOR side, or accept asymmetric in this cycle | **Sprint 0** (after reading TREMOR spec) | Accept asymmetric this cycle; do not mutate TREMOR. Document the asymmetry. |

---

## 12. Glossary

> **Sources**: README.md, BUTTERFREEZONE.md, NOAA/NASA reference docs, `Construct Creater README.md`.

- **Theatre** — stateful prediction market with position history; CORONA has 5 (T1-T5).
- **RLMF** — Reinforcement-Learning-from-Market-Feedback; certificate format shared across Echelon constructs (spec/construct.json:91-95).
- **Brier score** — mean squared deviation between predicted probabilities and actual outcomes.
- **Bucket-Brier** — bucket-based variant; predicted bucket probabilities scored against actual bucket outcome (TREMOR pattern).
- **GOES** — NOAA's Geostationary Operational Environmental Satellite; X-ray flux source.
- **GOES-R era** — GOES-16 (operational 2017+) and successors; better calibration than GOES-13/15.
- **DONKI** — NASA's Database Of Notifications, Knowledge, Information; event archive API. Discovery + labels + correlations + evidence enrichment, NOT universal settlement.
- **SWPC** — NOAA's Space Weather Prediction Center; provisional Kp + real-time feeds.
- **GFZ** — GFZ Potsdam; definitive Kp index (~30-day lag, T2 regression authority).
- **WSA-Enlil** — solar-wind heliospheric model; CME arrival forecast (T3 evidence, NOT settlement).
- **DSCOVR** — NOAA L1 spacecraft (operational 2015+); real-time solar wind, T3 / T5 source.
- **ACE** — NASA L1 spacecraft (older); cross-validation source for T5 divergence.
- **Kp** — planetary magnetic activity index, 0-9.
- **G-scale** — geomagnetic storm scale (G1-G5, derived from Kp).
- **S-scale** — NOAA solar radiation storm scale (S1-S5, integral proton flux ≥10 MeV).
- **R-scale** — NOAA radio blackout scale (R1-R5, X-ray flux); deferred from T4 per user direction.
- **CME** — coronal mass ejection.
- **Bz** — solar wind magnetic field z-component; geomagnetic storm precursor.
- **L1** — Earth-Sun Lagrange point 1 (~1.5 million km sunward).
- **construct.yaml / construct.json** — canonical construct manifest; v3 source-of-truth format TBD post-validator inspection.
- **construct-validate.sh** — v3 schema validator; acquired in Sprint 0 from construct-base or construct-creator.
- **composition_paths** — v3 declaration of grimoire-paths-as-interface (per doctrine v5 §17.4).
- **compose_with** — v3 declaration of inter-construct composition partners (symmetric reciprocation expected; this cycle accepts asymmetric).
- **pack_dependencies** — v3 declaration of construct-pack dependencies (e.g., URL-installed git refs).
- **CURATOR** — construct-creator's persona; 5-lens critique (knowledge, craft, depth, structure, perceptual).
- **Butterfreezone (BFZ)** — token-efficient, provenance-tagged project summary file (CONSTRUCT-README.md autogen target in v3).
- **HITL** — Human-In-The-Loop. Sprint 0 + Sprint 1 are gated; Sprints 2-7 revisit post-Sprint-1.

---

## 13. Sources Index

### 13.1 Primary inputs

- User amendment block (2026-04-30 `/discovering-requirements` invocation) — sprint order, theatre authority, manifest schema, scoring rules, scope, execution mode, T4 cleanup direction, engineering-estimated policy.
- README.md — construct overview, theatre summary, calibration edge cases.
- BUTTERFREEZONE.md — code-grounded reality summary with provenance tags.
- spec/construct.json — canonical metadata (current).
- spec/corona_construct.yaml — partial reference metadata.
- src/index.js — CoronaConstruct class + lifecycle + processing.
- package.json — runtime constraints.
- grimoires/loa/context/Construct Creater README.md — v3 schema reference.

### 13.2 Reference patterns (read-only, no modifications)

- TREMOR (`C:\Users\0x007\tremor`) — backtest-driven calibration recipe.
  - `scripts/omori-backtest.js` (~1100 lines)
  - `grimoires/loa/calibration/omori-backtest-protocol.md`
  - `grimoires/loa/calibration/omori-backtest/run-1..6/`
  - `src/theatres/aftershock.js` (REGIME_PARAMS as in-code parameter store)
- BREATH (`C:\Users\0x007\breath`) — literature-driven calibration recipe.
  - `grimoires/loa/empirical-validation-research.md` (531 lines, 62 citations)
  - `grimoires/loa/Sprint3-Empirical Calibration.md`

### 13.3 Phase-question references (this discovery session)

- Phase 0 confirmation: corrections absorbed (scope, T4, validator, paths, scoring, engineering-estimated, execution mode).
- Phase 4-5 batch (4 questions):
  - Q1 Spec consolidation → Sprint 0 decides post-validator.
  - Q2 Reference composition → TREMOR.
  - Q3 Persona handle → `identity/CORONA.md`.
  - Q4 Backtest corpus → two-tier (primary GOES-R era + secondary stress).
- Pre-generation gate: PRD locked decision-oriented; deferred decisions tracked in Section 11.

### 13.4 Configuration

- `.loa.config.yaml` — interview defaults: thorough mode, sequential pacing, all gates ON, `no_infer: true`, `min_confirm: 1`.
- `grimoires/loa/context/config_snapshot.json` — config snapshot at session start.

---

> **End of PRD.** Next workflow stage: `/architect` (or `/plan` for golden-path routing) to produce the SDD that translates this PRD into system design.
