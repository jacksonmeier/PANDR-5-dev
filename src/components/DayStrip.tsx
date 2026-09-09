import Link from "next/link";
import { PROGRAM } from "@/data/program";
import type { DayId } from "@/lib/types";
import type { DayStatus } from "@/lib/schedule";

const STATUS: Record<DayStatus, string> = {
  done: "border-chalk/50 bg-chalk-deep/50 text-chalk",
  next: "border-oxide bg-oxide-deep/40 text-bone pulse-ring animate-pulse-ring",
  upcoming: "border-line bg-ink-2 text-bone-3",
};

export function DayStrip({
  status,
  hrefFor,
}: {
  status: Record<DayId, DayStatus>;
  hrefFor?: (id: DayId) => string | null;
}) {
  return (
    <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Training cycle">
      {PROGRAM.map((day, i) => {
        const st = status[day.id];
        const href = hrefFor?.(day.id) ?? null;
        const inner = (
          <div
            className={[
              "flex h-16 min-w-0 flex-col items-center justify-center overflow-hidden rounded-md border px-0.5 transition-colors sm:h-20",
              STATUS[st],
              href ? "hover:border-oxide-2" : "",
            ].join(" ")}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="num text-[10px] opacity-70">{day.position}</span>
            <span className="display w-full truncate text-center text-[11px] font-bold uppercase tracking-normal sm:text-base sm:tracking-wider">
              {day.shortLabel}
            </span>
            <span className="text-[9px] uppercase tracking-widest opacity-70">
              {st === "done" ? "done" : st === "next" ? "next" : ""}
            </span>
          </div>
        );
        return (
          <li key={day.id} className="reveal min-w-0" style={{ animationDelay: `${i * 50}ms` }}>
            {href ? (
              <Link href={href} aria-label={`${day.label}, ${st}`}>
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
