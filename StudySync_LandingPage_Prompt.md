# Task: Build the StudySync Landing Page

## Context

StudySync is a collaborative study tracker. The app is already fully built with a working dashboard, timer, friends system, todos, and comparison features. You are building **only the public landing page** — the first thing visitors see before logging in. It lives at `app/page.tsx` (the root route, outside the `(app)/` protected group).

---

## Design System (must match the existing app exactly)

```css
/* These CSS variables are already defined in globals.css — use them */
--background:    #0a0a0f
--surface:       #12121a
--card:          #1a1a27
--border:        #2a2a3d
--accent:        #6c63ff   /* electric violet — primary CTA color */
--accent-2:      #a855f7   /* purple — for gradients */
--success:       #22c55e
--text-primary:  #f0f0ff
--text-muted:    #7878a3
```

**Fonts (already loaded in root layout):**
- Headings: `Space Grotesk` (bold, tight tracking)
- Body: `Inter`
- Monospace / timers: `JetBrains Mono`

**Rules:**
- Dark background throughout. No white sections.
- All buttons and CTAs use accent gradient: `from-[#6c63ff] to-[#a855f7]`
- Cards: `bg-[#1a1a27]`, `border border-[#2a2a3d]`, `rounded-2xl`
- No stock photo images. Use emojis, inline SVG icons (Lucide React), or CSS-drawn mockups where visuals are needed.
- shadcn/ui for every interactive component. Do not write raw HTML buttons, inputs, or dialogs.

---

## File Location

```
app/page.tsx              ← The entire landing page lives here
components/landing/       ← All landing-page-specific components go here
  ├── Navbar.tsx
  ├── HeroSection.tsx
  ├── FeaturesGrid.tsx
  ├── HowItWorks.tsx
  ├── FeatureSpotlight.tsx  (repeatable section used multiple times)
  ├── ComparisonPreview.tsx
  ├── TimerPreview.tsx
  ├── FriendActivityPreview.tsx
  └── Footer.tsx
```

`app/page.tsx` simply imports and stacks all sections. No logic lives in `page.tsx`.

---

## Navbar

**Component:** `components/landing/Navbar.tsx`

- Fixed top, `backdrop-blur-md`, `bg-[#0a0a0f]/80`, `border-b border-[#2a2a3d]`
- Left: Logo image (`/logo.png`, 32×32) + "StudySync" wordmark in Space Grotesk bold
- Right: shadcn `Button` variant="ghost" → **Log In** (links to `/login`) + shadcn `Button` with accent gradient → **Get Started Free** (links to `/signup`)
- Mobile: hide "Log In" on small screens, keep only "Get Started Free"
- Smooth scroll links: `Features`, `How It Works`, `Compare` (anchor links to section IDs)
- `sticky top-0 z-50`

---

## Section 1 — Hero

**Component:** `components/landing/HeroSection.tsx`

**Layout:** Centered, full-viewport-height (`min-h-screen`), flex column center.

**Content (top to bottom):**

1. A subtle animated badge using shadcn `Badge`:
   ```
   ✨ Built for serious students
   ```
   Styled: `bg-[#6c63ff]/10 text-[#a78bfa] border border-[#6c63ff]/30 rounded-full px-4 py-1`

2. **H1 Headline** (Space Grotesk, bold, large — `text-5xl md:text-7xl`, tight tracking):
   ```
   Study Smarter.
   Compete Together.
   ```
   The word **"Together"** gets the accent gradient: `bg-gradient-to-r from-[#6c63ff] to-[#a855f7] bg-clip-text text-transparent`

3. **Subheadline** (Inter, `text-lg md:text-xl`, `text-[#7878a3]`, max-w-xl centered):
   ```
   Track every study session, share your progress with friends in real time,
   and turn studying into a friendly competition — automatically.
   ```

4. **CTA Button Row** (centered, gap-4):
   - Primary: shadcn `Button` with gradient bg + arrow icon → **"Start Tracking Free"** → `/signup`
   - Secondary: shadcn `Button` variant="outline" → **"See How It Works"** (smooth scroll to #how-it-works)

5. **Social proof line** (small, muted, centered):
   ```
   🔒 No credit card · Email sign-up only · Free forever
   ```

6. **Hero Visual** — A CSS/Tailwind mock of the timer UI. Do NOT use a screenshot. Build it inline:
   ```
   ┌─────────────────────────────────┐
   │  ⏱ Today's Study Time           │
   │                                 │
   │     02 : 34 : 17                │  ← JetBrains Mono, large
   │                                 │
   │  [  ⏸ Pause  ]                  │  ← green glow button
   │                                 │
   │  10:00 AM – 12:30 PM  Mathematics  2h 30m  │
   │   2:30 PM –  5:17 PM  Physics       2h 47m  │
   │         7:00 PM – Now  Chemistry  Running ●  │
   └─────────────────────────────────┘
   ```
   Style it as a card (`bg-[#12121a]`, `border border-[#2a2a3d]`, `rounded-2xl`, `shadow-2xl`, `shadow-[#6c63ff]/10`).
   Add a subtle pulsing glow ring on the "Pause" button using Tailwind `animate-pulse` with a green shadow.

**Background:** A very subtle radial gradient behind the hero only:
`bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(108,99,255,0.15),transparent)]`

---

## Section 2 — Features Grid

**Component:** `components/landing/FeaturesGrid.tsx`
**Section ID:** `id="features"`

**Section label** (above title):
```
EVERYTHING YOU NEED
```
Small, spaced caps, accent color.

**Section title:**
```
One dashboard. Every habit. Shared with your crew.
```

**Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`, max-w-6xl, centered.

Build **9 feature cards**, each as a shadcn `Card` with `bg-[#1a1a27] border-[#2a2a3d] rounded-2xl p-6`. Each card has:
- A Lucide icon in an accent-tinted rounded square (`bg-[#6c63ff]/10 text-[#a78bfa]`, `rounded-xl p-2.5`, `w-10 h-10`)
- Bold title (Space Grotesk)
- Short description (Inter, muted)

**The 9 cards:**

| Icon (Lucide) | Title | Description |
|---|---|---|
| `Timer` | Smart Study Timer | Hit Resume when you start, Pause when you stop. Every second is tracked automatically. |
| `BookOpen` | Subject Tagging | Label each session with a subject — Maths, Physics, anything. See exactly where your time goes. |
| `Users` | Friend Groups | Add friends via a unique referral code. Your progress and theirs — visible to each other in real time. |
| `BarChart2` | Head-to-Head Compare | Pick a friend, pick a date, and see a side-by-side breakdown of who studied more. A winner is declared. |
| `CheckSquare` | Shared Todo Lists | Add tasks for the day. Friends can see your list and track what you've completed — full accountability. |
| `WifiOff` | Auto-Pause on Close | Shut the laptop lid, close the tab, or lose connection — the timer pauses itself. Not a single second is lost. |
| `Smartphone` | Mobile Optimised | Full-screen, touch-friendly layout. Track sessions from your phone between lectures without missing a beat. |
| `PictureInPicture2` | Floating Pop-Up Timer | Pop out a small timer widget that floats over any window. Resize it, move it — study without distractions. |
| `Trophy` | Daily Winner | At the end of each day, StudySync crowns the friend who studied the most or completed the most tasks. |

---

## Section 3 — How It Works

**Component:** `components/landing/HowItWorks.tsx`
**Section ID:** `id="how-it-works"`

**Title:** `How It Works`
**Subtitle:** `Up and running in under 2 minutes.`

**Layout:** A horizontal step flow on desktop, vertical on mobile.
Between each step, render a subtle right arrow (`ChevronRight` Lucide, muted) that hides on mobile.

**4 Steps:**

```
Step 1              Step 2               Step 3              Step 4
 📧                   👥                   ⏱                   🏆
Sign Up            Add Friends           Start Timer          Compare & Win
─────────          ──────────            ───────────          ─────────────
Create your        Share your            Hit Resume.          At day's end,
account with       referral code.        Study. Hit           see who studied
just an email.     Friends join          Pause. Done.         more — or who
Verify &           your group in         Your sessions        crushed their
you're in.         one tap.              are live.            task list.
```

Each step: numbered circle (accent gradient background), title in Space Grotesk, description in Inter muted.

---

## Section 4 — Auto-Pause Spotlight

**Component:** `components/landing/FeatureSpotlight.tsx` (used for multiple features, passes props)

**Layout:** 2-column on desktop (text left, visual right), single column on mobile. Alternates side per instance.

**Instance 1 — Auto-Pause:**

Text side:
- Label: `NEVER LOSE A SECOND`
- Title: `Closes automatically. So you don't have to think about it.`
- Body:
  ```
  Whether you slam your laptop shut, your tab crashes, or you just
  forget — StudySync detects it and pauses your timer the moment
  you're gone. When you're back, just hit Resume and keep going.
  ```
- List (use Lucide `Check` icons, accent color):
  - Detects browser tab switching
  - Pauses on laptop lid close or shutdown
  - Recovers lost session on next login
  - Works even without internet (syncs on reconnect)

Visual side: A CSS card mockup showing:
```
┌──────────────────────────────┐
│  ⚠️  Timer Auto-Paused        │
│                               │
│  Your session was saved at    │
│  5:42 PM when your browser   │
│  closed.                      │
│                               │
│  Session total: 1h 42m        │
│                               │
│  [ ▶ Resume Session ]         │
└──────────────────────────────┘
```
Animate with Framer Motion: fade-in-up on scroll entry.

---

## Section 5 — Friend Comparison Spotlight

**Instance 2 of FeatureSpotlight (text right, visual left):**

Text side:
- Label: `FRIENDLY COMPETITION`
- Title: `See exactly who's putting in the work.`
- Body:
  ```
  Pick any friend, pick any date. StudySync shows a full side-by-side
  breakdown — every session, every task, every subject. One of you
  wins. No arguments.
  ```
- List:
  - Compare by total study time
  - Compare by tasks completed
  - Choose any past date
  - Real-time live updates during the day

Visual side: A CSS mock of the comparison view:
```
┌────────────────────────────────────────────────────┐
│  📅 Today                   [Total Time ▾]          │
│                                                     │
│  ┌──────────────┐    VS    ┌──────────────────┐    │
│  │   You        │          │   Arjun          │    │
│  │   🧙 Wizard   │          │   🚀 Rocket        │    │
│  │              │          │                  │    │
│  │   5h 23m     │          │   3h 41m         │    │
│  │   ████████░  │          │   █████░░░       │    │
│  │   8 tasks ✓  │          │   5 tasks ✓      │    │
│  └──────────────┘          └──────────────────┘    │
│                                                     │
│  🏆 You win by 1h 42m today!                        │
└────────────────────────────────────────────────────┘
```

---

## Section 6 — Popup Timer Spotlight

**Instance 3 of FeatureSpotlight:**

Text side:
- Label: `STAY IN FLOW`
- Title: `A floating timer that goes wherever you go.`
- Body:
  ```
  Pop out a compact timer widget that floats over your browser.
  Resize it, move it to any corner of your screen, and keep
  working — without keeping the full StudySync tab open.
  ```
- List:
  - Draggable and resizable widget
  - Consistent with the app's design
  - Pause and Resume right from the popup
  - Remembers its position across sessions

Visual side: A CSS mockup of the small popup widget:
```
┌─────────────────────┐
│ ⏱ StudySync    [×]  │
│                     │
│   01 : 47 : 33      │
│                     │
│   Today: 4h 12m     │
│                     │
│  [  ▶ Resume  ]     │
└─────────────────────┘
```
Draw a subtle shadow glow around it to suggest it's floating above everything.

---

## Section 7 — Mobile Optimised Section

**Full-width section, centered text, no visual mockup needed:**

- Label: `STUDY ANYWHERE`
- Title: `Built for your phone, not just your desk.`
- Body:
  ```
  Full-screen mobile layout. Touch-optimised buttons. One tap to
  start your timer between classes. Your friends see your progress
  the moment you resume — from any device.
  ```
- Three shadcn `Badge` pills in a row:
  - `📱 Responsive` · `⚡ Fast` · `🌙 Dark Mode`

---

## Section 8 — Final CTA Banner

Full-width section with accent gradient background (`bg-gradient-to-r from-[#6c63ff] to-[#a855f7]`), `rounded-3xl`, `mx-4 md:mx-auto max-w-5xl`, `p-12 md:p-16`:

- **Headline:** `Ready to make every study hour count?`
- **Subheadline:** `Join your study group. Start your first session in under a minute.`
- **Buttons (side by side):**
  - Primary: `bg-white text-[#6c63ff] font-bold` → **"Create Free Account"** → `/signup`
  - Secondary: `bg-white/10 text-white border border-white/20` → **"Log In"** → `/login`

---

## Footer

**Component:** `components/landing/Footer.tsx`

Simple, minimal:
- Left: Logo + tagline: `"Study hard. Study together."`
- Center: Links — `Features`, `How It Works`, `Sign Up`, `Log In`
- Right: `© 2025 StudySync`
- Top border: `border-t border-[#2a2a3d]`

---

## Animations

Use **Framer Motion** for all scroll-based reveals. Apply this wrapper component to each major section:

```tsx
// components/landing/FadeIn.tsx
'use client'
import { motion } from 'framer-motion'

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

Apply staggered delays to card grids: first card `delay=0`, second `delay=0.05`, third `delay=0.10`, etc.

---

## Mobile Responsiveness Rules

- Hero headline: `text-4xl md:text-6xl lg:text-7xl`
- All section titles: `text-2xl md:text-4xl`
- Features grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Spotlight sections: `flex-col md:flex-row`
- Navbar: hide nav links on mobile, show only CTA
- All horizontal paddings: `px-4 md:px-8 lg:px-16`
- No horizontal scroll allowed at any breakpoint

---

## shadcn Components to Use

Run before coding:
```bash
npx shadcn@latest add button card badge separator
```

Components:
- `Button` — all CTAs and nav links
- `Card`, `CardContent`, `CardHeader` — feature cards
- `Badge` — labels, step indicators, tags
- `Separator` — section dividers

Do NOT install any additional UI libraries. Stick to these four + Lucide React + Tailwind.

---

## Routing & Auth Guard

The root `app/page.tsx` is **public** — no auth check, no redirect. Anyone can view it.

If the user is already logged in, show a small banner at the top of the Navbar (inside the auth state check):
```
You're logged in → [Go to Dashboard →]
```
Use Supabase `createBrowserClient()` and `onAuthStateChange` to detect this client-side. No SSR needed here.

---

## Final Checklist for Codex

- [ ] `app/page.tsx` renders all sections in order, no logic
- [ ] Each section is its own component in `components/landing/`
- [ ] All colors use existing CSS variables, no hardcoded hex except where CSS vars aren't defined
- [ ] All CTAs link to `/signup` or `/login`
- [ ] Framer Motion `FadeIn` wraps every section
- [ ] Mobile layout tested at 375px viewport width
- [ ] No images imported — only `/logo.png` in the Navbar (already in `/public`)
- [ ] shadcn `Button`, `Card`, `Badge` used — no raw HTML equivalents
- [ ] No TypeScript errors
- [ ] No `console.log` statements left in
