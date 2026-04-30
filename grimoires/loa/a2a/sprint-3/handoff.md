# Sprint 3 (and conditional Sprint 4) Handoff Packet — CORONA cycle-001-corona-v3-calibration

**Status**: READY FOR FRESH-SESSION KICKOFF
**Authored**: 2026-04-30 (Sprint 2 close, post-commit)
**Sprint type**: IMPLEMENTATION — backtest harness + Run 1 baseline (Sprint 3); literature/evidence doc (Sprint 4)
**Scope size**: Sprint 3 LARGE (8 tasks); Sprint 4 SMALL (3 tasks)
**Operator HITL constraint**: Operator may run Sprint 3 then *conditionally* Sprint 4 in the same fresh session if context/usage permits. **Hard rule**: maintain separate sprint gates, reviews, audits, commits. **Stop after Sprint 3 implementation; do NOT start Sprint 4 without explicit operator approval.**

---

## 1. Current repo / branch / commit state

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD commit | `33e9133` — `feat(corona): cycle-001 sprint-2 — frozen calibration protocol + T4 proxy retirement` |
| Upstream | `origin/main` — up to date |
| Working tree | Clean |
| Recent cycle-001 commits | `b424da7` Sprint 0 → `2c75ecb` Sprint 1 → `33e9133` Sprint 2 |

### Quality gates at handoff

```bash
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
node --test tests/corona_test.js                        # tests 70 / pass 70 / fail 0
git status                                              # clean
git log --oneline -5                                    # 33e9133 at HEAD
```

### Sprint 0 / 1 / 2 close states (preserved)

- **Sprint 0** (`b424da7`): v3 readiness, theatre authority map, T4 S-scale scaffold, identity/CORONA.md, compose_with[tremor], commands, pack_dependencies, local validator. Reviewed + audited + pushed.
- **Sprint 1** (`2c75ecb`): composition_paths declared, calibration directory scaffolded with placeholders. Reviewed + audited + pushed.
- **Sprint 2** (`33e9133`): frozen calibration protocol + T4 flare-class proxy retirement. Reviewed (Round 1 CHANGES_REQUIRED → Round 2 APPROVED) + audited + pushed.

### Sprint 2 deliverables locked at HEAD

- `grimoires/loa/calibration/corona/calibration-protocol.md` — 523 lines, FROZEN per §10 acknowledgment.
- `grimoires/loa/calibration/corona/theatre-authority.md` — Sprint 0; settlement authority of record (preserved).
- `grimoires/loa/calibration/corona/empirical-evidence.md` — Sprint 1 placeholder (Sprint 4 deliverable).
- `grimoires/loa/calibration/corona/calibration-manifest.json` — Sprint 1 placeholder `[]` (Sprint 5 deliverable).
- `grimoires/loa/calibration/corona/corpus/README.md` — Sprint 1 corpus directory layout + freeze policy.
- `src/theatres/proton-cascade.js` — Sprint 2 refactor: `S_SCALE_THRESHOLDS_PFU`, direct proton-flux qualifying logic, 30-min SEP onset dedup window, strict ≥10 MeV channel regex.
- `tests/corona_test.js` — 70 tests (60 baseline + 5 updated proton-cascade behavior + 6 new S-scale binding regression).

---

## 2. Sprint 3 objective + owner tasks

### Sprint 3 objective

Build the backtest harness (`scripts/corona-backtest.js` + `scripts/corona-backtest/` sub-modules) per SDD §6 and the frozen Sprint 2 calibration protocol §3 (corpus eligibility) + §3.7 (corpus annotation schema) + §4 (per-theatre scoring). Execute Run 1 baseline against the primary corpus → emit certificates at `grimoires/loa/calibration/corona/run-1/`.

**Sprint 3 epic**: `corona-d4u` (currently OPEN).

### Sprint 3 owner tasks (8 tasks; LARGE scope)

| Beads ID | Task | Owner deliverable |
|----------|------|--------------------|
| `corona-v9m` (P0) | sprint-3-donki-sanity-sample | 5-event sanity-sample harness spanning 2017-2026; **MUST PASS** before full ingestor build (R3 mitigation) |
| `corona-2jq` | sprint-3-era-aware-ingestors | SWPC + DONKI + GFZ ingestor modules under `scripts/corona-backtest/ingestors/` |
| `corona-1ks` | sprint-3-corpus-loader-validate | `corpus-loader.js` with schema validation per protocol §3.7 (rejects malformed/incomplete corpus events at load time) |
| `corona-2iu` | sprint-3-t1-t2-t4-bucket-brier-scoring | Separate `t1-bucket-brier.js`, `t2-bucket-brier.js`, `t4-bucket-brier.js` modules — **NO shared scoring code paths** (operator hard constraint #5) |
| `corona-70s` | sprint-3-t3-timing-error-scoring | `t3-timing-error.js` — MAE primary, within-±6h hit rate secondary, ±12h glancing-blow widening, z-score diagnostic |
| `corona-aqh` | sprint-3-t5-quality-of-behavior-scoring | `t5-quality-of-behavior.js` — FP rate (60-min corroboration window), stale-feed p50/p95 latency, satellite-switch handled-rate |
| `corona-2ox` | sprint-3-reporting-and-hashing | `write-report.js`, `write-summary.js`, `hash-utils.js` (corpus_hash + script_hash via `node:crypto`) |
| `corona-2b5` | sprint-3-commit-corpus-and-run1 | Commit primary corpus (~15-25 events per theatre) + execute Run 1 → `run-1/` certificates |

**Recommended task ordering**:
1. `corona-v9m` first (P0; sanity sample BEFORE full ingestor — R3 mitigation per SDD §6.3).
2. After sanity passes 5/5: `corona-2jq` + `corona-1ks` in parallel.
3. After ingestors+loader pass: `corona-2iu`, `corona-70s`, `corona-aqh` in parallel (each scoring module is independent per operator hard constraint #5).
4. `corona-2ox` (reporting + hashing) next — needed by `corona-2b5` for `corpus_hash.txt` + `script_hash.txt` outputs.
5. `corona-2b5` last — corpus commit + Run 1 execution → `run-1/` certificates.

### Sprint 3 acceptance criteria (from sprint.md:285-291)

- **GC.2**: Backtest harness runs against full primary corpus
- Sanity-sample passes 5/5 events before full ingestor
- No shared code paths across heterogeneous scoring modules (operator hard constraint #5)
- `corpus_hash.txt` and `script_hash.txt` written per run
- Per-theatre reports generated at `run-1/T<id>-report.md`
- **ZERO new runtime deps** (`scripts/corona-backtest.js` uses only `node:fs`, `node:path`, `node:url`, native `fetch`, `crypto.createHash`)

### Sprint 3 dependencies

- **Sprint 2 frozen protocol** at `grimoires/loa/calibration/corona/calibration-protocol.md` — Sprint 3 implements against §3 / §3.7 / §4 / §5 / §6 verbatim. **Do NOT invent new scoring semantics.** If protocol ambiguity is found, halt and surface to operator (per Sprint 3 hard constraint, §6 below).
- **Sprint 2 code refactor** at `src/theatres/proton-cascade.js` — `BUCKETS`, `S_SCALE_THRESHOLDS_PFU`, `SEP_DEDUP_WINDOW_MINUTES` are exported and may be imported by `t4-bucket-brier.js` for shared bucket-boundary references (NOT shared scoring code; bucket-boundary constants are facts).

---

## 3. Sprint 4 objective + owner tasks (conditional / not-this-session by default)

### Sprint 4 objective

Compile literature-derived priors and engineering-estimated promotion paths into `grimoires/loa/calibration/corona/empirical-evidence.md` covering all non-backtestable parameters identified by the Sprint 3 baseline. Pattern source: BREATH's literature-research recipe (`C:\Users\0x007\breath\grimoires\loa\empirical-validation-research.md`, read-only reference).

**Sprint 4 epic**: `corona-uqt` (currently OPEN).

### Sprint 4 owner tasks (3 tasks; SMALL scope)

| Beads ID | Task | Owner deliverable |
|----------|------|--------------------|
| `corona-2zs` | sprint-4-research-non-backtestable-priors | Compile literature evidence per PRD §5.5 coverage targets: WSA-Enlil sigma (T3), doubt-price floors (T1, T2), Wheatland prior (T4), Bz volatility threshold (T5), source-reliability scores, uncertainty pricing constants |
| `corona-1ve` | sprint-4-document-engineering-estimated-promotion-paths | Document `promotion_path` per settlement-critical engineering-estimated parameter (PRD §8.5) |
| `corona-36t` | sprint-4-author-empirical-evidence-md | Compile findings into `grimoires/loa/calibration/corona/empirical-evidence.md` |

### Sprint 4 acceptance criteria (from sprint.md:341)

- **GC.3**: `empirical-evidence.md` covers all non-backtestable priors
- All PRD §5.5 coverage targets addressed
- Citations are primary literature where possible
- Settlement-critical engineering-estimated parameters all have `promotion_path`s

### Sprint 4 dependencies

- **Sprint 3 baseline** (Run 1 certificates) — identifies which parameters are backtest-tunable vs need literature.
- **Sprint 2 protocol §8** — already names the Sprint 4 deferral list explicitly.

### When Sprint 4 may run in the same session

- **Default**: Sprint 4 does NOT auto-start after Sprint 3. The session stops after Sprint 3 review + audit + commit; operator decides whether to continue.
- **If operator explicitly approves continuation in the same session**: Sprint 4 starts with `/implement sprint-4` AFTER Sprint 3 has fully closed (review APPROVED + audit APPROVED + commit pushed).
- **Hard rule**: separate sprint gates. Sprint 3's review/audit/commit is its own cycle; Sprint 4's is a different cycle. Do NOT bundle them.

---

## 4. Required reading order for the fresh agent

The fresh-session agent has zero context. Read in this order; STOP when context budget runs low and synthesize to `grimoires/loa/NOTES.md` per the Tool Result Clearing Protocol.

| # | File | Lines | Why |
|---|------|-------|-----|
| 1 | **This file** — `grimoires/loa/a2a/sprint-3/handoff.md` | ~250 | Primer; covers everything below in summary form |
| 2 | `grimoires/loa/calibration/corona/calibration-protocol.md` | 523 | **The frozen Sprint 2 contract Sprint 3 implements against.** §3 (corpus eligibility) + §3.7 (corpus annotation schema) + §4 (per-theatre scoring rules with result shapes) + §6 (pass/marginal/fail thresholds) |
| 3 | `grimoires/loa/calibration/corona/theatre-authority.md` | 79 | Settlement authority of record; sanity-check that Sprint 3 corpus + scoring respect this. **DO NOT modify this file.** |
| 4 | `grimoires/loa/sdd.md` | 1194 | §5 (calibration subsystem layout), §6 (backtest harness architecture — Sprint 3's blueprint), §7 (manifest regression gate — Sprint 5 owner; Sprint 3 must be compatible), §11 (testing strategy) |
| 5 | `grimoires/loa/sprint.md` | 791 | Sprint 3 section (lines 265-321), Sprint 4 section (lines 323-362), risks, dependencies |
| 6 | `grimoires/loa/prd.md` | 500 | §5.4-5.5 (Sprint 3+4 scope), §6 (theatre authority), §8.3 (corpus tiers), §10 R3+R4 (DONKI shape variance + rate limit), §11 (open decisions, all resolved by Sprint 2) |
| 7 | `src/theatres/proton-cascade.js` | 436 | Sprint 2 refactor reference: `BUCKETS`, `S_SCALE_THRESHOLDS_PFU`, `SEP_DEDUP_WINDOW_MINUTES` exports |
| 8 | `tests/corona_test.js` (proton-cascade section + S-scale binding suite) | 822 | Reference for how Sprint 2 tests the binding; Sprint 3 scoring tests should mirror the rigor |
| 9 | `grimoires/loa/calibration/corona/corpus/README.md` | 70 | Corpus directory layout + per-theatre acquisition notes |
| 10 | `grimoires/loa/a2a/sprint-2/{reviewer.md, engineer-feedback.md, auditor-sprint-feedback.md, COMPLETED}` | varies | Sprint 2 final state for context; engineer-feedback.md §11 has Round 2 evidence walk |
| 11 | `grimoires/loa/a2a/sprint-1/auditor-sprint-feedback.md` | — | Sprint 1 carry-forwards (most resolved by Sprint 2) |
| 12 | `grimoires/loa/calibration/corona/sprint-0-notes.md` | — | Validator source documentation, T4 cleanup history (corona-222), TREMOR compose_with reciprocity inspection (corona-1g6) |

### Read-only reference patterns (do NOT mutate)

- **TREMOR**: `C:\Users\0x007\tremor` (read-only).
  - `scripts/omori-backtest.js` (~1100 lines): backtest harness pattern. **Reference only.** CORONA splits into a sub-folder per SDD §6.1 (operator hard constraint #5: heterogeneous scoring code paths must NOT be shared).
  - `grimoires/loa/calibration/omori-backtest-protocol.md`: frozen-protocol pattern source.
  - `grimoires/loa/calibration/omori-backtest/run-1..6/`: per-run certificate pattern.
- **BREATH**: `C:\Users\0x007\breath` (read-only).
  - `grimoires/loa/empirical-validation-research.md` (531 lines, 62 citations): literature-research pattern source for **Sprint 4** (not Sprint 3).

---

## 5. Files that define the frozen protocol

These files together constitute the binding contract Sprint 3 implements against. **Do NOT modify any of these without operator authorization.**

| File | Role | Modification posture |
|------|------|----------------------|
| `grimoires/loa/calibration/corona/calibration-protocol.md` | Frozen Sprint 2 protocol; corpus rules, scoring contracts, thresholds, regression policy | **READ-ONLY for Sprint 3.** If ambiguity is found, halt and surface (per §6 hard constraint). |
| `grimoires/loa/calibration/corona/theatre-authority.md` | Settlement authority of record (Sprint 0 deliverable) | **READ-ONLY for Sprint 3.** Cross-reference for corpus eligibility checks. |
| `grimoires/loa/prd.md` | Product requirements + open-decisions tracker (all decisions resolved by Sprint 2) | **READ-ONLY for Sprint 3.** Reference for risks (R3 DONKI shape variance, R4 rate limit, R5 GFZ lag) and engineering-estimated parameter policy (§8.5). |
| `grimoires/loa/sdd.md` | System design — calibration subsystem (§5), backtest harness architecture (§6), regression gate spec (§7), testing strategy (§11) | **READ-ONLY for Sprint 3** unless a Sprint 3 implementation requires an SDD update for downstream sprints. If the SDD needs amending, surface to operator first. |
| `grimoires/loa/sprint.md` | Sprint plan with acceptance criteria | **READ-ONLY for Sprint 3 reference.** Sprint 3 may CHECK boxes (`[x]`) on completed deliverables/ACs/tasks at sprint close per Sprint 0 / Sprint 1 / Sprint 2 precedent. |
| `src/theatres/proton-cascade.js` | T4 runtime theatre + Sprint 2 exports (`BUCKETS`, `S_SCALE_THRESHOLDS_PFU`, `SEP_DEDUP_WINDOW_MINUTES`) | **READ-ONLY for Sprint 3.** Sprint 3 imports the constants (not the qualifying logic). Sprint 5 / `corona-3ja` owns any T4 runtime parameter changes. |
| `tests/corona_test.js` | 70 tests covering all 5 theatres + RLMF certificate export | **MAY add new tests** for backtest-harness modules in Sprint 3 (e.g., `corpus-loader.js` schema validation, hash-utils correctness). **Do NOT modify existing tests** unless a Sprint 3 implementation requires a fixture update. |

---

## 6. Sprint 3 hard constraints

These are operator-locked and binding throughout Sprint 3 execution.

1. **Build the backtest harness only.** `scripts/corona-backtest.js` + `scripts/corona-backtest/` sub-folder per SDD §6.1.
2. **No parameter refits.** Refit is Sprint 5's exclusive scope. If Sprint 3 baseline reveals that a parameter is mistuned, document the finding in the per-theatre `run-1/T<id>-report.md` "Notes" section — do NOT change the parameter inline.
3. **No Sprint 5 manifest regression gate work.** Sprint 5 / `corona-3o4` (manifest_structural_test) and `corona-15v` (manifest_regression_gate) are out of Sprint 3 scope.
4. **No new dependencies.** `package.json:32 "dependencies": {}` is invariant. Sprint 3 may use ONLY: `node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch` (Node 20+), `node:test` (existing test runner).
5. **Preserve zero-dep posture.** No `devDependencies` either. All testing via the built-in `node --test` runner.
6. **Use frozen Sprint 2 protocol; do not invent new scoring semantics.** Sprint 3 implements §3 / §3.7 / §4 / §5 / §6 of `calibration-protocol.md` verbatim. Result shapes from §4.x are typed contracts; Sprint 3 modules MUST emit them as specified.
7. **If protocol ambiguity is found, stop and surface it instead of guessing.** Examples of ambiguity that should halt: a corpus annotation field mentioned in §3.7 but not described concretely; a §4.x metric formula that's underspecified for an edge case; a settlement-authority cross-reference that conflicts with `theatre-authority.md`. Halt → surface to operator → wait for Sprint 2 amendment OR explicit operator instruction.
8. **Operator hard constraint #5 (preserved across sprints)**: per-theatre scoring code paths MUST NOT be shared. Each `scoring/t<id>-*.js` module owns its own Brier formula, bucket boundaries, threshold checks. Shared utilities allowed only for I/O (`write-report.js`, `hash-utils.js`, `corpus-loader.js`) and HTTP fetch helpers used by ingestors.
9. **DONKI rate limit (R4)**: use `NASA_API_KEY` from env; fall back to `DEMO_KEY` with console warning; throttle at 900/hr (per SDD §6.6). Local cache at `scripts/corona-backtest/cache/` to avoid re-fetching during development.
10. **DONKI shape variance (R3)**: era-aware ingestor MUST handle 2017-2026 shape variants. Sanity-sample (`corona-v9m`) MUST PASS 5/5 BEFORE full ingestor build proceeds — non-negotiable per SDD §6.3.

---

## 7. Sprint 4 hard constraints

These apply ONLY if operator explicitly approves Sprint 4 in the same session after Sprint 3 closes.

1. **Literature/evidence doc only.** Sprint 4's deliverable is `grimoires/loa/calibration/corona/empirical-evidence.md` per PRD §5.5 + §8.5.
2. **No parameter refits.** Sprint 5's scope. Sprint 4 documents priors + promotion paths; Sprint 5 applies them.
3. **No code changes unless explicitly required for citation/path correction.** Sprint 4 is primarily a markdown deliverable. If a manifest-entry shape needs a tiny fix in `src/processor/uncertainty.js` to align with literature pricing, surface first; do NOT inline-edit speculatively.
4. **Distinguish literature-derived vs engineering-estimated priors.** Per PRD §7 manifest schema: `derivation: literature_derived` requires a primary-literature citation (DOI, PMC ID, or stable URL); `derivation: engineering_estimated` requires a `provisional: true` flag AND (if settlement-critical) a documented `promotion_path` field.
5. **No new dependencies.** Same zero-dep invariant as Sprint 3.
6. **Pattern source**: BREATH's `grimoires/loa/empirical-validation-research.md` (read-only). Mirror citation rigor; do NOT copy content wholesale.
7. **Coverage targets** (per PRD §5.5): WSA-Enlil sigma (T3 — Mays et al. 2015, Riley et al. 2018), doubt-price floors (T1, T2), Wheatland prior (T4 — Wheatland 2001 + subsequent updates), Bz volatility threshold (T5), source-reliability scores (GOES primary/secondary, DSCOVR↔ACE), uncertainty pricing constants (Normal-CDF threshold-crossing model).

---

## 8. Known carry-forward concerns

These are documented but NOT blocking for Sprint 3. The fresh-session agent should acknowledge them and not duplicate effort on items owned by other sprints.

| ID | Source | Concern | Owner |
|----|--------|---------|-------|
| **LOW-1** | Sprint 2 audit (`auditor-sprint-feedback.md` §LOW-1) | Secondary-corpus T3 null-forecast scoring posture not explicitly forbidden. §3.3 #3 makes secondary advisory-only; §3.5 promotion path requires non-null retroactively. Operationally closed; documentation could be tighter. | Sprint 7 polish or future cycle |
| **PEX-1** | Sprint 2 audit (`auditor-sprint-feedback.md` §PEX-1) | Pre-existing `payload.event_type` direct property access in `processProtonEventCascade` (proton-cascade.js:266, 284) without optional chaining. Throws TypeError if `bundle.payload` is undefined. Inherited from earlier sprints. | Sprint 6 / `corona-r4y` (input-validation review) — NATURAL OWNER. Sprint 3 should NOT fix this. |
| **C6** (Round 2 review residue) | `engineer-feedback.md` Adversarial Analysis (Round 2) | §3.7 "derived at corpus-load time" fields don't name the owning Sprint 3 module. Sprint 3 / `corona-1ks` is the natural owner — Sprint 3 should claim this implicitly by implementing the corpus-loader with derivation logic. | **Sprint 3 / `corona-1ks`** — claim by implementing |
| **C7** (Round 2 review residue) | `engineer-feedback.md` Adversarial Analysis (Round 2) | §3.7.4 T3 `wsa_enlil_sigma_hours: null` fallback creates Sprint 3 → Sprint 4 sequencing dependency for `z_score`. Sprint 3 may compute `z_score = NaN` for null-sigma events OR use a placeholder constant (e.g., 14h midpoint of BFZ's 10-18h range) — the protocol accepts either since §4.3.3 declares z_score is supplementary diagnostic only (not in pass/marginal/fail composite). Document the choice in `run-1/T3-report.md` and the corpus loader. | Sprint 3 / `corona-70s` — pick + document |
| **C8** (Round 2 review residue) | `engineer-feedback.md` Adversarial Analysis (Round 2) | `glancing_blow_within_12h_hit_rate: number \| null` semantics implied not stated. `null` means "no glancing-blow events in scored corpus", not "0%". Document in `run-1/T3-report.md` per-event table. | Sprint 3 / `corona-70s` — document |
| Sprint 0 carry-forwards (review C6, C7; audit LOW-1, LOW-2; D6) | Sprint 0 reviewer + auditor docs | Publish-readiness: commands.path JS-file vs upstream `commands/*.md`, L2 publish gates, schemas/CHECKSUMS.txt, tempfile EXIT trap, ajv-formats install | Sprint 7 / `corona-1ml` (publish-readiness epic) |
| Sprint 1 review C5 | `grimoires/loa/a2a/sprint-1/engineer-feedback.md` | `composition_paths.reads: []` registry compatibility (verify against construct-network indexer) | Sprint 7 / `corona-32r` |

**Net effect on Sprint 3**: only C6, C7, C8 are claimed by Sprint 3 tasks (corona-1ks for C6, corona-70s for C7+C8). Everything else is downstream-sprint-owned and Sprint 3 should leave alone.

---

## 9. Suggested Sprint 3 review focus areas

When Sprint 3 implementation completes and `/review-sprint sprint-3` runs, the senior reviewer should focus attention on:

1. **DONKI sanity-sample (`corona-v9m`)**: did the 5-event spread (2017-2026) actually pass with no shape mismatch? Check `corona-v9m`'s sanity output. R3 mitigation is the most failure-prone step in Sprint 3.

2. **Corpus-loader safety (`corona-1ks`)**: does the loader reject malformed corpus events at load time per §3.7 schema? Specifically: T3 events with null `wsa_enlil_predicted_arrival_time` rejected per §3.2 #2 T3 (Round 2 fix). T5 events without the four required arrays (`divergence_signals`, `corroborating_alerts`, `stale_feed_events`, `satellite_switch_events`) rejected. Empty arrays explicitly permitted per §3.7.6.

3. **Exact ≥10 MeV channel handling in T4 (`corona-2iu`'s t4-bucket-brier.js)**: does the harness use the same strict regex `/(?:^|\D)10\s*MeV\b/i` as `src/theatres/proton-cascade.js:298`? OR does it import the constant directly from the runtime module? Substring collision with `≥100 MeV` MUST NOT recur in the harness.

4. **T3/T4/T5 scoring module independence (`corona-2iu`, `corona-70s`, `corona-aqh`)**: operator hard constraint #5 — no shared scoring code. Reviewer should confirm each module has its own Brier formula, no shared "compute_brier()" helper, no shared bucket-boundary definition (each module imports from its own runtime theatre OR copies). Bucket-Brier code may LOOK similar across T1/T2/T4 — that's expected; duplication is the lesser evil per SDD §6.4.

5. **No hidden filtering in scoring layer**: does `t3-timing-error.js` assume corpus-loader-validate has already screened out null-forecast events (per protocol §4.3.5 "no scoring-layer filtering")? Sprint 3's t3 module should NOT have its own null-handling branch — the loader's job is to ensure all loaded events are scoring-eligible. If Sprint 3's t3 module re-implements null filtering, that's a regression of the Round 2 fix.

6. **No settlement-authority ambiguity introduced**: Sprint 3 ingestors fetch from SWPC, DONKI, GFZ. The reviewer should confirm settlement assignment per `theatre-authority.md`: T1 settles on GOES X-ray (NOT DONKI), T2 settles on SWPC live + GFZ regression (NOT DONKI), T3 settles on observed L1 shock (NOT WSA-Enlil prediction), T4 settles on GOES integral proton (NOT DONKI), T5 self-resolves. Sprint 3 should NOT introduce a new oracle as settlement source.

7. **Zero-dep invariant**: `git diff package.json` post-Sprint-3 MUST show no change. The reviewer should explicitly verify.

8. **Run 1 baseline reasonableness**: per-theatre `run-1/T<id>-report.md` should produce believable Brier/MAE/FP-rate numbers. Reviewer doesn't need to refit (Sprint 5's job) but should flag if any theatre returns NaN or undefined-shaped results.

---

## 10. Stop condition

**After Sprint 3 implementation, STOP for review/audit before Sprint 4 unless operator explicitly approves continuing.**

Specifically:

1. After all 8 Sprint 3 tasks close (`br ready --json` returns no Sprint-3 tasks), engineer authors `grimoires/loa/a2a/sprint-3/reviewer.md` per the implementation-report template.
2. Engineer halts. Operator invokes `/review-sprint sprint-3`.
3. If review returns CHANGES_REQUIRED: engineer addresses, re-runs review until APPROVED.
4. If review APPROVED: operator invokes `/audit-sprint sprint-3`.
5. If audit APPROVED: operator commits Sprint 3 (mirroring Sprint 0/1/2 commit pattern).
6. ONLY AFTER Sprint 3 commit lands: operator decides whether to start Sprint 4 in the same session.
7. If operator approves Sprint 4 continuation: invoke `/implement sprint-4`.
8. If operator does NOT approve: stop. Sprint 4 deferred to a later session.

**Do NOT auto-chain Sprint 3 → Sprint 4.** Each sprint maintains separate gates, reviews, audits, and commits.

---

## 11. Quick verification commands for fresh-session sanity check

```bash
# Verify cycle state intact
git log --oneline -5                                    # 33e9133 at HEAD
git status                                              # clean
./scripts/construct-validate.sh construct.yaml          # OK: v3 conformant
node --test tests/corona_test.js                        # tests 70 / pass 70 / fail 0

# Verify Sprint 0/1/2 closed + approved
br list --status closed --json | grep -c "sprint-[012]-"   # Expect: ≥11 (3 Sprint 0 + 3 Sprint 1 + 5 Sprint 2)

# Verify Sprint 3 ready
br list --status open --json | grep -c "sprint-3-"      # Expect: 8
ls grimoires/loa/a2a/sprint-3/                          # Expect: handoff.md (this file)
ls scripts/corona-backtest* 2>/dev/null                 # Expect: not present (Sprint 3 unstarted)

# Verify frozen protocol intact
wc -l grimoires/loa/calibration/corona/calibration-protocol.md   # Expect: 523
grep -c "^### 3.7" grimoires/loa/calibration/corona/calibration-protocol.md  # Expect: 1
grep -c "^#### 4.4.0" grimoires/loa/calibration/corona/calibration-protocol.md  # Expect: 1

# Verify Sprint 4 unstarted
br list --status open --json | grep -c "sprint-4-"      # Expect: 3
ls grimoires/loa/calibration/corona/empirical-evidence.md  # Sprint 1 placeholder, present
```

---

## 12. Recommended Sprint 3 fresh-session kickoff

1. **First operator action**: invoke `/implementing-tasks Sprint 3` (or `/implement sprint-3`) in the fresh session.
2. **First implementation step**: read this handoff packet end-to-end.
3. **Second step**: read priority files §4 in order, synthesizing to `grimoires/loa/NOTES.md` as needed.
4. **Third step**: enrich Sprint 3 beads task descriptions if needed (Sprint 1 review C4 pattern; Sprint 2 had useful descriptions out of `/sprint-plan` so Sprint 3 likely will too — verify).
5. **Fourth step**: execute `corona-v9m` (P0 sanity sample). HALT and surface if 5/5 doesn't pass.
6. **Fifth step**: parallel `corona-2jq` + `corona-1ks` after sanity passes.
7. **Sixth step**: parallel `corona-2iu` + `corona-70s` + `corona-aqh` after ingestors+loader.
8. **Seventh step**: `corona-2ox` (reporting + hashing).
9. **Eighth step**: `corona-2b5` (corpus commit + Run 1 execution).
10. **Sprint 3 close**: `/review-sprint sprint-3` → `/audit-sprint sprint-3` → operator commit.

---

## 13. HITL pause-points within Sprint 3 (suggested, operator may revise)

The fresh-session agent should consider surfacing for HITL review at these natural breakpoints:

1. **After `corona-v9m` sanity-sample passes** — operator review of normalised output across 2017-2026 era boundaries.
2. **After `corona-1ks` corpus-loader-validate** — operator review of corpus schema validation rules; confirm §3.7 schema is correctly enforced.
3. **After `corona-2b5` primary corpus commit** — operator review of pinned event list (~15-25 per theatre) BEFORE Run 1 execution. Corpus is read-only after freeze per `corpus/README.md` policy; pre-Run-1 review is the last HITL gate before Sprint 5 regression-gate locks the `corpus_hash`.
4. **After Run 1 baseline complete** — operator review of `run-1/` certificates BEFORE Sprint 3 closes. Per-theatre Brier/MAE/FP-rate numbers should be believable; outliers worth flagging.

These are advisory; operator may choose to run Sprint 3 fully autonomously or pause more often per cycle health.

---

## 14. Files the fresh session WILL CREATE in Sprint 3

Sprint 3 will create the following new files. None of these exist at handoff time.

```
scripts/corona-backtest.js                          # entrypoint (corona-2jq scope partly; corona-2iu/70s/aqh wire it up)
scripts/corona-backtest/
├── ingestors/
│   ├── swpc-fetch.js                               # corona-2jq
│   ├── donki-fetch.js                              # corona-2jq
│   ├── gfz-fetch.js                                # corona-2jq
│   ├── donki-sanity.js                             # corona-v9m
│   └── corpus-loader.js                            # corona-1ks
├── scoring/
│   ├── t1-bucket-brier.js                          # corona-2iu
│   ├── t2-bucket-brier.js                          # corona-2iu
│   ├── t3-timing-error.js                          # corona-70s
│   ├── t4-bucket-brier.js                          # corona-2iu
│   └── t5-quality-of-behavior.js                   # corona-aqh
├── reporting/
│   ├── write-report.js                             # corona-2ox
│   ├── write-summary.js                            # corona-2ox
│   └── hash-utils.js                               # corona-2ox
└── config.js                                       # corona-2jq or corona-2ox
grimoires/loa/calibration/corona/corpus/
├── primary/T1-flare-class/<events>.json            # corona-2b5
├── primary/T2-geomag-storm/<events>.json           # corona-2b5
├── primary/T3-cme-arrival/<events>.json            # corona-2b5
├── primary/T4-proton-cascade/<events>.json         # corona-2b5
├── primary/T5-solar-wind-divergence/<events>.json  # corona-2b5
└── corpus-manifest.json                            # corona-2b5 (SHA256 over corpus files)
grimoires/loa/calibration/corona/run-1/
├── corpus_hash.txt                                 # corona-2b5
├── script_hash.txt                                 # corona-2b5
├── T1-report.md                                    # corona-2b5 (Run 1)
├── T2-report.md                                    # corona-2b5
├── T3-report.md                                    # corona-2b5
├── T4-report.md                                    # corona-2b5
├── T5-report.md                                    # corona-2b5
├── per-event/                                      # corona-2b5
└── summary.md                                      # corona-2b5
grimoires/loa/a2a/sprint-3/
├── reviewer.md                                     # implementation report
├── engineer-feedback.md                            # senior review output (post /review-sprint)
├── auditor-sprint-feedback.md                      # security audit output (post /audit-sprint)
└── COMPLETED                                       # marker (post /audit-sprint approval)
tests/                                              # OPTIONAL new test files for backtest modules
└── corona_backtest_test.js                         # if Sprint 3 chooses to add test coverage for harness modules
```

Sprint 3's diff scope is large but additive. No existing files should be modified beyond `sprint.md` checkmarks at sprint close (mirroring Sprint 0/1/2 precedent) and `package.json` (which MUST NOT change).

---

## 15. Out-of-scope for Sprint 3 (explicit rejections)

Items the fresh-session agent should explicitly NOT touch:

- **`src/theatres/*.js`** — runtime theatre code. Sprint 3 imports constants from proton-cascade.js but does NOT modify it. T4 runtime parameter changes are Sprint 5's scope.
- **`src/processor/*.js`** — processor code. Sprint 5's scope.
- **`src/oracles/*.js`** — runtime oracles. Sprint 3 builds NEW backtest ingestors at `scripts/corona-backtest/ingestors/`; the runtime oracle code remains untouched.
- **`construct.yaml`** — the v3 manifest. Sprint 7's publish-readiness scope unless Sprint 3 discovers a v3 schema gap (surface to operator first).
- **`spec/construct.json`, `spec/corona_construct.yaml`** — legacy spec files. Per operator hard constraint #5 from Sprint 2 handoff: preserved on disk untouched. Sprint 7 polish only.
- **`.claude/`** — System Zone, never edit.
- **`grimoires/loa/calibration/corona/calibration-protocol.md`** — frozen Sprint 2 protocol. Modify only if operator authorizes a Sprint 2 amendment.
- **`grimoires/loa/calibration/corona/theatre-authority.md`** — Sprint 0 settlement authority of record. Read-only.
- **`grimoires/loa/calibration/corona/empirical-evidence.md`** — Sprint 4 deliverable. Sprint 3 does not author this.
- **`grimoires/loa/calibration/corona/calibration-manifest.json`** — Sprint 5 deliverable. Sprint 3 leaves the placeholder `[]` alone.

---

## 16. Handoff acknowledgment

This packet is the operator's primary primer for Sprint 3 (and conditional Sprint 4) in a fresh context window. The fresh-session agent should:

1. Read this file at the top of the session.
2. Read priority-listed files in §4 in order.
3. Confirm cycle state via §11 verification commands.
4. Execute `corona-v9m` (P0 sanity sample) FIRST per §6 hard constraint #10 / §12 step 4.
5. Surface to operator if any §6 hard constraint is at risk OR if protocol ambiguity is found per §6 hard constraint #7.
6. **Stop after Sprint 3 implementation per §10 stop condition.** Do NOT auto-start Sprint 4.

The operator's stated goal: run Sprint 3 first cleanly, with separate gates from Sprint 4. This packet preserves that posture across the session boundary.

---

*Sprint 3 (and conditional Sprint 4) handoff packet authored cycle-001 Sprint 2 close, after Sprint 2 review (Round 1 CHANGES_REQUIRED → Round 2 APPROVED), audit (APPROVED), and commit (`33e9133`). All Sprint 0/1/2 work pushed to origin/main. Sprint 3 unstarted; Sprint 4 unstarted.*
