import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The store touches localStorage through zustand's persist middleware, so give
 * it one before importing. These tests are about the live-session rules, which
 * are the part with real consequences: a workout in progress must never leak
 * into the log, and completing it must never lose the last keystroke.
 */
const memory = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size;
  },
});

const { DEFAULT_SETTINGS, STORAGE_VERSION, useStore } = await import("./store");
import type { ExerciseLog } from "./types";

function logs(load: number | null, reps: (number | null)[]): ExerciseLog[] {
  return [
    {
      slotId: "push:bench-press",
      exerciseId: "bench-press",
      load,
      sets: reps.map((r) => ({ reps: r, rir: 1 })),
    },
  ];
}

const store = () => useStore.getState();

beforeEach(() => {
  memory.clear();
  useStore.setState({ sessions: [], settings: DEFAULT_SETTINGS, active: null });
});

describe("writeActive", () => {
  it("starts a session on the first write and stamps the clock", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8, null]) });
    const a = store().active;
    expect(a).not.toBeNull();
    expect(a?.dayId).toBe("push");
    expect(a?.startedAt).toBeGreaterThan(0);
    expect(a?.startedAt).toBe(a?.updatedAt);
  });

  it("keeps a session out of the log until it is completed", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    expect(store().sessions).toEqual([]);
  });

  it("updates in place, keeping the id and the start time", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    const first = store().active!;
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8, 7]) });
    const second = store().active!;
    expect(second.id).toBe(first.id);
    expect(second.startedAt).toBe(first.startedAt);
    expect(second.logs[0].sets).toHaveLength(2);
  });

  it("carries a date change without restarting the session", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    const before = store().active!;
    store().writeActive({ dayId: "push", date: "2026-09-14", logs: logs(135, [8]) });
    expect(store().active!.date).toBe("2026-09-14");
    expect(store().active!.id).toBe(before.id);
  });

  it("refuses to let another day overwrite the workout in progress", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    const before = store().active!;
    store().writeActive({ dayId: "pull", date: "2026-09-13", logs: logs(95, [10]) });
    expect(store().active).toEqual(before);
  });
});

describe("completeActive", () => {
  it("moves the session into the log and clears the live slot", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8, 7]) });
    const id = store().active!.id;
    const saved = store().completeActive();
    expect(saved?.id).toBe(id);
    expect(store().active).toBeNull();
    expect(store().sessions).toHaveLength(1);
    expect(store().sessions[0].logs[0].sets[1].reps).toBe(7);
    expect(store().sessions[0].createdAt).toBeGreaterThan(0);
  });

  it("does nothing when nothing is live", () => {
    expect(store().completeActive()).toBeNull();
    expect(store().sessions).toEqual([]);
  });

  it("completes only once, so a double tap cannot duplicate the session", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    store().completeActive();
    store().completeActive();
    expect(store().sessions).toHaveLength(1);
  });
});

describe("discardActive", () => {
  it("throws the session away without recording it", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    store().discardActive();
    expect(store().active).toBeNull();
    expect(store().sessions).toEqual([]);
  });
});

describe("setUnit", () => {
  it("converts the live session too, so the loads on screen stay honest", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    store().setUnit("kg");
    expect(store().active!.logs[0].load).toBe(61.25);
  });

  it("leaves nothing to convert when no session is live", () => {
    store().setUnit("kg");
    expect(store().active).toBeNull();
  });
});

describe("clearAll", () => {
  it("wipes the live session as well as the log", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    store().clearAll();
    expect(store().active).toBeNull();
  });
});

describe("export and import", () => {
  it("round-trips a session in progress", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8, 7]) });
    const text = store().exportJson();
    expect(JSON.parse(text).version).toBe(STORAGE_VERSION);

    store().clearAll();
    expect(store().importJson(text)).toBeNull();
    expect(store().active?.dayId).toBe("push");
    expect(store().active?.logs[0].sets[1].reps).toBe(7);
  });

  it("reads an older export, which has no live session, as nothing in progress", () => {
    store().writeActive({ dayId: "push", date: "2026-09-13", logs: logs(135, [8]) });
    const old = JSON.stringify({ app: "pandr-5", version: 2, sessions: [], settings: {} });
    expect(store().importJson(old)).toBeNull();
    expect(store().active).toBeNull();
  });

  it("drops a malformed live session rather than importing a broken workout", () => {
    const bad = JSON.stringify({
      app: "pandr-5",
      version: 3,
      sessions: [],
      settings: {},
      active: { id: "x", dayId: "push" },
    });
    expect(store().importJson(bad)).toBeNull();
    expect(store().active).toBeNull();
  });
});
