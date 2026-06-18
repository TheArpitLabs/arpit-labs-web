"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Chrome, Github, Eye, EyeOff, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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

    const sessionResult = await response.json();
    setLoading(false);
    router.push(sessionResult.redirectTo || "/dashboard");
  };

  const handleReset = async () => {
    if (!email) return setError("Provide your email to reset password");
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/login" });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess("Password reset email sent. Check your inbox.");
    }
  };

  const createProfileIfNotExists = async (userId: string, email: string, fullName?: string, avatarUrl?: string) => {
    logger.debug('Checking if profile exists for user', { userId });
    
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      logger.debug('Profile already exists, skipping creation');
      return existingProfile;
    }

    logger.debug('Creating new profile for user', { userId });
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
      logger.error('Error creating profile', { error: profileError });
    } else {
      logger.debug('Profile created successfully');
    }

    return newProfile;
  };

  const signInWithGoogle = async () => {
    logger.debug('Initiating Google OAuth flow');
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
        logger.error('Google OAuth error', { error: error.message });
        setError(error.message);
        setOAuthLoading(null);
      } else {
        logger.debug('Google OAuth initiated successfully');
      }
    } catch (err) {
      logger.error('Google OAuth unexpected error', { error: err });
      setError("An unexpected error occurred");
      setOAuthLoading(null);
    }
  };

  const signInWithGitHub = async () => {
    logger.debug('Initiating GitHub OAuth flow');
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
        logger.error('GitHub OAuth error', { error: error.message });
        setError(error.message);
        setOAuthLoading(null);
      } else {
        logger.debug('GitHub OAuth initiated successfully');
      }
    } catch (err) {
      logger.error('GitHub OAuth unexpected error', { error: err });
      setError("An unexpected error occurred");
      setOAuthLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-surface to-slate-900">
      <div className="px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-[2.5rem] border border-border bg-surface p-8 shadow-sm backdrop-blur-sm">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.28em] text-primary">Welcome Back</p>
          <h1 className="text-3xl font-heading font-bold text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted">Enter your credentials to access your profile and saved content.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-heading font-medium text-foreground">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-heading font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-400" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl bg-green-500/20 px-4 py-3 text-sm text-green-400" role="status">
              {success}
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-heading font-semibold text-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface px-4 text-muted">OR</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm font-heading font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === "google" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Continue with Google
              </>
            )}
          </button>

          <button
            onClick={signInWithGitHub}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm font-heading font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === "github" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Github className="h-5 w-5" />
                Continue with GitHub
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-heading font-medium text-primary hover:text-accent transition">
              Create account
            </Link>
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}
