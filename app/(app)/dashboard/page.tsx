"use client";

import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

import { FriendCard } from "@/components/friends/FriendCard";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { SessionSegmentList } from "@/components/timer/SessionSegmentList";
import { TimerPanel } from "@/components/timer/TimerPanel";
import { TodoList } from "@/components/todos/TodoList";
import { Card, CardContent } from "@/components/ui/card";
import { useFriendStore } from "@/stores/useFriendStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { useUserStore } from "@/stores/useUserStore";

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export default function DashboardPage() {
  const profile = useUserStore((state) => state.profile);
  const segments = useTimerStore((state) => state.segments);
  const friends = useFriendStore((state) => state.friends);
  const { isConfigured } = useSupabase();

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          <h1 className="font-heading text-3xl font-semibold tracking-normal">
            {greeting()}, {profile?.full_name?.split(" ")[0] || "there"}
          </h1>
        </div>
      </header>

      {!isConfigured ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex gap-3 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Demo mode is active because Supabase env vars are missing. Timer and todos persist locally for preview.</p>
          </CardContent>
        </Card>
      ) : null}

      <TimerPanel />
      <SessionSegmentList segments={segments} />
      <TodoList />

      <section className="flex flex-col gap-3 min-w-0 w-full">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Friends Activity</h2>
        </div>
        {friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No friend activity yet. Add friends from Settings to see live progress here.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-subtle">
            {friends.map((friend) => (
              <div className="w-80 shrink-0" key={friend.profile.id}>
                <FriendCard friend={friend} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
