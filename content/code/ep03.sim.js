// sim.js — EP03 "The AI Paradise Paradox". Every narrated number comes from here (see FACTS.md, check.mjs).
// A closed town economy, one tick = one week. 60 people: 5 owners (one firm each) and 55 workers (11 per firm).
// Money never enters or leaves the board. One good: the weekly food basket.
//  • Workers earn a wage ($15/week) and spend all of it on baskets (price starts at $10 → 1.5 baskets a week).
//  • Owners spend $30 a week (3 baskets at the old price). Firm profit = revenue − wages, kept by the owner.
//    (Closed-economy identity: before AI, profits exactly equal what the owners spend — the money keeps circling.)
//  • A person without income buys one basket a week from savings while they last; less than a basket = hungry.
//  • Workers start with $10–$60 of savings (1 to 6 weeks of food at the old price).
//  • Each worker makes 1.8 baskets a week. From week AI_WEEK, an owner can replace workers with AI robots:
//    a robot needs no wage and makes 10× a worker (18 baskets). An adopting firm keeps 1 human supervisor.
//    Firm 0 adopts first; a rival adopts (each week, prob. ADOPT) once it has lost sales to cheaper AI food.
//  • Prices: a firm with more than 2 weeks of stock cuts its price 15 %, with less than 1 week raises it 5 %;
//    human-staffed firms never go below their labour cost ($8.33); AI firms never below FLOOR ($2: power and ingredients).
//    Buyers split their spending across firms with stock, share ∝ exp(−0.6 × (price − cheapest price)) (a $2 cheaper firm gets ~3× the buyers).
//  • Production: robots run at full capacity until a firm holds more than 4 weeks of sales, then it cuts output 25 %/week.
//  • A firm that cannot pay its wages closes; its owner keeps the cash but has no income.
//  • Robot dividend (option tau): every week a share tau of each AI firm's profit is split equally among all 60 people
//    (paid only from cash above a $100 reserve, so no shop is closed by its dividend).
//  • Robot tax (option robotTax = k): every robot pays k × the wage of the worker it replaced into a pot split equally among all 60.

export const BASE = { seed: 3, weeks: 70, AI_WEEK: 10, WAGE: 15, P0: 10, OWNER_SPEND: 30, A: 1.8, ROBOT: 18, FLOOR: 2, ADOPT: 0.45, BETA: 0.6, RESERVE: 100 };

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function run(opt = {}) {
  const o = { ...BASE, ai: true, tau: 0, robotTax: 0, priceWar: true, ...opt };
  const r = rng(o.seed);
  const NF = 5, N = 60;
  const P = [];
  for (let i = 0; i < N; i++) P.push({ id: i, owner: i < NF, firm: i < NF ? i : (i - NF) % NF, employed: i >= NF, money: i < NF ? 400 : 10 + r() * 50, income: 0, ate: 0, hungryWeeks: 0, fired: -1 });
  const F = Array.from({ length: NF }, (_, f) => ({ id: f, open: true, ai: false, adoptWeek: -1, robots: 0, price: o.P0, stock: 6, util: 1, sales: 19.5, lastSales: 19.5, lostSales: 0, revenue: 0, profit: 0, closedWeek: -1, produced: 0 }));
  const workersOf = (f) => P.filter((p) => !p.owner && p.employed && p.firm === f);
  const W = [];
  let lastDiv = 0;
  for (let w = 1; w <= o.weeks; w++) {
    // 1) adoption
    if (o.ai && w >= o.AI_WEEK) for (const f of F) {
      if (!f.open || f.ai) continue;
      const go = f.id === 0 ? w === o.AI_WEEK : f.lostSales > 0 && r() < o.ADOPT;
      if (go) {
        const staff = workersOf(f.id); f.ai = true; f.adoptWeek = w; f.robots = staff.length - 1;
        staff.slice(1).forEach((p) => { p.employed = false; p.fired = w; });
      }
    }
    // 2) production
    let produced = 0;
    for (const f of F) {
      if (!f.open) { f.produced = 0; continue; }
      const humans = workersOf(f.id).length, cap = humans * o.A + f.robots * o.ROBOT;
      if (f.ai) { if (f.stock > 4 * Math.max(1, f.lastSales)) f.util = Math.max(0.02, f.util * 0.75); else f.util = Math.min(1, f.util * 1.25); }
      f.produced = cap * (f.ai ? f.util : 1); f.stock += f.produced; produced += f.produced;
      f.revenue = 0; f.sales = 0;
    }
    // 3) incomes: wages (paid by firms from their owner's cash) and last week's dividend
    for (const p of P) p.income = 0;
    for (const f of F) {
      if (!f.open) continue;
      const staff = workersOf(f.id), bill = staff.length * o.WAGE, owner = P[f.id];
      if (owner.money < bill) { // cannot pay: the firm closes
        f.open = false; f.closedWeek = w; f.stock = 0; staff.forEach((p) => { p.employed = false; p.fired = w; }); continue;
      }
      owner.money -= bill; staff.forEach((p) => { p.money += o.WAGE; p.income += o.WAGE; });
    }
    if (lastDiv > 0) for (const p of P) { p.money += lastDiv; p.income += lastDiv; }
    // 4) spending: people buy from the cheapest firm with stock (random order of buyers)
    const order = P.map((p) => p.id); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let hungry = 0, fedWorkers = 0, baskets = 0;
    for (const id of order) {
      const p = P[id];
      let budget = p.owner ? Math.min(p.money, o.OWNER_SPEND + p.income) : p.income;   // spend income (owners: $30 + dividend)
      let got = 0;
      const buy = (money) => { // spend across stocked firms, shares ∝ exp(−BETA·(price − cheapest)): cheaper firms win most buyers, not all
        let q = 0; for (let guard = 0; guard < 8 && money > 1e-6; guard++) {
          const open = F.filter((f) => f.open && f.stock > 1e-6); if (!open.length) break;
          const pmin = Math.min(...open.map((f) => f.price)), wt = open.map((f) => Math.exp(-o.BETA * (f.price - pmin))), T = wt.reduce((a, b) => a + b, 0);
          let spent = 0;
          open.forEach((f, k) => { const m = money * wt[k] / T, n = Math.min(f.stock, m / f.price); f.stock -= n; f.sales += n; f.revenue += n * f.price; P[f.id].money += n * f.price; spent += n * f.price; q += n; });
          p.money -= spent; money -= spent; if (spent < 1e-9) break;
        } return q;
      };
      got += buy(Math.min(budget, p.money));
      if (got < 1 - 1e-9) { // not a full basket from income: top up from savings, one basket at most
        const avgP = (() => { const op = F.filter((f) => f.open && f.stock > 1e-6); return op.length ? op.reduce((a, f) => a + f.price, 0) / op.length : 0; })();
        if (avgP) got += buy(Math.min(p.money, (1 - got) * avgP));
      }
      p.ate = got; baskets += got;
      if (got < 1 - 1e-6) { hungry++; p.hungryWeeks++; } else { p.hungryWeeks = 0; if (!p.owner) fedWorkers++; }
    }
    // 5) prices, profits, lost sales, dividend
    const minAI = Math.min(...F.filter((f) => f.open && f.ai).map((f) => f.price), Infinity);
    let profitAll = 0;
    for (const f of F) {
      if (!f.open) continue;
      const staffN = workersOf(f.id).length;
      f.profit = f.revenue - staffN * o.WAGE; profitAll += Math.max(0, f.profit);
      f.lostSales = f.sales < 0.8 * f.lastSales && minAI < f.price ? 1 : f.lostSales;
      if (o.priceWar && w >= o.AI_WEEK && F.some((g) => g.ai)) {   // prices only move once AI food is on sale
        const floor = f.ai ? o.FLOOR : o.WAGE / o.A;
        if (f.stock > 2 * Math.max(1, f.sales)) f.price = Math.max(floor, f.price * 0.85);
        else if (f.stock < 1 * Math.max(1, f.sales)) f.price = f.price * 1.05;
      }
      f.lastSales = f.sales;
    }
    lastDiv = 0;
    if (o.robotTax > 0) { let pool = 0; for (const f of F) if (f.open && f.robots > 0) { const d = Math.min(P[f.id].money, o.robotTax * o.WAGE * f.robots); P[f.id].money -= d; pool += d; } lastDiv += pool / N; }
    if (o.tau > 0) { let pool = 0; for (const f of F) if (f.open && f.ai && f.profit > 0) { const d = Math.max(0, Math.min(o.tau * f.profit, P[f.id].money - o.RESERVE)); P[f.id].money -= d; pool += d; } lastDiv += pool / N; }
    const workers = P.filter((p) => !p.owner);
    W.push({
      week: w, produced, baskets, hungry, hungryWorkers: workers.filter((p) => p.ate < 1 - 1e-6).length, fedWorkers,
      employed: workers.filter((p) => p.employed).length, stock: F.reduce((a, f) => a + (f.open ? f.stock : 0), 0),
      ownersMoney: P.filter((p) => p.owner).reduce((a, p) => a + p.money, 0), workersMoney: workers.reduce((a, p) => a + p.money, 0),
      price: F.filter((f) => f.open).reduce((a, f) => Math.min(a, f.price), Infinity), firmsOpen: F.filter((f) => f.open).length, firmsAI: F.filter((f) => f.ai && f.open).length,
      wagesPaid: P.reduce((a, p) => a + (p.employed && !p.owner ? o.WAGE : 0), 0), dividend: lastDiv,
      capacity: F.reduce((a, f) => a + (f.open ? workersOf(f.id).length * o.A + f.robots * o.ROBOT : 0), 0),
      firm: F.map((f) => ({ open: f.open, ai: f.ai, price: f.price, sales: f.sales, revenue: f.revenue, profit: f.profit, stock: f.stock })),
      people: P.map((p) => [Math.round(p.money * 100) / 100, Math.round(p.ate * 1000) / 1000, p.employed ? 1 : 0]),
    });
  }
  return { W, P, F, opt: o };
}
