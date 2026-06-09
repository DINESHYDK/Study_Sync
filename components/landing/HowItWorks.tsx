import { ChevronRight, Mail, UserPlus, Timer, Trophy } from "lucide-react";

import { FadeIn } from "@/components/landing/FadeIn";
import { landingPalette } from "@/components/landing/palette";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Mail,
    title: "Sign Up",
    description: "Create your account with just an email. Verify and you are in.",
  },
  {
    icon: UserPlus,
    title: "Add Friends",
    description: "Share your referral code. Friends join your group in one tap.",
  },
  {
    icon: Timer,
    title: "Start Timer",
    description: "Hit Resume. Study. Hit Pause. Done. Your sessions are live.",
  },
  {
    icon: Trophy,
    title: "Compare & Win",
    description: "At day's end, see who studied more or crushed their task list.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="px-4 py-24 md:px-8 lg:px-16" id="how-it-works">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-normal md:text-4xl">How It Works</h2>
          <p className="mt-3 text-lg text-[var(--text-muted)]">Up and running in under 2 minutes.</p>
        </FadeIn>
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-start">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <FadeIn className="contents" delay={index * 0.08} key={step.title}>
                <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", landingPalette.softGradientDark)}>
                      {index + 1}
                    </span>
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", landingPalette.softTint, landingPalette.softIcon)}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{step.description}</p>
                </div>
                {index < steps.length - 1 ? (
                  <div className="hidden pt-14 text-[var(--text-muted)] md:block">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                ) : null}
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
