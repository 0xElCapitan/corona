# CORONA cycle-003 — Sprint S05 Security/Quality Audit (Paranoid Cypherpunk Auditor)

**Sprint**: S05 — Held-Out Split Sealing (post-implementation, post-review, post-Concern-1 fix)
**Branch**: `cycle-003-s05-heldout-split` @ `f8d074f` (S04 base) · `main` untouched @ `eaaf5e4`
**Audited**: 2026-06-01
**Posture**: adversarial; **every load-bearing output independently recomputed from the actual artifacts/git** (not trusted from the implementation or review reports). Auditor conflict-of-interest note: the implementer/reviewer/fixer and this auditor share one session; the mitigation is objective command-level recomputation (the seal either reproduces or it doesn't; the split either re-derives or it doesn't) plus the prior review's 7 independent agents having cross-checked the methodology on the pre-fix state.

## VERDICT: **APPROVED — PASS WITH NON-BLOCKING NOTES**

Zero blocking issues. Zero required fixes. Zero unsafe positive claims. The split is deterministic, independently reproducible, leakage-free, honestly stratified, correctly sealed (post-fix), substrate-only, and frozen-invariant-clean. Non-blocking notes are S06 carry-forwards only.

---

## Independent recomputation (the decisive evidence)

- **Split re-derived from scratch** (load 30 T1 + 30 T2 records → buckets → ≤120h sequence groups → `sha256(seed|theatre|group_id)` ordering → per-bucket-capped greedy) and compared event-id-for-event-id to committed `heldout-split.json`: **T1 train+heldout match `true`/`true`; T2 train+heldout match `true`/`true`.** 0 straddles (T1 23 groups, T2 29 groups). This *is* the determinism + reproducibility proof (HO-1) and it makes the deleted ephemeral compute script immaterial.
- **Seal recomputed** (RFC-8785-spirit canonical JSON → SHA-256) = `f7a851362929a43c8165e0367952fdd7479e1dad8fbb2155ac3fb7e6d4c2a5ea` = `manifest.heldout_split.seal.value` = `manifest.s05_summary.seal_sha256_canonical`. Split file embeds no self-seal.
- **Frozen invariants** verified via committed git blobs (Windows CRLF → blob, not on-disk).

---

## Required-check results

| # | Check | Result |
|---|---|---|
| 1 | Scope / branch / diff | ✅ branch `cycle-003-s05-heldout-split`; HEAD `f8d074f` (no commit above base; no remote tracking); `main` `eaaf5e4`. `git status` = exactly manifest `M` + `heldout-split.json` + `sprint-05/`. Forbidden paths (`src/`,`scripts/`,`tests/`, loaders/replay, frozen `corpus/`, cycle-001/002, `package.json`/README/BUTTERFREEZONE, root docs, `ledger.json`) — **all empty**. No push, no S06. |
| 2 | Eligible inventory | ✅ T1 = 30, T2 = 30, T4 = 0 (filesystem). T4 gets no assignment; `assignment.T4` = `[]`/`[]` + ABSENT status; no T4 record created; no held-out for nonexistent T4. |
| 3 | Methodology | ✅ `stratified_random_seqgrouped`; ratio `{0.7/0.3}`; seed `corona-cycle-003-heldout-v1`; deterministic SHA-256 keyed ordering; no `Math.random`, no wall-clock, no filesystem-order dependence (algorithm sorts by event_time/event_id then order_key). **Reproducible** (re-derived exactly). |
| 4 | Grouping / leakage | ✅ per-theatre ≤120h adjacency, atomic groups. **0 straddles, 0 partition errors, whole-event (no series spans both sides).** Series **untouched** — `git status` on `corpus-cycle-003/primary/` is empty, so settlement-pre-cutoff carries unbroken from the S03 probe; S05 ran no `processX`/score. Temporal proxy (no AR/sequence id) documented as a limitation. **Honest-framing fix verified — see below.** |
| 5 | Assignment counts | ✅ recomputed: T1 21/9, T2 21/9. Per-bucket exact — T1 M1-M4 6/2, M5-M9 6/2, X1-X4 6/3, X5-X9 3/2; T2 G2 6/2, G3 8/4, G4 6/3, **G5 1/0**. G5 singleton (2024-05-11 Gannon) → train; held-out G5 = 0 by necessity — honest, not padded/duplicated. |
| 6 | Seal / hash | ✅ recomputed `f7a85136…a5ea`; equals both manifest pointers; split file has no self-seal. Old `c8837ccd…` appears **only** in `engineer-feedback.md` (historical review record — explicitly acceptable). `corpus_hash` = `null`/PENDING; S06 named for final hash + T4-detail reconciliation. |
| 7 | Manifest audit | ✅ `git diff` changed keys = `status`, `heldout_split` (split_version/method/ratio/seed/seal/value/assigned/note), added `s05_summary`, and the approved `grouping_rule` wording. **No** change to `entries[]` (60 preserved), `predecessor_manifests`, `per_theatre_targets.T4`, `corpus_layout.T4` (still "empty skeleton"), or `cascade_buckets_note`. `corpus_hash` line unchanged (null). No final-completion claim. T4 stays absent/supply-only/BLOCKED. (+49/−4.) |
| 8 | No fit / eval | ✅ all `processX`/`Brier`/`scoring`/`backtest`/`trajectory`/`refit` tokens are negation/prohibition/reference context (e.g., "it does NOT call processX", "no fit/evaluation/scoring", HO-9 "new scoring regime", read-only `scripts/corona-backtest` canonical-json reference). No score/trajectory output artifact; no scratch script committed/untracked in repo. Assignment is a partition, not a fit (no parameter, model, or objective over outcomes). |
| 9 | Claim-language | ✅ **0 unsafe positive claims.** Canonical 4-phrase grep: 3 implementation `.md` + `heldout-split.json` = 0; manifest = 1 (**pre-existing S03 `does_not_prove` negation**, proven at line 843 of the committed `f8d074f` blob); `engineer-feedback.md` = 2 (**historical review-context mentions** of that S03 finding). All S05-authored negations hyphenated. |
| 10 | Frozen invariants | ✅ committed blobs: `corona-backtest.js 17f6380b…1730f1`; cycle-001 `calibration-manifest.json e53a40d1…5db34a`; cycle-001 `corpus_hash b1caef3f…11bb1` present (not substituted); `package.json 0.2.0`; RLMF cert `0.1.0`. |

### Honest-framing fix (Concern-1) — audit result: ✅ APPLIED CORRECTLY

| Item | Result |
|---|---|
| T1 measured band `(2.94 d, 7.69 d)` | ✅ present in 4 truth artifacts |
| T2 measured band `(1.63 d, 11.75 d)` | ✅ present in 4 truth artifacts |
| "interior to both [measured bands]" stated | ✅ present in 4 truth artifacts |
| pair corrected to `7.69 days / 184.6 h` | ✅ present (the "8 days apart" overstatement removed) |
| old `(3 d, 8 d)` / `(1 d, 12 d)` / "8-day" / "12-day" / "8 days apart" in truth artifacts | ✅ **none** (CLEAN) |
| assignment / seed / threshold / counts / T4 changed by the fix | ✅ **no** — re-derivation matches; only the footnote string + the consequent seal moved |
| seal recompute + propagation | ✅ `c8837ccd → f7a85136`, consistent across manifest ×2 + 3 reports |

---

## Files present under `sprint-05/`
```
auditor-sprint-feedback.md   (this file)
COMPLETED                    (created by this audit on PASS)
engineer-feedback.md         (review record; retains as-reviewed pre-fix seal c8837ccd — historical)
heldout-split-methodology.md
implementation-report.md
leakage-audit-report.md
```

## `git status --short`
```
 M grimoires/loa/calibration/corona/corpus-cycle-003/corpus-cycle-003-manifest.json
?? grimoires/loa/a2a/cycle-003/sprint-05/
?? grimoires/loa/calibration/corona/corpus-cycle-003/heldout-split.json
```

## Summary lines
- **Eligible record counts**: T1 30, T2 30, T4 0.
- **Train/held-out**: T1 21/9, T2 21/9, T4 0 assigned (absent).
- **Grouping/leakage**: PASS — 0 straddles, 0 partition errors, 0 series spanning both sides; series untouched.
- **Honest-framing fix**: PASS — measured bands present, overstatement gone, assignment unchanged.
- **Seal/hash**: PASS — recomputed `f7a85136…`, consistent + reproducible.
- **Manifest**: PASS — additive, scoped, S03/predecessor/T4 fields preserved, `corpus_hash` null.
- **T4 absent/blocked**: PASS — 0 records, ABSENT, S04 carry-forward intact, no fabrication.
- **No-fit/no-eval**: CONFIRMED — no fit/refit/score/Brier/replay/processX/trajectory/backtest.
- **Forbidden paths**: PASS — none touched.
- **Frozen invariants**: PASS — all 5 intact.
- **Claim-grep**: PASS — 0 unsafe positive claims.

## Blocking issues
**None.**

## Required fixes
**None.**

## Non-blocking concerns (S06 carry-forwards — none block S05 completion)
1. **S06 must reconcile manifest T4 detail fields** still carrying S02/S04 language — `per_theatre_targets.T4.cascade_buckets_note` ("S04 work — unblocked"), `corpus_layout.T4` / `populate_in` ("empty skeleton" / "S04") → BLOCKED/deferred per the S04 determination. Deliberately preserved by S05 per the S04 carry-forward; **not** an S05 defect.
2. **S06 computes the final top-level `corpus_hash`** over the complete tree (currently `null`/PENDING). Windows CRLF: hash the committed-blob/LF content (S03 note).
3. **`engineer-feedback.md`** (review record) retains the pre-fix seal `c8837ccd` and two meta-references to the S03 negation phrase. Both are historical/contextual (not unsafe claims). S06 may optionally hyphenate when it runs the closeout grep gate; out of S05's scope.
4. **Pre-existing S03 `s03_summary.does_not_prove`** bare negation phrase (manifest line 851) — predates S05; S06 may hyphenate during manifest reconciliation.

## Final recommendation
**READY for operator approval + commit.** S05 is a clean, honest, substrate-only sealing of a deterministic, reproducible, leakage-free train/held-out split over the available cycle-003 corpus; it earns no new rung and preserves cycle-002's ceiling ("CORONA demonstrated T4 runtime sensitivity only," v0.2.0) unweakened. No commit/push/tag/release/S06 performed by this audit.
