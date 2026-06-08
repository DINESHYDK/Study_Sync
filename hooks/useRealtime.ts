"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useFriends } from "@/hooks/useFriends";
import { useFriendStore } from "@/stores/useFriendStore";
import { useUserStore } from "@/stores/useUserStore";

export function useRealtime() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const friends = useFriendStore((state) => state.friends);
  const { loadFriends, loadIncomingRequests } = useFriends();

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
      () => {
        toast.info("Someone sent you a friend request.");
        void loadIncomingRequests();
      },
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [friends, isConfigured, loadFriends, loadIncomingRequests, profile, supabase]);
}
