/**
 * sRGB <-> OKLCH conversion, plus an sRGB gamut clamp.
 *
 * OKLCH is perceptually uniform, which is why the theme is built on it: pick a
 * hue and every step of the palette keeps its intended lightness and contrast.
 * Doing the same thing in HSL would make a yellow accent read as much lighter
 * than a blue one at the same nominal lightness.
 *
 * Matrices are Björn Ottosson's reference values.
 */

export interface Oklch {
  /** Perceptual lightness, 0..1 */
  l: number;
  /** Chroma, 0..~0.4 in sRGB */
  c: number;
  /** Hue in degrees, 0..360 */
  h: number;
}

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function rgbToOklch(r: number, g: number, b: number): Oklch {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  // A neutral colour has no meaningful hue; report 0 rather than atan2 noise.
  return { l: L, c, h: c < 1e-6 ? 0 : h };
}

export function oklchToRgb({ l, c, h }: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);

  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;

  return [
    linearToSrgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    linearToSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    linearToSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

export function hexToOklch(hex: string): Oklch | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklch(rgb[0], rgb[1], rgb[2]) : null;
}

export function oklchToHex(c: Oklch): string {
  const [r, g, b] = oklchToRgb(c);
  return rgbToHex(r, g, b);
}

const EPS = 1e-4;

export function inSrgbGamut({ l, c, h }: Oklch): boolean {
  return oklchToRgb({ l, c, h }).every((v) => v >= -EPS && v <= 1 + EPS);
}

/**
 * Largest chroma at this lightness and hue that still lands inside sRGB.
 * Without this, a vivid pick gets hard-clipped by the browser and two different
 * hues can collapse to visually identical colours.
 */
export function maxChroma(l: number, h: number, limit = 0.4): number {
  if (!inSrgbGamut({ l, c: limit, h })) {
    let lo = 0;
    let hi = limit;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inSrgbGamut({ l, c: mid, h })) lo = mid;
      else hi = mid;
    }
    return lo;
  }
  return limit;
}

/** Clamp chroma into gamut, keeping lightness and hue exactly. */
export function clampChroma(color: Oklch): Oklch {
  const max = maxChroma(color.l, color.h);
  return { ...color, c: Math.min(color.c, max) };
}
