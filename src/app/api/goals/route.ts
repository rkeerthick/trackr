import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name:         z.string().min(1),
  targetAmount: z.number().positive(),
  color:        z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon:         z.string().min(1),
  deadline:     z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { name, targetAmount, color, icon, deadline } = result.data;

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      name,
      targetAmount,
      color,
      icon,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json({ data: goal }, { status: 201 });
}
