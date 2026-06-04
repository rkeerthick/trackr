import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name:     z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  locale:   z.string().min(1).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const result = schema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: result.error.message }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data:  result.data,
  });

  return NextResponse.json({ data: { name: user.name, currency: user.currency, locale: user.locale } });
}
