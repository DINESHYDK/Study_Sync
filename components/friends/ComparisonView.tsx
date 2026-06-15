"use client";

import { ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { format, parse } from "date-fns";

import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { CommentSection } from "@/components/friends/CommentSection";
import { SessionSegmentList } from "@/components/timer/SessionSegmentList";
import { TodoList } from "@/components/todos/TodoList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComparisonSkeleton } from "@/components/ui/skeletons";
import { formatDurationCompact, totalDurationSecs } from "@/lib/timer";
import { cn, todayLocalDate } from "@/lib/utils";
import { useUserStore, type UserProfile } from "@/stores/useUserStore";
import type { Tables } from "@/types/database";

type Metric = "study_time" | "tasks_completed";

type UserDayData = {
  profile: UserProfile;
  /** null when the user has no study_session for this date. */
  sessionId: string | null;
  segments: Tables<"session_segments">[];
  todos: Tables<"todos">[];
};

async function loadDayData(
  supabase: ReturnType<typeof useSupabase>["supabase"],
  userProfile: UserProfile,
  date: string,
): Promise<UserDayData> {
  const { data: session } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", userProfile.id)
    .eq("date", date)
    .maybeSingle();

  const [{ data: segments, error: segmentsError }, { data: todos, error: todosError }] = await Promise.all([
    session
      ? supabase.from("session_segments").select("*").eq("session_id", session.id).order("started_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("todos").select("*").eq("user_id", userProfile.id).eq("date", date).order("sort_order", { ascending: true }),
  ]);

  if (segmentsError || todosError) {
    throw new Error(segmentsError?.message ?? todosError?.message ?? "Could not load comparison data.");
  }

  return {
    profile: userProfile,
    sessionId: session?.id ?? null,
    segments: segments ?? [],
    todos: todos ?? [],
  };
}

function scoreFor(data: UserDayData, metric: Metric) {
  if (metric === "study_time") {
    return totalDurationSecs(data.segments);
  }

  return data.todos.filter((todo) => todo.is_completed).length;
}

function winnerText(left: UserDayData, right: UserDayData, metric: Metric) {
  const leftScore = scoreFor(left, metric);
  const rightScore = scoreFor(right, metric);

  if (leftScore === rightScore) {
    return "🤝 It's a tie!";
  }

  const difference = Math.abs(leftScore - rightScore);
  const formattedDifference = metric === "study_time" ? formatDurationCompact(difference) : `${difference} task${difference === 1 ? "" : "s"}`;

  if (leftScore > rightScore) {
    return `🎉 You won by ${formattedDifference}!`;
  } else {
    const friendName = right.profile.full_name || right.profile.email;
    return `💪 ${friendName} won by ${formattedDifference}`;
  }
}

function ComparisonColumn({
  data,
  highlighted,
  myProfileId,
}: {
  data: UserDayData;
  highlighted: boolean;
  myProfileId: string;
}) {
  const total = totalDurationSecs(data.segments);
  const completedTodos = data.todos.filter((todo) => todo.is_completed).length;
  // The current user cannot comment on their own session.
  const isOwnColumn = data.profile.id === myProfileId;

  return (
    <motion.div
      animate={{
        boxShadow: highlighted
          ? "0 0 44px rgba(45, 212, 191, 0.15)"
          : "0 0 0px rgba(0, 0, 0, 0)",
        borderColor: highlighted ? "rgba(45, 212, 191, 0.4)" : "rgba(42, 42, 61, 0.5)",
      }}
      className="min-w-0 overflow-hidden rounded-2xl border bg-card/40 transition-colors"
      initial={{ boxShadow: "0 0 0px rgba(0, 0, 0, 0)" }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid min-w-0 gap-5 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar profile={data.profile} />
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-semibold">{data.profile.full_name || data.profile.email}</p>
            <p className="text-sm text-muted-foreground">
              {formatDurationCompact(total)} study, {completedTodos} done
            </p>
          </div>
        </div>
        <SessionSegmentList readOnly segments={data.segments} title="Segments" />
        <TodoList readOnly todos={data.todos} title="Tasks" />
        {/* Comments — disabled on own column, enabled for friend columns */}
        {data.sessionId ? (
          <CommentSection
            canPost={!isOwnColumn}
            sessionId={data.sessionId}
          />
        ) : null}
      </div>
    </motion.div>
  );
}

export function ComparisonView({ friendId }: { friendId: string }) {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const [date, setDate] = useState(todayLocalDate());
  const [metric, setMetric] = useState<Metric>("study_time");
  const [left, setLeft] = useState<UserDayData | null>(null);
  const [right, setRight] = useState<UserDayData | null>(null);
  const [isLoading, setLoading] = useState(false);

  const loadComparison = useCallback(async () => {
    if (!profile || !isConfigured) {
      setLeft(null);
      setRight(null);
      return;
    }

    setLoading(true);
    const { data: friendProfile, error } = await supabase.from("profiles").select("*").eq("id", friendId).single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    try {
      const [selfData, friendData] = await Promise.all([
        loadDayData(supabase, profile, date),
        loadDayData(supabase, friendProfile, date),
      ]);
      setLeft(selfData);
      setRight(friendData);
    } catch (comparisonError) {
      toast.error(comparisonError instanceof Error ? comparisonError.message : "Could not load comparison.");
    } finally {
      setLoading(false);
    }
  }, [date, friendId, isConfigured, profile, supabase]);

  useEffect(() => {
    void loadComparison();
  }, [loadComparison]);

  useEffect(() => {
    if (!isLoading && left && right) {
      const leftScore = scoreFor(left, metric);
      const rightScore = scoreFor(right, metric);
      if (leftScore > rightScore && leftScore > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2dd4bf', '#fcd34d', '#3b82f6', '#a78bfa']
        });
      }
    }
  }, [left, right, isLoading, metric]);

  const scores = useMemo(() => {
    if (!left || !right) {
      return { leftWins: false, rightWins: false };
    }

    const leftScore = scoreFor(left, metric);
    const rightScore = scoreFor(right, metric);

    return {
      leftWins: leftScore > rightScore,
      rightWins: rightScore > leftScore,
    };
  }, [left, metric, right]);

  if (!isConfigured) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Supabase is required for friend comparisons. Add credentials to `.env.local` and create friendships first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost">
          <Link href="/friends">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="grid min-w-0 gap-3 sm:w-auto sm:grid-cols-[minmax(0,14rem)_minmax(0,14rem)]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-0 justify-start text-left font-normal bg-card/40 border-border hover:bg-secondary",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-teal-500" />
                {date ? format(parse(date, "yyyy-MM-dd", new Date()), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date ? parse(date, "yyyy-MM-dd", new Date()) : undefined}
                onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select onValueChange={(value: Metric) => setMetric(value)} value={metric}>
            <SelectTrigger className="min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="study_time">Total Study Time</SelectItem>
              <SelectItem value="tasks_completed">Tasks Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <ComparisonSkeleton />
      ) : left && right ? (
        <>
          <div className={cn(
            "overflow-hidden rounded-2xl border p-5 text-center font-heading text-xl font-semibold sm:text-2xl shadow-lg transition-colors duration-500",
            scores.leftWins 
              ? "border-teal-500/30 bg-teal-500/10 text-teal-100 shadow-[0_0_20px_rgba(45,212,191,0.1)]" 
              : scores.rightWins 
                ? "border-rose-500/30 bg-rose-500/10 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
                : "border-secondary/50 bg-secondary/20 text-muted-foreground"
          )}>
            {winnerText(left, right, metric)}
          </div>
          <div className="grid min-w-0 w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ComparisonColumn data={left} highlighted={scores.leftWins} myProfileId={profile!.id} />
            <ComparisonColumn data={right} highlighted={scores.rightWins} myProfileId={profile!.id} />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No comparison data available.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
