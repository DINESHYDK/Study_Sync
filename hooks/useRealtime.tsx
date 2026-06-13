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

  // ── Friend-activity + friend-request realtime ────────────────────────────────
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
      async (payload: { new: { id: string; requester_id: string } }) => {
        const requesterId = payload.new.requester_id;
        const { data: requesterProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", requesterId)
          .single();

        const senderName = requesterProfile?.full_name || requesterProfile?.email || "Someone";

        toast.custom((t) => (
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

  // ── Comment notifications on MY sessions ────────────────────────────────────
  // Separate channel so it isn't torn down every time the friends list changes.
  useEffect(() => {
    if (!isConfigured || !profile) return;

    const channel = supabase.channel(`my-session-comments-${profile.id}`);

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "session_comments",
      },
      async (payload: { new: { id: string; session_id: string; author_id: string; body: string } }) => {
        const { session_id, author_id, body } = payload.new;

        // Ignore comments posted by the current user themselves.
        if (author_id === profile.id) return;

        // Only notify if this comment is on one of MY study sessions.
        const { data: session } = await supabase
          .from("study_sessions")
          .select("id")
          .eq("id", session_id)
          .eq("user_id", profile.id)
          .maybeSingle();

        if (!session) return;

        const { data: authorProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", author_id)
          .single();

        const authorName = authorProfile?.full_name || authorProfile?.email || "Someone";
        const preview = body.length > 60 ? `${body.slice(0, 60)}…` : body;

        toast.info(`💬 ${authorName}: "${preview}"`);
      },
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isConfigured, profile, supabase]);
}
