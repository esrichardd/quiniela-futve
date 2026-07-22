import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { CompetitionOption } from "@/features/pools/types";
import { db } from "@/server/db/client";
import { competitions } from "@/server/db/schema";

export async function listActiveCompetitions(): Promise<
  ReadonlyArray<CompetitionOption>
> {
  return db
    .select({
      id: competitions.id,
      code: competitions.code,
      name: competitions.name,
    })
    .from(competitions)
    .where(eq(competitions.isActive, true))
    .orderBy(asc(competitions.name));
}

export async function isCompetitionActive(
  competitionId: string,
): Promise<boolean> {
  const [competition] = await db
    .select({ id: competitions.id })
    .from(competitions)
    .where(
      and(
        eq(competitions.id, competitionId),
        eq(competitions.isActive, true),
      ),
    )
    .limit(1);

  return Boolean(competition);
}
