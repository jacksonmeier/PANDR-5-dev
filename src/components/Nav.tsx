"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PROGRAM_VERSION } from "@/data/program";

const PRIMARY = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/program/", label: "Program", icon: "program" },
  { href: "/volume/", label: "Volume", icon: "volume" },
  { href: "/history/", label: "History", icon: "history" },
  { href: "/settings/", label: "Settings", icon: "settings" },
] as const;

const SECONDARY = [
  { href: "/research/", label: "Research" },
  { href: "/about/", label: "About" },
] as const;

type IconName = (typeof PRIMARY)[number]["icon"];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

/** Tab glyphs. Stroked, rounded, drawn on a 24-point grid like SF Symbols. */
function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H14.5V15h-5v5.5H5.5A1.5 1.5 0 0 1 4 19z" />
    ),
    program: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
        <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
      </>
    ),
    volume: (
      <>
        <path d="M4 20h16" />
        <rect x="5.25" y="11" width="3.5" height="6.5" rx="1.25" />
        <rect x="10.25" y="5.5" width="3.5" height="12" rx="1.25" />
        <rect x="15.25" y="13.5" width="3.5" height="4" rx="1.25" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 7.75V12l3 2.25" />
      </>
    ),
    settings: (
      <>
        <path d="M3.5 7.5h8.5M18.5 7.5h2M3.5 16.5h3M12.5 16.5h8" />
        <circle cx="15" cy="7.5" r="2.5" />
        <circle cx="9.5" cy="16.5" r="2.5" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="flex items-center justify-between gap-6 py-5">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="display text-3xl font-extrabold leading-none tracking-tight text-bone">
            PANDR<span className="text-oxide">-5</span>
          </span>
          <span className="num text-[10px] text-bone-3">v{PROGRAM_VERSION}</span>
        </Link>

        {/* Desktop: one glass capsule holding every destination. */}
        <nav className="glass hidden items-center gap-0.5 rounded-full p-1 sm:flex" aria-label="Primary">
          {[...PRIMARY, ...SECONDARY].map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "display press rounded-full px-3.5 py-2 text-sm font-bold uppercase tracking-[0.14em]",
                  active
                    ? "glass-knob text-oxide-2"
                    : "text-bone-2 hover:bg-bone/8 hover:text-bone",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Phone: the two reading pages, as small pills. The rest live in the tab bar. */}
        <nav className="flex gap-1.5 sm:hidden" aria-label="Secondary">
          {SECONDARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "display press rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]",
                  active ? "glass-knob text-oxide-2" : "glass-inset text-bone-2",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Phone: a floating glass tab bar, inset from the edges like iOS. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 sm:hidden"
      >
        <ul className="glass-raised grid h-[3.75rem] grid-cols-5 rounded-full p-1">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "display press flex h-full flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.12em]",
                    active ? "glass-knob text-oxide-2" : "text-bone-3",
                  ].join(" ")}
                >
                  <Icon name={item.icon} className="h-[22px] w-[22px]" />
                  <span className="leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
