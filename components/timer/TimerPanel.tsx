"use client";

import { Loader2, Maximize2, Pause, Play, PictureInPicture2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

import { useTimer } from "@/hooks/useTimer";
import { formatClock, formatDurationCompact } from "@/lib/timer";
import { useTimerStore } from "@/stores/useTimerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SoundBoard } from "@/components/sounds/SoundBoard";

export function TimerPanel() {
  const { resumeTimer, pauseTimer } = useTimer();
  const status = useTimerStore((state) => state.status);
  const currentElapsedSeconds = useTimerStore((state) => state.currentElapsedSeconds);
  const todayTotalSeconds = useTimerStore((state) => state.todayTotalSeconds);
  const setPopupOpen = useTimerStore((state) => state.setPopupOpen);
  const setPipWindow = useTimerStore((state) => state.setPipWindow);
  const setFullscreen = useTimerStore((state) => state.setFullscreen);
  const isRunning = status === "running";

  // Local debounce guard: prevents double-clicks from firing concurrent DB calls.
  const [isSubmitting, setSubmitting] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isSubmitting) return;
    setSubmitting(true);
    try {
      if (status === "running") {
        await pauseTimer({ showSubjectModal: true });
      } else {
        await resumeTimer();
      }
    } finally {
      setSubmitting(false);
    }
  }, [isSubmitting, pauseTimer, resumeTimer, status]);

  const handlePopOut = async () => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      try {
        const pip = await (window as Window & { documentPictureInPicture: { requestWindow: (opts: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture.requestWindow({
          width: 320,
          height: 220,
        });
        setPipWindow(pip);
        setPopupOpen(true);
      } catch {
        setPopupOpen(true);
      }
    } else {
      setPopupOpen(true);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Timer</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Today: {formatDurationCompact(todayTotalSeconds)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isRunning ? "success" : "secondary"}>{isRunning ? "Running" : status === "paused" ? "Paused" : "Idle"}</Badge>

          {/* Ambient sound board — the Headphones button lives inside SoundBoard */}
          <SoundBoard />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => void handlePopOut()} size="icon" variant="outline" title="Pop out timer">
                <PictureInPicture2 className="h-4 w-4" />
                <span className="sr-only">Pop out timer</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pop out timer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setFullscreen(true)} size="icon" variant="outline" title="Fullscreen focus mode">
                <Maximize2 className="h-4 w-4" />
                <span className="sr-only">Fullscreen focus mode</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen focus mode</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <motion.div
          animate={{ scale: isRunning ? 1.02 : 1 }}
          className="rounded-2xl border border-border bg-[#0d0d15] px-4 py-8 text-center"
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
        >
          <div className="timer-digits font-mono text-5xl font-semibold sm:text-6xl">
            {formatClock(currentElapsedSeconds)}
          </div>
        </motion.div>
        <div className="w-full">
          <Button
            className={cn(
              "w-full py-6 text-lg font-semibold transition-all duration-300",
              status === "running" ? "animate-pulse-glow" : "",
            )}
            disabled={isSubmitting}
            onClick={() => void handleToggle()}
            size="lg"
            variant={status === "running" ? "destructive" : "success"}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : status === "running" ? (
              <Pause className="mr-2 h-5 w-5" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {isSubmitting
              ? status === "running"
                ? "Pausing..."
                : status === "paused"
                  ? "Resuming..."
                  : "Starting..."
              : status === "running"
                ? "Pause"
                : status === "paused"
                  ? "Resume"
                  : "Start"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
