"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type InvitationCodeProps = Readonly<{
  code: string;
  copyLabel: string;
  copiedLabel: string;
}>;

export default function InvitationCode({
  code,
  copyLabel,
  copiedLabel,
}: InvitationCodeProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="rounded-xl border border-border bg-background px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-foreground">
        {code}
      </code>
      <button
        type="button"
        onClick={copyCode}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-4 text-success" />
        ) : (
          <Copy aria-hidden="true" className="size-4 text-brand" />
        )}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
