"use client";

import { AddFriendDialog } from "@/components/friends/AddFriendDialog";
import { FriendCard } from "@/components/friends/FriendCard";
import { Card, CardContent } from "@/components/ui/card";
import { useFriendStore } from "@/stores/useFriendStore";

export default function FriendsPage() {
  const friends = useFriendStore((state) => state.friends);
  const incomingRequests = useFriendStore((state) => state.incomingRequests);
  const isLoading = useFriendStore((state) => state.isLoading);

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-normal">Your Study Group</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {incomingRequests.length > 0
              ? `${incomingRequests.length} pending request${incomingRequests.length === 1 ? "" : "s"} waiting in Settings.`
              : "Live study totals and tasks from your friends."}
          </p>
        </div>
        <AddFriendDialog />
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 animate-pulse">
          <div className="h-44 bg-secondary/50 rounded-2xl border border-border" />
          <div className="h-44 bg-secondary/50 rounded-2xl border border-border" />
          <div className="h-44 bg-secondary/50 rounded-2xl border border-border" />
        </div>
      ) : friends.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">
            No friends yet. Share your referral code from Settings.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {friends.map((friend) => (
            <FriendCard friend={friend} key={friend.profile.id} />
          ))}
        </div>
      )}
    </div>
  );
}
