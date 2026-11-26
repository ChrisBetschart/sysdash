import LivePanel from "@/components/LivePanel";
import Header from "@/components/Header";
import SystemGrid from "@/components/SystemGrid";
import TransportPanel from "@/components/TransportPanel";
import AutoRefresh from "@/components/AutoRefresh";
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
      {/* Re-fetch server data (departures) every 60 s */}
      <AutoRefresh everyMs={60_000} />

      <Header statuses={rows.map((r) => r.status)} />

      <section aria-labelledby="systems-title">
        <h2 id="systems-title" className="mb-4 text-xl font-semibold text-fg">Systeme</h2>
        {/* Only the fields the tiles need are sent to the browser */}
        <SystemGrid
          rows={rows.map(({ id, title, value, unit, status }) => ({ id, title, value, unit, status }))}
        />
      </section>

      <TransportPanel result={transport} />

      {/* OWM updates ~every 10 min, free tier 1000 calls/day */}
      <LivePanel title="Wetter Luzern (OpenWeatherMap)" source="weather" refreshMs={300_000} />
      {/* METAR is published every 30 min */}
      <LivePanel title="Flughafen Zürich (METAR)" source="metar" refreshMs={300_000} />
    </main>
  );
}