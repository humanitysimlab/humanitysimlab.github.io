// sim.js — EP05 "1,000 Liars and 1,000 Honest People on an Island, 500 Years". Every narrated number comes from here (FACTS.md, check.mjs).
// One tick = one year. 2,000 homes on the island (CAP). Year 0: 1,000 honest islanders, 1,000 liars, ages 18–69, savings S0 baskets.
//  • Food: everyone eats NEED (1 basket) a year. Fishing alone: the lagoon gives LAG baskets a year in total, shared by everyone
//    (alone, the island feeds LAG people).
//  • Trade: each year, M rounds of random pairs. An honest islander hands over a gift that costs C and is worth B to the
//    receiver (fish for fruit: trade makes value). A liar takes the gift and gives nothing back.
//  • Memory: if a liar cheats you, you never trade with them again (you keep your gift; they get nothing from you).
//  • Gossip (world B only, the one rule change): every year each islander passes everything they know about liars to G of
//    their F friends (fractional G: one friend with probability G, e.g. 0.25 = once every four years) (fixed friendships between homes). Liars are never told anything new; they cheat everyone they can.
//  • Savings += income − NEED. Below 0 → the islander packs up and leaves the island (the home is empty).
//  • Children: islanders aged 20–45 with savings ≥ KID raise a child with probability BIRTH a year (pay KID/2 to the child)
//    if there is an empty home; the child copies the parent's way (honest or liar), except MUT of the time.
//    A child enters at 18 with no knowledge (nobody has told them anything yet) and nobody knows them.
//  • Old age: at 70 an islander passes on (the home is empty).
export const BASE = { seed: 1, years: 500, CAP: 2000, H0: 1000, L0: 1000, NEED: 1, LAG: 600, M: 10, B: 0.36, C: 0.1, S0: 5, KID: 3, BIRTH: 0.12, AMAX: 60, MUT: 0.02, F: 8, G: 0 };
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function run(opt = {}) {
  const o = { ...BASE, ...opt }, R = rng(o.seed * 7919 + 13), Rp = rng(o.seed * 15485863 + 1), Rb = rng(o.seed * 32452843 + 2), Rg = rng(o.seed * 49979687 + 3),   // separate streams: start, pairs, births, gossip
    N = o.CAP, W = (N + 31) >>> 5;
  const alive = new Uint8Array(N), liar = new Uint8Array(N), age = new Int16Array(N), sav = new Float64Array(N), inc = new Float64Array(N), born = new Int32Array(N), cheated = new Int32Array(N), fam = new Int32Array(N);
  const know = new Uint32Array(N * W);            // know[i] row: bit j = "i knows the islander in home j is a liar"
  const friends = []; { const R2 = rng(o.seed * 104729 + 7), deg = new Int32Array(N); for (let i = 0; i < N; i++) friends.push([]);
    const want = N * o.F / 2; let made = 0, guard = 0;   // random friendship graph, every home ≈ F friends (same graph in both worlds)
    while (made < want && guard++ < want * 50) { const a = Math.floor(R2() * N), b = Math.floor(R2() * N); if (a === b || deg[a] >= o.F || deg[b] >= o.F || friends[a].includes(b)) continue; friends[a].push(b); friends[b].push(a); deg[a]++; deg[b]++; made++; } }
  const forget = (j) => { for (let i = 0; i < N; i++) know[i * W + (j >>> 5)] &= ~(1 << (j & 31)); know.fill(0, j * W, j * W + W); };
  const knows = (i, j) => (know[i * W + (j >>> 5)] >>> (j & 31)) & 1;
  const learn = (i, j) => { know[i * W + (j >>> 5)] |= 1 << (j & 31); };
  { const ids = [...Array(N).keys()]; for (let i = N - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [ids[i], ids[k]] = [ids[k], ids[i]]; }
    ids.forEach((h, k) => { alive[h] = 1; liar[h] = k < o.L0 ? 1 : 0; age[h] = 18 + Math.floor(R() * 52); sav[h] = o.S0; born[h] = 0; fam[h] = h; }); }
  const start = { liar: Uint8Array.from(liar), age: Int16Array.from(age) };
  const Y = [];
  const famCount = () => { const c = new Uint16Array(N); for (let i = 0; i < N; i++) if (alive[i]) c[fam[i]]++; return c; };
  const H = [];                                   // per-year state of every home: [alive, liar, savings, age, family] (for the film)
  const snap = (y, extra) => {
    let nH = 0, nL = 0, sH = 0, sL = 0, iH = 0, iL = 0, kn = 0, kc = 0;
    for (let i = 0; i < N; i++) if (alive[i]) { if (liar[i]) { nL++; sL += sav[i]; iL += inc[i]; } else { nH++; sH += sav[i]; iH += inc[i]; } }
    if (y % 5 === 0 || y <= 30) for (let j = 0; j < N; j++) if (alive[j] && liar[j]) { let c = 0; for (let i = 0; i < N; i++) if (alive[i] && !liar[i] && knows(i, j)) c++; kn += c; kc++; }
    Y.push({ year: y, n: nH + nL, nH, nL, savH: nH ? sH / nH : 0, savL: nL ? sL / nL : 0, incH: nH ? iH / nH : 0, incL: nL ? iL / nL : 0, food: extra.food, gifts: extra.gifts, cheats: extra.cheats, known: kc && nH ? kn / kc / nH : 0, left: extra.left, old: extra.old, kids: extra.kids, kidsH: extra.kidsH, kidsL: extra.kidsL, mutH: extra.mutH, mutL: extra.mutL, fam: famCount() });
  };
  const REC = o.rec ? { st: [], sv: [], bn: [], know: [] } : null;   // per-year state of every home (export.mjs → the film)
  const record = (y) => { if (!REC) return; const st = new Uint8Array(N), sv = new Float32Array(N), bn = new Int16Array(N); for (let i = 0; i < N; i++) { st[i] = alive[i] ? (liar[i] ? 2 : 1) : 0; sv[i] = sav[i]; bn[i] = born[i]; } REC.st.push(st); REC.sv.push(sv); REC.bn.push(bn);
    if (o.trackLiar != null && y <= 60) { const j = o.trackLiar, k = new Uint8Array(N); if (alive[j] && liar[j]) for (let i = 0; i < N; i++) k[i] = alive[i] && !liar[i] && knows(i, j) ? 1 : 0; REC.know.push(k); } };
  record(0);
  snap(0, { food: 0, gifts: 0, cheats: 0, left: 0, old: 0, kids: 0, kidsH: 0, kidsL: 0, mutH: 0, mutL: 0 });
  for (let y = 1; y <= o.years; y++) {
    const pop = []; for (let i = 0; i < N; i++) if (alive[i]) pop.push(i);
    const n = pop.length, share = o.LAG / Math.max(1, n);
    for (const i of pop) inc[i] = share;
    let gifts = 0, cheats = 0;
    for (let r = 0; r < o.M; r++) {
      for (let i = n - 1; i > 0; i--) { const k = Math.floor(Rp() * (i + 1)); const t = pop[i]; pop[i] = pop[k]; pop[k] = t; }
      for (let k = 0; k + 1 < n; k += 2) { const a = pop[k], b = pop[k + 1];
        const give = (x, y2) => { if (liar[x]) return; if (knows(x, y2)) return; inc[x] -= o.C; inc[y2] += o.B; gifts++; if (liar[y2]) { cheats++; cheated[x]++; learn(x, y2); } };
        give(a, b); give(b, a); }
    }
    if (o.G > 0) {                                    // gossip: each islander passes what they know to G friends (synchronous)
      const nk = know.slice();
      for (const i of pop) { const fr = friends[i].filter((f) => alive[f]); const cnt = Math.floor(o.G) + (Rg() < o.G % 1 ? 1 : 0); for (let g = 0; g < cnt && fr.length; g++) { const f = fr.splice(Math.floor(Rg() * fr.length), 1)[0]; const a = i * W, b = f * W; for (let w = 0; w < W; w++) nk[b + w] |= know[a + w]; } }
      know.set(nk);
    }
    let food = 0, left = 0, old = 0, kids = 0, kidsH = 0, kidsL = 0, mutH = 0, mutL = 0;
    for (const i of pop) { food += inc[i]; sav[i] += inc[i] - o.NEED; age[i]++; }
    for (const i of pop) { if (sav[i] < 0) { alive[i] = 0; left++; forget(i); } else if (age[i] >= 70) { alive[i] = 0; old++; forget(i); } }
    const empty = []; for (let i = 0; i < N; i++) if (!alive[i]) empty.push(i);
    const parents = pop.filter((i) => alive[i] && age[i] >= 20 && age[i] <= o.AMAX && sav[i] >= o.KID);
    for (let i = parents.length - 1; i > 0; i--) { const k = Math.floor(Rb() * (i + 1)); [parents[i], parents[k]] = [parents[k], parents[i]]; }
    for (const p of parents) { if (!empty.length) break; if (Rb() >= o.BIRTH) continue;
      const h = empty.splice(Math.floor(Rb() * empty.length), 1)[0], m = Rb() < o.MUT;
      alive[h] = 1; liar[h] = m ? 1 - liar[p] : liar[p]; age[h] = 18; sav[h] = o.KID / 2; sav[p] -= o.KID / 2; born[h] = y; cheated[h] = 0; fam[h] = fam[p]; know.fill(0, h * W, h * W + W);
      kids++; if (liar[h]) kidsL++; else kidsH++; if (m) { if (liar[h]) mutL++; else mutH++; } }
    snap(y, { food, gifts, cheats, left, old, kids, kidsH, kidsL, mutH, mutL }); record(y);
  }
  return { o, Y, friends, start, REC };
}
export const mean = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
