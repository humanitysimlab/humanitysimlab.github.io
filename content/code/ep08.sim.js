// sim.js — EP08 "60 friendly humans in a modern city". Every narrated number comes from here (check.mjs).
// Model (one tick = one evening, 100 days; day 1 is a Sunday, so the long days (4 h) are Friday and Saturday and
// ANCHOR_DAY 2 = Tuesday: the table meets on days 3, 10, … 94 = 14 Tuesdays):
//  • Friendship is hours of free time spent together (Hall 2018/2019: ~50 h turns an acquaintance into a casual friend).
//    A pair's hours fade a little every day they don't meet. FRIEND = a pair with ≥ 50 h. "Zero friends" = nobody at ≥ 50 h.
//  • Everyone is friendly: every Pip wants friends and starts with the same habit of inviting people (q ≈ Q0 a night).
//  • MODERN CITY: time together needs a plan. An inviter picks someone they know (people they've spent more time with first).
//    The other says yes more often the closer they are; then either side may cancel ("something came up", the easy screen at home),
//    more often when they barely know each other. If the plan happens: an evening (3 h) or a weekend day (4 h) together.
//    A failed invite (no, busy, cancelled) makes the inviter a little less likely to invite again (the liking gap: people
//    underestimate how much others want them); an evening that happens makes both a little more likely.
//  • OLD TOWN (option town): the same city plus three free shared places (square, café, park). Some evenings a Pip just drops by
//    its usual place, unplanned, and sits with whoever is there (familiar faces first). No invite, nothing to cancel.
//    Any evening spent with people (a plan that happened, a table at the place, the Tuesday table) nudges everyone there to invite more.
//  • ANCHOR (option anchor): the modern city plus ONE rule: every Tuesday evening, the same 6 people meet at the same table.
//    Nobody invites anybody; you just go (most weeks).
export const BASE = {
  seed: 27, N: 60, days: 100, K: 8, FRIEND: 50,
  Q0: 0.3, QMIN: 0.02, QMAX: 0.6, ACC0: 0.5, ACC1: 0.45, CAN0: 0.43, DOWN: 0.8, UP: 1.15,
  EVE: 3, WKND: 4, DECAY: 0.003, WEXP: 1.5,
  town: false, PLACES: 3, G: 0.7, TABLE: 4, PLACE_H: 2,
  anchor: false, GROUP: 6, ANCHOR_P: 0.9, ANCHOR_H: 3, ANCHOR_DAY: 2,
};
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
// the city's people: same in every world for a given seed (who knows whom at the start, how eager each one is, place, table group)
export function people(o) {
  const R = rng(o.seed * 104729 + 7), N = o.N, know = Array.from({ length: N }, () => new Set());
  // a random "people I know by name" graph: about K each (coworkers, neighbours), symmetric
  const stubs = shuffle(R, Array.from({ length: N * o.K / 2 }, (_, i) => i % N).concat(Array.from({ length: N * o.K / 2 }, (_, i) => i % N)));
  for (let s = 0; s + 1 < stubs.length; s += 2) { const a = stubs[s], b = stubs[s + 1]; if (a !== b) { know[a].add(b); know[b].add(a); } }
  const eager = Float64Array.from({ length: N }, () => 0.8 + 0.4 * R());
  const place = Int8Array.from({ length: N }, () => Math.floor(R() * o.PLACES));
  const order = shuffle(R, [...Array(N).keys()]), group = new Int8Array(N);
  order.forEach((p, k) => { group[p] = Math.floor(k / o.GROUP); });
  return { know, eager, place, group };
}
export function run(opt = {}) {
  const o = { ...BASE, ...opt }, N = o.N, pp = people(o), R = rng(o.seed * 7919 + 13);
  const H = Array.from({ length: N }, () => new Float64Array(N)), know = pp.know.map((s) => new Set(s));
  const q = Float64Array.from(pp.eager, (e) => o.Q0 * e);
  const cl = (i, j) => Math.min(1, Math.sqrt(H[i][j] / o.FRIEND));
  const add = (i, j, h) => { H[i][j] += h; H[j][i] += h; know[i].add(j); know[j].add(i); };
  const days = [];
  for (let d = 1; d <= o.days; d++) {
    const wd = (d - 1) % 7, weekend = wd >= 5, busy = new Uint8Array(N), rec = { d, anchor: [], places: [], inv: [] };
    if (o.anchor && wd === o.ANCHOR_DAY) {   // the Tuesday table
      const G = Math.ceil(N / o.GROUP);
      for (let g = 0; g < G; g++) {
        const at = [...Array(N).keys()].filter((p) => pp.group[p] === g && R() < o.ANCHOR_P);
        for (let a = 0; a < at.length; a++) for (let b = a + 1; b < at.length; b++) add(at[a], at[b], o.ANCHOR_H);
        for (const p of at) { busy[p] = 1; q[p] = Math.min(o.QMAX, q[p] * Math.sqrt(o.UP)); }
        rec.anchor.push(at);
      }
    }
    if (o.town) {   // drop by the usual place, sit with familiar faces first
      for (let pl = 0; pl < o.PLACES; pl++) {
        const here = shuffle(R, [...Array(N).keys()].filter((p) => !busy[p] && pp.place[p] === pl && R() < o.G)), tables = [], seated = new Set();
        for (const p of here) {
          if (seated.has(p)) continue;
          const pick = here.filter((x) => x !== p && !seated.has(x)).sort((x, y) => H[p][y] - H[p][x] || 0).slice(0, o.TABLE - 1);
          const t = [p, ...pick]; t.forEach((x) => seated.add(x)); tables.push(t);
        }
        for (const t of tables) { for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) add(t[a], t[b], o.PLACE_H); for (const p of t) { busy[p] = 1; if (t.length > 1) q[p] = Math.min(o.QMAX, q[p] * Math.sqrt(o.UP)); } }
        rec.places.push(tables);
      }
    }
    for (const i of shuffle(R, [...Array(N).keys()])) {   // invites
      if (busy[i] || R() >= q[i]) continue;
      const ks = [...know[i]]; if (!ks.length) continue;
      const wt = (k) => (1 + H[i][k]) ** o.WEXP; let tot = 0; for (const k of ks) tot += wt(k);
      let x = R() * tot, j = ks[ks.length - 1]; for (const k of ks) { x -= wt(k); if (x <= 0) { j = k; break; } }
      const c = cl(i, j);
      let out, who = -1;
      if (busy[j]) out = 'busy';
      else if (R() >= o.ACC0 + o.ACC1 * c) out = 'no';
      else if (R() < o.CAN0 * (1 - c)) out = 'cancel', who = i;   // the inviter cancels…
      else if (R() < o.CAN0 * (1 - c)) out = 'cancel', who = j;   // …or the one who said yes
      else out = 'met';
      if (out === 'met') { const h = weekend ? o.WKND : o.EVE; add(i, j, h); busy[i] = busy[j] = 1; q[i] = Math.min(o.QMAX, q[i] * o.UP); q[j] = Math.min(o.QMAX, q[j] * Math.sqrt(o.UP)); }
      else q[i] = Math.max(o.QMIN, q[i] * o.DOWN);
      rec.inv.push([i, j, out, +c.toFixed(3), who]);
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) H[i][j] *= 1 - o.DECAY;
    rec.friends = Array.from(H, (row) => row.reduce((n, h) => n + (h >= o.FRIEND), 0));
    rec.zero = rec.friends.filter((n) => n === 0).length;
    rec.q = Array.from(q);
    days.push(rec);
  }
  return { o, pp, H, days };
}
// summary of a run
export function stats(r) {
  const last = r.days[r.days.length - 1], inv = r.days.flatMap((d) => d.inv), n = (k) => inv.filter((x) => x[2] === k).length;
  const hoursSpread = r.H.map((row) => { const v = [...row].filter((h) => h > 0.5).sort((a, b) => b - a); return { people: v.length, top: v[0] || 0 }; });
  return { zero: last.zero, zeroShare: last.zero / r.o.N, invites: inv.length, met: n('met'), no: n('no'), cancel: n('cancel'), busy: n('busy'),
    invFirstWeek: r.days.slice(0, 7).reduce((s, d) => s + d.inv.length, 0), invLastWeek: r.days.slice(-7).reduce((s, d) => s + d.inv.length, 0),
    meanPeople: hoursSpread.reduce((s, x) => s + x.people, 0) / r.o.N, meanTop: hoursSpread.reduce((s, x) => s + x.top, 0) / r.o.N };
}
