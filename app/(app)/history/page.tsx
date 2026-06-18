"use client";

import { BookOpenCheck, CalendarIcon, CheckSquare, Clock3, Hash } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { differenceInCalendarDays, format, parse } from "date-fns";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { SessionSegmentList } from "@/components/timer/SessionSegmentList";
import { SubjectChart } from "@/components/stats/SubjectChart";
import { TodoList } from "@/components/todos/TodoList";
import { type TodoRow } from "@/components/todos/TodoItem";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { HistorySkeleton } from "@/components/ui/skeletons";
import { formatDurationCompact, totalDurationSecs } from "@/lib/timer";
import { cn, todayLocalDate } from "@/lib/utils";
import { type TimerSegment } from "@/stores/useTimerStore";
import { useUserStore } from "@/stores/useUserStore";

type DayData = {
  segments: TimerSegment[];
  todos: TodoRow[];
  hasSession: boolean;
};

export default function HistoryPage() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const [selectedDate, setSelectedDate] = useState(todayLocalDate);
  const [data, setData] = useState<DayData | null>(null);
  // Start loading immediately so HistorySkeleton shows on first paint.
  const [isLoading, setLoading] = useState(true);

  const isToday = selectedDate === todayLocalDate();

  const canEdit = (() => {
    try {
      const today = new Date();
      const targetDate = parse(selectedDate, "yyyy-MM-dd", new Date());
      const diffDays = differenceInCalendarDays(today, targetDate);
      return diffDays >= 0 && diffDays <= 3;
    } catch {
      return false;
    }
  })();

  const loadDayData = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    try {
      if (!isConfigured) {
        // Demo mode: no historical Supabase data available.
        setData({ segments: [], todos: [], hasSession: false });
        return;
      }

      // Check whether a study_session exists for this date.
      const { data: session, error: sessionError } = await supabase
        .from("study_sessions")
        .select("id")
        .eq("user_id", profile.id)
        .eq("date", selectedDate)
        .maybeSingle();

      if (sessionError) {
        toast.error(sessionError.message);
        return;
      }

      if (!session) {
        setData({ segments: [], todos: [], hasSession: false });
        return;
      }

      // Parallel-fetch segments and todos.
      const [segResult, todoResult] = await Promise.all([
        supabase
          .from("session_segments")
          .select("*")
          .eq("session_id", session.id)
          .order("started_at", { ascending: true }),
        supabase
          .from("todos")
          .select("*")
          .eq("user_id", profile.id)
          .eq("date", selectedDate)
          .order("is_completed", { ascending: true })
          .order("sort_order", { ascending: true }),
      ]);

      if (segResult.error) {
        toast.error(segResult.error.message);
        return;
      }

      if (todoResult.error) {
        toast.error(todoResult.error.message);
        return;
      }

      setData({
        segments: segResult.data ?? [],
        todos: todoResult.data ?? [],
        hasSession: true,
      });
    } finally {
      setLoading(false);
    }
  }, [isConfigured, profile, selectedDate, supabase]);

  useEffect(() => {
    void loadDayData();
  }, [loadDayData]);

  const totalStudySeconds = data ? totalDurationSecs(data.segments) : 0;
  const completedTodos = data ? data.todos.filter((t) => t.is_completed).length : 0;
  const totalTodos = data?.todos.length ?? 0;

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Clock3 className="h-6 w-6 text-[#6c63ff]" />
            <h1 className="font-heading text-3xl font-semibold tracking-normal">Study History</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse your past sessions and tasks by date.
          </p>
        </div>

        {/* Date picker — capped at today so future dates can't be selected */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[220px] justify-start text-left font-normal bg-card/40 border-border hover:bg-secondary",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-teal-500" />
              {selectedDate ? format(parse(selectedDate, "yyyy-MM-dd", new Date()), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate ? parse(selectedDate, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(d) => d && setSelectedDate(format(d, "yyyy-MM-dd"))}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <HistorySkeleton />
      ) : data === null || !data.hasSession ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <BookOpenCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-base font-semibold">
                {isToday ? "No sessions yet today" : "No study data for this day"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isToday
                  ? "Start the timer to record your first session."
                  : "You didn't record any sessions on this date."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Summary strip ──────────────────────────────────────────────── */}
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="flex flex-col gap-1 pr-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    Study Time
                  </p>
                  <p className="font-mono text-xl font-semibold sm:text-2xl">
                    {formatDurationCompact(totalStudySeconds)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 px-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    Segments
                  </p>
                  <p className="font-mono text-xl font-semibold sm:text-2xl">
                    {data.segments.length}
                  </p>
                </div>
                <div className="flex flex-col gap-1 pl-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <CheckSquare className="h-3 w-3" />
                    Tasks Done
                  </p>
                  <p className="font-mono text-xl font-semibold sm:text-2xl">
                    {completedTodos}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}/ {totalTodos}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Subject Breakdown chart for this date ──────────────────── */}
          <SubjectChart fixedDate={selectedDate} />

          {/* ── Segment list ───────────────────────────────────────────────── */}
          {/* readOnly=false for today so subject names remain editable */}
          <SessionSegmentList
            readOnly={!canEdit}
            segments={data.segments}
            title="Session Segments"
            onRefresh={loadDayData}
          />

          {/* ── Todo list ──────────────────────────────────────────────────── */}
          {/*
            For today: render the self-managing TodoList (no external todos prop)
            so the user can still add, toggle, and delete tasks.

            For past dates: pass todos externally with readOnly so the list is
            a pure read-only snapshot — no DB mutations possible.
          */}
          {isToday ? (
            <TodoList date={selectedDate} title="Tasks" />
          ) : (
            <TodoList
              date={selectedDate}
              readOnly
              title="Tasks"
              todos={data.todos}
            />
          )}
        </>
      )}
    </div>
  );
}
