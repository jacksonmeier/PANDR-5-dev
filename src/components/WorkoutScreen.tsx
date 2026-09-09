"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session, TrainingDayId } from "@/lib/types";
import { getDay } from "@/data/program";
import { getExercise } from "@/data/exercises";
import { suggestNextLoad } from "@/lib/progression";
import { defaultLoggedRir } from "@/lib/rir";
import { newSessionId, todayIso } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { Button, Card, PageHeader, Skeleton } from "./ui";
import { ExerciseCard, type Draft } from "./ExerciseCard";

type Drafts = Record<string, Draft>;

export function WorkoutScreen({ day }: { day: TrainingDayId }) {
  const router = useRouter();
  const editId = useSearchParams().get("session");
  const hydrated = useStore((s) => s._hydrated);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const saveSession = useStore((s) => s.saveSession);

  const dayDef = getDay(day);
  if (!dayDef) throw new Error(`Unknown day ${day}`);

  const [date, setDate] = useState(() => todayIso());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [saved, setSaved] = useState(false);

  /** History excluding the session being edited, so it doesn't judge itself. */
  const history = useMemo(
    () => sessions.filter((s) => s.id !== sessionId),
    [sessions, sessionId],
  );

  const suggestions = useMemo(
    () =>
      Object.fromEntries(
        dayDef.slots.map((slot) => [slot.id, suggestNextLoad(slot, history, settings)]),
      ),
    [dayDef, history, settings],
  );

  // Initialise drafts once the store has hydrated. Resume today's session for
  // this day if one exists, otherwise start from the engine's suggestions.
  useEffect(() => {
    if (!hydrated || drafts !== null) return;
    const existing = editId
      ? sessions.find((s) => s.id === editId && s.dayId === day)
      : sessions.find((s) => s.dayId === day && s.date === date);
    if (existing) {
      setSessionId(existing.id);
      if (existing.date !== date) setDate(existing.date);
      const next: Drafts = {};
      for (const slot of dayDef.slots) {
        const log = existing.logs.find((l) => l.slotId === slot.id);
        next[slot.id] = {
          load: log?.load ?? null,
          sets: slot.rir.map((t, i) => log?.sets[i] ?? { reps: null, rir: defaultLoggedRir(t) }),
        };
      }
      setDrafts(next);
      return;
    }
    setSessionId(newSessionId());
    const fresh: Drafts = {};
    for (const slot of dayDef.slots) {
      const s = suggestNextLoad(slot, sessions, settings);
      fresh[slot.id] = {
        load: s.load,
        sets: slot.rir.map((t) => ({ reps: null, rir: defaultLoggedRir(t) })),
      };
    }
    setDrafts(fresh);
  }, [hydrated, drafts, sessions, settings, day, date, dayDef, editId]);

  const draftSession = useMemo<Session | null>(() => {
    if (!drafts || !sessionId) return null;
    return {
      id: sessionId,
      dayId: day,
      date,
      createdAt: Number.MAX_SAFE_INTEGER,
      logs: dayDef.slots.map((slot) => ({
        slotId: slot.id,
        exerciseId: slot.exerciseId,
        load: drafts[slot.id].load,
        sets: drafts[slot.id].sets,
      })),
    };
  }, [drafts, sessionId, day, date, dayDef]);

  const previews = useMemo(() => {
    if (!draftSession) return {};
    const withDraft = [...history, draftSession];
    return Object.fromEntries(
      dayDef.slots.map((slot) => [slot.id, suggestNextLoad(slot, withDraft, settings)]),
    );
  }, [draftSession, history, dayDef, settings]);

  const loggedSets = drafts
    ? Object.values(drafts).reduce((n, d) => n + d.sets.filter((s) => s.reps !== null).length, 0)
    : 0;
  const totalSets = dayDef.slots.reduce((n, s) => n + s.sets, 0);

  function save() {
    if (!draftSession) return;
    if (loggedSets === 0 && !window.confirm("Nothing logged yet. Save this session anyway?")) return;
    saveSession({ ...draftSession, createdAt: Date.now() });
    setSaved(true);
    router.push("/");
  }

  return (
    <>
      <PageHeader eyebrow={`Day ${dayDef.position} · ${dayDef.slots.length} exercises · ${totalSets} sets`} title={dayDef.label}>
        <label className="flex items-center gap-2 text-sm text-bone-2">
          <span className="eyebrow">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setDrafts(null);
            }}
            className="num h-10 rounded-md border border-line-2 bg-ink px-2 text-bone"
          />
        </label>
      </PageHeader>

      {!drafts ? (
        <div className="grid gap-3">
          {dayDef.slots.map((s) => (
            <Skeleton key={s.id} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {dayDef.slots.map((slot, i) => (
            <ExerciseCard
              key={slot.id}
              index={i}
              slot={slot}
              exercise={getExercise(slot.exerciseId)}
              draft={drafts[slot.id]}
              onChange={(d) => setDrafts({ ...drafts, [slot.id]: d })}
              suggestion={suggestions[slot.id]}
              preview={previews[slot.id] ?? null}
              unit={settings.unit}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-[4.75rem] z-20 mt-4 sm:bottom-4">
        <Card tone="raised" className="flex items-center justify-between gap-4 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col">
            <span className="eyebrow">Progress</span>
            <span className="num text-lg font-semibold">
              {loggedSets}
              <span className="text-bone-3">/{totalSets} sets</span>
            </span>
          </div>
          <Button onClick={save} disabled={!drafts || saved} className="min-w-36">
            {saved ? "Saved" : sessionId && sessions.some((s) => s.id === sessionId) ? "Update session" : "Save session"}
          </Button>
        </Card>
      </div>
    </>
  );
}
