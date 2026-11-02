import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { ContentAsset, FormatTier, PillarType, Priority, User } from '../types';
import { generateBrief } from '../lib/aiService';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAsset: (asset: ContentAsset) => void;
  allUsers: User[];
  currentUser: User;
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  onClose,
  onCreateAsset,
  allUsers,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState<PillarType>('STRATEGY_SERIES');
  const [formatTier, setFormatTier] = useState<FormatTier>('HUB');
  const [priority] = useState<Priority>('HIGH');
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [rawIntakeNotes, setRawIntakeNotes] = useState('');
  const [hookStrategy, setHookStrategy] = useState('');
  const [platformSpecs, setPlatformSpecs] = useState('');
  const [targetKpi, setTargetKpi] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    const context = rawIntakeNotes.trim() || title.trim() || 'Enterprise ContentOps Launch Campaign';
    if (!rawIntakeNotes.trim()) {
      setRawIntakeNotes(context);
    }

    setIsGenerating(true);
    try {
      const platformTarget = platformSpecs || '1080x1920, 9:16 safe margins, -14 LUFS';
      const { result } = await generateBrief(context, formatTier, platformTarget);

      if (result.hooks && result.hooks.length > 0) {
        setHookStrategy(`${result.hooks[0].type}: "${result.hooks[0].script}"`);
      }
      if (result.technicalSpecs) {
        setPlatformSpecs(result.technicalSpecs);
      }
      if (result.targetKpi) {
        setTargetKpi(result.targetKpi);
      }
      if (!title.trim()) {
        setTitle(context.slice(0, 45).trim() + ' (Brief)');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAsset: ContentAsset = {
      id: `asset-${Date.now()}`,
      title: title.trim(),
      pillar,
      formatTier,
      status: 'DRAFT_BRIEF',
      priority,
      parentId: null,
      hookStrategy: hookStrategy.trim() || undefined,
      platformSpecs: platformSpecs.trim() || undefined,
      targetKpi: targetKpi.trim() || undefined,
      rawIntakeNotes: rawIntakeNotes.trim() || undefined,
      slaHours: 48,
      isSlaBreached: false,
      qaToneApproved: false,
      qaSpecsValidated: false,
      qaRightsCleared: false,
      qaGatekeeperSigned: false,
      deliverableUrl: null,
      attachmentCount: 0,
      isWinningFormat: false,
      paidEligible: false,
      createdById: currentUser.id,
      assignedToId: assignedToId || currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateAsset(newAsset);
    setTitle('');
    setRawIntakeNotes('');
    setHookStrategy('');
    setPlatformSpecs('');
    setTargetKpi('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00E599]/15 text-[#00E599] flex items-center justify-center border border-[#00E599]/40">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Create Content Asset Brief
              </h2>
              <p className="text-xs text-[#8F9CAE]">
                Initializes ticket in Drafting &amp; Briefs (Stage 1)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh] bg-[#0B0E14]">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Asset Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Growth Roadmap: Automated Media Operations"
              className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Format Tier, Pillar, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="INTELLIGENCE_OPTIMIZATION">Intel &amp; AI Opt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
                Assignee
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Raw Campaign Notes / Context + K2 Horizon Trigger */}
          <div className="bg-[#121620] border border-white/[0.08] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">
                Raw Campaign Notes / Context
              </label>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Generate with K2 Horizon'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={rawIntakeNotes}
              onChange={(e) => setRawIntakeNotes(e.target.value)}
              placeholder="Rough campaign bullet points or executive context..."
              className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg p-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
            />
          </div>

          {/* Hook Strategy */}
          <div>
            <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
              Hook Strategy (First 3s)
            </label>
            <input
              type="text"
              value={hookStrategy}
              onChange={(e) => setHookStrategy(e.target.value)}
              placeholder="e.g. Contrarian: 'The enterprise content backlog is not a bandwidth issue...'"
              className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Platform Specs */}
          <div>
            <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
              Platform Technical Specs
            </label>
            <input
              type="text"
              value={platformSpecs}
              onChange={(e) => setPlatformSpecs(e.target.value)}
              placeholder="e.g. 1080x1920, 9:16 safe margins, -14 LUFS"
              className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          {/* Target KPI */}
          <div>
            <label className="block text-xs text-[#8F9CAE] font-medium mb-1">
              Target KPI Benchmark
            </label>
            <input
              type="text"
              value={targetKpi}
              onChange={(e) => setTargetKpi(e.target.value)}
              placeholder="e.g. 68% 3s Retention, CTR > 2%"
              className="w-full bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00E599] hover:bg-[#00cc88] text-[#0B0E14] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Create Brief</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
