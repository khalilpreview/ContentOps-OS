import { useMemo } from 'react';
import { ContentAsset, FormatTier, PillarType, QuickFilterType, User } from '../types';
import { calculateSla } from '../lib/sla';

export interface BoardStateForCopilot {
  assets: ContentAsset[];
  selectedTier?: FormatTier | 'ALL';
  selectedPillar?: PillarType | 'ALL';
  quickFilter?: QuickFilterType;
  filterOnlySla?: boolean;
  searchQuery?: string;
  focusedAsset?: ContentAsset | null;
}

export interface CopilotCardSnapshot {
  id: string;
  title: string;
  column: string;
  format: FormatTier;
  priority: string;
  slaRemainingHours: number | null;
  slaLabel: string;
  isSlaBreached: boolean;
  qaChecklist: string;
  qaClearedCount: number;
  qaGatekeeperSigned: boolean;
  hasDeliverable: boolean;
}

export interface CopilotSystemContext {
  currentUser: {
    id: string;
    name: string;
    role: User['role'];
  };
  activeFilter: {
    tier: string;
    pillar: string;
    quickFilter: string;
    slaOnly: boolean;
    searchQuery: string;
  };
  pipelineSummary: {
    totalAssets: number;
    activePipelineCount: number;
    publishedCount: number;
    capacityLimit: number;
    slaRisks: number;
    breachedCount: number;
    pendingQASignoffs: number;
  };
  activeCards: CopilotCardSnapshot[];
  focusedAsset: {
    id: string;
    title: string;
    status: string;
    formatTier: string;
    hookStrategy?: string;
    platformSpecs?: string;
    deliverableUrl?: string | null;
  } | null;
}

/**
 * Pure function to construct the Copilot SystemContext payload from board state.
 */
export function buildCopilotContext(
  boardState: BoardStateForCopilot,
  currentUser: User,
  now: Date = new Date()
): CopilotSystemContext {
  const activeAssets = boardState.assets.filter((a) => a.status !== 'PUBLISHED');
  const publishedAssets = boardState.assets.filter((a) => a.status === 'PUBLISHED');

  const activeCards: CopilotCardSnapshot[] = boardState.assets.map((a) => {
    const sla = calculateSla(a, now);
    const qaClearedCount = [
      a.qaToneApproved,
      a.qaSpecsValidated,
      a.qaRightsCleared,
      a.qaGatekeeperSigned
    ].filter(Boolean).length;

    return {
      id: a.id,
      title: a.title,
      column: a.status,
      format: a.formatTier,
      priority: a.priority,
      slaRemainingHours: a.status === 'SLA_REVIEW' ? sla.hoursRemaining : null,
      slaLabel: a.status === 'SLA_REVIEW' ? sla.label : 'N/A',
      isSlaBreached: a.status === 'SLA_REVIEW' ? sla.isBreached : false,
      qaChecklist: `${qaClearedCount}/4 cleared`,
      qaClearedCount,
      qaGatekeeperSigned: a.qaGatekeeperSigned,
      hasDeliverable: Boolean(a.deliverableUrl)
    };
  });

  const slaRisks = activeCards.filter(
    (c) =>
      c.column === 'SLA_REVIEW' &&
      (c.isSlaBreached || (c.slaRemainingHours !== null && c.slaRemainingHours < 12))
  ).length;

  const breachedCount = activeCards.filter(
    (c) => c.column === 'SLA_REVIEW' && c.isSlaBreached
  ).length;

  const pendingQASignoffs = activeCards.filter(
    (c) => c.column === 'QA_GATE' && !c.qaGatekeeperSigned
  ).length;

  return {
    currentUser: {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    },
    activeFilter: {
      tier: boardState.selectedTier || 'ALL',
      pillar: boardState.selectedPillar || 'ALL',
      quickFilter: boardState.quickFilter || 'NONE',
      slaOnly: Boolean(boardState.filterOnlySla),
      searchQuery: boardState.searchQuery || ''
    },
    pipelineSummary: {
      totalAssets: boardState.assets.length,
      activePipelineCount: activeAssets.length,
      publishedCount: publishedAssets.length,
      capacityLimit: 25,
      slaRisks,
      breachedCount,
      pendingQASignoffs
    },
    activeCards,
    focusedAsset: boardState.focusedAsset
      ? {
          id: boardState.focusedAsset.id,
          title: boardState.focusedAsset.title,
          status: boardState.focusedAsset.status,
          formatTier: boardState.focusedAsset.formatTier,
          hookStrategy: boardState.focusedAsset.hookStrategy,
          platformSpecs: boardState.focusedAsset.platformSpecs,
          deliverableUrl: boardState.focusedAsset.deliverableUrl
        }
      : null
  };
}

/**
 * React hook wrapping buildCopilotContext for live reactivity inside FloatingCopilot.
 */
export function useCopilotContext(
  boardState: BoardStateForCopilot,
  currentUser: User
): CopilotSystemContext {
  return useMemo(
    () => buildCopilotContext(boardState, currentUser),
    [
      boardState.assets,
      boardState.selectedTier,
      boardState.selectedPillar,
      boardState.quickFilter,
      boardState.filterOnlySla,
      boardState.searchQuery,
      boardState.focusedAsset,
      currentUser
    ]
  );
}
