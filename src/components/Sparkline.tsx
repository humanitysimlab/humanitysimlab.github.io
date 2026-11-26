import type { Curve } from "@/lib/release";

/**
 * One real time series from the episode's own run (src/data/curves.json), drawn Tufte-style:
 * a single 1.25 px line in the text colour, a small dot at the end and the end value beside it.
 * No axes, no grid, no fill, no colour. The caption (CurveCaption) says what it measures and where it starts.
 */
export function Sparkline({
  curve,
  width = 140,
  height = 40,
  labelWidth = 60,
}: {
  curve: Curve;
  /** Plot width in px, without the end label. */
  width?: number;
  height?: number;
  /** Room to the right of the end dot for the value. */
  labelWidth?: number;
}) {
  const pts = curve.points;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  if (y1 === y0) {
    y0 -= 1;
    y1 += 1;
  }
  const pad = 3;
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0 || 1)) * (width - 2 * pad);
  const sy = (y: number) => height - pad - ((y - y0) / (y1 - y0)) * (height - 2 * pad);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join(" ");
  const [ex, ey] = pts[pts.length - 1];

  return (
    <svg
      width={width + labelWidth}
      height={height}
      viewBox={`0 0 ${width + labelWidth} ${height}`}
      role="img"
      aria-label={`${curve.what}: from ${startValue(curve)} to ${curve.end}`}
      className="block max-w-full overflow-visible"
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(ex)} cy={sy(ey)} r={1.75} fill="currentColor" />
      <text x={sx(ex) + 6} y={sy(ey)} dominantBaseline="middle" fontSize={13} fill="currentColor">
        {curve.end}
      </text>
    </svg>
  );
}

/** "Share of all money held by the two richest, day 0–100. Starts at 3.3%." */
export function CurveCaption({ curve, className = "" }: { curve: Curve; className?: string }) {
  const x0 = curve.points[0][0];
  return (
    <p className={`m-0 text-[13px] leading-snug text-muted ${className}`}>
      {curve.what}, {curve.x} {x0}–{curve.xMax}. Starts at {startValue(curve)}.
    </p>
  );
}

function startValue(curve: Curve): string {
  const v = curve.points[0][1];
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (curve.unit === "%") return `${sign}${a.toFixed(1).replace(/\.0$/, "")}%`;
  return `${sign}${Math.round(a).toLocaleString("en-US")}`;
}
