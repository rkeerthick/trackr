import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await prisma.recurringRule.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.recurringRule.update({
    where: { id: params.id },
    data:  { isActive: !rule.isActive },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.recurringRule.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
