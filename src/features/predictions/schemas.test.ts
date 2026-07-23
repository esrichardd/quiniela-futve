import { describe, expect, it } from "vitest";

import { saveMatchdayPredictionsActionSchema } from "./schemas";

const poolId = "00000000-0000-4000-8000-000000000001";
const matchId = "00000000-0000-4000-8000-000000000002";
const otherMatchId = "00000000-0000-4000-8000-000000000003";

describe("saveMatchdayPredictionsActionSchema", () => {
  it("accepts a batch of valid result payloads for simple mode", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [
        { matchId, kind: "result", result: "home" },
        { matchId: otherMatchId, kind: "result", result: "draw" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a batch of valid score payloads", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "en",
      predictions: [{ matchId, kind: "score", homeScore: 2, awayScore: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts boundary scores 0 and 99", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId, kind: "score", homeScore: 0, awayScore: 99 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a mixed batch across matches (simple result plus manipulated extra fields ignored)", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [
        { matchId, kind: "result", result: "home", homeScore: 2, awayScore: 1 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.predictions[0]).not.toHaveProperty("homeScore");
    }
  });

  it("rejects an empty batch", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an incomplete score payload", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId, kind: "score", homeScore: 2 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal scores", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId, kind: "score", homeScore: 1.5, awayScore: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative scores", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId, kind: "score", homeScore: -1, awayScore: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects scores above 99", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId, kind: "score", homeScore: 100, awayScore: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid result value", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId, kind: "result", result: "tie" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid matchId inside the batch", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "es",
      predictions: [{ matchId: "not-a-uuid", kind: "result", result: "home" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid poolId", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId: "not-a-uuid",
      locale: "es",
      predictions: [{ matchId, kind: "result", result: "home" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported locale", () => {
    const result = saveMatchdayPredictionsActionSchema.safeParse({
      poolId,
      locale: "fr",
      predictions: [{ matchId, kind: "result", result: "home" }],
    });
    expect(result.success).toBe(false);
  });
});
