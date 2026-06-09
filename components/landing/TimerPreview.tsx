import { Pause, Timer } from "lucide-react";

import { Card } from "@/components/ui/card";
import { landingPalette } from "@/components/landing/palette";
import { cn } from "@/lib/utils";

const rows = [
  { time: "10:00 AM - 12:30 PM", subject: "Mathematics", duration: "2h 30m" },
  { time: "2:30 PM - 5:17 PM", subject: "Physics", duration: "2h 47m" },
  { time: "7:00 PM - Now", subject: "Chemistry", duration: "Running" },
] as const;

export function TimerPreview() {
  return (
    <Card className={cn("mx-auto w-full max-w-3xl border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-2xl sm:p-6", landingPalette.softShadow)}>
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Timer className="h-4 w-4 text-[#38bdf8]" />
          Today&apos;s Study Time
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          Live
        </span>
      </div>
      <div className="timer-digits py-8 text-center font-mono text-4xl font-semibold sm:text-6xl">
        02 : 34 : 17
      </div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_28px_rgba(34,197,94,0.36)] animate-pulse">
          <Pause className="h-4 w-4" />
          Pause
        </div>
      </div>
      <div className="grid gap-2 text-xs sm:text-sm">
        {rows.map((row) => (
          <div
            className="grid gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-strong)]/70 p-3 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center"
            key={`${row.time}-${row.subject}`}
          >
            <span className="font-mono text-[var(--text-muted)]">{row.time}</span>
            <span className="font-semibold text-foreground">{row.subject}</span>
            <span className={row.duration === "Running" ? "text-emerald-200" : "text-[var(--text-muted)]"}>
              {row.duration}
              {row.duration === "Running" ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-400" /> : null}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
