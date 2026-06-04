import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SplitsClient from "./SplitsClient";

export default async function SplitsPage() {
  const session = await auth();
  const userId  = session!.user!.id!;

  const [splits, contacts] = await Promise.all([
    prisma.split.findMany({
      where:   { userId },
      orderBy: { date: "desc" },
      include: {
        members: {
          include: { contact: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.contact.findMany({
      where:   { userId },
      orderBy: { name: "asc" },
      select:  { id: true, name: true },
    }),
  ]);

  return (
    <SplitsClient
      splits={splits.map((s) => ({
        id:          s.id,
        title:       s.title,
        totalAmount: Number(s.totalAmount),
        date:        s.date.toISOString(),
        notes:       s.notes,
        status:      s.status as "UNSETTLED" | "PARTIALLY_SETTLED" | "SETTLED",
        members:     s.members.map((m) => ({
          id:          m.id,
          contactId:   m.contactId,
          shareAmount: Number(m.shareAmount),
          isPaid:      m.isPaid,
          paidAt:      m.paidAt ? m.paidAt.toISOString() : null,
          contact:     m.contact,
        })),
      }))}
      contacts={contacts}
    />
  );
}
