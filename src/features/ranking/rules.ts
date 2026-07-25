export type RankingCandidate = Readonly<{
  membershipId: string;
  totalPoints: number;
}>;

export type RankedEntry = Readonly<{
  membershipId: string;
  totalPoints: number;
  rank: number;
}>;

/**
 * Assigns standard competition ranking ("1224" ranking) to a list of pool
 * membership totals.
 *
 * Contract: this function sorts `candidates` by `totalPoints` descending
 * itself, so callers do not need to pre-sort. The sort is stable, so
 * memberships tied on `totalPoints` keep their relative input order; a
 * caller that wants a deterministic display order among ties (for example,
 * earliest to join the pool first) should order the input accordingly
 * before calling this function.
 *
 * Ranking rule: memberships with equal `totalPoints` share the same rank,
 * and the next distinct rank skips the number of tied entries. For example,
 * two memberships tied at rank 1 push the next distinct total to rank 3,
 * never rank 2.
 */
export function assignCompetitionRanks(
  candidates: ReadonlyArray<RankingCandidate>,
): ReadonlyArray<RankedEntry> {
  const sorted = [...candidates].sort((a, b) => b.totalPoints - a.totalPoints);

  const ranked: Array<RankedEntry> = [];
  let previousPoints: number | null = null;
  let previousRank = 0;

  sorted.forEach((candidate, index) => {
    const rank =
      previousPoints !== null && candidate.totalPoints === previousPoints
        ? previousRank
        : index + 1;

    ranked.push({
      membershipId: candidate.membershipId,
      totalPoints: candidate.totalPoints,
      rank,
    });

    previousPoints = candidate.totalPoints;
    previousRank = rank;
  });

  return ranked;
}
