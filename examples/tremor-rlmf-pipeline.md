# Reference Composition: CORONA + TREMOR via RLMF Pipeline

**Status**: documentation only — no runtime coupling.
**Purpose**: demonstrate that CORONA emits RLMF certificates schema-compatible with TREMOR's, satisfying the construct-creator structure-lens critique that v3 constructs declare real composition partners.
**Operator hard constraint**: CORONA does NOT import or shell out to TREMOR. This file is a **paper composition**.

---

## What this composition shows

Echelon's RLMF pipeline consumes Brier-scored certificates from any construct that produces them. TREMOR (seismic) and CORONA (space-weather) both emit certificates against the same shared schema (`echelon-rlmf-v0.1.0`, declared in CORONA's `spec/construct.json:91-95` and TREMOR's `spec/construct.json:rlmf` block). A downstream consumer (Echelon platform, future RLMF aggregator construct, etc.) can ingest both without per-construct adaptors.

The composition is along the **certificate schema axis** — not via runtime coupling, not via a shared event bus, not via shared state.

```
┌──────────┐                  ┌──────────┐
│  CORONA  │                  │  TREMOR  │
│ (T1..T5) │                  │ (M.G.,   │
│          │                  │  A.C., …)│
└─────┬────┘                  └─────┬────┘
      │                             │
      │    RLMF cert                │    RLMF cert
      │    schema:                  │    schema:
      │    echelon-rlmf-v0.1.0      │    echelon-rlmf-v0.1.0
      │                             │
      ▼                             ▼
   ┌────────────────────────────────────┐
   │   Echelon platform                 │
   │   (RLMF aggregator — future cycle) │
   └────────────────────────────────────┘
```

## Schema compatibility evidence

Both constructs declare the same RLMF cert schema in their manifest.

**TREMOR** (`/c/Users/0x007/tremor/spec/construct.json` — read-only inspection, NOT modified):

```json
"rlmf": {
  "certificate_schema": "echelon-rlmf-v0.1.0",
  "compatible_with": ["corona"]
}
```

(Note: TREMOR's `rlmf.compatible_with` already lists `corona` — a soft schema-level reciprocity even though TREMOR's pre-v3 `composes_with` triplet does not list CORONA. See `grimoires/loa/calibration/corona/sprint-0-notes.md` "Task 0.6 reciprocity inspection" for the full asymmetry analysis.)

**CORONA** (`spec/construct.json:91-95`):

```json
"rlmf": {
  "certificate_schema": "echelon-rlmf-v0.1.0",
  "compatible_with": ["tremor"],
  "exports": ["brier_score", "position_history", "calibration_bucket", "temporal_analysis"]
}
```

## Cert shape (illustrative)

A CORONA T1 (Flare Class Gate) certificate looks like:

```json
{
  "certificate_id": "corona-t1-2024-05-10T17:23:00Z",
  "construct_id": "CORONA",
  "theatre": "T1_flare_class_gate",
  "outcome": "M5.8_at_2024-05-10T17:48:00Z",
  "performance": {
    "brier_score": 0.18,
    "calibration_bucket": "0.10-0.20",
    "directional_accuracy": "above_threshold"
  },
  "position_history": [/* … */]
}
```

A TREMOR Magnitude Gate certificate is structurally identical:

```json
{
  "certificate_id": "tremor-mg-2024-05-10T17:23:00Z",
  "construct_id": "TREMOR",
  "theatre": "T1_magnitude_gate",
  "outcome": "M5.8_at_2024-05-10T17:48:00Z",
  "performance": {
    "brier_score": 0.21,
    "calibration_bucket": "0.20-0.30",
    "directional_accuracy": "above_threshold"
  },
  "position_history": [/* … */]
}
```

The downstream RLMF aggregator does not need to know which construct produced a given certificate — it can rank by Brier score, plot calibration buckets, and aggregate temporal analysis across constructs.

## What this composition is NOT

- **NOT runtime coupling**. CORONA does not `import` from TREMOR or shell out to TREMOR scripts. Both constructs run as independent processes.
- **NOT a real-time pipeline**. RLMF certs are produced at theatre resolution (event-driven) and consumed offline. There is no live event bus between CORONA and TREMOR in this composition.
- **NOT a shared state store**. Each construct manages its own theatre state, manifest, and corpus.
- **NOT v3 `compose_with` reciprocation**. TREMOR is pre-v3 (`composes_with` triplet, no `compose_with` array). CORONA's v3 manifest declares `compose_with: tremor` one-way. Reciprocation closes when TREMOR migrates to v3 — out of scope for cycle-001 per operator scope note.

## Future canonical composition

Echelon's `theatre-api` is the future canonical compose target (PRD §11). When the theatre-api interface lands, CORONA will declare:

```yaml
compose_with:
  - slug: echelon-platform
    relationship: "Emits RLMF certificates via echelon-rlmf-v0.1.0 schema; consumes theatre-api for theatre lifecycle hooks"
```

For cycle-001, the `tremor` reference suffices for construct-creator's structure-lens critique — it demonstrates that CORONA participates in a real, multi-construct ecosystem rather than living in isolation.

---

*Authored cycle-001 Sprint 0 (Beads `corona-1g6`) by `/implement` agent per operator direction. CORONA does NOT modify TREMOR at any point during this composition; TREMOR was inspected read-only at `C:\Users\0x007\tremor` for schema-shape verification.*
