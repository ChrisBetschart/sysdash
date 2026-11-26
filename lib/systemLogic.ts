import { compareBySeverity, type Status } from "@/lib/status";

// One system as the dashboard displays it.
export type SystemRow = {
  id: string;
  title: string;
  value: number;
  unit: string;
  status: Status;
};

export type SortKey = "severity" | "name";

// All functions are pure: same input -> same output, no side effects,
// input arrays are never mutated.

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

const byName = (a: SystemRow, b: SystemRow) =>
  a.title.localeCompare(b.title, "de-CH", { sensitivity: "base" });

// Record<SortKey, ...> forces a comparator for every sort key.
const comparators: Record<SortKey, (a: SystemRow, b: SystemRow) => number> = {
  // Most severe first; equal severity -> alphabetical, so the order is stable.
  severity: (a, b) => compareBySeverity(a.status, b.status) || byName(a, b),
  name: byName,
};

export function filterSystems(rows: readonly SystemRow[], query: string): SystemRow[] {
  const q = normalizeQuery(query);
  if (q === "") return [...rows];
  return rows.filter((r) => r.title.toLowerCase().includes(q));
}

export function sortSystems(rows: readonly SystemRow[], key: SortKey): SystemRow[] {
  return [...rows].sort(comparators[key]); // copy first: sort() would mutate the input
}

// What the grid shows: filter first (fewer items), then sort.
export function visibleSystems(rows: readonly SystemRow[], query: string, key: SortKey): SystemRow[] {
  return sortSystems(filterSystems(rows, query), key);
}

// Bonus: splits a title into the parts before, inside and after the match.
export type TitleParts = { before: string; match: string; after: string };

export function splitMatch(title: string, query: string): TitleParts | null {
  const q = normalizeQuery(query);
  if (q === "") return null;
  const i = title.toLowerCase().indexOf(q);
  if (i === -1) return null;
  return {
    before: title.slice(0, i),
    match: title.slice(i, i + q.length),
    after: title.slice(i + q.length),
  };
}