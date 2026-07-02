import { describe, expect, it } from "vitest";

import { haversineMeters } from "@/lib/util/haversine";
import { parseGpx } from "@/lib/parsers/gpx";
import { ParseError } from "@/lib/parsers/types";
import { isValidFitHeader } from "@/lib/parsers/fit";
import {
  UploadError,
  assertParsedInBounds,
  classifyUpload,
} from "@/lib/upload/validate";

const enc = (s: string) => new TextEncoder().encode(s);

const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><trkseg>
<trkpt lat="52.0000" lon="4.0000"><time>2026-07-02T08:00:00Z</time></trkpt>
<trkpt lat="52.0010" lon="4.0000"><time>2026-07-02T08:05:00Z</time></trkpt>
<trkpt lat="52.0020" lon="4.0000"><time>2026-07-02T08:10:00Z</time></trkpt>
</trkseg></trk></gpx>`;

/** Minimal valid FIT header: byte0=12, ".FIT" at bytes 8..11. */
function fitHeader(): Uint8Array {
  const b = new Uint8Array(12);
  b[0] = 12;
  b.set(enc(".FIT"), 8);
  return b;
}

describe("haversineMeters", () => {
  it("is ~0 for identical points and ~111m per 0.001° latitude", () => {
    expect(haversineMeters(52, 4, 52, 4)).toBeCloseTo(0, 5);
    expect(haversineMeters(52.0, 4, 52.001, 4)).toBeGreaterThan(100);
    expect(haversineMeters(52.0, 4, 52.001, 4)).toBeLessThan(120);
  });
});

describe("parseGpx", () => {
  it("extracts distance, duration and start time", () => {
    const r = parseGpx(GPX);
    expect(r.pointCount).toBe(3);
    expect(r.distanceM).toBeGreaterThan(200);
    expect(r.distanceM).toBeLessThan(260);
    expect(r.durationS).toBe(600); // 08:00 → 08:10
    expect(r.startedAt).toBe("2026-07-02T08:00:00.000Z");
  });

  it("rejects a DOCTYPE (XXE / billion-laughs guard)", () => {
    const evil = `<?xml version="1.0"?>\n<!DOCTYPE gpx [ <!ENTITY x "y"> ]>\n<gpx></gpx>`;
    expect(() => parseGpx(evil)).toThrow(ParseError);
  });

  it("rejects non-GPX input", () => {
    expect(() => parseGpx("<html></html>")).toThrow(ParseError);
  });
});

describe("isValidFitHeader", () => {
  it("accepts a well-formed FIT header and rejects a bad one", () => {
    expect(isValidFitHeader(fitHeader())).toBe(true);
    const bad = fitHeader();
    bad[8] = 0x00; // corrupt the magic
    expect(isValidFitHeader(bad)).toBe(false);
    expect(isValidFitHeader(new Uint8Array(4))).toBe(false);
  });
});

describe("classifyUpload", () => {
  it("classifies GPX by extension + content sniff", () => {
    expect(classifyUpload("run.gpx", enc(GPX))).toBe("gpx");
  });

  it("classifies FIT by magic bytes", () => {
    expect(classifyUpload("run.fit", fitHeader())).toBe("fit");
  });

  it("rejects empty, oversize, wrong-extension, and spoofed content", () => {
    expect(() => classifyUpload("run.gpx", new Uint8Array(0))).toThrow(UploadError);
    expect(() => classifyUpload("run.txt", enc(GPX))).toThrow(UploadError);
    expect(() => classifyUpload("run.gpx", enc("not xml"))).toThrow(UploadError);
    expect(() => classifyUpload("run.fit", enc("XXXXXXXXnope"))).toThrow(UploadError);
    expect(() =>
      classifyUpload("big.gpx", new Uint8Array(5 * 1024 * 1024 + 1)),
    ).toThrow(UploadError);
  });
});

describe("assertParsedInBounds", () => {
  it("accepts sane values and rejects absurd ones", () => {
    expect(() => assertParsedInBounds(5000, 1800)).not.toThrow();
    expect(() => assertParsedInBounds(-1, 100)).toThrow(UploadError);
    expect(() => assertParsedInBounds(600_000, 100)).toThrow(UploadError);
    expect(() => assertParsedInBounds(5000, 90_000)).toThrow(UploadError);
  });
});
