// sim.js — EP07 "Rules for the crown": why even an angel king ends up spending like a tyrant. Every narrated number comes from here (check.mjs).
// Model: a small selectorate-theory island (Bueno de Mesquita, Smith, Siverson & Morrow 2003, The Logic of Political Survival),
// written as an agent simulation. One tick = one year.
//  • 60 islanders work; half of what they make goes to the treasury R. Roads and schools (the public stock P) raise everyone's output.
//    Optional gold mine: from year `mine.from`, the treasury gets `mine.x` × the year-1 treasury extra, whoever works.
//  • The king splits R three ways: K = private payments to his W "keys" (the people who hold the crown on his head),
//    G = public works for all 60 (each coin is worth LAMBDA coins to the island, shared by 60), S = his own pocket.
//  • A key's year under the king is worth  K/W + LAMBDA·G/N.
//  • Some years a challenger appears and promises the keys the most he can: CRED × max(R/W, LAMBDA·R/N) per key
//    (all as private payments, or all as public works — whichever is worth more to a key; promises are only partly believed).
//    Each key compares (with a small personal misjudgement) and switches if the promise beats his year × (1 + loyalty).
//    More than half the keys switch → the crown moves to the challenger; the keys keep their keys.
//  • ANGELS keep nothing for themselves and never change their budget: angel k gives the share k to the keys, the rest to public works.
//    (No angel "learns" to bribe; we only watch which budgets survive.) The 'saint' is the angel with k = 0.1.
//  • TYRANTS keep whatever is left and learn: a quiet year → pay the keys a little less; a wobble (some keys switched, not
//    enough) → pay a lot more. They pay in whatever is cheapest per key: private coins when W < N/LAMBDA (= 24), public works above.
export const BASE = { seed: 33, N: 60, W: 5, years: 40, LAMBDA: 2.5, CRED: 0.8, TAX: 0.5, KAPPA: 0.15, DECAY: 0.12, P_CHAL: 0.45,
  UP: 0.18, DOWN: 0.05, LOY: 0.3, MIS: 0.12, first: 'saint', next: 'tyrant', mine: null };
export const ANGEL_KS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// the island's people: same in every world for a given seed (who works how hard, who holds the keys, how loyal each one is)
export function people(seed, N, W) {
  const R = rng(seed * 104729 + 7), base = Float64Array.from({ length: N }, () => 0.8 + 0.4 * R()), loy = Float64Array.from({ length: N }, () => R());
  const order = [...Array(N).keys()]; for (let i = N - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [order[i], order[k]] = [order[k], order[i]]; }
  return { base, loy, keys: order.slice(0, W), order };
}
// the order in which angels come to the throne in the angels-only world (a shuffled list of budgets, repeated)
export function angelQueue(seed) {
  const R = rng(seed * 2750159 + 3), q = [];
  for (let r = 0; r < 20; r++) { const b = ANGEL_KS.slice(); for (let i = b.length - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [b[i], b[k]] = [b[k], b[i]]; } q.push(...b); }
  return q;
}
export function run(opt = {}) {
  const o = { ...BASE, ...opt }, N = o.N, W = o.W, pp = o.people || people(o.seed, N, W);
  const keys = pp.keys.slice(0, W), isKey = new Uint8Array(N); for (const k of keys) isKey[k] = 1;
  const Rc = rng(o.seed * 7919 + 13), Rm = rng(o.seed * 15485863 + 1), Rw = rng(o.seed * 32452843 + 2);   // streams: challengers, misjudgement, who challenges
  const privCheaper = W < N / o.LAMBDA, queue = angelQueue(o.seed);
  const typeOf = (t) => t === 'saint' ? { type: 'angel', k: 0.1 } : t === 'angel' ? { type: 'angel', k: queue.shift() } : { type: 'tyrant', k: null };
  let P = 0, kingNo = 1, cur = typeOf(o.first), T = null, reignStart = 0, king = pp.order[N - 1], R1 = null;
  const Y = [], reigns = [];
  for (let y = 1; y <= o.years; y++) {
    const m = 1 + o.KAPPA * P / N, out = Array.from(pp.base, (b) => b * m), work = o.TAX * out.reduce((a, b) => a + b, 0);
    if (R1 === null) R1 = work;
    const mine = o.mine && y >= o.mine.from ? o.mine.x * R1 : 0, Rt = work + mine;
    const offer = o.CRED * Math.max(Rt / W, o.LAMBDA * Rt / N);
    let K = 0, G = 0, S = 0;
    if (cur.type === 'angel') { K = cur.k * Rt; G = Rt - K; }
    else {
      if (T === null) T = offer;   // a new tyrant starts by paying what he promised
      const spend = Math.min(Rt, privCheaper ? W * T : N * T / o.LAMBDA);   // coins it costs to give every key a year worth T
      if (privCheaper) K = spend; else G = spend;
      S = Rt - spend;
    }
    const val = K / W + o.LAMBDA * G / N;
    let chal = false, switched = [], challenger = -1;
    if (Rc() < o.P_CHAL) {
      chal = true;
      do challenger = Math.floor(Rw() * N); while (isKey[challenger] || challenger === king);
      for (const k of keys) { const seen = offer * (1 + o.MIS * (2 * Rm() - 1)); if (seen > val * (1 + o.LOY * pp.loy[k])) switched.push(k); }
    }
    const coup = switched.length > W / 2;
    Y.push({ year: y, king, kingNo, type: cur.type, k: cur.k, R: Rt, mine, K, G, S, val, offer, P, out: out.reduce((a, b) => a + b, 0), chal, challenger, switched, coup,
      welfare: Array.from(out, (x, i) => (1 - o.TAX) * x + o.LAMBDA * G / N + (isKey[i] ? K / W : 0)) });
    P = (1 - o.DECAY) * P + G;
    if (coup) {
      reigns.push({ kingNo, type: cur.type, k: cur.k, king, from: reignStart + 1, to: y, years: y - reignStart });
      king = challenger; kingNo++; cur = typeOf(o.next); T = null; reignStart = y;
    } else if (cur.type === 'tyrant') T *= switched.length ? 1 + o.UP : 1 - o.DOWN;
  }
  reigns.push({ kingNo, type: cur.type, k: cur.k, king, from: reignStart + 1, to: o.years, years: o.years - reignStart, last: true });
  return { o, Y, reigns, keys, privCheaper };
}
// shares of the treasury over a span of years (inclusive)
export function shares(Y, a = 1, b = Y.length) {
  let R = 0, K = 0, G = 0, S = 0; for (const y of Y.slice(a - 1, b)) { R += y.R; K += y.K; G += y.G; S += y.S; }
  return { K: K / R, G: G / R, S: S / R, R };
}
export const welfare = (r, a, b) => r.Y.slice(a - 1, b).reduce((s, y) => s + y.welfare.reduce((p, q) => p + q, 0) / 60, 0) / (b - a + 1);
export const pocket = (r, a, b) => r.Y.slice(a - 1, b).reduce((s, y) => s + y.S, 0) / (b - a + 1);
// average welfare of the islanders who are NOT keys (the 55 or the 29 ordinary people)
export const welfareNK = (r, a, b) => { const isK = new Set(r.keys); let s = 0, n = 0;
  for (const y of r.Y.slice(a - 1, b)) y.welfare.forEach((w, i) => { if (!isK.has(i)) { s += w; n++; } }); return s / n; };
