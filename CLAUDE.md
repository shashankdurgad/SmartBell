# SmartBell — Workout Routine Generator

## Project Overview
Client-side SPA that generates personalized weekly workout plans and tracks fitness progress. No backend — all data stored locally in IndexedDB via Dexie.js.

## Tech Stack
- **Frontend**: React 18 + TypeScript 5 + Vite 5
- **State**: Zustand (3 stores: workout, weeklyPlan, user)
- **Database**: Dexie.js (IndexedDB) — tables: exercises, weeklyPlans, dailyWorkouts, workoutSessions, personalRecords, settings
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin, NOT PostCSS)
- **UI**: Headless UI, Recharts
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM
- **Utilities**: date-fns

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build (runs `tsc -b && vite build`)
- `npx tsc --noEmit` — type check only

## Project Structure
```
src/
├── components/           # React UI components
│   ├── Generator/        # Weekly plan creation UI (Sprint 2)
│   ├── Tracker/          # Workout logging UI (Sprint 3)
│   ├── Analytics/        # Progress charts (Sprint 4)
│   ├── Library/          # Exercise browser
│   └── shared/           # Button, Card, Input, Modal, Spinner, Badge, EmptyState, PageHeader, BottomNav
├── engine/               # Core algorithms (Sprint 2+)
├── stores/               # Zustand: useWorkoutStore, useWeeklyPlanStore, useUserStore
├── database/             # Dexie DB: db.ts, seed.ts, repositories/
├── types/                # All TypeScript interfaces (exercise, split, weeklyPlan, workout)
├── hooks/                # useExercises, useWeeklyPlan, useWorkoutTimer, useAnalytics
├── utils/                # calculations.ts, formatters.ts, validators.ts (Zod schemas)
├── data/                 # split-templates.ts, volume-config.ts
└── pages/                # DashboardPage, GeneratorPage, WorkoutPage, LibraryPage, ProfilePage
```

## Sprint Progress
- **Sprint 1 (Foundation + Types)**: DONE — app boots, DB schema, types, stores, hooks, pages, shared UI, 873 exercises loaded with applicability scores
- **Sprint 2 (Plan Generator)**: NOT STARTED — exercise DB ready, next up
- **Sprint 3 (Workout Logging)**: NOT STARTED
- **Sprint 4 (Weight Recs + Charts + Deploy)**: NOT STARTED

## Key Design Decisions
- Dark theme: bg `#0a0e1a`, blue accent `#3b82f6`, mobile-first with bottom nav
- Exercise data: 873 exercises from Free Exercise DB loaded in `src/data/exercises.json` with Claude-labelled applicability scores; `seed.ts` reads scores directly from JSON (no heuristic)
- Split templates: all 7 variants (1-7 days/week) defined in `src/data/split-templates.ts`
- Volume config per training style in `src/data/volume-config.ts`
- Path alias `@/*` → `src/*` configured in both tsconfig and vite.config.ts

## Conventions
- MVP approach: ship working code, don't over-engineer
- No CI/CD, no E2E tests, no accessibility audits for MVP
- Tailwind v4 uses `@import "tailwindcss"` and `@theme {}` blocks (NOT `@tailwind` directives or `tailwind.config.js`)
- All types exported via `src/types/index.ts` barrel file
- Shared UI components exported via `src/components/shared/index.ts`
