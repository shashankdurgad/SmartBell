import { z } from 'zod';

export const weeklyPlanConstraintsSchema = z.object({
  daysPerWeek: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    z.literal(5), z.literal(6), z.literal(7),
  ]),
  availableEquipment: z.array(z.string()).min(1, 'Select at least one equipment type'),
  timePerSession: z.number().min(15, 'Minimum 15 minutes').max(120, 'Maximum 120 minutes'),
  trainingStyle: z.enum(['strength', 'hypertrophy', 'endurance']),
  difficulty: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  excludeExercises: z.array(z.string()).optional(),
  preferredRestDays: z.array(
    z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  ).optional(),
});

export type WeeklyPlanConstraints = z.infer<typeof weeklyPlanConstraintsSchema>;

export const workoutSetSchema = z.object({
  setNumber: z.number().int().positive(),
  weight: z.number().min(0),
  targetReps: z.number().int().positive(),
  completedReps: z.number().int().min(0),
  rpe: z.number().min(1).max(10),
  isWarmup: z.boolean(),
  notes: z.string().optional(),
});

export const settingsSchema = z.object({
  weightUnit: z.enum(['lbs', 'kg']),
  defaultRestSeconds: z.number().min(10).max(600),
  defaultTrainingStyle: z.enum(['strength', 'hypertrophy', 'endurance']),
});

export type AppSettings = z.infer<typeof settingsSchema>;
