import type { Metadata } from "next";
import Link from "next/link";
import {
  CHANGELOG,
  LOGGING_NOTES,
  MODEL_NAME,
  POST_BODY,
  POST_INTRO,
  POST_SOURCE_URL,
  POST_TITLE,
} from "@/data/post";
import { PROGRAM_VERSION } from "@/data/program";
import { Cited } from "@/components/Cited";
import { Card, Eyebrow, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="From the author's post on r/Biohackers"
        title={
          <>
            About the <span className="text-oxide">model</span>
          </>
        }
        lede={<span className="italic">{POST_TITLE}</span>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <article className="grid gap-6">
          <Card className="reveal p-5">
            <Eyebrow>The name</Eyebrow>
            <p className="display mt-1 text-2xl font-bold leading-tight tracking-tight">{MODEL_NAME}</p>
          </Card>

          <section className="grid gap-4 text-sm leading-relaxed text-bone-2">
            {POST_INTRO.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>

          <section className="grid gap-4 border-l-2 border-oxide pl-4 text-[15px] leading-relaxed">
            {POST_BODY.map((p, i) => (
              <Cited key={i} text={p} />
            ))}
          </section>

          <Card className="reveal grid gap-3 p-5" style={{ animationDelay: "120ms" }}>
            <Eyebrow>How to log</Eyebrow>
            {LOGGING_NOTES.map((p, i) => (
              <Cited key={i} text={p} className="text-sm leading-relaxed text-bone-2" />
            ))}
            <p className="text-xs text-bone-3">
              This app logs every set so volume is exact, but the load stays one value per exercise and
              progression still keys off the anchor set, exactly as above.
            </p>
          </Card>
        </article>

        <aside className="grid content-start gap-4">
          <Card className="reveal p-5" style={{ animationDelay: "80ms" }}>
            <Eyebrow>Source</Eyebrow>
            <ul className="mt-2 grid gap-2 text-sm">
              <li>
                <a href={POST_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-steel hover:underline">
                  Reddit post ↗
                </a>
              </li>
              <li>
                <Link href="/research/" className="text-steel hover:underline">
                  18 research sources
                </Link>
              </li>
              <li>
                <Link href="/program/" className="text-steel hover:underline">
                  The program
                </Link>
              </li>
            </ul>
          </Card>

          <Card className="reveal p-5" style={{ animationDelay: "160ms" }}>
            <Eyebrow>Changelog · v{PROGRAM_VERSION}</Eyebrow>
            <dl className="mt-2 grid gap-3 text-sm">
              {CHANGELOG.map((e) => (
                <div key={e.version}>
                  <dt className="num font-semibold text-bone">v{e.version}</dt>
                  <dd>
                    <ul className="mt-1 grid gap-1 text-bone-2">
                      {e.changes.map((c, i) => (
                        <li key={i} className="pl-3 text-xs leading-relaxed before:-ml-3 before:mr-1 before:content-['–']">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}
