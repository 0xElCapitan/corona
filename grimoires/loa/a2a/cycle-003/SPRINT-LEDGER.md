# CORONA cycle-003 Sprint Ledger

## Purpose

This ledger governs CORONA cycle-003 only.

Cycle-001 and cycle-002 artifacts remain frozen historical records and must not be overwritten, renamed, or treated as active sprint targets.

### Frozen cycle-001 / cycle-002 references

- `grimoires/loa/prd.md`, `grimoires/loa/sdd.md`, `grimoires/loa/sprint.md`
- `grimoires/loa/ledger.json` (frozen at cycle-001; cycle-003 does NOT update it)
- `grimoires/loa/a2a/sprint-0/` through `grimoires/loa/a2a/sprint-7/` (cycle-001)
- `grimoires/loa/a2a/cycle-002/` (entire cycle-002 namespace)
- `grimoires/loa/calibration/corona/calibration-manifest.json` (cycle-001, sha256 `e53a40d1…5db34a`)
- `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (cycle-002)
- `grimoires/loa/calibration/corona/corpus/` + `corpus_hash b1caef3f…11bb1` (frozen corpus tree)
- `scripts/corona-backtest.js` (sha256 `17f6380b…1730f1`)
- `src/rlmf/certificates.js` (`version: '0.1.0'`)
- cycle-001 + cycle-002 run outputs

### Active cycle-003 namespace

`grimoires/loa/a2a/cycle-003/`

The expanded corpus (when authorized) lives in a NEW sibling tree `grimoires/loa/calibration/corona/corpus-cycle-003/` (SDD §3.2), selected by the existing `CORONA_CORPUS_DIR` seam — never inside the frozen `corpus/` tree.

---

## Cycle posture (binding)

Cycle-002 closed at **Rung 2 (runtime-sensitive, T4 only)**; published version **v0.2.0**.

Cycle-003 is a **corpus-shape / data-substrate cycle**. It earns **no new rung** and advances **no theatre's rung** (PRD §9, SDD §1; OQ-8). It is NOT a refit cycle, NOT a calibration-improvement cycle, NOT an L2 publish-ready cycle, NOT a release. The SDD §2 Layer-A/B replay+loader change is **out of scope (HS-2)**, deferred to a future separately-gated cycle (OQ-9).

---

## Sprint index

### Sprint 00 — (none; charter optional)

No charter for cycle-003 unless the operator explicitly requests one. The binding cycle-003 spec set is [PRD.md](PRD.md) + [SDD.md](SDD.md) + [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md), consistent with the cycle-002 Sprint 03 / 05 / 06 operator-ratified precedent (no separate per-sprint spec doc required).

### Sprint S01 — Archive verification / sanity samples

**Spec**: [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md) §"Sprint S01"
**Scope**: SMALL (3 tasks) · **Status**: planned · **Depends on**: none
**Purpose**: Verify PRD §5 data-source assumptions by bounded sanity-sample; answer the GOES-R-era S1+ supply question; resolve `REQUIRES_LIVE_ARCHIVE_VERIFICATION` for load-bearing figures.

### Sprint S02 — Corpus namespace + schema skeleton

**Spec**: [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md) §"Sprint S02"
**Scope**: SMALL (3 tasks) · **Status**: planned · **Depends on**: S01
**Purpose**: Create the `corpus-cycle-003/` sibling tree; pin additive series field names (`xray_flux_observations[]`, `kp_observations[]`); stand up the cycle-003 manifest + fresh `corpus_hash` machinery. Zero frozen-file touch.

### Sprint S03 — T1/T2 corpus construction (wired-capable)

**Spec**: [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md) §"Sprint S03"
**Scope**: LARGE (7 tasks) · **Status**: planned · **Depends on**: S02 (and S01)
**Purpose**: Populate T1/T2 with leakage-free, strictly-pre-cutoff series; run the read-only §2.3 substrate-conformance probe. Wired-*capable* only; NOT the Layer-A/B change (HS-2).

### Sprint S04 — T4 expansion + bucket report

**Spec**: [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md) §"Sprint S04"
**Scope**: SMALL (3 tasks) · **Status**: planned · **Depends on**: S02 (parallelizable with S03)
**Purpose**: Expand T4 to its honest GOES-R-era S1+ supply ceiling; produce count + bucket-distribution report; preserve Rung-2; no refit.

### Sprint S05 — Held-out split sealing

**Spec**: [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md) §"Sprint S05"
**Scope**: MEDIUM (5 tasks) · **Status**: planned · **Depends on**: S03, S04
**Purpose**: Declare + freeze a leakage-free `heldout-split.json` + sealed assignment; leakage audit; seal hashed into the manifest. No fit performed.

### Sprint S06 — Review / audit / closeout

**Spec**: [CYCLE-003-SPRINT-PLAN.md](CYCLE-003-SPRINT-PLAN.md) §"Sprint S06"
**Scope**: MEDIUM (5 tasks, incl. S06.E2E) · **Status**: planned · **Depends on**: S01–S05
**Purpose**: Honest-framing grep gate; frozen-invariant verification; record SC-8 explicit non-achievements; `CLOSEOUT.md`. No release.

### Optional (default-OFF, operator-gated)

- **S0X-T35** — T3/T5 diagnostic-only corpus expansion (OQ-6). Default: out of scope.
- **S0X-T4sec** — pre-2017 secondary-tier T4 events (OQ-3 / T4X-5). Default: underpowered + documented, no pre-2017.

---

## Command routing rule

When the operator invokes `/run sprint-plan`, `/run sprint-S0N`, `/implement sprint-S0N`, `/review-sprint sprint-S0N`, `/audit-sprint sprint-S0N`, or similar during CORONA cycle-003, resolve sprint IDs through **this** ledger and the cycle-003 sprint plan — not through the frozen cycle-001 sprint files or the cycle-002 ledger. Sprint IDs S01–S06 are cycle-local and do not consume the root `ledger.json` `global_sprint_counter`.

---

## Safety rule

If a command would write outside `grimoires/loa/a2a/cycle-003/` (the one exception being the SDD/sprint-authorized NEW `corpus-cycle-003/` tree), or would touch source/tests/scripts/manifests/runtime/RLMF, state that explicitly before proceeding.

Full path audit is required if:

- writing outside `grimoires/loa/a2a/cycle-003/` or the authorized `corpus-cycle-003/` tree
- editing an existing file
- touching source/tests/scripts/runtime/RLMF
- touching any **frozen** manifest (a NEW cycle-003 manifest in the new namespace is permitted per FR-C6-1 once the sprint plan authorizes it)
- detecting collision risk
- changing command routing or sprint ledger structure

The SDD §2 Layer-A/B replay+loader change (`t1-replay.js` / `t2-replay.js` / `corpus-loader.js`) is **HS-2** for cycle-003 — never performed under this ledger.
