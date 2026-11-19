// Layer for transport.opendata.ch. Only this file knows the API's structure.
export type Health = "ok" | "degraded" | "down";

type Snapshot = { minutes: number; departures: number; fetchedAt: number };

export type TransportResult =
  | ({ health: "ok" } & Snapshot)
  | ({ health: "degraded"; reason: string } & Snapshot)
  | { health: "down"; reason: string };

const URL = "https://transport.opendata.ch/v1/stationboard?station=Luzern&limit=5";

// Last good value in server memory. Kept on globalThis so it survives hot reload in dev.
const store = globalThis as typeof globalThis & { __transportLast?: Snapshot };

// Tolerant reader: only stationboard[].stop.departureTimestamp is read.
// Entries without a valid timestamp are skipped, never guessed.
function readDepartures(data: unknown): number[] | null {
  if (typeof data !== "object" || data === null || !("stationboard" in data)) return null;
  const board: unknown = data.stationboard;
  if (!Array.isArray(board)) return null;

  const times: number[] = [];
  for (const entry of board) {
    const ts = (entry as { stop?: { departureTimestamp?: unknown } } | null)?.stop?.departureTimestamp;
    if (typeof ts === "number" && Number.isFinite(ts)) times.push(ts);
  }
  return times;
}

// The only function the rest of the app calls.
export async function getTransportStatus(): Promise<TransportResult> {
  try {
    const res = await fetch(URL, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const times = readDepartures(await res.json());
    if (!times || times.length === 0) throw new Error("Keine Abfahrten in der Antwort");

    // Unix timestamp in seconds -> minutes from now, never negative.
    const next = Math.min(...times);
    const minutes = Math.max(0, Math.round((next * 1000 - Date.now()) / 60000));

    const snapshot: Snapshot = { minutes, departures: times.length, fetchedAt: Date.now() };
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