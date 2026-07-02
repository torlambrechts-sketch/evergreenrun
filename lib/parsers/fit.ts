import { ParseError } from "./types";

/**
 * FIT is a binary format. Full record decoding is deliberately out of scope for
 * this slice (it is its own untrusted-binary decoder). Here we strictly validate
 * the FIT header so we only ever accept genuine FIT files; the raw payload is
 * retained (run_activity.raw_payload) for reprocessing once the decoder lands.
 *
 * FIT header layout: byte 0 = header size (12 or 14), bytes 8..11 = ".FIT".
 */
export function isValidFitHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const headerSize = bytes[0];
  if (headerSize !== 12 && headerSize !== 14) return false;
  if (bytes.length < headerSize) return false;
  const magic = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  return magic === ".FIT";
}

/** Throws ParseError if the bytes are not a well-formed FIT file. */
export function assertValidFit(bytes: Uint8Array): void {
  if (!isValidFitHeader(bytes)) {
    throw new ParseError("Not a valid FIT file.");
  }
}
