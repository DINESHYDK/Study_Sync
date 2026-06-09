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
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4 pb-20 pt-16 text-center md:px-8 lg:px-16">
      {/* Premium Circular Text Stamp on the Right */}
      <div className="absolute right-4 lg:right-16 top-28 hidden md:block select-none z-10 transition-all hover:scale-105 duration-300">
        <CircularText
          text="BUILT * FOR * STUDENTS * "
          onHover="goBonkers"
          spinDuration={8}
          className="border border-[#2dd4bf]/20 bg-[#0a0a0f]/80 backdrop-blur-sm shadow-[0_0_30px_rgba(45,212,191,0.08)]"
        />
      </div>

      <FadeIn className="grid max-w-5xl justify-items-center gap-6">
        <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-normal text-foreground md:text-6xl lg:text-7xl">
          Study Smarter.
          <br />
          Compete{" "}
          <span className={landingPalette.gradientText}>
            Together.
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-8 text-[var(--text-muted)] md:text-xl">
          Track every study session, share your progress with friends in real time, and turn studying into a friendly
          competition automatically.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
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
        <p className="text-sm text-[var(--text-muted)]">No credit card · Email sign-up only · Free forever</p>
      </FadeIn>
      <FadeIn className="mt-12 w-full" delay={0.12}>
        <TimerPreview />
      </FadeIn>
    </section>
  );
}
