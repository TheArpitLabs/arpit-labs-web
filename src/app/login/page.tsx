"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (signInError || !data.user || !data.session) {
      setError(signInError?.message ?? "Invalid credentials");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });

    if (!response.ok) {
      setError("Unable to create authenticated session.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/profile");
  };

  const handleReset = async () => {
    if (!email) return setError("Provide your email to reset password");
    setLoading(true);
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/login" });
    setLoading(false);
    setError(resetError?.message ?? "Check your email for reset instructions");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-[2.5rem] border border-border/70 bg-card/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Welcome Back</p>
          <h1 className="text-3xl font-bold text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted">Enter your credentials to access your profile and saved content.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-muted hover:text-foreground transition"
            >
              Forgot password?
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition">
              Create account
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
