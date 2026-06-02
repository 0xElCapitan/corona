# CORONA cycle-003 — Sprint S06 CLOSEOUT

**Sprint**: S06 — Review / Audit / Closeout · **Branch**: `cycle-003-s06-closeout` · **Base**: `cycle-003` @ `34e7680` (S05).
**Date**: 2026-06-01.
**Cycle**: cycle-003 (cycle-002 closed at **Rung 2, T4 runtime-sensitive only**; published version **v0.2.0**).
**Binding spec set**: [PRD.md](../PRD.md) · [SDD.md](../SDD.md) · [CYCLE-003-SPRINT-PLAN.md](../CYCLE-003-SPRINT-PLAN.md) · [SPRINT-LEDGER.md](../SPRINT-LEDGER.md).

> **This closeout asserts NO calibration improvement, NO empirical performance improvement, NO forecasting accuracy, NO predictive uplift, NO verifiable track record, NO T1/T2 runtime sensitivity or wiring, NO L2 publish-readiness, NO Baseline-A/B or new-corpus uplift comparison, and NO release. Those are recorded below as deliberate non-achievements (SC-8). No fit/refit/score/Brier/runtime-replay/backtest was performed in S06; no code was edited; no T4 records were created; no tag/release/version bump; no commit or push by this artifact.**

---

## 1. Cycle outcome — corpus-shape / data-substrate only; **no new rung**

Cycle-003 completes as a **corpus-shape / data-substrate cycle**. It **earns no new rung** and **advances no theatre's rung** (PRD §9, SDD §1; OQ-8). The cycle assembled an expanded, verified, correctly-shaped historical T1/T2 corpus in an isolated namespace, characterized the T4 supply, sealed a leakage-free held-out evaluation methodology, and finalized the corpus hash — i.e. the *substrate* a future, separately-gated cycle would need. It is **NOT** a refit cycle, **NOT** a calibration-improvement cycle, **NOT** a T1/T2 runtime-sensitivity cycle, **NOT** an L2 publish-ready cycle, and **NOT** a release.

**Cycle-002's earned ceiling is preserved, unweakened:** CORONA demonstrated **T4 runtime sensitivity only** (Rung 2, T4); published version **v0.2.0**; binding honest-framing posture **"calibration-attempted, not improved."**

---

## 2. What cycle-003 built (SC-1 … SC-7 evidence walk, S01 → S06)

| Sprint | Outcome | Commit |
|--------|---------|--------|
| **S01** — Archive verification | Verified the PRD §5 data-source assumptions by bounded sanity-sample (N=5/theatre). T1 (NCEI GOES-R XRS 1-min 1–8 Å) and T2 (GFZ definitive per-3hr Kp; ~28-day lag) retrievable + label-joinable. **Answered the binding T4 supply question: GOES-R-era (≥2017) S1+ proton-event supply = `46`** (NOAA NCEI "Solar Proton Events Affecting the Earth Environment", Last-Modified 2026-01-21; S-scale tally S1:28 / S2:13 / S3:4 / S4:1 / S5:0; per-year 2017:3, 2018-2020:0, 2021:3, 2022:5, 2023:12, 2024:14, 2025:8, 2026:1). | `fdfdb99` |
| **S02** — Namespace + schema | Created the isolated sibling corpus root `corpus-cycle-003/` (selected via the existing `CORONA_CORPUS_DIR` seam; frozen `corpus/` never opened for write), pinned the additive series field names (`xray_flux_observations[]`, `kp_observations[]`), and stood up the additive manifest + `corpus_hash` machinery. Loader-tolerant; zero frozen-file touch. | `0f217a2` |
| **S03** — T1/T2 corpus | Added **30 real T1** flare records (each `xray_flux_observations[]`, NCEI GOES-R XRS, strictly pre-`flare_peak_time − 1 ms`; T1 restricted to ≥2020 for one consistent real scale) and **30 real T2** storm records (each `kp_observations[]`, GFZ **definitive** Kp, strictly pre-`kp_window_end`). Read-only §2.3 conformance probe over all 60 events via the **unmodified** loader: **0 leakage violations** (5,557 series entries). **Wired-capable shape only** (HAZ-1). | `2fd40ed` |
| **S04** — T4 expansion | Re-verified the T4 supply (`46`, `</tr>`-independent parse, 2024-02-09 row recovered). **BLOCKED-PARTIAL (Option B):** built **0** T4 records and reported the cascade-bucket distribution as **BLOCKED** (see §4). No refit; runtime params byte-unchanged. | `f8d074f` |
| **S05** — Held-out seal | Declared + **froze** a leakage-free `stratified_random_seqgrouped` train/held-out split (ratio 0.7/0.3; seed `corona-cycle-003-heldout-v1`; 120 h sequence-grouping) over the available corpus: **T1 21 train / 9 held-out, T2 21 train / 9 held-out, T4 0**. Leakage audit PASS (0 straddles, 0 partition errors, 0 series spanning both sides). **No fit performed.** Seal recorded in the manifest. | `34e7680` |
| **S06** — Closeout | Reconciled the manifest (+ corpus README) T4/hash language to S04's BLOCKED-PARTIAL truth; computed the **final corpus_hash** (§3); preserved the S05 seal; verified frozen invariants; recorded the SC-8 non-achievements. | (this branch; uncommitted) |

---

## 3. Final corpus hash + preserved held-out seal (G-1, G-4)

**Final cycle-003 `corpus_hash` (canonical, LF / committed-blob):**

```
7b6c5b4878025cbf7771bb618861002c777bed9bb5144c004a95fa86c6fd5003
```

- Computed over the **60 primary T1/T2 files only** (T4 = 0) by the existing repo utility `scripts/corona-backtest/reporting/hash-utils.js` → `computeCorpusHash` (read-only), path-sorted, per file `relative-path + NUL + RAW FILE BYTES + NUL` → SHA-256.
- **Validated** by reproducing the frozen cycle-001 `corpus_hash b1caef3f…11bb1` **exactly** (25 files) via the same utility/regime.
- Computed over **LF / committed-blob** content (this checkout is `core.autocrlf=true`, no `.gitattributes` → on-disk files are CRLF). The on-disk-CRLF value `54af7c63…06a8c` is a **non-canonical Windows checkout artifact**, not the corpus_hash.
- **CN-1 / CN-2 (binding):** this is a **distinct value over a distinct file set**; it is never equated to, nor deltaed against, the frozen cycle-001 `b1caef3f…11bb1`. Any future expanded-corpus baseline on this corpus is a **new regime**, never an uplift comparison vs Baseline A/B (HAZ-3 / CSG-2). Cycle-003 computes **no** baseline.
- Full provenance + reproduction: [`hash-provenance.md`](hash-provenance.md).

**Held-out seal preserved (S05, unchanged):**

```
f7a851362929a43c8165e0367952fdd7479e1dad8fbb2155ac3fb7e6d4c2a5ea
```

`heldout-split.json` was **not** modified in S06; assignments unchanged (T1 21/9, T2 21/9, T4 0). The seal is over `heldout-split.json`'s canonical JSON and remains consistent. (`heldout-split.json` is excluded from `corpus_hash`, so the hash and the seal are independent.)

---

## 4. T4 — BLOCKED-PARTIAL (Option B), reconciled in S06

S04 chose **Option B** (operator-confirmed 2026-05-31): T4 remains **supply-characterized-only** for cycle-003.

- **T4 supply re-verified:** GOES-R-era S1+ proton-event supply = **46**.
- **T4 records created:** **0.**
- **Cascade-bucket distribution `[0-1, 2-3, 4-6, 7-10, 11+]`:** **BLOCKED.** This is *genuinely not derivable* from the proton-only NOAA SEP list — an honest distribution requires the **full M5+ trigger population including the majority of M5+ flares that produce zero proton events** (the `0-1` bucket), which a proton-only list cannot supply; the zero-producing denominator needs a separate full M5+ flare catalogue.
- **T4 is liftable-but-unbuilt, not permanently impossible** (deferred to future gated work — §10).

**S06 manifest reconciliation:** the S02-era manifest wording that implied T4 would simply be "populated in S04" / the cascade buckets were "S04 work — unblocked by the S01 source" was **superseded** and rewritten to the BLOCKED-PARTIAL truth across `corpus_layout`, `per_theatre_targets.T4` (`cascade_buckets_note`, `parse_warning`, `populate_in`, new `t4_s04_outcome`), `entries_status`, and `authoring_note`. The corpus `README.md` was reconciled identically. (This discharges the carry-forward recorded in the S04 blocker/decision report §7 and the S05 manifest `t4_carryforward`.)

---

## 5. SC-8 — explicit non-achievements (recorded as deliberate)

Cycle-003 deliberately **does not** achieve, and **does not claim**:

1. **No calibration improvement** (no refit; no fit of any kind; thresholds / base rates / `PRODUCTIVITY_PARAMS` / σ / formulas unchanged). — CSG-4
2. **No T1/T2 runtime sensitivity** and **no T1/T2 runtime wiring** — the loader still ignores the new series at `evidence.pre_cutoff`; cycle-003 ships **wired-capable shape only**. — CSG-3 / HAZ-1
3. **No forecasting accuracy / no predictive uplift / no empirical performance improvement / no verifiable track record.** — CSG-5
4. **No L2 publish-readiness.** — CSG-6
5. **No Baseline-A vs Baseline-B (or new-corpus) uplift comparison** — distinct regimes; no baseline computed in cycle-003. — CSG-2 / HAZ-3
6. **No T3/T5 predictive-uplift claim** (diagnostic-only). — CSG-7
7. **No runtime sensitivity beyond the cycle-002 T4-only result.**
8. **No release, no tag, no `package.json` version bump** — published version stays **v0.2.0**. — CSG-8
9. **`main` not touched** during sprint implementation (remains at planning baseline `eaaf5e4`).

---

## 6. Binding honest-framing sentences (verbatim — [cycle-002 sprint-04/T3-T5-POSTURE.md §4](../../cycle-002/sprint-04/T3-T5-POSTURE.md), via [cycle-002 CLOSEOUT §6](../../cycle-002/sprint-06/CLOSEOUT.md))

The following four sentences are reproduced **verbatim** and may not be weakened:

> T3 [external-model] is not counted toward CORONA-owned predictive uplift.

> T5 [quality-of-behavior] is not counted toward CORONA-owned predictive uplift.

> Cycle-002 runtime-uplift claims are restricted to T1/T2/T4, with T4 as the clean owned-uplift theatre.

> T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape and cannot claim calibration improvement in cycle-002.

T3 and T5 remain diagnostic-only and are excluded from every uplift-bearing target (OBJ-T3-1/T5-1, HAZ-4, CSG-7). The cycle-001 **"calibration-attempted, not improved"** posture stands, unweakened.

---

## 7. Mandatory audit notes

> RLMF certificate format (`src/rlmf/certificates.js` `version: '0.1.0'`) unchanged in cycle-003.

> Cycle-001 calibration manifest `corpus_hash = b1caef3f…11bb1` and `script_hash = 17f6380b…1730f1` unchanged across cycle-003. The cycle-003 `corpus_hash 7b6c5b48…d5003` is a distinct value over a distinct file set and is never substituted for the frozen cycle-001 hash.

---

## 8. Forbidden claims — explicit negations (cycle-003 does NOT make these)

- Cycle-003 makes **no calibration-improved claim** (no fit/refit performed).
- Cycle-003 makes **no T1/T2 runtime-sensitivity claim** and **no T1/T2 runtime-wiring claim** (corpus-shape-only; loader unchanged).
- Cycle-003 makes **no forecasting-accuracy claim** and **no empirical-performance-improvement claim**.
- Cycle-003 makes **no predictive-uplift claim** and **no verifiable-track-record claim**.
- Cycle-003 makes **no L2 publish-ready claim**.
- Cycle-003 makes **no Baseline-A vs Baseline-B uplift comparison** and **no new-corpus uplift-vs-old-baseline comparison** (cross-regime comparison is meaningless; CSG-2 / HAZ-3).
- Cycle-003 makes **no T3/T5 predictive-uplift claim**.
- Cycle-003 performs **no release / tag / version bump** (published version stays **v0.2.0**; CSG-8).

No cycle-001 / cycle-002 closeout language, manifest, run output, README, or BUTTERFREEZONE text was altered by cycle-003.

---

## 9. Frozen-invariant verification (at S06; committed-blob sha256)

| Invariant | Expected | Result |
|---|---|---|
| `scripts/corona-backtest.js` (committed-blob sha256) | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` | ✅ MATCH |
| cycle-001 `calibration-manifest.json` (committed-blob sha256) | `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a` | ✅ MATCH |
| cycle-001 `corpus_hash` (in committed manifest + `run-3-final/corpus_hash.txt`) | `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` | ✅ present + reproduced |
| `src/rlmf/certificates.js` `version` | `0.1.0` | ✅ `0.1.0` |
| `package.json` `version` | `0.2.0` | ✅ `0.2.0` (no bump) |
| cycle-002 `runtime-replay-manifest.json` | byte-frozen | ✅ untouched |
| Frozen cycle-001 corpus tree `corpus/` | byte-immutable | ✅ untouched (hashed read-only as the validation control) |
| Annotated tag | none | ✅ none created |

> EOL note: the canonical check hashes the **committed git blob** (LF), not on-disk bytes (CRLF on this `core.autocrlf=true` checkout). This is a Windows checkout artifact, not content drift.

---

## 10. Future work (out of cycle-003 scope; future separately-gated cycle)

**T4 (deferred; liftable-but-unbuilt).** S04's deeper "is it really blocked?" analysis (recorded in [sprint-04/blocker-decision-report.md](../sprint-04/blocker-decision-report.md) §2a / §5 / §6 — the S04.5-style research) found T4 record-construction to be a **scope/authorization stop**, not impossibility, and was **not inserted as new construction before S05**. To lift it in a future gated cycle:

- **T4 records:** authorize a bounded fetch of the **raw GOES `>=10 MeV` integral-proton flux time-series** (GOES-16/18 SEISS; GOES-13/15 EPS for 2017) and pin an explicit **M5+ trigger-window construction** rule, then build frozen-shape records (recommended bias-free first step: the Option A′ proof-of-source sanity-sample over the 5 existing frozen records).
- **T4 cascade buckets:** additionally requires the **full GOES-R-era M5+ trigger population including zero-producing windows** via a separate flare catalogue (DONKI FLR / NCEI XRS) — not derivable from the proton-only SEP list.

**Layer A / Layer B (T1/T2 runtime evidence — HS-2 / OQ-9).** Corpus shape alone does **not** unlock T1/T2 runtime evidence updates. Two additive code layers, both **out of cycle-003 scope**, would be required first:

- **Layer A (replay):** `t1-replay.js` / `t2-replay.js` must call the process functions (`processFlareClassGate` / `processGeomagneticStormGate`).
- **Layer B (loader):** `corpus-loader.js` must derive `evidence.pre_cutoff` from the new series fields (`deriveEvidenceT1` / `deriveEvidenceT2` currently return `pre_cutoff: []`).

**Calibration / refit.** Any future calibration or refit attempt belongs to a **later, separately-gated cycle**, performed **after** (and against) the frozen S05 held-out methodology — never by fitting on the held-out set.

---

## 11. Cycle-003 closeout status

Cycle-003 closes as a **corpus-shape / data-substrate cycle**: an isolated expanded T1/T2 corpus (60 records), a characterized-but-unbuilt T4 supply (BLOCKED-PARTIAL), a sealed leakage-free held-out methodology, and a finalized, validated `corpus_hash`. **That is the full extent of what cycle-003 produced.**

- **No new rung; no theatre rung advanced.** Cycle-002 ceiling preserved (Rung 2, T4 runtime-sensitive only).
- **Published version remains `v0.2.0`.** No tag, no version bump, no release.
- **`main` untouched** (remains at `eaaf5e4`); all S06 work is on `cycle-003-s06-closeout`.
- **This is a docs/manifest-only closeout artifact.** `/review-sprint sprint-S06` → `/audit-sprint sprint-S06` → `COMPLETED` → operator commit/merge are subsequent operator-gated steps, **not** performed here. No commit, tag, or release performed by this artifact.

---

*CORONA cycle-003 Sprint S06 closeout authored 2026-06-01. Outcome: corpus-shape / data-substrate substrate only; no new rung. Final cycle-003 `corpus_hash 7b6c5b48…d5003` (validated vs cycle-001 `b1caef3f…11bb1`). Held-out seal `f7a851…d4c2a5ea` preserved. Frozen invariants verified intact. Cycle-002 ceiling — "CORONA demonstrated T4 runtime sensitivity only," v0.2.0 — preserved unweakened. No calibration improvement, T1/T2 runtime sensitivity/wiring, forecasting accuracy, predictive uplift, L2 readiness, Baseline-A/B or new-corpus uplift, release, tag, or version bump. No commit or push by this artifact.*
