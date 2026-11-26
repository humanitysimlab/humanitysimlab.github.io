// sim.js — EP04 "Pretty Privilege". Every narrated number comes from here (see FACTS.md, check.mjs).
// One town, one job ladder, one tick = one year, 20 years. 60 people; 10 of them are "slightly more attractive".
//  • Skill: 60 evenly spread values (1 ± SPREAD), shuffled onto the board. The 10 attractive Pips are picked so their
//    average skill is EXACTLY the town average (skill ranks 6j+2 / 6j+3 alternately). Same rules for everyone.
//  • Work: each year, performance = skill × luck (luck = 1 + LUCK·gaussian, floor 0.2).
//  • Judging: the town sees performance × VIS[job] (bigger jobs get bigger, more visible projects).
//    For the 10 attractive Pips every judgement is HALO (10 %) kinder. That is the only difference.
//  • Reputation = MEM × last year's reputation + (1 − MEM) × this year's judged work (year 1: the first impression).
//  • Jobs: every year the ladder is handed out by reputation (best reputation → best job), sizes LEVELS (bottom → top).
//    Yearly pay PAY ($ thousand) × the town's productivity (this year's output ÷ year 1's).
//  • Feedback: every year the 30 Pips whose work LOOKS weakest (judged work, job size taken out) are told what went
//    wrong; they practise and get better (skill + FB). The other 30 hear praise and learn nothing new.
//  • Money: everyone spends LIVE a year; savings earn R a year. Wealth starts at 0.
//  • Town output = Σ performance × IMPACT[job] (a boss's work moves more than a helper's).
//  • Option blind: judges never see faces (HALO = 0) — the one rule change.

export const BASE = {
  seed: 1, years: 20, N: 60, NA: 10, HALO: 0.10, SPREAD: 0.15, LUCK: 0.15, MEM: 0.75, FB: 0.02,
  LEVELS: [24, 18, 10, 6, 2], PAY: [30, 45, 70, 120, 250], VIS: [1, 1.15, 1.35, 1.6, 2], IMPACT: [1, 1.3, 1.8, 2.6, 4],
  LIVE: 28, R: 0.05,
};
export const JOBS = ['Helper', 'Worker', 'Lead', 'Manager', 'Boss'];

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function run(opt = {}) {
  const o = { ...BASE, blind: false, ...opt };
  const r = rng(o.seed), N = o.N;
  const gauss = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const ranks = Array.from({ length: N }, (_, k) => k);
  for (let i = N - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [ranks[i], ranks[j]] = [ranks[j], ranks[i]]; }
  const pretty = new Set(Array.from({ length: o.NA }, (_, j) => 6 * j + (j % 2 ? 3 : 2)));
  const P = ranks.map((k, id) => ({ id, rank0: k, skill0: 1 - o.SPREAD + 2 * o.SPREAD * (k + 0.5) / N, attractive: pretty.has(k) }));
  for (const p of P) Object.assign(p, { skill: p.skill0, rep: 0, level: 0, money: 0, perf: 0, seen: 0, looks: 0, told: 0 });
  const halo = o.blind ? 0 : o.HALO, top = o.LEVELS.length - 1;
  const ladder = []; for (let l = top; l >= 0; l--) for (let i = 0; i < o.LEVELS[l]; i++) ladder.push(l);
  const Y = [];
  let out1 = 0;
  for (let y = 1; y <= o.years; y++) {
    // 1) work and judging
    for (const p of P) {
      p.perf = p.skill * Math.max(0.2, 1 + o.LUCK * gauss());
      p.looks = p.perf * (p.attractive ? 1 + halo : 1);
      p.seen = p.looks * o.VIS[p.level];
      p.rep = y === 1 ? p.seen : o.MEM * p.rep + (1 - o.MEM) * p.seen;
    }
    // 2) town output (by this year's jobs) and productivity vs year 1
    const output = P.reduce((a, p) => a + p.perf * o.IMPACT[p.level], 0);
    if (y === 1) out1 = output;
    const prod = output / out1;
    // 3) feedback to the weakest-looking half
    const told = new Set([...P].sort((a, b) => a.looks - b.looks || a.id - b.id).slice(0, N / 2).map((p) => p.id));
    for (const p of P) if (told.has(p.id)) { p.skill = Math.min(2, p.skill + o.FB); p.told++; }
    // 4) the ladder by reputation
    const order = [...P].sort((a, b) => b.rep - a.rep || a.id - b.id);
    order.forEach((p, i) => { p.level = ladder[i]; });
    // 5) pay, spending, interest
    for (const p of P) p.money = p.money * (1 + o.R) + o.PAY[p.level] * prod - o.LIVE;
    Y.push({
      year: y, output, prod, told: [...told],
      people: P.map((p) => [p.level, +p.money.toFixed(2), +p.skill.toFixed(4), +p.rep.toFixed(4), +p.perf.toFixed(4)]),
    });
  }
  return { o, P, Y };
}

export const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
// summaries for one year record (yi = 0-based year index)
export function summary(R, yi) {
  const { P, Y } = R, x = Y[yi].people, A = P.filter((p) => p.attractive), O = P.filter((p) => !p.attractive);
  const pos = (m) => Math.max(0, m), tot = x.reduce((a, q) => a + pos(q[1]), 0);
  return {
    year: yi + 1,
    aShare: A.reduce((a, p) => a + pos(x[p.id][1]), 0) / tot * 100,
    aTop8: P.filter((p) => p.attractive && x[p.id][0] >= 3).length,
    aBoss: P.filter((p) => p.attractive && x[p.id][0] === 4).length,
    richRatio: mean(A.map((p) => x[p.id][1])) / mean(O.map((p) => x[p.id][1])),
    skillA: mean(A.map((p) => x[p.id][2])), skillO: mean(O.map((p) => x[p.id][2])),
    total: tot,
  };
}
