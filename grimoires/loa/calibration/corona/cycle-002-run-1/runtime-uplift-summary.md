# Runtime-Uplift Composite — cycle-002-run-1 (CORONA cycle-002)

**Generated**: 2026-05-02T17:15:36.495Z
**Cycle**: cycle-002 (measurement-seam cycle; NOT a parameter-refit, L2-publish, or release-hygiene cycle)
**Run ID**: cycle-002-run-1
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Cycle-001 script_hash (cross-reference)**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**replay_script_hash**: bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60
**Code revision**: 2bb5f85d74e98b33a96274accfc9a1e39a2e127a

## Composite scope

This composite covers T1 + T2 + T4 ONLY per CHARTER §4.1 operator amendment 1.
T3 `[external-model]` and T5 `[quality-of-behavior]` are tracked separately in
`diagnostic-summary.md`; they do NOT contribute to the runtime-uplift composite.

## Per-theatre rows

| Theatre | Primary metric | n_events | Scoring path |
|---------|----------------|----------|--------------|
| T1 [runtime-binary] | binary Brier = 0.7225 | 5 | t1_binary_brier_cycle002 |
| T2 [runtime-binary] | binary Brier = 0.8100 (excl no-Kp: 0) | 5 | t2_binary_brier_cycle002 |
| T4 [runtime-bucket] | bucket Brier = 0.3818 | 5 | t4_bucket_brier_runtime_wired_cycle002 |

## Honest framing (binding cycle-level)

- **T4 `[runtime-bucket]`** is the clean owned-uplift theatre — runtime
  proton-cascade.js produces `bucket_array_5` trajectories that drive scoring
  (per SDD §3.2). The Sprint 02 milestone-1 binding gate showed the runtime
  trajectory differs measurably from `UNIFORM_PRIOR`.
- **T1 `[runtime-binary]`** and **T2 `[runtime-binary]`** are runtime-wired but
  prior-only on the current cycle-001 corpus shape: cycle-001 T1/T2 corpus events
  lack pre-cutoff time-series evidence (no GOES X-ray series for T1; no per-3hr
  Kp series for T2). `replay_T1_event` / `replay_T2_event` invoke `createX` once
  and never call `processX`; `current_position_at_cutoff` equals the runtime
  `base_rate` constant. T1/T2 cannot earn Rung 3 (calibration-improved) on the
  cycle-001 corpus shape — this is corpus-shape-foreclosed, NOT a Sprint 03
  bug. Source: cycle-002 sprint-02/reviewer.md M2 Executive Summary lines 456–464.
- This composite anchors **Baseline B** at Sprint 03 close at cycle-001 runtime
  parameter values (no refit). Cross-regime comparison of Baseline A
  (cycle-001 uniform-prior 6-bucket) against Baseline B (cycle-002 runtime
  binary/bucket) as "uplift" is forbidden per CHARTER §8.2.
- This composite is NOT evidence of "calibration-improved", "predictive uplift
  demonstrated", or "L2 publish-ready". Those are higher-rung claims gated on
  Sprints 05 / 06 evidence per CHARTER §10.

## Provenance binding

- `replay_script_hash` covers the cycle-002 trajectory-driving file set per
  SDD §6.2. Cycle-001 `script_hash = sha256(scripts/corona-backtest.js)` is
  insufficient on its own — it does not cover the replay seam dependencies
  that drive cycle-002 trajectory output.
- Cycle-001 manifest (`grimoires/loa/calibration/corona/calibration-manifest.json`)
  is immutable; cycle-002 writes a separate additive manifest at
  `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`.
