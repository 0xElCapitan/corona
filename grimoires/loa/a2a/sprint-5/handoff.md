# Sprint 5 Handoff Packet — CORONA cycle-001-corona-v3-calibration

**Status**: READY FOR FRESH-SESSION KICKOFF
**Authored**: 2026-05-01 (Sprint 4 close, post-commit)
**Sprint type**: REFIT + PROVENANCE — parameter refit, calibration-manifest.json population, regression gate, Run 2 baseline
**Scope size**: Sprint 5 LARGE (8 tasks)
**Operator HITL constraint**: HITL remains ON. Sprint 5 only — do NOT start Sprint 6.

---

## 1. Current repo / branch / commit state

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD commit | `b8a4ed8` — `docs(corona): add sprint 4 empirical evidence index` |
| Upstream | `origin/main` — up to date |
| Working tree | Clean |
| Recent cycle-001 commits | `b424da7` Sprint 0 → `2c75ecb` Sprint 1 → `33e9133` Sprint 2 → `cd7648f` Sprint 3 → `b8a4ed8` Sprint 4 |

### Quality gates at handoff

```bash
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
node --test tests/corona_test.js                        # tests 93 / pass 93 / fail 0
git status                                              # clean
git log --oneline -6                                    # b8a4ed8 at HEAD
node scripts/corona-backtest.js                         # Run 1 reproducible
```

### Sprint 0–4 close states (preserved)

- **Sprint 0** (`b424da7`): v3 readiness, theatre authority map, T4 S-scale scaffold, identity/CORONA.md, compose_with[tremor], commands, pack_dependencies, local validator. Reviewed + audited + pushed.
- **Sprint 1** (`2c75ecb`): composition_paths declared, calibration directory scaffolded with placeholders. Reviewed + audited + pushed.
- **Sprint 2** (`33e9133`): frozen calibration protocol + T4 flare-class proxy retirement. Reviewed (Round 1 CHANGES_REQUIRED → Round 2 APPROVED) + audited + pushed.
- **Sprint 3** (`cd7648f`): backtest harness + 25-event primary corpus + Run 1 baseline certificates. Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited + pushed.
- **Sprint 4** (`b8a4ed8`): empirical-evidence.md authored (1139 lines, 14 primary citations, 6 PRD §5.5 coverage targets, 20 manifest entry sketches, §1.1 Citation Verification Status taxonomy). Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited (R1 CHANGES_REQUIRED → R3 APPROVED) + pushed.

### Sprint 4 deliverables locked at HEAD

- `grimoires/loa/calibration/corona/empirical-evidence.md` — 1139 lines. **Source of truth for non-backtestable parameter provenance.** Sprint 5 consumes this verbatim and populates `calibration-manifest.json` from the entry sketches in §3-§8. Critically, the §1.1 verification taxonomy (4 labels: VERIFIED_FROM_SOURCE / ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / HYPOTHESIS_OR_HEURISTIC) MUST be honored when Sprint 5 writes `calibration-manifest.json`.
- `grimoires/loa/calibration/corona/calibration-protocol.md` — Sprint 2 frozen protocol, untouched.
- `grimoires/loa/calibration/corona/theatre-authority.md` — Sprint 0 settlement-authority map, untouched.
- `grimoires/loa/calibration/corona/calibration-manifest.json` — `[]` (Sprint 1 placeholder; Sprint 5 / `corona-25p` populates).
- `grimoires/loa/calibration/corona/corpus/primary/` — 25 events committed, frozen at Sprint 3 corpus_hash `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1`.
- `grimoires/loa/calibration/corona/run-1/` — Sprint 3 baseline certificates: T1-T5 reports, summary, corpus_hash.txt, script_hash.txt, per-event/.
- `scripts/corona-backtest.js` + `scripts/corona-backtest/` — harness; Sprint 3 script_hash `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1`.
- `tests/corona_test.js` — 93 tests (70 baseline + 22 Sprint 3 harness + 1 CI-1 regression).

---

## 2. Sprint 5 objective

Sprint 5 closes the loop between the calibration evidence (Sprint 4) and the running construct: refit the runtime parameters where the evidence + Run 1 baseline justify a change, populate `calibration-manifest.json` with full provenance per PRD §7 schema, build the structural + regression-gate tests that prevent inline-vs-manifest drift, execute Run 2 against the same corpus, and emit a per-theatre delta report comparing Run 2 verdicts against Run 1.

Per `calibration-protocol.md` §7.1 the regression gate triggers on changes to:

1. Theatre threshold parameters (`src/theatres/*.js` constants).
2. Processor parameters (`src/processor/*.js` — doubt-price, sigma prior, source-reliability).
3. Scoring modules (`scripts/corona-backtest/scoring/*.js`) — Sprint 5 should NOT change scoring; if it does, that's a §6.1 hard-constraint violation requiring operator approval.
4. The corpus (`grimoires/loa/calibration/corona/corpus/**`).

Sprint 5 is the first cycle-001 sprint that exercises the full provenance + regression-gate machinery. Sprint 7 is the final-validate + BFZ refresh + tag.

**Sprint 5 epic**: `corona-3fg` (currently OPEN).

---

## 3. Sprint 5 owner tasks (8 tasks; LARGE scope)

| Beads ID | Task | Owner deliverable |
|----------|------|--------------------|
| `corona-8yb` | sprint-5-refit-processor-parameters | Inline-edit `src/processor/*.js` with refitted WSA-Enlil sigma + doubt-price floors + source-reliability scores per Sprint 4 evidence + Run 1 |
| `corona-28z` | sprint-5-refit-theatre-parameters | Inline-edit `src/theatres/*.js` with refitted thresholds + Wheatland prior + Bz volatility threshold per Sprint 4 evidence + Run 1 |
| `corona-25p` | sprint-5-author-calibration-manifest-json | Populate `grimoires/loa/calibration/corona/calibration-manifest.json` per PRD §7 schema with full provenance per refitted parameter |
| `corona-3o4` | sprint-5-manifest-structural-test | Build `tests/manifest_structural_test.js` asserting PRD §7 field validity + `provisional` / `promotion_path` rules per PRD §8.5 |
| `corona-15v` | sprint-5-manifest-regression-gate | Build `tests/manifest_regression_test.js` (and optional pre-commit hook) enforcing inline-equals-manifest |
| `corona-3ja` | sprint-5-execute-run-2 | Re-run backtest harness post-refit → `grimoires/loa/calibration/corona/run-2/` certificates |
| `corona-33u` | sprint-5-per-theatre-delta-report | Author pass/marginal/fail delta vs Sprint 2 thresholds for each theatre (Run 1 vs Run 2) |
| `corona-3fg` | Sprint 5 epic | Tracker for the above 7 tasks |

### Recommended task ordering

1. **`corona-8yb` + `corona-28z` in parallel** — refit processor + theatre parameters from Sprint 4 evidence. Each refit MUST be motivated by either a Sprint 4 literature_derived value (with verification_status acknowledged) OR a Run 1 backtest signal that justifies a change.
2. **`corona-25p`** after refits — populate `calibration-manifest.json` per PRD §7 schema. Each entry's `evidence_source`, `confidence`, `verification_status`, `provisional`, `promotion_path` must match the Sprint 4 evidence document. **Do NOT silently promote ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / HYPOTHESIS_OR_HEURISTIC values to VERIFIED_FROM_SOURCE — the offline-authoring agent has the same constraints Sprint 4 had.**
3. **`corona-3o4`** — `tests/manifest_structural_test.js` validates the manifest's PRD §7 field schema (12 required fields + the verification_status field added Sprint 4 §1.1). Must include the PRD §8.5 promotion_path check (settlement_critical + provisional ⇒ promotion_path non-null).
4. **`corona-15v`** — `tests/manifest_regression_test.js` reads each manifest entry where `derivation ∈ {literature_derived, backtest_derived}` and asserts the inline constant in the cited `source_file:source_line` matches the manifest's `current_value`. Per SDD §7.3 — this is the inline-equals-manifest gate.
5. **`corona-3ja`** — re-run `node scripts/corona-backtest.js` against the SAME corpus (corpus_hash MUST be unchanged at `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1`). Output to `grimoires/loa/calibration/corona/run-2/`. The script_hash WILL change (Sprint 5 modified runtime + scoring constants the entrypoint hashes — actually the script_hash only covers `scripts/corona-backtest.js` per SDD §6.5; if Sprint 5 doesn't modify the entrypoint, script_hash stays. Verify post-run.)
6. **`corona-33u`** — per-theatre delta report at `grimoires/loa/calibration/corona/run-2/delta-report.md` comparing Run 1 verdicts against Run 2 verdicts per theatre. Must explain which refits drove which verdict changes.

### Sprint 5 acceptance criteria (from sprint.md GC.4 + GC.5 + Sprint 5 deliverables)

- **GC.4**: Refit parameters pass Sprint 5 regression gate against Sprint 2 thresholds OR re-baselined thresholds (per §6.2 Sprint 5 license).
- **GC.5**: `calibration-manifest.json` populated; inline-equals-manifest test green.
- Manifest structural test passes (every entry has all 12 PRD §7 fields + verification_status).
- Run 2 certificates produced at `grimoires/loa/calibration/corona/run-2/`.
- Per-theatre delta report explains pass/marginal/fail changes vs Run 1.
- Zero new runtime deps (`package.json:32 "dependencies": {}` invariant).

### Sprint 5 dependencies

- **Sprint 2 frozen protocol** at `grimoires/loa/calibration/corona/calibration-protocol.md` — Sprint 5 implements refits within §3 / §4 / §6 thresholds. **Do NOT change scoring semantics.** §6.2 grants Sprint 5 explicit license to widen/tighten pass/marginal/fail thresholds with manifest-entry justification.
- **Sprint 3 backtest harness** at `scripts/corona-backtest/` — Sprint 5 re-runs it; should NOT modify the harness modules unless a documentation-only path correction blocks Run 2.
- **Sprint 3 corpus** at `grimoires/loa/calibration/corona/corpus/primary/` — frozen. Sprint 5 MUST run against the same corpus (corpus_hash invariant). Corpus extension is operator-HITL-gated per `calibration-protocol.md` §3.2 #4 / §3.5.
- **Sprint 4 evidence document** at `grimoires/loa/calibration/corona/empirical-evidence.md` — every refit Sprint 5 makes MUST trace to a Sprint 4 manifest entry sketch (corona-evidence-001 through 020).

---

## 4. Required reading order for the fresh agent

The fresh-session agent has zero context. Read in this order; STOP when context budget runs low and synthesize to `grimoires/loa/NOTES.md` per the Tool Result Clearing Protocol.

| # | File | Lines | Why |
|---|------|-------|-----|
| 1 | **This file** — `grimoires/loa/a2a/sprint-5/handoff.md` | ~250 | Primer; covers everything below in summary form |
| 2 | `grimoires/loa/calibration/corona/empirical-evidence.md` | 1139 | **The Sprint 4 binding contract Sprint 5 implements against.** §1.1 verification taxonomy is the load-bearing rule; §3-§8 manifest entry sketches are the field-level shapes Sprint 5 copies into `calibration-manifest.json`; §9 engineering-estimated index identifies the parameters that need promotion_path. |
| 3 | `grimoires/loa/calibration/corona/calibration-protocol.md` | 523 | Frozen Sprint 2 protocol; §3 corpus rules + §4 scoring contracts + §6 thresholds + §7 regression policy. Sprint 5 implements §7 verbatim. |
| 4 | `grimoires/loa/prd.md` §7 + §8.5 + §11 | ~150 | Manifest schema (§7 12-field contract); engineering-estimated parameter policy (§8.5 promotion_path requirements); open decisions Sprint 5 owns (§11 — Sprint 5 refit license). |
| 5 | `grimoires/loa/sdd.md` §5.5 + §7 | ~80 | Manifest schema validation + regression gate spec + decision matrix (§7.2 — pre-commit hook vs `node --test` integration; §7.3 inline-equals-manifest semantics). |
| 6 | `grimoires/loa/sprint.md` Sprint 5 section | ~50 | Sprint 5 acceptance criteria GC.4 + GC.5. |
| 7 | `grimoires/loa/calibration/corona/run-1/summary.md` + per-theatre reports | ~250 | Sprint 3 baseline; identifies which theatres need refit attention. T1/T2/T4 used uniform-prior baselines (Run 1 numbers are no-model floors); T3 used WSA-Enlil from corpus; T5 was behavioral. |
| 8 | `src/processor/uncertainty.js` + `src/theatres/proton-cascade.js` + `src/theatres/solar-wind-divergence.js` | ~700 | Inline parameter sites Sprint 5 may modify per `corona-8yb` + `corona-28z`. Each modification MUST be paired with a calibration-manifest.json entry. |
| 9 | `src/processor/quality.js` | ~270 | SOURCE_RELIABILITY + CLASS_RELIABILITY constants (§7 of empirical-evidence.md). Sprint 5 / `corona-25p` expands to one manifest entry per key (12 entries: 7 SOURCE + 5 CLASS). |
| 10 | `grimoires/loa/a2a/sprint-3/{reviewer.md, engineer-feedback.md, auditor-sprint-feedback.md}` | varies | Sprint 3 final state for context; reviewer.md §11 Protocol Interpretations documents T1 6-bucket / T2 G0 INTERPRETATION tags. |
| 11 | `grimoires/loa/a2a/sprint-4/{reviewer.md, engineer-feedback.md, auditor-sprint-feedback.md}` | varies | Sprint 4 final state; auditor-sprint-feedback.md Round 3 documents the YAML-vs-prose consistency rule that Sprint 5 must extend to `calibration-manifest.json`. |
| 12 | TREMOR `grimoires/loa/calibration/omori-backtest/run-N/` (read-only reference) | varies | Per-run certificate pattern; Sprint 5 / `corona-3ja` mirrors this for Run 2. |

### Read-only reference patterns (do NOT mutate)

- **TREMOR**: `C:\Users\0x007\tremor` (read-only).
  - Run-N certificate pattern.
  - Manifest-regression-test pattern (if TREMOR has one — Sprint 5 may inspect for testing-style guidance).
- **BREATH**: `C:\Users\0x007\breath` (read-only).
  - Empirical-validation-research pattern source — Sprint 4 already mirrored citation rigor; Sprint 5 doesn't need this.

---

## 5. Files Sprint 5 is expected to MODIFY

Sprint 5 is permitted to modify (and is expected to modify) the following files:

```
src/processor/uncertainty.js                # corona-8yb — refit doubt-price floors, sigma constants
src/processor/quality.js                    # corona-8yb — refit SOURCE_RELIABILITY + CLASS_RELIABILITY scores
src/theatres/proton-cascade.js              # corona-28z — refit Wheatland λ + decay (CAREFUL: do NOT change S_SCALE_THRESHOLDS_PFU or BUCKETS — those are Sprint 2 freeze constants)
src/theatres/solar-wind-divergence.js       # corona-28z — refit bz_divergence_threshold + sustained_minutes
src/theatres/flare-gate.js                  # corona-28z — refit base_rate or threshold-related params if evidence motivates
src/theatres/geomag-gate.js                 # corona-28z — refit similar
src/theatres/cme-arrival.js                 # corona-28z — T3 settles on observed L1 shock; runtime params may need adjustment
grimoires/loa/calibration/corona/calibration-manifest.json   # corona-25p — populate from [] to N entries
tests/corona_test.js                        # corona-3o4 + corona-15v — append manifest_structural_test + manifest_regression_test (or extract to tests/integration/)
grimoires/loa/calibration/corona/run-2/                      # corona-3ja — Run 2 certificates
grimoires/loa/calibration/corona/run-2/delta-report.md      # corona-33u — per-theatre delta report
grimoires/loa/sprint.md                     # Sprint 5 deliverable/AC/task checkmarks at sprint close
grimoires/loa/a2a/sprint-5/                 # reviewer.md (implementation report), engineer-feedback.md (post review), auditor-sprint-feedback.md (post audit), COMPLETED (post audit-approved)
```

Optional / conditional:
- `tests/integration/manifest_structural_test.js` + `tests/integration/manifest_regression_test.js` if SDD §11.2 single-file convention is exceeded by these tests' fixture needs. Sprint 5 may judge case-by-case.
- `.git/hooks/pre-commit` invocation script if the operator chooses Sprint 5's SDD §7.2 Approach C (hook + integration test); Approach B (test only) is acceptable per SDD §7.2.

---

## 6. Files Sprint 5 should NOT MODIFY (unless a direct blocker is found)

| File | Why preserve | Blocker exception |
|------|--------------|-------------------|
| `grimoires/loa/calibration/corona/calibration-protocol.md` | Frozen Sprint 2 protocol | Only if Sprint 5 finds an actual semantic ambiguity preventing manifest population. Operator HITL approval required for any edit. |
| `grimoires/loa/calibration/corona/theatre-authority.md` | Sprint 0 settlement authority of record | Do not modify — settlement authority is locked. |
| `grimoires/loa/calibration/corona/empirical-evidence.md` | Sprint 4 deliverable | ONLY narrow citation/path corrections if Sprint 5 discovers a literal error (e.g., a referenced file:line that doesn't exist). NO new citations, NO confidence-rating changes, NO promotion-path additions. If a Sprint 4 entry is wrong, surface to operator. |
| `grimoires/loa/calibration/corona/corpus/primary/` | Sprint 3 frozen corpus (corpus_hash invariant) | Corpus changes require operator HITL gate per `calibration-protocol.md` §3.5. **DO NOT modify the corpus during Sprint 5** — this would invalidate the Run 1 baseline that Run 2 is being compared against. |
| `grimoires/loa/calibration/corona/corpus/README.md` | Corpus directory layout + freeze policy | Read-only for Sprint 5. |
| `grimoires/loa/calibration/corona/run-1/` | Sprint 3 baseline certificates | Read-only. Run 2 produces a NEW directory at `run-2/`. |
| `scripts/corona-backtest.js` | Sprint 3 entrypoint | Do not modify unless a path-resolution blocker prevents Run 2. If modified, the script_hash changes — note the new value in the Run 2 summary. |
| `scripts/corona-backtest/scoring/*.js` | Sprint 3 scoring modules | **DO NOT change scoring semantics.** §6.1 hard-constraint violation. Operator hard constraint #5 still applies (no shared scoring code paths). |
| `scripts/corona-backtest/ingestors/*.js` | Sprint 3 ingestors + corpus loader | Do not modify the corpus loader — its §3.7 schema validation is the loader's contract. Reading the field set may need extending if Sprint 5 finds a corpus-event field not handled, but this should be a discovery, not a refit. |
| `scripts/corona-backtest/reporting/*.js` | Sprint 3 reporters + hash-utils | Do not modify hash-utils.js (would invalidate the corpus_hash + script_hash semantics). Reporting modules may need extension for the delta-report format — judge case-by-case. |
| `scripts/corona-backtest/config.js` | Sprint 3 paths + thresholds | THRESHOLDS may need updating IF Sprint 5 exercises the §6.2 re-baseline license — every change MUST be documented in `calibration-manifest.json` with rationale. |
| `construct.yaml` | v3 manifest, Sprint 0 deliverable | Do not modify. Sprint 7 publish-readiness territory. |
| `package.json` | Zero-dep invariant per PRD §8.1 | NEVER modify. Do not add deps. Do not add devDependencies. |
| `.claude/` | System Zone | Never edit. |

---

## 7. Sprint 5 hard constraints

These are operator-locked and binding throughout Sprint 5 execution.

1. **Sprint 5 only.** Do NOT start Sprint 6 work. Sprint 6 / `corona-r4y` (input-validation review) is the natural owner of `payload.event_type` defensive-access (PEX-1 from Sprint 2 audit). Sprint 6 / `corona-a6z` (CRITICAL findings) is downstream.

2. **HITL remains ON.** Operator approval gates: post-refit (before Run 2), post-Run-2 (before manifest population), post-manifest (before regression-gate test landing), post-tests (before commit). Surface for HITL at natural break points; do not auto-chain.

3. **Do NOT add dependencies.** `package.json:32 "dependencies": {}` is invariant. Sprint 5 may use ONLY: `node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch` (Node 20+), `node:test`. No `devDependencies` either.

4. **Preserve zero-runtime-dependency posture.** No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`.

5. **Do NOT change corpus eligibility rules from Sprint 2** (`calibration-protocol.md` §3.2). The frozen Sprint 2 protocol is binding. If a refit appears to require relaxed corpus eligibility, surface to operator — that's a Sprint 2 amendment, not a Sprint 5 task.

6. **Do NOT change Sprint 3 scoring semantics.** Each scoring module (`scripts/corona-backtest/scoring/t<id>-*.js`) owns its own metric formulas per operator hard constraint #5. Refit means changing the parameters the scoring modules consume (e.g., bucket boundaries via runtime BUCKETS export, or threshold values via `THRESHOLDS` in config.js per §6.2 license), NOT changing the formulas themselves.

7. **Do NOT change `empirical-evidence.md` except narrow citation/path corrections if absolutely required.** Sprint 4 is closed; its evidence is binding for Sprint 5. If a citation has a literal error (a file:line that doesn't exist, a typo), Sprint 5 may make the narrow correction and surface to operator. NO new citations, NO confidence-rating changes, NO promotion-path additions.

8. **`calibration-manifest.json` becomes source of truth for parameter provenance.** Per PRD §7. Each refitted parameter gets a manifest entry with all 12 PRD §7 fields + the `verification_status` field added Sprint 4. The entry's `evidence_source`, `confidence`, `verification_status`, `provisional`, `promotion_path` MUST match the Sprint 4 evidence document.

9. **Inline runtime constants must match manifest entries.** Per SDD §7.3 / `calibration-protocol.md` §7.3. Sprint 5 / `corona-15v` builds the test that enforces this. Every `derivation ∈ {literature_derived, backtest_derived}` manifest entry must have its `current_value` equal to the value at the cited `source_file:source_line`.

10. **Any engineering-estimated or verification-required settlement-critical value must remain provisional with a promotion_path.** Per PRD §8.5. If a Sprint 4 entry's `verification_status` is ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / HYPOTHESIS_OR_HEURISTIC, the corresponding manifest entry MUST carry `provisional: true` and a non-null `promotion_path`. Settlement-critical engineering-estimated parameters require this regardless of Sprint 5's refit.

11. **Do NOT silently promote ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / HYPOTHESIS_OR_HEURISTIC values to high-confidence literature_derived constants.** This is the failure mode Sprint 4 audit Round 1 caught (CR-1, CR-2). Sprint 5 has the same offline-curation constraint Sprint 4 had; promoting to VERIFIED_FROM_SOURCE requires DOI verification that the offline agent cannot perform. Sprint 7 / `corona-1ml` final-validate is the natural promotion gate.

12. **If protocol or evidence ambiguity is found, stop and surface it instead of guessing.** Examples that should halt: a Sprint 4 manifest entry sketch with conflicting fields between body-section and YAML; a `calibration-protocol.md` §6 threshold that's underspecified for a refit case; a `theatre-authority.md` cross-reference that conflicts with refitted runtime behavior. Halt → surface to operator → wait for amendment OR explicit operator instruction.

---

## 8. Important carry-forward warnings

These are documented for Sprint 5's awareness; some are blocking for Sprint 5, others are downstream-sprint-owned.

| ID | Source | Concern | Owner |
|----|--------|---------|-------|
| **W-1** | Sprint 4 audit Round 1 (CR-1 + CR-2) | Stale YAML manifest entry sketches over-promoted uncertain evidence (corona-evidence-006 + corona-evidence-020 had `confidence: high` + `provisional: false` despite body-section ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY tags). **Sprint 5's `calibration-manifest.json` MUST NOT repeat this.** Each entry's `verification_status` field must match the Sprint 4 body-section label, and `provisional` + `promotion_path` must follow per the §1.1 hard rule. | **Sprint 5 / corona-25p — must avoid the pattern.** |
| **W-2** | Sprint 3 review (§11 Protocol Interpretations) | T1 6-bucket scoring scheme + T2 G0-bucket addition are documented as Sprint-3 INTERPRETATIONS of the underspecified `calibration-protocol.md` §4.1 / §4.2 bucket text. Sprint 5 may revise per `calibration-protocol.md` §4.4.2 re-baseline license — but doing so invalidates Sprint 1's `corpus_hash` and Sprint 3's Run 1 baseline. Surface to operator before changing bucket boundaries. | **Sprint 5 / corona-28z — judgment call.** |
| **W-3** | Sprint 3 audit (LOW-1) | `Math.max(0, …)` at `scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183` silently clamps negative latencies to 0 (would mask a corpus-authoring error where detection_time < actual_onset_time). Non-blocking per Sprint 3 audit; documented as future polish. | Sprint 7 polish; Sprint 5 should NOT touch unless a direct blocker. |
| **PEX-1** | Sprint 2 audit (carry-forward to Sprint 6) | Pre-existing `payload.event_type` direct property access in `src/theatres/proton-cascade.js:266, 284` without optional chaining. Throws TypeError if `bundle.payload` is undefined. **Sprint 6 / `corona-r4y` (input-validation review) is the natural owner.** Sprint 5 should NOT fix this unless it directly blocks `corona-8yb` / `corona-28z` refit work — which it should not, because Sprint 5 is editing parameter constants, not the qualifying logic. | Sprint 6 / `corona-r4y`. |
| Sprint 0 carry-forwards | Sprint 0 reviewer + auditor docs | Publish-readiness items (commands.path JS-file vs upstream `commands/*.md`, L2 publish gates, schemas/CHECKSUMS.txt, tempfile EXIT trap, ajv-formats install). | Sprint 7 / `corona-1ml` (publish-readiness epic). |
| Sprint 1 review C5 | `grimoires/loa/a2a/sprint-1/engineer-feedback.md` | `composition_paths.reads: []` registry compatibility (verify against construct-network indexer). | Sprint 7 / `corona-32r`. |

**Net effect on Sprint 5**: only W-1 and W-2 require Sprint 5 attention. W-1 is binding (manifest population MUST honor verification_status); W-2 is judgment-call (operator-HITL-gated if bucket boundaries shift).

### Settlement-critical engineering-estimated parameter (Sprint 4 §9 carry-forward)

Sprint 4's §9 identified ONE settlement-critical engineering-estimated parameter:

- **`theatre.proton_cascade.wheatland_decay_m_class`** (current value: 0.90 at `src/theatres/proton-cascade.js:103`)
  - `verification_status: HYPOTHESIS_OR_HEURISTIC`
  - `derivation: engineering_estimated`
  - Sprint 5 promotion path: "Sprint 5 / corona-3fg refit: validate against M-class T4 corpus events (1 event in Run 1 corpus: 2022-01-20 M5.5 → S1 minor); promote to literature_derived once corpus extension reaches 15+ M-class triggers."

Sprint 5 must decide:
- (A) **Refit `wheatland_decay_m_class`** based on the 1 M-class corpus event (insufficient sample; not recommended unless corpus extension provides more data).
- (B) **Keep at 0.90 with `provisional: true` + the existing promotion_path**, deferring promotion to a future cycle when corpus extension to 15+ M-class triggers happens.

**My recommendation**: (B). The promotion_path explicitly notes corpus extension is required; Sprint 5 should NOT refit on an n=1 sample.

### Other engineering-estimated parameters from Sprint 4 §9

Per Sprint 4 §9 + §1.1, four non-settlement-critical engineering-estimated parameters MAY remain provisional indefinitely:

- `flare.doubt_base_donki_cross_val` (0.05)
- `wheatland_lambda_default` (3) + `wheatland_decay_default` (0.92) — per Sprint 4 §5.4 may be retired entirely if confirmed unreachable post-M5+ trigger gate
- `sw_divergence.detection_window_hours` (24)

Sprint 5 may choose to retire `wheatland_lambda_default` + `wheatland_decay_default` if `corona-28z` confirms the default branch is unreachable at runtime. This is non-blocking; defer to Sprint 7 polish if it complicates the refit pass.

---

## 9. Sprint 5 expected outputs

Per the operator's brief:

1. **Updated runtime parameter constants** where Sprint 4 evidence + Run 1 baseline justify a change. Each modification MUST be paired with a `calibration-manifest.json` entry.
2. **`grimoires/loa/calibration/corona/calibration-manifest.json` populated** per PRD §7 schema. Expected entry count: ~20 from Sprint 4 §3-§8 + per-key expansion of §7 (7 SOURCE_RELIABILITY + 5 CLASS_RELIABILITY = 12 entries) + any backtest-derived entries Sprint 5 introduces from Run 1 / Run 2 deltas. Total estimated ~30-40 entries.
3. **`tests/manifest_structural_test.js`** (or `tests/integration/...`) — asserts PRD §7 field validity + provisional / promotion_path rules per PRD §8.5.
4. **`tests/manifest_regression_test.js`** (or `tests/integration/...`) — enforces inline-equals-manifest per SDD §7.3.
5. **Run 2 baseline at `grimoires/loa/calibration/corona/run-2/`** — same 25-event corpus, refitted runtime parameters. Output: T1-T5 reports, summary, corpus_hash.txt, script_hash.txt, per-event/.
6. **Per-theatre delta report at `grimoires/loa/calibration/corona/run-2/delta-report.md`** — explains pass/marginal/fail changes vs Run 1; flags any refit that improved scoring numerically but worsened a verdict (or vice versa).
7. **Sprint 5 implementation report at `grimoires/loa/a2a/sprint-5/reviewer.md`** — implementation-report template per SDD pattern; AC Verification section walking GC.4 + GC.5 + sprint-5 deliverables verbatim with file:line evidence.

### File-level expectations

```
src/processor/uncertainty.js              # corona-8yb modifications
src/processor/quality.js                  # corona-8yb modifications
src/theatres/proton-cascade.js            # corona-28z modifications (CAREFUL: do not touch S_SCALE_THRESHOLDS_PFU or BUCKETS)
src/theatres/solar-wind-divergence.js     # corona-28z modifications
src/theatres/flare-gate.js                # corona-28z modifications (if motivated)
src/theatres/geomag-gate.js               # corona-28z modifications (if motivated)
src/theatres/cme-arrival.js               # corona-28z modifications (if motivated)
grimoires/loa/calibration/corona/calibration-manifest.json   # corona-25p — populate
tests/corona_test.js                      # corona-3o4 + corona-15v additions (or split to tests/integration/)
grimoires/loa/calibration/corona/run-2/   # corona-3ja certificates
grimoires/loa/calibration/corona/run-2/delta-report.md   # corona-33u
grimoires/loa/sprint.md                   # Sprint 5 checkmarks at sprint close
grimoires/loa/a2a/sprint-5/{reviewer,engineer-feedback,auditor-sprint-feedback}.md + COMPLETED
```

---

## 10. Sprint 5 review focus areas

When Sprint 5 implementation completes and `/review-sprint sprint-5` runs, the senior reviewer should focus attention on:

1. **Manifest entries match empirical-evidence verification_status**: every `calibration-manifest.json` entry's `verification_status` field MUST match the Sprint 4 body-section label for the same parameter. This is W-1: the Sprint 4 audit Round 1 lesson — manifest entries cannot silently over-promote uncertain evidence.

2. **No uncertain evidence upgraded without justification**: ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / HYPOTHESIS_OR_HEURISTIC parameters must NOT be promoted to VERIFIED_FROM_SOURCE in Sprint 5's manifest. Promotion requires DOI verification that Sprint 5's offline-curation agent cannot perform; promotion is Sprint 7 final-validate territory.

3. **Inline constants and manifest values cannot drift**: `tests/manifest_regression_test.js` (corona-15v) is the gate; the reviewer should run it and verify it ACTUALLY catches drift. A test that only checks structure (not actual value comparison) would silently allow drift.

4. **Run 2 improvements are real and not caused by scoring changes**: the reviewer should confirm Sprint 5 did NOT modify scoring modules (per hard constraint #6). Run 2 verdicts changing vs Run 1 should be attributable to PARAMETER changes (refit), not METRIC changes (formula).

5. **No hidden filtering added**: the corpus loader's §3.7 schema validation is the contract. Sprint 5 must not add events-skipping logic anywhere in the harness or scoring layer. Round 2 review CI-3 review residue from Sprint 3 (no scoring-layer filtering) still applies.

6. **No Sprint 6 work smuggled in**: PEX-1 (`payload.event_type` defensive access) is Sprint 6 / `corona-r4y` territory. If Sprint 5 fixes it, that's scope creep and the reviewer should flag it.

7. **No dependency / package mutation**: `git diff package.json` post-Sprint-5 MUST be empty. No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` introduced.

8. **Per-theatre delta report (`run-2/delta-report.md`) is honest**: each theatre's pass/marginal/fail change must be attributed to specific refits OR to corpus characteristics. A Run 2 verdict change that the report cannot explain is a flag.

9. **`corpus_hash` invariant**: Run 2 `corpus_hash.txt` MUST equal Run 1 `corpus_hash.txt` (= `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1`). If it changes, Sprint 5 modified the corpus — that's a hard-constraint violation.

10. **`script_hash` change is acceptable** because Sprint 5 may modify `scripts/corona-backtest.js` if needed (rare, but the harness entrypoint is editable). Note the new value in Run 2 summary.

---

## 11. Stop condition

**After Sprint 5 implementation, STOP for review/audit before Sprint 6.**

Specifically:

1. After all 7 Sprint 5 owner tasks close (`br ready --json` returns no Sprint-5 tasks), engineer authors `grimoires/loa/a2a/sprint-5/reviewer.md` per the implementation-report template.
2. Engineer halts. Operator invokes `/review-sprint sprint-5`.
3. If review returns CHANGES_REQUIRED: engineer addresses, re-runs review until APPROVED.
4. If review APPROVED: operator invokes `/audit-sprint sprint-5`.
5. If audit APPROVED: operator commits Sprint 5 (mirroring Sprint 0/1/2/3/4 commit pattern).
6. ONLY AFTER Sprint 5 commit lands: operator decides whether to start Sprint 6 (security review epic) or pause.
7. If operator approves Sprint 6 continuation: invoke `/implement sprint-6` (or `/bug` triage if Sprint 5 surfaced specific Sprint 6 candidates).
8. If operator does NOT approve: stop. Sprint 6 deferred.

**Do NOT auto-chain Sprint 5 → Sprint 6.** Each sprint maintains separate gates, reviews, audits, and commits.

**Do NOT auto-commit.** Per operator stop condition.

---

## 12. Quick verification commands for fresh-session sanity check

```bash
# Verify cycle state intact
git log --oneline -6                                    # b8a4ed8 at HEAD
git status                                              # clean
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
node --test tests/corona_test.js                        # tests 93 / pass 93 / fail 0
node scripts/corona-backtest.js                         # Run 1 reproducible against committed corpus

# Verify Sprint 0/1/2/3/4 closed + approved
br list --status closed --json | grep -c "sprint-[01234]-"   # Expect: ≥17 (3 Sprint 0 + 3 Sprint 1 + 5 Sprint 2 + 8 Sprint 3 + 3 Sprint 4)

# Verify Sprint 5 ready
br list --status open --json | grep -c "sprint-5-"      # Expect: 8 (corona-3fg + 7 owner tasks)
ls grimoires/loa/a2a/sprint-5/                          # Expect: handoff.md (this file)
ls grimoires/loa/calibration/corona/run-2/ 2>/dev/null  # Expect: not present (Sprint 5 unstarted)
cat grimoires/loa/calibration/corona/calibration-manifest.json    # Expect: []
cat grimoires/loa/calibration/corona/run-1/corpus_hash.txt
# Expect: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1

# Verify Sprint 4 evidence intact
wc -l grimoires/loa/calibration/corona/empirical-evidence.md   # Expect: 1139
grep -c "verification_status:" grimoires/loa/calibration/corona/empirical-evidence.md   # Expect: ≥10 (manifest entry sketches)
grep -c "ENGINEER_CURATED_REQUIRES_VERIFICATION\|OPERATIONAL_DOC_ONLY\|HYPOTHESIS_OR_HEURISTIC" grimoires/loa/calibration/corona/empirical-evidence.md
# Expect: many (the §1.1 taxonomy + per-section disclaimers + per-entry tags)

# Verify Sprint 6 unstarted
br list --status open --json | grep -c "sprint-6-"      # Expect: ≥3 (corona-r4y, corona-a6z, corona-8m8 at minimum)
```

---

## 13. Recommended Sprint 5 fresh-session kickoff

1. **First operator action**: invoke `/implementing-tasks Sprint 5` (or `/implement sprint-5`) in the fresh session.
2. **First implementation step**: read this handoff packet end-to-end.
3. **Second step**: read priority files §4 in order, synthesizing to `grimoires/loa/NOTES.md` as needed. Sprint 4's evidence document is the largest single read (1139 lines); the §1.1 taxonomy + §3-§8 entry sketches are the load-bearing parts.
4. **Third step**: parallel `corona-8yb` (processor refits) + `corona-28z` (theatre refits) — judgment-driven by Sprint 4 evidence + Run 1 numbers.
5. **Fourth step**: `corona-25p` (manifest population) — copy entry sketches from Sprint 4 §3-§8 + per-key expansion of §7 + add backtest-derived entries from Run 1 / Run 2.
6. **Fifth step**: `corona-3o4` + `corona-15v` (structural + regression-gate tests).
7. **Sixth step**: `corona-3ja` (Run 2 execution).
8. **Seventh step**: `corona-33u` (delta report).
9. **Sprint 5 close**: `/review-sprint sprint-5` → `/audit-sprint sprint-5` → operator commit.

---

## 14. HITL pause-points within Sprint 5 (suggested, operator may revise)

The fresh-session agent should consider surfacing for HITL review at these natural breakpoints:

1. **After `corona-8yb` + `corona-28z` parameter refits, before `corona-25p` manifest population** — operator review of WHICH parameters were refitted and WHY (Sprint 4 evidence + Run 1 motivation). Catches over-aggressive refits early.
2. **After `corona-25p` manifest population, before `corona-3o4` + `corona-15v` test landing** — operator review of `calibration-manifest.json` for verification_status accuracy, provisional flag correctness, promotion_path completeness. This is the W-1 gate.
3. **After `corona-15v` regression gate test landing, before `corona-3ja` Run 2 execution** — operator review of test logic. Confirms inline-equals-manifest test actually catches drift.
4. **After `corona-3ja` Run 2 + `corona-33u` delta report, before Sprint 5 close** — operator review of Run 1 → Run 2 verdict changes per theatre. Confirms improvements are real (W-2: bucket-scheme changes invalidate corpus_hash; if Run 2 verdicts change because of bucket scheme rather than refit, surface).

These are advisory; operator may choose to run Sprint 5 fully autonomously or pause more often per cycle health.

---

## 15. Files Sprint 5 WILL CREATE

```
grimoires/loa/calibration/corona/calibration-manifest.json   # populated from [] to N entries (~30-40 expected)
tests/manifest_structural_test.js  OR  tests/integration/manifest_structural_test.js
tests/manifest_regression_test.js  OR  tests/integration/manifest_regression_test.js
grimoires/loa/calibration/corona/run-2/corpus_hash.txt
grimoires/loa/calibration/corona/run-2/script_hash.txt
grimoires/loa/calibration/corona/run-2/T1-report.md
grimoires/loa/calibration/corona/run-2/T2-report.md
grimoires/loa/calibration/corona/run-2/T3-report.md
grimoires/loa/calibration/corona/run-2/T4-report.md
grimoires/loa/calibration/corona/run-2/T5-report.md
grimoires/loa/calibration/corona/run-2/per-event/      # 25 per-event JSON dumps
grimoires/loa/calibration/corona/run-2/summary.md
grimoires/loa/calibration/corona/run-2/delta-report.md
grimoires/loa/a2a/sprint-5/reviewer.md
grimoires/loa/a2a/sprint-5/engineer-feedback.md   # post /review-sprint
grimoires/loa/a2a/sprint-5/auditor-sprint-feedback.md   # post /audit-sprint
grimoires/loa/a2a/sprint-5/COMPLETED   # post /audit-sprint approval
```

Sprint 5's diff scope is medium-sized: refit edits (small per-file but spread across `src/processor/` + `src/theatres/`), one new JSON file (the manifest), two new test files (or appended to `tests/corona_test.js`), one new run directory.

---

## 16. Out-of-scope for Sprint 5 (explicit rejections)

Items the fresh-session agent should explicitly NOT touch:

- **`src/oracles/*.js`** — runtime oracles. Sprint 5 / `corona-8yb` is processor-only; oracles handle ingestion/parsing. If a refit appears to need oracle changes, surface to operator (likely indicates a Sprint 6 or Sprint 7 task).
- **`construct.yaml`** — the v3 manifest, Sprint 0 deliverable. Sprint 7 publish-readiness territory.
- **`spec/construct.json`, `spec/corona_construct.yaml`** — legacy spec files. Preserved-on-disk per operator hard constraint #5 from Sprint 0+. Sprint 7 polish only.
- **`identity/CORONA.md`, `identity/persona.yaml`** — Sprint 0 identity deliverables. Untouched.
- **`grimoires/loa/calibration/corona/calibration-protocol.md`** — frozen Sprint 2 protocol. Modify only if operator authorizes a Sprint 2 amendment (rare).
- **`grimoires/loa/calibration/corona/theatre-authority.md`** — Sprint 0 settlement authority. Read-only.
- **`grimoires/loa/calibration/corona/empirical-evidence.md`** — Sprint 4 evidence. Narrow citation/path corrections only if a literal error blocks manifest population; otherwise read-only.
- **`grimoires/loa/calibration/corona/corpus/`** — Sprint 3 frozen corpus. Read-only — corpus extension is operator-HITL-gated.
- **`grimoires/loa/calibration/corona/run-1/`** — Sprint 3 baseline. Read-only.
- **`scripts/corona-backtest/scoring/*.js`** — scoring modules. No semantic changes. Operator hard constraint #5 (no shared scoring code) still applies.
- **`scripts/corona-backtest/ingestors/corpus-loader.js`** — §3.7 schema validation contract. Field-set extensions only if Sprint 5 finds a corpus-event field not handled — discovery, not refit.
- **`scripts/corona-backtest/reporting/hash-utils.js`** — corpus_hash + script_hash semantics. Untouched.
- **`tests/corona_test.js` existing tests** — do NOT modify; only append new test suites. The 93 baseline tests are a Sprint 0 invariant.
- **`.claude/`** — System Zone, never edit.
- **`package.json`** — zero-dep invariant.

---

## 17. Handoff acknowledgment

This packet is the operator's primary primer for Sprint 5 in a fresh context window. The fresh-session agent should:

1. Read this file at the top of the session.
2. Read priority-listed files in §4 in order (Sprint 4 evidence document is the largest single read).
3. Confirm cycle state via §12 verification commands.
4. Execute the 7 owner tasks per the §3 ordering (or §13 step-by-step).
5. Surface to operator at the §14 HITL pause-points OR if any §7 hard constraint is at risk.
6. **Stop after Sprint 5 implementation per §11 stop condition.** Do NOT auto-start Sprint 6.

The operator's stated goal: refit cycle-001 parameters using Sprint 4 evidence + Run 1 baseline, populate the manifest as the source of truth for parameter provenance, build the regression gate that prevents inline-vs-manifest drift, and produce Run 2 + delta report. This packet preserves that posture across the session boundary.

---

*Sprint 5 handoff packet authored cycle-001 Sprint 4 close, after Sprint 4 implementation (1139-line empirical-evidence.md), review (Round 1 CHANGES_REQUIRED → Round 2 APPROVED), audit (Round 1 CHANGES_REQUIRED → Round 3 APPROVED), and commit (`b8a4ed8`). All Sprint 0/1/2/3/4 work pushed to origin/main. Sprint 5 unstarted.*
