import type { Status } from "@/lib/status";

type TileProps = {
  title: string;
  value: number;
  unit: string;
  status: Status;
};

// One entry per status: TypeScript errors if a status is missing.
// Colors come only from the design tokens in globals.css.
const statusStyle: Record<Status, { label: string; icon: string; badge: string; card: string }> = {
  ok:   { label: "OK",       icon: "✓", badge: "bg-ok-soft text-ok",     card: "border-line" },
  warn: { label: "Warnung",  icon: "!", badge: "bg-warn-soft text-warn", card: "border-warn" },
  crit: { label: "Kritisch", icon: "✕", badge: "bg-crit-soft text-crit", card: "border-crit ring-2 ring-crit/50" },
};

export default function Tile({ title, value, unit, status }: TileProps) {
  const style = statusStyle[status];

  return (
    <div className={`rounded-xl border-2 bg-surface p-5 shadow-lg ${style.card}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted">{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
          <span aria-hidden="true">{style.icon}</span> {style.label}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-fg">
        {value} <span className="text-lg font-normal text-muted">{unit}</span>
      </p>
    </div>
  );
}