"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left — branding */}
      <div className="flex flex-col justify-between p-12 bg-color-card">
        <div>
          <Image src="/logo.png" alt="The Rosary School" width={160} height={48} style={{ height: "48px", width: "auto", objectFit: "contain" }} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold tracking-widest uppercase">
              TRS School OS
            </div>
            <h1
              className="text-4xl font-bold leading-tight"
              style={{ color: "#f0dede", fontFamily: "var(--font-kumbh), sans-serif" }}
            >
              The operating system<br />for The Rosary School.
            </h1>
            <p className="text-sm leading-relaxed max-w-sm">
              Content management, period scheduling, teacher operations and performance analytics — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              "Structured lesson plans and MCQs for every chapter",
              "Live period coverage tracking across all classes",
              "Weekly performance reports for every teacher",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full"/>
                </div>
                <span className="text-xs leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs">
          © {new Date().getFullYear()} The Rosary School. Internal use only.
        </div>
      </div>

      {/* Right — form */}
      <div
        className="flex flex-col items-center justify-center p-12"
        style={{ background: "var(--color-background)" }}
      >
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2
              className="text-2xl font-bold"
              style={{ color: "#1a1714", fontFamily: "var(--font-kumbh), sans-serif" }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: "#7a7266" }}>
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@trs.edu"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>
                : "Sign in"
              }
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Access is by invitation only. Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
