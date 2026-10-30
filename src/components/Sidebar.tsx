import React from 'react';
import { 
  Layers, 
  Clock, 
  ShieldCheck, 
  GitFork, 
  Archive, 
  Sparkles,
  SlidersHorizontal,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { AssetStatus, ContentAsset, User } from '../types';

interface SidebarProps {
  currentView: 'pipeline' | 'sla' | 'multiplier' | 'archive';
  onChangeView: (view: 'pipeline' | 'sla' | 'multiplier' | 'archive') => void;
  assets: ContentAsset[];
  onOpenNewAsset: () => void;
  onOpenMultiplier: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  assets,
  onOpenNewAsset,
  onOpenMultiplier
}) => {
  const activeSlaCount = assets.filter((a) => a.status === 'SLA_REVIEW').length;
  const qaCount = assets.filter((a) => a.status === 'QA_GATE').length;
  const publishedCount = assets.filter((a) => a.status === 'PUBLISHED').length;

  return (
    <aside className="w-60 bg-[#13151c] border-r border-[#222533] flex flex-col justify-between shrink-0 p-3.5 hidden md:flex select-none">
      {/* Top Dock Icon & Menu */}
      <div className="space-y-5">
        {/* Top dock matching reference screenshot (with mint squircle) */}
        <div className="flex items-center gap-2 p-1.5 bg-[#181a24] border border-[#252837] rounded-2xl w-fit">
          <div className="h-8 w-8 rounded-xl bg-[#4ff8ac] text-[#0f1118] flex items-center justify-center font-bold shadow-md shadow-[#4ff8ac]/20">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <button
            onClick={() => onChangeView('sla')}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
              currentView === 'sla' ? 'bg-[#222634] text-[#4ff8ac]' : 'text-[#8b93a7] hover:text-white'
            }`}
            title="SLA Radar"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            onClick={() => onChangeView('multiplier')}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
              currentView === 'multiplier' ? 'bg-[#222634] text-[#4ff8ac]' : 'text-[#8b93a7] hover:text-white'
            }`}
            title="Asset Multiplier"
          >
            <GitFork className="h-4 w-4" />
          </button>
        </div>

        {/* Section: Main Workflows */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b93a7] px-2.5">
            Operations
          </span>
          <button
            onClick={() => onChangeView('pipeline')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'pipeline'
                ? 'bg-[#181a24] text-white border border-[#2d3144] shadow-sm'
                : 'text-[#8b93a7] hover:text-white hover:bg-[#181a24]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className={`h-4 w-4 ${currentView === 'pipeline' ? 'text-[#4ff8ac]' : ''}`} />
              <span>Pipeline Kanban</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10121a] text-[#8b93a7]">
              {assets.filter((a) => a.status !== 'PUBLISHED').length}
            </span>
          </button>

          <button
            onClick={() => onChangeView('sla')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'sla'
                ? 'bg-[#181a24] text-white border border-[#2d3144] shadow-sm'
                : 'text-[#8b93a7] hover:text-white hover:bg-[#181a24]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className={`h-4 w-4 ${currentView === 'sla' ? 'text-[#4ff8ac]' : ''}`} />
              <span>SLA Turnaround</span>
            </div>
            {activeSlaCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                {activeSlaCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenMultiplier}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'multiplier'
                ? 'bg-[#181a24] text-white border border-[#2d3144] shadow-sm'
                : 'text-[#8b93a7] hover:text-white hover:bg-[#181a24]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GitFork className={`h-4 w-4 ${currentView === 'multiplier' ? 'text-[#4ff8ac]' : ''}`} />
              <span>Asset Multiplier</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4ff8ac]/10 text-[#4ff8ac]">
              HERO
            </span>
          </button>

          <button
            onClick={() => onChangeView('archive')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'archive'
                ? 'bg-[#181a24] text-white border border-[#2d3144] shadow-sm'
                : 'text-[#8b93a7] hover:text-white hover:bg-[#181a24]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Archive className={`h-4 w-4 ${currentView === 'archive' ? 'text-[#4ff8ac]' : ''}`} />
              <span>Published Archive</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10121a] text-[#8b93a7]">
              {publishedCount}
            </span>
          </button>
        </div>

        {/* Section: RACI Guard Summary */}
        <div className="pt-2 border-t border-[#222533] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b93a7] px-2.5">
            RACI Governance
          </span>
          <div className="p-3 rounded-2xl bg-[#181a24] border border-[#252837] space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#8b93a7]">QA Gate VETO:</span>
              <span className="text-[#4ff8ac] font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b93a7]">Pending Sign-Off:</span>
              <span className="text-zinc-200 font-mono">{qaCount} assets</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b93a7]">Turnaround Target:</span>
              <span className="text-amber-400 font-mono">48 Hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Engine Status Card */}
      <div className="pt-3 border-t border-[#222533] space-y-2">
        <div className="p-2.5 rounded-2xl bg-[#181a24] border border-[#252837] flex items-center gap-2.5 text-xs">
          <div className="h-6 w-6 rounded-lg bg-[#4ff8ac]/15 text-[#4ff8ac] flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate">IFM.ai K2 Horizon</div>
            <div className="text-[10px] text-[#4ff8ac] truncate font-mono">● Inference Ready</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
