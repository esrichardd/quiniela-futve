"use client";

import { useSyncExternalStore } from "react";

type LocalDateTimeProps = Readonly<{
  /** Absolute instant in ISO 8601 (UTC), as serialized by the service layer. */
  iso: string;
  locale: string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  timeZoneName?: Intl.DateTimeFormatOptions["timeZoneName"];
}>;

/** Never emits; the snapshot flips once, when React swaps it after hydration. */
function subscribe(): () => void {
  return () => {};
}

/**
 * Renders a stored instant in the *device's* time zone.
 *
 * Every timestamp is stored as an absolute instant (`timestamptz`, normalized
 * to UTC by Postgres) and crosses the server/client boundary as an ISO string.
 * Formatting is the only time zone dependent step, so it happens here and
 * nowhere else — no time zone is threaded through props or read from the
 * database.
 *
 * The device zone is not knowable on the server, so this renders in two
 * passes. Before hydration the instant is formatted in UTC, which is
 * deterministic and therefore produces byte-identical server and hydration
 * output (no mismatch, no `suppressHydrationWarning`). `useSyncExternalStore`
 * returns its server snapshot during hydration and its client snapshot right
 * after, at which point `Intl.DateTimeFormat` is called with no explicit
 * `timeZone` and resolves to the real device zone.
 *
 * The visible consequence is a brief UTC flash on first paint. That is the
 * deliberate trade for not asking users to configure anything.
 */
export default function LocalDateTime({
  iso,
  locale,
  dateStyle,
  timeStyle,
  timeZoneName,
}: LocalDateTimeProps) {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const label = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZoneName,
    timeZone: isHydrated ? undefined : "UTC",
  }).format(new Date(iso));

  return <time dateTime={iso}>{label}</time>;
}
