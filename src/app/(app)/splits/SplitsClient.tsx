"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Contact { id: string; name: string }

interface SplitMember {
  id:          string;
  contactId:   string;
  shareAmount: number;
  isPaid:      boolean;
  paidAt:      string | null;
  contact:     Contact;
}

interface Split {
  id:          string;
  title:       string;
  totalAmount: number;
  date:        string;
  notes:       string | null;
  status:      "UNSETTLED" | "PARTIALLY_SETTLED" | "SETTLED";
  members:     SplitMember[];
}

interface Props {
  splits:   Split[];
  contacts: Contact[];
}

type Filter = "UNSETTLED" | "SETTLED" | "ALL";

const STATUS_STYLE = {
  UNSETTLED:          { bg: "var(--ss-expense-bg)",   color: "var(--ss-expense)",   label: "Unsettled"  },
  PARTIALLY_SETTLED:  { bg: "var(--ss-borrow-bg)",    color: "var(--ss-borrow)",    label: "Partial"    },
  SETTLED:            { bg: "var(--ss-income-bg)",     color: "var(--ss-income)",    label: "Settled"    },
};

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
} as React.CSSProperties;

interface MemberRow { contactId: string; shareAmount: string }

export default function SplitsClient({ splits, contacts }: Props) {
  const router = useRouter();

  const [filter,     setFilter]     = useState<Filter>("UNSETTLED");
  const [showAdd,    setShowAdd]    = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [toggling,   setToggling]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  const [form, setForm] = useState({
    title: "", totalAmount: "", date: new Date().toISOString().split("T")[0], notes: "",
  });
  const [members, setMembers] = useState<MemberRow[]>([{ contactId: "", shareAmount: "" }]);

  const usedContactIds = members.map((m) => m.contactId).filter(Boolean);

  const visible = useMemo(() =>
    splits.filter((s) =>
      filter === "ALL"      ? true :
      filter === "UNSETTLED" ? ["UNSETTLED","PARTIALLY_SETTLED"].includes(s.status) :
                               s.status === "SETTLED"
    ),
    [splits, filter]
  );

  function addMemberRow() {
    setMembers((m) => [...m, { contactId: "", shareAmount: "" }]);
  }

  function removeMemberRow(i: number) {
    setMembers((m) => m.filter((_, idx) => idx !== i));
  }

  function splitEqually() {
    const total = parseFloat(form.totalAmount);
    if (!total || members.length === 0) return;
    const share = (total / members.length).toFixed(2);
    setMembers((m) => m.map((r) => ({ ...r, shareAmount: share })));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const validMembers = members.filter((m) => m.contactId && m.shareAmount);
    if (validMembers.length === 0) {
      setFormError("Add at least one member with a share amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/splits", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:       form.title,
          totalAmount: parseFloat(form.totalAmount),
          date:        form.date,
          notes:       form.notes || undefined,
          members:     validMembers.map((m) => ({
            contactId:   m.contactId,
            shareAmount: parseFloat(m.shareAmount),
          })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShowAdd(false);
      setForm({ title: "", totalAmount: "", date: new Date().toISOString().split("T")[0], notes: "" });
      setMembers([{ contactId: "", shareAmount: "" }]);
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePaid(splitId: string, memberId: string) {
    setToggling(memberId);
    try {
      await fetch(`/api/splits/${splitId}/members/${memberId}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Splits</h1>
        <button
          onClick={() => { setFormError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}
        >
          <Plus size={15} />
          New split
        </button>
      </div>

      {/* Filter */}
      <div className="flex rounded-lg overflow-hidden w-fit" style={{ border: "0.5px solid var(--ss-border)" }}>
        {(["UNSETTLED","SETTLED","ALL"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "var(--ss-blue-500)" : "white",
              color:      filter === f ? "white" : "var(--ss-text-2)",
            }}>
            {f === "UNSETTLED" ? "Active" : f === "SETTLED" ? "Settled" : "All"}
          </button>
        ))}
      </div>

      {/* Split list */}
      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>No splits here.</p>
          </div>
        ) : (
          visible.map((split) => {
            const ss          = STATUS_STYLE[split.status];
            const paidCount   = split.members.filter((m) => m.isPaid).length;
            const isExpanded  = expanded === split.id;

            return (
              <div key={split.id} className="rounded-xl overflow-hidden"
                style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>

                {/* Header row */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : split.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--ss-split-bg)" }}>
                      <Users size={16} style={{ color: "var(--ss-split)" }} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>{split.title}</p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ss-text-3)" }}>
                        {formatDate(split.date)} · {paidCount}/{split.members.length} paid
                        {split.notes && ` · ${split.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>
                      {formatCurrency(split.totalAmount)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--ss-text-3)" }}>
                      {isExpanded ? "▲ hide" : "▼ details"}
                    </p>
                  </div>
                </button>

                {/* Members (expanded) */}
                {isExpanded && (
                  <div style={{ borderTop: "0.5px solid var(--ss-border)" }}>
                    {split.members.map((member) => (
                      <div key={member.id}
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: "0.5px solid var(--ss-subtle)" }}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePaid(split.id, member.id)}
                            disabled={toggling === member.id}
                            className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
                            style={{
                              borderColor: member.isPaid ? "var(--ss-income)" : "var(--ss-border)",
                              background:  member.isPaid ? "var(--ss-income)" : "transparent",
                            }}>
                            {member.isPaid && <Check size={12} color="white" strokeWidth={3} />}
                          </button>
                          <div>
                            <p className="text-sm font-medium" style={{
                              color: member.isPaid ? "var(--ss-text-3)" : "var(--ss-text-1)",
                              textDecoration: member.isPaid ? "line-through" : "none",
                            }}>
                              {member.contact.name}
                            </p>
                            {member.isPaid && member.paidAt && (
                              <p className="text-[11px]" style={{ color: "var(--ss-text-3)" }}>
                                Paid {formatDate(member.paidAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold" style={{
                          color: member.isPaid ? "var(--ss-income)" : "var(--ss-text-1)",
                        }}>
                          {formatCurrency(member.shareAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Split Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>New split</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Title</label>
                <input type="text" required value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Goa trip" style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Total amount (₹)</label>
                <input type="number" min="1" step="0.01" required value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Date</label>
                <input type="date" required value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Notes <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes" style={inputStyle} />
              </div>

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: "var(--ss-text-2)" }}>Members</label>
                  {form.totalAmount && members.length > 0 && (
                    <button type="button" onClick={splitEqually}
                      className="text-xs font-medium" style={{ color: "var(--ss-blue-500)" }}>
                      Split equally
                    </button>
                  )}
                </div>

                {contacts.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: "var(--ss-expense)" }}>
                    No contacts yet. Add contacts from the Contacts page first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((row, i) => {
                      const available = contacts.filter(
                        (c) => c.id === row.contactId || !usedContactIds.includes(c.id)
                      );
                      return (
                        <div key={i} className="flex gap-2 items-center">
                          <select value={row.contactId}
                            onChange={(e) => setMembers((m) => m.map((r, idx) => idx === i ? { ...r, contactId: e.target.value } : r))}
                            style={{ ...inputStyle, flex: 2 }}>
                            <option value="">Select</option>
                            {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <input type="number" min="0.01" step="0.01" placeholder="₹ share"
                            value={row.shareAmount}
                            onChange={(e) => setMembers((m) => m.map((r, idx) => idx === i ? { ...r, shareAmount: e.target.value } : r))}
                            style={{ ...inputStyle, flex: 1 }} />
                          {members.length > 1 && (
                            <button type="button" onClick={() => removeMemberRow(i)}
                              className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0">
                              <X size={14} style={{ color: "var(--ss-expense)" }} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {members.length < contacts.length && (
                      <button type="button" onClick={addMemberRow}
                        className="flex items-center gap-1.5 text-xs font-medium mt-1"
                        style={{ color: "var(--ss-blue-500)" }}>
                        <Plus size={13} /> Add member
                      </button>
                    )}
                  </div>
                )}
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
                  {submitting ? "Saving…" : "Create split"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
