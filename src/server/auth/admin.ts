import "server-only";

import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";
import { assertPlatformAdmin } from "@/server/auth/permissions";
import { requireDashboardUser } from "@/server/auth/dashboard";
import type { AppUser } from "@/server/services/users";

export async function requirePlatformAdmin(locale: Locale): Promise<AppUser> {
  const appUser = await requireDashboardUser(locale);

  try {
    assertPlatformAdmin(appUser.profile.globalRole);
  } catch {
    redirect(`/${locale}/home`);
  }

  return appUser;
}
