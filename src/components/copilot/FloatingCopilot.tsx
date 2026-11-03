import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  X, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  GitFork, 
  ArrowRight, 
  Check, 
  Filter,
  FilePlus2,
  Bot
} from 'lucide-react';
import { AssetStatus, ContentAsset, FormatTier, User } from '../../types';
import { CopilotSystemContext } from '../../hooks/useCopilotContext';
import { CopilotToolCall } from '../../lib/ai/tools';
import { sendCopilotMessage, CopilotChatMessage } from '../../lib/ai/copilotClient';

interface FloatingCopilotProps {
  context: CopilotSystemContext;
  assets: ContentAsset[];
  currentUser: User;
  onMoveAssetStage: (assetId: string, targetStage: AssetStatus) => void;
  onSignOffQa: (
    assetId: string,
    updates: {
      approveTone?: boolean;
      approveSpecs?: boolean;
      approveRights?: boolean;
      finalSignoff?: boolean;
    }
  ) => void;
  onTriggerMultiplier: (parentAssetId: string, derivativeCount?: number) => void;
  onFilterBoard: (filterType: 'ALL' | 'HERO' | 'HUB' | 'HYGIENE' | 'SLA_ACTIVE' | 'NEEDS_QA' | 'SLA_RISK') => void;
  onDraftBrief: (draft: {
    title: string;
    formatTier: FormatTier;
    hookStrategy?: string;
    platformSpecs?: string;
  }) => void;
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  engineUsed?: string;
  toolCalls?: CopilotToolCall[];
}

export const FloatingCopilot: React.FC<FloatingCopilotProps> = ({
  context,
  assets,
  currentUser,
  onMoveAssetStage,
  onSignOffQa,
  onTriggerMultiplier,
  onFilterBoard,
  onDraftBrief
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toolCallStates, setToolCallStates] = useState<Record<string, 'pending' | 'executed' | 'cancelled'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const attentionCount =
    context.pipelineSummary.breachedCount +
    context.pipelineSummary.pendingQASignoffs;

  const [entries, setEntries] = useState<ChatEntry[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Online and synchronized with **Thrill ContentOps OS**.\n\nMonitoring **${context.pipelineSummary.activePipelineCount} active assets** for **${currentUser.name} (${currentUser.role})**. Select a quick command below or ask me to audit QA gates, split HERO assets, or triage SLA risks.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engineUsed: 'IFM.ai K2 Horizon'
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isOpen]);

  const quickChips = [
    '⚠️ What requires my attention right now?',
    "⚡ Split 'Executive Briefing' into 3 shorts",
    '🛡️ Audit Stage 4 QA',
    '📊 Show capacity & SLA health'
  ];

  const handleSend = async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || isSending) return;

    if (!promptText) {
      setInput('');
    }

    const userEntry: ChatEntry = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextEntries = [...entries, userEntry];
    setEntries(nextEntries);
    setIsSending(true);

    try {
      const apiMessages: CopilotChatMessage[] = nextEntries.map((e) => ({
        role: e.role,
        content: e.content
      }));

      const reply = await sendCopilotMessage(apiMessages, context);

      const assistantEntry: ChatEntry = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: reply.engineUsed || 'IFM.ai K2 Horizon',
        toolCalls: reply.tool_calls
      };

      if (reply.tool_calls) {
        const nextStates: Record<string, 'pending' | 'executed' | 'cancelled'> = {};
        reply.tool_calls.forEach((tc) => {
          nextStates[tc.id] = 'pending';
        });
        setToolCallStates((prev) => ({ ...prev, ...nextStates }));
      }

      setEntries((prev) => [...prev, assistantEntry]);
    } catch (err) {
      setEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach K2 Horizon copilot relay. Please retry.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Execute a proposed tool call when user clicks [ Confirm & Execute ]
  const handleConfirmToolCall = (tc: CopilotToolCall) => {
    try {
      const args = JSON.parse(tc.function.arguments || '{}');
      const fnName = tc.function.name;

      if (fnName === 'move_asset_stage') {
        onMoveAssetStage(args.assetId, args.targetStage as AssetStatus);
      } else if (fnName === 'sign_off_qa') {
        onSignOffQa(args.assetId, {
          approveTone: args.approveTone,
          approveSpecs: args.approveSpecs,
          approveRights: args.approveRights,
          finalSignoff: args.finalSignoff
        });
      } else if (fnName === 'trigger_multiplier') {
        onTriggerMultiplier(args.parentAssetId, args.derivativeCount || 3);
      } else if (fnName === 'filter_board') {
        onFilterBoard(args.filterType);
      } else if (fnName === 'draft_brief') {
        onDraftBrief({
          title: args.title || 'Untitled K2 Brief',
          formatTier: (args.formatTier as FormatTier) || 'HUB',
          hookStrategy: args.hookStrategy,
          platformSpecs: args.platformSpecs
        });
      }

      setToolCallStates((prev) => ({ ...prev, [tc.id]: 'executed' }));
    } catch (err) {
      console.error('Failed to execute tool call:', err);
    }
  };

  const handleCancelToolCall = (tcId: string) => {
    setToolCallStates((prev) => ({ ...prev, [tcId]: 'cancelled' }));
  };

  // Describe a tool call for the Action Proposal Card
  const describeProposal = (tc: CopilotToolCall): {
    badge: string;
    headline: string;
    subline: string;
  } => {
    try {
      const args = JSON.parse(tc.function.arguments || '{}');
      const fnName = tc.function.name;

      if (fnName === 'move_asset_stage') {
        const found = assets.find((a) => a.id === args.assetId);
        const title = found ? found.title : args.assetId;
        const extra =
          args.targetStage === 'SLA_REVIEW'
            ? 'SLA Clock: 48 Hours will be activated.'
            : args.reason || 'Deterministic state machine transition.';
        return {
          badge: 'PROPOSED ACTION: Advance Card',
          headline: `Move "${title}" ➔ ${args.targetStage}`,
          subline: extra
        };
      }

      if (fnName === 'sign_off_qa') {
        const found = assets.find((a) => a.id === args.assetId);
        const title = found ? found.title : args.assetId;
        const canSignFinal = currentUser.role === 'CONTENT_MANAGER' && args.finalSignoff;
        return {
          badge: 'PROPOSED ACTION: Stage 4 QA Sign-Off',
          headline: `Clear 4-Point QA Gatekeeper for "${title}"`,
          subline: canSignFinal
            ? `Stamp Gatekeeper Final Sign-off as ${currentUser.name} (Content Manager) & advance to Stage 5.`
            : `Verify checklist items 1–3 (Final Gatekeeper Sign-off requires Content Manager role).`
        };
      }

      if (fnName === 'trigger_multiplier') {
        const found = assets.find((a) => a.id === args.parentAssetId);
        const title = found ? found.title : args.parentAssetId;
        return {
          badge: 'PROPOSED ACTION: Asset Multiplier Split',
          headline: `Split "${title}" ➔ ${args.derivativeCount || 3} Child Tickets`,
          subline: 'Spawns Short-form Reel (9:16), LinkedIn Carousel (1:1), and Quote Card / X Thread in Stage 1.'
        };
      }

      if (fnName === 'filter_board') {
        return {
          badge: 'PROPOSED ACTION: Filter Kanban View',
          headline: `Apply Board Filter ➔ ${args.filterType}`,
          subline: 'Focuses active Kanban columns on matching operational items.'
        };
      }

      if (fnName === 'draft_brief') {
        return {
          badge: 'PROPOSED ACTION: Initialize Brief',
          headline: `Create "${args.title}" (${args.formatTier})`,
          subline: `Specs: ${args.platformSpecs || '1080x1920, 9:16 safe margins, -14 LUFS'}`
        };
      }
    } catch {
      // fallback
    }
    return {
      badge: 'PROPOSED ACTION',
      headline: tc.function.name,
      subline: tc.function.arguments
    };
  };

  return (
    <div className="fixed bottom-10 right-6 z-50 flex flex-col items-end select-none">
      {/* Expandable Glassmorphism Chat Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Thrill Copilot Assistant"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[calc(100vh-7rem)] bg-[#0B0E14]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Drawer Header */}
          <div className="px-4 py-3.5 bg-[#121620] border-b border-white/[0.08] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-[#00E599]/15 border border-[#00E599]/40 text-[#00E599] flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00E599] animate-pulse" />
                  <h3 className="text-xs font-bold text-white truncate">
                    Thrill Copilot • K2 Horizon
                  </h3>
                </div>
                <span className="text-[10px] text-[#8F9CAE] block truncate">
                  Active Role: {currentUser.name} ({currentUser.role})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-[#181E2C] border border-white/[0.07] text-[10px] font-mono text-[#00E599] tabular-nums">
                Monitoring {context.pipelineSummary.activePipelineCount} Assets
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Thrill Copilot"
                className="p-1.5 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Live Context Bar */}
          <div className="px-4 py-1.5 bg-[#181E2C]/70 border-b border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#8F9CAE] tabular-nums">
            <span>
              Capacity: <strong className="text-white">{context.pipelineSummary.activePipelineCount}/{context.pipelineSummary.capacityLimit}</strong>
            </span>
            <span>
              SLA Risks: <strong className={context.pipelineSummary.slaRisks > 0 ? 'text-[#F5A524]' : 'text-[#00E599]'}>{context.pipelineSummary.slaRisks}</strong>
            </span>
            <span>
              Needs QA: <strong className="text-white">{context.pipelineSummary.pendingQASignoffs}</strong>
            </span>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0B0E14]">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex flex-col gap-2 ${
                  entry.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    entry.role === 'user'
                      ? 'bg-[#00E599] text-[#0B0E14] font-semibold'
                      : 'bg-[#181E2C] text-[#8F9CAE] border border-white/[0.07]'
                  }`}
                >
                  {entry.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={i} className={entry.role === 'user' ? 'font-bold text-[#0B0E14]' : 'font-semibold text-white'}>
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>

                {/* Render Human-in-the-Loop Action Proposal Cards if tool_calls exist */}
                {entry.toolCalls && entry.toolCalls.length > 0 && (
                  <div className="w-full space-y-2">
                    {entry.toolCalls.map((tc) => {
                      const state = toolCallStates[tc.id] || 'pending';
                      const desc = describeProposal(tc);

                      return (
                        <div
                          key={tc.id}
                          className="w-full rounded-xl bg-[#121620] border border-[#00E599]/40 p-3.5 space-y-2.5 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00E599] flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>{desc.badge}</span>
                            </span>
                            <span className="text-[10px] font-mono text-[#8F9CAE]">
                              Human-in-the-Loop
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{desc.headline}</span>
                            </div>
                            <p className="text-[11px] text-[#8F9CAE] leading-snug">
                              {desc.subline}
                            </p>
                          </div>

                          {state === 'pending' && (
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.07]">
                              <button
                                type="button"
                                onClick={() => handleCancelToolCall(tc.id)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#181E2C] hover:bg-[#1E2536] text-[#8F9CAE] hover:text-white border border-white/[0.07] transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmToolCall(tc)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#00E599] hover:bg-[#00cc88] text-[#0B0E14] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Confirm &amp; Execute</span>
                              </button>
                            </div>
                          )}

                          {state === 'executed' && (
                            <div className="pt-1.5 border-t border-white/[0.07] flex items-center gap-1.5 text-[11px] font-semibold text-[#00E599]">
                              <Check className="h-3.5 w-3.5" />
                              <span>Executed on Live Kanban Board</span>
                            </div>
                          )}

                          {state === 'cancelled' && (
                            <div className="pt-1.5 border-t border-white/[0.07] text-[11px] text-[#8F9CAE] italic">
                              Action cancelled by operator.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <span className="text-[10px] text-[#8F9CAE] font-mono px-1">
                  {entry.timestamp} {entry.engineUsed ? `• ${entry.engineUsed}` : ''}
                </span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#00E599] font-mono px-2">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>K2 Horizon analyzing live pipeline state...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 4 Conversation Starters (Quick Prompt Pills) */}
          <div className="px-3.5 py-2 bg-[#121620] border-t border-white/[0.07] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-lg bg-[#181E2C] hover:bg-[#1E2536] border border-white/[0.07] hover:border-[#00E599]/40 text-[11px] text-[#8F9CAE] hover:text-white whitespace-nowrap transition-all cursor-pointer shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#121620] border-t border-white/[0.07] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Thrill Copilot or issue a board command..."
              className="flex-1 bg-[#181E2C] border border-white/[0.07] focus:border-[#00E599] rounded-lg px-3 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              aria-label="Send Copilot Command"
              className="h-9 px-3 rounded-lg bg-[#00E599] hover:bg-[#00cc88] disabled:opacity-40 text-[#0B0E14] font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Bubble (Bottom-Right: 56x56px, bg #121620, crisp hairline border) */}
      <div className="flex items-center gap-2.5">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121620] border border-white/10 text-xs text-white shadow-lg hover:border-[#00E599]/40 transition-colors cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-[#00E599]" />
            <span className="font-semibold">Thrill Copilot</span>
            <span className="text-[10px] text-[#8F9CAE] font-mono">[Ask or Command]</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle Thrill Copilot"
          className="relative h-14 w-14 rounded-full bg-[#121620] text-[#00E599] border border-[#00E599]/40 hover:border-[#00E599] active:scale-95 transition-colors flex items-center justify-center cursor-pointer shadow-lg"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Zap className="h-6 w-6 fill-[#00E599]/20" />}

          {/* Unread / SLA & QA Notification Badge */}
          {attentionCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-[#F5A524] text-[#0B0E14] font-mono text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0B0E14] tabular-nums">
              {attentionCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
