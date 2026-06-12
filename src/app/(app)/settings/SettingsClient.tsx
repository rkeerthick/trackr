"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { initials } from "@/lib/utils";

interface User {
  name:     string | null;
  email:    string;
  currency: string;
  locale:   string;
  hasPassword: boolean;
}

interface Category {
  id:        string;
  name:      string;
  type:      "INCOME" | "EXPENSE";
  color:     string;
  icon:      string;
  isDefault: boolean;
}

interface Props { user: User; categories: Category[] }

const ICON_OPTIONS = [
  "circle", "tag", "star", "heart", "zap", "coffee", "shopping-cart",
  "shopping-bag", "utensils", "car", "home", "plane", "book", "briefcase",
  "laptop", "gift", "music", "film", "dumbbell", "pill", "baby",
  "dog", "tree", "sun", "moon", "trending-up", "wallet", "banknote",
];

const COLOR_PALETTE = [
  "#E05A6A","#F59C3A","#3A7BD5","#7C5CBF","#2EB87E",
  "#5A8FAA","#D4537E","#6B8099","#E8854A","#4CAF7D",
  "#8B5CF6","#EC4899","#14B8A6","#F97316","#06B6D4",
];

const CURRENCIES = [
  { value: "INR", label: "₹ Indian Rupee (INR)" },
  { value: "USD", label: "$ US Dollar (USD)" },
  { value: "EUR", label: "€ Euro (EUR)" },
  { value: "GBP", label: "£ British Pound (GBP)" },
  { value: "JPY", label: "¥ Japanese Yen (JPY)" },
  { value: "AUD", label: "A$ Australian Dollar (AUD)" },
  { value: "CAD", label: "C$ Canadian Dollar (CAD)" },
  { value: "SGD", label: "S$ Singapore Dollar (SGD)" },
  { value: "AED", label: "AED Dirham (AED)" },
];

const LOCALES = [
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
];

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
} as React.CSSProperties;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
      <div className="px-5 py-3.5" style={{ borderBottom: "0.5px solid var(--ss-border)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>{title}</h2>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

function SaveBtn({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button type="submit" disabled={loading}
      className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-colors"
      style={{ background: saved ? "var(--ss-income)" : "var(--ss-blue-500)" }}>
      {loading ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
    </button>
  );
}

export default function SettingsClient({ user, categories }: Props) {
  const router = useRouter();

  // Categories state
  const [catType,    setCatType]    = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [showCatAdd, setShowCatAdd] = useState(false);
  const [catForm,    setCatForm]    = useState({ name: "", color: COLOR_PALETTE[0], icon: "circle" });
  const [catSaving,  setCatSaving]  = useState(false);
  const [catDeleting,setCatDeleting]= useState<string | null>(null);
  const [catError,   setCatError]   = useState("");

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    setCatError("");
    try {
      const res = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...catForm, type: catType }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShowCatAdd(false);
      setCatForm({ name: "", color: COLOR_PALETTE[0], icon: "circle" });
      router.refresh();
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    setCatDeleting(id);
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setCatDeleting(null);
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories  = categories.filter((c) => c.type === "INCOME");

  // Profile form
  const [name,         setName]         = useState(user.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);
  const [profileError,  setProfileError]  = useState("");

  // Preferences form
  const [currency,     setCurrency]     = useState(user.currency);
  const [locale,       setLocale]       = useState(user.locale);
  const [prefSaving,   setPrefSaving]   = useState(false);
  const [prefSaved,    setPrefSaved]    = useState(false);
  const [prefError,    setPrefError]    = useState("");

  // Password form
  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved,  setPwSaved]  = useState(false);
  const [pwError,  setPwError]  = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault();
    setPrefSaving(true);
    setPrefError("");
    setPrefSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currency, locale }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      setPrefError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPrefSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    setPwSaved(false);
    try {
      const res = await fetch("/api/settings/password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ current: pwForm.current, next: pwForm.next }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Settings</h1>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-white flex-shrink-0"
            style={{ background: "var(--ss-blue-500)" }}>
            {name ? initials(name) : "?"}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>{name || "—"}</p>
            <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>{user.email}</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Display name</label>
            <input type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Email</label>
            <input type="email" value={user.email} disabled
              style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
            <p className="text-[11px] mt-1" style={{ color: "var(--ss-text-3)" }}>Email cannot be changed.</p>
          </div>
          {profileError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{profileError}</p>}
          <div className="flex justify-end">
            <SaveBtn loading={profileSaving} saved={profileSaved} />
          </div>
        </form>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <form onSubmit={savePreferences} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Locale</label>
            <select value={locale} onChange={(e) => setLocale(e.target.value)} style={inputStyle}>
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          {prefError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{prefError}</p>}
          <div className="flex justify-end">
            <SaveBtn loading={prefSaving} saved={prefSaved} />
          </div>
        </form>
      </Section>

      {/* Password */}
      {user.hasPassword && (
        <Section title="Change password">
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Current password</label>
              <input type="password" required value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                placeholder="••••••••" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>New password</label>
              <input type="password" required value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                placeholder="Min. 8 characters" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Confirm new password</label>
              <input type="password" required value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••" style={inputStyle} />
            </div>
            {pwError  && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{pwError}</p>}
            <div className="flex justify-end">
              <SaveBtn loading={pwSaving} saved={pwSaved} />
            </div>
          </form>
        </Section>
      )}

      {!user.hasPassword && (
        <Section title="Password">
          <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>
            You signed in with Google. Password management is handled by your Google account.
          </p>
        </Section>
      )}

      {/* Categories */}
      <Section title="Categories">
        {/* Type tab */}
        <div className="flex rounded-lg overflow-hidden w-fit" style={{ border: "0.5px solid var(--ss-border)" }}>
          {(["EXPENSE","INCOME"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setCatType(t)}
              className="px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: catType === t ? (t === "EXPENSE" ? "var(--ss-expense)" : "var(--ss-income)") : "white",
                color:      catType === t ? "white" : "var(--ss-text-2)",
              }}>
              {t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {/* Category list */}
        <div className="space-y-1.5">
          {(catType === "EXPENSE" ? expenseCategories : incomeCategories).map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: "var(--ss-surface)" }}>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="text-sm" style={{ color: "var(--ss-text-1)" }}>{cat.name}</span>
                {cat.isDefault && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--ss-subtle)", color: "var(--ss-text-3)" }}>
                    default
                  </span>
                )}
              </div>
              {!cat.isDefault && (
                <button onClick={() => deleteCategory(cat.id)} disabled={catDeleting === cat.id}
                  className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40">
                  <Trash2 size={13} style={{ color: "var(--ss-expense)" }} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => { setCatError(""); setShowCatAdd(true); }}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--ss-blue-500)" }}>
          <Plus size={15} /> Add custom category
        </button>
      </Section>

      {/* Sign out */}
      <Section title="Account">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--ss-text-1)" }}>Sign out</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ss-text-3)" }}>
              Sign out of your Trackr account on this device.
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              background: "var(--ss-expense-bg)",
              color:      "var(--ss-expense)",
              border:     "0.5px solid var(--ss-expense-border)",
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </Section>

      {/* Add Category Modal */}
      {showCatAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCatAdd(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>Add category</h2>
              <button onClick={() => setShowCatAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>
            <form onSubmit={addCategory} className="space-y-4">
              {/* Type */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--ss-border)" }}>
                {(["EXPENSE","INCOME"] as const).map((t) => (
                  <button type="button" key={t}
                    onClick={() => setCatType(t)}
                    className="flex-1 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: catType === t ? (t === "EXPENSE" ? "var(--ss-expense)" : "var(--ss-income)") : "white",
                      color: catType === t ? "white" : "var(--ss-text-2)",
                    }}>
                    {t === "EXPENSE" ? "Expense" : "Income"}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Name</label>
                <input type="text" required value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Subscriptions" style={inputStyle} />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => setCatForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        background:  c,
                        outline:     catForm.color === c ? `3px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }} />
                  ))}
                  {/* Custom colour via native colour picker */}
                  <label className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--ss-subtle)", color: "var(--ss-text-3)" }}
                    title="Custom colour">
                    +
                    <input type="color" value={catForm.color} className="sr-only"
                      onChange={(e) => setCatForm((f) => ({ ...f, color: e.target.value }))} />
                  </label>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: catForm.color }} />
                  <span className="text-xs font-mono" style={{ color: "var(--ss-text-3)" }}>{catForm.color}</span>
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Icon</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {ICON_OPTIONS.map((icon) => (
                    <button key={icon} type="button" onClick={() => setCatForm((f) => ({ ...f, icon }))}
                      className="px-2 py-1 rounded text-[11px] transition-colors"
                      style={{
                        background: catForm.icon === icon ? catForm.color : "var(--ss-subtle)",
                        color:      catForm.icon === icon ? "white" : "var(--ss-text-2)",
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {catError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{catError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCatAdd(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--ss-surface)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={catSaving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "var(--ss-blue-500)" }}>
                  {catSaving ? "Saving…" : "Add category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
