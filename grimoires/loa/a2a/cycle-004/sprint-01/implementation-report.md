# CORONA Cycle-004 — Sprint 01 Implementation Report

> **Sprint:** 01 — Baseline Fixture + Proof-Harness Skeleton
> **Spec:** [CYCLE-004-SPRINT-PLAN.md](../CYCLE-004-SPRINT-PLAN.md) §4 · [SDD.md](../SDD.md) §9 · [PRD.md](../PRD.md) §6
> **Phase:** `/implement sprint-01` output. **Next:** `/review-sprint sprint-01`.
> **Status:** implementation complete; awaiting review. **No commit. No push. No self-review/audit.**

---

## 0. Allowed posture (verbatim — SDD §15, carried into this report)

> "Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."

**Sprint 01 scope note (binding):** Sprint 01 does **not** wire T2. It only (1) stands up the no-scoring proof-harness skeleton, (2) captures the immutable pre-change baseline trajectory hashes from the **unmodified** replay, and (3) documents the baseline provenance. The historical claim ceiling stands unweakened: **CORONA demonstrated T4 runtime sensitivity only.** Cycle-004 banks **no new rung**.

---

## 1. Executive Summary

Sprint 01 delivered the two Sprint-01 artifacts and the harness skeleton, with the load-bearing baseline captured **before any source wiring edit** (OD-4):

1. **Proof-harness skeleton** — `scripts/corona-backtest-cycle-004-evidence-wiring.js` (new, no scoring). Loads the cycle-003 corpus via the existing `loadCorpusWithCutoff`, dispatches T1 through the **unmodified** `replay_T1_event` and T2 through the **unmodified** `replay_T2_event` (no `wireEvidence` option exists or is passed), and emits per-event 64-hex SHA-256 trajectory hashes as deterministic JSON.
2. **Baseline fixture** — `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` captured from the unmodified pre-cycle-004 replay; **byte-identical on rerun**.

No source/runtime/loader/replay/gate/test/`package.json` file was edited. No scoring, Brier, skill metric, or baseline delta exists anywhere in the new code. Frozen invariants intact (I1 hash exact; `package.json` `0.2.0`/`{}`; cycle-003 corpus untouched). Existing suite green (296/296). No hard stop encountered.

---

## 2. Branch & Base

| Field | Value |
|-------|-------|
| Sprint branch | `cycle-004-s01-baseline-harness` |
| Created from | `cycle-004` @ `2720b530b73333515f56805df88320daaa70ea4d` ("docs(corona): preserve cycle-004 draft planning substrate") |
| Cycle base | `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6` (parent of `2720b53`; `main` tip) |
| HEAD at report time | `2720b530b73333515f56805df88320daaa70ea4d` (no commit made this sprint) |

**Branch-creation note (operator visibility):** `/implement` started in the **primary checkout on `main`** (`ccd6eea`); `cycle-004` was checked out in a separate worktree (`.claude/worktrees/nice-jackson-df0b4b`, clean). The task's literal command `git switch -c cycle-004-s01-baseline-harness` (from the current branch) would have branched from `main` and **missed** the cycle-004 planning commit `2720b53`. Per the task's explicit intent ("Create it from the current `cycle-004` branch"), the branch was created with `git switch -c cycle-004-s01-baseline-harness cycle-004` — branching from the correct base. `main` and `cycle-004` refs were **not** moved; no merge, no commit, no push.

---

## 3. Files Created / Changed

**Created (the only two authorized Sprint-01 write paths exercised):**

| Path | Kind | Notes |
|------|------|-------|
| `scripts/corona-backtest-cycle-004-evidence-wiring.js` | new source (no scoring) | proof-harness skeleton; T1/T2 baseline hash emitter |
| `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` | new fixture | immutable pre-change baseline (60 events) |
| `grimoires/loa/a2a/cycle-004/sprint-01/implementation-report.md` | new report | this document |

**Changed (tracked files): none.** `git diff --name-only` is empty.

```
$ git status --short
?? grimoires/loa/a2a/cycle-004/proof/         # baseline-hashes.json
?? grimoires/loa/a2a/cycle-004/sprint-01/     # this report
?? scripts/corona-backtest-cycle-004-evidence-wiring.js
```

**`npm test` side-effect disclosure (honest framing — important for the reviewer):** running `npm test` (a required Sprint-01 validation step) mutated **three tracked cycle-002 frozen artifacts** as a pre-existing side effect of the cycle-002 entrypoint/sensitivity test, **not** of this sprint's new code:

- `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`
- `grimoires/loa/calibration/corona/cycle-002-run-2/sensitivity-summary.md`
- `grimoires/loa/calibration/corona/cycle-002-run-3/sensitivity-summary.md`

The only change in each is the `code_revision` provenance field (`d93cada9…` → the current HEAD `2720b530…`); every hash (`corpus_hash`, `cycle_001_script_hash`, `replay_script_hash…`) is unchanged. Because these are frozen artifacts this sprint must not modify, they were restored to their committed state with `git restore <paths>` immediately after the test run. The new harness writes only to stdout (and, when `--out-file` is used, refuses frozen dirs) — it does **not** write into the cycle-002 tree. Reviewers re-running `npm test` will observe the same churn and should likewise `git restore` those three files; it is not a frozen-invariant violation introduced by Sprint 01.

---

## 4. Baseline Capture — exact commands & result (T1.2, LOAD-BEARING)

**Exact capture command (the load-bearing step — run BEFORE any cycle-004 source edit):**

```bash
node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes \
  > grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json
```

**Exact reproducibility cross-check:**

```bash
node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes > /tmp/cycle004-baseline-rerun.json
diff grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json /tmp/cycle004-baseline-rerun.json
```

**Result: byte-identical — `diff` produced no output (run-twice byte-identical).**

**Baseline fixture provenance:**

| Field | Value |
|-------|-------|
| File | `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` |
| File sha256 | `538cba01002924cd720f2719fbbdd700e3ad675b4a2a0808f0fca8974286d491` |
| Size | 10719 bytes, 318 lines |
| `event_count` | 60 (30 T1 + 30 T2) |
| `state` / `wire_evidence` | `baseline` / `false` |
| `corpus_dir` (recorded, repo-relative) | `grimoires/loa/calibration/corona/corpus-cycle-003` |
| `runtime_revision` | `cycle-004-s01-baseline` |
| `trajectory_hash_algorithm` | `sha256-of-canonical-json` |

The file is machine-independent (repo-relative corpus path, no wall-clock, no git rev, events sorted by `(theatre, event_id)`), so the file sha256 is itself a stable fixture identity. Sample anchors: first `T1-2020-05-29-M1p2` → `f201321357f967c96df73ddffbab0e484103680ddf99a9a20c07e7f1a761c512`; last `T2-2026-03-22-Kp7` → `4bf6583abc5224d825097daa42df97d60d11952208033714718e44e867e6cc26`.

---

## 5. Harness Behavior Summary

`scripts/corona-backtest-cycle-004-evidence-wiring.js`:

- **Inputs:** `--emit-hashes` (canonical flag for the emit action; also the default action), `--corpus <dir>` (default = cycle-003 corpus tree), `--theatres T1,T2` (default + only supported), `--out-file <path>` (forward-looking; guarded — see below), `--help`/`-h`.
- **Load:** `loadCorpusWithCutoff(corpusDir, { theatres: ['T1','T2'] })` — the existing cycle-002 loader, unmodified.
- **Dispatch:** for each event, `createReplayContext(...)` then `replayFn(event, ctx)` where `replayFn ∈ { replay_T1_event, replay_T2_event }` — **exactly** the cycle-002 entrypoint's call shape. **No options bag; `wireEvidence` is never passed and does not appear as a runtime token.**
- **Output:** deterministic JSON to **stdout** — a metadata block plus an `events[]` array of `{ theatre, event_id, trajectory_hash }` sorted by `(theatre, event_id)`. Each `trajectory_hash` is asserted to be 64-hex `^[0-9a-f]{64}$`.
- **No-scoring guarantee:** imports only `config.js`, `corpus-loader.js`, `context.js`, `t1-replay.js`, `t2-replay.js` (+ `node:` builtins). It imports **no** scoring module and does **not** import or invoke `scripts/corona-backtest.js` (cycle-001 entrypoint, I1). There is no Brier / skill / baseline-delta / held-out / cross-regime code path.
- **Frozen-output-dir guard (reuse + extend of `corona-backtest-cycle-002.js`):** `FROZEN_OUTPUT_DIRS` = cycle-001 `{run-1, run-2, run-3-final}` ∪ cycle-002 `{cycle-002-run-1, cycle-002-run-2, cycle-002-run-3}`. If `--out-file` ever targets a path inside one of these frozen dirs, the harness refuses with **exit 4** and writes nothing. Verified: `--out-file …/run-1/x.json` → exit 4 (no write); `--out-file …/cycle-002-run-1/x.json` → exit 4 (no write). Sprint 01 itself uses **stdout redirection** into `proof/` and never passes `--out-file`.
- **Determinism:** no `Date.now(` / `Math.random(` in the file (grep-clean, I6); output carries no wall-clock/git-rev and only a repo-relative corpus path.
- **Exit codes:** `0` success · `2` usage error (unknown flag / unsupported theatre) · `3` corpus-load/replay failure · `4` refused frozen output dir.

**Forward-looking (NOT implemented in Sprint 01):** the `wireEvidence` opt-in consumption path (Sprint 02) and the three-state WIRED/ABLATED/BASELINE emission (Sprint 03). Sprint 01 emits the BASELINE only.

---

## 6. No-Scoring / No-Wiring Confirmations

- **No scoring / Brier / skill metric / baseline-delta / held-out / cross-regime** anywhere in the new harness. (The words "Brier", "scoring", "baseline delta", etc. appear in the file only inside documentation comments as **negations** of what the harness does.)
- **No source wiring occurred.** T2 was not wired; `deriveEvidenceT2` was not edited; `replay_T2_event` was not edited; the harness calls the *current, unmodified* `replay_T2_event`.
- **No T1 wiring / no flux→`solar_flare` mapping / no T1 edit.** T1 remains the negative control.
- **No T4 touch / no external fetch / no internet.**

---

## 7. Forbidden-Path Audit

Every globally-forbidden write surface (SPRINT-PLAN §2 / SDD §14) was checked. `git diff --name-only` is **empty** and `git status --short` shows **only** the two new authorized cycle-004 paths, so none of the following was edited:

| Forbidden path | Status |
|----------------|--------|
| `scripts/corona-backtest/ingestors/corpus-loader.js` (incl. `deriveEvidenceT1`, `deriveEvidenceT2`) | NOT edited |
| `scripts/corona-backtest/replay/t1-replay.js` (incl. `deriveEvidenceT1` consumer) | NOT edited |
| `scripts/corona-backtest/replay/t2-replay.js` (`replay_T2_event`) | NOT edited |
| `src/theatres/flare-gate.js`, `src/theatres/geomag-gate.js`, any `src/theatres/*` | NOT edited |
| `src/rlmf/certificates.js` | NOT edited |
| `scripts/corona-backtest.js` (cycle-001 entrypoint, I1) | NOT edited / NOT imported |
| `scripts/corona-backtest-cycle-002.js` (cycle-002 entrypoint) | NOT edited (read-only model) |
| `package.json` | NOT edited |
| `README.md`, `BUTTERFREEZONE.md` | NOT edited |
| `grimoires/loa/{prd,sdd,sprint}.md`, `grimoires/loa/ledger.json` | NOT edited |
| any cycle-001 / cycle-002 / cycle-003 corpus record or manifest | NOT edited |
| cycle-003 held-out seal `f7a851…a5ea` | NOT edited / NOT read for fitting |
| `.beads/` | NOT touched |

No runtime parameter / threshold / `base_rate` / σ / λ / formula was changed (no `src/theatres/*` edit; the harness only *calls* replay, which *creates* gates — it changes no constant).

---

## 8. Frozen-Invariant Checks

| ID | Invariant | Expected | Observed | Status |
|----|-----------|----------|----------|--------|
| I1 | `scripts/corona-backtest.js` sha256 (`git cat-file -p HEAD:… \| sha256sum`) | `17f6380b…1730f1` | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` | ✓ |
| — | `package.json` version | `0.2.0` | `0.2.0` | ✓ |
| I7 | `package.json` dependencies | `{}` | `{}` | ✓ |
| — | cycle-003 corpus_hash | `7b6c5b48…d5003` | corpus files unmodified (no `corpus-cycle-003/` change in `git status`/`git diff`) | ✓ preserved |
| I6 | no `Date.now(` / `Math.random(` in new replay/harness path | none | grep-clean in the new harness | ✓ |
| I5 | existing suite replay-twice determinism | green | `npm test` 296/296 pass | ✓ |

---

## 9. Validation Command Results

```
# Baseline capture (load-bearing; run before any source edit)
$ node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes \
    > grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json     # exit 0

# Reproducibility
$ node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes > /tmp/cycle004-baseline-rerun.json   # exit 0
$ diff grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json /tmp/cycle004-baseline-rerun.json                 # no output (byte-identical)

# Frozen invariants
$ git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum
  17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
$ node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"
  0.2.0 {}

# Existing suite (green) — NOTE: mutates 3 tracked cycle-002 frozen artifacts'
# code_revision provenance as a pre-existing side effect; restored afterward.
$ npm test
  ℹ tests 296 · pass 296 · fail 0
$ git restore grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json \
              grimoires/loa/calibration/corona/cycle-002-run-2/sensitivity-summary.md \
              grimoires/loa/calibration/corona/cycle-002-run-3/sensitivity-summary.md

# Working tree (final)
$ git diff --name-only      # (empty)
$ git status --short
  ?? grimoires/loa/a2a/cycle-004/proof/
  ?? grimoires/loa/a2a/cycle-004/sprint-01/
  ?? scripts/corona-backtest-cycle-004-evidence-wiring.js
```

---

## 10. Claim-Grep (honest-framing gate)

Forbidden positive-claim patterns (SDD §15 / SPRINT-PLAN §9) were grepped over the cycle-004 artifacts and this report:

`calibration improved` · `forecasting accuracy` · `predictive uplift` · `empirical performance improvement` · `L2 publish-ready` · `T1/T2 runtime-sensitive` · `T1/T2 calibration-improved` · `new rung earned` · `Baseline A vs Baseline B uplift` · `new-corpus baseline uplift`.

**Result:** every occurrence is a **negation / definition / historical-ceiling statement** (e.g., "No calibration … claim is made", "banks **no new rung**", "CORONA demonstrated T4 runtime sensitivity only"). No forbidden phrase appears as a positive claim. (Authoritative grep output included in the operator hand-off summary.)

---

## 11. AC Verification (Sprint 01 — SPRINT-PLAN §4.7)

| Acceptance criterion (verbatim) | Status | Evidence |
|----|----|----|
| "Baseline fixture `proof/baseline-hashes.json` exists." | ✓ Met | `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` (sha256 `538cba01…86d491`, 60 events) |
| "Baseline fixture was captured **before** any source wiring edit (verifiable: no edit to `corpus-loader.js`/`t2-replay.js`/`t1-replay.js`/`src/theatres/*` in this sprint's diff)." | ✓ Met | `git diff --name-only` empty; `git status` shows only the 2 new cycle-004 paths (§3, §7) |
| "Baseline capture is **reproducible** (run-twice byte-identical)." | ✓ Met | `diff` produced no output (§4) |
| "No scoring / Brier / baseline comparison performed." | ✓ Met | no scoring module imported; no Brier/baseline-delta code (§5, §6) |
| "No T1 mapping; no T1 edit." | ✓ Met | `t1-replay.js`/`deriveEvidenceT1` unedited; T1 dispatched via unmodified `replay_T1_event` (§7) |
| "No `package.json` edit." | ✓ Met | `0.2.0`/`{}`; `git diff` empty (§8) |
| "No claim drift (claim-grep clean)." | ✓ Met | §10 — forbidden patterns appear only as negations/ceiling |
| "Frozen invariants still pass (I1 hash; cycle-003 hash; `package.json` `0.2.0`/`{}`)." | ✓ Met | §8 |

All Sprint-01 acceptance criteria **Met**. No criterion is `✗ Not met` / `⚠ Partial` / deferred.

---

## 12. Hard-Stop Status

**No hard stop encountered.** None of HS-1 (baseline non-determinism), HS-8 (frozen-artifact touch), or HS-10 (scoring/Brier/baseline-delta in skeleton) — or any SDD §14 / PRD §9 hard stop — fired. Baseline captured deterministically; no scoring entered the skeleton; **the new harness wrote no forbidden artifact**. The only transient frozen-artifact touch was the `npm test` `code_revision` provenance side-effect on three cycle-002 files (§3), which is a pre-existing test-harness behavior unrelated to the new code and was restored to the committed state with `git restore` — so HS-8 did not fire on Sprint 01's implementation.

**Operator decisions needed:** none for Sprint 01. Two items reported for visibility, neither requiring a decision: (a) the branch-creation deviation-from-literal-command (§2); (b) the `npm test` cycle-002 provenance side-effect + restore (§3).

---

## 13. Next Required Command

```
/review-sprint sprint-01
```

No commit, no push, no self-review, no audit performed (per Sprint-01 stop condition). Awaiting `/review-sprint sprint-01`.
