/**
 * tests/manifest_structural_test.js
 *
 * Sprint 5 / corona-3o4 deliverable: structural validation of
 * grimoires/loa/calibration/corona/calibration-manifest.json against
 * the PRD §7 schema + Sprint 4 §1.1 verification taxonomy +
 * PRD §8.5 engineering-estimated parameter policy.
 *
 * Per SDD §5.5: "Sprint 5 includes a tests/corona_test.js test that
 * loads the manifest and asserts:
 *   - All required fields present per PRD §7.
 *   - provisional: true ⇒ if settlement_critical: true,
 *     promotion_path is non-null.
 *   - derivation ∈ {backtest_derived, literature_derived,
 *     engineering_estimated}.
 *   - confidence ∈ {high, medium, low}.
 *   - theatre ∈ {T1, T2, T3, T4, T5, shared}.
 *
 * This is a STRUCTURAL check on the manifest itself. The
 * inline-vs-manifest check is the regression gate
 * (tests/manifest_regression_test.js).
 *
 * Sprint 4 / Round 1 lesson (CR-1, CR-2): YAML manifest entry sketches
 * over-promoted ENGINEER_CURATED_REQUIRES_VERIFICATION and
 * OPERATIONAL_DOC_ONLY values to settlement_critical=true +
 * provisional=false + confidence=high. This test enforces the
 * §1.1 taxonomy invariants so Sprint 5's calibration-manifest.json
 * cannot repeat the failure mode.
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

const ALLOWED_DERIVATIONS = new Set([
  'backtest_derived',
  'literature_derived',
  'engineering_estimated',
]);
const ALLOWED_CONFIDENCES = new Set(['high', 'medium', 'low']);
const ALLOWED_THEATRES = new Set(['T1', 'T2', 'T3', 'T4', 'T5', 'shared']);
const ALLOWED_VERIFICATION_STATUSES = new Set([
  'VERIFIED_FROM_SOURCE',
  'ENGINEER_CURATED_REQUIRES_VERIFICATION',
  'OPERATIONAL_DOC_ONLY',
  'HYPOTHESIS_OR_HEURISTIC',
]);

// PRD §7 schema fields (12) + Sprint 4 §1.1 verification_status + Sprint 4
// evidence-doc shape (id, source_file, source_line, current_value, notes) +
// SDD §7.3 inline_lookup. The first list is "must be present"; nullability is
// enforced separately below.
const REQUIRED_FIELDS = [
  'id',
  'parameter',
  'current_value',
  'source_file',
  'source_line',
  'derivation',
  'evidence_source',
  'confidence',
  'verification_status',
  'provisional',
  'settlement_critical',
  'promotion_path',
  'theatre',
  'notes',
  'corpus_hash',
  'script_hash',
  'inline_lookup',
];

function loadManifest() {
  const raw = readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

test('manifest structural — file is a JSON array of entries', () => {
  const manifest = loadManifest();
  assert.ok(Array.isArray(manifest), 'manifest must be a JSON array');
  assert.ok(manifest.length > 0, 'manifest must contain at least one entry');
});

test('manifest structural — every entry has all required fields', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(entry, field),
        `entry ${entry.id ?? '<no id>'} missing required field "${field}"`
      );
    }
  }
});

test('manifest structural — id is unique within the manifest', () => {
  const manifest = loadManifest();
  const seen = new Set();
  for (const entry of manifest) {
    assert.ok(typeof entry.id === 'string' && entry.id.length > 0,
      `entry has missing or empty id (parameter=${entry.parameter ?? '<unknown>'})`);
    assert.ok(!seen.has(entry.id),
      `duplicate id: ${entry.id}`);
    seen.add(entry.id);
  }
});

test('manifest structural — parameter is a non-empty dotted path', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(typeof entry.parameter === 'string' && entry.parameter.length > 0,
      `entry ${entry.id} has missing or empty parameter`);
    assert.ok(entry.parameter.includes('.'),
      `entry ${entry.id} parameter "${entry.parameter}" must be a dotted path`);
  }
});

test('manifest structural — derivation in allowed set', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(ALLOWED_DERIVATIONS.has(entry.derivation),
      `entry ${entry.id} has invalid derivation "${entry.derivation}" ` +
      `(allowed: ${[...ALLOWED_DERIVATIONS].join(', ')})`);
  }
});

test('manifest structural — confidence in allowed set', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(ALLOWED_CONFIDENCES.has(entry.confidence),
      `entry ${entry.id} has invalid confidence "${entry.confidence}" ` +
      `(allowed: ${[...ALLOWED_CONFIDENCES].join(', ')})`);
  }
});

test('manifest structural — theatre in allowed set', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(ALLOWED_THEATRES.has(entry.theatre),
      `entry ${entry.id} has invalid theatre "${entry.theatre}" ` +
      `(allowed: ${[...ALLOWED_THEATRES].join(', ')})`);
  }
});

test('manifest structural — verification_status in allowed set (Sprint 4 §1.1 taxonomy)', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(ALLOWED_VERIFICATION_STATUSES.has(entry.verification_status),
      `entry ${entry.id} has invalid verification_status "${entry.verification_status}" ` +
      `(allowed: ${[...ALLOWED_VERIFICATION_STATUSES].join(', ')})`);
  }
});

test('manifest structural — provisional and settlement_critical are booleans', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.equal(typeof entry.provisional, 'boolean',
      `entry ${entry.id} provisional must be boolean`);
    assert.equal(typeof entry.settlement_critical, 'boolean',
      `entry ${entry.id} settlement_critical must be boolean`);
  }
});

test('manifest structural — PRD §8.5: settlement_critical AND provisional ⇒ promotion_path non-null', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    if (entry.settlement_critical === true && entry.provisional === true) {
      assert.ok(
        typeof entry.promotion_path === 'string' && entry.promotion_path.length > 0,
        `entry ${entry.id} is settlement_critical + provisional but has no promotion_path ` +
        `(PRD §8.5: settlement-critical engineering-estimated parameters MUST have a documented promotion_path)`
      );
    }
  }
});

test('manifest structural — Sprint 4 §1.1: VERIFIED_FROM_SOURCE ⇒ provisional=false', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    if (entry.verification_status === 'VERIFIED_FROM_SOURCE') {
      assert.equal(entry.provisional, false,
        `entry ${entry.id} is VERIFIED_FROM_SOURCE but provisional=true ` +
        `(Sprint 4 §1.1: only VERIFIED_FROM_SOURCE entries should have provisional=false)`);
    }
  }
});

test('manifest structural — Sprint 4 §1.1: non-VERIFIED_FROM_SOURCE ⇒ provisional=true', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    if (entry.verification_status !== 'VERIFIED_FROM_SOURCE') {
      assert.equal(entry.provisional, true,
        `entry ${entry.id} verification_status=${entry.verification_status} but provisional=false ` +
        `(Sprint 4 §1.1 hard rule: ENGINEER_CURATED_REQUIRES_VERIFICATION / OPERATIONAL_DOC_ONLY / ` +
        `HYPOTHESIS_OR_HEURISTIC entries MUST be provisional=true pending DOI verification)`);
    }
  }
});

test('manifest structural — engineering_estimated ⇒ verification_status is HYPOTHESIS_OR_HEURISTIC', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    if (entry.derivation === 'engineering_estimated') {
      assert.equal(entry.verification_status, 'HYPOTHESIS_OR_HEURISTIC',
        `entry ${entry.id} derivation=engineering_estimated but ` +
        `verification_status=${entry.verification_status}; ` +
        `engineering_estimated entries should be tagged HYPOTHESIS_OR_HEURISTIC per Sprint 4 §1.1`);
    }
  }
});

test('manifest structural — engineering_estimated ⇒ evidence_source is null OR a conceptual anchor (not a direct numerical claim)', () => {
  // Sprint 4 §3.4 corona-evidence-002 (glancing_blow_sigma_multiplier) sets
  // derivation=engineering_estimated AND evidence_source="Conceptually anchored in
  // Riley et al. 2018 ... specific 1.5× multiplier is engineer-derived". This
  // pattern is acceptable per Sprint 4 §1.1 — the engineering-estimated value
  // may carry a qualitative literature anchor in evidence_source so long as the
  // verification_status correctly signals HYPOTHESIS_OR_HEURISTIC and the
  // engineer-derived nature is explicit in the citation text. The test enforces
  // the latter: if evidence_source is non-null, it MUST mention the engineering
  // nature (so the manifest cannot silently promote an engineer-derived value
  // to a literature-citation that overstates support).
  const manifest = loadManifest();
  const engineerMarkers = /engineer-?derived|engineering-?(estimated|derived|calibrated)|conceptually anchored|engineer-inferred|no specific (literature|primary|peer-reviewed) (anchor|source|citation)|no direct literature|engineer-?summarized/i;
  for (const entry of manifest) {
    if (entry.derivation !== 'engineering_estimated') continue;
    if (entry.evidence_source === null) continue;
    assert.ok(typeof entry.evidence_source === 'string' && entry.evidence_source.length > 0,
      `entry ${entry.id} engineering_estimated: evidence_source must be null or a non-empty string`);
    assert.ok(engineerMarkers.test(entry.evidence_source),
      `entry ${entry.id} engineering_estimated: evidence_source "${entry.evidence_source}" ` +
      `must explicitly disclose the engineering-derived nature ` +
      `(e.g., "engineer-derived", "engineering-estimated", "conceptually anchored", "no specific literature anchor"). ` +
      `Sprint 4 §1.1 invariant: engineering_estimated entries must not look like literature-derived entries.`);
  }
});

test('manifest structural — literature_derived ⇒ evidence_source is non-empty string', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    if (entry.derivation === 'literature_derived') {
      assert.ok(typeof entry.evidence_source === 'string' && entry.evidence_source.length > 0,
        `entry ${entry.id} derivation=literature_derived but evidence_source is empty/null; ` +
        `literature-derived parameters MUST cite a primary or operational source`);
    }
  }
});

test('manifest structural — source_file is a relative path within the repo', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(typeof entry.source_file === 'string' && entry.source_file.length > 0,
      `entry ${entry.id} source_file must be a non-empty string`);
    // Reject absolute paths (Unix or Windows-style) and parent-traversal
    assert.ok(!entry.source_file.startsWith('/'),
      `entry ${entry.id} source_file "${entry.source_file}" must be relative, not absolute`);
    assert.ok(!/^[A-Za-z]:[/\\]/.test(entry.source_file),
      `entry ${entry.id} source_file "${entry.source_file}" must be relative, not absolute (Windows)`);
    assert.ok(!entry.source_file.includes('..'),
      `entry ${entry.id} source_file "${entry.source_file}" must not contain parent-traversal`);
    // Verify the file exists on disk
    const absPath = resolve(REPO_ROOT, entry.source_file);
    let exists = false;
    try {
      readFileSync(absPath, 'utf8');
      exists = true;
    } catch {
      exists = false;
    }
    assert.ok(exists, `entry ${entry.id} source_file "${entry.source_file}" does not exist on disk`);
  }
});

test('manifest structural — source_line is a positive integer', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.equal(typeof entry.source_line, 'number',
      `entry ${entry.id} source_line must be a number`);
    assert.ok(Number.isInteger(entry.source_line) && entry.source_line > 0,
      `entry ${entry.id} source_line must be a positive integer (got ${entry.source_line})`);
  }
});

test('manifest structural — corpus_hash and script_hash are 64-char hex strings', () => {
  const manifest = loadManifest();
  const hexRegex = /^[a-f0-9]{64}$/;
  for (const entry of manifest) {
    assert.ok(typeof entry.corpus_hash === 'string' && hexRegex.test(entry.corpus_hash),
      `entry ${entry.id} corpus_hash "${entry.corpus_hash}" must be a 64-char hex string`);
    assert.ok(typeof entry.script_hash === 'string' && hexRegex.test(entry.script_hash),
      `entry ${entry.id} script_hash "${entry.script_hash}" must be a 64-char hex string`);
  }
});

test('manifest structural — inline_lookup has file, line, and match_pattern', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    const il = entry.inline_lookup;
    assert.ok(il && typeof il === 'object',
      `entry ${entry.id} inline_lookup must be an object`);
    assert.ok(typeof il.file === 'string' && il.file.length > 0,
      `entry ${entry.id} inline_lookup.file must be a non-empty string`);
    assert.equal(il.file, entry.source_file,
      `entry ${entry.id} inline_lookup.file "${il.file}" must match source_file "${entry.source_file}"`);
    assert.ok(Number.isInteger(il.line) && il.line > 0,
      `entry ${entry.id} inline_lookup.line must be a positive integer`);
    assert.equal(il.line, entry.source_line,
      `entry ${entry.id} inline_lookup.line ${il.line} must match source_line ${entry.source_line}`);
    assert.ok(typeof il.match_pattern === 'string' && il.match_pattern.length > 0,
      `entry ${entry.id} inline_lookup.match_pattern must be a non-empty string`);
    // The pattern must compile as a regex (we'll evaluate it in the regression test)
    let regex;
    try {
      regex = new RegExp(il.match_pattern);
    } catch (err) {
      assert.fail(`entry ${entry.id} inline_lookup.match_pattern "${il.match_pattern}" ` +
        `is not a valid regex: ${err.message}`);
    }
    assert.ok(regex instanceof RegExp);
  }
});

test('manifest structural — promotion_path is null XOR string', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    const pp = entry.promotion_path;
    const isNull = pp === null;
    const isNonEmptyString = typeof pp === 'string' && pp.length > 0;
    assert.ok(isNull || isNonEmptyString,
      `entry ${entry.id} promotion_path must be null or a non-empty string (got ${JSON.stringify(pp)})`);
  }
});

test('manifest structural — notes is a non-empty string', () => {
  const manifest = loadManifest();
  for (const entry of manifest) {
    assert.ok(typeof entry.notes === 'string' && entry.notes.length > 0,
      `entry ${entry.id} notes must be a non-empty string (use empty-string explicit '' if no notes — but every entry should document at least the source-line context)`);
  }
});

test('manifest structural — Sprint 5 coverage: every PRD §5.5 target is represented', () => {
  // PRD §5.5 + Sprint 4 §10 coverage targets:
  //   1. WSA-Enlil sigma (T3) — corona-evidence-001/002
  //   2. Doubt-price floors T1 — corona-evidence-003/004/005
  //   3. Doubt-price floors T2 — corona-evidence-006/007
  //   4. Wheatland prior T4 — corona-evidence-008..013
  //   5. Bz volatility threshold T5 — corona-evidence-014/015/016
  //   6. Source-reliability scores — corona-evidence-017..029
  //   7. Uncertainty pricing constants (Normal-CDF) — corona-evidence-019/020
  const manifest = loadManifest();
  const ids = new Set(manifest.map((e) => e.id));
  const requiredCoverage = {
    't3_sigma': ['corona-evidence-001'],
    't1_doubt_floors': ['corona-evidence-003', 'corona-evidence-004'],
    't2_kp_sigma': ['corona-evidence-006', 'corona-evidence-007'],
    't4_wheatland': ['corona-evidence-008', 'corona-evidence-009', 'corona-evidence-010', 'corona-evidence-011'],
    't5_bz': ['corona-evidence-014', 'corona-evidence-015'],
    'source_reliability_goes': ['corona-evidence-017'],
    'source_reliability_dscovr_ace': ['corona-evidence-018-dscovr', 'corona-evidence-018-ace'],
    'normal_cdf_z': ['corona-evidence-019'],
  };
  for (const [target, expectedIds] of Object.entries(requiredCoverage)) {
    for (const id of expectedIds) {
      assert.ok(ids.has(id),
        `manifest missing required coverage entry ${id} for target "${target}"`);
    }
  }
});
