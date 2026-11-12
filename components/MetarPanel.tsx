"use client";

import { useCallback, useEffect, useState } from "react";
import Tile from "@/components/Tile";
import { getStatus } from "@/lib/status";
import { parseMetar, metarToTiles, type MetricTile } from "@/lib/metar";

// Every possible UI state, as a union type.
type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "success"; tiles: MetricTile[]; observedAt?: string };

export default function MetarPanel() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/metar", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          res.status === 429 ? "Zu viele Anfragen, bitte später erneut versuchen." : `Serverfehler (${res.status})`,
        );
      }
      const metar = parseMetar(await res.text());
      const tiles = metar ? metarToTiles(metar) : [];
      setState(tiles.length > 0 ? { kind: "success", tiles, observedAt: metar?.observedAt } : { kind: "empty" });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Unbekannter Fehler" });
    }
  }, []);

  // Load once when the component appears.
  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-labelledby="metar-title" className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 id="metar-title" className="text-xl font-semibold text-white">Flughafen Zürich (METAR)</h2>
          {state.kind === "success" && state.observedAt && (
            <p className="text-sm text-slate-400">
              Gemessen: {new Date(state.observedAt).toLocaleString("de-CH")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={state.kind === "loading"}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
        >
          {state.kind === "loading" ? "Lädt…" : "Aktualisieren"}
        </button>
      </div>

      <div aria-live="polite">
        {state.kind === "loading" && <p className="text-slate-400">Daten werden geladen…</p>}

        {state.kind === "error" && (
          <p role="alert" className="rounded-xl bg-red-900 px-4 py-3 text-red-100">
            Daten konnten nicht geladen werden: {state.message}
          </p>
        )}

        {state.kind === "empty" && <p className="text-slate-400">Keine aktuellen Messwerte verfügbar.</p>}

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