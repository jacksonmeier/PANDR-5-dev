import { describe, expect, it } from "vitest";
import { hexToOklch, inSrgbGamut, oklchToHex } from "./color";
import {
  DEFAULT_THEME,
  PRESETS,
  accentSwatch,
  paintCache,
  resolveMode,
  surfaceSwatch,
  themeColorHex,
  themeVars,
} from "./theme";

describe("resolveMode", () => {
  it("honours an explicit choice regardless of the device", () => {
    expect(resolveMode("dark", true)).toBe("dark");
    expect(resolveMode("light", false)).toBe("light");
  });
  it("follows the device only for system", () => {
    expect(resolveMode("system", true)).toBe("light");
    expect(resolveMode("system", false)).toBe("dark");
  });
});

describe("themeVars", () => {
  it("reproduces the original palette from the default theme", () => {
    const v = themeVars(DEFAULT_THEME);
    // The hand-picked oxide red and the warm surface hue it shipped with.
    expect(v.hAccent).toBeCloseTo(26.9, 0);
    expect(v.cAccent).toBeCloseTo(0.185, 2);
    expect(v.hTint).toBeCloseTo(84.6, 1);
    expect(v.tintSat).toBe(1);
  });

  it("takes only hue and saturation from the tint, never its lightness", () => {
    // Built from OKLCH so the pair genuinely shares a hue and chroma; two hexes
    // picked by eye would drift a degree apart from 8-bit quantisation alone.
    // Chroma 0.05 is low enough to stay inside sRGB at BOTH lightnesses, which
    // matters: at L 0.35 a yellow cannot hold chroma 0.13, and asking for it
    // yields a clipped colour with a completely different hue.
    const pale = { l: 0.85, c: 0.05, h: 84.6 };
    const deep = { l: 0.35, c: 0.05, h: 84.6 };
    expect(inSrgbGamut(pale)).toBe(true);
    expect(inSrgbGamut(deep)).toBe(true);

    const paleTheme = { ...DEFAULT_THEME, tint: oklchToHex(pale) };
    const deepTheme = { ...DEFAULT_THEME, tint: oklchToHex(deep) };
    const a = themeVars(paleTheme);
    const b = themeVars(deepTheme);

    // Hues agree to within a couple of degrees. The residual is 8-bit hex
    // quantisation at low chroma, not lightness leaking into hue: when it DOES
    // leak the gap is tens of degrees, not units.
    expect(Math.abs(a.hTint - b.hTint)).toBeLessThan(3);
    expect(a.tintSat).toBeCloseTo(b.tintSat, 1);

    // The property that actually matters: the page background takes its
    // lightness from the mode ladder, so a pale pick and a deep pick of the
    // same hue both yield the same dark surface.
    const la = hexToOklch(themeColorHex(paleTheme, "dark"))!.l;
    const lb = hexToOklch(themeColorHex(deepTheme, "dark"))!.l;
    expect(la).toBeCloseTo(lb, 2);
    expect(la).toBeLessThan(0.25);
  });

  it("fades the tint toward neutral as the pick loses saturation", () => {
    const vivid = themeVars({ ...DEFAULT_THEME, tint: "#ce9c17" });
    const muted = themeVars({ ...DEFAULT_THEME, tint: "#8a8070" });
    const grey = themeVars({ ...DEFAULT_THEME, tint: "#868686" });
    expect(vivid.tintSat).toBe(1);
    expect(muted.tintSat).toBeGreaterThan(0);
    expect(muted.tintSat).toBeLessThan(1);
    expect(grey.tintSat).toBe(0);
  });

  it("clamps a neon accent into sRGB at BOTH mode lightnesses", () => {
    const v = themeVars({ ...DEFAULT_THEME, accent: "#00ff00" });
    for (const l of [0.602, 0.558]) {
      expect(inSrgbGamut({ l, c: v.cAccent, h: v.hAccent })).toBe(true);
    }
  });

  it("falls back to the default rather than throwing on a malformed hex", () => {
    const v = themeVars({ ...DEFAULT_THEME, accent: "not-a-colour", tint: "#zzz" });
    const d = themeVars(DEFAULT_THEME);
    expect(v).toEqual(d);
  });
});

describe("swatches", () => {
  it("produce valid hex in both modes for every preset", () => {
    for (const p of PRESETS) {
      for (const mode of ["light", "dark"] as const) {
        const theme = { accent: p.accent, tint: p.tint, mode };
        for (const hex of [
          accentSwatch(theme, mode),
          surfaceSwatch(theme, mode),
          themeColorHex(theme, mode),
        ]) {
          expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("keeps the page background dark in dark mode and light in light mode", () => {
    for (const p of PRESETS) {
      const theme = { accent: p.accent, tint: p.tint, mode: "system" as const };
      expect(hexToOklch(surfaceSwatch(theme, "dark"))!.l).toBeLessThan(0.25);
      expect(hexToOklch(surfaceSwatch(theme, "light"))!.l).toBeGreaterThan(0.95);
    }
  });

  it("keeps every preset accent mid-lightness, so near-white text sits on it safely", () => {
    for (const p of PRESETS) {
      for (const mode of ["light", "dark"] as const) {
        const l = hexToOklch(accentSwatch({ accent: p.accent, tint: p.tint, mode }, mode))!.l;
        expect(l).toBeGreaterThan(0.45);
        expect(l).toBeLessThan(0.7);
      }
    }
  });

  it("gives the default theme the exact background it shipped with", () => {
    expect(themeColorHex(DEFAULT_THEME, "dark")).toBe("#0e0d0b");
  });
});

describe("paintCache", () => {
  it("is plain JSON numbers so the pre-paint script needs no colour maths", () => {
    const c = paintCache(DEFAULT_THEME);
    expect(JSON.parse(JSON.stringify(c))).toEqual(c);
    expect(typeof c.ha).toBe("number");
    expect(typeof c.ca).toBe("number");
    expect(typeof c.ht).toBe("number");
    expect(typeof c.ts).toBe("number");
  });

  it("carries the raw mode so the script can resolve system itself", () => {
    expect(paintCache({ ...DEFAULT_THEME, mode: "system" }).m).toBe("system");
    expect(paintCache({ ...DEFAULT_THEME, mode: "light" }).m).toBe("light");
  });
});
