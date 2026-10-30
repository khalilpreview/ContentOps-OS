import React, { useState } from 'react';
import { X, Sparkles, Plus, FileText, Cpu, ArrowRight } from 'lucide-react';
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
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [rawIntakeNotes, setRawIntakeNotes] = useState('');
  const [hookStrategy, setHookStrategy] = useState('');
  const [platformSpecs, setPlatformSpecs] = useState('');
  const [targetKpi, setTargetKpi] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    if (!rawIntakeNotes.trim()) {
      alert('Please enter some intake notes first to generate with K2 Horizon.');
      return;
    }

    setIsGenerating(true);
    try {
      const platformTarget = platformSpecs || (formatTier === 'HERO' ? 'Keynote & 16:9 Master' : '9:16 Vertical Video');
      const { result } = await generateBrief(rawIntakeNotes, formatTier, platformTarget);

      if (result.hooks && result.hooks.length > 0) {
        setHookStrategy(`${result.hooks[0].type}: ${result.hooks[0].script}`);
      }
      if (result.technicalSpecs) {
        setPlatformSpecs(result.technicalSpecs);
      }
      if (result.targetKpi) {
        setTargetKpi(result.targetKpi);
      }
      if (!title) {
        setTitle(rawIntakeNotes.slice(0, 45).trim() + ' (Brief)');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a title for the new asset.');
      return;
    }

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
      isWinningFormat: false,
      paidEligible: false,
      createdById: currentUser.id,
      assignedToId: assignedToId || currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateAsset(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#13151c] border border-[#252837] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#252837] bg-[#181a24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#4ff8ac]/15 text-[#4ff8ac] flex items-center justify-center border border-[#4ff8ac]/30">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Create Content Asset Brief
              </h2>
              <p className="text-xs text-[#8b93a7]">
                Initializes ticket in Drafting & Briefs (Stage 1)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#10121a] hover:bg-[#1e212e] text-[#8b93a7] hover:text-white border border-[#252837] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Asset Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Growth Roadmap: Automated Media Operations"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Format Tier, Pillar, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <option value="INTELLIGENCE_OPTIMIZATION">Intel & AI Opt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-medium mb-1">
                Assignee
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intake Notes + AI Trigger */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200">
                Campaign Intake Notes
              </label>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
              >
                <Sparkles className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Synthesizing...' : '✨ K2 Horizon Auto-Fill'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={rawIntakeNotes}
              onChange={(e) => setRawIntakeNotes(e.target.value)}
              placeholder="Rough bullet points or notes..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Hook Strategy */}
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">
              Hook Strategy (First 3s)
            </label>
            <input
              type="text"
              value={hookStrategy}
              onChange={(e) => setHookStrategy(e.target.value)}
              placeholder="e.g. Curiosity: 'Why enterprise content teams fail at scaling without a state machine...'"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Platform Specs */}
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">
              Platform Technical Specs
            </label>
            <input
              type="text"
              value={platformSpecs}
              onChange={(e) => setPlatformSpecs(e.target.value)}
              placeholder="e.g. 9:16 vertical (1080x1920) 60s max"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Target KPI */}
          <div>
            <label className="block text-xs text-zinc-400 font-medium mb-1">
              Target KPI
            </label>
            <input
              type="text"
              value={targetKpi}
              onChange={(e) => setTargetKpi(e.target.value)}
              placeholder="e.g. 65% 3s Retention, CTR > 2%"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-[#252837]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#10121a] hover:bg-[#1e212e] text-[#8b93a7] hover:text-white border border-[#252837] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#4ff8ac] hover:bg-[#38ef98] text-[#0f1118] shadow-md shadow-[#4ff8ac]/20 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Brief</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
