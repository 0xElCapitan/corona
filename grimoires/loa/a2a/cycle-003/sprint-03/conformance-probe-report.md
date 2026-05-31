# CORONA cycle-003 — Sprint S03 Substrate-Conformance Probe Report

**Artifact**: read-only substrate-conformance probe result (SDD §2.3 / sprint plan S03.5 / G-2).
**Sprint**: S03 — T1/T2 corpus construction (wired-capable).
**Date**: 2026-05-31
**Verdict**: **PASS — 0 violations** over 60 events / 5,557 series entries.

> **Framing (binding, HAZ-1 / CSG-3 / T1S-4 / T2S-5):** This probe proves the cycle-003 T1/T2 corpus
> is **wired-capable substrate shape only** — the additive series exist, are strictly time-ordered, and
> are strictly pre-cutoff. It is **NOT** a sensitivity test, **NOT** a calibration result, and proves
> **no** T1/T2 runtime wiring. Per SDD §2 / OQ-2, corpus shape alone does not unlock T1/T2 evidence
> updates: `t1-replay.js`/`t2-replay.js` never call `processX`, and `deriveEvidenceT1/T2` return
> `pre_cutoff: []` unconditionally — so the existing loader **ignores** these series. Surfacing them is
> the deferred Layer-A/B change (HS-2 / OQ-9), out of cycle-003 scope.

---

## 1. What the probe does (and does not do)

The probe is **read-only** and uses only the **existing, unmodified** loader:

1. `loadCorpus(corpus-cycle-003/, {theatres:['T1','T2']})` — the frozen `scripts/corona-backtest/ingestors/corpus-loader.js` `loadCorpus` export, selected onto the cycle-003 tree via the `CORONA_CORPUS_DIR` seam. No loader edit.
2. For each loaded event, derives the cutoff with the **existing** `deriveCutoffT1` / `deriveCutoffT2` rules (re-exported as `_CUTOFF_DERIVATIONS`):
   - **T1**: `cutoff = flare_peak_time − 1 ms` (`flare_peak_minus_epsilon`).
   - **T2**: `cutoff = kp_window_end` (`first_threshold_crossing_or_window_end`).
3. Asserts, for every series entry (`xray_flux_observations[]` / `kp_observations[]`):
   - **strictly pre-cutoff**: `entry.time_ms < cutoff.time_ms` (T1S-1 / T2S-1; HARD, HS-7).
   - **strictly time-ordered ascending** (T1S-3 / T2S-4).
   - **no settlement label key** present in any series entry (T1S-2 / T2S-3 / FR-C6-4): none of
     `flare_class_observed, flare_peak_time, flare_peak_xray_flux, flare_end_time` (T1) or
     `kp_swpc_observed, kp_gfz_observed` (T2) appears inside a series entry.

It **does NOT** call `processFlareClassGate` / `processGeomagneticStormGate`, does **NOT** build a
trajectory, does **NOT** score or compute any Brier value (CSG-3 / CSG-4 / S03 DO-NOT list). The probe
script is **ephemeral** (run from a temp path outside the repo; not committed) per operator direction;
this report is the durable artifact.

## 2. Result

```
=== loader stats (existing corpus-loader.js loadCorpus, no edit) ===
  T1: loaded=30 rejected=0
  T2: loaded=30 rejected=0
  T1: 30 events w/ series, 5197 entries, min(cutoff − last-entry) margin = 59.999s
  T2: 30 events w/ series,  360 entries, min(cutoff − last-entry) margin = 21600s (6h)

=== CONFORMANCE: 0 violation(s); 60 events with series; 5557 total entries ===
```

| Theatre | Events | Series field | Entries | Loader rejects | Strict-pre-cutoff | Strict-ordered | Settlement-key leak | Min margin |
|---------|-------:|--------------|--------:|---------------:|:-----------------:|:--------------:|:-------------------:|-----------:|
| T1 | 30 | `xray_flux_observations[]` | 5,197 | 0 | ✅ all | ✅ all | ✅ none | 59.999 s |
| T2 | 30 | `kp_observations[]` | 360 | 0 | ✅ all | ✅ all | ✅ none | 6 h |
| **Total** | **60** | — | **5,557** | **0** | **✅** | **✅** | **✅** | — |

- **T1 min margin 59.999 s**: the closest pre-cutoff sample sits exactly one 1-min step before the GOES
  flux peak (`cutoff = peak − 1 ms`, last admitted sample at `peak − 60 s`). The peak minute itself is
  excluded — the rising limb is captured, the peak (settlement) is not (leakage-free by construction).
- **T2 min margin 6 h**: each `kp_observations[]` lead-in ends at the 3-hr interval strictly before
  `kp_window_start`; the peak interval `[window_start, window_end)` (settlement) is excluded.

## 3. Interpretation

The 60 cycle-003 T1/T2 events load through the **unmodified** frozen loader (0 rejects — the additive
series keys are tolerated, composed onto `{...body,_derived,_file}`), and every one of the 5,557 series
entries is strictly pre-cutoff and strictly time-ordered with no settlement leak. The corpus therefore
carries the leakage-free, strictly-pre-cutoff series shape that a **future** Layer-A/B change would read
to feed `processX` — i.e. it is **wired-capable**. Cycle-003 ships that shape and **only** that shape;
it asserts no sensitivity, no calibration change, and no rung.
