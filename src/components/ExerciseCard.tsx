"use client";

import type { Exercise, LoggedSet, Slot, Suggestion, Unit } from "@/lib/types";
import { anchorIndex } from "@/lib/rir";
import { INCREMENT } from "@/lib/units";
import { Card, Tag } from "./ui";
import { RirChips } from "./RirChips";
import { Stepper } from "./Stepper";
import { SetRow } from "./SetRow";
import { ProgressionBadge } from "./ProgressionBadge";

export interface Draft {
  load: number | null;
  sets: LoggedSet[];
}

export function ExerciseCard({
  index,
  slot,
  exercise,
  draft,
  onChange,
  suggestion,
  preview,
  unit,
}: {
  index: number;
  slot: Slot;
  exercise: Exercise;
  draft: Draft;
  onChange: (d: Draft) => void;
  suggestion: Suggestion;
  /** What next session would look like if this draft were saved now. */
  preview: Suggestion | null;
  unit: Unit;
}) {
  const ai = anchorIndex(slot.rir);
  const performed = draft.sets.filter((s) => s.reps !== null).length;
  const done = performed === slot.sets;

  return (
    <Card
      tone={done ? "raised" : "default"}
      className="reveal overflow-hidden"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1 basis-52">
          <div className="flex items-baseline gap-2">
            <span className="num shrink-0 text-xs text-bone-3">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="display text-2xl font-bold leading-[1.05] tracking-tight">
              {exercise.name}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-bone-2">
            <span className="num">
              {slot.sets} × {slot.repRange.lo}–{slot.repRange.hi}
            </span>
            {exercise.technicalFailure && (
              <Tag tone="amber">0 RIR = last clean rep</Tag>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <RirChips rir={slot.rir} size="sm" />
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Load, all sets</span>
            <div className="mt-1">
              <Stepper
                label={`${exercise.name} load`}
                value={draft.load}
                onChange={(load) => onChange({ ...draft, load })}
                step={INCREMENT[unit]}
                min={0}
                start={suggestion.load ?? 0}
                size="lg"
                suffix={unit}
              />
            </div>
          </div>
          <div className="max-w-xs">
            <ProgressionBadge suggestion={suggestion} unit={unit} prefix="Suggested" />
          </div>
        </div>

        <div className="grid gap-1.5">
          {draft.sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              target={slot.rir[i]}
              isAnchor={i === ai}
              value={s}
              repRange={slot.repRange}
              onChange={(v) => {
                const sets = draft.sets.slice();
                sets[i] = v;
                onChange({ ...draft, sets });
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="num text-xs text-bone-3">
            {performed}/{slot.sets} sets
          </span>
          {preview && preview.action !== "none" && preview.action !== "seed" ? (
            <ProgressionBadge suggestion={preview} unit={unit} compact prefix="Next time" />
          ) : (
            <span className="text-xs text-bone-3">Log the anchor set to see next time&apos;s load.</span>
          )}
        </div>
      </div>
    </Card>
  );
}
