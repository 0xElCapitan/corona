# CORONA Cycle-004 Sprint 03 — Review Feedback (Senior Tech Lead)

## Verdict: **PASS — ACCEPT** (3 non-blocking concerns documented)

Independent adversarial review of the cycle-004 Sprint 03 proof closeout. Every
proof was **re-derived from the source and corpus** (not trusted from the
implementation report). All material gates hold. No hard stop. No fix is required
before audit. Three non-blocking concerns are recorded in the Adversarial Analysis
for the auditor's attention.

> **Posture (verified honest):** Cycle-004 wires and tests deterministic T2
> evidence consumption; T1 is honestly blocked and retained as a negative control.
> **No rung is banked.** No calibration / scoring / forecasting-accuracy /
> predictive-uplift / L2-readiness claim is made. Cycle-002's T4-only
> runtime-sensitivity ceiling remains unchanged.

---

## 1. Branch / base / hygiene — PASS

| Check | Result |
|-------|--------|
| Active branch | `cycle-004-s03-proof-closeout` ✓ |
| HEAD | `2c83bc66a3aab9d9afe16323a4ac13dae03ac4e2` ✓ |
| Descends from cycle-004 | `merge-base(HEAD, cycle-004) = 2c83bc66…` ✓ |
| Commits since cycle-004 | **0** (no commit made) ✓ |
| `cycle-004` / `origin/cycle-004` | `2c83bc66…` (untouched) ✓ |
| `main` / `origin/main` | `ccd6eea9…` (untouched) ✓ |
| Worktree | `cycle-004` in `nice-jackson-df0b4b`; sprint branch in primary — branched from ref safely ✓ |
| Sprint 01 baseline fixture | committed blob `538cba01…86d491` — unmodified ✓ |
| Sprint 02 wiring | `corpus-loader.js` / `t2-replay.js` clean vs HEAD (intact) ✓ |
| Broad NOTES / Obsidian / planning docs | unchanged (`grimoires/loa/NOTES.md`, cycle-004 PRD/SDD/SPRINT-PLAN/LEDGER) ✓ |

## 2. Harness review — PASS

`scripts/corona-backtest-cycle-004-evidence-wiring.js` read in full. Findings:

- `--state baseline|wired|ablated` selector; `dispatchHashes`/`buildHashTable`
  state-parameterized; Sprint 01 `dispatchBaselineHashes`/`buildBaselineHashTable`
  retained as wrappers.
- `replayForState` (harness:142-148): T1 → `replay_T1_event(event, ctx)` (no options,
  every state); T2 wired → `replay_T2_event(event, ctx, { wireEvidence: true })`;
  ablated → `{ wireEvidence: false }`; baseline → no options. **Correct.**
- `--state baseline` / `--emit-hashes` reproduce the committed baseline **byte-for-byte**
  (independently verified — whole-file LF blob equality, see §4).
- Output: per-event `{theatre, event_id, trajectory_hash}` only, deterministic sort
  by `(theatre, event_id)`, 64-hex validated. **No scoring / Brier / skill / baseline
  delta / held-out** anywhere (grep confirmed; the only matches are negation comments).
- **No `Date.now(` / `Math.random(` calls** (comment-stripped grep: 0; behavioral
  stub-to-throw: 0 — see §7/§11). No external fetch; imports are intra-repo + `node:`
  builtins only. `scripts/corona-backtest.js` **not** imported. No T4 work. No frozen
  artifact written by the harness (frozen-output-dir guard retained).

**Special focus — shared `runtime_revision` across states:** Verified. All three
states use the single constant `cycle-004-s01-baseline` (harness:91). This is correct
and load-bearing: `meta.runtime_revision` is inside the SHA-256'd trajectory
(`replay/hashes.js` blanks only `meta.trajectory_hash`), so changing it per-state would
break both the T1 negative control and ablated==baseline. It is documented honestly
(harness:86-91, report §3, PROOF-SUMMARY §1, CLOSEOUT §10.5). It does **not** mask
material differences — on the contrary, holding all metadata constant makes the wired↔
ablated delta attributable solely to evidence consumption (proven genuine in §6).

## 3. Proof artifacts — PASS

| Check | wired-hashes.json | ablated-hashes.json |
|-------|-------------------|---------------------|
| event_count | 60 ✓ | 60 ✓ |
| record keys | `{event_id, theatre, trajectory_hash}` only ✓ | same ✓ |
| all 64-hex SHA-256 | ✓ | ✓ |
| deterministic sort | ✓ | ✓ |
| scoring / Brier / uplift / improvement / delta field | none ✓ | none ✓ |
| state / wire_evidence labels | `wired` / `true` ✓ | `ablated` / `false` ✓ |
| pure LF (CR-bytes) | 0 ✓ | 0 ✓ |

`PROOF-SUMMARY.md`: includes wired/ablated/baseline paths; the §6.10 comparison-method
statement; the **explicit T2 wired-vs-ablated count (30) AND full 30-event list** (no
truncation); T1 negative-control identity; replay-twice, cycle-002 regression,
no-walltime/random, no-param-drift results; and safe no-rung / no-scoring / T4-only
ceiling language. ✓

## 4. §6.10 ablated == baseline — PASS (independent)

Method used (binding §6.10, line-ending-robust): committed **LF blob via
`git cat-file -p HEAD:…/baseline-hashes.json`** (method 2) **+ `JSON.parse` canonical
compare** (method 1). **No raw working-tree diff** used as the gate.

Independent result (built ablated in-process, compared to committed blob):
- `ablated.events === baseline.events` → **true, all 60** ✓
- **T1 30/30 equal; T2 30/30 equal** ✓
- ablated == no-options-baseline hash: **30/30 T2** ✓
- `--state baseline` whole-file == committed baseline LF blob (byte-identical) ✓

(Note: a naïve whole-file `diff` of `ablated-hashes.json` vs `baseline-hashes.json`
correctly differs in metadata — `state`/`description`/`wire_evidence` — which is
expected; the per-event hash-table identity is the authoritative gate and is exact.)

## 5. Wired-vs-ablated — PASS (independent)

- **30/30 T2 events differ** wired vs ablated.
- Diff set **exactly equals** the independently-derived set of T2 events with ≥1
  strictly-pre-cutoff Kp observation (cutoff = `kp_window_end`, via the same
  `_deriveKpPreCutoffObservations` helper the wired path uses): 30 == 30, set-equal.
- No silent truncation; full list present in PROOF-SUMMARY §4.
- Framed correctly as a wiring-observability fact — not a rung / accuracy / calibration
  / uplift / forecasting claim (claim-grep §13).

## 6. Genuine consumption (not metadata-only) — PASS (independent, deep)

Replayed full trajectories (not just hashes) for all 30 pre-cutoff T2 events, wired vs
ablated:

| Property | Result |
|----------|--------|
| wired ≠ ablated (hash) | 30/30 ✓ |
| `position_history` grows (wired > ablated) | 30/30 ✓ |
| `current_position` moves (wired ≠ ablated) | 30/30 ✓ |
| wired `evidence_bundles_consumed` non-empty | 30/30 ✓ |
| ablated `evidence_bundles_consumed` empty | 30/30 ✓ |
| every non-prior wired history entry maps to a consumed bundle id | **0 unmapped** ✓ |
| `wired.history.length == ablated.history.length + bundles` | **true for all 30** (ablated history is prior-only length-1; wired grows by exactly #bundles) ✓ |

The deterministic relationship the objective asks for holds **exactly** (no exceptions):
history grows by exactly the number of consumed bundles, and each added entry carries a
consumed `evidence_id`. The change flows through the existing
`processGeomagneticStormGate` path, not metadata churn. **Genuine consumption confirmed.**

## 7. Replay-twice determinism — PASS (independent)

`--state wired` run1 == run2 (byte-identical); `--state ablated` run1 == run2; plus
in-process `buildHashTable` twice canonical-identical. No walltime/random involved
(§11 stub-to-throw).

## 8. T1 negative control — PASS (independent)

- T1 **wired == ablated == baseline** for all 30 events (on-disk artifacts + committed
  fixture; 0 mismatches).
- T1 `evidence_bundles_consumed` empty for all 30; `position_history` length 1
  (prior-only).
- `t1-replay.js` clean vs HEAD (blob `9c46c8ad…`); `deriveEvidenceT1` not edited
  (`corpus-loader.js` clean vs HEAD); no flux→solar_flare mapping; `flare-gate.js`
  clean (blob `377725ec…`).

## 9. Cycle-002 frozen-corpus regression — PASS (independent)

- Test uses the pure, file-free `dispatchCycle002Replay()`; `corona-backtest-cycle-002.js`
  **not** edited.
- Independently re-ran `dispatchCycle002Replay({})` vs the committed manifest
  `entries[].trajectory_hashes` anchor (read via `git cat-file`): **15/15 (T1/T2/T4 × 5)
  byte-identical.**
- No frozen cycle-002 artifact left dirty by the test (it writes nothing).
- The `npm test` provenance side-effect is a separate matter, handled in §11.

## 10. Sprint 03 test review — PASS

Each test does real computation against source/corpus/committed-blobs; none merely
asserts the implementation report:

| Test | Substance |
|------|-----------|
| determinism-wired | builds each state twice, compares emitted JSON + parsed objects |
| wired-vs-ablated | recomputes wired/ablated + independently derives pre-cutoff set; asserts set-equality + full list |
| ablated-equals-baseline | git cat-file committed LF blob + fresh build; canonical compare (§6.10) |
| t1-negative-control | builds states + fixture, replays T1 for evidence check, t1-replay frozen anchor |
| cycle-002-regression | `dispatchCycle002Replay` vs committed manifest anchor (non-mutating) |
| no-walltime-no-random | behavioral stub-to-throw (all states) + comment-stripped grep |
| no-param-diff | gate-param constants + frozen blob anchors + `git diff --quiet HEAD` + package.json |
| claim-grep-gate | sweeps 27 files; negation/quoted-mention/ceiling heuristic; teeth-verified |

## 11. Re-run validation — PASS

| Command | Result |
|---------|--------|
| `--state wired` / `--state ablated` regenerate | events 60 / 60; regenerated == on-disk (deterministic) ✓ |
| §6.10 ablated==baseline (canonical + committed blob) | 60/60 (T1 30, T2 30) ✓ |
| Sprint 03 suite (8 files) | **tests 18 \| pass 18 \| fail 0** ✓ |
| Sprint 02 suite (4 files) | **tests 19 \| pass 19 \| fail 0** ✓ |
| `npm test` | **tests 296 \| pass 296 \| fail 0** ✓ |
| `git cat-file HEAD:scripts/corona-backtest.js \| sha256sum` | `17f6380b…1730f1` (I1 ✓) |
| `package.json` version / deps | `0.2.0 {}` ✓ |
| cycle-003 corpus_hash | `7b6c5b48…d5003` ✓ |

**Note:** the `/tmp/...` generation in the review script failed once due to an MSYS-bash
(`/tmp`) vs Windows-node (`C:\tmp`) path-mapping mismatch — a review-tooling artifact, not
an implementation issue. Re-run via `os.tmpdir()` and in-process build succeeded.

### npm test side-effect — observed and restored
`npm test` updated provenance fields in **5** cycle-002 files
(`cycle-002-run-2`/`run-3` `replay_script_hash.txt` + `sensitivity-summary.md`,
`cycle-002/runtime-replay-manifest.json`). I enumerated **every** changed line: 100%
provenance — `replay_script_hash` `a919ec7d…→8bf4de7e…` (because `t2-replay.js` changed in
Sprint 02) and `code_revision` `d93cada9…→2c83bc66…` (HEAD). **No** score, sensitivity
value, bucket, or corpus_hash line changed. All 5 restored via `git restore`; tree clean
(0 cycle-002 dirt). This matches the implementer's report.

## 12. Forbidden-path audit — PASS

`git diff --quiet HEAD` clean for **every** forbidden surface: `corpus-loader.js`,
`t2-replay.js`, `t1-replay.js`, `flare-gate.js`, `geomag-gate.js`, `certificates.js`,
`corona-backtest.js`, `corona-backtest-cycle-002.js`, `package.json`, `README.md`,
`BUTTERFREEZONE.md`, root `prd.md`/`sdd.md`/`ledger.json`. `.gitattributes` correctly
**absent** (out of scope). No change under `src/theatres/`, `scripts/corona-backtest/`,
`grimoires/loa/calibration/`, `.beads/`. No parameter / threshold / base_rate / sigma /
lambda / formula change (constants + blob anchors hold). No T1 flux mapping, no T4 work,
no external fetch, no package/dependency change, no scoring/Brier/skill/baseline-delta/
held-out.

## 13. Claim-grep posture — PASS (independent cross-check)

The engineer's `claim-grep-gate-test.js` passes (27 files, 0 violations) and is
teeth-verified (a scratch bare-claim is flagged). My **independent raw sweep** of the new
artifacts for all 10 forbidden phrases surfaced only: one wrapped negation
(`replay-t2-wired-vs-ablated-test.js:15`, "…NOT … NOT … NOT …") and two backtick-quoted
mentions inside the claim-grep test's own documentation — all safe. Zero positive-claim
patterns (`demonstrates/achieves/earned … uplift/improved/accuracy`). Forbidden phrases
appear only as negations / definitions / quoted mentions / historical-ceiling statements.

## 14. Carry-forward documentation review — PASS (with non-blocking note)

`CLOSEOUT.md §10` documents (without performing) all required carry-forwards: final
closeout should update NOTES/Obsidian durable docs; **T1 stays blocked** unless a future
cycle adds a native `xray_flux` gate evidence type or a pre-cutoff flare-*event* corpus;
**T4 raw-proton-flux unblock deferred** to a separate operator-gated cycle; optional
`_deriveKpPreCutoffObservations` clean-export; optional `.gitattributes` proof-JSON
`eol=lf` pin (out of scope unless authorized); and that no broad NOTES/Obsidian docs were
mutated this sprint. CLOSEOUT also carries the verbatim allowed posture, the
theatre-qualified result statement, proof inventory, invariant status, forbidden-path
audit, and no-commit/push + no-tag/release/bump statements. (See Concern 1 re: the report
not cross-referencing these.)

---

## Adversarial Analysis

### Concerns Identified (3, all non-blocking)

1. **Report does not cross-reference the carry-forwards** (`implementation-report.md`).
   The word "carry-forward" appears 0× in the report; the cycle-closeout carry-forwards
   live only in `CLOSEOUT.md §10`. The information is complete and in the right document,
   but the review checklist lists "cycle-closeout carry-forwards documented" as a report
   element. **Recommendation (non-blocking):** add a one-line pointer in the report to
   `CLOSEOUT.md §10`. Not a blocker — carry-forwards are fully documented.

2. **Claim-grep heuristic is line-level permissive** (`claim-grep-gate-test.js:` MARKERS /
   `isSafeOccurrence`). A forbidden phrase is excused if its line contains *any* marker
   anywhere, so a crafted positive claim sharing a line with a trailing "not" could slip.
   The test documents this ("risk profile is a missed positive, not a false alarm") and is
   teeth-verified on bare claims, and all swept prose is author-controlled and currently
   clean. **Recommendation (non-blocking):** acceptable for a closeout gate; the auditor
   may wish to spot-check the new prose manually (I did — §13 clean).

3. **Frozen sha256 anchors are baked as literals** (`no-param-diff-test.js`,
   `replay-t1-negative-control-test.js`). I independently re-derived each from HEAD and
   they match, and the companion `git diff --quiet HEAD` check catches working-tree edits —
   so they are genuine, not circular. But a legitimate future edit to these files requires
   manual anchor updates, and a stale anchor yields a confusing failure. **Verdict:**
   standard frozen-anchor tradeoff and the established repo convention
   (`cycle-002-entrypoint-test.js`); keep.

### Assumption Challenged

- **Assumption:** "All 30 T2 events carry ≥1 strictly-pre-cutoff Kp observation, hence
  wired ≠ ablated for all 30."
- **Risk if wrong:** a future corpus event with `kp_observations` but none strictly
  pre-cutoff would not differ wired-vs-ablated.
- **Why it's safe:** `replay-t2-wired-vs-ablated-test.js` does **not** hardcode `=== 30`;
  it asserts `diffIds.length > 0` and `deepEqual(diffIds, withPreCutoff)` (set-equality
  against the independently-derived pre-cutoff set, using the same `kp_window_end` cutoff
  and helper as the replay). The test is therefore self-correcting under corpus change.
  **Recommendation:** make explicit — already done (the "30" is observed, not asserted as a
  constant).

### Alternative Not Considered

- **Alternative:** emit richer per-event records in wired/ablated (e.g.,
  `position_history_length`, `current_position`, `bundles_consumed_count`) so the
  genuine-consumption proof is self-contained in the artifact.
- **Tradeoff:** auditable directly from `wired-hashes.json`, BUT it would break the clean
  `ablated.events === baseline.events` whole-array identity (extra fields the baseline
  fixture lacks) and drift toward scoring-like per-event metrics.
- **Verdict:** current hash-only artifacts + the separate trajectory-internals proof
  (`replay-t2-genuine-consumption-test.js` from Sprint 02, plus this review's deep
  recompute) is the right call. Keep as-is.

---

## Hard-stop status

**No hard stop occurred.** HS-4/6/7/8/9/10 all clear (no ablated≠baseline; no
wired==ablated-for-all; no T1 divergence; no replay non-determinism; cycle-002 regression
proven without frozen-artifact mutation; no walltime/random; no param/formula drift; no
forbidden artifact touched; no T1 wiring / flux mapping; no scoring/Brier/baseline-delta/
held-out/T4-fetch/rung-banking).

## Fix required before audit?

**No.** The three concerns are non-blocking. The carry-forward cross-reference (Concern 1)
is a documentation nicety the implementer may optionally add; it does not gate audit.

## Frozen-invariant verification

I1 `17f6380b…1730f1` ✓ · `package.json` `0.2.0`/`{}` ✓ · cycle-003 corpus_hash
`7b6c5b48…d5003` ✓ · Sprint 01 baseline blob `538cba01…86d491` ✓ · gate/cert/t1-replay
blob anchors (`377725ec…`/`466ad282…`/`eeef486c…`/`9c46c8ad…`) ✓.

## Final git status --short

```
 M scripts/corona-backtest-cycle-004-evidence-wiring.js
?? grimoires/loa/a2a/cycle-004/proof/PROOF-SUMMARY.md
?? grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json
?? grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
?? grimoires/loa/a2a/cycle-004/sprint-03/   (implementation-report.md, CLOSEOUT.md, review-feedback.md)
?? tests/  (8 Sprint 03 test files)
```
Tree holds only authorized Sprint 03 paths (+ this review-feedback.md). Working tree clean
of the npm-test provenance side-effect (restored).

## Next step

**ACCEPT → proceed to `/audit-sprint sprint-03`** at operator discretion. No
implementation fix is required first. (Reviewer did not commit, push, audit, or update
broad NOTES/Obsidian docs.)
