import Tile from "@/components/Tile";
import { systems, type System } from "@/data/systems";
import { getStatus, compareBySeverity, type Status } from "@/lib/status";

type SystemWithStatus = System & { status: Status };

export default function Home() {
  // Derive status for every system, then sort: critical first.
  const rows: SystemWithStatus[] = systems
    .map((s) => ({ ...s, status: getStatus(s.value, s.limits) }))
    .sort((a, b) => compareBySeverity(a.status, b.status));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">SysDash</h1>
        <p className="text-slate-400">System status at a glance</p>
      </header>

      <section className="grid grid-cols-1 gap-4">
        {rows.map((s) => (
          <Tile key={s.id} title={s.title} value={s.value} unit={s.unit} status={s.status} />
        ))}
      </section>
    </main>
  );
}