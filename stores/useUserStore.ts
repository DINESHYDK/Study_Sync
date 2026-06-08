import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

import type { Tables } from "@/types/database";

export type UserProfile = Tables<"profiles">;

export const demoProfile: UserProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@studysync.local",
  full_name: "StudySync Demo",
  initials: "SD",
  avatar_id: "rocket",
  referral_code: "DEMO2026",
  onboarding_done: false,
  created_at: new Date().toISOString(),
};

type UserStore = {
  profile: UserProfile | null;
  sessionUser: User | null;
  isReady: boolean;
  pendingRequestCount: number;
  setProfile: (profile: UserProfile | null) => void;
  setSessionUser: (user: User | null) => void;
  setReady: (isReady: boolean) => void;
  setPendingRequestCount: (count: number) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  reset: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  sessionUser: null,
  isReady: false,
  pendingRequestCount: 0,
  setProfile: (profile) => set({ profile }),
  setSessionUser: (sessionUser) => set({ sessionUser }),
  setReady: (isReady) => set({ isReady }),
  setPendingRequestCount: (pendingRequestCount) => set({ pendingRequestCount }),
  updateProfile: (profilePatch) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...profilePatch } : state.profile,
    })),
  reset: () =>
    set({
      profile: null,
      sessionUser: null,
      isReady: true,
      pendingRequestCount: 0,
    }),
}));
