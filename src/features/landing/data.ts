import { CircleCheck, Lock, Trophy, type LucideIcon } from "lucide-react";

// Static, illustrative landing data. Club names are proper nouns (not i18n);
// player names and scores are fictional placeholders shared by the previews.

export type Match = {
  away: string;
  awayScore: number;
  highlighted: boolean;
  home: string;
  homeScore: number;
};

export type RankingEntry = {
  gold: boolean;
  name: string;
  pos: number;
  pts: number;
};

export type FeatureKey = "free" | "private" | "global";

export type FeatureItem = {
  icon: LucideIcon;
  key: FeatureKey;
};

export const MATCHDAY = 12;

export const matches: Match[] = [
  { home: "Caracas FC", homeScore: 1, awayScore: 4, away: "Dep. Táchira", highlighted: true },
  { home: "Dep. La Guaira", homeScore: 1, awayScore: 1, away: "Carabobo FC", highlighted: false },
  { home: "Pto. Cabello", homeScore: 0, awayScore: 2, away: "Metropolitanos FC", highlighted: false },
];

export const ranking: RankingEntry[] = [
  { pos: 1, name: "Luis M.", pts: 86, gold: true },
  { pos: 2, name: "Andrea P.", pts: 81, gold: false },
  { pos: 3, name: "Carlos R.", pts: 78, gold: false },
  { pos: 4, name: "Gabriela T.", pts: 74, gold: false },
  { pos: 5, name: "José D.", pts: 70, gold: false },
];

// Shared by the hero trust row and the app-preview feature list.
export const featureItems: FeatureItem[] = [
  { icon: CircleCheck, key: "free" },
  { icon: Lock, key: "private" },
  { icon: Trophy, key: "global" },
];
