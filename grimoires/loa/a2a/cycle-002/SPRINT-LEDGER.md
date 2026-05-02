# CORONA cycle-002 Sprint Ledger

## Purpose

This ledger governs CORONA cycle-002 only.

Cycle-001 artifacts remain frozen historical records and must not be overwritten, renamed, or treated as active sprint targets.

### Frozen cycle-001 references

- `grimoires/loa/prd.md`
- `grimoires/loa/sdd.md`
- `grimoires/loa/sprint.md`
- `grimoires/loa/a2a/sprint-0/` through `grimoires/loa/a2a/sprint-7/`
- `grimoires/loa/calibration/corona/calibration-manifest.json`
- cycle-001 run outputs

### Active cycle-002 namespace

`grimoires/loa/a2a/cycle-002/`

---

## Sprint index

### Sprint 00 — Charter / freeze line

**Spec**: `grimoires/loa/a2a/cycle-002/sprint-00/CHARTER.md`

**Status**: Ratified.

**Purpose**: Defines cycle-002 mission, frozen artifact list, theatre posture, RLMF non-goal, manifest strategy, replay clock decision, baseline policy, T1/T2 scoring posture, and success ladder.

### Sprint 01 — PredictionTrajectory contract

**Spec**: `grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md`

**Status**: Ratified.

**Purpose**: Defines canonical trajectory shape, `distribution_shape` closed set, theatre-specific trajectory posture, cutoff semantics, determinism contract, provenance fields, and validation rules.

### Sprint 02 — Deterministic replay seam

**Spec**: `grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md`

**Implementation report**: `grimoires/loa/a2a/cycle-002/sprint-02/reviewer.md`

**Review**: `grimoires/loa/a2a/cycle-002/sprint-02/engineer-feedback.md`

**Audit**: `grimoires/loa/a2a/cycle-002/sprint-02/auditor-sprint-feedback.md`

**Status**: Complete.

**Commit**: `c9535386aff2a02c6aeee60480cd57dfc7f880a0`

**Purpose**: Implements deterministic runtime replay seam for cycle-002 owned-uplift theatres:

- T1 `binary_scalar` replay
- T2 `binary_scalar` replay
- T4 `bucket_array_5` replay
- threshold-native binary Brier scoring for T1/T2
- default-preserving clock injection
- RLMF certificate non-mutation guard

**Final tests**: 261/261 passing.

### Sprint 03 — Runtime replay entrypoint + additive manifest

**Spec**: Operator ratification: Sprint 03 intentionally skips a separate `ENTRYPOINT-MANIFEST.md`. The existing cycle-002 PRD, SDD, sprint plan, ledger, and ratified Sprint 00–02 artifacts are the binding Sprint 03 implementation spec. `/implement sprint-03` routes through the cycle-002 ledger and proceeds directly against those documents.

**Status**: In progress.

**Expected scope**:

- wire runtime replay into backtest/reporting entrypoint
- emit cycle-002 runtime replay report
- create additive cycle-002 runtime replay manifest
- include `replay_script_hash` / `runtime_replay_hash`
- preserve cycle-001 manifest and run truth

---

## Command routing rule

When the operator invokes `/review-sprint sprint-02`, `/audit-sprint sprint-02`, `/implement sprint-03`, or similar during CORONA cycle-002, resolve sprint IDs through this ledger, not through the frozen cycle-001 sprint files.

---

## Safety rule

If a command would write outside `grimoires/loa/a2a/cycle-002/`, or would touch source/tests/scripts/manifests, state that explicitly before proceeding.

For normal cycle-002 planning docs, use compact path assertion instead of full collision audit.

Full path audit is only required if:

- writing outside `grimoires/loa/a2a/cycle-002/`
- editing an existing file
- touching source/tests/scripts/runtime/RLMF
- touching manifests
- detecting collision risk
- changing command routing or sprint ledger structure
