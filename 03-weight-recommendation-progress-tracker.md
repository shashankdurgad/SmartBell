# Weight Recommendation & Progress Tracker

## Overview

This document details two interconnected systems: the Weight Recommendation Engine that suggests optimal weights for exercises based on performance history, and the Progress Tracker that logs workouts and analyzes performance trends over time. Both systems are integrated with the weekly plan structure to provide comprehensive training guidance.

---

# Part 1: Weight Recommendation Engine

## Purpose

Automatically suggest the appropriate weight for each exercise based on:
- Historical performance data
- Rate of Perceived Exertion (RPE) feedback
- Completion rates
- Volume trends

This eliminates guesswork and ensures progressive overload while preventing overtraining.

---

## Core Logic

### Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│              WEIGHT RECOMMENDATION ALGORITHM                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT: Last 3-5 workout sessions for exercise              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Did user complete all sets easily (RPE ≤ 7)?       │    │
│  └────────────────────┬──────────────────┬─────────────┘    │
│                       │                  │                   │
│                      YES                 NO                  │
│                       │                  │                   │
│                       ▼                  ▼                   │
│              ┌───────────────┐  ┌─────────────────────┐     │
│              │ INCREASE      │  │ Did user fail       │     │
│              │ weight 2.5-5% │  │ multiple sets       │     │
│              └───────────────┘  │ (completion < 75%)? │     │
│                                 └──────────┬──────────┘     │
│                                            │                 │
│                              YES ──────────┼────────── NO    │
│                               │            │           │     │
│                               ▼            │           ▼     │
│                    ┌──────────────┐        │  ┌───────────┐ │
│                    │ DECREASE     │        │  │ Check     │ │
│                    │ weight 5-10% │        │  │ trends    │ │
│                    └──────────────┘        │  └─────┬─────┘ │
│                                            │        │       │
│                                            │        ▼       │
│                              ┌─────────────────────────────┐│
│                              │ Performance declining over  ││
│                              │ 3+ sessions?                ││
│                              └──────────────┬──────────────┘│
│                                             │                │
│                               YES ──────────┼────────── NO   │
│                                │            │           │    │
│                                ▼            │           ▼    │
│                     ┌──────────────┐        │  ┌──────────┐ │
│                     │ SUGGEST      │        │  │ MAINTAIN │ │
│                     │ DELOAD       │        │  │ current  │ │
│                     │ (-10-15%)    │        │  │ weight   │ │
│                     └──────────────┘        │  └──────────┘ │
│                                             │                │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Metrics

### Rate of Perceived Exertion (RPE)

The RPE scale measures subjective difficulty on a 1-10 scale:

| RPE | Description | Reps in Reserve |
|-----|-------------|-----------------|
| 10 | Maximum effort, couldn't do another rep | 0 RIR |
| 9 | Very hard, maybe 1 more rep possible | 1 RIR |
| 8 | Hard, could do 2 more reps | 2 RIR |
| 7 | Moderately hard, 3 more reps possible | 3 RIR |
| 6 | Moderate effort, 4+ reps in reserve | 4+ RIR |
| 5 | Light effort | 5+ RIR |

### Completion Rate

```typescript
completionRate = completedReps / targetReps * 100

// Examples:
// Target: 10 reps, Completed: 10 reps → 100%
// Target: 10 reps, Completed: 7 reps → 70%
// Target: 10 reps, Completed: 8 reps → 80%
```

### Volume Calculation

```typescript
setVolume = weight × reps
exerciseVolume = sum of all set volumes
sessionVolume = sum of all exercise volumes
weeklyVolume = sum of all session volumes in the week
```

---

## Recommendation Algorithm

### Data Structure

```typescript
interface PerformanceHistory {
  exerciseId: string;
  sessions: SessionData[];
}

interface SessionData {
  date: Date;
  weeklyPlanId: string;
  dailyWorkoutId: string;
  dayNumber: number;
  sets: SetData[];
  averageRPE: number;
  completionRate: number;
  totalVolume: number;
}

interface SetData {
  weight: number;
  targetReps: number;
  completedReps: number;
  rpe: number;
}
```

### Implementation

```typescript
interface WeightRecommendation {
  recommendedWeight: number;
  reasoning: RecommendationReason;
  confidence: 'high' | 'medium' | 'low';
  alternativeWeight?: number;
  message: string;
}

type RecommendationReason = 
  | 'increase_progression'    // Ready for more weight
  | 'decrease_recovery'       // Need to reduce for recovery
  | 'maintain_consolidate'    // Stay same, building consistency
  | 'deload_fatigue'          // Signs of accumulated fatigue
  | 'first_time'              // No history, start conservative
  | 'returning'               // Returning after break

function recommendWeight(
  exerciseId: string,
  history: PerformanceHistory,
  trainingStyle: TrainingStyle
): WeightRecommendation {
  
  const recentSessions = getRecentSessions(history, 5);
  
  // First time doing exercise
  if (recentSessions.length === 0) {
    return {
      recommendedWeight: null,
      reasoning: 'first_time',
      confidence: 'low',
      message: 'Start with a weight you can control for all reps'
    };
  }
  
  const lastSession = recentSessions[0];
  const lastWeight = getLastWeight(lastSession);
  
  // Check for easy completion (ready to progress)
  if (lastSession.averageRPE <= 7 && lastSession.completionRate >= 95) {
    const increase = calculateIncrease(lastWeight, trainingStyle);
    return {
      recommendedWeight: lastWeight + increase,
      reasoning: 'increase_progression',
      confidence: 'high',
      message: `Great progress! Increase by ${increase} lbs`
    };
  }
  
  // Check for failure (need to decrease)
  if (lastSession.completionRate < 75) {
    const decrease = calculateDecrease(lastWeight, 'recovery');
    return {
      recommendedWeight: lastWeight - decrease,
      reasoning: 'decrease_recovery',
      confidence: 'high',
      message: `Reduce weight to build back up`
    };
  }
  
  // Check for declining trend (potential deload needed)
  if (recentSessions.length >= 3) {
    const trend = analyzeTrend(recentSessions);
    if (trend === 'declining') {
      const deloadWeight = calculateDeload(lastWeight);
      return {
        recommendedWeight: deloadWeight,
        reasoning: 'deload_fatigue',
        confidence: 'medium',
        message: 'Performance declining - consider a deload week'
      };
    }
  }
  
  // Default: maintain current weight
  return {
    recommendedWeight: lastWeight,
    reasoning: 'maintain_consolidate',
    confidence: 'medium',
    message: 'Keep current weight and focus on form'
  };
}
```

### Weight Adjustment Calculations

```typescript
function calculateIncrease(
  currentWeight: number, 
  trainingStyle: TrainingStyle
): number {
  // Percentage-based increase
  const percentages = {
    strength: 0.05,      // 5% for strength training
    hypertrophy: 0.025,  // 2.5% for hypertrophy
    endurance: 0.025     // 2.5% for endurance
  };
  
  const rawIncrease = currentWeight * percentages[trainingStyle];
  
  // Round to nearest practical increment
  return roundToIncrement(rawIncrease, 2.5); // 2.5 lb increments
}

function calculateDecrease(
  currentWeight: number, 
  reason: 'recovery' | 'deload'
): number {
  const percentages = {
    recovery: 0.10,  // 10% reduction for recovery
    deload: 0.15     // 15% reduction for deload
  };
  
  const rawDecrease = currentWeight * percentages[reason];
  return roundToIncrement(rawDecrease, 2.5);
}

function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}
```

### Trend Analysis

```typescript
type Trend = 'improving' | 'stable' | 'declining';

function analyzeTrend(sessions: SessionData[]): Trend {
  if (sessions.length < 3) return 'stable';
  
  // Calculate moving average of volume
  const volumes = sessions.map(s => s.totalVolume);
  
  // Compare recent vs older sessions
  const recentAvg = average(volumes.slice(0, 2));
  const olderAvg = average(volumes.slice(2));
  
  const changePercent = (recentAvg - olderAvg) / olderAvg * 100;
  
  if (changePercent > 5) return 'improving';
  if (changePercent < -5) return 'declining';
  return 'stable';
}
```

---

## Deload Detection

### When to Suggest Deload

```typescript
interface DeloadIndicators {
  volumeDecline: boolean;        // Volume down >5% over 3 sessions
  rpeIncreasing: boolean;        // Same weight feels harder
  completionDropping: boolean;   // Missing more reps
  frequencyDecline: boolean;     // Working out less often
  consecutiveHardWeeks: number;  // Weeks at RPE 9-10
}

function shouldSuggestDeload(indicators: DeloadIndicators): boolean {
  let score = 0;
  
  if (indicators.volumeDecline) score += 2;
  if (indicators.rpeIncreasing) score += 2;
  if (indicators.completionDropping) score += 2;
  if (indicators.frequencyDecline) score += 1;
  if (indicators.consecutiveHardWeeks >= 4) score += 3;
  
  return score >= 4; // Threshold for deload suggestion
}
```

### Deload Protocol

```typescript
const DELOAD_PROTOCOL = {
  volumeReduction: 0.50,      // Reduce volume by 50%
  intensityReduction: 0.15,   // Reduce weight by 15%
  duration: 7,                // Days
  
  message: `
    Deload Week Recommended:
    • Reduce weights by 15%
    • Reduce sets by 50%
    • Focus on form and recovery
    • Resume normal training next week
  `
};
```

---

# Part 2: Progress Tracker

## Purpose

Log completed workouts and provide comprehensive analytics to help users:
- Track their strength progression
- Identify personal records
- Understand training volume patterns
- Recognize plateaus and breakthroughs
- Monitor weekly plan adherence

---

## Data Collection

### What Gets Tracked

```typescript
interface WorkoutSession {
  id: string;
  weeklyPlanId: string;
  dailyWorkoutId: string;
  dayNumber: number;
  dayName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  exercises: WorkoutExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  duration: number;           // Minutes
  notes?: string;
}

interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  personalRecord?: PRType;
}

interface WorkoutSet {
  setNumber: number;
  weight: number;
  targetReps: number;
  completedReps: number;
  rpe: number;
  isWarmup: boolean;
  notes?: string;
}

type PRType = 'weight' | 'reps' | 'volume' | 'estimated_1rm';
```

### Weekly Plan Adherence Tracking

```typescript
interface WeeklyAdherence {
  weeklyPlanId: string;
  weekStartDate: Date;
  plannedWorkouts: number;
  completedWorkouts: number;
  adherenceRate: number;          // Percentage
  completedDays: number[];        // [1, 2, 4] means days 1, 2, and 4 completed
  missedDays: number[];           // [3] means day 3 was missed
  muscleGroupCoverage: Record<MuscleGroup, boolean>;
}

function calculateWeeklyAdherence(
  plan: WeeklyPlan,
  sessions: WorkoutSession[],
  weekStartDate: Date
): WeeklyAdherence {
  const weekSessions = sessions.filter(s => 
    s.weeklyPlanId === plan.id &&
    isWithinWeek(s.date, weekStartDate)
  );
  
  const completedDays = weekSessions.map(s => s.dayNumber);
  const missedDays = plan.workouts
    .map(w => w.dayNumber)
    .filter(d => !completedDays.includes(d));
  
  const allMuscles = plan.workouts.flatMap(w => w.targetMuscles);
  const trainedMuscles = weekSessions.flatMap(s => 
    plan.workouts.find(w => w.dayNumber === s.dayNumber)?.targetMuscles || []
  );
  
  const muscleGroupCoverage = {} as Record<MuscleGroup, boolean>;
  allMuscles.forEach(muscle => {
    muscleGroupCoverage[muscle] = trainedMuscles.includes(muscle);
  });
  
  return {
    weeklyPlanId: plan.id,
    weekStartDate,
    plannedWorkouts: plan.daysPerWeek,
    completedWorkouts: completedDays.length,
    adherenceRate: (completedDays.length / plan.daysPerWeek) * 100,
    completedDays,
    missedDays,
    muscleGroupCoverage
  };
}
```

---

## Analytics Engine

### Estimated 1RM Calculation

```typescript
// Epley Formula (most common)
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 12) return weight * (1 + reps / 30); // Less accurate for high reps
  return weight * (1 + reps / 30);
}

// Brzycki Formula (alternative)
function calculate1RMBrzycki(weight: number, reps: number): number {
  return weight * (36 / (37 - reps));
}

// Use average of both for better accuracy
function estimatedMax(weight: number, reps: number): number {
  const epley = calculate1RM(weight, reps);
  const brzycki = calculate1RMBrzycki(weight, reps);
  return Math.round((epley + brzycki) / 2);
}
```

### Volume Calculations

```typescript
interface VolumeMetrics {
  dailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  volumeByMuscle: Record<MuscleGroup, number>;
  volumeByDay: Record<number, number>;     // By day number in weekly plan
  volumeTrend: Trend;
}

function calculateVolumeMetrics(
  sessions: WorkoutSession[],
  exercises: Exercise[],
  weeklyPlan?: WeeklyPlan
): VolumeMetrics {
  
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const monthAgo = subDays(now, 30);
  
  // Filter sessions by timeframe
  const todaySessions = sessions.filter(s => isSameDay(s.date, now));
  const weekSessions = sessions.filter(s => s.date >= weekAgo);
  const monthSessions = sessions.filter(s => s.date >= monthAgo);
  
  // Calculate totals
  const dailyVolume = sumVolume(todaySessions);
  const weeklyVolume = sumVolume(weekSessions);
  const monthlyVolume = sumVolume(monthSessions);
  
  // Volume by muscle group
  const volumeByMuscle = calculateVolumeByMuscle(monthSessions, exercises);
  
  // Volume by day number (for weekly plan analysis)
  const volumeByDay: Record<number, number> = {};
  if (weeklyPlan) {
    weekSessions.forEach(session => {
      volumeByDay[session.dayNumber] = (volumeByDay[session.dayNumber] || 0) + session.totalVolume;
    });
  }
  
  // Determine trend
  const volumeTrend = compareWeeklyVolumes(sessions);
  
  return {
    dailyVolume,
    weeklyVolume,
    monthlyVolume,
    volumeByMuscle,
    volumeByDay,
    volumeTrend
  };
}

function calculateVolumeByMuscle(
  sessions: WorkoutSession[],
  exercises: Exercise[]
): Record<MuscleGroup, number> {
  
  const volumeMap: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  
  sessions.forEach(session => {
    session.exercises.forEach(we => {
      const exercise = exercises.find(e => e.id === we.exerciseId);
      if (!exercise) return;
      
      const exerciseVolume = we.sets.reduce((sum, set) => 
        sum + (set.weight * set.completedReps), 0
      );
      
      // Distribute to primary muscles (100%)
      exercise.primaryMuscles.forEach(muscle => {
        volumeMap[muscle] = (volumeMap[muscle] || 0) + exerciseVolume;
      });
      
      // Distribute to secondary muscles (50%)
      exercise.secondaryMuscles.forEach(muscle => {
        volumeMap[muscle] = (volumeMap[muscle] || 0) + (exerciseVolume * 0.5);
      });
    });
  });
  
  return volumeMap;
}
```

### Personal Records Detection

```typescript
interface PersonalRecord {
  exerciseId: string;
  type: PRType;
  value: number;
  date: Date;
  previousValue?: number;
  improvement?: number;
  weeklyPlanId?: string;
  dayNumber?: number;
}

function detectPersonalRecords(
  currentSession: WorkoutSession,
  historicalData: Map<string, ExerciseHistory>
): PersonalRecord[] {
  
  const newPRs: PersonalRecord[] = [];
  
  currentSession.exercises.forEach(exercise => {
    const history = historicalData.get(exercise.exerciseId);
    if (!history) return;
    
    // Check for weight PR (heaviest lift)
    const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
    if (maxWeight > history.maxWeight) {
      newPRs.push({
        exerciseId: exercise.exerciseId,
        type: 'weight',
        value: maxWeight,
        date: currentSession.date,
        previousValue: history.maxWeight,
        improvement: maxWeight - history.maxWeight,
        weeklyPlanId: currentSession.weeklyPlanId,
        dayNumber: currentSession.dayNumber
      });
    }
    
    // Check for rep PR (most reps at a given weight)
    exercise.sets.forEach(set => {
      const previousMaxReps = history.maxRepsAtWeight[set.weight] || 0;
      if (set.completedReps > previousMaxReps) {
        newPRs.push({
          exerciseId: exercise.exerciseId,
          type: 'reps',
          value: set.completedReps,
          date: currentSession.date,
          previousValue: previousMaxReps,
          weeklyPlanId: currentSession.weeklyPlanId,
          dayNumber: currentSession.dayNumber
        });
      }
    });
    
    // Check for estimated 1RM PR
    const best1RM = Math.max(...exercise.sets.map(s => 
      estimatedMax(s.weight, s.completedReps)
    ));
    if (best1RM > history.estimated1RM) {
      newPRs.push({
        exerciseId: exercise.exerciseId,
        type: 'estimated_1rm',
        value: best1RM,
        date: currentSession.date,
        previousValue: history.estimated1RM,
        improvement: best1RM - history.estimated1RM,
        weeklyPlanId: currentSession.weeklyPlanId,
        dayNumber: currentSession.dayNumber
      });
    }
  });
  
  return newPRs;
}
```

---

## Analytics Dashboard Data

### Strength Progression Chart

```typescript
interface StrengthProgressionData {
  exerciseId: string;
  exerciseName: string;
  dataPoints: {
    date: Date;
    weight: number;
    estimated1RM: number;
    volume: number;
    dayNumber?: number;
  }[];
  improvement: {
    weight: number;       // lbs gained
    percentage: number;   // % improvement
    timeframe: string;    // "4 weeks"
  };
}

function getStrengthProgression(
  exerciseId: string,
  sessions: WorkoutSession[],
  timeframeDays: number = 30
): StrengthProgressionData {
  
  const cutoffDate = subDays(new Date(), timeframeDays);
  
  const dataPoints = sessions
    .filter(s => s.date >= cutoffDate)
    .flatMap(session => {
      const exercise = session.exercises.find(e => e.exerciseId === exerciseId);
      if (!exercise) return [];
      
      const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
      const maxSet = exercise.sets.find(s => s.weight === maxWeight);
      
      return [{
        date: session.date,
        weight: maxWeight,
        estimated1RM: estimatedMax(maxSet.weight, maxSet.completedReps),
        volume: exercise.sets.reduce((sum, s) => sum + s.weight * s.completedReps, 0),
        dayNumber: session.dayNumber
      }];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate improvement
  const firstPoint = dataPoints[0];
  const lastPoint = dataPoints[dataPoints.length - 1];
  
  return {
    exerciseId,
    exerciseName: getExerciseName(exerciseId),
    dataPoints,
    improvement: {
      weight: lastPoint.weight - firstPoint.weight,
      percentage: ((lastPoint.weight - firstPoint.weight) / firstPoint.weight) * 100,
      timeframe: `${timeframeDays} days`
    }
  };
}
```

### Weekly Plan Progress

```typescript
interface WeeklyPlanProgress {
  weeklyPlanId: string;
  planName: string;
  weeksCompleted: number;
  totalSessions: number;
  averageAdherenceRate: number;
  volumeProgression: {
    week: number;
    totalVolume: number;
    volumeByMuscle: Record<MuscleGroup, number>;
  }[];
  strengthGains: {
    exerciseId: string;
    exerciseName: string;
    startWeight: number;
    currentWeight: number;
    percentageGain: number;
  }[];
}

function analyzeWeeklyPlanProgress(
  planId: string,
  sessions: WorkoutSession[],
  exercises: Exercise[]
): WeeklyPlanProgress {
  const planSessions = sessions.filter(s => s.weeklyPlanId === planId);
  const weeks = groupByWeek(planSessions);
  
  const volumeProgression = Object.entries(weeks).map(([weekNum, weekSessions]) => ({
    week: parseInt(weekNum),
    totalVolume: sumVolume(weekSessions),
    volumeByMuscle: calculateVolumeByMuscle(weekSessions, exercises)
  }));
  
  // Calculate strength gains for main exercises
  const exerciseIds = [...new Set(planSessions.flatMap(s => s.exercises.map(e => e.exerciseId)))];
  const strengthGains = exerciseIds.map(exerciseId => {
    const firstSession = planSessions.find(s => s.exercises.some(e => e.exerciseId === exerciseId));
    const lastSession = [...planSessions].reverse().find(s => s.exercises.some(e => e.exerciseId === exerciseId));
    
    const startWeight = getMaxWeight(firstSession, exerciseId);
    const currentWeight = getMaxWeight(lastSession, exerciseId);
    
    return {
      exerciseId,
      exerciseName: getExerciseName(exerciseId),
      startWeight,
      currentWeight,
      percentageGain: ((currentWeight - startWeight) / startWeight) * 100
    };
  });
  
  return {
    weeklyPlanId: planId,
    planName: getPlanName(planId),
    weeksCompleted: Object.keys(weeks).length,
    totalSessions: planSessions.length,
    averageAdherenceRate: calculateAverageAdherence(planId, sessions),
    volumeProgression,
    strengthGains
  };
}
```

### Workout Frequency

```typescript
interface FrequencyData {
  weekly: number;          // Average workouts per week
  byDayOfWeek: Record<string, number>;
  byDayNumber: Record<number, number>;  // By day in weekly plan
  streak: number;          // Current consecutive weeks
  longestStreak: number;
  missedDays: Date[];
}

function analyzeFrequency(
  sessions: WorkoutSession[],
  weeklyPlan?: WeeklyPlan
): FrequencyData {
  const weeks = groupByWeek(sessions);
  const weekly = average(Object.values(weeks).map(w => w.length));
  
  // Count by day of week
  const byDayOfWeek = sessions.reduce((acc, session) => {
    const day = format(session.date, 'EEEE');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count by day number in weekly plan
  const byDayNumber = sessions.reduce((acc, session) => {
    acc[session.dayNumber] = (acc[session.dayNumber] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  return {
    weekly: Math.round(weekly * 10) / 10,
    byDayOfWeek,
    byDayNumber,
    streak: calculateCurrentStreak(sessions),
    longestStreak: calculateLongestStreak(sessions),
    missedDays: findMissedDays(sessions, weeklyPlan)
  };
}
```

### Muscle Group Balance

```typescript
interface MuscleBalance {
  muscleGroup: MuscleGroup;
  actualSets: number;
  targetMinSets: number;
  targetMaxSets: number;
  percentage: number;
  status: 'balanced' | 'overtrained' | 'undertrained';
  recommendation?: string;
}

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

function analyzeMuscleBalance(
  weekSessions: WorkoutSession[],
  exercises: Exercise[]
): MuscleBalance[] {
  
  // Calculate actual sets per muscle from the week
  const setsByMuscle = calculateWeeklySetsByMuscle(weekSessions, exercises);
  
  return Object.entries(WEEKLY_VOLUME_TARGETS).map(([muscle, targets]) => {
    const actualSets = setsByMuscle[muscle as MuscleGroup] || 0;
    const midTarget = (targets.min + targets.max) / 2;
    const percentage = (actualSets / midTarget) * 100;
    
    let status: MuscleBalance['status'] = 'balanced';
    let recommendation: string | undefined;
    
    if (actualSets < targets.min) {
      status = 'undertrained';
      recommendation = `Add ${targets.min - actualSets} more sets of ${muscle} exercises`;
    } else if (actualSets > targets.max) {
      status = 'overtrained';
      recommendation = `Consider reducing ${muscle} volume by ${actualSets - targets.max} sets`;
    }
    
    return {
      muscleGroup: muscle as MuscleGroup,
      actualSets: Math.round(actualSets),
      targetMinSets: targets.min,
      targetMaxSets: targets.max,
      percentage: Math.round(percentage),
      status,
      recommendation
    };
  });
}

function calculateWeeklySetsByMuscle(
  sessions: WorkoutSession[],
  exercises: Exercise[]
): Record<MuscleGroup, number> {
  const setsByMuscle: Record<string, number> = {};
  
  sessions.forEach(session => {
    session.exercises.forEach(we => {
      const exercise = exercises.find(e => e.id === we.exerciseId);
      if (!exercise) return;
      
      const completedSets = we.sets.filter(s => !s.isWarmup).length;
      
      // Primary muscles get full credit
      exercise.primaryMuscles.forEach(muscle => {
        setsByMuscle[muscle] = (setsByMuscle[muscle] || 0) + completedSets;
      });
      
      // Secondary muscles get half credit
      exercise.secondaryMuscles.forEach(muscle => {
        setsByMuscle[muscle] = (setsByMuscle[muscle] || 0) + (completedSets * 0.5);
      });
    });
  });
  
  return setsByMuscle as Record<MuscleGroup, number>;
}
```

---

## Visualizations

### Chart Types

| Chart | Purpose | Library |
|-------|---------|---------|
| Line Chart | Strength progression over time | Recharts |
| Bar Chart | Volume by muscle group | Recharts |
| Stacked Bar | Volume by day in weekly plan | Recharts |
| Heatmap | Workout frequency calendar | Custom |
| Radar Chart | Muscle group balance | Recharts |
| Area Chart | Volume trends | Recharts |
| Progress Ring | Weekly plan adherence | Custom |

### Example Chart Configurations

```typescript
// Strength Progression Line Chart
const strengthChartConfig = {
  data: progressionData,
  xAxis: { dataKey: 'date', tickFormatter: formatDate },
  yAxis: { label: 'Weight (lbs)' },
  lines: [
    { dataKey: 'weight', stroke: '#3B82F6', name: 'Working Weight' },
    { dataKey: 'estimated1RM', stroke: '#10B981', name: 'Estimated 1RM' }
  ],
  tooltip: { formatter: (value) => `${value} lbs` }
};

// Volume by Muscle Bar Chart
const volumeChartConfig = {
  data: muscleVolumeData,
  xAxis: { dataKey: 'muscleGroup' },
  yAxis: { label: 'Sets' },
  bars: [
    { dataKey: 'actualSets', fill: '#6366F1', name: 'Actual' },
    { dataKey: 'targetMinSets', fill: '#E5E7EB', name: 'Target Min' }
  ],
  reference: {
    type: 'line',
    y: averageVolume,
    label: 'Average'
  }
};

// Weekly Plan Volume by Day
const weeklyVolumeConfig = {
  data: volumeByDayData,
  xAxis: { dataKey: 'dayName' },  // "Push", "Pull", "Legs", etc.
  yAxis: { label: 'Volume (lbs)' },
  bars: [
    { dataKey: 'volume', fill: '#8B5CF6' }
  ]
};

// Muscle Balance Radar Chart
const muscleBalanceRadarConfig = {
  data: muscleBalanceData,
  angleAxis: { dataKey: 'muscleGroup' },
  radiusAxis: { domain: [0, 150] },  // Percentage of target
  radar: [
    { dataKey: 'percentage', fill: '#3B82F6', fillOpacity: 0.6 }
  ],
  reference: {
    type: 'circle',
    r: 100,  // 100% = target
    stroke: '#10B981'
  }
};
```

---

## Data Export

### Supported Formats

```typescript
interface ExportOptions {
  format: 'json' | 'csv';
  dateRange: {
    start: Date;
    end: Date;
  };
  weeklyPlanId?: string;      // Export specific plan only
  includeExercises: boolean;
  includeWeeklyPlans: boolean;
  includeAnalytics: boolean;
}

async function exportData(options: ExportOptions): Promise<Blob> {
  const data = await gatherExportData(options);
  
  if (options.format === 'json') {
    return new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
  }
  
  if (options.format === 'csv') {
    return convertToCSV(data);
  }
}
```

### Import/Restore

```typescript
interface ImportResult {
  success: boolean;
  imported: {
    workouts: number;
    weeklyPlans: number;
    exercises: number;
  };
  errors: string[];
}

async function importData(file: File): Promise<ImportResult> {
  const content = await file.text();
  const data = JSON.parse(content);
  
  // Validate data structure
  const validation = validateImportData(data);
  if (!validation.valid) {
    return { 
      success: false, 
      imported: { workouts: 0, weeklyPlans: 0, exercises: 0 }, 
      errors: validation.errors 
    };
  }
  
  // Import to database
  await db.transaction('rw', [db.workouts, db.weeklyPlans], async () => {
    await db.workouts.bulkAdd(data.workouts);
    await db.weeklyPlans.bulkAdd(data.weeklyPlans);
  });
  
  return {
    success: true,
    imported: {
      workouts: data.workouts.length,
      weeklyPlans: data.weeklyPlans.length,
      exercises: 0
    },
    errors: []
  };
}
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Log workout set | < 500ms |
| Calculate analytics | < 2 seconds |
| Load 30-day history | < 1 second |
| Load weekly plan progress | < 1 second |
| Export all data | < 5 seconds |
| PR detection | Real-time |

---

## User Feedback Integration

### RPE Collection UI Flow

```
1. User completes set
2. System prompts: "How hard was that? (1-10)"
3. User selects RPE via slider or number input
4. Optional: User adds note
5. Rest timer starts
6. Data saved to current session
```

### Completion Tracking

```
For each set:
- Target reps displayed (from weekly plan)
- User inputs actual completed reps
- System calculates completion rate
- Visual feedback (green/yellow/red)
- Automatic adjustment suggestion if needed
```

### Weekly Plan Integration

```
Starting a workout:
1. User opens app
2. System identifies current weekly plan
3. System suggests "Today's workout: Day 2 - Pull"
4. User taps to start
5. Exercises and targets loaded from plan
6. Progress tracked against plan

After workout:
1. Session saved with weeklyPlanId and dayNumber
2. Weekly adherence updated
3. Analytics recalculated
4. Next workout suggested
```

---

## Summary

The Weight Recommendation and Progress Tracker systems work together with the Weekly Plan structure to create an intelligent training feedback loop:

1. **Weekly Plan Generator** creates balanced weekly plans covering all muscle groups
2. **Weight Recommender** uses historical data to suggest optimal weights for each exercise
3. **Progress Tracker** logs actual performance linked to specific days in the plan
4. **Analytics Engine** identifies trends, PRs, and muscle balance across the week
5. **Adherence Tracking** monitors plan completion and suggests adjustments
6. **Feedback Loop** improves future recommendations and plan adjustments

This client-side approach provides professional-level training guidance without requiring a backend server, personal trainer, or subscription fees.
