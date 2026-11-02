import OpenAI from 'openai';
import { COPILOT_TOOLS, evaluateCopilotCommand } from '../../src/lib/ai/tools';
import { buildCopilotSystemPrompt } from '../../src/lib/ai/copilotClient';

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
  headers: Record<string, string>;
}

export const handler = async (event: NetlifyEvent) => {
  // Only accept POST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {};
    const { messages, context } = parsedBody;

    if (!context) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing SystemContext payload' })
      };
    }

    const apiKey = process.env.IFM_API_KEY || process.env.VITE_IFM_API_KEY || '';
    const baseURL = process.env.IFM_BASE_URL || process.env.VITE_IFM_BASE_URL || 'https://api.ifm.ai/v1';
    const model = process.env.IFM_MODEL || process.env.VITE_IFM_MODEL || 'k2-horizon';

    if (apiKey && apiKey.trim() !== '') {
      try {
        const ifmClient = new OpenAI({ apiKey, baseURL });
        const systemPrompt = buildCopilotSystemPrompt(context);

        const response = await ifmClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...(Array.isArray(messages) ? messages : [])
          ],
          tools: COPILOT_TOOLS as any,
          tool_choice: 'auto',
          temperature: 0.3
        });

        const choice = response.choices[0]?.message;
        if (choice) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'assistant',
              content: choice.content || 'Operational action proposed:',
              tool_calls: choice.tool_calls,
              engineUsed: `IFM.ai K2 Horizon (${model})`
            })
          };
        }
      } catch (upstreamErr) {
        console.warn('Upstream K2 Horizon error in Netlify function, falling back to operational engine:', upstreamErr);
      }
    }

    // Context-aware operational engine fallback
    const lastUserMsg = Array.isArray(messages)
      ? [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
      : '';
    const result = evaluateCopilotCommand(lastUserMsg, context);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error: any) {
    console.error('Netlify Copilot Function Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
