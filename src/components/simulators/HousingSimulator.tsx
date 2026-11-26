"use client";

import { useMemo, useState } from "react";
import { run, stats } from "@/simulations/ep09.js";
import { Chart, Controls, Readout, ResetLink, SimFrame, Slider, type ChartLabel } from "./SimFrame";

// EP09's own model (src/simulations/ep09.js = ep09/sim.js). Film run: seed 29, the market, no grant, no city homes.
const FILM = { seed: 29, grantK: 0, city: 0 };
const W = 600;
const H = 150;
const GUTTER = 96;

export function HousingSimulator() {
  const [seed, setSeed] = useState(FILM.seed);
  const [grantK, setGrantK] = useState(FILM.grantK);
  const [cityHomes, setCityHomes] = useState(FILM.city);

  const base = useMemo(() => run({ seed }), [seed]);
  const res = useMemo(
    () => run({ seed, grant: grantK > 0, GRANT: grantK * 1000, city: cityHomes > 0, CITY_N: cityHomes }),
    [seed, grantK, cityHomes],
  );
  const s = useMemo(() => stats(res), [res]);
  const changed = grantK > 0 || cityHomes > 0;

  const prices = [...base.years, ...res.years].map((y) => y.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const sx = (i: number, n: number) => (i / (n - 1)) * W;
  const sy = (p: number) => H - 6 - ((p - lo) / (hi - lo || 1)) * (H - 12);
  const path = (r: ReturnType<typeof run>) =>
    r.years.map((y, i) => `${i ? "L" : "M"}${sx(i, r.years.length).toFixed(1)} ${sy(y.price).toFixed(1)}`).join(" ");
  const endRes = res.years[res.years.length - 1].price;
  const endBase = base.years[base.years.length - 1].price;
  const k = (p: number) => `$${Math.round(p / 1000)}k`;

  // Direct labels in the right gutter: end price, and the market-alone line when a rule is on.
  const yEnd = sy(endRes);
  const yBase = sy(endBase);
  const apart = Math.abs(yEnd - yBase) < 14 ? (yEnd <= yBase ? -7 : 7) : 0;
  const labels: ChartLabel[] = [
    { y: yEnd + (changed ? apart : 0), text: k(endRes) },
  ];
  if (changed) labels.push({ y: yBase - apart, text: "market alone", muted: true });

  const setup = [
    grantK > 0 && `a $${grantK}k grant for young buyers in years 5–8`,
    cityHomes > 0 && `${cityHomes} city cost-rent home${cityHomes > 1 ? "s" : ""} a year`,
  ].filter(Boolean);

  return (
    <SimFrame>
      <Readout>
        {setup.length ? `With ${setup.join(" and ")}, ` : "In the market alone, "}
        {s.owners} of the 36 young own a home by year 12
        {s.inCity > 0 ? ` and ${s.inCity} live in city homes` : ""}; median rent takes {Math.round(s.share12 * 100)}% of pay.
      </Readout>

      <Chart w={W} h={H} gutter={GUTTER} ariaLabel="Price of a home, year 1 to 12" labels={labels} xStart="year 1" xEnd="year 12">
        {changed && (
          <path d={path(base)} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.25} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        )}
        <path d={path(res)} fill="none" stroke="currentColor" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
      </Chart>
      <p className="mt-1 mb-0 text-[0.85em] text-muted">Price of a home in today&apos;s dollars, {k(res.years[0].price)} in year 1.</p>

      <Controls>
        <Slider label="Grant for young buyers" value={grantK} display={grantK ? `$${grantK}k` : "none"} min={0} max={25} step={5} onChange={setGrantK} />
        <Slider label="City homes a year" value={cityHomes} display={String(cityHomes)} min={0} max={5} step={1} onChange={setCityHomes} />
        <Slider label="Seed" value={seed} display={String(seed)} min={1} max={40} step={1} onChange={setSeed} />
      </Controls>

      <ResetLink
        seed={FILM.seed}
        onClick={() => {
          setSeed(FILM.seed);
          setGrantK(FILM.grantK);
          setCityHomes(FILM.city);
        }}
      />
    </SimFrame>
  );
}
