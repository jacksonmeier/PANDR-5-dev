/**
 * The live-session engine: everything about a workout that is underway but not
 * yet complete. Pure, so the rules can be tested without React.
 *
 * An `ActiveSession` is deliberately *not* a `Session`. It is held apart from
 * the log until the lifter marks it complete, which keeps a half-finished
 * workout out of progression, volume, history and the cycle strip.
 */

import type { ActiveSession, ExerciseLog, LoggedSet, Session, Slot } from "./types";
import { defaultLoggedRir } from "./rir";

/** A set row with nothing logged, defaulting the RIR to the prescribed target. */
export function blankSets(slot: Slot): LoggedSet[] {
  return slot.rir.map((t) => ({ reps: null, rir: defaultLoggedRir(t) }));
}

/**
 * `slots`, arranged by `order`.
 *
 * Every slot comes back exactly once. Ids in `order` that no longer exist are
 * dropped and slots `order` says nothing about keep their program position at
 * the end, so an order written against an older program still arranges what it
 * can instead of being thrown away.
 */
export function orderSlots(slots: readonly Slot[], order: readonly string[]): Slot[] {
  const byId = new Map(slots.map((s) => [s.id, s]));
  const out: Slot[] = [];
  const seen = new Set<string>();
  for (const id of order) {
    const slot = byId.get(id);
    if (slot && !seen.has(id)) {
      out.push(slot);
      seen.add(id);
    }
  }
  for (const slot of slots) if (!seen.has(slot.id)) out.push(slot);
  return out;
}

/**
 * Move one slot `delta` places within `order`. Out of range is a no-op, so the
 * first exercise's "up" and the last one's "down" do nothing rather than wrap.
 */
export function reorder(order: readonly string[], id: string, delta: number): string[] {
  const from = order.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return [...order];
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

/**
 * Logs for `slots`, taking whatever `logs` already has for each slot and
 * filling the rest in blank.
 *
 * Every read of a stored session goes through this. The program can gain a set
 * or an exercise under a session that was written against an older version, so
 * the slot list is always the authority on shape and the stored log only
 * supplies values.
 *
 * The stored log also supplies the *order*: the array is the order the lifter
 * put the exercises in, so a session resumes, and reads back in history, in the
 * order it was actually performed. Slots the log has never seen stay in program
 * order at the end.
 */
export function alignLogs(slots: readonly Slot[], logs: readonly ExerciseLog[]): ExerciseLog[] {
  return orderSlots(
    slots,
    logs.map((l) => l.slotId),
  ).map((slot) => {
    const found = logs.find((l) => l.slotId === slot.id);
    const blanks = blankSets(slot);
    return {
      slotId: slot.id,
      exerciseId: slot.exerciseId,
      load: found?.load ?? null,
      sets: blanks.map((b, i) => found?.sets[i] ?? b),
    };
  });
}

/** Sets with a rep count recorded. The progress denominator is the slot count. */
export function loggedSetCount(logs: readonly ExerciseLog[]): number {
  return logs.reduce((n, l) => n + l.sets.filter((s) => s.reps !== null).length, 0);
}

/** Exercises with at least one set recorded. */
export function loggedExerciseCount(logs: readonly ExerciseLog[]): number {
  return logs.filter((l) => l.sets.some((s) => s.reps !== null)).length;
}

/** True once anything at all has been recorded. */
export function hasLoggedWork(logs: readonly ExerciseLog[]): boolean {
  return loggedSetCount(logs) > 0;
}

/**
 * The completed session an active session becomes.
 *
 * `createdAt` is the completion time, not the start time: it is the ordering
 * key for "newest", and a workout that started yesterday and was completed
 * today is, for progression, today's.
 */
export function completedSession(active: ActiveSession, now: number = Date.now()): Session {
  return {
    id: active.id,
    dayId: active.dayId,
    date: active.date,
    createdAt: now,
    logs: active.logs,
  };
}

/** Milliseconds the session has been running. Never negative. */
export function elapsedMs(active: ActiveSession, now: number = Date.now()): number {
  return Math.max(0, now - active.startedAt);
}

/** Clock for the running session: `12:34`, or `1:02:03` past the hour. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Coarse age for prose, e.g. "started 40 minutes ago". */
export function formatAgo(ms: number): string {
  const mins = Math.floor(Math.max(0, ms) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
