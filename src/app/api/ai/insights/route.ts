import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { groq, SMART_MODEL } from "@/lib/groq";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    month: string;
    income: number;
    expenses: number;
    topCategories: { name: string; amount: number }[];
    budgets: { name: string; budgeted: number; spent: number }[];
    goals: { name: string; targetAmount: number; savedAmount: number }[];
    prevMonthExpenses: number;
  };

  const prompt = `
User financial data for ${body.month}:
- Income: ₹${body.income}
- Expenses: ₹${body.expenses}
- Net: ₹${body.income - body.expenses}
- Previous month expenses: ₹${body.prevMonthExpenses}
- Top spending categories: ${body.topCategories.map((c) => `${c.name} ₹${c.amount}`).join(", ") || "none"}
- Budgets: ${body.budgets.map((b) => `${b.name}: spent ₹${b.spent} of ₹${b.budgeted}`).join(", ") || "none set"}
- Goals: ${body.goals.map((g) => `${g.name}: saved ₹${g.savedAmount} of ₹${g.targetAmount}`).join(", ") || "none"}

Give exactly 3 short, specific, actionable financial insights based on this data. Each insight must be 1 sentence, under 20 words. Be direct and personal. Format as a JSON array of strings. No extra text.
`;

  const completion = await groq.chat.completions.create({
    model: SMART_MODEL,
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      { role: "system", content: "You are a concise personal finance advisor. Always reply with valid JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const insights: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ insights: insights.slice(0, 3) });
  } catch {
    return NextResponse.json({ insights: [] });
  }
}
