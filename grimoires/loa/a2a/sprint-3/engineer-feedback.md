# Sprint 3 Senior Review — Round 1

**Reviewer**: Senior Tech Lead (adversarial protocol)
**Date**: 2026-05-01
**Sprint**: sprint-3 / `corona-d4u` epic
**Verdict**: **CHANGES REQUIRED** — narrow Round 2 (~30 min total)

---

## Overall Assessment

Sprint 3 is fundamentally sound: 92/92 tests pass, validator green, zero new
deps, all 6 Sprint 3 ACs met with verifiable file:line evidence, no Sprint 4/5
leakage. The implementation respects operator hard constraint #5 (no shared
scoring code) by file boundary, the §3.7 corpus schema is enforced at load
time, the strict ≥10 MeV regex matches the runtime, the 72h prediction
window is enforced, and the Round 2 review residue (C6/C7/C8) is closed
both in code and in the per-theatre report.

But the adversarial bar is to find what's wrong, not to validate. Three
findings warrant a narrow Round 2 before audit:

1. **One latent correctness bug** in t5 stale-feed result construction.
2. **Two undocumented protocol interpretations** (T1 6-bucket, T2 G0
   addition) that should have been surfaced per Sprint 3 hard constraint #7
   ("if protocol ambiguity is found, stop and surface it instead of guessing").
3. **Two HITL decisions** that the reviewer.md acknowledges as gaps but
   doesn't crystallize into operator-facing yes/no questions
   (corpus-size partial acceptance, live-fetch validation timing).

None of these are full re-implementation work. The total fix budget is ~30
minutes: one surgical edit to one scoring file, plus a "Protocol
Interpretations" section appended to reviewer.md, plus explicit operator
acknowledgment of the two HITL decisions.

---

## Critical Issues (must fix before audit)

### CI-1 — Latent stale-feed indexing bug in t5

**File**: [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166-220](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166)

**Issue**: `staleLatenciesSec` is computed by mapping over `staleEvents` and
then **filtering out null entries** (line 173:
`.filter((v) => v != null)`). This collapses indices: if a stale event has
an unparseable timestamp, its slot in `staleLatenciesSec` is removed. Then
at lines 217-220 the harness reconstructs the per-event detail block by
zipping `staleEvents.map((s, i) => ...)` with `staleLatenciesSec[i]` —
which **misaligns indices when any prior event was filtered out**.

```js
// scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166-173
const staleLatenciesSec = staleEvents
  .map((s) => {
    const onset = parseIsoMs(s.actual_onset_time);
    const detect = parseIsoMs(s.detection_time);
    if (!Number.isFinite(onset) || !Number.isFinite(detect)) return null;
    return Math.max(0, (detect - onset) / 1000);
  })
  .filter((v) => v != null);   // ← collapses indices

// :217-220
stale_feed_events: staleEvents.map((s, i) => ({
  ...s,
  latency_seconds: staleLatenciesSec[i] ?? null,    // ← wrong index after filter
})),
```

**Concrete repro**: imagine a corpus T5 event with three stale-feed events,
the second of which has `actual_onset_time: "INVALID"`. The filter removes
that slot. Then:

- staleEvents[0] gets staleLatenciesSec[0] (correct)
- staleEvents[1] gets staleLatenciesSec[1] — WRONG, that's the third
  event's latency assigned to the second
- staleEvents[2] gets staleLatenciesSec[2] = undefined → null (WRONG,
  third event should have its real latency)

**Why it's not currently triggered**: the Run 1 corpus has all stale-feed
events with valid timestamps, so the filter is a no-op and indices align.
A future corpus extension or operator-authored event with a malformed
timestamp would silently produce wrong per-event latency in the report
without failing tests.

**Fix**: don't filter. Return null for invalid entries and preserve
indices. Aggregate-level percentile computation can then filter at the
percentile call site.

```js
// Replace lines 166-173:
const staleLatenciesSec = staleEvents.map((s) => {
  const onset = parseIsoMs(s.actual_onset_time);
  const detect = parseIsoMs(s.detection_time);
  if (!Number.isFinite(onset) || !Number.isFinite(detect)) return null;
  return Math.max(0, (detect - onset) / 1000);
});
// staleLatenciesSec is now same length as staleEvents; null marks invalid.

// Then at the aggregate call site (line 241), filter when sorting for percentile:
const allLatencies = perEvent
  .flatMap((r) => r.stale_latencies_sec)
  .filter((v) => v != null)
  .sort((a, b) => a - b);
```

This preserves index alignment for the per-event report AND keeps the
aggregate p50/p95 numerically correct.

**Severity**: latent (not triggered by current corpus), but a real
correctness bug. Must fix before audit because the audit's "input handling
under malformed data" check (per security review focus area) will hit this.

### CI-2 — Undocumented protocol interpretations (T1 6-bucket, T2 G0 addition)

**Files**:
- [scripts/corona-backtest/scoring/t1-bucket-brier.js:30](scripts/corona-backtest/scoring/t1-bucket-brier.js:30) and
  [scripts/corona-backtest/ingestors/corpus-loader.js:80](scripts/corona-backtest/ingestors/corpus-loader.js:80)
- [scripts/corona-backtest/scoring/t2-bucket-brier.js:32](scripts/corona-backtest/scoring/t2-bucket-brier.js:32) and
  [scripts/corona-backtest/ingestors/corpus-loader.js:126](scripts/corona-backtest/ingestors/corpus-loader.js:126)
- [grimoires/loa/a2a/sprint-3/reviewer.md](grimoires/loa/a2a/sprint-3/reviewer.md) (the gap is documentation absence)

**Issue T1**: Calibration protocol §4.1 says:

> "Bucket boundaries match the theatre buckets defined in `src/theatres/flare-gate.js` (TBD per Sprint 5 if buckets shift; pinned at Sprint 2 freeze)."

But [src/theatres/flare-gate.js](src/theatres/flare-gate.js) has **no
buckets defined** — T1 is a **binary** theatre per `construct.yaml:166-170`
(`type: binary`, `Will a ≥M/X-class flare occur within N hours?`). It has
`threshold_class: string` and `outcome: true|false`. There is no bucket
array.

Sprint 3's t1-bucket-brier.js and corpus-loader.js invented a 6-bucket
scheme `['<M', 'M1-M4', 'M5-M9', 'X1-X4', 'X5-X9', 'X10+']`. This is a
defensible interpretation (NOAA flare classification has these natural
boundaries), but the protocol literally says "match the theatre buckets
defined in src/theatres/flare-gate.js" and the runtime is binary.

**Sprint 3 hard constraint #7** (handoff §6 / sprint plan):

> "If protocol ambiguity is found, stop and surface it instead of guessing.
> Examples of ambiguity that should halt: ... a §4.x metric formula that's
> underspecified for an edge case."

The bucket count for T1 is "underspecified for an edge case" (the case
where the runtime is binary but §4.1 demands buckets). Sprint 3 should
have halted and surfaced this rather than picked 6 buckets silently.

**Issue T2**: Calibration protocol §4.2 says:

> "Primary metric: bucket-Brier on Kp level (bucket boundaries match the
> G-scale bands G1-G5 derived from Kp)."

Literal text: 5 G-scale bands (G1-G5). Implementation uses 6 buckets
(G0..G5), adding G0 for "no storm" (Kp < 5). G0 is a reasonable extension
since corpus events with Kp dipping <5 in some 3-hour intervals exist —
but it expands beyond the protocol's literal text.

**Why this matters even though Run 1 numbers don't change much**: the
Sprint 5 regression gate compares Run 2 against Run 1 buckets. If Sprint 5
re-baselines T1 to binary (or to a different bucket scheme matching what
flare-gate.js becomes), the corpus_hash will be invalidated by the
bucket-scheme change AND the prior Run 1 numbers will not be directly
comparable. This needs to be an explicit Sprint 3 → Sprint 5 contract
("Sprint 3 chose this scheme; Sprint 5 may revise") rather than an
implicit assumption.

**Fix**: Append a "Protocol Interpretations" section to
`grimoires/loa/a2a/sprint-3/reviewer.md` that explicitly:

1. Names the T1 6-bucket scheme and explains why it was chosen over
   binary (because §4.1 demands buckets, runtime is silent → Sprint 3
   picked NOAA classification boundaries).
2. Names the T2 G0 addition and explains why (because primary corpus
   events occasionally have Kp dipping below 5 in scoring windows;
   strict G1-G5 would discard those).
3. **Explicitly tags both as "INTERPRETATION — Sprint 5 may revise per
   §4.1's TBD clause"** so the regression gate has a clear handoff
   contract.

This closes the Sprint 3 hard constraint #7 gap by surfacing what was
silently picked — without requiring the buckets to actually change.

**Severity**: protocol fidelity. Must fix before audit because the audit's
"protocol fidelity / no new scoring semantics invented" check will surface
this and the auditor needs the interpretive trail.

---

## Operator HITL Decisions (must crystallize before audit)

These are the decisions the operator pre-authorized as Round 2 candidates
in the review brief ("If review finds corpus-size or live-fetch issues,
pause for a narrow Round 2"). They are documented in reviewer.md §6 as
"known limitations" but should be promoted to **explicit operator decisions**
before audit so the audit isn't asked to bless ambiguity.

### HITL-1 — Corpus size: 5 events/theatre vs §3.2 #4 soft target of 15-25

**Reviewer.md location**: §6.1.

**Protocol position** (`grimoires/loa/calibration/corona/calibration-protocol.md` §3.2 #4):

> "Per-theatre target count: ~15-25 events per theatre. Soft target.
> Sprint 3 / corona-2b5 (corpus commit task) finalizes the per-theatre
> event list. If a theatre cannot reach 15 primary events under these rules,
> Sprint 3 documents the gap and the regression gate threshold tightens
> automatically (the theatre cannot be claimed as well-calibrated below
> the lower bound)."

**Status**: explicitly accepted by protocol with documentation. Reviewer.md
§6.1 documents the gap correctly.

**Decision needed**: operator confirms one of:
- (A) **Accept partial corpus for Sprint 3 baseline.** Run 1's corpus_hash
  will be regenerated when Sprint 5 / a future cycle extends the corpus
  toward the 15-25 target. The Sprint 5 regression gate compares Run 2
  against this Run 1's frozen 5/theatre baseline.
- (B) **Block Sprint 3 close until corpus reaches 15-25 per theatre.**
  Defer the rest of Sprint 3 until the operator authors / curates the
  additional events.

**My recommendation**: (A). The protocol explicitly accepts this, the
limitation is documented, and the Sprint 3 deliverable is the harness +
baseline run, not a complete corpus. Extending the corpus is a corpus-data
task that doesn't depend on Sprint 3 infrastructure.

**Action**: add a Decision Log entry to `grimoires/loa/NOTES.md` reading
either "(A) accept partial corpus per §3.2 #4" or "(B) block — extend
corpus" and reference it from reviewer.md.

### HITL-2 — Live DONKI/GFZ validation: SDD §6.3 intent gap

**Reviewer.md location**: §6.3 + §6.6.

**SDD position** (sdd.md §6.3):

> "Sanity-sample harness ... runs first in Sprint 3, **fetches 5 events
> spanning 2017→2026**, prints normalised output, halts on shape mismatch.
> Sprint 3 task ordering: sanity-sample passes ⇒ full ingestor build
> proceeds."

The literal SDD wording implies live fetch. The Sprint 3 hard constraint
#10 (handoff §6 #10) phrases the same requirement more permissively:

> "Sanity-sample (corona-v9m) MUST PASS 5/5 BEFORE full ingestor build
> proceeds — non-negotiable per SDD §6.3."

The implementation passes 5/5 in **offline** mode against agent-authored
fixtures. The `--online` flag exists for live fetch when `NASA_API_KEY` is
set, but was not exercised against the live NASA DONKI API in this sprint.

**Concern**: agent-authored fixtures encode what I (the implementing
agent) believed DONKI returns based on training-data knowledge. This is
correct for FLR/CME/GST/IPS shape *as commonly documented*, but the
**R3 risk** ("DONKI archive returns inconsistent shapes across 2017-2026
... era-aware ingestor MUST handle 2017-2026 shape variants") is **not
actually mitigated** until live fetches succeed. The 5/5 offline pass tells
us the harness can parse fictional shapes, not real ones.

**Decision needed**: operator confirms one of:
- (A) **Accept offline-only sanity for Sprint 3 close. Validate against
  live DONKI as a post-merge / Sprint 7 final-validate operator step.**
  Operator runs `node scripts/corona-backtest/ingestors/donki-sanity.js
  --online` with `NASA_API_KEY` set after merge, captures the cache files
  in `scripts/corona-backtest/cache/donki/` (gitignored), and compares
  normalised output against the offline fixtures. Any divergence triggers
  a corpus-loader fix in a follow-up cycle.
- (B) **Block Sprint 3 close until operator runs --online here.** Operator
  provides `NASA_API_KEY` and re-runs the sanity sample live before
  audit. This validates R3 mitigation against real archive shapes.

**My recommendation**: (A) with a documented operator commitment to run
`--online` post-merge. Reasoning:
- The literal Sprint 3 hard constraint #10 ("MUST PASS 5/5 before full
  ingestor build") is met (offline 5/5).
- The harness has both modes; reproducing R3 is a post-merge operator step.
- Blocking Sprint 3 on live network egress in this execution context is
  disproportionate.

**Action**: same — Decision Log entry in NOTES.md + reference from
reviewer.md. If (A), add explicit acceptance criterion for the post-merge
`--online` validation (e.g., "Sprint 7 final-validate must include `--online`
sanity output reconciling against the offline fixtures").

---

## Adversarial Analysis

### Concerns Identified (minimum 3)

1. **CI-1: Stale-feed indexing bug** — [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166-220](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166).
   Latent (not triggered by current corpus); a real correctness bug that
   would silently produce wrong per-event latency under malformed input.
2. **CI-2: T1 6-bucket / T2 G0-addition protocol interpretation
   undocumented** — [scripts/corona-backtest/scoring/t1-bucket-brier.js:30](scripts/corona-backtest/scoring/t1-bucket-brier.js:30) and
   [scripts/corona-backtest/scoring/t2-bucket-brier.js:32](scripts/corona-backtest/scoring/t2-bucket-brier.js:32). Sprint 3 hard
   constraint #7 violation (should have surfaced rather than guessed).
3. **Corpus loader silently continues on missing theatre subdir** —
   [scripts/corona-backtest/ingestors/corpus-loader.js:381-386](scripts/corona-backtest/ingestors/corpus-loader.js:381).
   `errors` channel conflates HARD rejections (halt) with INFORMATIONAL
   warnings (continue). orchestrator only halts on totalRejected count
   ([scripts/corona-backtest.js:128-132](scripts/corona-backtest.js:128)).
   A misconfigured corpus directory could silently produce a Run 1 with
   empty events for a theatre. Latent risk; not blocking, but worth a
   future hardening pass.
4. **Empty-corpus T5 verdict is "pass"** — when n_signals = n_stale =
   n_switches = 0, all three primary metrics resolve to pass-band defaults
   (FP=0, p50=0, switch=1.0 because of the `=== 0 ? 1 : ...` branch at
   t5-quality-of-behavior.js:248). Documented in reviewer.md §6.5; not
   blocking because Run 1 corpus is non-empty, but the verdict logic
   should require `n_signals > 0` for a non-degenerate "pass".
5. **DONKI auth path: NASA_API_KEY env-var fallback to DEMO_KEY** —
   [scripts/corona-backtest/ingestors/donki-fetch.js:54-65](scripts/corona-backtest/ingestors/donki-fetch.js:54). If
   the operator runs `--online` with no key set, the throttle drops to
   35/hr (DEMO_KEY ceiling). Five events at 35/hr is fine, but a future
   corpus extension fetching dozens of events would silently take hours.
   Reviewer.md doesn't mention this throttle behavior. Minor.

### Assumptions Challenged (minimum 1)

**Assumption A**: "Uniform-prior is a defensible Run 1 baseline."

- **What was assumed**: that uniform-prior `[1/B, 1/B, ...]` produces a
  meaningful "no-model floor" Brier number that Sprint 5 will improve over.
- **Risk if wrong**: For a corpus where all events fall in a single bucket
  (the case for our 5-event T1 corpus, where all 5 are X-class flares
  spread across X1-X4 / X5-X9 / X10+), the uniform-prior Brier is **fixed
  at `(B-1)/(B²)` per event, regardless of which bucket the event falls
  in.** The aggregate Brier therefore tells the reviewer *nothing* about
  the runtime's prediction quality — it's a constant determined by the
  bucket count alone. The Run 1 number is essentially decorative.
- **Recommendation**: explicit. Reviewer.md should say "Run 1 baseline
  numbers reflect the no-model bucket-count floor and should NOT be used
  as a CORONA-prediction-quality measurement. Sprint 5 refit replaces this
  with runtime predictions; the regression gate should compare *Run 2 vs
  some-future-Run-N*, NOT *Run 2 vs Run 1*, for any T1/T2/T4 metric where
  Run 1 used uniform prior." — alternatively, the corpus-loader could
  precompute and cache the runtime's prediction at corpus-construction
  time, but that's Sprint 5 scope.

**Assumption B**: "T5 corpus events with `false_positive_label` from the
corpus author are the source of truth for FP detection."

- **What was assumed**: that the corpus author labels each divergence
  signal as FP/non-FP correctly. The harness uses the LABEL only as input
  to the §4.5.1.c switch-handling check; for §4.5.1.a FP rate it computes
  FP based on resolution-window + corroboration, which COULD disagree
  with the corpus author's label.
- **Risk if wrong**: a corpus author who labels a signal as
  `false_positive_label: false` but doesn't include corroboration → the
  harness will compute FP=true (resolved fast, no corroboration). The
  per-event report shows `corpus_fp_label: false; computed_false_positive:
  true` — useful diagnostic, but the aggregate FP rate is driven by the
  computed value, not the author label. This is BY DESIGN per §4.5.1.a but
  is non-obvious — the corpus author has to author corroborating_alerts
  carefully or the metric will under- or over-count.
- **Recommendation**: reviewer.md should call this out so corpus extension
  cycles understand the contract. Consider adding a corpus-loader warning
  when corpus_fp_label and computed_false_positive disagree by more than N
  events.

### Alternatives Not Considered (minimum 1)

**Alternative 1**: Wire the runtime theatres into the harness to compute
predictions at score time, instead of using uniform prior.

- **Tradeoff**: more complex Sprint 3 surface (the harness imports
  `createFlareClassGate`, `createGeomagneticStormGate`, etc., builds
  synthetic trigger bundles, captures `current_position` as the predicted
  distribution). But Run 1 then measures actual CORONA prediction quality.
- **Verdict**: current approach (uniform-prior + Sprint 5 refit) is
  justified because: (a) Sprint 3 hard constraint #2 forbids parameter
  refit, and runtime predictions risk feedback loops if anyone interprets
  Run 1 as "tuning" rather than "measuring"; (b) the harness/scoring
  contract per SDD §6.4 explicitly accepts a `predictedTrajectory`
  parameter, so the runtime can be wired in as a Sprint 5 task without
  re-architecting; (c) operator hard constraint #5 (no shared scoring
  code) is cleaner when the harness doesn't reach into runtime modules.
  Decision is reasonable; should be documented in the Protocol
  Interpretations section as a deliberate Sprint 3 → Sprint 5 handoff.

**Alternative 2**: Preserve a 2-bucket (binary) T1 to literally match the
runtime, instead of inventing 6 buckets.

- **Tradeoff**: T1 binary-Brier reduces to `(p - outcome)²` per event;
  bucket-Brier formula at §4.1 still applies but B=2. Aggregate Brier on
  uniform prior over 2 buckets = 0.25 / 2 = 0.125 (worse than the 6-bucket
  number 0.139, paradoxically) because Brier penalizes proportionally.
  Simpler match to runtime but requires a downstream Sprint 5 re-bucket
  when CORONA's T1 evolves.
- **Verdict**: 6-bucket is defensible for forward-compatibility with a
  Sprint 5 multi-class T1; binary is defensible for Sprint 3 fidelity to
  the existing runtime. Both are interpretations. The decision should be
  documented and the operator should ratify (or revise) it. Not picking
  between them is the gap.

---

## Previous Feedback Status

N/A — this is Round 1 review for Sprint 3.

---

## Verification of operator-specified focus areas

| # | Focus area | Verdict | Notes |
|---|------------|---------|-------|
| 1 | Corpus size acceptance | ✓ Documented gap | reviewer.md §6.1 documents 5/theatre vs 15-25 target. Protocol §3.2 #4 explicitly accepts. **Action: HITL-1 decision log entry.** |
| 2 | DONKI/GFZ live-fetch path | ⚠ Documented gap, intent partially unmet | reviewer.md §6.3 + §6.6 acknowledge. Sprint 3 hard constraint #10 literal text is met (5/5 offline). SDD §6.3 implied live but agent-authored fixtures are agent's interpretation, not real-shape validation. **Action: HITL-2 decision log entry.** |
| 3 | Harness architecture | ✓ Pass | scripts/corona-backtest.js (224 lines) is orchestration only. Five separate scoring modules under scripts/corona-backtest/scoring/. Cross-module imports limited to `THRESHOLDS` from config.js (verified by grep). Operator hard constraint #5 enforced by file boundary. |
| 4 | Protocol fidelity | ⚠ See CI-2 | Frozen Sprint 2 protocol used. T3 null-WSA-Enlil rejected at corpus-loader level (no scoring-layer filtering). Secondary corpus does NOT enter scoring (corpus-loader only walks primary subdirs). T1/T2 bucket schemes are Sprint 3 interpretations of underspecified protocol — **CI-2 fix required**. |
| 5 | T4 proton scoring | ✓ Pass | Strict ≥10 MeV regex `(?:^|\D)10\s*MeV\b/i` mirrors runtime exactly. ≥100 MeV substring counter-test passes. Null/missing proton payloads filtered safely (corpus-loader.js:228-230). 72h prediction window enforced; non-default flagged as `window_override` (corpus-loader.js:272). |
| 6 | Run 1 output | ✓ Pass | T1-T5 reports + summary + corpus_hash + script_hash + per-event/ all present. Hashes deterministic (verified by re-running and comparing). Composite fail expected (no-model floor). |
| 7 | Scope control | ✓ Pass | `git diff package.json` empty. `empirical-evidence.md` is Sprint 1 placeholder (untouched). `calibration-manifest.json` is `[]` (untouched). No Sprint 4/5 work performed. Zero new deps confirmed by package.json read. |

---

## Required pre-audit actions (Round 2 scope)

1. **CI-1 fix**: edit
   [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166-220](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:166)
   per the patch sketched above. Add a regression test to
   `tests/corona_test.js` that constructs a T5 event with one valid +
   one invalid stale-feed entry and asserts the per-event report's
   `latency_seconds` aligns to the original `staleEvents` array
   (specifically: invalid entry → null, valid entry → correct latency,
   no shifting).

2. **CI-2 documentation**: append a "## Protocol Interpretations" section
   to [grimoires/loa/a2a/sprint-3/reviewer.md](grimoires/loa/a2a/sprint-3/reviewer.md)
   covering:
   - T1 6-bucket scheme rationale (and why not binary)
   - T2 G0 addition rationale (and why not strict G1-G5)
   - Tag both with "**INTERPRETATION — Sprint 5 may revise per §4.1's
     TBD clause**" so the regression gate has a clear handoff contract
   - Acknowledge the Sprint 3 hard constraint #7 ("should have surfaced")
     and mark this as the post-hoc surfacing

3. **HITL decisions**: append two Decision Log entries to
   [grimoires/loa/NOTES.md](grimoires/loa/NOTES.md) under a Sprint 3 header,
   recording operator's chosen path for HITL-1 and HITL-2. Reference both
   from reviewer.md.

4. **Re-run tests + validator after fix**:
   ```bash
   node --test tests/corona_test.js              # expect 93/93 pass (or 92+1 new)
   ./scripts/construct-validate.sh construct.yaml  # expect green
   node scripts/corona-backtest.js               # re-run; corpus_hash should NOT change
   ```
   The corpus_hash should be unchanged because no corpus files are touched.
   The script_hash WILL change (t5-quality-of-behavior.js modified) — note
   the new value in NOTES.md so audit can confirm.

---

## Non-Critical Improvements (recommended, not blocking)

- **Corpus loader missing-subdir handling** — distinguish HARD rejection
  errors from INFORMATIONAL warnings. Low priority; not Sprint 3 scope.
- **Empty-corpus T5 verdict** — require `n_signals > 0` for a non-degenerate
  pass verdict. Sprint 5 hardening, not Sprint 3 blocker.
- **DONKI throttle behavior visibility** — log a warning at startup when
  DEMO_KEY is in use ("DEMO_KEY: throttling at 35/hr; provide
  NASA_API_KEY for 900/hr"). Tiny addition to donki-fetch.js. Not blocking.
- **Run 1 baseline interpretation note** — reviewer.md should say "Run 1
  uniform-prior numbers are a no-model floor; do not interpret as a
  measurement of CORONA prediction quality." (challenged Assumption A
  above).

---

## Next Steps for Engineer

1. Implement the patch in **CI-1** + add the regression test.
2. Append the **Protocol Interpretations** section to reviewer.md per
   **CI-2**.
3. Capture operator's **HITL-1** + **HITL-2** decisions in NOTES.md.
4. Re-run `node --test tests/corona_test.js` and `node scripts/corona-backtest.js`.
   Confirm corpus_hash unchanged (or note the new value if anything in the
   corpus directory was touched), confirm new script_hash.
5. Re-invoke `/review-sprint sprint-3`. Round 2 should be a quick check
   that the fix landed and the documentation gaps closed; no full
   re-review needed.

If the operator decides differently on HITL-1 or HITL-2 (e.g., "block on
live-fetch validation"), the engineer adjusts accordingly — but per my
recommendation both HITLs go to acceptance-with-documentation, not block.

---

## Summary

Sprint 3 is 90% there. The functional implementation is correct, complete,
and disciplined. The remaining 10% is documentation/interpretation
hygiene (CI-2 + HITL-1 + HITL-2) and one latent correctness bug (CI-1).
Round 2 fix budget: ~30 minutes of small-surgical work. After fixes,
audit should be straightforward.

---

# Sprint 3 Senior Review — Round 2

**Reviewer**: Senior Tech Lead (adversarial protocol)
**Date**: 2026-05-01
**Sprint**: sprint-3 / `corona-d4u` epic
**Verdict**: **All good** — Round 2 approved

---

## Round 1 → Round 2 verification

I verified each Round 1 blocking item against the actual code, not just the
engineer's report.

### CI-1 — t5 stale-feed indexing bug

**Status**: Resolved.

Verified at [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:165-185](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:165):
the filter-then-zip pattern is gone. New `staleRecords` array is built by
mapping `staleEvents` 1:1 (no filter), each record carries `source_index`,
raw fields, and `latency_seconds: number | null`. The per-event return at
lines 222-242 uses `staleRecords` directly, no re-zip. Aggregate p50/p95
at lines 259-265 filters nulls at the percentile call site (correct —
null entries shouldn't pollute the percentile but should preserve
identity in the per-event report).

Comment at lines 165-172 explicitly explains why filtering before the
join would silently misalign — future maintainers won't reintroduce the
bug.

### CI-1 regression test

**Status**: Landed and would catch the pre-fix bug.

[tests/corona_test.js:1095-1150](tests/corona_test.js:1095) constructs
the exact pre-fix-bug repro: `[VALID 60s, INVALID, VALID 240s]`. The
satellite-field assertion is the strongest part — the test asserts both
the latency AND the satellite at each index, so a misalignment would
also swap the satellite (DSCOVR ↔ ACE) and the assertion would catch it.

I traced the pre-fix code mentally:
- `staleLatenciesSec = [60, 240]` (length 2 after filter)
- `staleEvents.map((s, i) => ...)`: i=0 → 60 (correct), i=1 → 240
  (WRONG — third event's latency), i=2 → undefined → null (WRONG —
  third event loses its real latency)
- Test asserts `perEv.stale_feed_events[1].latency_seconds === null`
  (would fail under pre-fix: 240) and
  `perEv.stale_feed_events[2].latency_seconds === 240` (would fail
  under pre-fix: null).

Test passes 1/1 and the run output explicitly names it ("✔ T5
stale-feed: invalid timestamp in middle does not shift later latencies
(CI-1 regression)").

### CI-2 — Protocol Interpretations documentation

**Status**: Resolved.

[grimoires/loa/a2a/sprint-3/reviewer.md §11](grimoires/loa/a2a/sprint-3/reviewer.md)
covers:
- §11.1 T1 6-bucket scheme: file:line refs to t1-bucket-brier.js:30 +
  corpus-loader.js:80, verbatim §4.1 quote, runtime evidence
  (`construct.yaml:166-170` is binary), interpretation rationale,
  "Why this and not binary" + "Why this and not 5 buckets",
  binding-vs-revisit guidance for Sprint 5, audit posture
  (`INTERPRETATION_DOCUMENTED`, NOT `PROTOCOL_VIOLATION`).
- §11.2 T2 G0 addition: same structure, verbatim §4.2 quote,
  rationale (G0 needed because predicted distributions must sum to 1;
  without G0 the bucket-Brier formula is structurally incompatible
  with non-storm outcomes).
- §11.3 explicitly enumerates what Sprint 3 did NOT change (metric
  formulas, thresholds, T3/T4/T5 scoring) — narrows the interpretive
  delta to two bucket-set declarations.

The audit-posture tag is the right framing — it gives the auditor the
verdict tag to use without forcing them to re-derive the analysis.

### HITL-1 — Corpus 5/theatre acceptance

**Status**: Resolved.

[grimoires/loa/NOTES.md:420-456](grimoires/loa/NOTES.md:420) records the
decision with verbatim §3.2 #4 protocol quote, explicit ACCEPT verdict,
rationale, and implications for downstream sprints (Sprint 5 /
corona-3fg, Sprint 7 / corona-1ml).

### HITL-2 — Live DONKI/GFZ fetch deferral

**Status**: Resolved with a stronger commitment than I asked for.

[grimoires/loa/NOTES.md:458-512](grimoires/loa/NOTES.md:458) goes
beyond the Round 1 ask by:
- Recording the Sprint 7 acceptance criterion verbatim (live
  `--online` run, reconciliation against offline fixtures,
  divergence triggers follow-up bug cycle, reconciliation report
  appended to `corona-8v2`).
- Adding a GFZ-specific note clarifying that gfz-fetch.js remains an
  optional helper not on the Sprint 3 critical path (T2 corpus events
  carry `kp_gfz_observed` directly per §3.7.3).
- Noting that the Sprint 7 commitment is "forward-looking" and does
  NOT modify Sprint 7's existing tasks — the operator gets the
  acceptance criterion captured without retroactively reshaping the
  sprint plan.

This is a cleaner solution than my Round 1 recommendation.

---

## Verification commands re-run

I ran each verification command myself rather than trusting the
engineer's report:

```
$ node --test tests/corona_test.js
ℹ tests 93
ℹ pass 93
ℹ fail 0

$ ./scripts/construct-validate.sh construct.yaml
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)

$ git diff package.json
(empty)

$ node scripts/corona-backtest.js
corona-backtest: run-1 composite_verdict=fail
  T1: Brier=0.1389, n=5, verdict=fail
  T2: Brier=0.1389, n=5, verdict=pass
  T3: MAE=6.76h, ±6h=40.0%, n=5, verdict=fail
  T4: Brier=0.1600, n=5, verdict=fail
  T5: FP=25.0%, p50=90.0s, sw=100.0%, n=5, verdict=fail

$ cat grimoires/loa/calibration/corona/run-1/corpus_hash.txt
b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1

$ cat grimoires/loa/calibration/corona/run-1/script_hash.txt
17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
```

All identical to engineer's claims. No drift.

---

## Round 2 Adversarial Analysis

Per protocol minimums even on approval. These are non-blocking
observations captured for future cycles, not Round 2 blockers.

### Concerns Identified (≥3, all non-blocking)

1. **Duplicate sigma_hours fallback at scoring layer** —
   [scripts/corona-backtest/scoring/t3-timing-error.js:83-84](scripts/corona-backtest/scoring/t3-timing-error.js:83):
   `event._derived?.sigma_hours_effective ?? 14`. The `?? 14` is a
   second-line fallback after the corpus-loader's own placeholder
   (`T3_NULL_SIGMA_PLACEHOLDER_HOURS = 14` at corpus-loader.js:174).
   Two places encode the 14h value. Single source of truth would be
   cleaner; in practice the scoring fallback is unreachable because
   the loader always populates `sigma_hours_effective`. Defensible
   but worth noting for future cleanup.

2. **§11 documentation references file:line ranges that may rot** —
   §11 cites e.g. "scripts/corona-backtest/scoring/t1-bucket-brier.js:30".
   If future cycles add imports above the bucket constant, the line
   number drifts. Common documentation problem; not unique to this PR.
   Consider symbol-based references (`T1_BUCKETS` constant) in future
   documentation.

3. **CI-1 regression test asserts exact percentile values** —
   [tests/corona_test.js:1147-1148](tests/corona_test.js:1147)
   asserts `r.stale_feed_p50_seconds === 150` and
   `r.stale_feed_p95_seconds === 231`. This depends on the
   linear-interpolation method. If the percentile implementation
   ever switches to nearest-rank or exclusive-rank, this test would
   fail without explaining the relationship to the indexing bug.
   Defensible as-is; minor maintainability concern.

4. **Sprint 7 acceptance criterion lives in NOTES.md, not sprint.md** —
   `grimoires/loa/sprint.md` Sprint 7 section does NOT yet mention the
   live `--online` validation requirement. The operator chose to
   record it in NOTES.md rather than amend the sprint plan, which is
   the right call for Sprint 3 scope (don't modify other sprints
   during a Sprint 3 review). But Sprint 7 implementation needs to
   remember to read NOTES.md, which is fragile. Mitigation: the
   structured memory protocol requires reading NOTES.md at session
   start; the commitment is in the Decision Log and should surface
   naturally.

### Assumptions Challenged (≥1)

- **Assumption**: "The percentile interpolation method is stable
  long-term."
- **Risk if wrong**: CI-1 regression test breaks for non-CI-1-related
  reasons; developer wastes time investigating "did the indexing bug
  return?".
- **Recommendation**: future cycle adds a comment to the test naming
  the percentile method assumption, OR splits the regression test
  into "indexing preservation" (what CI-1 was about) + "percentile
  values" (separable).

### Alternatives Not Considered (≥1)

- **Alternative**: Promote the §11 Protocol Interpretations content
  to `calibration-protocol.md` itself as a "§4.1.1 Sprint 3 bucket
  interpretation" subsection rather than living in reviewer.md.
- **Tradeoff**: The protocol is frozen and §10 freeze acknowledgment
  blocks edits. Adding interpretations to the protocol would amount
  to a Sprint 2 amendment with operator HITL approval. Reviewer.md
  living-document approach avoids that overhead but means the
  interpretation isn't in the protocol's own freeze trail.
- **Verdict**: current approach (reviewer.md §11) is justified because
  Sprint 3's authority is the harness, not the protocol; protocol
  edits are operator-gated. The `INTERPRETATION_DOCUMENTED` audit-
  posture tag gives auditors a clear pointer back to this decision.
  Sprint 5 may consider amending the protocol if the interpretation
  becomes load-bearing.

---

## Verdict

**All good.**

All Round 1 blocking items resolved:
- CI-1 fix is correct AND has a regression test that catches the
  pre-fix bug.
- CI-2 documentation closes the protocol-fidelity gap with binding-vs-
  revisit guidance and a clear audit posture.
- HITL-1 + HITL-2 are recorded as explicit operator decisions with
  rationale and downstream-sprint implications.

92/92 → 93/93 tests pass, validator green, hashes stable, zero-dep
posture intact, no Sprint 4/5 leakage, all six Sprint 3 ACs met
(`sprint.md:285-291` checkmarks updated).

Sprint 3 is approved for `/audit-sprint sprint-3`. The audit decision is
the operator's; this review does not auto-trigger it.
