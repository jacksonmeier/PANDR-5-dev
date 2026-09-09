import type { Exercise } from "@/lib/types";

/**
 * The 26 unique movements in PANDR-5 v1.1.1 with their fractional set credit.
 *
 * The sheet publishes per-muscle weekly totals, not per-exercise multipliers.
 * These multipliers were reverse-derived so that a full cycle reproduces every
 * number in the sheet's "Sets Per Muscle Group Per Week" table exactly.
 * `src/lib/volume.test.ts` proves it.
 *
 * Weighting: primary mover 1, secondary synergist 0.5, tertiary 0.25.
 */
export const EXERCISES = {
  "bench-press": {
    id: "bench-press",
    name: "Bench Press",
    multipliers: { chest: 1, anteriorDelts: 0.5, triceps: 0.25 },
    technicalFailure: true,
  },
  "incline-db-press": {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    multipliers: { chest: 1, anteriorDelts: 0.5, triceps: 0.25 },
  },
  "machine-chest-flyes": {
    id: "machine-chest-flyes",
    name: "Machine Chest Flyes",
    multipliers: { chest: 1 },
  },
  "close-grip-chinups": {
    id: "close-grip-chinups",
    name: "Close-Grip Chinups (Assisted, BW, or Weighted)",
    multipliers: { lats: 1, biceps: 0.5, midLowTraps: 0.25, rearDelts: 0.25 },
  },
  "preacher-curls": {
    id: "preacher-curls",
    name: "Preacher Curls (Machine)",
    multipliers: { biceps: 1, brachialis: 0.5, brachioradialis: 0.25 },
  },
  "hammer-curls": {
    id: "hammer-curls",
    name: "Hammer Curls",
    multipliers: { brachialis: 1, biceps: 0.5, brachioradialis: 0.5 },
  },
  "lateral-raise": {
    id: "lateral-raise",
    name: "Lateral Raise",
    multipliers: { lateralDelts: 1 },
  },
  "single-arm-db-row": {
    id: "single-arm-db-row",
    name: "Single-Arm Bent-Over Dumbbell Row",
    multipliers: { lats: 1, biceps: 0.5, midLowTraps: 0.5, rearDelts: 0.5 },
  },
  "lat-pulldown": {
    id: "lat-pulldown",
    name: "Lat Pulldown (Standard Bar)",
    multipliers: { lats: 1, biceps: 0.5, midLowTraps: 0.25, rearDelts: 0.25 },
  },
  "lat-pullovers": {
    id: "lat-pullovers",
    name: "Lat Pullovers (Cable; any attachment)",
    multipliers: { lats: 1 },
  },
  "ez-bar-tricep-oh-ext": {
    id: "ez-bar-tricep-oh-ext",
    name: "Ez-Bar Tricep Overhead Extension",
    multipliers: { triceps: 1 },
  },
  "tricep-cable-pushdown": {
    id: "tricep-cable-pushdown",
    name: "Tricep Cable Pushdown (preferred attachment)",
    multipliers: { triceps: 1 },
  },
  "tricep-cable-oh-ext": {
    id: "tricep-cable-oh-ext",
    name: "Tricep Cable Overhead Extension (preferred attachment)",
    multipliers: { triceps: 1 },
  },
  "seated-hamstring-curls": {
    id: "seated-hamstring-curls",
    name: "Seated Hamstring Curls",
    multipliers: { hamstrings: 1 },
  },
  rdl: {
    id: "rdl",
    name: "RDL (Barbell or Dumbbell)",
    multipliers: { hamstrings: 1, gluteMax: 0.5, erectors: 0.5 },
    technicalFailure: true,
  },
  "leg-press": {
    id: "leg-press",
    name: "Leg Press",
    multipliers: { quads: 1, gluteMax: 0.5, hamstrings: 0.5, adductors: 0.5 },
  },
  "db-heel-elevated-squat": {
    id: "db-heel-elevated-squat",
    name: "Dumbbell Heel-Elevated Squat",
    multipliers: { quads: 1, gluteMax: 0.25 },
  },
  "leg-extension": {
    id: "leg-extension",
    name: "Leg Extension",
    multipliers: { quads: 1 },
  },
  "standing-calf-raise": {
    id: "standing-calf-raise",
    name: "Standing Calf Raise (Machine)",
    multipliers: { gastroc: 1, soleus: 0.5 },
  },
  "wide-grip-cable-rows": {
    id: "wide-grip-cable-rows",
    name: "Wide-Grip Seated Cable Rows",
    multipliers: { lats: 1, biceps: 0.5, midLowTraps: 0.5, rearDelts: 0.5 },
  },
  "incline-pushups": {
    id: "incline-pushups",
    name: "Incline/Elevated Pushups",
    multipliers: { chest: 1, anteriorDelts: 0.5, triceps: 0.25 },
  },
  "incline-curls": {
    id: "incline-curls",
    name: "Incline Curls",
    multipliers: { biceps: 1, brachialis: 0.5, brachioradialis: 0.25 },
  },
  "lying-hamstring-curls": {
    id: "lying-hamstring-curls",
    name: "Lying Hamstring Curls",
    multipliers: { hamstrings: 1 },
  },
  "hip-extension-45": {
    id: "hip-extension-45",
    name: "45° Hip Extension",
    multipliers: { hamstrings: 0.5, gluteMax: 0.5, erectors: 0.5 },
  },
  "hack-squat": {
    id: "hack-squat",
    name: "Hack Squat",
    multipliers: { quads: 1, gluteMax: 0.5, hamstrings: 0.5, adductors: 0.5 },
  },
  lunges: {
    id: "lunges",
    name: "Lunges",
    multipliers: {
      quads: 1,
      gluteMax: 1,
      gluteMedMin: 0.5,
      hamstrings: 0.5,
      adductors: 0.25,
    },
  },
} as const satisfies Record<string, Exercise>;

export type ExerciseId = keyof typeof EXERCISES;

export const EXERCISE_LIST: readonly Exercise[] = Object.values(EXERCISES);

export function getExercise(id: string): Exercise {
  const ex = (EXERCISES as Record<string, Exercise>)[id];
  if (!ex) throw new Error(`Unknown exercise id: ${id}`);
  return ex;
}
