import type { AssetStatus, UserRole } from '../../types';

export interface AssetActivity {
  id: string;
  assetId: string;
  performedBy: string; // User ID
  performerName?: string;
  performerRole?: UserRole;
  action: 'STAGE_TRANSITION' | 'QA_CHECK' | 'REVISION_REQUESTED' | 'BRIEF_UPDATED' | 'COMMENT_ADDED';
  previousStage?: AssetStatus;
  newStage?: AssetStatus;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
