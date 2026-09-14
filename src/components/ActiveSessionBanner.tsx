"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDay } from "@/data/program";
import { loggedSetCount } from "@/lib/active";
import { useStore } from "@/lib/store";
import { Elapsed } from "./Elapsed";

/**
 * The thread back to a workout in progress.
 *
 * It rides above every page, because the whole point of a live session is that
 * you can wander off to Volume, Program, or out of the app entirely, and still
 * find your way back to the set you were on. It steps aside on the screens that
 * already say it louder: home, history, and the session's own page.
 */
export function ActiveSessionBanner() {
  const hydrated = useStore((s) => s._hydrated);
  const active = useStore((s) => s.active);
  const pathname = usePathname() ?? "/";

  if (!hydrated || !active) return null;

  const day = getDay(active.dayId);
  if (!day) return null;

  const href = `/workout/${active.dayId}/`;
  if (pathname === "/" || pathname === "/history/" || pathname.startsWith(href)) return null;

  const done = loggedSetCount(active.logs);
  const total = day.slots.reduce((n, s) => n + s.sets, 0);

  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-40 -mx-1 mt-3 px-1">
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-md border border-amber/60 bg-amber-deep/80 px-3 py-2 backdrop-blur transition-colors hover:border-amber"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber" aria-hidden />
          <span className="display truncate text-sm font-bold uppercase tracking-[0.14em] text-amber">
            {day.shortLabel} in progress
          </span>
          <span className="num shrink-0 text-xs text-bone-2">
            <Elapsed since={active.startedAt} /> · {done}/{total} sets
          </span>
        </span>
        <span className="display shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-bone">
          Resume →
        </span>
      </Link>
    </div>
  );
}
