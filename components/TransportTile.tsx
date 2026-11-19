import Tile from "@/components/Tile";
import { getStatus } from "@/lib/status";
import type { Health, TransportResult } from "@/lib/transport";

// Record<Health, ...> forces a style for every health state.
const healthStyle: Record<Health, string> = {
  ok: "bg-ok-soft text-ok",
  degraded: "bg-warn-soft text-warn",
  down: "bg-crit-soft text-crit",
};

export default function TransportTile({ result }: { result: TransportResult }) {
  const time =
    result.health !== "down" ? new Date(result.fetchedAt).toLocaleTimeString("de-CH") : null;

  return (
    <div className="flex flex-col gap-2">
      {result.health === "down" ? (
        <div className="rounded-xl bg-raised p-5 text-muted">
          <p className="text-sm">ÖV Luzern · nächste Abfahrt</p>
          <p className="mt-2 text-2xl font-bold">–</p>
        </div>
      ) : (
        <Tile
          title="ÖV Luzern · nächste Abfahrt"
          value={result.minutes}
          unit="min"
          status={getStatus(result.minutes, { warnHigh: 15, critHigh: 30 })}
        />
      )}

      <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
        Quelle transport.opendata.ch
        <span className={`rounded-full px-2 py-0.5 font-semibold ${healthStyle[result.health]}`}>
          {result.health}
        </span>
        {result.health === "ok" && <span>Stand {time}</span>}
        {result.health === "degraded" && <span>letzter Stand {time} · {result.reason}</span>}
        {result.health === "down" && <span>keine Daten · {result.reason}</span>}
      </p>
    </div>
  );
}