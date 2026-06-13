"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Headphones, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { useTimerStore } from "@/stores/useTimerStore";
import { type SoundChannelId, useSoundStore } from "@/stores/useSoundStore";

// ── Sound control context ──────────────────────────────────────────────────────
// Allows TimerProvider to trigger play/pause without owning the <audio> refs.

type SoundControlContextValue = {
  playEnabled: () => void;
  pauseAll: () => void;
};

const SoundControlContext = createContext<SoundControlContextValue>({
  playEnabled: () => undefined,
  pauseAll: () => undefined,
});

export function useSoundControl() {
  return useContext(SoundControlContext);
}

// ── Switch ─────────────────────────────────────────────────────────────────────

function Switch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      aria-checked={checked}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-[#6c63ff]" : "bg-secondary",
      ].join(" ")}
      id={id}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={[
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SoundBoard({ children }: { children?: React.ReactNode }) {
  const channels = useSoundStore((s) => s.channels);
  const syncWithTimer = useSoundStore((s) => s.syncWithTimer);
  const toggleChannel = useSoundStore((s) => s.toggleChannel);
  const setVolume = useSoundStore((s) => s.setVolume);
  const setSyncWithTimer = useSoundStore((s) => s.setSyncWithTimer);

  const [isOpen, setOpen] = useState(false);

  // One ref per channel — keyed by channel id.
  const audioRefs = useRef<Partial<Record<SoundChannelId, HTMLAudioElement>>>({});

  // Sync audio element volume & play/pause whenever store state changes.
  useEffect(() => {
    for (const channel of Object.values(channels)) {
      const el = audioRefs.current[channel.id];
      if (!el) continue;
      el.volume = channel.volume;

      if (channel.enabled) {
        // play() returns a Promise; ignore AbortError from rapid toggling.
        el.play().catch(() => undefined);
      } else {
        el.pause();
      }
    }
  }, [channels]);

  // ── Control functions exposed via context ────────────────────────────────────

  const playEnabled = useCallback(() => {
    for (const channel of Object.values(channels)) {
      if (!channel.enabled) continue;
      const el = audioRefs.current[channel.id];
      el?.play().catch(() => undefined);
    }
  }, [channels]);

  const pauseAll = useCallback(() => {
    for (const channel of Object.values(channels)) {
      audioRefs.current[channel.id]?.pause();
    }
  }, [channels]);

  // ── Sync with timer status ─────────────────────────────────────────────────
  // React to timer status changes directly here so we don't need to thread
  // refs or context upward into TimerProvider.
  const timerStatus = useTimerStore((s) => s.status);

  useEffect(() => {
    if (!syncWithTimer) return;

    if (timerStatus === "running") {
      playEnabled();
    } else {
      pauseAll();
    }
  }, [timerStatus, syncWithTimer, playEnabled, pauseAll]);

  const channelIds = Object.keys(channels) as SoundChannelId[];

  return (
    <SoundControlContext.Provider value={{ playEnabled, pauseAll }}>
      {/* Hidden <audio> elements — one per channel, always mounted */}
      {channelIds.map((id) => (
        <audio
          key={id}
          loop
          preload="none"
          ref={(el) => {
            if (el) {
              audioRefs.current[id] = el;
              el.volume = channels[id].volume;
            }
          }}
          src={channels[id].file}
        />
      ))}

      {/* Headphones trigger button — rendered inline with the timer */}
      <div className="relative">
        <Button
          aria-expanded={isOpen}
          aria-label="Open ambient sound board"
          onClick={() => setOpen((prev) => !prev)}
          size="icon"
          variant={isOpen ? "default" : "outline"}
          title="Ambient sounds"
        >
          <Headphones className="h-4 w-4" />
        </Button>

        {/* Slide-down panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card shadow-glow"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Ambient Sounds</span>
                </div>
                <Button
                  aria-label="Close sound board"
                  onClick={() => setOpen(false)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Channels */}
              <div className="grid gap-1 p-3">
                {channelIds.map((id) => {
                  const ch = channels[id];
                  return (
                    <div
                      className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary/60"
                      key={id}
                    >
                      {/* Emoji */}
                      <span aria-hidden="true" className="text-base leading-none">
                        {ch.emoji}
                      </span>

                      {/* Label + volume slider */}
                      <div className="min-w-0">
                        <label
                          className="block text-sm font-medium"
                          htmlFor={`sound-volume-${id}`}
                        >
                          {ch.label}
                        </label>
                        <input
                          aria-label={`${ch.label} volume`}
                          className="mt-1 h-1.5 w-full cursor-pointer accent-[#6c63ff] disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={!ch.enabled}
                          id={`sound-volume-${id}`}
                          max={1}
                          min={0}
                          onChange={(e) => setVolume(id, parseFloat(e.target.value))}
                          step={0.05}
                          type="range"
                          value={ch.volume}
                        />
                      </div>

                      {/* Toggle switch */}
                      <Switch
                        checked={ch.enabled}
                        id={`sound-toggle-${id}`}
                        onChange={() => toggleChannel(id)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Sync with timer row */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Sync with timer</p>
                  <p className="text-xs text-muted-foreground">
                    Auto-play on start, pause on stop
                  </p>
                </div>
                <Switch
                  checked={syncWithTimer}
                  id="sound-sync-toggle"
                  onChange={setSyncWithTimer}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {children}
    </SoundControlContext.Provider>
  );
}
