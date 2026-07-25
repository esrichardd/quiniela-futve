import { describe, expect, it } from "vitest";

import { assignCompetitionRanks } from "./rules";

describe("assignCompetitionRanks", () => {
  it("returns an empty list for an empty input", () => {
    expect(assignCompetitionRanks([])).toEqual([]);
  });

  it("assigns consecutive ranks when there are no ties", () => {
    const result = assignCompetitionRanks([
      { membershipId: "a", totalPoints: 10 },
      { membershipId: "b", totalPoints: 20 },
      { membershipId: "c", totalPoints: 15 },
    ]);

    expect(result).toEqual([
      { membershipId: "b", totalPoints: 20, rank: 1 },
      { membershipId: "c", totalPoints: 15, rank: 2 },
      { membershipId: "a", totalPoints: 10, rank: 3 },
    ]);
  });

  it("shares rank 1 for a tie at the top and skips rank 2", () => {
    const result = assignCompetitionRanks([
      { membershipId: "a", totalPoints: 20 },
      { membershipId: "b", totalPoints: 20 },
      { membershipId: "c", totalPoints: 10 },
    ]);

    expect(result).toEqual([
      { membershipId: "a", totalPoints: 20, rank: 1 },
      { membershipId: "b", totalPoints: 20, rank: 1 },
      { membershipId: "c", totalPoints: 10, rank: 3 },
    ]);
  });

  it("shares rank for a tie in the middle of the table and skips the following rank", () => {
    const result = assignCompetitionRanks([
      { membershipId: "a", totalPoints: 30 },
      { membershipId: "b", totalPoints: 20 },
      { membershipId: "c", totalPoints: 20 },
      { membershipId: "d", totalPoints: 10 },
    ]);

    expect(result).toEqual([
      { membershipId: "a", totalPoints: 30, rank: 1 },
      { membershipId: "b", totalPoints: 20, rank: 2 },
      { membershipId: "c", totalPoints: 20, rank: 2 },
      { membershipId: "d", totalPoints: 10, rank: 4 },
    ]);
  });

  it("assigns rank 1 to every membership when all are tied", () => {
    const result = assignCompetitionRanks([
      { membershipId: "a", totalPoints: 5 },
      { membershipId: "b", totalPoints: 5 },
      { membershipId: "c", totalPoints: 5 },
    ]);

    expect(result).toEqual([
      { membershipId: "a", totalPoints: 5, rank: 1 },
      { membershipId: "b", totalPoints: 5, rank: 1 },
      { membershipId: "c", totalPoints: 5, rank: 1 },
    ]);
  });

  it("sorts unsorted input by totalPoints descending before ranking", () => {
    const result = assignCompetitionRanks([
      { membershipId: "low", totalPoints: 1 },
      { membershipId: "high", totalPoints: 99 },
    ]);

    expect(result.map((entry) => entry.membershipId)).toEqual(["high", "low"]);
  });

  it("preserves relative input order among ties (stable sort)", () => {
    const result = assignCompetitionRanks([
      { membershipId: "first-in", totalPoints: 5 },
      { membershipId: "second-in", totalPoints: 5 },
    ]);

    expect(result.map((entry) => entry.membershipId)).toEqual([
      "first-in",
      "second-in",
    ]);
  });

  it("treats memberships with 0 points like any other total", () => {
    const result = assignCompetitionRanks([
      { membershipId: "a", totalPoints: 0 },
      { membershipId: "b", totalPoints: 0 },
    ]);

    expect(result).toEqual([
      { membershipId: "a", totalPoints: 0, rank: 1 },
      { membershipId: "b", totalPoints: 0, rank: 1 },
    ]);
  });
});
