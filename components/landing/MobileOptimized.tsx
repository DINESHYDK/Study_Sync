import { Smartphone, Zap, Moon } from "lucide-react";

import { FadeIn } from "@/components/landing/FadeIn";
import { landingPalette } from "@/components/landing/palette";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MobileOptimized() {
  return (
    <section className="px-4 py-24 text-center md:px-8 lg:px-16">
      <FadeIn className="mx-auto max-w-3xl" data-anim="section-heading">
        <p className={cn("text-sm font-bold uppercase tracking-[0.28em]", landingPalette.label)}>Study Anywhere</p>
        <h2 className="mt-3 font-heading text-2xl font-bold tracking-normal md:text-4xl">
          Built for your phone, not just your desk.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
          Full-screen mobile layout. Touch-optimised buttons. One tap to start your timer between classes. Your friends
          see your progress the moment you resume from any device.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Badge className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-strong)] px-4 py-1.5 text-sm text-foreground">
            <Smartphone className="h-3.5 w-3.5" />
            Responsive
          </Badge>
          <Badge className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-strong)] px-4 py-1.5 text-sm text-foreground">
            <Zap className="h-3.5 w-3.5" />
            Fast
          </Badge>
          <Badge className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-strong)] px-4 py-1.5 text-sm text-foreground">
            <Moon className="h-3.5 w-3.5" />
            Dark Mode
          </Badge>
        </div>
      </FadeIn>
    </section>
  );
}
