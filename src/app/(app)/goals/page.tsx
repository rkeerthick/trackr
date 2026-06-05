import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GoalsClient from "./GoalsClient";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user!.id!;

  const goals = await prisma.goal.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <GoalsClient
      goals={goals.map((g) => ({
        id:           g.id,
        name:         g.name,
        targetAmount: Number(g.targetAmount),
        savedAmount:  Number(g.savedAmount),
        deadline:     g.deadline ? g.deadline.toISOString() : null,
        icon:         g.icon,
        color:        g.color,
        isCompleted:  g.isCompleted,
      }))}
    />
  );
}
