# Diagnostic Summary — cycle-002-run-1 (CORONA cycle-002) [diagnostic]

**Generated**: 2026-05-02T17:15:36.496Z
**Cycle**: cycle-002 (measurement-seam cycle)
**Run ID**: cycle-002-run-1
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**Cycle-001 script_hash (cross-reference)**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**replay_script_hash**: bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60
**Code revision**: 2bb5f85d74e98b33a96274accfc9a1e39a2e127a

## Diagnostic discipline [diagnostic]

This is the FULL-PICTURE diagnostic summary. Per CHARTER §4.1 operator amendment 1
and SDD §4, every section title and table caption in this document is tagged
`[diagnostic]`. Numerics from this summary may NOT underwrite calibration-improved
or runtime-uplift claims; those claims live exclusively in `runtime-uplift-summary.md`.
The `[diagnostic]` tag is the structural mitigation against laundering T3 / T5
numerics into Rung-1+ closeout language.

## Per-theatre rows [diagnostic]

| Theatre | Primary metric [diagnostic] | Secondary metric [diagnostic] | n_events |
|---------|------------------------------|-------------------------------|----------|
| T1 [runtime-binary] | binary Brier = 0.7225 | scoring path = t1_binary_brier_cycle002 | 5 |
| T2 [runtime-binary] | binary Brier = 0.8100 | scoring path = t2_binary_brier_cycle002 (excl no-Kp: 0) | 5 |
| T3 [external-model] | MAE = 6.76h | within ±6h hit-rate = 40.0% | 5 |
| T4 [runtime-bucket] | bucket Brier = 0.3818 | scoring path = t4_bucket_brier_runtime_wired_cycle002 | 5 |
| T5 [quality-of-behavior] | FP rate = 25.0% | p50 stale-feed = 90.0s, switch handled = 100.0% | 5 |

## Theatre posture (binding) [diagnostic]

| Theatre | Posture tag | Counts toward runtime-uplift composite? |
|---------|-------------|------------------------------------------|
| T1      | [runtime-binary] | YES |
| T2      | [runtime-binary] | YES |
| T3      | [external-model] | NO (external-model — not CORONA-owned) |
| T4      | [runtime-bucket] | YES (primary) |
| T5      | [quality-of-behavior] | NO (quality-of-behavior — settlement is internal) |

## Honest-framing notes [diagnostic]

- **T1 / T2** trajectories are prior-only on the cycle-001 corpus shape (no
  pre-cutoff time-series). `current_position_at_cutoff` equals runtime
  `base_rate`. Cycle-002 cannot earn calibration-improved on T1/T2 from this
  corpus — corpus-shape-foreclosed per Sprint 02 reviewer.md M2 Executive
  Summary lines 456–464.
- **T3 `[external-model]`**: scoring measures NASA DONKI WSA-Enlil prediction
  quality against the L1 shock observation, NOT a CORONA prediction. CORONA
  does not emit a T3 prediction (Q2 freeze). T3 numerics are diagnostic-only
  and explicitly excluded from the runtime-uplift composite.
- **T4 `[runtime-bucket]`**: clean owned-uplift theatre. Trajectory drives
  scoring; sensitivity-proof target for Sprint 05.
- **T5 `[quality-of-behavior]`**: scoring is settlement (FP rate, p50 stale-feed
  latency, satellite-switch handling, hit-rate-diagnostic). T5 has no external
  probabilistic ground truth and is NOT converted to a probabilistic-uplift
  scoring path (Q3 freeze). Diagnostic-only.

## Provenance binding [diagnostic]

- Cycle-001 calibration manifest at
  `grimoires/loa/calibration/corona/calibration-manifest.json` is FROZEN.
  Cycle-002 writes a separate additive manifest at
  `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`.
- Cycle-001 `script_hash = sha256(scripts/corona-backtest.js)` is preserved
  byte-identically (verified by tests/cycle-002-entrypoint-test.js, test
  "byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor").
- `replay_script_hash` covers the cycle-002 trajectory-driving file set per
  SDD §6.2. Recomputation from disk is asserted by tests/cycle-002-entrypoint-test.js,
  test "cycle-002 manifest regression: replay_script_hash matches recomputed",
  via verifyReplayScriptHash() in scripts/corona-backtest/manifest/runtime-replay-manifest.js.
  The cycle-001 tests/manifest_regression_test.js is the cycle-001 inline-vs-manifest
  gate and is unrelated to cycle-002 replay_script_hash recomputation.
