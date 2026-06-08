"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { TodoItem, type TodoRow } from "@/components/todos/TodoItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";

const MAX_TODOS = 20;
const MAX_TEXT_LENGTH = 200;
const DEMO_TODOS_PREFIX = "studysync_demo_todos";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTodoRow(value: unknown): value is TodoRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.user_id === "string" &&
    typeof value.date === "string" &&
    typeof value.text === "string" &&
    typeof value.is_completed === "boolean" &&
    typeof value.sort_order === "number" &&
    typeof value.created_at === "string"
  );
}

function demoTodosKey(date: string) {
  return `${DEMO_TODOS_PREFIX}_${date}`;
}

function readDemoTodos(date: string) {
  const raw = window.localStorage.getItem(demoTodosKey(date));

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.every(isTodoRow)) {
      return parsed;
    }
  } catch {
    return [];
  }

  return [];
}

function writeDemoTodos(date: string, todos: TodoRow[]) {
  window.localStorage.setItem(demoTodosKey(date), JSON.stringify(todos));
}

function orderedTodos(todos: TodoRow[]) {
  return [...todos].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }

    return a.sort_order - b.sort_order;
  });
}

type TodoListProps = {
  ownerId?: string;
  date?: string;
  readOnly?: boolean;
  todos?: TodoRow[];
  title?: string;
};

export function TodoList({ ownerId, date = todayLocalDate(), readOnly = false, todos: externalTodos, title = "Today's Tasks" }: TodoListProps) {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const [todos, setTodos] = useState<TodoRow[]>(externalTodos ?? []);
  const [text, setText] = useState("");
  const [isLoading, setLoading] = useState(false);
  const activeOwnerId = ownerId ?? profile?.id ?? "";
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const displayTodos = useMemo(() => orderedTodos(todos), [todos]);

  const loadTodos = useCallback(async () => {
    if (externalTodos) {
      setTodos(externalTodos);
      return;
    }

    if (!activeOwnerId) {
      setTodos([]);
      return;
    }

    if (!isConfigured) {
      setTodos(readDemoTodos(date));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", activeOwnerId)
      .eq("date", date)
      .order("is_completed", { ascending: true })
      .order("sort_order", { ascending: true });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setTodos(data ?? []);
  }, [activeOwnerId, date, externalTodos, isConfigured, supabase]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedText = text.trim();

    if (!normalizedText || readOnly || !activeOwnerId) {
      return;
    }

    if (normalizedText.length > MAX_TEXT_LENGTH) {
      toast.error("Todo text must be 200 characters or fewer.");
      return;
    }

    if (todos.length >= MAX_TODOS) {
      toast.error("You can add up to 20 todos per day.");
      return;
    }

    const sortOrder = todos.length;

    if (!isConfigured) {
      const now = new Date().toISOString();
      const todo: TodoRow = {
        id: crypto.randomUUID(),
        user_id: activeOwnerId,
        date,
        text: normalizedText,
        is_completed: false,
        sort_order: sortOrder,
        created_at: now,
      };
      const nextTodos = [...todos, todo];
      setTodos(nextTodos);
      writeDemoTodos(date, nextTodos);
      setText("");
      return;
    }

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: activeOwnerId,
        date,
        text: normalizedText,
        sort_order: sortOrder,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setTodos((current) => [...current, data]);
    setText("");
  }

  async function handleToggle(todo: TodoRow) {
    if (readOnly) {
      return;
    }

    const nextCompleted = !todo.is_completed;
    setTodos((current) => current.map((item) => (item.id === todo.id ? { ...item, is_completed: nextCompleted } : item)));

    if (!isConfigured) {
      writeDemoTodos(
        date,
        todos.map((item) => (item.id === todo.id ? { ...item, is_completed: nextCompleted } : item)),
      );
      return;
    }

    const { error } = await supabase.from("todos").update({ is_completed: nextCompleted }).eq("id", todo.id);

    if (error) {
      toast.error(error.message);
      setTodos((current) => current.map((item) => (item.id === todo.id ? todo : item)));
    }
  }

  async function handleDelete(todo: TodoRow) {
    if (readOnly) {
      return;
    }

    const nextTodos = todos.filter((item) => item.id !== todo.id);
    setTodos(nextTodos);

    if (!isConfigured) {
      writeDemoTodos(date, nextTodos);
      return;
    }

    const { error } = await supabase.from("todos").delete().eq("id", todo.id);

    if (error) {
      toast.error(error.message);
      setTodos(todos);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (readOnly || !over || active.id === over.id) {
      return;
    }

    const oldIndex = displayTodos.findIndex((todo) => todo.id === active.id);
    const newIndex = displayTodos.findIndex((todo) => todo.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reordered = arrayMove(displayTodos, oldIndex, newIndex).map((todo, index) => ({
      ...todo,
      sort_order: index,
    }));

    setTodos(reordered);

    if (!isConfigured) {
      writeDemoTodos(date, reordered);
      return;
    }

    const updates = reordered.map((todo) => supabase.from("todos").update({ sort_order: todo.sort_order }).eq("id", todo.id));
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);

    if (failed?.error) {
      toast.error(failed.error.message);
      void loadTodos();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!readOnly ? (
          <form className="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={handleAdd}>
            <Input
              maxLength={MAX_TEXT_LENGTH}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a task"
              value={text}
            />
            <Button disabled={isLoading || todos.length >= MAX_TODOS} type="submit">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        ) : null}

        {displayTodos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No tasks for this date.
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)} sensors={sensors}>
            <SortableContext items={displayTodos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
              <ul className="grid gap-2">
                {displayTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    onDelete={(item) => void handleDelete(item)}
                    onToggle={(item) => void handleToggle(item)}
                    readOnly={readOnly}
                    todo={todo}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
