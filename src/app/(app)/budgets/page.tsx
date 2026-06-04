import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BudgetsClient from "./BudgetsClient";

async function getData(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const [budgets, expenseCategories, transactions] = await Promise.all([
    prisma.budget.findMany({
      where:   { userId, month, year },
      include: { category: true },
    }),
    prisma.category.findMany({
      where:   { userId, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where:  { userId, type: "EXPENSE", date: { gte: start, lte: end } },
      select: { categoryId: true, amount: true },
    }),
  ]);

  // Spending per category this month
  const spendMap = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.categoryId) continue;
    spendMap.set(tx.categoryId, (spendMap.get(tx.categoryId) ?? 0) + Number(tx.amount));
  }

  // Categories that already have a budget
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));

  // Build rows: budgeted categories first, then categories with spending but no budget
  const rows = [
    ...budgets.map((b) => ({
      id:       b.id,
      category: { id: b.category.id, name: b.category.name, color: b.category.color },
      budgeted: Number(b.amount),
      spent:    spendMap.get(b.categoryId) ?? 0,
    })),
    ...expenseCategories
      .filter((c) => !budgetedCategoryIds.has(c.id) && spendMap.has(c.id))
      .map((c) => ({
        id:       null,
        category: { id: c.id, name: c.name, color: c.color },
        budgeted: 0,
        spent:    spendMap.get(c.id) ?? 0,
      })),
  ];

  // Categories available to add a new budget (not yet budgeted)
  const addable = expenseCategories
    .filter((c) => !budgetedCategoryIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, color: c.color }));

  return { rows, addable };
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await getServerSession(authOptions);
  const now     = new Date();
  const month   = Number(searchParams.month) || now.getMonth() + 1;
  const year    = Number(searchParams.year)  || now.getFullYear();

  const { rows, addable } = await getData(session!.user!.id!, month, year);

  return (
    <BudgetsClient
      rows={rows}
      categories={addable}
      month={month}
      year={year}
    />
  );
}
