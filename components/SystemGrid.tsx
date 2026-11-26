"use client";

import { useState } from "react";
import Tile from "@/components/Tile";
import SystemForm from "@/components/SystemForm";
import { splitMatch, visibleSystems, type SortKey, type SystemRow } from "@/lib/systemLogic";

// Re-export so existing imports keep working.
export type { SystemRow };

// Labels only (no logic). Record<SortKey, ...> forces a label for every key.
const SORT_LABELS: Record<SortKey, string> = { severity: "Schwere", name: "Name" };

// Renders the parts from splitMatch(). The decision is made in systemLogic.ts.
function Highlight({ text, query }: { text: string; query: string }) {
  const parts = splitMatch(text, query);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.before}
      <mark className="bg-transparent font-extrabold text-fg underline decoration-accent decoration-2 underline-offset-2">
        {parts.match}
      </mark>
      {parts.after}
    </>
  );
}

export default function SystemGrid({ rows }: { rows: SystemRow[] }) {
  // State only. No filtering or sorting logic in here.
  const [added, setAdded] = useState<SystemRow[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("severity");

  const all = [...rows, ...added];
  const visible = visibleSystems(all, query, sortKey);

  return (
    <>
      <SystemForm onCreated={(row) => setAdded((prev) => [...prev, row])} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="system-search" className="sr-only">
          Systeme nach Name filtern
        </label>
        <input
          id="system-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="System suchen…"
          autoComplete="off"
          className="w-full rounded-lg bg-raised px-4 py-2 text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-80"
        />

        <div role="group" aria-label="Sortierung" className="flex rounded-lg bg-raised p-1">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortKey === key}
              onClick={() => setSortKey(key)}
              className={`rounded-md px-3 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                sortKey === key ? "bg-accent text-bg" : "text-muted hover:text-fg"
              }`}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="text-sm text-muted">
          {visible.length} von {all.length} Systemen
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <Tile
              key={s.id}
              title={<Highlight text={s.title} query={query} />}
              value={s.value}
              unit={s.unit}
              status={s.status}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted">Kein System passt zu «{query}».</p>
      )}
    </>
  );
}