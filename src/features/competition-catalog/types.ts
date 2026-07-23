import type {
  matchdayStatuses,
  matchStatuses,
  seasonStatuses,
} from "./constants";

export type SeasonStatus = (typeof seasonStatuses)[number];
export type MatchdayStatus = (typeof matchdayStatuses)[number];
export type MatchStatus = (typeof matchStatuses)[number];

export type SeasonOption = Readonly<{
  id: string;
  competitionId: string;
  competitionName: string;
  code: string;
  name: string;
}>;

export type AdminCompetition = Readonly<{
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  seasons: ReadonlyArray<{
    id: string;
    code: string;
    name: string;
    status: SeasonStatus;
    startsOn: string | null;
    endsOn: string | null;
  }>;
}>;

export type TeamOption = Readonly<{
  id: string;
  code: string;
  name: string;
  shortName: string | null;
}>;

export type AdminMatch = Readonly<{
  id: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  startsAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
}>;

export type AdminMatchday = Readonly<{
  id: string;
  number: number;
  name: string | null;
  status: MatchdayStatus;
  matches: ReadonlyArray<AdminMatch>;
}>;

export type AdminSeasonDetail = Readonly<{
  id: string;
  competitionId: string;
  competitionName: string;
  code: string;
  name: string;
  startsOn: string | null;
  endsOn: string | null;
  status: SeasonStatus;
  teams: ReadonlyArray<TeamOption>;
  availableTeams: ReadonlyArray<TeamOption>;
  matchdays: ReadonlyArray<AdminMatchday>;
}>;

export type PoolMatch =
  | Readonly<{
      id: string;
      homeTeamName: string;
      awayTeamName: string;
      startsAt: string;
      status: Exclude<MatchStatus, "finished">;
    }>
  | Readonly<{
      id: string;
      homeTeamName: string;
      awayTeamName: string;
      startsAt: string;
      status: "finished";
      homeScore: number;
      awayScore: number;
    }>;

export type PoolMatchday = Readonly<{
  id: string;
  number: number;
  name: string | null;
  status: "published" | "finished";
  matches: ReadonlyArray<PoolMatch>;
}>;

export type PoolMatchdaysView = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  selectedMatchdayId: string | null;
  matchdays: ReadonlyArray<PoolMatchday>;
}>;

export type CatalogActionErrorCode =
  | "authentication_required"
  | "forbidden"
  | "invalid_input"
  | "not_found"
  | "conflict"
  | "invalid_transition"
  | "operation_failed";

export type CatalogActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "success"; message: string }>
  | Readonly<{ status: "error"; error: CatalogActionErrorCode }>;

export const initialCatalogActionState: CatalogActionState = { status: "idle" };
