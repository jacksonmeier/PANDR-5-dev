import type { Day } from "@/lib/types";
import { getExercise } from "@/data/exercises";
import { Card, Eyebrow, LinkButton, Tag } from "./ui";
import { RirChips } from "./RirChips";

export function ProgramDay({ day, index = 0 }: { day: Day; index?: number }) {
  const totalSets = day.slots.reduce((n, s) => n + s.sets, 0);
  return (
    <Card className="reveal overflow-hidden" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-4">
        <div>
          <Eyebrow>
            Day {day.position} · {day.slots.length} exercises · {totalSets} sets
          </Eyebrow>
          <h2 className="display mt-1 text-4xl font-extrabold uppercase leading-none tracking-tight">
            {day.label}
          </h2>
        </div>
        <LinkButton href={`/workout/${day.id}/`} tone="ghost">
          Log this day
        </LinkButton>
      </div>
      <ol className="divide-y divide-line">
        {day.slots.map((slot, i) => {
          const ex = getExercise(slot.exerciseId);
          return (
            <li key={slot.id} className="grid grid-cols-[1.75rem_1fr] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1.75rem_1fr_auto]">
              <span className="num text-xs text-bone-3">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium leading-tight">{ex.name}</span>
                  {ex.technicalFailure && <Tag tone="amber">technical failure</Tag>}
                </div>
                <span className="num text-sm text-bone-2">
                  {slot.sets} × {slot.repRange.lo}–{slot.repRange.hi}
                </span>
              </div>
              <div className="col-start-2 sm:col-start-auto">
                <RirChips rir={slot.rir} size="sm" />
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
