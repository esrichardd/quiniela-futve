import "server-only";

import type { PoolRole } from "@/features/pools/types";

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

export function assertPoolAdmin(role: PoolRole): void {
  if (role !== "pool_admin") throw new PoolAdminRequiredError();
}
