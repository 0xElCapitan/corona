# CORONA cycle-003 — Held-Out Split Methodology & OQ-4 Decision Log (S05)

**Sprint**: S05 — Held-Out Split Sealing · **Branch**: `cycle-003-s05-heldout-split` · **Base**: `cycle-003` @ `f8d074f`
**Date**: 2026-05-31
**Companion artifacts**: machine-readable [`heldout-split.json`](../../../calibration/corona/corpus-cycle-003/heldout-split.json) · [`implementation-report.md`](implementation-report.md) · [`leakage-audit-report.md`](leakage-audit-report.md)

> This document is methodology + a frozen decision record. It performs **no fit** and makes **no** calibration-improvement, empirical-performance-improvement, forecasting-accuracy, predictive-uplift, verifiable-track-record, T1/T2 runtime-sensitivity, or L2-readiness claim. It defines and freezes a *substrate*; it does not use it to fit or evaluate anything.

---

## 1. Purpose & scope

S05 declares and freezes a **leakage-free train/held-out split methodology** and the per-record assignment for the *available* cycle-003 corpus, **before any future fit** (PRD §7 FR-C7-1..6, SDD §7 HO-1..9, sprint-plan §S05). It is the substrate a *future, separately-gated* cycle would evaluate against. Cycle-003 itself runs no fit, no evaluation, no scoring.

Eligible / available records:
- **T1 (flare-class): 30 real records** — eligible.
- **T2 (geomag-storm): 30 real records** — eligible.
- **T4 (proton-cascade): 0 records** — **ineligible/absent** (S04 closed BLOCKED-PARTIAL under operator Option B, 2026-05-31). No fake T4 assignment is created; T4 absence does not block the T1/T2 split (the binding spec does not require all theatres — HO-5/HO-6 explicitly anticipate an underpowered/absent T4).

---

## 2. OQ-4 decision — split protocol

**Decision: `stratified_random_seqgrouped`, ratio train 0.7 / held-out 0.3, deterministic seed `corona-cycle-003-heldout-v1`.** This adopts the sprint-plan default (OQ-4; SDD §7 HO-4 illustrative shape) without change.

### 2.1 Alternatives considered

| Option | What it is | Why not chosen as the method |
|---|---|---|
| **Pure temporal cut** (train = earlier 70%, held-out = latest 30%) | Split by event date. | Solar activity is strongly **cycle-phased**: the latest 30% (late-2024 → 2026) is solar-maximum-heavy and X-class-rich, while the early window is M-dominated. A temporal cut would make held-out **non-representative** of the outcome-class mix (it would over-weight high buckets), defeating HO-5 stratification. Rejected as the primary method. *(Temporal leakage is still respected — see §3 — but via sequence grouping, not a global cut.)* |
| **By-solar-rotation** (assign whole ~27-day Carrington rotations) | Group by rotation number, assign rotations to sides. | Records carry no rotation/AR id; a 27-day bin would merge **physically distinct** active regions and storm drivers that merely share a rotation, **over-merging** and shrinking the effective sample to too few bins for a 30-event stratified split. The leakage concern it targets (near-duplicate same-episode events) is better captured by tighter temporal adjacency (§3). Rejected. |
| **Stratified-random-with-sequence-grouping** ✅ | Stratify on outcome class; group co-sequence (same-episode) events so none straddles; seeded deterministic assignment. | Matches HO-4/HO-5 directly: comparable per-bucket coverage on both sides **and** no near-duplicate sequence straddle. **Chosen.** |

### 2.2 Why "random" is realized deterministically

`Math.random()` and any `Date`-derived entropy are **forbidden** (they would make the assignment irreproducible, breaking HO-1/FR-C7-1). The "random" permutation is realized as a **seeded SHA-256 keyed ordering**:

```
order_key(group) = sha256( seed + "|" + theatre + "|" + group_id )   // lowercase hex
groups sorted ASCENDING by order_key
seed     = "corona-cycle-003-heldout-v1"
group_id = lexicographically-smallest member event_id (= earliest by ISO-date prefix)
```

This is unbiased (SHA-256 of distinct keys is effectively uniform), **fully reproducible** by anyone with the seed and the committed records, and uses only `node:crypto`. The seal (§5) was re-derived from the committed `heldout-split.json` and matched, confirming reproducibility.

---

## 3. Grouping rule (HO-4 — no sequence straddle)

**Rule.** Per theatre: sort the primary events by `(event_time, event_id)`; walk in order and **chain** consecutive events whose `event_time` gap is **≤ 120 h (5 days)** into one **atomic sequence group**. A group is assigned **whole** to one side — never split.

**Why temporal adjacency.** The records carry **no explicit NOAA active-region (T1) or storm-sequence (T2) identifier**. Temporal adjacency is therefore the available, reproducible proxy for "same flare-productive active-region disk passage" (T1) and "same CME / compound storm episode" (T2) — the physical situations in which a held-out event could be *near-duplicate-predictable* from a train event (the HO-4 concern). This limitation is documented rather than guessed silently.

**Why 120 h, and why it is not a fine-tuned knob.** The corpus's inter-event gaps fall into a natural bimodal pattern:
- **T1**: clusters with consecutive gaps **≤ 2.94 days (70.7 h)** vs the next-nearest separation **≥ 7.69 days (184.6 h)** — a clean empty band in (2.94 d, 7.69 d).
- **T2**: a single **1.63-day (39 h)** pair vs the next-nearest **≥ 11.75 days (282 h)** — an empty band in (1.63 d, 11.75 d).

The 120 h (5.0 d) cut sits inside both bands, so **the grouping is identical for any threshold in (2.94 d, 7.69 d) for T1 and (1.63 d, 11.75 d) for T2** (the chosen 5.0 d threshold is interior to both measured bands). The result does not depend on the precise value.

**Groups formed.**
- **T1 — 23 groups** (17 singletons + 6 multi-event):
  | group_id (earliest member) | members | dates | buckets | side |
  |---|---|---|---|---|
  | T1-2022-03-30-X1p4 | X1p4, M9p7 | 03-30, 03-31 | X1-X4, M5-M9 | train |
  | T1-2022-04-20-X2p2 | X2p2, M9p7 | 04-20, 04-21 | X1-X4, M5-M9 | train |
  | T1-2022-08-26-M7p2 | M7p2, M8p7 | 08-26, 08-29 | M5-M9 ×2 | train |
  | T1-2024-10-01-X7p1 | X7p1, X8p9 | 10-01, 10-03 | X5-X9 ×2 | **held-out** |
  | T1-2025-11-11-X5p2 | X5p2, X4p0 | 11-11, 11-14 | X5-X9, X1-X4 | train |
  | T1-2026-02-01-X8p1 | X8p1, M7p2, X4p2 | 02-01, 02-03, 02-04 | X5-X9, M5-M9, X1-X4 | train |
- **T2 — 29 groups** (28 singletons + 1 multi-event):
  | group_id | members | dates | buckets | side |
  |---|---|---|---|---|
  | T2-2026-03-21-Kp7 | Kp7, Kp7 | 03-21, 03-22 | G3 ×2 | **held-out** |

Every multi-event group lands entirely on one side → **0 straddles** (verified, [leakage-audit-report.md](leakage-audit-report.md)).

---

## 4. Stratification rule (HO-5)

**Targets.** Per theatre, per outcome bucket, the held-out target is `round(0.30 · n_bucket)` (round-half-up). Train carries the complement. Theatre-level representation is preserved (both T1 and T2 are split; only T4 is absent).

**Mechanism.** Greedily place sequence groups (in seed-hash order, §2.2) into held-out **while no bucket exceeds its target cap**; the remainder go to train. Whole-group placement means a mixed-bucket group consumes quota in several buckets at once; the cap prevents overshoot.

**Result — every populated bucket hit its target exactly:**

| Theatre | bucket: held-out / n (target) |
|---|---|
| T1 | M1-M4 **2**/8 (2) · M5-M9 **2**/8 (2) · X1-X4 **3**/9 (3) · X5-X9 **2**/5 (2) |
| T2 | G2 **2**/8 (2) · G3 **4**/12 (4) · G4 **3**/9 (3) · G5 **0**/1 (0) |

**The one honest deviation — T2 G5 (n = 1).** G5 has a single event (2024-05-11, the May-2024 Gannon superstorm). A singleton class **cannot** appear on both sides; it is assigned to **train**, so held-out G5 coverage is **0 by necessity**. This is the *nearest honest split* (sprint-plan §S05.4 / HO-5) — it is **not** padded, duplicated, or balanced by fabrication. A future cycle that needs held-out G5 coverage must obtain more G5 events (supply), not manufacture them.

This is **not a fit**: the targets are fixed *a priori* at 0.30·n, no parameter is tuned, no objective over outcomes is minimized, and the seed/algorithm were pinned **before** inspecting which specific events landed where.

---

## 5. Seed, seal, and reproducibility (HO-1 / HO-8)

- **Seed**: `corona-cycle-003-heldout-v1` (string, fed to SHA-256 keyed ordering).
- **Seal**: `sha256_canonical = f7a851362929a43c8165e0367952fdd7479e1dad8fbb2155ac3fb7e6d4c2a5ea` — SHA-256 over the RFC-8785-spirit canonical JSON of `heldout-split.json` (sorted keys, no whitespace; the repo `scripts/corona-backtest/replay/canonical-json.js` convention, referenced **read-only**). **EOL-immune** (re-serializes before hashing, so CRLF↔LF does not perturb it) — the same family as the manifest's `entries[].sha256_canonical`.
- **Seal location**: recorded in `corpus-cycle-003-manifest.json` → `heldout_split.seal` (and echoed in `s05_summary`), **not** inside `heldout-split.json` itself, to avoid a self-referential hash (HO-8).
- **Reproducibility check**: parsing the committed `heldout-split.json` → canonicalizing → SHA-256 reproduces `f7a85136…a5ea` exactly. The assignment regenerates from the committed T1/T2 records + the documented grouping + the seed.
- **declared_at**: `2026-05-31`, fixed (not machine-time-derived), so the artifact and seal are deterministic.

---

## 6. Pre-recorded prohibitions (HO-2 / HO-9 — frozen before any fit)

These are declared **now**, before any future cycle could fit against the split:

1. **No fitting against held-out (HO-2).** A future cycle touching the held-out set for *fitting* (as opposed to *evaluation*) is a methodology violation **by definition**. `heldout-split.json` carries `no_fit_against_heldout: true`.
2. **New regime, never an uplift delta (HO-9 / CSG-2 / HAZ-3).** Any future expanded-corpus baseline computed on this split is a **new scoring regime**. It MUST NOT be deltaed against Baseline A (cycle-001 uniform-prior, 6-bucket) or Baseline B (cycle-002 runtime-replay) as "uplift" — those are different regimes and the comparison is meaningless. Cycle-003 computes **no** baseline on this split.
3. **Cycle-003 performs no fit (HO-1).** `no_fit_performed_in_cycle_003: true`. The split exists; nothing has been fit or evaluated against it.

---

## 7. What this methodology proves / does not prove

**Proves:** a deterministic, documented, reproducible split methodology is selected and frozen; eligible available T1/T2 records carry train/held-out assignments; no sequence group straddles the split; no fit/evaluation/scoring occurred.

**Does NOT prove (deliberate non-achievements):** calibration-improvement; forecasting-accuracy; predictive uplift; T1/T2 runtime sensitivity; any new rung; L2 readiness; release readiness; Baseline-A/B uplift; new-corpus uplift.

Cycle-003 is a corpus-shape / data-substrate cycle. Cycle-002's ceiling — "CORONA demonstrated T4 runtime sensitivity only," v0.2.0, "calibration-attempted, not improved" — is preserved unweakened.
