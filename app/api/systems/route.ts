import { getStatus, type Limits } from "@/lib/status";

// Defaults for systems created via the form (value is a percentage).
const DEFAULT_UNIT = "%";
const DEFAULT_LIMITS: Limits = { warnHigh: 80, critHigh: 90 };

// POST /api/systems: validates the entry, assigns an id, returns the finished system.
// No database yet: nothing is stored, the route only "creates" the entry.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  // Never trust the client: validate again on the server.
  const raw = typeof body === "object" && body !== null ? (body as { title?: unknown; value?: unknown }) : {};
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const value = raw.value;

  if (title.length < 2 || title.length > 40) {
    return Response.json({ error: "Name muss 2 bis 40 Zeichen lang sein." }, { status: 400 });
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    return Response.json({ error: "Wert muss eine Zahl zwischen 0 und 100 sein." }, { status: 400 });
  }

  const rounded = Math.round(value * 10) / 10;
  const system = {
    id: crypto.randomUUID(), // server assigns the id, never the client
    title,
    value: rounded,
    unit: DEFAULT_UNIT,
    status: getStatus(rounded, DEFAULT_LIMITS),
  };

  return Response.json(system, { status: 201 }); // 201 = Created
}