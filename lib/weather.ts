import type { MetricTile } from "@/lib/metar";

export type Weather = {
  observedAt?: string;
  tempC?: number;
  humidity?: number;
  windKmh?: number;
  rainMmH?: number; // only present when it rains
};

// Accept only real numbers, everything else -> undefined.
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

// Shape we expect, every field optional: we trust nothing.
type OwmResponse = {
  dt?: unknown;
  main?: { temp?: unknown; humidity?: unknown };
  wind?: { speed?: unknown };
  rain?: { "1h"?: unknown };
};

export function parseWeather(json: unknown): Weather | null {
  if (typeof json !== "object" || json === null) return null;
  const d = json as OwmResponse;

  const temp = num(d.main?.temp);
  const windMs = num(d.wind?.speed);
  const dt = num(d.dt);

  return {
    observedAt: dt !== undefined ? new Date(dt * 1000).toISOString() : undefined,
    tempC: temp !== undefined ? Math.round(temp * 10) / 10 : undefined,
    humidity: num(d.main?.humidity),
    windKmh: windMs !== undefined ? Math.round(windMs * 3.6) : undefined,
    rainMmH: num(d.rain?.["1h"]),
  };
}

// Missing values are skipped, so a partial response still renders.
export function weatherToTiles(w: Weather): MetricTile[] {
  const tiles: MetricTile[] = [];
  if (w.tempC !== undefined)
    tiles.push({ id: "owm-temp", title: "Temperatur Luzern", value: w.tempC, unit: "°C",
      limits: { critLow: -10, warnLow: 0, warnHigh: 30, critHigh: 35 } });
  if (w.humidity !== undefined)
    tiles.push({ id: "owm-hum", title: "Luftfeuchte Luzern", value: w.humidity, unit: "%",
      limits: { critLow: 15, warnLow: 25 } });
  if (w.windKmh !== undefined)
    tiles.push({ id: "owm-wind", title: "Wind Luzern", value: w.windKmh, unit: "km/h",
      limits: { warnHigh: 40, critHigh: 60 } });
  if (w.rainMmH !== undefined)
    tiles.push({ id: "owm-rain", title: "Niederschlag Luzern", value: w.rainMmH, unit: "mm/h",
      limits: { warnHigh: 5, critHigh: 10 } });
  return tiles;
}