import type { PoolCurrency } from "@/features/pools/types";

export function formatMinorCurrency(
  locale: string,
  currency: PoolCurrency,
  minorValue: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(BigInt(minorValue)) / 100);
}

export function formatPercentage(locale: string, basisPoints: number): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(basisPoints / 10_000);
}
