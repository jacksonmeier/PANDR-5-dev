import type { Suggestion, Unit } from "@/lib/types";
import { formatLoad } from "@/lib/units";
import { Tag } from "./ui";

const LABEL: Record<Suggestion["action"], { text: string; tone: "chalk" | "oxide" | "muted" | "steel" | "amber" }> = {
  increase: { text: "Add load", tone: "chalk" },
  decrease: { text: "Reduce load", tone: "oxide" },
  hold: { text: "Hold", tone: "muted" },
  seed: { text: "Seeded", tone: "steel" },
  none: { text: "No history", tone: "muted" },
};

export function ProgressionBadge({
  suggestion,
  unit,
  compact = false,
  prefix,
}: {
  suggestion: Suggestion;
  unit: Unit;
  compact?: boolean;
  prefix?: string;
}) {
  const l = LABEL[suggestion.action];
  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "flex flex-col gap-1.5"}>
      <div className="flex flex-wrap items-center gap-2">
        {prefix && <span className="eyebrow">{prefix}</span>}
        <Tag tone={l.tone}>{l.text}</Tag>
        {suggestion.load !== null && (
          <span className="num text-sm font-semibold text-bone">
            {formatLoad(suggestion.load, unit)}
          </span>
        )}
      </div>
      {!compact && <p className="text-xs leading-relaxed text-bone-3">{suggestion.reason}</p>}
    </div>
  );
}
