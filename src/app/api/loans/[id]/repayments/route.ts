import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  date:   z.string(),
  notes:  z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loan = await prisma.loan.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { amount, date, notes } = result.data;

  const newPaid  = Number(loan.paidAmount) + amount;
  const total    = Number(loan.amount);
  const status   =
    newPaid >= total        ? "SETTLED"        :
    newPaid > 0             ? "PARTIALLY_PAID" :
    loan.dueDate && new Date(loan.dueDate) < new Date() ? "OVERDUE" : "ACTIVE";

  await prisma.$transaction([
    prisma.loanRepayment.create({
      data: { loanId: params.id, amount, date: new Date(date), notes: notes || null },
    }),
    prisma.loan.update({
      where: { id: params.id },
      data:  { paidAmount: newPaid, status },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
