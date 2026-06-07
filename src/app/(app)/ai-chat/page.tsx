import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AIChatClient from "./AIChatClient";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default async function AIChatPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user!.id!;
  const now     = new Date();
  const month   = now.getMonth() + 1;
  const year    = now.getFullYear();
  const start   = new Date(year, month - 1, 1);
  const end     = new Date(year, month, 0, 23, 59, 59);

  const [transactions, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId, date: { gte: start, lte: end } },
      include: { category: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.budget.findMany({
      where:   { userId, month, year },
      include: { category: { select: { name: true } } },
    }),
    prisma.goal.findMany({
      where:   { userId, isCompleted: false },
      orderBy: { createdAt: "desc" },
      take:    5,
    }),
  ]);

  const income   = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  const catMap = new Map<string, { name: string; amount: number }>();
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE" || !tx.category) continue;
    const entry = catMap.get(tx.categoryId!) ?? { name: tx.category.name, amount: 0 };
    entry.amount += Number(tx.amount);
    catMap.set(tx.categoryId!, entry);
  }
  const topCategories = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5);

  const spendMap = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE" || !tx.categoryId) continue;
    spendMap.set(tx.categoryId, (spendMap.get(tx.categoryId) ?? 0) + Number(tx.amount));
  }

  const context = {
    userName:   session?.user?.name ?? "there",
    month:      `${MONTH_NAMES[month - 1]} ${year}`,
    income,
    expenses,
    topCategories,
    budgets: budgets.map(b => ({
      name:     b.category.name,
      budgeted: Number(b.amount),
      spent:    spendMap.get(b.categoryId) ?? 0,
    })),
    goals: goals.map(g => ({
      name:         g.name,
      targetAmount: Number(g.targetAmount),
      savedAmount:  Number(g.savedAmount),
    })),
    recentTransactions: transactions.slice(0, 10).map(tx => ({
      date:        tx.date.toISOString().slice(0, 10),
      description: tx.description,
      amount:      Number(tx.amount),
      type:        tx.type,
      category:    tx.category?.name ?? "Uncategorised",
    })),
  };

  return (
    <div className="h-full flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <AIChatClient context={context} />
    </div>
  );
}
