"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { normalizeReferralCode, todayLocalDate } from "@/lib/utils";
import { useFriendStore, type FriendProfile, type FriendSummary, type IncomingFriendRequest } from "@/stores/useFriendStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Tables } from "@/types/database";

function sumDurations(segments: Tables<"session_segments">[]) {
  return segments.reduce((total, segment) => total + (segment.duration_secs ?? 0), 0);
}

export function useFriends() {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const setFriends = useFriendStore((state) => state.setFriends);
  const setIncomingRequests = useFriendStore((state) => state.setIncomingRequests);
  const setPendingRequestCount = useUserStore((state) => state.setPendingRequestCount);
  const setLoading = useFriendStore((state) => state.setLoading);

  const loadIncomingRequests = useCallback(async () => {
    if (!profile || !isConfigured) {
      setIncomingRequests([]);
      setPendingRequestCount(0);
      return;
    }

    const { data, error } = await supabase
      .from("friend_requests")
      .select("*, requester:profiles!friend_requests_requester_id_fkey(*)")
      .eq("requested_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    const requests = (data ?? []).map((request) => ({
      ...request,
      requester: request.requester ?? null,
    })) satisfies IncomingFriendRequest[];

    setIncomingRequests(requests);
    setPendingRequestCount(requests.length);
  }, [isConfigured, profile, setIncomingRequests, setPendingRequestCount, supabase]);

  const loadFriends = useCallback(async () => {
    if (!profile || !isConfigured) {
      setFriends([]);
      return;
    }

    setLoading(true);

    const { data: friendships, error: friendshipError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`);

    if (friendshipError) {
      toast.error(friendshipError.message);
      setLoading(false);
      return;
    }

    const friendIds = (friendships ?? []).map((friendship) =>
      friendship.user_a === profile.id ? friendship.user_b : friendship.user_a,
    );

    if (friendIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const today = todayLocalDate();
    const [{ data: profiles, error: profilesError }, { data: sessions, error: sessionsError }, { data: todos, error: todosError }] =
      await Promise.all([
        supabase.from("profiles").select("*").in("id", friendIds),
        supabase.from("study_sessions").select("id,user_id").in("user_id", friendIds).eq("date", today),
        supabase.from("todos").select("*").in("user_id", friendIds).eq("date", today),
      ]);

    if (profilesError || sessionsError || todosError) {
      toast.error(profilesError?.message ?? sessionsError?.message ?? todosError?.message ?? "Could not load friends.");
      setLoading(false);
      return;
    }

    const sessionIds = (sessions ?? []).map((session) => session.id);
    const { data: segments, error: segmentsError } =
      sessionIds.length > 0
        ? await supabase.from("session_segments").select("*").in("session_id", sessionIds)
        : { data: [], error: null };

    if (segmentsError) {
      toast.error(segmentsError.message);
      setLoading(false);
      return;
    }

    const summaries: FriendSummary[] = (profiles ?? []).map((friendProfile: FriendProfile) => {
      const friendSessions = (sessions ?? []).filter((session) => session.user_id === friendProfile.id);
      const friendSessionIds = new Set(friendSessions.map((session) => session.id));
      const friendSegments = (segments ?? []).filter((segment) => friendSessionIds.has(segment.session_id));
      const friendTodos = (todos ?? []).filter((todo) => todo.user_id === friendProfile.id);
      const activeSegment = friendSegments.find((segment) => segment.ended_at === null);
      const lastActivity = friendSegments
        .map((segment) => segment.ended_at ?? segment.started_at)
        .sort()
        .at(-1);

      return {
        profile: friendProfile,
        totalStudySeconds: sumDurations(friendSegments),
        completedTodoCount: friendTodos.filter((todo) => todo.is_completed).length,
        isRunning: Boolean(activeSegment),
        lastActivityAt: lastActivity ?? null,
      };
    });

    setFriends(summaries);
    setLoading(false);
  }, [isConfigured, profile, setFriends, setLoading, supabase]);

  const addFriendByCode = useCallback(
    async (inputCode: string) => {
      if (!profile || !isConfigured) {
        return "Configure Supabase before sending friend requests.";
      }

      const referralCode = normalizeReferralCode(inputCode);

      if (!referralCode) {
        return "Enter a referral code.";
      }

      const { data: targetProfile, error: targetError } = await supabase
        .from("profiles")
        .select("*")
        .eq("referral_code", referralCode)
        .maybeSingle();

      if (targetError) {
        return targetError.message;
      }

      if (!targetProfile) {
        return "Invalid code.";
      }

      if (targetProfile.id === profile.id) {
        return "You can't add yourself.";
      }

      const lowerFirst = profile.id < targetProfile.id ? profile.id : targetProfile.id;
      const higherSecond = profile.id < targetProfile.id ? targetProfile.id : profile.id;
      const { data: existingFriendship, error: friendshipError } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_a", lowerFirst)
        .eq("user_b", higherSecond)
        .maybeSingle();

      if (friendshipError) {
        return friendshipError.message;
      }

      if (existingFriendship) {
        return "Already friends.";
      }

      const { data: existingRequest, error: requestLookupError } = await supabase
        .from("friend_requests")
        .select("id,status")
        .or(
          `and(requester_id.eq.${profile.id},requested_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},requested_id.eq.${profile.id})`,
        )
        .neq("status", "rejected")
        .maybeSingle();

      if (requestLookupError) {
        return requestLookupError.message;
      }

      if (existingRequest) {
        return existingRequest.status === "pending" ? "Request already sent." : "Friend request already handled.";
      }

      const { error: insertError } = await supabase.from("friend_requests").insert({
        requester_id: profile.id,
        requested_id: targetProfile.id,
      });

      if (insertError) {
        return insertError.message;
      }

      toast.success("Friend request sent!");
      return null;
    },
    [isConfigured, profile, supabase],
  );

  const acceptRequest = useCallback(
    async (requestId: string) => {
      if (!isConfigured) {
        return;
      }

      const { error } = await supabase.rpc("accept_friend_request", { request_id: requestId });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Friend request accepted.");
      await Promise.all([loadIncomingRequests(), loadFriends()]);
    },
    [isConfigured, loadFriends, loadIncomingRequests, supabase],
  );

  const declineRequest = useCallback(
    async (requestId: string) => {
      if (!isConfigured) {
        return;
      }

      const { error } = await supabase.from("friend_requests").update({ status: "rejected" }).eq("id", requestId);

      if (error) {
        toast.error(error.message);
        return;
      }

      await loadIncomingRequests();
    },
    [isConfigured, loadIncomingRequests, supabase],
  );

  return {
    loadFriends,
    loadIncomingRequests,
    addFriendByCode,
    acceptRequest,
    declineRequest,
  };
}
