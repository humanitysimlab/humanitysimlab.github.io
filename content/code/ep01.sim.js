// sim.js — EP01's economy. Every number the narration says comes from here (see FACTS.md, calibrate.mjs).
// Yard-sale model: 60 players start with $100. Each day, 450 random meetings (every player trades 15 times a day on average).
// A fair coin decides who wins; the winner takes 20 % of the POORER player's money. No skill, no cheating; money is conserved.
// Options: tax (daily share of everyone's money pooled and split equally), interest (rich earn, paid by the poor),
// p(a, b) (win probability of a against b, for the genius), init(w) (starting money).

export const BASE = { seed: 166, N: 60, start: 100, stake: 0.2, tradesPerDay: 15 };

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// returns { days: [Float64Array per day 0..D], trades: [[a, b, winner, amount, fraction] per day, sampled], ... }
export function run({ seed = BASE.seed, N = BASE.N, days = 100, tax = 0, interest = 0, p = null, init = null, keepTrades = 24 } = {}) {
  const r = rng(seed), w = new Float64Array(N).fill(BASE.start);
  if (init) init(w);
  const out = [Float64Array.from(w)], trades = [[]];
  const M = Math.round(BASE.tradesPerDay * N / 2);
  for (let d = 1; d <= days; d++) {
    const log = [];
    for (let k = 0; k < M; k++) {
      const a = (r() * N) | 0; let b = (r() * N) | 0; if (b === a) b = (b + 1) % N;
      const amt = BASE.stake * Math.min(w[a], w[b]);
      const pa = p ? p(a, b) : 0.5;
      const aWins = r() < pa;
      if (aWins) { w[a] += amt; w[b] -= amt; } else { w[a] -= amt; w[b] += amt; }
      if (k % Math.ceil(M / keepTrades) === 0) log.push([a, b, aWins ? a : b, amt, k / M]);
    }
    if (tax) { let pot = 0; for (let i = 0; i < N; i++) { const x = w[i] * tax; w[i] -= x; pot += x; } for (let i = 0; i < N; i++) w[i] += pot / N; }
    if (interest) {
      let pay = 0, poor = 0;
      for (let i = 0; i < N; i++) { if (w[i] > 150) pay += w[i] * interest; else poor += w[i]; }
      const f = Math.min(pay, poor * 0.5) / (pay || 1);
      for (let i = 0; i < N; i++) { if (w[i] > 150) w[i] += w[i] * interest * f; else w[i] -= (w[i] / poor) * pay * f; }
    }
    out.push(Float64Array.from(w)); trades.push(log);
  }
  return { days: out, trades, N, D: days };
}

export const share = (w, k) => { const s = [...w].sort((a, b) => b - a), T = s.reduce((a, b) => a + b, 0); return s.slice(0, k).reduce((a, b) => a + b, 0) / T; };
export const below = (w, v) => w.filter((x) => x < v).length;
export function wealthAt(R, day) {
  const d0 = Math.max(0, Math.min(R.D, Math.floor(day))), d1 = Math.min(R.D, d0 + 1), f = Math.max(0, Math.min(1, day - d0));
  const a = R.days[d0], b = R.days[d1], o = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) o[i] = a[i] + (b[i] - a[i]) * f;
  return o;
}
// first day the two richest hold ≥ 74.4 % (the pure-luck median at day 100): the "collapse" day used in Act 5
export const COLLAPSE = 0.744;
export const collapseDay = (R) => R.days.findIndex((w) => share(w, 2) >= COLLAPSE);
