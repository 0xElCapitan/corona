# Sprint 7 Implementation Report — CORONA cycle-001 Final Validation + Closeout

**Sprint**: 7 (Final Validate + BFZ Refresh + v0.2.0)
**Cycle**: cycle-001
**Authored**: 2026-05-01 (Sprint 7 implementation complete; uncommitted)
**Engineer**: Sprint Task Implementer (Loa framework `/implementing-tasks` skill)
**Sprint epic**: `corona-1ml` (closed)
**Predecessor commit**: `cf489ee` (`docs(corona): add sprint 7 handoff packet`)

---

## Executive Summary

Sprint 7 closed cycle-001 by validating the v0.2.0-ready state of the CORONA construct without introducing new features, refits, or architectural changes. All 5 owner tasks closed. The construct validator is green at schema commit `b98e9ef`. A final calibration run (`run-3-final/`) was committed with corpus_hash and script_hash invariants matching the Sprint 3 baseline; per-theatre numerics are bit-identical to Run 1 and Run 2. BUTTERFREEZONE.md was refreshed with post-calibration provenance preserving the Sprint 5 honest no-refit framing. `package.json` version bumped from 0.1.0 to 0.2.0 with no other mutations. End-to-end goal validation walked all 21 PRD goals (G0.1-G0.12, GC.1-GC.5, GF.1-GF.4) with file:line evidence; all 21 met. The full test suite (160 tests across 29 suites) is green.

The implementation deliberately stayed within the operator's hard constraints: no Sprint 0-6 modifications, no parameter refits, no scoring-semantics changes, no new dependencies, no new corpus events, no new tests. The closeout posture is calibration-attempted (not calibration-improved); v0.2.0 ships with documented limitations, not an overclaim of empirical accuracy.

**Status**: Ready for `/review-sprint sprint-7` and `/audit-sprint sprint-7`. Operator stop condition honored: NOT auto-committed, NOT auto-tagged.

---

## AC Verification

> Per CLAUDE.md AC Verification Gate (cycle-057, closes #475). Each acceptance criterion below quotes the verbatim text from `grimoires/loa/sprint.md` Sprint 7 § Acceptance Criteria + Goal Mapping Appendix C, paired with the status, file:line evidence, and verification command.

### AC GF.1 — Final validator green

> **Verbatim** (sprint.md L483, L491): `**GF.1**: 'construct-validate.sh' green against post-calibration spec` / `Task 7.1 (corona-32r): sprint-7-final-validator-green — Run construct-validate.sh against post-calibration spec. → [GF.1]`

- **Status**: ✓ Met
- **Evidence**: [`scripts/construct-validate.sh`](../../../../scripts/construct-validate.sh) executed against [`construct.yaml`](../../../../construct.yaml). Exit 0 confirmed (a) before version bump (Task 7.1) and (b) after version bump (Task 7.5 verification). Output: `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)`. Schema commit `b98e9ef` matches Sprint 0 baseline.
- **Reproduce**: `./scripts/construct-validate.sh construct.yaml; echo $?` → `0`

### AC GF.2 — BFZ refreshed with post-calibration provenance

> **Verbatim** (sprint.md L484, L492): `**GF.2**: BFZ refresh complete with post-calibration provenance` / `Task 7.2 (corona-8v2): sprint-7-refresh-butterfreezone — Refresh BFZ with post-calibration provenance. → [GF.2]`

- **Status**: ✓ Met
- **Evidence**: [`BUTTERFREEZONE.md`](../../../../BUTTERFREEZONE.md) — refreshed from 193 lines (pre-Sprint-7) to 362 lines. Updates anchored at:
  - [BUTTERFREEZONE.md:5](../../../../BUTTERFREEZONE.md#L5) — `version: 0.2.0` in AGENT-CONTEXT
  - [BUTTERFREEZONE.md:24-26](../../../../BUTTERFREEZONE.md#L24) — new AGENT-CONTEXT fields: `calibration_status: attempted-no-refit`, `v3_schema: schemas/construct.schema.json @ b98e9ef`, `test_count: 160`
  - [BUTTERFREEZONE.md:142-204](../../../../BUTTERFREEZONE.md#L142) — new "Calibration Status" section with Sprint 0-7 timeline + Run 1 / Run 2 / Run-3-final invariants table + "Why numerics are identical (architectural reality)" subsection enforcing operator hard constraint #14 honest framing
  - [BUTTERFREEZONE.md:218-237](../../../../BUTTERFREEZONE.md#L218) — new "Security Review" section summarizing Sprint 6 (0 critical / 0 high / 9 medium / 16 low; PEX-1 + C-006 carry-forward fixes)
  - [BUTTERFREEZONE.md:239-273](../../../../BUTTERFREEZONE.md#L239) — new "Known Limitations" section: calibration limitations, provenance limitations (Sprint 5 LOW-1 + Sprint 6 LOW-A1/A2/A3), L2 publish-readiness gaps, Sprint 1 review C5
  - [BUTTERFREEZONE.md:350-362](../../../../BUTTERFREEZONE.md#L350) — refreshed `ground-truth-meta` block with Sprint 7 metadata + run hash invariants
- **Honest framing preservation**: BFZ Calibration Status explicitly states "**The numerical match across Run 1 / Run 2 / Run-3-final is NOT a calibration improvement claim.** It is the architectural reality of the Sprint 3 harness..." per operator hard constraint #14 + Sprint 7 review focus #3.
- **Reproduce**: `wc -l BUTTERFREEZONE.md` → `362 BUTTERFREEZONE.md`. `grep -c 'calibration_status: attempted-no-refit' BUTTERFREEZONE.md` → `2` (AGENT-CONTEXT + ground-truth-meta).

### AC GF.3 — Final calibration certificates committed at run-N-final/

> **Verbatim** (sprint.md L485, L493): `**GF.3**: Final certificates committed at 'run-N-final/'` / `Task 7.3 (corona-1p5): sprint-7-execute-run-N-final — Final corpus run → run-N-final/. → [GF.3]`

- **Status**: ✓ Met
- **Evidence**: [`grimoires/loa/calibration/corona/run-3-final/`](../../../calibration/corona/run-3-final/) — Sprint 7 produced run-3-final (next un-used run number after run-1, run-2). Contents:
  - 5 per-theatre reports: T1-report.md / T2-report.md / T3-report.md / T4-report.md / T5-report.md
  - [`run-3-final/summary.md`](../../../calibration/corona/run-3-final/summary.md) with composite verdict `fail` and per-theatre roll-up
  - [`run-3-final/corpus_hash.txt`](../../../calibration/corona/run-3-final/corpus_hash.txt) — `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` ✓ matches Sprint 3 baseline
  - [`run-3-final/script_hash.txt`](../../../calibration/corona/run-3-final/script_hash.txt) — `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` ✓ matches Sprint 3 baseline
  - `run-3-final/per-event/` — 25 JSON certificates (5 per theatre × 5 theatres). `diff -r run-2/per-event/ run-3-final/per-event/` returns empty (byte-identical).
  - [`run-3-final/delta-report.md`](../../../calibration/corona/run-3-final/delta-report.md) — Sprint 7 closeout delta vs Run 1 + Run 2; documents "numerics IDENTICAL across all three runs" with full Run 1 / Run 2 / Run-3-final comparison table; honest no-refit framing per operator hard constraint #14.
- **Per-theatre numerics**: T1 Brier 0.1389 / T2 Brier 0.1389 / T3 MAE 6.760h / T4 Brier 0.1600 / T5 FP 25.0% / p50 90.0s / switch_handled 100.0% — all identical to Run 1 + Run 2.
- **Reproduce**: `CORONA_OUTPUT_DIR=run-scratch node scripts/corona-backtest.js` produces a fresh run; hashes match Sprint 3 baseline. The committed `run-3-final/` was generated at 2026-05-01T20:48:50Z (code revision `cf489ee`).

### AC GF.4 — Test suite green (60 baseline + new tests)

> **Verbatim** (sprint.md L486, L495): `**GF.4**: Test suite green (60 baseline + new tests)` / `Task 7.5 (corona-2k3, P0): sprint-7-e2e-goal-validation — E2E Goal Validation per Goal Mapping Appendix. Run full test suite (60 + new) AND execute the validation steps in Appendix C.`

- **Status**: ✓ Met
- **Evidence**: 160 tests across 29 suites, 0 failures, 0 cancelled, 0 skipped, 0 todo. Verified at Sprint 7 close (post-version-bump):

  ```
  $ node --test tests/corona_test.js \
                tests/manifest_structural_test.js \
                tests/manifest_regression_test.js \
                tests/security/proton-cascade-pex1-test.js \
                tests/security/corpus-loader-low1-test.js
  ℹ tests 160
  ℹ suites 29
  ℹ pass 160
  ℹ fail 0
  ℹ duration_ms 166.1966
  ```

  Per-file breakdown:
  - [`tests/corona_test.js`](../../../../tests/corona_test.js) — 1188 lines, 93 baseline tests across 21 suites (Sprints 0-3 baseline; PEX-1 carry-forward suite at end)
  - [`tests/manifest_structural_test.js`](../../../../tests/manifest_structural_test.js) — 385 lines, 22 tests (Sprint 5 Task 5.4 / `corona-3o4`)
  - [`tests/manifest_regression_test.js`](../../../../tests/manifest_regression_test.js) — 226 lines, 29 tests (Sprint 5 Task 5.5 / `corona-15v`)
  - [`tests/security/proton-cascade-pex1-test.js`](../../../../tests/security/proton-cascade-pex1-test.js) — 133 lines, 6 tests (Sprint 6 PEX-1 regression)
  - [`tests/security/corpus-loader-low1-test.js`](../../../../tests/security/corpus-loader-low1-test.js) — 218 lines, 10 tests (Sprint 6 C-006 regression)
- **Sprint 7 added zero new tests** because all goals were met by existing coverage. The sprint.md AC reference of "60 baseline" reflects the original Sprint 0 baseline; the actual baseline grew through Sprints 0-6 (60 → 93 → 144 → 160). Closeout sprints typically introduce no new tests per handoff §6.13 ("This is closeout/finalization, not new feature work").
- **Reproduce**: command above; output documented at `/tmp/sprint7-validator-output.txt` (transient).

### AC E2E goal validation — All G0.x, GC.x, GF.x goals validated end-to-end

> **Verbatim** (sprint.md L487): `All G0.x, GC.x, GF.x goals validated end-to-end (Task 7.5 / E2E)`

- **Status**: ✓ Met
- **Evidence**: [`grimoires/loa/a2a/sprint-7/e2e-goal-validation.md`](e2e-goal-validation.md) — 21/21 PRD goals walked with verbatim acceptance text + file:line evidence + Sprint task contribution.
  - 12/12 G0.x (Sprint 0 v3 readiness): all met
  - 5/5 GC.x (calibration acceptance Sprints 2-5): all met
  - 4/4 GF.x (Sprint 7 final acceptance): all met
- **Composite calibration verdict** is `fail`, framed honestly per operator constraint #14 as the architectural-reality outcome of uniform-prior baseline scoring (not a calibration deficiency of runtime parameters).
- **Reproduce**: read `e2e-goal-validation.md` § Validation summary table (21 rows, all ✓).

### AC version bump (Task 7.4)

> **Verbatim** (sprint.md L494): `Task 7.4 (corona-w1v): sprint-7-version-bump — package.json 0.1.0 → 0.2.0; tag.`

- **Status**: ✓ Met (version bumped; tag deferred to operator per stop condition §11)
- **Evidence**: [`package.json:3`](../../../../package.json#L3) — `"version": "0.2.0"`. `git diff package.json` shows ONLY the version field changed:

  ```
  -  "version": "0.1.0",
  +  "version": "0.2.0",
  ```

  No new entries in `dependencies` (still `{}` at [`package.json:32`](../../../../package.json#L32)). No `package-lock.json`, no `node_modules`. Zero-runtime-dependency invariant preserved per PRD §8.1.
- **Tag policy**: per handoff §11 stop condition, the v0.2.0 git tag is operator-gated post-commit. Sprint 7 implementation does NOT auto-tag.
- **Reproduce**: `git diff package.json` (single-field diff); `grep '"dependencies"' package.json` → `"dependencies": {}`.

---

## Tasks Completed

### Task 7.1 (corona-32r) — Final validator green → GF.1

- **Files inspected**: [`scripts/construct-validate.sh`](../../../../scripts/construct-validate.sh), [`construct.yaml`](../../../../construct.yaml), [`schemas/construct.schema.json`](../../../../schemas/construct.schema.json)
- **Approach**: Ran the validator against the post-calibration `construct.yaml` (no spec mutations in Sprint 7). Confirmed exit 0 + schema commit hash `b98e9ef`. Re-confirmed post-version-bump.
- **Output**: `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)` exit 0
- **Test coverage**: existing — validator embedded in CI gate; no new tests added (closeout sprint constraint per handoff §6.13)
- **Beads**: closed with reason "Validator green at exit 0; schema commit b98e9ef preserved"

### Task 7.3 (corona-1p5) — Execute Run-3-final → GF.3

- **Files created**: 9 files under [`grimoires/loa/calibration/corona/run-3-final/`](../../../calibration/corona/run-3-final/) — T1-T5 reports, summary.md, corpus_hash.txt, script_hash.txt, delta-report.md
- **Files created (per-event)**: 25 JSON certificates under [`grimoires/loa/calibration/corona/run-3-final/per-event/`](../../../calibration/corona/run-3-final/per-event/)
- **Approach**: Ran `CORONA_OUTPUT_DIR=run-3-final node scripts/corona-backtest.js`. Verified hash invariants (corpus_hash + script_hash both match Sprint 3 baseline `b1caef3...` / `17f6380b...`). Verified per-theatre numerics IDENTICAL to Run 1 + Run 2 via `diff -r per-event/` (empty diff) and `grep + diff` on theatre report metric lines. Authored `delta-report.md` per handoff §5 optional output to document the closeout delta + reinforce honest no-refit framing.
- **Output**: `corona-backtest: run-3-final composite_verdict=fail`; T1 0.1389 / T2 0.1389 / T3 6.76h / T4 0.1600 / T5 25.0%/90.0s/100% (all identical to Run 1 + Run 2)
- **Test coverage**: existing — harness behavior is covered by `tests/corona_test.js` and `tests/manifest_*_test.js`; no new tests required (the harness was unchanged in Sprint 7)
- **Beads**: closed with reason summarizing hashes + numerics

### Task 7.2 (corona-8v2) — Refresh BUTTERFREEZONE → GF.2

- **Files modified**: [`BUTTERFREEZONE.md`](../../../../BUTTERFREEZONE.md) (193 → 362 lines)
- **Approach**: Preserved existing AGENT-CONTEXT structure and provenance-comment convention (`<!-- provenance: CODE-FACTUAL -->`, `<!-- provenance: DERIVED -->`, `<!-- provenance: OPERATIONAL -->`). Added new `<!-- provenance: CALIBRATION -->` provenance category for Sprint 2-7 calibration content. Updated AGENT-CONTEXT fields (version 0.2.0, calibration_status, v3_schema, test_count). Authored 4 new sections: Calibration Status (Sprint 0-7 timeline + Run hashes + architectural-reality explanation), Security Review (Sprint 6 25-finding summary + carry-forward fixes), Known Limitations (calibration + provenance + L2 publish-readiness + Sprint 1 C5), refreshed Module Map and Directory structure to reflect Sprint 0-6 deliverables. Refreshed ground-truth-meta block with Sprint 7 close metadata.
- **Honest framing**: explicitly preserved Sprint 5 + Sprint 7 architectural-reality framing per operator hard constraint #14 ("Run 2 = Run 1 numerically by design — uniform-prior architecture; NOT a calibration improvement"). The `calibration_status: attempted-no-refit` field in AGENT-CONTEXT plus the "Why numerics are identical" subsection enforce this at structured-metadata + prose levels.
- **Test coverage**: existing — BFZ has no automated test gate; manual review verifies content
- **Beads**: closed with reason summarizing the refresh

### Task 7.4 (corona-w1v) — Version bump 0.1.0 → 0.2.0

- **Files modified**: [`package.json:3`](../../../../package.json#L3) — single-field change `"version": "0.1.0"` → `"version": "0.2.0"`
- **Approach**: Used Edit tool for surgical single-line change. Verified diff is minimal (only version field). Verified zero-dep posture preserved (`dependencies: {}` unchanged; no package-lock.json; no node_modules). Per handoff §11 stop condition, the git tag is operator-gated post-commit; this implementation does NOT tag.
- **Output**: `git diff package.json` shows 2-line diff (one minus, one plus, version field only)
- **Test coverage**: existing — `tests/manifest_*_test.js` includes Sprint 5 schema tests that read `package.json` for cross-checks; all green
- **Beads**: closed with reason summarizing single-field diff + invariants preserved

### Task 7.5 (corona-2k3, P0) — E2E goal validation → GF.4 + ALL goals

- **Files created**: [`grimoires/loa/a2a/sprint-7/e2e-goal-validation.md`](e2e-goal-validation.md) — 285 lines
- **Approach**: Walked all 21 PRD goals (G0.1-G0.12, GC.1-GC.5, GF.1-GF.4) from sprint.md Goal Mapping Appendix C. For each goal: (a) quoted verbatim acceptance criterion from PRD/sprint.md, (b) ran the validation action (file inspection, command execution, test run), (c) cited file:line evidence, (d) noted any honesty-binding caveats (e.g., G0.5 commands.path JS-vs-md gap as Sprint 0 carry-forward; T4/G0.12 R-scale references in historical comments). Re-ran the full test suite (160 tests / 29 suites) post-version-bump as the GF.4 reproduction. Composite-verdict honesty section explicitly states the calibration-attempted (not calibration-improved) closeout posture per operator hard constraint #14.
- **Output**: 21/21 goals met. 160 tests pass. Validator green. All hash invariants confirmed.
- **Test coverage**: existing — the test suite IS the GF.4 evidence; the goal validation report cites it
- **Beads**: closed with reason summarizing 21/21 goal coverage + honesty framing

---

## Technical Highlights

### Architecture (preserved, not modified)

Sprint 7 made **zero source code changes** to:
- `src/oracles/swpc.js`, `src/oracles/donki.js` (Sprint 0-3 baseline + Sprint 6 hardening boundary unchanged)
- `src/processor/*.js` (bundles, quality, uncertainty, settlement)
- `src/theatres/*.js` (T1-T5 theatre code, including Sprint 6 PEX-1 fix at proton-cascade.js:266,284)
- `src/rlmf/certificates.js`
- `scripts/corona-backtest.js` and `scripts/corona-backtest/**` (entrypoint + scoring + ingestors + reporting; including Sprint 6 C-006 fix at corpus-loader.js:326-349)
- `scripts/construct-validate.sh`
- `tests/**` (no new tests; existing 160 unchanged)
- `construct.yaml` (no v3 manifest mutations)
- `grimoires/loa/calibration/corona/calibration-protocol.md` (Sprint 2 frozen)
- `grimoires/loa/calibration/corona/calibration-manifest.json` (Sprint 5 source of truth; 30 entries unchanged)
- `grimoires/loa/calibration/corona/empirical-evidence.md` (Sprint 4 deliverable)
- `grimoires/loa/calibration/corona/security-review.md` (Sprint 6 deliverable)
- `grimoires/loa/calibration/corona/theatre-authority.md` (Sprint 0 deliverable)
- `grimoires/loa/calibration/corona/corpus/primary/**` (Sprint 3 frozen)
- `grimoires/loa/calibration/corona/run-1/**` (Sprint 3 baseline; immutable)
- `grimoires/loa/calibration/corona/run-2/**` (Sprint 5 baseline; immutable)

This adheres strictly to handoff §6 hard constraints #1, #4, #5, #6, #7, #11, #12, #13.

### Performance

- Validator runtime: ~1s (no change from Sprint 0)
- Backtest harness runtime for run-3-final: ~3s on 25-event corpus (no change from Sprint 5 Run 2)
- Test suite runtime: ~166ms for 160 tests (no regression)

### Security

- Sprint 6 input-validation hardening preserved bit-for-bit:
  - PEX-1 optional chaining at [`src/theatres/proton-cascade.js:266,284`](../../../../src/theatres/proton-cascade.js#L266) — unchanged
  - C-006 negative-latency rejection at [`scripts/corona-backtest/ingestors/corpus-loader.js:326-349`](../../../../scripts/corona-backtest/ingestors/corpus-loader.js#L326) — unchanged
- Both regression test suites green (6 + 10 = 16 tests in `tests/security/`)
- No new secrets, no new credentials, no new endpoints, no new shell exec
- Zero-runtime-dependency posture preserved (PRD §8.1 invariant)

### Integrations

- Sprint 7 adds NO new external integrations
- The `compose_with: [tremor]` declaration is documentation-only (per handoff §6 + operator hard constraint J: TREMOR is read-only this cycle)

---

## Testing Summary

### Test files (5)

| File | Tests | Sprints | Purpose |
|------|-------|---------|---------|
| [`tests/corona_test.js`](../../../../tests/corona_test.js) | 93 | 0-3, 6 | Baseline coverage (oracles, processor, theatres, rlmf); PEX-1 carry-forward suite |
| [`tests/manifest_structural_test.js`](../../../../tests/manifest_structural_test.js) | 22 | 5 | PRD §7 manifest schema invariants |
| [`tests/manifest_regression_test.js`](../../../../tests/manifest_regression_test.js) | 29 | 5 | Inline-equals-manifest per SDD §7.3 |
| [`tests/security/proton-cascade-pex1-test.js`](../../../../tests/security/proton-cascade-pex1-test.js) | 6 | 6 | PEX-1 (proton-cascade defensive payload access) regression |
| [`tests/security/corpus-loader-low1-test.js`](../../../../tests/security/corpus-loader-low1-test.js) | 10 | 6 | C-006/LOW-1 (T5 negative-latency rejection) regression |

**Total**: 160 tests, 29 suites, 0 failures.

### Scenarios covered

- **Happy paths**: Each theatre (T1-T5) with valid corpus events; backtest harness produces certificates; manifest entries match source literals; PEX-1 + C-006 regressions don't reactivate.
- **Edge cases**:
  - PEX-1: undefined/null/missing payload keys (6 cases); preserves happy-path
  - C-006: negative latency rejected; positive latency accepted; T5 stale_feed_events validation enforces non-negative
  - Manifest structural: required fields per PRD §7; verification_status taxonomy; provisional flag consistency
  - Manifest regression: each match_pattern compiles + matches the runtime literal; failure modes assert clear error messages
- **Error conditions**: corpus-loader rejects malformed events; manifest test fails on missing fields; bundle constructor rejects null/undefined evidence

### How to run

```bash
# Full suite
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js

# Per-file
node --test tests/manifest_structural_test.js
node --test tests/manifest_regression_test.js
node --test tests/security/

# Validator
./scripts/construct-validate.sh construct.yaml

# Backtest harness (writes to scratch dir to avoid overwriting committed runs)
CORONA_OUTPUT_DIR=run-scratch node scripts/corona-backtest.js
```

---

## Known Limitations

**These are documented for v0.2.0 release-honesty.** Each is non-blocking for the calibration-attempted release but is an explicit future-cycle owner item. Detailed enumeration in `BUTTERFREEZONE.md` § Known Limitations.

### Calibration

- **No parameter refits in cycle-001.** Sprint 5 made an evidence-driven NO-CHANGE decision per Sprint 4 §4.2-§4.5 literature evidence. Run-2/run-3-final = Run-1 numerically by design. v0.2.0 is "construct + calibration committed", not "calibration delivers improved Brier/MAE." See `run-3-final/delta-report.md` for full architectural-reality explanation.
- **29/30 manifest entries are provisional** with `verification_status` ∈ {`ENGINEER_CURATED_REQUIRES_VERIFICATION`, `OPERATIONAL_DOC_ONLY`, `HYPOTHESIS_OR_HEURISTIC`}. Each carries a `promotion_path` documenting the literature/empirical work needed for `VERIFIED_FROM_SOURCE` promotion. Promotion is future-cycle scope.
- **5-event-per-theatre primary corpus.** Sprint 3 corpus is intentionally small for harness verification. Larger corpus (15-25+ events per theatre) is future-cycle scope per Sprint 4 §4.5 entry-006 promotion path.
- **Composite verdict `fail`.** Reflects corpus characteristics (T1/T4 buckets sparse), WSA-Enlil corpus prediction error (T3 dominated by one 16h-error event), and intentional T5 FP-rate test labels. Not a calibration deficiency of the construct's runtime parameters.

### Provenance polish (Sprint 5/6 LOW deferred items)

- **Sprint 5 LOW-1 (`corona-evidence-020`)**: `match_pattern` is comment-substring (`"log-flux"`), `verification_status: OPERATIONAL_DOC_ONLY`. Future-cycle: anchor on imported runtime function names per `grimoires/loa/a2a/sprint-7/handoff.md` §7 Sprint 5 LOW-1 row.
- **Sprint 6 LOW-A1**: `resolveOutputDir` parallel to C-008 not catalogued in security-review.md. Documentation polish only.
- **Sprint 6 LOW-A2**: C-006 (medium) vs LOW-1 (low) severity inconsistency. Cross-references exist; severity not reconciled. Documentation polish only.
- **Sprint 6 LOW-A3**: Backtest harness defaults to `run-1` output (accidental-overwrite hazard). Future-cycle harness amendment.

Sprint 7 elected **NOT to address these LOW items** to keep closeout scope tight per handoff §7 ("If unsure, defer to future cycle"). All four are documented in BFZ Known Limitations for future-cycle ownership.

### L2 publish-readiness gaps (Sprint 0 carry-forwards)

cycle-001 v0.2.0 is **L1 tested + calibration committed**, NOT **L2 publish-ready** to construct-network. The Sprint 0 carry-forwards documented in BFZ § L2 Publish-Readiness:
- `commands.path` references `src/theatres/*.js` rather than upstream-convention `commands/*.md`
- `schemas/CHECKSUMS.txt` not generated
- Tempfile EXIT trap not added to `scripts/construct-validate.sh`
- `ajv-formats` not installed for full validator coverage

These do not block local deployment; they block construct-network L2 publish. Closing them is future-cycle scope.

### Sprint 1 review C5

`composition_paths.reads: []` registry compatibility with construct-network indexer not verified locally (indexer not available in cycle-001 dev environment). Documented in `grimoires/loa/a2a/sprint-1/engineer-feedback.md`.

---

## Verification Steps for Reviewer

The reviewer can verify Sprint 7 implementation independently:

```bash
# 1. Repo state
git status                                              # uncommitted Sprint 7 changes
git rev-list --left-right --count main...origin/main    # 0 0 (in sync; uncommitted not pushed)

# 2. Validator green
./scripts/construct-validate.sh construct.yaml          # exit 0; OK: construct.yaml conforms to v3 (... b98e9ef)

# 3. Test suite green (160 tests, 29 suites, 0 fail)
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js

# 4. Hash invariants preserved across all three runs
grep "Corpus hash\|Script hash" \
     grimoires/loa/calibration/corona/run-1/summary.md \
     grimoires/loa/calibration/corona/run-2/summary.md \
     grimoires/loa/calibration/corona/run-3-final/summary.md
# Expect: same b1caef3... + same 17f6380b... in all three

# 5. Run-3-final per-event byte-identical to run-2
diff -r grimoires/loa/calibration/corona/run-2/per-event/ \
        grimoires/loa/calibration/corona/run-3-final/per-event/
# Expect: empty diff

# 6. Theatre numerics identical across runs
for t in T1 T2 T3 T4 T5; do
  diff <(grep -E "Brier|MAE|hit_rate|fp_rate|p50|switch_handled|min_calibration|convergence|Verdict|verdict" grimoires/loa/calibration/corona/run-2/${t}-report.md) \
       <(grep -E "Brier|MAE|hit_rate|fp_rate|p50|switch_handled|min_calibration|convergence|Verdict|verdict" grimoires/loa/calibration/corona/run-3-final/${t}-report.md) \
    && echo "${t}: identical" || echo "${t}: DIFFERS"
done
# Expect: all 5 "identical"

# 7. Version bump diff is minimal
git diff package.json
# Expect: only the "version" field changed, +0.2.0 / -0.1.0

# 8. Zero-dep posture preserved
grep '"dependencies"' package.json    # "dependencies": {}
test -f package-lock.json && echo "PRESENT (BAD)" || echo "no package-lock.json"
test -d node_modules && echo "PRESENT (BAD)" || echo "no node_modules"

# 9. BFZ refresh acknowledged
wc -l BUTTERFREEZONE.md                                # 362
grep -c "calibration_status: attempted-no-refit" BUTTERFREEZONE.md  # 2 (AGENT-CONTEXT + ground-truth-meta)
grep "Run 2 = Run 1\|architectural reality\|NOT a calibration improvement" BUTTERFREEZONE.md  # honest framing present

# 10. Beads closeout
br list --status closed --json 2>/dev/null | jq -r '.[] | select(.labels[]? == "sprint:7") | "\(.id) | \(.status) | \(.title)"'
# Expect: corona-1ml + corona-32r + corona-8v2 + corona-1p5 + corona-w1v + corona-2k3 (6 closed)

br list --status open --json 2>/dev/null | jq -r '.[] | select(.labels[]? == "sprint:7") | "\(.id) | \(.status) | \(.title)"'
# Expect: empty (no open Sprint 7 tasks)

# 11. E2E goal validation report exists
wc -l grimoires/loa/a2a/sprint-7/e2e-goal-validation.md   # ~285 lines

# 12. Spot-check honesty constraint
grep -c "NOT a calibration improvement\|architectural reality\|attempted-no-refit\|no-refit posture\|no parameter refits\|no runtime parameter refits" \
       BUTTERFREEZONE.md \
       grimoires/loa/calibration/corona/run-3-final/delta-report.md \
       grimoires/loa/a2a/sprint-7/e2e-goal-validation.md \
       grimoires/loa/a2a/sprint-7/reviewer.md
# Expect: each file has multiple matches (honest framing repeated for emphasis)
```

---

## Files Modified / Created Summary

### Created (10 paths)

| Path | Lines | Purpose |
|------|-------|---------|
| `grimoires/loa/calibration/corona/run-3-final/T1-report.md` | (auto) | T1 per-theatre certificate |
| `grimoires/loa/calibration/corona/run-3-final/T2-report.md` | (auto) | T2 per-theatre certificate |
| `grimoires/loa/calibration/corona/run-3-final/T3-report.md` | (auto) | T3 per-theatre certificate |
| `grimoires/loa/calibration/corona/run-3-final/T4-report.md` | (auto) | T4 per-theatre certificate |
| `grimoires/loa/calibration/corona/run-3-final/T5-report.md` | (auto) | T5 per-theatre certificate |
| `grimoires/loa/calibration/corona/run-3-final/summary.md` | (auto) | Composite verdict + roll-up |
| `grimoires/loa/calibration/corona/run-3-final/corpus_hash.txt` | 1 | Hash invariant (Sprint 3 baseline) |
| `grimoires/loa/calibration/corona/run-3-final/script_hash.txt` | 1 | Hash invariant (Sprint 3 baseline) |
| `grimoires/loa/calibration/corona/run-3-final/per-event/*.json` | (auto) | 25 per-event JSON certificates |
| `grimoires/loa/calibration/corona/run-3-final/delta-report.md` | 88 | Sprint 7 closeout delta vs Run 1+2 |
| `grimoires/loa/a2a/sprint-7/e2e-goal-validation.md` | 285 | 21/21 goal walk |
| `grimoires/loa/a2a/sprint-7/reviewer.md` | (this file) | Sprint 7 implementation report |

### Modified (3 paths)

| Path | Diff scope | Purpose |
|------|------------|---------|
| `package.json` | 1-line (version) | Version bump 0.1.0 → 0.2.0 |
| `BUTTERFREEZONE.md` | +169 lines / -0 (193 → 362) | Post-calibration provenance refresh |
| `grimoires/loa/sprint.md` | ~16-line checkmark update | Sprint 7 deliverable/AC/task checkmarks ☐ → ☒ |

**No source code modifications.** No test modifications. No manifest modifications. No protocol/evidence/security-review modifications. No corpus modifications. No Run 1 / Run 2 modifications. No `.claude/` modifications. Diff strictly within Sprint 7 scope.

---

## Karpathy Discipline Self-Audit

### Think Before Coding ✓
Surfaced architectural reality before writing: Run 3-final must produce identical numerics to Runs 1+2 because the Sprint 3 harness uses uniform-prior baselines that don't consume runtime parameter constants. Verified this prediction (confirmed bit-identical per-event certificates) before authoring honest-framing documentation.

### Simplicity First ✓
- Version bump: single-line edit (3 keystrokes net), not a full file rewrite
- Run-3-final: invoked existing harness with environment variable; no harness modification
- BFZ refresh: extended existing structure with new sections; preserved provenance-comment convention
- E2E validation: walked existing PRD goal table; no new goal categorization

### Surgical Changes ✓
- Modified only files explicitly required by sprint.md AC + handoff §5 file-level expectations
- No "improvements" to adjacent code, comments, or formatting
- Did NOT address Sprint 5 LOW-1 evidence-020 polish (handoff §7 explicitly defers to future cycle)
- Did NOT address Sprint 6 LOW-A1/A2/A3 polish (handoff §7 explicitly defers)
- Did NOT default-change the backtest harness (Sprint 6 LOW-A3 future-cycle architectural amendment)

### Goal-Driven Execution ✓
Each sprint task had a verifiable success criterion BEFORE starting:
- Task 7.1: validator exits 0 — verified
- Task 7.3: corpus_hash + script_hash match Sprint 3 baseline; numerics match Run 1+2 — verified
- Task 7.2: BFZ has post-calibration provenance with honest no-refit framing — verified
- Task 7.4: package.json version field changes from 0.1.0 to 0.2.0; nothing else mutates — verified
- Task 7.5: 21/21 goals validated with file:line evidence; 160 tests pass — verified

---

## Closeout Statement

Sprint 7 closes cycle-001. The CORONA construct enters v0.2.0-ready posture as **L1 tested + calibration-attempted (no parameter refits) + Sprint 6 hardened**. Final validator green, three calibration runs committed with hash invariants preserved across all three, BUTTERFREEZONE refreshed with honest provenance, all 21 PRD goals validated end-to-end, 160 tests pass.

Per the operator's stop condition (handoff §11), Sprint 7 implementation is complete and HALTED for review. The next operator actions are:

1. `/review-sprint sprint-7` — senior lead review
2. `/audit-sprint sprint-7` — security audit
3. Operator commit decision (do NOT auto-commit per stop condition)
4. Operator tag/release decision (separate gate; do NOT auto-tag per handoff §11)
5. Operator decision on cycle-001 archival vs cycle-002 kickoff

**This implementation honestly represents what cycle-001 achieved**: a deployable + calibration-attempted construct with documented provenance, security review, and known limitations — NOT an empirically-improved calibration. Per operator hard constraint #14 ("Do not overclaim accuracy or empirical improvement"), v0.2.0 ships as the construct-and-calibration-attempted artifact the cycle was designed to deliver.

---

*Sprint 7 implementation report authored cycle-001 Sprint 7 close, after all 5 owner tasks closed (corona-32r, corona-8v2, corona-1p5, corona-w1v, corona-2k3) + epic corona-1ml closed. Implementation HALTED per stop condition pending /review-sprint sprint-7 and /audit-sprint sprint-7.*
