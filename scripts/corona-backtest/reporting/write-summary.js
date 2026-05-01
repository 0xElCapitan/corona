/**
 * scripts/corona-backtest/reporting/write-summary.js
 *
 * Emits run-N/summary.md — composite verdict + per-theatre roll-up.
 *
 * Sprint 3 (corona-2ox) deliverable. The summary aggregates the five
 * per-theatre verdicts into a single overall verdict (the WORST per
 * §6.1). The composite verdict is the regression-gate input for Sprint 5.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const VERDICT_ORDER = { pass: 0, marginal: 1, fail: 2 };
const VERDICT_LABELS = { 0: 'pass', 1: 'marginal', 2: 'fail' };

export function compositeVerdict(perTheatreVerdicts) {
  let worst = 0;
  for (const v of Object.values(perTheatreVerdicts)) {
    const idx = VERDICT_ORDER[v] ?? 2;
    if (idx > worst) worst = idx;
  }
  return VERDICT_LABELS[worst];
}

function formatNumber(n, digits = 4) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return n.toFixed(digits);
}

function formatPercent(n) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return `${(n * 100).toFixed(1)}%`;
}

function lineForTheatre(theatre, aggregate, verdict) {
  const a = aggregate ?? {};
  const verdictTag = `\`${verdict ?? 'n/a'}\``;
  switch (theatre) {
    case 'T1': return `| T1 | ${formatNumber(a.brier, 4)} | min cal=${formatNumber(Array.isArray(a.bucket_calibration) ? Math.min(...a.bucket_calibration) : null, 3)} | ${a.n_events ?? 0} | ${verdictTag} |`;
    case 'T2': return `| T2 | ${formatNumber(a.brier, 4)} | conv=${formatNumber(a.gfz_vs_swpc_convergence, 3)} | ${a.n_events ?? 0} (excl GFZ-lag: ${a.n_events_excluded_gfz_lag ?? 0}) | ${verdictTag} |`;
    case 'T3': return `| T3 | MAE=${formatNumber(a.mae_hours, 2)}h | ±6h hit=${formatPercent(a.within_6h_hit_rate)} | ${a.n_events ?? 0} | ${verdictTag} |`;
    case 'T4': return `| T4 | ${formatNumber(a.brier, 4)} | min cal=${formatNumber(Array.isArray(a.bucket_calibration) ? Math.min(...a.bucket_calibration) : null, 3)} | ${a.n_events ?? 0} | ${verdictTag} |`;
    case 'T5': return `| T5 | FP=${formatPercent(a.fp_rate)} | p50=${formatNumber(a.stale_feed_p50_seconds, 1)}s, switch=${formatPercent(a.satellite_switch_handled_rate)} | ${a.n_events ?? 0} | ${verdictTag} |`;
    default: return `| ${theatre} | n/a | n/a | n/a | ${verdictTag} |`;
  }
}

/**
 * Write run-N/summary.md.
 *
 * @param {object} aggregates - { T1: {...}, T2: {...}, ... }
 * @param {object} verdicts - { T1: 'pass' | 'marginal' | 'fail', ... }
 * @param {object} meta - { runId, corpusHash, scriptHash, codeRevision, outputDir, n_corpus_loaded_per_theatre, corpus_load_errors }
 */
export function writeSummaryReport(aggregates, verdicts, meta) {
  const dir = meta.outputDir;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const composite = compositeVerdict(verdicts);

  const lines = [
    `# Run ${meta.runId} Summary — CORONA cycle-001`,
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Corpus hash**: ${meta.corpusHash}`,
    `**Script hash**: ${meta.scriptHash}`,
    `**Code revision**: ${meta.codeRevision}`,
    '',
    `**Composite verdict**: \`${composite}\` (worst-case per §6.1)`,
    '',
    '## Per-theatre roll-up',
    '',
    '| Theatre | Primary metric | Secondary metric | n_events | Verdict |',
    '|---------|----------------|-------------------|----------|---------|',
  ];
  for (const theatre of ['T1', 'T2', 'T3', 'T4', 'T5']) {
    lines.push(lineForTheatre(theatre, aggregates[theatre], verdicts[theatre]));
  }
  lines.push('');

  // Corpus load stats (helpful for the operator's HITL gate review).
  if (meta.n_corpus_loaded_per_theatre) {
    lines.push('## Corpus load stats');
    lines.push('');
    lines.push('| Theatre | Loaded | Rejected |');
    lines.push('|---------|--------|----------|');
    for (const theatre of ['T1', 'T2', 'T3', 'T4', 'T5']) {
      const stat = meta.n_corpus_loaded_per_theatre[theatre] ?? { loaded: 0, rejected: 0 };
      lines.push(`| ${theatre} | ${stat.loaded} | ${stat.rejected} |`);
    }
    lines.push('');
  }

  if (meta.corpus_load_errors && meta.corpus_load_errors.length > 0) {
    lines.push('## Corpus load errors');
    lines.push('');
    for (const err of meta.corpus_load_errors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  lines.push('## Methodology notes');
  lines.push('');
  lines.push('- Run 1 baseline reflects Sprint 3 harness with Sprint 2 frozen protocol. Parameter refit is Sprint 5 / `corona-3fg` — the regression gate compares against this Run 1 baseline once Sprint 5 produces Run 2.');
  lines.push('- T1, T2, T4 use **uniform-prior** baselines for Run 1 (no-model floor). Sprint 5 will refit by injecting runtime flare-gate.js / geomag-gate.js / proton-cascade.js predictions.');
  lines.push('- T3 prediction comes from corpus-supplied `wsa_enlil_predicted_arrival_time`. T3 measures WSA-Enlil accuracy against L1 observation, not CORONA prediction quality.');
  lines.push('- T5 has no external ground truth; metrics are quality-of-behavior (FP rate, stale-feed latency, switch handling).');
  lines.push('- Per-theatre code paths are independent per operator hard constraint #5 (no shared scoring code).');
  lines.push('- Zero-runtime-dependency posture preserved (`node:fs`, `node:path`, `node:url`, `node:crypto`, native `fetch`, `node:test`).');
  lines.push('');

  const path = resolve(dir, 'summary.md');
  writeFileSync(path, lines.join('\n'), 'utf8');
  return path;
}
