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
    default: "border-line bg-ink-2",
    raised: "border-line-2 bg-ink-3",
    accent: "border-oxide/60 bg-ink-3",
  };
  return (
    <section className={`rounded-lg border ${tones[tone]} ${className}`} style={style}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`eyebrow ${className}`}>{children}</span>;
}

type BtnTone = "primary" | "ghost" | "danger" | "subtle";

const BTN: Record<BtnTone, string> = {
  primary: "bg-oxide text-bone hover:bg-oxide-2 active:bg-oxide-deep",
  ghost: "border border-line-2 text-bone hover:bg-ink-3",
  danger: "border border-oxide/50 text-oxide-2 hover:bg-oxide-deep/40",
  subtle: "text-bone-2 hover:bg-ink-3 hover:text-bone",
};

const BTN_BASE =
  "display inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-base font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

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
    muted: "border-line-2 text-bone-2",
    oxide: "border-oxide/60 bg-oxide-deep/40 text-oxide-2",
    chalk: "border-chalk/40 bg-chalk-deep/60 text-chalk",
    amber: "border-amber/50 bg-amber-deep/60 text-amber",
    steel: "border-steel/40 bg-steel-deep/60 text-steel",
  };
  return (
    <span
      className={`display inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink-3 ${className}`} aria-hidden />;
}
