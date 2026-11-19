// Layer for transport.opendata.ch. Only this file knows the API's structure.
export type Health = "ok" | "degraded" | "down";

type Snapshot = {
  minutes: number;      // minutes until next departure
  departureAt: number;  // departure time in ms
  station?: string;     // e.g. "Luzern"
  line?: string;        // e.g. "S5", "IR VAE"
  to?: string;          // destination, e.g. "Giswil"
  platform?: string;    // e.g. "14"
  fetchedAt: number;
};

export type TransportResult =
  | ({ health: "ok" } & Snapshot)
  | ({ health: "degraded"; reason: string } & Snapshot)
  | { health: "down"; reason: string };

const URL = "https://transport.opendata.ch/v1/stationboard?station=Luzern&limit=5";

// Last good value in server memory. Kept on globalThis so it survives hot reload in dev.
const store = globalThis as typeof globalThis & { __transportLast?: Snapshot };

type Departure = { ts: number; line?: string; to?: string; platform?: string };

// Non-empty string or undefined. Anything else (null, number, object) is ignored.
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// "S" + "5" -> "S5", "IR" + "VAE" -> "IR VAE"
function lineName(category?: string, number?: string): string | undefined {
  if (category && number) return /^\d+$/.test(number) ? category + number : `${category} ${number}`;
  return category ?? number;
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
      stop?: { departureTimestamp?: unknown; platform?: unknown };
    } | null;

    const ts = e?.stop?.departureTimestamp;
    if (typeof ts !== "number" || !Number.isFinite(ts)) continue;

    departures.push({
      ts,
      line: lineName(str(e?.category), str(e?.number)),
      to: str(e?.to),
      platform: str(e?.stop?.platform),
    });
  }
  return { station, departures };
}

// The only function the rest of the app calls.
export async function getTransportStatus(): Promise<TransportResult> {
  try {
    const res = await fetch(URL, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const parsed = readBoard(await res.json());
    if (!parsed || parsed.departures.length === 0) throw new Error("Keine Abfahrten in der Antwort");

    // Earliest departure first.
    const next = [...parsed.departures].sort((a, b) => a.ts - b.ts)[0];
    const departureAt = next.ts * 1000; // Unix seconds -> ms

    const snapshot: Snapshot = {
      minutes: Math.max(0, Math.round((departureAt - Date.now()) / 60000)),
      departureAt,
      station: parsed.station,
      line: next.line,
      to: next.to,
      platform: next.platform,
      fetchedAt: Date.now(),
    };
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