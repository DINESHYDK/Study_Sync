"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock3, GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDurationCompact } from "@/lib/timer";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

export type TodoRow = Tables<"todos">;

type TodoItemProps = {
  todo: TodoRow;
  readOnly?: boolean;
  onToggle: (todo: TodoRow) => void;
  onDelete: (todo: TodoRow) => void;
  isProcessing?: boolean;
  /** Total seconds logged against this todo via linked segments. */
  segmentSeconds?: number;
};

export function TodoItem({ todo, readOnly = false, onToggle, onDelete, isProcessing = false, segmentSeconds = 0 }: TodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: readOnly || isProcessing,
  });

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2 transition",
        isDragging && "opacity-70 shadow-glow",
        isProcessing && "opacity-50 pointer-events-none",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        aria-label="Drag todo"
        className={cn("cursor-grab text-muted-foreground", (readOnly || isProcessing) && "cursor-default opacity-40")}
        disabled={isProcessing}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <label className="flex min-w-0 items-center gap-3 text-sm">
        <input
          checked={todo.is_completed}
          className="h-4 w-4 accent-[#6c63ff]"
          disabled={readOnly || isProcessing}
          onChange={() => onToggle(todo)}
          type="checkbox"
        />
        <span className={cn("min-w-0 truncate", todo.is_completed && "text-muted-foreground line-through")}>{todo.text}</span>
        {/* Time-logged chip — shown when at least 1 segment links to this todo */}
        {segmentSeconds > 0 ? (
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Clock3 className="h-2.5 w-2.5" />
            {formatDurationCompact(segmentSeconds)}
          </span>
        ) : null}
      </label>
      {!readOnly ? (
        <Button disabled={isProcessing} onClick={() => onDelete(todo)} size="icon-sm" variant="ghost">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete todo</span>
        </Button>
      ) : null}
    </li>
  );
}
