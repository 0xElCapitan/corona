# Sprint 04 Implementation Report — T3 / T5 Posture (Option A)

**Status**: Implementation complete; awaiting `/review-sprint sprint-04`.
**Authored**: 2026-05-02
**Cycle / Sprint**: cycle-002 / sprint-04
**Routing**: cycle-002 [SPRINT-LEDGER.md](../SPRINT-LEDGER.md) (operator ratification: Sprint 04 proceeds under Option A; Option B not authorized).
**Predecessor commit**: `3d6e9dc` (Sprint 03 commit on `main`).
**Working tree pre-sprint**: clean.

---

## Executive summary

Sprint 04 is a **docs-only sprint under Option A (default)**. The single binding deliverable is the T3 / T5 posture document at [grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md](T3-T5-POSTURE.md). It locks:

- **T3 posture** as `[external-model]` — diagnostic-only; never CORONA-owned predictive uplift.
- **T5 posture** as `[quality-of-behavior]` — diagnostic-only; never converted to probabilistic Brier.
- **Option A decision** — T5 trajectory emission deferred for cycle-002; no `replay_T5_event` module exists or will be created in Sprint 04; `src/` is not touched.
- **Sprint 06 citation block** — four binding sentences Sprint 06 closeout cites verbatim.

No source code changed. No tests added. No manifest mutated. Test totals remain **279 pass / 0 fail / 0 skip** — the Sprint 03 baseline is preserved verbatim. Cycle-001 invariants intact (`script_hash = 17f6380b…1730f1`, `calibration-manifest.json` sha256 = `e53a40d1…5db34a`). Cycle-002 `replay_script_hash` anchor at `bfbfd70d…e2e8fe` (Sprint 03 close) unchanged.

---

## AC Verification

The "binding Sprint 04 implementation spec" per operator ratification is the operator's `/implementing-tasks sprint-04` instruction itself plus the cycle-002 sprint plan §4.2 (Option A path). ACs below quote the operator's binding deliverable list verbatim and the sprint plan's exit criteria.

| # | AC (verbatim) | Status | Evidence |
|---|---------------|--------|----------|
| AC-1 | Operator instruction: "Create: `grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md`" | ✓ Met | File created at [grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md](T3-T5-POSTURE.md) (192 lines). |
| AC-2 | T3 posture: "T3 is `[external-model]`" | ✓ Met | [T3-T5-POSTURE.md §1 first table row](T3-T5-POSTURE.md): "Posture tag: `[external-model]`". |
| AC-3 | T3 posture: "WSA-Enlil is the canonical/external prediction source" | ✓ Met | [T3-T5-POSTURE.md §1 table](T3-T5-POSTURE.md): "Canonical/external prediction source: NASA DONKI WSA-Enlil ensemble (`wsa_enlil_predicted_arrival_time` field on each T3 corpus event)". Rationale at §1.1. |
| AC-4 | T3 posture: "CORONA does not own CME arrival prediction quality in cycle-002" | ✓ Met | [T3-T5-POSTURE.md §1 table](T3-T5-POSTURE.md): "CORONA ownership of CME-arrival prediction quality in cycle-002: NONE." Expanded at §1.1. |
| AC-5 | T3 posture: "T3 may appear in diagnostic summaries only" | ✓ Met | [T3-T5-POSTURE.md §1 table](T3-T5-POSTURE.md): "Reportable in diagnostic summaries: YES". §1.2 cites the structural enforcement at `scripts/corona-backtest/reporting/diagnostic-summary.js` and the cycle-002 manifest's `diagnostic_only: true` flag. |
| AC-6 | T3 posture: "T3 must NOT count toward runtime-uplift composite" | ✓ Met | [T3-T5-POSTURE.md §1 table](T3-T5-POSTURE.md): "Counts toward runtime-uplift composite: NO". §1.2 cites the structural enforcement at `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']` ([scripts/corona-backtest/reporting/runtime-uplift-summary.js:26](../../../../../scripts/corona-backtest/reporting/runtime-uplift-summary.js)). §1.3 enumerates forbidden T3 framings. |
| AC-7 | T3 posture: "T3 must NOT be cited as CORONA-owned predictive uplift" | ✓ Met | [T3-T5-POSTURE.md §1 table](T3-T5-POSTURE.md): "Citable as CORONA-owned predictive uplift: NO". §1.3 lists forbidden framings. The Sprint 06 citation block at §4 includes the verbatim sentence "T3 [external-model] is not counted toward CORONA-owned predictive uplift." |
| AC-8 | T5 posture: "T5 is `[quality-of-behavior]`" | ✓ Met | [T3-T5-POSTURE.md §2 first table row](T3-T5-POSTURE.md): "Posture tag: `[quality-of-behavior]`". |
| AC-9 | T5 posture: "T5 settlement remains quality-of-behavior: false positive rate, stale feed p50, satellite switch handling, hit-rate diagnostic" | ✓ Met | [T3-T5-POSTURE.md §2 table](T3-T5-POSTURE.md): "Settlement type in cycle-002: Quality-of-behavior. Settlement metrics: false-positive rate (`fp_rate`), stale-feed detection latency (`stale_feed_p50_seconds` / `stale_feed_p95_seconds`), satellite-switch handling rate (`satellite_switch_handled_rate`), hit-rate diagnostic (`hit_rate_diagnostic`)." |
| AC-10 | T5 posture: "T5 has no external probabilistic ground truth in cycle-002" | ✓ Met | [T3-T5-POSTURE.md §2 table](T3-T5-POSTURE.md): "External probabilistic ground truth available: NONE in cycle-002." Rationale at §2.1. |
| AC-11 | T5 posture: "T5 may appear in diagnostic summaries only" | ✓ Met | [T3-T5-POSTURE.md §2 table](T3-T5-POSTURE.md): "Reportable in diagnostic summaries: YES". §2.2 cites the structural enforcement (`DIAGNOSTIC_THEATRES = ['T1','T2','T3','T4','T5']`; `diagnostic_only: true` in manifest). |
| AC-12 | T5 posture: "T5 must NOT count toward runtime-uplift composite" | ✓ Met | [T3-T5-POSTURE.md §2 table](T3-T5-POSTURE.md): "Counts toward runtime-uplift composite: NO". §2.2 enforcement reference. §2.3 forbidden framings. |
| AC-13 | T5 posture: "T5 must NOT be converted into probabilistic Brier uplift" | ✓ Met | [T3-T5-POSTURE.md §2 table](T3-T5-POSTURE.md): "Convertible to probabilistic Brier uplift: NO". §2.3: "T5 Brier / T5 probabilistic uplift — T5 emits no probabilistic prediction in cycle-002." Reinforced by Q3 freeze citation at §2.1. |
| AC-14 | Option A decision: "T5 trajectory emission is deferred for cycle-002" | ✓ Met | [T3-T5-POSTURE.md §3 table](T3-T5-POSTURE.md): "T5 trajectory emission for cycle-002: DEFERRED." Why-explanation at §3.1. |
| AC-15 | Option A decision: "No `replay_T5_event` module exists or should be created in Sprint 04" | ✓ Met | [T3-T5-POSTURE.md §3 table](T3-T5-POSTURE.md): "`replay_T5_event` module under `scripts/corona-backtest/replay/`: DOES NOT EXIST and MUST NOT BE CREATED in Sprint 04." Verified by `ls scripts/corona-backtest/replay/` returning only canonical-json.js, context.js, hashes.js, t1-replay.js, t2-replay.js, t4-replay.js (no t5-replay.js). |
| AC-16 | Option A decision: "Existing T5 scoring numerics remain unchanged" | ✓ Met | [T3-T5-POSTURE.md §3 table](T3-T5-POSTURE.md): "Existing T5 scoring numerics … UNCHANGED." `git status --short scripts/corona-backtest/scoring/t5-quality-of-behavior.js` returns nothing. The cycle-002 entrypoint routes T5 through this unchanged scorer per [scripts/corona-backtest-cycle-002.js:210, 288](../../../../../scripts/corona-backtest-cycle-002.js). |
| AC-17 | Option A decision: "No source/runtime change is needed" | ✓ Met | [T3-T5-POSTURE.md §3 table](T3-T5-POSTURE.md): "Source/runtime change required: NONE. `src/` is not modified by Sprint 04." `git status --short src/` returns nothing. |
| AC-18 | Sprint 06 citation block: "T3 [external-model] is not counted toward CORONA-owned predictive uplift." | ✓ Met | [T3-T5-POSTURE.md §4 first blockquote](T3-T5-POSTURE.md) — verbatim. |
| AC-19 | Sprint 06 citation block: "T5 [quality-of-behavior] is not counted toward CORONA-owned predictive uplift." | ✓ Met | [T3-T5-POSTURE.md §4 second blockquote](T3-T5-POSTURE.md) — verbatim. |
| AC-20 | Sprint 06 citation block: "Cycle-002 runtime-uplift claims are restricted to T1/T2/T4, with T4 as the clean owned-uplift theatre." | ✓ Met | [T3-T5-POSTURE.md §4 third blockquote](T3-T5-POSTURE.md) — verbatim. |
| AC-21 | Sprint 06 citation block: "T1/T2 are runtime-wired but prior-only on the current cycle-001 corpus shape and cannot claim calibration improvement in cycle-002." | ✓ Met | [T3-T5-POSTURE.md §4 fourth blockquote](T3-T5-POSTURE.md) — verbatim. |
| AC-22 | Hard stops respected (no Option B work; no `src/` edit; no scoring change; no manifest mutation; no runtime parameter change; no T3/T5 inclusion in runtime-uplift; no README/BFZ/version/tag work; no cycle-001 artifact mutation) | ✓ Met | `git status --short` shows only sprint-04 doc files (T3-T5-POSTURE.md + reviewer.md). No `src/` files in diff. No `scripts/` files in diff. No manifest files in diff. No `package.json` in diff. No `README.md` / `BUTTERFREEZONE.md` in diff. No cycle-001 sprint folder, run output, or `calibration-manifest.json` in diff. Cycle-001 entrypoint sha256 unchanged. |
| AC-23 | "Run `npm test`" | ✓ Met | `npm test` returns 279 pass / 0 fail / 0 skip — Sprint 03 baseline preserved verbatim (no scope change). |

No AC marked `✗ Not met`, `⚠ Partial`, or `⏸ [ACCEPTED-DEFERRED]`.

---

## Tasks completed

### Task 1 — T3/T5 posture document (binding Sprint 04 deliverable)

Files: 1 new.

- [grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md](T3-T5-POSTURE.md) — 192 lines. Sections:
  - §1 T3 posture (`[external-model]`) — table + rationale + reporting boundary + forbidden framings.
  - §2 T5 posture (`[quality-of-behavior]`) — table + rationale + reporting boundary + forbidden framings.
  - §3 Option A decision — explicit table of what is deferred / unchanged / not created; structural-invariant statements; explicit "Option B is closed for cycle-002" line per operator ratification.
  - §4 Sprint 06 citation block — four binding sentences cited verbatim from the operator's instruction; honest-framing grep gate cross-reference.
  - §5 Hard stops — eight items aligned with cycle-002 sprint plan §4.2.9 + operator instruction.
  - §6 Cross-references — pointers to PRD/SDD/CHARTER/CONTRACT/REPLAY-SEAM/Sprint 03 artifacts and the structural enforcement modules.

The document is a pure ratification artifact — no inline code, no tests, no manifest writes. It exists to be cited by Sprint 06 closeout.

### Task 2 — Implementation report

Files: 1 new.

- [grimoires/loa/a2a/cycle-002/sprint-04/reviewer.md](reviewer.md) — this file.

---

## Technical highlights

- **Docs-only sprint by design**. Sprint 04's value is procedural: locking the T3/T5 posture into a citable artifact so Sprint 06 closeout cannot accidentally weaken cycle-001's honest-framing memory binding. There is intentionally no code, no tests, no scoring change, no source mutation.
- **Option B explicitly closed**. The posture document's §3 records that no operator ratification line authorizing Option B was issued, so Option A is binding for cycle-002. This forecloses the question for the remainder of the cycle.
- **Structural enforcement is downstream of this doc**. The T3/T5 reporting-boundary claims are not just prose — they are backed by the constants `RUNTIME_UPLIFT_THEATRES = ['T1','T2','T4']` and `DIAGNOSTIC_THEATRES = ['T1','T2','T3','T4','T5']` introduced in Sprint 03, plus the manifest's `included_in_runtime_uplift_composite` / `diagnostic_only` flags. The posture document cites those structural enforcements so a future reader can audit doctrine ↔ code coherence in one read.
- **Sprint 06 citation block is verbatim-quotable**. The four sentences in §4 are wrapped as blockquotes with no prose inserted between them, so Sprint 06 can copy-paste without re-formatting and without risking accidental rewording.

---

## Honest framing (binding cycle-level)

- Sprint 04 is a **measurement-discipline sprint** within the cycle-002 measurement-seam cycle. It locks framing; it does NOT produce numerics or refit anything.
- T3 / T5 posture is unchanged from Sprint 02 / Sprint 03. The posture document just consolidates the framing into one citable artifact.
- T1 / T2 prior-only honest-framing disclosure carries forward verbatim from Sprint 02 reviewer.md M2 lines 456–464 and Sprint 03 cycle-002-run-1 outputs.
- No "calibration improved" / "predictive uplift demonstrated" / "L2 publish-ready" / "verifiable track record" claims appear in this report or in `T3-T5-POSTURE.md` outside negation / forbidden-framing / honest-framing-grep-gate context.
- No cross-regime Baseline A vs Baseline B comparison appears anywhere.

---

## Testing summary

`npm test` post-Sprint-04 (no scope change since Sprint 03):

```
ℹ tests 279
ℹ suites 29
ℹ pass 279
ℹ fail 0
ℹ duration_ms ~310
```

No new tests added (per Option A — `tests/` is NOT extended). Sprint 03 baseline (279 pass) preserved verbatim. Test files list in `package.json` `scripts.test` is unchanged.

To reproduce locally:

```bash
npm test
# expect: pass 279, fail 0
```

---

## Operator-mandated post-implementation report items

- **`npm test`**: 279 pass / 0 fail (Sprint 03 baseline preserved verbatim).
- **Changed files**:
  - Added: `grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md`, `grimoires/loa/a2a/cycle-002/sprint-04/reviewer.md`.
  - Modified: none.
  - Total scope: 2 new docs in `grimoires/loa/a2a/cycle-002/sprint-04/`.
- **No `src/` changes**: Confirmed. `git status --short src/` returns nothing. `src/theatres/cme-arrival.js` zero-diff. `src/theatres/solar-wind-divergence.js` zero-diff. `src/rlmf/certificates.js` zero-diff.
- **No manifest changes**: Confirmed. `git status --short` shows no `calibration-manifest.json` or `runtime-replay-manifest.json` in diff. Cycle-001 calibration manifest sha256 unchanged at `e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a`. Cycle-002 additive manifest at `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json` unchanged from Sprint 03 close (`replay_script_hash = bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60`).
- **No scoring changes**: Confirmed. `git status --short scripts/corona-backtest/scoring/` returns nothing. `t1-binary-brier.js`, `t2-binary-brier.js`, `t1-bucket-brier.js`, `t2-bucket-brier.js`, `t3-timing-error.js`, `t4-bucket-brier.js`, `t5-quality-of-behavior.js` all zero-diff.

---

## Hard-stop posture

None of the operator-listed hard stops triggered:

- Implementation did NOT require Option B work — Option A is the binding default and was followed.
- No `src/` edit attempted.
- No scoring change attempted.
- No manifest mutation attempted.
- No runtime parameter change attempted.
- No T3/T5 inclusion in runtime-uplift scoring attempted (the posture document explicitly forbids it; the underlying enforcement constants in Sprint 03 reporting modules continue to exclude T3/T5).
- No README/BFZ/version/tag work attempted.
- No cycle-001 artifact mutation attempted; cycle-001 entrypoint sha256 verified unchanged.

---

## Verification steps for reviewer

1. Read [grimoires/loa/a2a/cycle-002/sprint-04/T3-T5-POSTURE.md](T3-T5-POSTURE.md) end-to-end. Confirm:
   - §1 covers all 6 T3 posture sub-points.
   - §2 covers all 6 T5 posture sub-points.
   - §3 records the Option A decision with explicit "no `replay_T5_event` module created" + "no `src/` change" statements.
   - §4 contains the four operator-supplied Sprint 06 citation sentences as standalone blockquotes, verbatim.
2. Confirm `git status --short` shows only the two new sprint-04 docs (no source, no test, no manifest, no package.json drift):
   ```
   ?? grimoires/loa/a2a/cycle-002/sprint-04/
   ```
3. Confirm `npm test` returns 279 pass / 0 fail (Sprint 03 baseline preserved).
4. Re-verify cycle-001 + cycle-002 invariants:
   ```bash
   node -e "const c=require('crypto');const fs=require('fs');console.log(c.createHash('sha256').update(fs.readFileSync('scripts/corona-backtest.js')).digest('hex'));"
   # expect: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1

   node -e "const c=require('crypto');const fs=require('fs');console.log(c.createHash('sha256').update(fs.readFileSync('grimoires/loa/calibration/corona/calibration-manifest.json')).digest('hex'));"
   # expect: e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a

   cat grimoires/loa/calibration/corona/cycle-002-run-1/replay_script_hash.txt
   # expect: bfbfd70d2402763ffb2033668c61f0ea9d547b1b7afe4d7da0028587de380a60
   ```
5. Confirm `ls scripts/corona-backtest/replay/` does NOT contain `t5-replay.js` (Option A — no T5 replay module).
6. Honest-framing grep gate on the new docs:
   ```bash
   grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record" grimoires/loa/a2a/cycle-002/sprint-04/*.md
   ```
   Expect matches only in negation, forbidden-framing, or grep-gate-citation context.

---

## Out-of-scope (deferred to later sprints, by operator instruction)

- Sprint 05 (sensitivity proof on T4 — Rung 2 territory). Not started.
- Sprint 06 (closeout, README/BFZ additive sections, conditional v0.3.0 tag). Not started.
- Option B (T5 trajectory emit). Closed for cycle-002 per operator's silence on the ratification gate.

No commit, no tag, no Sprint 05 start. Awaiting `/review-sprint sprint-04`.

---

*Sprint 04 implementation report authored 2026-05-02 against operator-ratified Option A default. Sprint 04 is docs-only by design. No source/runtime/scoring/manifest changes. Cycle-001 invariants intact (`script_hash = 17f6380b…1730f1`, `corpus_hash = b1caef3f…11bb1`, calibration-manifest.json sha256 = `e53a40d1…5db34a`). Cycle-002 `replay_script_hash` anchor at `bfbfd70d…e2e8fe` (Sprint 03 close) preserved. Honest-framing memory binding governs.*
