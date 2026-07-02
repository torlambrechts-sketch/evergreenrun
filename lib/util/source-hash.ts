import "server-only";

import { createHash } from "node:crypto";

/**
 * Deterministic source_hash for a manually logged run, used for duplicate
 * detection (run_activity has a unique index on (user_id, source_hash)).
 *
 * Two manual submissions with the same date + distance + duration hash to the
 * same value, so an accidental double-submit is caught rather than stored twice.
 * The user_id is NOT part of the hash — isolation is handled by the composite
 * unique index and RLS.
 */
export function manualRunSourceHash(input: {
  startedOn: string; // YYYY-MM-DD (the run's calendar day)
  distanceM: number;
  durationS: number;
}): string {
  const canonical = [
    "manual",
    input.startedOn,
    Math.round(input.distanceM),
    Math.round(input.durationS),
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}
