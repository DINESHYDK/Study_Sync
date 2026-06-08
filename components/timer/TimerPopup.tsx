"use client";

import { Grip, Pause, Play, X } from "lucide-react";
import { PointerEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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

interface TimerPopupContentProps {
  isPip: boolean;
  currentElapsedSeconds: number;
  isRunning: boolean;
  status: string;
  todayTotalSeconds: number;
  resumeTimer: () => void;
  pauseTimer: (options?: { showSubjectModal?: boolean }) => void;
  setPopupOpen: (isOpen: boolean) => void;
}

function TimerPopupContent({
  isPip,
  currentElapsedSeconds,
  isRunning,
  status,
  todayTotalSeconds,
  resumeTimer,
  pauseTimer,
}: TimerPopupContentProps) {
  return (
    <div className={cn("flex flex-1 flex-col justify-between p-4", isPip && "bg-card text-card-foreground h-full")}>
      <div>
        <div className="timer-digits font-mono text-3xl font-semibold">{formatClock(currentElapsedSeconds)}</div>
        <p className={cn("mt-1 text-sm font-medium", isRunning ? "text-emerald-400" : "text-muted-foreground")}>
          {isRunning ? "Running" : status === "paused" ? "Paused" : "Idle"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Today: {formatDurationCompact(todayTotalSeconds)}</p>
      </div>

      <div className="mt-3">
        <Button
          className="w-full font-medium"
          onClick={() => {
            if (status === "running") {
              void pauseTimer({ showSubjectModal: true });
            } else {
              void resumeTimer();
            }
          }}
          size="sm"
          variant={status === "running" ? "destructive" : "success"}
        >
          {status === "running" ? (
            <Pause className="mr-1.5 h-4 w-4" />
          ) : (
            <Play className="mr-1.5 h-4 w-4" />
          )}
          {status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start"}
        </Button>
      </div>
    </div>
  );
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
  const pipWindow = useTimerStore((state) => state.pipWindow);
  const setPipWindow = useTimerStore((state) => state.setPipWindow);

  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startState: TimerPopupState;
    mode: "move" | "resize";
  } | null>(null);

  const isRunning = status === "running";

  useEffect(() => {
    if (!isPopupOpen || !pipWindow) {
      if (pipWindow) {
        try {
          pipWindow.close();
        } catch {}
        setPipWindow(null);
      }
      return;
    }

    const copyStyles = () => {
      const doc = pipWindow.document;

      // Copy all stylesheets
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          if (styleSheet.cssRules) {
            const newStyleEl = doc.createElement("style");
            Array.from(styleSheet.cssRules).forEach((rule) => {
              newStyleEl.appendChild(doc.createTextNode(rule.cssText));
            });
            doc.head.appendChild(newStyleEl);
          } else if (styleSheet.href) {
            const newLinkEl = doc.createElement("link");
            newLinkEl.rel = "stylesheet";
            newLinkEl.href = styleSheet.href;
            doc.head.appendChild(newLinkEl);
          }
        } catch (e) {
          if (styleSheet.href) {
            const newLinkEl = doc.createElement("link");
            newLinkEl.rel = "stylesheet";
            newLinkEl.href = styleSheet.href;
            doc.head.appendChild(newLinkEl);
          }
        }
      });

      // Copy body/html classes and styling
      doc.documentElement.className = document.documentElement.className;
      doc.body.className = document.body.className;
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";
      doc.body.style.overflow = "hidden";
      doc.body.style.height = "100vh";
      doc.body.style.display = "flex";
      doc.body.style.flexDirection = "column";
    };

    copyStyles();

    const handlePageHide = () => {
      setPopupOpen(false);
      setPipWindow(null);
    };

    pipWindow.addEventListener("pagehide", handlePageHide);

    return () => {
      pipWindow.removeEventListener("pagehide", handlePageHide);
      try {
        pipWindow.close();
      } catch {}
    };
  }, [isPopupOpen, pipWindow, setPopupOpen, setPipWindow]);

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

  // If PiP is active, render inside the portal
  if (pipWindow) {
    return createPortal(
      <TimerPopupContent
        isPip={true}
        currentElapsedSeconds={currentElapsedSeconds}
        isRunning={isRunning}
        status={status}
        todayTotalSeconds={todayTotalSeconds}
        resumeTimer={resumeTimer}
        pauseTimer={pauseTimer}
        setPopupOpen={setPopupOpen}
      />,
      pipWindow.document.body
    );
  }

  // Fallback: render draggable, resizable browser overlay
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

      <TimerPopupContent
        isPip={false}
        currentElapsedSeconds={currentElapsedSeconds}
        isRunning={isRunning}
        status={status}
        todayTotalSeconds={todayTotalSeconds}
        resumeTimer={resumeTimer}
        pauseTimer={pauseTimer}
        setPopupOpen={setPopupOpen}
      />

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
