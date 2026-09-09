import { describe, expect, it } from "vitest";
import { decreaseLoad, increaseLoad, suggestNextLoad } from "./progression";
import { anchorIndex } from "./rir";
import { getSlot } from "@/data/program";
import { DEFAULT_THEME } from "./theme";
import type { LoggedSet, Session, Settings, Slot } from "./types";

const settings: Settings = {
  unit: "lb",
  increasePercent: 2.5,
  decreasePercent: 2.5,
  theme: DEFAULT_THEME,
};

function slotOrThrow(id: string): Slot {
  const s = getSlot(id);
  if (!s) throw new Error(id);
  return s;
}

function session(
  slot: Slot,
  load: number,
  sets: LoggedSet[],
  opts: { id?: string; date?: string; createdAt?: number } = {},
): Session {
  return {
    id: opts.id ?? "s1",
    dayId: slot.dayId,
    date: opts.date ?? "2026-09-08",
    createdAt: opts.createdAt ?? 1,
    logs: [{ slotId: slot.id, exerciseId: slot.exerciseId, load, sets }],
  };
}

/** Fill every set at the given reps and rir, then override the anchor. */
function fullSets(slot: Slot, reps: number, rir: number, anchor?: Partial<LoggedSet>): LoggedSet[] {
  const sets: LoggedSet[] = slot.rir.map(() => ({ reps, rir }));
  const ai = anchorIndex(slot.rir);
  sets[ai] = { ...sets[ai], ...anchor };
  return sets;
}

describe("anchorIndex", () => {
  it("is the last set when there is no beyond-failure finisher", () => {
    expect(anchorIndex(["3", "2", "1", "0-1"])).toBe(3);
  });
  it("is the set before a <0 finisher", () => {
    expect(anchorIndex(["2", "0-1", "<0"])).toBe(1);
    expect(anchorIndex(["3", "2", "1", "0-1", "<0"])).toBe(3);
  });
});

describe("load math", () => {
  it("increases by percent, rounded, never less than one increment", () => {
    expect(increaseLoad(135, 2.5, 2.5)).toBe(137.5);
    expect(increaseLoad(20, 2.5, 2.5)).toBe(22.5);
    expect(increaseLoad(200, 5, 2.5)).toBe(210);
    expect(increaseLoad(60, 2.5, 1.25)).toBe(61.25);
  });
  it("decreases by percent, rounded, never less than one increment, never below zero", () => {
    expect(decreaseLoad(135, 2.5, 2.5)).toBe(132.5);
    expect(decreaseLoad(20, 2.5, 2.5)).toBe(17.5);
    expect(decreaseLoad(2.5, 2.5, 2.5)).toBe(0);
  });
});

describe("suggestNextLoad", () => {
  const bench = slotOrThrow("push:bench-press"); // 4 sets, 5-8, anchor set 4

  it("has nothing to say with no history", () => {
    const s = suggestNextLoad(bench, [], settings);
    expect(s.action).toBe("none");
    expect(s.load).toBeNull();
  });

  it("increases when the anchor reaches the top of the range", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 6, 2, { reps: 8, rir: 1 }))], settings);
    expect(s.action).toBe("increase");
    expect(s.load).toBe(137.5);
  });

  it("increases on overshoot even with RIR to spare", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 8, 2, { reps: 9, rir: 2 }))], settings);
    expect(s.action).toBe("increase");
  });

  it("decreases when the anchor misses the floor at 0-1 RIR", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 5, 2, { reps: 4, rir: 0 }))], settings);
    expect(s.action).toBe("decrease");
    expect(s.load).toBe(132.5);
  });

  it("holds when the anchor misses the floor but was not near failure", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 5, 3, { reps: 4, rir: 2 }))], settings);
    expect(s.action).toBe("hold");
    expect(s.load).toBe(135);
  });

  it("holds and chases reps inside the range", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 6, 2, { reps: 6, rir: 1 }))], settings);
    expect(s.action).toBe("hold");
    expect(s.reason).toMatch(/chase 8/);
  });

  it("holds and asks for effort when inside the range but easier than 1 RIR", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 6, 3, { reps: 6, rir: 3 }))], settings);
    expect(s.action).toBe("hold");
    expect(s.reason).toMatch(/0-1 RIR/);
  });

  it("treats a null anchor RIR as the prescribed target", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 5, 2, { reps: 4, rir: null }))], settings);
    expect(s.action).toBe("decrease");
  });

  it("holds when the anchor set was not logged", () => {
    const s = suggestNextLoad(bench, [session(bench, 135, fullSets(bench, 6, 2, { reps: null, rir: null }))], settings);
    expect(s.action).toBe("hold");
    expect(s.load).toBe(135);
    expect(s.reason).toMatch(/not logged/);
  });

  it("uses the set before a beyond-failure finisher as the anchor", () => {
    const hammer = slotOrThrow("push:hammer-curls"); // 3 sets, 8-12, RIR 2, 0-1, <0
    const sets: LoggedSet[] = [
      { reps: 12, rir: 2 },
      { reps: 12, rir: 1 },
      { reps: 3, rir: -1 },
    ];
    const s = suggestNextLoad(hammer, [session(hammer, 30, sets)], settings);
    expect(s.action).toBe("increase");
    expect(s.load).toBe(32.5);
    expect(s.basedOn?.anchorReps).toBe(12);
  });

  it("applies the minimum-increment rule on light loads", () => {
    const lat = slotOrThrow("push:lateral-raise"); // 8-12, anchor set 2
    const sets: LoggedSet[] = [
      { reps: 12, rir: 1 },
      { reps: 12, rir: 0 },
      { reps: 4, rir: -1 },
    ];
    const s = suggestNextLoad(lat, [session(lat, 20, sets)], settings);
    expect(s.load).toBe(22.5);
  });

  it("judges each slot against its own rep range", () => {
    const pushIncline = slotOrThrow("push:incline-db-press"); // 8-11
    const upperIncline = slotOrThrow("upper:incline-db-press"); // 6-9
    const sessions = [
      session(pushIncline, 60, fullSets(pushIncline, 9, 1, { reps: 9, rir: 1 }), { id: "p", createdAt: 1 }),
      session(upperIncline, 60, fullSets(upperIncline, 9, 1, { reps: 9, rir: 1 }), { id: "u", createdAt: 2 }),
    ];
    expect(suggestNextLoad(pushIncline, sessions, settings).action).toBe("hold");
    expect(suggestNextLoad(upperIncline, sessions, settings).action).toBe("increase");
  });

  it("seeds a slot with no history from the same exercise on another day", () => {
    const pushIncline = slotOrThrow("push:incline-db-press");
    const upperIncline = slotOrThrow("upper:incline-db-press");
    const sessions = [session(pushIncline, 60, fullSets(pushIncline, 8, 1))];
    const s = suggestNextLoad(upperIncline, sessions, settings);
    expect(s.action).toBe("seed");
    expect(s.load).toBe(60);
  });

  it("uses the newest session by createdAt, not array order", () => {
    const older = session(bench, 130, fullSets(bench, 8, 1, { reps: 8, rir: 1 }), { id: "old", createdAt: 5 });
    const newer = session(bench, 135, fullSets(bench, 6, 1, { reps: 6, rir: 1 }), { id: "new", createdAt: 9 });
    const s = suggestNextLoad(bench, [newer, older], settings);
    expect(s.action).toBe("hold");
    expect(s.load).toBe(135);
  });

  it("ignores logs without a load", () => {
    const noLoad: Session = {
      id: "x",
      dayId: "push",
      date: "2026-09-09",
      createdAt: 10,
      logs: [{ slotId: bench.id, exerciseId: bench.exerciseId, load: null, sets: fullSets(bench, 8, 1) }],
    };
    const real = session(bench, 135, fullSets(bench, 8, 1, { reps: 8, rir: 1 }), { createdAt: 1 });
    const s = suggestNextLoad(bench, [noLoad, real], settings);
    expect(s.action).toBe("increase");
    expect(s.load).toBe(137.5);
  });

  it("works in kg with a 1.25 increment", () => {
    const kg: Settings = { ...settings, unit: "kg" };
    const s = suggestNextLoad(bench, [session(bench, 60, fullSets(bench, 8, 1, { reps: 8, rir: 0 }))], kg);
    expect(s.load).toBe(61.25);
  });
});
