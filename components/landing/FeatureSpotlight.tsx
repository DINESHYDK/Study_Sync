import { AlertTriangle, Check, Play, Timer, X } from "lucide-react";

import { ComparisonPreview } from "@/components/landing/ComparisonPreview";
import { FadeIn } from "@/components/landing/FadeIn";
import { landingPalette } from "@/components/landing/palette";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  id?: string;
  label: string;
  title: string;
  body: string;
  points: string[];
  visual: React.ReactNode;
  reverse?: boolean;
};

export function FeatureSpotlight({ id, label, title, body, points, visual, reverse = false }: SpotlightProps) {
  return (
    <section className="px-4 py-20 md:px-8 lg:px-16" data-anim="spotlight" id={id}>
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row",
          reverse && "md:flex-row-reverse",
        )}
      >
        <FadeIn className="flex-1" data-anim="spotlight-text">
          <p className={cn("text-sm font-bold uppercase tracking-[0.28em]", landingPalette.label)}>{label}</p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-normal md:text-4xl">{title}</h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-muted)]">{body}</p>
          <ul className="mt-6 grid gap-3 text-sm text-foreground">
            {points.map((point) => (
              <li className="flex items-center gap-3" key={point}>
                <Check className={cn("h-4 w-4 shrink-0", landingPalette.softIcon)} />
                {point}
              </li>
            ))}
          </ul>
        </FadeIn>
        <FadeIn className="w-full flex-1" data-anim="spotlight-visual" delay={0.1}>
          {visual}
        </FadeIn>
      </div>
    </section>
  );
}

export function AutoPauseVisual() {
  return (
    <Card className={cn("border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-2xl", landingPalette.softShadow)}>
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
        <p className="flex items-center gap-2 font-heading text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          Timer Auto-Paused
        </p>
      </div>
      <div className="grid gap-4 py-6 text-sm leading-7 text-[var(--text-muted)]">
        <p>Your session was saved at 5:42 PM when your browser closed.</p>
        <p>
          <span className="text-foreground">Session total:</span> 1h 42m
        </p>
      </div>
      <div className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold", landingPalette.softGradient)}>
        <Play className="h-4 w-4" />
        Resume Session
      </div>
    </Card>
  );
}

export function PopupTimerVisual() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-strong)] p-8">
      <Card className="w-full max-w-xs border-[var(--border-strong)] bg-[var(--surface-strong)] p-5 shadow-[0_0_60px_rgba(45,212,191,0.15)]">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <Timer className="h-4 w-4 text-[#38bdf8]" />
            StudySync
          </span>
          <span className="rounded-full border border-[var(--border-strong)] p-1 text-[var(--text-muted)]">
            <X className="h-3 w-3" />
          </span>
        </div>
        <div className="timer-digits py-8 text-center font-mono text-3xl font-semibold">01 : 47 : 33</div>
        <p className="text-center text-sm text-[var(--text-muted)]">Today: 4h 12m</p>
        <div className={cn("mx-auto mt-6 flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold", landingPalette.softGradient)}>
          <Play className="h-4 w-4" />
          Resume
        </div>
      </Card>
    </div>
  );
}

export function ComparisonSpotlightVisual() {
  return <ComparisonPreview />;
}
