import Tile from "@/components/Tile";
import { getStatus } from "@/lib/status";
import type { Health, TransportResult } from "@/lib/transport";

// Record<Health, ...> forces a style for every health state.
const healthStyle: Record<Health, string> = {
  ok: "bg-ok-soft text-ok",
  degraded: "bg-warn-soft text-warn",
  down: "bg-crit-soft text-crit",
};

const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

export default function TransportTile({ result }: { result: TransportResult }) {
  const hasData = result.health !== "down";
  const title = `ÖV ${hasData && result.station ? result.station : "Luzern"} · nächste Abfahrt`;

  // Only parts that exist are shown, joined with " · ".
  const details = hasData
    ? [
        result.station && `ab ${result.station}`,
        clock(result.departureAt),
        result.platform && `Gleis ${result.platform}`,
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="flex flex-col gap-2">
      {hasData ? (
        <Tile
          title={title}
          value={result.minutes}
          unit="min"
          status={getStatus(result.minutes, { warnHigh: 15, critHigh: 30 })}
        />
      ) : (
        <div className="rounded-xl bg-raised p-5 text-muted">
          <p className="text-sm">{title}</p>
          <p className="mt-2 text-2xl font-bold">–</p>
        </div>
      )}

      {hasData && (
        <div>
          {(result.line || result.to) && (
            <p className="text-sm font-semibold text-fg">
              {result.line ?? "?"} {result.to && <>→ {result.to}</>}
            </p>
          )}
          <p className="text-xs text-muted">{details}</p>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
        Quelle transport.opendata.ch
        <span className={`rounded-full px-2 py-0.5 font-semibold ${healthStyle[result.health]}`}>
          {result.health}
        </span>
        {result.health === "ok" && <span>Stand {clock(result.fetchedAt)}</span>}
        {result.health === "degraded" && <span>letzter Stand {clock(result.fetchedAt)} · {result.reason}</span>}
        {result.health === "down" && <span>keine Daten · {result.reason}</span>}
      </p>
    </div>
  );
}