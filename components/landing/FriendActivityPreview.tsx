import { Card } from "@/components/ui/card";

const friends = [
  { name: "Maya", initials: "M", status: "Running", total: "4h 08m" },
  { name: "Arjun", initials: "A", status: "Paused", total: "3h 41m" },
  { name: "Ira", initials: "I", status: "Running", total: "2h 57m" },
] as const;

export function FriendActivityPreview() {
  return (
    <Card className="border-[var(--border-strong)] bg-[var(--surface)] p-4">
      <p className="font-heading text-lg font-semibold">Live Crew</p>
      <div className="mt-4 grid gap-3">
        {friends.map((friend) => (
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface-strong)] p-3" key={friend.name}>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-heading text-xs font-semibold text-foreground">
                {friend.initials}
              </span>
              <div>
                <p className="text-sm font-semibold">{friend.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{friend.status}</p>
              </div>
            </div>
            <span className="font-mono text-sm">{friend.total}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
