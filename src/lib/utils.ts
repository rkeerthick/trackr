import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// ── Tailwind class merger ──────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency formatting ────────────────────────────

export function formatCurrency(
  amount: number,
  currency = "INR",
  locale = "en-IN"
): string {
  return new Intl.NumberFormat(locale, {
    style:    "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmount(amount: number, prefix?: "+" | "-"): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(abs);
  return prefix ? `${prefix}${formatted}` : formatted;
}

// ── Date formatting ────────────────────────────────

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d))     return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM yyyy");
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "d MMM");
}

export function formatDateFull(date: string | Date): string {
  return format(new Date(date), "d MMMM yyyy");
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1), "MMMM yyyy");
}

// ── Number helpers ────────────────────────────────

export function formatCompact(amount: number): string {
  if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(1)}L`;
  if (amount >= 1_000)     return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
}

export function calcPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ── String helpers ────────────────────────────────

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function truncate(str: string, len = 32): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── Transaction type helpers ──────────────────────

export function getTransactionColor(type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME" ? "var(--ss-income)" : "var(--ss-expense)";
}

export function getAmountPrefix(type: "INCOME" | "EXPENSE"): "+" | "-" {
  return type === "INCOME" ? "+" : "-";
}

export function getLoanColor(type: "LENT" | "BORROWED"): string {
  return type === "LENT" ? "var(--ss-loan)" : "var(--ss-borrow)";
}
