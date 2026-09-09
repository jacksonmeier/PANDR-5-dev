import Link from "next/link";
import { Fragment } from "react";

/** Renders text with inline [n] markers as links to the research page. */
export function Cited({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        const m = /^\[(\d+)\]$/.exec(part);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        return (
          <Link
            key={i}
            href={`/research/#ref-${m[1]}`}
            className="num mx-0.5 rounded bg-ink-3 px-1 text-[0.8em] text-steel hover:bg-steel-deep"
          >
            {m[1]}
          </Link>
        );
      })}
    </p>
  );
}
