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
  /** Not being done this session. The values stay, so unskipping restores them. */
  skipped?: boolean;
}

export function ExerciseCard({
  index,
  slot,
  exercise,
  draft,
  onChange,
  onMove,
  onSkip,
  isFirst,
  isLast,
  suggestion,
  preview,
  unit,
}: {
  index: number;
  slot: Slot;
  exercise: Exercise;
  draft: Draft;
  onChange: (d: Draft) => void;
  /** Move this exercise one place earlier (-1) or later (1) in this session. */
  onMove: (delta: -1 | 1) => void;
  /** Skip or unskip this exercise for this session. */
  onSkip: (skipped: boolean) => void;
  isFirst: boolean;
  isLast: boolean;
  suggestion: Suggestion;
  /** What next session would look like if this draft were saved now. */
  preview: Suggestion | null;
  unit: Unit;
}) {
  const ai = anchorIndex(slot.rir);
  const performed = draft.sets.filter((s) => s.reps !== null).length;
  const done = performed === slot.sets;
  const skipped = !!draft.skipped;

  return (
    <Card
      tone={done && !skipped ? "raised" : "default"}
      className={`reveal overflow-hidden ${skipped ? "opacity-70" : ""}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1 basis-52">
          <div className="flex items-baseline gap-2">
            <span className="num shrink-0 text-xs text-bone-3">{String(index + 1).padStart(2, "0")}</span>
            <h3
              className={`display text-2xl font-bold leading-[1.05] tracking-tight ${skipped ? "text-bone-3 line-through decoration-2" : ""}`}
            >
              {exercise.name}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-bone-2">
            <span className="flex items-center gap-1">
              <MoveButton
                label={`Move ${exercise.name} earlier`}
                glyph="↑"
                disabled={isFirst}
                onClick={() => onMove(-1)}
              />
              <MoveButton
                label={`Move ${exercise.name} later`}
                glyph="↓"
                disabled={isLast}
                onClick={() => onMove(1)}
              />
            </span>
            <span className="num">
              {slot.sets} × {slot.repRange.lo}–{slot.repRange.hi}
            </span>
            {exercise.technicalFailure && !skipped && (
              <Tag tone="amber">0 RIR = last clean rep</Tag>
            )}
            <label
              className={[
                "flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border px-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                skipped ? "border-oxide/60 bg-oxide-deep/30 text-oxide-2" : "border-line-2 text-bone-2 hover:bg-ink-3",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={skipped}
                onChange={(e) => onSkip(e.target.checked)}
                className="h-4 w-4 accent-oxide"
                aria-label={`Skip ${exercise.name} this session`}
              />
              Skip
            </label>
          </div>
        </div>
        <div className="shrink-0">
          <RirChips rir={slot.rir} size="sm" />
        </div>
      </div>

      {skipped ? (
        <p className="px-4 py-3 text-sm text-bone-3">
          Skipped this session. It will not count toward progress, volume or next time&apos;s load.
        </p>
      ) : (
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
            {performed > 0 && preview && preview.action !== "none" && preview.action !== "seed" ? (
              <ProgressionBadge suggestion={preview} unit={unit} compact prefix="Next time" />
            ) : (
              <span className="text-xs text-bone-3">Log the anchor set to see next time&apos;s load.</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/** One half of the reorder control. Sized for a thumb, not a mouse. */
function MoveButton({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-line-2 text-base text-bone-2 transition-colors hover:bg-ink-3 hover:text-bone disabled:cursor-not-allowed disabled:border-line disabled:text-bone-3 disabled:opacity-40"
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}
