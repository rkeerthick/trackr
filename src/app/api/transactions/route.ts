import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  type:        z.enum(["INCOME", "EXPENSE"]),
  amount:      z.number().positive(),
  description: z.string().min(1),
  categoryId:  z.string().optional(),
  date:        z.string(),
  notes:       z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { type, amount, description, categoryId, date, notes } = result.data;

  const transaction = await prisma.transaction.create({
    data: {
      userId:     session.user.id,
      type,
      amount,
      description,
      notes:      notes || null,
      date:       new Date(date),
      categoryId: categoryId || null,
    },
  });

  return NextResponse.json({ data: transaction }, { status: 201 });
}
