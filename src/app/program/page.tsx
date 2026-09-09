import type { Metadata } from "next";
import Link from "next/link";
import { PROGRAM, PROGRAM_VERSION } from "@/data/program";
import { ProgramDay } from "@/components/ProgramDay";
import { ActiveRestCard } from "@/components/ActiveRestCard";
import { RirChips } from "@/components/RirChips";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Program" };

export default function ProgramPage() {
  return (
    <>
      <PageHeader
        eyebrow={`PANDR-5 v${PROGRAM_VERSION} · 7-day cycle`}
        title={
          <>
            The <span className="text-oxide">program</span>
          </>
        }
        lede={
          <>
            Five training days, two active rest days, every muscle twice per cycle. One load across
            all sets. The chips show the RIR target per set; the underlined chip is the anchor set,
            the striped chip is a beyond-failure finisher. Read the reasoning on the{" "}
            <Link href="/about/" className="text-steel underline-offset-2 hover:underline">
              about page
            </Link>
            .
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-bone-3">
        <span className="flex items-center gap-2">
          <RirChips rir={["3", "2", "1", "0-1"]} size="sm" /> staircase, anchor last
        </span>
        <span className="flex items-center gap-2">
          <RirChips rir={["2", "0-1", "<0"]} size="sm" /> finisher, anchor before it
        </span>
      </div>

      <div className="grid gap-4">
        {PROGRAM.map((day, i) =>
          day.kind === "rest" ? (
            <ActiveRestCard key={day.id} dayId={day.id as "rest1" | "rest2"} position={day.position} />
          ) : (
            <ProgramDay key={day.id} day={day} index={i} />
          ),
        )}
      </div>
    </>
  );
}
