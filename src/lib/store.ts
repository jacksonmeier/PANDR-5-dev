"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ActiveSession, ExerciseLog, Session, Settings, TrainingDayId, Unit } from "./types";
import { convertLogs, convertSessions } from "./units";
import { completedSession } from "./active";
import { newSessionId } from "./schedule";
import { DEFAULT_THEME } from "./theme";

export const DEFAULT_SETTINGS: Settings = {
  unit: "lb",
  increasePercent: 2.5,
  decreasePercent: 2.5,
  theme: DEFAULT_THEME,
};

export interface ExportFile {
  app: "pandr-5";
  version: number;
  exportedAt: string;
  settings: Settings;
  sessions: Session[];
  /** The workout that was underway when the export was taken, if any. */
  active?: ActiveSession | null;
}

interface State {
  sessions: Session[];
  settings: Settings;
  /**
   * The workout being logged right now, or null. At most one at a time: it is
   * the workout in front of you. It is kept out of `sessions` until completed,
   * so nothing half-logged reaches progression, volume or history.
   */
  active: ActiveSession | null;
  /** True once localStorage has been read on the client. Not persisted. */
  _hydrated: boolean;
}

export interface ActiveInput {
  dayId: TrainingDayId;
  date: string;
  logs: ExerciseLog[];
}

interface Actions {
  saveSession: (session: Session) => void;
  /**
   * Writes the live session: starts one on the first call, updates it after
   * that. A call for a different day while one is live is ignored, so a stray
   * edit can never silently replace a workout in progress.
   */
  writeActive: (input: ActiveInput) => void;
  /**
   * Start the rest clock at `at`, or clear it. Separate from writeActive
   * because rest begins when a set ends, not when any field is touched.
   * Ignored when nothing is live.
   */
  setRestFrom: (at: number | null) => void;
  /** Throws the live session away without recording it. */
  discardActive: () => void;
  /**
   * Marks the live session complete: it joins `sessions` and starts counting.
   * Returns the saved session, or null when nothing was live.
   */
  completeActive: () => Session | null;
  deleteSession: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Converts every stored load when the unit changes. */
  setUnit: (unit: Unit) => void;
  exportJson: () => string;
  /** Returns an error message, or null on success. */
  importJson: (text: string) => string | null;
  clearAll: () => void;
}

export type Store = State & Actions;

export const STORAGE_KEY = "pandr5";
export const STORAGE_VERSION = 3;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      sessions: [],
      settings: DEFAULT_SETTINGS,
      active: null,
      _hydrated: false,

      saveSession: (session) =>
        set((s) => ({
          sessions: [...s.sessions.filter((x) => x.id !== session.id), session],
        })),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      writeActive: ({ dayId, date, logs }) =>
        set((s) => {
          const now = Date.now();
          if (s.active) {
            if (s.active.dayId !== dayId) return s;
            return { active: { ...s.active, date, logs, updatedAt: now } };
          }
          return {
            active: { id: newSessionId(now), dayId, date, startedAt: now, updatedAt: now, logs },
          };
        }),

      setRestFrom: (at) =>
        set((s) => (s.active ? { active: { ...s.active, restFrom: at ?? undefined } } : s)),

      discardActive: () => set({ active: null }),

      completeActive: () => {
        const active = get().active;
        if (!active) return null;
        const session = completedSession(active, Date.now());
        set((s) => ({
          sessions: [...s.sessions.filter((x) => x.id !== session.id), session],
          active: null,
        }));
        return session;
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setUnit: (unit) =>
        set((s) => {
          if (unit === s.settings.unit) return s;
          const from = s.settings.unit;
          return {
            settings: { ...s.settings, unit },
            sessions: convertSessions(s.sessions, from, unit),
            // The workout in front of you has loads on screen right now. Convert
            // them too, or the next set is logged against the wrong number.
            active: s.active ? { ...s.active, logs: convertLogs(s.active.logs, from, unit) } : null,
          };
        }),

      exportJson: () => {
        const { sessions, settings, active } = get();
        const file: ExportFile = {
          app: "pandr-5",
          version: STORAGE_VERSION,
          exportedAt: new Date().toISOString(),
          settings,
          sessions,
          active,
        };
        return JSON.stringify(file, null, 2);
      },

      importJson: (text) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return "That file is not valid JSON.";
        }
        const check = validateExport(parsed);
        if (typeof check === "string") return check;
        set({
          sessions: check.sessions,
          settings: { ...DEFAULT_SETTINGS, ...check.settings },
          active: check.active ?? null,
        });
        return null;
      },

      clearAll: () => set({ sessions: [], settings: DEFAULT_SETTINGS, active: null }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ sessions: s.sessions, settings: s.settings, active: s.active }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hydrated: true });
      },
      migrate: (persisted, version) => {
        // Every migration so far is additive: fill in new keys and never touch
        // `sessions`, which is the only irreplaceable thing in here.
        // v1 -> v2 added settings.theme. v2 -> v3 added the live session.
        const p = (persisted ?? {}) as Partial<Pick<State, "sessions" | "settings" | "active">>;
        if (version < STORAGE_VERSION) {
          return {
            sessions: p.sessions ?? [],
            settings: { ...DEFAULT_SETTINGS, ...p.settings },
            active: p.active ?? null,
          };
        }
        return p;
      },
    },
  ),
);

function validateExport(x: unknown): ExportFile | string {
  if (!x || typeof x !== "object") return "Unexpected file shape.";
  const o = x as Record<string, unknown>;
  if (o.app !== "pandr-5") return "This is not a PANDR-5 export.";
  if (!Array.isArray(o.sessions)) return "Missing sessions.";
  for (const s of o.sessions) {
    if (!s || typeof s !== "object") return "A session is malformed.";
    const ss = s as Record<string, unknown>;
    if (typeof ss.id !== "string" || typeof ss.dayId !== "string" || typeof ss.date !== "string") {
      return "A session is missing id, dayId, or date.";
    }
    if (typeof ss.createdAt !== "number") return "A session is missing createdAt.";
    if (!Array.isArray(ss.logs)) return "A session is missing logs.";
  }
  const settings = (o.settings ?? {}) as Partial<Settings>;
  return {
    app: "pandr-5",
    version: typeof o.version === "number" ? o.version : STORAGE_VERSION,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : "",
    settings: { ...DEFAULT_SETTINGS, ...settings },
    sessions: o.sessions as Session[],
    // An export from before v3, or one taken with nothing underway, has no
    // live session. That is not an error: it imports as "nothing in progress".
    active: validActive(o.active),
  };
}

/** A live session survives a round trip only if it is complete and coherent. */
function validActive(x: unknown): ActiveSession | null {
  if (!x || typeof x !== "object") return null;
  const a = x as Record<string, unknown>;
  if (typeof a.id !== "string" || typeof a.dayId !== "string" || typeof a.date !== "string") return null;
  if (typeof a.startedAt !== "number" || !Array.isArray(a.logs)) return null;
  return {
    id: a.id,
    dayId: a.dayId as TrainingDayId,
    date: a.date,
    startedAt: a.startedAt,
    updatedAt: typeof a.updatedAt === "number" ? a.updatedAt : a.startedAt,
    ...(typeof a.restFrom === "number" ? { restFrom: a.restFrom } : {}),
    logs: a.logs as ExerciseLog[],
  };
}
