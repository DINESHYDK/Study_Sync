"use client";

import { Check, Pencil } from "lucide-react";
import { FormEvent, useState } from "react";

import { useTimer } from "@/hooks/useTimer";
import { formatDurationCompact, formatTimeRange, segmentDurationSecs, totalDurationSecs } from "@/lib/timer";
import { cn } from "@/lib/utils";
import type { TimerSegment } from "@/stores/useTimerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SessionSegmentListProps = {
  segments: TimerSegment[];
  readOnly?: boolean;
  title?: string;
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
    return <span className="font-medium text-foreground">{segment.subject_name}</span>;
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
      className="inline-flex max-w-full items-center gap-2 rounded-lg text-left font-medium text-foreground hover:text-[#6c63ff]"
      onClick={() => setEditing(true)}
      type="button"
    >
      <span className="truncate">{segment.subject_name}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function SessionSegmentList({ segments, readOnly = false, title = "Session History" }: SessionSegmentListProps) {
  const total = totalDurationSecs(segments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {segments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No study segments logged for this date.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-subtle">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 font-semibold">Subject Name</th>
                  <th className="pb-3 pr-4 font-semibold">Time Range</th>
                  <th className="pb-3 text-right font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => {
                  const running = segment.ended_at === null;

                  return (
                    <tr className="border-b border-border/70 last:border-0" key={segment.id}>
                      <td className="py-3 pr-4">
                        <div className="flex min-w-0 items-center gap-2">
                          {running ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" /> : null}
                          <EditableSubject readOnly={readOnly} segment={segment} />
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatTimeRange(segment.started_at, segment.ended_at)}</td>
                      <td className={cn("py-3 text-right font-mono", running ? "text-emerald-200" : "text-foreground")}>
                        {running ? "Running" : formatDurationCompact(segmentDurationSecs(segment))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4" />
                  <td className="pt-4 text-right text-sm font-semibold text-muted-foreground">Total:</td>
                  <td className="pt-4 text-right font-mono font-semibold">{formatDurationCompact(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
