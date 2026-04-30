# corona/corpus/

Calibration corpus root for CORONA cycle-001.

## Purpose

This directory holds the **frozen historical event list** used for backtest calibration of CORONA's 5 theatres (T1-T5). Sprint 2 (`corona-1so` epic) freezes the protocol; Sprint 3 (`corona-d4u` epic) populates per-event fixture data from DONKI + SWPC + DSCOVR archives; Sprint 5 (refit work) consumes the corpus when the backtest harness runs.

## Corpus tiers (per PRD §8.3)

| Tier | Window | Approx size | Used for |
|------|--------|-------------|----------|
| **Primary** | GOES-R era (2017+) | ~15-25 events per theatre | Parameter fitting, scoring thresholds, regression gates |
| **Secondary** | SC24/25 + exceptional historical (2003 Halloween, 2017-09 X9.3, etc.) | ad hoc, evidence-quality-gated | Sanity checks, edge-case coverage; NOT settlement-critical tuning unless evidence matches primary |

## Layout (Sprint 2 populates)

```
corpus/
├── primary/
│   ├── T1-flare-class/
│   │   ├── <YYYY-MM-DD>-<class>.json    # e.g. 2024-05-10-X5.8.json
│   │   └── ...
│   ├── T2-geomag-storm/
│   │   ├── <YYYY-MM-DD>-Kp<N>.json
│   │   └── ...
│   ├── T3-cme-arrival/
│   │   ├── <YYYY-MM-DD>-CME-<id>.json   # WSA-Enlil prediction + observed L1 shock pair
│   │   └── ...
│   ├── T4-proton-cascade/
│   │   ├── <YYYY-MM-DD>-S<level>.json   # NOAA S-scale proton event
│   │   └── ...
│   └── T5-solar-wind-divergence/
│       ├── <YYYY-MM-DD>-divergence.json
│       └── ...
├── secondary/
│   ├── 2003-halloween-storm/
│   ├── 2017-09-X9.3/
│   └── ...
└── corpus-manifest.json   # SHA256 over each corpus file; computed at Sprint 2 freeze time
```

## Freeze policy

When Sprint 2 freezes the protocol, this corpus directory is committed and treated as **read-only**. Future cycles that change the corpus require:

1. Explicit operator authorization (HITL gate)
2. Re-running the backtest harness against the new corpus
3. Updating `calibration-protocol.md` with the corpus delta + rationale
4. Re-computing `corpus_hash` for every affected `calibration-manifest.json` entry (per PRD §7)

## Per-theatre acquisition notes (Sprint 2 fills)

- **T1 (flare class)**: GOES X-ray flux 1-min product archive + DONKI FLR cross-validation
- **T2 (geomag storm)**: SWPC Kp + GFZ definitive Kp (regression authority)
- **T3 (CME arrival)**: DONKI WSA-Enlil prediction + DSCOVR/ACE L1 shock observation pairs
- **T4 (proton cascade, S-scale)**: GOES integral proton flux ≥10 MeV crossings + DONKI SEP records
- **T5 (solar wind divergence)**: DSCOVR + ACE L1 Bz time series; self-resolving with stale-feed and satellite-switch guards

## References

- PRD §5.3 — Sprint 2 scope (corpus pinning)
- PRD §8.3 — Two-tier corpus structure
- SDD §6.2 — Backtest harness corpus consumption
- TREMOR reference: `C:\Users\0x007\tremor\grimoires\loa\calibration\omori-backtest-protocol.md` (19 pinned earthquake sequences) + `omori-backtest/run-N/` (per-run certificates)

---

*Sprint 1 scaffold (`corona-2o8`). Populated by Sprint 2 (`corona-1so` epic) + Sprint 3 (`corona-d4u` epic).*
