import React, { useState } from 'react';
import { 
  Layers, 
  Clock, 
  ShieldCheck, 
  GitFork, 
  Archive, 
  Sparkles,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Zap,
  AlertTriangle,
  TrendingUp,
  Crown
} from 'lucide-react';
import { ContentAsset, QuickFilterType, User } from '../types';
import { isNeedsMySignOffAsset, isSlaRiskAsset, calculateSla } from '../lib/sla';

interface SidebarProps {
  currentView: 'pipeline' | 'sla' | 'multiplier' | 'archive' | 'dashboard' | 'admin' | 'topology';
  onChangeView: (view: 'pipeline' | 'sla' | 'multiplier' | 'archive' | 'dashboard' | 'admin' | 'topology') => void;
  quickFilter: QuickFilterType;
  onChangeQuickFilter: (filter: QuickFilterType) => void;
  assets: ContentAsset[];
  currentUser: User;
  onOpenNewAsset: () => void;
  onOpenMultiplier: () => void;
  defaultCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  quickFilter,
  onChangeQuickFilter,
  assets,
  currentUser,
  onOpenNewAsset,
  onOpenMultiplier,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('contentops_sidebar_collapsed');
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // ignore
    }
    return defaultCollapsed;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('contentops_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const activeSlaCount = assets.filter((a) => a.status === 'SLA_REVIEW').length;
  const qaUnsignedCount = assets.filter((a) => a.status === 'QA_GATE' && !a.qaGatekeeperSigned).length;
  const needsMySignOffCount = assets.filter((a) => isNeedsMySignOffAsset(a, currentUser)).length;
  const slaRiskCount = assets.filter((a) => isSlaRiskAsset(a)).length;
  const breachedCount = assets.filter((a) => a.status === 'SLA_REVIEW' && calculateSla(a).isBreached).length;
  const publishedCount = assets.filter((a) => a.status === 'PUBLISHED').length;
  const inFlightCount = assets.filter((a) => a.status !== 'PUBLISHED').length;

  const navItems = [
    {
      id: 'pipeline' as const,
      label: 'Pipeline Kanban',
      icon: Layers,
      count: inFlightCount,
      badgeColor: 'bg-[#181E2C] text-[#8F9CAE] border border-white/5',
      isActive: currentView === 'pipeline' && quickFilter === 'NONE',
      onClick: () => {
        onChangeQuickFilter('NONE');
        onChangeView('pipeline');
      }
    },
    {
      id: 'topology' as const,
      label: 'Live System Topology',
      icon: Zap,
      badgeText: 'FLOW',
      badgeColor: 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30',
      isActive: currentView === 'topology',
      onClick: () => {
        onChangeQuickFilter('NONE');
        onChangeView('topology');
      }
    },
    {
      id: 'sla' as const,
      label: 'SLA Turnaround',
      icon: Clock,
      count: activeSlaCount,
      hasAlert: activeSlaCount > 0,
      badgeColor: 'bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/30',
      isActive: currentView === 'sla' && quickFilter === 'NONE',
      onClick: () => {
        onChangeQuickFilter('NONE');
        onChangeView('sla');
      }
    },
    {
      id: 'multiplier' as const,
      label: 'Asset Multiplier',
      icon: GitFork,
      badgeText: 'HERO',
      badgeColor: 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30',
      isActive: currentView === 'multiplier',
      onClick: onOpenMultiplier
    },
    {
      id: 'dashboard' as const,
      label: 'Velocity & SLA Dashboard',
      icon: TrendingUp,
      badgeText: '30D',
      badgeColor: 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30',
      isActive: currentView === 'dashboard',
      onClick: () => {
        onChangeQuickFilter('NONE');
        onChangeView('dashboard');
      }
    },
    {
      id: 'archive' as const,
      label: 'Published Archive',
      icon: Archive,
      count: publishedCount,
      badgeColor: 'bg-[#181E2C] text-[#8F9CAE] border border-white/5',
      isActive: currentView === 'archive',
      onClick: () => {
        onChangeQuickFilter('NONE');
        onChangeView('archive');
      }
    },
    ...(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'CONTENT_MANAGER' ? [{
      id: 'admin' as const,
      label: 'Super Admin & Team',
      icon: Crown,
      badgeText: 'RACI',
      badgeColor: 'bg-[#FF4B55]/15 text-[#FF4B55] border border-[#FF4B55]/30',
      isActive: currentView === 'admin',
      onClick: () => {
        onChangeQuickFilter('NONE');
        onChangeView('admin');
      }
    }] : [])
  ];

  return (
    <aside 
      className={`bg-[#121620] border-r border-white/[0.07] flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out hidden md:flex ${
        isCollapsed ? 'w-[74px] p-2.5' : 'w-64 p-3.5'
      }`}
    >
      {/* Top Section */}
      <div className="space-y-4">
        {/* Header with Thrill Dock & Collapse Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2.5 items-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-1.5 p-1 bg-[#181E2C] border border-white/[0.07] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  onChangeQuickFilter('NONE');
                  onChangeView('pipeline');
                }}
                className="h-8 w-8 rounded-lg bg-[#00E599] text-[#0B0E14] flex items-center justify-center font-bold shadow-sm cursor-pointer hover:bg-[#00cc88] transition-all"
                title="Active Production Pipeline"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeQuickFilter('NONE');
                  onChangeView('sla');
                }}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  currentView === 'sla' 
                    ? 'bg-[#1E2536] text-[#00E599]' 
                    : 'text-[#8F9CAE] hover:text-white hover:bg-[#1E2536]'
                }`}
                title="SLA Turnaround Radar"
              >
                <Clock className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onOpenMultiplier}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  currentView === 'multiplier' 
                    ? 'bg-[#1E2536] text-[#00E599]' 
                    : 'text-[#8F9CAE] hover:text-white hover:bg-[#1E2536]'
                }`}
                title="Asset Multiplier"
              >
                <GitFork className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onChangeQuickFilter('NONE');
                onChangeView('pipeline');
              }}
              className="h-10 w-10 rounded-lg bg-[#00E599] text-[#0B0E14] flex items-center justify-center font-bold shadow-sm cursor-pointer hover:bg-[#00cc88] transition-all"
              title="Active Production Pipeline"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          )}

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#181E2C] border border-white/[0.07] text-[#8F9CAE] hover:text-white hover:border-[#00E599]/40 hover:bg-[#1E2536] transition-colors cursor-pointer group relative"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-[#00E599]" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}

            {isCollapsed && (
              <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#181E2C] border border-white/10 text-white text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Expand Sidebar
              </div>
            )}
          </button>
        </div>

        {/* Section: OPERATIONS + Quick Filters */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2.5 py-1">
              <span className="text-xs font-medium text-slate-400">
                Operations
              </span>
              <span className="text-[10px] text-[#8F9CAE] font-mono tabular-nums">
                {assets.length} total
              </span>
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={item.onClick}
                      className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative ${
                        isActive
                          ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                          : 'text-[#8F9CAE] hover:text-white hover:bg-[#181E2C]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#00E599]' : ''}`} />
                      {item.hasAlert && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5A524] ring-2 ring-[#121620]" />
                      )}
                    </button>

                    <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#181E2C] border border-white/10 rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs font-semibold text-white">{item.label}</span>
                      {typeof item.count === 'number' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0B0E14] text-white tabular-nums">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer relative ${
                    isActive
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 font-semibold'
                      : 'text-[#8F9CAE] hover:text-white hover:bg-[#181E2C] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#00E599]' : 'text-[#8F9CAE]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {typeof item.count === 'number' && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md tabular-nums ${item.badgeColor}`}>
                        {item.count}
                      </span>
                    )}
                    {item.badgeText && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                        {item.badgeText}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Two Quick Filters under OPERATIONS: "⚡ Needs My Sign-off" and "⚠️ SLA Risk" */}
            {!isCollapsed ? (
              <div className="pt-2 space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    onChangeQuickFilter(quickFilter === 'NEEDS_MY_SIGNOFF' ? 'NONE' : 'NEEDS_MY_SIGNOFF')
                  }
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    quickFilter === 'NEEDS_MY_SIGNOFF'
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 font-semibold'
                      : 'bg-[#181E2C]/60 text-[#8F9CAE] hover:text-white hover:bg-[#181E2C] border border-white/5'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <span>⚡ Needs My Sign-off</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0B0E14] text-white border border-white/10 tabular-nums">
                    {needsMySignOffCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeQuickFilter(quickFilter === 'SLA_RISK' ? 'NONE' : 'SLA_RISK')
                  }
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    quickFilter === 'SLA_RISK'
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 font-semibold'
                      : 'bg-[#181E2C]/60 text-[#8F9CAE] hover:text-white hover:bg-[#181E2C] border border-white/5'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <span>⚠️ SLA Risk</span>
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums ${
                    slaRiskCount > 0
                      ? 'bg-[#FF4B55]/20 text-[#FF4B55] border border-[#FF4B55]/40 font-bold'
                      : 'bg-[#0B0E14] text-[#8F9CAE]'
                  }`}>
                    {slaRiskCount}
                  </span>
                </button>
              </div>
            ) : (
              <div className="pt-1 space-y-1 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() =>
                    onChangeQuickFilter(quickFilter === 'NEEDS_MY_SIGNOFF' ? 'NONE' : 'NEEDS_MY_SIGNOFF')
                  }
                  title="⚡ Needs My Sign-off"
                  className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    quickFilter === 'NEEDS_MY_SIGNOFF'
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                      : 'text-[#8F9CAE] hover:text-white hover:bg-[#181E2C]'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeQuickFilter(quickFilter === 'SLA_RISK' ? 'NONE' : 'SLA_RISK')
                  }
                  title="⚠️ SLA Risk"
                  className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    quickFilter === 'SLA_RISK'
                      ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                      : 'text-[#F5A524] hover:text-white hover:bg-[#181E2C]'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Section: RACI Governance & Breach Counter */}
        <div>
          {!isCollapsed ? (
            <div className="pt-3 border-t border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-slate-400">
                  Governance: Approval Lock Active
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
              </div>

              <div className="p-3 rounded-xl bg-[#181E2C] border border-white/[0.07] space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8F9CAE] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#00E599]" />
                    <span>Needs Review:</span>
                  </span>
                  <span className="text-white font-mono font-semibold tabular-nums">
                    {qaUnsignedCount} {qaUnsignedCount === 1 ? 'asset' : 'assets'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8F9CAE]">QA Gate VETO Breaches:</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] tabular-nums ${
                    breachedCount > 0
                      ? 'bg-[#FF4B55]/15 text-[#FF4B55] border border-[#FF4B55]/40'
                      : 'bg-[#00E599]/15 text-[#00E599]'
                  }`}>
                    {breachedCount} {breachedCount === 1 ? 'breach' : 'breaches'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8F9CAE]">Turnaround SLA:</span>
                  <span className="text-[#F5A524] font-mono font-medium tabular-nums">48h Window</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/[0.07] flex justify-center group relative">
              <div className="h-10 w-10 rounded-lg bg-[#181E2C] border border-white/[0.07] flex items-center justify-center text-[#00E599] cursor-help">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#181E2C] border border-white/10 rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                  Governance: Approval Lock Active
                </div>
                <div className="text-[10px] text-[#8F9CAE] mt-1 font-mono tabular-nums">
                  Needs Review: {qaUnsignedCount} {qaUnsignedCount === 1 ? 'asset' : 'assets'} • {breachedCount} SLA Breach
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: AI Engine Status */}
      <div className="pt-3 border-t border-white/[0.07]">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-[#181E2C] border border-white/[0.07] flex items-center gap-2.5 text-xs">
            <div className="h-7 w-7 rounded-lg bg-[#00E599]/15 text-[#00E599] flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-white truncate">
                IFM.ai K2 Horizon
              </div>
              <div className="text-[10px] text-[#00E599] truncate font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                <span>Auto-Brief & Multiplier Ready</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center group relative">
            <div className="h-10 w-10 rounded-lg bg-[#181E2C] border border-white/[0.07] flex items-center justify-center text-[#00E599] relative">
              <Sparkles className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#00E599]" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
