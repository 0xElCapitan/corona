# Sprint S01 — Review (reviewing-code)

**Verdict: ALL GOOD (ACCEPT, with non-blocking concerns).**
**Reviewed:** 2026-05-29 · **Sprint:** cycle-003 S01 (Archive Verification / Sanity Samples) · **Branch:** `cycle-003-s01-archive-verification` @ base `eaaf5e4`
**Review type:** single-model adversarial review (no cross-model dissenter configured for a verification-only doc sprint).

S01 is a **verification-only** sprint; the review subjects are two markdown artifacts (`verification-ledger.md`, `implementation-report.md`). I re-ran every mechanical check independently and re-derived the T4 count from the live NOAA/NCEI source — I did not trust the implementation report.

## Requirement-by-requirement result

| # | Requirement | Result |
|---|---|---|
| 1 | Inspect actual artifacts, not just the report | ✅ Read ledger §0–§8 + report; re-ran all checks |
| 2 | Working-tree scope limited to `cycle-003/sprint-01/` | ✅ `git status` shows only that dir |
| 3 | No tracked/durable change under `src/`/`scripts/`/`tests/` | ✅ none (only gitignored `scripts/corona-backtest/cache/`) |
| 4 | No `corpus-cycle-003/` tree | ✅ absent |
| 5 | Frozen invariants intact | ✅ 5/5 (committed-blob check; see below) |
| 6 | T1/T2 framed as retrievability only, not runtime sensitivity | ✅ explicit disclaimer ledger:20; verdicts are archive-retrievability + label-existence |
| 7 | T4 source revision (NOAA/NCEI, count 46, 02/09 row, tallies) | ✅ independently re-derived — all exact |
| 8 | Cascade-bucket limitation preserved (72h post-trigger counts ≠ magnitude; S04 unblocked, not completed) | ✅ ledger §3 T4 + §5 + report §6 |
| 9 | Claim-language grep + classification | ✅ 0 unsafe positive claims (all negation/definition) |
| 10 | Blockers / edits / recommendation | ✅ none blocking; ACCEPT |

## Frozen invariants (committed-blob check)
- `scripts/corona-backtest.js` → `17f6380b…` ✅
- cycle-001 `calibration-manifest.json` → `e53a40d1…` ✅
- cycle-001 `corpus_hash b1caef3f…` present in committed manifest ✅
- `package.json` = `0.2.0` ✅ · RLMF cert (`certificates.js:100`) = `0.1.0` ✅

(The ledger's note that the Windows `core.autocrlf=true` checkout requires hashing the *committed blob* — not on-disk bytes — is correct and a valuable carry-forward for S02–S06.)

## T4 independent re-derivation (live NOAA/NCEI source, re-fetched 2026-05-29)
- Source = `www.ngdc.noaa.gov/.../solar-proton-events/SEP%20page%20code.html`, **Last-Modified 2026-01-21** (unchanged since implementation), **not** the stale umbra/SDAC mirror. ✅
- `<td>` cells = **3190 = 319 × 10**; two `</tr>`-independent methods (datetime-pair + chunk-by-10) **both = 46**. ✅
- `2024 02/09 1530 / 187 pfu (S2)` **present**. ✅
- Per-year: 2017:3 · 2018:0 · 2019:0 · 2020:0 · 2021:3 · 2022:5 · 2023:12 · 2024:14 · 2025:8 · 2026:1 = **46**. ✅ (exact match)
- S-scale magnitude: S1:28 · S2:13 · S3:4 · S4:1 · S5:0 = **46**. ✅ (exact match)

The 45→46 correction is documented honestly in both artifacts (cause: source `2024-01-29` row missing `</tr>` → original `<tr>`-delimited parse swallowed the next row).

## Claim-language grep (all matches classified)
Canonical CSG-9 + broader (calibration / uplift / sensitivity / forecasting / L2 / track-record):

| Location | Match | Classification |
|---|---|---|
| report:112 | reproduces the CSG-9 gate pattern string | **DEFINITION** (gate self-reference) |
| report:114 | meta-note that ledger writes non-claims hyphenated | **DEFINITION** |
| report:122 | classification-table row quoting "T4 runtime sensitivity only" | **DEFINITION** |
| report:123 / ledger:18 | "**NOT** … calibration improvement · **NOT** … runtime sensitivity · **NOT** L2 publish-ready …" | **NEGATION** |
| report:124 / ledger:172 | "**no** calibration-improved claim … **no** forecasting-accuracy claim …" | **NEGATION** |
| ledger:16 | "Cycle-002's ceiling is preserved verbatim: CORONA demonstrated **T4 runtime sensitivity only** (Rung 2)" | **DEFINITION** (mandated verbatim cycle-002 ceiling; scoped by "only"; explicitly disclaims T1/T2) |

**Zero unsafe positive claims.** The single "T4 runtime sensitivity only" phrasing is the prior-cycle ceiling preserved verbatim (required by the cycle posture), not a cycle-003 achievement claim.

## Adversarial Analysis

### Concerns Identified (non-blocking — all already disclosed in the artifacts; carry to S03/S04)
1. **T1 content-verification is N=1, not N=5** (ledger §3 T1:78). Only `2024-05-14` was fully fetched and confirmed to contain `xrsb_flux`; the other 4 windows are HTTP-200 file-presence (HEAD) only. Strong evidence (correct product name + ~300 KB size), and honestly labeled, but content-retrievability is strictly 1/5.
2. **T2 DONKI GST label-join is N=1** (ledger §3 T2:103). Only the 2022-02-03 GST was retrieved; the other GST windows hit the DONKI demo `429`. The join is established on one sample — disclosed, but thin.
3. **Pinned N=5 was not uniformly achieved for DONKI-dependent joins** (ledger §1, §6). The demo throttle (`429` after ~10–13 calls) capped DONKI retrievals, so the sanity sample leaned on the un-throttled NCEI/GFZ/NOAA-SEP sources. The "N=5/theatre" pin is the *intent*; achieved-N varies by source. Acceptable for a drift-detecting sanity sample, but the asymmetry should be explicit when S03 plans authenticated-key fetches.

### Assumption Challenged (minimum 1)
- **Assumption:** every row in the NOAA SEP list is S1+ (the list's ≥10 pfu @ ≥10 MeV inclusion floor = S1).
- **Risk if wrong:** a sub-10-pfu footnoted entry would inflate the count.
- **Disposition:** **mitigated** — the parse applies an explicit `pfu ≥ 10` filter and reported `0` sub-S1 / `0` unparsed rows in the ≥2017 subset, so the filter catches any violation. Low risk. Recommend S04 keep the explicit pfu filter (don't assume list membership ⇒ S1+).

### Alternative Not Considered (minimum 1)
- **Alternative:** cross-validate the 46 against **DONKI SEP** (the second PRD §5-named source) under an authenticated `NASA_API_KEY`, rather than relying on the single NOAA/NCEI list.
- **Tradeoff:** strengthens the count via two-source agreement, but DONKI SEP carries no peak-pfu (cannot corroborate S-levels) and needs a key.
- **Verdict:** current single-source is **justified for S01** — the NOAA/NCEI list is official + current and cross-validates against umbra for the 2017 overlap. The two-source check is an S04 robustness nicety, not an S01 blocker.

### Additional note for downstream (not a concern, an inheritance)
- The robust T4 parser (cell-stream / chunk-by-10, tolerant of the source's missing-`</tr>` defect) exists only as transient `node -e` in S01 (correctly — S01 may not add scripts). **S04 must re-implement a `</tr>`-independent parser** and re-pull at construction time (the 46 is "as published through 2026-01-18"; later-2026 events would be additive). This is captured in ledger §3 T4 / §5.

## Required fixes
**None.** No factual error, no posture violation, no missing disclosure. The non-blocking concerns above are recommendations for S03/S04, not edits to S01.

## AC verification note
This verification sprint has no standard `reviewer.md`/`## AC Verification` block; the **ledger §8 "Exit-criteria status" table** walks each S01 acceptance criterion verbatim with pass/deferred status and is the AC-verification equivalent. Accepted as such.

## Sprint-plan / ledger status
Deliberately **not** updating `CYCLE-003-SPRINT-PLAN.md` or `SPRINT-LEDGER.md` status here — that keeps the working tree scope-limited to `sprint-01/` (req 2) and defers the status flip to `/audit-sprint` (the COMPLETED-marker gate) under operator control.

## Readiness
**S01 is ready for `/audit-sprint sprint-S01`.** Verification-only posture upheld; no code/corpus/commit/S02; frozen invariants intact; honest framing clean.
