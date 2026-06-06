"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import CategorySelect, { Category as SelectCategory } from "@/components/CategorySelect";

interface Category {
  id:    string;
  name:  string;
  color: string;
}

interface BudgetRow {
  id:         string | null; // null = no budget set yet
  category:   Category;
  budgeted:   number;
  spent:      number;
}

interface Props {
  rows:   BudgetRow[];
  categories: Category[]; // expense categories without a budget (for add form)
  month:  number;
  year:   number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function BudgetsClient({ rows, categories, month, year }: Props) {
  const router = useRouter();

  const [localCats, setLocalCats] = useState<SelectCategory[]>(
    () => categories.map((c) => ({ ...c, type: "EXPENSE" as const }))
  );

  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<BudgetRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [formError,  setFormError]  = useState("");

  const [form, setForm] = useState({ categoryId: "", amount: "" });

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year;
    if (m < 1)  { m = 12; y--; }
    if (m > 12) { m = 1;  y++; }
    router.push(`/budgets?month=${m}&year=${y}`);
  }

  function openAdd() {
    setEditing(null);
    setForm({ categoryId: localCats[0]?.id ?? "", amount: "" });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: BudgetRow) {
    setEditing(row);
    setForm({ categoryId: row.category.id, amount: String(row.budgeted) });
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/budgets", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          categoryId: editing ? editing.category.id : form.categoryId,
          amount:     parseFloat(form.amount),
          month,
          year,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  const totalBudgeted = rows.filter((r) => r.id).reduce((s, r) => s + r.budgeted, 0);
  const totalSpent    = rows.filter((r) => r.id).reduce((s, r) => s + r.spent, 0);
  const overBudget    = rows.filter((r) => r.id && r.spent > r.budgeted).length;

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: "8px",
    border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
    color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
  } as React.CSSProperties;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Budgets</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg px-2 py-1.5"
            style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
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
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--ss-blue-500)" }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add budget</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total budgeted", value: totalBudgeted, color: "var(--ss-blue-500)" },
          { label: "Total spent",    value: totalSpent,    color: totalSpent > totalBudgeted ? "var(--ss-expense)" : "var(--ss-income)" },
          { label: "Remaining",      value: Math.max(0, totalBudgeted - totalSpent), color: "var(--ss-text-1)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--ss-text-3)" }}>{label}</p>
            <p className="text-lg font-semibold" style={{ color }}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {overBudget > 0 && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "var(--ss-expense-bg)", color: "var(--ss-expense)", border: "0.5px solid var(--ss-expense-border)" }}>
          {overBudget} {overBudget === 1 ? "category is" : "categories are"} over budget this month.
        </div>
      )}

      {/* Budget rows */}
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No budgets set for this month.</p>
            <button onClick={openAdd} className="mt-3 text-sm font-medium" style={{ color: "var(--ss-blue-500)" }}>
              Add your first budget →
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--ss-border)" }}>
            {rows.map((row) => {
              const pct      = row.budgeted > 0 ? Math.min(100, (row.spent / row.budgeted) * 100) : 0;
              const over     = row.id && row.spent > row.budgeted;
              const barColor = over ? "var(--ss-expense)" : row.category.color;

              return (
                <div key={row.category.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.category.color }} />
                      <span className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
                        {row.category.name}
                      </span>
                      {over && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--ss-expense-bg)", color: "var(--ss-expense)" }}>
                          Over budget
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                        {formatCurrency(row.spent)} / {row.id ? formatCurrency(row.budgeted) : "—"}
                      </span>
                      {row.id && (
                        <>
                          <button onClick={() => openEdit(row)} className="p-1 rounded hover:bg-gray-100 transition-colors">
                            <Pencil size={13} style={{ color: "var(--ss-text-3)" }} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id!)}
                            disabled={deleting === row.id}
                            className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={13} style={{ color: "var(--ss-expense)" }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {row.id ? (
                    <>
                      <div className="h-2 rounded-full" style={{ background: "var(--ss-subtle)" }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: "var(--ss-text-3)" }}>
                        {pct.toFixed(0)}% used
                        {row.spent < row.budgeted && ` · ${formatCurrency(row.budgeted - row.spent)} remaining`}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px]" style={{ color: "var(--ss-text-3)" }}>No budget set</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>
                {editing ? "Edit budget" : "Add budget"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                    Category
                  </label>
                  <CategorySelect
                    categories={localCats}
                    value={form.categoryId}
                    type="EXPENSE"
                    onChange={(id, newCat) => {
                      if (newCat) setLocalCats((prev) => [...prev, newCat]);
                      setForm((f) => ({ ...f, categoryId: id }));
                    }}
                  />
                </div>
              )}

              {editing && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--ss-surface)" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: editing.category.color }} />
                  <span className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>{editing.category.name}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Budget amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  style={inputStyle}
                />
              </div>

              {formError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
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
