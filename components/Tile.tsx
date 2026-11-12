import type { Status } from "@/lib/status";

type TileProps = {
  title: string;
  value: number;
  unit: string;
  status: Status;
};

// One entry per status: TypeScript errors if a status is missing.
const statusStyle: Record<Status, { label: string; icon: string; badge: string; border: string }> = {
  ok:   { label: "OK",       icon: "✓", badge: "bg-emerald-900 text-emerald-200", border: "border-slate-700" },
  warn: { label: "Warnung",  icon: "!", badge: "bg-amber-900 text-amber-200",     border: "border-amber-500" },
  crit: { label: "Kritisch", icon: "✕", badge: "bg-red-900 text-red-100",         border: "border-red-500" },
};

export default function Tile({ title, value, unit, status }: TileProps) {
  const style = statusStyle[status];

  return (
    <div className={`rounded-xl border-2 bg-slate-800 p-5 shadow-lg ${style.border}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
          <span aria-hidden="true">{style.icon}</span> {style.label}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-white">
        {value} <span className="text-lg font-normal text-slate-400">{unit}</span>
      </p>
    </div>
  );
}