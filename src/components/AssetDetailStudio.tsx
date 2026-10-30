import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  GitFork, 
  Save, 
  FileCheck2,
  Lock,
  CheckCircle2,
  Send
} from 'lucide-react';
import { AssetStatus, ContentAsset, FormatTier, PillarType, Priority, User } from '../types';
import { calculateSla, evaluatePostLaunchRetention } from '../lib/sla';
import { canToggleGatekeeperSignOff } from '../lib/stateMachine';
import { generateBrief } from '../lib/aiService';

interface AssetDetailStudioProps {
  asset: ContentAsset;
  onClose: () => void;
  onUpdateAsset: (updated: ContentAsset) => void;
  allUsers: User[];
  currentUser: User;
  onOpenMultiplier: (asset: ContentAsset) => void;
  onAttemptTransition: (asset: ContentAsset, targetStatus: AssetStatus) => void;
  onDeleteAsset?: (assetId: string) => void;
}

export const AssetDetailStudio: React.FC<AssetDetailStudioProps> = ({
  asset,
  onClose,
  onUpdateAsset,
  allUsers,
  currentUser,
  onOpenMultiplier,
  onAttemptTransition
}) => {
  // Form draft state
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  const [pillar, setPillar] = useState<PillarType>(asset.pillar);
  const [formatTier, setFormatTier] = useState<FormatTier>(asset.formatTier);
  const [priority, setPriority] = useState<Priority>(asset.priority);
  const [rawIntakeNotes, setRawIntakeNotes] = useState(asset.rawIntakeNotes || '');
  const [hookStrategy, setHookStrategy] = useState(asset.hookStrategy || '');
  const [platformSpecs, setPlatformSpecs] = useState(asset.platformSpecs || '');
  const [targetKpi, setTargetKpi] = useState(asset.targetKpi || '');
  const [assignedToId, setAssignedToId] = useState(asset.assignedToId || '');
  const [deliverableUrl, setDeliverableUrl] = useState(asset.deliverableUrl || '');
  const [slaHours] = useState(asset.slaHours || 48);

  // 4-Point Binary QA Gatekeeper Checklist State
  const [qaToneApproved, setQaToneApproved] = useState(asset.qaToneApproved);
  const [qaSpecsValidated, setQaSpecsValidated] = useState(asset.qaSpecsValidated);
  const [qaRightsCleared, setQaRightsCleared] = useState(asset.qaRightsCleared);
  const [qaGatekeeperSigned, setQaGatekeeperSigned] = useState(asset.qaGatekeeperSigned);

  // Phase 5 Post-Launch Metrics State
  const [retentionRate3s, setRetentionRate3s] = useState<number | ''>(asset.retentionRate3s ?? '');
  const [reachImpressions, setReachImpressions] = useState(asset.reachImpressions || '');
  const [sentToPaidAds, setSentToPaidAds] = useState(Boolean(asset.sentToPaidAds));

  // AI & UI feedback state
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [aiEngineLabel, setAiEngineLabel] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  const slaInfo = calculateSla(asset);
  const isContentManager = canToggleGatekeeperSignOff(currentUser);
  const isStakeholder = currentUser.role === 'STAKEHOLDER';
  const isCanReviewSla = isStakeholder || isContentManager;

  // All 4 binary checkboxes must be checked AND user must be CONTENT_MANAGER
  const allFourQaChecked = qaToneApproved && qaSpecsValidated && qaRightsCleared && qaGatekeeperSigned;
  const canApproveForSyndication = allFourQaChecked && isContentManager;

  const numericRetention = typeof retentionRate3s === 'number' ? retentionRate3s : 0;
  const retentionEval = evaluatePostLaunchRetention(numericRetention);
  const isWinningFormat = retentionEval.isWinningFormat || (retentionRate3s === '' && asset.isWinningFormat);

  const pillarLabels: Record<PillarType, string> = {
    STRATEGY_SERIES: 'Strategy Series',
    CONTENT_OPS: 'ContentOps',
    CROSS_FUNCTIONAL: 'Cross-Functional',
    BRAND_QA: 'Brand QA',
    INTELLIGENCE_OPTIMIZATION: 'Intel & AI Opt'
  };

  const statusLabels: Record<AssetStatus, string> = {
    DRAFT_BRIEF: 'Stage 1: Drafting & Briefs',
    SLA_REVIEW: 'Stage 2: Stakeholder Review (SLA)',
    IN_PRODUCTION: 'Stage 3: Production Pod',
    QA_GATE: 'Stage 4: QA Gatekeeper',
    READY_TO_PUBLISH: 'Stage 5: Ready for Distribution',
    PUBLISHED: 'Published Archive'
  };

  // Build updated ContentAsset snapshot from local state
  const buildUpdatedAsset = (overrides?: Partial<ContentAsset>): ContentAsset => {
    const cleanRetention = retentionRate3s === '' ? null : Number(retentionRate3s);
    const evalRes = evaluatePostLaunchRetention(cleanRetention ?? 0);
    return {
      ...asset,
      title,
      description,
      pillar,
      formatTier,
      priority,
      rawIntakeNotes,
      hookStrategy,
      platformSpecs,
      targetKpi,
      assignedToId,
      deliverableUrl: deliverableUrl.trim() || null,
      slaHours,
      qaToneApproved,
      qaSpecsValidated,
      qaRightsCleared,
      qaGatekeeperSigned,
      qaSignedById: qaGatekeeperSigned ? (asset.qaSignedById || currentUser.id) : null,
      qaSignedByName: qaGatekeeperSigned ? (asset.qaSignedByName || currentUser.name) : null,
      qaSignedAt: qaGatekeeperSigned ? (asset.qaSignedAt || new Date().toISOString()) : null,
      retentionRate3s: cleanRetention,
      reachImpressions: reachImpressions.trim() || null,
      isWinningFormat: cleanRetention !== null ? evalRes.isWinningFormat : asset.isWinningFormat,
      paidEligible: cleanRetention !== null ? evalRes.paidEligible : asset.paidEligible,
      sentToPaidAds,
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  };

  // Sync checkbox toggle immediately to parent state so board stays reactive
  const handleToggleQaBox = (
    field: 'qaToneApproved' | 'qaSpecsValidated' | 'qaRightsCleared' | 'qaGatekeeperSigned',
    checked: boolean
  ) => {
    if (field === 'qaGatekeeperSigned' && !isContentManager) {
      return;
    }
    const nextTone = field === 'qaToneApproved' ? checked : qaToneApproved;
    const nextSpecs = field === 'qaSpecsValidated' ? checked : qaSpecsValidated;
    const nextRights = field === 'qaRightsCleared' ? checked : qaRightsCleared;
    const nextSigned = field === 'qaGatekeeperSigned' ? checked : qaGatekeeperSigned;

    setQaToneApproved(nextTone);
    setQaSpecsValidated(nextSpecs);
    setQaRightsCleared(nextRights);
    setQaGatekeeperSigned(nextSigned);

    onUpdateAsset(
      buildUpdatedAsset({
        qaToneApproved: nextTone,
        qaSpecsValidated: nextSpecs,
        qaRightsCleared: nextRights,
        qaGatekeeperSigned: nextSigned,
        qaSignedById: nextSigned ? currentUser.id : null,
        qaSignedByName: nextSigned ? currentUser.name : null,
        qaSignedAt: nextSigned ? new Date().toISOString() : null
      })
    );
  };

  // Handle AI Auto-Brief Generation via IFM.ai K2 Horizon
  const handleAutoBrief = async () => {
    const contextToUse = rawIntakeNotes.trim() || title.trim() || 'Enterprise ContentOps campaign';
    if (!rawIntakeNotes.trim()) {
      setRawIntakeNotes(contextToUse);
    }

    setIsGeneratingBrief(true);
    setInlineNotice(null);
    try {
      const platformTarget = platformSpecs.trim() || '1080x1920, 9:16 safe margins, -14 LUFS';
      const { result, engineUsed } = await generateBrief(contextToUse, formatTier, platformTarget);

      setAiEngineLabel(engineUsed);
      const nextHook =
        result.hooks && result.hooks.length > 0
          ? `${result.hooks[0].type}: "${result.hooks[0].script}"`
          : hookStrategy;
      const nextSpecs = result.technicalSpecs || platformSpecs;
      const nextKpi = result.targetKpi || targetKpi;

      setHookStrategy(nextHook);
      setPlatformSpecs(nextSpecs);
      setTargetKpi(nextKpi);

      onUpdateAsset(
        buildUpdatedAsset({
          rawIntakeNotes: contextToUse,
          hookStrategy: nextHook,
          platformSpecs: nextSpecs,
          targetKpi: nextKpi,
          generatedHooks: result.hooks
        })
      );
    } catch (err: any) {
      setInlineNotice('Failed to generate brief. Please try again.');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Save changes
  const handleSave = () => {
    const updated = buildUpdatedAsset();
    onUpdateAsset(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Approve for Syndication (Stage 4 -> Stage 5)
  const handleApproveForSyndication = () => {
    if (!canApproveForSyndication) return;
    const updated = buildUpdatedAsset({
      qaToneApproved: true,
      qaSpecsValidated: true,
      qaRightsCleared: true,
      qaGatekeeperSigned: true,
      qaSignedById: currentUser.id,
      qaSignedByName: currentUser.name,
      qaSignedAt: new Date().toISOString()
    });
    onUpdateAsset(updated);
    onAttemptTransition(updated, 'READY_TO_PUBLISH');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Studio Top Navigation Bar */}
        <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#121620] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Format Tier Pill */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border uppercase ${
              formatTier === 'HERO' ? 'bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/40' :
              formatTier === 'HUB' ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40' :
              'bg-white/10 text-[#8F9CAE] border-white/10'
            }`}>
              {formatTier}
            </span>

            {/* Pillar Tag inside Modal (moved from exterior card for clean scannability) */}
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#181E2C] text-[#8F9CAE] border border-white/[0.07]">
              Pillar: <strong className="text-white">{pillarLabels[pillar]}</strong>
            </span>

            {/* Current Stage Pill */}
            <span className="text-xs font-semibold text-[#00E599] px-2.5 py-0.5 rounded-md bg-[#00E599]/10 border border-[#00E599]/30">
              {statusLabels[asset.status]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {formatTier === 'HERO' && (
              <button
                type="button"
                onClick={() => onOpenMultiplier(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00E599]/15 hover:bg-[#00E599]/25 text-[#00E599] border border-[#00E599]/40 transition-colors cursor-pointer"
              >
                <GitFork className="h-3.5 w-3.5" />
                <span>Split (Multiplier Engine)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savedNotice ? 'Saved!' : 'Save Brief'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
              aria-label="Close Studio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Studio Split-Screen Two-Pane Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-white/[0.07]">
          {/* ================= LEFT PANE: The Brief Studio & IFM K2 Horizon ================= */}
          <div className="lg:col-span-7 p-5 lg:p-6 overflow-y-auto space-y-5 bg-[#0B0E14]">
            {inlineNotice && (
              <div className="p-3 rounded-lg bg-[#FF4B55]/15 border border-[#FF4B55]/40 text-[#FF4B55] text-xs">
                {inlineNotice}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider mb-1.5">
                Asset Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Global Keynote: Autonomous Workflows"
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3.5 py-2 text-sm text-white font-semibold focus:outline-none"
              />
            </div>

            {/* Strategic Pillar, Format Tier & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
                  Strategic Pillar
                </label>
                <select
                  value={pillar}
                  onChange={(e) => setPillar(e.target.value as PillarType)}
                  className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="STRATEGY_SERIES">Strategy Series</option>
                  <option value="CONTENT_OPS">ContentOps</option>
                  <option value="CROSS_FUNCTIONAL">Cross-Functional</option>
                  <option value="BRAND_QA">Brand QA</option>
                  <option value="INTELLIGENCE_OPTIMIZATION">Intel & AI Opt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
                  Format Tier
                </label>
                <select
                  value={formatTier}
                  onChange={(e) => setFormatTier(e.target.value as FormatTier)}
                  className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="HERO">HERO (Macro)</option>
                  <option value="HUB">HUB (Series)</option>
                  <option value="HYGIENE">HYGIENE (Evergreen)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Raw Campaign Notes / Context + [✨ Generate with K2 Horizon] */}
            <div className="bg-[#121620] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-[#00E599]" />
                  <span>Raw Campaign Notes / Context</span>
                </label>

                <button
                  type="button"
                  onClick={handleAutoBrief}
                  disabled={isGeneratingBrief}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] transition-all disabled:opacity-50 cursor-pointer"
                  aria-label="Generate with K2 Horizon"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingBrief ? 'Generating with K2 Horizon...' : '✨ Generate with K2 Horizon'}
                  </span>
                </button>
              </div>

              <textarea
                rows={3}
                value={rawIntakeNotes}
                onChange={(e) => setRawIntakeNotes(e.target.value)}
                placeholder="Paste raw campaign bullet points, executive soundbites, core claims, or customer problem statements here..."
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg p-2.5 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
              />

              {aiEngineLabel && (
                <div className="text-[11px] text-[#00E599] font-mono flex items-center gap-1.5 pt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                  <span>Auto-Brief populated via {aiEngineLabel}</span>
                </div>
              )}
            </div>

            {/* 3 Hook Variants (Contrarian, Curiosity, Direct Value) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider">
                Hook Strategy & 3 Opening Variants (First 3s)
              </label>

              {asset.generatedHooks && asset.generatedHooks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {asset.generatedHooks.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#181E2C] border border-white/[0.07] hover:border-[#00E599]/40 transition-colors flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          h.type === 'Contrarian'
                            ? 'bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/40'
                            : h.type === 'Curiosity'
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40'
                        }`}>
                          {h.type} Hook
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(h.script, idx)}
                            className="p-1 rounded hover:bg-[#121620] text-[#8F9CAE] hover:text-white transition-colors cursor-pointer"
                            title="Copy Hook Text"
                          >
                            {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-[#00E599]" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHookStrategy(`${h.type}: "${h.script}"`)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#121620] hover:bg-[#00E599] hover:text-[#0B0E14] text-white border border-white/10 transition-colors cursor-pointer"
                          >
                            Select Hook
                          </button>
                        </div>
                      </div>
                      <p className="text-white leading-relaxed">"{h.script}"</p>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={hookStrategy}
                onChange={(e) => setHookStrategy(e.target.value)}
                placeholder="Primary Hook Strategy (Contrarian, Curiosity, or Direct Value)"
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-xs text-white font-medium focus:outline-none"
              />
            </div>

            {/* Platform Technical Specifications */}
            <div>
              <label className="block text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider mb-1.5">
                Platform Technical Specifications
              </label>
              <textarea
                rows={2}
                value={platformSpecs}
                onChange={(e) => setPlatformSpecs(e.target.value)}
                placeholder="e.g. 1080x1920, 9:16 safe margins, -14 LUFS"
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg p-2.5 text-xs text-white placeholder-[#8F9CAE] focus:outline-none font-mono"
              />
            </div>

            {/* Target KPI Benchmark */}
            <div>
              <label className="block text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider mb-1.5">
                Target KPI Benchmark
              </label>
              <input
                type="text"
                value={targetKpi}
                onChange={(e) => setTargetKpi(e.target.value)}
                placeholder="e.g. 68% 3s Retention, CTR > 2.5%, 500+ saves"
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
              />
            </div>
          </div>

          {/* ================= RIGHT PANE: Brand Guardianship QA Gatekeeper & SLA ================= */}
          <div className="lg:col-span-5 p-5 lg:p-6 overflow-y-auto space-y-5 bg-[#121620]">
            {/* Brand Guardianship Sign-off (4-Point Binary QA Gatekeeper Checklist) */}
            <div className={`bg-[#181E2C] border rounded-xl p-4 space-y-3.5 shadow-md ${
              asset.status === 'QA_GATE' ? 'border-[#00E599]/50 ring-1 ring-[#00E599]/20' : 'border-white/[0.07]'
            }`}>
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#00E599]" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Brand Guardianship Sign-Off
                    </h3>
                    <span className="text-[10px] text-[#8F9CAE] block">
                      Strict 4-Point Binary QA Gatekeeper Veto
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#121620] text-[#00E599] border border-[#00E599]/30 tabular-nums">
                  {[qaToneApproved, qaSpecsValidated, qaRightsCleared, qaGatekeeperSigned].filter(Boolean).length}/4 Cleared
                </span>
              </div>

              {/* 4 Binary Checkboxes */}
              <div className="space-y-2.5 text-xs">
                <label className="flex items-start gap-2.5 text-white cursor-pointer p-2 rounded-lg bg-[#121620]/60 hover:bg-[#121620] border border-white/[0.05]">
                  <input
                    type="checkbox"
                    checked={qaToneApproved}
                    onChange={(e) => handleToggleQaBox('qaToneApproved', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#00E599] cursor-pointer"
                  />
                  <span>Tone of Voice &amp; Brand Identity cleared</span>
                </label>

                <label className="flex items-start gap-2.5 text-white cursor-pointer p-2 rounded-lg bg-[#121620]/60 hover:bg-[#121620] border border-white/[0.05]">
                  <input
                    type="checkbox"
                    checked={qaSpecsValidated}
                    onChange={(e) => handleToggleQaBox('qaSpecsValidated', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#00E599] cursor-pointer"
                  />
                  <span>Hook strength &amp; safe zones verified</span>
                </label>

                <label className="flex items-start gap-2.5 text-white cursor-pointer p-2 rounded-lg bg-[#121620]/60 hover:bg-[#121620] border border-white/[0.05]">
                  <input
                    type="checkbox"
                    checked={qaRightsCleared}
                    onChange={(e) => handleToggleQaBox('qaRightsCleared', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#00E599] cursor-pointer"
                  />
                  <span>Commercial music &amp; IP rights licensed</span>
                </label>

                {/* 4th Checkbox: Gatekeeper Final Sign-off (Restricted to CONTENT_MANAGER) */}
                <label
                  className={`flex items-start justify-between gap-2.5 p-2.5 rounded-lg border transition-colors ${
                    isContentManager
                      ? 'bg-[#00E599]/10 border-[#00E599]/30 text-white cursor-pointer'
                      : 'bg-[#121620]/40 border-white/[0.05] text-[#8F9CAE] cursor-not-allowed opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={qaGatekeeperSigned}
                      disabled={!isContentManager}
                      onChange={(e) => handleToggleQaBox('qaGatekeeperSigned', e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded accent-[#00E599] disabled:cursor-not-allowed"
                    />
                    <div>
                      <span className="font-semibold block">Gatekeeper Final Sign-off</span>
                      <span className="text-[10px] text-[#8F9CAE]">
                        {qaGatekeeperSigned
                          ? `Signed by ${asset.qaSignedByName || currentUser.name}`
                          : 'Requires Content Manager authorization'}
                      </span>
                    </div>
                  </div>
                  {!isContentManager ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF4B55]/15 text-[#FF4B55] border border-[#FF4B55]/30 shrink-0">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00E599]/20 text-[#00E599] shrink-0">
                      Authorized
                    </span>
                  )}
                </label>
              </div>

              {/* Role Lock Notice if non-Content Manager */}
              {!isContentManager && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F5A524]/15 border border-[#F5A524]/40 text-[#F5A524] text-[11px]">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Active role (<strong>{currentUser.name} • {currentUser.role}</strong>) cannot toggle Gatekeeper Final Sign-off. Switch to <strong>Elena Vance (Content Manager)</strong> in the top-right menu.
                  </span>
                </div>
              )}

              {/* Veto Guard Button: [Approve for Syndication] */}
              <button
                type="button"
                onClick={handleApproveForSyndication}
                disabled={!canApproveForSyndication}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  canApproveForSyndication
                    ? 'bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] cursor-pointer shadow-md'
                    : 'bg-[#121620] text-[#8F9CAE] border border-white/[0.07] cursor-not-allowed opacity-60'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Approve for Syndication</span>
              </button>
            </div>

            {/* Stage Transition Controls */}
            <div className="bg-[#181E2C] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider">
                  Pipeline Progression
                </span>
                <span className="text-xs font-bold text-[#00E599]">
                  {statusLabels[asset.status]}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {asset.status === 'DRAFT_BRIEF' && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = buildUpdatedAsset();
                      onUpdateAsset(updated);
                      onAttemptTransition(updated, 'SLA_REVIEW');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Submit Brief to Stakeholder Review (SLA)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {asset.status === 'SLA_REVIEW' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => onAttemptTransition(buildUpdatedAsset(), 'IN_PRODUCTION')}
                      disabled={!isCanReviewSla}
                      className="w-full py-2 px-3 rounded-lg bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] disabled:opacity-40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sign-Off SLA &amp; Advance to Production</span>
                    </button>
                    {!isCanReviewSla && (
                      <p className="text-[11px] text-[#F5A524] text-center">
                        Only Stakeholder or Content Manager can sign off SLA review.
                      </p>
                    )}
                  </div>
                )}

                {asset.status === 'IN_PRODUCTION' && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = buildUpdatedAsset();
                      onUpdateAsset(updated);
                      onAttemptTransition(updated, 'QA_GATE');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Send Deliverable to QA Gatekeeper</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {asset.status === 'READY_TO_PUBLISH' && (
                  <button
                    type="button"
                    onClick={() => onAttemptTransition(buildUpdatedAsset(), 'PUBLISHED')}
                    className="w-full py-2 px-3 rounded-lg bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Publish &amp; Move to Syndication Archive</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic SLA Countdown Status */}
            <div className={`p-4 rounded-xl border space-y-1.5 ${
              asset.status === 'SLA_REVIEW' ? slaInfo.badgeClass : 'bg-[#181E2C] border-white/[0.07]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>SLA Turnaround Clock</span>
                </span>
                <span className="text-xs font-mono font-bold tabular-nums">
                  {asset.slaHours}h Window
                </span>
              </div>

              {asset.status === 'SLA_REVIEW' ? (
                <div className="text-sm font-bold font-mono tabular-nums">
                  {slaInfo.label}
                </div>
              ) : (
                <div className="text-xs text-[#8F9CAE]">
                  {asset.status === 'DRAFT_BRIEF' ? '48-hour SLA clock starts upon brief submission.' : 'SLA review window completed.'}
                </div>
              )}
            </div>

            {/* Assignee & Deliverable URL */}
            <div className="bg-[#181E2C] border border-white/[0.07] rounded-xl p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider mb-1.5">
                  Assigned Specialist (RACI)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Assignee...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#8F9CAE] uppercase tracking-wider">
                    Deliverable Attachment URL
                  </label>
                  {deliverableUrl && (
                    <a
                      href={deliverableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#00E599] hover:underline flex items-center gap-1"
                    >
                      <span>View File</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://frame.io/... or https://figma.com/..."
                  className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Phase 5: Post-Launch Syndication Metrics & Winning Format */}
            <div className="bg-[#181E2C] border border-white/[0.07] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Post-Launch Performance Loop
                </span>
                {isWinningFormat && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F5A524]/15 text-[#F5A524] border border-[#F5A524]/40 font-bold text-[10px]">
                    🏆 WINNING FORMAT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#8F9CAE] mb-1">
                    3-Second Retention Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={retentionRate3s}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setRetentionRate3s(val);
                    }}
                    placeholder="e.g. 72"
                    className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white tabular-nums focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8F9CAE] mb-1">
                    Reach / Impressions
                  </label>
                  <input
                    type="text"
                    value={reachImpressions}
                    onChange={(e) => setReachImpressions(e.target.value)}
                    placeholder="e.g. 142,800"
                    className="w-full bg-[#121620] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              {isWinningFormat && (
                <button
                  type="button"
                  onClick={() => {
                    setSentToPaidAds(true);
                    onUpdateAsset(buildUpdatedAsset({ sentToPaidAds: true }));
                  }}
                  disabled={sentToPaidAds}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    sentToPaidAds
                      ? 'bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40'
                      : 'bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88]'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sentToPaidAds ? 'Sent to Paid Growth / Ads ✓' : 'Send to Paid Growth / Ads'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
