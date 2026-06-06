/**
 * tests/claim-grep-gate-test.js
 *
 * Cycle-004 Sprint 03 — T3.7 (claim-grep gate). SPRINT-PLAN §6.4 / SDD §15 / HS-7 [G7].
 *
 * Sweeps the cycle-004 artifacts, the proof harness, and the Sprint 03 tests for
 * the SDD §15 forbidden-claim phrases and asserts each occurrence is a NEGATION, a
 * forbidden-list DEFINITION, or a HISTORICAL-CEILING statement — never a bare
 * positive claim.
 *
 * HEURISTIC (documented, intentionally conservative). A line containing a
 * forbidden phrase is SAFE iff EITHER:
 *   (a) the matched phrase is a QUOTED MENTION on that line — wrapped in backticks,
 *       straight or smart quotes (used-mention distinction: `calibration improved`
 *       or "calibration improved" DEFINES/quotes the forbidden phrase, it does not
 *       assert it); OR
 *   (b) the same line ALSO contains a negation / definition / ceiling / rung-ladder
 *       MARKER (see MARKERS).
 * This mirrors the repo's lightweight `assert.doesNotMatch` convention
 * (cycle-002-entrypoint-test.js) but is negation/mention-aware so the planning docs
 * (which DEFINE the forbidden list and the rung ladder, and state the historical
 * T4-only ceiling) pass without edits. The risk profile is a missed positive (false
 * negative), not a false alarm; all swept prose is author-controlled and kept
 * negation-framed. The forbidden phrases in THIS file are stored with a `note`
 * carrying "forbidden"/"negation" so its own definition lines are SAFE by rule (b).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// SDD §15 forbidden positive-claim phrases. `note` carries "forbidden"/"negation"
// so this file's own definition lines pass the same SAFE rule. Matching is
// case-insensitive and hyphen/space-flexible.
const FORBIDDEN = [
  { phrase: 'calibration improved', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'calibration-improved', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'forecasting accuracy', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'predictive uplift', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'empirical performance improvement', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'L2 publish-ready', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'runtime-sensitive', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'new rung earned', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'Baseline A vs Baseline B uplift', note: 'forbidden positive claim; allowed only as negation' },
  { phrase: 'new-corpus baseline uplift', note: 'forbidden positive claim; allowed only as negation' },
];

// Negation / definition / ceiling / rung-ladder markers (lowercased substring).
const MARKERS = [
  // negation
  'no ', 'not ', 'never', 'without', 'forbidden', 'prohibit', 'cannot', "can't",
  'must not', 'do not', 'does not', "doesn't", 'is not', 'are not', "isn't", "aren't",
  'no claim', 'not claimed', 'no scoring', 'no rung', 'banks no', 'not banked',
  'not improved', 'n/a', '≠', '!=',
  // definition / list framing
  'negation', 'definition', 'defined', 'disclaim', 'only as', 'allowed only', 'forbidden list',
  // ceiling / historical / gating framing
  'ceiling', 'remains unchanged', 'unweakened', 'unchanged', 'historical', 'gated',
  'rung 1', 'rung 2', 'rung 3', 'rung 4', 'rung ladder', 'negative control',
  't4-only', 't4 only', 'foreclosed', 'prior-only',
  // allowed-posture continuation ("... claim is made") and list framing
  'claim is made', 'as a banked', 'do not claim', 'appear only', 'appear as',
];

function escapePhrase(p) {
  return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]+');
}
// Bare occurrence (potential claim).
function phraseRegex(p) {
  return new RegExp(escapePhrase(p), 'i');
}
// Quoted MENTION: phrase appears anywhere INSIDE a single quoted span (backtick,
// straight quote, or smart quote). The `[^q]*` guards keep a match from spanning
// across two unrelated quoted spans, so a bare claim outside quotes is not
// falsely excused. Catches longer quoted tokens too, e.g. `T1/T2 runtime-sensitive`.
function wrappedMentionRegex(p) {
  const ph = escapePhrase(p);
  const alts = [
    '`[^`]*' + ph + '[^`]*`',
    '"[^"]*' + ph + '[^"]*"',
    "'[^']*" + ph + "[^']*'",
    '\\u201c[^\\u201c\\u201d]*' + ph + '[^\\u201c\\u201d]*\\u201d',
    '\\u2018[^\\u2018\\u2019]*' + ph + '[^\\u2018\\u2019]*\\u2019',
  ];
  return new RegExp(alts.join('|'), 'i');
}
const REGEXES = FORBIDDEN.map((f) => ({
  ...f,
  re: phraseRegex(f.phrase),
  wrapped: wrappedMentionRegex(f.phrase),
}));

const hasMarker = (line) => {
  const low = line.toLowerCase();
  return MARKERS.some((m) => low.includes(m));
};
// SAFE iff a quoted mention of THIS phrase, or a line-level negation/ceiling marker.
const isSafeOccurrence = (line, f) => f.wrapped.test(line) || hasMarker(line);

function walk(dir, acc, exts) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc, exts);
    else if (exts.some((e) => name.endsWith(e))) acc.push(p);
  }
}

function sweepTargets() {
  const files = [];
  // (1) all cycle-004 a2a artifacts (.md + .json): PRD/SDD/sprint-plan + proof outputs + sprint dirs.
  walk(resolve(REPO_ROOT, 'grimoires/loa/a2a/cycle-004'), files, ['.md', '.json']);
  // (2) the proof harness.
  files.push(resolve(REPO_ROOT, 'scripts/corona-backtest-cycle-004-evidence-wiring.js'));
  // (3) the Sprint 03 tests.
  for (const t of [
    'replay-t2-determinism-wired-test.js',
    'replay-t2-wired-vs-ablated-test.js',
    'replay-t2-ablated-equals-baseline-test.js',
    'replay-t1-negative-control-test.js',
    'cycle-002-frozen-corpus-regression-test.js',
    'no-walltime-no-random-test.js',
    'no-param-diff-test.js',
    'claim-grep-gate-test.js',
  ]) files.push(resolve(REPO_ROOT, 'tests', t));
  return files;
}

test('no forbidden positive claims in cycle-004 artifacts (negations/definitions/ceiling only)', () => {
  const violations = [];
  let scanned = 0;
  for (const file of sweepTargets()) {
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    scanned++;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const f of REGEXES) {
        if (f.re.test(line) && !isSafeOccurrence(line, f)) {
          violations.push(`${relative(REPO_ROOT, file)}:${i + 1}  [${f.phrase}]  ${line.trim().slice(0, 160)}`);
        }
      }
    }
  }
  console.log(`[T3.7] swept ${scanned} files; ${violations.length} forbidden-positive-claim violation(s)`);
  assert.equal(violations.length, 0,
    `forbidden positive claim(s) found (must be negation/definition/ceiling only):\n  ${violations.join('\n  ')}`);
});
