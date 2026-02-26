# SmartBell — Progress Tracker

## Sprint 1: Foundation + Types — COMPLETE

### Deliverables
- [x] Project scaffolding (Vite + React + TypeScript + Tailwind v4)
- [x] Path alias `@/*` configured in tsconfig and vite.config
- [x] Dark theme with custom Tailwind v4 theme tokens
- [x] TypeScript interfaces for all data models
  - `exercise.types.ts` — Exercise, Applicability, MuscleGroup, Equipment
  - `split.types.ts` — SplitTemplate, DayTemplate, TrainingStyle, VolumeConfig
  - `weeklyPlan.types.ts` — WeeklyPlan, DailyWorkout, RoutineExercise
  - `workout.types.ts` — WorkoutSession, WorkoutSet, PersonalRecord, WeightRecommendation
- [x] Dexie.js database schema (`database/db.ts`)
  - Tables: exercises, weeklyPlans, dailyWorkouts, workoutSessions, personalRecords, settings
- [x] Database repositories
  - `exerciseRepo.ts` — CRUD, search, filtered queries
  - `weeklyPlanRepo.ts` — CRUD for weekly plans
  - `workoutRepo.ts` — CRUD, date range, exercise-based queries
- [x] Database seeding (`database/seed.ts`) — seeds 873 exercises + default settings on first load
- [x] 873 exercises loaded from Free Exercise DB (`data/exercises.json`)
  - Claude Sonnet-labelled applicability scores (strength/hypertrophy/endurance 0-10)
- [x] Split templates for 1-7 day splits (`data/split-templates.ts`)
- [x] Volume configuration per training style (`data/volume-config.ts`)
- [x] Zustand stores
  - `useUserStore` — settings (weight unit, rest timer, training style, equipment)
  - `useWeeklyPlanStore` — plan CRUD, active plan tracking
  - `useWorkoutStore` — session management, set logging, rest timer
- [x] Custom hooks
  - `useExercises` — exercise fetching with filters/search
  - `useWeeklyPlan` — plan loading and active plan access
  - `useWorkoutTimer` — countdown timer with pause/resume
  - `useAnalytics` — analytics summary with date ranges
- [x] Utility functions
  - `calculations.ts` — 1RM formulas, volume calc, ID generation
  - `formatters.ts` — date, time, weight, volume formatting
  - `validators.ts` — Zod schemas for constraints, sets, settings
- [x] Shared UI components
  - Button, Card, Input, Modal, Spinner, Badge, EmptyState, PageHeader, BottomNav
- [x] 5 page scaffolds with React Router
  - Dashboard, Generator, Workout, Library, Profile
- [x] App shell with bottom navigation, dark theme, mobile-first layout
- [x] Build passes clean (`npm run build`)

---

## Sprint 2: Plan Generator Engine — NOT STARTED

### Planned
- [ ] `WeeklyPlanGenerator` class (`engine/weeklyPlanGenerator.ts`)
- [ ] `DailyRoutineGenerator` class (`engine/dailyRoutineGenerator.ts`)
- [ ] Exercise filtering, scoring, selection algorithms
- [ ] Volume balancing across the week
- [ ] Workout scheduling with recovery optimization
- [ ] Generator input UI (training style, equipment, days, duration)
- [ ] Weekly plan display/review UI
- [ ] Save/manage generated plans

---

## Sprint 3: Workout Logging — NOT STARTED

### Planned
- [ ] Live workout tracker UI
- [ ] Set logging (weight, reps, RPE)
- [ ] Rest timer integration
- [ ] Exercise reordering/swapping during workout
- [ ] Workout session persistence
- [ ] Workout history view

---

## Sprint 4: Weight Recommendations + Charts + Deploy — NOT STARTED

### Planned
- [ ] Weight recommendation engine based on history
- [ ] Personal records tracking and detection
- [ ] Progress charts (Recharts)
- [ ] Performance dashboard/analytics
- [ ] PWA setup for offline use
- [ ] Production deployment
