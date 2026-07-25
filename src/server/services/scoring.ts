import "server-only";

import { randomUUID } from "node:crypto";

import {
  calculateMatchPredictionPoints,
  isPerfectMatchday,
} from "@/features/scoring/rules";
import type { OfficialMatchResult } from "@/features/scoring/rules";
import { parsePredictionMode } from "@/server/dal/predictions";
import {
  listComputableMatchIdsForMatchday,
  listMatchdayBonusCandidateRows,
  listScoringRowsForMatch,
  replaceMatchdayBonuses,
  upsertMatchPredictionScores,
  type MatchdayBonusInput,
  type MatchPredictionScoreInput,
} from "@/server/dal/scoring";

/**
 * Recalculates the points earned by every prediction submitted for a match,
 * given its official result. Triggered whenever `updateMatch` transitions a
 * match to `finished`, whether it is the first result recorded or a
 * super_admin correction of an already-finished match. The underlying
 * upsert overwrites the previous score by prediction id, so correcting a
 * result never accumulates points across recomputations.
 */
export async function recomputeMatchPredictionPoints(
  matchId: string,
  officialResult: OfficialMatchResult,
): Promise<void> {
  const rows = await listScoringRowsForMatch(matchId);
  if (rows.length === 0) return;

  const inputs: Array<MatchPredictionScoreInput> = rows.map((row) => {
    const mode = parsePredictionMode(row.predictionMode);
    const prediction =
      row.predictedResult !== null
        ? {
            predictedResult: row.predictedResult as "home" | "draw" | "away",
            predictedHomeScore: null,
            predictedAwayScore: null,
          }
        : {
            predictedResult: null,
            predictedHomeScore: row.predictedHomeScore as number,
            predictedAwayScore: row.predictedAwayScore as number,
          };

    const result = calculateMatchPredictionPoints(
      mode,
      { resultPoints: row.resultPoints, exactScorePoints: row.exactScorePoints },
      prediction,
      officialResult,
    );

    return {
      id: randomUUID(),
      poolMatchPredictionId: row.poolMatchPredictionId,
      pointsEarned: result.pointsEarned,
      wasExactScore: result.wasExactScore,
    };
  });

  await upsertMatchPredictionScores(inputs);
}

type BonusGroup = {
  poolId: string;
  competitionSeasonId: string;
  perfectMatchdayBonusPoints: number | null;
  exactMatchIds: Set<string>;
};

/**
 * Recalculates the perfect matchday bonus for every membership with
 * predictions in a matchday. Triggered whenever `transitionMatchday`
 * transitions a matchday to `finished`, including the self-loop re-finish
 * an admin can trigger to force a recompute after correcting a match on an
 * already-finished matchday. Replaces the full set of bonus rows for the
 * matchday atomically, so a membership that no longer qualifies loses its
 * bonus instead of keeping a stale row.
 */
export async function recomputeMatchdayBonuses(matchdayId: string): Promise<void> {
  const computableMatchIds = await listComputableMatchIdsForMatchday(matchdayId);
  if (computableMatchIds.length === 0) {
    await replaceMatchdayBonuses(matchdayId, []);
    return;
  }

  const rows = await listMatchdayBonusCandidateRows(computableMatchIds);
  const groups = new Map<string, BonusGroup>();

  for (const row of rows) {
    let group = groups.get(row.poolMembershipId);
    if (!group) {
      group = {
        poolId: row.poolId,
        competitionSeasonId: row.competitionSeasonId,
        perfectMatchdayBonusPoints: row.perfectMatchdayBonusPoints,
        exactMatchIds: new Set(),
      };
      groups.set(row.poolMembershipId, group);
    }
    if (row.wasExactScore === true) {
      group.exactMatchIds.add(row.matchId);
    }
  }

  const bonusInputs: Array<MatchdayBonusInput> = [];
  for (const [poolMembershipId, group] of groups) {
    if (group.perfectMatchdayBonusPoints === null) continue;
    const matchResults = computableMatchIds.map((matchId) =>
      group.exactMatchIds.has(matchId),
    );
    if (!isPerfectMatchday(matchResults)) continue;

    bonusInputs.push({
      id: randomUUID(),
      poolId: group.poolId,
      competitionSeasonId: group.competitionSeasonId,
      poolMembershipId,
      matchdayId,
      pointsAwarded: group.perfectMatchdayBonusPoints,
    });
  }

  await replaceMatchdayBonuses(matchdayId, bonusInputs);
}
