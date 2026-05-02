/**
 * tests/canonical-json-test.js
 *
 * Sprint 2 helper test for scripts/corona-backtest/replay/canonical-json.js.
 * Pinned by REPLAY-SEAM.md §7.3 (test #11) and CONTRACT.md §9.2 / §7.2.
 *
 * Asserts the canonicalize/parseCanonical contract:
 *   - Object key ordering at single + nested levels
 *   - Array order preservation
 *   - No-whitespace output
 *   - Strict rejection of NaN, Infinity, -Infinity, undefined, BigInt, Function, Symbol
 *   - Stable hex sha256 across invocations (paired with hashes.js)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { canonicalize, parseCanonical } from '../scripts/corona-backtest/replay/canonical-json.js';
import { sha256OfCanonical } from '../scripts/corona-backtest/replay/hashes.js';

test('canonical-json: primitives render correctly', () => {
  assert.equal(canonicalize(null), 'null');
  assert.equal(canonicalize(true), 'true');
  assert.equal(canonicalize(false), 'false');
  assert.equal(canonicalize(0), '0');
  assert.equal(canonicalize(-1), '-1');
  assert.equal(canonicalize(3.14), '3.14');
  assert.equal(canonicalize('hello'), '"hello"');
  assert.equal(canonicalize(''), '""');
});

test('canonical-json: object keys sorted lexicographically', () => {
  assert.equal(canonicalize({ b: 1, a: 2 }), '{"a":2,"b":1}');
  assert.equal(canonicalize({ z: 1, A: 2, a: 3 }), '{"A":2,"a":3,"z":1}'); // UTF-16 order: A=65 < a=97 < z=122
});

test('canonical-json: nested objects sort at every level', () => {
  const input = { outer: { z: 1, a: 2 }, alpha: 'x' };
  assert.equal(canonicalize(input), '{"alpha":"x","outer":{"a":2,"z":1}}');
});

test('canonical-json: arrays preserve insertion order', () => {
  assert.equal(canonicalize([3, 1, 2]), '[3,1,2]');
  assert.equal(canonicalize([{ b: 1, a: 2 }, { y: 3, x: 4 }]), '[{"a":2,"b":1},{"x":4,"y":3}]');
});

test('canonical-json: no whitespace between tokens', () => {
  const out = canonicalize({ a: [1, 2], b: { c: 3 } });
  assert.ok(!/\s/.test(out), `expected no whitespace, got: ${out}`);
});

test('canonical-json: rejects NaN', () => {
  assert.throws(() => canonicalize(NaN), /non-finite/);
});

test('canonical-json: rejects Infinity', () => {
  assert.throws(() => canonicalize(Infinity), /non-finite/);
  assert.throws(() => canonicalize(-Infinity), /non-finite/);
});

test('canonical-json: rejects undefined (top-level and as object value)', () => {
  assert.throws(() => canonicalize(undefined), /undefined/);
  assert.throws(() => canonicalize({ a: undefined }), /undefined/);
});

test('canonical-json: rejects BigInt', () => {
  assert.throws(() => canonicalize(1n), /BigInt/);
});

test('canonical-json: rejects Function', () => {
  assert.throws(() => canonicalize(() => 1), /Function/);
});

test('canonical-json: rejects Symbol', () => {
  assert.throws(() => canonicalize(Symbol('x')), /Symbol/);
});

test('canonical-json: nested NaN throws (rejection propagates)', () => {
  assert.throws(() => canonicalize({ a: { b: NaN } }), /non-finite/);
  assert.throws(() => canonicalize([1, NaN, 3]), /non-finite/);
});

test('canonical-json: parseCanonical round-trips standard JSON', () => {
  const obj = { a: [1, 2, 3], b: 'hello', c: null };
  const bytes = canonicalize(obj);
  assert.deepEqual(parseCanonical(bytes), obj);
});

test('canonical-json: stable bytes for permuted-key objects', () => {
  const a = { x: 1, y: 2, z: 3 };
  const b = { z: 3, y: 2, x: 1 };
  assert.equal(canonicalize(a), canonicalize(b));
});

test('canonical-json: sha256OfCanonical produces stable 64-char hex', () => {
  const obj = { a: 1, b: [2, 3], c: { d: 4 } };
  const h1 = sha256OfCanonical(obj);
  const h2 = sha256OfCanonical(obj);
  assert.equal(h1, h2, 'sha256 should be stable across invocations');
  assert.equal(h1.length, 64, 'sha256 hex digest should be 64 chars');
  assert.match(h1, /^[0-9a-f]{64}$/, 'sha256 hex digest should be lowercase hex');
});

test('canonical-json: sha256OfCanonical golden value (regression anchor)', () => {
  // Golden anchor for cross-Node-version stability.
  // Object: { a: 1 } → canonical: '{"a":1}' → sha256: explicit hex below.
  const expected = createHash('sha256').update('{"a":1}', 'utf8').digest('hex');
  assert.equal(sha256OfCanonical({ a: 1 }), expected);
});

test('canonical-json: string escaping matches JSON spec', () => {
  // Standard JSON escaping for control characters and quotes
  assert.equal(canonicalize('a"b'), '"a\\"b"');
  assert.equal(canonicalize('a\\b'), '"a\\\\b"');
  assert.equal(canonicalize('a\nb'), '"a\\nb"');
});

test('canonical-json: integer rendering uses Number.toString (no trailing zeros for floats)', () => {
  assert.equal(canonicalize(1.0), '1');     // Number(1).toString() === '1'
  assert.equal(canonicalize(1.5), '1.5');
  assert.equal(canonicalize(0.001), '0.001');
});
