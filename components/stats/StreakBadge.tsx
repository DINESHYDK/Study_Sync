"use client";

import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Badge } from "@/components/ui/badge";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";

// Returns "YYYY-MM-DD" for dateStr - N days (noon-anchored to dodge DST shifts).
function subtractDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Counts consecutive study days ending on today-or-yesterday.
 * A streak is "alive" if the user studied yesterday even if they
 * haven't started today's session yet.
 */
function computeStreak(datesDesc: string[]): number {
  if (datesDesc.length === 0) return 0;

  const today = todayLocalDate();
  const yesterday = subtractDays(today, 1);

  // The streak must begin from today or yesterday.
  if (datesDesc[0] !== today && datesDesc[0] !== yesterday) return 0;

  let streak = 1;
  let anchor = datesDesc[0]; // most recent date in the run

  for (let i = 1; i < datesDesc.length; i++) {
    const expected = subtractDays(anchor, 1);
    if (datesDesc[i] === expected) {
      streak++;
      anchor = datesDesc[i];
    } else {
      break;
    }
  }

  return streak;
}

export function StreakBadge() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const [streak, setStreak] = useState(0);
  const [isLoading, setLoading] = useState(true);

  const loadStreak = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .select("date")
      .eq("user_id", profile.id)
      .lte("date", todayLocalDate())
      .order("date", { ascending: false })
      .limit(90);

    if (!error && data) {
      setStreak(computeStreak(data.map((row) => row.date)));
    }

    setLoading(false);
  }, [isConfigured, profile, supabase]);

  useEffect(() => {
    void loadStreak();
  }, [loadStreak]);

  if (isLoading) {
    return <div className="h-6 w-28 animate-pulse rounded-full bg-secondary" />;
  }

  if (streak === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No streak yet — start today! 🔥
      </p>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Badge
        className="gap-1.5 px-3 py-1 text-sm font-semibold"
        variant={streak >= 7 ? "success" : "secondary"}
      >
        <Flame className="h-3.5 w-3.5 text-orange-400 animate-flame-amber" />
        {streak}-Day Streak
      </Badge>
    </motion.div>
  );
}
