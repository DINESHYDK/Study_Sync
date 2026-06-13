import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/landing/FadeIn";
import CircularText from "@/components/landing/CircularText";
import { TimerPreview } from "@/components/landing/TimerPreview";
import { landingPalette } from "@/components/landing/palette";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] px-4 pb-20 pt-16 text-center md:px-8 lg:px-16">
      {/* Parallax ambient orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6c63ff]/8 blur-[120px]"
        data-anim="hero-orb"
      />
      <div className="relative w-full max-w-5xl">
        {/* Premium Circular Text Stamp positioned relative to the content container */}
        <div className="absolute -right-4 lg:-right-12 -top-10 hidden md:block select-none z-10 transition-all hover:scale-105 duration-300">
          <CircularText
            text="BUILT * FOR * STUDENTS * "
            onHover="goBonkers"
            spinDuration={8}
            className="border border-[#2dd4bf]/20 bg-[#0a0a0f]/80 backdrop-blur-sm shadow-[0_0_30px_rgba(45,212,191,0.08)]"
          />
        </div>

        <FadeIn className="grid justify-items-center gap-6">
          <h1
            className="max-w-4xl font-heading text-4xl font-bold tracking-normal text-foreground md:text-6xl lg:text-7xl"
            data-anim="hero-h1"
          >
            Study Smarter.
            <br />
            Compete{" "}
            <span className={landingPalette.gradientText}>
              Together.
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-lg leading-8 text-[var(--text-muted)] md:text-xl" data-anim="hero-sub">
            Track every study session, share your progress with friends in real time, and turn studying into a friendly
            competition automatically.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row" data-anim="hero-sub">
            <Button asChild className={landingPalette.softGradient} size="lg" variant="secondary">
              <Link href="/signup">
                Start Tracking Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild className="border-[#2dd4bf]/20 text-[#2dd4bf] hover:bg-[#2dd4bf]/10" size="lg" variant="outline">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
          <p className="text-sm text-[var(--text-muted)]" data-anim="hero-sub">No credit card · Email sign-up only · Free forever</p>
        </FadeIn>
      </div>
      <FadeIn className="mt-12 w-full max-w-5xl" data-anim="timer-preview" delay={0.12}>
        <TimerPreview />
      </FadeIn>
    </section>
  );
}
