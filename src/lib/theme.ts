import { clampChroma, hexToOklch, maxChroma, oklchToHex } from "./color";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedMode = "light" | "dark";

export interface Theme {
  /** Accent colour as picked, e.g. buttons, the active nav pill, the anchor bar. */
  accent: string;
  /** Surface tint as picked. Only its hue and saturation are used. */
  tint: string;
  mode: ThemeMode;
}

/** Reproduces the original hand-picked palette. */
export const DEFAULT_THEME: Theme = {
  accent: "#d9463f",
  tint: "#ce9c17",
  mode: "system",
};

export interface Preset {
  id: string;
  name: string;
  accent: string;
  tint: string;
}

export const PRESETS: readonly Preset[] = [
  { id: "oxide", name: "Oxide", accent: "#d9463f", tint: "#ce9c17" },
  { id: "cobalt", name: "Cobalt", accent: "#2e7dec", tint: "#418ad1" },
  { id: "violet", name: "Violet", accent: "#9b5cd7", tint: "#9970c4" },
  { id: "magenta", name: "Magenta", accent: "#c44aa3", tint: "#c8626d" },
  { id: "forest", name: "Forest", accent: "#21994c", tint: "#429c5a" },
  { id: "mono", name: "Mono", accent: "#7c7c7c", tint: "#868686" },
];

/**
 * Chroma that counts as a fully saturated tint. A pick at or above this applies
 * the tint at full strength; a greyer pick fades toward a neutral surface.
 */
const TINT_REF_C = 0.13;

/** Accent lightness in each mode, from globals.css. Used for the gamut clamp. */
const ACCENT_L = { dark: 0.602, light: 0.558 } as const;

export interface ThemeVars {
  hAccent: number;
  cAccent: number;
  hTint: number;
  tintSat: number;
}

const round = (n: number, p = 4) => Math.round(n * 10 ** p) / 10 ** p;
/** Always rounds toward zero, so a clamped chroma can never exceed its ceiling. */
const roundDown = (n: number, p = 4) => Math.floor(n * 10 ** p) / 10 ** p;

/**
 * Turn two picked colours into the four numbers globals.css consumes.
 *
 * Accent keeps its hue and chroma, clamped so it stays inside sRGB at the accent
 * lightness of BOTH modes; otherwise switching to light mode would silently clip
 * a vivid accent to a different colour.
 *
 * Tint contributes hue plus a 0..1 strength. Its own lightness is discarded: the
 * surface lightness comes from the mode ladder, which is what makes the tint read
 * as a tint rather than as a background colour.
 */
export function themeVars(theme: Theme): ThemeVars {
  const accent = hexToOklch(theme.accent) ?? hexToOklch(DEFAULT_THEME.accent)!;
  const tint = hexToOklch(theme.tint) ?? hexToOklch(DEFAULT_THEME.tint)!;

  const ceiling = Math.min(
    maxChroma(ACCENT_L.dark, accent.h),
    maxChroma(ACCENT_L.light, accent.h),
  );

  return {
    hAccent: round(accent.h, 2),
    cAccent: roundDown(Math.min(accent.c, ceiling)),
    hTint: round(tint.h, 2),
    tintSat: round(Math.min(1, tint.c / TINT_REF_C), 3),
  };
}

export function resolveMode(mode: ThemeMode, prefersLight: boolean): ResolvedMode {
  if (mode === "light" || mode === "dark") return mode;
  return prefersLight ? "light" : "dark";
}

/** The page background for the resolved mode, as hex, for <meta name="theme-color">. */
export function themeColorHex(theme: Theme, mode: ResolvedMode): string {
  const v = themeVars(theme);
  const l = mode === "dark" ? 0.159 : 0.986;
  const ct = mode === "dark" ? 0.004 : 0.005;
  return oklchToHex({ l, c: ct * v.tintSat, h: v.hTint });
}

/** A representative swatch of the accent, for preview chips. */
export function accentSwatch(theme: Theme, mode: ResolvedMode): string {
  const v = themeVars(theme);
  return oklchToHex(
    clampChroma({ l: ACCENT_L[mode], c: v.cAccent, h: v.hAccent }),
  );
}

/** A representative swatch of the page background, for preview chips. */
export function surfaceSwatch(theme: Theme, mode: ResolvedMode): string {
  return themeColorHex(theme, mode);
}

/** Border colour for a given mode. Carries the most visible tint of any surface. */
export function lineSwatch(theme: Theme, mode: ResolvedMode): string {
  const v = themeVars(theme);
  const l = mode === "dark" ? 0.386 : 0.78;
  const ct = mode === "dark" ? 0.023 : 0.019;
  return oklchToHex({ l, c: ct * v.tintSat, h: v.hTint });
}

/** Primary text colour for a given mode, for previews that paint their own surface. */
export function textSwatch(theme: Theme, mode: ResolvedMode): string {
  const v = themeVars(theme);
  const l = mode === "dark" ? 0.933 : 0.255;
  const ct = mode === "dark" ? 0.02 : 0.022;
  return oklchToHex({ l, c: ct * v.tintSat, h: v.hTint });
}

/**
 * localStorage key for the pre-paint cache.
 *
 * This exists so the blocking script in <head> can restore the theme without
 * shipping the OKLCH maths or parsing the whole zustand blob. The zustand store
 * stays the source of truth; this is a derived cache it writes on every change.
 */
export const PAINT_CACHE_KEY = "pandr5-theme";

export interface PaintCache {
  m: ThemeMode;
  ha: number;
  ca: number;
  ht: number;
  ts: number;
}

export function paintCache(theme: Theme): PaintCache {
  const v = themeVars(theme);
  return { m: theme.mode, ha: v.hAccent, ca: v.cAccent, ht: v.hTint, ts: v.tintSat };
}

/** Write the four custom properties and the mode attribute onto <html>. */
export function applyThemeVars(root: HTMLElement, theme: Theme, mode: ResolvedMode): void {
  const v = themeVars(theme);
  root.dataset.mode = mode;
  root.style.setProperty("--h-accent", String(v.hAccent));
  root.style.setProperty("--c-accent", String(v.cAccent));
  root.style.setProperty("--h-tint", String(v.hTint));
  root.style.setProperty("--tint-sat", String(v.tintSat));
}

/**
 * Runs blocking in <head> before first paint, so a light-mode user never sees a
 * flash of the dark default. Reads only the derived cache above. Kept small and
 * total: any failure leaves the CSS defaults in place, which are valid.
 */
export const PRE_PAINT_SCRIPT = `(function(){try{
var r=document.documentElement,t={};
try{t=JSON.parse(localStorage.getItem(${JSON.stringify(PAINT_CACHE_KEY)}))||{}}catch(e){}
var m=t.m==="light"||t.m==="dark"?t.m:(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
r.dataset.mode=m;
if(typeof t.ha==="number"){
r.style.setProperty("--h-accent",t.ha);
r.style.setProperty("--c-accent",t.ca);
r.style.setProperty("--h-tint",t.ht);
r.style.setProperty("--tint-sat",t.ts);
}
}catch(e){}})();`;
