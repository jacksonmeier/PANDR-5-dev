"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  PAINT_CACHE_KEY,
  applyThemeVars,
  paintCache,
  resolveMode,
  resolveSurface,
  themeColorHex,
  type ResolvedMode,
  type Surface,
} from "@/lib/theme";

/** The View Transitions API, where the browser has it. */
type WithViewTransition = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Keeps <html> in sync with the stored theme.
 *
 * Deliberately does nothing until the store has hydrated. The blocking script in
 * <head> has already applied the user's theme from its cache by then, so applying
 * the store's default first would cause exactly the flash that script prevents.
 *
 * A change of mode or surface is a change of the whole page, so it cross-fades
 * through a view transition where the browser offers one. A change of colour
 * is not: the pickers fire continuously while dragging, and the colours move
 * on their own.
 */
export function ThemeProvider() {
  const hydrated = useStore((s) => s._hydrated);
  const theme = useStore((s) => s.settings.theme);
  /** What is on the page now, so only a real change of look animates. */
  const shown = useRef<{ mode: ResolvedMode; surface: Surface } | null>(null);

  useEffect(() => {
    if (!hydrated || !theme) return;

    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: light)");

    const apply = () => {
      const mode = resolveMode(theme.mode, mq.matches);
      const surface = resolveSurface(theme);

      const paint = () => {
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

      const before = shown.current;
      shown.current = { mode, surface };
      const changedLook = before !== null && (before.mode !== mode || before.surface !== surface);
      const stillness = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const start = (document as WithViewTransition).startViewTransition;

      if (changedLook && !stillness && typeof start === "function") {
        start.call(document, paint);
      } else {
        paint();
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
