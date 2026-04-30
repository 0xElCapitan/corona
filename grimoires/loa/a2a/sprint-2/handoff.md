# Sprint 2 Handoff Packet — CORONA cycle-001-corona-v3-calibration

**Status**: READY FOR FRESH-SESSION KICKOFF
**Authored**: 2026-04-30 (Sprint 1 close)
**Sprint type**: SEMANTIC / PROTOCOL FREEZE (per operator framing)
**Scope size**: MEDIUM (5 tasks)
**Operator HITL constraint**: ON — Sprint 2 is a semantic-freeze sprint (locks corpus eligibility, per-theatre scoring rules, T3/T4/T5 metric specifics). Operator wants review **before** these become downstream assumptions.

---

## 1. Why this handoff packet exists

Sprint 2 is qualitatively different from Sprints 0–1. Sprints 0–1 were mechanical (v3 metadata migration, scaffold scaffolding) with deterministic outputs. Sprint 2 is the first sprint that **produces irreversible architectural commitments** about how CORONA will be evaluated:

- Which historical events count as "in-corpus" (corpus eligibility)
- How each theatre is scored (per-theatre scoring rules)
- What "T3 arrival accurate" means (timing metric specifics)
- What "T5 well-behaved" means (false-positive / stale-feed / satellite-switch metrics)
- What "T4 S1+ proton event" means at the qualifying-event level (bucket binding)

These commitments propagate into Sprints 3-5 (backtest harness, evidence research, refit). **A wrong commitment in Sprint 2 is expensive to retract once Sprint 3 commits to corpus + harness implementation.** The operator wants HITL review of each of these before Sprint 2 closes.

---

## 2. State of the world at handoff (cycle-001, post-Sprint-1)

### Locked from Sprint 0
- v3 spec at `construct.yaml` (`schema_version: 3`, streams, identity, compose_with[tremor], commands, pack_dependencies)
- Schemas vendored at `schemas/` from `construct-base@b98e9ef`
- Local validator at `scripts/construct-validate.sh` (L0+L1 strictness, upstream-parity)
- Identity persona at `identity/{CORONA.md, persona.yaml}`
- TREMOR reference composition at `examples/tremor-rlmf-pipeline.md` (paper-only, no runtime coupling)
- Theatre authority map at `grimoires/loa/calibration/corona/theatre-authority.md`
- T4 R-scale → S-scale scaffold (parameter rename + JSDoc + TODO `corona-19q` for Sprint 2 binding)

### Locked from Sprint 1
- `composition_paths.writes: [grimoires/loa/calibration/corona/]` (`reads: []`)
- Sprint 0 carry-forward C5 (a2a/ overclaim) **resolved**
- Calibration directory scaffold:
  - `grimoires/loa/calibration/corona/calibration-protocol.md` (Sprint 2 deliverable scaffold)
  - `grimoires/loa/calibration/corona/calibration-manifest.json` (`[]` — Sprint 5 populates)
  - `grimoires/loa/calibration/corona/empirical-evidence.md` (Sprint 4 deliverable scaffold)
  - `grimoires/loa/calibration/corona/corpus/README.md` (corpus directory layout + freeze policy)
  - `grimoires/loa/calibration/corona/theatre-authority.md` (Sprint 0; preserved)

### Verification state
- `./scripts/construct-validate.sh construct.yaml` → GREEN
- `node --test tests/corona_test.js` → 60 / 60 pass
- All 11 Sprint 0 + Sprint 1 beads tasks closed with `review-approved` + `security-approved` labels

### Commit state at handoff
- **Sprint 0 committed + pushed** (`b424da7` Sprint 0 + 3 cleanup commits, all on `origin/main`)
- **Sprint 1 NOT YET COMMITTED**. Operator scoped Sprint 1 close as "stop at the gate" — they decide commit timing for Sprint 1 before or after Sprint 2 starts.

---

## 3. Sprint 2 owner tasks (5 tasks; protocol freeze)

| Beads ID | Task | PRD §11 Q | Decision the task locks |
|----------|------|-----------|--------------------------|
| `corona-b5v` | sprint-2-define-corpus-tiers | — | Pin ~15-25 events per theatre from GOES-R era (2017+); pin secondary stress events from SC24/25 + exceptional historical |
| `corona-2bv` | sprint-2-bind-t3-timing-metric | Q2 | T3 arrival-window scoring: MAE? RMS? within-window hit-rate weight? Sprint 2 must pick one and bind. |
| `corona-19q` | sprint-2-bind-t4-bucket-boundaries | Q4 | T4 S-scale bucket boundaries; **also retires the flare-class proxy** — replaces `S_SCALE_THRESHOLDS_PROXY` in `src/theatres/proton-cascade.js:60-66` with direct proton-flux qualifying-event logic. |
| `corona-fnb` | sprint-2-bind-t5-quality-metric | Q3 | T5 false-positive rate + stale-feed detection latency + satellite-switch behavior — concrete metric definitions |
| `corona-31y` | sprint-2-author-protocol-md | — | Compile findings into `grimoires/loa/calibration/corona/calibration-protocol.md` with pass/marginal/fail thresholds + regression policy |

**Sprint 2 epic**: `corona-1so` (currently open).

**Recommended Sprint 2 task ordering** (operator may revise):
1. `corona-b5v` first — corpus tiers establish what events later metric-bindings can rely on
2. Parallel: `corona-2bv`, `corona-19q`, `corona-fnb` — each binds one PRD §11 question, low cross-dependency
3. `corona-31y` last — compiles all four into the frozen protocol

---

## 4. Decision points Sprint 2 must lock (PRD §11 detail)

These are not scope-deferrals — they are **architectural commitments** Sprint 2 must make. Each requires evidence + rationale that survives downstream sprint review.

### Q2 — T3 CME Arrival timing-error metric (Beads `corona-2bv`)

PRD §8.4 says "Arrival-window timing-error (MAE in hours)" with "Within-±6h hit rate as supplementary". Open decisions Sprint 2 must answer:

- **Primary metric** — MAE in hours (standard) or RMSE? MAE is more intuitive but RMSE penalizes large misses harder.
- **Hit-rate threshold** — ±6h (per PRD §6 T3 row + spec/construct.json T3 description) or wider for glancing-blow CMEs?
- **Sigma weighting** — does MAE need to be sigma-normalized (since WSA-Enlil sigma varies 10-18h by CME type per BFZ:159)?
- **Bz polarity** — does outcome accuracy depend on whether observed Bz matched predicted polarity, or just arrival timing?

Sprint 4 will research WSA-Enlil literature (Mays et al. 2015, Riley et al. 2018) for sigma priors. Sprint 2's metric definition needs to be compatible with whatever Sprint 4 finds.

### Q4 — T4 Proton Event Cascade bucket boundaries + proxy retirement (Beads `corona-19q`)

Two coupled decisions:

- **S-scale qualifying-event bucket boundaries**: how many qualifying S1+ proton events count as bucket 0-1, 2-3, 4-6, 7-10, 11+? (PRD §8.4 carries TREMOR's pattern as reference but per operator direction these MUST be corpus-bound for CORONA, not inherited.)
- **Proxy retirement**: replace the `S_SCALE_THRESHOLDS_PROXY` table in `src/theatres/proton-cascade.js:60-66` with direct proton-flux qualifying-event logic. The proxy currently maps S1→M1.0, S2→M5.0, S3→X1.0 (flare-class fallback). Sprint 2 must:
  1. Decide what counts as an S1+ proton event (≥10 pfu integral proton flux ≥10 MeV is the NOAA definition; needs duration threshold? sustained for N minutes?)
  2. Refactor the qualifying-event check from "subsequent flare class ≥ threshold" to "proton flux exceeds S-scale threshold for ≥ duration"
  3. Add a regression test for the renamed parameter (Sprint 0 carry-forward C4)
  4. Update `S_SCALE_THRESHOLDS_PROXY` const name to `S_SCALE_THRESHOLDS_PFU` or similar (since it'll be real proton-flux thresholds, not flare-class proxy)
  5. Remove the `// TODO Sprint 2 / corona-19q:` comment at proton-cascade.js:60-61 once binding lands

### Q3 — T5 Solar Wind Divergence quality-of-behavior metrics (Beads `corona-fnb`)

PRD §8.4 says "False-positive rate + stale-feed detection latency + satellite-switch behavior; Hit rate (deprioritized)". Open decisions:

- **False-positive rate**: count FPs against what baseline? Self-divergence threshold crossings without sustained-streak follow-through?
- **Stale-feed detection latency**: how soon after a feed goes stale must T5 flag it? Minutes? Hours?
- **Satellite-switch behavior**: when DSCOVR primary → secondary or DSCOVR ↔ ACE switches, what's the expected T5 behavior? Pause divergence detection? Adjust threshold? Continue with annotation?
- **Hit rate (deprioritized)**: how is "deprioritized" weighted in the per-theatre pass/marginal/fail composite?

This is the messiest metric in Sprint 2 because T5 is the only "self-resolving" theatre — there's no external ground truth to compare against. Sprint 2 must define what "T5 working correctly" means without circular-defining it as "T5 outputs match T5's predictions".

---

## 5. Carry-forward concerns

### From Sprint 0 reviews + audits

| ID | Item | Owner | Action |
|----|------|-------|--------|
| Sprint 0 review C3 | T4 `S_SCALE_THRESHOLDS_PROXY` → direct proton-flux logic | Sprint 2 / `corona-19q` | Q4 above; retires the proxy |
| Sprint 0 review C4 | `s_scale_threshold` parameter rename regression test | Sprint 2 / `corona-19q` | Pair with proxy retirement |
| Sprint 0 review C6 | `commands.path` JS-file vs upstream `commands/*.md` | Sprint 7 publish-readiness | No Sprint 2 action |
| Sprint 0 review C7 | L2 publish gates (TODO/FIXME, narrative ≥10 lines, semver, quick_start) | Sprint 7 publish-readiness | No Sprint 2 action |
| Sprint 0 audit LOW-1 | `schemas/CHECKSUMS.txt` vendor integrity | Sprint 7 publish-readiness | No Sprint 2 action |
| Sprint 0 audit LOW-2 | Extend tempfile EXIT trap to cover `tmp2` in scripts/construct-validate.sh | Sprint 7 publish-readiness | No Sprint 2 action |
| Sprint 0 D6 | Install `ajv-formats` locally; revert validator wrapper to `-c ajv-formats` | Sprint 7 publish-readiness | No Sprint 2 action |

### From Sprint 1 review

| ID | Item | Owner | Action |
|----|------|-------|--------|
| Sprint 1 review C1 | Custom deferral marker (`⏸ [STAGED-FOR-OPERATOR-COMMIT]` vs canonical `⏸ [ACCEPTED-DEFERRED]`) | Future sprints | When you defer an AC, use canonical marker AND add NOTES.md Decision Log entry |
| Sprint 1 review C2 | `calibration-protocol.md:43` same-directory link | Sprint 2 / `corona-31y` | When authoring final protocol-md, use absolute or repo-rooted paths |
| Sprint 1 review C3 | Per-theatre scoring rules table duplicates PRD §8.4 in placeholder | Sprint 2 / `corona-31y` | When authoring final protocol-md, cite PRD §8.4 instead of duplicate |
| Sprint 1 review C4 | Sprint 2-7 beads descriptions empty | Each sprint's first task | Sprint 2 first task: enrich beads descriptions for the 5 owner tasks (title + AC + dependencies + PRD/SDD refs) |
| Sprint 1 review C5 | `composition_paths.reads: []` registry compatibility | Sprint 7 publish-readiness | Validate against construct-network indexer at publish time |

---

## 6. Operator constraints (carry forward to Sprint 2 fresh session)

1. **HITL still ON for Sprint 2.** Operator confirmed Sprint 0/1 preconditions are met but Sprint 2 is qualitatively different (semantic protocol freeze, not mechanical). Operator wants HITL review of each metric-binding decision before they propagate to Sprint 3-5.
2. **No autonomous `/run sprint-N`.** Operator will manually trigger `/implement sprint-2` (or invoke owner tasks individually).
3. **Don't mutate TREMOR + BREATH.** Read-only references at `C:\Users\0x007\tremor`, `C:\Users\0x007\breath`. Useful for cross-construct corpus comparison.
4. **Don't introduce runtime deps.** `package.json:32 "dependencies": {}` is invariant. Sprint 2 may add dev-tooling but no runtime imports.
5. **Preserve legacy spec files.** `spec/construct.json` and `spec/corona_construct.yaml` remain on disk untouched.
6. **`.claude/` System Zone untouched.** Use `.claude/overrides/` or `.loa.config.yaml` if any framework adjustments are needed.

---

## 7. Recommended Sprint 2 fresh-session kickoff

When you start the fresh session for Sprint 2:

1. **First operator action**: decide whether to commit Sprint 1 first or carry it into Sprint 2's commit. Sprint 1 changes are clean (validator green, tests 60/60, both gates approved) — committing first gives Sprint 2 a clean baseline. Carrying into Sprint 2 is also valid but bundles two sprints' commits. Recommend: commit Sprint 1 standalone before Sprint 2 starts.

2. **Skill invocation**: `/implementing-tasks Sprint 2` (or `/implement sprint-2`)

3. **First implementation task** (suggested but operator may revise):
   - Read this handoff packet
   - Read `grimoires/loa/calibration/corona/calibration-protocol.md` (current Sprint 1 placeholder)
   - Read PRD §11 Q2 / Q3 / Q4 entries for the deferred decisions
   - Optionally enrich Sprint 2 beads descriptions (per Sprint 1 review C4) before starting metric-binding work
   - Then execute `corona-b5v` (corpus-tiers) first as the foundation for downstream metric-binding work

4. **HITL pause-points** within Sprint 2 (suggested):
   - After `corona-b5v` corpus-tier definition — operator review of pinned event list
   - After each metric-binding task (`corona-2bv`, `corona-19q`, `corona-fnb`) — operator review of metric definition before next one
   - Before `corona-31y` writes the frozen protocol — operator review of per-theatre scoring rules table

5. **Sprint 2 close** — same pattern as Sprint 0/1: `/review-sprint sprint-2` → `/audit-sprint sprint-2` → operator commit.

---

## 8. Files the fresh session needs to read first

In priority order:

1. **This file** — `grimoires/loa/a2a/sprint-2/handoff.md`
2. `grimoires/loa/prd.md` §6 (Theatre Authority Map), §7 (Calibration Manifest Schema), §8.3 (corpus tiers), §8.4 (per-theatre scoring), §11 (Open Decisions)
3. `grimoires/loa/sdd.md` §5.3 (Calibration subsystem layout), §5.4 (Theatre authority module), §6 (Backtest harness architecture — Sprint 3 owner but Sprint 2 must be compatible)
4. `grimoires/loa/sprint.md` Sprint 2 section (lines 212-264)
5. `grimoires/loa/calibration/corona/{theatre-authority.md, calibration-protocol.md, corpus/README.md}` — Sprint 0 + Sprint 1 outputs
6. `src/theatres/proton-cascade.js` lines 1-66 (S_SCALE_THRESHOLDS_PROXY proxy table to retire) and the `// TODO Sprint 2 / corona-19q` comment at line 60
7. `grimoires/loa/a2a/sprint-1/{reviewer.md, engineer-feedback.md, auditor-sprint-feedback.md, COMPLETED}` — Sprint 1 final state for context
8. `C:\Users\0x007\tremor\grimoires\loa\calibration\omori-backtest-protocol.md` — TREMOR's frozen protocol pattern (read-only reference)
9. `C:\Users\0x007\breath\grimoires\loa\empirical-validation-research.md` — BREATH's literature-research pattern (read-only reference; Sprint 4 will lean on this more, but Sprint 2 should know it exists)

---

## 9. Quick verification commands for fresh-session sanity check

```bash
# Verify cycle state intact
./scripts/construct-validate.sh construct.yaml          # Expect: OK conforms to v3
node --test tests/corona_test.js                        # Expect: 60/60 pass
ls grimoires/loa/calibration/corona/                    # Expect: 4 placeholder + 2 preserved + corpus/

# Verify Sprint 1 tasks closed + approved
br list --status closed --json | jq '[.[] | select(.title | test("sprint-1-"))] | length'   # Expect: 3

# Verify Sprint 2 tasks ready
br list --status open --json | jq -r '.[] | select(.title | test("sprint-2-")) | "\(.id) \(.title | split(":")[0])"'

# Verify commit state
git log --oneline -5
git status
```

---

## 10. Handoff acknowledgment

This packet is the operator's primary primer for Sprint 2. The fresh session's agent should:

1. Read this file at the top of the session
2. Read the priority-listed files in §8
3. Confirm cycle state via §9 commands
4. Present a Sprint 2 kickoff plan (recommend tasks 1 + 4 from §7) for operator approval before any code/protocol work begins

The operator's stated goal: review **before** Sprint 2's metric definitions become downstream assumptions. This packet preserves that posture across the session boundary.

---

*Sprint 2 handoff packet authored cycle-001 Sprint 1 close, after `/review-sprint sprint-1` (APPROVED with concerns) and `/audit-sprint sprint-1` (APPROVED — 0 findings). Sprint 1 commit state at handoff: NOT YET COMMITTED — operator decides commit timing.*
