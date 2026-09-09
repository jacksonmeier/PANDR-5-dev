"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Rehydrates the persisted store on the client after mount, so server HTML and
 * the first client render agree (both empty), and localStorage fills in after.
 */
export function StoreHydrator() {
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);
  return null;
}

/** True once localStorage has been read. Gate store-driven UI on this. */
export function useHydrated(): boolean {
  return useStore((s) => s._hydrated);
}
