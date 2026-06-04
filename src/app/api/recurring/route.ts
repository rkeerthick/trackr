import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const FREQ_DAYS: Record<string, number> = {
  DAILY: 1, WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30, QUARTERLY: 91, YEARLY: 365,
};

const schema = z.object({
  type:        z.enum(["INCOME", "EXPENSE"]),
  amount:      z.number().positive(),
  description: z.string().min(1),
  categoryId:  z.string().optional(),
  frequency:   z.enum(["DAILY","WEEKLY","BIWEEKLY","MONTHLY","QUARTERLY","YEARLY"]),
  startDate:   z.string(),
  endDate:     z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { type, amount, description, categoryId, frequency, startDate, endDate } = result.data;

  const start    = new Date(startDate);
  const nextDate = new Date(start);
  nextDate.setDate(nextDate.getDate() + FREQ_DAYS[frequency]);

  const rule = await prisma.recurringRule.create({
    data: {
      userId:     session.user.id,
      type,
      amount,
      description,
      categoryId: categoryId || null,
      frequency,
      startDate:  start,
      nextDate,
      endDate:    endDate ? new Date(endDate) : null,
      isActive:   true,
    },
  });

  return NextResponse.json({ data: rule }, { status: 201 });
}
