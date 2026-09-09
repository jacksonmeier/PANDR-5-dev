import type { ExerciseLog, Session, Settings, Slot, Suggestion } from "./types";
import { RIR_META, anchorIndex, formatRir } from "./rir";
import { INCREMENT, roundToIncrement } from "./units";

interface Found {
  session: Session;
  log: ExerciseLog & { load: number };
}

/** Newest log (by session createdAt) matching `pred`, with a recorded load. */
function newestLog(
  sessions: readonly Session[],
  pred: (log: ExerciseLog) => boolean,
): Found | undefined {
  let best: Found | undefined;
  for (const session of sessions) {
    for (const log of session.logs) {
      if (log.load === null || !pred(log)) continue;
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
 * Double progression for one slot, from the newest matching log.
 *
 *   no log for slot            -> seed from the same exercise on another day, else none
 *   anchor set not logged      -> hold, "anchor set not logged"
 *   reps >= hi                 -> increase (top of range, overshoot, or clearly light)
 *   reps <  lo                 -> rir <= 1 ? decrease : hold ("push closer to failure first")
 *   otherwise                  -> hold, chase reps
 *
 * Beyond-failure finishers never affect the decision; the anchor is the set
 * before them.
 */
export function suggestNextLoad(
  slot: Slot,
  sessions: readonly Session[],
  settings: Settings,
): Suggestion {
  const inc = INCREMENT[settings.unit];
  const found = newestLog(sessions, (l) => l.slotId === slot.id);

  if (!found) {
    const seed = newestLog(sessions, (l) => l.exerciseId === slot.exerciseId);
    if (!seed) {
      return { action: "none", load: null, reason: "No history yet. Pick a load you can hit the bottom of the range with at the first set's RIR." };
    }
    return {
      action: "seed",
      load: seed.log.load,
      reason: `No history on this day yet. Starting from your last ${formatDate(seed.session.date)} load for this exercise.`,
      basedOn: basedOn(seed, slot),
    };
  }

  const { session, log } = found;
  const ai = anchorIndex(slot.rir);
  const anchor = log.sets[ai];
  const anchorLabel = `Set ${ai + 1}`;

  if (!anchor || anchor.reps === null || anchor.reps <= 0) {
    return {
      action: "hold",
      load: log.load,
      reason: `${anchorLabel} (the anchor) was not logged last time. Keep ${log.load} and log it this session.`,
      basedOn: basedOn(found, slot),
    };
  }

  const target = slot.rir[ai];
  const r = anchor.rir ?? RIR_META[target].max;
  const { lo, hi } = slot.repRange;
  const reps = anchor.reps;
  const rirText = formatRir(r);

  if (reps >= hi) {
    const next = increaseLoad(log.load, settings.increasePercent, inc);
    const how = reps > hi ? "overshot" : "reached";
    return {
      action: "increase",
      load: next,
      reason: `${anchorLabel} ${how} the top of ${rangeText(slot)} (${reps} reps at ${rirText} RIR) on ${formatDate(session.date)}. Add ${settings.increasePercent}% and restart at ${lo}.`,
      basedOn: basedOn(found, slot),
    };
  }

  if (reps < lo) {
    if (r <= 1) {
      const next = decreaseLoad(log.load, settings.decreasePercent, inc);
      return {
        action: "decrease",
        load: next,
        reason: `${anchorLabel} fell below the floor of ${rangeText(slot)} (${reps} reps at ${rirText} RIR) on ${formatDate(session.date)}. Drop ${settings.decreasePercent}%.`,
        basedOn: basedOn(found, slot),
      };
    }
    return {
      action: "hold",
      load: log.load,
      reason: `${anchorLabel} missed the floor of ${rangeText(slot)} but had ${rirText} RIR left. Push that set to 0-1 RIR before judging the load.`,
      basedOn: basedOn(found, slot),
    };
  }

  if (r <= 1) {
    return {
      action: "hold",
      load: log.load,
      reason: `${anchorLabel} hit ${reps} of ${rangeText(slot)} at ${rirText} RIR on ${formatDate(session.date)}. Keep the load and chase ${hi}.`,
      basedOn: basedOn(found, slot),
    };
  }

  return {
    action: "hold",
    load: log.load,
    reason: `${anchorLabel} hit ${reps} of ${rangeText(slot)} but had ${rirText} RIR left. Keep the load and take that set to 0-1 RIR.`,
    basedOn: basedOn(found, slot),
  };
}

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
