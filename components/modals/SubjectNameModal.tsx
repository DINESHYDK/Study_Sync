"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Unlink } from "lucide-react";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useTimer } from "@/hooks/useTimer";
import { type TodoRow } from "@/components/todos/TodoItem";
import { useTimerStore } from "@/stores/useTimerStore";
import { useUserStore } from "@/stores/useUserStore";
import { todayLocalDate } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_LINK = "__none__";

export function SubjectNameModal() {
  const { supabase, isConfigured } = useSupabase();
  const { updateSegmentSubject } = useTimer();
  const profile = useUserStore((state) => state.profile);
  const segmentId = useTimerStore((state) => state.subjectModalSegmentId);
  const closeSubjectModal = useTimerStore((state) => state.closeSubjectModal);
  const segment = useTimerStore(
    (state) => state.segments.find((item) => item.id === segmentId) ?? null,
  );

  const [subject, setSubject] = useState("General");
  const [isSaving, setSaving] = useState(false);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [linkedTodoId, setLinkedTodoId] = useState<string>(NO_LINK);

  // Sync subject name when the segment changes.
  useEffect(() => {
    setSubject(segment?.subject_name ?? "General");
    // Pre-fill existing link if the segment already has one.
    setLinkedTodoId(segment?.linked_todo_id ?? NO_LINK);
  }, [segment]);

  // Load today's incomplete todos when the modal opens.
  const loadTodos = useCallback(async () => {
    if (!profile || !segmentId) return;

    if (!isConfigured) {
      setTodos([]);
      return;
    }

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", profile.id)
      .eq("date", todayLocalDate())
      .eq("is_completed", false)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setTodos(data);
    }
  }, [isConfigured, profile, segmentId, supabase]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!segmentId) return;

    setSaving(true);
    try {
      // Save subject name (existing logic, unchanged).
      await updateSegmentSubject(segmentId, subject);

      // Save the todo link if configured and a link was set/changed.
      if (isConfigured && profile) {
        const newLinkedTodoId = linkedTodoId === NO_LINK ? null : linkedTodoId;
        const { error } = await supabase
          .from("session_segments")
          .update({ linked_todo_id: newLinkedTodoId })
          .eq("id", segmentId)
          .eq("user_id", profile.id);

        if (error) {
          toast.error(error.message);
        }
      }
    } finally {
      setSaving(false);
      closeSubjectModal();
    }
  }

  return (
    <Dialog
      open={Boolean(segmentId)}
      onOpenChange={(open) => (!open && !isSaving ? closeSubjectModal() : undefined)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name this session</DialogTitle>
          <DialogDescription>
            {"Keep \"General\" or add the subject you just studied."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* Subject name */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="subject-input">
              Subject
            </label>
            <Input
              autoFocus
              disabled={isSaving}
              id="subject-input"
              maxLength={80}
              onChange={(event) => setSubject(event.target.value)}
              value={subject}
            />
          </div>

          {/* Task link — only shown when there are incomplete todos */}
          {todos.length > 0 && (
            <div className="grid gap-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="todo-link-select">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Link to a task{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Select
                onValueChange={setLinkedTodoId}
                value={linkedTodoId}
              >
                <SelectTrigger id="todo-link-select">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LINK}>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Unlink className="h-3.5 w-3.5" />
                      None
                    </span>
                  </SelectItem>
                  {todos.map((todo) => (
                    <SelectItem key={todo.id} value={todo.id}>
                      <span className="block max-w-56 truncate">{todo.text}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              disabled={isSaving}
              onClick={closeSubjectModal}
              type="button"
              variant="ghost"
            >
              Skip
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
