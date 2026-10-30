import React from 'react';
import { 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  GitFork, 
  FileText,
  User as UserIcon,
  Check
} from 'lucide-react';
import { ContentAsset, User, FormatTier } from '../types';
import { calculateSla } from '../lib/sla';

interface KanbanCardProps {
  asset: ContentAsset;
  allUsers: User[];
  onOpenDetail: (asset: ContentAsset) => void;
  onOpenMultiplier: (asset: ContentAsset) => void;
  onQuickAdvance: (asset: ContentAsset, e: React.MouseEvent) => void;
  currentUser: User;
  onDragStart?: (e: React.DragEvent, asset: ContentAsset) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  asset,
  allUsers,
  onOpenDetail,
  onOpenMultiplier,
  onQuickAdvance,
  currentUser,
  onDragStart
}) => {
  const slaInfo = calculateSla(asset);
  const assignee = allUsers.find((u) => u.id === asset.assignedToId);

  // Format Tier badge styling with mint / amber / indigo accents
  const formatBadges: Record<FormatTier, { label: string; class: string }> = {
    HERO: {
      label: 'HERO',
      class: 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
    },
    HUB: {
      label: 'HUB',
      class: 'bg-[#4ff8ac]/15 text-[#4ff8ac] border-[#4ff8ac]/30'
    },
    HYGIENE: {
      label: 'HYGIENE',
      class: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    }
  };

  const priorityStyles: Record<string, string> = {
    URGENT: 'text-rose-400 bg-rose-950/60 border-rose-600/40',
    HIGH: 'text-amber-400 bg-amber-950/60 border-amber-600/40',
    MEDIUM: 'text-[#8b93a7] bg-[#10121a] border-[#252837]',
    LOW: 'text-zinc-500 bg-[#10121a] border-[#252837]'
  };

  const pillarLabels: Record<string, string> = {
    STRATEGY_SERIES: 'Strategy Series',
    CONTENT_OPS: 'ContentOps',
    CROSS_FUNCTIONAL: 'Cross-Functional',
    BRAND_QA: 'Brand QA',
    INTELLIGENCE_OPTIMIZATION: 'Intel & AI Opt'
  };

  const isHero = asset.formatTier === 'HERO';
  const qaCompleteCount = [
    asset.qaToneApproved,
    asset.qaSpecsValidated,
    asset.qaRightsCleared,
    asset.qaGatekeeperSigned
  ].filter(Boolean).length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, asset)}
      onClick={() => onOpenDetail(asset)}
      className="group relative bg-[#181a24] hover:bg-[#1e212e] border border-[#252837] hover:border-[#33374b] rounded-2xl p-3.5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col gap-2.5 text-zinc-200 focus-within:ring-2 focus-within:ring-[#4ff8ac]/40"
    >
      {/* Top row: Format Badge, Pillar, and Priority */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${formatBadges[asset.formatTier].class}`}>
            {formatBadges[asset.formatTier].label}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#10121a] text-[#8b93a7] border border-[#252837] truncate max-w-[120px]">
            {pillarLabels[asset.pillar] || asset.pillar}
          </span>
        </div>

        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md border uppercase ${priorityStyles[asset.priority] || priorityStyles.MEDIUM}`}>
          {asset.priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-white group-hover:text-[#4ff8ac] transition-colors line-clamp-2 leading-snug">
        {asset.title}
      </h3>

      {/* Parent Hierarchy Tag if child */}
      {asset.parentId && (
        <div className="flex items-center gap-1 text-[11px] text-[#8b93a7] bg-[#10121a] px-2 py-1 rounded-lg border border-[#252837] truncate">
          <GitFork className="h-3 w-3 text-[#4ff8ac] shrink-0" />
          <span className="truncate">↳ Derivative of: {asset.parentTitle || 'Parent Hero'}</span>
        </div>
      )}

      {/* Dynamic SLA Badge (Only for SLA_REVIEW or if SLA is breached) */}
      {asset.status === 'SLA_REVIEW' && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-mono ${slaInfo.badgeClass}`}>
          <Clock className={`h-3.5 w-3.5 shrink-0 ${slaInfo.isBreached ? 'text-rose-400' : ''}`} />
          <span className="truncate">{slaInfo.label}</span>
        </div>
      )}

      {/* QA Status indicator (for QA_GATE stage) */}
      {asset.status === 'QA_GATE' && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#10121a] rounded-xl border border-[#252837] text-xs">
          <span className="text-[#8b93a7] text-[11px]">QA Checklist:</span>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-[11px] font-bold ${qaCompleteCount === 4 ? 'text-[#4ff8ac]' : 'text-amber-400'}`}>
              {qaCompleteCount}/4 Cleared
            </span>
            {asset.qaGatekeeperSigned ? (
              <span className="text-[10px] text-[#4ff8ac] flex items-center gap-0.5 font-semibold">
                <Check className="h-3 w-3" /> Signed
              </span>
            ) : (
              <span className="text-[10px] text-[#8b93a7]">Unsigned</span>
            )}
          </div>
        </div>
      )}

      {/* Deliverable Link Pill */}
      {asset.deliverableUrl && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            window.open(asset.deliverableUrl!, '_blank');
          }}
          className="flex items-center gap-1.5 text-[11px] text-[#4ff8ac] hover:text-[#38ef98] bg-[#4ff8ac]/10 hover:bg-[#4ff8ac]/20 px-2.5 py-1 rounded-lg border border-[#4ff8ac]/25 w-fit transition-colors"
          title={`Deliverable: ${asset.deliverableUrl}`}
        >
          <ExternalLink className="h-3 w-3" />
          <span className="truncate max-w-[200px] font-medium">Deliverable Attached</span>
        </div>
      )}

      {/* Footer: Assignee & Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[#252837] mt-auto text-xs">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {assignee?.avatarUrl ? (
            <img 
              src={assignee.avatarUrl} 
              alt={assignee.name}
              className="h-5 w-5 rounded-full object-cover ring-1 ring-[#252837]"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-[#10121a] flex items-center justify-center text-[#8b93a7]">
              <UserIcon className="h-3 w-3" />
            </div>
          )}
          <span className="text-[11px] text-[#8b93a7] truncate max-w-[100px]">
            {assignee?.name || 'Unassigned'}
          </span>
        </div>

        {/* Action icons / Quick advance */}
        <div className="flex items-center gap-1">
          {/* Asset Multiplier button for Hero tier */}
          {isHero && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenMultiplier(asset);
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#4ff8ac]/15 hover:bg-[#4ff8ac]/25 text-[#4ff8ac] border border-[#4ff8ac]/30 flex items-center gap-1 transition-colors"
              title="Split into Derivatives (Asset Multiplier Engine)"
            >
              <GitFork className="h-3 w-3" />
              <span>Split</span>
            </button>
          )}

          {/* Quick Advance button */}
          {asset.status !== 'PUBLISHED' && (
            <button
              onClick={(e) => onQuickAdvance(asset, e)}
              className="p-1 rounded-lg hover:bg-[#252837] text-[#8b93a7] hover:text-[#4ff8ac] transition-colors"
              title="Advance to Next Stage"
              aria-label={`Advance ${asset.title}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
