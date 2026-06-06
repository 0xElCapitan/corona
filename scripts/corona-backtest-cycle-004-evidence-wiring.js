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
 * WHAT THIS HARNESS DOES (Sprint 01 baseline capture + Sprint 03 three-state proof)
 *   It loads the cycle-003 corpus, dispatches each T1/T2 event through the
 *   cycle-003-shipped replay producers (replay_T1_event / replay_T2_event), and
 *   emits the per-event SHA-256 trajectory hashes as deterministic JSON. A
 *   `--state` selector chooses which of the three proof states to emit:
 *
 *     baseline → T2 via replay_T2_event(event, ctx)                  (Sprint 01 call convention)
 *     ablated  → T2 via replay_T2_event(event, ctx, {wireEvidence:false})  (default-off path)
 *     wired    → T2 via replay_T2_event(event, ctx, {wireEvidence:true})   (opt-in T2 consumption)
 *
 *   T1 is the NEGATIVE CONTROL in every state: replay_T1_event takes no options
 *   and never consumes evidence, so T1 hashes are identical across all three
 *   states (and equal the committed Sprint 01 baseline). The Sprint 01 BASELINE
 *   fixture (proof/baseline-hashes.json) is the immutable pre-change reference;
 *   `--state baseline` reproduces it byte-for-byte and `--state ablated`
 *   reproduces its per-event hashes by construction (default-off ≡ no-options).
 *
 * WHAT THIS HARNESS EXPLICITLY DOES NOT DO (binding — SPRINT-PLAN §6.3 / SDD §14)
 *   - No scoring. No Brier. No skill metric. No baseline delta. No held-out
 *     evaluation. No cross-regime comparison. Per-event hash tables only.
 *   - No T1 edit / no flux→solar_flare mapping (T1 stays a negative control).
 *     `wireEvidence` is passed ONLY to replay_T2_event, NEVER to replay_T1_event.
 *   - No T4 fetch / no external data / no internet.
 *   - No gate / runtime-parameter / threshold / base_rate / sigma / lambda /
 *     formula change. The replay producers and gates are called, never modified.
 *   - Does NOT import or invoke scripts/corona-backtest.js (cycle-001, byte-
 *     frozen entrypoint, invariant I1) and does NOT write cycle-001/cycle-002
 *     run output directories (frozen-output-dir guard below).
 *
 * DETERMINISM
 *   Output carries NO wall-clock timestamps, NO git revision, and only the
 *   repo-relative corpus path — so two runs of the same state are byte-identical.
 *   Trajectory hashes are themselves deterministic (injected clock + canonical
 *   JSON + SHA-256 in the replay seam). Events are sorted by (theatre, event_id).
 *   NO Date.now(); NO Math.random(). `runtime_revision` is hash-affecting
 *   (meta.runtime_revision is inside the SHA-256'd trajectory — replay/hashes.js),
 *   so all three states share the single RUNTIME_REVISION constant; otherwise the
 *   T1 negative control and the ablated==baseline identity would not hold.
 *
 * Usage:
 *   node scripts/corona-backtest-cycle-004-evidence-wiring.js --state wired   \
 *     > grimoires/loa/a2a/cycle-004/proof/wired-hashes.json
 *   node scripts/corona-backtest-cycle-004-evidence-wiring.js --state ablated \
 *     > grimoires/loa/a2a/cycle-004/proof/ablated-hashes.json
 *   node scripts/corona-backtest-cycle-004-evidence-wiring.js --emit-hashes   \
 *     > grimoires/loa/a2a/cycle-004/proof/baseline-hashes.json   # --state baseline (default)
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

// `runtime_revision` is embedded in meta.runtime_revision and is therefore part
// of the SHA-256'd trajectory (replay/hashes.js). This value is FROZEN by the
// committed Sprint 01 baseline fixture: changing it would change every T1 and T2
// hash and break both the T1 negative control and the ablated==baseline identity.
// All three proof states share this single constant.
const RUNTIME_REVISION = 'cycle-004-s01-baseline';

// Cycle-004 Sprint 03 — the three deterministic proof states (SDD §9.2). Only
// T2's replay call differs by state; T1 is the negative control in every state.
const SUPPORTED_STATES = Object.freeze(['baseline', 'wired', 'ablated']);
const DEFAULT_STATE = 'baseline';

// Per-state output metadata. The `baseline` entry is byte-identical to the
// committed Sprint 01 fixture (proof/baseline-hashes.json) by construction.
// Descriptions are negation-framed (no positive forbidden claim — SDD §15).
const STATE_META = Object.freeze({
  baseline: {
    schema: 'corona-cycle-004-baseline-hashes',
    wire_evidence: false,
    description:
      'CORONA cycle-004 sprint-01 pre-change baseline trajectory hashes ' +
      '(unmodified replay; no T2 wiring; no scoring; T1 negative control).',
  },
  ablated: {
    schema: 'corona-cycle-004-ablated-hashes',
    wire_evidence: false,
    description:
      'CORONA cycle-004 sprint-03 ABLATED trajectory hashes (replay_T2_event ' +
      'wireEvidence:false — the default-off path; per-event hashes content-identical ' +
      'to the sprint-01 baseline by construction; no scoring; T1 negative control).',
  },
  wired: {
    schema: 'corona-cycle-004-wired-hashes',
    wire_evidence: true,
    description:
      'CORONA cycle-004 sprint-03 WIRED trajectory hashes (replay_T2_event ' +
      'wireEvidence:true — opt-in deterministic T2 evidence consumption; per-event ' +
      'hash table only; no scoring and no rung banked; T1 negative control).',
  },
});

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

// Per-state replay dispatch. T1 is the negative control in EVERY state — it is
// always called replay_T1_event(event, ctx) with no options bag and never
// consumes evidence. Only T2's call shape varies by state. The replay producers
// (and the gates they call) are invoked, never modified.
function replayForState(theatre, event, ctx, state) {
  if (theatre === 'T1') return replay_T1_event(event, ctx);
  // theatre === 'T2'
  if (state === 'wired') return replay_T2_event(event, ctx, { wireEvidence: true });
  if (state === 'ablated') return replay_T2_event(event, ctx, { wireEvidence: false });
  return replay_T2_event(event, ctx); // baseline — Sprint 01 call convention (no options)
}

const KNOWN_FLAGS = Object.freeze(
  new Set(['--emit-hashes', '--corpus', '--theatres', '--state', '--out-file', '--help', '-h']),
);

function parseArgs(argv) {
  const out = {
    emitHashes: false,
    corpusDir: null,
    theatres: null,
    state: null,
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
    else if (a === '--state' && i + 1 < argv.length) out.state = argv[++i];
    else if (a.startsWith('--state=')) out.state = a.slice('--state='.length);
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
    'Emit the per-event trajectory-hash table for one of three deterministic proof',
    'states (baseline / wired / ablated). T1 is the negative control in every state.',
    'No scoring; per-event hash tables only.',
    '',
    'Usage: node scripts/corona-backtest-cycle-004-evidence-wiring.js [--state STATE] [flags]',
    '',
    'Flags:',
    '  --emit-hashes        Emit the per-event trajectory-hash table as JSON to stdout',
    '                       (this is also the default action).',
    '  --state STATE        Proof state: baseline (default) | wired | ablated.',
    '                       wired   = replay_T2_event(event, ctx, {wireEvidence:true});',
    '                       ablated = replay_T2_event(event, ctx, {wireEvidence:false});',
    '                       baseline = replay_T2_event(event, ctx) (Sprint 01 convention).',
    '                       T1 is the negative control (no options) in every state.',
    '  --corpus <dir>       Corpus root (default: grimoires/loa/calibration/corona/corpus-cycle-003).',
    '  --theatres T1,T2     Theatre filter (default + only supported: T1,T2).',
    '  --out-file <path>    Write JSON to <path> instead of stdout. Refuses (exit 4) any path',
    '                       inside a frozen cycle-001/cycle-002 run output dir. Sprint 01 uses',
    '                       stdout redirection into grimoires/loa/a2a/cycle-004/proof/ instead.',
    '  --help, -h           Show this help.',
    '',
    'This harness does NOT import scripts/corona-backtest.js (cycle-001, byte-frozen),',
    'passes wireEvidence ONLY to replay_T2_event (never replay_T1_event), and computes NO scores.',
  ].join('\n');
}

/**
 * Pure dispatch: load the corpus, replay each event for the requested proof
 * `state`, and collect per-event trajectory hashes. No scoring; no file writes.
 * Exported for in-process verification.
 *
 * T1 is the negative control in every state (replay_T1_event, no options). Only
 * T2's call shape varies by state (see replayForState). `wireEvidence` is the
 * opt-in cycle-004 Sprint 02 seam; default-off (`baseline`/`ablated`) is
 * byte-identical to the cycle-003-shipped replay by construction.
 *
 * @param {object} [args]
 * @param {string} [args.corpusDir]
 * @param {string[]} [args.theatres]
 * @param {string} [args.runtimeRevision]
 * @param {'baseline'|'wired'|'ablated'} [args.state]
 * @returns {{records: Array<{theatre:string,event_id:string,trajectory_hash:string}>, errors: string[], stats: object}}
 */
export function dispatchHashes({
  corpusDir = DEFAULT_CORPUS_DIR,
  theatres = DEFAULT_THEATRES,
  runtimeRevision = RUNTIME_REVISION,
  state = DEFAULT_STATE,
} = {}) {
  if (!SUPPORTED_STATES.includes(state)) {
    throw new Error(
      `dispatchHashes: unsupported state "${state}" (supported: ${SUPPORTED_STATES.join(',')})`,
    );
  }
  for (const t of theatres) {
    if (!SUPPORTED_THEATRES.includes(t)) {
      throw new Error(
        `dispatchHashes: unsupported theatre "${t}" ` +
        `(cycle-004 harness handles ${SUPPORTED_THEATRES.join(',')} only)`,
      );
    }
  }
  const { events, errors, stats } = loadCorpusWithCutoff(corpusDir, { theatres });
  const records = [];
  for (const theatre of theatres) {
    for (const event of events[theatre] ?? []) {
      const ctx = createReplayContext({
        corpus_event: event,
        theatre_id: theatre,
        runtime_revision: runtimeRevision,
      });
      const trajectory = replayForState(theatre, event, ctx, state);
      const hash = trajectory?.meta?.trajectory_hash;
      if (typeof hash !== 'string' || hash.length !== 64 || !/^[0-9a-f]{64}$/.test(hash)) {
        throw new Error(
          `dispatchHashes: ${theatre}/${event.event_id} produced a non-64-hex ` +
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

// Backward-compatible Sprint 01 name: baseline-state dispatch (no options).
export function dispatchBaselineHashes(args = {}) {
  return dispatchHashes({ ...args, state: 'baseline' });
}

/**
 * Build the deterministic hash table (metadata + sorted events) for one proof
 * state. Throws on any corpus-load error (a load problem must be surfaced, not
 * silently captured into the fixture). The `baseline` state reproduces the
 * committed Sprint 01 fixture byte-for-byte.
 *
 * @param {object} [args]
 * @param {string} [args.corpusDir]
 * @param {string[]} [args.theatres]
 * @param {'baseline'|'wired'|'ablated'} [args.state]
 */
export function buildHashTable({
  corpusDir = DEFAULT_CORPUS_DIR,
  theatres = DEFAULT_THEATRES,
  state = DEFAULT_STATE,
} = {}) {
  if (!SUPPORTED_STATES.includes(state)) {
    throw new Error(
      `buildHashTable: unsupported state "${state}" (supported: ${SUPPORTED_STATES.join(',')})`,
    );
  }
  const { records, errors } = dispatchHashes({ corpusDir, theatres, state });
  if (errors.length > 0) {
    throw new Error(
      `buildHashTable: corpus load produced ${errors.length} error(s):\n  ` +
      errors.slice(0, 10).join('\n  '),
    );
  }
  const meta = STATE_META[state];
  const corpusRel = relative(REPO_ROOT, corpusDir).replace(/\\/g, '/');
  return {
    schema: meta.schema,
    schema_version: '1.0.0',
    description: meta.description,
    harness: 'scripts/corona-backtest-cycle-004-evidence-wiring.js',
    state,
    wire_evidence: meta.wire_evidence,
    corpus_dir: corpusRel,
    runtime_revision: RUNTIME_REVISION,
    theatres: [...theatres],
    trajectory_hash_algorithm: 'sha256-of-canonical-json',
    event_count: records.length,
    events: records,
  };
}

// Backward-compatible Sprint 01 name: baseline-state table.
export function buildBaselineHashTable(args = {}) {
  return buildHashTable({ ...args, state: 'baseline' });
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

  let state = DEFAULT_STATE;
  if (args.state) {
    state = args.state.trim();
    if (!SUPPORTED_STATES.includes(state)) {
      process.stderr.write(
        `corona-backtest-cycle-004: unsupported state "${args.state}" ` +
        `(supported: ${SUPPORTED_STATES.join(',')})\n`,
      );
      return 2;
    }
  }

  const corpusDir = args.corpusDir ? resolve(args.corpusDir) : DEFAULT_CORPUS_DIR;

  let table;
  try {
    table = buildHashTable({ corpusDir, theatres, state });
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
  SUPPORTED_STATES as _SUPPORTED_STATES,
  DEFAULT_STATE as _DEFAULT_STATE,
  STATE_META as _STATE_META,
  RUNTIME_REVISION as _RUNTIME_REVISION,
  FROZEN_CYCLE001_OUTPUT_DIRS as _FROZEN_CYCLE001_OUTPUT_DIRS,
  FROZEN_CYCLE002_OUTPUT_DIRS as _FROZEN_CYCLE002_OUTPUT_DIRS,
  FROZEN_OUTPUT_DIRS as _FROZEN_OUTPUT_DIRS,
};
