import { ACTIVE_REST } from "@/data/post";
import { Card, Eyebrow } from "./ui";
import type { ReactNode } from "react";

export function ActiveRestCard({
  dayId,
  position,
  action,
}: {
  dayId: "rest1" | "rest2";
  position: number;
  action?: ReactNode;
}) {
  const t = ACTIVE_REST[dayId];
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Day {position}</Eyebrow>
          <h2 className="display mt-1 text-3xl font-extrabold uppercase tracking-tight">
            Active Rest
          </h2>
        </div>
        {action}
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Row label="Decision rule">{t.decisionRule}</Row>
        <Row label="Otherwise">{t.otherwise}</Row>
        <Row label="Nutrition">{t.nutrition}</Row>
        <Row label="Sleep">{t.sleep}</Row>
        <Row label="Guardrails">{t.guardrails}</Row>
        {t.weeklyCheck && (
          <Row label="Weekly check" tone="amber">
            {t.weeklyCheck}
          </Row>
        )}
      </dl>
    </Card>
  );
}

function Row({
  label,
  children,
  tone,
}: {
  label: string;
  children: ReactNode;
  tone?: "amber";
}) {
  return (
    <div className={`rounded-md border p-3 ${tone === "amber" ? "border-amber/40 bg-amber-deep/30 sm:col-span-2" : "border-line bg-ink"}`}>
      <dt className="eyebrow mb-1">{label}</dt>
      <dd className="text-bone-2">{children}</dd>
    </div>
  );
}
