"use client";

import { Toaster } from "sonner";

import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { TimerProvider } from "@/components/providers/TimerProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <TooltipProvider delayDuration={250}>
        <TimerProvider>{children}</TimerProvider>
      </TooltipProvider>
      <Toaster richColors position="top-right" toastOptions={{ className: "border border-border bg-card text-foreground" }} />
    </SupabaseProvider>
  );
}
