"use client";

import { Maximize2, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { useTimer } from "@/hooks/useTimer";
import { formatClock, formatDurationCompact } from "@/lib/timer";
import { useTimerStore } from "@/stores/useTimerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TimerPanel() {
  const { resumeTimer, pauseTimer } = useTimer();
  const status = useTimerStore((state) => state.status);
  const currentElapsedSeconds = useTimerStore((state) => state.currentElapsedSeconds);
  const todayTotalSeconds = useTimerStore((state) => state.todayTotalSeconds);
  const setPopupOpen = useTimerStore((state) => state.setPopupOpen);
  const setPipWindow = useTimerStore((state) => state.setPipWindow);
  const isRunning = status === "running";

  const handlePopOut = async () => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 220,
        });
        setPipWindow(pip);
        setPopupOpen(true);
      } catch (err) {
        console.error("Failed to open PiP window, falling back to overlay", err);
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handlePopOut} size="icon" variant="outline">
                <Maximize2 className="h-4 w-4" />
                <span className="sr-only">Open timer popup</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pop out timer</TooltipContent>
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
              status === "running" ? "animate-pulse-glow" : ""
            )}
            onClick={() => {
              if (status === "running") {
                void pauseTimer({ showSubjectModal: true });
              } else {
                void resumeTimer();
              }
            }}
            size="lg"
            variant={status === "running" ? "destructive" : "success"}
          >
            {status === "running" ? (
              <Pause className="mr-2 h-5 w-5" />
            ) : (
              <Play className="mr-2 h-5 w-5" />
            )}
            {status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
