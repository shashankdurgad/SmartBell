import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWorkoutTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isComplete: boolean;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  formatTime: (seconds: number) => string;
}

export function useWorkoutTimer(onComplete?: () => void): UseWorkoutTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((seconds: number) => {
    clearTimer();
    setTimeRemaining(seconds);
    setIsRunning(true);
    setIsComplete(false);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          setIsComplete(true);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (timeRemaining <= 0 || isRunning) return;

    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          setIsComplete(true);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeRemaining, isRunning, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(0);
    setIsRunning(false);
    setIsComplete(false);
  }, [clearTimer]);

  const skip = useCallback(() => {
    clearTimer();
    setTimeRemaining(0);
    setIsRunning(false);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, [clearTimer]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    timeRemaining,
    isRunning,
    isComplete,
    start,
    pause,
    resume,
    reset,
    skip,
    formatTime,
  };
}
