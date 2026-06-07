import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { groq, FAST_MODEL } from "@/lib/groq";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { description, type, categories } = await req.json() as {
    description: string;
    type: "INCOME" | "EXPENSE";
    categories: { id: string; name: string }[];
  };

  if (!description || description.length < 2 || categories.length === 0)
    return NextResponse.json({ categoryId: null });

  const categoryList = categories.map((c, i) => `${i + 1}. ${c.name} (id: ${c.id})`).join("\n");

  const completion = await groq.chat.completions.create({
    model: FAST_MODEL,
    temperature: 0,
    max_tokens: 60,
    messages: [
      {
        role: "system",
        content: `You are a transaction categorizer. Given a transaction description and type, pick the most fitting category from the provided list. Reply with ONLY the category id, nothing else.`,
      },
      {
        role: "user",
        content: `Transaction type: ${type}\nDescription: "${description}"\n\nCategories:\n${categoryList}\n\nReply with only the category id that best matches.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const matched = categories.find((c) => raw.includes(c.id));

  return NextResponse.json({ categoryId: matched?.id ?? null, categoryName: matched?.name ?? null });
}
