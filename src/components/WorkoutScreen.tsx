"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExerciseLog, Session, TrainingDayId } from "@/lib/types";
import { getDay } from "@/data/program";
import { getExercise } from "@/data/exercises";
import { suggestNextLoad } from "@/lib/progression";
import {
  alignLogs,
  blankSets,
  elapsedMs,
  formatAgo,
  loggedSetCount,
  orderSlots,
  reorder,
} from "@/lib/active";
import { todayIso } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { Button, Card, Eyebrow, LinkButton, PageHeader, Skeleton, Tag } from "./ui";
import { ExerciseCard, type Draft } from "./ExerciseCard";
import { Elapsed } from "./Elapsed";

type Drafts = Record<string, Draft>;

/** Id for the unsaved draft while computing previews. Never stored. */
const DRAFT_ID = "__draft__";

export function WorkoutScreen({ day }: { day: TrainingDayId }) {
  const router = useRouter();
  const editId = useSearchParams().get("session");
  const hydrated = useStore((s) => s._hydrated);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const active = useStore((s) => s.active);
  const saveSession = useStore((s) => s.saveSession);
  const writeActive = useStore((s) => s.writeActive);
  const discardActive = useStore((s) => s.discardActive);
  const completeActive = useStore((s) => s.completeActive);

  const dayDef = getDay(day);
  if (!dayDef) throw new Error(`Unknown day ${day}`);
  // Hoisted function declarations below cannot see the narrowing above.
  const shortLabel = dayDef.shortLabel;

  const [date, setDate] = useState(() => todayIso());
  /** Id of the completed session being edited. Null while logging a live one. */
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  /**
   * Slot ids in the order they are being worked through, which is this
   * session's alone: it is set from the session being logged and never written
   * back to the program, so the next one starts in program order again.
   */
  const [order, setOrder] = useState<string[]>(() => dayDef.slots.map((s) => s.id));
  /** Slot just moved, so the card can be kept in view under the thumb. */
  const [moved, setMoved] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const programOrder = useMemo(() => dayDef.slots.map((slot) => slot.id), [dayDef]);

  /** The live session, when it is this day's. Editing history never touches it. */
  const live = !editId && active && active.dayId === day ? active : null;
  /** Another day is underway. Two at once would make "in progress" meaningless. */
  const blocked = !editId && active !== null && active.dayId !== day;
  const blockedDay = blocked && active ? getDay(active.dayId) : null;

  /** History excluding the session being edited, so it doesn't judge itself. */
  const history = useMemo(
    () => sessions.filter((s) => s.id !== editing),
    [sessions, editing],
  );

  const suggestions = useMemo(
    () =>
      Object.fromEntries(
        dayDef.slots.map((slot) => [slot.id, suggestNextLoad(slot, history, settings)]),
      ),
    [dayDef, history, settings],
  );

  /**
   * The logs to store. They go out in the worked order, so the order survives a
   * reload, and reads back in history as the order it was actually performed.
   */
  const toLogs = useCallback(
    (d: Drafts, ord: readonly string[]): ExerciseLog[] =>
      orderSlots(dayDef.slots, ord)
        .filter((slot) => d[slot.id])
        .map((slot) => ({
          slotId: slot.id,
          exerciseId: slot.exerciseId,
          load: d[slot.id].load,
          sets: d[slot.id].sets,
        })),
    [dayDef],
  );

  // Initialise drafts once the store has hydrated, from the first source that
  // applies: an explicit edit link, the live session for this day, a session
  // already saved for this day and date, or the engine's suggestions.
  useEffect(() => {
    if (!hydrated || drafts !== null) return;

    const edited = editId ? sessions.find((s) => s.id === editId && s.dayId === day) : undefined;
    const resumed = !edited && live ? live : undefined;
    const sameDay =
      !edited && !resumed ? sessions.find((s) => s.dayId === day && s.date === date) : undefined;
    const source = edited ?? resumed ?? sameDay;

    if (source) {
      setEditing(resumed ? null : source.id);
      if (source.date !== date) setDate(source.date);
      // alignLogs hands back the stored order, so a session resumes arranged
      // the way it was left.
      const logs = alignLogs(dayDef.slots, source.logs);
      setOrder(logs.map((l) => l.slotId));
      setDrafts(
        Object.fromEntries(logs.map((l) => [l.slotId, { load: l.load, sets: l.sets }])),
      );
      return;
    }

    setEditing(null);
    setOrder(dayDef.slots.map((slot) => slot.id));
    setDrafts(
      Object.fromEntries(
        dayDef.slots.map((slot) => [
          slot.id,
          { load: suggestNextLoad(slot, sessions, settings).load, sets: blankSets(slot) },
        ]),
      ),
    );
  }, [hydrated, drafts, sessions, settings, day, date, dayDef, editId, live]);

  // A card that jumps past a neighbour taller than the screen would otherwise
  // leave the lifter looking at a different exercise.
  useEffect(() => {
    if (!moved) return;
    cardRefs.current[moved]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setMoved(null);
  }, [moved, order]);

  const draftSession = useMemo<Session | null>(() => {
    if (!drafts) return null;
    return {
      id: editing ?? DRAFT_ID,
      dayId: day,
      date,
      createdAt: Number.MAX_SAFE_INTEGER,
      logs: toLogs(drafts, order),
    };
  }, [drafts, editing, day, date, order, toLogs]);

  const previews = useMemo(() => {
    if (!draftSession) return {};
    const withDraft = [...history, draftSession];
    return Object.fromEntries(
      dayDef.slots.map((slot) => [slot.id, suggestNextLoad(slot, withDraft, settings)]),
    );
  }, [draftSession, history, dayDef, settings]);

  const loggedSets = drafts ? loggedSetCount(toLogs(drafts, order)) : 0;
  const totalSets = dayDef.slots.reduce((n, s) => n + s.sets, 0);
  /** The cards to render, in this session's order. */
  const orderedSlots = useMemo(
    () => orderSlots(dayDef.slots, order).filter((slot) => !drafts || drafts[slot.id]),
    [dayDef, order, drafts],
  );
  const customOrder = orderedSlots.some((slot, i) => slot.id !== dayDef.slots[i]?.id);

  /** Every edit writes through, so closing the tab mid-workout loses nothing. */
  function change(slotId: string, d: Draft) {
    if (!drafts) return;
    const next = { ...drafts, [slotId]: d };
    setDrafts(next);
    if (!editing) writeActive({ dayId: day, date, logs: toLogs(next, order) });
  }

  /**
   * Reorder for this session only. The program is never touched.
   *
   * Unlike a logged set, rearranging does not *start* a session: shuffling the
   * cards while deciding what to do first should not leave a phantom workout in
   * progress. Once one is underway the new order is written through with it.
   */
  function applyOrder(next: string[], keepInView: string | null) {
    setOrder(next);
    setMoved(keepInView);
    if (live && drafts) writeActive({ dayId: day, date, logs: toLogs(drafts, next) });
  }

  function move(slotId: string, delta: -1 | 1) {
    applyOrder(reorder(order, slotId, delta), slotId);
  }

  function resetOrder() {
    applyOrder([...programOrder], null);
  }

  function changeDate(value: string) {
    setDate(value);
    if (live && drafts) {
      writeActive({ dayId: day, date: value, logs: toLogs(drafts, order) });
      return;
    }
    // Nothing is underway, so another date may already have a session of its
    // own. Re-initialise against it.
    setDrafts(null);
  }

  function complete() {
    if (!drafts) return;
    const logs = toLogs(drafts, order);
    if (
      loggedSetCount(logs) === 0 &&
      !window.confirm("Nothing logged yet. Mark this session complete anyway?")
    ) {
      return;
    }
    if (editing) {
      saveSession({ id: editing, dayId: day, date, createdAt: Date.now(), logs });
    } else {
      // Write first so the completed session carries the very last keystroke.
      writeActive({ dayId: day, date, logs });
      completeActive();
    }
    setSaved(true);
    router.push("/");
  }

  function discard() {
    if (!window.confirm(`Discard this ${shortLabel} session? Nothing will be recorded.`)) {
      return;
    }
    discardActive();
    router.push("/");
  }

  if (blocked && blockedDay) {
    const started = active ? formatAgo(elapsedMs(active)) : "";
    const done = active ? loggedSetCount(active.logs) : 0;
    return (
      <>
        <PageHeader eyebrow="One workout at a time" title={dayDef.label} />
        <Card tone="accent" className="p-5">
          <Eyebrow>In progress</Eyebrow>
          <h2 className="display mt-1 text-4xl font-extrabold uppercase leading-[0.95] tracking-tight">
            {blockedDay.label}
          </h2>
          <p className="num mt-2 text-sm text-bone-2">
            Started {started} · {done} {done === 1 ? "set" : "sets"} logged
          </p>
          <p className="mt-3 max-w-prose text-sm text-bone-2">
            Finish or discard it before you start {dayDef.shortLabel}. It is still exactly where
            you left it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href={`/workout/${blockedDay.id}/`}>
              Resume {blockedDay.shortLabel}
            </LinkButton>
            <Button tone="danger" onClick={discard}>
              Discard it
            </Button>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Day ${dayDef.position} · ${dayDef.slots.length} exercises · ${totalSets} sets`}
        title={dayDef.label}
      >
        <div className="flex flex-wrap items-center gap-3">
          {live && (
            <Tag tone="amber" className="h-10 gap-2 px-2.5 text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" aria-hidden />
              In progress
              <Elapsed since={live.startedAt} />
            </Tag>
          )}
          {editing && <Tag tone="steel" className="h-10 px-2.5 text-xs">Editing a saved session</Tag>}
          <label className="flex items-center gap-2 text-sm text-bone-2">
            <span className="eyebrow">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              className="num h-10 rounded-md border border-line-2 bg-ink px-2 text-bone"
            />
          </label>
        </div>
      </PageHeader>

      {!drafts ? (
        <div className="grid gap-3">
          {dayDef.slots.map((s) => (
            <Skeleton key={s.id} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {customOrder && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border border-line bg-ink-2 px-4 py-2.5">
              <p className="text-xs text-bone-2">
                Reordered for this session. The next {shortLabel} starts in program order.
              </p>
              <Button tone="subtle" onClick={resetOrder} className="min-h-9 px-3 text-sm">
                Program order
              </Button>
            </div>
          )}
          {orderedSlots.map((slot, i) => (
            <div
              key={slot.id}
              ref={(el) => {
                cardRefs.current[slot.id] = el;
              }}
            >
              <ExerciseCard
                index={i}
                slot={slot}
                exercise={getExercise(slot.exerciseId)}
                draft={drafts[slot.id]}
                onChange={(d) => change(slot.id, d)}
                onMove={(delta) => move(slot.id, delta)}
                isFirst={i === 0}
                isLast={i === orderedSlots.length - 1}
                suggestion={suggestions[slot.id]}
                preview={previews[slot.id] ?? null}
                unit={settings.unit}
              />
            </div>
          ))}
        </div>
      )}

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-4 sm:bottom-4">
        <Card
          tone="raised"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="flex flex-col">
            <span className="eyebrow">Progress</span>
            <span className="num text-lg font-semibold">
              {loggedSets}
              <span className="text-bone-3">/{totalSets} sets</span>
            </span>
            <span className="text-[11px] text-bone-3">
              {editing
                ? "Changes apply when you update."
                : live
                  ? "Saved as you go. Leave and come back."
                  : "Log a set to start the session."}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {live && (
              <Button tone="danger" onClick={discard} disabled={saved}>
                Discard
              </Button>
            )}
            <Button onClick={complete} disabled={!drafts || saved} className="min-w-36">
              {saved ? "Saved" : editing ? "Update session" : "Mark complete"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
