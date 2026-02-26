import { db } from '../db';
import type { WorkoutSession } from '../../types';

export const workoutRepo = {
  async getAll(): Promise<WorkoutSession[]> {
    return db.workoutSessions.orderBy('date').reverse().toArray();
  },

  async getById(id: string): Promise<WorkoutSession | undefined> {
    return db.workoutSessions.get(id);
  },

  async getByPlanId(weeklyPlanId: string): Promise<WorkoutSession[]> {
    return db.workoutSessions
      .where('weeklyPlanId')
      .equals(weeklyPlanId)
      .toArray();
  },

  async getByDateRange(start: Date, end: Date): Promise<WorkoutSession[]> {
    return db.workoutSessions
      .where('date')
      .between(start, end)
      .toArray();
  },

  async getByExerciseId(exerciseId: string): Promise<WorkoutSession[]> {
    return db.workoutSessions
      .filter((session) =>
        session.exercises.some((e) => e.exerciseId === exerciseId)
      )
      .toArray();
  },

  async save(session: WorkoutSession): Promise<string> {
    return db.workoutSessions.put(session);
  },

  async delete(id: string): Promise<void> {
    await db.workoutSessions.delete(id);
  },

  async count(): Promise<number> {
    return db.workoutSessions.count();
  },
};
