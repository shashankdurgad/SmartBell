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
- Transitions API for non-urgent updates
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
| **Workout Store** | Active workout session, current exercise, timer state, RPE tracking |
| **WeeklyPlan Store** | Generated weekly plans, saved plans, plan configuration, active day selection |
| **User Store** | User preferences, settings, equipment availability |

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
// Database tables
exercises      → 800+ pre-loaded exercises with applicability scores
weeklyPlans    → User-saved weekly workout plans
dailyWorkouts  → Individual day workouts within plans
workouts       → Completed workout session history
settings       → User preferences and configuration
```

---

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first CSS framework |
| **Headless UI** | Accessible, unstyled UI components |
| **Recharts** | Data visualization and charts |

**Why Tailwind CSS?**
- Rapid prototyping with utility classes
- Consistent design system through configuration
- Small production bundle with PurgeCSS
- No context switching between CSS and JSX files

**Why Headless UI?**
- Fully accessible (WAI-ARIA compliant) out of the box
- Unstyled—complete design freedom with Tailwind
- Handles complex interactions (modals, dropdowns, tabs)
- Official Tailwind Labs product with first-class support

---

### Utilities

| Technology | Purpose |
|------------|---------|
| **React Hook Form** | Form state management and validation |
| **Zod** | Runtime schema validation |
| **date-fns** | Date manipulation and formatting |

**Why React Hook Form?**
- Minimal re-renders through uncontrolled inputs
- Built-in validation with excellent Zod integration
- Small bundle size (~8KB)
- TypeScript-first design

**Why Zod?**
- TypeScript-first schema validation
- Runtime validation for user inputs
- Automatic TypeScript type inference
- Composable schemas for complex data structures

---

## System Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  WeeklyPlan  │  │    Tracker   │  │  Analytics   │       │
│  │  Generator   │  │  Components  │  │  Components  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  WeeklyPlan  │  │    Weight    │  │   Progress   │       │
│  │  Generator   │  │ Recommender  │  │   Analyzer   │       │
│  │   Engine     │  │    Engine    │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │    Split     │  │    Volume    │                         │
│  │   Selector   │  │   Balancer   │                         │
│  └──────────────┘  └──────────────┘                         │
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
│  │  Exercises   │  │ WeeklyPlans  │  │   Workouts   │       │
│  │  (800+ pre-  │  │  (User saved │  │  (Session    │       │
│  │   loaded)    │  │    plans)    │  │   history)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**UI Layer (React Components)**
- Render user interface
- Handle user interactions
- Display data from stores
- No business logic—only presentation

**Business Logic Layer (Engines)**
- WeeklyPlan Generator Engine: Creates weekly workout plans based on days per week
- Split Selector: Chooses optimal workout split based on training frequency
- Volume Balancer: Ensures all muscle groups receive adequate weekly volume
- Weight Recommender Engine: Suggests weights based on performance history
- Progress Analyzer: Calculates trends, PRs, and analytics

**State Management Layer (Zustand)**
- Manage application state
- Bridge between UI and data layers
- Handle state updates and subscriptions

**Data Layer (Dexie/IndexedDB)**
- Persist data locally
- Handle CRUD operations
- Maintain data integrity

---

## Project Structure

```
src/
├── components/              # React UI components
│   ├── Generator/           # Weekly plan creation UI
│   │   ├── DaysPerWeekSelector.tsx
│   │   ├── ConstraintForm.tsx
│   │   ├── WeeklyPlanDisplay.tsx
│   │   ├── DailyWorkoutCard.tsx
│   │   ├── WeeklySummary.tsx
│   │   └── ExerciseCard.tsx
│   ├── Tracker/             # Workout logging UI
│   │   ├── ActiveWorkout.tsx
│   │   ├── SetLogger.tsx
│   │   ├── RestTimer.tsx
│   │   └── DaySelector.tsx
│   ├── Analytics/           # Progress charts & stats
│   │   ├── ProgressChart.tsx
│   │   ├── VolumeChart.tsx
│   │   ├── WeeklyVolumeBalance.tsx
│   │   └── PRList.tsx
│   └── Library/             # Exercise browser
│       ├── ExerciseList.tsx
│       └── ExerciseDetail.tsx
│
├── engine/                  # Core business logic
│   ├── weeklyPlanGenerator.ts   # Weekly plan creation algorithm
│   ├── splitSelector.ts         # Workout split selection
│   ├── volumeBalancer.ts        # Weekly volume distribution
│   ├── dailyRoutineGenerator.ts # Single day routine creation
│   ├── exerciseScorer.ts        # Applicability scoring
│   ├── weightRecommender.ts     # Weight suggestion logic
│   └── progressAnalyzer.ts      # Analytics calculations
│
├── stores/                  # Zustand state stores
│   ├── useWorkoutStore.ts
│   ├── useWeeklyPlanStore.ts
│   └── useUserStore.ts
│
├── database/                # Dexie.js database setup
│   ├── db.ts                    # Database initialization
│   ├── seed.ts                  # Initial data seeding
│   ├── migrations/
│   │   └── v2-weekly-plans.ts   # Migration to weekly plan schema
│   └── repositories/
│       ├── exerciseRepo.ts
│       ├── weeklyPlanRepo.ts
│       └── workoutRepo.ts
│
├── types/                   # TypeScript definitions
│   ├── exercise.types.ts
│   ├── weeklyPlan.types.ts
│   ├── dailyWorkout.types.ts
│   ├── split.types.ts
│   └── workout.types.ts
│
├── hooks/                   # Custom React hooks
│   ├── useExercises.ts
│   ├── useWeeklyPlan.ts
│   ├── useWorkoutTimer.ts
│   └── useAnalytics.ts
│
├── utils/                   # Helper functions
│   ├── calculations.ts
│   ├── formatters.ts
│   └── validators.ts
│
└── data/                    # Static data
    ├── exercises.json           # Free Exercise DB (800+ exercises)
    ├── applicability-scores.json # Custom scoring data
    └── split-templates.json     # Workout split configurations
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
  difficulty: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation';
  force: 'push' | 'pull' | 'static';
  instructions: string[];
  images: string[];
  category: 'strength' | 'cardio' | 'stretching';
  applicability: {
    strength: number;     // 0-10
    hypertrophy: number;  // 0-10
    endurance: number;    // 0-10
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
  splitType: string;
  trainingStyle: TrainingStyle;
  totalWeeklyVolume: number;
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
  sets: number;
  reps: string;           // "8-12" or "5"
  restSeconds: number;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
```

### Workout Session

```typescript
interface WorkoutSession {
  id: string;
  weeklyPlanId: string;
  dailyWorkoutId: string;
  date: Date;
  exercises: WorkoutExercise[];
  totalVolume: number;
  duration: number;
  notes?: string;
}

interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  weight: number;
  reps: number;
  rpe: number;            // 1-10
  completed: boolean;
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

### Offline-First Design

- IndexedDB persists all data locally
- PWA service worker caches application shell
- Full functionality without internet connection
- Ideal for gym environments with poor WiFi

### Type Safety Throughout

- TypeScript for all source files
- Zod schemas for runtime validation
- Strict null checks enabled
- No `any` types allowed

---

## Deployment

### Build Process

```bash
npm run build    # Produces optimized production build
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
| Workout logging | < 2 minutes total |
| First Contentful Paint | < 1.5 seconds |
| Time to Interactive | < 3 seconds |
| Lighthouse Score | > 90 |

---

## Future Considerations

### If App Grows Popular

- **Cloud Sync**: Add optional Supabase for multi-device sync
- **Social Features**: Share weekly plans with friends
- **Premium Tier**: Advanced analytics, custom exercises
- **Mobile App**: React Native version

### Advanced Features (Post-MVP)

- AI form checker using phone camera
- Workout buddy matching
- Trainer marketplace integration
- Nutrition tracking integration
- Mesocycle and periodization planning
