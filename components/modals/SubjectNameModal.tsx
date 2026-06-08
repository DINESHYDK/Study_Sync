"use client";

import { FormEvent, useEffect, useState } from "react";

import { useTimer } from "@/hooks/useTimer";
import { useTimerStore } from "@/stores/useTimerStore";
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

export function SubjectNameModal() {
  const { updateSegmentSubject } = useTimer();
  const segmentId = useTimerStore((state) => state.subjectModalSegmentId);
  const closeSubjectModal = useTimerStore((state) => state.closeSubjectModal);
  const segment = useTimerStore((state) => state.segments.find((item) => item.id === segmentId) ?? null);
  const [subject, setSubject] = useState("General");
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setSubject(segment?.subject_name ?? "General");
  }, [segment]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (segmentId) {
      setSaving(true);
      await updateSegmentSubject(segmentId, subject);
      setSaving(false);
    }

    closeSubjectModal();
  }

  return (
    <Dialog open={Boolean(segmentId)} onOpenChange={(open) => (!open && !isSaving ? closeSubjectModal() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name this session</DialogTitle>
          <DialogDescription>{"Keep \"General\" or add the subject you just studied."}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input 
            autoFocus 
            disabled={isSaving} 
            maxLength={80} 
            onChange={(event) => setSubject(event.target.value)} 
            value={subject} 
          />
          <DialogFooter>
            <Button disabled={isSaving} onClick={closeSubjectModal} type="button" variant="ghost">
              Skip
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
