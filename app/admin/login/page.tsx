"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState<"login" | "forgot" | "reset">("login");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
      });
      const data = await res.json();
      if (res.status === 428) {
        setNeeds2fa(true);
        toast.info("Enter your 2FA code");
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Login failed");
        return;
      }
      toast.success(`Welcome, ${data.admin.name}`);
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Request failed");
        return;
      }
      toast.success(data.message);
      setForgotStep("reset");
    } catch {
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: resetOtp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Reset failed");
        return;
      }
      toast.success("Password reset. Please login.");
      setForgotStep("login");
      setResetOtp("");
      setNewPassword("");
    } catch {
      toast.error("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vantoo Admin Portal</h1>
          <p className="mt-1 text-sm text-gray-400">
            Secure access for authorized administrators only
          </p>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-8 shadow-2xl backdrop-blur">
          {forgotStep === "reset" ? (
            <form onSubmit={handleReset} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Reset Password</h2>
              <Input
                label="OTP Code"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                required
              />
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
              <button
                type="button"
                onClick={() => setForgotStep("login")}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                Back to login
              </button>
            </form>
          ) : forgotStep === "forgot" ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Forgot Password</h2>
              <Input
                label="Admin Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vantoo.com"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
              </Button>
              <button
                type="button"
                onClick={() => setForgotStep("login")}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Admin Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vantoo.com"
                required
                autoComplete="username"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {needs2fa && (
                <Input
                  label="2FA Code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                />
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign In to Admin Portal"
                )}
              </Button>
              <button
                type="button"
                onClick={() => setForgotStep("forgot")}
                className="w-full text-sm text-gray-400 hover:text-brand-primaryLight"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Customer, vendor, and rider accounts cannot access this portal.{" "}
          <Link href="/" className="text-brand-primaryLight hover:underline">
            Go to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
