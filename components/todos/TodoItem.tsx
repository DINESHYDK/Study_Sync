"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

export type TodoRow = Tables<"todos">;

type TodoItemProps = {
  todo: TodoRow;
  readOnly?: boolean;
  onToggle: (todo: TodoRow) => void;
  onDelete: (todo: TodoRow) => void;
};

export function TodoItem({ todo, readOnly = false, onToggle, onDelete }: TodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: readOnly,
  });

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2 transition",
        isDragging && "opacity-70 shadow-glow",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        aria-label="Drag todo"
        className={cn("cursor-grab text-muted-foreground", readOnly && "cursor-default opacity-40")}
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
          disabled={readOnly}
          onChange={() => onToggle(todo)}
          type="checkbox"
        />
        <span className={cn("truncate", todo.is_completed && "text-muted-foreground line-through")}>{todo.text}</span>
      </label>
      {!readOnly ? (
        <Button onClick={() => onDelete(todo)} size="icon-sm" variant="ghost">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete todo</span>
        </Button>
      ) : null}
    </li>
  );
}
