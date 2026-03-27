# SmartBell — Workout Routine Generator and Tracker

A client-side single-page application that generates personalized weekly workout plans and tracks fitness progress without requiring a backend. All data is stored locally in IndexedDB via Dexie.js.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Data Models](#data-models)
6. [Features](#features)
   - [Workout Generation](#1-workout-generation)
   - [Workout Tracking & Weight Recommendations](#2-workout-tracking--weight-recommendations)
   - [Analytics](#3-analytics)
   - [Data Flow Summary](#data-flow-summary)
7. [Deployment](#deployment)
8. [Future Considerations](#future-considerations)

---

## Tech Stack

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI component framework |
| **TypeScript** | 5.x | Type safety and developer experience |
| **Vite** | 7.x | Build tool and development server |

### State Management

| Technology | Purpose |
|------------|---------|
| **Zustand** | Global state management |

| Store | Responsibilities |
|-------|------------------|
| **Workout Store** | Active workout session, current exercise, rest timer state, session history |
| **WeeklyPlan Store** | Generated weekly plans, active plan, active day index (persisted to localStorage) |
| **User Store** | Weight unit, default rest time, training style, available equipment |

### Data Persistence

| Technology | Purpose |
|------------|---------|
| **Dexie.js** | IndexedDB wrapper for local storage |

### UI & Styling

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS v4** | Utility-first CSS framework (via `@tailwindcss/vite` plugin) |
| **Headless UI** | Accessible, unstyled UI components (modals, transitions) |

**Charts:** All custom SVG components — no charting library:
- `ExerciseProgressChart.tsx` — Catmull-Rom spline line chart
- `MonthlyPRsChart.tsx` — bar chart
- `AbstractPhysiqueDiagram.tsx` — front/back silhouette heatmap

### Utilities

| Technology | Purpose |
|------------|---------|
| **Zod** | Runtime schema validation |
| **date-fns** | Date manipulation and formatting |
| **@dnd-kit** | Drag-and-drop for plan editor |

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
│  │  Exercises   │  │ WeeklyPlans  │  │  Daily       │       │
│  │  (873 pre-   │  │  (user saved │  │  Workouts    │       │
│  │   loaded)    │  │    plans)    │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Workout     │  │  Personal    │  │  Settings /  │       │
│  │  Sessions    │  │  Records     │  │ Preferences  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
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
    ├── split-templates.ts       # All 6 split variants (1-6 days/week)
    └── volume-config.ts         # Sets/reps/rest config per training style
```

---

## Database Schema

![ER Diagram](ER%20Diagram.png)

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
  mechanic: 'compound' | 'isolation' | null;
  force: 'push' | 'pull' | 'static' | null;
  instructions: string[];
  images: string[];
  category: 'strength' | 'cardio' | 'stretching' | 'powerlifting' | 'olympic weightlifting' | 'strongman' | 'plyometrics';
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
  weeklyPlanId?: string;
  dayNumber?: number;
}
```

---

## Features

### 1. Workout Generation

#### User Input (GeneratorForm)

The user fills out `src/components/Generator/GeneratorForm.tsx` which collects:
- **Training Style** — Strength (3-6 reps), Hypertrophy (8-12 reps), Endurance (15-20 reps)
- **Difficulty** — Beginner / Intermediate / Expert
- **Days per week** — 1-6 days
- **Session duration** — 15-120 min slider
- **Available equipment** — Multi-select grouped by category (free weights, cables, machines, etc.)
- **Excluded exercises** — Autocomplete search to blacklist specific exercises

All inputs are validated by a Zod schema in `src/utils/validators.ts` before submission.

#### Split Template Selection

Based on days/week, the engine picks a pre-defined split from `src/data/split-templates.ts`:
- **1 day** → Full Body (chest 13%, lats 13%, quads 15%, etc.)
- **2 days** → Upper/Lower
- **3 days** → PPL (Push/Pull/Legs)
- **4 days** → Upper/Lower ×2 (Strength + Volume variants)
- **5 days** → ULPPL
- **6 days** → PPL ×2 (Heavy + Volume variants)

Each split defines `MuscleAllocation[]` — a list of muscle groups with percentage weights for each day.

#### Core Generation Algorithm (`src/engine/generatePlan.ts`)

**Step 1 — Set budget per day:**
`calcTotalSets()` estimates how many working sets fit in the session duration:
```
totalSets = sessionDuration × 60 / (setDuration + restTime)
```
`STYLE_CONFIG` maps training style → set duration and rest time:
- Strength: 40s sets, 180s rest → fewer sets per hour
- Hypertrophy: 60s sets, 120s rest
- Endurance: 60s sets, 60s rest → most sets per hour

**Step 2 — Allocate sets to muscles:**
`allocateSetsToMuscles()` distributes the set budget across muscle groups proportionally to their allocation percentages from the split template. Uses the **largest-remainder method** to ensure every muscle gets at least 1 set when rounding.

**Step 3 — Exercise selection per muscle:**
`queryExercises()` filters the 873-exercise DB by:
- Primary/secondary muscle match
- Available equipment
- Excluded exercise IDs
- Sorted by `applicability × commonality` score (exercises that score highest for the chosen training style and are most popular appear first)

**Step 4 — Distribute sets across exercises:**
`DIFFICULTY_CONFIG` caps how many exercises per muscle group:
- Beginner: 1 exercise/muscle, 16 max sets/session
- Intermediate: 2 exercises/muscle, 18 max sets/session
- Expert: 3 exercises/muscle, 21 max sets/session

`distributeSetsAcrossExercises()` splits the muscle's set allocation evenly across the selected exercises. Each exercise gets `{ sets, targetReps, restSeconds }` from `STYLE_CONFIG`.

**Step 5 — Build daily workouts:**
`buildDay()` assembles `DailyWorkout` objects with estimated duration:
```
estimatedDuration = Σ(sets × (setDuration + restSeconds)) / 60
```

**Step 6 — Save:**
The completed `WeeklyPlan` is saved via `weeklyPlanRepo.save()` and set as active in `useWeeklyPlanStore`.

#### Plan Preview & Editing

After generation, `src/components/Generator/PlanPreview.tsx` displays the plan with:
- Per-day exercise lists with sets × reps and estimated duration
- **Set Active**, **Edit**, **Delete**, **Regenerate** buttons

The editor (`src/components/Generator/PlanEditor.tsx`) allows:
- Drag-and-drop exercise reordering (via `@dnd-kit`)
- Adding exercises via search + muscle group filter
- Editing sets/reps per exercise inline
- Estimated durations recalculated dynamically on every change

---

### 2. Workout Tracking & Weight Recommendations

#### Starting a Session

From `src/pages/WorkoutPage.tsx`, the user picks a day from their active plan. `useWorkoutStore.startSession()` initializes:
- `activeSession` with all exercises from the daily workout
- Empty sets arrays for each exercise
- Start timestamp

If a session is already active, a confirmation modal asks whether to resume or start fresh. An `ActiveWorkoutBanner` floats on all other pages to indicate the ongoing session.

#### The Active Workout UI (`src/components/Tracker/ActiveWorkout.tsx`)

The workout interface is a single-exercise-at-a-time view.

**SetLogger** is the core input component:
- **Weight** — numeric input with +/- buttons (1.25kg or 2.5lbs increment)
- **Reps** — numeric input with +/- buttons
- **RPE** — slider from 1–10 (Rate of Perceived Exertion)
- **Warmup toggle** — marks the set as a warmup (excluded from recommendations and PRs)
- **Weight recommendation badge** — fetched from `getWeightRecommendation()` and displayed inline

On "Log Set", the set is validated (weight + reps ≥ 0), added to the store, and:
1. PR detection runs immediately
2. Rest timer auto-starts

**Rest Timer** overlays full-screen with MM:SS countdown and a Skip button. It uses `useWorkoutTimer` which is an interval-based hook with start/pause/resume/reset/skip.

**Exercise navigation** — Previous/Next buttons move through exercises. A progress bar shows how many exercises are done. "Finish Workout" ends the session.

#### Personal Record Detection

After each set is logged in `ActiveWorkout.tsx`, the app checks all 4 PR types against `personalRecordRepo.getBestForExercise()`:
- **Weight PR** — highest single-set weight
- **Reps PR** — most reps at a given weight
- **Volume PR** — highest `weight × reps` in a single set
- **Estimated 1RM PR** — highest `estimatedMax(weight, reps)` using Epley+Brzycki average

If any is exceeded, a new `PersonalRecord` is saved and stored in a local `newPRs[]` array, shown on the completion screen.

#### Session Completion

`useWorkoutStore.endSession()` calculates aggregate stats:
- `totalVolume` = Σ(weight × reps) across all working sets
- `totalSets`, `totalReps`, `durationMinutes`
- Saves the full `WorkoutSession` to Dexie via `workoutRepo.save()`

`src/components/Tracker/WorkoutComplete.tsx` shows a celebration screen with duration, sets, volume, and any new PRs listed.

#### Weight Recommendations (`src/engine/weightRecommender.ts`)

Called before each set via `getWeightRecommendation(exerciseId, unit)`. The decision tree:

**No history → "first_time":** Returns null, suggests starting light.

**History but missing set data → "returning":** Returns null, suggests comfortable weight.

**Last session < 75% reps completed → "decrease_recovery":** Returns `lastWeight - 2 × 1.25kg`. High confidence.

**5+ sessions → Weighted Linear Regression path:**
1. For each past session, computes best working-set e1RM = `(Epley + Brzycki) / 2`
2. Sorts chronologically → array of e1RMs
3. If 6+ sessions, checks `recentSlope` = regression slope of last 3 sessions
4. If `recentSlope ≤ 0` → **"deload_fatigue"**: Returns `lastWeight × 0.8`
5. Otherwise → runs full weighted regression on all sessions:
   - Weights: `DECAY^(n-1-i)` = 0.85^(distance-from-end) — recent sessions count more
   - Solves weighted least squares for slope + intercept
   - Predicts next e1RM: `intercept + slope × n`
   - Converts back to working weight via inverse Epley+Brzycki for `targetReps`
   - Rounds to nearest 1.25kg increment

**< 5 sessions → Rule-based fallback:**
- RPE ≤ 7 AND 100% reps completed → increase by 1.25kg
- Otherwise → maintain last weight

All internal weights are stored and computed in kg; display conversion to lbs happens at return time.

---

### 3. Analytics

#### Exercise Performance Page (`src/pages/ExercisePerformancePage.tsx`)

Reached by clicking any exercise in the Library. Shows:

**1RM Trend Chart** (`src/components/charts/ExerciseProgressChart.tsx`):
- Custom SVG chart over the last 60 days
- For each session containing the exercise, computes `max(estimatedMax(weight, reps))` across all working sets
- Plots these as points connected by a **Catmull-Rom spline** (smooth curve with tension 0.18 via `buildSmoothPath()`)
- X-axis: date ticks formatted as DD/MM; Y-axis: 5 evenly spaced weight grid lines
- On hover: tooltip shows date + volume

**Volume Heatmap** (`src/components/shared/WorkoutCalendar.tsx`):
- GitHub-style grid — columns = weeks, rows = days of week
- Each cell colored by volume intensity (total weight × reps for that exercise that day)
- Month labels above columns

**Personal Records Summary** — Best weight, best reps, best volume, best estimated 1RM with dates.

**Recent Sessions Table** — Last 8 sessions for the exercise showing date, top set weight, and reps.

**Session Stats** — Total logged session count and last performed date.

#### Performance Analysis Page (`src/pages/PerformanceAnalysisPage.tsx`)

Full analytics dashboard with 5 sections:

**Section 1 — Exercise Progress Chart:**
- User selects an exercise (filtered by muscle group)
- Same ExerciseProgressChart as above but with a 60-day sliding window via `xDomain` prop
- MonthlyPRsChart alongside: bar chart (`src/components/charts/MonthlyPRsChart.tsx`) showing PR count per calendar month

**Section 2 — Strength Percentile Comparison:**
- User selects multiple exercises + gender
- App computes each exercise's best e1RM from personal records
- Looks up against hardcoded `STRENGTH_STANDARDS` in `src/engine/percentileCalculator.ts`:
  - 13 exercises (Bench Press, Squat, Deadlift, OHP, Dumbbell Bench, Barbell Curl, Seated Dumbbell Curl, Lat Pulldown, Front Squat, Triceps Pushdown, Decline EZ Bar Tricep Extension, Seated Cable Rows, Bent Over Row)
  - Percentile tiers: 5th / 20th / 50th / 80th / 95th for male and female
  - Uses **linear interpolation** between tiers to get a precise percentile
- Displays each exercise as a horizontal bar with percentile label (e.g., "67th percentile")

**Section 3 — Physique Diagram** (`src/components/charts/AbstractPhysiqueDiagram.tsx`):
- SVG front + back silhouettes with 7 interactive muscle regions: chest, back, shoulders, biceps, triceps, quadriceps, hamstrings/glutes
- Two toggle modes:
  - **Volume mode**: Colors muscles by kg of weekly volume. Blue gradient — more volume = brighter blue
  - **Percentile mode**: Colors muscles by strength percentile. Red = below average (<40th), neutral = average (40–60th), blue = above average (>60th). Uses `calculateAllMuscleGroupPercentiles()` which averages percentiles from all exercises targeting that muscle
- Legend sorted by value (highest → lowest)
- Clicking a muscle shows contributor details (which exercises contributed to that muscle's score)

**Section 4 — Training Volume:**
- 9-week calendar heatmap showing total volume per day, colored by intensity
- Dropdown to filter heatmap by muscle group
- 10-week volume trend line chart showing weekly total volume over time

#### Dashboard (`src/pages/DashboardPage.tsx`)

- Total workouts, total volume, and 3 most recent sessions
- Quick-start button to jump into the active plan
- Physique Diagram fed with actual recent workout data — maps sessions → exercise sets → muscle groups → weekly volume per region (volume mode only, no percentile toggle)

#### Profile Page (`src/pages/ProfilePage.tsx`)

- Edit training style, difficulty, days/week, session duration, and available equipment
- Weight unit toggle (kg / lbs)
- Default rest timer with quick presets (30s, 60s, 90s, 120s, 180s) and a custom input
- Exercise exclusion list — persisted and used by the generator to filter out unwanted exercises
- On save, recalculates estimated durations for all stored plans to reflect the new rest time
- Shows a "Saved" confirmation on success

#### useAnalytics Hook (`src/hooks/useAnalytics.ts`)

Underlying data hook used across analytics pages:
- Loads all `WorkoutSession[]` from `workoutRepo`
- Optionally filters by date range
- Computes summary object: `totalWorkouts`, `totalVolume`, `totalDuration`, `averageVolume`, `averageDuration`
- Returns `sessions[]` for downstream chart components to process further

---

### Data Flow Summary

```
User Input → GeneratorForm → generateWeeklyPlan() → Dexie (weeklyPlans table)
                                                           ↓
                                                 useWeeklyPlanStore (active plan)
                                                           ↓
WorkoutPage → picks day → ActiveWorkout → SetLogger → useWorkoutStore.logSet()
                                               ↓                    ↓
                                   getWeightRecommendation()    PR detection
                                   (workoutRepo → regression)   (personalRecordRepo)
                                                           ↓
                                              endSession() → workoutRepo.save()
                                                           ↓
                             ExercisePerformancePage / PerformanceAnalysisPage
                             (workoutRepo + personalRecordRepo → charts + percentiles)
```

---

## Deployment

### Build Process

```bash
npm install      # Install dependencies
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

## Future Considerations

### If App Grows Popular

- **Cloud Sync**: Add optional Supabase for multi-device sync
- **Social Features**: Share weekly plans with friends
- **Premium Tier**: Advanced analytics, custom exercises
- **Mobile App**: React Native version

### Advanced Features (Post-MVP)

- Fine-tuned LLM for workout generation
- Reinforcement Learning for weight progression
- Mesocycle and periodization planning
- Nutrition tracking integration
- PWA / offline service worker
- Data export / import
