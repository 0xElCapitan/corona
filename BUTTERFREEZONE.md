<!-- AGENT-CONTEXT
name: corona
type: construct
purpose: Space weather intelligence construct for Echelon — monitors solar flares, CMEs, geomagnetic storms, and solar wind through structured prediction markets (Theatres) producing Brier-scored RLMF training data
version: 0.2.0
key_files: [src/index.js, src/oracles/swpc.js, src/oracles/donki.js, src/processor/bundles.js, src/theatres/flare-gate.js]
interfaces:
  oracles: [SWPC_GOES, SWPC_DSCOVR, SWPC_KP, DONKI]
  theatres: [flare_class_gate, geomagnetic_storm_gate, cme_arrival, proton_event_cascade, solar_wind_divergence]
  exports: [RLMF certificates]
dependencies: []
ecosystem:
  - repo: echelon-protocol/echelon
    role: platform
    interface: theatre-api
    protocol: echelon@0.1.0
  - repo: echelon-protocol/tremor
    role: sibling-construct
    interface: rlmf-pipeline
    protocol: echelon@0.1.0
capability_requirements:
  - network: read
trust_level: L1-tested
calibration_status: attempted-no-refit
v3_schema: "schemas/construct.schema.json @ b98e9ef"
test_count: 160
-->

# CORONA

<!-- provenance: DERIVED -->
**Coronal Oracle & Realtime Observation Network Agent.** Space weather intelligence construct for the Echelon prediction market protocol. Monitors solar activity through NOAA SWPC and NASA DONKI data pipelines, produces calibrated training data via 5 Theatre templates resolving against real-time GOES X-ray flux, planetary Kp index, CME arrival signatures, and proton event cascades.

## Key Capabilities

<!-- provenance: CODE-FACTUAL -->

- **SWPC Oracle** — Polls NOAA GOES X-ray flux (1-min), planetary Kp index (3-hr), integral proton flux, and DSCOVR real-time solar wind. Zero auth, JSON feeds. (`src/oracles/swpc.js`)
- **DONKI Oracle** — Fetches NASA DONKI solar flares, CMEs with WSA-Enlil arrival predictions, geomagnetic storms, and interplanetary shocks with cause-effect linkages. (`src/oracles/donki.js`)
- **Evidence Bundle Builder** — Converts raw SWPC/DONKI data into Echelon-compatible bundles with quality scoring, uncertainty pricing, and settlement assessment. (`src/processor/bundles.js`)
- **Quality Scoring** — Multi-component quality model: source reliability, data freshness, instrument status, measurement completeness. (`src/processor/quality.js`)
- **Uncertainty Pricing** — Flare class reclassification doubt, Kp preliminary vs definitive, CME arrival time sigma (WSA-Enlil MAE ~10h). Normal CDF threshold crossing probabilities. (`src/processor/uncertainty.js`)
- **Settlement Logic** — Evidence class determination: ground_truth (DONKI-confirmed, GFZ definitive), provisional_mature, cross_validated, provisional, degraded. Handles GOES satellite switching, flare reclassification, Kp preliminary lag. (`src/processor/settlement.js`)
- **Flare Class Gate (T1)** — Binary market on GOES X-ray class threshold. Position updates via doubt pricing on in-progress flares. (`src/theatres/flare-gate.js`)
- **Geomagnetic Storm Gate (T2)** — Binary Kp threshold market. Multi-input: Kp observations, solar wind precursors (Bz, speed), CME arrival predictions, DONKI GST events. (`src/theatres/geomag-gate.js`)
- **CME Arrival (T3)** — Binary market on WSA-Enlil predicted arrival ±6h. Resolves via L1 solar wind shock detection (speed jump + Bt increase). (`src/theatres/cme-arrival.js`)
- **Proton Event Cascade (T4)** — Multi-bucket S1+ proton-event count following M5+ trigger. Wheatland waiting-time prior, Poisson bucket probabilities, rate-blended updating. cycle-001 Sprint 0 cleaned R-scale drift to S-scale per NOAA Solar Radiation Storm Scale; Sprint 2 retired the subsequent-flare proxy when corpus binding landed. (`src/theatres/proton-cascade.js`)
- **Solar Wind Divergence (T5)** — Paradox Engine native: DSCOVR-ACE Bz volatility as divergence proxy. Sustained streak detection. (`src/theatres/solar-wind-divergence.js`)
- **RLMF Certificate Export** — Binary and multi-class Brier scores, temporal analysis (volatility, directional accuracy, time-weighted Brier), calibration buckets. Pipeline-compatible with TREMOR certificates. (`src/rlmf/certificates.js`)
- **Backtest Harness** — cycle-001 Sprint 3 deliverable. 5-event-per-theatre primary corpus (25 events), uniform-prior baseline scoring per Sprint 2 frozen protocol, per-theatre certificate generation with corpus_hash + script_hash invariants. (`scripts/corona-backtest.js`, `scripts/corona-backtest/`)
- **Calibration Manifest** — cycle-001 Sprint 5 deliverable. 30-entry parameter-provenance registry per PRD §7 schema. Each entry has `verification_status`, `promotion_path`, and `inline_lookup` with regression-gate enforcement. (`grimoires/loa/calibration/corona/calibration-manifest.json`)

## Architecture

<!-- provenance: DERIVED -->
The architecture follows the Echelon construct pattern established by TREMOR: dual-oracle polling feeds a processor pipeline that builds typed evidence bundles, which are matched against active Theatres for position updates. Resolved Theatres export RLMF certificates. The construct runs as a single-process event loop with configurable poll intervals (1-min SWPC, 5-min DONKI).

```
                    CoronaConstruct
                         |
          ┌──────────────┼──────────────┐
          |              |              |
     ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
     | Oracles |   | Process |   | Theatres|
     | swpc.js |   | bundles |   | T1-T5   |
     | donki.js|   | quality |   | flare   |
     |         |   | uncert. |   | geomag  |
     |         |   | settle. |   | cme     |
     |         |   |         |   | proton  |
     |         |   |         |   | sw-div  |
     └─────────┘   └─────────┘   └────┬────┘
                                       |
                                 ┌─────┴─────┐
                                 |    RLMF    |
                                 | certificates|
                                 └───────────┘
```

Directory structure:
```
corona/
├── src/
│   ├── index.js              # Construct entrypoint + lifecycle
│   ├── oracles/
│   │   ├── swpc.js           # NOAA SWPC feeds
│   │   └── donki.js          # NASA DONKI API
│   ├── processor/
│   │   ├── bundles.js        # Evidence bundle construction
│   │   ├── quality.js        # Quality scoring
│   │   ├── uncertainty.js    # Uncertainty pricing
│   │   └── settlement.js     # Evidence class + resolution
│   ├── theatres/
│   │   ├── flare-gate.js     # T1: Flare Class Gate
│   │   ├── geomag-gate.js    # T2: Geomagnetic Storm Gate
│   │   ├── cme-arrival.js    # T3: CME Arrival
│   │   ├── proton-cascade.js # T4: Proton Event Cascade
│   │   └── solar-wind-divergence.js  # T5: Paradox Engine
│   └── rlmf/
│       └── certificates.js   # RLMF export
├── scripts/
│   ├── corona-backtest.js    # Backtest harness entrypoint (Sprint 3)
│   ├── corona-backtest/      # Per-theatre scoring + ingestors + reporting
│   └── construct-validate.sh # v3 manifest validator
├── grimoires/loa/calibration/corona/
│   ├── calibration-protocol.md       # Sprint 2 frozen protocol
│   ├── calibration-manifest.json     # Sprint 5: 30 entries
│   ├── empirical-evidence.md         # Sprint 4: literature evidence (1141 lines)
│   ├── security-review.md            # Sprint 6: 25 findings
│   ├── theatre-authority.md          # Sprint 0: per-theatre authority map
│   ├── corpus/primary/               # Sprint 3: 25-event primary corpus (frozen)
│   ├── run-1/                        # Sprint 3 baseline (corpus_hash + script_hash anchored here)
│   ├── run-2/                        # Sprint 5 post-no-refit (numerics identical to run-1)
│   └── run-3-final/                  # Sprint 7 closeout (numerics identical to run-1, run-2)
├── tests/
│   ├── corona_test.js                # 93 baseline tests (Sprint 0-3)
│   ├── manifest_structural_test.js   # 22 manifest schema tests (Sprint 5)
│   ├── manifest_regression_test.js   # 29 inline-equals-manifest tests (Sprint 5)
│   └── security/
│       ├── proton-cascade-pex1-test.js  # 6 PEX-1 regression tests (Sprint 6)
│       └── corpus-loader-low1-test.js   # 10 C-006 regression tests (Sprint 6)
├── construct.yaml             # v3 manifest (schema commit b98e9ef)
└── package.json               # version 0.2.0; "dependencies": {}
```

## Interfaces

<!-- provenance: CODE-FACTUAL -->

### Data Sources

| Source | Base URL | Auth | Cadence |
|--------|----------|------|---------|
| SWPC GOES X-ray | services.swpc.noaa.gov/json/goes/ | None | 1-min |
| SWPC Kp Index | services.swpc.noaa.gov/products/ | None | 3-hr |
| SWPC Proton Flux | services.swpc.noaa.gov/json/goes/ | None | 5-min |
| SWPC Solar Wind | services.swpc.noaa.gov/products/solar-wind/ | None | 1-min |
| NASA DONKI FLR | api.nasa.gov/DONKI/FLR | API key | Event |
| NASA DONKI CME | api.nasa.gov/DONKI/CME | API key | Event |
| NASA DONKI GST | api.nasa.gov/DONKI/GST | API key | Event |

### Theatre Templates

| ID | Template | Type | Resolution Source |
|----|----------|------|-------------------|
| T1 | flare_class_gate | Binary | GOES X-ray + DONKI FLR |
| T2 | geomagnetic_storm_gate | Binary | Kp index + DONKI GST |
| T3 | cme_arrival | Binary | L1 solar wind shock |
| T4 | proton_event_cascade | Multi-class (5 buckets) | DONKI SEP / GOES proton flux |
| T5 | solar_wind_divergence | Quality-of-behavior | Bz volatility streak + corpus FP labels |

## Module Map

<!-- provenance: CODE-FACTUAL -->

| Module | Files | Purpose |
|--------|-------|---------|
| `src/oracles/` | 2 | SWPC + DONKI data fetching and normalization |
| `src/processor/` | 4 | Bundle construction, quality, uncertainty, settlement |
| `src/theatres/` | 5 | Theatre templates T1-T5 |
| `src/rlmf/` | 1 | Certificate export for RLMF pipeline |
| `scripts/corona-backtest/` | 14 | Backtest harness: per-theatre scoring (5), ingestors (5), reporting (3), config (1) |
| `tests/` | 5 files | 160 tests across 29 suites (node:test) |

## Verification

<!-- provenance: CODE-FACTUAL -->
- **Trust Level**: L1 — Tested
- **Calibration Status**: Attempted, no parameter refits (see "Calibration Status" below)
- **Test Count**: 160 tests across 29 suites, all passing on Node.js 20+
- **Validator**: `./scripts/construct-validate.sh construct.yaml` exits 0 against `schemas/construct.schema.json @ b98e9ef`
- **Dependencies**: zero (`package.json` `"dependencies": {}` invariant)
- **Allowed Node primitives**: `node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch`, `node:test`, `node:assert/strict`
- **RLMF certificates compatible** with TREMOR pipeline schema

## Calibration Status

<!-- provenance: CALIBRATION -->

**v0.2.0 ships the construct as a deployable + calibration-attempted artifact, NOT a calibration-improved one.** This section documents the cycle-001 calibration outcome with the framing required by the operator's hard constraints.

### Calibration timeline (cycle-001)

| Sprint | Deliverable | Outcome |
|--------|-------------|---------|
| Sprint 0 | v3 readiness, theatre-authority map, T4 R→S scaffold, validator | Validator green; `construct.yaml` v3-conformant |
| Sprint 1 | `composition_paths.calibration` declared; calibration directory scaffolded | Paths bound to `grimoires/loa/calibration/corona/` |
| Sprint 2 | Frozen calibration protocol; T4 flare-class proxy retired | `calibration-protocol.md` (523 lines) committed; metric specifics bound |
| Sprint 3 | Backtest harness + 25-event primary corpus + Run 1 baseline | corpus_hash `b1caef3...` + script_hash `17f6380b...` anchored |
| Sprint 4 | Empirical evidence research (literature) | `empirical-evidence.md` (1141 lines, 14 primary citations, 6 PRD §5.5 coverage targets) |
| Sprint 5 | Refit window; manifest authoring; regression gate; Run 2 | **Evidence-driven NO-CHANGE decision** — no parameter refits; manifest 30 entries; 51 manifest tests; Run 2 numerics identical to Run 1 |
| Sprint 6 | Lightweight input-validation review | 25 findings (0 critical / 0 high / 9 medium / 16 low); PEX-1 + C-006 carry-forward fixes; 16 security tests |
| Sprint 7 | Final validate + BFZ refresh + Run-3-final + version bump | Validator green; Run-3-final numerics identical to Run 1 / Run 2; `package.json` 0.1.0 → 0.2.0 |

### Run 1 / Run 2 / Run-3-final invariants

| Run | Date (UTC) | Code revision | corpus_hash | script_hash | Composite verdict |
|-----|------------|---------------|-------------|-------------|-------------------|
| run-1 | 2026-05-01T04:21:35Z | `7e8b52e` | `b1caef3...` | `17f6380b...` | fail |
| run-2 | 2026-05-01T14:50:21Z | `edd816f` | `b1caef3...` | `17f6380b...` | fail |
| run-3-final | 2026-05-01T20:48:50Z | `cf489ee` | `b1caef3...` | `17f6380b...` | fail |

**Per-theatre numerics IDENTICAL across all three runs:**

| Theatre | Primary metric | Secondary | n_events | Verdict |
|---------|----------------|-----------|----------|---------|
| T1 (flare_class_gate) | Brier 0.1389 | min calibration 0.000 | 5 | fail |
| T2 (geomagnetic_storm_gate) | Brier 0.1389 | GFZ↔SWPC convergence 0.9627 | 5 (excl GFZ-lag: 0) | pass |
| T3 (cme_arrival) | MAE 6.76h | ±6h hit 40.0% | 5 | fail |
| T4 (proton_event_cascade) | Brier 0.1600 | min calibration 0.000 | 5 | fail |
| T5 (solar_wind_divergence) | FP 25.0% | p50 90.0s, switch 100.0% | 5 | fail |

### Why numerics are identical (architectural reality)

**The numerical match across Run 1 / Run 2 / Run-3-final is NOT a calibration improvement claim.** It is the architectural reality of the Sprint 3 harness, documented in `grimoires/loa/calibration/corona/run-2/delta-report.md` (Sprint 5) and `grimoires/loa/calibration/corona/run-3-final/delta-report.md` (Sprint 7):

1. The harness scores against `UNIFORM_PRIOR` baselines for T1, T2, T4 (`scripts/corona-backtest/scoring/t1-bucket-brier.js:32`, `t2-bucket-brier.js`, `t4-bucket-brier.js`). T3 reads `wsa_enlil_predicted_arrival_time` from the corpus directly. T5 FP rate is `corpus_fp_label`-anchored.
2. None of these scoring paths consume runtime parameter constants. The runtime CORONA processor parameters (`flareThresholdProbability`, `kpThresholdProbability`, `buildCMEArrivalUncertainty`, etc.) are NOT exercised by the offline scoring layer — they are part of the live theatre's evidence-ingestion path.
3. Sprint 5 made an **evidence-driven NO-CHANGE decision** (NOTES.md S5-1) per Sprint 4 §4.2-§4.5 literature evidence. The construct's parameter values reflect Sprint 0 + Sprint 4 evidence, not Sprint 5 refits.
4. Sprint 6 made input-validation hardening fixes (PEX-1, C-006) but did NOT modify any scoring code path.
5. Sprint 7 made NO source modifications prior to Run-3-final; the `script_hash` invariant is preserved bit-for-bit.

**Composite verdict `fail` reflects:** (a) corpus characteristics (T1/T4 buckets with observed_count=0 in 5/6 buckets → calibration=0); (b) WSA-Enlil prediction error in the corpus (T3 MAE 6.76h dominated by one 16h-error event); (c) intentional T5 FP-rate test labels in the corpus. **None of these are calibration deficiencies of the construct's runtime parameters.**

### Calibration manifest provenance (Sprint 5)

The `calibration-manifest.json` registers 30 parameter entries with verification-status taxonomy per Sprint 4 §1.1:

| Verification status | Entry count | Provisional? |
|---------------------|-------------|--------------|
| `VERIFIED_FROM_SOURCE` | 1 | false |
| `ENGINEER_CURATED_REQUIRES_VERIFICATION` | 15 | true |
| `OPERATIONAL_DOC_ONLY` | 8 | true |
| `HYPOTHESIS_OR_HEURISTIC` | 6 | true |

**29/30 entries are provisional with documented `promotion_path` requirements.** No Sprint 7 entry was promoted to a higher verification tier; promotion is a future-cycle activity governed by the literature/empirical work each entry's `promotion_path` specifies.

The regression gate (`tests/manifest_regression_test.js`, 29 tests) compares each `inline_lookup` `match_pattern` against the corresponding source-file literal value, failing on un-blessed drift per SDD §7.3.

## Calibration Edge Cases

<!-- provenance: OPERATIONAL -->
- **GOES primary/secondary switching**: Source reliability scores differ; satellite field tracked in evidence bundles
- **Flare reclassification**: In-progress flares carry high doubt_price (0.55+); only complete/DONKI-confirmed events resolve theatres
- **Kp preliminary vs definitive**: SWPC Kp is provisional for ~30 days; GFZ definitive Kp is ground truth. Settlement requires either GFZ or 6h-aged SWPC
- **Eclipse season**: GOES data gaps during spring/fall equinox periods; null flux handled as quality degradation, not evidence
- **CME arrival uncertainty**: WSA-Enlil sigma ~10-18h depending on CME type; glancing blows get 1.5× wider sigma
- **Backtest tier exclusions**: T2 regression-tier excludes events within 30 days of run date (GFZ definitive lag); T2 latest-tier accepts SWPC preliminary
- **Negative-latency rejection (Sprint 6 C-006 fix)**: T5 stale-feed events with negative latency are now rejected at ingest (`scripts/corona-backtest/ingestors/corpus-loader.js:326-349`)

## Security Review

<!-- provenance: CALIBRATION -->

cycle-001 Sprint 6 delivered `grimoires/loa/calibration/corona/security-review.md` per SDD §8.3 template. Findings classified per SDD §8.4:

| Severity | Count | Sprint 7 disposition |
|----------|-------|----------------------|
| Critical | 0 | n/a |
| High | 0 | n/a |
| Medium | 9 | All carry-forward (deferred or accepted residual per SDD §8.4) |
| Low | 16 | All carry-forward (deferred or accepted residual per SDD §8.4) |

**Sprint 6 carry-forward fixes (now permanent baseline):**
- **PEX-1** — `src/theatres/proton-cascade.js:266,284` optional-chaining defensive payload access (4-character defensive patch). Regression coverage: `tests/security/proton-cascade-pex1-test.js` (6 tests).
- **C-006 / LOW-1** — `scripts/corona-backtest/ingestors/corpus-loader.js:326-349` negative-latency rejection in T5 `stale_feed_events` (24-line addition). Regression coverage: `tests/security/corpus-loader-low1-test.js` (10 tests).

The audit closed APPROVED with 0 critical/high/medium findings and 3 LOW informational observations (LOW-A1, LOW-A2, LOW-A3) deferred to future cycle at engineer discretion.

## Known Limitations

<!-- provenance: CALIBRATION -->

The following are documented for v0.2.0 release-honesty. Each is non-blocking for the calibration-attempted release but is an explicit future-cycle owner item.

### Calibration

- **No parameter refits in cycle-001.** Sprint 5 made an evidence-driven NO-CHANGE decision per Sprint 4 §4.2-§4.5 literature evidence. v0.2.0 is "construct + calibration committed", not "calibration delivers improved Brier/MAE." Run-2/run-3-final = Run-1 numerically by design.
- **29/30 manifest entries are provisional.** Each carries a `promotion_path` indicating literature or empirical work needed for `VERIFIED_FROM_SOURCE` promotion. Promotion is future-cycle scope.
- **5-event-per-theatre primary corpus.** Sprint 3 corpus is intentionally small for harness verification. Larger corpus (25+ events per theatre) is future-cycle scope per Sprint 4 §4.5 entry-006 promotion path.
- **Composite verdict `fail`.** Reflects corpus characteristics + WSA-Enlil corpus error + T5 intentional test labels. Not a calibration deficiency.

### Provenance

- **Sprint 5 LOW-1 (`corona-evidence-020`)**: `match_pattern` is a comment-substring match (`"log-flux"`) rather than a runtime literal anchor. `verification_status: OPERATIONAL_DOC_ONLY`. Documented in `grimoires/loa/a2a/sprint-5/engineer-feedback.md` LOW-1 + auditor-sprint-feedback.md LOW-1. Future-cycle: anchor on imported runtime function names.
- **Sprint 6 LOW-A1**: `resolveOutputDir` (`scripts/corona-backtest/config.js:121-124`) parallel to C-008 not catalogued in security-review.md. Documentation polish only; no code change required. Documented in `grimoires/loa/a2a/sprint-6/auditor-sprint-feedback.md` LOW-A1.
- **Sprint 6 LOW-A2**: C-006 (medium) vs LOW-1 (low) severity inconsistency for the same underlying corpus-loader negative-latency issue. Cross-references exist; severity not reconciled. Documentation polish only.
- **Sprint 6 LOW-A3**: Backtest harness defaults to `run-1` output, causing accidental overwrite (reverted in cycle-001). Future-cycle harness amendment to default to `run-scratch` or require explicit `CORONA_OUTPUT_DIR`.

### L2 Publish-Readiness

cycle-001 v0.2.0 ships as **L1 tested + calibration committed**. It is **NOT L2 publish-ready** in the strict construct-network sense. The Sprint 0 carry-forward gaps to L2 publish are documented in Sprint 0 review/audit:

- `commands.path` references JS files (`src/theatres/*.js`) rather than upstream-convention `commands/*.md` markdown files.
- `schemas/CHECKSUMS.txt` not generated.
- Tempfile EXIT trap not added to `scripts/construct-validate.sh`.
- `ajv-formats` not installed for full validator coverage.

**These do not block deployment; they block L2 publish to construct-network.** Closing them is future-cycle scope.

### Sprint 1 review C5

`composition_paths.reads: []` registry compatibility with the construct-network indexer was not verified locally (indexer not available in cycle-001 dev environment). Documented in `grimoires/loa/a2a/sprint-1/engineer-feedback.md`.

## Quick Start

<!-- provenance: OPERATIONAL -->

```bash
# Run full test suite (160 tests across 29 suites)
node --test tests/corona_test.js \
            tests/manifest_structural_test.js \
            tests/manifest_regression_test.js \
            tests/security/proton-cascade-pex1-test.js \
            tests/security/corpus-loader-low1-test.js

# Run construct validator
./scripts/construct-validate.sh construct.yaml

# Run backtest harness against frozen primary corpus
CORONA_OUTPUT_DIR=run-scratch node scripts/corona-backtest.js

# Poll SWPC feeds (standalone)
node src/oracles/swpc.js

# Poll DONKI (requires NASA_API_KEY env var, or uses DEMO_KEY)
NASA_API_KEY=your_key node src/oracles/donki.js

# Programmatic usage
import { CoronaConstruct } from './src/index.js';
const corona = new CoronaConstruct();

// Open a flare gate
corona.openFlareClassGate({
  threshold_class: 'M1.0',
  window_hours: 24,
  base_rate: 0.15,
});

// Start polling
corona.start();
```

## Ecosystem

<!-- provenance: DERIVED -->
CORONA is the second construct in the Echelon ecosystem after TREMOR (seismic intelligence). Both produce RLMF certificates with identical schemas for pipeline compatibility. CORONA's Theatre templates follow the same patterns: binary gates (T1, T2, T3) map to TREMOR's Magnitude Gate, multi-class cascades (T4) map to Aftershock Cascade. T5 (Solar Wind Divergence) is a Paradox Engine native quality-of-behavior theatre with no TREMOR analog. The key architectural difference is dual-oracle (SWPC + DONKI) with different cadences, and multi-input theatres (T2: Geomagnetic Storm Gate accepts Kp, solar wind, CME, and GST evidence).

`compose_with: [tremor]` is declared one-way in cycle-001 (CORONA → TREMOR); reciprocity from TREMOR is a future-cycle activity per operator hard constraint J (TREMOR is read-only this cycle).

<!-- ground-truth-meta
generator: manual
generated_at: 2026-05-01T20:50:00Z
sprint: 7
cycle: cycle-001
calibration_status: attempted-no-refit
v3_schema_commit: b98e9ef
test_count: 160
manifest_entries: 30
runs_committed: [run-1, run-2, run-3-final]
runs_hash_invariant_corpus: b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1
runs_hash_invariant_script: 17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1
-->
