import {
  BarChart2,
  BookOpen,
  CheckSquare,
  PictureInPicture2,
  Smartphone,
  Timer,
  Trophy,
  Users,
  WifiOff,
} from "lucide-react";

import { FadeIn } from "@/components/landing/FadeIn";
import { landingPalette } from "@/components/landing/palette";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Timer,
    title: "Smart Study Timer",
    description: "Hit Resume when you start, Pause when you stop. Every second is tracked automatically.",
  },
  {
    icon: BookOpen,
    title: "Subject Tagging",
    description: "Label each session with a subject, from Maths to Physics. See exactly where your time goes.",
  },
  {
    icon: Users,
    title: "Friend Groups",
    description: "Add friends via a unique referral code. Your progress and theirs stay visible in real time.",
  },
  {
    icon: BarChart2,
    title: "Head-to-Head Compare",
    description: "Pick a friend, pick a date, and see a side-by-side breakdown with a declared winner.",
  },
  {
    icon: CheckSquare,
    title: "Shared Todo Lists",
    description: "Add tasks for the day. Friends can see your list and track what you have completed.",
  },
  {
    icon: WifiOff,
    title: "Auto-Pause on Close",
    description: "Close the tab or lose connection, and the timer pauses itself so not a single second is lost.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimised",
    description: "Full-screen, touch-friendly layouts keep sessions easy to track between lectures.",
  },
  {
    icon: PictureInPicture2,
    title: "Floating Pop-Up Timer",
    description: "Pop out a small timer widget that floats over any window. Resize it, move it, stay focused.",
  },
  {
    icon: Trophy,
    title: "Daily Winner",
    description: "At the end of each day, StudySync crowns whoever studied most or completed the most tasks.",
  },
] as const;

export function FeaturesGrid() {
  return (
    <section className="px-4 py-24 md:px-8 lg:px-16" id="features">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mx-auto mb-12 max-w-3xl text-center">
          <p className={cn("text-sm font-bold uppercase tracking-[0.28em]", landingPalette.label)}>Everything You Need</p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-normal md:text-4xl">
            One dashboard. Every habit. Shared with your crew.
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <FadeIn delay={index * 0.05} key={feature.title}>
                <Card className="h-full border-[var(--border-strong)] bg-[var(--surface-strong)]">
                  <CardContent className="grid gap-4 p-6">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", landingPalette.softTint, landingPalette.softIcon)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
