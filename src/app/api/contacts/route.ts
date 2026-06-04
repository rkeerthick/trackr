import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name:  z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const { name, phone, email, notes } = result.data;

  try {
    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      },
    });
    return NextResponse.json({ data: contact }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A contact with this name already exists" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.contact.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
