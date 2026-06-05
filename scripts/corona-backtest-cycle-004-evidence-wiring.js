#!/usr/bin/env node
/**
 * scripts/corona-backtest-cycle-004-evidence-wiring.js
 *
 * CORONA cycle-004 — T2 evidence-consumption wiring proof harness.
 *
 * Sprint 01 deliverable (no-scoring skeleton) per:
 *   - grimoires/loa/a2a/cycle-004/CYCLE-004-SPRINT-PLAN.md §4 (Sprint 01)
 *   - grimoires/loa/a2a/cycle-004/SDD.md §9 (entry point & proof harness)
 *   - grimoires/loa/a2a/cycle-004/PRD.md §6 (NOT a scoring/evaluation cycle)
 *
 * WHAT SPRINT 01 DOES
 *   This is the load-bearing BASELINE capture. It loads the cycle-003 corpus,
 *   dispatches each T1/T2 event through the *unmodified* replay producers
 *   (replay_T1_event / replay_T2_event), and emits the per-event SHA-256
 *   trajectory hashes as deterministic JSON. The hashes captured here are the
 *   immutable pre-change reference fixture that Sprint 03 will assert the
 *   ablated (wireEvidence:false) run reproduces byte-for-byte.
 *
 * WHAT SPRINT 01 EXPLICITLY DOES NOT DO (binding — SPRINT-PLAN §4.4 / SDD §14)
 *   - No scoring. No Brier. No skill metric. No baseline delta. No held-out
 *     evaluation. No cross-regime comparison.
 *   - No T2 wiring. `wireEvidence` is NOT passed to any replay function and
 *     does not appear in this file. The replay producers are called exactly
 *     as the cycle-002 entrypoint calls them: replayFn(event, ctx).
 *   - No T1 edit / no flux→solar_flare mapping (T1 stays a negative control).
 *   - No T4 fetch / no external data / no internet.
 *   - Does NOT import or invoke scripts/corona-backtest.js (cycle-001, byte-
 *     frozen entrypoint, invariant I1) and does NOT write cycle-001/cycle-002
 *     run output directories (frozen-output-dir guard below).
 *
 * DETERMINISM
 *   Output carries NO wall-clock timestamps, NO git revision, and only the
 *   repo-relative corpus path — so two runs are byte-identical. Trajectory
 *   hashes are themselves deterministic (injected clock + canonical JSON +
 *   SHA-256 in the replay seam). Events are sorted by (theatre, event_id).
 *
 * FORWARD-LOOKING (filled in later sprints, NOT implemented here)
 *   Sprint 02 wires the opt-in `wireEvidence` path into replay_T2_event;
 *   Sprint 03 fills this harness to emit the three proof states
 *   (WIRED / ABLATED / BASELINE). Sprint 01 emits the BASELINE only.
 *
 * Usage:
 *   node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes \
 *     > grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json
 *
 * Exit codes:
 *   0 - success
 *   2 - usage error (unknown flag / unsupported theatre)
 *   3 - corpus load or replay failure
 *   4 - refused to write into a frozen cycle-001/cycle-002 output directory
 *
 * Zero new runtime dependencies (only intra-repo modules imported).
 */

import process from 'node:process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, sep } from 'node:path';

import { REPO_ROOT, CALIBRATION_DIR } from './corona-backtest/config.js';
import { loadCorpusWithCutoff } from './corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from './corona-backtest/replay/context.js';
import { replay_T1_event } from './corona-backtest/replay/t1-replay.js';
import { replay_T2_event } from './corona-backtest/replay/t2-replay.js';

// Default corpus = the cycle-003 corpus tree (SDD §9.1). Read-only input.
const DEFAULT_CORPUS_DIR = resolve(CALIBRATION_DIR, 'corpus-cycle-003');

// This harness handles T1 (negative control) + T2 only. T4 is out of scope
// (PRD §6) and the cycle-003 corpus carries 0 T4 records.
const SUPPORTED_THEATRES = Object.freeze(['T1', 'T2']);
const DEFAULT_THEATRES = SUPPORTED_THEATRES;

const RUNTIME_REVISION = 'cycle-004-s01-baseline';

// Frozen prior-cycle run output directories under CALIBRATION_DIR. This
// REUSES + EXTENDS the FROZEN_CYCLE001_OUTPUT_DIRS guard from
// scripts/corona-backtest-cycle-002.js so that BOTH cycle-001 and cycle-002
// run output dirs are refused if this harness is ever asked to write a file
// into one of them. Sprint 01 itself emits to stdout and never writes here.
const FROZEN_CYCLE001_OUTPUT_DIRS = Object.freeze(new Set(['run-1', 'run-2', 'run-3-final']));
const FROZEN_CYCLE002_OUTPUT_DIRS = Object.freeze(new Set(['cycle-002-run-1', 'cycle-002-run-2', 'cycle-002-run-3']));
const FROZEN_OUTPUT_DIRS = Object.freeze(
  new Set([...FROZEN_CYCLE001_OUTPUT_DIRS, ...FROZEN_CYCLE002_OUTPUT_DIRS]),
);

// Unmodified replay producers — dispatched exactly as the cycle-002 entrypoint
// dispatches them: replayFn(event, ctx). NO options bag; NO wireEvidence.
const REPLAY_FNS = Object.freeze({ T1: replay_T1_event, T2: replay_T2_event });

const KNOWN_FLAGS = Object.freeze(
  new Set(['--emit-hashes', '--corpus', '--theatres', '--out-file', '--help', '-h']),
);

function parseArgs(argv) {
  const out = {
    emitHashes: false,
    corpusDir: null,
    theatres: null,
    outFile: null,
    help: false,
    error: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--emit-hashes') out.emitHashes = true;
    else if (a === '--corpus' && i + 1 < argv.length) out.corpusDir = argv[++i];
    else if (a.startsWith('--corpus=')) out.corpusDir = a.slice('--corpus='.length);
    else if (a === '--theatres' && i + 1 < argv.length) out.theatres = argv[++i];
    else if (a.startsWith('--theatres=')) out.theatres = a.slice('--theatres='.length);
    else if (a === '--out-file' && i + 1 < argv.length) out.outFile = argv[++i];
    else if (a.startsWith('--out-file=')) out.outFile = a.slice('--out-file='.length);
    else if (a.startsWith('-')) {
      const flag = a.includes('=') ? a.slice(0, a.indexOf('=')) : a;
      if (!KNOWN_FLAGS.has(flag)) {
        out.error = `unknown flag "${a}"`;
        return out;
      }
    } else {
      out.error = `unexpected positional argument "${a}"`;
      return out;
    }
  }
  return out;
}

function helpText() {
  return [
    'corona-backtest-cycle-004-evidence-wiring.js — CORONA cycle-004 T2 wiring proof harness',
    '',
    'Sprint 01 mode: emit the pre-change BASELINE trajectory hashes from the',
    'unmodified replay producers (no wiring, no scoring).',
    '',
    'Usage: node scripts/corona-backtest-cycle-004-evidence-wiring.js [--emit-hashes] [flags]',
    '',
    'Flags:',
    '  --emit-hashes        Emit the per-event trajectory-hash table as JSON to stdout',
    '                       (this is also the default action).',
    '  --corpus <dir>       Corpus root (default: grimoires/loa/calibration/corona/corpus-cycle-003).',
    '  --theatres T1,T2     Theatre filter (default + only supported: T1,T2).',
    '  --out-file <path>    Write JSON to <path> instead of stdout. Refuses (exit 4) any path',
    '                       inside a frozen cycle-001/cycle-002 run output dir. Sprint 01 uses',
    '                       stdout redirection into grimoires/loa/a2a/cycle-004/proof/ instead.',
    '  --help, -h           Show this help.',
    '',
    'This harness does NOT import scripts/corona-backtest.js (cycle-001, byte-frozen),',
    'passes NO wireEvidence option, and computes NO scores.',
  ].join('\n');
}

/**
 * Pure dispatch: load the corpus, replay each event through the UNMODIFIED
 * replay producer, and collect per-event trajectory hashes. No scoring; no
 * wireEvidence; no file writes. Exported for in-process verification.
 *
 * @param {object} [args]
 * @param {string} [args.corpusDir]
 * @param {string[]} [args.theatres]
 * @param {string} [args.runtimeRevision]
 * @returns {{records: Array<{theatre:string,event_id:string,trajectory_hash:string}>, errors: string[], stats: object}}
 */
export function dispatchBaselineHashes({
  corpusDir = DEFAULT_CORPUS_DIR,
  theatres = DEFAULT_THEATRES,
  runtimeRevision = RUNTIME_REVISION,
} = {}) {
  for (const t of theatres) {
    if (!REPLAY_FNS[t]) {
      throw new Error(
        `dispatchBaselineHashes: unsupported theatre "${t}" ` +
        `(cycle-004 sprint-01 harness handles ${SUPPORTED_THEATRES.join(',')} only)`,
      );
    }
  }
  const { events, errors, stats } = loadCorpusWithCutoff(corpusDir, { theatres });
  const records = [];
  for (const theatre of theatres) {
    const replayFn = REPLAY_FNS[theatre];
    for (const event of events[theatre] ?? []) {
      const ctx = createReplayContext({
        corpus_event: event,
        theatre_id: theatre,
        runtime_revision: runtimeRevision,
      });
      // Unmodified replay. Exactly replayFn(event, ctx) — no options, no wireEvidence.
      const trajectory = replayFn(event, ctx);
      const hash = trajectory?.meta?.trajectory_hash;
      if (typeof hash !== 'string' || hash.length !== 64 || !/^[0-9a-f]{64}$/.test(hash)) {
        throw new Error(
          `dispatchBaselineHashes: ${theatre}/${event.event_id} produced a non-64-hex ` +
          `trajectory_hash (${hash})`,
        );
      }
      records.push({ theatre, event_id: event.event_id, trajectory_hash: hash });
    }
  }
  // Deterministic sort by (theatre, event_id).
  records.sort((a, b) => {
    if (a.theatre !== b.theatre) return a.theatre < b.theatre ? -1 : 1;
    if (a.event_id !== b.event_id) return a.event_id < b.event_id ? -1 : 1;
    return 0;
  });
  return { records, errors, stats };
}

/**
 * Build the deterministic baseline hash table (metadata + sorted events).
 * Throws on any corpus-load error (a load problem must be surfaced, not
 * silently captured into the fixture).
 */
export function buildBaselineHashTable({ corpusDir = DEFAULT_CORPUS_DIR, theatres = DEFAULT_THEATRES } = {}) {
  const { records, errors } = dispatchBaselineHashes({ corpusDir, theatres });
  if (errors.length > 0) {
    throw new Error(
      `buildBaselineHashTable: corpus load produced ${errors.length} error(s):\n  ` +
      errors.slice(0, 10).join('\n  '),
    );
  }
  const corpusRel = relative(REPO_ROOT, corpusDir).replace(/\\/g, '/');
  return {
    schema: 'corona-cycle-004-baseline-hashes',
    schema_version: '1.0.0',
    description:
      'CORONA cycle-004 sprint-01 pre-change baseline trajectory hashes ' +
      '(unmodified replay; no T2 wiring; no scoring; T1 negative control).',
    harness: 'scripts/corona-backtest-cycle-004-evidence-wiring.js',
    state: 'baseline',
    wire_evidence: false,
    corpus_dir: corpusRel,
    runtime_revision: RUNTIME_REVISION,
    theatres: [...theatres],
    trajectory_hash_algorithm: 'sha256-of-canonical-json',
    event_count: records.length,
    events: records,
  };
}

/**
 * Frozen-output-dir guard (reuse + extend of corona-backtest-cycle-002.js).
 * Returns the matched frozen dir name if the resolved out-file path is inside
 * a frozen cycle-001/cycle-002 run output dir, else null.
 */
export function frozenOutputDirFor(outFilePath) {
  const abs = resolve(outFilePath);
  for (const name of FROZEN_OUTPUT_DIRS) {
    const frozenDir = resolve(CALIBRATION_DIR, name);
    if (abs === frozenDir || abs.startsWith(frozenDir + sep)) return name;
  }
  return null;
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(helpText() + '\n');
    return 0;
  }
  if (args.error) {
    process.stderr.write(`corona-backtest-cycle-004: ${args.error}\n\n${helpText()}\n`);
    return 2;
  }

  let theatres = DEFAULT_THEATRES;
  if (args.theatres) {
    theatres = args.theatres.split(',').map((s) => s.trim()).filter(Boolean);
    for (const t of theatres) {
      if (!SUPPORTED_THEATRES.includes(t)) {
        process.stderr.write(
          `corona-backtest-cycle-004: unsupported theatre "${t}" ` +
          `(supported: ${SUPPORTED_THEATRES.join(',')})\n`,
        );
        return 2;
      }
    }
  }

  const corpusDir = args.corpusDir ? resolve(args.corpusDir) : DEFAULT_CORPUS_DIR;

  let table;
  try {
    table = buildBaselineHashTable({ corpusDir, theatres });
  } catch (err) {
    process.stderr.write(`corona-backtest-cycle-004: ${err.message ?? err}\n`);
    return 3;
  }
  const json = JSON.stringify(table, null, 2) + '\n';

  if (args.outFile) {
    const frozen = frozenOutputDirFor(args.outFile);
    if (frozen) {
      process.stderr.write(
        `corona-backtest-cycle-004: refusing to write into frozen prior-cycle output dir ` +
        `"${frozen}". Use stdout redirection into grimoires/loa/a2a/cycle-004/proof/ instead.\n`,
      );
      return 4;
    }
    const target = resolve(args.outFile);
    const dir = dirname(target);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(target, json, 'utf8');
  } else {
    process.stdout.write(json);
  }
  return 0;
}

const isMain = process.argv[1] && process.argv[1].endsWith('corona-backtest-cycle-004-evidence-wiring.js');
if (isMain) {
  try {
    process.exit(main(process.argv));
  } catch (err) {
    process.stderr.write(`corona-backtest-cycle-004: ${err.message ?? err}\n${err.stack ?? ''}\n`);
    process.exit(3);
  }
}

export {
  main as _main,
  DEFAULT_CORPUS_DIR as _DEFAULT_CORPUS_DIR,
  SUPPORTED_THEATRES as _SUPPORTED_THEATRES,
  RUNTIME_REVISION as _RUNTIME_REVISION,
  FROZEN_CYCLE001_OUTPUT_DIRS as _FROZEN_CYCLE001_OUTPUT_DIRS,
  FROZEN_CYCLE002_OUTPUT_DIRS as _FROZEN_CYCLE002_OUTPUT_DIRS,
  FROZEN_OUTPUT_DIRS as _FROZEN_OUTPUT_DIRS,
};
