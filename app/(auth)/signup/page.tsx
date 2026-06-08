"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { appUrl } from "@/lib/utils";

export default function SignupPage() {
  const { supabase, isConfigured } = useSupabase();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isConfigured) {
      setError("Add Supabase keys to `.env.local` before signing up.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${appUrl()}/auth/callback`,
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Check your email to verify your account.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-md gap-4">
        {!isConfigured ? <AuthNotice /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Email confirmation is required before your first login.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium">
                Full Name
                <Input
                  autoComplete="name"
                  disabled={isSubmitting}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  value={fullName}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Email
                <Input
                  autoComplete="email"
                  disabled={isSubmitting}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Password
                <Input
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Confirm Password
                <Input
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </label>
              {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{error}</p> : null}
              {message ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p> : null}
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating..." : "Sign up"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="text-foreground hover:text-[#6c63ff]" href="/login">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
