import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--ss-surface)" }}
    >
      <div className="w-full max-w-[360px] px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--ss-text-1)" }}
          >
            Trackr
          </h1>
          <p className="text-sm" style={{ color: "var(--ss-text-3)" }}>
            Your personal finance dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "white",
            border: "0.5px solid var(--ss-border)",
          }}
        >
          <h2
            className="text-base font-medium mb-5"
            style={{ color: "var(--ss-text-1)" }}
          >
            Sign in to your account
          </h2>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--ss-text-3)" }}
        >
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="font-medium"
            style={{ color: "var(--ss-blue-500)" }}
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
