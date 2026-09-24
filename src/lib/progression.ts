import type { ExerciseLog, Session, Settings, Slot, Suggestion, SuggestionAction } from "./types";
import { RIR_META, anchorIndex, formatRir } from "./rir";
import { INCREMENT, roundToIncrement } from "./units";
import { getDay, getSlot } from "@/data/program";
import { performedSets } from "./volume";

interface Found {
  session: Session;
  log: ExerciseLog & { load: number };
}

/**
 * Newest log (by session createdAt) matching `pred` that is a real
 * performance: a recorded load and at least one set done, in an exercise that
 * was not skipped.
 *
 * Loads are pre-filled from the recommendation, so an exercise left blank or
 * skipped still carries a load. Counting it would let a day you never did the
 * lift overwrite the day you did, and with one progression line across the
 * week, that would reach every day it appears on.
 */
function newestLog(
  sessions: readonly Session[],
  pred: (log: ExerciseLog) => boolean,
): Found | undefined {
  let best: Found | undefined;
  for (const session of sessions) {
    for (const log of session.logs) {
      if (log.load === null || performedSets(log) === 0 || !pred(log)) continue;
      if (!best || session.createdAt >= best.session.createdAt) {
        best = { session, log: { ...log, load: log.load } };
      }
    }
  }
  return best;
}

export function increaseLoad(load: number, percent: number, inc: number): number {
  const bumped = roundToIncrement(load * (1 + percent / 100), inc);
  return Math.max(bumped, roundToIncrement(load + inc, inc));
}

export function decreaseLoad(load: number, percent: number, inc: number): number {
  const dropped = roundToIncrement(load * (1 - percent / 100), inc);
  const floor = roundToIncrement(load - inc, inc);
  return Math.max(0, Math.min(dropped, floor));
}

function rangeText(slot: Slot): string {
  return `${slot.repRange.lo}-${slot.repRange.hi}`;
}

/**
 * Where a prescription sits on the strength curve: reps to failure at the
 * middle of its range, at its anchor set's RIR target.
 */
function effortPoint(slot: Slot): number {
  const target = slot.rir[anchorIndex(slot.rir)];
  const { lo, hi } = slot.repRange;
  return (lo + hi) / 2 + Math.max(0, RIR_META[target].max);
}

/**
 * Carry a load from one prescription of a lift to another.
 *
 * The same exercise can be programmed at 8-11 on one day and 6-9 on another,
 * and the same weight is not the same effort at both. Epley's relation
 * (load x (1 + reps/30) is constant for a given strength) converts between
 * them, with reps counted to failure so the RIR target is part of the effort.
 * Only the ratio between two nearby prescriptions is used, so the formula's
 * error at high reps largely cancels.
 *
 * Where the two prescriptions match, the load comes back untouched, not even
 * rounded: a lateral raise on Monday and Wednesday is simply the same lift.
 */
export function carryLoad(load: number, from: Slot, to: Slot, inc: number): number {
  const a = effortPoint(from);
  const b = effortPoint(to);
  if (a === b) return load;
  return roundToIncrement((load * (1 + a / 30)) / (1 + b / 30), inc);
}

interface Decision {
  action: Exclude<SuggestionAction, "seed" | "none">;
  load: number;
  reason: string;
}

/**
 * The double-progression rule, applied to one logged performance against the
 * prescription it was performed under.
 *
 *   anchor set not logged      -> hold, "anchor set not logged"
 *   reps >= hi                 -> increase (top of range, overshoot, or clearly light)
 *   reps <  lo                 -> rir <= 1 ? decrease : hold ("push closer to failure first")
 *   otherwise                  -> hold, chase reps
 *
 * Beyond-failure finishers never affect the decision; the anchor is the set
 * before them. `when` names the session in the reason, e.g. "Sep 15" or
 * "Push, Sep 15".
 */
function judge(slot: Slot, log: ExerciseLog & { load: number }, when: string, settings: Settings): Decision {
  const inc = INCREMENT[settings.unit];
  const ai = anchorIndex(slot.rir);
  const anchor = log.sets[ai];
  const anchorLabel = `Set ${ai + 1}`;

  if (!anchor || anchor.reps === null || anchor.reps <= 0) {
    return {
      action: "hold",
      load: log.load,
      reason: `${anchorLabel} (the anchor) was not logged on ${when}. Keep ${log.load} and log it this session.`,
    };
  }

  const target = slot.rir[ai];
  const r = anchor.rir ?? RIR_META[target].max;
  const { lo, hi } = slot.repRange;
  const reps = anchor.reps;
  const rirText = formatRir(r);

  if (reps >= hi) {
    const how = reps > hi ? "overshot" : "reached";
    return {
      action: "increase",
      load: increaseLoad(log.load, settings.increasePercent, inc),
      reason: `${anchorLabel} ${how} the top of ${rangeText(slot)} (${reps} reps at ${rirText} RIR) on ${when}. Add ${settings.increasePercent}% and restart at ${lo}.`,
    };
  }

  if (reps < lo) {
    if (r <= 1) {
      return {
        action: "decrease",
        load: decreaseLoad(log.load, settings.decreasePercent, inc),
        reason: `${anchorLabel} fell below the floor of ${rangeText(slot)} (${reps} reps at ${rirText} RIR) on ${when}. Drop ${settings.decreasePercent}%.`,
      };
    }
    return {
      action: "hold",
      load: log.load,
      reason: `${anchorLabel} missed the floor of ${rangeText(slot)} on ${when} but had ${rirText} RIR left. Push that set to 0-1 RIR before judging the load.`,
    };
  }

  if (r <= 1) {
    return {
      action: "hold",
      load: log.load,
      reason: `${anchorLabel} hit ${reps} of ${rangeText(slot)} at ${rirText} RIR on ${when}. Keep the load and chase ${hi}.`,
    };
  }

  return {
    action: "hold",
    load: log.load,
    reason: `${anchorLabel} hit ${reps} of ${rangeText(slot)} on ${when} but had ${rirText} RIR left. Keep the load and take that set to 0-1 RIR.`,
  };
}

/**
 * The load for the next session of `slot`.
 *
 * An exercise is one lift however many days it appears on. The newest
 * performance of it, on any day, is judged against the prescription it was
 * performed under, and the result is carried to this day's prescription. So a
 * lateral raise that tops out on Monday is heavier on Wednesday, and
 * Wednesday's result sets Friday's.
 *
 *   no log for the exercise          -> none
 *   logged under a slot the program
 *   no longer has                    -> seed: carry the load, nothing to judge it by
 *   otherwise                        -> judge, then carry to this day's range
 */
export function suggestNextLoad(
  slot: Slot,
  sessions: readonly Session[],
  settings: Settings,
): Suggestion {
  const inc = INCREMENT[settings.unit];
  const found = newestLog(sessions, (l) => l.exerciseId === slot.exerciseId);

  if (!found) {
    return { action: "none", load: null, reason: "No history yet. Pick a load you can hit the bottom of the range with at the first set's RIR." };
  }

  const source = getSlot(found.log.slotId);
  if (!source) {
    return {
      action: "seed",
      load: found.log.load,
      reason: `Starting from your ${formatDate(found.session.date)} load, logged under an older version of the program.`,
      basedOn: basedOn(found, slot),
    };
  }

  const sourceDay = getDay(found.session.dayId);
  const when =
    found.session.dayId === slot.dayId || !sourceDay
      ? formatDate(found.session.date)
      : `${sourceDay.shortLabel}, ${formatDate(found.session.date)}`;
  const decision = judge(source, found.log, when, settings);
  const load = carryLoad(decision.load, source, slot, inc);
  const carried =
    load === decision.load
      ? ""
      : ` That is ${decision.load} for ${rangeText(source)}, which is ${load} for this day's ${rangeText(slot)}.`;

  return {
    action: decision.action,
    load,
    reason: decision.reason + carried,
    basedOn: basedOn(found, source),
  };
}

/** `slot` is the prescription the log was performed under, for its anchor. */
function basedOn(found: Found, slot: Slot): Suggestion["basedOn"] {
  const ai = anchorIndex(slot.rir);
  const anchor = found.log.sets[ai];
  return {
    sessionId: found.session.id,
    date: found.session.date,
    load: found.log.load,
    anchorReps: anchor?.reps ?? null,
    anchorRir: anchor?.rir ?? null,
  };
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
