"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True for `ms` after `on` turns from false to true, and never on mount, so a
 * resumed session with every set already logged does not light up all at once.
 * Drives the one-off flashes in globals.css (.flash-logged, .flash-done).
 */
export function useFlash(on: boolean, ms: number): boolean {
  const [flash, setFlash] = useState(false);
  const was = useRef(on);

  useEffect(() => {
    const rose = on && !was.current;
    was.current = on;
    if (!rose) return;
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), ms);
    return () => window.clearTimeout(id);
  }, [on, ms]);

  return flash;
}
