import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Archive,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Flame,
  Plus,
  Send,
  X,
  History,
  CornerDownLeft,
  Trash2
} from 'lucide-react';
import { AssetStatus, ContentAsset, FormatTier, PillarType, QuickFilterType, User } from '../types';
import { PIPELINE_COLUMNS } from '../lib/stateMachine';
import { calculateSla, isNeedsMySignOffAsset, isSlaRiskAsset, evaluatePostLaunchRetention } from '../lib/sla';
import { getSearchHistory, saveSearchHistory, MAX_SEARCH_HISTORY_ITEMS } from '../lib/storageMigration';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  assets: ContentAsset[];
  allUsers: User[];
  currentUser: User;
  onOpenDetail: (asset: ContentAsset) => void;
  onOpenMultiplier: (asset: ContentAsset) => void;
  onTransitionAsset: (asset: ContentAsset, targetStatus: AssetStatus) => void;
  onUpdateAsset: (asset: ContentAsset) => void;
  selectedTier: FormatTier | 'ALL';
  onChangeTier: (tier: FormatTier | 'ALL') => void;
  selectedPillar: PillarType | 'ALL';
  onChangePillar: (pillar: PillarType | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterOnlySla: boolean;
  onToggleOnlySla: () => void;
  quickFilter: QuickFilterType;
  onChangeQuickFilter: (filter: QuickFilterType) => void;
  onOpenNewAsset?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  assets,
  allUsers,
  currentUser,
  onOpenDetail,
  onOpenMultiplier,
  onTransitionAsset,
  onUpdateAsset,
  selectedTier,
  onChangeTier,
  selectedPillar,
  onChangePillar,
  searchQuery,
  onSearchChange,
  filterOnlySla,
  onToggleOnlySla,
  quickFilter,
  onChangeQuickFilter,
  onOpenNewAsset
}) => {
  const [draggedAsset, setDraggedAsset] = useState<ContentAsset | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AssetStatus | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);

  // Search History Dropdown State (Last 5 Queries)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [highlightedHistoryIdx, setHighlightedHistoryIdx] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Record a query to the top of the 5-item history
  const commitSearchQuery = useCallback((rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const updated = saveSearchHistory([
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
      ]);
      return updated;
    });
  }, []);

  // Automatically record meaningful typed search queries after a pause (850ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;
    const timer = window.setTimeout(() => {
      commitSearchQuery(trimmed);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [searchQuery, commitSearchQuery]);

  // Close search dropdown on outside click & listen for global 'S' focus shortcut
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
        setHighlightedHistoryIdx(-1);
      }
    };

    const handleGlobalFocusSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('contentops:focus-search', handleGlobalFocusSearch);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('contentops:focus-search', handleGlobalFocusSearch);
    };
  }, []);

  const handleSelectHistoryQuery = (query: string) => {
    onSearchChange(query);
    commitSearchQuery(query);
    setIsSearchOpen(false);
    setHighlightedHistoryIdx(-1);
  };

  const handleRemoveHistoryItem = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== queryToRemove);
      return saveSearchHistory(filtered);
    });
  };

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory(saveSearchHistory([]));
    setHighlightedHistoryIdx(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!isSearchOpen && searchHistory.length > 0) {
        setIsSearchOpen(true);
        setHighlightedHistoryIdx(0);
        e.preventDefault();
        return;
      }
      if (searchHistory.length > 0) {
        e.preventDefault();
        setHighlightedHistoryIdx((prev) => (prev + 1) % searchHistory.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (isSearchOpen && searchHistory.length > 0) {
        e.preventDefault();
        setHighlightedHistoryIdx((prev) =>
          prev <= 0 ? searchHistory.length - 1 : prev - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isSearchOpen && highlightedHistoryIdx >= 0 && highlightedHistoryIdx < searchHistory.length) {
        handleSelectHistoryQuery(searchHistory[highlightedHistoryIdx]);
      } else if (searchQuery.trim() !== '') {
        commitSearchQuery(searchQuery);
        setIsSearchOpen(false);
        setHighlightedHistoryIdx(-1);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setHighlightedHistoryIdx(-1);
      searchInputRef.current?.blur();
    }
  };

  // Compute live actionable status bar metrics
  const firstName = currentUser.name.split(' ')[0] || 'Elena';
  const awaitingSignOffCount = assets.filter((a) => a.status === 'QA_GATE' && !a.qaGatekeeperSigned).length;
  const expiringTodayCount = assets.filter((a) => {
    if (a.status !== 'SLA_REVIEW') return false;
    const sla = calculateSla(a);
    return !sla.isBreached && sla.hoursRemaining <= 24;
  }).length;
  const activeCapacityCount = assets.filter((a) => a.status !== 'PUBLISHED').length;

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (quickFilter === 'NEEDS_MY_SIGNOFF') {
      if (!isNeedsMySignOffAsset(asset, currentUser)) return false;
    } else if (quickFilter === 'SLA_RISK') {
      if (!isSlaRiskAsset(asset)) return false;
    }

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
    PUBLISHED: assets.filter((a) => a.status === 'PUBLISHED')
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
      if (next === 'PUBLISHED') {
        setShowArchive(true);
      }
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
      if (targetStatus === 'PUBLISHED') {
        setShowArchive(true);
      }
      setDraggedAsset(null);
    }
  };

  const handleUpdateArchiveMetrics = (
    asset: ContentAsset,
    retentionRate3s: number | null,
    reachImpressions: string
  ) => {
    const perf = evaluatePostLaunchRetention(retentionRate3s ?? 0);
    onUpdateAsset({
      ...asset,
      retentionRate3s,
      reachImpressions,
      isWinningFormat: perf.isWinningFormat,
      paidEligible: perf.paidEligible,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSendToPaidAds = (asset: ContentAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateAsset({
      ...asset,
      sentToPaidAds: true,
      updatedAt: new Date().toISOString()
    });
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
    <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E14] text-white overflow-hidden select-none">
      
      {/* Top Banner & Filter Bar Container */}
      <div className="px-4 lg:px-6 pt-4 pb-2 space-y-3.5">
        
        {/* Sleek Thrill-Styled Top Surface Banner (#121620 with 1px solid rgba(255,255,255,0.08)) */}
        <div className="relative rounded-2xl bg-[#121620] border border-white/[0.08] p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Actionable Status Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 font-semibold text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                <span>Active Production Pipeline</span>
              </span>
              <span className="text-[#FFFFFF] font-medium">
                Good morning, {firstName} • {awaitingSignOffCount} {awaitingSignOffCount === 1 ? 'asset' : 'assets'} awaiting your sign-off • {expiringTodayCount} review SLA expiring today
              </span>
            </div>

            {/* Banner Title with #00E599 status indicator dot */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E599] shadow-sm shadow-[#00E599]/50 shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#FFFFFF]">
                Active Production Engine
              </h1>
            </div>

            {/* Subtitle in #8F9CAE */}
            <p className="text-xs text-[#8F9CAE] max-w-2xl leading-relaxed">
              Strict RACI gatekeeping veto blocks unreviewed publishing; dynamic 48-hour SLA clocks enforce turnaround deadlines.
            </p>
          </div>

          {/* Right side of banner: Active Capacity Pill Widget & + New Brief CTA */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-lg bg-[#181E2C] border border-white/10 flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="h-2 w-2 rounded-full bg-[#00E599]" />
              <span className="text-[#8F9CAE]">Capacity:</span>
              <span className="text-[#FFFFFF] font-bold">{activeCapacityCount} / 25 Assets</span>
            </div>

            {onOpenNewAsset && (
              <button
                type="button"
                onClick={onOpenNewAsset}
                title="Create New Brief (Shortcut: N)"
                className="px-4 py-2 rounded-lg bg-[#00E599] text-[#0B0E14] font-semibold hover:bg-[#00cc88] text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>+ New Brief</span>
                <kbd className="ml-0.5 px-1.5 py-0.2 rounded bg-[#0B0E14]/15 text-[#0B0E14] font-mono text-[10px] font-bold">
                  N
                </kbd>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* ALL PIPELINE */}
            <button
              type="button"
              onClick={() => {
                onChangeTier('ALL');
                if (filterOnlySla) onToggleOnlySla();
                if (quickFilter !== 'NONE') onChangeQuickFilter('NONE');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedTier === 'ALL' && !filterOnlySla && quickFilter === 'NONE'
                  ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/5'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>ALL PIPELINE</span>
            </button>

            {/* HERO TIER */}
            <button
              type="button"
              onClick={() => onChangeTier('HERO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedTier === 'HERO'
                  ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/5'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>HERO TIER</span>
            </button>

            {/* HUB SERIES */}
            <button
              type="button"
              onClick={() => onChangeTier('HUB')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedTier === 'HUB'
                  ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/5'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>HUB SERIES</span>
            </button>

            {/* HYGIENE */}
            <button
              type="button"
              onClick={() => onChangeTier('HYGIENE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedTier === 'HYGIENE'
                  ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/5'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>HYGIENE</span>
            </button>

            {/* SLA ACTIVE */}
            <button
              type="button"
              onClick={onToggleOnlySla}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                filterOnlySla
                  ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                  : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/5'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>SLA ACTIVE</span>
            </button>

            {/* Active Quick Filter Pill if toggled from Sidebar */}
            {quickFilter !== 'NONE' && (
              <button
                type="button"
                onClick={() => onChangeQuickFilter('NONE')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {quickFilter === 'NEEDS_MY_SIGNOFF' ? '⚡ Needs My Sign-off' : '⚠️ SLA Risk'}
                </span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Search & Pillar Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPillar}
              onChange={(e) => onChangePillar(e.target.value as any)}
              className="bg-[#181E2C] border border-white/[0.07] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
              aria-label="Filter by Strategic Pillar"
            >
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <div ref={searchContainerRef} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8F9CAE] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search assets, briefs, hooks..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => {
                  if (searchQuery.trim().length >= 2) {
                    commitSearchQuery(searchQuery);
                  }
                }}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchOpen(true);
                  setHighlightedHistoryIdx(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search pipeline assets"
                aria-expanded={isSearchOpen}
                aria-haspopup="listbox"
                className="bg-[#181E2C] border border-white/[0.07] rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-[#8F9CAE] focus:outline-none focus:border-[#00E599] w-52 lg:w-64 transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery.trim().length >= 2) {
                      commitSearchQuery(searchQuery);
                    }
                    onSearchChange('');
                    setHighlightedHistoryIdx(-1);
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F9CAE] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                !isSearchOpen && (
                  <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#121620] border border-white/10 text-[10px] font-mono text-[#8F9CAE]">
                    S
                  </kbd>
                )
              )}

              {/* Search History Dropdown (Last 5 Queries) */}
              {isSearchOpen && (
                <div
                  role="listbox"
                  aria-label="Recent search queries"
                  className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-[#181E2C] border border-white/[0.1] shadow-2xl shadow-black/60 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-white/[0.07] bg-[#121620] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8F9CAE]">
                      <History className="h-3.5 w-3.5 text-[#00E599]" />
                      <span>Recent Searches</span>
                      <span className="text-[10px] font-mono text-[#8F9CAE]/70">
                        ({searchHistory.length}/{MAX_SEARCH_HISTORY_ITEMS})
                      </span>
                    </div>
                    {searchHistory.length > 0 && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleClearAllHistory}
                        className="text-[10px] font-medium text-[#8F9CAE] hover:text-[#FF4B55] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {searchHistory.length === 0 ? (
                    <div className="px-3.5 py-4 text-center">
                      <p className="text-xs text-[#8F9CAE]">No recent searches yet</p>
                      <p className="text-[10px] text-[#8F9CAE]/60 mt-0.5">
                        Press Enter or select a query to save up to {MAX_SEARCH_HISTORY_ITEMS} searches
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {searchHistory.map((item, idx) => {
                        const isHighlighted = idx === highlightedHistoryIdx;
                        const isActiveQuery =
                          searchQuery.trim().toLowerCase() === item.toLowerCase();

                        return (
                          <div
                            key={item}
                            role="option"
                            aria-selected={isHighlighted || isActiveQuery}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlightedHistoryIdx(idx)}
                            onClick={() => handleSelectHistoryQuery(item)}
                            className={`px-3 py-2 flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors group ${
                              isHighlighted
                                ? 'bg-[#1E2536] text-white'
                                : isActiveQuery
                                ? 'bg-[#00E599]/10 text-[#00E599]'
                                : 'text-white/90 hover:bg-[#1E2536] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Clock
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isActiveQuery || isHighlighted
                                    ? 'text-[#00E599]'
                                    : 'text-[#8F9CAE]'
                                }`}
                              />
                              <span className="truncate font-medium">{item}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isActiveQuery && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                                  Active
                                </span>
                              )}
                              <CornerDownLeft className="h-3 w-3 text-[#8F9CAE] opacity-0 group-hover:opacity-100 transition-opacity" />
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => handleRemoveHistoryItem(item, e)}
                                title={`Remove "${item}" from history`}
                                aria-label={`Remove ${item} from recent searches`}
                                className="p-0.5 rounded text-[#8F9CAE] hover:text-[#FF4B55] hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {searchQuery.trim() !== '' &&
                    !searchHistory.some(
                      (h) => h.toLowerCase() === searchQuery.trim().toLowerCase()
                    ) && (
                      <div className="px-3 py-1.5 border-t border-white/[0.07] bg-[#121620] flex items-center justify-between text-[10px] text-[#8F9CAE]">
                        <span className="truncate">
                          Press <kbd className="px-1 py-0.5 rounded bg-[#181E2C] border border-white/10 text-white font-mono">Enter</kbd> to save{' '}
                          <span className="text-white font-medium">"{searchQuery.trim()}"</span>
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Kanban Board (5 Columns) */}
      <div className="flex-1 overflow-x-auto px-4 lg:px-6 py-3 no-scrollbar">
        <div className="flex items-start gap-3 min-w-[1040px] w-full h-full pb-2">
          {PIPELINE_COLUMNS.map((col) => {
            const colAssets = assetsByColumn[col.id] || [];
            const isDropTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex-1 min-w-[195px] flex flex-col rounded-2xl bg-[#121620] border transition-all ${
                  isDropTarget
                    ? 'border-[#00E599] bg-[#181E2C] ring-2 ring-[#00E599]/20'
                    : 'border-white/[0.07]'
                } max-h-[calc(100vh-260px)]`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/[0.07] bg-[#121620] rounded-t-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#00E599] px-2 py-0.5 rounded-md bg-[#00E599]/10 border border-[#00E599]/30 font-semibold">
                      {col.badge}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#181E2C] text-white border border-white/[0.07] tabular-nums">
                      {colAssets.length}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[#FFFFFF] tracking-tight">
                    {col.title}
                  </h2>
                  <p className="text-[11px] text-[#8F9CAE] line-clamp-1 mt-0.5">
                    {col.description}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[160px]">
                  {colAssets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8F9CAE] border border-dashed border-white/10 rounded-xl my-2">
                      <span className="text-xs">No assets in this stage</span>
                      <span className="text-[10px] text-[#8F9CAE]/60 mt-1">Drag an asset here to advance</span>
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

      {/* Phase 5: Syndication Archive & Feedback Loop (Bottom Bar) */}
      <div
        onDragOver={(e) => handleDragOver(e, 'PUBLISHED')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'PUBLISHED')}
        className={`border-t transition-colors px-4 lg:px-6 py-2.5 ${
          dragOverColumn === 'PUBLISHED'
            ? 'border-[#00E599] bg-[#00E599]/10'
            : 'border-white/[0.08] bg-[#121620]'
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-2 text-xs font-semibold text-[#FFFFFF] hover:text-[#00E599] transition-colors cursor-pointer"
          >
            <Archive className="h-4 w-4 text-[#00E599]" />
            <span>Published Deliverables Archive ({assetsByColumn.PUBLISHED.length})</span>
            {showArchive ? <ChevronDown className="h-3.5 w-3.5 text-[#8F9CAE]" /> : <ChevronUp className="h-3.5 w-3.5 text-[#8F9CAE]" />}
          </button>
          <span className="text-[11px] text-[#8F9CAE] hidden sm:inline">
            Click an archived asset to log post-launch 3s Retention & Reach metrics (&gt;65% triggers 🏆 WINNING FORMAT)
          </span>
        </div>

        {showArchive && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pt-1 pb-2">
            {assetsByColumn.PUBLISHED.map((asset) => {
              const isEditing = editingArchiveId === asset.id;
              const retention = asset.retentionRate3s ?? 0;
              const isWinner = retention > 65 || asset.isWinningFormat;

              return (
                <div
                  key={asset.id}
                  onClick={() => setEditingArchiveId(isEditing ? null : asset.id)}
                  className="bg-[#181E2C] hover:bg-[#1E2536] border border-white/[0.07] hover:border-[#00E599]/40 p-3.5 rounded-xl cursor-pointer flex flex-col gap-2.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#00E599] font-semibold uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Published
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isWinner && (
                        <span className="px-2 py-0.5 rounded-md bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/40 font-bold text-[10px]">
                          🏆 WINNING FORMAT
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(asset);
                        }}
                        className="text-[10px] text-[#8F9CAE] hover:text-white underline"
                      >
                        Open Studio
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-[#FFFFFF] line-clamp-1">
                    {asset.title}
                  </h4>

                  {/* Post-launch Metrics Inputs (3-Second Retention Rate & Reach/Impressions) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.07]"
                  >
                    <div>
                      <label className="block text-[10px] text-[#8F9CAE] mb-1">
                        3-Second Retention Rate (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        aria-label={`3-Second Retention Rate for ${asset.title}`}
                        value={asset.retentionRate3s ?? ''}
                        placeholder="e.g. 72"
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          handleUpdateArchiveMetrics(asset, val, asset.reachImpressions || '');
                        }}
                        className="w-full bg-[#121620] border border-white/10 focus:border-[#00E599] rounded-md px-2 py-1 text-xs font-mono text-white tabular-nums focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8F9CAE] mb-1">
                        Reach / Impressions
                      </label>
                      <input
                        type="text"
                        aria-label={`Reach Impressions for ${asset.title}`}
                        value={asset.reachImpressions ?? ''}
                        placeholder="e.g. 145,000"
                        onChange={(e) => {
                          handleUpdateArchiveMetrics(asset, asset.retentionRate3s ?? null, e.target.value);
                        }}
                        className="w-full bg-[#121620] border border-white/10 focus:border-[#00E599] rounded-md px-2 py-1 text-xs font-mono text-white tabular-nums focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* If Retention > 65%: Show [Send to Paid Growth / Ads] */}
                  {isWinner && (
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#00E599] font-mono">
                        Retention {retention > 0 ? `${retention}%` : '>65%'} benchmark cleared
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleSendToPaidAds(asset, e)}
                        disabled={asset.sentToPaidAds}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          asset.sentToPaidAds
                            ? 'bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40'
                            : 'bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88]'
                        }`}
                      >
                        <Send className="h-3 w-3" />
                        <span>{asset.sentToPaidAds ? 'Sent to Paid Growth ✓' : 'Send to Paid Growth / Ads'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
