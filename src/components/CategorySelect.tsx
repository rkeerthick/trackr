"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, Check, ChevronDown, X } from "lucide-react";

export interface Category {
  id:   string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
}

interface Props {
  categories: Category[];
  value:      string;
  type:       "INCOME" | "EXPENSE";
  onChange:   (id: string, newCat?: Category) => void;
}

const COLORS = [
  "#E05A6A","#F59C3A","#3A7BD5","#7C5CBF","#2EB87E",
  "#5A8FAA","#D4537E","#14B8A6","#F97316","#8B5CF6",
];

export default function CategorySelect({ categories, value, type, onChange }: Props) {
  const ref        = useRef<HTMLDivElement>(null);
  const [open,     setOpen]    = useState(false);
  const [adding,   setAdding]  = useState(false);
  const [name,     setName]    = useState("");
  const [color,    setColor]   = useState(COLORS[0]);
  const [saving,   setSaving]  = useState(false);
  const [error,    setError]   = useState("");

  const selected = categories.find((c) => c.id === value);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setName("");
        setError("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), type, color, icon: "circle" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }
      const { data: newCat } = await res.json();
      const cat: Category = { id: newCat.id, name: newCat.name, type, color };
      onChange(newCat.id, cat);
      setOpen(false);
      setAdding(false);
      setName("");
      setColor(COLORS[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setAdding(false); setName(""); setError(""); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        style={{
          border:     "0.5px solid var(--ss-border)",
          background: "var(--ss-surface)",
          color:      selected ? "var(--ss-text-1)" : "var(--ss-text-3)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selected.color }} />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span>No category</span>
          )}
        </div>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--ss-text-3)" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: "white",
            border:     "0.5px solid var(--ss-border)",
            boxShadow:  "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight:  260,
          }}
        >
          {/* Category list */}
          {!adding && (
            <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
              {/* No category option */}
              <button type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                style={{ color: "var(--ss-text-3)" }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-200" />
                No category
                {!value && <Check size={13} className="ml-auto" style={{ color: "var(--ss-blue-500)" }} />}
              </button>

              {categories.map((cat) => (
                <button key={cat.id} type="button"
                  onClick={() => { onChange(cat.id); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                  style={{ color: "var(--ss-text-1)" }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="flex-1 truncate">{cat.name}</span>
                  {value === cat.id && <Check size={13} style={{ color: "var(--ss-blue-500)" }} />}
                </button>
              ))}
            </div>
          )}

          {/* Add category inline form */}
          {adding ? (
            <div className="p-3 space-y-3" style={{ borderTop: "0.5px solid var(--ss-border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: "var(--ss-text-1)" }}>New category</p>
                <button type="button" onClick={() => { setAdding(false); setName(""); setError(""); }}>
                  <X size={14} style={{ color: "var(--ss-text-3)" }} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-2.5">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
                  style={{ border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)", color: "var(--ss-text-1)" }}
                />

                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        background:    c,
                        outline:       color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }} />
                  ))}
                </div>

                {error && <p className="text-[11px]" style={{ color: "var(--ss-expense)" }}>{error}</p>}

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setAdding(false); setName(""); setError(""); }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--ss-surface)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !name.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                    style={{ background: "var(--ss-blue-500)" }}>
                    {saving ? "Adding…" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button type="button"
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderTop:  "0.5px solid var(--ss-border)",
                color:      "var(--ss-blue-500)",
                background: "transparent",
              }}>
              <Plus size={14} />
              Add custom category
            </button>
          )}
        </div>
      )}
    </div>
  );
}
