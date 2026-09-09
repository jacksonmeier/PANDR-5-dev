import { describe, expect, it } from "vitest";
import { currentCycle, cycleStatus, nextDayId, todayIso } from "./schedule";
import type { DayId, Session } from "./types";

function s(id: string, dayId: DayId, createdAt: number): Session {
  return { id, dayId, date: "2026-09-09", createdAt, logs: [] };
}

describe("nextDayId", () => {
  it("starts on push", () => {
    expect(nextDayId([])).toBe("push");
  });
  it("follows the cycle", () => {
    expect(nextDayId([s("a", "push", 1)])).toBe("pull");
    expect(nextDayId([s("a", "legs", 1)])).toBe("rest1");
    expect(nextDayId([s("a", "rest1", 1)])).toBe("upper");
    expect(nextDayId([s("a", "rest2", 1)])).toBe("push");
  });
  it("uses createdAt, not array order", () => {
    expect(nextDayId([s("b", "pull", 2), s("a", "push", 1)])).toBe("legs");
  });
});

describe("currentCycle", () => {
  it("starts at the most recent push", () => {
    const sessions = [
      s("a", "push", 1),
      s("b", "pull", 2),
      s("c", "push", 3),
      s("d", "pull", 4),
    ];
    expect(currentCycle(sessions).map((x) => x.id)).toEqual(["c", "d"]);
  });
  it("includes everything when there is no push yet", () => {
    const sessions = [s("a", "legs", 2), s("b", "pull", 1)];
    expect(currentCycle(sessions).map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("cycleStatus", () => {
  it("marks done, next, upcoming", () => {
    const st = cycleStatus([s("a", "push", 1), s("b", "pull", 2)]);
    expect(st.push).toBe("done");
    expect(st.pull).toBe("done");
    expect(st.legs).toBe("next");
    expect(st.rest1).toBe("upcoming");
    expect(st.rest2).toBe("upcoming");
  });
  it("resets when a new push begins", () => {
    const st = cycleStatus([s("a", "push", 1), s("b", "pull", 2), s("c", "push", 3)]);
    expect(st.push).toBe("done");
    expect(st.pull).toBe("next");
  });
});

describe("todayIso", () => {
  it("formats local dates", () => {
    expect(todayIso(new Date(2026, 8, 9))).toBe("2026-09-09");
    expect(todayIso(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});
