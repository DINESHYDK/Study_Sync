"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { AlertTriangle, Clock, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useTimer } from "@/hooks/useTimer";
import { useUserStore } from "@/stores/useUserStore";
import { type TimerSegment } from "@/stores/useTimerStore";
import { formatDurationCompact } from "@/lib/timer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type EditSegmentModalProps = {
  segment: TimerSegment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
};

export function EditSegmentModal({
  segment,
  open,
  onOpenChange,
  onRefresh,
}: EditSegmentModalProps) {
  const { updateSegmentDuration, deleteSegment } = useTimer();
  const profile = useUserStore((state) => state.profile);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");

  const originalSecs = segment?.duration_secs ?? 0;
  const originalHrs = Math.floor(originalSecs / 3600);
  const originalMins = Math.floor((originalSecs % 3600) / 60);

  // Reset inputs when segment changes
  useEffect(() => {
    if (segment) {
      setHours(originalHrs);
      setMinutes(originalMins);
      setShowConfirmDelete(false);
      setShowCelebration(false);
    }
  }, [segment, originalHrs, originalMins]);

  if (!segment) return null;

  const currentInputSecs = hours * 3600 + minutes * 60;
  const isDecreased = currentInputSecs < originalSecs && currentInputSecs > 0;

  async function handleSave() {
    if (!isDecreased || isSaving) return;

    setSaving(true);
    try {
      await updateSegmentDuration(segment!.id, currentInputSecs);
      
      // Setup celebration message
      setCelebrationMessage(
        `Thank you for your honesty, ${firstName}! Sincerity is the first step to true mastery. Keep up the high standards! 🚀`
      );
      setShowCelebration(true);
      
      // Trigger confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#2dd4bf", "#6c63ff", "#a855f7"],
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch {
      toast.error("Failed to update duration");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;

    setDeleting(true);
    try {
      await deleteSegment(segment!.id);
      
      setCelebrationMessage(
        `Honesty is the best study policy, ${firstName}! We've deleted that segment. Let's make your next study session count! 🎯`
      );
      setShowCelebration(true);

      // Trigger confetti!
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#2dd4bf", "#6c63ff"],
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch {
      toast.error("Failed to delete segment");
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    // Wait a brief moment to reset states so user doesn't see a flash of inputs
    setTimeout(() => {
      setShowCelebration(false);
      setShowConfirmDelete(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : undefined)}>
      <DialogContent className="max-w-md bg-[#0a0a0f] border-[#222230] text-foreground">
        {showCelebration ? (
          <div className="flex flex-col items-center text-center p-6 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-heading text-teal-100">
                Sincerity Celebrated!
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground mt-2">
                {celebrationMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="w-full mt-4">
              <Button onClick={handleClose} className="w-full bg-[#6c63ff] hover:bg-[#5b52e0] text-white">
                Keep Studying!
              </Button>
            </DialogFooter>
          </div>
        ) : showConfirmDelete ? (
          <div className="flex flex-col gap-4 p-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-heading">Delete Study Segment?</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Are you sure you want to delete this study segment for <strong className="text-foreground">"{segment.subject_name}"</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Segment"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-1">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-heading">Adjust Study Time</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Decrease the duration if you forgot to turn off the timer. Sincerity is key to true growth!
              </DialogDescription>
            </DialogHeader>

            <div className="my-3 rounded-2xl border border-[#222230] bg-[#12121a] p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Original Logged Duration</p>
              <p className="mt-1 font-mono text-2xl font-bold text-teal-400">
                {formatDurationCompact(originalSecs)}
              </p>
            </div>

            <div className="grid gap-4">
              {/* Hour & Minute Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="edit-hours" className="text-xs font-semibold uppercase text-muted-foreground">Hours</label>
                  <Input
                    id="edit-hours"
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    disabled={isSaving}
                    className="bg-card/40 border-[#222230] text-center font-mono text-lg"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="edit-minutes" className="text-xs font-semibold uppercase text-muted-foreground">Minutes</label>
                  <Input
                    id="edit-minutes"
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    disabled={isSaving}
                    className="bg-card/40 border-[#222230] text-center font-mono text-lg"
                  />
                </div>
              </div>

              {/* Validation/Feedback Box */}
              {currentInputSecs > originalSecs && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>You can only decrease the duration, not increase it to study longer.</p>
                </div>
              )}

              {currentInputSecs === originalSecs && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card/20 p-3 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <p>No changes made. Adjust inputs down to decrease the duration.</p>
                </div>
              )}

              {isDecreased && (
                <div className="flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-xs text-teal-300">
                  <Sparkles className="h-4 w-4 shrink-0 text-teal-400" />
                  <p>
                    New duration: <strong>{formatDurationCompact(currentInputSecs)}</strong> (Decreased by {formatDurationCompact(originalSecs - currentInputSecs)}).
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
              {/* Delete button on the left */}
              <Button
                variant="ghost"
                type="button"
                disabled={isSaving}
                onClick={() => setShowConfirmDelete(true)}
                className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 flex gap-2 items-center px-3"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>

              <div className="flex gap-2 justify-end w-full sm:w-auto">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!isDecreased || isSaving}
                  onClick={handleSave}
                  className="bg-[#6c63ff] hover:bg-[#5b52e0] text-white font-medium"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
