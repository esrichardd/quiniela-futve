import "server-only";

import type { PoolRole } from "@/features/pools/types";
import { getPoolMembershipRole } from "@/server/dal/pools";

export class PoolMembershipRequiredError extends Error {
  constructor() {
    super("Pool membership is required.");
    this.name = "PoolMembershipRequiredError";
  }
}

export class PoolAdminRequiredError extends Error {
  constructor() {
    super("Pool administrator permission is required.");
    this.name = "PoolAdminRequiredError";
  }
}

export async function requirePoolMembership(
  poolId: string,
  userId: string,
): Promise<PoolRole> {
  const role = await getPoolMembershipRole(poolId, userId);

  if (!role) {
    throw new PoolMembershipRequiredError();
  }

  return role;
}

export async function requirePoolAdmin(
  poolId: string,
  userId: string,
): Promise<void> {
  const role = await requirePoolMembership(poolId, userId);

  assertPoolAdmin(role);
}

export function assertPoolAdmin(role: PoolRole): void {
  if (role !== "pool_admin") throw new PoolAdminRequiredError();
}
