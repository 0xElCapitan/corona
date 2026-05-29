# CORONA cycle-003 — Sprint S01 Verification Ledger

**Artifact**: data-source verification ledger (PRD §5 / SDD §8 DV-1..DV-5 / sprint plan S01).
**Status**: S01 verification complete. T1, T2, and the T4 GOES-R-era S1+ **supply count (= 46)** verified; the T4 `[0-1…]` **cascade-count** bucket distribution is S04 work (unblocked, not computed in S01). (Revised 2026-05-28: the T4 supply, originally BLOCKED on the stale umbra mirror + DONKI throttle, was resolved by the operator-directed current NOAA/NCEI list; count corrected 45 → 46 after an operator-flagged omitted row — the `2024-02-09` S2 event dropped by a source missing-`</tr>` defect — see §3 T4 "count correction".)
**Sprint**: S01 — Archive Verification / Sanity Samples (verification-only; NOT corpus construction).
**Branch**: `cycle-003-s01-archive-verification`
**Base commit**: `eaaf5e4df848c4f11beb400ecff1719a7bf018a5` (`docs(corona): add cycle-003 planning substrate`)
**Worktree**: `C:\Users\0x007\corona\.claude\worktrees\sad-ramanujan-6292ff` (harness worktree)
**Retrieval date**: 2026-05-28 (fetches executed at UTC ~2026-05-29T05:30Z)
**Authorization exercised**: BOUNDED-FETCH (DV-5), S01-only. Per-event-window live fetches for T1/T2 sanity; bounded documented list/table/API retrieval for the T4 supply probe. No bulk download, no crawl, no scraping, no corpus construction.

---

## 0. Cycle posture (carried forward, unweakened)

Cycle-003 is a corpus-shape / data-substrate cycle. It earns **no new rung** and advances **no theatre's rung**. Cycle-002's ceiling is preserved verbatim: CORONA demonstrated **T4 runtime sensitivity only** (Rung 2, T4). This sprint is **verification, not construction**:

- NOT a refit cycle · NOT calibration improvement · NOT T1/T2 runtime sensitivity · NOT L2 publish-ready · NOT a release.
- SDD §2 Layer-A/B (replay + loader) change is OUT OF SCOPE (HS-2), deferred to a future gated cycle (OQ-9).
- Verifying that a pre-cutoff series is *retrievable* confirms **data-substrate availability only**. It is **not** a wired, sensitivity, or calibration claim. Per the answered OQ-2 (SDD §2.1): corpus shape alone does NOT unlock T1/T2 evidence updates — `t1-replay.js`/`t2-replay.js` never call `processX`, and `deriveEvidenceT1/T2` hardcode `pre_cutoff: []`. Those are HS-2 code layers, untouched here.

---

## 1. S01.1 — Sanity-sample N per theatre (OQ-7)

**Pinned: N = 5 per theatre.** OQ-7 default adopted; no re-pin warranted.

Rationale:
- Matches the OQ-7 / DV-2 default and the cycle-001 `donki-sanity.js` `SAMPLE_EVENTS` pattern (5 events) and the cycle-001 HITL-2 live-validation precedent.
- N=5 spans the GOES-R era (2017→2025) per theatre at one event-window per sample — sufficient to detect archive shape/access drift (the purpose of a sanity sample) without approaching the NG-7 bulk-fetch boundary.
- Honors `config.js` throttle ceilings: DONKI authenticated ≤900/hr, DONKI demo ≤35/hr. `NASA_API_KEY` is **UNSET** in this environment → DONKI demo-key fallback (`DEMO_KEY`) was used within the demo ceiling. The demo throttle was reached during sampling (see §6) — itself an empirical confirmation of the ceiling.

Ingestors reused (run, never modified):
- `scripts/corona-backtest/ingestors/donki-sanity.js --online`
- `scripts/corona-backtest/ingestors/donki-fetch.js` (`fetchEvent`)
- `scripts/corona-backtest/ingestors/gfz-fetch.js` (`fetchGfzKpYear`)
- `scripts/corona-backtest/ingestors/swpc-fetch.js` (`fetchKpRecent`)

All ingestor runs write only to the **gitignored** cache (`scripts/corona-backtest/cache/`, `.gitignore:27`); `git status --short` remained empty throughout (no tracked change to `src/`/`scripts/`/`tests/`).

---

## 2. Frozen-invariant verification (re-confirmed intact)

The canonical check is against the **committed git blob** (LF-normalized as stored), not the on-disk bytes. This worktree has `core.autocrlf=true` with no `.gitattributes`, so on-disk files carry CRLF and their *byte-level* sha256 differs from the cycle-001 hashes — a Windows checkout artifact, **not** content drift. `git status` is clean, and every committed blob matches:

| Invariant | Expected | Result |
|---|---|---|
| `scripts/corona-backtest.js` (committed blob sha256) | `17f6380b…1730f1` | ✅ MATCH |
| cycle-001 `calibration-manifest.json` (committed blob sha256) | `e53a40d1…5db34a` | ✅ MATCH |
| cycle-001 `corpus_hash` (in committed manifest) | `b1caef3f…11bb1` | ✅ present |
| `package.json` version | `0.2.0` | ✅ `0.2.0` |
| RLMF cert version (`src/rlmf/certificates.js:100`) | `0.1.0` | ✅ `0.1.0` |

> **Note for downstream sprints (S02–S06):** the frozen-invariant gate MUST hash committed blobs (`git show HEAD:<path> | sha256`) on Windows checkouts, or normalize EOL, otherwise the on-disk CRLF will produce false MISMATCH. This is an environment observation, not a frozen-artifact change.

---

## 3. Per-theatre verification

### T1 — Flare Class Gate (pre-cutoff GOES X-ray series + FLR label)

**Verdict: VERIFIED** (`REQUIRES_LIVE_ARCHIVE_VERIFICATION → verified`).

- **Series source — NCEI GOES-R XRS 1-min 1–8Å archive.** The historical 1-minute XRS product is retrievable from the documented NCEI/NGDC archive at
  `https://data.ngdc.noaa.gov/platforms/solar-space-observing-satellites/goes/goes{16,18}/l2/data/xrsf-l2-avg1m_science/YYYY/MM/sci_xrsf-l2-avg1m_g{16,18}_dYYYYMMDD_v2-2-1.nc`.
  (Confirms the PRD §5 note: live `services.swpc.noaa.gov/.../xrays-*-day.json` is *tail-only*; the existing `swpc-fetch.js:59-62` is tail-only and does **not** reach this archive — historical series lives in NCEI.)
- **N=5 sampled windows (file present, HTTP 200):**

  | Window | Satellite | Bytes | XRS 1-min file |
  |---|---|---|---|
  | 2017-09-06 | GOES-16 | 299477 | present |
  | 2021-10-28 | GOES-16 | 298322 | present |
  | 2023-12-14 | GOES-16 | 300523 | present |
  | 2024-05-14 | GOES-16 | 299313 | present |
  | 2025-06-15 | GOES-18 | 300605 | present (GOES-16 handed off East position by mid-2025 — provenance detail; GOES-18 carries the window) |

- **Content verified (2024-05-14, full file fetched):** valid netCDF-4 (HDF5 magic `89 48 44 46 0d 0a 1a 0a`) containing variables `xrsb_flux` (the **1–8 Å / 0.1–0.8 nm** "B" channel) and `xrsa_flux`, plus `time`, `quality`, `units`. The 1-min 1–8 Å flux is genuinely present, not merely the container.
- **Label join — DONKI FLR (via `donki-fetch.js`), all 5 windows:**

  | Window | FLR records in window | First record class | Instrument (DONKI) |
  |---|---|---|---|
  | 2017-09-06 | 10 | X2.2 | GOES15: SEM/XRS 1.0-8.0 |
  | 2021-10-28 | 4 | M1.4 | GOES-P: EXIS 1.0-8.0 |
  | 2023-12-14 | 5 | M5.8 | GOES-P: EXIS 1.0-8.0 |
  | 2024-05-14 | 11 | M2.5 | GOES-P: EXIS 1.0-8.0 |
  | 2025-06-15 | 11 | C7.6 | GOES-P: EXIS 1.0-8.0 |

  DONKI FLR records exist and carry a `class_type` for every sampled window → the X-ray series joins to a flare-class label. The `donki-sanity.js --online` run independently normalized FLR shapes (2017 X2.2, 2024) cleanly.
- **SWPC edited-solar-events label (secondary cross-label):** the SWPC `/text/` index is reachable (HTTP 200) but exposes only current-day products; the historical "edited solar events" table is not a single documented `/text/` product and is not wrapped by the tail-only `swpc-fetch.js`. The binding DV-3(a) obligation — "1-min flux retrievable **+ joins to the label**" — is satisfied by the **DONKI FLR** join. SWPC edited-events as an additional historical cross-label is **not pinned in S01** (deferred to S03 corpus construction if needed); it does not block T1.
- **Abundance posture (§5 "decision-unblocking answer"):** the XRS series is retrievable for arbitrary GOES-R-era windows and candidate flare events are abundant (10–11 DONKI FLR records per single-day 2024/2025 window). Consistent with the planning posture that T1 is **not supply-constrained**. The exact corpus event count is an S02/S03 construction figure and is **not** asserted here.

### T2 — Geomagnetic Storm Gate (pre-cutoff Kp series + GFZ lag + GST label)

**Verdict: VERIFIED** (`REQUIRES_LIVE_ARCHIVE_VERIFICATION → verified`).

- **Per-3hr Kp series — GFZ Potsdam definitive (via `gfz-fetch.js` `fetchGfzKpYear`).** Source: `https://kp.gfz-potsdam.de/app/files/Kp_ap_Ap_SN_F107_since_1932.txt` (documented GFZ product; 5,486,230 bytes; 34,482 daily rows).
  - **Coverage:** 1932-01-01 → 2026-05-28 (spans the full GOES-R era and beyond).
  - **Cadence:** **8 Kp values per day = per-3hr** ✅.
  - **Content verified** against the 2024-05-10/11 G5 ("Gannon") superstorm: per-3hr Kp 2024-05-10 `[2.667, 2.667, 2.333, 2, 3.667, 7.667, 8.667, 8.667]`; 2024-05-11 `[9, 8.333, 8.333, 9, 8.667, 8.333, 7.667, 7.667]` (peak Kp 9). Real definitive values, correctly shaped.
- **GFZ ~30-day publication lag (§3.6 / R5) — VERIFIED:** the most-recent **definitive** row is 2026-04-30; lag vs the 2026-05-28 retrieval date = **28 days** (~29 days vs the UTC fetch instant). Confirms the assumed ~30-day frontier and the calibration-protocol §3.6 rule that T2 primary events in the most-recent ~30 days are excluded from the regression tier until definitive Kp publishes.
- **SWPC provisional Kp (live tier, via `swpc-fetch.js` `fetchKpRecent`):** `https://services.swpc.noaa.gov/json/planetary_k_index_1m.json` retrievable (HTTP 200; 358 records; tail 2026-05-28T23:31Z → 2026-05-29T05:28Z, 1-minute estimated Kp). Live-tier availability confirmed; the per-3hr regression authority is GFZ definitive above.
- **Label join — DONKI GST (via `donki-sanity.js` + `donki-fetch.js`):** the 2022-02-03 Kp~8 (Starlink) GST normalized cleanly online (`donki_id 2022-02-03T06:00:00-GST-001`, `peak_kp` derived). DONKI GST shape/retrievability confirmed. Three additional GST windows (2017-09-07, 2023-04-23, 2024-05-10) were **not** retrieved because the DONKI demo key reached its rate limit (HTTP 429 — see §6); this is a throttle limit, **not** a retrievability failure. The GST join is established by the 2022 sample; broader per-window joins are an S03 task under an authenticated key.
- **Abundance posture:** GFZ Kp covers every 3-hour interval since 1932; G-scale storms in the GOES-R era are numerous (multiple per year). T2 is **not supply-constrained** for the pre-cutoff series. Exact corpus count is S02/S03.

### T4 — Proton Event Cascade (GOES-R-era S1+ supply) — **VERIFIED (source revised)**

**Verdict: VERIFIED (`REQUIRES_LIVE_ARCHIVE_VERIFICATION → verified`), source REVISED** from the stale umbra/SDAC mirror to the current NOAA/NCEI list (per operator source-discovery direction, 2026-05-28). The binding GOES-R-era (≥2017) S1+ proton-event **supply count = 46** (corrected 2026-05-28 from an earlier undercount of 45 — see "count correction" below), independently re-counted from the official current source. The `[0-1,2-3,4-6,7-10,11+]` **cascade-count** bucketing is **S04 work — unblocked by this source, not completed in S01** (see limitation below).

**Authoritative source (verified official + current):**
- **NOAA NCEI — "Solar Proton Events Affecting the Earth Environment (1976 to date)"**: `https://www.ngdc.noaa.gov/stp/space-weather/interplanetary-data/solar-proton-events/SEP%20page%20code.html`
- Provenance: hosted on `www.ngdc.noaa.gov` (NOAA NCEI / former NGDC); page text identifies it as "Solar Proton Events Affecting the Earth Environment". HTTP 200; **`Last-Modified: Wed, 21 Jan 2026`**; the table's last row is **2026-01-18** → the source is **current** (publication frontier ~2026-01-18). It is the NOAA/NCEI successor to the stale umbra mirror.
- Column schema confirmed: `[0] Begin Time (Yr M/D UTC) · [1] Maximum Time · [2] >10 MeV Maximum (pfu) · [3] Region · [4] Location · [5] Flare Maximum · …`. **Column [2] `>10 MeV Maximum (pfu)` is present and supports S-scale assignment** (S1≥10, S2≥100, S3≥1000, S4≥10⁴, S5≥10⁵ pfu). The list's inclusion threshold (≥10 pfu @ ≥10 MeV) is exactly the S1 floor, so **every listed event is S1+ by construction**.

**Independent re-count: GOES-R-era S1+ count = 46.**
- **Total data rows = 319** (confirmed two ways: `<td>` cell count = 3190 = exactly 319 × 10; and a `<tr>`-independent parse). Filtered to Begin-Time year ≥2017 ⇒ **46 rows**, all with pfu ≥10, confirmed by **two independent methods** that do not depend on `</tr>` delimiters: (A) datetime-pair row detection and (B) chunk-by-10-columns — both yield **46**.
- **Per-year:** 2017 = 3; 2018–2020 = **0** (Solar-Cycle-24/25 minimum — genuinely no S1+ events); 2021 = 3; 2022 = 5; 2023 = 12; **2024 = 14**; 2025 = 8; 2026 = 1 (through 01-18). Sum = **46**.
- **First / last:** 2017-07-14 (22 pfu, S1) → 2026-01-18 (37,000 pfu, S4).
- **S-scale magnitude distribution** (of the 46 — *magnitude* spread, NOT the cascade-count buckets): **S1 = 28, S2 = 13, S3 = 4, S4 = 1, S5 = 0.** Heavily S1-skewed (28/46 ≈ 61%), with only 4 S3, a single S4, and no S5 — empirically confirming the PRD §5 posture that the T4 S1+ supply is "constrained and bucket-skewed."
- **Cross-validation:** the 3 × 2017 events match the (independent, stale) umbra list exactly — 2017-07-14 = 22 pfu (S1), 2017-09-05 = 844 pfu (S2), 2017-09-10 = 1494 pfu (umbra 1490; both S3). Two independent NOAA-lineage sources agree on the 2017 overlap.

**⚠️ Count correction (45 → 46), 2026-05-28.** The earlier continuation reported **45**; that was an **undercount by one**. The current NOAA/NCEI table has a **source-markup defect**: the **`2024-01-29` row is missing its `</tr>`** closing tag (its cell list runs straight into the next row's `<tr>`). The original parser delimited rows by `<tr>…</tr>` (non-greedy), so the unterminated `2024-01-29` match **absorbed the cells of the following row** — **`2024 02/09 1530, 187 pfu, S2`** (X3.3 flare, region 13575) — and only its first/third cells were read, silently dropping the `02/09` event. The corrected parse reads the `<td>` cell-stream independently of `</tr>` (and cross-checks via td-count divisibility), recovering the `02/09` row. **The corrected count is 46**; the dropped event is the S2 `2024-02-09` row. The `2018–2020 = 0` years are genuine (solar minimum), not a parser gap. No other GOES-R-era row is affected (both methods agree at 46; td = 3190 = 319×10 exactly).

**⚠️ Load-bearing limitation preserved (do NOT overstate):** the count above is the **raw S1+ proton-event supply**. The CORONA T4 corpus is **not** a list of proton events — its events are **M5+ flare *triggers*** whose outcome is the **count of S-scale proton events within a 72-hour post-trigger window**, bucketed `[0-1, 2-3, 4-6, 7-10, 11+]` (calibration-protocol §4.4.0–4.4.2). Those are **cascade-count** buckets, **not** S-scale magnitude bins. Producing the `[0-1…]` distribution requires pairing each M5+ trigger to its 72h S-event count — a corpus-construction join that **S01 has NOT performed**. **S04 bucket work is unblocked (the supply + pfu/S-scale source now exist), not completed.** S01 verifies only the S1+ supply count and the pfu/S-scale source.

**Supply implication for S04/S05 (honest, not padded):** 46 raw S1+ events ≥2017 is the supply ceiling region; it is **not** padded toward 30 (HAZ-2) — it is the directly-counted figure and it happens to exceed 30, but the **magnitude diversity is thin** (1×S4, 0×S5, 4×S3). A held-out split stratified on high-S magnitude (or on the high cascade-count buckets) will likely be **underpowered** in the S3+/multi-event tail (feeds S05 HO-6 underpowered-and-documented; OQ-3). The S04 cascade-count bucketing must be computed before T4 held-out feasibility (S05) is final.

**Superseded source note:** the umbra/SDAC mirror `https://umbra.nascom.nasa.gov/SEP/seps.html` is **stale** (`Last-Modified 2018-02`, ends 2017, 3 GOES-R-era events). It must NOT be used as the cycle-003 T4 source; the current NOAA/NCEI list above supersedes it. (Earlier-attempted DONKI SEP via `DEMO_KEY` returned HTTP 429 `OVER_RATE_LIMIT`; not needed — the NOAA/NCEI list answered the question without a credential, so `NASA_API_KEY` was **not** used.)

---

## 4. Load-bearing figure table (verified / revised / BLOCKED)

| # | Figure (PRD §5 / §5 "decision-unblocking answer") | Status | Source + evidence | Retrieval date |
|---|---|---|---|---|
| F1 | T1 pre-cutoff series: NCEI GOES-R XRS 1-min 1–8 Å retrievable (2017+) | ✅ verified | NGDC `xrsf-l2-avg1m_science`; N=5 windows HTTP 200; `xrsb_flux` content-verified (2024-05-14) | 2026-05-28 |
| F2 | T1 label join: DONKI FLR (± SWPC edited events) | ✅ verified (DONKI FLR) | `donki-fetch.js` FLR records, all 5 windows carry `class_type`; SWPC edited-events not pinned (secondary) | 2026-05-28 |
| F3 | T1 live `xrays-*-day.json` is tail-only; history in NCEI | ✅ verified | `swpc-fetch.js:56-62` tail-only by design; NCEI archive confirmed (F1) | 2026-05-28 |
| F4 | T2 pre-cutoff series: per-3hr Kp retrievable | ✅ verified | GFZ `Kp_ap_…_since_1932.txt` via `gfz-fetch.js`; 8 Kp/day; 1932→2026; G5-storm content-checked | 2026-05-28 |
| F5 | T2 GFZ definitive ~30-day publication lag | ✅ verified | definitive frontier 2026-04-30 → 28-day lag | 2026-05-28 |
| F6 | T2 SWPC provisional Kp (live tier) retrievable | ✅ verified | `planetary_k_index_1m.json` via `swpc-fetch.js`, 358 recs | 2026-05-28 |
| F7 | T2 label join: DONKI GST | ✅ verified (1 sample) | `donki-sanity.js` 2022-02-03 GST normalized; further windows throttled (429) | 2026-05-28 |
| F8 | T1/T2 series "abundantly available, ≫30 events" (planning posture) | ✅ supported (series availability + event abundance) | XRS series for any window; 10–11 FLR/day in 2024/25; GFZ 3-hr since 1932 — count itself is S02/S03, not asserted | 2026-05-28 |
| F9 | **T4 GOES-R-era (≥2017) S1+ proton-event supply count** | ✅ **verified (= 46)**; source REVISED; count corrected 45→46 | NOAA NCEI "Solar Proton Events Affecting the Earth Environment" (`ngdc.noaa.gov/.../solar-proton-events/`, Last-Modified 2026-01-21, last event 2026-01-18); re-counted 46 rows ≥2017 (td=3190=319×10, two methods); S-mag S1:28/S2:13/S3:4/S4:1/S5:0; +1 vs earlier = `2024-02-09` S2 row dropped by source missing-`</tr>` defect; 2017 cross-validates umbra | 2026-05-28 |
| F10 | **T4 per-bucket `[0-1,2-3,4-6,7-10,11+]` cascade-count spread** | ◻︎ **S04-deferred (unblocked, not completed)** | buckets are 72h-post-M5+-trigger cascade counts (§4.4.2), NOT magnitude; require M5+-trigger↔S-event join = S04 corpus construction. Source now supports it; S01 does not compute it | 2026-05-28 |
| F11 | DONKI demo throttle ceiling (≤35/hr) is real/enforced | ✅ verified (empirical) | HTTP 429 `OVER_RATE_LIMIT` after ~10–13 demo calls | 2026-05-28 |

`REQUIRES_LIVE_ARCHIVE_VERIFICATION` transitions: F1–F9, F11 → **verified** (with source + retrieval date + sample/count evidence above). F10 → **S04-deferred** (cascade-count bucketing unblocked by the F9 source but not computed in S01; remains `REQUIRES_LIVE_ARCHIVE_VERIFICATION` only for the per-bucket distribution, not the supply count). Every flip cites a source + retrieval date + sample/count; none was flipped by assumption (DV-4 / HS-9 honored).

---

## 5. Halts / drift / operator decisions surfaced

- **HITL-T4-DRIFT (archive drift, surfaced then RESOLVED):** the SWPC SPE list *as first accessed* (umbra/SDAC mirror) is stale since 2018-02 and was surfaced for operator decision (cycle-001 HITL-2 pattern). **Resolution:** the operator directed use of the current NOAA/NCEI list ("Solar Proton Events Affecting the Earth Environment", `ngdc.noaa.gov`, Last-Modified 2026-01-21). That source was verified official + current and the GOES-R-era S1+ supply re-counted (= 46 after the 45→46 count correction, §3 T4). **No open operator decision remains for the supply count.** The stale umbra mirror is superseded for cycle-003.
- **Thin-magnitude caveat (HAZ-2):** the 46 S1+ events are heavily S1-skewed (S1:28 / S2:13 / S3:4 / S4:1 / S5:0). The count is the **directly-counted** figure (not padded toward 30); but high-S **magnitude diversity is thin** (1×S4, 0×S5), which will likely make any high-S / high-cascade-bucket held-out stratum **underpowered** (feeds S05 HO-6 underpowered-and-documented; OQ-3). Do not pad.
- **Cascade-bucket scope (not a halt, a boundary):** the `[0-1,2-3,4-6,7-10,11+]` per-bucket distribution is **72h-post-M5+-trigger cascade-count** work (§4.4.2), requiring an M5+-trigger↔S-event join. It is **S04 scope — unblocked by the F9 source, NOT computed in S01**. S01 deliberately does not compute or claim it.
- **Source-list publication frontier:** the NOAA/NCEI list's last row is 2026-01-18 (Last-Modified 2026-01-21); S1+ events between 2026-01-18 and the 2026-05-28 retrieval date may not yet be listed (additive if so). The 46 count is "as published through 2026-01-18".

---

## 6. Throttle posture (DV-1 / config.js ceilings)

- DONKI demo (`DEMO_KEY`) calls made: `donki-sanity.js --online` (5) + T1 FLR windows (5) → succeeded; then T2 GST windows (3) + DONKI SEP (1) → **HTTP 429 `OVER_RATE_LIMIT`**. Empirically confirms the `config.js` demo ceiling (≤35/hr, with NASA's shared-key budget effectively lower) and the `donki-fetch.js` throttle/429 handling.
- No NCEI / GFZ / SWPC-JSON throttling encountered (public, no-auth products).
- `NASA_API_KEY` was never present, never logged, never written, never committed. Demo-key fallback only.

---

## 7. Claim-safety self-check (PRD §8 / SDD §9 CSG-1..9)

This ledger asserts **only data-source retrievability/availability**. It makes:
- **no** calibration-improved claim (CSG-4); **no** forecasting-accuracy claim (CSG-5); **no** T1/T2 runtime-sensitivity claim (CSG-3); **no** Baseline A/B/new-corpus uplift comparison (CSG-2); **no** L2 publish-ready claim (CSG-6); **no** T3/T5 predictive-uplift claim (CSG-7); **no** release/tag/version action (CSG-8).
- "Wired-capable" is **not** claimed; OQ-2's answer (corpus shape ≠ T1/T2 evidence updates; HS-2 Layer-A/B deferred) is restated, not weakened.
- Any occurrence of a grep-gate phrase in this document appears **only** as an explicit negation or as a definition of what is NOT claimed (see §9 of the implementation report for the classified grep output).

---

## 8. Exit-criteria status (sprint plan S01)

| Exit criterion | Status |
|---|---|
| N pinned under OQ-7 | ✅ N=5/theatre |
| Bounded sanity-sample run for T1/T2/T4 within ceilings | ✅ (T4 bounded retrieval hit drift+throttle) |
| Verification ledger written under `cycle-003/sprint-01/` | ✅ this file |
| Every load-bearing figure verified/revised **or** explicitly BLOCKED | ✅ F1–F9, F11 verified/revised; F10 (cascade-count buckets) S04-deferred (unblocked, not computed) |
| T1 NCEI XRS retrievability confirmed/revised | ✅ verified |
| T1 SWPC/DONKI FLR label join confirmed/revised | ✅ verified (DONKI FLR) |
| T2 per-3hr Kp retrievability confirmed/revised | ✅ verified |
| T2 GFZ lag behavior confirmed/revised | ✅ verified (28-day) |
| GOES-R-era S1+ supply answered (integer + source + date) | ✅ **46** events ≥2017 (through 2026-01-18); NOAA NCEI list; retrieved 2026-05-28 (corrected 45→46) |
| GOES-R-era S1+ per-bucket `[0-1…]` spread | ◻︎ S04-deferred (cascade-count join, not S01); S-magnitude spread S1:28/S2:13/S3:4/S4:1/S5:0 provided as supply characterization |
| Frozen invariants re-confirmed intact | ✅ (committed-blob check) |
| Working-tree changes limited to `cycle-003/sprint-01/` | ✅ (git status clean; cache gitignored) |

**S01 is verification-complete. T1, T2, and the T4 S1+ supply count (= 46) are verified; the T4 cascade-count bucket distribution is explicitly S04 work (unblocked, not completed).** Await `/review-sprint sprint-S01`. No commit; no S02.
