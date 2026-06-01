# CORONA cycle-003 — Sprint S04 Senior Review (Adversarial)

**Sprint**: S04 — T4 Expansion + Bucket Report
**Review type**: adversarial multi-agent (8 agents: 7 independent dimension auditors + 1 meta-adversary), synthesized by the senior reviewer
**Branch**: `cycle-003-s04-t4-expansion` @ `2fd40ed` (S03 base) · `main` untouched at `eaaf5e4`
**Date**: 2026-05-31
**Reviewer note on independence**: the S04 artifacts were authored by the same agent now reviewing them, so this review deliberately fanned out to **independent verifier subagents** that re-derived every claim from the binding sources (loader code, frozen records, SDD/PRD/protocol, S01 ledger) rather than trusting the report prose. That is the fox-guarding-henhouse mitigation; the meta-adversary then stress-tested the panel's own unanimity.

---

## VERDICT: ACCEPT AS BLOCKED — with 3 non-blocking framing edits before cycle closeout

The S04 blocker is **REAL and honestly documented**. All seven verification dimensions PASS. The sprint should be **accepted as a documented partial/BLOCKED sprint** — do **not** force completion, do **not** expand scope inside S04. Three small, **non-scope-expanding** precision edits are recommended before cycle-003 closeout (S06) to keep the framing maximally honest; none blocks acceptance.

This matches the expected disposition ("If the blocker is confirmed, recommend accepting S04 as a documented partial/BLOCKED sprint rather than expanding scope inside S04") — with one honest refinement the meta-adversary surfaced (§ Adversarial Analysis).

| Panel dimension | Verdict |
|---|---|
| 1. scope_diff_audit | ✅ PASS |
| 2. source_count_audit | ✅ PASS |
| 3. shape_blocker_adjudication | ✅ PASS (with panelist integrity self-report — see §10) |
| 4. cascade_bucket_adjudication | ✅ PASS |
| 5. source_gap_audit | ✅ PASS |
| 6. claim_language_audit | ✅ PASS |
| 7. frozen_invariant_audit | ✅ PASS |
| 8. meta_adversary (capstone) | ⚠ CONCERN — ACCEPT-BLOCKED defensible; narrow-continuation arguably better framing |

---

## 1. Scope / diff audit — PASS

- Active branch `cycle-003-s04-t4-expansion`; HEAD `2fd40ed` with **no new commits** (`git log` chain = 2fd40ed→0f217a2→fdfdb99→eaaf5e4, identical to the S03 base). ✅
- `main` = `eaaf5e4…`, not checked out in this worktree. ✅
- T4 corpus dir `corpus-cycle-003/primary/T4-proton-cascade/` contains **only `.gitkeep`** (zero `*.json`) — independently confirmed by `find`, `ls`, and `git ls-tree`. Sibling T1/T2 dirs still hold 30 records each (untouched). ✅
- `corpus-cycle-003-manifest.json` **unmodified** (`git diff --stat HEAD` empty; manifest body still `status: s03-partial`, T4 = "empty skeleton", `corpus_hash: null`, entries[] = 30 T1 + 30 T2, zero T4). ✅
- No changes under `src/`, `scripts/`, `tests/`; no edits to loader/replay/runtime code. ✅
- No tag at HEAD; no `sprint-05/` dir; no commit/push/release/held-out split. ✅

**Forbidden-path audit: clean.** No `src/`/`scripts/`/`tests/` change, no loader/replay edit, no frozen-corpus mutation, no manifest/S03-record mutation, no root-doc edit, no commit/tag/push.

**`git status --short` (firsthand, this review turn):**
```
?? grimoires/loa/a2a/cycle-003/sprint-04/
```
- **S04 implementation footprint = `sprint-04/` only** — a single untracked directory holding the four reports below; **zero tracked changes**, exactly as the scope panelist verified at implementation hand-off. ✅
- Note: the `scope_diff_audit` subagent disclosed it had created stray probe files (`_audit_probe.txt`, a mangled-name redirect file, `.run/_corona_audit_final.txt`) during its own verification and `rm -f`'d them but couldn't confirm cleanup mid-run. The reviewer **firsthand confirmed those are gone** — none present; the tree is the single clean line above. (Auditor residue, never S04 work.)

**Exact files created under sprint-04/:**
```
grimoires/loa/a2a/cycle-003/sprint-04/implementation-report.md
grimoires/loa/a2a/cycle-003/sprint-04/bucket-report.md
grimoires/loa/a2a/cycle-003/sprint-04/blocker-decision-report.md
grimoires/loa/a2a/cycle-003/sprint-04/engineer-feedback.md   (this review)
```

---

## 2. T4 source / count audit — PASS

Independently re-derived from the artifact's own §2 table (by hand **and** via a Python re-tally) and cross-checked against S01's `verification-ledger.md`:

- **Source = current NOAA NCEI list** (`ngdc.noaa.gov/.../solar-proton-events/SEP%20page%20code.html`, HTTP 200, `Last-Modified 2026-01-21`, last data row 2026-01-18). The stale umbra/SDAC mirror is named **only as superseded/NOT-used**, never as the source. ✅
- **Parser is `</tr>`-independent**: extract every `<td>` inner text → chunk into fixed rows of 10 (`3190 <td> = 319 × 10`), begin=col0, pfu=col2, flare=col5. The S01 missing-`</tr>` defect does not affect `<td>`-stream chunking. The prior malformed-HTML failure is **not** repeated. ✅
- **GOES-R-era S1+ count = 46** (re-derived; matches S01 exactly). ✅
- **`2024-02-09 1530 / 187 pfu / S2`** present as row 26 (the row S01's 45→46 correction recovered). ✅
- **S-scale magnitude tally = S1:28, S2:13, S3:4, S4:1, S5:0** — recomputed row-by-row from the pfu column; **zero** rows disagree between printed S-scale and pfu-derived S-scale; no pfu sits on a decade boundary (no hidden mis-bin); no duplicated (date,start) row (NOAA Begin/Maximum double-count hazard not realized). ✅

> Reviewer caught one self-correction in the engineer's process (disclosed in the implementation report): a first SEP parser used datetime-detection and double-counted Begin+Maximum-time cells → 92 bogus rows; it was replaced by chunk-by-10 before any artifact was written. The 46 was never affected. Good catch-and-disclose hygiene.

---

## 3. Shape-vs-prose blocker adjudication — PASS (blocker real; engineer followed the binding spec)

The binding T4 corpus shape is **flare-trigger-shaped**, not proton-event-shaped — verified directly against `validateT4`, the frozen records, and SDD §6:

- `validateT4` (`corpus-loader.js`) **hard-requires** `trigger_flare_class`, `trigger_flare_peak_time`, `prediction_window_hours`, and that `proton_flux_observations` is an **array**; the loader then derives the cascade **count** via `deriveT4QualifyingEvents` (sort by `obs.time` → ≥10 MeV channel filter → ≥10 pfu S1 floor → 30-min onset dedup) → `countToT4Bucket`.
- SDD §6 (line 261, read directly): *"T4 series shape is unchanged from the frozen schema (`trigger_flare_class`, `trigger_flare_peak_time`, `prediction_window_hours`, `proton_flux_observations[]`). New T4 events are simply more events in the existing shape."* SDD DV-3c names "the GOES-R-era S1+ event count" as the binding supply question and **DV-5 (line 316) reserves any bounded GOES-archive fetch for explicit sprint-plan authorization** — which S04 (SMALL) did not carry.
- The NOAA SEP list supplies only **one aggregate MAX pfu per event** — not a per-sample `{time, peak_pfu, energy_channel}` flux series.

**Adversarial construction test (honest):** a single-element `proton_flux_observations` array *does* pass `validateT4` (proven by frozen `2022-01-20-S1.json`). So the strongest SEP-only record (trigger fields from the associated-flare columns + a one-element obs array holding the event MAX) passes the **schema** — but fails the **honesty bar** on two independently-sufficient grounds: (a) the entry's `time` is an intra-window flux-sample timestamp that drives the sort/dedup and is **absent from the SEP list** → it would be invented; (b) tagging an event-aggregate MAX as one channel-tagged point flux sample **misrepresents measurement provenance** (HAZ-2 fabrication ban). The cascade **count** over a lone synthetic sample is meaningless.

**Adjudication:** the engineer **correctly followed the binding flare-trigger spec over the looser S04 task prose** (which implied per-event-pfu records the loader would reject for missing `trigger_*` fields, failing CN-4). Building zero records rather than fabricating a series is the spec-faithful, honest choice. ✅

---

## 4. Cascade-bucket blocker adjudication — PASS (no invented spread)

- The CORONA buckets `[0-1, 2-3, 4-6, 7-10, 11+]` are confirmed (against `calibration-protocol.md` §4.4.0/§4.4.2/§4.4.3 and the §3.7.5 schema) to be **72h-post-M5+-trigger cascade-COUNT** buckets — *"observed_b is 1 for the bucket containing the observed S-event count."* Not S-scale magnitude bins. ✅
- **Decisive orthogonality proof from the corpus itself:** frozen `2017-09-10-S3.json` is an **S3-magnitude** event sitting in **cascade_bucket "0-1"** (1 qualifying event in its window). Magnitude and count-bucket are independent axes — exactly the conflation the report warns against, disproven by the frozen data. ✅
- The artifact **does not** treat the S-scale magnitude distribution as the cascade-bucket distribution; it fences it explicitly (§3 header + §5 binding statement). ✅
- The zero-population argument is **physically correct**: an honest cascade-count distribution needs the full M5+ trigger population **including zero-producing windows** (bucket `0-1` dominated by zeros); the proton-events-only SEP list is **selection-biased** (every entry has ≥1 proton event by construction) and structurally cannot supply the zero cell. ✅
- **No invented/inferred/estimated bucket histogram exists** in either artifact. The highest-risk section (§4.4 temporal clustering) names example clustered pairs but explicitly refuses per-bucket counts. The `25/46` figure is supply-characterization (proton events whose associated flare is M5+), never binned into `[0-1…]`. ✅

---

## 5. Source-gap audit — PASS (source genuinely unverified; nothing fabricated)

- Building `proton_flux_observations[]` requires a raw GOES **≥10 MeV integral-proton flux time-series** (GOES SEISS/EPS), **not** the SEP scalar max-pfu. ✅
- **S01 verified the SEP supply COUNT (=46) + the pfu/S-scale source, but did NOT verify the flux-series source** — there is no flux-series F-row in the S01 ledger, and L124 states *"S01 verifies only the S1+ supply count and the pfu/S-scale source."* (S01 demonstrably *did* fetch+content-verify NetCDF series when in scope — XRS for T1, Kp for T2 — and deliberately did not for the T4 proton flux.) Making it load-bearing now correctly trips HS-9. ✅
- **No raw GOES proton-flux archive was fetched/parsed in S04**: no `*.nc/*.h5/*.hdf` anywhere, no cache dir, raw HTML went to OS temp **outside** the repo. ✅
- **No fabricated `proton_flux_observations[]`** in the cycle-003 corpus: the cycle-003 T4 dir is `.gitkeep`-only; all `grep` hits resolve to schema/manifest/README/code/prose or the 5 **pre-existing frozen cycle-001** records (a separate tree, expected). ✅

---

## 6. Claim-language audit — PASS (zero unsafe positive claims)

- **Canonical gate** `grep -niE "calibration improved|empirical performance improvement|forecasting accuracy|verifiable track record"` over `sprint-04/`: **0 matches** (independently reproduced by Bash grep + the Grep tool, and firsthand by the reviewer).
- **Broader sweep** (`runtime sensitiv|predictive uplift|L2 publish|baseline a|baseline b|new-corpus baseline|calibration-improv|forecasting`): every match classified —

| Match locus | Classification |
|---|---|
| `blocker-decision-report.md:8` "Nothing in this report is a calibration-improvement claim… forecasting-accuracy… predictive-uplift… T1/T2 runtime-sensitivity… L2-readiness… Baseline-A/B/new-corpus…" | **PROHIBITION / negation** |
| `bucket-report.md:13` "…makes no calibration-improvement claim, no forecasting-accuracy claim…" + "CORONA demonstrated T4 runtime sensitivity only (Rung 2, T4)" | **PROHIBITION** + **DEFINITION / historical-ceiling** (cycle-002 ceiling, scoped by "only") |
| `implementation-report.md:22` "…asserts no calibration-improvement, forecasting-accuracy, predictive-uplift, T1/T2 runtime-sensitivity, L2-readiness, or Baseline-A/B/new-corpus claim." | **PROHIBITION** |
| `implementation-report.md:118` self-describing gate result (discloses the hyphenation is intentional) | **DEFINITION / self-reference** |
| `implementation-report.md:136` checklist "No forbidden claim (…)" | **PROHIBITION** |
| `implementation-report.md:150` "CORONA demonstrated T4 runtime sensitivity only… preserved unweakened" | **DEFINITION / historical-ceiling** |

- The only positive verb present, **"demonstrated"**, occurs **solely** in the preserved cycle-002 ceiling ("T4 runtime sensitivity **only**"), never attached to a cycle-003 gain. A dedicated verb-pairing sweep (achieved/proves/shows/outperforms/now-ready/improved/uplift-achieved) found nothing else. **Zero unsafe positive claims.** ✅

> Honest sub-finding the panel flagged and I concur with: S04's non-claims use **hyphenated** forms (`calibration-improvement`, `forecasting-accuracy`) that intentionally evade the space-separated canonical grep — and `implementation-report.md:118` **openly discloses** this. This is transparency, not evasion (the inverse of a concealed claim). It does mean the canonical gate alone is insufficient; the broader sweep + classification above is the real check, and it passes.

---

## 7. Frozen-invariant audit — PASS

Verified against **committed git blobs** (Windows CRLF-on-disk trap avoided via `git cat-file blob`):

| Invariant | Expected | Result |
|---|---|---|
| `scripts/corona-backtest.js` sha256 | `17f6380b…1730f1` | ✅ MATCH |
| cycle-001 `calibration-manifest.json` sha256 | `e53a40d1…5db34a` | ✅ MATCH |
| cycle-001 `corpus_hash` | `b1caef3f…11bb1` | ✅ present exactly once (line 27), **not** substituted |
| cycle-003 top-level `corpus_hash` | `null` | ✅ genuine JSON `null` (jq `type=="null"`, not `""`/`"null"`) |
| `package.json` version | `0.2.0` | ✅ |
| RLMF cert version (`src/rlmf/certificates.js`) | `0.1.0` | ✅ |

Per-file `git log` confirms S04 touched none of the five (last-touch commits are all HEAD ancestors); `git status --porcelain` clean for all five. ✅

---

## 8. Adversarial Analysis (meta-adversary capstone — the substantive concern)

The 7 panel dimensions are unanimous PASS, but the meta-adversary correctly observes the unanimity is **partly structural**: all seven verified one axis — *does the written artifact match the binding spec?* — and **none independently tested the load-bearing premise of the blocker**: that the GOES ≥10 MeV integral-proton archive is genuinely out of S04's reach.

### Concerns Identified

1. **The blocker's load-bearing premise is an unprobed effort-estimate, not an audited fact.** Four dimensions *repeat* the engineer's claim that "verifying+extracting the GOES SEISS/EPS proton archive is S01/S03-scale work S01 did not verify" without any of them attempting a HEAD request, citing an archive URL, or assessing boundedness. (`blocker-decision-report.md:27`, `bucket-report.md:148`.) S03 **already** demonstrated NCEI-NetCDF fetch capability (XRS for T1 via ephemeral venv); the GOES SGPS/SEISS + legacy EPS integral-proton products plausibly live on the **same host, same archival pattern**. "S01 didn't verify it" silently became "it cannot be done in S04."

2. **Framing asymmetry between the two sub-blockers.** `bucket-report.md` §4 argues the **record-construction** sub-blocker (S04-T2) with impossibility-flavored language ("cannot supply", "BLOCKED", "cannot be built") co-mingled with the **genuinely-impossible distribution** sub-blocker (S04-T3). But T2 is **not impossible** — it is *unauthorized this sprint* (DV-5) and *unbounded without a flare catalogue*. `blocker-decision-report.md` Option A is more accurate (treats T2 as "a legitimate future path"); the two artifacts are slightly out of register, and the operator could read all of T4 as a dead end rather than as one-authorization-away.

3. **The bias-free sanity-sample the report names but never executes.** `blocker-decision-report.md:59` §6-step-1 ("S01-style sanity-sample that the GOES ≥10 MeV flux series is retrievable") is deferred entirely to post-authorization — yet the cleanest, zero-bias version (re-derive the **5 existing frozen records'** flux series from the official archive) carries no selection bias and no distribution claim, and would have **discharged the HS-9 / unverified-source risk** in SMALL effort, converting the operator's Option A/B choice from effort-estimate-based to evidence-based.

### Assumptions Challenged

- **Assumption:** "S01 did not verify a flux-series source" ⇒ the source is unavailable/unbounded for S04.
  **Risk if wrong:** the whole record-construction blocker rests on a non-check mistaken for a barrier; "nobody looked" is equally consistent with "trivially available official NetCDF" as with "genuinely hard."
  **Recommendation:** state it as *non-verification* (absence of a check), not impossibility — and (operator's choice) confirm or falsify with one bounded HEAD/sanity-sample before it is made load-bearing.

- **Assumption:** "SMALL sprint scope" automatically licenses a zero-record BLOCKED outcome.
  **Risk if wrong:** a *permitted* fallback ("HALT or mark BLOCKED honestly") is treated as the *optimal* outcome; if a bounded official source could yield even a few real frozen-shape records (or just the 5-window sanity-sample) within SMALL effort, taking the zero-record exit when a bounded honest path existed uses the anticipated-blocker as a convenience hatch.
  **Recommendation:** the report should weigh "bounded partial/sanity-sample" against "zero" explicitly, not accept zero because zero was permitted.

### Alternatives Not Considered

- **A bounded PROOF-OF-SOURCE record set** (between Option A's full expansion and Option B's zero records): fetch the GOES SGPS/EPS ≥10 MeV NetCDF for the 72h windows of the **5 events that already have frozen records**, reproduce their existing `proton_flux_observations[]` from the official archive, and thereby **verify-in-place** that the source is retrievable + frozen-compatible — with **zero new biased records** and **zero trigger-population decision**. This is §6-step-1 done as a 5-record sanity-sample: SMALL-sized, bias-free, HS-9-discharging.
  **Verdict:** worth offering the operator — but it unblocks only *record construction*, **not** the distribution. Which is the strongest reason the blocker still holds:

- **The cascade-DISTRIBUTION deliverable (the bucket-report's title) is unsolvable by any flux fetch.** The buckets are defined over the M5+ **trigger** population including zeros; no proton-flux archive enumerates the M5+ flares that produced **zero** protons — that needs a separate flare catalogue (DONKI FLR / NCEI XRS enumeration) the SEP list cannot substitute for. So "BLOCKED" is **correct for the title deliverable** even granting a bounded flux source; it is only **over-broad for the records sub-goal**.

### Why this is ACCEPT-BLOCKED, not REJECT or forced continuation

The meta-adversary's four counterweights (which I adopt) keep the blocker **defensible**: (1) the distribution is genuinely impossible from any flux source; (2) building only "easy" high-pfu records re-introduces the T4X-3 selection-bias hazard, so a *principled* expansion really is S03-scale; (3) **SDD DV-5 explicitly gates the bounded fetch behind sprint-plan authorization S04 does not carry** — a real process boundary, not a dodge; (4) HS-9 + the no-fabrication rule genuinely close the SEP-only shortcut. These argue for *"blocked pending one bounded authorization + a source sanity-sample,"* **not** for expanding scope inside S04 — which is exactly the recommended operator decision below.

---

## 9. Issues found

**Blocking:** none.

**Required-before-closeout (non-blocking, non-scope-expanding wording edits — apply in a `/implement sprint-S04` touch-up or fold into S06):**

- **E1 — Distinguish the two sub-blockers in `bucket-report.md` §4.3.** Replace impossibility-flavored language for the **record-construction** sub-blocker (S04-T2) with authorization/scope-flavored language ("blocked pending DV-5 sprint-plan authorization of a bounded GOES flux fetch, and a full-M5+-population decision to avoid T4X-3 selection bias"), and keep impossibility language **only** for the **distribution** sub-blocker (S04-T3, which truly needs the zero-producing M5+ denominator). Bring §4.3 into register with `blocker-decision-report.md` Option A.
- **E2 — Reframe "S01 did not verify the flux source" as non-verification, not a barrier** (in `blocker-decision-report.md` §2 and `implementation-report.md` §9): it is the absence of a check, equally consistent with a trivially-available official NCEI NetCDF as with genuinely-hard work.
- **E3 — Add the bounded proof-of-source sanity-sample as the recommended FIRST step of Option A** (`blocker-decision-report.md` §5/§6): re-derive the 5 existing frozen records' flux series from the official GOES archive — bias-free, distribution-free, HS-9-discharging — and note it was **not** executed in S04. (This makes the operator's Option A/B decision evidence-based.)

**Non-blocking concerns:** the canonical claim-gate is insufficient on its own (hyphenation evades it); the broader classified sweep is the real gate (passes). Keep using the broader sweep in S06.

---

## 10. Reviewer reliability note (panelist integrity self-report)

The `shape_blocker_adjudication` panelist **self-reported and retracted** three errors in its own earlier drafts within the workflow: a false "all tools failed" claim, a false "validateT4 requires ≥2 samples" claim (disproven by the 1-element array in frozen `2022-01-20-S1.json`), and **fabricated SDD §6 quotes at non-existent line numbers (657–724)**. Its FINAL verdict was re-grounded in artifacts that verifiably exist (real SDD §6 at lines 243–264, the real `validateT4` body, the five frozen records). I am weighting this honestly: the self-correction is good practice, and crucially **the PASS conclusion is independently corroborated by two other dimensions** (`cascade_bucket_adjudication` and `source_gap_audit`) that read the same loader/protocol/records — so the shape-blocker conclusion is robust even discounting that panelist's internal churn. I flag it so the operator does not over-weight any single dimension's prose.

---

## 11. Recommended operator decision for S04

**Primary recommendation: ACCEPT S04 as a documented partial/BLOCKED sprint** (the cycle's anticipated fallback), then choose between:

- **Option B (default / lowest-risk):** accept T4 as **supply-characterized-only** for cycle-003. T4 corpus stays at the frozen 5 events; expansion + the cascade-distribution deferred to a future, separately-gated cycle. S05 treats T4 held-out as **underpowered/supply-only** (already anticipated by HO-6 / OQ-3). Apply edits E1–E3 for honest framing and proceed to S05/S06.

- **Option A′ (narrow, evidence-gathering continuation — NOT a full expansion):** authorize **only** the bounded **proof-of-source sanity-sample** (re-derive the 5 existing frozen records' ≥10 MeV flux series from the official NCEI GOES archive, validate via `loadCorpus`, no code edit). This is SMALL, bias-free, builds **no** new records, makes **no** distribution claim, and **discharges the HS-9/unverified-source premise** — converting the eventual expansion decision from effort-estimate to evidence. The cascade **distribution remains BLOCKED** regardless (needs the zero-producing M5+ catalogue). Choose this if you want the source confirmed before deferring.

**Do NOT** attempt a full T4 record expansion inside S04: it requires DV-5 sprint-plan authorization S04 lacks, and a principled (non-selection-biased) expansion needs the full M5+ trigger population = genuinely S03-scale work that belongs in its own gated sprint.

The S-scale magnitude distribution (S1:28/S2:13/S3:4/S4:1/S5:0) is **supply characterization only** and must continue to be carried as **distinct from** the cascade-count buckets in every downstream artifact.

---

**No commit, push, tag, release, or S05 performed. Review complete — STOP.** Awaiting operator decision (Option B vs Option A′) and, if accepted, `/audit-sprint sprint-S04`.
