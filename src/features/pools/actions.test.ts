import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialPoolActionState } from "@/features/pools/types";

const actionMocks = vi.hoisted(() => ({
  createPool: vi.fn(),
  joinPool: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: actionMocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: actionMocks.redirect,
}));

vi.mock("@/server/auth/session", () => ({
  AuthenticationRequiredError: class AuthenticationRequiredError extends Error {},
  EmailVerificationRequiredError:
    class EmailVerificationRequiredError extends Error {},
  UserBannedError: class UserBannedError extends Error {},
}));

vi.mock("@/server/services/pools", () => ({
  CompetitionUnavailableError:
    class CompetitionUnavailableError extends Error {},
  InvalidInvitationCodeError:
    class InvalidInvitationCodeError extends Error {},
  createPool: actionMocks.createPool,
  joinPool: actionMocks.joinPool,
}));

import { createPoolAction } from "@/features/pools/actions";

describe("createPoolAction", () => {
  beforeEach(() => {
    actionMocks.createPool.mockReset();
    actionMocks.redirect.mockReset();
    actionMocks.revalidatePath.mockReset();
  });

  it("rejects a manipulated configuration before calling the service", async () => {
    const formData = new FormData();
    formData.set("locale", "es");
    formData.set(
      "configuration",
      JSON.stringify({
        creationToken: "00000000-0000-4000-8000-000000000010",
        competitionId: "not-a-uuid",
        name: "Payload manipulado",
        financial: {
          currency: "USD",
          participationFee: { enabled: false },
        },
        prize: { model: "winner_takes_all" },
        prediction: { mode: "simple", resultPoints: 1 },
      }),
    );

    await expect(
      createPoolAction(initialPoolActionState, formData),
    ).resolves.toEqual({
      status: "error",
      error: "invalid_configuration",
    });
    expect(actionMocks.createPool).not.toHaveBeenCalled();
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled();
    expect(actionMocks.redirect).not.toHaveBeenCalled();
  });
});
