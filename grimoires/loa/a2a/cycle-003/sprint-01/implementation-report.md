# CORONA cycle-003 — Sprint S01 Implementation Report

**Sprint**: S01 — Archive Verification / Sanity Samples
**Type**: **verification-only** (no construction, no code, no corpus)
**Outcome**: T1 + T2 data sources **VERIFIED**; T4 GOES-R-era S1+ supply **VERIFIED = 46 events** (source revised to current NOAA/NCEI list after the original umbra-mirror drift was surfaced & operator-resolved; count corrected 45→46 after an operator-flagged omitted row — see §6). T4 `[0-1…]` cascade-count bucket distribution = **S04 work (unblocked, not computed in S01)**.
**Primary artifact**: [`verification-ledger.md`](verification-ledger.md)
**Branch**: `cycle-003-s01-archive-verification` · **Base commit**: `eaaf5e4df848c4f11beb400ecff1719a7bf018a5` · **Worktree**: yes (`…\.claude\worktrees\sad-ramanujan-6292ff`)
**Date**: 2026-05-28 (fetches at UTC ~2026-05-29T05:30Z)

---

## 1. Branch / worktree discipline

- Preflight base confirmed: HEAD `eaaf5e4…` == `origin/main`, message `docs(corona): add cycle-003 planning substrate`, working tree clean.
- The harness placed this session in a worktree on branch `claude/sad-ramanujan-6292ff` (a dedicated branch at the same base `eaaf5e4`, **not** `main`). To honor the requested branch name, a dedicated branch **`cycle-003-s01-archive-verification`** was created from that clean base and checked out in the worktree.
- All S01 work occurred on `cycle-003-s01-archive-verification`. The main repo's `main` worktree was never touched. **No commit, merge, push, or fast-forward** performed.
- Worktree path: `C:\Users\0x007\corona\.claude\worktrees\sad-ramanujan-6292ff`.

## 2. Files created / changed

Exactly two new files, both under `grimoires/loa/a2a/cycle-003/sprint-01/`:

```
grimoires/loa/a2a/cycle-003/sprint-01/verification-ledger.md     (new)
grimoires/loa/a2a/cycle-003/sprint-01/implementation-report.md   (new, this file)
```

`git status --short`:
```
?? grimoires/loa/a2a/cycle-003/sprint-01/
```
(Only the new sprint-01 directory is untracked. No other tracked or untracked changes. The ingestor cache under `scripts/corona-backtest/cache/` is **gitignored** — `.gitignore:27` — and does not appear.)

## 3. Confirmations (DO-NOT compliance)

| Confirmation | Result |
|---|---|
| No file created/edited under `src/`, `scripts/`, `tests/` | ✅ confirmed (`git status` clean for tracked code; only gitignored cache written by *running* ingestors) |
| No ingestor/code file modified (`donki-sanity.js`, `swpc-fetch.js`, `gfz-fetch.js`, `donki-fetch.js`, `corpus-loader.js`, `t1-replay.js`, `t2-replay.js`) | ✅ confirmed (read + run only; zero edits) |
| No `corpus-cycle-003/` tree created | ✅ confirmed (does not exist; that is S02 scope) |
| No corpus written | ✅ confirmed |
| No code edited | ✅ confirmed |
| No Layer-A/B replay+loader work (HS-2) | ✅ confirmed (OQ-2 answer only read, not acted on) |
| No frozen artifact touched (cycle-001/002 namespaces, root prd/sdd/sprint, ledger.json, corpus/, manifests, runtime, RLMF) | ✅ confirmed |
| No parameter/threshold/`base_rate`/`PRODUCTIVITY_PARAMS`/σ/formula change (HS-1) | ✅ confirmed |
| No code dependency added (zero-dep invariant) | ✅ confirmed (only `node:*` + native `fetch` used) |
| No README/BUTTERFREEZONE/`package.json` version touch (HS-5) | ✅ confirmed |
| No tag / release / version bump | ✅ confirmed |
| No T3 prediction emitted; no T5 Brier conversion (HS-6) | ✅ confirmed |
| No commit / push / tag | ✅ confirmed |
| No S02 work started | ✅ confirmed |
| `REQUIRES_LIVE_ARCHIVE_VERIFICATION` removed only on cited evidence | ✅ confirmed (F9/F10 left BLOCKED; no flip by assumption) |
| S01 was verification-only | ✅ confirmed |

## 4. Pinned N

**N = 5 per theatre** (OQ-7 default; no re-pin). Justification in ledger §1. Honors DONKI throttle ceilings (auth ≤900/hr, demo ≤35/hr); `NASA_API_KEY` UNSET → demo-key fallback, demo ceiling reached during sampling (confirms the ceiling).

## 5. Verified / revised / BLOCKED figures (source + retrieval date)

| # | Figure | Status | Source / evidence | Date |
|---|---|---|---|---|
| F1 | T1 NCEI GOES-R XRS 1-min 1–8 Å retrievable | ✅ verified | NGDC `xrsf-l2-avg1m_science` g16/g18; N=5 windows HTTP 200; `xrsb_flux` content-verified (2024-05-14, HDF5) | 2026-05-28 |
| F2 | T1 DONKI FLR label join | ✅ verified | `donki-fetch.js` FLR records w/ `class_type`, all 5 windows | 2026-05-28 |
| F3 | T1 live `xrays-*-day.json` tail-only; history in NCEI | ✅ verified | `swpc-fetch.js:56-62` + NCEI archive (F1) | 2026-05-28 |
| F4 | T2 per-3hr Kp retrievable (GFZ definitive) | ✅ verified | `gfz-fetch.js` → `Kp_ap_…_since_1932.txt`; 8 Kp/day; 1932→2026; G5-storm content-checked | 2026-05-28 |
| F5 | T2 GFZ ~30-day publication lag | ✅ verified | definitive frontier 2026-04-30 = 28-day lag | 2026-05-28 |
| F6 | T2 SWPC provisional Kp (live) retrievable | ✅ verified | `swpc-fetch.js` `planetary_k_index_1m.json` (358 recs) | 2026-05-28 |
| F7 | T2 DONKI GST label join | ✅ verified (1 sample) | `donki-sanity.js` 2022-02-03 GST; more windows throttled | 2026-05-28 |
| F8 | T1/T2 series abundant (≫30 events, planning posture) | ✅ supported (series + event abundance; count is S02/S03, not asserted) | XRS any window; 10–11 FLR/day 2024-25; GFZ 3-hr since 1932 | 2026-05-28 |
| F11 | DONKI demo throttle ceiling real/enforced | ✅ verified (empirical) | HTTP 429 `OVER_RATE_LIMIT` after ~10–13 demo calls | 2026-05-28 |
| **F9** | **T4 GOES-R-era (≥2017) S1+ supply COUNT** | ✅ **verified = 46**; source revised; corrected 45→46 | NOAA NCEI "Solar Proton Events Affecting the Earth Environment" (`ngdc.noaa.gov/.../solar-proton-events/`, Last-Modified 2026-01-21, last event 2026-01-18); 46 rows ≥2017 re-counted (td=3190=319×10, two methods); S-mag S1:28/S2:13/S3:4/S4:1/S5:0; +1 = `2024-02-09` S2 row dropped earlier by source missing-`</tr>` defect; 2017 cross-validates umbra | 2026-05-28 |
| **F10** | **T4 per-bucket `[0-1,2-3,4-6,7-10,11+]` cascade-count spread** | ◻︎ **S04-deferred (unblocked, not computed)** | cascade-counts per 72h M5+ trigger window (§4.4.2), not magnitude; needs M5+↔S-event join (S04). F9 source now supports it | 2026-05-28 |

## 6. GOES-R-era S1+ supply (the binding question) — VERIFIED = 46

**Source (verified official + current):** NOAA NCEI — "Solar Proton Events Affecting the Earth Environment (1976 to date)", `https://www.ngdc.noaa.gov/stp/space-weather/interplanetary-data/solar-proton-events/SEP%20page%20code.html`. HTTP 200; **`Last-Modified: Wed, 21 Jan 2026`**; last table row **2026-01-18** (current). Hosted on `www.ngdc.noaa.gov` (NOAA NCEI). Column [2] = **`>10 MeV Maximum (pfu)`**, present → supports S-scale assignment (S1≥10 … S5≥10⁵ pfu); the list's ≥10 pfu inclusion floor = S1, so every row is S1+.

**Independent re-count = 46.** Total data rows = 319 (td cells = 3190 = 319×10); Begin-Time year ≥2017 ⇒ **46 GOES-R-era S1+ events** (all ≥10 pfu), confirmed by two `</tr>`-independent methods (datetime-pair detection + chunk-by-10), which agree at 46.
- **Per-year:** 2017:3 · 2018–2020:**0** (solar minimum) · 2021:3 · 2022:5 · 2023:12 · **2024:14** · 2025:8 · 2026:1 (through 01-18) = **46**.
- **First/last:** 2017-07-14 (22 pfu, S1) → 2026-01-18 (37,000 pfu, S4).
- **S-scale MAGNITUDE distribution** (not the cascade buckets): **S1:28 · S2:13 · S3:4 · S4:1 · S5:0** — heavily S1-skewed (~61%), confirming PRD §5 "constrained and bucket-skewed".
- **⚠️ Count correction (45 → 46):** an earlier pass reported 45 — an undercount by one. The source table's **`2024-01-29` row is missing its `</tr>`**; the original `<tr>…</tr>` parse swallowed the next row's cells, silently dropping **`2024 02/09 1530, 187 pfu, S2`** (X3.3 flare, region 13575). The corrected `<td>`-cell-stream parse (independent of `</tr>`, cross-checked by td=3190=319×10) recovers it. No other GOES-R-era row is affected.
- **Cross-validation:** the 3 × 2017 rows match the stale umbra list exactly (22 / 844 / 1494≈1490 pfu).
- `NASA_API_KEY` was **not** used (NOAA/NCEI list needs no credential); the earlier DONKI SEP `DEMO_KEY` 429 became moot.

**⚠️ Limitation preserved — bucket spread NOT completed in S01.** `[0-1,2-3,4-6,7-10,11+]` are **72h-post-M5+-trigger cascade-count** buckets (calibration-protocol §4.4.0–4.4.2), **not** S-scale magnitude bins. Producing them requires pairing each M5+ flare trigger to its 72h S-event count — a corpus-construction join. **S04 bucket work is unblocked (supply + pfu/S-scale source now exist), not completed.** S01 verifies only the S1+ supply count and the pfu/S-scale source.

**Supply implication (honest, not padded):** 46 is the directly-counted figure (exceeds 30 without padding, per HAZ-2). But high-S **magnitude diversity is thin** (1×S4, 0×S5, 4×S3) → any high-magnitude / high-cascade-bucket held-out stratum will likely be **underpowered** (feeds S05 HO-6 / OQ-3). Count is "as published through 2026-01-18"; later-2026 events may be additive.

## 7. Halts / drift surfaced (and resolution)

- **HITL-T4-DRIFT — surfaced then RESOLVED.** The SWPC SPE list *as first accessed* (umbra/SDAC mirror) is stale since 2018-02 (ends 2017; 3 events). Surfaced per the cycle-001 HITL-2 pattern. The operator directed the current NOAA/NCEI list, which was verified (official + current) and used to re-count the supply (= 46, after the 45→46 count correction). **No open operator decision remains for the supply count.** umbra mirror superseded for cycle-003.
- **Count-correction note** — an earlier 45 was an undercount; a source missing-`</tr>` defect on the `2024-01-29` row caused the `2024-02-09` S2 event to be dropped by the `<tr>`-based parse. Corrected to **46** via a `</tr>`-independent `<td>`-cell-stream parse (operator-flagged, 2026-05-28).
- **Thin-magnitude caveat (HAZ-2)** — S1:28/S2:13/S3:4/S4:1/S5:0; do not pad; high-S held-out strata likely underpowered (S05/OQ-3).
- **Cascade-bucket boundary (not a halt)** — the `[0-1…]` per-bucket distribution is S04 scope; unblocked, not computed in S01.

## 8. Frozen-invariant check (re-confirmed intact)

Canonical check = committed git blob (LF-normalized); on-disk CRLF (`core.autocrlf=true`, no `.gitattributes`) is a checkout artifact, not drift. `git status` clean.

| Invariant | Expected | Result |
|---|---|---|
| `scripts/corona-backtest.js` blob sha256 | `17f6380b…1730f1` | ✅ MATCH |
| cycle-001 `calibration-manifest.json` blob sha256 | `e53a40d1…5db34a` | ✅ MATCH |
| cycle-001 `corpus_hash` (committed manifest) | `b1caef3f…11bb1` | ✅ present |
| `package.json` version | `0.2.0` | ✅ |
| RLMF cert version (`certificates.js:100`) | `0.1.0` | ✅ |

## 9. Claim-language grep gate (PRD §8 / SDD §9 CSG-9)

The canonical CSG-9 gate (`grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"`, the four phrases from PRD §8) was run over `grimoires/loa/a2a/cycle-003/sprint-01/*.md`. Result:

- **`verification-ledger.md`: 0 matches** (clean). Its claim-safety self-check (§7) writes the non-claims hyphenated ("calibration-improved", "forecasting-accuracy") inside explicit negations, so they do not trip the space-separated canonical pattern.
- **`implementation-report.md`: 1 match** — the single line in *this* section that reproduces the gate's own four-phrase pattern string for reproducibility. It is the gate documenting itself.

Every match (canonical + broader scan), classified:

| Loc | Text (excerpt) | Classification |
|---|---|---|
| report §9 | the reproduced CSG-9 pattern string itself | **DEFINITION** (gate self-reference, not a claim) |
| ledger §0 | "CORONA demonstrated **T4 runtime sensitivity only** (Rung 2)" | **DEFINITION** (verbatim cycle-002 ceiling preserved, mandated by the cycle posture) |
| ledger §0 | "**NOT** a refit cycle · **NOT** calibration improvement · **NOT** T1/T2 runtime sensitivity · **NOT** L2 publish-ready · **NOT** a release" | **NEGATION** |
| ledger §7 | "**no** calibration-improved claim … **no** forecasting-accuracy claim …" | **NEGATION** |

No **unsafe positive claim** is present in the substantive prose of either artifact. The only canonical-gate match is this report's self-documentation of the gate pattern (DEFINITION).

## 10. Verification-only confirmation

S01 read specs and *ran* (never modified) the existing ingestors, plus performed authorized bounded documented retrievals (NCEI XRS files; the NOAA/NCEI SEP list) against documented endpoints under the DV-5 bounded-fetch authorization. It produced two markdown artifacts under `cycle-003/sprint-01/` and nothing else. No corpus, no code, no manifest, no commit, no S02. **S01 is verification-only.** (The 2026-05-28 continuation re-verified T4 against the current NOAA/NCEI list and updated only these two artifacts — same constraints, still no code/corpus/commit.)

---

**STOP.** Awaiting `/review-sprint sprint-S01`. Do not start S02. T1/T2 verified; T4 S1+ supply verified (= 46, corrected from 45); the T4 `[0-1…]` cascade-count bucket distribution (F10) is **S04 work — unblocked, not computed in S01**.
