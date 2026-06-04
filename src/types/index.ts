// src/types/index.ts

export type TransactionType = "INCOME" | "EXPENSE";
export type LoanType        = "LENT" | "BORROWED";
export type LoanStatus      = "ACTIVE" | "PARTIALLY_PAID" | "SETTLED" | "OVERDUE";
export type SplitStatus     = "UNSETTLED" | "PARTIALLY_SETTLED" | "SETTLED";
export type RecurringFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface User {
  id:       string;
  name:     string | null;
  email:    string;
  image:    string | null;
  currency: string;
  locale:   string;
}

export interface Category {
  id:        string;
  name:      string;
  icon:      string;
  color:     string;
  type:      TransactionType;
  isDefault: boolean;
}

export interface Transaction {
  id:          string;
  type:        TransactionType;
  amount:      number;
  currency:    string;
  description: string;
  notes?:      string;
  date:        string;
  category?:   Category;
  recurringRuleId?: string;
  createdAt:   string;
}

export interface Loan {
  id:          string;
  type:        LoanType;
  amount:      number;
  paidAmount:  number;
  currency:    string;
  description: string;
  notes?:      string;
  dueDate?:    string;
  status:      LoanStatus;
  contact:     Contact;
  repayments:  LoanRepayment[];
  createdAt:   string;
}

export interface LoanRepayment {
  id:     string;
  amount: number;
  date:   string;
  notes?: string;
}

export interface Contact {
  id:    string;
  name:  string;
  phone?: string;
  email?: string;
  avatar?: string;
}

export interface Budget {
  id:         string;
  amount:     number;
  month:      number;
  year:       number;
  category:   Category;
  spent?:     number; // computed
}

export interface Goal {
  id:           string;
  name:         string;
  targetAmount: number;
  savedAmount:  number;
  deadline?:    string;
  icon:         string;
  color:        string;
  isCompleted:  boolean;
}

export interface Split {
  id:          string;
  title:       string;
  totalAmount: number;
  currency:    string;
  date:        string;
  notes?:      string;
  status:      SplitStatus;
  members:     SplitMember[];
}

export interface SplitMember {
  id:          string;
  contact:     Contact;
  shareAmount: number;
  isPaid:      boolean;
  paidAt?:     string;
}

export interface RecurringRule {
  id:          string;
  type:        TransactionType;
  amount:      number;
  description: string;
  category?:   Category;
  frequency:   RecurringFrequency;
  startDate:   string;
  nextDate:    string;
  endDate?:    string;
  isActive:    boolean;
}

// ── API response wrappers ──────────────────────────

export interface ApiResponse<T> {
  data?:    T;
  error?:   string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data:    T[];
  total:   number;
  page:    number;
  limit:   number;
  hasMore: boolean;
}

// ── Dashboard summary ──────────────────────────────

export interface DashboardSummary {
  totalBalance:  number;
  totalIncome:   number;
  totalExpenses: number;
  totalLent:     number;
  totalBorrowed: number;
  netWorth:      number;
  month:         number;
  year:          number;
}

// ── Helpers ────────────────────────────────────────

export const TRANSACTION_COLORS: Record<TransactionType, string> = {
  INCOME:  "var(--ss-income)",
  EXPENSE: "var(--ss-expense)",
};

export const LOAN_COLORS: Record<LoanType, string> = {
  LENT:     "var(--ss-loan)",
  BORROWED: "var(--ss-borrow)",
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY:     "Daily",
  WEEKLY:    "Weekly",
  BIWEEKLY:  "Every 2 weeks",
  MONTHLY:   "Monthly",
  QUARTERLY: "Every 3 months",
  YEARLY:    "Yearly",
};
