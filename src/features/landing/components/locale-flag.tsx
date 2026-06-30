import type { Locale } from "@/i18n/routing";

type LocaleFlagProps = Readonly<{
  locale: Locale;
}>;

function SpanishFlag() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 14"
      className="h-3.5 w-5 rounded-sm"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="20" height="14" fill="#c60b1e" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </svg>
  );
}

function EnglishFlag() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 14"
      className="h-3.5 w-5 rounded-sm"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="20" height="14" fill="#012169" />
      <line x1="0" y1="0" x2="20" y2="14" stroke="white" strokeWidth="2.8" />
      <line x1="20" y1="0" x2="0" y2="14" stroke="white" strokeWidth="2.8" />
      <line x1="0" y1="0" x2="20" y2="14" stroke="#C8102E" strokeWidth="1.6" />
      <line x1="20" y1="0" x2="0" y2="14" stroke="#C8102E" strokeWidth="1.6" />
      <rect x="8.5" y="0" width="3" height="14" fill="white" />
      <rect x="0" y="5.5" width="20" height="3" fill="white" />
      <rect x="9" y="0" width="2" height="14" fill="#C8102E" />
      <rect x="0" y="6" width="20" height="2" fill="#C8102E" />
    </svg>
  );
}

export function LocaleFlag({ locale }: LocaleFlagProps) {
  return locale === "es" ? <SpanishFlag /> : <EnglishFlag />;
}
