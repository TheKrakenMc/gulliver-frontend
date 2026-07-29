import type { PlanRecord, TurnoType, TimeSlot, OverlapResult } from '../types';

export const TURNO_CONFIG: Record<TurnoType, { label: string; start: string; end: string; durationHrs: number; color: string }> = {
  'Matutino': { label: 'Matutino', start: '06:00', end: '14:00', durationHrs: 8, color: '#3b82f6' }, // blue
  'Vespertino': { label: 'Vespertino', start: '14:00', end: '22:00', durationHrs: 8, color: '#f97316' }, // orange
  'Nocturno': { label: 'Nocturno', start: '22:00', end: '06:00', durationHrs: 8, color: '#8b5cf6' }, // violet
  '12x12_Dia': { label: '12x12 Día', start: '06:00', end: '18:00', durationHrs: 12, color: '#06b6d4' }, // cyan
  '12x12_Noche': { label: '12x12 Noche', start: '18:00', end: '06:00', durationHrs: 12, color: '#6366f1' }, // indigo
  'Mixto': { label: 'Mixto (Custom)', start: '08:00', end: '16:00', durationHrs: 8, color: '#10b981' }, // green
};

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// Check if two time slots overlap.
// Handles cases where end time is less than start time (overnight shifts).
export const doTimeSlotsOverlap = (a: TimeSlot | undefined, b: TimeSlot | undefined): boolean => {
  if (!a || !a.start || !a.end || !b || !b.start || !b.end) return false;

  const aStart = parseTimeToMinutes(a.start);
  let aEnd = parseTimeToMinutes(a.end);
  const bStart = parseTimeToMinutes(b.start);
  let bEnd = parseTimeToMinutes(b.end);

  if (aEnd <= aStart) aEnd += 24 * 60; // Adds 24h
  if (bEnd <= bStart) bEnd += 24 * 60;

  // Since time can wrap around the day, we need to check both the absolute times and shifted times
  // Simplest way is to normalize relative to the start of the day.
  // Actually, to handle overnight properly if comparing two shifts on the *same day* (e.g. they both start on 'fecha'):
  
  // A simple method for same day overlap:
  const overlaps = (start1: number, end1: number, start2: number, end2: number) => {
    return Math.max(start1, start2) < Math.min(end1, end2);
  };

  // If both are normal
  if (aEnd <= 24*60 && bEnd <= 24*60) {
    return overlaps(aStart, aEnd, bStart, bEnd);
  }

  // If one or both wrap around, split them into two segments
  const getSegments = (start: number, end: number) => {
    if (end > 24 * 60) {
      return [{ start, end: 24 * 60 }, { start: 0, end: end - 24 * 60 }];
    }
    return [{ start, end }];
  };

  const aSegments = getSegments(aStart, aEnd);
  const bSegments = getSegments(bStart, bEnd);

  for (const segA of aSegments) {
    for (const segB of bSegments) {
      if (overlaps(segA.start, segA.end, segB.start, segB.end)) {
        return true;
      }
    }
  }

  return false;
};

export const detectOverlap = (
  newPlan: Pick<PlanRecord, 'fecha' | 'linea' | 'slot' | 'id_plan'>,
  existingPlans: PlanRecord[]
): OverlapResult => {
  const relevantPlans = existingPlans.filter(p => p.fecha === newPlan.fecha && p.linea === newPlan.linea && p.id_plan !== newPlan.id_plan && p.status !== 'cancelled');

  const conflictingPlans = relevantPlans.filter(p => {
    const slotB = p.slot || { 
      start: TURNO_CONFIG[p.turno]?.start || '00:00', 
      end: TURNO_CONFIG[p.turno]?.end || '00:00' 
    };
    return doTimeSlotsOverlap(newPlan.slot, slotB);
  });

  return {
    hasOverlap: conflictingPlans.length > 0,
    conflictingPlans,
    message: conflictingPlans.length > 0 
      ? `Conflicto detectado con turno(s): ${conflictingPlans.map(p => p.turno).join(', ')}`
      : undefined
  };
};

export const getTargetForShift = (turno: TurnoType, target_hr: number, customSlot?: TimeSlot): number => {
  if (turno === 'Mixto' && customSlot) {
    let aStart = parseTimeToMinutes(customSlot.start);
    let aEnd = parseTimeToMinutes(customSlot.end);
    if (aEnd <= aStart) aEnd += 24 * 60;
    const durationHrs = (aEnd - aStart) / 60;
    return Math.round(target_hr * durationHrs);
  }
  return target_hr * TURNO_CONFIG[turno].durationHrs;
};
