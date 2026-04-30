# CORONA Theatre Authority Map

**Status**: locked Sprint 0
**Owner**: cycle-001-corona-v3-calibration
**Source rule**: PRD §6 + operator amendment 2026-04-30

> **Operative rule**: DONKI is **NOT** a universal settlement oracle. It supplies discovery, labels, correlations, and evidence enrichment. Settlement authority is theatre-specific and instrument-grounded.

---

## Authority table

| Theatre | Settlement authority — live | Settlement authority — regression | DONKI role |
|---------|-----------------------------|-----------------------------------|------------|
| **T1 Flare Class Gate** | GOES/SWPC X-ray flux | GOES/SWPC X-ray flux | Discovery + label correlation + cross-validation of flare class |
| **T2 Geomagnetic Storm Gate** | SWPC provisional Kp | **GFZ definitive Kp** | Discovery + GST event labels + multi-input enrichment (Bz, speed, CME-arrival linkages) |
| **T3 CME Arrival** | **Observed L1 shock signature** (DSCOVR/ACE — speed jump + Bt increase) | Observed L1 shock signature | Forecast/evidence (WSA-Enlil arrival prediction + halo angle metadata); **NOT settlement** |
| **T4 Proton Event Cascade (S-scale)** | GOES integral proton flux ≥10 MeV crossing S-scale thresholds | GOES integral proton flux (post-event archive) | Discovery + flare-cascade correlation + proton event labels |
| **T5 Solar Wind Divergence** | **Self-resolving** via DSCOVR-ACE Bz volatility comparison + sustained streak detection. Stale-feed and satellite-switch are first-class quality signals, NOT settlement events. | Self-resolving | (none — internal divergence logic) |

---

## Provenance citations

### T1 — GOES/SWPC X-ray
- **Service**: NOAA SWPC GOES X-ray flux 1-min product (`services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json`)
- **Class definition**: NOAA flare classification (A/B/C/M/X), see [SWPC GOES X-ray product description](https://services.swpc.noaa.gov/products/documentation/goes-xray-product-description.html)
- **Reliability**: GOES primary/secondary switching tracked in `src/oracles/swpc.js`; satellite field is stamped on every evidence bundle.

### T2 — SWPC + GFZ Kp
- **SWPC service**: NOAA SWPC planetary K-index (provisional, 3-hour cadence)
- **GFZ service**: GFZ Potsdam definitive Kp (post-publication, ~30-day finalisation lag; ground truth)
- **Authority split**: SWPC provisional is the LIVE authority for in-flight markets; GFZ definitive is the REGRESSION authority for backtest and audit. Settlement against SWPC alone within 6h post-event is acceptable for non-regression certificates; settlement for backtest MUST use GFZ where available.
- **Source policy**: GFZ Kp at https://kp.gfz-potsdam.de — published Kp index policy.

### T3 — Observed L1 shock (DSCOVR/ACE)
- **DSCOVR service**: NOAA DSCOVR real-time solar wind (1-min cadence, 2015+)
- **ACE service**: NASA ACE Real Time Solar Wind (cross-validation, 1997+)
- **Forecast (NOT settlement)**: NASA DONKI WSA-Enlil arrival prediction (`api.nasa.gov/DONKI/CME` with `WSA_ENLIL_PREDICTIONS` field)
- **Settlement criterion**: simultaneous solar-wind speed jump + Bt magnitude increase at L1, sustained for ≥30 min

### T4 — GOES integral proton flux (S-scale)
- **Service**: NOAA SWPC GOES integral proton flux ≥10 MeV (`services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json`)
- **S-scale boundaries**: NOAA S-scale (S1: 10 pfu, S2: 100, S3: 1000, S4: 10000, S5: 100000) — see [NOAA Space Weather Scales](https://www.swpc.noaa.gov/noaa-scales-explanations)
- **Scope correction**: Sprint 0 cleaned the prior R-scale (radio blackout) drift in T4 buckets to S-scale. R-scale theatre deferred to a future construct pack per operator direction. Pre-cleanup state: README.md table referenced "R1+ blackouts"; spec/construct.json T4 entry buckets matched proton-event count semantics but description was R-scale-flavoured.

### T5 — Self-resolving (DSCOVR-ACE divergence)
- **DSCOVR + ACE services**: above
- **Divergence proxy**: Bz component variance over a sliding window; sustained-streak detection
- **Quality signals (NOT settlement)**: stale-feed detection latency, satellite-switching events; quality is monitored as a first-class output for downstream credibility scoring.

---

## Why DONKI is NOT settlement

DONKI is NASA's curated event archive. It collates flares, CMEs, geomagnetic storms, and shocks, AND it provides the WSA-Enlil arrival forecasts. But DONKI's classifications are themselves derived from the same primary instrument feeds (GOES, ground magnetometers, etc.), and DONKI's data publication lags real-time by minutes-to-hours. For settlement, CORONA goes upstream to the primary instrument:

- **T1**: GOES X-ray IS the source DONKI's FLR records derive from. Settle from GOES.
- **T2**: GFZ Kp IS the definitive product DONKI's GST records reference. Settle from GFZ (regression) or SWPC provisional (live).
- **T3**: DONKI's WSA-Enlil is a forecast model. Settlement requires the actual L1 observation.
- **T4**: GOES integral proton IS the source DONKI's SEP records derive from. Settle from GOES.
- **T5**: DONKI does not serve T5 (no settlement involvement; internal divergence).

DONKI's value is in cross-validation, naming/labelling, and surfacing causal chains (e.g. "this CME was associated with this flare which produced this proton event"). For evidence enrichment and discovery, DONKI is invaluable. For settlement, it is one step removed from ground truth.

---

## Refresh policy

This document is the authority of record for theatre-specific settlement. Changes require:

1. **PRD §6 amendment** (operator-driven)
2. **Sprint-0-style v3 readiness re-pass** to update structural references
3. **Manifest review** for any theatre whose settlement authority changes (parameter promotion paths may change)

---

*Authored cycle-001 Sprint 0 (Beads `corona-1mv`) by `/implement` agent. Verbatim PRD §6 carried forward; per-row provenance citations added per sprint.md:119 acceptance criterion. Operative rule reproduced verbatim from PRD §6 + operator amendment 2026-04-30.*
