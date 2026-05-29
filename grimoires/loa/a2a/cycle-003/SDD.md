# CORONA cycle-003 — Software Design Document

**Status**: cycle-003 SDD (architecture/design artifact only). NOT a charter, NOT a sprint plan, NOT an implementation report. Implementation is forbidden until a downstream **sprint plan** is ratified (a charter is optional, created only on explicit operator request). This SDD describes a *substrate* design; producing it grants **no** permission to edit `src/`, `scripts/`, `tests/`, or any frozen artifact.
**Authored**: 2026-05-28
**Cycle**: cycle-003 (cycle-002 closed at **Rung 2, T4 runtime-sensitive only**; published version **v0.2.0**; HEAD / `origin/main` = `2e5dc1dd0f4a700fca961d0d61ec8520e49e083f`).
**Binding input**: [PRD.md](PRD.md) (amended 2026-05-28). Where this SDD and the PRD disagree, the PRD governs. Where the PRD and any frozen cycle-001/cycle-002 source disagree, the frozen source is authoritative.
**Mission (one line, carried verbatim from PRD §3.1)**: *Build the historical-corpus expansion and held-out evaluation substrate that a future cycle would need — without refitting, without claiming improvement.*

> This SDD is grounded in a read-only pass over the live repo at HEAD `2e5dc1d` (branch `main`, clean tree). It answers the first architecture blocker (PRD OQ-2) from the on-disk code, then designs the cycle-003 substrate: corpus namespace, T1/T2/T4 corpus schemas, held-out methodology, data-source verification, leakage/claim-safety gates, hard stops, and sprint-plan implications. Every count/coverage figure remains `REQUIRES_LIVE_ARCHIVE_VERIFICATION` until sanity-sampled. Cycle-003 writes only inside `grimoires/loa/a2a/cycle-003/` (this document is the only file written by the SDD step) plus, *later and only when the sprint plan authorizes it*, a new cycle-003 / new-corpus namespace (never a frozen path).

---

## 0. Grounding pass (read-only, performed before drafting)

| Check | Result |
|---|---|
| Branch / tree / HEAD | `main`, clean working tree, HEAD = `2e5dc1dd0f4a700fca961d0d61ec8520e49e083f`. The only untracked path is `grimoires/loa/a2a/cycle-003/` (holding the PRD). |
| PRD present | ✓ [`grimoires/loa/a2a/cycle-003/PRD.md`](PRD.md) (amended 2026-05-28), read in full and treated as binding. |
| SDD pre-existence | ✓ **None at start.** No `grimoires/loa/a2a/cycle-003/SDD.md` existed prior to this write. (HS-C10-12 / PRD OQ checked: no pre-existing cycle-003 design artifact.) |
| Cycle-002 closeout chain | [CLOSEOUT.md](../cycle-002/sprint-06/CLOSEOUT.md) (Rung 2, T4 only), [engineer-feedback.md](../cycle-002/sprint-06/engineer-feedback.md) (APPROVED), [auditor-sprint-feedback.md](../cycle-002/sprint-06/auditor-sprint-feedback.md) (APPROVED), [COMPLETED](../cycle-002/sprint-06/COMPLETED) — all read. |
| Cycle-002 planning authorities | [PRD.md](../cycle-002/PRD.md), [SDD.md](../cycle-002/SDD.md), [CYCLE-002-SPRINT-PLAN.md](../cycle-002/CYCLE-002-SPRINT-PLAN.md) — read. |
| Replay / scoring / loader seams (read on disk) | `replay/{t1,t2,t4}-replay.js`, `replay/context.js`, `replay/canonical-json.js`, `replay/hashes.js`, `ingestors/corpus-loader.js`, `ingestors/config.js`, `scoring/{t1-binary-brier,t4-bucket-brier}.js` — read. Runtime evidence-update functions `processFlareClassGate` (`src/theatres/flare-gate.js:77`) and `processGeomagneticStormGate` (`src/theatres/geomag-gate.js:87`) confirmed to **exist and be exported**. |
| Current corpus shape (read on disk) | **T1** = terminal point-labels only (`flare_class_observed`, `flare_peak_time`, `flare_peak_xray_flux`, `flare_end_time`); no `xray_flux_observations[]`. **T2** = peak/window labels only (`kp_swpc_observed`, `kp_gfz_observed`, `kp_window_start`, `kp_window_end`); no `kp_observations[]`. **T4** = real timestamped `proton_flux_observations[]`. 5 events/theatre; all GOES-R-era (2017+). |
| Frozen invariants (verified at closeout, carried forward) | `scripts/corona-backtest.js` sha256 `17f6380b…1730f1`; cycle-001 `calibration-manifest.json` sha256 `e53a40d1…5db34a`; `corpus_hash b1caef3f…11bb1`; `package.json` `0.2.0`; RLMF cert `version: '0.1.0'`. |

---

## 1. Architecture objective

Design the cycle-003 *substrate* (not its use) for:

1. an **expanded historical corpus** (well beyond 5 events/theatre, with honest per-theatre supply ceilings);
2. **T1/T2 pre-cutoff time-series support** (give T1/T2 events the series shape T4 already has);
3. **T4 supply / bucket-diversity expansion** (supply-bounded, never padded to 30);
4. a **leakage-free held-out split methodology**, predeclared and frozen before any future fit;
5. **leakage prevention** as a structural property of the corpus + loader, not an author convention;
6. a **new corpus hash / manifest** in a new namespace;
7. **preservation of all cycle-001 and cycle-002 frozen artifacts** byte-for-byte.

Cycle-003 earns **no new rung** in the cycle-002 ladder and advances **no theatre's rung** (PRD §9, OQ-8). It makes a future advance *possible*; it does not attempt it. The cycle-002 claim ceiling — **"CORONA demonstrated T4 runtime sensitivity only"** — is preserved unweakened (PRD §8, HAZ-1/HAZ-7).

### 1.1 What cycle-003 is NOT (binding, from PRD §3.2 + task constraints)

Not a parameter-refit cycle · not a calibration-improvement cycle · not an L2 publish-readiness cycle · not a release cycle · not a `v0.3.0` cycle · not a README/BUTTERFREEZONE update cycle · not a cycle-002 "Sprint 07". No forecasting-accuracy / verifiable-track-record / broad-predictive-uplift framing may appear.

---

## 2. First architecture blocker — OQ-2 answer (resolve before all other design)

> **PRD OQ-2 (verbatim framing)**: "Does corpus-shape alone unlock T1/T2 runtime evidence updates, or do `t1-replay.js` / `t2-replay.js` require additive replay-module code to iterate `evidence.pre_cutoff` and call `processX`?"

### 2.1 Answer (grounded in on-disk code): **Corpus shape alone does NOT unlock T1/T2 evidence updates. Additive code is required — at TWO layers.**

The cycle-002 closeout already stated the conclusion ([CLOSEOUT.md §2](../cycle-002/sprint-06/CLOSEOUT.md): "`replay_T{1,2}_event` invoke `createX` once and never call `processX`"). This SDD independently re-verified it from the source and found the requirement is **two-layered**, not one. Both layers are additive `src/`-tree-adjacent / `scripts/`-tree code and are therefore **HS-C10-2 territory**.

**Layer A — the replay modules (`scripts/corona-backtest/replay/t1-replay.js`, `t2-replay.js`).** These are the *actual* producers of `current_position_at_cutoff`. Reading them:

- `t1-replay.js` imports only `createFlareClassGate` (L25). It opens the theatre once (L78-84), sets a single frame-time clock, and **never imports or calls `processFlareClassGate`**. `evidence_bundles_consumed: []` is hardcoded (L125). `current_position_at_cutoff = theatre.current_position` (L124) is therefore the runtime's `base_rate` prior, by construction.
- `t2-replay.js` is identical in shape: imports only `createGeomagneticStormGate` (L25), opens once (L80-86), **never imports or calls `processGeomagneticStormGate`**, `evidence_bundles_consumed: []` (L125).
- `t4-replay.js` is the contrast that proves the mechanism: it imports `processProtonEventCascade` (L29-33), builds `protonBundles` from `corpus_event.proton_flux_observations` (L112-131), and **loops** `theatre = processProtonEventCascade(theatre, bundle, { now })` (L154-158). This loop is precisely why T4 exercises the evidence-update path and earned Rung 2, and why T1/T2 did not.
- Confirmed by grep: there is **no** `processFlareClassGate` / `processGeomagneticStormGate` reference anywhere in `t1-replay.js` or `t2-replay.js`.

A correctly-shaped corpus carrying a pre-cutoff series would be **silently ignored** by these modules — there is no code path that reads such a field. To make T1/T2 evidence-update runnable, the replay modules would need (per theatre): import `processX`; build an ordered evidence-bundle array from the new series; advance the frame-time clock per bundle; loop the `processX` call; and populate `evidence_bundles_consumed`. This mirrors `t4-replay.js` L110-158.

**Layer B — the loader's evidence split (`scripts/corona-backtest/ingestors/corpus-loader.js`).** The PRD names `loadCorpusWithCutoff`'s `evidence.pre_cutoff` as the intended series consumer (FR-C6-3). But the T1/T2 evidence derivers **hardcode an empty series**:

- `deriveEvidenceT1` returns `pre_cutoff: []` unconditionally (L500-508); it reads no series field.
- `deriveEvidenceT2` returns `pre_cutoff: []` unconditionally (L509-517).
- Only `deriveEvidenceT4` (L527-551) actually reads a series (`proton_flux_observations`) and emits a populated, strictly-pre-cutoff `pre_cutoff` array.

So even at the loader layer, T1/T2 `evidence.pre_cutoff` is structurally empty regardless of corpus content. To surface a T1/T2 series, `deriveEvidenceT1` / `deriveEvidenceT2` would need to read the new field, filter strictly to `event_time_ms < cutoff.time_ms`, and emit ordered bundles — mirroring `deriveEvidenceT4`.

### 2.2 Consequence for cycle-003 scope (binding)

| Implication | Disposition |
|---|---|
| Corpus shape alone is **insufficient** for T1/T2 evidence updates. | The corpus schema (§3, §4) is **necessary but not sufficient**. It is the substrate; it is not the wiring. |
| Two additive code changes (Layer A replay + Layer B loader) are **required** to ever run a T1/T2 evidence-update / sensitivity test. | **OUT OF SCOPE for cycle-003.** This SDD *describes* the required future change so the schema can be designed against a real consumer, but designing it is not authorizing it. Any `src/`-adjacent / `scripts/` edit stays **HS-C10-2** until a future, separately-gated cycle (NOT cycle-003) ratifies it via its own SDD + sprint plan. |
| The cycle-003 corpus schema must be designed to be **forward-compatible** with that future Layer A/B change without itself implying the change happened. | §3/§4 define the series field shape and the strict-pre-cutoff invariant so a future loader/replay change is a pure additive read, with the corpus already conformant. The schema is "wired-*capable*" (PRD OBJ-T1-3/OBJ-T2-3, HAZ-1), not "wired". |
| Therefore cycle-003's T1/T2 acceptance is **substrate-shape acceptance only**. | "The expanded T1/T2 corpus carries a leakage-free, strictly-pre-cutoff series in the documented shape, and a future loader/replay change reading that field would feed `processX`." This is a Rung-1/2 *prerequisite*, **not** a sensitivity or calibration claim. Cycle-003 may NOT state or imply T1/T2 sensitivity or calibration improvement (HAZ-1, HS-C10-8). |

### 2.3 Verification artifact for the OQ-2 claim (substrate-only, no code edit)

To prove "wired-capable" honestly *without* implementing Layer A/B, a sprint MAY (when authorized) ship a **read-only schema-conformance probe** that:

- loads expanded T1/T2 events via the existing `loadCorpus`, and
- asserts the new series field exists, is strictly time-ordered, and every entry satisfies `event_time_ms < cutoff.time_ms` (cutoff derived by the existing `deriveCutoffT1` / `deriveCutoffT2` rules),

and records the result as a **substrate-shape conformance report**. This probe reads the corpus; it does **not** call `processX`, does **not** produce a trajectory, and does **not** score. It cannot and must not be characterized as a sensitivity test. (If even this probe needs a new file under `scripts/`, that file is sprint-gated and lives outside any frozen path; it never edits `t1-replay.js`/`t2-replay.js`/`corpus-loader.js`.)

---

## 3. Corpus namespace design

### 3.1 Requirement recap (PRD FR-C6-1, NG-5, HS-C10-3, OQ-5)

The expanded corpus MUST: (a) not mutate the frozen cycle-001 corpus at `grimoires/loa/calibration/corona/corpus/primary|secondary/` or its `corpus_hash b1caef3f…11bb1`; (b) not mutate any cycle-002 output/manifest; (c) carry its **own** `corpus_hash`; (d) keep its manifest / additive metadata in the new cycle-003 / new-corpus namespace; (e) preserve replayability and auditability.

### 3.2 Design decision — a sibling corpus tree selected by the existing `CORONA_CORPUS_DIR` seam

The harness already supports a fully relocatable corpus root: `config.js` `resolveCorpusDir(envValue)` honors `CORONA_CORPUS_DIR` (L126-129), and `CORPUS_SUBDIRS` (L55-61) defines the per-theatre layout relative to that root. This is the clean, **zero-frozen-file-touch** seam.

**Proposed location (SDD recommendation; sprint plan finalizes the exact leaf name):**

```
grimoires/loa/calibration/corona/corpus-cycle-003/        # NEW root, sibling to frozen corpus/
├── README.md                                             # provenance + REQUIRES_LIVE_ARCHIVE_VERIFICATION ledger
├── primary/
│   ├── T1-flare-class/        <YYYY-MM-DD>-<class>.json    # + xray_flux_observations[] (see §4)
│   ├── T2-geomag-storm/       <YYYY-MM-DD>-Kp<N>.json       # + kp_observations[]      (see §5)
│   ├── T4-proton-cascade/     <YYYY-MM-DD>-S<level>.json    # proton_flux_observations[] (existing shape, more events)
│   ├── T3-cme-arrival/        (only if OQ-6 opts in; diagnostic-only; default ABSENT)
│   └── T5-solar-wind-divergence/ (only if OQ-6 opts in; diagnostic-only; default ABSENT)
├── secondary/                                              # operator-gated pre-2017 events ONLY (default EMPTY)
├── corpus-cycle-003-manifest.json                          # NEW corpus_hash + per-file SHA256 + held-out seal pointer
└── heldout-split.json                                      # frozen split assignment (see §6)
```

Rationale for a **sibling tree** over a new `tier` inside the frozen tree:

| Option | Verdict | Why |
|---|---|---|
| **(chosen) Sibling root `corpus-cycle-003/`, selected by `CORONA_CORPUS_DIR`** | **Selected** | Zero edits to the frozen `corpus/` tree or `corpus-manifest.json`. The existing loader runs against it unchanged via env var. New `corpus_hash` is computed over the new tree only. Fully isolated, fully auditable. |
| New subtree under frozen `corpus/` (e.g. `corpus/cycle-003/`) | Rejected | Re-hashing the frozen `corpus/` tree as a whole would change `corpus_hash b1caef3f…` (HS-C10-3). Even if scoped, it invites accidental inclusion of the new tree in the frozen manifest's coverage. |
| Reuse `corpus/secondary/` for the expansion | Rejected | `secondary/` is a frozen-tree subdir reserved for operator-gated exceptional/historical events; commingling the cycle-003 primary expansion there muddies provenance and risks touching the frozen manifest's surface. |

**Namespace invariants (binding):**

- **CN-1**: The frozen `corpus/` tree, `corpus-manifest.json`, and `corpus_hash b1caef3f…11bb1` are **byte-immutable**. Cycle-003 never opens them for write. (NG-5, HS-C10-3.)
- **CN-2**: The new corpus gets a **fresh `corpus_hash`** computed by the same canonicalization the cycle-001 manifest used (sorted-key canonical JSON → SHA-256; see `replay/canonical-json.js` + `replay/hashes.js` for the byte-deterministic convention). The two hashes are **distinct values over distinct file sets**; the new hash is never substituted for or compared against `b1caef3f…` as if they measured the same corpus.
- **CN-3**: The cycle-003 manifest is **additive and self-contained** — it lives only in `corpus-cycle-003/` and references only cycle-003 files. It is **not** a replacement for, edit to, or superset wrapper around the frozen cycle-001/cycle-002 manifests (mirrors the cycle-002 additive-manifest precedent, [cycle-002 SDD §5](../cycle-002/SDD.md)).
- **CN-4**: Events MUST validate against the **frozen** common-envelope + per-theatre schema enforced by `corpus-loader.js` (`event_id`, `theatre`, `tier`, `event_time`, `donki_record_ref`, `goes_satellite`, plus the per-theatre required fields in `validateT1`/`validateT2`/`validateT4`). The cycle-003 series fields are **additive** annotations the existing loader tolerates (it composes `{...body, _derived, _file}` and does not reject unknown top-level keys), so existing validation passes without any loader edit for the *loading* path. (Surfacing the series into `evidence.pre_cutoff` is the separate Layer-B change of §2 — out of scope.)
- **CN-5**: The new manifest records, per event, its source archive + retrieval basis + DONKI cross-reference (PRD FR-C6-7) and the `REQUIRES_LIVE_ARCHIVE_VERIFICATION` → verified transition (§7).

---

## 4. T1 corpus schema (additive pre-cutoff GOES X-ray series)

### 4.1 Objective

Give each expanded T1 event a **pre-cutoff GOES X-ray flux time-series** so that a *future* Layer-A/B change (§2) could feed `processFlareClassGate` and let `current_position_at_cutoff` move off `base_rate`. Cycle-003 ships the data shape; it does not ship the wiring. (PRD OBJ-T1-2, FR-C6-3.)

### 4.2 Additive field shape (SDD proposal; exact field name finalized in sprint plan per OQ-1)

A new top-level array `xray_flux_observations[]` mirroring T4's `proton_flux_observations[]` ergonomics:

```jsonc
{
  // ---- existing frozen T1 envelope + labels (unchanged shape) ----
  "event_id": "T1-2024-05-14-X8p7",
  "theatre": "T1", "tier": "primary",
  "event_time": "2024-05-14T16:51:00Z",
  "donki_record_ref": "2024-05-14T16:51:00-FLR-001",
  "goes_satellite": "GOES-16", "goes_secondary_satellite": "GOES-18",
  "flare_class_observed": "X8.7",        // SETTLEMENT — stays settlement-only
  "flare_peak_time": "2024-05-14T17:08:00Z",
  "flare_peak_xray_flux": 8.7e-4,        // SETTLEMENT — peak value, post-cutoff
  "flare_end_time": "2024-05-14T17:18:00Z",
  "donki_flr_class_type": "X8.7",
  "prediction_window_hours": 24,

  // ---- NEW additive pre-cutoff series (the cycle-003 deliverable) ----
  "xray_flux_observations": [
    // 1-minute GOES 1–8Å long-channel flux, from gate_open toward cutoff.
    // Cutoff (existing rule deriveCutoffT1) = flare_peak_time - 1 ms.
    // EVERY entry MUST satisfy time < cutoff (strictly pre-peak).
    { "time": "2024-05-13T17:08:00Z", "long_channel_wm2": 2.1e-7, "energy_channel": "0.1-0.8 nm", "satellite": "GOES-16" },
    { "time": "2024-05-14T15:00:00Z", "long_channel_wm2": 4.8e-6, "energy_channel": "0.1-0.8 nm", "satellite": "GOES-16" }
    // ... rising-limb samples up to but strictly before flare_peak_time
  ],

  "notes": "… Source: NOAA NCEI GOES-16 XRS 1-min 1–8Å archive + DONKI FLR. REQUIRES_LIVE_ARCHIVE_VERIFICATION until sanity-sampled."
}
```

### 4.3 Schema invariants (binding)

| ID | Invariant | Enforcement |
|---|---|---|
| T1S-1 | **Strictly pre-cutoff.** Every `xray_flux_observations[].time` < `cutoff.time_ms` where cutoff = `flare_peak_time − 1 ms` (the existing `deriveCutoffT1` rule, `corpus-loader.js:460-464`). No sample at or after the flare peak. | Substrate-conformance probe (§2.3). A single at/after-cutoff sample is a leak (HS-C10-7). |
| T1S-2 | **Settlement labels stay settlement.** `flare_class_observed`, `flare_peak_time`, `flare_peak_xray_flux`, `flare_end_time` remain in the event body and (in any future Layer-B change) map to `evidence.settlement` — never into `xray_flux_observations[]`. | FR-C6-4; matches `deriveEvidenceT1`'s settlement set. |
| T1S-3 | **Replay-ingestible shape.** Array of time-keyed objects sortable by `time`, each carrying the flux value + channel, structurally analogous to `proton_flux_observations[]` so a future Layer-A replay loop is a near-mechanical mirror of `t4-replay.js`. | Design-time; no code now. |
| T1S-4 | **Capability, not calibration.** The series enables `current_position_at_cutoff ≠ base_rate` *only after* the §2 Layer-A/B change lands in a future cycle. Cycle-003 asserts only that the shape exists and is leakage-free. | HAZ-1; §2.2. |
| T1S-5 | **Provenance + verification.** Each event names the source archive (NCEI XRS) and carries `REQUIRES_LIVE_ARCHIVE_VERIFICATION` until §7 sanity-sampling confirms the 1-min flux is retrievable for that window and joins to the label. | FR-C6-7, HAZ-6, HS-C10-9. |

**Settlement authority unchanged**: GOES/SWPC X-ray flux; pinned gate `{threshold_class:"M1.0", window_hours:24}` carried forward (no change unless a future charter revisits it).

---

## 5. T2 corpus schema (additive pre-cutoff Kp/Hp series)

### 5.1 Objective

Give each expanded T2 event a **pre-cutoff per-3hr Kp/Hp time-series** leading into storm onset, so a future Layer-A/B change could feed `processGeomagneticStormGate`. Data shape only; no wiring. (PRD OBJ-T2-2, FR-C6-3.)

### 5.2 Additive field shape (SDD proposal; finalized per OQ-1)

A new top-level array `kp_observations[]`:

```jsonc
{
  // ---- existing frozen T2 envelope + labels (unchanged shape) ----
  "event_id": "T2-2024-05-11-Kp9",
  "theatre": "T2", "tier": "primary",
  "event_time": "2024-05-11T00:00:00Z",
  "donki_record_ref": "2024-05-10T17:23:00-GST-001",
  "goes_satellite": "GOES-16", "goes_secondary_satellite": "GOES-18",
  "kp_swpc_observed": 9.0,                 // SETTLEMENT — peak, stays settlement-only
  "kp_gfz_observed": 9.0,                  // SETTLEMENT — definitive peak (or null if GFZ-lag-excluded)
  "kp_window_start": "2024-05-11T00:00:00Z",
  "kp_window_end": "2024-05-11T06:00:00Z",
  "donki_gst_id": "2024-05-10T17:23:00-GST-001",

  // ---- NEW additive pre-cutoff series (the cycle-003 deliverable) ----
  "kp_observations": [
    // Per-3hr Kp (and/or 1-hr Hp) readings BEFORE cutoff.
    // Cutoff (existing rule deriveCutoffT2) = kp_window_end.
    // EVERY entry MUST satisfy time < cutoff (lead-in only, not the peak interval at/after window_end).
    { "time": "2024-05-10T15:00:00Z", "kp": 4.0, "index": "Kp", "provenance": "gfz_definitive", "satellite": null },
    { "time": "2024-05-10T21:00:00Z", "kp": 6.0, "index": "Kp", "provenance": "gfz_definitive", "satellite": null }
    // ... per-3hr lead-in up to but strictly before kp_window_end
  ],

  "notes": "… Source: GFZ Potsdam definitive Kp (Matzka et al. 2021) + SWPC provisional Kp. GFZ ~30-day lag honored. REQUIRES_LIVE_ARCHIVE_VERIFICATION until sanity-sampled."
}
```

### 5.3 Schema invariants (binding)

| ID | Invariant | Enforcement |
|---|---|---|
| T2S-1 | **Strictly pre-cutoff.** Every `kp_observations[].time` < `cutoff.time_ms` where cutoff = `kp_window_end` (the existing `deriveCutoffT2` rule, `corpus-loader.js:465-469`). | Conformance probe (§2.3). At/after-cutoff sample = leak (HS-C10-7). |
| T2S-2 | **GFZ lag / definitive-vs-provisional posture preserved.** Each `kp_observations[]` entry tags `provenance` (`gfz_definitive` \| `swpc_provisional`). Events whose definitive Kp is still inside the ~30-day GFZ publication lag are **regression-tier-ineligible** — matching the existing loader semantics (`validateT2` sets `regression_tier_eligible` only when `kp_gfz_observed != null`, L159) and the protocol's §3.6 exclusion. Pre-cutoff provisional series is allowed for *shape*; settlement must use the appropriate authority per protocol. | calibration-protocol §3.6; mirrors `validateT2`. |
| T2S-3 | **Settlement labels stay settlement.** `kp_swpc_observed`, `kp_gfz_observed` remain settlement (matching `deriveEvidenceT2`'s settlement set); never copied into `kp_observations[]` as if a pre-cutoff reading equalled the peak label. | FR-C6-4. |
| T2S-4 | **Replay-ingestible shape.** Time-keyed, sortable, structurally analogous to `proton_flux_observations[]`. | Design-time. |
| T2S-5 | **Capability, not calibration.** As T1S-4; enables movement off `base_rate` only post §2 Layer-A/B. | HAZ-1. |
| T2S-6 | **Provenance + verification.** Source archive named (GFZ + SWPC); `REQUIRES_LIVE_ARCHIVE_VERIFICATION` until §7. | FR-C6-7, HS-C10-9. |

**Settlement authority unchanged**: SWPC provisional Kp (live) + GFZ definitive Kp (regression). GFZ-lag exclusion honored in corpus eligibility.

---

## 6. T4 corpus expansion design (supply- and bucket-honest)

### 6.1 Objective

Expand T4 as far as the GOES-R-era S-scale supply *honestly allows*. T4's shape (`proton_flux_observations[]`) is already correct and already exercised by `t4-replay.js`; the constraint is **event rarity + bucket diversity**, not shape or wiring. (PRD OBJ-T4-1..3, FR-C6-5.)

### 6.2 Design

| ID | Rule | Basis |
|---|---|---|
| T4X-1 | **No fixed count; supply-bounded.** The target is *the achievable GOES-R-era S1+ event count*, not 30. Do not pad to a number. | OBJ-T4-2, HAZ-2. |
| T4X-2 | **Report achievable S1+ count honestly.** Cycle-003 produces an explicit count + the per-bucket distribution against the frozen runtime buckets `[0-1, 2-3, 4-6, 7-10, 11+]` (the `T4_BUCKETS_RUNTIME` labels in `corpus-loader.js:240-246`, identical to the runtime `BUCKETS` export consumed by `t4-bucket-brier.js`). | OBJ-T4-2; FR-C6-5. |
| T4X-3 | **Bucket distribution recorded, not engineered.** The per-bucket histogram is a *report artifact* in the cycle-003 manifest/README; it is never optimized toward balance by event selection. A skewed distribution is the honest finding, not a defect to fix. | HAZ-2. |
| T4X-4 | **No silent pre-2017 admission.** Primary-tier events satisfy `event_time ≥ 2017-01-01T00:00:00Z` (calibration-protocol §3.2 era rule; existing primary corpus is all 2017+). Pre-GOES-R events are NOT admitted to primary to hit a count. | FR-C6-6, HS-C10-1-adjacent. |
| T4X-5 | **Any pre-GOES-R secondary-tier idea is operator-gated + out of default scope.** If high-S coverage is wanted from pre-2017 events (e.g., 2003 Halloween), that is a `secondary/`-tier, operator-decision path (OQ-3) — default OFF. Secondary events do not enter regression scoring by default (protocol §3.3). | OQ-3, FR-C6-6. |
| T4X-6 | **Preserve T4 Rung-2 status without refit.** Cycle-003 does NOT touch `PRODUCTIVITY_PARAMS` / Wheatland λ / any runtime parameter. It only enlarges the corpus a *future* refit study could draw on. The existing `t4-replay.js` and `t4-bucket-brier.js` are read-only references, not edit targets. | OBJ-T4-3, NG-1, HS-C10-1. |
| T4X-7 | **Underpowered is a valid honest outcome.** If S1+ supply is thin (the planning assumption is that it is *constrained and bucket-skewed*, PRD §5), cycle-003 records that limit rather than padding. The held-out split (§7) inherits this honesty. | HAZ-2, FR-C7-3/5. |

T4 series shape is unchanged from the frozen schema (`trigger_flare_class`, `trigger_flare_peak_time`, `prediction_window_hours`, `proton_flux_observations[]`). New T4 events are simply *more* events in the existing shape, in the new namespace (§3).

---

## 7. Held-out split methodology (leakage-free, predeclared, frozen)

> A held-out methodology is a **new** capability — the frozen protocol scores the whole corpus as one set ([calibration-protocol §7]). Cycle-003 *defines and freezes* it; it does **not** *use* it to fit anything. (PRD §7, NG-1/NG-2, FR-C7-1..6.)

### 7.1 Design

| ID | Rule | Basis |
|---|---|---|
| HO-1 | **Predeclared + frozen before any fit.** The split protocol (assignment rule, ratio, stratification, seed, seal) is declared in a `heldout-split.json` and **hashed into the cycle-003 manifest** before any future cycle could fit against it. Cycle-003 produces the methodology + the assignment; it performs no fit. | FR-C7-1. |
| HO-2 | **No future fitting against held-out.** The methodology pre-records, as forbidden, any future cycle touching the held-out set for *fitting* (vs evaluation). A future fit-against-held-out is a methodology violation by definition. | FR-C7-4/6. |
| HO-3 | **Settlement never leaks pre-cutoff.** The split operates on whole events; an event's settlement labels and its pre-cutoff series travel together and stay on the same side. No single event's pre-cutoff series spans both sides; settlement is never exposed on the pre-cutoff/feature side. | FR-C7-2, FR-C6-4. |
| HO-4 | **Temporal-leakage discipline.** Where applicable, respect temporal ordering so a held-out event is not "predictable" from a near-duplicate train event in the same solar-rotation/storm sequence (the existing corpus already clusters within event sequences, e.g. the May-2024 Gannon sequence appears across theatres). The exact split mechanism (temporal cut vs stratified-random-with-sequence-grouping vs by-solar-rotation) is OQ-4, finalized in the sprint plan; the *invariant* is no sequence straddles the split. | FR-C7-2, OQ-4. |
| HO-5 | **T1/T2 stratified if possible.** Stratify the T1/T2 split so both sides carry comparable outcome-class coverage (the loader already derives outcome buckets: `T1_BUCKETS` 6-class, `T2_BUCKETS` G-scale). With the ~30-event planning target (PRD §5 believes T1/T2 headroom is large), stratification is expected to be feasible. | FR-C7-3. |
| HO-6 | **T4 may be underpowered — mark it, don't pad.** If T4 supply (§6) can't support full 5-bucket coverage on both sides, the methodology specifies a coarser granularity (e.g., S1 vs S2+) OR explicitly marks the T4 held-out set **underpowered**. It does **not** force balance by padding or by admitting pre-2017 events. | FR-C7-3, HAZ-2, OQ-3. |
| HO-7 | **Per-theatre minimums stated.** The methodology states a minimum events-per-side for the split to be meaningful; a theatre that can't meet its minimum (likely T4) is documented as a *limit*, not padded around. | FR-C7-5. |
| HO-8 | **Sealed assignment.** The held-out assignment is committed + hashed (HO-1). The seal pointer lives in the cycle-003 manifest. | FR-C7-4. |
| HO-9 | **New regime — never an uplift comparison.** Any future expanded-corpus baseline computed on this split is a **new scoring regime**. It MUST NOT be deltaed against Baseline A (cycle-001 uniform-prior, 6-bucket) or Baseline B (cycle-002 runtime-replay) as "uplift" — those are different regimes and the comparison is meaningless (CLOSEOUT §3, [cycle-002 CHARTER §8.2]). Cycle-003 pre-records this prohibition. | HAZ-3, HS-C10-7-adjacent. |

`heldout-split.json` (illustrative shape; sprint-finalized):

```jsonc
{
  "split_version": "cycle-003-heldout-v1",
  "declared_at": "<frozen-before-any-fit>",
  "method": "<OQ-4 decision: temporal_cut | stratified_random_seqgrouped | by_solar_rotation>",
  "ratio": { "train": 0.7, "heldout": 0.3 },     // sprint-finalized
  "seed": "<deterministic seed if randomized>",
  "stratification": { "T1": "outcome_bucket_6class", "T2": "g_scale", "T4": "coarse_S1_vs_S2plus_OR_underpowered" },
  "per_theatre_minimums": { "T1": "<N>", "T2": "<N>", "T4": "<N or 'underpowered'>" },
  "assignment": { "T1": { "train": ["…event_ids…"], "heldout": ["…"] }, "T2": { "…": "…" }, "T4": { "…": "…" } },
  "no_fit_against_heldout": true,
  "regime_note": "Any baseline on this split is a NEW regime; never compared to Baseline A or B as uplift."
}
```

---

## 8. Data-source verification design (sanity-sample, not mirroring)

### 8.1 Requirement recap (PRD §5, NG-7, HS-C10-10, HAZ-6, OQ-7)

No uncontrolled archive mirroring; no wholesale bulk download during architecture. Coverage/count/source assumptions remain `REQUIRES_LIVE_ARCHIVE_VERIFICATION` until sanity-sampled. Later **bounded, reviewable, event-window** historical fetches MAY be allowed only if the sprint plan explicitly authorizes them.

### 8.2 Design

| ID | Rule | Basis |
|---|---|---|
| DV-1 | **Sanity-sample pattern reuse.** Verification reuses the existing `ingestors/donki-sanity.js` `--online` pattern + the per-source fetchers (`swpc-fetch.js`, `gfz-fetch.js`, `donki-fetch.js`). The harness is offline-capable; the auth/throttle posture in `config.js` (DONKI authenticated ≤900/hr, demo ≤35/hr; documented SWPC/GFZ endpoints only, no scraping) is the rate ceiling. | PRD §5 table; config.js L89-117. |
| DV-2 | **Bounded N per theatre, not bulk.** A sprint-fixed small N (OQ-7) of events spanning 2017→2026 per theatre, fetched per event window — never an archive crawl. The exact N is a sprint decision; the *bound* is the architecture rule. | NG-7, OQ-7, HS-C10-10. |
| DV-3 | **Verify the three load-bearing questions.** (a) **T1**: NCEI GOES-R XRS 1-min 1–8Å flux retrievable for sampled windows + joins to the label (the live `services.swpc.noaa.gov/.../xrays-*-day.json` endpoints are *tail-only*; the historical series lives in the NCEI archive). (b) **T2**: per-3hr Kp series retrievable + GFZ-lag handling correct. (c) **T4**: the **GOES-R-era S1+ event count** — the binding supply question gating §6/§7. | PRD §5 table + "decision-unblocking answer". |
| DV-4 | **Assumptions vs verified facts kept distinct.** Every §4/§5/§6/§7 count/coverage figure is tagged `REQUIRES_LIVE_ARCHIVE_VERIFICATION` in the manifest/README until DV-3 confirms it; on confirmation, the tag flips to a cited `verified` record (source + retrieval date + sample). No figure becomes load-bearing while still tagged. | HAZ-6, HS-C10-9. |
| DV-5 | **Bulk fetch is a hard stop during architecture; bounded fetch is sprint-gated.** This SDD authorizes **no** fetch. A later corpus-build sprint MAY perform bounded event-window fetches *only* under explicit sprint-plan authorization, scoped per window, kept reviewable (no mirroring/wholesale download). | NG-7, HS-C10-10. |

---

## 9. Leakage and claim-safety gates (hard, binding on every cycle-003 artifact)

These are the cycle-003 perimeter. Any one tripping is a HALT-and-surface (cross-ref §10).

| ID | Hard gate | Mechanism |
|---|---|---|
| CSG-1 | **No settlement in the pre-cutoff series.** No `xray_flux_observations[]`/`kp_observations[]` entry at or after its event's cutoff; no settlement label copied into a series. | §2.3 conformance probe + T1S-1/T2S-1; HS-C10-7. |
| CSG-2 | **No Baseline A vs Baseline B vs new-corpus uplift comparison.** No cross-regime delta is computed or implied; the new corpus is a new regime. | HO-9, HAZ-3; CLOSEOUT §3. |
| CSG-3 | **No T1/T2 runtime-sensitive claim.** Cycle-003 ships substrate shape only; T1/T2 sensitivity is unproven and requires the §2 Layer-A/B change in a future cycle. | §2.2, HAZ-1; CLOSEOUT §8 ("no T1/T2 runtime-sensitivity claim"). |
| CSG-4 | **No calibration-improved claim** (any theatre). Building a held-out set ≠ beating a baseline on it. | NG-2, HAZ-1. |
| CSG-5 | **No forecasting-accuracy claim.** T1/T2 are short-horizon nowcasts; not "forecasting". | HAZ-5. |
| CSG-6 | **No L2 publish-ready claim.** Gated on a Rung-3 that does not exist. | NG-3. |
| CSG-7 | **No T3/T5 predictive-uplift claim.** T3 `[external-model]` / T5 `[quality-of-behavior]` stay diagnostic-only; corpus growth for them (if OQ-6 opts in) sharpens a diagnostic only and is excluded from any uplift-bearing target. | §4.4 PRD, HAZ-4, OBJ-T3-1/T5-1. |
| CSG-8 | **No release / tag / version bump.** Published version stays `v0.2.0`. | NG-4, HS-C10-5. |
| CSG-9 | **Honest-framing grep gate clean.** `grep -niE "calibration improved\|empirical performance improvement\|forecasting accuracy\|verifiable track record"` over every cycle-003 closeout-relevant artifact MUST return only negations or zero matches. The four verbatim T3/T5 + "calibration-attempted, not improved" posture sentences (CLOSEOUT §6) carry forward unweakened. | PRD §8, HAZ-7, HS-C10-8. |

---

## 10. Hard stops (HALT and surface to operator)

Carried forward and refined from PRD §10. Any of these → stop immediately and report; do not proceed.

| ID | Hard stop |
|---|---|
| HS-1 | Any runtime parameter / threshold / `base_rate` / `PRODUCTIVITY_PARAMS` / σ / formula change appears necessary (no-refit covenant; NG-1). |
| HS-2 | Any edit to `src/`, `tests/`, `scripts/` (including `t1-replay.js`/`t2-replay.js`/`corpus-loader.js`), the RLMF cert, a **frozen** manifest, a frozen script, or a frozen run output appears necessary. **Carve-out (not a hard stop):** a NEW cycle-003 corpus manifest / additive corpus metadata / validation artifact (FR-C6-1, SC-1) is permitted *only when the sprint plan authorizes it* and *only* in the cycle-003 / new-corpus namespace — never by mutating a frozen file. The §2 Layer-A/B replay+loader change is explicitly **HS-2**, deferred to a future separately-gated cycle. |
| HS-3 | Mutation of any **frozen** artifact appears necessary: cycle-001 corpus / `corpus_hash b1caef3f…`, cycle-001 manifest (`e53a40d1…`), `scripts/corona-backtest.js` (`17f6380b…`), cycle-002 `runtime-replay-manifest.json`, any frozen run output, RLMF cert `0.1.0`, calibration-protocol / theatre-authority / empirical-evidence. |
| HS-4 | Editing the root `grimoires/loa/{prd,sdd,sprint}.md` or any cycle-001/cycle-002 artifact. |
| HS-5 | Any README / BUTTERFREEZONE / `package.json` version / tag / release / CHANGELOG action. |
| HS-6 | Any move of T3 into a runtime-uplift set, T3 CORONA-prediction emission, or T5 probabilistic-Brier conversion (Q2/Q3 freezes). |
| HS-7 | A corpus event leaks settlement into the pre-cutoff series, or a held-out leakage path is detected (CSG-1, HO-3). |
| HS-8 | A cycle-003 artifact weakens the v0.2.0 / cycle-002 honest-framing posture, or the grep gate flags a positive match in non-claim prose (CSG-9). |
| HS-9 | A count/coverage figure is about to become load-bearing without sanity-sample verification (DV-4). |
| HS-10 | Uncontrolled archive mirroring / wholesale download attempted, or any bulk ingestion during architecture (NG-7). Bounded, reviewable, event-window fetches are NOT a hard stop once the sprint plan authorizes them. |
| HS-11 | Answering an architecture question is found to *require* implementation (code edit, run, commit, push). The §2 answer was reached by reading code, not editing it; any design decision that cannot be expressed without an `src/`/`scripts/` edit halts here. |
| HS-12 | A pre-existing cycle-003 SDD/sprint-plan/implementation artifact is discovered. (None at authoring — confirmed §0.) |

---

## 11. Sprint-plan implications (architecture guidance only — NOT the sprint plan)

The actual sprint plan is a separate, later artifact. The sequencing below is **guidance**; the dependency edges are the load-bearing part.

| Suggested sprint | Scope (guidance) | Key dependency / gate |
|---|---|---|
| **S01 — archive verification / sanity samples** | Execute §8 bounded sanity-sampling for T1/T2/T4; resolve the GOES-R-era S1+ supply question; flip `REQUIRES_LIVE_ARCHIVE_VERIFICATION` → verified for the figures the later sprints depend on. | Must precede any corpus target commitment (DV-4, HS-9). Bounded fetch requires explicit sprint authorization (DV-5). |
| **S02 — corpus namespace + schema skeleton** | Create `corpus-cycle-003/` tree (§3); pin the additive `xray_flux_observations[]` / `kp_observations[]` field names (OQ-1); stand up the cycle-003 manifest skeleton + `corpus_hash` machinery (CN-2/CN-3). | Depends on S01-verified shapes. Never touches frozen `corpus/`. |
| **S03 — T1/T2 corpus construction** | Populate T1/T2 events with leakage-free, strictly-pre-cutoff series (§4/§5); run the §2.3 substrate-conformance probe. | CSG-1/HS-7 gate. **Does NOT** implement the §2 Layer-A/B replay+loader change (HS-2). |
| **S04 — T4 expansion + bucket report** | Add T4 events to the GOES-R-era supply ceiling (§6); produce the honest count + bucket-distribution report. | T4X-1..7; no refit (HS-1). |
| **S05 — held-out split sealing** | Declare + freeze `heldout-split.json` (§7); hash the seal into the manifest. | HO-1..9; must be frozen before any future fit. |
| **S06 — review / audit / closeout** | `/review-sprint` → `/audit-sprint` → closeout; run the CSG-9 grep gate; verify all frozen invariants intact; record SC-8 explicit non-achievements. | Honest-framing gate; no release. |

Optional, operator-gated, default-OFF: a T3/T5 diagnostic-expansion sprint (OQ-6) and/or a pre-2017 secondary-tier T4 sprint (OQ-3, T4X-5). Neither is in default scope.

**Explicitly NOT in any cycle-003 sprint:** the §2 Layer-A/B replay+loader change; any refit; any T1/T2 sensitivity run; any baseline/uplift comparison; any release. Those belong to a future, separately-gated cycle.

---

## 12. Open questions carried to the sprint plan

These remain deferred to the sprint plan (a charter is created only if the operator requests one). OQ-2 is **answered** (§2) and removed from the open list.

- **OQ-1 (series field names)**: confirm `xray_flux_observations[]` (T1) and `kp_observations[]` (T2) as the additive field names and their entry sub-schema. (§4.2/§5.2 propose; sprint pins.)
- **OQ-3 (T4 supply vs era rule)**: if GOES-R-era S1+ supply is insufficient for a meaningful T4 held-out split, does the operator admit secondary-tier pre-2017 events, accept a coarser T4 split, or accept a documented underpowered T4? (§6 T4X-5, §7 HO-6.) Default: underpowered + documented, no pre-2017.
- **OQ-4 (split protocol choice)**: temporal cut vs stratified-random-with-sequence-grouping vs by-solar-rotation; ratio; seed determinism. (§7 HO-4.)
- **OQ-5 (namespace + hashing)**: confirm sibling `corpus-cycle-003/` root + additive manifest relationship to the frozen manifests. (§3.) Default: sibling root via `CORONA_CORPUS_DIR`.
- **OQ-6 (T3/T5 diagnostic expansion)**: in scope (diagnostic-only) or frozen at 5 events for cycle-003? Default: out of scope unless explicitly added.
- **OQ-7 (verification depth)**: sanity-sample N per theatre that satisfies §8 without tripping NG-7. (§8 DV-2.)
- **OQ-8 (rung framing)**: confirmed — cycle-003 defines its own substrate success criteria (PRD §9) and does NOT advance the cycle-002 rung ladder. A *future* cycle, not cycle-003, would attempt T1/T2 Rung 2 and any Rung 3. (§1, §2.2.)
- **OQ-9 (NEW, from §2)**: the future cycle that implements the §2 Layer-A/B replay+loader change must do so under its **own** SDD + sprint plan with explicit operator authorization; it is HS-2 for cycle-003. The cycle-003 corpus schema is designed to be forward-compatible with it (T1S-3, T2S-4) but must not be read as authorizing it.

---

## 13. Document scope guarantees

This SDD ships:
- `grimoires/loa/a2a/cycle-003/SDD.md` (the only file written by this task).

This SDD does NOT:
- Write `grimoires/loa/{prd,sdd,sprint}.md`, any cycle-001 artifact, any cycle-002 artifact, README, BUTTERFREEZONE, `package.json`, `src/`, `scripts/`, `tests/`, any manifest, or any calibration run output.
- Create a sprint plan or charter, implement anything, fetch any archive, commit, push, tag, bump version, or release.
- Implement the §2 Layer-A/B replay+loader change (deferred, HS-2).
- Refit any parameter, claim any calibration improvement, claim any T1/T2 runtime sensitivity, or imply L2 publish-readiness.
- Mutate any frozen invariant (§0) — all remain byte-identical.

*CORONA cycle-003 SDD authored 2026-05-28 against a read-only grounding pass at HEAD `2e5dc1d` (= `origin/main`). Cycle-002 closed at Rung 2 (T4 runtime-sensitive) / v0.2.0; that posture is preserved unweakened. First architecture blocker (OQ-2) answered from on-disk code: corpus shape alone does NOT unlock T1/T2 evidence updates — two additive code layers (replay + loader) would be required and are out of cycle-003 scope (HS-2). Corpus-shape / data-substrate cycle only: not refit, not calibration-improvement, not T1/T2 sensitivity, not L2, not release. Sprint plan + (optional) charter are downstream operator-gated steps; neither exists yet.*
