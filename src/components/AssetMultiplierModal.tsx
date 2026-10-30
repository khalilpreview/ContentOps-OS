import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitFork, 
  Sparkles, 
  Plus, 
  Film, 
  FileText, 
  Quote, 
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
  onSpawnChildren
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiEngineLabel, setAiEngineLabel] = useState<string | null>('IFM.ai K2 Horizon');
  const [customDerivatives, setCustomDerivatives] = useState<DerivativeIdea[]>([
    {
      title: `Short-form Reel: 3 Bottlenecks Killing Creative Velocity`,
      format: 'Short-form Reel (9:16)',
      angle: 'High-velocity 45s vertical cutdown of the opening contrarian hook with 1080x1920 safe margins and -14 LUFS audio.'
    },
    {
      title: `LinkedIn Carousel Summary: The 5-Stage ContentOps State Machine`,
      format: 'LinkedIn Carousel summary (1:1)',
      angle: '8-slide visual blueprint breaking down RACI governance, 48h SLA thresholds, and QA gatekeeper veto locks.'
    },
    {
      title: `Quote Card & X Thread: "The Death of Unchecked Creative Drift"`,
      format: 'Quote card / X thread',
      angle: '7-post analytical thread paired with 3 high-contrast typographic quote cards highlighting executive takeaways.'
    }
  ]);
  const [selectedDerivatives, setSelectedDerivatives] = useState<number[]>([0, 1, 2]);
  const [spawnedCount, setSpawnedCount] = useState<number | null>(null);

  // Trigger IFM.ai K2 Horizon AI Repurposing
  const handleExtractWithAi = async () => {
    setIsGeneratingAi(true);
    try {
      const context = `${parentAsset.title}\n\nNotes:\n${parentAsset.rawIntakeNotes || parentAsset.description || ''}`;
      const { derivatives, engineUsed } = await generateDerivatives(context);

      setAiEngineLabel(engineUsed);
      setCustomDerivatives(derivatives);
      setSelectedDerivatives(derivatives.map((_, i) => i));
    } catch (err: any) {
      console.error('Failed to extract derivatives:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    // Auto-populate tailored derivatives on open
    handleExtractWithAi();
  }, [parentAsset.id]);

  const toggleSelectDerivative = (idx: number) => {
    setSelectedDerivatives((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleCreateChildTickets = () => {
    if (selectedDerivatives.length === 0) return;

    const children: Partial<ContentAsset>[] = selectedDerivatives.map((idx) => {
      const d = customDerivatives[idx];
      return {
        title: d.title.replace(/^↳\s*/, ''),
        description: `Angle: ${d.angle}`,
        pillar: parentAsset.pillar,
        formatTier: d.format.toLowerCase().includes('quote') ? 'HYGIENE' : 'HUB',
        status: 'DRAFT_BRIEF',
        priority: 'HIGH',
        parentId: parentAsset.id,
        parentTitle: parentAsset.title,
        platformSpecs: d.format.includes('9:16')
          ? '1080x1920, 9:16 safe margins, -14 LUFS'
          : d.format,
        hookStrategy: `Direct Value: "${d.angle}"`,
        targetKpi: '68% 3s Retention Rate, >5k targeted views',
        rawIntakeNotes: `Derivative of HERO asset: ${parentAsset.title}. Format: ${d.format}. Angle: ${d.angle}`
      };
    });

    onSpawnChildren(children);
    setSpawnedCount(children.length);
    setTimeout(() => {
      onClose();
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#181E2C] border border-white/[0.07] rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00E599]/15 text-[#00E599] flex items-center justify-center border border-[#00E599]/40">
              <GitFork className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Asset Multiplier Engine</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40">
                  HERO ➔ Child Derivatives
                </span>
              </h2>
              <p className="text-xs text-[#8F9CAE]">
                Pass parent HERO context to IFM K2 Horizon to spawn derivative tickets in Stage 1
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
            aria-label="Close Asset Multiplier"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh] bg-[#0B0E14]">
          {/* Parent Context Banner */}
          <div className="bg-[#121620] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8F9CAE] font-mono text-[11px]">Parent HERO Asset:</span>
              <span className="text-[#F5A524] font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md bg-[#F5A524]/15 border border-[#F5A524]/40">
                HERO TIER
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">
              {parentAsset.title}
            </h3>
            <p className="text-xs text-[#8F9CAE] line-clamp-2">
              {parentAsset.rawIntakeNotes || parentAsset.description || 'Macro campaign asset.'}
            </p>
          </div>

          {/* K2 Horizon Derivative Concepts */}
          <div className="border border-white/[0.08] rounded-xl p-4 bg-[#121620] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#00E599]" />
                  <span>K2 Horizon Child Ticket Concepts ({customDerivatives.length})</span>
                </h4>
                <p className="text-[11px] text-[#8F9CAE]">
                  Short-form Reel (9:16), LinkedIn Carousel summary (1:1), and Quote card / X thread
                </p>
              </div>

              <button
                type="button"
                onClick={handleExtractWithAi}
                disabled={isGeneratingAi}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181E2C] hover:bg-[#1E2536] text-[#00E599] border border-[#00E599]/40 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Cpu className={`h-3.5 w-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Synthesizing...' : '✨ Regenerate with K2 Horizon'}</span>
              </button>
            </div>

            {aiEngineLabel && (
              <div className="text-[11px] text-[#00E599] font-mono flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
                <span>Engine: {aiEngineLabel}</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {customDerivatives.map((item, idx) => {
                const isSelected = selectedDerivatives.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectDerivative(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#181E2C] border-[#00E599]/50'
                        : 'bg-[#181E2C]/50 border-white/[0.05] opacity-65'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectDerivative(idx)}
                      className="mt-1 h-4 w-4 rounded accent-[#00E599]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-white">{item.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#121620] text-[#00E599] border border-[#00E599]/30">
                          {item.format}
                        </span>
                      </div>
                      <p className="text-[#8F9CAE] mt-1 text-[11px]">{item.angle}</p>
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <GitFork className="h-3 w-3 text-[#00E599]" />
                        <span>↳ Derivative of: {parentAsset.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCreateChildTickets}
              disabled={selectedDerivatives.length === 0}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#00E599] text-[#0B0E14] font-semibold hover:bg-[#00cc88] disabled:opacity-50 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Create Child Tickets ({selectedDerivatives.length})</span>
            </button>
          </div>

          {spawnedCount !== null && (
            <div className="p-3 rounded-lg bg-[#00E599]/15 border border-[#00E599]/40 text-[#00E599] text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Created {spawnedCount} child tickets in Stage 1 (Drafting &amp; Briefs) with ↳ Derivative of: {parentAsset.title}!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
