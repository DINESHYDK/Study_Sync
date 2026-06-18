"use client";

import { Check, Link2, Pencil, Sliders } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useTimer } from "@/hooks/useTimer";
import { formatDurationCompact, formatTimeRange, segmentDurationSecs, totalDurationSecs } from "@/lib/timer";
import { cn } from "@/lib/utils";
import { useTimerStore, type TimerSegment } from "@/stores/useTimerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EditSegmentModal } from "@/components/timer/EditSegmentModal";

type SessionSegmentListProps = {
  segments: TimerSegment[];
  readOnly?: boolean;
  title?: string;
  onRefresh?: () => void;
};

function EditableSubject({
  segment,
  readOnly,
}: {
  segment: TimerSegment;
  readOnly: boolean;
}) {
  const { updateSegmentSubject } = useTimer();
  const [isEditing, setEditing] = useState(false);
  const [value, setValue] = useState(segment.subject_name);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateSegmentSubject(segment.id, value);
    setEditing(false);
  }

  if (readOnly || segment.ended_at === null) {
    return <span className="block min-w-0 max-w-full truncate font-medium text-foreground">{segment.subject_name}</span>;
  }

  if (isEditing) {
    return (
      <form className="flex min-w-0 items-center gap-2" onSubmit={handleSubmit}>
        <Input className="h-8 max-w-44" onChange={(event) => setValue(event.target.value)} value={value} />
        <Button size="icon-sm" type="submit" variant="ghost">
          <Check className="h-4 w-4" />
          <span className="sr-only">Save subject</span>
        </Button>
      </form>
    );
  }

  return (
    <button
      className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg text-left font-medium text-foreground hover:text-[#6c63ff]"
      onClick={() => setEditing(true)}
      type="button"
    >
      <span className="truncate">{segment.subject_name}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

// ── Batch-fetches todo text for any linked_todo_ids in the visible segments.
function useTodoTexts(segments: TimerSegment[]): Record<string, string> {
  const { supabase, isConfigured } = useSupabase();
  const [textMap, setTextMap] = useState<Record<string, string>>({});

  const linkedIds = segments
    .map((s) => s.linked_todo_id)
    .filter((id): id is string => id !== null && id !== undefined);

  const idsKey = linkedIds.sort().join(",");

  const fetchTexts = useCallback(
    async (ids: string[]) => {
      if (!isConfigured || ids.length === 0) return;

      const { data } = await supabase
        .from("todos")
        .select("id, text")
        .in("id", ids);

      if (data) {
        const map: Record<string, string> = {};
        for (const row of data) map[row.id] = row.text;
        setTextMap((prev) => ({ ...prev, ...map }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConfigured, idsKey, supabase],
  );

  useEffect(() => {
    void fetchTexts(linkedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, fetchTexts]);

  return textMap;
}

export function SessionSegmentList({
  segments,
  readOnly = false,
  title = "Session History",
  onRefresh,
}: SessionSegmentListProps) {
  const isHydrated = useTimerStore((state) => state.isHydrated);
  const total = totalDurationSecs(segments);
  // Resolve linked todo labels for display (batched single query).
  const todoTexts = useTodoTexts(segments);

  const [selectedSegment, setSelectedSegment] = useState<TimerSegment | null>(null);
  const [openEdit, setOpenEdit] = useState(false);

  if (!isHydrated && !readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/50 rounded-xl border border-border" />
          <div className="h-10 bg-secondary/50 rounded-xl border border-border" />
          <div className="h-10 bg-secondary/50 rounded-xl border border-border" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        {segments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No study segments logged for this date.
          </div>
        ) : (
          <div className="min-w-0 text-sm">
            <div className="hidden grid-cols-[minmax(0,1.05fr)_minmax(7.5rem,0.95fr)_minmax(5rem,auto)_2.5rem] gap-3 border-b border-border pb-3 text-xs font-semibold uppercase text-muted-foreground sm:grid">
              <div>Subject Name</div>
              <div>Time Range</div>
              <div className="text-right">Duration</div>
              <div className="text-right"></div>
            </div>
            <div className="grid min-w-0">
              {segments.map((segment) => {
                const running = segment.ended_at === null;

                return (
                  <div
                    className="grid min-w-0 gap-2 border-b border-border/70 py-3 last:border-0 sm:grid-cols-[minmax(0,1.05fr)_minmax(7.5rem,0.95fr)_minmax(5rem,auto)_2.5rem] sm:gap-3 sm:items-center"
                    key={segment.id}
                  >
                    <div className="min-w-0">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground sm:hidden">
                        Subject
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        {running ? <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-400" /> : null}
                        <EditableSubject readOnly={readOnly} segment={segment} />
                      </div>
                      {/* Linked task chip */}
                      {segment.linked_todo_id ? (
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {todoTexts[segment.linked_todo_id] ?? "Linked task"}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 text-muted-foreground">
                      <span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground sm:hidden">
                        Time
                      </span>
                      <span className="block truncate">{formatTimeRange(segment.started_at, segment.ended_at)}</span>
                    </div>
                    <div className={cn("font-mono sm:text-right", running ? "text-emerald-200" : "text-foreground")}>
                      <span className="mb-1 block font-body text-[10px] font-semibold uppercase text-muted-foreground sm:hidden">
                        Duration
                      </span>
                      <span className="whitespace-nowrap">{running ? "Running" : formatDurationCompact(segmentDurationSecs(segment))}</span>
                    </div>
                    <div className="flex justify-end">
                      {!readOnly && !running ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSegment(segment);
                            setOpenEdit(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#6c63ff]/10"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit segment</span>
                        </Button>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 pt-4 text-sm">
              <span className="text-right font-semibold text-muted-foreground">Total:</span>
              <span className="whitespace-nowrap text-right font-mono font-semibold">{formatDurationCompact(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
      <EditSegmentModal
        segment={selectedSegment}
        open={openEdit}
        onOpenChange={setOpenEdit}
        onRefresh={onRefresh}
      />
    </Card>
  );
}
