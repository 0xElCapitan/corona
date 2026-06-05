# CORONA Cycle-004 — Sprint 02 Security & Quality Audit

> **Auditor:** Paranoid Cypherpunk Auditor (`/audit-sprint sprint-02`) — final gate.
> **Sprint:** 02 — T2 Layer-B + Layer-A evidence wiring (opt-in, default-off).
> **Branch:** `cycle-004-s02-t2-evidence-wiring` @ `32b9dd8abdd4c1e355fcb20ed6a8d75664d2c7de` (no commit, no push).
> **Base:** `cycle-004` @ `32b9dd8`. **main / origin/main:** `ccd6eea` (untouched).
> **Method:** Independent objective recompute. Neither the implementation report nor the review verdict was taken on trust; both decisive claims were re-derived in-process, every validation command re-run, and an additional negative control (wall-clock/random stubbed-to-throw) and a T4-parity behavioral test were executed beyond the review scope. *(Conflict-of-interest note: same agent authored implementation + review + audit this session; the audit therefore leans on machine-checkable recomputation rather than narrative trust.)*
> **Date:** 2026-06-05.

---

## VERDICT: ✅ PASS — APPROVED

Sprint 02 implements exactly the authorized, additive, opt-in (default-off) T2 Layer-B + Layer-A evidence-consumption wiring. The wiring is **genuine** (real `processGeomagneticStormGate` consumption, machine-verified across all 30 T2-with-observation events — not metadata-only), **deterministic by construction** (proven with wall-clock/random disabled), and **fully reversible** (default-off output byte-identical to the committed Sprint-01 baseline for all 60 events). T1 is an untouched negative control. No gate/parameter/threshold/scoring change; no frozen-invariant violation; no forbidden-path edit; no claim drift; **no hard stop**. The three non-blocking review concerns are adjudicated below — none is a Sprint-02 blocker. **No fix is required before operator approval / commit.** `COMPLETED` marker written.

---

## 1. Files Inspected

| File | Inspection |
|------|-----------|
| `scripts/corona-backtest/ingestors/corpus-loader.js` | full `git diff`; helper semantics; `deriveEvidenceT2` field-gating; `deriveEvidenceT1` byte-extraction; settlement preservation; export block; T4-parity behavioral test |
| `scripts/corona-backtest/replay/t2-replay.js` | full `git diff`; options bag / default-off path; wired loop; bundle payload (lines 130-147); imports; OD-1 wording (line-joined); wall-clock negative control |
| `tests/{corpus-loader-t2-precutoff,corpus-loader-t2-gfz-lag,replay-t2-genuine-consumption,layer-ab-agreement}-test.js` | assertion presence; `node --test` run; independent recompute corroboration |
| `grimoires/loa/a2a/cycle-004/sprint-02/{implementation-report,review-feedback}.md` | required-element presence; verbatim posture; claim adjudication |
| `src/theatres/{geomag-gate,flare-gate}.js`, `src/processor/uncertainty.js`, `t1-replay.js`, `corona-backtest{,-cycle-002}.js`, `src/rlmf/certificates.js` | unchanged-vs-HEAD confirmation |
| PRD.md, SDD.md §6-§9, CYCLE-004-SPRINT-PLAN.md §5, SPRINT-LEDGER.md, sprint-01/{impl,review,auditor} | binding scope / ACs / carry-forward |

**Report integrity (objective 1):** both the implementation report and the review feedback contain all required elements — active branch, HEAD, base, exact files, implementation summary, validation outputs, npm side-effect treatment, forbidden-path audit, frozen-invariant checks, `package.json` unchanged, `src/theatres/*` unchanged, `t1-replay.js` + `deriveEvidenceT1` unchanged, claim-grep, hard-stop status, no-commit/push. The implementation report carries a complete `## AC Verification` (10/10 Met). **Both reports: COMPLETE.**

---

## 2. Exact Commands Run + Outputs

| Command | Result |
|---------|--------|
| `git rev-parse HEAD / cycle-004 / origin/cycle-004 / main / origin/main` | `32b9dd8` / `32b9dd8` / `32b9dd8` / `ccd6eea` / `ccd6eea` ✓ |
| `git rev-list --count cycle-004..HEAD` ; `--left-right origin/cycle-004...HEAD` | **0** ; **0 0** (no commit, no push) ✓ |
| `git reflog -3` | last op = checkout to S02 branch; no sneaky commit/reset ✓ |
| in-process: modified default-off table vs committed S01 baseline blob | **60/60 canonical-equal** (T1 30/30 + T2 30/30) ✓ |
| in-process: genuine consumption over 30 T2-with-obs | wired≠ablated 30/30 · pos grew 30/30 · curr moved 30/30 · consumed nonEmpty 30/30 · history==base+consumed 30/30 · strict<cutoff 30/30 · A/B agree 30/30 · real-gate-reason 30/30 ✓ |
| in-process: `Date.now`/`Math.random` stubbed-to-throw, wired+ablated replay | **succeeded (no wall-clock/random leak)** ✓ |
| `node --test` (4 S02 suites) | **tests 19 · pass 19 · fail 0** ✓ |
| `npm test` | **tests 296 · pass 296 · fail 0** ✓ |
| `git cat-file -p HEAD:scripts/corona-backtest.js \| sha256sum` | `17f6380b…1730f1` (I1) ✓ |
| `node -e "…version,…dependencies"` | `0.2.0 {}` ✓ |
| `git diff --name-only` | `corpus-loader.js`, `t2-replay.js` only ✓ |

---

## 3. npm test Side-Effect — Forensic Confirmation + Restored

`npm test` regenerated current-code provenance in **5** cycle-002 frozen files
(`cycle-002/runtime-replay-manifest.json`, `cycle-002-run-2/{replay_script_hash.txt, sensitivity-summary.md}`, `cycle-002-run-3/{replay_script_hash.txt, sensitivity-summary.md}`).

- **Exactly which files:** the 5 above.
- **Provenance-only — forensically:** the **complete** set of changed value-lines is `code_revision` (`d93cada9…`→`32b9dd8…`) and `replay_script_hash` (`a919ec7d…`→`8bf4de7e…`). A targeted sweep for **score/anchor** changes (`brier|score|skill|bucket|corpus_hash|lambda|sensitivity_value|uplift|delta`) returned **NONE**. The `replay_script_hash` moves because Sprint 02 legitimately edits `t2-replay.js`; the existing test `"replay_script_hash drifted honestly … current code recorded post-Sprint-05"` expects it (hence 296/296). `corpus_hash.txt` / `cycle_001_script_hash.txt` appeared only in the autocrlf *warning* list — their content did **not** change (not in the changed-file set).
- **No frozen Sprint-03 anchor, corpus hash, or score hash changed.**
- **Restored:** `git restore grimoires/loa/calibration/corona/` (exit 0); post-restore calibration dirty count **0**. Final `git diff --name-only` = the 2 authorized source files. *(Commit-gate carry-forward: any future `npm test` repeats this churn — `git restore` the cycle-002 paths before committing.)*

---

## 4. Layer-B Audit Findings (`corpus-loader.js`) — PASS

- **Surface:** diff = only the new helper `deriveKpPreCutoffObservations`, `deriveEvidenceT2`, and one `_`-prefixed export line.
- **`deriveEvidenceT1` byte-identical** (HEAD vs working-tree extraction → empty diff; `flare_class_observed`/`flare_peak_time` in no `+/-` line). T1 untouched.
- **Helper correctness:** `Array.isArray(observations) ? … : []` (field-less → `[]`, no throw — behaviorally confirmed for `undefined/null/'x'/42/{}`); `if (obsMs >= cutoffMs) continue;` = **strict `<`**; ascending numeric sort; uses `parseIsoMsLocal` (no `Date.now()`/`Math.random()`). Record shape exactly `{event_time_ms, time, kp, index, provenance, satellite}` — only observation fields, **no settlement label**.
- **`deriveEvidenceT2(event, cutoff)`:** signature gains `cutoff` (dispatch already passes it); `pre_cutoff` field-gated via the helper; **settlement block byte-identical**. No corpus-record mutation (no write/append calls in the changed source).
- **Independent leakage check:** every derived `pre_cutoff` entry across all 30 cycle-003 T2 events is strictly `< cutoff` (**30/30**).

---

## 5. Layer-A Audit Findings (`t2-replay.js`) — PASS

- **Surface:** diff = imports, `replay_T2_event` JSDoc/signature, `const→let theatre`, the opt-in block, `evidence_bundles_consumed`. No other function.
- **Options bag:** `replay_T2_event(corpus_event, ctx, options = {})`, `const { wireEvidence = false } = options;`. All existing callers are 2-arg (`corona-backtest-cycle-002.js:188,266`, the cycle-004 harness, all existing tests) → default-off.
- **Default-off reversibility — machine-proven:** the *modified* code's default-off table is **canonical-equal to the committed S01 baseline fixture for all 60 events**; `evidence_bundles_consumed` reduces to `[]` when off; `const→let` does not change the produced value.
- **Wired path genuine — machine-proven over all 30 T2-with-obs:** wired≠ablated, `position_history` grew, `current_position` moved, `evidence_bundles_consumed` non-empty, and `position_history.length == baseline + consumed.length` — all **30/30**. Every non-prior `position_history` entry cites a consumed `bundle_id` **and** its `reason` matches `/Kp=|crossing_prob/` (**30/30**) — i.e., the entries are genuine `processKpObservation` output, not fabricated metadata.
- **Determinism by construction:** with `Date.now`/`Math.random` **stubbed to throw**, both the wired and ablated replays still produced valid trajectories → no wall-clock/random reached on any path (the injected clock is the sole time source).
- **Frozen-gate respect:** `processGeomagneticStormGate` is **called**; `src/theatres/geomag-gate.js` byte-unchanged; no `base_rate`/`kp_threshold`/`window_hours`/σ/λ/formula edit. `outcome` derivation unchanged; `corpus_event_hash` unaffected (corpus not mutated). No scoring/Brier/skill/baseline-delta in any added executable line. No new dependency. No circular import (`corpus-loader.js` imports only fs/path/config/proton-cascade).

---

## 6. Bundle Payload Audit — PASS (pinned SDD §6.4)

From `t2-replay.js:130-147` (source-verified) + behavioral confirmation that the gate ran its `kp_index` path:

| Field | Implementation | Verdict |
|-------|----------------|---------|
| `bundle_id` | `` `replay-t2-kp-${event_id}-${obs.time}` `` | deterministic, event+obs-specific ✓ |
| `evidence_class` | `'provisional'` (never resolves — proven by 1:1 history growth) | ✓ |
| `payload.event_type` | `'kp_index'` (proven: gate emitted Kp=/crossing_prob reasons) | ✓ |
| `payload.event_time` | `obs.event_time_ms` (numeric ms epoch) | ✓ |
| `payload.kp.value` | `obs.kp` | ✓ |
| `payload.kp.uncertainty` | `buildKpUncertainty({ kp: obs.kp, source })` | ✓ |
| `source` | `obs.provenance === 'gfz_definitive' ? 'GFZ' : 'SWPC'` — GFZ **only** when `gfz_definitive` | ✓ |
| `payload.quality.composite` | `1.0` | ✓ |

**`quality.composite` language — SAFE.** The exact OD-1 phrase *"a uniform neutral/default runtime quality weight required by the existing T2 gate contract"* is present in both the code (`t2-replay.js`, wrapped across comment lines) and the implementation report, with the full caveat that it is **NOT** source-derived / in the corpus / fitted / tuned / optimized / quality-measured / a parameter-refit. An exhaustive sweep of every `composite` characterization line found **no positive** "fitted/tuned/source-derived" description anywhere — only the neutral-weight definition and explicit negations.

**GFZ-lag (SDD §6.6):** evidence from all strictly-pre-cutoff observations regardless of `regression_tier_eligible` / `kp_gfz_observed == null`; provenance flows into the uncertainty `source`; nothing dropped. Confirmed by `corpus-loader-t2-gfz-lag-test.js`.

---

## 7. Test Audit Findings — PASS

19 tests, 70 assertions, all green; corroborated by independent in-process recompute (the same properties hold via code paths the tests don't share). Coverage maps to every required assertion: derivation from `kp_observations[]`; strict `<` / zero `>= cutoff`; ascending sort; field-less → `[]` no-throw; settlement unchanged; no settlement label in entries; null-gfz/ineligible still derives + provenance preserved; `wireEvidence:true` real `position_history` + non-empty `evidence_bundles_consumed`; default-off (absent AND `false`) baseline `[]`; anti-hollow-proof (1:1 growth + bundle-id citation + hash differs); Layer-A bundle `event_time` == Layer-B `pre_cutoff event_time_ms`.

---

## 8. Independent Verification of the Two Decisive Claims

**(a) Default-off reversibility — CONFIRMED.** Compared the modified-code default-off table to the committed S01 baseline via canonical parsed-JSON (`git cat-file` LF blob, §6.10-robust — not a raw working-tree `diff`). **60/60 canonical-equal** (T1 30/30 + T2 30/30). T1 negative-control identity holds.

**(b) Genuine T2 wired consumption — CONFIRMED.** Over all 30 T2-with-observation events: wired≠ablated; `position_history` grows; `current_position` moves; `evidence_bundles_consumed` non-empty; `history.length == baseline + consumed.length` (deterministic 1:1, no exceptions — every provisional bundle appends exactly one non-resolving update). The difference originates in `processGeomagneticStormGate` (entries cite consumed bundle ids and carry Kp/crossing reasons), **not** metadata churn. Plus the wall-clock/random negative control proves the path is deterministic by construction.

---

## 9. Forbidden-Path Audit — PASS

`git diff --name-only HEAD` over the entire forbidden surface is **empty**: `t1-replay.js`, `deriveEvidenceT1` (byte-identical), `src/theatres/*` (incl. `flare-gate.js`, `geomag-gate.js`), `src/rlmf/certificates.js`, `scripts/corona-backtest.js` (I1), `scripts/corona-backtest-cycle-002.js`, `src/processor/uncertainty.js`, `package.json`, `README.md`, `BUTTERFREEZONE.md`, root `grimoires/loa/{prd,sdd,sprint}.md` + `ledger.json`, cycle-001/002/003 corpus + manifests, **cycle-003 held-out seal** (`heldout-split.json` + manifest byte-unchanged), `.beads/`. No parameter/threshold/`base_rate`/σ/λ/formula change; no flux→`solar_flare` mapping in S02 source; no T4 work; no external fetch; no dependency change.

---

## 10. Frozen-Invariant Verification — PASS

I1 `corona-backtest.js` = `17f6380b…1730f1` ✓ · `package.json` `0.2.0`/`{}` ✓ · zero new deps ✓ · cycle-003 corpus + held-out seal untouched ✓ · no `Date.now()`/`Math.random()` reachable in added code (stub-to-throw negative control) ✓ · existing suite determinism green (296/296) ✓ · S01 baseline fixture `538cba01…` (committed blob) unchanged ✓.

---

## 11. Claim-Grep Posture — CLEAN

S02 source + 4 tests: **zero** forbidden positive-claim patterns. Implementation report: the 6 hits are negation (verbatim "No … claim is made"), the §14 forbidden-list enumeration, or the "no new rung" ceiling. Review feedback: 2 hits, both negation/ceiling. Verbatim allowed-posture sentence present and unaltered. Remaining namespace hits are spec-doc forbidden-list definitions (audited clean in Sprint 01). **No forbidden phrase appears as a positive claim.**

---

## 12. Adjudication of the 3 Non-Blocking Review Concerns

**Concern 1 — `_`-prefixed shared helper imported into production `t2-replay.js`.**
**Acceptable for Sprint 02: YES. Fix before commit: NO.** This is the SDD §7-mandated DRY design ("one pure function used by **both** Layer B and Layer A … re-export … via the existing `_`-prefixed test-export block"). It is a real ESM export (the `_` is this repo's internal-export convention), guarded by `layer-ab-agreement-test.js`, with no circular import. Recorded as an **optional future cleanup note** (a clean non-`_` export name or a "production-consumed" comment at the export site would improve readability) — **not** a blocker.

**Concern 2 — helper has no per-element null guard.**
**Acceptable: YES. Blocker: NO.** Behaviorally proven to have **exact parity with `deriveEvidenceT4`**: a null element within the array throws `TypeError` in *both* helpers, while every field-less/non-array input the spec requires to be safe (`undefined`, `null`, non-array) returns `[]` without throwing. The only throwing case is a schema-invalid array element that the frozen, audited T4 precedent also does not handle and that the schema-validated corpus does not produce. Adding a guard would be a non-surgical deviation from the established T4 pattern. Non-blocking (parity + schema validation).

**Concern 3 — `obs` map-variable names a derived record, not a raw observation.**
**Cosmetic only: YES. Fix required: NO.** `preCutoff.map((obs) => …)` reads helper-derived fields (`obs.event_time_ms`, `obs.time`, `obs.kp`, `obs.provenance`) that all exist on the derived record — functionally correct. Optional rename to `rec`/`entry` for clarity; no behavioral impact.

**None of the three rises to a Sprint-02 blocker.** All are recorded as non-blocking; concerns 1 and 3 are optional future readability notes.

---

## 13. Targeted Verdicts

| Question | Verdict |
|----------|---------|
| Is T2 wiring genuine (not metadata-only)? | **Genuine.** 30/30 events; gate runs (`processKpObservation` reasons), history 1:1 with bundles, `current_position` moves, hash differs. |
| Is default-off behavior protected? | **Yes.** Modified default-off == committed S01 baseline, 60/60 canonical-equal; option-absent == `wireEvidence:false`. |
| Is `quality.composite` language safe? | **Yes.** Exact OD-1 wording + full NOT-fitted caveat set in code and report; no positive "fitted/derived" description anywhere. |
| Did any hard stop occur? | **No** (HS-1/2/3/5/8/9/10 all clear). |
| Is any fix required before operator approval / commit? | **No.** |

---

## 14. Hard-Stop / Fix Status

- **Hard stop:** none.
- **Fix required before operator approval / commit:** **none.** The three review concerns are non-blocking (Concern 2 proven by T4-parity test; Concerns 1 & 3 optional readability notes).

---

## 15. Final `git status --short`

```
 M scripts/corona-backtest/ingestors/corpus-loader.js
 M scripts/corona-backtest/replay/t2-replay.js
?? grimoires/loa/a2a/cycle-004/sprint-02/
?? tests/corpus-loader-t2-gfz-lag-test.js
?? tests/corpus-loader-t2-precutoff-test.js
?? tests/layer-ab-agreement-test.js
?? tests/replay-t2-genuine-consumption-test.js
```

(`git diff --name-only` = the 2 authorized source files; the `npm test` cycle-002 provenance churn was restored; `main`=`ccd6eea`, `cycle-004`=`HEAD`=`32b9dd8`, 0 commits on the sprint branch. After this audit, `auditor-feedback.md` + `COMPLETED` are added under `sprint-02/`.)

---

## 16. Disposition

**APPROVED.** `COMPLETED` marker written to `grimoires/loa/a2a/cycle-004/sprint-02/COMPLETED`. Sprint 02 banks **no rung**; cycle-002's T4-only runtime-sensitivity ceiling and v0.2.0 stand unweakened. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. **Operator action:** Sprint 02 is audit-clean; commit only on explicit operator approval (and `git restore` the cycle-002 provenance files after any pre-commit `npm test`). No commit, no push performed by this audit.

**Next:** operator HITL → commit/push on approval, then Sprint 03 (`cycle-004-s03-proof-closeout`) — which MUST honor SPRINT-PLAN §6.10 line-ending-robust comparison for the `ablated == baseline` gate.
