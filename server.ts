import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import OpenAI from 'openai';
import { COPILOT_TOOLS, evaluateCopilotCommand } from './src/lib/ai/tools';
import { buildCopilotSystemPrompt } from './src/lib/ai/copilotClient';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // POST /api/ai/copilot — Thrill Copilot K2 Horizon Endpoint
  app.post('/api/ai/copilot', async (req, res) => {
    try {
      const { messages, context } = req.body;
      if (!context) {
        res.status(400).json({ error: 'Missing SystemContext payload' });
        return;
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
            res.json({
              role: 'assistant',
              content: choice.content || 'Operational action proposed:',
              tool_calls: choice.tool_calls,
              engineUsed: `IFM.ai K2 Horizon (${model})`
            });
            return;
          }
        } catch (upstreamErr) {
          console.warn('Upstream K2 Horizon error, using context-aware operational engine:', upstreamErr);
        }
      }

      // Context-aware operational engine
      const lastUserMsg = Array.isArray(messages)
        ? [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
        : '';
      const result = evaluateCopilotCommand(lastUserMsg, context);
      res.json(result);
    } catch (error: any) {
      console.error('Copilot API Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa'
    });

    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (result && result.code) {
          const patched = result.code
            .replace(
              'transport.connect(createHMRHandler(handleMessage));',
              '/* HMR WebSocket disabled */'
            )
            .replace(
              /reject\(\/\* @__PURE__ \*\/ new Error\("WebSocket closed without opened\."\)\);/g,
              'resolve();'
            );
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.status(200).send(patched);
          return;
        }
      } catch (_err) {
        // Fallback to default vite middleware if transformRequest fails
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Thrill ContentOps OS Server running on http://localhost:${PORT}`);
  });
}

startServer();
