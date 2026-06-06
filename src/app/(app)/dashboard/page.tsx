import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Plus, Target, ChevronRight,
} from "lucide-react";
import SpendingChart from "./SpendingChart";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

async function getDashboardData(userId: string) {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  // 5 months back so we have 6 bars total (including current month)
  const trendStart = new Date(year, month - 6, 1);

  const [allMonthTx, loans, goals, budgets, trendTx] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId, date: { gte: start, lte: end } },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.loan.findMany({
      where: { userId, status: { in: ["ACTIVE", "PARTIALLY_PAID"] } },
    }),
    prisma.goal.findMany({
      where:   { userId, isCompleted: false },
      orderBy: { createdAt: "desc" },
      take:    3,
    }),
    prisma.budget.findMany({
      where:   { userId, month, year },
      include: { category: { select: { id: true, name: true, color: true } } },
    }),
    prisma.transaction.findMany({
      where:  { userId, date: { gte: trendStart, lt: start } },
      select: { type: true, amount: true, date: true },
    }),
  ]);

  const totalIncome   = allMonthTx.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = allMonthTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const totalLent     = loans.filter(l => l.type === "LENT").reduce((s, l) => s + Number(l.amount) - Number(l.paidAmount), 0);
  const totalBorrowed = loans.filter(l => l.type === "BORROWED").reduce((s, l) => s + Number(l.amount) - Number(l.paidAmount), 0);

  // Top spending categories this month
  const catMap = new Map<string, { name: string; color: string; amount: number }>();
  for (const tx of allMonthTx) {
    if (tx.type !== "EXPENSE" || !tx.category) continue;
    const c = catMap.get(tx.categoryId!) ?? { name: tx.category.name, color: tx.category.color, amount: 0 };
    c.amount += Number(tx.amount);
    catMap.set(tx.categoryId!, c);
  }
  const topCategories = [...catMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Budget rows with actual spending
  const spendMap = new Map<string, number>();
  for (const tx of allMonthTx) {
    if (tx.type !== "EXPENSE" || !tx.categoryId) continue;
    spendMap.set(tx.categoryId, (spendMap.get(tx.categoryId) ?? 0) + Number(tx.amount));
  }
  const budgetRows = budgets
    .map(b => ({
      id:       b.id,
      name:     b.category.name,
      color:    b.category.color,
      budgeted: Number(b.amount),
      spent:    spendMap.get(b.categoryId) ?? 0,
    }))
    .sort((a, b) => b.spent / b.budgeted - a.spent / a.budgeted)
    .slice(0, 4);

  // 6-month trend (5 prior months + current)
  const allTx = [...allMonthTx, ...trendTx];
  const trendData = Array.from({ length: 6 }, (_, i) => {
    let m = month - (5 - i);
    let y = year;
    if (m <= 0) { m += 12; y--; }
    const mStart = new Date(y, m - 1, 1);
    const mEnd   = new Date(y, m, 0, 23, 59, 59);
    const mTx    = allTx.filter(tx => {
      const d = new Date(tx.date);
      return d >= mStart && d <= mEnd;
    });
    return {
      label:    MONTH_NAMES[m - 1],
      income:   mTx.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0),
      expenses: mTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  return {
    totalIncome, totalExpenses, totalLent, totalBorrowed,
    netBalance: totalIncome - totalExpenses,
    recentTx:  allMonthTx.slice(0, 8),
    goals:     goals.map(g => ({
      id:           g.id,
      name:         g.name,
      color:        g.color,
      targetAmount: Number(g.targetAmount),
      savedAmount:  Number(g.savedAmount),
    })),
    topCategories,
    budgetRows,
    trendData,
    month, year,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data    = await getDashboardData(session!.user!.id!);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    { label: "Income",   value: data.totalIncome,   icon: TrendingUp,    color: "var(--ss-income)",  bg: "var(--ss-income-bg)"  },
    { label: "Expenses", value: data.totalExpenses,  icon: TrendingDown,  color: "var(--ss-expense)", bg: "var(--ss-expense-bg)" },
    { label: "Lent out", value: data.totalLent,      icon: ArrowUpRight,  color: "var(--ss-loan)",    bg: "var(--ss-loan-bg)"    },
    { label: "Borrowed", value: data.totalBorrowed,  icon: ArrowDownLeft, color: "var(--ss-borrow)",  bg: "var(--ss-borrow-bg)"  },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ss-text-3)" }}>
            {MONTH_NAMES[data.month - 1]} {data.year} overview
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

      {/* Balance + stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Net balance — spans 2 cols on mobile, 2 on desktop */}
        <div
          className="col-span-2 rounded-xl p-5 flex flex-col justify-between"
          style={{ background: "var(--ss-sidebar-bg)", minHeight: 100 }}
        >
          <p className="text-xs font-medium" style={{ color: "#8FA8C0" }}>Net balance · {MONTH_NAMES[data.month - 1]}</p>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(data.netBalance)}</p>
          <p className="text-xs mt-1" style={{ color: data.netBalance >= 0 ? "#2EB87E" : "#E05A6A" }}>
            {data.netBalance >= 0 ? `▲ Saving ${formatCurrency(data.netBalance)}` : `▼ Overspent by ${formatCurrency(Math.abs(data.netBalance))}`}
          </p>
        </div>

        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-[11px] mb-0.5" style={{ color: "var(--ss-text-3)" }}>{label}</p>
            <p className="text-sm font-semibold" style={{ color }}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Spending trend + top categories */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Bar chart */}
        <div className="md:col-span-3 rounded-xl p-5" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>6-month trend</h2>
          </div>
          <SpendingChart data={data.trendData} />
        </div>

        {/* Top spending categories */}
        <div className="md:col-span-2 rounded-xl p-5" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>Top spending</h2>
            <a href="/transactions" className="text-xs" style={{ color: "var(--ss-blue-500)" }}>View all</a>
          </div>

          {data.topCategories.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--ss-text-3)" }}>No expenses this month</p>
          ) : (
            <div className="space-y-3">
              {data.topCategories.map((cat) => {
                const pct = data.totalExpenses > 0 ? (cat.amount / data.totalExpenses) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        <span className="text-xs font-medium truncate max-w-[120px]" style={{ color: "var(--ss-text-1)" }}>{cat.name}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: "var(--ss-expense)" }}>{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--ss-subtle)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Budget overview + Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Budget overview */}
        <div className="rounded-xl" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid var(--ss-border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>Budgets</h2>
            <a href="/budgets" className="text-xs" style={{ color: "var(--ss-blue-500)" }}>Manage</a>
          </div>

          {data.budgetRows.length === 0 ? (
            <div className="py-8 text-center px-5">
              <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No budgets set for this month.</p>
              <a href="/budgets" className="text-xs font-medium mt-2 inline-block" style={{ color: "var(--ss-blue-500)" }}>
                Set up budgets →
              </a>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--ss-border)" }}>
              {data.budgetRows.map((row) => {
                const pct  = row.budgeted > 0 ? Math.min(100, (row.spent / row.budgeted) * 100) : 0;
                const over = row.spent > row.budgeted;
                return (
                  <div key={row.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                        <span className="text-xs font-medium" style={{ color: "var(--ss-text-1)" }}>{row.name}</span>
                        {over && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--ss-expense-bg)", color: "var(--ss-expense)" }}>
                            Over
                          </span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                        {formatCurrency(row.spent)} / {formatCurrency(row.budgeted)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--ss-subtle)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: over ? "var(--ss-expense)" : row.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="rounded-xl" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid var(--ss-border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>Goals</h2>
            <a href="/goals" className="text-xs" style={{ color: "var(--ss-blue-500)" }}>View all</a>
          </div>

          {data.goals.length === 0 ? (
            <div className="py-8 text-center px-5">
              <Target size={28} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No active goals.</p>
              <a href="/goals" className="text-xs font-medium mt-2 inline-block" style={{ color: "var(--ss-blue-500)" }}>
                Create a goal →
              </a>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--ss-border)" }}>
              {data.goals.map((goal) => {
                const pct = goal.targetAmount > 0
                  ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
                  : 0;
                return (
                  <div key={goal.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
                        <span className="text-xs font-medium" style={{ color: "var(--ss-text-1)" }}>{goal.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--ss-subtle)" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, background: goal.color }}
                      />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "var(--ss-text-3)" }}>
                      {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid var(--ss-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>Recent transactions</h2>
          <a href="/transactions" className="flex items-center gap-1 text-xs" style={{ color: "var(--ss-blue-500)" }}>
            View all <ChevronRight size={12} />
          </a>
        </div>

        {data.recentTx.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Wallet size={32} className="mx-auto mb-2 opacity-25" />
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No transactions yet this month</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--ss-subtle)" }}>
            {data.recentTx.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const color    = isIncome ? "var(--ss-income)" : "var(--ss-expense)";
              const bg       = isIncome ? "var(--ss-income-bg)" : "var(--ss-expense-bg)";
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: tx.category ? undefined : bg, backgroundColor: tx.category?.color ? `${tx.category.color}22` : undefined }}
                    >
                      {tx.category
                        ? <span style={{ color: tx.category.color }}>{tx.category.name.slice(0, 2)}</span>
                        : <span style={{ color }}>{isIncome ? "IN" : "EX"}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--ss-text-1)" }}>{tx.description}</p>
                      <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                        {formatDate(tx.date)} · {tx.category?.name ?? "Uncategorised"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0 ml-3" style={{ color }}>
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
