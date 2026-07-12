"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  Smartphone,
  User,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/toast";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signup = useAuthStore((s) => s.signup);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const goToLogin = () => {
    router.push("/login?registered=email");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || password.length < 6) {
      toast.error("Fill all required fields. Password must be 6+ characters.");
      return;
    }
    if (!acceptTerms) {
      toast.error("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    try {
      const result = await signup({
        name,
        email,
        phone,
        password,
        referralCode: referralCode.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      const message =
        result.message ??
        "Account created successfully. Please log in to continue.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create account."
      );
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="w-full max-w-md rounded-3xl border border-gray-100 p-8 text-center shadow-card">
        <div className="mb-6 flex flex-col items-center">
          <Logo />
          <CheckCircle2
            className="mt-6 h-12 w-12 text-brand-primary"
            aria-hidden
          />
          <h1 className="mt-4 text-2xl font-bold text-ink">
            Account Created Successfully
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your Vantoo account has been created.
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Please log in to continue shopping.
          </p>
        </div>
        <Button type="button" size="lg" fullWidth onClick={goToLogin}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-100 p-8 shadow-card">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-4 text-2xl font-bold text-ink">Create account</h1>
        <p className="text-sm text-ink-muted">Join Vantoo for fast delivery</p>
      </div>

      <div className="space-y-4">
        <GoogleAuthButton
          intent="signup"
          referralCode={referralCode.trim() || undefined}
        />

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-wide text-ink-soft">
            or
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              aria-label="Name"
              autoComplete="name"
            />
          </div>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              aria-label="Phone"
              autoComplete="tel"
            />
          </div>
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
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Password"
              autoComplete="new-password"
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
          <div>
            <label className="mb-1 block text-xs text-ink-muted">
              Date of birth (for birthday offers)
            </label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              aria-label="Date of birth"
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              placeholder="Referral code (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="pl-10 uppercase"
              aria-label="Referral code"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/policies/terms"
                className="font-semibold text-brand-primary"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/policies/privacy"
                className="font-semibold text-brand-primary"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl border border-gray-100 p-8 text-center shadow-card">
            Loading...
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
