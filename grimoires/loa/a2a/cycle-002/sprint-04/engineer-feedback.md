# Sprint 04 Senior Lead Review — T3 / T5 Posture (Option A)

**Verdict**: **APPROVED**.
**Reviewed**: 2026-05-02
**Routing**: cycle-002 SPRINT-LEDGER (operator ratification: Option A only).
**Reviewer report**: [grimoires/loa/a2a/cycle-002/sprint-03/reviewer.md](reviewer.md)

Sprint 04 may proceed to `/audit-sprint sprint-04`. No blocking issues. Three minor non-blocking observations recorded below for transparency; none require fix-loop iteration.

---

## Operator priority verification (seven-point checklist)

| # | Priority | Status | Independent evidence |
|---|----------|--------|----------------------|
| 1 | Sprint 04 stayed Option A only | ✓ PASS | `git status --short` returns ONLY `?? grimoires/loa/a2a/cycle-002/sprint-04/`. Per-priority-list sweep (src/, scripts/corona-backtest/scoring/, manifests, README, BUTTERFREEZONE, package.json, tests/) all empty. `ls scripts/corona-backtest/replay/t5-replay.js` → "No such file or directory" — no T5 replay module created. No Sprint 05 sensitivity-proof work. |
| 2 | T3 posture correct | ✓ PASS | [T3-T5-POSTURE.md §1](T3-T5-POSTURE.md) covers all 6 operator sub-points: line 17 (`[external-model]` tag), line 18 (WSA-Enlil canonical/external), line 19 (CORONA does not own CME-arrival prediction quality), line 20 (diagnostic only), line 21 (NOT in runtime-uplift composite), line 22 (NOT citable as CORONA-owned predictive uplift). §1.1 rationale grounds in PRD §8 + CHARTER §1 Q2 + CONTRACT §5; §1.2 cites the structural enforcement (`RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']`); §1.3 enumerates forbidden framings. |
| 3 | T5 posture correct | ✓ PASS | [T3-T5-POSTURE.md §2](T3-T5-POSTURE.md) covers all 6 operator sub-points: line 49 (`[quality-of-behavior]` tag), line 50 (settlement metrics enumerated: fp_rate, p50/p95 stale-feed, satellite-switch handling, hit-rate diagnostic), line 51 (no external probabilistic ground truth), line 52 (diagnostic only), line 53 (NOT in runtime-uplift composite), line 54 (NOT convertible to probabilistic Brier). §2.1 rationale + §2.2 reporting boundary + §2.3 forbidden framings. T5 trajectory emit explicitly DEFERRED at [§3 table line 81](T3-T5-POSTURE.md). |
| 4 | Sprint 06 citation block usable | ✓ PASS | [T3-T5-POSTURE.md §4](T3-T5-POSTURE.md) presents the four operator-supplied sentences as standalone blockquotes (lines 125, 127, 129, 131) — all four verbatim-confirmed by literal `grep -F` match. Trailing prose says "Sprint 06 may NOT weaken any of the four sentences above". §4.1 cross-references the cycle-001 honest-framing grep gate. The four sentences cover: (a) T3 [external-model] exclusion, (b) T5 [quality-of-behavior] exclusion, (c) T4 as the clean owned-uplift theatre, (d) T1/T2 prior-only disclosure. Clean copy-paste ready for Sprint 06. |
| 5 | Historical artifact protection | ✓ PASS | sha256(`scripts/corona-backtest.js`) = `17f6380b…1730f1` (matches anchor). sha256(`grimoires/loa/calibration/corona/calibration-manifest.json`) = `e53a40d1…5db34a` (matches anchor). cycle-002 manifest `replay_script_hash` = `bfbfd70d…e2e8fe` (matches anchor — Sprint 03 close value preserved; Sprint 04 did not regenerate the manifest). |
| 6 | Tests + dependencies | ✓ PASS | `npm test` returns 279 pass / 0 fail / 0 skip (Sprint 03 baseline preserved verbatim — Sprint 04 added zero tests, zero scope). `package.json` not in `git status` (no version bump, no dependency change, no `scripts.test` change). |
| 7 | Honest framing | ✓ PASS | Honest-framing grep returns 5 matches: lines 39, 70, 140 in T3-T5-POSTURE.md and lines 97, 179 in reviewer.md — all in (a) explicit "forbidden framing" enumeration ("T3 calibration improved — Q2 forbids…"), (b) the grep-gate citation itself, or (c) the engineer's own honest-framing self-assertion ("No 'calibration improved' claims appear … outside negation / forbidden-framing / honest-framing-grep-gate context"). Baseline-A-vs-B cross-regime sweep returns one match in reviewer.md:98 — explicitly the negation "No cross-regime Baseline A vs Baseline B comparison appears anywhere". No positive "T1/T2/T3/T4/T5 calibration improved" claim anywhere. |

---

## Adversarial Analysis

### Concerns Identified (≥3)

#### O1 — `Sprint 06 must NOT weaken citation block` is in §4 prose but not in the §5 hard-stop table [NON-BLOCKING; observation]

**Location**: [T3-T5-POSTURE.md §4 closing paragraph (line 133)](T3-T5-POSTURE.md) vs [§5 hard-stop table (lines 151-160)](T3-T5-POSTURE.md)

**Observation**: The doc says "Sprint 06 may NOT weaken any of the four sentences above" in the trailing prose of §4, but this constraint does NOT appear as a numbered hard-stop in the §5 table. The eight HS rows in §5 cover Option B work, scoring changes, scope changes, etc., but not the citation-block-weakening case. The constraint is operative either way (the prose is binding), but its hard-stop status is slightly diminished by not being in the structured table.

**Recommendation (advisory)**: A future revision could add an HS-9 row: "Sprint 06 weakens or paraphrases any of the four sentences in §4 — HALT and require operator re-ratification." Not required for this sprint; the §4 prose is sufficient.

**Severity rationale**: Cosmetic. The operative effect is the same. The hard-stop table style is a convention; the constraint binds via the §4 prose either way.

#### O2 — Citation-block blockquotes have no per-sentence anchor IDs [NON-BLOCKING; observation]

**Location**: [T3-T5-POSTURE.md §4 (lines 125, 127, 129, 131)](T3-T5-POSTURE.md)

**Observation**: The four sentences are rendered as standalone blockquotes with no markdown anchors. Sprint 06 closeout will likely want to cite these as "T3-T5-POSTURE.md §4 sentence 1" — the convention isn't established here, so Sprint 06 will need to either invent the convention or cite the whole §4. The blockquote ordering is also implicit (no numbering).

**Recommendation (advisory)**: A future revision could add `### 4.1 Sentence 1 — T3 exclusion`, `### 4.2 Sentence 2 — T5 exclusion`, etc., to give each blockquote its own anchor. Or add "(citation: T3-T5-POSTURE.md §4 #1)" suffix to each blockquote. Not required for this sprint; Sprint 06 can resolve by convention.

**Severity rationale**: Cosmetic. The four sentences are short and easy to identify by content; ordinal citation is unambiguous in practice.

#### O3 — Code-line citations carry line numbers that may drift [NON-BLOCKING; observation]

**Location**: [T3-T5-POSTURE.md §1.2 line 33](T3-T5-POSTURE.md) cites `scripts/corona-backtest/reporting/runtime-uplift-summary.js:26` for the `RUNTIME_UPLIFT_THEATRES` constant. [§1.1 line 28](T3-T5-POSTURE.md) cites `scripts/corona-backtest-cycle-002.js:208 + 286` for T3 dispatch.

**Observation**: Line numbers are correct as of Sprint 03 close. If a future contributor adds code above line 26 in `runtime-uplift-summary.js` or shifts the entrypoint dispatch lines, these references will drift. The symbol names are unique and recoverable, so the drift is recoverable but produces stale citations.

**Recommendation (advisory)**: A future revision could prefer symbol-based citations (`RUNTIME_UPLIFT_THEATRES export in runtime-uplift-summary.js`) over line-based citations. Not required for this sprint; the line-based citations are accurate and Sprint 03 closed at a stable commit.

**Severity rationale**: Documentation drift posture, not correctness. The symbol names + file paths suffice for any reader who needs to verify.

### Assumptions Challenged (≥1)

- **Assumption**: The doc assumes "Option B is closed for cycle-002 because no operator ratification line was issued at Sprint 04 entry" ([§3.1 line 98](T3-T5-POSTURE.md)).
- **Risk if wrong**: An operator could later (e.g., during Sprint 05 or Sprint 06) decide to authorize Option B via an addendum. The current doc has no machinery to record that addendum cleanly without amending §3 or §3.1.
- **Recommendation**: The assumption is correctly grounded in the cycle-002 sprint plan §4.2.2 #2 (Option B is ratification-gated; absent ratification, Option A binds). If a future operator amends, an addendum file at `sprint-04/T3-T5-POSTURE-AMENDMENT-1.md` (or similar) would be the clean response. **No change required to this sprint** — the assumption faithfully captures the current binding state and the ratification mechanism.

### Alternatives Not Considered (≥1)

- **Alternative**: Split the T3 and T5 postures into two separate documents (`T3-POSTURE.md` and `T5-POSTURE.md`) instead of one combined `T3-T5-POSTURE.md`.
- **Tradeoff**: Separate files would make per-theatre updates easier in future cycles AND make per-theatre reading ergonomic (a reader interested only in T3 wouldn't need to scroll past T5). Drawback: the Sprint 06 citation block (§4) needs both theatres adjacent because the four sentences span T3 + T5 + T4 + T1/T2 — splitting would either duplicate the citation block in both files or place it in a third file.
- **Verdict**: **Current single-document approach is justified**. The Sprint 06 citation block is the load-bearing artifact and benefits from being adjacent to both theatre sections. The Option A decision (§3) is also cross-theatre (it affects T5 directly and reinforces the T3 freeze). For a docs-only sprint of this size (~180 lines), single-file is the right granularity.

---

## Strengths worth preserving

| # | Strength | Why it matters |
|---|----------|----------------|
| 1 | Sprint 06 citation block uses standalone blockquotes with no prose interleaved | Sprint 06 can copy-paste each sentence individually without regex extraction. Verbatim discipline is preserved by construction. |
| 2 | All four operator-supplied sentences confirmed verbatim by literal `grep -F` match | No drift between operator instruction and rendered doc; auditor can re-verify with a 4-line grep script. |
| 3 | §3.2 enumerates "What Sprint 04 does NOT do" as 13 explicit bullet points | Future readers can audit the Option A perimeter without reading the whole doc. The negation list is more durable than positive scope statements for a docs-only sprint. |
| 4 | Cross-references in §6 cite the structural-enforcement modules (constants in `runtime-uplift-summary.js` / `diagnostic-summary.js`) | Doctrine ↔ code coherence is auditable in one read; the doc is not just prose-asserting the discipline. |
| 5 | "Forbidden framings" lists in §1.3 / §2.3 are anti-pattern catalogs | Future closeout authors can grep their drafts against these specific phrasings; defensive in depth. |
| 6 | §3.1 explicitly records "No operator ratification line authorizing Option B has been issued. Option A is binding." | Closes the Option B question definitively for cycle-002 in writing; an auditor can verify by checking for the absence of a ratification line. |

---

## Karpathy Principles Verification

| Principle | Status | Note |
|-----------|--------|------|
| Think Before Coding | ✓ | Reviewer.md AC verification walks all 23 ACs verbatim with file:line evidence. The Option A decision is grounded in the operator instruction and the sprint plan §4.2.2 #2 default. |
| Simplicity First | ✓ | Docs-only sprint by design. No code, no tests, no manifest writes. Two files totaling 375 lines. |
| Surgical Changes | ✓ | `git diff` is empty for tracked files; only the new sprint-04 dir appears. No drive-by reformats, no scope creep. |
| Goal-Driven | ✓ | The goal is "Sprint 06 citation block usable" — verified by literal `grep -F` match for all four operator sentences. The other AC verification is structural (file paths exist, posture tags correct). |

---

## Documentation Verification

CHANGELOG entry: not required for cycle-002 sprints per the cycle-002 CHARTER §2.3 (release hygiene gated on Sprint 06 + Rung 4). PASS by exception.

CLAUDE.md update: not required (no new global command/skill added; this is a posture document only).

Code comments: N/A (no code changed).

---

## Sprint progression decision

- **Verdict**: APPROVED.
- **May proceed to `/audit-sprint sprint-04`?** YES, immediately. The three observations (O1, O2, O3) are advisory documentation-style notes — none require an engineer fix-pass before audit.
- **Do NOT commit.** Per operator instruction.
- **Do NOT tag.** Per operator instruction.
- **Do NOT start Sprint 05.** Per operator instruction.

Cycle-001 + cycle-002 invariants intact. Verified independently:
- `sha256(scripts/corona-backtest.js)` = `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1`
- `sha256(grimoires/loa/calibration/corona/calibration-manifest.json)` = `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a`
- cycle-002 `replay_script_hash` = `bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60`
- `src/`, cycle-001 sprint folders, cycle-001 run outputs, manifests, scripts/corona-backtest/scoring/, package.json, tests/, README.md, BUTTERFREEZONE.md all unchanged in `git status`.
- `scripts/corona-backtest/replay/t5-replay.js` does not exist (Option A invariant).
- `npm test` returns 279/279 (Sprint 03 baseline preserved verbatim).

Sprint 04 implementation cleanly satisfies the operator's docs-only Option A scope. Proceed to audit.

---

*Review authored 2026-05-02 against operator-ratified Option A default. Independent verification of all engineer claims; no transitive trust. Cycle-001 byte-freeze + manifest immutability + cycle-002 replay_script_hash anchor preserved. Operator hard stops respected. Adversarial protocol applied: 3 advisory-only observations, 1 assumption challenged (correctly grounded), 1 alternative considered and explicitly justified against. No blocking issues found.*
