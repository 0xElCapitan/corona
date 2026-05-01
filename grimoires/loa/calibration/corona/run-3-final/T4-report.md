# T4 — Run run-3-final Report

**Run ID**: run-3-final
**Generated**: 2026-05-01T20:48:50.977Z
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Script hash**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**Code revision**: cf489ee3dfd3346b0280baf3d0ac0844eecb241d

## Inputs
- Corpus file: grimoires/loa/calibration/corona/corpus/primary/T4-proton-cascade
- Code under test: src/theatres/proton-cascade.js
- Baseline model: `uniform_prior_run_1` (Run 1 floor — Sprint 5 will refit)

## Per-event results

| event_id | s_event_count_observed | bucket_predicted | bucket_observed | brier_score | window_override |
|----------|------------------------|-------------------|-------------------|-------------|------------------|
| T4-2017-09-06-S2 | 2 | 0 | 1 | 0.1600 | no |
| T4-2017-09-10-S3 | 4 | 0 | 2 | 0.1600 | no |
| T4-2022-01-20-S1 | 1 | 0 | 0 | 0.1600 | no |
| T4-2024-05-11-S2 | 3 | 0 | 1 | 0.1600 | no |
| T4-2024-05-15-S1 | 5 | 0 | 2 | 0.1600 | no |

### Qualifying events per corpus event

- **T4-2017-09-06-S2** (2 events):
  - 2017-09-06T13:00:00Z — 60.0 pfu (>=10 MeV, satellite=GOES-13)
  - 2017-09-06T22:00:00Z — 87.0 pfu (>=10 MeV, satellite=GOES-13)
- **T4-2017-09-10-S3** (4 events):
  - 2017-09-10T16:25:00Z — 145.0 pfu (>=10 MeV, satellite=GOES-13)
  - 2017-09-10T18:00:00Z — 1494.0 pfu (>=10 MeV, satellite=GOES-13)
  - 2017-09-10T22:00:00Z — 1100.0 pfu (>=10 MeV, satellite=GOES-13)
  - 2017-09-11T12:00:00Z — 800.0 pfu (>=10 MeV, satellite=GOES-13)
- **T4-2022-01-20-S1** (1 events):
  - 2022-01-20T07:00:00Z — 12.0 pfu (>=10 MeV, satellite=GOES-16)
- **T4-2024-05-11-S2** (3 events):
  - 2024-05-11T03:00:00Z — 250.0 pfu (>=10 MeV, satellite=GOES-16)
  - 2024-05-11T07:00:00Z — 380.0 pfu (>=10 MeV, satellite=GOES-16)
  - 2024-05-12T03:00:00Z — 200.0 pfu (>=10 MeV, satellite=GOES-16)
- **T4-2024-05-15-S1** (5 events):
  - 2024-05-15T09:30:00Z — 15.0 pfu (>=10 MeV, satellite=GOES-16)
  - 2024-05-15T11:00:00Z — 18.0 pfu (>=10 MeV, satellite=GOES-16)
  - 2024-05-15T14:00:00Z — 22.0 pfu (>=10 MeV, satellite=GOES-16)
  - 2024-05-15T18:00:00Z — 11.0 pfu (>=10 MeV, satellite=GOES-16)
  - 2024-05-16T05:00:00Z — 10.0 pfu (>=10 MeV, satellite=GOES-16)

## Pass/marginal/fail verdict

**Verdict**: `fail`

### Threshold reference (calibration-protocol.md §6)

    {
      "pass": {
        "brier_max": 0.2,
        "calibration_min": 0.75
      },
      "marginal": {
        "brier_max": 0.25,
        "calibration_min": 0.65
      }
    }

### Aggregate metric values

- brier: 0.160000
- bucket_distribution: [0.2000, 0.4000, 0.4000, 0.0000, 0.0000]
- bucket_calibration: [1.0000, 0.0000, 0.0000, 0.0000, 0.0000]
- n_events: 5.000000
- predicted_distribution_used: [0.2000, 0.2000, 0.2000, 0.2000, 0.2000]
- bucket_labels: [0-1, 2-3, 4-6, 7-10, 11+]
- baseline_model: "uniform_prior_run_1"

## Notes

Run 1 baseline uses uniform-prior over the 5 T4 buckets pinned at Sprint 2 freeze (calibration-protocol.md §4.4.2). Sprint 5 will refit by injecting runtime proton-cascade.js predictions (Wheatland prior). The 72-hour prediction window is enforced per §4.4.0; non-default windows surface as `window_override: YES` in the per-event table.
