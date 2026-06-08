"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { appUrl } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const { supabase, isConfigured } = useSupabase();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isConfigured) {
      setError("Add Supabase keys to `.env.local` before requesting a reset.");
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl()}/auth/update-password`,
    });
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Check your email for the password reset link.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-md gap-4">
        {!isConfigured ? <AuthNotice /> : null}
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Supabase will send a reset link to your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
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
              {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-red-100">{error}</p> : null}
              {message ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p> : null}
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
            <Link className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground" href="/login">
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
