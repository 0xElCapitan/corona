# Sprint 6 Senior Reviewer Feedback — CORONA cycle-001-corona-v3-calibration

**Reviewer**: senior tech lead
**Date**: 2026-05-01
**Sprint**: 6 — Lightweight Input-Validation Review
**Round**: 1 (first review pass)
**Verdict**: **All good (with noted concerns)**
**Stop condition for review skill**: Do not auto-invoke `/audit-sprint`. Operator decides next step.

---

## Verdict

**All good (with noted concerns)**

Sprint 6 has been reviewed and approved. The implementation meets all four deliverables and three acceptance criteria from `grimoires/loa/sprint.md:432-447` (verbatim verified in the AC Verification section of `reviewer.md:39-99`). Scope discipline was maintained per the handoff §5 hard constraints: zero changes to scoring, settlement, corpus eligibility, calibration protocol, theatre authority, empirical evidence, manifest, run-1, run-2, package.json, construct.yaml, or System Zone. The accidental run-1 overwrite that occurred during in-flight verification was fully reverted (verified: `git diff --stat grimoires/loa/calibration/corona/run-1/` is empty).

Three non-blocking concerns are documented in the Adversarial Analysis section below per the senior-reviewer adversarial protocol. None of the concerns rise to the bar of requesting a Round 2 — per the operator brief, the trigger for Round 2 is "any MEDIUM finding should block Sprint 7," and all 9 mediums are correctly classified as non-blocking per the SDD §8.4 ladder.

---

## Focus area verification (per operator brief)

### 1. Scope control — ✓ PASS

- **Working tree integrity**: only Sprint 6 deliverables present. `git diff --stat` returns 4 modified files (`.beads/issues.jsonl`, `grimoires/loa/sprint.md`, `scripts/corona-backtest/ingestors/corpus-loader.js`, `src/theatres/proton-cascade.js`) + 3 untracked items (`grimoires/loa/calibration/corona/security-review.md`, `grimoires/loa/a2a/sprint-6/reviewer.md`, `tests/security/`).

- **No Sprint 7 publish-readiness work**: `git diff --stat` empty for `construct.yaml`, `BUTTERFREEZONE.md`, `package.json`, `spec/`, `identity/`. Verified.

- **No scoring/settlement/eligibility/protocol/authority/evidence/manifest/run-1/run-2 changes**:
  ```
  git diff --stat scripts/corona-backtest/scoring/                              → empty
  git diff --stat scripts/corona-backtest/reporting/                            → empty
  git diff --stat scripts/corona-backtest.js                                    → empty
  git diff --stat scripts/corona-backtest/config.js                             → empty
  git diff --stat grimoires/loa/calibration/corona/calibration-manifest.json    → empty
  git diff --stat grimoires/loa/calibration/corona/calibration-protocol.md      → empty
  git diff --stat grimoires/loa/calibration/corona/theatre-authority.md         → empty
  git diff --stat grimoires/loa/calibration/corona/empirical-evidence.md        → empty
  git diff --stat grimoires/loa/calibration/corona/corpus/                      → empty
  git diff --stat grimoires/loa/calibration/corona/run-1/                       → empty
  git diff --stat grimoires/loa/calibration/corona/run-2/                       → empty
  git diff --stat package.json                                                  → empty
  git diff --stat .claude/                                                      → empty
  ```

- **Run 1 overwrite reverted**: confirmed empty diff post-revert.

### 2. security-review.md finding quality — ✓ PASS (with two minor concerns)

- **All 25 findings reviewed**: 8 SWPC (S-001..S-008), 7 DONKI (D-001..D-007), 8 corpus-loader (C-001..C-008), 2 carry-forward (PEX-1, LOW-1). Summary table at `security-review.md:13-19` matches detail-table counts: 0 critical / 0 high / 9 medium / 16 low.

- **Severity classifications reasonable**: walked all 9 mediums against SDD §8.4 ladder definitions:
  | Finding | Severity | My check |
  |---------|----------|----------|
  | S-004 (date-parsing inconsistency) | medium | ✓ "non-graceful degradation" — schema drift produces NaN silently |
  | S-007 (GOES eclipse-season gaps) | medium | ✓ "non-graceful degradation" — silent zero-bundle output |
  | D-001 (parseSourceLocation TypeError) | medium | ✓ "crash on plausible malformed input" — caught by per-feed try/catch (not "rate-limited" in the SDD §8.4 sense; defensible as medium since contained) |
  | D-002 (getBestCMEAnalysis null-guard) | medium | ✓ same pattern as D-001 |
  | D-003 (NaN arrival prediction) | medium | ✓ T3 settlement is via observed L1 shock not WSA-Enlil prediction; NaN doesn't reach settlement → medium correct |
  | D-004 (era-aware normalization gap) | medium | ✓ "non-graceful degradation" — schema drift fragility |
  | D-005 (rate-limit awareness) | medium | ✓ "resource leak" — DEMO_KEY ceiling exceeded; non-graceful degradation |
  | C-003 (ISO-8601 validation gap) | medium | ✓ "non-graceful degradation" — NaN propagates to scoring |
  | C-006 (negative latency in T5 stale_feed_events) | medium | ⚠ defensible but inconsistent with carry-forward LOW-1 row (severity: low). See Concern #2 below. |

  **No medium should be high or blocking.** None of the mediums match SDD §8.4 critical class (input-injection / infinite-loop / data-loss). The D-001/D-002 patterns could conceivably be classified high under a strict reading of "crash on plausible malformed input," but the per-feed try/catch contains them and the engineer's medium classification is defensible.

- **Deferred findings have clear owner**: 16 deferred findings, all with explicit "Sprint 7+ or future cycle" or "future cycle" disposition + rationale. The deferred catalogue at `security-review.md:124-132` groups them by parser for Sprint 7 planning.

- **Fixed findings explicitly marked**: PEX-1 status `**fixed in Sprint 6**` (`security-review.md:77`) with cross-reference to "Closed in Sprint 6" §; C-006 status `**fixed in Sprint 6**` (`security-review.md:67`) with same cross-reference; LOW-1 status `**fixed in Sprint 6** (via C-006)` (`security-review.md:78`). Each has a code-patch + test reference, not just documentation.

### 3. PEX-1 fix — ✓ PASS

- **Direct property access actually fixed**: verified at source level by reading [src/theatres/proton-cascade.js:266, 284](../../../../src/theatres/proton-cascade.js#L266). Both lines now use `payload?.event_type` (optional chaining). Lines 270 (`payload.flare?.class_string`) and 291 (`payload.proton?.flux`) remain direct property access, but these are inside conditional blocks gated by lines 266 and 284 respectively, so they're unreachable when `payload` is null/undefined. Static-flow verified.

- **Behavior unchanged for valid payloads**: regression test at [tests/security/proton-cascade-pex1-test.js:89-110](../../../../tests/security/proton-cascade-pex1-test.js#L89) ("preserves happy-path behavior for well-formed flare bundles") asserts `result.evidence_bundles` includes the bundle_id, `result.position_history[last].evidence === bundle_id`, and `result.position_history[last].reason` matches `/M5\.2 flare/`. The kp_index regression test at [proton-cascade-pex1-test.js:113-122](../../../../tests/security/proton-cascade-pex1-test.js#L113) verifies the line 284 fall-through still routes non-flare/non-proton bundles correctly.

- **Malformed/missing payloads fail safely**: 3 tests with `assert.doesNotThrow` cover (a) `payload: undefined`, (b) `payload: null`, (c) no payload key. All three assert that the bundle is tracked in evidence_bundles + qualifying_event_count remains 0 (line 284 fall-through).

- **Tests would fail on old direct-access behavior**: confirmed by inspection. On pre-Sprint-6 code, line 266's `payload.event_type === 'solar_flare'` with `payload === undefined` throws `TypeError: Cannot read properties of undefined (reading 'event_type')`. The tests' `assert.doesNotThrow(() => processProtonEventCascade(theatre, malformedBundle))` would fail with an `AssertionError` wrapping the TypeError. Verified test logic catches old behavior.

### 4. C-006 / LOW-1 fix — ✓ PASS

- **Negative stale-feed latency rejected at corpus-load**: verified by reading [scripts/corona-backtest/ingestors/corpus-loader.js:326-349](../../../../scripts/corona-backtest/ingestors/corpus-loader.js#L326). The new validation block iterates `event.stale_feed_events`, parses `actual_onset_time` and `detection_time` to ms epochs, and pushes a descriptive error to `errors[]` if `detectMs < onsetMs`. The error message includes the offending index, the timestamps, and the schema citation `§3.7.6`.

- **Not silently clamped later**: scoring-layer clamp at [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183](../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js#L183) is unchanged (`git diff --stat scripts/corona-backtest/scoring/` empty). The clamp remains as defense-in-depth (per the security-review.md "Defense-in-depth for C-006" §, but the loader-side rejection now surfaces corpus-authoring errors at the earliest possible point.

- **No T5 scoring semantics change for valid corpus entries**: I re-ran the backtest with `CORONA_OUTPUT_DIR=run-sprint-6-scratch node scripts/corona-backtest.js` (the safer pattern documented in the reviewer.md Verification Steps). Result:
  ```
  corpus_hash: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1   (matches Sprint 3 baseline)
  script_hash: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1   (matches Sprint 3 baseline)
  composite_verdict: fail (T1=0.1389, T2=0.1389, T3=6.76h MAE / 40.0% ±6h, T4=0.1600, T5=25.0% FP / 90.0s p50 / 100% sw / n=5)
  ```
  All numerics identical to Sprint 3 / Run 1 baseline. Scratch dir cleaned up (`grimoires/loa/calibration/corona/run-sprint-6-scratch/` removed). All 5 existing primary corpus T5 events pass the new C-006 validation.

- **Tests cover negative latency, invalid timestamps, valid latency**: confirmed by inspection of [tests/security/corpus-loader-low1-test.js](../../../../tests/security/corpus-loader-low1-test.js):
  - Negative latency rejection: tests "REJECTS a stale_feed_events entry with negative latency" + "REJECTS only the offending entry" (uses index assertion to verify error points to correct entry) + end-to-end via `_loadEventFile`.
  - Invalid timestamps: test "accepts entries with malformed ISO-8601 (deferred to scoring isFinite guard)" pins the boundary — the C-006 check skips entries with non-finite timestamps and defers to C-003 / scoring. This is correct per the SDD §8.2 walk's classification.
  - Valid latency: tests "accepts a stale_feed_events entry with zero latency" (boundary case) + "accepts a stale_feed_events entry with positive latency (normal case)".
  - Plus null-onset, null-detection, null-entry coverage.

- **Run 1 / Run 2 frozen outputs not modified**: `git diff --stat grimoires/loa/calibration/corona/run-1/ grimoires/loa/calibration/corona/run-2/` empty. Verified.

### 5. Corpus-loader path safety — ✓ PASS

- **No path traversal at blocking severity**: C-008 documents `resolveCorpusDir` not anchoring to REPO_ROOT, classified as low / accepted residual per PRD §9.2 operator-trust boundary. Sprint 3 audit Focus Area 2 verified path-construction safe; Sprint 6 re-confirmed. The §8.2 file-system path traversal cell is mapped to C-008 + write-boundary sanitization at `write-report.js:298` (regex strips path-unsafe chars from event_id before filesystem write). No critical-severity path-traversal finding.

- **Output-dir behavior**: see Adversarial Concern #1 below — `resolveOutputDir` (config.js:121-124) is the analogous concern that security-review.md does NOT explicitly catalog. Same operator-trust boundary applies; non-blocking.

- **Oversized file**: C-005 low / accepted residual (`readFileSync` no per-file size cap). Defensible per `calibration-protocol.md` §3.5 operator-HITL-gated corpus authorship. Correctly classified.

- **Malformed JSON**: clean — `loadEventFile:344-348` wraps `JSON.parse` in try/catch and rejects with explicit error message per file. Correctly classified.

- **Missing required fields**: clean — `validateCommonEnvelope:51` checks COMMON_FIELDS presence + per-theatre validators (validateT1..validateT5) check theatre-specific required fields. Edge case at C-001 low / deferred (truthy short-circuit on `event.tier` allows null tier through envelope but is harmless because tier is directory-encoded in the per-tier dispatch). Correctly classified.

### 6. Regression safety — ✓ PASS

- **160/160 tests pass**: re-verified via `node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js tests/security/proton-cascade-pex1-test.js tests/security/corpus-loader-low1-test.js`. Tests 160 / pass 160 / fail 0.

- **Construct validator green**: `./scripts/construct-validate.sh construct.yaml` returns "OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)".

- **package.json unchanged + no dependencies added**: `git diff --stat package.json` empty. No `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` in working tree. Zero-runtime-dependency invariant preserved.

- **Backtest reproducibility check verifies hashes without rewriting frozen artifacts**: I re-ran with `CORONA_OUTPUT_DIR=run-sprint-6-scratch` (the safer pattern). Hashes match Sprint 3 baseline. Scratch dir cleaned up. Run-1 + run-2 untouched.

  **However**, see Adversarial Concern #3 — the implementing agent's initial verification used the unsafe `node scripts/corona-backtest.js` (default output dir = run-1), which caused the in-flight overwrite. The implementing agent reverted run-1 immediately, but this is a process-level fragility. The reviewer.md Verification Steps section now documents the safer pattern, but the harness default is unchanged.

---

## Adversarial Analysis

Per the senior-reviewer adversarial protocol, I am not a rubber stamp. The implementation was authored by the same agent acting as engineer; I have a built-in bias toward approval. Below are the concerns I identified after re-reading the source against the report's claims.

### Concerns Identified (3 minimum)

#### Concern #1 — `resolveOutputDir` path-traversal not catalogued in security-review.md (non-blocking)

**Where**: [scripts/corona-backtest/config.js:121-124](../../../../scripts/corona-backtest/config.js#L121)
```js
export function resolveOutputDir(envValue) {
  const requested = envValue || process.env.CORONA_OUTPUT_DIR || 'run-1';
  return resolve(CALIBRATION_DIR, requested);
}
```

**Issue**: The Sprint 6 security-review.md catalogs C-008 about `resolveCorpusDir` (line 126-129 of the same file) at low / accepted residual, but does NOT mention the parallel `resolveOutputDir` function. `resolveOutputDir` anchors to `CALIBRATION_DIR` (slightly safer than `resolveCorpusDir`'s un-anchored `resolve(requested)`), but `resolve(CALIBRATION_DIR, '../../tmp')` still escapes via `..` segments. An operator who sets `CORONA_OUTPUT_DIR=../../../some-target` would have the harness write run reports outside the calibration directory.

**Why non-blocking**: same operator-trust boundary as C-008 per PRD §9.2 read-only HTTP / zero auth / harness-is-developer-tool. The threat model requires operator-controlled env to be malicious, which is out of scope. The accidental in-flight run-1 overwrite during Sprint 6 (Concern #3) was caused by the *default* `'run-1'` value, not by malicious env.

**Recommendation**: add a parallel finding C-009 in a future polish pass, classified at low / accepted residual with the same rationale as C-008. Not required for Sprint 6 close.

#### Concern #2 — C-006 medium vs LOW-1 low severity classification inconsistency

**Where**: [security-review.md:67](../../calibration/corona/security-review.md#L67) (C-006 = medium) vs [security-review.md:78](../../calibration/corona/security-review.md#L78) (LOW-1 = low).

**Issue**: The same underlying defect (corpus-loader does not validate negative-latency stale_feed_events; scoring clamps via `Math.max(0, …)`) is documented twice with two different severities. C-006 classifies it as medium ("data-quality vector that previously slipped through to scoring"). LOW-1 in the carry-forward table classifies it as low (matching the original Sprint 3 audit's "LOW-1: Math.max(0, …) silently clamps"). Cross-references exist (`See C-006` and `CARRY-FORWARD: Sprint 3 audit LOW-1`) but no severity reconciliation is provided.

**Why non-blocking**: the issue is fixed in Sprint 6 either way; the severity discrepancy is a documentation-polish issue. The Sprint 7 gate is satisfied because both severities (medium and low) are below `critical` per SDD §8.4. The total count of 25 findings includes the issue twice (once as C-006 medium, once as LOW-1 low) which mildly inflates the count but doesn't change any acceptance criterion.

**Recommendation**: in a documentation polish pass, choose one severity and reconcile (or add a note explaining "C-006 is the corpus-loader-side framing; LOW-1 is the Sprint 3 audit's framing of the same underlying issue; both are now closed via the loader patch"). Not required for Sprint 6 close.

#### Concern #3 — Backtest harness defaults to run-1 output, causing in-flight artifact overwrites

**Where**: [scripts/corona-backtest/config.js:121-124](../../../../scripts/corona-backtest/config.js#L121)

**Issue**: During Sprint 6 implementation, the verification step `node scripts/corona-backtest.js` overwrote run-1 certificates (later reverted). The implementing agent's reviewer.md "Verification Steps" section now correctly documents the safer pattern `CORONA_OUTPUT_DIR=run-sprint-6-scratch node scripts/corona-backtest.js`, and I used the safer pattern during this review. But the harness's underlying default behavior is unchanged: any future developer running the bare `node scripts/corona-backtest.js` will re-overwrite run-1.

**Why non-blocking**: the in-flight overwrite was reverted; current state is clean. The harness behavior is Sprint 3 territory and not in Sprint 6's scope. The risk is that future Sprint 7+ runs by other operators may repeat the mistake.

**Recommendation**: in Sprint 7, consider changing the harness default to a scratch dir (e.g., `'run-scratch'`) or requiring explicit `CORONA_OUTPUT_DIR` to be set when invoking against the committed corpus. Outside Sprint 6 scope.

### Assumptions Challenged (1 minimum)

- **Assumption (engineer)**: The C-006 fix's defense-in-depth posture (loader rejects + scoring clamps as backup) is the right architecture. The engineer's reasoning (security-review.md "Defense-in-depth for C-006" §) is that the scoring-layer `Math.max(0, …)` clamp remains as a backstop in case a future regression bypasses the loader.

- **Risk if wrong**: the scoring clamp continues to silently mask negative latencies in any code path that reaches the scoring layer without going through the corpus-loader. Examples: a hypothetical alternative ingestion pipeline (e.g., a separate corpus-eligibility re-evaluator), or a future test/development scenario that constructs T5 events directly. The clamp would mask the same data-quality issue that the loader-side fix addresses.

- **Recommendation**: documented in security-review.md is acceptable per hard constraint #9 (no scoring-semantics changes). The defense-in-depth posture is the correct compromise. Sprint 7 (or a future cycle) may revisit whether the scoring clamp should be replaced with an explicit `latency < 0` runtime assertion if the constraint window opens.

### Alternatives Not Considered (1 minimum)

- **Alternative for PEX-1**: instead of optional chaining at lines 266 and 284, add an explicit early-return guard at line 263:
  ```js
  const payload = bundle?.payload;
  if (payload == null) return updated;
  ```
- **Tradeoff**: 2 extra lines (1 type guard + 1 return) vs 2 character changes (`?.`). The early-return form is more explicit (a future reader sees the guard up-front and doesn't need to trace flow through lines 266, 284). The optional-chaining form is more surgical.
- **Verdict**: optional chaining is justified as the minimum-change posture per Karpathy "Surgical Changes." For a carry-forward defect that has been documented since Sprint 2, a 4-character patch is appropriate. The early-return alternative would be marginally clearer but is not strictly better. Current approach preserves the line 284 fall-through semantics bit-for-bit, which is conservative and audit-friendly.

---

## Approval criteria summary

Per the `/reviewing-code` skill spec approval criteria:

| Criterion | Status |
|-----------|--------|
| `## AC Verification` section is present and complete | ✓ All 9 sprint.md ACs walked verbatim with file:line evidence (`reviewer.md:39-99`) |
| All sprint tasks completed + all ACs met | ✓ 4 deliverables met (✓), 3 ACs met (✓), 3 technical tasks completed (`corona-r4y`, `corona-8m8`, `corona-a6z` all closed in beads); AC.6.1 "Review committed" is ⏸ pending operator commit (per stop condition; expected) |
| Code quality production-ready | ✓ Patches are minimal (4 chars + 24 lines), follow existing conventions, include explanatory comments tying back to handoff §6.5 + hard constraint #9 |
| Tests are comprehensive and meaningful | ✓ 16 new tests; PEX-1 covers 3 failure modes + 3 happy-path regressions; C-006 covers boundary cases + null guards + end-to-end via `_loadEventFile`. Tests assert on specific symbols (evidence_bundles inclusion, position_history reason regex, error message regex with index + invariant + schema citation), not just lack-of-throw. |
| No security issues | ✓ 0 critical findings; 9 medium / 16 low all classified per SDD §8.4 ladder; no medium qualifies for Sprint 7 block |
| No critical bugs or performance problems | ✓ Validator green; backtest reproducibility verified at hash level; all baseline tests pass |
| Architecture aligns with SDD | ✓ SDD §8.2 13-row checklist walked; SDD §8.3 template followed verbatim; SDD §8.4 severity ladder applied consistently |
| ALL previous feedback addressed | ✓ N/A — first review pass; no prior engineer-feedback.md to address |

---

## Adversarial cross-model review (Phase 2.5)

**Status**: Skipped (configuration not present).

`yq eval '.flatline_protocol.code_review.enabled' .loa.config.yaml` returned `null` — the cross-model review is not configured. Per the skill spec, single-model assessment proceeds with logged warning. No DEGRADED marker required for review (only audit). This is a process item for Sprint 7 / future cycle to enable the multi-model dissenter; not a Sprint 6 blocker.

---

## Next steps

Per the operator brief stop condition for `/reviewing-code`:

> If review is green, proceed to /audit-sprint sprint 6.

Sprint 6 is **APPROVED with noted concerns** (non-blocking). Sprint 7 is unblocked from a security-review perspective. The operator may:

1. **Invoke `/audit-sprint sprint-6`** — the next quality gate per the standard CORONA cycle.
2. **Optionally address adversarial concerns 1-3** before audit — these are documentation-polish items (C-009 finding for resolveOutputDir, severity reconciliation between C-006 and LOW-1) and a process improvement for Sprint 7+. None are required for audit to pass.

Per the `/implementing-tasks` stop condition + `/reviewing-code` "Do not run audit until review is green" directive, this review skill **does NOT auto-invoke `/audit-sprint`**. The operator triggers the next gate.

---

## Beads label update

Per `<beads_workflow>` in the skill spec, recording review approval:

```bash
br comments add corona-16a "REVIEW (Round 1): All good (with noted concerns). 0 critical / 0 high / 9 medium / 16 low across 25 findings. PEX-1 + C-006/LOW-1 carry-forwards closed per handoff §6.4 + §6.5 option (A). Three non-blocking concerns documented in engineer-feedback.md adversarial analysis."
br label add corona-16a review-approved
```

(To be applied after this feedback file is committed; HITL ON.)

---

*Sprint 6 review feedback authored 2026-05-01 per /reviewing-code skill template + adversarial review protocol minimums (≥3 concerns, ≥1 assumption challenged, ≥1 alternative not considered). Approval verdict: All good (with noted concerns). Sprint 7 unblocked from review gate.*
