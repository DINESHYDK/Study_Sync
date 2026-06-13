import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SoundChannelId = "rain" | "lofi" | "cafe" | "forest" | "noise";

export type SoundChannel = {
  id: SoundChannelId;
  label: string;
  emoji: string;
  /** Path relative to /public */
  file: string;
  volume: number; // 0–1
  enabled: boolean;
};

type SoundState = {
  channels: Record<SoundChannelId, SoundChannel>;
  syncWithTimer: boolean;
};

type SoundActions = {
  toggleChannel: (id: SoundChannelId) => void;
  setVolume: (id: SoundChannelId, volume: number) => void;
  setSyncWithTimer: (sync: boolean) => void;
};

export type SoundStore = SoundState & SoundActions;

// ── Initial channel definitions ────────────────────────────────────────────────

const DEFAULT_CHANNELS: Record<SoundChannelId, SoundChannel> = {
  rain: {
    id: "rain",
    label: "Rain",
    emoji: "🌧️",
    file: "/sounds/rain.mp3",
    volume: 0.5,
    enabled: false,
  },
  lofi: {
    id: "lofi",
    label: "Lofi",
    emoji: "🎵",
    file: "/sounds/lofi.mp3",
    volume: 0.5,
    enabled: false,
  },
  cafe: {
    id: "cafe",
    label: "Café",
    emoji: "☕",
    file: "/sounds/cafe.mp3",
    volume: 0.5,
    enabled: false,
  },
  forest: {
    id: "forest",
    label: "Forest",
    emoji: "🌲",
    file: "/sounds/forest.mp3",
    volume: 0.5,
    enabled: false,
  },
  noise: {
    id: "noise",
    label: "White Noise",
    emoji: "〰️",
    file: "/sounds/noise.mp3",
    volume: 0.5,
    enabled: false,
  },
};

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      channels: { ...DEFAULT_CHANNELS },
      syncWithTimer: true,

      toggleChannel: (id) =>
        set((state) => ({
          channels: {
            ...state.channels,
            [id]: { ...state.channels[id], enabled: !state.channels[id].enabled },
          },
        })),

      setVolume: (id, volume) =>
        set((state) => ({
          channels: {
            ...state.channels,
            [id]: { ...state.channels[id], volume: Math.min(1, Math.max(0, volume)) },
          },
        })),

      setSyncWithTimer: (syncWithTimer) => set({ syncWithTimer }),
    }),
    {
      name: "studysync_sounds",
      // Only persist user preferences, not runtime audio state.
      partialize: (state) => ({
        channels: state.channels,
        syncWithTimer: state.syncWithTimer,
      }),
    },
  ),
);
