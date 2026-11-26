// Layer for transport.opendata.ch. Only this file knows the API's structure.
export type Health = "ok" | "degraded" | "down";

export type Departure = {
  ts: number;          // departure, Unix seconds
  line?: string;       // e.g. "S1", "EC 178", "IR VAE"
  to?: string;         // destination
  platform?: string;
  operator?: string;   // e.g. "SBB", "ZB"
};

type Snapshot = { station?: string; departures: Departure[]; fetchedAt: number };

export type TransportResult =
  | ({ health: "ok" } & Snapshot)
  | ({ health: "degraded"; reason: string } & Snapshot)
  | { health: "down"; reason: string };

const URL = "https://transport.opendata.ch/v1/stationboard?station=Luzern&limit=40";

// Last good value in server memory. Kept on globalThis so it survives hot reload in dev.
const store = globalThis as typeof globalThis & { __transportLast?: Snapshot };

// Non-empty string or undefined. Anything else (null, number, object) is ignored.
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// "S" + "1" -> "S1", "EC" + "000178" -> "EC 178", "IR" + "VAE" -> "IR VAE"
function lineName(category?: string, number?: string): string | undefined {
  if (!category || !number) return category ?? number;
  if (/^\d+$/.test(number)) {
    const n = String(Number(number)); // drop leading zeros
    return n.length <= 2 ? category + n : `${category} ${n}`; // short line numbers stay joined
  }
  return `${category} ${number}`;
}

// Tolerant reader: only the fields we need. Entries without a valid timestamp are skipped.
function readBoard(data: unknown): { station?: string; departures: Departure[] } | null {
  if (typeof data !== "object" || data === null || !("stationboard" in data)) return null;
  const board: unknown = data.stationboard;
  if (!Array.isArray(board)) return null;

  const station = "station" in data ? str((data.station as { name?: unknown } | null)?.name) : undefined;

  const departures: Departure[] = [];
  for (const raw of board) {
    const e = raw as {
      category?: unknown;
      number?: unknown;
      to?: unknown;
      operator?: unknown;
      stop?: { departureTimestamp?: unknown; platform?: unknown };
    } | null;

    const ts = e?.stop?.departureTimestamp;
    if (typeof ts !== "number" || !Number.isFinite(ts)) continue;

    departures.push({
      ts,
      line: lineName(str(e?.category), str(e?.number)),
      to: str(e?.to),
      platform: str(e?.stop?.platform),
      operator: str(e?.operator),
    });
  }
  departures.sort((a, b) => a.ts - b.ts); // don't rely on the API's order
  return { station, departures };
}

// The only function that talks to the API.
export async function getTransportStatus(): Promise<TransportResult> {
  try {
    const res = await fetch(URL, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const parsed = readBoard(await res.json());
    if (!parsed || parsed.departures.length === 0) throw new Error("Keine Abfahrten in der Antwort");

    const snapshot: Snapshot = { ...parsed, fetchedAt: Date.now() };
    store.__transportLast = snapshot;
    return { health: "ok", ...snapshot };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Unbekannter Fehler";
    console.error("[transport] Quelle fehlgeschlagen:", reason);

    const last = store.__transportLast;
    if (last) return { health: "degraded", reason, ...last };
    return { health: "down", reason };
  }
}

// Pure function: derives the key figures relative to "now".
// Past departures are dropped, so even an old snapshot shows correct minutes.
export function summarize(departures: Departure[], now: number = Date.now()) {
  const upcoming = departures.filter((d) => d.ts * 1000 >= now - 60_000); // 1 min grace
  const minutes = upcoming.map((d) => Math.max(0, Math.round((d.ts * 1000 - now) / 60_000)));

  let maxGap = minutes[0] ?? 0; // wait until the first departure counts as a gap too
  for (let i = 1; i < minutes.length; i++) maxGap = Math.max(maxGap, minutes[i] - minutes[i - 1]);

  return {
    upcoming,
    minutes,
    countIn30: minutes.filter((m) => m <= 30).length,
    maxGap,
  };
}