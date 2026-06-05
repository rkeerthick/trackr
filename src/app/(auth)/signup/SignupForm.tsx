"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  border: "0.5px solid var(--ss-border)", background: "var(--ss-surface)",
  color: "var(--ss-text-1)", fontSize: "13px", outline: "none",
  fontFamily: "inherit", transition: "border-color 0.15s",
} as React.CSSProperties;

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Auto sign in after successful signup
      const result = await signIn("credentials", {
        email:    form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created. Please sign in.");
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
          Full name
        </label>
        <input type="text" required value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Arjun Sharma" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--ss-blue-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--ss-border)")} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
          Email
        </label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--ss-blue-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--ss-border)")} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
          Password
        </label>
        <input type="password" required value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Min. 8 characters" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--ss-blue-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--ss-border)")} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ss-text-2)" }}>
          Confirm password
        </label>
        <input type="password" required value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          placeholder="••••••••" style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--ss-blue-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--ss-border)")} />
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--ss-expense)" }}>{error}</p>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
        style={{ background: "var(--ss-blue-500)" }}>
        {loading ? "Creating account…" : "Create account"}
      </button>

      <div className="relative flex items-center py-1">
        <div className="flex-1 border-t" style={{ borderColor: "var(--ss-border)" }} />
        <span className="px-3 text-xs" style={{ color: "var(--ss-text-3)" }}>or</span>
        <div className="flex-1 border-t" style={{ borderColor: "var(--ss-border)" }} />
      </div>

      <button type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        style={{ background: "white", border: "0.5px solid var(--ss-border)", color: "var(--ss-text-1)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
