import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  formatN,
  getAllSlugs,
  getCurve,
  getExperiment,
  isPublished,
  timecode,
  watchUrl,
  type PublishedExperiment,
} from "@/lib/release";
import { VersionShell } from "@/components/VersionShell";
import { Sparkline, CurveCaption } from "@/components/Sparkline";
import { Simulator } from "@/components/simulators/Simulator";

// One shared experiment page, Distill order: question → model → result → try it → chapters → sources → code.
// Release gate: before releaseAt only number, title and date exist here (src/lib/release.ts).

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  if (!exp) return {};
  return {
    title: exp.title,
    description: isPublished(exp) ? exp.finding : `Comes out ${exp.dateLabel}.`,
  };
}

function readCode(codePath: string): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "content", codePath), "utf8");
  } catch {
    return null;
  }
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-12 mb-2 text-[1em] leading-[inherit] font-semibold">
      {children}
    </h2>
  );
}

export default async function ExperimentPage({ params }: { params: Params }) {
  const exp = getExperiment((await params).slug);
  if (!exp) notFound();
  const back = "/";
  const num = String(exp.no).padStart(2, "0");

  if (!isPublished(exp)) {
    return (
      <VersionShell v={1} home="/">
        <article className="max-w-[640px]">
          <h1 className="m-0 text-[1em] leading-[inherit] font-semibold">
            <span className="font-normal text-muted tabular-nums">{num}</span> {exp.title}
          </h1>
          <p className="mt-1 text-muted">
            {exp.status === "upcoming" ? `Comes out ${exp.dateLabel}.` : "Date not set yet."}
          </p>
          <p className="mt-12">
            <a href={back}>All experiments</a>
          </p>
        </article>
      </VersionShell>
    );
  }

  return (
    <VersionShell v={1} home="/">
      <Article exp={exp} back={back} num={num} />
    </VersionShell>
  );
}

function Article({ exp, back, num }: { exp: PublishedExperiment; back: string; num: string }) {
  const curve = getCurve(exp);
  const code = readCode(exp.codePath);
  const file = exp.codePath.split("/").pop();

  return (
    <article className="max-w-[640px]">
      <header>
        <h1 className="m-0 text-[1em] leading-[inherit] font-semibold">
          <span className="font-normal text-muted tabular-nums">{num}</span> {exp.title}
        </h1>
        <p className="mt-1 mb-0 text-muted">
          {exp.dateLabel} · {exp.duration} · <a href={watchUrl(exp)}>Watch on YouTube</a>
        </p>
      </header>

      <H2>The question</H2>
      <p className="m-0">{exp.premise}</p>

      <H2>The model</H2>
      <ol className="m-0 list-decimal space-y-1 pl-6">
        {exp.assumptions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ol>
      <p className="mt-3 mb-0 text-muted">
        N = {formatN(exp.n)} · {exp.horizon} · seed {exp.seed}. {exp.seedNote}
      </p>

      <H2>The result</H2>
      <p className="m-0">
        <strong className="font-semibold">{exp.worldA.label}.</strong> {exp.worldA.summary}
      </p>
      <p className="mt-3 mb-0">
        <strong className="font-semibold">{exp.worldB.label}.</strong> {exp.worldB.summary}
      </p>
      {curve && (
        <figure className="mx-0 mt-6 mb-0">
          <Sparkline curve={curve} width={300} height={64} />
          <figcaption>
            <CurveCaption curve={curve} className="mt-2" />
          </figcaption>
        </figure>
      )}

      {exp.simulatorId && (
        <>
          <H2 id="try-it">Try it</H2>
          <p className="mt-0 mb-4 text-muted">
            The film's model, running in your browser. It starts at the film's run.
          </p>
          <Simulator id={exp.simulatorId} />
        </>
      )}

      <H2>Chapters</H2>
      <ol className="m-0 list-none p-0">
        {exp.chapters.map((c) => (
          <li key={c.t} className="grid grid-cols-[3.5rem_1fr]">
            <a href={watchUrl(exp, c.t)} className="tabular-nums">
              {timecode(c.t)}
            </a>
            <span>{c.label}</span>
          </li>
        ))}
      </ol>

      <H2>Sources</H2>
      <ol className="m-0 list-none space-y-3 p-0">
        {exp.sources.map((s) => (
          <li key={s.title}>
            {s.authors} ({s.year}). {s.url ? <a href={s.url}>{s.title}</a> : s.title}. {s.venue}
            {s.kind === "blog" ? " (blog)" : ""}.{s.note ? <span className="text-muted"> {s.note}</span> : null}
          </li>
        ))}
      </ol>

      <H2>Code</H2>
      <p className="m-0">
        <a href={exp.codePath}>{file}</a>, {exp.codeLines} lines. Every number in the film comes from this file, run
        with seed {exp.seed}.
      </p>
      {code && (
        <details className="mt-3">
          <summary className="cursor-pointer text-muted">Show the code</summary>
          <pre className="mt-3 overflow-x-auto border-t border-line pt-3 font-mono text-[12.5px] leading-[1.5]">
            {code}
          </pre>
        </details>
      )}

      <p className="mt-16 mb-0">
        <a href={back}>All experiments</a>
      </p>
    </article>
  );
}
