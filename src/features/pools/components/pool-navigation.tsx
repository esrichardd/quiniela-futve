import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function PoolNavigation({
  poolId,
  active,
}: Readonly<{
  poolId: string;
  active: "summary" | "matchdays" | "members";
}>) {
  const t = await getTranslations("pools");
  const items = [
    { key: "summary" as const, href: `/pools/${poolId}` },
    { key: "matchdays" as const, href: `/pools/${poolId}/matchdays` },
    { key: "members" as const, href: `/pools/${poolId}?section=members#members` },
  ];
  return (
    <nav aria-label={t("detail.navigation.label")} className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-bold ${
            active === item.key
              ? "border-brand text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t(`detail.navigation.${item.key}`)}
        </Link>
      ))}
    </nav>
  );
}
