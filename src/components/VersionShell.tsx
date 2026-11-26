import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

export type Version = 1 | 2 | 3;

/**
 * Wraps every page: sets data-v (the version's colours, font and width from globals.css),
 * the shared header and a centred main column (max-w-measure). No footer, by design.
 * `before` is rendered above the header (the preview bar while the three versions are compared).
 * `home` is where the site name links: "/v1" during the preview, "/" once a version is chosen.
 */
export function VersionShell({
  v,
  home = `/v${v}`,
  before,
  children,
}: {
  v: Version;
  home?: string;
  before?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-v={v} className="flex flex-col">
      {before}
      <SiteHeader home={home} mark={v === 3} />
      <main className="mx-auto w-full max-w-measure flex-1 px-5 pb-20 sm:px-6">{children}</main>
      <footer className="mx-auto w-full max-w-measure px-5 pb-12 sm:px-6">
        <p className="m-0 border-t border-line pt-6 text-[13px] text-muted">
          Simulation code is{" "}
          <a href="https://github.com/humanitysimlab/humanitysimlab.github.io/blob/main/LICENSE">
            MIT licensed
          </a>{" "}
          — free to run, study and adapt. Films and visuals © 2026 Humanity Simulated.
        </p>
      </footer>
    </div>
  );
}

/** "?v=3" → 3. Anything else → 2 (the detail page's default). */
export function parseVersion(raw: string | string[] | undefined): Version {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return n === 1 || n === 3 ? n : 2;
}
