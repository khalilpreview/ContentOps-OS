import React from 'react';
import { 
  Clock, 
  ArrowRight, 
  GitFork, 
  User as UserIcon,
  Check,
  Paperclip
} from 'lucide-react';
import { ContentAsset, User, FormatTier, AssetStatus } from '../types';
import { calculateSla } from '../lib/sla';
import { isTransitionPermittedForRole } from '../lib/stateMachine';

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

  // Compact Format Tier pill
  const formatBadges: Record<FormatTier, { label: string; class: string }> = {
    HERO: {
      label: 'Hero',
      class: 'bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/40'
    },
    HUB: {
      label: 'Hub',
      class: 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
    },
    HYGIENE: {
      label: 'Hygiene',
      class: 'bg-white/10 text-[#8F9CAE] border border-white/10'
    }
  };

  const isHero = asset.formatTier === 'HERO';
  const showPriority = asset.priority === 'URGENT' || asset.priority === 'HIGH';

  const qaCompleteCount = [
    asset.qaToneApproved,
    asset.qaSpecsValidated,
    asset.qaRightsCleared,
    asset.qaGatekeeperSigned
  ].filter(Boolean).length;

  const fileCount = asset.attachmentCount ?? (asset.deliverableUrl ? 1 : 0);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, asset)}
      onClick={() => onOpenDetail(asset)}
      className="group relative bg-[#181E2C] hover:bg-[#1E2536] border border-white/[0.07] hover:border-[#00E599]/40 rounded-xl p-3.5 shadow-sm transition-colors cursor-pointer flex flex-col gap-2.5 text-white focus-within:ring-1 focus-within:ring-[#00E599]/50"
    >
      {/* Top row: Format Tier Badge + Priority (only if HIGH or URGENT) */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${formatBadges[asset.formatTier].class}`}>
          {formatBadges[asset.formatTier].label}
        </span>

        {showPriority && (
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${
              asset.priority === 'URGENT'
                ? 'bg-[#FF4B55]/15 text-[#FF4B55] border-[#FF4B55]/40'
                : 'bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/40'
            }`}
          >
            {asset.priority === 'URGENT' ? 'Urgent' : 'High'}
          </span>
        )}
      </div>

      {/* Title in high-contrast white #FFFFFF */}
      <h3 className="font-semibold text-sm text-[#FFFFFF] group-hover:text-[#00E599] transition-colors line-clamp-2 leading-snug">
        {asset.title.replace(/^↳\s*/, '')}
      </h3>

      {/* Derivative indicator: subtle slate tag with branch icon ('text-slate-400 text-xs') */}
      {asset.parentId && (
        <div className="flex items-center gap-1.5 text-slate-400 text-xs truncate">
          <GitFork className="h-3 w-3 text-[#00E599] shrink-0" />
          <span className="truncate">↳ Derivative of: {asset.parentTitle || 'Parent Hero'}</span>
        </div>
      )}

      {/* Dynamic SLA Countdown (Only for Stage 2 SLA_REVIEW) */}
      {asset.status === 'SLA_REVIEW' && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border font-mono tabular-nums ${slaInfo.badgeClass}`}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-semibold">{slaInfo.label}</span>
        </div>
      )}

      {/* Stage 4 QA Checklist status */}
      {asset.status === 'QA_GATE' && (
        <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-[#121620] rounded-lg border border-white/[0.07] text-[11px] whitespace-nowrap">
          <span className="text-[#8F9CAE]">QA:</span>
          <div className="flex items-center gap-1.5 tabular-nums">
            <span className={`font-mono font-bold ${qaCompleteCount === 4 ? 'text-[#00E599]' : 'text-[#F5A524]'}`}>
              {qaCompleteCount}/4 Cleared
            </span>
            {asset.qaGatekeeperSigned ? (
              <span className="text-[10px] text-[#00E599] flex items-center gap-0.5 font-semibold">
                <Check className="h-3 w-3" /> Signed
              </span>
            ) : (
              <span className="text-[10px] text-[#8F9CAE]">Unsigned</span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Assignee Avatar + Subtle Paperclip Icon + Split Badge + Quick Advance */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.07] mt-auto text-xs">
        {/* Assignee Avatar & Name */}
        <div className="flex items-center gap-1.5 min-w-0">
          {assignee?.avatarUrl ? (
            <img 
              src={assignee.avatarUrl} 
              alt={assignee.name}
              className="h-5 w-5 rounded-full object-cover ring-1 ring-white/15 shrink-0"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-[#121620] flex items-center justify-center text-[#8F9CAE] shrink-0">
              <UserIcon className="h-3 w-3" />
            </div>
          )}
          <span className="text-[11px] text-[#8F9CAE] truncate max-w-[110px]">
            {assignee?.name || 'Unassigned'}
          </span>
        </div>

        {/* Right: Subtle Paperclip Count, HERO Split Action, Quick Advance */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Subtle Paperclip / Attachment Icon with file count */}
          {fileCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-[#8F9CAE] hover:text-white font-mono px-1.5 py-0.5 rounded bg-[#121620] border border-white/[0.05] tabular-nums"
              title={asset.deliverableUrl ? `Deliverable attached: ${asset.deliverableUrl}` : `${fileCount} file(s) attached`}
            >
              <Paperclip className="h-3 w-3 text-[#8F9CAE]" />
              <span>{fileCount}</span>
            </span>
          )}

          {/* Split Badge on HERO cards */}
          {isHero && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMultiplier(asset);
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#00E599]/15 hover:bg-[#00E599]/25 text-[#00E599] border border-[#00E599]/40 flex items-center gap-1 transition-colors cursor-pointer"
              title="Open Asset Multiplier (Split HERO into child tickets)"
            >
              <GitFork className="h-3 w-3" />
              <span>Split</span>
            </button>
          )}

          {/* Quick Advance Button */}
          {asset.status !== 'PUBLISHED' && (() => {
            const nextStatusMap: Record<AssetStatus, AssetStatus | null> = {
              DRAFT_BRIEF: 'SLA_REVIEW',
              SLA_REVIEW: 'IN_PRODUCTION',
              IN_PRODUCTION: 'QA_GATE',
              QA_GATE: 'READY_TO_PUBLISH',
              READY_TO_PUBLISH: 'PUBLISHED',
              PUBLISHED: null,
            };
            const next = nextStatusMap[asset.status];
            const isPermitted = next ? isTransitionPermittedForRole(asset.status, next, currentUser.role) : false;

            return (
              <button
                type="button"
                onClick={(e) => {
                  onQuickAdvance(asset, e);
                }}
                disabled={!isPermitted}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isPermitted
                    ? 'hover:bg-[#121620] text-[#8F9CAE] hover:text-[#00E599]'
                    : 'text-white/20 hover:text-white/30 cursor-not-allowed opacity-40'
                }`}
                title={
                  isPermitted
                    ? `Advance to next stage (${next})`
                    : `Permission restricted: ${currentUser.role} cannot move card from ${asset.status} to ${next}`
                }
                aria-label={`Advance ${asset.title}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
