import "server-only";

import { createHash } from "node:crypto";

/**
 * Content hash for a run, used for duplicate detection. run_activity has a unique
 * index on (user_id, source_hash), so two entries that hash the same are treated
 * as the same run.
 *
 * The hash is SOURCE-AGNOSTIC: it is derived from the run's day + distance +
 * duration, not from how it was captured. That means the SAME run logged manually
 * and later uploaded as a GPX collapses to one row (dedup across sources). The
 * user_id is not part of the hash — isolation is handled by the composite unique
 * index and RLS.
 */
export function runContentHash(input: {
  startedOn: string; // YYYY-MM-DD (the run's calendar day)
  distanceM: number;
  durationS: number;
}): string {
  const canonical = [
    "run",
    input.startedOn,
    Math.round(input.distanceM),
    Math.round(input.durationS),
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Fallback hash over raw file bytes, for uploads we can't summarise into a
 * content hash (e.g. FIT files that aren't decoded yet). Dedups re-uploads of the
 * exact same file.
 */
export function fileBytesHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
