/**
 * tests/security/corpus-loader-low1-test.js
 *
 * Sprint 6 / corona-a6z — C-006 (Sprint 3 audit LOW-1 carry-forward) regression coverage.
 *
 * Verifies that `validateT5` rejects T5 events whose `stale_feed_events`
 * array contains entries with `detection_time < actual_onset_time`. Per
 * `calibration-protocol.md` §3.7.6:
 *
 *   `latency_seconds = detection_time - actual_onset_time`
 *
 * which must be ≥ 0 by physical semantics (detection cannot precede the
 * underlying onset). Pre-Sprint-6, a corpus-authoring error producing a
 * negative latency silently slipped through the loader and was clamped at
 * scoring (`scripts/corona-backtest/scoring/t5-quality-of-behavior.js:183`:
 * `Math.max(0, (detect - onset) / 1000)`). The Sprint 6 fix tightens
 * loader-side validation to surface the corpus error at corpus-load time.
 *
 * Hard constraint #9 (no scoring-semantics changes) is preserved — the
 * Math.max clamp at scoring is unchanged; only the loader is tightened.
 *
 * Per Sprint 6 handoff §6.5 option (A) — corpus validation error.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { _validateT5, _loadEventFile } from '../../scripts/corona-backtest/ingestors/corpus-loader.js';

// Build a minimal T5 event that satisfies all required-field checks except
// the stale_feed_events sub-validation under test. We reuse the same event
// across cases by spreading + overriding stale_feed_events.
function makeBaseT5(overrides = {}) {
  return {
    event_id: 't5-c006-test',
    theatre: 'T5',
    tier: 'primary',
    event_time: '2025-04-01T00:00:00Z',
    goes_satellite: 'GOES-16',
    donki_record_ref: null, // T5 permitted-null per §3.7.1
    detection_window_start: '2025-04-01T00:00:00Z',
    detection_window_end: '2025-04-02T00:00:00Z',
    divergence_signals: [],
    corroborating_alerts: [],
    stale_feed_events: [],
    satellite_switch_events: [],
    anomaly_bulletin_refs: [],
    ...overrides,
  };
}

describe('C-006 / LOW-1 (Sprint 3 carry-forward) — corpus-loader rejects negative-latency stale_feed_events', () => {
  it('accepts T5 event with empty stale_feed_events array (baseline)', () => {
    const event = makeBaseT5();
    const result = _validateT5(event, '/fake/path/t5-baseline.json');
    assert.equal(result.ok, true, 'empty stale_feed_events must remain accepted');
  });

  it('accepts a stale_feed_events entry with zero latency (detection == onset)', () => {
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: '2025-04-01T12:00:00Z',
        detection_time: '2025-04-01T12:00:00Z',
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    const result = _validateT5(event, '/fake/path/t5-zero.json');
    assert.equal(result.ok, true, 'zero-latency entry is the boundary case; must remain accepted');
  });

  it('accepts a stale_feed_events entry with positive latency (detection > onset, normal case)', () => {
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: '2025-04-01T12:00:00Z',
        detection_time: '2025-04-01T12:05:00Z', // 5-minute lag
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    const result = _validateT5(event, '/fake/path/t5-positive.json');
    assert.equal(result.ok, true, 'positive-latency entries are the documented normal case');
  });

  it('REJECTS a stale_feed_events entry with negative latency (detection < onset)', () => {
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: '2025-04-01T12:00:00Z',
        detection_time: '2025-04-01T11:55:00Z', // 5 minutes BEFORE onset → impossible
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    const result = _validateT5(event, '/fake/path/t5-negative.json');
    assert.equal(result.ok, false,
      'negative-latency entry must be rejected at corpus-load time, not silently clamped at scoring');
    assert.ok(result.errors.length >= 1, 'rejection must surface at least one error message');
    const msg = result.errors.join('\n');
    assert.match(msg, /stale_feed_events\[0\]/,
      'error must reference the offending entry index for diagnosis');
    assert.match(msg, /detection_time .* precedes actual_onset_time/,
      'error must explain the violated invariant');
    assert.match(msg, /§3\.7\.6/,
      'error must cite the schema source per Sprint 6 traceability');
  });

  it('REJECTS only the offending entry but reports it; other entries do not mask the failure', () => {
    const event = makeBaseT5({
      stale_feed_events: [
        { // good entry first
          actual_onset_time: '2025-04-01T12:00:00Z',
          detection_time: '2025-04-01T12:01:00Z',
          end_time: '2025-04-01T12:10:00Z',
          satellite: 'DSCOVR',
        },
        { // bad entry second
          actual_onset_time: '2025-04-01T13:00:00Z',
          detection_time: '2025-04-01T12:30:00Z', // 30 min before onset
          end_time: '2025-04-01T13:10:00Z',
          satellite: 'ACE',
        },
      ],
    });
    const result = _validateT5(event, '/fake/path/t5-mixed.json');
    assert.equal(result.ok, false);
    const msg = result.errors.join('\n');
    assert.match(msg, /stale_feed_events\[1\]/,
      'error must reference the offending index (1), not the good index (0)');
  });

  it('accepts entries with null actual_onset_time (validation skipped per "both fields non-null" guard)', () => {
    // The schema permits null onset/detection (e.g., open-ended stale-feed event
    // tracking only end_time). The validator must not synthesize negative latency
    // from null comparisons.
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: null,
        detection_time: '2025-04-01T12:05:00Z',
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    const result = _validateT5(event, '/fake/path/t5-null-onset.json');
    assert.equal(result.ok, true, 'null actual_onset_time must skip the latency invariant check');
  });

  it('accepts entries with null detection_time (validation skipped)', () => {
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: '2025-04-01T12:00:00Z',
        detection_time: null,
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    const result = _validateT5(event, '/fake/path/t5-null-detect.json');
    assert.equal(result.ok, true, 'null detection_time must skip the latency invariant check');
  });

  it('accepts entries with malformed ISO-8601 (deferred to scoring isFinite guard)', () => {
    // Per security-review.md C-003 disposition: corpus-loader does not
    // validate ISO-8601 format for non-T5-stale-feed timestamps. For T5
    // stale_feed entries, malformed strings produce NaN getTime() which
    // skips the negative-latency check. Scoring's isFinite guard at
    // t5-quality-of-behavior.js:174-176 produces latency_seconds: null.
    // Verifying: malformed strings are NOT rejected by C-006 (they are a
    // separate finding, deferred). This test pins the boundary.
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: 'not-a-date',
        detection_time: '2025-04-01T12:05:00Z',
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    const result = _validateT5(event, '/fake/path/t5-bad-iso.json');
    assert.equal(result.ok, true,
      'malformed ISO-8601 in stale_feed_events is C-003 (deferred); C-006 only rejects negative-latency');
  });

  it('accepts null stale_feed_events entries (skipped per null guard)', () => {
    // Defensive: if the corpus author writes a literal null in the array
    // (rare but possible), the validator must not throw and must not
    // synthesize a negative-latency rejection.
    const event = makeBaseT5({
      stale_feed_events: [null],
    });
    const result = _validateT5(event, '/fake/path/t5-null-entry.json');
    assert.equal(result.ok, true,
      'null stale_feed_events entry must be skipped, not throw or synthesize a rejection');
  });

  it('end-to-end: _loadEventFile rejects a malformed event written to a temp file', async () => {
    // Verifies the validation fires at the loader entrypoint, not just
    // when validateT5 is called directly. We stage a file in a temp dir
    // (no node:os imported to avoid expanding deps; use process.cwd()
    // path under tests/security/ which is a known writable location).
    const { writeFileSync, unlinkSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const tmpFile = resolve(process.cwd(), 'tests', 'security', '_t5-c006-tmp.json');
    const event = makeBaseT5({
      stale_feed_events: [{
        actual_onset_time: '2025-04-01T12:00:00Z',
        detection_time: '2025-04-01T11:00:00Z',
        end_time: '2025-04-01T12:30:00Z',
        satellite: 'DSCOVR',
      }],
    });
    writeFileSync(tmpFile, JSON.stringify(event), 'utf8');
    try {
      const result = _loadEventFile(tmpFile);
      assert.equal(result.ok, false, 'end-to-end loader must surface the C-006 rejection');
      assert.ok(result.errors.some((e) => /detection_time .* precedes actual_onset_time/.test(e)));
    } finally {
      unlinkSync(tmpFile);
    }
  });
});
