# CORONA cycle-003 — Sprint S04 Blocker / Decision Report

**Sprint**: S04 — T4 Expansion + Bucket Report
**Branch**: `cycle-003-s04-t4-expansion` · **Base**: `cycle-003` @ `2fd40ed` (S03)
**Date**: 2026-05-30
**Purpose**: surface, for operator decision at `/review-sprint sprint-S04`, why S04 built **zero T4 corpus records** and reported the cascade-bucket distribution as **BLOCKED** — and what would unblock it. This is the sprint-anticipated "blocker/decision report … if T4 construction or bucket join is blocked."

> **Nothing in this report is a calibration-improvement claim, a forecasting-accuracy claim, a predictive-uplift claim, a T1/T2 runtime-sensitivity claim, an L2-readiness claim, or any Baseline-A/B/new-corpus comparison. No code, scoring, refit, or commit was performed.**

---

## 1. What S04 *did* complete (authoritatively)

- **S04-T1 (source re-verification): DONE.** The current NOAA NCEI SEP list was re-pulled (2026-05-30) and parsed `</tr>`-independently (chunk-by-10 over the `<td>` stream). GOES-R-era S1+ supply = **46**, matching S01 exactly (S-scale S1:28/S2:13/S3:4/S4:1/S5:0; per-year 2017:3, 2021:3, 2022:5, 2023:12, 2024:14, 2025:8, 2026:1). The `2024-02-09` S2 row is present. See [`bucket-report.md`](bucket-report.md) §1–§3.
- **Refinement of an S01 note:** the list's column [5] (Importance: X-Ray/Optical) carries an associated **flare class for 40/46** and a **flare time for 39/46** events (25 are M5+) — so associated flare class/time exist (characterization only); S01's "no flare/CME trigger timestamps" was imprecise.

## 2. Why T4 record construction is BLOCKED (S04-T2) — blocker type: **UNAUTHORIZED / UNDER-SPECIFIED in S04** (not impossibility)

**This is the first of two distinct blockers. It is a scope/authorization blocker, NOT a claim that the work is forever impossible.** Proper frozen T4 records require **raw GOES `>=10 MeV` integral-proton flux time-series** plus **M5+ trigger-window construction** — work S04 (a SMALL sprint) was **not authorized to fetch or build**. (Contrast §3, the cascade-bucket-distribution blocker, which is genuinely not derivable from the SEP list at all.)

The frozen T4 corpus shape (verified against `corpus/primary/T4-proton-cascade/*.json`) is **flare-trigger-shaped**, not proton-event-shaped:

```
trigger_flare_class, trigger_flare_peak_time, prediction_window_hours: 72,
proton_flux_observations[]   <-- a >=10 MeV integral-proton flux TIME-SERIES (multiple samples)
proton_event_count_72h, cascade_bucket, settlement_count
```

Why this is unauthorized / under-specified in S04 (each item is a scope gate, not a dead end):

- **Source is unverified, not unavailable.** The SEP list supplies only the single **maximum** pfu per event — **not** a flux time-series. Building `proton_flux_observations[]` honestly requires the **GOES `>=10 MeV` integral-proton archive** (GOES SEISS / EPS). **S01 verified the NOAA/NCEI/SWPC SEP event-list supply; S01 did NOT verify raw GOES `>=10 MeV` proton-flux time-series extraction** (see §2a). That is a *non-verification* (a check that was never in S01's scope), **not** a demonstration that the archive is out of reach. Because it is unverified, S04 **cannot cite S01 as authorization or evidence** for T4 time-series construction, and making the series load-bearing now would trip **HS-9** (a count/coverage figure becoming load-bearing without sanity-sample verification).
- **The bounded fetch is sprint-plan-gated.** SDD DV-5 reserves any bounded GOES-archive fetch for **explicit sprint-plan authorization**, which S04 (SMALL) does not carry.
- **The trigger-window construction is under-specified.** A principled, non-selection-biased expansion needs the M5+ trigger-population rule pinned (see §3) — an explicit decision S04 was not scoped to make.
- **Fabrication is forbidden.** Hand-authoring a flux series (or tagging the event-aggregate MAX as a single point sample) is barred (sprint: "do not pad, synthesize, duplicate, or fabricate"; HAZ-2). S03 set the cycle-003 standard at *real* fetched series.

→ **No T4 records were constructed.** This is a scope/authorization stop — the work is deferrable to a future gated step (§5/§6), not impossible. Constructing records on this branch without an authorized, verified flux-series source (or by fabrication) would violate the sprint's honesty constraints.

### 2a. Reframing the S01 status (non-verification, not impossibility)

To state the S01 relationship precisely, so it is not misread as a barrier:

- **S01 verified** the NOAA/NCEI/SWPC SEP **event-list supply** (GOES-R-era S1+ count = 46, with the pfu / S-scale source). This is complete and authoritative (see [`bucket-report.md`](bucket-report.md) §1; S01 [`verification-ledger.md`](../sprint-01/verification-ledger.md) F9).
- **S01 did NOT verify** raw GOES `>=10 MeV` **proton-flux time-series extraction** — there is no flux-series verification row in the S01 ledger; the ledger states it "verifies only the S1+ supply count and the pfu/S-scale source." (S01 *did* verify NetCDF series when in scope — XRS for T1, GFZ Kp for T2 — so the capability/host-familiarity exists; the proton-flux series simply was never in S01's scope.)
- **Therefore:** S04 cannot use S01 as authorization or evidence for T4 time-series construction. "S01 did not verify it" means *the check was never run*, which is equally consistent with a trivially-available official NCEI NetCDF product as with genuinely-hard work — the boundedness is **unknown until probed** (§6 / Option A′), and S04 deliberately did not probe it (Option B).

## 3. Why the cascade-bucket distribution is BLOCKED (S04-T3) — blocker type: **GENUINELY NOT DERIVABLE from the SEP list** (a stronger blocker than §2)

**This is the second, distinct blocker. Unlike §2 (a scope/authorization stop that a future authorized fetch could lift), this one is not liftable by any proton-flux fetch** — it is a structural property of the available source. Even granting an authorized, verified GOES flux archive, the honest `[0-1, 2-3, 4-6, 7-10, 11+]` distribution would **still** be blocked, because the missing ingredient is the trigger *denominator*, not the proton series.

- The CORONA buckets count S1+ proton events per **72 h post-M5+-trigger** window. An honest distribution needs the **full M5+ trigger population** — including the **majority of M5+ flares that produce zero proton events** (bucket `0-1` is dominated by these zero-producing windows).
- The proton-events-only SEP list contains **only proton-producing events**, so it **cannot supply the zero-producing windows** at all. The only SEP-derivable population is the **25 proton-productive M5+ flares**, which is **selection-biased** (every such trigger has ≥1 event by construction, so the distribution has no true zeros). Presenting its clustering as "the cascade distribution" = **inventing a bucket spread** (forbidden).
- A proton-flux archive (the §2 ingredient) supplies the proton *series* for known events; it does **not** enumerate the M5+ flares that produced **zero** protons. Recovering the zero-producing denominator requires a **separate full M5+ flare catalogue** (e.g., DONKI FLR / NCEI XRS enumeration) the SEP list cannot substitute for. Hence this blocker stands independent of, and is stronger than, the §2 record-construction blocker.

→ **No bucket spread is asserted, estimated, or invented.** The S-scale magnitude distribution is reported as supply characterization only, explicitly distinguished from the cascade buckets.

## 4. The shape mismatch the operator should be aware of

The S04 task prose framed T4 records around per-event "pfu value, S-scale classification" (proton-event-shaped). The **binding spec** (SDD §6; sprint-plan S04.1; frozen records; loader `validateT4`) requires the **flare-trigger-shaped** frozen schema above. These are different corpus designs. The binding spec governs (the loader would reject proton-event-shaped records lacking `trigger_*` fields; CN-4 requires loader-compatibility). This report followed the binding spec; the mismatch was flagged for the operator, who **confirmed the binding-spec reading and chose Option B** (§5) — T4 deferred, no proton-event-shaped records built.

---

## 5. Options for the operator — **OPERATOR DECISION: OPTION B (chosen 2026-05-31)**

> **DECISION (binding for S04):** the operator chose **Option B** — accept S04 as a documented partial/BLOCKED sprint; T4 remains **supply-characterized-only** for cycle-003. T4 scope is **not** expanded inside S04. The Option A′ proof-of-source sanity-sample is **NOT** executed now. T4 record construction + cascade-bucket distribution are **deferred to future gated work.** Options A / A′ / C below are recorded as paths considered but **not taken** in this sprint.

| # | Option | What it entails | Cost / risk | Status |
|---|--------|-----------------|-------------|--------|
| **B** | **Accept T4 as supply-characterized-only for cycle-003** *(CHOSEN)*. Keep S04 = authoritative supply re-verification (46) + S-scale characterization + BLOCKED cascade buckets. Build no T4 records. S05 treats T4 held-out as **underpowered / supply-only** (already anticipated: HO-6, OQ-3). | Honest, minimal, consistent with the cycle's data-substrate posture and HAZ-2. T4 corpus stays at the frozen 5 events for cycle-003; expansion deferred to a future, separately-gated cycle. | ✅ **CHOSEN 2026-05-31** |
| **A′** | **Bounded proof-of-source sanity-sample only** (future possible first step — see §6). Re-derive the **5 existing frozen records'** `>=10 MeV` flux series from the official GOES archive to *verify the source is retrievable + frozen-compatible*. Builds **no** new records and makes **no** distribution claim; discharges the §2 HS-9 unverified-source premise. | SMALL, bias-free (the 5 windows are pre-chosen), distribution-free. Unblocks only the §2 *record-construction* premise — the §3 cascade-distribution stays blocked regardless. | ⏸ **Not executed (deferred to future gated work)** |
| **A** | **Re-scope T4 construction as a larger sub-sprint.** Authorize a bounded GOES `>=10 MeV` integral-proton flux-series fetch (mirroring S03's ephemeral-venv NCEI pattern), **and** pin the M5+ trigger-selection rule (proton-productive-only vs full-M5+-population + a separate flare catalogue). Then build frozen-shape T4 records + compute the cascade buckets. | S03-scale work, not S04-SMALL. Needs (i) S01-style verification of the proton-flux source, (ii) an explicit trigger-population decision, (iii) a defensible flare catalogue for the zero-producing population. | ⏸ **Deferred to future gated work** |
| **C** | **Proton-productive-only T4 corpus** (build records for the 25 M5+-associated proton events, peak-pfu only). | **Not recommended** — still needs a flux series (peak-only is not the frozen series shape), is selection-biased, and risks the exact "inventing a spread" / fabrication failure modes the sprint forbids. | ❌ **Rejected** |

**Why Option B is the honest, spec-faithful outcome for a corpus-shape / data-substrate cycle:** the supply is authoritatively re-verified (46), the bucket distribution is correctly marked BLOCKED rather than invented, and no flux series is fabricated. Options A / A′ are legitimate **future** paths but require explicit sprint-plan authorization (SDD DV-5) that S04 (SMALL) did not carry; per the operator decision they are deferred, not executed.

---

## 6. Future gated unblock path (NOT executed in S04 — Option B chosen)

This is recorded for a **future, separately-gated** step only. The operator chose Option B, so **none of the below was run in S04.** The recommended entry point is the bias-free **Option A′** sanity-sample (step 1), which is independent of the full Option A expansion (steps 2–5).

1. **Option A′ — bias-free proof-of-source sanity-sample (recommended future first step).** Re-derive the **5 existing frozen records'** (`corpus/primary/T4-proton-cascade/*.json`) `>=10 MeV` flux series from the official GOES archive (GOES-16/18 SEISS, or the GOES-13/15 EPS predecessor for 2017) — confirming the source is retrievable and frozen-compatible per 72 h window with cadence + content verified. This **builds no records and makes no distribution claim**; it only discharges the §2 HS-9 unverified-source premise (turning "S01 did not verify" into "source confirmed retrievable, here is the sanity-sample"). **Not executed in S04.**
2. Pin the trigger-selection rule:
   - **proton-productive M5+ flares** (≤25 events; selection-biased; document the bias), **or**
   - **full GOES-R-era M5+ flare population** (requires a separate M5+ flare catalogue — e.g., DONKI FLR / NCEI XRS enumeration — to capture the zero-producing majority that the §3 distribution blocker requires).
3. Pin the trigger anchor: associated flare time (col [5], available for 39/46) vs a DONKI/XRS-derived peak time.
4. Define the cascade-count rule precisely (dedup window for multi-onset events; the frozen `2017-09-10` note references a "30-min SEP onset dedup window").
5. Then build frozen-shape T4 records + the per-bucket histogram, validate via `loadCorpus` (no loader edit), and update the manifest additively.

> Note: steps 2–5 (full Option A) lift the §2 *record-construction* blocker; the §3 *cascade-distribution* blocker is lifted only once the full zero-producing M5+ population (step 2, full-population reading) is in hand.

---

## 7. State left for review

- **Operator decision (2026-05-31): Option B** — S04 accepted as a documented partial/BLOCKED sprint; T4 supply-characterized-only; no T4 scope expansion in S04; Option A′ not run; T4 record construction + cascade distribution deferred to future gated work. (E1–E3 review-required framing edits applied to the S04 artifacts; no corpus/manifest/code change.)
- **Files added (S04):** `sprint-04/implementation-report.md`, `sprint-04/bucket-report.md`, `sprint-04/blocker-decision-report.md` (+ `sprint-04/engineer-feedback.md`, the senior review). **Zero** corpus records; manifest **untouched** (no records → no T4 entries per AC-S04-4; `corpus_hash` stays null → S06).
- **Frozen invariants:** all intact (see implementation report §frozen-invariant check).
- **No** code edit, runtime/replay wiring, scoring, refit, held-out split, commit, push, or S05.
- The cycle-003 manifest's existing `per_theatre_targets.T4.cascade_buckets_note` (written in S02, saying the buckets are "S04 work — unblocked by the S01 source") is now superseded by this S04 BLOCKED determination. Per Option B it is **left unmutated in S04** (no manifest edit this sprint); a future gated step (or S06 closeout) may reconcile that S02 note. Recorded here so the stale note is not mistaken for a live claim.
