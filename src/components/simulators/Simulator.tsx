"use client";

import dynamic from "next/dynamic";

// Client-side code splitting: each simulator (and the episode model it bundles) is its own chunk,
// fetched only when a published page renders it. Rendering it from the server page with next/dynamic
// would put all three models into the page chunk, unreleased episodes included.
const Wealth = dynamic(() => import("./WealthSimulator").then((m) => m.WealthSimulator), { ssr: false });
const Tipping = dynamic(() => import("./TippingPointSimulator").then((m) => m.TippingPointSimulator), { ssr: false });
const Housing = dynamic(() => import("./HousingSimulator").then((m) => m.HousingSimulator), { ssr: false });

export function Simulator({ id }: { id: "ep01" | "ep06" | "ep09" }) {
  if (id === "ep01") return <Wealth />;
  if (id === "ep06") return <Tipping />;
  return <Housing />;
}
