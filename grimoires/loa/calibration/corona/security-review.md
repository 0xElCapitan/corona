# CORONA Sprint 6 — Lightweight Input-Validation Review

**Date**: 2026-05-01
**Reviewer**: Sprint 6 implementing agent (cycle-001-corona-v3-calibration)
**Scope**: `src/oracles/swpc.js`, `src/oracles/donki.js`, `scripts/corona-backtest/ingestors/corpus-loader.js`. Out of scope: crypto, auth, secret management, deep code audit (per PRD §5.7 + §9.2 + SDD §8.1).
**Severity ladder**: per SDD §8.4 — `critical` (input-injection / infinite-loop / data-loss; **blocks Sprint 7**), `high` (crash on plausible malformed input), `medium` (resource leak / non-graceful degradation), `low` (minor robustness improvement).
**Checklist**: walked per SDD §8.2 13-row table. Three parsers × 13 rows (with N/A entries collapsed) = 28 cells reviewed.

---

## Summary

| Parser | Critical | High | Medium | Low | Total |
|--------|----------|------|--------|-----|-------|
| SWPC (`src/oracles/swpc.js`) | 0 | 0 | 2 | 6 | 8 |
| DONKI (`src/oracles/donki.js`) | 0 | 0 | 5 | 2 | 7 |
| Corpus loader (`scripts/corona-backtest/ingestors/corpus-loader.js`) | 0 | 0 | 2 | 6 | 8 |
| Carry-forward (Sprint 2 PEX-1, Sprint 3 LOW-1) | 0 | 0 | 0 | 2 | 2 |
| **Total** | **0** | **0** | **9** | **16** | **25** |

**Sprint 7 gate**: per SDD §8.4 + sprint.md GC.7-GC.8, Sprint 7 is blocked iff one or more findings are `critical`. **Zero critical findings — Sprint 7 unblocked from a security perspective.**

Two findings (PEX-1 carry-forward; C-006 = Sprint 3 LOW-1 carry-forward) are addressed in Sprint 6 inline as narrow defensive patches per the handoff §6.4 + §6.5 recommended postures (option A in both cases). No scoring-semantics or corpus-eligibility changes (operator hard constraints #9, #10 preserved).

---

## Findings (per parser)

### `src/oracles/swpc.js`

| # | Severity | Finding | Recommendation | Status |
|---|----------|---------|----------------|--------|
| S-001 | low | `pollAndIngest` per-feed `try/catch` blocks (lines 314, 335, 358, 386) wrap the entire feed pipeline (`fetchFeed → parse → normalize → buildBundle`). A `JSON.parse` SyntaxError or a fetch failure both surface as a single `errors[]` entry with `err.message` only — no preservation of stack/HTTP status/feed snippet. Debug-only impact; no data loss because the next poll re-fetches. | Acceptable: per-poll feed isolation is the intended robustness pattern. If diagnostic depth is needed, add structured error envelope (status, snippet preview) to `errors[]` in a future polish pass. | accepted residual |
| S-002 | low | `fetchFlares` (line 165): `entry.max_xrlong ? parseFloat(entry.max_xrlong) : null` uses truthy check. Legitimate flux value `0` (background) is coerced to `null`. Same pattern at line 166 (`current_int_xrlong`). | Use explicit `entry.max_xrlong != null && entry.max_xrlong !== '' ? parseFloat(...) : null`. Defensible because flux=0 is "no flare" — a flux=0 row in `xray-flares-latest.json` would be an upstream schema anomaly (the endpoint returns flare events, not background readings). | deferred (Sprint 7+ or future cycle; defensible since SWPC `xray-flares-latest.json` does not emit flux=0 events) |
| S-003 | low | `fetchFlares` (line 170): post-map `.filter((e) => e.begin_time !== null)` filters explicit `null` but not `NaN`. If `entry.begin_time` is a non-string truthy value (e.g., a number from schema drift), `entry.begin_time + 'Z'` produces `"<num>Z"` which `new Date(...).getTime()` returns `NaN`. NaN passes the `!== null` filter and propagates as `flare.begin_time`. | Strengthen filter to `(e) => e.begin_time !== null && Number.isFinite(e.begin_time)`. Defensible because SWPC `xray-flares-latest.json` schema returns ISO strings consistently; this is robustness against future drift. | deferred (Sprint 7+ or future cycle; low likelihood per stable SWPC schema) |
| S-004 | medium | Inconsistent date parsing across endpoints. `fetchFlares` (line 159) appends `'Z'` to `begin_time` on the assumption it lacks timezone (`new Date(entry.begin_time + 'Z')`). Other endpoints (`fetchXrayFlux` line 186, `fetchKpIndex` line 206, `fetchKpForecast` line 221, `fetchProtonFlux` line 237, `fetchSolarWindMag` line 253, `fetchSolarWindPlasma` line 271) call `new Date(entry.time_tag)` directly with no `'Z'` append. If SWPC's flares product changes to include the `Z` suffix (or another timezone offset), `new Date('2024-01-01T00:00:00ZZ')` returns Invalid Date → `.getTime() === NaN`. Inverse drift on time-series endpoints would silently produce machine-local-timezone timestamps. | Either (a) standardize on a single helper that accepts both naïve and timezone-suffixed ISO strings, or (b) add format-detection per call site. **No fix in Sprint 6**: this is a parser-wide refactor that exceeds the SDD §8 narrow-fix scope. Documented for Sprint 7+ or future cycle. The empirical pattern is bounded by SWPC's stable schema; no observed failure. | deferred |
| S-005 | low | `parseFloat("Infinity")` and `parseFloat("-Infinity")` return `Infinity` / `-Infinity`. `fetchXrayFlux` (line 187), `fetchKpIndex` (line 207), `fetchProtonFlux` (line 238), and others do not bound-check parsed numerics. An `Infinity` flux would propagate to threshold comparisons in `flareRank` / `classifyFlux` and produce `'X'`-class with `Math.min(num, 10) = 10` (capped) — no crash but a misleading bundle. | Add `Number.isFinite(parsed) ? parsed : null` guards at parse sites. Defensible because the read-only HTTPS endpoint is bounded by NOAA's physics-bounded payloads (proton flux peaks ~1e6 pfu, well below Number.MAX_VALUE); a TLS-MITM injection of `"Infinity"` is the only adversarial path. | deferred |
| S-006 | low | `fetchFeed` (line 141): `if (!response.ok) throw new Error(...)`. HTTP 429 is treated identically to 500 — no exponential backoff, no retry. The next poll cadence (typically 60s for live runtime per `pollAndIngest`) will re-hit the rate-limited endpoint immediately. | SWPC products are unauthenticated and have generous public ceilings; adding backoff is a polish item. Per PRD §5.7 + §9.2 the surface is read-only HTTP; the per-feed try/catch already isolates a 429 failure to a single dropped feed. | accepted residual |
| S-007 | medium | GOES eclipse-season data gaps (~70-minute gaps around equinoxes when the GOES satellite is in Earth shadow) appear as empty arrays from SWPC products. The parser silently produces zero bundles for affected polls; no gap-detection signal is surfaced. A T1/T4 settlement that depends on continuous flux monitoring cannot distinguish "no flares occurred" from "data unavailable." | Surface gap-state signal (e.g., a `data_gap: true` bundle when the feed returns < N entries within an expected lookback window). **No fix in Sprint 6**: gap-detection is a feature addition, not input-validation hardening — outside SDD §8 scope. Per SDD §8.4 medium severity is non-blocking; documented for future cycle. | deferred |
| S-008 | low | `response.json()` reads the entire response body into memory with no per-response size cap. A compromised upstream proxy returning a multi-GB JSON would OOM the polling process. | Add a `Content-Length` pre-check or `response.body` streaming size cap. Defensible because the surface is TLS-bound to `services.swpc.noaa.gov`; an attack requires either NOAA endpoint compromise or TLS-MITM. Per PRD §9.2 "read-only HTTP, zero auth" — risk is acknowledged and accepted. | accepted residual |

---

### `src/oracles/donki.js`

| # | Severity | Finding | Recommendation | Status |
|---|----------|---------|----------------|--------|
| D-001 | medium | `parseSourceLocation(locStr)` (line 171): `locStr.match(/([NS])(\d+)([EW])(\d+)/i)`. The `if (!locStr) return null;` guard at line 170 catches `null`/`undefined`/`''`. But a non-falsy non-string (e.g., DONKI schema drift returns a number or object for `sourceLocation`) reaches `.match()` and throws `TypeError: locStr.match is not a function`. The `try/catch` in `pollAndIngest` (lines 271, 314, 352) catches it but the *entire CME poll* is dropped. | Add `if (typeof locStr !== 'string') return null;` after the falsy guard. Defensible because DONKI's `sourceLocation` field has historically been a string; this is robustness against schema drift. | deferred (low likelihood; per-feed try/catch already isolates) |
| D-002 | medium | `getBestCMEAnalysis(cmeEvent)` (line 182): accesses `cmeEvent.cmeAnalyses` without guarding `cmeEvent` itself. If `cmeEvent` is `null`/`undefined` (e.g., schema variance returns sparse array elements), throws `TypeError`. Caller `pollAndIngest` line 282 iterates `cmes` array directly — array elements should always be objects per DONKI spec, but defense-in-depth desirable. | Add `if (!cmeEvent) return null;` guard at function head. | deferred |
| D-003 | medium | `getEarthArrival(cmeEvent)` (line 202): `new Date(earthImpact.arrivalTime).getTime()` produces `NaN` if `arrivalTime` is missing (DONKI WSA-Enlil records have known nullable `arrivalTime` and `estimatedShockArrivalTime`). The returned object has `estimated_arrival: NaN`, which silently propagates downstream. | Wrap with `earthImpact.arrivalTime ? new Date(earthImpact.arrivalTime).getTime() : null`. Defensible because Sprint 3 corpus-loader (`scripts/corona-backtest/ingestors/corpus-loader.js:182-189`) explicitly REJECTS T3 events with `wsa_enlil_predicted_arrival_time === null`; the runtime parser does not have the same explicit rejection but downstream consumers (e.g., T3 settlement) typically handle NaN as missing. **No fix in Sprint 6**: a defensive null-coalesce here would be narrow but the consumer interface contract is not Sprint 6's scope. | deferred |
| D-004 | medium | The runtime parser (`donki.js`) does not apply era-aware normalization akin to `scripts/corona-backtest/ingestors/donki-fetch.js`'s `detectEra` + `normalise` pipeline. PRD §10 R3 documents that DONKI's archive returns inconsistent shapes across 2017-2026. The runtime poller assumes recent-data-only (no archival), but if NASA changes the live endpoint schema, the runtime breaks while the backtest harness keeps working (because the harness has explicit per-era normalisers). | Either (a) port `detectEra`/`normalise` from `donki-fetch.js` into runtime, or (b) document the runtime's narrow-window-only assumption. **No fix in Sprint 6**: porting is wider-scope than input-validation hardening. The runtime fragility to schema drift is a known acceptable risk per PRD §10 R3. | deferred (Sprint 7+ or future cycle) |
| D-005 | medium | DONKI's free-tier `DEMO_KEY` ceiling is 30 req/hr (per NASA documentation). The runtime poller invokes `fetchFlares + fetchCMEs + fetchGeomagneticStorms` = 3 requests per poll. At a 5-min poll cadence, cumulative load = 36 polls/hr × 3 = 108 req/hr, **exceeding the DEMO_KEY ceiling.** The harness's `donki-fetch.js` has explicit throttling (`awaitThrottleSlot` line 62); the runtime does not. If `DEMO_KEY` is the active key, the runtime hits 429 sustained within the first hour. | Either (a) port `awaitThrottleSlot` from `donki-fetch.js` into runtime, or (b) require `NASA_API_KEY` (1000/hr) for production deployments and document `DEMO_KEY` as dev-only. **No fix in Sprint 6**: this is a runtime configuration concern, not an input-validation finding. The current `getApiKey()` (line 22) silently falls back to `DEMO_KEY` without warning. | deferred (Sprint 7+ or future cycle; documented as awareness item) |
| D-006 | low | Same as S-008: `response.json()` no per-response size cap. TLS-bound to `api.nasa.gov`; defensible. | Add `Content-Length` pre-check. | accepted residual |
| D-007 | low | `getEarthArrival` (line 199): `enlil.impactList.find((imp) => imp.location === 'Earth')`. If `impactList` contains a `null` or `undefined` element, the callback throws `TypeError: Cannot read properties of null (reading 'location')`. DONKI schema does not guarantee dense arrays. | Add `(imp) => imp != null && imp.location === 'Earth'` guard. | deferred (low likelihood per DONKI schema; per-feed try/catch isolates) |

---

### `scripts/corona-backtest/ingestors/corpus-loader.js`

| # | Severity | Finding | Recommendation | Status |
|---|----------|---------|----------------|--------|
| C-001 | low | `validateCommonEnvelope` (line 56): `if (event.tier && !['primary', 'secondary'].includes(event.tier))`. Truthy short-circuit allows `tier: null` to pass envelope validation. The COMMON_FIELDS check at line 51 verifies presence (`!('tier' in event)`), so `{tier: null}` passes presence but skips value validation. | Strengthen to `if (!['primary', 'secondary'].includes(event.tier))` (no truthy guard); since COMMON_FIELDS rejects missing-tier already. Defensible because the corpus tier is also encoded in the directory path (`corpus/primary/T<id>/`); the per-tier dispatch in `loadCorpus` does not consume `event.tier` for control flow. | deferred (defense-in-depth; current state defensible per directory-encoded tier) |
| C-002 | low | `deriveT4QualifyingEvents` (line 222): `[...observations].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())`. If `a.time` or `b.time` is malformed, `new Date(...).getTime()` returns `NaN`. `NaN - NaN === NaN`. JS sort with NaN comparator is engine-dependent — order is undefined. Subsequent filter at line 232 (`if (!Number.isFinite(t)) continue;`) catches the malformed time and skips the entry, so the final qualifying-event list is correct, but intermediate sort behavior is non-deterministic. | Filter `observations` to entries with valid `.time` BEFORE sort. | deferred (final output correctness preserved by line 232 filter) |
| C-003 | medium | Multiple per-theatre validators (`validateT1`-`validateT5`) check field PRESENCE but not ISO-8601 VALIDITY for timestamp strings: `event_time`, `flare_peak_time`, `flare_end_time`, `kp_window_start`, `kp_window_end`, `wsa_enlil_predicted_arrival_time`, `observed_l1_shock_time`, `detection_window_start`, `detection_window_end`, `trigger_flare_peak_time`, `actual_onset_time` (T5 stale_feed_events sub-objects), `detection_time` (same). A malformed timestamp like `"2024-13-45"` or `"yesterday"` passes the loader and reaches scoring, where `new Date(...).getTime()` returns `NaN`. T5 scoring at `t5-quality-of-behavior.js:174-176` does have a `Number.isFinite` guard that produces `latency_seconds: null` for invalid times — so the *final* T5 output is robust. T1/T2/T3/T4 scoring may not have the same defensive `isFinite` guards everywhere. | Add a corpus-loader-time ISO-8601 sanity check for declared timestamp fields (e.g., `Number.isFinite(new Date(field).getTime())`). **Partial fix in Sprint 6**: addressed for T5 stale_feed_events as part of C-006 carry-forward (LOW-1 fix). Other timestamp fields are outside the LOW-1 scope and are deferred to Sprint 7+ or future cycle. | partial — C-006 fixes T5 stale_feed_events sub-timestamps |
| C-004 | low | `goes_satellite` (and `goes_secondary_satellite`, `donki_record_ref`, `observed_l1_source`) are author-controlled strings with no allowlist. A typo like `"GOES16"` (no hyphen) vs `"GOES-16"` is silently accepted. Settlement decisions do not depend on the literal value beyond per-theatre eligibility — the strings are surface annotations only. | Add an allowlist enforcement at envelope time (e.g., `goes_satellite ∈ {GOES-16, GOES-17, GOES-18, GOES-15, GOES-14, GOES-13}`). Sprint 4 §5.5 evidence cites GOES-16 as the active primary; the allowlist is small and enumerable. | deferred (Sprint 7+ polish; current state defensible because settlement does not branch on satellite literal) |
| C-005 | low | `loadEventFile` line 345: `JSON.parse(readFileSync(file, 'utf8'))`. `readFileSync` reads the entire file into memory with no size cap. A multi-GB corpus event file would OOM the harness. Per `calibration-protocol.md` §3.5, the primary corpus is operator-HITL-gated; access to write to `corpus/primary/` requires explicit operator authorization. | Add a per-file size cap (e.g., 1 MB) before `readFileSync`. Defensible because corpus authorship is operator-gated and the 25-event primary corpus has small files (~5-50 KB each). | accepted residual (operator-gated corpus authorship) |
| C-006 | medium | **CARRY-FORWARD: Sprint 3 audit LOW-1.** T5 `stale_feed_events` array entries (per `calibration-protocol.md` §3.7.6 line 189: `{actual_onset_time: ISO-8601, detection_time: ISO-8601, end_time: ISO-8601, satellite: string}`) are not validated by the loader for the invariant `latency_seconds = detection_time - actual_onset_time >= 0`. A negative-latency entry (detection occurring before onset) would indicate a corpus-authoring error. Currently it silently passes the loader and is clamped at scoring (`scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183`: `Math.max(0, (detect - onset) / 1000)`). The clamp masks the corpus-authoring error. **Hard constraint #9 forbids changing scoring semantics**, so the fix path is corpus-loader tightening per handoff §6.5 option (A). | Add a sub-validation in `validateT5`: for each `stale_feed_events` entry where both `actual_onset_time` and `detection_time` are non-null + parseable ISO-8601, reject the event if `detection_time < actual_onset_time`. Tightens validation at the data-entry boundary; preserves scoring semantics; surfaces corpus-authoring errors that previously slipped through. | **fixed in Sprint 6** (`scripts/corona-backtest/ingestors/corpus-loader.js` validateT5 — see "Closed in Sprint 6" §) |
| C-007 | low | `event_id` is a free-form string with no validator-time check for path-injection-unsafe characters (`/`, `\`, `..`, null bytes, control chars). It flows into per-event report filenames at `scripts/corona-backtest/reporting/write-report.js:298`: `String(r.event_id ?? 'unknown').replace(/[^A-Za-z0-9._-]/g, '_')` — **already sanitized at the write boundary** via regex replacement. So the existing posture has defense-in-depth at the reporting layer, but the corpus-loader itself does not validate `event_id`. | Defense-in-depth: add an `event_id` regex check at envelope time (e.g., `/^[A-Za-z0-9._-]+$/`). Defensible because the downstream sanitization at write-report.js:298 prevents path-injection from reaching the filesystem; this is belt-and-suspenders. | deferred (existing downstream sanitization defensible per Sprint 3 audit) |
| C-008 | low | `resolveCorpusDir` (`scripts/corona-backtest/config.js:126-129`): `resolve(envValue \|\| process.env.CORONA_CORPUS_DIR \|\| CORPUS_DIR_DEFAULT)`. Uses `node:path.resolve` directly without anchoring to `REPO_ROOT`. An operator who sets `CORONA_CORPUS_DIR=/etc` would have `readdirSync('/etc')` invoked. The loader rejects events that don't match the corpus schema, so the failure mode is graceful (errors[] populated, no events loaded), but the syscall is performed. | Anchor to `REPO_ROOT` like `resolveOutputDir` does (line 122-123: `resolve(CALIBRATION_DIR, requested)`). Defensible because the env var is operator-controlled per harness invocation; per PRD §9.2 the harness is operator-trust-bounded. | accepted residual (operator-trust boundary per PRD §9.2; Sprint 3 audit Focus Area 2 verified path-construction safe) |

---

### Carry-forward findings (`src/theatres/proton-cascade.js`, `scripts/corona-backtest/scoring/t5-quality-of-behavior.js`)

| # | Severity | Finding | Recommendation | Status |
|---|----------|---------|----------------|--------|
| PEX-1 | low | **CARRY-FORWARD: Sprint 2 audit.** `src/theatres/proton-cascade.js:266` and `:284` access `payload.event_type` directly without optional chaining. If `bundle.payload` is `undefined` (e.g., a malformed bundle from `src/processor/bundles.js`), the access throws `TypeError: Cannot read properties of undefined (reading 'event_type')`. The Sprint 2 audit identified this as Sprint 6 territory; the handoff §6.4 recommends option (A) defensive fix. | Change `payload.event_type` → `payload?.event_type` at lines 266 and 284. Two-character patch; preserves all existing semantics; gracefully handles undefined `bundle.payload` by routing through the line 284 branch (`undefined !== 'proton_flux'` → returns updated theatre). | **fixed in Sprint 6** (see "Closed in Sprint 6" §) |
| LOW-1 | low | See **C-006**. Mapped to corpus-loader as the fix path per hard constraint #9 (no scoring-semantics changes). | See **C-006**. | **fixed in Sprint 6** (via C-006) |

---

## Critical findings (block Sprint 7?)

**None.** Zero critical findings identified across the three parsers + two carry-forward sites. Per SDD §8.4 and sprint.md GC.7-GC.8, Sprint 7 is unblocked from a security perspective.

---

## Closed in Sprint 6

Two narrow defensive patches landed in Sprint 6 per the handoff §6.4 + §6.5 recommended postures (option A in both cases). Neither patch changes scoring semantics, settlement authority, corpus eligibility, or the calibration manifest. Both patches are < 20 LoC each.

### Fix 1 — PEX-1 (Sprint 2 carry-forward) — defensive optional chaining at `proton-cascade.js:266, 284`

**File**: `src/theatres/proton-cascade.js`
**Lines changed**: 266, 284 (two single-character additions: `payload.event_type` → `payload?.event_type`)
**Test**: `tests/security/proton-cascade-pex1-test.js` (new file) — exercises `processProtonEventCascade` with `{bundle_id, payload: undefined}` and verifies no throw + theatre advancement; also covers `{payload: null}` and `{}` (no payload key) for completeness.
**Why narrow**: optional chaining is a single-character syntactic addition; the runtime semantics are preserved for the well-formed-payload happy path; the malformed-payload case routes through the line 284 fallthrough (`undefined !== 'proton_flux'` → return updated theatre, identical to the prior behavior for non-proton-flux bundle types per the comment at lines 285-288).

### Fix 2 — C-006 / LOW-1 (Sprint 3 carry-forward) — corpus-loader negative-latency rejection in T5 stale_feed_events

**File**: `scripts/corona-backtest/ingestors/corpus-loader.js`
**Function**: `validateT5(event, file)` — added a sub-validation block over `stale_feed_events` entries to reject events with negative-latency entries (detection_time < actual_onset_time when both fields are non-null + parseable ISO-8601).
**Test**: `tests/security/corpus-loader-low1-test.js` (new file) — exercises `validateT5` with synthetic T5 events containing (a) zero-latency stale entry (accepted), (b) positive-latency stale entry (accepted), (c) negative-latency stale entry (rejected with explicit error message), (d) null-onset / null-detection (accepted, validation skipped per "both fields non-null" guard), (e) malformed-ISO timestamp (accepted at this level, deferred to scoring per existing `isFinite` guard at `t5-quality-of-behavior.js:174-176`).
**Why narrow**: the patch tightens an existing per-event validator with a single new error path; does NOT touch the scoring layer (`t5-quality-of-behavior.js` unchanged, preserving operator hard constraint #9); does NOT alter T5 corpus-eligibility schema (`calibration-protocol.md` §3.7.6 — the schema requires the fields, the new check enforces the implicit invariant `latency >= 0`); does NOT touch `calibration-manifest.json` (no new constants introduced).

### Verification — what is unchanged

The Sprint 6 patches deliberately do NOT touch:

- `scripts/corona-backtest/scoring/*.js` — operator hard constraint #9. `git diff scripts/corona-backtest/scoring/` is empty.
- `grimoires/loa/calibration/corona/calibration-manifest.json` — Sprint 5 source of truth. `git diff` is empty.
- `grimoires/loa/calibration/corona/calibration-protocol.md`, `theatre-authority.md`, `empirical-evidence.md` — frozen artifacts. `git diff` is empty.
- `grimoires/loa/calibration/corona/run-1/`, `run-2/` — baseline + Run 2 certificates. `git diff` is empty.
- `grimoires/loa/calibration/corona/corpus/` — Sprint 3 frozen corpus. Existing primary corpus events all pass the new C-006 validation (verified by full backtest run + 144+N test pass).
- `package.json` — zero-runtime-dependency invariant. `git diff` is empty.
- `construct.yaml`, `BUTTERFREEZONE.md`, `spec/*` — Sprint 7 publish-readiness territory.
- `.claude/` — System Zone, never edit.

---

## Deferred / accepted-residual catalogue

For ease of Sprint 7 / future-cycle planning, the non-fixed findings are catalogued by disposition:

### Deferred (Sprint 7+ or future cycle)
- **S-002, S-003, S-004, S-005** — SWPC parser robustness against schema drift (timezone consistency, NaN filter strengthening, parseFloat bound checks). Wider-scope refactor than Sprint 6's narrow-fix mandate.
- **S-007** — GOES eclipse-season gap detection. Feature addition, not input-validation hardening.
- **D-001, D-002, D-003, D-007** — DONKI parser null-guards on schema drift (parseSourceLocation, getBestCMEAnalysis, getEarthArrival, impactList null-element guard). Defensive depth desirable but not required by SDD §8 narrow-fix scope.
- **D-004** — DONKI runtime era-aware normalization. Wider-scope architectural amendment.
- **D-005** — DONKI rate-limit awareness in runtime. Configuration concern, not input-validation.
- **C-001, C-002, C-004, C-007** — corpus-loader robustness improvements. Defense-in-depth, current state defensible per existing downstream sanitization or directory-encoded conventions.
- **C-003** — corpus-loader ISO-8601 timestamp validation for non-T5-stale-feed timestamp fields. Partial fix in Sprint 6 (T5 stale_feed_events covered via C-006); other fields deferred.

### Accepted residual (no fix planned)
- **S-001, S-006, S-008** — SWPC error-envelope detail, 429 backoff, response-size cap. Defensible per PRD §9.2 read-only HTTP, zero auth, TLS-bound posture.
- **D-006** — DONKI response-size cap. Same rationale as S-008.
- **C-005** — corpus-loader per-file size cap. Defensible per `calibration-protocol.md` §3.5 operator-HITL-gated corpus authorship.
- **C-008** — `resolveCorpusDir` REPO_ROOT anchoring. Defensible per PRD §9.2 operator-trust boundary; verified safe in Sprint 3 audit Focus Area 2.

---

## SDD §8.2 checklist coverage

Each row from the SDD §8.2 13-row checklist mapped to one or more findings (or `clean` if no finding surfaced for that parser at that row):

| Check | SWPC | DONKI | Corpus loader |
|-------|------|-------|---------------|
| Malformed JSON handling | clean (per-feed try/catch wraps `response.json()` SyntaxError; line 314+) | clean (per-feed try/catch lines 271, 314, 352) | clean (`loadEventFile` JSON.parse try/catch line 344-348) |
| Null/undefined field handling | S-002, S-003 | D-002, D-003, D-007 | C-001 |
| Type coercion | S-003, S-005 | D-001 | C-002 |
| Numeric overflow | S-005 | clean (DONKI returns physically-bounded values) | N/A (corpus integers, bounded buckets) |
| Date parsing edge cases | S-004 | D-003 | C-003 (partial fix via C-006) |
| Rate-limit / 429 handling | S-006 | D-005 | N/A (local file) |
| Partial response handling | clean (try/catch wraps fetch + json) | clean (same) | clean (truncated file → JSON.parse throws → rejected) |
| Schema drift detection | N/A (SWPC schema stable) | D-004 | N/A |
| Eclipse-season GOES gap handling | S-007 | N/A | N/A |
| Satellite-switch (GOES primary→secondary) robustness | clean (parser is satellite-passthrough; downstream `quality.js` SOURCE_RELIABILITY handles) | N/A | C-004 |
| File-system path traversal | N/A | N/A | C-008 (also: write-boundary sanitization at `write-report.js:298` per Sprint 3 audit) |
| Infinite loop / unbounded recursion in normalisation | clean (all bounded forEach/for-of, no recursion) | clean (same) | clean (T4_TEN_MEV_REGEX `/(?:^|\D)10\s*MeV\b/i` is single-pass anchored, no nested quantifiers, no ReDoS) |
| Memory-bomb resistance (single huge response/file) | S-008 | D-006 | C-005 |

**Coverage**: every applicable cell either has a finding (severity-classified per SDD §8.4) or is `clean` with rationale, or is `N/A` per the SDD §8.2 N/A markers. No cell unaddressed.

---

## Sprint 6 acceptance criteria mapping

Per `grimoires/loa/sprint.md:432-441`:

| GC | Criterion | Verification |
|----|-----------|--------------|
| **GC.6** | `security-review.md` authored per SDD §8.3 template | This document. Three per-parser tables (S-NNN, D-NNN, C-NNN) + Critical-findings § + Closed-in-Sprint-6 §. |
| **GC.7** | All findings classified by severity per SDD §8.4 | 25 findings, all classified: 0 critical / 0 high / 9 medium / 16 low. |
| **GC.8** | CRITICAL findings fixed inline (block Sprint 7) | 0 critical findings. Trivially satisfied. |
| **GC.9** | Non-critical findings documented + deferred or fixed at discretion | 2 findings fixed in Sprint 6 (PEX-1, C-006/LOW-1 carry-forwards per handoff §6.4 + §6.5 option A). 23 findings documented with explicit `deferred` or `accepted residual` status. |

---

## Sprint 7 entry posture

From a Sprint 6 security perspective, Sprint 7 is unblocked. The post-Sprint-6 codebase has:

1. Zero critical input-validation findings (the SDD §8.4 blocker class is empty).
2. PEX-1 closed (Sprint 2 carry-forward — defensive optional chaining at proton-cascade.js).
3. LOW-1 / C-006 closed (Sprint 3 carry-forward — corpus-loader negative-latency rejection in T5 stale_feed_events).
4. 23 non-critical findings catalogued with severity, rationale, and disposition (deferred / accepted residual). Sprint 7 may pick up Sprint 7+ deferred items at operator discretion.

The two carry-forward fixes preserve all Sprint 0-5 invariants:
- corpus_hash invariant `b1caef3...` unchanged (fix is loader validation, not corpus mutation).
- script_hash invariant `17f6380b...` unchanged for scoring modules (fix touches loader only).
- All 144 baseline tests pass; new tests for the two fixes pass.
- `calibration-manifest.json` unchanged — no new constants introduced.
- `package.json` unchanged — zero-runtime-dependency invariant preserved.

---

*Sprint 6 lightweight input-validation review authored 2026-05-01 per SDD §8 implementation. Walked the three parsers through SDD §8.2 13-row checklist, classified findings per SDD §8.4 severity ladder, applied the two narrow defensive patches per handoff §6.4 + §6.5 recommended postures (option A in both cases), and catalogued the remaining 23 findings as deferred or accepted residual. Zero critical findings — Sprint 7 unblocked.*
