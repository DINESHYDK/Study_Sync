import { Calendar, Trophy, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { landingPalette } from "@/components/landing/palette";
import { cn } from "@/lib/utils";

function StatCard({
  name,
  initials,
  time,
  width,
  tasks,
}: {
  name: string;
  initials: string;
  time: string;
  width: string;
  tasks: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-strong)] p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-heading text-xs font-semibold text-foreground">
          {initials}
        </span>
        <p className="font-heading text-lg font-semibold">{name}</p>
      </div>
      <p className="mt-5 font-mono text-2xl font-semibold">{time}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0a0a0f]">
        <div className="h-full rounded-full bg-[#2dd4bf]" style={{ width }} />
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{tasks}</p>
    </div>
  );
}

export function ComparisonPreview() {
  return (
    <Card className={cn("w-full border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-2xl sm:p-6", landingPalette.softShadow)}>
      <div className="flex flex-col gap-3 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-[#38bdf8]" />
          Today
        </span>
        <span className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-strong)] px-3 py-2">
          Total Time ▾
        </span>
      </div>
      <div className="mt-6 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <StatCard initials="Y" name="You" tasks="8 tasks ✓" time="5h 23m" width="88%" />
        <div className="text-center font-heading text-sm font-bold text-[var(--text-muted)]">VS</div>
        <StatCard initials="A" name="Arjun" tasks="5 tasks ✓" time="3h 41m" width="58%" />
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center font-heading text-lg font-semibold text-amber-100">
        <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
        You win by 1h 42m today!
      </div>
    </Card>
  );
}
