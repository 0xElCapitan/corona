# CORONA Cycle-004 — Sprint 01 Review Feedback

> **Reviewer:** senior tech lead (`/review-sprint sprint-01`)
> **Sprint:** 01 — Baseline fixture + proof-harness skeleton
> **Branch:** `cycle-004-s01-baseline-harness` @ `2720b530b73333515f56805df88320daaa70ea4d`
> **Spec set:** PRD.md · SDD.md · CYCLE-004-SPRINT-PLAN.md §4 · SPRINT-LEDGER.md · sprint-01/implementation-report.md
> **Method:** independent re-verification — code re-read fresh, all validation re-run; the engineer's report was **not** taken on trust.

---

## VERDICT: ✅ PASS (approved for audit) — with non-blocking concerns

All three Sprint-01 tasks (T1.1 harness skeleton, T1.2 baseline capture, T1.3 report) are complete and correct. Every Sprint-01 acceptance criterion (SPRINT-PLAN §4.7) is **Met**. No hard stop occurred. No frozen invariant is violated. No forbidden positive claim exists. **No fix is required before audit.** Four non-blocking, forward-looking concerns are documented below (the CRLF/`autocrlf` durability of the committed fixture is the most material — it should be resolved before commit and before Sprint 03 relies on a byte-`diff`).

---

## 1. Files Inspected

| File | How inspected |
|------|---------------|
| `scripts/corona-backtest-cycle-004-evidence-wiring.js` | full fresh read (327 lines) + behavioral tests |
| `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` | independent JSON parse + byte-level checks + corpus cross-check |
| `grimoires/loa/a2a/cycle-004/sprint-01/implementation-report.md` | full read; section-structure + claim verification |
| `scripts/corona-backtest/replay/{t1,t2}-replay.js`, `ingestors/corpus-loader.js` | confirmed unmodified vs HEAD; negative-control intact |
| `CYCLE-004-SPRINT-PLAN.md` §4, `SPRINT-LEDGER.md`, `PRD.md`, `SDD.md` | re-read for binding scope/ACs |

---

## 2. Branch / Base / Hygiene — PASS

| Check | Result |
|-------|--------|
| Active branch | `cycle-004-s01-baseline-harness` ✓ |
| HEAD | `2720b530…` ✓ |
| Descends from `cycle-004 @ 2720b53` | `git merge-base --is-ancestor` → yes ✓ |
| Commits since `cycle-004` | **none** (`git log cycle-004..HEAD` empty) ✓ |
| `main` ref | `ccd6eea` untouched ✓ |
| `cycle-004` ref | `2720b53` untouched ✓ |
| Working tree | only the 3 authorized paths ✓ |
| `.claude/` System Zone (integrity `strict`) | no changes → no drift ✓ |

The reported pre-flight branch-from-`cycle-004` deviation is correct and operator-accepted; verified `2720b53` carries the committed planning docs.

---

## 3. Proof Harness — ACCEPTABLE (PASS)

Re-read line-by-line. Confirmed against every objective:

| Requirement | Verified |
|-------------|----------|
| No-scoring skeleton | ✓ imports only `config/corpus-loader/context/t1-replay/t2-replay` + `node:` builtins; no scoring module |
| Emits per-event trajectory hashes only | ✓ records = `{theatre, event_id, trajectory_hash}`; 64-hex asserted (L189) |
| No Brier / skill / uplift / baseline-delta / held-out | ✓ none present (only as negation comments) |
| Does not wire T2 | ✓ `replay_T2_event(event, ctx)` (L187), no options bag |
| No `wireEvidence` introduced | ✓ token appears only in negation comments; `grep -c wireEvidence t2-replay.js` = 0 |
| Calls unmodified `replay_T1_event`/`replay_T2_event` | ✓ `git diff HEAD` of both replay files empty |
| Does not edit/import `scripts/corona-backtest.js` | ✓ not imported (L56-64); `isMain` keyed to the cycle-004 filename (L308) |
| Frozen-output-dir guards for cycle-001 **and** cycle-002 | ✓ `FROZEN_CYCLE001_OUTPUT_DIRS` ∪ `FROZEN_CYCLE002_OUTPUT_DIRS` (L81-85); guard wired (L290-297) — behaviorally tested: `--out-file …/run-1/x.json` and `…/cycle-002-run-1/x.json` → exit 4, no write |
| No `Date.now()` / `Math.random()` | ✓ grep-clean |
| No `src/theatres/*` edit | ✓ `git diff HEAD -- src/theatres/` empty; gates only *called* via replay |
| No package/deps change | ✓ `git diff HEAD -- package.json` empty; zero new imports |

Code quality: clear, minimal, well-documented; arg-parsing rejects unknown flags (exit 2) and unsupported theatres; pure `dispatchBaselineHashes`/`buildBaselineHashTable` exports plus `_`-prefixed test exports mirror the cycle-002 precedent. Karpathy: think-before (assumptions documented), simplicity (minimal), surgical (only new files), goal-driven (deterministic, asserted).

---

## 4. Baseline Fixture — ACCEPTABLE (PASS)

Independent parse + cross-check:

| Check | Result |
|-------|--------|
| `event_count` field vs `events.length` | 60 = 60 ✓ |
| T1 / T2 split | 30 / 30 ✓ |
| All hashes 64-hex `^[0-9a-f]{64}$` | ✓ |
| Unique hashes / unique (theatre,event_id) | 60 / 60 (no dups, no collisions) ✓ |
| Sorted by (theatre, event_id) | ✓ |
| Per-event keys | exactly `[theatre, event_id, trajectory_hash]` — no scoring keys ✓ |
| Forbidden scoring/improvement/uplift keys | **NONE** ✓ |
| Event-ID set vs cycle-003 T1/T2 **primary** corpus | **exact match** (0 missing, 0 extra; spot-checked record `event_id`==filename) ✓ |
| `state` / `wire_evidence` metadata | `baseline` / `false` ✓ |

**Suitable as the Sprint-03 `ablated == baseline` reference** — subject to the CRLF concern (§9 Adversarial, Concern 1) being resolved before/at commit.

---

## 5. Re-Run Validation — PASS

| Command | Expected | Observed |
|---------|----------|----------|
| `node …evidence-wiring.js --emit-hashes > /tmp/…-review-rerun.json` then `diff` vs committed fixture | no diff | **no diff (byte-identical)** ✓ |
| `git cat-file -p HEAD:scripts/corona-backtest.js \| sha256sum` | `17f6380b…1730f1` | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` ✓ |
| `node -e "…version, …dependencies"` | `0.2.0 {}` | `0.2.0 {}` ✓ |
| `npm test` | green | **tests 296 · pass 296 · fail 0** ✓ |

### `npm test` cycle-002 side-effect — OBSERVED & RESTORED
As disclosed in the implementation report, `npm test` mutated three tracked cycle-002 frozen artifacts:
- `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`
- `grimoires/loa/calibration/corona/cycle-002-run-2/sensitivity-summary.md`
- `grimoires/loa/calibration/corona/cycle-002-run-3/sensitivity-summary.md`

I confirmed the diff is **exclusively** the `code_revision` provenance field (`d93cada9…` → `2720b530…`); every hash/content field is unchanged. Restored with `git restore <paths>` (exit 0). Post-restore `git diff --name-only` is empty. This is a pre-existing test-harness behavior, **not** introduced by the Sprint-01 code, and does not perturb any cycle-002 hash. **Recommendation for the auditor:** expect the same churn on `npm test`; `git restore` those three paths afterward.

---

## 6. Forbidden-Path Audit — PASS

`git diff HEAD` over the **entire** forbidden set returned empty — none modified:
`corpus-loader.js` (incl. `deriveEvidenceT1`/`deriveEvidenceT2`, still `pre_cutoff: []`) · `t1-replay.js` · `t2-replay.js` (`wireEvidence` count 0) · `src/theatres/*` · `src/rlmf/certificates.js` · `scripts/corona-backtest.js` (not edited, not imported) · `scripts/corona-backtest-cycle-002.js` · `package.json` · `README.md` · `BUTTERFREEZONE.md` · root `grimoires/loa/{prd,sdd,sprint}.md` / `ledger.json` · cycle-001/002/003 corpus + manifests · cycle-003 held-out seal · `.beads/` (clean). No parameter/threshold/`base_rate`/σ/λ/formula change. T1 negative control intact.

---

## 7. Frozen-Invariant Verification — PASS

I1 `corona-backtest.js` sha256 `17f6380b…1730f1` ✓ · `package.json` `0.2.0`/`{}` ✓ · cycle-003 corpus_hash `7b6c5b48…d5003` (corpus files unmodified) ✓ · I6 no walltime/random in new path ✓ · I5 existing suite replay-twice determinism green ✓.

---

## 8. Claim-Grep Posture — PASS (clean)

Swept the full `grimoires/loa/a2a/cycle-004/` namespace + the harness for the 10 forbidden positive-claim patterns. Every occurrence is a **negation, forbidden-list definition, or historical-ceiling statement** (PRD §4.3 prohibition list, SPRINT-PLAN §9 + report §10 enumerations, and the verbatim "No calibration … claim is made" / "banks no new rung" / "CORONA demonstrated T4 runtime sensitivity only" lines). Harness hits on the substring "calibration" are the `CALIBRATION_DIR` path constant, not a claim. **No forbidden phrase appears as a positive claim.**

---

## 9. Adversarial Analysis

### Concerns Identified
1. **[Most material — non-blocking] CRLF / `autocrlf` durability of the committed fixture → Sprint-03 `diff` risk.** This repo has `core.autocrlf=true` and **no `.gitattributes`** eol rule. Empirically, every already-committed JSON here is stored **LF** but checked out **CRLF** in the working tree (verified: cycle-002 manifest worktree 216 CR / blob 0 CR; cycle-003 corpus record worktree 1098 CR / blob 0 CR). `baseline-hashes.json` is currently LF (uncommitted), and the harness emits **pure LF**. After this fixture is committed and re-checked-out it will become **CRLF** in the working tree, while a fresh harness run is **LF** — so a naive `diff baseline-hashes.json <(harness run)` in Sprint 03 (the `ablated == baseline` gate, AC4 / S03 T3.4) would **spuriously fail on line endings only**. This is the cycle-003 "CRLF→committed-blob" gotcha. *Severity: non-blocking for Sprint 01 (the §4.7 "run-twice byte-identical" AC holds in-environment; nothing is committed yet), but it must be handled before commit / Sprint 03.* **Recommendation:** add a `.gitattributes` pin (e.g., `grimoires/loa/a2a/cycle-004/proof/*.json eol=lf` or `-text`) so the fixture stays LF on checkout and matches fresh harness output, **and/or** have Sprint 03 compare via the committed blob (`git cat-file`) or `diff --strip-trailing-cr` (the cycle-003 precedent). The fix touches `.gitattributes`, which is **outside** Sprint 01's authorized write surface — so it is correctly **not** done here; it is an operator/S02-S03 action item.
2. **[Non-blocking] Windows case-sensitivity gap in the `frozenOutputDirFor` guard** (`evidence-wiring.js:248`). The guard compares resolved paths with a case-sensitive `startsWith`; on a case-insensitive FS, `--out-file …/RUN-1/x.json` would not match `run-1` and could bypass the guard. Mitigated by: the flag is forward-looking (Sprint 01 uses stdout), frozen dir names are canonically lowercase, and this is defense-in-depth. *Recommendation: case-fold the comparison when Sprint 03 fills the harness.*
3. **[Non-blocking] `--out-file` write breadth** (`evidence-wiring.js:289-301`). The guard refuses only frozen cycle-001/002 run dirs; `--out-file` could otherwise write JSON to any path (including outside the cycle-004 surface). This mirrors the cycle-002 entrypoint precedent and is not invoked in Sprint 01. *Recommendation: in Sprint 03, constrain `--out-file` to the `proof/` tree.*
4. **[Non-blocking] Fixture does not pin the cycle-003 `corpus_hash`** (`evidence-wiring.js:220-236`). Metadata records `corpus_dir` (a path) but not the corpus content hash `7b6c5b48…`. Reproducibility via byte-`diff` still holds; pinning `corpus_hash` would bind the fixture to the exact corpus and harden Sprint 03's provenance. *Recommendation: add `corpus_hash` to the metadata when Sprint 02/03 touches the harness.*

### Assumptions Challenged
- **Assumption:** the report (§4) presents file sha256 `538cba01…` as a "machine-independent stable fixture identity."
  **Risk if wrong:** the **content** (trajectory hashes, sorted JSON) is deterministic and machine-independent — and that is what the Sprint-03 gate truly relies on — but the **file-level** sha256 is line-ending-representation-specific: `538cba01…` is the LF hash; a CRLF working-tree checkout (per Concern 1) yields a different file hash, and only the **committed blob** (`git cat-file`, LF) reproduces `538cba01…`.
  **Recommendation:** in the report/PROOF-SUMMARY, qualify `538cba01…` as the LF/committed-blob identity (verify via `git cat-file -p HEAD:… | sha256sum`), not the post-checkout working-tree file. *Non-blocking; documentation precision.*

### Alternatives Not Considered
- **Alternative:** emit a keyed map `{ T1: { event_id: hash }, T2: {…} }` (the cycle-002 `trajectoryHashes` shape) instead of a sorted `events[]` array.
  **Tradeoff:** a keyed map gives O(1) per-event lookup, which eases Sprint 03's per-event wired-vs-ablated / ablated-vs-baseline localization; the sorted array is simpler and arguably more robust for a whole-file byte-`diff`.
  **Verdict:** the sorted-array choice is **justified** for Sprint 01 (explicit deterministic ordering; byte-diff is the gate) — note it for Sprint 03 consumption ergonomics; not a defect.

---

## 10. Report Review — COMPLETE

`implementation-report.md` includes all required elements: active branch; base branch/commit; exact files created/changed; exact baseline-capture command; reproducibility result (byte-identical); validation results; forbidden-path audit; frozen-invariant checks; claim-grep; hard-stop status; `git status --short`; `## AC Verification` (§11, walks all 8 SPRINT-PLAN §4.7 ACs verbatim with evidence); explicit no-implementation-beyond-Sprint-01-scope (§0, §6); no-commit/no-push (§13). The report also honestly discloses the `npm test` cycle-002 side-effect + restore (§3). One documentation-precision nit (the `538cba01…` identity wording — §9 Assumption above); non-blocking.

---

## 11. Hard-Stop / Fix Status

- **Hard stop:** none (HS-1 baseline-non-determinism — clear; HS-8 frozen-artifact touch — the harness wrote none; the `npm test` provenance touch was reverted; HS-10 scoring — none).
- **Fix required before audit:** **none.** The four concerns are non-blocking and forward-looking; Concern 1 (CRLF) is an operator/S02-S03 action item that cannot be fixed within Sprint 01's authorized write surface and does not violate any Sprint-01 AC.

---

## 12. Final `git status --short`

```
?? grimoires/loa/a2a/cycle-004/proof/
?? grimoires/loa/a2a/cycle-004/sprint-01/
?? scripts/corona-backtest-cycle-004-evidence-wiring.js
```
(`git diff --name-only` empty; the `npm test` cycle-002 churn was restored.)

---

## 13. Disposition

**PASS — proceed to `/audit-sprint sprint-01`.** No changes required. Carry the four non-blocking concerns (esp. the CRLF/`autocrlf` fixture-durability item) into the audit and into Sprint 02/03 planning. No commit, no push performed by this review.
