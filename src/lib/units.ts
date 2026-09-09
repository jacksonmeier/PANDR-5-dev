import type { Session, Unit } from "./types";

/** Smallest practical load step per unit. */
export const INCREMENT: Record<Unit, number> = { lb: 2.5, kg: 1.25 };

export const LB_PER_KG = 2.20462;

/** Round to the nearest multiple of `inc`, cleaned of float noise. */
export function roundToIncrement(load: number, inc: number): number {
  const n = Math.round(load / inc) * inc;
  return Math.round(n * 1000) / 1000;
}

export function convertLoad(load: number, from: Unit, to: Unit): number {
  if (from === to) return load;
  const raw = from === "lb" ? load / LB_PER_KG : load * LB_PER_KG;
  return roundToIncrement(raw, INCREMENT[to]);
}

/** Convert every stored load. Pure; returns new session objects. */
export function convertSessions(
  sessions: readonly Session[],
  from: Unit,
  to: Unit,
): Session[] {
  if (from === to) return [...sessions];
  return sessions.map((s) => ({
    ...s,
    logs: s.logs.map((l) => ({
      ...l,
      load: l.load === null ? null : convertLoad(l.load, from, to),
    })),
  }));
}

export function formatLoad(load: number | null, unit: Unit): string {
  if (load === null) return "";
  const s = Number.isInteger(load) ? String(load) : load.toFixed(2).replace(/\.?0+$/, "");
  return `${s} ${unit}`;
}
