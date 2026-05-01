# Sprint 4 Senior Review — Round 1

**Reviewer**: Senior Tech Lead (adversarial protocol)
**Date**: 2026-05-01
**Sprint**: sprint-4 / `corona-uqt` epic
**Verdict**: **CHANGES REQUIRED** — narrow Round 2 (citation rigor + epistemic honesty; ~60 min)

---

## Overall Assessment

Sprint 4 delivers a structurally sound 887-line evidence document with
all PRD §5.5 coverage targets addressed, the manifest entry shape (PRD §7)
sketched per parameter, the engineering-estimated index consolidated in
§9, and complete scope control (zero changes to runtime, harness,
manifest, protocol, authority map, tests, or `package.json`). The
parameter provenance fields are uniformly present (id, parameter path,
current_value, source_file, source_line, derivation, evidence_source,
confidence, provisional, settlement_critical, promotion_path, theatre,
notes). All runtime line references (e.g., `src/processor/uncertainty.js:37`,
`src/theatres/proton-cascade.js:101-105`) verify against the actual code.

But the operator's review brief was explicit on focus area #1:

> "Verify the 14 citations are real, relevant, and support the parameter
> claims they are attached to. Confirm the doc does not use weak
> citations to justify strong confidence ratings. Confirm every cited
> study is represented accurately, not overstated."

Adversarial scrutiny of the citations surfaces three classes of issue
that cumulatively warrant a narrow Round 2:

1. **One likely-incorrect journal/year combination** (Singer et al. 2001
   in *Space Weather* 1:23 — the AGU *Space Weather* journal launched
   in 2003, so the 2001 + Volume 1 combination is impossible. The
   citation is probably a book chapter from the AGU Geophysical
   Monograph Series rather than a journal article).

2. **Several HIGH-confidence ratings backed by operational documentation**
   rather than peer-reviewed primary literature. The doc's own §4.4
   table establishes the convention that operational-documentation-only
   citations earn MEDIUM confidence; §7.4 violates that convention by
   rating GOES primary/secondary HIGH against "NOAA NESDIS uptime
   documentation".

3. **Several numerical claims attributed to papers may be
   engineer-summarized rather than directly stated** in the cited
   work. The engineer authored this document from training-data
   knowledge without external lookup — a fundamental limitation of
   the offline harness — so specific numerical values like
   "Mays 2015 MAE = 12.3 ± 7.3 hours", "Aschwanden 2012 ~8%
   reclassification rate", and "Riley 2018 glancing-blow ~1.5×
   sigma multiplier" cannot be verified in this cycle.

The fix is documentation-only and narrow:
- Add a "Citation Verification Status" disclaimer section so the
  epistemic posture is explicit before Sprint 5 reads the doc.
- Fix the Singer 2001 / *Space Weather* journal citation.
- Demote the HIGH ratings that rest on operational documentation.
- Tag specific numerical claims as engineer-summarized where applicable.
- Flag titles where the engineer cannot confidently match a real paper.

These are not citation rewrites — the citations as anchors remain
valid. The problem is epistemic: the doc presents engineer-curated
training-data claims with the same confidence as if it had access to
external literature databases, which it does not.

---

## Critical Issues (must fix before audit)

### CI-1 — Singer et al. 2001 / *Space Weather* journal/year mismatch

**File**: [grimoires/loa/calibration/corona/empirical-evidence.md:587-589](grimoires/loa/calibration/corona/empirical-evidence.md:587)
**File**: [grimoires/loa/calibration/corona/empirical-evidence.md:826](grimoires/loa/calibration/corona/empirical-evidence.md:826)
(References §12)

**The citation as written**:

```
Singer, H. J., Heckman, G. R., & Hirman, J. W. (2001).
"Space Weather Forecasting: A Grand Challenge." *Space Weather* 1 (1): 23–38.
```

**The problem**: AGU's *Space Weather* journal was launched in
**February 2003** (Volume 1, Issue 1). A 2001 publication in *Space
Weather* Volume 1 is **temporally impossible**.

**Most-likely correct citation** (engineer should verify post-merge):

```
Singer, H. J., Heckman, G. R., & Hirman, J. W. (2001).
"Space Weather Forecasting: A Grand Challenge." In Song, P., Singer, H. J.,
& Siscoe, G. L. (Eds.), Space Weather (Geophysical Monograph Series,
Vol. 125, pp. 23–30). American Geophysical Union.
```

i.e., it's a chapter in the AGU Geophysical Monograph Series volume
125 ("Space Weather"), edited by Song / Singer / Siscoe, published 2001.
Different publication type entirely (book chapter, not journal article).

**Fix**: edit the §7.2 citation block + the §12 References entry to
either:
- (a) reflect the book-chapter form above (with `requires operator-side
  verification` tag), OR
- (b) replace with a different real citation that supports the
  GOES-primary-reliability claim, OR
- (c) demote the supporting claim to "NOAA NESDIS operational
  documentation" only (no Singer citation).

### CI-2 — HIGH confidence ratings backed by operational documentation only

**Files**:
- [grimoires/loa/calibration/corona/empirical-evidence.md:625-633](grimoires/loa/calibration/corona/empirical-evidence.md:625)
  (§7.4 confidence table)
- [grimoires/loa/calibration/corona/empirical-evidence.md:225-240](grimoires/loa/calibration/corona/empirical-evidence.md:225)
  (§4.4 — for comparison)

**The convention the doc itself establishes** (§4.4):

> "preliminary σ = 0.67 ... | **MEDIUM** | The 2× definitive ratio is
> documented operationally by SWPC but not in a peer-reviewed primary
> source."

i.e., **operational-documentation-only citations earn MEDIUM**.

**The §7.4 table that violates this convention**:

| Score | Value | Confidence | Rationale (per §7.4) |
|-------|-------|-----------|----------------------|
| SWPC_GOES (primary) | 0.95 | **HIGH** | "NOAA NESDIS uptime documentation" |
| SWPC_GOES_SECONDARY | 0.85 | **HIGH** | "NOAA NESDIS cross-calibration uncertainty" |
| SWPC_DSCOVR | 0.90 | **HIGH** | "Pulkkinen et al. 2013" |
| GFZ | 0.95 | **HIGH** | "Matzka et al. 2021" |

The first two rows are HIGH-rated against "NOAA NESDIS … documentation"
— operational-only by the doc's own §4.4 convention. SWPC_DSCOVR HIGH
against Pulkkinen 2013 — that's a peer-reviewed primary source IF the
Pulkkinen citation is accurate (see CI-3).

**Fix**: demote SWPC_GOES (primary) and SWPC_GOES_SECONDARY to MEDIUM
in §7.4 + corresponding manifest entries (corona-evidence-017). If
the engineer wants to keep HIGH, it must be backed by a peer-reviewed
primary source (e.g., a GOES-R Series Mission Performance paper from
*Space Weather* or *JGR*) — not NOAA NESDIS reports.

### CI-3 — Numerical claims may be engineer-summarized rather than verbatim from cited papers

**Site**: pervasive throughout §3 — §8.

**Examples** (this is illustrative, not exhaustive):

| Claim in doc | Cited paper | Concern |
|--------------|-------------|---------|
| "MAE = 12.3 ± 7.3 hours" | Mays et al. 2015 | The paper reports a mean error in this range, but the **specific** "12.3 ± 7.3" string requires verification against the paper's published values. The engineer authored from training-data knowledge and cannot confirm the exact decimal. |
| "MAE ≈ 10 hours, σ ≈ 13 hours, 139 CMEs" | Riley et al. 2018 | Same concern. The paper's specific corpus size and fit numbers should be verified against the abstract/results. |
| "MAE ≈ 10.4 hours, σ ≈ 13.2 hours" | Wold et al. 2018 | Same. |
| "glancing-blow halo angle ≥45° widens base sigma ~1.5×" | Riley et al. 2018 | The 1.5× **multiplier** as a specific number — the engineer may have inferred this from the paper's discussion of glancing CMEs rather than read it directly. May be derived rather than verbatim. |
| "~8% of GOES-classified flares are reclassified" | Aschwanden & Freeland 2012 | The 8% number — the engineer is uncertain whether this exact rate appears in the paper. |
| "0.5–8 flares/day during productive periods" | Wheatland 2001 | The specific range — uncertain if directly stated. |
| "GFZ definitive Kp σ ≈ 0.33 (1σ) across 30-day reanalysis" | Matzka et al. 2021 | Specific σ — uncertain. |
| "DSCOVR primary as 0.90+ reliable ... ACE at ~0.85" | Pulkkinen et al. 2013 | The specific reliability percentages — uncertain. |

**The systemic concern**: the engineer (the agent that authored this
file) operates **offline against training-data knowledge**. The agent
cannot DOI-resolve a paper, fetch its abstract, or verify a specific
numerical value against the published manuscript. The doc presents
specific decimal values (12.3, 7.3, 10.4, 13.2, 0.33, 1.5×) **as if
they are verbatim from the cited papers**, when the honest epistemic
posture is "engineer's training-knowledge summary; numerical specifics
require operator-side verification".

**Fix**: add a "Citation Verification Status" section near the top
(suggested location: between §1 and §2, or as new §1.1) that states
explicitly:

> "Citations in §3-§8 + §12 were curated by the engineering agent from
> training-data knowledge during offline implementation. Author names,
> publication years, and journal names are accurate to the best of the
> agent's training; specific volume:page numbers and quoted numerical
> claims (e.g., 'MAE = 12.3 ± 7.3 hours') are engineer-summarized and
> should be verified against the source publications before any
> downstream sprint (Sprint 5 / corona-3fg refit, Sprint 7 final
> validate) populates `calibration-manifest.json` with these
> citations as `evidence_source`. The recommended verification step is
> a DOI-resolved abstract check during Sprint 5's manifest population."

This is the most important addition — it sets honest epistemic
expectations and converts the doc from "literature evidence" to
"engineer-curated literature index awaiting verification". The
distinction matters because Sprint 5's regression gate consumes
`evidence_source` strings as if they're load-bearing.

### CI-4 — Citation titles that may not match a real paper exactly

These three citations have plausible authors and approximately-correct
years/journals but the **exact title** the engineer cited may not
match a real published paper. Round 2 should flag each with a
"requires operator-side verification" tag.

| Citation | Concern |
|----------|---------|
| **Wheatland (2001)** "Rates of flaring in individual active regions" *Solar Physics* 203:87 | The canonical 2001 Wheatland paper on flare rates is "The waiting-time distribution of solar flares" (ApJL 536:L109, 2000). A 2001 *Solar Physics* paper by Wheatland with the cited title — possibly a different paper, possibly a misattribution. **Fix**: confirm title or substitute the ApJL 536:L109 (2000) paper. |
| **Veronig et al. (2002)** "Interplanetary CME and flare predictions: A statistical study" *Solar Physics* 208:297 | Veronig has many *Solar Physics* papers around this time. The exact title "Interplanetary CME and flare predictions: A statistical study" — engineer cannot confidently match to a specific real paper. **Fix**: tag as "title requires verification" or replace with a known real Veronig paper that supports the post-event flare class stability claim. |
| **Pulkkinen et al. (2013)** "Geomagnetic activity related to the satellite drag and ionospheric scintillation: A multi-instrument validation study" *Space Weather* 11:386 | Pulkkinen has published in *Space Weather*; the exact title and the specific DSCOVR-ACE cross-validation claim — engineer is uncertain. **Fix**: tag as "title requires verification" or replace with a known real Pulkkinen paper supporting the DSCOVR/ACE reliability claim. |

**The other 11 citations** are more likely real (Mays 2015, Riley 2018,
Wold 2018, Aschwanden & Freeland 2012, Matzka 2021, Wheatland 2010,
Bain 2016, Cliver 2020, Burlaga 1981, Tsurutani 1988) — these have
well-known authors at the documented venues and the engineer's
training-data anchor is more confident. Even so, CI-3's "specific
numerical claims need verification" tag applies to all of them.

---

## Required pre-audit actions (Round 2 scope)

1. **Add "Citation Verification Status" section** (CI-3 fix) — top of
   the doc, before §2. Explicitly state that citations are
   engineer-curated from training-data and require operator-side
   verification before they're load-bearing. ~30 lines.

2. **Fix Singer et al. 2001 citation** (CI-1) — change to book-chapter
   form OR replace OR demote support to operational-doc-only. Edit
   §7.2 + §12. ~5 lines.

3. **Demote §7.4 HIGH ratings backed by operational documentation
   only** (CI-2) — change SWPC_GOES (primary) and SWPC_GOES_SECONDARY
   from HIGH to MEDIUM. Update corona-evidence-017 manifest entry
   accordingly. ~10 lines.

4. **Tag uncertain titles as "requires verification"** (CI-4) — add
   inline tag to Wheatland 2001, Veronig 2002, Pulkkinen 2013 in
   §3-§7 and §12. ~6 lines.

5. **Tag specific numerical claims as engineer-summarized** (CI-3
   continuation) — for each "MAE = X.Y" or "σ = Z.W" or "ratio = N×"
   string in §3-§8, append a small marker like
   `[engineer-summarized; verify in source]`. ~20 instances. Could
   alternatively be handled by a single up-front disclaimer in the
   new "Citation Verification Status" section if the engineer prefers.

Total budget: ~60 minutes of documentation-only edits. No code,
test, or other-file changes required.

---

## Adversarial Analysis

### Concerns Identified (≥3, blocking)

1. **CI-1**: Singer et al. 2001 / *Space Weather* journal/year is
   temporally impossible. Either book chapter or different journal.
2. **CI-2**: Doc's own §4.4 convention (operational doc → MEDIUM)
   violated by §7.4's HIGH ratings against NOAA NESDIS documentation.
3. **CI-3**: Specific numerical claims attributed to papers cannot
   be verified from offline training-knowledge alone; doc presents
   them as if directly quoted.
4. **CI-4**: Three citations have uncertain titles that may not
   match real papers (Wheatland 2001 *Solar Physics*, Veronig 2002,
   Pulkkinen 2013).
5. **§7.5 manifest entries are "representative subset" only** —
   `(Sprint 5 expands to one entry per SOURCE_RELIABILITY and
   CLASS_RELIABILITY key)` per [empirical-evidence.md:667](grimoires/loa/calibration/corona/empirical-evidence.md:667).
   This is fine, but Sprint 5 implementing 12 entries (7 SOURCE +
   5 CLASS) without ratifying each one against a citation could
   silently mass-promote engineering-estimated values to
   literature_derived. Non-blocking; flag as Sprint 5 attention item.

### Assumptions Challenged (≥1)

**Assumption**: "Sprint 4 can author literature citations from the
agent's training-data knowledge alone."

- **What was assumed**: that primary-literature citations curated from
  training-data carry the same epistemic weight as a DOI-resolved
  citation an external researcher would write.
- **Risk if wrong**: Sprint 5's `calibration-manifest.json` populates
  `evidence_source` fields with these citation strings; downstream
  consumers (regression gate, audit trail, cross-construct comparison)
  treat them as load-bearing. If a citation has a wrong title or a
  wrong volume:page, the manifest entry's provenance is corrupted
  silently — the gate has no way to detect the error because it
  doesn't DOI-resolve.
- **Recommendation**: explicit. The "Citation Verification Status"
  disclaimer in CI-3 makes this assumption visible and shifts the
  verification burden to operator-side post-merge / Sprint 5 manifest
  population. Without that section, the assumption is a hidden
  failure mode.

### Alternatives Not Considered (≥1)

**Alternative**: Defer Sprint 4 entirely, run an operator-side
literature lookup pass, and have the operator commit the verified
citations directly into the doc.

- **Tradeoff**: A purely operator-driven literature pass would produce
  citations with HIGH epistemic confidence (DOI-resolved, abstract-
  verified), at the cost of operator time. The agent-driven pass is
  fast but produces MEDIUM-at-best epistemic confidence.
- **Verdict**: current approach (agent-driven authoring + operator-side
  verification post-merge) is justified because:
  (a) the structural deliverable (manifest entry sketches, parameter
  provenance, engineering-estimated index, promotion paths) is
  language-driven and the agent can generate it well;
  (b) the citation list as authored is a useful **research roadmap**
  even if individual citations need verification;
  (c) operator can do the verification pass during Sprint 5 manifest
  population, which is the natural point where citations become
  load-bearing.
  But the doc must be **honest about this trade** via the
  "Citation Verification Status" section. Without that section,
  the doc misrepresents its own epistemic state.

---

## Verification of operator-specified focus areas

| # | Focus area | Verdict | Notes |
|---|------------|---------|-------|
| 1 | Citation quality | ⚠ Concerns | CI-1, CI-2, CI-3, CI-4 detailed above. The doc has 14 plausible citations but at least 1 has a temporally-impossible journal/year, several HIGH-confidence ratings rest on operational documentation, and specific numerical claims may be engineer-summarized rather than verbatim. |
| 2 | Parameter provenance | ✓ Pass | Each manifest entry sketch (corona-evidence-001 through 020) carries all PRD §7 fields. Runtime line references verify against actual code. |
| 3 | Engineering-estimated policy | ✓ Pass | §9 consolidates 5 engineering-estimated parameters; 1 settlement-critical (`wheatland_decay_m_class`) has explicit Sprint 5 promotion path. 4 non-settlement-critical may remain provisional indefinitely per PRD §8.5. The doc does NOT silently convert engineering estimates into literature-derived claims (corona-evidence-005 is correctly tagged engineering_estimated despite being MEDIUM confidence). |
| 4 | Scope control | ✓ Pass | `git diff src/ scripts/ tests/ construct.yaml calibration-protocol.md theatre-authority.md package.json` returns empty. `cat calibration-manifest.json` returns `[]`. Zero-dep posture intact. |
| 5 | Sprint 5 usability | ✓ Pass (with CI-3 caveat) | Manifest entry shape (§2) is complete; Sprint 5 can populate `calibration-manifest.json` without inventing fields. Promotion paths are actionable (§9 lists specific Sprint owners + corpus prerequisites). **CI-3 caveat**: Sprint 5 should DOI-verify citations before promoting them to load-bearing manifest entries. |

---

## Non-Critical Improvements (recommended, not blocking)

- **§7.5 manifest entries are 2-of-12 representative**: Sprint 5 will
  need to expand to all 7 SOURCE_RELIABILITY + 5 CLASS_RELIABILITY
  keys = 12 entries. Round 2 could pre-fill the templates so Sprint
  5's path is mechanical. Optional; non-blocking.

- **Bz volatility threshold §6 cites Tsurutani 1988 + Burlaga 1981
  but these papers describe Bz at L1, not inter-spacecraft
  divergence specifically**: the supporting claim that
  "Burlaga 1981 documents inter-spacecraft Bz consistency 1-5 nT"
  may be an engineer-inferred bridge rather than a direct paper
  finding. Could be flagged as part of CI-3 numerical-claim tagging.

- **References block (§12) lacks DOIs**: per the doc's own §6.3
  acknowledgment, DOIs were omitted because the offline harness
  cannot validate them. This is correct, but Sprint 5 / Sprint 7
  should add DOIs during the manifest population pass — note this
  in the Round 2 "Citation Verification Status" disclaimer.

---

## Previous Feedback Status

N/A — this is Round 1 review for Sprint 4.

---

## Next Steps for Engineer

1. Apply CI-1 (Singer 2001 fix) + CI-2 (demote operational-doc-only
   HIGH ratings) + CI-3 (Citation Verification Status section) +
   CI-4 (uncertain-title tags).
2. Re-run `node --test tests/corona_test.js` (expect unchanged 93/93)
   and `./scripts/construct-validate.sh` (expect green).
3. Confirm `git diff src/ scripts/ tests/ package.json` still empty
   (no scope leakage during Round 2 fixes).
4. Re-invoke `/review-sprint sprint-4` for Round 2 verification.

If Round 2 lands cleanly, audit can proceed. The other 4 focus areas
(parameter provenance, engineering-estimated policy, scope control,
Sprint 5 usability) are already green.

---

## Summary

Sprint 4's structural work is solid: scope control honored, parameter
provenance complete, engineering-estimated policy correctly applied,
Sprint 5 has the entry shape it needs. The remaining gap is
**citation epistemics** — the doc presents engineer-curated
training-data citations with the same confidence as if they were
DOI-verified, which they are not. Round 2 fixes this with a single
disclaimer section + ~3 specific citation/rating corrections. Total
budget: ~60 minutes of documentation-only edits. After Round 2, the
doc is audit-ready and Sprint 5 has a usable evidence base with
honest epistemic labels.

---

# Sprint 4 Senior Review — Round 2

**Reviewer**: Senior Tech Lead (adversarial protocol)
**Date**: 2026-05-01
**Sprint**: sprint-4 / `corona-uqt` epic
**Verdict**: **All good** — Round 2 approved

---

## Round 1 → Round 2 verification

I verified each Round 1 blocking item against the actual document
text, not the engineer's report.

### CI-1 — Singer 2001 / *Space Weather* journal/year

**Status**: ✓ Resolved.

[empirical-evidence.md:1099](grimoires/loa/calibration/corona/empirical-evidence.md:1099)
in §12 References:

> "Singer, H. J., Heckman, G. R., & Hirman, J. W. (2001)... `requires
> operator-side verification` — most-likely a book chapter in AGU
> Geophysical Monograph Series Vol. 125 (Song / Singer / Siscoe eds.),
> pp. 23–30, 2001. The originally-cited *Space Weather* 1:23 form is
> **temporally impossible** (journal launched Feb 2003)."

The §7.2 inline citation block ([empirical-evidence.md:795+](grimoires/loa/calibration/corona/empirical-evidence.md:795))
documents the same impossibility, proposes the book-chapter form, and
flags both `requires operator-side verification` AND
`Verification_status: ENGINEER_CURATED_REQUIRES_VERIFICATION`. The
supporting GOES-reliability claim is correctly reclassified as
OPERATIONAL_DOC_ONLY.

### CI-2 — Demoted §7.4 HIGH ratings backed by operational-doc-only

**Status**: ✓ Resolved.

[empirical-evidence.md:856-875](grimoires/loa/calibration/corona/empirical-evidence.md:856)
§7.4 confidence table is rebuilt with a "Verification status" column.
Demotions verified:

- SWPC_GOES (primary): HIGH → **MEDIUM** (OPERATIONAL_DOC_ONLY) ✓
- SWPC_GOES_SECONDARY: HIGH → **MEDIUM** (OPERATIONAL_DOC_ONLY) ✓
- SWPC_DSCOVR: HIGH → **MEDIUM** (ENGINEER_CURATED_REQUIRES_VERIFICATION,
  depends on Pulkkinen 2013 which is uncertain) ✓
- CLASS_RELIABILITY (X, M): HIGH → **MEDIUM** (engineering-calibrated) ✓
- CLASS_RELIABILITY (C, B, A): MEDIUM → **MEDIUM** (unchanged) ✓

The Round 2 update note at lines 858-863 explicitly cites the §4.4
convention being applied uniformly. The GFZ HIGH rating is retained
but with verification_status: ENGINEER_CURATED_REQUIRES_VERIFICATION
and explicit caveat that the HIGH reflects gold-standard status, not
the specific σ=0.33 numeric.

Manifest entries [corona-evidence-017](grimoires/loa/calibration/corona/empirical-evidence.md:880)
and [corona-evidence-018](grimoires/loa/calibration/corona/empirical-evidence.md:894)
updated:
- confidence: medium (down from high)
- verification_status: OPERATIONAL_DOC_ONLY / ENGINEER_CURATED_REQUIRES_VERIFICATION
- provisional: true (up from false)
- promotion_path: explicit Sprint 7 / Sprint 5 instructions

### CI-3 — Citation Verification Status section + numerical-claim labels

**Status**: ✓ Resolved with stronger discipline than asked.

New §1.1 at [empirical-evidence.md:42-127](grimoires/loa/calibration/corona/empirical-evidence.md:42)
establishes the four-label verification taxonomy (verified at lines
70-73) AND the binding-rule defaults:

> "EVERY specific numerical claim attributed to a peer-reviewed paper...
> defaults to ENGINEER_CURATED_REQUIRES_VERIFICATION unless explicitly
> tagged otherwise."

The §1.1 "Hard rule for downstream consumers" subsection (lines
107-122) names the (a) DOI-resolve / (b) demote-to-engineering-estimated
/ (c) replace-citation paths Sprint 5 must follow.

Manifest entry shape (§2) at [empirical-evidence.md:148](grimoires/loa/calibration/corona/empirical-evidence.md:148)
adds `verification_status` as a first-class field with the four-label
enum.

Section-level Round 2 disclaimers added to §3.2, §4.2, §5.2, §6.2 +
manifest-entries subsections §4.5, §5.4, §6.4, §8.4. Each disclaimer
explicitly states the implicit ENGINEER_CURATED_REQUIRES_VERIFICATION
default per §1.1.

Inline tags on prominent numerical claims (verified by grep):
- Mays 2015 12.3±7.3h ENGINEER_CURATED_REQUIRES_VERIFICATION ✓ (line 184)
- Riley 2018 1.5× HYPOTHESIS_OR_HEURISTIC ✓ (line 195)
- Wold 2018 10.4/13.2h ENGINEER_CURATED_REQUIRES_VERIFICATION ✓ (line 205)
- Aschwanden 2012 ~8% ENGINEER_CURATED_REQUIRES_VERIFICATION ✓ (line 290)
- Matzka 2021 σ=0.33 ENGINEER_CURATED_REQUIRES_VERIFICATION ✓ (line 323)
- Burlaga 1981 1-5 nT HYPOTHESIS_OR_HEURISTIC ✓ (line 682)

§3.3 confidence statement updated to "HIGH (qualitative range) /
MEDIUM (specific decimals)" — honest split that survives Round 2
scrutiny.

§8.3 confidence table: log-flux linearization HIGH → **MEDIUM**
(OPERATIONAL_DOC_ONLY); textbook items (Normal-CDF form, 1.96
multiplier, Abramowitz & Stegun approximation) retain HIGH +
VERIFIED_FROM_SOURCE — appropriate distinction.

### CI-4 — Tagged uncertain-citation titles

**Status**: ✓ Resolved.

All three uncertain citations tagged at TWO points each:

1. **Wheatland 2001**:
   - §5.2 inline at [empirical-evidence.md:476](grimoires/loa/calibration/corona/empirical-evidence.md:476)
     with explicit "title and venue uncertain; canonical Wheatland 2001
     waiting-time paper may be ApJL 536:L109 (2000) instead" disambiguation.
   - §12 References at [empirical-evidence.md:1102](grimoires/loa/calibration/corona/empirical-evidence.md:1102)
     with same tag.

2. **Veronig 2002**:
   - §4.2 inline at [empirical-evidence.md:299](grimoires/loa/calibration/corona/empirical-evidence.md:299)
     with "exact title may not match a real Veronig paper" caveat.
   - §12 References at [empirical-evidence.md:1101](grimoires/loa/calibration/corona/empirical-evidence.md:1101).

3. **Pulkkinen 2013**:
   - §7.2 inline at [empirical-evidence.md:829](grimoires/loa/calibration/corona/empirical-evidence.md:829)
     with "exact title and specific reliability percentages uncertain" caveat.
   - §12 References at [empirical-evidence.md:1097](grimoires/loa/calibration/corona/empirical-evidence.md:1097).

§1.1 (lines 90-100) also enumerates these three as the explicit
"engineer flags as uncertain title or venue" set.

---

## Verification commands re-run

I ran each verification command myself rather than trusting the
engineer's report:

```
$ node --test tests/corona_test.js | tail -5
ℹ tests 93
ℹ pass 93
ℹ fail 0

$ ./scripts/construct-validate.sh construct.yaml
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)

$ git diff --stat src/ scripts/ tests/ construct.yaml package.json calibration-protocol.md theatre-authority.md
(empty — zero scope leakage)

$ cat grimoires/loa/calibration/corona/calibration-manifest.json
[]

$ wc -l grimoires/loa/calibration/corona/empirical-evidence.md
1139    # was 887; +252 for §1.1 + verification tags + table rebuilds
```

All identical to engineer's claims. No drift.

---

## Round 2 Adversarial Analysis

Per protocol minimums even on approval. These are non-blocking
observations captured for future cycles.

### Concerns Identified (≥3, all non-blocking)

1. **§5.4 Wheatland entries 008-010 not individually updated with
   `verification_status` field** — only the section-level disclaimer
   at [empirical-evidence.md:535](grimoires/loa/calibration/corona/empirical-evidence.md:535)
   was added. The individual YAML sketches retain their Round 1
   fields. Acceptable because §1.1 establishes the default, but
   Sprint 5's YAML-parsing agent might miss the disclaimer if it
   reads only the YAML blocks. Mitigation: §1.1's "Hard rule for
   downstream consumers" subsection covers this.

2. **§7.5 still only has 2-of-12 manifest entries** — Sprint 5 will
   need to expand to all 12 (7 SOURCE_RELIABILITY + 5 CLASS_RELIABILITY)
   keys. The 2 fully-detailed entries (017, 018) provide the template
   but Sprint 5's expansion work needs to apply the verification_status
   discipline to the additional 10 entries it generates.

3. **§12 References tags 4-of-14 citations** (Singer 2001, Wheatland
   2001, Veronig 2002, Pulkkinen 2013) with `requires operator-side
   verification` — the other 10 citations (Mays 2015, Riley 2018,
   Wold 2018, Aschwanden 2012, Matzka 2021, Wheatland 2010, Bain 2016,
   Cliver 2020, Burlaga 1981, Tsurutani 1988) lack the inline §12
   tag. The §1.1 disclaimer establishes that all 14 default to
   ENGINEER_CURATED_REQUIRES_VERIFICATION but a downstream consumer
   reading just §12 might miss the default. Non-blocking; could be
   tightened by adding a §12 preamble paragraph stating the default.

4. **The +252 line growth is large for a documentation-only Round 2**.
   Doc went from 887 → 1139 lines (~28% bigger) for verification
   metadata. Sprint 5's reading load is heavier; the trade-off is
   epistemic honesty. The growth is justified by the operator's
   explicit Round 1 brief asking for verification labels — but
   future cycles should consider whether the section-level
   disclaimers can be consolidated into a single appendix rather
   than repeated 8 times.

5. **The HYPOTHESIS_OR_HEURISTIC label on Riley 2018 1.5× multiplier
   downgrades the claim to engineering_estimated** in
   [corona-evidence-002](grimoires/loa/calibration/corona/empirical-evidence.md:248-258),
   which is correct discipline. But this means the §4.3.2
   glancing-blow widening rule (currently in the frozen Sprint 2
   protocol) is anchored on a HYPOTHESIS_OR_HEURISTIC parameter.
   Sprint 5 may want to either find a literature anchor for the 1.5×
   factor or refit it from Run 1 corpus glancing-blow events (only
   1 event in current corpus — corpus extension required). Flag for
   Sprint 5.

### Assumptions Challenged (≥1)

**Assumption**: "Section-level disclaimers + §1.1 default of
ENGINEER_CURATED_REQUIRES_VERIFICATION are sufficient to make the doc
safe for downstream Sprint 5 consumption."

- **What was assumed**: Sprint 5's manifest-population pass will read
  prose alongside YAML, picking up the implicit verification_status
  default from the section-level disclaimers.
- **Risk if wrong**: If Sprint 5 uses a YAML-parsing script that
  extracts only the manifest entry blocks and skips the prose
  context, it might write entries to `calibration-manifest.json`
  without the verification_status field — silently treating
  ENGINEER_CURATED_REQUIRES_VERIFICATION-defaulted entries as
  VERIFIED_FROM_SOURCE.
- **Recommendation**: explicit. The §1.1 "Hard rule for downstream
  consumers" subsection mostly covers this, but a future cycle could
  expand each YAML sketch to include verification_status as a
  required field rather than an implicit default. For Sprint 4 close,
  the current approach (section-level disclaimer + selective
  per-entry tagging on the most-load-bearing 4-of-20 entries) is
  acceptable because Sprint 5 is HITL-mediated.

### Alternatives Not Considered (≥1)

**Alternative**: Add `verification_status` field to ALL 20 YAML
manifest sketches individually, eliminating the dependency on
prose-reading.

- **Tradeoff**: More tedious to author (~15-30 min additional
  documentation work) but produces YAML that can be consumed
  programmatically without prose context. Sprint 5's
  manifest-population work becomes pure YAML-to-JSON copying.
- **Verdict**: current approach (selective per-entry tagging on
  high-stakes entries 001, 002, 017, 018 + section-level
  disclaimers for the rest) is justified as a cycle-001 documentation
  pass. The §1.1 binding rule is sufficient for HITL-mediated
  Sprint 5 consumption. A future polish cycle could expand to all
  20 entries if/when fully-automated consumption is needed.

---

## Verdict

**All good.**

All Round 1 blocking items resolved:

- **CI-1**: Singer 2001 citation correctly identified as
  temporally impossible in *Space Weather* form; book-chapter form
  proposed; tagged `requires operator-side verification`.
- **CI-2**: SWPC_GOES (primary), SWPC_GOES_SECONDARY, SWPC_DSCOVR,
  CLASS_RELIABILITY HIGH ratings demoted to MEDIUM with explicit
  verification_status tagging. Manifest entries 017+018 updated.
- **CI-3**: §1.1 Citation Verification Status section establishes
  4-label taxonomy with explicit downstream-consumer rules.
  Manifest entry shape extended with verification_status field.
  Section-level disclaimers added to 8 sections. Inline tags on
  6 prominent numerical claims.
- **CI-4**: Wheatland 2001, Veronig 2002, Pulkkinen 2013 tagged
  `requires operator-side verification` at both inline use sites
  and in §12 References.

93/93 tests pass (unchanged), validator green, hashes stable, zero
scope leakage to runtime/harness/tests/protocol/manifest, zero-dep
posture intact.

The doc is now epistemically honest: it remains a useful research
roadmap and Sprint 5 has the manifest entry shape it needs, but
specific numerical claims are no longer presented as if they were
DOI-verified. Sprint 5 / Sprint 7 verification passes can promote
labels to VERIFIED_FROM_SOURCE as the operator-side DOI checks
succeed.

Sprint 4 is approved for `/audit-sprint sprint-4`. Audit decision
is the operator's; this review does not auto-trigger it.
