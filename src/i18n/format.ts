import { intlTag, type Locale } from "./index";

export function fmtNumber(locale: Locale, n: number | null | undefined, opts?: Intl.NumberFormatOptions) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(intlTag[locale], opts).format(n);
}

export function fmtPercent(locale: Locale, n: number | null | undefined, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(intlTag[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(n) + "%";
}

export function fmtDelta(locale: Locale, n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + fmtNumber(locale, n, { maximumFractionDigits: 1 });
}

export function fmtDate(locale: Locale, d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(intlTag[locale], opts ?? { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function fmtMonth(locale: Locale, d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(intlTag[locale], { month: "long", year: "numeric" }).format(date);
}
