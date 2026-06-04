import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AnalyticsClient from "./AnalyticsClient";

async function getData(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  // Current month transactions
  const transactions = await prisma.transaction.findMany({
    where:   { userId, date: { gte: start, lte: end } },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  // Last 6 months for the trend chart
  const trendStart = new Date(year, month - 7, 1);
  const trendTx    = await prisma.transaction.findMany({
    where:   { userId, date: { gte: trendStart, lte: end } },
    select:  { type: true, amount: true, date: true },
  });

  const monthMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(year, month - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthMap.set(key, { income: 0, expense: 0 });
    // Store label separately — we'll rebuild below
    void lbl;
  }

  for (const tx of trendTx) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) continue;
    const entry = monthMap.get(key)!;
    if (tx.type === "INCOME")  entry.income  += Number(tx.amount);
    else                       entry.expense += Number(tx.amount);
  }

  const monthlyTrend = Array.from(monthMap.entries()).map(([key, val]) => {
    const [y, m] = key.split("-").map(Number);
    const label  = new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "2-digit" });
    return { label, income: val.income, expense: val.expense };
  });

  return {
    transactions: transactions.map((tx) => ({
      id:     tx.id,
      type:   tx.type as "INCOME" | "EXPENSE",
      amount: Number(tx.amount),
      date:   tx.date.toISOString(),
      category: tx.category
        ? { id: tx.category.id, name: tx.category.name, color: tx.category.color, type: tx.category.type as "INCOME" | "EXPENSE" }
        : null,
    })),
    monthlyTrend,
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await getServerSession(authOptions);
  const now     = new Date();
  const month   = Number(searchParams.month) || now.getMonth() + 1;
  const year    = Number(searchParams.year)  || now.getFullYear();

  const { transactions, monthlyTrend } = await getData(session!.user!.id!, month, year);

  return (
    <AnalyticsClient
      transactions={transactions}
      monthlyTrend={monthlyTrend}
      month={month}
      year={year}
    />
  );
}
