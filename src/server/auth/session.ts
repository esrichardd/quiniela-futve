import "server-only";

import { auth } from "@/server/auth/server";
import {
  ensureAppUser,
  isUserBanned,
  type AppUser,
  type AuthProvider,
} from "@/server/services/users";

type AuthSessionResponse = Awaited<ReturnType<typeof auth.getSession>>;
export type AuthSession = NonNullable<AuthSessionResponse["data"]>;
export type AuthSessionUser = AuthSession["user"];

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class UserBannedError extends Error {
  constructor() {
    super("User is banned.");
    this.name = "UserBannedError";
  }
}

export class EmailVerificationRequiredError extends Error {
  constructor() {
    super("Email verification is required.");
    this.name = "EmailVerificationRequiredError";
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const { data, error } = await auth.getSession();

  if (error) {
    throw new Error(error.message || "Auth session could not be resolved.");
  }

  return data;
}

export async function getCurrentAppUser(
  provider: AuthProvider = "unknown",
): Promise<AppUser | null> {
  const session = await getAuthSession();

  if (!session?.user) {
    return null;
  }

  return ensureAppUser({
    authUser: {
      id: session.user.id,
      emailVerified: session.user.emailVerified,
      name: session.user.name,
      image: session.user.image,
    },
    provider,
  });
}

export async function requireCurrentAppUser(
  provider: AuthProvider = "unknown",
): Promise<AppUser> {
  const appUser = await getCurrentAppUser(provider);

  if (!appUser) {
    throw new AuthenticationRequiredError();
  }

  if (isUserBanned(appUser.profile)) {
    throw new UserBannedError();
  }

  return appUser;
}

export async function requireVerifiedAppUser(
  provider: AuthProvider = "unknown",
): Promise<AppUser> {
  const appUser = await requireCurrentAppUser(provider);

  if (!appUser.emailVerified) {
    throw new EmailVerificationRequiredError();
  }

  return appUser;
}
