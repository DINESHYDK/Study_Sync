# StudySync Implementation Notes

## Milestone 0 - PRD Readthrough

I read `StudySync_PRD.md` and found the workspace is greenfield: only the PRD existed before implementation started. I am building the app as a Next.js 14 App Router project with TypeScript, Tailwind, Supabase, Zustand, Framer Motion, date-fns, dnd-kit, Lucide, Sonner, and shadcn-style UI primitives.

Key decisions:

- Keep the requested misspelled filename `Docuemntation.md` so it matches the user instruction exactly.
- Build the documented folder structure directly instead of using a generator in a nested directory.
- Make Supabase the real data path, but keep the UI buildable when environment variables are missing by surfacing setup states and using a minimal local timer/todo fallback for development previews.
- Treat the timer as the first-class core: central Zustand store, one provider-owned lifecycle, localStorage recovery, sendBeacon pause route, and shared timer state for the popup.
- Add a `supabase/schema.sql` deployment asset with tables, functions, policies, and the missing todo-count trigger needed to enforce the PRD's 20-todo daily rule at the database level.

## Milestone 1 - Project Scaffold

Created the base Next/Tailwind/TypeScript project files and dependency manifest. The design tokens will live in `app/globals.css`, while reusable UI primitives will live under `components/ui`.

## Milestone 2 - Shared Foundation

Added the dark-first CSS variable theme from the PRD, TypeScript Supabase table types, timer formatting helpers, predefined avatar options, and shadcn-style primitives for buttons, cards, dialogs, selects, tabs, popovers, dropdowns, tooltips, badges, avatars, inputs, and separators.

The UI layer is intentionally thin: feature components should own behavior while primitives only handle consistent styling and accessible interaction defaults.
