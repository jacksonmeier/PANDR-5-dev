"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  PAINT_CACHE_KEY,
  applyThemeVars,
  paintCache,
  resolveMode,
  themeColorHex,
} from "@/lib/theme";

/**
 * Keeps <html> in sync with the stored theme.
 *
 * Deliberately does nothing until the store has hydrated. The blocking script in
 * <head> has already applied the user's theme from its cache by then, so applying
 * the store's default first would cause exactly the flash that script prevents.
 */
export function ThemeProvider() {
  const hydrated = useStore((s) => s._hydrated);
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    if (!hydrated || !theme) return;

    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: light)");

    const apply = () => {
      const mode = resolveMode(theme.mode, mq.matches);
      applyThemeVars(root, theme, mode);

      // Tints the browser chrome on Android and the status bar area on iOS.
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.content = themeColorHex(theme, mode);

      try {
        localStorage.setItem(PAINT_CACHE_KEY, JSON.stringify(paintCache(theme)));
      } catch {
        // Private mode or blocked storage. The theme still applies for this
        // session; only the pre-paint restore on next launch is lost.
      }
    };

    apply();

    // Only follow the OS while the user has actually chosen to follow it.
    if (theme.mode !== "system") return;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [hydrated, theme]);

  return null;
}
