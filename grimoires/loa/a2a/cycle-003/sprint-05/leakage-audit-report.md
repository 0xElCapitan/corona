# CORONA cycle-003 — S05 Held-Out Leakage Audit

**Sprint**: S05 — Held-Out Split Sealing · **Branch**: `cycle-003-s05-heldout-split` · **Base**: `cycle-003` @ `f8d074f`
**Date**: 2026-05-31
**Scope**: structural leakage audit of the sealed train/held-out split (HO-3, HO-4; sprint-plan §S05.4). **Read-only over already-validated corpus + the assignment.** No `processX`, no trajectory, no scoring, no fit.
**Subject**: [`heldout-split.json`](../../../calibration/corona/corpus-cycle-003/heldout-split.json) (seal `f7a85136…a5ea`)

> A detected leak would be **HS-7** (halt). **Result: PASS — 0 leakage findings.**

---

## 1. What "leakage-free" means here

The split must guarantee that a held-out event cannot be trivially predicted from, or share information with, a train event in a way that would make a future held-out evaluation circular. Three concrete invariants (HO-3, HO-4, FR-C7-2):

- **(L1) Whole-event partition** — each event (its settlement labels *and* its pre-cutoff series, inseparable) is on exactly one side; no event's series spans both sides.
- **(L2) No sequence straddle** — no solar-rotation / storm sequence has members on both sides.
- **(L3) Settlement never on the feature side, pre-cutoff** — no settlement label leaks into any pre-cutoff series.

---

## 2. (L1) + (L3) — whole-event partition; settlement integrity

**(L1) Whole-event partition.** The assignment operates on **`event_id`** (whole events). An event's `xray_flux_observations[]` / `kp_observations[]` series and its settlement labels (`flare_class_observed` / `kp_*_observed`, etc.) are part of the same record and are therefore **inseparable** — they always travel together to the same side. No mechanism in S05 splits a single event's series across sides.

| Check | T1 | T2 |
|---|---|---|
| every event assigned to exactly one side (A1) | ✅ true | ✅ true |
| count conservation: train + held-out = n (A4) | ✅ 21 + 9 = 30 | ✅ 21 + 9 = 30 |
| no event's series spans both sides (A3) | ✅ true (whole-event) | ✅ true (whole-event) |
| no event appears on both sides | ✅ 0 | ✅ 0 |

**(L3) Settlement never leaks pre-cutoff.** This is a property of the *records*, established by the **S03 read-only substrate-conformance probe** (60 events, **0 violations**: every series entry strictly pre-cutoff, strictly time-ordered, no settlement key copied into any series). S05 **re-touches no series** — it neither edits, re-derives, nor re-runs the corpus series — so S03's result carries through unchanged. S05 ran **no** `processX`, produced **no** trajectory, computed **no** score. (L3) holds by S03 + non-modification.

---

## 3. (L2) — no sequence straddle (HO-4)

Sequence groups (per-theatre, ≤120 h `event_time` adjacency — see [methodology §3](heldout-split-methodology.md)) are **atomic**: each group is assigned whole to one side by construction. The audit independently re-checks that every group's members share one side.

| Check | T1 | T2 |
|---|---|---|
| sequence groups | 23 (17 singleton + 6 multi) | 29 (28 singleton + 1 multi) |
| groups whose members straddle sides (A2) | **0** | **0** |
| straddler group_ids | none | none |

**Multi-event groups (the straddle-risk set) — all confirmed single-sided:**

| Theatre | group | members | side |
|---|---|---|---|
| T1 | T1-2022-03-30-X1p4 | 2022-03-30-X1p4, 2022-03-31-M9p7 | train |
| T1 | T1-2022-04-20-X2p2 | 2022-04-20-X2p2, 2022-04-21-M9p7 | train |
| T1 | T1-2022-08-26-M7p2 | 2022-08-26-M7p2, 2022-08-29-M8p7 | train |
| T1 | T1-2024-10-01-X7p1 | 2024-10-01-X7p1, 2024-10-03-X8p9 | **held-out** |
| T1 | T1-2025-11-11-X5p2 | 2025-11-11-X5p2, 2025-11-14-X4p0 | train |
| T1 | T1-2026-02-01-X8p1 | 2026-02-01-X8p1, 2026-02-03-M7p2, 2026-02-04-X4p2 | train |
| T2 | T2-2026-03-21-Kp7 | 2026-03-21-Kp7, 2026-03-22-Kp7 | **held-out** |

### 3.1 Cross-theatre sequences (the Gannon example)

HO-4 names the May-2024 Gannon sequence, which appears across theatres (T1 flare 2024-05-14; T2 storm 2024-05-11). The split is computed — and, in a future cycle, would be evaluated — **per theatre**. A T1-train event cannot leak into T2 held-out scoring, and vice-versa, so cross-theatre co-assignment is **not a leakage path** under per-theatre evaluation. Reported for transparency: **Gannon T1 and Gannon T2 both landed on `train`** (each is a singleton within its own theatre). No action required; documented so the reviewer can confirm the reasoning.

### 3.2 Documented residual (no explicit AR/sequence id)

Records carry no NOAA active-region / storm-sequence identifier, so grouping uses temporal adjacency (§3, methodology). A same-active-region pair separated by more than the threshold would be treated as two groups — the clearest candidate is the **2021-12-20 / 2021-12-28 M1.9 pair (7.69 days / 184.6 h apart)**, which the 120 h cut separates. Both are **M1-M4**, so even if they were the same region, the leakage impact is nil (same bucket) and the split's stratification is unaffected. The *invariant* (no straddle of any sequence the rule **recognizes**) holds for all 23 + 29 groups; refining grouping with AR-tagged records is future work.

---

## 4. Verdict

| Invariant | Result |
|---|---|
| (L1) whole-event partition; no series spans both sides | ✅ PASS |
| (L2) no sequence-group straddle (HO-4) | ✅ PASS — 0 straddlers (T1 + T2) |
| (L3) settlement never leaks pre-cutoff (HO-3) | ✅ PASS — via S03 conformance probe (0 violations) + S05 non-modification |
| **Overall** | ✅ **PASS — 0 leakage findings; HS-7 not triggered** |

The audit is **read-only and report-only**: it reads the committed records + the assignment and asserts structural properties. It does not call runtime process functions, produce trajectories, or score (CSG-3). No fit/refit/evaluation occurred. The audit booleans are also embedded in `heldout-split.json` → `leakage_audit` for machine verification.
