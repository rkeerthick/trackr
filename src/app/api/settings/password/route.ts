import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  current:  z.string().min(1),
  next:     z.string().min(8),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password)
    return NextResponse.json({ error: "Password change not available for OAuth accounts" }, { status: 400 });

  const valid = await bcrypt.compare(result.data.current, user.password);
  if (!valid)
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const hashed = await bcrypt.hash(result.data.next, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
