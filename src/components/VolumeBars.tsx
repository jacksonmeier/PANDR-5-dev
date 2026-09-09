import type { Muscle, MuscleGroup } from "@/lib/types";
import type { MuscleTotals } from "@/lib/volume";
import {
  GROUP_NAMES,
  GROUP_ORDER,
  GROUP_TARGETS,
  MUSCLE_ORDER,
  MUSCLE_TARGETS,
  OPTIMAL_RANGE,
} from "@/data/targets";

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

/** One muscle: value against the sheet's target, with the 10-20 band shaded. */
export function VolumeBar({
  muscle,
  value,
  compact = false,
}: {
  muscle: Muscle;
  value: number;
  compact?: boolean;
}) {
  const t = MUSCLE_TARGETS[muscle];
  const scale = Math.max(OPTIMAL_RANGE.hi + 5, t.total, value) * 1.02;
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  const reached = t.total > 0 ? value / t.total : 0;
  const tone =
    reached >= 0.999 ? "bg-chalk" : reached >= 0.5 ? "bg-steel" : "bg-steel/60";
  return (
    <div className={compact ? "grid gap-0.5" : "grid gap-1"}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className={compact ? "text-xs text-bone-2" : "text-bone"}>{t.name}</span>
        <span className="num text-xs text-bone-2">
          <span className="text-bone">{fmt(value)}</span>
          <span className="text-bone-3"> / {fmt(t.total)}</span>
        </span>
      </div>
      <div
        className={`relative w-full overflow-hidden rounded-sm bg-ink ${compact ? "h-2" : "h-3"}`}
        role="img"
        aria-label={`${t.name}: ${fmt(value)} of ${fmt(t.total)} effective sets`}
      >
        <div
          className="absolute inset-y-0 bg-bone/5"
          style={{ left: pct(OPTIMAL_RANGE.lo), width: pct(OPTIMAL_RANGE.hi - OPTIMAL_RANGE.lo) }}
          aria-hidden
        />
        <div className={`absolute inset-y-0 left-0 rounded-sm ${tone} transition-[width] duration-500`} style={{ width: pct(value) }} />
        {t.total > 0 && (
          <div className="absolute inset-y-0 w-0.5 bg-oxide" style={{ left: pct(t.total) }} aria-hidden />
        )}
      </div>
    </div>
  );
}

export function GroupSection({
  group,
  totals,
  compact = false,
}: {
  group: MuscleGroup;
  totals: MuscleTotals;
  compact?: boolean;
}) {
  const muscles = MUSCLE_ORDER.filter((m) => MUSCLE_TARGETS[m].group === group);
  const sum = muscles.reduce((n, m) => n + totals[m], 0);
  const target = GROUP_TARGETS[group];
  return (
    <section className="grid gap-3">
      <header className="flex items-baseline justify-between border-b border-line pb-1">
        <h3 className="display text-2xl font-bold uppercase tracking-tight">{GROUP_NAMES[group]}</h3>
        <span className="num text-sm">
          <span className="text-bone">{fmt(sum)}</span>
          <span className="text-bone-3"> / {fmt(target)}</span>
        </span>
      </header>
      <div className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"}>
        {muscles.map((m) => (
          <VolumeBar key={m} muscle={m} value={totals[m]} compact={compact} />
        ))}
      </div>
    </section>
  );
}

export function AllGroups({ totals, compact = false }: { totals: MuscleTotals; compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-5" : "grid gap-8"}>
      {GROUP_ORDER.map((g) => (
        <GroupSection key={g} group={g} totals={totals} compact={compact} />
      ))}
    </div>
  );
}

/** Whole-group bars only, for the home page. */
export function GroupOverview({ totals }: { totals: MuscleTotals }) {
  return (
    <div className="grid gap-2">
      {GROUP_ORDER.map((g) => {
        const muscles = MUSCLE_ORDER.filter((m) => MUSCLE_TARGETS[m].group === g);
        const sum = muscles.reduce((n, m) => n + totals[m], 0);
        const target = GROUP_TARGETS[g];
        const pct = Math.min(100, target > 0 ? (sum / target) * 100 : 0);
        return (
          <div key={g} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3">
            <span className="display text-sm font-bold uppercase tracking-wider text-bone-2">
              {GROUP_NAMES[g]}
            </span>
            <div className="h-2 overflow-hidden rounded-sm bg-ink">
              <div className={`h-full rounded-sm ${pct >= 99.9 ? "bg-chalk" : "bg-steel"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="num text-xs text-bone-2">
              {fmt(sum)}<span className="text-bone-3">/{fmt(target)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
