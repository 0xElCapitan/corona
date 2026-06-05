# CORONA cycle-003 — S04.5 T4 Raw-Proton-Flux Unblock Spike (Research Only)

**Type**: pre-S05 research / source-proof spike. **NOT** an implementation, sprint, corpus build, or commit.
**Branch**: `cycle-003-s04-t4-expansion` @ `f8d074f` (S04 closed) · `main` untouched at `eaaf5e4`.
**Date**: 2026-05-31
**Method**: orchestrator inline fetch/parse via sandbox-off Bash + ephemeral Python venv (h5py 3.16 / numpy 2.4.6) **outside the repo**, then a 9-agent adversarial workflow (4 research dimensions → 4 adversarial verifications → synthesis). No repo files under `src/`/`scripts/`/`tests/`, no corpus, no manifest, no loader/replay/runtime code were touched. Nothing committed/pushed. No S05 started.
**Posture**: makes **no** claim of calibration improvement, runtime sensitivity, predictive uplift, forecasting accuracy, L2 readiness, or any new rung. Cycle-003 remains a corpus-shape/data-substrate cycle at cycle-002's ceiling (T4 runtime sensitivity only, Rung 2).

---

## 1. VERDICT: ⚠ PARTIALLY UNBLOCKED (high confidence)

A real, parseable, **historical proton-flux TIME SERIES** demonstrably exists for both corpus eras — so the hard stop ("event-level max-pfu SEP tables do not count") does **NOT** bind, and BLOCKED is wrong. But it is **not fully UNBLOCKED**, because the canonical **≥10 MeV INTEGRAL flux in SWPC pfu** (the exact quantity CORONA's S-scale and the frozen T4 records are defined on) is **not a confirmed native historical read for the GOES-R/SGPS era (2020+)** — it must be *derived* from SGPS differential channels (a transform with real, unpinned uncertainty), and the canonical operational integral is tail-only.

**Two distinct blockers, different fates** (carried from S04, now sharpened):
- **T4 record construction (S04-T2)** → **conditionally unblockable**: source + parse path proven; gated on (i) an integral-reconstruction spec decision for 2020+, (ii) SDD DV-5 bounded-fetch authorization. This is what "PARTIALLY UNBLOCKED" refers to.
- **Cascade-bucket distribution (S04-T3)** → **separately remains BLOCKED until** the full M5+ trigger catalogue (incl. zero-producers) is built; **no proton-flux source lifts it**. Feasibility of that catalogue is now CONFIRMED (XRS flare-summary + DONKI FLR), but the catalogue itself is unbuilt.

**Final line is in §6.**

---

## 2. Official source candidates

| # | Source | Authority | Coverage | Product / format | ≥10 MeV channel | Historical 72h windows? |
|---|--------|-----------|----------|------------------|-----------------|------------------------|
| **(a)** | **GOES-R SGPS L2** `sgps-l2-avg1m` — `https://data.ngdc.noaa.gov/platforms/solar-space-observing-satellites/goes/goes16/l2/data/sgps-l2-avg1m/YYYY/MM/sci_sgps-l2-avg1m_g16_dYYYYMMDD_v3-0-2.nc` (g17/18/19 analogous) | NOAA NCEI | GOES-16 **2020–2025** | netCDF4/HDF5; daily=1440×1-min; range-requestable; license unrestricted | **NO native ≥10 MeV integral** — native integral is **">500 MeV" (P11) only**; carries 13 **differential** channels ~1.0–404 MeV. ≥10 MeV integral must be **derived**. | **YES** (deep daily archive; 72h = 3–4 files) |
| **(b)** | **SWPC operational** integral-protons JSON — `https://services.swpc.noaa.gov/json/goes/primary/integral-protons-3-day.json` | NOAA SWPC | **~3–7 day tail only** | JSON `{time_tag,satellite,flux,energy}` | **YES native** — `>=1,>=5,>=10,>=30,>=50,>=60,>=100,>=500 MeV` in pfu | **NO** (live tail; cannot reach 2017–2025) |
| **(c)** | **CDAWeb / SPDF HAPI** | NASA SPDF | — | HAPI JSON | **NO** — only GOES-13/14/15 EPS MAGED/EPEAD **electrons** + GOES-16-18 **ephemeris**; no GOES-R SGPS integral protons | N/A (excluded) |
| **(d)** | **Legacy GOES SEM / EPS** — `https://www.ncei.noaa.gov/data/goes-space-environment-monitor/access/avg/YYYY/MM/goes15/{csv,netcdf}/` (g13 analogous) | NOAA NCEI | EPS era (covers **2017** windows; ends ~GOES-15) | CSV + netCDF; e.g. `g15_epead_cpflux_5m_*.csv` (corrected integral proton flux) | **YES native >10 MeV integral pfu** | **YES** (dated monthly tree) |
| **(e)** | **NCEI historical store of the *operational* >10 MeV integral** for the GOES-R era | NOAA NCEI (hypothesized) | unknown | unknown | would be **YES native** if it exists | **UNCONFIRMED** — highest-value future probe |

**The integral-channel gap (load-bearing).** SGPS (a) is the only deep GOES-R-era archive, but its native integral is `>500 MeV` only. To get the schema's `>=10 MeV` integral from SGPS you must **numerically integrate the 13 differential channels** over energy — with documented caveats: a **partial-bin straddle** at the 10 MeV edge (ch4 = 5.84–11.0 MeV), **top-bin tail truncation** (SGPS tops out ~404 MeV, so a true >10 MeV integral's >404 MeV tail is missed), and **differential→integral solid-angle / −X·+X sensor-unit** assumptions. Result is a project-defined proxy with a likely **cross-instrument calibration offset** vs the EPEAD/operational basis the existing 5 frozen records were built on.

---

## 3. Sample-window results (orchestrator inline, real fetch/parse)

| Window | Trigger | Source file | Parsed? | Observations | Result |
|--------|---------|-------------|---------|-------------|--------|
| **2024-05-14 X8.7** | M/X flare (proton-producing era) | `sci_sgps-l2-avg1m_g16_d20240514_v3-0-2.nc` (2.66 MB) | **YES** | 1440 × 1-min, 13 diff channels | J2000 time decodes (00:00→23:59Z); real SEP spectrum at 12:26Z (ch0 1.38 MeV=0.25 → ch12=0); `_FillValue=-1e31` |
| **2024-05-14 — derived ≥10 MeV integral** | — | same | **YES (derivation runs)** | integrated ch5–ch12 (≥11.6 MeV) × bin-width | peak ≈ **92.9 per-sr** vs quiet ≈50.7 (1.8× elevated). **⚠ Does NOT match canonical SWPC pfu** (comparable 2024-05-10 SWPC event = **208 pfu**) → confirms the proxy ≠ canonical-integral concern |
| **2017-09 (S2/S3 era)** | 2017-09-05/10 X-class | `g15_epead_cpflux_5m_20170901_20170930.csv` | **header parsed** | 5-min, monthly CSV+netCDF | **native >10 MeV integral pfu** (EPEAD corrected proton flux) — no derivation; matches frozen 2017 records' EPEAD provenance |
| **2018–2019 "zero" era** | — | — | n/a | — | **moot**: per-year supply 2018–2020 = **0** S1+ events (genuine solar minimum); no SGPS coverage needed there |
| **Zero-producing M5+ window** | (design) | SGPS (2020+) / EPS (2017) | feasible | — | zero/nonzero **is observable** (derivation distinguishes elevated from quiet baseline); a true zero-window = an M5+ flare with no S1+ in +72h, derivable only via the trigger catalogue (§4) |

**Hard-stop check: cleared.** The data is a genuine multi-sample TIME SERIES (1440/day for SGPS; multi-sample for EPS), not event-level max-pfu. The loader confirms the schema needs exactly this: `validateT4` hard-rejects any `proton_flux_observations` that is not an array; `deriveT4QualifyingEvents` sorts by time + applies a 30-min dedup; the frozen `2017-09-10-S3.json` carries 5 distinct timestamped samples. The NOAA SEP list is **not** enumerated as a time-series candidate anywhere.

---

## 4. Trigger-source result — CONFIRMED enumerable (incl. zero-producers)

An authoritative GOES-R-era M5+ flare **trigger population, including the zero-S1+-producing windows**, is enumerable — so the S04 cascade-distribution blocker is **structurally liftable** (though not lifted in this spike).

- **Key insight**: a T4 corpus event is keyed on an **M5+ FLARE** (calibration-protocol §3.7.5 / theatre-authority: trigger = GOES X-ray flare ≥M5.0), not a proton event. The trigger denominator is therefore a **flare-list** problem, fully decoupled from proton data — which is exactly why the proton-events-only SEP list can't supply it and a flare catalogue can.
- **Primary enumerator**: GOES XRS flare-summary **`xrsf-l2-flsum`** at NCEI (flare class + peak time; same host + ephemeral-venv netCDF pattern as S03's XRS work; a complete, non-proton-gated flare list).
- **Cross-check**: **DONKI FLR** (`api.nasa.gov/DONKI/FLR`) — S01-verified (F2); date-windowed query returns the full array of flares with `classType`+`peakTime`+`sourceLocation`+`activeRegionNum`.
- A **zero-count window** is then derivable as "an M5+ flare with zero qualifying S1+ proton events in its +72h window" — most M5+ flares → count 0 → bucket `0-1`.
- **Limitation**: feasibility/method only; builds no catalogue, asserts no spread. `xrsf-l2-flsum` M5+ completeness across GOES-16→19 handoffs/reprocessing, and whether the ≥2020 GOES-R true-scale caveat applies to flsum thresholding, must be checked under HS-9 before any count is load-bearing.

---

## 5. S04.5 recommendation (if pursued)

**Cascade-bucket feasibility**: from the sampled data an S04.5 sprint *could* honestly compute per-trigger S1+ counts → buckets `[0-1,2-3,4-6,7-10,11+]`, zero-windows, and dedup — **only after** the full M5+ trigger catalogue (§4) is built. Record construction (proton series) and the bucket distribution are separate scopes; the latter strictly needs §4.

**Proposed narrow S04.5 plan (no code edits unless separately authorized):**
1. **First step = Option A′ (bias-free proof-of-source), strongly recommended.** Re-derive only the **5 existing frozen records'** ≥10 MeV series from the official archives — 2017 via legacy EPS `g15_epead_cpflux` (native), 2020+ via SGPS differential-integration — to prove retrievability + frozen-compatibility per 72h window. Builds **no** new records, makes **no** distribution claim, discharges the HS-9 unverified-source premise. Ephemeral venv outside the repo (S03 pattern).
2. **Probe candidate (e)** — an NCEI historical store of the *operational* >10 MeV integral pfu for 2020+. If found, it **supersedes** the SGPS differential-integration path (native integral, zero transform uncertainty, byte-consistent with the EPEAD/operational basis) and could flip the 2020+ leg toward UNBLOCKED.
3. **Exact sources**: 2017 → legacy EPS (native); 2020+ → SGPS `sgps-l2-avg1m` (derived ≥10 MeV) **or** (e) if confirmed.
4. **Tooling**: ephemeral h5py/numpy venv + node fetch, **outside the repo**; HTTP range/window fetches only (no mirroring). No edit to `corpus-loader.js`/replay/runtime; validate via existing `loadCorpus`.
5. **Expected new files** (a real S04.5, separately gated): `corpus-cycle-003/primary/T4-proton-cascade/*.json` records + a manifest additive update — **only under explicit sprint-plan authorization**, then `/review-sprint` → `/audit-sprint` gates.

**Operator decisions required before any 2020+ record is built:**
1. **Integral-reconstruction spec** — pin the SGPS differential→≥10 MeV-integral method (partial-bin handling at 10 MeV, >404 MeV truncation, solid-angle/sensor choice), and decide whether a self-derived proxy is acceptable alongside the operational-sourced existing/2017 records (a corpus-consistency call). *(This is the Q3 proxy-acceptability question — open, not asserted.)*
2. **Trigger-selection rule** — proton-productive-only M5+ (≤25, selection-biased) vs full-M5+-population (unbiased); trigger-level dedup for overlapping +72h windows (not pinned by spec); trigger anchor (col[5] flare time vs DONKI/XRS peak time).
3. **DV-5 bounded-fetch authorization** — S04 (SMALL) did not carry it; S04.5 must obtain it; making any count/series load-bearing without a sanity-sample trips HS-9.

---

## 6. Should we proceed to S04.5 before S05, or go directly to S05 with T4 blocked?

**Recommendation: proceed directly to S05 with T4 supply-characterized-only; do NOT insert S04.5 before S05.** The S05 held-out split can be sealed now — it already anticipates T4 as **underpowered / supply-only** (HO-6 / OQ-3), and nothing in S05 depends on T4 records existing. Inserting S04.5 first would (a) require new DV-5 authorization, (b) require the operator to resolve the integral-reconstruction spec + trigger-selection rule, and (c) still leave the cascade-bucket distribution blocked until a separate M5+ flare catalogue is built — i.e. S04.5 is a genuine sprint, not a quick unblock.

**If** the operator later wants real T4 records, S04.5 is **feasible** and the cleanest entry is the bias-free Option A′ proof-of-source (§5 step 1) + the candidate-(e) probe — best run as its own gated sprint **after** S05/S06, not wedged before S05. The S06 closeout's binding manifest-T4 reconciliation (already recorded) should also fold in this spike's finding that the buckets are *liftable-but-unbuilt*, not permanently impossible.

---

*Research spike only. Source candidates (a)–(d) + the SGPS parse, the differential→integral derivation, and the 2017 EPS native-integral header were orchestrator-verified by real sandbox-off fetch + ephemeral-venv parse outside the repo; candidate (e) and `xrsf-l2-flsum` contents are UNCONFIRMED (future authorized probe). No repo code/corpus/manifest changed; nothing committed; no S05 started; no rung/calibration/uplift claim made.*
