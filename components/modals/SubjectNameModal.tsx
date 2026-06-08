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

  useEffect(() => {
    setSubject(segment?.subject_name ?? "General");
  }, [segment]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (segmentId) {
      await updateSegmentSubject(segmentId, subject);
    }

    closeSubjectModal();
  }

  return (
    <Dialog open={Boolean(segmentId)} onOpenChange={(open) => (!open ? closeSubjectModal() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name this session</DialogTitle>
          <DialogDescription>Keep "General" or add the subject you just studied.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input autoFocus maxLength={80} onChange={(event) => setSubject(event.target.value)} value={subject} />
          <DialogFooter>
            <Button onClick={closeSubjectModal} type="button" variant="ghost">
              Skip
            </Button>
            <Button type="submit">Save subject</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
