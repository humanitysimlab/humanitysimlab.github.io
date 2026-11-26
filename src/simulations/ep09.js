// sim.js — EP09 "The city that kept building homes". One tick = one year, 12 years. Every narrated number: check.mjs.
// Cast (60 Pips): 36 young renting workers, 12 owners (one home each), 9 small landlords (4 rented homes each), 3 roles
// (the Builder, the Bank, the Politician). Money is in today's dollars (real). The city grows (newcomers are not shown),
// so every new home finds someone to live in it; the question is only WHO OWNS it.
//  • A home = the building (COST, flat in real terms) + the land under it (whatever is left of the price).
//  • Young worker: earns a wage (+1 %/yr), keeps SAVE of it after tax and living costs, pays market rent from that,
//    saves the rest. Bid for a home = savings + the biggest loan the bank allows (payment ≤ PAY of income, TERM years
//    at this year's rate), but never more than savings / DEP (minimum deposit).
//  • Owners and landlords bid as investors: a home is worth its rent capitalised at (rate + their own margin − the 1 %/yr growth
//    they expect). Landlords want one more home every year; an owner wants a second home some years (P_OWN).
//    Their deposit comes out of the value their homes already gained, so their cash never binds.
//  • The Builder can finish CAP homes a year. He posts one price and sells to everyone who bids at least that. He picks
//    the price that makes him the most money; he never cuts it by more than CUT a year (the CMA finding: build at the
//    rate homes sell without lowering prices). Market price of every home = his price.
//  • Market rent follows the price, slower (RENT_EL).
//  • The Bank sets the rate: years 1–8 3 % (cheap money), 9–12 7 %.
//  • The Politician (option grant): GRANT dollars to every young buyer in GRANT_FROM..GRANT_TO.
//  • World B (option city): the same city, and the city also builds CITY_N homes a year at cost on land it owns, and rents
//    them at cost (CITY_RENT of what they cost) to young workers off a waiting list (random order). A city tenant
//    is housed for good (secure, rent at cost) and stops bidding for a home.
export const BASE = {
  seed: 1, YEARS: 12, NY: 36, NO: 12, NL: 9, LH: 4,
  COST: 220000, P0: 300000, RENT0: 14400, RENT_EL: 0.6,
  RATE: [3, 3, 3, 3, 3, 3, 3, 3, 7, 7, 7, 7],
  WAGE_G: 0.01, SAVE: 0.38, PAY: 0.28, TERM: 30, DEP: 0.10,
  K_LO: 0.010, K_HI: 0.025, G_FIX: 0.01, P_OWN: 0.25,
  CAP: 20, CUT: 0.02, LANDB: 80000, TURN: 3,
  grant: false, GRANT: 10000, GRANT_FROM: 5, GRANT_TO: 8,
  city: false, CITY_N: 3, CITY_LAND: 40000, CITY_RENT: 0.04,
};
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const annuity = (r, n) => (r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r);
// the same people in every world for a given seed
export function people(o) {
  const R = rng(o.seed * 104729 + 7);
  const young = Array.from({ length: o.NY }, (_, i) => ({ id: i, wage: Math.round(38000 + 34000 * Math.pow(R(), 1.3)), save: Math.round(3000 + 12000 * R()), wait: R() }));
  const inv = [];
  for (let j = 0; j < o.NO; j++) inv.push({ id: o.NY + j, kind: 'owner', homes: 1, k: o.K_LO + (o.K_HI - o.K_LO) * R() });
  for (let j = 0; j < o.NL; j++) inv.push({ id: o.NY + o.NO + j, kind: 'landlord', homes: o.LH, k: o.K_LO + (o.K_HI - o.K_LO) * R() });
  return { young, inv };
}
export function run(opt = {}) {
  const o = { ...BASE, ...opt }, pp = people(o), R = rng(o.seed * 7919 + 13);
  const Y = pp.young.map((p) => ({ ...p, owns: false, city: false, cityFrom: 0, boughtAt: 0, paid: 0, rentPaid: 0, rentCity: 0 }));
  const I = pp.inv.map((p) => ({ ...p, bought: 0 }));
  const cityOrder = [...Y].sort((a, b) => a.wait - b.wait);
  let P = o.P0, gPrev = [0, 0], cityHomes = 0;
  const years = [];
  for (let t = 1; t <= o.YEARS; t++) {
    const r = o.RATE[t - 1] / 100, rent = o.RENT0 * Math.pow(P / o.P0, o.RENT_EL);
    const cityRent = (o.COST + o.CITY_LAND) * o.CITY_RENT;
    if (o.city) for (let n = 0; n < o.CITY_N; n++) { const p = cityOrder.find((q) => !q.city && !q.owns); if (p) { p.city = true; p.cityFrom = t; cityHomes++; } }
    // 1. a year of work: wages up, rent out, the rest saved
    const rec = { t, r, P0: P, rent, cityRent, bids: [], sold: [], youngSave: [], deposit: o.DEP * P };
    for (const p of Y) {
      if (t > 1) p.wage *= 1 + o.WAGE_G;
      const keep = o.SAVE * p.wage;
      if (p.owns) continue;
      const rr = p.city ? cityRent : rent;
      p.save += Math.max(500, keep - rr); p.rentPaid += rr; if (p.city) p.rentCity += rr;
      rec.youngSave.push([p.id, keep - rr]);
    }
    rec.saves = Y.map((p) => [p.id, Math.round(p.save)]);
    // 2. bids for the builder's new homes
    const gExp = o.G_FIX;
    const grant = o.grant && t >= o.GRANT_FROM && t <= o.GRANT_TO ? o.GRANT : 0;
    const bids = [];
    for (const p of Y) {
      if (p.owns || p.city) continue;   // a city tenant is housed for good: no need to bid
      const loan = o.PAY * p.wage * annuity(r, o.TERM);
      bids.push({ who: p.id, kind: 'young', bid: Math.min(p.save + loan, p.save / o.DEP) + grant, loan });
    }
    for (const q of I) {
      if (q.kind === 'owner' && R() >= o.P_OWN) continue;
      bids.push({ who: q.id, kind: q.kind, bid: rent / Math.max(0.005, r + q.k - gExp) });
    }
    bids.sort((a, b) => b.bid - a.bid);
    // 3. the market: TURN existing homes come up for sale (people leaving town) + the builder's n new ones.
    //    Price = the k-th highest bid (k = homes for sale). Sellers never go below last year's price minus CUT.
    //    The builder picks n (0..CAP) that makes him the most money: every extra home lowers the price of all of them.
    const floor = P * (1 - o.CUT);
    const priceFor = (n) => (bids.length >= o.TURN + n ? bids[o.TURN + n - 1].bid : -Infinity);
    let best = { n: 0, price: priceFor(0), profit: 0 };
    for (let n = 1; n <= o.CAP; n++) {
      const price = priceFor(n); if (price < floor) break;
      const profit = n * (price - o.COST - o.LANDB);
      if (profit > best.profit) best = { n, price, profit };
    }
    rec.capPrice = bids.length >= o.TURN + o.CAP ? priceFor(o.CAP) : null;
    rec.capProfit = rec.capPrice !== null ? o.CAP * (rec.capPrice - o.COST - o.LANDB) : null;
    let price = best.price, k = o.TURN + best.n;
    if (price < floor) { price = floor; k = Math.min(o.TURN, bids.filter((b) => b.bid >= floor).length); }   // sticky: fewer sales, not lower prices
    const buyers = bids.slice(0, k);
    for (const b of buyers) {
      if (b.kind === 'young') { const p = Y.find((q) => q.id === b.who); p.owns = true; p.boughtAt = t; p.paid = price; p.city = false; }
      else { const q = I.find((x) => x.id === b.who); q.homes++; q.bought++; }
      rec.sold.push([b.who, b.kind]);
    }
    best.price = price;
    const Pn = price;
    rec.price = Pn; rec.n = best.n; rec.k = k; rec.profit = best.profit; rec.grant = grant; rec.gExp = gExp;
    rec.bids = bids.map((b) => [b.who, b.kind, Math.round(b.bid)]);
    rec.owners = Y.filter((p) => p.owns).length; rec.inCity = Y.filter((p) => p.city).length;
    rec.invHomes = I.map((q) => q.homes);
    gPrev = [Pn / P - 1, gPrev[0]]; P = Pn;
    years.push(rec);
  }
  return { o, years, Y, I };
}
// the numbers the film narrates, for one run
export function stats(res) {
  const { o, years, Y, I } = res, med = (a) => { const v = [...a].sort((x, y) => x - y); return v.length ? (v[(v.length - 1) >> 1] + v[v.length >> 1]) / 2 : NaN; };
  const sold = years.reduce((s, y) => s + y.k, 0), built = years.reduce((s, y) => s + y.n, 0);
  const toYoung = years.reduce((s, y) => s + y.sold.filter((x) => x[1] === 'young').length, 0);
  const peak = Math.max(...years.map((y) => y.price));
  const owners = Y.filter((p) => p.owns).length, inCity = Y.filter((p) => p.city).length;
  const rentShare = (t) => med(Y.filter((p) => !p.owns || p.boughtAt > t).map((p) => (p.cityFrom && p.cityFrom <= t ? years[t - 1].cityRent : years[t - 1].rent) / (p.wage / Math.pow(1 + o.WAGE_G, o.YEARS - t))));
  const rentToLandlords = Y.reduce((s, p) => s + p.rentPaid - p.rentCity, 0), rentToCity = Y.reduce((s, p) => s + p.rentCity, 0);
  return { sold, built, toYoung, owners, inCity, peak, last: years.at(-1).price, rent1: years[0].rent, rentPeak: Math.max(...years.map((y) => y.rent)),
    share1: rentShare(1), share8: rentShare(8), share12: rentShare(o.YEARS), saveMed: med(Y.filter((p) => !p.owns).map((p) => p.save)), rentToLandlords, rentToCity,
    frozen: years.filter((y) => y.k === 0).length, invBought: I.reduce((s, q) => s + q.bought, 0) };
}
