export type UserRole = 
  | 'CONTENT_MANAGER'
  | 'CREATIVE_SPECIALIST'
  | 'STAKEHOLDER'
  | 'DISTRIBUTION_LEAD';

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
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
  platformSpecs?: string;       // e.g., 9:16 vertical, 1080x1920, max 60s
  targetKpi?: string;           // e.g., 65% 3s Retention, CTR > 2%
  rawIntakeNotes?: string;       // Campaign raw bullet points
  generatedHooks?: HookVariation[];

  // SLA Management
  slaHours: number;             // default 48
  slaStartedAt?: string | null; // ISO Date string
  slaExpiresAt?: string | null; // ISO Date string
  isSlaBreached: boolean;

  // QA Gatekeeper Checklist (Mandatory Sign-Off)
  qaToneApproved: boolean;
  qaSpecsValidated: boolean;
  qaRightsCleared: boolean;
  qaGatekeeperSigned: boolean;
  qaSignedById?: string | null;
  qaSignedByName?: string | null;
  qaSignedAt?: string | null;

  // Attachments & Deliverables
  deliverableUrl?: string | null; // Storage path or external link (Figma, Drive, S3, Frame.io)
  thumbnailUrl?: string | null;

  // Performance Signals (Feedback loop)
  isWinningFormat: boolean;
  paidEligible: boolean;

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
