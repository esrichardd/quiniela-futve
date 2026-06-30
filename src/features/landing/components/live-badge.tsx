type LiveBadgeProps = Readonly<{
  compact?: boolean;
  label: string;
}>;

export function LiveBadge({ compact = false, label }: LiveBadgeProps) {
  return (
    <span
      className={`landing-live-badge flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold text-live ${
        compact ? "text-[11px]" : "text-xs"
      }`}
    >
      <span
        aria-hidden="true"
        className="landing-animate-live-blink landing-live-dot size-1.5 rounded-full"
      />
      {label}
    </span>
  );
}
