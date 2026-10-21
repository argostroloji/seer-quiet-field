export type AppKey = "home" | "app" | "deep" | "futarchy" | "opportunity" | "risk";

export const APPS: {
  key: AppKey;
  href: string;
  name: string;
  short: string;
  question: string;
  live: string; // the production Seer surface this redesigns
}[] = [
  { key: "home", href: "/", name: "Seer", short: "Home", question: "What is Seer and how do the apps fit together?", live: "https://seer.pm" },
  { key: "app", href: "/app", name: "Seer app", short: "Markets", question: "Find any market, see everything about it.", live: "https://app.seer.pm" },
  { key: "deep", href: "/deep", name: "Deep", short: "Deep", question: "Across a big field of outcomes, where does attention concentrate?", live: "https://deep.seer.pm" },
  { key: "futarchy", href: "/futarchy", name: "Futarchy", short: "Futarchy", question: "If this passes vs. if it doesn't — what does the market expect?", live: "https://futarchy.fi" },
  { key: "opportunity", href: "/opportunity", name: "Opportunity Markets", short: "Opportunity", question: "Which submissions does the market expect to be selected?", live: "https://opportunity.seer.pm" },
  { key: "risk", href: "/risk", name: "Risk Pricing", short: "Risk", question: "How risky is each protocol relative to the others?", live: "https://risk.seer.pm" },
];
