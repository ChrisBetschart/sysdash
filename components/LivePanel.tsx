"use client";

import { useCallback, useEffect, useState } from "react";
import Tile from "@/components/Tile";
import { getStatus } from "@/lib/status";
import { parseMetar, metarToTiles, type MetricTile } from "@/lib/metar";
import { parseWeather, weatherToTiles } from "@/lib/weather";

export type Source = "metar" | "weather";

type Loaded = { tiles: MetricTile[]; observedAt?: string };

// One loader per source. Record<Source, ...> forces every source to be handled.
const loaders: Record<Source, (res: Response) => Promise<Loaded>> = {
  metar: async (res) => {
    const m = parseMetar(await res.text()); // XML
    return { tiles: m ? metarToTiles(m) : [], observedAt: m?.observedAt };
  },
  weather: async (res) => {
    const w = parseWeather(await res.json()); // JSON
    return { tiles: w ? weatherToTiles(w) : [], observedAt: w?.observedAt };
  },
};

// Last successful result per source, kept in localStorage.
type Cached = { tiles: MetricTile[]; observedAt?: string; fetchedAt: number };

const cacheKey = (source: Source) => `sysdash:last:${source}`;

function saveCache(source: Source, data: Cached): void {
  try {
    localStorage.setItem(cacheKey(source), JSON.stringify(data));
  } catch {
    // Storage full or blocked (private mode): dashboard still works, just without cache.
  }
}

function readCache(source: Source): Cached | null {
  try {
    const raw = localStorage.getItem(cacheKey(source));
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    // Never trust stored data blindly: check the shape first.
    if (
      typeof data === "object" && data !== null &&
      "tiles" in data && Array.isArray(data.tiles) && data.tiles.length > 0 &&
      "fetchedAt" in data && typeof data.fetchedAt === "number"
    ) {
      return data as Cached;
    }
    return null;
  } catch {
    return null; // Corrupt JSON counts as "no cache".
  }
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | {
      kind: "success";
      tiles: MetricTile[];
      observedAt?: string;
      fetchedAt: number;
      stale: boolean; // true = source failed, showing last known value
      reason?: string;
    };

type LivePanelProps = {
  title: string;
  source: Source;
};

export default function LivePanel({ title, source }: LivePanelProps) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const titleId = `${source}-title`;

  const load = useCallback(async () => {
    setState({ kind: "loading" });

    // Source failed: log it and show the last good value if we have one.
    const fallback = (reason: string, detail?: unknown): boolean => {
      console.error(`[LivePanel:${source}] ${reason}`, detail ?? "");
      const cached = readCache(source);
      if (!cached) return false;
      setState({ kind: "success", ...cached, stale: true, reason });
      return true;
    };

    try {
      const res = await fetch(`/api/${source}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          res.status === 429 ? "Zu viele Anfragen, bitte später erneut versuchen." : `Serverfehler (${res.status})`,
        );
      }
      const { tiles, observedAt } = await loaders[source](res);

      if (tiles.length === 0) {
        if (!fallback("Antwort enthielt keine gültigen Messwerte")) setState({ kind: "empty" });
        return;
      }

      const fresh: Cached = { tiles, observedAt, fetchedAt: Date.now() };
      saveCache(source, fresh);
      setState({ kind: "success", ...fresh, stale: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unbekannter Fehler";
      if (!fallback(message, e)) setState({ kind: "error", message });
    }
  }, [source]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-labelledby={titleId} className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-xl font-semibold text-fg">{title}</h2>
            {state.kind === "success" && state.stale && (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                veraltet
              </span>
            )}
          </div>
          {state.kind === "success" && state.observedAt && (
            <p className="text-sm text-muted">
              Gemessen: {new Date(state.observedAt).toLocaleString("de-CH")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={state.kind === "loading"}
          className="rounded-lg bg-raised px-4 py-2 text-sm font-medium text-fg hover:bg-raised-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          {state.kind === "loading" ? "Lädt…" : "Aktualisieren"}
        </button>
      </div>

      <div aria-live="polite">
        {state.kind === "loading" && <p className="text-muted">Daten werden geladen…</p>}

        {state.kind === "error" && (
          <p role="alert" className="rounded-xl bg-crit-soft px-4 py-3 text-crit">
            Daten konnten nicht geladen werden: {state.message}
          </p>
        )}

        {state.kind === "empty" && <p className="text-muted">Keine aktuellen Messwerte verfügbar.</p>}

        {state.kind === "success" && state.stale && (
          <p className="mb-3 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
            Quelle nicht erreichbar ({state.reason}). Angezeigt wird der letzte Stand vom{" "}
            {new Date(state.fetchedAt).toLocaleString("de-CH")}.
          </p>
        )}

        {state.kind === "success" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.tiles.map((t) => (
              <Tile key={t.id} title={t.title} value={t.value} unit={t.unit} status={getStatus(t.value, t.limits)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}