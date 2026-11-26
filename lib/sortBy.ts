// Generic, type-safe, non-mutating sort helper. Works for any list.
export type Comparable = string | number;
export type Direction = "asc" | "desc";

// One sort criterion: how to read the value from an item, and in which direction.
export type Criterion<T> = {
  by: (item: T) => Comparable;
  dir?: Direction; // default "asc"
};

function compareValues(a: Comparable, b: Comparable): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  // Strings: locale-aware, case-insensitive, "Server 2" before "Server 10".
  return String(a).localeCompare(String(b), "de-CH", { sensitivity: "base", numeric: true });
}

// Sorts by the first criterion; on a tie the next one decides, and so on.
// Returns a new array: the input is never mutated.
export function sortBy<T>(items: readonly T[], ...criteria: Criterion<T>[]): T[] {
  return [...items].sort((a, b) => {
    for (const { by, dir = "asc" } of criteria) {
      const result = compareValues(by(a), by(b));
      if (result !== 0) return dir === "asc" ? result : -result;
    }
    return 0;
  });
}