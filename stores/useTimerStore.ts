import { create } from "zustand";

import { secondsBetween, totalDurationSecs } from "@/lib/timer";
import type { Tables } from "@/types/database";

export type TimerStatus = "idle" | "running" | "paused";
export type TimerSegment = Tables<"session_segments">;

export type TimerPopupState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const defaultPopupState: TimerPopupState = {
  x: 24,
  y: 24,
  width: 280,
  height: 190,
};

function completedDuration(segments: TimerSegment[]) {
  return totalDurationSecs(segments.filter((segment) => segment.ended_at !== null));
}

type TimerStore = {
  status: TimerStatus;
  activeSegmentId: string | null;
  activeStartedAt: string | null;
  currentElapsedSeconds: number;
  completedSeconds: number;
  todayTotalSeconds: number;
  segments: TimerSegment[];
  isPopupOpen: boolean;
  pipWindow: Window | null;
  isFullscreen: boolean;
  popupState: TimerPopupState;
  subjectModalSegmentId: string | null;
  isHydrated: boolean;
  setHydrated: (isHydrated: boolean) => void;
  replaceSegments: (segments: TimerSegment[]) => void;
  setRunningSegment: (segment: TimerSegment) => void;
  markSegmentPaused: (segmentId: string, endedAt: string) => void;
  updateSegmentSubject: (segmentId: string, subjectName: string) => void;
  tick: () => void;
  resetTimer: () => void;
  setPopupOpen: (isPopupOpen: boolean) => void;
  setPipWindow: (pipWindow: Window | null) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setPopupState: (popupState: TimerPopupState) => void;
  openSubjectModal: (segmentId: string) => void;
  closeSubjectModal: () => void;
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  status: "idle",
  activeSegmentId: null,
  activeStartedAt: null,
  currentElapsedSeconds: 0,
  completedSeconds: 0,
  todayTotalSeconds: 0,
  segments: [],
  isPopupOpen: false,
  pipWindow: null,
  isFullscreen: false,
  popupState: defaultPopupState,
  subjectModalSegmentId: null,
  isHydrated: false,
  setHydrated: (isHydrated) => set({ isHydrated }),
  replaceSegments: (segments) => {
    const activeSegment = segments.find((segment) => segment.ended_at === null) ?? null;
    const completedSeconds = completedDuration(segments);
    const currentElapsedSeconds = activeSegment ? secondsBetween(activeSegment.started_at) : 0;

    set({
      segments,
      completedSeconds,
      currentElapsedSeconds,
      todayTotalSeconds: completedSeconds + currentElapsedSeconds,
      status: activeSegment ? "running" : segments.length > 0 ? "paused" : "idle",
      activeSegmentId: activeSegment?.id ?? null,
      activeStartedAt: activeSegment?.started_at ?? null,
    });
  },
  setRunningSegment: (segment) =>
    set((state) => {
      const otherSegments = state.segments.filter((item) => item.id !== segment.id);
      const segments = [...otherSegments, segment].sort((a, b) => a.started_at.localeCompare(b.started_at));
      const completedSeconds = completedDuration(segments);

      return {
        segments,
        completedSeconds,
        currentElapsedSeconds: 0,
        todayTotalSeconds: completedSeconds,
        status: "running",
        activeSegmentId: segment.id,
        activeStartedAt: segment.started_at,
      };
    }),
  markSegmentPaused: (segmentId, endedAt) =>
    set((state) => {
      const segments = state.segments.map((segment) => {
        if (segment.id !== segmentId) {
          return segment;
        }

        return {
          ...segment,
          ended_at: endedAt,
          duration_secs: secondsBetween(segment.started_at, endedAt),
        };
      });
      const completedSeconds = completedDuration(segments);

      return {
        segments,
        completedSeconds,
        currentElapsedSeconds: 0,
        todayTotalSeconds: completedSeconds,
        status: segments.length > 0 ? "paused" : "idle",
        activeSegmentId: null,
        activeStartedAt: null,
      };
    }),
  updateSegmentSubject: (segmentId, subjectName) =>
    set((state) => ({
      segments: state.segments.map((segment) =>
        segment.id === segmentId ? { ...segment, subject_name: subjectName } : segment,
      ),
    })),
  tick: () => {
    const state = get();

    if (state.status !== "running" || !state.activeStartedAt) {
      return;
    }

    const currentElapsedSeconds = secondsBetween(state.activeStartedAt);
    set({
      currentElapsedSeconds,
      todayTotalSeconds: state.completedSeconds + currentElapsedSeconds,
    });
  },
  resetTimer: () =>
    set({
      status: "idle",
      activeSegmentId: null,
      activeStartedAt: null,
      currentElapsedSeconds: 0,
      completedSeconds: 0,
      todayTotalSeconds: 0,
      segments: [],
      subjectModalSegmentId: null,
    }),
  setPopupOpen: (isPopupOpen) => set({ isPopupOpen }),
  setPipWindow: (pipWindow) => set({ pipWindow }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setPopupState: (popupState) => set({ popupState }),
  openSubjectModal: (subjectModalSegmentId) => set({ subjectModalSegmentId }),
  closeSubjectModal: () => set({ subjectModalSegmentId: null }),
}));
