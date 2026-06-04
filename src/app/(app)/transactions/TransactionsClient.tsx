"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Category {
  id:   string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface Transaction {
  id:          string;
  type:        "INCOME" | "EXPENSE";
  amount:      number;
  description: string;
  notes:       string | null;
  date:        string;
  category:    Category | null;
}

interface Props {
  transactions: Transaction[];
  categories:   Category[];
  month:        number;
  year:         number;
  openAdd:      boolean;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const inputStyle = {
  width:      "100%",
  padding:    "8px 12px",
  borderRadius: "8px",
  border:     "0.5px solid var(--ss-border)",
  background: "var(--ss-surface)",
  color:      "var(--ss-text-1)",
  fontSize:   "13px",
  outline:    "none",
} as React.CSSProperties;

export default function TransactionsClient({
  transactions,
  categories,
  month,
  year,
  openAdd,
}: Props) {
  const router = useRouter();

  const [showModal,   setShowModal]   = useState(openAdd);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");

  const [form, setForm] = useState({
    type:        "EXPENSE" as "INCOME" | "EXPENSE",
    amount:      "",
    description: "",
    categoryId:  "",
    date:        new Date().toISOString().split("T")[0],
    notes:       "",
  });

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, search]);

  const totalIncome  = filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const net          = totalIncome - totalExpense;

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    router.push(`/transactions?month=${m}&year=${y}`);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const key = tx.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/transactions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          amount:     parseFloat(form.amount),
          categoryId: form.categoryId || undefined,
          notes:      form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setShowModal(false);
      setForm({ type: "EXPENSE", amount: "", description: "", categoryId: "", date: new Date().toISOString().split("T")[0], notes: "" });
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>
          Transactions
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}
        >
          <Plus size={15} />
          Add transaction
        </button>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">

        {/* Month navigator */}
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

        {/* Type pills */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--ss-border)" }}>
          {(["ALL", "INCOME", "EXPENSE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: typeFilter === t ? "var(--ss-blue-500)" : "white",
                color:      typeFilter === t ? "white" : "var(--ss-text-2)",
              }}
            >
              {t === "ALL" ? "All" : t === "INCOME" ? "Income" : "Expense"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-1.5 rounded-lg"
          style={{ background: "white", border: "0.5px solid var(--ss-border)" }}
        >
          <Search size={14} style={{ color: "var(--ss-text-3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "var(--ss-text-1)" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={13} style={{ color: "var(--ss-text-3)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Income",   value: totalIncome,  color: "var(--ss-income)",  bg: "var(--ss-income-bg)"  },
          { label: "Expenses", value: totalExpense, color: "var(--ss-expense)", bg: "var(--ss-expense-bg)" },
          { label: "Net",      value: net,           color: net >= 0 ? "var(--ss-income)" : "var(--ss-expense)", bg: net >= 0 ? "var(--ss-income-bg)" : "var(--ss-expense-bg)" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: "white", border: "0.5px solid var(--ss-border)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--ss-text-3)" }}>{label}</p>
            <p className="text-lg font-semibold" style={{ color }}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "white", border: "0.5px solid var(--ss-border)" }}
      >
        {grouped.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>
              No transactions found
            </p>
          </div>
        ) : (
          grouped.map(([dateKey, txs]) => (
            <div key={dateKey}>
              <div
                className="px-5 py-2 text-xs font-medium"
                style={{
                  background:   "var(--ss-surface)",
                  color:        "var(--ss-text-3)",
                  borderBottom: "0.5px solid var(--ss-border)",
                }}
              >
                {formatDate(dateKey)}
              </div>
              {txs.map((tx) => {
                const isIncome = tx.type === "INCOME";
                const color    = isIncome ? "var(--ss-income)"     : "var(--ss-expense)";
                const bg       = isIncome ? "var(--ss-income-bg)"  : "var(--ss-expense-bg)";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: "0.5px solid var(--ss-subtle)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: bg, color }}
                      >
                        {tx.category?.name?.slice(0, 2).toUpperCase() ?? (isIncome ? "IN" : "EX")}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
                          {tx.description}
                        </p>
                        <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                          {tx.category?.name ?? "Uncategorised"}
                          {tx.notes && ` · ${tx.notes}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color }}>
                      {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>
                Add transaction
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--ss-border)" }}>
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t, categoryId: "" }))}
                    className="flex-1 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: form.type === t
                        ? (t === "INCOME" ? "var(--ss-income)" : "var(--ss-expense)")
                        : "white",
                      color: form.type === t ? "white" : "var(--ss-text-2)",
                    }}
                  >
                    {t === "INCOME" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Lunch at restaurant"
                  style={inputStyle}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">No category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Notes <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any extra notes"
                  style={inputStyle}
                />
              </div>

              {formError && (
                <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    background: "var(--ss-surface)",
                    color:      "var(--ss-text-2)",
                    border:     "0.5px solid var(--ss-border)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--ss-blue-500)" }}
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
