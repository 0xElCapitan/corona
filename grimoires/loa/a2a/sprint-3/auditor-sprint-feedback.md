# Sprint 3 Security Audit — CORONA cycle-001-corona-v3-calibration

**Auditor**: Paranoid Cypherpunk (auditing-security skill)
**Verdict**: **APPROVED - LETS FUCKING GO**
**Date**: 2026-05-01
**Sprint epic**: `corona-d4u` (8 tasks: corona-v9m, corona-2jq, corona-1ks, corona-2iu, corona-70s, corona-aqh, corona-2ox, corona-2b5 — all closed, `review-approved` labeled)
**Pre-flight**: Senior approval verified (engineer-feedback.md Round 2 verdict: "All good"); no prior COMPLETED marker.
**Operator focus areas**: all 8 evaluated; **0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW informational, 1 PRE-EXISTING (inherited from Sprint 2)**.

---

## Executive Verdict

Sprint 3 passes security audit. The harness implementation introduces no
exploitable attack surface across the 8 operator focus areas. Path
construction uses `node:path.resolve` with author-controlled or strictly
sanitized inputs throughout. Network behavior is bounded to documented
public NOAA / NASA / GFZ endpoints reached via `URLSearchParams` (no
injection). The `T4_TEN_MEV_REGEX` is not ReDoS-exploitable. The Round 2
fix to the T5 stale-feed indexing bug preserves source identity without
introducing new bypass paths or silent data corruption. No new
dependencies, no settlement-authority ambiguity, no Sprint 4/5 scope
leakage.

One LOW informational note (LOW-1: Math.max(0, …) silently clamps
negative latencies — corpus-authoring sanity check candidate for a
future cycle) is documented for future awareness; it is not blocking.
One PRE-EXISTING note (PEX-1: pre-existing `payload.event_type` direct
property access in `src/theatres/proton-cascade.js`, inherited from
earlier sprints) remains the natural owner of Sprint 6 / `corona-r4y`
(input-validation review) and is out of Sprint 3 scope.

---

## Pre-flight Checks

| Check | Result |
|-------|--------|
| Sprint 3 directory exists | ✓ `grimoires/loa/a2a/sprint-3/` contains `handoff.md`, `reviewer.md`, `engineer-feedback.md` |
| Senior reviewer approved | ✓ engineer-feedback.md Round 2 verdict declares "All good" |
| Prior COMPLETED marker | ✓ Not present (correct state for audit) |
| Beads tasks state | ✓ All 8 closed; epic `corona-d4u` labeled `review-approved`, `sprint:3` |
| Validator | ✓ `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)` |
| Tests | ✓ 93 / 93 pass (`node --test tests/corona_test.js`) — was 92 in Round 1; +1 CI-1 regression |
| `git diff package.json` | ✓ Empty (zero-dep invariant intact) |
| corpus_hash | ✓ `b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1` (stable across re-runs) |
| script_hash | ✓ `17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1` (stable; entrypoint unchanged in Round 2) |

---

## Operator Focus Area Verdicts

### Focus Area 1 — No secrets/API keys committed in corpus, reports, notes, or run-1 outputs

**Verdict: ✓ CLEAN**

| Check | Method | Result |
|-------|--------|--------|
| Hardcoded API keys / tokens / secrets in Sprint 3 source | `grep -rEni "api[_-]?key\|secret\|token\|password\|bearer\|sk-[A-Za-z0-9]\|ghp_\|aws_\|0x[a-f0-9]{40}\|client_secret\|private.key\|BEGIN.*PRIVATE"` over `scripts/corona-backtest/` | All matches are env-var name references (`NASA_API_KEY`), the `DONKI_DEMO_KEY` constant (set to literal string `"DEMO_KEY"` — NASA's documented public demonstration key, NOT a credential), or documentation strings. No literal credential values. |
| Same grep over `grimoires/loa/calibration/corona/corpus/primary/` | No matches | No secrets in 25 corpus event files. |
| Same grep over `grimoires/loa/calibration/corona/run-1/` | No matches | No secrets in T1-T5 reports, summary, hash files, or per-event JSON dumps. |
| `NASA_API_KEY` referenced as env-var name only | `grep -rEn "NASA_API_KEY"` | All matches reference the env-var name in code (config.js, donki-fetch.js, donki-sanity.js) or documentation. construct.yaml:157-159 (Sprint 0 deliverable, unchanged) declares `required: false` with `DEMO_KEY` fallback. No value embedded. |
| URLs / endpoints | `grep -E "https?://"` over Sprint 3 files | Only matches are public NOAA/NASA endpoints declared as base-URL constants in config.js (DONKI, SWPC, GFZ) or documentation links in donki-sanity.js fixture data (kauai.ccmc.gsfc.nasa.gov — NASA CCMC public viewer). No internal hostnames, no API keys in URLs. |
| PII (emails, IP addresses, names other than the documented author "El Capitan") | `grep -E "[a-z0-9]+@[a-z0-9.-]+\.[a-z]+\|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"` | No PII. The construct.yaml:26 `author: "El Capitan"` is the documented public author identity from Sprint 0 (unchanged). |
| Cache directory committed contents | `find scripts/corona-backtest/cache/ -type f` | Empty. Cache is gitignored at `.gitignore:27` (`scripts/corona-backtest/cache/`). No live-fetch cache contents committed. |
| Trajectory files | `ls grimoires/loa/a2a/trajectory/` | Sprint 3 trajectory writes are gitignored per `.gitignore:14` (existing project policy); no sensitive content surfaced. |

**No findings.**

### Focus Area 2 — No unsafe filesystem behavior in corpus loader, report writer, cache handling, or output-dir handling

**Verdict: ✓ CLEAN**

Path-construction sites enumerated via grep over `scripts/corona-backtest/`:
**18 sites** across config.js, ingestors/{corpus-loader, donki-fetch, donki-sanity, swpc-fetch, gfz-fetch}.js, and reporting/{write-report, write-summary, hash-utils}.js. Each one analysed below.

| Site | Source of input | Safety analysis |
|------|----------------|-----------------|
| `corpus-loader.js:380` `resolve(root, CORPUS_SUBDIRS[theatre])` | `theatre` from hardcoded `THEATRES = ['T1'..'T5']`; `CORPUS_SUBDIRS` is config-defined hardcoded object | SAFE — no untrusted input |
| `corpus-loader.js:387-389` `readdirSync(subdir)` + `resolve(subdir, name)` | `name` from filesystem listing (cannot contain `/` or `\` after readdirSync); filtered to `.json` extension | SAFE — `readdirSync` returns single-component file names |
| `write-report.js:299` `resolve(perEventDir, \`${theatre}-${safeId}.json\`)` | `theatre` is hardcoded; `safeId = String(r.event_id ?? 'unknown').replace(/[^A-Za-z0-9._-]/g, '_')` | SAFE — strict allowlist regex strips everything except alphanumerics + dot + underscore + dash. Filename pattern `${theatre}-${safeId}.json` cannot escape `perEventDir` even if `event_id` is `..` (resolves to `T1-..json`, a regular file in the dir) or `../foo` (`/` replaced with `_` → `T1-.._foo.json`) |
| `donki-fetch.js:82` `resolve(DONKI_CACHE_DIR, \`${eventType}-${hash}.json\`)` | `eventType` validated against `SUPPORTED_EVENT_TYPES` set; `hash` is sha256 hex slice (16 chars, pure hex) | SAFE |
| `donki-sanity.js:377` `resolve(CACHE_DIR, \`sanity-${safe}.json\`)` | `safe = sample.label.replace(/[^A-Za-z0-9._-]/g, '_')`; `sample.label` from hardcoded `SAMPLE_EVENTS` | SAFE — same allowlist regex |
| `swpc-fetch.js:31`, `gfz-fetch.js:29` | `label` and `key` are hardcoded constants; `hash` is sha256 hex | SAFE |
| `hash-utils.js:46-51` | Same as corpus-loader; `corpusDir` operator-controlled via env, `name` from readdirSync | SAFE under "operator owns operator's input" |
| `config.js:118` `resolveOutputDir` `resolve(CALIBRATION_DIR, requested)` | `requested` from `--output` CLI flag or `CORONA_OUTPUT_DIR` env | OPERATOR-CONTROLLED — not a security issue for an offline harness; operator runs harness against their own machine |
| `config.js:128` `resolveCorpusDir` | Same as above | OPERATOR-CONTROLLED |

**Symlink follow risks**: `readFileSync` and `readdirSync` follow symlinks by default. The corpus is operator-committed; if an operator authors a symlink-bearing corpus event, the loader would follow it. NOT a security issue for an offline harness — operator authored the corpus.

**`readFileSync` size bounds**: corpus event JSONs are read into memory without an explicit size cap. NOT a security issue for an offline harness — the operator authors the corpus and won't commit a 10GB JSON unless they intend to. A future cycle could add an `assert(stat.size < CORPUS_EVENT_MAX_BYTES)` guard if a deployed-system threat model emerges; not in scope for Sprint 3.

**`mkdirSync({recursive: true})`** at write-report.js:274, 276 + write-summary.js:58 + cache-dir setup in ingestors: standard Node.js usage; no permissions/ownership escalation surface.

**No findings.**

### Focus Area 3 — No unsafe network behavior or accidental live fetch requirement

**Verdict: ✓ CLEAN**

| Check | Method | Result |
|-------|--------|--------|
| `fetch()` call sites | `grep -E "fetch\("` over scripts/corona-backtest/ | 4 sites: donki-sanity.js:390, donki-fetch.js:99, swpc-fetch.js:42, gfz-fetch.js:59. ALL in ingestor modules (none in orchestrator, scoring, reporting, or loader). |
| `child_process` / `eval` / `new Function` / dynamic `import()` | `grep -E "child_process\|require\(\|import\(\|eval\(\|new Function\|exec\(\|spawn\("` over scripts/corona-backtest/ | One match: `corona-backtest.js:33 import { execSync } from 'node:child_process'` — used solely at gitRev() (lines 61-67) for `git rev-parse HEAD` to populate the run-1 report's `code_revision` metadata. No untrusted input reaches execSync; the command is a literal string. |
| Run 1 path triggers fetch? | Trace orchestrator imports | `corona-backtest.js` imports `loadCorpus` from corpus-loader.js (read-only fs). Scoring modules do not call fetch. Reporting modules do not call fetch. **No fetch call on the documented Run 1 path.** |
| URL construction sites | Manual review of donki-sanity, donki-fetch, swpc-fetch, gfz-fetch | All fetch URLs use base-URL constants (DONKI_BASE_URL, SWPC_BASE_URL, GFZ_KP_BASE_URL) + `URLSearchParams` for query encoding (correct, no injection). Three URLs are interpolated by string concat (e.g., `${SWPC_BASE_URL}/json/goes/primary/xrays-1-day.json`) but the interpolated parts are hardcoded path strings, not user input. |
| Accept headers tight | grep | `Accept: application/json` for DONKI/SWPC; `Accept: text/plain` for GFZ. No content-negotiation surprises. |

**Run 1 verification**: I re-ran `node scripts/corona-backtest.js` with `NASA_API_KEY` not set and no network egress assumed. Run 1 completed successfully, reading only the committed corpus tree. No fetch calls were made.

**No findings.**

### Focus Area 4 — No ReDoS / path traversal risk from new parsing or file-loading code

**Verdict: ✓ CLEAN**

#### Regex inventory

I enumerated all regex literals in `scripts/corona-backtest/` via grep:

| Regex | Site | ReDoS analysis |
|-------|------|----------------|
| `/(?:^\|\D)10\s*MeV\b/i` | corpus-loader.js:217 (T4_TEN_MEV_REGEX) | Single-character alternation `(?:^\|\D)` + literal `10` + bounded quantifier `\s*` + literal `MeV\b`. NO nested quantifiers. NO overlapping alternations. NO backreferences. The `\s*` is the only quantifier and is bounded by a literal-then-`\b` to its right; no ambiguity at boundaries. Worst-case complexity O(N) where N is energy_channel string length. Bundle energy strings are bounded (typical values "≥10 MeV", "≥100 MeV", "≥50 MeV"). **NOT EXPLOITABLE.** |
| `/[^A-Za-z0-9._-]/g` | write-report.js:298, donki-sanity.js:373 | Pure character-class negation with `/g` flag. No quantifier explosion. Linear time. **NOT EXPLOITABLE.** |
| `/^[0-9a-f]{64}$/` | tests/corona_test.js (test assertion only) | Bounded quantifier `{64}`. **NOT EXPLOITABLE.** Test-only; not a runtime regex. |
| `/(?:^\|\D)10\s*MeV\b/i` (test counter-example) | tests/corona_test.js | Same as #1 above. |

#### Path traversal vectors

Already covered in Focus Area 2. All file-path construction uses author-controlled or sanitized inputs (`/[^A-Za-z0-9._-]/g` allowlist). No `path.join` with untrusted concatenation.

#### URL injection vectors

DONKI/SWPC/GFZ URL construction uses `URLSearchParams` (donki-sanity.js:371, donki-fetch.js:97) or hardcoded paths. No untrusted-input string concat into URL.

**No findings.**

### Focus Area 5 — No new dependency or package.json mutation

**Verdict: ✓ CLEAN**

| Check | Method | Result |
|-------|--------|--------|
| `package.json` deps unchanged | `git diff package.json` | Empty — no diff. `"dependencies": {}` (line 32) preserved per PRD §8.1 zero-dep invariant. |
| No `devDependencies` block | Read package.json | The `devDependencies` block does not exist (preserved zero dev deps). |
| No lockfiles | `ls package-lock.json yarn.lock pnpm-lock.yaml` | None present. Pure zero-dep project. |
| Sprint 3 imports allowlist | `grep "^import.*from"` over scripts/corona-backtest/ | 26 imports total. All are: `node:fs`, `node:path`, `node:url`, `node:crypto`, `node:process`, `node:child_process`, internal relative imports (`../config.js`, `../../../src/theatres/proton-cascade.js`). No third-party packages. |
| Native `fetch` use only | grep | Native `fetch()` (Node 20+) — not a third-party library. |
| Test runner | `package.json:18` | `"test": "node --test tests/corona_test.js"` — built-in `node --test` runner; no third-party test framework. |

**No findings.**

### Focus Area 6 — No hidden settlement-authority ambiguity introduced

**Verdict: ✓ CLEAN**

Cross-checked Sprint 3 ingestors and corpus annotations against
`grimoires/loa/calibration/corona/theatre-authority.md` (Sprint 0
deliverable, unchanged this sprint).

| Theatre | Settlement authority of record (theatre-authority.md) | Sprint 3 corpus + scoring |
|---------|---------------------------------------------------------|----------------------------|
| **T1** | GOES/SWPC X-ray flux (live + regression) | Corpus events: `flare_class_observed` from GOES X-ray, `donki_flr_class_type` for cross-validation only. Scoring: bucket-Brier on `flare_class_observed`. **NO new oracle introduced.** |
| **T2** | SWPC provisional Kp (live), GFZ definitive Kp (regression) | Corpus events: `kp_swpc_observed` AND `kp_gfz_observed`. Loader prefers GFZ for bucket derivation (corpus-loader.js:147). Scoring excludes GFZ-lag-null events from regression-tier (t2-bucket-brier.js:93). **Settlement-authority split honored.** |
| **T3** | Observed L1 shock signature (DSCOVR/ACE) | Corpus events: `wsa_enlil_predicted_arrival_time` (forecast, NOT settlement) + `observed_l1_shock_time` (settlement). Scoring measures forecast accuracy AGAINST L1 observation. **DONKI/WSA-Enlil correctly NOT used as settlement.** |
| **T4** | GOES integral proton flux ≥10 MeV (live + regression) | Corpus events: `proton_flux_observations` filtered by strict ≥10 MeV regex matching runtime exactly. Scoring re-derives qualifying events using runtime constants. **NO new oracle.** |
| **T5** | Self-resolving (DSCOVR-ACE Bz volatility + sustained streak detection) | Corpus events: four behavioral arrays. Scoring is purely behavioral. `corroborating_alerts.source ∈ {NOAA_SWPC_ALERT, DONKI_IPS, DONKI_GST}` are CROSS-VALIDATION cues for FP classification (per §4.5.1.a "no external corroboration exists"), NOT settlement. **Settlement remains internal.** |

**Note on the T1 6-bucket and T2 G0-addition interpretations**: per
reviewer.md §11, these are bucket-set declarations only — they do NOT
re-route settlement to a new oracle. Both interpretations preserve the
settlement-authority assignment in theatre-authority.md verbatim. The
audit-posture tag `INTERPRETATION_DOCUMENTED` (NOT
`PROTOCOL_VIOLATION`) is correctly applied.

**No findings.**

### Focus Area 7 — No Sprint 4 or Sprint 5 work smuggled in

**Verdict: ✓ CLEAN**

| Check | Method | Result |
|-------|--------|--------|
| `empirical-evidence.md` unchanged (Sprint 4 deliverable) | `git diff` empty; file is 60-line Sprint 1 placeholder | ✓ Untouched |
| `calibration-manifest.json` still `[]` (Sprint 5 deliverable) | `cat` returns `[]` | ✓ Untouched |
| No parameter refits (Sprint 5 territory) | `git diff src/` returns empty | ✓ No mutations to runtime code |
| `src/theatres/proton-cascade.js` untouched | `git diff src/theatres/` empty | ✓ T4 runtime parameters preserved (Sprint 5 / corona-3ja territory) |
| `src/processor/*` untouched | `git diff src/processor/` empty | ✓ |
| `src/oracles/*` untouched | `git diff src/oracles/` empty | ✓ |
| `construct.yaml` untouched | `git diff construct.yaml` empty | ✓ Sprint 7 / publish-readiness territory preserved |
| `calibration-protocol.md` untouched | `git diff` empty | ✓ Frozen Sprint 2 protocol respected |
| `theatre-authority.md` untouched | `git diff` empty | ✓ Sprint 0 settlement authority of record preserved |
| No `manifest_regression_test.js` (Sprint 5 / corona-15v) | `ls tests/` shows only `corona_test.js` | ✓ |
| No `tests/integration/` (Sprint 0 optional surface) | `ls tests/` | ✓ Single-file test convention preserved per SDD §11.2 |
| No `manifest_structural_test.js` (Sprint 5 / corona-25p) | grep | ✓ |
| Round 2 fixes confined to Sprint 3 surface | git diff narrowed to scripts/corona-backtest/scoring/t5-quality-of-behavior.js + tests/corona_test.js + reviewer.md + NOTES.md + sprint.md checkmarks | ✓ |

**No findings.**

### Focus Area 8 — T5 stale-feed bug fix does not introduce malformed-record bypass or silent data corruption

**Verdict: ✓ CLEAN (with one LOW informational note LOW-1 below)**

Manual trace through the Round 2 patch at
[scripts/corona-backtest/scoring/t5-quality-of-behavior.js:165-185](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:165),
[222-242](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:222),
and [259-265](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:259):

| Input pathology | Code defense | Result |
|-----------------|--------------|--------|
| `s.actual_onset_time` is a number (e.g., `12345`) | `parseIsoMs(12345)` — `typeof` check returns NaN | `valid = false` → `latency_seconds: null`. Per-event report shows null. Aggregate filters out. SAFE. |
| `s.actual_onset_time` is `undefined` | `parseIsoMs(undefined)` returns NaN | Same as above. SAFE. |
| `s.actual_onset_time` is `null` | `parseIsoMs(null)` returns NaN | Same. SAFE. |
| `s.actual_onset_time` is malformed string (e.g., `"not-a-date"`) | `new Date("not-a-date").getTime()` returns NaN | Same. SAFE. |
| `s.detection_time` BEFORE `actual_onset_time` (negative latency) | Both finite → `valid = true`; `Math.max(0, (detect - onset) / 1000)` clamps to 0 | **LOW-1 (see below)**: latency reported as 0s. Not a security finding (the value 0 is real, not corruption), but a corpus-authoring sanity-check candidate for a future cycle. |
| `staleEvents` is missing entirely | Caller path: `Array.isArray(event.stale_feed_events) ? event.stale_feed_events : []` (line 145) | Defaults to empty array. SAFE. |
| `staleEvents` is not an array | Same coercion | Defaults to empty array. SAFE. |
| Partial record: only `actual_onset_time` present, missing `detection_time` | `parseIsoMs(undefined)` for detect returns NaN → `valid = false` | latency_seconds: null. SAFE. |
| Mixed valid + invalid (the original bug repro) | `staleRecords.map(...)` preserves source order 1:1; per-event report shows correct latency at correct index | Verified by tests/corona_test.js:1095-1150 regression test. Identity-preserving (satellite field doesn't swap between DSCOVR/ACE under the fix). SAFE. |

#### Aggregate path

Aggregate p50/p95 at lines 259-265:
```js
const allLatencies = perEvent
  .flatMap((r) => r.stale_latencies_sec)
  .filter((v) => v != null)    // ← null filter HERE, not before
  .sort((a, b) => a - b);
```

The filter is correctly placed AT the percentile-call site. NaN values
cannot reach this code: `latency_seconds` is either a valid number
(via `Math.max(0, ...)`) or `null` (per validity check). NaN values
would fail `v != null`? Let me check: `NaN != null` evaluates to
`true` in JavaScript. **POTENTIAL ISSUE**: a NaN value would slip
through the filter and pollute the percentile.

However, NaN cannot occur here because:
- `Number.isFinite(onset) && Number.isFinite(detect)` is checked at line 176.
- Only when BOTH are finite is `latency_seconds` set to a number (via `Math.max(0, …)`).
- Otherwise `latency_seconds` is set to `null` directly.

So no NaN in `r.stale_latencies_sec`. The filter pattern is safe in
practice. But this is a defense-in-depth opportunity: switching the
filter to `.filter((v) => typeof v === 'number' && Number.isFinite(v))`
would harden against future regressions where someone might assign NaN
into the array. Not blocking; not even a finding — just an observation.

#### LOW-1 — Math.max(0, …) silent clamp

**Severity**: LOW (informational)
**Site**: [scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183](scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183)
```js
latency_seconds: valid ? Math.max(0, (detect - onset) / 1000) : null,
```

**Concern**: when a corpus author writes `detection_time` BEFORE
`actual_onset_time` (a semantically meaningless authoring error), the
code clamps the resulting negative latency to 0. The per-event report
shows a "valid 0s latency" without flagging the corpus error.

**Why this is NOT a security finding**:
- The clamped value 0 is real (not corruption).
- An aggregate p50/p95 of 0 is well-defined for the bounded domain.
- A negative-latency record cannot be exploited to bypass any check —
  the validation gates upstream of this line are unrelated to sign.
- The Math.max(0, …) bound is APPROPRIATE for the operational use case
  (latency cannot be negative); removing it would let negative numbers
  pollute the percentile.

**Why it's worth a note**: a corpus authoring error (transposing
onset/detection timestamps) silently produces a 0s latency, which
flatters the T5 stale-feed-detection metric. A future cycle could add
a corpus-loader sanity check warning when detection precedes onset by
more than a tolerance window (e.g., `detect - onset < -5 seconds`),
surfaced in the corpus-load errors stream. **Not in Sprint 3 scope**;
Sprint 3 inherits the existing Math.max(0, …) bound from the original
implementation.

**Recommended action**: track as a corpus-loader hardening task for
Sprint 7 / `corona-r4y` polish or a future bug cycle. Do not block
Sprint 3 close.

#### PEX-1 — pre-existing direct property access

**Severity**: PRE-EXISTING (not Sprint 3 scope)
**Site**: [src/theatres/proton-cascade.js:266, 284](src/theatres/proton-cascade.js:266)
```js
if (payload.event_type === 'solar_flare' || payload.event_type === 'donki_flare') { ... }
```

**Concern**: direct property access on `payload.event_type` without
optional chaining. Throws TypeError if `bundle.payload` is undefined.

**Why this is NOT a Sprint 3 finding**:
- Sprint 3 did NOT modify `src/theatres/proton-cascade.js` (verified
  via `git diff src/`).
- This concern was originally raised in the Sprint 2 audit
  (`grimoires/loa/a2a/sprint-2/auditor-sprint-feedback.md` PEX-1) and
  inherits unchanged.
- Natural owner: Sprint 6 / `corona-r4y` (input-validation review).

**Recommended action**: leave for Sprint 6. The Sprint 3 corpus-loader
DOES use optional chaining defensively when reading `_derived` fields
(e.g., `event._derived?.bucket_observed`), so the Sprint 3 surface is
clean even though the runtime carries this pre-existing pattern.

---

## Additional Audit Hygiene

### Code-quality observations (informational, non-blocking)

These were noted in the Round 2 senior review and remain non-blocking
audit observations:

- **Duplicate sigma_hours fallback**: t3-timing-error.js:83 has
  `event._derived?.sigma_hours_effective ?? 14` after the corpus-loader
  populates the same fallback at corpus-loader.js:174. Defense-in-depth
  duplication; not a bug. Single-source-of-truth cleanup candidate for
  a future cycle.

- **§11 Protocol Interpretations cite file:line ranges**: line numbers
  may rot as the codebase evolves. Symbol-based references (e.g.,
  "the `T1_BUCKETS` constant in t1-bucket-brier.js") would be more
  durable. Not blocking.

- **CI-1 regression test asserts exact percentile values (p50=150,
  p95=231)**: depends on the linear-interpolation method. If the
  percentile implementation ever switches, the test would fail in a
  way that doesn't obviously trace back to "the indexing bug returned".
  Defensible as-is; minor maintainability concern.

- **Sprint 7 acceptance criterion lives in NOTES.md, not sprint.md**:
  the live --online validation requirement was recorded as a
  forward-looking commitment in NOTES.md HITL-2 rather than amending
  Sprint 7's existing tasks. Reading NOTES.md at Sprint 7 session
  start (per the structured memory protocol) should surface it; minor
  fragility concern.

None of these reach blocking severity.

### Verification commands re-run during audit

All verification commands re-run by auditor (not trusting prior runs):

```
$ git rev-parse HEAD
7e8b52e9e729b1b7d31366bbc7d3e1a264a43da3

$ git status
On branch main
... (Sprint 3 deliverables added; not committed; consistent with stop condition)

$ node --test tests/corona_test.js 2>&1 | tail -5
ℹ tests 93
ℹ pass 93
ℹ fail 0

$ ./scripts/construct-validate.sh construct.yaml
OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)

$ git diff package.json
(empty)

$ ls package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null
(none)

$ cat grimoires/loa/calibration/corona/run-1/corpus_hash.txt
b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1

$ cat grimoires/loa/calibration/corona/run-1/script_hash.txt
17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1

$ cat grimoires/loa/calibration/corona/calibration-manifest.json
[]
```

All identical to claims; no drift.

---

## Findings Summary

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 0 | — |
| LOW | 1 | LOW-1 (Math.max(0, …) silent clamp; corpus-authoring sanity-check candidate; non-blocking) |
| PRE-EXISTING | 1 | PEX-1 (`payload.event_type` direct access in proton-cascade.js; Sprint 6 / corona-r4y owner; out of Sprint 3 scope) |

---

## Decision

**APPROVED - LETS FUCKING GO**

Sprint 3 passes security audit. All 8 operator focus areas verified
clean. The Round 2 fix to the T5 stale-feed indexing bug is structurally
sound and includes a regression test that catches the pre-fix behavior.
No new attack surface introduced. Zero new dependencies. Settlement
authority from Sprint 0 preserved verbatim. No Sprint 4/5 scope leakage.

Sprint 3 is ready for operator commit + push (cycle-001 sprint-3 commit
mirroring Sprint 0/1/2 pattern). The audit does NOT auto-commit per
operator stop-condition instructions.

---

*Sprint 3 security audit — CORONA cycle-001 (`corona-d4u` epic). 8 tasks closed, 93/93 tests pass, validator green, zero new deps, settlement authority preserved, no Sprint 4/5 leakage. Round 2 fix verified surgical and complete. 0 CRITICAL / 0 HIGH / 0 MEDIUM / 1 LOW informational / 1 PRE-EXISTING (Sprint 6 territory).*
