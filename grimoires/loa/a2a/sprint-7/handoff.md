# Sprint 7 Handoff Packet — CORONA cycle-001-corona-v3-calibration

**Status**: READY FOR FRESH-SESSION KICKOFF
**Authored**: 2026-05-01 (Sprint 6 close, post-commit)
**Sprint type**: FINAL VALIDATION + CLOSEOUT — final calibration run, BFZ refresh, validator green, E2E goal validation, version bump v0.2.0
**Scope size**: Sprint 7 MEDIUM (5 tasks)
**Operator HITL constraint**: HITL remains ON. Sprint 7 only. **This is the closing sprint of cycle-001 — do NOT auto-tag, auto-release, or auto-publish.**

---

## 1. Current repo / branch / commit state

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD commit | `4afd9f2` — `fix(corona): add sprint 6 input-validation hardening` |
| Upstream | `origin/main` — up to date (0 ahead, 0 behind) |
| Working tree | Clean |
| Sprint 7 status | **Unstarted** |
| Recent cycle-001 commits | `b424da7` Sprint 0 → `2c75ecb` Sprint 1 → `33e9133` Sprint 2 → `cd7648f` Sprint 3 → `b8a4ed8` Sprint 4 → `fc763d7` Sprint 5 → `4afd9f2` Sprint 6 |

### Quality gates at Sprint 7 entry

```bash
git status                                              # clean
git log --oneline -8                                    # 4afd9f2 at HEAD
git rev-list --left-right --count main...origin/main    # 0 0 (in sync)

./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant @ b98e9ef

node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js   # tests 160 / pass 160 / fail 0

CORONA_OUTPUT_DIR=run-sprint-7-scratch node scripts/corona-backtest.js  # reproducible
                                                                          # corpus_hash: b1caef3...
                                                                          # script_hash: 17f6380b...
                                                                          # composite_verdict: fail
                                                                          # T1 0.1389, T2 0.1389, T3 6.76h, T4 0.1600, T5 25.0%/90.0s/100%
```

### Sprint 0–6 close states (preserved at HEAD `4afd9f2`)

- **Sprint 0** (`b424da7`): v3 readiness audit, theatre authority map, T4 S-scale scaffold, identity/CORONA.md, compose_with[tremor], commands, pack_dependencies, local validator. Reviewed + audited + pushed.
- **Sprint 1** (`2c75ecb`): composition_paths declared, calibration directory scaffolded with placeholders. Reviewed + audited + pushed.
- **Sprint 2** (`33e9133`): frozen calibration protocol + T4 flare-class proxy retirement. Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited + pushed.
- **Sprint 3** (`cd7648f`): backtest harness + 25-event primary corpus + Run 1 baseline certificates. Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited + pushed.
- **Sprint 4** (`b8a4ed8`): empirical-evidence.md authored (1139 lines, 14 primary citations, 6 PRD §5.5 coverage targets, 20 manifest entry sketches, §1.1 Citation Verification Status taxonomy). Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited (R1 CHANGES_REQUIRED → R3 APPROVED) + pushed.
- **Sprint 5** (`fc763d7`): calibration-manifest.json populated (30 entries) + structural test (22 tests) + regression gate (29 tests) + Run 2 certificates + per-theatre delta report. Sprint 5 made NO runtime parameter refits per evidence-driven analysis. Run 2 numerics IDENTICAL to Run 1 (uniform-prior baseline architectural reality). Reviewed ("All good (with noted concerns)") + audited (APPROVED, 1 LOW informational) + pushed.
- **Sprint 6** (`4afd9f2`): security-review.md authored (25 findings: 0 critical / 0 high / 9 medium / 16 low) + PEX-1 carry-forward fix (proton-cascade.js optional chaining) + C-006/LOW-1 carry-forward fix (corpus-loader negative-latency rejection in T5 stale_feed_events) + 16 new tests in tests/security/. Reviewed ("All good (with noted concerns)") + audited (APPROVED, 0 critical/high/medium, 3 LOW informational) + pushed.

### Sprint 6 deliverables locked at HEAD

- `grimoires/loa/calibration/corona/security-review.md` — 197 lines, SDD §8.3 template, 25 findings classified per SDD §8.4. Sprint 7 must NOT modify this except for narrow corrections directly required by Sprint 7 work.
- `src/theatres/proton-cascade.js` — PEX-1 fix (optional chaining at lines 266, 284). 4-character defensive patch.
- `scripts/corona-backtest/ingestors/corpus-loader.js` — C-006 fix (validateT5 negative-latency rejection at lines 326-349). 24-line addition.
- `tests/security/proton-cascade-pex1-test.js` (6 tests) + `tests/security/corpus-loader-low1-test.js` (10 tests) — Sprint 6 hardening regression coverage.
- `grimoires/loa/a2a/sprint-6/` — full review trail: handoff.md, reviewer.md, engineer-feedback.md, auditor-sprint-feedback.md, COMPLETED.

### Frozen artifacts at Sprint 7 entry (read-only invariants)

- `corpus_hash`: `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` — hashes the 25-event primary corpus tree at `grimoires/loa/calibration/corona/corpus/primary/`. **MUST match in run-N-final.**
- `script_hash`: `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` — hashes the scoring modules at `scripts/corona-backtest/scoring/`. **MUST match in run-N-final** (operator hard constraint #9: no scoring-semantics changes).
- `package.json` version: `0.1.0` → target `0.2.0` per Sprint 7 Task 7.4 (corona-w1v). Operator may amend per discretion.
- `construct.yaml` v3 manifest: schema commit hash `b98e9ef`. Sprint 0 deliverable; do not modify unless final-validate exposes a binding gap.
- `package.json` `"dependencies": {}` — zero-runtime-dependency invariant per PRD §8.1.

---

## 2. Sprint 7 objective

Sprint 7 is the **final validation and closeout sprint** of cycle-001. It is NOT a new-feature sprint, NOT a calibration-rework sprint, and NOT a research sprint. It is the final-state verification + provenance refresh + version bump that closes cycle-001 and prepares the construct for v0.2.0.

Per PRD §3.3 + sprint.md L465-499, Sprint 7 delivers:

1. **GF.1** — `./scripts/construct-validate.sh construct.yaml` returns exit 0 against the post-calibration spec.
2. **GF.2** — `BUTTERFREEZONE.md` (or v3 equivalent) refreshed with post-calibration provenance (manifest pointer + Run-N-final reference + Sprint 6 security-review.md reference + honest no-refit posture).
3. **GF.3** — Final corpus run committed at `grimoires/loa/calibration/corona/run-N-final/` with full per-theatre certificate set + summary + corpus_hash/script_hash files + per-event/.
4. **GF.4** — Full test suite green: 144 baseline + 16 Sprint 6 security tests + any new Sprint 7 tests required by E2E goal validation.

Plus:
- **Version bump** — `package.json` `0.1.0` → `0.2.0` (per Sprint 7 Task 7.4 / corona-w1v; operator may amend per discretion).
- **E2E goal validation** — walk every PRD goal (G0.1-G0.12 + GC.1-GC.5 + GF.1-GF.4) end-to-end against the post-Sprint-6 codebase + Run-N-final certificates.

**Sprint 7 closes cycle-001.** The construct enters v0.2.0-ready posture after Sprint 7 commit; the actual git tag and any release announcement are operator-gated and may be deferred.

**Sprint 7 epic**: `corona-1ml` (currently OPEN).

---

## 3. Sprint 7 owner tasks (5 tasks; MEDIUM scope)

| Beads ID | Priority | Task | Owner deliverable |
|----------|----------|------|--------------------|
| `corona-32r` | 1 | sprint-7-final-validator-green | `./scripts/construct-validate.sh construct.yaml` exit 0; capture output. → **[GF.1]** |
| `corona-8v2` | 1 | sprint-7-refresh-butterfreezone | Refresh `BUTTERFREEZONE.md` (or v3 equivalent at `BUTTERFREEZONE.v3.md`) with post-calibration provenance. → **[GF.2]** |
| `corona-1p5` | 1 | sprint-7-execute-run-N-final | Execute final backtest run → `grimoires/loa/calibration/corona/run-N-final/` certificates. corpus_hash + script_hash MUST match Sprint 3 baseline (`b1caef3...` / `17f6380b...`). → **[GF.3]** |
| `corona-w1v` | 2 | sprint-7-version-bump | `package.json` `0.1.0` → `0.2.0`. Operator decides on git tag. |
| `corona-2k3` | 0 (P0) | sprint-7-e2e-goal-validation | E2E goal validation per PRD §3.1-§3.3 + sprint.md Goal Mapping Appendix. Walk G0.1-G0.12 + GC.1-GC.5 + GF.1-GF.4 against final state. → **[GF.4]** |
| `corona-1ml` | 1 | Sprint 7 epic | Tracker for the above 5 tasks |

### Recommended task ordering

1. **`corona-32r`** — run validator first to catch any v3 conformance regression. Should be green at HEAD (already verified at Sprint 6 close).

2. **`corona-1p5`** — execute final backtest run. Use `CORONA_OUTPUT_DIR=run-N-final node scripts/corona-backtest.js` (where N is the next un-used run number; current state has run-1 and run-2 committed — Sprint 7 should produce **run-3-final** unless operator selects a different N). Verify corpus_hash + script_hash match Sprint 3 baseline. Verify per-theatre numerics IDENTICAL to Run 1 / Run 2 (no scoring drift since hashes match).

3. **`corona-8v2`** — refresh BUTTERFREEZONE.md (or v3 equivalent). The refresh must reflect:
   - v3 readiness (Sprint 0 deliverable; construct.yaml @ schema b98e9ef)
   - calibration-manifest.json existence + 30-entry coverage (Sprint 5)
   - Run 1 / Run 2 / Run-N-final status with hashes
   - Run 2 = Run 1 numerically (architectural reality of uniform-prior baseline; **NOT a calibration improvement**)
   - Sprint 6 security-review.md (0 critical / 0 high / 9 medium / 16 low)
   - Known limitations + future-cycle owner items
   - **Honest no-refit posture** — Sprint 5 made NO parameter refits; the Wheatland prior + corpus-annotated baseline is uniform across both runs by design.

4. **`corona-w1v`** — version bump `0.1.0` → `0.2.0` in `package.json`. Update CHANGELOG.md if present (currently absent — Sprint 7 may create if scope-justified). Operator decides on git tag.

5. **`corona-2k3`** (P0) — E2E goal validation. Walk every PRD goal:
   - **G0.1-G0.12** (Sprint 0 v3-readiness): construct.yaml validity, identity/, compose_with, commands, pack_dependencies, etc.
   - **GC.1-GC.5** (calibration acceptance): primary corpus, baseline run, per-theatre verdicts, manifest, no-refit Sprint 5.
   - **GF.1-GF.4** (final acceptance): validator green, BFZ refreshed, run-N-final committed, test suite green.
   - Each goal: cite acceptance evidence (file:line, run-N-final certificate path, test name). Produce `grimoires/loa/a2a/sprint-7/e2e-goal-validation.md` (or fold into reviewer.md per agent discretion).

### Sprint 7 acceptance criteria (from sprint.md L482-487 + L491-495)

- **GF.1** (sprint.md L483): `construct-validate.sh` green against post-calibration spec — exit 0.
- **GF.2** (sprint.md L484): BFZ refreshed with post-calibration provenance.
- **GF.3** (sprint.md L485): Final certificates committed at `run-N-final/`.
- **GF.4** (sprint.md L486): Test suite green (144 baseline + 16 Sprint 6 security + any new Sprint 7 tests).
- All G0.x, GC.x, GF.x goals validated end-to-end (Task 7.5 / E2E).
- Zero new runtime deps (`package.json:32 "dependencies": {}` invariant — only the version field changes).

### Sprint 7 dependencies

- **All prior sprints** — codebase post-Sprint-6 at HEAD `4afd9f2` is the final-state target. Sprint 7 validates this state; it does NOT amend prior sprints unless final validation exposes a direct blocker.
- **Sprint 6 security gate** — closed APPROVED at `4afd9f2`. 0 critical / 0 high / 0 medium audit findings. 3 LOW informational observations (LOW-A1, LOW-A2, LOW-A3) deferred to Sprint 7+ at engineer discretion.
- **Run 1 / Run 2 hash invariants** — corpus_hash `b1caef3...` + script_hash `17f6380b...` MUST be reproducible in Run-N-final.

---

## 4. Required reading order for the fresh agent

The fresh-session agent has zero context. Read in this order; STOP when context budget runs low and synthesize to `grimoires/loa/NOTES.md` per the Tool Result Clearing Protocol.

| # | File | Lines | Why |
|---|------|-------|-----|
| 1 | **This file** — `grimoires/loa/a2a/sprint-7/handoff.md` | ~350 | Primer; covers everything below in summary form |
| 2 | `grimoires/loa/sprint.md` — Sprint 7 section + Goal Mapping appendix | ~80 | Sprint 7 acceptance criteria GF.1-GF.4 + Task 7.5 E2E goal-validation methodology + complete G0.x/GC.x/GF.x goal table at L685-695 |
| 3 | `grimoires/loa/prd.md` — §3 Goals + §9 Scope | ~50 | PRD acceptance criteria source of truth — G0.x, GC.x, GF.x verbatim |
| 4 | `grimoires/loa/sdd.md` — §8 Security review reference | ~70 | Sprint 6 closed; Sprint 7 should not regress §8 hardening |
| 5 | `grimoires/loa/calibration/corona/calibration-protocol.md` | 523 | Frozen Sprint 2 protocol. Sprint 7 must not change this; references it for run-N-final eligibility / hash semantics |
| 6 | `grimoires/loa/calibration/corona/theatre-authority.md` | (varies) | Sprint 0 settlement-authority map. Read-only for Sprint 7; informs BFZ refresh provenance |
| 7 | `grimoires/loa/calibration/corona/calibration-manifest.json` | ~700 | Sprint 5 source of truth for parameter provenance. 30 entries. **Read-only for Sprint 7 except for narrow corrections directly required by E2E goal validation; operator HITL required.** |
| 8 | `grimoires/loa/calibration/corona/empirical-evidence.md` | 1139 | Sprint 4 deliverable. Read-only for Sprint 7. Source for BFZ provenance refresh. |
| 9 | `grimoires/loa/calibration/corona/security-review.md` | 197 | Sprint 6 deliverable. Read-only for Sprint 7. Source for BFZ "known limitations" section + closeout posture (0 critical / 0 high / 9 medium / 16 low). |
| 10 | `grimoires/loa/calibration/corona/run-1/summary.md` | (varies) | Sprint 3 baseline. corpus_hash + script_hash invariants. Run-1 numerics for delta comparison. |
| 11 | `grimoires/loa/calibration/corona/run-2/delta-report.md` | (varies) | Sprint 5 delta analysis explaining why Run 2 = Run 1 numerically (uniform-prior architecture; NOT a calibration improvement). Sprint 7 BFZ + closeout must echo this honest framing. |
| 12 | `grimoires/loa/a2a/sprint-5/engineer-feedback.md` | ~344 | Sprint 5 review trail; LOW-1 evidence-020 documented limitation (Sprint 7 may strengthen if narrow + safe per §7 below). |
| 13 | `grimoires/loa/a2a/sprint-5/auditor-sprint-feedback.md` | ~441 | Sprint 5 audit; LOW-1 informational + non-blocking. |
| 14 | `grimoires/loa/a2a/sprint-6/engineer-feedback.md` | ~250 | Sprint 6 review trail; LOW-A1/A2/A3 adversarial concerns (Sprint 7+ polish at engineer discretion). |
| 15 | `grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md` | ~440 | Sprint 6 audit; APPROVED with 0 critical/high/medium, 3 LOW informational. |
| 16 | `construct.yaml` | (varies) | v3 manifest target of `corona-32r`. Sprint 7 must NOT modify unless validator regression directly requires. |
| 17 | `BUTTERFREEZONE.md` (or v3 equivalent at `BUTTERFREEZONE.v3.md`) | (varies) | Sprint 7 / `corona-8v2` refresh target. |
| 18 | `package.json` | ~50 | Version field target. Zero-runtime-dependency invariant. |
| 19 | `scripts/construct-validate.sh` | (varies) | Sprint 0 validator. Used by `corona-32r`. |
| 20 | `scripts/corona-backtest.js` | (varies) | Sprint 3 entrypoint. Used by `corona-1p5`. |
| 21 | `tests/corona_test.js` | ~1188 | 93 baseline tests; Sprint 7 must NOT regress. |
| 22 | `tests/manifest_structural_test.js` | ~385 | 22 Sprint 5 manifest structural tests. Read-only. |
| 23 | `tests/manifest_regression_test.js` | ~226 | 29 Sprint 5 regression tests (inline-equals-manifest per SDD §7.3). Read-only. |
| 24 | `tests/security/` | 351 | Sprint 6 security tests (16 total: 6 PEX-1 + 10 C-006). Read-only. |

### Read-only reference patterns (do NOT mutate)

- **TREMOR**: `C:\Users\0x007\tremor` (read-only). Sprint 7 may inspect for closing-sprint conventions but does NOT need this read.
- **BREATH**: `C:\Users\0x007\breath` (read-only). Pattern source from Sprint 4. Sprint 7 does not need this.

---

## 5. Sprint 7 expected outputs

Per the operator's brief + sprint.md L474-481 + GF.1-GF.4:

1. **Final run directory** — `grimoires/loa/calibration/corona/run-N-final/` (where N is the next un-used run number; with run-1 and run-2 committed, the convention suggests `run-3-final` unless operator selects otherwise). Contains:
   - `T1-report.md` through `T5-report.md` (per-theatre certificates)
   - `summary.md` (composite verdict + per-theatre summary)
   - `corpus_hash.txt` + `script_hash.txt` (must match Sprint 3 baseline)
   - `per-event/` directory (per-event JSON certificates)
   - Optionally `delta-report.md` (Sprint 7 may produce a final-state delta vs. Run 2 for closeout documentation; numerics will be identical because hashes match)

2. **Refreshed BFZ** — `BUTTERFREEZONE.md` (or `BUTTERFREEZONE.v3.md` at engineer discretion). Must reflect post-Sprint-6 codebase state with post-calibration provenance tags.

3. **Version bump** — `package.json` version `0.1.0` → `0.2.0` (per AC; operator may amend). Optionally a `CHANGELOG.md` entry if scope-justified.

4. **E2E goal validation report** — `grimoires/loa/a2a/sprint-7/e2e-goal-validation.md` OR folded into `reviewer.md` per agent discretion. Walks G0.1-G0.12 + GC.1-GC.5 + GF.1-GF.4 with per-goal evidence.

5. **Sprint 7 implementation report** — `grimoires/loa/a2a/sprint-7/reviewer.md`. Implementation-report template per SDD pattern + AC Verification section walking GF.1-GF.4 verbatim.

6. **Updated `grimoires/loa/sprint.md`** — Sprint 7 deliverable/AC/task checkmarks at sprint close.

### File-level expectations

```
grimoires/loa/calibration/corona/run-N-final/             # corona-1p5 (where N likely = 3)
BUTTERFREEZONE.md  OR  BUTTERFREEZONE.v3.md               # corona-8v2
package.json                                               # corona-w1v (version field only)
grimoires/loa/a2a/sprint-7/reviewer.md                    # implementation report
grimoires/loa/a2a/sprint-7/e2e-goal-validation.md         # corona-2k3 (or folded into reviewer.md)
grimoires/loa/a2a/sprint-7/{engineer-feedback,auditor-sprint-feedback}.md + COMPLETED  # post review/audit
grimoires/loa/sprint.md                                    # Sprint 7 checkmarks
```

### File-level expectations (CONDITIONAL — only if E2E goal validation surfaces a direct blocker)

```
construct.yaml                                             # only if corona-32r validator regresses
calibration-manifest.json                                  # only if E2E surfaces a citation/path error
calibration-protocol.md / theatre-authority.md / empirical-evidence.md  # only narrow citation/path corrections
src/oracles/swpc.js / donki.js / corpus-loader.js / proton-cascade.js  # only if E2E exposes a hardening regression
tests/                                                     # only if Sprint 7 adds tests (rare for closeout sprint)
```

---

## 6. Hard constraints

These are operator-locked and binding throughout Sprint 7 execution.

1. **Sprint 7 only.** This is the closing sprint of cycle-001. Do NOT start a Sprint 8 or a cycle-002 amendment. **No new-feature work, no calibration rework, no research sprints.**

2. **HITL remains ON.** Operator approval gates: pre-implementation (this handoff), post-implementation (before review), post-review (before audit), post-audit (before commit), post-commit (before tag/release). Surface for HITL at natural break points; do not auto-chain.

3. **Do NOT reopen Sprints 0-6** unless final validation exposes a direct blocker. Sprint 7 closeout assumes Sprint 0-6 deliverables are correct as committed. Examples that would warrant reopening:
   - Validator regression — a new bug in `construct-validate.sh` rejects `construct.yaml`. Investigate; surface to operator.
   - Hash drift — corpus_hash or script_hash in Run-N-final differs from Sprint 3 baseline. Investigate (likely a non-Sprint-7 modification slipped through review). Surface to operator.
   - PRD goal failure — an E2E goal validation walk reveals a goal cannot be evidenced. Investigate; surface to operator.

4. **Do NOT refit parameters.** Sprint 5 closed the parameter-refit window. Sprint 7 is calibration-final, NOT calibration-refit. If a parameter would need to change to satisfy E2E validation, that's a cycle-001 amendment territory — surface to operator.

5. **Do NOT change scoring semantics.** `scripts/corona-backtest/scoring/t<id>-*.js` modules are operator hard constraint #5 (no shared scoring code) + #9 (no scoring-semantics changes). Sprint 7 must NOT touch scoring logic. The script_hash invariant `17f6380b...` MUST be preserved.

6. **Do NOT change corpus eligibility.** `calibration-protocol.md` §3.2 primary-corpus rules + §3.7 schema annotations are Sprint 2 frozen. Sprint 7 may NOT amend.

7. **Do NOT alter Run 1 or Run 2.** `grimoires/loa/calibration/corona/run-1/` + `run-2/` are committed Sprint 3 + Sprint 5 deliverables. Sprint 7 produces a NEW run at `run-N-final/`; it does NOT modify the prior runs.

8. **Do NOT silently weaken manifest provenance.** `grimoires/loa/calibration/corona/calibration-manifest.json` is the Sprint 5 source of truth. Acceptable Sprint 7 mutations are limited to: a citation/path correction if E2E validation discovers a literal error; addition of an entry corresponding to a new constant introduced by Sprint 7 (rare — closeout sprint typically introduces no new constants). Operator HITL required for any manifest change.

9. **Do NOT add dependencies.** `package.json:32 "dependencies": {}` is invariant. Sprint 7 may use ONLY: `node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch` (Node 20+), `node:test`, `node:assert/strict`. No `devDependencies` either. Version bump (`0.1.0` → `0.2.0`) is the only `package.json` mutation expected.

10. **Preserve zero-runtime-dependency posture.** No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `node_modules` in the repo.

11. **Do NOT perform new research.** Sprint 4 closed the literature-research window. Sprint 7 BFZ refresh consumes Sprint 4 evidence verbatim; it does not add new citations or upgrade verification_status tiers (per §7 Sprint 4 epistemic discipline below).

12. **Do NOT expand into new architecture.** Sprint 7 is closeout. The harness, the runtime construct, the scoring modules, the manifest schema, the security boundary — all are frozen. If a Sprint 7 finding suggests architectural change, document and surface to operator.

13. **This is closeout/finalization, not new feature work.** Sprint 7 must explicitly NOT introduce new features, new theatres, new oracles, new corpus events, new tests beyond E2E validation evidence, new commands, new pack_dependencies entries, or new compose_with declarations.

14. **If final validation exposes a real blocker, stop and surface it instead of patching broadly.** Sprint 7's job is to verify the v0.2.0-ready state. If the state isn't ready, that's a cycle-001 amendment territory — surface, don't patch over.

---

## 7. Carry-forward warnings / known issues

Documented for Sprint 7's awareness; some are open polish items, others are downstream-cycle-owned.

| ID | Source | Concern | Sprint 7 disposition |
|----|--------|---------|----------------------|
| **Sprint 5 LOW-1** | `grimoires/loa/a2a/sprint-5/engineer-feedback.md` (LOW-1) + `auditor-sprint-feedback.md` (LOW-1 informational) | `corona-evidence-020` match_pattern is a comment-substring match (`"log-flux"`) rather than a runtime literal anchor. Documented at Sprint 5 close in 4 places; verification_status=`OPERATIONAL_DOC_ONLY`. | Sprint 7 may strengthen the regex ONLY if the change is narrow + safe. Acceptable form: anchor on imported runtime function names (e.g., `match_pattern: "classToFlux\|classifyFlux\|log-flux"` to match the import line at `src/processor/uncertainty.js:15`). Must NOT touch other manifest entries. Operator HITL required. **If unsure, defer to future cycle.** |
| **Sprint 6 LOW-A1** | `grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md` LOW-A1 | `resolveOutputDir` (`scripts/corona-backtest/config.js:121-124`) parallel to C-008 not catalogued in security-review.md. Both functions consume operator-controlled env paths without `..`-traversal prevention. | Sprint 7 may add a parallel C-009 finding to security-review.md OR leave deferred per operator-trust boundary (PRD §9.2). Documentation polish only; no code change required. **If unsure, defer to future cycle.** |
| **Sprint 6 LOW-A2** | `grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md` LOW-A2 | C-006 (medium) vs LOW-1 (low) severity inconsistency for the same underlying issue (corpus-loader negative-latency rejection). Cross-references exist; severity not reconciled. | Sprint 7 may reconcile by adding a footnote OR choosing one severity. Documentation polish only. **If unsure, defer to future cycle.** |
| **Sprint 6 LOW-A3** | `grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md` LOW-A3 | Backtest harness defaults to `run-1` output, causing accidental Sprint 6 in-flight overwrite (reverted). Future operators may repeat the mistake. | Sprint 7 MAY change the harness default to a scratch dir name (e.g., `'run-scratch'`) or require explicit `CORONA_OUTPUT_DIR`. **This is a Sprint 3 architectural amendment in scope only if operator approves.** Otherwise defer. **Recommendation**: defer to future cycle to keep Sprint 7 closeout-tight. |
| **Sprint 3/Sprint 5 architectural truth** | `run-2/delta-report.md` | Run 2 = Run 1 numerically because the harness uses uniform-prior + corpus-annotated baseline. Sprint 5 made NO parameter refits per evidence-driven analysis. **The construct's quoted Brier/MAE/FP/p50/sw values reflect the baseline, NOT a calibration improvement.** | **Sprint 7 closeout MUST NOT claim calibration improved performance.** BFZ refresh + e2e-goal-validation must explicitly state: "Run 2 = Run 1 numerically by design (uniform-prior architecture). Sprint 5 chose no-refit per evidence-driven discipline. v0.2.0 ships the construct as a deployable + calibration-attempted construct, NOT a calibration-improved one." Honest framing is non-negotiable. |
| **Sprint 4 epistemic discipline** | `grimoires/loa/calibration/corona/empirical-evidence.md` §1.1 + `calibration-manifest.json` verification_status fields | Per Sprint 4 §1.1 Citation Verification Status taxonomy, manifest entries have one of: `VERIFIED_FROM_SOURCE` (provisional=false), `ENGINEER_CURATED_REQUIRES_VERIFICATION` (provisional=true), `OPERATIONAL_DOC_ONLY` (provisional=true), `HYPOTHESIS_OR_HEURISTIC` (provisional=true). | **Sprint 7 MUST NOT promote ENGINEER_CURATED_REQUIRES_VERIFICATION, OPERATIONAL_DOC_ONLY, or HYPOTHESIS_OR_HEURISTIC values to verified truth.** Each non-VERIFIED_FROM_SOURCE entry has a `promotion_path` indicating the literature/empirical work needed for promotion. Sprint 7 BFZ + closeout docs must echo this taxonomy verbatim. |
| **Sprint 6 security baseline** | `grimoires/loa/calibration/corona/security-review.md` + `auditor-sprint-feedback.md` | 0 critical / 0 high / 0 medium audit findings at Sprint 6 close. PEX-1 + C-006/LOW-1 carry-forwards closed. 23 non-critical findings catalogued as deferred or accepted residual. | **Sprint 7 MUST NOT regress input-validation hardening.** PEX-1 fix at `proton-cascade.js:266, 284` and C-006 fix at `corpus-loader.js:326-349` are now permanent baseline. Any Sprint 7 source change to these files MUST preserve the optional chaining + negative-latency rejection. |
| Sprint 0 carry-forwards | Sprint 0 reviewer + auditor docs | Publish-readiness items (commands.path JS-file vs upstream `commands/*.md`, L2 publish gates, schemas/CHECKSUMS.txt, tempfile EXIT trap, ajv-formats install). | Sprint 7's `corona-32r` (final-validate) is the natural owner for L2 publish-readiness gap reconciliation. May surface gaps that block actual publish; this handoff packet does NOT pre-judge. **If gaps remain, Sprint 7 closeout posture must NOT claim publish-ready** (only v0.2.0-ready in the sense of "construct + calibration committed"; actual L2 publish is a separate gate). |
| Sprint 1 review C5 | `grimoires/loa/a2a/sprint-1/engineer-feedback.md` | `composition_paths.reads: []` registry compatibility (verify against construct-network indexer). | Sprint 7 / `corona-32r` may verify if the construct-network indexer is locally available; otherwise defer with a noted limitation. |

**Net effect on Sprint 7**: the major carry-forward is the **honest no-refit posture**. BFZ + closeout docs must accurately reflect cycle-001 reality. Other carry-forwards are at-engineer-discretion polish items.

---

## 8. Final validation focus

Per the operator's brief, Sprint 7 final validation must verify:

### 8.1 Construct validator green
- `./scripts/construct-validate.sh construct.yaml` exit 0.
- Output: "OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)" (or equivalent).
- Already verified at Sprint 6 close; Sprint 7 reconfirms post-version-bump.

### 8.2 Full test suite green
- `node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js tests/security/proton-cascade-pex1-test.js tests/security/corpus-loader-low1-test.js`
- Expected: 160 / pass 160 / fail 0.
- If Sprint 7 adds tests, total may grow. No regression in baseline.

### 8.3 Manifest structural + regression tests green
- `tests/manifest_structural_test.js` (22 tests) — PRD §7 schema + Sprint 4 §1.1 invariants.
- `tests/manifest_regression_test.js` (29 tests) — inline_lookup match_pattern verification per SDD §7.3.
- Both must remain green. Any failure indicates manifest drift.

### 8.4 Security tests green
- `tests/security/proton-cascade-pex1-test.js` (6 tests) — PEX-1 regression.
- `tests/security/corpus-loader-low1-test.js` (10 tests) — C-006 regression.
- Both must remain green. Any failure indicates Sprint 6 hardening regression.

### 8.5 Final backtest run reproducible
- `CORONA_OUTPUT_DIR=run-N-final node scripts/corona-backtest.js` — produce certificates.
- Verify in `run-N-final/summary.md`:
  - `Corpus hash: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` (matches Sprint 3 baseline)
  - `Script hash: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (matches Sprint 3 baseline)
  - Per-theatre numerics IDENTICAL to Run 1 / Run 2: T1 0.1389 / T2 0.1389 / T3 6.76h / T4 0.1600 / T5 25.0%/90.0s/100%.
- Any divergence indicates non-Sprint-7 source modification slipped through review. Investigate.

### 8.6 Final run hashes documented
- `run-N-final/corpus_hash.txt` and `run-N-final/script_hash.txt` exist with matching values.
- BFZ refresh + e2e-goal-validation report cite these hashes verbatim.

### 8.7 Final certificates written to run-N-final/
- All 5 theatres represented: `T1-report.md` through `T5-report.md`.
- `summary.md` with composite verdict.
- `per-event/` directory with per-event JSON certificates.

### 8.8 Package/version state consistent
- `package.json` version `0.2.0` (or operator-amended).
- No new dependencies, no devDependencies.
- No package-lock.json / yarn.lock / pnpm-lock.yaml / node_modules.

### 8.9 BFZ / closeout docs reflect honestly
- v3 readiness (G0.x evidence)
- calibration-manifest.json existence + 30-entry coverage (GC.5 evidence)
- Run 1 / Run 2 / Run-N-final status with hashes (GC.1, GC.2, GF.3)
- **Run 2 = Run 1 numerically by design** — uniform-prior baseline, NOT a calibration improvement
- Sprint 6 security-review.md (0 critical / 0 high / 9 medium / 16 low)
- Known limitations: Sprint 5 LOW-1 (evidence-020 match_pattern), Sprint 6 LOW-A1/A2/A3, Sprint 0 publish-readiness items, Sprint 1 review C5 indexer check
- Future-cycle owner items: any deferred manifest entries with promotion_path, any deferred security findings, any L2 publish-readiness gaps

---

## 9. Sprint 7 review focus areas

When Sprint 7 implementation completes and `/review-sprint sprint-7` runs, the senior reviewer should focus attention on:

1. **Did Sprint 7 stay as closeout only?** Sprint 7 should NOT introduce new theatres, oracles, scoring logic, corpus events, or runtime features. The diff scope should be: 1 new run-N-final/ tree, 1 BFZ refresh, 1 package.json version bump, 1 e2e-goal-validation document, 1 reviewer.md, 1 sprint.md checkmark update. Anything beyond this is scope creep.

2. **Did it avoid new calibration / scoring / research work?** No new manifest entries (unless Sprint 7 introduces a new constant — rare for closeout). No scoring/*.js changes (`git diff --stat scripts/corona-backtest/scoring/` empty). No empirical-evidence.md amendments (unless narrow citation/path correction for E2E validation).

3. **Did final docs overclaim accuracy or readiness?** BFZ + closeout MUST NOT claim "calibration improved performance." Sprint 5 made NO parameter refits; Run 2 = Run 1 numerically by design. v0.2.0 is "construct + calibration committed", not "calibration delivers improved Brier/MAE." Honest framing is the failure mode to guard against.

4. **Did version bump make sense?** `0.1.0` → `0.2.0` per AC. SemVer minor bump (additive features: calibration manifest + regression gate + security review). Acceptable. If operator amended, verify rationale documented.

5. **Did final run preserve hash / scoring invariants?** corpus_hash + script_hash in `run-N-final/summary.md` MUST match Sprint 3 baseline. Per-theatre numerics MUST match Run 1 / Run 2. Any drift = blocker.

6. **Did BFZ accurately reflect current code and provenance?** Spot-check BFZ provenance tags against actual code state. Verify Sprint 4 §1.1 verification_status taxonomy is preserved (no silent promotion of ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / HYPOTHESIS_OR_HEURISTIC).

7. **Were all tests / validator run after final changes?** Reviewer.md must include test-run timestamp + count + validator-output snippet AFTER the version bump and final run. Test counts: 160 (pre-Sprint-7) + N new (Sprint 7) = expected total.

8. **Are remaining limitations documented honestly?** BFZ + closeout must include a "Known Limitations" section enumerating: Sprint 5 LOW-1 (evidence-020), Sprint 6 LOW-A1/A2/A3, Sprint 0 publish-readiness items, Sprint 1 C5 indexer-check, any L2 publish gaps surfaced by Sprint 7. Honest enumeration is non-negotiable.

---

## 10. Sprint 7 audit focus areas

When `/audit-sprint sprint-7` runs, the auditor should focus attention on:

1. **No secrets/API keys committed.** Standard scan over BFZ refresh, e2e-goal-validation report, run-N-final/ contents, version bump diff, sprint-7 a2a artifacts. The version bump MUST NOT introduce hardcoded credentials or default API keys.

2. **No dependency/package mutation except intentional version bump.** `git diff package.json` should show ONLY the version field change `0.1.0` → `0.2.0`. NO new entries in `dependencies` or `devDependencies`. NO `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `node_modules`.

3. **No hidden runtime/scoring/corpus/manifest weakening.** Sprint 7 must NOT regress Sprint 0-6 invariants. Specifically:
   - `git diff src/oracles/swpc.js src/oracles/donki.js scripts/corona-backtest/ingestors/corpus-loader.js src/theatres/proton-cascade.js`: empty (Sprint 6 hardening preserved).
   - `git diff scripts/corona-backtest/scoring/`: empty (operator hard constraint #9).
   - `git diff calibration-manifest.json`: empty unless Sprint 7 amended via narrow correction with operator HITL approval.
   - `git diff calibration-protocol.md theatre-authority.md empirical-evidence.md`: empty unless narrow citation/path correction.
   - `git diff corpus/`: empty (Sprint 3 frozen corpus).
   - `git diff run-1/ run-2/`: empty (Sprint 3 + Sprint 5 baseline / refit).

4. **No unsafe filesystem/network changes.** Sprint 7 final-run uses existing harness; no new `fs.write`/`fs.symlink`/`fs.chmod` primitives, no new `fetch()` endpoints, no shell exec. The run-N-final/ certificates are written by the existing harness (already audited in Sprint 3).

5. **No stale-generated artifact that contradicts current code.** BFZ refresh must be regenerated/updated against post-Sprint-6 code, not carried forward from Sprint 0. Verify by spot-check: BFZ provenance tags should match actual file:line in HEAD source. run-N-final certificates must be generated AFTER any Sprint 7 source changes (if any), not before.

6. **No false publish-readiness claim if L2 validator gaps remain.** Sprint 7 closeout posture is "v0.2.0-ready in the sense of construct + calibration committed." It is NOT "L2 publish-ready" unless `corona-32r` confirms all L2 publish gates pass (Sprint 0 carry-forwards: commands.path JS-file vs upstream `commands/*.md`, schemas/CHECKSUMS.txt, etc.). If L2 gaps remain, BFZ must explicitly disclaim L2 publish-readiness.

7. **No Sprint 8 / cycle-002 work smuggled in.** Sprint 7 is the closing sprint. The diff MUST NOT include speculative theatre scaffolding, new corpus annotations, new scoring modules, or any work that belongs to a future cycle.

---

## 11. Stop condition

**After Sprint 7 implementation, STOP for review/audit before any commit/tag/release.**

Specifically:

1. After all 5 Sprint 7 owner tasks close (`br ready --json` returns no Sprint-7 tasks), engineer authors `grimoires/loa/a2a/sprint-7/reviewer.md` per the implementation-report template.
2. Engineer halts. Operator invokes `/review-sprint sprint-7`.
3. If review returns CHANGES_REQUIRED: engineer addresses, re-runs review until APPROVED.
4. If review APPROVED: operator invokes `/audit-sprint sprint-7`.
5. If audit APPROVED: operator commits Sprint 7 (mirroring Sprint 0/1/2/3/4/5/6 commit pattern).
6. ONLY AFTER Sprint 7 commit lands: operator decides whether to:
   - Tag the v0.2.0 release (`git tag -a v0.2.0 -m "..."` + `git push origin v0.2.0`)
   - Cut a release announcement / changelog
   - Archive cycle-001 and prepare for cycle-002 (or close the project)
   - Pause indefinitely

**Do NOT auto-commit.** Per operator stop condition.

**Do NOT auto-tag or auto-release.** Tag/release is a separate operator gate distinct from commit.

**Do NOT auto-start a Sprint 8 or cycle-002.** Sprint 7 closes cycle-001.

---

## 12. Quick verification commands for fresh-session sanity check

```bash
# Verify cycle state intact
git log --oneline -8                                    # 4afd9f2 at HEAD
git status                                              # clean
git rev-list --left-right --count main...origin/main    # 0 0
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant @ b98e9ef
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js   # tests 160 / pass 160 / fail 0

# Verify Sprint 0/1/2/3/4/5/6 closed
br list --status closed --json | grep -c "sprint:[012345]"   # Expect: ≥24 (3+3+5+8+3+7+4)
br list --status closed --json | grep -c "sprint:6"          # Expect: 4 (corona-r4y + corona-8m8 + corona-a6z + corona-16a epic)

# Verify Sprint 7 ready
br list --status open --json | grep -c "sprint:7"        # Expect: 6 (corona-1ml + corona-32r + corona-8v2 + corona-1p5 + corona-w1v + corona-2k3)
ls grimoires/loa/a2a/sprint-7/                           # Expect: handoff.md (this file)
ls grimoires/loa/calibration/corona/run-3-final/ 2>/dev/null  # Expect: not present (Sprint 7 unstarted)
ls grimoires/loa/calibration/corona/run-N-final/ 2>/dev/null  # Expect: not present (Sprint 7 unstarted)

# Verify Sprint 6 deliverables intact
ls grimoires/loa/calibration/corona/security-review.md   # present
ls grimoires/loa/a2a/sprint-6/COMPLETED                  # present
test -f tests/security/proton-cascade-pex1-test.js && echo "PEX-1 test present"
test -f tests/security/corpus-loader-low1-test.js && echo "C-006 test present"

# Verify Sprint 5 deliverables intact
wc -l grimoires/loa/calibration/corona/calibration-manifest.json   # ~700 lines (30 entries)
test -f tests/manifest_structural_test.js && echo "manifest_structural_test.js present"
test -f tests/manifest_regression_test.js && echo "manifest_regression_test.js present"
ls grimoires/loa/calibration/corona/run-2/               # T1-T5 + summary + corpus_hash + script_hash + per-event/ + delta-report.md

# Verify hash invariants
grep "Corpus hash\|Script hash" grimoires/loa/calibration/corona/run-1/summary.md \
                                grimoires/loa/calibration/corona/run-2/summary.md
# Expect:
#   Corpus hash: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1   (both runs)
#   Script hash: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1   (both runs)

# Verify package.json clean state
grep '"version"' package.json    # "version": "0.1.0"
grep '"dependencies"' package.json   # "dependencies": {}
test -f package-lock.json && echo "PACKAGE-LOCK PRESENT (BAD)" || echo "no package-lock.json"
test -d node_modules && echo "NODE_MODULES PRESENT (BAD)" || echo "no node_modules"
```

---

## 13. Recommended Sprint 7 fresh-session kickoff

1. **First operator action**: invoke `/implementing-tasks Sprint 7` (or `/implement sprint-7`) in the fresh session.
2. **First implementation step**: read this handoff packet end-to-end.
3. **Second step**: read priority files §4 in order. Sprint 7 section of `sprint.md` (~80 lines) is the load-bearing read; `delta-report.md` (Sprint 5) is critical for honest no-refit framing.
4. **Third step**: execute `corona-32r` (validator green sanity check).
5. **Fourth step**: execute `corona-1p5` — final backtest run with `CORONA_OUTPUT_DIR=run-3-final` (or operator-selected N). Verify hash invariants.
6. **Fifth step**: HITL pause-point #1 — surface run-N-final hashes + composite verdict to operator before BFZ refresh.
7. **Sixth step**: execute `corona-8v2` — refresh BFZ with post-calibration provenance. Honest no-refit framing.
8. **Seventh step**: HITL pause-point #2 — surface BFZ draft to operator before version bump.
9. **Eighth step**: execute `corona-w1v` — `package.json` version bump `0.1.0` → `0.2.0`.
10. **Ninth step**: execute `corona-2k3` (P0) — E2E goal validation per PRD §3 + sprint.md Goal Mapping appendix. Walk all G0.x + GC.x + GF.x with file:line evidence.
11. **Tenth step**: HITL pause-point #3 — surface E2E goal validation to operator before authoring reviewer.md.
12. **Eleventh step**: author `grimoires/loa/a2a/sprint-7/reviewer.md` with AC Verification section walking GF.1-GF.4 verbatim.
13. **Sprint 7 close**: `/review-sprint sprint-7` → `/audit-sprint sprint-7` → operator commit → operator decides on tag/release.

---

## 14. Handoff acknowledgment

This packet is the operator's primary primer for Sprint 7 in a fresh context window. The fresh-session agent should:

1. Read this file at the top of the session.
2. Read priority-listed files in §4 in order. Sprint 7 section of sprint.md is the load-bearing read.
3. Confirm cycle state via §12 verification commands.
4. Execute the 5 owner tasks per the §3 ordering (or §13 step-by-step).
5. Surface to operator at the §13 HITL pause-points OR if any §6 hard constraint is at risk OR if any §10 audit focus area would be violated.
6. **Stop after Sprint 7 implementation per §11 stop condition.** Do NOT auto-commit. Do NOT auto-tag. Do NOT auto-start any subsequent work.

The operator's stated goal: final validation + closeout of cycle-001. Final calibration run reproducible against Sprint 3 baseline hashes. BFZ refreshed with honest post-calibration provenance (no false improvement claims). Version bumped to v0.2.0. E2E goal validation completed against all PRD goals. Sprint 7 closes the security + calibration + manifest gates and prepares the construct for v0.2.0 tag (operator-gated, separate from commit).

**This is the final sprint of cycle-001.** Honest framing of cycle outcomes — including the "Run 2 = Run 1 numerically by design" architectural reality and the "no calibration improvement claimed" no-refit posture — is the binding closeout discipline.

---

*Sprint 7 handoff packet authored cycle-001 Sprint 6 close, after Sprint 6 implementation (security-review.md + PEX-1 + C-006 fixes + 16 tests), review ("All good (with noted concerns)" — 3 LOW informational), audit (APPROVED, 0 critical/high/medium, 3 LOW informational), and commit (`4afd9f2`). All Sprint 0/1/2/3/4/5/6 work pushed to origin/main. Sprint 7 unstarted.*
