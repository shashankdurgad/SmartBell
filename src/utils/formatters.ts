import { format, formatDistanceToNow } from 'date-fns';
import type { WeightUnit } from '../types';

const LBS_TO_KG = 2.20462;

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function formatWeight(weight: number, unit: 'lbs' | 'kg'): string {
  return `${weight} ${unit}`;
}

/**
 * Convert volume between weight units
 * Assumes volumes are stored in the unit they were created in
 * Conversion factor: 1kg = 2.20462 lbs
 */
export function convertVolume(volume: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) return volume;
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return volume / LBS_TO_KG;
  }
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return volume * LBS_TO_KG;
  }
  return volume;
}

/**
 * Format volume with optional unit conversion
 * If currentUnit is provided, assumes volumes are stored in that unit and converts to displayUnit
 */
export function formatVolume(volume: number, displayUnit?: WeightUnit, currentUnit?: WeightUnit): string {
  let displayVolume = volume;
  
  // Convert volume if units provided and different
  if (displayUnit && currentUnit && displayUnit !== currentUnit) {
    displayVolume = convertVolume(volume, currentUnit, displayUnit);
  }
  
  if (displayVolume >= 1000) {
    return `${(displayVolume / 1000).toFixed(1)}k`;
  }
  return Math.round(displayVolume).toLocaleString();
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatReps(reps: string): string {
  return reps.includes('-') ? reps : `${reps} reps`;
}
