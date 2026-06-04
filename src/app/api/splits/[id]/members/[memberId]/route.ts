import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const split = await prisma.split.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!split) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.splitMember.findUnique({ where: { id: params.memberId } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const toggled = !member.isPaid;

  await prisma.splitMember.update({
    where: { id: params.memberId },
    data:  { isPaid: toggled, paidAt: toggled ? new Date() : null },
  });

  // Recalculate split status
  const allMembers = await prisma.splitMember.findMany({ where: { splitId: params.id } });
  const paidCount  = allMembers.filter((m) => (m.id === params.memberId ? toggled : m.isPaid)).length;
  const status     =
    paidCount === 0               ? "UNSETTLED"         :
    paidCount === allMembers.length ? "SETTLED"          :
                                      "PARTIALLY_SETTLED";

  await prisma.split.update({ where: { id: params.id }, data: { status } });

  return NextResponse.json({ ok: true });
}
