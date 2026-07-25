import type { MatchStatus, MatchdayStatus } from "@/features/competition-catalog/types";
import type { MatchPrediction } from "@/features/predictions/types";

/**
 * Same value shape as `MatchPrediction` (a result pick or a score pick):
 * reused directly, since there is nothing personal about the shape itself,
 * only about who it is attached to. Aliased so this feature's own domain
 * language does not read as borrowing the strictly-personal
 * `predictions` DTOs.
 */
export type RevealedPrediction = MatchPrediction;

/**
 * A single member's pick for one match, only ever populated once that
 * match's prediction window has closed (see `isPredictionRevealed` in
 * `src/features/predictions/rules.ts`). `prediction` is `null` when the
 * member never submitted one for this match — still worth showing, since
 * transparency includes who didn't participate.
 */
export type MemberMatchPrediction = Readonly<{
  poolMembershipId: string;
  displayName: string | null;
  prediction: RevealedPrediction | null;
  /** Only set once the match is `finished` and a score has been calculated. */
  pointsEarned: number | null;
  /** Only set together with `pointsEarned`. */
  wasExactScore: boolean | null;
}>;

export type TransparencyMatch = Readonly<{
  matchId: string;
  homeTeamName: string;
  homeTeamShortName: string | null;
  awayTeamName: string;
  awayTeamShortName: string | null;
  startsAt: string;
  matchStatus: MatchStatus;
  /** Official score, only set once `matchStatus` is `finished`. */
  homeScore: number | null;
  awayScore: number | null;
  /** Whether the prediction window for this match has closed. When
   * `false`, `members` is always an empty array: nothing is revealed yet,
   * not even who has already submitted a prediction. */
  isRevealed: boolean;
  members: ReadonlyArray<MemberMatchPrediction>;
}>;

export type TransparencyMatchday = Readonly<{
  id: string;
  number: number;
  name: string | null;
  status: Extract<MatchdayStatus, "published" | "finished">;
  matches: ReadonlyArray<TransparencyMatch>;
  /** Membership ids that earned the perfect matchday bonus. Always empty
   * until the matchday itself is `finished`. */
  perfectMatchdayMembershipIds: ReadonlyArray<string>;
}>;

export type PoolTransparencyView = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  selectedMatchdayId: string | null;
  matchdays: ReadonlyArray<TransparencyMatchday>;
}>;
