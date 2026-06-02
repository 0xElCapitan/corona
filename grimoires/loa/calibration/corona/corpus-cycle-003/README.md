# corona/corpus-cycle-003/

**Cycle-003 expanded-corpus namespace — SKELETON (Sprint S02).**

A NEW sibling corpus root, distinct from the frozen cycle-001 `corpus/` tree. Created by
CORONA cycle-003 Sprint S02 (*Corpus Namespace + Schema Skeleton*). This sprint stands up the
directory tree, pins the additive T1/T2 pre-cutoff series field names, and lays down the
additive-manifest + `corpus_hash` machinery — **touching zero frozen files and creating zero
corpus event records.**

> **Binding scope statement (S02):** *S02 proves skeleton shape and loader tolerance only. It
> does not create corpus events, does not prove T1/T2 runtime wiring, and does not advance any
> rung.*

> **S03 population (2026-05-31) — wired-capable shape only.** Sprint S03 populated `primary/T1-flare-class/`
> with **30 real flare records** (each carrying `xray_flux_observations[]`, NOAA NCEI GOES-R XRS 1-min
> 1–8 Å, strictly pre-`flare_peak_time − 1 ms`) and `primary/T2-geomag-storm/` with **30 real storm
> records** (each carrying `kp_observations[]`, GFZ Potsdam **definitive** per-3hr Kp, strictly pre-`kp_window_end`).
> A read-only conformance probe over all 60 events via the **unmodified** loader returns **0 leakage
> violations** (5,557 series entries). T1 settlement (peak time/flux/class) is derived from the GOES XRS
> argmax (SDD §4.3) for leakage-correct cutoffs; T1 is restricted to **≥2020** so the GOES-R true XRS
> scale equals the canonical NOAA class. The top-level `corpus_hash` was **PENDING at S03** (corpus then incomplete; finalized in S06 — see the S06 note below:
> T4 = S04, held-out seal = S05, final hash = S06); per-file canonical-JSON SHA-256 entries are in the
> manifest. **S03 proves leakage-free pre-cutoff *shape* only — NOT T1/T2 runtime wiring, sensitivity,
> calibration improvement, or any rung** (the loader still ignores these series at `evidence.pre_cutoff`;
> SDD §2 / HS-2 / OQ-9). See [`../../../a2a/cycle-003/sprint-03/implementation-report.md`](../../../a2a/cycle-003/sprint-03/implementation-report.md).

> **S06 closeout (2026-06-01) — FINAL; supersedes any "PENDING" / "S04 populated / unblocked" wording elsewhere in this file.**
> Cycle-003 is finalized as a **corpus-shape / data-substrate cycle**: **no new rung, no theatre rung advanced**, published version **v0.2.0** unchanged. **Final `corpus_hash` = `7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003`** (`7b6c5b48...d5003`), computed over the **60 primary T1/T2 files only** (T4 = 0) by `reporting/hash-utils.js` `computeCorpusHash` over **LF / committed-blob** content, and **validated by reproducing the frozen cycle-001 `b1caef3f...11bb1` exactly** (the on-disk-CRLF value `54af7c63...06a8c` is a non-canonical Windows checkout artifact, not the corpus_hash).
> **T4 is BLOCKED-PARTIAL** (S04, Option B 2026-05-31): supply-characterized-only (GOES-R-era S1+ = 46), **0 records**, cascade-bucket distribution **BLOCKED**, deferred to future gated work (liftable-but-unbuilt). The S05 held-out seal `f7a851...d4c2a5ea` is preserved (T1 21/9, T2 21/9, T4 0; `heldout-split.json` untouched).
> Full provenance: [`../../../a2a/cycle-003/sprint-06/hash-provenance.md`](../../../a2a/cycle-003/sprint-06/hash-provenance.md) + [`CLOSEOUT.md`](../../../a2a/cycle-003/sprint-06/CLOSEOUT.md). Cycle-003 claims **no** calibration improvement, T1/T2 runtime sensitivity/wiring, forecasting accuracy, predictive uplift, L2 readiness, or release.

---

## Cycle posture (carried forward, unweakened)

Cycle-002 closed at **Rung 2 (runtime-sensitive, T4 only)**; published version **v0.2.0**; binding
honest-framing posture **"calibration-attempted, not improved."**

Cycle-003 is a **corpus-shape / data-substrate cycle**. It earns **no new rung** and advances
**no theatre's rung** (PRD §9, SDD §1; OQ-8). It is **NOT** a refit cycle, **NOT** a
calibration-improvement cycle, **NOT** an L2 publish-ready cycle, **NOT** a release. The SDD §2
Layer-A/B replay+loader change (`t1-replay.js` / `t2-replay.js` / `corpus-loader.js`) is **out of
scope (HS-2)**, deferred to a future separately-gated cycle (OQ-9).

---

## Isolation from the frozen corpus (CN-1, binding)

This tree is a **sibling** of — never a subtree of, nor a wrapper around — the frozen cycle-001
corpus:

| | Frozen (cycle-001) | This namespace (cycle-003) |
|---|---|---|
| Root | `grimoires/loa/calibration/corona/corpus/` | `grimoires/loa/calibration/corona/corpus-cycle-003/` |
| `corpus_hash` | `b1caef3f…11bb1` (frozen, byte-immutable) | **distinct, FINAL `7b6c5b48...d5003`** (S06; never equated to `b1caef3f…`) |
| Manifest | `calibration-manifest.json` (sha256 `e53a40d1…`) | `corpus-cycle-003-manifest.json` (additive, self-contained) |
| Selected by | default `CORPUS_DIR_DEFAULT` | `CORONA_CORPUS_DIR` seam (`config.js` `resolveCorpusDir`) — the existing loader runs against this root unchanged via the env var |

**CN-1:** the frozen `corpus/` tree, `calibration-manifest.json`, and `corpus_hash b1caef3f…11bb1`
are byte-immutable; cycle-003 never opens them for write (NG-5, HS-3). **CN-3:** this manifest is
additive and self-contained — it lives only here, references only cycle-003 files, and does not
wrap the frozen manifests (mirrors the cycle-002 additive precedent).

---

## Layout

```
corpus-cycle-003/
├── README.md                          # this file (provenance + verification ledger + claim boundary)
├── corpus-cycle-003-manifest.json     # additive manifest (reconciled S06); corpus_hash FINAL 7b6c5b48...d5003; 60 entries
├── schema/
│   ├── xray-flux-observations.schema.json   # T1 additive series entry sub-schema (OQ-1)
│   └── kp-observations.schema.json          # T2 additive series entry sub-schema (OQ-1)
├── primary/
│   ├── T1-flare-class/        (empty in S02 → populated S03; + xray_flux_observations[])
│   ├── T2-geomag-storm/       (empty in S02 → populated S03; + kp_observations[])
│   └── T4-proton-cascade/     (empty in S02 → S04 BLOCKED-PARTIAL: 0 records; deferred to future gated work)
└── secondary/                 (EMPTY; pre-2017 secondary-tier is operator-gated, default OFF)
```

- **T3-cme-arrival / T5-solar-wind-divergence subdirs are ABSENT by default** (OQ-6 default OFF;
  T3/T5 are diagnostic-only and excluded from any uplift target — OBJ-T3-1/T5-1, HAZ-4, CSG-7).
- **`heldout-split.json` is NOT created in S02.** The frozen, leakage-free train/held-out split is
  declared, frozen, and sealed in **S05** (its seal pointer is recorded in the manifest then).
- Empty leaf directories carry a `.gitkeep` so the skeleton is tracked in git; they hold no event
  records.

---

## Additive series fields (OQ-1 — pinned in S02, shape only)

Each expanded T1/T2 event will (in S03) carry a **pre-cutoff time-series** giving it the shape T4's
`proton_flux_observations[]` already has. The field names are pinned now; the data is **not**
created now.

| Theatre | Additive field | Entry sub-schema | Cutoff rule | Schema file |
|---------|----------------|------------------|-------------|-------------|
| **T1** | `xray_flux_observations[]` | `{time, long_channel_wm2, energy_channel, satellite}` | `flare_peak_time − 1 ms` (`deriveCutoffT1`) | [`schema/xray-flux-observations.schema.json`](schema/xray-flux-observations.schema.json) |
| **T2** | `kp_observations[]` | `{time, kp, index, provenance, satellite}` | `kp_window_end` (`deriveCutoffT2`) | [`schema/kp-observations.schema.json`](schema/kp-observations.schema.json) |

**These are additive annotations only.** The existing `corpus-loader.js` tolerates them
(`loadEventFile` composes `{...body, _derived, _file}` and does not reject unknown top-level keys)
and **ignores** them at the `evidence.pre_cutoff` layer: `deriveEvidenceT1` / `deriveEvidenceT2`
return `pre_cutoff: []` unconditionally (SDD §2). **Surfacing the series into `evidence.pre_cutoff`
is the deferred Layer-A/B change (HS-2 / OQ-9), out of cycle-003 scope.** Carrying the series is
**wired-capable substrate shape only** — a Rung-1/2 *prerequisite* — **not** a wired,
runtime-sensitivity, or calibration-improvement claim (HAZ-1; CSG-3/CSG-4).

**Construction-time invariants S03 MUST enforce** (documented here; not expressible as a static
JSON Schema because they reference each event's own settlement fields):

- **T1S-1 / T2S-1 (HARD):** every series entry's `time` is **strictly** before the event cutoff. A
  single at/after-cutoff sample is a settlement leak and a hard failure (HS-7 / CSG-1).
- **T1S-2 / T2S-3 (FR-C6-4):** settlement labels (`flare_class_observed`, `flare_peak_time`,
  `flare_peak_xray_flux`, `flare_end_time`; `kp_swpc_observed`, `kp_gfz_observed`) stay in the event
  body / settlement set — **never** copied into a series entry.
- **T2S-2:** GFZ ~30-day publication lag honored — events whose definitive Kp is still inside the
  lag window are regression-tier-**ineligible** (`validateT2` sets `regression_tier_eligible` only
  when `kp_gfz_observed != null`; protocol §3.6). Pre-cutoff provisional series allowed for *shape*
  only.

---

## Data-source verification ledger (carried forward from S01)

The data-source assumptions these schemas rest on were empirically verified in **Sprint S01**. The
**canonical, full ledger** is [`../../../a2a/cycle-003/sprint-01/verification-ledger.md`](../../../a2a/cycle-003/sprint-01/verification-ledger.md)
(reviewed ALL GOOD, audited APPROVED). Summary of the load-bearing figures (verified with source +
retrieval date 2026-05-28; see the ledger for evidence):

| # | Figure | Status |
|---|--------|--------|
| F1 | T1 pre-cutoff series: NOAA NCEI GOES-R XRS 1-min 1–8 Å retrievable (2017+) | ✅ verified |
| F2 | T1 label join: DONKI FLR (SWPC edited-events secondary, not pinned) | ✅ verified |
| F4 | T2 pre-cutoff series: GFZ Potsdam definitive per-3hr Kp retrievable (1932→2026) | ✅ verified |
| F5 | T2 GFZ definitive ~30-day publication lag (empirically 28 days) | ✅ verified |
| F6 | T2 SWPC provisional Kp (live tier) retrievable | ✅ verified |
| F7 | T2 label join: DONKI GST (1 sample; others demo-throttled) | ✅ verified |
| F9 | **T4 GOES-R-era (≥2017) S1+ proton-event supply count = 46** | ✅ verified (source revised) |
| F10 | T4 per-bucket `[0-1,2-3,4-6,7-10,11+]` **cascade-count** spread | ◻︎ **BLOCKED** (S04 determination, Option B; not derivable from the proton-only SEP list; deferred to future gated work) |

**T4 supply (S01, binding carry-forward).** GOES-R-era ≥2017 S1+ supply = **46**, from the current
**NOAA NCEI** "Solar Proton Events Affecting the Earth Environment" list
(`ngdc.noaa.gov`, Last-Modified 2026-01-21; last event 2026-01-18) — **not** the stale umbra/SDAC
mirror.

- Per-year: `2017:3, 2018:0, 2019:0, 2020:0, 2021:3, 2022:5, 2023:12, 2024:14, 2025:8, 2026:1` (= 46).
- **S-scale magnitude tally** (supply characterization, **NOT** the cascade buckets):
  `S1:28, S2:13, S3:4, S4:1, S5:0`.
- **The CORONA T4 buckets `[0-1, 2-3, 4-6, 7-10, 11+]` are 72h-post-M5+-trigger CASCADE-COUNT
  buckets** (calibration-protocol §4.4.2), **distinct** from the S-scale magnitude tally above.
  Computing the per-bucket cascade distribution requires an M5+-trigger ↔ S-event join and is
  **BLOCKED (S04 determination, Option B 2026-05-31): genuinely not derivable from the proton-only
  NOAA SEP list** — an honest distribution needs the full M5+ trigger population including the
  majority of M5+ flares that produce **zero** proton events (the `0-1` bucket), which a proton-only
  list cannot supply; the zero-producing denominator needs a separate full M5+ flare catalogue. **Not
  computed in cycle-003; deferred to future gated work.** (Supersedes the S02 "unblocked by the S01
  source" wording.)
- **S04 parse requirement:** the NOAA SPE table has a markup defect (the `2024-01-29` row is missing
  its `</tr>`, which an earlier `<tr>`-delimited parse made swallow the `2024-02-09` S2 row). S04
  must re-pull at construction time and parse **`</tr>`-independently**, keeping an explicit
  `pfu ≥ 10` filter (do not assume list membership ⇒ S1+).
- T1 and T2 are S01-confirmed **not supply-constrained** (XRS series for any window; abundant DONKI
  FLR; GFZ 3-hr Kp since 1932) — ~30-event/theatre targets are feasible (S03 figures, not asserted
  here).

---

## `corpus_hash` machinery (CN-2) — FINAL (S06)

> The cycle-001 *and* cycle-003 `corpus_hash` are computed by
> `scripts/corona-backtest/reporting/hash-utils.js` `computeCorpusHash` — path-sorted; per file
> `relative-path + NUL + RAW FILE BYTES + NUL` -> SHA-256 — over **LF / committed-blob** content.
> This is the validated regime that reproduces the frozen cycle-001 `b1caef3f...11bb1` exactly. It is
> **not** a canonical-JSON hashing of the corpus. The cycle-003 final value is `7b6c5b48...d5003`. The
> per-file `entries[].sha256_canonical` values are a **separate**, EOL-immune integrity hash that *do*
> use the canonical-JSON method (`scripts/corona-backtest/replay/canonical-json.js`, referenced
> read-only) — distinct from the top-level `corpus_hash` above. Reproduction:
> [`../../../a2a/cycle-003/sprint-06/hash-provenance.md`](../../../a2a/cycle-003/sprint-06/hash-provenance.md).

**CN-2 (binding):** the cycle-003 `corpus_hash` is a **distinct value over a distinct file set**. It
is **never** substituted for, nor compared against, the frozen cycle-001 `corpus_hash b1caef3f…11bb1`
as if measuring the same corpus. Any future expanded-corpus baseline computed on this corpus is a
**new regime**, never an uplift delta vs Baseline A (cycle-001) or Baseline B (cycle-002)
(HAZ-3 / CSG-2).

---

## What each sprint added (actual)

| Sprint | Added to this namespace |
|--------|------------------------|
| **S03** | T1 events (+ `xray_flux_observations[]`) and T2 events (+ `kp_observations[]`), leakage-free strictly-pre-cutoff; 60 per-file entries in the manifest; read-only §2.3 substrate-conformance probe (0 violations). |
| **S04** | **T4: 0 records (BLOCKED-PARTIAL, Option B).** Authoritative supply re-verification (GOES-R-era S1+ = 46) + S-scale characterization; cascade-bucket distribution **BLOCKED**; deferred to future gated work. No refit. |
| **S05** | `heldout-split.json` (frozen, leakage-free split + sealed assignment); seal pointer recorded in the manifest. No fit performed. |
| **S06** | `corpus_hash` finalization verification, honest-framing grep gate, frozen-invariant verification, SC-8 non-achievements, `CLOSEOUT.md`. No release. |

---

## Claim boundaries (binding on this namespace)

Cycle-003 makes, in this namespace and every cycle-003 artifact:

- **No** calibration-improved claim (CSG-4) · **No** T1/T2 runtime-sensitivity claim (CSG-3)
- **No** forecasting-accuracy claim (CSG-5) · **No** verifiable-track-record claim
- **No** cross-regime uplift comparison vs Baseline A/B (CSG-2 / HAZ-3)
- **No** L2 publish-ready claim (CSG-6) · **No** T3/T5 predictive-uplift claim (CSG-7)
- **No** release / tag / version bump (CSG-8) — published version stays **v0.2.0**.

---

*CORONA cycle-003 Sprint S02 — Corpus Namespace + Schema Skeleton. Skeleton shape + loader
tolerance only; no corpus events, no runtime wiring, no rung advance. Frozen cycle-001/cycle-002
artifacts byte-unchanged. See [`../../../a2a/cycle-003/sprint-02/implementation-report.md`](../../../a2a/cycle-003/sprint-02/implementation-report.md).*
