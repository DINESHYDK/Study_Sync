"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { SessionSegmentList } from "@/components/timer/SessionSegmentList";
import { TodoList } from "@/components/todos/TodoList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComparisonSkeleton } from "@/components/ui/skeletons";
import { formatDurationCompact, totalDurationSecs } from "@/lib/timer";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore, type UserProfile } from "@/stores/useUserStore";
import type { Tables } from "@/types/database";

type Metric = "study_time" | "tasks_completed";

type UserDayData = {
  profile: UserProfile;
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

  const winner = leftScore > rightScore ? left : right;
  const difference = Math.abs(leftScore - rightScore);
  const formattedDifference = metric === "study_time" ? formatDurationCompact(difference) : `${difference} task${difference === 1 ? "" : "s"}`;

  return `🏆 ${winner.profile.full_name || winner.profile.email} wins by ${formattedDifference}!`;
}

function ComparisonColumn({ data, highlighted }: { data: UserDayData; highlighted: boolean }) {
  const total = totalDurationSecs(data.segments);
  const completedTodos = data.todos.filter((todo) => todo.is_completed).length;

  return (
    <motion.div
      animate={{
        boxShadow: highlighted
          ? "0 0 44px rgba(245, 158, 11, 0.24)"
          : "0 0 0px rgba(0, 0, 0, 0)",
        borderColor: highlighted ? "rgba(245, 158, 11, 0.5)" : "rgba(42, 42, 61, 0.5)",
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
        <div className="grid min-w-0 gap-3 sm:w-auto sm:grid-cols-[minmax(0,10rem)_minmax(0,14rem)]">
          <Input className="min-w-0" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
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
          <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center font-heading text-xl font-semibold text-amber-100 sm:text-2xl">
            {winnerText(left, right, metric)}
          </div>
          <div className="grid min-w-0 w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ComparisonColumn data={left} highlighted={scores.leftWins} />
            <ComparisonColumn data={right} highlighted={scores.rightWins} />
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
