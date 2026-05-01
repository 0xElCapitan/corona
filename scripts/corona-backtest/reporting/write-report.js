/**
 * scripts/corona-backtest/reporting/write-report.js
 *
 * Emits per-theatre run-N/T<id>-report.md per SDD §5.2 + protocol §5.
 *
 * Sprint 3 (corona-2ox) deliverable. The report is a markdown document
 * with a fixed-format header, per-event table (theatre-specific
 * columns), aggregate scores, and a verdict against §6 thresholds.
 *
 * Per-event field shapes follow protocol §5:
 *   T1: flare_class_predicted, flare_class_observed, bucket_predicted,
 *       bucket_observed, brier_score
 *   T2: kp_swpc_predicted, kp_gfz_observed, kp_swpc_observed,
 *       bucket_predicted, bucket_observed, brier_score
 *   T3: t_predicted, t_observed, error_hours, within_6h, glancing_blow_flag,
 *       z_score, wsa_enlil_null_flag
 *   T4: s_event_count_predicted_distribution, s_event_count_observed,
 *       bucket_predicted, bucket_observed, brier_score, qualifying_events[]
 *   T5: signal_count, false_positive_count, stale_feed_events[],
 *       switches[], hit_rate_diagnostic_count
 *
 * Reports also include per-event JSON dumps under run-N/per-event/
 * for downstream tooling (Sprint 5 regression gate).
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { THRESHOLDS } from '../config.js';

function formatNumber(n, digits = 4) {
  if (n == null) return 'null';
  if (typeof n !== 'number') return String(n);
  if (!Number.isFinite(n)) return String(n);
  return n.toFixed(digits);
}

function formatPercent(n) {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return `${(n * 100).toFixed(1)}%`;
}

function header(theatre, runId, corpusHash, scriptHash, codeRevision) {
  return [
    `# ${theatre} — Run ${runId} Report`,
    '',
    `**Run ID**: ${runId}`,
    `**Generated**: ${new Date().toISOString()}`,
    `**Corpus hash**: ${corpusHash}`,
    `**Script hash**: ${scriptHash}`,
    `**Code revision**: ${codeRevision}`,
    '',
  ].join('\n');
}

function inputsBlock(theatre, corpusFile, codeUnderTest, baselineNote) {
  const lines = [
    '## Inputs',
    `- Corpus file: ${corpusFile}`,
    `- Code under test: ${codeUnderTest}`,
  ];
  if (baselineNote) lines.push(`- Baseline model: ${baselineNote}`);
  lines.push('');
  return lines.join('\n');
}

function verdictBlock(theatre, verdict, aggregate) {
  const t = THRESHOLDS[theatre];
  const lines = [
    '## Pass/marginal/fail verdict',
    '',
    `**Verdict**: \`${verdict}\``,
    '',
    '### Threshold reference (calibration-protocol.md §6)',
    '',
    JSON.stringify(t, null, 2).split('\n').map((l) => '    ' + l).join('\n'),
    '',
    '### Aggregate metric values',
    '',
  ];
  for (const [k, v] of Object.entries(aggregate)) {
    if (k === 'per_event') continue;
    if (k === 'predicted_distribution_used') {
      lines.push(`- ${k}: [${v.map((p) => formatNumber(p, 4)).join(', ')}]`);
      continue;
    }
    if (Array.isArray(v)) {
      lines.push(`- ${k}: [${v.map((x) => formatNumber(x, 4)).join(', ')}]`);
      continue;
    }
    if (typeof v === 'number') {
      lines.push(`- ${k}: ${formatNumber(v, 6)}`);
      continue;
    }
    lines.push(`- ${k}: ${JSON.stringify(v)}`);
  }
  lines.push('');
  return lines.join('\n');
}

// Per-event tables — one per theatre.

function tableT1(perEvent) {
  if (perEvent.length === 0) {
    return '## Per-event results\n\n_No events scored._\n';
  }
  const lines = [
    '## Per-event results',
    '',
    '| event_id | flare_class_predicted | flare_class_observed | bucket_predicted | bucket_observed | brier_score |',
    '|----------|------------------------|----------------------|-------------------|------------------|-------------|',
  ];
  for (const r of perEvent) {
    lines.push(`| ${r.event_id} | ${r.flare_class_predicted} | ${r.flare_class_observed} | ${r.bucket_predicted} | ${r.bucket_observed} | ${formatNumber(r.brier_score, 4)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function tableT2(perEvent) {
  if (perEvent.length === 0) {
    return '## Per-event results\n\n_No events scored (after GFZ-lag exclusion per §3.6)._\n';
  }
  const lines = [
    '## Per-event results',
    '',
    '| event_id | kp_swpc_predicted | kp_gfz_observed | kp_swpc_observed | bucket_predicted | bucket_observed | brier_score |',
    '|----------|-------------------|-----------------|-------------------|-------------------|------------------|-------------|',
  ];
  for (const r of perEvent) {
    lines.push(`| ${r.event_id} | ${r.kp_swpc_predicted} | ${formatNumber(r.kp_gfz_observed, 2)} | ${formatNumber(r.kp_swpc_observed, 2)} | ${r.bucket_predicted} | ${r.bucket_observed} | ${formatNumber(r.brier_score, 4)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function tableT3(perEvent) {
  if (perEvent.length === 0) {
    return '## Per-event results\n\n_No events scored._\n';
  }
  const lines = [
    '## Per-event results',
    '',
    '| event_id | t_predicted | t_observed | error_hours | within_6h | glancing_blow_flag | z_score | sigma_source |',
    '|----------|-------------|------------|-------------|-----------|---------------------|---------|--------------|',
  ];
  for (const r of perEvent) {
    lines.push(`| ${r.event_id} | ${r.t_predicted} | ${r.t_observed} | ${formatNumber(r.error_hours, 2)} | ${r.within_6h ? 'YES' : 'no'} | ${r.glancing_blow_flag ? 'YES' : 'no'} | ${formatNumber(r.z_score, 3)} | ${r.sigma_source} |`);
  }
  lines.push('');
  // Per Round 2 review C7 + C8: explicitly document the sigma source
  // policy and the glancing_blow null semantics in the per-event report.
  lines.push('**z_score sigma source**: `corpus_value` when `wsa_enlil_sigma_hours` is non-null in the corpus event; `placeholder_14h_per_round_2_C7` when null (14h is the midpoint of the BFZ-cited 10–18h literature range; Sprint 4 / `corona-2zs` will refine via primary-literature priors). z_score is supplementary diagnostic only — NOT in the pass/marginal/fail composite per §4.3.3.');
  lines.push('');
  lines.push('**glancing_blow_within_12h_hit_rate semantics** (Round 2 review C8): `null` in the aggregate means *no glancing-blow events in scored corpus*, NOT 0%. A numeric value is the ratio of glancing-blow events that hit within ±12h of WSA-Enlil predicted arrival.');
  lines.push('');
  return lines.join('\n');
}

function tableT4(perEvent) {
  if (perEvent.length === 0) {
    return '## Per-event results\n\n_No events scored._\n';
  }
  const lines = [
    '## Per-event results',
    '',
    '| event_id | s_event_count_observed | bucket_predicted | bucket_observed | brier_score | window_override |',
    '|----------|------------------------|-------------------|-------------------|-------------|------------------|',
  ];
  for (const r of perEvent) {
    lines.push(`| ${r.event_id} | ${r.s_event_count_observed} | ${r.bucket_predicted} | ${r.bucket_observed} | ${formatNumber(r.brier_score, 4)} | ${r.window_override ? 'YES' : 'no'} |`);
  }
  lines.push('');
  // Document the per-event qualifying-events list for transparency.
  lines.push('### Qualifying events per corpus event');
  lines.push('');
  for (const r of perEvent) {
    lines.push(`- **${r.event_id}** (${r.qualifying_events.length} events):`);
    for (const q of r.qualifying_events) {
      lines.push(`  - ${q.time} — ${formatNumber(q.peak_pfu, 1)} pfu (${q.energy_channel}, satellite=${q.satellite ?? 'n/a'})`);
    }
    if (r.annotation_warning) {
      lines.push(`  - ⚠ Annotation warning: ${r.annotation_warning}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function tableT5(perEvent) {
  if (perEvent.length === 0) {
    return '## Per-event results\n\n_No events scored._\n';
  }
  const lines = [
    '## Per-event results',
    '',
    '| event_id | window | signal_count | false_positive_count | stale_feed_count | switch_count | bulletin_hits |',
    '|----------|--------|--------------|----------------------|-------------------|---------------|----------------|',
  ];
  for (const r of perEvent) {
    const window = `${r.detection_window_start} → ${r.detection_window_end}`;
    lines.push(`| ${r.event_id} | ${window} | ${r.signal_count} | ${r.false_positive_count} | ${r.stale_feed_count} | ${r.switch_count} | ${r.hit_rate_diagnostic_count}/${r.bulletin_count} |`);
  }
  lines.push('');
  // Per-event detail blocks for the four arrays and the diagnostic.
  lines.push('### Per-event detail');
  lines.push('');
  for (const r of perEvent) {
    lines.push(`#### ${r.event_id}`);
    lines.push('');
    if (r.signals.length > 0) {
      lines.push('**Divergence signals**:');
      for (const sig of r.signals) {
        lines.push(`- ${sig.signal_time} → ${sig.signal_resolution_time ?? 'unresolved'}; corpus_fp_label=${sig.corpus_fp_label}; computed_false_positive=${sig.computed_false_positive} (${sig.classification_reason})`);
      }
    }
    if (r.stale_feed_events.length > 0) {
      lines.push('**Stale-feed events**:');
      for (const s of r.stale_feed_events) {
        lines.push(`- onset=${s.actual_onset_time}, detect=${s.detection_time}, latency=${formatNumber(s.latency_seconds, 1)}s, satellite=${s.satellite ?? 'n/a'}`);
      }
    }
    if (r.switches.length > 0) {
      lines.push('**Satellite-switch events**:');
      for (const sw of r.switches) {
        lines.push(`- ${sw.switch_time}: ${sw.from} → ${sw.to} (${sw.reason ?? 'n/a'}), handled=${sw.handled} (${sw.handling_note})`);
      }
    }
    if (r.bulletin_hits.length > 0) {
      lines.push('**Bulletin diagnostics**:');
      for (const b of r.bulletin_hits) {
        lines.push(`- ${b.bulletin_id ?? '(no id)'} (${b.classification ?? 'no class'}): hit=${b.hit}${b.hit_signal_time ? ' at ' + b.hit_signal_time : ''}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

const TABLE_BY_THEATRE = {
  T1: tableT1,
  T2: tableT2,
  T3: tableT3,
  T4: tableT4,
  T5: tableT5,
};

const CODE_UNDER_TEST = {
  T1: 'src/theatres/flare-gate.js, src/processor/uncertainty.js',
  T2: 'src/theatres/geomag-gate.js, src/processor/uncertainty.js',
  T3: 'src/theatres/cme-arrival.js (forecast: NASA DONKI WSA-Enlil)',
  T4: 'src/theatres/proton-cascade.js',
  T5: 'src/theatres/solar-wind-divergence.js',
};

const NOTES_BY_THEATRE = {
  T1: 'Run 1 baseline uses uniform-prior over 6 T1 buckets. Sprint 5 will refit by injecting runtime flare-gate.js predictions. Brier and bucket-calibration numbers reflect the no-model floor.',
  T2: 'Run 1 baseline uses uniform-prior over 6 G-scale buckets. Sprint 5 will refit by injecting runtime geomag-gate.js predictions. GFZ-lag exclusion (§3.6) applies — events with `kp_gfz_observed === null` are excluded from the regression-tier Brier (n_events_excluded_gfz_lag in aggregate).',
  T3: 'Prediction comes from corpus-supplied `wsa_enlil_predicted_arrival_time` (NASA DONKI WSA-Enlil ensemble). T3 settlement = observed L1 shock signature. CORONA wraps WSA-Enlil with uncertainty pricing; Sprint 3 measures WSA-Enlil accuracy directly. Round 2 review C7 (14h sigma placeholder for null-sigma events) and C8 (`null` glancing-blow hit rate semantics) are documented above.',
  T4: 'Run 1 baseline uses uniform-prior over the 5 T4 buckets pinned at Sprint 2 freeze (calibration-protocol.md §4.4.2). Sprint 5 will refit by injecting runtime proton-cascade.js predictions (Wheatland prior). The 72-hour prediction window is enforced per §4.4.0; non-default windows surface as `window_override: YES` in the per-event table.',
  T5: 'T5 has no external ground truth — settlement is internal (DSCOVR-ACE Bz volatility + sustained-streak detection). The metrics here are quality-of-behavior: FP rate against 60-min corroboration window, stale-feed p50/p95 latency, satellite-switch handled rate (with 10-min post-quiet check), plus a hit-rate diagnostic against annotation_bulletin_refs (NOT in pass/marginal/fail composite per §4.5.2).',
};

/**
 * Write a per-theatre run-N/T<id>-report.md.
 *
 * @param {string} theatre - 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
 * @param {object} aggregate - output of scoreCorpusT<id>
 * @param {string} verdict - 'pass' | 'marginal' | 'fail'
 * @param {object} meta - { runId, corpusHash, scriptHash, codeRevision, corpusFile, outputDir }
 */
export function writePerTheatreReport(theatre, aggregate, verdict, meta) {
  const dir = meta.outputDir;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const perEventDir = resolve(dir, 'per-event');
  if (!existsSync(perEventDir)) mkdirSync(perEventDir, { recursive: true });

  const tableFn = TABLE_BY_THEATRE[theatre];
  if (!tableFn) throw new Error(`writePerTheatreReport: unknown theatre ${theatre}`);

  const baselineNote = aggregate.baseline_model
    ? `\`${aggregate.baseline_model}\` (Run 1 floor — Sprint 5 will refit)`
    : null;

  const sections = [
    header(theatre, meta.runId, meta.corpusHash, meta.scriptHash, meta.codeRevision),
    inputsBlock(theatre, meta.corpusFile, CODE_UNDER_TEST[theatre], baselineNote),
    tableFn(aggregate.per_event ?? []),
    verdictBlock(theatre, verdict, aggregate),
    `## Notes\n\n${NOTES_BY_THEATRE[theatre]}\n`,
  ];

  const path = resolve(dir, `${theatre}-report.md`);
  writeFileSync(path, sections.join('\n'), 'utf8');

  // Also dump per-event JSON for downstream tooling (Sprint 5 gate).
  for (const r of (aggregate.per_event ?? [])) {
    const safeId = String(r.event_id ?? 'unknown').replace(/[^A-Za-z0-9._-]/g, '_');
    const jsonPath = resolve(perEventDir, `${theatre}-${safeId}.json`);
    writeFileSync(jsonPath, JSON.stringify(r, null, 2), 'utf8');
  }
  return path;
}
