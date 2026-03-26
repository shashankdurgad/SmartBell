# SmartBell — Feature Documentation

## Table of Contents
1. [Workout Generation](#1-workout-generation)
2. [Workout Tracking & Weight Recommendations](#2-workout-tracking--weight-recommendations)
3. [Analytics](#3-analytics)
4. [Data Flow Summary](#data-flow-summary)

---

## 1. Workout Generation

### User Input (GeneratorForm)

The user fills out `src/components/Generator/GeneratorForm.tsx` which collects:
- **Training Style** — Strength (3-5 reps), Hypertrophy (8-12 reps), Endurance (15-20 reps)
- **Difficulty** — Beginner / Intermediate / Expert
- **Days per week** — 1-7 days
- **Session duration** — 15-120 min slider
- **Available equipment** — Multi-select grouped by category (free weights, cables, machines, etc.)
- **Excluded exercises** — Autocomplete search to blacklist specific exercises

All inputs are validated by a Zod schema in `src/utils/validators.ts` before submission.

### Split Template Selection

Based on days/week, the engine picks a pre-defined split from `src/data/split-templates.ts`:
- **1 day** → Full Body (chest 13%, lats 13%, quads 15%, etc.)
- **2 days** → Upper/Lower
- **3 days** → PPL (Push/Pull/Legs)
- **4 days** → Upper/Lower ×2 (Strength + Volume variants)
- **5 days** → ULPPL
- **6 days** → PPL ×2 (Heavy + Volume variants)

Each split defines `MuscleAllocation[]` — a list of muscle groups with percentage weights for each day.

### Core Generation Algorithm (`src/engine/generatePlan.ts`)

**Step 1 — Set budget per day:**
`calcTotalSets()` estimates how many working sets fit in the session duration:
```
totalSets = (sessionDuration - warmupTime) / (setDuration + restTime)
```
`STYLE_CONFIG` maps training style → set duration and rest time:
- Strength: 40s sets, 180s rest → fewer sets per hour
- Hypertrophy: 60s sets, 120s rest
- Endurance: 60s sets, 60s rest → most sets per hour

**Step 2 — Allocate sets to muscles:**
`allocateSetsAcrossExercises()` distributes the set budget across muscle groups proportionally to their allocation percentages from the split template. Uses the **largest-remainder method** to ensure every muscle gets at least 1 set when rounding.

**Step 3 — Exercise selection per muscle:**
`queryExercises()` filters the 873-exercise DB by:
- Primary/secondary muscle match
- Available equipment
- Applicability score threshold (≥5 for the chosen training style — strength/hypertrophy/endurance)
- Excluded exercise IDs
- Sorted by `commonality` score (most popular exercises first)

**Step 4 — Distribute sets across exercises:**
`DIFFICULTY_CONFIG` caps how many exercises per muscle group:
- Beginner: 1 exercise/muscle, 16 max sets/session
- Intermediate: 2 exercises/muscle, 18 max sets/session
- Expert: 3 exercises/muscle, 21 max sets/session

`distributeSetsAcrossExercises()` splits the muscle's set allocation evenly across the selected exercises. Each exercise gets `{ sets, targetReps, restSeconds }` from `STYLE_CONFIG`.

**Step 5 — Build daily workouts:**
`buildDay()` assembles `DailyWorkout` objects with estimated duration:
```
estimatedDuration = Σ(sets × (setDuration + restSeconds)) + warmupTime
```

**Step 6 — Save:**
The completed `WeeklyPlan` is saved via `weeklyPlanRepo.save()` and set as active in `useWeeklyPlanStore`.

### Plan Preview & Editing

After generation, `src/components/Generator/PlanPreview.tsx` displays the plan with:
- Per-day exercise lists with sets × reps and estimated duration
- **Set Active**, **Edit**, **Delete**, **Regenerate** buttons

The editor (`src/components/Generator/PlanEditor.tsx`) allows:
- Drag-and-drop exercise reordering (via `@dnd-kit`)
- Adding exercises via search + muscle group filter
- Editing sets/reps per exercise inline
- Estimated durations recalculated dynamically on every change

---

## 2. Workout Tracking & Weight Recommendations

### Starting a Session

From `src/pages/WorkoutPage.tsx`, the user picks a day from their active plan. `useWorkoutStore.startSession()` initializes:
- `activeSession` with all exercises from the daily workout
- Empty sets arrays for each exercise
- Start timestamp

If a session is already active, a confirmation modal asks whether to resume or start fresh. An `ActiveWorkoutBanner` floats on all other pages to indicate the ongoing session.

### The Active Workout UI (`src/components/Tracker/ActiveWorkout.tsx`)

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

### Personal Record Detection

After each set is logged in `ActiveWorkout.tsx`, the app checks all 4 PR types against `personalRecordRepo.getBestForExercise()`:
- **Weight PR** — highest single-set weight
- **Reps PR** — most reps at a given weight
- **Volume PR** — highest `weight × reps` in a single set
- **Estimated 1RM PR** — highest `estimatedMax(weight, reps)` using Epley+Brzycki average

If any is exceeded, a new `PersonalRecord` is saved and stored in a local `newPRs[]` array, shown on the completion screen.

### Session Completion

`useWorkoutStore.endSession()` calculates aggregate stats:
- `totalVolume` = Σ(weight × reps) across all working sets
- `totalSets`, `totalReps`, `durationMinutes`
- Saves the full `WorkoutSession` to Dexie via `workoutRepo.save()`

`src/components/Tracker/WorkoutComplete.tsx` shows a celebration screen with duration, sets, volume, and any new PRs listed.

### Weight Recommendations (`src/engine/weightRecommender.ts`)

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

## 3. Analytics

### Exercise Performance Page (`src/pages/ExercisePerformancePage.tsx`)

Reached by clicking any exercise in the Library. Shows:

**1RM Trend Chart** (`src/components/charts/ExerciseProgressChart.tsx`):
- Custom SVG chart (not Recharts) over the last 60 days
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

### Performance Analysis Page (`src/pages/PerformanceAnalysisPage.tsx`)

Full analytics dashboard with 4 sections:

**Section 1 — Exercise Progress Chart:**
- User selects an exercise (filtered by muscle group)
- Same ExerciseProgressChart as above but with a 60-day sliding window via `xDomain` prop
- MonthlyPRsChart alongside: bar chart (`src/components/charts/MonthlyPRsChart.tsx`) showing PR count per calendar month

**Section 2 — Strength Percentile Comparison:**
- User selects multiple exercises + gender
- App computes each exercise's best e1RM from personal records
- Looks up against hardcoded `STRENGTH_STANDARDS` in `src/engine/percentileCalculator.ts`:
  - 13 compound exercises (Bench, Squat, Deadlift, OHP, Row, RDL, etc.)
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

**Section 5 — Dashboard Physique Diagram** (`src/pages/DashboardPage.tsx`):
- Same diagram component but fed actual recent workout volume data
- Maps workout sessions → exercise sets → muscle groups → total volume per muscle region
- Also shows: total workouts, total volume, 3 most recent sessions, quick-start button

### Profile Page (`src/pages/ProfilePage.tsx`)

- Edit training style, difficulty, days/week, session duration, and available equipment
- Weight unit toggle (kg / lbs)
- Default rest timer with quick presets (30s, 60s, 90s, 120s, 180s) and a custom input
- Exercise exclusion list — persisted and used by the generator to filter out unwanted exercises
- On save, recalculates estimated durations for all stored plans to reflect the new rest time
- Shows a "Saved" confirmation on success

### useAnalytics Hook (`src/hooks/useAnalytics.ts`)

Underlying data hook used across analytics pages:
- Loads all `WorkoutSession[]` from `workoutRepo`
- Optionally filters by date range
- Computes summary object: `totalWorkouts`, `totalVolume`, `totalDuration`, `averageVolume`, `averageDuration`
- Returns `sessions[]` for downstream chart components to process further

---

## Data Flow Summary

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
