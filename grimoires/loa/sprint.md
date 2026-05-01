# Sprint Plan — CORONA: v3 Construct-Network Readiness + Hybrid Calibration

**Version:** 1.0
**Date:** 2026-04-30
**Author:** Sprint Planner Agent
**PRD Reference:** [grimoires/loa/prd.md](prd.md)
**SDD Reference:** [grimoires/loa/sdd.md](sdd.md)
**Cycle:** `cycle-001-corona-v3-calibration`
**Ledger:** [grimoires/loa/ledger.json](ledger.json)

> **Brownfield grounding banner**: This sprint plan inherits the brownfield grounding posture of the PRD and SDD. Both documents were authored without `/ride` codebase analysis; reality grounding is provided by the existing provenance-tagged BUTTERFREEZONE.md (CODE-FACTUAL / DERIVED / OPERATIONAL annotations) and direct file inspection of `spec/`, `src/`, and `package.json`. `/ride` was deliberately skipped on 2026-04-30 by joint operator-agent decision. If reality drift is suspected at any point during execution, run `/ride` and `/plan-and-analyze --fresh` to refresh.

> **Operator hard constraints**:
> 1. **Sprint 0 + Sprint 1 are SMALL, REVIEWABLE, INDEPENDENTLY SHIPPABLE — both are HITL-gated.** Operator reviews each at completion before next-sprint authorization.
> 2. **Sprints 2-7 are sketched at outline level** (acceptance criteria + Beads tasks + key dependencies). Post-Sprint-1 review may re-prioritize. Detailed task-level decomposition for Sprints 2-7 deferred to their respective `/sprint-plan` refinement runs OR `/run sprint-plan` execution.
> 3. **TREMOR and BREATH repos are read-only references** (PRD §13.2). DO NOT mutate.
> 4. **Tech stack invariants** (PRD §8.1): Node ≥20, **zero runtime dependencies**, `node --test` runner. Any task that would add runtime deps MUST be flagged for operator review BEFORE implementation.
> 5. **All calibration artefacts** under `grimoires/loa/calibration/corona/` — no alternative paths.

---

## Executive Summary

CORONA is a partially-implemented Echelon construct (5 theatres, 60 tests passing, version 0.1.0) that requires two parallel uplifts before network deployment:

1. **v3 Construct-Network Readiness migration** — adopting the conventions established by construct-creator's PR #11 (merged 2026-04-22).
2. **Parameter calibration** — a hybrid recipe combining TREMOR-style backtests (theatres with clean ground truth) and BREATH-style literature research (sigma priors and uncertainty constants).

The work spans **8 sprints (0-7)** sequenced as a single development cycle. Sprint 0 and Sprint 1 carry HITL gates; the autonomous-execution decision for Sprints 2-7 is revisited post-Sprint-1.

**Total Sprints:** 8 (0-7)
**Sprint Sizing:**
- **SMALL** (1-3 tasks): Sprint 1, Sprint 4, Sprint 6
- **MEDIUM** (4-6 tasks): Sprint 2, Sprint 7
- **LARGE** (7-10 tasks): Sprint 0 (7), Sprint 3 (8), Sprint 5 (7)

**MVP definition** (PRD §9.3): construct-network deployable + first calibration run committed (Sprints 0-5). Sprints 6-7 polish the MVP; Sprint 7 cuts the v0.2.0 tag.

> **Sources**: PRD §1, §5, §9.3; SDD §12 Development Phases.

---

## Sprint Overview

| Sprint | Theme | Scope | Tasks | HITL Gate | Key Deliverables | Dependencies |
|--------|-------|-------|-------|-----------|------------------|--------------|
| 0 | v3 Readiness + Theatre Authority + T4 Cleanup | LARGE | 7 | **ON** | validator green, v3 spec, identity/CORONA.md, theatre-authority.md, T4 S-scale scaffold, TREMOR ref composition | None |
| 1 | composition_paths Spec + Calibration Directory Scaffold | SMALL | 3 | **ON** | composition_paths declared, calibration/ directory scaffolded, Sprint 2-7 plans absolute-path-updated | Sprint 0 |
| 2 | Frozen Calibration Protocol | MEDIUM | 5 | revisit post-S1 | calibration-protocol.md (corpus tiers, T3/T4/T5 metric specifics, pass/marginal/fail) | Sprint 1 |
| 3 | Backtest Harness + Run-1 Baseline | LARGE | 8 | revisit post-S1 | scripts/corona-backtest/, primary corpus, run-1/ certificates | Sprint 2 |
| 4 | Empirical Evidence Research | SMALL | 3 | revisit post-S1 | empirical-evidence.md (literature-derived priors + promotion paths) | Sprint 3 |
| 5 | Refit Parameters + Manifest + Regression Gate | LARGE | 7 | revisit post-S1 | refitted theatre + processor params, calibration-manifest.json, regression test, run-2/ | Sprint 4 |
| 6 | Lightweight Input-Validation Review | SMALL | 3 | revisit post-S1 | security-review.md (SWPC + DONKI + corpus-loader checklist) | Sprint 5 |
| 7 | Final Validate + BFZ Refresh + v0.2.0 Tag | MEDIUM | 5 | revisit post-S1 | validator green, BFZ refreshed, run-N-final/, v0.2.0 tag, E2E goal validation | Sprint 6 |

**Beads epic IDs** (one epic per sprint, see `Sprint Ledger` for global numbering):

| Sprint | Beads Epic | Beads Task IDs |
|--------|-----------|----------------|
| 0 | `corona-d5z` | `corona-3sh` `corona-qv8` `corona-1r5` `corona-222` `corona-1mv` `corona-1g6` `corona-3oh` |
| 1 | `corona-2b7` | `corona-26g` `corona-2o8` `corona-ra2` |
| 2 | `corona-1so` | `corona-b5v` `corona-2bv` `corona-19q` `corona-fnb` `corona-31y` |
| 3 | `corona-d4u` | `corona-v9m` `corona-2jq` `corona-1ks` `corona-2iu` `corona-70s` `corona-aqh` `corona-2ox` `corona-2b5` |
| 4 | `corona-uqt` | `corona-2zs` `corona-1ve` `corona-36t` |
| 5 | `corona-3fg` | `corona-28z` `corona-8yb` `corona-25p` `corona-3o4` `corona-15v` `corona-3ja` `corona-33u` |
| 6 | `corona-16a` | `corona-r4y` `corona-8m8` `corona-a6z` |
| 7 | `corona-1ml` | `corona-32r` `corona-8v2` `corona-1p5` `corona-w1v` `corona-2k3` |

---

## Goals (extracted from PRD §3)

PRD goal IDs are **G0.1-G0.12** (Sprint 0 acceptance), **GC.1-GC.5** (calibration acceptance, Sprints 2-5), and **GF.1-GF.4** (final acceptance, Sprint 7). These IDs are referenced verbatim in the Goal Mapping appendix and the technical task annotations throughout this document.

---

## Sprint 0: v3 Construct-Network Readiness + Theatre Authority Map + T4 Cleanup

**Scope:** LARGE (7 tasks)
**HITL Gate:** ON — Operator confirms before Sprint 1 begins
**Beads Epic:** `corona-d5z`

### Sprint Goal
Deliver a v3-compliant canonical spec with a green `construct-validate.sh`, a written persona file and theatre authority map, a clean T4 S-scale scaffold, and a TREMOR reference composition example — all without deleting either legacy spec file.

### Deliverables
- [x] `construct-validate.sh` acquired from construct-base or construct-creator (source documented in `grimoires/loa/calibration/corona/sprint-0-notes.md`)
- [x] Canonical v3 spec file authored (format YAML vs JSON decided **post-validator inspection**)
- [x] Both legacy files (`spec/construct.json`, `spec/corona_construct.yaml`) **preserved on disk**
- [x] `identity/CORONA.md` persona file written (observer-of-the-Sun framing)
- [x] `streams:` block authored (Intent + Operator-Model in / Verdict + Artifact + Signal out per Construct Creater README:32,82)
- [x] T4 cleanup: `src/theatres/proton-cascade.js` + `spec/construct.json` + `README.md` aligned to NOAA S-scale
- [x] `grimoires/loa/calibration/corona/theatre-authority.md` authored (PRD §6 verbatim + provenance citations)
- [x] `examples/tremor-rlmf-pipeline.md` written (documentation only, NO runtime coupling)
- [x] `construct-validate.sh` runs **green** OR validator-acquisition blocker surfaced to operator

### Acceptance Criteria
- [x] **G0.1**: `schema_version: 3` set in canonical spec file; validator green
- [x] **G0.2**: Explicit `streams:` block present per Construct Creater README:32,82
- [x] **G0.3**: `identity/CORONA.md` exists with distinct voice and observer-of-the-Sun framing
- [x] **G0.5**: `commands:` array enumerates all 5 theatre commands (T1-T5 from spec/construct.json:13-19)
- [x] **G0.6**: `compose_with: [tremor]` declared with reciprocity-asymmetry note (TREMOR is read-only reference per R2 mitigation)
- [x] **G0.7**: `pack_dependencies:` array declared (empty initially is acceptable)
- [x] **G0.8**: `construct-validate.sh` source documented in Sprint 0 notes; runs green against CORONA
- [x] **G0.9**: Butterfreezone marker for CONSTRUCT-README.md autogen path declared
- [x] **G0.10**: TREMOR reference composition committed (markdown + optional static integration test)
- [x] **G0.11**: `theatre-authority.md` committed at `grimoires/loa/calibration/corona/theatre-authority.md`
- [x] **G0.12**: T4 naming/question/buckets aligned to NOAA S-scale across spec/construct.json, README.md, src/theatres/proton-cascade.js
- [x] Both legacy spec files (`spec/construct.json`, `spec/corona_construct.yaml`) **remain on disk** at end of sprint

### Technical Tasks

> Each task corresponds to a Beads issue. Operator hard constraint D enforces this granularity — do NOT collapse below this level.

- [x] **Task 0.1** (`corona-3sh`, P0): `sprint-0-acquire-validator` — Acquire `construct-validate.sh` from construct-base or construct-creator. Document source path + commit SHA in `grimoires/loa/calibration/corona/sprint-0-notes.md`. → **[G0.8]** → Refs PRD §10 R1, SDD §4.2
- [x] **Task 0.2** (`corona-qv8`, P1): `sprint-0-write-identity-corona-md` — Author `identity/CORONA.md` persona file with observer-of-the-Sun framing. → **[G0.3]** → Refs PRD §5.1, SDD §4.4
- [x] **Task 0.3** (`corona-1r5`, P0): `sprint-0-v3-spec-migration-with-streams` — POST-validator inspection: (a) decide canonical format (YAML vs JSON), (b) author v3 spec with `schema_version: 3`, `streams:` block, `commands:`, `compose_with: [tremor]`, `pack_dependencies: []`, `composition_paths` placeholder, BFZ autogen marker. **DO NOT delete or rename `spec/construct.json` or `spec/corona_construct.yaml`.** → **[G0.1, G0.2, G0.5, G0.6, G0.7, G0.9]** → Refs PRD §5.1, §11; SDD §4.4-§4.5; **depends on** Task 0.1 + Task 0.4
- [x] **Task 0.4** (`corona-222`, P0): `sprint-0-cleanup-t4-rscale-to-sscale-scaffold` — Inspect `src/theatres/proton-cascade.js:1-50` (currently uses R-scale + flareRank). Rename `R_SCALE_THRESHOLDS` → `S_SCALE_THRESHOLDS`, switch threshold source from X-ray flux to integral proton flux ≥10 MeV crossings, update doc comments, update T4 description in `spec/construct.json:74-81` and `README.md`, update tests pinned to R-scale terminology. **Bucket boundaries are SCAFFOLD ONLY — Sprint 2 binds them.** → **[G0.12]** → Refs PRD §5.1, §11; SDD §3.4
- [x] **Task 0.5** (`corona-1mv`, P1): `sprint-0-write-theatre-authority-map` — Author `grimoires/loa/calibration/corona/theatre-authority.md` containing PRD §6 verbatim + per-row provenance citations (NOAA SWPC docs, GOES X-ray service, GFZ Kp policy, DSCOVR mission spec) + DONKI-not-a-universal-oracle disclaimer. → **[G0.11]** → Refs PRD §6; SDD §5.4; **depends on** Task 0.1
- [x] **Task 0.6** (`corona-1g6`, P2): `sprint-0-tremor-reference-composition-docs` — Author `examples/tremor-rlmf-pipeline.md` showing the conceptual TREMOR ⟷ CORONA RLMF cert pipeline. Document asymmetry note (CORONA declares `compose_with: [tremor]`; TREMOR not mutated this cycle per PRD §10 R2). **MARKDOWN ONLY** — no runtime imports, no shell-out to TREMOR. Optional `tests/integration/tremor-cert-shape.test.js` may ship in Sprint 0 if low-friction (decision deferred to implementation). → **[G0.10]** → Refs PRD §5.1; SDD §9.2; **depends on** Task 0.1
- [x] **Task 0.7** (`corona-3oh`, P0): `sprint-0-validator-green-or-surface-blocker` — Run `construct-validate.sh` against the new spec. Iterate until green. If validator cannot be acquired in Task 0.1 OR a structural blocker surfaces, **STOP and surface to operator** per PRD §10 R1 mitigation; do NOT synthesise schema from `Construct Creater README.md` alone. → **[G0.1, G0.8]** → Refs PRD §10 R1; SDD §4.2; **depends on** Tasks 0.1-0.6 (all)

### Dependencies
- **None** (Sprint 0 is the cycle entry point)
- External: construct-base or construct-creator repository accessibility (R1 risk)

### Security Considerations
- **Trust boundaries**: `construct-validate.sh` is acquired from a trusted internal source (construct-base / construct-creator). Document acquisition source + commit SHA in sprint-0-notes.md to ensure provenance.
- **External dependencies**: ZERO new runtime deps (PRD §8.1 hard constraint). The validator is a tool, not a runtime dependency.
- **Sensitive data**: None introduced by Sprint 0.

### Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R1**: `construct-validate.sh` not in construct-base/construct-creator | Med | High | Task 0.1 is FIRST. Surface blocker immediately if absent; do NOT synthesise schema (SDD §4.2). |
| **R2**: TREMOR's `compose_with` doesn't reciprocate | Med | Low | Read TREMOR spec read-only first; document asymmetry in sprint-0-notes.md (SDD §9). |
| **R10**: T4 R-scale-vs-naming inconsistency wider than expected | High | Low | Task 0.4 first inspects `src/theatres/proton-cascade.js` before committing scope (SDD §3.4). |
| **R11**: v3 `streams:` taxonomy doesn't map cleanly to bundle/theatre_refs model | Med | Med | Task 0.3 includes a planning subtask for the mapping (SDD §4.5); document in sprint-0-notes.md. |

### Success Metrics
- `construct-validate.sh` exits 0 against new canonical spec (G0.1, G0.8)
- 60 baseline tests still pass (`node --test tests/corona_test.js`)
- Both legacy spec files present at end of sprint (operator hard constraint #2)
- `theatre-authority.md` cites instrument-grounded authority for all 5 theatres (G0.11)

### HITL Gate
**ON.** Operator reviews all deliverables before Sprint 1 authorization. The gate validates:
1. Validator green (or blocker correctly surfaced)
2. Both legacy files preserved
3. T4 cleanup is bounded (no R-scale theatre code surface remaining)
4. Theatre authority map is provenance-cited
5. No runtime deps introduced

---

## Sprint 1: composition_paths Spec + Calibration Directory Scaffold

**Scope:** SMALL (3 tasks)
**HITL Gate:** ON — Operator confirms before Sprint 2 + revisits autonomous-execution decision for Sprints 2-7
**Beads Epic:** `corona-2b7`

### Sprint Goal
Lock `composition_paths.calibration` in the canonical v3 spec, scaffold the calibration artefact directory, and update Sprint 2-7 task descriptions with absolute paths so downstream sprints have unambiguous targets.

### Deliverables
- [x] `composition_paths.calibration: grimoires/loa/calibration/corona/` declared in canonical v3 spec
- [x] `grimoires/loa/calibration/corona/` scaffolded with placeholder files: `calibration-protocol.md`, `calibration-manifest.json`, `empirical-evidence.md`
- [x] (`theatre-authority.md` already populated from Sprint 0 — no new creation)
- [x] Sprint 2-7 Beads task descriptions updated with absolute artefact paths

### Acceptance Criteria
- [x] **G0.4**: `composition_paths` declarations validated by `construct-validate.sh` (still green)
- [x] All Sprint 2-7 artefact paths reserved/documented in placeholder files
- [x] Path scaffolding committed
- [x] 60 baseline tests still pass

### Technical Tasks

- [x] **Task 1.1** (`corona-26g`, P0): `sprint-1-declare-composition-paths` — Declare `composition_paths.calibration: grimoires/loa/calibration/corona/` in canonical v3 spec. Re-run `construct-validate.sh` to confirm green. → **[G0.4]** → Refs PRD §5.2, §8.2; SDD §4.4; **depends on** Sprint 0 final gate (Task 0.7)
- [x] **Task 1.2** (`corona-2o8`, P1): `sprint-1-scaffold-calibration-directory` — Create placeholder files at `grimoires/loa/calibration/corona/`: `calibration-protocol.md` (with TBD markers for Sprint 2), `calibration-manifest.json` (empty array `[]` per PRD §7), `empirical-evidence.md` (with TBD markers for Sprint 4). Add `corpus/README.md` documenting directory purpose. → **[GC.1, GC.3, GC.4]** → Refs PRD §5.2; SDD §5.1; **depends on** Task 1.1
- [x] **Task 1.3** (`corona-ra2`, P2): `sprint-1-update-sprint-plans-with-absolute-paths` — Walk Sprints 2-7 Beads tasks; update task descriptions with absolute paths (e.g. `grimoires/loa/calibration/corona/run-1/T1-report.md` rather than relative paths). → Refs PRD §5.2; SDD §5.1; **depends on** Task 1.2

### Dependencies
- **Sprint 0**: validator green (Task 0.7) gates spec change; theatre-authority.md must already exist before scaffold

### Security Considerations
- **Trust boundaries**: None new. Scaffold is empty/placeholder content.
- **External dependencies**: ZERO new deps.
- **Sensitive data**: None introduced.

### Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Validator regression after `composition_paths` addition | Low | Med | Task 1.1 re-runs validator immediately; revert if regression (revisit Task 0.3 schema design). |
| Sprint 2-7 path drift if scaffolding files relocate later | Low | Low | Task 1.3 explicitly fixes paths in Beads task descriptions; future relocations require Beads update. |

### Success Metrics
- `construct-validate.sh` exits 0 with `composition_paths` declared
- All four placeholder files exist at scaffold paths
- 60 baseline tests still pass

### HITL Gate
**ON.** Operator reviews:
1. `composition_paths` correctly declared (validator still green)
2. Scaffold structure matches SDD §5.1
3. **Decision point**: Switch Sprints 2-7 to autonomous (`/run sprint-plan`) OR continue HITL per sprint? Default: HITL until authority map / T4 / validator / paths are locked (PRD §11 Q5). Sprint 1 closing review revisits this.

---

## Sprint 2: Frozen Calibration Protocol

**Scope:** MEDIUM (5 tasks)
**HITL Gate:** Revisit per Sprint 1 outcome (default HITL)
**Beads Epic:** `corona-1so`

> **Outline-level sketch.** Detailed task-level decomposition deferred to a `/sprint-plan` refinement run after Sprint 1 closes, OR to `/run sprint-plan` execution. The acceptance criteria below are operator-locked.

### Sprint Goal
Resolve PRD §11 open decisions for T3 timing-error metric, T4 S-scale bucket boundaries, and T5 quality-of-behavior metric. Produce a frozen `calibration-protocol.md` that defines per-theatre scoring rules, pass/marginal/fail thresholds, and the regression policy.

### Deliverables
- [x] `grimoires/loa/calibration/corona/calibration-protocol.md` written and frozen
- [x] Primary corpus rules defined (GOES-R era 2017+, ~15-25 events per theatre)
- [x] Secondary stress corpus rules defined (SC24/25 + historical exceptional)
- [x] T3 arrival-window metric **specifics** bound (PRD §11 Q2)
- [x] T4 S-scale bucket boundaries **bound to corpus** (PRD §11 Q4 — Sprint 0 produced scaffold; Sprint 2 binds)
- [x] T5 quality-of-behavior metric **specifics** bound (PRD §11 Q3)
- [x] Per-theatre pass/marginal/fail thresholds defined
- [x] Regression policy declared (any parameter change requires re-run; gate fails if threshold drops)

### Acceptance Criteria
- [x] **GC.1**: Frozen calibration protocol committed
- [x] PRD §11 open decisions Q2, Q3, Q4 resolved
- [x] Per-theatre scoring rules documented per PRD §5.3 / §8.4 (no TREMOR wholesale reuse)
- [x] Settlement authority cross-references `theatre-authority.md` per PRD §6

### Technical Tasks (outline)

- [x] **Task 2.1** (`corona-b5v`): `sprint-2-define-corpus-tiers` — Document primary + secondary corpus rules, evidence-quality gate logic. → **[GC.1]**
- [x] **Task 2.2** (`corona-2bv`): `sprint-2-bind-t3-timing-metric` — Concrete T3 arrival-window MAE + within-±6h hit rate definition (PRD §11 Q2). → **[GC.1]**
- [x] **Task 2.3** (`corona-19q`): `sprint-2-bind-t4-bucket-boundaries` — Bind T4 S-scale bucket boundaries to corpus events (PRD §11 Q4). → **[GC.1, G0.12]**
- [x] **Task 2.4** (`corona-fnb`): `sprint-2-bind-t5-quality-metric` — Concrete T5 FP rate / stale-feed latency / satellite-switch behavior definition (PRD §11 Q3). → **[GC.1]**
- [x] **Task 2.5** (`corona-31y`): `sprint-2-author-protocol-md` — Compile findings into `calibration-protocol.md` with pass/marginal/fail thresholds + regression policy. → **[GC.1]**

### Dependencies
- **Sprint 1**: composition_paths declared; calibration directory scaffolded
- **Sprint 0**: theatre-authority.md, T4 S-scale scaffold (provides bucket-binding starting point)

### Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| **R5**: GFZ Kp definitive lag (~30 days) — T2 regression tier excludes events from last 30 days | Document explicitly in protocol per PRD §10 R5 |
| **R8**: T3 timing-error specifics TBD | Sprint 2 explicitly owns metric (PRD §11 Q2); Task 2.2 |
| **R9**: T5 quality-of-behavior specifics TBD | Sprint 2 explicitly owns metric (PRD §11 Q3); Task 2.4 |

### Success Metrics
- All open decisions Q2/Q3/Q4 resolved
- Calibration protocol unambiguous enough that Sprint 3 backtest harness can implement against it
- No reliance on TREMOR's bucket model for T3 or T5 (PRD §5.3)

---

## Sprint 3: Backtest Harness + Run-1 Baseline

**Scope:** LARGE (8 tasks)
**HITL Gate:** Revisit per Sprint 1 outcome
**Beads Epic:** `corona-d4u`

> **Outline-level sketch.** Refined post-Sprint-1.

### Sprint Goal
Build the `scripts/corona-backtest/` harness with era-aware DONKI ingestor, separate per-theatre scoring modules (no shared code per operator hard constraint #5), commit the primary corpus, and execute Run 1 producing baseline (pre-refit) certificates at `grimoires/loa/calibration/corona/run-1/`.

### Deliverables
- [x] `scripts/corona-backtest.js` orchestrator + `scripts/corona-backtest/` sub-folder per SDD §6.1
- [x] 5-event sanity-sample harness (R3 mitigation) MUST PASS before full ingestor build
- [x] Era-aware DONKI ingestor handling 2017-2026 shape variance
- [x] Per-theatre scoring modules with **separate code paths**: `t1-bucket-brier.js`, `t2-bucket-brier.js`, `t3-timing-error.js`, `t4-bucket-brier.js`, `t5-quality-of-behavior.js`
- [x] Reporting modules (`write-report.js`, `write-summary.js`, `hash-utils.js`)
- [x] Primary corpus committed at `grimoires/loa/calibration/corona/corpus/T<id>.json`
- [x] Run 1 baseline certificates at `grimoires/loa/calibration/corona/run-1/`

### Acceptance Criteria
- [x] **GC.2**: Backtest harness runs against full primary corpus
- [x] Sanity-sample passes 5/5 events before full ingestor
- [x] No shared code paths across heterogeneous scoring modules (operator hard constraint #5)
- [x] `corpus_hash.txt` and `script_hash.txt` written per run
- [x] Per-theatre reports generated at `run-1/T<id>-report.md`
- [x] **ZERO new runtime deps** (`scripts/corona-backtest.js` uses only `node:fs`, `node:path`, `node:url`, native `fetch`, `crypto.createHash`)

### Technical Tasks (outline)

- [x] **Task 3.1** (`corona-v9m`, P0): `sprint-3-donki-sanity-sample` — Build 5-event sanity-sample harness; halt on shape mismatch (R3 mitigation). → **[GC.2]**
- [x] **Task 3.2** (`corona-2jq`): `sprint-3-era-aware-ingestors` — Build SWPC + DONKI + GFZ ingestor modules. → **[GC.2]**
- [x] **Task 3.3** (`corona-1ks`): `sprint-3-corpus-loader-validate` — Build `corpus-loader.js` with schema validation. → **[GC.2]**
- [x] **Task 3.4** (`corona-2iu`): `sprint-3-t1-t2-t4-bucket-brier-scoring` — Separate `t1/t2/t4-bucket-brier.js` modules (NO shared code per operator hard constraint #5). → **[GC.2]**
- [x] **Task 3.5** (`corona-70s`): `sprint-3-t3-timing-error-scoring` — `t3-timing-error.js` per Sprint 2 metric definition. → **[GC.2]**
- [x] **Task 3.6** (`corona-aqh`): `sprint-3-t5-quality-of-behavior-scoring` — `t5-quality-of-behavior.js` per Sprint 2 metric definition. → **[GC.2]**
- [x] **Task 3.7** (`corona-2ox`): `sprint-3-reporting-and-hashing` — `write-report`, `write-summary`, `hash-utils` modules; SHA256 via `node:crypto`. → **[GC.2]**
- [x] **Task 3.8** (`corona-2b5`): `sprint-3-commit-corpus-and-run1` — Commit primary corpus + execute Run 1 → run-1/ certificates. → **[GC.2]**

### Dependencies
- **Sprint 2**: frozen protocol with metric definitions for T3, T4, T5

### Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| **R3**: DONKI archive shape variance | Era-aware ingestor + 5-event sanity-sample first (SDD §6.3) |
| **R4**: DONKI rate limit (DEMO_KEY 40/hr) | Use `NASA_API_KEY` env (1000/hr); throttle at 900/hr; local cache (SDD §6.6) |
| **R6**: DSCOVR pre-2015 events lack L1 | Primary corpus is GOES-R era only (PRD §8.3) |
| Shared scoring code drift if cross-theatre abstractions sneak in | Code review enforces SDD §6.4 separation; D2 mitigation |

### Success Metrics
- 5/5 sanity-sample events normalise without shape errors
- All 5 theatre scoring modules exist as separate files (no shared scoring code paths)
- Run 1 produces complete certificate set at `run-1/`
- ZERO runtime dep additions to `package.json`

---

## Sprint 4: Empirical Evidence Research

**Scope:** SMALL (3 tasks)
**HITL Gate:** Revisit per Sprint 1 outcome
**Beads Epic:** `corona-uqt`

> **Outline-level sketch.**

### Sprint Goal
Compile literature-derived priors and engineering-estimated promotion paths into `empirical-evidence.md` covering all non-backtestable parameters identified by the Sprint 3 baseline.

### Deliverables
- [x] `grimoires/loa/calibration/corona/empirical-evidence.md` authored
- [x] Coverage of: WSA-Enlil sigma (T3), doubt-price floors (T1, T2), Wheatland prior (T4), Bz volatility threshold (T5), source-reliability scores, uncertainty pricing constants
- [x] Each parameter documented with: current value, citations (primary literature preferred), confidence rating (high/medium/low), `engineering_estimated` flag if applicable
- [x] Settlement-critical engineering-estimated parameters carry documented `promotion_path` to literature_derived or backtest_derived

### Acceptance Criteria
- [x] **GC.3**: `empirical-evidence.md` covers all non-backtestable priors

### Technical Tasks (outline)

- [x] **Task 4.1** (`corona-2zs`): `sprint-4-research-non-backtestable-priors` — Compile literature evidence per PRD §5.5 coverage targets. → **[GC.3]**
- [x] **Task 4.2** (`corona-1ve`): `sprint-4-document-engineering-estimated-promotion-paths` — Document promotion_path per settlement-critical engineering-estimated parameter (PRD §8.5). → **[GC.3]**
- [x] **Task 4.3** (`corona-36t`): `sprint-4-author-empirical-evidence-md` — Compile findings into `empirical-evidence.md`. → **[GC.3]**

### Dependencies
- **Sprint 3**: Run 1 baseline (identifies which parameters are backtest-tunable vs need literature)

### Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| Citation drift / unfindable primary literature | Engineering-estimated fallback with mandatory promotion_path (PRD §8.5) |
| Confidence-rating subjectivity | Cross-reference BREATH's literature-research methodology pattern (PRD §13.2) |

### Success Metrics
- All PRD §5.5 coverage targets addressed
- Citations are primary literature where possible
- Settlement-critical engineering-estimated parameters all have promotion paths

---

## Sprint 5: Refit Parameters + Manifest + Regression Gate

**Scope:** LARGE (7 tasks)
**HITL Gate:** Revisit per Sprint 1 outcome
**Beads Epic:** `corona-3fg`

> **Outline-level sketch.**

### Sprint Goal
Refit theatre + processor parameters from Run 1 results and Sprint 4 evidence, populate `calibration-manifest.json` with full provenance per PRD §7 schema, build the manifest regression gate (structural + inline-equals-manifest), and execute Run 2 (post-refit) certificates.

### Deliverables
- [x] Refitted constants in `src/theatres/*.js` (thresholds, Wheatland prior, Bz volatility threshold) — **NO-CHANGE per evidence-driven analysis (NOTES.md S5-1)**
- [x] Refitted constants in `src/processor/*.js` (WSA-Enlil sigma, doubt-price floors, source-reliability scores) — **NO-CHANGE per evidence-driven analysis (NOTES.md S5-1)**
- [x] `grimoires/loa/calibration/corona/calibration-manifest.json` populated per PRD §7 schema (30 entries: corona-evidence-001..029)
- [x] `tests/manifest_structural_test.js` (PRD §7 field validity check) — 22 tests pass
- [x] `tests/manifest_regression_test.js` (inline-equals-manifest gate per SDD §7.3) — 29 tests pass
- [ ] (optional) `scripts/manifest-regression-check.sh` pre-commit hook (decision deferred per SDD §7.2 — Approach B chosen for Sprint 5; Approach A optional Sprint 7 polish)
- [x] Run 2 (post-refit) certificates at `grimoires/loa/calibration/corona/run-2/`
- [x] Per-theatre delta report (pass/marginal/fail vs Sprint 2 thresholds)

### Acceptance Criteria
- [x] **GC.4**: Calibration manifest committed with full provenance per PRD §7 schema
- [x] **GC.5**: Regression gate prevents un-blessed parameter drift (test fails if inline diverges from manifest without manifest update)
- [x] All 60 baseline tests + new manifest tests pass (144 / 144: 93 baseline + 22 structural + 29 regression)
- [x] ZERO new runtime deps (`git diff package.json` empty)

### Technical Tasks (outline)

- [x] **Task 5.1** (`corona-28z`): `sprint-5-refit-theatre-parameters` — Inline-edit `src/theatres/*.js`. → **[GC.4]** (NO-CHANGE; manifest entries lock current values)
- [x] **Task 5.2** (`corona-8yb`): `sprint-5-refit-processor-parameters` — Inline-edit `src/processor/*.js`. → **[GC.4]** (NO-CHANGE; manifest entries lock current values)
- [x] **Task 5.3** (`corona-25p`, P0): `sprint-5-author-calibration-manifest-json` — Populate `calibration-manifest.json` per PRD §7 schema. → **[GC.4]**
- [x] **Task 5.4** (`corona-3o4`): `sprint-5-manifest-structural-test` — `manifest_structural_test.js` per SDD §5.5. → **[GC.4]**
- [x] **Task 5.5** (`corona-15v`, P0): `sprint-5-manifest-regression-gate` — `manifest_regression_test.js` per SDD §7. → **[GC.5]**
- [x] **Task 5.6** (`corona-3ja`): `sprint-5-execute-run-2` — Re-run backtest harness post-refit → run-2/ certificates. → **[GC.4]**
- [x] **Task 5.7** (`corona-33u`): `sprint-5-per-theatre-delta-report` — Author pass/marginal/fail delta vs Sprint 2 thresholds. → **[GC.4]**

### Dependencies
- **Sprint 4**: literature evidence for non-backtestable priors
- **Sprint 3**: Run 1 baseline (delta target)

### Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| Refit regresses Brier scores or hit rates | Delta report (Task 5.7) flags regressions; revert + re-research |
| Manifest schema additions break PRD §7 | SDD §7.3 `inline_lookup` extension is non-breaking (PRD §7 doesn't forbid extra fields) |
| **D2**: Per-theatre scoring duplication invites drift | Structural test asserts each scoring module exports `scoreEvent(corpusEntry, predictedTrajectory)` (SDD §11.2) |
| **D3**: Pre-commit hook bypassable via `--no-verify` | Approach C (hook + node-test); node-test is non-bypassable + runs in CI (SDD §7.2) |

### Success Metrics
- Manifest entries cover every refitted parameter with `evidence_source`, `corpus_hash`, `script_hash`, `derivation`, `confidence`
- Run 2 deltas show improvement OR explicit justification for regressions
- Regression gate prevents inline drift (verified by intentional drift + test-fails check)

---

## Sprint 6: Lightweight Input-Validation Review

**Scope:** SMALL (3 tasks)
**HITL Gate:** Revisit per Sprint 1 outcome
**Beads Epic:** `corona-16a`

> **Outline-level sketch.**

### Sprint Goal
Walk SWPC parser, DONKI parser, and backtest corpus loader through the SDD §8.2 input-validation checklist; produce `security-review.md` with severity-classified findings; fix only CRITICAL severity findings inline (input-injection, infinite-loop, data-loss vectors per PRD §5.7).

### Deliverables
- [x] `grimoires/loa/calibration/corona/security-review.md` authored per SDD §8.3 template
- [x] All findings classified by severity (critical / high / medium / low per SDD §8.4)
- [x] CRITICAL findings fixed inline in Sprint 6 (block Sprint 7) — 0 critical, vacuously satisfied
- [x] Non-critical findings documented + deferred or fixed at discretion (PEX-1 + LOW-1 fixed; 23 deferred / accepted residual)

### Acceptance Criteria
- [x] Review committed (security-review.md + 2 fixes + 16 new tests)
- [x] No critical input-injection / infinite-loop / data-loss vectors blocking Sprint 7
- [x] Review is **NOT** a deep crypto/auth audit (per PRD §5.7, §9.2 — surface area is read-only HTTP + zero auth + zero deps)

### Technical Tasks (outline)

- [x] **Task 6.1** (`corona-r4y`): `sprint-6-walk-input-checklist` — Walk three parsers through SDD §8.2 checklist.
- [x] **Task 6.2** (`corona-8m8`): `sprint-6-author-security-review-md` — Author `security-review.md` per SDD §8.3.
- [x] **Task 6.3** (`corona-a6z`): `sprint-6-fix-critical-findings` — Fix only CRITICAL findings inline. (PEX-1 + C-006/LOW-1 carry-forwards closed; 0 critical findings to fix.)

### Dependencies
- **Sprint 5**: codebase post-refit (final state for review)

### Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| Critical finding blocks Sprint 7 | Fix inline in Sprint 6; PRD §5.7 acceptance designed for this |
| Scope creep into deep audit | Operator constraint + PRD §5.7 explicit; review template (SDD §8.3) bounds scope |

### Success Metrics
- All three parsers reviewed against full checklist
- Severity classifications applied consistently
- No critical findings outstanding at Sprint 7 entry

---

## Sprint 7: Final Validate + BFZ Refresh + v0.2.0 Tag

**Scope:** MEDIUM (5 tasks)
**HITL Gate:** Revisit per Sprint 1 outcome
**Beads Epic:** `corona-1ml`

### Sprint Goal
Run `construct-validate.sh` against the final post-calibration spec (green), refresh BUTTERFREEZONE with post-calibration provenance, execute the final corpus run, bump version to 0.2.0, and validate **ALL PRD goals end-to-end** (G0.x + GC.x + GF.x).

### Deliverables
- [x] `construct-validate.sh` green against final spec
- [x] BUTTERFREEZONE.md (or v3 equivalent) refreshed with post-calibration provenance tags
- [x] Final corpus run committed at `grimoires/loa/calibration/corona/run-N-final/` (run-3-final)
- [x] `package.json` version 0.1.0 → 0.2.0 (operator discretion: tag deferred to post-commit gate)
- [x] Full test suite green (160 tests / 29 suites — exceeds 60 baseline + new)
- [x] **End-to-end goal validation report** (Task 7.5) — `grimoires/loa/a2a/sprint-7/e2e-goal-validation.md`

### Acceptance Criteria
- [x] **GF.1**: `construct-validate.sh` green against post-calibration spec
- [x] **GF.2**: BFZ refresh complete with post-calibration provenance
- [x] **GF.3**: Final certificates committed at `run-N-final/` (= `run-3-final/`)
- [x] **GF.4**: Test suite green (160 tests, 0 fail)
- [x] All G0.x, GC.x, GF.x goals validated end-to-end (Task 7.5 / E2E) — 21/21 goals met

### Technical Tasks

- [x] **Task 7.1** (`corona-32r`): `sprint-7-final-validator-green` — Run `construct-validate.sh` against post-calibration spec. → **[GF.1]**
- [x] **Task 7.2** (`corona-8v2`): `sprint-7-refresh-butterfreezone` — Refresh BFZ with post-calibration provenance. → **[GF.2]**
- [x] **Task 7.3** (`corona-1p5`): `sprint-7-execute-run-N-final` — Final corpus run → run-N-final/. → **[GF.3]**
- [x] **Task 7.4** (`corona-w1v`): `sprint-7-version-bump` — package.json 0.1.0 → 0.2.0; tag deferred to operator post-commit gate.
- [x] **Task 7.5** (`corona-2k3`, P0): `sprint-7-e2e-goal-validation` — **E2E Goal Validation per Goal Mapping Appendix.** 160 tests pass + 21/21 PRD goals validated.

### Dependencies
- **Sprint 6**: critical findings fixed
- All prior sprints

### Risks & Mitigation
| Risk | Mitigation |
|------|-----------|
| **R7**: v3 schema may have evolved mid-cycle | Pin schema commit hash in `pack_dependencies` (PRD §8.6); revisit at Task 7.1 |
| Test regressions from refit | Run 2 (Sprint 5) already verified; Sprint 7 re-runs full suite |

### Success Metrics
- Validator green: 1 (boolean)
- Tests passing: 60 baseline + N new (target N≥3 for manifest tests)
- All PRD goals validated in E2E report

---

## Task 7.5: End-to-End Goal Validation

**Priority:** P0 (Must Complete)
**Goal Contribution:** ALL goals (G0.1-G0.12, GC.1-GC.5, GF.1-GF.4)

### Description
Validate that all PRD goals are achieved through the complete implementation. This is the final gate before cycle archival.

### Validation Steps

| Goal ID | Goal | Validation Action | Expected Result |
|---------|------|-------------------|-----------------|
| **G0.1** | `schema_version: 3` set | Read canonical spec; check field | `schema_version: 3` present |
| **G0.2** | `streams:` block | Read canonical spec; verify Intent + Operator-Model + Verdict + Artifact + Signal mapping | All 5 stream types declared |
| **G0.3** | `identity/CORONA.md` | File exists with persona content | Distinct voice, observer-of-the-Sun framing |
| **G0.4** | `composition_paths.calibration` declared | Read canonical spec | `grimoires/loa/calibration/corona/` referenced |
| **G0.5** | `commands:` array | Read canonical spec | T1-T5 (`/flare-gate`, `/geomag-gate`, `/cme-arrival`, `/proton-cascade`, `/sw-divergence`) all present |
| **G0.6** | `compose_with: [tremor]` | Read canonical spec; cross-check with sprint-0-notes asymmetry note | TREMOR declared; asymmetry documented |
| **G0.7** | `pack_dependencies:` declared | Read canonical spec | Field present (empty array OK) |
| **G0.8** | `construct-validate.sh` green | Run validator | Exit code 0 |
| **G0.9** | BFZ marker for autogen | Read canonical spec / BFZ | Marker present |
| **G0.10** | TREMOR reference composition | `examples/tremor-rlmf-pipeline.md` exists | Markdown shipped; runtime not coupled |
| **G0.11** | `theatre-authority.md` | File exists at `grimoires/loa/calibration/corona/` | Per PRD §6 + provenance citations |
| **G0.12** | T4 S-scale clean | Inspect proton-cascade.js + spec/construct.json + README.md | No R-scale terminology in T4 |
| **GC.1** | Frozen protocol | `calibration-protocol.md` committed; PRD §11 Q2/Q3/Q4 resolved | All metric specifics bound |
| **GC.2** | Backtest harness runs | Execute `node scripts/corona-backtest.js`; check `run-N/` outputs | Per-theatre reports generated |
| **GC.3** | Empirical evidence | `empirical-evidence.md` covers all PRD §5.5 priors | All targets cited; promotion_paths set |
| **GC.4** | Calibration manifest | `calibration-manifest.json` per PRD §7 schema | All fields valid; structural test green |
| **GC.5** | Regression gate | Intentional drift triggers test failure | `manifest_regression_test.js` fails on drift |
| **GF.1** | Final validator green | `construct-validate.sh` against final spec | Exit 0 |
| **GF.2** | BFZ refreshed | Read BUTTERFREEZONE.md; check post-calibration provenance | Provenance tags reflect Run-N-final |
| **GF.3** | Final certificates | `run-N-final/` exists with full per-theatre cert set | All 5 theatres represented |
| **GF.4** | Test suite green | `node --test tests/corona_test.js` | 60 + N tests pass |

### Acceptance Criteria
- [ ] Each goal validated with documented evidence
- [ ] Integration points verified (data flows end-to-end through canonical spec → validator → calibration manifest → regression gate)
- [ ] No goal marked as "not achieved" without explicit operator-acknowledged justification

---

## Risk Register

> Carries forward PRD §10 R1-R11 + SDD §13 D1-D3.

| ID | Risk | Sprint | Probability | Impact | Mitigation | Owner |
|----|------|--------|-------------|--------|------------|-------|
| R1 | `construct-validate.sh` not in upstream | 0 | Med | High | Sprint 0 Task 0.1 acquisition first; surface blocker if absent | Sprint 0 owner |
| R2 | TREMOR `compose_with` doesn't reciprocate | 0 | Med | Low | Read TREMOR read-only; document asymmetry; do not mutate (operator constraint J) | Sprint 0 owner |
| R3 | DONKI archive shape variance 2017-2026 | 3 | High | Med | Era-aware ingestor + 5-event sanity-sample first | Sprint 3 owner |
| R4 | DONKI rate limit (DEMO_KEY 40/hr) | 3 | Med | Med | `NASA_API_KEY` (1000/hr) + throttle 900/hr + cache | Sprint 3 owner |
| R5 | GFZ Kp definitive lag (~30 days) | 2 | Cert | Low | T2 regression tier excludes recent 30 days | Sprint 2 owner |
| R6 | DSCOVR pre-2015 lacks L1 data | 2-3 | Cert | Low | Primary corpus is GOES-R era only (2017+) | Sprint 2/3 owner |
| R7 | v3 schema evolves mid-cycle | 0, 7 | Med | Med | Pin schema commit hash; revisit at Sprint 7 | Sprint 7 owner |
| R8 | T3 timing-error specifics TBD | 2 | Cert | Low | Sprint 2 owns metric (PRD §11 Q2) | Sprint 2 owner |
| R9 | T5 quality-of-behavior specifics TBD | 2 | Cert | Low | Sprint 2 owns metric (PRD §11 Q3) | Sprint 2 owner |
| R10 | T4 R-scale-vs-naming drift wider than expected | 0 | High | Low | Task 0.4 inspects code first before scope commit | Sprint 0 owner |
| R11 | v3 `streams:` taxonomy mapping | 0 | Med | Med | Task 0.3 includes mapping subtask before schema rewrite | Sprint 0 owner |
| D1 | Manifest adapter shim is untested code path | 0 | Med | Low | Adapter is OPTIONAL; skip if no consumer needs it | Sprint 0 owner |
| D2 | Per-theatre scoring duplication invites drift | 3 | Med | Low | Structural test asserts each scoring module signature | Sprint 3/5 owner |
| D3 | Pre-commit hook bypassable via `--no-verify` | 5 | High | Low | Approach C: hook + node-test; node-test is non-bypassable | Sprint 5 owner |
| **N1** | **Runtime dep introduction (PRD §8.1 violation)** | All | Low | High | Operator review BEFORE any task that adds deps; CI invariant on `package.json` `dependencies: {}` | All sprint owners |

---

## Success Metrics Summary

| Metric | Target | Measurement Method | Sprint |
|--------|--------|-------------------|--------|
| `construct-validate.sh` exit code | 0 | Run validator; check $? | 0, 1, 7 |
| Baseline test count preserved | ≥60 passing | `node --test tests/corona_test.js` | All |
| Runtime deps added | 0 | `jq '.dependencies' package.json` | All |
| Both legacy spec files present | 2 (json + yaml) | `ls spec/` | 0, 1, 2, 3, 4, 5, 6, 7 |
| `theatre-authority.md` instrument citations | 5/5 theatres cited | File inspection | 0 |
| Sanity-sample DONKI events normalised | 5/5 | Sprint 3 Task 3.1 output | 3 |
| Run-1 certificate set complete | 5 per-theatre reports | `ls run-1/` | 3 |
| Manifest entries with full provenance | 100% of refitted params | Sprint 5 Task 5.4 structural test | 5 |
| Regression gate fails on intentional drift | True | Manual drift + test run | 5 |
| Critical security findings outstanding at Sprint 7 entry | 0 | `security-review.md` review | 6 |
| Final test suite count | 60 + N (N≥3) | `node --test` output | 7 |
| Version bumped | 0.1.0 → 0.2.0 | `package.json` | 7 |

---

## Dependencies Map

```
Sprint 0 (HITL gate ON) ─▶ Sprint 1 (HITL gate ON) ─▶ Sprint 2 ─▶ Sprint 3 ─▶ Sprint 4 ─▶ Sprint 5 ─▶ Sprint 6 ─▶ Sprint 7
   │                          │                        │           │           │           │           │           │
   └─ v3 spec + auth map      └─ paths + scaffold      └─ protocol └─ harness  └─ research └─ refit    └─ review   └─ ship
   └─ T4 S-scale scaffold                              └─ binds    └─ Run-1    └─ manifest └─ Run-2    └─ E2E
   └─ TREMOR ref doc                                      Q2/Q3/Q4   baseline    priors      gate        validation
```

**Critical path** (longest dependency chain):
`Task 0.1 → 0.3 → 0.7 → 1.1 → 1.2 → 1.3 → 2.1/2.2/2.3/2.4 → 2.5 → 3.1 → 3.2 → 3.4-3.7 → 3.8 → 4.1 → 4.3 → 5.1/5.2 → 5.3 → 5.5 → 5.6 → 5.7 → 6.1 → 6.2 → 6.3 → 7.1 → 7.5`

---

## Execution Mode

| Sprint | Mode | Reason |
|--------|------|--------|
| 0 | **HITL** | Validator acquisition + spec foundation must be operator-reviewed before downstream sprints lock dependencies |
| 1 | **HITL** | composition_paths declaration is irreversible-ish (downstream paths bind); HITL closing review revisits Sprints 2-7 mode |
| 2-7 | **HITL by default; revisit post-Sprint-1** | PRD §11 Q5: HITL until authority map / T4 / validator / paths are locked. Default fail-safe is HITL. |

**`/run sprint-plan` autonomous-execution invocation** for Sprints 2-7 is contingent on operator authorization at the Sprint 1 closing review. Until that authorization, Sprints 2-7 should be invoked individually via `/run sprint-N` (autonomous within a single sprint) OR continue per-sprint HITL via `/implement sprint-N`. **DO NOT** invoke `/run sprint-plan` over the full cycle without explicit operator green-light at Sprint 1 close.

---

## Appendix

### A. PRD Feature Mapping

| PRD Section | Feature/Output | Sprint | Status |
|-------------|----------------|--------|--------|
| PRD §5.1 | Sprint 0 outputs (validator, v3 spec, identity, T4 cleanup, theatre-authority, TREMOR ref) | 0 | Planned |
| PRD §5.2 | composition_paths spec + scaffold | 1 | Planned |
| PRD §5.3 | Frozen calibration protocol | 2 | Planned |
| PRD §5.4 | Backtest harness + Run-1 baseline | 3 | Planned |
| PRD §5.5 | Empirical evidence research | 4 | Planned |
| PRD §5.6 | Refit + manifest + regression gate | 5 | Planned |
| PRD §5.7 | Lightweight input-validation review | 6 | Planned |
| PRD §5.8 | Final validate + BFZ + final certs + tag | 7 | Planned |
| PRD §6 (Theatre Authority) | `theatre-authority.md` | 0 | Planned |
| PRD §7 (Manifest Schema) | `calibration-manifest.json` | 5 | Planned |
| PRD §8.5 (Engineering-Estimated Policy) | `promotion_path` per param | 4-5 | Planned |
| PRD §11 Q1 (Canonical format) | YAML/JSON decision post-validator | 0 | Planned |
| PRD §11 Q2 (T3 metric) | T3 timing-error specifics | 2 | Planned |
| PRD §11 Q3 (T5 metric) | T5 quality-of-behavior specifics | 2 | Planned |
| PRD §11 Q4 (T4 buckets) | T4 S-scale boundaries bound | 0 (scaffold) → 2 (binding) | Planned |
| PRD §11 Q5 (Autonomous mode) | Sprint 2-7 mode revisit | 1 | Planned |
| PRD §11 Q6 (Echelon theatre-api) | Future cycle | — | Deferred |
| PRD §11 Q7 (Promotion deadline) | Per-param promotion_path | 5 | Planned |
| PRD §11 Q8 (compose_with symmetry) | Asymmetric this cycle | 0 | Planned |

### B. SDD Component Mapping

| SDD Section | Component | Sprint | Status |
|-------------|-----------|--------|--------|
| SDD §1 (Architecture) | Layered single-process pipeline preserved | All | Established |
| SDD §3.4 (T4 cleanup) | proton-cascade.js R→S scale | 0 | Planned |
| SDD §4 (Spec/Manifest surfaces) | Canonical v3 spec + adapter (optional) | 0 | Planned |
| SDD §4.5 (streams: mapping) | bundle/theatre_refs → v3 streams taxonomy | 0 | Planned |
| SDD §5 (Calibration subsystem) | Directory layout + per-theatre reports | 1, 3, 5 | Planned |
| SDD §6 (Backtest harness) | scripts/corona-backtest/ | 3 | Planned |
| SDD §6.4 (Per-theatre scoring) | Separate code paths per operator hard constraint #5 | 3 | Planned |
| SDD §7 (Manifest regression gate) | Inline-equals-manifest test + optional pre-commit | 5 | Planned |
| SDD §8 (Input-validation review) | SWPC + DONKI + corpus-loader checklist | 6 | Planned |
| SDD §9 (TREMOR reference composition) | examples/tremor-rlmf-pipeline.md | 0 | Planned |
| SDD §11 (Testing strategy) | tests/corona_test.js single-file extension | 0, 5, 7 | Planned |
| SDD §12 (Development phases) | Phase 1-8 ↔ Sprint 0-7 | All | Mapped |

### C. PRD Goal Mapping

| Goal ID | Goal Description | Contributing Tasks | Validation Task |
|---------|------------------|-------------------|-----------------|
| **G0.1** | `schema_version: 3` in canonical spec | Sprint 0: Task 0.3 | Sprint 7: Task 7.5 |
| **G0.2** | `streams:` block | Sprint 0: Task 0.3 | Sprint 7: Task 7.5 |
| **G0.3** | `identity/CORONA.md` | Sprint 0: Task 0.2 | Sprint 7: Task 7.5 |
| **G0.4** | `composition_paths.calibration` declared | Sprint 1: Task 1.1 | Sprint 7: Task 7.5 |
| **G0.5** | `commands:` array (5 theatres) | Sprint 0: Task 0.3 | Sprint 7: Task 7.5 |
| **G0.6** | `compose_with: [tremor]` | Sprint 0: Task 0.3, 0.6 | Sprint 7: Task 7.5 |
| **G0.7** | `pack_dependencies:` declared | Sprint 0: Task 0.3 | Sprint 7: Task 7.5 |
| **G0.8** | `construct-validate.sh` acquired + green | Sprint 0: Task 0.1, 0.7 | Sprint 7: Task 7.5 |
| **G0.9** | BFZ autogen marker | Sprint 0: Task 0.3 | Sprint 7: Task 7.5 |
| **G0.10** | ≥1 reference composition (TREMOR) | Sprint 0: Task 0.6 | Sprint 7: Task 7.5 |
| **G0.11** | `theatre-authority.md` | Sprint 0: Task 0.5 | Sprint 7: Task 7.5 |
| **G0.12** | T4 S-scale alignment | Sprint 0: Task 0.4; Sprint 2: Task 2.3 (binding) | Sprint 7: Task 7.5 |
| **GC.1** | Frozen calibration protocol | Sprint 2: Task 2.1-2.5 | Sprint 7: Task 7.5 |
| **GC.2** | Backtest harness runs against full corpus | Sprint 3: Task 3.1-3.8 | Sprint 7: Task 7.5 |
| **GC.3** | Research doc covers non-backtestable priors | Sprint 4: Task 4.1-4.3 | Sprint 7: Task 7.5 |
| **GC.4** | Calibration manifest with provenance | Sprint 5: Task 5.1-5.4, 5.6 | Sprint 7: Task 7.5 |
| **GC.5** | Regression gate prevents un-blessed drift | Sprint 5: Task 5.5 | Sprint 7: Task 7.5 |
| **GF.1** | Final `construct-validate.sh` green | Sprint 7: Task 7.1 | Sprint 7: Task 7.5 |
| **GF.2** | BFZ refresh with post-calibration provenance | Sprint 7: Task 7.2 | Sprint 7: Task 7.5 |
| **GF.3** | Final calibration certificates committed | Sprint 7: Task 7.3 | Sprint 7: Task 7.5 |
| **GF.4** | Test suite green (60 baseline + new) | Sprint 7: Task 7.5 | Sprint 7: Task 7.5 |

**Goal Coverage Check:**
- [x] All PRD goals (G0.1-G0.12, GC.1-GC.5, GF.1-GF.4) have at least one contributing task
- [x] All goals have a validation task in final sprint (Task 7.5)
- [x] No orphan tasks: all 41 Beads tasks contribute to at least one goal

**Per-Sprint Goal Contribution:**

- **Sprint 0**: G0.1, G0.2, G0.3, G0.5, G0.6, G0.7, G0.8 (acquire + green), G0.9, G0.10, G0.11, G0.12 (scaffold)
- **Sprint 1**: G0.4 (composition_paths)
- **Sprint 2**: GC.1; G0.12 (binding T4 buckets to corpus)
- **Sprint 3**: GC.2
- **Sprint 4**: GC.3
- **Sprint 5**: GC.4, GC.5
- **Sprint 6**: (security gate; supports GF.1 by ensuring no critical-finding-driven spec changes break validator)
- **Sprint 7**: GF.1, GF.2, GF.3, GF.4; E2E validation of ALL goals

### D. Beads Task Index

> **Total**: 8 epics + 41 tasks = 49 Beads issues. All sprints carry `sprint:N` label; all tasks carry `epic:corona-XXX` label.

| Beads ID | Type | Sprint | Title (truncated) |
|----------|------|--------|-------------------|
| `corona-d5z` | epic | 0 | Sprint 0: v3 Readiness + Theatre Authority + T4 Cleanup |
| `corona-3sh` | task | 0 | sprint-0-acquire-validator |
| `corona-qv8` | task | 0 | sprint-0-write-identity-corona-md |
| `corona-1r5` | task | 0 | sprint-0-v3-spec-migration-with-streams |
| `corona-222` | task | 0 | sprint-0-cleanup-t4-rscale-to-sscale-scaffold |
| `corona-1mv` | task | 0 | sprint-0-write-theatre-authority-map |
| `corona-1g6` | task | 0 | sprint-0-tremor-reference-composition-docs |
| `corona-3oh` | task | 0 | sprint-0-validator-green-or-surface-blocker |
| `corona-2b7` | epic | 1 | Sprint 1: composition_paths Spec + Calibration Directory Scaffold |
| `corona-26g` | task | 1 | sprint-1-declare-composition-paths |
| `corona-2o8` | task | 1 | sprint-1-scaffold-calibration-directory |
| `corona-ra2` | task | 1 | sprint-1-update-sprint-plans-with-absolute-paths |
| `corona-1so` | epic | 2 | Sprint 2: Frozen Calibration Protocol |
| `corona-b5v` | task | 2 | sprint-2-define-corpus-tiers |
| `corona-2bv` | task | 2 | sprint-2-bind-t3-timing-metric |
| `corona-19q` | task | 2 | sprint-2-bind-t4-bucket-boundaries |
| `corona-fnb` | task | 2 | sprint-2-bind-t5-quality-metric |
| `corona-31y` | task | 2 | sprint-2-author-protocol-md |
| `corona-d4u` | epic | 3 | Sprint 3: Backtest Harness + Run-1 Baseline |
| `corona-v9m` | task | 3 | sprint-3-donki-sanity-sample |
| `corona-2jq` | task | 3 | sprint-3-era-aware-ingestors |
| `corona-1ks` | task | 3 | sprint-3-corpus-loader-validate |
| `corona-2iu` | task | 3 | sprint-3-t1-t2-t4-bucket-brier-scoring |
| `corona-70s` | task | 3 | sprint-3-t3-timing-error-scoring |
| `corona-aqh` | task | 3 | sprint-3-t5-quality-of-behavior-scoring |
| `corona-2ox` | task | 3 | sprint-3-reporting-and-hashing |
| `corona-2b5` | task | 3 | sprint-3-commit-corpus-and-run1 |
| `corona-uqt` | epic | 4 | Sprint 4: Empirical Evidence Research |
| `corona-2zs` | task | 4 | sprint-4-research-non-backtestable-priors |
| `corona-1ve` | task | 4 | sprint-4-document-engineering-estimated-promotion-paths |
| `corona-36t` | task | 4 | sprint-4-author-empirical-evidence-md |
| `corona-3fg` | epic | 5 | Sprint 5: Refit Parameters + Manifest + Regression Gate |
| `corona-28z` | task | 5 | sprint-5-refit-theatre-parameters |
| `corona-8yb` | task | 5 | sprint-5-refit-processor-parameters |
| `corona-25p` | task | 5 | sprint-5-author-calibration-manifest-json |
| `corona-3o4` | task | 5 | sprint-5-manifest-structural-test |
| `corona-15v` | task | 5 | sprint-5-manifest-regression-gate |
| `corona-3ja` | task | 5 | sprint-5-execute-run-2 |
| `corona-33u` | task | 5 | sprint-5-per-theatre-delta-report |
| `corona-16a` | epic | 6 | Sprint 6: Lightweight Input-Validation Review |
| `corona-r4y` | task | 6 | sprint-6-walk-input-checklist |
| `corona-8m8` | task | 6 | sprint-6-author-security-review-md |
| `corona-a6z` | task | 6 | sprint-6-fix-critical-findings |
| `corona-1ml` | epic | 7 | Sprint 7: Final Validate + BFZ Refresh + v0.2.0 Tag |
| `corona-32r` | task | 7 | sprint-7-final-validator-green |
| `corona-8v2` | task | 7 | sprint-7-refresh-butterfreezone |
| `corona-1p5` | task | 7 | sprint-7-execute-run-N-final |
| `corona-w1v` | task | 7 | sprint-7-version-bump |
| `corona-2k3` | task | 7 | sprint-7-e2e-goal-validation |

---

## Self-Review Checklist (Phase 4 QA)

- [x] All MVP features (PRD §9.3 Sprint 0-5) accounted for
- [x] Sprints build logically on each other (validator → spec → paths → protocol → harness → research → refit → review → ship)
- [x] Each sprint feasible as a single iteration (sized SMALL/MEDIUM/LARGE per task count; no sprint exceeds 10 tasks)
- [x] All deliverables have checkboxes
- [x] Acceptance criteria are testable (each has explicit verification action in Task 7.5)
- [x] Technical approach aligns with SDD (cross-references throughout)
- [x] Risks identified with mitigation strategies (R1-R11 + D1-D3 + N1)
- [x] Dependencies explicitly called out (Beads dep edges + Dependencies Map + per-sprint Dependencies sections)
- [x] Plan provides clear guidance for engineers (per-task PRD/SDD references; Beads IDs)
- [x] All PRD goals (G0.x, GC.x, GF.x) mapped to tasks (Appendix C)
- [x] All tasks annotated with goal contributions where applicable
- [x] E2E validation task included in final sprint (Task 7.5)
- [x] Both legacy spec files preservation enforced across all sprints (operator hard constraint #2)
- [x] Zero runtime deps invariant enforced (operator hard constraint K + Risk N1)
- [x] HITL gates marked at Sprint 0 + Sprint 1 (operator hard constraint A + I)
- [x] Sprint 0 anti-scope respected (corpus design, backtest, literature research, refit, regression gate ALL deferred per operator hard constraint C)
- [x] TREMOR + BREATH read-only (operator hard constraint J)
- [x] All Beads tasks include sprint association via labels + dep edges + traceability via PRD/SDD references

---

*Generated by Sprint Planner Agent — grounded in `grimoires/loa/prd.md`, `grimoires/loa/sdd.md`, `grimoires/loa/ledger.json`, and operator hard constraints from the `/sprint-plan` invocation. Beads tasks registered to `.beads/beads.db` and exported to `.beads/issues.jsonl`.*
