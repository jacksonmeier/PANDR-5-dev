import type { RirTarget } from "./types";

export interface RirMeta {
  /** Display label, as in the sheet. */
  label: string;
  /** Upper bound of the target. `'0-1'` -> 1, `'<0'` -> -1. */
  max: number;
  beyondFailure: boolean;
}

export const RIR_META: Record<RirTarget, RirMeta> = {
  "3": { label: "3", max: 3, beyondFailure: false },
  "2": { label: "2", max: 2, beyondFailure: false },
  "1": { label: "1", max: 1, beyondFailure: false },
  "0": { label: "0", max: 0, beyondFailure: false },
  "0-1": { label: "0-1", max: 1, beyondFailure: false },
  "<0": { label: "<0", max: -1, beyondFailure: true },
};

/**
 * The set whose reps drive progression: the final set, unless the final set is a
 * beyond-failure finisher, in which case the set before it.
 */
export function anchorIndex(rir: readonly RirTarget[]): number {
  if (rir.length === 0) return -1;
  const last = rir[rir.length - 1];
  const idx = RIR_META[last].beyondFailure ? rir.length - 2 : rir.length - 1;
  return Math.max(idx, 0);
}

/** Achieved RIR number to display text. -1 renders as "<0". */
export function formatRir(rir: number | null): string {
  if (rir === null) return "";
  if (rir < 0) return "<0";
  return String(rir);
}

/** Default logged RIR for a set: the target's upper bound. */
export function defaultLoggedRir(target: RirTarget): number {
  return RIR_META[target].max;
}
