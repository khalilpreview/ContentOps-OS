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
    const { action, messages, context, rawNotes, formatTier, platform, macroDescription } = parsedBody;

    const apiKey = process.env.IFM_API_KEY || process.env.VITE_IFM_API_KEY || '';
    const baseURL = process.env.IFM_BASE_URL || process.env.VITE_IFM_BASE_URL || 'https://api.ifm.ai/v1';
    const model = process.env.IFM_MODEL || process.env.VITE_IFM_MODEL || 'k2-horizon';

    // 1. Brief Generation Action
    if (action === 'generate_brief') {
      if (apiKey && apiKey.trim() !== '') {
        try {
          const ifmClient = new OpenAI({ apiKey, baseURL });
          const prompt = `Campaign Notes:\n${rawNotes || ''}\n\nFormat Tier: ${formatTier || 'HUB'}\nTarget Platform: ${platform || 'Cross-Platform'}\n\nGenerate:\n1) Three distinct hook variations (Contrarian, Curiosity, Direct Value).\n2) Platform technical specifications (include 1080x1920, 9:16 safe margins, -14 LUFS).\n3) Recommended Target KPI benchmark.`;
          const response = await ifmClient.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are an enterprise ContentOps strategist. Transform rough campaign notes into structured, high-retention creative briefs. Reply with a JSON object: {"hooks": [{"type": "string", "script": "string"}], "technicalSpecs": "string", "targetKpi": "string"}`
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3
          });
          const content = response.choices[0]?.message?.content;
          if (content) {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                result: JSON.parse(content),
                engineUsed: `IFM.ai K2 Horizon (${model})`
              })
            };
          }
        } catch (upstreamErr) {
          console.warn('Upstream K2 Horizon brief generation error:', upstreamErr);
        }
      }

      const topicSummary = (rawNotes || 'Enterprise Operations').slice(0, 52).trim();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: {
            hooks: [
              { type: 'Contrarian', script: `Most enterprise leaders treat "${topicSummary}" as a creative bandwidth issue—it is actually a missing state machine.` },
              { type: 'Curiosity', script: `Why the highest-performing content teams replaced manual reviews with a 48-hour SLA protocol for "${topicSummary}".` },
              { type: 'Direct Value', script: `The 3-step operational framework to master "${topicSummary}" and cut stakeholder review latency by 80%.` }
            ],
            technicalSpecs: '1080x1920, 9:16 safe margins (bottom 250px caption zone), 60fps ProRes/H.264, audio normalized to -14 LUFS.',
            targetKpi: '68% 3-Second Retention Rate, >4.5% CTR on primary CTA, 500+ qualified saves.'
          },
          engineUsed: 'IFM.ai K2 Horizon (Server Operational Fallback)'
        })
      };
    }

    // 2. Asset Multiplier Derivative Action
    if (action === 'generate_derivatives') {
      if (apiKey && apiKey.trim() !== '') {
        try {
          const ifmClient = new OpenAI({ apiKey, baseURL });
          const response = await ifmClient.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are a content repurposing producer. Reply with JSON: {"derivatives": [{"title": "string", "format": "string", "angle": "string"}]}`
              },
              { role: 'user', content: `Macro Content Context:\n${macroDescription || ''}\n\nProvide 4 derivative child ticket specifications.` }
            ],
            temperature: 0.4
          });
          const content = response.choices[0]?.message?.content;
          if (content) {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                derivatives: JSON.parse(content).derivatives,
                engineUsed: `IFM.ai K2 Horizon (${model})`
              })
            };
          }
        } catch (upstreamErr) {
          console.warn('Upstream K2 Horizon derivatives error:', upstreamErr);
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          derivatives: [
            { title: 'Short-form Reel: 3 Bottlenecks Killing Creative Velocity', format: 'Short-form Reel (9:16) • 1080x1920, -14 LUFS', angle: 'High-velocity 45s vertical cutdown with split-screen workflow telemetry.' },
            { title: 'LinkedIn Carousel Summary: The 5-Stage ContentOps State Machine', format: 'LinkedIn Carousel summary (1:1) • 1080x1080 Multi-Slide PDF', angle: '8-slide visual blueprint breaking down RACI governance and 48h SLA thresholds.' },
            { title: 'Quote Card & X Thread: "The Death of Unchecked Creative Drift"', format: 'Quote card / X thread • 1:1 & 16:9 Social Pack', angle: '7-post analytical thread paired with 3 high-contrast typographic quote cards.' },
            { title: 'Short-form Reel: Inside the 48-Hour SLA Review Protocol', format: 'Short-form Reel (9:16) • 1080x1920, 60fps', angle: 'Tactical 50s breakdown showing how automated SLA countdowns cut stakeholder review latency.' }
          ],
          engineUsed: 'IFM.ai K2 Horizon (Server Operational Fallback)'
        })
      };
    }

    // 3. Default Copilot Action
    if (!context) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing SystemContext payload' })
      };
    }

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
