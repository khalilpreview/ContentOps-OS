import React, { useState } from 'react';
import { 
  X, 
  GitFork, 
  Sparkles, 
  Plus, 
  Film, 
  FileText, 
  Quote, 
  Layers, 
  Check, 
  ArrowRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { ContentAsset, DerivativeIdea, User } from '../types';
import { generateDerivatives } from '../lib/aiService';

interface AssetMultiplierModalProps {
  parentAsset: ContentAsset;
  onClose: () => void;
  onSpawnChildren: (newChildren: Partial<ContentAsset>[]) => void;
  currentUser: User;
}

export const AssetMultiplierModal: React.FC<AssetMultiplierModalProps> = ({
  parentAsset,
  onClose,
  onSpawnChildren,
  currentUser
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiEngineLabel, setAiEngineLabel] = useState<string | null>(null);
  const [customDerivatives, setCustomDerivatives] = useState<DerivativeIdea[]>([]);
  const [selectedDerivatives, setSelectedDerivatives] = useState<number[]>([]);
  const [spawnedCount, setSpawnedCount] = useState<number | null>(null);

  // One-click presets
  const handleSpawnClips = () => {
    const clips: Partial<ContentAsset>[] = [
      {
        title: `↳ Clip #1: The Core Thesis (${parentAsset.title.slice(0, 32)}...)`,
        description: 'High-energy 45s cutdown capturing the opening contrarian hook and problem statement.',
        pillar: parentAsset.pillar,
        formatTier: 'HUB',
        status: 'DRAFT_BRIEF',
        priority: 'HIGH',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: '9:16 Vertical (1080x1920) @ 60fps, max 45s, kinetic subtitles bottom-third.',
        hookStrategy: 'Curiosity: "Why your team is struggling with content velocity."',
        targetKpi: '65% 3s Retention, >10k views',
        rawIntakeNotes: `Derivative from macro hero asset: ${parentAsset.title}. Section: Opening Hook.`
      },
      {
        title: `↳ Clip #2: The Framework Breakdown (${parentAsset.title.slice(0, 32)}...)`,
        description: 'Mid-funnel tactical clip walking through the core state machine steps.',
        pillar: parentAsset.pillar,
        formatTier: 'HUB',
        status: 'DRAFT_BRIEF',
        priority: 'MEDIUM',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: '9:16 Vertical (1080x1920) @ 60fps, max 60s, animated diagram overlay.',
        hookStrategy: 'Direct Value: "The exact 5-step process we used to eliminate review bottlenecks."',
        targetKpi: '15% Share rate, 300+ bookmarks',
        rawIntakeNotes: `Derivative from macro hero asset: ${parentAsset.title}. Section: Technical Framework.`
      },
      {
        title: `↳ Clip #3: The Final Executive Takeaway (${parentAsset.title.slice(0, 32)}...)`,
        description: 'Closing call to action clip focused on ROI and team governance.',
        pillar: parentAsset.pillar,
        formatTier: 'HUB',
        status: 'DRAFT_BRIEF',
        priority: 'MEDIUM',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: '9:16 Vertical (1080x1920) @ 60fps, max 30s.',
        hookStrategy: 'Contrarian: "Stop buying more tools until you fix your approval gates."',
        targetKpi: '4% CTR on bio link, 150 downloads',
        rawIntakeNotes: `Derivative from macro hero asset: ${parentAsset.title}. Section: Executive Conclusion.`
      }
    ];

    onSpawnChildren(clips);
    setSpawnedCount(3);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleSpawnCarousel = () => {
    const carousel: Partial<ContentAsset>[] = [
      {
        title: `↳ Visual Carousel Blueprint: ${parentAsset.title.slice(0, 40)}`,
        description: 'Multi-slide visual teardown converting key keynote slides into a high-retention LinkedIn document carousel.',
        pillar: parentAsset.pillar,
        formatTier: 'HUB',
        status: 'DRAFT_BRIEF',
        priority: 'MEDIUM',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: 'Multi-slide PDF Document (1080x1350) 8-10 slides, 4:5 ratio, high contrast typography.',
        hookStrategy: 'Curiosity: "We audited 50 enterprise content workflows. Here are the 5 patterns we found."',
        targetKpi: '5.2% CTR, >800 document downloads',
        rawIntakeNotes: `Derivative from macro hero asset: ${parentAsset.title}. Converting key deck slides to carousel.`
      }
    ];

    onSpawnChildren(carousel);
    setSpawnedCount(1);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleSpawnQuotes = () => {
    const quoteSeries: Partial<ContentAsset>[] = [
      {
        title: `↳ Quote Card Pack (3x): Contrarian Insights from ${parentAsset.title.slice(0, 30)}`,
        description: 'Typographic static card pack highlighting key executive quotes for social feeds.',
        pillar: parentAsset.pillar,
        formatTier: 'HYGIENE',
        status: 'DRAFT_BRIEF',
        priority: 'LOW',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: '1:1 Square (1080x1080) & 16:9 Landscape (1920x1080) Figma exports.',
        hookStrategy: 'Direct Value: Key executive punchline quotes.',
        targetKpi: '25k impressions, 200 reshares',
        rawIntakeNotes: `Derivative from macro hero asset: ${parentAsset.title}. Quote pullouts.`
      }
    ];

    onSpawnChildren(quoteSeries);
    setSpawnedCount(1);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  // Trigger IFM.ai K2 Horizon AI Repurposing
  const handleExtractWithAi = async () => {
    setIsGeneratingAi(true);
    try {
      const context = `${parentAsset.title}\n\nNotes:\n${parentAsset.rawIntakeNotes || parentAsset.description || ''}`;
      const { derivatives, engineUsed } = await generateDerivatives(context);

      setAiEngineLabel(engineUsed);
      setCustomDerivatives(derivatives);
      setSelectedDerivatives(derivatives.map((_, i) => i)); // select all by default
    } catch (err: any) {
      console.error('Failed to extract derivatives:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const toggleSelectDerivative = (idx: number) => {
    setSelectedDerivatives((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSpawnSelected = () => {
    if (selectedDerivatives.length === 0) return;

    const children: Partial<ContentAsset>[] = selectedDerivatives.map((idx) => {
      const d = customDerivatives[idx];
      return {
        title: d.title.startsWith('↳') ? d.title : `↳ ${d.title}`,
        description: `Angle: ${d.angle}`,
        pillar: parentAsset.pillar,
        formatTier: 'HUB',
        status: 'DRAFT_BRIEF',
        priority: 'MEDIUM',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: d.format,
        hookStrategy: `Angle: ${d.angle}`,
        targetKpi: 'Target: >5k views, 60% retention',
        rawIntakeNotes: `AI-extracted derivative from ${parentAsset.title}. Format: ${d.format}. Angle: ${d.angle}`
      };
    });

    onSpawnChildren(children);
    setSpawnedCount(children.length);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#13151c] border border-[#252837] rounded-3xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#252837] bg-[#181a24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#4ff8ac]/15 text-[#4ff8ac] flex items-center justify-center border border-[#4ff8ac]/30">
              <GitFork className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Asset Multiplier Engine</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg bg-[#4ff8ac]/15 text-[#4ff8ac] border border-[#4ff8ac]/30">
                  Macro ➔ Micro Repurposing
                </span>
              </h2>
              <p className="text-xs text-[#8b93a7]">
                Generate derivative child assets inheriting context from parent Hero deliverable
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#10121a] hover:bg-[#1e212e] text-[#8b93a7] hover:text-white border border-[#252837] transition-colors"
            aria-label="Close Asset Multiplier"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Parent Context Banner */}
          <div className="bg-[#181a24] border border-[#252837] rounded-2xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b93a7] font-mono text-[11px]">Parent Macro Asset Context:</span>
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-800">
                HERO Tier
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">
              {parentAsset.title}
            </h3>
            <p className="text-xs text-[#8b93a7] line-clamp-2">
              {parentAsset.rawIntakeNotes || parentAsset.description || 'No raw notes attached.'}
            </p>
          </div>

          {/* Section 1: One-Click Instant Generators */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              1-Click Standard Repurposing Packs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: 3x Short-Form Clips */}
              <button
                type="button"
                onClick={handleSpawnClips}
                className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-3.5 text-left transition-all flex flex-col gap-2 group cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Film className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-indigo-300">
                    + 3x Short-Form Clips
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    9:16 vertical cutdowns (Thesis, Framework, Takeaway)
                  </p>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 mt-auto flex items-center gap-1">
                  <span>Spawn 3 Tickets</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>

              {/* Option 2: 1x Carousel Summary */}
              <button
                type="button"
                onClick={handleSpawnCarousel}
                className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-purple-500/50 rounded-xl p-3.5 text-left transition-all flex flex-col gap-2 group cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-purple-300">
                    + 1x Carousel Summary
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Multi-slide visual PDF / LinkedIn Document (1080x1350)
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-400 mt-auto flex items-center gap-1">
                  <span>Spawn 1 Ticket</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>

              {/* Option 3: 1x Quote Card Series */}
              <button
                type="button"
                onClick={handleSpawnQuotes}
                className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-3.5 text-left transition-all flex flex-col gap-2 group cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Quote className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300">
                    + 1x Quote Card Pack
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Set of 3 static graphic pull-quotes (1:1 & 16:9)
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 mt-auto flex items-center gap-1">
                  <span>Spawn 1 Ticket</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: AI Repurposing Extractor (K2 Horizon) */}
          <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/50 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>AI Repurposing Extractor (IFM.ai K2 Horizon)</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Analyze macro notes to synthesize 3 bespoke high-impact micro formats
                </p>
              </div>

              <button
                type="button"
                onClick={handleExtractWithAi}
                disabled={isGeneratingAi}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Cpu className={`h-3.5 w-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Analyzing with K2 Horizon...' : '✨ Extract Derivatives'}</span>
              </button>
            </div>

            {aiEngineLabel && (
              <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                <span>Model:</span>
                <span className="font-semibold text-amber-200">{aiEngineLabel}</span>
              </div>
            )}

            {/* Generated suggestions list */}
            {customDerivatives.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-zinc-300">
                  Select derivative items to spawn into the pipeline:
                </span>
                <div className="space-y-2">
                  {customDerivatives.map((item, idx) => {
                    const isSelected = selectedDerivatives.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSelectDerivative(idx)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-zinc-900 border-amber-500/60 ring-1 ring-amber-500/20'
                            : 'bg-zinc-950 border-zinc-800 opacity-70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDerivative(idx)}
                          className="mt-1 h-4 w-4 rounded bg-zinc-950 border-zinc-700 text-amber-600"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-100">{item.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {item.format}
                            </span>
                          </div>
                          <p className="text-zinc-400 mt-1 text-[11px]">{item.angle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSpawnSelected}
                  disabled={selectedDerivatives.length === 0}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Spawn {selectedDerivatives.length} Selected Derivatives</span>
                </button>
              </div>
            )}
          </div>

          {/* Success banner */}
          {spawnedCount !== null && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                Successfully spawned {spawnedCount} child derivative asset(s) linked to {parentAsset.title}!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
