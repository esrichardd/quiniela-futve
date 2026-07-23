"use client";

import { useState } from "react";

type DateTimeFieldProps = Readonly<{
  id: string;
  label: string;
  initialValue?: string;
}>;

export default function DateTimeField({
  id,
  label,
  initialValue,
}: DateTimeFieldProps) {
  const [localValue, setLocalValue] = useState(() =>
    initialValue ? toLocalInputValue(new Date(initialValue)) : "",
  );
  const instant = localValue ? new Date(localValue).toISOString() : "";

  return (
    <label htmlFor={id} className="block text-sm font-semibold">
      {label}
      <input
        id={id}
        type="datetime-local"
        required
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-foreground"
      />
      <input type="hidden" name="startsAt" value={instant} />
    </label>
  );
}

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
