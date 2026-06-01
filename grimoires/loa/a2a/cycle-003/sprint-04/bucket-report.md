# CORONA cycle-003 — Sprint S04 T4 Bucket Diversity Report

**Sprint**: S04 — T4 Expansion + Bucket Report
**Type**: data-substrate / supply-characterization report (no corpus construction, no scoring, no refit)
**Branch**: `cycle-003-s04-t4-expansion` · **Base**: `cycle-003` @ `2fd40ed` (S03)
**Date / retrieval**: 2026-05-30
**Outcome (one line)**: GOES-R-era S1+ proton-event **supply re-verified = 46** (authoritative, defensively parsed). The CORONA T4 **cascade-count bucket distribution `[0-1, 2-3, 4-6, 7-10, 11+]` is BLOCKED** for S04 (see §4). The S-scale magnitude distribution below is **supply characterization only — it is NOT the cascade bucket distribution.**

---

## 0. Cycle / sprint posture (carried forward, unweakened)

Cycle-003 is a corpus-shape / data-substrate cycle. It earns **no new rung** and advances **no theatre's rung**. Cycle-002's ceiling is preserved verbatim: CORONA demonstrated **T4 runtime sensitivity only** (Rung 2, T4). This report makes **no** calibration-improvement claim, **no** forecasting-accuracy claim, **no** predictive-uplift claim, **no** T1/T2 runtime-sensitivity claim, **no** L2 publish-readiness claim, and **no** Baseline-A/B/new-corpus comparison. It does not score, run a backtest, or refit any parameter.

---

## 1. Source re-verification (S04-T1)

| Field | Value |
|---|---|
| Source | NOAA NCEI — "Solar Proton Events Affecting the Earth Environment (1976 to date)" |
| URL | `https://www.ngdc.noaa.gov/stp/space-weather/interplanetary-data/solar-proton-events/SEP%20page%20code.html` |
| HTTP status | 200 |
| `Last-Modified` | Wed, 21 Jan 2026 21:51 GMT |
| Last (most-recent) data row | 2026-01-18 2255 UTC begin (37,000 pfu, S4; assoc. flare X1.9) |
| Retrieval date | 2026-05-30 |
| Stale umbra/SDAC mirror | NOT used (confirmed stale, ends 2017-09; superseded per S01) |
| Table structure | **10 columns × 319 data rows** (3190 `<td>` cells = 319 × 10 exactly): [0] Begin Time (Yr Mo/Da HHMM) · [1] Maximum Time · **[2] >10 MeV Maximum (pfu)** · [3] Sunspot Region · [4] Location · **[5] Importance: X-Ray/Optical** (associated flare class + flare date/time) · [6]–[7] CME / halo flags · [8] note · [9] "Flux Plot" link. |
| Parse method | `</tr>`-**independent**: extract every `<td>…</td>` inner text in document order, then chunk into fixed rows of 10 (begin = col [0], pfu = col [2], associated flare = col [5]). The markup defect S01 flagged (the `2024-01-29` row missing its `</tr>`) does **not** affect `<td>`-stream chunking — `<td>` boundaries are intact regardless of `<tr>`/`</tr>`. `3190 % 10 == 0`, 319 rows parse, and the first/last rows align (begin at offset 0, pfu at offset 2, link at offset 9), confirming uniform 10-cell rows. |
| Inclusion filter | year ≥ 2017 (GOES-R era, FR-C6-6 / T4X-4) **AND** `>10 MeV Maximum (pfu) ≥ 10` (the S1 floor) |
| **GOES-R-era S1+ count** | **46** (unchanged from S01) |
| Cross-checks | (a) defensive raw-HTML chunk-by-10 parse = 46; (b) an independent WebFetch summary of the same page = 46; (c) S01's recorded count = 46. All three agree, and the S-scale tally + per-year breakdown match S01 exactly. |

**Currency note.** The source's `Last-Modified` (2026-01-21) and last row (2026-01-18) are **identical to S01's** — the list has **not** changed between the S01 retrieval (2026-05-28) and this 2026-05-30 re-pull. The 46 figure is "as published through 2026-01-18"; any S1+ events after 2026-01-18 are not yet listed (additive if/when published).

**`2024-02-09` inclusion (S01 carryforward).** The `2024 02/09 1530, 187 pfu, S2` row **IS present and counted** (row 26 below; associated flare X3.3 @ 02/09 1314). The `</tr>`-independent chunk-by-10 parse recovers both `2024-01-29` (137 pfu, S2) and `2024-02-09` (187 pfu, S2) as distinct rows.

**Refinement of an S01 note.** S01 recorded that the list "carries pfu + S-scale but NOT linked flare/CME trigger timestamps." This S04 re-pull additionally parsed column [5] (Importance: X-Ray/Optical), which **does** carry an associated **flare class** for **40 of 46** events and an associated **flare time** for **39 of 46** (6 have no listed flare — likely filament/CME-driven). This refines S01: an associated-flare *class/time* is present (characterization only — see the caveat in §2); what remains absent is (i) a `>=10 MeV` integral-proton flux **time-series** and (ii) the non-proton-producing M5+ flare population — see §4.

---

## 2. The 46 GOES-R-era S1+ proton events (authoritative supply)

Each row: proton-event begin date + start UT; `>10 MeV Maximum (pfu)`; derived S-scale magnitude (S1 ≥10, S2 ≥100, S3 ≥1000, S4 ≥10⁴, S5 ≥10⁵ pfu); and the associated X-ray flare class + flare date/time from column [5] (`–` = none listed).

> **Caveat on the flare columns:** the "Assoc. flare" / "Flare time" values are the NOAA list's column-[5] entry for each proton-event row, transcribed **as-listed**, for **characterization only**. Some entries reference an earlier or same-region flare (e.g., rows 5–6 both cite the 10/28 flare; rows 8 & 10 both cite an 03/28 flare). These are **not** used as trigger times for any cascade join (which is BLOCKED — §4). The load-bearing columns (date, pfu, S-scale) are triple-verified (§1).

| # | Date | Start UT | >10 MeV max (pfu) | S-scale | Assoc. flare | Flare time |
|--:|------|---------|------------------:|:-------:|:-----------:|:----------:|
| 1 | 2017-07-14 | 0900 | 22 | S1 | M2 | 07/14 0209 |
| 2 | 2017-09-05 | 0040 | 844 | S2 | M5 | 09/04 2033 |
| 3 | 2017-09-10 | 1645 | 1494 | S3 | X8 | 09/10 1606 |
| 4 | 2021-05-29 | 0300 | 15 | S1 | C9 | 05/28 2313 |
| 5 | 2021-10-28 | 1635 | 29 | S1 | X1 | 10/28 1535 |
| 6 | 2021-10-30 | 2100 | 11 | S1 | X1 | 10/28 1535 |
| 7 | 2022-01-20 | 0800 | 22 | S1 | M5 | 01/20 0601 |
| 8 | 2022-03-28 | 1325 | 19 | S1 | M4 | 03/28 1129 |
| 9 | 2022-03-31 | 0620 | 11 | S1 | X1 | 03/30 1737 |
| 10 | 2022-04-02 | 1430 | 32 | S1 | M3 | 03/28 1129 |
| 11 | 2022-08-27 | 1155 | 27 | S1 | M1 | 08/27 1138 |
| 12 | 2023-02-25 | 2110 | 58 | S1 | M6 | 02/25 1944 |
| 13 | 2023-03-13 | 0735 | 22 | S1 | – | – |
| 14 | 2023-04-23 | 1815 | 26 | S1 | M1.7 | 04/21 1812 |
| 15 | 2023-05-08 | 1240 | 38 | S1 | M1.6 | 05/07 2323 |
| 16 | 2023-05-09 | 2335 | 83 | S1 | M4 | – |
| 17 | 2023-07-16 | 0635 | 18 | S1 | – | – |
| 18 | 2023-07-18 | 0115 | 620 | S2 | M5 | 07/18 0006 |
| 19 | 2023-07-29 | 0020 | 154 | S2 | M4 | 07/28 1558 |
| 20 | 2023-08-05 | 1115 | 18 | S1 | M1 | 08/05 0718 |
| 21 | 2023-08-08 | 0115 | 47 | S1 | X1 | 08/07 2046 |
| 22 | 2023-09-01 | 0430 | 25 | S1 | M1 | 09/01 0351 |
| 23 | 2023-12-15 | 2345 | 13 | S1 | – | – |
| 24 | 2024-01-03 | 2005 | 20 | S1 | X5 | 12/31 2203 |
| 25 | 2024-01-29 | 0615 | 137 | S2 | M6.7 | 01/29 0438 |
| 26 | 2024-02-09 | 1530 | 187 | S2 | X3.3 | 02/09 1314 |
| 27 | 2024-02-12 | 0805 | 118 | S2 | C9.6 | 02/12 0554 |
| 28 | 2024-03-23 | 0815 | 956 | S2 | X1.1 | 03/23 0133 |
| 29 | 2024-05-10 | 1335 | 208 | S2 | X3.9 | 05/10 0654 |
| 30 | 2024-05-11 | 0210 | 116 | S2 | X5.8 | 05/11 0123 |
| 31 | 2024-06-08 | 0255 | 1030 | S3 | M9.7 | 06/08 0149 |
| 32 | 2024-07-23 | 0300 | 24 | S1 | – | – |
| 33 | 2024-09-09 | 1640 | 34 | S1 | M1.0 | 09/09 0332 |
| 34 | 2024-09-17 | 0735 | 33 | S1 | X4.5 | 09/14 1529 |
| 35 | 2024-10-09 | 0505 | 1810 | S3 | X1.8 | 10/09 0156 |
| 36 | 2024-10-26 | 1910 | 364 | S2 | X1.8 | 10/26 0719 |
| 37 | 2024-11-21 | 1925 | 125 | S2 | – | – |
| 38 | 2025-01-04 | 2235 | 20 | S1 | C7.6 | 01/04 1915 |
| 39 | 2025-02-25 | 0020 | 37 | S1 | M3.9 | 02/24 2302 |
| 40 | 2025-03-31 | 1105 | 147 | S2 | X1.9 | 03/28 1521 |
| 41 | 2025-05-31 | 1710 | 666 | S2 | M8.1 | 05/31 0005 |
| 42 | 2025-08-25 | 1355 | 13 | S1 | – | – |
| 43 | 2025-11-10 | 1125 | 30 | S1 | X1.2 | 11/10 0919 |
| 44 | 2025-11-11 | 0945 | 1460 | S3 | X5.1 | 11/11 1004 |
| 45 | 2025-11-14 | 0920 | 16 | S1 | X4.0 | 11/14 0830 |
| 46 | 2026-01-18 | 2255 | 37000 | S4 | X1.9 | 01/18 1809 |

Per-year: 2017 = 3 · 2018–2020 = 0 (solar minimum) · 2021 = 3 · 2022 = 5 · 2023 = 12 · 2024 = 14 · 2025 = 8 · 2026 = 1. Sum = **46**.
Associated-flare coverage: flare class present for **40 / 46**; flare time present for **39 / 46**; associated flare is **M5+ (M5–M9 or X) for 25 / 46**.

---

## 3. S-scale MAGNITUDE distribution — *supply characterization only*

> **This is NOT the CORONA T4 cascade bucket distribution.** It is the magnitude (peak-pfu) spread of the 46-event supply, provided to characterize the available data. See §4 and §5.

| S-scale | pfu range | Count | Share |
|:-------:|-----------|------:|------:|
| S1 | 10 ≤ pfu < 100 | 28 | 60.9% |
| S2 | 100 ≤ pfu < 1,000 | 13 | 28.3% |
| S3 | 1,000 ≤ pfu < 10,000 | 4 | 8.7% |
| S4 | 10,000 ≤ pfu < 100,000 | 1 | 2.2% |
| S5 | pfu ≥ 100,000 | 0 | 0.0% |
| **Total** | | **46** | 100% |

The supply is heavily S1-skewed (~61%), with a thin high-magnitude tail (4×S3, 1×S4, 0×S5) — empirically consistent with the PRD §5 posture that the T4 S1+ supply is "constrained and bucket-skewed". This matches S01's S-magnitude tally exactly.

---

## 4. CORONA T4 cascade-count bucket distribution `[0-1, 2-3, 4-6, 7-10, 11+]` — **BLOCKED**

### 4.1 What the cascade buckets actually are

The CORONA T4 buckets `[0-1, 2-3, 4-6, 7-10, 11+]` are **72-hour post-M5+-trigger cascade-count** buckets (calibration-protocol §4.4.2; PRD §4.3; SDD §6; corpus README). A T4 **corpus event is an M5+ flare *trigger*** — verified against the frozen records `corpus/primary/T4-proton-cascade/*.json`, whose shape is:

```
trigger_flare_class, trigger_flare_peak_time, prediction_window_hours: 72,
proton_flux_observations[]  (>=10 MeV integral flux, pfu, TIME-SERIES of multiple samples),
proton_event_count_72h, cascade_bucket, settlement_count
```

The bucket label for a trigger is the **count of distinct S1+ proton events in the 72 h after that M5+ flare**, binned into `[0-1, 2-3, 4-6, 7-10, 11+]`. The 46 proton events of §2 are the **raw material for that count — they are not themselves the T4 corpus events.**

### 4.2 What the SEP list provides vs. what the frozen T4 shape requires

| Needed | In the NOAA SEP list? |
|---|---|
| Proton-event start times (the events to be counted) | ✅ yes — all 46 |
| Associated **flare class** per proton event (col [5]) | ✅ 40/46 (6 none) |
| Associated **flare date/time** per proton event (col [5]) | ✅ 39/46 (as-listed; some reference an earlier/region flare) |
| Associated flare is **M5+** | 25/46 |
| `>=10 MeV` integral-proton **flux time-series** for `proton_flux_observations[]` | ❌ **only the single per-event MAX pfu** (col [2]) — no series |
| The M5+ flares that produced **0** proton events (the bucket-0 majority) | ❌ the list contains only proton-**producing** events |

### 4.3 Why the cascade bucket distribution and the T4 records are BLOCKED for S04

**Two distinct blockers of different KINDS** — it is important not to conflate them, because they imply different operator decisions and different futures. Neither is resolvable by fabrication (the sprint forbids synthesizing/padding events):

1. **T4 record construction — blocker type: UNAUTHORIZED / UNDER-SPECIFIED in S04 (a scope stop, not impossibility) (S04-T2).** The frozen T4 shape requires `proton_flux_observations[]` — a multi-sample `>=10 MeV` integral-proton flux **series** over each 72 h window (e.g., the frozen `2017-09-10-S3` record carries 5 flux samples) — **plus** M5+ trigger-window construction. The SEP list provides only the single **maximum** pfu per event, so the series must come from the GOES `>=10 MeV` integral-proton archive (GOES SEISS / EPS). That source is **unverified, not shown unavailable**: **S01 verified the NOAA/NCEI/SWPC SEP event-list supply; S01 did NOT verify raw GOES `>=10 MeV` proton-flux time-series extraction** (S01 *did* verify NetCDF series when in scope — XRS for T1, Kp for T2 — the proton flux series was simply never in S01's scope). Because it is unverified, **S04 cannot cite S01 as authorization/evidence for T4 time-series construction**, and making the series load-bearing now would trip HS-9. Additionally, SDD DV-5 reserves any bounded GOES-archive fetch for **explicit sprint-plan authorization that S04 (SMALL) does not carry**, and fabricating/hand-authoring a series is forbidden (HAZ-2; S03 set the standard at *real* fetched series). → **No T4 records were constructed.** This is a deferrable scope/authorization stop (a future authorized fetch could lift it), **not** a permanent impossibility.

2. **Cascade-bucket distribution — blocker type: GENUINELY NOT DERIVABLE from the proton-events-only SEP list (a stronger, structural blocker) (S04-T3).** An honest `[0-1,2-3,4-6,7-10,11+]` cascade-count distribution requires the **full M5+ trigger population** — *all* GOES-R-era M5+ flares, most of which produce **zero** S1+ proton events (bucket `0-1` is dominated by these zero-producing windows). The SEP list **cannot supply that zero-producing majority at all**: it lists only proton-**producing** events. The only SEP-derivable population is the **25 proton-productive M5+ flares**, which is **selection-biased** — every such trigger has ≥1 proton event by construction, so the distribution has no true zeros and is not the cascade-prediction population. Presenting a histogram over that biased subset as "the cascade bucket distribution" would be **inventing a bucket spread** — exactly what the sprint forbids. **Crucially, this blocker is NOT lifted by the §1 proton-flux fetch:** a flux archive supplies the proton *series* for known events, but does not enumerate the M5+ flares that produced **zero** protons. Recovering the zero-producing denominator needs a **separate full M5+ flare catalogue** (DONKI FLR / NCEI XRS enumeration). → **No bucket distribution is asserted, estimated, or invented.**

**Determination:** the T4 cascade-count bucket distribution `[0-1, 2-3, 4-6, 7-10, 11+]` is **BLOCKED** for S04 (structurally, per blocker 2), and **zero** T4 corpus records were constructed (per blocker 1, a scope/authorization stop). This is an honest, sprint-anticipated outcome ("If exact trigger-window join is blocked or underpowered, HALT or mark BLOCKED honestly; do not invent a bucket spread"), **not** a defect. The operator chose **Option B** (T4 supply-characterized-only; both deferred to future gated work) — see [`blocker-decision-report.md`](blocker-decision-report.md) §5.

### 4.4 Temporal clustering of the supply (qualitative only — NOT a bucket histogram)

For context (and explicitly **not** a cascade-bucket distribution): the 46 proton events are mostly temporally isolated. A few fall within 72 h of each other — e.g., 2017-09-05 ↔ 2017-09-10; 2021-10-28 ↔ 2021-10-30; 2024-05-10 ↔ 2024-05-11; 2024-02-09 ↔ 2024-02-12 — reflecting active-region episodes. Even a count of proton events per *proton-productive* M5+ flare would be the **selection-biased** quantity of §4.3(2), so **no per-bucket count is reported**. The full, unbiased cascade-count distribution remains BLOCKED.

---

## 5. Required honest statement (binding)

**The S-scale magnitude distribution in §3 is the magnitude spread of the proton-event *supply*. It is NOT the CORONA T4 cascade-count bucket distribution.** The CORONA buckets `[0-1, 2-3, 4-6, 7-10, 11+]` count S1+ proton events per 72 h post-M5+-trigger window; they are a distinct quantity from the S1/S2/S3/S4/S5 magnitude bins. The S1/S2/S3/S4/S5 distribution must never be substituted for or presented as the cascade bucket distribution.

---

## 6. Reproducibility

- Raw HTML and the parsed 46-row supply were written to the OS temp directory **outside the repository** (ephemeral; not committed). No fetch tooling, cache, or dependency was added to `src/` / `scripts/` / `tests/`.
- The parse is deterministic given the source bytes: extract all `<td>` inner texts → chunk into rows of 10 → per row, begin = col [0], pfu = col [2] (commas stripped), associated flare = col [5] → filter `year ≥ 2017 ∧ pfu ≥ 10` → classify S-scale by pfu thresholds. `3190 <td> = 319 × 10`; 46 rows pass the filter.
