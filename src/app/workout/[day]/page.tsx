import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TRAINING_DAY_IDS, getDay, isTrainingDayId } from "@/data/program";
import { WorkoutScreen } from "@/components/WorkoutScreen";

export const dynamicParams = false;

export function generateStaticParams() {
  return TRAINING_DAY_IDS.map((day) => ({ day }));
}

type Params = { params: Promise<{ day: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { day } = await params;
  const def = getDay(day);
  return { title: def ? `Log ${def.label}` : "Log" };
}

export default async function WorkoutPage({ params }: Params) {
  const { day } = await params;
  if (!isTrainingDayId(day)) notFound();
  return (
    <Suspense fallback={null}>
      <WorkoutScreen day={day} />
    </Suspense>
  );
}
