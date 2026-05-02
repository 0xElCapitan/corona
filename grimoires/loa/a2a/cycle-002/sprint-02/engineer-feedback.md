# Sprint 2 — Engineer Feedback (cycle-002 / sprint-02)

**Reviewer**: Senior Tech Lead (review-sprint skill, adversarial protocol)
**Date**: 2026-05-02
**Implementation under review**: Sprint 2 milestones 1 + 2 (deterministic replay seam, T4 + T1/T2 binary)
**Authority**: cycle-002 design-doc chain (charter, contract, REPLAY-SEAM); cycle-002 is NOT in the Loa Sprint Ledger.

---

## Verdict: **APPROVED — with documented non-blocking concerns**

The implementation is production-ready against the operator's binding focus areas. No blocking issues. The concerns documented below are style, coverage-completeness, and Karpathy-simplicity observations — none of them prevent commit, and several are explicitly acknowledged in `reviewer.md` already. 261/261 tests pass; cycle-001 freeze invariants are bit-stable.

### Operator focus area pass/fail

| Focus area | Pass/Fail | Evidence |
|------------|-----------|----------|
| T4 deterministic replay seam | ✓ Pass | [tests/replay-determinism-T4-test.js:39-58](../../../../tests/replay-determinism-T4-test.js) — replay-twice byte-identical for ALL 5 cycle-001 T4 corpus events |
| T1/T2 binary replay semantics | ✓ Pass | [scripts/corona-backtest/replay/t1-replay.js:108](../../../../scripts/corona-backtest/replay/t1-replay.js) + [t2-replay.js:108](../../../../scripts/corona-backtest/replay/t2-replay.js) emit `distribution_shape: 'binary_scalar'` natively; outcome derivation uses flareRank (T1) / GFZ-preferred Kp (T2) per CONTRACT §8.1+§8.2 |
| No fake bucket projection | ✓ Pass | T1/T2 trajectories carry scalar `current_position_at_cutoff` from runtime directly. Legacy `scoring/t{1,2}-bucket-brier.js` zero diff; verified by `git diff HEAD -- scripts/corona-backtest/scoring/t1-bucket-brier.js` (empty) and milestone-2 test smoke-imports both legacy modules |
| Default-preserving Date.now() injection | ✓ Pass | All 7 modified runtime functions follow `(... , { now: nowFn = () => Date.now() } = {})` pattern; 160 existing cycle-001 tests pass without modification (`tests 261, pass 261, fail 0`); 15 explicit clock-default tests across [tests/replay-clock-injection-default-test.js](../../../../tests/replay-clock-injection-default-test.js) and [-T1T2-test.js](../../../../tests/replay-clock-injection-default-T1T2-test.js) |
| Replay-mode fail-closed | ✓ Pass | [scripts/corona-backtest/replay/context.js:62-72](../../../../scripts/corona-backtest/replay/context.js) throws on missing seed; tests cover T1, T2, T4 fail-closed paths |
| RLMF certificate non-mutation | ✓ Pass | `git diff HEAD -- src/rlmf/certificates.js` returns empty; [tests/replay-rlmf-cert-non-mutation-test.js](../../../../tests/replay-rlmf-cert-non-mutation-test.js) verifies cert.version, position_history field names, top-level keys, byte-stability under fixed clock |
| Cycle-001 manifest/doc/run preservation | ✓ Pass | `git diff HEAD -- grimoires/loa/{prd,sdd,sprint,NOTES}.md grimoires/loa/calibration/ grimoires/loa/a2a/sprint-{0..7}/` returns empty; manifest_regression_test passes (no shift in match_pattern target lines 102-104 of proton-cascade.js) |
| package.json script additions | ✓ Pass | Single line modification: `scripts.test` extended additively with 11 new test files; `dependencies: {}` and `engines.node: ">=20.0.0"` invariants intact |
| Replay helper surface minimality | ✓ Pass (with concerns) | 6 modules totalling 880 LOC; each module ≤250 LOC; per-theatre separation matches operator hard constraint #5. See concern S2-C4 below for one speculative export. |

---

## Adversarial Analysis

### Concerns identified

**S2-C1 — Style inconsistency in `geomag-gate.js` internal helpers**
Two patterns coexist for the `nowFn` capture:

- `processKpObservation` ([src/theatres/geomag-gate.js:122](../../../../src/theatres/geomag-gate.js)) — captures `const now = nowFn()` once at function top
- `processGSTEvent` ([src/theatres/geomag-gate.js:308](../../../../src/theatres/geomag-gate.js)) — captures inside the `if` branch
- `expireGeomagneticStormGate` ([src/theatres/geomag-gate.js:336](../../../../src/theatres/geomag-gate.js)) — captures at top after early return
- `processSolarWindSignal` ([src/theatres/geomag-gate.js:223](../../../../src/theatres/geomag-gate.js)) — calls `nowFn()` inline at single call site
- `processCMEArrival` ([src/theatres/geomag-gate.js:293](../../../../src/theatres/geomag-gate.js)) — calls `nowFn()` inline at single call site

**Severity**: LOW. All five are deterministic; the inconsistency is style-only. Consider standardising on `const now = nowFn()` at the top of every helper for readability and to match the pattern used in flare-gate.js and proton-cascade.js. **Non-blocking.**

**S2-C2 — T1/T2 trajectories carry runtime PRIOR only, not runtime-PROCESSED state**
The cycle-001 T1/T2 corpus events do not contain pre-cutoff time-series evidence (no GOES X-ray series for T1; no per-3hr Kp series for T2). Consequently:

- `replay_T1_event` invokes `createFlareClassGate` once; no `processFlareClassGate` calls.
- `replay_T2_event` invokes `createGeomagneticStormGate` once; no `processGeomagneticStormGate` calls.
- `position_history_at_cutoff` contains exactly one entry: the initial `base_rate` from the runtime.

This is **acknowledged** in [reviewer.md "Milestone 2 Notable Decisions"](reviewer.md), and the operator binding for milestone 2 was "trajectory is real and deterministic, not Rung 3." So this is honest framing, not an implementation defect. However, the milestone-1 explicit "trajectory differs from UNIFORM_PRIOR" guard ([tests/replay-T4-scored-through-runtime-bucket-test.js:96-110](../../../../tests/replay-T4-scored-through-runtime-bucket-test.js)) has **no T1/T2 equivalent** — there's no programmatic guard ensuring T1/T2 future runtime modifications don't silently regress to "runtime emits exactly base_rate."

**Severity**: LOW-MEDIUM. Non-blocking but worth recording as a Sprint 3 follow-up: when the entrypoint wiring lands and synthetic / future corpus events with pre-cutoff series become available, add the "trajectory ≠ uniform / base_rate" assertion for T1 and T2.

**S2-C3 — `replay-rlmf-cert-non-mutation-test.js` covers T4 only**
The cert non-mutation test exercises `proton-cascade.js` cert export ([tests/replay-rlmf-cert-non-mutation-test.js:51-61](../../../../tests/replay-rlmf-cert-non-mutation-test.js)). T1 cert export is covered by the cycle-001 baseline ([tests/corona_test.js:784-820](../../../../tests/corona_test.js)). T2/T3/T5 cert exports are NOT explicitly verified by any test.

Mitigating structural argument: `src/rlmf/certificates.js` has **zero diff**; `theatre.current_position` shapes are unchanged across all 5 theatres; `brierScoreBinary` / `brierScoreMultiClass` formulas unchanged. So Q1 holds by construction, not just by test coverage. The test gap is residual.

**Severity**: LOW. Non-blocking. Adding T1, T2, T3, T5 cert non-mutation cases would close the gap; could be a Sprint 3 hardening item.

**S2-C4 — `gitHeadRevision()` in `t4-replay.js` is speculative (Karpathy: Simplicity First)**
[scripts/corona-backtest/replay/t4-replay.js:226-232](../../../../scripts/corona-backtest/replay/t4-replay.js) exports `gitHeadRevision()` which spawns `git rev-parse HEAD`. No test imports it; no current call site uses it. It's a Sprint 3 entrypoint convenience helper baked into a Sprint 2 module. The Karpathy "Simplicity First" principle says: don't write speculative code until needed. Either:

- (a) Remove it now; Sprint 3 adds it back when wiring the entrypoint, OR
- (b) Move it to a Sprint 3 deliverable (e.g., a new `scripts/corona-backtest/replay/index.js` orchestrator)

Note: t1-replay.js and t2-replay.js do **not** export this helper, creating asymmetry — yet another reason to centralise it in Sprint 3.

**Severity**: LOW. Non-blocking. Operator may approve as a benign forward-compatibility hook.

**S2-C5 — Reviewer.md `reviewer.md` is structurally unconventional**
[grimoires/loa/a2a/cycle-002/sprint-02/reviewer.md](reviewer.md) covers BOTH milestones 1 and 2 in a single document, with "Milestone 1" and "Milestone 2" sections appended. Conventional Loa pattern is one reviewer.md per atomic sprint completion. Since both milestones land together as Sprint 2, this is defensible — but a reviewer reading the doc must keep track of which AC verification block applies to which milestone.

**Severity**: LOW. Non-blocking. Documentation style.

### Assumptions challenged

**A1 — Cycle-001 T1/T2 corpus shape is sufficient to demonstrate "runtime-wired" for T1/T2**

- **Assumption (engineer-side, not explicit in reviewer.md)**: The corpus shape limitation (no pre-cutoff time-series for T1/T2) is acceptable because milestone 2's bar is "trajectory is real and deterministic," not "trajectory beats uniform prior" (which is Rung 3).
- **Risk if wrong**: Future cycle-002 closeout that wants to claim "T1/T2 runtime-wired" in the strong sense (analogous to T4's milestone-1 binding gate) will discover that T1/T2 trajectories don't actually exercise `processFlareClassGate` / `processGeomagneticStormGate`. The runtime-uplift composite (charter §4.1) gets contributions from T1/T2 that are essentially scaled base-rate floors, not learned positions.
- **Recommendation**: Make this explicit in `reviewer.md` (it is acknowledged but understated in "Milestone 2 Notable Decisions") and surface it to the operator as a Sprint 3 / corpus-expansion follow-up. Specifically: any future "T1 calibration-improved" or "T2 calibration-improved" claim must come with corpus events that exercise the process* code path.

### Alternatives not considered

**ALT1 — Synthetic pre-cutoff fixture bundles for T1/T2 in tests (not in corpus)**

- **Alternative**: Sprint 2 milestone-2 tests could have constructed synthetic `solar_flare` (provisional) bundles and `kp_index` / `solar_wind` bundles to feed into `replay_T1_event` and `replay_T2_event`, exercising the `process*` code paths and producing non-trivial `position_history_at_cutoff`.
- **Tradeoff**: Pros: stronger "runtime-wired" coverage; the test would catch a future regression where the runtime's process* loop silently fails to update positions. Cons: synthetic fixtures add test complexity; CONTRACT §6 cutoff rules might have edge cases that hand-built fixtures miss; the test is no longer "run on real cycle-001 corpus", which is the binding-gate framing.
- **Verdict**: Current approach is **justified** — milestone 2's binding scope was "produce deterministic trajectories from cycle-001 corpus," not "exercise runtime evidence-processing on synthetic fixtures." The latter is a separate hardening goal; defer to Sprint 3 or a dedicated corpus-expansion sprint.

**ALT2 — Single combined `replay/index.js` orchestrator instead of per-theatre modules**

- **Alternative**: One file exporting `replay({ corpus_event, theatre_id, ... })` that internally dispatches to T1/T2/T4 logic.
- **Tradeoff**: Smaller surface, fewer files. But violates SDD §6.4 + operator hard constraint #5 (per-theatre independence; no shared scoring / replay code paths). Each theatre's replay logic is genuinely different (T1 has computed seed; T4 materialises bundles; T2 has GFZ-preferred outcome). Sharing produces premature abstraction.
- **Verdict**: Current per-theatre separation is **correct** — matches the framework's freeze on hard constraint #5.

---

## Karpathy Principles Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Think Before Coding | ✓ | Operator-driven HITL gates at charter, contract, and design phases. Assumptions surfaced at each ratification. Implementation followed the binding implementation order (T4 first → T1/T2). |
| Simplicity First | ⚠ Mostly | One speculative export (S2-C4). Otherwise minimal: each replay module ~140 LOC, scoring modules ~100 LOC, helpers ~85 LOC. No premature abstractions. |
| Surgical Changes | ✓ | Diff: 4 files modified, 44 insertions, 38 deletions. Each runtime modification is in-place with one optional last-arg + one inline `Date.now()` → `nowFn()` substitution. No drive-by refactoring. |
| Goal-Driven | ✓ | Every test maps to a CONTRACT §11.1 producer rule, a charter binding gate (§7, §10), or an operator focus area. Explicit milestone proof tests (`replay-T4-scored-through-runtime-bucket-test.js`, `replay-T1T2-binary-brier-scoring-test.js`) target the operator's stated milestone targets verbatim. |

---

## Complexity Review

| Check | Result |
|-------|--------|
| Function length | ✓ Pass — all functions <100 lines; longest is `replay_T4_event` at ~150 lines (reasonable for the 11-step orchestration documented inline) |
| Parameter count | ✓ Pass — runtime functions take 1-2 positional args + 1 destructured options; replay functions take exactly 2 positional |
| Nesting depth | ✓ Pass — max 3 levels in any function |
| Code duplication | ✓ Pass — per-theatre separation IS the duplication, but it's mandated by hard constraint #5 |
| Circular dependencies | ✓ Pass — replay/* imports from src/theatres/* and replay/{canonical-json,hashes,context}; no cycles |
| Dead code | ⚠ S2-C4 — `gitHeadRevision()` is dead (never called) |
| Naming | ✓ Pass — descriptive (`replay_T4_event`, `scoreEventT1Binary`, `deriveReplayClockSeed`) |

---

## Documentation Verification

| Item | Status |
|------|--------|
| reviewer.md AC Verification section | ✓ Present — covers M1 ACs (1-6, A-F) + M2 ACs (1-7) with file:line evidence |
| CHANGELOG entry | ⚠ N/A — cycle-002 charter §3.7 puts CHANGELOG out of scope; explicitly deferred until Rung 4 / cycle closeout |
| CLAUDE.md updates | N/A — no new commands/skills |
| Security comments | ✓ Pass — replay/context.js has explicit fail-closed rationale comment |
| README updates | N/A — README frozen per charter §3.6 |
| SDD updates | N/A — cycle-001 SDD frozen per charter §3.1 |

---

## Previous Feedback Status

No prior `engineer-feedback.md` exists for cycle-002 / sprint-02. This is the first review iteration.

---

## Required Fixes

**None blocking.**

Optional follow-ups (Sprint 3 candidates):

1. **S2-C4 Karpathy fix**: remove or relocate `gitHeadRevision()` from `t4-replay.js` (5-line change). Operator may waive as benign forward-compat.
2. **S2-C3 cert non-mutation coverage extension**: extend `replay-rlmf-cert-non-mutation-test.js` to T1, T2 paths (~30 LOC).
3. **S2-C2 T1/T2 ≠ base_rate guard**: when corpus expansion or synthetic fixtures land, add equivalent of milestone-1's "differs from UNIFORM_PRIOR" assertion to T1/T2 binary path.
4. **S2-C1 style consistency**: standardise `const now = nowFn()` at the top of every geomag-gate internal helper (cosmetic).

---

## Sprint Commit Readiness

**Ready for audit-sprint** (next gate). Audit will examine:

- Security surface (evidence leakage, nondeterminism)
- Provenance completeness (cycle-002 `replay_script_hash` plan documented in `reviewer.md`)
- Manifest regression risk (already verified clean)
- Hidden runtime behaviour changes (none surfaced in this review)
- T3/T5 coupling risk (none surfaced; cme-arrival.js / solar-wind-divergence.js zero diff)

After audit ratifies, Sprint 2 is commit-ready. **Do not commit before audit.**

---

## Reviewer notes (informational)

- Skill-internal note: cycle-002 is not in the Sprint Ledger; the canonical AC source is the design-doc chain under `grimoires/loa/a2a/cycle-002/`. This review used the charter (§3 freeze list, §7 clock pattern, §9 binary scoring, §10 success ladder), the contract (§3 trajectory shape, §6 cutoff rules, §8 outcome derivation, §10.1.1 fail-closed, §11.1 producer rules), and the design (REPLAY-SEAM §3 module layout, §10 test plan) as authoritative.
- The 261-test count growth (160 → 214 → 261) traces to: 160 cycle-001 baseline + 54 milestone-1 (T4) + 47 milestone-2 (T1/T2). Verified against `npm test` output.
- One file (reviewer.md) was modified by the engineer in the same delta as the implementation — this is the implementation report, not a code change. Treated as documentation, not a code-review surface.

**Reviewer signature**: APPROVED with non-blocking concerns. Proceed to audit.
