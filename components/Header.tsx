import { severity, type Status } from "@/lib/status";

type HeaderProps = {
  statuses: Status[];
};

const overallText: Record<Status, string> = {
  ok: "Alle Systeme OK",
  warn: "Achtung: Warnungen vorhanden",
  crit: "Kritischer Zustand",
};

const overallStyle: Record<Status, string> = {
  ok: "bg-emerald-900 text-emerald-200",
  warn: "bg-amber-900 text-amber-200",
  crit: "bg-red-900 text-red-100",
};

export default function Header({ statuses }: HeaderProps) {
  // Count each status with reduce (new object each step, no mutation).
  const counts = statuses.reduce<Record<Status, number>>(
    (acc, s) => ({ ...acc, [s]: acc[s] + 1 }),
    { ok: 0, warn: 0, crit: 0 },
  );

  // Worst status overall.
  const worst = statuses.reduce<Status>(
    (w, s) => (severity[s] > severity[w] ? s : w),
    "ok",
  );

  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-white">SysDash</h1>
      <p className="text-slate-400">System status at a glance</p>

      <div className={`mt-4 rounded-xl px-4 py-3 ${overallStyle[worst]}`}>
        <p className="font-semibold">{overallText[worst]}</p>
        <p className="text-sm">
          {counts.crit} kritisch · {counts.warn} Warnung(en) · {counts.ok} OK
        </p>
      </div>
    </header>
  );
}