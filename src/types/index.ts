export type UserRole = 
  | 'SUPER_ADMIN'
  | 'CONTENT_MANAGER'
  | 'CREATIVE_SPECIALIST'
  | 'STAKEHOLDER'
  | 'DISTRIBUTION_LEAD';

export type UserStatus = 'active' | 'invited' | 'suspended';

export type PillarType =
  | 'STRATEGY_SERIES'
  | 'CONTENT_OPS'
  | 'CROSS_FUNCTIONAL'
  | 'BRAND_QA'
  | 'INTELLIGENCE_OPTIMIZATION';

export type FormatTier =
  | 'HERO'     // Macro production: Events, Live Streams, Keynotes
  | 'HUB'      // Episodic series, weekly formats, recurring shows
  | 'HYGIENE'; // Evergreen, search-driven, FAQs, static tutorials

export type AssetStatus =
  | 'DRAFT_BRIEF'
  | 'SLA_REVIEW'
  | 'IN_PRODUCTION'
  | 'QA_GATE'
  | 'READY_TO_PUBLISH'
  | 'PUBLISHED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type QuickFilterType = 'NONE' | 'NEEDS_MY_SIGNOFF' | 'SLA_RISK';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  team?: string;
  status?: UserStatus;
  invitedAt?: string;
  invitedBy?: string;
}

export interface AuthSession {
  user: User;
  token?: string;
  provider: 'google' | 'email' | 'sso';
  loginAt: string;
}

export interface HookVariation {
  type: 'Curiosity' | 'Contrarian' | 'Direct Value' | string;
  script: string;
}

export interface ContentAsset {
  id: string;
  title: string;
  description?: string;
  pillar: PillarType;
  formatTier: FormatTier;
  status: AssetStatus;
  priority: Priority;

  // Parent-Child Asset Multiplier relationship
  parentId?: string | null;
  parentTitle?: string;

  // Briefing Data
  hookStrategy?: string;        // Hook angles (first 3s / headline)
  targetAudience?: string;      // Target audience / persona description
  platformSpecs?: string;       // e.g., 1080x1920, 9:16 safe margins, -14 LUFS
  safeZoneRequirements?: string; // Platform safe zone specifications
  targetKpi?: string;           // e.g., 65% 3s Retention, CTR > 2%
  rawIntakeNotes?: string;       // Campaign raw bullet points
  generatedHooks?: HookVariation[];

  // SLA Management
  slaHours: number;             // default 48
  slaStartedAt?: string | null; // ISO Date string
  slaExpiresAt?: string | null; // ISO Date string
  isSlaBreached: boolean;

  // QA Gatekeeper 4-Point Binary Checklist (Mandatory Sign-Off)
  qaToneApproved: boolean;      // 1. Tone of Voice & Brand Identity cleared
  qaSpecsValidated: boolean;    // 2. Hook strength & safe zones verified
  qaRightsCleared: boolean;     // 3. Commercial music & IP rights licensed
  qaGatekeeperSigned: boolean;  // 4. Gatekeeper Final Sign-off (CONTENT_MANAGER only)
  qaSignedById?: string | null;
  qaSignedByName?: string | null;
  qaSignedAt?: string | null;

  // Attachments & Deliverables
  deliverableUrl?: string | null; // Storage path or external link (Figma, Drive, S3, Frame.io)
  attachmentCount?: number;
  thumbnailUrl?: string | null;

  // Post-Launch Performance Signals (Phase 5 Feedback Loop)
  retentionRate3s?: number | null; // 3-Second Retention Rate (%)
  reachImpressions?: string | null; // Reach / Impressions
  isWinningFormat: boolean;        // True when retentionRate3s > 65%
  paidEligible: boolean;
  sentToPaidAds?: boolean;

  // Ownership & Dates
  createdById: string;
  assignedToId?: string | null;
  targetPublishAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Audit Log
  history?: Array<{
    id: string;
    action: string;
    fromStatus?: AssetStatus;
    toStatus?: AssetStatus;
    userId: string;
    userName: string;
    timestamp: string;
    note?: string;
  }>;
}

export interface BriefGenerationResult {
  hooks: Array<{ type: string; script: string }>;
  technicalSpecs: string;
  targetKpi: string;
}

export interface DerivativeIdea {
  title: string;
  format: string;
  angle: string;
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
  updatedAsset?: Partial<ContentAsset>;
}
