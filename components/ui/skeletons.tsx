import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ─── Reusable atoms ────────────────────────────────────────────────────────────

function SkeletonCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      {children}
    </Card>
  );
}

// ─── Dashboard skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      {/* Greeting header */}
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-56" />
      </header>

      {/* Timer panel */}
      <SkeletonCard>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </SkeletonCard>

      {/* Session segment list */}
      <SkeletonCard>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="hidden grid-cols-3 gap-3 border-b border-border pb-3 sm:grid">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="ml-auto h-3 w-14" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="grid gap-2 border-b border-border/70 py-3 last:border-0 sm:grid-cols-3 sm:gap-3 sm:items-center"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12 sm:ml-auto" />
            </div>
          ))}
        </CardContent>
      </SkeletonCard>

      {/* Todo list */}
      <SkeletonCard>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
          <ul className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
                <Skeleton className="h-4 flex-1" style={{ width: `${60 + i * 10}%` }} />
              </li>
            ))}
          </ul>
        </CardContent>
      </SkeletonCard>

      {/* Friends activity strip */}
      <section className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        <div className="flex gap-4 overflow-x-hidden pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-80 shrink-0">
              <FriendCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Friend card skeleton ──────────────────────────────────────────────────────

function FriendCardSkeleton() {
  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Friends page list skeleton ────────────────────────────────────────────────

function FriendsPageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <FriendCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Comparison page skeleton ──────────────────────────────────────────────────

function ComparisonSkeleton() {
  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-20" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
      </div>
      {/* Winner banner */}
      <Skeleton className="h-14 w-full rounded-2xl" />
      {/* Two comparison columns */}
      <div className="grid min-w-0 w-full gap-5 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card/20 p-5 space-y-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── History page skeleton ─────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      {/* Summary card */}
      <SkeletonCard>
        <CardContent className="p-5 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </CardContent>
      </SkeletonCard>
      {/* Segment list */}
      <SkeletonCard>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-2 border-b border-border/70 py-3 last:border-0 sm:grid-cols-3 sm:gap-3 sm:items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12 sm:ml-auto" />
            </div>
          ))}
        </CardContent>
      </SkeletonCard>
      {/* Todo list */}
      <SkeletonCard>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))}
          </ul>
        </CardContent>
      </SkeletonCard>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  DashboardSkeleton,
  FriendCardSkeleton,
  FriendsPageSkeleton,
  ComparisonSkeleton,
  HistorySkeleton,
};
