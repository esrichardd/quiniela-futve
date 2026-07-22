"use client";

import PoolListError from "@/features/pools/components/pool-list-error";

type DashboardHomeErrorProps = Readonly<{
  reset: () => void;
}>;

export default function DashboardHomeError({ reset }: DashboardHomeErrorProps) {
  return <PoolListError reset={reset} />;
}
