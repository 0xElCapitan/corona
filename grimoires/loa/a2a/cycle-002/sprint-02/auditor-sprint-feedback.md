# Sprint 2 — Auditor Feedback (cycle-002 / sprint-02)

**Auditor**: Paranoid Cypherpunk Auditor (audit-sprint skill)
**Date**: 2026-05-02
**Implementation under audit**: Sprint 2 milestones 1 + 2 (deterministic replay seam, T4 + T1/T2 binary)
**Authority**: cycle-002 design-doc chain (cycle-002 not in Sprint Ledger)
**Prior gate**: review-sprint **APPROVED with non-blocking concerns** ([engineer-feedback.md](engineer-feedback.md))

---

## Verdict: **APPROVED — with one recommended pre-commit fix and one recommended clarification**

The implementation is security-clean and structurally sound against the operator's binding focus areas. **No security blockers.** The single recommended fix (S2-C4 dead-code removal) is principled and trivial; the operator may apply it or waive it as benign forward-compat. The recommended clarification (S2-C2 framing) is documentation-only.

### Audit focus area pass/fail

| Audit focus | Verdict | Notes |
|-------------|---------|-------|
| Evidence leakage | ✓ Clean | Pre-cutoff filter is strict (`<= cutoffMs`); settlement fields (`flare_class_observed`, `kp_*_observed`, `_derived.qualifying_event_count_observed_derived`) used ONLY for outcome derivation, never for trajectory production. `corpusEventForHash` strips `_derived` + `_file` before hashing. See **§A1 below** for one structural-not-programmatic concern. |
| Nondeterminism | ✓ Clean | Zero `Date.now()` in replay path (only in comments + error message strings — verified by grep). Zero `Math.random` / `new Set` / `new Map` in `scripts/corona-backtest/replay/`. Bundle sort is stable (V8 TimSort) and operates on distinct event_times. structuredClone on plain objects is deterministic. |
| Replay-mode fail-closed behavior | ✓ Clean | `deriveReplayClockSeed` throws explicit "no `Date.now()` fallback" error; tested for T1, T2, T4 missing-seed cases. |
| Default-preserving live runtime behavior | ✓ Clean | 160 cycle-001 tests pass without modification; `src/index.js` zero diff; 15 new clock-default tests across both default-preserving test files. |
| T1/T2 binary scoring correctness | ✓ Clean | Binary Brier `(p-o)^2` formula matches CONTRACT §8.1+§8.2 + `src/rlmf/certificates.js:24` `brierScoreBinary`. T2 GFZ-preferred outcome implements `kp_gfz_observed ?? kp_swpc_observed` correctly. Independent formula per hard constraint #5 / SDD §6.4. |
| No fake bucket projection | ✓ Clean | T1/T2 trajectories carry scalar `current_position_at_cutoff` directly from runtime; `distribution_shape: 'binary_scalar'`. Legacy 6-bucket scorers zero-diff (smoke import in milestone-2 test verifies). |
| T4 runtime bucket replay correctness | ✓ Clean | Synthetic trigger bundle uses `flareRank()` correctly; X-class events qualify the M5+ gate; pre-cutoff bundles materialised from `proton_flux_observations` with strict `event_time < cutoff` filter; frame-time clock advances per-bundle. **Note**: synthetic trigger bundle uses `payload.timing.begin = trigger_flare_peak_time` (peak ≈ begin approximation since cycle-001 corpus lacks separate begin field — informational only, doesn't affect determinism). |
| RLMF certificate non-mutation | ✓ Clean | `git diff HEAD -- src/rlmf/certificates.js` empty. Cert version pinned at '0.1.0'; runtime field names retained. Test exists for T4 path; T1 covered by cycle-001 baseline; T2/T3/T5 covered structurally (cert.js zero-diff + theatre.current_position shapes unchanged + brierScoreBinary unchanged). See **§A2 below**. |
| Cycle-001 manifest/docs/runs untouched | ✓ Clean | Verified zero-diff: `grimoires/loa/calibration/`, `grimoires/loa/{prd,sdd,sprint,NOTES}.md`, `grimoires/loa/a2a/sprint-{0..7}/`, `BUTTERFREEZONE.md`, `README.md`. corpus_hash file in `run-3-final/` retains `b1caef3f…11bb1`; script_hash retains `17f6380b…1730f1`. `manifest_regression_test.js` PASS. |
| package.json script additions | ✓ Clean | Single line modification (`scripts.test`), additive 11 entries. `dependencies: {}` and `engines.node: ">=20.0.0"` invariants preserved. Version `0.2.0` unchanged. |
| Tests prove the claimed gates | ✓ Mostly | All claimed gates have direct test evidence except: T1/T2 do NOT have a "trajectory differs from base_rate" assertion equivalent to T4's "differs from UNIFORM_PRIOR". Documented gap per S2-C2. See **§A3 below**. |
| Provenance gap for `replay_script_hash` | ✓ Clean (deferred) | Documented in `reviewer.md` as Sprint 3 hand-off. No cycle-002 manifest exists yet; cycle-001 `script_hash` (= sha256 of `scripts/corona-backtest.js` only) is preserved unchanged because that entrypoint is zero-diff. The provenance binding for Sprint 3 is explicit. |

---

## Adversarial Findings (Auditor Lens)

### §A1 — Evidence-leakage prevention is by code-reading discipline, not structural invariant

**Finding**: The pre-cutoff vs settlement separation is enforced by **author convention**, not by a programmatic invariant on the corpus event object. Specifically:

- `t4-replay.js` reads `corpus_event._derived.qualifying_event_count_observed_derived` for **outcome** ([line 154](../../../../scripts/corona-backtest/replay/t4-replay.js))
- `t4-replay.js` reads `corpus_event.proton_flux_observations` for **pre-cutoff bundle materialisation** ([line 110](../../../../scripts/corona-backtest/replay/t4-replay.js))

Both reads happen on the SAME corpus event object. A future refactor or a careless contributor could feed `_derived` fields into the pre-cutoff bundle list (or vice versa) and the leak would be silent — there's no envelope or schema split that prevents it.

**Severity**: LOW. No actual leak in current code. Future-proofing concern.

**Mitigation (Sprint 3 candidate, NOT a Sprint 2 blocker)**: When `loadCorpusWithCutoff` lands in Sprint 3 (per REPLAY-SEAM §6), have the loader return separate `evidence_pre_cutoff[]` and `settlement_post_cutoff{}` objects. Replay modules then consume only the former; outcome derivation uses only the latter. This is the structural invariant CONTRACT §7.3 already specifies.

**Audit verdict**: NOT BLOCKING for commit. Surface as Sprint 3 hardening directive.

### §A2 — RLMF cert non-mutation test scope

**Finding**: `replay-rlmf-cert-non-mutation-test.js` exercises only T4 (`createProtonEventCascade` → `processProtonEventCascade` → `resolveProtonEventCascade` → `exportCertificate`). T1 cert path is covered by cycle-001 baseline ([tests/corona_test.js:784-820](../../../../tests/corona_test.js)) but T2/T3/T5 cert paths have no explicit test.

**Structural argument why this is OK**: 
- `src/rlmf/certificates.js` is zero-diff (verified).
- T1, T2, T3, T5 all emit scalar `current_position` (binary). The cert export pipeline reads scalar `closing_position` → `brierScoreBinary` → unchanged formula.
- T4 emits 5-bucket array → `brierScoreMultiClass` → unchanged formula.
- Therefore Q1 holds **structurally** for all 5 theatres, not just by test coverage.

**Severity**: LOW. Test coverage gap is residual, not a Q1 violation.

**S2-C3 specific verdict (operator question)**: "Whether T2 needs an explicit cert smoke test before commit" — **NO, NOT REQUIRED FOR COMMIT.** The structural argument is sufficient. Adding a T2 cert smoke test (~30 LOC) is a strong-recommend hardening item for Sprint 3 or a post-commit follow-up, but it does not block the current commit.

### §A3 — T1/T2 lack a base_rate-drift guard

**Finding**: T4 milestone-1 has [tests/replay-T4-scored-through-runtime-bucket-test.js:96-110](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js):
> `runtime trajectory differs from UNIFORM_PRIOR (proves runtime is wired, not falling through to default)`

T1/T2 have no equivalent. Because cycle-001 T1/T2 corpus events lack pre-cutoff time-series evidence, `replay_T1_event` / `replay_T2_event` produce trajectories with `current_position_at_cutoff` exactly equal to the runtime's `base_rate` constant (0.15 for T1, 0.10 for T2).

A future change to those `base_rate` defaults in `src/theatres/flare-gate.js:35` or `src/theatres/geomag-gate.js:39` would silently mutate the T1/T2 trajectory output, and the determinism test wouldn't catch it (it only verifies replay-twice byte-identical, not absolute value stability).

The cycle-001 manifest has NO entries pointing to flare-gate.js or geomag-gate.js (verified by grep), so the manifest_regression_test wouldn't catch this either.

**Severity**: LOW. Real gap, but not a security defect — it's a test-suite robustness concern.

**Mitigation (Sprint 3 candidate, NOT a Sprint 2 blocker)**: Either (a) add an explicit "trajectory.current_position_at_cutoff equals expected base_rate value" assertion for T1/T2, OR (b) when corpus expansion lands and exercises the `process*` code path, add a "differs from base_rate" assertion analogous to T4's UNIFORM_PRIOR test.

**Audit verdict**: NOT BLOCKING. Surface as Sprint 3 hardening item.

### §A4 — `gitHeadRevision()` is dead code with attack surface

**Finding** (S2-C4 elaborated): [scripts/corona-backtest/replay/t4-replay.js:237-243](../../../../scripts/corona-backtest/replay/t4-replay.js) exports:

```javascript
export function gitHeadRevision() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown-revision';
  }
}
```

Verified by grep: this function is **declared but never called**. No test imports it. No production code invokes it. T1/T2 replay modules don't have an equivalent.

**Audit-relevant facts**:
1. The function uses `execSync` from `node:child_process` — this is the ONLY use of `child_process` in the entire `scripts/corona-backtest/replay/` directory.
2. `execSync('git rev-parse HEAD', ...)` is not a security vulnerability per se (no user input, fixed argv). But importing `child_process` into a module that's otherwise pure-data is principle-of-least-surface violation.
3. The function exists for a future Sprint 3 entrypoint use case that does not exist yet — speculative.
4. Karpathy "Simplicity First" prohibits speculative code per the operator's binding implementation order ("Do not build speculative replay modules before the first runtime-wired proof exists.").

**Severity**: LOW (no actual exploit path) but **principle-of-least-surface argues for removal**.

**S2-C4 specific verdict (operator question)**: **YES, recommend removal before commit.** Concrete justification:
1. It's dead code — verified by grep.
2. It's the ONLY child_process import in the replay seam — removing eliminates 100% of subprocess attack surface in `scripts/corona-backtest/replay/`.
3. It violates the operator's binding "smallest path to Rung 1 first" instruction.
4. Re-adding in Sprint 3 is a 7-line change — trivial.

The operator may waive this as benign forward-compat, but the cleaner posture is to remove now.

### §A5 — reviewer.md M2 framing for T1/T2 prior-only trajectories

**Finding** (S2-C2 elaborated): The honest framing IS in reviewer.md, but it's in the "Milestone 2 Notable Decisions / T1/T2 trajectories capture base-rate prior only" section ([reviewer.md "Notable Decisions"](reviewer.md)):

> Cycle-001 T1/T2 corpus events do not carry pre-cutoff time-series evidence (no GOES X-ray series for T1, no per-3hr Kp series for T2). The runtime is invoked once for theatre creation. The trajectory's `position_history_at_cutoff` therefore contains only the initial base-rate entry. This is honest framing per CHARTER §10:
> > Rung 1 (runtime-wired): trajectory is real and deterministic. Rung 3 (calibration-improved): trajectory beats predeclared baseline.
> Milestone 2 earns Rung 1 for T1 and T2.

This is a complete and correct disclosure. However, it lives in the post-AC "Notable Decisions" section — a reader scanning the M2 Executive Summary or the M2 AC blocks could reasonably assume "binary_scalar trajectory" and "scored through binary Brier" mean the runtime is processing evidence. They aren't (for cycle-001 T1/T2 corpus shape).

**S2-C2 specific verdict (operator question)**: **YES, recommend a reviewer.md clarification before commit.** Specifically: add ~3 lines to the M2 Executive Summary or M2 AC-2/AC-3 blocks, explicitly noting that T1/T2 trajectories capture **runtime PRIOR only** (not runtime-PROCESSED state) for cycle-001 corpus shape, and that this satisfies Rung 1 but does NOT exercise the `process*` evidence-update logic. This makes the honest framing impossible to miss.

This is a documentation clarification, not a code change. NON-BLOCKING but strongly recommended for closeout discipline (matches the cycle-001 honest-framing memory binding).

---

## Security Checklist

| Item | Verdict | Notes |
|------|---------|-------|
| Hardcoded secrets | ✓ None | No API keys, tokens, credentials in any new file |
| Auth/Authz | N/A | No auth surface in this sprint |
| Input validation | ✓ Pass | All replay functions validate corpus_event.theatre, distribution_shape, scalar ranges; canonical-json rejects NaN/Infinity/undefined/BigInt/Function/Symbol |
| Data privacy | N/A | No PII; all data is public space-weather |
| API security | N/A | No external API surface added |
| Error handling | ✓ Pass | Throws are explicit with descriptive messages (no info disclosure since we operate on public data); no empty catch blocks (only `gitHeadRevision`'s try/catch which is intentional fallback) |
| Code quality | ✓ Pass | Per `engineer-feedback.md` Karpathy + complexity review |
| Subprocess execution | ⚠ S2-C4 | `execSync` in dead-code function; recommend removal |
| File system writes | N/A | Replay modules are pure functions (no fs writes) |
| Network calls | ✓ None | Replay seam is offline-only |
| Cryptographic operations | ✓ Standard | sha256 via node:crypto; no custom crypto |
| Race conditions | N/A | All replay code is synchronous |

---

## Test Suite Verification

```
$ npm test
ℹ tests 261
ℹ suites 29
ℹ pass 261
ℹ fail 0
ℹ duration_ms ~275
```

Verified independently. All cycle-001 baseline tests (160) preserve. All milestone-1 (54) and milestone-2 (47) new tests pass.

`manifest_regression_test.js` and `manifest_structural_test.js` PASS — confirming cycle-001 manifest line invariants hold.

---

## Audit Verdict Summary

| Question | Answer |
|----------|--------|
| **Audit verdict** | **APPROVED** with one recommended pre-commit fix + one recommended clarification |
| **Blockers** | **NONE.** No security blockers. No correctness blockers. |
| **Recommended fixes before commit** | (1) Remove `gitHeadRevision()` from `t4-replay.js` (S2-C4); (2) Add 2-3 line clarification to reviewer.md M2 Executive Summary about T1/T2 prior-only framing (S2-C2). |
| **Should S2-C4 be removed?** | **YES, recommended.** Dead code; eliminates `child_process` from replay seam (principle of least surface); violates operator's "smallest path to Rung 1 first" binding; trivial to re-add in Sprint 3. Operator may waive as benign forward-compat; cleaner posture is to remove. |
| **Does S2-C2 need a reviewer.md clarification?** | **YES, recommended.** Honest framing IS present but buried in "Notable Decisions"; surface it in the M2 Executive Summary or AC blocks so readers can't miss the prior-only nature of T1/T2 trajectories. Documentation-only, no code change. |
| **Is Sprint 2 commit-ready?** | **YES, after the two recommended fixes are applied.** The two fixes are: 7-line code removal (S2-C4) + 2-3 line doc addition (S2-C2). Total time: <5 minutes. After application, re-run `npm test` to confirm 261/261 still pass. Then sprint is commit-ready. |

### Conditional approval paths

| Path | Action | Outcome |
|------|--------|---------|
| **Recommended** | Apply both fixes, rerun npm test, then commit | Strongest commit posture; cleanest delta |
| **Acceptable with waiver** | Apply S2-C2 doc clarification only; explicitly waive S2-C4 in commit message as "speculative export retained for Sprint 3 entrypoint convenience" | Acceptable; document the waiver |
| **Acceptable with disclosure** | Commit as-is; both fixes deferred to a follow-up commit before Sprint 3 starts | Acceptable but loses commit-discipline cleanness |

---

## What Sprint 2 commit MUST NOT do

Reaffirmed for clarity:

- MUST NOT modify `src/rlmf/certificates.js`
- MUST NOT modify the cycle-001 calibration-manifest.json
- MUST NOT modify any cycle-001 sprint folder, prd.md, sdd.md, sprint.md, NOTES.md, BUTTERFREEZONE.md, README.md
- MUST NOT modify any run-1/, run-2/, run-3-final/ output
- MUST NOT bump package.json version (still 0.2.0 per charter §3.7)
- MUST NOT add npm dependencies (zero-dep invariant)
- MUST NOT create the cycle-002 additive manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (Sprint 3 deliverable)
- MUST NOT touch `scripts/corona-backtest.js` entrypoint (Sprint 3)
- MUST NOT touch `scripts/corona-backtest/scoring/t{1,2,4}-bucket-brier.js` (legacy diagnostic, frozen)

All of these are verified zero-diff at audit time.

---

## Audit completion

Audit complete. Sprint 2 is **APPROVED**. Two non-blocking recommendations stand. Commit is gated on operator decision regarding the two recommendations. **No COMPLETED marker written until commit lands** (per Loa convention; the marker traditionally represents post-commit closure, but cycle-002 is not in the Sprint Ledger so the marker semantic is informational only).

Operator decision points (in order of recommended action):

1. Apply S2-C4 removal (7-line code change in `t4-replay.js`)
2. Apply S2-C2 reviewer.md clarification (2-3 line doc addition)
3. Re-run `npm test` (expect 261/261 still pass after the changes)
4. Authorise commit
5. Defer Sprint 3 to a separate ratification cycle (per HITL discipline)

**Auditor signature**: APPROVED. No security blockers. Recommended pre-commit fixes documented. Awaiting operator decision.
