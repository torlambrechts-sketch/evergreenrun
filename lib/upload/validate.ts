/**
 * Upload boundary validation. The uploaded file is treated as HOSTILE:
 * size-capped, extension + content-sniffed, and never trusted past this point.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_KINDS = ["gpx", "fit"] as const;
export type UploadKind = (typeof ALLOWED_KINDS)[number];

/** Domain bounds re-checked on parsed values (defence in depth vs the parser). */
export const MAX_DISTANCE_M = 500_000;
export const MAX_DURATION_S = 24 * 60 * 60;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

/**
 * Determine the upload kind from filename + a peek at the bytes, or throw
 * UploadError. Does NOT trust the extension alone — the content is sniffed too.
 */
export function classifyUpload(filename: string, bytes: Uint8Array): UploadKind {
  if (bytes.length === 0) throw new UploadError("The file is empty.");
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new UploadError("That file is too large (max 5 MB).");
  }

  const ext = extensionOf(filename);

  if (ext === ".gpx") {
    // Sniff: GPX is XML and must contain a <gpx ...> element near the top.
    const head = new TextDecoder("utf-8", { fatal: false })
      .decode(bytes.subarray(0, 1024))
      .toLowerCase();
    if (!head.includes("<gpx")) {
      throw new UploadError("This does not look like a GPX file.");
    }
    return "gpx";
  }

  if (ext === ".fit") {
    // Sniff: FIT header carries ".FIT" at bytes 8..11.
    if (bytes.length < 12) throw new UploadError("This does not look like a FIT file.");
    const magic = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (magic !== ".FIT") {
      throw new UploadError("This does not look like a FIT file.");
    }
    return "fit";
  }

  throw new UploadError("Only .gpx and .fit files are supported.");
}

/** Clamp/validate parsed distance & duration against domain bounds. */
export function assertParsedInBounds(distanceM: number, durationS: number | null): void {
  if (!Number.isFinite(distanceM) || distanceM < 0 || distanceM > MAX_DISTANCE_M) {
    throw new UploadError("The file's distance looks invalid.");
  }
  if (durationS != null && (durationS < 0 || durationS > MAX_DURATION_S)) {
    throw new UploadError("The file's duration looks invalid.");
  }
}
