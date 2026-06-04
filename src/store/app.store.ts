import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction, Loan, Budget, Goal, Category, Contact } from "@/types";

interface AppState {
  // ── Sidebar ────────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // ── Active month/year filter ───────────────────
  activeMonth: number;
  activeYear:  number;
  setActiveMonth: (month: number, year: number) => void;

  // ── Cached data (populated by server components) ──
  categories: Category[];
  setCategories: (cats: Category[]) => void;

  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;

  // ── UI flags ───────────────────────────────────
  addTransactionOpen: boolean;
  setAddTransactionOpen: (open: boolean) => void;

  addLoanOpen: boolean;
  setAddLoanOpen: (open: boolean) => void;

  addSplitOpen: boolean;
  setAddSplitOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      activeMonth: new Date().getMonth() + 1,
      activeYear:  new Date().getFullYear(),
      setActiveMonth: (month, year) =>
        set({ activeMonth: month, activeYear: year }),

      categories: [],
      setCategories: (cats) => set({ categories: cats }),

      contacts: [],
      setContacts: (contacts) => set({ contacts }),

      addTransactionOpen: false,
      setAddTransactionOpen: (open) => set({ addTransactionOpen: open }),

      addLoanOpen: false,
      setAddLoanOpen: (open) => set({ addLoanOpen: open }),

      addSplitOpen: false,
      setAddSplitOpen: (open) => set({ addSplitOpen: open }),
    }),
    {
      name: "trackr-app-state",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        activeMonth: s.activeMonth,
        activeYear:  s.activeYear,
      }),
    }
  )
);
