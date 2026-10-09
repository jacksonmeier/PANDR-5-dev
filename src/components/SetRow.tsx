"use client";

import type { LoggedSet, RepRange, RirTarget } from "@/lib/types";
import { RIR_META } from "@/lib/rir";
import { Stepper } from "./Stepper";

/* The options name themselves, so the select needs no label beside it on a phone. */
const RIR_OPTIONS: { value: number; label: string }[] = [
  { value: 4, label: "RIR 4+" },
  { value: 3, label: "RIR 3" },
  { value: 2, label: "RIR 2" },
  { value: 1, label: "RIR 1" },
  { value: 0, label: "RIR 0" },
  { value: -1, label: "RIR <0" },
];

export function SetRow({
  index,
  target,
  isAnchor,
  value,
  onChange,
  repRange,
}: {
  index: number;
  target: RirTarget;
  isAnchor: boolean;
  value: LoggedSet;
  onChange: (v: LoggedSet) => void;
  repRange: RepRange;
}) {
  const meta = RIR_META[target];
  const performed = value.reps !== null;
  return (
    <div
      className={[
        "glass-inset grid grid-cols-[1.25rem_2.5rem_minmax(0,1fr)_auto] items-center gap-1.5 px-2.5 py-2 transition-colors sm:grid-cols-[1.5rem_2.75rem_1fr_auto] sm:gap-2",
        isAnchor
          ? "border-oxide/50 bg-oxide-deep/30"
          : performed
            ? ""
            : "opacity-80",
      ].join(" ")}
    >
      <span className="num text-xs text-bone-3">{index + 1}</span>
      <span
        className={[
          "num inline-flex h-7 items-center justify-center rounded-chip border text-xs font-semibold",
          meta.beyondFailure ? "hazard border-amber/60 text-amber" : "border-bone/15 bg-bone/6 text-bone-2",
        ].join(" ")}
        title={`Target ${meta.label} RIR`}
        aria-label={`Target ${meta.label} RIR`}
      >
        {meta.label}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <Stepper
          label={`Set ${index + 1} reps`}
          value={value.reps}
          onChange={(reps) => onChange({ ...value, reps })}
          start={repRange.lo}
          min={0}
        />
        <span className="hidden text-[10px] uppercase tracking-widest text-bone-3 sm:inline">reps</span>
      </div>
      <label className="flex items-center">
        <select
          value={value.rir === null ? "" : String(value.rir)}
          onChange={(e) => onChange({ ...value, rir: e.target.value === "" ? null : Number(e.target.value) })}
          className={`field num h-9 pl-2.5 text-sm font-semibold ${value.rir === null ? "text-bone-3" : ""}`}
          aria-label={`Set ${index + 1} achieved RIR`}
        >
          <option value="">RIR –</option>
          {RIR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {isAnchor && (
        <span className="col-span-4 -mt-0.5 text-[10px] uppercase tracking-[0.18em] text-oxide-2">
          Anchor set. Drives next session&apos;s load.
        </span>
      )}
    </div>
  );
}
