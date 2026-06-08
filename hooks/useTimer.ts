import { createContext, useContext } from "react";

export type PauseTimerOptions = {
  showSubjectModal?: boolean;
  endedAt?: string;
  toastMessage?: string;
};

export type TimerContextValue = {
  loadToday: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  pauseTimer: (options?: PauseTimerOptions) => Promise<void>;
  updateSegmentSubject: (segmentId: string, subjectName: string) => Promise<void>;
};

export const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used within TimerProvider");
  }

  return context;
}
