/**
 * scripts/corona-backtest/reporting/diagnostic-summary.js
 *
 * Writes cycle-002-run-N/diagnostic-summary.md — full-picture diagnostic
 * summary over ALL FIVE theatres (T1, T2, T3, T4, T5).
 *
 * Sprint 03 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/PRD.md §10.4 (two-summary discipline)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §4 (two-summary reporting architecture)
 *   - CHARTER §4.1 (operator amendment 1)
 *   - operator instruction: "every diagnostic-summary section/table must be
 *     tagged [diagnostic]" + posture tags must be explicit per theatre.
 *
 * Two-summary discipline: this summary is the FULL-PICTURE diagnostic. Its
 * numerics may NOT underwrite calibration-improved or runtime-uplift claims
 * (those belong to runtime-uplift-summary.md only). The `[diagnostic]` tag
 * appears in every section title and table caption to prevent slippage.
 *
 * Posture tags per operator:
 *   T1 [runtime-binary]
 *   T2 [runtime-binary]
 *   T3 [external-model]
 *   T4 [runtime-bucket]
 *   T5 [quality-of-behavior]
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const DIAGNOSTIC_THEATRES = Object.freeze(['T1', 'T2', 'T3', 'T4', 'T5']);

const POSTURE_TAGS = Object.freeze({
  T1: '[runtime-binary]',
  T2: '[runtime-binary]',
  T3: '[external-model]',
  T4: '[runtime-bucket]',
  T5: '[quality-of-behavior]',
});

const RUNTIME_UPLIFT_MEMBERSHIP = Object.freeze({
  T1: 'YES',
  T2: 'YES',
  T3: 'NO (external-model — not CORONA-owned)',
  T4: 'YES (primary)',
  T5: 'NO (quality-of-behavior — settlement is internal)',
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
      return `| T1 ${tag} | binary Brier = ${formatNumber(a.brier, 4)} | scoring path = t1_binary_brier_cycle002 | ${n} |`;
    case 'T2': {
      const excluded = a.n_events_excluded_no_kp ?? 0;
      return `| T2 ${tag} | binary Brier = ${formatNumber(a.brier, 4)} | scoring path = t2_binary_brier_cycle002 (excl no-Kp: ${excluded}) | ${n} |`;
    }
    case 'T3':
      return `| T3 ${tag} | MAE = ${formatNumber(a.mae_hours, 2)}h | within ±6h hit-rate = ${formatPercent(a.within_6h_hit_rate)} | ${n} |`;
    case 'T4':
      return `| T4 ${tag} | bucket Brier = ${formatNumber(a.brier, 4)} | scoring path = t4_bucket_brier_runtime_wired_cycle002 | ${n} |`;
    case 'T5':
      return `| T5 ${tag} | FP rate = ${formatPercent(a.fp_rate)} | p50 stale-feed = ${formatNumber(a.stale_feed_p50_seconds, 1)}s, switch handled = ${formatPercent(a.satellite_switch_handled_rate)} | ${n} |`;
    default:
      return `| ${theatre} | n/a | n/a | n/a |`;
  }
}

/**
 * Write diagnostic-summary.md.
 *
 * Every section title and table caption is tagged `[diagnostic]` per
 * operator instruction.
 */
export function writeDiagnosticSummary({ aggregates, meta }) {
  const dir = meta.outputDir;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const lines = [
    `# Diagnostic Summary — ${meta.runId} (CORONA cycle-002) [diagnostic]`,
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Cycle**: cycle-002 (measurement-seam cycle)`,
    `**Run ID**: ${meta.runId}`,
    `**Corpus hash**: ${meta.corpusHash}`,
    `**Cycle-001 script_hash (cross-reference)**: ${meta.cycleOneScriptHash}`,
    `**replay_script_hash**: ${meta.replayScriptHash}`,
    `**Code revision**: ${meta.codeRevision}`,
    '',
    '## Diagnostic discipline [diagnostic]',
    '',
    'This is the FULL-PICTURE diagnostic summary. Per CHARTER §4.1 operator amendment 1',
    'and SDD §4, every section title and table caption in this document is tagged',
    '`[diagnostic]`. Numerics from this summary may NOT underwrite calibration-improved',
    'or runtime-uplift claims; those claims live exclusively in `runtime-uplift-summary.md`.',
    'The `[diagnostic]` tag is the structural mitigation against laundering T3 / T5',
    'numerics into Rung-1+ closeout language.',
    '',
    '## Per-theatre rows [diagnostic]',
    '',
    '| Theatre | Primary metric [diagnostic] | Secondary metric [diagnostic] | n_events |',
    '|---------|------------------------------|-------------------------------|----------|',
    rowForTheatre('T1', aggregates.T1),
    rowForTheatre('T2', aggregates.T2),
    rowForTheatre('T3', aggregates.T3),
    rowForTheatre('T4', aggregates.T4),
    rowForTheatre('T5', aggregates.T5),
    '',
    '## Theatre posture (binding) [diagnostic]',
    '',
    '| Theatre | Posture tag | Counts toward runtime-uplift composite? |',
    '|---------|-------------|------------------------------------------|',
    `| T1      | ${POSTURE_TAGS.T1} | ${RUNTIME_UPLIFT_MEMBERSHIP.T1} |`,
    `| T2      | ${POSTURE_TAGS.T2} | ${RUNTIME_UPLIFT_MEMBERSHIP.T2} |`,
    `| T3      | ${POSTURE_TAGS.T3} | ${RUNTIME_UPLIFT_MEMBERSHIP.T3} |`,
    `| T4      | ${POSTURE_TAGS.T4} | ${RUNTIME_UPLIFT_MEMBERSHIP.T4} |`,
    `| T5      | ${POSTURE_TAGS.T5} | ${RUNTIME_UPLIFT_MEMBERSHIP.T5} |`,
    '',
    '## Honest-framing notes [diagnostic]',
    '',
    '- **T1 / T2** trajectories are prior-only on the cycle-001 corpus shape (no',
    '  pre-cutoff time-series). `current_position_at_cutoff` equals runtime',
    '  `base_rate`. Cycle-002 cannot earn calibration-improved on T1/T2 from this',
    '  corpus — corpus-shape-foreclosed per Sprint 02 reviewer.md M2 Executive',
    '  Summary lines 456–464.',
    '- **T3 `[external-model]`**: scoring measures NASA DONKI WSA-Enlil prediction',
    '  quality against the L1 shock observation, NOT a CORONA prediction. CORONA',
    '  does not emit a T3 prediction (Q2 freeze). T3 numerics are diagnostic-only',
    '  and explicitly excluded from the runtime-uplift composite.',
    '- **T4 `[runtime-bucket]`**: clean owned-uplift theatre. Trajectory drives',
    '  scoring; sensitivity-proof target for Sprint 05.',
    '- **T5 `[quality-of-behavior]`**: scoring is settlement (FP rate, p50 stale-feed',
    '  latency, satellite-switch handling, hit-rate-diagnostic). T5 has no external',
    '  probabilistic ground truth and is NOT converted to a probabilistic-uplift',
    '  scoring path (Q3 freeze). Diagnostic-only.',
    '',
    '## Provenance binding [diagnostic]',
    '',
    '- Cycle-001 calibration manifest at',
    '  `grimoires/loa/calibration/corona/calibration-manifest.json` is FROZEN.',
    '  Cycle-002 writes a separate additive manifest at',
    '  `grimoires/loa/calibration/corona/cycle-002/runtime-replay-manifest.json`.',
    '- Cycle-001 `script_hash = sha256(scripts/corona-backtest.js)` is preserved',
    '  byte-identically (verified by tests/cycle-002-entrypoint-test.js, test',
    '  "byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor").',
    '- `replay_script_hash` covers the cycle-002 trajectory-driving file set per',
    '  SDD §6.2. Recomputation from disk is asserted by tests/cycle-002-entrypoint-test.js,',
    '  test "cycle-002 manifest regression: replay_script_hash matches recomputed",',
    '  via verifyReplayScriptHash() in scripts/corona-backtest/manifest/runtime-replay-manifest.js.',
    '  The cycle-001 tests/manifest_regression_test.js is the cycle-001 inline-vs-manifest',
    '  gate and is unrelated to cycle-002 replay_script_hash recomputation.',
    '',
  ];

  const path = resolve(dir, 'diagnostic-summary.md');
  writeFileSync(path, lines.join('\n'), 'utf8');
  return path;
}
