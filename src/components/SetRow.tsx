"use client";

import type { LoggedSet, RepRange, RirTarget } from "@/lib/types";
import { RIR_META } from "@/lib/rir";
import { Stepper } from "./Stepper";

const RIR_OPTIONS: { value: number; label: string }[] = [
  { value: 4, label: "4+" },
  { value: 3, label: "3" },
  { value: 2, label: "2" },
  { value: 1, label: "1" },
  { value: 0, label: "0" },
  { value: -1, label: "<0" },
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
        "grid grid-cols-[1.5rem_2.75rem_1fr_auto] items-center gap-2 rounded-md border px-2 py-1.5",
        isAnchor
          ? "border-oxide/60 bg-oxide-deep/20"
          : performed
            ? "border-line bg-ink"
            : "border-line/60 bg-ink/60",
      ].join(" ")}
    >
      <span className="num text-xs text-bone-3">{index + 1}</span>
      <span
        className={[
          "num inline-flex h-7 items-center justify-center rounded border text-xs font-semibold",
          meta.beyondFailure ? "hazard border-amber/60 text-amber" : "border-line-2 text-bone-2",
        ].join(" ")}
        title={`Target ${meta.label} RIR`}
        aria-label={`Target ${meta.label} RIR`}
      >
        {meta.label}
      </span>
      <div className="flex items-center gap-2">
        <Stepper
          label={`Set ${index + 1} reps`}
          value={value.reps}
          onChange={(reps) => onChange({ ...value, reps })}
          start={repRange.lo}
          min={0}
        />
        <span className="text-[10px] uppercase tracking-widest text-bone-3">reps</span>
      </div>
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-bone-3">rir</span>
        <select
          value={value.rir === null ? "" : String(value.rir)}
          onChange={(e) => onChange({ ...value, rir: e.target.value === "" ? null : Number(e.target.value) })}
          className="num h-10 rounded-md border border-line-2 bg-ink px-2 text-sm font-semibold text-bone"
          aria-label={`Set ${index + 1} achieved RIR`}
        >
          <option value="">–</option>
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
