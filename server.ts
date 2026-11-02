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

  // POST /api/ai/copilot — Thrill Copilot, Briefs & Derivative Engine
  app.post('/api/ai/copilot', async (req, res) => {
    try {
      const { action, messages, context, rawNotes, formatTier, platform, macroDescription } = req.body;

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
              res.json({
                result: JSON.parse(content),
                engineUsed: `IFM.ai K2 Horizon (${model})`
              });
              return;
            }
          } catch (upstreamErr) {
            console.warn('Upstream K2 Horizon brief generation error:', upstreamErr);
          }
        }

        const topicSummary = (rawNotes || 'Enterprise Operations').slice(0, 52).trim();
        res.json({
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
        });
        return;
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
              res.json({
                derivatives: JSON.parse(content).derivatives,
                engineUsed: `IFM.ai K2 Horizon (${model})`
              });
              return;
            }
          } catch (upstreamErr) {
            console.warn('Upstream K2 Horizon derivatives error:', upstreamErr);
          }
        }

        res.json({
          derivatives: [
            { title: 'Short-form Reel: 3 Bottlenecks Killing Creative Velocity', format: 'Short-form Reel (9:16) • 1080x1920, -14 LUFS', angle: 'High-velocity 45s vertical cutdown with split-screen workflow telemetry.' },
            { title: 'LinkedIn Carousel Summary: The 5-Stage ContentOps State Machine', format: 'LinkedIn Carousel summary (1:1) • 1080x1080 Multi-Slide PDF', angle: '8-slide visual blueprint breaking down RACI governance and 48h SLA thresholds.' },
            { title: 'Quote Card & X Thread: "The Death of Unchecked Creative Drift"', format: 'Quote card / X thread • 1:1 & 16:9 Social Pack', angle: '7-post analytical thread paired with 3 high-contrast typographic quote cards.' },
            { title: 'Short-form Reel: Inside the 48-Hour SLA Review Protocol', format: 'Short-form Reel (9:16) • 1080x1920, 60fps', angle: 'Tactical 50s breakdown showing how automated SLA countdowns cut stakeholder review latency.' }
          ],
          engineUsed: 'IFM.ai K2 Horizon (Server Operational Fallback)'
        });
        return;
      }

      // 3. Copilot Assistant Command
      if (!context) {
        res.status(400).json({ error: 'Missing SystemContext payload' });
        return;
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

  // =========================================================================
  // Prompt 1: User Management, Session Context & Server-Side RBAC
  // =========================================================================
  app.post('/api/auth/sync-user', async (req, res) => {
    try {
      const { syncUser } = await import('./src/lib/auth/sync-user');
      const { id, email, name, avatarUrl } = req.body;
      const user = await syncUser({
        id,
        email,
        user_metadata: {
          name,
          avatar_url: avatarUrl,
        },
      });
      res.json({ user });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.name || 'Error', message: err.message });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const { getCurrentUser } = await import('./src/lib/auth/get-current-user');
      const user = await getCurrentUser(req);
      res.json({ user });
    } catch (err: any) {
      const status = err.statusCode || 401;
      res.status(status).json({ error: err.name || 'UnauthorizedError', message: err.message });
    }
  });

  // =========================================================================
  // Prompt 2: Deterministic State Machine Engine
  // =========================================================================
  app.post('/api/assets/transition', async (req, res) => {
    try {
      const { transitionAssetStage } = await import('./src/lib/actions/transition-stage');
      const result = await transitionAssetStage(req, req.body);
      res.json(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.name || 'TransitionError', message: err.message });
    }
  });

  // =========================================================================
  // Prompt 3: Server-Side SLA Calculation & Breach Watcher Cron
  // =========================================================================
  app.all('/api/cron/sla-check', async (req, res) => {
    try {
      const cronSecret = process.env.CRON_SECRET || 'thrill_cron_dev_secret';
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
        return;
      }

      const { getServerSupabaseClient, getServerSupabaseConfig } = await import('./src/lib/serverSupabase');
      const { calculateSLA } = await import('./src/lib/sla/calculator');
      const config = getServerSupabaseConfig();
      let updatedCount = 0;
      const evaluatedAssets: any[] = [];

      if (config.isConfigured) {
        const supabase = getServerSupabaseClient();
        const { data: assets, error } = await supabase
          .from('content_assets')
          .select('id, title, status, sla_expires_at, is_sla_breached')
          .not('status', 'in', '("READY_TO_PUBLISH","PUBLISHED")');

        if (!error && assets) {
          for (const asset of assets) {
            const sla = calculateSLA(asset.sla_expires_at);
            if (sla.isBreached && !asset.is_sla_breached) {
              await supabase
                .from('content_assets')
                .update({ is_sla_breached: true })
                .eq('id', asset.id);
              updatedCount++;
            }
            evaluatedAssets.push({
              id: asset.id,
              title: asset.title,
              isBreached: sla.isBreached,
              urgencyLevel: sla.urgencyLevel,
              hoursRemaining: sla.hoursRemaining,
            });
          }
        }
      }

      res.json({
        message: 'SLA check completed',
        timestamp: new Date().toISOString(),
        updatedBreaches: updatedCount,
        evaluated: evaluatedAssets.length,
        assets: evaluatedAssets,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // Prompt 4: Enterprise Audit Trail & Revision History
  // =========================================================================
  app.get('/api/assets/:id/activities', async (req, res) => {
    try {
      const { getAssetActivities } = await import('./src/lib/audit/logger');
      const activities = await getAssetActivities(req.params.id);
      res.json({ activities });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // Super Admin: User Directory, Invite & Magic Link Dispatch
  // =========================================================================
  app.get('/api/admin/users', async (req, res) => {
    try {
      const { assertRole } = await import('./src/lib/auth/guard');
      await assertRole(req, ['SUPER_ADMIN', 'CONTENT_MANAGER']);
      const { getAllUsers } = await import('./src/lib/auth/sync-user');
      const users = await getAllUsers();
      res.json({ users });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.name || 'Error', message: err.message });
    }
  });

  app.post('/api/admin/invite-user', async (req, res) => {
    try {
      const { assertRole } = await import('./src/lib/auth/guard');
      const currentUser = await assertRole(req, ['SUPER_ADMIN', 'CONTENT_MANAGER']);
      const { inviteUser } = await import('./src/lib/auth/sync-user');
      const { email, name, role, team, redirectTo } = req.body;
      const result = await inviteUser({
        email,
        name,
        role,
        team,
        invitedBy: currentUser.name || currentUser.email,
        redirectTo,
      });
      res.json(result);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.name || 'Error', message: err.message });
    }
  });

  app.patch('/api/admin/users/:id', async (req, res) => {
    try {
      const { assertRole } = await import('./src/lib/auth/guard');
      await assertRole(req, ['SUPER_ADMIN', 'CONTENT_MANAGER']);
      const { promoteUserToRole } = await import('./src/lib/auth/sync-user');
      const { role } = req.body;
      const updated = await promoteUserToRole(req.params.id, role);
      res.json({ user: updated });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.name || 'Error', message: err.message });
    }
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const { assertRole } = await import('./src/lib/auth/guard');
      await assertRole(req, ['SUPER_ADMIN', 'CONTENT_MANAGER']);
      const { removeUser } = await import('./src/lib/auth/sync-user');
      const success = await removeUser(req.params.id);
      res.json({ success });
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.name || 'Error', message: err.message });
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
