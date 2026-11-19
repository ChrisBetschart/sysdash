import Tile from "@/components/Tile";
import { getStatus } from "@/lib/status";
import { summarize, type Health, type TransportResult } from "@/lib/transport";

// Record<Health, ...> forces a style for every health state.
const healthStyle: Record<Health, string> = {
  ok: "bg-ok-soft text-ok",
  degraded: "bg-warn-soft text-warn",
  down: "bg-crit-soft text-crit",
};

const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

export default function TransportPanel({ result }: { result: TransportResult }) {
  const titleId = "transport-title";
  const hasData = result.health !== "down";
  const station = hasData && result.station ? result.station : "Luzern";
  const s = hasData ? summarize(result.departures) : null;

  return (
    <section aria-labelledby={titleId} className="mt-10">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h2 id={titleId} className="text-xl font-semibold text-fg">
            Abfahrten {station} (transport.opendata.ch)
          </h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${healthStyle[result.health]}`}>
            {result.health}
          </span>
        </div>
        <p className="text-sm text-muted">
          {result.health === "ok" && <>Abgerufen: {clock(result.fetchedAt)} · aktualisiert sich jede Minute</>}
          {result.health === "degraded" && <>Quelle nicht erreichbar ({result.reason}) · letzter Stand {clock(result.fetchedAt)}</>}
          {result.health === "down" && <>Keine Daten · {result.reason}</>}
        </p>
      </div>

      {result.health === "down" && (
        <p role="alert" className="rounded-xl bg-crit-soft px-4 py-3 text-crit">
          Abfahrtsdaten nicht verfügbar: {result.reason}
        </p>
      )}

      {s && s.upcoming.length === 0 && (
        <p className="text-muted">Keine bevorstehenden Abfahrten im Datensatz.</p>
      )}

      {s && s.upcoming.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Tile
              title="Nächste Abfahrt"
              value={s.minutes[0]}
              unit="min"
              status={getStatus(s.minutes[0], { warnHigh: 15, critHigh: 30 })}
            />
            <Tile
              title="Abfahrten in 30 min"
              value={s.countIn30}
              unit="Züge"
              status={getStatus(s.countIn30, { critLow: 0, warnLow: 2 })}
            />
            <Tile
              title="Grösste Lücke"
              value={s.maxGap}
              unit="min"
              status={getStatus(s.maxGap, { warnHigh: 15, critHigh: 30 })}
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl bg-raised">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Nächste Abfahrten ab {station}</caption>
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Zeit</th>
                  <th scope="col" className="px-4 py-3">In</th>
                  <th scope="col" className="px-4 py-3">Linie</th>
                  <th scope="col" className="px-4 py-3">Ziel</th>
                  <th scope="col" className="px-4 py-3">Gleis</th>
                  <th scope="col" className="px-4 py-3">Betreiber</th>
                </tr>
              </thead>
              <tbody className="text-fg">
                {s.upcoming.slice(0, 8).map((d, i) => (
                  <tr key={`${d.ts}-${d.line}-${d.to}`} className="border-t border-muted/20">
                    <td className="px-4 py-2 font-semibold tabular-nums">{clock(d.ts * 1000)}</td>
                    <td className="px-4 py-2 tabular-nums text-muted">{s.minutes[i]} min</td>
                    <td className="px-4 py-2 font-semibold">{d.line ?? "–"}</td>
                    <td className="px-4 py-2">{d.to ?? "–"}</td>
                    <td className="px-4 py-2">{d.platform ?? "–"}</td>
                    <td className="px-4 py-2 text-muted">{d.operator ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}