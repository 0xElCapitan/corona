# CORONA cycle-003 — Sprint S03 Implementation Report

**Sprint**: S03 — T1/T2 corpus construction (wired-capable only). LARGE (7 tasks).
**Branch**: `cycle-003-s03-t1-t2-corpus`
**Base**: `cycle-003` @ `0f217a2` (contains S01 `fdfdb99` + S02 `0f217a2`); **0 commits since base** (no commit performed).
**Authored**: 2026-05-31
**Status**: implementation complete; **awaiting `/review-sprint sprint-S03`**. No commit, no push, no S04.

> **Binding scope statement:** *S03 proves that real T1/T2 cycle-003 corpus records can be shaped with
> leakage-free pre-cutoff evidence series (`xray_flux_observations[]` / `kp_observations[]`), making the
> corpus wired-CAPABLE for future Layer-A/B work. It does NOT prove T1/T2 runtime wiring, T1/T2 runtime
> sensitivity, calibration improvement, forecasting accuracy, predictive uplift, any new rung, or L2
> readiness. Per SDD §2 / OQ-2, the current loader/replay code ignores these series fields.*

---

## 0. Cycle posture (carried forward, unweakened)

Cycle-002 closed at **Rung 2 (runtime-sensitive, T4 only)**; published version **v0.2.0**;
"calibration-attempted, not improved." Cycle-003 is a **corpus-shape / data-substrate cycle**: it earns
**no new rung** and advances **no theatre's rung** (OQ-8). NOT refit · NOT calibration-improvement · NOT
T1/T2 sensitivity · NOT L2 publish-ready · NOT release. The SDD §2 Layer-A/B replay+loader change is out
of scope (HS-2 / OQ-9).

---

## 1. Executive summary

S03 populated the cycle-003 corpus namespace with **30 real T1 flare records** (each carrying a
leakage-free, strictly-pre-cutoff `xray_flux_observations[]` GOES X-ray series) and **30 real T2
geomagnetic-storm records** (each carrying a leakage-free, strictly-pre-cutoff `kp_observations[]`
per-3hr Kp lead-in). A read-only substrate-conformance probe (SDD §2.3) over all 60 events via the
**unmodified** loader returns **0 violations** (5,557 series entries; all strictly pre-cutoff, strictly
time-ordered, no settlement-key leak). The cycle-003 manifest now carries per-file canonical-JSON
SHA-256 entries for all 60 records; the top-level `corpus_hash` remains **PENDING** (the corpus is
incomplete — T4 lands in S04, the held-out seal in S05, the final hash in S06).

Frozen invariants intact; frozen `corpus/` tree byte-unchanged; only the cycle-003 namespace was
written. No code edit, no `processX`, no trajectory, no score, no refit, no T4, no held-out split, no
commit/push.

---

## 2. Pre-flight grounding (read-only, all confirmed)

| Check | Result |
|---|---|
| Active base = updated `cycle-003` containing S01+S02 | ✅ `cycle-003` @ `0f217a2`; `merge-base --is-ancestor` confirms `fdfdb99` (S01) and `0f217a2` (S02) present |
| `main` not active, untouched | ✅ `main` @ `eaaf5e4` (planning baseline); not checked out here |
| Working tree clean except known untracked | ✅ clean at start; `.agents/`/`.codex/`/`AGENTS.md` not present in this worktree (not staged) |
| Sprint branch created from `cycle-003` | ✅ `cycle-003-s03-t1-t2-corpus` (non-slash form) |
| S01 artifacts incl. `COMPLETED` | ✅ present (APPROVED) |
| S02 artifacts incl. `COMPLETED` | ✅ present (APPROVED) |
| `corpus-cycle-003/` skeleton-only before S03 | ✅ only `.gitkeep` in `primary/*`; manifest skeleton; schemas |
| No preexisting `sprint-03/` | ✅ none |
| Frozen invariants (committed-blob sha256) | ✅ `corona-backtest.js`=`17f6380b…1730f1`; cycle-001 `calibration-manifest.json`=`e53a40d1…5db34a`; `corpus_hash b1caef3f…11bb1` present; `package.json`=`0.2.0`; RLMF cert=`0.1.0` |

---

## 3. HITL fork and operator decision (data sourcing)

A grounding pass established an asymmetry that determines what real data can honestly land in the
protected namespace (the same class of decision the operator adjudicated for S02 CN-4):

- **T2** `kp_observations[]`: GFZ Potsdam definitive per-3hr Kp is **plain-text and parseable** → real
  values achievable directly.
- **T1** `xray_flux_observations[]`: the NCEI GOES-R XRS 1-min 1–8 Å archive is reachable but stored as
  **binary netCDF-4/HDF5**; this environment had **no HDF5 reader** (no `h5py`/`netCDF4`/`ncdump`;
  `scipy` reads only netCDF-classic) and `scripts/` is read-only, and SWPC JSON is tail-only (no
  history). So real T1 flux had no honest extraction path without additional tooling.

This was surfaced (HALT, not invent-a-regime). **Operator decision**: attempt real T1 extraction using
an **ephemeral HDF5/netCDF reader outside the repo**; do not fabricate, do not commit tooling, do not
edit repo scripts; prove extraction works **before** writing durable records; if it fails, STOP and
write a blocker report.

**Extraction proof (succeeded).** An ephemeral venv outside the repo (`h5py 3.16.0` / `numpy 2.4.6` /
Python 3.14.0, HDF5 C-lib 2.0.0) read the NCEI netCDF. Decoding `time` (units
`seconds since 2000-01-01 12:00:00 UTC`, J2000, leap-seconds neglected per the file's own `comments`),
`xrsb_flux` (units `W/m2`, `_FillValue −9999`, electron-corrected), and `xrsb_flag` (`0 = good_data`),
the extracted peak for the 2024-05-14 flare was **8.688e-4 W/m² at 16:51:00Z**, which matches the known
**X8.7** magnitude exactly — confirming honest time/units/quality interpretation. Construction then
proceeded.

---

## 4. Decision log

### D-1 — T1 settlement from the GOES XRS argmax, not DONKI `peakTime` (leakage-correctness)
The frozen cycle-001 corpus lists the 2024-05-14 flare's `flare_peak_time` as `17:08:00Z`, but the
actual GOES XRS flux peak is `16:51:00Z` (by 17:08 the flux had decayed to 1.3e-4). Since
`deriveCutoffT1 = flare_peak_time − 1 ms`, using a `flare_peak_time` later than the true GOES peak would
pull the peak **inside** the pre-cutoff window — a settlement leak. cycle-003 therefore derives
`flare_peak_time` / `flare_peak_xray_flux` / `flare_class_observed` from the **GOES XRS argmax** (the
SDD §4.3 settlement authority is GOES X-ray flux). `donki_flr_class_type` and `donki_record_ref`
preserve the DONKI catalog cross-reference; `flare_end_time` is the NOAA half-decay time (GOES-derived).

### D-2 — T1 restricted to ≥2020 (GOES-R true-scale era) for one consistent real scale
NCEI XRS is the GOES-R **true** flux; NOAA's flare-class scale changed over the GOES-R transition.
Empirically (biggest flare/year, GOES-true ÷ DONKI-class):

| 2017 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|
| **1.57** | 1.01 | 1.06 | 1.02 | 0.99 | 0.99 | 1.01 | 1.00 |

For **≥2020** the GOES-R true XRS-B flux **equals** the canonical NOAA/DONKI class (ratio ≈ 1.0); 2017
diverges (~1.57 — legacy GOES-13/15 0.7-scaled classification + GOES-16 in post-launch checkout). T1 is
therefore restricted to **≥2020** so every record's flux, class, and series sit on one consistent real
scale that also matches the canonical classification. This is **within** the ≥2017 GOES-R-era rule (a
floor, not a mandate to include 2017). A per-event sanity gate (GOES/DONKI ratio ∈ [0.8, 1.25]) confirms
the match. (T2 has no such issue — Kp is ground-derived; T2 spans ≥2017.)

### D-3 — T2 lead-in strictly before the storm peak interval; GFZ definitive only
For each storm the window is the 3-hr interval of the peak GFZ Kp; `cutoff = kp_window_end`. The
`kp_observations[]` lead-in is the per-3hr GFZ **definitive** Kp ending strictly **before**
`kp_window_start` (the peak interval = settlement, excluded). Only **definitive** (file flag `D ≥ 1`)
peaks are admitted.

### D-4 — GFZ ~30-day lag (T2S-2) honored by exclusion
Definitive frontier = **2026-04-30** (retrieved 2026-05-31; ~31-day lag). Two within-lag G1+ storms
(2026-05-04 Kp 5.33, 2026-05-15 Kp 6.0) exist but were **excluded**: an honest pre-cutoff *provisional*
series could not be sourced (DONKI GST `allKpIndex` carries no pre-window readings; SWPC live JSON is
tail-only and these windows are weeks old). Rather than fabricate a provisional lead-in, S03 admits only
definitive storms — all 30 T2 events carry definitive Kp (`kp_gfz_observed != null` ⇒ regression-tier
eligible per `validateT2`). The exclusion + rationale are recorded; the loader's null-handling
(`kp_gfz_observed: null` ⇒ regression-tier-ineligible) is documented, exercised by no admitted event.

### D-5 — `corpus_hash` PENDING (canonicalization documented)
The corpus is **incomplete** after S03 (T4 = S04, held-out seal = S05). A *final* top-level
`corpus_hash` is therefore premature and stays **PENDING/null**; it is computed in **S06** over the
complete tree via `reporting/hash-utils.js::computeCorpusHash` (path-sorted; per file:
`relative-path + NUL + raw file bytes + NUL`; SHA-256). **Windows/CRLF note**: `computeCorpusHash`
hashes *raw bytes*, so S06 MUST run it over **LF / committed-blob** content (this `autocrlf=true`
worktree yields on-disk CRLF; cycle-001 `b1caef3f` is over LF). For per-file integrity now, `entries[]`
records an **EOL-immune canonical-JSON SHA-256** (`replay/hashes.js::sha256OfCanonical` over the
RFC-8785-spirit `canonical-json.js` canonicalization). The frozen cycle-001 `corpus_hash b1caef3f…` is
referenced as a predecessor and is **never** replaced or equated (CN-2).

### D-6 — Series extent / lead-in (documented, bounded)
- **T1**: good-quality (`xrsb_flag==0`), in-range (`valid_min ≤ f ≤ valid_max`, ≠ `_FillValue`) 1-min
  samples in `[peak − 180 min, cutoff)`. Captures pre-flare background + the full rising limb; the peak
  minute is excluded. For flares early in a UTC day the lead-in is truncated at the day-file start
  (still real, still leakage-free, ≥1 entry).
- **T2**: per-3hr GFZ definitive Kp over the 36 h (12 intervals) ending strictly before
  `kp_window_start`.

### D-7 — Tooling stayed ephemeral and outside the repo
All extraction tooling (venv, `h5py`, fetchers, builders, the conformance probe script) lived under a
temp directory **outside** the repo and is **not committed**. Bounded per-event-window NCEI fetches +
batched DONKI year-range queries (demo key) + one GFZ file fetch. No repo dependency, lockfile, or
`package.json` change; no `scripts/`/`src/`/`tests/` edit; cache/`.nc`/venv never entered the repo.

---

## 5. Tasks completed (sprint-plan S03.1–S03.7)

| Task | Status | Evidence |
|---|---|---|
| S03.1 — T1 events + `xray_flux_observations[]` (cutoff = `flare_peak_time − 1 ms`) | ✅ | 30 records; 5,197 entries; GOES-argmax peak (D-1/D-2) |
| S03.2 — T2 events + `kp_observations[]` (cutoff = `kp_window_end`); GFZ-lag honest | ✅ | 30 records; 360 entries; GFZ definitive; lag honored (D-3/D-4) |
| S03.3 — construction-time leakage prevention (no entry ≥ cutoff; no settlement label in series) | ✅ | conformance probe: 0 violations |
| S03.4 — T2 GFZ-lag eligibility marked | ✅ | within-lag storms excluded w/ rationale (D-4); admitted events all definitive/eligible |
| S03.5 — read-only substrate-conformance probe (no `processX`, no trajectory, no score) | ✅ | `conformance-probe-report.md` (0 violations) |
| S03.6 — per-event provenance + verified tags recorded | ✅ | manifest `entries[]` (source, retrieval_date, donki ref) + README ledger (S01, carried) |
| S03.7 — wired-*capable* framing (HAZ-1 disclaimer; Layer-A/B future) | ✅ | this report §0, probe report framing block, manifest `s03_summary` |

---

## 6. Data sources + provenance (CN-5 / FR-C6-7)

| Theatre | Series | Authoritative source | Catalog ref |
|---|---|---|---|
| T1 | `xray_flux_observations[]` (1-min 1–8 Å, `W/m²`) | **NOAA NCEI GOES-R XRS** `xrsf-l2-avg1m_science` (`xrsb_flux`, electron-corrected), GOES-16 (≤2025) / GOES-18 (2025–2026); netCDF-4 via `h5py` | DONKI **FLR** `flrID` + `classType` |
| T2 | `kp_observations[]` (per-3hr Kp) | **GFZ Potsdam definitive Kp** (`Kp_ap_Ap_SN_F107_since_1932.txt`, flag `D ≥ 1`; Matzka et al. 2021) | DONKI **GST** `gstID`; `kp_swpc_observed` = GST `allKpIndex` peak (source NOAA/SWPC) |

Retrieval date **2026-05-31**. Per-file source + retrieval basis + DONKI cross-reference recorded in
`corpus-cycle-003-manifest.json::entries[]`.

---

## 7. Acceptance-criteria verification

| AC | Verdict | Evidence |
|---|---|---|
| **T1S-1 / T2S-1** strictly pre-cutoff (HARD; HS-7) | ✅ | probe: every entry `time_ms < cutoff.time_ms`; 0 violations; T1 min margin 59.999 s, T2 6 h |
| **T1S-2 / T2S-3** settlement labels never in series (FR-C6-4) | ✅ | probe checks settlement keys absent from every entry; 0 found |
| **T2S-2** GFZ lag → within-lag regression-tier-ineligible | ✅ | only definitive admitted; within-lag excluded w/ rationale (D-4); loader sets `regression_tier_eligible` from `kp_gfz_observed != null` |
| **T1S-3 / T2S-4** replay-ingestible (time-keyed, sortable, T4-analogous) | ✅ | `{time, …}` arrays, strictly ascending; structurally mirror `proton_flux_observations[]` |
| provenance + verified transition (FR-C6-7) | ✅ | manifest `entries[]`; README S01 ledger (verified) |
| probe read-only; no `processX`/trajectory/score (CSG-3, CSG-4) | ✅ | probe imports `loadCorpus` + `_CUTOFF_DERIVATIONS` only |
| **T1S-4 / T2S-5** wired-*capable*, not wired/sensitive/calibrated (HAZ-1, HS-8) | ✅ | framing in §0, probe report, manifest |

---

## 8. Validation report (operator checklist)

- **Active branch**: `cycle-003-s03-t1-t2-corpus`
- **Base**: `cycle-003` @ `0f217a2` (0 commits since base)
- **Files created**: 30 T1 records (`primary/T1-flare-class/*.json`), 30 T2 records
  (`primary/T2-geomag-storm/*.json`), `sprint-03/implementation-report.md`,
  `sprint-03/conformance-probe-report.md`. **Modified**: `corpus-cycle-003-manifest.json` (entries[] +
  statuses), `corpus-cycle-003/README.md` (S03 population note).
- **`git status --short`**: 1 `M` manifest + 1 `M` README + 60 `??` corpus records + `??` sprint-03/.
  No `.agents/`/`.codex/`/`AGENTS.md`; no cache/`.nc`/venv (all in temp, outside repo).
- **T1 records created**: **30**. **Each has `xray_flux_observations[]`**: ✅ (5,197 entries total; all non-empty).
- **T2 records created**: **30**. **Each has `kp_observations[]`**: ✅ (360 entries total; all non-empty).
- **Pre-cutoff / leakage audit**: ✅ **0 violations** (60 events / 5,557 entries; conformance-probe-report.md).
- **Source / provenance / retrieval-date coverage**: ✅ 60/60 in manifest `entries[]` (retrieval 2026-05-31).
- **Manifest / hash**: manifest updated (60 entries, per-file canonical SHA-256); top-level `corpus_hash` **PENDING/null** (corpus incomplete; final hash = S06). Canonicalization documented (D-5).
- **Forbidden-path audit**: ✅ no change under `src/`, `scripts/`, `tests/`, `corpus-loader.js`, `t1-replay.js`, `t2-replay.js`, frozen `corpus/`, `calibration-manifest.json`, cycle-001/002 artifacts, root `prd/sdd/sprint.md`, `ledger.json`, root `README.md`, `BUTTERFREEZONE.md`, `package.json`.
- **Frozen corpus tree untouched**: ✅ `git diff HEAD -- …/corpus/` empty.
- **Frozen invariants**: ✅ `corona-backtest.js 17f6380b…`, `calibration-manifest e53a40d1…`, `corpus_hash b1caef3f…` (predecessor, unchanged), `package.json 0.2.0`, RLMF `0.1.0`.
- **Claim-language grep gate (CSG-9)**: see §9.
- **No**: code edit · replay/loader wiring · `processX` call · trajectory · scoring/Brier · backtest-as-evidence · refit · threshold/`PRODUCTIVITY_PARAMS`/σ/formula change · T4 population · held-out split · commit · push · S04. ✅ all confirmed.

### Corpus distribution (honest, supply-driven)

- **T1 (30)** — year: 2020:2, 2021:8, 2022:9, 2023:2, 2024:3, 2025:2, 2026:4. 6-class bucket
  (`classifyFlareToBucket`): **M1-M4:8, M5-M9:8, X1-X4:9, X5-X9:5**; `<M`:0 and `X10+`:0 (honest — DONKI
  FLR lists M+ flares; no ≥X10 occurred in the GOES-R era, max ~X9).
- **T2 (30)** — year: 2017:5, 2018:1, 2021:2, 2022:2, 2023:5, 2024:6, 2025:6, 2026:3. G-scale
  (`kpToGScaleIndex`): **G2:8, G3:12, G4:9, G5:1** (G5 = the May-2024 Gannon storm).

---

## 9. Claim-language grep gate (CSG-9)

Canonical gate `grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"`
over all cycle-003 S03 artifacts (`sprint-03/*.md`, `corpus-cycle-003/**`): every hit is a **NEGATION**
or **PROHIBITION** (e.g. "does NOT prove … calibration improvement", "No forecasting-accuracy claim",
"NOT calibration-improvement") — **0 unsafe positive claims**. The cycle-002 ceiling ("runtime-sensitive,
T4 only" / "calibration-attempted, not improved") is preserved unweakened. (Full classified output run
at validation; see the closing validation summary.)

---

## 10. Known limitations / pending

- **S03 proves shape + leakage-freedom only.** It does NOT prove T1/T2 runtime wiring or sensitivity
  (deferred Layer-A/B, HS-2/OQ-9), calibration improvement, forecasting accuracy, predictive uplift, any
  rung, or L2 readiness. The loader ignores both series at `evidence.pre_cutoff`.
- **T1 era floor 2020** (D-2): scientifically coherent (cycle-25 active period) but does not include the
  2017 events present in the frozen cycle-001 corpus; rationale is the GOES-R/legacy scale transition.
- **T1 buckets `<M` and `X10+` empty** (honest supply): no sub-M flares in the DONKI FLR catalog; no
  ≥X10 flare in the GOES-R era.
- **T2 within-lag storms excluded** (D-4): 2 G1+ storms inside the GFZ definitive lag are not admitted
  (no honest provisional series source); the loader's null-Kp regression-ineligibility path is
  documented but not exercised by an admitted event.
- **S04**: T4 expansion (supply ceiling = 46; re-pull NOAA SPE, parse `</tr>`-independently; cascade
  buckets). **S05**: held-out seal. **S06**: final `corpus_hash` over the complete tree (LF semantics),
  grep gate, frozen-invariant verification, SC-8 non-achievements, CLOSEOUT.

---

## 11. Reviewer verification steps

```bash
git rev-parse --abbrev-ref HEAD                 # cycle-003-s03-t1-t2-corpus
git diff HEAD -- grimoires/loa/calibration/corona/corpus/   # 0 lines (frozen tree untouched)
git show HEAD:scripts/corona-backtest.js | sha256sum         # 17f6380b…1730f1
ls grimoires/loa/calibration/corona/corpus-cycle-003/primary/T1-flare-class/*.json | wc -l   # 30
ls grimoires/loa/calibration/corona/corpus-cycle-003/primary/T2-geomag-storm/*.json | wc -l  # 30
# Re-run the read-only conformance check (existing loader; CORONA_CORPUS_DIR onto the cycle-003 tree):
#   loadCorpus({theatres:['T1','T2']}) -> 60 loaded, 0 rejected; assert every series entry
#   time_ms < deriveCutoffT{1,2}().time_ms and strictly ascending -> 0 violations.
grep -rniE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record" \
  grimoires/loa/a2a/cycle-003/sprint-03/ grimoires/loa/calibration/corona/corpus-cycle-003/   # negations only
```

---

*CORONA cycle-003 Sprint S03 — real T1/T2 corpus with leakage-free pre-cutoff evidence series;
wired-capable substrate shape only; no runtime wiring, no sensitivity, no calibration claim, no rung;
frozen cycle-001/cycle-002 artifacts byte-unchanged. Awaiting `/review-sprint sprint-S03`. No commit, no
push, no S04.*
