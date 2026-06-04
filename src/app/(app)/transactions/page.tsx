import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransactionsClient from "./TransactionsClient";

async function getData(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId, date: { gte: start, lte: end } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where:   { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    transactions: transactions.map((tx) => ({
      id:          tx.id,
      type:        tx.type as "INCOME" | "EXPENSE",
      amount:      Number(tx.amount),
      description: tx.description,
      notes:       tx.notes,
      date:        tx.date.toISOString(),
      category:    tx.category
        ? { id: tx.category.id, name: tx.category.name, type: tx.category.type as "INCOME" | "EXPENSE" }
        : null,
    })),
    categories: categories.map((c) => ({
      id:   c.id,
      name: c.name,
      type: c.type as "INCOME" | "EXPENSE",
    })),
  };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; new?: string };
}) {
  const session = await getServerSession(authOptions);
  const now     = new Date();
  const month   = Number(searchParams.month)  || now.getMonth() + 1;
  const year    = Number(searchParams.year)   || now.getFullYear();

  const { transactions, categories } = await getData(session!.user!.id!, month, year);

  return (
    <TransactionsClient
      transactions={transactions}
      categories={categories}
      month={month}
      year={year}
      openAdd={searchParams.new === "true"}
    />
  );
}
