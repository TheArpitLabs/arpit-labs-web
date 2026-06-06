"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabaseClient.auth.signUp({ email, password });

    if (signUpError || !data.user || !data.session) {
      setError(signUpError?.message ?? "Unable to register");
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

    try {
      await supabaseClient.from("profiles").insert({ id: data.user.id, email: data.user.email, full_name: fullName });
    } catch (err) {
      // ignore — server policy should allow this for the user
    }

    setLoading(false);
    router.push("/profile");
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-md border px-3 py-2" />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border px-3 py-2" />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-md border px-3 py-2" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-white">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
