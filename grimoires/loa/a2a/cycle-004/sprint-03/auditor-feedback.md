# CORONA Cycle-004 Sprint 03 — Auditor Feedback (Paranoid Cypherpunk Auditor)

## Verdict: **APPROVED — LETS FUCKING GO**

Final-gate security/quality/honesty audit of the cycle-004 Sprint 03 proof closeout.
I trusted neither the implementation report nor the review feedback: **every proof was
re-derived independently**, and I added **three auditor negative controls** the prior
passes did not run. All gates hold. No hard stop. **No fix is required before operator
approval / commit.** The three non-blocking review concerns (C1/C2/C3), the challenged
assumption, and the rejected alternative are adjudicated **acceptable as-is** below.

> **Posture (audited honest):** Cycle-004 wires and tests deterministic T2 evidence
> consumption; T1 is honestly blocked and retained as a negative control. **No rung is
> banked.** No calibration / scoring / forecasting-accuracy / predictive-uplift /
> L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling is unchanged.

---

## 1. Reports & artifacts audited

Read: cycle-004 PRD / SDD / SPRINT-PLAN (§6, §6.10) / SPRINT-LEDGER; sprint-01 + sprint-02
reports/reviews/audits; sprint-03 `implementation-report.md`, `review-feedback.md`,
`CLOSEOUT.md`; `proof/PROOF-SUMMARY.md`; the harness
`scripts/corona-backtest-cycle-004-evidence-wiring.js`; `proof/{wired,ablated,baseline}-hashes.json`;
all 8 Sprint 03 tests; the replay/gate/loader source. The reports collectively include the
verbatim allowed posture, theatre-qualified statement, proof inventory, exact validation
outputs, §6.10 method, invariant status, forbidden-path audit, no-commit/push, no-tag/bump,
and the carry-forward section. **No overclaim found.**

## 2. Harness audit — PASS

- `--state baseline|wired|ablated`; `replayForState` (harness:142-148): T1 →
  `replay_T1_event(event, ctx)` no options (every state); T2 wired → `{wireEvidence:true}`,
  ablated → `{wireEvidence:false}`, baseline → no options. Deterministic sort; per-event
  `{theatre,event_id,trajectory_hash}` only.
- **Comment-stripped code scan: 0** real `Date.now(` / `Math.random(` / `brier` /
  `scoreCorpus` / `skill` / `baseline-delta` / `held-out` / `fetch(` / `corona-backtest.js`
  import. No external fetch, no T4 work, no frozen-artifact write (guard intact).
- `--state baseline` / `--emit-hashes` stdout sha256 == committed baseline blob
  **`538cba01…86d491`** (cross-process; whole-file byte identity, not just events).
- **Secret / credential / abs-path / PII scan of all new + modified files: 0 findings.**

**Special focus — shared `runtime_revision='cycle-004-s01-baseline'`:** **ACCEPTABLE,
intentional, documented, does not mask differences.** `meta.runtime_revision` is inside the
SHA-256'd trajectory (`replay/hashes.js` blanks only `meta.trajectory_hash`). A per-state
value would change *every* hash (T1 included), breaking the negative control and
ablated==baseline. Holding it constant makes the wired↔ablated delta arise **solely** in the
other hashed fields (`position_history`, `current_position`, `evidence_bundles_consumed`),
which my recompute proves vary genuinely by state (§5–6). Documented at harness:86-91, report
§3, PROOF-SUMMARY §1, CLOSEOUT §10.5. Sharing it **strengthens** the proof.

## 3. Proof artifact audit — PASS

| Check | wired | ablated |
|-------|-------|---------|
| events | 60 | 60 |
| record keys | `{event_id,theatre,trajectory_hash}` only | same |
| 64-hex SHA-256 | ✓ | ✓ |
| deterministic sort | ✓ | ✓ |
| scoring/Brier/uplift/improvement/delta field | none | none |
| pure LF | ✓ | ✓ |

PROOF-SUMMARY carries the explicit T2 wired-vs-ablated count (30) + **full 30-event list**;
T1 negative-control identity; the ablated==baseline §6.10 method statement; and safe
no-rung / no-scoring / T4-only-ceiling language.

## 4. §6.10 ablated == baseline — PASS (independent)

Method: committed **LF blob via `git cat-file -p HEAD:…/baseline-hashes.json`** (method 2)
**+ `JSON.parse` canonical compare** (method 1). No raw working-tree diff. Result:
`ablated.events === baseline.events` for **all 60** (T1 30/30, T2 30/30). ablated ==
committed-fixture hash 30/30 T2. `--state baseline` reproduces the committed blob byte-for-byte.

## 5. Wired-vs-ablated — PASS (independent)

**30/30** T2 events differ; the diff set **exactly equals** the independently-derived
strict-pre-cutoff set (cutoff = `kp_window_end`, via the same `_deriveKpPreCutoffObservations`
helper). The "30" is **corpus-observed, not hardcoded** (§15). Full list in PROOF-SUMMARY §4.
Framed as wiring observability — not rung/accuracy/calibration/uplift/forecasting.

## 6. Genuine consumption + auditor negative controls — PASS (independent, paranoid)

For all 30 pre-cutoff T2 events: wired ≠ ablated; `position_history` grows;
`current_position` moves; wired `evidence_bundles_consumed` non-empty; ablated empty;
**`wired.history.length == ablated.history.length + #bundles` for all 30** (ablated is
prior-only length-1; grows by exactly #consumed bundles); **every non-prior wired history
entry maps to a consumed bundle id (0 unmapped)**; wired `current_position` ∈ [0,1] with
**21/30 distinct** values (real per-event movement through `processGeomagneticStormGate`,
not a constant). Change comes from the existing gate path, not metadata churn.

**Auditor-added negative controls (new this gate):**
- **NEG-CTRL-1 — empty `kp_observations`:** wired == ablated, 0 bundles → the wiring is
  **gated on observation presence**, not blanket-applied.
- **NEG-CTRL-2 — all observations at/after cutoff:** 0 strict-pre-cutoff → wired == ablated
  → **strict pre-cutoff gating respected (no leakage)**.
- **NEG-CTRL-3 — `wireEvidence:false` ≡ no-options:** 30/30 identical → reversibility/
  default-off identity holds at the call-convention level.

These rule out the "hollow proof" failure mode (PRD §2.3): differences are caused by, and
only by, genuine strictly-pre-cutoff evidence consumption.

## 7. Replay-twice determinism — PASS (independent)

`--state wired` and `--state ablated` byte-identical across **separate node processes**
(sha256 of stdout: wired `d7e4fb61…`, ablated `f279af46…`, baseline `538cba01…`). No
walltime/random (behavioral stub-to-throw: 0; comment-stripped grep: 0).

## 8. T1 negative control — PASS (independent)

T1 wired == ablated == baseline for all 30; T1 `evidence_bundles_consumed` empty (30/30);
history length 1. `t1-replay.js` clean vs HEAD (blob `9c46c8ad…`); `corpus-loader.js`
(deriveEvidenceT1) clean vs HEAD; `flare-gate.js` clean (`377725ec…`); no flux→solar_flare
mapping.

## 9. Cycle-002 frozen-corpus regression — PASS (independent)

Pure, file-free `dispatchCycle002Replay()` vs the **committed** manifest
`entries[].trajectory_hashes` anchor (`git cat-file`): **15/15 (T1/T2/T4 × 5) identical.**
`corona-backtest-cycle-002.js` not edited; the test writes nothing. Trajectory hashes are
independent of `replay_script_hash`/`code_revision`, so the npm-test provenance churn does
not affect this comparison.

## 10. Sprint 03 test audit — PASS

Each test performs real computation against source/corpus/committed-blobs and would fail on
regression; none merely asserts the report. I corroborated each gate by independent recompute
that reproduced the test's result (and added negative controls the tests don't run). The
`cycle-002-regression` and `ablated-equals-baseline` tests correctly read **committed blobs**
(`git cat-file`), not tamper-prone working-tree copies.

## 11. Re-run validation — PASS

| Command | Result |
|---------|--------|
| `--state wired` / `--state ablated` regenerate | 60 / 60; cross-process byte-identical |
| §6.10 ablated==baseline (canonical + committed blob) | 60/60 (T1 30, T2 30) |
| Sprint 03 suite (8 files) | **tests 18 \| pass 18 \| fail 0** |
| Sprint 02 suite (4 files) | **tests 19 \| pass 19 \| fail 0** |
| `npm test` | **tests 296 \| pass 296 \| fail 0** |
| `git cat-file HEAD:scripts/corona-backtest.js \| sha256sum` | `17f6380b…1730f1` (I1) |
| `package.json` | `0.2.0 {}` |
| cycle-003 corpus_hash | `7b6c5b48…d5003` |
| claim-grep gate test | swept 28 files, **0 violations** |

(The audit-script `/tmp` path mismatch the reviewer noted is an MSYS-vs-Windows artifact;
in-process + `os.tmpdir()` regeneration succeeds — not an implementation issue.)

### npm test side-effect — observed, provenance-only, restored
`npm test` updated **5** cycle-002 files (`run-2`/`run-3` `replay_script_hash.txt` +
`sensitivity-summary.md`, `cycle-002/runtime-replay-manifest.json`). Full line-by-line
enumeration: **100% provenance** — `replay_script_hash` `a919ec7d…→8bf4de7e…` (t2-replay
changed in S02) and `code_revision`→`2c83bc66…` (HEAD). **No** score / sensitivity / bucket /
corpus_hash line changed. Restored via `git restore`; post-restore the 5 files are
**byte-identical to HEAD** (`git diff --quiet HEAD` clean).

## 12. Forbidden-path audit — PASS

`git diff --quiet HEAD` clean for **every** forbidden surface: corpus-loader, t2/t1-replay,
both gates, certificates, both cycle entrypoints, package.json, README, BUTTERFREEZONE, root
prd/sdd/ledger, NOTES.md, and all of `src/theatres/`, `grimoires/loa/calibration/`, `.beads/`.
`.gitattributes` correctly **absent**. No parameter/threshold/base_rate/sigma/lambda/formula
change; no T1 flux mapping; no T4 work; no external fetch; no package/dependency change; no
scoring/Brier/skill/baseline-delta/held-out. **No stray files** from any audit run; the
temporary audit helper was created outside the tree and removed.

## 13. Claim-grep posture — PASS (independent, 3-way)

(a) Raw space-form grep on the new prose → **0** hits. (b) Hyphenated/negation-form grep →
every occurrence manually adjudicated as the **verbatim allowed posture**, a "no X" negation,
a historical-ceiling statement, or a backtick mention (e.g., PROOF-SUMMARY:80 "…**not** a
\`forecasting-accuracy\`…"). (c) The engineer's `claim-grep-gate-test.js` (28 files, 0
violations) is teeth-verified. Harness `STATE_META` descriptions are negation-framed. No
positive forbidden claim exists anywhere in the cycle-004 Sprint-03 surface.

## 14. Carry-forward documentation audit — PASS

`CLOSEOUT.md §10` documents (without performing): final closeout should update NOTES/Obsidian
durable docs; **T1 stays blocked** absent a native `xray_flux` gate evidence type or a
pre-cutoff flare-*event* corpus; **T4 raw-proton unblock deferred** to a separate
operator-gated cycle; optional `_deriveKpPreCutoffObservations` clean-export; optional
`.gitattributes` proof-JSON `eol=lf` pin (out of scope unless authorized); and that no broad
NOTES/Obsidian docs were mutated this sprint. Independently confirmed NOTES.md and the
cycle-004 planning docs are unchanged.

## 15. Adjudications

**Special focus (shared runtime_revision):** **ACCEPTABLE** — see §2. Load-bearing,
documented, strengthens (does not mask) the proof.

**C1 — report does not cross-reference carry-forwards:** **ACCEPTABLE as-is. No fix
required.** The carry-forwards are complete and in their correct home (`CLOSEOUT.md §10`, the
dedicated closeout doc). Cross-referencing from the implementation report is a cosmetic
nicety with no correctness/security impact. The operator MAY add a one-line pointer at commit
time; it does not gate approval.

**C2 — claim-grep heuristic line-level permissive:** **ACCEPTABLE as-is. No fix required.**
This is test-quality, not code-safety. The documented risk profile is a false negative, never
a false alarm; and I proved by three independent methods (§13) that the actual prose is clean,
so the theoretical permissiveness has no live exploit. Tightening the heuristic
(used-mention proximity / per-occurrence negation scoping) is a reasonable **future**
improvement, not a Sprint-03 blocker.

**C3 — frozen sha256 anchors baked as literals:** **ACCEPTABLE under repo convention. No fix
required.** I independently re-derived every anchor from HEAD (all match), `git diff --quiet
HEAD` backstops working-tree edits, and HEAD == cycle-004 base (0 commits) so the anchors pin
the correct content. This mirrors `cycle-002-entrypoint-test.js`. Standard frozen-anchor
maintenance tradeoff.

**Assumption ("30" observed not hardcoded):** **CONFIRMED.**
`replay-t2-wired-vs-ablated-test.js` asserts `diffIds.length > 0` and
`deepEqual(diffIds, withPreCutoff)` (corpus-derived), **not** `=== 30`. NEG-CTRL-1/2 prove the
gating is real. Self-correcting under corpus change.

**Rejected alternative (richer per-event artifacts):** **REJECTION CORRECT.** Extra per-event
fields would break the clean `ablated.events === baseline.events` whole-array identity (the
baseline fixture carries only `{theatre,event_id,trajectory_hash}`) and drift toward
scoring-like metrics. The genuine-consumption depth correctly lives in the separate
trajectory-internals test + this audit's recompute/negative-controls. Minimal hash-only
artifact is the right proof shape.

## Frozen-invariant verification

I1 `17f6380b…1730f1` ✓ · `package.json` `0.2.0`/`{}` ✓ · cycle-003 corpus_hash
`7b6c5b48…d5003` ✓ · Sprint-01 baseline blob `538cba01…86d491` (unmodified — not secretly
regenerated) ✓ · gate/cert/t1-replay anchors `377725ec…`/`466ad282…`/`eeef486c…`/`9c46c8ad…` ✓.

## Hard-stop status

**No hard stop.** HS-4/6/7/8/9/10 all clear.

## Fix required before operator approval / commit?

**No.** All three concerns are non-blocking and ruled acceptable as-is. The sprint is
audit-clean.

## Final git status --short

```
 M scripts/corona-backtest-cycle-004-evidence-wiring.js
?? grimoires/loa/a2a/cycle-004/proof/PROOF-SUMMARY.md
?? grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json
?? grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
?? grimoires/loa/a2a/cycle-004/sprint-03/   (implementation-report.md, review-feedback.md, CLOSEOUT.md, auditor-feedback.md, COMPLETED)
?? tests/  (8 Sprint 03 test files)
```
Tree holds only authorized Sprint 03 paths. npm-test provenance side-effect restored; 0 dirt.

## Disposition

**APPROVED.** Cycle-004 Sprint 03 proof closeout is correct, deterministic, honest, and
within scope. No rung banked; cycle-002 T4-only ceiling preserved; v0.2.0. Auditor did **not**
commit, push, tag, bump, implement final cycle closeout, or update broad NOTES/Obsidian docs.
A `COMPLETED` marker is written alongside this file. **Awaiting operator instruction.**
