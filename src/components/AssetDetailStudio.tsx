import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  GitFork, 
  Save, 
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { AssetStatus, ContentAsset, FormatTier, HookVariation, PillarType, Priority, User } from '../types';
import { calculateSla } from '../lib/sla';
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
  onAttemptTransition,
  onDeleteAsset
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
  const [slaHours, setSlaHours] = useState(asset.slaHours || 48);

  // QA Gatekeeper checklist state
  const [qaToneApproved, setQaToneApproved] = useState(asset.qaToneApproved);
  const [qaSpecsValidated, setQaSpecsValidated] = useState(asset.qaSpecsValidated);
  const [qaRightsCleared, setQaRightsCleared] = useState(asset.qaRightsCleared);
  const [qaGatekeeperSigned, setQaGatekeeperSigned] = useState(asset.qaGatekeeperSigned);

  // AI loading state
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [aiEngineLabel, setAiEngineLabel] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const slaInfo = calculateSla(asset);
  const isContentManager = currentUser.role === 'CONTENT_MANAGER';
  const isStakeholder = currentUser.role === 'STAKEHOLDER';
  const isCanReviewSla = isStakeholder || isContentManager;

  const allQaChecked = qaToneApproved && qaSpecsValidated && qaRightsCleared;
  const canGatekeeperSign = allQaChecked && isContentManager;

  // Handle AI Auto-Brief Generation
  const handleAutoBrief = async () => {
    if (!rawIntakeNotes.trim()) {
      alert('Please enter some rough campaign intake notes first before generating an AI brief.');
      return;
    }

    setIsGeneratingBrief(true);
    try {
      const platformTarget = platformSpecs.trim() || 'Multi-channel (Vertical 9:16 + 16:9 Master)';
      const { result, engineUsed } = await generateBrief(rawIntakeNotes, formatTier, platformTarget);

      setAiEngineLabel(engineUsed);
      if (result.hooks && result.hooks.length > 0) {
        // Automatically set the first hook as primary if none selected
        if (!hookStrategy) {
          setHookStrategy(`${result.hooks[0].type}: ${result.hooks[0].script}`);
        }
      }
      if (result.technicalSpecs) {
        setPlatformSpecs(result.technicalSpecs);
      }
      if (result.targetKpi) {
        setTargetKpi(result.targetKpi);
      }

      // Update current asset with generated hooks
      const updatedAsset: ContentAsset = {
        ...asset,
        title,
        description,
        pillar,
        formatTier,
        priority,
        rawIntakeNotes,
        hookStrategy: hookStrategy || (result.hooks?.[0] ? `${result.hooks[0].type}: ${result.hooks[0].script}` : ''),
        platformSpecs: result.technicalSpecs || platformSpecs,
        targetKpi: result.targetKpi || targetKpi,
        generatedHooks: result.hooks
      };
      onUpdateAsset(updatedAsset);
    } catch (err: any) {
      console.error('Failed to generate brief:', err);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Save changes
  const handleSave = () => {
    const updated: ContentAsset = {
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
      updatedAt: new Date().toISOString()
    };
    onUpdateAsset(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Quick Sign-Off & Advance for QA Gate
  const handleGatekeeperAdvance = () => {
    const updated: ContentAsset = {
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
      qaToneApproved: true,
      qaSpecsValidated: true,
      qaRightsCleared: true,
      qaGatekeeperSigned: true,
      qaSignedById: currentUser.id,
      qaSignedByName: currentUser.name,
      qaSignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onUpdateAsset(updated);
    onAttemptTransition(updated, 'READY_TO_PUBLISH');
  };

  // Status transitions
  const statusLabels: Record<AssetStatus, string> = {
    DRAFT_BRIEF: 'Drafting & Briefs',
    SLA_REVIEW: 'Stakeholder Review (SLA)',
    IN_PRODUCTION: 'Production Pod',
    QA_GATE: 'QA Gatekeeper',
    READY_TO_PUBLISH: 'Ready for Distribution',
    PUBLISHED: 'Published'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#13151c] border border-[#252837] rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Studio Top Navigation Bar */}
        <div className="px-5 py-3.5 border-b border-[#252837] bg-[#181a24] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
              formatTier === 'HERO' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              formatTier === 'HUB' ? 'bg-[#4ff8ac]/20 text-[#4ff8ac] border-[#4ff8ac]/40' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {formatTier}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b93a7] font-mono">Stage:</span>
              <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-lg bg-[#10121a] border border-[#252837]">
                {statusLabels[asset.status]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formatTier === 'HERO' && (
              <button
                onClick={() => onOpenMultiplier(asset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#4ff8ac]/15 hover:bg-[#4ff8ac]/25 text-[#4ff8ac] border border-[#4ff8ac]/30 transition-colors shadow-sm"
              >
                <GitFork className="h-3.5 w-3.5" />
                <span>Asset Multiplier Engine</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#4ff8ac] hover:bg-[#38ef98] text-[#0f1118] transition-colors shadow-md shadow-[#4ff8ac]/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savedNotice ? 'Saved!' : 'Save Brief'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#10121a] hover:bg-[#1e212e] text-[#8b93a7] hover:text-white border border-[#252837] transition-colors"
              aria-label="Close Studio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Studio Two-Pane Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          {/* ================= LEFT PANE: Brief & Creative Strategy ================= */}
          <div className="lg:col-span-7 p-5 lg:p-6 overflow-y-auto space-y-5 bg-zinc-950">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Asset Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Global Keynote: Autonomous Workflows"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-sm text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Strategic Pillar, Tier & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 font-medium mb-1">
                  Strategic Pillar
                </label>
                <select
                  value={pillar}
                  onChange={(e) => setPillar(e.target.value as PillarType)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="STRATEGY_SERIES">Strategy Series</option>
                  <option value="CONTENT_OPS">ContentOps</option>
                  <option value="CROSS_FUNCTIONAL">Cross-Functional</option>
                  <option value="BRAND_QA">Brand QA</option>
                  <option value="INTELLIGENCE_OPTIMIZATION">Intelligence Opt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-medium mb-1">
                  Format Tier
                </label>
                <select
                  value={formatTier}
                  onChange={(e) => setFormatTier(e.target.value as FormatTier)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="HERO">HERO (Macro)</option>
                  <option value="HUB">HUB (Series)</option>
                  <option value="HYGIENE">HYGIENE (Search)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-medium mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Campaign Raw Intake Notes */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-indigo-400" />
                  <span>Campaign Intake Notes (Raw Context)</span>
                </label>

                {/* AI Auto-Brief Trigger */}
                <button
                  type="button"
                  onClick={handleAutoBrief}
                  disabled={isGeneratingBrief}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm transition-all disabled:opacity-50"
                  aria-label="Generate AI Auto-Brief via IFM.ai K2 Horizon"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingBrief ? 'Generating with K2 Horizon...' : '✨ AI Auto-Brief (K2 Horizon)'}</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={rawIntakeNotes}
                onChange={(e) => setRawIntakeNotes(e.target.value)}
                placeholder="Paste raw campaign bullet points, executive soundbites, core claims, or customer problem statements here..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />

              {aiEngineLabel && (
                <div className="text-[11px] text-indigo-300 font-mono flex items-center gap-1 pt-1">
                  <span>Engine:</span>
                  <span className="font-semibold text-indigo-200">{aiEngineLabel}</span>
                </div>
              )}
            </div>

            {/* Hook Variations section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Hook Variations & Opening Angle (First 3s)
              </label>

              {/* If generated hooks exist, display interactive variation cards */}
              {asset.generatedHooks && asset.generatedHooks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {asset.generatedHooks.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          h.type === 'Curiosity' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          h.type === 'Contrarian' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {h.type} Hook
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(h.script, idx)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Copy Hook Text"
                          >
                            {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHookStrategy(`${h.type}: "${h.script}"`)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-300 transition-colors"
                          >
                            Use as Primary
                          </button>
                        </div>
                      </div>
                      <p className="text-zinc-200 italic font-serif">"{h.script}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable primary hook input */}
              <input
                type="text"
                value={hookStrategy}
                onChange={(e) => setHookStrategy(e.target.value)}
                placeholder="Selected hook strategy (e.g. Contrarian: 'The enterprise content backlog is not bandwidth...')"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Platform Technical Specifications */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Platform Technical Specifications
              </label>
              <textarea
                rows={2}
                value={platformSpecs}
                onChange={(e) => setPlatformSpecs(e.target.value)}
                placeholder="e.g. 9:16 vertical, 1080x1920, 60fps, max 60s, kinetic captions safe zones bottom 250px"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Target KPI */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Target KPI Metric
              </label>
              <input
                type="text"
                value={targetKpi}
                onChange={(e) => setTargetKpi(e.target.value)}
                placeholder="e.g. 68% 3s Retention, CTR > 2.5%, 500+ saves"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* ================= RIGHT PANE: Workflow, Assets & QA Gate ================= */}
          <div className="lg:col-span-5 p-5 lg:p-6 overflow-y-auto space-y-5 bg-zinc-900/30">
            {/* Stage Progress & Transition Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Deterministic Pipeline Stage
                </span>
                <span className="text-xs font-bold text-indigo-400">
                  {statusLabels[asset.status]}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {asset.status === 'DRAFT_BRIEF' && (
                  <button
                    onClick={() => {
                      handleSave();
                      onAttemptTransition(asset, 'SLA_REVIEW');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Submit Brief to Stakeholder Review (SLA)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {asset.status === 'SLA_REVIEW' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => onAttemptTransition(asset, 'IN_PRODUCTION')}
                      disabled={!isCanReviewSla}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Sign-Off SLA & Advance to Production</span>
                    </button>
                    {!isCanReviewSla && (
                      <p className="text-[11px] text-amber-400 text-center">
                        ⚠️ Only Stakeholder or Content Manager can sign off SLA review.
                      </p>
                    )}
                  </div>
                )}

                {asset.status === 'IN_PRODUCTION' && (
                  <button
                    onClick={() => onAttemptTransition(asset, 'QA_GATE')}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Send Deliverable to QA Gatekeeper</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {asset.status === 'READY_TO_PUBLISH' && (
                  <button
                    onClick={() => onAttemptTransition(asset, 'PUBLISHED')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete Syndication (Mark Published)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic SLA Countdown Status (Active in SLA_REVIEW) */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              asset.status === 'SLA_REVIEW' ? slaInfo.badgeClass : 'bg-zinc-900 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>SLA Turnaround Clock</span>
                </span>
                <span className="text-xs font-mono font-bold">
                  {asset.slaHours}h Target
                </span>
              </div>

              {asset.status === 'SLA_REVIEW' ? (
                <div>
                  <div className="text-sm font-bold font-mono">
                    {slaInfo.label}
                  </div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Expires: {asset.slaExpiresAt ? new Date(asset.slaExpiresAt).toLocaleString() : 'Not set'}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400">
                  {asset.status === 'DRAFT_BRIEF' ? 'Timer initiates upon brief submission.' : 'SLA review satisfied.'}
                </div>
              )}
            </div>

            {/* Assignee & Deliverable URL */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Assigned Specialist (RACI)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Deliverable URL
                  </label>
                  {deliverableUrl && (
                    <a
                      href={deliverableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://frame.io/... or https://figma.com/..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Mandatory before advancing from Production Pod to QA Gate.
                </span>
              </div>
            </div>

            {/* QA Gatekeeper Checklist (Role-Protected) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    QA Gatekeeper Checklist
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Role: Content Manager
                </span>
              </div>

              {/* 3 Mandatory checkboxes */}
              <div className="space-y-2.5 text-xs">
                <label className="flex items-start gap-2.5 text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qaToneApproved}
                    onChange={(e) => setQaToneApproved(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>1. Brand Tone of Voice & Executive Stance verified</span>
                </label>

                <label className="flex items-start gap-2.5 text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qaSpecsValidated}
                    onChange={(e) => setQaSpecsValidated(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>2. Platform Specs & Safe Zones checked (Aspect ratio, LUFS)</span>
                </label>

                <label className="flex items-start gap-2.5 text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qaRightsCleared}
                    onChange={(e) => setQaRightsCleared(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>3. Commercial & IP Rights cleared (Fonts, B-roll, Trademark)</span>
                </label>
              </div>

              {/* Gatekeeper Signature status */}
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-400">Gatekeeper Sign-off:</span>
                  {qaGatekeeperSigned ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <Check className="h-3.5 w-3.5" /> Cleared by {asset.qaSignedByName || 'Content Manager'}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-mono text-[11px]">Pending Sign-Off</span>
                  )}
                </div>
                {qaGatekeeperSigned && asset.qaSignedAt && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Stamped: {new Date(asset.qaSignedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Role Protection Guidance */}
              {!isContentManager && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px]">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Current persona ({currentUser.role}) has view-only gatekeeper rights. Switch to Elena Vance (Content Manager) to sign off.
                  </span>
                </div>
              )}

              {/* Primary Gate Button */}
              {asset.status === 'QA_GATE' && (
                <button
                  type="button"
                  onClick={handleGatekeeperAdvance}
                  disabled={!canGatekeeperSign}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    canGatekeeperSign
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>[Sign-Off & Advance to Ready for Distribution]</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
