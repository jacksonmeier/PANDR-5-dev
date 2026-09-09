"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Session, Settings, Unit } from "./types";
import { convertSessions } from "./units";

export const DEFAULT_SETTINGS: Settings = {
  unit: "lb",
  increasePercent: 2.5,
  decreasePercent: 2.5,
};

export interface ExportFile {
  app: "pandr-5";
  version: number;
  exportedAt: string;
  settings: Settings;
  sessions: Session[];
}

interface State {
  sessions: Session[];
  settings: Settings;
  /** True once localStorage has been read on the client. Not persisted. */
  _hydrated: boolean;
}

interface Actions {
  saveSession: (session: Session) => void;
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
export const STORAGE_VERSION = 1;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      sessions: [],
      settings: DEFAULT_SETTINGS,
      _hydrated: false,

      saveSession: (session) =>
        set((s) => ({
          sessions: [...s.sessions.filter((x) => x.id !== session.id), session],
        })),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setUnit: (unit) =>
        set((s) => {
          if (unit === s.settings.unit) return s;
          return {
            settings: { ...s.settings, unit },
            sessions: convertSessions(s.sessions, s.settings.unit, unit),
          };
        }),

      exportJson: () => {
        const { sessions, settings } = get();
        const file: ExportFile = {
          app: "pandr-5",
          version: STORAGE_VERSION,
          exportedAt: new Date().toISOString(),
          settings,
          sessions,
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
        set({ sessions: check.sessions, settings: { ...DEFAULT_SETTINGS, ...check.settings } });
        return null;
      },

      clearAll: () => set({ sessions: [], settings: DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ sessions: s.sessions, settings: s.settings }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hydrated: true });
      },
      migrate: (persisted, version) => {
        // v1 is the first schema. Future versions transform here.
        const p = (persisted ?? {}) as Partial<Pick<State, "sessions" | "settings">>;
        if (version < 1) {
          return { sessions: p.sessions ?? [], settings: { ...DEFAULT_SETTINGS, ...p.settings } };
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
  };
}
