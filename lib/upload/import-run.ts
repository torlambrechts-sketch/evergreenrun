import "server-only";

import { logUploadedRun, type LogRunResult } from "@/lib/db/run-activity";
import { assertValidFit } from "@/lib/parsers/fit";
import { parseGpx } from "@/lib/parsers/gpx";
import { ParseError } from "@/lib/parsers/types";
import { fileBytesHash, runContentHash } from "@/lib/util/source-hash";
import {
  UploadError,
  assertParsedInBounds,
  classifyUpload,
} from "@/lib/upload/validate";

/**
 * Import a run from an uploaded FIT/GPX file. Everything is validated at this
 * boundary before any DB write; the raw payload is always retained for
 * reprocessing.
 *
 * - GPX: parsed to a distance/duration summary; source_hash is the source-
 *   agnostic content hash, so it dedups against an equivalent manual entry.
 * - FIT: header-validated and stored raw only (full binary decode is a later
 *   slice); source_hash falls back to the file-bytes hash (dedups re-uploads).
 *
 * Throws UploadError / ParseError on bad input.
 */
export async function importRunFromUpload(
  filename: string,
  bytes: Uint8Array,
): Promise<LogRunResult> {
  const kind = classifyUpload(filename, bytes);

  if (kind === "gpx") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const parsed = parseGpx(text);
    assertParsedInBounds(parsed.distanceM, parsed.durationS);

    // Content hash needs a day + duration; otherwise fall back to file bytes.
    const sourceHash =
      parsed.startedAt && parsed.durationS != null
        ? runContentHash({
            startedOn: parsed.startedAt.slice(0, 10),
            distanceM: parsed.distanceM,
            durationS: parsed.durationS,
          })
        : fileBytesHash(bytes);

    return logUploadedRun({
      source: "gpx",
      sourceHash,
      startedAt: parsed.startedAt,
      distanceM: parsed.distanceM,
      durationS: parsed.durationS,
      rawPayload: { format: "gpx", text },
    });
  }

  // FIT: validate header, retain raw payload (base64), defer decoding.
  assertValidFit(bytes);
  return logUploadedRun({
    source: "fit",
    sourceHash: fileBytesHash(bytes),
    startedAt: null,
    distanceM: null,
    durationS: null,
    rawPayload: {
      format: "fit",
      encoding: "base64",
      data: Buffer.from(bytes).toString("base64"),
      note: "Retained for reprocessing; FIT decoding not yet enabled.",
    },
  });
}

export { UploadError, ParseError };
