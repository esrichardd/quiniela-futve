"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addSeasonTeamSchema,
  createMatchdaySchema,
  createMatchSchema,
  createSeasonSchema,
  createTeamSchema,
  updateMatchdayStatusSchema,
  updateMatchSchema,
  updateSeasonStatusSchema,
} from "./schemas";
import type { CatalogActionErrorCode, CatalogActionState } from "./types";
import { PlatformAdminRequiredError } from "@/server/auth/permissions";
import {
  AuthenticationRequiredError,
  EmailVerificationRequiredError,
  UserBannedError,
} from "@/server/auth/session";
import {
  addTeamToSeason,
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogTransitionError,
  createMatch,
  createMatchday,
  createSeason,
  createTeam,
  transitionMatchday,
  updateMatch,
  updateSeasonStatus,
} from "@/server/services/competition-catalog";

export async function createSeasonAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const locale = parseLocale(formData);
  const input = createSeasonSchema.safeParse(Object.fromEntries(formData));
  if (!locale || !input.success) return errorState("invalid_input");
  let seasonId: string;
  try {
    seasonId = await createSeason(input.data);
  } catch (error) {
    return mapError(error);
  }
  revalidatePath(`/${locale}/admin/competitions`);
  redirect(`/${locale}/admin/competitions/${input.data.competitionId}/seasons/${seasonId}`);
}

export async function updateSeasonStatusAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return runMutation(formData, updateSeasonStatusSchema, updateSeasonStatus, "season_status_updated");
}

export async function createTeamAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return runMutation(formData, createTeamSchema, createTeam, "team_created");
}

export async function addSeasonTeamAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return runMutation(formData, addSeasonTeamSchema, addTeamToSeason, "team_added");
}

export async function createMatchdayAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return runMutation(formData, createMatchdaySchema, createMatchday, "matchday_created");
}

export async function updateMatchdayStatusAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return runMutation(formData, updateMatchdayStatusSchema, transitionMatchday, "matchday_updated");
}

export async function createMatchAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  return runMutation(formData, createMatchSchema, createMatch, "match_created");
}

export async function updateMatchAction(
  _previous: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const locale = parseLocale(formData);
  const parsed = updateMatchSchema.safeParse(Object.fromEntries(formData));
  if (!locale || !parsed.success) return errorState("invalid_input");
  try {
    await updateMatch({
      ...parsed.data,
      homeScore: parsed.data.homeScore === "" ? null : parsed.data.homeScore,
      awayScore: parsed.data.awayScore === "" ? null : parsed.data.awayScore,
    });
    revalidatePath(`/${locale}/admin/competitions`);
    revalidatePath(`/${locale}/pools`, "layout");
    return { status: "success", message: "match_updated" };
  } catch (error) {
    return mapError(error);
  }
}

async function runMutation<T>(
  formData: FormData,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
  mutation: (input: T) => Promise<void>,
  message: string,
): Promise<CatalogActionState> {
  const locale = parseLocale(formData);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!locale || !parsed.success) return errorState("invalid_input");
  try {
    await mutation(parsed.data);
    revalidatePath(`/${locale}/admin/competitions`);
    revalidatePath(`/${locale}/pools`, "layout");
    return { status: "success", message };
  } catch (error) {
    return mapError(error);
  }
}

function parseLocale(formData: FormData): "es" | "en" | null {
  const locale = formData.get("locale");
  return locale === "es" || locale === "en" ? locale : null;
}

function mapError(error: unknown): CatalogActionState {
  if (
    error instanceof AuthenticationRequiredError ||
    error instanceof EmailVerificationRequiredError ||
    error instanceof UserBannedError
  ) return errorState("authentication_required");
  if (error instanceof PlatformAdminRequiredError) return errorState("forbidden");
  if (error instanceof CatalogNotFoundError) return errorState("not_found");
  if (error instanceof CatalogConflictError) return errorState("conflict");
  if (error instanceof CatalogTransitionError) return errorState("invalid_transition");
  return errorState("operation_failed");
}

function errorState(error: CatalogActionErrorCode): CatalogActionState {
  return { status: "error", error };
}
