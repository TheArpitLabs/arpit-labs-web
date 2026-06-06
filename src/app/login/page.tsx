"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Chrome, Github } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
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

  const createProfileIfNotExists = async (userId: string, email: string, fullName?: string, avatarUrl?: string) => {
    console.log("[Profile Created] Checking if profile exists for user:", userId);
    
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      console.log("[Profile Created] Profile already exists, skipping creation");
      return existingProfile;
    }

    console.log("[Profile Created] Creating new profile for user:", userId);
    const { data: newProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name: fullName || email.split("@")[0],
        avatar_url: avatarUrl || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error("[Profile Created] Error creating profile:", profileError);
    } else {
      console.log("[Profile Created] Profile created successfully:", newProfile);
    }

    return newProfile;
  };

  const signInWithGoogle = async () => {
    console.log("[Google OAuth Start] Initiating Google OAuth flow");
    setOAuthLoading("google");
    setError(null);

    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?provider=google`,
        },
      });

      if (error) {
        console.error("[Google OAuth Start] Error:", error);
        setError(error.message);
        setOAuthLoading(null);
      } else {
        console.log("[OAuth Success] Google OAuth initiated successfully");
        console.log("[Redirecting to Profile] Will redirect after OAuth callback");
      }
    } catch (err) {
      console.error("[Google OAuth Start] Unexpected error:", err);
      setError("An unexpected error occurred");
      setOAuthLoading(null);
    }
  };

  const signInWithGitHub = async () => {
    console.log("[GitHub OAuth Start] Initiating GitHub OAuth flow");
    setOAuthLoading("github");
    setError(null);

    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?provider=github`,
        },
      });

      if (error) {
        console.error("[GitHub OAuth Start] Error:", error);
        setError(error.message);
        setOAuthLoading(null);
      } else {
        console.log("[OAuth Success] GitHub OAuth initiated successfully");
        console.log("[Redirecting to Profile] Will redirect after OAuth callback");
      }
    } catch (err) {
      console.error("[GitHub OAuth Start] Unexpected error:", err);
      setError("An unexpected error occurred");
      setOAuthLoading(null);
    }
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/70 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card/90 px-4 text-muted-foreground dark:bg-slate-950/90">OR</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <Chrome className="h-5 w-5" />
            {oauthLoading === "google" ? "Connecting…" : "Continue with Google"}
          </button>

          <button
            onClick={signInWithGitHub}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <Github className="h-5 w-5" />
            {oauthLoading === "github" ? "Connecting…" : "Continue with GitHub"}
          </button>
        </div>

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
