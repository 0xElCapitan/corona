# Run-3-final Closeout Delta Report — CORONA cycle-001

**Sprint 7 / `corona-1p5` deliverable**
**Authored**: 2026-05-01 (Sprint 7 final calibration run close)
**Run 1**: 2026-05-01T04:21:35Z (Sprint 3 baseline, code revision `7e8b52e`)
**Run 2**: 2026-05-01T14:50:21Z (Sprint 5 post-no-refit, code revision `edd816f`)
**Run-3-final**: 2026-05-01T20:48:50Z (Sprint 7 closeout, code revision `cf489ee`)
**Corpus hash invariant**: `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` ✓ (unchanged across all three runs)
**Script hash invariant**: `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` ✓ (unchanged across all three runs)

---

## Headline result

**Run-3-final produces numerically IDENTICAL Brier/MAE/FP-rate/p50/switch-handled values to Run 1 AND Run 2 for every theatre.** The composite verdict is `fail` in all three runs, decomposed identically: T1 fail, T2 pass, T3 fail, T4 fail, T5 fail.

This is the **expected** outcome per the Sprint 5 architectural finding (`run-2/delta-report.md`):

1. The Sprint 3 backtest harness uses `UNIFORM_PRIOR` baselines for T1, T2, T4 scoring; T3 reads `wsa_enlil_predicted_arrival_time` from the corpus directly; T5 FP rate is `corpus_fp_label`-anchored. **None of these scoring paths consume runtime parameter constants.**
2. Sprint 5 made **no runtime parameter refits** per evidence-driven NO-CHANGE decision (NOTES.md S5-1).
3. Sprint 6 made input-validation hardening fixes (PEX-1 at `proton-cascade.js:266,284`; C-006 at `corpus-loader.js:326-349`) but did NOT modify any scoring code path or any path on the harness scoring graph.
4. Sprint 7 made NO source modifications prior to this run; the `script_hash` invariant is preserved bit-for-bit.
5. The corpus is frozen at Sprint 3 (`corpus_hash` invariant); no events added, removed, or modified.

The diff between `run-2/per-event/` and `run-3-final/per-event/` is **empty** (per-event certificates byte-identical; verified via `diff -r`). Theatre report numerics (`Brier`, `MAE`, `hit_rate`, `min_calibration`, `convergence`, `fp_rate`, `p50`, `switch_handled`) are **identical** across all three runs (verified via `grep + diff`). The only differences in `summary.md` are the three metadata fields: `run_id` (run-2 → run-3-final), `Generated` timestamp, and `code_revision` (`edd816f` → `cf489ee`).

---

## Per-theatre comparison (Run 1 → Run 2 → Run-3-final)

| Theatre | Metric | Run 1 | Run 2 | Run-3-final | Δ vs Run 1 | Δ vs Run 2 | Verdict |
|---------|--------|-------|-------|-------------|------------|------------|---------|
| **T1** | Brier | 0.1389 | 0.1389 | 0.1389 | 0.0000 | 0.0000 | fail (3×) |
| **T1** | min calibration | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | — |
| **T2** | Brier | 0.1389 | 0.1389 | 0.1389 | 0.0000 | 0.0000 | pass (3×) |
| **T2** | GFZ↔SWPC convergence | 0.9627 | 0.9627 | 0.9627 | 0.0000 | 0.0000 | — |
| **T3** | MAE (h) | 6.760 | 6.760 | 6.760 | 0.000 | 0.000 | fail (3×) |
| **T3** | ±6h hit rate | 0.400 | 0.400 | 0.400 | 0.000 | 0.000 | — |
| **T4** | Brier | 0.1600 | 0.1600 | 0.1600 | 0.0000 | 0.0000 | fail (3×) |
| **T4** | min calibration | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | — |
| **T5** | FP rate | 25.0% | 25.0% | 25.0% | 0.0% | 0.0% | fail (3×) |
| **T5** | p50 stale-feed | 90.0s | 90.0s | 90.0s | 0.0s | 0.0s | — |
| **T5** | switch handled | 100.0% | 100.0% | 100.0% | 0.0% | 0.0% | — |
| **Composite** | verdict | fail | fail | fail | unchanged | unchanged | unchanged |

---

## Honest closeout framing (binding for v0.2.0)

**The numerical match across Run 1 / Run 2 / Run-3-final is NOT a calibration improvement claim.** It is the architectural reality of the Sprint 3 harness:

- The harness scores against `UNIFORM_PRIOR` baselines (T1, T2, T4) and corpus-anchored ground truth (T3 WSA-Enlil predictions, T5 FP labels). The runtime CORONA processor parameters (`flareThresholdProbability`, `kpThresholdProbability`, `buildCMEArrivalUncertainty`, etc.) are NOT exercised by the offline scoring layer — they are part of the live theatre's evidence-ingestion path.
- Sprint 5 had the option to refit runtime parameters; the evidence-driven NO-CHANGE decision (NOTES.md S5-1) preserves the construct's parameter values per Sprint 4 §4.2-§4.5 literature evidence. No refit was motivated.
- v0.2.0 ships the construct as a **deployable + calibration-attempted** artifact, not a **calibration-improved** one. The composite verdict `fail` reflects (a) corpus characteristics (T1/T4 buckets with observed_count=0 in 5/6 buckets → calibration=0), (b) WSA-Enlil prediction error in the corpus (T3 MAE 6.76h dominated by one 16h-error event), and (c) intentional T5 FP-rate test labels in the corpus. None of these are calibration deficiencies of the construct's runtime parameters.

**Future-cycle promotion paths** are documented in `calibration-manifest.json` (30 entries with `verification_status` ∈ {`VERIFIED_FROM_SOURCE`, `ENGINEER_CURATED_REQUIRES_VERIFICATION`, `OPERATIONAL_DOC_ONLY`, `HYPOTHESIS_OR_HEURISTIC`}). Sprint 7 does NOT promote any entry to a higher verification tier.

---

## Cross-references

- `grimoires/loa/calibration/corona/run-1/summary.md` — Sprint 3 baseline (corpus + script hashes locked here)
- `grimoires/loa/calibration/corona/run-2/summary.md` — Sprint 5 post-no-refit (numerics identical)
- `grimoires/loa/calibration/corona/run-2/delta-report.md` — Sprint 5 architectural-reality analysis
- `grimoires/loa/calibration/corona/calibration-manifest.json` — 30-entry parameter provenance (Sprint 5)
- `grimoires/loa/calibration/corona/empirical-evidence.md` — Sprint 4 literature evidence (1139 lines, 14 primary citations)
- `grimoires/loa/calibration/corona/security-review.md` — Sprint 6 input-validation review (0 critical / 0 high / 9 medium / 16 low)

---

*Run-3-final closeout delta authored at Sprint 7 close, before BFZ refresh and version bump. corpus_hash + script_hash invariants confirmed; per-theatre numerics identical to Run 2 and Run 1; composite verdict `fail` unchanged. v0.2.0 ships honest no-refit posture per Sprint 7 handoff §6 hard constraints.*
