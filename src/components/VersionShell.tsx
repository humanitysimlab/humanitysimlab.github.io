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
    <div data-v={v}>
      {before}
      <SiteHeader home={home} mark={v === 3} />
      <main className="mx-auto w-full max-w-measure px-5 pb-24 sm:px-6">{children}</main>
    </div>
  );
}

/** "?v=3" → 3. Anything else → 2 (the detail page's default). */
export function parseVersion(raw: string | string[] | undefined): Version {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return n === 1 || n === 3 ? n : 2;
}
