"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  month: string;
  income: number;
  expenses: number;
  prevMonthExpenses: number;
  topCategories: { name: string; amount: number }[];
  budgets: { name: string; budgeted: number; spent: number }[];
  goals: { name: string; targetAmount: number; savedAmount: number }[];
}

export default function AIInsights(props: Props) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    fetch("/api/ai/insights", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(props),
    })
      .then((r) => r.json())
      .then((d) => setInsights(d.insights ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl p-5" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--ss-blue-50)" }}>
          <Sparkles size={13} style={{ color: "var(--ss-blue-500)" }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>AI Insights</h2>
      </div>

      {loading && (
        <div className="space-y-2.5">
          {[80, 65, 90].map((w) => (
            <div key={w} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 animate-pulse" style={{ background: "var(--ss-blue-500)" }} />
              <div className="h-3.5 rounded animate-pulse flex-1" style={{ width: `${w}%`, background: "var(--ss-subtle)" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Could not load insights. Check your Groq API key.</p>
      )}

      {!loading && !error && insights.length === 0 && (
        <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Not enough data yet for insights.</p>
      )}

      {!loading && !error && insights.length > 0 && (
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--ss-blue-500)" }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--ss-text-2)" }}>{insight}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
