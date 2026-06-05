import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";

async function getDashboardData(userId: string) {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const [transactions, loans, goals] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId, date: { gte: start, lte: end } },
      include: { category: true },
      orderBy: { date: "desc" },
      take:    10,
    }),
    prisma.loan.findMany({
      where:   { userId, status: { in: ["ACTIVE", "PARTIALLY_PAID"] } },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take:    5,
    }),
    prisma.goal.findMany({
      where:   { userId, isCompleted: false },
      orderBy: { createdAt: "desc" },
      take:    3,
    }),
  ]);

  const totalIncome   = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalLent     = loans
    .filter((l) => l.type === "LENT")
    .reduce((sum, l) => sum + Number(l.amount) - Number(l.paidAmount), 0);

  const totalBorrowed = loans
    .filter((l) => l.type === "BORROWED")
    .reduce((sum, l) => sum + Number(l.amount) - Number(l.paidAmount), 0);

  return {
    totalIncome, totalExpenses, totalLent, totalBorrowed,
    netBalance: totalIncome - totalExpenses,
    transactions, loans, goals, month, year,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data    = await getDashboardData(session!.user!.id!);

  const stats = [
    {
      label: "This month income",
      value: formatCurrency(data.totalIncome),
      icon:  TrendingUp,
      color: "var(--ss-income)",
      bg:    "var(--ss-income-bg)",
    },
    {
      label: "This month expenses",
      value: formatCurrency(data.totalExpenses),
      icon:  TrendingDown,
      color: "var(--ss-expense)",
      bg:    "var(--ss-expense-bg)",
    },
    {
      label: "Money lent out",
      value: formatCurrency(data.totalLent),
      icon:  ArrowUpRight,
      color: "var(--ss-loan)",
      bg:    "var(--ss-loan-bg)",
    },
    {
      label: "Money borrowed",
      value: formatCurrency(data.totalBorrowed),
      icon:  ArrowDownLeft,
      color: "var(--ss-borrow)",
      bg:    "var(--ss-borrow-bg)",
    },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>
            Good morning, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ss-text-3)" }}>
            Here&apos;s your financial snapshot
          </p>
        </div>
        <a
          href="/transactions?new=true"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add transaction</span>
        </a>
      </div>

      {/* Balance card */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: "var(--ss-sidebar-bg)" }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: "#8FA8C0" }}>
          Net balance this month
        </p>
        <p className="text-3xl font-semibold text-white">
          {formatCurrency(data.netBalance)}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: "white", border: "0.5px solid var(--ss-border)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: bg }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-[11px] mb-1" style={{ color: "var(--ss-text-3)" }}>
              {label}
            </p>
            <p className="text-base font-semibold" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div
        className="rounded-xl"
        style={{ background: "white", border: "0.5px solid var(--ss-border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "0.5px solid var(--ss-border)" }}
        >
          <h2 className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
            Recent transactions
          </h2>
          <a
            href="/transactions"
            className="text-xs font-medium"
            style={{ color: "var(--ss-blue-500)" }}
          >
            View all
          </a>
        </div>

        {data.transactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Wallet size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>
              No transactions yet this month
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--ss-subtle)" }}>
            {data.transactions.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const color    = isIncome ? "var(--ss-income)" : "var(--ss-expense)";
              const bg       = isIncome ? "var(--ss-income-bg)" : "var(--ss-expense-bg)";
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: bg, color }}
                    >
                      {tx.category?.name?.slice(0, 2) ?? (isIncome ? "IN" : "EX")}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
                        {tx.description}
                      </p>
                      <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                        {formatDate(tx.date)} · {tx.category?.name ?? "Uncategorised"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold" style={{ color }}>
                    {isIncome ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
