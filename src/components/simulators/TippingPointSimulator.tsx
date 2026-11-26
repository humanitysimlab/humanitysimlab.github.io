"use client";

import { useMemo, useState } from "react";
import { run, network } from "@/simulations/ep06.js";
import { Chart, Controls, Readout, ResetLink, SimFrame, Slider } from "./SimFrame";

// EP06's own model (src/simulations/ep06.js = ep06/sim.js). Film run: seed 10, 10% believers at random, nobody checks.
const FILM = { seed: 10, committed: 10, hubs: false, check: 0 };
const N = 1000;
const W = 600;
const H = 170;
const GUTTER = 104;

export function TippingPointSimulator() {
  const [committedPct, setCommittedPct] = useState(FILM.committed);
  const [hubs, setHubs] = useState(FILM.hubs);
  const [checkPct, setCheckPct] = useState(FILM.check);
  const seed = FILM.seed;

  const adj = useMemo(() => network(seed, N, 8, "ba"), [seed]);
  const res = useMemo(
    () => run({ seed, N, K: 8, days: 365, p: committedPct / 100, hubs, check: checkPct / 100, adj }),
    [seed, committedPct, hubs, checkPct, adj],
  );

  const Y = res.Y;
  const last = Y[Y.length - 1];
  const peak = Math.max(...Y.map((s) => s.rumor));
  const sx = (day: number) => (day / 365) * W;
  const sy = (n: number) => H - 6 - (n / N) * (H - 12);
  const path = (key: "rumor" | "truth") =>
    Y.filter((_, i) => i % 3 === 0 || i === Y.length - 1)
      .map((s, i) => `${i ? "L" : "M"}${sx(s.day).toFixed(1)} ${sy(s[key]).toFixed(1)}`)
      .join(" ");

  // Direct labels at the line ends; nudge apart if they would overlap.
  let yLie = sy(last.rumor);
  let yTruth = sy(last.truth);
  if (Math.abs(yLie - yTruth) < 14) {
    const mid = (yLie + yTruth) / 2;
    yLie = yLie <= yTruth ? mid - 7 : mid + 7;
    yTruth = yLie <= mid ? mid + 7 : mid - 7;
  }

  const who = `${committedPct}% committed believers ${hubs ? "on the best-connected people" : "placed at random"}${
    checkPct ? `, ${checkPct}% check the rumor first` : ""
  }`;
  const outcome =
    res.allDay !== -1
      ? `the whole island believes the lie by day ${res.allDay}.`
      : `the lie peaks at ${Math.round(peak / 10)}% and ends the year at ${Math.round(last.rumor / 10)}%.`;

  return (
    <SimFrame>
      <Readout>
        {who}: {outcome}
      </Readout>

      <Chart
        w={W}
        h={H}
        gutter={GUTTER}
        ariaLabel="People who believe the lie and people who know the truth, day 0 to 365"
        labels={[
          { y: yLie, text: "believe the lie" },
          { y: yTruth, text: "know the truth", muted: true },
        ]}
        xStart="day 0"
        xEnd="day 365"
      >
        <path d={path("truth")} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
        <path d={path("rumor")} fill="none" stroke="currentColor" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
      </Chart>

      <Controls>
        <Slider label="Committed believers" value={committedPct} display={`${committedPct}%`} min={5} max={15} step={1} onChange={setCommittedPct} />
        <Slider label="Check the rumor first" value={checkPct} display={`${checkPct}%`} min={0} max={15} step={1} onChange={setCheckPct} />
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="p-0 text-[0.85em]">Believers placed</legend>
          <label className="mt-1 flex items-center gap-2 text-[0.85em]">
            <input type="radio" name="placement" checked={!hubs} onChange={() => setHubs(false)} style={{ accentColor: "currentColor" }} />
            at random
          </label>
          <label className="flex items-center gap-2 text-[0.85em]">
            <input type="radio" name="placement" checked={hubs} onChange={() => setHubs(true)} style={{ accentColor: "currentColor" }} />
            on the best-connected people
          </label>
        </fieldset>
      </Controls>

      <ResetLink
        seed={FILM.seed}
        onClick={() => {
          setCommittedPct(FILM.committed);
          setHubs(FILM.hubs);
          setCheckPct(FILM.check);
        }}
      />
    </SimFrame>
  );
}
