import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { Modal } from './Modal';
import { Button } from './Button';

export function ActiveWorkoutBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession, currentExerciseIndex, cancelSession } = useWorkoutStore();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Don't show banner on the active workout page or workout complete page
  if (!activeSession || location.pathname === '/workout/active' || location.pathname === '/workout/complete') {
    return null;
  }

  const currentExercise = activeSession.exercises[currentExerciseIndex];
  const currentExerciseName = currentExercise?.exerciseId.replace(/_/g, ' ') || 'Exercise';

  return (
    <>
      <div
        onClick={() => navigate('/workout/active')}
        className="fixed bottom-16 left-0 right-0 z-40 bg-blue-primary hover:bg-blue-600 transition-colors cursor-pointer"
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-white">Workout in Progress</p>
              <p className="text-xs text-blue-100">{activeSession.dayName} • {currentExerciseName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelConfirm(true);
              }}
              className="text-xs font-semibold text-white/90 hover:text-white underline underline-offset-2"
            >
              Cancel
            </button>
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} title="End Current Workout?">
        <p className="text-gray-text text-sm mb-4">
          Ending this workout will discard any unsaved progress.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowCancelConfirm(false)}>
            Keep Workout
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              cancelSession();
              setShowCancelConfirm(false);
            }}
          >
            End Workout
          </Button>
        </div>
      </Modal>
    </>
  );
}
