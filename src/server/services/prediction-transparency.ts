import "server-only";

import { isPredictionRevealed } from "@/features/predictions/rules";
import type { MatchPrediction, PredictionResult } from "@/features/predictions/types";
import type {
  MemberMatchPrediction,
  PoolTransparencyView,
  TransparencyMatch,
  TransparencyMatchday,
} from "@/features/prediction-reveal/types";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { requireVerifiedAppUser } from "@/server/auth/session";
import { getPoolMembershipCore } from "@/server/dal/pools";
import {
  listPredictionTransparencyRowsForPool,
  type PredictionTransparencyRow,
} from "@/server/dal/prediction-transparency";
import { parseMatchStatus } from "@/server/dal/predictions";

/**
 * Returns, for a pool, every visible matchday with every match and every
 * member's prediction for it — revealed only once that match's prediction
 * window has closed (`isPredictionRevealed`). Unlike
 * `getCurrentUserPoolPredictions`, this is intentionally not scoped to the
 * caller's own membership: the whole point is transparency across the
 * pool. It still stays private to non-members: a user who is not a member
 * of the pool gets the same `PoolMembershipRequiredError` as for an
 * inexistent pool, never a filtered or partial view.
 *
 * A match that has not been revealed yet always gets an empty `members`
 * array — the redaction happens here, in the service, regardless of what
 * the DAL returned, so an unrevealed pick can never reach the DTO.
 */
export async function getPoolPredictionTransparency(
  poolId: string,
  selectedMatchdayId?: string,
  now: Date = new Date(),
): Promise<PoolTransparencyView> {
  const appUser = await requireVerifiedAppUser();

  const membershipContext = await getPoolMembershipCore(poolId, appUser.id);
  if (!membershipContext) throw new PoolMembershipRequiredError();

  const rows = await listPredictionTransparencyRowsForPool(poolId);
  const core = rows[0];
  if (!core) throw new PoolMembershipRequiredError();

  const matchdaysById = new Map<string, MatchdayAccumulator>();

  for (const row of rows) {
    if (!row.matchdayId || row.matchdayNumber === null) continue;
    const matchdayStatus = row.matchdayStatus;
    if (matchdayStatus !== "published" && matchdayStatus !== "finished") continue;

    let matchday = matchdaysById.get(row.matchdayId);
    if (!matchday) {
      matchday = {
        id: row.matchdayId,
        number: row.matchdayNumber,
        name: row.matchdayName,
        status: matchdayStatus,
        matchesById: new Map(),
        perfectMatchdayMembershipIds: new Set(),
      };
      matchdaysById.set(row.matchdayId, matchday);
    }

    if (
      row.matchdayStatus === "finished" &&
      row.perfectMatchdayBonusPoints !== null
    ) {
      matchday.perfectMatchdayMembershipIds.add(row.poolMembershipId);
    }

    const match = mapTransparencyRowIntoMatch(row, matchday, now);
    if (match) matchday.matchesById.set(match.matchId, match);
  }

  const matchdays: ReadonlyArray<TransparencyMatchday> = [...matchdaysById.values()].map(
    (matchday) => ({
      id: matchday.id,
      number: matchday.number,
      name: matchday.name,
      status: matchday.status,
      matches: [...matchday.matchesById.values()],
      perfectMatchdayMembershipIds: [...matchday.perfectMatchdayMembershipIds],
    }),
  );

  const visibleMatchdays = matchdays;
  const selected =
    selectedMatchdayId && visibleMatchdays.some((matchday) => matchday.id === selectedMatchdayId)
      ? selectedMatchdayId
      : (visibleMatchdays[0]?.id ?? null);

  return {
    poolId: core.poolId,
    poolName: core.poolName,
    competitionName: core.competitionName,
    seasonName: core.seasonName,
    selectedMatchdayId: selected,
    matchdays: visibleMatchdays,
  };
}

type MatchdayAccumulator = {
  id: string;
  number: number;
  name: string | null;
  status: "published" | "finished";
  matchesById: Map<string, TransparencyMatch>;
  perfectMatchdayMembershipIds: Set<string>;
};

function mapTransparencyRowIntoMatch(
  row: PredictionTransparencyRow,
  matchday: MatchdayAccumulator,
  now: Date,
): TransparencyMatch | null {
  if (
    !row.matchId ||
    !row.homeTeamName ||
    !row.awayTeamName ||
    !row.startsAt ||
    !row.matchStatus
  ) {
    return null;
  }

  const revealed = isPredictionRevealed(row.startsAt, now);
  const existing = matchday.matchesById.get(row.matchId);

  const member: MemberMatchPrediction | null = revealed
    ? {
        poolMembershipId: row.poolMembershipId,
        displayName: row.displayName,
        prediction: mapRevealedPrediction(row),
        pointsEarned: row.matchStatus === "finished" ? row.pointsEarned : null,
        wasExactScore: row.matchStatus === "finished" ? row.wasExactScore : null,
      }
    : null;

  if (existing) {
    return member ? { ...existing, members: [...existing.members, member] } : existing;
  }

  return {
    matchId: row.matchId,
    homeTeamName: row.homeTeamName,
    homeTeamShortName: row.homeTeamShortName,
    awayTeamName: row.awayTeamName,
    awayTeamShortName: row.awayTeamShortName,
    startsAt: row.startsAt.toISOString(),
    matchStatus: parseMatchStatus(row.matchStatus),
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    isRevealed: revealed,
    members: member ? [member] : [],
  };
}

function mapRevealedPrediction(row: PredictionTransparencyRow): MatchPrediction | null {
  if (row.predictedResult) {
    return { kind: "result", result: parsePredictionResult(row.predictedResult) };
  }
  if (row.predictedHomeScore !== null && row.predictedAwayScore !== null) {
    return {
      kind: "score",
      homeScore: row.predictedHomeScore,
      awayScore: row.predictedAwayScore,
    };
  }
  return null;
}

function parsePredictionResult(value: string): PredictionResult {
  if (value === "home" || value === "draw" || value === "away") {
    return value;
  }
  throw new Error("Invalid predicted result persisted in the database.");
}
