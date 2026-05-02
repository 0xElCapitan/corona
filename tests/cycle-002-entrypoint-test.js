/**
 * tests/cycle-002-entrypoint-test.js
 *
 * Sprint 03 binding gates for the cycle-002 runtime-replay entrypoint at
 * scripts/corona-backtest-cycle-002.js. Every test here is non-mutating
 * with respect to cycle-001 frozen artifacts and writes to ephemeral
 * locations only.
 *
 * Coverage map per operator instruction (Sprint 03 Test scope):
 *   1. cycle-001 entrypoint byte-freeze / script_hash preservation.
 *   2. cycle-002 entrypoint smoke (in-process via dispatch helper).
 *   3. runtime replay dispatch for T1 / T2 / T4.
 *   4. T3 / T5 excluded from runtime-uplift composite scoring.
 *   5. Two-summary tagging (runtime-uplift composite + diagnostic [diagnostic]).
 *   6. cycle-002 manifest structural / regression validation.
 *   7. replay_script_hash changes when any covered file changes.
 *   8. T1/T2 base_rate prior-only guard for cycle-001 corpus shape.
 *
 * Cycle-001 invariants asserted as defense-in-depth:
 *   - sha256(scripts/corona-backtest.js) == 17f6380b…1730f1.
 *   - sha256(calibration-manifest.json)  unchanged from Sprint 03 anchor.
 *   - corpus_hash == b1caef3f…11bb1.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

import { loadCorpusWithCutoff, _CUTOFF_DERIVATIONS, _EVIDENCE_DERIVATIONS } from '../scripts/corona-backtest/ingestors/corpus-loader.js';
import { createReplayContext } from '../scripts/corona-backtest/replay/context.js';
import { replay_T1_event } from '../scripts/corona-backtest/replay/t1-replay.js';
import { replay_T2_event } from '../scripts/corona-backtest/replay/t2-replay.js';
import { replay_T4_event } from '../scripts/corona-backtest/replay/t4-replay.js';
import { computeCorpusHash } from '../scripts/corona-backtest/reporting/hash-utils.js';
import {
  REPLAY_SCRIPT_HASH_FILES,
  CYCLE_001_ENTRYPOINT_RELATIVE,
  computeReplayScriptHash,
  buildCycle002Manifest,
  verifyReplayScriptHash,
} from '../scripts/corona-backtest/manifest/runtime-replay-manifest.js';
import {
  RUNTIME_UPLIFT_THEATRES,
  writeRuntimeUpliftSummary,
} from '../scripts/corona-backtest/reporting/runtime-uplift-summary.js';
import {
  DIAGNOSTIC_THEATRES,
  writeDiagnosticSummary,
} from '../scripts/corona-backtest/reporting/diagnostic-summary.js';
import {
  dispatchCycle002Replay,
  _scoreCorpusT4PerEventDispatch,
  _FROZEN_CYCLE001_OUTPUT_DIRS,
} from '../scripts/corona-backtest-cycle-002.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// =====================================================================
// 1. Cycle-001 entrypoint byte-freeze
// =====================================================================

const CYCLE_001_ENTRYPOINT_HASH = '17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1';
const CYCLE_001_CORPUS_HASH = 'b1caef3faa1d046301229825c40e76e6ea23061a288d15ee6c49e78fbef11bb1';
// sha256 of grimoires/loa/calibration/corona/calibration-manifest.json
// captured at Sprint 03 entry. cycle-001 manifest is FROZEN per CHARTER §6 / Q4.
const CYCLE_001_MANIFEST_HASH = 'e53a40d1f880f4743567924d7fa10718dfb5caa740c48e998a344de4f85db34a';

test('byte-freeze: scripts/corona-backtest.js sha256 == cycle-001 anchor', () => {
  const bytes = readFileSync(resolve(REPO_ROOT, 'scripts/corona-backtest.js'));
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, CYCLE_001_ENTRYPOINT_HASH,
    `cycle-001 entrypoint MUST be byte-frozen at ${CYCLE_001_ENTRYPOINT_HASH}; ` +
    `Sprint 03 hard constraint. If this assertion fails, scripts/corona-backtest.js ` +
    `was edited and cycle-001 reproducibility lane is broken.`);
});

test('byte-freeze: cycle-001 calibration-manifest.json sha256 unchanged', () => {
  const path = resolve(REPO_ROOT, 'grimoires/loa/calibration/corona/calibration-manifest.json');
  const bytes = readFileSync(path);
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, CYCLE_001_MANIFEST_HASH,
    `cycle-001 calibration-manifest.json MUST stay frozen (CHARTER §6 / Q4). ` +
    `Cycle-002 writes its own additive manifest at cycle-002/runtime-replay-manifest.json.`);
});

test('byte-freeze: cycle-001 corpus_hash unchanged', () => {
  const corpusDir = resolve(REPO_ROOT, 'grimoires/loa/calibration/corona/corpus');
  const res = computeCorpusHash(corpusDir);
  assert.equal(res.hex, CYCLE_001_CORPUS_HASH,
    `corpus_hash MUST stay ${CYCLE_001_CORPUS_HASH} across cycle-002 (CHARTER §3.4 corpus frozen).`);
});

// =====================================================================
// 2 + 3. Cycle-002 entrypoint smoke + per-theatre dispatch
// =====================================================================

test('cycle-002 dispatch: T1 / T2 / T4 use replay-driven scoring; T3 / T5 use existing scorers', () => {
  const { aggregates, trajectoryHashes, errors } = dispatchCycle002Replay({});
  assert.deepEqual(errors, [], 'no loader errors');

  // T1 / T2 / T4 trajectory-driven aggregates.
  for (const theatre of ['T1', 'T2', 'T4']) {
    const a = aggregates[theatre];
    assert.ok(a, `aggregates.${theatre} must be present`);
    assert.equal(a.n_events, 5, `${theatre}: 5 cycle-001 corpus events scored`);
    assert.ok(typeof a.brier === 'number' && Number.isFinite(a.brier), `${theatre}: brier finite`);
    assert.ok(a.brier >= 0 && a.brier <= 1, `${theatre}: brier in [0,1]`);
    assert.ok(typeof a.scoring_path === 'string' && a.scoring_path.includes('cycle002'),
      `${theatre}: scoring_path tagged cycle002 (got "${a.scoring_path}")`);
    // Trajectory hashes recorded for every event.
    const hashes = trajectoryHashes[theatre];
    const hashEntries = Object.entries(hashes);
    assert.equal(hashEntries.length, 5, `${theatre}: 5 trajectory hashes recorded`);
    for (const [eventId, hex] of hashEntries) {
      assert.ok(typeof hex === 'string' && hex.length === 64,
        `${theatre}/${eventId}: trajectory_hash is 64-hex (got "${hex}")`);
    }
  }
  // T3 / T5: existing scorers, NO trajectory hashes.
  assert.ok(aggregates.T3, 'aggregates.T3 present (corpus-anchored external)');
  assert.ok(aggregates.T5, 'aggregates.T5 present (quality-of-behavior)');
  assert.equal(trajectoryHashes.T3, undefined, 'no T3 trajectory hashes recorded');
  assert.equal(trajectoryHashes.T5, undefined, 'no T5 trajectory hashes recorded');
});

test('cycle-002 dispatch: T4 per-event distributions (NOT one shared distribution)', () => {
  const { aggregates } = dispatchCycle002Replay({ theatres: ['T4'] });
  const perEvent = aggregates.T4.per_event;
  assert.equal(perEvent.length, 5, '5 T4 events');
  // Verify each per_event row carries its OWN predicted distribution from its own trajectory.
  // The Sprint 02 milestone-1 binding gate showed runtime trajectory differs from UNIFORM_PRIOR.
  const distinctDists = new Set(perEvent.map((r) => JSON.stringify(r.s_event_count_predicted_distribution)));
  assert.ok(distinctDists.size >= 2,
    `T4 must consume per-event distributions; got only ${distinctDists.size} distinct distribution(s) ` +
    `across 5 events. If 1, scoring is collapsing to a shared distribution (regression).`);
  // Per-event trajectory hashes recorded.
  for (const r of perEvent) {
    assert.ok(typeof r.trajectory_hash === 'string' && r.trajectory_hash.length === 64,
      `T4/${r.event_id}: trajectory_hash recorded`);
  }
});

test('cycle-002 dispatch: replay-twice byte-identical (Rung 1 binding gate, end-to-end)', () => {
  const r1 = dispatchCycle002Replay({});
  const r2 = dispatchCycle002Replay({});
  for (const theatre of ['T1', 'T2', 'T4']) {
    assert.deepEqual(r1.trajectoryHashes[theatre], r2.trajectoryHashes[theatre],
      `${theatre}: trajectory hashes byte-identical across two dispatches`);
    assert.equal(r1.aggregates[theatre].brier, r2.aggregates[theatre].brier,
      `${theatre}: aggregate Brier identical across two dispatches`);
  }
});

// =====================================================================
// 4. T3 / T5 excluded from runtime-uplift composite scoring
// =====================================================================

test('T3 / T5 excluded from runtime-uplift composite (constants + manifest)', () => {
  // Reporting constant.
  assert.deepEqual(RUNTIME_UPLIFT_THEATRES, ['T1', 'T2', 'T4'],
    'RUNTIME_UPLIFT_THEATRES is exactly T1/T2/T4');
  assert.ok(!RUNTIME_UPLIFT_THEATRES.includes('T3'), 'T3 not in runtime-uplift composite');
  assert.ok(!RUNTIME_UPLIFT_THEATRES.includes('T5'), 'T5 not in runtime-uplift composite');

  // Diagnostic constant covers all five.
  assert.deepEqual(DIAGNOSTIC_THEATRES, ['T1', 'T2', 'T3', 'T4', 'T5'],
    'DIAGNOSTIC_THEATRES is all five');

  // Manifest membership flags.
  const manifest = buildCycle002Manifest({
    runId: 'cycle-002-test-membership',
    corpusHash: CYCLE_001_CORPUS_HASH,
    scriptHash: CYCLE_001_ENTRYPOINT_HASH,
    replayScriptHash: { hex: 'a'.repeat(64), file_count: 12, files: [] },
    codeRevision: 'unknown',
    aggregates: {
      T1: { n_events: 5, brier: 0.5 }, T2: { n_events: 5, brier: 0.5 },
      T3: { n_events: 5 }, T4: { n_events: 5, brier: 0.4 }, T5: { n_events: 5 },
    },
    trajectoryHashes: { T1: {}, T2: {}, T4: {} },
  });
  assert.equal(manifest.runtime_uplift_composite_membership.T3, false);
  assert.equal(manifest.runtime_uplift_composite_membership.T5, false);
  assert.equal(manifest.runtime_uplift_composite_membership.T4, true);
  // T3 / T5 entries exist but are flagged diagnostic-only.
  const t3 = manifest.entries.find((e) => e.theatre === 'T3');
  const t5 = manifest.entries.find((e) => e.theatre === 'T5');
  assert.ok(t3 && t3.included_in_runtime_uplift_composite === false && t3.diagnostic_only === true);
  assert.ok(t5 && t5.included_in_runtime_uplift_composite === false && t5.diagnostic_only === true);
});

// =====================================================================
// 5. Two-summary tagging
// =====================================================================

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'cycle002-test-'));
  try {
    return fn(dir);
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* tmpdir cleanup best-effort */ }
  }
}

test('runtime-uplift-summary.md: posture tags + scope discipline', () => {
  withTempDir((dir) => {
    const meta = {
      runId: 'cycle-002-test',
      corpusHash: CYCLE_001_CORPUS_HASH,
      cycleOneScriptHash: CYCLE_001_ENTRYPOINT_HASH,
      replayScriptHash: 'b'.repeat(64),
      codeRevision: 'test',
      outputDir: dir,
    };
    const aggregates = {
      T1: { n_events: 5, brier: 0.7 },
      T2: { n_events: 5, brier: 0.8, n_events_excluded_no_kp: 0 },
      T4: { n_events: 5, brier: 0.4 },
    };
    const path = writeRuntimeUpliftSummary({ aggregates, meta });
    const body = readFileSync(path, 'utf8');
    // Posture tags present.
    assert.match(body, /T1 \[runtime-binary\]/);
    assert.match(body, /T2 \[runtime-binary\]/);
    assert.match(body, /T4 \[runtime-bucket\]/);
    // Scope discipline: composite says T1+T2+T4 ONLY; T3/T5 not as theatre rows.
    assert.match(body, /T1 \+ T2 \+ T4 ONLY/);
    assert.doesNotMatch(body, /^\| T3 \[/m, 'T3 must NOT appear as a runtime-uplift composite row');
    assert.doesNotMatch(body, /^\| T5 \[/m, 'T5 must NOT appear as a runtime-uplift composite row');
    // Honest framing forbidden language: must NOT contain bare claims.
    assert.doesNotMatch(body, /\bcalibration improved\b/i);
    assert.doesNotMatch(body, /predictive uplift demonstrated/i);
    assert.doesNotMatch(body, /verifiable track record/i);
  });
});

test('diagnostic-summary.md: every section/table tagged [diagnostic] + posture tags', () => {
  withTempDir((dir) => {
    const meta = {
      runId: 'cycle-002-test',
      corpusHash: CYCLE_001_CORPUS_HASH,
      cycleOneScriptHash: CYCLE_001_ENTRYPOINT_HASH,
      replayScriptHash: 'c'.repeat(64),
      codeRevision: 'test',
      outputDir: dir,
    };
    const aggregates = {
      T1: { n_events: 5, brier: 0.7 },
      T2: { n_events: 5, brier: 0.8, n_events_excluded_no_kp: 0 },
      T3: { n_events: 5, mae_hours: 4.2, within_6h_hit_rate: 0.6 },
      T4: { n_events: 5, brier: 0.4 },
      T5: { n_events: 5, fp_rate: 0.05, stale_feed_p50_seconds: 60, satellite_switch_handled_rate: 1.0 },
    };
    const path = writeDiagnosticSummary({ aggregates, meta });
    const body = readFileSync(path, 'utf8');
    // [diagnostic] tag must appear in title and on every section header.
    assert.match(body, /^# .*\[diagnostic\]/m, 'top-level header carries [diagnostic]');
    const sectionHeaders = body.split('\n').filter((l) => l.startsWith('## '));
    assert.ok(sectionHeaders.length >= 4, 'multiple section headers present');
    for (const h of sectionHeaders) {
      assert.ok(h.includes('[diagnostic]'),
        `every diagnostic-summary section title must include [diagnostic] (offending: "${h}")`);
    }
    // All five posture tags present.
    assert.match(body, /T1 \[runtime-binary\]/);
    assert.match(body, /T2 \[runtime-binary\]/);
    assert.match(body, /T3 \[external-model\]/);
    assert.match(body, /T4 \[runtime-bucket\]/);
    assert.match(body, /T5 \[quality-of-behavior\]/);
  });
});

// =====================================================================
// 6. cycle-002 manifest structural / regression validation
// =====================================================================

test('cycle-002 manifest structural shape', () => {
  const replayHash = computeReplayScriptHash(REPO_ROOT);
  const { aggregates, trajectoryHashes } = dispatchCycle002Replay({});
  const manifest = buildCycle002Manifest({
    runId: 'cycle-002-test-shape',
    corpusHash: CYCLE_001_CORPUS_HASH,
    scriptHash: CYCLE_001_ENTRYPOINT_HASH,
    replayScriptHash: replayHash,
    codeRevision: 'test',
    aggregates,
    trajectoryHashes,
  });

  // Required top-level fields.
  assert.equal(manifest.cycle, 'cycle-002');
  assert.equal(manifest.additive, true);
  assert.equal(manifest.predecessor_manifest.cycle, 'cycle-001');
  assert.equal(manifest.predecessor_manifest.immutable, true);
  assert.equal(manifest.corpus_hash, CYCLE_001_CORPUS_HASH);
  assert.equal(manifest.cycle_001_script_hash, CYCLE_001_ENTRYPOINT_HASH);
  assert.ok(typeof manifest.cycle_001_script_hash_note === 'string'
    && manifest.cycle_001_script_hash_note.toLowerCase().includes('insufficient'),
    'manifest documents why cycle-001 script_hash is insufficient for cycle-002 provenance');
  assert.equal(manifest.replay_script_hash, replayHash.hex);
  assert.equal(manifest.runtime_replay_hash, replayHash.hex,
    'runtime_replay_hash alias mirrors replay_script_hash');
  assert.equal(manifest.replay_script_hash_file_count, 12,
    `expected 12 covered files (9 from operator's required set + 3 cycle-002 helpers added in Sprint 03)`);

  // Per-theatre runtime-uplift entries exist for T1, T2, T4.
  const runtimeEntries = manifest.entries.filter((e) => e.included_in_runtime_uplift_composite);
  assert.deepEqual(
    runtimeEntries.map((e) => e.theatre).sort(),
    ['T1', 'T2', 'T4'],
    'runtime-uplift entries are exactly T1, T2, T4',
  );
  for (const entry of runtimeEntries) {
    assert.ok(entry.gate_thresholds, `${entry.theatre}: gate_thresholds present`);
    assert.equal(entry.cycle, 'cycle-002');
  }
});

test('cycle-002 manifest regression: replay_script_hash matches recomputed', () => {
  const replayHash = computeReplayScriptHash(REPO_ROOT);
  const manifest = buildCycle002Manifest({
    runId: 'cycle-002-test-regression',
    corpusHash: CYCLE_001_CORPUS_HASH,
    scriptHash: CYCLE_001_ENTRYPOINT_HASH,
    replayScriptHash: replayHash,
    codeRevision: 'test',
    aggregates: {
      T1: { n_events: 5, brier: 0.5 },
      T2: { n_events: 5, brier: 0.5 },
      T4: { n_events: 5, brier: 0.4 },
    },
    trajectoryHashes: { T1: {}, T2: {}, T4: {} },
  });
  const v = verifyReplayScriptHash(manifest, REPO_ROOT);
  assert.equal(v.ok, true, `verifier must pass: ${v.message ?? ''}`);
  assert.equal(v.recomputed, v.recorded);
});

// =====================================================================
// 7. replay_script_hash sensitivity to covered-file changes
// =====================================================================

test('replay_script_hash file set: 9 operator-required + 3 Sprint-03 helpers (no cycle-001 entrypoint)', () => {
  const required = [
    'scripts/corona-backtest-cycle-002.js',
    'scripts/corona-backtest/replay/canonical-json.js',
    'scripts/corona-backtest/replay/hashes.js',
    'scripts/corona-backtest/replay/context.js',
    'scripts/corona-backtest/replay/t1-replay.js',
    'scripts/corona-backtest/replay/t2-replay.js',
    'scripts/corona-backtest/replay/t4-replay.js',
    'scripts/corona-backtest/scoring/t1-binary-brier.js',
    'scripts/corona-backtest/scoring/t2-binary-brier.js',
  ];
  for (const r of required) {
    assert.ok(REPLAY_SCRIPT_HASH_FILES.includes(r),
      `replay_script_hash file set must include operator-required ${r}`);
  }
  // Cycle-001 entrypoint MUST NOT be in this set (preserves I1 by construction).
  assert.ok(!REPLAY_SCRIPT_HASH_FILES.includes(CYCLE_001_ENTRYPOINT_RELATIVE),
    'cycle-001 entrypoint MUST NOT be in the replay_script_hash file set');
});

test('replay_script_hash changes when any covered file changes (one-byte mutation)', () => {
  const baseline = computeReplayScriptHash(REPO_ROOT);
  withTempDir((tmp) => {
    // Mirror all 12 covered files into the temp tree.
    for (const rel of REPLAY_SCRIPT_HASH_FILES) {
      const src = resolve(REPO_ROOT, rel);
      const dst = join(tmp, rel);
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
    }
    // Same content under the temp root → identical hash.
    const tmpBaseline = computeReplayScriptHash(tmp);
    assert.equal(tmpBaseline.hex, baseline.hex,
      'mirrored file set produces identical replay_script_hash (proves recomputability)');

    // Mutate exactly one byte of the entrypoint copy.
    const target = join(tmp, 'scripts/corona-backtest-cycle-002.js');
    const original = readFileSync(target);
    writeFileSync(target, Buffer.concat([original, Buffer.from('\n// sprint-03 sensitivity probe\n')]));
    const mutated = computeReplayScriptHash(tmp);
    assert.notEqual(mutated.hex, baseline.hex,
      'one-byte mutation of any covered file MUST change replay_script_hash');

    // Mutate a different covered file too — still differs from baseline.
    const target2 = join(tmp, 'scripts/corona-backtest/replay/t4-replay.js');
    const original2 = readFileSync(target2);
    writeFileSync(target2, Buffer.concat([original2, Buffer.from('// probe\n')]));
    const mutated2 = computeReplayScriptHash(tmp);
    assert.notEqual(mutated2.hex, baseline.hex,
      'mutating a second covered file produces a hash distinct from baseline');
    assert.notEqual(mutated2.hex, mutated.hex,
      'two distinct mutations produce distinct hashes');
  });
});

// =====================================================================
// 8. T1/T2 base_rate prior-only guard (cycle-001 corpus shape)
// =====================================================================

test('T1 prior-only guard: current_position_at_cutoff equals runtime base_rate on cycle-001 corpus', () => {
  const { events } = loadCorpusWithCutoff(undefined, { theatres: ['T1'] });
  assert.equal(events.T1.length, 5);
  const positions = new Set();
  for (const event of events.T1) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T1', runtime_revision: 'sprint-03-prior-only-guard' });
    const traj = replay_T1_event(event, ctx);
    positions.add(traj.current_position_at_cutoff);
    // Position-history should be a single entry: createX once, never processX.
    assert.equal(traj.position_history_at_cutoff.length, 1,
      `T1/${event.event_id}: cycle-001 corpus has no pre-cutoff time-series; position_history must be the single create-time entry. ` +
      `If this fails, T1 has gained a process* path (corpus shape changed) and the prior-only honest framing must be revisited.`);
  }
  // All 5 events share the SAME prior — i.e., scalar is the base_rate constant.
  assert.equal(positions.size, 1,
    `T1: all 5 cycle-001 corpus events should share a single base_rate prior; ` +
    `got ${positions.size} distinct values (${[...positions].join(', ')}). ` +
    `Sprint 02 reviewer.md M2 binding disclosure: T1 cannot earn Rung 3 on this corpus.`);
});

test('T2 prior-only guard: current_position_at_cutoff equals runtime base_rate on cycle-001 corpus', () => {
  const { events } = loadCorpusWithCutoff(undefined, { theatres: ['T2'] });
  assert.equal(events.T2.length, 5);
  const positions = new Set();
  for (const event of events.T2) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T2', runtime_revision: 'sprint-03-prior-only-guard' });
    const traj = replay_T2_event(event, ctx);
    positions.add(traj.current_position_at_cutoff);
    assert.equal(traj.position_history_at_cutoff.length, 1,
      `T2/${event.event_id}: cycle-001 corpus has no per-3hr Kp series; position_history must be the single create-time entry.`);
  }
  assert.equal(positions.size, 1,
    `T2: all 5 cycle-001 corpus events should share a single base_rate prior; ` +
    `got ${positions.size} distinct values (${[...positions].join(', ')}).`);
});

// =====================================================================
// loadCorpusWithCutoff additive contract
// =====================================================================

test('loadCorpusWithCutoff: additive — same events as loadCorpus, plus cutoffs + evidence split', () => {
  const result = loadCorpusWithCutoff(undefined, {});
  // Event payload structurally same as loadCorpus.
  assert.ok(result.events.T1?.length > 0, 'T1 events present');
  assert.ok(result.events.T4?.length > 0, 'T4 events present');
  // Per-event cutoffs derived.
  for (const theatre of ['T1', 'T2', 'T3', 'T4', 'T5']) {
    const events = result.events[theatre];
    assert.ok(result.stats[theatre].cutoff_derived_count === events.length,
      `${theatre}: cutoff_derived_count == events.length (loader ran derivations on every event)`);
    for (const event of events) {
      const cutoff = result.cutoffs[event.event_id];
      assert.ok(cutoff && Number.isFinite(cutoff.time_ms) && typeof cutoff.rule === 'string',
        `${theatre}/${event.event_id}: cutoff present and well-formed`);
      const ev = result.evidence[event.event_id];
      assert.ok(ev && Array.isArray(ev.pre_cutoff) && typeof ev.settlement === 'object',
        `${theatre}/${event.event_id}: evidence split present`);
    }
  }
  // T4 events with proton observations have non-empty pre_cutoff (structural fix per audit §A1).
  const t4WithObs = result.events.T4.filter((e) => Array.isArray(e.proton_flux_observations) && e.proton_flux_observations.length > 0);
  for (const ev of t4WithObs) {
    const evidence = result.evidence[ev.event_id];
    // Strictly less-than cutoff: every entry has event_time_ms < cutoff.time_ms.
    const cutoff = result.cutoffs[ev.event_id];
    for (const obs of evidence.pre_cutoff) {
      assert.ok(obs.event_time_ms < cutoff.time_ms,
        `T4/${ev.event_id}: every pre_cutoff observation must be strictly before cutoff (got ${obs.event_time_ms} >= ${cutoff.time_ms})`);
    }
  }
});

// =====================================================================
// Output-dir guard: cycle-002 entrypoint refuses to write into cycle-001 dirs
// =====================================================================

test('cycle-002 entrypoint refuses to write into cycle-001 frozen output directories', () => {
  for (const frozen of ['run-1', 'run-2', 'run-3-final']) {
    assert.ok(_FROZEN_CYCLE001_OUTPUT_DIRS.has(frozen),
      `${frozen} listed in FROZEN_CYCLE001_OUTPUT_DIRS guard`);
  }
});

// =====================================================================
// scoreCorpusT4PerEventDispatch: aggregation correctness
// =====================================================================

test('scoreCorpusT4PerEventDispatch: per-event distributions, mean Brier aggregation', () => {
  // Build synthetic event/trajectory pairs using real T4 corpus + replay.
  const { events } = loadCorpusWithCutoff(undefined, { theatres: ['T4'] });
  const pairs = [];
  for (const event of events.T4) {
    const ctx = createReplayContext({ corpus_event: event, theatre_id: 'T4', runtime_revision: 'test-aggregation' });
    const trajectory = replay_T4_event(event, ctx);
    pairs.push({ event, trajectory });
  }
  const result = _scoreCorpusT4PerEventDispatch(pairs);
  assert.equal(result.n_events, 5);
  assert.equal(result.scoring_path, 't4_bucket_brier_runtime_wired_cycle002');
  // Brier == mean of per_event.brier_score
  const expected = result.per_event.reduce((s, r) => s + r.brier_score, 0) / 5;
  assert.equal(result.brier, expected, 'aggregate brier == mean of per-event brier scores');
  // Empty input → zero-event aggregate, no throw.
  const empty = _scoreCorpusT4PerEventDispatch([]);
  assert.equal(empty.n_events, 0);
  assert.equal(empty.brier, 0);
});
