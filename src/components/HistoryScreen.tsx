"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ExerciseLog, Session } from "@/lib/types";
import { getDay, getSlot } from "@/data/program";
import { EXERCISE_LIST, getExercise } from "@/data/exercises";
import { anchorIndex, formatRir } from "@/lib/rir";
import { formatLoad } from "@/lib/units";
import { useStore } from "@/lib/store";
import { Button, Card, Eyebrow, PageHeader, Skeleton, Tag } from "./ui";

type Tab = "sessions" | "exercise";

export function HistoryScreen() {
  const hydrated = useStore((s) => s._hydrated);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const deleteSession = useStore((s) => s.deleteSession);
  const [tab, setTab] = useState<Tab>("sessions");
  const [exerciseId, setExerciseId] = useState<string>(EXERCISE_LIST[0].id);

  const sorted = useMemo(() => [...sessions].sort((a, b) => b.createdAt - a.createdAt), [sessions]);

  const byExercise = useMemo(() => {
    const rows: { session: Session; log: ExerciseLog }[] = [];
    for (const s of sorted) for (const l of s.logs) if (l.exerciseId === exerciseId) rows.push({ session: s, log: l });
    return rows;
  }, [sorted, exerciseId]);

  return (
    <>
      <PageHeader eyebrow={`${sessions.length} sessions logged`} title="History">
        <div className="flex rounded-md border border-line-2 p-0.5" role="tablist">
          {(["sessions", "exercise"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={[
                "display h-10 rounded px-3 text-sm font-bold uppercase tracking-[0.12em] transition-colors",
                tab === t ? "bg-oxide text-bone" : "text-bone-2 hover:text-bone",
              ].join(" ")}
            >
              {t === "sessions" ? "Sessions" : "By exercise"}
            </button>
          ))}
        </div>
      </PageHeader>

      {!hydrated ? (
        <Skeleton className="h-64" />
      ) : sessions.length === 0 ? (
        <Card className="p-6 text-sm text-bone-2">
          Nothing logged yet.{" "}
          <Link href="/" className="text-steel hover:underline">
            Start the next workout.
          </Link>
        </Card>
      ) : tab === "sessions" ? (
        <div className="grid gap-3">
          {sorted.map((s, i) => (
            <SessionCard
              key={s.id}
              session={s}
              index={i}
              unit={settings.unit}
              onDelete={() => {
                if (window.confirm(`Delete the ${getDay(s.dayId)?.label} session from ${s.date}?`)) deleteSession(s.id);
              }}
            />
          ))}
        </div>
      ) : (
        <>
          <label className="mb-4 flex flex-wrap items-center gap-3">
            <span className="eyebrow">Exercise</span>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="h-11 min-w-64 rounded-md border border-line-2 bg-ink px-3 text-bone"
            >
              {[...EXERCISE_LIST].sort((a, b) => a.name.localeCompare(b.name)).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </label>
          {byExercise.length === 0 ? (
            <Card className="p-6 text-sm text-bone-2">No sessions include this exercise yet.</Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-bone-3">
                    <th className="px-4 py-2 font-bold">Date</th>
                    <th className="px-4 py-2 font-bold">Day</th>
                    <th className="px-4 py-2 font-bold">Load</th>
                    <th className="px-4 py-2 font-bold">Sets (reps@RIR)</th>
                    <th className="px-4 py-2 font-bold">Anchor</th>
                  </tr>
                </thead>
                <tbody>
                  {byExercise.map(({ session, log }) => {
                    const slot = getSlot(log.slotId);
                    const ai = slot ? anchorIndex(slot.rir) : log.sets.length - 1;
                    const a = log.sets[ai];
                    return (
                      <tr key={session.id + log.slotId} className="border-b border-line/60">
                        <td className="num px-4 py-2 text-bone-2">{session.date}</td>
                        <td className="display px-4 py-2 font-bold uppercase tracking-wider">{getDay(session.dayId)?.shortLabel}</td>
                        <td className="num px-4 py-2">{formatLoad(log.load, settings.unit) || "–"}</td>
                        <td className="num px-4 py-2 text-bone-2">{setsText(log, ai)}</td>
                        <td className="num px-4 py-2">
                          {a && a.reps !== null ? `${a.reps} @ ${formatRir(a.rir) || "–"}` : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function setsText(log: ExerciseLog, anchor: number): string {
  return log.sets
    .map((s, i) => {
      if (s.reps === null) return "–";
      const t = `${s.reps}@${formatRir(s.rir) || "?"}`;
      return i === anchor ? `[${t}]` : t;
    })
    .join("  ");
}

function SessionCard({
  session,
  index,
  unit,
  onDelete,
}: {
  session: Session;
  index: number;
  unit: "lb" | "kg";
  onDelete: () => void;
}) {
  const day = getDay(session.dayId);
  const logged = session.logs.filter((l) => l.sets.some((s) => s.reps !== null));
  const setCount = session.logs.reduce((n, l) => n + l.sets.filter((s) => s.reps !== null).length, 0);
  return (
    <Card className="reveal" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 flex-col">
            <span className="display truncate text-2xl font-bold uppercase leading-tight tracking-tight">{day?.label}</span>
            <span className="num text-xs text-bone-3">{session.date}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {day?.kind === "rest" ? (
              <Tag tone="chalk">rest done</Tag>
            ) : (
              <span className="num whitespace-nowrap text-xs text-bone-2">
                {logged.length} ex · {setCount} sets
              </span>
            )}
            <span className="text-bone-3 transition-transform group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </div>
        </summary>
        <div className="border-t border-line px-4 py-3">
          {session.logs.length > 0 && (
            <ul className="grid gap-1.5 text-sm">
              {session.logs.map((l) => {
                const slot = getSlot(l.slotId);
                const ai = slot ? anchorIndex(slot.rir) : l.sets.length - 1;
                return (
                  <li key={l.slotId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-line/60 py-1.5 sm:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)]">
                    <span className="truncate">{getExercise(l.exerciseId).name}</span>
                    <span className="num text-right text-bone">{formatLoad(l.load, unit) || "–"}</span>
                    <span className="num col-span-2 text-xs text-bone-2 sm:col-span-1">{setsText(l, ai)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>Brackets mark the anchor set</Eyebrow>
            <div className="flex gap-2">
              {day?.kind === "training" && (
                <Link
                  href={`/workout/${session.dayId}/?session=${encodeURIComponent(session.id)}`}
                  className="display inline-flex min-h-11 items-center rounded-md border border-line-2 px-4 text-base font-bold uppercase tracking-[0.12em] text-bone hover:bg-ink-3"
                >
                  Edit
                </Link>
              )}
              <Button tone="danger" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </details>
    </Card>
  );
}
