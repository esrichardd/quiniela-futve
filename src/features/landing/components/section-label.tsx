import type { ReactNode } from "react";

type SectionLabelProps = Readonly<{
  children: ReactNode;
}>;

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span
      className="landing-section-label rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
    >
      {children}
    </span>
  );
}
