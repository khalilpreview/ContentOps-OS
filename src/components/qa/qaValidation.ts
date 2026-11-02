import { ContentAsset, User } from '../../types';

export interface QaSignOffCheckResult {
  canSignOff: boolean;
  isContentManager: boolean;
  missingChecks: string[];
  reason?: string;
}

/**
 * Validates whether an asset can receive final gatekeeper sign-off and
 * advance from Stage 4 (QA_GATE) to Stage 5 (READY_TO_PUBLISH).
 *
 * Rules:
 * 1. User must have role 'CONTENT_MANAGER'.
 * 2. All 4 binary QA checks must be true:
 *    - Tone of Voice & Brand Identity (qaToneApproved)
 *    - Format Specs & Safe Zones (qaSpecsValidated)
 *    - Commercial Music & Rights Cleared (qaRightsCleared)
 *    - Gatekeeper Final Sign-off (qaGatekeeperSigned)
 */
export function canSignOffQa(
  asset: Pick<ContentAsset, 'qaToneApproved' | 'qaSpecsValidated' | 'qaRightsCleared' | 'qaGatekeeperSigned'>,
  currentUser: Pick<User, 'id' | 'name' | 'role'>
): QaSignOffCheckResult {
  const isContentManager = currentUser.role === 'CONTENT_MANAGER';
  const missingChecks: string[] = [];

  if (!asset.qaToneApproved) missingChecks.push('Tone of Voice & Brand Identity');
  if (!asset.qaSpecsValidated) missingChecks.push('Hook Strength & Platform Safe Zones');
  if (!asset.qaRightsCleared) missingChecks.push('Commercial Music & IP Rights');
  if (!asset.qaGatekeeperSigned) missingChecks.push('Gatekeeper Final Sign-off');

  if (!isContentManager) {
    return {
      canSignOff: false,
      isContentManager: false,
      missingChecks,
      reason: `Only a CONTENT_MANAGER can sign off on Stage 4 QA (Active role: ${currentUser.role})`
    };
  }

  if (missingChecks.length > 0) {
    return {
      canSignOff: false,
      isContentManager: true,
      missingChecks,
      reason: `Cannot advance: ${missingChecks.length} checklist item(s) pending: ${missingChecks.join(', ')}`
    };
  }

  return {
    canSignOff: true,
    isContentManager: true,
    missingChecks: []
  };
}

/**
 * Formats playback seconds into mm:ss format (e.g. 4 -> "00:04", 75 -> "01:15").
 */
export function formatPlaybackTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0 || !isFinite(totalSeconds)) {
    return '00:00';
  }
  const floorSeconds = Math.floor(totalSeconds);
  const minutes = Math.floor(floorSeconds / 60);
  const seconds = floorSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Detects if a deliverable URL points to a playable video file or stream.
 */
export function isVideoDeliverable(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('data:video/')) return true;
  if (clean.includes('.mp4') || clean.includes('.webm') || clean.includes('.mov') || clean.includes('.m4v')) {
    return true;
  }
  if (clean.includes('/video/') || clean.includes('/videos/') || clean.includes('mixkit.co/videos')) {
    return true;
  }
  return false;
}

/**
 * Detects if a deliverable URL points to an image file or graphic proof.
 */
export function isImageDeliverable(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('data:image/')) return true;
  if (
    clean.includes('.jpg') ||
    clean.includes('.jpeg') ||
    clean.includes('.png') ||
    clean.includes('.webp') ||
    clean.includes('.gif') ||
    clean.includes('.svg')
  ) {
    return true;
  }
  if (clean.includes('images.unsplash.com') || clean.includes('unsplash.com/photo-')) {
    return true;
  }
  return false;
}

/**
 * Constructs the asset update payload when a revision is requested in Stage 4,
 * moving the card back to Stage 3 (IN_PRODUCTION) and registering the audit history.
 */
export function createRevisionPayload(
  asset: ContentAsset,
  currentUser: User,
  feedbackNote: string,
  timestampSeconds?: number
): Partial<ContentAsset> {
  const nowIso = new Date().toISOString();
  const timePrefix =
    typeof timestampSeconds === 'number' && timestampSeconds >= 0
      ? `[At ${formatPlaybackTime(timestampSeconds)}] `
      : '';
  const fullNote = `${timePrefix}${feedbackNote.trim()}`;

  const revisionHistoryItem = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: 'REVISION_REQUESTED',
    fromStatus: asset.status,
    toStatus: 'IN_PRODUCTION' as const,
    userId: currentUser.id,
    userName: currentUser.name,
    timestamp: nowIso,
    note: fullNote
  };

  return {
    status: 'IN_PRODUCTION',
    qaGatekeeperSigned: false, // Reset final signoff so it must be re-cleared after rework
    updatedAt: nowIso,
    history: [...(asset.history || []), revisionHistoryItem]
  };
}
