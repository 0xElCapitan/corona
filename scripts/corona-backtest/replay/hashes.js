/**
 * scripts/corona-backtest/replay/hashes.js
 *
 * SHA-256 hashing over canonicalized JSON for cycle-002 PredictionTrajectory provenance.
 *
 * Sprint 2 deliverable per:
 *   - grimoires/loa/a2a/cycle-002/sprint-01/CONTRACT.md §10 (four hashes)
 *   - grimoires/loa/a2a/cycle-002/sprint-02/REPLAY-SEAM.md §8
 *
 * Hash computation order for trajectory_hash (CONTRACT §10 + REPLAY-SEAM §8.2):
 *   1. Build trajectory with meta.trajectory_hash = "" (sentinel).
 *   2. Canonicalize entire trajectory.
 *   3. SHA-256 → hex.
 *   4. Replace meta.trajectory_hash with the hex digest.
 *
 * Verifier replays the same procedure on a received trajectory.
 *
 * Zero runtime dependencies (uses node:crypto). Node 20+.
 */

import { createHash } from 'node:crypto';
import { canonicalize } from './canonical-json.js';

export function sha256OfCanonical(value) {
  return createHash('sha256').update(canonicalize(value), 'utf8').digest('hex');
}

export function computeTrajectoryHash(trajectory) {
  // structuredClone preserves null vs undefined and is faster than JSON round-trip.
  // Node 17+ has structuredClone in globals; Node 20 (pinned in package.json engines) is safe.
  const clone = structuredClone(trajectory);
  if (!clone || typeof clone !== 'object') {
    throw new Error('compute-trajectory-hash: trajectory must be an object');
  }
  if (!clone.meta || typeof clone.meta !== 'object') {
    throw new Error('compute-trajectory-hash: trajectory.meta must be an object');
  }
  clone.meta.trajectory_hash = '';
  return sha256OfCanonical(clone);
}

export function verifyTrajectoryHash(trajectory) {
  const embedded = trajectory?.meta?.trajectory_hash;
  if (typeof embedded !== 'string' || embedded.length !== 64) return false;
  let recomputed;
  try {
    recomputed = computeTrajectoryHash(trajectory);
  } catch {
    return false;
  }
  return embedded === recomputed;
}
