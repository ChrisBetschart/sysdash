import LivePanel from "@/components/LivePanel";
import Header from "@/components/Header";
import Tile from "@/components/Tile";
import TransportTile from "@/components/TransportTile";
import { systems, type System } from "@/data/systems";
import { getStatus, compareBySeverity, type Status } from "@/lib/status";
import { getTransportStatus } from "@/lib/transport";

type SystemWithStatus = System & { status: Status };

export default async function Home() {
  // Derive status for every system, then sort: critical first.
  const rows: SystemWithStatus[] = systems
    .map((s) => ({ ...s, status: getStatus(s.value, s.limits) }))
    .sort((a, b) => compareBySeverity(a.status, b.status));

  // Live source, fetched on the server. Never throws: errors become "degraded"/"down".
  const transport = await getTransportStatus();

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-8">
      <Header statuses={rows.map((r) => r.status)} />

      <section aria-labelledby="systems-title">
        <h2 id="systems-title" className="mb-4 text-xl font-semibold text-fg">Systeme</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <Tile key={s.id} title={s.title} value={s.value} unit={s.unit} status={s.status} />
        ))}
          <TransportTile result={transport} />
        </div>
      </section>

      <LivePanel title="Wetter Luzern (OpenWeatherMap)" source="weather" />
      <LivePanel title="Flughafen Zürich (METAR)" source="metar" />
    </main>
  );
}