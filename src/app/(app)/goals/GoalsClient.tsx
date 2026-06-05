"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, PiggyBank, Trophy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Goal {
  id:           string;
  name:         string;
  targetAmount: number;
  savedAmount:  number;
  deadline:     string | null;
  icon:         string;
  color:        string;
  isCompleted:  boolean;
}

interface Props { goals: Goal[] }

const COLOR_PALETTE = [
  "#3A7BD5","#2EB87E","#E05A6A","#F59C3A","#7C5CBF",
  "#5A8FAA","#D4537E","#14B8A6","#F97316","#8B5CF6",
];

const GOAL_ICONS = ["target","piggy-bank","home","car","plane","graduation-cap","heart","star","trophy","briefcase","laptop","gift","music","dumbbell","baby"];

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
} as React.CSSProperties;

export default function GoalsClient({ goals }: Props) {
  const router = useRouter();

  const [showAdd,    setShowAdd]    = useState(false);
  const [addGoal,    setAddGoal]    = useState<Goal | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  const [form, setForm] = useState({
    name: "", targetAmount: "", color: COLOR_PALETTE[0],
    icon: "target", deadline: "",
  });
  const [addAmount, setAddAmount] = useState("");

  const active    = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setFormError("");
    try {
      const res = await fetch("/api/goals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, targetAmount: parseFloat(form.targetAmount),
          color: form.color, icon: form.icon,
          deadline: form.deadline || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShowAdd(false);
      setForm({ name: "", targetAmount: "", color: COLOR_PALETTE[0], icon: "target", deadline: "" });
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSubmitting(false); }
  }

  async function handleAddMoney(e: React.FormEvent) {
    e.preventDefault();
    if (!addGoal) return;
    setSubmitting(true); setFormError("");
    try {
      const res = await fetch(`/api/goals/${addGoal.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(addAmount) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setAddGoal(null); setAddAmount("");
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      router.refresh();
    } finally { setDeleting(null); }
  }

  function GoalCard({ goal }: { goal: Goal }) {
    const pct       = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
    const remaining = goal.targetAmount - goal.savedAmount;
    const isOver    = pct >= 100;

    return (
      <div className="rounded-xl p-5" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: goal.color + "22" }}>
              {isOver
                ? <Trophy size={20} style={{ color: goal.color }} />
                : <PiggyBank size={20} style={{ color: goal.color }} />}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>{goal.name}</p>
              {goal.deadline && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--ss-text-3)" }}>
                  Due {formatDate(goal.deadline)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!goal.isCompleted && (
              <button onClick={() => { setAddGoal(goal); setAddAmount(""); setFormError(""); }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                style={{ background: goal.color + "22", color: goal.color }}>
                + Add
              </button>
            )}
            <button onClick={() => handleDelete(goal.id)} disabled={deleting === goal.id}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 ml-1">
              <Trash2 size={13} style={{ color: "var(--ss-expense)" }} />
            </button>
          </div>
        </div>

        {/* Amounts */}
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Saved</p>
            <p className="text-lg font-bold" style={{ color: goal.color }}>
              {formatCurrency(goal.savedAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Target</p>
            <p className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 rounded-full mb-1.5" style={{ background: "var(--ss-subtle)" }}>
          <div className="h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%`, background: isOver ? "#2EB87E" : goal.color }} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold" style={{ color: isOver ? "#2EB87E" : goal.color }}>
            {pct.toFixed(0)}% complete
          </p>
          {!isOver && (
            <p className="text-[11px]" style={{ color: "var(--ss-text-3)" }}>
              {formatCurrency(remaining)} to go
            </p>
          )}
          {isOver && (
            <p className="text-[11px] font-semibold" style={{ color: "#2EB87E" }}>🎉 Goal reached!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--ss-text-1)" }}>Goals</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ss-text-3)" }}>
            {active.length} active · {completed.length} completed
          </p>
        </div>
        <button onClick={() => { setFormError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--ss-blue-500)" }}>
          <Plus size={15} />
          <span className="hidden sm:inline">New goal</span>
        </button>
      </div>

      {/* Active goals */}
      {active.length === 0 && completed.length === 0 ? (
        <div className="rounded-xl py-20 text-center" style={{ background: "white", border: "0.5px solid var(--ss-border)" }}>
          <PiggyBank size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium" style={{ color: "var(--ss-text-2)" }}>No goals yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: "var(--ss-text-3)" }}>
            Set a savings goal and track your progress
          </p>
          <button onClick={() => { setFormError(""); setShowAdd(true); }}
            className="text-sm font-medium" style={{ color: "var(--ss-blue-500)" }}>
            Create your first goal →
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map((g) => <GoalCard key={g.id} goal={g} />)}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "var(--ss-text-3)" }}>Completed</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completed.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>New goal</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Goal name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Emergency fund" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>Target amount (₹)</label>
                <input type="number" min="1" step="1" required value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="e.g. 100000" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Deadline <span style={{ color: "var(--ss-text-3)" }}>(optional)</span>
                </label>
                <input type="date" value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--ss-text-2)" }}>Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }} />
                  ))}
                </div>
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
                  {submitting ? "Saving…" : "Create goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {addGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setAddGoal(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--ss-text-1)" }}>Add savings</h2>
              <button onClick={() => setAddGoal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} style={{ color: "var(--ss-text-3)" }} />
              </button>
            </div>

            <div className="mb-4 px-3 py-2.5 rounded-lg" style={{ background: "var(--ss-surface)" }}>
              <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Goal</p>
              <p className="text-sm font-semibold" style={{ color: addGoal.color }}>{addGoal.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ss-text-3)" }}>
                {formatCurrency(addGoal.savedAmount)} saved of {formatCurrency(addGoal.targetAmount)}
              </p>
            </div>

            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
                  Amount to add (₹)
                </label>
                <input type="number" min="1" step="1" required value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0" style={inputStyle} autoFocus />
              </div>

              {formError && <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddGoal(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--ss-surface)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: addGoal.color }}>
                  {submitting ? "Saving…" : "Add savings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
