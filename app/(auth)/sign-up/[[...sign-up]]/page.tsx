"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { linkTeacherAccount } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Sign up failed");
      setLoading(false);
      return;
    }

    const linkResult = await linkTeacherAccount({
      name,
      email,
      userId: data.user.id,
    });

    if (linkResult?.error) {
      setError(linkResult.error);
      setLoading(false);
      return;
    }

    router.push("/teacher");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left — branding */}
      <div className="flex flex-col justify-between p-12" style={{ background: "#1c0509" }}>
        <div>
          <Image src="/logo.png" alt="The Rosary School" width={160} height={48} style={{ height: "48px", width: "auto", objectFit: "contain" }} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#ba2032" }}>
            TRS School OS
          </div>
          <h1
            className="text-4xl font-bold leading-tight"
            style={{ color: "#f0dede", fontFamily: "var(--font-kumbh), sans-serif" }}
          >
            The operating system<br />for The Rosary School.
          </h1>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: "rgba(240,222,222,0.5)" }}>
            Create your account to get started.
          </p>
        </div>

        <div className="text-xs" style={{ color: "rgba(240,222,222,0.25)" }}>
          © {new Date().getFullYear()} The Rosary School. Internal use only.
        </div>
      </div>

      {/* Right — form */}
      <div
        className="flex flex-col items-center justify-center p-12"
        style={{ background: "#f5f2eb" }}
      >
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2
              className="text-2xl font-bold"
              style={{ color: "#1a1714", fontFamily: "var(--font-kumbh), sans-serif" }}
            >
              Create account
            </h2>
            <p className="text-sm" style={{ color: "#7a7266" }}>
              Set up your TRS School OS access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ms. Sharma"
                required
              />
            </div>

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
                placeholder="Min. 6 characters"
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10"
              style={{ background: "#ba2032", color: "#fff" }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</>
                : "Create account"
              }
            </Button>
          </form>

          <p className="text-center text-xs" style={{ color: "#7a7266" }}>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium hover:underline" style={{ color: "#ba2032" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
