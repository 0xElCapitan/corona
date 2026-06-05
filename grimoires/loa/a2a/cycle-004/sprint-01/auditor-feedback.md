# CORONA Cycle-004 — Sprint 01 Security & Quality Audit

> **Auditor:** Paranoid Cypherpunk Auditor (`/audit-sprint sprint-01`) — final gate.
> **Sprint:** 01 — Baseline fixture + proof-harness skeleton.
> **Branch:** `cycle-004-s01-baseline-harness` @ `2720b530b73333515f56805df88320daaa70ea4d` (no commit, no push).
> **Method:** independent objective recompute — neither the implementation report nor the review verdict was taken on trust; all hashes/counts re-derived, all validation re-run, the CRLF risk empirically tested.
> **Date:** 2026-06-04.

---

## VERDICT: ✅ PASS — APPROVED (with one mandatory non-blocking carry-forward to Sprint 03)

Sprint 01's three deliverables are complete, correct, and within scope. Every Sprint-01 acceptance criterion (SPRINT-PLAN §4.7) is independently confirmed **Met**. No security issue, no frozen-invariant violation, no forbidden-path edit, no claim drift, no hard stop. **No fix is required before operator approval / commit.** The CRLF/`autocrlf` fixture-durability item is classified **non-blocking carry-forward (Class B)** with a binding Sprint-03 mitigation requirement (§7). `COMPLETED` marker created.

---

## 1. Files Inspected

| File | Inspection |
|------|-----------|
| `scripts/corona-backtest-cycle-004-evidence-wiring.js` | static audit (imports, dispatch arity, forbidden tokens, no-scoring, guard), secret/path scan |
| `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` | independent JSON re-parse, corpus cross-check, secret/path scan, CRLF blob round-trip |
| `grimoires/loa/a2a/cycle-004/sprint-01/implementation-report.md` | structure + required-elements verification |
| `grimoires/loa/a2a/cycle-004/sprint-01/review-feedback.md` | structure + required-elements verification |
| `scripts/corona-backtest/replay/{t1,t2}-replay.js`, `ingestors/corpus-loader.js` | unmodified-vs-HEAD; negative control intact |
| PRD.md, SDD.md, CYCLE-004-SPRINT-PLAN.md §4, SPRINT-LEDGER.md | binding scope / ACs |

**Reports (objective 1):** both contain all required elements — active branch, base branch/commit, exact files created/changed, exact baseline-capture command, validation commands+outputs, forbidden-path audit, frozen-invariant checks, claim-grep status, hard-stop status, no-commit/push. The implementation report carries a complete `## AC Verification` (§11) against SPRINT-PLAN §4.7. **Both reports: COMPLETE.**

---

## 2. Proof Harness — ACCEPTABLE

Independent static audit (objective recompute):

| Property | Finding |
|----------|---------|
| Imports | only `node:{process,fs,path}` + 5 intra-repo (`config`, `corpus-loader`, `context`, `t1-replay`, `t2-replay`). No `corona-backtest.js`, no `scoring/`, no `child_process`, no network. |
| No scoring / Brier / skill / baseline-delta / held-out | confirmed — these tokens appear only in comment/help-text **negations** |
| Emits per-event trajectory hashes only | confirmed — records `{theatre, event_id, trajectory_hash}`, 64-hex asserted (L189) |
| `wireEvidence` | **not introduced, not passed** — only in negation comments/help-text; dispatch is `replayFn(event, ctx)` (L187, 2 args) |
| Calls unmodified `replay_T1_event` / `replay_T2_event` | confirmed — `git diff HEAD` of both replay files empty; `t2-replay.js` `wireEvidence` count 0 |
| Imports/edits `scripts/corona-backtest.js` | NO (not imported; `isMain` keyed to the cycle-004 filename) |
| Touches `src/theatres/*` | NO (gates only *called* via replay) |
| `Date.now()` / `Math.random()` | NONE |
| Frozen-output-dir guard | covers cycle-001 **and** cycle-002 (`FROZEN_CYCLE001_OUTPUT_DIRS` ∪ `FROZEN_CYCLE002_OUTPUT_DIRS`, L81-85; enforced L290-297) |

**Security (cypherpunk lens):** no secrets, no credential/token literals, no `eval`, no shell-out, no network, no PII. `corpus_dir` metadata is **repo-relative** (no home-dir / absolute-path / `0x007` leak — scan returned NONE). `--out-file` is an operator-controlled local write (not a vuln); two defense-in-depth nits noted by the reviewer (guard case-sensitivity at L248; `--out-file` breadth) are non-blocking on a forward-looking flag not exercised in Sprint 01. **Harness: ACCEPTABLE.**

---

## 3. Baseline Fixture — ACCEPTABLE

Independent re-parse:

| Check | Result |
|-------|--------|
| Event count | 60 (`event_count` field == `events.length`) |
| T1 / T2 split | 30 / 30 |
| 64-hex trajectory hashes | all (`^[0-9a-f]{64}$`) |
| Duplicate event IDs | none (60 unique) |
| Scoring / Brier / uplift / improvement fields | NONE (per-event keys exactly `[theatre, event_id, trajectory_hash]`) |
| Deterministic sort / stable shape | sorted by (theatre, event_id); reproducible |
| Event-ID set vs cycle-003 **primary** T1/T2 corpus | **exact match** (0 missing, 0 extra) |
| Secret / absolute-path scan | NONE |

**Fixture: ACCEPTABLE** as the Sprint-03 `ablated == baseline` reference — subject to the §7 comparison-method requirement.

---

## 4. Re-Run Validation (objective recompute)

| Command | Expected | Observed |
|---------|----------|----------|
| `node …evidence-wiring.js --emit-hashes > /tmp/cycle004-baseline-audit-rerun.json` + `diff` vs fixture | no diff | **no diff (byte-identical)** ✓ |
| `git cat-file -p HEAD:scripts/corona-backtest.js \| sha256sum` | `17f6380b…1730f1` | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` ✓ |
| `node -e "…version, …dependencies"` | `0.2.0 {}` | `0.2.0 {}` ✓ |
| `npm test` | green | **tests 296 · pass 296 · fail 0** ✓ |

### Treatment of the known `npm test` side-effect
`npm test` re-dirtied the three cycle-002 frozen artifacts (`cycle-002/runtime-replay-manifest.json`, `cycle-002-run-2/sensitivity-summary.md`, `cycle-002-run-3/sensitivity-summary.md`). I independently confirmed the diff is **exclusively** the `code_revision` provenance field (`d93cada9…` → `2720b530…`); every hash/content field is unchanged. **Restored with `git restore`** (exit 0); post-restore `git diff --name-only` is empty. This is a pre-existing test-harness behavior, not a Sprint-01 code defect, and perturbs no cycle-002 hash. **Auditor note:** any future `npm test` (e.g., at commit verification) will repeat this churn — `git restore` those three paths before committing.

---

## 5. Forbidden-Path Audit — PASS

`git diff HEAD` over the **entire** forbidden set is **empty** — none modified:
`corpus-loader.js` (incl. `deriveEvidenceT1`/`deriveEvidenceT2`, still `pre_cutoff: []`) · `t1-replay.js` · `t2-replay.js` · `src/theatres/*` · `src/rlmf/certificates.js` · `scripts/corona-backtest.js` (not edited / not imported) · `scripts/corona-backtest-cycle-002.js` · `package.json` · `README.md` · `BUTTERFREEZONE.md` · root `grimoires/loa/{prd,sdd,sprint}.md` + `ledger.json` · cycle-001/002/003 corpus + manifests · cycle-003 held-out seal (corpus-cycle-003 tree clean) · `.beads/`. No parameter/threshold/`base_rate`/σ/λ/formula change. T1 negative control intact.

---

## 6. Frozen-Invariant Verification + Claim-Grep — PASS

- **Invariants:** I1 `corona-backtest.js` sha256 `17f6380b…1730f1` ✓ · `package.json` `0.2.0`/`{}` ✓ · cycle-003 corpus_hash `7b6c5b48…d5003` (corpus untouched) ✓ · I6 no walltime/random ✓ · I5 existing suite determinism green (296/296) ✓.
- **Claim-grep:** swept `grimoires/loa/a2a/cycle-004/` + harness + both reports. Every forbidden-pattern occurrence is a **negation, forbidden-list definition/enumeration, or hard-stop / historical-ceiling rule** (PRD §4.3 prohibitions, PRD HS-9 rule, SPRINT-PLAN §9, report §10 enumeration; verbatim "No calibration … claim is made" / "banks no new rung" / "CORONA demonstrated T4 runtime sensitivity only"). The harness "calibration" hits are the `CALIBRATION_DIR` path constant. **No forbidden phrase appears as a positive claim.** Posture CLEAN.

---

## 7. CRLF / `autocrlf` Fixture-Durability — CLASSIFICATION & MITIGATION

**Classification: B — NON-BLOCKING CARRY-FORWARD (NOT a Sprint-01 commit blocker).**

**Empirical basis (objective recompute, no mutation):**
- Repo config: `core.autocrlf=true`, **no `.gitattributes`** eol rule.
- Demonstrated repo behavior: committed JSON blobs are **LF**, checked out as **CRLF** (cycle-002 manifest worktree 216 CR / blob 0 CR; cycle-003 corpus record worktree 1098 CR / blob 0 CR).
- `baseline-hashes.json` is currently **pure LF** (0 CR), and the harness emits **pure LF** to both stdout and `--out-file`.
- **Commit round-trip proof:** `git hash-object` *with* filters == *without* filters == `4e00ed63…` → the autocrlf clean filter is a **no-op** on this file; the committed blob equals the current LF content and reproduces sha256 `538cba01…` via `git cat-file -p HEAD:<path>`.

**Why non-blocking:** (a) all SPRINT-PLAN §4.7 ACs are met in-environment **now** (including run-twice byte-identical, LF-vs-LF); the CRLF item violates **no** Sprint-01 AC. (b) The fixture's canonical committed content is **durable LF** and correct — the risk lives entirely in a *future* comparison method, not in the deliverable. (c) The only fix that touches Sprint 01's artifacts would be `.gitattributes`, which is **outside** Sprint 01's authorized write surface; per operator instruction it is **not** edited here.

**Answers to the audit's explicit CRLF questions:**
1. **Is it a Sprint-01 commit blocker?** **No.**
2. **Required Sprint-03 carry-forward mitigation (BINDING):** Sprint 03's `ablated == baseline` gate (T3.4) — and any `wired-vs-ablated` / `replay-twice` comparison that consumes committed proof JSON — **MUST NOT** rely on a raw working-tree `diff` of the committed fixture against a fresh harness run (the committed LF blob is smudged to CRLF on checkout while the harness emits LF). Sprint 03 MUST use at least one of:
   - **(preferred)** parse both JSON files and compare **canonical parsed objects / canonical re-serialization** (line endings are inter-token whitespace, ignored by `JSON.parse`); or
   - compare against the **committed git blob** via `git cat-file -p HEAD:<path>` (returns LF) vs the fresh LF run; or
   - **normalize line endings** during comparison (`diff --strip-trailing-cr`, or strip CR before hashing).
   The SPRINT-PLAN §6.5 literal `diff ablated-hashes.json baseline-hashes.json` is the fragile pattern and MUST be replaced/augmented accordingly.
3. **Should Sprint 03 avoid raw working-tree `diff` in favor of canonical-JSON or git-blob comparison?** **Yes — binding requirement (above).**
4. **Is any `.gitattributes` change required now?** **No.** It remains **out of scope** for Sprint 01 unless separately authorized. (A future authorized sprint MAY pin `grimoires/loa/a2a/cycle-004/proof/*.json eol=lf` / `-text` to make even a raw `diff` safe; optional, not required, because a robust Sprint-03 comparison fully resolves the risk on the durable LF blob.)

**Documentation-precision note (non-blocking):** future references to the fixture identity `538cba01…` should specify it is the **LF / committed-blob** hash (verify via `git cat-file -p HEAD:<path> | sha256sum`), not the post-checkout working-tree file (which is CRLF, with a different `sha256sum`). This mirrors the cycle-003 precedent.

**Encoded (post-audit, operator-directed 2026-06-04):** at operator instruction, this §7 carry-forward is now written into the binding spec — `CYCLE-004-SPRINT-PLAN.md` **§6.10 (Amendment 1)**, with cross-references in **T3.4**, **§6.5** (the literal `diff` replaced by a `git cat-file` LF-blob comparison), and **§6.6** acceptance criteria. It is therefore no longer a memory/feedback-only carry-forward; `/implement sprint-03` will read it from the sprint plan. This audit verdict (APPROVED) is unchanged — the encoding is a planning amendment to Sprint 03's spec, not a change to Sprint 01's audited deliverables.

---

## 8. Hard-Stop / Fix Status

- **Hard stop:** none (HS-1 baseline non-determinism — clear; HS-8 frozen-artifact touch — harness wrote none; the `npm test` `code_revision` touch was reverted; HS-10 scoring — none).
- **Fix required before operator approval / commit:** **none.** The CRLF item is a binding requirement on **Sprint 03**, not an unresolved Sprint-01 defect; it cannot be fixed within Sprint 01's authorized surface and violates no Sprint-01 AC.

---

## 9. Final `git status --short`

```
?? grimoires/loa/a2a/cycle-004/proof/
?? grimoires/loa/a2a/cycle-004/sprint-01/
?? scripts/corona-backtest-cycle-004-evidence-wiring.js
```
(`git diff --name-only` empty; the `npm test` cycle-002 churn was restored.)

---

## 10. Disposition

**APPROVED.** `COMPLETED` marker written to `grimoires/loa/a2a/cycle-004/sprint-01/COMPLETED`. Sprint 01 banks **no rung**; cycle-002's T4-only runtime-sensitivity ceiling and v0.2.0 stand unweakened. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. **Operator action:** Sprint 01 is audit-clean; commit only on explicit operator approval (and `git restore` the three cycle-002 files after any pre-commit `npm test`). Carry the §7 CRLF mitigation into Sprint 03 as a binding implementation requirement. No commit, no push performed by this audit.
