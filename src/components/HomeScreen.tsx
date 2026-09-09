"use client";

import Link from "next/link";
import { getDay } from "@/data/program";
import { getExercise } from "@/data/exercises";
import { currentCycle, cycleStatus, newSessionId, nextDayId, todayIso } from "@/lib/schedule";
import { sessionsEffectiveSets } from "@/lib/volume";
import { useStore } from "@/lib/store";
import { Button, Card, Eyebrow, LinkButton, PageHeader, Skeleton } from "./ui";
import { DayStrip } from "./DayStrip";
import { ActiveRestCard } from "./ActiveRestCard";
import { GroupOverview } from "./VolumeBars";

export function HomeScreen() {
  const hydrated = useStore((s) => s._hydrated);
  const sessions = useStore((s) => s.sessions);
  const saveSession = useStore((s) => s.saveSession);

  if (!hydrated) {
    return (
      <>
        <PageHeader eyebrow="Loading" title="PANDR-5" />
        <Skeleton className="h-20" />
        <Skeleton className="mt-4 h-40" />
      </>
    );
  }

  const status = cycleStatus(sessions);
  const nextId = nextDayId(sessions);
  const next = getDay(nextId);
  if (!next) throw new Error("bad day");
  const cycle = currentCycle(sessions);
  const totals = sessionsEffectiveSets(cycle);
  const cycleNumber = Math.max(1, sessions.filter((s) => s.dayId === "push").length);
  const recent = [...sessions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const totalSets = next.slots.reduce((n, s) => n + s.sets, 0);

  function markRestDone() {
    saveSession({
      id: newSessionId(),
      dayId: nextId,
      date: todayIso(),
      createdAt: Date.now(),
      logs: [],
    });
  }

  return (
    <>
      <PageHeader
        eyebrow={sessions.length === 0 ? "No sessions yet" : `Cycle ${cycleNumber} · ${cycle.length} of 7 days done`}
        title={
          <>
            Next up: <span className="text-oxide">{next.shortLabel}</span>
          </>
        }
      />

      <DayStrip
        status={status}
        hrefFor={(id) => (getDay(id)?.kind === "training" ? `/workout/${id}/` : null)}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {next.kind === "training" ? (
          <Card tone="accent" className="reveal min-w-0 p-5" style={{ animationDelay: "200ms" }}>
            <Eyebrow>Day {next.position}</Eyebrow>
            <h2 className="display mt-1 text-5xl font-extrabold uppercase leading-[0.9] tracking-tight">
              {next.label}
            </h2>
            <p className="num mt-3 text-sm text-bone-2">
              {next.slots.length} exercises · {totalSets} sets
            </p>
            <ul className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1 text-sm text-bone-2 sm:grid-cols-2">
              {next.slots.map((s) => (
                <li key={s.id} className="flex min-w-0 justify-between gap-3 border-b border-line/60 py-1">
                  <span className="min-w-0 truncate">{exerciseName(s.exerciseId)}</span>
                  <span className="num shrink-0 text-bone-3">
                    {s.sets}×{s.repRange.lo}–{s.repRange.hi}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href={`/workout/${next.id}/`}>Start {next.shortLabel}</LinkButton>
              <LinkButton href="/program/" tone="ghost">
                Full program
              </LinkButton>
            </div>
          </Card>
        ) : (
          <div className="reveal min-w-0" style={{ animationDelay: "200ms" }}>
            <ActiveRestCard
              dayId={next.id as "rest1" | "rest2"}
              position={next.position}
              action={<Button onClick={markRestDone}>Mark done</Button>}
            />
          </div>
        )}

        <div className="grid min-w-0 content-start gap-4">
          <Card className="reveal p-5" style={{ animationDelay: "280ms" }}>
            <div className="mb-3 flex items-baseline justify-between">
              <Eyebrow>This cycle&apos;s volume</Eyebrow>
              <Link href="/volume/" className="text-xs text-steel hover:underline">
                Per muscle
              </Link>
            </div>
            <GroupOverview totals={totals} />
            <p className="mt-3 text-[11px] text-bone-3">
              Effective sets, fractional credit for synergists. Targets are a full cycle from the sheet.
            </p>
          </Card>

          <Card className="reveal p-5" style={{ animationDelay: "360ms" }}>
            <div className="mb-3 flex items-baseline justify-between">
              <Eyebrow>Recent</Eyebrow>
              <Link href="/history/" className="text-xs text-steel hover:underline">
                All history
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-bone-3">
                Nothing logged yet. Start with Push, or read{" "}
                <Link href="/about/" className="text-steel hover:underline">
                  how the model works
                </Link>
                .
              </p>
            ) : (
              <ul className="grid gap-1 text-sm">
                {recent.map((s) => {
                  const d = getDay(s.dayId);
                  return (
                    <li key={s.id} className="flex justify-between gap-3 border-b border-line/60 py-1">
                      <span className="display font-bold uppercase tracking-wider">{d?.label}</span>
                      <span className="num text-bone-3">{s.date}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function exerciseName(id: string): string {
  return getExercise(id).name;
}
