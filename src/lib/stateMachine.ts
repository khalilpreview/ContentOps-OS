import { AssetStatus, ContentAsset, TransitionResult, User } from '../types';

/**
 * Validates if an asset can transition from its current status to targetStatus
 * according to the deterministic state machine rules and RACI gating in SYSTEM_SPEC_MVP.md.
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
    const isAuthorized = currentUser.role === 'STAKEHOLDER' || currentUser.role === 'CONTENT_MANAGER';
    if (!isAuthorized) {
      return {
        allowed: false,
        reason: `RACI Gate Block: Only Stakeholder or Content Manager can sign off on SLA Review. (Active Role: ${currentUser.role})`
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

  // 4. Transition: QA_GATE -> READY_TO_PUBLISH (VETO BLOCK)
  if (currentStatus === 'QA_GATE' && targetStatus === 'READY_TO_PUBLISH') {
    const missingChecks: string[] = [];
    if (!asset.qaToneApproved) missingChecks.push('Brand Tone of Voice verified');
    if (!asset.qaSpecsValidated) missingChecks.push('Platform Specs & Safe Zones checked');
    if (!asset.qaRightsCleared) missingChecks.push('Commercial & IP Rights cleared');
    if (!asset.qaGatekeeperSigned) missingChecks.push('Gatekeeper Sign-off stamp');

    if (missingChecks.length > 0) {
      return {
        allowed: false,
        reason: `VETO BLOCK: Mandatory QA Gatekeeper criteria not satisfied:\n• ${missingChecks.join('\n• ')}`
      };
    }

    if (currentUser.role !== 'CONTENT_MANAGER') {
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
    const isAuthorized = currentUser.role === 'DISTRIBUTION_LEAD' || currentUser.role === 'CONTENT_MANAGER';
    if (!isAuthorized) {
      return {
        allowed: false,
        reason: `Only Distribution Lead or Content Manager can mark an asset as Published. (Active Role: ${currentUser.role})`
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
    description: 'Strict 3-point checklist & Content Manager sign-off veto'
  },
  {
    id: 'READY_TO_PUBLISH',
    title: 'Ready for Distribution',
    badge: 'Stage 5',
    description: 'Cleared for multi-channel syndication & publishing'
  }
];
