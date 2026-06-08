"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login'
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Handle email confirmation case
    if (!data.session && data.user) {
      setSuccess("Please check your email to confirm your account.");
      setLoading(false);
      return;
    }

    if (!data.user || !data.session) {
      setError("Unable to register");
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

  const passwordStrength = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-[2.5rem] border border-border/70 bg-card/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Get Started</p>
          <h1 className="text-3xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted">Join Arpit Labs to access research, projects, and community features.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password && (
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className={passwordStrength.length ? "text-green-500" : "text-muted-foreground"}>
                    {passwordStrength.length ? <Check className="h-3 w-3 inline" /> : <X className="h-3 w-3 inline" />}
                  </span>
                  <span className={passwordStrength.length ? "text-green-500" : "text-muted-foreground"}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={passwordStrength.hasNumber ? "text-green-500" : "text-muted-foreground"}>
                    {passwordStrength.hasNumber ? <Check className="h-3 w-3 inline" /> : <X className="h-3 w-3 inline" />}
                  </span>
                  <span className={passwordStrength.hasNumber ? "text-green-500" : "text-muted-foreground"}>Contains a number</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={passwordStrength.hasUpper ? "text-green-500" : "text-muted-foreground"}>
                    {passwordStrength.hasUpper ? <Check className="h-3 w-3 inline" /> : <X className="h-3 w-3 inline" />}
                  </span>
                  <span className={passwordStrength.hasUpper ? "text-green-500" : "text-muted-foreground"}>Contains uppercase letter</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-500" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-500" role="status">
              {success}
            </div>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}
