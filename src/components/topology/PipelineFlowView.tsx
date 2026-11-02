import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  FileText, 
  Clock, 
  Wrench, 
  CheckSquare, 
  Send, 
  TrendingUp, 
  AlertTriangle, 
  AlertOctagon, 
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import { ContentAsset, AssetStatus, User } from '../../types';
import { calculateSla } from '../../lib/sla';

interface PipelineFlowViewProps {
  assets: ContentAsset[];
  currentUser: User;
  onOpenAssetDetail: (asset: ContentAsset) => void;
}

interface StageNodeConfig {
  id: AssetStatus | 'INTELLIGENCE';
  stepNumber: number;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  raciAccountable: string;
}

const STAGE_NODES: StageNodeConfig[] = [
  {
    id: 'DRAFT_BRIEF',
    stepNumber: 1,
    label: 'Strategy & Brief',
    subtitle: 'Intake & Angle Definition',
    icon: FileText,
    x: 80,
    y: 190,
    raciAccountable: 'Content Manager (A)'
  },
  {
    id: 'SLA_REVIEW',
    stepNumber: 2,
    label: 'SLA Gateway',
    subtitle: '48h Turnaround Gate',
    icon: Clock,
    x: 270,
    y: 190,
    raciAccountable: 'Stakeholder / CM (A)'
  },
  {
    id: 'IN_PRODUCTION',
    stepNumber: 3,
    label: 'Production Studio',
    subtitle: 'Creative Execution & Edit',
    icon: Wrench,
    x: 460,
    y: 190,
    raciAccountable: 'Specialists (R)'
  },
  {
    id: 'QA_GATE',
    stepNumber: 4,
    label: 'QA Gatekeeper',
    subtitle: '4-Point Mandatory Veto',
    icon: CheckSquare,
    x: 650,
    y: 190,
    raciAccountable: 'Content Manager (A)'
  },
  {
    id: 'READY_TO_PUBLISH',
    stepNumber: 5,
    label: 'Distribution Pipeline',
    subtitle: 'Omnichannel Syndication',
    icon: Send,
    x: 840,
    y: 190,
    raciAccountable: 'Distribution Lead (A)'
  },
  {
    id: 'INTELLIGENCE',
    stepNumber: 6,
    label: 'Intelligence & Feedback',
    subtitle: 'Retention & Paid Amplification',
    icon: TrendingUp,
    x: 1030,
    y: 190,
    raciAccountable: 'Content Manager (A)'
  }
];

export const PipelineFlowView: React.FC<PipelineFlowViewProps> = ({
  assets,
  onOpenAssetDetail
}) => {
  const [selectedStage, setSelectedStage] = useState<AssetStatus | 'INTELLIGENCE' | null>(null);

  // Group assets by stage
  const stageAssets: Record<AssetStatus | 'INTELLIGENCE', ContentAsset[]> = {
    DRAFT_BRIEF: assets.filter((a) => a.status === 'DRAFT_BRIEF'),
    SLA_REVIEW: assets.filter((a) => a.status === 'SLA_REVIEW'),
    IN_PRODUCTION: assets.filter((a) => a.status === 'IN_PRODUCTION'),
    QA_GATE: assets.filter((a) => a.status === 'QA_GATE'),
    READY_TO_PUBLISH: assets.filter((a) => a.status === 'READY_TO_PUBLISH'),
    PUBLISHED: assets.filter((a) => a.status === 'PUBLISHED'),
    INTELLIGENCE: assets.filter((a) => a.status === 'PUBLISHED' || a.isWinningFormat || a.sentToPaidAds)
  };

  // Evaluate SLA Gateway health (Stage 2)
  const slaAssets = stageAssets.SLA_REVIEW;
  const breachedSlaCount = slaAssets.filter((a) => calculateSla(a).isBreached).length;
  const warningSlaCount = slaAssets.filter((a) => {
    const sla = calculateSla(a);
    return !sla.isBreached && sla.hoursRemaining <= 12;
  }).length;

  const isSlaBreached = breachedSlaCount > 0;
  const isSlaWarning = warningSlaCount > 0 && !isSlaBreached;

  // Active drawer assets
  const activeDrawerAssets = selectedStage ? stageAssets[selectedStage] || [] : [];
  const selectedConfig = STAGE_NODES.find((n) => n.id === selectedStage);

  // SVG dimensions
  const svgWidth = 1120;
  const svgHeight = 380;

  return (
    <div className="relative w-full rounded-2xl bg-[#121620] border border-white/[0.08] p-5 lg:p-6 shadow-2xl overflow-hidden">
      {/* Background Subtle Coordinate Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 229, 153, 0.04) 0%, transparent 70%),
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px'
        }}
      />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Pipeline Flow & SLA Gateway Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00E599]/15 border border-[#00E599]/30 text-[10px] font-mono font-bold text-[#00E599]">
                LIVE STATE MACHINE
              </span>
            </div>
            <p className="text-xs text-[#8F9CAE]">
              6 deterministic stages with real-time vector particle telemetry and 48-hour SLA breach sentinels
            </p>
          </div>
        </div>

        {/* Real-time telemetry pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-[#181E2C] border border-white/[0.08] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00E599] animate-pulse" />
            <span className="text-[#8F9CAE]">IN-FLIGHT:</span>
            <span className="text-white font-bold">{assets.filter((a) => a.status !== 'PUBLISHED').length} Assets</span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
            isSlaBreached 
              ? 'bg-[#FF4B55]/15 border-[#FF4B55]/40 text-[#FF4B55]' 
              : isSlaWarning 
              ? 'bg-[#F5A524]/15 border-[#F5A524]/40 text-[#F5A524]' 
              : 'bg-[#181E2C] border-white/[0.08] text-[#8F9CAE]'
          }`}>
            {isSlaBreached ? (
              <>
                <AlertOctagon className="h-3.5 w-3.5 animate-bounce" />
                <span className="font-bold">SLA BREACH: {breachedSlaCount}</span>
              </>
            ) : isSlaWarning ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-bold">SLA RISK: {warningSlaCount}</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[#00E599]" />
                <span className="text-white">SLA GATE: ALL HEALTHY</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="relative z-10 w-full overflow-x-auto py-4">
        <div className="min-w-[1100px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 1. Connector Paths between Stages */}
            {STAGE_NODES.slice(0, -1).map((node, i) => {
              const nextNode = STAGE_NODES[i + 1];
              const pathD = `M ${node.x + 65} ${node.y} L ${nextNode.x - 65} ${nextNode.y}`;
              const isAmberPath = i === 1 && (isSlaWarning || isSlaBreached);
              const pathStroke = isSlaBreached && i === 1 
                ? '#FF4B55' 
                : isAmberPath 
                ? '#F5A524' 
                : 'rgba(255, 255, 255, 0.15)';

              return (
                <g key={`path-${node.id}-${nextNode.id}`}>
                  {/* Base Track */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={pathStroke}
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    opacity={0.6}
                  />

                  {/* Animated Glowing Energy Particles */}
                  <motion.circle
                    r="3.5"
                    fill={isSlaBreached && i === 1 ? '#FF4B55' : isAmberPath ? '#F5A524' : '#00E599'}
                    filter={`drop-shadow(0 0 6px ${
                      isSlaBreached && i === 1 ? '#FF4B55' : isAmberPath ? '#F5A524' : '#00E599'
                    })`}
                    animate={{
                      cx: [node.x + 65, nextNode.x - 65],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.35
                    }}
                    cy={node.y}
                  />

                  {/* Secondary offset particle for fluid feeling */}
                  <motion.circle
                    r="2.5"
                    fill="#FFFFFF"
                    animate={{
                      cx: [node.x + 65, nextNode.x - 65],
                      opacity: [0, 0.8, 0.8, 0]
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.35 + 1.1
                    }}
                    cy={node.y}
                  />

                  {/* Directional arrowhead */}
                  <polygon
                    points={`${nextNode.x - 67},${node.y - 4} ${nextNode.x - 61},${node.y} ${nextNode.x - 67},${node.y + 4}`}
                    fill={pathStroke}
                  />
                </g>
              );
            })}

            {/* 2. Feedback Rejection Loop: QA Gate -> Production (VETO Rejection Loop) */}
            <g>
              <path
                d={`M 650 250 C 650 310, 460 310, 460 250`}
                fill="none"
                stroke="#FF4B55"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                opacity="0.65"
              />
              {/* Traveling Veto particle */}
              <motion.circle
                r="3"
                fill="#FF4B55"
                filter="drop-shadow(0 0 6px #FF4B55)"
                animate={{
                  cx: [650, 555, 460],
                  cy: [250, 310, 250],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <text
                x="555"
                y="332"
                textAnchor="middle"
                fill="#FF4B55"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                4-POINT VETO / REVISION REJECT LOOP
              </text>
            </g>

            {/* 3. Feedback Loop: Intelligence -> Strategy Series (Winning Format Multiplier Loop) */}
            <g>
              <path
                d={`M 1030 130 C 1030 50, 80 50, 80 130`}
                fill="none"
                stroke="#00E599"
                strokeWidth="1.8"
                strokeDasharray="6 5"
                opacity="0.65"
              />
              <motion.circle
                r="3"
                fill="#00E599"
                filter="drop-shadow(0 0 6px #00E599)"
                animate={{
                  cx: [1030, 555, 80],
                  cy: [130, 50, 130],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <text
                x="555"
                y="38"
                textAnchor="middle"
                fill="#00E599"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                WINNING FORMAT RECYCLE &amp; ASSET MULTIPLIER (HERO → HUB/HYGIENE)
              </text>
            </g>

            {/* 4. Stage Nodes */}
            {STAGE_NODES.map((node) => {
              const count = stageAssets[node.id]?.length || 0;
              const isSlaNode = node.id === 'SLA_REVIEW';
              const isQaNode = node.id === 'QA_GATE';

              // Node dynamic colors
              let ringColor = 'rgba(255, 255, 255, 0.1)';
              let badgeColor = '#181E2C';
              let badgeTextColor = '#8F9CAE';
              let isPulse = false;

              if (isSlaNode) {
                if (isSlaBreached) {
                  ringColor = '#FF4B55';
                  badgeColor = '#FF4B55';
                  badgeTextColor = '#FFFFFF';
                  isPulse = true;
                } else if (isSlaWarning) {
                  ringColor = '#F5A524';
                  badgeColor = '#F5A524';
                  badgeTextColor = '#0B0E14';
                  isPulse = true;
                } else if (count > 0) {
                  ringColor = '#00E599';
                  badgeColor = '#00E599';
                  badgeTextColor = '#0B0E14';
                }
              } else if (count > 0) {
                ringColor = '#00E599';
                badgeColor = '#00E599';
                badgeTextColor = '#0B0E14';
              }

              const isSelected = selectedStage === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedStage(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Ambient pulse halo for alerts */}
                  {isPulse && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="58"
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="2"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="r"
                        values="50;64;50"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Outer Container Card in SVG */}
                  <rect
                    x={node.x - 62}
                    y={node.y - 50}
                    width="124"
                    height="100"
                    rx="16"
                    fill="#181E2C"
                    stroke={isSelected ? '#FFFFFF' : ringColor}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all duration-200 group-hover:brightness-110"
                    filter="drop-shadow(0 6px 14px rgba(0,0,0,0.5))"
                  />

                  {/* Step Tag */}
                  <rect
                    x={node.x - 52}
                    y={node.y - 42}
                    width="32"
                    height="16"
                    rx="4"
                    fill="rgba(255, 255, 255, 0.06)"
                  />
                  <text
                    x={node.x - 36}
                    y={node.y - 30}
                    textAnchor="middle"
                    fill="#8F9CAE"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    0{node.stepNumber}
                  </text>

                  {/* Stage Active Count Badge */}
                  <rect
                    x={node.x + 18}
                    y={node.y - 42}
                    width="34"
                    height="16"
                    rx="8"
                    fill={badgeColor}
                  />
                  <text
                    x={node.x + 35}
                    y={node.y - 30}
                    textAnchor="middle"
                    fill={badgeTextColor}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {count} {count === 1 ? 'item' : 'items'}
                  </text>

                  {/* Stage Label */}
                  <text
                    x={node.x}
                    y={node.y - 6}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>

                  {/* Subtitle */}
                  <text
                    x={node.x}
                    y={node.y + 10}
                    textAnchor="middle"
                    fill="#8F9CAE"
                    fontSize="8.5"
                    fontFamily="sans-serif"
                  >
                    {node.subtitle}
                  </text>

                  {/* RACI Indicator Tag */}
                  <rect
                    x={node.x - 52}
                    y={node.y + 22}
                    width="104"
                    height="18"
                    rx="4"
                    fill="rgba(0, 0, 0, 0.35)"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="0.8"
                  />
                  <text
                    x={node.x}
                    y={node.y + 34}
                    textAnchor="middle"
                    fill={isQaNode ? '#00E599' : '#8F9CAE'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {node.raciAccountable}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 flex items-center justify-between pt-3 text-xs text-[#8F9CAE] border-t border-white/[0.06]">
        <span>Click any stage chamber to inspect live assets, deliverables, and SLA deadlines.</span>
        <span className="font-mono text-[11px] text-[#00E599]">RACI GATEKEEPING: ENFORCED</span>
      </div>

      {/* Slide-over Drawer for Selected Stage */}
      {selectedStage && selectedConfig && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121620] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#00E599]/15 text-[#00E599] font-mono text-[10px] font-bold">
                    STAGE 0{selectedConfig.stepNumber}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedConfig.label}</h3>
                </div>
                <p className="text-xs text-[#8F9CAE] mt-0.5">{selectedConfig.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stage Info Bar */}
            <div className="px-5 py-3 bg-[#181E2C] border-b border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-[#8F9CAE]">Accountability:</span>
              <span className="font-mono text-white font-semibold">{selectedConfig.raciAccountable}</span>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8F9CAE] mb-1">
                <span>ACTIVE ASSETS ({activeDrawerAssets.length})</span>
                <span className="font-mono">STATUS: {selectedStage}</span>
              </div>

              {activeDrawerAssets.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#181E2C]/50 border border-white/5 text-[#8F9CAE] text-xs">
                  No assets currently sitting in this stage chamber.
                </div>
              ) : (
                activeDrawerAssets.map((asset) => {
                  const sla = calculateSla(asset);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        onOpenAssetDetail(asset);
                        setSelectedStage(null);
                      }}
                      className="group p-3.5 rounded-xl bg-[#181E2C] border border-white/[0.08] hover:border-[#00E599]/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-[#00E599] transition-colors line-clamp-1">
                          {asset.title}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#8F9CAE] group-hover:text-[#00E599] shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#8F9CAE] font-mono">
                          {asset.formatTier}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#8F9CAE]">
                          {asset.pillar}
                        </span>
                        {asset.status === 'SLA_REVIEW' && (
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                            sla.isBreached 
                              ? 'bg-[#FF4B55]/20 text-[#FF4B55]' 
                              : sla.hoursRemaining <= 12 
                              ? 'bg-[#F5A524]/20 text-[#F5A524]' 
                              : 'bg-[#00E599]/20 text-[#00E599]'
                          }`}>
                            SLA: {sla.hoursRemaining}h
                          </span>
                        )}
                        {asset.qaGatekeeperSigned && (
                          <span className="px-1.5 py-0.5 rounded bg-[#00E599]/20 text-[#00E599] font-mono">
                            QA SIGNED
                          </span>
                        )}
                      </div>

                      {asset.deliverableUrl && (
                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1 text-[11px] text-[#00E599]">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{asset.deliverableUrl}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#181E2C] border-t border-white/10 text-xs text-[#8F9CAE] flex items-center justify-between">
              <span>Thrill State Engine v2.4</span>
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
