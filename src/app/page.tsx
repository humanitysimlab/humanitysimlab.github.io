import Link from "next/link";
import { VersionShell } from "@/components/VersionShell";
import {
  SITE,
  getExperiments,
  isPublished,
  timecode,
  watchUrl,
} from "@/lib/release";

export default function HomePage() {
  const experiments = getExperiments();

  return (
    <VersionShell v={1} home="/">
      <p className="mb-12 max-w-[62ch] text-muted">{SITE.description}</p>

      <div>
        {experiments.map((exp) => {
          const num = String(exp.no).padStart(2, "0");

          if (!isPublished(exp)) {
            return (
              <article
                key={exp.slug}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-5 text-muted"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px]">{num}</span>
                  <Link
                    href={`/experiments/${exp.slug}`}
                    className="no-underline hover:underline"
                  >
                    {exp.title}
                  </Link>
                </div>
                <span className="text-[14px]">{exp.dateLabel}</span>
              </article>
            );
          }

          return (
            <article
              key={exp.slug}
              className="border-t border-line py-7 first:pt-7"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="flex items-baseline gap-3 text-[17px] font-semibold">
                  <span className="font-mono text-[12px] font-normal text-muted">
                    {num}
                  </span>
                  <Link
                    href={`/experiments/${exp.slug}`}
                    className="no-underline hover:underline"
                  >
                    {exp.title}
                  </Link>
                </h2>
                <p className="text-[14px] text-muted">
                  {exp.dateLabel} · {exp.duration}
                </p>
              </div>

              <p className="mt-2 max-w-[68ch]">{exp.finding}</p>

              {/* 4 sequential film frames: start → rule → break → result */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {exp.frames.map((frame, i) => (
                  <figure key={i} className="m-0">
                    <a
                      href={watchUrl(exp, frame.t)}
                      target="_blank"
                      rel="noreferrer"
                      className="block no-underline"
                    >
                      <img
                        src={frame.src}
                        alt={frame.alt}
                        width={960}
                        height={540}
                        loading={exp.no <= 2 ? "eager" : "lazy"}
                        className="block h-auto w-full"
                      />
                      <figcaption className="mt-1.5 font-mono text-[12px] text-muted">
                        {timecode(frame.t)}
                      </figcaption>
                    </a>
                  </figure>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[14px] text-muted">
                <Link href={`/experiments/${exp.slug}`}>
                  Rules &amp; sources
                </Link>
                <a href={exp.codePath}>Code ({exp.codeLines} lines)</a>
                <a href={watchUrl(exp)} target="_blank" rel="noreferrer">
                  Watch on YouTube
                </a>
                {exp.simulatorId && (
                  <Link href={`/experiments/${exp.slug}#try-it`}>Try it</Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </VersionShell>
  );
}
