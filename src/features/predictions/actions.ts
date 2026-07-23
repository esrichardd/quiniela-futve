"use server";

import { revalidatePath } from "next/cache";

import { saveMatchdayPredictionsActionSchema } from "@/features/predictions/schemas";
import type { SaveMatchdayPredictionsState } from "@/features/predictions/types";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import {
  AuthenticationRequiredError,
  EmailVerificationRequiredError,
  UserBannedError,
} from "@/server/auth/session";
import { savePredictions } from "@/server/services/predictions";

export async function saveMatchdayPredictionsAction(
  _previousState: SaveMatchdayPredictionsState,
  formData: FormData,
): Promise<SaveMatchdayPredictionsState> {
  const poolId = formData.get("poolId");
  const locale = formData.get("locale");
  const predictions = parseJson(formData.get("predictions"));

  const parsedInput = saveMatchdayPredictionsActionSchema.safeParse({
    poolId,
    locale,
    predictions,
  });

  if (!parsedInput.success) {
    return { status: "error", error: "prediction_invalid" };
  }

  try {
    const outcomes = await savePredictions(
      parsedInput.data.poolId,
      parsedInput.data.predictions.map((item) =>
        item.kind === "result"
          ? { matchId: item.matchId, payload: { kind: "result", result: item.result } }
          : {
              matchId: item.matchId,
              payload: {
                kind: "score",
                homeScore: item.homeScore,
                awayScore: item.awayScore,
              },
            },
      ),
    );

    revalidatePath(`/${parsedInput.data.locale}/pools/${parsedInput.data.poolId}/matchdays`);
    return { status: "completed", outcomes };
  } catch (error) {
    if (isAuthenticationError(error)) {
      return { status: "error", error: "authentication_required" };
    }
    if (error instanceof PoolMembershipRequiredError) {
      return { status: "error", error: "pool_unavailable" };
    }
    return { status: "error", error: "save_failed" };
  }
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return null;
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
