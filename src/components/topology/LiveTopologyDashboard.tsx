import React, { useState } from 'react';
import { 
  GitCommit, 
  Share2, 
  ShieldCheck, 
  Scale, 
  ArrowLeft, 
  Sparkles,
  LayoutGrid,
  Zap,
  Activity
} from 'lucide-react';
import { ContentAsset, User } from '../../types';
import { PipelineFlowView } from './PipelineFlowView';
import { HubSpokeView } from './HubSpokeView';
import { RaciConduitView } from './RaciConduitView';
import { PillarScopeView } from './PillarScopeView';

interface LiveTopologyDashboardProps {
  assets: ContentAsset[];
  currentUser: User;
  onNavigateToKanban: () => void;
  onOpenAssetDetail: (asset: ContentAsset) => void;
  onOpenNewAsset?: () => void;
}

export type TopologyLens = 
  | 'PIPELINE_FLOW'
  | 'HUB_SPOKE'
  | 'RACI_CONDUIT'
  | 'PILLAR_SCOPE';

export const LiveTopologyDashboard: React.FC<LiveTopologyDashboardProps> = ({
  assets,
  currentUser,
  onNavigateToKanban,
  onOpenAssetDetail,
  onOpenNewAsset
}) => {
  const [activeLens, setActiveLens] = useState<TopologyLens>('PIPELINE_FLOW');

  const lenses: Array<{
    id: TopologyLens;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }> = [
    {
      id: 'PIPELINE_FLOW',
      label: 'Pipeline Flow & SLA Gateway',
      shortLabel: '1. Pipeline & SLA Gateway',
      description: 'The 6-stage deterministic state machine with animated particle flow & 48h sentinels',
      icon: GitCommit,
      accentColor: '#00E599'
    },
    {
      id: 'HUB_SPOKE',
      label: 'Hub & Spoke Ecosystem',
      shortLabel: '2. Hub & Spoke Orchestration',
      description: 'Team & Creator orchestration with Content Manager Elena Vance as central conductor',
      icon: Share2,
      accentColor: '#38BDF8'
    },
    {
      id: 'RACI_CONDUIT',
      label: 'RACI Boundary Gatekeeper',
      shortLabel: '3. RACI Gatekeeper Matrix',
      description: 'Strict veto boundary enforcement separating who decides from who executes',
      icon: ShieldCheck,
      accentColor: '#C084FC'
    },
    {
      id: 'PILLAR_SCOPE',
      label: 'Pillar & Capacity Allocator',
      shortLabel: '4. Pillar & Scope Radar',
      description: 'Strategic scope weighting & Master SOW allocation radar preventing burnout',
      icon: Scale,
      accentColor: '#F5A524'
    }
  ];

  const activeLensMeta = lenses.find((l) => l.id === activeLens) || lenses[0];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E14] text-white overflow-y-auto select-none">
      <div className="px-4 lg:px-6 py-4 space-y-4 max-w-[1600px] mx-auto w-full">
        
        {/* Top Breadcrumb & Switcher Banner */}
        <div className="rounded-2xl bg-[#121620] border border-white/[0.08] p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={onNavigateToKanban}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#181E2C] hover:bg-[#202738] text-[#8F9CAE] hover:text-white border border-white/10 transition-colors cursor-pointer text-[11px] font-semibold"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Return to Kanban Board</span>
              </button>

              <span className="text-[#8F9CAE]">/</span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 font-semibold text-[11px]">
                <Zap className="h-3 w-3 text-[#00E599]" />
                <span>Thrill Live System Topology</span>
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="h-2 w-2 rounded-full bg-[#00E599] shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Live Animated Operational Engine
              </h1>
            </div>

            <p className="text-xs text-[#8F9CAE] max-w-2xl leading-relaxed">
              Real-time architectural diagrams powered by live PostgreSQL database state, SVG particle physics, and SLA compliance telemetry.
            </p>
          </div>

          {/* Quick Mode Toggle [ Kanban Board ] | [ ⚡ Live Topology Engine ] */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 rounded-xl bg-[#181E2C] border border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={onNavigateToKanban}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8F9CAE] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kanban Board</span>
              </button>

              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#00E599] text-[#0B0E14] shadow-md flex items-center gap-1.5 cursor-default"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Live Topology</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Bar: 4 Architectural Lenses */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {lenses.map((lens) => {
            const isActive = activeLens === lens.id;
            const Icon = lens.icon;

            return (
              <button
                key={lens.id}
                type="button"
                onClick={() => setActiveLens(lens.id)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
                  isActive
                    ? 'bg-[#181E2C] border-[#00E599] shadow-[0_0_20px_rgba(0,229,153,0.12)]'
                    : 'bg-[#121620] border-white/[0.07] hover:border-white/20 text-[#8F9CAE] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div 
                    className={`h-7 w-7 rounded-lg flex items-center justify-center border ${
                      isActive 
                        ? 'bg-[#00E599]/20 border-[#00E599]/50 text-[#00E599]' 
                        : 'bg-white/5 border-white/10 text-[#8F9CAE]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-[#00E599] animate-pulse" />
                  )}
                </div>

                <div>
                  <h3 className={`text-xs font-bold ${isActive ? 'text-white' : 'text-[#8F9CAE]'}`}>
                    {lens.shortLabel}
                  </h3>
                  <p className="text-[11px] text-[#8F9CAE]/80 mt-0.5 line-clamp-1">
                    {lens.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Architectural Lens Renderer */}
        <div className="transition-all duration-300">
          {activeLens === 'PIPELINE_FLOW' && (
            <PipelineFlowView
              assets={assets}
              currentUser={currentUser}
              onOpenAssetDetail={onOpenAssetDetail}
            />
          )}

          {activeLens === 'HUB_SPOKE' && (
            <HubSpokeView
              assets={assets}
              currentUser={currentUser}
              onOpenAssetDetail={onOpenAssetDetail}
            />
          )}

          {activeLens === 'RACI_CONDUIT' && (
            <RaciConduitView
              assets={assets}
              currentUser={currentUser}
              onOpenAssetDetail={onOpenAssetDetail}
            />
          )}

          {activeLens === 'PILLAR_SCOPE' && (
            <PillarScopeView
              assets={assets}
              onOpenAssetDetail={onOpenAssetDetail}
            />
          )}
        </div>

      </div>
    </div>
  );
};
