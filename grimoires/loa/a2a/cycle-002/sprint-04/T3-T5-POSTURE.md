# CORONA cycle-002 Sprint 04 — T3 / T5 Posture (Option A)

**Status**: Ratified posture document. Sprint 04 binding deliverable.
**Authored**: 2026-05-02
**Cycle / Sprint**: cycle-002 / sprint-04
**Routing**: cycle-002 [SPRINT-LEDGER.md](../SPRINT-LEDGER.md) (operator ratification: this sprint executes under Option A only).
**Predecessors**: cycle-002 [PRD.md](../PRD.md), [SDD.md](../SDD.md), [CYCLE-002-SPRINT-PLAN.md §4.2](../CYCLE-002-SPRINT-PLAN.md), [sprint-00/CHARTER.md §1 Q2/Q3 + §4 + §4.1](../sprint-00/CHARTER.md), [sprint-01/CONTRACT.md §5 + §13](../sprint-01/CONTRACT.md), [sprint-03/auditor-sprint-feedback.md](../sprint-03/auditor-sprint-feedback.md) (APPROVED).

> This document locks the binding T3 and T5 posture for cycle-002. Sprint 06 closeout artifacts cite the language at [§4](#4-sprint-06-citation-block) verbatim. Option B (T5 trajectory emit) is **closed for cycle-002** — no operator ratification line authorizing Option B has been issued; absent that line, Option A is binding per the cycle-002 sprint plan §4.2.2 #2.

---

## 1. T3 posture — `[external-model]`

| Field | Binding value |
|-------|---------------|
| Posture tag | `[external-model]` |
| Canonical/external prediction source | NASA DONKI WSA-Enlil ensemble (`wsa_enlil_predicted_arrival_time` field on each T3 corpus event) |
| CORONA ownership of CME-arrival prediction quality in cycle-002 | NONE. CORONA does not predict CME arrival in cycle-002. The prediction lives in the corpus; CORONA wraps it with uncertainty pricing. |
| Reportable in diagnostic summaries | YES |
| Counts toward runtime-uplift composite | NO |
| Citable as CORONA-owned predictive uplift | NO |

### 1.1 Rationale

Per cycle-002 [PRD §8 Theatre posture](../PRD.md) row T3, [CHARTER §1 Q2](../sprint-00/CHARTER.md), and [CONTRACT §5 row T3](../sprint-01/CONTRACT.md): CORONA does NOT emit a T3 prediction. The corpus's `wsa_enlil_predicted_arrival_time` field IS the prediction; cycle-002 backtest scoring of T3 measures WSA-Enlil's accuracy against the L1 shock observation, plus CORONA's uncertainty-pricing wrapper. Neither is CORONA-owned predictive uplift.

The T3 scoring path at [scripts/corona-backtest/scoring/t3-timing-error.js](../../../../../scripts/corona-backtest/scoring/t3-timing-error.js) is unchanged in cycle-002. The cycle-002 entrypoint at [scripts/corona-backtest-cycle-002.js](../../../../../scripts/corona-backtest-cycle-002.js) routes T3 through this unchanged scorer ([entrypoint:208 + 286](../../../../../scripts/corona-backtest-cycle-002.js)).

### 1.2 Reporting boundary

- T3 numerics appear in cycle-002-run-N/`diagnostic-summary.md` ONLY (every section/table tagged `[diagnostic]` per cycle-002 [SDD §4](../SDD.md) and the cycle-002 sprint-03 reporting helper at [scripts/corona-backtest/reporting/diagnostic-summary.js](../../../../../scripts/corona-backtest/reporting/diagnostic-summary.js)).
- T3 numerics MUST NOT appear in cycle-002-run-N/`runtime-uplift-summary.md` — that summary covers T1+T2+T4 ONLY per [CHARTER §4.1](../sprint-00/CHARTER.md) operator amendment 1, enforced by `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']` at [scripts/corona-backtest/reporting/runtime-uplift-summary.js:26](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js).
- The cycle-002 manifest at [grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json](../../../../calibration/corona/cycle-002/runtime-replay-manifest.json) records the T3 entry with `included_in_runtime_uplift_composite: false` and `diagnostic_only: true`.

### 1.3 Forbidden T3 framings (cycle-002)

- "CORONA's T3 prediction" — CORONA does not predict T3 in cycle-002.
- "T3 calibration improved" — Q2 forbids; T3 is external-model, not CORONA-owned.
- "T3 contributed to runtime-uplift" — T3 is excluded by construction.
- Citing T3 numerics as evidence of CORONA's predictive performance.

---

## 2. T5 posture — `[quality-of-behavior]`

| Field | Binding value |
|-------|---------------|
| Posture tag | `[quality-of-behavior]` |
| Settlement type in cycle-002 | Quality-of-behavior. Settlement metrics: false-positive rate (`fp_rate`), stale-feed detection latency (`stale_feed_p50_seconds` / `stale_feed_p95_seconds`), satellite-switch handling rate (`satellite_switch_handled_rate`), hit-rate diagnostic (`hit_rate_diagnostic`). |
| External probabilistic ground truth available | NONE in cycle-002. |
| Reportable in diagnostic summaries | YES |
| Counts toward runtime-uplift composite | NO |
| Convertible to probabilistic Brier uplift | NO |

### 2.1 Rationale

Per cycle-002 [PRD §8 Theatre posture](../PRD.md) row T5, [CHARTER §1 Q3](../sprint-00/CHARTER.md), and [CONTRACT §5 row T5](../sprint-01/CONTRACT.md): T5 has no external probabilistic ground truth. The meaningful settlement is quality-of-behavior — the four metrics listed above. Converting T5 to a probabilistic-Brier uplift theatre is forbidden by Q3 and would require a charter amendment.

The T5 scoring path at [scripts/corona-backtest/scoring/t5-quality-of-behavior.js](../../../../../scripts/corona-backtest/scoring/t5-quality-of-behavior.js) is unchanged in cycle-002. The cycle-002 entrypoint at [scripts/corona-backtest-cycle-002.js](../../../../../scripts/corona-backtest-cycle-002.js) routes T5 through this unchanged scorer ([entrypoint:210 + 288](../../../../../scripts/corona-backtest-cycle-002.js)).

### 2.2 Reporting boundary

- T5 numerics appear in cycle-002-run-N/`diagnostic-summary.md` ONLY (every section/table tagged `[diagnostic]`).
- T5 numerics MUST NOT appear in cycle-002-run-N/`runtime-uplift-summary.md` — that summary covers T1+T2+T4 ONLY.
- The cycle-002 manifest records the T5 entry with `included_in_runtime_uplift_composite: false` and `diagnostic_only: true`.

### 2.3 Forbidden T5 framings (cycle-002)

- "T5 calibration improved" — Q3 forbids; T5 is quality-of-behavior, not probabilistic-Brier.
- "T5 contributed to runtime-uplift" — T5 is excluded by construction.
- "T5 Brier" / "T5 probabilistic uplift" — T5 emits no probabilistic prediction in cycle-002.
- Citing T5 quality-of-behavior numerics as if they were predictive-uplift evidence.

---

## 3. Option A decision (binding for cycle-002)

| Field | Decision |
|-------|----------|
| T5 trajectory emission for cycle-002 | DEFERRED. |
| `replay_T5_event` module under `scripts/corona-backtest/replay/` | DOES NOT EXIST and MUST NOT BE CREATED in Sprint 04. |
| Existing T5 scoring numerics (`fp_rate`, `stale_feed_p50_seconds`, `stale_feed_p95_seconds`, `satellite_switch_handled_rate`, `hit_rate_diagnostic`) | UNCHANGED. |
| Source/runtime change required | NONE. `src/` is not modified by Sprint 04. |
| `src/theatres/solar-wind-divergence.js` zero-diff | YES. Structural invariant of Option A. |
| `src/theatres/cme-arrival.js` zero-diff | YES. T3 source freeze. |
| Tests added | NONE. No T5 replay tests. Test totals stay at 279/279 (Sprint 02 baseline 261 + Sprint 03 cycle-002 entrypoint 18). |
| Manifests modified | NONE. Cycle-001 calibration manifest immutable; cycle-002 manifest not regenerated by Sprint 04. |

### 3.1 Why Option A is the default (and binding for cycle-002)

Per cycle-002 [sprint plan §4.2.2 #2](../CYCLE-002-SPRINT-PLAN.md):

- **Smallest scope**. Sprint 04 ships docs only. Zero risk to the existing T5 settlement-authority numerics.
- **Preserves cycle-001 honest-framing posture**. The "calibration-attempted, not improved" framing of v0.2.0 is unchanged.
- **T5 replay-trace-aware diagnostic remains a future-cycle item** if it ever becomes interesting. Cycle-002 does not require it.

Per cycle-002 [sprint plan §4.2.2 #2](../CYCLE-002-SPRINT-PLAN.md) "Option B (T5 diagnostic trajectory emit) is ratification-gated and only opens if the operator explicitly authorizes it at Sprint 04 entry. Absent that authorization, Sprint 04 ships Option A and Option B is closed for cycle-002." **No operator ratification line authorizing Option B has been issued for Sprint 04. Option A is binding.**

### 3.2 What Sprint 04 does NOT do (per Option A)

- Does NOT create `scripts/corona-backtest/replay/t5-replay.js`.
- Does NOT touch `src/theatres/solar-wind-divergence.js`.
- Does NOT touch `src/theatres/cme-arrival.js`.
- Does NOT touch `scripts/corona-backtest/scoring/t3-timing-error.js`.
- Does NOT touch `scripts/corona-backtest/scoring/t5-quality-of-behavior.js`.
- Does NOT add or modify any test.
- Does NOT mutate the cycle-001 calibration manifest at `grimoires/loa/calibration/corona/calibration-manifest.json`.
- Does NOT mutate the cycle-002 additive manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`.
- Does NOT bump `package.json` version (stays at `0.2.0`).
- Does NOT add a new dependency (`dependencies: {}` invariant preserved).
- Does NOT touch `BUTTERFREEZONE.md` or `README.md` (those are Sprint 06 closeout territory).
- Does NOT start Sprint 05.

### 3.3 Theatre-authority addendum

Per cycle-002 [sprint plan §4.2.2 #3](../CYCLE-002-SPRINT-PLAN.md): an additive entry at `grimoires/loa/calibration/corona/theatre-authority.md` is permitted ONLY if Sprint 04 explicitly authorizes it. Sprint 04 does NOT authorize an addendum to that file. The T3/T5 posture is locked here in `T3-T5-POSTURE.md` instead, in the cycle-002 namespace, leaving the cycle-001 `theatre-authority.md` frozen as historical evidence.

---

## 4. Sprint 06 citation block

Sprint 06 closeout artifacts (`CLOSEOUT.md`, conditional README/BFZ additive cycle-002 sections, conditional v0.3.0 tag message — only if Rung 4 earned) cite the following sentences VERBATIM. Each sentence is the binding closeout-discipline framing for cycle-002.

> "T3 [external-model] is not counted toward CORONA-owned predictive uplift."

> "T5 [quality-of-behavior] is not counted toward CORONA-owned predictive uplift."

> "Cycle-002 runtime-uplift claims are restricted to T1/T2/T4, with T4 as the clean owned-uplift theatre."

> "T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape and cannot claim calibration improvement in cycle-002."

These four sentences are the cycle-002 honest-framing perimeter for T3/T5 and for T1/T2. Sprint 06 may extend them with theatre-qualified Rung-3 language IF and ONLY IF Rung 3 has been earned by Sprint 05 sensitivity-proof + post-refit Brier evidence (per [CHARTER §10](../sprint-00/CHARTER.md)). Sprint 06 may NOT weaken any of the four sentences above.

### 4.1 Honest-framing grep gate (binding)

The cycle-001 honest-framing memory binding carries forward in full. On every cycle-002 closeout artifact, the following grep MUST return only NEGATIONS, source-code-guard text, or zero matches outside an explicit theatre-qualified Baseline-B-citing claim section:

```bash
grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"
```

Any positive match in non-claim prose is a hard stop per cycle-002 [PRD §10.1](../PRD.md). The four sentences above are the binding sufficient framing — Sprint 06 may NOT introduce phrasings that elide them.

---

## 5. Hard stops (binding for Sprint 04 + onward)

Per operator instruction and cycle-002 [sprint plan §4.2.9](../CYCLE-002-SPRINT-PLAN.md):

| # | Hard stop | Triggered by |
|---|-----------|--------------|
| HS-1 | Any change request that would cause T3 or T5 to be counted toward predictive uplift | Adding T3/T5 to `RUNTIME_UPLIFT_THEATRES`, including them in the runtime-uplift composite summary, or citing them as CORONA-owned predictive uplift in any cycle-002 artifact. |
| HS-2 | Any change to T3 / T5 scoring numerics (must stay byte-stable) | Editing `scripts/corona-backtest/scoring/t3-timing-error.js` or `scripts/corona-backtest/scoring/t5-quality-of-behavior.js`. |
| HS-3 | Any decision to widen CORONA scope to emit a T3 prediction (Q2 forbids; would require charter amendment) | Adding a CORONA-owned T3 prediction emission anywhere in `src/`. |
| HS-4 | Any change to `src/rlmf/certificates.js` | RLMF cert is frozen at `version: '0.1.0'` per [CHARTER §1 Q1](../sprint-00/CHARTER.md). |
| HS-5 | Option B work begun without an explicit operator ratification line in `T3-T5-POSTURE.md` authorizing it | Creating `scripts/corona-backtest/replay/t5-replay.js`, editing `src/theatres/solar-wind-divergence.js`, or adding T5-replay tests under Option A. HALT and return to Option A default. |
| HS-6 | Any cycle-001 artifact mutation | Editing `scripts/corona-backtest.js`, the cycle-001 calibration manifest, cycle-001 sprint folders, or cycle-001 run outputs. Sprint 03 already established and verified the byte-freeze of these artifacts; Sprint 04 inherits the freeze. |
| HS-7 | Any README/BFZ/version/tag work | These are Sprint 06 closeout territory only, conditional on Rung 4. |
| HS-8 | Starting Sprint 05 | Sprint 05 (sensitivity proof) starts only after Sprint 04 commit gate. |

When any hard stop triggers, the implementing skill HALTS, surfaces the situation in writing, and awaits operator instruction. Hard stops are not advisory.

---

## 6. Cross-references

- [SPRINT-LEDGER.md](../SPRINT-LEDGER.md) — cycle-002 routing source of truth.
- [PRD.md §8 Theatre posture](../PRD.md) — binding posture table for all five theatres.
- [SDD.md §4 Two-summary reporting architecture](../SDD.md) — two-summary discipline that excludes T3/T5 from the runtime-uplift composite.
- [CHARTER.md §1 Q2 / Q3 / §4 / §4.1](../sprint-00/CHARTER.md) — T3/T5 posture decisions and operator amendment 1.
- [CONTRACT.md §5 + §13](../sprint-01/CONTRACT.md) — `corpus_anchored_external` (T3) and `quality_of_behavior` (T5) trajectory shapes; T5 trajectory emit deferred per §13.
- [REPLAY-SEAM.md](../sprint-02/REPLAY-SEAM.md) — Sprint 02 design that ships T1/T2/T4 replay modules; T3/T5 replay modules NOT shipped.
- [sprint-03/reviewer.md](../sprint-03/reviewer.md), [sprint-03/engineer-feedback.md](../sprint-03/engineer-feedback.md), [sprint-03/auditor-sprint-feedback.md](../sprint-03/auditor-sprint-feedback.md), [sprint-03/COMPLETED](../sprint-03/COMPLETED) — Sprint 03 closeout that wires T3/T5 dispatch through unchanged scorers and excludes them from the runtime-uplift composite.
- [scripts/corona-backtest/reporting/runtime-uplift-summary.js](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js) — `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']` constant that enforces T3/T5 exclusion at code-render time.
- [scripts/corona-backtest/reporting/diagnostic-summary.js](../../../../../scripts/corona-backtest/reporting/diagnostic-summary.js) — `DIAGNOSTIC_THEATRES = ['T1','T2','T3','T4','T5']` constant + every section/table tagged `[diagnostic]`.

---

*T3/T5 posture document authored 2026-05-02 against operator-ratified Option A default. T5 trajectory emission deferred for cycle-002. No source/runtime/scoring/manifest changes. Sprint 06 citation block locked. Honest-framing memory binding governs.*
