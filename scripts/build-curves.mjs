// Builds src/data/curves.json: one real time series per episode, computed by that episode's own sim.js
// at the episode's own seed (the same run the film narrates). No smoothing, no invented points.
// Run from the site folder:  node scripts/build-curves.mjs
// Episodes without one single time curve (EP07: a sequence of reigns) get no entry on purpose.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const EP = (n) => path.join(here, "..", "..", `ep0${n}`, "sim.js");
const load = async (n) => import(EP(n));
const thin = (arr, max = 120) => {
  if (arr.length <= max) return arr;
  const step = (arr.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)]);
};
const r = (x, d = 4) => +x.toFixed(d);
const out = {};

{ // EP01: share of all money held by the 2 richest, pure luck, seed 166, days 0–100
  const { run, share } = await load(1);
  const R = run({ seed: 166 });
  const ys = R.days.map((w) => share(w, 2));
  out.ep01 = { what: "Share of all money held by the two richest", x: "day", xMax: 100, unit: "%", points: thin(ys.map((y, i) => [i, r(y * 100, 2)])), end: `${(ys.at(-1) * 100).toFixed(1)}%` };
}
{ // EP02: share still single in the 70/30 app, seed 7, days 1–30
  const { run } = await load(2);
  const R = run({ seed: 7, ratio: 0.7 });
  const ys = [1, ...R.daily.map((d) => 1 - d.coupled)];
  out.ep02 = { what: "Share of app users still single", x: "day", xMax: 30, unit: "%", points: ys.map((y, i) => [i, r(y * 100, 2)]), end: `${Math.round(ys.at(-1) * 100)}%` };
}
{ // EP03: workers who cannot buy a basket, seed 6, weeks 1–52
  const { run } = await load(3);
  const W = run({ seed: 6 }).W.slice(0, 52);
  out.ep03 = { what: "Workers who cannot buy a food basket (of 55)", x: "week", xMax: 52, unit: "people", points: [[0, 0], ...W.map((w, i) => [i + 1, w.hungryWorkers])], end: `${W.at(-1).hungryWorkers} of 55` };
}
{ // EP04: skill of the 10 glowing workers vs everyone else (%), seed 9, years 1–20 (FACTS.md skillGapY20 = −5.5 %)
  const { run, summary } = await load(4);
  const A = run({ seed: 9 });
  const ys = A.Y.map((_, i) => { const s = summary(A, i); return (s.skillA / s.skillO - 1) * 100; });
  out.ep04 = { what: "Skill of the 10 glowing workers compared with everyone else", x: "year", xMax: 20, unit: "%", points: [[0, 0], ...ys.map((y, i) => [i + 1, r(y, 2)])], end: `${ys.at(-1).toFixed(1).replace("-", "−")}%` };
}
{ // EP05: island population, world A (no gossip), seed 16, years 0–500
  const { run } = await load(5);
  const Y = run({ seed: 16, G: 0 }).Y;
  out.ep05 = { what: "People living on the island without gossip", x: "year", xMax: 500, unit: "people", points: thin(Y.map((s) => [s.year, s.n])), end: `${Y.at(-1).n.toLocaleString("en-US")}` };
}
{ // EP06: share believing the lie with 10% committed believers, seed 10, days 0–365
  const { run, BASE } = await load(6);
  const Y = run({ seed: 10, p: 0.1 }).Y;
  out.ep06 = { what: "Share of the island believing the lie", x: "day", xMax: BASE.days, unit: "%", points: thin(Y.map((y) => [y.day, r((y.rumor / BASE.N) * 100, 2)])), end: `${Math.round((Y.at(-1).rumor / BASE.N) * 100)}%` };
}
{ // EP08: newcomers with zero friends, world A, seed 27 (BASE), evenings 1–100
  const { run } = await load(8);
  const days = run().days;
  out.ep08 = { what: "Newcomers with zero friends (of 60)", x: "day", xMax: 100, unit: "people", points: days.map((d, i) => [i + 1, d.zero]), end: `${days.at(-1).zero} of 60` };
}
{ // EP09: homes bought by the 36 young workers, cumulative, world A, seed 29, years 1–12
  const { run, stats } = await load(9);
  const A = run({ seed: 29 }); let c = 0;
  const pts = A.years.map((y, i) => { c += y.sold.filter((x) => x[1] === "young").length; return [i + 1, c]; });
  const s = stats(A);
  out.ep09 = { what: "Homes bought by the 36 young workers, cumulative (the builder finished " + s.built + ")", x: "year", xMax: A.years.length, unit: "homes", points: [[0, 0], ...pts], end: `${s.toYoung}` };
}

const file = path.join(here, "..", "src", "data", "curves.json");
writeFileSync(file, JSON.stringify(out) + "\n");
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(5), String(v.points.length).padStart(4), "pts  start", JSON.stringify(v.points[0]), " end", v.end, "|", v.what);
