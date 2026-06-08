"use client";

import { Minimize2, Pause, Play, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useTimer } from "@/hooks/useTimer";
import { formatClock, formatDurationCompact } from "@/lib/timer";
import { cn } from "@/lib/utils";
import { useTimerStore } from "@/stores/useTimerStore";
import { Button } from "@/components/ui/button";

export function TimerFullscreen() {
  const { resumeTimer, pauseTimer } = useTimer();
  const isFullscreen = useTimerStore((state) => state.isFullscreen);
  const setFullscreen = useTimerStore((state) => state.setFullscreen);
  const status = useTimerStore((state) => state.status);
  const currentElapsedSeconds = useTimerStore((state) => state.currentElapsedSeconds);
  const todayTotalSeconds = useTimerStore((state) => state.todayTotalSeconds);
  const activeSegmentId = useTimerStore((state) => state.activeSegmentId);
  const segments = useTimerStore((state) => state.segments);
  const [isRotated, setRotated] = useState(false);

  const activeSegment = segments.find((s) => s.id === activeSegmentId);
  const subjectName = activeSegment?.subject_name ?? "General";
  const isRunning = status === "running";

  // Reset rotation when exiting fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setRotated(false);
    }
  }, [isFullscreen]);

  // Request browser native fullscreen if available
  useEffect(() => {
    if (isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignore if blocked
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Ignore
        });
      }
    }
  }, [isFullscreen]);

  // Handle escape key to exit fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, setFullscreen]);

  if (!isFullscreen) return null;

  const handleToggle = () => {
    if (status === "running") {
      void pauseTimer({ showSubjectModal: true });
    } else {
      void resumeTimer();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[99999] bg-[#06060a] text-foreground"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
      >
        {/* Pulsing background effect when running */}
        {isRunning && (
          <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.08, 0.15, 0.08],
              }}
              className="h-[600px] w-[600px] rounded-full bg-violet-500/20 blur-3xl"
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        )}

        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-between p-8 transition-all duration-300",
            isRotated && "origin-center"
          )}
          style={
            isRotated
              ? {
                  width: "100vh",
                  height: "100vw",
                  position: "fixed",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%) rotate(90deg)",
                }
              : undefined
          }
        >
          {/* Top bar */}
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Focus Mode</span>
              <span className="text-lg font-semibold text-violet-300">{subjectName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="lg:hidden"
                onClick={() => setRotated(!isRotated)}
                size="icon"
                variant="ghost"
                title="Rotate Screen"
              >
                <RotateCw className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Rotate Screen</span>
              </Button>
              <Button
                onClick={() => setFullscreen(false)}
                size="icon"
                variant="ghost"
              >
                <Minimize2 className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">Exit Fullscreen</span>
              </Button>
            </div>
          </div>

          {/* Central Display */}
          <div className="flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: isRunning ? 1.05 : 1 }}
              className="timer-digits font-mono text-8xl font-bold tracking-tighter sm:text-[12rem] md:text-[16rem]"
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              {formatClock(currentElapsedSeconds)}
            </motion.div>
            <div className="mt-4 flex flex-col items-center gap-1">
              <p className={cn("text-lg font-medium", isRunning ? "text-emerald-400" : "text-muted-foreground")}>
                {isRunning ? "Focusing..." : status === "paused" ? "Paused" : "Ready"}
              </p>
              <p className="text-sm text-muted-foreground">Today: {formatDurationCompact(todayTotalSeconds)}</p>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex w-full max-w-xs flex-col items-center pb-8">
            <Button
              className={cn(
                "w-full py-8 text-xl font-bold transition-all duration-300 rounded-2xl shadow-lg",
                isRunning ? "shadow-red-500/10 hover:shadow-red-500/20" : "shadow-emerald-500/10 hover:shadow-emerald-500/20"
              )}
              onClick={handleToggle}
              size="lg"
              variant={isRunning ? "destructive" : "success"}
            >
              {isRunning ? (
                <Pause className="mr-3 h-6 w-6" />
              ) : (
                <Play className="mr-3 h-6 w-6" />
              )}
              {isRunning ? "Pause" : status === "paused" ? "Resume" : "Start"}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
