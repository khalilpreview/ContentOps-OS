import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  RefreshCw,
  LayoutGrid,
  GitFork,
  Award,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { ContentAsset, FormatTier, PillarType, User } from '../types';
import {
  generate30DayVelocityTrends,
  calculateSlaPerformanceMetrics,
  calculateDashboardSummaryStats
} from '../lib/dashboardMetrics';

interface DashboardProps {
  assets: ContentAsset[];
  currentUser: User;
  onNavigateToKanban: () => void;
  onOpenNewAsset?: () => void;
}

// Custom Tooltip for Velocity Area & Line Charts
const CustomVelocityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121620]/95 backdrop-blur-md border border-white/10 p-3.5 rounded-xl shadow-2xl text-xs font-mono space-y-1.5 z-50">
        <div className="text-[#8F9CAE] font-semibold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] text-[#00E599] font-bold">THROUGHPUT</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="text-white font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for SLA Performance Chart
const CustomSlaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121620]/95 backdrop-blur-md border border-white/10 p-3.5 rounded-xl shadow-2xl text-xs font-mono space-y-1.5 z-50">
        <div className="text-[#8F9CAE] font-semibold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] text-[#F5A524] font-bold">SLA PERFORMANCE</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="text-white font-bold">
              {entry.name.includes('Hours') || entry.name.includes('Ceiling')
                ? `${entry.value}h`
                : entry.name.includes('Rate')
                ? `${entry.value}%`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({
  assets,
  currentUser,
  onNavigateToKanban,
  onOpenNewAsset
}) => {
  // Timeframe filter state
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(30);
  const [selectedPillar, setSelectedPillar] = useState<PillarType | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<FormatTier | 'ALL'>('ALL');

  // Filter assets based on active filters
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (selectedPillar !== 'ALL' && asset.pillar !== selectedPillar) return false;
      if (selectedTier !== 'ALL' && asset.formatTier !== selectedTier) return false;
      return true;
    });
  }, [assets, selectedPillar, selectedTier]);

  // Aggregate metrics using pure domain calculations
  const velocityData = useMemo(() => {
    return generate30DayVelocityTrends(filteredAssets, timeframeDays);
  }, [filteredAssets, timeframeDays]);

  const slaMetrics = useMemo(() => {
    return calculateSlaPerformanceMetrics(filteredAssets, timeframeDays);
  }, [filteredAssets, timeframeDays]);

  const summaryStats = useMemo(() => {
    return calculateDashboardSummaryStats(filteredAssets);
  }, [filteredAssets]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0B0E14] text-white overflow-y-auto">
      
      {/* ======================================================== */}
      {/* Dashboard Top Header & Quick Control Bar                */}
      {/* ======================================================== */}
      <div className="sticky top-0 z-20 bg-[#0B0E14]/95 backdrop-blur-md border-b border-white/[0.08] px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 uppercase">
                ContentOps Intelligence
              </span>
              <span className="text-xs text-[#8F9CAE] font-mono">• 30-Day Executive Telemetry</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Velocity Trends & SLA Performance Dashboard</span>
              <span className="text-xs font-mono font-normal text-[#8F9CAE] bg-[#181E2C] px-2.5 py-1 rounded-md border border-white/5">
                Live Synced ({assets.length} Active Assets)
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe Toggle Buttons */}
            <div className="flex items-center bg-[#121620] p-1 rounded-xl border border-white/[0.07] text-xs">
              <span className="text-[#8F9CAE] px-2 font-mono flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-[#00E599]" />
                <span className="hidden sm:inline">Range:</span>
              </span>
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeframeDays(days)}
                  className={`px-3 py-1 rounded-lg font-mono font-medium transition-colors ${
                    timeframeDays === days
                      ? 'bg-[#00E599] text-black font-semibold'
                      : 'text-[#8F9CAE] hover:text-white'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>

            {/* Strategic Pillar Filter */}
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value as PillarType | 'ALL')}
              className="bg-[#121620] border border-white/[0.07] text-[#8F9CAE] hover:text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#00E599] cursor-pointer"
            >
              <option value="ALL">All Pillars</option>
              <option value="STRATEGY_SERIES">Strategy Series</option>
              <option value="CONTENT_OPS">ContentOps</option>
              <option value="CROSS_FUNCTIONAL">Cross-Functional</option>
              <option value="BRAND_QA">Brand QA</option>
              <option value="INTELLIGENCE_OPTIMIZATION">AI & Intelligence</option>
            </select>

            {/* Format Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as FormatTier | 'ALL')}
              className="bg-[#121620] border border-white/[0.07] text-[#8F9CAE] hover:text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#00E599] cursor-pointer"
            >
              <option value="ALL">All Tiers (Hero/Hub/Hygiene)</option>
              <option value="HERO">HERO Only</option>
              <option value="HUB">HUB Only</option>
              <option value="HYGIENE">HYGIENE Only</option>
            </select>

            {/* Switch to Kanban Board CTA */}
            <button
              type="button"
              onClick={onNavigateToKanban}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#181E2C] hover:bg-[#202738] text-white border border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#00E599]" />
              <span>Back to Kanban</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1700px] mx-auto w-full">
        {/* Production Empty Pipeline Notification */}
        {assets.length === 0 && (
          <div className="p-4 rounded-2xl bg-[#121620] border border-[#00E599]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00E599]/15 border border-[#00E599]/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#00E599]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Executive Telemetry Ready (0 Test Data in Pipeline)
                </h3>
                <p className="text-xs text-[#8F9CAE] mt-0.5">
                  Real-time SLA compliance, velocity throughput, and stage latency metrics will calculate live as you create briefs and advance deliverables through approval gates.
                </p>
              </div>
            </div>
            {onOpenNewAsset && (
              <button
                type="button"
                onClick={onOpenNewAsset}
                className="px-4 py-2 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <span>+ Create First Brief</span>
              </button>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* KPI Top Summary Cards                                    */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Throughput */}
          <div className="bg-[#121620] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between hover:border-[#00E599]/30 transition-colors group">
            <div className="flex items-center justify-between text-[#8F9CAE]">
              <span className="text-xs font-medium text-slate-300">30d Output Throughput</span>
              <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center text-[#00E599]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-white group-hover:text-[#00E599] transition-colors tabular-nums">
                {summaryStats.totalAssetsProcessed}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#00E599] font-mono tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+{summaryStats.totalAssetsChangePct}% vs prior period</span>
              </div>
            </div>
          </div>

          {/* 2. Content Velocity */}
          <div className="bg-[#121620] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between hover:border-[#00E599]/30 transition-colors group">
            <div className="flex items-center justify-between text-[#8F9CAE]">
              <span className="text-xs font-medium text-slate-300">Content Velocity Rate</span>
              <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center text-[#00E599]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-white group-hover:text-[#00E599] transition-colors tabular-nums">
                {summaryStats.velocityOutputPerDay} <span className="text-sm font-normal text-[#8F9CAE]">assets/day</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#00E599] font-mono tabular-nums">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+{summaryStats.velocityChangePct}% velocity pace</span>
              </div>
            </div>
          </div>

          {/* 3. SLA Compliance */}
          <div className="bg-[#121620] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between hover:border-[#00E599]/30 transition-colors group">
            <div className="flex items-center justify-between text-[#8F9CAE]">
              <span className="text-xs font-medium text-slate-300">SLA On-Time Rate</span>
              <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center text-[#00E599]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-white group-hover:text-[#00E599] transition-colors tabular-nums">
                {summaryStats.slaComplianceRate}%
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#00E599] font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Target ≥ 90% satisfied</span>
              </div>
            </div>
          </div>

          {/* 4. Average SLA Turnaround */}
          <div className="bg-[#121620] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between hover:border-[#F5A524]/30 transition-colors group">
            <div className="flex items-center justify-between text-[#8F9CAE]">
              <span className="text-xs font-medium text-slate-300">Avg Turnaround Latency</span>
              <div className="w-8 h-8 rounded-lg bg-[#F5A524]/10 border border-[#F5A524]/20 flex items-center justify-center text-[#F5A524]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-white group-hover:text-[#F5A524] transition-colors tabular-nums">
                {summaryStats.avgTurnaroundHours}h
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#00E599] font-mono tabular-nums">
                <span>{summaryStats.avgHoursAheadOfSla}h ahead of 48h limit</span>
              </div>
            </div>
          </div>

          {/* 5. Phase 5 Retention Win Rate */}
          <div className="bg-[#121620] border border-white/[0.07] rounded-2xl p-4 flex flex-col justify-between hover:border-[#00E599]/30 transition-colors group">
            <div className="flex items-center justify-between text-[#8F9CAE]">
              <span className="text-xs font-medium text-slate-300">Winning Format Ratio</span>
              <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 border border-[#00E599]/20 flex items-center justify-center text-[#00E599]">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-white group-hover:text-[#00E599] transition-colors">
                {summaryStats.winningFormatRatio}%
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#8F9CAE] font-mono">
                <span>&gt;65% 3s retention signal</span>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* ROW 1: Content Velocity Trends (30 Days) AreaChart       */}
        {/* ======================================================== */}
        <div className="bg-[#121620] border border-white/[0.08] rounded-2xl p-5 lg:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00E599]" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Content Velocity Trends (Last {timeframeDays} Days)
                </h2>
              </div>
              <p className="text-xs text-[#8F9CAE] mt-0.5">
                Daily throughput volume: Briefs Initiated vs Productions Cleared vs Published Deliverables
              </p>
            </div>

            {/* Legend indicator pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#38BDF8]" />
                <span className="text-[#8F9CAE]">Briefs Created</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#F5A524]" />
                <span className="text-[#8F9CAE]">QA Cleared</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#00E599]" />
                <span className="text-white font-bold">Published</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#A855F7]" />
                <span className="text-[#A855F7]">Moving Velocity</span>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Published Gradient */}
                  <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E599" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00E599" stopOpacity={0.0} />
                  </linearGradient>
                  {/* QA Cleared Gradient */}
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A524" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F5A524" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Created Gradient */}
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1E2536" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E2536' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E2536' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomVelocityTooltip />} />

                <Area
                  type="monotone"
                  dataKey="created"
                  name="Briefs Created"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="QA Cleared"
                  stroke="#F5A524"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
                <Area
                  type="monotone"
                  dataKey="published"
                  name="Published"
                  stroke="#00E599"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPublished)"
                />
                <Line
                  type="monotone"
                  dataKey="velocityRate"
                  name="Velocity (3d Avg)"
                  stroke="#A855F7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ROW 2: SLA Performance & Turnaround Analysis            */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: SLA Turnaround Hours vs 48h Limit Line (8 cols) */}
          <div className="lg:col-span-8 bg-[#121620] border border-white/[0.08] rounded-2xl p-5 lg:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#F5A524]" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    SLA Turnaround Latency vs. 48h Binding Ceiling
                  </h3>
                </div>
                <p className="text-xs text-[#8F9CAE] mt-0.5">
                  Track average turnaround time against the binding 48-hour SLA boundary
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#00E599]">
                  <span className="w-3 h-0.5 bg-[#00E599]" />
                  <span>Avg Latency ({slaMetrics.avgTurnaroundOverall}h)</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#FF4B55]">
                  <span className="w-3 h-0.5 bg-[#FF4B55] border-t border-dashed" />
                  <span>48h SLA Limit</span>
                </span>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slaMetrics.dailySlaData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2536" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1E2536' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1E2536' }}
                    domain={[0, 60]}
                  />
                  <Tooltip content={<CustomSlaTooltip />} />

                  {/* 48h SLA Benchmark Ceiling */}
                  <ReferenceLine
                    y={48}
                    stroke="#FF4B55"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: '48h Hard SLA Ceiling',
                      position: 'top',
                      fill: '#FF4B55',
                      fontSize: 10,
                      fontFamily: 'monospace'
                    }}
                  />

                  {/* Average Turnaround Line */}
                  <Line
                    type="monotone"
                    dataKey="avgTurnaroundHours"
                    name="Avg Turnaround Hours"
                    stroke="#00E599"
                    strokeWidth={3}
                    dot={{ fill: '#00E599', r: 3 }}
                    activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#00E599', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: SLA Compliance Distribution Donut (4 cols) */}
          <div className="lg:col-span-4 bg-[#121620] border border-white/[0.08] rounded-2xl p-5 lg:p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <ShieldCheck className="w-5 h-5 text-[#00E599]" />
                <h3 className="text-base font-bold text-white tracking-tight">SLA Compliance Ratio</h3>
              </div>
              <p className="text-xs text-[#8F9CAE] mt-2">
                Proportion of assets cleared on-time vs at-risk reviews vs breaches
              </p>
            </div>

            <div className="h-[200px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slaMetrics.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {slaMetrics.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#121620" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomVelocityTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-white">{slaMetrics.overallComplianceRate}%</span>
                <span className="text-[10px] font-mono text-[#00E599] uppercase tracking-wider">On-Time</span>
              </div>
            </div>

            {/* Slices legend */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
              {slaMetrics.distribution.map((slice, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="text-[#8F9CAE]">{slice.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span>{slice.value}</span>
                    <span className="text-[#8F9CAE] text-[11px] font-normal">({slice.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* ROW 3: Format Tier Velocity + Stage Latency Breakdown     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Velocity by Format Tier (HERO vs HUB vs HYGIENE) */}
          <div className="lg:col-span-6 bg-[#121620] border border-white/[0.08] rounded-2xl p-5 lg:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-[#00E599]" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Output Velocity by Format Tier
                  </h3>
                </div>
                <p className="text-xs text-[#8F9CAE] mt-0.5">
                  Macro HERO events vs HUB episodic series vs Evergreen HYGIENE
                </p>
              </div>
            </div>

            <div className="h-[260px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2536" vertical={false} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1E2536' }}
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1E2536' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomVelocityTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', paddingBottom: 10 }}
                  />
                  <Bar dataKey="hero" name="HERO (Macro)" fill="#F5A524" stackId="tier" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="hub" name="HUB (Series)" fill="#00E599" stackId="tier" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="hygiene" name="HYGIENE (Evergreen)" fill="#64748B" stackId="tier" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Stage Latency vs SLA Targets */}
          <div className="lg:col-span-6 bg-[#121620] border border-white/[0.08] rounded-2xl p-5 lg:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#38BDF8]" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Average Stage Latency vs Target SLAs
                  </h3>
                </div>
                <p className="text-xs text-[#8F9CAE] mt-0.5">
                  Actual turnaround hours compared to stage targets
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {slaMetrics.stageLatency.map((stage) => {
                const ratio = Math.min(100, Math.round((stage.avgHours / stage.targetHours) * 100));
                const isOptimal = stage.avgHours <= stage.targetHours;

                return (
                  <div key={stage.stageKey} className="bg-[#181E2C] p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-white">{stage.stageName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#00E599] font-bold">{stage.avgHours}h</span>
                        <span className="text-[#8F9CAE]">/ {stage.targetHours}h SLA</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOptimal ? 'bg-[#00E599]' : 'bg-[#FF4B55]'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8F9CAE]">
                      <span>Latency utilization: {ratio}% of ceiling</span>
                      <span className={isOptimal ? 'text-[#00E599]' : 'text-[#FF4B55]'}>
                        {isOptimal ? 'Within Target' : 'Exceeding Target'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
