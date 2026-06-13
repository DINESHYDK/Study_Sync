"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { TimerContext, type PauseTimerOptions } from "@/hooks/useTimer";
import { secondsBetween } from "@/lib/timer";
import { todayLocalDate } from "@/lib/utils";
import { useTimerStore, type TimerPopupState, type TimerSegment } from "@/stores/useTimerStore";
import { useUserStore } from "@/stores/useUserStore";

const ACTIVE_SEGMENT_KEY = "active_segment_id";
const POPUP_STATE_KEY = "timer_popup_state";
const DEMO_SEGMENTS_PREFIX = "studysync_demo_segments";
const DEMO_SESSION_ID = "00000000-0000-4000-8000-000000000101";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimerSegment(value: unknown): value is TimerSegment {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.session_id === "string" &&
    typeof value.user_id === "string" &&
    typeof value.subject_name === "string" &&
    typeof value.started_at === "string" &&
    (typeof value.ended_at === "string" || value.ended_at === null) &&
    (typeof value.duration_secs === "number" || value.duration_secs === null) &&
    typeof value.created_at === "string"
  );
}

function demoSegmentsKey(date: string) {
  return `${DEMO_SEGMENTS_PREFIX}_${date}`;
}

function readDemoSegments(date: string) {
  const raw = window.localStorage.getItem(demoSegmentsKey(date));

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.every(isTimerSegment)) {
      return parsed;
    }
  } catch {
    return [];
  }

  return [];
}

function writeDemoSegments(date: string, segments: TimerSegment[]) {
  window.localStorage.setItem(demoSegmentsKey(date), JSON.stringify(segments));
}

function readPopupState() {
  const raw = window.localStorage.getItem(POPUP_STATE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      isRecord(parsed) &&
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      typeof parsed.width === "number" &&
      typeof parsed.height === "number"
    ) {
      return parsed as TimerPopupState;
    }
  } catch {
    return null;
  }

  return null;
}

function activeSegmentStorage() {
  return window.localStorage.getItem(ACTIVE_SEGMENT_KEY);
}

function saveActiveSegment(segmentId: string) {
  window.localStorage.setItem(ACTIVE_SEGMENT_KEY, segmentId);
}

function clearActiveSegment() {
  window.localStorage.removeItem(ACTIVE_SEGMENT_KEY);
  window.localStorage.removeItem("timer_last_heartbeat");
}

function createDemoSegment(userId: string): TimerSegment {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    session_id: DEMO_SESSION_ID,
    user_id: userId,
    subject_name: "General",
    started_at: now,
    ended_at: null,
    duration_secs: null,
    linked_todo_id: null,
    created_at: now,
  };
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { supabase, isConfigured, isReady } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const status = useTimerStore((state) => state.status);
  const activeSegmentId = useTimerStore((state) => state.activeSegmentId);
  const activeStartedAt = useTimerStore((state) => state.activeStartedAt);
  const currentElapsedSeconds = useTimerStore((state) => state.currentElapsedSeconds);
  const popupState = useTimerStore((state) => state.popupState);
  const replaceSegments = useTimerStore((state) => state.replaceSegments);
  const setRunningSegment = useTimerStore((state) => state.setRunningSegment);
  const markSegmentPaused = useTimerStore((state) => state.markSegmentPaused);
  const updateLocalSegmentSubject = useTimerStore((state) => state.updateSegmentSubject);
  const tick = useTimerStore((state) => state.tick);
  const setPopupState = useTimerStore((state) => state.setPopupState);
  const setHydrated = useTimerStore((state) => state.setHydrated);
  const openSubjectModal = useTimerStore((state) => state.openSubjectModal);
  const resetTimer = useTimerStore((state) => state.resetTimer);
  const warnedLongRunRef = useRef(false);
  const [isToggling, setToggling] = useState(false);
  const isTogglingRef = useRef(false);

  const loadToday = useCallback(async () => {
    if (!profile) {
      resetTimer();
      return;
    }

    const today = todayLocalDate();

    if (!isConfigured) {
      const localSegments = readDemoSegments(today);
      replaceSegments(localSegments);
      return;
    }

    const storedActiveSegmentId = activeSegmentStorage();

    if (storedActiveSegmentId) {
      const { data: storedSegment } = await supabase
        .from("session_segments")
        .select("*")
        .eq("id", storedActiveSegmentId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (storedSegment?.ended_at === null) {
        const heartbeat = window.localStorage.getItem("timer_last_heartbeat");
        const now = new Date().getTime();
        const heartbeatTime = heartbeat ? new Date(heartbeat).getTime() : 0;

        if (heartbeat && (now - heartbeatTime < 15000)) {
          // Tab was re-entered or refreshed recently. Restore running state.
          // Do not pause or clear the active segment.
        } else {
          // Abandoned segment. Eagerly pause it.
          let endedAt = new Date().toISOString();
          if (heartbeat) {
            const startedAtTime = new Date(storedSegment.started_at).getTime();
            if (heartbeatTime > startedAtTime) {
              endedAt = heartbeat;
            }
          }
          await supabase
            .from("session_segments")
            .update({ ended_at: endedAt })
            .eq("id", storedSegment.id)
            .is("ended_at", null);
          toast.info("Your timer was automatically paused.");
          clearActiveSegment();
        }
      } else {
        clearActiveSegment();
      }
    }

    const { data: session } = await supabase
      .from("study_sessions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("date", today)
      .maybeSingle();

    if (!session) {
      replaceSegments([]);
      return;
    }

    const { data: segments, error } = await supabase
      .from("session_segments")
      .select("*")
      .eq("session_id", session.id)
      .order("started_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    replaceSegments(segments ?? []);
  }, [isConfigured, profile, replaceSegments, resetTimer, supabase]);

  const resumeTimer = useCallback(async () => {
    if (isTogglingRef.current) return;
    if (!profile) {
      toast.error("Sign in before starting a timer.");
      return;
    }

    isTogglingRef.current = true;
    setToggling(true);

    try {
      const today = todayLocalDate();

      if (!isConfigured) {
        const segments = readDemoSegments(today);
        const activeSegment = segments.find((segment) => segment.ended_at === null);

        if (activeSegment) {
          saveActiveSegment(activeSegment.id);
          setRunningSegment(activeSegment);
          return;
        }

        const segment = createDemoSegment(profile.id);
        const nextSegments = [...segments, segment];
        writeDemoSegments(today, nextSegments);
        saveActiveSegment(segment.id);
        setRunningSegment(segment);
        return;
      }

      const { data: openSegment, error: openSegmentError } = await supabase
        .from("session_segments")
        .select("*")
        .eq("user_id", profile.id)
        .is("ended_at", null)
        .maybeSingle();

      if (openSegmentError) {
        toast.error(openSegmentError.message);
        return;
      }

      if (openSegment) {
        saveActiveSegment(openSegment.id);
        setRunningSegment(openSegment);
        return;
      }

      const { data: session, error: sessionError } = await supabase
        .from("study_sessions")
        .upsert({ user_id: profile.id, date: today }, { onConflict: "user_id,date" })
        .select("id")
        .single();

      if (sessionError) {
        toast.error(sessionError.message);
        return;
      }

      const startedAt = new Date().toISOString();
      const { data: segment, error: segmentError } = await supabase
        .from("session_segments")
        .insert({
          session_id: session.id,
          user_id: profile.id,
          subject_name: "General",
          started_at: startedAt,
          ended_at: null,
        })
        .select("*")
        .single();

      if (segmentError) {
        toast.error(segmentError.message);
        return;
      }

      saveActiveSegment(segment.id);
      setRunningSegment(segment);
    } finally {
      isTogglingRef.current = false;
      setToggling(false);
    }
  }, [isConfigured, profile, setRunningSegment, supabase]);

  const pauseTimer = useCallback(
    async (options?: PauseTimerOptions) => {
      if (isTogglingRef.current) return;
      const segmentId = activeSegmentId;

      if (!segmentId || !profile) {
        return;
      }

      isTogglingRef.current = true;
      setToggling(true);

      try {
        const endedAt = options?.endedAt ?? new Date().toISOString();
        const segmentDate = activeStartedAt ? activeStartedAt.slice(0, 10) : todayLocalDate();

        if (!isConfigured) {
          const segments = readDemoSegments(segmentDate);
          const updatedSegments = segments.map((segment) =>
            segment.id === segmentId
              ? { ...segment, ended_at: endedAt, duration_secs: secondsBetween(segment.started_at, endedAt) }
              : segment,
          );

          writeDemoSegments(segmentDate, updatedSegments);
          markSegmentPaused(segmentId, endedAt);
          clearActiveSegment();

          if (options?.showSubjectModal !== false) {
            openSubjectModal(segmentId);
          }

          if (options?.toastMessage) {
            toast.info(options.toastMessage);
          }

          return;
        }

        const { data: segment, error } = await supabase
          .from("session_segments")
          .update({ ended_at: endedAt })
          .eq("id", segmentId)
          .eq("user_id", profile.id)
          .is("ended_at", null)
          .select("*")
          .maybeSingle();

        if (error) {
          toast.error(error.message);
          return;
        }

        markSegmentPaused(segmentId, endedAt);
        clearActiveSegment();

        if (segment && options?.showSubjectModal !== false) {
          openSubjectModal(segment.id);
        }

        if (options?.toastMessage) {
          toast.info(options.toastMessage);
        }
      } finally {
        isTogglingRef.current = false;
        setToggling(false);
      }
    },
    [activeSegmentId, activeStartedAt, isConfigured, markSegmentPaused, openSubjectModal, profile, supabase],
  );

  const updateSegmentSubject = useCallback(
    async (segmentId: string, subjectName: string) => {
      const normalizedSubject = subjectName.trim() || "General";

      if (!profile) {
        return;
      }

      updateLocalSegmentSubject(segmentId, normalizedSubject);

      if (!isConfigured) {
        const today = todayLocalDate();
        const segments = readDemoSegments(today).map((segment) =>
          segment.id === segmentId ? { ...segment, subject_name: normalizedSubject } : segment,
        );
        writeDemoSegments(today, segments);
        toast.success("Subject updated");
        return;
      }

      const { error } = await supabase
        .from("session_segments")
        .update({ subject_name: normalizedSubject })
        .eq("id", segmentId)
        .eq("user_id", profile.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Subject updated");
    },
    [isConfigured, profile, supabase, updateLocalSegmentSubject],
  );

  /**
   * Splits a running segment at midnight when the user studies past 00:00.
   * - Closes the current segment at 23:59:59 (local) of the started date.
   * - Creates a new study_session (upsert) for the new date.
   * - Inserts a new segment starting at 00:00:00 (local) of the new date.
   * - Carries the subject name forward so context is preserved.
   * - Calls loadToday() to re-hydrate the store with the new day's data.
   * - The timer continues running without any interruption to the user.
   */
  const splitSegmentAtMidnight = useCallback(async () => {
    if (status !== "running" || !profile || !activeSegmentId || !activeStartedAt) {
      return;
    }

    // Derive the LOCAL calendar date the segment started on.
    const startedLocalDate = format(new Date(activeStartedAt), "yyyy-MM-dd");
    const todayDate = todayLocalDate();

    // Same local date — no midnight crossing, nothing to do.
    if (startedLocalDate === todayDate) {
      return;
    }

    // Reuse the existing mutex so we don't race with pause/resume.
    if (isTogglingRef.current) {
      return;
    }
    isTogglingRef.current = true;

    try {
      const [year, month, day] = startedLocalDate.split("-").map(Number);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59);
      const endOfDayIso = endOfDay.toISOString();

      // Imperatively read the subject name without adding a React subscription.
      const currentSegments = useTimerStore.getState().segments;
      const runningSegment = currentSegments.find((s) => s.id === activeSegmentId);
      const subjectName = runningSegment?.subject_name ?? "General";

      if (!isConfigured) {
        // ── Demo (localStorage) mode ─────────────────────────────────────────
        const oldSegments = readDemoSegments(startedLocalDate);
        const patchedOldSegments = oldSegments.map((seg) =>
          seg.id === activeSegmentId
            ? { ...seg, ended_at: endOfDayIso, duration_secs: secondsBetween(seg.started_at, endOfDayIso) }
            : seg,
        );
        writeDemoSegments(startedLocalDate, patchedOldSegments);
        clearActiveSegment();

        const [ny, nm, nd] = todayDate.split("-").map(Number);
        const startOfDayIso = new Date(ny, nm - 1, nd, 0, 0, 0).toISOString();
        const now = new Date().toISOString();
        const newDemoSegment: TimerSegment = {
          id: crypto.randomUUID(),
          session_id: DEMO_SESSION_ID,
          user_id: profile.id,
          subject_name: subjectName,
          started_at: startOfDayIso,
          ended_at: null,
          duration_secs: null,
          linked_todo_id: null,
          created_at: now,
        };
        const todayDemoSegments = [...readDemoSegments(todayDate), newDemoSegment];
        writeDemoSegments(todayDate, todayDemoSegments);
        saveActiveSegment(newDemoSegment.id);
        await loadToday();
        toast.info("Session continued into a new day");
        return;
      }

      // ── Supabase mode ────────────────────────────────────────────────────
      // Step 1: Close old segment at 23:59:59 of started date.
      const { error: updateError } = await supabase
        .from("session_segments")
        .update({ ended_at: endOfDayIso })
        .eq("id", activeSegmentId)
        .eq("user_id", profile.id)
        .is("ended_at", null);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      // Step 2: Upsert a study_session row for the new date.
      const { data: newSession, error: sessionError } = await supabase
        .from("study_sessions")
        .upsert({ user_id: profile.id, date: todayDate }, { onConflict: "user_id,date" })
        .select("id")
        .single();

      if (sessionError || !newSession) {
        toast.error(sessionError?.message ?? "Could not create session for new day.");
        return;
      }

      // Step 3: Insert new segment starting at 00:00:00 local time of new date.
      const [ny, nm, nd] = todayDate.split("-").map(Number);
      const startOfDayIso = new Date(ny, nm - 1, nd, 0, 0, 0).toISOString();

      const { data: newSegment, error: segmentError } = await supabase
        .from("session_segments")
        .insert({
          session_id: newSession.id,
          user_id: profile.id,
          subject_name: subjectName,
          started_at: startOfDayIso,
          ended_at: null,
        })
        .select("*")
        .single();

      if (segmentError || !newSegment) {
        toast.error(segmentError?.message ?? "Could not create segment for new day.");
        return;
      }

      // Step 4: Persist new segment ID and reload today's store data.
      saveActiveSegment(newSegment.id);
      await loadToday();
      toast.info("Session continued into a new day");
    } finally {
      isTogglingRef.current = false;
    }
  }, [
    activeSegmentId,
    activeStartedAt,
    isConfigured,
    loadToday,
    profile,
    status,
    supabase,
  ]);

  useEffect(() => {
    const popup = readPopupState();

    if (popup) {
      setPopupState(popup);
    }

    setHydrated(true);
  }, [setHydrated, setPopupState]);

  useEffect(() => {
    window.localStorage.setItem(POPUP_STATE_KEY, JSON.stringify(popupState));
  }, [popupState]);

  useEffect(() => {
    if (!isReady || !profile) {
      return;
    }

    loadToday().catch(() => toast.error("Could not load today's timer."));
  }, [isReady, loadToday, profile]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    tick();
    window.localStorage.setItem("timer_last_heartbeat", new Date().toISOString());
    const intervalId = window.setInterval(() => {
      tick();
      window.localStorage.setItem("timer_last_heartbeat", new Date().toISOString());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [status, tick]);

  useEffect(() => {
    if (status !== "running") {
      warnedLongRunRef.current = false;
      return;
    }

    if (currentElapsedSeconds > 43_200 && !warnedLongRunRef.current) {
      warnedLongRunRef.current = true;
      toast.warning("Your timer has been running for over 12 hours. Did you forget to pause?");
    }
  }, [currentElapsedSeconds, status]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (status === "running") {
        if (document.visibilityState === "hidden") {
          window.localStorage.setItem("timer_last_heartbeat", new Date().toISOString());
        } else if (document.visibilityState === "visible") {
          tick();
        }
      }
    }

    function handleBeforeUnload() {
      if (status !== "running" || !activeSegmentId) {
        return;
      }

      const endedAt = new Date().toISOString();

      if (isConfigured) {
        const payload = JSON.stringify({ segment_id: activeSegmentId, ended_at: endedAt });
        navigator.sendBeacon("/api/timer/pause", new Blob([payload], { type: "application/json" }));
      } else {
        const today = todayLocalDate();
        const segments = readDemoSegments(today).map((segment) =>
          segment.id === activeSegmentId
            ? { ...segment, ended_at: endedAt, duration_secs: secondsBetween(segment.started_at, endedAt) }
            : segment,
        );
        writeDemoSegments(today, segments);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeSegmentId, isConfigured, pauseTimer, status, tick]);

  // ── Cross-day segment split ────────────────────────────────────────────────
  // Poll every 60 s while running. If the local date has changed since the
  // segment started, splitSegmentAtMidnight silently closes the old segment and
  // opens a fresh one for the new day. The timer keeps ticking uninterrupted.
  useEffect(() => {
    if (status !== "running" || !activeStartedAt) {
      return;
    }

    // Run once immediately in case the app was restored after a crossing.
    void splitSegmentAtMidnight();

    const intervalId = window.setInterval(() => {
      void splitSegmentAtMidnight();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [activeStartedAt, splitSegmentAtMidnight, status]);

  const value = useMemo(
    () => ({
      loadToday,
      resumeTimer,
      pauseTimer,
      updateSegmentSubject,
      isToggling,
    }),
    [loadToday, pauseTimer, resumeTimer, updateSegmentSubject, isToggling],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
