"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await login(phone);
      toast.success("Welcome to Vantoo!");
      router.push(redirect);
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 p-8 shadow-card">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <span className="mt-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-surface text-brand-primary">
            <Smartphone className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">Login / Sign Up</h1>
          <p className="text-sm text-ink-muted">
            Enter your phone number to continue
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex h-11 items-center rounded-xl border border-gray-300 px-3 text-sm font-medium text-ink">
              +91
            </div>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone number"
            />
          </div>
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Please wait..." : "Continue"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-ink-soft">or continue with</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => toast.info("Social login is mocked in this demo")}
          >
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Social login is mocked in this demo")}
          >
            Facebook
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">
          By continuing you agree to our{" "}
          <Link href="#" className="text-brand-primary">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-brand-primary">
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
