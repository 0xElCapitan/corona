# CORONA

**Coronal Oracle & Realtime Observation Network Agent**

CORONA is a space-weather intelligence construct that turns public solar, geomagnetic, CME, proton, and solar-wind feeds into structured prediction-market surfaces and Brier-scored calibration certificates.

It is designed for construct-network / RLMF-style agent learning pipelines: each Theatre defines a bounded forecast surface, explicit settlement authority, and auditable provenance trail.

> **v0.2.0** — cycle-001 closed. **Trust level**: L1 (Tested). **Calibration**: infrastructure committed, no parameter refits. **L2 publish-readiness**: not yet — see [Calibration Status](#calibration-status).

## What It Does

CORONA watches the Sun. When solar flares erupt, CMEs launch toward Earth, or geomagnetic storms brew, CORONA opens prediction markets and updates positions as evidence streams in from NOAA and NASA data feeds. Every resolved market exports a calibration certificate — calibration infrastructure and provenance are committed; predictive uplift has not yet been demonstrated.

```
  NOAA SWPC ──→ ┌──────────────┐     ┌──────────┐     ┌──────────┐
  (GOES, Kp,    │  Processor   │────→│ Theatres │────→│   RLMF   │
   DSCOVR)      │  Pipeline    │     │  T1-T5   │     │  Certs   │
  NASA DONKI ──→ └──────────────┘     └──────────┘     └──────────┘
  (FLR, CME,       quality              position         Brier
   GST, IPS)       uncertainty          updates          scores
                   settlement
```

## Theatre Templates

| ID | Name | Type | Question |
|----|------|------|----------|
| T1 | Flare Class Gate | Binary | Will a ≥M/X-class flare occur within 24h? |
| T2 | Geomagnetic Storm Gate | Binary | Will Kp reach ≥5 (G1) within 72h? |
| T3 | CME Arrival | Binary | Will CME arrive within predicted window ±6h? |
| T4 | Proton Event Cascade | Multi-bucket | How many S1+ proton events following M5+ trigger? |
| T5 | Solar Wind Divergence | Binary | Will sensor readings diverge beyond threshold? |

## Data Sources

All free, all JSON, minimal auth.

- **NOAA SWPC** (`services.swpc.noaa.gov`) — GOES X-ray flux, planetary Kp, proton flux, DSCOVR solar wind. No auth required.
- **NASA DONKI** (`api.nasa.gov/DONKI`) — Discovery, labels, and evidence enrichment for solar flares, CMEs, and geomagnetic storms with cause-effect linkages. **DONKI is NOT a universal settlement authority** — settlement is theatre-specific (e.g., T1 settles against GOES X-ray flux; T2 against GFZ definitive Kp; T3 against L1 shock observation). See [`grimoires/loa/calibration/corona/theatre-authority.md`](grimoires/loa/calibration/corona/theatre-authority.md). Free API key (`DEMO_KEY` for development).
- **GFZ Potsdam** — Definitive Kp/Hp index (ground truth for Kp settlement).

## Quick Start

```bash
# Validate v3 manifest (Sprint 0 deliverable)
./scripts/construct-validate.sh construct.yaml

# Run full v0.2.0 test suite — 160 tests across 29 suites, zero dependencies required
npm test

# Reproduce the v0.2.0 calibration run (writes to a scratch dir; does NOT overwrite the
# committed run-1 / run-2 / run-3-final certificates)
CORONA_OUTPUT_DIR=run-scratch node scripts/corona-backtest.js

# Poll SWPC feeds (live, standalone)
node src/oracles/swpc.js

# Programmatic usage
import { CoronaConstruct } from './src/index.js';

const corona = new CoronaConstruct();

// Open markets
corona.openFlareClassGate({
  threshold_class: 'M1.0',
  window_hours: 24,
  base_rate: 0.15,
});

corona.openGeomagneticStormGate({
  kp_threshold: 5,
  window_hours: 72,
  base_rate: 0.10,
});

// Start polling
corona.start();

// Check state
console.log(corona.getState());

// Export certificates after resolution
const certs = corona.getCertificates();
```

## Architecture

Follows TREMOR's established construct pattern:

**Oracle → Processor → Theatre → RLMF**

- **Oracles**: Fetch and normalize external data feeds
- **Processor pipeline**: Quality scoring → Uncertainty pricing → Settlement assessment → Bundle construction
- **Theatres**: Stateful prediction markets with position histories
- **RLMF**: Brier-scored certificate export with temporal analysis

Zero external dependencies. Node.js 20+ built-in test runner.

## Calibration Status

cycle-001 closed at **v0.2.0** — `git show v0.2.0` for the canonical release record.

**What v0.2.0 IS:**

- **L1 tested** — 160 tests across 29 suites pass; zero runtime dependencies (`package.json` `"dependencies": {}`)
- **v3-ready** — `construct.yaml` validates against `schemas/construct.schema.json @ b98e9ef`; `./scripts/construct-validate.sh construct.yaml` exits 0
- **Provenance-locked** — 30-entry [`calibration-manifest.json`](grimoires/loa/calibration/corona/calibration-manifest.json) registers each runtime parameter with `verification_status` (1 `VERIFIED_FROM_SOURCE`, 29 provisional with documented `promotion_path`)
- **Regression-gated** — 29 inline-equals-manifest tests prevent un-blessed parameter drift (per SDD §7.3)
- **Hardened** — Sprint 6 input-validation review: 0 critical / 0 high / 0 medium audit findings ([`security-review.md`](grimoires/loa/calibration/corona/security-review.md))
- **Reproducible** — 3 calibration runs (`run-1/`, `run-2/`, `run-3-final/`) under [`grimoires/loa/calibration/corona/`](grimoires/loa/calibration/corona/) share invariant `corpus_hash` (`b1caef3...`) and `script_hash` (`17f6380b...`)

**What v0.2.0 is NOT:**

- **NOT calibration-improved** — Run 1 = Run 2 = Run-3-final numerically by current harness architecture: the offline scoring layer uses uniform-prior baselines (T1, T2, T4) and corpus-anchored ground truth (T3, T5); the live runtime CORONA processor parameters (`flareThresholdProbability`, `kpThresholdProbability`, `buildCMEArrivalUncertainty`, etc.) are not exercised by the offline scoring path. Sprint 5 made an evidence-driven NO-CHANGE decision per Sprint 4 literature evidence; predictive uplift is a future-cycle deliverable.
- **NOT L2 publish-ready** in the strict construct-network sense — Sprint 0 carry-forward gaps (commands.path JS-vs-md convention, `schemas/CHECKSUMS.txt`, tempfile EXIT trap, `ajv-formats` install) block L2 publish. v0.2.0 is "construct + calibration committed", not "L2 published".

**Final composite verdict** at [`run-3-final/summary.md`](grimoires/loa/calibration/corona/run-3-final/summary.md): **`fail`** (per-theatre: T1 fail, T2 pass, T3 fail, T4 fail, T5 fail). This reflects (a) corpus characteristics (T1 / T4 buckets sparse — observed_count = 0 in 5/6 buckets), (b) WSA-Enlil corpus prediction error (T3 MAE 6.76 h dominated by one 16 h-error event), and (c) intentional T5 FP-rate test labels — **not evidence of runtime parameter degradation**.

For the full posture, Known Limitations, future-cycle owner items, and the Sprint 0-7 calibration timeline, see [`BUTTERFREEZONE.md`](BUTTERFREEZONE.md).

## Calibration Edge Cases

- **GOES satellite switching**: Primary/secondary reliability scores tracked per bundle
- **Flare reclassification**: In-progress events carry high doubt pricing (0.55+); only complete or DONKI-confirmed events resolve theatres
- **Kp preliminary vs definitive**: SWPC Kp provisional for ~30 days; GFZ definitive is ground truth
- **CME arrival uncertainty**: WSA-Enlil sigma 10-18h depending on halo angle; glancing blows get 1.5× wider sigma
- **Eclipse season**: GOES data gaps handled as quality degradation

## Relationship to TREMOR

CORONA is the second Echelon construct. It follows the same architectural patterns:

| TREMOR | CORONA |
|--------|--------|
| USGS GeoJSON | NOAA SWPC + NASA DONKI |
| Magnitude Gate | Flare Class Gate |
| Aftershock Cascade | Proton Event Cascade |
| Oracle Divergence | Solar Wind Divergence |
| Depth Regime | Geomagnetic Storm Gate |
| Swarm Watch | CME Arrival |

RLMF certificates share the same schema for pipeline compatibility.

## Ecosystem Context

CORONA was developed in the [Echelon](https://github.com/AITOBIAS04/Echelon) construct ecosystem (constructs originated by [Soju](https://github.com/zkSoju)) and maintained through [Loa](https://github.com/0xHoneyJar/loa)-assisted sprint workflows. These are integration contexts, not required trust assumptions for understanding the construct: CORONA is self-contained, has zero runtime dependencies, and can be exercised against the validator + test suite + backtest harness without any ecosystem dependency at runtime.

## Tests

160 tests, 29 suites, all passing:

```
npm test

# tests 160
# suites 29
# pass 160
# fail 0
```

Per-file breakdown: 93 baseline (`tests/corona_test.js`) + 22 manifest structural (`tests/manifest_structural_test.js`, Sprint 5) + 29 manifest regression (`tests/manifest_regression_test.js`, Sprint 5) + 6 PEX-1 security (`tests/security/proton-cascade-pex1-test.js`, Sprint 6) + 10 C-006 security (`tests/security/corpus-loader-low1-test.js`, Sprint 6).

## License

MIT
