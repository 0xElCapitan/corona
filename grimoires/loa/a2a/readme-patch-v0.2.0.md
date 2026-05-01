# README Patch Report — CORONA v0.2.0

**Authored**: 2026-05-01 (post-v0.2.0 tag, post-audit, patch applied)
**Audit reference**: [`grimoires/loa/a2a/readme-audit-v0.2.0.md`](readme-audit-v0.2.0.md)
**Pre-patch HEAD**: `adf53ff` (uncommitted patch on top)
**Patch scope**: `README.md` + `package.json` (scripts.test only)

---

## Verdict

**Patch complete and verified.** All required v0.2.0 truth-posture fixes applied. `npm test` now runs the full 160-test suite. Validator green. Protected files unchanged. No new dependencies, no lockfiles, no node_modules.

---

## Diff scope

| File | Change | Stat |
|------|--------|------|
| `README.md` | Modified | +44 / -11 (127 → 160 lines) |
| `package.json` | Modified | +1 / -1 (single line in `scripts.test`) |
| `grimoires/loa/a2a/readme-patch-v0.2.0.md` | New (this report) | n/a |

All other paths untouched (24 protected surfaces verified CLEAN: `src/`, `scripts/corona-backtest`, `scripts/construct-validate.sh`, `schemas/`, `construct.yaml`, all `grimoires/loa/calibration/corona/` artifacts including run-1/run-2/run-3-final, `tests/`, `identity/`, `examples/`, PRD/SDD/sprint.md, BUTTERFREEZONE.md).

---

## README changes (per audit map)

| Audit ID | Change | Before | After | README location |
|----------|--------|--------|-------|-----------------|
| **MF-1** | Misleading clause rewrite | "the construct's verifiable track record of forecasting accuracy" | "calibration infrastructure and provenance are committed; predictive uplift has not yet been demonstrated" | L11 (was L9) |
| **MS-1** | v0.2.0 status block added | (absent) | New `> v0.2.0 — cycle-001 closed. Trust level: L1 (Tested). Calibration: infrastructure committed, no parameter refits. L2 publish-readiness: not yet — see Calibration Status.` | L7 (new line) |
| **MS-3** | DONKI-not-settlement clarification | "Solar flares, CMEs, geomagnetic storms with cause-effect linkages" | "Discovery, labels, and evidence enrichment ... **DONKI is NOT a universal settlement authority** — settlement is theatre-specific (e.g., T1 settles against GOES X-ray flux; T2 against GFZ definitive Kp; T3 against L1 shock observation). See `theatre-authority.md`." | L37 |
| **MS-4 + MS-5 + MS-6** | Quick Start command-block overhaul | `node --test tests/corona_test.js` (single command, 93/160 tests) | `./scripts/construct-validate.sh construct.yaml` + `npm test` (full suite) + `CORONA_OUTPUT_DIR=run-scratch node scripts/corona-backtest.js` (calibration reproduction) + standalone SWPC poll + programmatic example | L43-83 |
| **MS-2 + MS-7 + MS-8 + MS-9 + MS-10** | New Calibration Status section | (absent) | New section between Architecture and Calibration Edge Cases. Covers: cycle-001 close + git show v0.2.0 pointer; What v0.2.0 IS (L1 tested + v3-ready + provenance-locked + regression-gated + hardened + reproducible with hash invariants); What v0.2.0 is NOT (NOT calibration-improved + NOT L2 publish-ready); composite verdict `fail` framed honestly; pointer to BUTTERFREEZONE.md | L98-118 (new section) |
| **L114-122 update** | Test count refresh + npm-test pivot + per-file breakdown | "60 tests, 21 suites, all passing: `node --test tests/corona_test.js` # tests 60 ..." | "160 tests, 29 suites, all passing: `npm test` # tests 160 ..." + per-file breakdown (93 baseline + 22 + 29 + 6 + 10) | L143-156 |

---

## Section structure (post-patch)

```
# CORONA
[tagline + status badge]                 [L1-7]
## What It Does                          [L9-21]      (MF-1 applied at L11)
## Theatre Templates                     [L23-31]
## Data Sources                          [L33-39]     (MS-3 applied at L37)
## Quick Start                           [L41-83]     (MS-4/5/6 applied)
## Architecture                          [L85-96]
## Calibration Status                    [L98-118]    (NEW — MS-2/7/8/9/10)
## Calibration Edge Cases                [L120-126]   (unchanged)
## Relationship to TREMOR                [L128-141]   (unchanged)
## Tests                                 [L143-156]   (count update + per-file breakdown)
## License                               [L158-160]   (unchanged)
```

10 → 11 sections (Calibration Status added). 127 → 160 lines (+33 net).

---

## package.json change

```diff
   "scripts": {
-    "test": "node --test tests/corona_test.js",
+    "test": "node --test tests/corona_test.js tests/manifest_structural_test.js tests/manifest_regression_test.js tests/security/corpus-loader-low1-test.js tests/security/proton-cascade-pex1-test.js",
     "poll": "node src/oracles/swpc.js",
     "poll:donki": "node src/oracles/donki.js"
   },
```

Single-key change (`scripts.test`). Verified via `git diff package.json`:

- `version`: unchanged (`"0.2.0"`)
- `dependencies`: unchanged (`{}`)
- `devDependencies`: still null (no field added)
- No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `node_modules` introduced

Zero-runtime-dependency invariant preserved. No tooling added.

---

## Verification (re-run after patch)

### npm test (the new full-suite invocation)

```
$ npm test
ℹ tests 160
ℹ suites 29
ℹ pass 160
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 166.3877
```

✓ 160/160 reported by `npm test` directly (no longer requires hand-typed multi-file `node --test` command).

### Validator

```
$ ./scripts/construct-validate.sh construct.yaml
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)
$ echo $?
0
```

✓ Validator green.

### Honesty grep on patched README

```
$ grep -niE "verifiable track record|forecasting accuracy|calibration improved|empirical performance improvement" README.md
# (no matches — all overclaim phrases removed)

$ grep -niE "publish-ready" README.md
114:- **NOT L2 publish-ready** in the strict construct-network sense ...
# (only match is the explicit negation — correct)
```

### Required honest assertions present

| Assertion | Count |
|-----------|-------|
| `v0.2.0` reference | 7 |
| `L1 tested` + `calibration committed` | 2 |
| `NOT calibration-improved` | 1 |
| `NOT L2 publish-ready` | 1 |
| `Run 1 = Run 2` / `run-3-final` / harness-architecture framing | 4 |
| Composite verdict `fail` | 1 |
| DONKI-not-universal-settlement clarification | 1 |
| `npm test` reference | 2 |

All 8 honest-truth assertions present. None missing.

### Protected file integrity

24 protected surfaces re-verified CLEAN post-patch:

```
src/oracles, src/processor, src/theatres, src/rlmf,
scripts/corona-backtest, scripts/construct-validate.sh, schemas/, construct.yaml,
grimoires/loa/calibration/corona/{calibration-manifest.json, calibration-protocol.md,
  theatre-authority.md, empirical-evidence.md, security-review.md,
  corpus/, run-1/, run-2/, run-3-final/},
tests/, identity/, examples/,
grimoires/loa/{prd.md, sdd.md, sprint.md},
BUTTERFREEZONE.md
```

No source / runtime / scoring / corpus / manifest / protocol / run-artifact mutations.

---

## Operator stop condition: HONORED

- ❌ NOT committed (working tree shows the patch as uncommitted modifications + new audit/patch reports)
- ❌ NOT created GitHub Release
- ❌ NOT created CHANGELOG / RELEASE_NOTES files
- ❌ NOT modified `v0.2.0` tag (annotated tag at adf53ff remains canonical release record)

---

## Post-patch state summary

| Item | Value |
|------|-------|
| HEAD | `adf53ff` (unchanged; patch is uncommitted) |
| Working tree | 2 modified (README.md, package.json), 2 untracked (audit + patch reports) |
| `v0.2.0` tag | unchanged, points to adf53ff |
| `npm test` result | tests 160 / suites 29 / pass 160 / fail 0 |
| Validator | exit 0 |
| Protected files | 24/24 CLEAN |
| Lockfiles | 0 |
| `node_modules` | absent |
| New deps | 0 |

---

## Caveats

1. **Ecosystem URL fact-check**: README:5 still references `AITOBIAS04/Echelon`, `zkSoju`, `0xHoneyJar/loa`. Audit flagged for operator confirmation; patch did not alter these (operator did not instruct to update them). Recommend operator confirms canonical URLs before any GitHub Release.

2. **CHANGELOG**: still absent per cycle-001 closeout discipline. v0.2.0 tag message + BFZ + per-sprint reviewer.md files in `grimoires/loa/a2a/sprint-N/` collectively serve as the release trail. README:7 status badge points readers to the Calibration Status section, which in turn points to BFZ for full posture.

3. **TREMOR analogy table** (README:128-141): Sprint 0-era framing, operator-accepted at Sprint 0 review. Patch did not modify per cycle-001 hard constraint #3 (no Sprint 0-6 reopens).

---

## Next steps (operator-gated per stop condition)

1. **Operator review** of the patched README + package.json
2. **If approved**: stage + commit (suggested message: `docs(corona): patch README + npm test for v0.2.0 truth posture`); push
3. **Optional**: re-run audit pass after patch lands to confirm no new drift
4. **Out of scope (separate gates)**: GitHub Release creation; CHANGELOG creation; cycle-002 kickoff

---

## Positioning Round 2 (post-Round-1 follow-up)

**Authored**: 2026-05-01 (post-Round-1 patch, pre-commit)
**Trigger**: Operator request to pull positioning away from ecosystem-led framing in the opening paragraph.
**Scope**: README.md only (package.json `scripts.test` from Round 1 remains in place, unchanged).

### What Round 2 changed

| Round 1 framing | Round 2 framing |
|-----------------|-----------------|
| Opening paragraph led with "Space weather intelligence construct for [Echelon](...) prediction market framework, built on constructs by [Soju](...). Ridden by [Loa](...). CORONA monitors solar activity..." — three inline ecosystem URLs in the first sentence | Opening paragraph leads with what CORONA *is and does* (a self-contained, feed-driven prediction-market construct producing Brier-scored certificates), followed by *what it's designed for* (construct-network / RLMF-style pipelines with bounded Theatres). Zero ecosystem URLs in the opening. |
| Ecosystem URLs appeared in the first sentence (line 5) | Ecosystem URLs moved to a new `## Ecosystem Context` section (L145-147) with explicit framing: "These are integration contexts, not required trust assumptions for understanding the construct" |

### Specific Round 2 edits

| README location | Before | After |
|-----------------|--------|-------|
| L5 (opening paragraph, replaced) | "Space weather intelligence construct for [Echelon](...) prediction market framework, built on constructs by [Soju](...). Ridden by [Loa](...). CORONA monitors solar activity through structured prediction markets (Theatres), producing Brier-scored training data for the RLMF pipeline." | "CORONA is a space-weather intelligence construct that turns public solar, geomagnetic, CME, proton, and solar-wind feeds into structured prediction-market surfaces and Brier-scored calibration certificates.<br><br>It is designed for construct-network / RLMF-style agent learning pipelines: each Theatre defines a bounded forecast surface, explicit settlement authority, and auditable provenance trail." |
| New section at L145-147 | (none) | `## Ecosystem Context` — preserves the three URLs (Echelon / Soju / Loa) but reframes them as "integration contexts, not required trust assumptions for understanding the construct" with an explicit reminder that CORONA is "self-contained, has zero runtime dependencies, and can be exercised against the validator + test suite + backtest harness without any ecosystem dependency at runtime" |

### Section structure (post-Round-2)

```
# CORONA
[tagline + standalone framing + status badge]    [L1-9]
## What It Does                                  [L11-23]
## Theatre Templates                             [L25-33]
## Data Sources                                  [L35-41]    (DONKI clarification preserved)
## Quick Start                                   [L43-85]    (validator + npm test + backtest preserved)
## Architecture                                  [L87-98]
## Calibration Status                            [L100-120]  (v0.2.0 honesty section preserved)
## Calibration Edge Cases                        [L122-128]
## Relationship to TREMOR                        [L130-143]
## Ecosystem Context                             [L145-147]  (NEW — Round 2)
## Tests                                         [L149-162]
## License                                       [L164-166]
```

11 → 12 sections. 160 → 166 lines (+6 net: 4 lines from opening rewrite + 2 lines from new Ecosystem Context section header).

### Round 2 verification

| Check | Result |
|-------|--------|
| `npm test` after Round 2 edit | tests 160 / suites 29 / pass 160 / fail 0 ✓ |
| `./scripts/construct-validate.sh construct.yaml` | exit 0; `OK: ... @ b98e9ef` ✓ |
| Forbidden phrases (`verifiable track record`, `forecasting accuracy`, `calibration improved`, `empirical performance improvement`) | 0 matches ✓ |
| `publish-ready` substring | only appears in negation form ("NOT L2 publish-ready") at L116 ✓ |
| All 8 Round-1 honesty assertions still present | ✓ (v0.2.0 ×7, L1 tested + calibration committed ×2, NOT calibration-improved ×1, NOT L2 publish-ready ×1, Run 1 = Run 2 framing ×4, composite verdict fail ×1, DONKI not universal settlement ×1, `npm test` ×2) |
| Protected files (24 paths: src/, scripts/, schemas/, construct.yaml, calibration manifest/protocol/authority/evidence/security-review/runs, tests/, identity/, examples/, PRD/SDD/sprint.md, BUTTERFREEZONE.md) | all CLEAN ✓ |
| package.json | unchanged from Round 1 (`scripts.test` still runs full 5-file suite) ✓ |
| New claims introduced in Round 2 | none — only re-positioning of existing facts ✓ |
| Ecosystem URLs in opening | removed ✓ |
| Ecosystem URLs preserved somewhere (per operator instruction "If URLs remain, put them in a small References / Ecosystem Context section near the bottom") | yes, in new `## Ecosystem Context` at L145 ✓ |

### Diff scope after Round 2

| File | Net change since HEAD `adf53ff` |
|------|--------------------------------|
| `README.md` | M (+50 / −13 cumulative across Rounds 1+2; 127 → 166 lines; 10 → 12 sections; Calibration Status + Ecosystem Context added; opening rewritten; DONKI clarification + Quick Start overhaul + test counts updated; MF-1 fixed) |
| `package.json` | M (+1 / −1 from Round 1; `scripts.test` only) |
| `grimoires/loa/a2a/readme-audit-v0.2.0.md` | New (audit report) |
| `grimoires/loa/a2a/readme-patch-v0.2.0.md` | New (this patch report, including Round 2 section) |

All other paths unchanged. Stop condition still honored (no commit, no GitHub Release, no CHANGELOG).

### Why this Round 2 matters

The Round 1 patch correctly addressed the *truth-posture* drift (overclaiming accuracy, missing v0.2.0 framing, missing calibration-not-improved disclosure). Round 2 addresses a separate concern: *positioning sovereignty* — the README's first sentence framed CORONA primarily as an artifact of three external GitHub repos (Echelon, Soju's constructs, Loa). For a v0.2.0 construct that ships with zero runtime dependencies and a self-contained calibration pipeline, leading with ecosystem URLs misrepresents the trust posture: a reader could conclude that understanding or running CORONA requires understanding three other repos. The Round 2 framing makes the construct's standalone identity primary and the ecosystem context appropriately secondary.

This change does not require any code, dependency, or runtime change — only the README's positioning prose. The validator and test suite produce identical output before and after.

---

*Round 2 README positioning complete. README + package.json patch (Rounds 1+2) verified. Awaiting operator commit decision.*
