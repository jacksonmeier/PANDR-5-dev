/**
 * Core domain types for the PANDR-5 tracker.
 *
 * No React here. `lib/` and `data/` are plain TypeScript so the engines can be
 * unit-tested in Node and reused anywhere.
 */

export type Muscle =
  | "chest"
  | "anteriorDelts"
  | "lateralDelts"
  | "rearDelts"
  | "triceps"
  | "biceps"
  | "brachialis"
  | "brachioradialis"
  | "lats"
  | "midLowTraps"
  | "upperTraps"
  | "quads"
  | "hamstrings"
  | "gluteMax"
  | "gluteMedMin"
  | "adductors"
  | "gastroc"
  | "soleus"
  | "erectors";

export type MuscleGroup = "chest" | "shoulders" | "arms" | "back" | "legs";

export type DayId =
  | "push"
  | "pull"
  | "legs"
  | "rest1"
  | "upper"
  | "lower"
  | "rest2";

export type TrainingDayId = Exclude<DayId, "rest1" | "rest2">;

/** Prescribed RIR for one set, as written in the sheet. `<0` is beyond failure. */
export type RirTarget = "3" | "2" | "1" | "0" | "0-1" | "<0";

export type Unit = "lb" | "kg";

export interface Exercise {
  id: string;
  name: string;
  /** Fractional set credit per muscle. 1 = primary, 0.5 = secondary, 0.25 = tertiary. */
  multipliers: Partial<Record<Muscle, number>>;
  /** Heavy barbell compound: 0 RIR means technical failure (last clean rep). */
  technicalFailure?: true;
}

export interface RepRange {
  lo: number;
  hi: number;
}

/** One exercise as prescribed on one day. Progression is keyed by slot id. */
export interface Slot {
  /** `${dayId}:${exerciseId}` */
  id: string;
  dayId: TrainingDayId;
  exerciseId: string;
  sets: number;
  repRange: RepRange;
  rir: readonly RirTarget[];
}

export interface Day {
  id: DayId;
  kind: "training" | "rest";
  /** e.g. "Push + NCP" */
  label: string;
  /** e.g. "Push" */
  shortLabel: string;
  /** 1-based position in the cycle, matching the sheet's (1) to (7). */
  position: number;
  slots: readonly Slot[];
}

/** What the lifter actually did on one set. `null` = not performed. */
export interface LoggedSet {
  reps: number | null;
  /** Achieved RIR. -1 = beyond failure. */
  rir: number | null;
}

export interface ExerciseLog {
  slotId: string;
  exerciseId: string;
  /** One load for all working sets, per the methodology. */
  load: number | null;
  /** Length equals the slot's prescribed set count. */
  sets: LoggedSet[];
}

export interface Session {
  id: string;
  dayId: DayId;
  /** ISO date, YYYY-MM-DD, in the lifter's local time. */
  date: string;
  /** Epoch ms. Ordering key for "newest". */
  createdAt: number;
  /** Empty for rest days. */
  logs: ExerciseLog[];
  notes?: string;
}

export interface Settings {
  unit: Unit;
  /** Percent bump when the anchor set reaches the top of the range. */
  increasePercent: number;
  /** Percent drop when the anchor set misses the floor at 0-1 RIR. */
  decreasePercent: number;
}

export type SuggestionAction = "increase" | "decrease" | "hold" | "seed" | "none";

export interface Suggestion {
  action: SuggestionAction;
  /** Suggested load for the next session in the current unit. */
  load: number | null;
  /** Human-readable explanation shown on the card. */
  reason: string;
  /** The log the decision was based on, when there was one. */
  basedOn?: {
    sessionId: string;
    date: string;
    load: number;
    anchorReps: number | null;
    anchorRir: number | null;
  };
}
