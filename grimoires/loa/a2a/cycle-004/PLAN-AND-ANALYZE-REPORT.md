# CORONA Cycle-004 — Plan-and-Analyze Report

> Companion to `PRD.md`. Records how the PRD was grounded, the mission comparison, and the decisions the operator must make.
> **Branch:** `cycle-004` @ `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6` · **Date:** 2026-06-02 · **Phase:** planning only.

---

## 1. Preflight (all confirmed)

| Check | Expected | Observed |
|-------|----------|----------|
| `main` / `origin/main` HEAD | `ccd6eea9e0ef0f9089dc5cb3611d0c8ff0a1e1f6` | ✓ both at `ccd6eea` |
| Working tree | clean | ✓ clean |
| `cycle-004` branch | create from `main` | ✓ created from `ccd6eea`, checked out in this worktree (`main` itself remains checked out in the `festive-sanderson` worktree; not touched) |
| `cycle-004` planning namespace | none pre-existing | ✓ did not exist; created `grimoires/loa/a2a/cycle-004/` |
| `package.json` version | `0.2.0` | ✓ `0.2.0` |
| Tag at HEAD/main | none | ✓ none (`git tag --points-at ccd6eea` empty) |
| cycle-003 corpus_hash | `7b6c5b48…d5003` | ✓ recorded/unchanged in `corpus-cycle-003-manifest.json` (not recomputed — out of planning scope) |
| cycle-002 ceiling | "T4 runtime sensitivity only" | ✓ confirmed in cycle-002 CLOSEOUT (Rung 2, T4 only) |

---

## 2. Method

Grounding ran as a read-only multi-agent workflow (`corona-cycle-004-planning-grounding`, 10 Explore agents — Explore cannot write, mechanically enforcing planning-only discipline): 7 parallel readers (cycle history & ceiling, cycle-003 docs, corpus substrate, Layer-A replay+gates, Layer-B loader, T4 alternative, Loa notes) → 3 assessors (mission, deterministic-proof design, risk & claim-ceiling). One agent (Layer-A) failed to return structured output and was re-run as a single Explore agent. The `mission` assessor under-performed (one-word answers); the mission recommendation below was authored from the full grounding by the planner. The PRD/report were authored by the planner (not a sub-agent) to keep tight control over claim language.

---

## 3. Files Read (grounding sources)

**Cycle history / ceiling:** `cycle-002/{PRD,SDD,PLANNING-FRAME,OPEN-QUESTIONS,CYCLE-002-SPRINT-PLAN}.md`, `cycle-002/sprint-04/T3-T5-POSTURE.md`, `cycle-002/sprint-06/CLOSEOUT.md`, `calibration/corona/run-3-final/delta-report.md`, `calibration/corona/calibration-manifest.json`.
**Cycle-003 docs:** `cycle-003/{PRD,SDD,CYCLE-003-SPRINT-PLAN,SPRINT-LEDGER}.md`, `cycle-003/sprint-06/CLOSEOUT.md`, `cycle-003/sprint-04/blocker-decision-report.md`, sprint-03/sprint-05 implementation reports.
**Corpus:** `corpus-cycle-003/{corpus-cycle-003-manifest.json,README.md}`, `schema/{xray-flux-observations,kp-observations}.schema.json`, sample T1/T2 records.
**Layer A:** `scripts/corona-backtest/replay/{t1-replay,t2-replay,t4-replay,context,hashes,canonical-json}.js`, `src/theatres/{flare-gate,geomag-gate}.js`.
**Layer B:** `scripts/corona-backtest/ingestors/corpus-loader.js`, `scripts/corona-backtest/config.js`, `calibration-protocol.md`, `cycle-002/sprint-01/CONTRACT.md`, `tests/security/corpus-loader-low1-test.js`.
**T4 alternative:** `cycle-003/sprint-04/{blocker-decision-report,bucket-report,implementation-report,engineer-feedback}.md`.
**Notes:** `grimoires/loa/NOTES.md`, `cycle-002/sprint-02/REPLAY-SEAM.md`.
**Other (planner):** `package.json` (test surface), git state, directory globs.

---

## 4. Key Findings

1. **The substrate is ready and the wiring is the *named* deferral.** Cycle-003 built `xray_flux_observations[]` (T1, 5,197 entries) and `kp_observations[]` (T2, 360 entries), strictly pre-cutoff, 0 leakage over 5,557 entries — then explicitly deferred the runtime wiring (SDD §2, OQ-9 / HS-2) to "a future, separately-gated cycle." Cycle-004 is that cycle.
2. **Current code ignores the series.** `deriveEvidenceT1`/`deriveEvidenceT2` return `pre_cutoff: []`; `t1/t2-replay.js` call `createX` once, never `processX`, scoring from settlement labels; `evidence_bundles_consumed: []` hardcoded. T1/T2 trajectories are base-rate-only.
3. **A working reference exists.** T4 already does exactly the target: `deriveEvidenceT4` filters `proton_flux_observations[]` by strict `< cutoff`, sorts by `event_time_ms`; `t4-replay.js` loops `processProtonEventCascade(theatre, bundle, {now})` advancing the clock. Cycle-004 mirrors this for T1/T2.
4. **The gates already exist (live path).** `processFlareClassGate` / `processGeomagneticStormGate` are implemented and need no change — cycle-004 *calls* them, preserving the no-gate-edit / no-refit constraints.
5. **T2 maps cleanly; T1 has a semantic gap.** `kp_observations[]` → `kp_index` bundles → `processKpObservation` is natural. But `xray_flux_observations[]` are raw flux samples, while `processFlareClassGate` expects flare-*class* events with a `rank`. T1 wiring needs a deterministic, parameter-free flux→signal mapping (physical GOES thresholds) or a more conservative scope — and must **not** edit the gate. **This is the top technical open question (PRD OQ-7 / R1).**
6. **The wiring can be made invariant-safe.** Because the frozen cycle-002 corpus lacks these fields, additive + field-presence-gated wiring (`Array.isArray(...)`) is a no-op for cycle-002 events → cycle-002 replays stay byte-identical (I5), and the cycle-001 entrypoint hash (I1) is untouched. A frozen-corpus determinism-regression test is the guardrail (PRD AC5 / G6).
7. **"Consumed" must mean consumed.** A trajectory hash differs trivially if evidence only lands in metadata. The honest proof requires evidence to flow *through* `processX` and move `position_history` (PRD R2 / HS-2). Calling the unchanged runtime on evidence is **not** refitting (no parameter changes), so it is covenant-compliant.
8. **The proof shape is sensitivity-shaped but must not bank a rung.** Wired-vs-ablated + byte-identical revert is structurally like the cycle-002 T4 Rung-2 perturbation test. The operator's forbidden-claim list includes "T1/T2 runtime-sensitive", and the brief says no new rung. So cycle-004 *demonstrates* deterministic, reversible consumption but **deliberately banks no rung** (PRD §4.3 / OQ-1).
9. **Determinism harness is solid.** Injected clock, canonical JSON (RFC 8785 spirit), SHA-256 trajectory hashes, no `Date.now()` in replay (fail-closed). Replay tests for T1/T2/T4 already exist in `tests/` (per `package.json`) — contrary to one agent's claim that none exist.
10. **T4 unblock is feasible-but-gated and externally dependent.** S04.5-style research showed the T4 record-construction blocker is liftable (Option A′ proof-of-source sanity-sample over the 5 frozen records; Option A full expansion). But it needs internet + NOAA archive availability + DV-5 fetch authorization, and the **cascade-bucket blocker is structural** (requires a full GOES-R-era M5+ catalogue incl. zero-producing windows — not derivable from the SEP list). Feasibility: medium.

---

## 5. Mission Comparison

| Dimension | **A — T1/T2 Layer-A/B wiring proof** | **B — T4 raw-proton-flux unblock** |
|----------|--------------------------------------|------------------------------------|
| Input readiness | **Ready now** — substrate built in cycle-003, in-repo | Needs external GOES ≥10 MeV archive fetch (unverified) |
| Self-contained | **Yes** — no internet/data deps | **No** — internet + NOAA archive + DV-5 authorization |
| Reference pattern | **Yes** — T4 already does it | Partial — S03 NCEI fetch precedent only |
| Determinism of proof | **High** — in-repo, hash-based, reproducible | Lower — depends on live archive retrieval |
| Completeness | **Full mission achievable** | **Partial** — cascade-bucket blocker is structural, remains after A′/A |
| Claim-ceiling safety | **High** — wiring/consumption, no rung banked | Medium — supply/data work; selection-bias hazards |
| Is it the named next step? | **Yes** — cycle-003 OQ-9/HS-2 deferral | Yes, but a *different* deferral (separately gated) |
| Risk of scope creep | Low (single mission) | Higher (external deps, operator trigger decisions) |
| Effort | Medium, bounded, in-repo | A′ small (~2-3d) / A large (~1-2wk) + external |

**T1/T2 wiring dominates** on readiness, self-containment, determinism, completeness, and claim-safety. T4 unblock is a legitimate but separate, externally-dependent, partially-blocked mission.

---

## 6. Recommended Mission

**Mission A — the T1/T2 Layer-A/B deterministic evidence-wiring proof** (genuine consumption through `processX`; additive + field-gated; zero parameter change; no rung banked; no scoring). **Defer T4 unblock to a separate, operator-gated cycle.**

Rationale: it converts cycle-003's substrate investment into a real, deterministic runtime capability demonstration using material already in the repo; it is the explicitly-named deferred next step with a working reference; it stays cleanly inside the claim ceiling; and it has no external dependency. Keeping cycle-004 single-mission protects honest-framing discipline (the risk assessor's strongest warning was scope-creep claim conflation).

---

## 7. Unresolved Questions (see PRD §11 for full list)

Load-bearing: **OQ-1** (confirm no rung banked), **OQ-2** (genuine consumption, not metadata-only), **OQ-7** (T1 flux→signal mapping without editing the gate — may shape scope). Also: **OQ-3** (no scoring at all?), **OQ-4** (all 60 events vs train-split only), **OQ-5** (T2 GFZ-lag handling), **OQ-6** (entrypoint isolation), **OQ-8** (bundle payload shapes), **OQ-9** (T4 deferred).

---

## 8. Operator Decisions Needed Before `/architect`

1. **Approve Mission A** (T1/T2 wiring proof) and **defer T4** — or redirect.
2. **Confirm no rung banked** (OQ-1) and **genuine consumption target** (OQ-2).
3. **Acknowledge OQ-7** (T1 mapping) as an SDD-shaping risk that could narrow T1 scope relative to T2.
4. **Confirm no scoring / no held-out evaluation** in cycle-004 (OQ-3/OQ-4) — keeps it wiring-only.
5. Confirm continued **branch isolation** (cycle-004 off `main` until final approved merge; no tag/release/bump).

---

## 9. Discipline Confirmation

No implementation/runtime/replay/loader code was written or edited. No SDD or sprint artifact was created. No cycle-001/002/003 artifact, root doc, `package.json`, tag, release, version, or `main` was modified. Only two new files were created, both under `grimoires/loa/a2a/cycle-004/`: `PRD.md` and this report. Claim-grep gate result is reported by the planner alongside this report.

---

*End of cycle-004 plan-and-analyze report.*
