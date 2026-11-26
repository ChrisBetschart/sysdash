"use client";

import { useState } from "react";
import Tile from "@/components/Tile";
import SystemForm from "@/components/SystemForm";
import { compareBySeverity, type Status } from "@/lib/status";

export type SystemRow = {
  id: string;
  title: string;
  value: number;
  unit: string;
  status: Status;
};

export default function SystemGrid({ rows }: { rows: SystemRow[] }) {
  // Systems created via the form in this session (no database yet).
  const [added, setAdded] = useState<SystemRow[]>([]);
  // Search text.
  const [query, setQuery] = useState("");

  // Everything below is derived on every render, never stored.
  const all = [...rows, ...added].sort((a, b) => compareBySeverity(a.status, b.status));
  const q = query.trim().toLowerCase();
  const visible = q === "" ? all : all.filter((r) => r.title.toLowerCase().includes(q));

  return (
    <>
      {/* Functional update: always based on the latest list */}
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
        <p aria-live="polite" className="text-sm text-muted">
          {visible.length} von {all.length} Systemen
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <Tile key={s.id} title={s.title} value={s.value} unit={s.unit} status={s.status} />
          ))}
        </div>
      ) : (
        <p className="text-muted">Kein System passt zu «{query}».</p>
      )}
    </>
  );
}