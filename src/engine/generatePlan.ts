import type { WeeklyPlanConstraints } from '../utils/validators';
import type { WeeklyPlan } from '../types';
import { SPLIT_TEMPLATES } from '@/data/split-templates';

export async function generateWeeklyPlan(
  constraints: WeeklyPlanConstraints
): Promise<WeeklyPlan> { 
    /*
        
    LOGIC:
        globals: SETS/REPS/REST (from experience / discipline)
        total sets = ceiling( maxSessionTime / (SETS + REST))
        
        for day in split
            for muscle in day
                muscle_sets = ceileing (MG/100 * total sets)
                exercise_num = ceiling (muscle_sets / SETS)
                exercises = (from querying) Limit to exercise_num
        
        CLAMP RESULTS

    */ 
    const split = SPLIT_TEMPLATES[constraints.daysPerWeek];
    console.log(split);

    
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    // Hardcoded plan for testing
  const plan: WeeklyPlan = {
    id: crypto.randomUUID(),
    name: `${constraints.trainingStyle} ${constraints.daysPerWeek}-Day Plan`,
    createdAt: new Date(),
    daysPerWeek: constraints.daysPerWeek,
    trainingStyle: constraints.trainingStyle,
    totalWeeklyVolume: 60,
    estimatedWeeklyDuration: constraints.timePerSession * constraints.daysPerWeek,
    workouts: [
      {
        id: crypto.randomUUID(),
        dayNumber: 1,
        name: 'Push',
        targetMuscles: ['chest', 'shoulders', 'triceps'],
        estimatedDuration: constraints.timePerSession,
        exercises: [
          {
            exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
            exerciseName: 'Barbell Bench Press',
            sets: 4,
            reps: '8-12',
            restSeconds: 90,
          },
          {
            exerciseId: 'Overhead_Press',
            exerciseName: 'Overhead Press',
            sets: 3,
            reps: '8-12',
            restSeconds: 90,
          },
          {
            exerciseId: 'Dumbbell_Flyes',
            exerciseName: 'Dumbbell Flyes',
            sets: 3,
            reps: '10-15',
            restSeconds: 60,
          },
          {
            exerciseId: 'Triceps_Pushdown',
            exerciseName: 'Triceps Pushdown',
            sets: 3,
            reps: '10-15',
            restSeconds: 60,
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        dayNumber: 2,
        name: 'Pull',
        targetMuscles: ['lats', 'middle back', 'biceps'],
        estimatedDuration: constraints.timePerSession,
        exercises: [
          {
            exerciseId: 'Barbell_Deadlift',
            exerciseName: 'Barbell Deadlift',
            sets: 4,
            reps: '5-8',
            restSeconds: 120,
          },
          {
            exerciseId: 'Pulldowns',
            exerciseName: 'Lat Pulldown',
            sets: 3,
            reps: '8-12',
            restSeconds: 90,
          },
          {
            exerciseId: 'Seated_Cable_Rows',
            exerciseName: 'Seated Cable Row',
            sets: 3,
            reps: '10-12',
            restSeconds: 90,
          },
          {
            exerciseId: 'Barbell_Curl',
            exerciseName: 'Barbell Curl',
            sets: 3,
            reps: '10-15',
            restSeconds: 60,
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        dayNumber: 3,
        name: 'Legs',
        targetMuscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        estimatedDuration: constraints.timePerSession,
        exercises: [
          {
            exerciseId: 'Barbell_Squat',
            exerciseName: 'Barbell Squat',
            sets: 4,
            reps: '6-10',
            restSeconds: 120,
          },
          {
            exerciseId: 'Leg_Press',
            exerciseName: 'Leg Press',
            sets: 3,
            reps: '10-12',
            restSeconds: 90,
          },
          {
            exerciseId: 'Lying_Leg_Curls',
            exerciseName: 'Lying Leg Curl',
            sets: 3,
            reps: '10-15',
            restSeconds: 60,
          },
          {
            exerciseId: 'Standing_Calf_Raises',
            exerciseName: 'Standing Calf Raise',
            sets: 4,
            reps: '12-20',
            restSeconds: 60,
          },
        ],
      },
    ],
  };

  return plan;

}