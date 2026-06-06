"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, RefreshCw, Pause, Play, Trash2 } from "lucide-react";
import CategorySelect, { type Category as CatType } from "@/components/CategorySelect";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FREQUENCY_LABELS } from "@/types";

interface Category { id: string; name: string; type: "INCOME" | "EXPENSE" }

interface RecurringRule {
  id:          string;
  type:        "INCOME" | "EXPENSE";
  amount:      number;
  description: string;
  category:    Category | null;
  frequency:   keyof typeof FREQUENCY_LABELS;
  startDate:   string;
  nextDate:    string;
  endDate:     string | null;
  isActive:    boolean;
}

interface Props {
  rules:      RecurringRule[];
  categories: Category[];
}

const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as (keyof typeof FREQUENCY_LABELS)[];

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
} as React.CSSProperties;

export default function RecurringClient({ rules, categories }: Props) {
  const router = useRouter();

  const [showAdd,    setShowAdd]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acting,     setActing]     = useState<string | null>(null);
  const [formError,  setFormError]  = useState("");
  const [filter,     setFilter]     = useState<"ACTIVE" | "ALL">("ACTIVE");

  const [form, setForm] = useState({
    type:        "EXPENSE" as "INCOME" | "EXPENSE",
    amount:      "",
    description: "",
    categoryId:  "",
    frequency:   "MONTHLY" as keyof typeof FREQUENCY_LABELS,
    startDate:   new Date().toISOString().split("T")[0],
    endDate:     "",
  });

  const [localCats, setLocalCats] = useState(categories);
  const filteredCategories = localCats.filter((c) => c.type === form.type);
  const visible = filter === "ACTIVE" ? rules.filter((r) => r.isActive) : rules;

  function handleCategoryChange(id: string, newCat?: CatType) {
    if (newCat) setLocalCats((prev) => [...prev, newCat]);
    setForm((f) => ({ ...f, categoryId: id }));
  }
  const activeCount   = rules.filter((r) => r.isActive).length;
  const inactiveCount = rules.filter((r) => !r.isActive).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/recurring", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          amount:     parseFloat(form.amount),
          categoryId: form.categoryId || undefined,
          endDate:    form.endDate    || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShowAdd(false);
      setForm({ type: "EXPENSE", amount: "", description: "", categoryId: "", frequency: "MONTHLY", startDate: new Date().toISOString().split("T")[0], endDate: "" });
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string) {
    setActing(id);
    try {
      await fetch(`/api/recurring/${id}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(id: string) {
    setActing(id + "-del");
    try {
      await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Recurring</h1>
        <button
          onClick={() => { setFormError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add rule</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Active rules",   value: activeCount,   color: "var(--ss-income)" },
          { label: "Paused rules",   value: inactiveCount, color: "var(--ss-text-3)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--ss-text-3)" }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex rounded-lg overflow-hidden w-fit" style={{ border: "0.5px solid var(--ss-border)" }}>
        {(["ACTIVE","ALL"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "var(--ss-blue-500)" : "white",
              color:      filter === f ? "white" : "var(--ss-text-2)",
            }}>
            {f === "ACTIVE" ? "Active" : "All"}
          </button>
        ))}
      </div>

      {/* Rules list */}
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No recurring rules yet.</p>
            <button onClick={() => { setFormError(""); setShowAdd(true); }}
              className="mt-3 text-sm font-medium" style={{ color: "var(--ss-blue-500)" }}>
              Add your first rule →
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--ss-border)" }}>
            {visible.map((rule) => {
              const isIncome = rule.type === "INCOME";
              const color    = isIncome ? "var(--ss-income)"    : "var(--ss-expense)";
              const bg       = isIncome ? "var(--ss-income-bg)" : "var(--ss-expense-bg)";
              const isOver   = new Date(rule.nextDate) < new Date();

              return (
                <div key={rule.id} className="flex items-center gap-4 px-5 py-4"
                  style={{ opacity: rule.isActive ? 1 : 0.55 }}>

                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}>
                    <RefreshCw size={15} style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
                        {rule.description}
                      </p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: bg, color }}>
                        {isIncome ? "Income" : "Expense"}
                      </span>
                      {!rule.isActive && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--ss-subtle)", color: "var(--ss-text-3)" }}>
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ss-text-3)" }}>
                      {FREQUENCY_LABELS[rule.frequency]}
                      {rule.category && ` · ${rule.category.name}`}
                      {rule.isActive && (
                        <span style={{ color: isOver ? "var(--ss-expense)" : "var(--ss-text-3)" }}>
                          {" · "}Next: {formatDate(rule.nextDate)}
                          {isOver && " (overdue)"}
                        </span>
                      )}
                      {rule.endDate && ` · Ends ${formatDate(rule.endDate)}`}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color }}>
                      {isIncome ? "+" : "−"}{formatCurrency(rule.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(rule.id)}
                      disabled={acting === rule.id}
                      title={rule.isActive ? "Pause" : "Resume"}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40">
                      {rule.isActive
                        ? <Pause size={14} style={{ color: "var(--ss-text-3)" }} />
                        : <Play  size={14} style={{ color: "var(--ss-income)" }} />}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={acting === rule.id + "-del"}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                      <Trash2 size={14} style={{ color: "var(--ss-expense)" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>Add recurring rule</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Type */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--ss-border)" }}>
                {(["EXPENSE","INCOME"] as const).map((t) => (
                  <button type="button" key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t, categoryId: "" }))}
                    className="flex-1 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: form.type === t ? (t === "INCOME" ? "var(--ss-income)" : "var(--ss-expense)") : "white",
                      color: form.type === t ? "white" : "var(--ss-text-2)",
                    }}>
                    {t === "INCOME" ? "Income" : "Expense"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Description</label>
                <input type="text" required value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Netflix subscription" style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Amount (₹)</label>
                <input type="number" min="1" step="0.01" required value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Frequency</label>
                <select value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as keyof typeof FREQUENCY_LABELS }))}
                  style={inputStyle}>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Category</label>
                <CategorySelect
                  categories={filteredCategories}
                  value={form.categoryId}
                  type={form.type}
                  onChange={handleCategoryChange}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Start date</label>
                <input type="date" required value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  End date <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="date" value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  style={inputStyle} />
              </div>

              {formError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--ss-surface)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--ss-blue-500)" }}>
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
