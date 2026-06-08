import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";

import { UserAvatar } from "@/components/avatar/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDurationCompact } from "@/lib/timer";
import type { FriendSummary } from "@/stores/useFriendStore";

type FriendCardProps = {
  friend: FriendSummary;
};

export function FriendCard({ friend }: FriendCardProps) {
  const lastSeen = friend.lastActivityAt
    ? `${formatDistanceToNowStrict(new Date(friend.lastActivityAt), { addSuffix: true })}`
    : "No activity today";

  return (
    <Link href={`/friends/${friend.profile.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-violet-400/50">
        <CardContent className="grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar profile={friend.profile} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{friend.profile.full_name || friend.profile.email}</p>
                <p className="truncate text-xs text-muted-foreground">{lastSeen}</p>
              </div>
            </div>
            <Badge variant={friend.isRunning ? "success" : "secondary"}>{friend.isRunning ? "Live" : "Idle"}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Study Time</p>
              <p className="mt-1 font-mono font-semibold">{formatDurationCompact(friend.totalStudySeconds)}</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Done</p>
              <p className="mt-1 font-mono font-semibold">{friend.completedTodoCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
