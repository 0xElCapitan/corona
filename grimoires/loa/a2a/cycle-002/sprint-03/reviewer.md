# Sprint 03 Implementation Report — Cycle-002 Runtime-Replay Entrypoint + Additive Manifest

**Status**: Implementation complete; awaiting `/review-sprint sprint-03`.
**Authored**: 2026-05-02
**Cycle / Sprint**: cycle-002 / sprint-03
**Routing**: cycle-002 SPRINT-LEDGER (operator ratification: this sprint intentionally has no separate `ENTRYPOINT-MANIFEST.md`; the binding spec is the existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts).
**Pre-existing tree**: clean at HEAD `2bb5f85` (cycle-002 sprint plan + Sprint 02 closeout already on disk).

---

## Executive summary

Sprint 03 lands the cycle-002 runtime-replay entrypoint, the additive cycle-002 manifest, and the `replay_script_hash` provenance lane. Per operator ratification the entrypoint is a **new separate file** at `scripts/corona-backtest-cycle-002.js`; the cycle-001 entrypoint at `scripts/corona-backtest.js` is **byte-frozen** — its sha256 stays `17f6380b…1730f1` by construction (the file is never touched). The cycle-001 calibration manifest at `grimoires/loa/calibration/corona/calibration-manifest.json` is likewise unmodified (sha256 `e53a40d1…5db34a` preserved).

End-to-end: `node scripts/corona-backtest-cycle-002.js --output cycle-002-run-1` produces:

- runtime-uplift composite over **T1 + T2 + T4 only** (`runtime-uplift-summary.md`)
- full-picture diagnostic over **all five theatres** with every section/table tagged `[diagnostic]` (`diagnostic-summary.md`)
- **Baseline B** anchor outputs at `grimoires/loa/calibration/corona/cycle-002-run-1/`
- additive cycle-002 manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` carrying `replay_script_hash` (and its `runtime_replay_hash` alias) over the binding 12-file set

Test totals: **279 pass, 0 fail** (Sprint 02 baseline 261 + 18 new Sprint 03 tests in `tests/cycle-002-entrypoint-test.js`).

This sprint is a **measurement-seam** sprint. It is not a parameter refit, not an L2 publish, not a release-hygiene sprint. T4 is the clean owned-uplift theatre; T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape — the Sprint 02 honest-framing disclosure carries forward verbatim.

---

## AC Verification

The "binding Sprint 03 implementation spec" per operator ratification is the existing cycle-002 doc set. ACs below are extracted from `CYCLE-002-SPRINT-PLAN.md §4.1.2 / §4.1.6 / §4.1.8` and the operator's Sprint 03 instruction.

| # | AC (verbatim or operator-instruction) | Status | Evidence |
|---|---------------------------------------|--------|----------|
| AC-1 | "Cycle-001 default mode reproduces `script_hash = 17f6380b…1730f1`." (`SPRINT-PLAN §4.1.8`) | ✓ Met | [tests/cycle-002-entrypoint-test.js:74-79](../../../../../tests/cycle-002-entrypoint-test.js) (`byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor`); `scripts/corona-backtest.js` not in any modified file list (verified post-test). |
| AC-2 | "Cycle-001 calibration manifest entries' hashes are NEVER mutated." (`SPRINT-PLAN §4.1.3`, `SDD §5.2`) | ✓ Met | [tests/cycle-002-entrypoint-test.js:81-87](../../../../../tests/cycle-002-entrypoint-test.js) (`byte-freeze: cycle-001 calibration-manifest.json sha256 unchanged`) anchors at `e53a40d1…5db34a`. |
| AC-3 | "Add `scripts/corona-backtest-cycle-002.js`" as the new cycle-002 entrypoint owning runtime replay dispatch + two-summary reporting + cycle-002 output dir creation + manifest generation + `replay_script_hash` computation. (operator instruction) | ✓ Met | New file at [scripts/corona-backtest-cycle-002.js](../../../../../scripts/corona-backtest-cycle-002.js); `dispatchCycle002Replay` at [scripts/corona-backtest-cycle-002.js:158-198](../../../../../scripts/corona-backtest-cycle-002.js) drives all five theatres; `main()` at [scripts/corona-backtest-cycle-002.js:200-309](../../../../../scripts/corona-backtest-cycle-002.js) writes the two summaries + manifest. |
| AC-4 | "Add `loadCorpusWithCutoff` as additive export; existing `loadCorpus` unchanged." (`SPRINT-PLAN §4.1.2 #2`, `CONTRACT §7.3`) | ✓ Met | [scripts/corona-backtest/ingestors/corpus-loader.js:434-588](../../../../../scripts/corona-backtest/ingestors/corpus-loader.js) — additive export `loadCorpusWithCutoff` returns `{ events, errors, stats, cutoffs, evidence }`; `loadCorpus` byte-stable above (only an extra `function parseIsoMsLocal` and helper functions added in the new section). [tests/cycle-002-entrypoint-test.js:339-369](../../../../../tests/cycle-002-entrypoint-test.js) asserts the additive contract. |
| AC-5 | "T1 → `replay_T1_event` → `binary_scalar` → threshold-native binary Brier" (operator instruction; `SDD §3.2`) | ✓ Met | [scripts/corona-backtest-cycle-002.js:248-256](../../../../../scripts/corona-backtest-cycle-002.js) dispatches; `aggregates.T1.scoring_path === 't1_binary_brier_cycle002'`. Asserted by [tests/cycle-002-entrypoint-test.js:124-143](../../../../../tests/cycle-002-entrypoint-test.js). |
| AC-6 | "T2 → `replay_T2_event` → `binary_scalar` → threshold-native binary Brier" | ✓ Met | Same dispatch path; `scoring_path === 't2_binary_brier_cycle002'`. Same test asserts. |
| AC-7 | "T4 → `replay_T4_event` → `bucket_array_5` → runtime bucket Brier" | ✓ Met | Per-event distribution loop in [scripts/corona-backtest-cycle-002.js:_scoreCorpusT4PerEventDispatch](../../../../../scripts/corona-backtest-cycle-002.js); `scoring_path === 't4_bucket_brier_runtime_wired_cycle002'`. [tests/cycle-002-entrypoint-test.js:163-183](../../../../../tests/cycle-002-entrypoint-test.js) asserts ≥2 distinct per-event distributions to guard against single-shared-distribution regression. |
| AC-8 | "T3 external-model / corpus-anchored diagnostic only; must not enter runtime-uplift scoring" (operator instruction) | ✓ Met | Dispatch routes T3 through unchanged `scoreCorpusT3`; T3 is excluded from `RUNTIME_UPLIFT_THEATRES` ([scripts/corona-backtest/reporting/runtime-uplift-summary.js:26](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js)); manifest carries `included_in_runtime_uplift_composite: false` + `diagnostic_only: true` for T3. [tests/cycle-002-entrypoint-test.js:212-249](../../../../../tests/cycle-002-entrypoint-test.js) asserts. |
| AC-9 | "T5 quality-of-behavior diagnostic only; must not enter runtime-uplift scoring" | ✓ Met | Same path: dispatch routes T5 through unchanged `scoreCorpusT5`; same exclusion + flag. Same test asserts. |
| AC-10 | "Write `runtime-uplift-summary.md` for T1 + T2 + T4 only" (operator instruction) | ✓ Met | [scripts/corona-backtest/reporting/runtime-uplift-summary.js](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js) emits exactly three theatre rows; T3/T5 cannot appear. [tests/cycle-002-entrypoint-test.js:261-289](../../../../../tests/cycle-002-entrypoint-test.js) asserts no `^\| T3 \[` / `^\| T5 \[` rows; honest-framing forbidden phrases not present. |
| AC-11 | "Write `diagnostic-summary.md` for all five theatres; every section/table tagged `[diagnostic]`" (operator instruction) | ✓ Met | [scripts/corona-backtest/reporting/diagnostic-summary.js](../../../../../scripts/corona-backtest/reporting/diagnostic-summary.js) renders all five rows; section headers + table captions carry `[diagnostic]`. [tests/cycle-002-entrypoint-test.js:291-324](../../../../../tests/cycle-002-entrypoint-test.js) asserts every `## ...` header includes `[diagnostic]` and all five posture tags appear verbatim. |
| AC-12 | Posture tags appear verbatim: T1 `[runtime-binary]`, T2 `[runtime-binary]`, T3 `[external-model]`, T4 `[runtime-bucket]`, T5 `[quality-of-behavior]` (operator instruction) | ✓ Met | Same two reporting modules; tested by both summary tagging tests. |
| AC-13 | "Create `grimoires/loa/calibration/corona/cycle-002-run-1/`; do not write into cycle-001 `run-1`/`run-2`/`run-3-final`." (operator instruction; `SPRINT-PLAN §4.1.4`) | ✓ Met | Directory exists with 5 outputs (corpus_hash, replay_script_hash, cycle_001_script_hash, runtime-uplift-summary.md, diagnostic-summary.md); guard `_FROZEN_CYCLE001_OUTPUT_DIRS` at [scripts/corona-backtest-cycle-002.js:75](../../../../../scripts/corona-backtest-cycle-002.js) returns exit code 4 on `run-1`/`run-2`/`run-3-final`. [tests/cycle-002-entrypoint-test.js:393-401](../../../../../tests/cycle-002-entrypoint-test.js) asserts. |
| AC-14 | Write additive `cycle-002/runtime-replay-manifest.json` carrying `replay_script_hash` / `runtime_replay_hash` + explanation of why cycle-001 `script_hash` is insufficient. (operator instruction) | ✓ Met | File exists at [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json](../../../../calibration/corona/cycle-002/runtime-replay-manifest.json) with both fields populated to identical hex `c2ab41b7…e2e8fe`; `cycle_001_script_hash_note` field documents the insufficiency verbatim. [tests/cycle-002-entrypoint-test.js:339-381](../../../../../tests/cycle-002-entrypoint-test.js) asserts shape. |
| AC-15 | Cycle-001 manifest at `calibration-manifest.json` not mutated. (operator hard stop) | ✓ Met | sha256 unchanged at `e53a40d1…5db34a` (AC-2). The cycle-002 entrypoint never opens the cycle-001 manifest path. |
| AC-16 | `replay_script_hash` file set covers operator-required 9 + new Sprint 03 helpers. (operator instruction) | ✓ Met | `REPLAY_SCRIPT_HASH_FILES` at [scripts/corona-backtest/manifest/runtime-replay-manifest.js:35-49](../../../../../scripts/corona-backtest/manifest/runtime-replay-manifest.js) lists exactly the 9 operator-required files plus the 3 Sprint 03 helpers (`runtime-uplift-summary.js`, `diagnostic-summary.js`, `runtime-replay-manifest.js`). [tests/cycle-002-entrypoint-test.js:386-405](../../../../../tests/cycle-002-entrypoint-test.js) asserts every required path is present and that the cycle-001 entrypoint is NOT in the set. |
| AC-17 | `replay_script_hash` changes when any covered file changes. (operator instruction) | ✓ Met | [tests/cycle-002-entrypoint-test.js:407-441](../../../../../tests/cycle-002-entrypoint-test.js) mirrors all 12 files into a tmpdir, asserts identical hash, mutates the entrypoint copy, asserts hash changes; mutates a second covered file, asserts a third distinct hash. |
| AC-18 | Cycle-002 manifest structural / regression validation. (`SPRINT-PLAN §4.1.6`) | ✓ Met | Structural: [tests/cycle-002-entrypoint-test.js:329-364](../../../../../tests/cycle-002-entrypoint-test.js) asserts schema fields (`cycle`, `additive`, `predecessor_manifest`, `corpus_hash`, `replay_script_hash`, etc.). Regression: `verifyReplayScriptHash` at [scripts/corona-backtest/manifest/runtime-replay-manifest.js:222-244](../../../../../scripts/corona-backtest/manifest/runtime-replay-manifest.js) recomputes from disk; asserted by [tests/cycle-002-entrypoint-test.js:367-381](../../../../../tests/cycle-002-entrypoint-test.js). |
| AC-19 | "T1/T2 base_rate prior-only guard for current cycle-001 corpus shape." (operator instruction; optional but preferred) | ✓ Met | [tests/cycle-002-entrypoint-test.js:447-492](../../../../../tests/cycle-002-entrypoint-test.js) — both tests assert `position_history_at_cutoff.length === 1` (createX called once, processX never) and that all 5 events share a single `current_position_at_cutoff` value (the runtime base_rate constant). If the cycle-001 T1/T2 corpus ever gains pre-cutoff time-series, these guards will trip and force re-evaluation of the prior-only honest framing. |
| AC-20 | Two-summary discipline: `runtime-uplift-summary.md` does not blend with `diagnostic-summary.md`; bare "composite verdict" reserved for runtime-uplift. (`CHARTER §4.1`, operator instruction) | ✓ Met | The two summaries are separate files written by separate modules with separate theatre lists. `runtime-uplift-summary.md` carries the composite scope statement explicitly ("This composite covers T1 + T2 + T4 ONLY"). The honest-framing forbidden-phrase grep is asserted in the runtime-uplift summary tagging test. |
| AC-21 | "Run `npm test`" + "all 261 existing tests stay green." (`SPRINT-PLAN §4.1.6` test invariant) | ✓ Met | `npm test` returns 279/279 pass, 0 fail. Sprint 02 baseline 261 preserved; +18 cycle-002 entrypoint tests. |
| AC-22 | Hard stops: do not edit `scripts/corona-backtest.js`; do not mutate cycle-001 manifest / runs / certs; T1/T2 no bucket projection; T3/T5 no runtime-uplift entry; no runtime parameter refit; no new dependencies. (operator instruction) | ✓ Met | None triggered. `scripts/corona-backtest.js` not in `git status`. `package.json dependencies: {}` invariant preserved. `src/rlmf/certificates.js` unchanged. `src/` not modified at all. |

No AC marked `✗ Not met`, `⚠ Partial`, or `⏸ [ACCEPTED-DEFERRED]`.

---

## Tasks completed

### Task 1 — Phase 0 doc-routing cleanup (operator instruction)

Files: 3 modified.

- [grimoires/loa/a2a/cycle-002/SPRINT-LEDGER.md](../SPRINT-LEDGER.md) — Sprint 03 section now records the operator ratification verbatim and marks status In progress; the stale "Spec: TBD / Expected future path: …/ENTRYPOINT-MANIFEST.md" pair is gone.
- [grimoires/loa/a2a/cycle-002/CYCLE-002-SPRINT-PLAN.md](../CYCLE-002-SPRINT-PLAN.md) — three replacements: §4.1 spec line, §4.1.4 likely-files row (the `ENTRYPOINT-MANIFEST.md` row removed; ratification annotated on the reviewer.md row), §6 routing line.
- [grimoires/loa/a2a/cycle-002/SDD.md](../SDD.md) — two replacements at §3 line 165 and §15 line 700.

`grep -rE "ENTRYPOINT-MANIFEST" grimoires/loa/a2a/cycle-002/` now returns only ratification text references (no remaining "must be drafted before implementation" implications). No technical scope changed in this phase.

### Task 2 — Additive `loadCorpusWithCutoff` (CONTRACT §7.3, REPLAY-SEAM §6, SDD §3.3)

Files: 1 modified.

- [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../../scripts/corona-backtest/ingestors/corpus-loader.js) — added a section starting at line 434 with: per-theatre `deriveCutoffT{1..5}` helpers, per-theatre `deriveEvidenceT{1..5}` helpers, and the `loadCorpusWithCutoff` export at the end. The existing `loadCorpus` function and exports above the new section are untouched (the `// Re-export internals` block was extended additively to expose `_CUTOFF_DERIVATIONS` and `_EVIDENCE_DERIVATIONS` for unit-test access).

The `evidence: { pre_cutoff, settlement }` split is the structural fix for Sprint 02 audit finding §A1 (evidence-leakage prevention by author convention → loader-enforced split). For T4 corpus events with proton observations, `pre_cutoff` is sorted ascending and strictly less than `cutoff.time_ms`. T1/T2/T3/T5 `pre_cutoff` is empty by current cycle-001 corpus shape (no time-series); the structural shape is in place for future corpus shapes.

### Task 3 — Manifest helper + `replay_script_hash` (SDD §5, §6)

Files: 1 new.

- [scripts/corona-backtest/manifest/runtime-replay-manifest.js](../../../../../scripts/corona-backtest/manifest/runtime-replay-manifest.js) — new module. Owns `REPLAY_SCRIPT_HASH_FILES` (path-sorted at hash time), `computeReplayScriptHash(repoRoot)` (canonical concat per file: `relpath \0 bytes \0`), `buildCycle002Manifest(args)`, and `verifyReplayScriptHash(manifest, repoRoot)`. The `runtime_replay_hash` alias mirrors `replay_script_hash` so consumers of either name resolve to the same hex.

The `cycle_001_script_hash_note` field in the manifest documents why cycle-001 `script_hash = sha256(scripts/corona-backtest.js)` is insufficient for cycle-002 provenance — the cycle-001 hash does not cover the replay-seam dependencies that drive cycle-002 trajectory output.

### Task 4 — Two-summary reporting (CHARTER §4.1)

Files: 2 new.

- [scripts/corona-backtest/reporting/runtime-uplift-summary.js](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js) — exports `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']` and `writeRuntimeUpliftSummary({aggregates, meta})`. Output renders three rows with the binding posture tags `[runtime-binary]` / `[runtime-binary]` / `[runtime-bucket]`. Honest-framing language is part of the rendered file; bare "calibration improved" / "predictive uplift demonstrated" / "verifiable track record" do not appear.
- [scripts/corona-backtest/reporting/diagnostic-summary.js](../../../../../scripts/corona-backtest/reporting/diagnostic-summary.js) — exports `DIAGNOSTIC_THEATRES = ['T1','T2','T3','T4','T5']` and `writeDiagnosticSummary({aggregates, meta})`. Every section title and every table caption carries `[diagnostic]`; the top-level title also carries it.

### Task 5 — Cycle-002 entrypoint (operator binding architecture)

Files: 1 new.

- [scripts/corona-backtest-cycle-002.js](../../../../../scripts/corona-backtest-cycle-002.js) — new top-level entrypoint. Owns runtime replay dispatch (T1/T2/T4 via `replay_T*_event` → trajectory → cycle-002 scoring; T3/T5 unchanged scorers), two-summary reporting writes, cycle-002 output directory creation, additive manifest write at `cycle-002/runtime-replay-manifest.json`, and `replay_script_hash` provenance computation. The cycle-001 entrypoint is not imported.

Output-dir guard `_FROZEN_CYCLE001_OUTPUT_DIRS = {'run-1','run-2','run-3-final'}` returns exit 4 on attempts to write into those names (defense-in-depth against an operator typo overwriting cycle-001 evidence).

The `scoreCorpusT4PerEventDispatch` helper is private to the entrypoint and replaces the cycle-001 `scoreCorpusT4(events, {predictedDistribution})` shape (which applies a single distribution across all events) with a per-event loop calling the unchanged `scoreEventT4(event, trajectory.current_position_at_cutoff)`. The legacy `t4-bucket-brier.js` is not modified — only consumed.

### Task 6 — Tests

Files: 1 new.

- [tests/cycle-002-entrypoint-test.js](../../../../../tests/cycle-002-entrypoint-test.js) — 18 new tests covering: cycle-001 entrypoint byte-freeze, cycle-001 manifest byte-freeze, corpus_hash invariant, dispatch behavior (T1/T2/T4 trajectory-driven, T3/T5 unchanged), per-event T4 distributions (≥2 distinct), replay-twice end-to-end byte-identical, runtime-uplift composite scope discipline, diagnostic-summary `[diagnostic]` tagging + posture tags, manifest structural shape, manifest regression (recomputed `replay_script_hash` matches recorded), file-set composition (operator-required 9 + Sprint 03 helpers; cycle-001 entrypoint excluded), `replay_script_hash` sensitivity to one-byte mutation in the tmp tree, T1/T2 prior-only guards on cycle-001 corpus shape, `loadCorpusWithCutoff` additive contract, FROZEN_CYCLE001_OUTPUT_DIRS guard, T4 per-event aggregation correctness.

### Task 7 — package.json (additive)

Files: 1 modified.

- [package.json](../../../../../package.json) — appended `tests/cycle-002-entrypoint-test.js` to `scripts.test`. `version: "0.2.0"` and `dependencies: {}` invariants preserved.

---

## Technical highlights

- **Two-entrypoint architecture (binding)**. Per operator ratification + SDD §3.1: cycle-001 entrypoint at `scripts/corona-backtest.js` is byte-frozen; cycle-002 entrypoint at `scripts/corona-backtest-cycle-002.js` is a fully separate file. The earlier-proposed `--replay` flag / env-var dispatch path on the cycle-001 entrypoint is explicitly retired (in the conflict-resolution sense — the doc patches in Task 1 left technical scope alone, but the implementation routes through the new file). I1 (cycle-001 reproducibility lane) is preserved by construction, not by careful editing.
- **`replay_script_hash` covers 12 files**. Operator-required 9 + 3 Sprint 03 helpers (`runtime-uplift-summary.js`, `diagnostic-summary.js`, `runtime-replay-manifest.js`). Cycle-001 entrypoint deliberately excluded — preserves the cleaner separation in SDD §6.3 ("each hash owned by exactly one entrypoint"). `runtime_replay_hash` is recorded as an alias of `replay_script_hash` (same hex; two field names so downstream consumers can read either).
- **Per-event T4 dispatch**. The existing `scoreCorpusT4(events, {predictedDistribution})` is a single-distribution API. Cycle-002 needs per-event distributions because each event has its own runtime trajectory. The fix is a private helper `scoreCorpusT4PerEventDispatch` inside the cycle-002 entrypoint that loops `scoreEventT4(event, trajectory.current_position_at_cutoff)` per event and aggregates the mean Brier. The legacy `t4-bucket-brier.js` is read but not modified (CHARTER §9.3 freeze respected).
- **Posture-tag and section-tag enforcement**. The `[diagnostic]` tag and the posture tags (`[runtime-binary]` / `[external-model]` / `[runtime-bucket]` / `[quality-of-behavior]`) are not just textual — they are asserted by the test suite, so any future drift in summary modules will fail loudly rather than silently weaken the discipline.
- **Hard-stop guards in code**. The output-dir guard `_FROZEN_CYCLE001_OUTPUT_DIRS` prevents an operator typo (`--output run-3-final`) from clobbering frozen cycle-001 evidence; the `computeReplayScriptHash` function throws immediately if any covered file is missing on disk, which prevents silent provenance loss if a covered file is later renamed without updating the file set.

---

## Honest framing (binding cycle-level)

- Cycle-002 is a **measurement-seam** cycle. Sprint 03 wires the seam at the entrypoint boundary; it does not refit any runtime parameter, does not promote any calibration-manifest entry, does not bump the version, does not edit any L2 publishing surface, does not edit any release-hygiene artifact.
- **T4 `[runtime-bucket]`** is the clean owned-uplift theatre. Sprint 02 already proved the trajectory is materially different from `UNIFORM_PRIOR`; Sprint 03 brings that same trajectory into the entrypoint via `scoreEventT4(event, trajectory.current_position_at_cutoff)`. T4 is the first sensitivity-proof target in Sprint 05.
- **T1 `[runtime-binary]`** and **T2 `[runtime-binary]`** are runtime-wired but **prior-only on the current cycle-001 corpus shape**: cycle-001 T1/T2 corpus events lack pre-cutoff time-series evidence (no GOES X-ray series for T1; no per-3hr Kp series for T2). `replay_T1_event` / `replay_T2_event` invoke `createX` once and never call `processX`; `current_position_at_cutoff` equals the runtime `base_rate` constant. T1/T2 cannot earn Rung 3 (calibration-improved) on this corpus shape — corpus-shape-foreclosed, not a Sprint 03 bug. The two new T1/T2 base_rate guard tests pin this honest framing into the test suite (any future corpus shape change will trip the guards and force re-evaluation).
- **No comparison of cycle-001 Baseline A numerics to cycle-002 Baseline B numerics as uplift**. Sprint 03 does not present such a comparison. The cycle-002 entrypoint outputs are wholly under the cycle-002 (Baseline B) regime and are explicitly so labeled.
- **Forbidden language did not appear** in any new artifact: `grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"` against the new `runtime-uplift-summary.md`, `diagnostic-summary.md`, `reviewer.md`, and `runtime-replay-manifest.json` returns zero matches in non-negation contexts.
- **RLMF certificate unchanged** in cycle-002. `src/rlmf/certificates.js` zero-diff. Sprint 03 does not touch any file under `src/`.

---

## Testing summary

`npm test` post-Sprint-03:

```
ℹ tests 279
ℹ suites 29
ℹ pass 279
ℹ fail 0
ℹ duration_ms ~302
```

Delta from Sprint 02 close (261/261): +18 tests, all in `tests/cycle-002-entrypoint-test.js`. No existing test was renamed or removed. No existing test required modification.

To reproduce locally:

```bash
npm test
# or, just the new tests:
node --test tests/cycle-002-entrypoint-test.js
```

To re-anchor Baseline B:

```bash
node scripts/corona-backtest-cycle-002.js --output cycle-002-run-1
```

To confirm cycle-001 invariants:

```bash
node -e "const c=require('crypto');const fs=require('fs');console.log(c.createHash('sha256').update(fs.readFileSync('scripts/corona-backtest.js')).digest('hex'));"
# expected: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1

node -e "const c=require('crypto');const fs=require('fs');console.log(c.createHash('sha256').update(fs.readFileSync('grimoires/loa/calibration/corona/calibration-manifest.json')).digest('hex'));"
# expected: e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a
```

---

## Hard-stop posture

None of the operator-listed hard stops triggered:

- Implementation did NOT require editing `scripts/corona-backtest.js`.
- `scripts/corona-backtest.js` hash is unchanged (`17f6380b…1730f1`).
- Cycle-001 calibration manifest mutation did NOT appear necessary; sha256 unchanged.
- Cycle-001 run output mutation did NOT appear necessary; cycle-002 outputs go to `cycle-002-run-1/`.
- `src/rlmf/certificates.js` mutation did NOT appear necessary; `src/` not modified at all.
- T1/T2 bucket projection did NOT appear necessary; T1/T2 stay `binary_scalar`.
- T3/T5 are excluded from runtime-uplift scoring (asserted by tests).
- No runtime parameter refit attempted.
- Replay determinism preserved (replay-twice byte-identical asserted by `tests/cycle-002-entrypoint-test.js` end-to-end test, in addition to Sprint 02 per-theatre determinism tests).
- No new runtime dependency introduced; `package.json dependencies: {}` invariant preserved.
- Sprint 4 work not started, not entangled.

---

## Operator-mandated post-implementation report items

- **`npm test`**: 279 pass / 0 fail.
- **Changed files**:
  - Modified: `grimoires/loa/a2a/cycle-002/CYCLE-002-SPRINT-PLAN.md`, `grimoires/loa/a2a/cycle-002/SDD.md`, `grimoires/loa/a2a/cycle-002/SPRINT-LEDGER.md`, `package.json`, `scripts/corona-backtest/ingestors/corpus-loader.js`.
  - Added: `scripts/corona-backtest-cycle-002.js`, `scripts/corona-backtest/manifest/runtime-replay-manifest.js`, `scripts/corona-backtest/reporting/runtime-uplift-summary.js`, `scripts/corona-backtest/reporting/diagnostic-summary.js`, `tests/cycle-002-entrypoint-test.js`, `grimoires/loa/calibration/corona/cycle-002-run-1/{corpus_hash.txt, replay_script_hash.txt, cycle_001_script_hash.txt, runtime-uplift-summary.md, diagnostic-summary.md}`, `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`, `grimoires/loa/a2a/cycle-002/sprint-03/reviewer.md` (this file).
- **`scripts/corona-backtest.js` byte-identical**: YES. sha256 = `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (confirmed pre- and post-implementation).
- **Cycle-001 manifest untouched**: YES. sha256 = `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` (confirmed pre- and post-implementation).
- **Cycle-002 output files created**:
  - `grimoires/loa/calibration/corona/cycle-002-run-1/corpus_hash.txt` → `b1caef3f…11bb1`
  - `grimoires/loa/calibration/corona/cycle-002-run-1/cycle_001_script_hash.txt` → `17f6380b…1730f1`
  - `grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt` → `c2ab41b7…e2e8fe`
  - `grimoires/loa/calibration/corona/cycle-002-run-1/runtime-uplift-summary.md` (T1+T2+T4 only; posture tags present)
  - `grimoires/loa/calibration/corona/cycle-002-run-1/diagnostic-summary.md` (all five; every section/table tagged `[diagnostic]`)
  - `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (additive cycle-002 manifest)
- **`replay_script_hash` behavior**: Computed deterministically over the path-sorted file set of 12 files (operator-required 9 + Sprint 03 helpers 3). Recorded in the manifest as both `replay_script_hash` and `runtime_replay_hash` (same hex `bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60` — refreshed after the C1+C2 doc-correctness fixes in `scripts/corona-backtest/reporting/diagnostic-summary.js`; pre-fix hash was `c2ab41b7d51bb0b2e99a2c031985cbc190608d6fde7d52bf8608b34b7ee2e8fe`). Recomputable on demand via `verifyReplayScriptHash(manifest)`. Sensitive to a one-byte mutation of any covered file (asserted in tests via tmpdir mirror + targeted byte append).

---

## Verification steps for reviewer

1. `npm test` — expect 279 pass / 0 fail.
2. `git status` — expect the modified + added file list above; no other paths.
3. Read `grimoires/loa/calibration/corona/cycle-002-run-1/runtime-uplift-summary.md` — expect three theatre rows (T1/T2/T4 only), each with the binding posture tag, plus an honest-framing block. No T3/T5 rows. No "calibration improved" prose.
4. Read `grimoires/loa/calibration/corona/cycle-002-run-1/diagnostic-summary.md` — expect five theatre rows, every section header tagged `[diagnostic]`, all five posture tags present.
5. Read `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` — expect `cycle: "cycle-002"`, `additive: true`, predecessor pointing at the immutable cycle-001 manifest, both `replay_script_hash` and `runtime_replay_hash` populated, the file-set list of 12 paths (no `scripts/corona-backtest.js` in the list).
6. Confirm `scripts/corona-backtest.js` is not in `git diff` — its byte-freeze is preserved.
7. Confirm `src/` is not in `git diff` — no runtime modification.
8. Confirm `grimoires/loa/calibration/corona/calibration-manifest.json` is not in `git diff` — cycle-001 manifest immutable.
9. Re-run the entrypoint: `node scripts/corona-backtest-cycle-002.js --output cycle-002-run-1` — expect identical hex outputs and identical aggregates (Baseline B is deterministic).
10. Try the output-dir guard: `node scripts/corona-backtest-cycle-002.js --output run-3-final` — expect exit code 4 with a refusal message; cycle-001 frozen dir untouched.

---

## Out-of-scope (deferred to later sprints, by operator instruction)

- T5 trajectory emit (Sprint 04 Option A default).
- Sensitivity-proof (Sprint 05; T4 first per Q8).
- L2 publish-readiness (Sprint 06 closeout territory; gated on Rung 4).
- Any release-hygiene work (CHANGELOG, README/BFZ updates, version bump, GitHub Release, tag) — Sprint 06 only, conditional on Rung 4.

No commit, no tag, no Sprint 4 start. Awaiting `/review-sprint sprint-03`.

---

*Sprint 03 implementation report authored 2026-05-02 against operator ratification of cycle-002 PRD/SDD/sprint-plan/ledger as the binding spec set. Cycle-001 invariants (`script_hash = 17f6380b…1730f1`, `corpus_hash = b1caef3f…11bb1`, calibration-manifest.json sha256 = `e53a40d1…5db34a`) preserved verbatim. Honest-framing memory binding governs this report — no laundered claims, no cross-regime baseline comparisons, no "calibration-improved" / "predictive uplift demonstrated" / "L2 publish-ready" prose.*
