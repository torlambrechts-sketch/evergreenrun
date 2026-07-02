/** Normalised summary extracted from an uploaded activity file. */
export interface ParsedActivity {
  /** ISO timestamp of the first trackpoint, or null if the file has no times. */
  startedAt: string | null;
  /** Total distance in metres (>= 0). */
  distanceM: number;
  /** Elapsed seconds (first→last time), or null if unavailable. */
  durationS: number | null;
  /** Number of trackpoints/records parsed (diagnostic). */
  pointCount: number;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}
