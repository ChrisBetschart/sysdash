"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-runs the Server Components of the current page (e.g. the transport tile)
// without a full reload. Client state like the LivePanels stays untouched.
export default function AutoRefresh({ everyMs }: { everyMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, everyMs);
    return () => clearInterval(id); // cleanup, otherwise timers pile up
  }, [router, everyMs]);

  return null; // renders nothing
}