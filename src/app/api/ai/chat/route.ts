import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { groq, SMART_MODEL } from "@/lib/groq";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { messages, context } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    context: {
      userName: string;
      month: string;
      income: number;
      expenses: number;
      topCategories: { name: string; amount: number }[];
      budgets: { name: string; budgeted: number; spent: number }[];
      goals: { name: string; targetAmount: number; savedAmount: number }[];
      recentTransactions: { date: string; description: string; amount: number; type: string; category: string }[];
    };
  };

  const systemPrompt = `You are a helpful personal finance assistant for ${context.userName}. Be concise, friendly, and specific to their data.

Current financial snapshot (${context.month}):
- Income: ₹${context.income}
- Expenses: ₹${context.expenses}
- Net savings: ₹${context.income - context.expenses}

Top spending categories: ${context.topCategories.map((c) => `${c.name} (₹${c.amount})`).join(", ") || "none"}

Budgets: ${context.budgets.length ? context.budgets.map((b) => `${b.name}: ₹${b.spent}/₹${b.budgeted}`).join(", ") : "none set"}

Goals: ${context.goals.length ? context.goals.map((g) => `${g.name}: ₹${g.savedAmount}/₹${g.targetAmount} (${Math.round((g.savedAmount / g.targetAmount) * 100)}%)`).join(", ") : "none"}

Recent transactions: ${context.recentTransactions.slice(0, 8).map((t) => `${t.date}: ${t.description} ${t.type === "INCOME" ? "+" : "-"}₹${t.amount} (${t.category})`).join("; ")}

Answer only questions about their finances. Keep replies short and clear. Use ₹ for currency.`;

  const stream = await groq.chat.completions.create({
    model: SMART_MODEL,
    stream: true,
    temperature: 0.5,
    max_tokens: 400,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
