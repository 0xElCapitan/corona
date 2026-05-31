# Sprint S02 — Review (reviewing-code)

**Verdict: ALL GOOD (ACCEPT, with non-blocking concerns).**
**Reviewed:** 2026-05-30 · **Sprint:** cycle-003 S02 (Corpus Namespace + Schema Skeleton) · **Branch:** `cycle-003-s02-corpus-namespace` @ base `fdfdb99` (0 commits since base).
**Review type:** single-model adversarial review (`flatline_protocol.code_review.enabled` is unset → Phase 2.5 cross-model dissenter not configured; consistent with S01's verification/doc-sprint posture). `integrity_enforcement: strict` — no `.claude/` System-Zone drift introduced by S02.

S02 is a **data-substrate / skeleton** sprint: the review subjects are markdown + JSON skeleton artifacts (no application code). The live attack surface is **epistemic overclaim** and **scope / frozen-artifact violation** — this review targets those. I re-ran every mechanical check independently and **re-executed the CN-4 loader-tolerance smoke test myself** — I did not trust the implementation report.

## Requirement-by-requirement result

| # | Requirement | Result |
|---|---|---|
| 1 | Inspect actual artifacts/diffs, not just the report | ✅ Read all 8 corpus artifacts + report; re-ran all checks + smoke test |
| 2 | Working-tree scope | ✅ only `corpus-cycle-003/` + `cycle-003/sprint-02/`; tracked `git diff` **empty**; no `src/`/`scripts/`/`tests/`, `corpus-loader.js`/`t1-replay.js`/`t2-replay.js`, frozen `corpus/`, cycle-001/002, README/BFZ/package/tag/release/main change |
| 3 | `corpus-cycle-003/` skeleton-only | ✅ 8 files: README, manifest, 2 schemas, 4 `.gitkeep`. `primary/`+`secondary/` hold **only** `.gitkeep` (comment-only markers); event-record probe (`event_id`/`proton_flux_observations`/`flare_class_observed`/`kp_swpc_observed`) = **0 hits** |
| 4 | Schema skeletons | ✅ T1 `xray_flux_observations[]`, T2 `kp_observations[]`; describe **only** additive arrays (frozen envelope not redefined); explicitly "IGNORES at evidence.pre_cutoff … deferred Layer-A/B (HS-2/OQ-9)" → no current-consumption implication; T1S-1/T2S-1 strict-pre-cutoff + settlement-separation = leakage-free framing |
| 5 | Manifest skeleton | ✅ `corpus_hash: null` + `"PENDING — NOT FINAL"`; no final hash; `entries: []`; predecessor pointers accurate (`e53a40d1…` sha256, records frozen `b1caef3f…`, `immutable:true`, "not wrapped"); hash deferral marked + justified (see AC note) |
| 6 | CN-4 smoke test | ✅ **independently re-run**: throwaway fixture outside repo (`…\AppData\Local\Temp\…`), `loadCorpus` T1/T2/T4 `loaded:1 rejected:0`, additive keys survive, `errors:[]`; fixture removed (no repo trace); loader/replay byte-unchanged (0-line diff); no `processX`/score/replay/trajectory; wording = "ephemeral loader-tolerance smoke test, not durable sample records" |
| 7 | S01 carry-forward | ✅ NOAA/NCEI source (not umbra); count **46**; per-year + S-mag (`S1:28 S2:13 S3:4 S4:1 S5:0`) **cross-checked exact** vs S01 ledger; `</tr>`-defect parse lesson preserved; cascade buckets = S04 (unblocked, not computed) |
| 8 | Claim-language audit | ✅ **0 unsafe positive claims** (canonical CSG-9 = 1 match = the reproduced grep *command*; broader list = 26 hits, all NEGATION/PROHIBITION/DEFINITION) |
| 9 | Frozen invariants | ✅ 5/5 (committed-blob) |
| 10 | Unrelated untracked files | ✅ identified: `.agents/`, `.codex/`, `AGENTS.md` — pre-existing, **outside S02 scope, must NOT be staged** |

## Frozen invariants (committed-blob check; Windows `core.autocrlf` → hash committed blob, not on-disk bytes)
- `scripts/corona-backtest.js` → `17f6380b…1730f1` ✅
- cycle-001 `calibration-manifest.json` → `e53a40d1…5db34a` ✅
- cycle-001 `corpus_hash b1caef3f…11bb1` present (30×) in unchanged manifest ✅
- `package.json` `0.2.0` ✅ · RLMF cert (`certificates.js`) `0.1.0` ✅

## Independent CN-4 smoke-test re-run (reviewer, not trusting the report)
Built a fresh throwaway fixture (one synthetic placeholder shape per theatre) under the OS temp dir **outside the repo**, pointed `CORONA_CORPUS_DIR` at it, ran the **unmodified** `loadCorpus`:
```
{"reviewer_smoke_pass":true,"stats":{"T1":{"loaded":1,"rejected":0},"T2":{"loaded":1,"rejected":0},"T4":{"loaded":1,"rejected":0}},"errors":[],"t1_key":true,"t2_key":true}
```
Fixture removed (Node `fs.rmSync`); `git status` shows no fixture/runner trace; `corpus-loader.js`/`t1-replay.js`/`t2-replay.js` diff = 0 lines. **Confirms: loader tolerates the additive keys with no edit; no runtime/scoring/replay path exercised.**

## Claim-language grep (every match classified)
Canonical CSG-9 + broader (calibration-improv / forecasting-accuracy / runtime-sensitiv / verifiable-track / predictive-uplift / Baseline A/B / new-corpus baseline / L2-publish):

| Class | Examples |
|---|---|
| **DEFINITION / historical ceiling** | `report:241` (the CSG-9 grep *command* in the reviewer-steps block — gate self-reference); `README:19` / `manifest:113` / `report:18` ("Rung 2 (runtime-sensitive, T4 only)", "calibration-attempted, not improved" — mandated verbatim cycle-002 ceiling) |
| **NEGATION** | "**No** calibration-improved claim", "**No** T1/T2 runtime-sensitivity claim", "**No** forecasting-accuracy claim", "**NOT** a wired/runtime-sensitivity/calibration claim" (README:179-182, manifest:115-121, schemas:5) |
| **PROHIBITION** | "**never** an uplift delta vs Baseline A/B", "**EXCLUDED** from any uplift-bearing target", HAZ-3/CSG-2 cross-regime ban (README:159/181, manifest:14/19) |

**Zero unsafe positive claims.** The lone canonical-pattern hit is the gate command itself (same classification as S01 `report:112`). No artifact asserts cycle-003 calibration improvement, T1/T2 runtime sensitivity, forecasting accuracy, verifiable track record, predictive uplift, or L2 readiness.

## Adversarial Analysis

### Concerns Identified (non-blocking — recommendations, not edits to S02)
1. **`.gitkeep` markers carry explanatory comments rather than being empty** (`corpus-cycle-003/primary/*/.gitkeep`, 4-5 lines each). They are unambiguously `.gitkeep` markers containing only `#` comments (no event/sample data), so they satisfy "only `.gitkeep` markers" — but a stricter reading prefers empty markers + README-only documentation. Harmless; flagging for consistency preference only.
2. **Schema entry sub-objects are fully closed** (`additionalProperties:false`, all keys `required`) — e.g., T1 requires `energy_channel`+`satellite` on *every* sample; T2 requires `index`+`provenance`+`satellite`. If real S03 NCEI/GFZ rows occasionally lack one (e.g., a Kp reading without an explicit `index`), these schemas would describe them as invalid. **Non-blocking**: the schemas are advisory documentation, *not* loader-enforced (the loader reads neither), so they cannot block S03 loading; S03 owns refinement. Recommend S03 revisit `required`/`additionalProperties` against the actual fetched shape.
3. **The `corpus_hash` machinery is prose, never exercised.** CN-2's *rule* (distinctness + no-comparison-to-`b1caef3f`) is encoded, but the documented canonicalization (`canonical-json.js`→sha256 over the *file set*) is untested in S02 — S03 is the first time it runs, and "hash over a file set" (vs a single object) is left to S03 to define. **Non-blocking** (operator directed hash=PENDING; convention cites existing frozen code), but S03 should pin the set-canonicalization procedure explicitly before relying on it.

### Assumptions Challenged (minimum 1)
- **Assumption:** the frozen `corpus-loader.js` tolerates (preserves + ignores) unknown additive top-level keys, and will continue to — the foundation of both the schema-skeleton design and CN-4 "wired-capable."
- **Risk if wrong:** a future loader tightening to reject unknown keys would break additive-series loading.
- **Disposition: validated** — confirmed in source (`loadEventFile` composes `{...body,_derived,_file}`), re-proven by the reviewer smoke test, and the loader is a frozen artifact (HS-2; not editable in cycle-003). The dependency is explicitly documented in README + both schemas. Low risk; acceptable.

### Alternatives Not Considered (minimum 1)
- **Alternative:** document the additive sub-schemas **inline in the README only** (the literal wording of sprint-plan S02.2: "document them in the corpus README as additive-only"), rather than also shipping two separate JSON-Schema files.
- **Tradeoff:** README-only = fewer files, zero README↔schema drift surface; separate schema files = machine-readable, de-risk S03 (a validator could check S03 events), and better match the operator prompt's plural "schema / manifest skeletons."
- **Verdict: current approach justified.** The schema files describe **only** the additive arrays (no frozen-envelope duplication) and both point to the same SDD §4.2/§5.2 source, so drift risk is minimal; the machine-readable artifacts are a net positive for S03. Not a defect.

## AC Verification note
The implementation report contains a complete `## AC Verification` section (§2) walking **CN-1 … CN-4 + the additive-annotation requirement** verbatim, each with a status marker and `file:line`/field evidence. CN-1/CN-3/CN-4/additive-annotation = `✓ Met`; CN-2 = `✓ Met` (distinctness *rule* encoded). The single deferral — sprint-plan **Success Metric** "corpus_hash computed" → `⏸ [ACCEPTED-DEFERRED]` (report §4) — is **operator-directed** ("do not compute final hash; mark pending") and applies to a success metric, **not** to any CN-* acceptance criterion (no AC is `✗`/`⚠`). Its rationale + the CN-4 scope decision are logged in the report's own Decision Log (§3) and Deviation (§4). Per this cycle's frozen-artifact discipline these live in the **cycle-003 namespace**, not the frozen global `grimoires/loa/NOTES.md` (writing there would be an HS-C10-4 cycle-001-mutation violation) — the correct location. AC gate **does not** trigger CHANGES_REQUIRED.

## Required fixes
**None.** No factual error, no scope/frozen violation, no posture/claim violation, no missing disclosure. The three concerns above are recommendations for S03, not edits to S02.

## Sprint-plan / ledger status
Deliberately **not** updating `CYCLE-003-SPRINT-PLAN.md` or `SPRINT-LEDGER.md` status here — mirrors the S01 precedent (keeps the working tree scope-limited; the status flip is the `/audit-sprint` + operator gate). No commit, no push, no tag, no S03.

## Readiness
**S02 is READY for `/audit-sprint sprint-S02`.** Skeleton-only posture upheld; no code edit / no event records / no replay-loader wiring / no `processX` / no final hash / no commit / no S03; frozen invariants intact; isolation confirmed; honest framing clean (0 unsafe positive claims).
