# Weekly Plan Generator Engine

## Overview

The Weekly Plan Generator Engine is the core algorithm that creates personalized weekly workout plans based on the number of training days. It uses workout splits to intelligently distribute all muscle groups across the week, ensuring balanced coverage and optimal recovery.

---

## Purpose

Generate intelligent weekly workout plans that:
- Cover ALL muscle groups across the week
- Match user's available equipment
- Distribute volume based on training frequency (days per week)
- Align with chosen training style (strength, hypertrophy, endurance)
- Fit within time constraints per session
- Balance compound and isolation movements
- Ensure adequate recovery between sessions targeting the same muscles

---

## Input Parameters

### User Constraints

```typescript
interface WeeklyPlanConstraints {
  daysPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;  // Number of workout days
  availableEquipment: Equipment[];          // ["barbell", "dumbbells", "bench"]
  timePerSession: number;                   // Minutes per workout (15-120)
  trainingStyle: TrainingStyle;             // "strength" | "hypertrophy" | "endurance"
  difficulty?: DifficultyLevel;             // Optional filter
  excludeExercises?: string[];              // Optional exclusions
  preferredRestDays?: DayOfWeek[];          // Optional scheduling preferences
}

type MuscleGroup = 
  | 'chest' | 'back' | 'shoulders' 
  | 'biceps' | 'triceps' | 'forearms'
  | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves'
  | 'abdominals' | 'obliques' | 'lower_back';

type Equipment = 
  | 'barbell' | 'dumbbell' | 'bodyweight' 
  | 'cable' | 'machine' | 'kettlebell'
  | 'bands' | 'bench' | 'pull_up_bar';

type TrainingStyle = 'strength' | 'hypertrophy' | 'endurance';

type DifficultyLevel = 'beginner' | 'intermediate' | 'expert';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
```

---

## Algorithm Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  WEEKLY PLAN GENERATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SELECT SPLIT ─────────────────────────────────────────► │
│     │  Based on daysPerWeek input:                          │
│     │  • 1 day → Full Body                                  │
│     │  • 2 days → Upper/Lower                               │
│     │  • 3 days → Push/Pull/Legs                            │
│     │  • 4 days → Upper/Lower x2                            │
│     │  • 5 days → Push/Pull/Legs/Upper/Lower                │
│     │  • 6 days → Push/Pull/Legs x2                         │
│     │  • 7 days → Bro Split + Active Recovery               │
│     └─► Result: Split template with daily muscle targets    │
│                                                              │
│  2. GENERATE DAILY WORKOUTS ──────────────────────────────► │
│     │  For each day in the split:                           │
│     │  • Filter exercises by equipment & muscles            │
│     │  • Score by applicability for training style          │
│     │  • Select optimal exercise mix                        │
│     │  • Configure sets, reps, rest                         │
│     │  • Order exercises optimally                          │
│     └─► Result: Array of DailyWorkout objects               │
│                                                              │
│  3. BALANCE WEEKLY VOLUME ────────────────────────────────► │
│     │  Ensure balanced coverage:                            │
│     │  • Calculate sets per muscle group                    │
│     │  • Verify minimum weekly volume targets               │
│     │  • Adjust if any muscle is under-trained              │
│     │  • Cap volume to prevent overtraining                 │
│     └─► Result: Volume-balanced weekly plan                 │
│                                                              │
│  4. SCHEDULE WORKOUTS ────────────────────────────────────► │
│     │  Suggest optimal day placement:                       │
│     │  • Space out similar muscle groups                    │
│     │  • Respect preferred rest days                        │
│     │  • Ensure 48+ hours between same-muscle sessions      │
│     └─► Result: Final WeeklyPlan with scheduling            │
│                                                              │
│  5. VALIDATE ─────────────────────────────────────────────► │
│     │  Final checks:                                        │
│     │  • All muscle groups covered                          │
│     │  • Session durations within limits                    │
│     │  • Volume targets met                                 │
│     └─► Result: Validated WeeklyPlan                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Workout Split System

### Split Templates by Days Per Week

```typescript
const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'obliques', 'lower_back'
];

interface SplitTemplate {
  name: string;
  description: string;
  days: DayTemplate[];
}

interface DayTemplate {
  name: string;
  muscles: MuscleGroup[];
  focus?: TrainingStyle;      // Override global training style for this day
  intensity?: 'light' | 'normal' | 'heavy';
}

const SPLIT_TEMPLATES: Record<number, SplitTemplate> = {
  1: {
    name: "Full Body",
    description: "All major muscle groups in one comprehensive session",
    days: [
      { 
        name: "Full Body",
        muscles: ALL_MUSCLE_GROUPS 
      }
    ]
  },
  
  2: {
    name: "Upper/Lower",
    description: "Alternate between upper and lower body focus",
    days: [
      { 
        name: "Upper Body",
        muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'] 
      },
      { 
        name: "Lower Body",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'obliques', 'lower_back'] 
      }
    ]
  },
  
  3: {
    name: "Push/Pull/Legs",
    description: "Classic 3-way split for balanced development",
    days: [
      { 
        name: "Push",
        muscles: ['chest', 'shoulders', 'triceps'] 
      },
      { 
        name: "Pull",
        muscles: ['back', 'biceps', 'forearms'] 
      },
      { 
        name: "Legs & Core",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'obliques', 'lower_back'] 
      }
    ]
  },
  
  4: {
    name: "Upper/Lower x2",
    description: "Each muscle group trained twice per week",
    days: [
      { 
        name: "Upper A (Strength)",
        muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
        focus: 'strength'
      },
      { 
        name: "Lower A (Strength)",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        focus: 'strength'
      },
      { 
        name: "Upper B (Hypertrophy)",
        muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        focus: 'hypertrophy'
      },
      { 
        name: "Lower B (Hypertrophy)",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'obliques', 'lower_back'],
        focus: 'hypertrophy'
      }
    ]
  },
  
  5: {
    name: "Push/Pull/Legs/Upper/Lower",
    description: "High frequency training with varied stimulus",
    days: [
      { 
        name: "Push",
        muscles: ['chest', 'shoulders', 'triceps'] 
      },
      { 
        name: "Pull",
        muscles: ['back', 'biceps', 'forearms'] 
      },
      { 
        name: "Legs",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] 
      },
      { 
        name: "Upper Body",
        muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] 
      },
      { 
        name: "Lower & Core",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'obliques', 'lower_back'] 
      }
    ]
  },
  
  6: {
    name: "Push/Pull/Legs x2",
    description: "Each workout performed twice per week for maximum frequency",
    days: [
      { 
        name: "Push A",
        muscles: ['chest', 'shoulders', 'triceps'],
        intensity: 'heavy'
      },
      { 
        name: "Pull A",
        muscles: ['back', 'biceps', 'forearms'],
        intensity: 'heavy'
      },
      { 
        name: "Legs A",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        intensity: 'heavy'
      },
      { 
        name: "Push B",
        muscles: ['chest', 'shoulders', 'triceps'],
        intensity: 'normal'
      },
      { 
        name: "Pull B",
        muscles: ['back', 'biceps', 'forearms'],
        intensity: 'normal'
      },
      { 
        name: "Legs B & Core",
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'obliques', 'lower_back'],
        intensity: 'normal'
      }
    ]
  },
  
  7: {
    name: "Body Part Split + Recovery",
    description: "Dedicated focus days with active recovery",
    days: [
      { 
        name: "Chest",
        muscles: ['chest'] 
      },
      { 
        name: "Back",
        muscles: ['back'] 
      },
      { 
        name: "Shoulders & Arms",
        muscles: ['shoulders', 'biceps', 'triceps', 'forearms'] 
      },
      { 
        name: "Quadriceps & Calves",
        muscles: ['quadriceps', 'calves'] 
      },
      { 
        name: "Hamstrings & Glutes",
        muscles: ['hamstrings', 'glutes'] 
      },
      { 
        name: "Core & Accessories",
        muscles: ['abdominals', 'obliques', 'lower_back', 'forearms', 'calves'] 
      },
      { 
        name: "Active Recovery",
        muscles: ALL_MUSCLE_GROUPS,
        intensity: 'light'
      }
    ]
  }
};
```

---

## Applicability Scoring System

### The Core Innovation

Each exercise in the database has applicability scores (0-10) for each training style, indicating how suitable it is for that type of training.

### Training Styles Explained

**Strength (0-10)**
- Focus: Maximum force production
- Characteristics: Heavy loads, low reps (3-5), long rest periods
- Best exercises: Heavy compound lifts (squats, deadlifts, bench press)

**Hypertrophy (0-10)**
- Focus: Muscle growth and size
- Characteristics: Moderate loads, medium reps (8-12), moderate rest
- Best exercises: Mix of compound and isolation movements

**Endurance (0-10)**
- Focus: Muscular stamina and cardiovascular fitness
- Characteristics: Light loads, high reps (15+), minimal rest
- Best exercises: Bodyweight circuits, light weights, cardio-focused

### Scoring Examples

```typescript
// Heavy compound lift
{
  name: "Barbell Bench Press",
  applicability: {
    strength: 9,      // Excellent for building max strength
    hypertrophy: 8,   // Great for chest size
    endurance: 3      // Not ideal for endurance work
  }
}

// Isolation exercise
{
  name: "Dumbbell Bicep Curl",
  applicability: {
    strength: 4,      // Limited strength transfer
    hypertrophy: 9,   // Perfect for bicep growth
    endurance: 6      // Can be used for endurance with light weight
  }
}

// Bodyweight cardio
{
  name: "Burpees",
  applicability: {
    strength: 3,      // Some strength component
    hypertrophy: 4,   // Minimal muscle growth
    endurance: 9      // Excellent cardio endurance
  }
}

// Olympic lift
{
  name: "Power Clean",
  applicability: {
    strength: 9,      // Builds explosive strength
    hypertrophy: 6,   // Moderate muscle growth
    endurance: 2      // Not for endurance
  }
}
```

### Scoring Guidelines Reference

**Strength Scoring (0-10)**
| Score | Exercise Type | Examples |
|-------|---------------|----------|
| 9-10 | Heavy barbell compounds | Squat, Deadlift, Bench Press |
| 8-9 | Other compounds, Olympic lifts | Overhead Press, Power Clean |
| 5-7 | Weighted isolation, machine compounds | Leg Press, Cable Rows |
| 3-4 | Bodyweight compounds, light isolation | Pull-ups, Dumbbell Curls |
| 1-2 | Cardio, light bodyweight, stretching | Jump Rope, Planks |

**Hypertrophy Scoring (0-10)**
| Score | Exercise Type | Examples |
|-------|---------------|----------|
| 9-10 | Isolation with full ROM | Curls, Flies, Extensions |
| 8-9 | Compound lifts (moderate weight) | Incline Press, Romanian Deadlift |
| 6-7 | Bodyweight, cables | Dips, Cable Crossovers |
| 4-5 | Very heavy/explosive movements | Heavy Singles, Box Jumps |
| 1-3 | Cardio, stretching | Running, Yoga Poses |

**Endurance Scoring (0-10)**
| Score | Exercise Type | Examples |
|-------|---------------|----------|
| 9-10 | Bodyweight cardio | Burpees, Jump Rope, Running |
| 7-8 | Bodyweight circuits | Jumping Jacks, Mountain Climbers |
| 5-6 | Light weight, high rep | Light Dumbbell Circuits |
| 3-4 | Moderate weight exercises | Goblet Squats, Lunges |
| 1-2 | Heavy, low-rep strength exercises | Barbell Squats, Deadlifts |

---

## Volume Configuration

### Training Style Parameters

```typescript
const VOLUME_CONFIG = {
  strength: {
    setsPerExercise: { min: 4, max: 5 },
    repRange: "3-5",
    restSeconds: { min: 180, max: 300 },    // 3-5 minutes
    compoundRatio: 0.8,                      // 80% compound exercises
  },
  hypertrophy: {
    setsPerExercise: { min: 3, max: 4 },
    repRange: "8-12",
    restSeconds: { min: 60, max: 90 },       // 1-1.5 minutes
    compoundRatio: 0.6,                      // 60% compound exercises
  },
  endurance: {
    setsPerExercise: { min: 2, max: 3 },
    repRange: "15-20",
    restSeconds: { min: 30, max: 45 },       // 30-45 seconds
    compoundRatio: 0.4,                      // 40% compound exercises
  }
};
```

### Weekly Volume Targets (Sets Per Muscle Group)

```typescript
const WEEKLY_VOLUME_TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest:       { min: 10, max: 20 },
  back:        { min: 10, max: 20 },
  shoulders:   { min: 8,  max: 16 },
  biceps:      { min: 6,  max: 14 },
  triceps:     { min: 6,  max: 14 },
  forearms:    { min: 4,  max: 10 },
  quadriceps:  { min: 10, max: 20 },
  hamstrings:  { min: 8,  max: 16 },
  glutes:      { min: 8,  max: 16 },
  calves:      { min: 6,  max: 12 },
  abdominals:  { min: 6,  max: 14 },
  obliques:    { min: 4,  max: 10 },
  lower_back:  { min: 4,  max: 10 }
};
```

### Time Estimation Formula

```typescript
function estimateSessionDuration(
  exercises: RoutineExercise[], 
  style: TrainingStyle
): number {
  const config = VOLUME_CONFIG[style];
  const avgRestSeconds = (config.restSeconds.min + config.restSeconds.max) / 2;
  
  return exercises.reduce((total, exercise) => {
    const setTime = 45;  // Average seconds per set (execution)
    const exerciseTime = (exercise.sets * setTime) + 
                        ((exercise.sets - 1) * avgRestSeconds);  // Rest between sets only
    return total + exerciseTime;
  }, 0) / 60;  // Convert to minutes
}
```

---

## Daily Workout Generation Algorithm

### Step 1: Filter Exercises

```typescript
function filterExercises(
  exercises: Exercise[],
  dayTemplate: DayTemplate,
  constraints: WeeklyPlanConstraints
): Exercise[] {
  return exercises.filter(exercise => {
    // Must match available equipment
    const hasEquipment = constraints.availableEquipment.includes(exercise.equipment);
    
    // Must target at least one of the day's muscle groups
    const targetsMuscle = exercise.primaryMuscles.some(
      muscle => dayTemplate.muscles.includes(muscle)
    );
    
    // Check difficulty if specified
    const matchesDifficulty = !constraints.difficulty || 
      exercise.difficulty === constraints.difficulty;
    
    // Not in exclusion list
    const notExcluded = !constraints.excludeExercises?.includes(exercise.id);
    
    return hasEquipment && targetsMuscle && matchesDifficulty && notExcluded;
  });
}
```

### Step 2: Score Exercises

```typescript
function scoreExercise(
  exercise: Exercise,
  trainingStyle: TrainingStyle,
  targetMuscles: MuscleGroup[]
): number {
  // Base score from applicability
  let score = exercise.applicability[trainingStyle];
  
  // Bonus for compound exercises
  if (exercise.mechanic === 'compound') {
    score += 1.5;
  }
  
  // Bonus for primary muscle match
  const primaryMatch = exercise.primaryMuscles.filter(
    m => targetMuscles.includes(m)
  ).length;
  score += primaryMatch * 0.5;
  
  // Bonus for exercises hitting multiple target muscles
  const totalMusclesCovered = [
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles
  ].filter(m => targetMuscles.includes(m)).length;
  score += totalMusclesCovered * 0.25;
  
  return score;
}
```

### Step 3: Select Exercises

```typescript
function selectExercises(
  rankedExercises: ScoredExercise[],
  dayTemplate: DayTemplate,
  constraints: WeeklyPlanConstraints
): Exercise[] {
  const selected: Exercise[] = [];
  const coveredMuscles = new Set<MuscleGroup>();
  const usedPatterns = new Set<string>();
  
  const effectiveStyle = dayTemplate.focus || constraints.trainingStyle;
  const config = VOLUME_CONFIG[effectiveStyle];
  const targetCount = calculateTargetExerciseCount(constraints.timePerSession, config);
  const targetCompounds = Math.ceil(targetCount * config.compoundRatio);
  
  // First pass: Select top compounds for major muscles
  for (const { exercise } of rankedExercises) {
    if (selected.filter(e => e.mechanic === 'compound').length >= targetCompounds) break;
    if (exercise.mechanic !== 'compound') continue;
    
    const pattern = `${exercise.force}-${exercise.primaryMuscles[0]}`;
    if (usedPatterns.has(pattern)) continue;
    
    selected.push(exercise);
    usedPatterns.add(pattern);
    exercise.primaryMuscles.forEach(m => coveredMuscles.add(m));
  }
  
  // Second pass: Fill with isolation for uncovered muscles
  for (const { exercise } of rankedExercises) {
    if (selected.length >= targetCount) break;
    if (selected.includes(exercise)) continue;
    
    // Prioritize uncovered muscles
    const coversNew = exercise.primaryMuscles.some(
      m => !coveredMuscles.has(m) && dayTemplate.muscles.includes(m)
    );
    
    if (coversNew || coveredMuscles.size >= dayTemplate.muscles.length) {
      selected.push(exercise);
      exercise.primaryMuscles.forEach(m => coveredMuscles.add(m));
    }
  }
  
  return selected;
}

function calculateTargetExerciseCount(timeMinutes: number, config: VolumeConfig): number {
  const avgSetsPerExercise = (config.setsPerExercise.min + config.setsPerExercise.max) / 2;
  const avgRestSeconds = (config.restSeconds.min + config.restSeconds.max) / 2;
  const timePerExercise = (avgSetsPerExercise * 45) + (avgSetsPerExercise * avgRestSeconds);
  const timePerExerciseMinutes = timePerExercise / 60;
  
  return Math.floor(timeMinutes / timePerExerciseMinutes);
}
```

### Step 4: Configure Volume

```typescript
function configureExerciseVolume(
  exercises: Exercise[],
  dayTemplate: DayTemplate,
  constraints: WeeklyPlanConstraints
): RoutineExercise[] {
  const effectiveStyle = dayTemplate.focus || constraints.trainingStyle;
  const config = VOLUME_CONFIG[effectiveStyle];
  
  // Adjust for intensity if specified
  const intensityMultiplier = {
    light: 0.7,
    normal: 1.0,
    heavy: 1.15
  }[dayTemplate.intensity || 'normal'];
  
  return exercises.map((exercise, index) => {
    // Compounds get more sets
    const baseSets = exercise.mechanic === 'compound' 
      ? config.setsPerExercise.max 
      : config.setsPerExercise.min;
    
    const adjustedSets = Math.round(baseSets * intensityMultiplier);
    
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: adjustedSets,
      reps: config.repRange,
      restSeconds: exercise.mechanic === 'compound' 
        ? config.restSeconds.max 
        : config.restSeconds.min,
      notes: index === 0 ? 'Start with proper warm-up sets' : undefined
    };
  });
}
```

### Step 5: Order Exercises

```typescript
function orderExercises(exercises: RoutineExercise[], allExercises: Exercise[]): RoutineExercise[] {
  return [...exercises].sort((a, b) => {
    const exerciseA = allExercises.find(e => e.id === a.exerciseId)!;
    const exerciseB = allExercises.find(e => e.id === b.exerciseId)!;
    
    // Compound before isolation
    if (exerciseA.mechanic !== exerciseB.mechanic) {
      return exerciseA.mechanic === 'compound' ? -1 : 1;
    }
    
    // Larger muscle groups first
    const muscleSize: Record<MuscleGroup, number> = {
      quadriceps: 5, back: 5, chest: 4, hamstrings: 4, glutes: 4,
      shoulders: 3, triceps: 2, biceps: 2,
      calves: 1, forearms: 1, abdominals: 1, obliques: 1, lower_back: 1
    };
    
    const aSize = Math.max(...exerciseA.primaryMuscles.map(m => muscleSize[m] || 0));
    const bSize = Math.max(...exerciseB.primaryMuscles.map(m => muscleSize[m] || 0));
    
    return bSize - aSize;
  });
}
```

---

## Weekly Volume Balancing

### Balance Algorithm

```typescript
function balanceWeeklyVolume(
  workouts: DailyWorkout[],
  constraints: WeeklyPlanConstraints
): DailyWorkout[] {
  // Calculate current weekly sets per muscle
  const weeklySetsByMuscle = calculateWeeklySetsByMuscle(workouts);
  
  // Check for under-trained muscles
  for (const [muscle, targets] of Object.entries(WEEKLY_VOLUME_TARGETS)) {
    const currentSets = weeklySetsByMuscle[muscle as MuscleGroup] || 0;
    
    if (currentSets < targets.min) {
      // Find workouts that target this muscle and add volume
      const deficit = targets.min - currentSets;
      distributeAdditionalVolume(workouts, muscle as MuscleGroup, deficit);
    }
  }
  
  // Check for over-trained muscles
  for (const [muscle, targets] of Object.entries(WEEKLY_VOLUME_TARGETS)) {
    const currentSets = weeklySetsByMuscle[muscle as MuscleGroup] || 0;
    
    if (currentSets > targets.max) {
      // Reduce volume to prevent overtraining
      const excess = currentSets - targets.max;
      reduceVolume(workouts, muscle as MuscleGroup, excess);
    }
  }
  
  return workouts;
}

function calculateWeeklySetsByMuscle(workouts: DailyWorkout[]): Record<MuscleGroup, number> {
  const setsByMuscle: Record<string, number> = {};
  
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const exerciseData = getExerciseById(exercise.exerciseId);
      if (!exerciseData) return;
      
      // Primary muscles get full credit
      exerciseData.primaryMuscles.forEach(muscle => {
        setsByMuscle[muscle] = (setsByMuscle[muscle] || 0) + exercise.sets;
      });
      
      // Secondary muscles get half credit
      exerciseData.secondaryMuscles.forEach(muscle => {
        setsByMuscle[muscle] = (setsByMuscle[muscle] || 0) + (exercise.sets * 0.5);
      });
    });
  });
  
  return setsByMuscle as Record<MuscleGroup, number>;
}
```

---

## Workout Scheduling

### Optimal Day Placement

```typescript
function suggestSchedule(
  workouts: DailyWorkout[],
  constraints: WeeklyPlanConstraints
): DailyWorkout[] {
  const daysOfWeek: DayOfWeek[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  
  // Remove preferred rest days from available slots
  const availableDays = daysOfWeek.filter(
    day => !constraints.preferredRestDays?.includes(day)
  );
  
  // Distribute workouts evenly across available days
  const scheduledWorkouts = workouts.map((workout, index) => {
    const dayIndex = Math.floor(index * availableDays.length / workouts.length);
    return {
      ...workout,
      suggestedDayOfWeek: availableDays[dayIndex]
    };
  });
  
  // Ensure similar muscle groups aren't on consecutive days
  return optimizeForRecovery(scheduledWorkouts);
}

function optimizeForRecovery(workouts: DailyWorkout[]): DailyWorkout[] {
  // Check for muscle group conflicts on consecutive days
  for (let i = 0; i < workouts.length - 1; i++) {
    const currentMuscles = new Set(workouts[i].targetMuscles);
    const nextMuscles = new Set(workouts[i + 1].targetMuscles);
    
    const overlap = [...currentMuscles].filter(m => nextMuscles.has(m));
    
    if (overlap.length > 2) {
      // Significant overlap - try to swap with a later workout
      for (let j = i + 2; j < workouts.length; j++) {
        const altMuscles = new Set(workouts[j].targetMuscles);
        const altOverlap = [...currentMuscles].filter(m => altMuscles.has(m));
        
        if (altOverlap.length < overlap.length) {
          // Swap workouts
          [workouts[i + 1], workouts[j]] = [workouts[j], workouts[i + 1]];
          break;
        }
      }
    }
  }
  
  return workouts;
}
```

---

## Output Format

### Generated Weekly Plan

```typescript
interface WeeklyPlan {
  id: string;
  name: string;
  createdAt: Date;
  daysPerWeek: number;
  splitType: string;
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
  reps: string;
  restSeconds: number;
  notes?: string;
}
```

### Example Output (4-Day Upper/Lower)

```typescript
{
  id: "plan_1234",
  name: "4-Day Upper/Lower Split",
  createdAt: "2024-01-15T10:30:00Z",
  daysPerWeek: 4,
  splitType: "Upper/Lower x2",
  trainingStyle: "hypertrophy",
  totalWeeklyVolume: 892,
  estimatedWeeklyDuration: 240,
  workouts: [
    {
      id: "day_1_1234",
      dayNumber: 1,
      name: "Upper A (Strength)",
      targetMuscles: ["chest", "back", "shoulders", "biceps", "triceps"],
      estimatedDuration: 65,
      suggestedDayOfWeek: "monday",
      exercises: [
        {
          exerciseId: "Barbell_Bench_Press",
          exerciseName: "Barbell Bench Press",
          sets: 5,
          reps: "3-5",
          restSeconds: 180,
          notes: "Start with proper warm-up sets"
        },
        {
          exerciseId: "Barbell_Row",
          exerciseName: "Barbell Row",
          sets: 5,
          reps: "3-5",
          restSeconds: 180
        },
        {
          exerciseId: "Overhead_Press",
          exerciseName: "Overhead Press",
          sets: 4,
          reps: "3-5",
          restSeconds: 180
        },
        {
          exerciseId: "Weighted_Pullups",
          exerciseName: "Weighted Pull-ups",
          sets: 4,
          reps: "3-5",
          restSeconds: 180
        },
        {
          exerciseId: "Barbell_Curl",
          exerciseName: "Barbell Curl",
          sets: 3,
          reps: "5-8",
          restSeconds: 90
        }
      ]
    },
    {
      id: "day_2_1234",
      dayNumber: 2,
      name: "Lower A (Strength)",
      targetMuscles: ["quadriceps", "hamstrings", "glutes", "calves"],
      estimatedDuration: 60,
      suggestedDayOfWeek: "tuesday",
      exercises: [
        {
          exerciseId: "Barbell_Squat",
          exerciseName: "Barbell Back Squat",
          sets: 5,
          reps: "3-5",
          restSeconds: 240,
          notes: "Start with proper warm-up sets"
        },
        {
          exerciseId: "Romanian_Deadlift",
          exerciseName: "Romanian Deadlift",
          sets: 4,
          reps: "5-8",
          restSeconds: 180
        },
        {
          exerciseId: "Leg_Press",
          exerciseName: "Leg Press",
          sets: 4,
          reps: "6-8",
          restSeconds: 120
        },
        {
          exerciseId: "Lying_Leg_Curl",
          exerciseName: "Lying Leg Curl",
          sets: 3,
          reps: "8-10",
          restSeconds: 90
        },
        {
          exerciseId: "Standing_Calf_Raise",
          exerciseName: "Standing Calf Raise",
          sets: 4,
          reps: "10-15",
          restSeconds: 60
        }
      ]
    },
    {
      id: "day_3_1234",
      dayNumber: 3,
      name: "Upper B (Hypertrophy)",
      targetMuscles: ["chest", "back", "shoulders", "biceps", "triceps", "forearms"],
      estimatedDuration: 55,
      suggestedDayOfWeek: "thursday",
      exercises: [
        {
          exerciseId: "Incline_Dumbbell_Press",
          exerciseName: "Incline Dumbbell Press",
          sets: 4,
          reps: "8-12",
          restSeconds: 90,
          notes: "Start with proper warm-up sets"
        },
        {
          exerciseId: "Cable_Row",
          exerciseName: "Seated Cable Row",
          sets: 4,
          reps: "8-12",
          restSeconds: 75
        },
        {
          exerciseId: "Lateral_Raise",
          exerciseName: "Dumbbell Lateral Raise",
          sets: 3,
          reps: "12-15",
          restSeconds: 60
        },
        {
          exerciseId: "Cable_Flyes",
          exerciseName: "Cable Flyes",
          sets: 3,
          reps: "12-15",
          restSeconds: 60
        },
        {
          exerciseId: "Hammer_Curl",
          exerciseName: "Hammer Curl",
          sets: 3,
          reps: "10-12",
          restSeconds: 60
        },
        {
          exerciseId: "Tricep_Pushdown",
          exerciseName: "Tricep Pushdown",
          sets: 3,
          reps: "10-12",
          restSeconds: 60
        }
      ]
    },
    {
      id: "day_4_1234",
      dayNumber: 4,
      name: "Lower B (Hypertrophy)",
      targetMuscles: ["quadriceps", "hamstrings", "glutes", "calves", "abdominals", "obliques", "lower_back"],
      estimatedDuration: 60,
      suggestedDayOfWeek: "friday",
      exercises: [
        {
          exerciseId: "Goblet_Squat",
          exerciseName: "Goblet Squat",
          sets: 4,
          reps: "10-12",
          restSeconds: 75,
          notes: "Start with proper warm-up sets"
        },
        {
          exerciseId: "Walking_Lunge",
          exerciseName: "Walking Lunge",
          sets: 3,
          reps: "12 each leg",
          restSeconds: 60
        },
        {
          exerciseId: "Leg_Extension",
          exerciseName: "Leg Extension",
          sets: 3,
          reps: "12-15",
          restSeconds: 60
        },
        {
          exerciseId: "Seated_Leg_Curl",
          exerciseName: "Seated Leg Curl",
          sets: 3,
          reps: "12-15",
          restSeconds: 60
        },
        {
          exerciseId: "Hip_Thrust",
          exerciseName: "Hip Thrust",
          sets: 3,
          reps: "12-15",
          restSeconds: 60
        },
        {
          exerciseId: "Cable_Crunch",
          exerciseName: "Cable Crunch",
          sets: 3,
          reps: "15-20",
          restSeconds: 45
        }
      ]
    }
  ]
}
```

---

## Before & After: Days-Based Generation

### Before (Target Muscle Input)

```
User input: Target muscles = [chest, triceps]

Result: Single workout for chest and triceps only
        ❌ Other muscles never trained
        ❌ User must manually plan full-body coverage
        ❌ No weekly structure
```

### After (Days Per Week Input)

```
User input: Days per week = 4

Result: Complete weekly plan with Upper/Lower split
        ✅ All muscle groups covered automatically
        ✅ Intelligent split selection (Push/Pull/Legs, Upper/Lower, etc.)
        ✅ Volume balanced across the week
        ✅ Recovery time considered
        ✅ Suggested scheduling
```

---

## Implementation Code Structure

```typescript
// src/engine/weeklyPlanGenerator.ts

export class WeeklyPlanGenerator {
  private exercises: Exercise[];
  private dailyGenerator: DailyRoutineGenerator;
  
  constructor(exercises: Exercise[]) {
    this.exercises = exercises;
    this.dailyGenerator = new DailyRoutineGenerator(exercises);
  }
  
  generate(constraints: WeeklyPlanConstraints): WeeklyPlan {
    // Step 1: Select split
    const split = this.selectSplit(constraints.daysPerWeek);
    
    // Step 2: Generate each day
    const workouts = split.days.map((dayTemplate, index) =>
      this.dailyGenerator.generate(dayTemplate, constraints, index + 1)
    );
    
    // Step 3: Balance volume
    const balanced = this.balanceWeeklyVolume(workouts, constraints);
    
    // Step 4: Schedule
    const scheduled = this.suggestSchedule(balanced, constraints);
    
    // Step 5: Validate and build
    return this.validateAndBuild(scheduled, split, constraints);
  }
  
  private selectSplit(daysPerWeek: number): SplitTemplate {
    return SPLIT_TEMPLATES[daysPerWeek];
  }
  
  private balanceWeeklyVolume(workouts: DailyWorkout[], constraints: WeeklyPlanConstraints): DailyWorkout[] { /* ... */ }
  private suggestSchedule(workouts: DailyWorkout[], constraints: WeeklyPlanConstraints): DailyWorkout[] { /* ... */ }
  private validateAndBuild(workouts: DailyWorkout[], split: SplitTemplate, constraints: WeeklyPlanConstraints): WeeklyPlan { /* ... */ }
}

// src/engine/dailyRoutineGenerator.ts

export class DailyRoutineGenerator {
  private exercises: Exercise[];
  
  constructor(exercises: Exercise[]) {
    this.exercises = exercises;
  }
  
  generate(
    dayTemplate: DayTemplate,
    constraints: WeeklyPlanConstraints,
    dayNumber: number
  ): DailyWorkout {
    // Step 1: Filter
    const candidates = this.filterExercises(dayTemplate, constraints);
    
    // Step 2: Score
    const scored = this.scoreExercises(candidates, dayTemplate, constraints);
    
    // Step 3: Select
    const selected = this.selectExercises(scored, dayTemplate, constraints);
    
    // Step 4: Configure
    const configured = this.configureVolume(selected, dayTemplate, constraints);
    
    // Step 5: Order
    const ordered = this.orderExercises(configured);
    
    return this.buildDailyWorkout(ordered, dayTemplate, dayNumber);
  }
  
  private filterExercises(dayTemplate: DayTemplate, constraints: WeeklyPlanConstraints): Exercise[] { /* ... */ }
  private scoreExercises(exercises: Exercise[], dayTemplate: DayTemplate, constraints: WeeklyPlanConstraints): ScoredExercise[] { /* ... */ }
  private selectExercises(scored: ScoredExercise[], dayTemplate: DayTemplate, constraints: WeeklyPlanConstraints): Exercise[] { /* ... */ }
  private configureVolume(exercises: Exercise[], dayTemplate: DayTemplate, constraints: WeeklyPlanConstraints): RoutineExercise[] { /* ... */ }
  private orderExercises(exercises: RoutineExercise[]): RoutineExercise[] { /* ... */ }
  private buildDailyWorkout(exercises: RoutineExercise[], dayTemplate: DayTemplate, dayNumber: number): DailyWorkout { /* ... */ }
}
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Weekly plan generation | < 5 seconds |
| Single day generation | < 1 second |
| Exercise pool filtering | < 100ms |
| Scoring calculation | < 50ms per exercise |
| Total exercises processed | 800+ |

---

## Future Enhancements

### Phase 2 Features
- Exercise substitution suggestions
- Superset/circuit generation within daily workouts
- Mesocycle planning (4-week progressive programs)
- User preference learning

### Phase 3 Features
- Dynamic applicability scoring based on user feedback
- Machine learning for personalized exercise selection
- Periodization (strength → hypertrophy → deload cycles)
- Integration with heart rate monitors for real-time adjustments
