# CORONA cycle-003 — Sprint S04 Implementation Report

**Sprint**: S04 — T4 Expansion + Bucket Report
**Type**: data-substrate (supply re-verification + honest blocker surfacing); no corpus construction, no code, no scoring, no refit
**Branch**: `cycle-003-s04-t4-expansion` · **Base**: `cycle-003` @ `2fd40ed` (S03) · `main` untouched at `eaaf5e4`
**Date**: 2026-05-30
**Outcome (one line)**: GOES-R-era S1+ proton-event **supply authoritatively re-verified = 46** (matches S01); T4 corpus-record construction and the cascade-bucket distribution are **BLOCKED** (no proton-flux-series source; trigger population underdetermined) — **zero T4 records built, no fabrication**, decision surfaced to the operator.

**Primary artifacts**: [`bucket-report.md`](bucket-report.md) · [`blocker-decision-report.md`](blocker-decision-report.md)

---

## 1. Executive summary

S04 set out to expand the cycle-003 T4 proton-cascade corpus to the honest GOES-R-era S1+ supply ceiling and report a bucket-diversity distribution. The supply side completed authoritatively: the current NOAA NCEI SEP list was re-pulled and defensively parsed, confirming **46** GOES-R-era S1+ events (identical to S01, including the `2024-02-09` S2 row).

The construction side is **honestly blocked**, and the sprint explicitly provided for this outcome ("Real T4 records … *if source and join rules support construction*"; "a blocker/decision report … if T4 construction or bucket join is blocked"). Two independent blockers (full detail in [`blocker-decision-report.md`](blocker-decision-report.md)):

1. The **frozen T4 shape is flare-trigger-shaped** (`trigger_flare_class`, `trigger_flare_peak_time`, `prediction_window_hours`, `proton_flux_observations[]`, `cascade_bucket`). Its `proton_flux_observations[]` requires a real `>=10 MeV` integral-proton flux **time-series** — a source S01 did not verify and that the SEP list does not contain (it has only the per-event **max** pfu). Fabricating a series is forbidden. → **no records built.**
2. An honest **cascade-bucket distribution** needs the M5+ trigger population *including the zero-producing majority*, which the SEP list (proton-producing events only) cannot supply. The only SEP-derivable population is selection-biased; reporting it would invent a spread. → **distribution BLOCKED.**

Per cycle posture, S04 earns no rung, advances no theatre rung, and asserts no calibration-improvement, forecasting-accuracy, predictive-uplift, T1/T2 runtime-sensitivity, L2-readiness, or Baseline-A/B/new-corpus claim.

---

## 2. AC Verification

Acceptance criteria from the binding sprint plan §"Sprint S04" (T4X-1..7) and the operator's S04 task framing. No `COMPLETED` marker is written (the sprint is partial/blocked by design — see §9).

| AC (verbatim / paraphrase) | Status | Evidence |
|---|---|---|
| **T4X-1**: count is **supply-bounded, not 30** — no padding (HAZ-2). | ✓ Met | Supply = **46** (the authoritative figure), never forced toward 30; zero records fabricated to a target. [`bucket-report.md`](bucket-report.md) §1–§2. |
| **T4X-2 / T4X-3**: per-bucket histogram is a *report artifact*, recorded as-is; skew is the honest finding, never optimized by selection. | ⏸ BLOCKED (honest) | The CORONA cascade-bucket histogram is not honestly computable from the SEP supply (no flux series; no zero-producing population) → reported **BLOCKED**, not invented. S-scale magnitude spread reported as-is (no optimization). [`bucket-report.md`](bucket-report.md) §3–§4. |
| **T4X-4**: all primary-tier T4 events satisfy `event_time ≥ 2017-01-01` (no silent pre-2017). | ✓ Met (enforced) | Inclusion filter enforces year ≥ 2017; zero records built, zero pre-2017 admitted. [`bucket-report.md`](bucket-report.md) §1. |
| **T4X-6**: `PRODUCTIVITY_PARAMS` / Wheatland λ / any runtime parameter unchanged; `proton-cascade.js` diff empty; `t4-replay.js`/`t4-bucket-brier.js` read-only. | ✓ Met | No file under `src/`/`scripts/`/`tests/` touched; `git status` shows only the untracked `sprint-04/` dir (§4). |
| **T4X-7**: if S1+ supply is thin, record the limit honestly (underpowered), not padded. | ✓ Met | Thin high-S tail (4×S3, 1×S4, 0×S5) recorded honestly; record/bucket construction BLOCKED + documented, never padded. [`bucket-report.md`](bucket-report.md) §3; [`blocker-decision-report.md`](blocker-decision-report.md). |
| **Operator AC**: T4 GOES-R-era S1+ supply sourced from the **current authoritative** NOAA/NCEI/SWPC SPE list (not the stale umbra mirror). | ✓ Met | NOAA NCEI list (`Last-Modified 2026-01-21`), re-pulled 2026-05-30; umbra mirror confirmed stale, not used. [`bucket-report.md`](bucket-report.md) §1. |
| **Operator AC**: T4 corpus records expanded **honestly** within the cycle-003 namespace. | ⏸ BLOCKED (honest) | Honest expansion impossible without a verified flux-series source or fabrication → zero records, decision surfaced. [`blocker-decision-report.md`](blocker-decision-report.md). |
| **Operator AC**: cascade bucket distribution reported **honestly** from available supply. | ✓ Met (as BLOCKED) | Reported BLOCKED with full rationale; S-scale distinguished from cascade buckets. [`bucket-report.md`](bucket-report.md) §4–§5. |

---

## 3. Tasks

| Task | Description | Status |
|---|---|---|
| S04-T1 | Re-pull + re-verify the current NOAA/NCEI/SWPC SEP list; defensive parse; reconfirm GOES-R-era S1+ count. | ✓ **Done** — 46 confirmed (defensive chunk-by-10, `</tr>`-independent); matches S01 + a WebFetch cross-check. |
| S04-T2 | Build T4 records from authoritative evidence, frozen shape, no fabrication. | ⏸ **BLOCKED** — no `>=10 MeV` flux-series source (S01-unverified; not in SEP list; cannot fabricate). Zero records. |
| S04-T3 | Produce the cascade bucket report `[0-1,2-3,4-6,7-10,11+]`. | ⏸ **BLOCKED** — trigger population underdetermined / selection-biased; reported BLOCKED; S-scale supply characterization provided instead, clearly distinguished. |
| S04-T4 | Update manifest if records created. | ✓ **N/A** — no records → no T4 entries (AC-S04-4 "if created"); manifest left byte-untouched; `corpus_hash` stays null (S06). |
| S04-T5 | Write S04 process/report artifacts. | ✓ **Done** — three reports under `sprint-04/`. |

---

## 4. Files created / changed

**Created (3 new files, all under `grimoires/loa/a2a/cycle-003/sprint-04/`):**
```
grimoires/loa/a2a/cycle-003/sprint-04/implementation-report.md   (this file)
grimoires/loa/a2a/cycle-003/sprint-04/bucket-report.md
grimoires/loa/a2a/cycle-003/sprint-04/blocker-decision-report.md
```

**Changed:** none. **Corpus records created:** **0** (T4 dir holds only its `.gitkeep`). **Manifest:** untouched.

`git status --short`:
```
?? grimoires/loa/a2a/cycle-003/sprint-04/
```
(Only the new sprint-04 directory is untracked. No tracked file modified.)

---

## 5. Validation before stopping (operator checklist)

| Item | Result |
|---|---|
| Active branch | `cycle-003-s04-t4-expansion` |
| Base branch / commit | `cycle-003` @ `2fd40ed0c5a3e0da0a66819271d1c19b390644cb` (S03); `main` untouched at `eaaf5e4` |
| Exact files created / changed | 3 new files under `sprint-04/` (§4); no tracked file changed |
| `git status --short` | `?? grimoires/loa/a2a/cycle-003/sprint-04/` (only) |
| T4 source URL | `https://www.ngdc.noaa.gov/stp/space-weather/interplanetary-data/solar-proton-events/SEP%20page%20code.html` |
| Retrieval date / source status | 2026-05-30; HTTP 200; `Last-Modified 2026-01-21`; last row 2026-01-18 |
| Final source count (GOES-R-era S1+) | **46** (pfu ≥ 10, year ≥ 2017); matches S01 |
| Count of T4 records created | **0** |
| `2024-02-09 1530 / 187 pfu / S2` included? | **Present in the re-verified supply** (row 26; assoc. flare X3.3); not instantiated as a record (zero records built) |
| T4 S-scale **magnitude** distribution (source characterization) | S1:28 · S2:13 · S3:4 · S4:1 · S5:0 (= 46) |
| CORONA T4 **cascade** bucket distribution `[0-1,2-3,4-6,7-10,11+]` | **BLOCKED** — not computed, not invented ([`bucket-report.md`](bucket-report.md) §4) |
| S-scale ≠ cascade bucket statement | Stated explicitly ([`bucket-report.md`](bucket-report.md) §5): the S1–S5 magnitude spread is NOT the cascade-count bucket distribution |
| Source / provenance / retrieval-date coverage | Full (URL + Last-Modified + retrieval date + parse method + per-event associated flare) in [`bucket-report.md`](bucket-report.md) §1–§2 |
| Manifest / hash status | Manifest untouched; top-level `corpus_hash` remains `null` / PENDING (S06); cycle-001 `corpus_hash b1caef3f…` not replaced |
| Forbidden-path audit | No change under `src/`, `scripts/`, `tests/`, `corpus-loader.js`/`t1-replay.js`/`t2-replay.js`/`t4-replay.js`, frozen `corpus/`, `calibration-manifest.json`, cycle-001/002 artifacts, root `prd/sdd/sprint.md`, `ledger.json`, README, BUTTERFREEZONE, `package.json` |
| Frozen corpus tree untouched | ✓ `git status` clean on `grimoires/loa/calibration/corona/corpus/` |
| Frozen invariants | ✓ all 5 (§6) |
| Claim-language grep gate | ✓ 0 matches in sprint-04 artifacts (§7) |
| No code / runtime-replay wiring / scoring / refit / held-out split / commit / push / S05 | ✓ confirmed (none performed) |

---

## 6. Frozen-invariant check (committed-blob sha256; Windows CRLF → hash committed blob, per S03 carryforward)

| Invariant | Expected | Result |
|---|---|---|
| `scripts/corona-backtest.js` blob sha256 | `17f6380b…1730f1` | ✓ MATCH |
| cycle-001 `calibration-manifest.json` blob sha256 | `e53a40d1…5db34a` | ✓ MATCH |
| cycle-001 `corpus_hash` (in committed manifest) | `b1caef3f…11bb1` | ✓ present (not replaced) |
| `package.json` version | `0.2.0` | ✓ |
| RLMF cert version (`src/rlmf/certificates.js`) | `0.1.0` | ✓ |

Verified at S04 pre-flight; no edit to any frozen path occurred during S04 (git status shows only the untracked `sprint-04/` dir), so all remain intact.

---

## 7. Claim-language grep gate (PRD §8 / SDD §9 CSG-9)

The canonical CSG-9 four-phrase honest-framing gate (PRD §8) was run with `grep -niE` over `grimoires/loa/a2a/cycle-003/sprint-04/*.md`.

- **Result: 0 matches.** Each S04 artifact expresses its non-claims as explicit negations using hyphenated, non-canonical forms (e.g., *calibration-improvement*, *forecasting-accuracy*, *verifiable-track-record*), which do not trip the space-separated canonical pattern. No unsafe positive claim appears in any S04 artifact; the cycle-002 "T4 runtime sensitivity only" / v0.2.0 posture is restated, not weakened.

---

## 8. DO-NOT compliance

| Constraint | Result |
|---|---|
| No edit to `src/` / `scripts/` / `tests/` | ✓ |
| No edit to `corpus-loader.js` / `t1-replay.js` / `t2-replay.js` / `t4-replay.js` / runtime/replay code | ✓ |
| No runtime process call as sensitivity evidence; no trajectories | ✓ |
| No scoring / Brier; no backtest as improvement evidence | ✓ |
| No refit; no threshold / base-rate / `PRODUCTIVITY_PARAMS` / σ / formula change | ✓ |
| No held-out split assignment (that is S05) | ✓ |
| Frozen cycle-001 corpus tree (`…/corpus/`) not mutated | ✓ |
| cycle-001 / cycle-002 artifacts not mutated | ✓ |
| Root generic Loa docs (`prd.md`/`sdd.md`/`sprint.md`/`ledger.json`) not edited | ✓ |
| README / BUTTERFREEZONE / `package.json` version / tags / releases / `main` not modified | ✓ |
| No forbidden claim (calibration-improvement, empirical-performance, forecasting-accuracy, verifiable-track-record, L2, T1/T2-sensitivity, predictive/Baseline/new-corpus uplift) | ✓ |
| No commit / push | ✓ |
| No S05 started | ✓ |

---

## 9. Known limitations / operator decision (Option B chosen)

- **Operator decision (2026-05-31): Option B.** S04 is accepted as a documented partial/BLOCKED sprint; T4 remains **supply-characterized-only** for cycle-003. T4 scope was **not** expanded inside S04; the Option A′ proof-of-source sanity-sample was **not** run; T4 record construction + the cascade distribution are **deferred to future gated work.** See [`blocker-decision-report.md`](blocker-decision-report.md) §5.
- **Two blockers of different kinds (not conflated).** (1) **T4 record construction** is blocked because it is **unauthorized / under-specified in S04** — proper frozen records require a raw GOES `>=10 MeV` proton-flux time-series + M5+ trigger-window construction that S04 was not authorized to fetch/build (SDD DV-5; HS-9). This is a deferrable scope stop, not impossibility. (2) **The cascade-bucket distribution** is **genuinely not derivable** from the proton-events-only SEP list, because an honest `[0-1,2-3,4-6,7-10,11+]` distribution needs the full M5+ trigger population *including zero-producing windows*, which that list structurally cannot supply (and which a proton-flux fetch would not recover). Detail in [`bucket-report.md`](bucket-report.md) §4.3 and [`blocker-decision-report.md`](blocker-decision-report.md) §2–§3.
- **S01 status is non-verification, not impossibility.** S01 verified the NOAA/NCEI/SWPC **SEP event-list supply** (count = 46, pfu/S-scale source); S01 did **not** verify raw GOES `>=10 MeV` **proton-flux time-series extraction**. Therefore S04 cannot use S01 as authorization/evidence for T4 time-series construction. "S01 did not verify it" means the check was never in S01's scope — equally consistent with a readily-available official NCEI product as with hard work; boundedness is unknown until probed, and S04 (Option B) deliberately did not probe it.
- **Future possible first step (recorded, not executed): Option A′.** A future gated step could run a **bias-free 5-frozen-window proof-of-source sanity-sample** for the raw GOES `>=10 MeV` proton flux (re-derive the 5 existing frozen records' series from the official archive). It would build **no records** and make **no distribution claim** — only discharging the unverified-source premise. Per Option B it is **not executed now** ([`blocker-decision-report.md`](blocker-decision-report.md) §5/§6).
- **Shape-vs-prose mismatch (resolved in favor of the binding spec):** the S04 task prose implied proton-event-shaped records (pfu/S-scale per record); the binding spec requires the flare-trigger-shaped frozen schema. This report followed the binding spec.
- **Manifest T4 note:** the S02-written `per_theatre_targets.T4.cascade_buckets_note` ("S04 work — unblocked by the S01 source") is superseded by this BLOCKED determination; per Option B it was deliberately **not** mutated in S04 (no manifest edit this sprint) — a future gated step or S06 closeout may reconcile it.

---

**STATUS: reviewed (ACCEPT-AS-BLOCKED) + operator-decided (Option B); E1–E3 framing edits applied; ready for `/audit-sprint sprint-S04`.** No commit, no push, no S05. The cycle-002 ceiling — "CORONA demonstrated T4 runtime sensitivity only," v0.2.0 — is preserved unweakened; cycle-003 remains a corpus-shape / data-substrate cycle that earns no new rung.
