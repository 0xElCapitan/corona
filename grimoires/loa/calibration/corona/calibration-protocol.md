# CORONA Calibration Protocol

**Status**: FROZEN — Sprint 2 (`corona-1so` epic) deliverable
**Frozen at**: cycle-001 Sprint 2 close, 2026-04-30
**Owner of record**: Sprint 2 / `corona-31y` (this document compiles `corona-b5v`, `corona-2bv`, `corona-19q`, `corona-fnb` outputs)
**Authority**: PRD §5.3 frozen-protocol mandate; PRD §11 Q2 / Q3 / Q4 resolution
**Companion**: `grimoires/loa/calibration/corona/theatre-authority.md` (settlement authority map)

---

## 1. What this document does

This is the **frozen** calibration protocol for cycle-001. It locks the semantic decisions Sprint 3 (backtest harness) and Sprint 5 (refit + regression gate) execute against. Once frozen:

1. Parameter changes require re-running the backtest harness against the corpus declared in §3.
2. The regression gate (§7) fails any change that drops a theatre's verdict below the Sprint 2 baseline.
3. Corpus changes require explicit operator authorization (HITL gate) and corpus-manifest regeneration (§3.4).

The decisions captured here propagate to:

- `scripts/corona-backtest.js` (Sprint 3): consumes the corpus structure (§3) and the per-theatre scoring contracts (§4).
- `grimoires/loa/calibration/corona/run-N/T<id>-report.md` (Sprint 3+): pass/marginal/fail verdict against the thresholds in §6.
- `grimoires/loa/calibration/corona/calibration-manifest.json` (Sprint 5): provenance entries reference the `corpus_hash` of the §3 corpus.

> Source: PRD §5.3 — "Frozen calibration protocol committed (Sprint 2)"; PRD §11 — open decisions Sprint 2 owns; SDD §5.3 — primary vs secondary corpus distinction.

---

## 2. Settlement authority cross-reference

Settlement authority is **theatre-specific** and defined in `grimoires/loa/calibration/corona/theatre-authority.md`. This protocol derives its corpus-eligibility and per-theatre scoring rules from that authority map. **DONKI is NOT a universal settlement oracle** — it supplies discovery, labels, correlations, and evidence enrichment. See `grimoires/loa/calibration/corona/theatre-authority.md` for the full table and per-theatre provenance citations.

The corpus rules in §3 enforce this distinction: an event is primary-corpus eligible only when settlement-grade data from the theatre's primary instrument (per the authority map) is present in the GOES-R era.

---

## 3. Calibration corpus

### 3.1 Tier structure (per PRD §8.3, SDD §5.3)

| Tier | Window | Approx size | Used for | Settlement-critical? |
|------|--------|-------------|----------|----------------------|
| **Primary** | GOES-R era (2017-01-01 → today, with GFZ-lag exclusion for T2) | ~15-25 events per theatre | Parameter fitting, scoring thresholds, regression gates | YES |
| **Secondary** | SC24/25 (2008-2030) + exceptional historical (2003 Halloween, etc.) | ad hoc, evidence-quality-gated | Sanity checks, edge-case coverage, narrative confidence | NO (unless evidence quality matches primary AND operator approves promotion per §3.5) |

### 3.2 Primary-corpus eligibility rules

For an event to be **primary-corpus eligible**, ALL of the following must hold:

1. **Era window**: event timestamp falls within the GOES-R era (`event_time >= 2017-01-01T00:00:00Z`).
   - Rationale: PRD §8.3 + SDD §5.3 — pre-2017 events lack consistent GOES-R-era integral proton flux + DSCOVR L1 coverage; including them in primary tier would conflate instrument-era effects with calibration error.

2. **Settlement-grade data presence**: data from the theatre's primary settlement instrument (per `theatre-authority.md`) is available for the full event window:
   - **T1 (Flare Class)**: GOES X-ray flux 1-min product covers the flare onset → end window with no gap >5 min.
   - **T2 (Geomagnetic Storm)**: SWPC provisional Kp covers the live-tier window AND **GFZ definitive Kp is published** for the regression-tier window. (See §3.6 GFZ-lag exclusion.)
   - **T3 (CME Arrival)**: WSA-Enlil prediction record (DONKI) is present **with a non-null forecast arrival time** AND observed L1 shock signature (DSCOVR or ACE 1-min cadence) is present. Events where WSA-Enlil ran but produced a null/non-converged prediction (e.g., complex multi-CME interaction, halo-angle metadata absent) are NOT primary-corpus eligible — they go to secondary corpus per §3.3 if the L1 observation is preserved, but do not enter T3 primary scoring. This is corpus eligibility, not scoring-layer filtering: a primary-corpus T3 event always has a usable forecast value.
   - **T4 (Proton Event Cascade)**: GOES integral proton flux ≥10 MeV channel covers the prediction-window onset → close, no gap >10 min during qualifying-event onset.
   - **T5 (Solar Wind Divergence)**: continuous DSCOVR + ACE solar-wind data (mag + plasma) over the divergence-detection window, no gap >5 min.

3. **DONKI label coverage**: the event has a corresponding DONKI record (FLR, CME, GST, IPS, SEP) for cross-validation.
   - Rationale: per `theatre-authority.md` "Why DONKI is NOT settlement" — DONKI provides the cross-validation harness even though it is not the settlement oracle.

4. **Per-theatre target count**: ~15-25 events per theatre (PRD §8.3, SDD §5.3).
   - Soft target. Sprint 3 / `corona-2b5` (corpus commit task) finalizes the per-theatre event list. If a theatre cannot reach 15 primary events under these rules, Sprint 3 documents the gap and the regression gate threshold tightens automatically (the theatre cannot be claimed as well-calibrated below the lower bound).

### 3.3 Secondary-corpus eligibility rules

An event is **secondary-corpus eligible** when:

1. **Window**: event falls within SC24 (2008-2019) OR SC25 (2019-2030) OR is an exceptional historical event (2003 Halloween storm, 1989 Quebec, 1859 Carrington-class, etc.).
2. **Evidence floor**: at minimum, a DONKI record exists AND at least one ground-instrument measurement (Kp from any source, GOES X-ray, or post-event archive) is preserved.
3. **Use posture**: secondary events are **advisory-only**. They feed sanity checks and edge-case coverage; they do **NOT** enter the regression-gate scoring (§7) by default.

### 3.4 Storage layout

Per `grimoires/loa/calibration/corona/corpus/README.md`:

```
corpus/
├── primary/
│   ├── T1-flare-class/<YYYY-MM-DD>-<class>.json
│   ├── T2-geomag-storm/<YYYY-MM-DD>-Kp<N>.json
│   ├── T3-cme-arrival/<YYYY-MM-DD>-CME-<id>.json
│   ├── T4-proton-cascade/<YYYY-MM-DD>-S<level>.json
│   └── T5-solar-wind-divergence/<YYYY-MM-DD>-divergence.json
├── secondary/
│   └── <YYYY-MM-DD>-<event-name>/
└── corpus-manifest.json   # SHA256 over each corpus file; computed at freeze time
```

`corpus-manifest.json` is generated by Sprint 3 / `corona-2b5` at the moment the corpus commits. The SHA256 of this file becomes the `corpus_hash` field for every `calibration-manifest.json` entry derived via backtest (PRD §7).

### 3.5 Promotion path: secondary → primary

A secondary event MAY be promoted to primary tier when:

1. Its evidence quality is documented to **match primary-tier eligibility rules §3.2** retroactively (e.g., a 2014 event with full GOES-R-era data and a DONKI record could be promoted).
2. Operator HITL authorization is recorded.
3. `corpus-manifest.json` is regenerated (changes the corpus_hash).
4. All `calibration-manifest.json` entries with `derivation: backtest_derived` referencing the affected theatre's corpus_hash are re-validated (Sprint 5 regression gate).

**Default posture**: secondary events stay secondary unless explicitly promoted. The promotion path exists for cases where a historical event's evidence quality is later shown to match primary.

### 3.6 GFZ-lag exclusion (T2 only)

Per PRD §10 R5: GFZ definitive Kp publishes with a ~30-day lag. T2 primary corpus events from the most recent ~30 days are **excluded from the regression tier** until GFZ definitive publishes. The live tier (SWPC provisional Kp) covers these events for in-flight settlement, but they MUST NOT enter Sprint 5 regression-gate scoring until promoted via §3.5.

### 3.7 Required corpus annotations per theatre

Eligibility (§3.2) tells Sprint 3 *which* events to include; this section tells Sprint 3 *what fields* each corpus event MUST carry so the per-theatre scoring modules in §4 can compute their result shapes without inventing semantics. These are minimum required fields. Sprint 3 / `corona-2b5` (corpus commit) and `corona-1ks` (corpus-loader-validate) MUST validate every primary-corpus file against this schema at load time.

#### 3.7.1 Common envelope (every theatre)

Every corpus event JSON file at `corpus/primary/T<id>-<theatre>/<YYYY-MM-DD>-<id>.json` MUST contain:

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `event_id` | string | author | Unique identifier; convention `<theatre>-<YYYY-MM-DD>-<short-id>` |
| `theatre` | string | author | One of `T1`, `T2`, `T3`, `T4`, `T5` |
| `tier` | string | author | One of `primary`, `secondary` |
| `event_time` | ISO-8601 | primary instrument | Anchor time (theatre-specific meaning, defined per-theatre below) |
| `donki_record_ref` | string \| null | DONKI | DONKI record id (FLR/CME/GST/IPS/SEP); null permitted ONLY for T5 (no DONKI dependency) |
| `goes_satellite` | string | SWPC | Primary GOES at event time (e.g. `GOES-16`, `GOES-18`) |
| `goes_secondary_satellite` | string \| null | SWPC | Secondary GOES at event time, or null |
| `notes` | string | author | Free-form narrative; provenance/quirks/ingestor caveats |

#### 3.7.2 T1 — Flare Class Gate

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `event_time` | ISO-8601 | GOES X-ray | Flare onset time (begin_time per SWPC) |
| `flare_class_observed` | string | GOES X-ray | Final flare class (e.g. `M5.2`, `X1.0`) |
| `flare_peak_time` | ISO-8601 | GOES X-ray | Peak flux time |
| `flare_peak_xray_flux` | number | GOES X-ray | Peak 1-8Å flux in W/m² |
| `flare_end_time` | ISO-8601 | GOES X-ray | End time |
| `donki_flr_class_type` | string | DONKI FLR | DONKI's reported class for cross-validation |
| `prediction_window_hours` | number | author | Theatre prediction window used for scoring (default per §4.x) |
| `bucket_observed` | integer | derived | Index into the T1 bucket array; computed from `flare_class_observed` at corpus-load time |

#### 3.7.3 T2 — Geomagnetic Storm Gate

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `event_time` | ISO-8601 | SWPC | Storm onset 3-hour interval start |
| `kp_swpc_observed` | number | SWPC | SWPC provisional Kp (peak in window) |
| `kp_gfz_observed` | number \| null | GFZ | GFZ definitive Kp (peak in window); null permitted only for events newer than the GFZ publication lag (per §3.6) — such events are NOT primary-corpus regression-tier eligible |
| `kp_window_start` | ISO-8601 | SWPC | Aggregation window start |
| `kp_window_end` | ISO-8601 | SWPC | Aggregation window end |
| `donki_gst_id` | string | DONKI GST | DONKI's GST record id |
| `g_scale_observed` | string | derived | G1-G5 derived from `kp_gfz_observed` (preferred) or `kp_swpc_observed` |
| `bucket_observed` | integer | derived | Index into the T2 bucket array |

#### 3.7.4 T3 — CME Arrival

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `event_time` | ISO-8601 | DONKI CME | CME launch time (DONKI start_time) |
| `cme_id` | string | DONKI CME | CME activity id |
| `wsa_enlil_predicted_arrival_time` | ISO-8601 | DONKI WSA_ENLIL_PREDICTIONS | Predicted L1 arrival; **non-null required** per §3.2 #2 T3 (corpus eligibility filter) |
| `wsa_enlil_sigma_hours` | number \| null | DONKI / literature | Ensemble spread when available; null falls back to Sprint 4 literature prior |
| `wsa_enlil_halo_angle_degrees` | number | DONKI WSA_ENLIL_PREDICTIONS | CME plane direction; used to derive `glancing_blow_flag` |
| `glancing_blow_flag` | boolean | derived | True when `wsa_enlil_halo_angle_degrees ≥ 45`; set at corpus-load time, not at scoring time |
| `observed_l1_shock_time` | ISO-8601 | DSCOVR/ACE | Time of sustained speed-jump + Bt increase ≥30 min |
| `observed_l1_source` | string | DSCOVR/ACE | One of `DSCOVR_PRIMARY`, `DSCOVR_SECONDARY`, `ACE` |

#### 3.7.5 T4 — Proton Event Cascade S-scale

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `event_time` | ISO-8601 | GOES X-ray | M5+ trigger flare onset (theatre opens at this time) |
| `trigger_flare_class` | string | GOES X-ray | Triggering flare class (≥M5.0 per theatre create rule) |
| `trigger_flare_peak_time` | ISO-8601 | GOES X-ray | |
| `prediction_window_hours` | number | author | MUST be 72 per §4.4.0 for primary corpus; non-default requires manifest entry |
| `proton_flux_observations` | array of `{time: ISO-8601, peak_pfu: number, energy_channel: string, satellite: string}` | GOES integral protons | All ≥10 MeV channel readings within the 72-hour post-trigger window; harness applies §4.4.1 qualifying rules + 30-min dedup |
| `qualifying_event_count_observed` | integer | derived | Count of distinct qualifying SEP events per §4.4.1; computed at corpus-load time as a sanity check, NOT used directly by scoring (scoring re-derives from `proton_flux_observations`) |
| `bucket_observed` | integer | derived | Index into the T4 bucket array (§4.4.2) |

#### 3.7.6 T5 — Solar Wind Divergence

T5 has no external ground truth — it self-resolves on DSCOVR-ACE Bz volatility. The corpus annotations therefore carry the *behavioral expectations* against which T5 is scored. Sprint 3 / `corona-2b5` constructs these annotations from DSCOVR/ACE archives + NOAA mission-ops bulletins; Sprint 4 (`corona-2zs`) may refine the FP-corroboration source list against literature.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `event_time` | ISO-8601 | author | Anchor time for the divergence-detection window |
| `detection_window_start` | ISO-8601 | author | Start of T5 divergence-detection window for this corpus event |
| `detection_window_end` | ISO-8601 | author | End of window (default 24 hours per `src/theatres/solar-wind-divergence.js` defaults) |
| `divergence_signals` | array of `{signal_time: ISO-8601, signal_resolution_time: ISO-8601 \| null, false_positive_label: boolean, anomaly_classification: string \| null}` | DSCOVR/ACE archive + author | Each signal annotated with: when T5 raised it, when divergence resolved (Bz returned within threshold) or null if persisted, ground-truth FP label, and an optional anomaly classification (e.g., `instrument_drift`, `genuine_transient`, `cme_passage`) |
| `corroborating_alerts` | array of `{signal_time: ISO-8601, source: string, alert_id: string, time: ISO-8601}` | NOAA SWPC alerts + DONKI IPS/GST | Cross-references to alerts within the 60-min corroboration window of each divergence signal. `source` is one of `NOAA_SWPC_ALERT`, `DONKI_IPS`, `DONKI_GST`. Empty array means no corroboration found. Used by §4.5.1.a FP-rate computation. |
| `stale_feed_events` | array of `{actual_onset_time: ISO-8601, detection_time: ISO-8601, end_time: ISO-8601, satellite: string}` | DSCOVR/ACE archive + author | `actual_onset_time` is the corpus's annotated truth (first missing/repeated reading). `detection_time` is when T5 raised the stale-feed quality flag. `latency_seconds = detection_time - actual_onset_time`. `satellite` is `DSCOVR` or `ACE`. Empty array means no stale-feed events in the window. |
| `satellite_switch_events` | array of `{switch_time: ISO-8601, from: string, to: string, reason: string, transition_end_time: ISO-8601}` | NOAA mission ops / DSCOVR-ACE archive | `from`/`to` ∈ `{DSCOVR_PRIMARY, DSCOVR_SECONDARY, ACE}`. `reason` is free-form (e.g., `dscovr_primary_outage`). `transition_end_time` is the expected resume time (default `switch_time + 15 min` per §4.5.1.c). Empty array means no switch events in the window. |
| `anomaly_bulletin_refs` | array of `{time_window_start: ISO-8601, time_window_end: ISO-8601, source: string, bulletin_id: string, classification: string}` | NOAA mission-ops bulletins | Used by §4.5.2 hit-rate diagnostic only. Empty array is permitted. |

**Construction note**: T5 corpus events are NOT individual divergence signals — they are *time windows* during which T5 was running, with the four arrays describing what happened within the window. A typical primary-corpus T5 event covers 24-72 h of continuous DSCOVR + ACE data with annotated truth for divergence signals, stale-feed events, switches, and bulletins.

---

## 4. Per-theatre scoring rules

PRD §8.4 establishes the per-theatre primary metric structure. This section binds the concrete scoring contracts that Sprint 3 implements (one module per theatre per SDD §6.4 — no shared code paths).

### 4.1 T1 — Flare Class Gate

- **Settlement authority**: GOES/SWPC X-ray flux (live + regression).
- **Primary metric**: **bucket-Brier** on flare class. Bucket boundaries match the theatre buckets defined in `src/theatres/flare-gate.js` (TBD per Sprint 5 if buckets shift; pinned at Sprint 2 freeze).
- **Formula**: `brier = mean( sum_b (predicted_p_b - observed_b)^2 ) / B` where `b` is bucket, `B` is bucket count.
- **Secondary metric**: per-bucket calibration — for each bucket `b`, ratio of `actual_outcomes_in_b / total_predictions_for_b` should approach the predicted probability.
- **Sprint 3 module**: `scripts/corona-backtest/scoring/t1-bucket-brier.js`.
- **Result shape**: `{ brier: number, bucket_calibration: number[], n_events: number }`.

### 4.2 T2 — Geomagnetic Storm Gate

- **Settlement authority**: SWPC provisional Kp (live), **GFZ definitive Kp** (regression).
- **Primary metric**: **bucket-Brier** on Kp level (bucket boundaries match the G-scale bands G1-G5 derived from Kp).
- **GFZ vs SWPC convergence (regression-tier supplementary)**: for events where both GFZ and SWPC Kp are available, score the agreement: `convergence = mean( 1 - |kp_gfz - kp_swpc| / 9 )`. Used as a regression-tier sanity check on settlement source.
- **Sprint 3 module**: `scripts/corona-backtest/scoring/t2-bucket-brier.js`.
- **Result shape**: `{ brier: number, gfz_vs_swpc_convergence: number, n_events: number }`.
- **GFZ-lag exclusion**: regression tier omits events newer than the GFZ definitive lag (§3.6).

### 4.3 T3 — CME Arrival (corona-2bv freeze)

> **PRD §11 Q2 resolution**.

- **Settlement authority**: observed L1 shock signature (sustained speed jump + Bt magnitude increase ≥30 min, per `theatre-authority.md` §T3).
- **Forecast source**: WSA-Enlil predicted arrival window (DONKI). NOT settlement.

#### 4.3.1 Primary metric — Mean Absolute Error in hours

```
MAE_hours = mean( |t_predicted - t_observed| ) / (3600 * 1000)
```

where `t_predicted` is the WSA-Enlil predicted arrival time and `t_observed` is the observed L1 shock signature time. MAE chosen over RMSE because:
- Operationally the question is "how far off was the forecast", which MAE answers directly.
- RMSE penalizes large misses harder, but the corpus is small (~15-25 events) and a single outlier dominates RMSE — undesirable for a frozen-protocol baseline.
- The corpus-eligibility rule at §3.2 #2 T3 (non-null WSA-Enlil forecast required) screens out the catastrophic-miss class that RMSE was designed to penalize — null/non-converged forecasts never enter primary scoring.

#### 4.3.2 Secondary metric — Within-±6h hit rate

```
hit_rate_6h = count( |t_predicted - t_observed| <= 6h ) / n_events
```

Per PRD §6 T3 row + spec/construct.json T3 description. The ±6h window is the canonical NOAA/SWPC operational tolerance for CME arrival forecasts.

**Glancing-blow widening**: events flagged in the corpus as glancing-blow CMEs (CME plane ≥45° off Earth direction per WSA-Enlil halo angle metadata) score against a **±12h window** for the secondary hit-rate metric only. The primary MAE is computed without widening — a glancing blow that arrives 10h late still has a 10h error. Rationale: glancing-blow geometry inflates legitimate WSA-Enlil sigma per Mays et al. 2015 / Riley et al. 2018 (Sprint 4 grounds the literature prior).

#### 4.3.3 Sigma normalization (supplementary diagnostic)

For each event, compute:

```
z_score = |t_predicted - t_observed| / sigma_predicted
```

where `sigma_predicted` comes from the WSA-Enlil ensemble spread when available, else the literature prior (Sprint 4 / `corona-2zs` provides the prior; default cycle-001 BFZ docs cite 10-18h depending on CME type, glancing blows × 1.5).

`z_score` is **not** part of the pass/marginal/fail composite (§6) — it is a diagnostic that surfaces in the per-event report (`run-N/T3-report.md`) and helps Sprint 4 / `corona-2zs` validate that the literature sigma is well-calibrated against the corpus.

#### 4.3.4 Bz polarity

**Out of scope for T3.** T3 settles on arrival timing only. Bz polarity at L1 (used for downstream G-scale prediction) is T2's concern, settled via SWPC/GFZ Kp downstream of the CME arrival.

#### 4.3.5 Sprint 3 module + result shape

- **Module**: `scripts/corona-backtest/scoring/t3-timing-error.js` (no shared code with T1/T2/T4 bucket-Brier or T5 quality-of-behavior — operator hard constraint #5, SDD §6.4).
- **Result shape**: `{ mae_hours: number, within_6h_hit_rate: number, glancing_blow_within_12h_hit_rate: number | null, mean_z_score: number, n_events: number }`.
- **No scoring-layer filtering**: every primary-corpus T3 event has a non-null WSA-Enlil forecast value per §3.2 #2 T3. The harness MUST score every primary-corpus event; there is no "excluded outlier" bucket. Events with null forecasts are screened out at corpus-load time, not at scoring time.

### 4.4 T4 — Proton Event Cascade S-scale (corona-19q freeze)

> **PRD §11 Q4 resolution**.

#### 4.4.0 Prediction window

- **Window length**: **72 hours** from the M5+ trigger time. The theatre opens at trigger-event time (`opens_at` in the runtime state) and closes 72 h later (`closes_at`). The bucket count is the number of qualifying S-scale proton events (per §4.4.1) observed within this full 72-hour post-trigger window — NOT a sub-window or a sliding window.
- **Code binding**: `src/theatres/proton-cascade.js:185` defaults `window_hours = 72`. The default IS the freeze; non-default windows are not used by the primary corpus.
- **Sprint 3 contract**: the backtest harness MUST score primary-corpus T4 events against a 72-hour observation window from the trigger time. If a corpus event was observed against a non-default window in some external archive, the harness MUST re-window the proton-flux observations to the 72-hour post-trigger band before counting.
- **Override discipline**: a non-default window for any individual primary-corpus event requires a `calibration-manifest.json` entry with rationale (per §7); secondary-corpus events MAY use other windows since they don't enter regression scoring.

#### 4.4.1 S-scale qualifying-event definition (proxy retirement)

Sprint 0 (`corona-222`) scaffolded T4 buckets onto the NOAA S-scale and left a flare-class proxy (`S_SCALE_THRESHOLDS_PROXY`: S1↔M1.0, S2↔M5.0, S3↔X1.0) at `src/theatres/proton-cascade.js:60-66`. Sprint 2 retires that proxy.

**Frozen S-scale qualifying-event definition** (NOAA Solar Radiation Storm Scale, integral proton flux ≥10 MeV channel):

| S-level | Threshold (pfu) | Label |
|---------|------------------|-------|
| S1 | ≥10 | Minor |
| S2 | ≥100 | Moderate |
| S3 | ≥1,000 | Strong |
| S4 | ≥10,000 | Severe |
| S5 | ≥100,000 | Extreme |

A proton flux observation **qualifies** as an S<level>+ event when:

1. The bundle's `payload.proton.energy_channel` matches the canonical SWPC `≥10 MeV` channel (regex `(?:^|\D)10\s*MeV\b`, case-insensitive — strict to avoid the substring collision with `≥100 MeV`).
2. The bundle's `payload.proton.flux` is ≥ the S-level's pfu threshold from the table above.
3. The bundle's `payload.event_time` falls outside the **SEP onset/dedup window** (30 min) of the most recent already-counted qualifying event in the same theatre instance. Consecutive 1-min above-threshold readings within the window coalesce into a single SEP event per NOAA convention.

**Code change (committed Sprint 2)**:

- `S_SCALE_THRESHOLDS_PROXY` const renamed → `S_SCALE_THRESHOLDS_PFU`.
- Values: `{S1: 10, S2: 100, S3: 1000, S4: 10000, S5: 100000}` (canonical NOAA pfu).
- New constant `SEP_DEDUP_WINDOW_MINUTES = 30`.
- `processProtonEventCascade` now qualifies on `proton_flux` bundles per the rules above. Flare events become correlation-only (logged to `position_history` with reason `correlation evidence (proton-flux qualifying logic, Sprint 2)`).
- Theatre state field `count_threshold_class` / `count_threshold_rank` removed; `count_threshold_pfu` (number) added.
- Theatre state field `last_qualifying_event_time` (epoch ms or null) added for dedup tracking.
- TODO comment at `src/theatres/proton-cascade.js:60-61` removed.
- Tests updated and a new regression suite locks the binding (`tests/corona_test.js` `Proton Event Cascade — S-scale binding (Sprint 2 freeze)`).

#### 4.4.2 Bucket boundaries (corpus-pinned at Sprint 2)

- **Boundaries**: `[0-1, 2-3, 4-6, 7-10, 11+]` (5 buckets).
- **Rationale**: matches the Wheatland (2001) waiting-time decay shape AND TREMOR's bucket-Brier pattern. The Sprint 0 scaffold adopted these boundaries; Sprint 2 pins them.
- **Re-baseline license**: Sprint 5 / `corona-3ja` MAY re-balance the boundaries based on Run 1 baseline distribution **only if** the resulting bucket-Brier improves AND each bucket has at least 3 events in the primary corpus. Re-balance MUST be documented as a calibration-manifest entry with full provenance.

#### 4.4.3 Primary metric — bucket-Brier on S-event count

```
brier = mean( sum_b (predicted_p_b - observed_b)^2 ) / B
```

where `b` is the count-bucket and `observed_b` is 1 for the bucket containing the observed S-event count.

#### 4.4.4 Sprint 3 module + result shape

- **Module**: `scripts/corona-backtest/scoring/t4-bucket-brier.js` (separate from T1/T2 bucket-Brier — operator hard constraint #5).
- **Result shape**: `{ brier: number, bucket_distribution: number[], n_events: number }`.

### 4.5 T5 — Solar Wind Divergence (corona-fnb freeze)

> **PRD §11 Q3 resolution**.

T5 is the only **self-resolving** theatre — there is no external ground truth. The settlement criterion is internal: divergence between DSCOVR and ACE Bz beyond a threshold, sustained over a streak window. See `theatre-authority.md` §T5.

This makes hit-rate-style metrics weak (the prediction is always against itself). Sprint 2 binds **quality-of-behavior** metrics that capture whether T5 is doing its job correctly, not whether it "predicts the future".

#### 4.5.1 Primary metrics (composite)

##### a) False-positive rate

A T5 divergence signal is a **false positive** when the divergence resolves (Bz returns within threshold) within 60 minutes of the signal AND no external corroboration exists:

- No satellite-switch event recorded within the 60-minute window (a switch would explain transient divergence).
- No NOAA SWPC alert / DONKI IPS or GST record corroborates the divergence (i.e., no real solar-wind transient was happening).

```
fp_rate = count(false_positive_signals) / count(total_divergence_signals)
```

Computed over the corpus window. A signal that gets corroboration within 60 min is a true positive (or at minimum "not a false positive"). The 60-minute corroboration window matches the typical NOAA SWPC alert latency.

##### b) Stale-feed detection latency

T5 must flag stale-feed conditions (DSCOVR or ACE 1-min stream missing readings, repeated readings, or > 5-min gaps). Latency is measured as:

```
latency_seconds = t_T5_flag - t_actual_staleness_onset
```

where `t_actual_staleness_onset` is the first missing/repeated reading in the corpus's annotated truth, and `t_T5_flag` is when T5 raises the stale-feed quality flag.

Reported as **p50** (median) and **p95** over all stale-feed events in the corpus window.

##### c) Satellite-switch behavior

A satellite-switch event is a DSCOVR primary↔secondary OR DSCOVR↔ACE switch annotated in the corpus. Expected T5 behavior:

1. Pause divergence detection for the **switch transition window** (default 15 min from switch annotation).
2. Annotate the position history with switch metadata (which satellite, when, why).
3. Resume detection without raising a spurious divergence signal in the **first 10 min post-switch**.

A switch is **handled** when ALL three criteria are met. Reported as:

```
handled_rate = count(handled_switches) / count(total_switches_in_corpus)
```

#### 4.5.2 Hit rate (deprioritized — diagnostic only)

T5 has no clean external ground truth. As a diagnostic, the corpus may annotate divergence signals with cross-references to NOAA mission-ops bulletins (when a known instrument anomaly is documented). Hit rate is computed against this annotated truth:

```
hit_rate_diagnostic = count(t5_signal_matches_annotated_anomaly) / count(annotated_anomalies)
```

**Hit rate does NOT enter the pass/marginal/fail composite** (§6). It surfaces in `run-N/T5-report.md` for transparency and Sprint 4 cross-reference.

#### 4.5.3 Sprint 3 module + result shape

- **Module**: `scripts/corona-backtest/scoring/t5-quality-of-behavior.js` (no shared code with T1/T2/T4 bucket-Brier or T3 timing-error — operator hard constraint #5).
- **Result shape**: `{ fp_rate: number, stale_feed_p50_seconds: number, stale_feed_p95_seconds: number, satellite_switch_handled_rate: number, hit_rate_diagnostic: number, n_signals: number, n_stale_events: number, n_switches: number }`.

---

## 5. Per-event report contract

Each `run-N/T<id>-report.md` follows the SDD §5.2 template. Sprint 2 adds the following per-theatre extensions:

| Theatre | Required per-event fields |
|---------|---------------------------|
| T1 | `flare_class_predicted`, `flare_class_observed`, `bucket_predicted`, `bucket_observed`, `brier_score` |
| T2 | `kp_swpc_predicted`, `kp_gfz_observed`, `kp_swpc_observed`, `bucket_predicted`, `bucket_observed`, `brier_score` |
| T3 | `t_predicted`, `t_observed`, `error_hours`, `within_6h`, `glancing_blow_flag`, `z_score`, `wsa_enlil_null_flag` |
| T4 | `s_event_count_predicted_distribution`, `s_event_count_observed`, `bucket_predicted`, `bucket_observed`, `brier_score`, `qualifying_events[]` (with peak_pfu, energy_channel, time) |
| T5 | `signal_count`, `false_positive_count`, `stale_feed_events[]` (with latency_seconds), `switches[]` (with handled boolean), `hit_rate_diagnostic_count` |

---

## 6. Pass / marginal / fail thresholds

Per-theatre verdict at run close. **Initial Sprint 2 thresholds — Sprint 5 may re-baseline based on Run 1 actuals if motivated by a corpus reality and documented as a manifest entry.**

| Theatre | Pass | Marginal | Fail |
|---------|------|----------|------|
| **T1 (Bucket-Brier)** | Brier ≤ 0.15 AND bucket calibration ≥ 0.85 | Brier ≤ 0.20 AND bucket calibration ≥ 0.75 | Brier > 0.20 OR bucket calibration < 0.75 |
| **T2 (Bucket-Brier + GFZ↔SWPC)** | Brier ≤ 0.15 AND GFZ↔SWPC convergence ≥ 0.85 | Brier ≤ 0.20 AND convergence ≥ 0.75 | Brier > 0.20 OR convergence < 0.75 |
| **T3 (Timing error + hit rate)** | MAE ≤ 6h AND within-±6h hit rate ≥ 0.65 | MAE ≤ 9h AND within-±6h hit rate ≥ 0.50 | MAE > 9h OR within-±6h hit rate < 0.50 |
| **T4 (Bucket-Brier, multi-class)** | Brier ≤ 0.20 AND bucket calibration ≥ 0.75 | Brier ≤ 0.25 AND bucket calibration ≥ 0.65 | Brier > 0.25 OR bucket calibration < 0.65 |
| **T5 (Quality-of-behavior composite)** | FP rate ≤ 0.10 AND stale-feed p50 ≤ 120s AND switch handled ≥ 0.95 | FP rate ≤ 0.15 AND stale-feed p50 ≤ 300s AND switch handled ≥ 0.90 | FP rate > 0.15 OR stale-feed p50 > 300s OR switch handled < 0.90 |

### 6.1 Composite verdict

A run produces five per-theatre verdicts AND one **overall verdict**. The overall verdict is the **WORST** per-theatre verdict (a single fail blocks the regression gate).

### 6.2 Threshold rationale (initial Sprint 2 baseline)

- **T1 / T2 Brier ≤0.15 pass band**: TREMOR's frozen-protocol pass band is bucket hit-rate ≥70% / MRE <30% — equivalent calibration target translates to Brier ≤0.15 for similar bucket counts. Reference only; CORONA's threshold is per-theatre per PRD §5.3.
- **T3 MAE ≤6h pass band**: PRD §6 T3 row ±6h hit-rate threshold + WSA-Enlil literature sigma 10-18h (Sprint 4 grounding). A pass-band MAE at 6h means the model is on average within the operational tolerance.
- **T4 Brier ≤0.20 pass band (looser than T1/T2)**: T4 is multi-class with more buckets and intrinsically higher Brier baseline. The 0.20 band reflects this without conceding correctness.
- **T5 FP ≤10% / stale ≤120s / handled ≥95% pass band**: T5 has no external truth; the targets are operational quality-of-behavior bars, not statistical-fit bars. The numbers are derived from typical SWPC operational alert tolerances and DSCOVR-ACE handover documentation.

Sprint 5 re-baseline policy: if Run 1 baseline reveals that initial thresholds are too aggressive (or too lax), Sprint 5 / `corona-3ja` MAY widen/tighten thresholds with a `calibration-manifest.json` entry capturing the rationale, the prior threshold, and the new threshold. The regression gate compares against the **most recent committed thresholds**, not the Sprint 2 originals — but each change must be justified.

---

## 7. Regression policy

### 7.1 What triggers re-run

Any commit that changes:

1. A theatre threshold parameter (`src/theatres/*.js` constants).
2. A processor parameter (`src/processor/*.js` — doubt-price, sigma prior, source-reliability).
3. A scoring module (`scripts/corona-backtest/scoring/*.js`).
4. The corpus (`grimoires/loa/calibration/corona/corpus/**`).

### 7.2 Re-run procedure

1. Run `scripts/corona-backtest.js` against the current corpus → produces `run-N/`.
2. Compute per-theatre verdicts against the thresholds in §6 (or current committed thresholds if Sprint 5 has re-baselined).
3. Compare against the **most recent passing run's** per-theatre verdicts.
4. Update `calibration-manifest.json` entries for any changed parameter.

### 7.3 Gate failure conditions

The regression gate **FAILS** when:

- Any theatre's verdict drops (e.g., from `pass` to `marginal`, or `marginal` to `fail`) without an accompanying `calibration-manifest.json` entry that justifies the regression with a manifest-grade rationale (operator HITL approval required).
- A `calibration-manifest.json` entry's `corpus_hash` or `script_hash` no longer matches the current corpus / script content.
- An inline parameter in `src/**` diverges from its `calibration-manifest.json` entry without a corresponding manifest update (Sprint 5 inline-equals-manifest test, SDD §7.3).

### 7.4 What the gate does NOT enforce

- Improvements: a Run N better than Run N-1 is fine. The gate is one-directional (regressions blocked, improvements waved through).
- Code refactors that don't change parameters or corpus: tests must still pass, but the regression gate doesn't trigger if no calibrated parameter or corpus file changed.
- Secondary-corpus events: secondary tier doesn't enter regression scoring by default (§3.3).

---

## 8. Open items deferred to downstream sprints

These are explicitly **not** Sprint 2 decisions — they remain for the named sprint:

| Item | Owner sprint | Note |
|------|--------------|------|
| Concrete corpus event list (~15-25 per theatre) | Sprint 3 / `corona-2b5` | Sprint 2 specifies eligibility rules; Sprint 3 selects events under those rules and commits the corpus. |
| WSA-Enlil sigma literature prior | Sprint 4 / `corona-2zs` | Sprint 2 references the prior in §4.3.3; Sprint 4 grounds it in primary literature (Mays et al. 2015, Riley et al. 2018). |
| Wheatland λ + decay parameters | Sprint 4 / `corona-2zs` | Wheatland (2001) waiting-time prior; current values in `src/theatres/proton-cascade.js:PRODUCTIVITY_PARAMS` are engineering-estimated. |
| Doubt-price floors (T1, T2) | Sprint 4 / `corona-2zs` | Cite GOES flare-reclassification rates + Kp preliminary-vs-definitive divergence statistics. |
| Bz volatility threshold (T5) | Sprint 4 / `corona-2zs` | DSCOVR-ACE divergence literature. |
| Source-reliability scores | Sprint 4 / `corona-2zs` | GOES primary/secondary, DSCOVR↔ACE switch reliability. |
| Refit of any of the above | Sprint 5 (`corona-3fg` epic) | Refit consumes Sprint 3 baseline + Sprint 4 evidence. |
| Bucket boundary re-baseline | Sprint 5 / `corona-3ja` | Re-balance license per §4.4.2. |
| Threshold re-baseline | Sprint 5 / `corona-3ja` | Re-baseline license per §6.2. |

---

## 9. References

- **PRD §5.3** — Sprint 2 frozen-protocol scope.
- **PRD §6** — Theatre Authority Map (settlement authority is theatre-specific, NOT DONKI-universal).
- **PRD §7** — Calibration Manifest Schema (12-field provenance schema).
- **PRD §8.3** — Two-tier corpus structure (primary GOES-R era + secondary stress).
- **PRD §8.4** — Per-theatre scoring rules table (no TREMOR wholesale reuse; Sprint 2 §4 binds concretely).
- **PRD §11** — Open decisions Sprint 2 owns (Q2 T3 timing, Q3 T5 quality, Q4 T4 buckets) — all resolved.
- **SDD §5.3** — Primary vs secondary corpus distinction; backtest-harness gate logic.
- **SDD §5.4** — Theatre authority map.
- **SDD §6.4** — Per-theatre scoring modules (no shared code paths — operator hard constraint #5).
- **SDD §7** — Manifest regression gate.
- **`grimoires/loa/calibration/corona/theatre-authority.md`** — Settlement authority of record.
- **`grimoires/loa/calibration/corona/corpus/README.md`** — Corpus layout + freeze policy.
- **`src/theatres/proton-cascade.js`** — T4 implementation; Sprint 2 (`corona-19q`) committed the proxy retirement.
- **TREMOR** (`C:\Users\0x007\tremor`, read-only): `grimoires/loa/calibration/omori-backtest-protocol.md` — frozen-protocol pattern source.
- **BREATH** (`C:\Users\0x007\breath`, read-only): `grimoires/loa/empirical-validation-research.md` — literature-research pattern source for Sprint 4.

---

## 10. Freeze acknowledgment

This protocol is **frozen** as of cycle-001 Sprint 2 close. Per-theatre scoring contracts (§4), corpus eligibility rules (§3), pass/marginal/fail thresholds (§6), and regression policy (§7) are now binding for Sprint 3 backtest harness implementation (`corona-d4u` epic) and Sprint 5 refit/manifest work (`corona-3fg` epic).

Changes to this protocol after freeze require:

1. A `calibration-manifest.json` entry documenting the change rationale.
2. A re-run of the backtest harness against the current corpus.
3. Operator HITL approval (the freeze is operator-authority).

The protocol's purpose is exactly this: prevent quiet drift between code, corpus, and stated calibration intent. Sprint 5's regression gate enforces the technical constraints; the freeze acknowledgment enforces the social constraint.

---

*Sprint 2 frozen protocol authored cycle-001 (`corona-1so` epic). Compiles `corona-b5v` (corpus tiers, §3), `corona-2bv` (T3 timing metric, §4.3 — resolves PRD §11 Q2), `corona-19q` (T4 S-scale binding + proxy retirement, §4.4 — resolves PRD §11 Q4), `corona-fnb` (T5 quality-of-behavior, §4.5 — resolves PRD §11 Q3), and `corona-31y` (composition + thresholds + regression policy). Settlement authority at `grimoires/loa/calibration/corona/theatre-authority.md` (Sprint 0 / `corona-1mv`).*
