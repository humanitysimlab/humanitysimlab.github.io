declare module "@/simulations/ep01.js" {
  export const BASE: {
    seed: number;
    N: number;
    start: number;
    stake: number;
    tradesPerDay: number;
  };
  export const COLLAPSE: number;
  export function run(opts?: {
    seed?: number;
    N?: number;
    days?: number;
    tax?: number;
    interest?: number;
    p?: ((a: number, b: number) => number) | null;
    init?: ((w: Float64Array) => void) | null;
    keepTrades?: number;
  }): {
    days: Float64Array[];
    trades: number[][][];
    N: number;
    D: number;
  };
  export function share(w: Float64Array | number[], k: number): number;
  export function below(w: Float64Array | number[], v: number): number;
  export function wealthAt(R: ReturnType<typeof run>, day: number): Float64Array;
  export function collapseDay(R: ReturnType<typeof run>): number;
}

declare module "@/simulations/ep06.js" {
  export const BASE: {
    seed: number;
    N: number;
    K: number;
    days: number;
    p: number;
    hubs: boolean;
    check: number;
    net: "ba" | "er";
    agree: boolean;
  };
  export function network(seed: number, N: number, K: number, kind: "ba" | "er"): number[][];
  export function run(opts?: Partial<typeof BASE> & { adj?: number[][]; rec?: boolean }): {
    o: typeof BASE;
    adj: number[][];
    believers: number[];
    Y: Array<{
      day: number;
      truth: number;
      unsure: number;
      rumor: number;
      checkers: number;
      illusion?: number;
    }>;
    REC: Uint8Array[] | null;
    ordinary: number;
    fixed: Uint8Array;
    allDay: number;
  };
}

declare module "@/simulations/ep09.js" {
  export const BASE: {
    seed: number;
    YEARS: number;
    NY: number;
    NO: number;
    NL: number;
    LH: number;
    COST: number;
    P0: number;
    RENT0: number;
    RENT_EL: number;
    RATE: number[];
    WAGE_G: number;
    SAVE: number;
    PAY: number;
    TERM: number;
    DEP: number;
    K_LO: number;
    K_HI: number;
    G_FIX: number;
    P_OWN: number;
    CAP: number;
    CUT: number;
    LANDB: number;
    TURN: number;
    grant: boolean;
    GRANT: number;
    GRANT_FROM: number;
    GRANT_TO: number;
    city: boolean;
    CITY_N: number;
    CITY_LAND: number;
    CITY_RENT: number;
  };
  export function run(opts?: Partial<typeof BASE>): {
    o: typeof BASE;
    years: Array<{
      t: number;
      r: number;
      P0: number;
      price: number;
      rent: number;
      cityRent: number;
      n: number;
      k: number;
      profit: number;
      grant: number;
      owners: number;
      inCity: number;
      sold: Array<[number, string]>;
    }>;
    Y: Array<{
      id: number;
      wage: number;
      save: number;
      owns: boolean;
      city: boolean;
      cityFrom: number;
      boughtAt: number;
      paid: number;
      rentPaid: number;
      rentCity: number;
    }>;
    I: Array<{
      id: number;
      kind: string;
      homes: number;
      bought: number;
    }>;
  };
  export function stats(res: ReturnType<typeof run>): {
    sold: number;
    built: number;
    toYoung: number;
    owners: number;
    inCity: number;
    peak: number;
    last: number;
    rent1: number;
    rentPeak: number;
    share1: number;
    share8: number;
    share12: number;
    saveMed: number;
    rentToLandlords: number;
    rentToCity: number;
    frozen: number;
    invBought: number;
  };
}
