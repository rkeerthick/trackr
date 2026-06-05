"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search, Trash2, Phone, Mail, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency, initials } from "@/lib/utils";

interface LoanSummary {
  totalLent:     number;
  totalBorrowed: number;
}

interface Contact {
  id:      string;
  name:    string;
  phone:   string | null;
  email:   string | null;
  notes:   string | null;
  loans:   LoanSummary;
}

interface Props {
  contacts: Contact[];
}

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
} as React.CSSProperties;

export default function ContactsClient({ contacts }: Props) {
  const router = useRouter();

  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const filtered = useMemo(() =>
    contacts.filter((c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    ),
    [contacts, search]
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/contacts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:  form.name,
          phone: form.phone  || undefined,
          email: form.email  || undefined,
          notes: form.notes  || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShowAdd(false);
      setForm({ name: "", phone: "", email: "", notes: "" });
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
      await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Contacts</h1>
        <button
          onClick={() => { setFormError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add contact</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        <Search size={14} style={{ color: "var(--ss-text-3)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts…"
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: "var(--ss-text-1)" }}
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X size={13} style={{ color: "var(--ss-text-3)" }} />
          </button>
        )}
      </div>

      {/* Contact list */}
      <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>
              {search ? "No contacts match your search." : "No contacts yet."}
            </p>
            {!search && (
              <button onClick={() => { setFormError(""); setShowAdd(true); }}
                className="mt-3 text-sm font-medium" style={{ color: "var(--ss-blue-500)" }}>
                Add your first contact →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--ss-border)" }}>
            {filtered.map((contact) => (
              <div key={contact.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white"
                  style={{ background: "var(--ss-blue-500)" }}
                >
                  {initials(contact.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>
                    {contact.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--ss-text-3)" }}>
                        <Phone size={11} />
                        {contact.phone}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--ss-text-3)" }}>
                        <Mail size={11} />
                        {contact.email}
                      </span>
                    )}
                    {!contact.phone && !contact.email && (
                      <span className="text-xs" style={{ color: "var(--ss-text-3)" }}>No contact info</span>
                    )}
                  </div>
                </div>

                {/* Loan badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {contact.loans.totalLent > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                      style={{ background: "var(--ss-loan-bg)", color: "var(--ss-loan)" }}>
                      <ArrowUpRight size={11} />
                      {formatCurrency(contact.loans.totalLent)}
                    </span>
                  )}
                  {contact.loans.totalBorrowed > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                      style={{ background: "var(--ss-borrow-bg)", color: "var(--ss-borrow)" }}>
                      <ArrowDownLeft size={11} />
                      {formatCurrency(contact.loans.totalBorrowed)}
                    </span>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(contact.id)}
                  disabled={deleting === contact.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Trash2 size={14} style={{ color: "var(--ss-expense)" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>Add contact</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ravi Kumar" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Phone <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Email <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Notes <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes" style={inputStyle} />
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
