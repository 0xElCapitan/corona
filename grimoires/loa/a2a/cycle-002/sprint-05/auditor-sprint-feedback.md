# Sprint 05 Security & Quality Audit — Paranoid Cypherpunk Auditor

**Verdict**: **AUDIT PASSED WITH NON-BLOCKING CONCERNS** — APPROVED - LETS FUCKING GO

**Authored**: 2026-05-03
**Cycle / Sprint**: cycle-002 / sprint-05
**Audit scope**: [reviewer.md](reviewer.md), [engineer-feedback.md](engineer-feedback.md), [engineer-review-response.md](engineer-review-response.md), [tests/sensitivity-proof-T4-test.js](../../../../tests/sensitivity-proof-T4-test.js), [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js), [scripts/corona-backtest/replay/t4-replay.js](../../../../scripts/corona-backtest/replay/t4-replay.js), [cycle-002-run-2/](../../../../grimoires/loa/calibration/corona/cycle-002-run-2/), [cycle-002-run-3/](../../../../grimoires/loa/calibration/corona/cycle-002-run-3/), [cycle-002 manifest](../../../../grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json), full git diff, live `npm test` re-run.

---

## Executive verdict

Sprint 05 (Path B implementation) is **secure, correct, and ready for operator commit approval**. The previous CHANGES_REQUIRED blocker is fully resolved; the perturbation now flows through the actual cycle-002 runtime path; the proof depends on the runtime exercising `PRODUCTIVITY_PARAMS lambda` (verified by adversarial simulation); Direction B byte-identically reproduces Sprint 03's run-1 anchor at the trajectory_hash level for all five T4 events. All operator-binding frozen invariants are preserved.

**Sprint 05 earns Rung 2 (runtime-sensitive) for T4 under CHARTER §10's strict reading.**

The three non-blocking concerns from the senior-lead re-review (NB1 process-blend coupling, NB2 lambdaScalar input validation, NB3 runT4Direction duplication) do not create Sprint 05 correctness, safety, or provenance issues. They remain non-blocking and are noted below for future-cycle hardening.

---

## Audit results — primary checks

### 1. Original blocker resolved (audit priority #1)

| Check | Result |
|---|---|
| Direction A no longer substitutes a hand-computed post-runtime distribution | ✓ Verified — `grep -c` returns **0** for `perturbedT4Distribution`, `estimateExpectedCountPerturbed`, `function countToBucketProbabilities`, `function poissonPMF`, `function logFactorial`, `function brierEventT4` in [tests/sensitivity-proof-T4-test.js](../../../../tests/sensitivity-proof-T4-test.js). |
| Direction A calls `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })` | ✓ Verified at [tests/sensitivity-proof-T4-test.js:192](../../../../tests/sensitivity-proof-T4-test.js): `const trajectory = replay_T4_event(event, ctx, { lambdaScalar });` and at [line 626](../../../../tests/sensitivity-proof-T4-test.js) (independent re-invocation in the scoring-consumes-runtime-output gate). |
| Direction A scoring consumes `trajectory.current_position_at_cutoff` directly | ✓ Verified at [tests/sensitivity-proof-T4-test.js:193](../../../../tests/sensitivity-proof-T4-test.js): `const score = scoreEventT4(event, trajectory.current_position_at_cutoff);`. The scorer (imported from `scripts/corona-backtest/scoring/t4-bucket-brier.js`, the production module) consumes the runtime's actual output. No substitution. |
| Test-side reimplementation helpers are deleted | ✓ Verified — see grep above. The test imports the real runtime via `replay_T4_event`, `scoreEventT4`, `createReplayContext`, `loadCorpusWithCutoff`. No test-side Wheatland math. |
| Proof would fail if runtime ignored `lambdaScalar` | ✓ Verified by adversarial simulation. I ran a parallel call path that always supplies `lambdaScalar=1.0` (mimicking a runtime that ignores the option). Result: `delta = 0.00000000` (vs required `≥ 0.01`); both the magnitude-floor gate AND the `notStrictEqual` gate would FAIL. The test's pass condition requires the runtime to actually exercise `lambdaScalar`. |

The original blocker is mechanically and semantically resolved.

### 2. Authorized `src/` scope (audit priority #2)

| Check | Result |
|---|---|
| Only `src/theatres/proton-cascade.js` modified under `src/` | ✓ Verified — `git status --short src/` shows exactly one modified file. `git diff --stat src/` reports `1 file changed, 27 insertions(+), 5 deletions(-)`. |
| `src/rlmf/certificates.js` zero diff | ✓ Verified — `git diff src/rlmf/` returns 0 lines. |
| No other theatre files changed | ✓ Verified — `git diff` against `src/theatres/cme-arrival.js`, `src/theatres/flare-gate.js`, `src/theatres/geomag-gate.js`, `src/theatres/solar-wind-divergence.js` all return 0 lines. |
| `src/oracles/`, `src/processor/`, `src/index.js` zero diff | ✓ Verified — all three return 0 lines. |
| `lambdaScalar` is default-preserving | ✓ Verified at code level: [src/theatres/proton-cascade.js:127](../../../../src/theatres/proton-cascade.js) — `function estimateExpectedCount(triggerClass, windowHours, lambdaScalar = 1.0)`; [line 138](../../../../src/theatres/proton-cascade.js) — `params.lambda * lambdaScalar * intensityMultiplier * (...)`. For `lambdaScalar = 1.0`, IEEE-754 guarantees `params.lambda * 1.0 === params.lambda` byte-identically. Verified at runtime by Direction B trajectory_hash byte-identity to Sprint 03 run-1 anchor (5/5 events). |
| No default runtime behavior drift | ✓ Verified — Direction B trajectory_hashes match cycle-002-run-1 anchor for all 5 T4 events: `16c69988…`, `839fbf32…`, `7a43441a…`, `2815728f…`, `c1cad8e0…`. trajectory_hash is computed over the entire trajectory canonical JSON; byte-equality of the hash implies byte-equality of every trajectory field including `current_position_at_cutoff`, `position_history_at_cutoff`, `gate_params`, `outcome`, and `meta.{corpus_event_hash, cutoff_hash, gate_params_hash}`. |
| No permanent runtime parameter change | ✓ Verified — `PRODUCTIVITY_PARAMS` literal values at [src/theatres/proton-cascade.js:101–105](../../../../src/theatres/proton-cascade.js) are byte-unchanged: `X_class: { lambda: 8, decay: 0.85 }`, `M_class: { lambda: 4, decay: 0.90 }`, `default: { lambda: 3, decay: 0.92 }`. The seam scales at call time; the const is not mutated. No-refit covenant ([CHARTER §8.3](../sprint-00/CHARTER.md)) holds. |

`src/` scope strictly within operator authorization.

### 3. Replay-seam wiring (audit priority #3)

| Check | Result |
|---|---|
| `scripts/corona-backtest/replay/t4-replay.js` forwards `lambdaScalar` | ✓ Verified at [scripts/corona-backtest/replay/t4-replay.js:67–76](../../../../scripts/corona-backtest/replay/t4-replay.js) — third arg `options = {}`, destructured `{ lambdaScalar = 1.0 } = options`. Forwarded into createX call at [line 144](../../../../scripts/corona-backtest/replay/t4-replay.js): `createProtonEventCascade({...}, { now, lambdaScalar })`. |
| Perturbation happens before/during runtime replay (not after) | ✓ Verified — the option flows BEFORE `createProtonEventCascade` is invoked. The runtime initializes `theatre.productivity.expected_count` with the perturbed value at theatre creation; every subsequent `processProtonEventCascade` step at [src/theatres/proton-cascade.js:382–386](../../../../src/theatres/proton-cascade.js) blends with the perturbed prior. The trajectory's `current_position_at_cutoff` reflects the full perturbed runtime. |
| Direction B uses default/unperturbed path | ✓ Verified — `runT4Direction({ lambdaScalar: 1.0, label: 'B' })` supplies the option-bag default. By IEEE-754 byte-identity, this is equivalent to omitting the option (which is what the live cycle-002 entrypoint does at [scripts/corona-backtest-cycle-002.js:188 and :266](../../../../scripts/corona-backtest-cycle-002.js)). |
| No T1/T2/T3/T5 replay/scoring behavior changed | ✓ Verified — `scripts/corona-backtest/replay/t1-replay.js`, `t2-replay.js`: `git diff` returns 0 lines. T3/T5 scoring modules unchanged. The only change in the replay file set is `t4-replay.js`. T1/T2/T3/T5 trajectory shape, determinism, and scoring tests remain green (verified by full `npm test`). |

Replay wiring is correct.

### 4. Brier proof verification (audit priority #4)

I ran the actual proof from primary sources at audit time:

```
Perturbed (lambdaScalar=1.25) Brier: 0.39533664
Default   (no option)         Brier: 0.38183588
Delta:                               0.01350076
Trajectory hashes differing:         5/5
```

| Check | Expected | Actual | Match |
|---|---|---|---|
| Baseline B T4 Brier | `0.38183588` | `0.38183588` (cycle-002-run-1 anchor entry; live `dispatchCycle002Replay` confirms) | ✓ |
| Direction A T4 Brier | `0.39533664` | `0.39533664` (live runtime with `lambdaScalar=1.25`) | ✓ |
| Direction A delta | `+0.01350076` | `+0.01350076` (above 0.01 floor) | ✓ |
| Direction B T4 Brier | `0.38183588` | `0.38183588` (live runtime with `lambdaScalar=1.0` default) | ✓ |
| Direction B byte-identity to Baseline B | true | true (Brier `assert.strictEqual` + 5/5 trajectory_hash deepStrictEqual gates) | ✓ |
| Direction B trajectory hashes match run-1 anchor (all 5 T4 events) | 5/5 | **5/5** byte-identical | ✓ |
| Direction A trajectory hashes differ from run-1 anchor (≥1 of 5 T4 events) | ≥1 | **5/5** differ | ✓ (stronger than required) |

The Brier proof is correct. The Direction A delta of `+0.01350076` (3.5% relative) is concentrated on 2/5 events (T4-2022-01-20-S1 with M5.5 trigger and T4-2024-05-15-S1 with X1.0 trigger); the other 3/5 events saturate to bucket-4 in both lambda regimes (X9.3, X8.2, X8.7 triggers produce expectedCount ≈ 49–55 at lambda=8 and ≈ 62–69 at lambda=10, both well past the bucket-4 saturation point). This is corpus-shape-foreclosed for cycle-002 — not a defect.

### 5. Scope boundaries (audit priority #5)

| Check | Result |
|---|---|
| T4 only | ✓ All `dispatchCycle002Replay` and `loadCorpusWithCutoff` calls in `tests/sensitivity-proof-T4-test.js` filter `theatres: ['T4']`. T1/T2/T3/T5 not exercised by Sprint 05 work. |
| No T1/T2 sensitivity proof | ✓ Verified (negative). `grep -E "lambdaScalar.*T[12]\|T[12].*lambdaScalar"` in test returns 0 hits. T1/T2 corpus shape forecloses anyway per [PRD §4](../PRD.md) honest framing. |
| No T3/T5 sensitivity proof | ✓ Verified (negative). T3/T5 remain `diagnostic_only: true` in cycle-002 manifest; postures from Sprint 04 `[external-model]` and `[quality-of-behavior]` hold verbatim. |
| No "calibration-improved" claim | ✓ Verified — all mentions of "calibration-improved" in Sprint 05 docs are negative declarations: reviewer.md:61 ("no calibration-improved claim"), reviewer.md:231 ("not a calibration-improved claim"), run-2/sensitivity-summary.md:41 ("This is **not** a calibration-improved claim"), run-3/sensitivity-summary.md:41 (same). 0 mentions in the cycle-002 manifest. |
| No "L2-publish" / "L2 publish-ready" claim | ✓ Verified — all mentions are negative declarations or citations of forbidding language. |
| No "forecasting accuracy improved" / "empirical performance improvement" / "verifiable track record" claim | ✓ Verified — these phrases appear only in engineer-feedback.md as audit checks confirming their absence. They do not appear in reviewer.md, manifest, or sensitivity-summary artifacts as positive claims. |
| No README/BFZ/version/tag/Sprint 06 work | ✓ Verified — `git status` shows no README or BFZ changes; `package.json:3` `"version": "0.2.0"` unchanged; no v0.3.* tag (`git tag --list` shows only `loa@v1.101.0`, `v0.1.0`, `v0.2.0` — no new tag); `grimoires/loa/a2a/cycle-002/sprint-06/` does not exist (`ls` returns "No such file or directory"). |

Scope discipline is intact.

### 6. Frozen invariants (audit priority #6)

| Invariant | Expected sha256 | Actual sha256 | Match |
|---|---|---|---|
| `scripts/corona-backtest.js` | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` | ✓ |
| cycle-001 `calibration-manifest.json` | `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` | `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` | ✓ |
| `corpus_hash` (across run-1, run-2, run-3) | `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` | `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` (all three) | ✓ |
| Sprint 03 `cycle-002-run-1/` directory | unchanged | `git status --short` empty; `git diff` returns 0 lines | ✓ |
| Cycle-001 `run-1/`, `run-2/`, `run-3-final/` directories | unchanged | `git diff` returns 0 lines for all three | ✓ |

Frozen invariants verified at audit time by `openssl dgst -sha256` and `git diff`.

### 7. Manifest / provenance (audit priority #7)

| Check | Result |
|---|---|
| Cycle-002 manifest extension is additive | ✓ Verified. Top-level fields preserved verbatim: `run_id: cycle-002-run-1`, `generated_at: 2026-05-02T17:15:36.497Z`, `code_revision: 2bb5f85d…`, `corpus_hash: b1caef3f…`, `cycle_001_script_hash: 17f6380b…`, `replay_script_hash: bfbfd70d…` (Sprint 03 anchor at top level — historical), `replay_script_hash_files` (12-file set), `theatre_posture`, `runtime_uplift_composite_membership`, `entries[]` (5 entries: T1/T2/T4 anchors + T3/T5 diagnostic-only). |
| Top-level Sprint 03 anchor preserved | ✓ Verified — same as above. |
| `sensitivity_proof.baseline_B.t4_brier` = 0.38183588 | ✓ Verified. |
| `sensitivity_proof.direction_A.t4_brier` = 0.39533664 | ✓ Verified. |
| `sensitivity_proof.direction_B.t4_brier` = 0.38183588 | ✓ Verified. |
| `sensitivity_proof.direction_B.byte_identical_to_baseline_B` = true | ✓ Verified. |
| `sensitivity_proof.direction_A.trajectory_hashes_differ_from_baseline_B` = true | ✓ Verified. |
| `sensitivity_proof.perturbation.mechanism` documents real runtime injection | ✓ Verified — phrase "Real runtime injection. Direction A passes lambdaScalar=1.25 to replay_T4_event's third options arg... NO post-runtime distribution substitution." |
| `sensitivity_proof.perturbation.scope` is T4-only | ✓ Verified — knob = "PRODUCTIVITY_PARAMS lambda (Wheatland-prior productivity scalar)", knob_source = "src/theatres/proton-cascade.js lines 101–105". No T1/T2/T3/T5 reference in the perturbation. |
| `sensitivity_proof.provenance.replay_script_hash_at_sprint_05` matches live computed hash | ✓ Verified at audit time: live `computeReplayScriptHash(REPO_ROOT)` returns `a919ec7d3f472f65435b0e6bec9b2c4e082e40186ceecc8921b527013470940b`; manifest field stores the same value. |
| `sensitivity_proof.provenance.src_theatres_proton_cascade_hash_at_sprint_05` matches live file hash | ✓ Verified at audit time: live `sha256(src/theatres/proton-cascade.js)` returns `095ef077541ba0bfc994b253d0c1572abbd0479db10e2de7e06ddd1e0d38d549`; manifest field stores the same value. |
| `sensitivity_proof.provenance.replay_script_hash_drift_reason` documents the cause | ✓ Verified — explains "Sprint 05 added a default-preserving lambdaScalar option-bag arg to scripts/corona-backtest/replay/t4-replay.js (in the cycle-002 replay file set), which changes its sha256 and therefore the aggregate replay_script_hash. Default behavior (lambdaScalar=1.0, never supplied by the live runtime path) is byte-identical to pre-Sprint-05 — verified by Direction B byte-identity to Baseline B numerics + trajectory hashes." |
| `sensitivity_proof.provenance.src_theatres_proton_cascade_dependency_note` justifies the new dependency | ✓ Verified — explains the operator authorization, default-preservation, and PRODUCTIVITY_PARAMS literal values unchanged. |
| `sensitivity_proof.invariants_verified` flags all true | ✓ Verified — 8 flags: `corpus_hash_unchanged`, `cycle_001_script_hash_unchanged`, `cycle_001_manifest_hash_unchanged`, `cycle_002_run_1_artifacts_preserved`, `no_t1_t2_t3_t5_perturbation`, `no_rlmf_certificate_change`, `no_dependency_change`, `package_version_unchanged` — all `true`. |
| Cycle-001 manifest not mutated | ✓ Verified — sha256 = `e53a40d1…5db34a` (unchanged). |

Provenance is honest and complete.

### 8. Tests / dependencies (audit priority #8)

| Check | Result |
|---|---|
| `npm test` passes | ✓ Verified at audit time: **296 pass / 0 fail / 0 skip / 0 cancelled / 0 todo**, duration_ms 423. |
| Expected 296/0/0 | ✓ Match. |
| No tests removed/skipped/weakened | ✓ Verified — `git diff package.json` shows only the test-script wiring (carry-forward from previous Sprint 05 iteration adding `tests/sensitivity-proof-T4-test.js`). All 279 pre-existing tests are still listed and run; the previous Sprint 05 iteration's 14-test count was replaced by 17 tests (3 new Path B gates added to the same file: byte-identical trajectory_hashes for Direction B, scoring-consumes-runtime-output programmatic gate, Direction A trajectory differs from Baseline B). |
| Package version remains `0.2.0` | ✓ Verified — `package.json:3` unchanged. |
| Dependencies remain `{}` | ✓ Verified — `package.json` `"dependencies": {}` unchanged. |

Test suite and dependency surface are clean.

### 9. Honest framing (audit priority #9)

| Check | Result |
|---|---|
| "Runtime-sensitive" claim valid for T4 | ✓ Verified. The claim is `Rung 2 (runtime-sensitive)` per CHARTER §10. The proof is a real runtime-harness sensitivity proof (perturbation flows through the runtime path; trajectory output reflects the perturbation; scoring consumes runtime output directly). The claim is justified. |
| No "calibration-improved" claim | ✓ All mentions negative — see #5 above. |
| No "forecasting accuracy improved" / "empirical performance improvement" / "verifiable track record" | ✓ Phrases absent from all Sprint 05 deliverables (reviewer.md, manifest, sensitivity-summary artifacts). They appear only in engineer-feedback.md as audit checks confirming their absence. |
| No Baseline A vs Baseline B uplift comparison | ✓ Verified. The only mention in [engineer-feedback.md:111](engineer-feedback.md) is the negative confirmation: "reviewer.md does not compare cycle-001 Baseline A against cycle-002 Baseline B." reviewer.md and manifest do not perform this forbidden comparison. |
| No generalization to T1/T2/T3/T5 | ✓ Verified — Sprint 05 deliverables explicitly state T4-only scope. The cycle-002 sprint plan's T1/T2 deferral and T3/T5 forbidden status from Sprint 04 hold verbatim. |

Honest framing is preserved.

### 10. Re-examination of reviewer NB1/NB2/NB3 (audit priority #10)

| NB | Reviewer concern | Audit evaluation | Verdict |
|---|---|---|---|
| NB1 | `processProtonEventCascade` does not accept `lambdaScalar` directly | The runtime sets `theatre.productivity.expected_count = Math.round(expectedCount * 10) / 10` at theatre creation (with the perturbed lambda), and `processProtonEventCascade`'s blend formula at [src/theatres/proton-cascade.js:382–386](../../../../src/theatres/proton-cascade.js) uses `theatre.productivity.expected_count` directly. The perturbation propagates correctly through every blend step *under current runtime semantics*. Empirical proof: Direction A perturbation IS observable in events with qualifying-event evolution (T4-2022-01-20-S1 distribution changes from `[0,0,0.011,0.141,0.847]` to `[0,0,0.001,0.032,0.967]` under lambda × 1.25). A future change adding mid-trajectory productivity recompute would silently bypass — but that is a future-cycle concern, and the Sprint 05 test's Direction B byte-identity gate would catch any default-preservation drift. | **Non-blocking** — no Sprint 05 correctness/safety/provenance issue. Note for future cycle if mid-trajectory productivity update is added. |
| NB2 | `lambdaScalar` lacks input validation | The seam is documented as test-only. The cycle-002 entrypoint at [scripts/corona-backtest-cycle-002.js:188 and :266](../../../../scripts/corona-backtest-cycle-002.js) does not pass the option (verified). No CLI flag, no env var. The only callers in production code are: (a) the live runtime, which never supplies the option (always defaults to 1.0); (b) `tests/sensitivity-proof-T4-test.js`, which always passes 1.0 or 1.25 (verified by reading the test). No path can supply NaN, 0, or negative values to the seam. **Security audit**: the seam does not introduce new attack surface — it is callable only by code that imports `createProtonEventCascade` (any importer can already pass arbitrary corpus events; the lambdaScalar arg is a small additional surface that defaults to 1.0). | **Non-blocking** — no Sprint 05 correctness/safety/provenance issue. Optional future hardening: add `if (!Number.isFinite(lambdaScalar) \|\| lambdaScalar <= 0) throw new Error(...)` if the seam scope ever expands beyond Sprint 05. |
| NB3 | `runT4Direction` duplicates per-event aggregation logic | The duplication is necessary: `dispatchCycle002Replay` must NOT accept `lambdaScalar` (the cycle-002 entrypoint is in the replay_script_hash file set; modifying it expands scope beyond operator authorization). Test-side `runT4Direction` is the minimum-surface path. The aggregation logic is identical to `scoreCorpusT4PerEventDispatch` (verified by reading both): per-event loop calling `scoreEventT4(event, trajectory.current_position_at_cutoff)`, then `brier = perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length`. No semantic divergence. | **Non-blocking** — no Sprint 05 correctness/safety/provenance issue. Cosmetic concern; future engineer should be aware via the JSDoc comment in `runT4Direction`. |

None of NB1/NB2/NB3 escalate to blocking. None create a real Sprint 05 issue.

---

## Adversarial security check

Beyond the operator's enumerated checks, I performed additional security-focused audits:

### A. Attack surface analysis of the `lambdaScalar` seam

The seam is reachable from any code that imports `createProtonEventCascade` from `src/theatres/proton-cascade.js`. This is a public export already exercised by tests, the cycle-002 replay path, and (potentially) future code.

- **Callers in src/**: `src/index.js` (re-exports the module via `./theatres/*`), but no live call site supplies `lambdaScalar` (none was added in Sprint 05).
- **Callers in scripts/**: only `scripts/corona-backtest/replay/t4-replay.js` (the seam-aware caller); it forwards `lambdaScalar` from its own third-arg options. The cycle-002 entrypoint does NOT pass options to `replay_T4_event` (verified).
- **Callers in tests/**: `sensitivity-proof-T4-test.js` (always passes 1.0 or 1.25), and pre-existing T4 trajectory tests (none pass options; default 1.0 applies).

**Conclusion**: the live runtime path always operates with `lambdaScalar = 1.0`. The seam cannot be abused to perturb production behavior without a code-level test/import change.

### B. `PRODUCTIVITY_PARAMS` literal-value preservation

The const at [src/theatres/proton-cascade.js:101–105](../../../../src/theatres/proton-cascade.js) is byte-unchanged:

```js
const PRODUCTIVITY_PARAMS = {
  X_class: { lambda: 8,  decay: 0.85 },
  M_class: { lambda: 4,  decay: 0.90 },
  default: { lambda: 3,  decay: 0.92 },
};
```

The seam does NOT mutate this const; it only multiplies at call time. The no-refit covenant ([CHARTER §8.3](../sprint-00/CHARTER.md)) is preserved.

### C. RLMF certificate non-mutation

`git diff src/rlmf/` returns 0 lines. The pre-existing `replay-rlmf-cert-non-mutation-test.js` test remains green. Q1 freeze ([CHARTER §10](../sprint-00/CHARTER.md)) is preserved.

### D. cycle-002-run-1 immutability (Sprint 03 historical anchor)

`git status --short grimoires/loa/calibration/corona/cycle-002-run-1/` returns empty. `git diff` returns 0 lines. All five files (`corpus_hash.txt`, `replay_script_hash.txt`, `cycle_001_script_hash.txt`, `runtime-uplift-summary.md`, `diagnostic-summary.md`) are byte-identical to Sprint 03 close. The historical evidence is preserved.

### E. Cycle-001 entrypoint and manifest immutability

- `scripts/corona-backtest.js` sha256 = `17f6380b…1730f1` (unchanged) — verified at audit time.
- `grimoires/loa/calibration/corona/calibration-manifest.json` sha256 = `e53a40d1…5db34a` (unchanged) — verified at audit time.
- Cycle-001 run outputs (`run-1/`, `run-2/`, `run-3-final/`) `git diff` returns 0 lines.

I1 (cycle-001 entrypoint freeze, [CHARTER §6](../sprint-00/CHARTER.md)) preserved.

### F. No hardcoded secrets / no PII

The Sprint 05 changes (proton-cascade.js, t4-replay.js, sensitivity-proof-T4-test.js, manifest, run-2/run-3 artifacts) do NOT contain:
- Hardcoded credentials, API keys, tokens, or webhooks (verified by inspection)
- PII (only space-weather event identifiers like flare class, event timestamps, hashes)
- Secrets in test fixtures or configuration

### G. No injection vulnerabilities

The lambdaScalar parameter is a number that flows directly into a multiplication. It does NOT flow into:
- Shell commands (no `exec` / `spawn` involvement)
- SQL queries (no DB)
- HTML / DOM (no UI surface)
- Filesystem paths (no path construction)
- Regex patterns (no dynamic regex)
- Network requests (no fetch/HTTP from the seam)

Numeric input → numeric multiplication → numeric output. No injection class applies.

### H. Test idempotency (replay-twice byte-identical)

The "Direction A: replay-twice byte-identical determinism" and "Direction B: replay-twice byte-identical determinism" gates verify that repeated test runs produce identical aggregate Brier, per-event distributions, per-event Brier, AND per-event trajectory_hashes. This rules out any nondeterministic behavior in the perturbed runtime path. Verified by `npm test` passing.

---

## Adversarial Analysis (per protocol)

### Concerns Identified

1. **Concern**: The `lambdaScalar` seam is callable by any module that imports `createProtonEventCascade`. While the live runtime does not pass it today, there is no compile-time guarantee that future code won't accidentally supply a non-default value. The default-preservation discipline is enforced by **convention** (documented in JSDoc), not by **language**. **Mitigation**: the Sprint 05 test's Direction B byte-identity gate to run-1 anchor catches any drift fast; the existing `tests/cycle-002-entrypoint-test.js` "replay-twice byte-identical determinism" gate also catches drift in the cycle-002 path. **Severity**: LOW. Non-blocking.

2. **Concern**: The 3/5 events that saturate to bucket-4 (X9.3, X8.2, X8.7 triggers) means the aggregate Brier delta is driven by 2/5 events. The Direction A signal is still measurable (+0.01350076) and well above the 0.01 floor, but a future corpus drift (e.g., adding more saturating events) could erode the signal margin. **Mitigation**: corpus is frozen for cycle-002; future-cycle corpus enlargement should preserve enough non-saturating events. **Severity**: LOW. Non-blocking.

3. **Concern**: The replay_script_hash drift from `bfbfd70d…380a60` to `a919ec7d…40940b` is documented in the manifest's `sensitivity_proof.provenance` block, but the top-level manifest field `replay_script_hash` still records the OLD Sprint 03 anchor value. This dual-recording is correct (top-level represents run-1's generation context; sensitivity_proof represents Sprint 05 state), but a casual reader of the top-level field could be misled into thinking the current code matches `bfbfd70d…380a60`. **Mitigation**: the cycle-002 manifest's top-level fields explicitly carry `run_id: cycle-002-run-1` and `generated_at: 2026-05-02T17:15:36.497Z` (Sprint 03 timestamp), making the historical context clear. The sensitivity_proof block is the contemporaneous Sprint 05 record. **Severity**: LOW. Non-blocking; consider adding a top-level `note` field in a future cycle to flag the dual-state.

### Assumptions Challenged

- **Assumption**: The implementation assumes that introducing an additional `* lambdaScalar` multiplication into the `expectedN` formula at [src/theatres/proton-cascade.js:138](../../../../src/theatres/proton-cascade.js) does not change IEEE-754 semantics for `lambdaScalar = 1.0`. This holds because `(x * 1.0) === x` byte-identically per IEEE-754, AND the V8 JavaScript engine (Node 20+) preserves IEEE-754 semantics rigorously. **Risk if wrong**: Direction B byte-identity to run-1 anchor would fail; existing `tests/cycle-002-entrypoint-test.js` "replay-twice byte-identical determinism" gate would also fail. **Mitigation**: both gates run on every test invocation; any drift is caught immediately. **Severity**: extraordinarily unlikely to manifest; enough fail-fast safety.

### Alternatives Not Considered

- **Alternative**: Instead of adding `lambdaScalar` to `createProtonEventCascade`'s second-arg option-bag, an alternative would have been to introduce a separate exported function `createProtonEventCascadeWithPerturbation(lambdaScalar)` that wraps `createProtonEventCascade`. **Tradeoff**: more surface (a new export), but cleaner separation between live and test paths. **Verdict**: the chosen approach (option-bag with default) is superior — it parallels Sprint 02's `{ now }` pattern verbatim, which is the spec-cited precedent. The convention is established.

---

## Karpathy principles assessment

| Principle | Status | Rationale |
|---|---|---|
| Think Before Coding | ✓ | Engineer halted at the previous review's blocker, surfaced the design constraint to the operator, awaited authorization, then implemented Path B exactly. Reviewer.md surfaces all assumptions explicitly. |
| Simplicity First | ✓ | src/ change is `+27 / -5` (only necessary plumbing); replay-seam change is `+12 / -1` (minimal forward); test rewrite removed ~80 lines of test-side reimplementation in favor of importing the real runtime. Net simpler than iteration 1. |
| Surgical Changes | ✓ | Four files modified (1 src/, 1 replay, 1 manifest, 1 package.json) plus four new files (test, run-2, run-3, sprint-05 docs). No drive-by edits. PRODUCTIVITY_PARAMS literal values byte-unchanged. |
| Goal-Driven | ✓ | Each new test gate is a falsifiable property: byte-identity to run-1 anchor; Direction A delta above floor; trajectory differs ≥1; scoring-consumes-runtime; replay-twice determinism. AC table walks 36 ACs with file:line evidence. |

All principles satisfied.

---

## Answer to the main audit question

**Q: Does Sprint 05 now prove T4 runtime replay harness sensitivity, not scorer-only sensitivity?**

**A: Yes.**

Specifically:

1. **The perturbation flows through the actual cycle-002 runtime path**: `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })` → `createProtonEventCascade({...}, { now, lambdaScalar: 1.25 })` → `estimateExpectedCount(triggerClass, windowHours, 1.25)` → `lambda = params.lambda * 1.25` → `expectedN` shifted → `theatre.productivity.expected_count` perturbed → every `processProtonEventCascade` blend uses perturbed value → `current_position_at_cutoff` reflects perturbation.

2. **Scoring consumes runtime output directly**: `scoreEventT4(event, trajectory.current_position_at_cutoff)`. No substitution. Programmatic gate verifies by re-invoking the runtime independently.

3. **Adversarial test confirms runtime exercise**: I ran a parallel call path with the option silently dropped (mimicking a runtime that ignores `lambdaScalar`); Direction A delta dropped to 0.0 and the test gates would FAIL. The current proof depends on the runtime actually exercising the perturbation.

4. **Direction B byte-identity at trajectory-hash level**: 5/5 per-event trajectory_hashes byte-identically match Sprint 03 run-1 anchor. trajectory_hash is computed over the entire trajectory canonical JSON; equality at the hash implies byte-equality at every field, including `current_position_at_cutoff`.

5. **Empirical sensitivity is real**: Direction A T4 Brier `0.39533664` differs from Baseline B `0.38183588` by `+0.01350076` (~3.5% relative). The change reflects the full perturbed runtime path including post-event blending.

This is harness sensitivity, not scorer sensitivity. The Rung 2 (`runtime-sensitive`) claim is justified.

---

## Answer to the operator's secondary question

**Q: Does Sprint 05 earn Rung 2 runtime-sensitive for T4?**

**A: Yes.**

Per [CHARTER §10](../sprint-00/CHARTER.md) Rung 2 definition: *"Rung 1 + a controlled perturbation of one T4 knob (per Q8) changes T4's cycle-002-replay Brier by a measurable amount; reverting the perturbation restores the Brier byte-identically; perturbation diff documented; corpus_hash invariant preserved across both directions."*

| Rung 2 sub-criterion | Status |
|---|---|
| Rung 1 (runtime-wired) earned at Sprint 03 close | ✓ Pre-existing; cycle-002-run-1 anchor is the Rung 1 evidence. |
| Controlled perturbation of one T4 knob (Q8: PRODUCTIVITY_PARAMS lambda) | ✓ `lambdaScalar = 1.25` scales `params.lambda` from 8/4/3 to 10/5/3.75 at call time. |
| Changes T4 cycle-002-replay Brier by a measurable amount | ✓ Δ = `+0.01350076` (≥ 0.01 documented floor). |
| Reverting the perturbation restores the Brier byte-identically | ✓ `lambdaScalar = 1.0` → Brier = `0.38183588` byte-identical to Baseline B (`assert.strictEqual` IEEE-754 + 5/5 trajectory_hash deepStrictEqual to run-1 anchor). |
| Perturbation diff documented | ✓ [src/theatres/proton-cascade.js diff](../../../../src/theatres/proton-cascade.js) (+27/-5), [replay diff](../../../../scripts/corona-backtest/replay/t4-replay.js) (+12/-1), manifest `sensitivity_proof.perturbation` block, run-2/run-3 sensitivity-summary.md. |
| corpus_hash invariant preserved across both directions | ✓ `b1caef3f…11bb1` in run-1, run-2, run-3 (verified at audit time). |

All Rung 2 sub-criteria met. T4 earns Rung 2 (runtime-sensitive).

---

## Decision

**AUDIT PASSED WITH NON-BLOCKING CONCERNS — APPROVED - LETS FUCKING GO**

Sprint 05 is **ready for operator commit approval**.

The three non-blocking concerns (NB1/NB2/NB3 from the reviewer + the 3 audit-side concerns above) are all LOW severity and do not gate Sprint 05. They are recorded for future-cycle hardening if desired.

No commit. No tag. No Sprint 06 work. Awaiting operator HITL on whether to commit the Sprint 05 deliverables.

---

## Operator briefing (for HITL commit decision)

For the operator's commit decision — what's ready to commit:

| File | Change | Provenance |
|---|---|---|
| `src/theatres/proton-cascade.js` | M (`+27/-5`) | Operator-authorized Path B edit; default-preserving option-bag; PRODUCTIVITY_PARAMS literals byte-unchanged. |
| `scripts/corona-backtest/replay/t4-replay.js` | M (`+12/-1`) | Replay-seam forwarding; in cycle-002 replay file set; default-preserving. |
| `tests/sensitivity-proof-T4-test.js` | NEW | Sprint 05 sensitivity proof; 17 tests; uses real runtime (no test-side reimpl). |
| `grimoires/loa/calibration/corona/cycle-002-run-2/` | NEW | Direction A artifacts (Brier 0.39533664). |
| `grimoires/loa/calibration/corona/cycle-002-run-3/` | NEW | Direction B artifacts (Brier 0.38183588 byte-identical). |
| `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` | M (additive `sensitivity_proof` block) | Honest provenance of replay_script_hash drift + new src/theatres/proton-cascade.js dependency. Top-level Sprint 03 anchor preserved verbatim. |
| `package.json` | M (test wiring; carry-forward) | Adds `tests/sensitivity-proof-T4-test.js` to npm test script. Version `0.2.0` unchanged. |
| `grimoires/loa/a2a/cycle-002/sprint-05/reviewer.md` | NEW | Implementation report (Path B). |
| `grimoires/loa/a2a/cycle-002/sprint-05/engineer-feedback.md` | NEW | Re-review feedback (APPROVED WITH NON-BLOCKING CONCERNS). |
| `grimoires/loa/a2a/cycle-002/sprint-05/engineer-review-response.md` | NEW | Engineer's response to the previous CHANGES_REQUIRED. |
| `grimoires/loa/a2a/cycle-002/sprint-05/auditor-sprint-feedback.md` | NEW (this file) | Audit verdict. |
| `grimoires/loa/a2a/cycle-002/sprint-05/COMPLETED` | NEW (will be created on audit pass) | Sprint completion marker. |

**Frozen invariants verified at audit time**: `scripts/corona-backtest.js` `17f6380b…1730f1` ✓, cycle-001 manifest `e53a40d1…5db34a` ✓, corpus_hash `b1caef3f…11bb1` ✓, `src/rlmf/` zero diff ✓, package version `0.2.0` ✓, dependencies `{}` ✓.

**No version bump, no tag, no Sprint 06 work** — awaiting operator decision on commit.
