import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name:  z.string().min(1),
  type:  z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon:  z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  try {
    const category = await prisma.category.create({
      data: { userId: session.user.id, ...result.data, isDefault: false },
    });
    return NextResponse.json({ data: category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A category with this name already exists for this type" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const cat = await prisma.category.findFirst({ where: { id, userId: session.user.id } });
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cat.isDefault) return NextResponse.json({ error: "Default categories cannot be deleted" }, { status: 400 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
