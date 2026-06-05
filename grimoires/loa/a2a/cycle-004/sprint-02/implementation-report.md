# CORONA Cycle-004 — Sprint 02 Implementation Report

> **Sprint:** 02 — T2 Layer-B + Layer-A evidence wiring (opt-in, default-off).
> **Skill:** `/implement sprint-02` (implementing-tasks).
> **Date:** 2026-06-05.
> **Status:** Implementation complete. No commit, no push, no tag, no release, no version bump. Awaiting `/review-sprint sprint-02`.

---

## 1. Executive Summary

Sprint 02 implements the **actual T2 evidence-consumption path** — Layer-B
`deriveEvidenceT2` (loader) + Layer-A `replay_T2_event` (replay) — **additive,
field-presence-gated, and opt-in (`wireEvidence`, default `false`)**, mirroring
the T4 `lambdaScalar` precedent. When opted in, the runtime deterministically
consumes cycle-003's strictly-pre-cutoff `kp_observations[]` through the
**existing, byte-frozen** `processGeomagneticStormGate`; the default (off) path
is byte-identical to pre-cycle-004. T1 is left exactly as cycle-003 shipped it
(negative control). No gate, parameter, threshold, `base_rate`, σ, λ, or formula
was modified. No scoring was introduced.

**Allowed posture (verbatim, SDD §15 / SPRINT-PLAN §1.1):**

> "Cycle-004 wires and tests deterministic T2 evidence consumption, while
> confirming T1 evidence consumption is honestly blocked and retained as a
> negative control. No rung is banked. No calibration, scoring,
> forecasting-accuracy, predictive-uplift, or L2-readiness claim is made.
> Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."

**No hard stop occurred. No operator decision is required to proceed to review.**

---

## 2. Branch / HEAD / Base

| Field | Value |
|-------|-------|
| Branch | `cycle-004-s02-t2-evidence-wiring` |
| HEAD | `32b9dd8abdd4c1e355fcb20ed6a8d75664d2c7de` (no S02 commit — working-tree edits only) |
| Base branch / commit | `cycle-004` @ `32b9dd8abdd4c1e355fcb20ed6a8d75664d2c7de` (Sprint 01 integrated) |
| `main` / `origin/main` | `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6` — **untouched** |
| Worktree note | `cycle-004` is checked out in `.claude/worktrees/nice-jackson-df0b4b`; the S02 branch was created from the `cycle-004` **ref** (distinct branch name) → no worktree conflict, nothing forced. |

---

## 3. Files Changed / Created

**Edited (2 — the entire globally-authorized cycle-004 source surface, SPRINT-PLAN §2):**

| File | Change | LOC |
|------|--------|-----|
| `scripts/corona-backtest/ingestors/corpus-loader.js` | Added shared helper `deriveKpPreCutoffObservations` (T2.1); `deriveEvidenceT2` field-gated derivation (T2.2); `_`-prefixed test re-export of the helper. `deriveEvidenceT1` untouched. | +47 / −1 (net) |
| `scripts/corona-backtest/replay/t2-replay.js` | `replay_T2_event` gains `options = {}` bag (`wireEvidence` default `false`); opt-in `kp_index` bundle construction + gate-processing loop (T2.3/T2.4); `evidence_bundles_consumed` wired. Imports `processGeomagneticStormGate` + `buildKpUncertainty` + the shared helper (no new dependency). | +76 / −5 |

`git diff --stat`: **2 files changed, 117 insertions(+), 6 deletions(−).**

**Created (4 additive tests + this report):**

- `tests/corpus-loader-t2-precutoff-test.js`
- `tests/corpus-loader-t2-gfz-lag-test.js`
- `tests/replay-t2-genuine-consumption-test.js`
- `tests/layer-ab-agreement-test.js`
- `grimoires/loa/a2a/cycle-004/sprint-02/implementation-report.md` (this file)

The Sprint-03-owned proof harness `scripts/corona-backtest-cycle-004-evidence-wiring.js`
was **NOT** edited (no need arose; the wiring is testable directly via the new
`node --test` suite). `package.json` was **NOT** edited (OD-2).

---

## 4. Baseline-Fixture Precedence (OD-4)

The Sprint-01 baseline fixture `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json`
**existed and was committed at the base commit `32b9dd8` before any Sprint-02
source edit.** Verified:

- `git ls-files --error-unmatch …/baseline-hashes.json` → tracked & committed.
- Committed-blob sha256 (LF): `538cba01002924cd720f2719fbbdd700e3ad675b4a2a0808f0fca8974286d491` (the Sprint-01 LF identity `538cba01…`, via `git cat-file -p HEAD:<path> | sha256sum`).
- `git diff HEAD -- …/baseline-hashes.json` → **empty** (S02 does not touch the fixture).

S02 made **no** change to the baseline fixture; it remains the immutable
pre-change reference for the Sprint-03 `ablated == baseline` gate.

---

## 5. Layer-B Details — `corpus-loader.js`

### 5.1 Shared helper `deriveKpPreCutoffObservations(observations, cutoffMs)` (T2.1)

A single pure function used by **both** Layer B and Layer A (imported into
`t2-replay.js`) so the two derivations cannot diverge. Behavior:

- field-less / non-array `observations` → `[]` (no throw — Layer A relies on this);
- keep only readings whose parsed `event_time_ms` is **STRICTLY `< cutoffMs`** (mirrors `deriveEvidenceT4`'s `obsMs >= cutoff.time_ms` skip — leakage-free; HS-5);
- ascending numeric sort by `event_time_ms`;
- record shape mirrors `deriveEvidenceT4` (`:534-540`): `{ event_time_ms, time, kp, index, provenance, satellite }` — only time-keyed reading fields; **no settlement label is copied**;
- `Date.now()`-free, `Math.random()`-free, deterministic (uses the existing `parseIsoMsLocal`).

Re-exported via the existing `_`-prefixed test-export block as
`_deriveKpPreCutoffObservations` (`:616-631`).

### 5.2 `deriveEvidenceT2(event, cutoff)` (T2.2)

- Signature gains `cutoff` (the dispatch already calls `evFn(event, cutoff)`, `:608`; `deriveEvidenceT4` already uses `(event, cutoff)`).
- Replaces the hardcoded `pre_cutoff: []` with field-gated derivation: `Array.isArray(event.kp_observations) ? deriveKpPreCutoffObservations(event.kp_observations, cutoff.time_ms) : []`.
- Strict `<`; cutoff = `deriveCutoffT2(event)` = `kp_window_end` (`:465-469`).
- **`settlement` block preserved EXACTLY** (`kp_swpc_observed`, `kp_gfz_observed`) — byte-identical to the original lines.
- `deriveEvidenceT1` **untouched** (verified byte-identical, §10); no scoring; no corpus-record modification.

---

## 6. Layer-A Details — `t2-replay.js`

### 6.1 Options bag + opt-in loop (T2.3)

- `replay_T2_event(corpus_event, ctx, options = {})` with `const { wireEvidence = false } = options;` (mirrors `t4-replay.js:71-73`).
- **Default / `wireEvidence:false` / field-absent path = exact pre-cycle-004 behavior:** `createGeomagneticStormGate` once, **no** process loop, `evidence_bundles_consumed: []`, prior-only `position_history` (length 1). `const theatre` → `let theatre` is the only default-path token change and does not alter the produced value.
- **`wireEvidence === true` AND `Array.isArray(corpus_event.kp_observations)`:** build pinned `kp_index` bundles from the strictly-pre-cutoff readings (shared helper), then loop in ascending `event_time` order advancing the injected clock per bundle and calling `processGeomagneticStormGate(live, bundle, { now })`. Then build `position_history_at_cutoff` from `live.position_history` (existing `<= cutoff` filter + field rename), set `current_position_at_cutoff = live.current_position`, and `evidence_bundles_consumed = kpBundles.map(b => b.bundle_id)`.
- `outcome` derivation **unchanged** (still GFZ-preferred Kp comparison from settlement, CONTRACT §8.2). `corpus_event_hash` **unaffected** (corpus record never mutated). No scoring.
- Imports added: `processGeomagneticStormGate` (from the existing `src/theatres/geomag-gate.js`), `buildKpUncertainty` (from the existing `src/processor/uncertainty.js`), and the shared helper (from `corpus-loader.js`). **No new dependency** — `package.json` `dependencies: {}` preserved.

### 6.2 Pinned bundle payload (T2.4, SDD §6.4)

```
{
  bundle_id: `replay-t2-kp-${event_id}-${obs.time}`,   // deterministic, event- + observation-specific
  evidence_class: 'provisional',                        // gradual path, NEVER resolves (SDD §6.3)
  payload: {
    event_type: 'kp_index',
    event_time: obs.event_time_ms,                      // numeric ms epoch
    kp: {
      value: obs.kp,                                    // corpus-native
      uncertainty: buildKpUncertainty({ kp: obs.kp, source }),  // existing runtime model
    },
    quality: { composite: 1.0 },
  },
}
```

`evidence_class: 'provisional'` routes every bundle through the gradual
provisional-update path and **never resolves the gate** (resolution requires
`ground_truth` / `provisional_mature`), yielding real intermediate
`position_history` updates rather than a trivial jump to `1.0`.

### 6.3 `quality.composite = 1.0` — exact OD-1 wording

In code and in this report, `quality.composite = 1.0` is documented as:

> **"a uniform neutral/default runtime quality weight required by the existing
> T2 gate contract."**

It is explicitly **NOT** source-derived, **NOT** in the corpus, **NOT** fitted,
**NOT** tuned, **NOT** optimized, **NOT** quality-measured, and **NOT** a
parameter-refit — a single documented deterministic constant. `processKpObservation`
reads `payload.quality.composite` (`geomag-gate.js:157`); it scales only the
near-threshold provisional nudge, while the dominant behavior is driven by the
**real** corpus Kp value.

### 6.4 GFZ-lag handling (T2.4, SDD §6.6)

Evidence is derived from **all** strictly-pre-cutoff `kp_observations`
regardless of `regression_tier_eligible` or `kp_gfz_observed == null` (no
scoring ⇒ eligibility is moot to a consumption proof). **No observation is
skipped for GFZ-lag reasons; no entry is dropped for provenance.** Per-entry
`provenance` flows into `buildKpUncertainty`'s `source`
(`gfz_definitive → 'GFZ'` → narrower σ 0.33; otherwise `'SWPC'` → σ 0.67), so
provisional readings carry honestly-wider uncertainty. Covered by
`corpus-loader-t2-gfz-lag-test.js` (a `kp_gfz_observed == null`,
`regression_tier_eligible: false` event still derives all its pre-cutoff
observations, provenance preserved).

---

## 7. Tests Created (T2.5)

All additive under `tests/`, runner `node --test` (OD-2: NOT added to
`package.json` `scripts.test`). **19 tests, 19 pass, 0 fail.**

| File | Asserts |
|------|---------|
| `corpus-loader-t2-precutoff-test.js` | `deriveEvidenceT2` derives `pre_cutoff` from `kp_observations[]`; every entry strict `<` cutoff (zero `>= cutoff`); a sample exactly AT cutoff is excluded; ascending `event_time_ms`; field-less/non-array event → `[]` (no throw); `settlement` present + unchanged; no settlement label inside any `pre_cutoff` entry (exact 6-key shape). Plus a sweep over **all** real cycle-003 T2 events (leakage-free, ascending). |
| `corpus-loader-t2-gfz-lag-test.js` | A `kp_gfz_observed == null` / `regression_tier_eligible:false` event still derives all its pre-cutoff observations; provenance preserved per entry (mixed GFZ/SWPC survive); count == strictly-pre-cutoff count (nothing skipped for GFZ-lag). |
| `replay-t2-genuine-consumption-test.js` | `wireEvidence:true` → real `position_history` updates (len > baseline); `evidence_bundles_consumed` non-empty + event/obs-specific ids; `current_position` moves for ≥1 event; **NOT metadata-only** — `position_history` grows exactly 1 entry per consumed bundle and every non-prior entry cites a consumed bundle id (HS-3 structural guard) + hash differs; default-off (absent AND `wireEvidence:false`) stays baseline (`[]`, len 1, identical hash); field-less event is a no-op even when wired. |
| `layer-ab-agreement-test.js` | Layer-B `pre_cutoff` == shared-helper output (Layer B uses the helper); Layer-A and Layer-B use the SAME strict cutoff; Layer-A bundle `event_time` values == Layer-B `pre_cutoff` `event_time_ms` per event (and consumed-bundle order/set == Layer-B order/set); both ascending, no divergence. |

---

## 8. Exact Validation Commands + Outputs

### 8.1 New additive T2 suite

```
$ node --test tests/corpus-loader-t2-precutoff-test.js tests/corpus-loader-t2-gfz-lag-test.js \
              tests/replay-t2-genuine-consumption-test.js tests/layer-ab-agreement-test.js
ℹ tests 19
ℹ pass 19
ℹ fail 0
```

### 8.2 Existing suite (FROZEN `scripts.test`, unchanged)

```
$ npm test
ℹ tests 296
ℹ pass 296
ℹ fail 0
```

### 8.3 Frozen-invariant spot checks

```
$ git cat-file -p HEAD:scripts/corona-backtest.js | sha256sum
17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1   # I1 ✓

$ node -e "console.log(require('./package.json').version, JSON.stringify(require('./package.json').dependencies))"
0.2.0 {}                                                            # ✓

$ git diff --name-only
scripts/corona-backtest/ingestors/corpus-loader.js
scripts/corona-backtest/replay/t2-replay.js                        # only the 2 authorized source files ✓
```

### 8.4 Independent smoke (representative event `T2-2017-03-27-Kp6.33`, 12 obs)

| Path | position_history len | evidence_bundles_consumed | current_position | trajectory_hash |
|------|----------------------|---------------------------|------------------|-----------------|
| DEFAULT (no options) | 1 | `[]` | 0.1 | `03ab573f…6515` |
| ABLATED (`wireEvidence:false`) | 1 | `[]` | 0.1 | `03ab573f…6515` (**== default**) |
| WIRED (`wireEvidence:true`) | 13 | 12 ids | 0.932 | `4bac93b0…5e63` (**≠ ablated**) |

Default == ablated (byte hash); wired ≠ ablated; wired `position_history` grew
1:1 with the 12 consumed bundles; `current_position` moved 0.1 → 0.932 via 12
genuine `processGeomagneticStormGate` calls; outcome + `corpus_event_hash`
unchanged; wired replay-twice byte-identical.

---

## 9. `npm test` Side-Effect Handling (observed)

`npm test` regenerated **current-code provenance** fields in 5 cycle-002 frozen
artifacts:
`cycle-002/runtime-replay-manifest.json`,
`cycle-002-run-2/{replay_script_hash.txt, sensitivity-summary.md}`,
`cycle-002-run-3/{replay_script_hash.txt, sensitivity-summary.md}`.

The churn was confined to two regenerated fields:
- `code_revision`: `d93cada9…` → `32b9dd8…` (current HEAD — the same class the Sprint-01 audit documented);
- `replay_script_hash_at_sprint_05` / "replay_script_hash (post-Sprint-05)": `a919ec7d…` → `8bf4de7e…` — this **moved because Sprint 02 legitimately edits `t2-replay.js`** (the manifest records a *current-code* hash; the test `replay_script_hash drifted honestly … current code recorded post-Sprint-05` **expects** this drift, and the frozen Sprint-03 anchors are preserved, which is why `npm test` is **296/296 green**).

No frozen anchor or corpus hash was corrupted. Per the documented procedure, all
5 files were **restored with `git restore`** (exit 0); post-restore
`git diff --name-only -- grimoires/loa/calibration/corona/` is **empty**. This is
a pre-existing test-harness behavior, not a Sprint-02 defect. (Note for the
commit gate: any future `npm test` will repeat this churn — `git restore` those
paths before committing.)

---

## 10. Forbidden-Path Audit — PASS

`git diff --name-only HEAD` over the entire forbidden surface is **empty**:

- `src/theatres/*` (incl. `geomag-gate.js`, `flare-gate.js`) — **UNCHANGED** (`git diff --quiet HEAD` clean). Gates are *called*, never modified.
- `scripts/corona-backtest/replay/t1-replay.js` — **UNCHANGED** (byte-identical to HEAD).
- `deriveEvidenceT1` (inside the edited `corpus-loader.js`) — **BYTE-IDENTICAL** (extracted from HEAD vs working tree → empty diff; `flare_class_observed`/`flare_peak_time` appear in no `+/-` line).
- `scripts/corona-backtest.js` (I1) — not imported, not edited.
- `scripts/corona-backtest-cycle-002.js` — not edited.
- `src/processor/uncertainty.js` — imported, **UNCHANGED**.
- `src/rlmf/certificates.js`, `package.json`, `README.md`, `BUTTERFREEZONE.md`, root `grimoires/loa/{prd,sdd,sprint}.md` + `ledger.json`, cycle-001/002/003 corpus + manifests, cycle-003 held-out seal, `.beads/` — **none modified**.

No parameter / threshold / `base_rate` / σ / λ / formula change. No
`xray_flux_observations[] → solar_flare` mapping. T1 negative control intact.

---

## 11. Frozen-Invariant Checks — PASS

| Invariant | Expected | Observed |
|-----------|----------|----------|
| I1 `corona-backtest.js` sha256 (committed blob) | `17f6380b…1730f1` | `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` ✓ |
| `package.json` version / deps | `0.2.0` / `{}` | `0.2.0 {}` ✓ |
| I7 zero new dependencies | `{}` | only intra-repo modules imported ✓ |
| cycle-003 corpus | untouched (read-only) | corpus tree clean (no diff) ✓ |
| cycle-003 held-out seal | untouched | not read, not modified ✓ |
| I6 no `Date.now()` / `Math.random()` in new paths | none | helper + Layer-A use `parseIsoMsLocal`/injected clock only ✓ |
| I5 existing-suite determinism | green | `npm test` 296/296 ✓ |
| baseline fixture (S01) | unchanged | `538cba01…` committed-blob, S02 diff empty ✓ |

---

## 12. `package.json` Unchanged — CONFIRMED

`git diff --quiet HEAD -- package.json` clean. Output `0.2.0 {}`. No `version`,
no `dependencies`, no `scripts.test` change (OD-2). New tests run via explicit
`node --test …`.

---

## 13. `src/theatres/*`, `t1-replay.js`, `deriveEvidenceT1` Unchanged — CONFIRMED

- `src/theatres/geomag-gate.js`, `src/theatres/flare-gate.js`, and all of `src/theatres/*` — byte-identical to HEAD.
- `scripts/corona-backtest/replay/t1-replay.js` — byte-identical to HEAD.
- `deriveEvidenceT1` — byte-identical (HEAD vs working-tree extraction → empty diff).

---

## 14. Claim-Grep — CLEAN

Swept the changed source + the 4 new test files for the forbidden positive-claim
patterns (`calibration improved`, `forecasting accuracy`, `predictive uplift`,
`empirical performance improvement`, `L2 publish-ready`, `T1/T2 runtime-sensitive`,
`T1/T2 calibration-improved`, `new rung earned`, `Baseline A vs Baseline B uplift`,
`new-corpus baseline uplift`, plus `brier`/`skill`): **no match** in source/tests.
In this report and the cycle-004 namespace the patterns appear only as
**negations / forbidden-list definitions / historical-ceiling statements**
(e.g. "No … predictive-uplift … claim is made", the forbidden-list enumeration
above). No forbidden phrase appears as a positive claim.

---

## 15. AC Verification (SPRINT-PLAN §5.6)

| # | Acceptance criterion (verbatim) | Status | Evidence |
|---|----------------------------------|--------|----------|
| 1 | "T2 wired path produces **real** `position_history` updates (length > 1 for events with ≥1 pre-cutoff observation)." | ✓ Met | `replay-t2-genuine-consumption-test.js` (`wired position_history len > baseline`); smoke 1→13. `t2-replay.js:150-153`. |
| 2 | "`processGeomagneticStormGate` is **actually exercised** … consumption is structural, not metadata." | ✓ Met | `t2-replay.js:152` calls the gate per bundle; genuine-consumption test asserts history grows 1:1 with consumed bundles + each entry cites a consumed bundle id; `current_position` 0.1→0.932. |
| 3 | "**Metadata-only proof is impossible / rejected** (HS-3)." | ✓ Met | Structural assertion `position_history.length == baseline + consumed.length` + `trajectory_hash` differs (`replay-t2-genuine-consumption-test.js`). Not triggered — consumption is real. |
| 4 | "Field-less corpus event remains a **no-op** (`pre_cutoff: []`, baseline trajectory)." | ✓ Met | `precutoff-T2` field-less → `[]`; `genuine-consumption-T2: field-less event remains a no-op even when wired`. `t2-replay.js:127` (`Array.isArray` gate); `corpus-loader.js` deriveEvidenceT2 gate. |
| 5 | "Default-off (`wireEvidence:false` / option absent) behavior is **byte-identical** to pre-cycle-004." | ✓ Met | `genuine-consumption-T2: default-off … stays baseline` (absent == false, identical hash); smoke default==ablated `03ab573f…`. |
| 6 | "No gate edits (`src/theatres/*` untouched)." | ✓ Met | §10 — `git diff --quiet HEAD -- src/theatres/` clean. |
| 7 | "No parameter edits (no `base_rate`/threshold/σ/λ/formula diff)." | ✓ Met | §10 — no `src/theatres/*` edit; `CYCLE_002_T2_GATE_PARAMS` unchanged; gate called, not modified. |
| 8 | "No scoring." | ✓ Met | No Brier/skill/baseline-delta added; claim-grep §14; outcome derivation unchanged (`t2-replay.js:166-174`). |
| 9 | "No `package.json` edit." | ✓ Met | §12 — `git diff --quiet HEAD -- package.json` clean; `0.2.0 {}`. |
| 10 | "`quality.composite = 1.0` documented exactly as the OD-1 wording; not described as source-derived/fitted." | ✓ Met | §6.3; `t2-replay.js:142-147` carries the exact OD-1 sentence + the NOT-source-derived/NOT-fitted caveat. |

All 10 Sprint-02 acceptance criteria **Met**. No `✗`, no `⚠`, no deferral.

---

## 16. Hard-Stop Status

**No hard stop.** Explicitly checked:

- HS-1 (no-refit): no parameter/threshold/`base_rate`/formula change needed — clear.
- HS-2 (gate edit): T2 wired **without** editing `geomag-gate.js` (gate called) — clear.
- HS-3 (hollow proof): consumption is structural (history grows 1:1 with bundles; `current_position` moves) — clear.
- HS-5 (leakage): all `pre_cutoff` entries strict `<` cutoff; no settlement label inside entries — clear.
- HS-8 (frozen-artifact touch): forbidden surface byte-clean; `npm test` cycle-002 churn restored — clear.
- HS-9 (T1 reanimation): T1 untouched; no flux→`solar_flare` mapping — clear.
- HS-10 (scope creep): no scoring/Brier/baseline-delta/T4-fetch/rung-banking — clear.

---

## 17. `git status --short`

```
 M scripts/corona-backtest/ingestors/corpus-loader.js
 M scripts/corona-backtest/replay/t2-replay.js
?? tests/corpus-loader-t2-gfz-lag-test.js
?? tests/corpus-loader-t2-precutoff-test.js
?? tests/layer-ab-agreement-test.js
?? tests/replay-t2-genuine-consumption-test.js
?? grimoires/loa/a2a/cycle-004/sprint-02/
```

(`git diff --name-only` = the 2 authorized source files only; the cycle-002
`npm test` churn was restored.)

---

## 18. Operator Decision Needed?

**None.** All four SDD operator decisions were resolved at sprint-plan time
(OD-1 `quality.composite = 1.0` wording; OD-2 no `package.json` edit; OD-3 T1
BLOCKED; OD-4 baseline-first). No new decision surfaced. No hard stop.

---

## 19. Next Required Command

```
/review-sprint sprint-02
```

No commit, no push, no tag, no release, no version bump performed. `main`
untouched at `ccd6eea`. Cycle-004 banks **no new rung**; cycle-002's T4-only
runtime-sensitivity ceiling and v0.2.0 stand unweakened.
