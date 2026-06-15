"use client";

import { Flame, Trophy, CalendarDays, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEKS_TO_SHOW = 15; // ~3.5 months
const TOTAL_DAYS = WEEKS_TO_SHOW * 7;

const MOTIVATIONAL_QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Discipline is choosing what you want most over what you want now.", author: "Abraham Lincoln" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

// Color scale based on study duration (seconds)
function getCellStyle(seconds: number, isToday: boolean): { bg: string; ring: string; glow: string } {
  if (isToday && seconds === 0) {
    return { bg: "rgba(108,99,255,0.08)", ring: "1px solid rgba(108,99,255,0.5)", glow: "" };
  }
  if (seconds === 0) {
    return { bg: "rgba(255,255,255,0.04)", ring: "1px solid rgba(255,255,255,0.06)", glow: "" };
  }
  const hours = seconds / 3600;
  if (hours < 0.5) return { bg: "rgba(108,99,255,0.20)", ring: "1px solid rgba(108,99,255,0.3)", glow: "" };
  if (hours < 1)   return { bg: "rgba(108,99,255,0.38)", ring: "1px solid rgba(108,99,255,0.45)", glow: "" };
  if (hours < 2)   return { bg: "rgba(108,99,255,0.58)", ring: "1px solid rgba(108,99,255,0.65)", glow: "0 0 8px rgba(108,99,255,0.3)" };
  if (hours < 4)   return { bg: "rgba(108,99,255,0.78)", ring: "1px solid rgba(108,99,255,0.85)", glow: "0 0 12px rgba(108,99,255,0.4)" };
  return { bg: "rgba(108,99,255,1)", ring: "1px solid rgba(139,127,255,1)", glow: "0 0 16px rgba(108,99,255,0.6)" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function subtractDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - n);
  return toLocalDateStr(d);
}

function computeCurrentStreak(activeDates: Set<string>): number {
  const today = todayLocalDate();
  const yesterday = subtractDays(today, 1);
  const start = activeDates.has(today) ? today : activeDates.has(yesterday) ? yesterday : null;
  if (!start) return 0;
  let streak = 0, cursor = start;
  while (activeDates.has(cursor)) { streak++; cursor = subtractDays(cursor, 1); }
  return streak;
}

function computeLongestStreak(activeDates: Set<string>): number {
  if (activeDates.size === 0) return 0;
  const sorted = Array.from(activeDates).sort();
  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const next = new Date(`${sorted[i - 1]}T12:00:00`);
    next.setDate(next.getDate() + 1);
    if (sorted[i] === toLocalDateStr(next)) { current++; longest = Math.max(longest, current); }
    else { current = 1; }
  }
  return longest;
}

function getDailyQuote() {
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
}

function formatHours(seconds: number): string {
  if (seconds === 0) return "No study";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Build demo data map: dateStr -> seconds studied
function buildDemoData(): Map<string, number> {
  const today = todayLocalDate();
  const map = new Map<string, number>();
  const skip = new Set([3, 8, 14, 21, 27]);
  for (let i = 0; i < TOTAL_DAYS; i++) {
    if (!skip.has(i % 30)) {
      const secs = Math.floor(Math.random() * 14400 + 1800); // 30min–4h
      map.set(subtractDays(today, i), secs);
    }
  }
  return map;
}

// ─── Grid builder ────────────────────────────────────────────────────────────

/**
 * Returns a 2D grid: grid[weekIndex][dayOfWeek] = dateStr | null
 * weekIndex 0 = oldest week, dayOfWeek 0 = Sunday
 */
function buildGrid(today: string): string[][] {
  // Find the most recent Saturday (end of week)
  const todayDate = new Date(`${today}T12:00:00`);
  const dayOfWeek = todayDate.getDay(); // 0=Sun ... 6=Sat
  // Shift so week ends on Saturday
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;

  const grid: string[][] = [];
  for (let w = WEEKS_TO_SHOW - 1; w >= 0; w--) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      // d=0=Sunday of that week
      const offset = daysToSaturday + w * 7 + (6 - d);
      const dateStr = subtractDays(today, offset);
      week.push(dateStr);
    }
    grid.push(week);
  }
  return grid;
}

// Build month label positions: [{label, weekIndex}]
function buildMonthLabels(grid: string[][]): { label: string; weekIndex: number }[] {
  const labels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < grid.length; w++) {
    // Use first non-null cell in the week (Sunday)
    const date = new Date(`${grid[w][1]}T12:00:00`);
    const month = date.getMonth();
    if (month !== lastMonth) {
      labels.push({ label: MONTH_NAMES[month], weekIndex: w });
      lastMonth = month;
    }
  }
  return labels;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 flex-1 min-w-[120px] rounded-2xl bg-secondary/40" />
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `24px repeat(${WEEKS_TO_SHOW}, 1fr)` }}>
        {Array.from({ length: 7 * (WEEKS_TO_SHOW + 1) + 7 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-secondary/30" />
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: "amber" | "violet" | "teal";
}) {
  const accentStyles = {
    amber: { card: "border-amber-500/20 bg-amber-500/5", icon: "bg-amber-500/15 text-amber-400", text: "text-amber-300" },
    violet: { card: "border-violet-500/20 bg-violet-500/5", icon: "bg-violet-500/15 text-violet-400", text: "text-violet-300" },
    teal: { card: "border-teal-500/20 bg-teal-500/5", icon: "bg-teal-500/15 text-teal-400", text: "text-teal-300" },
  };
  const s = accentStyles[accent];
  return (
    <div className={`flex flex-1 min-w-[120px] items-center gap-4 rounded-2xl border px-5 py-4 ${s.card}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`font-mono text-3xl font-black leading-tight ${s.text}`}>{value}</p>
        {sublabel && <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StreakHeatmap() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((s) => s.profile);

  const [studyMap, setStudyMap] = useState<Map<string, number>>(new Map());
  const [isLoading, setLoading] = useState(true);
  const today = todayLocalDate();

  const loadData = useCallback(async () => {
    if (!profile) { setLoading(false); return; }

    if (!isConfigured) {
      setStudyMap(buildDemoData());
      setLoading(false);
      return;
    }

    const fromDate = subtractDays(today, TOTAL_DAYS - 1);

    try {
      // 1. Fetch sessions in range
      const { data: sessions, error: sessErr } = await supabase
        .from("study_sessions")
        .select("id, date")
        .eq("user_id", profile.id)
        .gte("date", fromDate)
        .lte("date", today);

      if (sessErr || !sessions?.length) { setLoading(false); return; }

      // 2. Fetch segments for those sessions to get duration per day
      const sessionIds = sessions.map((s) => s.id);
      const sessionDateMap = new Map(sessions.map((s) => [s.id, s.date as string]));

      const { data: segments, error: segErr } = await supabase
        .from("session_segments")
        .select("session_id, duration_secs")
        .in("session_id", sessionIds);

      if (segErr) { setLoading(false); return; }

      // 3. Aggregate seconds per date
      const map = new Map<string, number>();
      for (const seg of segments ?? []) {
        const date = sessionDateMap.get(seg.session_id);
        if (!date) continue;
        const secs = seg.duration_secs ?? 0;
        map.set(date, (map.get(date) ?? 0) + secs);
      }

      // Sessions with no segments still count as "studied" (1 second minimum)
      for (const sess of sessions) {
        const date = sess.date as string;
        if (!map.has(date)) map.set(date, 60); // 1 min minimum
      }

      setStudyMap(map);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, profile, supabase, today]);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeDates = useMemo(() => new Set(studyMap.keys()), [studyMap]);
  const currentStreak = useMemo(() => computeCurrentStreak(activeDates), [activeDates]);
  const longestStreak = useMemo(() => computeLongestStreak(activeDates), [activeDates]);
  const totalDays = useMemo(() => activeDates.size, [activeDates]);
  const quote = useMemo(() => getDailyQuote(), []);
  const grid = useMemo(() => buildGrid(today), [today]);
  const monthLabels = useMemo(() => buildMonthLabels(grid), [grid]);

  // Cell pixel size (responsive via CSS)
  const CELL_SIZE = 12; // px — we'll use CSS to handle responsive

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <span className="relative flex h-6 w-6 items-center justify-center" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
            <Flame className="relative h-4 w-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          </span>
          Activity Heatmap
          {!isConfigured && (
            <span className="ml-auto text-xs font-normal text-muted-foreground/50">Demo</span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {isLoading ? <HeatmapSkeleton /> : (
          <>
            {/* ── Stat Cards ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3">
              <StatCard
                icon={Flame}
                label="Current Streak"
                value={`${currentStreak}d`}
                sublabel={currentStreak > 0 ? "🔥 Keep it up!" : "Start today!"}
                accent="amber"
              />
              <StatCard
                icon={Trophy}
                label="Longest Streak"
                value={`${longestStreak}d`}
                sublabel="Personal best"
                accent="violet"
              />
              <StatCard
                icon={CalendarDays}
                label="Days Studied"
                value={totalDays}
                sublabel={`Last ${WEEKS_TO_SHOW} weeks`}
                accent="teal"
              />
            </div>

            {/* ── GitHub-style Calendar Heatmap ────────────────────────────── */}
            <div className="overflow-x-auto rounded-xl border border-border bg-secondary/10 p-4">
              {/* Month labels */}
              <div
                className="mb-1 grid text-[10px] font-semibold text-muted-foreground/60"
                style={{ gridTemplateColumns: `20px repeat(${WEEKS_TO_SHOW}, 1fr)` }}
              >
                <div />
                {grid.map((_, wi) => {
                  const label = monthLabels.find((m) => m.weekIndex === wi);
                  return (
                    <div key={wi} className="truncate px-0.5">
                      {label ? label.label : ""}
                    </div>
                  );
                })}
              </div>

              {/* Grid rows: 7 rows (Sun-Sat), each row has WEEKS_TO_SHOW cells */}
              <div className="grid gap-y-1">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="grid items-center gap-x-1"
                    style={{ gridTemplateColumns: `20px repeat(${WEEKS_TO_SHOW}, 1fr)` }}
                  >
                    {/* Day label */}
                    <div className="text-[9px] font-medium text-muted-foreground/50 text-right pr-1 leading-none">
                      {DAY_LABELS[dayIdx]}
                    </div>
                    {/* Cells */}
                    {grid.map((week, wi) => {
                      const dateStr = week[dayIdx];
                      const seconds = studyMap.get(dateStr) ?? 0;
                      const isToday = dateStr === today;
                      const isFuture = dateStr > today;
                      const { bg, ring, glow } = getCellStyle(isFuture ? 0 : seconds, isToday);

                      const tooltipDate = new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "short", month: "short", day: "numeric",
                      });
                      const tooltipText = isFuture
                        ? tooltipDate
                        : `${tooltipDate} — ${formatHours(seconds)}`;

                      return (
                        <div
                          key={wi}
                          title={tooltipText}
                          className="aspect-square w-full rounded-[3px] transition-transform duration-150 hover:scale-125 hover:z-10 relative"
                          style={{
                            background: isFuture ? "rgba(255,255,255,0.02)" : bg,
                            border: isFuture ? "1px solid rgba(255,255,255,0.03)" : ring,
                            boxShadow: isFuture ? "none" : glow,
                            outline: isToday ? "2px solid rgba(108,99,255,0.6)" : "none",
                            outlineOffset: "1px",
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/60">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  {[0, 0.4, 1800, 5400, 9000, 14400].map((secs, i) => {
                    const { bg } = getCellStyle(secs, false);
                    return (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-[2px]"
                        style={{ background: bg, border: "1px solid rgba(255,255,255,0.06)" }}
                      />
                    );
                  })}
                </div>
                <span>More</span>
              </div>
            </div>

            {/* ── Motivational Quote ────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-xl border border-[#2dd4bf]/15 bg-gradient-to-r from-[#2dd4bf]/8 to-[#6c63ff]/5 px-5 py-4">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#2dd4bf] to-[#6c63ff]" />
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#2dd4bf]/70" />
                <div>
                  <p className="text-sm italic leading-relaxed text-foreground/80">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground/60">
                    — {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
