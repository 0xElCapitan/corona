# CORONA Calibration Protocol

**Status**: TBD — Sprint 2 (`corona-1so` epic) deliverable
**Owner**: Sprint 2 / `corona-1so`
**Sprint 1 scaffold** (`corona-2o8`): placeholder for Sprint 2's frozen-protocol output.

This file becomes the **frozen** calibration protocol for cycle-001. Sprint 2 authors it; once frozen, parameter changes require re-running the backtest and updating this protocol with the deltas (per PRD §5.3 regression policy).

## Required sections (Sprint 2 fills these)

### Primary corpus
- **TBD** — Sprint 2: pin ~15-25 events per theatre from GOES-R era (2017+) per PRD §8.3.
- Per PRD §11: Sprint 2 binds the concrete event list; `corpus_hash` (SHA256 over event list) computed at freeze time and recorded in `calibration-manifest.json` per parameter.
- Storage: `grimoires/loa/calibration/corona/corpus/primary/T<id>-<theatre>/` per `corpus/README.md` layout.

### Secondary stress corpus
- **TBD** — Sprint 2: pin major SC24/25 + exceptional historical events (e.g. 2003 Halloween, 2017-09 X9.3).
- Advisory only; NOT used for settlement-critical tuning unless evidence quality matches primary (per PRD §8.3).
- Storage: `grimoires/loa/calibration/corona/corpus/secondary/`.

### Per-theatre scoring rules

Per operator direction (no TREMOR wholesale reuse), each theatre has its own metric:

| Theatre | Primary metric | Sprint 2 owner task | Status |
|---------|----------------|---------------------|--------|
| T1 Flare Class | Bucket-Brier | (covered by primary protocol freeze) | TBD |
| T2 Geomagnetic Storm | Bucket-Brier with GFZ definitive Kp for regression tier | (covered by primary protocol freeze) | TBD |
| T3 CME Arrival | Arrival-window timing-error (MAE in hours; PRD §11 Q2) | `corona-2bv` (`sprint-2-bind-t3-timing-metric`) | TBD |
| T4 Proton Event Cascade (S-scale) | Bucket-based S-event count (PRD §11 Q4); replaces flare-class proxy | `corona-19q` (`sprint-2-bind-t4-bucket-boundaries`) | TBD |
| T5 Solar Wind Divergence | False-positive rate + stale-feed detection latency + satellite-switch behavior (PRD §11 Q3) | `corona-fnb` (`sprint-2-bind-t5-quality-metric`) | TBD |

### Pass / marginal / fail thresholds
- **TBD** — Sprint 2: per-theatre. Do NOT inherit TREMOR's wholesale (per operator direction).
- TREMOR's defaults (≥70% bucket hit rate / MRE <30% pass; <50% & >60% fail) are reference only; CORONA's thresholds bind to corpus during Sprint 2 freeze.

### Regression policy
- **TBD** — Sprint 2: any parameter change requires re-run; gate fails if pass/marginal threshold drops below Sprint 2 baseline.
- Beads task lifecycle: refit work in Sprint 5 (`corona-*` refit tasks) re-runs the backtest harness and produces a delta report.

## Settlement authority

Settlement is **theatre-specific** per [theatre-authority.md](theatre-authority.md). DONKI is NOT a universal settlement oracle — it supplies discovery, labels, correlations, and evidence enrichment. See `theatre-authority.md` for the full authority table + provenance citations.

## References

- PRD §5.3 — Sprint 2 scope
- PRD §6 — Theatre Authority Map
- PRD §7 — Calibration Manifest Schema (8-field provenance: parameter, value, theatre, source_type, evidence_source, confidence, corpus_hash, script_hash, derivation, provisional, settlement_critical, promotion_path)
- PRD §8.3 — Two-tier corpus
- PRD §8.4 — Per-theatre scoring rules table
- PRD §11 — Open decisions Sprint 2 owns (T3/T4/T5 metric specifics)
- SDD §5.3 — Calibration subsystem layout
- TREMOR reference: `C:\Users\0x007\tremor\grimoires\loa\calibration\omori-backtest-protocol.md`

---

*Sprint 1 placeholder (`corona-2o8`). Authored by Sprint 2 (`corona-1so` epic).*
