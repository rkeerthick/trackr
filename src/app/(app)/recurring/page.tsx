import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RecurringClient from "./RecurringClient";

export default async function RecurringPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user!.id!;

  const [rules, categories] = await Promise.all([
    prisma.recurringRule.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where:   { userId },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, type: true, color: true },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <RecurringClient
      rules={rules.map((r) => {
        const cat = r.categoryId ? categoryMap.get(r.categoryId) : undefined;
        return {
          id:          r.id,
          type:        r.type      as "INCOME" | "EXPENSE",
          amount:      Number(r.amount),
          description: r.description,
          category:    cat ? { id: cat.id, name: cat.name, type: cat.type as "INCOME" | "EXPENSE", color: cat.color } : null,
          frequency:   r.frequency as "DAILY"|"WEEKLY"|"BIWEEKLY"|"MONTHLY"|"QUARTERLY"|"YEARLY",
          startDate:   r.startDate.toISOString(),
          nextDate:    r.nextDate.toISOString(),
          endDate:     r.endDate ? r.endDate.toISOString() : null,
          isActive:    r.isActive,
        };
      })}
      categories={categories.map((c) => ({
        id:    c.id,
        name:  c.name,
        type:  c.type as "INCOME" | "EXPENSE",
        color: c.color,
      }))}
    />
  );
}
