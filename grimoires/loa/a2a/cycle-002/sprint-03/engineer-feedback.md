# Sprint 03 Senior Lead Review — Cycle-002 Runtime-Replay Entrypoint + Additive Manifest

**Verdict**: **APPROVED WITH NON-BLOCKING CONCERNS**.
**Reviewed**: 2026-05-02
**Routing**: cycle-002 SPRINT-LEDGER (operator ratification: no separate `ENTRYPOINT-MANIFEST.md`; PRD/SDD/sprint-plan/ledger + Sprint 00–02 artifacts are the binding spec set).
**Reviewer report**: [grimoires/loa/a2a/cycle-002/sprint-03/reviewer.md](reviewer.md)

Sprint 03 may proceed to `/audit-sprint sprint-03` once the two doc-correctness fixes below are applied (or explicitly accepted as deferred). The implementation itself is sound; concerns are scoped to user-facing documentation strings in one rendered output file.

---

## Operator priority verification (eight-point checklist)

| # | Priority | Status | Evidence |
|---|----------|--------|----------|
| 1 | Phase 0 doc-routing cleanup minimal + correct | ✓ PASS | `git diff` summary shows 4 modified docs, +191 / −11 lines total. Each replacement uses the operator-ratification text verbatim. No technical scope drift. `grep -n ENTRYPOINT-MANIFEST grimoires/loa/a2a/cycle-002/` returns only ratification text references. |
| 2 | Cycle-001 lane frozen | ✓ PASS | `scripts/corona-backtest.js` not in `git diff --name-only HEAD`. sha256 = `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (matches anchor). `calibration-manifest.json` sha256 = `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` (matches anchor). `src/` not in any diff. `run-1`/`run-2`/`run-3-final` not in any diff. |
| 3 | Cycle-002 entrypoint architecture | ✓ PASS | New file at [scripts/corona-backtest-cycle-002.js](../../../../../scripts/corona-backtest-cycle-002.js) owns dispatch. Cycle-001 entrypoint not edited (sha256 anchor confirms). [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../../scripts/corona-backtest/ingestors/corpus-loader.js) diff is `@@ -431,6 +431,187 @@` — 187 lines added, 0 deletions (purely additive). Existing `loadCorpus` byte-stable above the new section; existing `_validateT*` re-exports preserved (line 619 still exports `validateT1 as _validateT1`). |
| 4 | Theatre scoring boundaries | ✓ PASS | T1/T2 dispatch through `replay_T{1,2}_event` → `binary_scalar` trajectory → `scoreCorpusT{1,2}Binary` ([entrypoint:200-203](../../../../../scripts/corona-backtest-cycle-002.js)). T4 dispatch through `replay_T4_event` → `bucket_array_5` trajectory → `scoreCorpusT4PerEventDispatch` calling `scoreEventT4` per event ([entrypoint:140-164](../../../../../scripts/corona-backtest-cycle-002.js)). T3/T5 use unchanged `scoreCorpusT3` / `scoreCorpusT5`. T3/T5 excluded from `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']`. No T1/T2 bucket projection (rejected by `binary_scalar` shape assertion in `scoreEventT{1,2}Binary`). |
| 5 | Reporting | ✓ PASS | `runtime-uplift-summary.md` (read in full) shows three theatre rows: T1 `[runtime-binary]`, T2 `[runtime-binary]`, T4 `[runtime-bucket]`. `## Composite scope` says "T1 + T2 + T4 ONLY". `diagnostic-summary.md` shows all five rows + theatre-posture table; every `## ...` section header carries `[diagnostic]`; column captions tagged `[diagnostic]`; all five posture tags appear verbatim. Concerns C1 + C2 below are documentation-correctness issues in this rendered output; they do not affect tagging discipline. |
| 6 | Manifest / provenance | ✓ PASS (with concerns C1+C2 below) | [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json](../../../../calibration/corona/cycle-002/runtime-replay-manifest.json) is a separate file from the cycle-001 manifest. `cycle: "cycle-002"`, `additive: true`, `predecessor_manifest.cycle: "cycle-001"`, `predecessor_manifest.immutable: true`. `replay_script_hash` and `runtime_replay_hash` both populated to `c2ab41b7d51bb0b2e99a2c031985cbc190608d6fde7d52bf8608b34b7ee2e8fe`. File set covers 12 files (operator-required 9 + Sprint 03 helpers 3 = `runtime-uplift-summary.js`, `diagnostic-summary.js`, `runtime-replay-manifest.js`). Cycle-001 entrypoint correctly excluded from set. One-byte mutation sensitivity asserted by [tests/cycle-002-entrypoint-test.js:407-441](../../../../../tests/cycle-002-entrypoint-test.js) (mirror-into-tmpdir + targeted byte append). |
| 7 | Tests | ✓ PASS | `npm test` returns 279 pass / 0 fail / 0 skip. Sprint 02 baseline 261 preserved (no cycle-001 test renamed, removed, or skipped). +18 new tests in `tests/cycle-002-entrypoint-test.js`. `package.json dependencies: {}` invariant preserved (only the `scripts.test` line had `tests/cycle-002-entrypoint-test.js` appended). |
| 8 | Honest framing | ✓ PASS | `grep -niE "calibration improved\|empirical performance improvement\|forecasting accuracy\|verifiable track record\|predictive uplift demonstrated\|L2 publish-ready"` against `cycle-002-run-1/*.md`, `cycle-002/*.json`, and the new source files returns 4 matches — all in negation context: `runtime-uplift-summary.md:44` reads "This composite is NOT evidence of 'calibration-improved', 'predictive uplift demonstrated', or 'L2 publish-ready'…", and the source code occurrences (`runtime-uplift-summary.js:26-27, 131`) are the comment-block disclosure + the source line that produces the negation in the rendered output. T1/T2 prior-only disclosure visible in `runtime-uplift-summary.md` (long bullet citing Sprint 02 reviewer.md M2 lines 456–464) and in `diagnostic-summary.md` (Honest-framing notes section). No cross-regime Baseline A vs Baseline B uplift claim found. |

---

## Adversarial Analysis

### Concerns Identified (≥3 required)

#### C1 — Stale test-file reference in diagnostic-summary [NON-BLOCKING; recommend fix before audit]

**Location**: [scripts/corona-backtest/reporting/diagnostic-summary.js:155](../../../../../scripts/corona-backtest/reporting/diagnostic-summary.js) — and the rendered output at [grimoires/loa/calibration/corona/cycle-002-run-1/diagnostic-summary.md:65](../../../../calibration/corona/cycle-002-run-1/diagnostic-summary.md)

**Issue**: The diagnostic summary template emits the line:

> `Cycle-001 'script_hash = sha256(scripts/corona-backtest.js)' is preserved byte-identically (verified by tests/replay-cycle001-byte-freeze-test.js).`

The file `tests/replay-cycle001-byte-freeze-test.js` does NOT exist (`ls tests/replay-cycle001-byte-freeze-test.js` returns no such file). The actual byte-freeze assertion lives in [tests/cycle-002-entrypoint-test.js:74-79](../../../../../tests/cycle-002-entrypoint-test.js) (test name: `byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor`).

**Fix**: In `scripts/corona-backtest/reporting/diagnostic-summary.js:155`, change

```js
'  byte-identically (verified by tests/replay-cycle001-byte-freeze-test.js).',
```

to

```js
'  byte-identically (verified by tests/cycle-002-entrypoint-test.js).',
```

Then re-run `node scripts/corona-backtest-cycle-002.js --output cycle-002-run-1` to regenerate the rendered output. Note: this changes `scripts/corona-backtest/reporting/diagnostic-summary.js`, which is in the `replay_script_hash` file set, so `replay_script_hash` will change too — record the new hex in the report.

**Severity rationale**: A broken file reference in a provenance document undermines the provenance posture. The honest-framing discipline takes documentation accuracy seriously. The fix is a single-line edit; the cost of leaving it is that the auditor (or any future reader) will hunt for a non-existent test. Non-blocking only because the actual byte-freeze invariant IS asserted by the live test in `cycle-002-entrypoint-test.js`; the documentation just points at the wrong file.

#### C2 — Imprecise `manifest_regression_test` reference in diagnostic-summary [NON-BLOCKING; recommend fix before audit]

**Location**: [scripts/corona-backtest/reporting/diagnostic-summary.js:157](../../../../../scripts/corona-backtest/reporting/diagnostic-summary.js) — and [grimoires/loa/calibration/corona/cycle-002-run-1/diagnostic-summary.md:67](../../../../calibration/corona/cycle-002-run-1/diagnostic-summary.md)

**Issue**: The diagnostic summary states:

> `replay_script_hash covers the cycle-002 trajectory-driving file set per SDD §6.2; recomputation is asserted by manifest_regression_test.`

The existing `tests/manifest_regression_test.js` is the **cycle-001** inline-vs-manifest gate (PRD §7 source-of-truth rule). It does NOT assert cycle-002 `replay_script_hash` recomputation. The actual recomputation assertion lives in [tests/cycle-002-entrypoint-test.js:343-352](../../../../../tests/cycle-002-entrypoint-test.js) (test name: `cycle-002 manifest regression: replay_script_hash matches recomputed`), which calls `verifyReplayScriptHash` from [scripts/corona-backtest/manifest/runtime-replay-manifest.js:222-244](../../../../../scripts/corona-backtest/manifest/runtime-replay-manifest.js).

The reviewer.md AC-18 description correctly cites both files, so the engineer's mental model is right; only the rendered template is imprecise.

**Fix**: In `scripts/corona-backtest/reporting/diagnostic-summary.js:157`, change

```js
'  SDD §6.2; recomputation is asserted by manifest_regression_test.',
```

to

```js
'  SDD §6.2; recomputation is asserted by tests/cycle-002-entrypoint-test.js (test "cycle-002 manifest regression: replay_script_hash matches recomputed") via verifyReplayScriptHash().',
```

Re-run the entrypoint to regenerate the rendered output. Same `replay_script_hash` regeneration caveat as C1.

**Severity rationale**: Same as C1 — non-blocking documentation-correctness issue. Leaving it lets the auditor mistakenly believe the cycle-001 manifest regression test was extended (which the original sprint plan §4.1.2 #5 proposed but the implementation chose not to do — for the right reason: keeping the cycle-001 manifest test untouched preserves its frozen-evidence role). The implementer's choice was sound; the doc text just describes it imprecisely.

#### C3 — `code_revision` records pre-Sprint-03 HEAD when run on uncommitted working tree [ADVISORY; non-blocking]

**Location**: All cycle-002 outputs that record `code_revision`:
- [grimoires/loa/calibration/corona/cycle-002-run-1/runtime-uplift-summary.md:9](../../../../calibration/corona/cycle-002-run-1/runtime-uplift-summary.md)
- [grimoires/loa/calibration/corona/cycle-002-run-1/diagnostic-summary.md:9](../../../../calibration/corona/cycle-002-run-1/diagnostic-summary.md)
- [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json:11](../../../../calibration/corona/cycle-002/runtime-replay-manifest.json)
- Source: [scripts/corona-backtest-cycle-002.js:84-90](../../../../../scripts/corona-backtest-cycle-002.js) (`gitRev()` shells out to `git rev-parse HEAD`)

**Issue**: `gitRev()` returns the last committed HEAD (`2bb5f85`). At Sprint 03 implementation time the cycle-002 entrypoint and helpers exist only in the working tree — they are NOT in commit `2bb5f85`. A future reader checking out `2bb5f85` cannot reproduce the run; the `replay_script_hash` would not even compute (the helper file doesn't exist there). The `replay_script_hash` field captures the actual code-under-test bytes, so provenance is recoverable from it; `code_revision` is an additional cross-reference that is currently misleading.

After the operator commits Sprint 03, a re-run will record the correct commit hash, so this is largely a transient issue. But it is worth tightening.

**Mitigation options** (engineer can pick — none are blocking):

- (a) Detect uncommitted changes via `git status --porcelain` and append `+dirty` to the recorded revision. One-line change; matches common dev-tools convention.
- (b) Add a `working_tree_dirty: bool` field to the manifest (cleaner, structured).
- (c) Document the semantics in the report as "code_revision = last committed HEAD; binding code identity is replay_script_hash".

I'd recommend (a) — minimal change, immediately readable.

**Severity rationale**: Provenance hygiene, not a correctness bug. The binding identity is `replay_script_hash`. Marking as advisory because the auditor will see the same hash recorded across multiple files (manifest + run-1 + this feedback file) and can cross-check.

#### C4 — Output-dir guard uses exact-string match; trivial bypass via path prefix [ADVISORY; non-blocking robustness]

**Location**: [scripts/corona-backtest-cycle-002.js:75-76](../../../../../scripts/corona-backtest-cycle-002.js) and [scripts/corona-backtest-cycle-002.js:228-234](../../../../../scripts/corona-backtest-cycle-002.js)

**Issue**: The guard is

```js
const FROZEN_CYCLE001_OUTPUT_DIRS = Object.freeze(new Set(['run-1', 'run-2', 'run-3-final']));
// ...
if (FROZEN_CYCLE001_OUTPUT_DIRS.has(outputName)) { return 4; }
```

This catches `--output run-1` exactly. It does NOT catch `--output ./run-1`, `--output run-1/`, `--output run-1\`, or `--output grimoires/loa/calibration/corona/run-1` (an absolute or rooted-relative variant). All of these would resolve via `resolve(CALIBRATION_DIR, outputName)` to the same forbidden path.

**Mitigation**: Normalize the output name before the guard check. For example:

```js
const normalized = relative(CALIBRATION_DIR, resolve(CALIBRATION_DIR, outputName));
if (FROZEN_CYCLE001_OUTPUT_DIRS.has(normalized)) { return 4; }
```

**Severity rationale**: Defense-in-depth concern. The intent of the guard is "operator typo can't clobber frozen cycle-001 evidence". A determined operator can always write directly to those dirs without using the entrypoint at all (the OS owns the filesystem; the script is an honest-framing checkpoint, not a security boundary). Non-blocking because (a) the cycle-001 dirs would still get caught by the implicit ordering `run-1 < cycle-002-run-1` in any sensible naming convention, and (b) the operator instruction was prescriptive ("create `cycle-002-run-1/`"), so a typo is unlikely. Worth tightening if the entrypoint is ever wrapped by an automation that takes user input.

### Assumption Challenged (≥1 required)

- **Assumption** (engineer made it explicit at AC-19 / [tests/cycle-002-entrypoint-test.js:447-492](../../../../../tests/cycle-002-entrypoint-test.js)): All five cycle-001 T1/T2 corpus events lack pre-cutoff time-series, so `position_history_at_cutoff.length === 1` and all events share the same `current_position_at_cutoff` (the `base_rate` constant).
- **Risk if wrong**: A future corpus contributor (or a corpus-shape evolution in cycle-003) adds time-series fields to a T1/T2 event. The prior-only guards trip; the test fails loudly; the engineer is forced to re-evaluate the prior-only honest-framing claim.
- **Recommendation**: This assumption is **correctly encoded as a fail-loud test**. If a future T1/T2 corpus event genuinely has time-series, the prior-only honest framing IS no longer correct and the framing must be updated. The test is the binding gate. **No change required** — this is an appropriately defensive assumption made explicit. Leave as-is.

### Alternative Not Considered (≥1 required)

- **Alternative**: Factor a shared `scripts/corona-backtest/core.js` library that both `scripts/corona-backtest.js` (cycle-001) and `scripts/corona-backtest-cycle-002.js` (cycle-002) import as a thin shell. This would eliminate the small duplication between `dispatchCycle002Replay` and `main()`, and reduce the cycle-002 entrypoint's surface area.
- **Tradeoff**: Touching the cycle-001 entrypoint to switch its imports — even if the entrypoint file's bytes don't change — would still require a sha256 audit on the cycle-001 invariant `script_hash = 17f6380b…1730f1`. The current `computeScriptHash` only hashes the entrypoint file, so a `core.js` extraction would not change `script_hash`. BUT: the cycle-001 reproducibility lane currently depends on cycle-001's specific import graph (legacy scoring modules unchanged). Adding a new import from cycle-001 → core.js increases the surface area that needs to stay byte-stable for cycle-001 reproducibility purposes, even though the cycle-001 hash mechanism wouldn't detect drift in core.js.
- **Verdict**: **Current approach is justified**. The two-entrypoint architecture preserves I1 by construction — cycle-001 imports nothing new. The minor duplication (~30 lines) between `dispatchCycle002Replay` (no try/catch, used for in-process tests) and `main()` (per-theatre try/catch returning exit code 3) reflects the legitimate difference in error handling between an importable helper and a CLI entrypoint. Inlining the duplication does not justify the increased coupling. No change required.

---

## Strengths worth preserving

| # | Strength | Why it matters |
|---|----------|----------------|
| 1 | Loader diff is purely additive (0 deletions, 187 insertions). | Sprint 02 audit finding §A1 (evidence-leakage by author convention → loader-enforced split) is structurally addressed without risking regression in the 261-test cycle-001 baseline. |
| 2 | `replay_script_hash` file set explicitly excludes `scripts/corona-backtest.js`. | Each hash owned by exactly one entrypoint per SDD §6.3 — clean separation of cycle-001 and cycle-002 provenance lanes. |
| 3 | `computeReplayScriptHash` throws on missing file rather than silently producing a hash over a smaller set. | Future contributor cannot accidentally drop a covered file from the file system without provenance detection — fail-loud is correct. |
| 4 | T1/T2 prior-only guards are encoded as tests, not just as prose. | Pins the honest-framing disclosure into the test suite; future corpus shape changes will trip the gate and force a posture re-evaluation. |
| 5 | Two-summary discipline asserted both at constant level (`RUNTIME_UPLIFT_THEATRES` vs `DIAGNOSTIC_THEATRES`) and at content level (regex assertions for posture tags + `[diagnostic]` headers). | Defense-in-depth against accidental tag-discipline drift in future sprints. |
| 6 | Posture tags appear verbatim in both rendered outputs and are asserted by tests. | Operator instruction satisfied at three layers (constants, rendered output, test gate). |
| 7 | Output-dir guard exists at all (concern C4 is about hardening the existing guard, not adding one). | Defense-in-depth against operator-typo overwrites of cycle-001 frozen evidence. |
| 8 | `cycle_001_script_hash_note` field in the manifest is a binding doc-string, not just a code comment. | The provenance lane explanation travels with the data, not just with the source. Auditor can read the manifest standalone and understand why both hashes coexist. |

---

## Karpathy Principles Verification

| Principle | Status | Note |
|-----------|--------|------|
| Think Before Coding | ✓ | Reviewer.md AC verification walks all 22 ACs verbatim with file:line evidence; assumptions made explicit (e.g., the prior-only guard). |
| Simplicity First | ✓ | No speculative features. The 3 new helper modules each have a single clear purpose. The entrypoint is ~310 lines including imports/comments — comparable to the cycle-001 entrypoint at ~225 lines. |
| Surgical Changes | ✓ | Phase 0 doc patches: minimal, only the ENTRYPOINT-MANIFEST.md routing was retired. Loader diff: purely additive. No drive-by reformats. |
| Goal-Driven | ✓ | Tests verify the actual operator-stated requirements (byte-freeze, dispatch routing, posture tags, file-set composition, hash sensitivity, prior-only guards). |

---

## Documentation Verification

CHANGELOG entry: not required for cycle-002 sprints per the cycle-002 CHARTER §2.3 (release hygiene gated on Sprint 06 + Rung 4). PASS by exception.

CLAUDE.md update: not required (no new global command/skill added; the entrypoint is a `node scripts/...` invocation).

Code comments: adequate. The new modules carry source-attribution headers citing PRD/SDD/CHARTER sections. The honest-framing rationale appears both in code and in rendered output.

---

## Items the engineer SHOULD address before `/audit-sprint sprint-03`

1. **C1**: Fix the stale `tests/replay-cycle001-byte-freeze-test.js` reference in `scripts/corona-backtest/reporting/diagnostic-summary.js:155`. Re-run the entrypoint to regenerate `cycle-002-run-1/diagnostic-summary.md`. Record the new `replay_script_hash` (the change to diagnostic-summary.js will alter the hash since that file is in the covered set).
2. **C2**: Replace the `manifest_regression_test` reference in `scripts/corona-backtest/reporting/diagnostic-summary.js:157` with the precise pointer to `tests/cycle-002-entrypoint-test.js`. Same regeneration + hash refresh as C1.

Both fixes are <5 minutes. After applying, please re-run `npm test` to confirm 279/279 still passes (it should — neither fix affects test logic), and update `reviewer.md` with the new `replay_script_hash` value.

C3 (advisory) and C4 (advisory) are accepted as deferrable. They do not block the audit gate. If the engineer chooses to address C3 in this sprint, mention it in the updated `reviewer.md` so the auditor sees the rationale.

---

## Sprint progression decision

- **Verdict**: APPROVED WITH NON-BLOCKING CONCERNS.
- **May proceed to `/audit-sprint sprint-03`?** YES, subject to engineer addressing C1 + C2 (or explicitly declaring them deferred in `reviewer.md`).
- **Do NOT commit.** Per operator instruction.
- **Do NOT start Sprint 04.** Per operator instruction.
- **Cycle-001 byte-freeze invariants intact.** Verified independently of the engineer's report:
  - `sha256(scripts/corona-backtest.js)` = `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (matches anchor).
  - `sha256(grimoires/loa/calibration/corona/calibration-manifest.json)` = `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` (matches anchor).
  - `corpus_hash` = `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` (computed via `computeCorpusHash` in tests).
  - `src/`, cycle-001 sprint folders, cycle-001 run outputs all unchanged in `git diff`.
- **Honest-framing grep gate clean.** Four matches across new artifacts, all in negation context (the runtime-uplift summary explicitly disclaims the forbidden phrases).

Sprint 03 implementation is sound and meets every operator priority. Concerns C1 + C2 are scoped to one rendered output file's text; the underlying invariants they describe are correctly enforced elsewhere. After the two text fixes land, this sprint is audit-ready.

---

*Review authored 2026-05-02 against operator-ratified cycle-002 spec set. Cycle-001 byte-freeze and manifest immutability independently verified, not just trusted from the implementer's report. Adversarial protocol applied: 4 concerns (2 non-blocking fix-recommended + 2 advisory), 1 assumption challenged (correctly encoded as fail-loud test), 1 alternative considered and explicitly justified against. No blocking issues found.*
