<div align="center">

<img src="./public/logo.png" alt="StudySync Logo" width="100" />

# StudySync

**A real-time collaborative study tracker built for students who compete.**

[![Next.js](https://img.shields.io/badge/Next.js_14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🎉 **50+ users acquired within 2 weeks of launch** — built by students, for students.

[Live Demo](https://studysync.dineshydk.dev) · [Report a Bug](https://github.com/DINESHYDK/Study_Sync/issues) · [Request a Feature](https://github.com/DINESHYDK/Study_Sync/issues)

</div>

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Core Features](#core-features)
- [Phase 2 Features](#phase-2-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Supabase Database Setup](#supabase-database-setup)
  - [Run Locally](#run-locally)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
  - [Timer System](#timer-system)
  - [Real-Time Data](#real-time-data)
  - [Row Level Security](#row-level-security)
- [Email Templates](#email-templates)
- [PWA Support](#pwa-support)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## About the Project

StudySync is a **publicly-visible, collaborative study tracker**. The core loop is simple:

> **Start timer → Study → Pause timer → Name your subject → Friends see it live → Compare at end of day.**

What makes it different from a regular Pomodoro app is the **social layer**. Every session is visible to your friend group in real time. You can see who's studying right now, react to their sessions, and run head-to-head comparisons at the end of the day.

It was built as a passion project and hit **50+ users within 2 weeks of its public release** — a testament to how much students wanted a tool like this.

---

## Core Features

### ⏱ Smart Study Timer

- Single-button toggle (`Start → Pause → Resume`) with live `HH:MM:SS` display
- Timer persists across browser tabs and page reloads via `localStorage` + Supabase
- Auto-pause on tab hide, page close (`sendBeacon`), and mobile background
- Crash recovery: if the browser closes unexpectedly, the active segment is auto-finalized on next load
- **Floating Popup Timer** — a draggable, resizable overlay that floats above all content so you can keep the timer visible while working in other tabs

### 📋 Session Segment History

- Every study block is recorded as a segment with a start time, end time, computed duration, and subject name
- After pausing, a subject-naming dialog appears so you can label what you just studied
- Segments are displayed in a clean table below the timer: `Subject | Time Range | Duration`
- Segments from the **last 3 days** are editable — you can decrease the duration or delete a segment if you accidentally left the timer running overnight
- An **honesty celebration modal** with confetti fires when you correct a segment, encouraging transparency

### 📝 To-Do List

- Daily task list visible to you and your friends
- Drag-to-reorder with `@dnd-kit/sortable`
- Max 20 todos per day (enforced at both the client and database level)
- Real-time updates via Supabase subscriptions

### 👥 Friends System

- Add friends using an **8-character referral code** (no email lookups needed)
- Send, accept, and decline friend requests with real-time toast notifications
- Friends page shows a live grid of who's studying right now, their total hours today, and tasks completed
- All friend data is scoped by **Row Level Security** — you can only read your friends' data

### ⚔️ Head-to-Head Comparison

- Compare any day's sessions with any friend side-by-side
- Switch the comparison metric between **Total Study Time** and **Tasks Completed**
- A winner banner with a golden glow animation declares the result
- Browse any past date for historical comparisons

### 📅 Activity Heatmap (History Page)

- A full calendar view showing your daily study activity with custom navigation (month by month)
- Active days display an animated `🔥` flame icon; inactive days show a cloud icon
- Streak counters: current streak and personal best calculated from the last 90 days
- Organic, GPU-accelerated CSS flame animations with staggered per-cell delays for a natural look

### ⚙️ Settings & Profile

- Choose from 12 predefined emoji avatars (🦊 🚀 🦉 🐉 🤖 🥷 👨‍🚀 🧙 🐼 🐯 🔥 👻)
- Update your full name and profile details
- View and copy your referral code
- Complete account deletion that purges all data from the database

---

## Phase 2 Features

Phase 2 was shipped based on real user feedback after the initial launch.

| Feature | Description |
|---|---|
| 🔥 **Streak Gamification** | Daily streak counter with fire badge. Miss a day and it resets. Visible to friends. |
| 🗓️ **Weekly Heatmap** | A 7-cell weekly activity view on both the landing page and dashboard with animated flame icons |
| 🔗 **Todo-Timer Linking** | Link any running timer segment to a specific task. Study time is logged per-task. |
| 💬 **Friend Comments** | Comment on a friend's study session. They get a real-time toast notification instantly. |
| 🗃️ **Full Session History** | Browse any past date, see the full subject breakdown chart, every segment, and task list as it was |
| 📱 **Progressive Web App** | Install StudySync as a native mobile app directly from the browser — no app store needed |
| 🎵 **Ambient Sounds** | Background soundscapes (lo-fi, rain, café noise) to enhance focus during study sessions |
| ✏️ **Segment Editing** | Edit (decrease) or delete accidental long-running timer segments with an honesty reward system |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, routing, API routes, PWA |
| **Language** | TypeScript (strict) | Full type safety across the entire codebase |
| **Styling** | Tailwind CSS + CSS Variables | Dark-first design system with custom design tokens |
| **UI Primitives** | Radix UI + shadcn/ui | Accessible Card, Dialog, Select, Popover, Tabs, Dropdown components |
| **Backend** | Supabase | PostgreSQL database, Auth, Row Level Security, Realtime |
| **State Management** | Zustand | `useTimerStore`, `useUserStore`, `useFriendStore` |
| **Animations** | Framer Motion + CSS Keyframes | Page transitions, timer state changes, flame flicker animations |
| **Drag & Drop** | @dnd-kit | Sortable todo list reordering |
| **Icons** | Lucide React | Consistent icon set throughout |
| **Date Handling** | date-fns | All date formatting and arithmetic |
| **Notifications** | Sonner | Non-blocking toast notifications |
| **Confetti** | canvas-confetti | Honesty celebration modal |
| **PWA** | @ducanh2912/next-pwa | Service worker, install prompt, offline shell |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- A **Supabase** project (free tier is sufficient)

### Environment Setup

Clone the repository and copy the example environment file:

```bash
git clone https://github.com/DINESHYDK/Study_Sync.git
cd Study_Sync
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server-side only, never exposed to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Database Setup

Run the full schema in your **Supabase SQL Editor**:

```bash
# The complete schema is in:
supabase/schema.sql
```

This single file creates:
- All tables (`profiles`, `study_sessions`, `session_segments`, `todos`, `friend_requests`, `friendships`)
- All functions (`generate_referral_code`, `compute_initials`, `handle_new_user`, `accept_friend_request`)
- The `on_auth_user_created` trigger (auto-creates a profile on signup)
- All Row Level Security (RLS) policies
- Realtime publication configuration for `session_segments`, `todos`, and `friend_requests`
- Indexes for common query patterns

#### Supabase Auth Configuration

In your Supabase dashboard → **Authentication → Settings**:
- Enable **Email/Password** provider
- Enable **Email Confirmation**
- Enable **Password Reset**
- Set `Site URL` to your production domain (or `http://localhost:3000` for local dev)
- Add your domain to **Redirect URLs**

#### Email Templates

Copy the HTML from the [`emails/`](./emails/) directory into your Supabase Auth email templates:

| File | Supabase Template |
|---|---|
| `emails/verification.html` | Confirm signup |
| `emails/password_reset.html` | Reset password |
| `emails/magic_link.html` | Magic link |
| `emails/email_change.html` | Email change |
| `emails/invite_user.html` | Invite user |

> All templates use inline HTML/CSS with no external image dependencies to ensure reliable email delivery.

#### Enable Realtime

In Supabase dashboard → **Database → Replication**, enable realtime for:
- `session_segments`
- `todos`
- `friend_requests`

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The app gracefully handles missing Supabase credentials — the UI will render with demo/mock data so you can explore the interface before configuring a database.

---

## Project Structure

```
study-sync/
├── app/
│   ├── (auth)/                         # Public auth routes
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── auth/
│   │       ├── callback/route.ts        # Supabase PKCE callback handler
│   │       └── update-password/page.tsx
│   ├── (app)/                           # Protected routes (middleware guarded)
│   │   ├── layout.tsx                   # App shell with sidebar navigation
│   │   ├── dashboard/page.tsx
│   │   ├── friends/
│   │   │   ├── page.tsx                 # Friends grid + live status
│   │   │   └── [friendId]/page.tsx      # Head-to-head comparison
│   │   ├── history/page.tsx             # Activity calendar heatmap
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── timer/pause/route.ts         # sendBeacon endpoint for tab-close pausing
│   │   └── account/delete/route.ts      # Full account deletion endpoint
│   ├── page.tsx                         # Public landing page
│   ├── layout.tsx                       # Root layout with providers
│   └── globals.css                      # Design tokens + flame animations
│
├── components/
│   ├── auth/                            # Auth form components
│   ├── avatar/UserAvatar.tsx            # Emoji avatar + initials fallback
│   ├── friends/                         # FriendCard, AddFriendDialog, ComparisonView
│   ├── landing/                         # All landing page sections
│   │   ├── Phase2Features.tsx           # Version 2 feature cards with streak preview
│   │   ├── HeroSection.tsx
│   │   └── ...
│   ├── layout/AppShell.tsx              # Sidebar, mobile nav
│   ├── modals/                          # OnboardingModal, SubjectNameModal
│   ├── providers/
│   │   ├── SupabaseProvider.tsx         # Supabase client context
│   │   └── TimerProvider.tsx            # Timer lifecycle owner (ticking, recovery, beacon)
│   ├── pwa/InstallPrompt.tsx            # PWA install banner (landing page only)
│   ├── sounds/                          # Ambient sound board components
│   ├── stats/
│   │   ├── StreakHeatmap.tsx            # Calendar heatmap with animated flames
│   │   ├── StreakBadge.tsx              # Streak badge widget
│   │   └── SubjectChart.tsx            # Donut chart for subject breakdown
│   ├── timer/
│   │   ├── TimerPanel.tsx              # Main dashboard timer UI
│   │   ├── TimerPopup.tsx              # Draggable/resizable floating overlay
│   │   ├── SessionSegmentList.tsx      # Study session history table
│   │   └── EditSegmentModal.tsx        # Segment duration editor with celebration
│   ├── todos/
│   │   ├── TodoList.tsx
│   │   └── TodoItem.tsx
│   └── ui/                             # shadcn/ui + Radix primitives
│
├── emails/                             # All Supabase Auth HTML email templates
│   ├── welcome.html
│   ├── verification.html
│   ├── password_reset.html
│   ├── streak.html                     # Streak milestone notification
│   ├── weekly_summary.html             # Weekly recap email
│   └── ...
│
├── hooks/
│   ├── useTimer.ts
│   ├── useFriends.ts
│   └── useRealtime.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient()
│   │   └── server.ts                   # createServerClient()
│   ├── avatars.ts                      # 12 predefined emoji avatar definitions
│   ├── timer.ts                        # Duration formatting helpers
│   └── utils.ts                        # cn(), todayLocalDate(), etc.
│
├── stores/
│   ├── useTimerStore.ts                # Zustand: timer state
│   ├── useUserStore.ts                 # Zustand: user profile
│   └── useFriendStore.ts              # Zustand: friends data
│
├── supabase/
│   └── schema.sql                      # Full database schema (run this once)
│
├── types/
│   └── database.ts                     # Supabase-generated TypeScript types
│
└── middleware.ts                        # Auth guard for all (app)/* routes
```

---

## Architecture Overview

### Timer System

The timer is the most critical feature and has a layered architecture:

```
User Click
    │
    ▼
TimerProvider (owner of all side effects)
    │
    ├── Supabase: INSERT session_segments { started_at, ended_at: null }
    ├── localStorage: store active_segment_id
    ├── setInterval: tick every second → update Zustand elapsed
    │
    ▼
useTimerStore (Zustand)
    │
    ├── TimerPanel.tsx ← reads elapsed, renders live HH:MM:SS
    └── TimerPopup.tsx ← reads same store, renders floating widget
```

**Recovery flow** on app load:
1. Check `localStorage` for `active_segment_id`
2. If found → query Supabase for that segment
3. If `ended_at IS NULL` → set `ended_at = NOW()`, show "Your timer was automatically paused" toast

**Tab-close safety**: `beforeunload` triggers `navigator.sendBeacon('/api/timer/pause', ...)` — a fire-and-forget HTTP POST that finalizes the segment even if the page unloads before a normal `fetch` could resolve.

### Real-Time Data

Supabase Realtime subscriptions are established in `useRealtime.ts` once a user is authenticated:

- `session_segments` → friends' timer panel updates live
- `todos` → friends' task lists update live  
- `friend_requests` → incoming request badge updates without a page refresh

All subscriptions are channel-scoped and torn down on logout.

### Row Level Security

Every table has RLS enabled. The data access model:

- **Own data**: Full read/write on all your own rows
- **Friend data**: Read-only access to friends' `profiles`, `study_sessions`, `session_segments`, and `todos`
- **Friend requests**: Only visible to the two participants
- **Friendships**: Only readable by the two users in the pair — no global friend graph exposure

Friends are checked using a `EXISTS (SELECT 1 FROM friendships WHERE ...)` subquery in every RLS policy, keeping the access model tight even if client code is modified.

---

## Email Templates

The [`emails/`](./emails/) directory contains a complete set of transactional email HTML templates — all built with inline CSS and zero external image dependencies to maximize deliverability.

| Template | Purpose |
|---|---|
| `welcome.html` | Sent after email confirmation — warmly introduces the app |
| `verification.html` | Email address confirmation (Supabase signup) |
| `password_reset.html` | Password reset link |
| `magic_link.html` | Passwordless login link |
| `email_change.html` | Email address change confirmation |
| `reauthentication.html` | Re-authentication OTP |
| `otp.html` | Generic OTP delivery |
| `invite_user.html` | Admin-sent user invitation |
| `invite.html` | Friend invitation link |
| `streak.html` | Streak milestone celebration email |
| `weekly_summary.html` | Weekly study summary digest |
| `challenge.html` | Friend challenge notification |
| `account_deleted.html` | Confirms successful account + data deletion |

> See [`emails/README.md`](./emails/README.md) for setup instructions and [`emails/design_system.md`](./emails/design_system.md) for the email visual system.

---

## PWA Support

StudySync is a **fully installable Progressive Web App**:

- Powered by [`@ducanh2912/next-pwa`](https://github.com/DuCanhGH/next-pwa) with automatic service worker generation
- Install prompt shown **only on the landing page** (not on internal app pages to avoid annoyance)
- Supports both **iOS** (Add to Home Screen) and **Android** (Install App prompt)
- The install prompt is shown once per session and never again on subsequent visits
- Offline shell: the app loads without a network connection for cached pages

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0a0a0f` | Page background |
| `--surface` | `#12121a` | Card backgrounds |
| `--surface-strong` | `#1a1a27` | Elevated cards |
| `--border` | `#2a2a3d` | All borders |
| Primary / Violet | `#6c63ff` | Buttons, active states, primary accent |
| Teal | `#2dd4bf` | Heatmap, links, success states |
| Amber | `#f59e0b` | Streaks, warnings, gamification |
| Destructive | `#ef4444` | Delete actions |

### Typography

| Role | Font | Source |
|---|---|---|
| Headings | Space Grotesk | Google Fonts |
| Body | Inter | Google Fonts |
| Timer digits | JetBrains Mono | Google Fonts |

### Animations

Custom CSS keyframe animations in `globals.css`:
- `flame-organic` — multi-keyframe `scale`, `rotate`, and `skewX` transforms anchored at `bottom center` for organic fire movement
- `flame-glow-pulse-teal` / `flame-glow-pulse-amber` — `drop-shadow` pulses for glowing fire
- Staggered per-cell `animation-delay` using the formula `(index × 137) % 1000ms` so each flame flickers independently

---

## Deployment

The app is deployed as a **static-first Next.js application** (see build output: 23 static pages). Recommended platforms:

### Vercel (Recommended)

```bash
# 1. Push to GitHub
# 2. Import the repo on vercel.com
# 3. Set the four environment variables in Project Settings → Environment Variables
# 4. Deploy
```

### Other Platforms (Netlify, Railway, etc.)

```bash
npm run build
# Output is in .next/ — deploy using the platform's Next.js adapter
```

**Build check before deploying:**

```bash
npm run build        # Must exit with code 0
npm run typecheck    # npx tsc --noEmit — must show 0 errors
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feat/your-feature`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** the branch: `git push origin feat/your-feature`
5. **Open a Pull Request**

Please follow the existing code style (TypeScript strict mode, no `any`, Tailwind for all styling).

---

<div align="center">

Built with ❤️ by **Dinesh YDK**

[Live App](https://studysync.dineshydk.dev) · [GitHub](https://github.com/DINESHYDK/Study_Sync)

</div>
