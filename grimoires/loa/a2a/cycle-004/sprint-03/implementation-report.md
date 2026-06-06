# CORONA Cycle-004 Sprint 03 — Implementation Report

> **Allowed posture (verbatim, SDD §15):** *"Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."*

## 0. Identity

| Field | Value |
|-------|-------|
| Sprint | cycle-004 Sprint 03 (proof closeout) |
| Branch | `cycle-004-s03-proof-closeout` |
| HEAD | `2c83bc66a3aab9d9afe16323a4ac13dae03ac4e2` (no commit made this sprint) |
| Base | `cycle-004` @ `2c83bc66a3aab9d9afe16323a4ac13dae03ac4e2` (= Sprint 02 integration commit) |
| main / origin/main | `ccd6eea9…` — untouched |
| Worktree note | `cycle-004` is checked out in `.claude/worktrees/nice-jackson-df0b4b`; the sprint branch was created from the `cycle-004` **ref** (`git switch -c … cycle-004`) without disturbing that worktree. |

## 1. Executive summary

Sprint 03 completes the cycle-004 **deterministic T2 evidence-consumption wiring
proof** and its honest closeout. The Sprint 01 harness was extended to emit three
proof states (WIRED / ABLATED / BASELINE) via a `--state` selector; eight additive
tests prove the wiring is real, deterministic, reversible, and side-effect-free;
and a proof summary + closeout document the result with no rung banked and no
scoring. T1 remains honestly blocked and is exercised as a negative control.

## 2. Files changed / created

**Modified (1):**
- `scripts/corona-backtest-cycle-004-evidence-wiring.js` — added `--state
  wired|ablated|baseline`; per-state T2 dispatch (`replayForState`); generalized
  `dispatchHashes` / `buildHashTable` (Sprint 01 `dispatchBaselineHashes` /
  `buildBaselineHashTable` retained as backward-compatible wrappers; baseline
  output byte-identical). No scoring.

**Created — proof artifacts (3):**
- `grimoires/loa/a2a/cycle-004/proof/wired-hashes.json`
- `grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json`
- `grimoires/loa/a2a/cycle-004/proof/PROOF-SUMMARY.md`

**Created — tests (8):**
- `tests/replay-t2-determinism-wired-test.js` (T3.2)
- `tests/replay-t2-wired-vs-ablated-test.js` (T3.3)
- `tests/replay-t2-ablated-equals-baseline-test.js` (T3.4)
- `tests/cycle-002-frozen-corpus-regression-test.js` (T3.5)
- `tests/no-walltime-no-random-test.js` (T3.6)
- `tests/no-param-diff-test.js` (T3.6)
- `tests/replay-t1-negative-control-test.js` (T3.6a)
- `tests/claim-grep-gate-test.js` (T3.7)

**Created — process artifacts (2):**
- `grimoires/loa/a2a/cycle-004/sprint-03/implementation-report.md` (this file)
- `grimoires/loa/a2a/cycle-004/sprint-03/CLOSEOUT.md`

## 3. Implementation summary

**Harness (`--state`).** `runtime_revision` is part of the hashed trajectory
(`meta.runtime_revision`), so all three states share the single frozen constant
`cycle-004-s01-baseline`; otherwise the T1 negative control and ablated==baseline
identity would break. Per-state T2 dispatch:

| State | T2 call | T1 call |
|-------|---------|---------|
| baseline | `replay_T2_event(event, ctx)` | `replay_T1_event(event, ctx)` |
| ablated | `replay_T2_event(event, ctx, { wireEvidence: false })` | `replay_T1_event(event, ctx)` |
| wired | `replay_T2_event(event, ctx, { wireEvidence: true })` | `replay_T1_event(event, ctx)` |

`wireEvidence` is passed only to `replay_T2_event`, never to `replay_T1_event`
(negative control). Output is deterministic, sorted by `(theatre, event_id)`,
per-event hash tables only — no scoring, no Brier, no skill, no baseline delta.

`--state baseline` (and the default `--emit-hashes`) reproduce the committed
Sprint 01 baseline fixture **byte-for-byte** (verified below), so the Sprint 01
deliverable is unchanged.

## 4. Validation — exact commands and outputs

### 4.1 Generate the three states
```bash
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state wired   > grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state ablated > grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json
```
Both files are pure LF (CR-byte count 0, via `tr -cd '\r' | wc -c`). 60 events each.

### 4.2 Baseline reproduction (byte-identity)
```bash
diff <(git cat-file -p HEAD:…/baseline-hashes.json) <(node …evidence-wiring.js --emit-hashes)   # no diff
diff <(git cat-file -p HEAD:…/baseline-hashes.json) <(node …evidence-wiring.js --state baseline) # no diff
```
→ **BYTE-IDENTICAL** (both). Invalid `--state bogus` → exit 2.

### 4.3 ablated == baseline (§6.10 robust) — comparison method
Authoritative gate: `tests/replay-t2-ablated-equals-baseline-test.js`.
**§6.10 method 2** (committed LF blob via `git cat-file -p HEAD:…`) **+ method 1**
(`JSON.parse` both sides, compare canonical objects). Result: **60/60 equal**
(T1 30/30, T2 30/30). No raw working-tree byte `diff` is used as the gate.

### 4.4 Sprint 03 suite
```bash
node --test tests/replay-t2-determinism-wired-test.js tests/replay-t2-wired-vs-ablated-test.js \
  tests/replay-t2-ablated-equals-baseline-test.js tests/replay-t1-negative-control-test.js \
  tests/cycle-002-frozen-corpus-regression-test.js tests/no-walltime-no-random-test.js \
  tests/no-param-diff-test.js tests/claim-grep-gate-test.js
```
→ `tests 18 | pass 18 | fail 0`. Key reported facts:
- T3.3: T2 events 30; with ≥1 strictly-pre-cutoff obs 30; **wired ≠ ablated 30/30** (full list in PROOF-SUMMARY §4).
- T3.7: swept 24 files; **0** forbidden-positive-claim violations.

### 4.5 Sprint 02 suite (re-run)
```bash
node --test tests/corpus-loader-t2-precutoff-test.js tests/corpus-loader-t2-gfz-lag-test.js \
  tests/replay-t2-genuine-consumption-test.js tests/layer-ab-agreement-test.js
```
→ `tests 19 | pass 19 | fail 0`.

### 4.6 Existing suite
```bash
npm test
```
→ `tests 296 | pass 296 | fail 0`.

### 4.7 Frozen invariants
```bash
git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum
# 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1  (I1 ✓)
node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"
# 0.2.0 {}  (✓)
git cat-file -p HEAD:grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json | sha256sum
# 538cba01002924cd720f2719fbbdd700e3ad675b4a2a0808f0fca8974286d491  (baseline fixture unchanged ✓)
git cat-file -p HEAD:grimoires/loa/a2a/cycle-003/sprint-06/CLOSEOUT.md | grep 7b6c5b48
# 7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003  (cycle-003 corpus_hash unchanged ✓)
```

## 5. npm test side-effect handling

`npm test` updated provenance fields in **5** cycle-002 files:
`cycle-002-run-2/replay_script_hash.txt`, `cycle-002-run-2/sensitivity-summary.md`,
`cycle-002-run-3/replay_script_hash.txt`, `cycle-002-run-3/sensitivity-summary.md`,
`cycle-002/runtime-replay-manifest.json`. Full diff was **provenance-only**:
`replay_script_hash` `a919ec7d…` → `8bf4de7e…` (because `t2-replay.js` was edited in
Sprint 02) and `code_revision` `d93cada9…` → `2c83bc66…` (current HEAD). **No score,
sensitivity value, bucket, or corpus_hash changed.** All 5 files restored via
`git restore`; post-restore `git status` shows no cycle-002 calibration dirt.

## 6. Forbidden-path audit

`git status --short` after restore:
```
 M scripts/corona-backtest-cycle-004-evidence-wiring.js
?? grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json
?? grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
?? grimoires/loa/a2a/cycle-004/proof/PROOF-SUMMARY.md
?? grimoires/loa/a2a/cycle-004/sprint-03/   (implementation-report.md, CLOSEOUT.md)
?? tests/  (8 Sprint 03 test files)
```
Only authorized Sprint 03 paths. **No** edit to: `corpus-loader.js`, `t2-replay.js`,
`t1-replay.js`, `deriveEvidenceT1`, any `src/theatres/*`, `src/rlmf/certificates.js`,
`scripts/corona-backtest.js`, `scripts/corona-backtest-cycle-002.js`,
`package.json`, `.gitattributes`, README, BUTTERFREEZONE, root grimoire docs, any
cycle-001/002/003 corpus/manifest, or the cycle-003 held-out seal.

## 7. Invariant / unchanged-surface checks

- I1 cycle-001 entrypoint: `17f6380b…1730f1` ✓
- `package.json`: `0.2.0` / `{}` (no bump, no dependency) ✓
- `src/theatres/*` byte-frozen (anchors `377725ec…`, `466ad282…`) ✓
- `t1-replay.js` byte-frozen (`9c46c8ad…`); `deriveEvidenceT1` untouched (T1 consumes 0 evidence) ✓
- `src/rlmf/certificates.js` byte-frozen (`eeef486c…`); RLMF cert version `0.1.0` unchanged ✓
- cycle-003 corpus_hash `7b6c5b48…`, baseline fixture `538cba01…` unchanged ✓

## 8. Claim-grep

CLEAN — 24 files swept, 0 forbidden-positive-claim violations
(`tests/claim-grep-gate-test.js`). Gate verified to have teeth (a scratch bare-claim
file is flagged, then removed).

## 9. Hard-stop status

**No hard stop triggered.** ablated == baseline (60/60); wired ≠ ablated for 30/30
T2 events with pre-cutoff observations (not all-identical); T1 identical across
states; replay-twice deterministic; cycle-002 regression proven without mutating
frozen artifacts; no `Date.now()`/`Math.random()` in the proof/replay path; no
param/gate/threshold/base_rate/sigma/lambda/formula drift; no forbidden artifact
touched; no T1 wiring / flux→solar_flare mapping; no scoring / Brier / baseline
delta / held-out eval / T4 fetch / rung-banking; `package.json` not edited.

## 10. AC Verification (SPRINT-PLAN §6.6)

| # | Acceptance criterion (verbatim) | Status | Evidence |
|---|---------------------------------|--------|----------|
| 1 | "Wired ≠ ablated for T2 events with pre-cutoff observations." | ✓ Met | `tests/replay-t2-wired-vs-ablated-test.js`: 30/30 differ = exactly the pre-cutoff set; PROOF-SUMMARY §4. |
| 2 | "Diff count is reported explicitly (count + event list; no silent truncation)." | ✓ Met | PROOF-SUMMARY §4 lists all 30; test logs count + full list. |
| 3 | "Ablated == baseline fixture (content identity, all events; comparison is line-ending-robust per §6.10…)." | ✓ Met | `tests/replay-t2-ablated-equals-baseline-test.js` — git cat-file (method 2) + JSON.parse canonical (method 1); 60/60. |
| 4 | "Replay-twice byte-identical within each of {wired, ablated}…" | ✓ Met | `tests/replay-t2-determinism-wired-test.js` — emitted JSON identical run-1 vs run-2 for both states. |
| 5 | "T1 wired == ablated == baseline (negative control)." | ✓ Met | `tests/replay-t1-negative-control-test.js` — 30/30 identical; 0 evidence consumed; t1-replay frozen. |
| 6 | "Cycle-002 frozen corpus replay byte-identical before/after (T1/T2/T4)." | ✓ Met | `tests/cycle-002-frozen-corpus-regression-test.js` — 15/15 == committed manifest anchor; non-mutating. |
| 7 | "No Date.now() / Math.random() in new replay paths." | ✓ Met | `tests/no-walltime-no-random-test.js` — stub-to-throw (60×3 no throw) + comment-stripped grep 0 hits. |
| 8 | "No parameter / gate / source invariant drift (I1; cycle-003 hash; RLMF 0.1.0; package.json 0.2.0/{})." | ✓ Met | `tests/no-param-diff-test.js` + §7 — all anchors hold; git diff --quiet clean. |
| 9 | "No forbidden positive claims (claim-grep clean — negations/definitions/ceiling only)." | ✓ Met | `tests/claim-grep-gate-test.js` — 24 files, 0 violations; §8. |
| 10 | "No rung banked." | ✓ Met | PROOF-SUMMARY §11; CLOSEOUT; no scoring/Brier/skill/delta/held-out anywhere. |
| 11 | "No tag / release / version bump." | ✓ Met | No tag/release/bump performed; `package.json` 0.2.0/{}; §6 path audit. |

## 11. Operator decision needed

**None.** All gates green; no hard stop. Awaiting `/review-sprint sprint-03`.

## 12. No commit / push / merge / tag / bump

This sprint performed **no** commit, push, merge, tag, release, or version bump,
and did **not** update broad NOTES / Obsidian / root durable docs. Working tree
holds the authorized Sprint 03 changes only.

## 13. Next required command

`/review-sprint sprint-03`
