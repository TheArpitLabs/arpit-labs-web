'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Eye, EyeOff, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Rate limiting for registration
  useEffect(() => {
    const storedAttempts = localStorage.getItem('registerAttempts');
    const storedLockout = localStorage.getItem('registerLockoutUntil');

    if (storedAttempts) setAttempts(parseInt(storedAttempts));
    if (storedLockout) {
      const lockoutDate = new Date(storedLockout);
      if (lockoutDate > new Date()) {
        setLockoutUntil(lockoutDate);
      } else {
        localStorage.removeItem('registerLockoutUntil');
        localStorage.removeItem('registerAttempts');
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        if (new Date() >= lockoutUntil) {
          setLockoutUntil(null);
          setAttempts(0);
          localStorage.removeItem('registerLockoutUntil');
          localStorage.removeItem('registerAttempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;
  const remainingTime = lockoutUntil
    ? Math.max(0, Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000))
    : 0;

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) {
      setError(`Too many registration attempts. Please try again in ${remainingTime} seconds.`);
      return;
    }

    // Name validation
    if (!fullName || fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      nameRef.current?.focus();
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    // Password validation
    if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character.'
      );
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin + '/login',
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('registerAttempts', newAttempts.toString());

        // Lockout after 5 failed attempts
        if (newAttempts >= 5) {
          const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          setLockoutUntil(lockoutTime);
          localStorage.setItem('registerLockoutUntil', lockoutTime.toISOString());
          setError('Too many failed attempts. Registration locked for 15 minutes.');
        } else {
          setError(signUpError.message || 'Unable to create account. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Reset attempts on successful registration
      setAttempts(0);
      localStorage.removeItem('registerAttempts');
      localStorage.removeItem('registerLockoutUntil');

      // Handle email confirmation case
      if (!data.session && data.user) {
        setSuccess(
          'Please check your email to confirm your account. The link will expire in 24 hours.'
        );
        setLoading(false);
        setTimeout(() => setSuccess(null), 15000); // Auto-dismiss after 15 seconds
        return;
      }

      if (!data.user || !data.session) {
        setError('Unable to complete registration. Please try again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      if (!response.ok) {
        setError('Unable to establish session. Please try logging in.');
        setLoading(false);
        return;
      }

      const sessionResult = await response.json();

      try {
        await supabaseClient.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
        });
      } catch (err) {
        logger.error('Profile creation error:', err);
        // Continue anyway - server policy should handle this
      }

      setLoading(false);
      router.push(sessionResult.redirectTo || '/dashboard');
    } catch (err) {
      logger.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const passwordStrength = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const getStrengthColor = () => {
    if (strengthScore <= 1) return 'text-red-400';
    if (strengthScore <= 2) return 'text-orange-400';
    if (strengthScore <= 3) return 'text-yellow-400';
    if (strengthScore <= 4) return 'text-green-400';
    return 'text-emerald-400';
  };
  const getStrengthLabel = () => {
    if (strengthScore <= 1) return 'Weak';
    if (strengthScore <= 2) return 'Fair';
    if (strengthScore <= 3) return 'Good';
    if (strengthScore <= 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-surface to-slate-900">
      <Navbar />
      <div className="px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-[2.5rem] border border-border bg-surface p-8 shadow-sm backdrop-blur-sm">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.28em] text-primary">
              Get Started
            </p>
            <h1 className="text-3xl font-heading font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted">
              Join Axiora to access research, projects, and community features.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-heading font-medium text-foreground"
              >
                Full name
              </label>
              <input
                ref={nameRef}
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                autoComplete="name"
                aria-invalid={error?.includes('name') ? true : undefined}
                className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-heading font-medium text-foreground">
                Email
              </label>
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
                className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-heading font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={error?.includes('password') ? true : undefined}
                  className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary text-foreground placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${getStrengthColor()}`}>
                      Password strength: {getStrengthLabel()}
                    </span>
                    <span className={`text-xs font-semibold ${getStrengthColor()}`}>
                      {strengthScore}/5
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={passwordStrength.length ? 'text-green-400' : 'text-gray-500'}
                      >
                        {passwordStrength.length ? (
                          <Check className="h-3 w-3 inline" />
                        ) : (
                          <X className="h-3 w-3 inline" />
                        )}
                      </span>
                      <span
                        className={passwordStrength.length ? 'text-green-400' : 'text-gray-500'}
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-500'}
                      >
                        {passwordStrength.hasNumber ? (
                          <Check className="h-3 w-3 inline" />
                        ) : (
                          <X className="h-3 w-3 inline" />
                        )}
                      </span>
                      <span
                        className={passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-500'}
                      >
                        Contains a number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={passwordStrength.hasUpper ? 'text-green-400' : 'text-gray-500'}
                      >
                        {passwordStrength.hasUpper ? (
                          <Check className="h-3 w-3 inline" />
                        ) : (
                          <X className="h-3 w-3 inline" />
                        )}
                      </span>
                      <span
                        className={passwordStrength.hasUpper ? 'text-green-400' : 'text-gray-500'}
                      >
                        Contains uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={passwordStrength.hasLower ? 'text-green-400' : 'text-gray-500'}
                      >
                        {passwordStrength.hasLower ? (
                          <Check className="h-3 w-3 inline" />
                        ) : (
                          <X className="h-3 w-3 inline" />
                        )}
                      </span>
                      <span
                        className={passwordStrength.hasLower ? 'text-green-400' : 'text-gray-500'}
                      >
                        Contains lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={passwordStrength.hasSpecial ? 'text-green-400' : 'text-gray-500'}
                      >
                        {passwordStrength.hasSpecial ? (
                          <Check className="h-3 w-3 inline" />
                        ) : (
                          <X className="h-3 w-3 inline" />
                        )}
                      </span>
                      <span
                        className={passwordStrength.hasSpecial ? 'text-green-400' : 'text-gray-500'}
                      >
                        Contains special character
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div
                className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div
                className="rounded-2xl bg-green-500/20 px-4 py-3 text-sm text-green-400"
                role="status"
                aria-live="polite"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLockedOut || false}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-heading font-semibold text-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-busy={loading || undefined}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : isLockedOut ? (
                `Locked (${remainingTime}s)`
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-heading font-medium text-primary hover:text-accent transition"
              >
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
