import { ContentAsset } from '../types';

export interface SlaCalculation {
  status: 'INACTIVE' | 'ON_TRACK' | 'WARNING' | 'BREACHED';
  hoursRemaining: number;
  minutesRemaining: number;
  label: string;
  badgeClass: string;
  textClass: string;
  isBreached: boolean;
  percentageRemaining: number; // 0 to 100
}

export function calculateSla(asset: ContentAsset, now: Date = new Date()): SlaCalculation {
  if (asset.status !== 'SLA_REVIEW' || !asset.slaExpiresAt) {
    return {
      status: 'INACTIVE',
      hoursRemaining: 0,
      minutesRemaining: 0,
      label: 'No Active SLA',
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      textClass: 'text-zinc-400',
      isBreached: false,
      percentageRemaining: 100
    };
  }

  const expiresTime = new Date(asset.slaExpiresAt).getTime();
  const startTime = asset.slaStartedAt
    ? new Date(asset.slaStartedAt).getTime()
    : expiresTime - (asset.slaHours || 48) * 3600000;
  const currentTime = now.getTime();

  const diffMs = expiresTime - currentTime;
  const totalMs = Math.max(expiresTime - startTime, 1000);
  const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const pct = Math.max(0, Math.min(100, Math.round((diffMs / totalMs) * 100)));

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    const overdueMinutes = Math.abs(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
    return {
      status: 'BREACHED',
      hoursRemaining: remainingHours,
      minutesRemaining: remainingMinutes,
      label: `SLA BREACHED (+${overdueHours}h ${overdueMinutes}m)`,
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse ring-1 ring-rose-500/30',
      textClass: 'text-rose-400 font-semibold',
      isBreached: true,
      percentageRemaining: 0
    };
  }

  // < 12h remaining -> Amber
  if (remainingHours < 12) {
    return {
      status: 'WARNING',
      hoursRemaining: remainingHours,
      minutesRemaining: remainingMinutes,
      label: `${remainingHours}h ${remainingMinutes}m remaining`,
      badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/30',
      textClass: 'text-amber-400 font-medium',
      isBreached: false,
      percentageRemaining: pct
    };
  }

  // > 24h remaining -> Green
  if (remainingHours >= 24) {
    return {
      status: 'ON_TRACK',
      hoursRemaining: remainingHours,
      minutesRemaining: remainingMinutes,
      label: `${remainingHours}h remaining`,
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50',
      textClass: 'text-emerald-400 font-medium',
      isBreached: false,
      percentageRemaining: pct
    };
  }

  // Between 12h and 24h
  return {
    status: 'ON_TRACK',
    hoursRemaining: remainingHours,
    minutesRemaining: remainingMinutes,
    label: `${remainingHours}h ${remainingMinutes}m remaining`,
    badgeClass: 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40',
    textClass: 'text-emerald-400',
    isBreached: false,
    percentageRemaining: pct
  };
}
