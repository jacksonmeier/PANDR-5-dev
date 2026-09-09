"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROGRAM_VERSION } from "@/data/program";

const PRIMARY = [
  { href: "/", label: "Home" },
  { href: "/program/", label: "Program" },
  { href: "/volume/", label: "Volume" },
  { href: "/history/", label: "History" },
  { href: "/settings/", label: "Settings" },
] as const;

const SECONDARY = [
  { href: "/research/", label: "Research" },
  { href: "/about/", label: "About" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="flex items-end justify-between gap-6 border-b border-line py-5">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="display text-3xl font-extrabold leading-none tracking-tight text-bone">
            PANDR<span className="text-oxide">-5</span>
          </span>
          <span className="num text-[10px] text-bone-3">v{PROGRAM_VERSION}</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {[...PRIMARY, ...SECONDARY].map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "display rounded px-3 py-1.5 text-sm font-bold uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "bg-oxide text-on-accent"
                    : "text-bone-2 hover:bg-ink-3 hover:text-bone",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <nav className="flex gap-3 sm:hidden" aria-label="Secondary">
          {SECONDARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="display text-xs font-bold uppercase tracking-[0.14em] text-bone-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-2/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "display flex h-14 flex-col items-center justify-center text-[11px] font-bold uppercase tracking-[0.14em]",
                    active ? "text-oxide-2" : "text-bone-3",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mb-1 h-1 w-6 rounded-full transition-colors",
                      active ? "bg-oxide" : "bg-transparent",
                    ].join(" ")}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
