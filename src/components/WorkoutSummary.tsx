"use client";

import { useEffect, useRef, useState } from "react";
import type { Slot, Unit } from "@/lib/types";
import { getExercise } from "@/data/exercises";
import type { Draft } from "./ExerciseCard";
import { Button } from "./ui";

/** How long the sheet takes to leave, matching the sheet-out keyframes in globals.css. */
const CLOSE_MS = 320;

/**
 * The whole session on one screen: every lift in the order it is being worked
 * through, its prescription, the load once a set is in, and arrows to rearrange.
 *
 * Rows are kept to a single tap-target's height so the longest day (eight
 * lifts) fits on a small phone without scrolling. The list can still scroll as
 * a fallback for a landscape phone.
 *
 * It rises from the bottom of a phone screen and settles into the centre of a
 * wider one; the geometry and the motion are .sheet in globals.css. Closing is
 * animated too, which a <dialog> does not do by itself: the sheet is marked as
 * closing, given its exit, and only then actually closed.
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
  const [closing, setClosing] = useState(false);
  /** A lift picked from the list, handed on once the sheet has actually closed. */
  const pendingJump = useRef<string | null>(null);

  // showModal puts the dialog in the top layer, above the sticky bar and the
  // nav, and gives Escape and focus containment for free. The page behind is
  // held still so a drag on the backdrop doesn't scroll the workout away.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    setClosing(false);
    dialog.showModal();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function requestClose() {
    const dialog = ref.current;
    if (!dialog || !dialog.open || closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.close();
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      if (dialog.open) dialog.close();
    }, CLOSE_MS);
  }

  /** The dialog's own close event: Escape, or the end of requestClose. */
  function closed() {
    setClosing(false);
    onClose();
    const id = pendingJump.current;
    pendingJump.current = null;
    if (id) onJump(id);
  }

  function jump(slotId: string) {
    pendingJump.current = slotId;
    requestClose();
  }

  return (
    <dialog
      ref={ref}
      onClose={closed}
      onCancel={(e) => {
        // Escape. Take the animated exit instead of the instant one.
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        // A click on the dialog itself, not its contents, landed on the backdrop.
        if (e.target === e.currentTarget) requestClose();
      }}
      data-closing={closing ? "" : undefined}
      aria-labelledby="workout-summary-title"
      className="glass-raised sheet overflow-hidden p-0 text-bone"
    >
      <header className="flex items-start justify-between gap-3 border-b border-bone/8 px-4 py-3.5">
        <div className="min-w-0">
          <span className="eyebrow">
            Summary · {loggedSets}/{plannedSets} sets
          </span>
          <h2
            id="workout-summary-title"
            className="display mt-0.5 truncate text-3xl font-extrabold leading-none tracking-tight"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={requestClose}
          aria-label="Close summary"
          className="btn-ghost press flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-bone-2 hover:text-bone"
        >
          <span aria-hidden>✕</span>
        </button>
      </header>

      <ol className="min-h-0 flex-1 divide-y divide-bone/8 overflow-y-auto overscroll-contain px-4">
        {slots.map((slot, i) => {
          const draft = drafts[slot.id];
          if (!draft) return null;
          const name = getExercise(slot.exerciseId).name;
          const skipped = !!draft.skipped;
          const performed = draft.sets.filter((s) => s.reps !== null).length;
          const done = performed === slot.sets;
          const showLoad = !skipped && performed > 0 && draft.load !== null;
          return (
            <li key={slot.id} className="flex items-center gap-2 py-1.5">
              <span className="num w-5 shrink-0 text-xs text-bone-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => jump(slot.id)}
                className="min-w-0 flex-1 rounded py-0.5 text-left transition-colors hover:text-bone"
              >
                <span
                  className={`display block truncate text-lg font-bold leading-[1.15] ${skipped ? "text-bone-3 line-through decoration-2" : ""}`}
                >
                  {name}
                </span>
                <span className="num mt-0.5 block text-[11px] leading-tight text-bone-2">
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
              <span className="w-14 shrink-0 text-right">
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

      <footer className="flex items-center justify-between gap-3 border-t border-bone/8 px-4 py-3">
        {customOrder ? (
          <Button tone="subtle" onClick={onResetOrder} className="min-h-9 px-3 text-sm">
            Program order
          </Button>
        ) : (
          <span className="text-xs text-bone-3">Tap a lift to jump to it.</span>
        )}
        <Button onClick={requestClose} className="min-h-10">
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
      className="btn-ghost press flex h-9 w-9 items-center justify-center rounded-pill text-base text-bone-2 hover:text-bone disabled:cursor-not-allowed disabled:text-bone-3 disabled:opacity-40"
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}
