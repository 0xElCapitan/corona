# CORONA cycle-003 — Sprint S05 Implementation Report

**Sprint**: S05 — Held-Out Split Sealing
**Type**: data-substrate (split methodology + sealed assignment); **no fit, no evaluation, no scoring, no runtime/replay, no code edit, no new rung**
**Branch**: `cycle-003-s05-heldout-split` · **Base**: `cycle-003` @ `f8d074f` (S04) · `main` untouched at `eaaf5e4`
**Date**: 2026-05-31
**Outcome (one line)**: A deterministic, leakage-free, stratified train/held-out split methodology (`stratified_random_seqgrouped`, 0.7/0.3, seeded) was **declared, computed over the available corpus (30 T1 + 30 T2; T4 = 0), audited (0 straddles), and sealed** into the cycle-003 manifest **before any fit**. T4 held-out is **absent / underpowered** (S04 BLOCKED-PARTIAL). No fit, evaluation, scoring, or rung advance occurred.

> **Nothing in this report is a calibration-improvement claim, an empirical-performance-improvement claim, a forecasting-accuracy claim, a predictive-uplift claim, a verifiable-track-record claim, a T1/T2 runtime-sensitivity claim, an L2-readiness claim, or any Baseline-A/B/new-corpus comparison. No code, runtime/replay, scoring, refit, commit, or push was performed. Cycle-002's ceiling — "CORONA demonstrated T4 runtime sensitivity only," v0.2.0 — is preserved unweakened.**

**Primary artifacts**: [`heldout-split.json`](../../../calibration/corona/corpus-cycle-003/heldout-split.json) (sealed assignment) · [`heldout-split-methodology.md`](heldout-split-methodology.md) (OQ-4 decision + method) · [`leakage-audit-report.md`](leakage-audit-report.md)

---

## 1. Executive summary

Sprint S05 seals the cycle-003 held-out evaluation **substrate**: a frozen, leakage-free train/held-out split methodology and the per-record assignment for the available corpus. It is the SC-4 / G-4 deliverable (PRD §7, SDD §7, sprint-plan S05).

What S05 produced:

1. **Method pinned (OQ-4 → `stratified_random_seqgrouped`)** — the sprint-plan default: stratified-random-with-sequence-grouping, ratio **train 0.7 / held-out 0.3**, a **deterministic seed** (`corona-cycle-003-heldout-v1`), with the "random" realized as a fully-reproducible **SHA-256 keyed ordering** (no `Math.random`, no `Date`-derived entropy).
2. **Assignment computed** over the available corpus: **T1 21 train / 9 held-out**, **T2 21 train / 9 held-out**. Per-bucket held-out coverage hit every stratification target exactly (T1 M1-M4 2, M5-M9 2, X1-X4 3, X5-X9 2; T2 G2 2, G3 4, G4 3, G5 0).
3. **Sequence grouping** prevents leakage: events within the same multi-day solar-active-region / storm episode are chained into atomic groups assigned **whole** to one side — no sequence straddles the split.
4. **T4 honestly marked absent / underpowered** — 0 records (S04 closed BLOCKED-PARTIAL under operator Option B). No fake T4 assignment; no padding; no pre-2017 admission.
5. **Leakage audit PASS** — 0 sequence-group straddles, 0 partition errors, 0 series spanning both sides (T1 + T2).
6. **Sealed** — `heldout-split.json` hashed (`sha256_canonical = f7a85136…a5ea`) and the seal pointer recorded in `corpus-cycle-003-manifest.json` **before any fit** (HO-1/HO-8). The seal **reproduces** from the committed file.

Per cycle posture, S05 earns no rung, advances no theatre rung, and performs no fit of any kind. The split exists; **nothing has been fit or evaluated against it**.

---

## 2. Acceptance-criteria verification (HO-1 … HO-9, SDD §7.1 / sprint-plan §S05)

| AC | Status | Evidence |
|---|---|---|
| **HO-1**: split protocol (rule, ratio, stratification, seed, seal) declared in `heldout-split.json` and hashed into the manifest **before** any fit; cycle-003 performs no fit. | ✅ Met | `heldout-split.json` carries all five; seal `f7a85136…a5ea` recorded in `manifest.heldout_split.seal` and `s05_summary`. `no_fit_against_heldout: true`, `no_fit_performed_in_cycle_003: true`. No fit ran (§8). |
| **HO-2**: methodology pre-records, as forbidden, any future cycle touching the held-out set for *fitting* (vs evaluation). | ✅ Met | `heldout-split.json` `no_fit_against_heldout: true` + `regime_note`; restated in [methodology §6](heldout-split-methodology.md). |
| **HO-3**: settlement never leaks pre-cutoff; settlement + series travel together on the same side; no event's series spans both sides. | ✅ Met | Assignment is **whole-event** (by `event_id`) → series + settlement are inseparable and land on one side; audit A3 PASS. Strict-pre-cutoff itself was established by the **S03** conformance probe (0 violations); S05 re-touches no series and runs no `processX`/score. [leakage-audit §2](leakage-audit-report.md). |
| **HO-4**: no solar-rotation / storm sequence straddles the split (e.g., May-2024 Gannon). | ✅ Met | Sequence groups (≤120 h adjacency) are atomic; audit A2 = 0 straddles, both theatres. Gannon T1 (2024-05-14) and T2 (2024-05-11) each land on **train**. [leakage-audit §3](leakage-audit-report.md). |
| **HO-5**: T1/T2 stratified so both sides carry comparable outcome-class coverage (`T1_BUCKETS` 6-class, `T2_BUCKETS` G-scale). | ✅ Met | Per-bucket held-out = round(0.30·n) hit **exactly** for every populated bucket; train carries the complement. Only deviation: T2 **G5 n=1** (singleton class → train; held-out G5 = 0 by necessity — documented, not padded). §3, [methodology §4](heldout-split-methodology.md). |
| **HO-6**: T4 underpowered → coarser granularity **or** mark underpowered; never pad, never admit pre-2017. | ✅ Met (marked underpowered/absent) | T4 = **0 records** (S04 BLOCKED-PARTIAL). `heldout-split.json` `assignment.T4` = empty + explicit ABSENT status; no S1-vs-S2+ split is even applicable with 0 records; no padding; no pre-2017. |
| **HO-7**: per-theatre minimum events-per-side stated; a theatre below minimum documented as a limit. | ✅ Met | `per_theatre_minimums`: T1 = 5, T2 = 5 (both sides clear it: 9 ≥ 5); T4 = "underpowered/absent (0 records)" — explicitly below any minimum. |
| **HO-8 / HO-9**: assignment committed + hashed (seal pointer in manifest); methodology pre-records that any future baseline on this split is a **new regime**, never an uplift delta vs Baseline A/B. | ✅ Met | Seal in `manifest.heldout_split.seal` (HO-8). `regime_note` in `heldout-split.json` + manifest note + [methodology §6](heldout-split-methodology.md) (HO-9 / CSG-2 / HAZ-3). |

---

## 3. Assignment result (computed, not asserted)

**Ratio achieved: exactly 70 / 30 per theatre** (T1 21/9, T2 21/9).

### T1 — flare-class (6-class buckets)

| Bucket | n (S03) | held-out target round(0.3·n) | held-out | train |
|---|---|---|---|---|
| M1-M4 | 8 | 2 | **2** | 6 |
| M5-M9 | 8 | 2 | **2** | 6 |
| X1-X4 | 9 | 3 | **3** | 6 |
| X5-X9 | 5 | 2 | **2** | 3 |
| <M | 0 | 0 | 0 | 0 |
| X10+ | 0 | 0 | 0 | 0 |
| **Total** | **30** | **9** | **9** | **21** |

### T2 — geomagnetic-storm (G-scale buckets)

| Bucket | n (S03) | held-out target round(0.3·n) | held-out | train |
|---|---|---|---|---|
| G2 | 8 | 2 | **2** | 6 |
| G3 | 12 | 4 | **4** | 8 |
| G4 | 9 | 3 | **3** | 6 |
| G5 | 1 | 0 | **0** | 1 |
| **Total** | **30** | **9** | **9** | **21** |

> **G5 caveat (HO-5 honesty):** G5 has exactly one event (2024-05-11, the May-2024 Gannon superstorm). A singleton outcome class cannot appear on both sides; it is assigned to **train**, so held-out G5 coverage is **0 by necessity**. This is the nearest honest split, documented — never padded to fake balance.

### T4 — proton-cascade

| | value |
|---|---|
| records | **0** (S04 BLOCKED-PARTIAL, Option B 2026-05-31) |
| held-out / train | 0 / 0 — **ABSENT / not split** |
| GOES-R-era S1+ supply | 46 (carry-forward; characterization only) |
| cascade-bucket distribution | **BLOCKED** (carry-forward) |

The S03 per-theatre bucket distributions (T1 M1-M4:8 / M5-M9:8 / X1-X4:9 / X5-X9:5; T2 G2:8 / G3:12 / G4:9 / G5:1) were **independently re-derived from the committed records** by the S05 compute step and matched exactly (a self-check; mismatch would have thrown).

---

## 4. Tasks (sprint-plan §S05.1–S05.5)

| Task | Description | Status |
|---|---|---|
| **S05.1** | Resolve OQ-4 — pin method/ratio/seed; document rationale vs alternatives. | ✅ Done — `stratified_random_seqgrouped`, 0.7/0.3, seed `corona-cycle-003-heldout-v1`; alternatives (pure temporal cut; by-solar-rotation) compared in [methodology §2](heldout-split-methodology.md). |
| **S05.2** | Compute + write the T1/T2 stratified assignment (HO-5); verify comparable coverage. | ✅ Done — per-bucket targets hit exactly (§3); assignment in `heldout-split.json`. |
| **S05.3** | Compute the T4 assignment honestly (HO-6/7) — mark underpowered; never pad. | ✅ Done — T4 = 0 records → marked ABSENT/underpowered; no padding, no pre-2017, no fake assignment. |
| **S05.4** | Leakage audit (HO-3/4) — no straddle; settlement stays with event; no series spans both sides. | ✅ Done — PASS, 0 findings ([leakage-audit-report.md](leakage-audit-report.md)). |
| **S05.5** | Freeze + seal — `no_fit_against_heldout` flag + `regime_note`; hash `heldout-split.json`; record seal in manifest. | ✅ Done — flags + regime note in `heldout-split.json`; seal `f7a85136…a5ea` in `manifest.heldout_split.seal` (HO-1/8/9). |

---

## 5. Files created / changed

**Created (4 files):**
```
grimoires/loa/calibration/corona/corpus-cycle-003/heldout-split.json          (sealed assignment + methodology, machine-readable)
grimoires/loa/a2a/cycle-003/sprint-05/implementation-report.md                (this file)
grimoires/loa/a2a/cycle-003/sprint-05/heldout-split-methodology.md            (OQ-4 decision log + method/grouping/stratification/seed)
grimoires/loa/a2a/cycle-003/sprint-05/leakage-audit-report.md                 (HO-3/HO-4 audit)
```

**Modified (1 file):**
```
grimoires/loa/calibration/corona/corpus-cycle-003/corpus-cycle-003-manifest.json
   — heldout_split block: status PENDING→SEALED; seal pointer (f7a85136…a5ea); split_version/method/ratio/seed/assigned counts (HO-8).
   — top-level status: "s03-partial …" → "s05-partial … held-out SEALED … final hash PENDING (S06)".
   — added additive s05_summary block (mirrors s03_summary).
   — PRESERVED: all 60 S03 T1/T2 entries[]; predecessor/frozen pointers; the S02/S04 T4 fields
     (per_theatre_targets.T4, corpus_layout.T4, cascade_buckets_note) left UNTOUCHED — their
     reconciliation remains S06's job per the S04 carry-forward. corpus_hash stays null.
```

**`git status --short`:**
```
 M grimoires/loa/calibration/corona/corpus-cycle-003/corpus-cycle-003-manifest.json
?? grimoires/loa/calibration/corona/corpus-cycle-003/heldout-split.json
?? grimoires/loa/a2a/cycle-003/sprint-05/
```

No tracked source/script/test file modified. The compute step used an **ephemeral Node script in the OS temp dir, outside the repo** (mirroring the S03 ephemeral-venv precedent): zero repo footprint, no `scripts/`/`src/`/`tests/` edit, no committed tooling. The assignment is reproducible from the committed artifacts + documented algorithm + seed (the seal was re-derived from the committed `heldout-split.json` and matched).

---

## 6. Validation before stopping (operator checklist)

| Item | Result |
|---|---|
| Active branch | `cycle-003-s05-heldout-split` |
| Base branch / commit | `cycle-003` @ `f8d074fa8686f4eab88afd55f6259b10916911f1` (S04); `main` untouched at `eaaf5e4` |
| Exact files created / changed | 4 created, 1 modified (§5) |
| `git status --short` | manifest `M`; `heldout-split.json` + `sprint-05/` untracked (only) |
| Eligible T1 records assigned | **30** (21 train + 9 held-out) |
| Eligible T2 records assigned | **30** (21 train + 9 held-out) |
| T4 records assigned | **0** — absent / supply-characterized-only / BLOCKED (S04) |
| Train/held-out overall | T1 21/9 · T2 21/9 · T4 0/0 |
| Train/held-out by T1 bucket | M1-M4 6/2 · M5-M9 6/2 · X1-X4 6/3 · X5-X9 3/2 (<M, X10+ = 0) |
| Train/held-out by T2 G-bucket | G2 6/2 · G3 8/4 · G4 6/3 · G5 1/0 |
| Deterministic seed | `corona-cycle-003-heldout-v1` (SHA-256 keyed group ordering; no `Math.random`/`Date`) |
| Grouping rule | per-theatre ≤120 h (5 d) event_time adjacency → atomic sequence groups assigned whole |
| Leakage audit | **PASS** — 0 sequence straddles, 0 partition errors, 0 series spanning both sides |
| No fit/refit/evaluation/scoring | ✅ none performed (§8) |
| Manifest / hash status | manifest updated (seal); top-level `corpus_hash` remains `null` / PENDING (S06) |
| Seal | `sha256_canonical f7a851362929a43c8165e0367952fdd7479e1dad8fbb2155ac3fb7e6d4c2a5ea`; reproduces from committed file |
| Forbidden-path audit | no change under `src/`, `scripts/`, `tests/`, loaders/replay, frozen `corpus/`, cycle-001/002 artifacts, root `prd/sdd/sprint.md`, `ledger.json`, README, BUTTERFREEZONE, `package.json` (§8) |
| Frozen corpus tree untouched | ✅ `git status` clean on `grimoires/loa/calibration/corona/corpus/` |
| Frozen invariants | ✅ all 5 (§7) |
| Claim-language grep gate | ✅ 0 matches (§7) |
| No code / runtime-replay / scoring / refit / T4 construction / commit / push / S06 | ✅ confirmed (none performed) |

---

## 7. Frozen-invariant check + claim-language grep gate

**Frozen invariants** (committed-blob sha256; Windows CRLF on disk → hash the committed blob, per S03/S04 carry-forward):

| Invariant | Expected | Result |
|---|---|---|
| `scripts/corona-backtest.js` blob sha256 | `17f6380b…1730f1` | ✅ MATCH |
| cycle-001 `calibration-manifest.json` blob sha256 | `e53a40d1…5db34a` | ✅ MATCH |
| cycle-001 `corpus_hash` (in frozen manifest) | `b1caef3f…11bb1` | ✅ present (not replaced/substituted) |
| `package.json` version | `0.2.0` | ✅ |
| RLMF cert version (`src/rlmf/certificates.js`) | `0.1.0` | ✅ |

**Claim-language grep gate** (PRD §8 / SDD §9 CSG-9 — the canonical four-phrase honest-framing pattern, run case-insensitively):

- Over the S05 artifacts (`sprint-05/*.md`, `heldout-split.json`) → **0 matches.**
- Over the S05-touched manifest → matches appear **only inside negation lists** — the pre-existing S02/S03-authored `prohibitions` / `does_not_prove` arrays (e.g., one S03 `does_not_prove` item). These are negations, consistent with CSG-9's "only negations or zero" standard; **S05 neither introduced nor altered them**, and S05's own additions use hyphenated negation forms so they do not trip the gate.

Non-claims throughout S05 are written with explicit hyphenated forms (e.g., *calibration-improvement*, *forecasting-accuracy*, *verifiable-track-record*) that do not trip the space-separated canonical pattern. The cycle-002 "T4 runtime sensitivity only" / v0.2.0 posture is restated, not weakened.

---

## 8. DO-NOT compliance

| Constraint | Result |
|---|---|
| No edit to `src/` / `scripts/` / `tests/` | ✅ |
| No edit to `corpus-loader.js` / `t1-replay.js` / `t2-replay.js` / `t4-replay.js` / runtime/replay code | ✅ (read-only copy of `canonical-json.js` algorithm in the ephemeral script; the repo file untouched) |
| No runtime process call; no trajectories | ✅ — compute step only reads JSON, computes groups/assignment/hashes, writes JSON |
| No scoring / Brier; no backtest as improvement evidence | ✅ |
| No fit / refit / tune / optimize / calibrate; no threshold / base-rate / `PRODUCTIVITY_PARAMS` / σ / formula change | ✅ — split assignment is not a fit (no parameters, no model, no objective minimized over outcomes) |
| No T4 records created; no backfill; no invented T4 bucket distribution | ✅ — T4 stays 0; marked ABSENT/underpowered |
| Frozen cycle-001 corpus tree (`…/corpus/`) not mutated | ✅ |
| cycle-001 / cycle-002 artifacts not mutated | ✅ |
| Root generic Loa docs (`prd.md`/`sdd.md`/`sprint.md`/`ledger.json`) not edited | ✅ |
| README / BUTTERFREEZONE / `package.json` version / tags / releases / `main` not modified | ✅ |
| No forbidden claim (calibration-improvement, empirical-performance-improvement, forecasting-accuracy, verifiable-track-record, L2, T1/T2-sensitivity, T1/T2-calibration-improvement, predictive/Baseline/new-corpus uplift) | ✅ |
| No commit / push | ✅ |
| No S06 started; S04 not reopened; no S04.5 | ✅ |

---

## 9. Known limitations / notes for review

- **No explicit sequence identifier in the records.** T1/T2 records carry no NOAA active-region or storm-sequence id field. S05 therefore groups by **temporal adjacency** (≤120 h event_time gap) as the available, reproducible proxy. This is documented in `heldout-split.json` `grouping_rule`. The inter-event gap distribution has a natural break (T1: ≤2.94-day clusters vs ≥7.69-day separations; T2: a 1.63-day pair vs ≥11.75-day), so the grouping is **invariant to any threshold in (2.94 d, 7.69 d) for T1 and (1.63 d, 11.75 d) for T2** (the chosen 5.0 d cut is interior to both measured bands) — the 120 h cut is not a fine-tuned knob. Residual risk: a same-active-region pair separated by more than the threshold (e.g., the 2021-12-20 / 2021-12-28 M1.9 pair, 7.69 days / 184.6 h apart) is treated as two groups; both are M1-M4, so the leakage impact is nil and the split's bucket balance is unaffected. A future cycle with AR-tagged records could refine grouping; the *invariant* (no straddle of any **recognized** sequence) holds for every group S05 formed.
- **Cross-theatre Gannon coherence is not a leakage path.** HO-4 cites the May-2024 Gannon sequence spanning theatres. The split is per-theatre and (in a future cycle) evaluated per-theatre, so a T1-train event cannot leak into T2 held-out scoring. Reported for transparency: Gannon T1 (2024-05-14) and T2 (2024-05-11) both landed on **train**.
- **T4 absence is the honest S04 outcome, carried forward.** S05 did not reopen S04, create an S04.5, fabricate T4 records, or invent a T4 bucket distribution. The manifest's detailed S02/S04 T4 fields are left for **S06** to reconcile (per the S04 COMPLETED carry-forward); S05 touched only the held-out seal, the top-level status line, and the additive s05_summary.
- **This is substrate, not skill.** A leakage-free held-out split is a Rung-1/2 *prerequisite*, not a held-out result. Cycle-003 computes **no** baseline on this split; any future baseline is a new regime (HO-9). S05 makes no calibration-improvement, forecasting-accuracy, predictive-uplift, T1/T2-runtime-sensitivity, or L2-readiness claim.

---

**STATUS: S05 implemented; ready for `/review-sprint sprint-S05`.** No commit, no push, no S06. No new rung; no theatre rung advance. Cycle-002's earned ceiling — "CORONA demonstrated T4 runtime sensitivity only," v0.2.0, "calibration-attempted, not improved" — is preserved unweakened. Cycle-003 remains a corpus-shape / data-substrate cycle.
