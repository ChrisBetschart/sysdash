import type { Limits } from "@/lib/status";

// All fields optional: METAR data is not guaranteed to be complete.
export type Metar = {
  observedAt?: string;
  tempC?: number;
  windKt?: number;
  visibilityKm?: number;
  pressureHpa?: number;
};

export type MetricTile = {
  id: string;
  title: string;
  value: number;
  unit: string;
  limits?: Limits;
};

// Read a number from a child element. Missing or invalid -> undefined.
function readNumber(el: Element, tag: string): number | undefined {
  const text = el.querySelector(tag)?.textContent;
  if (text == null) return undefined;
  const n = parseFloat(text); // "6+" -> 6
  return Number.isFinite(n) ? n : undefined;
}

// Parse METAR XML. Returns null if the XML is broken or has no report.
export function parseMetar(xml: string): Metar | null {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) return null;

  const report = doc.querySelector("METAR");
  if (!report) return null;

  const visMi = readNumber(report, "visibility_statute_mi");
  const pressureInHg = readNumber(report, "altim_in_hg");

  return {
    observedAt: report.querySelector("observation_time")?.textContent ?? undefined,
    tempC: readNumber(report, "temp_c"),
    windKt: readNumber(report, "wind_speed_kt"),
    visibilityKm: visMi !== undefined ? Math.round(visMi * 1.609) : undefined,
    pressureHpa: pressureInHg !== undefined ? Math.round(pressureInHg * 33.8639) : undefined,
  };
}

// Turn parsed data into tiles. Missing values are simply skipped.
export function metarToTiles(m: Metar): MetricTile[] {
  const tiles: MetricTile[] = [];
  if (m.tempC !== undefined)
    tiles.push({ id: "metar-temp", title: "Temperatur ZRH", value: m.tempC, unit: "°C",
      limits: { critLow: -10, warnLow: 0, warnHigh: 30, critHigh: 35 } });
  if (m.windKt !== undefined)
    tiles.push({ id: "metar-wind", title: "Wind ZRH", value: m.windKt, unit: "kt",
      limits: { warnHigh: 20, critHigh: 30 } });
  if (m.visibilityKm !== undefined)
    tiles.push({ id: "metar-vis", title: "Sicht ZRH", value: m.visibilityKm, unit: "km",
      limits: { critLow: 1, warnLow: 5 } });
  if (m.pressureHpa !== undefined)
    tiles.push({ id: "metar-qnh", title: "Luftdruck ZRH", value: m.pressureHpa, unit: "hPa" });
  return tiles;
}