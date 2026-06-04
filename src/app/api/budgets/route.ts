import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  categoryId: z.string().min(1),
  amount:     z.number().positive(),
  month:      z.number().int().min(1).max(12),
  year:       z.number().int().min(2000),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { categoryId, amount, month, year } = result.data;

  const budget = await prisma.budget.upsert({
    where:  { userId_categoryId_month_year: { userId: session.user.id, categoryId, month, year } },
    update: { amount },
    create: { userId: session.user.id, categoryId, amount, month, year },
  });

  return NextResponse.json({ data: budget }, { status: 200 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.budget.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
