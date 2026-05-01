#!/usr/bin/env node
/**
 * scripts/corona-backtest.js
 *
 * Top-level orchestrator for the CORONA offline backtest harness.
 *
 * Sprint 3 entrypoint per SDD §6.2.
 *
 * Reads the primary corpus, dispatches each theatre to its independent
 * scoring module, writes per-theatre run-N/T<id>-report.md plus a
 * run-N/summary.md, and emits run-N/corpus_hash.txt + script_hash.txt.
 *
 * Env contract (SDD §6.2):
 *   CORONA_OUTPUT_DIR=run-N        (default run-1)
 *   NASA_API_KEY=<key>             (only consulted for live ingestor calls;
 *                                   Run 1 reads the committed corpus and
 *                                   does NOT call DONKI at all)
 *   CORONA_CORPUS_DIR=<path>       (default grimoires/loa/calibration/corona/corpus/)
 *   CORONA_THEATRES=T1,T2,...      (filter; default all 5)
 *
 * Exit codes:
 *   0 - success
 *   1 - corpus load failure (any rejected events)
 *   2 - ingestor failure (network/auth) — Run 1 should never hit this path
 *   3 - scoring assertion failure
 *
 * Zero runtime dependencies. Only node:* + native fetch + node:crypto.
 */

import process from 'node:process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';

import {
  THEATRES,
  CORPUS_SUBDIRS,
  resolveOutputDir,
  resolveCorpusDir,
  resolveTheatreFilter,
  REPO_ROOT,
} from './corona-backtest/config.js';
import { loadCorpus } from './corona-backtest/ingestors/corpus-loader.js';
import { scoreCorpusT1, verdictT1 } from './corona-backtest/scoring/t1-bucket-brier.js';
import { scoreCorpusT2, verdictT2 } from './corona-backtest/scoring/t2-bucket-brier.js';
import { scoreCorpusT3, verdictT3 } from './corona-backtest/scoring/t3-timing-error.js';
import { scoreCorpusT4, verdictT4 } from './corona-backtest/scoring/t4-bucket-brier.js';
import { scoreCorpusT5, verdictT5 } from './corona-backtest/scoring/t5-quality-of-behavior.js';
import { writePerTheatreReport } from './corona-backtest/reporting/write-report.js';
import { writeSummaryReport } from './corona-backtest/reporting/write-summary.js';
import { computeCorpusHash, computeScriptHash } from './corona-backtest/reporting/hash-utils.js';

const SCORERS = {
  T1: { score: scoreCorpusT1, verdict: verdictT1 },
  T2: { score: scoreCorpusT2, verdict: verdictT2 },
  T3: { score: scoreCorpusT3, verdict: verdictT3 },
  T4: { score: scoreCorpusT4, verdict: verdictT4 },
  T5: { score: scoreCorpusT5, verdict: verdictT5 },
};

function gitRev() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function parseArgs(argv) {
  const out = { theatres: null, outputDir: null, corpusDir: null, json: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--json') out.json = true;
    else if (a === '--theatres' && i + 1 < argv.length) out.theatres = argv[++i];
    else if (a === '--output' && i + 1 < argv.length) out.outputDir = argv[++i];
    else if (a === '--corpus' && i + 1 < argv.length) out.corpusDir = argv[++i];
    else if (a.startsWith('--theatres=')) out.theatres = a.slice('--theatres='.length);
    else if (a.startsWith('--output=')) out.outputDir = a.slice('--output='.length);
    else if (a.startsWith('--corpus=')) out.corpusDir = a.slice('--corpus='.length);
  }
  return out;
}

function helpText() {
  return [
    'corona-backtest.js — CORONA offline calibration backtest',
    '',
    'Usage: node scripts/corona-backtest.js [flags]',
    '',
    'Flags:',
    '  --output <dir>       Output directory under grimoires/loa/calibration/corona/ (default run-1)',
    '  --corpus <dir>       Corpus root (default grimoires/loa/calibration/corona/corpus/)',
    '  --theatres T1,T2,... Filter to a subset (default all five)',
    '  --json               Emit machine-readable JSON summary on stdout',
    '  --help               Show this help',
    '',
    'Environment:',
    '  CORONA_OUTPUT_DIR  same as --output',
    '  CORONA_CORPUS_DIR  same as --corpus',
    '  CORONA_THEATRES    same as --theatres',
    '',
    'Sprint 3 (corona-d4u) Run 1 baseline produces run-1/ certificates.',
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(helpText());
    return 0;
  }

  // Resolve all paths up-front so failures are immediate + explicit.
  const corpusDir = resolveCorpusDir(args.corpusDir);
  const outputDir = resolveOutputDir(args.outputDir);
  const theatreFilter = resolveTheatreFilter(args.theatres);
  const runId = relative(resolve(outputDir, '..'), outputDir);

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // Corpus load (corpus-loader handles §3.7 schema validation).
  const { events, errors, stats } = loadCorpus(corpusDir, { theatres: theatreFilter });
  if (errors.length > 0) {
    console.error('corona-backtest: corpus load reported issues:');
    for (const e of errors) console.error(`  - ${e}`);
  }
  const totalRejected = Object.values(stats).reduce((s, v) => s + v.rejected, 0);
  if (totalRejected > 0) {
    if (!args.json) console.error('corona-backtest: corpus load rejected events; halting per Sprint 3 hard constraint (no scoring-layer filtering).');
    return 1;
  }

  // Hash + revision metadata.
  const corpusHashRes = computeCorpusHash(corpusDir);
  const scriptHash = computeScriptHash();
  const codeRevision = gitRev();

  writeFileSync(resolve(outputDir, 'corpus_hash.txt'), corpusHashRes.hex + '\n', 'utf8');
  writeFileSync(resolve(outputDir, 'script_hash.txt'), scriptHash + '\n', 'utf8');

  // Score each theatre with its independent module + verdict check.
  const aggregates = {};
  const verdicts = {};
  for (const theatre of theatreFilter) {
    const { score, verdict } = SCORERS[theatre];
    try {
      aggregates[theatre] = score(events[theatre]);
      verdicts[theatre] = verdict(aggregates[theatre]);
    } catch (err) {
      console.error(`corona-backtest: scoring assertion failure for ${theatre}: ${err.message ?? err}`);
      return 3;
    }
    const corpusFile = resolve(corpusDir, CORPUS_SUBDIRS[theatre]);
    writePerTheatreReport(theatre, aggregates[theatre], verdicts[theatre], {
      runId,
      corpusHash: corpusHashRes.hex,
      scriptHash,
      codeRevision,
      corpusFile: relative(REPO_ROOT, corpusFile).replace(/\\/g, '/'),
      outputDir,
    });
  }

  writeSummaryReport(aggregates, verdicts, {
    runId,
    corpusHash: corpusHashRes.hex,
    scriptHash,
    codeRevision,
    outputDir,
    n_corpus_loaded_per_theatre: stats,
    corpus_load_errors: errors,
  });

  const summary = {
    run_id: runId,
    output_dir: relative(REPO_ROOT, outputDir).replace(/\\/g, '/'),
    corpus_hash: corpusHashRes.hex,
    script_hash: scriptHash,
    code_revision: codeRevision,
    theatres: theatreFilter,
    aggregates: Object.fromEntries(theatreFilter.map((t) => {
      const a = aggregates[t];
      // Strip per_event from the JSON summary — it's in run-N/per-event/
      const { per_event, ...rest } = a;
      return [t, rest];
    })),
    verdicts,
    composite_verdict: Object.values(verdicts).reduce((worst, v) => {
      const order = { pass: 0, marginal: 1, fail: 2 };
      return (order[v] ?? 2) > (order[worst] ?? 0) ? v : worst;
    }, 'pass'),
    corpus_load_stats: stats,
    corpus_load_errors: errors,
  };

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`corona-backtest: ${runId} composite_verdict=${summary.composite_verdict}`);
    for (const t of theatreFilter) {
      const a = aggregates[t];
      const v = verdicts[t];
      const primary = t === 'T3' ? `MAE=${a.mae_hours?.toFixed?.(2) ?? 'n/a'}h, ±6h=${(a.within_6h_hit_rate * 100).toFixed(1)}%`
        : t === 'T5' ? `FP=${(a.fp_rate * 100).toFixed(1)}%, p50=${a.stale_feed_p50_seconds?.toFixed?.(1)}s, sw=${(a.satellite_switch_handled_rate * 100).toFixed(1)}%`
          : `Brier=${a.brier?.toFixed?.(4)}`;
      console.log(`  ${t}: ${primary}, n=${a.n_events ?? 0}, verdict=${v}`);
    }
    console.log(`  output: ${relative(REPO_ROOT, outputDir).replace(/\\/g, '/')}`);
  }
  return 0;
}

const isMain = process.argv[1] && process.argv[1].endsWith('corona-backtest.js');
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`corona-backtest: ${err.message ?? err}`);
      console.error(err.stack ?? '');
      process.exit(3);
    },
  );
}
