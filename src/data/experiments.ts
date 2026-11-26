import "server-only";

/**
 * Humanity Simulated — the record of every experiment.
 *
 * SERVER ONLY. Never import this file from a "use client" component: it holds the findings of
 * episodes that are not out yet. Pages read it through `@/lib/release` (getExperiments /
 * getExperiment), which strips everything but number, title and date until `releaseAt` has passed.
 *
 * Every number here comes from the episode's own sim.js at its own seed (epNN/FACTS.md, check.mjs).
 * Frame times, chapters and durations come from the final film (epNN/humanity_simulated_epNN_8min.mp4)
 * and its YouTube release package (epNN/YOUTUBE.md).
 */

export type SourceKind = "paper" | "book" | "report" | "news" | "blog";

export interface Source {
  authors: string;
  year: string;
  title: string;
  /** Journal, publisher or site, plain text. */
  venue: string;
  /** Deep link. null = no working link; render the venue only (and the note, if any). */
  url: string | null;
  kind: SourceKind;
  note?: string;
}

/** One still from the film. `t` = seconds into the film (for YouTube `&t=`). 960×540 JPEG. */
export interface Frame {
  src: string;
  t: number;
  alt: string;
}

/** `t` = seconds into the film. Same list as the YouTube description. */
export interface Chapter {
  t: number;
  label: string;
}

export interface Experiment {
  slug: string;
  /** Episode folder number (ep01…ep09). Used in file paths: /code/ep0N.sim.js, /frames/ep0N/. */
  ep: number;
  /** Order of release on the channel (1 = first out). Show this as the number on the site. */
  no: number;
  /** Plain site title. */
  title: string;
  /** The title on YouTube. Do NOT render it on the site (clickbait phrasing, e.g. EP01 says 10,000 but N = 60). */
  youtubeTitle: string;
  /** The one rule the experiment changes (world B), ≤ 8 words. v3 table column. */
  rule: string;
  /** What happens without the rule (world A), ≤ 10 words. v3 table column. */
  result: string;
  /** One or two sentences: the finding. */
  finding: string;
  /** The question, 2–3 sentences (detail page). */
  premise: string;
  worldA: { label: string; summary: string };
  worldB: { label: string; summary: string };
  /** The model's rules, numbered list on the detail page. */
  assumptions: string[];
  /** ISO-8601 with offset. null = date not set yet. */
  releaseAt: string | null;
  /** m:ss of the final film. */
  duration: string;
  /** 11-character YouTube video id. null until it is pasted in; links then go to the channel. */
  youtubeId: string | null;
  /** Agents in the model. */
  n: number;
  seed: number;
  seedNote: string;
  /** How long the model runs, lower case: "100 days". */
  horizon: string;
  /** Exactly 4, in film order: start → rule → break → result. */
  frames: Frame[];
  chapters: Chapter[];
  sources: Source[];
  /** Served path of the real model code. */
  codePath: string;
  codeLines: number;
  /** Key in src/data/curves.json (built by scripts/build-curves.mjs), or null if the episode has no single time curve. */
  curve: string | null;
  /** In-page simulator, only these three exist. */
  simulatorId: "ep01" | "ep06" | "ep09" | null;
}

export const SITE = {
  name: "Humanity Simulated",
  youtube: "https://www.youtube.com/@HumanitySimLab",
  patreon: "https://www.patreon.com/c/humanitysimlab",
  /** The one plain sentence allowed under the name (same size as body text). */
  description:
    "Short films about simple simulations of people. Each page has the model's rules, its code and its sources.",
};

const frames = (ep: number, items: [number, string][]): Frame[] =>
  items.map(([t, alt], i) => ({ src: `/frames/ep0${ep}/${i + 1}.jpg`, t, alt }));

const ch = (items: [string, string][]): Chapter[] =>
  items.map(([mmss, label]) => {
    const [m, s] = mmss.split(":").map(Number);
    return { t: m * 60 + s, label };
  });

export const EXPERIMENTS: Experiment[] = [
  {
    slug: "ep01-fair-coin-monopoly",
    ep: 1,
    no: 1,
    title: "The fair-coin economy",
    youtubeTitle: "I Simulated 10,000 Equal Humans — Within 100 Days, One Owned Everything",
    rule: "1% of all money shared each day",
    result: "2 of 60 own 75% by day 100",
    finding:
      "Every trade is a fair coin flip. By day 100, 53 of 60 people are nearly broke and two of them own three quarters of all the money.",
    premise:
      "Sixty people each start with $100. No skill, no cheating, no inheritance: each day brings 450 fair coin-flip trades, and the winner takes 20% of the poorer player's money. Can a perfectly fair game end in a monopoly?",
    worldA: {
      label: "World A: pure luck",
      summary: "Fair 50/50 trades, money conserved. By day 100 the two richest hold 75.4%, and 53 of 60 are below $35.",
    },
    worldB: {
      label: "World B: 1% shared each day",
      summary:
        "Same people, same coin flips; each day 1% of everyone's money is pooled and split equally. By day 100 the two richest hold 47.4% instead of 75.4%, and the poorer half holds 2.4% instead of nothing. 40 people are still below $35.",
    },
    assumptions: [
      "Closed economy: total money is fixed at $6,000 across 60 people ($100 each at the start).",
      "Each day has 450 random pairwise trades (15 per person on average); the stake is 20% of the poorer player's money (the yard-sale model).",
      "No production, spending or credit, unless the optional rules (daily sharing, interest) are switched on.",
    ],
    releaseAt: "2026-11-19T15:00:00+03:00",
    duration: "7:25",
    youtubeId: "p1e0-pqi_O4",
    n: 60,
    seed: 166,
    seedNote: "Typical run chosen from 300 scanned seeds.",
    horizon: "100 days",
    frames: frames(1, [
      [8, "Two blue blobs with $100 each, a coin between them and a stack of coins beside each"],
      [113, "A bet of $4: a small red blob with $24 next to a large gold blob with $396"],
      [164, "Wealth histogram: a long row of red blobs near $0 and two gold blobs holding 83%"],
      [217, "Two histograms side by side: no tax, and 1% tax"],
    ]),
    chapters: ch([
      ["0:00", "Two people, one fair coin"],
      ["1:00", "The hidden math"],
      ["1:59", "Past day 100"],
      ["2:50", "Can one tiny rule fix it?"],
      ["3:43", "Closer to the real world"],
      ["4:32", "What about talent?"],
      ["5:28", "Does it look like our world?"],
      ["6:27", "What 60 blobs taught us"],
    ]),
    sources: [
      {
        authors: "Chancel, L., Piketty, T., Saez, E. & Zucman, G.",
        year: "2022",
        title: "World Inequality Report 2022",
        venue: "World Inequality Lab",
        url: "https://wir2022.wid.world/",
        kind: "report",
        note: "Global wealth shares 2021: bottom 50% ≈ 2%, top 10% ≈ 76%.",
      },
      {
        authors: "Boghosian, B. M.",
        year: "2019",
        title: "The Inescapable Casino",
        venue: "Scientific American, 321(5), 70–77",
        url: "https://www.scientificamerican.com/article/is-inequality-inevitable/",
        kind: "news",
      },
    ],
    codePath: "/code/ep01.sim.js",
    codeLines: 52,
    curve: "ep01",
    simulatorId: "ep01",
  },
  {
    slug: "ep02-dating-app-paradox",
    ep: 2,
    no: 2,
    title: "The dating app",
    youtubeTitle: "I Simulated a Dating App With 5,000 People — 84% Stayed Alone",
    rule: "At most 3 matches at once",
    result: "84% still single after 30 days",
    finding:
      "In a small town, 94% of 5,000 singles pair up within a month. Inside an endless-catalog app with the same people, 84% are still alone.",
    premise:
      "Put 5,000 singles in a small town and nearly everyone finds a partner. Put the same people in a swipe app with a 70/30 gender ratio and an endless, popularity-ranked feed. What breaks?",
    worldA: {
      label: "World A: endless 70/30 app",
      summary:
        "Unlimited browsing piles likes onto the most popular profiles; overloaded inboxes make people pickier. After 30 days, 84% are single.",
    },
    worldB: {
      label: "World B: 3 matches at a time, 5 likes a day",
      summary: "Capping active matches at 3 and hiding full profiles more than doubles the couples (16.1% → 36.6%).",
    },
    assumptions: [
      "5,000 singles over 30 days. Looks L ~ N(0,1), which everyone roughly agrees on, plus private taste noise (σ = 0.6) for each pair.",
      "An inbox with more than 20 unread messages makes a person pickier (×0.85 a day); dry spells make them swipe more (×1.12 a day).",
      "A match becomes a couple with probability 0.12 / (load_a · load_b); couples leave the pool.",
    ],
    releaseAt: "2026-11-22T15:00:00+03:00",
    duration: "8:21",
    youtubeId: "dcuD-pKk2tw",
    n: 5000,
    seed: 7,
    seedNote: "Typical run from a 12-seed scan.",
    horizon: "30 days",
    frames: frames(2, [
      [8, "Two worlds side by side: the town, where 94% have paired, and the app"],
      [119, "Histogram of likes: most men under 200, a few over 700; couples fall from 94% to 34%"],
      [245, "One man with no options, one crowned woman buried in likes"],
      [376, "The normal app next to the app with one extra rule"],
    ]),
    chapters: ch([
      ["0:00", "Two worlds, one difference"],
      ["1:03", "Rule one: the catalog"],
      ["2:05", "Rule two: the ratio"],
      ["3:10", "Are the popular ones winning?"],
      ["4:11", "Two apps, side by side"],
      ["5:17", "One tiny rule"],
      ["6:22", "Checking against real people"],
      ["7:27", "Back to the two worlds"],
    ]),
    sources: [
      {
        authors: "Goldgeier, A. (Hinge)",
        year: "2017",
        title: "What's the biggest challenge men face on dating apps? A Q&A with Aviv Goldgeier, Junior Growth Engineer",
        venue: "Hinge company blog",
        url: null,
        kind: "blog",
        note: "Likes Gini ≈ 0.54 (men), 0.38 (women). The original post has since been removed.",
      },
      {
        authors: "Worst-Online-Dater",
        year: "2015",
        title: "Tinder Experiments II: Guys, unless you are really hot you are probably better off not wasting your time",
        venue: "Medium",
        url: "https://medium.com/@worstonlinedater/tinder-experiments-ii-guys-unless-you-are-really-hot-you-are-probably-better-off-not-wasting-your-2ddf370a6e9a",
        kind: "blog",
        note: "Informal analysis of Tinder likes, Gini ≈ 0.58.",
      },
    ],
    codePath: "/code/ep02.sim.js",
    codeLines: 204,
    curve: "ep02",
    simulatorId: null,
  },
  {
    slug: "ep05-liars-island",
    ep: 5,
    no: 3,
    title: "The liars' island",
    youtubeTitle: "I Put 1,000 Liars and 1,000 Honest People on an Island for 500 Years",
    rule: "Tell one friend about liars each year",
    result: "Population falls from 2,000 to 679",
    finding:
      "Liars wipe out the honest islanders within 40 years, then the island loses two thirds of its people, because nobody is left to cheat.",
    premise:
      "1,000 liars and 1,000 honest people share an island for 500 years. For two decades, lying pays. What happens when there is nobody left to lie to?",
    worldA: {
      label: "World A: nobody talks",
      summary:
        "With 2,000 people you meet the same person again about once every 200 years. By year 40 only 3 honest islanders are left; by year 500 the island has shrunk to 679.",
    },
    worldB: {
      label: "World B: one piece of gossip a year",
      summary:
        "Once a year each islander tells one friend who cheated them. Honest islanders grow past 1,700 and the island stays full, with 8× the food.",
    },
    assumptions: [
      "2,000 homes; everyone starts with 5 baskets of savings and eats 1 basket a year; the lagoon alone feeds about 600 people.",
      "10 random encounters a year; an honest gift costs 0.1 and is worth 0.36 to the receiver. A liar takes the gift and gives nothing back.",
      "A child copies the parent's way except 2% of the time. Both worlds start with the same people and the same first-year trades.",
    ],
    releaseAt: "2026-11-26T14:00:00+03:00",
    duration: "8:29",
    youtubeId: "7yOtRKy1F8s",
    n: 2000,
    seed: 16,
    seedNote: "Most typical of seeds 1–20 (plus 80 more islands for the gossip dial).",
    horizon: "500 years",
    frames: frames(5, [
      [52, "An island ringed with homes: liars in red, honest islanders in blue"],
      [148, "Year 20: liars' savings piling up as green stacks"],
      [257, "Two islands: one half empty, one still full"],
      [363, "Year 500 on the gossip island: almost everyone honest"],
    ]),
    chapters: ch([
      ["0:00", "One island, 500 years"],
      ["0:44", "The four rules"],
      ["1:59", "The first 25 years"],
      ["2:56", "Year 25 and after"],
      ["4:23", "One new rule"],
      ["5:21", "Two islands, side by side"],
      ["6:45", "Is any of this real?"],
      ["7:56", "Next time"],
    ]),
    sources: [
      {
        authors: "Axelrod, R.",
        year: "1980",
        title: "Effective Choice in the Prisoner's Dilemma",
        venue: "Journal of Conflict Resolution, 24(1), 3–25",
        url: "https://doi.org/10.1177/002200278002400101",
        kind: "paper",
      },
      {
        authors: "Dunbar, R. I. M., Marriott, A. & Duncan, N. D. C.",
        year: "1997",
        title: "Human Conversational Behavior",
        venue: "Human Nature, 8(3), 231–246",
        url: "https://doi.org/10.1007/BF02912493",
        kind: "paper",
      },
      {
        authors: "Feinberg, M., Willer, R. & Schultz, M.",
        year: "2014",
        title: "Gossip and Ostracism Promote Cooperation in Groups",
        venue: "Psychological Science, 25(3), 656–664",
        url: "https://doi.org/10.1177/0956797613510184",
        kind: "paper",
      },
    ],
    codePath: "/code/ep05.sim.js",
    codeLines: 78,
    curve: "ep05",
    simulatorId: null,
  },
  {
    slug: "ep06-ten-percent-tipping-point",
    ep: 6,
    no: 4,
    title: "The island and the lie",
    youtubeTitle: "I Simulated Brainwashing — It Only Took 10% to Control Everyone",
    rule: "One in ten checks before believing",
    result: "10% believers flip everyone by day 153",
    finding:
      "With 8% committed believers, the lie never passes 21% and ends the year at 16%. With 10%, it takes over all 1,000 islanders by day 153.",
    premise:
      "On a friendship network of 1,000 people, 900 know the truth and 100 believe a lie and will never change their minds. Nobody is stupid; everyone just listens to friends. How far does the lie get?",
    worldA: {
      label: "World A: 10% committed believers",
      summary:
        "100 believers on a preferential-attachment network flip the whole island by day 153. Placed on the best-connected people, 70 are enough, and faster (day 134).",
    },
    worldB: {
      label: "World B: one in ten checks first",
      summary:
        "If 10% of people check the rumor the first time they hear it, and then defend the truth, the lie peaks at 27% and never takes over.",
    },
    assumptions: [
      "Binary-agreement model (Xie et al. 2011) on a fixed Barabási–Albert friendship network: 1,000 people, 8 friends on average, at most 96.",
      "Hearing the other side once makes a person unsure; hearing a side while unsure makes them adopt it.",
      "Committed believers never switch. In world B, an ordinary person checks with probability 0.1 on first hearing the rumor.",
    ],
    releaseAt: "2026-11-29T19:00:00+03:00",
    duration: "8:25",
    youtubeId: null,
    n: 1000,
    seed: 10,
    seedNote: "Most typical of 20 seeds on four network measures (plus 300 islands for the dial).",
    horizon: "365 days",
    frames: frames(6, [
      [48, "Day 0 on the island: 900 know the truth (blue), 100 believe the lie (red)"],
      [96, "Nobody is stupid, everyone listens to friends"],
      [166, "Day 153: every islander red, the truth line on the chart at zero"],
      [340, "Day 114 with checkers: the lie stuck at 169 people"],
    ]),
    chapters: ch([
      ["0:00", "One island, one lie"],
      ["0:40", "How the islanders talk"],
      ["1:42", "The first hundred days"],
      ["2:54", "Why one in ten?"],
      ["3:59", "What if they're popular?"],
      ["5:01", "One new rule"],
      ["6:20", "Is any of this real?"],
      ["7:48", "Next time"],
    ]),
    sources: [
      {
        authors: "Xie, J., Sreenivasan, S., Korniss, G., Zhang, W., Lim, C. & Szymanski, B. K.",
        year: "2011",
        title: "Social consensus through the influence of committed minorities",
        venue: "Physical Review E, 84, 011130",
        url: "https://doi.org/10.1103/PhysRevE.84.011130",
        kind: "paper",
      },
      {
        authors: "Centola, D., Becker, J., Brackbill, D. & Baronchelli, A.",
        year: "2018",
        title: "Experimental evidence for tipping points in social convention",
        venue: "Science, 360(6393), 1116–1119",
        url: "https://doi.org/10.1126/science.aas8827",
        kind: "paper",
      },
      {
        authors: "Lerman, K., Yan, X. & Wu, X.-Z.",
        year: "2016",
        title: "The 'Majority Illusion' in Social Networks",
        venue: "PLoS ONE, 11(2), e0147617",
        url: "https://doi.org/10.1371/journal.pone.0147617",
        kind: "paper",
      },
      {
        authors: "Asch, S. E.",
        year: "1955",
        title: "Opinions and Social Pressure",
        venue: "Scientific American, 193(5), 31–35",
        url: "https://doi.org/10.1038/scientificamerican1155-31",
        kind: "paper",
      },
    ],
    codePath: "/code/ep06.sim.js",
    codeLines: 65,
    curve: "ep06",
    simulatorId: "ep06",
  },
  {
    slug: "ep04-pretty-privilege",
    ep: 4,
    no: 5,
    title: "The halo at work",
    youtubeTitle: "I Made 10 Humans Slightly More Attractive — They Took Half the Top Jobs",
    rule: "Judges cannot see faces",
    result: "Half the top jobs, 5.5% less skilled",
    finding:
      "A 10% kindness bias puts 10 equally talented workers into half the top jobs, and leaves them 5.5% less skilled after 20 years.",
    premise:
      "60 workers start with the same average talent. Ten of them are judged 10% more kindly, every time. What does that do to a career over 20 years?",
    worldA: {
      label: "World A: a 10% halo",
      summary:
        "The glowing sixth of the town ends with 30.2% of the money and 4 of the 8 top jobs, yet is 5.5% less skilled, because it gets less honest feedback.",
    },
    worldB: {
      label: "World B: blind judging",
      summary:
        "Same luck, no halo. The skill gap is gone, and the ten hold 15.5% of the money, close to a fair 16.7%. Across 40 seeds, blind judging lowers their share every time.",
    },
    assumptions: [
      "60 workers on a 5-step job ladder (24 / 18 / 10 / 6 / 2 places), paid $30k–$250k times productivity.",
      "Reputation keeps 75% of last year's view; yearly performance has 15% luck noise.",
      "Each year the 30 workers who look worst get hard corrective feedback (+0.02 skill).",
    ],
    releaseAt: "2026-12-06T19:00:00+03:00",
    duration: "7:59",
    youtubeId: null,
    n: 60,
    seed: 9,
    seedNote: "Seed closest to the medians of a 40-seed scan (skill gap negative in 40 of 40).",
    horizon: "20 years",
    frames: frames(4, [
      [47, "An empty job ladder, helpers to managers, with 60 workers in front"],
      [105, "Ten workers with gold halos: judged 10% more kindly"],
      [227, "Year 20: the ladder, one glowing worker 19 years as a lead"],
      [348, "Year 20 side by side: as before, and with blind judging"],
    ]),
    chapters: ch([
      ["0:00", "Ten slightly more attractive people"],
      ["0:39", "The town, Mia, Leo and the glow"],
      ["1:51", "Year one: one point"],
      ["2:56", "Twenty years later"],
      ["3:53", "The twist: nobody tells them"],
      ["5:12", "The fix: blind judging"],
      ["6:25", "Is any of this real?"],
      ["7:24", "Next time: the liars' island"],
    ]),
    sources: [
      {
        authors: "Hamermesh, D. S. & Biddle, J. E.",
        year: "1994",
        title: "Beauty and the Labor Market",
        venue: "American Economic Review, 84(5), 1174–1194",
        url: "https://www.jstor.org/stable/2117767",
        kind: "paper",
      },
      {
        authors: "Todorov, A., Mandisodza, A. N., Goren, A. & Hall, C. C.",
        year: "2005",
        title: "Inferences of Competence from Faces Predict Election Outcomes",
        venue: "Science, 308(5728), 1623–1626",
        url: "https://doi.org/10.1126/science.1110589",
        kind: "paper",
      },
      {
        authors: "Ruffle, B. J. & Shtudiner, Z.",
        year: "2015",
        title: "Are Good-Looking People More Employable?",
        venue: "Management Science, 61(8), 1760–1776",
        url: "https://doi.org/10.1287/mnsc.2014.1927",
        kind: "paper",
      },
    ],
    codePath: "/code/ep04.sim.js",
    codeLines: 84,
    curve: "ep04",
    simulatorId: null,
  },
  {
    slug: "ep07-rules-for-the-crown",
    ep: 7,
    no: 6,
    title: "Rules for the crown",
    youtubeTitle: "Why Good Leaders Fall and Selfish Ones Stay",
    rule: "The crown needs 31 keys, not 5",
    result: "The good king lasts 2 years",
    finding:
      "A king who spends 90% of the treasury on roads and schools is gone in 2 years, because only 5 keyholders decide who keeps the crown.",
    premise:
      "Put an incorruptible ruler on a throne that 5 keyholders can take away. Then let the crown need 31 keyholders instead. Built on Bueno de Mesquita's selectorate theory.",
    worldA: {
      label: "World A: 5 keys hold the crown",
      summary:
        "Paying 5 keyholders privately is cheaper than building roads for 60 people. Good rulers are outbid by challengers; only rulers who take survive.",
    },
    worldB: {
      label: "World B: 31 keys needed",
      summary:
        "Paying 31 people privately costs more than building for everyone (multiplier λ = 2.5). The same selfish ruler now builds schools and roads to stay.",
    },
    assumptions: [
      "60 islanders, output taxed at 50%; public works raise everyone's output and wear out 12% a year.",
      "A keyholder values a year under a ruler at K/W + λ·G/N (λ = 2.5). A challenger appears with 45% probability a year; promises are believed 80% of the time.",
      "If most keyholders switch, the crown changes hands. A gold mine makes the treasury independent of what the people produce.",
    ],
    releaseAt: "2026-12-10T19:00:00+03:00",
    duration: "7:53",
    youtubeId: null,
    n: 60,
    seed: 33,
    seedNote: "One calibrated island run for 40 years.",
    horizon: "40 years",
    frames: frames(7, [
      [45, "An island with a king on the throne and five keyholders in purple"],
      [249, "With 5 keys, buying beats building: two kings and five keyholders"],
      [303, "A gold mine opens next to the throne"],
      [444, "Two islands: the crown needs 5 keys, and 31 keys"],
    ]),
    chapters: ch([
      ["0:00", "An angel on the throne"],
      ["0:37", "The five keys"],
      ["2:06", "What if only angels rule?"],
      ["3:28", "Twenty coins or four"],
      ["4:15", "A gold mine"],
      ["5:09", "Is it only our island?"],
      ["6:06", "One rule changes"],
      ["7:30", "Your turn"],
    ]),
    sources: [
      {
        authors: "Bueno de Mesquita, B., Smith, A., Siverson, R. M. & Morrow, J. D.",
        year: "2003",
        title: "The Logic of Political Survival",
        venue: "MIT Press",
        url: "https://mitpress.mit.edu/9780262524407/the-logic-of-political-survival/",
        kind: "book",
      },
      {
        authors: "Ross, M. L.",
        year: "2012",
        title: "The Oil Curse: How Petroleum Wealth Shapes the Development of Nations",
        venue: "Princeton University Press",
        url: "https://press.princeton.edu/books/paperback/9780691159638/the-oil-curse",
        kind: "book",
      },
      {
        authors: "Gottlieb, J. & Vives, R.",
        year: "2010",
        title: "Is a city manager worth $800,000?",
        venue: "Los Angeles Times",
        url: "https://www.pulitzer.org/winners/los-angeles-times-4",
        kind: "news",
        note: "Linked via the Pulitzer Prize archive (2011 Public Service).",
      },
    ],
    codePath: "/code/ep07.sim.js",
    codeLines: 85,
    curve: null,
    simulatorId: null,
  },
  {
    slug: "ep08-why-nobody-has-friends",
    ep: 8,
    no: 7,
    title: "The friendless city",
    youtubeTitle: "Why Nobody Has Friends Anymore (I Simulated It)",
    rule: "One fixed table every Tuesday",
    result: "48 of 60 end with no friends",
    finding:
      "60 friendly newcomers all want friends. Every evening out needs an invite that can be cancelled, and 48 of the 60 end with none.",
    premise:
      "A casual friend takes about 50 hours of time together (Hall 2019). In a city where every evening starts with a text, how many of 60 newcomers get there in 100 days?",
    worldA: {
      label: "World A: invite-only city",
      summary:
        "Invites to near-strangers work 17% of the time, and each failure makes people ask less. Weekly invites fall from 116 to 59; 48 of 60 end alone.",
    },
    worldB: {
      label: "World B: one fixed Tuesday table",
      summary:
        "Groups of six share a standing weekly table, no texting needed. Invites between tablemates happen 59% of the time (cold invites: 17%), and the number with no friends falls from 48 to 16.",
    },
    assumptions: [
      "60 newcomers over 100 evenings; a casual friend = 50 shared hours (Hall 2019); closeness fades 0.3% a day.",
      "Model assumption: the chance a plan is cancelled falls as closeness rises (calibrated to the 40-seed median of 48 of 60 alone).",
      "Model assumption: a failed invite lowers the inviter's chance of asking the next evening (×0.8).",
    ],
    releaseAt: "2026-12-13T19:00:00+03:00",
    duration: "6:04",
    youtubeId: null,
    n: 60,
    seed: 27,
    seedNote: "Exactly the median of 40 scanned seeds (48 / 5 / 16 alone).",
    horizon: "100 days",
    frames: frames(8, [
      [8, "Sixty newcomers at their screens, a few thin lines between them"],
      [42, "June, circled, asks: dinner tonight?"],
      [138, "The modern city on day 100: a few scattered friendships"],
      [337, "With a fixed Tuesday table: a dense web of friendships"],
    ]),
    chapters: ch([
      ["0:00", "60 friendly people, one new city"],
      ["0:34", "June's first week"],
      ["1:32", "Why people stop asking"],
      ["2:24", "The same people in an old town"],
      ["3:14", "What the town square gave them"],
      ["3:55", "The real world"],
      ["4:38", "One small rule"],
      ["5:43", "Your turn"],
    ]),
    sources: [
      {
        authors: "Hall, J. A.",
        year: "2019",
        title: "How many hours does it take to make a friend?",
        venue: "Journal of Social and Personal Relationships, 36(4), 1278–1296",
        url: "https://doi.org/10.1177/0265407518761225",
        kind: "paper",
      },
      {
        authors: "Office of the U.S. Surgeon General",
        year: "2023",
        title: "Our Epidemic of Loneliness and Isolation",
        venue: "U.S. Department of Health and Human Services",
        url: "https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf",
        kind: "report",
        note: "Time with friends from the American Time Use Survey, 2003–2020.",
      },
      {
        authors: "Cox, D. A.",
        year: "2021",
        title: "The State of American Friendship: Change, Challenges, and Loss",
        venue: "Survey Center on American Life",
        url: "https://www.americansurveycenter.org/research/the-state-of-american-friendship-change-challenges-and-loss/",
        kind: "report",
      },
    ],
    codePath: "/code/ep08.sim.js",
    codeLines: 102,
    curve: "ep08",
    simulatorId: null,
  },
  {
    slug: "ep03-ai-paradise-paradox",
    ep: 3,
    no: 8,
    title: "The robot town",
    youtubeTitle: "I Replaced 60 Humans' Jobs With Free AI — Instead of Paradise, 90% Starved",
    rule: "Half of robot profit shared equally",
    result: "50 of 55 workers cannot buy food",
    finding:
      "Robots make 9× more food at 80% lower prices, yet 50 of the 55 laid-off workers cannot afford a single basket.",
    premise:
      "A town of 60 gets free robots that work 10× faster than people. The warehouses fill with cheap food. Who can still buy it?",
    worldA: {
      label: "World A: robots, no dividend",
      summary:
        "Competition makes all 5 shops switch to robots by week 14. Workers' share of the money falls from 50% to 3.7%; 50 of 55 go hungry next to full warehouses.",
    },
    worldB: {
      label: "World B: half the robot profit shared",
      summary:
        "Sharing half of the automated profit equally among all 60 leaves nobody hungry, raises what people eat by 29%, and keeps the owners' profit the same ($150 a week).",
    },
    assumptions: [
      "55 workers and 5 shop owners over 52 weeks; wage $15 a week before robots, basket $10, a worker makes 1.8 baskets a week, a robot 18.",
      "A shop that switches keeps 1 human supervisor; robot-made food never sells below $2; buyers split by price (logit).",
      "The dividend was tested at 10%, 20%, 30%, 40% and 50% of profit.",
    ],
    releaseAt: "2026-12-17T19:00:00+03:00",
    duration: "7:49",
    youtubeId: null,
    n: 60,
    seed: 6,
    seedNote: "Typical run: 11 of 12 scanned seeds end with 50 of 55 workers hungry.",
    horizon: "52 weeks",
    frames: frames(3, [
      [8, "A small robot next to a coin"],
      [90, "Five shops and 55 workers; wages and spending go round in a circle"],
      [226, "Shops stacked with food while 50 of 55 workers, grey, cannot buy any"],
      [316, "Week 52 side by side: no change, and a robot dividend"],
    ]),
    chapters: ch([
      ["0:00", "Robots that do any job"],
      ["1:02", "The town before the robots"],
      ["1:58", "The first robot"],
      ["2:53", "The dream comes true?"],
      ["3:52", "Where did it go wrong?"],
      ["4:44", "The same year, twice"],
      ["5:48", "Is any of this real?"],
      ["6:52", "What the town taught us"],
    ]),
    sources: [
      {
        authors: "Acemoglu, D. & Restrepo, P.",
        year: "2020",
        title: "Robots and Jobs: Evidence from US Labor Markets",
        venue: "Journal of Political Economy, 128(6), 2188–2244",
        url: "https://doi.org/10.1086/705716",
        kind: "paper",
      },
      {
        authors: "Cazzaniga, M. et al.",
        year: "2024",
        title: "Gen-AI: Artificial Intelligence and the Future of Work",
        venue: "IMF Staff Discussion Note SDN/2024/001",
        url: "https://www.imf.org/en/Publications/Staff-Discussion-Notes/Issues/2024/01/14/Gen-AI-Artificial-Intelligence-and-the-Future-of-Work-542379",
        kind: "report",
        note: "About 40% of jobs worldwide exposed to AI, 60% in advanced economies.",
      },
      {
        authors: "Jones, D. & Marinescu, I.",
        year: "2022",
        title: "The Labor Market Impacts of Universal and Permanent Cash Transfers: Evidence from the Alaska Permanent Fund",
        venue: "American Economic Journal: Economic Policy, 14(2), 315–340",
        url: "https://doi.org/10.1257/pol.20190299",
        kind: "paper",
      },
    ],
    codePath: "/code/ep03.sim.js",
    codeLines: 123,
    curve: "ep03",
    simulatorId: null,
  },
  {
    slug: "ep09-housing-market-city",
    ep: 9,
    no: 9,
    title: "The city that kept building",
    youtubeTitle: "I Simulated a City That Built 74 Homes. The Young Got 13",
    rule: "City builds 3 cost-rent homes a year",
    result: "Builder finished 74 homes; the young bought 13",
    finding:
      "The city keeps building, yet landlords bidding with rent and a builder pacing supply leave 36 young workers mostly renting: they buy 13 of the 98 homes sold. A $10k grant adds one.",
    premise:
      "36 young workers save from their wages. 9 small landlords bid with rent in mind, a builder paces supply to protect prices, rates jump from 3% to 7%, and a politician hands out a $10k grant. Then the same city runs again with homes rented at cost.",
    worldA: {
      label: "World A: the market",
      summary:
        "Cheap money inflates landlords' bids and the builder finishes homes only as fast as they sell: 74 in 12 years. The young buy 13 of the 98 homes sold, and median rent takes 34% of pay. A $10k grant in years 5–8 adds one young buyer.",
    },
    worldB: {
      label: "World B: 3 cost-rent homes a year",
      summary:
        "The city builds 3 homes a year on public land and rents them at cost ($10.4k a year). By year 12, 25 of the 36 young live in them, and median rent falls from 34% to 20% of pay.",
    },
    assumptions: [
      "36 young workers ($38k–$72k real wages, +1% a year), 12 owners with one home each, 9 small landlords with 4 rentals each, plus the builder, the bank and the politician.",
      "A young bid is capped by a 28% mortgage-to-income ratio (30 years) and a 10% deposit; a landlord bids what the rent is worth at the interest rate plus a margin.",
      "The builder can finish up to 20 homes a year and picks the most profitable number; prices fall at most 2% a year.",
    ],
    releaseAt: null,
    duration: "6:16",
    youtubeId: null,
    n: 60,
    seed: 29,
    seedNote: "Most typical of 40 scanned seeds.",
    horizon: "12 years",
    frames: frames(9, [
      [30, "Rows of new homes; the few bought by young workers in green"],
      [70, "The bank stands next to a sign: interest 3%"],
      [264, "Every offer for a home in year 8: young bids on the left, the price at $383k"],
      [330, "Same city, one change: homes built by the city in purple"],
    ]),
    chapters: ch([
      ["0:00", "74 new homes, 36 young workers"],
      ["0:35", "Leo's deposit"],
      ["1:03", "Lisa and cheap money"],
      ["2:04", "The builder's math"],
      ["2:52", "When rates jump"],
      ["3:35", "The grant"],
      ["4:16", "Who sets the price"],
      ["5:19", "Same city, one change"],
    ]),
    sources: [
      {
        authors: "National Association of Realtors",
        year: "2025",
        title: "Profile of Home Buyers and Sellers",
        venue: "NAR Research",
        url: "https://www.nar.realtor/research-and-statistics/research-reports/highlights-from-the-profile-of-home-buyers-and-sellers",
        kind: "report",
        note: "Median first-time buyer age 40, against 29 in 1981.",
      },
      {
        authors: "Joint Center for Housing Studies of Harvard University",
        year: "2026",
        title: "America's Rental Housing 2026",
        venue: "Harvard JCHS",
        url: "https://www.jchs.harvard.edu/press-releases/new-report-finds-cooling-rental-markets-affordability-crisis-deepens-renters",
        kind: "report",
        note: "Almost half of renter households spend over 30% of income on housing.",
      },
      {
        authors: "UK Competition and Markets Authority",
        year: "2024",
        title: "Housebuilding market study: final report",
        venue: "GOV.UK",
        url: "https://www.gov.uk/cma-cases/housebuilding-market-study",
        kind: "report",
        note: "Para 4.108: build-out paced to local absorption rates.",
      },
      {
        authors: "Carozzi, F., Hilber, C. A. L. & Yu, X.",
        year: "2024",
        title: "On the economic impacts of mortgage credit expansion policies: Evidence from Help to Buy",
        venue: "Journal of Urban Economics, 139, 103611",
        url: "https://doi.org/10.1016/j.jue.2023.103611",
        kind: "paper",
      },
      {
        authors: "Litschauer, K.",
        year: "2025",
        title: "“Das rote Wien”: long term effects of social democratic housing policy",
        venue: "Friedrich-Ebert-Stiftung",
        url: "https://collections.fes.de/publikationen/content/titleinfo/1962520",
        kind: "report",
      },
      {
        authors: "Knoll, K., Schularick, M. & Steger, T.",
        year: "2017",
        title: "No Price Like Home: Global House Prices, 1870–2012",
        venue: "American Economic Review, 107(2), 331–353",
        url: "https://doi.org/10.1257/aer.20150501",
        kind: "paper",
      },
    ],
    codePath: "/code/ep09.sim.js",
    codeLines: 125,
    curve: "ep09",
    simulatorId: "ep09",
  },
];
