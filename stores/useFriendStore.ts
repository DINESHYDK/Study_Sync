import { create } from "zustand";

import type { Tables } from "@/types/database";

export type FriendProfile = Tables<"profiles">;

export type FriendSummary = {
  profile: FriendProfile;
  totalStudySeconds: number;
  completedTodoCount: number;
  isRunning: boolean;
  lastActivityAt: string | null;
};

export type IncomingFriendRequest = Tables<"friend_requests"> & {
  requester: FriendProfile | null;
};

type FriendStore = {
  friends: FriendSummary[];
  incomingRequests: IncomingFriendRequest[];
  isLoading: boolean;
  setFriends: (friends: FriendSummary[]) => void;
  updateFriend: (friendId: string, patch: Partial<FriendSummary>) => void;
  setIncomingRequests: (requests: IncomingFriendRequest[]) => void;
  addIncomingRequest: (request: IncomingFriendRequest) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
};

export const useFriendStore = create<FriendStore>((set) => ({
  friends: [],
  incomingRequests: [],
  isLoading: false,
  setFriends: (friends) => set({ friends }),
  updateFriend: (friendId, patch) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.profile.id === friendId ? { ...friend, ...patch } : friend,
      ),
    })),
  setIncomingRequests: (incomingRequests) => set({ incomingRequests }),
  addIncomingRequest: (request) =>
    set((state) => ({
      incomingRequests: state.incomingRequests.some((item) => item.id === request.id)
        ? state.incomingRequests
        : [request, ...state.incomingRequests],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      friends: [],
      incomingRequests: [],
      isLoading: false,
    }),
}));
