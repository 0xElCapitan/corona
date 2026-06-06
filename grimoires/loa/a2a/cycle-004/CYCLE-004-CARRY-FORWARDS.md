# CORONA Cycle-004 — Carry-Forwards

**Date:** 2026-06-06 · **Cycle:** cycle-004 (final commit `eaf7232`)

Forward-looking items recorded at cycle-004 closeout. Each is **cycle-scoped and
operator-gated** — none is performed here. This document is descriptive; it changes
no code, tag, version, or branch.

---

## 1. T1 evidence consumption remains honestly BLOCKED

T1 (flare class) is retained as a **negative control**. Raw
`xray_flux_observations[]` are 1-minute flux measurements; the gate
(`processFlareClassGate`) consumes discrete classified `solar_flare` **events**.
Bridging the two requires manufacturing flare-event semantics from flux samples
(forbidden) or editing the gate (forbidden). T1 stays blocked **unless a future,
separately-gated cycle**:

- **(a)** adds a **native `xray_flux` gate evidence type** to the flare gate (its own
  SDD + explicit gate-edit authorization — SDD §5.5a); **or**
- **(b)** builds a **pre-cutoff flare-*event* corpus** that matches the `solar_flare`
  bundle contract (a future corpus cycle — SDD §5.5b).

Until then, any T1 "wiring" or `xray_flux → solar_flare` mapping is forbidden (HS-9).

## 2. T4 raw-proton-flux unblock remains DEFERRED

T4 was out of scope for cycle-004 (the cycle-003 corpus carries 0 T4 records;
PRD §6 / OQ-9). A T4 unblock is a **separate, operator-gated, externally-dependent
cycle** with its own SDD + sprint plan. No T4 work was performed.

## 3. Optional cleanup — `_`-prefixed helper imported into production

`replay_T2_event` (`t2-replay.js`) imports the shared cutoff helper as
`_deriveKpPreCutoffObservations` (the `_`-prefixed export from `corpus-loader.js`),
so Layer-A bundle times cannot diverge from Layer-B `evidence.pre_cutoff` (SDD §7
DRY). This is test-guarded and behaviorally correct. **Optional future cleanup:**
replace or formalize the `_`-prefixed import with a clean, non-underscore **named
export**. Cosmetic; no behavior change; deferrable.

## 4. Optional line-ending hardening — `.gitattributes` proof-JSON pin

This repo has `core.autocrlf=true` and **no `.gitattributes`** eol rule; committed
JSON blobs are stored LF but check out as CRLF. The SPRINT-PLAN §6.10 line-ending-
robust comparison (committed LF blob via `git cat-file` + canonical JSON parse) fully
resolves the proof-comparison risk on the durable LF blobs. **Optional future hygiene
task (out of scope unless separately authorized):** pin the proof JSON line endings
via `.gitattributes` (e.g. `grimoires/loa/a2a/cycle-004/proof/*.json eol=lf` or
`-text`) so even a raw `diff` is safe. Not required; must not be introduced as scope
creep.

## 5. Known test-harness side effect — npm-test cycle-002 provenance dirties

`npm test` updates provenance fields (`replay_script_hash`, `code_revision`) in 5
cycle-002 files. These are **provenance-only** (no score / sensitivity / bucket /
corpus_hash change) and **must be restored via `git restore` before staging** any
commit. This applies to every future pre-commit run on this repo until/unless the
cycle-002 entrypoint's provenance-write behavior is changed under a separate cycle.

## 6. Final merge-to-main decision remains SEPARATE

`cycle-004` (`eaf7232`) is **not** merged to `main` (`ccd6eea`). The merge is a
separate, explicitly-authorized operator decision with its own pre-merge validation.
This closeout does not start the merge flow.

## 7. No tag / release / version bump unless separately authorized

Published version remains **v0.2.0**; `package.json` stays `0.2.0` / `{}`. No tag was
created for cycle-004. Any tag / release / version bump is a separate operator
decision.

## 8. NOTES / Obsidian durable updates performed in this closeout

- **`grimoires/loa/NOTES.md`** — added one concise `## Decision Log — 2026-06-06
  (CORONA cycle-004 — final closeout)` section with the durable operator-relevant
  learnings (T2 wiring proven without banking a rung; runtime-metadata-constant
  attribution; T1 blocked rationale; §6.10 pattern; npm-test cycle-002 restore;
  cycle-scoped carry-forwards). No log dump.
- **`grimoires/loa/a2a/cycle-004/SPRINT-LEDGER.md`** — sprint status fields updated to
  complete / integrated (Sprint 01 `32b9dd8`, Sprint 02 `2c83bc6`, Sprint 03
  `eaf7232`); structure unchanged.
- **External Obsidian vault** (`C:\Users\0x007\Echelon-Forge-Knowledge`, **outside this
  repo**) — `01 Active Projects/CORONA.md.md` updated (operator-directed, 2026-06-06).
  The stale "Current cycle / status" section (previously *"Cycle-002 is open"*) was
  refreshed to the cycle-001→004 lineage through cycle-004's integration at `eaf7232`,
  and two cycle-004 frozen-anchor "Do not disturb" items were added (cycle-003 corpus
  `7b6c5b48…` + cycle-004 baseline `538cba01…`; no-rung / T1-blocked posture). The
  note's binding no-overclaim posture ("calibration *attempted*, not *improved*") was
  preserved; no other vault note was mutated. (This vault is not under repo git; it is
  the operator's durable knowledge base.)
