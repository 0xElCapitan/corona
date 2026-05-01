# Run 1 → Run 2 Per-Theatre Delta Report

**Sprint 5 / `corona-33u` deliverable**
**Authored**: 2026-05-01 (Sprint 5 Run 2 close)
**Run 1**: 2026-05-01T04:21:35Z (Sprint 3 baseline, code revision `7e8b52e`)
**Run 2**: 2026-05-01T14:50:21Z (Sprint 5 post-refit, code revision `edd816f`)
**Corpus hash invariant**: `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` ✓ (unchanged)
**Script hash invariant**: `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` ✓ (unchanged — entrypoint not modified)

---

## Headline result

**Run 2 produces numerically IDENTICAL Brier/MAE/FP-rate/p50/switch-handled values to Run 1 for every theatre.** The composite verdict is `fail` in both runs, decomposed identically: T1 fail, T2 pass, T3 fail, T4 fail, T5 fail.

This is the **expected** outcome of Sprint 5 given:
1. Sprint 5 made **no runtime parameter refits** (NOTES.md S5-1: evidence-driven NO-CHANGE decision per Sprint 4 evidence + Run 1 architectural reality).
2. The Sprint 3 backtest harness uses `UNIFORM_PRIOR` baselines for T1, T2, T4 scoring; T3 reads `wsa_enlil_predicted_arrival_time` from the corpus directly; T5 FP rate is `corpus_fp_label`-anchored. **None of these scoring paths consume runtime parameter constants** ([scripts/corona-backtest.js:148](../../../../scripts/corona-backtest.js#L148) calls `score(events[theatre])` without `options.predictedDistribution`).
3. The corpus is frozen at Sprint 3 (`corpus_hash` invariant); no events added, removed, or modified.
4. The harness entrypoint, scoring modules, ingestors, and reporting modules are unchanged (`script_hash` invariant).

The diff between `run-1/` and `run-2/` certificates contains exactly three metadata changes per per-theatre report: `run_id` (run-1→run-2), `Generated` timestamp, and `code_revision` (`7e8b52e`→`edd816f`). All numerical values and verdicts are bit-identical.

---

## Per-theatre comparison

### T1 — Flare Class Gate (bucket-Brier)

| Metric | Run 1 | Run 2 | Δ |
|--------|-------|-------|---|
| Brier | 0.1389 | 0.1389 | 0.0000 |
| Min bucket calibration | 0.000 | 0.000 | 0.000 |
| Bucket calibration vector | [0,0,0,0.8,0,0] | [0,0,0,0.8,0,0] | identical |
| Predicted distribution | uniform [1/6]×6 | uniform [1/6]×6 | identical |
| n_events | 5 | 5 | 0 |
| Verdict (§6) | **fail** | **fail** | unchanged |

**Why no change**: Sprint 5 did not refit any T1 runtime parameter. The Run 1 baseline used `uniform_prior_run_1` per `t1-bucket-brier.js:32` (`UNIFORM_PRIOR = T1_BUCKETS.map(() => 1 / T1_BUCKET_COUNT)`). Sprint 5 Run 2 uses the same uniform prior because the entrypoint at `corona-backtest.js:148` does not pass `options.predictedDistribution`. The runtime `flareThresholdProbability` (`uncertainty.js:102-114`) and `FLARE_UNCERTAINTY` constants (`uncertainty.js:33-49`) are NOT exercised by the backtest harness — they are part of the live theatre's evidence ingestion path, not the scoring layer.

**Verdict change attribution**: NONE. The fail verdict in both runs reflects the no-model-floor calibration: 5 corpus events all observed in bucket 3 (X1-X4) means buckets 0,1,2,4,5 have observed_count=0, weighted_predicted=5/6×5=4.17 → ratio=0 → calibration=0 → min calibration=0 < 0.85 pass threshold. **This is not a Sprint 5 refit issue; it is a corpus characteristic** — refitting T1 runtime parameters would not change the bucket distribution of observed events.

**Refit investigation** (NOTES.md S5-1): Run 1 corpus has 5 T1 events all post-event (status='complete'); no in-progress events. The 0.4 in-progress doubt floor cannot be refit against zero in-progress observations. The 0.1 complete-event doubt floor is supported by Sprint 4 §4.2 Veronig 2002 evidence (sub-1% reclassification of completed flares); Run 1 calibration would not be sensitive to ±0.05 adjustments since all events are at the same status. **No Sprint 5 T1 refit motivated.**

### T2 — Geomagnetic Storm Gate (bucket-Brier + GFZ↔SWPC convergence)

| Metric | Run 1 | Run 2 | Δ |
|--------|-------|-------|---|
| Brier | 0.1389 | 0.1389 | 0.0000 |
| GFZ↔SWPC convergence | 0.9627 | 0.9627 | 0.0000 |
| Predicted distribution | uniform [1/6]×6 | uniform [1/6]×6 | identical |
| n_events (regression-tier) | 5 | 5 | 0 |
| n_events_excluded_gfz_lag | 0 | 0 | 0 |
| Verdict (§6) | **pass** | **pass** | unchanged |

**Why no change**: Same uniform-prior baseline as T1; runtime `kpThresholdProbability` (`uncertainty.js:164-170`) is not exercised. T2 passes both runs because `convergence` is the secondary metric and the GFZ-vs-SWPC delta is well-calibrated against the corpus (5 events with both `kp_gfz` and `kp_swpc` populated; mean delta ≈ 0.34 Kp units). Brier 0.1389 is at the boundary of pass (≤0.15) so the verdict stands.

**Refit investigation**: Sprint 4 §4.5 documents GFZ definitive σ=0.33 and SWPC preliminary σ=0.67 (`uncertainty.js:134`). Run 1 GFZ-vs-SWPC convergence 0.963 supports the scale separation. Sprint 5 considered backtest-deriving σ from the 5 T2 events but defers per Sprint 4 §4.5 entry-006 promotion path (corpus extension to 15+ events recommended for stable σ estimate). **No Sprint 5 T2 refit motivated.**

### T3 — CME Arrival (timing error MAE + ±6h hit rate)

| Metric | Run 1 | Run 2 | Δ |
|--------|-------|-------|---|
| MAE (hours) | 6.760 | 6.760 | 0.000 |
| Within ±6h hit rate | 0.400 (40%) | 0.400 (40%) | 0.000 |
| Glancing-blow within ±12h hit rate | 1.000 (1/1) | 1.000 (1/1) | 0.000 |
| Mean z-score | 0.538 | 0.538 | 0.000 |
| n_events | 5 | 5 | 0 |
| n_glancing_blow_events | 1 | 1 | 0 |
| Verdict (§6) | **fail** | **fail** | unchanged |

**Why no change**: T3 reads `wsa_enlil_predicted_arrival_time` and `observed_l1_shock_time` directly from the corpus events (per `calibration-protocol.md` §4.3.5). The runtime `buildCMEArrivalUncertainty` (`uncertainty.js:186-217`) is not exercised by the harness — it is part of the live CORONA processor's CME-arrival ingestion path, not the offline scoring layer. The MAE = mean(|t_predicted - t_observed|) is determined entirely by corpus values; Sprint 5 runtime constant changes would have no effect.

**Verdict attribution**: T3 fails because:
- MAE = 6.76 h > 6 h pass threshold (T3 marginal allows ≤9 h: marginal would be triggered if MAE were lower — 6.76 h is in the pass-fail zone but the hit-rate gate also fails)
- Within-±6h hit rate = 40% < 65% pass threshold (and < 50% marginal threshold, which makes the verdict fail rather than marginal)

The 6.76h MAE is dominated by one outlier: T3-2022-01-29-CME001 with error = 16.0 h. Excluding that event would yield MAE ≈ 4.5 h with 4/4 = 100% hit rate. But excluding events would be hidden filtering (Sprint 5 review focus #5 violation); the harness scores every primary-corpus event without exception per `calibration-protocol.md` §4.3.5.

**Refit investigation**: Sprint 4 §3 documents WSA-Enlil sigma 10-18 h literature range; the runtime `T3_NULL_SIGMA_PLACEHOLDER_HOURS = 14` h (`corpus-loader.js:174`) is the midpoint. Run 1 mean z-score 0.538 indicates the 14 h sigma is **wider** than the actual error distribution — suggesting potential refit toward 10 h (MAE-anchored). However:
- The 14 h placeholder is only used as a supplementary diagnostic for `z_score`, not in the pass/marginal/fail composite (per `calibration-protocol.md` §4.3.3).
- Run 1 corpus T3 events have heterogeneous `wsa_enlil_sigma_hours` (4 events with corpus-supplied sigma values, 1 event using the 14 h placeholder for null sigma).
- Refitting the placeholder would not change the per-event MAE or hit-rate (which use corpus-supplied predicted vs observed times directly).

**No Sprint 5 T3 refit motivated.**

### T4 — Proton Event Cascade (bucket-Brier on S-event count)

| Metric | Run 1 | Run 2 | Δ |
|--------|-------|-------|---|
| Brier | 0.1600 | 0.1600 | 0.0000 |
| Bucket distribution (observed) | [0.2, 0.4, 0.4, 0, 0] | [0.2, 0.4, 0.4, 0, 0] | identical |
| Min bucket calibration | 0.000 | 0.000 | 0.000 |
| Predicted distribution | uniform [1/5]×5 | uniform [1/5]×5 | identical |
| n_events | 5 | 5 | 0 |
| Verdict (§6) | **fail** | **fail** | unchanged |

**Why no change**: Same uniform-prior baseline. The runtime `PRODUCTIVITY_PARAMS` (`proton-cascade.js:101-105`) and `estimateExpectedCount` / `countToBucketProbabilities` are not exercised by the harness — they are part of the live theatre's `createProtonEventCascade` initialization.

**Verdict attribution**: T4 fails because min bucket calibration = 0 (buckets 3 + 4 had 0 observed events, so observed-vs-predicted ratio is 0). Brier 0.1600 ≤ 0.20 pass threshold, but the calibration gate requires ≥0.75 — the corpus is too small for any one bucket to escape the floor.

**Refit investigation**: Sprint 4 §5 + §9 document Wheatland λ + decay parameters. Run 1 T4 corpus has 4 X-class triggers + 1 M-class trigger; bucket distribution 1/2/2/0/0 (skewed toward low-count outcomes). The §4.4.2 re-balance license requires 3+ events per bucket — current distribution does not meet this. The settlement-critical engineering-estimated `wheatland_decay_m_class = 0.90` has only 1 M-class trigger (insufficient sample). **Sprint 5 T4 refit deferred per Sprint 4 §9 promotion paths; corpus extension required.**

### T5 — Solar Wind Divergence (FP rate + stale-feed latency + switch-handled)

| Metric | Run 1 | Run 2 | Δ |
|--------|-------|-------|---|
| FP rate | 0.250 (25%) | 0.250 (25%) | 0.000 |
| Stale-feed p50 (s) | 90.0 | 90.0 | 0.0 |
| Stale-feed p95 (s) | 130.5 | 130.5 | 0.0 |
| Switch-handled rate | 1.000 (100%) | 1.000 (100%) | 0.000 |
| Hit rate diagnostic | 1.000 | 1.000 | 0.000 |
| n_signals | 8 | 8 | 0 |
| n_stale_events | 3 | 3 | 0 |
| n_switches | 2 | 2 | 0 |
| Verdict (§6) | **fail** | **fail** | unchanged |

**Why no change**: T5 scoring computes FP rate from `corpus_fp_label` annotations on each `divergence_signals[]` array element (per `calibration-protocol.md` §3.7.6). The runtime `bz_divergence_threshold = 5 nT` and `sustained_minutes = 30` (`solar-wind-divergence.js:34-35`) drive **live** theatre processing of raw DSCOVR/ACE bz_gsm streams — the offline backtest does NOT run live processing; it scores against pre-annotated corpus signals. **Increasing the bz threshold from 5 nT to (say) 7 nT would not change Run 2 numerics** because the harness does not consume the threshold.

**Verdict attribution**: T5 fails because FP rate = 25% > 15% marginal threshold. The 2 false-positive signals are corpus-annotated (corpus_fp_label=true at T5-2017-09-07-window 05:30:00Z and T5-2023-04-23-window 20:18:00Z). The corpus window has 8 total divergence signals; 2 are annotated false positives → FP rate = 2/8 = 25%.

**Refit investigation**: Sprint 4 §6 documents the 5 nT / 30-min thresholds. Run 1 T5 FP=25% suggests the threshold may be too sensitive in PRODUCTION operation, but the **offline backtest does not exercise this threshold**. Sprint 5 considered backtest-deriving the threshold from corpus FP rates but the architecture would not let the refit affect Run 2 scores. Sprint 7 (or future cycles) may extend the harness to consume runtime threshold + reprocess raw signal data; that is harness extension territory, not Sprint 5 refit. **No Sprint 5 T5 refit motivated.**

---

## Sprint 2 threshold non-modification

**Sprint 5 did not exercise the calibration-protocol.md §6.2 re-baseline license.** The pass/marginal/fail thresholds in `scripts/corona-backtest/config.js:66-87` are unchanged from Sprint 2 freeze:

```js
T1: pass {brier_max: 0.15, calibration_min: 0.85} marginal {brier_max: 0.20, calibration_min: 0.75}
T2: pass {brier_max: 0.15, convergence_min: 0.85} marginal {brier_max: 0.20, convergence_min: 0.75}
T3: pass {mae_hours_max: 6, hit_rate_min: 0.65} marginal {mae_hours_max: 9, hit_rate_min: 0.50}
T4: pass {brier_max: 0.20, calibration_min: 0.75} marginal {brier_max: 0.25, calibration_min: 0.65}
T5: pass {fp_rate_max: 0.10, stale_p50_max_seconds: 120, switch_handled_min: 0.95}
    marginal {fp_rate_max: 0.15, stale_p50_max_seconds: 300, switch_handled_min: 0.90}
```

**Why not re-baseline**: changing thresholds to make a verdict pass without underlying improvement would be the failure mode Sprint 5 review focus #4 calls out: "Run 2 improvements are real and not caused by cheating/scoring changes." Sprint 5's evidence-driven analysis finds no parameter refit that would improve the underlying numerics; therefore re-baselining thresholds to mask the architectural reality (uniform-prior baselines + small-corpus bucket-calibration floor) would mask, not fix, the gaps.

The Sprint 2 thresholds remain the binding floor. Future cycles (corpus extension, harness wiring of runtime predictions into scoring) may re-baseline if/when corpus reality + runtime reality both warrant.

---

## Architectural reality and Sprint 7 forward-looking obligations

### Why uniform-prior baselines are correct for Sprint 3 (not a bug)

Sprint 3 (`corona-d4u`) chose uniform-prior baselines for T1, T2, T4 deliberately. The choice gives a **no-model floor** against which the runtime's ability to beat the floor can be measured. A run that scores better than `Brier ≈ 0.139` on T1 demonstrates the runtime's flare-class predictor adds value over chance; a run that scores worse demonstrates the runtime is doing harm. Run 1 measured the floor; Run 2 (with no parameter or scoring change) reproduces the floor.

### Sprint 7 / future-cycle path to numerically-sensitive runs

To make `Run N` (post-Sprint-5) numerically diverge from the Run 1 baseline based on parameter changes, Sprint 7 (or a future cycle) needs to:

1. **Wire runtime predictions into the scoring entrypoint**. Modify `scripts/corona-backtest.js:148` to invoke runtime processors per corpus event:
   ```js
   const runtimeForecast = (event) => {
     // For T1: invoke flare-gate.js create + processFlareClassGate against corpus pre-event evidence,
     // extract predicted distribution over T1 buckets at theatre opening.
     // For T2: similar with geomag-gate.js.
     // For T4: similar with proton-cascade.js Wheatland prior at trigger.
     ...
   };
   aggregates[theatre] = score(events[theatre], { predictedDistribution: runtimeForecast(event) });
   ```
2. **Extend T5 to consume runtime threshold**. Modify the harness to optionally re-process raw DSCOVR/ACE Bz time-series from corpus events through `processSolarWindDivergence`, comparing the runtime's signal-detection FP rate against the corpus-annotated FP labels. (T5 corpus events would need a new `bz_time_series` field; this is corpus extension + harness extension.)

Both extensions are **non-trivial harness additions** that would shift the Run 1 baseline. They are explicitly out of Sprint 5 scope per the operator brief ("Do not change Sprint 3 scoring semantics"). Sprint 7 / `corona-1ml` final-validate or a follow-up cycle owns this work.

### What Sprint 5 actually delivered

While Run 2 numerics match Run 1, Sprint 5 produced substantive deliverables:

1. **`calibration-manifest.json` populated** — 30 entries (corona-evidence-001 through corona-evidence-029) with full PRD §7 provenance + Sprint 4 §1.1 verification taxonomy + SDD §7.3 inline_lookup. This is the source of truth for parameter provenance per PRD §7.
2. **Manifest structural test** (`tests/manifest_structural_test.js`) — 22 tests enforcing the §1.1 taxonomy invariants, including the Sprint 4 audit Round 1 lesson (CR-1, CR-2: no silent over-promotion of ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY values).
3. **Manifest regression gate** (`tests/manifest_regression_test.js`) — 29 tests enforcing inline-equals-manifest per SDD §7.3, including 24 per-entry tests for clear drift attribution. The gate runs as part of `node --test` and cannot be bypassed with `--no-verify`.
4. **Run 2 reproducibility certificate** — confirms corpus + harness + runtime constants are all unchanged (corpus_hash + script_hash invariant).
5. **This delta report** — explicitly attributes Run 2 = Run 1 numerics to architectural reality, not parameter cheating.

These deliverables satisfy **GC.4** (calibration manifest committed with full provenance) and **GC.5** (regression gate prevents un-blessed parameter drift) per `sprint.md` Sprint 5 acceptance criteria.

---

## Sprint 5 review focus area cross-reference

Per Sprint 5 handoff §10 + sprint command brief:

| # | Review focus | Sprint 5 outcome |
|---|--------------|-------------------|
| 1 | Manifest entries match empirical-evidence verification status | ✓ All 30 entries tagged per Sprint 4 §1.1 taxonomy; Round 3 fixes for evidence-006 + evidence-020 honored verbatim. |
| 2 | No uncertain evidence upgraded without justification | ✓ 0 entries promoted to `VERIFIED_FROM_SOURCE` except corona-evidence-019 (z=1.96 — textbook claim, no DOI verification needed). All other entries remain provisional pending DOI verification per their `promotion_path`. |
| 3 | Inline constants and manifest values cannot drift | ✓ `manifest_regression_test.js` enforces inline-equals-manifest at 29 test entries; per-entry tests provide clear drift attribution. The structural test also asserts `inline_lookup` validity. |
| 4 | Run 2 improvements are real and not caused by cheating | ✓ NO improvements claimed. Run 2 numerics IDENTICAL to Run 1. Delta report documents the architectural reason explicitly (uniform-prior baseline does not consume runtime constants). |
| 5 | No hidden filtering added | ✓ No corpus changes (corpus_hash invariant), no scoring-module changes, no scoring-layer filtering. The harness scores every primary-corpus event per §4.3.5. |
| 6 | No Sprint 6 work smuggled in | ✓ PEX-1 (`payload.event_type` defensive access in proton-cascade.js:266, 284) untouched; remains Sprint 6 / `corona-r4y` territory. |
| 7 | No dependency / package mutation | ✓ `git diff package.json` empty; no package-lock.json / yarn.lock / pnpm-lock.yaml introduced. |
| 8 | Per-theatre delta report is honest | ✓ This document attributes every per-theatre verdict change (or lack thereof) to corpus characteristics + parameter decisions; no unexplained change. |
| 9 | corpus_hash invariant | ✓ Run 2 corpus_hash = `b1caef3...` matches Run 1 verbatim. |
| 10 | script_hash change is acceptable | ✓ Run 2 script_hash = `17f6380b...` matches Run 1 verbatim (entrypoint not modified). |

---

## File-level reference

- Manifest: [calibration-manifest.json](../calibration-manifest.json)
- Run 1 baseline: [run-1/](../run-1/)
- Run 2 certificates: [run-2/](.)
- Empirical evidence: [empirical-evidence.md](../empirical-evidence.md)
- Frozen protocol: [calibration-protocol.md](../calibration-protocol.md)
- Sprint 5 implementation report: [reviewer.md](../../a2a/sprint-5/reviewer.md)
- Sprint 5 NOTES.md decisions: [NOTES.md S5-1, S5-2, S5-3](../../../NOTES.md)

*Sprint 5 / corona-33u delta report — CORONA cycle-001. Documents the evidence-driven NO-CHANGE decision for runtime parameters and the architectural reality that Run 2 numerics match Run 1 (uniform-prior baseline does not consume runtime constants). Sprint 7 / `corona-1ml` or future cycle owns the harness extension required for numerically-sensitive parameter refits.*
