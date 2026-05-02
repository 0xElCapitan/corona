#!/usr/bin/env node
/**
 * scripts/corona-backtest-cycle-002.js
 *
 * Cycle-002 runtime-replay backtest entrypoint.
 *
 * Sprint 03 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/PRD.md §4 / §8 (in-scope, theatre posture)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §3.1 / §3.1a / §3.1b (two-entrypoint architecture)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §4 (two-summary reporting)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §5 (additive cycle-002 manifest)
 *   - grimoires/loa/a2a/cycle-002/SDD.md §6 (replay_script_hash file-set)
 *   - operator ratification (Sprint 03 instruction): cycle-001 entrypoint
 *     scripts/corona-backtest.js stays byte-frozen; this is the NEW separate
 *     cycle-002 entrypoint; runtime-uplift composite covers T1+T2+T4 only;
 *     T3/T5 stay diagnostic-only.
 *
 * Hard architectural invariants enforced here:
 *   - Cycle-001 entrypoint scripts/corona-backtest.js is NOT imported, NOT
 *     invoked, and NOT mutated. Its sha256 stays 17f6380b…1730f1 by
 *     construction (file is never touched).
 *   - Cycle-001 calibration manifest at calibration-manifest.json is NOT
 *     written here. Cycle-002 writes to cycle-002/runtime-replay-manifest.json.
 *   - Cycle-001 run outputs run-1/, run-2/, run-3-final/ are NEVER written
 *     here — guarded explicitly via output-name vetting below.
 *
 * Per-theatre dispatch (operator binding):
 *   T1 → replay_T1_event → binary_scalar trajectory → t1_binary_brier_cycle002
 *   T2 → replay_T2_event → binary_scalar trajectory → t2_binary_brier_cycle002
 *   T4 → replay_T4_event → bucket_array_5 trajectory → t4_bucket_brier_runtime_wired_cycle002
 *   T3 → existing scoreCorpusT3 (corpus-anchored external; diagnostic-only)
 *   T5 → existing scoreCorpusT5 (quality-of-behavior; diagnostic-only)
 *
 * Two-summary discipline (CHARTER §4.1):
 *   - runtime-uplift-summary.md — T1 + T2 + T4 only.
 *   - diagnostic-summary.md     — all five theatres, every section/table tagged [diagnostic].
 *
 * Exit codes:
 *   0 - success
 *   1 - corpus load failure (any rejected events)
 *   3 - scoring assertion failure (replay throw, scorer throw, hash failure)
 *   4 - refused to write into cycle-001 output directory
 *
 * Zero new runtime dependencies.
 */

import process from 'node:process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';

import {
  CORPUS_SUBDIRS,
  resolveCorpusDir,
  resolveTheatreFilter,
  REPO_ROOT,
  CALIBRATION_DIR,
} from './corona-backtest/config.js';
import { loadCorpusWithCutoff } from './corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from './corona-backtest/replay/context.js';
import { replay_T1_event } from './corona-backtest/replay/t1-replay.js';
import { replay_T2_event } from './corona-backtest/replay/t2-replay.js';
import { replay_T4_event } from './corona-backtest/replay/t4-replay.js';
import { scoreCorpusT1Binary } from './corona-backtest/scoring/t1-binary-brier.js';
import { scoreCorpusT2Binary } from './corona-backtest/scoring/t2-binary-brier.js';
import { scoreEventT4 } from './corona-backtest/scoring/t4-bucket-brier.js';
import { scoreCorpusT3 } from './corona-backtest/scoring/t3-timing-error.js';
import { scoreCorpusT5 } from './corona-backtest/scoring/t5-quality-of-behavior.js';
import { computeCorpusHash, computeScriptHash } from './corona-backtest/reporting/hash-utils.js';
import { writeRuntimeUpliftSummary } from './corona-backtest/reporting/runtime-uplift-summary.js';
import { writeDiagnosticSummary } from './corona-backtest/reporting/diagnostic-summary.js';
import {
  computeReplayScriptHash,
  buildCycle002Manifest,
} from './corona-backtest/manifest/runtime-replay-manifest.js';

const DEFAULT_OUTPUT = 'cycle-002-run-1';
const RUNTIME_REVISION_DEFAULT = 'cycle-002-runtime-replay';
const CYCLE_002_MANIFEST_DIR = resolve(CALIBRATION_DIR, 'cycle-002');
const CYCLE_002_MANIFEST_PATH = resolve(CYCLE_002_MANIFEST_DIR, 'runtime-replay-manifest.json');

// Cycle-001 frozen output dirs that this entrypoint must never write into.
const FROZEN_CYCLE001_OUTPUT_DIRS = Object.freeze(new Set(['run-1', 'run-2', 'run-3-final']));

function gitRev() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function parseArgs(argv) {
  const out = { theatres: null, outputName: null, corpusDir: null, json: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--json') out.json = true;
    else if (a === '--theatres' && i + 1 < argv.length) out.theatres = argv[++i];
    else if (a === '--output' && i + 1 < argv.length) out.outputName = argv[++i];
    else if (a === '--corpus' && i + 1 < argv.length) out.corpusDir = argv[++i];
    else if (a.startsWith('--theatres=')) out.theatres = a.slice('--theatres='.length);
    else if (a.startsWith('--output=')) out.outputName = a.slice('--output='.length);
    else if (a.startsWith('--corpus=')) out.corpusDir = a.slice('--corpus='.length);
  }
  return out;
}

function helpText() {
  return [
    'corona-backtest-cycle-002.js — CORONA cycle-002 runtime-replay backtest',
    '',
    'Usage: node scripts/corona-backtest-cycle-002.js [flags]',
    '',
    'Flags:',
    '  --output <dir>       Output dir under grimoires/loa/calibration/corona/ (default cycle-002-run-1)',
    '  --corpus <dir>       Corpus root (default grimoires/loa/calibration/corona/corpus/)',
    '  --theatres T1,T2,... Filter to a subset (default all five)',
    '  --json               Emit JSON summary on stdout',
    '  --help               Show this help',
    '',
    'Environment:',
    '  CORONA_CYCLE002_OUTPUT_DIR  same as --output',
    '  CORONA_CORPUS_DIR           same as --corpus',
    '  CORONA_THEATRES             same as --theatres',
    '',
    'This is the cycle-002 entrypoint per SDD §3.1 two-entrypoint architecture.',
    'The cycle-001 entrypoint scripts/corona-backtest.js is byte-frozen and is',
    'NOT invoked from this script.',
  ].join('\n');
}

/**
 * Per-event T4 scoring + aggregation.
 *
 * scoreCorpusT4 in scripts/corona-backtest/scoring/t4-bucket-brier.js applies
 * a SINGLE predictedDistribution across ALL events (cycle-001 uniform-prior
 * behaviour). Cycle-002 needs per-event distributions because each event has
 * its OWN runtime trajectory. We loop scoreEventT4 with each trajectory's
 * current_position_at_cutoff and aggregate manually. The unchanged
 * scoreEventT4 export is the binding contract — we are NOT modifying
 * t4-bucket-brier.js (Sprint 03 hard constraint: legacy bucket scorers frozen).
 */
function scoreCorpusT4PerEventDispatch(eventTrajectoryPairs) {
  if (eventTrajectoryPairs.length === 0) {
    return {
      brier: 0,
      n_events: 0,
      per_event: [],
      scoring_path: 't4_bucket_brier_runtime_wired_cycle002',
    };
  }
  const perEvent = eventTrajectoryPairs.map(({ event, trajectory }) => {
    const result = scoreEventT4(event, trajectory.current_position_at_cutoff);
    return { ...result, trajectory_hash: trajectory.meta?.trajectory_hash ?? null };
  });
  const brier = perEvent.reduce((s, r) => s + r.brier_score, 0) / perEvent.length;
  return {
    brier,
    n_events: perEvent.length,
    per_event: perEvent,
    scoring_path: 't4_bucket_brier_runtime_wired_cycle002',
  };
}

/**
 * Pure dispatch — returns { aggregates, trajectoryHashes, errors } without
 * writing files. Used by the smoke test for in-process verification.
 *
 * @param {object} args
 * @param {string} [args.corpusDir]
 * @param {string[]} [args.theatres]
 * @param {string} [args.runtimeRevision]
 * @returns {{aggregates: Record<string, object>, trajectoryHashes: Record<string, Record<string, string>>, errors: string[]}}
 */
export function dispatchCycle002Replay({
  corpusDir,
  theatres,
  runtimeRevision = RUNTIME_REVISION_DEFAULT,
} = {}) {
  const filter = theatres ?? ['T1', 'T2', 'T3', 'T4', 'T5'];
  const { events, errors } = loadCorpusWithCutoff(corpusDir, { theatres: filter });
  const aggregates = {};
  const trajectoryHashes = { T1: {}, T2: {}, T4: {} };

  for (const theatre of filter) {
    if (theatre === 'T1' || theatre === 'T2' || theatre === 'T4') {
      const replayFn = theatre === 'T1' ? replay_T1_event : theatre === 'T2' ? replay_T2_event : replay_T4_event;
      const pairs = [];
      for (const event of events[theatre] ?? []) {
        const ctx = createReplayContext({
          corpus_event: event,
          theatre_id: theatre,
          runtime_revision: runtimeRevision,
        });
        const trajectory = replayFn(event, ctx);
        pairs.push({ event, trajectory });
        trajectoryHashes[theatre][event.event_id] = trajectory.meta.trajectory_hash;
      }
      if (theatre === 'T1') {
        aggregates.T1 = scoreCorpusT1Binary(pairs);
      } else if (theatre === 'T2') {
        aggregates.T2 = scoreCorpusT2Binary(pairs);
      } else {
        aggregates.T4 = scoreCorpusT4PerEventDispatch(pairs);
      }
    } else if (theatre === 'T3') {
      aggregates.T3 = scoreCorpusT3(events.T3 ?? []);
    } else if (theatre === 'T5') {
      aggregates.T5 = scoreCorpusT5(events.T5 ?? []);
    }
  }

  return { aggregates, trajectoryHashes, errors };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(helpText());
    return 0;
  }

  const corpusDir = resolveCorpusDir(args.corpusDir);
  const theatreFilter = resolveTheatreFilter(args.theatres);
  const outputName = args.outputName || process.env.CORONA_CYCLE002_OUTPUT_DIR || DEFAULT_OUTPUT;

  if (FROZEN_CYCLE001_OUTPUT_DIRS.has(outputName)) {
    console.error(
      `corona-backtest-cycle-002: refusing to write into frozen cycle-001 output dir "${outputName}". ` +
      `Use cycle-002-run-N or another dedicated directory.`,
    );
    return 4;
  }
  const outputDir = resolve(CALIBRATION_DIR, outputName);
  const runId = outputName;

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  if (!existsSync(CYCLE_002_MANIFEST_DIR)) mkdirSync(CYCLE_002_MANIFEST_DIR, { recursive: true });

  const { events, errors, stats } = loadCorpusWithCutoff(corpusDir, { theatres: theatreFilter });
  if (errors.length > 0) {
    for (const e of errors) console.error(`  - ${e}`);
  }
  const totalRejected = Object.values(stats).reduce((s, v) => s + v.rejected, 0);
  if (totalRejected > 0) {
    if (!args.json) console.error('corona-backtest-cycle-002: corpus load rejected events; halting.');
    return 1;
  }

  const corpusHashRes = computeCorpusHash(corpusDir);
  const cycleOneScriptHash = computeScriptHash();
  const replayScriptHashRes = computeReplayScriptHash(REPO_ROOT);
  const codeRevision = gitRev();

  writeFileSync(resolve(outputDir, 'corpus_hash.txt'), corpusHashRes.hex + '\n', 'utf8');
  writeFileSync(resolve(outputDir, 'replay_script_hash.txt'), replayScriptHashRes.hex + '\n', 'utf8');
  writeFileSync(resolve(outputDir, 'cycle_001_script_hash.txt'), cycleOneScriptHash + '\n', 'utf8');

  const aggregates = {};
  const trajectoryHashes = { T1: {}, T2: {}, T4: {} };

  for (const theatre of theatreFilter) {
    try {
      if (theatre === 'T1' || theatre === 'T2' || theatre === 'T4') {
        const replayFn = theatre === 'T1' ? replay_T1_event : theatre === 'T2' ? replay_T2_event : replay_T4_event;
        const pairs = [];
        for (const event of events[theatre]) {
          const ctx = createReplayContext({
            corpus_event: event,
            theatre_id: theatre,
            runtime_revision: RUNTIME_REVISION_DEFAULT,
          });
          const trajectory = replayFn(event, ctx);
          pairs.push({ event, trajectory });
          trajectoryHashes[theatre][event.event_id] = trajectory.meta.trajectory_hash;
        }
        if (theatre === 'T1') {
          aggregates.T1 = scoreCorpusT1Binary(pairs);
        } else if (theatre === 'T2') {
          aggregates.T2 = scoreCorpusT2Binary(pairs);
        } else {
          aggregates.T4 = scoreCorpusT4PerEventDispatch(pairs);
        }
      } else if (theatre === 'T3') {
        aggregates.T3 = scoreCorpusT3(events.T3);
      } else if (theatre === 'T5') {
        aggregates.T5 = scoreCorpusT5(events.T5);
      }
    } catch (err) {
      console.error(`corona-backtest-cycle-002: scoring failure for ${theatre}: ${err.message ?? err}`);
      console.error(err.stack ?? '');
      return 3;
    }
  }

  const summaryMeta = {
    runId,
    corpusHash: corpusHashRes.hex,
    cycleOneScriptHash,
    replayScriptHash: replayScriptHashRes.hex,
    codeRevision,
    outputDir,
  };
  writeRuntimeUpliftSummary({ aggregates, meta: summaryMeta });
  writeDiagnosticSummary({ aggregates, meta: summaryMeta });

  const manifest = buildCycle002Manifest({
    runId,
    corpusHash: corpusHashRes.hex,
    scriptHash: cycleOneScriptHash,
    replayScriptHash: replayScriptHashRes,
    codeRevision,
    aggregates,
    trajectoryHashes,
  });
  writeFileSync(CYCLE_002_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const summaryJson = {
    run_id: runId,
    output_dir: relative(REPO_ROOT, outputDir).replace(/\\/g, '/'),
    corpus_hash: corpusHashRes.hex,
    cycle_001_script_hash: cycleOneScriptHash,
    replay_script_hash: replayScriptHashRes.hex,
    replay_script_hash_file_count: replayScriptHashRes.file_count,
    code_revision: codeRevision,
    theatres: theatreFilter,
    aggregates: Object.fromEntries(theatreFilter.map((t) => {
      const a = aggregates[t] ?? {};
      const { per_event, ...rest } = a;
      return [t, rest];
    })),
    cycle_002_manifest_path: relative(REPO_ROOT, CYCLE_002_MANIFEST_PATH).replace(/\\/g, '/'),
  };

  if (args.json) {
    console.log(JSON.stringify(summaryJson, null, 2));
  } else {
    console.log(`corona-backtest-cycle-002: ${runId} runtime-replay run complete`);
    console.log(`  corpus_hash:           ${corpusHashRes.hex}`);
    console.log(`  cycle_001_script_hash: ${cycleOneScriptHash}`);
    console.log(`  replay_script_hash:    ${replayScriptHashRes.hex} (covers ${replayScriptHashRes.file_count} files)`);
    for (const t of theatreFilter) {
      const a = aggregates[t] ?? {};
      const brier = typeof a.brier === 'number' ? a.brier.toFixed(4) : 'n/a';
      console.log(`  ${t}: brier=${brier} n=${a.n_events ?? 0}`);
    }
    console.log(`  output:   ${relative(REPO_ROOT, outputDir).replace(/\\/g, '/')}`);
    console.log(`  manifest: ${relative(REPO_ROOT, CYCLE_002_MANIFEST_PATH).replace(/\\/g, '/')}`);
  }
  return 0;
}

const isMain = process.argv[1] && process.argv[1].endsWith('corona-backtest-cycle-002.js');
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`corona-backtest-cycle-002: ${err.message ?? err}`);
      console.error(err.stack ?? '');
      process.exit(3);
    },
  );
}

export {
  main as _main,
  scoreCorpusT4PerEventDispatch as _scoreCorpusT4PerEventDispatch,
  CYCLE_002_MANIFEST_PATH as _CYCLE_002_MANIFEST_PATH,
  CYCLE_002_MANIFEST_DIR as _CYCLE_002_MANIFEST_DIR,
  FROZEN_CYCLE001_OUTPUT_DIRS as _FROZEN_CYCLE001_OUTPUT_DIRS,
};
