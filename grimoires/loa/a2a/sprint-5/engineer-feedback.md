# Sprint 5 Senior Reviewer Feedback — CORONA cycle-001

**Reviewer**: Senior tech lead (reviewing-code skill, adversarial protocol)
**Verdict**: **All good (with noted concerns)**
**Round**: 1
**Date**: 2026-05-01
**Sprint epic**: `corona-3fg` (closed); 7 owner tasks closed
**Engineer report**: [grimoires/loa/a2a/sprint-5/reviewer.md](reviewer.md)

---

## Overall Assessment

Sprint 5 ships. The implementation is materially complete, the no-refit decision is justified by evidence rather than avoidance, the manifest correctly preserves Sprint 4 Round 3 fixes verbatim, the regression gate catches drift mechanically, and the architectural reality (Run 2 = Run 1) is honestly disclosed rather than masked. Non-blocking concerns are surfaced below for the engineer's awareness; none rise to "narrow Round 2 needed".

**Test gate**: 144 / 144 pass. **Hash invariants**: corpus_hash + script_hash byte-identical to Run 1. **Scope discipline**: only 4 files modified (NOTES.md, calibration-manifest.json, sprint.md, .beads/issues.jsonl); zero src/ or scripts/ changes; package.json untouched. **Validator**: passes. **Sprint 6 work**: not started.

The honest disclosure that Run 2 numerics match Run 1 because the harness uses uniform-prior baselines (which do not consume runtime constants) is the central finding of this sprint — and the engineer documented it accurately rather than hiding behind threshold re-baselining or cosmetic refits. That posture is correct.

---

## Reviewer Focus Area Verdicts

### 1. No-refit decision — ✓ Justified by evidence, not avoidance

**Verdict: PASS**

Evidence verified:
- [NOTES.md S5-1](../../NOTES.md) contains a per-parameter table (20 rows) walking each manifest entry against Sprint 4 evidence + Run 1 numerical reality. Each row has an explicit decision + rationale.
- The rationale is not uniform "no change" — different parameters get different reasons:
  - `T3_NULL_SIGMA_PLACEHOLDER_HOURS=14`: keep because Run 1 mean z-score 0.538 is well within [0,1]
  - `wheatland_decay_m_class=0.90`: keep + retain promotion_path because corpus has 1 M-class trigger (n=1 sample insufficient)
  - `bz_divergence_threshold=5`: keep because the harness reads pre-annotated divergence_signals from corpus rather than runtime threshold (architectural reality)
- [reviewer.md Task 5.1 + Task 5.2](reviewer.md) cross-reference NOTES.md S5-1 and add inline-line citations to each parameter.
- The Sprint 5 task closure messages (corona-8yb + corona-28z) reference both NOTES.md S5-1 and the manifest entries, providing audit trail for the no-change rationale.

The engineer correctly interpreted the conditional spirit of the handoff (§3 task table: "Each refit MUST be motivated by either Sprint 4 literature_derived value OR Run 1 backtest signal"; §11 #1: "Refit selected parameters where Run 1 motivates a change"). Sprint 5 evaluated and found zero parameters where evidence motivates a change.

**The no-refit decision is not avoidance.** It is the correct evidence-driven outcome.

### 2. Run 2 = Run 1 — ✓ Honestly disclosed as architectural reality

**Verdict: PASS**

Mechanically verified:
- `diff -q grimoires/loa/calibration/corona/run-1/corpus_hash.txt run-2/corpus_hash.txt` → IDENTICAL
- `diff -q grimoires/loa/calibration/corona/run-1/script_hash.txt run-2/script_hash.txt` → IDENTICAL
- `diff -r run-1/ run-2/` shows only `run_id`, `Generated` timestamp, and `code_revision` differ per per-theatre report; all numerical values bit-identical.

Disclosure quality verified:
- [delta-report.md headline](../../calibration/corona/run-2/delta-report.md): "Run 2 produces numerically IDENTICAL Brier/MAE/FP-rate/p50/switch-handled values to Run 1 for every theatre."
- delta-report.md "Architectural reality" section explicitly identifies the cause: `corona-backtest.js:148` calls `score(events[theatre])` without passing `options.predictedDistribution`, so `UNIFORM_PRIOR` is used. Runtime constants do not flow into scoring.
- delta-report.md "Sprint 7 forward-looking obligations" section spells out the harness extension required for numerically-meaningful refits: wire runtime predictions into the scoring entrypoint, extend T5 to consume runtime threshold against raw DSCOVR/ACE Bz time-series.
- [reviewer.md "Architectural reality + honest disclosure"](reviewer.md) section makes the same disclosure with file:line references.

**No improvement is claimed.** The Sprint 5 verdict reads `composite_verdict=fail` (T1 fail, T2 pass, T3 fail, T4 fail, T5 fail) — exactly the same as Run 1.

The engineer correctly identifies Sprint 7 / `corona-1ml` (or future cycle) as the natural owner of the harness extension. This is documented in delta-report.md and reviewer.md and reflects operator hard constraint #6 ("Do NOT change Sprint 3 scoring semantics") faithfully.

### 3. Manifest correctness — ✓ All 30 entries complete; Round 3 fixes preserved

**Verdict: PASS**

Mechanically verified via `node` script over the manifest:

**Field completeness** (PRD §7 + Sprint 4 §1.1 + SDD §7.3): Total 0 missing fields across 30 entries. All entries carry: `parameter`, `current_value`, `theatre`, `derivation`, `evidence_source`, `confidence`, `corpus_hash`, `script_hash`, `provisional`, `settlement_critical`, `promotion_path`, `verification_status` (Sprint 4 §1.1 addition), `inline_lookup` (SDD §7.3 addition), plus Sprint 4 evidence-doc fields `id`, `source_file`, `source_line`, `notes`.

**Sprint 4 Round 3 fixes preserved verbatim** (this is the load-bearing W-1 invariant from the handoff):

| Entry | Sprint 4 Round 3 expected | Sprint 5 manifest actual | Verdict |
|-------|---------------------------|--------------------------|---------|
| corona-evidence-006 | confidence=medium, verification_status=ENGINEER_CURATED_REQUIRES_VERIFICATION, provisional=true | confidence=medium, verification_status=ENGINEER_CURATED_REQUIRES_VERIFICATION, provisional=true | ✓ verbatim |
| corona-evidence-020 | confidence=medium, verification_status=OPERATIONAL_DOC_ONLY, provisional=true | confidence=medium, verification_status=OPERATIONAL_DOC_ONLY, provisional=true | ✓ verbatim |

The Sprint 4 audit Round 1 failure mode (silent over-promotion of uncertain evidence to settlement_critical+provisional=false+confidence=high) does NOT reappear in Sprint 5's manifest.

**Silent over-promotion check**: Only 1 entry has `verification_status: VERIFIED_FROM_SOURCE`:
- `corona-evidence-019` (z=1.96 multiplier, textbook claim, settlement_critical=false)

This is correct per Sprint 4 §8.3 — z=1.96 ↔ 95% CI is a textbook claim that doesn't require DOI verification. All 28 other entries remain provisional pending DOI verification per their `promotion_path`.

**Verification status histogram**:
- ENGINEER_CURATED_REQUIRES_VERIFICATION: 15
- OPERATIONAL_DOC_ONLY: 8
- HYPOTHESIS_OR_HEURISTIC: 6
- VERIFIED_FROM_SOURCE: 1
- Total: 30 ✓

**Settlement-critical + provisional → promotion_path**: 18 of 18 entries have non-null promotion_path. PRD §8.5 invariant honored mechanically.

**Per-key expansion against handoff §9 target**:
- 7 SOURCE_RELIABILITY keys: corona-evidence-017 (SWPC_GOES) + 018-dscovr + 018-ace + 021 (SWPC_GOES_SECONDARY) + 022 (DONKI) + 023 (GFZ) + 024 (SWPC_KP) = 7 ✓
- 5 CLASS_RELIABILITY keys: corona-evidence-025 (X) + 026 (M) + 027 (C) + 028 (B) + 029 (A) = 5 ✓
- Sprint 4 evidence-018 split into evidence-018-dscovr + evidence-018-ace per the per-key target — split rationale documented in [NOTES.md S5-3](../../NOTES.md)

**Source-line citations validated**: All 30 entries' `source_file:source_line` references read the actual literal value the manifest claims (verified by reading each line and confirming the cited value appears in the trimmed line text).

### 4. Regression gate — ✓ Catches drift mechanically; one structurally weaker case noted

**Verdict: PASS (with non-blocking observation)**

**Drift detection verified via in-memory simulation** (no tracked files modified):

For each of 24 literature_derived entries, the test took the actual line text, replaced numeric digit groups with `999`, and re-ran the entry's `match_pattern` regex against the corrupted text:

| Result | Count | Notes |
|--------|-------|-------|
| Drift caught (regex no longer matches corrupted line) | 23 | All numeric-anchored entries |
| Drift missed (regex still matches corrupted line) | 1 | `corona-evidence-020` (log-flux) |

**evidence-020 is the documented edge case** — its match_pattern is `"log-flux"` (a comment substring, not a numeric literal). Numeric corruption doesn't affect the comment, so the regex still matches. **This is structurally weaker drift detection than the other 23 entries.**

**Mitigation already in place** (engineer's notes acknowledge this):
- `verification_status: OPERATIONAL_DOC_ONLY` (lowest tier)
- `provisional: true`
- `promotion_path` correctly identifies empirical validation as the proper route ("validate the linearization choice against Run 1+ T1 corpus residuals")
- Notes explicitly state "the linearization variable choice is encoded in the function comment ... consumed at flareThresholdProbability lines 102-114"

**Recommendation (non-blocking)**: A future sprint may strengthen evidence-020's drift detection by anchoring on the runtime function name (e.g., extending the regex to `"classToFlux|classifyFlux|log-flux"` to match the import line at uncertainty.js:15 OR the consumption sites at lines 102-114). Current state is defensible because the engineer's verification_status correctly signals that this entry is operational-doc-only, and the structural test still verifies the comment exists at the cited location.

**Inline-vs-manifest mechanical coupling verified**: For each of the 23 numeric entries, the regex literally embeds the value (e.g., `bz_divergence_threshold\s*=\s*5`). A value drift breaks the match.

**Per-entry test attribution**: 24 per-entry tests provide clear drift attribution. Aggregate test + 4 invariant tests (corpus_hash, script_hash, settlement_critical promotion_path, engineering_estimated structural defense) provide defense-in-depth.

### 5. Scope control — ✓ Discipline maintained

**Verdict: PASS**

`git status --short` shows the expected Sprint 5 deliverables only:
- `M .beads/issues.jsonl` (task lifecycle — closed corona-3fg + 7 owner tasks)
- `M grimoires/loa/NOTES.md` (Decision Log S5-1, S5-2, S5-3)
- `M grimoires/loa/calibration/corona/calibration-manifest.json` (populated from `[]` to 30 entries)
- `M grimoires/loa/sprint.md` (Sprint 5 deliverable/AC checkmarks)
- `?? grimoires/loa/a2a/sprint-5/reviewer.md` (NEW)
- `?? grimoires/loa/calibration/corona/run-2/` (NEW)
- `?? tests/manifest_regression_test.js` (NEW)
- `?? tests/manifest_structural_test.js` (NEW)

`git diff --quiet src/ scripts/ tests/corona_test.js` returns 0 — **no source, harness, or baseline test changes**.

`git diff package.json` empty — **zero-dep invariant intact**.

No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` introduced.

**Sprint 6 work not smuggled in**: PEX-1 (`payload.event_type` direct access at proton-cascade.js:266, 284) untouched (verified — file diff against HEAD is empty).

**No scoring semantics changed**: scoring modules at `scripts/corona-backtest/scoring/*.js` unchanged.

**No hidden filtering added**: corpus loader at `scripts/corona-backtest/ingestors/corpus-loader.js` unchanged. Run 2 corpus_load_stats matches Run 1 (T1=5/0, T2=5/0, T3=5/0, T4=5/0, T5=5/0 loaded/rejected).

### 6. Beads / task validity — ✓ Closure rationale acceptable

**Verdict: PASS**

corona-8yb + corona-28z closed with the rationale "evidence-driven NO-CHANGE per Sprint 4 evidence + Run 1 do not motivate refits ... See NOTES.md S5-1 + reviewer.md".

**This closure rationale is acceptable** because:

1. **Task contracts are implicitly conditional**. Handoff §3 explicitly says: "Each refit MUST be motivated by either a Sprint 4 literature_derived value (with verification_status acknowledged) OR a Run 1 backtest signal." Handoff §11 #1: "Refit selected parameters where Run 1 motivates a change." The Sprint 4 evidence doc §11 says the same: "Sprint 5 will: ... 2. Refit selected parameters where Run 1 motivates a change." The task descriptions are aspirational ("Inline-edit"); the contracts are conditional.

2. **The work product is real**. corona-8yb + corona-28z produced:
   - A comprehensive per-parameter analysis (NOTES.md S5-1: 20 rows of decision rationale)
   - The manifest entries that lock the inline values as the source of truth (16 entries directly attributable to processor + theatre parameters: corona-evidence-001 through 016 + 019 through 029 in the source_files those tasks own)
   - The regression gate test cases that mechanically prevent future drift
   
   The deliverable is provenance + drift prevention, not the inline edits per se.

3. **The closure messages reference NOTES.md S5-1 and reviewer.md** for traceable evidence. An auditor following the trail finds the per-parameter rationale immediately.

4. **The settlement-critical engineering-estimated parameter (`wheatland_decay_m_class=0.90`)** correctly retains `provisional: true` + the explicit promotion_path "validate against M-class T4 corpus events ... promote to literature_derived once corpus extension reaches 15+ M-class triggers". Sprint 5 did NOT silently promote this parameter despite the task description's "refitted" language.

**No reclassification needed.** Sprint 5 task closure as "evidence-driven NO-CHANGE" is acceptable as documented.

---

## Adversarial Analysis

### Concerns Identified

#### Concern 1: corona-evidence-020 has structurally weaker drift detection (NON-BLOCKING)

**File:line**: `grimoires/loa/calibration/corona/calibration-manifest.json` corona-evidence-020 + `src/processor/uncertainty.js:95`

**Issue**: The `inline_lookup.match_pattern` for the log-flux linearization is `"log-flux"` — a substring match against the comment line `* Uses normal approximation on log-flux.`. This regex passes a "drift simulation" where numeric digits in the line are replaced with 999, because the comment's textual content survives numeric corruption. If a future engineer changes the runtime LOGIC at `flareThresholdProbability` (lines 102-114) to use a different linearization variable while leaving the line-95 comment unchanged, the regression gate would NOT detect the drift.

**Rationale for non-blocking**: 
- The engineer's [reviewer.md L78-79](reviewer.md) explicitly acknowledges the limitation: "the linearization variable choice is encoded in the function comment ... and consumed at flareThresholdProbability lines 102-114."
- `verification_status: OPERATIONAL_DOC_ONLY` is the lowest credibility tier — any future engineer reading the manifest sees that this entry is documentation-anchored, not code-anchored.
- `provisional: true` + the promotion_path "empirically validate the linearization choice against Run 1+ T1 corpus residuals" correctly identifies the proper verification route — not regex strengthening.
- The structural test still verifies the comment exists at the cited location (`inline_lookup.line` must point at a line where `match_pattern` matches), so an orphaned manifest entry would still fail.

**Recommendation**: A future cycle (Sprint 7 or post-merge) may consider strengthening the match_pattern, e.g., to `"classToFlux|classifyFlux|log-flux"` to anchor on the imported runtime functions at `src/processor/uncertainty.js:15`. Current state is defensible.

#### Concern 2: Same-line entry pairs may produce double-failure for single drift (NON-BLOCKING)

**File:line**: 4 same-line pairs in the manifest:
- `src/processor/uncertainty.js:134` shared by corona-evidence-006 + corona-evidence-007 (Kp σ definitive 0.33 + preliminary 0.67, ternary on one line)
- `src/theatres/proton-cascade.js:102` shared by corona-evidence-008 + corona-evidence-009 (X-class lambda 8 + decay 0.85)
- `src/theatres/proton-cascade.js:103` shared by corona-evidence-010 + corona-evidence-011 (M-class lambda 4 + decay 0.90)
- `src/theatres/proton-cascade.js:104` shared by corona-evidence-012 + corona-evidence-013 (default lambda 3 + decay 0.92)

**Issue**: For evidence-006 + evidence-007, both entries share the EXACT match_pattern `isDefinitive\s*\?\s*0\.33\s*:\s*0\.67`. A drift on either 0.33 or 0.67 fails BOTH entries' tests. The "per-entry clear drift attribution" claim in the engineer's reviewer.md is partly cosmetic for these pairs — drift on `sigma_preliminary=0.67` would fail both `corona-evidence-006` (sigma_definitive=0.33) and `corona-evidence-007` (sigma_preliminary=0.67) tests, even though only 007 owns the drifted value.

For evidence-008/009 and 010/011 and 012/013, the patterns are asymmetric: the "lambda" entry's pattern only requires the lambda literal, while the "decay" entry's pattern requires both the lambda + decay literals. So drift on lambda fails both entries; drift on decay fails only the decay entry. This asymmetry is acceptable but worth noting.

**Rationale for non-blocking**:
- All drift IS caught (the regression gate's primary purpose). The cosmetic issue is the test report's attribution clarity.
- The "lesser sin" is "two tests fail for one drift" vs "drift escapes detection". Sprint 5 chose the safer option.
- Sprint 4 evidence doc itself sketched evidence-006/007 with the same source_line:134 and the same conceptual ternary, so the same-line constraint reflects the runtime structure.

**Recommendation**: A future cycle may want to write asymmetric patterns for evidence-006 vs evidence-007 (e.g., evidence-006: `0\.33\s*:`, evidence-007: `:\s*0\.67`) to give each entry independent drift detection. This is a minor ergonomic improvement, not a correctness fix.

#### Concern 3: "No refits motivated" framing rests partly on harness architecture (NON-BLOCKING)

**File:line**: `grimoires/loa/NOTES.md` Decision Log S5-1 (the per-parameter table)

**Issue**: NOTES.md S5-1's framing is "Sprint 5 evidence-driven analysis finds zero parameters where Sprint 4 evidence + Run 1 motivate a change." This is correct, but it rests partly on the architectural fact that Run 1 numerics aren't sensitive to runtime constants (uniform-prior baseline). A future reader might interpret the no-refit decision as "the current parameter values are well-validated" when actually it means "the current architecture cannot empirically test parameter validity, so there's no Run-1-derived signal that motivates a numerical change."

The distinction matters because:
- "Parameters validated → no refit needed" (rosy interpretation)
- "Parameters can't be empirically tested → no refit possible from Run 1" (accurate interpretation)

**Rationale for non-blocking**: 
- delta-report.md ALREADY makes this distinction explicit in the "Architectural reality" + "Sprint 7 forward-looking obligations" sections.
- NOTES.md S5-2 ("Run 2 numerical equivalence with Run 1 (expected, not bug)") covers the architectural reality directly.
- The two pieces are consistent when read together.

**Recommendation**: A clarifying one-liner in NOTES.md S5-1's preamble would tighten the framing. Suggested addition (the engineer may apply post-review without requiring a Round 2):

> "Note: 'no refits motivated' here means BOTH that (a) Sprint 4 literature evidence does not justify a numerical change AND (b) Run 1 numerics cannot empirically test parameter validity under the current uniform-prior harness baseline (see S5-2). Future cycles wiring runtime predictions into scoring may surface refit opportunities Sprint 5 cannot see."

This is **non-blocking**. The current text + delta-report.md disclosure together convey the right semantics. The recommendation is for tightness, not correctness.

#### Concern 4: Sprint 5 doesn't formally consider the alternative of extending the harness as Sprint 5 scope (NON-BLOCKING)

**File:line**: `grimoires/loa/a2a/sprint-5/reviewer.md` "Architectural reality" section

**Issue**: The reviewer.md identifies Sprint 7 / future cycle as the natural owner of the harness extension, but doesn't formally evaluate the alternative of extending the harness AS Sprint 5 scope. This makes the "Sprint 7 owns it" verdict feel like an a-priori scope boundary rather than a deliberate trade-off.

**Rationale for non-blocking**: The operator brief explicitly says "Do NOT change Sprint 3 scoring semantics unless a direct blocker is found" (handoff §7 hard constraint #6). Sprint 5 took this constraint at face value, which is the right move. But the engineer's reviewer.md could acknowledge: "Alternative considered: extend the harness entrypoint to wire runtime predictions into scoring (a STRUCTURAL extension, not a SCORING SEMANTICS change). Rejected because (a) operator brief constraint, (b) added scope risk, (c) Sprint 7 has more time for this work."

**Recommendation**: Future sprints' reviewer.md could include a brief "Alternatives considered" section per the adversarial protocol (alternatives not considered → minimum 1). This is a reviewer.md template improvement, not a Sprint 5 fix.

### Assumption Challenged

**Assumption**: The engineer assumed that "no parameter where Sprint 4 evidence + Run 1 motivates a change" implies "Sprint 5 task corona-8yb + corona-28z close cleanly." 

**What's actually being assumed**: That the conditional spirit of the task contract (handoff §3 + §11 + Sprint 4 §11) is binding when read against the more aggressive task descriptions ("Inline-edit src/processor/*.js with refitted ..."). 

**Risk if wrong**: A pedantic reading of the task descriptions would say "the task didn't get done because no inline edits happened." This would force a closure-rationale renegotiation post-hoc. 

**Why this is correctly assumed in Sprint 5**: The handoff explicitly acknowledges the conditional nature. The engineer cited NOTES.md S5-1 + reviewer.md in the closure messages. The auditor following the trail finds the rationale.

**Recommendation**: Make explicit in NOTES.md S5-1 (or reviewer.md) that the conditional task contract is the binding interpretation. Suggested one-liner: "corona-8yb and corona-28z task descriptions read 'Inline-edit ... refitted constants', but the binding contract is the handoff §3 and §11 conditional language: 'refit MUST be motivated by ... evidence OR ... signal'. Sprint 5 evaluated the conditional and found no parameter where it triggers."

### Alternatives Not Considered

**Alternative**: Sprint 5 could have wired runtime predictions into the scoring entrypoint (`scripts/corona-backtest.js:148`) as a STRUCTURAL extension to make Run 2 numerically meaningful. The extension would invoke `flareThresholdProbability(flare.uncertainty, threshold)` per corpus event, build a predicted distribution over T1 buckets at theatre-open time, and pass it as `options.predictedDistribution`. Similar wiring for T2 (kpThresholdProbability) and T4 (Wheatland prior expected count).

**Tradeoff**: 
- **Pro**: Run 2 would numerically diverge from Run 1; refits would have measurable impact; the regression gate would test harness behavior under refit, not just inline-equals-manifest.
- **Con**: Requires constructing fake bundles from corpus events (corpus events are passive data; runtime functions consume oracle bundles). Risk of subtle scoring-semantics drift. Adds scope (~200 LoC of bundle-construction + entrypoint changes). Could be argued as "changing Sprint 3 scoring semantics" depending on interpretation.

**Verdict**: **Current Sprint 5 approach is justified** because:
1. Operator brief constraint: "Do NOT change Sprint 3 scoring semantics unless a direct blocker is found." The harness extension borders on (or arguably crosses) this constraint.
2. Sprint 7 has explicit forward-looking ownership per delta-report.md.
3. Sprint 5's chosen scope (manifest + regression gate) is achievable in-scope and complete.
4. The risk of getting the harness extension wrong (introducing subtle scoring drift) is a Sprint 5 audit failure mode the engineer correctly avoided.

The alternative is correctly deferred to Sprint 7. The engineer should note the alternative was considered (per adversarial protocol) but Sprint 5 should ship as-is.

---

## Previous Feedback Status

This is the first review pass on Sprint 5. No `engineer-feedback.md` from a previous round exists.

---

## Incomplete Tasks

None. All 7 Sprint 5 owner tasks (corona-8yb, corona-28z, corona-25p, corona-3o4, corona-15v, corona-3ja, corona-33u) closed with documented evidence. Epic corona-3fg closed.

---

## Next Steps

**Sprint 5 review verdict: APPROVED.** Operator may proceed to `/audit-sprint sprint-5`.

The non-blocking concerns above are documented for future reference. The engineer MAY apply one-line clarifying additions to NOTES.md S5-1 (re: "no refits motivated under current architecture" framing per Concern 3) but is NOT required to do so for review approval. The current text + delta-report.md disclosure together convey the correct semantics.

Sprint 6 / `corona-r4y` (input-validation review) and the harness extension to wire runtime predictions into scoring are explicitly out of Sprint 5 scope and remain queued for their natural-owner sprints.

Per the operator's brief stop condition: do NOT auto-chain to Sprint 6. Operator commits Sprint 5 only after `/audit-sprint sprint-5` approval.

---

## Verification Commands (for auditor)

```bash
# 1. Confirm Sprint 5 scope discipline
git status --short
git diff --quiet src/ scripts/ tests/corona_test.js && echo "src + harness + baseline tests UNCHANGED"
git diff package.json  # MUST be empty
test -z "$(find . -maxdepth 2 -name 'package-lock.json' -o -name 'yarn.lock' -o -name 'pnpm-lock.yaml' 2>/dev/null)" && echo "NO LOCKFILES"

# 2. Confirm Run 2 hash invariants
diff -q grimoires/loa/calibration/corona/run-1/corpus_hash.txt grimoires/loa/calibration/corona/run-2/corpus_hash.txt
diff -q grimoires/loa/calibration/corona/run-1/script_hash.txt grimoires/loa/calibration/corona/run-2/script_hash.txt

# 3. Confirm tests pass
node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js

# 4. Confirm validator
./scripts/construct-validate.sh construct.yaml

# 5. Confirm beads state
br list --status open --json | grep -c "sprint-5"  # MUST return 0
br list --status closed --json | grep -c "sprint-5"  # MUST return 7+

# 6. Confirm Sprint 4 Round 3 fixes preserved (load-bearing W-1)
node -e "const m=JSON.parse(require('fs').readFileSync('grimoires/loa/calibration/corona/calibration-manifest.json','utf8'));['corona-evidence-006','corona-evidence-020'].forEach(id=>{const e=m.find(x=>x.id===id);console.log(id,e.confidence,e.verification_status,e.provisional);});"
# Expected output:
#   corona-evidence-006 medium ENGINEER_CURATED_REQUIRES_VERIFICATION true
#   corona-evidence-020 medium OPERATIONAL_DOC_ONLY true

# 7. Confirm only one VERIFIED_FROM_SOURCE entry
node -e "const m=JSON.parse(require('fs').readFileSync('grimoires/loa/calibration/corona/calibration-manifest.json','utf8'));console.log(m.filter(e=>e.verification_status==='VERIFIED_FROM_SOURCE').map(e=>e.id).join(','));"
# Expected output: corona-evidence-019

# 8. Confirm settlement_critical+provisional → promotion_path
node -e "const m=JSON.parse(require('fs').readFileSync('grimoires/loa/calibration/corona/calibration-manifest.json','utf8'));const missing=m.filter(e=>e.settlement_critical&&e.provisional&&(!e.promotion_path||!e.promotion_path.length));console.log('Missing:',missing.map(e=>e.id).join(',')||'none');"
# Expected output: Missing: none
```

All commands should pass / produce the expected output.

---

*Senior reviewer feedback for Sprint 5 — CORONA cycle-001. APPROVED with non-blocking concerns documented. Operator may proceed to `/audit-sprint sprint-5`.*

**All good (with noted concerns)**

Concerns documented but non-blocking. See Adversarial Analysis above.
