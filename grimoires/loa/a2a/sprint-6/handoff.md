# Sprint 6 Handoff Packet — CORONA cycle-001-corona-v3-calibration

**Status**: READY FOR FRESH-SESSION KICKOFF
**Authored**: 2026-05-01 (Sprint 5 close, post-commit)
**Sprint type**: REVIEW + NARROW HARDENING — lightweight input-validation review of SWPC parser + DONKI parser + corpus loader
**Scope size**: Sprint 6 SMALL (3 tasks)
**Operator HITL constraint**: HITL remains ON. Sprint 6 only — do NOT start Sprint 7.

---

## 1. Current repo / branch / commit state

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD commit | `fc763d7` — `feat(corona): add sprint 5 calibration manifest and regression gate` |
| Upstream | `origin/main` — up to date |
| Working tree | Clean |
| Recent cycle-001 commits | `b424da7` Sprint 0 → `2c75ecb` Sprint 1 → `33e9133` Sprint 2 → `cd7648f` Sprint 3 → `b8a4ed8` Sprint 4 → `fc763d7` Sprint 5 |

### Quality gates at handoff

```bash
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js           # tests 144 / pass 144 / fail 0
git status                                              # clean
git log --oneline -7                                    # fc763d7 at HEAD
node scripts/corona-backtest.js                         # Run reproducible
```

### Sprint 0–5 close states (preserved)

- **Sprint 0** (`b424da7`): v3 readiness, theatre authority map, T4 S-scale scaffold, identity/CORONA.md, compose_with[tremor], commands, pack_dependencies, local validator. Reviewed + audited + pushed.
- **Sprint 1** (`2c75ecb`): composition_paths declared, calibration directory scaffolded with placeholders. Reviewed + audited + pushed.
- **Sprint 2** (`33e9133`): frozen calibration protocol + T4 flare-class proxy retirement. Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited + pushed.
- **Sprint 3** (`cd7648f`): backtest harness + 25-event primary corpus + Run 1 baseline certificates. Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited + pushed.
- **Sprint 4** (`b8a4ed8`): empirical-evidence.md authored (1139 lines, 14 primary citations, 6 PRD §5.5 coverage targets, 20 manifest entry sketches, §1.1 Citation Verification Status taxonomy). Reviewed (R1 CHANGES_REQUIRED → R2 APPROVED) + audited (R1 CHANGES_REQUIRED → R3 APPROVED) + pushed.
- **Sprint 5** (`fc763d7`): calibration-manifest.json populated (30 entries: corona-evidence-001..029) + structural test (22 tests) + regression gate (29 tests) + Run 2 certificates + per-theatre delta report. Sprint 5 made NO runtime parameter refits per evidence-driven analysis. Run 2 numerics IDENTICAL to Run 1 (uniform-prior baseline architectural reality). Reviewed ("All good (with noted concerns)") + audited (APPROVED, 0 CRITICAL / 0 HIGH / 0 MEDIUM / 1 LOW informational) + pushed.

### Sprint 5 deliverables locked at HEAD

- `grimoires/loa/calibration/corona/calibration-manifest.json` — 30 entries (corona-evidence-001..029) per PRD §7 + Sprint 4 §1.1 verification taxonomy + SDD §7.3 inline_lookup. **Source of truth for parameter provenance.** Sprint 6 must NOT modify this except for narrow corrections directly required by Sprint 6 work.
- `tests/manifest_structural_test.js` — 22 tests asserting PRD §7 field validity + PRD §8.5 promotion_path rule + Sprint 4 §1.1 invariants.
- `tests/manifest_regression_test.js` — 29 tests enforcing inline-equals-manifest per SDD §7.3 (24 per-entry + 5 aggregate).
- `grimoires/loa/calibration/corona/run-2/` — Run 2 certificates (T1-T5 + summary + per-event/ + corpus_hash + script_hash + delta-report.md). corpus_hash invariant `b1caef3...` matches Run 1; script_hash invariant `17f6380b...` matches Run 1; composite verdict `fail` (T1 fail / T2 pass / T3 fail / T4 fail / T5 fail) — IDENTICAL to Run 1 by design (uniform-prior baseline).
- `grimoires/loa/a2a/sprint-5/` — full review trail: handoff.md, reviewer.md, engineer-feedback.md, auditor-sprint-feedback.md, COMPLETED.

---

## 2. Sprint 6 objective

Sprint 6 is the **lightweight input-validation review** of the three input parsers per PRD §5.7 + SDD §8. Walk SWPC parser, DONKI parser, and the backtest corpus loader through the SDD §8.2 review checklist, classify findings by SDD §8.4 severity ladder, and output `grimoires/loa/calibration/corona/security-review.md` per the SDD §8.3 template. Fix only **CRITICAL** severity findings inline; document non-critical findings as deferred or accepted.

Per PRD §5.7 + SDD §8.1: Sprint 6 is **NOT** a deep crypto/auth audit. Surface area is read-only HTTP, zero auth, zero runtime dependencies. The review is bounded to input-validation + robustness against malformed/missing/oversized inputs.

Sprint 6 closes the security gate before Sprint 7 (final-validate + BFZ refresh + v0.2.0 tag). The acceptance bar is: **zero CRITICAL findings outstanding**. High/medium/low findings do not block Sprint 7 per SDD §8.4.

**Sprint 6 epic**: `corona-16a` (currently OPEN).

---

## 3. Sprint 6 owner tasks (3 tasks; SMALL scope)

| Beads ID | Task | Owner deliverable |
|----------|------|--------------------|
| `corona-r4y` | sprint-6-walk-input-checklist | Walk SWPC parser + DONKI parser + corpus-loader through SDD §8.2 checklist; produce per-parser finding tables |
| `corona-8m8` | sprint-6-author-security-review-md | Author `grimoires/loa/calibration/corona/security-review.md` per SDD §8.3 template with severity-classified findings |
| `corona-a6z` | sprint-6-fix-critical-findings | Fix only CRITICAL severity findings (input-injection, infinite-loop, data-loss vectors); defer/document non-critical |
| `corona-16a` | Sprint 6 epic | Tracker for the above 3 tasks |

### Recommended task ordering

1. **`corona-r4y`** — walk three parsers through SDD §8.2 13-row checklist. Each cell is either a Y (check applies) or N/A. Each finding gets a draft severity classification per SDD §8.4 (critical / high / medium / low).

2. **`corona-8m8`** — author `security-review.md` per SDD §8.3 template. The template has three per-parser tables (S-NNN for SWPC, D-NNN for DONKI, C-NNN for corpus loader). Each row: severity, finding, recommendation, status (open / fixed in Sprint 6 / deferred). Plus a **Critical findings (block Sprint 7?)** section + **Closed in Sprint 6** section.

3. **`corona-a6z`** — fix only CRITICAL severity findings inline in source. Each fix is a narrow patch to the affected parser. Tests for each fix added to `tests/corona_test.js` (or a new dedicated test file under `tests/security/` if structurally cleaner). Update `security-review.md` Status column to "fixed in Sprint 6".

### Sprint 6 acceptance criteria (from sprint.md GC + Sprint 6 deliverables)

- **GC.6** (sprint.md L433): `security-review.md` authored per SDD §8.3 template.
- **GC.7** (sprint.md L434): All findings classified by severity per SDD §8.4.
- **GC.8** (sprint.md L435): CRITICAL findings fixed inline (block Sprint 7 if not).
- **GC.9** (sprint.md L436): Non-critical findings documented + deferred or fixed at discretion.
- All 144 baseline tests + any new Sprint 6 tests pass.
- Zero new runtime deps (`package.json:32 "dependencies": {}` invariant).

### Sprint 6 dependencies

- **Sprint 5 final state at HEAD `fc763d7`** — codebase post-Sprint-5 is the review target. Sprint 5 made no source changes; the parsers Sprint 6 reviews are the same parsers committed at Sprint 0 / Sprint 3.
- **SDD §8** — review scope, checklist, output template, severity ladder. Sprint 6 implements §8 verbatim.
- **PRD §5.7 + §9.2** — review scope is bounded ("NOT a deep crypto/auth audit").
- **Carry-forward findings**:
  - **PEX-1** (Sprint 2 audit) — `payload.event_type` direct property access at `src/theatres/proton-cascade.js:266, 284`. Sprint 6 / `corona-r4y` is the natural owner. **Decide: defensive fix in Sprint 6 OR documented as accepted residual risk.**
  - **LOW-1** (Sprint 3 audit) — `Math.max(0, …)` silent clamp of negative latencies at `scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183`. **Decide: corpus validation error / accepted residual / fixed in Sprint 6.**

---

## 4. Required reading order for the fresh agent

The fresh-session agent has zero context. Read in this order; STOP when context budget runs low and synthesize to `grimoires/loa/NOTES.md` per the Tool Result Clearing Protocol.

| # | File | Lines | Why |
|---|------|-------|-----|
| 1 | **This file** — `grimoires/loa/a2a/sprint-6/handoff.md` | ~250 | Primer; covers everything below in summary form |
| 2 | `grimoires/loa/sprint.md` Sprint 6 section | ~45 | Sprint 6 acceptance criteria GC.6-GC.9 + task list. |
| 3 | `grimoires/loa/prd.md` §5.7 + §9.2 | ~30 | Sprint 6 scope bound — "lightweight review", "NOT a deep crypto/auth audit". |
| 4 | `grimoires/loa/sdd.md` §8 | ~70 | Review checklist (§8.2 13-row), output template (§8.3), severity ladder (§8.4). Sprint 6 implements §8 verbatim. |
| 5 | `grimoires/loa/calibration/corona/calibration-protocol.md` | 523 | Frozen Sprint 2 protocol. Sprint 6 must not change this; references it for corpus-loader §3.7 schema validation context. |
| 6 | `grimoires/loa/calibration/corona/theatre-authority.md` | (varies) | Sprint 0 settlement-authority map. Read-only for Sprint 6; informs which parsers feed which settlement paths. |
| 7 | `grimoires/loa/calibration/corona/security-review.md` IF IT ALREADY EXISTS | (varies) | The Sprint 6 deliverable target. Should NOT exist at Sprint 6 kickoff (would indicate Sprint 6 partially started). If it exists, surface to operator before continuing. |
| 8 | `grimoires/loa/a2a/sprint-5/engineer-feedback.md` | ~250 | Sprint 5 review trail; identifies the LOW-1 documented limitation in evidence-020 (Sprint 6 awareness — not a Sprint 6 task). |
| 9 | `grimoires/loa/a2a/sprint-5/auditor-sprint-feedback.md` | ~300 | Sprint 5 audit; explicitly identifies PEX-1 as Sprint 6 territory and LOW-1 as a Sprint 6+ awareness item. |
| 10 | `src/oracles/swpc.js` | ~451 | The SWPC parser. Sprint 6 walks this through §8.2 checklist. |
| 11 | `src/oracles/donki.js` | ~381 | The DONKI parser. Sprint 6 walks this through §8.2 checklist. |
| 12 | `scripts/corona-backtest/ingestors/corpus-loader.js` | ~423 | The backtest corpus loader. Sprint 6 walks this through §8.2 checklist. |
| 13 | `scripts/corona-backtest/ingestors/donki-fetch.js` | ~150 | DONKI fetcher with era-aware shape detection (per PRD §10 R3). Sprint 6 may surface schema-drift findings here. |
| 14 | `scripts/corona-backtest/ingestors/swpc-fetch.js` | ~83 | SWPC fetcher. Smaller surface than DONKI; mostly URL construction + JSON parsing. |
| 15 | `src/theatres/proton-cascade.js` | ~437 | T4 theatre. PEX-1 site at lines 266 + 284. Read-only review; Sprint 6 may patch defensively if PEX-1 is decided as fix-now. |
| 16 | `tests/corona_test.js` | (varies) | 93 baseline tests; Sprint 6 may add new tests for any Sprint 6 hardening patches. |
| 17 | `tests/manifest_structural_test.js` | ~385 | 22 Sprint 5 manifest structural tests. Read-only; informs Sprint 6 testing patterns. |
| 18 | `tests/manifest_regression_test.js` | ~226 | 29 Sprint 5 regression tests. Read-only; informs Sprint 6 testing patterns. |

### Read-only reference patterns (do NOT mutate)

- **TREMOR**: `C:\Users\0x007\tremor` (read-only). May contain its own input-validation patterns; Sprint 6 does NOT need this read but may inspect for testing-style guidance.
- **BREATH**: `C:\Users\0x007\breath` (read-only). Pattern source from Sprint 4 (literature research). Sprint 6 does not need this.

---

## 5. Sprint 6 hard constraints

These are operator-locked and binding throughout Sprint 6 execution.

1. **Sprint 6 only.** Do NOT start Sprint 7 work. Sprint 7 / `corona-1ml` (final-validate) + `corona-1p5` (Run-N final) + `corona-8v2` (BFZ refresh) + `corona-32r` (final validator) + `corona-2k3` (E2E goal validation) + `corona-w1v` (version bump) is the natural successor.

2. **HITL remains ON.** Operator approval gates: post-walk (before security-review.md authoring), post-authoring (before any CRITICAL fixes), post-fixes (before commit). Surface for HITL at natural break points; do not auto-chain.

3. **Do NOT refit parameters.** Sprint 5 closed the parameter-refit window. If a Sprint 6 finding requires a parameter change (e.g., bounds on flux numeric), surface to operator — that is a Sprint 5 amendment, not a Sprint 6 task.

4. **Do NOT change `calibration-manifest.json`** unless a direct Sprint 6 blocker requires a narrow note/correction. The manifest is the Sprint 5 source of truth for parameter provenance; mutations require operator HITL approval. Acceptable Sprint 6 mutations are limited to: a citation/path correction if Sprint 6 discovers a literal error, OR a new manifest entry for a Sprint 6 hardening patch that introduces a new constant.

5. **Do NOT change calibration protocol, authority map, Run 1, Run 2, or empirical evidence** unless a direct blocker is found. Sprint 2/3/4/5 deliverables are frozen at HEAD `fc763d7`. If a Sprint 6 finding requires modifying any of these, surface to operator.

6. **Do NOT add dependencies.** `package.json:32 "dependencies": {}` is invariant. Sprint 6 may use ONLY: `node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch` (Node 20+), `node:test`, `node:assert/strict`. No `devDependencies` either.

7. **Preserve zero-runtime-dependency posture.** No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`.

8. **Do NOT redesign the backtest harness.** `scripts/corona-backtest.js` + `scripts/corona-backtest/` are Sprint 3 frozen architecture. Sprint 6 may patch input-validation in `corpus-loader.js`, `donki-fetch.js`, `swpc-fetch.js` if findings warrant, but NOT redesign module boundaries, scoring modules, or the entrypoint dispatch.

9. **Do NOT change scoring semantics.** `scripts/corona-backtest/scoring/t<id>-*.js` modules are operator hard constraint #5 (no shared scoring code; per-theatre independence). Sprint 6 must not touch scoring logic. If LOW-1 is decided as fix-now, a corpus-validation patch in `corpus-loader.js` is acceptable; a scoring-module patch is NOT.

10. **Do NOT change corpus eligibility.** `calibration-protocol.md` §3.2 primary-corpus rules are Sprint 2 frozen. Sprint 6 may TIGHTEN corpus-loader validation (e.g., reject events with malformed timestamps that previously slipped through) but must not LOOSEN eligibility (e.g., accept events without `donki_record_ref`).

11. **Do NOT perform deep crypto/auth audit.** Sprint 6 is bounded by PRD §5.7 + §9.2 + SDD §8.1: surface is read-only HTTP, zero auth, zero deps. Sprint 6 reviews input-validation + robustness only. Cryptographic primitives, authentication flows, secret-management hygiene are explicitly OUT OF SCOPE.

12. **If a finding would require architectural change, document it in `security-review.md` and stop for operator decision.** Examples that should halt: a finding that the corpus-loader's §3.7 schema validation is fundamentally insufficient (Sprint 2 amendment territory); a finding that the harness ingestion pipeline allows path-traversal via env-var injection (Sprint 3 architectural amendment); a finding that the DONKI rate-limit handling is unsound (Sprint 3 R4 amendment). Halt → surface to operator → wait for amendment OR explicit operator instruction.

---

## 6. Primary Sprint 6 focus areas

Per the operator brief + SDD §8.2 checklist:

### 6.1 SWPC JSON parsing (`src/oracles/swpc.js`)

- **Malformed/null flux handling**: what happens when `payload.flare.max_xray_flux` is `null` / `undefined` / `NaN` / `Infinity` / a string?
- **Missing fields**: what happens when `begin_time` / `max_class` / `class_type` is absent?
- **Date parsing**: ISO-8601 vs epoch-ms; leap second handling; `Z` vs `+00:00` suffixes; missing timezone.
- **GOES primary/secondary satellite-switch robustness**: when the active SWPC product switches GOES primary→secondary, does the parser handle the `goes_satellite` field change correctly? Does the runtime distinguish primary from secondary in `quality.js` SOURCE_RELIABILITY?
- **Eclipse-season or data-gap behavior**: what happens during GOES eclipse seasons (multi-hour data gaps)? Does the parser surface the gap or silently smooth?
- **Numeric bounds / overflow / NaN handling**: `proton.flux` can range from ~0.001 pfu (background) to >100,000 pfu (S5). Is `Number.MAX_SAFE_INTEGER` respected? Are negative fluxes rejected? Are `NaN` / `Infinity` rejected?

### 6.2 DONKI JSON parsing (`src/oracles/donki.js`)

- **Malformed/missing CME, FLR, GST, IPS fields**: each DONKI record type has different field shapes. What happens when `cme.start_time` is missing? When `flare.class_type` is missing? When `gst.allKpIndex` is empty?
- **Null WSA-Enlil forecast fields**: `cme.cmeAnalyses[*].enlilList` may have null `estimatedShockArrivalTime`. Sprint 3 corpus-loader rejects T3 events with null WSA-Enlil; does the runtime parser also handle null gracefully?
- **Date parsing**: DONKI uses both ISO-8601 (`2024-05-09T17:00Z`) and millisecond-epoch in different fields. Type coercion edge cases.
- **Rate-limit / 429 handling**: DONKI's DEMO_KEY is 40 req/hr; authenticated NASA_API_KEY is 1000/hr (per SDD §6.6). Does the runtime handle 429 responses? Does it back-off + retry, or fail-open + drop?
- **Schema drift handling**: PRD §10 R3 documents that DONKI archive returns inconsistent shapes across 2017-2026. The era-aware ingestor (`donki-fetch.js`) handles this for the backtest harness; does the runtime parser (`donki.js`) handle the same era variance?
- **Raw-vs-normalized shape assumptions**: `donki-fetch.js` exposes both `raw` and `normalised` outputs. Does the runtime consume one consistently? What happens when consumers read fields that exist in `raw` but not `normalised`?

### 6.3 Backtest corpus loader (`scripts/corona-backtest/ingestors/corpus-loader.js`)

- **Path traversal**: `loadCorpus(corpusDir, options)` accepts `corpusDir` from `CORONA_CORPUS_DIR` env or `--corpus` CLI arg. Does `resolve(...)` prevent escape via `..` segments? Sprint 3 audit Focus Area 2 verified path-construction via `node:path.resolve` is safe; Sprint 6 should re-verify against any new attack vectors (e.g., symlinks, Windows-style backslashes).
- **Malformed JSON**: each corpus event is `JSON.parse(readFileSync(...))`. Does `JSON.parse` throw on truncated/corrupted input? Is the throw caught + surfaced as a corpus-load error?
- **Missing required corpus fields**: §3.7 schema validation. Each per-theatre validator has required fields; Sprint 6 should verify that EVERY required field is checked AND that missing fields produce a clear error message.
- **Invalid timestamps**: `event_time`, `kp_window_start`, `kp_window_end`, `flare_peak_time`, `flare_end_time`, `wsa_enlil_predicted_arrival_time`, `observed_l1_shock_time`, etc. are ISO-8601 strings. Does the loader validate them before passing to the scoring layer? Currently the loader does NOT call `new Date(...)` on most timestamp fields — they pass through as strings to be parsed at scoring time.
- **Invalid event IDs**: `event_id` is a free-form string. Are there any path-injection or ID-collision risks? Each `event_id` is used in `run-N/per-event/T<id>-<event_id>.json` filenames — Sprint 6 should verify that `event_id` cannot contain `/`, `\`, `..`, or null bytes.
- **Invalid authority/source annotations**: `goes_satellite`, `goes_secondary_satellite`, `donki_record_ref`, `observed_l1_source` are author-controlled strings. Are they validated against an allowlist? Currently they are NOT validated except for the per-theatre eligibility rules.
- **Oversized file / memory-bomb behavior**: `readFileSync` reads the entire corpus event into memory. Is there a size limit? A 25-event primary corpus has small files (~5-50 KB each), but a malicious actor with write access to `corpus/` could plant a multi-GB file. Sprint 6 should consider: should the loader enforce a per-file size cap?

### 6.4 T4 proton-cascade carry-forward (PEX-1)

- **PEX-1 site**: `src/theatres/proton-cascade.js:266`, `:284`.
  ```js
  // Line 266:
  if (payload.event_type === 'solar_flare' || payload.event_type === 'donki_flare') { ... }

  // Line 284:
  if (payload.event_type !== 'proton_flux') { ... }
  ```
  Both lines access `payload.event_type` directly. If `bundle.payload` is `undefined` (e.g., a malformed bundle from `bundles.js`), the access throws `TypeError: Cannot read properties of undefined (reading 'event_type')`.

- **Sprint 6 decision**: 
  - **(A) Defensive fix**: change to `payload?.event_type === 'solar_flare'` etc. Adds optional chaining. Patch is narrow (2 lines + 2 lines). Add 1-2 tests verifying graceful handling of `undefined` payload.
  - **(B) Document as accepted residual**: argue that `bundle.payload` is guaranteed non-null at the call site (verified by `bundles.js`). Document the invariant in `security-review.md` + add a defensive comment at the call site. Risk: if `bundles.js` invariant ever changes, the failure surfaces at runtime.
  - **(C) Defer to Sprint 7**: argue that `bundles.js` should enforce the payload-non-null invariant via an explicit guard, and Sprint 6 is not the right surface. Document in `security-review.md`.

  **Recommended posture**: (A) defensive fix. The patch is narrow, the test is small, and the invariant is honored regardless of upstream changes. PEX-1 has been carry-forward since Sprint 2; Sprint 6 is the natural close.

### 6.5 Sprint 3 audit LOW-1 carry-forward

- **LOW-1 site**: `scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183` — `Math.max(0, latencySeconds)` silently clamps negative latencies to 0. A negative latency would indicate a corpus-authoring error (detection_time before actual_onset_time).

- **Sprint 6 decision**: 
  - **(A) Corpus validation error**: move the negative-latency check to `corpus-loader.js` so it surfaces at corpus-load time as an explicit error instead of silently clamping at scoring. This is a tightening of corpus-loader validation, NOT a scoring-semantics change.
  - **(B) Document as accepted residual**: the clamp is defense-against-impossible-input. If a corpus author produces `detection_time < actual_onset_time`, the clamp produces a defensible value (0) without crashing. Document the invariant at the clamp site + in `security-review.md`.
  - **(C) Fixed in Sprint 6**: replace clamp with an explicit error surface. Risk: changes scoring semantics (which the operator brief forbids). **Likely violates hard constraint #9.**

  **Recommended posture**: (A) corpus validation error in corpus-loader.js. Tightens validation at the data-entry boundary without touching scoring. Adds a corpus-loader test verifying negative-latency events are rejected.

  Alternatively (B) accepted residual is also defensible if the operator prefers minimum-change posture for Sprint 6.

---

## 7. Files Sprint 6 is expected to MODIFY

Sprint 6 is permitted to modify (and is expected to modify) the following files:

```
grimoires/loa/calibration/corona/security-review.md   # corona-8m8 — author per SDD §8.3 template
grimoires/loa/sprint.md                               # Sprint 6 deliverable/AC/task checkmarks at sprint close
grimoires/loa/a2a/sprint-6/                           # reviewer.md (implementation report), engineer-feedback.md (post review), auditor-sprint-feedback.md (post audit), COMPLETED (post audit-approved)
```

**Conditional / discretionary** (only if Sprint 6 review surfaces critical findings warranting a fix):

```
src/oracles/swpc.js                          # corona-a6z — narrow input-validation hardening if CRITICAL
src/oracles/donki.js                         # corona-a6z — narrow input-validation hardening if CRITICAL
scripts/corona-backtest/ingestors/corpus-loader.js   # corona-a6z — narrow validation tightening if CRITICAL (e.g., LOW-1 → corpus error path)
src/theatres/proton-cascade.js               # corona-a6z — PEX-1 defensive fix if (A) chosen
tests/corona_test.js                         # corona-a6z — tests for any hardening patches; or new tests/security/<name>-test.js if cleaner
```

**Non-critical findings** are documented in `security-review.md` with `Status: deferred` and may optionally be patched at engineer discretion (and operator HITL) but should NOT be patched if it expands Sprint 6 scope significantly.

---

## 8. Files Sprint 6 should NOT MODIFY (unless a direct blocker is found)

| File | Why preserve | Blocker exception |
|------|--------------|-------------------|
| `grimoires/loa/calibration/corona/calibration-manifest.json` | Sprint 5 frozen source of truth for parameter provenance | Only if Sprint 6 discovers a literal error in source_file/source_line citation OR a Sprint 6 hardening patch introduces a new constant requiring a manifest entry. Operator HITL required. |
| `grimoires/loa/calibration/corona/calibration-protocol.md` | Frozen Sprint 2 protocol | Only if Sprint 6 finds an actual semantic ambiguity. Operator HITL required. |
| `grimoires/loa/calibration/corona/theatre-authority.md` | Sprint 0 settlement authority of record | Do not modify — settlement authority is locked. |
| `grimoires/loa/calibration/corona/empirical-evidence.md` | Sprint 4 deliverable | ONLY narrow citation/path corrections if Sprint 6 discovers a literal error. NO new citations, NO confidence-rating changes. |
| `grimoires/loa/calibration/corona/corpus/primary/` | Sprint 3 frozen corpus (corpus_hash invariant) | DO NOT modify. Corpus extension is operator-HITL-gated per `calibration-protocol.md` §3.5. |
| `grimoires/loa/calibration/corona/run-1/` | Sprint 3 baseline certificates | Read-only. |
| `grimoires/loa/calibration/corona/run-2/` | Sprint 5 post-refit certificates | Read-only. |
| `scripts/corona-backtest.js` | Sprint 3 entrypoint | Do not modify unless a Sprint 6 finding directly requires harness entrypoint hardening (rare). |
| `scripts/corona-backtest/scoring/*.js` | Sprint 3 scoring modules | **DO NOT change scoring semantics.** Hard constraint #9. |
| `scripts/corona-backtest/reporting/*.js` | Sprint 3 reporters | Do not modify hash-utils.js (would invalidate corpus_hash + script_hash semantics). |
| `scripts/corona-backtest/config.js` | Sprint 3 paths + thresholds | Do not modify. |
| `tests/manifest_structural_test.js` + `tests/manifest_regression_test.js` | Sprint 5 manifest tests | Do not modify unless a Sprint 6 manifest-correction patch invalidates a test assertion (would require coordinated update). |
| `construct.yaml` | v3 manifest, Sprint 0 deliverable | Do not modify. Sprint 7 publish-readiness territory. |
| `package.json` | Zero-dep invariant per PRD §8.1 | NEVER modify. Do not add deps. Do not add devDependencies. |
| `.claude/` | System Zone | Never edit. |

---

## 9. Expected Sprint 6 outputs

Per the operator's brief + SDD §8 + sprint.md GC.6-GC.9:

1. **`grimoires/loa/calibration/corona/security-review.md`** — Sprint 6 / `corona-8m8` deliverable per SDD §8.3 template. Three per-parser finding tables (S-NNN for SWPC, D-NNN for DONKI, C-NNN for corpus loader). Each row: severity (critical/high/medium/low per SDD §8.4), finding, recommendation, status (open / fixed in Sprint 6 / deferred / accepted residual).

2. **Narrow parser/corpus-loader hardening patches** — Sprint 6 / `corona-a6z`. Only if review surfaces directly fixable CRITICAL findings. Each patch is narrow + testable + does not change scoring semantics or corpus eligibility.

3. **Tests for any hardening patches** — added to `tests/corona_test.js` OR a new `tests/security/<name>-test.js` file if structurally cleaner. Tests verify: malformed input handling, defensive fix correctness, no regression in baseline behavior.

4. **Sprint 6 implementation report** at `grimoires/loa/a2a/sprint-6/reviewer.md` — implementation-report template per SDD pattern. AC Verification section walking GC.6-GC.9 verbatim with file:line evidence + per-finding cross-reference to security-review.md.

5. **Updated `grimoires/loa/sprint.md`** — Sprint 6 deliverable/AC/task checkmarks at sprint close.

### File-level expectations

```
grimoires/loa/calibration/corona/security-review.md   # corona-8m8
src/oracles/swpc.js                                   # corona-a6z (only if CRITICAL findings)
src/oracles/donki.js                                  # corona-a6z (only if CRITICAL findings)
scripts/corona-backtest/ingestors/corpus-loader.js    # corona-a6z (only if CRITICAL findings, e.g., LOW-1 → corpus error path)
src/theatres/proton-cascade.js                        # corona-a6z (PEX-1 defensive fix if (A) chosen)
tests/corona_test.js OR tests/security/*.js           # corona-a6z (tests for hardening patches)
grimoires/loa/sprint.md                               # Sprint 6 checkmarks
grimoires/loa/a2a/sprint-6/{reviewer,engineer-feedback,auditor-sprint-feedback}.md + COMPLETED
```

---

## 10. Sprint 6 review focus areas

When Sprint 6 implementation completes and `/review-sprint sprint-6` runs, the senior reviewer should focus attention on:

1. **Are all Sprint 6 findings classified correctly per SDD §8.4 severity ladder?** Check each finding's severity against the ladder: critical=input-injection/infinite-loop/data-loss; high=crash on plausible malformed input; medium=resource leak/non-graceful degradation; low=minor robustness improvement. Mis-classification (e.g., a critical finding tagged as medium to avoid blocking Sprint 7) is the failure mode.

2. **Were only direct, narrow input-validation fixes made?** Each `corona-a6z` patch should be a small (<20 LoC) localized change to a parser. Patches that touch multiple modules, change scoring logic, or alter corpus eligibility are scope creep.

3. **Did any fix accidentally change scoring, settlement, corpus eligibility, or calibration semantics?** Run the regression gate (`tests/manifest_regression_test.js`) post-patches. Any drift from the manifest's inline_lookup match_patterns indicates accidental scope expansion.

4. **Were PEX-1 and LOW-1 either fixed or consciously accepted with rationale?** Both carry-forward findings should be explicitly addressed in `security-review.md` — fixed (with patch + test) OR documented as accepted residual (with explicit rationale referencing the SDD §8.4 ladder + the upstream invariant). Silent dropping of either is a failure.

5. **Are new tests meaningful and not cosmetic?** Each Sprint 6 hardening patch should have a test that ACTUALLY exercises the new behavior. A test that just imports the patched module and asserts no error is cosmetic.

6. **Does `security-review.md` clearly distinguish fixed findings, deferred findings, and accepted residual risks?** Per SDD §8.3 template, each finding has a Status column. Sprint 6 review should confirm every finding has one of: `fixed in Sprint 6` (patch reference), `deferred` (with target sprint or "future cycle"), `accepted residual` (with explicit rationale).

---

## 11. Sprint 6 audit focus areas

When `/audit-sprint sprint-6` runs, the auditor should focus attention on:

1. **No secrets/API keys committed.** Standard scan over `security-review.md`, sprint-6 a2a artifacts, any new test files, any patch sites. The patches MUST NOT introduce hardcoded credentials (e.g., a default NASA_API_KEY value).

2. **No dependency/package mutation.** `git diff package.json` MUST be empty. No `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`. Sprint 6 patches MUST use only Node.js built-ins.

3. **No unsafe filesystem handling introduced.** Sprint 6 patches to `corpus-loader.js` MUST preserve the existing path-resolution safety (relative paths anchored to repo root via `resolve(REPO_ROOT, ...)`). New file-system access patterns MUST go through the same safety pattern.

4. **No ReDoS-prone regex introduced.** Sprint 6 patches that add input-validation regex MUST NOT use catastrophic-backtracking patterns (e.g., `(a+)+b` against a long `a` string). Auditor should compile each new regex + test against adversarial inputs.

5. **No network behavior widened unexpectedly.** Sprint 6 patches MUST NOT add new fetch endpoints, new HTTP methods (POST/PUT/DELETE), new authentication schemes, or new external callouts. The construct's read-only HTTP posture (per PRD §9.2) MUST be preserved.

6. **No hidden scoring/settlement changes.** `git diff scripts/corona-backtest/scoring/*.js` MUST be empty. `git diff src/theatres/*.js` should only include narrow defensive patches (e.g., PEX-1 optional chaining); no scoring/settlement logic changes.

7. **No Sprint 7 publish-readiness work smuggled in.** Sprint 6 MUST NOT touch `construct.yaml` (Sprint 7 publish-ready target), `BUTTERFREEZONE.md` (Sprint 7 BFZ refresh target), `package.json` version bump (Sprint 7 / `corona-w1v` target), or `spec/construct.json` / `spec/corona_construct.yaml` legacy spec files. PR scope creep risk.

---

## 12. Important carry-forward warnings

These are documented for Sprint 6's awareness; some are blocking for Sprint 6, others are downstream-sprint-owned.

| ID | Source | Concern | Owner |
|----|--------|---------|-------|
| **PEX-1** | Sprint 2 audit (carry-forward) | Pre-existing `payload.event_type` direct property access in `src/theatres/proton-cascade.js:266, 284` without optional chaining. Throws TypeError if `bundle.payload` is undefined. **Sprint 6 / `corona-r4y` (input-validation review) is the natural owner.** Decide: defensive fix (recommended) OR documented accepted residual. | **Sprint 6 / `corona-r4y` + `corona-a6z` — must address.** |
| **LOW-1** | Sprint 3 audit (carry-forward) | `Math.max(0, …)` at `scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183` silently clamps negative stale-feed latencies to 0. Would mask a corpus-authoring error. **Sprint 6 / `corona-r4y` is the natural owner via the corpus-loader validation path.** Decide: corpus validation error in `corpus-loader.js` (recommended) OR accepted residual OR defer. **Note: a fix in `t5-quality-of-behavior.js` directly would violate hard constraint #9 (no scoring-semantics changes); the fix path is corpus-loader tightening.** | **Sprint 6 / `corona-r4y` + `corona-a6z` — must address.** |
| **LOW-1 (Sprint 5 audit)** | Sprint 5 audit | `corona-evidence-020` match_pattern is a comment-substring match (`"log-flux"`) rather than a runtime literal anchor. Documented in 4 places at Sprint 5 close; verification_status=OPERATIONAL_DOC_ONLY. NOT a Sprint 6 task — Sprint 7 / `corona-1ml` (final-validate) owns the regex strengthening if desired. Sprint 6 should NOT modify the manifest entry. | Sprint 7 / `corona-1ml` polish; Sprint 6 should NOT touch unless a direct blocker. |
| Sprint 5 review concerns 2-4 | `grimoires/loa/a2a/sprint-5/engineer-feedback.md` | Same-line entry pairs (006/007, 008/009, 010/011, 012/013) share match_patterns; "no refits motivated" framing rests partly on harness architecture; harness extension not formally evaluated as Sprint 5 scope. ALL non-blocking + documented. NOT Sprint 6 work. | Sprint 7 polish or future cycle. |
| Sprint 0 carry-forwards | Sprint 0 reviewer + auditor docs | Publish-readiness items (commands.path JS-file vs upstream `commands/*.md`, L2 publish gates, schemas/CHECKSUMS.txt, tempfile EXIT trap, ajv-formats install). | Sprint 7 / `corona-1ml` (publish-readiness epic). |
| Sprint 1 review C5 | `grimoires/loa/a2a/sprint-1/engineer-feedback.md` | `composition_paths.reads: []` registry compatibility (verify against construct-network indexer). | Sprint 7 / `corona-32r`. |

**Net effect on Sprint 6**: only PEX-1 and LOW-1 require Sprint 6 attention. Both are documented with recommended postures. All other carry-forward items are Sprint 7 territory.

---

## 13. Sprint 6 expected outputs (recap)

Per the operator's brief:

1. **`grimoires/loa/calibration/corona/security-review.md`** — SDD §8.3 template.
2. **Any narrow parser/corpus-loader hardening patches** if review surfaces directly fixable CRITICAL findings.
3. **Tests for any hardening patches** — meaningful, not cosmetic.
4. **Sprint 6 implementation report** at `grimoires/loa/a2a/sprint-6/reviewer.md`.

### Diff scope estimate

Sprint 6's diff scope is **small**: 1 new markdown file (security-review.md), possibly 1-3 narrow source patches (PEX-1 + LOW-1 corpus-loader path + maybe 1 critical finding from the §8.2 walk), 1-3 new tests, 1 sprint.md checkmark update, 1 reviewer.md, 1 engineer-feedback.md, 1 auditor-sprint-feedback.md, 1 COMPLETED. Net: ~10-15 files, mostly markdown.

If the §8.2 walk surfaces zero CRITICAL findings (most likely outcome — the parsers were Sprint 0/3 deliverables that already passed prior audits), Sprint 6 is essentially a documentation sprint with PEX-1 + LOW-1 dispositions.

---

## 14. HITL pause-points within Sprint 6 (suggested, operator may revise)

The fresh-session agent should consider surfacing for HITL review at these natural breakpoints:

1. **After `corona-r4y` walk completes, before `corona-8m8` authoring** — operator review of the walk's per-parser findings (severity classifications, count of CRITICAL findings). Catches mis-classification early.
2. **After `corona-8m8` security-review.md is drafted, before `corona-a6z` hardening patches** — operator review of the document's structure, severity-classification consistency, and whether the proposed CRITICAL fixes are appropriately scoped. Avoids over-aggressive fixing.
3. **After `corona-a6z` patches land, before Sprint 6 close** — operator review of patch scope (each patch should be <20 LoC), test coverage, and confirm `git diff scripts/corona-backtest/scoring/*.js` is empty (no scoring drift).

These are advisory; operator may choose to run Sprint 6 fully autonomously or pause more often per cycle health.

---

## 15. Files Sprint 6 WILL CREATE

```
grimoires/loa/calibration/corona/security-review.md   # corona-8m8 — primary deliverable
tests/security/<name>-test.js                         # corona-a6z (optional; only if hardening patches warrant new test file)
grimoires/loa/a2a/sprint-6/reviewer.md                # implementation report
grimoires/loa/a2a/sprint-6/engineer-feedback.md       # post /review-sprint
grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md # post /audit-sprint
grimoires/loa/a2a/sprint-6/COMPLETED                  # post /audit-sprint approval
```

---

## 16. Out-of-scope for Sprint 6 (explicit rejections)

Items the fresh-session agent should explicitly NOT touch:

- **Sprint 5 calibration-manifest.json** — frozen Sprint 5 source of truth for parameter provenance. Modify only if a direct Sprint 6 blocker requires a narrow citation/path correction; operator HITL required.
- **Sprint 5 manifest tests** (`tests/manifest_structural_test.js`, `tests/manifest_regression_test.js`) — Sprint 5 deliverables. Modify only if a coordinated Sprint 6 patch invalidates a test assertion.
- **Run 1, Run 2 certificates** — Sprint 3 + Sprint 5 baseline; read-only.
- **`empirical-evidence.md`, `calibration-protocol.md`, `theatre-authority.md`** — Sprint 2 + Sprint 4 frozen artifacts; read-only except for narrow citation/path corrections if Sprint 6 discovers a literal error.
- **`scripts/corona-backtest/scoring/*.js`** — operator hard constraint #9; do not change scoring semantics.
- **`scripts/corona-backtest/reporting/hash-utils.js`** — corpus_hash + script_hash semantics; untouched.
- **`scripts/corona-backtest.js`** — entrypoint; modify only if a Sprint 6 finding directly requires harness entrypoint hardening (rare).
- **`construct.yaml`, `BUTTERFREEZONE.md`, `package.json` version field, `spec/construct.json`, `spec/corona_construct.yaml`** — Sprint 7 publish-readiness territory.
- **`identity/CORONA.md`, `identity/persona.yaml`** — Sprint 0 identity deliverables. Untouched.
- **`grimoires/loa/calibration/corona/corpus/`** — Sprint 3 frozen corpus. Read-only — corpus extension is operator-HITL-gated.
- **`.claude/`** — System Zone, never edit.
- **`package.json`** — zero-dep invariant.

---

## 17. Stop condition

**After Sprint 6 implementation, STOP for review/audit before Sprint 7.**

Specifically:

1. After all 3 Sprint 6 owner tasks close (`br ready --json` returns no Sprint-6 tasks), engineer authors `grimoires/loa/a2a/sprint-6/reviewer.md` per the implementation-report template.
2. Engineer halts. Operator invokes `/review-sprint sprint-6`.
3. If review returns CHANGES_REQUIRED: engineer addresses, re-runs review until APPROVED.
4. If review APPROVED: operator invokes `/audit-sprint sprint-6`.
5. If audit APPROVED: operator commits Sprint 6 (mirroring Sprint 0/1/2/3/4/5 commit pattern).
6. ONLY AFTER Sprint 6 commit lands: operator decides whether to start Sprint 7 (final-validate + BFZ refresh + v0.2.0 tag) or pause.
7. If operator approves Sprint 7 continuation: invoke `/implement sprint-7` (or `/bug` triage if Sprint 6 surfaced specific Sprint 7 candidates).
8. If operator does NOT approve: stop. Sprint 7 deferred.

**Do NOT auto-chain Sprint 6 → Sprint 7.** Each sprint maintains separate gates, reviews, audits, and commits.

**Do NOT auto-commit.** Per operator stop condition.

---

## 18. Quick verification commands for fresh-session sanity check

```bash
# Verify cycle state intact
git log --oneline -7                                    # fc763d7 at HEAD
git status                                              # clean
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js           # tests 144 / pass 144 / fail 0
node scripts/corona-backtest.js                         # Run reproducible against committed corpus

# Verify Sprint 0/1/2/3/4/5 closed + approved
br list --status closed --json | grep -c "sprint-[012345]-"   # Expect: ≥24 (3+3+5+8+3+7)

# Verify Sprint 6 ready
br list --status open --json | grep -c "sprint-6-"      # Expect: 4 (corona-16a + corona-r4y + corona-8m8 + corona-a6z)
ls grimoires/loa/a2a/sprint-6/                          # Expect: handoff.md (this file)
ls grimoires/loa/calibration/corona/security-review.md 2>/dev/null  # Expect: not present (Sprint 6 unstarted)

# Verify Sprint 5 deliverables intact
wc -l grimoires/loa/calibration/corona/calibration-manifest.json   # Non-zero (30 entries; ~700 lines)
test -f tests/manifest_structural_test.js && echo "manifest_structural_test.js present"
test -f tests/manifest_regression_test.js && echo "manifest_regression_test.js present"
ls grimoires/loa/calibration/corona/run-2/              # Expect: T1-T5 + summary + corpus_hash + script_hash + per-event/ + delta-report.md

# Verify Sprint 7 unstarted
br list --status open --json | grep -c "sprint-7-"      # Expect: ≥5 (corona-1ml + corona-1p5 + corona-8v2 + corona-32r + corona-2k3 + corona-w1v)
```

---

## 19. Recommended Sprint 6 fresh-session kickoff

1. **First operator action**: invoke `/implementing-tasks Sprint 6` (or `/implement sprint-6`) in the fresh session.
2. **First implementation step**: read this handoff packet end-to-end.
3. **Second step**: read priority files §4 in order. SDD §8 (~70 lines) is the load-bearing read; the parser source files (~1488 lines total) are the review target.
4. **Third step**: execute `corona-r4y` — walk three parsers through SDD §8.2 13-row checklist; produce per-parser draft finding tables. Severity-classify each finding per SDD §8.4.
5. **Fourth step**: HITL pause-point #1 — surface walk's per-parser findings to operator before authoring security-review.md.
6. **Fifth step**: execute `corona-8m8` — author `security-review.md` per SDD §8.3 template.
7. **Sixth step**: HITL pause-point #2 — surface security-review.md draft to operator before any CRITICAL fixes.
8. **Seventh step**: execute `corona-a6z` — fix only CRITICAL findings (if any). Each fix is narrow + tested. Update security-review.md Status column to "fixed in Sprint 6". Address PEX-1 + LOW-1 dispositions.
9. **Eighth step**: HITL pause-point #3 — surface patches to operator; confirm `git diff scripts/corona-backtest/scoring/*.js` empty.
10. **Sprint 6 close**: `/review-sprint sprint-6` → `/audit-sprint sprint-6` → operator commit.

---

## 20. Handoff acknowledgment

This packet is the operator's primary primer for Sprint 6 in a fresh context window. The fresh-session agent should:

1. Read this file at the top of the session.
2. Read priority-listed files in §4 in order. SDD §8 is the load-bearing read.
3. Confirm cycle state via §18 verification commands.
4. Execute the 3 owner tasks per the §3 ordering (or §19 step-by-step).
5. Surface to operator at the §14 HITL pause-points OR if any §5 hard constraint is at risk OR if any §11 audit focus area would be violated.
6. **Stop after Sprint 6 implementation per §17 stop condition.** Do NOT auto-start Sprint 7.

The operator's stated goal: lightweight input-validation review of SWPC parser + DONKI parser + backtest corpus loader against the SDD §8.2 checklist; produce severity-classified `security-review.md`; fix only CRITICAL findings inline; address PEX-1 + LOW-1 carry-forwards. Sprint 6 closes the security gate before Sprint 7 (final-validate + v0.2.0 tag).

---

*Sprint 6 handoff packet authored cycle-001 Sprint 5 close, after Sprint 5 implementation (calibration-manifest.json + structural test + regression gate + Run 2 + delta report), review (1 round APPROVED with non-blocking concerns), audit (1 round APPROVED, 1 LOW informational), and commit (`fc763d7`). All Sprint 0/1/2/3/4/5 work pushed to origin/main. Sprint 6 unstarted.*
