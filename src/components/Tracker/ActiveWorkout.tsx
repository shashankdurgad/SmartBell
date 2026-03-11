import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Modal } from '../shared/Modal';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { useUserStore } from '../../stores/useUserStore';
import { getWeightRecommendation } from '../../engine/weightRecommender';
import { personalRecordRepo } from '../../database/repositories/personalRecordRepo';
import { estimatedMax, calculateSetVolume, generateId, lbsToKg, kgToLbs } from '../../utils/calculations';
import { formatTimer, formatWeight } from '../../utils/formatters';
import type { WorkoutSet, WeightRecommendation, PersonalRecord } from '../../types';

function RestTimer({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-dark-900/95 flex flex-col items-center justify-center gap-6">
      <p className="text-gray-text text-sm uppercase tracking-widest">Rest</p>
      <p className="text-7xl font-bold text-white tabular-nums">{formatTimer(seconds)}</p>
      <Button variant="secondary" onClick={onSkip}>Skip Rest</Button>
    </div>
  );
}

interface SetLoggerProps {
  setNumber: number;
  targetSets: number;
  targetReps: number;
  recommendation: WeightRecommendation | null;
  weightUnit: 'lbs' | 'kg';
  loggedSets: WorkoutSet[];
  onLog: (set: WorkoutSet) => void;
}

function SetLogger({ setNumber, targetSets, targetReps, recommendation, weightUnit, loggedSets, onLog }: SetLoggerProps) {
  // Use recommendation weight if available, otherwise use last logged set weight, otherwise empty
  const getPlaceholderWeight = () => {
    if (recommendation?.recommendedWeight != null) {
      return recommendation.recommendedWeight;
    }
    if (loggedSets.length > 0) {
      const lastSet = loggedSets[loggedSets.length - 1];
      // loggedSets store weight in kg, convert to display unit
      return weightUnit === 'lbs' ? kgToLbs(lastSet.weight) : lastSet.weight;
    }
    return 0;
  };
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRpe] = useState<number>(7);
  const [isWarmup, setIsWarmup] = useState(false);
  const increment = weightUnit === 'lbs' ? 2.5 : 1.25;
  const placeholderWeight = getPlaceholderWeight();
  const placeholderReps = loggedSets.length > 0 ? loggedSets[loggedSets.length - 1].completedReps : targetReps;

  useEffect(() => {
    // Reset inputs when moving to next set
    setWeight('');
    setReps('');
  }, [setNumber]);

  const handleLog = () => {
    const finalWeight = weight === '' ? placeholderWeight : Number(weight);
    const finalReps = reps === '' ? placeholderReps : Number(reps);
    onLog({ setNumber, weight: finalWeight, targetReps, completedReps: finalReps, rpe, isWarmup });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-text">Set {setNumber} of {targetSets} {isWarmup ? '(Warmup)' : ''}</span>
        <button
          onClick={() => setIsWarmup(!isWarmup)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            isWarmup
              ? 'border-yellow-accent text-yellow-accent bg-yellow-accent/10'
              : 'border-dark-500 text-gray-text'
          }`}
        >Warmup</button>
      </div>
      {recommendation && (
        <div className="bg-blue-primary/10 border border-blue-primary/30 rounded-xl p-3">
          <p className="text-xs text-blue-light">{recommendation.message}</p>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-text mb-2">Weight ({weightUnit})</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeight((w) => {
            const current = w === '' ? placeholderWeight : Number(w);
            return String(Math.max(0, current - increment));
          })} className="w-12 h-12 rounded-xl bg-dark-700 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform">-</button>
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={String(placeholderWeight)} className="flex-1 text-center text-2xl font-bold bg-dark-700 rounded-xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-primary placeholder:text-gray-500" />
          <button onClick={() => setWeight((w) => {
            const current = w === '' ? placeholderWeight : Number(w);
            return String(current + increment);
          })} className="w-12 h-12 rounded-xl bg-dark-700 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform">+</button>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-text mb-2">Reps</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setReps((r) => {
            const current = r === '' ? placeholderReps : Number(r);
            return String(Math.max(0, current - 1));
          })} className="w-12 h-12 rounded-xl bg-dark-700 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform">-</button>
          <input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder={String(placeholderReps)} className="flex-1 text-center text-2xl font-bold bg-dark-700 rounded-xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-primary placeholder:text-gray-500" />
          <button onClick={() => setReps((r) => {
            const current = r === '' ? placeholderReps : Number(r);
            return String(current + 1);
          })} className="w-12 h-12 rounded-xl bg-dark-700 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform">+</button>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-text">RPE (how hard)</p>
          <span className="text-sm font-bold text-blue-primary">{rpe}/10</span>
        </div>
        <input type="range" min={1} max={10} value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-dark-600 accent-blue-primary" />
        <div className="flex justify-between text-xs text-gray-text mt-1">
          <span>Easy</span>
          <span>Max effort</span>
        </div>
      </div>
      <Button fullWidth size="lg" onClick={handleLog}>Log Set</Button>
    </div>
  );
}

export function ActiveWorkout() {
  const navigate = useNavigate();
  const {
    activeSession,
    currentExerciseIndex,
    isResting,
    restTimeRemaining,
    logSet,
    startRest,
    tickRest,
    skipRest,
    setCurrentExerciseIndex,
    endSession,
    cancelSession,
  } = useWorkoutStore();

  const { weightUnit, defaultRestSeconds } = useUserStore();
  const [recommendations, setRecommendations] = useState<Record<string, WeightRecommendation>>({});
  const [latestPRExerciseName, setLatestPRExerciseName] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!activeSession) navigate('/workout');
  }, [activeSession, navigate]);

  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(tickRest, 1000);
    return () => clearInterval(interval);
  }, [isResting, tickRest]);

  useEffect(() => {
    if (!activeSession) return;
    activeSession.exercises.forEach(async (ex) => {
      const rec = await getWeightRecommendation(ex.exerciseId, weightUnit);
      setRecommendations((prev) => ({ ...prev, [ex.exerciseId]: rec }));
    });
  }, [activeSession, weightUnit]);

  if (!activeSession) return null;

  const currentExercise = activeSession.exercises[currentExerciseIndex];
  const totalExercises = activeSession.exercises.length;
  const progress = (currentExerciseIndex / totalExercises) * 100;
  const loggedSets = currentExercise?.sets ?? [];

  const handleLogSet = async (set: WorkoutSet) => {
    // Don't save sets with 0 reps
    if (set.completedReps <= 0) {
      return;
    }

    // Convert weight to kg before storing
    const weightInKg = weightUnit === 'lbs' ? lbsToKg(set.weight) : set.weight;
    const normalizedSet = { ...set, weight: weightInKg };
    logSet(currentExerciseIndex, normalizedSet);
    if (!set.isWarmup && set.weight > 0 && set.completedReps > 0) {
      const exerciseId = currentExercise.exerciseId;
      const checks: Array<{ type: 'weight' | 'reps' | 'volume' | 'estimated_1rm'; value: number }> = [
        { type: 'weight', value: weightInKg },
        { type: 'reps', value: set.completedReps },
        { type: 'volume', value: calculateSetVolume(weightInKg, set.completedReps) },
        { type: 'estimated_1rm', value: estimatedMax(weightInKg, set.completedReps) },
      ];
      for (const check of checks) {
        const existing = await personalRecordRepo.getBestForExercise(exerciseId, check.type);
        if (!existing || check.value > existing.value) {
          const pr: PersonalRecord = {
            id: generateId(),
            exerciseId,
            type: check.type,
            value: check.value,
            date: new Date(),
            previousValue: existing?.value,
            improvement: existing ? check.value - existing.value : undefined,
          };
          await personalRecordRepo.save(pr);
          setLatestPRExerciseName(exerciseId.replace(/_/g, ' '));
          setTimeout(() => setLatestPRExerciseName(null), 3000);
        }
      }
    }
    startRest(defaultRestSeconds);
  };

  const handleFinish = async () => {
    const session = await endSession();
    if (session) navigate('/workout/complete', { state: { session } });
  };

  const handleCancel = () => {
    cancelSession();
    navigate('/workout');
  };

  return (
    <div className="min-h-screen pb-24 bg-dark-900">
      {isResting && <RestTimer seconds={restTimeRemaining} onSkip={skipRest} />}
      {latestPRExerciseName && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-accent text-dark-900 px-4 py-2 rounded-xl font-bold text-sm shadow-lg">
          New PR Achieved: {latestPRExerciseName}
        </div>
      )}
      <div className="sticky top-0 z-30 bg-dark-900/90 backdrop-blur-lg border-b border-dark-700 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-text">{activeSession.dayName}</p>
              <p className="text-sm font-semibold text-white">Exercise {currentExerciseIndex + 1} of {totalExercises}</p>
            </div>
            <button onClick={() => setShowCancelModal(true)} className="text-xs text-gray-text hover:text-red-accent transition-colors">Cancel</button>
          </div>
          <div className="w-full h-1.5 bg-dark-700 rounded-full">
            <div className="h-1.5 bg-blue-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{currentExercise?.exerciseId.replace(/_/g, ' ')}</h2>
          <div className="flex items-center gap-2 mt-1">
            {recommendations[currentExercise?.exerciseId] && (
              <Badge variant="green">{recommendations[currentExercise.exerciseId].reasoning.replace('_', ' ')}</Badge>
            )}
          </div>
        </div>
        {loggedSets.length > 0 && (
          <Card variant="outlined" padding="sm">
            <p className="text-xs text-gray-text mb-2">Logged Sets</p>
            <div className="space-y-1">
              {loggedSets.map((set, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-text">Set {set.setNumber} {set.isWarmup ? '(W)' : ''}</span>
                  <span className="text-white font-medium">{formatWeight(set.weight, weightUnit)} x {set.completedReps} reps</span>
                  <span className="text-gray-text">RPE {set.rpe}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card>
          <SetLogger
            setNumber={loggedSets.length + 1}
            targetSets={currentExercise?.targetSets ?? 0}
            targetReps={8}
            recommendation={recommendations[currentExercise?.exerciseId] ?? null}
            weightUnit={weightUnit}
            loggedSets={loggedSets}
            onLog={handleLogSet}
          />
        </Card>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth disabled={currentExerciseIndex === 0} onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}>Previous</Button>
          {currentExerciseIndex < totalExercises - 1 ? (
            <Button fullWidth onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}>Next Exercise</Button>
          ) : (
            <Button fullWidth onClick={handleFinish}>Finish Workout</Button>
          )}
        </div>
      </div>
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Workout?">
        <p className="text-gray-text text-sm mb-4">Your progress will be lost. Are you sure?</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowCancelModal(false)}>Keep Going</Button>
          <Button variant="danger" fullWidth onClick={handleCancel}>Cancel Workout</Button>
        </div>
      </Modal>
    </div>
  );
}