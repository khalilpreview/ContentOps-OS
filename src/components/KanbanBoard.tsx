import React, { useState } from 'react';
import { 
  Filter, 
  Search, 
  Layers, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Archive,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GitFork,
  LayoutGrid,
  Zap,
  Flame,
  ShieldCheck,
  Film
} from 'lucide-react';
import { AssetStatus, ContentAsset, FormatTier, PillarType, User } from '../types';
import { PIPELINE_COLUMNS } from '../lib/stateMachine';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  assets: ContentAsset[];
  allUsers: User[];
  currentUser: User;
  onOpenDetail: (asset: ContentAsset) => void;
  onOpenMultiplier: (asset: ContentAsset) => void;
  onTransitionAsset: (asset: ContentAsset, targetStatus: AssetStatus) => void;
  selectedTier: FormatTier | 'ALL';
  onChangeTier: (tier: FormatTier | 'ALL') => void;
  selectedPillar: PillarType | 'ALL';
  onChangePillar: (pillar: PillarType | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterOnlySla: boolean;
  onToggleOnlySla: () => void;
  onOpenNewAsset?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  assets,
  allUsers,
  currentUser,
  onOpenDetail,
  onOpenMultiplier,
  onTransitionAsset,
  selectedTier,
  onChangeTier,
  selectedPillar,
  onChangePillar,
  searchQuery,
  onSearchChange,
  filterOnlySla,
  onToggleOnlySla,
  onOpenNewAsset
}) => {
  const [draggedAsset, setDraggedAsset] = useState<ContentAsset | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AssetStatus | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (selectedTier !== 'ALL' && asset.formatTier !== selectedTier) return false;
    if (selectedPillar !== 'ALL' && asset.pillar !== selectedPillar) return false;
    if (filterOnlySla && asset.status !== 'SLA_REVIEW') return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = asset.title.toLowerCase().includes(q);
      const matchNotes = (asset.rawIntakeNotes || '').toLowerCase().includes(q);
      const matchHook = (asset.hookStrategy || '').toLowerCase().includes(q);
      const assignee = allUsers.find((u) => u.id === asset.assignedToId);
      const matchAssignee = (assignee?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchHook && !matchAssignee) return false;
    }
    return true;
  });

  const assetsByColumn: Record<AssetStatus, ContentAsset[]> = {
    DRAFT_BRIEF: filteredAssets.filter((a) => a.status === 'DRAFT_BRIEF'),
    SLA_REVIEW: filteredAssets.filter((a) => a.status === 'SLA_REVIEW'),
    IN_PRODUCTION: filteredAssets.filter((a) => a.status === 'IN_PRODUCTION'),
    QA_GATE: filteredAssets.filter((a) => a.status === 'QA_GATE'),
    READY_TO_PUBLISH: filteredAssets.filter((a) => a.status === 'READY_TO_PUBLISH'),
    PUBLISHED: filteredAssets.filter((a) => a.status === 'PUBLISHED')
  };

  const getNextStatus = (current: AssetStatus): AssetStatus | null => {
    switch (current) {
      case 'DRAFT_BRIEF': return 'SLA_REVIEW';
      case 'SLA_REVIEW': return 'IN_PRODUCTION';
      case 'IN_PRODUCTION': return 'QA_GATE';
      case 'QA_GATE': return 'READY_TO_PUBLISH';
      case 'READY_TO_PUBLISH': return 'PUBLISHED';
      default: return null;
    }
  };

  const handleQuickAdvance = (asset: ContentAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = getNextStatus(asset.status);
    if (next) {
      onTransitionAsset(asset, next);
    }
  };

  const handleDragStart = (e: React.DragEvent, asset: ContentAsset) => {
    setDraggedAsset(asset);
    e.dataTransfer.setData('text/plain', asset.id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: AssetStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: AssetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedAsset) {
      onTransitionAsset(draggedAsset, targetStatus);
      setDraggedAsset(null);
    }
  };

  const pillars: Array<{ id: PillarType | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Pillars' },
    { id: 'STRATEGY_SERIES', label: 'Strategy Series' },
    { id: 'CONTENT_OPS', label: 'ContentOps' },
    { id: 'CROSS_FUNCTIONAL', label: 'Cross-Functional' },
    { id: 'BRAND_QA', label: 'Brand QA' },
    { id: 'INTELLIGENCE_OPTIMIZATION', label: 'Intel & AI Opt' }
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0f1118] text-[#f1f3f9] overflow-hidden select-none">
      
      {/* Featured Banner & Category Bar Container */}
      <div className="px-4 lg:px-6 pt-4 pb-2 space-y-4">
        
        {/* Featured Hero Banner matching "MASSIVE STUDIOS" mint banner from reference */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#4ff8ac] via-[#38ef98] to-[#25dd8b] text-[#0f1118] p-5 sm:p-6 shadow-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Subtle geometric circle overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0f1118] text-[#4ff8ac] text-[10px] font-extrabold uppercase tracking-wider">
              <Zap className="h-3 w-3 fill-current" />
              <span>FEATURED PIPELINE • ZERO-DRIFT STATE MACHINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">
              Enterprise ContentOps OS
            </h1>
            <p className="text-xs font-semibold text-[#0f1118]/80 max-w-xl">
              Strict RACI gatekeeping veto blocks unreviewed publishing; dynamic 48-hour SLA clocks enforce turnaround deadlines.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 shrink-0">
            {onOpenNewAsset && (
              <button
                onClick={onOpenNewAsset}
                className="px-4 py-2 rounded-2xl bg-[#0f1118] hover:bg-[#181a24] text-white text-xs font-extrabold shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Launch Brief</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Squircles matching LOBBY, ORIGINALS, SLOTS from reference screenshot */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2">
            {/* Lobby / All */}
            <button
              onClick={() => {
                onChangeTier('ALL');
                if (filterOnlySla) onToggleOnlySla();
              }}
              className={`h-16 w-20 sm:w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                selectedTier === 'ALL' && !filterOnlySla
                  ? 'bg-[#181a24] border-[#4ff8ac] text-[#4ff8ac] shadow-md shadow-[#4ff8ac]/10'
                  : 'bg-[#181a24] border-[#252837] text-[#8b93a7] hover:bg-[#202330] hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>ALL PIPELINE</span>
            </button>

            {/* HERO Tier Squircle */}
            <button
              onClick={() => onChangeTier('HERO')}
              className={`h-16 w-20 sm:w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                selectedTier === 'HERO'
                  ? 'bg-[#181a24] border-[#4ff8ac] text-[#4ff8ac] shadow-md shadow-[#4ff8ac]/10'
                  : 'bg-[#181a24] border-[#252837] text-[#8b93a7] hover:bg-[#202330] hover:text-white'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>HERO TIER</span>
            </button>

            {/* HUB Tier Squircle */}
            <button
              onClick={() => onChangeTier('HUB')}
              className={`h-16 w-20 sm:w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                selectedTier === 'HUB'
                  ? 'bg-[#181a24] border-[#4ff8ac] text-[#4ff8ac] shadow-md shadow-[#4ff8ac]/10'
                  : 'bg-[#181a24] border-[#252837] text-[#8b93a7] hover:bg-[#202330] hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>HUB SERIES</span>
            </button>

            {/* HYGIENE Tier Squircle */}
            <button
              onClick={() => onChangeTier('HYGIENE')}
              className={`h-16 w-20 sm:w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                selectedTier === 'HYGIENE'
                  ? 'bg-[#181a24] border-[#4ff8ac] text-[#4ff8ac] shadow-md shadow-[#4ff8ac]/10'
                  : 'bg-[#181a24] border-[#252837] text-[#8b93a7] hover:bg-[#202330] hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>HYGIENE</span>
            </button>

            {/* SLA Active Squircle */}
            <button
              onClick={onToggleOnlySla}
              className={`h-16 w-20 sm:w-24 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                filterOnlySla
                  ? 'bg-[#181a24] border-amber-400 text-amber-300 shadow-md shadow-amber-400/10'
                  : 'bg-[#181a24] border-[#252837] text-[#8b93a7] hover:bg-[#202330] hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>SLA ACTIVE</span>
            </button>
          </div>

          {/* Search & Pillar Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPillar}
              onChange={(e) => onChangePillar(e.target.value as any)}
              className="bg-[#181a24] border border-[#252837] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#4ff8ac]"
              aria-label="Filter by Strategic Pillar"
            >
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b93a7]" />
              <input
                type="text"
                placeholder="Search assets, briefs, hooks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-[#181a24] border border-[#252837] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-[#8b93a7] focus:outline-none focus:ring-1 focus:ring-[#4ff8ac] w-48 lg:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Kanban Board (5 Columns) */}
      <div className="flex-1 overflow-x-auto p-4 lg:p-6 no-scrollbar">
        <div className="flex items-start gap-4 min-w-[1300px] h-full pb-4">
          {PIPELINE_COLUMNS.map((col) => {
            const colAssets = assetsByColumn[col.id] || [];
            const isDropTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex-1 min-w-[250px] max-w-[320px] flex flex-col rounded-3xl bg-[#13151c] border transition-all ${
                  isDropTarget
                    ? 'border-[#4ff8ac] bg-[#181a24] ring-2 ring-[#4ff8ac]/20'
                    : 'border-[#222533]'
                } max-h-[calc(100vh-270px)]`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-[#222533] bg-[#161822] rounded-t-3xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#4ff8ac] px-2 py-0.5 rounded-full bg-[#4ff8ac]/10 border border-[#4ff8ac]/20">
                      {col.badge}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#10121a] text-zinc-200 border border-[#252837]">
                      {colAssets.length}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    {col.title}
                  </h2>
                  <p className="text-[11px] text-[#8b93a7] line-clamp-1 mt-0.5">
                    {col.description}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[160px]">
                  {colAssets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8b93a7] border border-dashed border-[#252837] rounded-2xl my-2">
                      <span className="text-xs">No assets in this stage</span>
                      <span className="text-[10px] text-zinc-600 mt-1">Drag an asset here to advance</span>
                    </div>
                  ) : (
                    colAssets.map((asset) => (
                      <KanbanCard
                        key={asset.id}
                        asset={asset}
                        allUsers={allUsers}
                        currentUser={currentUser}
                        onOpenDetail={onOpenDetail}
                        onOpenMultiplier={onOpenMultiplier}
                        onQuickAdvance={handleQuickAdvance}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Published Tray at bottom */}
      <div className="border-t border-[#222533] bg-[#10121a] px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2 text-xs font-semibold text-[#8b93a7] hover:text-[#4ff8ac] transition-colors cursor-pointer"
          >
            <Archive className="h-4 w-4 text-[#4ff8ac]" />
            <span>Published Deliverables Archive ({assetsByColumn.PUBLISHED.length})</span>
            {showArchive ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Assets distributed across live channels with verified QA clearance
          </span>
        </div>

        {showArchive && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto pt-1 pb-2">
            {assetsByColumn.PUBLISHED.map((asset) => (
              <div
                key={asset.id}
                onClick={() => onOpenDetail(asset)}
                className="bg-[#181a24] border border-[#252837] hover:border-[#4ff8ac]/50 p-3 rounded-2xl cursor-pointer flex flex-col gap-1 transition-all"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#4ff8ac] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Published
                  </span>
                  <span className="text-[#8b93a7] font-mono">
                    {asset.updatedAt.slice(0, 10)}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">
                  {asset.title}
                </h4>
                {asset.deliverableUrl && (
                  <span className="text-[10px] text-[#4ff8ac] truncate font-mono">
                    {asset.deliverableUrl}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
