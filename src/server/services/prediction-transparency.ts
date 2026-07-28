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
  listPredictionTransparencyRowsForMatchday,
  listVisibleMatchdaysForPool,
  type PredictionTransparencyMatchdayMatchRow,
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
 * Only the selected matchday's matches are fetched (`PERF-N03`): every
 * other visible matchday keeps an empty `matches` array, matching
 * `pool-transparency.tsx` which only ever renders the selected one.
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

  const matchdayRows = await listVisibleMatchdaysForPool(poolId);
  const core = matchdayRows[0];
  if (!core) throw new PoolMembershipRequiredError();

  const visibleMatchdays: Array<TransparencyMatchday> = [];
  for (const row of matchdayRows) {
    const { matchdayId, matchdayNumber, matchdayStatus } = row;
    if (
      !matchdayId ||
      matchdayNumber === null ||
      (matchdayStatus !== "published" && matchdayStatus !== "finished")
    ) {
      continue;
    }
    visibleMatchdays.push({
      id: matchdayId,
      number: matchdayNumber,
      name: row.matchdayName,
      status: matchdayStatus,
      matches: [],
      perfectMatchdayMembershipIds: [],
    });
  }

  const selected =
    selectedMatchdayId && visibleMatchdays.some((matchday) => matchday.id === selectedMatchdayId)
      ? selectedMatchdayId
      : (visibleMatchdays[0]?.id ?? null);

  const matchdays: ReadonlyArray<TransparencyMatchday> = selected
    ? await withSelectedMatchdayMatches(visibleMatchdays, poolId, selected, now)
    : visibleMatchdays;

  return {
    poolId: core.poolId,
    poolName: core.poolName,
    competitionName: core.competitionName,
    seasonName: core.seasonName,
    selectedMatchdayId: selected,
    matchdays,
  };
}

async function withSelectedMatchdayMatches(
  matchdays: ReadonlyArray<TransparencyMatchday>,
  poolId: string,
  selectedMatchdayId: string,
  now: Date,
): Promise<ReadonlyArray<TransparencyMatchday>> {
  const rows = await listPredictionTransparencyRowsForMatchday(poolId, selectedMatchdayId);

  const matchesById = new Map<string, TransparencyMatch>();
  const perfectMatchdayMembershipIds = new Set<string>();

  for (const row of rows) {
    if (row.matchdayStatus === "finished" && row.perfectMatchdayBonusPoints !== null) {
      perfectMatchdayMembershipIds.add(row.poolMembershipId);
    }
    matchesById.set(row.matchId, mapTransparencyRowIntoMatch(row, matchesById, now));
  }

  return matchdays.map((matchday) =>
    matchday.id === selectedMatchdayId
      ? {
          ...matchday,
          matches: [...matchesById.values()],
          perfectMatchdayMembershipIds: [...perfectMatchdayMembershipIds],
        }
      : matchday,
  );
}

function mapTransparencyRowIntoMatch(
  row: PredictionTransparencyMatchdayMatchRow,
  matchesById: ReadonlyMap<string, TransparencyMatch>,
  now: Date,
): TransparencyMatch {
  const revealed = isPredictionRevealed(row.startsAt, now);
  const existing = matchesById.get(row.matchId);

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

function mapRevealedPrediction(
  row: PredictionTransparencyMatchdayMatchRow,
): MatchPrediction | null {
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
