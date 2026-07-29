import "server-only";

import {
  getAdminDomainMetrics,
  type AdminDomainMetrics,
} from "@/server/dal/admin-dashboard";

export type AdminDashboardMetrics = AdminDomainMetrics;

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return getAdminDomainMetrics();
}
