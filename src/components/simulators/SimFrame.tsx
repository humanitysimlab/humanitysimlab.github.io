import type { ReactNode } from "react";

/**
 * Shared, deliberately plain parts of the three simulators. Colours come from the page's version
 * (currentColor, text-muted, border-line), so the same simulator works on white (v1, v2) and navy (v3).
 * No cards, no pills, no KPI numbers: a 1 px frame, one sentence that reads the run, a chart, native controls.
 */
export function SimFrame({ children }: { children: ReactNode }) {
  return <div className="border border-line p-4 sm:p-5">{children}</div>;
}

/** The run, read out as one sentence. aria-live so screen readers hear the change. */
export function Readout({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 tabular-nums" aria-live="polite">
      {children}
    </p>
  );
}

export function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between gap-3 text-[0.85em]">
        <span>{label}</span>
        <span className="tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full"
        style={{ accentColor: "currentColor" }}
      />
    </label>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">{children}</div>;
}

export function ResetLink({ seed, onClick }: { seed: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 cursor-pointer border-0 bg-transparent p-0 text-[0.85em] text-muted underline underline-offset-[3px]"
    >
      Back to the film&apos;s run (seed {seed})
    </button>
  );
}

export interface ChartLabel {
  /** Vertical position in chart units (0 = top, h = bottom). */
  y: number;
  text: string;
  muted?: boolean;
  /** Horizontal position in chart units for a label inside the plot; omit to put it in the right gutter. */
  x?: number;
}

/**
 * A plot whose lines stretch to the width (SVG, preserveAspectRatio none, strokes stay 1–2 px with
 * vector-effect) while every label is HTML, so text stays 12 px on a phone and on a desktop alike.
 * Children draw in a w × h box; `h` is also the CSS height in px, so y-nudges are in pixels.
 */
export function Chart({
  w,
  h,
  gutter = 0,
  labels = [],
  xStart,
  xEnd,
  ariaLabel,
  children,
}: {
  w: number;
  h: number;
  gutter?: number;
  labels?: ChartLabel[];
  xStart?: string;
  xEnd?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const plot = `calc(100% - ${gutter}px)`;
  return (
    <div className="mt-4">
      <div className="relative" style={{ height: h }}>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="absolute top-0 left-0 block h-full overflow-visible"
          style={{ width: plot }}
          role="img"
          aria-label={ariaLabel}
        >
          {children}
        </svg>
        {labels.map((l, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute text-[12px] leading-none whitespace-nowrap ${l.muted ? "text-muted" : ""}`}
            style={{
              top: `${(l.y / h) * 100}%`,
              transform: "translateY(-50%)",
              left: l.x === undefined ? `calc(100% - ${gutter}px + 6px)` : `calc(${plot} * ${l.x / w})`,
            }}
          >
            {l.text}
          </span>
        ))}
      </div>
      {(xStart || xEnd) && (
        <div className="mt-1 flex justify-between text-[12px] leading-none text-muted" style={{ marginRight: gutter }}>
          <span>{xStart}</span>
          <span>{xEnd}</span>
        </div>
      )}
    </div>
  );
}
