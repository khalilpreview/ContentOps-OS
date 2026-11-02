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
You are embedded directly inside the Content Manager's dashboard.

CURRENT OPERATIONAL CONTEXT:
- Active User: ${context.currentUser.name} (Role: ${context.currentUser.role})
- Total Assets in Engine: ${context.pipelineSummary.activePipelineCount} / ${context.pipelineSummary.capacityLimit}
- SLA Risks: ${context.pipelineSummary.slaRisks} assets expiring soon (${context.pipelineSummary.breachedCount} breached)
- Pending QA Gates: ${context.pipelineSummary.pendingQASignoffs} assets awaiting sign-off
- Active Assets Snapshot: ${JSON.stringify(context.activeCards)}

YOUR CAPABILITIES:
1. Advise on Thrill marketing strategy, Hero/Hub/Hygiene formats, retention hooks, and cross-channel distribution.
2. Execute operational actions on the dashboard using your tools (moving cards, signing off QA, splitting Hero assets, filtering views, drafting briefs).

RULES:
- When the user asks to move a card, check or update something, use the appropriate tool.
- Respect RACI boundaries: Only approve final QA sign-offs if active user role is "CONTENT_MANAGER".
- Keep responses concise, direct, and aligned with Thrill's tone (slick, high-velocity, operational).`;
}

export async function sendCopilotMessage(
  messages: CopilotChatMessage[],
  context: CopilotSystemContext
): Promise<CopilotResponsePayload> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // 1. Try server-side /api/ai/copilot endpoint first
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
          engineUsed: data.engineUsed || 'IFM.ai K2 Horizon'
        };
      }
    }
  } catch {
    // Continue to client-side / intelligent fallback
  }

  // 2. If IFM.ai API key is configured, call OpenAI-compatible K2 Horizon endpoint with tools
  const config = getStoredAiConfig();
  if (config.apiKey && config.apiKey.trim() !== '') {
    try {
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || 'https://api.ifm.ai/v1',
        dangerouslyAllowBrowser: true
      });

      const response = await client.chat.completions.create({
        model: config.model || 'k2-horizon',
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
          engineUsed: `IFM.ai K2 Horizon (${config.model || 'k2-horizon'})`
        };
      }
    } catch (err) {
      console.warn('K2 Horizon live tool call fallback:', err);
    }
  }

  // 3. Deterministic, context-aware K2 Horizon operational engine
  await new Promise((r) => setTimeout(r, 420));
  return evaluateCopilotCommand(lastUserMessage, context);
}
