# Sprint 4 Security Audit — CORONA cycle-001-corona-v3-calibration

**Auditor**: Paranoid Cypherpunk (auditing-security skill)
**Verdict**: **CHANGES_REQUIRED** — narrow Round 3 (~10 min, internal-consistency fix)
**Date**: 2026-05-01
**Sprint epic**: `corona-uqt` (3 tasks closed: corona-2zs, corona-1ve, corona-36t — `review-approved` labeled)
**Pre-flight**: Senior approval Round 2 verified ("All good" at engineer-feedback.md tail); no prior COMPLETED marker.
**Operator focus areas**: 8 evaluated; **0 CRITICAL, 2 HIGH, 0 MEDIUM, 0 LOW** — both HIGH findings are internal-consistency violations of the doc's own §4.2/§8.3 verification labels in §4.5/§8.4 manifest entry sketches.

---

## Executive Verdict

Sprint 4 passes 7-of-8 audit focus areas cleanly. No secrets, no scope leakage, no dependency mutations, no Sprint 5 work started, citation uncertainty is broadly well-labeled (§1.1 Citation Verification Status taxonomy + section-level disclaimers + 6 inline tags on prominent claims). The Round 1 → Round 2 review process correctly tightened the high-stakes citations (Singer 2001 fix, §7 demotions, uncertain-title tags).

But focus area #7 — *"No settlement-critical parameter is promoted to high-confidence literature-derived status without verification"* — surfaces **two specific manifest entry sketches** that contradict the doc's own §4.2 + §8.3 verification labels:

1. **corona-evidence-006** (Kp σ definitive = 0.33, T2 settlement-critical) is YAML-tagged `confidence: high` + `provisional: false` + `notes: "Direct citation; high confidence"` — but the body §4.2 inline tag at line 323 marks the specific 0.33 value as `ENGINEER_CURATED_REQUIRES_VERIFICATION` because the engineer cannot DOI-confirm the exact decimal in Matzka 2021.

2. **corona-evidence-020** (log_flux linearization, T1 settlement-critical) is YAML-tagged `confidence: high` + `provisional: false` — but the §8.3 confidence table was demoted in Round 2 to `MEDIUM` + `OPERATIONAL_DOC_ONLY` (NOAA SWPC operational methodology, not peer-reviewed).

Both YAML manifest entries directly contradict the body-text verification labels for the same parameter. Sprint 5's manifest-population pass would copy the YAML values verbatim and silently promote two ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY parameters to settlement_critical=true + literature_derived + HIGH + provisional=false — exactly the failure mode the operator's focus #7 was guarding against.

The fix is mechanical: 3 field updates per entry (confidence, provisional, verification_status). Total budget: ~10 minutes of YAML-only edits. No prose, code, or test changes required.

---

## Pre-flight Checks

| Check | Result |
|-------|--------|
| Sprint 4 directory exists | ✓ `grimoires/loa/a2a/sprint-4/` contains `reviewer.md`, `engineer-feedback.md` |
| Senior reviewer approved | ✓ engineer-feedback.md Round 2 tail declares "All good" |
| Prior COMPLETED marker | ✓ Not present (correct state for audit) |
| Beads tasks state | ✓ All 3 closed; epic `corona-uqt` labeled `review-approved`, `sprint:4` |
| Validator | ✓ `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)` |
| Tests | ✓ 93/93 pass (unchanged from Sprint 3 close) |
| `git diff package.json` | ✓ Empty (zero-dep invariant intact) |
| `calibration-manifest.json` | ✓ `[]` (Sprint 5 territory preserved) |

---

## Operator Focus Area Verdicts

### Focus Area 1 — No secrets/API keys in empirical-evidence.md or sprint artifacts

**Verdict**: ✓ CLEAN

| Check | Method | Result |
|-------|--------|--------|
| Hardcoded API keys / tokens / secrets in `grimoires/loa/a2a/sprint-4/` | `grep -rEni "api[_-]?key\|secret\|token\|password\|bearer\|sk-[A-Za-z0-9]\|ghp_\|aws_\|0x[a-f0-9]{40}\|client_secret\|private.key\|BEGIN.*PRIVATE\|email\|@[a-z]+\.com"` | No matches |
| Same grep over `grimoires/loa/calibration/corona/empirical-evidence.md` | (same) | No matches |
| URLs / endpoints | grep | Only public NOAA SWPC + GFZ + journal links cited as references; no internal hostnames or API keys in URLs |
| PII | grep for emails, IPs, names other than published journal-author identities | No PII. Cited author names (Mays, Riley, Wold, Aschwanden, etc.) are public scholarly identities. |

**No findings.**

### Focus Area 2 — No runtime, harness, test, protocol, authority-map, construct.yaml, package.json, or manifest changes slipped in

**Verdict**: ✓ CLEAN

```
$ git diff --stat src/ scripts/ tests/ construct.yaml package.json \
    grimoires/loa/calibration/corona/calibration-protocol.md \
    grimoires/loa/calibration/corona/theatre-authority.md \
    grimoires/loa/calibration/corona/calibration-manifest.json \
    grimoires/loa/calibration/corona/run-1/ \
    grimoires/loa/calibration/corona/corpus/
(empty)
```

Sprint 4 touched ONLY:
- `grimoires/loa/calibration/corona/empirical-evidence.md` (the deliverable)
- `grimoires/loa/sprint.md` (Sprint 4 deliverable/AC/task checkmarks)
- `.beads/issues.jsonl` (task lifecycle)
- `grimoires/loa/a2a/sprint-4/` (new dir with `reviewer.md` + `engineer-feedback.md`)

No runtime, harness, test, protocol, authority-map, construct.yaml, package.json, manifest, run-1, or corpus changes. ✓

**No findings.**

### Focus Area 3 — calibration-manifest.json remains []

**Verdict**: ✓ CLEAN

```
$ cat grimoires/loa/calibration/corona/calibration-manifest.json
[]
```

Sprint 1 placeholder unchanged. Sprint 5 (`corona-3fg`) territory preserved.

**No findings.**

### Focus Area 4 — No new dependency introduced

**Verdict**: ✓ CLEAN

| Check | Result |
|-------|--------|
| `git diff package.json` | Empty |
| `package.json:32 "dependencies": {}` | Preserved per PRD §8.1 zero-dep invariant |
| Lockfiles (`package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`) | None present |
| Sprint 4 imports | N/A — markdown-only deliverable, no code |

**No findings.**

### Focus Area 5 — Citation uncertainty honestly represented and not disguised as verified fact

**Verdict**: ⚠ MOSTLY CLEAN with two HIGH internal-consistency findings (see Focus Area 7 below)

| Check | Result |
|-------|--------|
| §1.1 Citation Verification Status section established | ✓ Present at lines 42-127; 4-label taxonomy enumerated at lines 70-73 |
| Manifest entry shape extended with `verification_status` field | ✓ Added at empirical-evidence.md:148 |
| Section-level verification disclaimers | ✓ Added to §3.2 (line 175), §4.2 (line 282), §4.5 (line 351), §5.2 (line 471), §5.4 (line 535), §6.2 (line 654), §6.4 (line 709), §8.4 — 8 sections covered |
| Inline tags on prominent numerical claims | ✓ Mays 2015 12.3±7.3h tagged ENGINEER_CURATED_REQUIRES_VERIFICATION (line 184); Riley 2018 1.5× tagged HYPOTHESIS_OR_HEURISTIC (line 195); Wold 2018 10.4/13.2h tagged ENGINEER_CURATED_REQUIRES_VERIFICATION (line 205); Aschwanden 2012 8% tagged ENGINEER_CURATED_REQUIRES_VERIFICATION (line 290); Matzka 2021 σ=0.33 tagged ENGINEER_CURATED_REQUIRES_VERIFICATION (line 323); Burlaga 1981 1-5nT tagged HYPOTHESIS_OR_HEURISTIC (line 682) |
| Singer 2001 / *Space Weather* journal/year impossibility documented | ✓ Lines 795+ (§7.2) and 1099 (§12 References) explicitly flag temporal impossibility + propose book-chapter form + tag `requires operator-side verification` |
| Wheatland 2001 / Veronig 2002 / Pulkkinen 2013 tagged | ✓ All three tagged inline at use sites AND in §12 References |

The doc's prose layer correctly represents citation uncertainty. **The audit finding is at the YAML-manifest layer**, where two specific entries silently contradict their own body-section labels — see Focus Area 7.

### Focus Area 6 — Engineering-estimated / hypothesis / heuristic values clearly labeled

**Verdict**: ✓ CLEAN

| Check | Result |
|-------|--------|
| §9 engineering-estimated parameter index | ✓ Lists 5 engineering-estimated parameters (1 settlement-critical, 4 not) |
| `derivation: engineering_estimated` entries in YAML | ✓ corona-evidence-005, 011, 012, 013, 016 — five entries match the §9 count |
| `provisional: true` for engineering-estimated entries | ✓ All five carry `provisional: true` |
| Settlement-critical engineering-estimated has `promotion_path` | ✓ corona-evidence-011 (wheatland_decay_m_class @ 0.90) has explicit Sprint 5 promotion path: "Sprint 5 / corona-3fg refit: validate against M-class T4 corpus events..." |
| HYPOTHESIS_OR_HEURISTIC entries flagged | ✓ corona-evidence-002 (Riley 2018 1.5× factor) carries `verification_status: HYPOTHESIS_OR_HEURISTIC`, `derivation: engineering_estimated`, `provisional: true`, with explicit Sprint 5 promotion path |

**No findings.**

### Focus Area 7 — No settlement-critical parameter promoted to high-confidence literature-derived status without verification

**Verdict**: ✗ **CHANGES_REQUIRED — 2 HIGH-severity findings**

I enumerated every YAML manifest entry sketch with `settlement_critical: true` and audited the (`derivation`, `confidence`, `provisional`) tuple against the doc's own body-section verification labels for the same parameter.

**11 settlement_critical entries audited**:

| Entry | Parameter | derivation | confidence | provisional | Body label conflict? |
|-------|-----------|------------|-----------|-------------|----------------------|
| corona-evidence-003 | flare.doubt_base_in_progress | literature_derived | medium | false | None — §4.4 also rates MEDIUM |
| **corona-evidence-006** | **kp.sigma_definitive** | **literature_derived** | **HIGH** | **false** | **VIOLATION — see CR-1** |
| corona-evidence-007 | kp.sigma_preliminary | literature_derived | medium | false | None — §4.4 also rates MEDIUM |
| corona-evidence-008 | wheatland_lambda_x_class | literature_derived | medium | false | None — §5.3 rates MEDIUM |
| corona-evidence-009 | wheatland_decay_x_class | literature_derived | medium | false | None — §5.3 rates MEDIUM |
| corona-evidence-010 | wheatland_lambda_m_class | literature_derived | medium | false | None — §5.3 rates MEDIUM |
| corona-evidence-011 | wheatland_decay_m_class | engineering_estimated | medium | true | None — correctly engineering_estimated with promotion_path |
| corona-evidence-014 | bz_divergence_threshold | literature_derived | medium | false | None — §6.3 rates MEDIUM |
| corona-evidence-015 | sustained_minutes | literature_derived | medium | false | None — §6.3 rates MEDIUM |
| corona-evidence-017 | goes_primary_reliability | literature_derived | **medium** | true | ✓ Correctly demoted Round 2 (CI-2) |
| corona-evidence-018 | dscovr_ace_cross_val_reliability | literature_derived | **medium** | true | ✓ Correctly demoted Round 2 (CI-2) |
| **corona-evidence-020** | **log_flux linearization** | **literature_derived** | **HIGH** | **false** | **VIOLATION — see CR-2** |

**Two YAML manifest entries violate the operator's audit focus #7**:

#### CR-1 — corona-evidence-006 (Kp σ definitive = 0.33) — YAML inconsistent with §4.2 inline tag

**File**: [empirical-evidence.md:399-411](grimoires/loa/calibration/corona/empirical-evidence.md:399)

**The YAML as written**:
```yaml
- id: corona-evidence-006
  parameter: processor.uncertainty.kp.sigma_definitive
  current_value: 0.33
  source_file: src/processor/uncertainty.js
  source_line: 134
  derivation: literature_derived
  evidence_source: "Matzka et al. 2021 (Space Weather 19:e2020SW002641) — GFZ definitive Kp 1σ ≈ 0.33"
  confidence: high                    # ← VIOLATION
  provisional: false                  # ← VIOLATION
  settlement_critical: true
  promotion_path: null                # ← VIOLATION (settlement_critical + provisional should not be null)
  theatre: T2
  notes: "Direct citation; high confidence."   # ← contradicts §4.2 inline tag
```

**The body-section label that contradicts it** at [empirical-evidence.md:323](grimoires/loa/calibration/corona/empirical-evidence.md:323):

> "|Kp_prelim − Kp_def| ≈ 0.33 Kp units (1σ) [ENGINEER_CURATED_REQUIRES_VERIFICATION
> — the specific 0.33 value matches the runtime constant at uncertainty.js:134,
> but engineer cannot confirm this exact decimal is reported in Matzka 2021.
> The qualitative claim that GFZ definitive Kp has ~3× tighter σ than SWPC
> preliminary is well-established; the exact ratio needs DOI verification]."

Plus the §4.5 section-level disclaimer at [empirical-evidence.md:351](grimoires/loa/calibration/corona/empirical-evidence.md:351):
> "all entries below carry an implicit `verification_status:
> ENGINEER_CURATED_REQUIRES_VERIFICATION` per §1.1 unless individually
> marked otherwise. Sprint 5's manifest population pass MUST DOI-resolve
> the cited papers (Aschwanden 2012, Veronig 2002, Matzka 2021) and
> either promote to VERIFIED_FROM_SOURCE or substitute a verifiable
> alternative."

**The contradiction**: The §4.2 body explicitly says the specific 0.33 value is ENGINEER_CURATED_REQUIRES_VERIFICATION. The §4.5 section-level disclaimer establishes the same default. But the corona-evidence-006 YAML has `confidence: high` + `provisional: false` + `notes: "Direct citation; high confidence"` — claiming verification that the engineer cannot perform offline.

**Why this is HIGH-severity** (operator focus #7 violation):
- Sprint 5's manifest-population agent will copy the YAML verbatim into `calibration-manifest.json`.
- The resulting manifest entry will be `settlement_critical: true` + `literature_derived` + `confidence: high` + `provisional: false` — i.e., a fully-promoted, regression-gate-load-bearing entry that has NOT been DOI-verified.
- T2 regression-tier scoring uses GFZ as authority (the entry's `notes` field says so). A wrong σ value would directly affect bucket-boundary uncertainty pricing on every T2 corpus event.
- The operator's audit focus #7 was explicit: "No settlement-critical parameter is promoted to high-confidence literature-derived status without verification."

**Fix** (mandatory):
```yaml
  confidence: medium                  # was: high — demote to match §4.2 inline tag
  verification_status: ENGINEER_CURATED_REQUIRES_VERIFICATION   # add field
  provisional: true                   # was: false — promote to provisional pending DOI verification
  promotion_path: "Sprint 5 / corona-3fg manifest population OR Sprint 7 final-validate: DOI-resolve Matzka et al. 2021 (Space Weather 19:e2020SW002641) and confirm the specific σ=0.33 numerical claim verbatim; promote to confidence=high + verification_status=VERIFIED_FROM_SOURCE + provisional=false on confirmation. If the paper does not directly state σ=0.33, substitute a different verifiable Kp-uncertainty source."
  notes: "Specific σ=0.33 value matches runtime constant at uncertainty.js:134; engineer cannot offline-verify against Matzka 2021. Qualitative claim that GFZ definitive Kp has ~3× tighter σ than SWPC preliminary is well-established. Sprint 5 DOI verification required before this becomes regression-gate-load-bearing."
```

#### CR-2 — corona-evidence-020 (log_flux linearization) — YAML contradicts §8.3 Round 2 demotion

**File**: [empirical-evidence.md (corona-evidence-020 block)](grimoires/loa/calibration/corona/empirical-evidence.md)

**The YAML as written**:
```yaml
- id: corona-evidence-020
  parameter: processor.uncertainty.normal_cdf.linearization_variable
  current_value: "log_flux"
  source_file: src/processor/uncertainty.js
  source_line: 95
  derivation: literature_derived
  evidence_source: "NOAA SWPC operational flare-probability product methodology"
  confidence: high                    # ← VIOLATION
  provisional: false                  # ← VIOLATION
  settlement_critical: true
  promotion_path: null
  theatre: T1
```

**The body-section label that contradicts it** — §8.3 confidence table (Round 2 update):

> "Log-flux linearization for flare class | **MEDIUM** | OPERATIONAL_DOC_ONLY | CI-3 Round 2 demotion: operational SWPC methodology, not peer-reviewed primary source. Flux does scale geometrically with class (textbook fact), but the choice to linearize THERE in the threshold-crossing model is operational."

**The contradiction**: §8.3 explicitly demotes log-flux linearization from HIGH to MEDIUM (OPERATIONAL_DOC_ONLY) in Round 2. The corona-evidence-020 YAML retains the pre-Round-2 `confidence: high` + `provisional: false`. The Round 2 demotion was applied to the prose layer but not propagated to the manifest entry.

**Why this is HIGH-severity** (operator focus #7 + #5 violation):
- Same downstream-consumer concern as CR-1: Sprint 5 will copy the YAML verbatim.
- log-flux linearization is the foundational variable for T1's threshold-crossing probability model — a HIGH literature_derived rating implies the variable choice is well-grounded in peer-reviewed work, but it's NOAA SWPC operational methodology only.
- Operator focus #5 is about citation uncertainty being honest — Round 2 made it honest in the prose; this YAML entry undoes that.

**Fix** (mandatory):
```yaml
  confidence: medium                  # was: high — match §8.3 Round 2 demotion
  verification_status: OPERATIONAL_DOC_ONLY   # add field
  provisional: true                   # was: false — operational-doc-only earns provisional
  promotion_path: "Sprint 7 / corona-1ml or future cycle: locate a peer-reviewed primary source for the choice of log-flux as the linearization variable in flare-class threshold-crossing probability models (e.g., a Solar Physics or ApJ paper deriving the linearization); promote to confidence=high + verification_status=VERIFIED_FROM_SOURCE + provisional=false on confirmation."
```

### Focus Area 8 — Sprint 5 work has not started

**Verdict**: ✓ CLEAN

| Check | Result |
|-------|--------|
| `calibration-manifest.json` | `[]` (Sprint 5 / corona-25p territory) |
| `tests/manifest_regression_test.js` (Sprint 5 / corona-15v) | Not present |
| `tests/manifest_structural_test.js` (Sprint 5 / corona-3o4) | Not present |
| `grimoires/loa/calibration/corona/run-2/` (Sprint 5 / corona-3ja) | Not present |
| `git diff src/processor/` (Sprint 5 / corona-8yb) | Empty |
| `git diff src/theatres/` (Sprint 5 / corona-28z) | Empty |
| `br list --status open` Sprint 5 tasks | All 8 tasks (corona-3fg, corona-15v, corona-25p, corona-28z, corona-33u, corona-3ja, corona-3o4, corona-8yb) remain `open` |

**No findings.**

---

## Findings Summary

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 2 | CR-1 (corona-evidence-006 Kp σ definitive YAML inconsistent with §4.2 + §4.5 disclaimer); CR-2 (corona-evidence-020 log-flux linearization YAML contradicts §8.3 Round 2 demotion) |
| MEDIUM | 0 | — |
| LOW | 0 | — |

Both findings are **internal inconsistencies** between the prose-layer verification labels (which Round 2 correctly tightened) and the YAML manifest sketches (which Round 2 missed). Both are settlement_critical, both would be silently promoted to load-bearing status by Sprint 5's manifest-population pass without intervention.

---

## Required pre-completion actions (Round 3 scope)

1. **CR-1 fix**: edit corona-evidence-006 YAML in §4.5 — demote `confidence` to `medium`, add `verification_status: ENGINEER_CURATED_REQUIRES_VERIFICATION`, flip `provisional` to `true`, add explicit promotion_path. Update `notes` field to remove "Direct citation; high confidence" language and replace with the Round 2 epistemic posture.

2. **CR-2 fix**: edit corona-evidence-020 YAML in §8.4 — demote `confidence` to `medium`, add `verification_status: OPERATIONAL_DOC_ONLY`, flip `provisional` to `true`, add explicit promotion_path. (No `notes` change needed — there's no notes field on this entry.)

3. **Re-run audit-side checks** after fixes:
   ```bash
   node --test tests/corona_test.js              # expect 93/93 pass (unchanged)
   ./scripts/construct-validate.sh construct.yaml  # expect green
   git diff package.json                         # expect empty
   ```

4. **Update reviewer.md §10 Round 2 Evidence section** with a new "Round 3 follow-up" subsection documenting the audit's CR-1/CR-2 fixes for traceability.

5. **Re-invoke `/audit-sprint sprint-4`** for Round 3 verification. Should be a quick re-check that the two YAML entries are now internally consistent.

Total budget: ~10 minutes of YAML-only edits. No prose, code, test, or runtime changes required.

---

## Why this audit caught what Round 2 review didn't

The Round 2 senior review correctly identified §7.4's HIGH-on-operational-doc violations (CI-2) and demoted entries 017 + 018. But the §4.4 Kp σ definitive HIGH rating and the §8.4 log-flux HIGH rating were not in the Round 1 review's CI-2 scope — Round 1 was specifically focused on §7 source-reliability, and Round 2 only touched §7. The §4.4 / §4.5 / §8.3 / §8.4 chains were addressed in CI-3 (verification labels) and §8.3 demotion, but the corresponding YAML manifest entries weren't mechanically synced.

The audit phase catches these because it walks every settlement_critical entry against its body-section label, not just the §7 entries. This is the value of having a separate audit gate after senior review.

---

## Decision

**CHANGES_REQUIRED**

Sprint 4 cannot pass audit until corona-evidence-006 + corona-evidence-020 YAML manifest entries are synced with their body-section verification labels. The fix is small and mechanical (3 fields per entry + one notes update). After Round 3 lands, re-running the audit should produce APPROVED.

The other 7 focus areas pass cleanly:
- No secrets / API keys / PII
- No runtime/harness/test/protocol/manifest changes
- calibration-manifest.json `[]` preserved
- Zero new dependencies
- Engineering-estimated values clearly labeled (5 entries, 1 settlement-critical with explicit promotion path)
- Sprint 5 work not started

Once CR-1 and CR-2 are addressed, Sprint 4 is audit-ready.

---

*Sprint 4 security audit — CORONA cycle-001 (`corona-uqt` epic). 3 tasks closed. 7-of-8 audit focus areas clean; 2 HIGH-severity internal-consistency violations of operator focus #7 (settlement-critical parameter HIGH-confidence-literature-derived without verification) at corona-evidence-006 + corona-evidence-020. Round 3 fix is YAML-only, ~10 min.*

---

# Sprint 4 Security Audit — Round 3 Verdict

**Auditor**: Paranoid Cypherpunk
**Verdict**: **APPROVED - LETS FUCKING GO**
**Date**: 2026-05-01

---

## Round 1 → Round 3 verification

I verified each Round 1 audit blocking item against the actual YAML
in `empirical-evidence.md`, not the engineer's report.

### CR-1 — corona-evidence-006 (Kp σ definitive = 0.33)

**Status**: ✓ Resolved.

YAML at [empirical-evidence.md corona-evidence-006](grimoires/loa/calibration/corona/empirical-evidence.md):

| Field | Round 1 audit | Round 3 verified | Status |
|-------|---------------|-------------------|--------|
| `confidence` | high | medium | ✓ Demoted |
| `verification_status` | (absent) | ENGINEER_CURATED_REQUIRES_VERIFICATION | ✓ Added |
| `provisional` | false | true | ✓ Flipped |
| `promotion_path` | null | explicit (a)/(b)/(c) paths | ✓ Added |
| `notes` | "Direct citation; high confidence." | epistemic-honesty paragraph stating engineer cannot offline-verify the σ=0.33 decimal | ✓ Replaced |
| `evidence_source` | "Matzka et al. 2021... — GFZ definitive Kp 1σ ≈ 0.33" | "Matzka et al. 2021... — claim: GFZ definitive Kp 1σ ≈ 0.33; engineer offline-curated, exact decimal not source-verified" | ✓ Clarified |

The new YAML is internally consistent with the §4.2 inline tag at
[empirical-evidence.md:323](grimoires/loa/calibration/corona/empirical-evidence.md:323)
and the §4.5 section-level disclaimer.

The `promotion_path` provides three concrete remediation paths (DOI-
resolve / substitute source / backtest-derive) with explicit
acceptance criteria for each. Sprint 5 has actionable guidance.

### CR-2 — corona-evidence-020 (log_flux linearization)

**Status**: ✓ Resolved.

YAML at [empirical-evidence.md corona-evidence-020](grimoires/loa/calibration/corona/empirical-evidence.md):

| Field | Round 1 audit | Round 3 verified | Status |
|-------|---------------|-------------------|--------|
| `confidence` | high | medium | ✓ Demoted |
| `verification_status` | (absent) | OPERATIONAL_DOC_ONLY | ✓ Added |
| `provisional` | false | true | ✓ Flipped |
| `promotion_path` | null | explicit (a)/(b)/(c) paths | ✓ Added |
| `evidence_source` | "NOAA SWPC operational flare-probability product methodology" | "NOAA SWPC operational flare-probability product methodology — operational-doc-only" | ✓ Clarified |

The new YAML is internally consistent with the §8.3 confidence
table's Round 2 demotion (log-flux linearization MEDIUM +
OPERATIONAL_DOC_ONLY).

The `promotion_path` provides three concrete remediation paths
(peer-reviewed primary source / empirical validation against Run 1+
T1 corpus / accept indefinite provisional). Sprint 5 has actionable
guidance.

---

## Focus area #7 re-sweep

I re-enumerated all 11 settlement_critical YAML manifest entry sketches
and audited the (`derivation`, `confidence`, `provisional`,
`verification_status`) tuple. **Zero entries remain at
literature_derived + HIGH + provisional: false** post-Round-3:

| Entry | derivation | confidence | provisional | verification_status |
|-------|------------|-----------|-------------|---------------------|
| 003 (flare.doubt_base_in_progress) | literature_derived | medium | false | (implicit per §4.5 disclaimer) |
| **006 (kp.sigma_definitive)** | literature_derived | **medium** | **true** | **ENGINEER_CURATED_REQUIRES_VERIFICATION** ✓ Round 3 |
| 007 (kp.sigma_preliminary) | literature_derived | medium | false | (implicit) |
| 008 (wheatland_lambda_x_class) | literature_derived | medium | false | (implicit per §5.4 disclaimer) |
| 009 (wheatland_decay_x_class) | literature_derived | medium | false | (implicit) |
| 010 (wheatland_lambda_m_class) | literature_derived | medium | false | (implicit) |
| 011 (wheatland_decay_m_class) | engineering_estimated | medium | true | (correctly engineering_estimated) |
| 014 (bz_divergence_threshold) | literature_derived | medium | false | (implicit per §6.4 disclaimer) |
| 015 (sustained_minutes) | literature_derived | medium | false | (implicit) |
| 017 (goes_primary_reliability) | literature_derived | medium | true | OPERATIONAL_DOC_ONLY (Round 2 demotion) |
| 018 (dscovr_ace_cross_val_reliability) | literature_derived | medium | true | ENGINEER_CURATED_REQUIRES_VERIFICATION (Round 2) |
| **020 (log_flux linearization)** | literature_derived | **medium** | **true** | **OPERATIONAL_DOC_ONLY** ✓ Round 3 |

The entries with `provisional: false` (003, 007, 008-010, 014, 015)
are all `medium` confidence, matching their body-section labels
exactly. They rely on the §4.5 / §5.4 / §6.4 section-level
disclaimers to establish their implicit
ENGINEER_CURATED_REQUIRES_VERIFICATION default. This is acceptable
per §1.1's downstream-consumer rule: Sprint 5's manifest-population
pass MUST read the prose alongside YAML.

The four high-stakes entries (006, 017, 018, 020) now carry
explicit per-entry `verification_status` fields, eliminating the
prose-vs-YAML inconsistency that triggered Round 1's CR-1 and CR-2.

**Operator focus area #7 violation: CLOSED.**

---

## Verification commands re-run during Round 3

```
$ node --test tests/corona_test.js 2>&1 | tail -5
ℹ tests 93
ℹ pass 93
ℹ fail 0

$ ./scripts/construct-validate.sh construct.yaml
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)

$ git diff --stat src/ scripts/ tests/ construct.yaml package.json \
    grimoires/loa/calibration/corona/calibration-protocol.md \
    grimoires/loa/calibration/corona/theatre-authority.md \
    grimoires/loa/calibration/corona/calibration-manifest.json \
    grimoires/loa/calibration/corona/run-1/ \
    grimoires/loa/calibration/corona/corpus/
(empty)

$ cat grimoires/loa/calibration/corona/calibration-manifest.json
[]
```

All identical to engineer's claims. No drift.

Working tree post-Round-3 modifies only:
- `grimoires/loa/calibration/corona/empirical-evidence.md` (two YAML entry sketches)
- `grimoires/loa/sprint.md` (Sprint 4 checkmarks from earlier)
- `.beads/issues.jsonl` (task lifecycle)
- `grimoires/loa/a2a/sprint-4/` (reviewer.md + engineer-feedback.md + this auditor-sprint-feedback.md + COMPLETED)

No scope leakage to runtime / harness / tests / protocol / authority /
construct.yaml / package.json / manifest / run-1 / corpus.

---

## Findings Summary (Round 3)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | CR-1 + CR-2 closed in Round 3 |
| MEDIUM | 0 | — |
| LOW | 0 | — |

Zero remaining audit findings.

---

## Decision

**APPROVED - LETS FUCKING GO**

Sprint 4 passes security audit. All 8 operator focus areas verified
clean post-Round-3. The two HIGH-severity internal-consistency
violations (CR-1 corona-evidence-006, CR-2 corona-evidence-020)
identified in Round 1 are closed via YAML-only fixes that synchronize
the manifest entry sketches with the doc's body-section verification
labels.

The doc is now uniformly epistemically honest: every settlement_critical
parameter that lacks DOI verification or peer-reviewed primary source
is explicitly tagged provisional with an actionable promotion_path.
Sprint 5 / `corona-3fg` has the manifest-population contract it needs
without any silent promotion of engineer-curated values to load-bearing
status.

Sprint 4 is ready for operator commit + push. The audit does NOT
auto-commit per operator stop-condition instructions.

---

*Sprint 4 security audit — CORONA cycle-001 (`corona-uqt` epic). 3 tasks closed, Round 1 → Round 3. Round 3: closed CR-1 (corona-evidence-006 Kp σ definitive HIGH→MEDIUM + verification_status + provisional + promotion_path) + CR-2 (corona-evidence-020 log-flux linearization HIGH→MEDIUM + verification_status + provisional + promotion_path). 93/93 tests pass throughout, validator green, zero new deps, no runtime/harness/manifest/protocol modifications. Markdown-only deliverable approved.*
