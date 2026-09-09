import { describe, expect, it } from "vitest";
import { convertLoad, convertSessions, formatLoad, roundToIncrement } from "./units";
import type { Session } from "./types";

describe("roundToIncrement", () => {
  it("rounds to 2.5", () => {
    expect(roundToIncrement(138.375, 2.5)).toBe(137.5);
    expect(roundToIncrement(139, 2.5)).toBe(140);
    expect(roundToIncrement(20.5, 2.5)).toBe(20);
  });
  it("rounds to 1.25 without float noise", () => {
    expect(roundToIncrement(61.3, 1.25)).toBe(61.25);
    expect(roundToIncrement(0.7, 1.25)).toBe(1.25);
  });
});

describe("convertLoad", () => {
  it("lb to kg rounds to 1.25", () => {
    expect(convertLoad(135, "lb", "kg")).toBe(61.25);
    expect(convertLoad(225, "lb", "kg")).toBe(102.5);
  });
  it("kg to lb rounds to 2.5", () => {
    expect(convertLoad(60, "kg", "lb")).toBe(132.5);
  });
  it("same unit is identity", () => {
    expect(convertLoad(100, "lb", "lb")).toBe(100);
  });
});

describe("convertSessions", () => {
  it("converts every load and leaves nulls alone", () => {
    const sessions: Session[] = [
      {
        id: "a",
        dayId: "push",
        date: "2026-09-09",
        createdAt: 1,
        logs: [
          { slotId: "push:bench-press", exerciseId: "bench-press", load: 135, sets: [] },
          { slotId: "push:lateral-raise", exerciseId: "lateral-raise", load: null, sets: [] },
        ],
      },
    ];
    const out = convertSessions(sessions, "lb", "kg");
    expect(out[0].logs[0].load).toBe(61.25);
    expect(out[0].logs[1].load).toBeNull();
    expect(sessions[0].logs[0].load).toBe(135);
  });
});

describe("formatLoad", () => {
  it("drops trailing zeros", () => {
    expect(formatLoad(137.5, "lb")).toBe("137.5 lb");
    expect(formatLoad(60, "kg")).toBe("60 kg");
    expect(formatLoad(61.25, "kg")).toBe("61.25 kg");
    expect(formatLoad(null, "lb")).toBe("");
  });
});
