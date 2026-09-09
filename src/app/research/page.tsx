import type { Metadata } from "next";
import { RESEARCH, RESEARCH_NOTE, pubmedUrl } from "@/data/research";
import { Card, PageHeader, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "Research" };

function evidenceTone(e: string): "chalk" | "steel" | "amber" | "muted" {
  const s = e.toLowerCase();
  if (s.startsWith("direct")) return "chalk";
  if (s.includes("systematic") || s.includes("meta")) return "steel";
  if (s.includes("exploratory") || s.includes("narrow")) return "amber";
  return "muted";
}

export default function ResearchPage() {
  return (
    <>
      <PageHeader
        eyebrow={`${RESEARCH.length} sources · all PubMed`}
        title={
          <>
            Research <span className="text-oxide">sources</span>
          </>
        }
        lede={RESEARCH_NOTE}
      />
      <ol className="grid gap-3">
        {RESEARCH.map((c, i) => (
          <li key={c.ref} id={`ref-${c.ref}`} className="scroll-mt-24">
            <Card className="reveal grid gap-3 p-5 sm:grid-cols-[3.5rem_1fr]" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <span className="display text-4xl font-extrabold leading-none text-oxide">
                {String(c.ref).padStart(2, "0")}
              </span>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="display text-2xl font-bold leading-tight tracking-tight">{c.topic}</h2>
                  <Tag tone={evidenceTone(c.evidence)}>{c.evidence}</Tag>
                </div>
                <p className="text-sm text-bone-2">{c.citation}</p>
                <p className="text-sm leading-relaxed text-bone">
                  <span className="eyebrow mr-2">Supports</span>
                  {c.supports}
                </p>
                <a
                  href={pubmedUrl(c.pmid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="num w-fit text-xs text-steel hover:underline"
                >
                  PubMed {c.pmid} ↗
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
