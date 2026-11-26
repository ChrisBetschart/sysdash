import { severity, type Status } from "@/lib/status";
import { sortBy, type Criterion } from "@/lib/sortBy";

// One system as the dashboard displays it.
export type SystemRow = {
  id: string;
  title: string;
  value: number;
  unit: string;
  status: Status;
};

export type SortKey = "severity" | "name" | "value";

// All functions are pure: same input -> same output, no side effects,
// input arrays are never mutated.

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

// Tie-breaker used by every sort key, so the order is always stable.
const byTitle: Criterion<SystemRow> = { by: (s) => s.title };

// Record<SortKey, ...> forces criteria for every sort key.
// All three use the same generic sortBy, only the criteria differ.
const sortCriteria: Record<SortKey, Criterion<SystemRow>[]> = {
  severity: [{ by: (s) => severity[s.status], dir: "desc" }, byTitle],
  name: [byTitle],
  value: [{ by: (s) => s.value, dir: "desc" }, byTitle],
};

export function filterSystems(rows: readonly SystemRow[], query: string): SystemRow[] {
  const q = normalizeQuery(query);
  if (q === "") return [...rows];
  return rows.filter((r) => r.title.toLowerCase().includes(q));
}

export function sortSystems(rows: readonly SystemRow[], key: SortKey): SystemRow[] {
  return sortBy(rows, ...sortCriteria[key]);
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