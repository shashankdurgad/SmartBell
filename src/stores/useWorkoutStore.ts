import { create } from 'zustand';
import type { WorkoutSession, WorkoutExercise, WorkoutSet, PRType } from '../types';
import { workoutRepo } from '../database/repositories/workoutRepo';

interface WorkoutState {
  activeSession: WorkoutSession | null;
  currentExerciseIndex: number;
  isResting: boolean;
  restTimeRemaining: number;
  history: WorkoutSession[];
  isLoading: boolean;

  loadHistory: () => Promise<void>;
  startSession: (session: Omit<WorkoutSession, 'id' | 'totalVolume' | 'totalSets' | 'totalReps' | 'duration'>) => void;
  endSession: () => Promise<WorkoutSession | null>;
  setCurrentExerciseIndex: (index: number) => void;
  logSet: (exerciseIndex: number, set: WorkoutSet) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  startRest: (seconds: number) => void;
  tickRest: () => void;
  skipRest: () => void;
  markPersonalRecord: (exerciseIndex: number, type: PRType) => void;
  cancelSession: () => void;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function calculateSessionStats(exercises: WorkoutExercise[]) {
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (!set.isWarmup) {
        totalVolume += set.weight * set.completedReps;
        totalSets += 1;
        totalReps += set.completedReps;
      }
    }
  }

  return { totalVolume, totalSets, totalReps };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSession: null,
  currentExerciseIndex: 0,
  isResting: false,
  restTimeRemaining: 0,
  history: [],
  isLoading: false,

  loadHistory: async () => {
    set({ isLoading: true });
    const history = await workoutRepo.getAll();
    set({ history, isLoading: false });
  },

  startSession: (sessionData) => {
    const session: WorkoutSession = {
      ...sessionData,
      id: generateId(),
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      duration: 0,
    };
    set({ activeSession: session, currentExerciseIndex: 0 });
  },

  endSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return null;

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - activeSession.startTime.getTime()) / 60000
    );
    const stats = calculateSessionStats(activeSession.exercises);

    const completed: WorkoutSession = {
      ...activeSession,
      endTime,
      duration,
      ...stats,
    };

    await workoutRepo.save(completed);
    const history = await workoutRepo.getAll();
    set({ activeSession: null, currentExerciseIndex: 0, history });
    return completed;
  },

  setCurrentExerciseIndex: (index: number) => {
    set({ currentExerciseIndex: index });
  },

  logSet: (exerciseIndex: number, newSet: WorkoutSet) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const exercises = [...activeSession.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    exercise.sets = [...exercise.sets, newSet];
    exercises[exerciseIndex] = exercise;

    set({
      activeSession: { ...activeSession, exercises },
    });
  },

  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const exercises = [...activeSession.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    const sets = [...exercise.sets];
    sets[setIndex] = { ...sets[setIndex], ...updates };
    exercise.sets = sets;
    exercises[exerciseIndex] = exercise;

    set({
      activeSession: { ...activeSession, exercises },
    });
  },

  startRest: (seconds: number) => {
    set({ isResting: true, restTimeRemaining: seconds });
  },

  tickRest: () => {
    const { restTimeRemaining } = get();
    if (restTimeRemaining <= 1) {
      set({ isResting: false, restTimeRemaining: 0 });
    } else {
      set({ restTimeRemaining: restTimeRemaining - 1 });
    }
  },

  skipRest: () => {
    set({ isResting: false, restTimeRemaining: 0 });
  },

  markPersonalRecord: (exerciseIndex: number, type: PRType) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], personalRecord: type };
    set({ activeSession: { ...activeSession, exercises } });
  },

  cancelSession: () => {
    set({ activeSession: null, currentExerciseIndex: 0 });
  },
}));
