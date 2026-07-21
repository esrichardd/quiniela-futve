import "server-only";

import type { Locale } from "@/i18n/routing";
import {
  createUserAuditEvent,
  createUserPreferencesIfMissing,
  createUserProfileIfMissing,
  getUserPreferences,
  getUserProfile,
  updateUserProfileDetails,
  type UserPreferences,
  type UserProfile,
} from "@/server/dal/users";

export type AuthProvider = "email" | "google" | "unknown";

export type AuthUserSnapshot = Readonly<{
  id: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
}>;

export type AppUser = Readonly<{
  id: string;
  emailVerified: boolean;
  profile: UserProfile;
  preferences: UserPreferences;
}>;

export type RegistrationProfile = Readonly<{
  firstName: string;
  lastName: string;
}>;

export function isUserBanned(
  profile: Pick<UserProfile, "banned" | "banExpiresAt">,
): boolean {
  if (!profile.banned) {
    return false;
  }

  if (!profile.banExpiresAt) {
    return true;
  }

  return profile.banExpiresAt > new Date();
}

export async function ensureAppUser(input: {
  authUser: AuthUserSnapshot;
  locale?: Locale;
  provider?: AuthProvider;
  registrationProfile?: RegistrationProfile;
}): Promise<AppUser> {
  const profile = await ensureUserProfile(
    input.authUser,
    input.provider,
    input.registrationProfile,
  );
  const preferences = await ensureUserPreferences(
    input.authUser.id,
    input.locale,
  );

  return {
    id: input.authUser.id,
    emailVerified: input.authUser.emailVerified,
    profile,
    preferences,
  };
}

async function ensureUserProfile(
  authUser: AuthUserSnapshot,
  provider: AuthProvider = "unknown",
  registrationProfile?: RegistrationProfile,
): Promise<UserProfile> {
  const displayName = normalizeNullableText(authUser.name);
  const avatarUrl = normalizeNullableText(authUser.image);
  const firstName = normalizeNullableText(registrationProfile?.firstName);
  const lastName = normalizeNullableText(registrationProfile?.lastName);
  const createdProfile = await createUserProfileIfMissing({
    userId: authUser.id,
    displayName,
    firstName,
    lastName,
    avatarUrl,
  });

  if (createdProfile) {
    await createUserAuditEvent({
      targetUserId: authUser.id,
      action: "user.created",
      metadata: {
        provider,
        emailVerified: authUser.emailVerified,
      },
    });

    return createdProfile;
  }

  const existingProfile = await getUserProfile(authUser.id);

  if (!existingProfile) {
    throw new Error("User profile could not be resolved.");
  }

  const profileWithDetails = await backfillMissingProfileFields({
    profile: existingProfile,
    displayName,
    avatarUrl,
    firstName,
    lastName,
  });

  return profileWithDetails;
}

async function ensureUserPreferences(
  userId: string,
  locale?: Locale,
): Promise<UserPreferences> {
  const createdPreferences = await createUserPreferencesIfMissing({
    userId,
    locale,
  });

  if (createdPreferences) {
    return createdPreferences;
  }

  const existingPreferences = await getUserPreferences(userId);

  if (!existingPreferences) {
    throw new Error("User preferences could not be resolved.");
  }

  return existingPreferences;
}

async function backfillMissingProfileFields(input: {
  profile: UserProfile;
  displayName: string | null;
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}): Promise<UserProfile> {
  const displayName = input.profile.displayName ?? input.displayName;
  const avatarUrl = input.profile.avatarUrl ?? input.avatarUrl;
  const firstName = input.profile.firstName ?? input.firstName;
  const lastName = input.profile.lastName ?? input.lastName;

  if (
    displayName === input.profile.displayName &&
    avatarUrl === input.profile.avatarUrl &&
    firstName === input.profile.firstName &&
    lastName === input.profile.lastName
  ) {
    return input.profile;
  }

  const updatedProfile = await updateUserProfileDetails(
    input.profile.userId,
    {
      avatarUrl,
      displayName,
      firstName,
      lastName,
    },
  );

  if (!updatedProfile) {
    throw new Error("User profile details could not be updated.");
  }

  return updatedProfile;
}

export async function recordEmailVerificationRequired(
  userId: string,
): Promise<void> {
  await createUserAuditEvent({
    targetUserId: userId,
    action: "user.email_verification_required",
  });
}

function normalizeNullableText(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}
