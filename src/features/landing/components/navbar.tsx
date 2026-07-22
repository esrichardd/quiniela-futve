import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { BrandMark } from "./brand-mark";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

export default async function Navbar() {
  const common = await getTranslations("common");

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="landing-glass-card mx-3 mt-3 flex items-center justify-between gap-2 rounded-2xl px-3 py-3 sm:mx-4 sm:mt-4 sm:px-5">
        <Link
          href="/"
          aria-label={common("navigation.home")}
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark className="size-8 rounded-lg" />
          <span className="hidden text-base font-bold tracking-tight text-foreground min-[420px]:inline">
            Quiniela <span className="text-brand">FUTVE</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LocaleSwitch />

          <ThemeToggle
            labels={{
              label: common("theme.label"),
              light: common("theme.light"),
              dark: common("theme.dark"),
              system: common("theme.system"),
            }}
          />

          <Link
            href="/login"
            className="landing-nav-link hidden px-4 py-2 text-sm font-medium sm:block"
          >
            {common("actions.signIn")}
          </Link>
          <Link
            href="/register"
            className="landing-btn-glow hidden rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
          >
            {common("actions.signUp")}
          </Link>
        </div>
      </div>
    </header>
  );
}
