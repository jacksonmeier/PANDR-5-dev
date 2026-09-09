import type { RirTarget } from "@/lib/types";
import { RIR_META, anchorIndex } from "@/lib/rir";

/**
 * The RIR staircase as literal steps: each chip sits a little lower than the
 * last, the anchor set is underlined in oxide, and a beyond-failure finisher
 * is hazard-striped.
 */
export function RirChips({
  rir,
  size = "md",
  highlight,
}: {
  rir: readonly RirTarget[];
  size?: "sm" | "md";
  /** Index to emphasise, e.g. the set currently being logged. */
  highlight?: number;
}) {
  const ai = anchorIndex(rir);
  const n = rir.length;
  const chip = size === "sm" ? "h-6 min-w-7 px-1.5 text-[11px]" : "h-8 min-w-9 px-2 text-sm";
  return (
    <ol className="flex items-start gap-1" aria-label="RIR per set">
      {rir.map((t, i) => {
        const meta = RIR_META[t];
        const isAnchor = i === ai;
        const step = n > 1 ? (i / (n - 1)) * (size === "sm" ? 4 : 6) : 0;
        return (
          <li
            key={i}
            className="flex flex-col items-center gap-0.5"
            style={{ marginTop: step }}
            aria-label={`Set ${i + 1}: ${meta.label} RIR${isAnchor ? ", anchor" : ""}${meta.beyondFailure ? ", beyond failure" : ""}`}
          >
            <span
              className={[
                "num inline-flex items-center justify-center rounded border font-semibold",
                chip,
                meta.beyondFailure
                  ? "hazard border-amber/60 text-amber"
                  : highlight === i
                    ? "border-oxide bg-oxide-deep/40 text-bone"
                    : "border-line-2 bg-ink-3 text-bone-2",
              ].join(" ")}
            >
              {meta.label}
            </span>
            <span
              className={[
                "h-0.5 w-full rounded-full",
                isAnchor ? "bg-oxide" : "bg-transparent",
              ].join(" ")}
              aria-hidden
            />
          </li>
        );
      })}
    </ol>
  );
}
