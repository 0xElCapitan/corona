# T5 — Run run-3-final Report

**Run ID**: run-3-final
**Generated**: 2026-05-01T20:48:50.980Z
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Script hash**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**Code revision**: cf489ee3dfd3346b0280baf3d0ac0844eecb241d

## Inputs
- Corpus file: grimoires/loa/calibration/corona/corpus/primary/T5-solar-wind-divergence
- Code under test: src/theatres/solar-wind-divergence.js

## Per-event results

| event_id | window | signal_count | false_positive_count | stale_feed_count | switch_count | bulletin_hits |
|----------|--------|--------------|----------------------|-------------------|---------------|----------------|
| T5-2017-09-07-window | 2017-09-07T18:00:00Z → 2017-09-08T18:00:00Z | 2 | 1 | 1 | 0 | 1/1 |
| T5-2022-02-03-window | 2022-02-02T22:00:00Z → 2022-02-04T06:00:00Z | 1 | 0 | 0 | 1 | 0/0 |
| T5-2023-04-23-window | 2023-04-23T12:00:00Z → 2023-04-24T12:00:00Z | 2 | 1 | 1 | 0 | 0/0 |
| T5-2024-05-10-window | 2024-05-10T12:00:00Z → 2024-05-11T12:00:00Z | 2 | 0 | 0 | 0 | 0/0 |
| T5-2024-10-10-window | 2024-10-10T12:00:00Z → 2024-10-11T12:00:00Z | 1 | 0 | 1 | 1 | 0/0 |

### Per-event detail

#### T5-2017-09-07-window

**Divergence signals**:
- 2017-09-07T22:55:00Z → unresolved; corpus_fp_label=false; computed_false_positive=false (persisted_or_unresolved_at_60min)
- 2017-09-08T05:30:00Z → 2017-09-08T05:48:00Z; corpus_fp_label=true; computed_false_positive=true (resolved_fast_no_corroboration)
**Stale-feed events**:
- onset=2017-09-08T03:10:00Z, detect=2017-09-08T03:11:30Z, latency=90.0s, satellite=DSCOVR
**Bulletin diagnostics**:
- DSCOVR-2017-09-08-instrument-drift (PlasMag_dropout): hit=true at 2017-09-08T05:30:00Z

#### T5-2022-02-03-window

**Divergence signals**:
- 2022-02-02T22:10:00Z → unresolved; corpus_fp_label=false; computed_false_positive=false (persisted_or_unresolved_at_60min)
**Satellite-switch events**:
- 2022-02-03T15:00:00Z: DSCOVR_PRIMARY → DSCOVR_SECONDARY (scheduled_maintenance), handled=true (no_spurious_signal_in_post_quiet_window)

#### T5-2023-04-23-window

**Divergence signals**:
- 2023-04-23T17:35:00Z → unresolved; corpus_fp_label=false; computed_false_positive=false (persisted_or_unresolved_at_60min)
- 2023-04-23T20:18:00Z → 2023-04-23T20:42:00Z; corpus_fp_label=true; computed_false_positive=true (resolved_fast_no_corroboration)
**Stale-feed events**:
- onset=2023-04-24T01:00:00Z, detect=2023-04-24T01:02:15Z, latency=135.0s, satellite=DSCOVR

#### T5-2024-05-10-window

**Divergence signals**:
- 2024-05-10T16:45:00Z → unresolved; corpus_fp_label=false; computed_false_positive=false (persisted_or_unresolved_at_60min)
- 2024-05-11T03:15:00Z → unresolved; corpus_fp_label=false; computed_false_positive=false (persisted_or_unresolved_at_60min)

#### T5-2024-10-10-window

**Divergence signals**:
- 2024-10-10T16:55:00Z → unresolved; corpus_fp_label=false; computed_false_positive=false (persisted_or_unresolved_at_60min)
**Stale-feed events**:
- onset=2024-10-10T22:00:00Z, detect=2024-10-10T22:01:30Z, latency=90.0s, satellite=ACE
**Satellite-switch events**:
- 2024-10-10T20:00:00Z: DSCOVR_PRIMARY → ACE (dscovr_primary_outage), handled=true (no_spurious_signal_in_post_quiet_window)

## Pass/marginal/fail verdict

**Verdict**: `fail`

### Threshold reference (calibration-protocol.md §6)

    {
      "pass": {
        "fp_rate_max": 0.1,
        "stale_p50_max_seconds": 120,
        "switch_handled_min": 0.95
      },
      "marginal": {
        "fp_rate_max": 0.15,
        "stale_p50_max_seconds": 300,
        "switch_handled_min": 0.9
      }
    }

### Aggregate metric values

- fp_rate: 0.250000
- stale_feed_p50_seconds: 90.000000
- stale_feed_p95_seconds: 130.500000
- satellite_switch_handled_rate: 1.000000
- hit_rate_diagnostic: 1.000000
- n_signals: 8.000000
- n_stale_events: 3.000000
- n_switches: 2.000000
- n_bulletins: 1.000000
- n_events: 5.000000

## Notes

T5 has no external ground truth — settlement is internal (DSCOVR-ACE Bz volatility + sustained-streak detection). The metrics here are quality-of-behavior: FP rate against 60-min corroboration window, stale-feed p50/p95 latency, satellite-switch handled rate (with 10-min post-quiet check), plus a hit-rate diagnostic against annotation_bulletin_refs (NOT in pass/marginal/fail composite per §4.5.2).
