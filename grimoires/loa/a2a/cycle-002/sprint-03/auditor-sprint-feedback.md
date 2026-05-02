# Sprint 03 Security & Quality Audit — Cycle-002 Runtime-Replay Entrypoint + Additive Manifest

**Verdict**: **APPROVED - LETS FUCKING GO**.
**Audit date**: 2026-05-02
**Audit posture**: Paranoid Cypherpunk Auditor; independent verification of every priority (no trust on engineer/reviewer reports).
**Routing**: cycle-002 SPRINT-LEDGER (operator ratification).
**Audit scope**: post-C1/C2 fix-pass state; new `replay_script_hash` anchor `bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60`.

Sprint 03 is **ready for operator commit approval**. No blocking issues. No new non-blocking concerns. C3 + C4 (review-phase advisory items) examined under audit lens and confirmed non-blocking; details below.

---

## Independent verification of operator's nine audit priorities

| # | Priority | Verdict | Independent evidence |
|---|----------|---------|----------------------|
| **1** | Cycle-001 lane frozen | ✓ PASS | `sha256(scripts/corona-backtest.js) = 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (matches anchor). `sha256(grimoires/loa/calibration/corona/calibration-manifest.json) = e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` (matches anchor). `git diff --name-only HEAD` returns nothing under `src/`, nothing under `grimoires/loa/a2a/sprint-[0-9]+/`, nothing under `grimoires/loa/calibration/corona/run-[123]`. `src/rlmf/certificates.js` 213 lines unchanged (sha256 `5c1af347bd0845b33452352dec5257dc1d3a44dd7bc8554e6b2a27341020a782`). |
| **2** | Stale-spec retirement | ✓ PASS | `grep -rn ENTRYPOINT-MANIFEST grimoires/loa/a2a/cycle-002/` returns 10 matches; all 10 are in (a) operator-ratification text in PRD/SDD/sprint-plan/ledger, or (b) the audit-trail discussion in reviewer.md / engineer-feedback.md. None imply that `ENTRYPOINT-MANIFEST.md` is required or pending. `ls grimoires/loa/a2a/cycle-002/sprint-03/` returns: `engineer-feedback.md`, `engineer-review-response.md`, `reviewer.md` — no `ENTRYPOINT-MANIFEST.md`. The Phase 0 doc patches modify only the routing language, not technical scope (verified by reading the actual `git diff` of all 3 doc files: each replacement substitutes operator-ratification text 1-for-1 with the original stale lines). |
| **3** | Two-entrypoint architecture | ✓ PASS | `grep -nE "(--replay\|REPLAY_MODE\|CORONA_REPLAY\|runtime_replay)" scripts/corona-backtest.js` returns ZERO matches — cycle-001 entrypoint has no replay-mode dispatch added. `scripts/corona-backtest-cycle-002.js` exists; imports drive dispatch from `replay/`, `scoring/`, `reporting/`, and `manifest/` modules; `loadCorpusWithCutoff` is the loader. Cycle-001 entrypoint not imported and not invoked from the cycle-002 entrypoint. The `_FROZEN_CYCLE001_OUTPUT_DIRS` guard is wired and tested. |
| **4** | Runtime replay / scoring boundaries | ✓ PASS | T1: `distribution_shape: 'binary_scalar'` ([replay/t1-replay.js:120](../../../../../scripts/corona-backtest/replay/t1-replay.js)) → `scoreCorpusT1Binary` (verified in `scripts/corona-backtest-cycle-002.js:201`). T2: same shape ([replay/t2-replay.js:120](../../../../../scripts/corona-backtest/replay/t2-replay.js)) → `scoreCorpusT2Binary`. T4: `distribution_shape: 'bucket_array_5'` ([replay/t4-replay.js:196](../../../../../scripts/corona-backtest/replay/t4-replay.js)) → per-event `scoreEventT4` aggregation. T3 → unchanged `scoreCorpusT3` ([entrypoint:208 + 286](../../../../../scripts/corona-backtest-cycle-002.js)). T5 → unchanged `scoreCorpusT5` ([entrypoint:210 + 288](../../../../../scripts/corona-backtest-cycle-002.js)). `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']` ([reporting/runtime-uplift-summary.js:26](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js)) — T3/T5 excluded. `grep -rnE "bucket_project\|bucketProject" scripts/corona-backtest/` returns ZERO matches — no T1/T2 bucket projection exists. |
| **5** | Loader additive + no settlement leakage | ✓ PASS | `loadCorpus` signature unchanged (line 395; pre-existing) and `loadCorpusWithCutoff` is a separate export (line 584; new). `git diff scripts/corona-backtest/ingestors/corpus-loader.js` shows `@@ -431,6 +431,187 @@` — 187 lines added, 0 deletions. Existing `loadCorpus` byte-stable above line 431. `_validateT1`/`_validateT4`/`_loadEventFile` re-exports preserved (lines 619-625). T4 pre-cutoff filter is strict (`if (obsMs >= cutoff.time_ms) continue;` at corpus-loader.js:533); the cycle-002 entrypoint test asserts this property end-to-end ([tests/cycle-002-entrypoint-test.js:483](../../../../../tests/cycle-002-entrypoint-test.js)). Pre-cutoff and settlement are structurally separated in evidence helpers (5 sites verified at corpus-loader.js:502-555). The `evidence: { pre_cutoff, settlement }` split is the structural fix for Sprint 02 audit finding §A1. |
| **6** | Reporting | ✓ PASS | `runtime-uplift-summary.md` table contains exactly 3 theatre rows (T1, T2, T4) with posture tags `[runtime-binary]`/`[runtime-binary]`/`[runtime-bucket]`. Section headers do NOT carry `[diagnostic]` (correct — the runtime-uplift summary is the binding-claim summary, not the diagnostic). `diagnostic-summary.md` table contains all 5 theatre rows with all 5 posture tags verbatim; all 5 `## ...` section headers carry `[diagnostic]` (Diagnostic discipline / Per-theatre rows / Theatre posture (binding) / Honest-framing notes / Provenance binding). C1 fix landed: `tests/cycle-002-entrypoint-test.js, test "byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor"` appears at `diagnostic-summary.md:65-66`. C2 fix landed: `tests/cycle-002-entrypoint-test.js, test "cycle-002 manifest regression: replay_script_hash matches recomputed"` + `verifyReplayScriptHash()` reference appear at `diagnostic-summary.md:68-71`. The pre-fix string `tests/replay-cycle001-byte-freeze-test.js` is GONE from the regenerated output (verified by `grep -F` returning no matches). |
| **7** | Manifest / provenance | ✓ PASS | Manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (separate file from cycle-001 manifest). `cycle: "cycle-002"`, `additive: true`, `predecessor_manifest.cycle: "cycle-001"`, `predecessor_manifest.immutable: true`. `replay_script_hash` and `runtime_replay_hash` BOTH equal `bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60` (matches the operator-stated expected hash; matches `cycle-002-run-1/replay_script_hash.txt`). `replay_script_hash_file_count: 12`. The 12 files list includes the 9 operator-required files PLUS the 3 Sprint 03 helpers (`runtime-uplift-summary.js`, `diagnostic-summary.js`, `runtime-replay-manifest.js`). `scripts/corona-backtest.js` is NOT in the file set (`m.replay_script_hash_files.includes('scripts/corona-backtest.js')` → `false`) — semantic separation of cycle-001 `script_hash` and cycle-002 `replay_script_hash` enforced. The sensitivity test (`replay_script_hash changes when any covered file changes`) passes ([tests/cycle-002-entrypoint-test.js:407-441](../../../../../tests/cycle-002-entrypoint-test.js)). The `cycle_001_script_hash_note` field documents the insufficiency of cycle-001 hash for cycle-002 provenance. The `verifyReplayScriptHash()` recomputation test passes. |
| **8** | Tests + dependencies | ✓ PASS | `npm test` returns `pass 279, fail 0, cancelled 0, skipped 0, todo 0, suites 29`. Sprint 02 baseline (261) preserved + 18 new cycle-002 entrypoint tests = 279. No tests masked, renamed, or removed. `package.json dependencies: {}` invariant preserved. `package.json version: 0.2.0` (unchanged — operator hard stop). 17 test files in `scripts.test` (Sprint 02 baseline 16 + 1 new = 17). |
| **9** | Honest framing | ✓ PASS | `grep -niE "calibration improved\|empirical performance improvement\|forecasting accuracy\|verifiable track record\|predictive uplift demonstrated\|L2 publish-ready"` against ALL Sprint 03 artifacts (cycle-002-run-1/*.md, cycle-002/*.json, sprint-03/*.md, new source files) returns matches in the following classes ONLY: (a) explicit negation in rendered output ("This composite is NOT evidence of …"); (b) source-code comments listing forbidden phrases as guards; (c) reviewer.md / engineer-feedback.md / engineer-review-response.md meta-discussion of the grep gate itself. `grep` against `engineer-review-response.md` returns ZERO matches. T1/T2 prior-only disclosure visible in both rendered summaries ("trajectories are prior-only on the cycle-001 corpus shape", "current_position_at_cutoff equals runtime base_rate", "T1/T2 cannot earn Rung 3 (calibration-improved) on the cycle-001 corpus shape — corpus-shape-foreclosed"). Cross-regime "Baseline A vs Baseline B uplift" sweep returns 4 matches; all are NEGATION context (e.g., "Cross-regime comparison ... is forbidden per CHARTER §8.2", "Sprint 03 does NOT present such a comparison", "no cross-regime baseline comparisons"). No positive uplift claim crossed regime boundaries. |

---

## Security audit (Paranoid Cypherpunk discipline)

| Surface | Finding | Disposition |
|---------|---------|-------------|
| **Hardcoded credentials / secrets** | `grep -rnE "(sk-[…]\|ghp_[…]\|AKIA[…]\|password\s*=\|api_key\s*=\|secret\s*=\|BEGIN.*PRIVATE KEY)"` against all new Sprint 03 files returns ZERO matches. | Clean. |
| **Command injection / shell exec** | Single use of `execSync` at [scripts/corona-backtest-cycle-002.js:87](../../../../../scripts/corona-backtest-cycle-002.js): `execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim()`. Hardcoded command literal (no string concatenation, no user input mixing). Wrapped in try/catch returning `'unknown'` on any failure. Identical pattern to cycle-001 entrypoint (`scripts/corona-backtest.js:62-67`); pre-existing project convention. | Clean. No injection surface. |
| **Eval / dynamic code execution** | `grep -rnE "eval\(\|new Function\(\|require\(.*[+]"` returns ZERO matches in new code. | Clean. |
| **Untrusted JSON deserialization** | `grep -rnE "JSON.parse"` returns ZERO matches in new Sprint 03 source files. The cycle-002 entrypoint reads no untrusted JSON; manifests are written, not read. | Clean. |
| **Path operations** | All `writeFileSync` / `readFileSync` calls use `resolve(REPO_ROOT, …)` or `resolve(outputDir, …)` for path normalization. The `outputDir` is built from `resolve(CALIBRATION_DIR, outputName)` where `outputName` comes from CLI/env. Resolution + normalization happens before writes. The cycle-002 entrypoint inherits the same pattern as the cycle-001 entrypoint (pre-existing). | Clean within the threat model. **C4 (output-dir guard normalization)** is a defense-in-depth concern noted by the reviewer; under the audit lens it does NOT escalate to a security issue because the operator is the only invocation surface (CLI on operator's own machine; not a network-facing service). The OS owns the filesystem; the script is an honest-framing checkpoint, not a security boundary. Confirmed non-blocking, advisory-only. |
| **Network / external calls** | `grep -rnE "(fetch\(\|http\.\|https\.\|net\.\|dgram)"` against new files returns ZERO matches. The cycle-002 entrypoint is fully offline. No DONKI / SWPC / GFZ calls (those live in cycle-001 ingestors and were not touched). | Clean. |
| **Error info disclosure** | Per-theatre try/catch at [entrypoint:271-294](../../../../../scripts/corona-backtest-cycle-002.js) emits `err.message` and `err.stack` to stderr. Stack traces include local file paths. Acceptable for an offline backtest CLI; matches cycle-001 entrypoint convention. | Acceptable. |
| **Resource exhaustion / DoS** | Cycle-002 entrypoint operates on a fixed 5-events-per-theatre corpus; no unbounded loops, no recursion, no cache growth. `replay_script_hash` computation reads a fixed 12-file set. `mkdtempSync` in tests uses a unique-per-invocation tmp dir. | Clean. |
| **Concurrency / race conditions** | Single-process, sequential file writes. No concurrent file access. Cycle-002 entrypoint writes to a single output dir per invocation. | Clean. |
| **Dependency supply chain** | `package.json dependencies: {}` invariant preserved. Zero new third-party packages introduced. `npm audit` surface unchanged from Sprint 02 close. | Clean. |
| **Cycle-001 evidence integrity** | Cycle-001 calibration manifest sha256 unchanged. Cycle-001 run outputs untouched in `git status`. Cycle-001 entrypoint hash unchanged. RLMF cert (`src/rlmf/certificates.js`) untouched. The output-dir guard `_FROZEN_CYCLE001_OUTPUT_DIRS` is a defense-in-depth check against operator typos overwriting frozen evidence. | Strong posture. |

---

## Disposition of review-phase concerns

| Concern | Review verdict | Audit verdict | Notes |
|---------|----------------|---------------|-------|
| **C1**: stale `tests/replay-cycle001-byte-freeze-test.js` reference | NON-BLOCKING (fix recommended before audit) | **FIXED** | The pre-fix string is GONE from the regenerated `cycle-002-run-1/diagnostic-summary.md`. The replacement text correctly cites `tests/cycle-002-entrypoint-test.js, test "byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor"`. Verified by `grep -F` returning no match for the old string. The hash refresh consequence (`replay_script_hash` `c2ab41b7…` → `bfbfd70d…`) is recorded in the manifest, the txt sidecar, and `reviewer.md`. |
| **C2**: imprecise `manifest_regression_test` reference | NON-BLOCKING (fix recommended before audit) | **FIXED** | The replacement text correctly cites `tests/cycle-002-entrypoint-test.js, test "cycle-002 manifest regression: replay_script_hash matches recomputed", via verifyReplayScriptHash()`. The new wording also explicitly disambiguates the cycle-001 `tests/manifest_regression_test.js` (inline-vs-manifest gate) from the cycle-002 recomputation assertion. The cycle-001 manifest regression test was correctly NOT extended (preserves its frozen-evidence role); the cycle-002 recomputation gate lives in the new test file. |
| **C3**: `code_revision` records committed HEAD without `+dirty` marker | ADVISORY (deferred per operator instruction) | **NON-BLOCKING; no escalation** | Re-examined under audit lens. The binding code-identity field is `replay_script_hash` (which captures actual code-under-test bytes); `code_revision` is an additional cross-reference. After Sprint 03 commit, `code_revision` will record the new HEAD and the issue self-resolves. No correctness or safety implication for Sprint 03 closeout. Worth tightening in a future sprint as quality-of-life; do not escalate. |
| **C4**: output-dir guard exact-string match | ADVISORY (deferred per operator instruction) | **NON-BLOCKING; no escalation** | Re-examined under audit lens (security framing). The guard is a defense-in-depth check against operator typo, not a security boundary. The threat model is operator-CLI-on-operator-machine; the operator already has filesystem write access via the OS. Path-traversal "exploitation" via the CLI args reduces to "the operator chose to write somewhere unusual on their own machine", which is not a security issue. Worth normalizing in a future sprint as quality-of-life; do not escalate. |

---

## Hard-stop posture verification (operator-listed)

| Hard stop | Triggered? | Evidence |
|-----------|-----------|----------|
| `scripts/corona-backtest.js` editing | NO | Not in `git diff --name-only HEAD`; sha256 anchor matches. |
| `scripts/corona-backtest.js` hash change | NO | sha256 = `17f6380b…1730f1` (matches anchor). |
| Cycle-001 calibration manifest mutation | NO | Not in `git diff`; sha256 anchor matches. |
| Cycle-001 run output mutation | NO | None of `run-1`, `run-2`, `run-3-final` in `git diff`. |
| `src/rlmf/certificates.js` mutation | NO | Not in `git diff`; line count + leading bytes unchanged. |
| T1/T2 bucket projection | NO | grep returns zero matches for `bucket_project` patterns. |
| T3/T5 entering runtime-uplift scoring | NO | `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']`; manifest entries for T3/T5 carry `included_in_runtime_uplift_composite: false` + `diagnostic_only: true`. |
| Runtime parameter refit | NO | No `src/` modifications; runtime parameters unchanged. |
| Replay determinism break | NO | `dispatchCycle002Replay` invoked twice in-process produces byte-identical trajectory hashes for T1/T2/T4 (verified independently in this audit). |
| New runtime dependency | NO | `package.json dependencies: {}` invariant preserved. |
| Sprint 04 work begun | NO | sprint-03 directory contains only sprint-03 artifacts; no sprint-04 dir created. |

---

## Adversarial sweep (independent of the reviewer's adversarial pass)

| Probe | Finding | Verdict |
|-------|---------|---------|
| Manifest entry consistency: do per-theatre flags (`included_in_runtime_uplift_composite`, `diagnostic_only`) match the binding posture? | T1/T2/T4 → `in_uplift: true`, `diagnostic_only: false`. T3/T5 → `in_uplift: false`, `diagnostic_only: true`. All five entries present. | Consistent with operator-binding posture. |
| Replay-twice byte-identical end-to-end (in-process, not just per-theatre) | T1/T2/T4 trajectory hashes byte-identical across two `dispatchCycle002Replay()` invocations. | Determinism gate green. |
| Hash sensitivity test still passes after C1/C2 fix | `replay_script_hash changes when any covered file changes (one-byte mutation)` test passes. The mutation behavior is unchanged by the C1/C2 source edit. | Sensitivity preserved. |
| `verifyReplayScriptHash()` recomputation gate | Test `cycle-002 manifest regression: replay_script_hash matches recomputed` passes. Recomputed hash from disk equals recorded manifest value. | Provenance gate green. |
| Stale ENTRYPOINT-MANIFEST.md spec or other artifact left behind | sprint-03/ inventory: `engineer-feedback.md`, `engineer-review-response.md`, `reviewer.md`. No stale spec file. No half-merged routing references. | Clean. |
| Reviewer-claimed `replay_script_hash` value matches independent recomputation | Independent grep + node JSON parse confirm `bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60` in (a) `cycle-002-run-1/replay_script_hash.txt`, (b) manifest `replay_script_hash`, (c) manifest `runtime_replay_hash`, (d) reviewer.md. All four agree. | No drift between reviewer's claim and on-disk reality. |
| Sprint 02 audit finding §A1 (evidence-leakage prevention) addressed | `loadCorpusWithCutoff` returns `evidence: { pre_cutoff, settlement }` split. T4 pre-cutoff filter is strict (`obsMs >= cutoff.time_ms continue`). End-to-end test asserts strict pre-cutoff. | Structural fix in place. |

No new concerns surfaced by the adversarial sweep.

---

## Final state snapshot

```
npm test:                pass 279, fail 0, skip 0
                         (Sprint 02 baseline 261 preserved; +18 cycle-002 tests)

Cycle-001 invariants:
  scripts/corona-backtest.js sha256 = 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
  calibration-manifest.json sha256  = e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a
  corpus_hash                        = b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1

Cycle-002 anchors:
  replay_script_hash                = bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60
  runtime_replay_hash (alias)       = bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60
  file set                          = 12 files (9 operator-required + 3 Sprint 03 helpers)
  cycle-002-run-1/                  = corpus_hash.txt, replay_script_hash.txt, cycle_001_script_hash.txt,
                                      runtime-uplift-summary.md, diagnostic-summary.md
  cycle-002/runtime-replay-manifest.json = additive cycle-002 manifest

package.json:
  version       = 0.2.0 (unchanged)
  dependencies  = {} (unchanged)
  scripts.test  = 17 test files (16 Sprint 02 baseline + 1 new)

Untouched:
  scripts/corona-backtest.js                   (cycle-001 entrypoint frozen)
  grimoires/loa/calibration/corona/calibration-manifest.json (cycle-001 manifest frozen)
  grimoires/loa/calibration/corona/run-{1,2,3-final}/        (cycle-001 outputs frozen)
  src/rlmf/certificates.js                     (RLMF cert frozen)
  src/                                         (no runtime modifications)
```

---

## Verdict

**APPROVED - LETS FUCKING GO**

- All 9 operator priorities verified independently. No drift between reviewer/engineer reports and on-disk reality.
- All 11 hard stops checked; none triggered.
- Security audit complete: zero blocking findings. Two advisory items (C3, C4) explicitly deferred per operator instruction; both re-examined under audit lens and confirmed non-blocking with no security or correctness implication for Sprint 03 closeout.
- Honest-framing grep gate clean: every match is in negation, source-code-guard, or meta-discussion context. T1/T2 prior-only disclosure preserved. No cross-regime Baseline A vs Baseline B uplift claim.
- Cycle-001 lane is provably frozen; cycle-002 lane is provably additive.
- Determinism gate (replay-twice byte-identical) passes end-to-end.

Sprint 03 is **ready for operator commit approval**. The implement → review → audit cycle for cycle-002 Sprint 03 is complete.

**Do not commit.** Per operator instruction.
**Do not tag.** Per operator instruction; v0.2.0 stays through Sprints 03–05; v0.3.0 (if ever) is a Sprint 06 + Rung 4 decision.
**Do not start Sprint 04.** Per operator instruction.

---

*Audit authored 2026-05-02 against the cycle-002 SPRINT-LEDGER routing source. Independent verification of all engineer/reviewer claims; no transitive trust. Cycle-001 byte-freeze + manifest immutability + RLMF cert immutability + corpus immutability all verified by sha256 anchor. Cycle-002 additive manifest + replay_script_hash provenance + two-summary discipline + theatre-posture tagging + honest-framing grep gate all pass. Operator hard stops respected. Sprint 03 cleared for operator commit gate.*
