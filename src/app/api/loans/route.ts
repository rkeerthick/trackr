import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  type:        z.enum(["LENT", "BORROWED"]),
  contactId:   z.string().min(1),
  amount:      z.number().positive(),
  description: z.string().min(1),
  notes:       z.string().optional(),
  dueDate:     z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { type, contactId, amount, description, notes, dueDate } = result.data;

  const loan = await prisma.loan.create({
    data: {
      userId: session.user.id,
      type,
      contactId,
      amount,
      description,
      notes:   notes   || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status:  "ACTIVE",
    },
  });

  return NextResponse.json({ data: loan }, { status: 201 });
}
