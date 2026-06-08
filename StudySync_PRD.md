# StudySync — Project Requirements Document
**Version:** 1.0  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + PostgreSQL + Realtime) · shadcn/ui  
**Target AI Agent:** Codex / Full-Stack Developer  

---

## 1. Project Overview

**StudySync** is a collaborative, publicly-visible study tracker. Users log study sessions via a timer, track tasks through a shared to-do list, and compete/compare with friends. Every session is visible to the user's friend group in real time. The core loop is:

> Start timer → study → pause timer → log subject → friends see it live → compare at end of day.

---

## 2. Tech Stack & Architecture

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | Use `app/` directory exclusively. SSR where applicable. |
| Language | TypeScript (strict mode) | No `any` types. Full type safety on all Supabase queries. |
| Styling | Tailwind CSS + CSS Variables | Dark-mode-first. Single `globals.css` design token file. |
| UI Components | shadcn/ui | Use Card, Dialog, Select, Button, Badge, Avatar, Popover, Tabs, DropdownMenu primitives. |
| Backend | Supabase | Auth, PostgreSQL (RLS), Realtime subscriptions, Edge Functions (for welcome email) |
| State Management | Zustand | One `useTimerStore`, one `useUserStore`, one `useFriendStore` |
| Timer Persistence | Supabase Realtime + localStorage | See Section 7 for timer logic |
| Animations | Framer Motion | Page transitions and timer state changes |
| Icons | Lucide React | Consistent icon set throughout |
| Date Handling | date-fns | All date formatting and arithmetic |

---

## 3. Supabase Project Setup

### 3.1 Authentication Configuration

- Enable **Email/Password** provider ONLY. Disable all OAuth providers (Google, GitHub, etc.).
- Enable **Email Confirmation** (user must verify email before first login).
- Enable **Password Reset** (email-based).
- Configure `Site URL` and `Redirect URLs` to your production/local domains.
- In Auth → Email Templates:
  - **Confirm Signup:** Custom welcome email (see Section 3.3).
  - **Reset Password:** Default Supabase template is acceptable.

### 3.2 Database Schema (Run in order)

```sql
-- ============================================================
-- EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: profiles
-- Mirrors auth.users; created automatically via trigger
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  initials        TEXT NOT NULL DEFAULT '',       -- e.g. "DY" for "Dinesh YDK"
  avatar_id       TEXT,                           -- references predefined avatar slug; NULL = use initials
  referral_code   TEXT UNIQUE NOT NULL,           -- 8-char uppercase alphanumeric
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: study_sessions
-- One row per user per calendar date
-- ============================================================
CREATE TABLE study_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,                       -- the calendar day (user's local date, sent from client)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABLE: session_segments
-- Individual start/stop blocks within a study_session
-- ============================================================
CREATE TABLE session_segments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_name  TEXT NOT NULL DEFAULT 'General',
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,                      -- NULL means timer is currently RUNNING
  duration_secs INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
      ELSE NULL
    END
  ) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: todos
-- Per-user per-date task list; visible to friends
-- ============================================================
CREATE TABLE todos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  text         TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: friend_requests
-- Initiated via referral code lookup
-- ============================================================
CREATE TABLE friend_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, requested_id)
);

-- ============================================================
-- TABLE: friendships
-- Bidirectional; one row per pair (lower UUID first for dedup)
-- ============================================================
CREATE TABLE friendships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);
```

### 3.3 Database Functions & Triggers

```sql
-- ============================================================
-- FUNCTION: generate_referral_code()
-- Generates an 8-char unique referral code
-- ============================================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: compute_initials(full_name TEXT)
-- "Dinesh YDK" -> "DY", "Alice" -> "A", "Bob Smith" -> "BS"
-- Takes first letter of each word, max 2 chars, uppercase
-- ============================================================
CREATE OR REPLACE FUNCTION compute_initials(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
  words TEXT[];
  result TEXT := '';
BEGIN
  words := string_to_array(trim(full_name), ' ');
  IF array_length(words, 1) >= 2 THEN
    result := upper(substr(words[1], 1, 1) || substr(words[array_length(words, 1)], 1, 1));
  ELSE
    result := upper(substr(words[1], 1, 1));
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: on new auth.users row -> create profile
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  name_val TEXT;
  code     TEXT;
  attempt  INT := 0;
BEGIN
  name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  LOOP
    code := generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code);
    attempt := attempt + 1;
    IF attempt > 20 THEN RAISE EXCEPTION 'Could not generate unique referral code'; END IF;
  END LOOP;

  INSERT INTO profiles (id, email, full_name, initials, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    name_val,
    compute_initials(name_val),
    code
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- FUNCTION: accept_friend_request(request_id UUID)
-- Accepts a friend request and creates bidirectional friendship
-- ============================================================
CREATE OR REPLACE FUNCTION accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
  req friend_requests%ROWTYPE;
  a   UUID;
  b   UUID;
BEGIN
  SELECT * INTO req FROM friend_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or already handled'; END IF;

  UPDATE friend_requests SET status = 'accepted' WHERE id = request_id;

  -- Ensure user_a < user_b for dedup constraint
  IF req.requester_id < req.requested_id THEN
    a := req.requester_id; b := req.requested_id;
  ELSE
    a := req.requested_id; b := req.requester_id;
  END IF;

  INSERT INTO friendships (user_a, user_b) VALUES (a, b)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.4 Row Level Security (RLS)

Enable RLS on ALL tables. Apply these policies:

```sql
-- profiles: readable by self AND friends; writable by self only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: self read-write"
  ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "profiles: friends can read"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = id)
         OR (user_b = auth.uid() AND user_a = id)
    )
  );

-- study_sessions: self + friends can read; self can write
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: self write"
  ON study_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "sessions: friends read"
  ON study_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = user_id)
         OR (user_b = auth.uid() AND user_a = user_id)
    )
  );

-- session_segments: same as sessions
ALTER TABLE session_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "segments: self write"
  ON session_segments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "segments: friends read"
  ON session_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = user_id)
         OR (user_b = auth.uid() AND user_a = user_id)
    )
  );

-- todos: self + friends can read; self can write
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos: self write"
  ON todos FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "todos: friends read"
  ON todos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a = auth.uid() AND user_b = user_id)
         OR (user_b = auth.uid() AND user_a = user_id)
    )
  );

-- friend_requests: requester and requested can see their own
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requests: participants"
  ON friend_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = requested_id);

-- friendships: both parties can read; no direct writes (use function)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships: participants read"
  ON friendships FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);
```

### 3.5 Realtime Subscriptions

Enable Realtime on these tables in the Supabase dashboard:
- `session_segments` (for live timer updates visible to friends)
- `todos` (for live task updates)
- `friend_requests` (for incoming request notifications)

---

## 4. Authentication Flow

### 4.1 Sign Up
1. User visits `/signup`.
2. Form fields: **Full Name**, **Email**, **Password** (min 8 chars), **Confirm Password**.
3. On submit → `supabase.auth.signUp()` with `options.data.full_name`.
4. Supabase triggers `handle_new_user()` → profile row created automatically.
5. Supabase sends **confirmation email** (configured in Auth → Email Templates).
6. Show: *"Check your email to verify your account."* Do NOT auto-login yet.
7. On email link click → user lands on `/auth/callback` → auto-login → redirect to `/dashboard`.
8. On first dashboard load, `profiles.onboarding_done = false` → show **Onboarding Modal** (see Section 9.2).

### 4.2 Login
- Route: `/login`
- Fields: **Email**, **Password**, **Forgot password?** link
- On success → `/dashboard`
- On failure → show inline error from Supabase

### 4.3 Password Reset
- `/forgot-password`: email input → `supabase.auth.resetPasswordForEmail()`
- `/auth/update-password`: new password form → `supabase.auth.updateUser({ password })`

### 4.4 Session Handling
- Use `supabase.auth.onAuthStateChange()` in a root layout provider.
- Protect all routes under `/(app)/` with a middleware check (`middleware.ts`).
- On token refresh failure → redirect to `/login`.

---

## 5. File & Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── auth/
│   │       ├── callback/route.ts        ← Supabase auth callback handler
│   │       └── update-password/page.tsx
│   ├── (app)/                           ← Protected routes
│   │   ├── layout.tsx                   ← Sidebar + nav shell
│   │   ├── dashboard/page.tsx
│   │   ├── friends/
│   │   │   ├── page.tsx                 ← Friends list
│   │   │   └── [friendId]/page.tsx      ← Side-by-side comparison
│   │   └── settings/page.tsx
│   ├── layout.tsx                       ← Root layout, providers
│   └── globals.css
├── components/
│   ├── timer/
│   │   ├── TimerPanel.tsx               ← Main dashboard timer UI
│   │   ├── TimerPopup.tsx               ← Floating resizable popup window
│   │   └── SessionSegmentList.tsx       ← Session history display
│   ├── todos/
│   │   ├── TodoList.tsx
│   │   └── TodoItem.tsx
│   ├── friends/
│   │   ├── FriendCard.tsx
│   │   ├── AddFriendDialog.tsx
│   │   └── ComparisonView.tsx
│   ├── ui/                              ← shadcn/ui auto-generated
│   ├── avatar/
│   │   └── UserAvatar.tsx               ← Handles both image and initials fallback
│   ├── modals/
│   │   ├── OnboardingModal.tsx
│   │   └── SubjectNameModal.tsx         ← Shown when user pauses timer
│   └── providers/
│       ├── SupabaseProvider.tsx
│       └── TimerProvider.tsx
├── stores/
│   ├── useTimerStore.ts                 ← Zustand
│   ├── useUserStore.ts
│   └── useFriendStore.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    ← createBrowserClient()
│   │   └── server.ts                    ← createServerClient()
│   ├── utils.ts
│   ├── timer.ts                         ← Timer math helpers
│   └── avatars.ts                       ← Predefined avatar definitions
├── hooks/
│   ├── useTimer.ts
│   ├── useFriends.ts
│   └── useRealtime.ts
├── types/
│   └── database.ts                      ← Generated Supabase types
├── middleware.ts
└── .env.local
```

---

## 6. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Server-side only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. Timer Feature — Full Specification

This is the **core** feature. Implement it carefully.

### 7.1 Timer States

```
IDLE → RUNNING → PAUSED → RUNNING (resume) → PAUSED (end of day)
```

A **session** is one row in `study_sessions` per user per date.
A **segment** is one row in `session_segments` per resume/pause cycle.

### 7.2 Resume Button Behavior

1. Client checks if a `study_sessions` row exists for `today` (user's local date). If not, `INSERT` one.
2. Client `INSERT`s a new `session_segments` row with `started_at = NOW()`, `ended_at = NULL`, `subject_name = 'General'` (subject can be updated after pausing).
3. Local Zustand `useTimerStore` starts incrementing an elapsed counter every second.
4. The running segment's `id` is stored in `localStorage` as `active_segment_id`.

### 7.3 Pause Button Behavior

1. Client `UPDATE`s the active segment: `ended_at = NOW()`.
2. Clear `active_segment_id` from `localStorage`.
3. Timer stops.
4. **Immediately** show a **Subject Name Modal** (a small non-blocking popover/dialog):
   - Text input pre-filled with `'General'`
   - On confirm → `UPDATE session_segments SET subject_name = $1 WHERE id = $2`
   - User can dismiss without changing subject (keeps 'General')

### 7.4 Live Elapsed Timer Display

- While RUNNING: show a live HH:MM:SS counter that increments every second using `setInterval`.
- Below the counter, show **total study time today** = sum of all completed segments' `duration_secs` + current running elapsed (if any).
- Format: `2h 35m` for totals; `HH:MM:SS` for live counter.

### 7.5 Session Segment History (shown below the timer on dashboard)

For the current day, list all completed and in-progress segments in chronological order:

```
Subject Name       Time Range              Duration
─────────────────────────────────────────────────────
General            10:00 AM – 12:30 PM     2h 30m
Mathematics        2:30 PM – 5:40 PM       3h 10m
Physics            7:00 PM – ...           Running  ← if currently active
─────────────────────────────────────────────────────
                              Total:       5h 40m
```

- Time ranges use 12-hour format with AM/PM.
- Subject name is editable (click to edit) for completed segments owned by the user.
- Running segment shows a pulsing dot indicator.
- This exact table is also visible to friends on their view of the user.

### 7.6 Auto-Pause on Browser Close / Tab Hide

Implement ALL of the following event listeners when a segment is active:

```typescript
// In useTimer.ts hook:

// 1. Tab visibility change (switching tabs, minimizing)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && isRunning) {
    pauseTimer(); // calls the pause API
  }
});

// 2. Before page unload (closing browser/tab)
window.addEventListener('beforeunload', (e) => {
  if (isRunning) {
    // Use sendBeacon for reliability on tab close
    const payload = JSON.stringify({ segment_id: activeSegmentId, ended_at: new Date().toISOString() });
    navigator.sendBeacon('/api/timer/pause', new Blob([payload], { type: 'application/json' }));
  }
});

// 3. Page hide (mobile, back button)
window.addEventListener('pagehide', () => {
  if (isRunning) pauseTimer();
});
```

Also implement a **recovery check** on app load:
- On mount, check `localStorage` for `active_segment_id`.
- If found, query Supabase for that segment.
- If `ended_at IS NULL` (timer was running when browser closed), auto-set `ended_at = NOW()` and mark it as paused. Notify user: *"Your timer was automatically paused."*

### 7.7 API Route: `/api/timer/pause`

```typescript
// app/api/timer/pause/route.ts
// Handles sendBeacon calls from beforeunload
export async function POST(req: Request) {
  const { segment_id, ended_at } = await req.json();
  const supabase = createServerClient(); // use service role
  await supabase
    .from('session_segments')
    .update({ ended_at })
    .eq('id', segment_id)
    .is('ended_at', null);
  return new Response('OK');
}
```

---

## 8. Popup Timer Window

### 8.1 Concept

A small, always-on-top floating widget that mirrors the dashboard timer. Users can open it, resize it, and move it around — like the Windows Clock alarm widget. The timer continues running in the background; the popup just displays the state.

### 8.2 Implementation: Floating Overlay (Not `window.open`)

**Do NOT use `window.open()`**. Use a fixed-position, draggable, resizable React overlay instead, so that Zustand state is shared seamlessly.

```
┌──────────────────┐
│  ⏱ 01:23:45      │  ← Live counter
│  Paused / Running│
│  Today: 3h 12m   │
│  [▶ Resume] [■]  │
│                  │
└──────────────────┘
```

### 8.3 Popup Component Spec (`TimerPopup.tsx`)

- **Trigger:** A "Pop Out" button (square-arrow icon) on the dashboard timer panel.
- **State:** Controlled via `useTimerStore.isPopupOpen` boolean.
- **Position:** Fixed, bottom-right corner by default. `position: fixed; bottom: 24px; right: 24px`.
- **Draggable:** Use `@dnd-kit` or a simple `mousedown` + `mousemove` drag handler to reposition.
- **Resizable:** Minimum size `200×160px`, maximum size `400×300px`. Use a small resize handle (⊞ icon) at the bottom-right corner of the popup.
- **Persistent position:** Save `{ x, y, width, height }` to `localStorage` key `timer_popup_state`.
- **UI:** Must visually match the main app theme exactly — same fonts, colors, dark theme, border radius. Not a separate design system.
- **Dismiss:** An × button in the top-right of the popup. Closing the popup does NOT pause the timer.
- **Controls:** Contains Resume/Pause button and displays live elapsed time and today's total.
- **Z-index:** `z-[9999]` so it floats above all content.

---

## 9. Friends System

### 9.1 Settings Page — Referral Code

- Display the user's 8-character referral code in a styled card.
- A "Copy" button copies the code to clipboard.
- A text input to paste a friend's referral code + "Add Friend" button.
- On "Add Friend":
  1. Query `profiles WHERE referral_code = inputCode`.
  2. If not found → show "Invalid code."
  3. If found AND already friends → show "Already friends."
  4. If found AND request already pending → show "Request already sent."
  5. Otherwise → `INSERT INTO friend_requests (requester_id, requested_id)`.
  6. Show success: "Friend request sent!"

### 9.2 Incoming Requests (Settings Page)

- A section "Friend Requests" listing incoming pending requests.
- Each shows: avatar/initials + full_name + "Accept" / "Decline" buttons.
- Accept → calls `accept_friend_request(id)` RPC.
- Subscribe to `friend_requests` Realtime to get live notifications (badge on Settings nav link).

### 9.3 Friends List Page (`/friends`)

- Grid of friend cards: avatar + name + today's total study time + number of tasks done today.
- Real-time updates via Supabase subscription on `session_segments` and `todos`.
- Each card is clickable → navigates to `/friends/[friendId]`.
- Empty state: "No friends yet. Share your referral code from Settings!"

### 9.4 Friend vs. You Comparison Page (`/friends/[friendId]`)

**Layout:** Side-by-side, 2-column grid. Left = You, Right = Friend.

**Date Selector:**
- A date picker at the top (default: today).
- On date change, re-fetch data for both users.

**Per-Column Content (for each user):**
- Name + avatar
- Total study time for that date (HH:MM:SS or `Xh Ym`)
- Session segment table (same format as Section 7.5)
- To-do list for that date (with checkmarks; friend's todos are read-only)

**Winner Banner:**
- A `<Select>` dropdown with two options:
  - `"Total Study Time"` — compares `SUM(duration_secs)` for the day
  - `"Tasks Completed"` — compares `COUNT(*) WHERE is_completed = true`
- Beneath the select: a large styled banner:
  ```
  🏆 Dinesh wins by 1h 23m!
  ```
  or `🤝 It's a tie!`
- Animate the winner's column with a subtle golden glow effect.

---

## 10. To-Do List Feature

### 10.1 Dashboard Todo Panel

- Located below the session segment history on the dashboard.
- Shows todos for **today** only by default.
- Controls: text input + "Add" button.
- Each todo item: checkbox + text + delete icon.
- On checkbox toggle → `UPDATE todos SET is_completed = $1`.
- Drag-to-reorder using `@dnd-kit/sortable` (updates `sort_order`).
- **Visible to friends** (read-only for non-owners).

### 10.2 Todo Rules

- Max 20 todos per user per day (enforce client-side + DB CHECK constraint).
- Text max 200 characters.
- Completed items shown with strikethrough, moved to bottom of list.

---

## 11. Avatar System

### 11.1 Predefined Avatars

Create 12 predefined avatars defined in `/lib/avatars.ts`. Each avatar is an object:

```typescript
export const AVATARS = [
  { id: 'fox',       emoji: '🦊', label: 'Fox' },
  { id: 'rocket',    emoji: '🚀', label: 'Rocket' },
  { id: 'owl',       emoji: '🦉', label: 'Owl' },
  { id: 'dragon',    emoji: '🐉', label: 'Dragon' },
  { id: 'robot',     emoji: '🤖', label: 'Robot' },
  { id: 'ninja',     emoji: '🥷', label: 'Ninja' },
  { id: 'astronaut', emoji: '👨‍🚀', label: 'Astronaut' },
  { id: 'wizard',    emoji: '🧙', label: 'Wizard' },
  { id: 'panda',     emoji: '🐼', label: 'Panda' },
  { id: 'tiger',     emoji: '🐯', label: 'Tiger' },
  { id: 'phoenix',   emoji: '🔥', label: 'Phoenix' },
  { id: 'ghost',     emoji: '👻', label: 'Ghost' },
];
```

### 11.2 `UserAvatar` Component Logic

```typescript
// If profile.avatar_id is set:
//   → Render the corresponding emoji in a colored circle
// If profile.avatar_id is null:
//   → Render profile.initials in a colored circle
//   → Color is deterministic based on user id (hashed to one of 8 accent colors)
```

### 11.3 Avatar Picker (Settings Page)

- A grid of all 12 avatars + a "None (use initials)" option.
- Selected avatar has a highlighted border.
- On select → `UPDATE profiles SET avatar_id = $1`.

---

## 12. Onboarding Modal

Shown automatically on first login (`profiles.onboarding_done = false`).

**Content:**
```
Welcome to StudySync! 👋

Here's how to get started:

1. 📋 Your Referral Code is [XXXXXXXX]  ← show it here
   Share this code with friends so they can add you.

2. ➕ To add a friend, go to Settings → paste their referral code.

3. ⏱ Hit "Resume" on the dashboard when you start studying.
   Hit "Pause" when you take a break.

4. 👥 In the Friends tab, you can see everyone's progress live.

5. 🏆 Click a friend's name for a head-to-head comparison!

[Got it! Let's start →]
```

On dismiss → `UPDATE profiles SET onboarding_done = true`.

---

## 13. UI Design System

### 13.1 Theme

- **Mode:** Dark-first. A light mode toggle is NOT required for v1.
- **Background:** `#0a0a0f` (near-black with slight blue tint)
- **Surface:** `#12121a`
- **Card:** `#1a1a27`
- **Border:** `#2a2a3d`
- **Accent / Primary:** `#6c63ff` (electric violet)
- **Success:** `#22c55e`
- **Warning:** `#f59e0b`
- **Destructive:** `#ef4444`
- **Text Primary:** `#f0f0ff`
- **Text Muted:** `#7878a3`

### 13.2 Typography

- **Headings:** `font-family: 'Space Grotesk', sans-serif` — clean, techy
- **Body:** `font-family: 'Inter', sans-serif`
- **Timer Numbers:** `font-family: 'JetBrains Mono', monospace` — for the countdown

Load all three from Google Fonts in the root layout.

### 13.3 Component Styling Guidelines

- All cards: `rounded-2xl`, `border border-[var(--border)]`, subtle shadow.
- Buttons: Rounded `rounded-xl`, primary uses accent gradient `from-[#6c63ff] to-[#a855f7]`.
- Resume button: Green glow pulse animation when active.
- Pause button: Red, visible only when timer is running.
- All modals: Backdrop blur `backdrop-blur-md`, centered, max-w-md.
- Sidebar: Collapsible on mobile, fixed on desktop.

### 13.4 Sidebar Navigation

```
StudySync Logo
────────────
⏱ Dashboard
👥 Friends
⚙️ Settings
────────────
[User Avatar + Name]
[Logout]
```

---

## 14. Page-by-Page Specification

### 14.1 `/dashboard`

Sections (top to bottom):
1. **Header:** "Good morning/evening, [Name]" + date
2. **Timer Panel:** (Resume/Pause button) + live counter + today's total
3. **Pop-Out Button:** Opens `TimerPopup`
4. **Session History Table:** All segments for today
5. **Todo List Panel:** Today's tasks
6. **Friends Activity Strip:** Horizontal scroll of friend cards showing their live status (running / last seen Xm ago)

### 14.2 `/friends`

- Page title: "Your Study Group"
- Grid of friend cards (see Section 9.3)
- "Add Friend" button → opens `AddFriendDialog`
- Pending request count badge if any incoming requests

### 14.3 `/friends/[friendId]`

- Back button
- Date picker
- Side-by-side layout (see Section 9.4)

### 14.4 `/settings`

Sections:
1. **Profile:** Name (editable), Email (read-only), Avatar picker
2. **Your Referral Code:** Styled code display + copy button
3. **Add a Friend:** Input field + submit button
4. **Incoming Requests:** List with Accept/Decline
5. **Account:** Change Password (redirects to password reset flow), Danger Zone (Delete Account)

---

## 15. Realtime Architecture

Use Supabase Realtime channels in a root `useRealtime.ts` hook that is initialized once on login.

```typescript
// Subscribe when user logs in:

const channel = supabase
  .channel('app-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'session_segments',
    filter: `user_id=in.(${friendIds.join(',')})`, // friend IDs only
  }, (payload) => {
    // Update friend's timer state in useFriendStore
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'todos',
    filter: `user_id=in.(${friendIds.join(',')})`,
  }, (payload) => {
    // Update friend's todo state
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'friend_requests',
    filter: `requested_id=eq.${currentUserId}`,
  }, (payload) => {
    // Show notification toast: "Someone sent you a friend request!"
    // Increment badge on Settings nav
  })
  .subscribe();
```

Unsubscribe on logout.

---

## 16. Edge Cases & Business Logic

| Scenario | Behavior |
|---|---|
| User opens app at 11:50 PM with timer running, crosses midnight | Auto-pause at midnight. The segment ending is capped at 23:59:59. New day starts fresh. |
| User navigates away from dashboard (but stays on the app) | Timer continues running; popup shows live state if open. |
| Two devices logged in simultaneously | Second device detects active segment from DB on mount and resumes local state. Only one segment runs at a time — if device 2 tries to resume, check DB for existing open segment first. |
| User deletes account | CASCADE DELETE removes all sessions, segments, todos, friendships, requests. Auth user is also deleted via Supabase admin. |
| Timer has been running > 12 hours (forgotten) | Show a warning toast: "Your timer has been running for over 12 hours. Did you forget to pause?" Check on every app focus event. |
| Friend removes you | Friendship row deleted → their data becomes invisible per RLS. |
| Referral code used on self | Check `requester_id != requested_id` before inserting friend request. Show: "You can't add yourself." |

---

## 17. Notifications & Toasts

Use `sonner` or shadcn/ui `toast` for all toasts. Rules:

- Timer auto-paused → "Timer auto-paused (tab hidden)" — info toast
- Friend request received → "🙋 [Name] sent you a friend request!" — persistent toast with Accept/Decline buttons
- Friend request accepted → "🎉 You and [Name] are now friends!" — success toast
- Subject saved → "✅ Subject updated" — brief success toast
- Copy referral code → "📋 Code copied!" — brief success

---

## 18. Deployment Checklist

1. Run all SQL from Section 3.2 and 3.3 in Supabase SQL Editor in order.
2. Enable RLS policies from Section 3.4.
3. Enable Realtime for `session_segments`, `todos`, `friend_requests` in Supabase → Database → Replication.
4. Configure Auth settings: Email/Password only, confirm email enabled, configure redirect URLs.
5. Set all env vars in Vercel (or your host).
6. Run `npx supabase gen types typescript --project-id YOUR_ID > types/database.ts` to generate types.
7. Verify `sendBeacon` to `/api/timer/pause` works from Chrome and Firefox with network throttle.
8. Test RLS: log in as two different users and confirm User A cannot read User B's data unless they are friends.

---

## 19. Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.4.0",
    "zustand": "^4.5.2",
    "framer-motion": "^11.2.0",
    "date-fns": "^3.6.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "lucide-react": "^0.395.0",
    "sonner": "^1.5.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  }
}
```

Run `npx shadcn@latest init` and then add: `button card dialog select tabs input badge avatar separator dropdown-menu popover tooltip`.

---

*End of PRD — StudySync v1.0*
