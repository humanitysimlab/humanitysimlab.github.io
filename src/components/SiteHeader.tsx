import { BrandMark } from "./BrandMark";
import { SITE } from "@/data/experiments";

/** The top line: the name (plain, goes home), YouTube and Support text links. Nothing else. */
export function SiteHeader({ home, mark = false }: { home: string; mark?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-measure items-center justify-between gap-6 px-5 pt-6 pb-10 sm:px-6">
      <a href={home} className="flex items-center gap-2 font-semibold no-underline">
        {mark && <BrandMark size={20} />}
        <span>{SITE.name}</span>
      </a>
      <nav aria-label="Links" className="flex items-center gap-5">
        <a href={SITE.youtube} target="_blank" rel="noreferrer">
          YouTube
        </a>
        <a href={SITE.patreon} target="_blank" rel="noreferrer">
          Support
        </a>
      </nav>
    </header>
  );
}
