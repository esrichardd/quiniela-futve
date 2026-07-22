import "server-only";

import { redirect } from "next/navigation";

import type { Locale } from "@/i18n/routing";
import { getCurrentAppUser } from "@/server/auth/session";
import type { AppUser } from "@/server/services/users";
import { isUserBanned } from "@/server/services/users";

export async function requireDashboardUser(locale: Locale): Promise<AppUser> {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect(`/${locale}/login`);
  }

  if (isUserBanned(appUser.profile)) {
    redirect(`/${locale}/login?reason=user_banned`);
  }

  if (!appUser.emailVerified) {
    redirect(`/${locale}/verify-email`);
  }

  return appUser;
}
