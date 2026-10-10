"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
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

/**
 * Where the lit capsule sits behind the active desktop destination. The items
 * are not equal in width, so it is measured rather than computed, and measured
 * again when the fonts land or the bar resizes, since both move the items.
 */
function useKnob(nav: React.RefObject<HTMLElement | null>, pathname: string) {
  const [knob, setKnob] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector<HTMLElement>(".topnav-item.is-active");
      setKnob(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nav, pathname]);

  return knob;
}

export function Nav() {
  const pathname = usePathname() ?? "/";
  const topnav = useRef<HTMLElement>(null);
  const knob = useKnob(topnav, pathname);
  const tab = PRIMARY.findIndex((item) => isActive(pathname, item.href));

  return (
    <>
      <header className="topbar">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="display text-3xl font-extrabold leading-none tracking-tight text-bone">
            PANDR<span className="text-oxide">-5</span>
          </span>
          <span className="num text-[10px] text-bone-3">v{PROGRAM_VERSION}</span>
        </Link>

        {/* Desktop: every destination in one row. The look (a glass capsule, or
            the original bare links) is the surface's, in globals.css. */}
        <nav
          ref={topnav}
          className="topnav hidden items-center sm:flex"
          aria-label="Primary"
          data-knob={knob ? "" : undefined}
        >
          <span
            aria-hidden
            className="topnav-knob"
            data-ready={knob ? "" : undefined}
            style={knob ? { left: knob.left, width: knob.width } : undefined}
          />
          {[...PRIMARY, ...SECONDARY].map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`topnav-item display press ${active ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Phone: the two reading pages beside the wordmark. The rest live in the tab bar. */}
        <nav className="subnav flex sm:hidden" aria-label="Secondary">
          {SECONDARY.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`subnav-item display press ${active ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Phone tab bar. Under glass it floats, inset from the edges, with icons
          and a capsule that slides to the active tab; on the classic surface it
          sits on the page edge and the capsule is the original indicator line. */}
      <nav aria-label="Primary" className="tabbar sm:hidden">
        <ul className="tabbar-list">
          <span
            aria-hidden
            className="tabbar-knob"
            hidden={tab < 0}
            style={{ "--i": tab, "--n": PRIMARY.length } as CSSProperties}
          />
          {PRIMARY.map((item, i) => (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={i === tab ? "page" : undefined}
                className={`tabbar-item display press ${i === tab ? "is-active" : ""}`}
              >
                <Icon name={item.icon} className="tabbar-icon" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
