# Run run-1 Summary — CORONA cycle-001

**Generated**: 2026-05-01T04:21:35.565Z
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Script hash**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**Code revision**: 7e8b52e9e729b1b7d31366bbc7d3e1a264a43da3

**Composite verdict**: `fail` (worst-case per §6.1)

## Per-theatre roll-up

| Theatre | Primary metric | Secondary metric | n_events | Verdict |
|---------|----------------|-------------------|----------|---------|
| T1 | 0.1389 | min cal=0.000 | 5 | `fail` |
| T2 | 0.1389 | conv=0.963 | 5 (excl GFZ-lag: 0) | `pass` |
| T3 | MAE=6.76h | ±6h hit=40.0% | 5 | `fail` |
| T4 | 0.1600 | min cal=0.000 | 5 | `fail` |
| T5 | FP=25.0% | p50=90.0s, switch=100.0% | 5 | `fail` |

## Corpus load stats

| Theatre | Loaded | Rejected |
|---------|--------|----------|
| T1 | 5 | 0 |
| T2 | 5 | 0 |
| T3 | 5 | 0 |
| T4 | 5 | 0 |
| T5 | 5 | 0 |

## Methodology notes

- Run 1 baseline reflects Sprint 3 harness with Sprint 2 frozen protocol. Parameter refit is Sprint 5 / `corona-3fg` — the regression gate compares against this Run 1 baseline once Sprint 5 produces Run 2.
- T1, T2, T4 use **uniform-prior** baselines for Run 1 (no-model floor). Sprint 5 will refit by injecting runtime flare-gate.js / geomag-gate.js / proton-cascade.js predictions.
- T3 prediction comes from corpus-supplied `wsa_enlil_predicted_arrival_time`. T3 measures WSA-Enlil accuracy against L1 observation, not CORONA prediction quality.
- T5 has no external ground truth; metrics are quality-of-behavior (FP rate, stale-feed latency, switch handling).
- Per-theatre code paths are independent per operator hard constraint #5 (no shared scoring code).
- Zero-runtime-dependency posture preserved (`node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch`, `node:test`).
