// Status of a single metric. Derived from value + limits, never stored.
export type Status = "ok" | "warn" | "crit";

// Optional thresholds. An undefined side is ignored.
export type Limits = {
  critLow?: number;
  warnLow?: number;
  warnHigh?: number;
  critHigh?: number;
};

// Pure function: same input -> same output, no side effects.
export function getStatus(value: number, l: Limits = {}): Status {
  if (l.critLow !== undefined && value <= l.critLow) return "crit";
  if (l.critHigh !== undefined && value >= l.critHigh) return "crit";
  if (l.warnLow !== undefined && value <= l.warnLow) return "warn";
  if (l.warnHigh !== undefined && value >= l.warnHigh) return "warn";
  return "ok";
}

// Severity as a number. Record<Status, ...> forces every status to be listed.
export const severity: Record<Status, number> = {
  ok: 0,
  warn: 1,
  crit: 2,
};

// Comparator for sort(): most severe first.
export function compareBySeverity(a: Status, b: Status): number {
  return severity[b] - severity[a];
}
