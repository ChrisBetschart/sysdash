// Server-side proxy: fetches METAR XML and passes it on as text.
const METAR_URL = "https://aviationweather.gov/api/data/metar?ids=LSZH&format=xml";

export async function GET() {
  try {
    const res = await fetch(METAR_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000), // give up after 8 seconds
    });

    if (!res.ok) {
      // Pass rate limit through, everything else is a bad gateway.
      const status = res.status === 429 ? 429 : 502;
      return new Response(`Upstream error ${res.status}`, { status });
    }

    const xml = await res.text();
    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch {
    // Timeout or network error
    return new Response("Upstream unreachable", { status: 504 });
  }
}