import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  title:       z.string().min(1),
  totalAmount: z.number().positive(),
  date:        z.string(),
  notes:       z.string().optional(),
  members:     z.array(z.object({
    contactId:   z.string().min(1),
    shareAmount: z.number().positive(),
  })).min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { title, totalAmount, date, notes, members } = result.data;

  const split = await prisma.split.create({
    data: {
      userId:      session.user.id,
      title,
      totalAmount,
      date:        new Date(date),
      notes:       notes || null,
      status:      "UNSETTLED",
      members: {
        create: members.map((m) => ({
          contactId:   m.contactId,
          shareAmount: m.shareAmount,
        })),
      },
    },
  });

  return NextResponse.json({ data: split }, { status: 201 });
}
