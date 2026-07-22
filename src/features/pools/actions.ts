"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPoolSchema, joinPoolSchema } from "@/features/pools/schemas";
import type { PoolActionState } from "@/features/pools/types";
import {
  AuthenticationRequiredError,
  EmailVerificationRequiredError,
  UserBannedError,
} from "@/server/auth/session";
import {
  CompetitionUnavailableError,
  createPool,
  InvalidInvitationCodeError,
  joinPool,
} from "@/server/services/pools";

export async function createPoolAction(
  _previousState: PoolActionState,
  formData: FormData,
): Promise<PoolActionState> {
  const locale = formData.get("locale");
  const configuration = parseJson(formData.get("configuration"));
  const parsedInput = createPoolSchema.safeParse(configuration);

  if ((locale !== "es" && locale !== "en") || !parsedInput.success) {
    return errorState("invalid_configuration");
  }

  let poolId: string;
  try {
    poolId = await createPool(parsedInput.data);
  } catch (error) {
    if (error instanceof CompetitionUnavailableError) {
      return errorState("competition_unavailable");
    }
    if (isAuthenticationError(error)) {
      return errorState("authentication_required");
    }
    return errorState("creation_failed");
  }

  revalidatePath(`/${locale}/home`);
  redirect(`/${locale}/pools/${poolId}?created=1`);
}

export async function joinPoolAction(
  _previousState: PoolActionState,
  formData: FormData,
): Promise<PoolActionState> {
  const parsedInput = joinPoolSchema.safeParse({
    code: formData.get("code"),
    locale: formData.get("locale"),
  });

  if (!parsedInput.success) {
    return errorState("invalid_invitation_code");
  }

  let poolId: string;
  try {
    poolId = await joinPool(parsedInput.data.code);
  } catch (error) {
    if (error instanceof InvalidInvitationCodeError) {
      return errorState("invalid_invitation_code");
    }
    if (isAuthenticationError(error)) {
      return errorState("authentication_required");
    }
    return errorState("join_failed");
  }

  revalidatePath(`/${parsedInput.data.locale}/home`);
  redirect(`/${parsedInput.data.locale}/pools/${poolId}`);
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") {
    return null;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isAuthenticationError(error: unknown): boolean {
  return (
    error instanceof AuthenticationRequiredError ||
    error instanceof EmailVerificationRequiredError ||
    error instanceof UserBannedError
  );
}

function errorState(
  error: Exclude<PoolActionState, { status: "idle" }>["error"],
): PoolActionState {
  return { status: "error", error };
}
