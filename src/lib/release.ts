import "server-only";
import { EXPERIMENTS, SITE, type Experiment } from "@/data/experiments";
import curvesJson from "@/data/curves.json";

/**
 * Release gate. The only way pages should read experiments.
 *
 * Before `releaseAt`, an experiment is reduced to number, title and date: no finding, rule, result,
 * frames, sources or code reach the HTML. The check runs on the server at render time, so every page
 * that lists or shows experiments must declare (literal value, Next.js needs it statically):
 *
 *     export const revalidate = 300;
 *
 * Then a scheduled episode goes public at most ~5 minutes after its time, with no rebuild.
 */

export type Status = "published" | "upcoming" | "unscheduled";

export type PublishedExperiment = Experiment & { status: "published"; dateLabel: string };

export type PendingExperiment = Pick<Experiment, "slug" | "ep" | "no" | "title" | "releaseAt"> & {
  status: "upcoming" | "unscheduled";
  /** "Nov 29" for a scheduled episode, "Date not set" otherwise. */
  dateLabel: string;
};

export type PublicExperiment = PublishedExperiment | PendingExperiment;

export interface Curve {
  /** What the line measures, one plain sentence. */
  what: string;
  /** x unit: "day" | "week" | "year". */
  x: string;
  xMax: number;
  unit: string;
  /** [x, y] pairs from the episode's own run (≤ 120 points). */
  points: [number, number][];
  /** Label for the end point, e.g. "75.4%". */
  end: string;
}

const curves = curvesJson as unknown as Record<string, Curve>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Nov 19, 2026" (with year) or "Nov 19". Dates are read in UTC; every release is 12:00–16:00 UTC. */
export function formatDate(iso: string, withYear = true): string {
  const d = new Date(iso);
  const s = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withYear ? `${s}, ${d.getUTCFullYear()}` : s;
}

function toPublic(e: Experiment, now: number): PublicExperiment {
  if (e.releaseAt && new Date(e.releaseAt).getTime() <= now) {
    return { ...e, status: "published", dateLabel: formatDate(e.releaseAt) };
  }
  return {
    slug: e.slug,
    ep: e.ep,
    no: e.no,
    title: e.title,
    releaseAt: e.releaseAt,
    status: e.releaseAt ? "upcoming" : "unscheduled",
    dateLabel: e.releaseAt ? formatDate(e.releaseAt, false) : "Date not set",
  };
}

/** All experiments in channel order (no 1 → 9), gated by date. */
export function getExperiments(now: number = Date.now()): PublicExperiment[] {
  return [...EXPERIMENTS].sort((a, b) => a.no - b.no).map((e) => toPublic(e, now));
}

/** One experiment by slug, gated by date. null if the slug does not exist. */
export function getExperiment(slug: string, now: number = Date.now()): PublicExperiment | null {
  const e = EXPERIMENTS.find((x) => x.slug === slug);
  return e ? toPublic(e, now) : null;
}

/** Every slug, for generateStaticParams. Pending pages render as "number · title · date" only. */
export function getAllSlugs(): string[] {
  return EXPERIMENTS.map((e) => e.slug);
}

export function isPublished(e: PublicExperiment): e is PublishedExperiment {
  return e.status === "published";
}

/** True once episode folder number `ep` (1–9) is out. Gates /code/* and /frames/* (route handlers). */
export function isEpisodePublic(ep: number, now: number = Date.now()): boolean {
  const e = EXPERIMENTS.find((x) => x.ep === ep);
  return !!e?.releaseAt && new Date(e.releaseAt).getTime() <= now;
}

/** The real time series for a published experiment, or null (EP07 has none, by design). */
export function getCurve(e: PublishedExperiment): Curve | null {
  return e.curve ? curves[e.curve] ?? null : null;
}

/** YouTube link at `t` seconds. Falls back to the channel while `youtubeId` is null. */
export function watchUrl(e: PublishedExperiment, t?: number): string {
  if (!e.youtubeId) return SITE.youtube;
  return `https://www.youtube.com/watch?v=${e.youtubeId}${t ? `&t=${Math.floor(t)}s` : ""}`;
}

/** 113 → "1:53" (frame and chapter timecodes). */
export function timecode(t: number): string {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** "5,000" */
export const formatN = (n: number): string => n.toLocaleString("en-US");

export { SITE };
