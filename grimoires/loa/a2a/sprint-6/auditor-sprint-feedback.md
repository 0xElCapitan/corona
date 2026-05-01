# Sprint 6 Security Audit — CORONA cycle-001-corona-v3-calibration

**Auditor**: Paranoid Cypherpunk Auditor
**Date**: 2026-05-01
**Sprint**: 6 — Lightweight Input-Validation Review
**Round**: 1 (first audit pass)
**Verdict**: **APPROVED - LETS FUCKING GO**
**Threat model assumed**: malicious upstream (NOAA / NASA TLS-MITM), malicious operator-internal (corpus author, env var injection), defense-in-depth posture
**Scope of audit**: Sprint 6 deliverables only — does NOT re-audit Sprint 0-5 already-cleared work.

---

## Executive Summary

Sprint 6 passes security audit. The implementation introduces **zero new attack surface**:

- **Zero secrets / credentials / PII** across all sprint deliverables (security-review.md, reviewer.md, engineer-feedback.md, the two source patches, the two new test files, sprint.md checkmarks).
- **Zero scope leakage** — frozen Sprint 0-5 artifacts (scoring, calibration manifest, calibration protocol, theatre authority, empirical evidence, run-1, run-2, corpus, package.json, construct.yaml, identity, spec, BUTTERFREEZONE) all `git diff --stat` empty.
- **Zero new dependencies** — `package.json` `"dependencies": {}` invariant preserved; no `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `node_modules`.
- **Zero new dangerous primitives** — no `fetch()`, `http://`, `exec()`, `spawn()`, `eval()`, or `Function()` in any new code.
- **Zero new regex** — both patches add no regex; existing regexes (T4_TEN_MEV_REGEX `/(?:^|\D)10\s*MeV\b/i`, parseSourceLocation `/([NS])(\d+)([EW])(\d+)/i`) verified ReDoS-safe (single-pass anchored, no nested quantifiers).
- **No hidden settlement / scoring / calibration changes** — both patches are surgical input-validation hardening; settlement authority untouched, scoring numerics identical to Sprint 3 baseline (verified by independent backtest re-run with `CORONA_OUTPUT_DIR=run-sprint-6-scratch`: corpus_hash + script_hash + per-theatre Brier/MAE/FP/p50/sw IDENTICAL to Run 1).

The Sprint 6 reviewer's three adversarial concerns (resolveOutputDir parallel finding not catalogued, C-006 vs LOW-1 severity inconsistency, backtest harness defaults to run-1) are non-blocking and correctly classified as Sprint 7+ / future-cycle polish or documentation items. The auditor agrees with the reviewer's verdict and adds three additional LOW INFORMATIONAL observations (see §LOW Informational below) that do NOT block Sprint 6 approval.

**Severity tally** (auditor-side, in addition to security-review.md's 25 self-classified findings):
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 0
- LOW (informational): 3 — all non-blocking

**Acceptable for Sprint 7 entry from a security-audit perspective.**

---

## Audit focus area verification

### Focus 1 — No secrets / API keys / PII — ✓ PASS

Scanned all Sprint 6 deliverables for credential patterns (`api[_-]?key`, `secret`, `token`, `password`, `bearer`, `AKIA`, `sk-[A-Za-z0-9]+`, `ghp_[A-Za-z0-9]+`):

| Path | Match count | Disposition |
|------|-------------|-------------|
| [grimoires/loa/calibration/corona/security-review.md](../../calibration/corona/security-review.md) | 1 | Reference to "secret management" in scope-out-of-scope statement (line 5: `"crypto, auth, secret management, deep code audit"`) — defining scope, not leaking secrets |
| [grimoires/loa/a2a/sprint-6/handoff.md](handoff.md) | 2 | Two references to "no secrets" / "NASA_API_KEY" in the audit focus brief — defining the audit scope, no actual secrets |
| [grimoires/loa/a2a/sprint-6/reviewer.md](reviewer.md) | 2 | Two references to "no secrets" claim and `NASA_API_KEY` env var name — no actual values |
| [grimoires/loa/a2a/sprint-6/engineer-feedback.md](engineer-feedback.md) | 0 | No matches |
| [tests/security/proton-cascade-pex1-test.js](../../../../tests/security/proton-cascade-pex1-test.js) | 0 | Test data is synthetic (`pex1-flare-bundle`, `M5.2`, etc.) |
| [tests/security/corpus-loader-low1-test.js](../../../../tests/security/corpus-loader-low1-test.js) | 0 | Test data is synthetic ISO timestamps (`2025-04-01T...`) and event IDs (`t5-c006-test`) |
| [src/theatres/proton-cascade.js](../../../../src/theatres/proton-cascade.js) (4-char patch) | 0 | Patch is `?.` insertion only |
| [scripts/corona-backtest/ingestors/corpus-loader.js](../../../../scripts/corona-backtest/ingestors/corpus-loader.js) (24-line patch) | 0 | Patch contains no credential-shaped strings |
| [grimoires/loa/sprint.md](../../sprint.md) (checkmark updates) | 0 | Only checkbox state changes |

**Verdict**: zero leak vector. All credential-pattern matches are documentation references (defining what is out-of-scope), not actual credential values. The `getNasaApiKey()` function in `src/oracles/donki.js:22-24` already correctly fetches from env (`process.env.NASA_API_KEY ?? process.env.DONKI_API_KEY ?? 'DEMO_KEY'`); Sprint 6 did not modify this function.

### Focus 2 — Scope integrity — ✓ PASS

**No Sprint 7 publish-readiness work**: `git diff --stat` empty for `construct.yaml`, `BUTTERFREEZONE.md`, `package.json`, `spec/`, `identity/`. Verified.

**No source beyond the two narrow hardening patches**:
- `src/theatres/proton-cascade.js` — 4-character diff (lines 266, 284: `?.` optional chaining). 2 insertions / 2 deletions; identical line count.
- `scripts/corona-backtest/ingestors/corpus-loader.js` — 24-line diff (lines 326-349: new validation block inside `validateT5`). 24 insertions / 0 deletions.
- All other source files: `git diff --stat` empty.

**No scoring / settlement / calibration / manifest / protocol / authority-map / empirical-evidence / Run 1 / Run 2 / corpus changes**:
```
git diff --stat scripts/corona-backtest/scoring/                           → empty
git diff --stat scripts/corona-backtest/reporting/                         → empty
git diff --stat scripts/corona-backtest.js                                 → empty
git diff --stat scripts/corona-backtest/config.js                          → empty
git diff --stat src/oracles/                                               → empty
git diff --stat src/processor/                                             → empty
git diff --stat grimoires/loa/calibration/corona/calibration-manifest.json → empty
git diff --stat grimoires/loa/calibration/corona/calibration-protocol.md   → empty
git diff --stat grimoires/loa/calibration/corona/theatre-authority.md      → empty
git diff --stat grimoires/loa/calibration/corona/empirical-evidence.md     → empty
git diff --stat grimoires/loa/calibration/corona/corpus/                   → empty
git diff --stat grimoires/loa/calibration/corona/run-1/                    → empty
git diff --stat grimoires/loa/calibration/corona/run-2/                    → empty
git diff --stat tests/corona_test.js tests/manifest_*.js                   → empty
git diff --stat .claude/                                                   → empty
```

**Run 1 accidental overwrite reverted**: confirmed by empty diff.

**Verdict**: scope discipline maintained. Operator hard constraints #5 (no shared scoring code), #9 (no scoring-semantics changes), #10 (no corpus-eligibility changes), and the Sprint 6 handoff §5 hard constraints all preserved.

### Focus 3 — PEX-1 patch safety — ✓ PASS

**Patch shape**:
```diff
- if (payload.event_type === 'solar_flare' || payload.event_type === 'donki_flare') {
+ if (payload?.event_type === 'solar_flare' || payload?.event_type === 'donki_flare') {
...
- if (payload.event_type !== 'proton_flux') {
+ if (payload?.event_type !== 'proton_flux') {
```

**Static-flow trace** (auditor-verified by reading `src/theatres/proton-cascade.js:257-404` end-to-end):

| Payload shape | Pre-Sprint-6 behavior | Post-Sprint-6 behavior | Δ |
|---------------|----------------------|------------------------|---|
| `undefined` / `null` | TypeError thrown at line 266 | Falls through to line 284, returns updated theatre with bundle in evidence_bundles[] | **fail-closed**: theatre is not corrupted, qualifying_event_count unchanged, malformed bundle logged |
| `{}` (empty object) | Line 266: `undefined === 'solar_flare'` → false; line 284: `undefined !== 'proton_flux'` → true → return updated | Same | **identical** |
| `{event_type: 'solar_flare', flare: {class_string: 'M5.2'}}` | Enters line 266 block; `payload.flare?.class_string` = 'M5.2'; appends to position_history; returns | Same | **identical** |
| `{event_type: 'solar_flare'}` (no flare field) | Enters line 266 block; `payload.flare?.class_string` is `undefined?.class_string` = undefined; `?? 'unknown'` → 'unknown'; appends to position_history; returns | Same | **identical** |
| `{event_type: 'kp_index', ...}` | Line 266: false; line 284: true → return updated | Same | **identical** |
| `{event_type: 'proton_flux', proton: {flux: 50, energy_channel: '>=10 MeV'}}` | Line 266: false; line 284: false; lines 291+ execute normally with peakPfu=50, energy_channel match | Same | **identical** |
| `{event_type: 'proton_flux'}` (no proton field) | Line 291: `payload.proton?.flux` = undefined; line 301: `peakPfu == null` → enter informational block, return | Same | **identical** |

**No hidden settlement change**: settlement is computed in `resolveProtonEventCascade` (lines 410+), which depends on `theatre.qualifying_event_count`, `theatre.outcome`, and `theatre.state`. The PEX-1 fix does not modify `qualifying_event_count` for malformed bundles (the line 284 fall-through returns without incrementing). Settlement output is bit-identical for valid payloads; malformed payloads simply don't crash the runtime.

**Tests adequate**: [tests/security/proton-cascade-pex1-test.js](../../../../tests/security/proton-cascade-pex1-test.js) — 6 tests covering 3 failure modes (undefined/null/missing payload) + 3 happy-path regressions (flare bundle / kp_index bundle / resolved-state early-return). All assert on `assert.doesNotThrow` plus specific field-level state changes (`evidence_bundles` membership, `qualifying_event_count` preservation, `position_history` reason regex). The PEX-1 tests would FAIL on pre-Sprint-6 code — `payload.event_type` on undefined throws TypeError, failing `assert.doesNotThrow`.

**Verdict**: PEX-1 patch is surgical, fail-closed, and preserves all valid-payload semantics. Approved.

### Focus 4 — C-006 / negative-latency patch safety — ✓ PASS

**Patch shape**: 24-line addition inside `validateT5(event, file)` at `scripts/corona-backtest/ingestors/corpus-loader.js:326-349`. The new block iterates `event.stale_feed_events`, parses `actual_onset_time` and `detection_time` to ms epochs (with explicit null-skip and isFinite guards), and pushes a descriptive error to `errors[]` if `detectMs < onsetMs`.

**Behavioral analysis**:

| Stale-feed entry shape | Pre-Sprint-6 behavior | Post-Sprint-6 behavior | Δ |
|------------------------|----------------------|------------------------|---|
| `{onset: '12:00', detect: '12:05', ...}` (positive latency) | Loader accepts; scoring computes `latency_seconds: 300` | Loader accepts; scoring computes `latency_seconds: 300` | **identical** |
| `{onset: '12:00', detect: '12:00', ...}` (zero latency boundary) | Loader accepts; scoring computes `latency_seconds: 0` | Loader accepts; scoring computes `latency_seconds: 0` | **identical** |
| `{onset: '12:00', detect: '11:55', ...}` (negative latency) | Loader accepts; scoring clamps to `latency_seconds: 0` (silent error mask) | **Loader REJECTS with explicit error**: "stale_feed_events[N]: detection_time precedes actual_onset_time; negative latency violates §3.7.6 schema invariant" | **surfacing of corpus-authoring error at corpus-load time** |
| `{onset: null, detect: '12:05', ...}` | Loader accepts; scoring isFinite-guards produce `latency_seconds: null` | Loader accepts (the new check skips when either field is null); scoring unchanged | **identical** |
| `{onset: '12:00', detect: null, ...}` | Same as above | Same as above | **identical** |
| `{onset: 'not-a-date', detect: '12:05', ...}` | Loader accepts; scoring isFinite-guards produce `latency_seconds: null` | Loader accepts (the new check skips when isFinite fails); scoring unchanged. Note: this is C-003 deferred territory. | **identical** |
| `null` array entry | Loader accepts (Array.isArray check passes; null entries pass through) | Loader accepts (the new check skips with `if (entry == null) continue`) | **identical** |

**No scoring semantics change**: the patch is in `validateT5()`, called by `loadEventFile()`. It only affects whether an event is admitted into the corpus. Once admitted, the event flows to the scoring layer unchanged. `scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183` (`Math.max(0, (detect - onset) / 1000)`) is untouched — verified by `git diff --stat scripts/corona-backtest/scoring/` returning empty. The clamp remains as defense-in-depth backstop.

**No hidden filtering of valid corpus events**: independent backtest re-run with `CORONA_OUTPUT_DIR=run-sprint-6-scratch` produced:
```
corpus_hash:        b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
script_hash:        17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
composite_verdict:  fail
T1: Brier=0.1389, n=5    → IDENTICAL to Sprint 3 Run 1 baseline
T2: Brier=0.1389, n=5    → IDENTICAL
T3: MAE=6.76h, ±6h=40.0%, n=5 → IDENTICAL
T4: Brier=0.1600, n=5    → IDENTICAL
T5: FP=25.0%, p50=90.0s, sw=100.0%, n=5 → IDENTICAL
```
All 5 existing primary T5 corpus events pass the new C-006 validation (verified by `n=5` matching Sprint 3 baseline at the T5 row). No corpus event was newly rejected. The scratch dir was cleaned up; run-1 + run-2 untouched.

**No PII / corpus content leak in error message**: the new error at line 345 includes the `entry.detection_time` and `entry.actual_onset_time` values — these are public ISO-8601 timestamps from publicly-authored corpus files. No PII or secrets.

**Tests adequate**: [tests/security/corpus-loader-low1-test.js](../../../../tests/security/corpus-loader-low1-test.js) — 10 tests covering boundary cases (zero/positive/negative latency), null fields (skipped per the both-fields-non-null guard), malformed ISO (deferred to C-003 / scoring), null array entries (skipped), and end-to-end via `_loadEventFile` with a temp file. Tests assert on the error message containing the offending index, the invariant explanation, AND the schema citation `§3.7.6` for traceability.

**Verdict**: C-006 patch is surgical, scope-tight, and preserves T5 scoring semantics for all valid corpus entries. Approved.

### Focus 5 — Filesystem / path safety — ✓ PASS

**Corpus-loader path handling** (audited at `scripts/corona-backtest/ingestors/corpus-loader.js:395-431`):

- `loadCorpus(corpusDir)`: `resolveCorpusDir(corpusDir)` returns operator-controlled root path. C-008 (low / accepted residual) catalogues that this is not anchored to REPO_ROOT — defensible per PRD §9.2 operator-trust boundary.
- `resolve(root, CORPUS_SUBDIRS[theatre])`: `CORPUS_SUBDIRS[theatre]` is a hardcoded constant (config.js:55-61). No user input.
- `readdirSync(subdir).filter((n) => n.endsWith('.json'))`: returns file basenames only; cannot return `..` segments.
- `resolve(subdir, name)`: `name` is a real filename from readdirSync, ending in `.json`. Filenames cannot contain path separators on the host filesystem; `..` cannot escape.
- `statSync(file).isFile()`: ensures only regular files are loaded (skips symlinks pointing to directories, sockets, etc.).
- `JSON.parse(readFileSync(file, 'utf8'))`: wrapped in try/catch in `loadEventFile()`; returns clear error on parse failure.

**Output-dir handling** (audited at `scripts/corona-backtest/config.js:121-124`):

- `resolveOutputDir(envValue)`: `resolve(CALIBRATION_DIR, requested)`. The Sprint 6 reviewer's adversarial Concern #1 noted this is not in security-review.md's catalogue (parallel to C-008). `..` segments in `CORONA_OUTPUT_DIR` would escape the calibration directory. Same operator-trust rationale as C-008. Non-blocking.

**Run-scratch pattern audit** ([reviewer.md:281-285](reviewer.md), used during Sprint 6 review): `CORONA_OUTPUT_DIR=run-sprint-6-scratch node scripts/corona-backtest.js` — this resolves to `<calibration>/run-sprint-6-scratch`, a sibling of run-1 and run-2 inside the calibration directory. No path-traversal risk because `'run-sprint-6-scratch'` is a literal alphanumeric string with no `..` segments. Safe.

**Test temp file pattern** (`tests/security/corpus-loader-low1-test.js:200`): `resolve(process.cwd(), 'tests', 'security', '_t5-c006-tmp.json')` — fixed path under the repo's tests directory. Cleanup is in `finally` block. The path is anchored to `process.cwd()` which assumes test invocation from the repo root; if invoked from a subdirectory, the temp file would land in `<subdir>/tests/security/`. Minor portability concern, not a security issue.

**No new `unsafe write primitive`**: no `fs.writeFile`, `fs.appendFile`, `fs.symlink`, `fs.chmod`, `fs.chown`, or shell-exec calls in the patches. The C-006 patch is read-only validation logic. The test files use `writeFileSync` for the temp test fixture, immediately followed by `unlinkSync` cleanup in `finally`.

**Verdict**: no path-traversal at blocking severity. Operator-trust boundaries documented. Run-scratch pattern is safe. Approved.

### Focus 6 — Regex / parser safety — ✓ PASS

**ReDoS audit**: no new regex introduced in either patch. Verified by grep for regex-with-quantifier patterns in the two patched files: zero new matches.

**Existing regexes referenced by Sprint 6 walk**:

| Regex | Location | ReDoS analysis |
|-------|----------|----------------|
| `/(?:^|\D)10\s*MeV\b/i` | T4_TEN_MEV_REGEX in `corpus-loader.js:217` and inline `proton-cascade.js:298` | Single non-capturing group with single-character alternation `^\|\D`; `\s*` is the only quantifier and applies to a literal whitespace class; `\b` is anchored. No nested quantifiers, no backtracking explosion. **Linear time** for any input. |
| `/([NS])(\d+)([EW])(\d+)/i` | `parseSourceLocation` in `donki.js:171` | Four capture groups, each with a bounded character class plus `\d+` quantifier. No nested quantifiers. **Linear time**. |
| `/[^A-Za-z0-9._-]/g` | `write-report.js:298` (event_id sanitization) | Negated character class with `g` flag; no nesting. **Linear time**. |

**JSON parser safety**: `JSON.parse(readFileSync(...))` at `corpus-loader.js:369` — wrapped in try/catch (line 368-372). Returns clear error message on parse failure. Sprint 6 unchanged this behavior. ✓

**Invalid timestamp handling**: the C-006 patch uses `new Date(...).getTime()` followed by `Number.isFinite()` guards. Invalid dates produce NaN; `Number.isFinite(NaN)` is false → check skipped (deferred to C-003 / scoring's existing `isFinite` guards). No infinite loop, no recursion. ✓

**Missing-fields handling**: `validateCommonEnvelope` (lines 49-71) and per-theatre validators (`validateT1`-`validateT5`) explicitly check field presence with `!('field' in event)`. Missing fields produce explicit error messages. The C-006 patch does NOT modify the existing presence-check logic. ✓

**Verdict**: no new ReDoS surface. JSON / timestamp / missing-field handling is unchanged from Sprint 5 baseline. Approved.

### Focus 7 — Dependency / package safety — ✓ PASS

**`package.json` unchanged**: `git diff --stat package.json` returns empty. The `"dependencies": {}` invariant is preserved.

**No lockfiles**:
- `test -f package-lock.json` → "no package-lock.json"
- `test -f yarn.lock` → "no yarn.lock"
- `test -f pnpm-lock.yaml` → "no pnpm-lock.yaml"

**No `node_modules`**: `test -d node_modules` → "no node_modules".

**No new dependency surface introduced**: both patches use only Node.js built-ins (`node:fs`, `node:path`, `node:test`, `node:assert/strict`). The end-to-end test in `tests/security/corpus-loader-low1-test.js:198-199` uses dynamic `await import('node:fs')` and `await import('node:path')` — both are stdlib and Node 20+ stable. No third-party imports.

**Existing imports (not new)**:
- `corpus-loader.js`: `node:fs`, `node:path`, plus internal imports (`config.js`, `proton-cascade.js`). No new imports added by the C-006 patch.
- `proton-cascade.js`: pre-existing imports unchanged.
- `tests/security/proton-cascade-pex1-test.js`: `node:test`, `node:assert/strict`, internal `proton-cascade.js`. All stdlib + internal.
- `tests/security/corpus-loader-low1-test.js`: `node:test`, `node:assert/strict`, internal `corpus-loader.js`, dynamic `node:fs` + `node:path`. All stdlib + internal.

**Verdict**: zero-runtime-dependency posture preserved. No supply-chain surface expanded. Approved.

### Focus 8 — Deferred findings integrity — ✓ PASS

The auditor walked all 9 medium findings from `security-review.md` against the SDD §8.4 severity ladder to verify no MEDIUM is concealing HIGH or CRITICAL:

| Finding | Severity claimed | Auditor check |
|---------|------------------|---------------|
| S-004 (inconsistent date parsing) | medium | ✓ "non-graceful degradation" — schema drift produces NaN times; not data-loss in the SDD §8.4 critical sense (in-flight bundle is malformed but no destructive write to persistent state) |
| S-007 (eclipse-season GOES gaps) | medium | ✓ "non-graceful degradation" — silent zero bundles; not data-loss because there's no underlying data to lose during a true gap |
| D-001 (parseSourceLocation TypeError on schema drift) | medium | ⚠ borderline: could be classified high under strict reading of "crash on plausible malformed input." Engineer's medium classification with rationale "per-feed try/catch already isolates" is defensible. **Auditor accepts as medium** because the contained crash does not reach a critical class (no input-injection, no infinite-loop, no destructive write). The "rate-limited" qualifier in SDD §8.4 is interpreted as containment rate; per-feed try/catch limits crashes to one per poll cadence. |
| D-002 (getBestCMEAnalysis null-guard) | medium | ✓ Same containment pattern as D-001. Defensible as medium. |
| D-003 (NaN arrival prediction) | medium | ✓ T3 settlement is via observed L1 shock per `theatre-authority.md`, NOT via WSA-Enlil prediction. NaN arrival_prediction does not reach settlement. Medium correct (not critical because no settlement impact). |
| D-004 (era-aware normalization gap) | medium | ✓ Schema-drift fragility; medium correct |
| D-005 (rate-limit awareness in runtime) | medium | ✓ DEMO_KEY ceiling exceeded → 429 sustained. Per-feed try/catch contains. Resource-leak / non-graceful degradation. Medium correct. |
| C-003 (ISO-8601 validation gap) | medium | ✓ NaN propagates to scoring; T5 scoring has explicit isFinite guards (`t5-quality-of-behavior.js:174-176`); T1/T4 may have partial coverage but worst-case is NaN-tagged report rows, not silent corruption. Medium correct (not critical because the failure surfaces in reports). |
| C-006 (negative latency in T5 stale_feed_events) | medium | ✓ **Fixed in Sprint 6.** Pre-fix: scoring clamped to defensible value (0 seconds). Auditor agrees: not a critical input-injection / data-loss vector because the clamp produced a non-misleading numeric value in scoring output. The Sprint 3 audit's original LOW classification was also defensible; the medium upgrade in Sprint 6 reflects the "data-quality vector that previously slipped through" framing. Either is non-blocking. The reviewer's Concern #2 (severity inconsistency) is a documentation polish issue. |

**No medium concealing CRITICAL** (input-injection / infinite-loop / data-loss):
- No input-injection vector: SWPC + DONKI parse JSON via stdlib `response.json()`; corpus-loader parses JSON via stdlib `JSON.parse`. No `eval`, no SQL, no shell exec, no template-string rendering with user input. All untrusted input flows through schema validation before reaching scoring.
- No infinite-loop / unbounded recursion: all loops are bounded by array length; no recursion in any parser. ReDoS analysis (Focus 6) confirms no catastrophic-backtracking regex.
- No data-loss: the per-feed try/catch isolates failed feeds; the corpus-loader rejects malformed events with explicit errors (does not silently substitute defaults); the scoring layer does not write to corpus files.

**No medium concealing HIGH** (crash on plausible malformed input that is not rate-limited):
- D-001 / D-002 cause TypeError on certain schema-drift inputs but are contained by per-feed try/catch. The "rate-limited" qualifier is interpreted as containment rate; the per-feed pattern limits crashes to one per poll cadence, which is rate-limited by the runtime poll cadence (60s for live runtime).

**Accepted-residual findings explicitly assigned** (security-review.md:134-138):
- S-001, S-006, S-008 — SWPC robustness; defensible per PRD §9.2 (read-only HTTP, zero auth, TLS-bound to noaa.gov). Operator-trust boundary explicit.
- D-006 — DONKI response-size cap; same rationale as S-008.
- C-005 — corpus-loader per-file size cap; defensible per `calibration-protocol.md` §3.5 operator-HITL-gated corpus authorship.
- C-008 — `resolveCorpusDir` REPO_ROOT anchoring; defensible per PRD §9.2 operator-trust.

All accepted-residual findings have explicit rationale + a defensible threat-model assumption (operator trust, TLS containment, or schema-stability). None should escalate.

**Deferred findings explicitly assigned** (security-review.md:124-132):
- 16 deferred findings, all with explicit "Sprint 7+ or future cycle" disposition + rationale. Auditor agrees these are non-blocking polish items.

**Verdict**: severity classifications are sound. No hidden HIGH or CRITICAL. Approved.

---

## LOW Informational (non-blocking)

The auditor adds three LOW informational observations that the operator may consider for future-cycle planning. None block Sprint 6 approval.

### LOW-A1 — `resolveOutputDir` parallel finding not catalogued in security-review.md

**Where**: [scripts/corona-backtest/config.js:121-124](../../../../scripts/corona-backtest/config.js#L121)

**Observation**: The Sprint 6 security-review.md catalogues C-008 about `resolveCorpusDir` (low / accepted residual) but does NOT mention `resolveOutputDir`. Both functions consume `process.env.CORONA_*_DIR` and pass to `node:path.resolve` without `..`-traversal prevention. `resolveOutputDir` anchors to `CALIBRATION_DIR` (slightly safer than `resolveCorpusDir`'s un-anchored `resolve(requested)`), but `resolve(CALIBRATION_DIR, '../../tmp')` still escapes via `..` segments.

**Severity rationale**: low / informational — same operator-trust boundary as C-008 per PRD §9.2. The threat model requires malicious operator-controlled env, which is out of scope for the Sprint 6 review. The runtime construct is bounded by deployment trust.

**Recommendation**: in a future polish pass, add a parallel finding C-009 in security-review.md classified at low / accepted residual with the same rationale as C-008. Not required for Sprint 6 close.

**Disposition**: deferred to Sprint 7+ or future cycle. Reviewer flagged in [engineer-feedback.md Concern #1](engineer-feedback.md). Auditor concurs; non-blocking.

### LOW-A2 — C-006 medium vs LOW-1 low severity inconsistency

**Where**: [security-review.md:67](../../calibration/corona/security-review.md) (C-006 = medium) vs [security-review.md:78](../../calibration/corona/security-review.md) (LOW-1 = low)

**Observation**: The same underlying defect (corpus-loader does not validate negative-latency stale_feed_events; scoring clamps via `Math.max(0, …)`) is documented twice with two different severities. C-006 in the corpus-loader table classifies as medium ("data-quality vector"). LOW-1 in the carry-forward table classifies as low (matching the original Sprint 3 audit). Cross-references exist but no severity reconciliation is provided.

**Severity rationale**: low / informational — both severities are below `critical`; Sprint 7 gate is satisfied either way. The total finding count of 25 includes the issue twice (mildly inflated unique-defect count) but does not affect any acceptance criterion.

**Recommendation**: in a documentation polish pass, choose one severity and reconcile (or add a footnote: "C-006 is the corpus-loader-side framing of LOW-1; both refer to the same defect, now closed via the loader patch"). Not required for Sprint 6 close.

**Disposition**: deferred to Sprint 7+ documentation polish. Reviewer flagged in [engineer-feedback.md Concern #2](engineer-feedback.md). Auditor concurs; non-blocking.

### LOW-A3 — Backtest harness defaults to run-1 output (process-level fragility, not security)

**Where**: [scripts/corona-backtest/config.js:121-124](../../../../scripts/corona-backtest/config.js#L121)

**Observation**: During Sprint 6 implementation, `node scripts/corona-backtest.js` (without `CORONA_OUTPUT_DIR` set) defaulted to writing run reports to run-1, overwriting the Sprint 3 baseline certificates. The implementing agent reverted run-1 immediately, but the underlying default behavior is unchanged. Future operators / developers running the bare command may repeat the mistake.

**Severity rationale**: low / informational — this is a process-level fragility, not a security vulnerability. The frozen artifacts are protected by git history, not by file-system access controls. Recovery is `git checkout HEAD -- grimoires/loa/calibration/corona/run-1/`.

**Recommendation**: in Sprint 7 / future cycle, consider changing the harness default to a scratch dir name (e.g., `'run-scratch'`) or requiring `CORONA_OUTPUT_DIR` to be set explicitly when invoking against the committed corpus. Outside Sprint 6 scope (would be a Sprint 3 architectural amendment).

**Disposition**: deferred to Sprint 7+ harness polish. Reviewer flagged in [engineer-feedback.md Concern #3](engineer-feedback.md). Auditor concurs; non-blocking.

---

## Quality gate verification

### Tests
```
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js
ℹ tests 160 / suites 29 / pass 160 / fail 0 / cancelled 0 / skipped 0 / todo 0
```

### Validator
```
./scripts/construct-validate.sh construct.yaml
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)
```

### Backtest reproducibility (auditor-verified independently)
```
CORONA_OUTPUT_DIR=run-sprint-6-scratch node scripts/corona-backtest.js
corpus_hash:        b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1   (matches Sprint 3 baseline)
script_hash:        17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1   (matches Sprint 3 baseline)
T1: Brier=0.1389, n=5      → IDENTICAL to Run 1
T2: Brier=0.1389, n=5      → IDENTICAL
T3: MAE=6.76h, ±6h=40.0%   → IDENTICAL
T4: Brier=0.1600, n=5      → IDENTICAL
T5: FP=25.0%, p50=90.0s, sw=100.0%, n=5 → IDENTICAL
```
Scratch dir cleaned up post-verification; run-1 + run-2 untouched.

### Working tree state
```
modified:   .beads/issues.jsonl                                        (status updates only)
modified:   grimoires/loa/sprint.md                                    (Sprint 6 checkmarks)
modified:   scripts/corona-backtest/ingestors/corpus-loader.js          (C-006 patch, +24 LoC)
modified:   src/theatres/proton-cascade.js                              (PEX-1 patch, 2 chars)
untracked:  grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md      (this file)
untracked:  grimoires/loa/a2a/sprint-6/engineer-feedback.md            (review approval)
untracked:  grimoires/loa/a2a/sprint-6/reviewer.md                     (impl report)
untracked:  grimoires/loa/calibration/corona/security-review.md        (Sprint 6 deliverable)
untracked:  tests/security/                                             (2 new test files, 16 tests)
```

---

## Decision

**APPROVED - LETS FUCKING GO**

Sprint 6 passes security audit. The implementation is:
- **Scope-disciplined**: zero changes to scoring, settlement, calibration, manifest, protocol, authority-map, empirical-evidence, run-1, run-2, corpus, package.json, construct.yaml, identity, spec, BUTTERFREEZONE, or System Zone.
- **Surgical**: 4-character PEX-1 patch + 24-line C-006 patch. Total source diff ≤ 28 LoC.
- **Tested**: 16 new tests covering both fixes' failure modes + happy-path regressions; 160/160 total pass; backtest reproducibility verified at hash level.
- **Fail-closed**: PEX-1 fix routes malformed bundles through the line 284 fall-through (return updated theatre) instead of throwing; C-006 fix surfaces corpus-authoring errors at corpus-load time instead of silently masking at scoring.
- **Defensible**: all 25 findings classified per SDD §8.4 ladder; no HIGH or CRITICAL; 9 mediums correctly classified as non-graceful-degradation / contained crashes; 16 lows are minor robustness improvements with explicit operator-trust or downstream-sanitization rationale.
- **Zero-deps**: no new dependencies, no lockfiles, no node_modules. Zero supply-chain surface change.
- **Zero secrets**: no credentials, tokens, or PII in any deliverable.

Three LOW informational observations (LOW-A1, LOW-A2, LOW-A3) are documented for Sprint 7+ planning. None require Round 2.

---

## Per Sprint 6 stop condition

The operator's audit brief explicitly states: "If audit is green, stop and report final Sprint 6 state. Do not auto-commit. Do not start Sprint 7."

This audit:
- Creates a `COMPLETED` marker per the standard `/audit-sprint` workflow (signaling Sprint 6 is gate-cleared).
- Does NOT auto-commit the working-tree changes.
- Does NOT auto-start Sprint 7.

The operator will:
1. Optionally inspect the final Sprint 6 state.
2. Manually `git add` + `git commit` Sprint 6 mirroring the Sprint 0/1/2/3/4/5 commit pattern.
3. Optionally `git push origin main`.
4. Decide whether to start Sprint 7 (final-validate + BFZ refresh + v0.2.0 tag) or pause.

---

## Beads label update

```bash
br comments add corona-16a "AUDIT (Round 1): APPROVED - LETS FUCKING GO. 0 critical / 0 high / 0 medium / 3 LOW informational. PEX-1 + C-006/LOW-1 carry-forwards verified surgical and fail-closed; scoring + manifest + corpus + run-1 + run-2 + package.json all untouched; backtest reproducibility verified at hash level. Three LOW informational observations (LOW-A1/A2/A3) deferred to Sprint 7+ polish. Sprint 7 unblocked from security gate."
br label add corona-16a security-approved
```

(To be applied with the COMPLETED marker creation; no additional commits.)

---

*Sprint 6 security audit authored 2026-05-01 by the Paranoid Cypherpunk Auditor. Threat model: malicious upstream + malicious operator-internal + defense-in-depth. Verdict: APPROVED - LETS FUCKING GO. Sprint 7 unblocked from audit gate. Awaiting operator commit decision per stop condition.*
