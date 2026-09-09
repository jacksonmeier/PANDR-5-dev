import type {
  Day,
  DayId,
  RirTarget,
  Slot,
  TrainingDayId,
} from "@/lib/types";
import type { ExerciseId } from "./exercises";

export const PROGRAM_VERSION = "1.1.1";

function slot(
  dayId: TrainingDayId,
  exerciseId: ExerciseId,
  sets: number,
  lo: number,
  hi: number,
  rir: readonly RirTarget[],
): Slot {
  if (rir.length !== sets) {
    throw new Error(
      `Slot ${dayId}:${exerciseId} prescribes ${sets} sets but ${rir.length} RIR targets`,
    );
  }
  return { id: `${dayId}:${exerciseId}`, dayId, exerciseId, sets, repRange: { lo, hi }, rir };
}

/**
 * PANDR-5 v1.1.1, in cycle order. Transcribed from the Guide Sheet.
 */
export const PROGRAM: readonly Day[] = [
  {
    id: "push",
    kind: "training",
    label: "Push + NCP",
    shortLabel: "Push",
    position: 1,
    slots: [
      slot("push", "bench-press", 4, 5, 8, ["3", "2", "1", "0-1"]),
      slot("push", "incline-db-press", 3, 8, 11, ["2", "1", "0-1"]),
      slot("push", "machine-chest-flyes", 3, 12, 15, ["1", "0", "<0"]),
      slot("push", "close-grip-chinups", 2, 5, 7, ["2", "0-1"]),
      slot("push", "preacher-curls", 3, 8, 12, ["2", "1", "0-1"]),
      slot("push", "hammer-curls", 3, 8, 12, ["2", "0-1", "<0"]),
      slot("push", "lateral-raise", 3, 8, 12, ["1", "0-1", "<0"]),
    ],
  },
  {
    id: "pull",
    kind: "training",
    label: "Pull + NCP",
    shortLabel: "Pull",
    position: 2,
    slots: [
      slot("pull", "single-arm-db-row", 3, 6, 9, ["3", "2", "0-1"]),
      slot("pull", "lat-pulldown", 4, 8, 11, ["3", "2", "1", "0-1"]),
      slot("pull", "lat-pullovers", 3, 12, 15, ["2", "0-1", "<0"]),
      slot("pull", "ez-bar-tricep-oh-ext", 3, 6, 9, ["3", "2", "0-1"]),
      slot("pull", "tricep-cable-pushdown", 3, 10, 12, ["3", "2", "0-1"]),
      slot("pull", "tricep-cable-oh-ext", 3, 12, 15, ["2", "0-1", "<0"]),
    ],
  },
  {
    id: "legs",
    kind: "training",
    label: "Legs",
    shortLabel: "Legs",
    position: 3,
    slots: [
      slot("legs", "seated-hamstring-curls", 4, 8, 10, ["3", "2", "1", "0-1"]),
      slot("legs", "rdl", 4, 5, 8, ["3", "2", "1", "0-1"]),
      slot("legs", "leg-press", 4, 6, 9, ["3", "2", "1", "0-1"]),
      slot("legs", "db-heel-elevated-squat", 3, 12, 15, ["2", "0-1", "<0"]),
      slot("legs", "leg-extension", 3, 10, 12, ["2", "1", "0-1"]),
      slot("legs", "standing-calf-raise", 5, 12, 15, ["3", "2", "1", "0-1", "<0"]),
      slot("legs", "lateral-raise", 3, 8, 12, ["1", "0-1", "<0"]),
    ],
  },
  {
    id: "rest1",
    kind: "rest",
    label: "Active Rest",
    shortLabel: "Rest",
    position: 4,
    slots: [],
  },
  {
    id: "upper",
    kind: "training",
    label: "Upper",
    shortLabel: "Upper",
    position: 5,
    slots: [
      slot("upper", "wide-grip-cable-rows", 4, 8, 10, ["3", "2", "1", "0-1"]),
      slot("upper", "lat-pullovers", 4, 12, 15, ["3", "2", "0-1", "<0"]),
      slot("upper", "incline-db-press", 4, 6, 9, ["3", "2", "1", "0-1"]),
      slot("upper", "machine-chest-flyes", 3, 10, 12, ["3", "2", "0-1"]),
      slot("upper", "incline-pushups", 3, 10, 20, ["1", "0-1", "<0"]),
      slot("upper", "incline-curls", 4, 8, 12, ["2", "1", "0-1", "<0"]),
      slot("upper", "tricep-cable-pushdown", 3, 8, 12, ["2", "1", "0-1"]),
      slot("upper", "tricep-cable-oh-ext", 3, 12, 15, ["2", "0-1", "<0"]),
    ],
  },
  {
    id: "lower",
    kind: "training",
    label: "Lower",
    shortLabel: "Lower",
    position: 6,
    slots: [
      slot("lower", "lying-hamstring-curls", 4, 8, 12, ["3", "2", "1", "0-1"]),
      slot("lower", "hip-extension-45", 4, 10, 15, ["3", "2", "1", "0-1"]),
      slot("lower", "hack-squat", 4, 5, 8, ["3", "2", "1", "0-1"]),
      slot("lower", "leg-extension", 3, 10, 12, ["2", "0-1", "<0"]),
      slot("lower", "lunges", 3, 7, 10, ["3", "2", "0-1"]),
      slot("lower", "standing-calf-raise", 5, 12, 15, ["3", "2", "1", "0-1", "<0"]),
      slot("lower", "lateral-raise", 3, 8, 12, ["1", "0-1", "<0"]),
    ],
  },
  {
    id: "rest2",
    kind: "rest",
    label: "Active Rest",
    shortLabel: "Rest",
    position: 7,
    slots: [],
  },
];

export const DAY_IDS: readonly DayId[] = PROGRAM.map((d) => d.id);

export const TRAINING_DAY_IDS: readonly TrainingDayId[] = PROGRAM.filter(
  (d) => d.kind === "training",
).map((d) => d.id as TrainingDayId);

export const ALL_SLOTS: readonly Slot[] = PROGRAM.flatMap((d) => d.slots);

const DAY_BY_ID = new Map(PROGRAM.map((d) => [d.id, d]));
const SLOT_BY_ID = new Map(ALL_SLOTS.map((s) => [s.id, s]));

export function getDay(id: string): Day | undefined {
  return DAY_BY_ID.get(id as DayId);
}

export function isDayId(id: string): id is DayId {
  return DAY_BY_ID.has(id as DayId);
}

export function isTrainingDayId(id: string): id is TrainingDayId {
  const d = DAY_BY_ID.get(id as DayId);
  return d?.kind === "training";
}

export function getSlot(id: string): Slot | undefined {
  return SLOT_BY_ID.get(id);
}

/** Position in the 7-day cycle, 0-based. */
export function dayIndex(id: DayId): number {
  return PROGRAM.findIndex((d) => d.id === id);
}

/** The day that follows `id` in the cycle, wrapping from rest2 back to push. */
export function nextDayId(id: DayId): DayId {
  const i = dayIndex(id);
  return PROGRAM[(i + 1) % PROGRAM.length].id;
}
