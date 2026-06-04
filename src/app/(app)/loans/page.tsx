import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoansClient from "./LoansClient";

export default async function LoansPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user!.id!;

  const [loans, contacts] = await Promise.all([
    prisma.loan.findMany({
      where:   { userId },
      include: { contact: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.findMany({
      where:   { userId },
      orderBy: { name: "asc" },
      select:  { id: true, name: true },
    }),
  ]);

  return (
    <LoansClient
      loans={loans.map((l) => ({
        id:          l.id,
        type:        l.type        as "LENT" | "BORROWED",
        amount:      Number(l.amount),
        paidAmount:  Number(l.paidAmount),
        description: l.description,
        notes:       l.notes,
        dueDate:     l.dueDate ? l.dueDate.toISOString() : null,
        status:      l.status as "ACTIVE" | "PARTIALLY_PAID" | "SETTLED" | "OVERDUE",
        contact:     l.contact,
      }))}
      contacts={contacts}
    />
  );
}
