import OpenAI from 'openai';
import { CopilotSystemContext } from '../../hooks/useCopilotContext';
import { getStoredAiConfig } from '../aiService';
import { COPILOT_TOOLS, CopilotResponsePayload, evaluateCopilotCommand } from './tools';

export interface CopilotChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function buildCopilotSystemPrompt(context: CopilotSystemContext): string {
  return `You are Thrill Copilot, the AI Chief of Staff and Operational Producer for Thrill.com's ContentOps OS.
You are embedded directly inside the ContentOps operating system.

CURRENT OPERATIONAL CONTEXT:
- Active Operator: ${context.currentUser.name} (Security Clearance: ${context.currentUser.role})
- Total Assets in Engine: ${context.pipelineSummary.activePipelineCount} / ${context.pipelineSummary.capacityLimit}
- SLA Risks: ${context.pipelineSummary.slaRisks} assets expiring soon (${context.pipelineSummary.breachedCount} breached)
- Pending QA Gates: ${context.pipelineSummary.pendingQASignoffs} assets awaiting sign-off
- Active Assets Snapshot: ${JSON.stringify(context.activeCards)}

YOUR CAPABILITIES & TOOLS:
1. Advise on marketing strategy, Hero/Hub/Hygiene formats, retention hooks, and cross-channel distribution.
2. Propose operational actions on the dashboard using your tools (moving cards, batch advancing, signing off QA, splitting Hero assets, filtering views, drafting briefs, reassigning owners, generating executive reports).

RULES & GOVERNANCE:
- Always format responses using clean Markdown with bolding, lists, and clear next steps.
- Respect RACI boundaries: Only Content Managers and Super Admins can stamp the final Stage 4 QA Gatekeeper sign-off.
- Only Super Admins can dispatch magic link user invitations.
- Keep responses authoritative, proactive, and concise.`;
}

export async function sendCopilotMessage(
  messages: CopilotChatMessage[],
  context: CopilotSystemContext
): Promise<CopilotResponsePayload> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // 1. Try server-side /api/ai/copilot endpoint first (Netlify / Node proxy)
  try {
    const res = await fetch('/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.content || data.tool_calls)) {
        return {
          role: 'assistant',
          content: data.content || 'Operational action proposed below:',
          tool_calls: data.tool_calls,
          engineUsed: data.engineUsed || 'Google Gemini 2.0 (Server)'
        };
      }
    }
  } catch {
    // Continue to client-side / intelligent fallback
  }

  // 2. Direct Provider Call (Google Gemini or IFM.ai via OpenAI-compatible SDK)
  const config = getStoredAiConfig();
  if (config.apiKey && config.apiKey.trim() !== '') {
    try {
      const baseURL = config.provider === 'gemini'
        ? (config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/')
        : (config.baseUrl || 'https://api.ifm.ai/v1');

      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL,
        dangerouslyAllowBrowser: true
      });

      const model = config.model || (config.provider === 'gemini' ? 'gemini-2.0-flash' : 'k2-horizon');

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: buildCopilotSystemPrompt(context) },
          ...messages
        ],
        tools: COPILOT_TOOLS as any,
        tool_choice: 'auto',
        temperature: 0.3
      });

      const msg = response.choices[0]?.message;
      if (msg) {
        return {
          role: 'assistant',
          content: msg.content || 'Proposed operational action ready for confirmation:',
          tool_calls: (msg.tool_calls as any) || undefined,
          engineUsed: config.provider === 'gemini'
            ? `Google Gemini (${model})`
            : `IFM.ai K2 Horizon (${model})`
        };
      }
    } catch (err) {
      console.warn('AI live tool call fallback:', err);
    }
  }

  // 3. High-Fidelity Domain Deterministic Operational Engine
  await new Promise((r) => setTimeout(r, 350));
  return evaluateCopilotCommand(lastUserMessage, context);
}
