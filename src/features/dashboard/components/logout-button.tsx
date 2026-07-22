"use client";

import { LogOut } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";

type LogoutButtonProps = Readonly<{
  label: string;
  locale: string;
}>;

export default function LogoutButton({ label, locale }: LogoutButtonProps) {

  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut aria-hidden="true" className="size-4 text-brand" />
        {label}
      </button>
    </form>
  );
}
