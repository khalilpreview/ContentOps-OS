export interface SLACalculationResult {
  isBreached: boolean;
  hoursRemaining: number;
  urgencyLevel: 'NORMAL' | 'WARNING' | 'BREACHED';
  deadlineFormatted: string;
}

/**
 * Calculates SLA metrics given an expiration ISO timestamp.
 * - NORMAL: > 4 hours remaining
 * - WARNING: <= 4 hours and > 0 hours remaining
 * - BREACHED: <= 0 hours remaining
 */
export function calculateSLA(slaExpiresAt: string | null | undefined, referenceTime: Date = new Date()): SLACalculationResult {
  if (!slaExpiresAt) {
    return {
      isBreached: false,
      hoursRemaining: Infinity,
      urgencyLevel: 'NORMAL',
      deadlineFormatted: 'No SLA Set',
    };
  }

  const deadline = new Date(slaExpiresAt);
  const diffMs = deadline.getTime() - referenceTime.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  const isBreached = hoursRemaining <= 0;
  let urgencyLevel: 'NORMAL' | 'WARNING' | 'BREACHED' = 'NORMAL';

  if (isBreached) {
    urgencyLevel = 'BREACHED';
  } else if (hoursRemaining <= 4) {
    urgencyLevel = 'WARNING';
  }

  return {
    isBreached,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    urgencyLevel,
    deadlineFormatted: deadline.toISOString(),
  };
}

/**
 * Compute the default SLA duration in milliseconds based on asset priority or stage.
 * Standard SLA duration is 24 hours. High priority is 12 hours. Urgent is 4 hours.
 */
export function computeSLADeadline(hours: number = 24, from: Date = new Date()): string {
  const deadline = new Date(from.getTime() + hours * 60 * 60 * 1000);
  return deadline.toISOString();
}
