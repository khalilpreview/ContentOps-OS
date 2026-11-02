import React from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Scale, 
  Sparkles, 
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { ContentAsset, PillarType } from '../../types';

interface PillarScopeViewProps {
  assets: ContentAsset[];
  onOpenAssetDetail: (asset: ContentAsset) => void;
}

interface PillarTargetConfig {
  id: PillarType;
  label: string;
  targetPercent: number;
  description: string;
  color: string;
}

const PILLAR_TARGETS: PillarTargetConfig[] = [
  {
    id: 'STRATEGY_SERIES',
    label: 'Pillar 1: Strategy & Hero Formats',
    targetPercent: 20,
    description: 'Executive messaging, flagship keynotes & episodic series briefs',
    color: '#38BDF8' // Sky
  },
  {
    id: 'CONTENT_OPS',
    label: 'Pillar 2: ContentOps & Pipeline Velocity',
    targetPercent: 30,
    description: 'Sprint cadence, turnaround speed & asset multiplication',
    color: '#00E599' // Neon Emerald
  },
  {
    id: 'CROSS_FUNCTIONAL',
    label: 'Pillar 3: Cross-Functional Orchestration',
    targetPercent: 25,
    description: 'GTM product launches, event collateral & creator alignment',
    color: '#818CF8' // Indigo
  },
  {
    id: 'BRAND_QA',
    label: 'Pillar 4: Brand Guardianship & QA Veto',
    targetPercent: 10,
    description: 'Visual standards, rights clearance & editorial integrity',
    color: '#C084FC' // Purple
  },
  {
    id: 'INTELLIGENCE_OPTIMIZATION',
    label: 'Pillar 5: Intelligence & Feedback',
    targetPercent: 15,
    description: '3-second hook retention, post-launch feedback & paid ads',
    color: '#F5A524' // Gold
  }
];

export const PillarScopeView: React.FC<PillarScopeViewProps> = ({
  assets,
  onOpenAssetDetail
}) => {
  const totalAssets = assets.length || 1;

  // Calculate live distribution count & actual percentages
  const pillarStats = PILLAR_TARGETS.map((pillar) => {
    const matchedCount = assets.filter((a) => a.pillar === pillar.id).length;
    const actualPercent = Math.round((matchedCount / totalAssets) * 100);
    const variance = actualPercent - pillar.targetPercent;
    const isOverAllocated = variance > 5;
    const isUnderAllocated = variance < -5;
    const isBalanced = !isOverAllocated && !isUnderAllocated;

    return {
      ...pillar,
      count: matchedCount,
      actualPercent,
      variance,
      isOverAllocated,
      isUnderAllocated,
      isBalanced
    };
  });

  // Check overall system health
  const bottleneckPillar = pillarStats.find((p) => p.isOverAllocated);
  const neglectedPillar = pillarStats.find((p) => p.isUnderAllocated);

  // Radial Ring system measurements
  const centerCoord = 200;
  const ringBaseRadius = 55;
  const ringStep = 24;

  return (
    <div className="relative w-full rounded-2xl bg-[#121620] border border-white/[0.08] p-5 lg:p-6 shadow-2xl overflow-hidden">
      {/* Background ambient radial atmosphere */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 60%, rgba(0, 229, 153, 0.06) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(245, 165, 36, 0.05) 0%, transparent 50%)
          `
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 flex items-center justify-center">
            <Scale className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Strategic Pillar & Scope Allocation Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00E599]/15 border border-[#00E599]/30 text-[10px] font-mono font-bold text-[#00E599]">
                MASTER SOW DISCIPLINE
              </span>
            </div>
            <p className="text-xs text-[#8F9CAE]">
              Monitors sprint bandwidth to ensure repeatable formats and intelligence are not neglected for ad-hoc firefighting
            </p>
          </div>
        </div>

        {/* System Alert Sentinel */}
        <div className="flex items-center gap-2">
          {bottleneckPillar ? (
            <div className="px-3 py-1.5 rounded-lg bg-[#F5A524]/15 border border-[#F5A524]/40 text-[#F5A524] text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Scope Alert: {bottleneckPillar.label.split(':')[1]} (+{bottleneckPillar.variance}%)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-[#00E599]/15 border border-[#00E599]/40 text-[#00E599] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Pillar Scope: Balanced within SOW Target (±5%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Radial Concentric Rings vs Progress Allocation */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-6">
        
        {/* Left: Interactive Radial Multi-Ring SVG System (Cols 5) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full transform -rotate-90 select-none overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Concentric Base Tracks & Animated Actual Arc Offsets */}
              {pillarStats.map((pillar, idx) => {
                const radius = ringBaseRadius + idx * ringStep;
                const circumference = 2 * Math.PI * radius;
                // Target stroke offset
                const targetStrokeDasharray = `${(pillar.targetPercent / 100) * circumference} ${circumference}`;
                // Actual stroke offset
                const actualStrokeDasharray = `${(Math.min(100, pillar.actualPercent) / 100) * circumference} ${circumference}`;

                return (
                  <g key={`ring-${pillar.id}`}>
                    {/* Background Full Track */}
                    <circle
                      cx={centerCoord}
                      cy={centerCoord}
                      r={radius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.04)"
                      strokeWidth="11"
                    />

                    {/* SOW Target Ghost Marker */}
                    <circle
                      cx={centerCoord}
                      cy={centerCoord}
                      r={radius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth="11"
                      strokeDasharray={targetStrokeDasharray}
                      strokeLinecap="round"
                    />

                    {/* Live Actual Allocation Arc with motion */}
                    <motion.circle
                      cx={centerCoord}
                      cy={centerCoord}
                      r={radius}
                      fill="none"
                      stroke={pillar.color}
                      strokeWidth="11"
                      strokeDasharray={actualStrokeDasharray}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: `0 ${circumference}` }}
                      animate={{ strokeDasharray: actualStrokeDasharray }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.15 }}
                      filter={pillar.isOverAllocated ? `drop-shadow(0 0 4px ${pillar.color})` : undefined}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Center Core Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#8F9CAE]">
                TOTAL CAPACITY
              </span>
              <span className="text-2xl font-bold font-mono text-white mt-0.5">
                {assets.length}
              </span>
              <span className="text-[10px] text-[#00E599] font-medium">
                Active Deliverables
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#8F9CAE] mt-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span>Target SOW</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00E599]" />
              <span>Actual Capacity</span>
            </span>
          </div>
        </div>

        {/* Right: Detailed Pillar Split Breakdown (Cols 7) */}
        <div className="lg:col-span-7 space-y-3.5">
          {pillarStats.map((pillar) => {
            return (
              <div
                key={pillar.id}
                className="p-3.5 rounded-xl bg-[#181E2C] border border-white/[0.07] hover:border-white/20 transition-all shadow-sm"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: pillar.color }} 
                    />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {pillar.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[#8F9CAE]">
                      Target: <strong className="text-white">{pillar.targetPercent}%</strong>
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-[#8F9CAE]">
                      Actual: <strong style={{ color: pillar.color }}>{pillar.actualPercent}%</strong>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/80 font-bold">
                      {pillar.count} {pillar.count === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Comparing Actual vs Target */}
                <div className="space-y-1">
                  <div className="relative w-full h-2 rounded-full bg-[#121620] overflow-hidden">
                    {/* Actual Fill */}
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, pillar.actualPercent)}%`,
                        backgroundColor: pillar.color
                      }}
                    />
                    {/* Target Vertical Notch Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm z-10"
                      style={{ left: `${pillar.targetPercent}%` }}
                      title={`Target: ${pillar.targetPercent}%`}
                    />
                  </div>
                </div>

                {/* Scope Variance Description */}
                <div className="flex items-center justify-between text-[11px] text-[#8F9CAE] mt-2">
                  <span className="truncate pr-2">{pillar.description}</span>
                  <div className="shrink-0 font-mono text-[10px]">
                    {pillar.isOverAllocated ? (
                      <span className="text-[#F5A524] font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>+{pillar.variance}% Over SOW</span>
                      </span>
                    ) : pillar.isUnderAllocated ? (
                      <span className="text-[#38BDF8] font-semibold">
                        {pillar.variance}% Under SOW
                      </span>
                    ) : (
                      <span className="text-[#00E599] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Aligned (±{Math.abs(pillar.variance)}%)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer System Advice */}
      <div className="relative z-10 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8F9CAE]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#00E599]" />
          <span>Automated SOW Governance: Evaluates portfolio equilibrium to avoid content fatigue.</span>
        </div>
        <span className="font-mono text-[11px] text-[#00E599]">SCOPE INTEGRITY: VERIFIED</span>
      </div>
    </div>
  );
};
