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
  Bot,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Trash2,
  Download,
  AlertTriangle,
  Flame,
  FileText
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
  onBatchTransition?: (assetIds: string[], targetStage: AssetStatus) => void;
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  engineUsed?: string;
  toolCalls?: CopilotToolCall[];
}

const STORAGE_CHAT_KEY = 'contentops_copilot_chat_history_v2';

export const FloatingCopilot: React.FC<FloatingCopilotProps> = ({
  context,
  assets,
  currentUser,
  onMoveAssetStage,
  onSignOffQa,
  onTriggerMultiplier,
  onFilterBoard,
  onDraftBrief,
  onBatchTransition
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerMode, setIsDrawerMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('contentops_copilot_drawer_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showBriefingBanner, setShowBriefingBanner] = useState(true);
  const [toolCallStates, setToolCallStates] = useState<Record<string, 'pending' | 'executed' | 'cancelled'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const attentionCount =
    context.pipelineSummary.breachedCount +
    context.pipelineSummary.pendingQASignoffs;

  // Initialize or restore conversation history
  const [entries, setEntries] = useState<ChatEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Online & synchronized with **Thrill ContentOps OS**.\n\nMonitoring **${context.pipelineSummary.activePipelineCount} active assets** for **${currentUser.name} (${currentUser.role})**.\n\n💡 *Pro-tip: Press **Cmd+J** or **Ctrl+J** anywhere to toggle this copilot.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Google Gemini 2.0 Flash'
      }
    ];
  });

  // Save conversation history to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries]);

  // Global Keyboard Shortcut: Cmd+J or Ctrl+J to toggle Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isOpen]);

  // Web Speech API Voice Recognition Toggle
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear Copilot conversation history?')) {
      const resetEntry: ChatEntry = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Ready for new operational commands for **${currentUser.name}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engineUsed: 'Google Gemini 2.0 Flash'
      };
      setEntries([resetEntry]);
      localStorage.removeItem(STORAGE_CHAT_KEY);
    }
  };

  const handleExportChat = () => {
    const markdown = entries
      .map((e) => `### ${e.role.toUpperCase()} (${e.timestamp})\n${e.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thrill-copilot-log-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleDrawerMode = () => {
    setIsDrawerMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('contentops_copilot_drawer_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const quickChips = [
    '⚠️ What requires my attention right now?',
    '📊 Generate executive report',
    "⚡ Split flagship Hero into 3 shorts",
    '🛡️ Audit Stage 4 QA',
    '📦 Batch-publish approved cards'
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
        engineUsed: reply.engineUsed || 'Google Gemini 2.0 Flash',
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
          content: 'Unable to reach Copilot engine relay. Please retry.',
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
          title: args.title || 'Untitled Copilot Brief',
          formatTier: (args.formatTier as FormatTier) || 'HUB',
          hookStrategy: args.hookStrategy,
          platformSpecs: args.platformSpecs
        });
      } else if (fnName === 'batch_transition_assets') {
        if (onBatchTransition && Array.isArray(args.assetIds)) {
          onBatchTransition(args.assetIds, args.targetStage as AssetStatus);
        } else if (Array.isArray(args.assetIds)) {
          args.assetIds.forEach((id: string) => onMoveAssetStage(id, args.targetStage as AssetStatus));
        }
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
        return {
          badge: 'ACTION: Advance Card',
          headline: `Move "${title}" ➔ ${args.targetStage}`,
          subline: args.reason || 'Deterministic state machine transition.'
        };
      }

      if (fnName === 'batch_transition_assets') {
        const count = Array.isArray(args.assetIds) ? args.assetIds.length : 0;
        return {
          badge: 'BATCH ACTION: Bulk Transition',
          headline: `Advance ${count} cards simultaneously ➔ ${args.targetStage}`,
          subline: args.reason || 'Batch operational transition across active pipeline.'
        };
      }

      if (fnName === 'sign_off_qa') {
        const found = assets.find((a) => a.id === args.assetId);
        const title = found ? found.title : args.assetId;
        const canSignFinal = (currentUser.role === 'CONTENT_MANAGER' || currentUser.role === 'SUPER_ADMIN') && args.finalSignoff;
        return {
          badge: 'ACTION: Stage 4 QA Sign-Off',
          headline: `Clear 4-Point QA Gatekeeper for "${title}"`,
          subline: canSignFinal
            ? `Stamp Gatekeeper Final Sign-off as ${currentUser.name} (${currentUser.role}) & advance to Stage 5.`
            : `Verify checklist items 1–3 (Final Gatekeeper Sign-off requires Content Manager / Super Admin).`
        };
      }

      if (fnName === 'trigger_multiplier') {
        const found = assets.find((a) => a.id === args.parentAssetId);
        const title = found ? found.title : args.parentAssetId;
        return {
          badge: 'ACTION: Asset Multiplier Split',
          headline: `Split "${title}" ➔ ${args.derivativeCount || 3} Child Tickets`,
          subline: 'Spawns Short-form Reel (9:16), LinkedIn Carousel (1:1), and Quote Card / X Thread in Stage 1.'
        };
      }

      if (fnName === 'filter_board') {
        return {
          badge: 'ACTION: Filter Kanban View',
          headline: `Apply Board Filter ➔ ${args.filterType}`,
          subline: 'Focuses active Kanban columns on matching operational items.'
        };
      }

      if (fnName === 'draft_brief') {
        return {
          badge: 'ACTION: Draft Creative Brief',
          headline: `Create Stage 1 Card: "${args.title}"`,
          subline: `Tier: ${args.formatTier} • Includes 3s Retention Hook Strategy.`
        };
      }

      return {
        badge: 'ACTION: Operational Command',
        headline: fnName.replace(/_/g, ' ').toUpperCase(),
        subline: JSON.stringify(args)
      };
    } catch {
      return {
        badge: 'ACTION: Unknown Command',
        headline: tc.function.name,
        subline: tc.function.arguments
      };
    }
  };

  return (
    <>
      {/* Floating Launcher Button (Bottom-Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00E599] to-[#00b377] text-[#0B0E14] shadow-2xl shadow-[#00E599]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Open Thrill Copilot (Cmd+J / Ctrl+J)"
        >
          <Sparkles className="h-6 w-6 stroke-[2.2] group-hover:rotate-12 transition-transform" />
          {attentionCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-[#FF4B55] text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0B0E14] shadow-md animate-pulse">
              {attentionCount}
            </span>
          )}
        </button>
      )}

      {/* Main Copilot Shell: Floating Dialog OR Full Height Right Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out flex flex-col bg-[#121620] border border-white/[0.12] shadow-2xl overflow-hidden ${
            isDrawerMode
              ? 'top-0 right-0 bottom-0 w-full sm:w-[540px] md:w-[600px] h-full rounded-none border-y-0 border-r-0'
              : 'bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[440px] max-w-[460px] h-[640px] max-h-[85vh] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#181E2C] border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#00E599] to-[#00b377] text-[#0B0E14] flex items-center justify-center font-bold shadow-sm">
                <Sparkles className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">Thrill Copilot</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                    GEMINI 2.0
                  </span>
                </div>
                <div className="text-[10px] text-[#8F9CAE] truncate max-w-[200px]">
                  {currentUser.name} ({currentUser.role})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-white hover:bg-[#1E2536] transition-colors cursor-pointer"
                title="Export Conversation Log (.md)"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-white hover:bg-[#1E2536] transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleDrawerMode}
                className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-white hover:bg-[#1E2536] transition-colors cursor-pointer hidden sm:block"
                title={isDrawerMode ? 'Switch to Floating Window' : 'Expand to Sidecar Drawer'}
              >
                {isDrawerMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-white hover:bg-[#1E2536] transition-colors cursor-pointer"
                title="Close (Cmd+J / Ctrl+J)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Morning Operational Briefing Banner */}
          {showBriefingBanner && (
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#181E2C] to-[#121620] border-b border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs min-w-0">
                <Flame className="h-4 w-4 text-[#F5A524] shrink-0" />
                <span className="text-[11px] text-white truncate">
                  {context.pipelineSummary.slaRisks > 0 ? (
                    <strong className="text-[#F5A524]">{context.pipelineSummary.slaRisks} SLA review(s)</strong>
                  ) : (
                    <span className="text-[#00E599]">SLA Timers Healthy</span>
                  )}
                  {' • '}
                  {context.pipelineSummary.pendingQASignoffs > 0 ? (
                    <span className="text-amber-300">{context.pipelineSummary.pendingQASignoffs} QA checks pending</span>
                  ) : (
                    <span>QA Cleared</span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBriefingBanner(false)}
                className="text-[10px] text-[#8F9CAE] hover:text-white shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Chat Stream View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex flex-col gap-1.5 ${
                  entry.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    entry.role === 'user'
                      ? 'bg-[#00E599] text-[#0B0E14] font-medium shadow-sm'
                      : 'bg-[#181E2C] text-white/90 border border-white/[0.07] shadow-md'
                  }`}
                >
                  {entry.content}
                </div>

                {/* Proposed Tool Calls (Interactive Action Cards) */}
                {entry.toolCalls && entry.toolCalls.length > 0 && (
                  <div className="w-full space-y-2 mt-1">
                    {entry.toolCalls.map((tc) => {
                      const proposal = describeProposal(tc);
                      const state = toolCallStates[tc.id] || 'pending';

                      return (
                        <div
                          key={tc.id}
                          className="bg-[#0B0E14] border border-[#00E599]/30 rounded-xl p-3 space-y-2 shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
                              {proposal.badge}
                            </span>
                            <span className="text-[10px] text-[#8F9CAE] font-mono">
                              RACI Gated
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white">
                              {proposal.headline}
                            </div>
                            <div className="text-[11px] text-[#8F9CAE] mt-0.5 leading-normal">
                              {proposal.subline}
                            </div>
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
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#00E599] hover:bg-[#00cc88] text-[#0B0E14] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Confirm &amp; Execute</span>
                              </button>
                            </div>
                          )}

                          {state === 'executed' && (
                            <div className="pt-1.5 border-t border-white/[0.07] flex items-center gap-1.5 text-[11px] font-semibold text-[#00E599]">
                              <Check className="h-3.5 w-3.5" />
                              <span>Action Executed on Live Board</span>
                            </div>
                          )}

                          {state === 'cancelled' && (
                            <div className="pt-1.5 border-t border-white/[0.07] text-[11px] text-[#8F9CAE] italic">
                              Action dismissed by operator.
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
                <span>Thrill Copilot analyzing live pipeline state...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
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

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#121620] border-t border-white/[0.08] flex items-center gap-2"
          >
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-[#FF4B55] text-white animate-pulse'
                  : 'bg-[#181E2C] text-[#8F9CAE] hover:text-white border border-white/[0.07]'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to speak command'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot (e.g., triage SLA risks, split Hero)..."
              disabled={isSending}
              className="flex-1 bg-[#181E2C] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#8F9CAE] focus:outline-none focus:border-[#00E599]/50 transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="p-2 rounded-xl bg-[#00E599] text-[#0B0E14] hover:bg-[#00cc88] disabled:opacity-40 transition-all cursor-pointer shadow-sm"
              title="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
