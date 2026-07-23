"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CatalogActionState } from "../types";
import { initialCatalogActionState } from "../types";

type CatalogActionFormProps = Readonly<{
  action: (
    previousState: CatalogActionState,
    formData: FormData,
  ) => Promise<CatalogActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel: string;
  confirmMessage?: string;
  className?: string;
}>;

export default function CatalogActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  confirmMessage,
  className,
}: CatalogActionFormProps) {
  const locale = useLocale();
  const t = useTranslations("competitionCatalog");
  const [state, formAction, pending] = useActionState(
    action,
    initialCatalogActionState,
  );

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state.status === "error" ? (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p role="status" aria-live="polite" className="text-sm text-success">
          {t(`success.${state.message}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
