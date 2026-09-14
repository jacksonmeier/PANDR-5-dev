"use client";

import { useEffect, useState } from "react";
import { formatElapsed } from "@/lib/active";

/**
 * A clock counting up from `since` (epoch ms), ticking every second.
 *
 * Only ever rendered behind a hydration gate, so the first paint on the client
 * already has the real time and there is nothing for the server to disagree
 * with.
 */
export function Elapsed({ since, className = "" }: { since: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time className={`num ${className}`} dateTime={new Date(since).toISOString()}>
      {formatElapsed(now - since)}
    </time>
  );
}
