"use client";

import { useState, type FormEvent } from "react";
import type { SystemRow } from "@/components/SystemGrid";

// Light shape check of the server response (tolerant reader).
function isSystemRow(d: unknown): d is SystemRow {
  if (typeof d !== "object" || d === null) return false;
  const r = d as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.title === "string" && typeof r.value === "number";
}

export default function SystemForm({ onCreated }: { onCreated: (row: SystemRow) => void }) {
  // Controlled inputs: one state per field.
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  // UI state for the request.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser from reloading the page
    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Empty field -> null, otherwise Number("") would silently become 0.
        body: JSON.stringify({ title, value: value.trim() === "" ? null : Number(value) }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
            ? data.error
            : `Serverfehler (${res.status})`;
        throw new Error(msg);
      }
      if (!isSystemRow(data)) throw new Error("Unerwartete Antwort vom Server");

      onCreated(data); // hand the new system (with id) to the parent's state
      setTitle("");
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl bg-raised p-4" aria-labelledby="form-title">
      <h3 id="form-title" className="mb-3 font-semibold text-fg">System hinzufügen</h3>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="sys-title" className="text-sm text-muted">Name</label>
          <input
            id="sys-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            maxLength={40}
            placeholder="z. B. Backup"
            className="w-56 rounded-lg bg-surface px-3 py-2 text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sys-value" className="text-sm text-muted">Wert in %</label>
          <input
            id="sys-value"
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            min={0}
            max={100}
            step={0.1}
            placeholder="0 bis 100"
            className="w-32 rounded-lg bg-surface px-3 py-2 text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg disabled:opacity-50"
        >
          {busy ? "Speichert…" : "Hinzufügen"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-crit-soft px-3 py-2 text-sm text-crit">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">Warnung ab 80 %, kritisch ab 90 %.</p>
    </form>
  );
}