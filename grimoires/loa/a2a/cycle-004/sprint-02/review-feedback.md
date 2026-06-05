# CORONA Cycle-004 — Sprint 02 Review Feedback

> **Reviewer:** Senior Tech Lead (`/review-sprint sprint-02`) — adversarial, independent recompute.
> **Sprint:** 02 — T2 Layer-B + Layer-A evidence wiring (opt-in, default-off).
> **Branch:** `cycle-004-s02-t2-evidence-wiring` @ `32b9dd8abdd4c1e355fcb20ed6a8d75664d2c7de` (no commit, no push).
> **Base:** `cycle-004` @ `32b9dd8`. **main / origin/main:** `ccd6eea` (untouched).
> **Method:** Neither the implementation report nor the prior verdict was taken on trust. Every diff was read from disk, every validation command re-run, and the two load-bearing properties (default-off reversibility, genuine wired consumption) were re-derived in-process against the real corpus.
> **Date:** 2026-06-05.

---

## VERDICT: ✅ PASS — ACCEPT

Sprint 02 implements exactly the authorized T2 Layer-B + Layer-A evidence-consumption wiring, opt-in and default-off, with no gate/parameter/scoring change and T1 left as a byte-identical negative control. All 10 Sprint-02 acceptance criteria (SPRINT-PLAN §5.6) are independently confirmed **Met**. T2 wiring is **genuine** (not metadata-only); the default-off path is **byte-identical to the pre-cycle-004 baseline**; `quality.composite` language is safe. No frozen-invariant violation, no forbidden-path edit, no claim drift, **no hard stop**. **No fix is required before `/audit-sprint sprint-02`.** Three non-blocking concerns are recorded in the Adversarial Analysis (§A) for the auditor's attention; none gate approval.

---

## 1. Files Inspected

| File | Inspection |
|------|-----------|
| `scripts/corona-backtest/ingestors/corpus-loader.js` | full `git diff`; helper + `deriveEvidenceT2` semantics; `deriveEvidenceT1` byte-extraction; settlement preservation; export block |
| `scripts/corona-backtest/replay/t2-replay.js` | full `git diff`; options bag, default-off path, wired loop, bundle payload, imports |
| `tests/corpus-loader-t2-precutoff-test.js` · `-gfz-lag-test.js` · `replay-t2-genuine-consumption-test.js` · `layer-ab-agreement-test.js` | assertion content; run via `node --test`; corroborated by independent in-process recompute |
| `grimoires/loa/a2a/cycle-004/sprint-02/implementation-report.md` | required-section presence; verbatim posture; AC table |
| `src/theatres/{geomag-gate,flare-gate}.js`, `src/processor/uncertainty.js`, `t1-replay.js`, `corona-backtest{,-cycle-002}.js` | unchanged-vs-HEAD confirmation (imported/forbidden surface) |
| PRD.md, SDD.md, CYCLE-004-SPRINT-PLAN.md §5, SPRINT-LEDGER.md, sprint-01/{impl,review,auditor} | binding scope / ACs / carry-forward |

---

## 2. Exact Commands Run + Outputs

| Command | Result |
|---------|--------|
| `git branch --show-current` / `rev-parse HEAD` | `cycle-004-s02-t2-evidence-wiring` / `32b9dd8…` ✓ |
| `git merge-base --is-ancestor 32b9dd8 HEAD` | descends from cycle-004 ✓ |
| `git rev-list --count cycle-004..HEAD` | **0** (no commit) ✓ |
| `git rev-parse main` / `origin/main` | `ccd6eea…` / `ccd6eea…` (untouched) ✓ |
| in-process: modified default-off table vs committed S01 baseline blob | **events[] canonical-equal — 60/60 (30 T1 + 30 T2) byte-identical** ✓ |
| in-process: wired vs ablated over all 30 T2-with-obs events | wired≠ablated **30/30**; position_history grew **30/30**; current_position moved **30/30**; history grew 1:1 with consumed bundles **30/30** ✓ |
| `node --test` (4 S02 suites) | **tests 19 · pass 19 · fail 0** ✓ |
| `npm test` | **tests 296 · pass 296 · fail 0** ✓ |
| `git cat-file -p HEAD:scripts/corona-backtest.js \| sha256sum` | `17f6380b…1730f1` (I1) ✓ |
| `node -e "…version,…dependencies"` | `0.2.0 {}` ✓ |
| `git diff --name-only` | `corpus-loader.js`, `t2-replay.js` only ✓ |

---

## 3. npm test Side-Effect — Confirmed Provenance-Only + Restored

`npm test` regenerated current-code provenance in **5** cycle-002 frozen files
(`cycle-002/runtime-replay-manifest.json`, `cycle-002-run-2/{replay_script_hash.txt, sensitivity-summary.md}`, `cycle-002-run-3/{replay_script_hash.txt, sensitivity-summary.md}`).

- **Confirmed exactly which files dirtied:** the 5 above (`git diff --name-only -- …/calibration/corona/`).
- **Confirmed provenance-only:** the only changed values are `code_revision` (`d93cada9…` → `32b9dd8…`) and `replay_script_hash` (`a919ec7d…` → `8bf4de7e…`). The `replay_script_hash` moves **because Sprint 02 legitimately edits `t2-replay.js`** — the manifest records a *current-code* hash, and the existing test `"replay_script_hash drifted honestly … current code recorded post-Sprint-05"` **expects** it (hence 296/296 green). *(Reviewer note: my first "non-provenance" grep flagged the two bare-hash lines as suspicious; that was a grep false-positive — those lines are the **content** of the `replay_script_hash.txt` files, i.e. the provenance value itself, with the label in the filename.)*
- **Confirmed no frozen anchor / corpus hash changed:** no `corpus_hash`, Sprint-03 anchor, bucket, Brier, or `lambda_scalar` field changed (`corpus_hash.txt` / `cycle_001_script_hash.txt` appeared only in the autocrlf *warning* list, not the changed-file set).
- **Restored:** `git restore grimoires/loa/calibration/corona/` (exit 0); post-restore calibration dirty count **0**. Final `git diff --name-only` is the 2 authorized source files only.

*(Carry-forward for the commit gate: any future `npm test` repeats this churn — `git restore` the cycle-002 paths before committing. Consistent with the Sprint-01 audit note.)*

---

## 4. Layer-B Review Findings (`corpus-loader.js`) — PASS

- **Surface:** diff touches only the new helper `deriveKpPreCutoffObservations`, `deriveEvidenceT2`, and one `_`-prefixed export line. Nothing else.
- **`deriveEvidenceT1` byte-identical** — extracted from HEAD vs working tree → empty diff. T1 untouched.
- **Helper correctness:** `Array.isArray(observations) ? … : []` (field-less → `[]`, no throw); `if (obsMs >= cutoffMs) continue;` = **strict `<`** (leakage-free, HS-5); `sort((a,b)=>a.event_time_ms-b.event_time_ms)` = ascending numeric; uses `parseIsoMsLocal` (no `Date.now()`/`Math.random()`). Record shape is exactly `{event_time_ms, time, kp, index, provenance, satellite}` — **only** observation fields, **no settlement label**. Mirrors `deriveEvidenceT4` (`:534-540`).
- **`deriveEvidenceT2(event, cutoff)`:** signature gains `cutoff` (dispatch already passes it, `:608`); `pre_cutoff` field-gated via the helper; **settlement block byte-identical** (`kp_swpc_observed`/`kp_gfz_observed ?? null`). No corpus-record mutation (no write calls in the changed source).
- **Tests corroborate:** `corpus-loader-t2-precutoff-test.js` asserts derivation, strict `<` (incl. an at-cutoff sample excluded), zero `>= cutoff`, ascending sort, field-less → `[]` no-throw, settlement unchanged, no settlement label in entries, and sweeps all real cycle-003 T2 events leakage-free.

---

## 5. Layer-A Review Findings (`t2-replay.js`) — PASS

- **Surface:** diff touches only imports, `replay_T2_event`'s JSDoc/signature, the `const→let theatre` token, the opt-in block, and `evidence_bundles_consumed`. No other function.
- **Signature:** `replay_T2_event(corpus_event, ctx, options = {})`, `const { wireEvidence = false } = options;`. All existing callers (`corona-backtest-cycle-002.js:188,266`, the cycle-004 baseline harness, all existing tests) are 2-arg → default-off.
- **Default-off byte-identity — independently proven:** the *modified* code's default-off table (harness `replay_T2_event(event, ctx)`) is **canonical-equal to the committed S01 baseline fixture for all 60 events** (30 T1 + 30 T2). This is the strongest possible confirmation that the options-bag + `const→let` change did not perturb the baseline path (and re-confirms T1 negative-control identity). The `evidence_bundles_consumed: kpBundles.map(...)` reduces to `[]` when off.
- **Wired path genuine — independently proven across all 30 T2-with-obs events:** wired≠ablated 30/30; `position_history` grew 30/30; `current_position` moved off the base rate 30/30; **`position_history.length == baseline + consumed.length` 30/30** (each bundle drives one real `processGeomagneticStormGate` provisional update — structurally **not** metadata-only). Bundles built from the **shared helper** (same strict cutoff + sort as Layer B); processed ascending; injected clock advanced to `bundle.payload.event_time`; `position_history_at_cutoff` / `current_position_at_cutoff` read from the live processed gate; `evidence_bundles_consumed` = real bundle ids.
- **Frozen-gate respect:** `processGeomagneticStormGate` is **called**, `src/theatres/geomag-gate.js` is byte-unchanged; no `base_rate`/`kp_threshold`/`window_hours`/σ/λ/formula edit (the only diff hits for "lambda" are the word "lambda**Scalar**" in *comments* referencing the T4 precedent). `outcome` derivation unchanged (still settlement-derived); `corpus_event_hash` unaffected (corpus not mutated). No scoring/Brier/skill/baseline-delta. No `Date.now()`/`Math.random()` in added executable lines. No new dependency. No circular import (`corpus-loader.js` imports only fs/path/config/proton-cascade — verified).

---

## 6. Bundle Payload Review — PASS (pinned SDD §6.4 shape)

| Field | Implementation | Verdict |
|-------|----------------|---------|
| `bundle_id` | `` `replay-t2-kp-${event_id}-${obs.time}` `` | deterministic, event+obs-specific ✓ |
| `evidence_class` | `'provisional'` (never resolves — gradual path) | ✓ |
| `payload.event_type` | `'kp_index'` | ✓ |
| `payload.event_time` | `obs.event_time_ms` (numeric ms epoch of `obs.time`) | ✓ |
| `payload.kp.value` | `obs.kp` (corpus-native) | ✓ |
| `payload.kp.uncertainty` | `buildKpUncertainty({ kp: obs.kp, source })` (existing runtime model) | ✓ |
| `source` mapping | `obs.provenance === 'gfz_definitive' ? 'GFZ' : 'SWPC'` — GFZ **only** when `gfz_definitive` | ✓ |
| `payload.quality.composite` | `1.0` | ✓ |

**`quality.composite` language — SAFE.** Documented in code (`t2-replay.js`) and report (§6.3) verbatim as *"a uniform neutral/default runtime quality weight required by the existing T2 gate contract,"* with the explicit caveat that it is **NOT** source-derived / in the corpus / fitted / tuned / optimized / quality-measured / a parameter-refit. No description anywhere frames it as derived or fitted.

**GFZ-lag handling — correct (SDD §6.6):** evidence derived from *all* strictly-pre-cutoff observations regardless of `regression_tier_eligible` / `kp_gfz_observed == null`; provenance flows into the uncertainty `source`; no entry dropped. Confirmed by `corpus-loader-t2-gfz-lag-test.js` (null-gfz, ineligible event still derives all pre-cutoff obs, provenance preserved).

---

## 7. Tests Review Findings — PASS

19 tests, 70 assertions, all green; not vacuous (independent in-process recompute reproduces the same properties). Coverage maps 1:1 to the required assertions:

- **precutoff:** derives from `kp_observations[]`; strict `<`, zero `>= cutoff`; ascending sort; field-less → `[]` no-throw; settlement unchanged; no settlement label in entries.
- **gfz-lag:** `kp_gfz_observed == null` + `regression_tier_eligible:false` event still derives evidence; provenance preserved; nothing skipped for GFZ-lag.
- **genuine-consumption:** `wireEvidence:true` real `position_history` updates + non-empty `evidence_bundles_consumed`; default-off (absent AND `false`) baseline with `[]`; **anti-hollow-proof** (history 1:1 with consumed bundles, every non-prior entry cites a consumed bundle id, hash differs); field-less no-op even when wired.
- **layer-ab:** Layer-A bundle `event_time` == Layer-B `pre_cutoff event_time_ms` per event; same strict cutoff; same ascending order; no divergence.

---

## 8. Forbidden-Path Audit — PASS

`git diff --name-only HEAD` over the entire forbidden surface is **empty**: `t1-replay.js`, `deriveEvidenceT1` (byte-identical), `src/theatres/*` (incl. `flare-gate.js`, `geomag-gate.js`), `src/rlmf/certificates.js`, `scripts/corona-backtest.js` (I1), `scripts/corona-backtest-cycle-002.js`, `src/processor/uncertainty.js`, `package.json`, `README.md`, `BUTTERFREEZONE.md`, root `grimoires/loa/{prd,sdd,sprint}.md` + `ledger.json`, cycle-001/002/003 corpus + manifests, cycle-003 held-out seal, `.beads/`. No parameter/threshold/`base_rate`/σ/λ/formula change; no flux→`solar_flare` mapping; no T4 work; no external fetch; no dependency change.

---

## 9. Frozen-Invariant Verification — PASS

I1 `corona-backtest.js` = `17f6380b…1730f1` ✓ · `package.json` `0.2.0` / `{}` ✓ · zero new deps ✓ · cycle-003 corpus + held-out seal untouched (restored npm churn) ✓ · no `Date.now()`/`Math.random()` in added code ✓ · existing suite determinism green (296/296) ✓ · S01 baseline fixture `538cba01…` (committed blob) unchanged ✓.

---

## 10. Claim-Grep Posture — CLEAN

Swept `grimoires/loa/a2a/cycle-004/` + changed source + the 4 new tests. **Zero** forbidden positive-claim patterns in S02 source/tests. In the S02 report the 6 hits are all **negation** (the verbatim "No … claim is made" posture), the §14 **forbidden-list enumeration**, or the **"no new rung" historical-ceiling** statement — no positive claim. The verbatim allowed-posture sentence is present and unaltered (§1). Remaining namespace hits live in the spec docs (PRD/SDD/SPRINT-PLAN) as forbidden-list definitions (audited clean in Sprint 01).

---

## 11. Targeted Verdicts (operator's review questions)

| Question | Verdict |
|----------|---------|
| Is T2 wiring genuine (not metadata-only)? | **Genuine.** 30/30 events: gate actually runs, `position_history` grows 1:1 with consumed bundles, `current_position` moves off base rate, trajectory hash differs. HS-3 not triggered. |
| Is default-off behavior protected? | **Yes.** Modified default-off == committed S01 baseline, 60/60 byte-identical; option absent == `wireEvidence:false`. |
| Is `quality.composite` language safe? | **Yes.** Exact OD-1 wording + the full NOT-source-derived/NOT-fitted caveat set, in both code and report. |
| Did any hard stop occur? | **No** (HS-1/2/3/5/8/9/10 all clear). |
| Is any fix required before audit? | **No.** |

---

## A. Adversarial Analysis

### Concerns Identified (non-blocking)

1. **`_`-prefixed test-export consumed by production code.** `t2-replay.js:30` imports `_deriveKpPreCutoffObservations` (a member of corpus-loader's `_`-prefixed *test*-export block) for **production** use. This is the SDD §7-mandated DRY design and is guarded by `layer-ab-agreement-test.js`, but the `_` convention elsewhere in this repo signals "internal/test-only," so a future maintainer could refactor the export block without realizing a production module depends on it. *Recommendation:* either promote the helper to a clean (non-`_`) named export consumed by both layers, or add a one-line comment at the export site noting "production-consumed by t2-replay.js." Non-blocking — test-guarded and spec-mandated.
2. **Helper has no per-element guard.** `deriveKpPreCutoffObservations` calls `parseIsoMsLocal(obs.time)` without guarding `obs` being `null`/non-object; a malformed array element would throw rather than skip. This is exact parity with `deriveEvidenceT4` and the corpus is schema-validated, so it is not a regression. *Recommendation:* acceptable as-is for T4 parity; if hardening is ever desired, do it in both helpers together. Non-blocking.
3. **`obs` loop-variable names a *derived record*, not a raw observation.** In `t2-replay.js`, `preCutoff.map((obs) => …)` reads `obs.event_time_ms` (a helper-derived field) — functionally correct, but the name `obs` could mislead a reader into expecting raw-observation semantics. *Recommendation:* rename to `rec`/`entry`. Cosmetic, non-blocking.

### Assumption Challenged
- **Assumption:** `evidence_class:'provisional'` bundles **never resolve** the gate, so `position_history` grows exactly one entry per bundle (the basis for the strict-equality anti-hollow-proof test).
- **Risk if wrong:** if a future gate change let a provisional crossing resolve, processing would stop early and the strict `length == baseline + consumed` assertion would fail.
- **Verdict:** Valid for cycle-004 — the gate is frozen (forbidden to edit) and its provisional path (`geomag-gate.js:155-184`) never resolves (resolution requires `ground_truth`/`provisional_mature`, `:137`). The strict-equality test is therefore a *guard* that would catch an inadvertent gate change, not a liability. Make explicit (it now is, here).

### Alternative Not Considered
- **Alternative:** add an in-S02 unit test asserting default-off trajectory hashes equal the committed S01 baseline fixture per-event (a "reversibility unit test").
- **Tradeoff:** would surface drift one step earlier, but the `ablated == baseline` gate is explicitly **Sprint 03's** deliverable (SPRINT-PLAN §6.4 T3.4), and that gate must use the §6.10 line-ending-robust comparison; duplicating it in S02 risks scope creep and a fragile raw-`diff`.
- **Verdict:** Current scope split is correct. (This reviewer performed the reversibility check independently at review time — 60/60 — so there is no coverage gap, only a deferral of the *committed gate* to S03.)

---

## B. Hard-Stop Status & Fix Requirement

- **Hard stop:** none.
- **Fix required before audit:** **none.** The three concerns above are non-blocking and recorded for the auditor; the assumption and alternative are resolved in-place.

---

## C. Final `git status --short`

```
 M scripts/corona-backtest/ingestors/corpus-loader.js
 M scripts/corona-backtest/replay/t2-replay.js
?? grimoires/loa/a2a/cycle-004/sprint-02/
?? tests/corpus-loader-t2-gfz-lag-test.js
?? tests/corpus-loader-t2-precutoff-test.js
?? tests/layer-ab-agreement-test.js
?? tests/replay-t2-genuine-consumption-test.js
```

(`git diff --name-only` = the 2 authorized source files; the `npm test` cycle-002 churn was restored; `main`=`ccd6eea`, `cycle-004`=`32b9dd8`, 0 commits on the sprint branch.)

---

## D. Disposition

**PASS — ACCEPT.** Sprint 02 is review-clean and ready for `/audit-sprint sprint-02`. No commit, no push, no tag, no release, no version bump performed by this review. Cycle-004 banks **no new rung**; cycle-002's T4-only runtime-sensitivity ceiling and v0.2.0 stand unweakened. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made.

**Next:** operator HITL → `/audit-sprint sprint-02`.
