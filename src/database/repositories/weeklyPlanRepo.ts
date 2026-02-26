import { db } from '../db';
import type { WeeklyPlan } from '../../types';

export const weeklyPlanRepo = {
  async getAll(): Promise<WeeklyPlan[]> {
    return db.weeklyPlans.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<WeeklyPlan | undefined> {
    return db.weeklyPlans.get(id);
  },

  async save(plan: WeeklyPlan): Promise<string> {
    return db.weeklyPlans.put(plan);
  },

  async delete(id: string): Promise<void> {
    await db.weeklyPlans.delete(id);
  },

  async count(): Promise<number> {
    return db.weeklyPlans.count();
  },
};
