"use client";

import { useEffect, useRef } from "react";
import type { Slot, Unit } from "@/lib/types";
import { getExercise } from "@/data/exercises";
import type { Draft } from "./ExerciseCard";
import { Button } from "./ui";

/**
 * The whole session on one screen: every lift in the order it is being worked
 * through, its prescription, the load once a set is in, and arrows to rearrange.
 *
 * Rows are kept to a single tap-target's height so the longest day (eight
 * lifts) fits on a small phone without scrolling. The list can still scroll as
 * a fallback for a landscape phone.
 */
export function WorkoutSummary({
  open,
  onClose,
  title,
  slots,
  drafts,
  unit,
  loggedSets,
  plannedSets,
  customOrder,
  onMove,
  onResetOrder,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** In this session's order. */
  slots: readonly Slot[];
  drafts: Record<string, Draft>;
  unit: Unit;
  loggedSets: number;
  plannedSets: number;
  customOrder: boolean;
  onMove: (slotId: string, delta: -1 | 1) => void;
  onResetOrder: () => void;
  /** Close and bring this lift's card into view. */
  onJump: (slotId: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal puts the dialog in the top layer, above the sticky bar and the
  // nav, and gives Escape and focus containment for free. The page behind is
  // held still so a drag on the backdrop doesn't scroll the workout away.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    dialog.showModal();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog itself, not its contents, landed on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="workout-summary-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-lg border border-line-2 bg-ink-2 p-0 text-bone shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop:bg-black/60 open:flex"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <span className="eyebrow">
            Summary · {loggedSets}/{plannedSets} sets
          </span>
          <h2
            id="workout-summary-title"
            className="display truncate text-3xl font-extrabold leading-none tracking-tight"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close summary"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line-2 text-bone-2 transition-colors hover:bg-ink-3 hover:text-bone"
        >
          <span aria-hidden>✕</span>
        </button>
      </header>

      <ol className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-4">
        {slots.map((slot, i) => {
          const draft = drafts[slot.id];
          if (!draft) return null;
          const name = getExercise(slot.exerciseId).name;
          const skipped = !!draft.skipped;
          const performed = draft.sets.filter((s) => s.reps !== null).length;
          const done = performed === slot.sets;
          const showLoad = !skipped && performed > 0 && draft.load !== null;
          return (
            <li key={slot.id} className="flex items-center gap-2 py-1">
              <span className="num w-5 shrink-0 text-xs text-bone-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => onJump(slot.id)}
                className="min-w-0 flex-1 rounded py-0.5 text-left transition-colors hover:text-bone"
              >
                <span
                  className={`display block truncate text-lg font-bold leading-tight ${skipped ? "text-bone-3 line-through decoration-2" : ""}`}
                >
                  {name}
                </span>
                <span className="num block text-[11px] leading-tight text-bone-2">
                  {slot.sets} × {slot.repRange.lo}–{slot.repRange.hi}
                  {skipped ? (
                    <span className="text-oxide-2"> · skipped</span>
                  ) : done ? (
                    <span className="text-chalk"> · done</span>
                  ) : performed > 0 ? (
                    <span className="text-bone-3">
                      {" "}
                      · {performed}/{slot.sets} sets
                    </span>
                  ) : null}
                </span>
              </button>
              <span className="w-16 shrink-0 text-right">
                {showLoad ? (
                  <>
                    <span className="num text-sm text-bone">{draft.load}</span>
                    <span className="ml-0.5 text-[10px] text-bone-3">{unit}</span>
                  </>
                ) : (
                  <span className="num text-sm text-bone-3">–</span>
                )}
              </span>
              <span className="flex shrink-0 gap-1">
                <MoveButton
                  label={`Move ${name} earlier`}
                  glyph="↑"
                  disabled={i === 0}
                  onClick={() => onMove(slot.id, -1)}
                />
                <MoveButton
                  label={`Move ${name} later`}
                  glyph="↓"
                  disabled={i === slots.length - 1}
                  onClick={() => onMove(slot.id, 1)}
                />
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        {customOrder ? (
          <Button tone="subtle" onClick={onResetOrder} className="min-h-9 px-3 text-sm">
            Program order
          </Button>
        ) : (
          <span className="text-xs text-bone-3">Tap a lift to jump to it.</span>
        )}
        <Button onClick={onClose} className="min-h-10">
          Done
        </Button>
      </footer>
    </dialog>
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
