# Sprint 6 Implementation Report — CORONA cycle-001-corona-v3-calibration

**Sprint**: 6 — Lightweight Input-Validation Review
**Beads Epic**: `corona-16a` (closed)
**Tasks**: `corona-r4y`, `corona-8m8`, `corona-a6z` (all closed)
**Date**: 2026-05-01
**Author**: implementing agent
**HEAD at start**: `9558269` (sprint 6 handoff packet at top)
**HEAD at finish (pre-commit)**: still `9558269` — operator commits Sprint 6
**HITL**: ON. Stops after this report; awaiting `/review-sprint sprint-6` then `/audit-sprint sprint-6` then operator commit.

---

## Executive Summary

Sprint 6 walked the three input parsers (`src/oracles/swpc.js`, `src/oracles/donki.js`, `scripts/corona-backtest/ingestors/corpus-loader.js`) through the SDD §8.2 13-row input-validation checklist, classified 25 findings per the SDD §8.4 severity ladder, authored `grimoires/loa/calibration/corona/security-review.md` per the SDD §8.3 template, and applied two narrow defensive patches per the handoff §6.4 + §6.5 recommended postures (option A in both cases):

1. **PEX-1** (Sprint 2 carry-forward) — optional chaining at `src/theatres/proton-cascade.js:266, 284`. 4-character patch.
2. **C-006 / LOW-1** (Sprint 3 carry-forward) — `validateT5()` negative-latency rejection in `stale_feed_events` at `scripts/corona-backtest/ingestors/corpus-loader.js`. 24-line patch (one new validation block).

**Findings tally**: 0 critical / 0 high / 9 medium / 16 low across 25 findings. Per SDD §8.4 only `critical` blocks Sprint 7 — Sprint 7 is unblocked from a security perspective.

**Tests**: 16 new tests across two new files in `tests/security/`. All 160 tests (144 baseline + 16 new) pass. No baseline test was modified.

**Hard-constraint preservation**: scoring modules (`scripts/corona-backtest/scoring/`), calibration manifest, calibration protocol, theatre-authority map, empirical evidence, frozen corpus, run-1, run-2, package.json, construct.yaml, .claude/ — all untouched. Verified by `git diff --stat` returning empty for each.

**Backtest reproducibility**: re-running `node scripts/corona-backtest.js` produced output with identical `corpus_hash` (`b1caef3...`) and `script_hash` (`17f6380b...`) to Sprint 3 baseline. Per-theatre numerics identical (T1 Brier 0.1389, T2 Brier 0.1389, T3 MAE 6.76h, T4 Brier 0.1600, T5 FP 25.0%/p50 90.0s/sw 100%). The regenerated run-1 reports were reverted (only timestamp + git SHA differed from frozen state).

---

## AC Verification

Per Sprint 6 acceptance criteria at `grimoires/loa/sprint.md:438-447` (Sprint 6 deliverables + AC + technical tasks):

### Deliverable D6.1 — security-review.md authored per SDD §8.3 template

> **Verbatim from sprint.md:438**: `[ ] grimoires/loa/calibration/corona/security-review.md authored per SDD §8.3 template`

**Status**: ✓ Met
**Evidence**: [grimoires/loa/calibration/corona/security-review.md](../../calibration/corona/security-review.md) — 25 findings across three per-parser tables (S-NNN, D-NNN, C-NNN) + carry-forward section (PEX-1, LOW-1) + Critical-findings § + Closed-in-Sprint-6 § + SDD §8.2 checklist coverage table + Sprint 7 entry posture §. Conforms to SDD §8.3 template structure verbatim.

### Deliverable D6.2 — All findings classified by severity per SDD §8.4

> **Verbatim from sprint.md:439**: `[ ] All findings classified by severity (critical / high / medium / low per SDD §8.4)`

**Status**: ✓ Met
**Evidence**: every finding in [security-review.md:36-127](../../calibration/corona/security-review.md) carries an explicit Severity column entry from the SDD §8.4 ladder. Summary table at [security-review.md:13-19](../../calibration/corona/security-review.md) tallies 0 critical / 0 high / 9 medium / 16 low. No finding is unclassified.

### Deliverable D6.3 — CRITICAL findings fixed inline (block Sprint 7)

> **Verbatim from sprint.md:440**: `[ ] CRITICAL findings fixed inline in Sprint 6 (block Sprint 7)`

**Status**: ✓ Met (vacuously — 0 critical findings)
**Evidence**: [security-review.md:130-132](../../calibration/corona/security-review.md) `## Critical findings (block Sprint 7?)` § states explicitly "**None.** Zero critical findings identified across the three parsers + two carry-forward sites. Per SDD §8.4 and sprint.md GC.7-GC.8, Sprint 7 is unblocked from a security perspective." Sprint 7 gate is satisfied.

### Deliverable D6.4 — Non-critical findings documented + deferred or fixed at discretion

> **Verbatim from sprint.md:441**: `[ ] Non-critical findings documented + deferred or fixed at discretion`

**Status**: ✓ Met
**Evidence**:
- Two carry-forward findings (PEX-1, C-006 / LOW-1) closed in Sprint 6 per handoff §6.4 + §6.5 recommended postures. See [security-review.md:138-167](../../calibration/corona/security-review.md) "Closed in Sprint 6" §.
- 23 non-critical findings catalogued by disposition at [security-review.md:171-187](../../calibration/corona/security-review.md): 16 `deferred` (Sprint 7+ or future cycle), 7 `accepted residual` (no fix planned, defensible per PRD §9.2 / `calibration-protocol.md` §3.5).
- Every finding row in the per-parser tables ([security-review.md:36-127](../../calibration/corona/security-review.md)) has an explicit `Status` column entry (`fixed in Sprint 6` / `deferred` / `accepted residual` / `partial`).

### AC.6.1 — Review committed

> **Verbatim from sprint.md:444**: `[ ] Review committed`

**Status**: ⏸ Pending operator commit (per Sprint 6 stop condition; HITL ON)
**Evidence**: All Sprint 6 deliverables staged in working tree: [grimoires/loa/calibration/corona/security-review.md](../../calibration/corona/security-review.md) (untracked), patches at [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) and [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) (modified), tests at [tests/security/proton-cascade-pex1-test.js](../../../../tests/security/proton-cascade-pex1-test.js) and [tests/security/corpus-loader-low1-test.js](../../../../tests/security/corpus-loader-low1-test.js) (untracked), checkmarks updated at [grimoires/loa/sprint.md:432-447](../../sprint.md). Per Sprint 6 handoff §17 stop condition, the agent does not auto-commit; operator approves via `/review-sprint sprint-6` → `/audit-sprint sprint-6` → commit.

### AC.6.2 — No critical input-injection / infinite-loop / data-loss vectors blocking Sprint 7

> **Verbatim from sprint.md:445**: `[ ] No critical input-injection / infinite-loop / data-loss vectors blocking Sprint 7`

**Status**: ✓ Met
**Evidence**: Per SDD §8.4 ladder definition, `critical` covers exactly input-injection / infinite-loop / data-loss. The §8.2 walk surfaced zero findings in this class. Specifically:
- **Input-injection**: SWPC + DONKI parsers consume read-only HTTPS responses; corpus-loader consumes operator-HITL-gated files. No SQL, no shell exec, no eval, no template-string rendering with user input. JSON.parse is the only parser; its boundary is well-tested in stdlib. → no input-injection vector.
- **Infinite-loop / unbounded recursion**: SWPC + DONKI use bounded `forEach`/`for-of` over fetched arrays. Corpus-loader uses bounded `readdirSync` + per-file forEach. The T4 regex `/(?:^|\D)10\s*MeV\b/i` ([corpus-loader.js:217](../../../../scripts/corona-backtest/ingestors/corpus-loader.js#L217)) is single-pass anchored with no nested quantifiers — verified ReDoS-safe by inspection. No recursion in any parser. → no infinite-loop vector.
- **Data-loss**: per-feed try/catch in SWPC ([swpc.js:314, 335, 358, 386](../../../../src/oracles/swpc.js#L314)) and DONKI ([donki.js:271, 314, 352](../../../../src/oracles/donki.js#L271)) isolates a failed feed to a single `errors[]` entry without dropping previously-processed bundles. Corpus-loader rejects malformed events explicitly without silently substituting defaults. → no data-loss vector.

### AC.6.3 — Review is NOT a deep crypto/auth audit

> **Verbatim from sprint.md:446**: `[ ] Review is NOT a deep crypto/auth audit (per PRD §5.7, §9.2 — surface area is read-only HTTP + zero auth + zero deps)`

**Status**: ✓ Met
**Evidence**: [security-review.md:5](../../calibration/corona/security-review.md) Scope line states verbatim "Out of scope: crypto, auth, secret management, deep code audit (per PRD §5.7 + §9.2 + SDD §8.1)." The 25 findings are confined to input-validation + parser robustness + path-traversal + memory-bomb resistance per SDD §8.2. Zero findings involve cryptographic primitives, authentication flows, or secret hygiene.

### Task GC.6.1 (`corona-r4y`) — Walk three parsers through SDD §8.2 checklist

> **Verbatim from sprint.md:445**: `[ ] Task 6.1 (corona-r4y): sprint-6-walk-input-checklist — Walk three parsers through SDD §8.2 checklist.`

**Status**: ✓ Met
**Evidence**: [security-review.md:189-204](../../calibration/corona/security-review.md) "SDD §8.2 checklist coverage" table maps each of the 13 checklist rows to per-parser findings or `clean`/`N/A` rationale. Beads `corona-r4y` closed at 2026-05-01T19:36:14Z with reason "Walk complete: SWPC + DONKI + corpus-loader checked against SDD §8.2 13-row checklist."

### Task GC.6.2 (`corona-8m8`) — Author security-review.md per SDD §8.3

> **Verbatim from sprint.md:446**: `[ ] Task 6.2 (corona-8m8): sprint-6-author-security-review-md — Author security-review.md per SDD §8.3.`

**Status**: ✓ Met
**Evidence**: [grimoires/loa/calibration/corona/security-review.md](../../calibration/corona/security-review.md) authored per template at [grimoires/loa/sdd.md:824-852](../../sdd.md). Beads `corona-8m8` closed at 2026-05-01T19:39:48Z.

### Task GC.6.3 (`corona-a6z`) — Fix only CRITICAL findings inline

> **Verbatim from sprint.md:447**: `[ ] Task 6.3 (corona-a6z): sprint-6-fix-critical-findings — Fix only CRITICAL findings inline.`

**Status**: ✓ Met
**Evidence**: 0 critical findings → no critical fixes required. Two carry-forward fixes (PEX-1 + C-006/LOW-1) applied per handoff §6.4 + §6.5 option (A) recommended postures — these are below-critical defensive hardening, not critical fixes. Beads `corona-a6z` closed at 2026-05-01T19:43:49Z.

---

## Tasks Completed

### Task 6.1 (`corona-r4y`) — SDD §8.2 walk

**Approach**: read each of the three parsers in full (`src/oracles/swpc.js` 451 lines, `src/oracles/donki.js` 381 lines, `scripts/corona-backtest/ingestors/corpus-loader.js` 423 lines), walked each cell of the SDD §8.2 13-row × 3-parser matrix, and classified each finding per the SDD §8.4 severity ladder. Cross-referenced existing carry-forward documentation: Sprint 2 audit PEX-1 site, Sprint 3 audit LOW-1 site, Sprint 5 audit reaffirmation of both as Sprint 6 territory.

**Files reviewed (read-only at this stage)**:
- [src/oracles/swpc.js](../../../../src/oracles/swpc.js) — 451 lines, 8 findings (S-001..S-008)
- [src/oracles/donki.js](../../../../src/oracles/donki.js) — 381 lines, 7 findings (D-001..D-007)
- [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) — 423 lines, 8 findings (C-001..C-008)
- Carry-forward sites read but not patched in this task: [src/theatres/proton-cascade.js:263-289](../../../../src/theatres/proton-cascade.js#L263), [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:174-185](../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js#L174)

**Result**: 25 findings catalogued. 0 critical, 0 high, 9 medium, 16 low. PEX-1 disposition: option (A) defensive fix (recommended). C-006 / LOW-1 disposition: option (A) corpus-loader validation tightening (recommended).

### Task 6.2 (`corona-8m8`) — Authored security-review.md

**Approach**: drafted the document per the SDD §8.3 template at `grimoires/loa/sdd.md:824-852`. Three per-parser tables (S-NNN, D-NNN, C-NNN), one carry-forward table (PEX-NNN, LOW-NNN), Critical-findings §, Closed-in-Sprint-6 §, deferred/accepted-residual catalogue, SDD §8.2 checklist coverage table, Sprint 6 AC mapping, Sprint 7 entry posture §. The document is self-contained for `/review-sprint` and `/audit-sprint` consumption.

**Files written**:
- [grimoires/loa/calibration/corona/security-review.md](../../calibration/corona/security-review.md) — Sprint 6 primary deliverable.

### Task 6.3 (`corona-a6z`) — Applied two carry-forward fixes

#### Fix 1: PEX-1 (Sprint 2 carry-forward) — defensive optional chaining

**File**: [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js)
**Diff**:
```diff
-  if (payload.event_type === 'solar_flare' || payload.event_type === 'donki_flare') {
+  if (payload?.event_type === 'solar_flare' || payload?.event_type === 'donki_flare') {
   ...
-  if (payload.event_type !== 'proton_flux') {
+  if (payload?.event_type !== 'proton_flux') {
```

**Lines changed**: 266, 284 (two single-character `?` insertions)
**Approach**: per Sprint 6 handoff §6.4 option (A) — minimum-change defensive patch. Optional chaining produces `undefined` for the comparison if `payload` is null/undefined; `undefined === 'solar_flare'` and `undefined === 'donki_flare'` are both false (skips line 266 block); `undefined !== 'proton_flux'` is true (returns at line 284 with bundle tracked in evidence_bundles per the pre-existing line 261 mutation, identical to the pre-existing fall-through behavior for non-proton/non-flare bundle types per the comment at lines 285-288). Karpathy "Surgical Changes" preserved — only the lines necessary for the fix are touched.

**Why narrow**: the existing happy-path semantics for well-formed bundles (proton_flux / solar_flare / donki_flare / kp_index / solar_wind / etc.) are preserved bit-for-bit. The fix only adds graceful handling for the malformed-bundle edge case that previously threw `TypeError`.

#### Fix 2: C-006 / LOW-1 (Sprint 3 carry-forward) — corpus-loader negative-latency rejection

**File**: [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js)
**Function**: `validateT5(event, file)`
**Diff**: 24-line addition (one new validation block) inside `validateT5`, after the existing array-presence checks and before the final error-aggregation return. The block iterates over `event.stale_feed_events`, parses `actual_onset_time` and `detection_time` to ms epochs (skipping null entries and null fields), and pushes a descriptive error to `errors[]` if `detectMs < onsetMs`. Hard constraint #9 preserved — scoring layer at `t5-quality-of-behavior.js:183` is unchanged.

**Approach**: per Sprint 6 handoff §6.5 option (A) — corpus-validation-error fix path. The pre-existing scoring-layer `Math.max(0, …)` clamp at `t5-quality-of-behavior.js:183` is left in place as defense-in-depth; the loader-side rejection now surfaces corpus-authoring errors at corpus-load time (before scoring ever sees them) instead of being silently masked by the clamp.

**Why narrow**: tightens existing per-event T5 validator with one new error path. Does NOT change the T5 corpus-eligibility schema (calibration-protocol.md §3.7.6 already mandates the fields; the new check enforces an implicit invariant). Does NOT introduce new constants (no calibration-manifest.json changes). Does NOT touch scoring logic (operator hard constraint #9 preserved).

**Files added**:
- [tests/security/proton-cascade-pex1-test.js](../../../../tests/security/proton-cascade-pex1-test.js) — 6 tests covering PEX-1 regression: undefined / null / missing payload, well-formed flare bundle, well-formed kp_index bundle, resolved-state early-return.
- [tests/security/corpus-loader-low1-test.js](../../../../tests/security/corpus-loader-low1-test.js) — 10 tests covering C-006 regression: empty array, zero-latency boundary, positive latency (normal), negative latency (rejected), mixed array (rejection points to offending index), null onset, null detection, malformed ISO (deferred to scoring), null array entry, end-to-end via `_loadEventFile` with temp file.

---

## Technical Highlights

### Architectural conformance

- **Zero new runtime dependencies**: Sprint 6 fixes use only Node.js built-ins. `package.json:32 "dependencies": {}` invariant preserved. Verified: `git diff package.json` is empty.
- **Zero new test dependencies**: new tests use `node:test` + `node:assert/strict` (Node 20+ stdlib) + `node:fs` + `node:path` (for the end-to-end test temp file). No `devDependencies` added.
- **Scoring untouched**: `git diff --stat scripts/corona-backtest/scoring/` is empty. Hard constraint #9 preserved.
- **Calibration manifest untouched**: `git diff calibration-manifest.json` is empty. Sprint 5 source of truth preserved.
- **Frozen artifacts untouched**: corpus, run-1, run-2, calibration-protocol.md, theatre-authority.md, empirical-evidence.md, construct.yaml, identity/ — all `git diff --stat` empty.
- **System Zone untouched**: `.claude/` not modified.

### Test coverage strategy

For each fix, the test file pins the new behavior with both happy-path regression coverage AND failure-mode verification:

- **PEX-1 tests**: 3 failure-mode cases (undefined, null, missing payload) each verifies `assert.doesNotThrow` + correct theatre advancement (bundle tracked, qualifying_event_count unchanged). 3 happy-path cases (flare bundle, kp_index bundle, resolved-state early-return) verify the fix did NOT change semantics for well-formed inputs.

- **C-006 tests**: 4 happy-path cases (empty array, zero latency, positive latency, mixed array with one good entry) verify the new check is precisely scoped to the negative-latency invariant. 1 failure-mode case (negative latency) verifies the rejection includes the offending index, the explanatory message, and the schema citation `§3.7.6` for traceability. 4 edge cases (null onset, null detection, malformed ISO, null entry) pin the boundaries — these MUST pass through the new check without spurious rejections, since they are scope C-003 (deferred) territory.

The tests are deliberately scope-limited: a PEX-1 test that asserted on resolution-time count semantics or a C-006 test that asserted on scoring numerics would over-couple the test to behavior outside the fix's scope. Each test exercises exactly the new code path.

### Defense-in-depth for C-006

The Sprint 6 C-006 fix tightens validation at the loader (corpus-load time) without touching the scoring-layer clamp (`Math.max(0, …)` at `t5-quality-of-behavior.js:183`). This produces defense-in-depth:

1. **Corpus-load time**: the new loader check rejects negative-latency entries explicitly. Surfaces corpus-authoring errors at the earliest possible point.
2. **Scoring time**: the pre-existing `Math.max(0, …)` clamp remains as a backstop. If a future regression somehow allows a negative-latency entry to bypass the loader (e.g., a different code path consuming corpus events without going through `loadEventFile`), the scoring layer still produces a defensible value.

This layered approach preserves the operator hard constraint #9 (no scoring-semantics changes) while addressing the LOW-1 root cause.

### SDD §8.2 walk methodology

The walk was conducted parser-by-parser, row-by-row, with each finding traced to a specific file:line site. For each cell of the 13-row × 3-parser matrix:

1. If a code-level concern was identified, the finding was assigned a unique ID (S-NNN, D-NNN, C-NNN) and severity per SDD §8.4.
2. If no concern was identified, the cell was annotated `clean` with rationale (e.g., "all bounded forEach/for-of, no recursion" for the infinite-loop row).
3. If the row did not apply to the parser, the cell was annotated `N/A` (e.g., file-system path traversal is N/A for SWPC + DONKI; eclipse-season GOES gap is N/A for DONKI + corpus-loader; schema drift detection is N/A for SWPC + corpus-loader per their stable schemas).

The result is a complete coverage matrix at [security-review.md:189-204](../../calibration/corona/security-review.md), suitable for `/review-sprint` and `/audit-sprint` audit-trail review.

---

## Testing Summary

### Test files (new in Sprint 6)

| File | Tests | Description |
|------|-------|-------------|
| [tests/security/proton-cascade-pex1-test.js](../../../../tests/security/proton-cascade-pex1-test.js) | 6 | PEX-1 (Sprint 2 carry-forward) — defensive payload access |
| [tests/security/corpus-loader-low1-test.js](../../../../tests/security/corpus-loader-low1-test.js) | 10 | C-006 / LOW-1 (Sprint 3 carry-forward) — corpus-loader negative-latency rejection |

### Total test counts

| State | Tests | Suites |
|-------|-------|--------|
| Pre-Sprint-6 (HEAD `9558269`) | 144 | 27 |
| Post-Sprint-6 | 160 | 29 |
| Delta | +16 | +2 |

### How to run

```bash
# Full Sprint 6 test pass (baseline + new):
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js
# Expected: tests 160 / pass 160 / fail 0

# Validator green:
./scripts/construct-validate.sh construct.yaml
# Expected: "OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)"

# Backtest reproducibility (use scratch output dir to avoid overwriting run-1):
CORONA_OUTPUT_DIR=run-sprint-6-scratch node scripts/corona-backtest.js
# Expected: composite_verdict=fail (T1 fail / T2 pass / T3 fail / T4 fail / T5 fail) — IDENTICAL to Run 1 / Run 2 baseline.
# corpus_hash should be b1caef3...; script_hash should be 17f6380b...
# (Then rm -rf the scratch dir; do NOT commit it.)
```

### Verification — what was tested

| Concern | How verified |
|---------|--------------|
| PEX-1 fix prevents TypeError on malformed payload | 3 failure-mode tests (undefined/null/missing) with `assert.doesNotThrow` |
| PEX-1 fix preserves happy-path semantics | 3 happy-path tests (flare/kp/resolved-state) with explicit field assertions |
| C-006 fix rejects negative-latency entries | `_validateT5` and end-to-end `_loadEventFile` tests with assertion on rejection error message |
| C-006 fix is scoped tightly | 4 happy-path tests (empty/zero/positive/mixed) verify no false-positive rejections |
| C-006 fix handles null fields gracefully | 3 null-field tests (null onset, null detection, null entry) verify the latency check is skipped |
| C-006 fix does not over-reach into C-003 territory | 1 malformed-ISO test verifies that bad timestamps are NOT rejected by C-006 (deferred to C-003 / scoring isFinite guard) |
| Scoring numerics preserved | Backtest re-run produced identical corpus_hash + script_hash + per-theatre Brier/MAE/FP/p50/sw values |
| All baseline tests preserved | `node --test` run shows 144 baseline tests still pass |
| Validator preserved | `./scripts/construct-validate.sh construct.yaml` returns "OK" |
| Frozen artifacts preserved | `git diff --stat` empty for scoring/, calibration-manifest.json, calibration-protocol.md, theatre-authority.md, empirical-evidence.md, corpus/, run-1/, run-2/, package.json, construct.yaml, .claude/ |

---

## Known Limitations

### Findings deferred to Sprint 7+ or future cycle

The following 16 findings are documented as `deferred` in [security-review.md:172-181](../../calibration/corona/security-review.md):

- **S-002, S-003, S-004, S-005, S-007** — SWPC parser robustness against schema drift (timezone consistency, NaN filter strengthening, parseFloat bound checks, GOES eclipse-season gap detection). Wider-scope refactor than Sprint 6's narrow-fix mandate.
- **D-001, D-002, D-003, D-004, D-005, D-007** — DONKI parser null-guards on schema drift, era-aware normalization, rate-limit awareness in runtime poller. Defensive depth desirable but outside SDD §8 narrow-fix scope.
- **C-001, C-002, C-003, C-004, C-007** — corpus-loader robustness improvements (tier null guard, sort-with-NaN, ISO-8601 timestamp validation for non-T5-stale-feed fields, goes_satellite allowlist, event_id path-injection regex). Defense-in-depth — current state defensible per existing downstream sanitization (e.g., `write-report.js:298` already strips path-unsafe chars from event_id) or directory-encoded conventions.

### Findings accepted as residual risk

The following 7 findings are documented as `accepted residual` in [security-review.md:183-187](../../calibration/corona/security-review.md):

- **S-001, S-006, S-008** — SWPC error-envelope detail, 429 backoff, response-size cap. Defensible per PRD §9.2 read-only HTTP, zero auth, TLS-bound posture.
- **D-006** — DONKI response-size cap. Same rationale as S-008.
- **C-005** — corpus-loader per-file size cap. Defensible per `calibration-protocol.md` §3.5 operator-HITL-gated corpus authorship.
- **C-008** — `resolveCorpusDir` REPO_ROOT anchoring. Defensible per PRD §9.2 operator-trust boundary; verified safe in Sprint 3 audit Focus Area 2.

These are NOT critical (all medium/low severity per SDD §8.4). Per sprint.md GC.7-GC.8 + SDD §8.4 they do not block Sprint 7. Each row in security-review.md has a recommendation line that Sprint 7+ or future-cycle work may pick up.

### Sprint 5 LOW-1 (evidence-020 comment-substring match)

Per Sprint 5 audit, `corona-evidence-020`'s `match_pattern` is a comment-substring match (`"log-flux"`) rather than a runtime literal anchor. This is documented at:

- [grimoires/loa/calibration/corona/calibration-manifest.json](../../calibration/corona/calibration-manifest.json) (entry 020 notes field)
- [grimoires/loa/a2a/sprint-5/reviewer.md](../sprint-5/reviewer.md) (concerns §)
- [grimoires/loa/a2a/sprint-5/engineer-feedback.md](../sprint-5/engineer-feedback.md) (LOW-1 section)
- [grimoires/loa/a2a/sprint-5/auditor-sprint-feedback.md](../sprint-5/auditor-sprint-feedback.md) (LOW-1 informational)

Per the Sprint 6 handoff §12 ("Important carry-forward warnings"): Sprint 5 LOW-1 is **NOT a Sprint 6 task** — Sprint 7 / `corona-1ml` (final-validate) owns the regex strengthening if desired. Sprint 6 did not modify the manifest entry or the inline_lookup match_pattern. `git diff calibration-manifest.json` is empty.

---

## Verification Steps

For `/review-sprint sprint-6` and `/audit-sprint sprint-6`:

### Repository state (post-Sprint-6, pre-commit)

```bash
git log --oneline -1                                    # 9558269 (sprint-6 handoff packet at HEAD)
git status                                              # 4 categories visible:
                                                        #   modified: .beads/issues.jsonl
                                                        #   modified: scripts/corona-backtest/ingestors/corpus-loader.js
                                                        #   modified: src/theatres/proton-cascade.js
                                                        #   modified: grimoires/loa/sprint.md (Sprint 6 checkmarks)
                                                        # untracked: grimoires/loa/calibration/corona/security-review.md
                                                        # untracked: grimoires/loa/a2a/sprint-6/reviewer.md
                                                        # untracked: tests/security/proton-cascade-pex1-test.js
                                                        # untracked: tests/security/corpus-loader-low1-test.js
git diff --stat                                         # 9 lines: 4 in proton-cascade.js (2±), 24+0 in corpus-loader.js, sprint.md checkmarks, .beads/issues.jsonl status updates
```

### Quality gates

```bash
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js   # tests 160 / pass 160 / fail 0

./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
```

### Hard-constraint preservation

```bash
git diff --stat scripts/corona-backtest/scoring/        # empty (constraint #9)
git diff --stat scripts/corona-backtest/reporting/      # empty
git diff --stat scripts/corona-backtest.js              # empty
git diff --stat grimoires/loa/calibration/corona/calibration-manifest.json   # empty
git diff --stat grimoires/loa/calibration/corona/calibration-protocol.md     # empty
git diff --stat grimoires/loa/calibration/corona/theatre-authority.md        # empty
git diff --stat grimoires/loa/calibration/corona/empirical-evidence.md       # empty
git diff --stat grimoires/loa/calibration/corona/corpus/                     # empty
git diff --stat grimoires/loa/calibration/corona/run-1/                      # empty
git diff --stat grimoires/loa/calibration/corona/run-2/                      # empty
git diff --stat package.json                            # empty (zero-runtime-dep invariant)
git diff --stat construct.yaml                          # empty (Sprint 7 territory)
git diff --stat .claude/                                # empty (System Zone)
```

### Beads state

```bash
br list --status closed --json | grep -c "sprint-6-"    # Expect: 4 (corona-r4y + corona-8m8 + corona-a6z + corona-16a epic)
```

### Audit focus areas (per handoff §11)

1. **No secrets/API keys committed**: `git diff` shows no API keys, tokens, or credentials in any modified file. Tests use ISO-8601 strings; no real-world secrets.
2. **No dependency mutation**: `git diff package.json` is empty. No package-lock.json / yarn.lock / pnpm-lock.yaml.
3. **No unsafe filesystem handling introduced**: corpus-loader patch adds validation logic only, no new file-system access. PEX-1 patch is in src/theatres/, no FS calls.
4. **No ReDoS-prone regex introduced**: no new regex in either patch.
5. **No network behavior widened**: no new fetch endpoints, no new HTTP methods, no new auth schemes. PEX-1 fix is in T4 theatre (no network); C-006 fix is in corpus-loader (local file).
6. **No hidden scoring/settlement changes**: scoring and settlement modules untouched per `git diff --stat`. PEX-1 fix is in proton-cascade.js but only modifies bundle-routing semantics for malformed bundles (no theatre-state mutation beyond what was already happening pre-fix; the bundle was already being added to evidence_bundles[] at line 261 before the fixed sites).
7. **No Sprint 7 publish-readiness work smuggled in**: construct.yaml, BUTTERFREEZONE.md, package.json version, spec/* — all `git diff --stat` empty.

### Review focus areas (per handoff §10)

1. **Severity classifications correct per SDD §8.4 ladder**: each finding row has a Severity column entry; the summary table tallies by severity. Reviewer should spot-check a sample (e.g., D-005 at medium because it's a non-graceful degradation in cumulative request volume; C-006 at medium because it's a data-quality vector that previously slipped through).
2. **Patches are narrow + localized**: PEX-1 is 4 characters (2× `?`); C-006 is 24 lines all inside `validateT5()`. No collateral changes.
3. **Scoring/settlement/corpus eligibility/calibration semantics unchanged**: verified via `git diff --stat` constraint preservation list above.
4. **PEX-1 + LOW-1 explicitly addressed with rationale**: PEX-1 fixed per option (A); LOW-1 fixed via C-006 corpus-loader path per option (A). Both decisions are documented in security-review.md "Closed in Sprint 6" §.
5. **New tests are meaningful, not cosmetic**: each test has explicit pre-conditions, action, post-conditions; test names describe semantics ("REJECTS a stale_feed_events entry with negative latency", not "test rejection"). The PEX-1 happy-path tests verify field-level state changes (evidence_bundles inclusion, qualifying_event_count preservation, position_history reason content), not just lack of throw.
6. **security-review.md distinguishes fixed / deferred / accepted residual clearly**: every Status column entry uses one of the three terms verbatim. Disposition catalogue at security-review.md:171-187 groups findings by disposition with rationale.

---

## Stop Condition Acknowledgment

Per Sprint 6 handoff §17 stop condition + the operator's `/implementing-tasks` invocation Stop condition:

The agent has stopped after Sprint 6 implementation. Awaiting:

1. **`/review-sprint sprint-6`** — senior reviewer validates per handoff §10 review focus areas.
2. **`/audit-sprint sprint-6`** — security auditor validates per handoff §11 audit focus areas.
3. **Operator commit approval** — operator commits Sprint 6 mirroring the Sprint 0/1/2/3/4/5 commit pattern.
4. **Sprint 7 decision** — operator decides whether to start Sprint 7 (final-validate + BFZ refresh + v0.2.0 tag) or pause.

The agent will NOT auto-review, auto-audit, auto-commit, or auto-start Sprint 7.

---

*Sprint 6 implementation report authored 2026-05-01 per /implementing-tasks reviewer template + AC Verification gate (cycle-057 / Issue #475 enforcement). Handoff packet §17 stop condition honored. Awaiting operator HITL gates.*
