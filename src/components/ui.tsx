import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="reveal mb-8 mt-8 flex flex-col gap-3 sm:mb-10 sm:mt-12">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl">
          {title}
        </h1>
        {children}
      </div>
      {lede && <p className="max-w-2xl text-base text-bone-2">{lede}</p>}
    </div>
  );
}

/**
 * A pane of glass. `default` is the ordinary card, `raised` floats (bars,
 * sheets), and `accent` is the same glass with the accent showing through its
 * edge, for the one card on a screen that wants the eye.
 */
export function Card({
  children,
  className = "",
  tone = "default",
  style,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "raised" | "accent";
  style?: React.CSSProperties;
}) {
  const tones = {
    default: "glass",
    raised: "glass-raised",
    accent: "glass glass-accent",
  };
  return (
    <section className={`${tones[tone]} ${className}`} style={style}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`eyebrow ${className}`}>{children}</span>;
}

type BtnTone = "primary" | "ghost" | "danger" | "subtle";

/* The looks live in globals.css, where each has a glass and a classic version. */
const BTN: Record<BtnTone, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  subtle: "btn-subtle",
};

const BTN_BASE =
  "display press inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-pill px-(--btn-px) text-base font-bold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-40";

export function Button({
  tone = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone }) {
  return <button type="button" className={`${BTN_BASE} ${BTN[tone]} ${className}`} {...props} />;
}

export function LinkButton({
  tone = "primary",
  className = "",
  href,
  children,
}: {
  tone?: BtnTone;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BTN_BASE} ${BTN[tone]} ${className}`}>
      {children}
    </Link>
  );
}

export function Tag({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "oxide" | "chalk" | "amber" | "steel";
  className?: string;
}) {
  const tones = {
    muted: "border-bone/10 bg-bone/6 text-bone-2",
    oxide: "border-oxide/50 bg-oxide-deep/50 text-oxide-2",
    chalk: "border-chalk/40 bg-chalk-deep/70 text-chalk",
    amber: "border-amber/50 bg-amber-deep/70 text-amber",
    steel: "border-steel/40 bg-steel-deep/70 text-steel",
  };
  return (
    <span
      className={`display inline-flex items-center rounded-pill border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`glass animate-pulse ${className}`} aria-hidden />;
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

/**
 * A segmented control: a recessed track with a knob that slides to the chosen
 * segment. Segments share the width equally so the knob can be placed with
 * arithmetic rather than measurement. Under glass the knob is lit glass; on the
 * classic surface it is the accent fill the original tabs had.
 *
 * `role` picks the semantics: a radiogroup for a setting, a tablist for a view.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  role = "radiogroup",
  size = "md",
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly SegmentOption<T>[];
  label: string;
  role?: "radiogroup" | "tablist";
  size?: "sm" | "md";
  className?: string;
}) {
  const n = options.length;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const itemRole = role === "tablist" ? "tab" : "radio";
  const height = size === "sm" ? "h-9 text-sm" : "h-11 text-base";
  return (
    <div
      role={role}
      aria-label={label}
      className={`seg grid auto-cols-fr grid-flow-col ${className}`}
    >
      <span
        aria-hidden
        className="seg-knob"
        style={{
          left: `calc(0.25rem + ${index} * (100% - 0.5rem) / ${n})`,
          width: `calc((100% - 0.5rem) / ${n})`,
        }}
      />
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role={itemRole}
            aria-checked={itemRole === "radio" ? selected : undefined}
            aria-selected={itemRole === "tab" ? selected : undefined}
            data-selected={selected}
            onClick={() => onChange(o.value)}
            className={`seg-item display px-3 font-bold uppercase tracking-[0.12em] ${height}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
