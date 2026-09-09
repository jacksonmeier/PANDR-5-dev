"use client";

import { useId } from "react";

/**
 * A numeric field with big minus/plus targets. `value` null renders empty; the
 * first tap on plus lands on `start`.
 */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  start,
  size = "md",
  suffix,
  className = "",
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  /** Value to jump to from empty. Defaults to `min`. */
  start?: number;
  size?: "md" | "lg";
  suffix?: string;
  className?: string;
}) {
  const id = useId();
  const dec = () => {
    if (value === null) return;
    const next = round(value - step);
    onChange(next < min ? min : next);
  };
  const inc = () => {
    if (value === null) return onChange(start ?? min);
    onChange(round(value + step));
  };
  const btn =
    size === "lg"
      ? "h-12 w-12 text-2xl"
      : "h-10 w-9 text-lg";
  const field =
    size === "lg"
      ? "h-12 w-24 text-3xl"
      : "h-10 w-12 text-lg";

  return (
    <div className={`inline-flex items-stretch overflow-hidden rounded-md border border-line-2 bg-ink ${className}`}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={dec}
        className={`display font-bold text-bone-2 hover:bg-ink-3 active:bg-ink-4 ${btn}`}
      >
        −
      </button>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : null);
          }}
          className={`num bg-transparent text-center font-semibold text-bone outline-none placeholder:text-bone-3 ${field}`}
          placeholder="–"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-1 bottom-1 text-[10px] text-bone-3">
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={inc}
        className={`display font-bold text-bone-2 hover:bg-ink-3 active:bg-ink-4 ${btn}`}
      >
        +
      </button>
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
