# CORONA Empirical Evidence (Calibration Priors)

**Status**: TBD — Sprint 4 (`corona-d4u` epic) deliverable
**Owner**: Sprint 4 / `corona-d4u`
**Sprint 1 scaffold** (`corona-2o8`): placeholder for Sprint 4's literature-research output.

This file documents **non-backtestable parameters** with primary-literature citations and confidence ratings. Sprint 4 authors it; the BREATH-style literature-driven recipe complements Sprint 3's TREMOR-style backtest harness for parameters that lack clean ground truth.

## Coverage targets (Sprint 4 fills these)

### WSA-Enlil sigma (T3 CME arrival)
- **TBD** — Sprint 4: cite primary literature on arrival-time forecast error (Mays et al. 2015 in Solar Physics; Riley et al. 2018 in Space Weather; etc.).
- Used by T3 arrival-window timing-error scoring (per Sprint 2 protocol).
- Default in cycle-001 BFZ docs: WSA-Enlil sigma 10-18h depending on CME type; glancing blows get 1.5× wider sigma.
- Manifest entry shape: `{ parameter: "theatre.cme_arrival.wsa_enlil_sigma_hours", source_type: "literature", derivation: "literature_derived", evidence_source: "<DOI>", confidence: "<TBD>" }`

### Doubt-price floors (T1 + T2)
- **TBD** — Sprint 4: cite GOES flare-reclassification rates + Kp preliminary-vs-definitive divergence statistics.
- Default in cycle-001 code: 0.55 for in-progress flares (per BFZ:39).
- Manifest entries: `theatre.flare_gate.doubt_price_in_progress`, `theatre.geomag_gate.doubt_price_provisional_kp`.

### Wheatland prior (T4 proton-event cascade)
- **TBD** — Sprint 4: cite Wheatland (2001) "The waiting-time distribution of solar flares" + subsequent updates.
- Currently used as flare-class proxy per `S_SCALE_THRESHOLDS_PROXY` in `src/theatres/proton-cascade.js:60-66`.
- Sprint 2 / `corona-19q` binds direct proton-flux logic (retires the proxy); Sprint 4 grounds the Wheatland λ + decay parameters in literature.
- Manifest entries: `theatre.proton_cascade.wheatland_lambda_<class>`, `theatre.proton_cascade.wheatland_decay_<class>`.

### Bz volatility threshold (T5 solar wind divergence)
- **TBD** — Sprint 4: cite DSCOVR-ACE divergence literature + L1 Bz statistics.
- Used by T5 sustained-streak detection.
- Manifest entry: `theatre.sw_divergence.bz_volatility_threshold`.

### Source-reliability scores
- **TBD** — Sprint 4: GOES primary/secondary switching rates; DSCOVR-ACE cross-validation reliability rates.
- Per BFZ cleanup notes (BUTTERFREEZONE.md:155): GOES primary/secondary is stamped on every evidence bundle.
- Manifest entries: `oracle.swpc.goes_primary_reliability`, `oracle.swpc.goes_secondary_reliability`, `oracle.swpc.dscovr_ace_cross_val_reliability`.

### Uncertainty pricing constants
- **TBD** — Sprint 4: Normal-CDF threshold-crossing model parameters per `src/processor/uncertainty.js`.
- Manifest entries: `processor.uncertainty.normal_cdf.<param>`.

## Engineering-estimated parameters (provisional)

Per PRD §8.5: engineering-estimated parameters are allowed but MUST be marked `provisional: true` in `calibration-manifest.json`. **Settlement-critical** engineering-estimated parameters require a documented `promotion_path` field. Sprint 4 reviews each engineering-estimated parameter and either:

1. Grounds it in primary literature (→ promote to `derivation: literature_derived`)
2. Documents the `promotion_path` (e.g. "Sprint X: backtest with corpus Y")
3. Confirms non-settlement-critical and accepts indefinite provisional status

## References

- PRD §5.5 — Sprint 4 scope
- PRD §7 — Calibration Manifest Schema (`derivation: literature_derived`)
- PRD §8.5 — Engineering-estimated parameter policy
- BREATH reference: `C:\Users\0x007\breath\grimoires\loa\empirical-validation-research.md` (531 lines, 62 citations) — pattern source
- SDD §5.5 — Empirical evidence research subsystem layout

---

*Sprint 1 placeholder (`corona-2o8`). Authored by Sprint 4 (`corona-d4u` epic).*
