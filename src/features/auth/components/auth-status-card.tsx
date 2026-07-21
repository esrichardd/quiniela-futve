import type { ComponentProps, ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/i18n/navigation";

type AuthStatusCardProps = Readonly<{
  title: string;
  subtitle: string;
  note: string;
  actionLabel: string;
  actionHref: ComponentProps<typeof Link>["href"];
  icon: ComponentType<LucideProps>;
}>;

export default function AuthStatusCard({
  title,
  subtitle,
  note,
  actionLabel,
  actionHref,
  icon: Icon,
}: AuthStatusCardProps) {
  return (
    <section className="auth-card w-full max-w-md rounded-2xl p-6 text-center sm:p-8">
      <div className="auth-icon-badge mx-auto mb-6 size-14 rounded-2xl">
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.8} />
      </div>

      <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
      <p className="mt-4 rounded-xl border border-border bg-brand/5 px-4 py-3 text-xs leading-relaxed text-subtle-text">
        {note}
      </p>

      <Link
        href={actionHref}
        className="auth-secondary-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {actionLabel}
      </Link>
    </section>
  );
}
