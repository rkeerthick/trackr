import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const session = await auth();
  const userId  = session!.user!.id!;

  const contacts = await prisma.contact.findMany({
    where:   { userId },
    orderBy: { name: "asc" },
    include: {
      loans: {
        where:  { status: { not: "SETTLED" } },
        select: { type: true, amount: true, paidAmount: true },
      },
    },
  });

  return (
    <ContactsClient
      contacts={contacts.map((c) => ({
        id:    c.id,
        name:  c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        loans: {
          totalLent:     c.loans
            .filter((l) => l.type === "LENT")
            .reduce((s, l) => s + Number(l.amount) - Number(l.paidAmount), 0),
          totalBorrowed: c.loans
            .filter((l) => l.type === "BORROWED")
            .reduce((s, l) => s + Number(l.amount) - Number(l.paidAmount), 0),
        },
      }))}
    />
  );
}
