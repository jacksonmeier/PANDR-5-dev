import { describe, expect, it } from "vitest";
import {
  clampChroma,
  hexToOklch,
  hexToRgb,
  inSrgbGamut,
  maxChroma,
  oklchToHex,
  rgbToOklch,
} from "./color";

describe("hexToRgb", () => {
  it("parses 6-digit and 3-digit hex, with or without the hash", () => {
    expect(hexToRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToRgb("000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#fff")).toEqual([1, 1, 1]);
  });
  it("rejects nonsense", () => {
    for (const bad of ["", "#12345", "not-a-colour", "#gggggg", "#1234567"]) {
      expect(hexToRgb(bad)).toBeNull();
    }
  });
});

describe("OKLCH round trip", () => {
  it("returns the original hex for the whole shipped palette", () => {
    const palette = [
      "#0e0d0b", "#16140f", "#1f1c16", "#2a261e", "#332e25", "#4a4336",
      "#efe8da", "#bcb3a1", "#837b6b", "#d9463f", "#ff6f62", "#6b1f1b",
      "#9fd68f", "#1f3a1d", "#e9b44c", "#4a3410", "#7fb3e0", "#17303f",
    ];
    for (const hex of palette) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
    }
  });

  it("round-trips the extremes and pure primaries", () => {
    for (const hex of ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff"]) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
    }
  });
});

describe("rgbToOklch", () => {
  it("puts greys at zero chroma with no hue noise", () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      const c = rgbToOklch(v, v, v);
      expect(c.c).toBeLessThan(1e-6);
      expect(c.h).toBe(0);
    }
  });

  it("orders lightness the way perception does, not the way sRGB does", () => {
    // Pure yellow and pure blue have similar sRGB "value" but very different
    // perceived lightness. This ordering is the reason the theme uses OKLCH.
    const yellow = rgbToOklch(1, 1, 0).l;
    const blue = rgbToOklch(0, 0, 1).l;
    expect(yellow).toBeGreaterThan(blue);
    expect(yellow).toBeGreaterThan(0.9);
    expect(blue).toBeLessThan(0.5);
  });

  it("places known hues in the expected quadrants", () => {
    expect(rgbToOklch(1, 0, 0).h).toBeCloseTo(29.2, 0);
    expect(rgbToOklch(0, 1, 0).h).toBeCloseTo(142.5, 0);
    expect(rgbToOklch(0, 0, 1).h).toBeCloseTo(264.1, 0);
  });
});

describe("gamut handling", () => {
  it("accepts colours inside sRGB and rejects ones outside", () => {
    expect(inSrgbGamut({ l: 0.6, c: 0.05, h: 30 })).toBe(true);
    expect(inSrgbGamut({ l: 0.6, c: 0.4, h: 30 })).toBe(false);
  });

  it("maxChroma finds a boundary that is in gamut and just past it is not", () => {
    for (const h of [0, 29, 85, 145, 200, 245, 300, 359]) {
      const max = maxChroma(0.602, h);
      expect(inSrgbGamut({ l: 0.602, c: max, h })).toBe(true);
      expect(inSrgbGamut({ l: 0.602, c: max + 0.01, h })).toBe(false);
    }
  });

  it("maxChroma reflects that yellows cannot be vivid at mid lightness", () => {
    // Real constraint the theme has to live with: an amber accent is duller than
    // a red or violet one at the same lightness.
    expect(maxChroma(0.602, 85)).toBeLessThan(maxChroma(0.602, 29));
    expect(maxChroma(0.602, 85)).toBeLessThan(maxChroma(0.602, 300));
  });

  it("clampChroma keeps lightness and hue exactly and only reduces chroma", () => {
    const wild = { l: 0.602, c: 0.4, h: 145 };
    const safe = clampChroma(wild);
    expect(safe.l).toBe(wild.l);
    expect(safe.h).toBe(wild.h);
    expect(safe.c).toBeLessThan(wild.c);
    expect(inSrgbGamut(safe)).toBe(true);
  });

  it("leaves an already-safe colour untouched", () => {
    const safe = { l: 0.6, c: 0.05, h: 200 };
    expect(clampChroma(safe)).toEqual(safe);
  });
});
