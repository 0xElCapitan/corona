/**
 * tests/no-param-diff-test.js
 *
 * Cycle-004 Sprint 03 — T3.6 (no parameter / gate / source invariant drift).
 * SPRINT-PLAN §6.4/§6.6 (no-refit) [G6].
 *
 * Asserts Sprint 03 introduced NO change to gate logic, runtime parameters,
 * thresholds, base_rate / sigma / lambda / formula surfaces, the RLMF certificate,
 * or package.json, and added no dependency.
 *
 * Mechanisms:
 *   - Pinned gate-param CONSTANTS (imported) hold their cycle-002 values.
 *   - Frozen sha256 anchors on the committed gate / certificate / t1-replay blobs.
 *   - `git diff --quiet HEAD -- <surfaces>` (autocrlf-aware: a CRLF checkout of an
 *     LF blob is NOT a difference) proves no working-tree edit this sprint.
 *   - package.json version 0.2.0 + dependencies {} (no dependency added).
 *   - I1: cycle-001 entrypoint byte-frozen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { CYCLE_002_T1_GATE_PARAMS } from '../scripts/corona-backtest/replay/t1-replay.js';
import { CYCLE_002_T2_GATE_PARAMS } from '../scripts/corona-backtest/replay/t2-replay.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Frozen committed-blob sha256 (LF) anchors captured at Sprint 03 entry (cycle-004 @ 2c83bc6).
const FROZEN = {
  'src/theatres/flare-gate.js': '377725ec9f221ae127746c59f868b5007fb2874919b1871dd7d7c8f51c89a32b',
  'src/theatres/geomag-gate.js': '466ad282595c2050d4d7c2552d999c4832f24cb1f270e50b6c028c9b9fd03934',
  'src/rlmf/certificates.js': 'eeef486cd754016450720dd0839af1a075a722abfa4348542349ea131faf551b',
  'scripts/corona-backtest/replay/t1-replay.js': '9c46c8ad0e174f587a248dabed7a276b549622d75ec10b6af3c0570898ba5979',
};
const CYCLE_001_ENTRYPOINT_SHA256 = '17f6380b623f591bcaa5aa17e343eb775fb81960520d2ca9624b784acf1730f1';

function committedSha(rel) {
  const blob = execFileSync('git', ['cat-file', '-p', `HEAD:${rel}`], { cwd: REPO_ROOT });
  return createHash('sha256').update(blob).digest('hex');
}

test('T1/T2 gate params pinned at cycle-002 values (no threshold / window drift)', () => {
  assert.deepEqual(CYCLE_002_T1_GATE_PARAMS, { threshold_class: 'M1.0', window_hours: 24 },
    'T1 gate params unchanged (no refit)');
  assert.deepEqual(CYCLE_002_T2_GATE_PARAMS, { kp_threshold: 5, window_hours: 72 },
    'T2 gate params unchanged (no refit)');
});

test('frozen gate / certificate / t1-replay committed blobs unchanged (sha256 anchors)', () => {
  for (const [rel, sha] of Object.entries(FROZEN)) {
    assert.equal(committedSha(rel), sha,
      `${rel}: committed blob MUST match frozen anchor (no logic/param/base_rate/sigma/lambda/formula change)`);
  }
});

test('cycle-001 entrypoint byte-frozen (I1)', () => {
  assert.equal(committedSha('scripts/corona-backtest.js'), CYCLE_001_ENTRYPOINT_SHA256, 'I1 invariant');
});

test('no working-tree edit to frozen surfaces this sprint (git diff --quiet HEAD)', () => {
  // git diff --quiet exits non-zero on any difference; autocrlf-aware. Exit 0 =>
  // these surfaces are byte-frozen relative to HEAD (no Sprint 03 modification).
  const surfaces = [
    'src/theatres',
    'src/rlmf/certificates.js',
    'package.json',
    'scripts/corona-backtest/replay/t1-replay.js',
    'scripts/corona-backtest.js',
    'scripts/corona-backtest-cycle-002.js',
  ];
  let clean = true;
  let detail = '';
  try {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', ...surfaces], { cwd: REPO_ROOT });
  } catch {
    clean = false;
    try {
      detail = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', ...surfaces], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
    } catch { /* best-effort detail */ }
  }
  assert.ok(clean, `Sprint 03 MUST NOT modify these frozen surfaces. Changed:\n${detail}`);
});

test('package.json frozen at 0.2.0 / {} (no version bump, no dependency added)', () => {
  const pkg = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '0.2.0', 'version unchanged');
  assert.deepEqual(pkg.dependencies, {}, 'no runtime dependency added');
});
