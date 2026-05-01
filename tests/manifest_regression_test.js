/**
 * tests/manifest_regression_test.js
 *
 * Sprint 5 / corona-15v deliverable: manifest regression gate enforcing
 * inline-equals-manifest per SDD §7.3 + calibration-protocol.md §7.3.
 *
 * "Inline code constants must match manifest values. The Sprint 5
 * regression gate enforces this." — PRD §7 source-of-truth rule.
 *
 * For each manifest entry where derivation ∈ {literature_derived,
 * backtest_derived}, this test verifies the inline constant in the cited
 * file at the cited line matches the manifest's current_value via the
 * inline_lookup.match_pattern regex.
 *
 * SDD §7.4 provisional handling: entries with derivation=engineering_estimated
 * AND provisional=true are EXEMPT from the inline-equals check (the value
 * may diverge with promotion_path) — but the gate STILL asserts:
 *   - The inline constant exists at the cited location (a "structural" check).
 *   - promotion_path is non-null when settlement_critical=true (PRD §8.5).
 *     (The structural test enforces this; the regression test re-asserts as
 *     a defense-in-depth check.)
 *
 * The test runs as part of the standard tests/ suite via `node --test`. It
 * cannot be bypassed with --no-verify (unlike a pre-commit hook). Per SDD §7.2
 * Approach B is the chosen Sprint 5 mechanism; Approach A (pre-commit hook)
 * may be added in Sprint 7 if friction warrants.
 *
 * Zero new dependencies: node:fs, node:path, node:test, node:assert only.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = resolve(
  REPO_ROOT,
  'grimoires',
  'loa',
  'calibration',
  'corona',
  'calibration-manifest.json'
);

function loadManifest() {
  const raw = readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

function loadFileLines(relativePath) {
  const abs = resolve(REPO_ROOT, relativePath);
  return readFileSync(abs, 'utf8').split('\n');
}

test('manifest regression — inline value at source_line matches manifest current_value (literature_derived + backtest_derived)', () => {
  const manifest = loadManifest();
  let assertedCount = 0;
  for (const entry of manifest) {
    // Skip engineering_estimated entries — they are exempt per SDD §7.4
    // (provisional values may diverge with promotion_path). The structural
    // test (manifest_structural_test.js) already verifies the inline_lookup
    // file/line are valid.
    if (entry.derivation === 'engineering_estimated') continue;

    const lines = loadFileLines(entry.source_file);
    const lineIndex = entry.source_line - 1; // 1-based to 0-based
    assert.ok(lineIndex >= 0 && lineIndex < lines.length,
      `entry ${entry.id}: source_line ${entry.source_line} out of range for ${entry.source_file} ` +
      `(file has ${lines.length} lines)`);

    const lineText = lines[lineIndex];
    const pattern = new RegExp(entry.inline_lookup.match_pattern);
    assert.ok(pattern.test(lineText),
      `entry ${entry.id} (${entry.parameter} = ${JSON.stringify(entry.current_value)}): ` +
      `inline_lookup.match_pattern "${entry.inline_lookup.match_pattern}" did not match at ` +
      `${entry.source_file}:${entry.source_line}\n` +
      `  Line text: ${JSON.stringify(lineText)}\n` +
      `  This indicates the inline constant has drifted from the manifest value, ` +
      `OR the manifest's source_line has shifted (e.g., a line was added above the citation site). ` +
      `Either update the inline constant to match the manifest's current_value, OR update the manifest ` +
      `entry's source_line + match_pattern to match the inline reality.`);

    assertedCount += 1;
  }
  assert.ok(assertedCount > 0,
    'manifest regression test asserted 0 entries — no literature_derived or backtest_derived entries found');
});

test('manifest regression — engineering_estimated entries: inline_lookup file exists at cited line (structural defense)', () => {
  const manifest = loadManifest();
  let checkedCount = 0;
  for (const entry of manifest) {
    if (entry.derivation !== 'engineering_estimated') continue;

    const lines = loadFileLines(entry.source_file);
    const lineIndex = entry.source_line - 1;
    assert.ok(lineIndex >= 0 && lineIndex < lines.length,
      `entry ${entry.id} (engineering_estimated): source_line ${entry.source_line} out of range for ` +
      `${entry.source_file} (file has ${lines.length} lines)`);

    // For engineering_estimated entries, the value may have drifted
    // intentionally (promotion_path is the contract). But the inline
    // constant must STILL exist at the cited location — otherwise the
    // manifest entry is orphaned. We use the match_pattern as the
    // structural check: if it fails, the parameter is no longer at this
    // location and the manifest entry must be updated.
    const pattern = new RegExp(entry.inline_lookup.match_pattern);
    const lineText = lines[lineIndex];
    assert.ok(pattern.test(lineText),
      `entry ${entry.id} (engineering_estimated, ${entry.parameter}): ` +
      `inline_lookup.match_pattern "${entry.inline_lookup.match_pattern}" did not match at ` +
      `${entry.source_file}:${entry.source_line}.\n` +
      `  Line text: ${JSON.stringify(lineText)}\n` +
      `  The engineering-estimated value may diverge from the manifest (per SDD §7.4 + ` +
      `promotion_path), but the inline constant MUST still exist at the cited location. ` +
      `If the parameter has been retired, remove the manifest entry entirely; do not leave it orphaned.`);

    checkedCount += 1;
  }
  // It is OK to have zero engineering_estimated entries; this just gates that
  // when there are some, they are checked.
  assert.ok(checkedCount >= 0, 'engineering_estimated structural check ran');
});

test('manifest regression — settlement_critical + provisional ⇒ promotion_path is non-empty (PRD §8.5 defense-in-depth)', () => {
  // Defense-in-depth: the structural test asserts the same rule, but we
  // re-assert here because the regression gate is the load-bearing pre-commit
  // gate per SDD §7.2 Approach B. If the structural test ever stops running
  // (filename change, suite restructuring), the regression gate catches the
  // worst failure mode (a settlement-critical engineering-estimated parameter
  // with no documented promotion path).
  const manifest = loadManifest();
  for (const entry of manifest) {
    if (entry.settlement_critical === true && entry.provisional === true) {
      assert.ok(
        typeof entry.promotion_path === 'string' && entry.promotion_path.length > 0,
        `entry ${entry.id} is settlement_critical + provisional but has no promotion_path. ` +
        `PRD §8.5: settlement-critical engineering-estimated parameters MUST have a documented promotion_path.`
      );
    }
  }
});

test('manifest regression — corpus_hash matches Run 1 baseline corpus_hash', () => {
  // Per calibration-protocol.md §7.3: corpus_hash drift means the corpus
  // changed without manifest update; this is a regression-gate failure.
  // Sprint 5 uses Run 1's corpus_hash since the corpus is frozen at Sprint 3.
  // Sprint 7 / future cycles will update manifest entries' corpus_hash when
  // corpus extension occurs (operator-HITL-gated per §3.5).
  const manifest = loadManifest();
  const run1HashPath = resolve(
    REPO_ROOT,
    'grimoires',
    'loa',
    'calibration',
    'corona',
    'run-1',
    'corpus_hash.txt'
  );
  const run1Hash = readFileSync(run1HashPath, 'utf8').trim();
  assert.ok(run1Hash.length === 64, 'run-1 corpus_hash.txt should contain a 64-char SHA256');

  for (const entry of manifest) {
    assert.equal(entry.corpus_hash, run1Hash,
      `entry ${entry.id} corpus_hash "${entry.corpus_hash}" does not match Run 1 baseline ` +
      `"${run1Hash}". Per calibration-protocol.md §7.3, corpus_hash mismatch indicates ` +
      `the corpus changed without a manifest update. Either update the corpus_hash on every ` +
      `affected manifest entry OR revert the corpus change.`);
  }
});

test('manifest regression — script_hash matches Run 1 baseline script_hash', () => {
  // Per calibration-protocol.md §7.3: script_hash drift means the harness
  // entrypoint changed without manifest update. Run 1 baseline is the
  // anchor for Sprint 5 (no entrypoint changes). Sprint 7 may bump the
  // script_hash if the entrypoint is modified.
  const manifest = loadManifest();
  const run1HashPath = resolve(
    REPO_ROOT,
    'grimoires',
    'loa',
    'calibration',
    'corona',
    'run-1',
    'script_hash.txt'
  );
  const run1Hash = readFileSync(run1HashPath, 'utf8').trim();
  assert.ok(run1Hash.length === 64, 'run-1 script_hash.txt should contain a 64-char SHA256');

  for (const entry of manifest) {
    assert.equal(entry.script_hash, run1Hash,
      `entry ${entry.id} script_hash "${entry.script_hash}" does not match Run 1 baseline ` +
      `"${run1Hash}". Per calibration-protocol.md §7.3, script_hash mismatch indicates ` +
      `the harness entrypoint changed without a manifest update. Either update the script_hash ` +
      `on every affected manifest entry OR revert the entrypoint change.`);
  }
});

// ---------------------------------------------------------------------------
// Per-entry isolation: dedicated test cases for each manifest entry so a
// drift on a single value produces a clearly-attributed failure rather than a
// single aggregate "manifest regression test failed" line. The aggregate test
// above is the formal gate; these per-entry tests are diagnostic ergonomics.
// ---------------------------------------------------------------------------

const allEntries = loadManifest();
for (const entry of allEntries) {
  if (entry.derivation === 'engineering_estimated') continue;
  test(`manifest regression — ${entry.id} (${entry.parameter}) inline-equals-manifest`, () => {
    const lines = loadFileLines(entry.source_file);
    const lineText = lines[entry.source_line - 1];
    const pattern = new RegExp(entry.inline_lookup.match_pattern);
    assert.ok(pattern.test(lineText),
      `${entry.id} drift detected:\n` +
      `  parameter: ${entry.parameter}\n` +
      `  manifest current_value: ${JSON.stringify(entry.current_value)}\n` +
      `  source_file: ${entry.source_file}\n` +
      `  source_line: ${entry.source_line}\n` +
      `  match_pattern: ${entry.inline_lookup.match_pattern}\n` +
      `  line text: ${JSON.stringify(lineText)}\n`);
  });
}
