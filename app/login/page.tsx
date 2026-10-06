"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please provide both username and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please verify your credentials.");
        return;
      }

      // Safe redirect: ensure destination is a relative path to prevent open redirects
      const destination =
        nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : "/dashboard";

      router.push(destination);
      router.refresh();
    } catch {
      setError("Network or server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#1E3A2F] text-white">
          <Layers className="h-5 w-5" />
        </div>
        <h1 className="font-serif text-2xl font-normal text-[#1A1A1A]">FlowFoundry</h1>
        <p className="text-[11px] font-mono text-[#5C5C57] uppercase tracking-wider">
          Operator Access Control Gateway
        </p>
      </div>

      {/* Main Login Card */}
      <div className="rounded-[3px] border border-[#E5E5E0] bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[#E5E5E0] pb-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#1A1A1A]">
            <Lock className="h-3.5 w-3.5 text-[#1E3A2F]" />
            <span>SESSION AUTHENTICATION</span>
          </div>
          <span className="rounded-[2px] bg-[#F3F3EF] border border-[#E5E5E0] px-2 py-0.5 text-[10px] font-mono text-[#5C5C57]">
            TLS ENCRYPTED
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-[3px] border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#1A1A1A]">Username</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#5C5C57]">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                placeholder="Enter operator username"
                className="w-full h-9 rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] py-2 pl-9 pr-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:bg-white focus:border-[#1E3A2F] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#1A1A1A]">Password</label>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#5C5C57]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter operator password"
                className="w-full h-9 rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] py-2 pl-9 pr-10 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:bg-white focus:border-[#1E3A2F] focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5C5C57] hover:text-[#1A1A1A] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 flex w-full h-9 items-center justify-center gap-2 rounded-[3px] bg-[#1E3A2F] text-xs font-medium text-white transition-colors hover:bg-[#1E3A2F]/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Verifying Identity...</span>
              </>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-[#E5E5E0] pt-4 text-center">
          <p className="text-[11px] text-[#5C5C57] leading-relaxed">
            Restricted access: This administrative console is intended solely for authorized FlowFoundry
            personnel. All connection attempts are monitored.
          </p>
        </div>
      </div>

      {/* Return to Public Website */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#5C5C57] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to FlowFoundry Public Site</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] flex flex-col justify-center items-center px-4 py-12 relative">
      <React.Suspense
        fallback={
          <div className="flex items-center gap-2 text-xs font-mono text-[#5C5C57]">
            <Loader2 className="h-4 w-4 animate-spin text-[#1E3A2F]" />
            Loading security gateway...
          </div>
        }
      >
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
