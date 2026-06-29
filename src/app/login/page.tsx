"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Chrome, Github, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Rate limiting and lockout mechanism
  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const storedLockout = localStorage.getItem('lockoutUntil');
    
    if (storedAttempts) setAttempts(parseInt(storedAttempts));
    if (storedLockout) {
      const lockoutDate = new Date(storedLockout);
      if (lockoutDate > new Date()) {
        setLockoutUntil(lockoutDate);
      } else {
        localStorage.removeItem('lockoutUntil');
        localStorage.removeItem('loginAttempts');
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        if (new Date() >= lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
          localStorage.removeItem('lockoutUntil');
          localStorage.removeItem('loginAttempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;
  const remainingTime = lockoutUntil ? Math.max(0, Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000)) : 0;

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      setError(`Too many attempts. Please try again in ${remainingTime} seconds.`);
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }

    // Password validation
    if (!password || password.length < 1) {
      setError("Please enter your password.");
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (signInError || !data.user || !data.session) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('loginAttempts', newAttempts.toString());
        
        // Lockout after 5 failed attempts
        if (newAttempts >= 5) {
          const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          setLockoutUntil(lockoutTime);
          localStorage.setItem('lockoutUntil', lockoutTime.toISOString());
          setError("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setError("Invalid email or password.");
        }
        setLoading(false);
        return;
      }

      // Reset attempts on successful login
      setAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lockoutUntil');

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          remember_me: rememberMe,
        }),
      });

      if (!response.ok) {
        setError("Unable to establish session. Please try again.");
        setLoading(false);
        return;
      }

      const sessionResult = await response.json();
      setLoading(false);
      router.push(sessionResult.redirectTo || "/dashboard");
    } catch (err) {
      logger.error('Login error:', err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email address to reset password.");
      emailRef.current?.focus();
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    
    setResetLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, { 
        redirectTo: window.location.origin + "/login",
        captchaToken: undefined // Add CAPTCHA when available
      });
      setResetLoading(false);
      
      if (resetError) {
        setError("Unable to send reset email. Please check your email and try again.");
      } else {
        setSuccess("Password reset email sent. Please check your inbox (and spam folder).");
        setTimeout(() => setSuccess(null), 10000); // Auto-dismiss after 10 seconds
      }
    } catch (err) {
      logger.error('Password reset error:', err);
      setError("An unexpected error occurred. Please try again.");
      setResetLoading(false);
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
    if (isLockedOut) {
      setError(`Too many attempts. Please try again in ${remainingTime} seconds.`);
      return;
    }
    
    logger.debug('Initiating Google OAuth flow');
    setOAuthLoading("google");
    setError(null);

    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?provider=google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        logger.error('Google OAuth error', { error: error.message });
        setError("Unable to connect with Google. Please try again.");
        setOAuthLoading(null);
      } else {
        logger.debug('Google OAuth initiated successfully');
      }
    } catch (err) {
      logger.error('Google OAuth unexpected error', { error: err });
      setError("An unexpected error occurred with Google authentication.");
      setOAuthLoading(null);
    }
  };

  const signInWithGitHub = async () => {
    if (isLockedOut) {
      setError(`Too many attempts. Please try again in ${remainingTime} seconds.`);
      return;
    }
    
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
        setError("Unable to connect with GitHub. Please try again.");
        setOAuthLoading(null);
      } else {
        logger.debug('GitHub OAuth initiated successfully');
      }
    } catch (err) {
      logger.error('GitHub OAuth unexpected error', { error: err });
      setError("An unexpected error occurred with GitHub authentication.");
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

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-heading font-medium text-foreground">Email</label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={error?.includes('email') ? true : undefined}
              aria-describedby={error?.includes('email') ? 'email-error' : undefined}
              className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-heading font-medium text-foreground">Password</label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={error?.includes('password') ? true : undefined}
                aria-describedby={error?.includes('password') ? 'password-error' : undefined}
                className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-0"
            />
            <label htmlFor="remember-me" className="text-sm text-muted cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2" role="alert">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="rounded-2xl bg-green-500/20 px-4 py-3 text-sm text-green-400" role="status" aria-live="polite">
              {success}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetLoading}
              className="text-sm text-muted hover:text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:underline"
            >
              {resetLoading ? "Sending reset email..." : "Forgot password?"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isLockedOut || false}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-heading font-semibold text-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-busy={loading || undefined}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : isLockedOut ? (
              `Locked (${remainingTime}s)`
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
            disabled={(oauthLoading === "google" || isLockedOut) || false}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm font-heading font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-busy={oauthLoading === "google" || undefined}
          >
            {oauthLoading === "google" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              <>
                <Chrome className="h-5 w-5" aria-hidden="true" />
                Continue with Google
              </>
            )}
          </button>

          <button
            onClick={signInWithGitHub}
            disabled={(oauthLoading === "github" || isLockedOut) || false}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm font-heading font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-busy={oauthLoading === "github" || undefined}
          >
            {oauthLoading === "github" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              <>
                <Github className="h-5 w-5" aria-hidden="true" />
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
