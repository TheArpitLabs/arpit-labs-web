"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

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
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border px-3 py-2" />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-md border px-3 py-2" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-between">
          <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-white">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" onClick={handleReset} className="text-sm text-muted underline">
            Forgot?
          </button>
        </div>
      </form>
    </main>
  );
}
