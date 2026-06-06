# CORONA Cycle-004 — Proof Summary (Sprint 03)

> **Theatre-qualified result (SDD §15):** *"T2 runtime evidence-consumption wiring is implemented and demonstrated deterministically (wired ≠ ablated, ablated == byte-identical baseline, replay-twice identical); T1 evidence-consumption wiring is honestly blocked (raw flux samples cannot map to the flare-event gate contract without inventing semantics) and serves as a negative control."*
>
> **Allowed posture (verbatim, SDD §15):** *"Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."*

This document is a **deterministic wiring proof**. It contains per-event SHA-256
trajectory-hash tables and identity assertions only. It computes **no score, no
Brier, no skill metric, no baseline delta, and runs no held-out evaluation.** No
rung is banked.

---

## 1. Proof states & artifacts

| State | Definition | Artifact |
|-------|-----------|----------|
| **WIRED** | T2 via `replay_T2_event(event, ctx, { wireEvidence: true })` | [`grimoires/loa/a2a/cycle-004/proof/wired-hashes.json`](wired-hashes.json) |
| **ABLATED** | T2 via `replay_T2_event(event, ctx, { wireEvidence: false })` | [`grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json`](ablated-hashes.json) |
| **BASELINE** | Sprint 01 committed fixture (unmodified replay; `replay_T2_event(event, ctx)`) | [`grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json`](baseline-hashes.json) |

In every state, **T1 is the negative control**: `replay_T1_event(event, ctx)` is
called with no options and consumes no evidence, so T1 hashes are identical
across all three states. Corpus: `grimoires/loa/calibration/corona/corpus-cycle-003`
(30 T1 + 30 T2 = 60 events). Harness:
`scripts/corona-backtest-cycle-004-evidence-wiring.js`
(`--state wired|ablated|baseline`).

Determinism note: `runtime_revision` is embedded in the hashed trajectory
(`meta.runtime_revision`), so all three states share the single
`cycle-004-s01-baseline` constant — the value frozen by the committed baseline.
This is why the T1 negative control and ablated==baseline identities hold.

---

## 2. Generating the states (no scoring)

```bash
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state wired   > grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state ablated > grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json
# BASELINE is the committed Sprint 01 fixture; --state baseline (or --emit-hashes) reproduces it byte-for-byte.
```

---

## 3. ablated == baseline (reversibility) — §6.10 line-ending-robust

**Result: PASS — ablated == committed Sprint 01 baseline for all 60 events
(T1 30/30, T2 30/30).**

**Comparison method (binding, SPRINT-PLAN §6.10 honored):** the authoritative gate
is `tests/replay-t2-ablated-equals-baseline-test.js`, which:

1. reads the **committed LF blob** via `git cat-file -p HEAD:…/baseline-hashes.json`
   (§6.10 **method 2**) — not the working-tree copy, which may be CRLF under
   `core.autocrlf=true`; and
2. `JSON.parse`s both sides and compares **canonical objects** (§6.10 **method 1**;
   line endings are inter-token whitespace, ignored by the parser).

A raw working-tree byte `diff` is **not** used as the authoritative gate. (A
convenience shell spot-check using `diff <(git cat-file -p HEAD:…baseline…) …`
compares LF-vs-LF per §6.10 method 2.)

This identity is the reversibility guarantee: the opt-in T2 wiring is a true
no-op when off. It is **not** a calibration, accuracy, or uplift claim.

---

## 4. T2 wired ≠ ablated (observable consumption) — explicit count + full list

**Result: 30 of 30 T2 events differ wired-vs-ablated.** Every T2 event carries a
`kp_observations[]` series with ≥1 strictly-pre-cutoff reading; the wired path
feeds those readings through the **unmodified** `processGeomagneticStormGate`
(advancing an injected clock), moving `position_history` / `current_position` —
so the trajectory hash changes. The diff set **equals** the independently-derived
set of T2 events with ≥1 strictly-pre-cutoff observation (asserted in
`tests/replay-t2-wired-vs-ablated-test.js`): this is genuine consumption, not a
metadata-only nudge. **No silent truncation — all 30 listed below.**

This count is a deterministic wiring-observability fact. It is **not** a rung, and **not** a `forecasting-accuracy`, `calibration-improvement`, or `predictive-uplift` result. No scoring.

| # | T2 event_id | wired hash (head) | ablated hash (head) |
|---|-------------|-------------------|---------------------|
| 1 | T2-2017-03-27-Kp6.33 | `5d719787e724…` | `075ad22da22f…` |
| 2 | T2-2017-05-28-Kp7 | `2ea0ade894b0…` | `0ce49b1f6a6c…` |
| 3 | T2-2017-09-08-Kp8.33 | `56a031abb3ee…` | `90a6680e3414…` |
| 4 | T2-2017-09-28-Kp6.67 | `e1555a39401a…` | `1dd98f760df1…` |
| 5 | T2-2017-11-07-Kp6.33 | `998cbac5859b…` | `4cc15379f628…` |
| 6 | T2-2018-08-26-Kp7.33 | `36655afa5c55…` | `40f4e78df9d2…` |
| 7 | T2-2021-05-12-Kp7 | `7caa04ee3789…` | `aa9a04ee8bd5…` |
| 8 | T2-2021-11-04-Kp7.67 | `19549a9e50e6…` | `26a520486368…` |
| 9 | T2-2022-04-10-Kp6.67 | `ac30769a2fc6…` | `d96ca35ac6ed…` |
| 10 | T2-2022-08-17-Kp6.67 | `f4b6d6e644ba…` | `604f8f2731f1…` |
| 11 | T2-2023-02-27-Kp6.67 | `3bc76885a724…` | `6788d8828ba6…` |
| 12 | T2-2023-03-24-Kp8 | `142cf7d9a410…` | `8e83c1a5f72a…` |
| 13 | T2-2023-04-23-Kp8.33 | `18765dbd67bf…` | `147f69331ee5…` |
| 14 | T2-2023-11-05-Kp7.33 | `76d7e2b6138b…` | `7f7f756e625d…` |
| 15 | T2-2023-12-01-Kp6.67 | `1ed3a173c53f…` | `4d691362056e…` |
| 16 | T2-2024-03-24-Kp8.33 | `6fd0c34cfea2…` | `c9440d04f06a…` |
| 17 | T2-2024-05-11-Kp9 | `5647695a361f…` | `134e247e135b…` |
| 18 | T2-2024-06-28-Kp7.67 | `46efc15c9e0a…` | `23e34a31bed7…` |
| 19 | T2-2024-08-12-Kp8 | `50117c433fde…` | `795473353d62…` |
| 20 | T2-2024-09-17-Kp7.33 | `42fd2b49d6e2…` | `10e740ed0832…` |
| 21 | T2-2024-10-10-Kp8.67 | `31e7abec6fbb…` | `8a6958bff4b1…` |
| 22 | T2-2025-01-01-Kp8 | `0ec9398aee64…` | `e5aea633eeb3…` |
| 23 | T2-2025-04-16-Kp7.67 | `c2da3a39836e…` | `7c03c08ba7f7…` |
| 24 | T2-2025-06-01-Kp7.67 | `744fe93c8db6…` | `9ad66802a392…` |
| 25 | T2-2025-06-13-Kp6.67 | `47de6b4ceaf6…` | `c225a85e4954…` |
| 26 | T2-2025-09-30-Kp7 | `7d029b03de7a…` | `9f64c0eb30bf…` |
| 27 | T2-2025-11-12-Kp8.67 | `6ddb12e0542e…` | `3a916b6a8ca4…` |
| 28 | T2-2026-01-19-Kp8.67 | `86893a8ab235…` | `846e9a2ad33f…` |
| 29 | T2-2026-03-21-Kp7 | `a5890744ce88…` | `182e208f5622…` |
| 30 | T2-2026-03-22-Kp7 | `be4229a7cb15…` | `4bf6583abc52…` |

---

## 5. T1 negative-control identity

**Result: PASS — T1 wired == ablated == baseline for all 30 T1 events; 0 evidence
consumed.** `tests/replay-t1-negative-control-test.js` asserts the three-state T1
hash identity, that every T1 trajectory carries an empty
`evidence_bundles_consumed`, and that `t1-replay.js` is byte-frozen (committed
blob `9c46c8ad…`). T1 is **blocked** (raw `xray_flux_observations[]` cannot map to
the `solar_flare`-event gate contract without inventing semantics) and is retained
as the negative control — no T1 wiring, no flux→solar_flare mapping, no
`deriveEvidenceT1` edit.

---

## 6. Replay-twice determinism

**Result: PASS.** `tests/replay-t2-determinism-wired-test.js` runs each of {wired,
ablated} twice and asserts byte-identical (and canonical-identical) emitted hash
tables within each state. A wall-clock or RNG dependency would make two runs
differ; none exists.

---

## 7. Frozen cycle-002 corpus regression (I5)

**Result: PASS — 15/15 (T1/T2/T4 × 5) byte-identical.**
`tests/cycle-002-frozen-corpus-regression-test.js` re-runs the **pure, file-free**
`dispatchCycle002Replay()` against the frozen cycle-002 corpus and asserts every
T1/T2/T4 trajectory hash equals the **frozen anchor** — the committed cycle-002
`runtime-replay-manifest.json` per-entry `trajectory_hashes` (read via
`git cat-file`). The Sprint-02 additive/opt-in change did not perturb cycle-002.
Trajectory hashes are independent of `replay_script_hash`/`code_revision`
(manifest provenance), so the Sprint-02 `replay_script_hash` churn does not affect
this comparison. The cycle-002 entrypoint is **not** edited and no frozen artifact
is mutated by the test.

---

## 8. No walltime / no random (I6)

**Result: PASS.** `tests/no-walltime-no-random-test.js`:
- **behavioral (authoritative):** stubs `Date.now` and `Math.random` to throw,
  then runs all three proof states (60 records each) with no throw; and
- **textual (defense-in-depth):** comment-stripped scan of the harness and the
  Sprint-02-changed `t2-replay.js` finds 0 real `Date.now(` / `Math.random(`
  calls (documentation/negation text excluded).

---

## 9. No parameter / gate / source invariant drift (no-refit)

**Result: PASS.** `tests/no-param-diff-test.js`:
- T1 gate params `{ threshold_class: 'M1.0', window_hours: 24 }`, T2 gate params
  `{ kp_threshold: 5, window_hours: 72 }` — unchanged;
- frozen committed-blob sha256 anchors hold: `src/theatres/flare-gate.js`
  `377725ec…`, `src/theatres/geomag-gate.js` `466ad282…`, `src/rlmf/certificates.js`
  `eeef486c…`, `t1-replay.js` `9c46c8ad…`;
- I1 (cycle-001 entrypoint) `17f6380b…1730f1`;
- `git diff --quiet HEAD` clean for the gate / certificate / package.json /
  t1-replay / cycle-001 + cycle-002 entrypoint surfaces;
- `package.json` `0.2.0` / `dependencies {}` (no version bump, no dependency added).

No threshold, `base_rate`, sigma, lambda, or formula surface changed. No gate edited.

---

## 10. Claim-grep gate

**Result: CLEAN — 24 files swept, 0 forbidden-positive-claim violations.**
`tests/claim-grep-gate-test.js` sweeps the cycle-004 artifacts, the harness, and
the Sprint 03 tests; the SDD §15 forbidden phrases appear only as negations,
forbidden-list definitions / quoted mentions, or historical-ceiling statements.
(Verified to have teeth: a scratch file carrying a bare positive claim is flagged.)

---

## 11. Scope discipline — what this proof is NOT

- **No scoring, no Brier, no skill metric, no baseline delta, no held-out
  evaluation, no Baseline-A-vs-Baseline-B comparison.**
- **No rung is banked.** Cycle-002's historical ceiling — **CORONA demonstrated
  T4 runtime sensitivity only** — remains unchanged.
- No T1 unblock; no T4 fetch/unblock; no external data; no tag / release /
  version bump / commit / push performed by this sprint.

---

## 12. Validation index (exact commands)

```bash
# three states
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state wired   > grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
node scripts/corona-backtest-cycle-004-evidence-wiring.js --state ablated > grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json

# Sprint 03 suite (18/18 pass)
node --test tests/replay-t2-determinism-wired-test.js tests/replay-t2-wired-vs-ablated-test.js \
  tests/replay-t2-ablated-equals-baseline-test.js tests/replay-t1-negative-control-test.js \
  tests/cycle-002-frozen-corpus-regression-test.js tests/no-walltime-no-random-test.js \
  tests/no-param-diff-test.js tests/claim-grep-gate-test.js

# Sprint 02 suite (19/19 pass) + existing suite (296/296 pass)
node --test tests/corpus-loader-t2-precutoff-test.js tests/corpus-loader-t2-gfz-lag-test.js \
  tests/replay-t2-genuine-consumption-test.js tests/layer-ab-agreement-test.js
npm test

# frozen invariants
git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum   # 17f6380b…1730f1
node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"   # 0.2.0 {}
```

`npm test` updates cycle-002 provenance fields (`replay_script_hash`,
`code_revision`) in 5 cycle-002 files; these are provenance-only and were restored
via `git restore` (no score / sensitivity / bucket / corpus-hash value changed).
