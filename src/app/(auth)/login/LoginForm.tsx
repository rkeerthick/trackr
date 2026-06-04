"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "0.5px solid var(--ss-border)",
    background: "var(--ss-surface)",
    color: "var(--ss-text-1)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--ss-text-2)" }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--ss-blue-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--ss-border)")}
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--ss-text-2)" }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--ss-blue-500)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--ss-border)")}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--ss-expense)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
        style={{ background: "var(--ss-blue-500)" }}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="relative flex items-center py-1">
        <div className="flex-1 border-t" style={{ borderColor: "var(--ss-border)" }} />
        <span className="px-3 text-xs" style={{ color: "var(--ss-text-3)" }}>or</span>
        <div className="flex-1 border-t" style={{ borderColor: "var(--ss-border)" }} />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        style={{
          background: "white",
          border: "0.5px solid var(--ss-border)",
          color: "var(--ss-text-1)",
        }}
      >
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
