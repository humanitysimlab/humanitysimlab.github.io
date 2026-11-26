// sim.js — EP06 "I Simulated Brainwashing — It Only Took 10% to Control Everyone". Every narrated number comes from here (FACTS.md, check.mjs).
// Model: the binary-agreement model of Xie et al. (2011, Phys. Rev. E 84, 011130), listener-only version, on a fixed friendship network.
// One tick = one day. N islanders, each with friends (fixed graph, same in every world for a given seed).
//  • Day 0: everyone believes the truth (T). A few "true believers" (committed) are added: they believe the rumor (R),
//    say it every day, and never change their mind.
//  • Every day, everyone (random order) says what they believe to one random friend. Someone unsure picks one side at random.
//  • Listener: hear the other side once → unsure (U). Unsure and hear a side → you take that side. (Hear it twice → you switch.)
//    Agreement (`agree`, the original model): when the listener already holds what they hear, speaker AND listener settle on it.
//  • World B (the one rule change, `check`): when you hear the rumor for the first time, with probability `check` you go and
//    check it; it is false, so you become a "checker": you keep the truth for good and keep saying it (a committed truth-teller).
//  • `hubs`: the true believers are put on the most-connected islanders instead of random ones.
export const BASE = { seed: 1, N: 1000, K: 8, days: 365, p: 0.1, hubs: false, check: 0, net: 'ba', agree: true };
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// friendship network: 'ba' = preferential attachment (a few islanders know many people), 'er' = everyone ≈ K friends
export function network(seed, N, K, kind) {
  const R = rng(seed * 104729 + 7), adj = Array.from({ length: N }, () => []);
  const link = (a, b) => { if (a === b || adj[a].includes(b)) return false; adj[a].push(b); adj[b].push(a); return true; };
  if (kind === 'er') { const want = N * K / 2; let made = 0; while (made < want) if (link(Math.floor(R() * N), Math.floor(R() * N))) made++; }
  else { const m = K / 2, ends = []; for (let i = 0; i <= m; i++) for (let j = 0; j < i; j++) { link(i, j); ends.push(i, j); }
    for (let i = m + 1; i < N; i++) { let got = 0; while (got < m) { const t = ends[Math.floor(R() * ends.length)]; if (link(i, t)) { ends.push(i, t); got++; } } } }
  return adj;
}
export function run(opt = {}) {
  const o = { ...BASE, ...opt }, N = o.N, adj = o.adj || network(o.seed, N, o.K, o.net);
  const Rs = rng(o.seed * 7919 + 13), Rt = rng(o.seed * 15485863 + 1), Rc = rng(o.seed * 32452843 + 2);   // streams: seeding, talk, checking
  const st = new Uint8Array(N), fixed = new Uint8Array(N);   // st: 0 truth, 1 unsure, 2 rumor; fixed: 1 true believer (rumor), 2 checker (truth)
  const nB = Math.round(o.p * N), order = [...Array(N).keys()];
  if (o.hubs) order.sort((a, b) => adj[b].length - adj[a].length || a - b);
  else for (let i = N - 1; i > 0; i--) { const k = Math.floor(Rs() * (i + 1)); [order[i], order[k]] = [order[k], order[i]]; }
  const believers = order.slice(0, nB); for (const b of believers) { st[b] = 2; fixed[b] = 1; }
  const checkDay = new Int32Array(N).fill(-1), heard = new Uint8Array(N), heardR = new Int32Array(N), atSwitch = new Int32Array(N), switchDay = new Int32Array(N).fill(-1), flips = new Int32Array(N);
  const Y = [], REC = o.rec ? [] : null, talks = o.rec ? [] : null;
  const snap = (d) => { let t = 0, u = 0, r = 0, c = 0, ill = 0; for (let i = 0; i < N; i++) { if (st[i] === 0) t++; else if (st[i] === 1) u++; else r++; if (fixed[i] === 2) c++;
      if (d === 0 && adj[i].length) { let k = 0; for (const j of adj[i]) if (fixed[j] === 1) k++; if (k / adj[i].length >= 0.5) ill++; } }
    Y.push({ day: d, truth: t, unsure: u, rumor: r, checkers: c, illusion: d === 0 ? ill : undefined }); if (REC) REC.push(Uint8Array.from(st)); };
  snap(0);
  const seq = [...Array(N).keys()];
  for (let d = 1; d <= o.days; d++) {
    for (let i = N - 1; i > 0; i--) { const k = Math.floor(Rt() * (i + 1)); const x = seq[i]; seq[i] = seq[k]; seq[k] = x; }
    const dayTalk = talks ? [] : null;
    for (const s of seq) {
      const f = adj[s]; if (!f.length) continue;
      const l = f[Math.floor(Rt() * f.length)];
      const word = st[s] === 1 ? (Rt() < 0.5 ? 0 : 2) : st[s];     // what the speaker says: 0 truth, 2 rumor
      if (dayTalk && (!o.talkSet || (o.talkSet.has(s) && o.talkSet.has(l)))) dayTalk.push(s, l, word);   // the film's talk record (only among the shown islanders when talkSet is given)
      if (fixed[l]) continue;
      if (word === 2 && !heard[l]) { heard[l] = 1; if (o.check > 0 && Rc() < o.check) { fixed[l] = 2; st[l] = 0; checkDay[l] = d; continue; } }
      const has = st[l] === 1 || st[l] === word;              // the listener already holds that side (sure or unsure)
      if (word === 2) heardR[l]++;
      const was = st[l];
      if (has) { st[l] = word; if (o.agree && !fixed[s]) { if (st[s] !== 2 && word === 2) { switchDay[s] = d; atSwitch[s] = heardR[s]; flips[s]++; } st[s] = word; } }   // agreement: both settle on it
      else st[l] = 1;                                          // the other side: now unsure
      if (st[l] === 2 && was !== 2) { switchDay[l] = d; atSwitch[l] = heardR[l]; flips[l]++; }
    }
    if (dayTalk) talks.push(dayTalk);
    snap(d);
  }
  const ordinary = N - nB;
  return { o, adj, believers, Y, REC, talks, ordinary, fixed, checkDay, heardR, atSwitch, switchDay, flips,
    // first day the whole island (every ordinary islander) believes the rumor; -1 = never
    allDay: (Y.find((y) => y.rumor === N) || { day: -1 }).day };
}
