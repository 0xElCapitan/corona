# README Drift Audit — CORONA v0.2.0

**Auditor**: README Drift Audit (planning pass only)
**Authored**: 2026-05-01 (post-v0.2.0 tag)
**Audit target**: [`README.md`](../../README.md) (127 lines, last modified 2026-04-30 pre-cycle-001)
**Reference state**: HEAD `adf53ff` + `v0.2.0` annotated tag
**Mode**: Audit + planning ONLY. No README edit performed.

---

## Pre-flight verification

| Check | Result |
|-------|--------|
| Working tree clean | ✓ empty `git status --short` |
| HEAD at adf53ff or newer | ✓ `adf53ffef8b36cda261d16ba4d3ab30fcf670974` |
| `v0.2.0` tag points to adf53ff | ✓ `git rev-parse v0.2.0^{commit}` = adf53ff |
| package.json version | ✓ `0.2.0` |

All four pre-flight conditions met. Audit proceeds.

---

## Executive summary

**Recommendation**: **PATCH, not full rewrite.**

The current README is structurally sound (127 lines, clean section flow: tagline → What It Does → Theatres → Data Sources → Quick Start → Architecture → Edge Cases → TREMOR analogy → Tests → License). Most factual content remains accurate against current code. The drift is concentrated in three areas:

1. **One misleading accuracy claim** at L9 ("verifiable track record of forecasting accuracy") that conflicts with the v0.2.0 honest no-refit posture. — **MUST FIX before any public announcement.**
2. **Stale test count** at L114-122 (`60 tests, 21 suites` — actual is `160 tests, 29 suites`). — Easy update.
3. **Missing v0.2.0 calibration story**: no version reference, no backtest harness mention, no manifest/regression-gate disclosure, no Run-3-final outcome, no "NOT calibration-improved" disclaimer, no "NOT L2 publish-ready" disclaimer, no DONKI-is-not-settlement clarification. — Net new content (~40-60 lines).

Total estimated delta: ~50-70 lines on a 127-line file. Surgical patch is the appropriate scope; a full rewrite would over-engineer beyond closeout discipline.

---

## Cross-reference sources verified

| Source | Used for |
|--------|----------|
| [`BUTTERFREEZONE.md`](../../BUTTERFREEZONE.md) (362 lines, refreshed Sprint 7) | Calibration status, v0.2.0 framing, Known Limitations, hash invariants |
| [`construct.yaml`](../../construct.yaml) (v3 manifest) | schema_version, streams, commands, compose_with |
| [`package.json`](../../package.json) | version field, dependencies (zero), test script |
| [`grimoires/loa/calibration/corona/calibration-protocol.md`](../calibration/corona/calibration-protocol.md) (523 lines, Sprint 2 frozen) | Protocol invariants |
| [`grimoires/loa/calibration/corona/calibration-manifest.json`](../calibration/corona/calibration-manifest.json) (30 entries, Sprint 5) | Provenance + verification_status taxonomy |
| [`grimoires/loa/calibration/corona/run-3-final/summary.md`](../calibration/corona/run-3-final/summary.md) | Hash invariants + composite verdict |
| [`grimoires/loa/calibration/corona/run-3-final/delta-report.md`](../calibration/corona/run-3-final/delta-report.md) | Run 1 = Run 2 = Run-3-final architectural-reality framing |
| [`grimoires/loa/calibration/corona/security-review.md`](../calibration/corona/security-review.md) | Sprint 6 finding count (0/0/9/16) |
| [`grimoires/loa/calibration/corona/theatre-authority.md`](../calibration/corona/theatre-authority.md) (Sprint 0) | DONKI-is-not-universal-settlement rule + per-theatre authority |
| [`grimoires/loa/a2a/sprint-7/e2e-goal-validation.md`](sprint-7/e2e-goal-validation.md) (256 lines) | 21/21 PRD goal coverage |
| `v0.2.0` tag message (annotated, points to adf53ff) | Canonical v0.2.0 release framing |
| `src/theatres/proton-cascade.js` lines 21-22, 36, 68-70, 190-192 | T4 trigger logic + S-scale binding |
| `src/theatres/{flare-gate,geomag-gate}.js` constructor signatures | Quick Start example accuracy |

---

## Classification

### 1. Accurate / keep (no change needed)

| README location | Content | Verification |
|-----------------|---------|--------------|
| L1-3 | Title + tagline ("Coronal Oracle & Realtime Observation Network Agent") | Matches BFZ:29 |
| L11-19 | Architecture ASCII diagram | Topology unchanged from Sprint 0 |
| L23-29 | Theatre Templates table — T1, T2, T3, T5 framings | Match constructor signatures + theatre-authority.md |
| L25 (T1) | "Will a ≥M/X-class flare occur within 24h?" | Reasonable framing of T1 binary market |
| L26 (T2) | "Will Kp reach ≥5 (G1) within 72h?" | Question template at `geomag-gate.js:47` is parameterized; this is one valid instance |
| L27 (T3) | "Will CME arrive within predicted window ±6h?" | Matches calibration-protocol.md §4.3 + theatre-authority.md |
| L28 (T4) | "How many S1+ proton events following M5+ trigger?" | Matches `proton-cascade.js:190-192` (M5+ trigger requirement) + S-scale resolving logic |
| L29 (T5) | "Will sensor readings diverge beyond threshold?" | Vague but consistent with Bz-volatility divergence proxy |
| L33-37 | Data Sources section | All sources active in current code |
| L48-74 | Quick Start `import { CoronaConstruct }` example | Constructors match `src/index.js:70-94`; base_rate defaults match `flare-gate.js:35` (0.15) and `geomag-gate.js:39` (0.10) |
| L78-87 | Architecture description (Oracle → Processor → Theatre → RLMF) | Pattern unchanged |
| L91-95 | Calibration Edge Cases bullets | All 5 bullets match BFZ § Calibration Edge Cases |
| L99-110 | TREMOR/CORONA mapping table | Sprint 0-era framing; operator-accepted at Sprint 0; no v0.2.0 conflict |
| L127 | License: MIT | Matches `package.json` |

### 2. Stale / update

| README location | Current content | Should become | Why |
|-----------------|-----------------|---------------|-----|
| L43 | `node --test tests/corona_test.js` | Multi-file command running all 5 test files (corona_test + manifest_structural + manifest_regression + 2 security tests) | Current command runs 93/160 tests (58%); incomplete coverage |
| L114 | "60 tests, 21 suites, all passing" | "160 tests, 29 suites, all passing" | Actual count after Sprints 0-6: 93 baseline + 22 manifest_structural + 29 manifest_regression + 6 PEX-1 + 10 C-006 = 160 |
| L116-123 | Test output `# tests 60 / # suites 21 / # pass 60 / # fail 0` | `# tests 160 / # suites 29 / # pass 160 / # fail 0` | Same drift as L114 |
| L17 (in diagram) | "Brier scores" caption | Acceptable as-is, but consider adding "calibration buckets, temporal analysis" parity with BFZ:49 | Optional polish |

### 3. Misleading / must fix

| # | README location | Current content | Concern | v0.2.0-correct framing |
|---|-----------------|-----------------|---------|------------------------|
| **MF-1** | L9 | "Every resolved market exports a calibration certificate — **the construct's verifiable track record of forecasting accuracy**." | The bolded clause implies the construct has demonstrated forecasting accuracy. Per cycle-001 closeout (BFZ:179, run-3-final/delta-report.md:50, v0.2.0 tag message): **empirical performance improvement was NOT demonstrated**. Run 1 = Run 2 = Run-3-final by architectural design (uniform-prior baseline scoring). Calling it a "verifiable track record of forecasting accuracy" overclaims. | "Every resolved market exports a calibration certificate — a Brier-scored, hash-stable record of the market's predicted distribution against observed outcome. cycle-001 v0.2.0 establishes the certificate-export pipeline and the regression-gated provenance manifest; empirical predictive accuracy is a future-cycle deliverable (see Calibration Status)." |
| **MF-2** | (entire README) | No v0.2.0 reference; no cycle-001 mention | A reader cannot tell which release they're looking at. The README pre-dates Sprint 0 (mtime 2026-04-30) and was not refreshed during cycle-001. | Add a status block near the top: version 0.2.0; cycle-001 closed; L1 tested + calibration committed; NOT calibration-improved; NOT L2 publish-ready. |
| **MF-3** | (entire README) | No "calibration NOT improved" disclosure | Without explicit disclosure, readers will assume "Brier-scored RLMF training data" implies improved Brier. The honest no-refit posture is operator hard constraint #14. | Add a Calibration Status section that explicitly states: Run 1 = Run 2 = Run-3-final by architectural design; Sprint 5 evidence-driven NO-CHANGE decision; v0.2.0 ships calibration **infrastructure** + **provenance**, not empirical uplift. |

### 4. Missing / should add

| # | What's missing | Where in proposed README | Rationale |
|---|----------------|---------------------------|-----------|
| **MS-1** | Version + cycle status badge | Top, between L3 (tagline) and L7 (## What It Does) | A v0.2.0-tagged repo should make its release marker visible on landing |
| **MS-2** | Calibration Status section (3-5 lines): infrastructure complete + provenance locked + regression gated + predictive uplift NOT yet demonstrated | New section, possibly between Architecture (L76-87) and Calibration Edge Cases (L89-95) | Mirrors BFZ § Calibration Status; addresses MF-1 and MF-3 |
| **MS-3** | DONKI-is-NOT-settlement disclosure | In Data Sources section near L36 | theatre-authority.md L5 ("**Operative rule**: DONKI is **NOT** a universal settlement oracle") is a load-bearing v0.2.0 invariant. README readers seeing DONKI listed alongside SWPC may assume DONKI is also a settlement source. |
| **MS-4** | Validator command in Quick Start | Insert in/after L43-46 | Sprint 0 deliverable; v3 manifest validator. Quick Start should reference it. |
| **MS-5** | Backtest harness command in Quick Start | Insert in/after L43-46 | Sprint 3 deliverable. `CORONA_OUTPUT_DIR=run-scratch node scripts/corona-backtest.js`. Reproduces v0.2.0's calibration runs. |
| **MS-6** | Full-suite test command (replacing the corona_test-only command at L43) | Replace L42-43 | Closes a 67-test coverage gap that the existing Quick Start hides. |
| **MS-7** | Hash invariants OR a pointer to them | New Calibration Status section OR end of doc | corpus_hash `b1caef3...` + script_hash `17f6380b...` are v0.2.0's reproducibility anchors. Either include in Calibration Status or link to BFZ ground-truth-meta block. |
| **MS-8** | Pointer to `BUTTERFREEZONE.md` for the full provenance map (Known Limitations, future-cycle items) | Footer or in Calibration Status | BFZ is the single source of truth for v0.2.0 posture; README should defer to it for depth rather than duplicate. |
| **MS-9** | Pointer to `grimoires/loa/calibration/corona/` for protocol + manifest + runs + security review | Calibration Status section | Surface the calibration deliverables for users who want to audit. |
| **MS-10** | L2 publish-readiness disclaimer | Calibration Status section | BFZ:291 says "v0.2.0 ships as L1 tested + calibration committed. It is NOT L2 publish-ready in the strict construct-network sense." README readers should not assume L2 publish gates pass. |
| **MS-11** | Trust level: L1 (Tested) | Top status block (with MS-1) | BFZ AGENT-CONTEXT `trust_level: L1-tested` |

### 5. Should remove

| # | What | Why |
|---|------|-----|
| (none) | — | The README is tight; no obvious deadweight to cut. The 127-line size is appropriate for a construct README. |

Note: the TREMOR/CORONA analogy table at L99-110 is **borderline**. The "CME Arrival ↔ Swarm Watch" mapping is a strained analogy (different temporal-clustering semantics), but Sprint 0 review accepted it. Per cycle-001 hard constraint #3 ("Do NOT reopen Sprints 0-6 unless final validation exposes a direct blocker"), revisiting it is out of scope. **Keep**.

---

## Special-attention items (operator's audit focus list) — disposition

| Operator focus | Disposition | Action |
|----------------|-------------|--------|
| Current version 0.2.0 | MISSING from README | Add (MS-1) |
| v3 construct-network readiness | MISSING from README | Add — reference `construct.yaml conforms to v3 (b98e9ef)` |
| L1 tested + calibration committed | MISSING from README | Add (MS-2) |
| NOT calibration-improved / predictive uplift not demonstrated | MISSING from README | Add (MF-1, MF-3, MS-2) |
| NOT L2 publish-ready | MISSING from README | Add (MS-10) |
| Zero runtime dependencies | PRESENT at L87 ("Zero external dependencies") | Keep; consider strengthening to "zero **runtime** dependencies" + reference `package.json` `"dependencies": {}` |
| 160/160 tests | STALE (says 60) | Update (L114-122) |
| Manifest / provenance / regression gate | MISSING from README | Add (MS-2, MS-9) |
| Run 1 / Run 2 / Run-3-final outcome | MISSING from README | Add (MS-2) — reference architectural-reality framing |
| Final composite verdict fail | MISSING from README | Add (MS-2) — disclose `fail` honestly with the WHY (corpus characteristic, not parameter degradation) |
| Theatre descriptions, especially T4 proton/S-scale | ACCURATE (L28 framing matches code) | Keep; verify M5+ trigger language matches `proton-cascade.js:190-192` ✓ |
| Install/use commands | INCOMPLETE — missing validator + backtest | Update (MS-4, MS-5, MS-6) |
| Echelon/RLMF claims | ACCURATE in spirit (L5: "Echelon prediction market framework"; L46: RLMF certificates) — but consider toning down "verifiable track record of forecasting accuracy" at L9 (see MF-1) | Update (MF-1) |
| DONKI not being universal settlement authority | MISSING from README | Add (MS-3) |
| TREMOR/BREATH sibling positioning | TREMOR analogy table at L99-110 (Sprint 0 framing); BREATH not mentioned | TREMOR table: keep (Sprint 0-locked). BREATH: not relevant for README (BREATH is read-only pattern source per operator hard constraint J); no action |
| Old v0.1.0 / pre-cycle-001 claims | One: L9 "verifiable track record" implies pre-cycle-001 confidence framing. No explicit version mention. | Update (MF-1, MS-1) |

---

## Recommendation: PATCH (not rewrite)

### Why patch

- Existing structure is correct (tagline → What → Theatres → Data → Quick Start → Architecture → Edge Cases → Sibling → Tests → License)
- Most content is factually accurate against current code
- Drift is concentrated: 1 misleading line (L9), 3 stale lines (L43, L114, L116-122), and ~40-60 lines of new calibration-story content
- Closeout discipline (Sprint 7 hard constraints + Karpathy "Surgical Changes") favors targeted edits over rewrites
- A rewrite would re-litigate Sprint 0-era decisions (e.g., TREMOR analogy table) that operator already accepted

### Proposed patch outline (in section order)

```
README.md (proposed v0.2.0 patched structure)

# CORONA
**Coronal Oracle & Realtime Observation Network Agent**
[tagline paragraph — KEEP, with MF-1 surgical fix on the "verifiable track record of forecasting accuracy" clause]

> v0.2.0 — cycle-001 closed. Trust level: L1 (Tested). Calibration: attempted, no parameter refits.    [NEW — MS-1 + MS-11]

## What It Does                       [KEEP L9-19, with MF-1 surgical fix to L9]

## Theatre Templates                   [KEEP L21-29 unchanged]

## Data Sources                        [KEEP L31-37, with MS-3 insertion clarifying DONKI is not a universal settlement authority + reference to theatre-authority.md]

## Quick Start                         [REPLACE L41-74 with multi-step block:
                                          1. install (n/a — zero deps)
                                          2. run validator (NEW — MS-4)
                                          3. run full test suite (UPDATE — MS-6, replaces L42-43)
                                          4. run backtest harness (NEW — MS-5)
                                          5. programmatic usage (KEEP L48-74)]

## Architecture                        [KEEP L76-87]

## Calibration Status                  [NEW SECTION — MS-2 + MS-7 + MS-8 + MS-9 + MS-10
                                        ~25-35 lines covering:
                                        - cycle-001 outcome: infrastructure complete, provenance locked, regression gated
                                        - Run 1 / Run 2 / Run-3-final = identical by design (architectural reality, NOT improvement)
                                        - composite verdict 'fail' framed honestly
                                        - hash invariants (corpus_hash + script_hash)
                                        - 30-entry manifest with verification_status taxonomy
                                        - Sprint 6 security review (0 critical / 0 high / 0 medium)
                                        - NOT L2 publish-ready (Sprint 0 carry-forward gaps)
                                        - Pointers: BUTTERFREEZONE.md + grimoires/loa/calibration/corona/]

## Calibration Edge Cases              [KEEP L89-95]

## Relationship to TREMOR              [KEEP L97-110]

## Tests                               [UPDATE L112-123: 60→160, 21→29]

## License                             [KEEP L125-127]
```

**Estimated diff**: ~50-70 line delta (mostly additions in the new Calibration Status section + Quick Start overhaul + MF-1 single-clause fix + L114/L120 count updates).

---

## Must-fix claims before any GitHub Release or public announcement

These are the **blocking** items. The remaining drift is non-blocking polish.

| # | Issue | Severity | Why blocking |
|---|-------|----------|--------------|
| 1 | **MF-1**: L9 "verifiable track record of forecasting accuracy" | **MUST FIX** | Directly contradicts v0.2.0 honest no-refit framing in BFZ + delta-report + tag message. A GitHub Release advertising the construct on the basis of this README would conflict with the v0.2.0 tag message which explicitly says "NOT empirical-uplift demonstrated". |
| 2 | **MS-2**: Add Calibration Status section with NOT-improved + NOT-L2-publish-ready disclosures | **MUST FIX** | Without these disclosures, a GitHub Release reader will assume calibration-improved + L2-ready. Both would be over-claims. |
| 3 | **MS-3**: Add DONKI-is-not-settlement clarification | **MUST FIX** | theatre-authority.md operator rule. Listing DONKI alongside SWPC without this clarification creates the impression that DONKI is a settlement source. |
| 4 | **L114-122**: Test counts 60→160 | **MUST FIX** | A GitHub Release advertising "60 tests" alongside the v0.2.0 tag message claiming "160 tests" creates an internal inconsistency that audit-tracking tools will flag. |

### Non-blocking polish (recommended but not release-blockers)

- MS-1 (version + status badge) — strongly recommended for release-readiness even if not strictly blocking
- MS-4, MS-5 (validator + backtest commands in Quick Start) — completeness, not correctness
- MS-6 (full-suite test command in Quick Start) — completeness
- MS-7, MS-8, MS-9 (hash invariants + BFZ pointer + calibration-dir pointer) — discoverability
- L43 standalone test command update — duplicate of L114 fix; covered by MS-6

---

## Notes / caveats

1. **Ecosystem URL fact-check**: README L5 references three external GitHub URLs (`AITOBIAS04/Echelon`, `zkSoju`, `0xHoneyJar/loa`). I have no way to verify these are still canonical without external network access. **Recommend operator confirms** before any patch lands.

2. **README mtime**: 2026-04-30 (per `ls -la` 4764 bytes / 127 lines). This pre-dates all of Sprint 0-7. The README has not been refreshed throughout cycle-001. The patch will be the first release-aligned README update.

3. **Quick Start `import { CoronaConstruct }` example**: All field names and base_rate defaults match current code. The example produces working markets. **Verified accurate**, no change needed except the test-command update.

4. **package.json `"test"` script** at `package.json:18` (`"test": "node --test tests/corona_test.js"`) currently runs only 93/160 tests. Updating package.json's test script is **out-of-scope for a README audit** but would be a natural companion change to MS-6. **Flag as future-cycle scope OR include in narrow Round 2 if operator approves.**

5. **CHANGELOG.md absence**: BFZ:291 + reviewer.md note CHANGELOG is absent. README references no changelog. If the operator wants a release-trail for v0.2.0, the canonical pointers are: the v0.2.0 annotated tag message + BFZ § Calibration Status timeline + per-sprint reviewer.md files in `grimoires/loa/a2a/sprint-N/`. README could add a "Release notes: see `git show v0.2.0`" pointer.

6. **What the patch must NOT do**: per Sprint 7 hard constraints (still in force as cycle-001 closeout discipline):
   - NOT add new theatres, oracles, scoring code references
   - NOT modify `.claude/`
   - NOT introduce new dependencies in any code-block snippet
   - NOT silently weaken provenance claims
   - NOT overclaim accuracy or empirical improvement (MF-1 in particular guards against this)

---

## Audit verdict

| Question | Answer |
|----------|--------|
| Is the README aligned with v0.2.0? | **NO** — 1 misleading claim + 3 stale counts + ~9 missing items |
| Patch or rewrite? | **PATCH** — surgical edit, ~50-70 line delta |
| OK to publish a GitHub Release as-is? | **NO** — at least the 4 blocking items must be fixed first |
| Audit complete? | YES — handed off to operator for patch authorization |

---

## Next steps (operator-gated)

1. **Operator decision**: approve patch scope (≈ outline above) and authorize a narrow README edit
2. **If approved**: surgical edit applying MF-1 + MS-1 + MS-2 + MS-3 + MS-4 + MS-5 + MS-6 + MS-7 + MS-8 + MS-9 + MS-10 + MS-11 + L114/L120 updates
3. **Optional companion**: update `package.json:18` test script to multi-file command (out-of-scope for README audit; would require its own scope decision)
4. **Pre-publish step**: re-run README audit after patch lands; verify no new drift introduced
5. **Post-patch step**: operator decides on GitHub Release creation (separate gate per cycle-001 stop condition)

---

*README drift audit complete. No README modification performed. Awaiting operator authorization for patch.*
