import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialSaveMatchdayPredictionsState } from "@/features/predictions/types";

const actionMocks = vi.hoisted(() => ({
  savePredictions: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

vi.mock("@/server/auth/session", () => ({
  AuthenticationRequiredError: class AuthenticationRequiredError extends Error {},
  EmailVerificationRequiredError:
    class EmailVerificationRequiredError extends Error {},
  UserBannedError: class UserBannedError extends Error {},
}));

vi.mock("@/server/auth/permissions", () => ({
  PoolMembershipRequiredError: class PoolMembershipRequiredError extends Error {},
}));

vi.mock("@/server/services/predictions", () => ({
  savePredictions: actionMocks.savePredictions,
}));

import { saveMatchdayPredictionsAction } from "@/features/predictions/actions";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { AuthenticationRequiredError } from "@/server/auth/session";

const poolId = "00000000-0000-4000-8000-000000000001";
const matchId = "00000000-0000-4000-8000-000000000002";
const otherMatchId = "00000000-0000-4000-8000-000000000003";

function formDataWith(predictions: unknown, locale = "es"): FormData {
  const formData = new FormData();
  formData.set("poolId", poolId);
  formData.set("locale", locale);
  formData.set("predictions", JSON.stringify(predictions));
  return formData;
}

describe("saveMatchdayPredictionsAction", () => {
  beforeEach(() => {
    actionMocks.savePredictions.mockReset();
    actionMocks.revalidatePath.mockReset();
  });

  it("rejects a manipulated payload before calling the service", async () => {
    const formData = formDataWith([{ matchId, kind: "result", result: "not-a-result" }]);

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({ status: "error", error: "prediction_invalid" });
    expect(actionMocks.savePredictions).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an empty batch", async () => {
    const formData = formDataWith([]);

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({ status: "error", error: "prediction_invalid" });
    expect(actionMocks.savePredictions).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON in the predictions field", async () => {
    const formData = new FormData();
    formData.set("poolId", poolId);
    formData.set("locale", "es");
    formData.set("predictions", "{not-json");

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({ status: "error", error: "prediction_invalid" });
  });

  it("maps an authentication error", async () => {
    actionMocks.savePredictions.mockRejectedValue(new AuthenticationRequiredError());
    const formData = formDataWith([{ matchId, kind: "result", result: "home" }]);

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({ status: "error", error: "authentication_required" });
  });

  it("maps a missing membership to pool_unavailable", async () => {
    actionMocks.savePredictions.mockRejectedValue(new PoolMembershipRequiredError());
    const formData = formDataWith([{ matchId, kind: "result", result: "home" }]);

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({ status: "error", error: "pool_unavailable" });
  });

  it("maps an unexpected error to save_failed", async () => {
    actionMocks.savePredictions.mockRejectedValue(new Error("boom"));
    const formData = formDataWith([{ matchId, kind: "result", result: "home" }]);

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({ status: "error", error: "save_failed" });
  });

  it("returns the per-match outcomes and revalidates the matchdays page", async () => {
    actionMocks.savePredictions.mockResolvedValue({
      [matchId]: { status: "saved" },
      [otherMatchId]: { status: "error", error: "prediction_locked" },
    });
    const formData = formDataWith([
      { matchId, kind: "result", result: "home" },
      { matchId: otherMatchId, kind: "result", result: "away" },
    ]);

    await expect(
      saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData),
    ).resolves.toEqual({
      status: "completed",
      outcomes: {
        [matchId]: { status: "saved" },
        [otherMatchId]: { status: "error", error: "prediction_locked" },
      },
    });
    expect(actionMocks.savePredictions).toHaveBeenCalledWith(poolId, [
      { matchId, payload: { kind: "result", result: "home" } },
      { matchId: otherMatchId, payload: { kind: "result", result: "away" } },
    ]);
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith(
      `/es/pools/${poolId}/matchdays`,
    );
  });

  it("normalizes score items before calling the service", async () => {
    actionMocks.savePredictions.mockResolvedValue({ [matchId]: { status: "saved" } });
    const formData = formDataWith(
      [{ matchId, kind: "score", homeScore: 2, awayScore: 1 }],
      "en",
    );

    await saveMatchdayPredictionsAction(initialSaveMatchdayPredictionsState, formData);

    expect(actionMocks.savePredictions).toHaveBeenCalledWith(poolId, [
      { matchId, payload: { kind: "score", homeScore: 2, awayScore: 1 } },
    ]);
  });
});
