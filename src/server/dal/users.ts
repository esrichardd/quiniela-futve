import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
  userAuditEvents,
  userPreferences,
  userProfiles,
} from "@/server/db/schema";

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;
export type UserAuditEvent = InferSelectModel<typeof userAuditEvents>;
export type AppUserProfile = Readonly<
  Pick<UserProfile, "banned" | "banExpiresAt" | "globalRole">
>;
export type AppUserPreferences = Readonly<
  Pick<UserPreferences, "locale" | "theme" | "timeZone">
>;
export type AppUserRecord = Readonly<{
  id: string;
  profile: AppUserProfile;
  preferences: AppUserPreferences | null;
}>;

export type UserAuditAction =
  | "user.created"
  | "user.first_login"
  | "user.email_verification_required"
  | "user.profile_updated"
  | "user.password_reset_requested"
  | "user.password_changed"
  | "user.google_login"
  | "user.role_changed"
  | "user.banned"
  | "user.unbanned"
  | "user.session_revoked";

export async function getAppUserRecord(
  userId: string,
): Promise<AppUserRecord | null> {
  const [record] = await db
    .select({
      id: userProfiles.userId,
      banned: userProfiles.banned,
      banExpiresAt: userProfiles.banExpiresAt,
      globalRole: userProfiles.globalRole,
      preferencesUserId: userPreferences.userId,
      locale: userPreferences.locale,
      theme: userPreferences.theme,
      timeZone: userPreferences.timeZone,
    })
    .from(userProfiles)
    .leftJoin(
      userPreferences,
      eq(userPreferences.userId, userProfiles.userId),
    )
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!record) {
    return null;
  }

  const preferences =
    record.preferencesUserId !== null &&
    record.locale !== null &&
    record.theme !== null &&
    record.timeZone !== null
      ? {
          locale: record.locale,
          theme: record.theme,
          timeZone: record.timeZone,
        }
      : null;

  return {
    id: record.id,
    profile: {
      banned: record.banned,
      banExpiresAt: record.banExpiresAt,
      globalRole: record.globalRole,
    },
    preferences,
  };
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function createUserProfileIfMissing(
  profile: NewUserProfile,
): Promise<UserProfile | null> {
  const [createdProfile] = await db
    .insert(userProfiles)
    .values(profile)
    .onConflictDoNothing()
    .returning();

  return createdProfile ?? null;
}

export async function updateUserProfileDetails(
  userId: string,
  values: Pick<
    NewUserProfile,
    "avatarUrl" | "displayName" | "firstName" | "lastName"
  >,
): Promise<UserProfile | null> {
  const [updatedProfile] = await db
    .update(userProfiles)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId))
    .returning();

  return updatedProfile ?? null;
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return preferences ?? null;
}

export async function createUserPreferencesIfMissing(
  preferences: NewUserPreferences,
): Promise<UserPreferences | null> {
  const [createdPreferences] = await db
    .insert(userPreferences)
    .values(preferences)
    .onConflictDoNothing()
    .returning();

  return createdPreferences ?? null;
}

export async function createUserAuditEvent(input: {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: UserAuditAction;
  metadata?: Record<string, unknown>;
}): Promise<UserAuditEvent> {
  const [event] = await db
    .insert(userAuditEvents)
    .values({
      id: randomUUID(),
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!event) {
    throw new Error("User audit event could not be created.");
  }

  return event;
}
