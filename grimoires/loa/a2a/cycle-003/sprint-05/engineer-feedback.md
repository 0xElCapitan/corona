# CORONA cycle-003 — Sprint S05 Review (Senior Reviewer)

**Sprint**: S05 — Held-Out Split Sealing
**Branch**: `cycle-003-s05-heldout-split` @ `f8d074f` (S04 base) · `main` untouched @ `eaaf5e4`
**Reviewed**: 2026-06-01
**Method**: adversarial multi-agent **Workflow** (the local skill's multi-mode is not configured). 7 read-only `Explore` agents — 5 dimension auditors + 2 independent verifiers — each **re-derived findings from the actual files/git**, not from the implementation report (the implementer and reviewer share this session, so independent recomputation is the integrity control).

## Verdict: **ACCEPT — ready for `/audit-sprint sprint-S05`**

All 7 independent agents returned **PASS / CONFIRMS_ACCEPT with zero blocking issues and zero refutations.** The load-bearing facts were independently recomputed and matched exactly. Three **non-blocking** concerns are documented below (one honest-framing precision nit I recommend tightening; two mitigated audit-trail/precision notes). None affects the split's correctness, leakage-freeness, determinism, or seal.

> All good (with noted non-blocking concerns).

---

## Why this is approvable — independent verification (not trust)

The decisive evidence is that **multiple fresh agents reproduced the two forgeable quantities from scratch and matched**:

- **Full assignment re-derived ≥3×, EXACT match.** Three separate agents (inventory-auditor, blind re-deriver, adversary) re-loaded the 30 T1 + 30 T2 records, recomputed buckets, built the ≤120h sequence groups (T1: 23 groups; T2: 29 groups), recomputed `order_key = sha256(seed|theatre|group_id)`, ran the per-bucket-capped greedy, and got the **same 60 event-ids on the same sides** as the committed `heldout-split.json`. This is the HO-1 reproducibility proof — and it also closes the "ephemeral script was deleted" gap: the split is correct *because it re-derives*, independent of the discarded script.
- **Seal re-computed ≥4×, EXACT match** → `c8837ccde80df99f333b3381d3ee977c4e17945f9fc06963f16cb2d76ff00883`, equal in `manifest.heldout_split.seal.value` and `manifest.s05_summary.seal_sha256_canonical`; the split file does not embed its own seal (no self-reference). One agent verified using the repo's own `replay/canonical-json.js`.
- **T2 bucketing cross-checked against the runtime loader's `kpToGScaleIndex`** (not just a standalone threshold): G2=8, G3=12, G4=9, G5=1 — matches.

---

## Required-check results (against the review command)

| # | Check | Result |
|---|---|---|
| 1 | Scope / branch / diff | ✅ branch `cycle-003-s05-heldout-split`; HEAD `f8d074f` (no commit above base, no remote); `main` `eaaf5e4`. `git status` = exactly the 3 allowed paths. No `src/`/`scripts/`/`tests/`, no loader/replay, frozen `corpus/` untouched, no cycle-001/002 mutation, no README/BUTTERFREEZONE/package/tag/release. No push, no S06. |
| 2 | Eligible inventory | ✅ T1 = 30, T2 = 30, T4 = 0 (filesystem count). T4 receives **no** assignment; no T4 record created; `assignment.T4` empty + ABSENT status. |
| 3 | Split methodology | ✅ `stratified_random_seqgrouped`, 0.7/0.3, seed `corona-cycle-003-heldout-v1`. Deterministic SHA-256 keyed ordering; no unseeded randomness, no wall-clock entropy, no reliance on filesystem order; `declared_at` fixed. Reproducible (re-derived ≥3×). |
| 4 | Grouping / leakage | ✅ per-theatre ≤120h adjacency, atomic groups. **0 straddles** (6 T1 + 1 T2 multi-event groups all single-sided), 0 partition errors, whole-event assignment (no series spans both sides). Settlement-pre-cutoff correctly **attributed to S03** (0 violations), not re-claimed; S05 altered no series. Temporal proxy documented as a limitation (no AR/sequence id). *(Natural-gap wording — see Concern 1.)* |
| 5 | Assignment counts | ✅ T1 21/9, T2 21/9 (recomputed). Per-bucket exact: T1 M1-M4 6/2, M5-M9 6/2, X1-X4 6/3, X5-X9 3/2; T2 G2 6/2, G3 8/4, G4 6/3, **G5 1/0**. G5 singleton (2024-05-11 Gannon) → train, held-out 0 by necessity — honest, not padded/duplicated. |
| 6 | Seal / hash | ✅ recomputed `c8837ccd…0883`; consistent in both manifest pointers; split file has no self-seal. Top-level `corpus_hash` = `null`/PENDING; S06 named for final hash + T4-detail reconciliation. |
| 7 | Manifest audit | ✅ `git diff` limited to top-level `status`, the `heldout_split` block, and the added `s05_summary` (+49/−4). 60 S03 `entries[]` preserved; predecessor/frozen pointers preserved; `per_theatre_targets.T4`/`corpus_layout.T4`/`cascade_buckets_note` **untouched** (not flipped to resolved); no final-completion claim; T4 stays absent/supply-only/BLOCKED. |
| 8 | No fit / eval | ✅ zero grep hits for processX/Brier/score/trajectory/backtest/refit as actions. No fit/score/trajectory artifact produced. No ephemeral script committed (repo clean). `no_fit_against_heldout`/`no_fit_performed_in_cycle_003`/`frozen_before_any_fit` = true. |
| 9 | Claim-language | ✅ **0 unsafe positive claims.** Canonical 4-phrase grep over `sprint-05/*.md` + `heldout-split.json` = 0. The single manifest match (`forecasting accuracy`, line ~851) is a **pre-existing S03 `does_not_prove` negation** — proven present in the committed `f8d074f` blob; not introduced/altered by S05. All S05 negations hyphenated. |
| 10 | Frozen invariants | ✅ via committed blobs: `corona-backtest.js` `17f6380b…`; cycle-001 manifest `e53a40d1…`; cycle-001 `corpus_hash b1caef3f…` present (not substituted); `package.json` `0.2.0`; RLMF cert `0.1.0`. |

**Files created/changed** (review touched nothing except this file):
```
M  grimoires/loa/calibration/corona/corpus-cycle-003/corpus-cycle-003-manifest.json   (S05: status + heldout_split seal + s05_summary)
?? grimoires/loa/calibration/corona/corpus-cycle-003/heldout-split.json               (S05)
?? grimoires/loa/a2a/cycle-003/sprint-05/   (implementation-report.md, heldout-split-methodology.md, leakage-audit-report.md, this engineer-feedback.md)
```

---

## Adversarial Analysis

### Concerns Identified (non-blocking)

1. **[Honest-framing — recommend fix] Robustness-band wording is overstated.** `heldout-split.json` `grouping_rule.robustness_note`, `heldout-split-methodology.md` §3, `implementation-report.md` §9, and `manifest.s05_summary.grouping_rule` state the grouping is invariant "in (3 d, 8 d) for T1 and (1 d, 12 d) for T2." Recomputed gap distribution: **T1** cluster-max 70.67h (2.94d), next-nearest 184.63h (**7.69d**) → true band **(2.94d, 7.69d)**; **T2** the "1-day pair" is actually 39h (**1.63d**), next-nearest 282h (**11.75d**) → true band **(1.63d, 11.75d)**. The stated upper bounds (8d, 12d) fall *outside* the true bands, so the "invariant in (3,8)/(1,12)" claim is literally false over (7.69d, 8d] and (11.75d, 12d]. **The committed split is unaffected** — the chosen 120h/5.0d threshold sits safely inside both true bands (verified) — so this is a *descriptive precision* error in a rationale footnote, not a correctness error. Given the cycle's binding honest-framing covenant, recommend tightening to the measured bands (e.g., "robust for any threshold in (2.94d, 7.69d) for T1 and (1.63d, 11.75d) for T2; the 5.0d cut is interior to both"). *This is the one edit I'd ask for before audit; it is non-blocking but worth correcting rather than shipping an overstatement.*
2. **[Audit trail — mitigated] Ephemeral compute script not preserved.** By design it lived outside the repo and was deleted (no committed tooling, per the S03 precedent). This is unauditable in isolation — but its output is **independently reproduced** by ≥3 agents (exact assignment match) and the seal re-derives from the committed file, so correctness is established without it. No action required; noted for the audit trail.
3. **[Precision — immaterial] `round-half-up` stated only in the `.md`.** `heldout-split.json` `stratification_method` says `round(0.30 * n_bucket)` without naming the half-rule; the methodology doc names "round-half-up." Immaterial here — the only half-case is X5-X9 `round(1.5)=2`, which is 2 under both half-up and half-to-even — so the result is unambiguous. Optional tidy.

*(Plus, for S06's awareness: the manifest's pre-existing S03 `s03_summary.does_not_prove` carries a bare `forecasting accuracy` (negation-context). It predates S05 and is out of S05's scope; S06 may optionally hyphenate it when it reconciles the manifest.)*

### Assumption Challenged
- **Assumption**: temporal adjacency (≤120h) is a faithful proxy for "same active-region / storm sequence," i.e., no two same-sequence events are separated by >120h. **Risk if wrong**: a same-sequence pair separated by >120h would be grouped apart and could land on opposite sides — a latent straddle the rule cannot detect, since the records carry **no NOAA active-region / storm-sequence id**. **Status/Recommendation**: explicitly documented as a limitation (acceptable for this substrate sprint). The clearest separated candidate (2021-12-20 / 2021-12-28 M1.9, 7.69d apart) is both M1-M4 and both on train → nil impact. A future cycle with AR-tagged records should revisit grouping; the *invariant* "no straddle of any **recognized** group" holds for all 23+29 groups.

### Alternative Not Considered → actually was
- **Alternative**: pure temporal cut (latest 30% held-out) or by-solar-rotation (whole Carrington rotations). **Tradeoff**: a temporal cut makes held-out solar-max/X-class-heavy and non-representative (defeats stratification); rotation bins over-merge physically distinct regions sharing a rotation and shrink the sample. **Verdict**: current approach justified; both alternatives are documented and rejected with rationale in `heldout-split-methodology.md` §2.1. No change recommended.

---

## Decision

**ACCEPT — S05 is ready for `/audit-sprint sprint-S05`.** The split is deterministic, reproducible (independently re-derived 3×), leakage-free (0 straddles), honestly stratified (per-bucket targets exact; G5 singleton handled honestly), T4 honestly absent (S04 carry-forward preserved for S06), correctly sealed (seal re-derives), and free of unsafe positive claims; all frozen invariants intact; substrate-only posture preserved (no fit/eval/scoring/rung). The three concerns are non-blocking. **Recommended (non-blocking):** tighten the robustness-band wording (Concern 1) to the measured bands before closeout — either via a quick `/implement sprint-S05` touch (which cleanly recomputes the seal) or folded into S06; reviewer defers the choice to the operator. No commit, push, tag, release, or S06 performed by this review.
