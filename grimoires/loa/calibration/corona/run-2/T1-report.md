# T1 — Run run-2 Report

**Run ID**: run-2
**Generated**: 2026-05-01T14:50:21.153Z
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Script hash**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**Code revision**: edd816ffa743fe1d5c8eecd56964c7b077356914

## Inputs
- Corpus file: grimoires/loa/calibration/corona/corpus/primary/T1-flare-class
- Code under test: src/theatres/flare-gate.js, src/processor/uncertainty.js
- Baseline model: `uniform_prior_run_1` (Run 1 floor — Sprint 5 will refit)

## Per-event results

| event_id | flare_class_predicted | flare_class_observed | bucket_predicted | bucket_observed | brier_score |
|----------|------------------------|----------------------|-------------------|------------------|-------------|
| T1-2017-09-06-X9p3 | <M | X9.3 | 0 | 4 | 0.1389 |
| T1-2017-09-10-X8p2 | <M | X8.2 | 0 | 4 | 0.1389 |
| T1-2023-12-14-X2p8 | <M | X2.8 | 0 | 3 | 0.1389 |
| T1-2024-05-14-X8p7 | <M | X8.7 | 0 | 4 | 0.1389 |
| T1-2024-10-03-X9p0 | <M | X9.0 | 0 | 4 | 0.1389 |

## Pass/marginal/fail verdict

**Verdict**: `fail`

### Threshold reference (calibration-protocol.md §6)

    {
      "pass": {
        "brier_max": 0.15,
        "calibration_min": 0.85
      },
      "marginal": {
        "brier_max": 0.2,
        "calibration_min": 0.75
      }
    }

### Aggregate metric values

- brier: 0.138889
- bucket_calibration: [0.0000, 0.0000, 0.0000, 0.8000, 0.0000, 0.0000]
- n_events: 5.000000
- predicted_distribution_used: [0.1667, 0.1667, 0.1667, 0.1667, 0.1667, 0.1667]
- bucket_labels: [<M, M1-M4, M5-M9, X1-X4, X5-X9, X10+]
- baseline_model: "uniform_prior_run_1"

## Notes

Run 1 baseline uses uniform-prior over 6 T1 buckets. Sprint 5 will refit by injecting runtime flare-gate.js predictions. Brier and bucket-calibration numbers reflect the no-model floor.
