"use client";

import { Grip, Pause, Play, X } from "lucide-react";
import { PointerEvent, useRef } from "react";

import { useTimer } from "@/hooks/useTimer";
import { formatClock, formatDurationCompact } from "@/lib/timer";
import { cn } from "@/lib/utils";
import { useTimerStore, type TimerPopupState } from "@/stores/useTimerStore";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function clampPopupState(state: TimerPopupState): TimerPopupState {
  return {
    x: Math.max(8, state.x),
    y: Math.max(8, state.y),
    width: Math.min(400, Math.max(200, state.width)),
    height: Math.min(300, Math.max(160, state.height)),
  };
}

export function TimerPopup() {
  const { resumeTimer, pauseTimer } = useTimer();
  const isPopupOpen = useTimerStore((state) => state.isPopupOpen);
  const setPopupOpen = useTimerStore((state) => state.setPopupOpen);
  const popupState = useTimerStore((state) => state.popupState);
  const setPopupState = useTimerStore((state) => state.setPopupState);
  const status = useTimerStore((state) => state.status);
  const currentElapsedSeconds = useTimerStore((state) => state.currentElapsedSeconds);
  const todayTotalSeconds = useTimerStore((state) => state.todayTotalSeconds);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startState: TimerPopupState;
    mode: "move" | "resize";
  } | null>(null);
  const isRunning = status === "running";

  function handlePointerDown(event: PointerEvent<HTMLDivElement>, mode: "move" | "resize") {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startState: popupState,
      mode,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;

    if (drag.mode === "move") {
      setPopupState(
        clampPopupState({
          ...drag.startState,
          x: drag.startState.x - deltaX,
          y: drag.startState.y - deltaY,
        }),
      );
      return;
    }

    setPopupState(
      clampPopupState({
        ...drag.startState,
        width: drag.startState.width + deltaX,
        height: drag.startState.height + deltaY,
      }),
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  if (!isPopupOpen) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-glow"
      style={{
        bottom: popupState.y,
        right: popupState.x,
        height: popupState.height,
        width: popupState.width,
      }}
    >
      <div
        className="flex cursor-move items-center justify-between border-b border-border bg-secondary/60 px-3 py-2"
        onPointerDown={(event) => handlePointerDown(event, "move")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Grip className="h-4 w-4 text-muted-foreground" />
          Timer
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => setPopupOpen(false)} size="icon-sm" variant="ghost">
              <X className="h-4 w-4" />
              <span className="sr-only">Close timer popup</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close popup</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="timer-digits font-mono text-3xl font-semibold">{formatClock(currentElapsedSeconds)}</div>
          <p className={cn("mt-1 text-sm", isRunning ? "text-emerald-200" : "text-muted-foreground")}>
            {isRunning ? "Running" : status === "paused" ? "Paused" : "Idle"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Today: {formatDurationCompact(todayTotalSeconds)}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <Button disabled={isRunning} onClick={() => void resumeTimer()} size="sm" variant="success">
            <Play className="h-4 w-4" />
            Resume
          </Button>
          <Button disabled={!isRunning} onClick={() => void pauseTimer({ showSubjectModal: true })} size="sm" variant="destructive">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        </div>
      </div>

      <div
        className="absolute bottom-1 right-1 h-5 w-5 cursor-nwse-resize rounded-md text-muted-foreground"
        onPointerDown={(event) => handlePointerDown(event, "resize")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Resize timer popup"
      >
        <Grip className="h-4 w-4 rotate-45" />
      </div>
    </div>
  );
}
