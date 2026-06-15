"use client";

import { ChevronLeft, ChevronRight, Flame, CloudOff, Trophy, Quote } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOTIVATIONAL_QUOTES = [
  "The expert in anything was once a beginner.",
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "Success is the sum of small efforts repeated day in and day out.",
];

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

// Build demo data map: dateStr -> seconds studied
function buildDemoData(): Map<string, number> {
  const today = todayLocalDate();
  const map = new Map<string, number>();
  const skip = new Set([3, 8, 14, 21, 27]);
  for (let i = 0; i < 90; i++) {
    if (!skip.has(i % 30)) {
      const secs = Math.floor(Math.random() * 14400 + 1800); // 30min–4h
      map.set(subtractDays(today, i), secs);
    }
  }
  return map;
}

// ─── Calendar Generation ──────────────────────────────────────────────────────

interface CalendarDay {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = todayLocalDate();
  const days: CalendarDay[] = [];
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Calculate starting day offset (Monday = 0, Sunday = 6)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6; // Sunday
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    const dateStr = toLocalDateStr(d);
    days.push({
      dateStr,
      dayNum: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === today,
      isFuture: dateStr > today
    });
  }
  
  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const dateStr = toLocalDateStr(d);
    days.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isFuture: dateStr > today
    });
  }
  
  // Next month days to fill 6 rows (42 days)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = toLocalDateStr(d);
    days.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isFuture: dateStr > today
    });
  }
  
  return days;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between">
        <div className="h-8 w-8 rounded-full bg-secondary/30" />
        <div className="h-8 w-32 rounded-full bg-secondary/30" />
        <div className="h-8 w-8 rounded-full bg-secondary/30" />
      </div>
      <div className="grid grid-cols-7 gap-y-4 gap-x-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-secondary/20" />
        ))}
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
  const todayDateObj = new Date(`${today}T12:00:00`);
  
  const [currentDate, setCurrentDate] = useState(new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), 1));

  const loadData = useCallback(async () => {
    if (!profile) { setLoading(false); return; }

    if (!isConfigured) {
      setStudyMap(buildDemoData());
      setLoading(false);
      return;
    }

    // Fetch last 90 days for accurate streaks and calendar views
    const fromDate = subtractDays(today, 90);

    try {
      const { data: sessions, error: sessErr } = await supabase
        .from("study_sessions")
        .select("id, date")
        .eq("user_id", profile.id)
        .gte("date", fromDate)
        .lte("date", today);

      if (sessErr || !sessions?.length) { setLoading(false); return; }

      const sessionIds = sessions.map((s) => s.id);
      const sessionDateMap = new Map(sessions.map((s) => [s.id, s.date as string]));

      const { data: segments, error: segErr } = await supabase
        .from("session_segments")
        .select("session_id, duration_secs")
        .in("session_id", sessionIds);

      if (segErr) { setLoading(false); return; }

      const map = new Map<string, number>();
      for (const seg of segments ?? []) {
        const date = sessionDateMap.get(seg.session_id);
        if (!date) continue;
        const secs = seg.duration_secs ?? 0;
        map.set(date, (map.get(date) ?? 0) + secs);
      }

      for (const sess of sessions) {
        const date = sess.date as string;
        if (!map.has(date)) map.set(date, 60); 
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
  
  const calendarDays = useMemo(() => 
    getCalendarDays(currentDate.getFullYear(), currentDate.getMonth()), 
  [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const dailyQuote = useMemo(() => {
    return MOTIVATIONAL_QUOTES[new Date().getDay() % MOTIVATIONAL_QUOTES.length];
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Heatmap Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#2a2a35] bg-[#1a1a24] p-6 shadow-2xl">
        {/* Subtle top glow effect mimicking the design */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-teal-500 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-teal-500/10 blur-[50px] pointer-events-none" />

        {isLoading ? <HeatmapSkeleton /> : (
          <div className="relative z-10 flex flex-col gap-8">
            
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 shrink-0" /> {/* Spacer to keep header balanced */}
              
              <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center mx-2">
                <button 
                  onClick={handlePrevMonth}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex items-center justify-center rounded-2xl bg-white/5 px-6 py-2 backdrop-blur-sm border border-white/5 whitespace-nowrap">
                  <span className="font-semibold text-white/90">
                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                </div>
                
                <button 
                  onClick={handleNextMonth}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <div className="h-10 w-10 shrink-0" /> {/* Spacer to keep header balanced */}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-6">
              {/* Day Headers */}
              {DAY_LABELS.map(day => (
                <div key={day} className="text-center text-sm font-medium text-white/40 mb-2">
                  {day}
                </div>
              ))}
              
              {/* Day Cells */}
              {calendarDays.map((day, i) => {
                const isPast = day.dateStr < today;
                const hasStudied = activeDates.has(day.dateStr);
                
                let content;
                let isSpecial = false;
                
                if (!day.isFuture && !day.isToday && hasStudied) {
                  // Past active day = Flame
                  content = (
                    <span className="relative flex items-center justify-center drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]">
                      <Flame className="h-5 w-5 text-teal-400 fill-teal-400/20" />
                    </span>
                  );
                  isSpecial = true;
                } else if (!day.isFuture && !day.isToday && !hasStudied) {
                  // Past inactive day = CloudOff
                  content = <CloudOff className="h-5 w-5 text-white/20" />;
                  isSpecial = true;
                } else {
                  // Future or today (or past days if we want simple numbers)
                  content = (
                    <span className={[
                      "text-sm font-semibold transition-colors",
                      day.isCurrentMonth ? "text-white/80" : "text-white/20",
                      day.isToday ? "text-teal-400 font-bold" : ""
                    ].join(" ")}>
                      {day.dayNum}
                    </span>
                  );
                }

                // Special case: Today, if studied, show Flame instead of number
                if (day.isToday && hasStudied) {
                  content = (
                    <span className="relative flex items-center justify-center drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]">
                      <Flame className="h-5 w-5 text-teal-400 fill-teal-400/20" />
                    </span>
                  );
                  isSpecial = true;
                }

                return (
                  <div key={i} className="flex flex-col items-center justify-center h-10 relative">
                    {/* Today ring highlight */}
                    {day.isToday && !isSpecial && (
                      <div className="absolute inset-0 m-auto h-8 w-8 rounded-full border border-teal-500/50" />
                    )}
                    {content}
                  </div>
                );
              })}
            </div>

            {/* Bottom Stats */}
            <div className="mt-4 flex justify-center">
              {/* Streak Pill */}
              <div className="flex w-full sm:w-auto overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 py-3 border-r border-white/10">
                  <span className="text-sm font-medium text-white/80">Current</span>
                  <Flame className="h-4 w-4 text-teal-400 fill-teal-400/20" />
                  <span className="text-sm font-bold text-white">{currentStreak}</span>
                </div>
                <div className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 py-3">
                  <span className="text-sm font-medium text-white/80">Max</span>
                  <span className="text-sm font-bold text-teal-400">{'</>'}</span>
                  <span className="text-sm font-bold text-white">{longestStreak}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Quote of the Day Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#2a2a35] bg-[#1a1a24] p-6 shadow-2xl">
        {/* Subtle top glow effect mimicking the design */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-teal-500 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-teal-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-teal-400">
            <Quote className="h-4 w-4 fill-teal-400/20 rotate-180" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400/80">Quote of the Day</span>
          </div>
          <p className="text-sm font-medium text-white/95 italic leading-relaxed pl-1">
            &quot;{dailyQuote}&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
