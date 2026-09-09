import { describe, expect, it } from "vitest";
import {
  effectiveSets,
  groupTotals,
  performedSets,
  prescribedCycleLogs,
} from "./volume";
import { MUSCLE_ORDER, MUSCLE_TARGETS, GROUP_TARGETS, GROUP_ORDER } from "@/data/targets";
import { ALL_SLOTS, PROGRAM, getSlot } from "@/data/program";
import { EXERCISES } from "@/data/exercises";
import type { ExerciseLog } from "./types";

describe("program data integrity", () => {
  it("has 7 days, 5 training, 35 slots", () => {
    expect(PROGRAM).toHaveLength(7);
    expect(PROGRAM.filter((d) => d.kind === "training")).toHaveLength(5);
    expect(ALL_SLOTS).toHaveLength(35);
  });

  it("references only known exercises and has 26 unique movements", () => {
    const ids = new Set(ALL_SLOTS.map((s) => s.exerciseId));
    for (const id of ids) expect(EXERCISES).toHaveProperty(id);
    expect(ids.size).toBe(26);
    expect(Object.keys(EXERCISES)).toHaveLength(26);
  });

  it("every multiplier is 1, 0.5, or 0.25", () => {
    for (const ex of Object.values(EXERCISES)) {
      for (const v of Object.values(ex.multipliers)) {
        expect([1, 0.5, 0.25]).toContain(v);
      }
    }
  });
});

describe("effectiveSets over a full cycle", () => {
  const totals = effectiveSets(prescribedCycleLogs());

  it.each(MUSCLE_ORDER.map((m) => [m, MUSCLE_TARGETS[m].total] as const))(
    "%s equals the sheet total %d",
    (muscle, expected) => {
      expect(totals[muscle]).toBeCloseTo(expected, 6);
    },
  );

  it.each(GROUP_ORDER.map((g) => [g, GROUP_TARGETS[g]] as const))(
    "group %s equals the sheet total %d",
    (group, expected) => {
      expect(groupTotals(totals)[group]).toBeCloseTo(expected, 6);
    },
  );

  it("direct sets per muscle equal the sheet's Direct column", () => {
    // Direct = sets where multiplier is exactly 1.
    const direct: Record<string, number> = {};
    for (const slot of ALL_SLOTS) {
      const ex = EXERCISES[slot.exerciseId as keyof typeof EXERCISES];
      for (const [m, v] of Object.entries(ex.multipliers)) {
        if (v === 1) direct[m] = (direct[m] ?? 0) + slot.sets;
      }
    }
    for (const m of MUSCLE_ORDER) {
      expect(direct[m] ?? 0).toBe(MUSCLE_TARGETS[m].direct);
    }
  });
});

describe("performedSets", () => {
  it("counts sets with recorded reps, including a 0-rep beyond-failure finisher", () => {
    const log: ExerciseLog = {
      slotId: "push:hammer-curls",
      exerciseId: "hammer-curls",
      load: 30,
      sets: [
        { reps: 10, rir: 2 },
        { reps: 9, rir: 1 },
        { reps: 0, rir: -1 },
      ],
    };
    expect(performedSets(log)).toBe(3);
  });

  it("ignores sets that were not performed", () => {
    const log: ExerciseLog = {
      slotId: "push:bench-press",
      exerciseId: "bench-press",
      load: 135,
      sets: [
        { reps: 6, rir: 3 },
        { reps: 6, rir: 2 },
        { reps: null, rir: null },
        { reps: null, rir: null },
      ],
    };
    expect(performedSets(log)).toBe(2);
    const t = effectiveSets([log]);
    expect(t.chest).toBe(2);
    expect(t.anteriorDelts).toBe(1);
    expect(t.triceps).toBe(0.5);
  });
});

describe("a logged Push day", () => {
  it("credits muscles as the plan's manual check expects", () => {
    const push = PROGRAM[0];
    const logs = push.slots.map((s) => ({
      slotId: s.id,
      exerciseId: s.exerciseId,
      load: 100,
      sets: s.rir.map(() => ({ reps: s.repRange.lo, rir: 0 })),
    }));
    const t = effectiveSets(logs);
    expect(t.chest).toBe(10);
    expect(t.anteriorDelts).toBe(3.5);
    expect(t.triceps).toBe(1.75);
    expect(t.lats).toBe(2);
    expect(t.biceps).toBe(5.5);
    expect(t.brachialis).toBe(4.5);
    expect(t.brachioradialis).toBe(2.25);
    expect(t.lateralDelts).toBe(3);
    expect(t.midLowTraps).toBe(0.5);
    expect(t.rearDelts).toBe(0.5);
    expect(getSlot("push:bench-press")?.repRange).toEqual({ lo: 5, hi: 8 });
  });
});
