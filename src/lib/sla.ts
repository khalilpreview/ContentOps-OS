import { ContentAsset, User } from '../types';

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

/**
 * Dynamic SLA tickdown helper:
 * Hours Remaining = (slaExpiresAt - now()) / (1000 * 60 * 60)
 *
 * Color states (Thrill.com design system):
 * - > 24h: Green badge (#00E599) ("24h remaining")
 * - 1h - 24h: Metallic Gold / Amber badge (#F5A524) ("12h remaining")
 * - < 0h (Breached): Danger Coral flashing badge (#FF4B55) ("SLA BREACHED: -3h")
 */
export function calculateSla(asset: ContentAsset, now: Date = new Date()): SlaCalculation {
  if (asset.status !== 'SLA_REVIEW' || !asset.slaExpiresAt) {
    return {
      status: 'INACTIVE',
      hoursRemaining: 0,
      minutesRemaining: 0,
      label: 'No Active SLA',
      badgeClass: 'bg-[#181E2C] text-[#8F9CAE] border-white/10',
      textClass: 'text-[#8F9CAE]',
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
  const exactHours = diffMs / (1000 * 60 * 60);
  const remainingHours = Math.floor(exactHours);
  const remainingMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

  const pct = Math.max(0, Math.min(100, Math.round((diffMs / totalMs) * 100)));

  // < 0h (Breached): Red flashing badge (SLA BREACHED: -3h)
  if (diffMs <= 0) {
    const breachedHours = Math.min(-1, Math.floor(exactHours));
    return {
      status: 'BREACHED',
      hoursRemaining: remainingHours,
      minutesRemaining: remainingMinutes,
      label: `SLA BREACHED: ${breachedHours}h`,
      badgeClass: 'bg-[#FF4B55]/15 text-[#FF4B55] border-[#FF4B55]/50',
      textClass: 'text-[#FF4B55] font-semibold',
      isBreached: true,
      percentageRemaining: 0
    };
  }

  // > 24h: Green badge (#00E599)
  if (exactHours > 24) {
    return {
      status: 'ON_TRACK',
      hoursRemaining: remainingHours,
      minutesRemaining: remainingMinutes,
      label: `${remainingHours}h remaining`,
      badgeClass: 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40',
      textClass: 'text-[#00E599] font-medium',
      isBreached: false,
      percentageRemaining: pct
    };
  }

  // 1h - 24h (or 0h - 24h): Amber / Metallic Gold badge (#F5A524)
  const displayHours = Math.max(1, remainingHours);
  return {
    status: 'WARNING',
    hoursRemaining: remainingHours,
    minutesRemaining: remainingMinutes,
    label: `${displayHours}h remaining`,
    badgeClass: 'bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/40 ring-1 ring-[#F5A524]/20',
    textClass: 'text-[#F5A524] font-medium',
    isBreached: false,
    percentageRemaining: pct
  };
}

/**
 * Pure helper for Sidebar Quick Filter: "⚠️ SLA Risk"
 * Filters cards with SLA timer < 12h or breached (< 0h)
 */
export function isSlaRiskAsset(asset: ContentAsset, now: Date = new Date()): boolean {
  if (asset.status !== 'SLA_REVIEW') return false;
  if (asset.isSlaBreached) return true;
  const sla = calculateSla(asset, now);
  return sla.isBreached || sla.hoursRemaining < 12;
}

/**
 * Pure helper for Sidebar Quick Filter: "⚡ Needs My Sign-off"
 * Filters cards in Stage 4 (QA_GATE) awaiting Content Manager sign-off
 */
export function isNeedsMySignOffAsset(asset: ContentAsset, currentUser?: User): boolean {
  if (asset.status !== 'QA_GATE') return false;
  if (currentUser && currentUser.role !== 'CONTENT_MANAGER') {
    return false;
  }
  return !asset.qaGatekeeperSigned;
}

/**
 * Pure helper for Phase 5: Syndication Archive & Feedback Loop
 * Evaluates 3-Second Retention Rate (%) and determines if asset qualifies as a WINNING FORMAT (> 65%)
 */
export function evaluatePostLaunchRetention(retentionRate3s: number): {
  isWinningFormat: boolean;
  paidEligible: boolean;
  badgeLabel: string | null;
} {
  const cleanRate = Number.isFinite(retentionRate3s) ? retentionRate3s : 0;
  const isWinner = cleanRate > 65;
  return {
    isWinningFormat: isWinner,
    paidEligible: isWinner,
    badgeLabel: isWinner ? '🏆 WINNING FORMAT' : null
  };
}
