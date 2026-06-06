# CORONA Cycle-004 Sprint 03 — CLOSEOUT (Proof Closeout)

## 1. Allowed posture (verbatim, SDD §15)

> "Cycle-004 wires and tests deterministic T2 evidence consumption, while confirming T1 evidence consumption is honestly blocked and retained as a negative control. No rung is banked. No calibration, scoring, forecasting-accuracy, predictive-uplift, or L2-readiness claim is made. Cycle-002's T4-only runtime-sensitivity ceiling remains unchanged."

## 2. Theatre-qualified result statement (SDD §15)

> "T2 runtime evidence-consumption wiring is implemented and demonstrated deterministically (wired ≠ ablated, ablated == byte-identical baseline, replay-twice identical); T1 evidence-consumption wiring is honestly blocked (raw flux samples cannot map to the flare-event gate contract without inventing semantics) and serves as a negative control."

## 3. Sprint 03 validation results

| Check | Result |
|-------|--------|
| Three states produced (wired / ablated / baseline), pure LF, 60 events each | ✓ |
| `--state baseline` / `--emit-hashes` reproduce committed Sprint 01 baseline byte-for-byte | ✓ |
| **T2 wired ≠ ablated** | ✓ 30/30 (= the set of T2 events with ≥1 strictly-pre-cutoff obs; full list in PROOF-SUMMARY §4) |
| **T2 ablated == baseline** (§6.10 robust: git cat-file LF blob + JSON.parse canonical) | ✓ 60/60 (T1 30/30, T2 30/30) |
| **Replay-twice byte-identical** within wired and within ablated | ✓ |
| **T1 wired == ablated == baseline** (negative control) | ✓ 30/30; 0 evidence consumed |
| **Cycle-002 frozen-corpus regression** (== committed manifest anchor; non-mutating) | ✓ 15/15 (T1/T2/T4 × 5) |
| **No walltime / random** (stub-to-throw + comment-stripped grep) | ✓ |
| **No parameter / gate / source drift** (constants + frozen anchors + git diff --quiet) | ✓ |
| **Claim-grep** (24 files swept) | ✓ CLEAN, 0 violations |
| Sprint 03 suite | ✓ 18/18 |
| Sprint 02 suite | ✓ 19/19 |
| Existing suite (`npm test`) | ✓ 296/296 (provenance-only cycle-002 side-effect restored) |

**No scoring, no Brier, no skill metric, no baseline delta, no held-out
evaluation.** No rung banked.

## 4. Proof artifact inventory

- `grimoires/loa/a2a/cycle-004/proof/wired-hashes.json`
- `grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json`
- `grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json` (Sprint 01; unchanged, `538cba01…`)
- `grimoires/loa/a2a/cycle-004/proof/PROOF-SUMMARY.md`
- `tests/`: `replay-t2-determinism-wired-test.js`, `replay-t2-wired-vs-ablated-test.js`,
  `replay-t2-ablated-equals-baseline-test.js`, `replay-t1-negative-control-test.js`,
  `cycle-002-frozen-corpus-regression-test.js`, `no-walltime-no-random-test.js`,
  `no-param-diff-test.js`, `claim-grep-gate-test.js`
- `scripts/corona-backtest-cycle-004-evidence-wiring.js` (extended to three states)
- `grimoires/loa/a2a/cycle-004/sprint-03/implementation-report.md`, `CLOSEOUT.md` (this file)

## 5. Invariant status

| Invariant | Value | Status |
|-----------|-------|--------|
| I1 — cycle-001 entrypoint sha256 | `17f6380b…1730f1` | ✓ unchanged |
| `package.json` version / dependencies | `0.2.0` / `{}` | ✓ unchanged |
| cycle-003 corpus_hash | `7b6c5b48…d5003` | ✓ unchanged |
| Sprint 01 baseline fixture blob | `538cba01…86d491` | ✓ unchanged |
| `src/theatres/flare-gate.js` / `geomag-gate.js` | `377725ec…` / `466ad282…` | ✓ frozen |
| `src/rlmf/certificates.js` (RLMF cert `0.1.0`) | `eeef486c…` | ✓ frozen |
| `t1-replay.js` (deriveEvidenceT1 untouched) | `9c46c8ad…` | ✓ frozen |

## 6. Forbidden-path audit

Working tree (post `git restore` of npm-test provenance side-effect): only the
authorized Sprint 03 surfaces — the extended harness (M), the two proof JSONs, the
proof summary, the eight tests, and the two sprint-03 process docs. **No** edit to
any gate, replay producer (other than calling them), `corpus-loader.js`,
`t2-replay.js`, `t1-replay.js`, `deriveEvidenceT1`, `certificates.js`,
`scripts/corona-backtest.js`, `scripts/corona-backtest-cycle-002.js`,
`package.json`, `.gitattributes`, README, BUTTERFREEZONE, root grimoire docs, any
cycle-001/002/003 corpus or manifest, or the cycle-003 held-out seal.

## 7. Hard-stop status

**No hard stop triggered** (HS-4 / HS-6 / HS-7 / HS-8 / HS-9 / HS-10 all clear).
No ablated≠baseline; no wired==ablated-for-all; no T1 divergence; no replay
non-determinism; cycle-002 regression proven without frozen-artifact mutation; no
walltime/random; no param/formula drift; no forbidden artifact touched; no T1
wiring/flux mapping; no scoring/Brier/baseline-delta/held-out/T4-fetch/rung-banking.

## 8. No commit / push / merge

This sprint performed **no** git commit, push, or merge. `main` / `origin/main`
remain at `ccd6eea9…`; `cycle-004` / `origin/cycle-004` remain at `2c83bc66…`. The
sprint branch `cycle-004-s03-proof-closeout` holds the uncommitted authorized
changes, awaiting `/review-sprint sprint-03` and explicit operator approval before
any commit.

## 9. No tag / release / version bump

No tag created, no release cut, no version bump. `package.json` stays `0.2.0`.
**Cycle-004 banks no new rung.** Cycle-002's historical ceiling — **CORONA
demonstrated T4 runtime sensitivity only** — remains unchanged.

## 10. Cycle-closeout carry-forward (documented here; NOT performed this sprint)

The final cycle-004 closeout (after Sprint 03 review/audit + operator approval)
will need to update durable docs and record forward carries. **Sprint 03 does NOT
perform any of these** — it records them only. The agent does **not** have blanket
permission to mutate broad NOTES, root docs, Obsidian durable docs, README,
BUTTERFREEZONE, or prior-cycle docs unless explicitly authorized later.

**Doc updates the final closeout should make (when authorized):**
- Update the appropriate **NOTES / Obsidian durable docs** to record that cycle-004
  wired and tested deterministic T2 evidence consumption, confirmed T1 blocked
  (negative control), and **banked no rung** (T4-only runtime-sensitivity ceiling
  preserved, package `0.2.0`).
- Record future-cycle carry-forwards (below) in the durable carry-forward ledger.

**Likely future-cycle carry-forwards:**
1. **T1 remains blocked** unless a future, separately-gated cycle adds a native
   `xray_flux` evidence type to the flare gate, **or** builds a pre-cutoff
   flare-*event* corpus. Raw `xray_flux_observations[]` cannot map to the
   `solar_flare`-event gate contract without inventing semantics (forbidden).
2. **T4 raw-proton-flux unblock remains deferred** to a separate, operator-gated
   cycle (out of cycle-004 scope; no T4 records in the cycle-003 corpus).
3. **Optional cleanup (non-blocking):** consider replacing the `_`-prefixed helper
   (`_deriveKpPreCutoffObservations`) imported from `corpus-loader.js` into the
   production `t2-replay.js` with a clean, non-underscore named export. Cosmetic;
   no behavior change; deferrable.
4. **Optional line-ending hardening (out of scope unless separately authorized):**
   pinning the proof JSON line endings via `.gitattributes`
   (`grimoires/loa/a2a/cycle-004/proof/*.json eol=lf` or `-text`). Not required —
   the §6.10 robust comparison already resolves the risk on the durable LF blob.
   Must not be introduced as scope creep.
5. **Implementation-discovered note:** the harness's `runtime_revision` constant is
   `cycle-004-s01-baseline` for all three states **by necessity** (it is part of the
   hashed trajectory; changing it would break the baseline reproduction and the T1
   negative control). A future cycle that re-captures a baseline should keep this
   coupling explicit.

## 11. Next required command

`/review-sprint sprint-03`
