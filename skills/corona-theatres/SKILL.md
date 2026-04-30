---
name: corona-theatres
description: T1-T5 theatre constructors for space-weather prediction markets — programmatic API surface
user-invocable: false
allowed-tools: []
---

# CORONA Theatres (T1-T5)

CORONA's primary surface is the `CoronaConstruct` JS class in `src/index.js`, which exposes five theatre constructors for the Echelon prediction-market protocol. Each theatre watches a specific space-weather signal class, opens markets when conditions stir, updates positions as evidence streams in from NOAA/NASA feeds, and exports Brier-scored RLMF certificates on resolution. This skill documents the programmatic surface for v3 ecosystem discoverability — it is not a user-invokable slash command in cycle-001.

## Trigger

CORONA theatres are constructed programmatically via the `CoronaConstruct` class:

```javascript
import { CoronaConstruct } from '@echelon/corona';
const corona = new CoronaConstruct();
corona.openFlareClassGate({ threshold_class: 'M1.0', window_hours: 24, base_rate: 0.15 });
corona.openGeomagneticStormGate({ kp_threshold: 5, window_hours: 72, base_rate: 0.10 });
// T3, T4, T5 typically auto-spawn from feed events
corona.start();  // begin SWPC (1-min) + DONKI (5-min) polling
```

Future cycles may surface slash-command wrappers (e.g., `/flare-gate threshold:M1`); tracked in PRD §11 deferred decisions. Natural-language triggers are documented in `index.yaml`.

## Workflow

1. **Open** — Operator (or auto-spawn from a feed bundle) creates a theatre via the appropriate constructor (`openFlareClassGate`, `openGeomagneticStormGate`, `openCMEArrival`, `openProtonEventCascade`, `openSolarWindDivergence`). The theatre is added to `CoronaConstruct.theatres` with a generated id.
2. **Poll** — SWPC (1-min) and DONKI (5-min) timers fetch feeds and build evidence bundles via `src/processor/bundles.js`. Bundles are matched against active theatres via `theatre_refs`.
3. **Update** — Each matched theatre's `process<Theatre>(bundle)` function updates the position based on bundle quality (`src/processor/quality.js`), uncertainty pricing (`src/processor/uncertainty.js`), and settlement-class assessment (`src/processor/settlement.js`). Position history is appended.
4. **Resolve** — Theatre resolves when (a) settlement evidence arrives per the theatre-specific authority documented in `grimoires/loa/calibration/corona/theatre-authority.md`, or (b) the closing time passes. Outcome is recorded; T1/T2/T3/T5 are binary; T4 is multi-class (S-scale buckets).
5. **Export** — On resolution, `src/rlmf/certificates.js` exports a Brier-scored certificate with position history, calibration bucket, and temporal analysis. Certificate is appended to `CoronaConstruct.certificates`.
6. **Flush** — Operator calls `getCertificates()` to retrieve and `flushCertificates()` to clear.

## Boundaries

- Does NOT predict the Sun; consumes data the Sun produces and structures it into resolvable markets.
- Does NOT execute financial trades; CORONA produces certificates for the Echelon RLMF pipeline only.
- Does NOT use DONKI as a universal settlement oracle; per-theatre settlement authority is canonical at `grimoires/loa/calibration/corona/theatre-authority.md` (DONKI's role is discovery + label correlation + evidence enrichment).
- Does NOT introduce runtime dependencies; zero-deps posture per `package.json` (Node ≥20.0.0 only).
- Does NOT implement R-scale (radio blackout) theatres in cycle-001; T4 is S-scale (proton events) per NOAA Solar Radiation Storm Scale. R-scale theatre is deferred to a future construct pack per operator direction.
- T4 currently uses subsequent-flare proxy for S-scale proton events (Wheatland correlation); Sprint 2 binds direct proton-flux qualifying-event logic per PRD §11 + sprint-2 owner tasks.

## Output

Per-theatre output is an RLMF certificate conforming to `echelon-rlmf-v0.1.0`:

```json
{
  "certificate_id": "<construct>-<theatre>-<resolution-timestamp>",
  "construct_id": "CORONA",
  "theatre": "T<id>_<template>",
  "outcome": "<typed>",
  "performance": {
    "brier_score": "<0-1>",
    "calibration_bucket": "<range>",
    "directional_accuracy": "<label>"
  },
  "position_history": ["..."]
}
```

Schema-compatible with TREMOR's RLMF certificates — see `examples/tremor-rlmf-pipeline.md` for the cross-construct paper composition.
