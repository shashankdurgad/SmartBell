import { db } from '../db';
import type { PersonalRecord, PRType } from '../../types';

export const personalRecordRepo = {
  async getByExerciseId(exerciseId: string): Promise<PersonalRecord[]> {
    return db.personalRecords
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();
  },

  async getBestForExercise(
    exerciseId: string,
    type: PRType
  ): Promise<PersonalRecord | undefined> {
    const records = await db.personalRecords
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();
    return records
      .filter((r) => r.type === type)
      .sort((a, b) => b.value - a.value)[0];
  },

  async save(record: PersonalRecord): Promise<string> {
    return db.personalRecords.put(record);
  },

  async getRecent(limit = 10): Promise<PersonalRecord[]> {
    return db.personalRecords
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getAll(): Promise<PersonalRecord[]> {
    return db.personalRecords.orderBy('date').reverse().toArray();
  },
}