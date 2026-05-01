# Sprint 7 Senior Lead Review — `/review-sprint sprint-7`

**Reviewer**: Senior Lead (`/reviewing-code` skill)
**Authored**: 2026-05-01 (Sprint 7 Round 1 review)
**Implementation under review**: HEAD `cf489ee` + uncommitted Sprint 7 changes
**Implementer report**: [`grimoires/loa/a2a/sprint-7/reviewer.md`](reviewer.md) (447 lines)

---

## Verdict

**All good (with noted concerns)**

Sprint 7 has been reviewed and **approved**. All 7 operator-specified review focus areas pass. Concerns documented below are non-blocking cosmetic items that do not affect any acceptance criterion or honest-framing assertion.

**Cleared to proceed to `/audit-sprint sprint-7`.**

---

## Per-focus verdict

| # | Focus area | Verdict | Notes |
|---|------------|---------|-------|
| 1 | Closeout-only scope | ✓ PASS | All 28 protected files/directories clean; no Sprint 0-6 modifications |
| 2 | Final run integrity | ✓ PASS | Hashes match Sprint 3 baseline; per-event byte-identical to Run 2; theatre numerics identical to Run 1; verdict `fail` clearly stated |
| 3 | No-overclaiming | ✓ PASS | Every "improvement" mention in target docs is a negation; honest framing repeated across all 4 docs |
| 4 | E2E 21 goals | ✓ PASS | All 21 PRD goals supported with verified file:line evidence |
| 5 | BFZ refresh drift | ✓ PASS (with cosmetic concerns) | Load-bearing claims match; minor counting drift in Module Map row and directory-tree comment (see Concerns 1+2 below) |
| 6 | Version bump | ✓ PASS | Single-field diff; zero deps; no lockfiles; no v0.2.0 tag created |
| 7 | Validator + test evidence | ✓ PASS | Validator exit 0; 160/160 tests; manifest structural (22) + regression (29) + security (16) all included |

---

## Verification evidence (independently re-run by reviewer)

### Focus 1: Protected files clean

Twenty-eight protected paths checked via `git diff --stat` + `git ls-files --others --exclude-standard`. All clean:

- `src/oracles/{swpc,donki}.js` and dir
- `src/processor/`, `src/theatres/`, `src/rlmf/`
- `scripts/corona-backtest/scoring/`, `scripts/corona-backtest/ingestors/corpus-loader.js`, `scripts/corona-backtest.js`, `scripts/construct-validate.sh`
- `schemas/`, `construct.yaml`
- `grimoires/loa/calibration/corona/{calibration-manifest.json, calibration-protocol.md, theatre-authority.md, empirical-evidence.md, security-review.md, corpus/, run-1/, run-2/}`
- `tests/{corona_test.js, manifest_*_test.js, security/}`
- `identity/`, `examples/`

### Focus 2: Run-3-final integrity

```
$ for run in run-1 run-2 run-3-final; do
    cat grimoires/loa/calibration/corona/$run/corpus_hash.txt
    cat grimoires/loa/calibration/corona/$run/script_hash.txt
  done
b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1   # all 3 runs
17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1   # all 3 runs

$ diff -r grimoires/loa/calibration/corona/run-2/per-event/ \
          grimoires/loa/calibration/corona/run-3-final/per-event/
# (empty — byte-identical)

# Per-theatre numeric diff (run-3-final vs run-1):
T1: identical    T2: identical    T3: identical    T4: identical    T5: identical
```

Composite verdict at [`run-3-final/summary.md:7`](../../calibration/corona/run-3-final/summary.md#L7) is `fail` — clearly visible, not hidden, not paraphrased away.

### Focus 3: No-overclaiming honesty audit

Searched all 4 target docs (`BUTTERFREEZONE.md`, `run-3-final/delta-report.md`, `e2e-goal-validation.md`, `reviewer.md`) for forbidden phrases (`calibration improved`, `calibrated accuracy improved`, `empirical performance improvement`, etc.). **All matches are negations** — every occurrence of "calibration improvement" is in the form `NOT a calibration improvement` or in a grep verification command. Direct positive framing of v0.2.0 in each doc:

- BFZ:179 — *"v0.2.0 ships the construct as a deployable + calibration-attempted artifact, NOT a calibration-improved one"*
- delta-report:54 — *"v0.2.0 ships the construct as a **deployable + calibration-attempted** artifact, not a **calibration-improved** one"*
- e2e-goal-validation:19 — *"v0.2.0 is 'construct + calibration committed', not 'calibration delivers improved Brier/MAE'"*
- reviewer.md:16 — *"calibration-attempted (not calibration-improved); v0.2.0 ships with documented limitations, not an overclaim of empirical accuracy"*

Run 2 = Run 1 architectural-reality framing repeated at 11 locations across all 4 docs.

### Focus 4: 21-goal evidence spot-checks

| Goal | Claim | Verified |
|------|-------|----------|
| G0.1 | `schema_version: 3` at construct.yaml:17 | ✓ |
| G0.2 | streams: at construct.yaml:105-111 | ✓ (4-of-5 declared; see Concern #3) |
| G0.3 | identity/CORONA.md 60 lines | ✓ |
| G0.4 | composition_paths.writes at construct.yaml:97-100 | ✓ |
| G0.5 | 5 commands at construct.yaml:57-77 | ✓ (5 `- name:` entries) |
| G0.6 | compose_with at construct.yaml:80-83 | ✓ |
| G0.7 | pack_dependencies: [] at construct.yaml:132 | ✓ |
| G0.8 | validator green | ✓ (re-confirmed: exit 0) |
| G0.9 | BFZ AGENT-CONTEXT:1 + ground-truth-meta:350 | ✓ |
| G0.10 | examples/tremor-rlmf-pipeline.md exists | ✓ (5491 bytes) |
| G0.11 | theatre-authority.md 78 lines | ✓ |
| G0.12 | S-scale at proton-cascade.js:24-28 | ✓ |
| GC.1 | calibration-protocol.md 523 lines | ✓ |
| GC.2 | run-1/, run-2/, run-3-final/ all have summary.md | ✓ (3/3) |
| GC.3 | empirical-evidence.md 1141 lines | ✓ (BFZ comment says 1139; see Concern #2) |
| GC.4 | manifest 30 entries | ✓ (`jq 'length'` returns 30) |
| GC.5 | manifest_regression_test.js 29 tests pass | ✓ (re-confirmed) |
| GF.1 | validator green at b98e9ef | ✓ |
| GF.2 | BFZ refreshed (193→362 lines) | ✓ |
| GF.3 | run-3-final/ structurally complete | ✓ (10 files + 25 per-event) |
| GF.4 | 160/160 tests pass | ✓ (re-confirmed) |

### Focus 5: BFZ drift check

Load-bearing claims all match:

| BFZ field | Claim | Repo truth | Match? |
|-----------|-------|------------|--------|
| AGENT-CONTEXT version | 0.2.0 | package.json:3 = 0.2.0 | ✓ |
| AGENT-CONTEXT test_count | 160 | 160 actual | ✓ |
| AGENT-CONTEXT v3_schema | b98e9ef | construct-validate.sh + validator output | ✓ |
| Manifest entries | 30 | jq 'length' = 30 | ✓ |
| Verification-status taxonomy | 1 / 15 / 8 / 6 | jq aggregate matches | ✓ |
| Run hashes | b1caef3... / 17f6380b... | all 3 runs | ✓ |
| ground-truth-meta runs_committed | [run-1, run-2, run-3-final] | 3 dirs present | ✓ |
| Sprint 6 finding count | 0 critical / 0 high / 9 medium / 16 low | matches security-review.md | ✓ |
| 51 manifest tests | 22 + 29 = 51 | matches | ✓ |

### Focus 6: Version bump diff

```
$ git diff package.json
@@ -1,6 +1,6 @@
   "name": "@echelon/corona",
-  "version": "0.1.0",
+  "version": "0.2.0",
   "description": "..."
```

- Single-line content diff
- `dependencies: {}` unchanged at package.json:32
- No package-lock.json, no yarn.lock, no pnpm-lock.yaml, no node_modules
- Pre-existing `v0.1.0` tag (on `d57bde1` Initial commit, predates Sprint 7); no `v0.2.0` tag created (stop condition honored)

### Focus 7: Validator + test re-run

```
$ ./scripts/construct-validate.sh construct.yaml; echo $?
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)
0

$ node --test tests/corona_test.js \
              tests/manifest_structural_test.js \
              tests/manifest_regression_test.js \
              tests/security/proton-cascade-pex1-test.js \
              tests/security/corpus-loader-low1-test.js
ℹ tests 160 / suites 29 / pass 160 / fail 0
```

Per-file inclusion confirmed: 22 (manifest_structural) + 29 (manifest_regression) + 6 (PEX-1) + 10 (C-006) = 67 special tests; remainder = 93 baseline tests. Math: 22 + 29 + 6 + 10 + 93 = 160. ✓

---

## Adversarial Analysis

### Concerns Identified (3)

1. **BFZ Module Map row drift** — [BUTTERFREEZONE.md:142](../../../BUTTERFREEZONE.md#L142) claims `scripts/corona-backtest/ | 11 | Backtest harness: per-theatre scoring (5), ingestors (3), reporting (2), config (1)`, but actual file inventory is **14 files**: scoring 5 + **ingestors 5** (corpus-loader, donki-fetch, donki-sanity, gfz-fetch, swpc-fetch) + **reporting 3** (hash-utils, write-report, write-summary) + config 1. Verified via `find scripts/corona-backtest -maxdepth 2 -name "*.js" | wc -l` → 14. Operator review focus #5 listed drift surfaces as "construct.yaml, package.json, run outputs, manifest" — this drift is against the file system, not the listed surfaces, so substantively non-blocking. Cosmetic counting error in a summary row.

2. **BFZ directory-tree empirical-evidence line count drift** — [BUTTERFREEZONE.md:127](../../../BUTTERFREEZONE.md#L127) annotates `empirical-evidence.md  # Sprint 4: literature evidence (1139 lines)`, but actual is **1141 lines**. Off-by-2 cosmetic drift. Same non-blocking-but-cosmetic category as Concern #1.

3. **G0.2 partial-vs-met framing** — sprint.md:527 acceptance text says *"Verify Intent + Operator-Model + Verdict + Artifact + Signal mapping. Expected: All 5 stream types declared"*, but [construct.yaml:105-111](../../../construct.yaml#L105) declares only 4 of 5: Signal + Operator-Model in `reads:`, Verdict + Artifact in `writes:`. **Intent is NOT declared.** The e2e-goal-validation report at line 38 transparently notes this asymmetry ("Intent is reserved (no current write/read; documented at construct.yaml:104 as Sprint 0 mapping rationale)") and marks G0.2 as `✓ Met`. Strictly-literal-AC reading would suggest `⚠ Partial`. However, Sprint 0 review/audit accepted the 4-of-5 mapping under the documented Sprint 0 mapping rationale; cycle-001 was operator-approved with this asymmetry, so revisiting it now would reopen Sprint 0 (forbidden by handoff §6 hard constraint #3). The honest framing in the e2e report (transparently disclosing the asymmetry rather than pretending Intent is declared) is acceptable for cycle-001 closeout. Future cycle could either declare Intent or amend the AC text to "≤5 stream types declared".

### Assumptions Challenged (1)

- **Assumption**: The `code_revision: cf489ee` field embedded in [run-3-final/summary.md:6](../../calibration/corona/run-3-final/summary.md#L6) and per-event certificates accurately tags the build state of the certificates.
- **Risk if wrong**: A future reader checks out `cf489ee` and finds `package.json` says `0.1.0` (the version bump was Task 7.4, after Run-3-final at Task 7.3). They may misread the certificates as having been generated with `0.1.0` active, when in fact they will land in a Sprint 7 commit where `package.json` is `0.2.0`. The `script_hash` invariant (`17f6380b...`) is derived from `scripts/corona-backtest/scoring/` content only, and `package.json` is not on that path, so the hash is unaffected. The numeric outputs are therefore truly invariant.
- **Recommendation**: NON-BLOCKING. Either (a) re-run Run-3-final after the version bump to refresh the `code_revision` to the eventual Sprint 7 commit, or (b) leave as-is since `code_revision` is informational and the load-bearing hashes are correct. Re-running would be wasteful churn (no numeric change). Current state is technically correct; the asymmetry is recoverable if anyone questions it.

### Alternatives Not Considered (1)

- **Alternative**: Sprint 7 could have authored a small `CHANGELOG.md` to mark the v0.1.0 → v0.2.0 transition with structured Added / Changed / Fixed / Security entries per SemVer convention.
- **Tradeoff**: Adds a new documentation file (no code impact) but provides a clearer release-history audit trail than relying solely on `git log` + per-sprint `reviewer.md` files. Operator stop condition forbids auto-tagging but does not forbid CHANGELOG creation.
- **Verdict**: NOT REQUIRED by sprint.md AC or handoff §5. sprint.md:495 explicitly says *"Update CHANGELOG.md if present (currently absent — Sprint 7 may create if scope-justified)"* — engineer's discretion to defer is acceptable. The reviewer.md adequately substitutes as cycle-001 release-trail. Could be a future-cycle polish task. **Current approach justified.**

---

## Documentation Verification

| Item | Status |
|------|--------|
| sprint.md Sprint 7 checkmarks | ✓ Updated (deliverables + AC + tasks all ✓) |
| reviewer.md AC Verification section | ✓ Present at line 22 with all GF.1-GF.4 + E2E + version bump as separate sub-headings |
| BFZ refreshed | ✓ Yes (193 → 362 lines; new sections for Calibration Status, Security Review, Known Limitations) |
| Sprint 6 LOW carry-forwards documented | ✓ BFZ:284-287 enumerates LOW-1 + LOW-A1/A2/A3 |
| Sprint 0 L2 publish-readiness gaps documented | ✓ BFZ:291-298 enumerates 4 carry-forwards |
| Future-cycle owner items honest | ✓ All limitations marked future-cycle in BFZ + reviewer.md |
| ground-truth-meta block updated | ✓ Sprint 7 close metadata (sprint:7, cycle:cycle-001, calibration_status, runs hash invariants) |

cycle-057 AC Verification gate (#475) satisfied.

---

## Karpathy Discipline Verification

| Principle | Verdict |
|-----------|---------|
| Think Before Coding | ✓ Engineer surfaced architectural-reality prediction before generating Run-3-final; verified bit-identical certificates before authoring honest-framing docs |
| Simplicity First | ✓ Single-line version edit; no harness modifications; no new tests; no speculative future-cycle work |
| Surgical Changes | ✓ Diff strictly within Sprint 7 scope; no drive-by improvements; no LOW-A1/A2/A3 polish smuggled in |
| Goal-Driven Execution | ✓ Each task has verifiable success criterion; each AC walked verbatim with file:line evidence |

---

## Operator-specified Round 2 trigger check

> *"If any final doc overclaims readiness or performance improvement, request a narrow Round 2 before audit."*

**No final doc overclaims.** All 4 target docs (BFZ, delta-report, e2e-goal-validation, reviewer.md) consistently frame v0.2.0 as **calibration-attempted, not calibration-improved**. The honest no-refit posture per operator hard constraint #14 is preserved verbatim across all docs.

The Concerns above (cosmetic Module Map drift + line-count drift + G0.2 partial-vs-met framing) are NOT overclaims of readiness or performance improvement. They are summary-table counting accuracy issues and a debatable AC-status interpretation. No Round 2 required.

---

## Next steps

1. **Operator action**: invoke `/audit-sprint sprint-7` to run the security audit gate.
2. **Audit focus areas** (per handoff §10): no secrets/API keys; no dependency mutations except version bump; no hidden runtime/scoring/corpus/manifest weakening; no unsafe filesystem/network changes; no stale-generated artifact contradicting current code; no false publish-readiness claim if L2 gaps remain; no Sprint 8 / cycle-002 work smuggled in.
3. **Post-audit operator action** (if APPROVED): commit Sprint 7 (do NOT auto-commit per stop condition).
4. **Post-commit operator action**: decide on v0.2.0 git tag + release announcement (separate gate; handoff §11).

If the engineer wishes to address the cosmetic Module Map and line-count drifts before audit, the change is narrow:

- Update [BUTTERFREEZONE.md:142](../../../BUTTERFREEZONE.md#L142) Module Map row count from `11` → `14`, breakdown from `(5 + 3 + 2 + 1)` → `(5 + 5 + 3 + 1)`
- Update [BUTTERFREEZONE.md:127](../../../BUTTERFREEZONE.md#L127) `(1139 lines)` → `(1141 lines)`

These two single-line edits are non-blocking and may be deferred; flagging them transparently here is sufficient for cycle-001 closeout-honesty per operator hard constraint #14 ("Do not silently weaken manifest provenance" — by analogy, do not silently retain summary-counting errors).

---

*Sprint 7 senior lead review approved. Ready for `/audit-sprint sprint-7`.*
