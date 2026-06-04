import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user!.id!;

  const [user, categories] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true, email: true, currency: true, locale: true, password: true },
    }),
    prisma.category.findMany({
      where:   { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select:  { id: true, name: true, type: true, color: true, icon: true, isDefault: true },
    }),
  ]);

  return (
    <SettingsClient
      user={{
        name:        user!.name,
        email:       user!.email,
        currency:    user!.currency,
        locale:      user!.locale,
        hasPassword: !!user!.password,
      }}
      categories={categories.map((c) => ({
        id:        c.id,
        name:      c.name,
        type:      c.type as "INCOME" | "EXPENSE",
        color:     c.color,
        icon:      c.icon,
        isDefault: c.isDefault,
      }))}
    />
  );
}
