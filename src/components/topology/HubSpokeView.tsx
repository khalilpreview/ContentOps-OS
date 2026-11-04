import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Crown, 
  Palette, 
  Video, 
  FileEdit, 
  Users, 
  Share2, 
  MessageSquare, 
  Megaphone, 
  DollarSign, 
  Target, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { ContentAsset, User } from '../../types';

interface HubSpokeViewProps {
  assets: ContentAsset[];
  currentUser: User;
  allUsers?: User[];
  onOpenAssetDetail: (asset: ContentAsset) => void;
}

interface SpokePod {
  id: string;
  category: 'UPSTREAM' | 'EXECUTION' | 'DISTRIBUTION';
  label: string;
  roleDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  assetMatcher: (asset: ContentAsset) => boolean;
  accentColor: string;
}

export const HubSpokeView: React.FC<HubSpokeViewProps> = ({
  assets,
  currentUser,
  allUsers = [],
  onOpenAssetDetail
}) => {
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);

  // Dynamic Content Operations Lead resolution
  const cmUser = allUsers.find(
    (u) => u.role === 'CONTENT_MANAGER' || u.role === 'SUPER_ADMIN'
  ) || (currentUser.role === 'CONTENT_MANAGER' || currentUser.role === 'SUPER_ADMIN' ? currentUser : null);

  const conductorName = cmUser?.name || currentUser?.name || 'Content Operations Lead';
  const conductorRole = cmUser?.role === 'SUPER_ADMIN' 
    ? 'Super Admin • Operations Lead' 
    : 'Content Manager • System Gatekeeper';

  // Center Conductor Node coordinates
  const centerX = 500;
  const centerY = 310;

  // Spoke pods mapped radially around the central Content Manager
  const SPOKE_PODS: SpokePod[] = [
    // Upstream Pods (Top Left & Top Right)
    {
      id: 'okr_strategy',
      category: 'UPSTREAM',
      label: 'Executive & OKRs',
      roleDescription: 'Strategic alignment & macro KPI mandates',
      icon: Target,
      x: 280,
      y: 95,
      assetMatcher: (a) => a.formatTier === 'HERO' || a.pillar === 'STRATEGY_SERIES',
      accentColor: '#38BDF8' // Sky blue
    },
    {
      id: 'gtm_events',
      category: 'UPSTREAM',
      label: 'GTM & Product Launches',
      roleDescription: 'Campaign intake & event milestone timing',
      icon: Calendar,
      x: 720,
      y: 95,
      assetMatcher: (a) => a.pillar === 'CROSS_FUNCTIONAL' || a.priority === 'URGENT',
      accentColor: '#818CF8' // Indigo
    },

    // Execution Pods (Left & Lower-Left)
    {
      id: 'design_studio',
      category: 'EXECUTION',
      label: 'Design & Graphics Studio',
      roleDescription: 'Key art, carousel slices & thumbnails',
      icon: Palette,
      x: 130,
      y: 230,
      assetMatcher: (a) => a.formatTier === 'HYGIENE' || a.pillar === 'CONTENT_OPS',
      accentColor: '#C084FC' // Purple
    },
    {
      id: 'video_editors',
      category: 'EXECUTION',
      label: 'Video Editors Pod',
      roleDescription: 'High-retention reels, long-form & motion cuts',
      icon: Video,
      x: 120,
      y: 390,
      assetMatcher: (a) => a.formatTier === 'HERO' || a.formatTier === 'HUB' || a.status === 'IN_PRODUCTION',
      accentColor: '#F472B6' // Pink
    },
    {
      id: 'copywriting',
      category: 'EXECUTION',
      label: 'Copy & Hook Writers',
      roleDescription: 'Hook variations, scripts & thread engineering',
      icon: FileEdit,
      x: 230,
      y: 510,
      assetMatcher: (a) => Boolean(a.hookStrategy) || a.status === 'DRAFT_BRIEF',
      accentColor: '#34D399' // Emerald
    },
    {
      id: 'external_creators',
      category: 'EXECUTION',
      label: 'External Creators & Influencers',
      roleDescription: 'Guest series, UGC deliverables & rights clearing',
      icon: Users,
      x: 410,
      y: 535,
      assetMatcher: (a) => a.pillar === 'CROSS_FUNCTIONAL' || !a.qaRightsCleared,
      accentColor: '#FBBF24' // Amber
    },

    // Downstream Distribution Pods (Right & Lower-Right)
    {
      id: 'social_smm',
      category: 'DISTRIBUTION',
      label: 'Social & SMM Channels',
      roleDescription: 'Multi-platform organic syndication',
      icon: Share2,
      x: 870,
      y: 230,
      assetMatcher: (a) => a.status === 'READY_TO_PUBLISH' || a.status === 'PUBLISHED',
      accentColor: '#00E599' // Neon Emerald
    },
    {
      id: 'community',
      category: 'DISTRIBUTION',
      label: 'Community & Discord',
      roleDescription: 'Audience engagement, feedback capture & Q&A',
      icon: MessageSquare,
      x: 880,
      y: 390,
      assetMatcher: (a) => a.pillar === 'INTELLIGENCE_OPTIMIZATION',
      accentColor: '#2DD4BF' // Teal
    },
    {
      id: 'pr_comms',
      category: 'DISTRIBUTION',
      label: 'PR & Corporate Comms',
      roleDescription: 'External press, editorial wires & partners',
      icon: Megaphone,
      x: 770,
      y: 510,
      assetMatcher: (a) => a.formatTier === 'HERO' && a.status === 'PUBLISHED',
      accentColor: '#60A5FA' // Blue
    },
    {
      id: 'paid_ads',
      category: 'DISTRIBUTION',
      label: 'Paid Media & Growth Ads',
      roleDescription: 'Paid booster pipeline for verified winning formats',
      icon: DollarSign,
      x: 590,
      y: 535,
      assetMatcher: (a) => Boolean(a.paidEligible || a.sentToPaidAds || a.isWinningFormat),
      accentColor: '#F5A524' // Gold
    }
  ];

  // Detect winning format count for golden pulse streams
  const winningFormats = assets.filter((a) => a.isWinningFormat || a.sentToPaidAds);
  const activeVideoEdits = assets.filter((a) => a.status === 'IN_PRODUCTION');

  const selectedPod = SPOKE_PODS.find((p) => p.id === selectedPodId);
  const selectedPodAssets = selectedPod ? assets.filter(selectedPod.assetMatcher) : [];

  return (
    <div className="relative w-full rounded-2xl bg-[#121620] border border-white/[0.08] p-5 lg:p-6 shadow-2xl overflow-hidden">
      {/* Background ambient radial aura */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 229, 153, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 20% 80%, rgba(245, 165, 36, 0.05) 0%, transparent 50%)
          `
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 flex items-center justify-center">
            <Crown className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Hub & Spoke Ecosystem: The Content Conductor
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00E599]/15 border border-[#00E599]/30 text-[10px] font-mono font-bold text-[#00E599]">
                CENTRALIZED ORCHESTRATION
              </span>
            </div>
            <p className="text-xs text-[#8F9CAE]">
              Content Operations Lead ({conductorName}) sits at the nexus, connecting upstream strategic mandates with creative studio execution and syndication
            </p>
          </div>
        </div>

        {/* Real-time stats */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-[#181E2C] border border-white/[0.08] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00E599]" />
            <span className="text-[#8F9CAE]">EXECUTION PODS:</span>
            <span className="text-white font-bold">{activeVideoEdits.length} In-Production</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#181E2C] border border-[#F5A524]/30 flex items-center gap-2 text-[#F5A524]">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-bold">WINNING FORMATS: {winningFormats.length}</span>
          </div>
        </div>
      </div>

      {/* Radial Graph Canvas */}
      <div className="relative z-10 w-full overflow-x-auto py-2">
        <div className="min-w-[1000px] flex justify-center">
          <svg
            viewBox="0 0 1000 620"
            className="w-full max-w-[1000px] h-auto overflow-visible select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Radial aura glow for center conductor */}
              <radialGradient id="cmNexusAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00E599" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#00E599" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00E599" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Central Conduit Orbit Rings */}
            <circle
              cx={centerX}
              cy={centerY}
              r="220"
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="1"
              strokeDasharray="6 6"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r="340"
              fill="none"
              stroke="rgba(255, 255, 255, 0.02)"
              strokeWidth="1"
            />

            {/* Connecting Spoke Beziers & Energy Particles */}
            {SPOKE_PODS.map((pod) => {
              const matchedCount = assets.filter(pod.assetMatcher).length;
              const isVideoEditor = pod.id === 'video_editors';
              const isPaidAds = pod.id === 'paid_ads';
              const isSmm = pod.id === 'social_smm';

              // Determine particle flow speed & animation
              const hasHighActivity = matchedCount > 1;
              const hasWinningPulse = (isPaidAds || isSmm) && winningFormats.length > 0;

              // Curved bezier path from Center to Spoke
              const dx = pod.x - centerX;
              const dy = pod.y - centerY;
              const ctrlX = centerX + dx * 0.45 + (dy > 0 ? -15 : 15);
              const ctrlY = centerY + dy * 0.45 + (dx > 0 ? 15 : -15);
              const pathD = `M ${centerX} ${centerY} Q ${ctrlX} ${ctrlY} ${pod.x} ${pod.y}`;

              const strokeColor = hasWinningPulse 
                ? '#F5A524' 
                : hasHighActivity 
                ? '#00E599' 
                : 'rgba(255, 255, 255, 0.12)';

              return (
                <g key={`stream-${pod.id}`}>
                  {/* Energy Stream Track */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={hasHighActivity || hasWinningPulse ? '2' : '1.2'}
                    strokeDasharray={hasHighActivity ? '4 3' : '3 4'}
                    opacity={hasHighActivity || hasWinningPulse ? 0.75 : 0.35}
                  />

                  {/* Primary Particle moving along the stream */}
                  <motion.circle
                    r={hasWinningPulse ? '4' : '3'}
                    fill={hasWinningPulse ? '#F5A524' : '#00E599'}
                    filter={`drop-shadow(0 0 6px ${hasWinningPulse ? '#F5A524' : '#00E599'})`}
                    animate={{
                      cx: [centerX, ctrlX, pod.x],
                      cy: [centerY, ctrlY, pod.y],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: isVideoEditor && activeVideoEdits.length > 0 ? 1.6 : 3.0,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />

                  {/* High activity secondary particle */}
                  {hasHighActivity && (
                    <motion.circle
                      r="2"
                      fill="#FFFFFF"
                      animate={{
                        cx: [centerX, ctrlX, pod.x],
                        cy: [centerY, ctrlY, pod.y],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{
                        duration: isVideoEditor && activeVideoEdits.length > 0 ? 1.6 : 3.0,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.8
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* Central Conductor Node: Elena Vance (Content Manager) */}
            <g className="cursor-pointer" onClick={() => setSelectedPodId(null)}>
              {/* Outer Pulsing Halo */}
              <circle
                cx={centerX}
                cy={centerY}
                r="72"
                fill="url(#cmNexusAura)"
              />
              <circle
                cx={centerX}
                cy={centerY}
                r="56"
                fill="none"
                stroke="#00E599"
                strokeWidth="1.5"
                opacity="0.4"
              >
                <animate
                  attributeName="r"
                  values="52;60;52"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0.1;0.5"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Conductor Card Base */}
              <rect
                x={centerX - 85}
                y={centerY - 45}
                width="170"
                height="90"
                rx="20"
                fill="#181E2C"
                stroke="#00E599"
                strokeWidth="2"
                filter="drop-shadow(0 8px 24px rgba(0, 229, 153, 0.25))"
              />

              {/* Title & Badge */}
              <rect
                x={centerX - 72}
                y={centerY - 35}
                width="144"
                height="16"
                rx="8"
                fill="#00E599"
                fillOpacity="0.15"
              />
              <text
                x={centerX}
                y={centerY - 24}
                textAnchor="middle"
                fill="#00E599"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="0.08em"
              >
                CENTRAL CONDUCTOR (HUB)
              </text>

              <text
                x={centerX}
                y={centerY + 2}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="13"
                fontFamily="sans-serif"
                fontWeight="bold"
              >
                {conductorName}
              </text>

              <text
                x={centerX}
                y={centerY + 18}
                textAnchor="middle"
                fill="#8F9CAE"
                fontSize="9.5"
                fontFamily="sans-serif"
              >
                {conductorRole}
              </text>

              <text
                x={centerX}
                y={centerY + 34}
                textAnchor="middle"
                fill="#00E599"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="600"
              >
                {assets.length} Assets Orchestrated
              </text>
            </g>

            {/* Radial Spoke Pod Nodes */}
            {SPOKE_PODS.map((pod) => {
              const matchedAssets = assets.filter(pod.assetMatcher);
              const count = matchedAssets.length;
              const isSelected = selectedPodId === pod.id;
              const IconComp = pod.icon;

              return (
                <g
                  key={pod.id}
                  onClick={() => setSelectedPodId(pod.id)}
                  className="cursor-pointer group"
                >
                  {/* Spoke Card */}
                  <rect
                    x={pod.x - 70}
                    y={pod.y - 34}
                    width="140"
                    height="68"
                    rx="14"
                    fill="#181E2C"
                    stroke={isSelected ? '#FFFFFF' : count > 0 ? pod.accentColor : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    className="transition-all duration-200 group-hover:brightness-110"
                    filter="drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
                  />

                  {/* Category Pill Tag */}
                  <rect
                    x={pod.x - 60}
                    y={pod.y - 28}
                    width="62"
                    height="13"
                    rx="4"
                    fill="rgba(255, 255, 255, 0.05)"
                  />
                  <text
                    x={pod.x - 29}
                    y={pod.y - 18}
                    textAnchor="middle"
                    fill="#8F9CAE"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pod.category}
                  </text>

                  {/* Count Badge */}
                  <rect
                    x={pod.x + 24}
                    y={pod.y - 28}
                    width="36"
                    height="13"
                    rx="6"
                    fill={count > 0 ? pod.accentColor : '#121620'}
                  />
                  <text
                    x={pod.x + 42}
                    y={pod.y - 18}
                    textAnchor="middle"
                    fill={count > 0 ? '#0B0E14' : '#8F9CAE'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {count} {count === 1 ? 'act' : 'acts'}
                  </text>

                  {/* Pod Label */}
                  <text
                    x={pod.x}
                    y={pod.y + 2}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                  >
                    {pod.label}
                  </text>

                  {/* Role Detail */}
                  <text
                    x={pod.x}
                    y={pod.y + 18}
                    textAnchor="middle"
                    fill="#8F9CAE"
                    fontSize="7.5"
                    fontFamily="sans-serif"
                  >
                    {pod.roleDescription.slice(0, 24)}...
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Pod Details Panel */}
      {selectedPod && (
        <div className="relative z-10 mt-4 p-4 rounded-xl bg-[#181E2C] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${selectedPod.accentColor}20`,
                borderColor: `${selectedPod.accentColor}50`,
                color: selectedPod.accentColor
              }}
            >
              <selectedPod.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{selectedPod.label}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-[#8F9CAE]">
                  {selectedPod.category}
                </span>
              </div>
              <p className="text-xs text-[#8F9CAE] mt-0.5">{selectedPod.roleDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#8F9CAE]">
              {selectedPodAssets.length} active {selectedPodAssets.length === 1 ? 'deliverable' : 'deliverables'} in this channel
            </span>
            <button
              type="button"
              onClick={() => setSelectedPodId(null)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
