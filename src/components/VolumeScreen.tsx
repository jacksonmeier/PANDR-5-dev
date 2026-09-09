"use client";

import { useState } from "react";
import { VOLUME_NOTE, WEIGHTING_NOTE } from "@/data/targets";
import { getDay } from "@/data/program";
import { currentCycle } from "@/lib/schedule";
import { effectiveSets, prescribedCycleLogs, sessionsEffectiveSets } from "@/lib/volume";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Skeleton, Tag } from "./ui";
import { AllGroups } from "./VolumeBars";

type Mode = "cycle" | "program";

export function VolumeScreen() {
  const hydrated = useStore((s) => s._hydrated);
  const sessions = useStore((s) => s.sessions);
  const [mode, setMode] = useState<Mode>("cycle");

  const cycle = currentCycle(sessions);
  const totals = mode === "cycle" ? sessionsEffectiveSets(cycle) : effectiveSets(prescribedCycleLogs());

  return (
    <>
      <PageHeader
        eyebrow="Fractional set allocation"
        title={
          <>
            Effective <span className="text-oxide">sets</span>
          </>
        }
        lede="Every logged set credits its primary mover fully and its synergists partially. Bars show this cycle against the sheet's full-cycle totals; the pale band is the 10 to 20 range the model aims for."
      >
        <div className="flex rounded-md border border-line-2 p-0.5" role="tablist" aria-label="Volume source">
          {(["cycle", "program"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={[
                "display h-10 rounded px-3 text-sm font-bold uppercase tracking-[0.12em] transition-colors",
                mode === m ? "bg-oxide text-bone" : "text-bone-2 hover:text-bone",
              ].join(" ")}
            >
              {m === "cycle" ? "This cycle" : "Full program"}
            </button>
          ))}
        </div>
      </PageHeader>

      {!hydrated ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-bone-3">
            {mode === "cycle" ? (
              cycle.length === 0 ? (
                <span>No sessions in the current cycle yet.</span>
              ) : (
                <>
                  <span>Counting:</span>
                  {cycle.map((s) => (
                    <Tag key={s.id}>{getDay(s.dayId)?.shortLabel} · {s.date}</Tag>
                  ))}
                </>
              )
            ) : (
              <span>What a complete cycle with every prescribed set yields. This is the sheet&apos;s table, recomputed.</span>
            )}
          </div>

          <Card className="reveal p-5">
            <AllGroups totals={totals} />
          </Card>

          <div className="mt-6 grid gap-3 text-sm text-bone-2 sm:grid-cols-2">
            <Card className="p-4">
              <span className="eyebrow">Weighting</span>
              <p className="num mt-1 text-xs">{WEIGHTING_NOTE}</p>
            </Card>
            <Card className="p-4">
              <span className="eyebrow">From the sheet</span>
              <p className="mt-1 text-xs leading-relaxed">{VOLUME_NOTE}</p>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
