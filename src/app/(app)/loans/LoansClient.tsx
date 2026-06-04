"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Contact { id: string; name: string }

interface Loan {
  id:          string;
  type:        "LENT" | "BORROWED";
  amount:      number;
  paidAmount:  number;
  description: string;
  notes:       string | null;
  dueDate:     string | null;
  status:      "ACTIVE" | "PARTIALLY_PAID" | "SETTLED" | "OVERDUE";
  contact:     Contact;
}

interface Props {
  loans:    Loan[];
  contacts: Contact[];
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:          { bg: "var(--ss-blue-50)",     color: "var(--ss-blue-500)", label: "Active"         },
  PARTIALLY_PAID:  { bg: "var(--ss-borrow-bg)",   color: "var(--ss-borrow)",   label: "Partial"        },
  SETTLED:         { bg: "var(--ss-income-bg)",    color: "var(--ss-income)",   label: "Settled"        },
  OVERDUE:         { bg: "var(--ss-expense-bg)",   color: "var(--ss-expense)",  label: "Overdue"        },
};

type Filter = "ACTIVE" | "SETTLED" | "ALL";

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
} as React.CSSProperties;

export default function LoansClient({ loans, contacts }: Props) {
  const router = useRouter();

  const [filter,      setFilter]      = useState<Filter>("ACTIVE");
  const [showAdd,     setShowAdd]     = useState(false);
  const [repayLoan,   setRepayLoan]   = useState<Loan | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");

  const [addForm, setAddForm] = useState({
    type: "LENT" as "LENT" | "BORROWED",
    contactId:   "",
    amount:      "",
    description: "",
    notes:       "",
    dueDate:     "",
  });

  const [repayForm, setRepayForm] = useState({
    amount: "",
    date:   new Date().toISOString().split("T")[0],
    notes:  "",
  });

  const visible = loans.filter((l) =>
    filter === "ALL"     ? true :
    filter === "ACTIVE"  ? ["ACTIVE","PARTIALLY_PAID","OVERDUE"].includes(l.status) :
                           l.status === "SETTLED"
  );

  const lent     = loans.filter((l) => l.type === "LENT"     && l.status !== "SETTLED");
  const borrowed = loans.filter((l) => l.type === "BORROWED" && l.status !== "SETTLED");
  const totalLent     = lent.reduce((s, l)     => s + l.amount - l.paidAmount, 0);
  const totalBorrowed = borrowed.reduce((s, l) => s + l.amount - l.paidAmount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/loans", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...addForm,
          amount:  parseFloat(addForm.amount),
          notes:   addForm.notes   || undefined,
          dueDate: addForm.dueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShowAdd(false);
      setAddForm({ type: "LENT", contactId: "", amount: "", description: "", notes: "", dueDate: "" });
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRepay(e: React.FormEvent) {
    e.preventDefault();
    if (!repayLoan) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/loans/${repayLoan.id}/repayments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount: parseFloat(repayForm.amount),
          date:   repayForm.date,
          notes:  repayForm.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setRepayLoan(null);
      setRepayForm({ amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Loans</h1>
        <button
          onClick={() => { setFormError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}
        >
          <Plus size={15} />
          Add loan
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} style={{ color: "var(--ss-loan)" }} />
            <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Money lent out</p>
          </div>
          <p className="text-xl font-semibold" style={{ color: "var(--ss-loan)" }}>
            {formatCurrency(totalLent)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--ss-text-3)" }}>
            across {lent.length} active {lent.length === 1 ? "loan" : "loans"}
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={16} style={{ color: "var(--ss-borrow)" }} />
            <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Money borrowed</p>
          </div>
          <p className="text-xl font-semibold" style={{ color: "var(--ss-borrow)" }}>
            {formatCurrency(totalBorrowed)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--ss-text-3)" }}>
            across {borrowed.length} active {borrowed.length === 1 ? "loan" : "loans"}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg overflow-hidden w-fit" style={{ border: "0.5px solid var(--ss-border)" }}>
        {(["ACTIVE","SETTLED","ALL"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "var(--ss-blue-500)" : "white",
              color:      filter === f ? "white" : "var(--ss-text-2)",
            }}>
            {f === "ACTIVE" ? "Active" : f === "SETTLED" ? "Settled" : "All"}
          </button>
        ))}
      </div>

      {/* Loan list */}
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No loans here.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--ss-border)" }}>
            {visible.map((loan) => {
              const isLent   = loan.type === "LENT";
              const color    = isLent ? "var(--ss-loan)"    : "var(--ss-borrow)";
              const bg       = isLent ? "var(--ss-loan-bg)" : "var(--ss-borrow-bg)";
              const outstanding = loan.amount - loan.paidAmount;
              const pct      = loan.amount > 0 ? (loan.paidAmount / loan.amount) * 100 : 0;
              const ss       = STATUS_STYLE[loan.status];

              return (
                <div key={loan.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                        {isLent
                          ? <ArrowUpRight size={16} style={{ color }} />
                          : <ArrowDownLeft size={16} style={{ color }} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
                            {loan.contact.name}
                          </p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: ss.bg, color: ss.color }}>
                            {ss.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: isLent ? "var(--ss-loan-bg)" : "var(--ss-borrow-bg)", color }}>
                            {isLent ? "Lent" : "Borrowed"}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--ss-text-3)" }}>
                          {loan.description}
                          {loan.dueDate && ` · Due ${formatDate(loan.dueDate)}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold" style={{ color }}>
                        {formatCurrency(outstanding)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>
                        of {formatCurrency(loan.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  {loan.paidAmount > 0 && (
                    <div className="mt-3 ml-12">
                      <div className="h-1.5 rounded-full mb-1" style={{ background: "var(--ss-subtle)" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--ss-text-3)" }}>
                        {formatCurrency(loan.paidAmount)} repaid ({pct.toFixed(0)}%)
                      </p>
                    </div>
                  )}

                  {loan.status !== "SETTLED" && (
                    <div className="mt-3 ml-12">
                      <button
                        onClick={() => { setRepayLoan(loan); setFormError(""); setRepayForm({ amount: "", date: new Date().toISOString().split("T")[0], notes: "" }); }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: bg, color }}>
                        Record repayment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>Add loan</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {/* Type */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--ss-border)" }}>
                {(["LENT","BORROWED"] as const).map((t) => (
                  <button type="button" key={t}
                    onClick={() => setAddForm((f) => ({ ...f, type: t }))}
                    className="flex-1 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: addForm.type === t ? (t === "LENT" ? "var(--ss-loan)" : "var(--ss-borrow)") : "white",
                      color: addForm.type === t ? "white" : "var(--ss-text-2)",
                    }}>
                    {t === "LENT" ? "I lent money" : "I borrowed money"}
                  </button>
                ))}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Contact</label>
                {contacts.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: "var(--ss-expense)" }}>
                    No contacts yet. Add contacts from the Contacts page first.
                  </p>
                ) : (
                  <select value={addForm.contactId} onChange={(e) => setAddForm((f) => ({ ...f, contactId: e.target.value }))} required style={inputStyle}>
                    <option value="">Select contact</option>
                    {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Amount (₹)</label>
                <input type="number" min="1" step="0.01" required value={addForm.amount}
                  onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0" style={inputStyle} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Description</label>
                <input type="text" required value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Rent advance" style={inputStyle} />
              </div>

              {/* Due date */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Due date <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="date" value={addForm.dueDate}
                  onChange={(e) => setAddForm((f) => ({ ...f, dueDate: e.target.value }))}
                  style={inputStyle} />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Notes <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="text" value={addForm.notes}
                  onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes" style={inputStyle} />
              </div>

              {formError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--ss-surface)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting || contacts.length === 0}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--ss-blue-500)" }}>
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {repayLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRepayLoan(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>Record repayment</h2>
              <button onClick={() => setRepayLoan(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: "var(--ss-surface)" }}>
              <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Outstanding</p>
              <p className="text-base font-semibold" style={{ color: repayLoan.type === "LENT" ? "var(--ss-loan)" : "var(--ss-borrow)" }}>
                {formatCurrency(repayLoan.amount - repayLoan.paidAmount)} — {repayLoan.contact.name}
              </p>
            </div>

            <form onSubmit={handleRepay} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Amount received (₹)</label>
                <input type="number" min="0.01" step="0.01" required value={repayForm.amount}
                  onChange={(e) => setRepayForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Date</label>
                <input type="date" required value={repayForm.date}
                  onChange={(e) => setRepayForm((f) => ({ ...f, date: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Notes <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="text" value={repayForm.notes}
                  onChange={(e) => setRepayForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes" style={inputStyle} />
              </div>

              {formError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setRepayLoan(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--ss-surface)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--ss-blue-500)" }}>
                  {submitting ? "Saving…" : "Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
