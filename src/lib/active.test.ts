import { describe, expect, it } from "vitest";
import {
  alignLogs,
  blankSets,
  orderSlots,
  reorder,
  completedSession,
  elapsedMs,
  formatAgo,
  formatElapsed,
  hasLoggedWork,
  loggedExerciseCount,
  loggedSetCount,
} from "./active";
import type { ActiveSession, ExerciseLog, Slot } from "./types";

function slot(id: string, sets: number): Slot {
  return {
    id,
    dayId: "push",
    exerciseId: id.split(":")[1] ?? id,
    sets,
    repRange: { lo: 8, hi: 12 },
    rir: Array.from({ length: sets }, (_, i) => (i === sets - 1 ? "0-1" : "2")),
  };
}

function log(slotId: string, load: number | null, reps: (number | null)[]): ExerciseLog {
  return {
    slotId,
    exerciseId: slotId.split(":")[1] ?? slotId,
    load,
    sets: reps.map((r) => ({ reps: r, rir: 1 })),
  };
}

describe("blankSets", () => {
  it("makes one row per prescribed set, defaulting RIR to the target", () => {
    const sets = blankSets(slot("push:a", 3));
    expect(sets).toEqual([
      { reps: null, rir: 2 },
      { reps: null, rir: 2 },
      { reps: null, rir: 1 },
    ]);
  });
});

describe("alignLogs", () => {
  const slots = [slot("push:a", 2), slot("push:b", 3)];

  it("fills every slot, blank where nothing was logged", () => {
    const out = alignLogs(slots, []);
    expect(out.map((l) => l.slotId)).toEqual(["push:a", "push:b"]);
    expect(out[1].sets).toHaveLength(3);
    expect(out[0].load).toBeNull();
  });

  it("keeps stored values", () => {
    const out = alignLogs(slots, [log("push:a", 100, [10, 9])]);
    expect(out[0].load).toBe(100);
    expect(out[0].sets[1]).toEqual({ reps: 9, rir: 1 });
  });

  it("is driven by the slot list, so a program change cannot lose or invent sets", () => {
    // Stored against an older program: one set too few here, one slot gone.
    const out = alignLogs(slots, [log("push:a", 100, [10]), log("push:gone", 50, [5])]);
    expect(out).toHaveLength(2);
    expect(out[0].sets).toHaveLength(2);
    expect(out[0].sets[0].reps).toBe(10);
    expect(out[0].sets[1].reps).toBeNull();
    expect(out.some((l) => l.slotId === "push:gone")).toBe(false);
  });

  it("keeps the order the logs were stored in, which is the order they were performed", () => {
    const out = alignLogs(slots, [log("push:b", 40, [12, 11, 10]), log("push:a", 100, [10, 9])]);
    expect(out.map((l) => l.slotId)).toEqual(["push:b", "push:a"]);
    expect(out[0].load).toBe(40);
  });

  it("parks a slot the stored log never saw at the end, in program order", () => {
    const three = [...slots, slot("push:c", 1)];
    const out = alignLogs(three, [log("push:b", 40, [12, 11, 10])]);
    expect(out.map((l) => l.slotId)).toEqual(["push:b", "push:a", "push:c"]);
  });
});

describe("orderSlots", () => {
  const slots = [slot("push:a", 2), slot("push:b", 3), slot("push:c", 1)];

  it("arranges the slots as asked", () => {
    expect(orderSlots(slots, ["push:c", "push:a", "push:b"]).map((s) => s.id)).toEqual([
      "push:c",
      "push:a",
      "push:b",
    ]);
  });

  it("returns every slot exactly once, whatever the order says", () => {
    const out = orderSlots(slots, ["push:b", "push:b", "push:gone"]);
    expect(out.map((s) => s.id)).toEqual(["push:b", "push:a", "push:c"]);
  });

  it("is the program order when the order is empty", () => {
    expect(orderSlots(slots, []).map((s) => s.id)).toEqual(["push:a", "push:b", "push:c"]);
  });
});

describe("reorder", () => {
  const order = ["a", "b", "c"];

  it("moves one place either way", () => {
    expect(reorder(order, "c", -1)).toEqual(["a", "c", "b"]);
    expect(reorder(order, "a", 1)).toEqual(["b", "a", "c"]);
  });

  it("moves further than one place", () => {
    expect(reorder(order, "c", -2)).toEqual(["c", "a", "b"]);
  });

  it("does nothing at the ends rather than wrapping", () => {
    expect(reorder(order, "a", -1)).toEqual(order);
    expect(reorder(order, "c", 1)).toEqual(order);
  });

  it("does nothing for an id it does not hold", () => {
    expect(reorder(order, "zzz", 1)).toEqual(order);
  });

  it("never mutates the array it was given", () => {
    const input = [...order];
    reorder(input, "a", 1);
    expect(input).toEqual(order);
  });
});

describe("counting logged work", () => {
  const logs = [log("push:a", 100, [10, null]), log("push:b", 40, [null, null, null])];

  it("counts only sets with reps", () => {
    expect(loggedSetCount(logs)).toBe(1);
    expect(loggedExerciseCount(logs)).toBe(1);
    expect(hasLoggedWork(logs)).toBe(true);
  });

  it("reads an untouched session as no work", () => {
    const empty = [log("push:a", 100, [null, null])];
    expect(loggedSetCount(empty)).toBe(0);
    expect(hasLoggedWork(empty)).toBe(false);
  });
});

describe("completedSession", () => {
  const active: ActiveSession = {
    id: "abc",
    dayId: "push",
    date: "2026-09-13",
    startedAt: 1_000,
    updatedAt: 2_000,
    logs: [log("push:a", 100, [10, 9])],
  };

  it("keeps the id, day, date and logs", () => {
    const s = completedSession(active, 9_999);
    expect(s.id).toBe("abc");
    expect(s.dayId).toBe("push");
    expect(s.date).toBe("2026-09-13");
    expect(s.logs).toBe(active.logs);
  });

  it("stamps createdAt at completion, not at the start", () => {
    // A workout started last night and finished this morning orders as this
    // morning's: createdAt is what "newest" means to the progression engine.
    expect(completedSession(active, 9_999).createdAt).toBe(9_999);
  });
});

describe("elapsedMs", () => {
  const active: ActiveSession = {
    id: "a",
    dayId: "push",
    date: "2026-09-13",
    startedAt: 5_000,
    updatedAt: 5_000,
    logs: [],
  };

  it("measures from the start", () => {
    expect(elapsedMs(active, 65_000)).toBe(60_000);
  });

  it("never goes negative when the clock moves backwards", () => {
    expect(elapsedMs(active, 1_000)).toBe(0);
  });
});

describe("formatElapsed", () => {
  it("is mm:ss under an hour", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(9_000)).toBe("0:09");
    expect(formatElapsed(754_000)).toBe("12:34");
  });
  it("grows an hours field past the hour", () => {
    expect(formatElapsed(3_723_000)).toBe("1:02:03");
    expect(formatElapsed(36_000_000)).toBe("10:00:00");
  });
  it("floors rather than rounds, so it never shows a second that has not passed", () => {
    expect(formatElapsed(1_999)).toBe("0:01");
  });
});

describe("formatAgo", () => {
  it("reads as prose", () => {
    expect(formatAgo(0)).toBe("just now");
    expect(formatAgo(60_000)).toBe("1 minute ago");
    expect(formatAgo(40 * 60_000)).toBe("40 minutes ago");
    expect(formatAgo(60 * 60_000)).toBe("1 hour ago");
    expect(formatAgo(5 * 3_600_000)).toBe("5 hours ago");
    expect(formatAgo(26 * 3_600_000)).toBe("yesterday");
    expect(formatAgo(3 * 24 * 3_600_000)).toBe("3 days ago");
  });
});
