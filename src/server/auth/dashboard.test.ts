import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getCurrentAppUser: vi.fn(),
  isUserBanned: vi.fn(),
  redirect: vi.fn(),
}));

class RedirectSignal extends Error {
  constructor(readonly destination: string) {
    super(`Redirected to ${destination}`);
    this.name = "RedirectSignal";
  }
}

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: authMocks.redirect,
}));

vi.mock("@/server/auth/session", () => ({
  getCurrentAppUser: authMocks.getCurrentAppUser,
}));

vi.mock("@/server/services/users", () => ({
  isUserBanned: authMocks.isUserBanned,
}));

import { requireDashboardUser } from "@/server/auth/dashboard";

describe("requireDashboardUser", () => {
  beforeEach(() => {
    authMocks.getCurrentAppUser.mockReset();
    authMocks.isUserBanned.mockReset();
    authMocks.redirect.mockReset();
    authMocks.redirect.mockImplementation((destination: string) => {
      throw new RedirectSignal(destination);
    });
  });

  it("redirects anonymous users before dashboard content resolves", async () => {
    authMocks.getCurrentAppUser.mockResolvedValue(null);

    await expect(requireDashboardUser("es")).rejects.toMatchObject({
      destination: "/es/login",
    });
    expect(authMocks.isUserBanned).not.toHaveBeenCalled();
  });

  it("redirects banned users", async () => {
    const appUser = { emailVerified: true, profile: { status: "banned" } };
    authMocks.getCurrentAppUser.mockResolvedValue(appUser);
    authMocks.isUserBanned.mockReturnValue(true);

    await expect(requireDashboardUser("en")).rejects.toMatchObject({
      destination: "/en/login?reason=user_banned",
    });
  });

  it("redirects users with an unverified email", async () => {
    const appUser = { emailVerified: false, profile: { status: "active" } };
    authMocks.getCurrentAppUser.mockResolvedValue(appUser);
    authMocks.isUserBanned.mockReturnValue(false);

    await expect(requireDashboardUser("es")).rejects.toMatchObject({
      destination: "/es/verify-email",
    });
  });

  it("returns a verified active user", async () => {
    const appUser = { emailVerified: true, profile: { status: "active" } };
    authMocks.getCurrentAppUser.mockResolvedValue(appUser);
    authMocks.isUserBanned.mockReturnValue(false);

    await expect(requireDashboardUser("en")).resolves.toBe(appUser);
    expect(authMocks.redirect).not.toHaveBeenCalled();
  });
});
