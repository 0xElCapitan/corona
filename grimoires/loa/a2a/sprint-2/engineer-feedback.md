# Sprint 2 Review Feedback — CORONA cycle-001-corona-v3-calibration

**Reviewer:** Senior tech lead (adversarial protocol)
**Round 2 verdict:** **All good** — APPROVED
**Round 1 verdict (historical):** CHANGES REQUIRED — see Round 1 history section below
**Date (Round 2):** 2026-04-30
**Beads tasks reviewed:** corona-b5v, corona-2bv, corona-19q, corona-fnb, corona-31y (epic corona-1so)

---

## All good

Sprint 2 has been reviewed and approved. All Round 1 concerns (C1, C3, C4 blocking; C2 informational) addressed cleanly. All 12 acceptance criteria from sprint.md remain `✓ Met`; Round 2 fixes strengthened the evidence behind ACs 6 (corpus eligibility), 8 (T3 metric), 9 (T4 buckets), and 10 (T5 metric) without changing the verdict.

The operator may proceed to `/audit-sprint sprint-2`.

---

## Round 2 Verification (Phase 3 — Previous Feedback)

Round 1 returned `CHANGES_REQUIRED` with three blocking concerns and one informational. Round 2 verification reads the actual files, not the engineer's report.

### C1 — T4 prediction window: ✓ RESOLVED

**Round 1 finding**: §4.4 specified the qualifying-event criterion but didn't bind the prediction-window length. Code defaulted to 72h (`proton-cascade.js:185`) but the freeze didn't say so.

**Round 2 verification**:
- New §4.4.0 "Prediction window" present at calibration-protocol.md:273-278.
- Verbatim quotes confirm:
  - "**Window length**: **72 hours** from the M5+ trigger time" (line 275).
  - "The bucket count is the number of qualifying S-scale proton events ... observed within this full 72-hour post-trigger window — **NOT a sub-window or a sliding window**" (line 275). ✓ Operator's "make clear whether bucket count is over the full 72h post-trigger window" requirement met explicitly.
  - "**Code binding**: `src/theatres/proton-cascade.js:185` defaults `window_hours = 72`. The default IS the freeze" (line 276). ✓ Operator's "default should match code: 72h" requirement met with code-line citation.
  - Sprint 3 contract + override discipline (manifest-entry requirement) at lines 277-278 close the loophole where Sprint 3 could pick a different window without manifest accountability.
- **Verdict**: Concern fully closed.

### C3 — WSA-Enlil-null moved to corpus eligibility: ✓ RESOLVED

**Round 1 finding**: §3.2 #2 T3 required "prediction present" but §4.3.5 separately filtered events with null predictions at scoring time. Hidden filtering — directly counter to operator focus area 3.3.

**Round 2 verification**:
- §3.2 #2 T3 at calibration-protocol.md:56 now reads (verbatim): "WSA-Enlil prediction record (DONKI) is present **with a non-null forecast arrival time** ... Events where WSA-Enlil ran but produced a null/non-converged prediction (e.g., complex multi-CME interaction, halo-angle metadata absent) are NOT primary-corpus eligible — they go to secondary corpus per §3.3 if the L1 observation is preserved, but do not enter T3 primary scoring. **This is corpus eligibility, not scoring-layer filtering**: a primary-corpus T3 event always has a usable forecast value." ✓ Operator's "documented as a corpus eligibility rule, not hidden filtering" requirement met explicitly.
- Old §4.3.5 "Outlier handling" subsection deleted. `grep -n "§4\.3\.5\|§4\.3\.6\|n_excluded_null\|outlier handling" calibration-protocol.md` returns ZERO matches. Stale references at §4.3.1 (line 148) updated to point to §3.2 #2 T3 instead.
- New §4.3.5 (formerly §4.3.6) at calibration-protocol.md:263-267:
  - Result shape now `{ mae_hours, within_6h_hit_rate, glancing_blow_within_12h_hit_rate, mean_z_score, n_events }` — `n_excluded_null` field removed (line 266).
  - Explicit "**No scoring-layer filtering**: every primary-corpus T3 event has a non-null WSA-Enlil forecast value per §3.2 #2 T3. The harness MUST score every primary-corpus event; there is no 'excluded outlier' bucket. Events with null forecasts are screened out at corpus-load time, not at scoring time." (line 267).
- **Verdict**: Concern fully closed. The "hidden filtering" failure mode is structurally impossible now: corpus eligibility excludes null-prediction events, and the scoring layer asserts every loaded event must score.

### C4 — T5 corpus annotation schema: ✓ RESOLVED

**Round 1 finding**: §4.5.1 referenced corpus annotations (`t_actual_staleness_onset`, switch events, corroboration refs) that §3 didn't enumerate. Sprint 3 would have to invent the schema.

**Round 2 verification**:
- New §3.7 "Required corpus annotations per theatre" at calibration-protocol.md:108-195 with 6 sub-sections:
  - §3.7.1 Common envelope (line 112): 8 fields covering every theatre.
  - §3.7.2 T1 (line 127): 8 fields including `flare_class_observed`, `flare_peak_time`, `flare_peak_xray_flux`, `donki_flr_class_type`, `bucket_observed`.
  - §3.7.3 T2 (line 140): 8 fields including `kp_swpc_observed`, `kp_gfz_observed` (with explicit GFZ-lag null-permission cross-ref to §3.6), `donki_gst_id`, `g_scale_observed`, `bucket_observed`.
  - §3.7.4 T3 (line 153): 8 fields including `wsa_enlil_predicted_arrival_time` (cross-referenced to §3.2 #2 T3 non-null requirement, closing the C3 gap from the corpus side too), `wsa_enlil_sigma_hours`, `wsa_enlil_halo_angle_degrees`, `glancing_blow_flag` (derived at corpus-load time per cross-reference at line 158), `observed_l1_shock_time`, `observed_l1_source`.
  - §3.7.5 T4 (line 166): 7 fields including `prediction_window_hours` (MUST be 72 per §4.4.0 — cross-references the C1 fix), `proton_flux_observations` (array shape with time/peak_pfu/energy_channel/satellite per element), `qualifying_event_count_observed`, `bucket_observed`.
  - §3.7.6 T5 (line 178): 8 fields covering EVERY operator-listed requirement:

| Operator-listed field | Protocol §3.7.6 location |
|----|----|
| actual stale-feed onset time | `stale_feed_events[].actual_onset_time` (line 189) |
| detection time | `stale_feed_events[].detection_time` (line 189) — for stale-feed detection; `divergence_signals[].signal_time` (line 187) — for divergence detection |
| resolution time | `divergence_signals[].signal_resolution_time` (line 187) — divergence resolution; `stale_feed_events[].end_time` (line 189) — stale-feed end |
| satellite switch event flag/time | `satellite_switch_events[].switch_time` + `from`/`to`/`reason`/`transition_end_time` (line 190) |
| corroborating bulletin/source reference | `corroborating_alerts[].source/alert_id/time` (line 188) + `anomaly_bulletin_refs[].source/bulletin_id` (line 191) |
| false-positive ground truth label | `divergence_signals[].false_positive_label` (line 187) |
| anomaly classification, if applicable | `divergence_signals[].anomaly_classification` (line 187) + `anomaly_bulletin_refs[].classification` (line 191) |

- **Bonus**: §3.7.6 "Construction note" (line 193) clarifies that T5 corpus events are time-windowed envelopes, not individual signals — closes a structural ambiguity that would have surfaced as a new concern in Round 2 if absent.
- **Cross-cutting**: every Sprint 3 corpus-loader (`corona-1ks`) input is now schema-typed; every Sprint 3 scoring module (`corona-2iu`, `corona-70s`, `corona-aqh`) has typed inputs that match the per-theatre §4.x result-shape requirements.
- **Verdict**: Concern fully closed. The "Sprint 3 inventing scoring semantics" failure mode is now structurally impossible: every annotation Sprint 3 needs is enumerated in §3.7.

### C2 — spec/construct.json T4 stale resolution string: ✓ RESOLVED (informational)

**Round 1 finding**: `spec/construct.json` T4 entry had `"resolution": "Flare event count"` — stale post-Sprint-2 proxy retirement. Operator gave conditional permission: "if fixing the string is harmless and does not violate the legacy-preservation constraint, you may update only that stale description."

**Round 2 verification**:
- Engineer's harm-check methodology: `grep -rn "spec/construct.json"` across `*.js`/`*.json`/`*.sh`/`*.yaml`/`*.yml`/`*.md` returns no runtime/test/script consumer (one match at `src/theatres/proton-cascade.js:34` is a docstring reference only). `construct.yaml` is the v3 canonical source per its self-documentation. ✓ No collateral.
- Sprint 0 / `corona-222` precedent verified at `grimoires/loa/calibration/corona/sprint-0-notes.md`: Sprint 0 fixed T4 description in same legacy file ("T4 description fixed (R-scale drift) but file retained"). Round 2 follows the same surgical-edit posture.
- Actual fix: `spec/construct.json` T4 entry now reads `"resolution": "GOES integral proton flux (S-scale ≥10 MeV; legacy spec — see construct.yaml + calibration-protocol.md §4.4 for canonical)"`. Verified by grep:
  ```
  grep "Flare event count" spec/construct.json
  ```
  returns no match.
- **Verdict**: Concern fully closed. Legacy file remains otherwise unchanged; the resolution string now points future readers to canonical sources.

### Validator + Tests

| Check | Round 1 | Round 2 |
|-------|---------|---------|
| `./scripts/construct-validate.sh construct.yaml` | OK | OK |
| `node --test tests/corona_test.js` | 70/70 pass | 70/70 pass |
| Stale §-refs after §4.3.5 deletion | (would have failed) | ZERO matches |

No code changes between Round 1 and Round 2; tests are byte-identical. Validator unchanged because construct.yaml T4 buckets/settlement comments were already updated in Round 1.

---

## Adversarial Analysis (Round 2)

Round 1 surfaced 5 concerns (C1-C5; C2 informational, C5 was a rollup of C1+C3+C4). Round 2 closes all five at the freeze contract. Below are the new concerns I evaluated against Round 2 — three minor items, all NON-BLOCKING.

### Concerns Identified (Round 2 — minimum 3)

1. **C6 (NON-BLOCKING)** — §3.7 "derived at corpus-load time" fields don't name the owning Sprint 3 module. `glancing_blow_flag`, `bucket_observed`, `qualifying_event_count_observed` are all marked "derived" but the protocol doesn't say "Sprint 3 / `corona-1ks` (corpus-loader-validate) computes these" explicitly. Sprint 3 will figure it out from the §4.x scoring-module references, but a one-liner in §3.7.1 saying "Sprint 3 / `corona-1ks` is the canonical owner of all `derived` fields; per-theatre derivation logic lives in the corpus-loader, not in scoring modules" would be tighter. Not blocking — Sprint 3's task `corona-1ks` is unambiguous from sprint.md.

2. **C7 (NON-BLOCKING)** — §3.7.4 T3 `wsa_enlil_sigma_hours: null` fallback to "Sprint 4 literature prior" creates a Sprint 3 → Sprint 4 sequencing dependency for the z_score field of the T3 result shape (§4.3.3 line 165). Sprint 3 can't compute z_score for events with null sigma until Sprint 4 grounds the prior. Two options for Sprint 3: (a) compute z_score = NaN for null-sigma events and report; (b) use a placeholder constant (e.g., 14h midpoint of BFZ's 10-18h range) with a NOTES.md decision-log entry. The protocol doesn't bind which. Acceptable: §4.3.3 already documents that z_score is supplementary diagnostic, not part of the pass/marginal/fail composite — so Sprint 3's choice has no scoring consequences.

3. **C8 (NON-BLOCKING)** — §4.3.5 result shape `glancing_blow_within_12h_hit_rate: number | null` — the `null` semantics ("no glancing-blow events in scored corpus") is implied but not stated. A future reader could conflate `null` with `0%`. One-line note in §4.3.2 or §4.3.5 would close this. Minor.

### Assumptions Challenged (≥1 required)

- **Assumption (engineer's, Round 2)**: "Round 2 fixes strengthen the existing ✓ Met markers without changing them." The Round 2 reviewer.md §11 closing line says "Round 2 fixes strengthen the evidence behind the existing ✓ markers; they don't promote any AC from ✗/⚠ to ✓." This is true at the AC-status level (no AC was ✗ in Round 1; all were ✓ Met based on Round 1 evidence).
  - **Risk if wrong**: A reviewer might over-credit Round 1 ACs given that Round 1 ACs had structural ✓ but Round 1 review still returned CHANGES_REQUIRED on the underlying protocol gaps.
  - **Resolution**: I confirm the assumption holds. Round 1 ACs were correctly marked ✓ at structural completeness level (the protocol existed, sections existed, decisions appeared to be made). Round 1 review surfaced *content* concerns, not structural ones. Round 2 closed the content gaps. The engineer's framing is accurate.

### Alternatives Not Considered (≥1 required)

- **Alternative**: Add `n_excluded_null: 0` as a defensive sanity-check field in §4.3.5 result shape, with the contract "MUST always be 0; if non-zero, corpus eligibility (§3.2 #2 T3) was bypassed". Round 2 instead removed the field entirely, betting that the eligibility rule will hold.
  - **Tradeoff**: Removing is simpler and sends a clearer "no filtering" signal. Keeping as 0-assertion is defensive against future regressions where someone re-introduces scoring-layer filtering.
  - **Verdict**: The simplicity choice is correct. The Sprint 3 corpus loader will reject null-prediction events at load time per §3.2 #2 T3; the regression gate (§7) will catch any code that violates this. The defensive field would be belt-and-suspenders without proportional benefit. Engineer's choice ✓ justified.

---

## Karpathy Principles Check (Round 2)

| Principle | Round 2 Status | Notes |
|-----------|----------------|-------|
| Think Before Coding | ✓ PASS | Engineer surfaced the Round 2 protocol-edit boundary correctly: protocol-text only, no code, no tests, no scope expansion. Reviewer.md §11 documents what did NOT change — appropriate signaling that Round 2 stayed in scope. |
| Simplicity First | ✓ PASS | Round 2 added 91 lines to the protocol (432 → 523). All additions are content edits to address Round 1 findings. Removed 7 lines (deleted §4.3.5 outlier handling). No new abstractions, no new conceptual surfaces. |
| Surgical Changes | ✓ PASS | Diff scope verified: only `calibration-protocol.md`, `spec/construct.json` (one string), `reviewer.md` (Round 2 update + §11), and `.beads/issues.jsonl` (label changes from Round 1). No drive-by improvements anywhere. |
| Goal-Driven | ✓ PASS | Round 2 goals were the three concerns from Round 1 review. Each fix has an explicit Round 2 evidence entry. Validator + tests confirm no regression. |

---

## Beads Status

Round 2 close actions:
- All 5 Sprint 2 task tickets (corona-b5v, corona-2bv, corona-19q, corona-fnb, corona-31y) + epic (corona-1so): `needs-revision` label cleared, `review-approved` label applied.
- Tasks remain `closed`. The labels reflect review pass.

---

## Documentation Verification

| Item | Status |
|------|--------|
| `## AC Verification` section in reviewer.md | ✓ Present at reviewer.md §2; preserved verbatim from Round 1 with line-number guidance pointing to §11 for current layout |
| Round 2 evidence walk in reviewer.md | ✓ Present at reviewer.md §11 with current line numbers + "What did NOT change" subsection |
| CHANGELOG entry for Sprint 2 | NOT REQUIRED for cycle-001 (Sprint 7 cuts v0.2.0) |
| README.md updated | ✓ N/A — no public-surface change in Round 2 |
| construct.yaml T4 metadata sync | ✓ Unchanged in Round 2; already synced in Round 1 |
| spec/construct.json T4 resolution | ✓ Round 2 update verified |
| Sprint 0 carry-forward C3 (proxy retirement) | ✓ Closed by `corona-19q` (Round 1) |
| Sprint 0 carry-forward C4 (parameter rename regression test) | ✓ Closed by new test suite (Round 1) |
| Sprint 1 review C2 (repo-rooted paths) | ✓ Closed (Round 1) |
| Sprint 1 review C3 (PRD §8.4 duplication) | ✓ Closed (Round 1) |

---

## Subagent Reports

No reports at `grimoires/loa/a2a/subagent-reports/`. Optional, not blocking.

---

## Adversarial Cross-Model Review (Phase 2.5)

Skipped per `.loa.config.yaml` (`flatline_protocol.code_review.enabled` not set; defaults to false). Consistent with cycle-001's lightweight posture.

---

## Sprint 2 — Final Status

| Check | Result |
|-------|--------|
| All 12 ACs from sprint.md | ✓ Met (Round 1 evidence preserved; Round 2 strengthened §4.4.0, §3.2 #2 T3, §3.7) |
| All 5 Sprint 2 beads tasks | Closed, `review-approved` labeled |
| Validator | OK |
| Tests | 70 / 70 pass |
| Round 1 concerns C1, C3, C4 | Resolved |
| Round 1 concern C2 (informational) | Resolved (under operator's conditional permission) |
| Code changes in Round 2 | None |
| Test changes in Round 2 | None |
| Scope expansion | None |

**Next operator action**: `/audit-sprint sprint-2` per the original instruction. Once audit returns green, operator commits Sprint 2 (mirroring Sprint 0 / Sprint 1 commit-after-audit pattern, e.g. `b424da7` for Sprint 0).

---

## Round 1 history (preserved for audit trail)

The following sections document the Round 1 review that returned CHANGES_REQUIRED. Round 2 fixes (above) close all four concerns. Preserved for audit trail and future-cycle pattern reference.

---

### Round 1 verdict header

**Reviewer:** Senior tech lead (adversarial protocol)
**Verdict:** **CHANGES REQUIRED** (3 surgical edits to calibration-protocol.md; no code changes)
**Date:** 2026-04-30
**Beads tasks reviewed:** corona-b5v, corona-2bv, corona-19q, corona-fnb, corona-31y (epic corona-1so)
**Operator focus areas:** all 5 evaluated; 3 of 3 code-domain focus areas (1, 2, 5) green; protocol-domain focus areas (3, 4) surfaced 3 specific gaps.

---

## Summary

The Sprint 2 work is structurally sound and the T4 code refactor is clean. The operator's focus-area harness, however, was specifically calibrated to catch the kinds of "frozen protocol that isn't actually frozen" failure modes that Sprint 2 was meant to prevent — and it found three. All three are surgical to fix (protocol-text edits, no code changes, no scope expansion); each maps directly to an operator-flagged risk.

The reasonable engineer's instinct here is to argue that two of the three concerns are "Sprint 3 details" that the freeze doesn't need to lock. The reviewer disagrees: the freeze contract IS the document Sprint 3 implements against, and a Sprint 3 backtest harness that has to invent the T5 corpus-annotation schema, the T4 prediction window, or the WSA-Enlil-null filtering rule is exactly the "Sprint 3 inventing new scoring semantics" failure mode operator focus area 5.3 was checking.

**Pass call boundary**: I would have approved-with-concerns on a different sprint. Sprint 2's deliverable is "produce a frozen protocol that downstream sprints can implement against without re-deciding things". The freeze fails that bar in three specific places. Fix those, re-run review, ship clean.

---

## Round-1 Verification

| Check | Result |
|-------|--------|
| `./scripts/construct-validate.sh construct.yaml` | `OK: construct.yaml conforms to v3 (schemas/construct.schema.json @ b98e9ef)` |
| `node --test tests/corona_test.js` | `tests 70 / pass 70 / fail 0` |
| Sprint 2 beads tasks closed | 5/5 (corona-b5v, corona-2bv, corona-19q, corona-fnb, corona-31y) |
| AC Verification section (cycle-057 #475) | ✓ Present at reviewer.md §2 with verbatim quotes + status markers + file:line evidence for all 12 ACs |
| Diff scope | Only `src/theatres/proton-cascade.js` touched in code (no other src/ files; no scripts/) — confirms operator hard-constraint compliance for "no Sprint 3 work / no parameter refit" |

---

## Operator Focus Area Verdicts

### Focus Area 1 — T4 proton-cascade refactor: **GREEN**

| Sub-check | Verdict | Evidence |
|-----------|---------|----------|
| Flare-class proxy actually retired | ✓ Confirmed | `S_SCALE_THRESHOLDS_PROXY` const removed. `S_SCALE_THRESHOLDS_PFU` (proton-cascade.js:74-80) holds canonical NOAA pfu values. Theatre state field `count_threshold_class` / `count_threshold_rank` removed; `count_threshold_pfu` (proton-cascade.js:213) replaces. Flare events take the correlation branch (proton-cascade.js:266-282) and do NOT increment count. Wheatland prior preserved at trigger-time only. |
| Qualifying events use direct proton flux / S-scale logic | ✓ Confirmed | `processProtonEventCascade` line 291-368: only the `event_type === 'proton_flux'` path increments `qualifying_event_count`. The flare branch (line 266) returns early with correlation-only logging. |
| Energy-channel matching is exact (no substring collision) | ✓ Confirmed | proton-cascade.js:298 uses regex `/(?:^|\D)10\s*MeV\b/i` which matches `">=10 MeV"` but NOT `">=100 MeV"`. Test at corona_test.js:632-637 (`does not count off-channel proton-flux events (energy != 10 MeV)`) sends 200 pfu on `">=100 MeV"` channel and asserts count stays 0 — directly exercises the substring-collision case the engineer's first attempt failed on. |
| Off-channel tests cover the bug | ✓ Confirmed | corona_test.js:632-637 directly exercises the substring bug. The reviewer.md §5 testing-summary table row 3 documents the test scenario. |
| Null/missing proton-flux data fails safely | ✓ Confirmed (with caveat) | `payload.proton?.flux` (line 291) uses optional chaining; `peakPfu == null` (line 301) uses loose equality which catches BOTH `null` and `undefined`; `payload.event_time ?? now` (line 299) defaults to `Date.now()` if missing. The off-channel branch (lines 301-314) handles all malformed-proton paths with informational logging only. **Caveat**: `payload.event_type` access at line 266 / 284 will throw if `bundle.payload` itself is `undefined` — pre-existing condition unchanged by Sprint 2; out of scope. |

### Focus Area 2 — T4 bucket semantics: **YELLOW** (1 finding)

| Sub-check | Verdict | Evidence |
|-----------|---------|----------|
| Bucket boundaries protocol-frozen and consistent across construct.yaml / code / tests | ✓ Confirmed | construct.yaml:184 = `["0-1", "2-3", "4-6", "7-10", "11+"]`. proton-cascade.js:49-55 BUCKETS = same. calibration-protocol.md §4.4.2 = same. corona_test.js:582 asserts `bucket_labels.length === 5` (count-correct). |
| Event window is explicit | ✗ **NOT MET** — see Concern C1 below | proton-cascade.js:185 defaults `window_hours = 72` but calibration-protocol.md §4.4 doesn't state the prediction-window length. The Sprint 3 backtest harness needs to know whether the freeze binds 72h vs some other default. |
| S-scale naming consistent across README, construct.yaml, code, protocol | ✓ Confirmed (with informational note in C2) | README.md:T4 row says "S1+ proton events". construct.yaml:T4 description says "S1+". calibration-protocol.md §4.4 uses S-scale throughout. proton-cascade.js header docstring + new const fully aligned. **Informational only**: spec/construct.json:6 still has stale `"resolution": "Flare event count"` from pre-Sprint-0 era — preserved per operator hard-constraint #5 ("legacy spec files preserved on disk"). Not a Sprint 2 regression; flagged for situational awareness. |

### Focus Area 3 — T3 CME timing metric: **YELLOW** (1 finding)

| Sub-check | Verdict | Evidence |
|-----------|---------|----------|
| MAE primary + ±6h secondary defensible | ✓ Confirmed | calibration-protocol.md §4.3.1 lines 141-148 explicitly documents the MAE-vs-RMSE tradeoff (corpus size + outlier-dominance argument). §4.3.2 lines 152-158 cites PRD §6 T3 row + NOAA/SWPC operational tolerance for the ±6h band. Both sound. |
| ±12h glancing-blow widening: clear eligibility, not ad-hoc | ✓ Confirmed | calibration-protocol.md §4.3.2 lines 154-158: "events flagged in the corpus as glancing-blow CMEs (CME plane ≥45° off Earth direction per WSA-Enlil halo angle metadata)". Eligibility rule is falsifiable (≥45° off Earth direction is checkable from DONKI metadata) and corpus-anchored (not run-time toggle). The primary MAE explicitly does NOT widen — only the secondary hit-rate. ✓ Tight. |
| WSA-Enlil-null exclusion documented as corpus eligibility, not hidden filtering | ✗ **NOT MET** — see Concern C3 below | calibration-protocol.md §3.2 #2 T3 (line 56) says "WSA-Enlil prediction (DONKI) AND observed L1 shock signature ... are both present". §4.3.5 (line 178) says events with WSA-Enlil null prediction are excluded from MAE/hit-rate at scoring time. These two rules are inconsistent — if §3.2 truly requires presence, §4.3.5 has nothing to filter; if §4.3.5 filters at scoring time, then §3.2's "present" must mean something looser than "non-null". This is exactly the "hidden filtering" the operator asked us to flag. |

### Focus Area 4 — T5 behavior metrics: **YELLOW** (1 finding)

| Sub-check | Verdict | Evidence |
|-----------|---------|----------|
| FP rate concrete enough for Sprint 3 implementation | ⚠ **Partial** — see Concern C4 below | Formula at calibration-protocol.md §4.5.1.a (lines 251-260) is concrete: `fp_rate = count(false_positive_signals) / count(total_divergence_signals)`. The 60-min corroboration window is specified. **But**: the corpus annotations needed to compute this (per-divergence-signal resolution times, NOAA SWPC alert refs, DONKI IPS/GST cross-refs) are NOT specified in §3.2 corpus eligibility. Sprint 3 cannot construct a corpus without inventing those annotations. |
| Stale-feed p50/p95 concrete enough | ⚠ **Partial** — see Concern C4 below | Formula at §4.5.1.b (lines 264-272) references "the corpus's annotated truth" for `t_actual_staleness_onset`. The annotation format is not defined anywhere in the protocol. |
| Satellite-switch handled-rate concrete enough | ⚠ **Partial** — see Concern C4 below | Three "handled" criteria at §4.5.1.c (lines 278-286) are crisp. But §3.2 #5 T5 corpus eligibility (line 58) only requires "continuous DSCOVR + ACE solar wind data" — not a list of switch events with timestamps and outcomes. Sprint 3 has to invent. |
| Hit rate diagnostic-only, not used as pass/fail crutch | ✓ Confirmed | calibration-protocol.md §4.5.2 (line 296): **"Hit rate does NOT enter the pass/marginal/fail composite (§6)."** Cross-checked §6 T5 row: composite is `FP rate ≤ 0.10 AND stale-feed p50 ≤ 120s AND switch handled ≥ 0.95` — no hit-rate term. ✓ Clean. |

### Focus Area 5 — Protocol/code boundary: **GREEN** (with rollup of C1/C3/C4 affecting Sprint 3 implementability)

| Sub-check | Verdict | Evidence |
|-----------|---------|----------|
| Sprint 2 did not start Sprint 3 backtest harness | ✓ Confirmed | `git diff --name-only HEAD -- scripts/` returns empty. No `scripts/corona-backtest*` files exist. Engineer report §6 explicitly tracks "backtest harness implementation" as Sprint 3 / `corona-d4u` epic. |
| No parameter refit | ✓ Confirmed | Only `src/theatres/proton-cascade.js` modified in src/. PRODUCTIVITY_PARAMS at proton-cascade.js:101-105 (Wheatland λ + decay) preserved unchanged. The S_SCALE_THRESHOLDS_PFU values are NOAA canonical pfu (10/100/1000/10000/100000), not refit. No other theatre or processor parameters touched. |
| calibration-protocol.md frozen enough for Sprint 3 to implement against without inventing new scoring semantics | ⚠ **Partial** — Concerns C1, C3, C4 above each force Sprint 3 to either invent semantics OR pause for a Sprint 2 amendment. | Per the per-concern findings: T4 prediction window (C1) Sprint 3 picks; T3 WSA-Enlil-null filtering location (C3) Sprint 3 picks; T5 corpus annotation schema (C4) Sprint 3 invents. None of these are "implementation details" — they are scoring-semantics decisions the freeze should have locked. |

---

## Adversarial Analysis

### Concerns Identified

#### **C1 — T4 prediction window not bound in protocol freeze (BLOCKING)**

- **Issue**: `calibration-protocol.md` §4.4 specifies the qualifying-event criterion (≥10 pfu, ≥10 MeV channel, 30-min dedup window) but does NOT state how long the *prediction window* is. The runtime code defaults to `window_hours = 72` (proton-cascade.js:185), but a backtest harness that picks 24h or 168h would also be "implementing against the freeze" while producing entirely incomparable results.
- **Specific fix**: Add a sentence to calibration-protocol.md §4.4 (recommended insertion after line 187, before §4.4.1):
  > **Prediction window**: 72 hours from M5+ trigger time. Sprint 3 backtest harness MUST use this window for primary-corpus scoring; non-default windows require a `calibration-manifest.json` entry with rationale.
- Same fix should be applied analogously to other theatres if their windows are similarly implicit. Quick audit: check whether T1, T2, T3, T5 have analogous defaults that the freeze should bind. (T1/T2 have `window_hours` parameters; T3 has prediction-window from WSA-Enlil; T5 has `window_hours`. Worth one consolidated §4.0 "Theatre prediction windows" subsection or per-theatre callouts in §4.x.)
- **Why blocking**: Sprint 3 backtest results are only comparable across theatres if the prediction window is bound. Operator focus area 2 specifically asked us to confirm the event window is explicit.

#### **C3 — WSA-Enlil-null exclusion is hidden filtering, not corpus eligibility (BLOCKING)**

- **Issue**: §3.2 #2 T3 (calibration-protocol.md:56) requires "WSA-Enlil prediction (DONKI) AND observed L1 shock signature ... are both present" for primary-corpus eligibility. §4.3.5 (line 178) then talks about "events with WSA-Enlil null prediction (model failed to converge, e.g., complex multi-CME interaction)" being excluded from MAE/hit-rate at scoring time. These rules contradict — either §3.2 admits null predictions (in which case §3.2 should say so) OR §4.3.5 is filtering events that §3.2 already excluded (in which case §4.3.5 is dead code).
- **Specific fix**: Pick one of two surgical edits.
  - **Option A (recommended)**: Tighten §3.2 #2 T3 to "WSA-Enlil prediction record (DONKI) is present **with non-null forecast value** AND observed L1 shock signature ... are both present." Then delete §4.3.5 outlier handling (it's redundant with eligibility). This makes the corpus self-describing and removes the hidden filter.
  - **Option B**: Loosen §3.2 #2 T3 to "WSA-Enlil prediction record (DONKI) is present (forecast value MAY be null per §4.3.5)" — and explicitly cross-reference §4.3.5 from the eligibility rule. This makes the dual-layer filtering visible.
- **Why blocking**: Operator focus area 3.3 explicitly: "Confirm WSA-Enlil-null exclusion is documented as a corpus eligibility rule, not hidden filtering." Current protocol fails this bar. Either option closes the concern.

#### **C4 — T5 corpus-annotation schema not specified (BLOCKING)**

- **Issue**: §4.5.1.a / b / c reference corpus annotations that §3 doesn't enumerate:
  - `t_actual_staleness_onset` (the corpus's annotated truth) — §4.5.1.b line 270.
  - Satellite-switch events with timestamps + transition-window expectations — §4.5.1.c.
  - "No NOAA SWPC alert / DONKI IPS or GST record corroborates the divergence" — §4.5.1.a — implies per-signal corroboration cross-refs.
  - Per-divergence-signal resolution times (for FP-rate computation) — §4.5.1.a.
- §3.2 #5 T5 (line 58) only requires "continuous DSCOVR + ACE solar-wind data ... no gap >5 min" — silent on the annotation layer.
- **Specific fix**: Add a §3.7 "Required corpus annotations per theatre" subsection enumerating the per-event annotation fields each theatre's scoring requires. Minimum content:
  - T3 fields: `glancing_blow_flag` (boolean), `halo_angle_degrees` (number, optional), `wsa_enlil_predicted_arrival_time` (ISO or null), `observed_l1_shock_time` (ISO).
  - T4 fields: `qualifying_proton_flux_observations` (array of `{time, peak_pfu, energy_channel}`), `m5_plus_trigger_time` (ISO).
  - T5 fields: `divergence_signals` (array of `{signal_time, signal_resolution_time, corroborating_alerts: [], satellite_at_signal}`), `stale_feed_events` (array of `{onset_time, end_time, satellite}`), `satellite_switch_events` (array of `{switch_time, from, to, reason, transition_end_time}`), `anomaly_bulletin_refs` (array of `{time_window, source, anomaly_id}`).
  - T1/T2 fields: light or empty (most data comes from primary instrument feed; explicit annotation only for non-trivial cases).
- **Why blocking**: Without this schema, Sprint 3 / `corona-2b5` (corpus commit) and Sprint 3 / `corona-aqh` (T5 quality scoring) have to invent the annotation format. That invention IS the "Sprint 3 picking scoring semantics" failure mode operator focus area 5.3 was checking. Operator focus area 4 explicitly: "Confirm false-positive rate, stale-feed p50/p95, and satellite-switch handled-rate are concrete enough for Sprint 3 harness implementation." Concrete formulas + missing input schema = not concrete.

#### **C2 — spec/construct.json:6 stale "resolution" field (NON-BLOCKING, informational)**

- **Issue**: spec/construct.json:6 says `"resolution": "Flare event count"`. This field never got updated in the Sprint 0 R-scale → S-scale cleanup (per Sprint 0 notes corona-222 "T4 description fixed" — only the description, not the resolution). Sprint 2's proxy retirement makes this drift more visible: the legacy file claims T4 resolves on flare-event count, but the canonical spec, code, protocol, and tests now agree T4 resolves on direct proton-flux count.
- **Posture**: Sprint 2 handoff §6 hard constraint #5 says "Preserve legacy spec files. spec/construct.json and spec/corona_construct.yaml remain on disk untouched." So Sprint 2 doesn't fix this. Flagging for situational awareness; this is a Sprint 7 polish item or a Sprint 0 carry-forward to log. **Not blocking Sprint 2 approval.**
- **Recommended action**: log to engineer.md "Carry-forward concerns" as Sprint 7 polish. No edit needed in this round.

#### **C5 — Composite freeze confidence (rollup of C1/C3/C4)**

- **Issue**: Sprint 2's deliverable is "produce a frozen protocol that downstream sprints can implement against without re-deciding things". C1 + C3 + C4 each force Sprint 3 to either invent semantics or pause for a Sprint 2 amendment. The freeze is structurally complete (corpus tiers exist, scoring rules exist, thresholds exist, regression policy exists) but has three specific gaps where Sprint 3 would step over the protocol boundary into protocol-decision territory.
- **Specific fix**: Land C1, C3, C4 fixes; this concern dissolves automatically.
- **Why blocking**: Operator focus area 5.3 directly: "Confirm calibration-protocol.md is frozen enough for Sprint 3 to implement against without inventing new scoring semantics." This is the freeze contract test the operator put highest weight on, and it currently fails.

### Assumptions Challenged (≥1 required)

- **Assumption** (engineer's, implicit): "Frozen protocol" means structure is locked but corpus-construction details are Sprint 3's concern. Per the engineer's own §9 hooks (reviewer.md §9 item 1) and §6 known-limitations table, "concrete corpus event list" is explicitly Sprint 3 / `corona-2b5`. The engineer extends this implicitly to corpus annotation schema for T5 quality metrics.
- **Risk if wrong**: Sprint 3 corpus loader must define an annotation schema for T5 (FP-rate corroboration refs, stale-feed onset truth, switch transition windows). If Sprint 3 picks one schema and Sprint 5 refit picks a different one, the manifest regression gate breaks across runs that compute quality-of-behavior differently.
- **Recommendation**: separate "concrete event list" (Sprint 3 picks) from "corpus annotation schema" (Sprint 2 specifies, locked at freeze). The protocol §3.7 fix in C4 above does exactly this.

### Alternatives Not Considered (≥1 required)

- **Alternative A**: Move all scoring-layer filters into corpus eligibility (§3.2). Specifically: WSA-Enlil-null exclusion (§4.3.5) becomes part of §3.2 #2 T3 — events with null prediction are not corpus-eligible, period.
  - **Tradeoff**: Cleaner separation of concerns. Corpus = score-eligible-and-scored events; scoring = formula application. Two-pass design (filter then score) collapses to one pass. Cost: §4.3.5 has no analogous home if every theatre's primary data is "always present" in eligibility.
  - **Verdict**: Worth adopting for T3 specifically (closes C3). Other theatres don't have the same WSA-Enlil-null-style failure mode at this point in the cycle, so the move is local. C3 fix Option A above is this alternative.

- **Alternative B**: Add a §4.0 "Theatre prediction windows + composite invariants" subsection consolidating window declarations across all 5 theatres (T1: M-class threshold + window, T2: G-scale threshold + window, T3: arrival-prediction window from WSA-Enlil, T4: 72h post-trigger, T5: divergence-detection window). This is a single-source-of-truth for the "what does the theatre predict over what time horizon" question.
  - **Tradeoff**: Cleaner than per-theatre callouts in §4.x. Cost: one more cross-reference for readers to follow.
  - **Verdict**: Recommend if the C1 fix is being authored anyway. Either form (per-theatre callout OR consolidated §4.0 table) satisfies operator focus area 2.

---

## Required Changes (Round 2 Engineer Action List)

All three are protocol-text edits to `grimoires/loa/calibration/corona/calibration-protocol.md`. No code changes. No test changes. No re-running validator/tests.

| # | Where | Change |
|---|-------|--------|
| 1 | §4.4 (after line 187, before §4.4.1) | Add explicit T4 prediction-window declaration: 72 hours from M5+ trigger time, with Sprint 5 manifest-entry requirement for non-default windows. **Optional bonus**: add analogous §4.x lines for T1, T2, T3, T5, OR consolidate into a §4.0 "Theatre prediction windows" subsection (per Alternative B above). |
| 2 | §3.2 #2 T3 (line 56) — pick Option A or Option B | Option A (recommended): tighten to "WSA-Enlil prediction record (DONKI) is present **with non-null forecast value**" + delete §4.3.5 (lines 176-180). Option B: loosen to "(forecast value MAY be null per §4.3.5)" + cross-reference §4.3.5 from §3.2. Either resolves C3. |
| 3 | §3 (after §3.6, new §3.7) | Add "Required corpus annotations per theatre" subsection enumerating per-event annotation fields per theatre. Minimum coverage at C4 above. T5 is the most affected; T1/T2 may need only minor additions. |

After landing these three edits, re-run `/review-sprint sprint-2`. The code review verdicts (focus areas 1, 5.1, 5.2) are already green and won't change.

---

## Documentation Verification

| Item | Status |
|------|--------|
| `## AC Verification` section in reviewer.md | ✓ Present at reviewer.md §2; 12 ACs walked verbatim with file:line evidence per cycle-057 #475 gate |
| CHANGELOG entry for Sprint 2 | NOT REQUIRED for cycle-001 (Sprint 7 cuts v0.2.0) |
| README.md updated for new construct surface | ✓ N/A — Sprint 2 didn't add new public surface; T4 docstring + comments updated in code; protocol freeze documented in protocol-md |
| construct.yaml T4 metadata sync | ✓ construct.yaml:184-185 reflects Sprint 2 freeze (buckets pinned + settlement field cites protocol §4.4.1) |
| Sprint 0 carry-forward C3 (proxy retirement) | ✓ Closed by `corona-19q` |
| Sprint 0 carry-forward C4 (parameter rename regression test) | ✓ Closed by new test suite at corona_test.js:692-723 |
| Sprint 1 review C2 (repo-rooted paths) | ✓ Closed — calibration-protocol.md uses `grimoires/loa/calibration/corona/...` everywhere; no same-directory relative links |
| Sprint 1 review C3 (PRD §8.4 duplication) | ✓ Closed — §4 cites PRD §8.4 as abstract structure and extends with concrete formulas, secondary metrics, outlier handling |
| Sprint 1 review C4 (empty beads descriptions) | ✓ Met — Sprint 2 tasks had populated descriptions from `/sprint-plan` pass; engineer used them during execution |

---

## Subagent Reports

No reports at `grimoires/loa/a2a/subagent-reports/`. `/validate` was not run. Optional, not blocking.

---

## Adversarial Cross-Model Review (Phase 2.5)

Skipped per `.loa.config.yaml` (`flatline_protocol.code_review.enabled` not set; defaults to false). Consistent with cycle-001's lightweight posture and Sprint 1's review precedent.

---

## Karpathy Principles Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Think Before Coding | ✓ PASS | Engineer surfaced the substring-collision bug during test-writing and fixed at the right layer (proton-cascade.js regex strict-match vs. punting to bundles.js). Documented the trade-off in the §4 Technical Highlights. |
| Simplicity First | ✓ PASS | Code changes are minimal: const rename, one new field on theatre state, two new helper-less inline checks (regex + dedup window). No premature abstractions, no shared scoring code (operator hard constraint #5 honoured). |
| Surgical Changes | ✓ PASS | Diff is 209 insertions + 86 deletions, all in one src file (proton-cascade.js) + tests + protocol + construct.yaml T4 sync. No drive-by improvements to flare-gate.js, geomag-gate.js, etc. |
| Goal-Driven | ⚠ Approve with C1/C3/C4 caveat | The "is the freeze frozen enough" goal is partially met. AC verification at reviewer.md §2 is goal-driven and rigorous; the protocol freeze itself has the three specific gaps above where the freeze contract isn't quite tight enough for downstream consumption. Fix lands the goal. |

---

## Beads Status

All Sprint 2 tasks remain `closed`. Adding `needs-revision` label below to flag Round-2 work; will swap to `review-approved` once C1/C3/C4 protocol edits land.

---

## Sprint 2 Round-2 Posture

The Round-2 changes are protocol-text only — no code, no tests, no validator, no parameter refit. Engineer should:

1. Land the three §-edits to calibration-protocol.md per the table in "Required Changes" above.
2. Update reviewer.md §2 AC verification line for AC 11 ("Per-theatre pass/marginal/fail thresholds defined") if any threshold copy in the protocol changes (it shouldn't — fixes are corpus + window + WSA-null cleanup, not thresholds).
3. Re-invoke `/review-sprint sprint-2` for Round-2 verification.

Estimated work: 30-45 min for protocol edits + reviewer.md hook update.

After Round-2 green, operator can invoke `/audit-sprint sprint-2` per the original instruction.

---

## Next Steps

1. Engineer addresses C1, C3, C4 per the action list above.
2. Re-invoke `/review-sprint sprint-2`.
3. Once green, invoke `/audit-sprint sprint-2` (operator's stated next step).
4. Operator commits Sprint 2 once both review and audit are green (mirrors Sprint 0 / Sprint 1 commit-after-audit pattern).

---

*Reviewed by senior tech lead under adversarial protocol. The operator's risk-area harness was specifically designed to catch the failure modes Sprint 2 was vulnerable to ("frozen protocol that isn't frozen", "hidden filtering at scoring layer", "Sprint 3 inventing scoring semantics"). It found three. The T4 code refactor itself is clean and well-tested. The fixes are surgical, the work is high quality, and Round-2 should be a single-iteration close.*
