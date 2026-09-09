import type { DayId, Session } from "./types";
import { DAY_IDS, nextDayId as nextInCycle } from "@/data/program";

export type DayStatus = "done" | "next" | "upcoming";

export function sortByCreated(sessions: readonly Session[]): Session[] {
  return [...sessions].sort((a, b) => a.createdAt - b.createdAt);
}

export function latestSession(sessions: readonly Session[]): Session | undefined {
  let best: Session | undefined;
  for (const s of sessions) if (!best || s.createdAt >= best.createdAt) best = s;
  return best;
}

/** The day to do next: Push with no history, otherwise the day after the latest session. */
export function nextDayId(sessions: readonly Session[]): DayId {
  const latest = latestSession(sessions);
  return latest ? nextInCycle(latest.dayId) : "push";
}

/**
 * Sessions in the current cycle, oldest first. A cycle begins at the most
 * recent Push session. With no Push yet, every session counts.
 */
export function currentCycle(sessions: readonly Session[]): Session[] {
  const sorted = sortByCreated(sessions);
  let start = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].dayId === "push") {
      start = i;
      break;
    }
  }
  return sorted.slice(start);
}

/** Status of every day in the cycle, for the home strip. */
export function cycleStatus(sessions: readonly Session[]): Record<DayId, DayStatus> {
  const done = new Set(currentCycle(sessions).map((s) => s.dayId));
  const next = nextDayId(sessions);
  const out = {} as Record<DayId, DayStatus>;
  for (const id of DAY_IDS) {
    out[id] = done.has(id) ? "done" : id === next ? "next" : "upcoming";
  }
  return out;
}

/** Local calendar date as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function newSessionId(now: number = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
