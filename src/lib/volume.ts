import type { ExerciseLog, Muscle, MuscleGroup, Session } from "./types";
import { getExercise } from "@/data/exercises";
import { ALL_SLOTS } from "@/data/program";
import { MUSCLE_ORDER, MUSCLE_TARGETS, GROUP_ORDER } from "@/data/targets";
import { defaultLoggedRir } from "./rir";

export type MuscleTotals = Record<Muscle, number>;

export function emptyTotals(): MuscleTotals {
  const t = {} as MuscleTotals;
  for (const m of MUSCLE_ORDER) t[m] = 0;
  return t;
}

/** A set counts as performed when reps were recorded, including 0 for a partials-only finisher. */
export function performedSets(log: ExerciseLog): number {
  return log.sets.filter((s) => s.reps !== null).length;
}

/** Fractional set credit per muscle, summed across the given logs. */
export function effectiveSets(logs: readonly ExerciseLog[]): MuscleTotals {
  const totals = emptyTotals();
  for (const log of logs) {
    const n = performedSets(log);
    if (n === 0) continue;
    const ex = getExercise(log.exerciseId);
    for (const [muscle, mult] of Object.entries(ex.multipliers)) {
      totals[muscle as Muscle] += n * (mult ?? 0);
    }
  }
  return totals;
}

export function sessionsEffectiveSets(sessions: readonly Session[]): MuscleTotals {
  return effectiveSets(sessions.flatMap((s) => s.logs));
}

export function groupTotals(totals: MuscleTotals): Record<MuscleGroup, number> {
  const g = {} as Record<MuscleGroup, number>;
  for (const grp of GROUP_ORDER) g[grp] = 0;
  for (const m of MUSCLE_ORDER) g[MUSCLE_TARGETS[m].group] += totals[m];
  return g;
}

/**
 * One full cycle with every prescribed set performed. Used by the test that
 * proves the multipliers reproduce the sheet, and by the UI as the target.
 */
export function prescribedCycleLogs(): ExerciseLog[] {
  return ALL_SLOTS.map((slot) => ({
    slotId: slot.id,
    exerciseId: slot.exerciseId,
    load: null,
    sets: slot.rir.map((t) => ({ reps: slot.repRange.lo, rir: defaultLoggedRir(t) })),
  }));
}
