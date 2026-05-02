/**
 * scripts/corona-backtest/reporting/runtime-uplift-summary.js
 *
 * Writes cycle-002-run-N/runtime-uplift-summary.md — runtime-uplift composite
 * over T1 + T2 + T4 ONLY per CHARTER §4.1 operator amendment 1.
 *
 * Sprint 03 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/PRD.md §10.4 (two-summary discipline)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §4 (two-summary reporting architecture)
 *   - operator instruction: "write runtime-uplift-summary.md for T1 + T2 + T4 only"
 *
 * The runtime-uplift composite is the ONLY summary that may underwrite
 * Rung 1+ closeout claims. T3 [external-model] and T5 [quality-of-behavior]
 * are intentionally excluded — they belong to the diagnostic-summary.md.
 *
 * Posture tags per operator instruction:
 *   T1 [runtime-binary]
 *   T2 [runtime-binary]
 *   T4 [runtime-bucket]
 *
 * Honest-framing language (binding):
 *   - Cycle-002 is a measurement-seam cycle. Not a parameter-refit cycle.
 *   - T4 is the clean owned-uplift theatre.
 *   - T1/T2 are runtime-wired but prior-only on the current cycle-001
 *     corpus shape (no pre-cutoff time-series) — disclosed verbatim.
 *   - No "calibration-improved", "predictive uplift demonstrated",
 *     "L2 publish-ready" claims.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const RUNTIME_UPLIFT_THEATRES = Object.freeze(['T1', 'T2', 'T4']);

const POSTURE_TAGS = Object.freeze({
  T1: '[runtime-binary]',
  T2: '[runtime-binary]',
  T4: '[runtime-bucket]',
});

function formatNumber(n, digits = 4) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return n.toFixed(digits);
}

function formatPercent(n) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return `${(n * 100).toFixed(1)}%`;
}

function rowForTheatre(theatre, aggregate) {
  const a = aggregate ?? {};
  const tag = POSTURE_TAGS[theatre];
  const n = a.n_events ?? 0;
  switch (theatre) {
    case 'T1':
      return `| T1 ${tag} | binary Brier = ${formatNumber(a.brier, 4)} | ${n} | t1_binary_brier_cycle002 |`;
    case 'T2': {
      const excluded = a.n_events_excluded_no_kp ?? 0;
      return `| T2 ${tag} | binary Brier = ${formatNumber(a.brier, 4)} (excl no-Kp: ${excluded}) | ${n} | t2_binary_brier_cycle002 |`;
    }
    case 'T4':
      return `| T4 ${tag} | bucket Brier = ${formatNumber(a.brier, 4)} | ${n} | t4_bucket_brier_runtime_wired_cycle002 |`;
    default:
      return `| ${theatre} | n/a | n/a | n/a |`;
  }
}

/**
 * Write runtime-uplift-summary.md.
 *
 * @param {object} args
 * @param {Record<string, object>} args.aggregates - { T1: {...}, T2: {...}, T4: {...} } (T3/T5 ignored)
 * @param {object} args.meta
 * @param {string} args.meta.runId
 * @param {string} args.meta.corpusHash
 * @param {string} args.meta.cycleOneScriptHash
 * @param {string} args.meta.replayScriptHash
 * @param {string} args.meta.codeRevision
 * @param {string} args.meta.outputDir
 * @returns {string} absolute path written
 */
export function writeRuntimeUpliftSummary({ aggregates, meta }) {
  const dir = meta.outputDir;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const lines = [
    `# Runtime-Uplift Composite — ${meta.runId} (CORONA cycle-002)`,
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Cycle**: cycle-002 (measurement-seam cycle; NOT a parameter-refit, L2-publish, or release-hygiene cycle)`,
    `**Run ID**: ${meta.runId}`,
    `**Corpus hash**: ${meta.corpusHash}`,
    `**Cycle-001 script_hash (cross-reference)**: ${meta.cycleOneScriptHash}`,
    `**replay_script_hash**: ${meta.replayScriptHash}`,
    `**Code revision**: ${meta.codeRevision}`,
    '',
    '## Composite scope',
    '',
    'This composite covers T1 + T2 + T4 ONLY per CHARTER §4.1 operator amendment 1.',
    'T3 `[external-model]` and T5 `[quality-of-behavior]` are tracked separately in',
    '`diagnostic-summary.md`; they do NOT contribute to the runtime-uplift composite.',
    '',
    '## Per-theatre rows',
    '',
    '| Theatre | Primary metric | n_events | Scoring path |',
    '|---------|----------------|----------|--------------|',
    rowForTheatre('T1', aggregates.T1),
    rowForTheatre('T2', aggregates.T2),
    rowForTheatre('T4', aggregates.T4),
    '',
    '## Honest framing (binding cycle-level)',
    '',
    '- **T4 `[runtime-bucket]`** is the clean owned-uplift theatre — runtime',
    '  proton-cascade.js produces `bucket_array_5` trajectories that drive scoring',
    '  (per SDD §3.2). The Sprint 02 milestone-1 binding gate showed the runtime',
    '  trajectory differs measurably from `UNIFORM_PRIOR`.',
    '- **T1 `[runtime-binary]`** and **T2 `[runtime-binary]`** are runtime-wired but',
    '  prior-only on the current cycle-001 corpus shape: cycle-001 T1/T2 corpus events',
    '  lack pre-cutoff time-series evidence (no GOES X-ray series for T1; no per-3hr',
    '  Kp series for T2). `replay_T1_event` / `replay_T2_event` invoke `createX` once',
    '  and never call `processX`; `current_position_at_cutoff` equals the runtime',
    '  `base_rate` constant. T1/T2 cannot earn Rung 3 (calibration-improved) on the',
    '  cycle-001 corpus shape — this is corpus-shape-foreclosed, NOT a Sprint 03',
    '  bug. Source: cycle-002 sprint-02/reviewer.md M2 Executive Summary lines 456–464.',
    '- This composite anchors **Baseline B** at Sprint 03 close at cycle-001 runtime',
    '  parameter values (no refit). Cross-regime comparison of Baseline A',
    '  (cycle-001 uniform-prior 6-bucket) against Baseline B (cycle-002 runtime',
    '  binary/bucket) as "uplift" is forbidden per CHARTER §8.2.',
    '- This composite is NOT evidence of "calibration-improved", "predictive uplift',
    '  demonstrated", or "L2 publish-ready". Those are higher-rung claims gated on',
    '  Sprints 05 / 06 evidence per CHARTER §10.',
    '',
    '## Provenance binding',
    '',
    '- `replay_script_hash` covers the cycle-002 trajectory-driving file set per',
    '  SDD §6.2. Cycle-001 `script_hash = sha256(scripts/corona-backtest.js)` is',
    '  insufficient on its own — it does not cover the replay seam dependencies',
    '  that drive cycle-002 trajectory output.',
    '- Cycle-001 manifest (`grimoires/loa/calibration/corona/calibration-manifest.json`)',
    '  is immutable; cycle-002 writes a separate additive manifest at',
    '  `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`.',
    '',
  ];

  const path = resolve(dir, 'runtime-uplift-summary.md');
  writeFileSync(path, lines.join('\n'), 'utf8');
  return path;
}
