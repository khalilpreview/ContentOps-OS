import { AssetStatus, ContentAsset, TransitionResult, User, UserRole } from '../types';

/**
 * Checks whether the active user has permission to toggle the 4th QA checkbox
 * ("Gatekeeper Final Sign-off") in Stage 4.
 */
export function canToggleGatekeeperSignOff(currentUser: User): boolean {
  return currentUser.role === 'CONTENT_MANAGER' || currentUser.role === 'SUPER_ADMIN';
}

/**
 * Returns true if the user's role has permission to move a card between the two stages.
 */
export function isTransitionPermittedForRole(
  fromStatus: AssetStatus,
  toStatus: AssetStatus,
  role: UserRole
): boolean {
  if (role === 'SUPER_ADMIN') return true;

  // Stage 1 -> Stage 2: Drafting -> SLA Review
  if (fromStatus === 'DRAFT_BRIEF' && toStatus === 'SLA_REVIEW') {
    return true; // Any specialist or manager can submit draft to review
  }

  // Revert Stage 2 -> Stage 1
  if (fromStatus === 'SLA_REVIEW' && toStatus === 'DRAFT_BRIEF') {
    return role === 'STAKEHOLDER' || role === 'CONTENT_MANAGER';
  }

  // Stage 2 -> Stage 3: SLA Review -> Production
  if (fromStatus === 'SLA_REVIEW' && toStatus === 'IN_PRODUCTION') {
    return role === 'STAKEHOLDER' || role === 'CONTENT_MANAGER';
  }

  // Stage 3 -> Stage 4: Production -> QA Gate
  if (fromStatus === 'IN_PRODUCTION' && toStatus === 'QA_GATE') {
    return role === 'CREATIVE_SPECIALIST' || role === 'CONTENT_MANAGER';
  }

  // Revert Stage 4 -> Stage 3
  if (fromStatus === 'QA_GATE' && toStatus === 'IN_PRODUCTION') {
    return role === 'CONTENT_MANAGER' || role === 'CREATIVE_SPECIALIST';
  }

  // Stage 4 -> Stage 5: QA Gate -> Ready to Publish
  if (fromStatus === 'QA_GATE' && toStatus === 'READY_TO_PUBLISH') {
    return role === 'CONTENT_MANAGER';
  }

  // Stage 5 -> Archive: Ready to Publish -> Published
  if (fromStatus === 'READY_TO_PUBLISH' && toStatus === 'PUBLISHED') {
    return role === 'DISTRIBUTION_LEAD' || role === 'CONTENT_MANAGER';
  }

  return false;
}

/**
 * Validates if an asset can transition from its current status to targetStatus
 * according to the deterministic state machine rules and RACI gating.
 */
export function validateStatusTransition(
  asset: ContentAsset,
  targetStatus: AssetStatus,
  currentUser: User,
  now: Date = new Date()
): TransitionResult {
  const currentStatus = asset.status;

  // No-op if same status
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // 1. Transition: DRAFT_BRIEF -> SLA_REVIEW
  if (currentStatus === 'DRAFT_BRIEF' && targetStatus === 'SLA_REVIEW') {
    const missingFields: string[] = [];
    if (!asset.title || asset.title.trim() === '') missingFields.push('Title');
    if (!asset.hookStrategy || asset.hookStrategy.trim() === '') missingFields.push('Hook Strategy');
    if (!asset.platformSpecs || asset.platformSpecs.trim() === '') missingFields.push('Platform Technical Specifications');
    if (!asset.assignedToId || asset.assignedToId.trim() === '') missingFields.push('Assignee');

    if (missingFields.length > 0) {
      return {
        allowed: false,
        reason: `Required brief fields missing: ${missingFields.join(', ')}. Complete the brief before submitting to SLA Review.`
      };
    }

    const slaHours = asset.slaHours > 0 ? asset.slaHours : 48;
    const slaStartedAt = now.toISOString();
    const slaExpiresAt = new Date(now.getTime() + slaHours * 3600000).toISOString();

    return {
      allowed: true,
      updatedAsset: {
        status: 'SLA_REVIEW',
        slaStartedAt,
        slaExpiresAt,
        isSlaBreached: false,
        updatedAt: now.toISOString()
      }
    };
  }

  // Revert SLA_REVIEW -> DRAFT_BRIEF (Request Edits)
  if (currentStatus === 'SLA_REVIEW' && targetStatus === 'DRAFT_BRIEF') {
    return {
      allowed: true,
      updatedAsset: {
        status: 'DRAFT_BRIEF',
        slaStartedAt: null,
        slaExpiresAt: null,
        isSlaBreached: false,
        updatedAt: now.toISOString()
      }
    };
  }

  // 2. Transition: SLA_REVIEW -> IN_PRODUCTION
  if (currentStatus === 'SLA_REVIEW' && targetStatus === 'IN_PRODUCTION') {
    const isAuthorized = currentUser.role === 'STAKEHOLDER' || currentUser.role === 'CONTENT_MANAGER' || currentUser.role === 'SUPER_ADMIN';
    if (!isAuthorized) {
      return {
        allowed: false,
        reason: `RACI Gate Block: Only Stakeholder, Content Manager, or Super Admin can sign off on SLA Review. (Active Role: ${currentUser.role})`
      };
    }

    return {
      allowed: true,
      updatedAsset: {
        status: 'IN_PRODUCTION',
        updatedAt: now.toISOString()
      }
    };
  }

  // 3. Transition: IN_PRODUCTION -> QA_GATE
  if (currentStatus === 'IN_PRODUCTION' && targetStatus === 'QA_GATE') {
    if (!asset.deliverableUrl || asset.deliverableUrl.trim() === '') {
      return {
        allowed: false,
        reason: `Deliverable link missing. A valid Deliverable URL (Figma, S3, Drive, or Frame.io) is required before advancing to QA Gate.`
      };
    }

    return {
      allowed: true,
      updatedAsset: {
        status: 'QA_GATE',
        updatedAt: now.toISOString()
      }
    };
  }

  // Revert QA_GATE -> IN_PRODUCTION (Request Changes / Rework)
  if (currentStatus === 'QA_GATE' && targetStatus === 'IN_PRODUCTION') {
    return {
      allowed: true,
      updatedAsset: {
        status: 'IN_PRODUCTION',
        updatedAt: now.toISOString()
      }
    };
  }

  // 4. Transition: QA_GATE -> READY_TO_PUBLISH (STRICT 4-POINT VETO BLOCK)
  if (currentStatus === 'QA_GATE' && targetStatus === 'READY_TO_PUBLISH') {
    const missingChecks: string[] = [];
    if (!asset.qaToneApproved) missingChecks.push('Tone of Voice & Brand Identity cleared');
    if (!asset.qaSpecsValidated) missingChecks.push('Hook strength & Platform Safe Zones verified');
    if (!asset.qaRightsCleared) missingChecks.push('Commercial music & IP Rights licensed');
    if (!asset.qaGatekeeperSigned) missingChecks.push('Gatekeeper Final Sign-off');

    if (missingChecks.length > 0) {
      return {
        allowed: false,
        reason: `VETO BLOCK: Mandatory 4-point QA Gatekeeper checklist not satisfied:\n• ${missingChecks.join('\n• ')}`
      };
    }

    if (!canToggleGatekeeperSignOff(currentUser)) {
      return {
        allowed: false,
        reason: `VETO BLOCK: Only a CONTENT_MANAGER can advance an asset past the QA Gatekeeper to Ready for Distribution. (Current user role: ${currentUser.role})`
      };
    }

    return {
      allowed: true,
      updatedAsset: {
        status: 'READY_TO_PUBLISH',
        qaSignedById: currentUser.id,
        qaSignedByName: currentUser.name,
        qaSignedAt: asset.qaSignedAt || now.toISOString(),
        updatedAt: now.toISOString()
      }
    };
  }

  // 5. Transition: READY_TO_PUBLISH -> PUBLISHED
  if (currentStatus === 'READY_TO_PUBLISH' && targetStatus === 'PUBLISHED') {
    const isAuthorized = currentUser.role === 'DISTRIBUTION_LEAD' || currentUser.role === 'CONTENT_MANAGER' || currentUser.role === 'SUPER_ADMIN';
    if (!isAuthorized) {
      return {
        allowed: false,
        reason: `Only Distribution Lead, Content Manager, or Super Admin can mark an asset as Published. (Active Role: ${currentUser.role})`
      };
    }

    return {
      allowed: true,
      updatedAsset: {
        status: 'PUBLISHED',
        updatedAt: now.toISOString()
      }
    };
  }

  // Fallback for illegal non-sequential jumps
  return {
    allowed: false,
    reason: `Invalid state transition from ${currentStatus} directly to ${targetStatus}. Follow the deterministic pipeline order.`
  };
}

export const PIPELINE_COLUMNS: Array<{
  id: AssetStatus;
  title: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'DRAFT_BRIEF',
    title: 'Drafting & Briefs',
    badge: 'Stage 1',
    description: 'Hook strategy, technical platform specs, and intake notes'
  },
  {
    id: 'SLA_REVIEW',
    title: 'Stakeholder Review (SLA)',
    badge: 'Stage 2',
    description: 'Active 24-48h SLA turnaround review window'
  },
  {
    id: 'IN_PRODUCTION',
    title: 'Production Pod',
    badge: 'Stage 3',
    description: 'Creative execution, editing, and deliverable attachment'
  },
  {
    id: 'QA_GATE',
    title: 'QA Gatekeeper',
    badge: 'Stage 4',
    description: 'Strict 4-point binary checklist & Content Manager sign-off veto'
  },
  {
    id: 'READY_TO_PUBLISH',
    title: 'Ready for Distribution',
    badge: 'Stage 5',
    description: 'Cleared for multi-channel syndication & publishing'
  }
];
