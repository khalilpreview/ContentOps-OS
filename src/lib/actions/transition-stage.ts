import type { Request } from 'express';
import { getCurrentUser } from '../auth/get-current-user';
import { BadRequestError, ForbiddenError, NotFoundError } from '../auth/types';
import { getServerSupabaseClient, getServerSupabaseConfig } from '../serverSupabase';
import { logAssetActivity } from '../audit/logger';
import { computeSLADeadline } from '../sla/calculator';
import type { ContentAsset, AssetStatus, UserRole } from '../../types';
import { SEED_ASSETS } from '../seedData';

export interface TransitionPayload {
  assetId: string;
  targetStage: AssetStatus;
  reason?: string;
  metadata?: {
    revisionNotes?: string;
    deliverableUrl?: string;
    qaChecklist?: {
      copyApproved?: boolean;
      visualStandards?: boolean;
      complianceChecked?: boolean;
      linkValidation?: boolean;
    };
    [key: string]: any;
  };
}

// In-memory fallback assets store for offline/local testing
const inMemoryAssets: Map<string, ContentAsset> = new Map();
SEED_ASSETS.forEach((a) => inMemoryAssets.set(a.id, { ...a }));

/**
 * Fetch asset from Supabase or memory store
 */
export async function getAsset(assetId: string): Promise<ContentAsset> {
  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      const { data, error } = await supabase.from('content_assets').select('*').eq('id', assetId).single();
      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          pillar: data.pillar,
          formatTier: data.format_tier,
          status: data.status,
          priority: data.priority,
          parentId: data.parent_id,
          parentTitle: data.parent_title,
          hookStrategy: data.hook_strategy,
          targetAudience: data.target_audience,
          platformSpecs: data.platform_specs,
          safeZoneRequirements: data.safe_zone_requirements,
          targetKpi: data.target_kpi,
          rawIntakeNotes: data.raw_intake_notes,
          slaHours: data.sla_hours,
          slaStartedAt: data.sla_started_at,
          slaExpiresAt: data.sla_expires_at,
          isSlaBreached: data.is_sla_breached,
          qaToneApproved: data.qa_tone_approved,
          qaSpecsValidated: data.qa_specs_validated,
          qaRightsCleared: data.qa_rights_cleared,
          qaGatekeeperSigned: data.qa_gatekeeper_signed,
          qaSignedById: data.qa_signed_by_id,
          qaSignedByName: data.qa_signed_by_name,
          qaSignedAt: data.qa_signed_at,
          deliverableUrl: data.deliverable_url,
          attachmentCount: data.attachment_count,
          thumbnailUrl: data.thumbnail_url,
          retentionRate3s: data.retention_rate_3s,
          reachImpressions: data.reach_impressions,
          isWinningFormat: data.is_winning_format,
          paidEligible: data.paid_eligible,
          sentToPaidAds: data.sent_to_paid_ads,
          createdById: data.created_by_id,
          assignedToId: data.assigned_to_id,
          targetPublishAt: data.target_publish_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Fallback to in-memory
    }
  }

  const asset = inMemoryAssets.get(assetId);
  if (!asset) {
    throw new NotFoundError(`Asset with id '${assetId}' not found`);
  }
  return asset;
}

/**
 * Save updated asset to Supabase and memory store
 */
export async function saveAsset(asset: ContentAsset): Promise<ContentAsset> {
  inMemoryAssets.set(asset.id, asset);

  const config = getServerSupabaseConfig();
  if (config.isConfigured) {
    try {
      const supabase = getServerSupabaseClient();
      await supabase.from('content_assets').upsert({
        id: asset.id,
        title: asset.title,
        description: asset.description,
        pillar: asset.pillar,
        format_tier: asset.formatTier,
        status: asset.status,
        priority: asset.priority,
        parent_id: asset.parentId,
        parent_title: asset.parentTitle,
        hook_strategy: asset.hookStrategy,
        target_audience: asset.targetAudience,
        platform_specs: asset.platformSpecs,
        safe_zone_requirements: asset.safeZoneRequirements,
        target_kpi: asset.targetKpi,
        raw_intake_notes: asset.rawIntakeNotes,
        sla_hours: asset.slaHours,
        sla_started_at: asset.slaStartedAt,
        sla_expires_at: asset.slaExpiresAt,
        is_sla_breached: asset.isSlaBreached,
        qa_tone_approved: asset.qaToneApproved,
        qa_specs_validated: asset.qaSpecsValidated,
        qa_rights_cleared: asset.qaRightsCleared,
        qa_gatekeeper_signed: asset.qaGatekeeperSigned,
        qa_signed_by_id: asset.qaSignedById,
        qa_signed_by_name: asset.qaSignedByName,
        qa_signed_at: asset.qaSignedAt,
        deliverable_url: asset.deliverableUrl,
        attachment_count: asset.attachmentCount,
        thumbnail_url: asset.thumbnailUrl,
        retention_rate_3s: asset.retentionRate3s,
        reach_impressions: asset.reachImpressions,
        is_winning_format: asset.isWinningFormat,
        paid_eligible: asset.paidEligible,
        sent_to_paid_ads: asset.sentToPaidAds,
        assigned_to_id: asset.assignedToId,
        target_publish_at: asset.targetPublishAt,
        updated_at: asset.updatedAt,
      });
    } catch (err: any) {
      console.warn('[TransitionStage] Supabase upsert error:', err.message);
    }
  }

  return asset;
}

/**
 * Centralized, Deterministic Server-Side State Transition Engine
 */
export async function transitionAssetStage(
  req: Request,
  payload: TransitionPayload
): Promise<{ success: boolean; asset: ContentAsset }> {
  const { assetId, targetStage, reason, metadata = {} } = payload;

  if (!assetId || !targetStage) {
    throw new BadRequestError('assetId and targetStage are required fields');
  }

  const currentUser = await getCurrentUser(req);
  const asset = await getAsset(assetId);
  const currentStage = asset.status;

  // No-op if stage is unchanged
  if (currentStage === targetStage) {
    return { success: true, asset };
  }

  const updatedAsset: ContentAsset = {
    ...asset,
    updatedAt: new Date().toISOString(),
  };

  // 1. Guard: DRAFT_BRIEF -> SLA_REVIEW
  if (targetStage === 'SLA_REVIEW') {
    // Check required intake fields
    const hasNotes = Boolean(asset.rawIntakeNotes?.trim() || asset.description?.trim());
    const hasStrategy = Boolean(asset.hookStrategy?.trim());
    if (!hasNotes && !hasStrategy) {
      throw new BadRequestError(
        'Cannot transition to SLA_REVIEW: Brief is incomplete. Campaign notes or hook strategy are required.'
      );
    }

    // Initialize SLA clock (48h default)
    const now = new Date();
    updatedAsset.slaStartedAt = now.toISOString();
    updatedAsset.slaExpiresAt = computeSLADeadline(asset.slaHours || 48, now);
    updatedAsset.isSlaBreached = false;
  }

  // 2. Guard: SLA_REVIEW -> IN_PRODUCTION
  if (currentStage === 'SLA_REVIEW' && targetStage === 'IN_PRODUCTION') {
    // Only Stakeholders (or Content Managers acting on their behalf) can approve briefs
    if (!['STAKEHOLDER', 'CONTENT_MANAGER'].includes(currentUser.role)) {
      throw new ForbiddenError(
        `Cannot approve brief: Requires STAKEHOLDER or CONTENT_MANAGER role. (User has ${currentUser.role})`
      );
    }
  }

  // 3. Guard: IN_PRODUCTION -> QA_GATE
  if (targetStage === 'QA_GATE') {
    const deliverableUrl = metadata.deliverableUrl || asset.deliverableUrl;
    if (!deliverableUrl || !deliverableUrl.trim()) {
      throw new BadRequestError('Cannot submit to QA_GATE: A valid deliverable URL or link is required.');
    }
    updatedAsset.deliverableUrl = deliverableUrl.trim();

    // Reset checklist items to false upon newly entering QA_GATE (or re-submission)
    updatedAsset.qaToneApproved = false;
    updatedAsset.qaSpecsValidated = false;
    updatedAsset.qaRightsCleared = false;
    updatedAsset.qaGatekeeperSigned = false;
  }

  // 4. Guard: QA_GATE -> READY_TO_PUBLISH
  if (targetStage === 'READY_TO_PUBLISH') {
    // Only Content Managers can approve final publication
    if (currentUser.role !== 'CONTENT_MANAGER') {
      throw new ForbiddenError(
        `Final sign-off denied: Only CONTENT_MANAGER can promote to READY_TO_PUBLISH. (User is ${currentUser.role})`
      );
    }

    const isFullyApproved =
      updatedAsset.qaToneApproved &&
      updatedAsset.qaSpecsValidated &&
      updatedAsset.qaRightsCleared &&
      updatedAsset.qaGatekeeperSigned;

    if (!isFullyApproved && !metadata.forceApproved) {
      throw new BadRequestError(
        'QA Gate incomplete: All 4 checks (Tone of voice, Specs & safe zones, Rights, and Gatekeeper sign-off) must be TRUE.'
      );
    }
  }

  // 5. Guard: Revision Loop (Any stage -> IN_PRODUCTION or QA_GATE with revisions)
  const isRevisionRejection =
    (currentStage === 'QA_GATE' && targetStage === 'IN_PRODUCTION') ||
    (currentStage === 'SLA_REVIEW' && targetStage === 'DRAFT_BRIEF');

  if (isRevisionRejection) {
    const notes = metadata.revisionNotes || reason;
    if (!notes || !notes.trim()) {
      throw new BadRequestError(
        'Revision rejected without explanation: revisionNotes or reason is strictly required when sending asset back.'
      );
    }
  }

  // Apply new stage
  updatedAsset.status = targetStage;
  const saved = await saveAsset(updatedAsset);

  // Concurrently append to immutable audit log
  await logAssetActivity({
    assetId: saved.id,
    performedBy: currentUser.id,
    performerName: currentUser.name,
    performerRole: currentUser.role,
    action: isRevisionRejection ? 'REVISION_REQUESTED' : 'STAGE_TRANSITION',
    previousStage: currentStage,
    newStage: targetStage,
    reason: metadata.revisionNotes || reason || undefined,
    metadata: {
      ...metadata,
      deliverableUrl: saved.deliverableUrl,
      slaExpiresAt: saved.slaExpiresAt,
    },
  });

  return { success: true, asset: saved };
}
