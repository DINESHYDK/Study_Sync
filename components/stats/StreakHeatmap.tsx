"use client";

import { CloudOff, Flame } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";

// ─── Constants ───────────────────────────────────────────────────────────────

const MOTIVATIONAL_QUOTES = [
  "The expert in anything was once a beginner.",
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "Success is the sum of small efforts repeated day in and day out.",
  "It's not about how much you do, but how much love you put into what you do.",
  "The secret of getting ahead is getting started.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for a Date object anchored to local noon. */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Subtract n calendar days from a YYYY-MM-DD string (noon-anchored). */
function subtractDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - n);
  return toLocalDateStr(d);
}

/** Compute current streak (consecutive days ending today or yesterday). */
function computeCurrentStreak(activeDates: Set<string>): number {
  const today = todayLocalDate();
  const yesterday = subtractDays(today, 1);

  const start = activeDates.has(today)
    ? today
    : activeDates.has(yesterday)
      ? yesterday
      : null;

  if (!start) return 0;

  let streak = 0;
  let cursor = start;

  while (activeDates.has(cursor)) {
    streak++;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}

/** Compute longest consecutive streak from a set of date strings. */
function computeLongestStreak(activeDates: Set<string>): number {
  if (activeDates.size === 0) return 0;

  const sorted = Array.from(activeDates).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const expected = subtractDays(sorted[i], -1); // sorted[i-1] + 1 day
    // Check if sorted[i] is exactly 1 day after sorted[i-1]
    const prev = sorted[i - 1];
    const nextOfPrev = new Date(`${prev}T12:00:00`);
    nextOfPrev.setDate(nextOfPrev.getDate() + 1);
    const nextOfPrevStr = toLocalDateStr(nextOfPrev);

    if (sorted[i] === nextOfPrevStr) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

/** Build a deterministic demo dataset for the last 30 days. */
function buildDemoActiveDates(): Set<string> {
  const today = todayLocalDate();
  const set = new Set<string>();
  // Seed: studied ~20 of the last 30 days with a few gaps
  const skipPattern = new Set([3, 7, 14, 20, 25]); // indices to skip

  for (let i = 0; i < 30; i++) {
    if (!skipPattern.has(i)) {
      set.add(subtractDays(today, i));
    }
  }

  return set;
}

/** Get motivational quote based on day-of-year (deterministic). */
function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StreakCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col items-center gap-1 rounded-xl border px-6 py-4 transition-colors",
        highlight
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-border bg-secondary/30",
      ].join(" ")}
    >
      <span
        className={[
          "font-mono text-4xl font-bold tabular-nums",
          highlight ? "text-amber-400" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

interface HeatmapCellProps {
  dateStr: string;
  isActive: boolean;
  isToday: boolean;
}

function HeatmapCell({ dateStr, isActive, isToday }: HeatmapCellProps) {
  // Format date for tooltip: "Mon, Jun 15"
  const label = new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      title={label}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
        "hover:scale-110 hover:shadow-md",
        isActive
          ? "border-amber-500/30 bg-amber-500/15 shadow-amber-500/10 shadow-sm"
          : "border-border bg-secondary/40",
        isToday && !isActive
          ? "border-[#6c63ff]/50 ring-1 ring-[#6c63ff]/30"
          : "",
        isToday && isActive
          ? "border-amber-400/60 ring-1 ring-amber-400/30"
          : "",
      ].join(" ")}
    >
      {isActive ? (
        <Flame className="h-4 w-4 text-amber-400 drop-shadow-sm" />
      ) : (
        <CloudOff className="h-4 w-4 text-muted-foreground/40" />
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Streak cards skeleton */}
      <div className="flex items-center justify-center gap-4">
        <div className="h-24 w-36 rounded-xl bg-secondary/50" />
        <div className="h-16 w-16 rounded-full bg-secondary/50" />
        <div className="h-24 w-36 rounded-xl bg-secondary/50" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="h-10 w-10 rounded-xl bg-secondary/50" />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StreakHeatmap() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((s) => s.profile);

  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [isLoading, setLoading] = useState(true);

  const today = todayLocalDate();

  // Build ordered list of the last 30 days (oldest → newest)
  const last30Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      days.push(subtractDays(today, i));
    }
    return days;
  }, [today]);

  const loadData = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    if (!isConfigured) {
      // Demo mode: generate fake data
      setActiveDates(buildDemoActiveDates());
      setLoading(false);
      return;
    }

    const thirtyDaysAgo = subtractDays(today, 29);

    const { data, error } = await supabase
      .from("study_sessions")
      .select("date")
      .eq("user_id", profile.id)
      .gte("date", thirtyDaysAgo)
      .lte("date", today);

    if (!error && data) {
      setActiveDates(new Set(data.map((row) => row.date as string)));
    }

    setLoading(false);
  }, [isConfigured, profile, supabase, today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentStreak = useMemo(
    () => computeCurrentStreak(activeDates),
    [activeDates],
  );

  const longestStreak = useMemo(
    () => computeLongestStreak(activeDates),
    [activeDates],
  );

  const quote = useMemo(() => getDailyQuote(), []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5">
          <span
            className="relative flex h-7 w-7 items-center justify-center"
            aria-hidden="true"
          >
            {/* Pulsing amber glow behind the flame icon */}
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
            <Flame className="relative h-5 w-5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
          </span>
          Activity Heatmap
          {!isConfigured && (
            <span className="ml-auto text-xs font-normal text-muted-foreground/60">
              Demo data
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {isLoading ? (
          <HeatmapSkeleton />
        ) : (
          <>
            {/* ── Streak counters ──────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <StreakCard
                label="Current Streak"
                value={currentStreak}
                highlight={currentStreak > 0}
              />

              {/* Central flame display */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-lg" />
                  <Flame
                    className={[
                      "relative h-10 w-10 transition-colors",
                      currentStreak > 0
                        ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                        : "text-muted-foreground/30",
                    ].join(" ")}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {currentStreak > 0 ? "On fire!" : "Start now"}
                </span>
              </div>

              <StreakCard label="Longest Streak" value={longestStreak} />
            </div>

            {/* ── 30-day heatmap grid ──────────────────────────────────────── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Last 30 Days
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(40px,1fr))]">
                {last30Days.map((day) => (
                  <HeatmapCell
                    key={day}
                    dateStr={day}
                    isActive={activeDates.has(day)}
                    isToday={day === today}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/15 border border-amber-500/30">
                    <Flame className="h-2.5 w-2.5 text-amber-400" />
                  </span>
                  Studied
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-secondary/40 border border-border">
                    <CloudOff className="h-2.5 w-2.5 text-muted-foreground/40" />
                  </span>
                  Missed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded border border-[#6c63ff]/50 ring-1 ring-[#6c63ff]/30 bg-secondary/40" />
                  Today
                </span>
              </div>
            </div>

            {/* ── Motivational quote ───────────────────────────────────────── */}
            <div className="rounded-xl border border-[#2dd4bf]/20 bg-[#2dd4bf]/5 p-4 pl-5 relative overflow-hidden">
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[#2dd4bf]/60 to-[#6c63ff]/60" />
              <p className="italic text-sm text-[#2dd4bf]/90 leading-relaxed">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
