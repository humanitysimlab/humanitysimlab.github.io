// sim.js — EP02 dating market. Every narrated number comes from here (see FACTS.md, calibrate.mjs).
// 5,000 singles. Each has looks L ~ N(0,1) (what everyone roughly agrees on) plus a private taste
// noise per pair (sigma TASTE), so appeal(i→j) = L_j + taste(i,j).
// A like is one-way; a match is a mutual like; a couple forms from a match through conversation;
// couples leave the board. "Alone" = not in a couple at the end.
//
// TOWN  — you meet a few people nearby each day (neighbourhoods of 50); you like someone if they are
//         roughly your own level (appeal > L_i − SETTLE); standards relax slowly. Matches talk and pair up.
// APP   — you see VIEWS random profiles a day from everyone; with the whole catalog to compare against,
//         you only like the top PICKY share of what you see (absolute bar, not your own level).
//         Overloaded people (big inbox) get pickier; starving people (no match) swipe more.
//         Conversation: each match turns into a couple with prob CONV / (attention load) — many pending
//         likes and matches split your attention (paradox of choice).
// Options: ratio (share of men), feed ('random' | 'popular' | 'compatible'), drip (profit trick),
//          cap (max active matches; full profiles hidden), likesPerDay (daily like budget).

export const BASE = { seed: 7, N: 5000, days: 30, TASTE: 0.6 };

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
// fixed per-pair taste noise (approx. normal, sum of 3 uniforms from an integer hash)
function taste(i, j, seed) {
  let h = Math.imul(i * 73856093 ^ j * 19349663 ^ seed * 83492791, 0x9E3779B1) >>> 0;
  let s = 0;
  for (let k = 0; k < 3; k++) { h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297A2D39) >>> 0; h ^= h >>> 15; s += (h >>> 0) / 4294967296; }
  return (s - 1.5) * 2; // sd = 1
}

export function people({ seed = BASE.seed, N = BASE.N, ratio = 0.5 } = {}) {
  const r = rng(seed * 31 + 1), P = [];
  const nm = Math.round(N * ratio);
  for (let i = 0; i < N; i++) P.push({ id: i, sex: i < nm ? 0 : 1, L: gauss(r) }); // 0 = man (blue), 1 = woman (coral)
  return P;
}

export function run(opt = {}) {
  const o = {
    seed: BASE.seed, N: BASE.N, days: BASE.days, ratio: 0.5, world: 'app',
    VIEWS: 40, PICKY: 0.12, CONV: 0.12, SETTLE: 0.4, MEET: 2, HOOD: 50,
    feed: 'random', drip: false, cap: 0, likesPerDay: 0, quitDays: 0, price: 1,
    keepLog: 40, ...opt,
  };
  const r = rng(o.seed * 7 + 3), P = people(o), N = P.length, T = BASE.TASTE;
  const app = (i, j) => P[j].L + T * taste(i, j, o.seed);
  const st = P.map((p) => ({
    single: true, active: true, partner: -1, coupledDay: -1, quitDay: -1,
    likesIn: 0, likesOut: 0, inbox: 0, matches: new Set(), matchedEver: 0, liked: new Set(),
    picky: o.PICKY * (p.sex === 1 ? 0.7 : 1.4), dryDays: 0, hood: Math.floor((p.id % (N / 2)) / (o.HOOD / 2)),
  }));
  const daily = [], log = [];
  const singlesOf = (sex) => P.filter((p) => p.sex === sex && st[p.id].single && st[p.id].active).map((p) => p.id);
  let revenue = 0;

  const couple = (a, b, d) => {
    for (const x of [a, b]) { st[x].single = false; st[x].active = false; st[x].coupledDay = d; for (const m of st[x].matches) st[m].matches.delete(x); st[x].matches.clear(); }
    st[a].partner = b; st[b].partner = a;
  };
  const visible = (j) => st[j].single && st[j].active && !(o.cap && st[j].matches.size >= o.cap);

  for (let d = 1; d <= o.days; d++) {
    const dl = { likes: [], matches: [], couples: [] };
    if (o.world === 'town') {
      // meet MEET people a day from your neighbourhood (opposite sex, single)
      const byHood = new Map();
      for (const p of P) if (st[p.id].single) { const k = st[p.id].hood * 2 + p.sex; (byHood.get(k) || byHood.set(k, []).get(k)).push(p.id); }
      for (const p of P) {
        const s = st[p.id]; if (!s.single || p.sex !== 0) continue;
        const pool = byHood.get(s.hood * 2 + 1) || [];
        for (let m = 0; m < o.MEET && pool.length; m++) {
          const j = pool[(r() * pool.length) | 0]; if (!st[j].single) continue;
          const bar = (x) => P[x].L - o.SETTLE - 0.04 * d; // own level, relaxing a little each day
          const li = app(p.id, j) > bar(p.id), lj = app(j, p.id) > bar(j);
          if (li) { st[j].likesIn++; s.likesOut++; }
          if (lj) { s.likesIn++; st[j].likesOut++; }
          if (li && lj) { s.matchedEver++; st[j].matchedEver++; if (r() < 0.55) { couple(p.id, j, d); dl.couples.push([p.id, j]); } }
        }
      }
    } else {
      // APP: each active single sees VIEWS profiles of the other sex
      const pools = [singlesOf(0), singlesOf(1)];
      const visPools = pools.map((pl) => pl.filter(visible));
      // popularity-ranked feed: sample proportional to (likesIn+1)^1 among the visible
      const weights = visPools.map((pl) => pl.map((j) => (o.feed === 'popular' ? 1 + st[j].likesIn : 1)));
      const cum = weights.map((w) => { const c = new Float64Array(w.length); let s = 0; for (let k = 0; k < w.length; k++) { s += w[k]; c[k] = s; } return c; });
      const pick = (sex) => { const c = cum[sex], pl = visPools[sex]; if (!pl.length) return -1; const x = r() * c[c.length - 1]; let lo = 0, hi = c.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (c[m] < x) lo = m + 1; else hi = m; } return pl[lo]; };
      const order = [...pools[0], ...pools[1]].sort(() => r() - 0.5);   // NOTE: engine-specific order; the film uses the Node run exported to data/worlds.json
      for (const i of order) {
        const s = st[i]; if (!s.single || !s.active) continue;
        if (o.cap && s.matches.size >= o.cap) continue; // full: busy talking, not swiping
        const other = 1 - P[i].sex;
        // compatible feed (designed for love): show people near your own level
        let seen = [];
        for (let v = 0; v < o.VIEWS; v++) {
          let j = pick(other); if (j < 0) break;
          if (o.feed === 'compatible') { let best = j, bd = Math.abs(P[j].L - P[i].L); for (let t = 0; t < 3; t++) { const k = pick(other); const dd = Math.abs(P[k].L - P[i].L); if (dd < bd) { bd = dd; best = k; } } j = best; }
          if (!s.liked.has(j)) seen.push(j);
        }
        // like the top `picky` share by appeal against the whole catalog (absolute bar)
        const q = Math.min(0.95, Math.max(0.01, s.picky));
        const bar = 1.0 * qnorm(1 - q); // appeal > bar  <=> roughly top q of the population
        let budget = o.likesPerDay || 1e9;
        for (const j of seen) {
          if (budget <= 0) break;
          const a = app(i, j);
          const ok = o.feed === 'compatible' ? a > P[i].L - o.SETTLE : a > bar * Math.sqrt(1 + T * T);
          if (!ok) continue;
          budget--; s.liked.add(j); s.likesOut++; st[j].likesIn++; st[j].inbox++;
          if (dl.likes.length < o.keepLog * 4) dl.likes.push([i, j]);
          if (st[j].liked.has(i)) { // mutual → match
            s.matches.add(j); st[j].matches.add(i); s.matchedEver++; st[j].matchedEver++;
            if (dl.matches.length < o.keepLog) dl.matches.push([i, j]);
          }
        }
      }
      // conversations: each match may become a couple; attention is split by load
      const load = (x) => 1 + Math.max(0, st[x].matches.size - 1) * 0.5 + st[x].inbox / 25;
      const pairs = [];
      for (const p of P) { const s = st[p.id]; if (!s.single || p.sex !== 0) continue; for (const j of s.matches) pairs.push([p.id, j]); }
      for (const [a, b] of pairs.sort(() => r() - 0.5)) {
        if (!st[a].single || !st[b].single) continue;
        if (r() < o.CONV / (load(a) * load(b))) { couple(a, b, d); dl.couples.push([a, b]); }
      }
      // adapt: overload → pickier, starving → swipe more; inbox is read slowly
      for (const p of P) {
        const s = st[p.id]; if (!s.single || !s.active) continue;
        if (s.inbox > 20) s.picky *= 0.85;
        if (s.matches.size === 0) { s.dryDays++; s.picky = Math.min(0.9, s.picky * 1.12); } else s.dryDays = 0;
        s.inbox = Math.max(0, s.inbox - 15);
        revenue += o.price;
        // churn: give up after quitDays with no match — unless the profit app drips a like
        if (o.quitDays && s.dryDays >= o.quitDays) {
          if (o.drip && r() < 0.9) { s.dryDays = 0; s.dripped = (s.dripped || 0) + 1; }
          else { s.active = false; s.quitDay = d; }
        }
      }
    }
    log.push(dl);
    const pk = [0, 1].map((sex) => { const a = P.filter((p) => p.sex === sex && st[p.id].single && st[p.id].active); return a.reduce((x, p) => x + st[p.id].picky, 0) / (a.length || 1); });
    daily.push({ day: d, coupled: st.filter((s) => !s.single).length / N, revenue, active: st.filter((s) => s.active).length, pickyMen: pk[0], pickyWomen: pk[1], quit: st.filter((s) => s.quitDay > 0).length });
  }
  return { P, st, daily, log, revenue, opt: o };
}

// deterministic Fisher–Yates (a random sort comparator gives different orders in different JS engines)
export function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

// inverse normal CDF (Acklam)
export function qnorm(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const dd = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((dd[0] * q + dd[1]) * q + dd[2]) * q + dd[3]) * q + 1); }
  if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((dd[0] * q + dd[1]) * q + dd[2]) * q + dd[3]) * q + 1); }
  const q = p - 0.5, rr = q * q;
  return (((((a[0] * rr + a[1]) * rr + a[2]) * rr + a[3]) * rr + a[4]) * rr + a[5]) * q / (((((b[0] * rr + b[1]) * rr + b[2]) * rr + b[3]) * rr + b[4]) * rr + 1);
}

// ---- measures ----
export function gini(xs) { const s = [...xs].sort((a, b) => a - b), n = s.length, T = s.reduce((a, b) => a + b, 0); if (!T) return 0; let acc = 0; s.forEach((x, k) => { acc += (2 * (k + 1) - n - 1) * x; }); return acc / (n * T); }
export function topShare(xs, f) { const s = [...xs].sort((a, b) => b - a), T = s.reduce((a, b) => a + b, 0); return s.slice(0, Math.round(s.length * f)).reduce((a, b) => a + b, 0) / T; }
export function summary(R) {
  const { P, st } = R, by = (sex) => P.filter((p) => p.sex === sex).map((p) => p.id);
  const out = { coupled: st.filter((s) => !s.single).length / P.length, revenue: R.revenue };
  for (const [k, sex] of [['men', 0], ['women', 1]]) {
    const ids = by(sex); if (!ids.length) continue;
    const likes = ids.map((i) => st[i].likesIn);
    out[k] = {
      n: ids.length, coupled: ids.filter((i) => !st[i].single).length / ids.length,
      zeroMatch: ids.filter((i) => st[i].matchedEver === 0).length / ids.length,
      likesGini: gini(likes), top10Likes: topShare(likes, 0.1), bottom80Likes: 1 - topShare(likes, 0.2),
      likesPerDay: likes.reduce((a, b) => a + b, 0) / ids.length / R.opt.days,
    };
  }
  const all = P.map((p) => st[p.id].likesIn);
  out.likesGini = gini(all); out.top10Likes = topShare(all, 0.1);
  // the crowned: top 10 % by looks within each sex
  const crowned = []; for (const sex of [0, 1]) { const ids = by(sex).sort((a, b) => P[b].L - P[a].L); crowned.push(...ids.slice(0, Math.round(ids.length * 0.1))); }
  out.crownedCoupled = crowned.filter((i) => !st[i].single).length / crowned.length;
  out.crownedMatches = crowned.reduce((a, i) => a + st[i].matchedEver, 0) / crowned.length;
  const rest = P.map((p) => p.id).filter((i) => !crowned.includes(i));
  out.restCoupled = rest.filter((i) => !st[i].single).length / rest.length;
  out.restZeroMatch = rest.filter((i) => st[i].matchedEver === 0).length / rest.length;
  out.zeroMatch = P.filter((p) => st[p.id].matchedEver === 0).length / P.length;
  for (const [k, sex] of [['men', 0], ['women', 1]]) {
    if (!out[k]) continue;
    const ids = by(sex).sort((a, b) => P[b].L - P[a].L), n10 = Math.round(ids.length * 0.1);
    const cr = ids.slice(0, n10), rs = ids.slice(n10);
    out[k].crownedCoupled = cr.filter((i) => !st[i].single).length / cr.length;
    out[k].crownedMatches = cr.reduce((a, i) => a + st[i].matchedEver, 0) / cr.length;
    out[k].crownedLikes = cr.reduce((a, i) => a + st[i].likesIn, 0) / cr.length;
    out[k].restCoupled = rs.filter((i) => !st[i].single).length / rs.length;
    out[k].restMatches = rs.reduce((a, i) => a + st[i].matchedEver, 0) / rs.length;
    const L = ids.map((i) => st[i].likesIn).sort((a, b) => a - b);
    out[k].likesQ = [0.1, 0.25, 0.5, 0.8, 0.9, 0.99].map((q) => L[Math.floor(q * (L.length - 1))]);
    out[k].quit = ids.filter((i) => st[i].quitDay > 0).length / ids.length;
    out[k].dripped = ids.filter((i) => st[i].dripped).length / ids.length;
  }
  return out;
}
