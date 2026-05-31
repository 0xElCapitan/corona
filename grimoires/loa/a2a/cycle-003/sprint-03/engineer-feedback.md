# CORONA cycle-003 — Sprint S03 Review (Senior Reviewer)

**Verdict: ALL GOOD (ACCEPT — with non-blocking concerns). S03 is READY FOR `/audit-sprint sprint-S03`.**

**Sprint**: S03 — T1/T2 corpus construction (wired-capable only).
**Branch**: `cycle-003-s03-t1-t2-corpus` @ `0f217a2` (HEAD == cycle-003 tip; 0 commits since base).
**Reviewed**: 2026-05-31. **Posture**: adversarial; artifacts independently re-verified (not report-trusted).

> Reviewer note: this review re-ran the conformance probe, **re-extracted every series value from the
> source data** (NCEI `.nc` via h5py; GFZ definitive text), recomputed manifest hashes, re-checked frozen
> invariants against committed blobs, and re-grepped claim language. Findings below are reproductions,
> not restatements.

---

## 1. Required-check results

| # | Check | Result |
|---|-------|--------|
| 1 | Branch / base / `main` / scope / no code / no commit | ✅ `cycle-003-s03-t1-t2-corpus` @ `0f217a2`; `main`=`eaaf5e4` untouched; **frozen-path diff EMPTY**; tracked changes = ONLY `corpus-cycle-003/README.md` + `corpus-cycle-003-manifest.json`; no `src/`/`scripts/`/`tests/`/loader/replay edit; 0 commits/pushes |
| 2 | Inventory | ✅ **30 T1**, **30 T2**, **0 T4**, **no `heldout-split.json`**; no placeholders (sentinel scan `2099\|placeholder\|sample\|TODO` = 0; all values trace to real source) |
| 3 | T1 source / extraction | ✅ **30/30 records match cached NCEI `.nc` exactly — 5,197 entries cross-checked** (each `long_channel_wm2` = real `xrsb_flux` at that minute, `xrsb_flag==0`; peak matches; ascending; last < peak). Ephemeral h5py tooling NOT in repo. h5py proof reproduced: 2024-05-14 peak **8.688e-4 @ 16:51:00Z = X8.7** (external ground-truth anchor). D-1/D-2: see §3 below |
| 4 | T2 source | ✅ **30/30 records match GFZ definitive — 360 entries cross-checked** (each `kp` = GFZ `D≥1` value; provenance `gfz_definitive`; settlement = GFZ peak; lead-ins strictly pre-`kp_window_start`); within-lag storms honestly excluded; DONKI `gstID` present as metadata only |
| 5 | Leakage / conformance | ✅ **re-ran probe independently: T1 30/0/5197, T2 30/0/360, 60 events / 5,557 entries / 0 violations**; uses unmodified `loadCorpus` + `deriveCutoffT1/T2`; no `processX`/replay/scoring; strict-pre-cutoff (T1 `peak−1ms`, T2 `kp_window_end`) + strict-ascending + no settlement-key in series; framed wired-capable |
| 6 | Manifest / hash | ✅ 60 entries; **5/5 sampled per-file canonical-JSON SHA-256 recompute exactly**; top-level `corpus_hash` = **`null` / PENDING**; final hash deferred to S06 (T4=S04, seal=S05); cycle-001 `b1caef3f` referenced as predecessor, **not** replaced/equated; CRLF/canonicalization caveat documented |
| 7 | Claim language | ✅ broad grep → every hit is **negation / prohibition / cycle-002 historical-ceiling definition / grep self-reference**; **0 unsafe positive claims** |
| 8 | Frozen invariants (committed blob) | ✅ `corona-backtest.js 17f6380b…`, `calibration-manifest e53a40d1…`, `corpus_hash b1caef3f…` (30× in frozen manifest, untouched), `package.json 0.2.0`, RLMF `0.1.0` |
| 9 | Distribution / limitations | ✅ recomputed from files: T1 `{M1-M4:8, M5-M9:8, X1-X4:9, X5-X9:5, <M:0, X10+:0}`, T2 `{G2:8, G3:12, G4:9, G5:1}` — **match reported exactly**; limitations documented (≥2020 floor ×3, X10+/<M, within-lag ×4, loader-ignores ×2, S04/S05/S06) |

**Internal consistency (independent recompute):** 0 issues — every T1 `flare_class_observed` equals
`class_of_flux(flare_peak_xray_flux)`; every `flare_end_time > flare_peak_time`; every
`event_time ≤ flare_peak_time`; all T1 ≥2020; T1 series max never exceeds the peak (0 prior-flare
contaminations).

### D-1 (GOES XRS argmax for settlement) — CORRECT, and a strength
SDD §4.3 names GOES/SWPC X-ray flux as the T1 settlement authority, so deriving
`flare_peak_time`/`flux`/`class` from the GOES XRS argmax is correct. It is also **required** for
leakage-safety: the frozen cycle-001 record lists the 2024-05-14 peak at 17:08 while the true GOES peak
is 16:51; `deriveCutoffT1 = flare_peak_time − 1 ms` means the later DONKI time would place the true peak
**inside** the pre-cutoff window. The implementation's choice prevents this. No downstream code consumes
DONKI `peakTime`, so no regression. Accept.

### D-2 (T1 restricted to ≥2020) — ACCEPTABLE with explicit caveat (non-blocking)
The empirical ratio table (2017 ≈ 1.57 vs 2020–2026 ≈ 1.0) substantiates the GOES-R-true-scale
transition; restricting T1 to ≥2020 keeps flux/class/series on one consistent real scale that matches
canonical NOAA classes. This is **within** the era rule (≥2017 is a floor) and well-documented. It is
accepted, with the caveat in §3 concern (1) below — the operator/auditor should consciously accept that
the cycle-003 T1 corpus omits the 2017 events present in frozen cycle-001 and that T1 era coverage
(2020–2026) is narrower than T2 (2017–2026).

---

## 2. `git status --short` (review-time)
```
 M grimoires/loa/calibration/corona/corpus-cycle-003/README.md
 M grimoires/loa/calibration/corona/corpus-cycle-003/corpus-cycle-003-manifest.json
?? grimoires/loa/calibration/corona/corpus-cycle-003/primary/T1-flare-class/  (30 files)
?? grimoires/loa/calibration/corona/corpus-cycle-003/primary/T2-geomag-storm/ (30 files)
?? grimoires/loa/a2a/cycle-003/sprint-03/  (impl report, conformance-probe report, this file)
```
No `.agents/`/`.codex/`/`AGENTS.md`; no `.nc`/venv/cache/extraction-script/lockfile/dependency in repo.
**Forbidden-path audit: clean.** **Frozen invariants: all match.** **Claim-grep: 0 unsafe positives.**

---

## 3. Adversarial Analysis

### Concerns identified (non-blocking)
1. **T1 era floor 2020 < T2 era floor 2017; 2017 flares omitted** (`implementation-report.md` D-2 / §10).
   Defensible (single-scale honesty) and documented, but it deviates from the plan's "~30 spanning
   2017→2026" posture and drops the iconic 2017-09 events that frozen cycle-001 carried. → **Operator/auditor
   should explicitly accept** this as the cycle-003 T1 scope, or request a follow-up adding 2017 events
   under explicit legacy-scale handling.
2. **`deriveCutoffT1 = peak − 1 ms` makes the T1 series' last sample reach ~95% of the peak flux**
   (median last/peak = 0.95; X8.7 last = 8.429e-4 vs peak 8.688e-4). This is inherent to the **frozen**
   cutoff rule (not introduced by S03) and conforms to T1S-1, but it means a *future* Layer-A/B nowcast
   at this cutoff would see almost the full rise — relevant context for OQ-9, not an S03 defect.
3. **6 T2 records have SWPC vs GFZ G-bucket disagreement** (max |Δ|=0.67; e.g. `T2-2017-09-28`
   swpc 7.0/G3 vs gfz 6.667/G2). Real operational-vs-definitive difference; the loader correctly buckets
   on `kp_gfz_observed` (definitive authority), `event_id` encodes the GFZ value, and both readings are
   honestly recorded. No action required; flagged so the audit isn't surprised.

### Assumptions challenged
- **Assumption**: the cached NCEI `.nc` files are authentic GOES data. **Risk if wrong**: "real" values
  would actually be tampered. **Mitigation/verdict**: validated by an *external* ground-truth anchor — the
  2024-05-14 extracted peak (8.688e-4) matches the publicly-known X8.7 magnitude — plus the files carry
  genuine HDF5 structure fetched from `data.ngdc.noaa.gov`. Acceptable. (A maximally paranoid audit may
  re-fetch one `.nc` fresh; the external X8.7 match already closes the gap.)

### Alternatives not considered
- **Alternative**: include 2017 T1 events using the legacy GOES-13/15 scale (or a 0.7 SWPC factor on
  GOES-16-true). **Tradeoff**: gives full era coverage but mixes scales within the corpus / depends on an
  uncertain conversion factor. **Verdict**: the chosen single-scale ≥2020 approach is the more honest
  default for cycle-003; 2017 inclusion is a legitimate future option if the operator wants it.

---

## 4. Required fixes
**None.** No blocking issues.

## 5. Readiness
S03 meets its acceptance criteria (T1S-1..5, T2S-1..6, CSG-1/3/4/9, CN-1..5, HS-1/2/3/5/7/8), proves
**wired-capable corpus shape only**, and makes no forbidden claim. **Ready for `/audit-sprint sprint-S03`.**
The three concerns above are non-blocking and documented for the auditor; concern (1) (the ≥2020 T1
floor) is the one item warranting an explicit operator/auditor accept.

*Reviewed adversarially with independent reproduction. No commit, push, tag, release, or S04 performed.*
