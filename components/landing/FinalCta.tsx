import Link from "next/link";

import { FadeIn } from "@/components/landing/FadeIn";
import { landingPalette } from "@/components/landing/palette";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="px-4 py-20 md:px-8 lg:px-16">
      <FadeIn className={cn("mx-auto max-w-5xl rounded-3xl p-10 text-center text-slate-50 md:p-16", landingPalette.softGradientDark)} data-anim="final-cta">
        <h2 className="font-heading text-3xl font-bold tracking-normal md:text-5xl">Ready to make every study hour count?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-teal-50/80 md:text-lg">
          Join your study group. Start your first session in under a minute.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-white text-teal-950 hover:bg-white/95" size="lg" variant="secondary">
            <Link href="/signup">Create Free Account</Link>
          </Button>
          <Button asChild className="border-white/20 bg-white/10 text-white hover:bg-white/20" size="lg" variant="outline">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}
