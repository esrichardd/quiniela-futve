"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

export default function LogoutButton() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/login")}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <LogOut aria-hidden="true" className="size-4 text-brand" />
      {t("actions.signOut")}
    </button>
  );
}
