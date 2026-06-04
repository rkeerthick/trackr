"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface Category {
  id:    string;
  name:  string;
  color: string;
  type:  "INCOME" | "EXPENSE";
}

interface Transaction {
  id:       string;
  type:     "INCOME" | "EXPENSE";
  amount:   number;
  date:     string;
  category: Category | null;
}

interface MonthlyPoint {
  label:   string;
  income:  number;
  expense: number;
}

interface Props {
  transactions:  Transaction[];
  monthlyTrend:  MonthlyPoint[];
  month:         number;
  year:          number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(v: number) {
  return formatCurrency(v);
}

export default function AnalyticsClient({ transactions, monthlyTrend, month, year }: Props) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    router.push(`/analytics?month=${m}&year=${y}`);
  }

  const totalIncome  = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const net          = totalIncome - totalExpense;

  // Category breakdown for pie
  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; value: number }>();
    for (const tx of transactions) {
      if (tx.type !== activeType) continue;
      const key   = tx.category?.id ?? "__none__";
      const name  = tx.category?.name ?? "Uncategorised";
      const color = tx.category?.color ?? "#6B8099";
      if (!map.has(key)) map.set(key, { name, color, value: 0 });
      map.get(key)!.value += tx.amount;
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [transactions, activeType]);

  const pieTotal = byCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header + month nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Analytics</h1>
        <div
          className="flex items-center gap-1 rounded-lg px-2 py-1.5"
          style={{ background: "white", border: "0.5px solid var(--ss-border)" }}
        >
          <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <ChevronLeft size={15} style={{ color: "var(--ss-text-2)" }} />
          </button>
          <span className="text-sm font-medium min-w-[90px] text-center" style={{ color: "var(--ss-text-1)" }}>
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <ChevronRight size={15} style={{ color: "var(--ss-text-2)" }} />
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Income",   value: totalIncome,  color: "var(--ss-income)",  bg: "var(--ss-income-bg)"  },
          { label: "Expenses", value: totalExpense, color: "var(--ss-expense)", bg: "var(--ss-expense-bg)" },
          { label: "Net",      value: net,           color: net >= 0 ? "var(--ss-income)" : "var(--ss-expense)", bg: net >= 0 ? "var(--ss-income-bg)" : "var(--ss-expense-bg)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--ss-text-3)" }}>{label}</p>
            <p className="text-xl font-semibold" style={{ color }}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* 6-month bar chart */}
      <div className="rounded-xl p-5" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--ss-text-1)" }}>
          Income vs Expenses — last 6 months
        </h2>
        {monthlyTrend.every((p) => p.income === 0 && p.expense === 0) ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend} barCategoryGap="30%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--ss-text-3)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--ss-text-3)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid var(--ss-border)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income"  name="Income"   fill="var(--ss-income)"  radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expenses" fill="var(--ss-expense)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdown */}
      <div className="rounded-xl p-5" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
            Breakdown by category
          </h2>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--ss-border)" }}>
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className="px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: activeType === t
                    ? (t === "EXPENSE" ? "var(--ss-expense)" : "var(--ss-income)")
                    : "white",
                  color: activeType === t ? "white" : "var(--ss-text-2)",
                }}
              >
                {t === "EXPENSE" ? "Expenses" : "Income"}
              </button>
            ))}
          </div>
        </div>

        {byCategory.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No data for this period</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Pie */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="flex-1 space-y-2 w-full">
              {byCategory.map((cat) => {
                const pct = pieTotal > 0 ? (cat.value / pieTotal) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: cat.color }}
                        />
                        <span className="text-xs font-medium" style={{ color: "var(--ss-text-1)" }}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-xs font-semibold" style={{ color: "var(--ss-text-1)" }}>
                          {fmt(cat.value)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--ss-subtle)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
