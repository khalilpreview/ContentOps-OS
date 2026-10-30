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
  GitFork
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
  onToggleOnlySla
}) => {
  const [draggedAsset, setDraggedAsset] = useState<ContentAsset | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AssetStatus | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    // Tier filter
    if (selectedTier !== 'ALL' && asset.formatTier !== selectedTier) return false;
    // Pillar filter
    if (selectedPillar !== 'ALL' && asset.pillar !== selectedPillar) return false;
    // SLA filter
    if (filterOnlySla && asset.status !== 'SLA_REVIEW') return false;
    // Search query
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

  // Assets grouped by status
  const assetsByColumn: Record<AssetStatus, ContentAsset[]> = {
    DRAFT_BRIEF: filteredAssets.filter((a) => a.status === 'DRAFT_BRIEF'),
    SLA_REVIEW: filteredAssets.filter((a) => a.status === 'SLA_REVIEW'),
    IN_PRODUCTION: filteredAssets.filter((a) => a.status === 'IN_PRODUCTION'),
    QA_GATE: filteredAssets.filter((a) => a.status === 'QA_GATE'),
    READY_TO_PUBLISH: filteredAssets.filter((a) => a.status === 'READY_TO_PUBLISH'),
    PUBLISHED: filteredAssets.filter((a) => a.status === 'PUBLISHED')
  };

  // Next status determination for quick advance
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

  // Drag handlers
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

  const formatTiers: Array<{ id: FormatTier | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Tiers' },
    { id: 'HERO', label: 'HERO (Macro)' },
    { id: 'HUB', label: 'HUB (Series)' },
    { id: 'HYGIENE', label: 'HYGIENE (Search)' }
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Filter and Control Bar */}
      <div className="px-4 lg:px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
        {/* Tier filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs text-zinc-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Tier:
          </span>
          {formatTiers.map((t) => (
            <button
              key={t.id}
              onClick={() => onChangeTier(t.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTier === t.id
                  ? 'bg-zinc-100 text-zinc-900 font-bold shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters: Pillar, Search, SLA alert toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Pillar Selector */}
          <select
            value={selectedPillar}
            onChange={(e) => onChangePillar(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Filter by Strategic Pillar"
          >
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          {/* SLA Filter Toggle */}
          <button
            onClick={onToggleOnlySla}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filterOnlySla
                ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
            }`}
            title="Filter cards currently in SLA Review window"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>SLA Active</span>
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search assets, briefs, hooks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 md:w-56"
            />
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
                className={`flex-1 min-w-[250px] max-w-[320px] flex flex-col rounded-2xl bg-zinc-900/40 border transition-all ${
                  isDropTarget
                    ? 'border-indigo-500 bg-indigo-950/10 ring-2 ring-indigo-500/20'
                    : 'border-zinc-800/80'
                } max-h-[calc(100vh-160px)]`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/60 rounded-t-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">
                      {col.badge}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200">
                      {colAssets.length}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
                    {col.title}
                  </h2>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                    {col.description}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 min-h-[160px]">
                  {colAssets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500 border border-dashed border-zinc-800/80 rounded-xl my-2">
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

      {/* Collapsible Published Tray */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <Archive className="h-4 w-4 text-emerald-400" />
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
                className="bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 p-2.5 rounded-lg cursor-pointer flex flex-col gap-1 transition-all"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Published
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {asset.updatedAt.slice(0, 10)}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-zinc-200 line-clamp-1">
                  {asset.title}
                </h4>
                {asset.deliverableUrl && (
                  <span className="text-[10px] text-indigo-400 truncate">
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
