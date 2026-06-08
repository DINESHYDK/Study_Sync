"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserStore } from "@/stores/useUserStore";

export function OnboardingModal() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const [isSubmitting, setSubmitting] = useState(false);
  const shouldOpen = Boolean(profile && !profile.onboarding_done);

  async function handleDismiss() {
    if (!profile) {
      return;
    }

    setSubmitting(true);
    updateProfile({ onboarding_done: true });

    if (isConfigured) {
      const { error } = await supabase.from("profiles").update({ onboarding_done: true }).eq("id", profile.id);

      if (error) {
        toast.error(error.message);
        updateProfile({ onboarding_done: false });
      }
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={shouldOpen} onOpenChange={(open) => (!open ? void handleDismiss() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to StudySync!</DialogTitle>
          <DialogDescription>Start with your referral code, then track sessions from the dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border bg-secondary p-3">
            <p className="text-xs uppercase text-muted-foreground">Your Referral Code</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{profile?.referral_code}</p>
          </div>
          <p>Share this code with friends so they can add you.</p>
          <p>Add a friend from Settings by pasting their referral code.</p>
          <p>Use Resume when you start studying and Pause when you take a break.</p>
          <p>Open Friends for live progress and head-to-head comparisons.</p>
        </div>
        <DialogFooter>
          <Button disabled={isSubmitting} onClick={() => void handleDismiss()}>
            Got it, let's start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
