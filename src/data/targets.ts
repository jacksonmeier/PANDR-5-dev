import type { Muscle, MuscleGroup } from "@/lib/types";

/**
 * "Sets Per Muscle Group Per Week" from the Guide Sheet, v1.1.1.
 * Direct = sets where the muscle is the primary mover.
 * Fractional = credit from secondary (0.5) and tertiary (0.25) roles.
 */
export interface MuscleTarget {
  name: string;
  group: MuscleGroup;
  direct: number;
  fractional: number;
  total: number;
}

export const MUSCLE_TARGETS: Record<Muscle, MuscleTarget> = {
  chest: { name: "Chest (pec major)", group: "chest", direct: 20, fractional: 0, total: 20 },
  anteriorDelts: { name: "Anterior Delts", group: "shoulders", direct: 0, fractional: 7, total: 7 },
  lateralDelts: { name: "Lateral Delts", group: "shoulders", direct: 9, fractional: 0, total: 9 },
  rearDelts: { name: "Rear Delts", group: "shoulders", direct: 0, fractional: 5, total: 5 },
  triceps: { name: "Triceps", group: "arms", direct: 15, fractional: 3.5, total: 18.5 },
  biceps: { name: "Biceps (Brachii)", group: "arms", direct: 7, fractional: 8, total: 15 },
  brachialis: { name: "Brachialis", group: "arms", direct: 3, fractional: 3.5, total: 6.5 },
  brachioradialis: { name: "Brachioradialis", group: "arms", direct: 0, fractional: 3.25, total: 3.25 },
  lats: { name: "Lats / Teres Major", group: "back", direct: 20, fractional: 0, total: 20 },
  midLowTraps: { name: "Mid / Low Traps & Rhomboids", group: "back", direct: 0, fractional: 5, total: 5 },
  upperTraps: { name: "Upper Traps", group: "back", direct: 0, fractional: 0, total: 0 },
  quads: { name: "Quads", group: "legs", direct: 20, fractional: 0, total: 20 },
  hamstrings: { name: "Hamstrings", group: "legs", direct: 12, fractional: 7.5, total: 19.5 },
  gluteMax: { name: "Glute Max", group: "legs", direct: 3, fractional: 8.75, total: 11.75 },
  gluteMedMin: { name: "Glute Med / Min", group: "legs", direct: 0, fractional: 1.5, total: 1.5 },
  adductors: { name: "Adductors", group: "legs", direct: 0, fractional: 4.75, total: 4.75 },
  gastroc: { name: "Gastrocnemius", group: "legs", direct: 10, fractional: 0, total: 10 },
  soleus: { name: "Soleus", group: "legs", direct: 0, fractional: 5, total: 5 },
  erectors: { name: "Erector Spinae", group: "legs", direct: 0, fractional: 4, total: 4 },
};

/** Sheet row order. */
export const MUSCLE_ORDER: readonly Muscle[] = [
  "chest",
  "anteriorDelts",
  "lateralDelts",
  "rearDelts",
  "triceps",
  "biceps",
  "brachialis",
  "brachioradialis",
  "lats",
  "midLowTraps",
  "upperTraps",
  "quads",
  "hamstrings",
  "gluteMax",
  "gluteMedMin",
  "adductors",
  "gastroc",
  "soleus",
  "erectors",
];

export const GROUP_ORDER: readonly MuscleGroup[] = [
  "chest",
  "shoulders",
  "arms",
  "back",
  "legs",
];

export const GROUP_NAMES: Record<MuscleGroup, string> = {
  chest: "Chest",
  shoulders: "Shoulders",
  arms: "Arms",
  back: "Back",
  legs: "Legs",
};

/** "Total Sets (Whole Group)" column. */
export const GROUP_TARGETS: Record<MuscleGroup, number> = {
  chest: 20,
  shoulders: 21,
  arms: 43.25,
  back: 25,
  legs: 76.5,
};

/** The sheet's "optimal (yet very wide) range of 10-20ish" sets per week. */
export const OPTIMAL_RANGE = { lo: 10, hi: 20 } as const;

export const VOLUME_NOTE =
  "The total set count shown here does not mean you'll be performing all those sets back-to-back for each muscle group. Many of these sets are counted across overlapping, synergistic muscles. In practice, you only need to follow the set numbers listed in your written plan as those already account for all the indirect work. What this table aims to demonstrate is how close a given muscle group is to the optimal (yet very wide) range of 10-20ish (maybe a few more) sets per week.";

export const WEIGHTING_NOTE =
  "Primary Mover ≈ 1 Set | Secondary Synergist ≈ 1/2 Set | Tertiary/Minor Synergist ≈ 1/4 Set";
