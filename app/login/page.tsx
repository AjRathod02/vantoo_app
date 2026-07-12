"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/toast";

type Step = "login" | "forgot" | "sent";

const REMEMBER_KEY = "vantoo-remember-email";

function registrationBanner(
  registered: string | null,
  customMessage: string | null
) {
  if (customMessage) return customMessage;
  if (registered === "google") {
    return "Your account has been created successfully using Google. Please log in to continue.";
  }
  if (registered === "email") {
    return "Account created successfully. Please log in to continue.";
  }
  if (registered === "exists") {
    return "An account with this Google email already exists. Please sign in to continue.";
  }
  return null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const registered = searchParams.get("registered");
  const customMessage = searchParams.get("message");
  const oauthError = searchParams.get("error");
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(
    registrationBanner(registered, customMessage)
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const msg = registrationBanner(registered, customMessage);
    if (msg) {
      setBanner(msg);
      toast.success(msg);
    }
    if (oauthError === "oauth") {
      toast.error("Google sign-in failed. Please try again.");
    }
  }, [registered, customMessage, oauthError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Enter a valid email and password (min 6 characters)");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_KEY, email.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        // ignore
      }
      toast.success("Welcome back to Vantoo!");
      router.push(redirect);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Request failed");
        return;
      }
      toast.success(data.message ?? "Reset email sent");
      if (data.debugResetUrl) {
        toast.info("Dev reset link logged — check the server console.");
        console.info("[Dev password reset URL]", data.debugResetUrl);
      }
      setStep("sent");
    } catch {
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold text-ink">
            {step === "login" && "Welcome back"}
            {step === "forgot" && "Forgot password"}
            {step === "sent" && "Check your email"}
          </h1>
          <p className="text-sm text-ink-muted">
            {step === "login" && "Sign in to your Vantoo account"}
            {step === "forgot" &&
              "We’ll send a secure reset link to your email"}
            {step === "sent" &&
              "If an account exists, a reset link is on its way"}
          </p>
        </div>

        {step === "login" && banner && (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-brand-primary/20 bg-brand-surface px-4 py-3 text-sm text-ink"
          >
            {banner}
          </div>
        )}

        {step === "sent" ? (
          <div className="space-y-4 text-center">
            <p className="rounded-2xl border border-brand-primary/20 bg-brand-surface px-4 py-3 text-sm text-ink">
              Open the email and click <strong>Reset Password</strong>. The link
              expires in 30 minutes. Check spam if you don’t see it.
            </p>
            <Button
              type="button"
              size="lg"
              fullWidth
              onClick={() => setStep("login")}
            >
              Back to sign in
            </Button>
            <button
              type="button"
              onClick={() => setStep("forgot")}
              className="w-full text-sm text-ink-muted hover:text-ink"
            >
              Resend reset email
            </button>
          </div>
        ) : step === "forgot" ? (
          <form onSubmit={onForgot} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                aria-label="Email"
                autoComplete="email"
              />
            </div>
            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("login")}
              className="w-full text-sm text-ink-muted hover:text-ink"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <GoogleAuthButton intent="login" redirectTo={redirect} />

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-wide text-ink-soft">
                or
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  aria-label="Email"
                  autoComplete="email"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  aria-label="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setStep("forgot")}
                  className="text-sm font-medium text-brand-primary"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" size="lg" fullWidth disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to Vantoo?{" "}
          <Link href="/signup" className="font-semibold text-brand-primary">
            Create an account
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-ink-soft">
          By continuing you agree to our{" "}
          <Link href="/policies/terms" className="text-brand-primary">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy" className="text-brand-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
