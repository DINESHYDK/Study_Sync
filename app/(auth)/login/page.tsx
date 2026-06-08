"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const { supabase, isConfigured } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const nextPath = searchParams.get("next") ?? "/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isConfigured) {
      setError("Add Supabase keys to `.env.local` before logging in.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-md gap-4">
        {!isConfigured ? <AuthNotice /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Log in with the email and password you used for StudySync.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium">
                Email
                <Input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Password
                <Input
                  autoComplete="current-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{error}</p> : null}
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Logging in..." : "Log in"}
              </Button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
              <Link className="hover:text-foreground" href="/forgot-password">
                Forgot password?
              </Link>
              <Link className="hover:text-foreground" href="/signup">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
