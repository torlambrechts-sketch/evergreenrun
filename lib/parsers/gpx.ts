import { XMLParser } from "fast-xml-parser";

import { haversineMeters } from "@/lib/util/haversine";
import { ParseError, type ParsedActivity } from "./types";

/**
 * Parse a GPX (XML) track into a normalised activity summary.
 *
 * Treated as HOSTILE input:
 *  - DOCTYPE is rejected outright (blocks XXE and billion-laughs entity attacks).
 *  - Entity processing is disabled in the parser.
 *  - Only attributes/values we expect are read; everything else is ignored.
 *  - Parsed numbers are re-validated by the caller against domain bounds.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  ignoreDeclaration: true,
  processEntities: false, // do not expand XML entities
  parseTagValue: false,
});

interface TrkPt {
  "@_lat"?: string;
  "@_lon"?: string;
  time?: string;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function parseGpx(text: string): ParsedActivity {
  if (/<!DOCTYPE/i.test(text)) {
    throw new ParseError("GPX with a DOCTYPE is not allowed.");
  }
  if (!/<gpx[\s>]/i.test(text)) {
    throw new ParseError("Not a GPX file.");
  }

  let doc: unknown;
  try {
    doc = parser.parse(text);
  } catch {
    throw new ParseError("Could not parse the GPX file.");
  }

  const gpx = (doc as Record<string, unknown>)?.gpx as
    | Record<string, unknown>
    | undefined;
  if (!gpx) throw new ParseError("GPX file has no <gpx> root.");

  // Collect trackpoints across all tracks/segments (or a route as a fallback).
  const points: TrkPt[] = [];
  for (const trk of asArray(gpx.trk as unknown)) {
    for (const seg of asArray((trk as Record<string, unknown>).trkseg)) {
      points.push(...asArray((seg as Record<string, unknown>).trkpt as TrkPt));
    }
  }
  if (points.length === 0) {
    for (const rte of asArray(gpx.rte as unknown)) {
      points.push(...asArray((rte as Record<string, unknown>).rtept as TrkPt));
    }
  }

  if (points.length < 2) {
    throw new ParseError("GPX file has no usable track.");
  }

  let distanceM = 0;
  let prevLat: number | null = null;
  let prevLon: number | null = null;
  const times: number[] = [];

  for (const p of points) {
    const lat = Number(p["@_lat"]);
    const lon = Number(p["@_lon"]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    if (prevLat !== null && prevLon !== null) {
      distanceM += haversineMeters(prevLat, prevLon, lat, lon);
    }
    prevLat = lat;
    prevLon = lon;

    if (typeof p.time === "string") {
      const t = Date.parse(p.time);
      if (!Number.isNaN(t)) times.push(t);
    }
  }

  let startedAt: string | null = null;
  let durationS: number | null = null;
  if (times.length >= 2) {
    const first = Math.min(...times);
    const last = Math.max(...times);
    startedAt = new Date(first).toISOString();
    durationS = Math.max(0, Math.round((last - first) / 1000));
  } else if (times.length === 1) {
    startedAt = new Date(times[0]).toISOString();
  }

  return {
    startedAt,
    distanceM: Math.round(distanceM),
    durationS,
    pointCount: points.length,
  };
}
