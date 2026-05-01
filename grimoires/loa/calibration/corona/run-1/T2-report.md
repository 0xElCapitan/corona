# T2 — Run run-1 Report

**Run ID**: run-1
**Generated**: 2026-05-01T04:21:35.555Z
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Script hash**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**Code revision**: 7e8b52e9e729b1b7d31366bbc7d3e1a264a43da3

## Inputs
- Corpus file: grimoires/loa/calibration/corona/corpus/primary/T2-geomag-storm
- Code under test: src/theatres/geomag-gate.js, src/processor/uncertainty.js
- Baseline model: `uniform_prior_run_1` (Run 1 floor — Sprint 5 will refit)

## Per-event results

| event_id | kp_swpc_predicted | kp_gfz_observed | kp_swpc_observed | bucket_predicted | bucket_observed | brier_score |
|----------|-------------------|-----------------|-------------------|-------------------|------------------|-------------|
| T2-2017-09-08-Kp8 | G0 | 8.00 | 8.33 | 0 | 4 | 0.1389 |
| T2-2022-02-03-Kp767 | G0 | 7.00 | 7.67 | 0 | 3 | 0.1389 |
| T2-2023-04-23-Kp767 | G0 | 7.33 | 7.67 | 0 | 3 | 0.1389 |
| T2-2024-05-11-Kp9 | G0 | 9.00 | 9.00 | 0 | 5 | 0.1389 |
| T2-2024-10-10-Kp867 | G0 | 8.33 | 8.67 | 0 | 4 | 0.1389 |

## Pass/marginal/fail verdict

**Verdict**: `pass`

### Threshold reference (calibration-protocol.md §6)

    {
      "pass": {
        "brier_max": 0.15,
        "convergence_min": 0.85
      },
      "marginal": {
        "brier_max": 0.2,
        "convergence_min": 0.75
      }
    }

### Aggregate metric values

- brier: 0.138889
- gfz_vs_swpc_convergence: 0.962667
- n_events: 5.000000
- n_events_total: 5.000000
- n_events_excluded_gfz_lag: 0.000000
- predicted_distribution_used: [0.1667, 0.1667, 0.1667, 0.1667, 0.1667, 0.1667]
- bucket_labels: [G0, G1, G2, G3, G4, G5]
- baseline_model: "uniform_prior_run_1"

## Notes

Run 1 baseline uses uniform-prior over 6 G-scale buckets. Sprint 5 will refit by injecting runtime geomag-gate.js predictions. GFZ-lag exclusion (§3.6) applies — events with `kp_gfz_observed === null` are excluded from the regression-tier Brier (n_events_excluded_gfz_lag in aggregate).
