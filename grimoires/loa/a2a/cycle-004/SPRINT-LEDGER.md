# CORONA cycle-004 Sprint Ledger

## Purpose

This ledger governs CORONA cycle-004 only.

Cycle-001, cycle-002, and cycle-003 artifacts remain frozen historical records and must not be overwritten, renamed, or treated as active sprint targets.

### Frozen cycle-001 / cycle-002 / cycle-003 references

- `grimoires/loa/prd.md`, `grimoires/loa/sdd.md`, `grimoires/loa/sprint.md`
- `grimoires/loa/ledger.json` (frozen at cycle-001; cycle-004 does NOT update it)
- `grimoires/loa/a2a/sprint-0/` through `grimoires/loa/a2a/sprint-7/` (cycle-001)
- `grimoires/loa/a2a/cycle-002/` (entire cycle-002 namespace)
- `grimoires/loa/a2a/cycle-003/` (entire cycle-003 namespace)
- `grimoires/loa/calibration/corona/calibration-manifest.json` (cycle-001)
- `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` (cycle-002)
- `grimoires/loa/calibration/corona/corpus/` + `corpus_hash b1caef3f…11bb1` (frozen cycle-001 corpus tree)
- `grimoires/loa/calibration/corona/corpus-cycle-003/` + `corpus_hash 7b6c5b48…d5003` (cycle-003 corpus tree — read-only input to cycle-004)
- cycle-003 held-out seal `f7a851…a5ea`
- `scripts/corona-backtest.js` (sha256 `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1`)
- `scripts/corona-backtest-cycle-002.js` (cycle-002 entrypoint — read-only; used only as the frozen-corpus regression harness)
- `src/rlmf/certificates.js` (`version: '0.1.0'`)
- `src/theatres/*` (all gate logic/params — **called**, never edited)
- `scripts/corona-backtest/replay/t1-replay.js` + `deriveEvidenceT1` (T1 BLOCKED — never edited under this ledger)
- `package.json` (`version: 0.2.0`, `dependencies: {}`, `scripts.test` — never edited)
- cycle-001 / cycle-002 / cycle-003 run outputs

### Active cycle-004 namespace

`grimoires/loa/a2a/cycle-004/`

Proof artifacts: `grimoires/loa/a2a/cycle-004/proof/`. Per-sprint process artifacts: `grimoires/loa/a2a/cycle-004/sprint-NN/`.

The authorized cycle-004 **source** write surface lives OUTSIDE the grimoire namespace and is the explicitly-named exception (the Layer-A/B change cycle-003 deferred as HS-2):

- `scripts/corona-backtest/ingestors/corpus-loader.js` — **`deriveEvidenceT2` only** (additive, field-gated). `deriveEvidenceT1` stays frozen.
- `scripts/corona-backtest/replay/t2-replay.js` — **`replay_T2_event` only** (additive, opt-in `wireEvidence`). `t1-replay.js` stays frozen.
- `scripts/corona-backtest-cycle-004-evidence-wiring.js` — **new** entrypoint, no scoring.
- New additive tests under `tests/` (run via explicit `node --test …`; **never** registered in `package.json`).

---

## Cycle posture (binding)

Cycle-002 closed at **Rung 2 (runtime-sensitive, T4 only)**; published version **v0.2.0**. Cycle-003 earned **no rung** (corpus-substrate cycle).

Cycle-004 is a **deterministic T2 evidence-consumption wiring cycle**. It is theatre-qualified:

- **T2 = primary implementation target** — wire Layer-B + Layer-A to consume cycle-003's pre-cutoff `kp_observations[]` through the existing, byte-frozen `processGeomagneticStormGate`.
- **T1 = BLOCKED / negative control** — raw `xray_flux_observations[]` flux samples cannot map to the `solar_flare`-event gate contract without inventing semantics or editing the gate (both forbidden). T1 source unchanged.
- **T4 = deferred** to a separate operator-gated cycle.

Cycle-004 earns **no new rung** and advances **no theatre's rung**. It is NOT a calibration/refit cycle, NOT a scoring/evaluation cycle, NOT an L2 publish-ready cycle, NOT a release. The historical claim ceiling stands unweakened: **"CORONA demonstrated T4 runtime sensitivity only."**

Allowed posture (verbatim, SDD §15 — carried into every report + the closeout):

> "Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."

### Operator decisions (resolved)

- **OD-1** — `quality.composite = 1.0`, phrased as "a uniform neutral/default runtime quality weight required by the existing T2 gate contract." NOT source-derived, NOT in the corpus, NOT fitted/tuned/optimized/quality-measured, NOT a parameter-refit.
- **OD-2** — `package.json` NOT edited; new tests run via explicit `node --test …`, documented in reports.
- **OD-3** — T1 BLOCKED / negative-control only; no T1 wiring or edit; no flux→`solar_flare` mapping.
- **OD-4** — `proof/baseline-hashes.json` captured from the unmodified pre-cycle-004 replay **before** any source edit (Sprint 01's first load-bearing step).

---

## Sprint index

**Cycle status (2026-06-06):** all three sprints complete, reviewed, audited, committed, pushed, and integrated into `cycle-004` @ `eaf7232`. Closeout documentation in progress ([CYCLE-004-CLOSEOUT.md](CYCLE-004-CLOSEOUT.md) + [CYCLE-004-CARRY-FORWARDS.md](CYCLE-004-CARRY-FORWARDS.md)). No merge to `main` (`ccd6eea`); no tag/release/version bump; **v0.2.0**; **no new rung banked**.

### Sprint 00 — (none; charter optional)

No charter for cycle-004 unless the operator explicitly requests one. The binding cycle-004 spec set is [PRD.md](PRD.md) + [SDD.md](SDD.md) + [CYCLE-004-SPRINT-PLAN.md](CYCLE-004-SPRINT-PLAN.md), consistent with the cycle-002/cycle-003 operator-ratified precedent (no separate per-sprint spec doc required).

### Sprint 01 — Baseline fixture + proof-harness skeleton

**Spec**: [CYCLE-004-SPRINT-PLAN.md](CYCLE-004-SPRINT-PLAN.md) §4
**Scope**: SMALL (3 tasks) · **Status**: complete / integrated at `32b9dd8` · **Depends on**: none
**Branch**: `cycle-004-s01-baseline-harness`
**Purpose**: Capture `proof/baseline-hashes.json` from the unmodified pre-cycle-004 replay (before any source edit — OD-4); stand up the no-scoring proof-harness skeleton. **No T2 wiring; no T1 edit; no scoring.**

### Sprint 02 — T2 Layer-B + Layer-A evidence wiring

**Spec**: [CYCLE-004-SPRINT-PLAN.md](CYCLE-004-SPRINT-PLAN.md) §5
**Scope**: MEDIUM (5 tasks) · **Status**: complete / integrated at `2c83bc6` · **Depends on**: Sprint 01 (baseline must precede edits)
**Branch**: `cycle-004-s02-t2-evidence-wiring`
**Purpose**: Additive, field-gated `deriveEvidenceT2` (Layer B) + opt-in (default-off) `replay_T2_event` gate-processing loop (Layer A) consuming `kp_observations[]` through `processGeomagneticStormGate`; `quality.composite = 1.0` per OD-1. **No T1 wiring; no gate edit; no param change; no scoring; no `package.json` edit.**

### Sprint 03 — Determinism, ablation, regression, proof closeout

**Spec**: [CYCLE-004-SPRINT-PLAN.md](CYCLE-004-SPRINT-PLAN.md) §6
**Scope**: MEDIUM (8 tasks) · **Status**: complete / integrated at `eaf7232` · **Depends on**: Sprint 02 (wiring) + Sprint 01 (baseline)
**Branch**: `cycle-004-s03-proof-closeout`
**Purpose**: Prove wired ≠ ablated, ablated == baseline, replay-twice byte-identical, T1 negative-control identity, cycle-002 frozen-corpus regression byte-identical; claim-grep gate; honest no-rung proof closeout. **No scoring/Brier/skill; no held-out eval; no cross-regime delta; no T1/T4 unblock; no refit; no tag/release/bump.**

### Optional (default-OFF, operator-gated; NOT part of cycle-004)

- **T1 native-`xray_flux` gate evidence type** — a future, separately-gated cycle with its own SDD + gate-edit authorization (SDD §5.5a). Out of scope here.
- **Pre-cutoff flare-*event* corpus for T1** — a future corpus cycle matching the `solar_flare` bundle contract (SDD §5.5b). Out of scope here.
- **T4 raw-proton-flux unblock** — a separate operator-gated, externally-dependent cycle (PRD §6 / OQ-9). Out of scope here.

---

## Command routing rule

When the operator invokes `/run sprint-plan`, `/run sprint-NN`, `/implement sprint-NN`, `/review-sprint sprint-NN`, `/audit-sprint sprint-NN`, or similar during CORONA cycle-004, resolve sprint IDs through **this** ledger and the cycle-004 sprint plan — not through the frozen cycle-001 sprint files, the cycle-002 ledger, or the cycle-003 ledger. Sprint IDs 01–03 are cycle-local and do **not** consume the root `ledger.json` `global_sprint_counter`.

---

## Review / audit / approval discipline (binding)

Every sprint: `/implement` → `/review-sprint` → fixes → `/audit-sprint` → **operator HITL approval** → **commit only after explicit approval** → **push only after explicit approval**. Never ad-hoc implementation; never skip review/audit (PRD AC9). See sprint plan §7.

---

## Branch discipline

Keep `cycle-004` separate from `main` (currently `ccd6eea`) until final closeout. Sprint branches use **non-slash** names (`cycle-004-s0N-*`) to avoid git ref conflicts with the existing `cycle-004` branch. No final merge to `main` until cycle closeout and explicit operator approval. No tag/release/version bump.

---

## Safety rule

If a command would write outside `grimoires/loa/a2a/cycle-004/` — the only exceptions being the four explicitly-authorized source items (`corpus-loader.js::deriveEvidenceT2`, `t2-replay.js::replay_T2_event`, the new `corona-backtest-cycle-004-evidence-wiring.js` entrypoint, and new `tests/*`) — or would touch any **frozen** artifact, state that explicitly before proceeding.

Full path audit is required if:

- writing outside `grimoires/loa/a2a/cycle-004/` or the four authorized source items
- editing an existing file
- touching any `src/theatres/*` gate (FORBIDDEN — gates are called, not edited)
- touching `t1-replay.js`, `deriveEvidenceT1`, or attempting any flux→`solar_flare` mapping (FORBIDDEN — T1 BLOCKED, HS-9)
- touching `scripts/corona-backtest.js` (I1), `scripts/corona-backtest-cycle-002.js`, `src/rlmf/certificates.js`, or `package.json` (all FORBIDDEN)
- touching any frozen manifest, cycle-001/002/003 record, or the held-out seal
- changing a runtime parameter / threshold / `base_rate` / σ / λ / formula (FORBIDDEN — no-refit, HS-1)
- introducing any scoring / Brier / baseline-delta / external fetch / rung-banking (FORBIDDEN — HS-10)
- detecting collision risk
- changing command routing or sprint ledger structure

Note: the SDD §2 Layer-A/B replay+loader change that was **HS-2 under the cycle-003 ledger** is, for cycle-004, the **authorized mission — but only for T2** (`deriveEvidenceT2` + `replay_T2_event`). The T1 half of that change (`deriveEvidenceT1` + `t1-replay.js`) remains forbidden (T1 BLOCKED).

---

*End of cycle-004 sprint ledger (draft). No code, commit, tag, release, version bump, or `main`/prior-cycle mutation was produced by this document. Awaiting operator review.*
