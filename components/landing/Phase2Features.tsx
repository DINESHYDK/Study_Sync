"use client";

/**
 * Phase2Features — landing page section showcasing the new Phase 2 additions:
 * Streaks & Gamification, Ambient Sound Board, Todo-Timer Linking,
 * Friend Comments, and the History page.
 *
 * Matches the existing dark/teal palette and FadeIn animation system.
 */

import {
  BookOpenCheck,
  CheckSquare,
  ChevronRight,
  Clock3,
  CloudOff,
  Flame,
  Link2,
  MessageSquare,
  Minus,
  Music2,
  Send,
  Volume2,
} from "lucide-react";

import { FadeIn } from "@/components/landing/FadeIn";
import { landingPalette } from "@/components/landing/palette";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Mini preview components ────────────────────────────────────────────────────

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEK_ACTIVE = [true, true, true, true, true, true, false];

function StreakPreview() {
  return (
    <div className="grid gap-4 p-1">
      {/* Streak badge row — premium amber card */}
      <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-transparent px-5 py-4">
        {/* Flame with pulsing glow ring */}
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          {/* Outer pulse ring */}
          <span className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20" />
          {/* Inner ring */}
          <span className="absolute inset-1 rounded-full bg-amber-500/10" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70">
            Current streak
          </p>
          {/* Big bold streak number with gradient text */}
          <p
            className="font-heading text-4xl font-black leading-none"
            style={{
              background: "linear-gradient(135deg, #fcd34d 0%, #fb923c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            7 days
          </p>
        </div>

        <div className="ml-auto shrink-0">
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
            🏆 Top 1%
          </Badge>
        </div>
      </div>

      {/* Week heatmap — icon cells with day labels */}
      <div className="rounded-2xl border border-amber-500/20 bg-[var(--surface)] p-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          This week
        </p>
        <div className="flex flex-col gap-1">
          {/* Day labels */}
          <div className="flex gap-1.5">
            {WEEK_DAYS.map((d, i) => (
              <div
                key={i}
                className="flex h-5 w-8 items-center justify-center sm:h-5 sm:w-10"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {d}
                </span>
              </div>
            ))}
          </div>
          {/* Icon cells */}
          <div className="flex gap-1.5">
            {WEEK_ACTIVE.map((active, i) =>
              active ? (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all sm:h-10 sm:w-10"
                >
                  <Flame className="h-4 w-4 text-amber-400" />
                </div>
              ) : (
                <div
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-strong)] transition-all sm:h-10 sm:w-10"
                >
                  <Minus className="h-4 w-4 text-muted-foreground/30" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SoundBoardPreview() {
  const sounds = [
    { label: "Rain", emoji: "🌧️", active: true },
    { label: "Forest", emoji: "🌿", active: false },
    { label: "Café", emoji: "☕", active: true },
    { label: "Waves", emoji: "🌊", active: false },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Music2 className="h-4 w-4 text-[#38bdf8]" />
        <span>Ambient Sound Board</span>
        <Badge className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
          Playing
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {sounds.map((s) => (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all",
              s.active
                ? "border-[#38bdf8]/30 bg-[#38bdf8]/8 text-[#38bdf8] shadow-[0_0_18px_rgba(56,189,248,0.12)]"
                : "border-[var(--border-strong)] bg-[var(--surface)] text-muted-foreground",
            )}
            key={s.label}
          >
            <span className="text-base">{s.emoji}</span>
            <span className="font-medium">{s.label}</span>
            {s.active && <Volume2 className="ml-auto h-3 w-3 shrink-0 animate-pulse" />}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Sounds auto-pause when your timer stops
      </p>
    </div>
  );
}

function TodoTimerPreview() {
  const tasks = [
    { label: "Solve CF 1500 Tree", time: "1h 36m", done: false },
    { label: "Read Chapter 7", time: "43m", done: true },
    { label: "Mock paper review", time: "—", done: false },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Link2 className="h-4 w-4 text-[#6c63ff]" />
        Todo-Timer Linking
      </div>
      <ul className="grid gap-2">
        {tasks.map((t) => (
          <li
            className="flex items-center gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5"
            key={t.label}
          >
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                t.done ? "border-emerald-400 bg-emerald-400" : "border-muted-foreground/40",
              )}
            >
              {t.done && <span className="text-[8px] font-bold text-white">✓</span>}
            </div>
            <span className={cn("flex-1 text-sm", t.done && "line-through text-muted-foreground")}>
              {t.label}
            </span>
            {t.time !== "—" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                {t.time}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-muted-foreground">
        Each segment knows exactly which task it powered
      </p>
    </div>
  );
}

function CommentsPreview() {
  const comments = [
    { name: "Eswar", avatar: "E", body: "4 hours already? 🔥 Let's gooo", time: "2m ago" },
    { name: "Dinesh", avatar: "D", body: "Badkov, em peekutunnav ra morning nundi?", time: "just now" },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-[#ec4899]" />
        Friend Comments
      </div>
      <ul className="grid gap-2">
        {comments.map((c) => (
          <li className="flex items-start gap-2.5" key={c.name}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6c63ff]/20 text-[11px] font-bold text-[#6c63ff]">
              {c.avatar}
            </div>
            <div className="min-w-0 flex-1 rounded-xl bg-[var(--surface-strong)] px-3 py-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">{c.time}</span>
              </div>
              <p className="text-sm leading-snug">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
      {/* Input mock */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-muted-foreground">
          Leave a comment…
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", landingPalette.softGradient)}>
          <Send className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ── Mini SVG donut chart for History wide card ─────────────────────────────────

function MiniDonutChart() {
  // Represents: Codeforces 62%, CF Tree 28%, General 10%
  const segments = [
    { color: "#6c63ff", pct: 62, label: "Codeforces" },
    { color: "#10b981", pct: 28, label: "CF 1500 Tree" },
    { color: "#f59e0b", pct: 10, label: "General" },
  ];

  const r = 44;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((s) => {
    const dashLen = (s.pct / 100) * circ;
    const arc = { ...s, dashLen, dashOffset: -offset };
    offset += dashLen;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="14"
          />
          {/* Colored arcs */}
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="14"
              strokeDasharray={`${arc.dashLen} ${circ - arc.dashLen}`}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
              style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
            />
          ))}
          {/* Centre label */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-white"
            style={{ fontSize: 13, fontWeight: 700, fill: "white" }}
          >
            2h 36m
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "rgba(255,255,255,0.45)" }}
          >
            total
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="grid w-full gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 text-xs text-muted-foreground">{s.label}</span>
            <span className="font-mono text-xs font-semibold" style={{ color: s.color }}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPreview() {
  const segments = [
    { subject: "Codeforces", time: "5:42 – 7:18 AM", dur: "1h 36m", color: "#6c63ff" },
    { subject: "CF 1500 Tree", time: "1:59 – 2:42 PM", dur: "43m", color: "#10b981" },
    { subject: "General", time: "8:46 – 9:03 AM", dur: "17m", color: "#f59e0b" },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <BookOpenCheck className="h-4 w-4 text-[#2dd4bf]" />
        Study History
        <span className="ml-auto rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-0.5 font-mono text-xs text-muted-foreground">
          Jun 13
        </span>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Segment list */}
        <div className="grid gap-2">
          {/* Mini bar chart */}
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5">
            <div className="flex flex-1 gap-1 overflow-hidden rounded-full">
              {segments.map((s) => (
                <div
                  key={s.subject}
                  className="h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: s.color,
                    flex: parseInt(s.dur) > 60 ? 3 : parseInt(s.dur) > 30 ? 2 : 1,
                  }}
                />
              ))}
            </div>
            <span className="ml-2 shrink-0 font-mono text-sm font-semibold">2h 36m</span>
          </div>

          {/* Segment rows */}
          <ul className="grid gap-1.5">
            {segments.map((s) => (
              <li
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2"
                key={s.subject}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.subject}</p>
                  <p className="text-[10px] text-muted-foreground">{s.time}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{s.dur}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Donut chart visual */}
        <div className="flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-4">
          <MiniDonutChart />
        </div>
      </div>
    </div>
  );
}

// ── Feature card definition ────────────────────────────────────────────────────

const features: {
  label: string;
  title: string;
  body: string;
  points: readonly string[];
  icon: React.ElementType;
  preview: React.ReactNode;
  accent: keyof typeof accentMap;
  wideCard?: boolean;
}[] = [
  {
    label: "Gamification",
    title: "Streaks that keep you honest.",
    body: "Build daily habits with fire streaks. Every consecutive study day adds to your streak — miss one and it resets. Badges surface in friend comparisons too.",
    points: [
      "Daily streak counter with fire badge",
      "Streak resets on missed days",
      "Visible in the friends comparison view",
      "Weekly activity heat-map",
    ],
    icon: Flame,
    preview: <StreakPreview />,
    accent: "amber",
  },
  {
    label: "Focus Sounds",
    title: "Your own ambient study room.",
    body: "Pick rain, a café, forest sounds, or ocean waves. Sounds auto-play when your timer starts and auto-pause when it stops — no manual fiddling.",
    points: [
      "4 ambient sound channels",
      "Auto-plays with the timer",
      "Individual volume per channel",
      "Persists across sessions",
    ],
    icon: Music2,
    preview: <SoundBoardPreview />,
    accent: "sky",
  },
  {
    label: "Todo-Timer Linking",
    title: "Know exactly where your hours went.",
    body: "When you start a timer segment, link it to a task. StudySync tracks time-per-task automatically. See your todo list with real study minutes logged against each item.",
    points: [
      "Link any segment to a task on start",
      "Time logged shown on each todo",
      "Visible in friend comparisons",
      "Zero extra taps when not needed",
    ],
    icon: CheckSquare,
    preview: <TodoTimerPreview />,
    accent: "violet",
  },
  {
    label: "Friend Comments",
    title: "React to your friends' sessions live.",
    body: "Open any friend's comparison card and leave a comment on their study session. They get a real-time toast notification instantly. No feed, no noise — just direct peer motivation.",
    points: [
      "Comment on any friend's session",
      "Real-time toast notification",
      "Max 280 characters per comment",
      "Live-updating thread without refresh",
    ],
    icon: MessageSquare,
    preview: <CommentsPreview />,
    accent: "pink",
  },
  {
    label: "History",
    title: "Every past session, always there.",
    body: "Browse any previous date with one tap. See the full subject breakdown chart, every segment, and your task list exactly as it was — even weeks ago.",
    points: [
      "Browse any past date",
      "Subject breakdown chart per day",
      "Full segment and task snapshot",
      "Read-only for past, editable for today",
    ],
    icon: BookOpenCheck,
    preview: <HistoryPreview />,
    accent: "teal",
    wideCard: true,
  },
];

const accentMap = {
  amber: "border-amber-500/20 bg-amber-500/6 text-amber-400",
  sky: "border-sky-500/20 bg-sky-500/6 text-sky-400",
  violet: "border-violet-500/20 bg-violet-500/6 text-violet-400",
  pink: "border-pink-500/20 bg-pink-500/6 text-pink-400",
  teal: "border-teal-500/20 bg-teal-500/6 text-teal-400",
} as const;

// ── Section ────────────────────────────────────────────────────────────────────

export function Phase2Features() {
  return (
    <section className="px-4 py-24 md:px-8 lg:px-16" id="whats-new">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <FadeIn className="mx-auto mb-16 max-w-3xl text-center">
          <p className={cn("text-sm font-bold uppercase tracking-[0.28em]", landingPalette.label)}>
            What&apos;s New
          </p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-normal md:text-4xl">
            Version 2 — Built from your feedback.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
            Five major additions shipped in one go. All of them requested by real students.
          </p>
        </FadeIn>

        {/* Feature cards — 2-col lg, 3-col xl; History spans 2 on lg+ */}
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            const accentCls = accentMap[feat.accent];

            return (
              <FadeIn
                delay={i * 0.06}
                key={feat.label}
                className={cn(feat.wideCard && "lg:col-span-2")}
              >
                <Card
                  className="group flex h-full flex-col overflow-hidden border-[var(--border-strong)] bg-[var(--surface-strong)] transition-all duration-300 hover:border-[var(--border-strong)]/80 hover:shadow-[0_0_40px_rgba(108,99,255,0.08)]"
                >
                  <CardContent className="flex flex-1 flex-col gap-5 p-6">
                    {/* Label + icon */}
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", accentCls)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-xs font-bold uppercase tracking-widest", accentCls.split(" ").at(-1))}>
                        {feat.label}
                      </span>
                    </div>

                    {/* Title + body */}
                    <div>
                      <h3 className="font-heading text-lg font-semibold leading-tight">{feat.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{feat.body}</p>
                    </div>

                    {/* Points */}
                    <ul className="grid gap-1.5 text-sm">
                      {feat.points.map((p) => (
                        <li className="flex items-center gap-2 text-foreground/80" key={p}>
                          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", accentCls.split(" ").at(-1))} />
                          {p}
                        </li>
                      ))}
                    </ul>

                    {/* Live preview */}
                    <div className="mt-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-4">
                      {feat.preview}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
