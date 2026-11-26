"use client";

import { useMemo, useState } from "react";
import { run, share, below } from "@/simulations/ep01.js";
import { Chart, Controls, Readout, ResetLink, SimFrame, Slider } from "./SimFrame";

// EP01's own model (src/simulations/ep01.js = ep01/sim.js). Film run: seed 166, no sharing, day 100.
const FILM = { seed: 166, tax: 0, day: 100 };

export function WealthSimulator() {
  const [seed, setSeed] = useState(FILM.seed);
  const [taxPct, setTaxPct] = useState(FILM.tax);
  const [day, setDay] = useState(FILM.day);

  const res = useMemo(() => run({ seed, N: 60, days: 200, tax: taxPct / 100, keepTrades: 0 }), [seed, taxPct]);

  const w = res.days[day];
  const sorted = useMemo(() => [...w].sort((a, b) => b - a), [w]);
  const top2 = share(w, 2) * 100;
  const broke = below(w, 35);
  const maxBar = Math.max(250, sorted[0] ?? 250);
  const H = 150;
  const y100 = H - (100 / maxBar) * (H - 10);

  return (
    <SimFrame>
      <Readout>
        {taxPct > 0 ? `With ${taxPct.toFixed(1)}% of all money shared each day, on` : "On"} day {day} the two richest
        hold {top2.toFixed(1)}% of all money, and {broke} of 60 have less than $35.
      </Readout>

      <Chart
        w={600}
        h={H}
        ariaLabel={`Money of all 60 people on day ${day}, richest on the left`}
        labels={[{ x: 300, y: y100 - 9, text: "$100 each at the start", muted: true }]}
      >
        <line x1="0" x2="600" y1={y100} y2={y100} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        {sorted.map((val, i) => {
          const h = Math.max(3, (val / maxBar) * (H - 10)); // every one of the 60 stays visible
          const op = i < 2 ? 1 : val < 35 ? 0.35 : 0.6;
          return <rect key={i} x={i * 10 + 1} y={H - h} width={7.5} height={h} fill="currentColor" fillOpacity={op} />;
        })}
      </Chart>
      <p className="mt-1 mb-0 text-[0.85em] text-muted">Each bar is one person, richest on the left.</p>

      <Controls>
        <Slider label="Shared each day" value={taxPct} display={`${taxPct.toFixed(1)}%`} min={0} max={3} step={0.1} onChange={setTaxPct} />
        <Slider label="Day" value={day} display={String(day)} min={0} max={200} step={1} onChange={setDay} />
        <Slider label="Seed" value={seed} display={String(seed)} min={1} max={300} step={1} onChange={setSeed} />
      </Controls>

      <ResetLink
        seed={FILM.seed}
        onClick={() => {
          setSeed(FILM.seed);
          setTaxPct(FILM.tax);
          setDay(FILM.day);
        }}
      />
    </SimFrame>
  );
}
