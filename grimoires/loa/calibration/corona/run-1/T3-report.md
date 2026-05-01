# T3 — Run run-1 Report

**Run ID**: run-1
**Generated**: 2026-05-01T04:21:35.557Z
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Script hash**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**Code revision**: 7e8b52e9e729b1b7d31366bbc7d3e1a264a43da3

## Inputs
- Corpus file: grimoires/loa/calibration/corona/corpus/primary/T3-cme-arrival
- Code under test: src/theatres/cme-arrival.js (forecast: NASA DONKI WSA-Enlil)

## Per-event results

| event_id | t_predicted | t_observed | error_hours | within_6h | glancing_blow_flag | z_score | sigma_source |
|----------|-------------|------------|-------------|-----------|---------------------|---------|--------------|
| T3-2017-09-06-CME001 | 2017-09-08T00:00:00Z | 2017-09-07T23:00:00Z | 1.00 | YES | no | 0.143 | corpus_value |
| T3-2017-09-10-CME002 | 2017-09-12T20:00:00Z | 2017-09-13T05:00:00Z | 9.00 | no | YES | 0.643 | corpus_value |
| T3-2022-01-29-CME001 | 2022-02-02T06:00:00Z | 2022-02-02T22:00:00Z | 16.00 | no | no | 1.333 | corpus_value |
| T3-2023-12-14-CME001 | 2023-12-17T03:00:00Z | 2023-12-17T10:30:00Z | 7.50 | no | no | 0.536 | placeholder_14h_per_round_2_C7 |
| T3-2024-05-09-CME001 | 2024-05-10T17:00:00Z | 2024-05-10T16:42:00Z | 0.30 | YES | no | 0.037 | corpus_value |

**z_score sigma source**: `corpus_value` when `wsa_enlil_sigma_hours` is non-null in the corpus event; `placeholder_14h_per_round_2_C7` when null (14h is the midpoint of the BFZ-cited 10–18h literature range; Sprint 4 / `corona-2zs` will refine via primary-literature priors). z_score is supplementary diagnostic only — NOT in the pass/marginal/fail composite per §4.3.3.

**glancing_blow_within_12h_hit_rate semantics** (Round 2 review C8): `null` in the aggregate means *no glancing-blow events in scored corpus*, NOT 0%. A numeric value is the ratio of glancing-blow events that hit within ±12h of WSA-Enlil predicted arrival.

## Pass/marginal/fail verdict

**Verdict**: `fail`

### Threshold reference (calibration-protocol.md §6)

    {
      "pass": {
        "mae_hours_max": 6,
        "hit_rate_min": 0.65
      },
      "marginal": {
        "mae_hours_max": 9,
        "hit_rate_min": 0.5
      }
    }

### Aggregate metric values

- mae_hours: 6.760000
- within_6h_hit_rate: 0.400000
- glancing_blow_within_12h_hit_rate: 1.000000
- mean_z_score: 0.538452
- n_events: 5.000000
- n_glancing_blow_events: 1.000000

## Notes

Prediction comes from corpus-supplied `wsa_enlil_predicted_arrival_time` (NASA DONKI WSA-Enlil ensemble). T3 settlement = observed L1 shock signature. CORONA wraps WSA-Enlil with uncertainty pricing; Sprint 3 measures WSA-Enlil accuracy directly. Round 2 review C7 (14h sigma placeholder for null-sigma events) and C8 (`null` glancing-blow hit rate semantics) are documented above.
