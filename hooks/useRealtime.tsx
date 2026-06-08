"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { useFriends } from "@/hooks/useFriends";
import { useFriendStore } from "@/stores/useFriendStore";
import { useUserStore } from "@/stores/useUserStore";

export function useRealtime() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const friends = useFriendStore((state) => state.friends);
  const { loadFriends, loadIncomingRequests, acceptRequest, declineRequest } = useFriends();

  useEffect(() => {
    if (!isConfigured || !profile) {
      return;
    }

    const friendIds = friends.map((friend) => friend.profile.id);
    const channel = supabase.channel("app-realtime");

    if (friendIds.length > 0) {
      const filter = `user_id=in.(${friendIds.join(",")})`;
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "session_segments", filter },
          () => void loadFriends(),
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "todos", filter }, () => void loadFriends());
    }

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "friend_requests",
        filter: `requested_id=eq.${profile.id}`,
      },
      async (payload: any) => {
        const requesterId = payload.new.requester_id;
        const { data: requesterProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", requesterId)
          .single();

        const senderName = requesterProfile?.full_name || requesterProfile?.email || "Someone";

        const toastId = toast.custom((t) => (
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-glow max-w-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">🙋</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Friend request received</p>
                <p className="text-xs text-muted-foreground truncate">
                  {senderName} wants to be friends.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void declineRequest(payload.new.id);
                  toast.dismiss(t);
                }}
              >
                Decline
              </Button>
              <Button
                size="sm"
                variant="success"
                onClick={() => {
                  void acceptRequest(payload.new.id);
                  toast.dismiss(t);
                }}
              >
                Accept
              </Button>
            </div>
          </div>
        ), { duration: Infinity });

        void loadIncomingRequests();
      },
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [friends, isConfigured, loadFriends, loadIncomingRequests, acceptRequest, declineRequest, profile, supabase]);
}
