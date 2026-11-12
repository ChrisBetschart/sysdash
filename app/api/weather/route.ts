// Server-side proxy: the API key never reaches the browser.
const CITY = "Luzern";

export async function GET() {
  const key = process.env.OWM_API_KEY;
  if (!key) {
    return Response.json({ error: "API key missing on server" }, { status: 500 });
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?q=${encodeURIComponent(CITY)}&units=metric&appid=${key}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502;
      return Response.json({ error: `Upstream error ${res.status}` }, { status });
    }

    const data: unknown = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Upstream unreachable" }, { status: 504 });
  }
}