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

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "success"; tiles: MetricTile[]; observedAt?: string };

type LivePanelProps = {
  title: string;
  source: Source;
};

export default function LivePanel({ title, source }: LivePanelProps) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const titleId = `${source}-title`;

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/${source}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          res.status === 429 ? "Zu viele Anfragen, bitte später erneut versuchen." : `Serverfehler (${res.status})`,
        );
      }
      const { tiles, observedAt } = await loaders[source](res);
      setState(tiles.length > 0 ? { kind: "success", tiles, observedAt } : { kind: "empty" });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Unbekannter Fehler" });
    }
  }, [source]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-labelledby={titleId} className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-xl font-semibold text-fg">{title}</h2>
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