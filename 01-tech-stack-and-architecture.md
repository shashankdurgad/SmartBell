# Workout App: Tech Stack & Architecture

## Overview

This document details the complete technology stack and architectural decisions for the Workout Routine Generator—a client-side single-page application that generates personalized weekly workout plans and tracks fitness progress without requiring a backend.

---

## Tech Stack

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI component framework |
| **TypeScript** | 5.x | Type safety and developer experience |
| **Vite** | 5.x | Build tool and development server |

**Why React 18?**
- Concurrent rendering for smoother UI updates
- Automatic batching for better performance
- Mature ecosystem with excellent TypeScript support

**Why TypeScript?**
- Catches bugs at compile time rather than runtime
- Self-documenting code through type definitions
- Excellent IDE support with autocomplete and IntelliSense
- Safer refactoring across the codebase

**Why Vite over Create React App?**
- 10-100x faster hot module replacement (HMR)
- Native ESM support for faster dev server startup
- Optimized production builds with Rollup
- Minimal configuration required

---

### State Management

| Technology | Purpose |
|------------|---------|
| **Zustand** | Global state management |

**Why Zustand over Redux?**
- Minimal boilerplate (~1KB vs ~8KB+ for Redux Toolkit)
- Simple API with hooks-first design
- No providers or context wrappers needed
- Sufficient for our application's state complexity

**Store Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              State Management (Zustand)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Workout    │  │  WeeklyPlan  │  │     User     │       │
│  │    Store     │  │    Store     │  │    Store     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

| Store | Responsibilities |
|-------|------------------|
| **Workout Store** | Active workout session, current exercise, rest timer state, session history |
| **WeeklyPlan Store** | Generated weekly plans, active plan, active day index (persisted to localStorage) |
| **User Store** | Weight unit, default rest time, training style, available equipment |

---

### Data Persistence

| Technology | Purpose |
|------------|---------|
| **Dexie.js** | IndexedDB wrapper for local storage |

**Why Dexie.js over localStorage?**
- Structured data with proper indexing and queries
- Storage capacity: GBs vs localStorage's 5-10MB limit
- Asynchronous operations (non-blocking)
- Transaction support for data integrity
- Complex queries with filtering and sorting

**Database Schema:**

```typescript
// Database tables (Dexie v6 schema)
exercises        → 873 pre-loaded exercises with applicability scores
weeklyPlans      → User-saved weekly workout plans
dailyWorkouts    → Individual day workouts within plans
workoutSessions  → Completed workout session history
personalRecords  → Per-exercise PRs (weight, reps, volume, estimated 1RM)
settings         → App settings (weight unit, default rest, training style)
userPreferences  → Generator preferences (equipment, difficulty, exclusions)
```

---

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS v4** | Utility-first CSS framework (via `@tailwindcss/vite` plugin) |
| **Headless UI** | Accessible, unstyled UI components (modals, transitions) |

**Why Tailwind CSS v4?**
- Rapid prototyping with utility classes
- Consistent design system via `@theme {}` blocks
- No `tailwind.config.js` or PostCSS required — uses Vite plugin directly
- Small production bundle

**Why Headless UI?**
- Fully accessible (WAI-ARIA compliant) out of the box
- Unstyled — complete design freedom with Tailwind
- Handles complex interactions (modals, dropdowns, transitions)

**Charts:**
All charts are custom SVG components — no charting library used:
- `ExerciseProgressChart.tsx` — Catmull-Rom spline line chart
- `MonthlyPRsChart.tsx` — bar chart
- `AbstractPhysiqueDiagram.tsx` — front/back silhouette heatmap

---

### Utilities

| Technology | Purpose |
|------------|---------|
| **React Hook Form** | Form state management and validation |
| **Zod** | Runtime schema validation |
| **date-fns** | Date manipulation and formatting |
| **@dnd-kit** | Drag-and-drop for plan editor |

**Why React Hook Form?**
- Minimal re-renders through uncontrolled inputs
- Built-in validation with excellent Zod integration
- TypeScript-first design

**Why Zod?**
- TypeScript-first schema validation
- Runtime validation for user inputs
- Automatic TypeScript type inference

---

## System Architecture

### Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Generator   │  │   Tracker    │  │  Analytics   │       │
│  │  Components  │  │  Components  │  │    Pages     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (TypeScript)               │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   generatePlan   │  │   weight     │  │  percentile  │   │
│  │      .ts         │  │ Recommender  │  │ Calculator   │   │
│  │ (split select,   │  │    .ts       │  │    .ts       │   │
│  │ volume balance,  │  │              │  │              │   │
│  │ exercise score)  │  │              │  │              │   │
│  └──────────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              State Management (Zustand)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Workout    │  │  WeeklyPlan  │  │     User     │       │
│  │    Store     │  │    Store     │  │    Store     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│             Data Layer (IndexedDB via Dexie)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Exercises   │  │ WeeklyPlans  │  │  Workout     │       │
│  │  (873 pre-   │  │  (user saved │  │  Sessions    │       │
│  │   loaded)    │  │    plans)    │  │  (history)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Personal    │  │   Settings / │                         │
│  │  Records     │  │ Preferences  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**UI Layer (React Components)**
- Render user interface
- Handle user interactions
- Display data from stores
- No business logic — only presentation

**Business Logic Layer (Engines)**
- `generatePlan.ts`: Split selection, set budgeting, muscle allocation, exercise scoring, daily workout construction
- `weightRecommender.ts`: Weighted linear regression on e1RM history to predict next session weight
- `percentileCalculator.ts`: Compare user e1RMs against population strength standards

**State Management Layer (Zustand)**
- Manage in-memory application state
- Bridge between UI and data layers
- Handle real-time updates (rest timer, set logging)

**Data Layer (Dexie/IndexedDB)**
- Persist all data locally on device
- Handle CRUD operations via repository pattern
- No backend or network required

---

## Project Structure

```
src/
├── components/
│   ├── Generator/
│   │   ├── GeneratorForm.tsx        # Top-level form, composes all pickers
│   │   ├── TrainingStylePicker.tsx
│   │   ├── DifficultyPicker.tsx
│   │   ├── DaySelector.tsx
│   │   ├── DurationSlider.tsx
│   │   ├── EquipmentPicker.tsx
│   │   ├── ExerciseExcluder.tsx
│   │   ├── PlanPreview.tsx          # Generated plan display
│   │   └── PlanEditor.tsx           # Drag-and-drop plan editor
│   ├── Tracker/
│   │   ├── ActiveWorkout.tsx        # Full workout UI (SetLogger + RestTimer inline)
│   │   └── WorkoutComplete.tsx
│   ├── charts/
│   │   ├── ExerciseProgressChart.tsx  # Custom SVG spline chart
│   │   ├── MonthlyPRsChart.tsx        # Custom SVG bar chart
│   │   └── AbstractPhysiqueDiagram.tsx # SVG front/back silhouette heatmap
│   └── shared/
│       ├── index.ts
│       ├── ActiveWorkoutBanner.tsx
│       ├── WorkoutCalendar.tsx      # GitHub-style volume heatmap
│       ├── BottomNav.tsx
│       ├── PageHeader.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Spinner.tsx
│       ├── Badge.tsx
│       └── EmptyState.tsx
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── GeneratorPage.tsx
│   ├── WorkoutPage.tsx
│   ├── LibraryPage.tsx
│   ├── ProfilePage.tsx
│   ├── PlanDetailsPage.tsx
│   ├── ExercisePerformancePage.tsx
│   └── PerformanceAnalysisPage.tsx
│
├── engine/
│   ├── generatePlan.ts          # Weekly plan generation algorithm
│   ├── weightRecommender.ts     # Weight suggestion via regression
│   └── percentileCalculator.ts  # Strength percentile comparisons
│
├── stores/
│   ├── useWorkoutStore.ts
│   ├── useWeeklyPlanStore.ts
│   └── useUserStore.ts
│
├── database/
│   ├── db.ts                    # Dexie schema (v6, 7 tables)
│   ├── seed.ts                  # Seeds 873 exercises + 6 months sample data
│   └── repositories/
│       ├── exerciseRepo.ts
│       ├── weeklyPlanRepo.ts
│       ├── workoutRepo.ts
│       └── personalRecordRepo.ts
│
├── types/
│   ├── index.ts                 # Barrel export
│   ├── exercise.types.ts
│   ├── split.types.ts
│   ├── weeklyPlan.types.ts      # WeeklyPlan, DailyWorkout, RoutineExercise
│   └── workout.types.ts         # WorkoutSession, WorkoutSet, PersonalRecord
│
├── hooks/
│   ├── useExercises.ts
│   ├── useWeeklyPlan.ts
│   ├── useWorkoutTimer.ts
│   ├── useAnalytics.ts
│   └── useMuscleGroupPercentiles.ts
│
├── utils/
│   ├── calculations.ts          # 1RM formulas, unit conversion, volume
│   ├── formatters.ts            # Date, weight, duration, timer formatting
│   └── validators.ts            # Zod schemas
│
└── data/
    ├── exercises.json           # 873 exercises with applicability scores
    ├── split-templates.ts       # All 7 split variants (1-7 days/week)
    └── volume-config.ts         # Sets/reps/rest config per training style
```

---

## Data Models

### Exercise

```typescript
interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation';
  force: 'push' | 'pull' | 'static';
  instructions: string[];
  images: string[];
  category: 'strength' | 'cardio' | 'stretching' | 'powerlifting' | 'olympic_weightlifting';
  commonality: number;          // 0-1, used to prefer popular exercises
  applicability: {
    strength: number;           // 0-10
    hypertrophy: number;        // 0-10
    endurance: number;          // 0-10
  };
}
```

### Weekly Plan

```typescript
interface WeeklyPlan {
  id: string;
  name: string;
  createdAt: Date;
  daysPerWeek: number;
  trainingStyle: TrainingStyle;
  totalWeeklyVolume: number;
  estimatedWeeklyDuration: number;
  workouts: DailyWorkout[];
}

interface DailyWorkout {
  id: string;
  dayNumber: number;
  name: string;
  targetMuscles: MuscleGroup[];
  estimatedDuration: number;
  exercises: RoutineExercise[];
  suggestedDayOfWeek?: DayOfWeek;
}

interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;           // "8-12" or "5"
  restSeconds: number;
}
```

### Workout Session

```typescript
interface WorkoutSession {
  id: string;
  weeklyPlanId: string;
  dailyWorkoutId: string;
  dayNumber: number;
  dayName: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  duration: number;       // Minutes
}

interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  targetSets: number;
  personalRecord?: PRType;
}

interface WorkoutSet {
  setNumber: number;
  weight: number;
  targetReps: number;
  completedReps: number;
  rpe: number;            // 1-10
  isWarmup: boolean;
}

interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: 'weight' | 'reps' | 'volume' | 'estimated_1rm';
  value: number;
  date: Date;
  previousValue?: number;
  improvement?: number;
}
```

---

## Key Architectural Decisions

### No Backend Required

| Aspect | Implementation |
|--------|----------------|
| Logic | All algorithms run client-side in TypeScript |
| Data | Stored locally in IndexedDB |
| Authentication | None required (single-user app) |
| Cost | $0/month |

### Type Safety Throughout

- TypeScript for all source files
- Zod schemas for runtime validation at form boundaries
- Strict null checks enabled

---

## Deployment

### Build Process

```bash
npm run dev      # Start dev server
npm run build    # tsc -b && vite build
npx tsc --noEmit # Type check only
```

### Hosting Options

| Platform | Cost | Notes |
|----------|------|-------|
| Vercel | Free | Zero-config, recommended |
| Netlify | Free | Great for SPAs |
| GitHub Pages | Free | Simple static hosting |
| Cloudflare Pages | Free | Fast global CDN |

### Total Running Cost

```
Hosting:     $0 (free tier)
Database:    $0 (client-side IndexedDB)
Backend:     $0 (no backend)
─────────────────────────────
Total:       $0/month
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Weekly plan generation | < 5 seconds |
| First Contentful Paint | < 1.5 seconds |
| Time to Interactive | < 3 seconds |

---

## Future Considerations

### If App Grows Popular

- **Cloud Sync**: Add optional Supabase for multi-device sync
- **Social Features**: Share weekly plans with friends
- **Premium Tier**: Advanced analytics, custom exercises
- **Mobile App**: React Native version

### Advanced Features (Post-MVP)

- Mesocycle and periodization planning
- Nutrition tracking integration
- PWA / offline service worker
- Data export / import
