"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface MonthData {
  label:    string;
  income:   number;
  expenses: number;
}

interface Props {
  data: MonthData[];
}

function formatK(v: number) {
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000)    return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}

export default function SpendingChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--ss-text-3)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fontSize: 10, fill: "var(--ss-text-3)" }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value),
            name === "income" ? "Income" : "Expenses",
          ]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 10,
            border: "0.5px solid var(--ss-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          cursor={{ fill: "var(--ss-subtle)" }}
        />
        <Legend
          formatter={(v) => v === "income" ? "Income" : "Expenses"}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="income"   fill="var(--ss-income)"  radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" fill="var(--ss-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
