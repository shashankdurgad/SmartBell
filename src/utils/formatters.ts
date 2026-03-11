import { format, formatDistanceToNow } from 'date-fns';
import type { WeightUnit } from '../types';
import { kgToLbs } from './calculations';

const LBS_TO_KG = 2.20462;

export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy h:mm a');
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

export function formatWeight(weightKg: number, displayUnit: 'lbs' | 'kg'): string {
  const displayWeight = displayUnit === 'lbs' ? kgToLbs(weightKg) : weightKg;
  return `${displayWeight} ${displayUnit}`;
}

/**
 * Convert volume between weight units
 * Note: Volumes are now always stored in kg (weight in kg × reps)
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
 * Note: Volumes are always stored in kg internally, specify displayUnit to convert for display
 */
export function formatVolume(volume: number, displayUnit?: WeightUnit): string {
  let displayVolume = volume;
  
  // Convert from kg to display unit if needed
  if (displayUnit && displayUnit !== 'kg') {
    displayVolume = convertVolume(volume, 'kg', displayUnit);
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
