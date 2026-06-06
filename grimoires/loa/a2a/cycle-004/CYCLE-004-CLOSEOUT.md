# CORONA Cycle-004 — Final Closeout

**Date:** 2026-06-06
**Cycle:** cycle-004 — deterministic T2 evidence-consumption wiring
**Status:** all three sprints complete, reviewed, audited, committed, pushed, integrated into `cycle-004`. Closeout documentation only — **no merge to main, no tag/release/version bump, no code change.**

> **Allowed posture (verbatim, SDD §15):** *"Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."*

---

## 1. Branch / commit state

| Field | Value |
|-------|-------|
| Closeout branch | `cycle-004-closeout-docs` (from `cycle-004`) |
| Final cycle-004 integration commit | **`eaf72324f34e379a52985d57c4d8294400814f49`** (`eaf7232`) |
| `cycle-004` / `origin/cycle-004` | `eaf7232` |
| `main` / `origin/main` | `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6` — **untouched** (cycle-004 not merged to main) |
| Worktree note | `cycle-004` is checked out in `.claude/worktrees/nice-jackson-df0b4b`; the closeout branch was created from the `cycle-004` ref without disturbing it. |

Sprint integration commits (fast-forward, single-parent, no merge commits):

| Sprint | Branch | Integrated at |
|--------|--------|---------------|
| Sprint 01 | `cycle-004-s01-baseline-harness` | `32b9dd8` |
| Sprint 02 | `cycle-004-s02-t2-evidence-wiring` | `2c83bc6` |
| Sprint 03 | `cycle-004-s03-proof-closeout` | `eaf7232` |

---

## 2. Sprint summary — what cycle-004 accomplished

**Sprint 01 — Baseline fixture + proof harness.** Captured `proof/baseline-hashes.json`
(60 events: 30 T1 + 30 T2) from the **unmodified** pre-cycle-004 replay, before any
source edit (OD-4), and stood up the no-scoring proof harness
`scripts/corona-backtest-cycle-004-evidence-wiring.js`. This is the immutable
pre-change reference fixture (committed-blob sha256 `538cba01…86d491`).

**Sprint 02 — T2 Layer-B + Layer-A opt-in evidence wiring.** Added additive,
field-gated `deriveEvidenceT2` (Layer B) in `corpus-loader.js` and an opt-in
(default-off) `wireEvidence` gate-processing loop (Layer A) in
`replay_T2_event`, consuming cycle-003's pre-cutoff `kp_observations[]` through the
existing, byte-frozen `processGeomagneticStormGate` with `quality.composite = 1.0`
(OD-1 neutral/default weight). Default-off is byte-identical to the pre-cycle-004
behavior by construction. **T1 untouched; no gate edit; no parameter change; no
scoring; `package.json` not edited.**

**Sprint 03 — Determinism, ablation, regression, proof closeout.** Extended the
harness to emit three deterministic proof states (baseline / wired / ablated) via a
`--state` selector; added 8 additive tests and the proof closeout. Proved the wiring
is real, deterministic, reversible, and side-effect-free.

---

## 3. Final result statement

- **T2 runtime evidence-consumption wiring is implemented and demonstrated
  deterministically.** wired ≠ ablated for the **corpus-derived strict-pre-cutoff T2
  set** (30/30 T2 events with ≥1 strictly-pre-cutoff Kp observation); the wired
  trajectory consumes the evidence through the unmodified gate (position_history
  grows by exactly the number of consumed bundles, current_position moves, every
  non-prior history entry maps to a consumed bundle) — genuine consumption, not
  metadata churn.
- **ablated == Sprint 01 baseline** for all 60 events (T1 30/30, T2 30/30), compared
  with the SPRINT-PLAN §6.10 line-ending-robust method (committed LF blob via
  `git cat-file` + canonical JSON parse) — **not** a raw working-tree diff. This is
  the reversibility guarantee: the opt-in wiring is a true no-op when off.
- **Replay-twice deterministic** (byte-identical within wired and ablated, including
  across separate processes).
- **T1 remains blocked / negative control** — raw `xray_flux_observations[]` cannot
  map to the `solar_flare`-event gate contract without inventing semantics. T1 wired
  == ablated == baseline (30/30); zero evidence consumed; `t1-replay.js` and
  `deriveEvidenceT1` byte-frozen.
- **cycle-002 frozen-corpus regression holds** — 15/15 (T1/T2/T4 × 5) trajectory
  hashes byte-identical to the committed cycle-002 manifest anchor; the additive/
  opt-in change did not perturb cycle-002.

This statement is a **deterministic wiring / consumption proof**. It is **not** a
calibration, `forecasting-accuracy`, `predictive-uplift`, or scoring result.

---

## 4. Proof artifact inventory

| Artifact | Role |
|----------|------|
| `proof/baseline-hashes.json` | Sprint 01 immutable pre-change reference (blob `538cba01…`) |
| `proof/wired-hashes.json` | Sprint 03 WIRED state (`wireEvidence:true`) |
| `proof/ablated-hashes.json` | Sprint 03 ABLATED state (`wireEvidence:false`) |
| `proof/PROOF-SUMMARY.md` | Hash tables, counts, identity assertions, §6.10 statement, full 30-event wired-vs-ablated list |

Per-sprint process artifacts: `sprint-01/`, `sprint-02/`, `sprint-03/`
(implementation-report + review-feedback + auditor-feedback + COMPLETED each;
sprint-03 also carries its own CLOSEOUT.md).

---

## 5. Invariant status (all preserved)

| Invariant | Value | Status |
|-----------|-------|--------|
| `package.json` | `version 0.2.0`, `dependencies {}` | ✓ unchanged (no bump, no dependency) |
| Tag / release / version bump | none for cycle-004 | ✓ none |
| Merge to main | none | ✓ `main` = `ccd6eea` untouched |
| I1 — `scripts/corona-backtest.js` sha256 | `17f6380b…1730f1` | ✓ preserved |
| cycle-003 corpus_hash | `7b6c5b48…d5003` | ✓ preserved (read-only input) |
| cycle-003 held-out seal | `f7a851…a5ea` | ✓ untouched |
| `src/theatres/*` gate logic | `flare-gate.js 377725ec…`, `geomag-gate.js 466ad282…` | ✓ called, never edited |
| RLMF certificate | `src/rlmf/certificates.js 0.1.0` (`eeef486c…`) | ✓ untouched |
| `t1-replay.js` (T1 blocked) | `9c46c8ad…` | ✓ frozen |
| Sprint 01 baseline fixture | `538cba01…86d491` | ✓ unchanged |

---

## 6. Claim ceiling (preserved)

Cycle-004 banks **no new rung** and advances **no theatre's rung**.

- **No** `calibration-improvement` claim.
- **No** `forecasting-accuracy` claim.
- **No** `predictive-uplift` claim.
- **No** `empirical-performance-improvement` claim.
- **No** `L2-readiness` / `publish-ready` claim.
- **No** `Baseline-A-vs-Baseline-B` or `new-corpus uplift` claim.
- **No** `T1/T2 runtime-sensitive` rung.

The historical claim ceiling stands unweakened: **CORONA demonstrated T4 runtime
sensitivity only** (cycle-002, Rung 2, T4 only). Published version remains **v0.2.0**.

---

## 7. Validation summary

| Check | Result |
|-------|--------|
| Sprint 03 explicit suite (8 tests) | pass (18/18 subtests) |
| Sprint 02 explicit suite (4 tests) | pass (19/19 subtests) |
| `npm test` (existing frozen suite) | pass (296/296) |
| I1 sha256 | `17f6380b…1730f1` |
| `package.json` | `0.2.0 {}` |
| Claim-grep gate | clean (0 violations) |

**Known npm-test cycle-002 provenance side-effect.** `npm test` updates provenance
fields (`replay_script_hash`, `code_revision`) in 5 cycle-002 files
(`cycle-002-run-2`/`run-3` `replay_script_hash.txt` + `sensitivity-summary.md`,
`cycle-002/runtime-replay-manifest.json`). These are **provenance-only** (no score,
sensitivity value, bucket, or corpus_hash change) and **must be restored via
`git restore` before staging** any commit. Trajectory hashes are independent of these
fields, so the regression proof is unaffected.

---

## 8. Final operator decisions still pending (separate from this closeout)

1. **Whether / when to merge `cycle-004` → `main`.** Not performed; `main` remains
   `ccd6eea`. This closeout does not start the merge flow.
2. **Whether the no-tag / no-release / no-version-bump posture remains final** for
   cycle-004 (current: v0.2.0, no tag).
3. **Whether to prune the sprint branches** (`cycle-004-s0N-*`) after any merge.
4. **Whether the optional `.gitattributes` proof-JSON `eol=lf` pin** should be done
   as a future, separately-authorized hygiene task (out of scope here; the §6.10
   robust comparison already resolves the risk on the durable LF blobs).

---

## 9. Next recommended operator action

1. **Review** this closeout doc + `CYCLE-004-CARRY-FORWARDS.md` + the SPRINT-LEDGER /
   NOTES updates.
2. **Audit** the closeout if desired.
3. Then **separately authorize the closeout commit** (these docs only).
4. Later, **separately authorize push / integration** of the closeout branch.
5. Later, **separately authorize the `cycle-004` → `main` merge** if desired (with its
   own pre-merge validation; the npm-test cycle-002 restore protocol applies).

No step beyond writing these closeout docs has been taken. Awaiting operator review.
