"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Context {
  userName: string;
  month: string;
  income: number;
  expenses: number;
  topCategories: { name: string; amount: number }[];
  budgets: { name: string; budgeted: number; spent: number }[];
  goals: { name: string; targetAmount: number; savedAmount: number }[];
  recentTransactions: { date: string; description: string; amount: number; type: string; category: string }[];
}

interface Props {
  context: Context;
}

const STARTERS = [
  "How am I doing with my budget this month?",
  "Which category am I overspending on?",
  "Am I on track with my savings goals?",
  "Give me tips to reduce my expenses.",
];

export default function AIChatClient({ context }: Props) {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const aiMsg: Message = { role: "assistant", content: "" };
    setMessages([...next, aiMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: next, context }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   full    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">

      {/* Header */}
      <div className="px-4 md:px-6 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: "0.5px solid var(--ss-border)", background: "white" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--ss-blue-50)" }}>
          <Sparkles size={16} style={{ color: "var(--ss-blue-500)" }} />
        </div>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: "var(--ss-text-1)" }}>AI Finance Assistant</h1>
          <p className="text-xs" style={{ color: "var(--ss-text-3)" }}>Powered by Groq · Knows your {context.month} data</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-8">
            <p className="text-sm text-center mb-6" style={{ color: "var(--ss-text-3)" }}>
              Ask me anything about your finances
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl transition-colors hover:bg-white"
                  style={{ background: "var(--ss-subtle)", color: "var(--ss-text-2)", border: "0.5px solid var(--ss-border)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: isUser ? "var(--ss-blue-500)" : "var(--ss-blue-50)" }}
              >
                {isUser
                  ? <User size={13} style={{ color: "white" }} />
                  : <Sparkles size={13} style={{ color: "var(--ss-blue-500)" }} />
                }
              </div>
              <div
                className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: isUser ? "var(--ss-blue-500)" : "white",
                  color:      isUser ? "white" : "var(--ss-text-1)",
                  border:     isUser ? "none" : "0.5px solid var(--ss-border)",
                  borderTopRightRadius: isUser ? 4 : undefined,
                  borderTopLeftRadius:  isUser ? undefined : 4,
                }}
              >
                {msg.content}
                {streaming && i === messages.length - 1 && !isUser && (
                  <span className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm animate-pulse" style={{ background: "var(--ss-blue-500)", verticalAlign: "middle" }} />
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4 flex-shrink-0" style={{ borderTop: "0.5px solid var(--ss-border)", background: "white" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your spending, budgets, or goals…"
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{
              border:     "0.5px solid var(--ss-border)",
              background: "var(--ss-surface)",
              color:      "var(--ss-text-1)",
              maxHeight:  120,
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ background: "var(--ss-blue-500)" }}
          >
            <Send size={15} style={{ color: "white" }} />
          </button>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: "var(--ss-text-3)" }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
