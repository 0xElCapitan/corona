# Sprint 05 sensitivity proof — cycle-002-run-2 (A)

**Generated**: 2026-05-02T18:00:00.000Z
**Cycle**: cycle-002 (sensitivity proof; not parameter-refit)
**Run ID**: cycle-002-run-2
**Direction**: A
**Lambda scalar (PRODUCTIVITY_PARAMS lambda multiplier)**: 1.25
**Mechanism**: real runtime injection — lambdaScalar flows replay_T4_event → createProtonEventCascade → estimateExpectedCount → PRODUCTIVITY_PARAMS lambda multiplier. The trajectory's current_position_at_cutoff is the runtime's actual output under the perturbation.
**Baseline B T4 Brier**: 0.38183588
**T4 Brier (this direction)**: 0.39533664
**Delta vs Baseline B**: +0.01350076
**Code revision**: d93cada9e9d33f79702d4d14f0b65fdd5ad93814
**Corpus hash**: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
**replay_script_hash (post-Sprint-05)**: a919ec7d3f472f65435b0e6bec9b2c4e082e40186ceecc8921b527013470940b
**replay_script_hash (Sprint 03 anchor, historical)**: bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60
**Cycle-001 script hash (frozen)**: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
**src/theatres/proton-cascade.js sha256 (post-Sprint-05 dependency)**: 095ef077541ba0bfc994b253d0c1572abbd0479db10e2de7e06ddd1e0d38d549

## Direction posture

Direction A applies the controlled perturbation BEFORE the runtime is invoked: `replay_T4_event(event, ctx, { lambdaScalar: 1.25 })`. The option flows through createProtonEventCascade and estimateExpectedCount, scaling PRODUCTIVITY_PARAMS lambda at call time. Every qualifying-event blend in processProtonEventCascade uses the perturbed prior's expected_count. Scoring consumes the trajectory's current_position_at_cutoff directly. No post-runtime distribution substitution.

## Per-event Brier

| event_id | observed bucket | predicted_distribution_from_trajectory | trajectory_hash | Brier |
|---|---|---|---|---|
| T4-2017-09-06-S2 | 1 | [0.000, 0.000, 0.000, 0.000, 1.000] | `76d40ce431a3…` | 0.40000000 |
| T4-2017-09-10-S3 | 2 | [0.000, 0.000, 0.000, 0.000, 1.000] | `aec03ea26ba1…` | 0.40000000 |
| T4-2022-01-20-S1 | 0 | [0.000, 0.000, 0.001, 0.032, 0.967] | `6cf40c581102…` | 0.38722280 |
| T4-2024-05-11-S2 | 1 | [0.000, 0.000, 0.000, 0.000, 1.000] | `2f41640a3252…` | 0.40000000 |
| T4-2024-05-15-S1 | 2 | [0.000, 0.000, 0.001, 0.025, 0.974] | `9f1f3fb5df19…` | 0.38946040 |

## Honest framing

- This file is part of the Sprint 05 two-direction sensitivity proof per
  CYCLE-002-SPRINT-PLAN.md §4.3 + Sprint 05 review (Path B authorization).
  It demonstrates the cycle-002 backtest harness IS sensitive to a controlled
  T4 runtime parameter perturbation that flows through the runtime replay
  path including post-event blending. Earns Rung 2 (runtime-sensitive)
  per CHARTER §10.
- This is **not** a calibration-improved claim. The perturbation is intentionally
  reverted in Direction B by passing lambdaScalar=1.0 (the default); runtime
  PRODUCTIVITY_PARAMS literal values in src/ remain unchanged per the
  no-refit covenant (CHARTER §8.3). The src/ edit is option-bag plumbing only.
- Cycle-001 calibration manifest and `scripts/corona-backtest.js` are byte-frozen
  by construction; verified by sensitivity-proof-T4-test.js immutability gates.
- replay_script_hash drifted from Sprint 03 anchor (bfbfd70d…380a60) to the
  post-Sprint-05 value above; Sprint 05 §4.3 §6 in the operator review
  authorizes this drift to honestly cover the new replay behavior.
