# CORONA cycle-003 — Sprint S02 Implementation Report

**Artifact**: implementation report (PRD §6 / SDD §3–§5 / sprint plan S02).
**Sprint**: S02 — Corpus Namespace + Schema Skeleton (SMALL, 3 tasks). Depends on S01 (complete, audited APPROVED).
**Branch**: `cycle-003-s02-corpus-namespace`
**Base**: `fdfdb99` (= `cycle-003` tip; `docs(corona): complete cycle-003 sprint-01 archive verification`); **0 commits since base** (no commit performed).
**Authored**: 2026-05-30
**Status**: implementation complete; **awaiting `/review-sprint sprint-S02`**. No commit, no push, no S03.

> **Binding scope statement (required wording):** *S02 proves skeleton shape and loader tolerance
> only. It does not create corpus events, does not prove T1/T2 runtime wiring, and does not advance
> any rung.*

---

## 0. Cycle posture (carried forward, unweakened)

Cycle-002 closed at **Rung 2 (runtime-sensitive, T4 only)**; published version **v0.2.0**;
"calibration-attempted, not improved." Cycle-003 is a **corpus-shape / data-substrate cycle**: it
earns **no new rung** and advances **no theatre's rung** (OQ-8). NOT a refit cycle · NOT a
calibration-improvement cycle · NOT a T1/T2 runtime-sensitivity cycle · NOT an L2 publish-ready
cycle · NOT a release. The SDD §2 Layer-A/B replay+loader change is out of scope (HS-2 / OQ-9).

---

## 1. Executive Summary

S02 stood up the isolated cycle-003 corpus namespace and its schema/manifest **skeleton**, touching
**zero frozen files** and creating **zero corpus event records**. Concretely:

- Created the `grimoires/loa/calibration/corona/corpus-cycle-003/` sibling tree (a NEW root selected
  by the existing `CORONA_CORPUS_DIR` seam — the frozen `corpus/` tree is never opened for write).
- Pinned the OQ-1 additive series field names — `xray_flux_observations[]` (T1),
  `kp_observations[]` (T2) — with their entry sub-schemas, as JSON-Schema skeleton files, documented
  as **additive-only annotations the existing loader ignores** at `evidence.pre_cutoff` until the
  deferred Layer-B change (HS-2).
- Stood up the additive, self-contained `corpus-cycle-003-manifest.json` skeleton (mirrors the
  cycle-002 additive precedent). `corpus_hash` is recorded as **PENDING / NOT FINAL** (no corpus
  records exist to hash in S02); the canonicalization convention + the CN-2 distinctness prohibition
  are documented.
- Carried the S01 data-source verification ledger forward into the corpus README (summary + pointer
  to the canonical full ledger).
- Proved loader tolerance of the additive keys via an **ephemeral, read-only `loadCorpus` smoke
  test against a throwaway temp fixture outside the repo** — no committed/placed sample records, no
  loader edit, no `processX`, no scoring.

**CN-4 is satisfied by an ephemeral loader-tolerance smoke test, not by durable sample corpus
records** (operator decision, §3 below).

---

## 2. AC Verification (sprint plan S02 — CN-1 … CN-4 + additive-annotation requirement)

Each acceptance criterion quoted verbatim from `CYCLE-003-SPRINT-PLAN.md` §"Sprint S02".

### CN-1 — `✓ Met`
> "frozen `corpus/` tree, `corpus-manifest.json`, and `corpus_hash b1caef3f…11bb1` are byte-unchanged (`git diff` empty on those paths)."

- `git diff HEAD` tracked-file stat = **empty**; `git diff` on `grimoires/loa/calibration/corona/corpus/` = **0 lines**; on `calibration-manifest.json` = **0 lines**; on cycle-002 `runtime-replay-manifest.json` = **0 lines**.
- Frozen `corpus_hash b1caef3f…11bb1` present (30 occurrences) in the unchanged committed `calibration-manifest.json` (sha256 `e53a40d1…` — match).
- The new tree is added as an **untracked sibling** (`?? …/corpus-cycle-003/`); no frozen path mutated. Evidence: §5 validation block.

### CN-2 — `✓ Met` (distinctness rule encoded; hash VALUE intentionally PENDING — see §4 / Decision Log)
> "the new `corpus_hash` is a distinct value over the distinct cycle-003 file set; it is never substituted for or compared against `b1caef3f…` as if measuring the same corpus."

- `corpus-cycle-003-manifest.json` records `corpus_hash: null`, `corpus_hash_status: "PENDING — NOT FINAL"`, and a `corpus_hash_note` documenting: (a) the computation convention (sorted-key canonical JSON → SHA-256 over the cycle-003 file set, via `replay/canonical-json.js` + `replay/hashes.js`, read-only); (b) the **CN-2 prohibition** — the cycle-003 hash is a distinct value over a distinct file set, never substituted for or compared against `b1caef3f…`, and any future baseline on it is a new regime (HAZ-3 / CSG-2).
- No corpus_hash is computed in S02 because the corpus holds **zero event records** (operator-directed; §4). The distinctness *rule* (CN-2's substance) is satisfied now; the *value* is computed S03+. README `corpus_hash machinery (CN-2)` section + manifest both encode this. No comparison to `b1caef3f…` is made anywhere.

### CN-3 — `✓ Met`
> "the manifest is additive and self-contained — lives only in `corpus-cycle-003/`, references only cycle-003 files, is not a wrapper around the frozen manifests (mirrors cycle-002 additive precedent)."

- Manifest at `corpus-cycle-003/corpus-cycle-003-manifest.json:1`; `"additive": true`. It references only cycle-003 files (its own `schema/` + `corpus_layout` paths). The frozen cycle-001/cycle-002 manifests appear only under `predecessor_manifests[]`, each tagged `"immutable": true` with a note that they are **not** wrapped or superseded (`corpus-cycle-003-manifest.json:46-66`). Shape mirrors `cycle-002/runtime-replay-manifest.json` (`additive`, `predecessor_manifest`, `theatre_posture`, `entries`).

### CN-4 — `✓ Met` (by ephemeral loader-tolerance smoke test, not durable sample records — operator decision §3)
> "a single placeholder/sample event per theatre validates against the frozen common-envelope + per-theatre schema via the existing `corpus-loader.js` `loadCorpus` path with `CORONA_CORPUS_DIR` pointed at the new tree, with no loader edit (the loader tolerates additive top-level keys)."

- Satisfied via the §3 ephemeral smoke test: one placeholder shape per theatre (T1/T2/T4) in a **throwaway temp fixture outside the repo**, loaded read-only through the **unmodified** `corpus-loader.js` `loadCorpus` with `CORONA_CORPUS_DIR` pointed at the temp dir.
- Result: `T1 loaded:1 rejected:0`, `T2 loaded:1 rejected:0`, `T4 loaded:1 rejected:0`, `errors: []`; the additive keys survived on the composed events (`t1.xray_flux_observations` and `t2.kp_observations` both present as arrays). No loader edit, no `processFlareClassGate`/`processGeomagneticStormGate`, no trajectory, no score. Fixture removed after the run (no repo trace).
- **No placeholder/sample event records are committed or placed inside `corpus-cycle-003/`** — its `primary/`/`secondary/` dirs hold only `.gitkeep`.

### Additive-annotation documentation requirement — `✓ Met`
> "The series field names are documented as additive annotations the existing loader ignores at the `evidence.pre_cutoff` layer (surfacing them is the deferred Layer-B change, HS-2)."

- Documented in three places: corpus `README.md` ("Additive series fields" section), each schema file's `description`/`$comment`, and the manifest `series_fields.note`. All state: the loader composes `{...body,_derived,_file}` (tolerates the keys) and `deriveEvidenceT1/T2` return `pre_cutoff: []` (ignores them); surfacing is the deferred Layer-A/B change (HS-2 / OQ-9); carrying them is wired-**capable** substrate shape only, not a wired/sensitivity/calibration claim (HAZ-1).

---

## 3. Decision Log — CN-4 scope (operator-resolved)

**Decision (operator, 2026-05-30):** S02 may satisfy CN-4 / S02.2 by running a **read-only
`loadCorpus` smoke test against a THROWAWAY placeholder fixture outside the repo**, **not** by
committing placeholder event records into `corpus-cycle-003/`.

**Why surfaced:** the sprint plan CN-4 / S02.2 call for "a single placeholder/sample event per
theatre" loaded via `loadCorpus`; the S02 task prompt forbids populating "actual T1/T2/T4 event
corpus records" and scopes S02 to a "minimal skeleton." "Placeholder/sample" vs "actual records"
was a genuine divergence affecting what physically lands in the protected namespace — referred to
the operator (HITL).

**Resolution applied (verbatim authorization):** create the committed skeleton only; the temp
fixture (one placeholder shape per theatre) is **temporary, outside the repo, never committed**; the
smoke test proves loader tolerance for the additive fields; record the command, fixture-shape
summary, result, and limitation here. **Required wording:** *CN-4 is satisfied by an ephemeral
loader-tolerance smoke test, not by durable sample corpus records.*

---

## 4. Deviation from the sprint-plan S02.3 / Success-Metric "corpus_hash computed" (operator-scoped, surfaced)

The sprint plan S02.3 deliverable and Success Metric say "a fresh `corpus_hash` computed … distinct
from `b1caef3f…`." The S02 task prompt directs: "Do NOT compute or claim final cycle-003 corpus hash
… If a hash field is needed, mark it clearly as pending / not final."

**Resolution:** because S02 creates **zero corpus event records**, there is nothing to hash; a hash
over an empty set would be meaningless. The manifest therefore records the **`corpus_hash` machinery
+ CN-2 distinctness rule** (the substance of S02.3) with the hash **VALUE = PENDING / NOT FINAL**,
computed in S03+ when records exist. This is a deliberate, operator-directed scope decision, not an
omission. Marked `⏸ [ACCEPTED-DEFERRED]` against the "hash value computed" sub-metric; the
machinery/convention sub-metric is `✓ Met`.

---

## 5. Tasks Completed

### Task S02.1 — corpus directory tree (→ G-1) — `✓`
Created `corpus-cycle-003/` per SDD §3.2: `primary/{T1-flare-class, T2-geomag-storm, T4-proton-cascade}/`
(each empty, `.gitkeep`-tracked), `secondary/` (empty, `.gitkeep`), and `README.md`. **T3/T5 subdirs
absent** by default (OQ-6 OFF). `heldout-split.json` intentionally **not** created (S05). The
`README.md` carries the S01 verification ledger forward (summary table F1–F10 + the T4 supply
carry-forward) with a pointer to the canonical full ledger.

### Task S02.2 — pin OQ-1 field names + entry sub-schemas (→ G-1, G-2) — `✓`
Pinned `xray_flux_observations[]` = `{time, long_channel_wm2, energy_channel, satellite}` and
`kp_observations[]` = `{time, kp, index, provenance, satellite}` as JSON-Schema (draft 2020-12)
skeleton files under `schema/`, describing **only** the additive arrays (the frozen envelope stays
owned by `corpus-loader.js`/protocol §3.7 — not redefined). Documented as additive-only annotations
in README + schema `$comment` + manifest. Load-path tolerance verified by the §6 smoke test (no
loader edit).

### Task S02.3 — additive-manifest skeleton + `corpus_hash` machinery (CN-2/CN-3) (→ G-1) — `✓` (hash value PENDING — §4)
Created `corpus-cycle-003-manifest.json` (additive, self-contained, mirrors cycle-002 precedent):
`status: skeleton`, `corpus_hash: null` (PENDING), immutable `predecessor_manifests`, frozen-invariant
provenance block, `theatre_posture`, `series_fields`, `corpus_layout`, `per_theatre_targets` (with
the S01 T4 supply = 46 / per-year / S-magnitude carry-forward and the cascade-bucket-is-S04 + `</tr>`
parse warnings), `heldout_split` (PENDING/S05), empty `entries`, and a `claim_boundary` block.
Confirmed CN-1 frozen-tree zero-diff (§7).

---

## 6. Testing Summary — ephemeral loader-tolerance smoke test (CN-4)

**Intent:** prove the additive series keys load cleanly through the **existing, unmodified** loader
(CN-4) without committing any event record.

**Command (read-only; fixture outside the repo; no `scripts/` file created):**
```
tmp=$(mktemp -d)            # outside repo: …\AppData\Local\Temp\claude\tmp.XXXX
# write one placeholder shape per theatre under $tmp/primary/T{1,2,4}-…/placeholder.json
CORONA_CORPUS_DIR="$(cygpath -w "$tmp")" node --input-type=module -e \
  'import { loadCorpus } from "./scripts/corona-backtest/ingestors/corpus-loader.js"; \
   const r = loadCorpus(undefined, { theatres: ["T1","T2","T4"] }); …assert…'
# node fs.rmSync removes the temp fixture afterward
```

**Temp-fixture shape summary** (synthetic placeholders; `event_time` 2099 to mark them non-real):
- T1: frozen envelope + T1 required fields + `xray_flux_observations[1]`
- T2: frozen envelope + T2 required fields + `kp_observations[1]`
- T4: frozen envelope + T4 required fields + `proton_flux_observations[0]`

**Result — PASS:**
| Theatre | loaded | rejected | additive key present |
|---------|-------:|---------:|----------------------|
| T1 | 1 | 0 | `xray_flux_observations` ✓ |
| T2 | 1 | 0 | `kp_observations` ✓ |
| T4 | 1 | 0 | (existing `proton_flux_observations`) ✓ |

`errors: []`. The loader accepted the additive top-level keys (composes `{...body,_derived,_file}`)
and preserved them on the loaded event — **no loader edit**. No `processX`, no trajectory, no score,
no replay, no refit. Fixture removed (verified gone); **nothing written into the repo**.

**Limitation (binding):** this proves only **loader structural tolerance of the additive keys**. It
does **not** prove T1/T2 runtime wiring or sensitivity (that requires the deferred Layer-A/B change,
HS-2 / OQ-9), does **not** validate real corpus data (none exists yet — S03/S04), and advances **no
rung**.

---

## 7. Validation / Report (operator-requested)

| Item | Result |
|------|--------|
| Active branch | `cycle-003-s02-corpus-namespace` |
| Base branch / commit | `cycle-003` @ `fdfdb99` (0 commits since base) |
| `git status --short` | `?? grimoires/loa/calibration/corona/corpus-cycle-003/` + `?? grimoires/loa/a2a/cycle-003/sprint-02/` (+ pre-existing unrelated `?? .agents/`, `?? .codex/`, `?? AGENTS.md` carried from before this sprint) |
| Files created (committed-to-be) | corpus: `corpus-cycle-003/README.md`, `corpus-cycle-003-manifest.json`, `schema/xray-flux-observations.schema.json`, `schema/kp-observations.schema.json`, `primary/T1-flare-class/.gitkeep`, `primary/T2-geomag-storm/.gitkeep`, `primary/T4-proton-cascade/.gitkeep`, `secondary/.gitkeep`; report: `a2a/cycle-003/sprint-02/implementation-report.md` |
| Forbidden-path audit | **clean** — no change under `src/`/`scripts/`/`tests/`, README, BUTTERFREEZONE, `package.json`, `grimoires/loa/{prd,sdd,sprint}.md`, `ledger.json`; no `corpus-loader.js`/`t1-replay.js`/`t2-replay.js` touch |
| Frozen corpus tree untouched (CN-1) | **confirmed** — `git diff` on `corpus/` = 0 lines; `corpus_hash b1caef3f…` present in unchanged manifest |
| New `corpus-cycle-003/` isolation | **confirmed** — sibling root (not under `corpus/`); additive self-contained manifest; selected by `CORONA_CORPUS_DIR`; no event records inside (only `.gitkeep` in `primary/`/`secondary/`) |
| Frozen invariants (committed-blob sha256) | `corona-backtest.js` `17f6380b…` ✓ · `calibration-manifest.json` `e53a40d1…` ✓ · `corpus_hash b1caef3f…` present ✓ · `package.json` `0.2.0` ✓ · RLMF cert `0.1.0` ✓ |
| Claim-language grep (CSG-9 canonical) | **0** matches over `corpus-cycle-003/` |
| Claim-language grep (broader hyphen-inclusive) | all hits are **NEGATION / PROHIBITION / DEFINITION** (e.g. "No calibration-improved claim"; cycle-002 ceiling "runtime-sensitive, T4 only" verbatim); **0 unsafe positive claims** |
| Code edits | **none** (loader run read-only; no file under `src`/`scripts`/`tests` created or edited) |
| Corpus event population | **none** (zero event records; placeholders ephemeral + outside repo + removed) |
| Replay/loader wiring | **none** (no `processX`; loader unmodified) |
| Commit / push | **none** |
| S03 started | **no** |

---

## 8. Known Limitations / Pending (by sprint)

- **S03**: populate T1/T2 events with leakage-free strictly-pre-cutoff `xray_flux_observations[]` /
  `kp_observations[]`; add per-file manifest entries; run the read-only §2.3 substrate-conformance
  probe. Construction MUST enforce T1S-1/T2S-1 (strict `<` cutoff), T1S-2/T2S-3 (no settlement in
  series), T2S-2 (GFZ-lag eligibility).
- **S04**: add T4 events to the GOES-R-era S1+ supply ceiling (S01 supply = 46, supply-bounded not
  padded); compute the honest per-bucket **cascade-count** distribution (distinct from S-magnitude);
  **re-pull the NOAA SPE list and parse `</tr>`-independently** (2024-01-29 markup defect); keep the
  explicit `pfu ≥ 10` filter. No refit.
- **S05**: declare + freeze `heldout-split.json` + sealed assignment; record the seal pointer in the
  manifest; T4 held-out likely underpowered (document, don't pad). No fit.
- **S06**: finalize/verify `corpus_hash` over the populated tree; honest-framing grep gate;
  frozen-invariant verification; SC-8 non-achievements; `CLOSEOUT.md`. No release.

---

## 9. Verification Steps for the Reviewer

```bash
git rev-parse --abbrev-ref HEAD                      # cycle-003-s02-corpus-namespace
git diff --stat HEAD                                 # empty (no tracked file modified)
git status --short                                   # only corpus-cycle-003/ + sprint-02/ (+ pre-existing .agents/.codex/AGENTS.md)
# Frozen invariants (committed-blob, Windows-CRLF-safe):
git show HEAD:scripts/corona-backtest.js | sha256sum                                  # 17f6380b…
git show HEAD:grimoires/loa/calibration/corona/calibration-manifest.json | sha256sum # e53a40d1…
# CN-1 frozen-tree zero-diff:
git diff HEAD -- grimoires/loa/calibration/corona/corpus/                            # 0 lines
# No event records inside the new tree (only .gitkeep):
find grimoires/loa/calibration/corona/corpus-cycle-003/primary grimoires/loa/calibration/corona/corpus-cycle-003/secondary -type f
# Claim-language gate:
grep -rniE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record" grimoires/loa/calibration/corona/corpus-cycle-003/
# Re-run the loader-tolerance smoke test: see §6 (ephemeral, outside repo).
```

---

*CORONA cycle-003 Sprint S02 — Corpus Namespace + Schema Skeleton. Skeleton shape + loader tolerance
only; no corpus events, no runtime wiring, no rung advance; frozen cycle-001/cycle-002 artifacts
byte-unchanged. Awaiting `/review-sprint sprint-S02`. No commit, no push, no S03.*
