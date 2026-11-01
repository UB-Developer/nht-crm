import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInMonths, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "PKR 0";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSAR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "SAR 0";
  return `SAR ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function formatUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy");
  } catch {
    return "-";
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd MMM yyyy, hh:mm a");
  } catch {
    return "-";
  }
}

export function isPassportExpiringSoon(expiryDate: Date | string): boolean {
  try {
    const exp = typeof expiryDate === "string" ? parseISO(expiryDate) : expiryDate;
    const monthsRemaining = differenceInMonths(exp, new Date());
    return monthsRemaining < 6;
  } catch {
    return false;
  }
}
