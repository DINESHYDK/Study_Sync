"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserStore, type UserProfile } from "@/stores/useUserStore";
import type { Tables } from "@/types/database";

type Comment = Tables<"session_comments"> & {
  author: Pick<UserProfile, "id" | "full_name" | "email" | "initials" | "avatar_id">;
};

const MAX_BODY = 280;

type CommentSectionProps = {
  /** The study_sessions.id to thread comments on. */
  sessionId: string;
  /**
   * Whether the current user can post new comments.
   * Pass `false` when rendering your own column in ComparisonView
   * (you can comment on your friend's sessions but not your own).
   */
  canPost?: boolean;
};

export function CommentSection({ sessionId, canPost = true }: CommentSectionProps) {
  const { supabase } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [isPosting, setPosting] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch existing comments ──────────────────────────────────────────────────

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("session_comments")
      .select("*, author:profiles!session_comments_author_id_fkey(id, full_name, email, initials, avatar_id)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
    } else {
      setComments((data as Comment[]) ?? []);
    }

    setLoading(false);
  }, [sessionId, supabase]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  // Scroll to bottom when new comments arrive.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Realtime subscription — live-update this comment thread ─────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`session-comments-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_comments",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the full comment with author info.
          const { data } = await supabase
            .from("session_comments")
            .select(
              "*, author:profiles!session_comments_author_id_fkey(id, full_name, email, initials, avatar_id)",
            )
            .eq("id", (payload.new as { id: string }).id)
            .single();

          if (data) {
            setComments((prev) => {
              // Guard against duplicates from optimistic inserts.
              if (prev.some((c) => c.id === (data as Comment).id)) return prev;
              return [...prev, data as Comment];
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // ── Post a new comment ───────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !body.trim() || isPosting) return;

    const trimmed = body.trim().slice(0, MAX_BODY);
    setPosting(true);

    // Optimistic insert so the author sees their comment instantly.
    const optimistic: Comment = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      author_id: profile.id,
      body: trimmed,
      created_at: new Date().toISOString(),
      author: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        initials: profile.initials,
        avatar_id: profile.avatar_id,
      },
    };
    setComments((prev) => [...prev, optimistic]);
    setBody("");

    const { data: inserted, error } = await supabase
      .from("session_comments")
      .insert({ session_id: sessionId, author_id: profile.id, body: trimmed })
      .select("id")
      .single();

    if (error) {
      // Roll back optimistic insert.
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setBody(trimmed);
      toast.error(error.message);
    } else if (inserted) {
      // Replace optimistic entry with real server ID.
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? { ...c, id: inserted.id } : c)),
      );
    }

    setPosting(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Comments
          {comments.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {comments.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3 pt-0">
        {/* Comment list */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-10 rounded-xl bg-secondary/50" />
            <div className="h-10 rounded-xl bg-secondary/50" />
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No comments yet.{canPost ? " Be the first!" : ""}
          </p>
        ) : (
          <ul className="grid max-h-72 gap-2 overflow-y-auto pr-1">
            {comments.map((comment) => (
              <li
                className="flex min-w-0 items-start gap-2.5"
                key={comment.id}
              >
                <UserAvatar
                  profile={comment.author as UserProfile}
                  className="h-7 w-7 shrink-0 text-[10px]"
                />
                <div className="min-w-0 flex-1 rounded-xl bg-secondary/60 px-3 py-2">
                  <div className="mb-0.5 flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-xs font-semibold">
                      {comment.author.full_name || comment.author.email}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                    {comment.body}
                  </p>
                </div>
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        )}

        {/* Input */}
        {canPost && profile && (
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input
              className="flex-1"
              disabled={isPosting}
              maxLength={MAX_BODY}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Leave a comment…"
              value={body}
            />
            <Button
              disabled={isPosting || !body.trim()}
              size="icon"
              type="submit"
              variant="default"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send comment</span>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
