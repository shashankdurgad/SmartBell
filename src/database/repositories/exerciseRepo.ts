import { db } from '../db';
import type { Exercise, MuscleGroup, Equipment } from '../../types';

export const exerciseRepo = {
  async getAll(): Promise<Exercise[]> {
    return db.exercises.toArray();
  },

  async getById(id: string): Promise<Exercise | undefined> {
    return db.exercises.get(id);
  },

  async getByMuscleGroup(muscle: MuscleGroup): Promise<Exercise[]> {
    return db.exercises
      .where('primaryMuscles')
      .equals(muscle)
      .toArray();
  },

  async getByEquipment(equipment: Equipment): Promise<Exercise[]> {
    if (equipment === null) {
      return db.exercises.where('equipment').equals('body only').toArray();
    }
    return db.exercises.where('equipment').equals(equipment).toArray();
  },

  async search(query: string): Promise<Exercise[]> {
    const lower = query.toLowerCase();
    return db.exercises
      .filter((ex) => ex.name.toLowerCase().includes(lower))
      .toArray();
  },

  async getFiltered(filters: {
    muscles?: MuscleGroup[];
    equipment?: Equipment[];
    level?: string;
    category?: string;
  }): Promise<Exercise[]> {
    let collection = db.exercises.toCollection();

    return collection.filter((ex) => {
      if (filters.muscles && filters.muscles.length > 0) {
        const hasMatch = ex.primaryMuscles.some((m) => filters.muscles!.includes(m));
        if (!hasMatch) return false;
      }
      if (filters.equipment && filters.equipment.length > 0) {
        if (!filters.equipment.includes(ex.equipment)) return false;
      }
      if (filters.level && ex.level !== filters.level) return false;
      if (filters.category && ex.category !== filters.category) return false;
      return true;
    }).toArray();
  },

  async count(): Promise<number> {
    return db.exercises.count();
  },
};
