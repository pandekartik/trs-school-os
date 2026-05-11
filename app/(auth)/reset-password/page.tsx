"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";

type Mode = "checking" | "request" | "update";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setMode(data.session ? "update" : "request");
    });
  }, []);

  async function handleRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    setMessage("We sent a password reset link to your email.");
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="flex flex-col justify-between p-12" style={{ background: "#1c0509" }}>
        <div>
          <Image src="/logo.png" alt="The Rosary School" width={160} height={48} style={{ height: "48px", width: "auto", objectFit: "contain" }} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#ba2032" }}>
            TRS School OS
          </div>
          <h1 className="text-4xl font-bold leading-tight" style={{ color: "#f0dede", fontFamily: "var(--font-kumbh), sans-serif" }}>
            Reset your password
          </h1>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: "rgba(240,222,222,0.5)" }}>
            Use this page to request a reset email or set a new password from a recovery link.
          </p>
        </div>

        <div className="text-xs" style={{ color: "rgba(240,222,222,0.25)" }}>
          © {new Date().getFullYear()} The Rosary School. Internal use only.
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-12" style={{ background: "#f5f2eb" }}>
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold" style={{ color: "#1a1714", fontFamily: "var(--font-kumbh), sans-serif" }}>
              {mode === "update" ? "Set a new password" : "Forgot password"}
            </h2>
            <p className="text-sm" style={{ color: "#7a7266" }}>
              {mode === "update"
                ? "Choose a new password for your account."
                : "Enter your email and we will send a reset link."
              }
            </p>
          </div>

          {mode === "checking" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking recovery session...
            </div>
          ) : mode === "request" ? (
            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@trs.edu"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-10" style={{ background: "#ba2032", color: "#fff" }}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : "Send reset link"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-10" style={{ background: "#ba2032", color: "#fff" }}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : "Update password"}
              </Button>
            </form>
          )}

          <Link href="/sign-in" className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: "#ba2032" }}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
