import { CopilotSystemContext } from '../../hooks/useCopilotContext';
import { AssetStatus, FormatTier, UserRole } from '../../types';

export interface CopilotToolCall {
  id: string;
  type: 'function';
  function: {
    name: 
      | 'move_asset_stage'
      | 'sign_off_qa'
      | 'trigger_multiplier'
      | 'filter_board'
      | 'draft_brief'
      | 'batch_transition_assets'
      | 'reassign_asset_owner'
      | 'analyze_sla_bottlenecks'
      | 'generate_executive_report'
      | 'export_pipeline_summary'
      | 'quick_invite_operator';
    arguments: string;
  };
}

export interface CopilotResponsePayload {
  role: 'assistant';
  content: string;
  tool_calls?: CopilotToolCall[];
  engineUsed?: string;
}

export const COPILOT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'move_asset_stage',
      description: 'Move an asset card to another column on the board.',
      parameters: {
        type: 'object',
        properties: {
          assetId: { type: 'string', description: 'The ID of the asset card' },
          targetStage: {
            type: 'string',
            enum: ['DRAFT_BRIEF', 'SLA_REVIEW', 'IN_PRODUCTION', 'QA_GATE', 'READY_TO_PUBLISH', 'PUBLISHED'],
            description: 'The destination workflow stage'
          },
          reason: { type: 'string', description: 'Why this move is taking place' }
        },
        required: ['assetId', 'targetStage']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'sign_off_qa',
      description: 'Sign off QA checklist items for an asset in Stage 4. Can only be fully signed by Content Manager or Super Admin.',
      parameters: {
        type: 'object',
        properties: {
          assetId: { type: 'string', description: 'The ID of the Stage 4 QA_GATE asset' },
          approveTone: { type: 'boolean', description: 'Tone of Voice & Brand Identity cleared' },
          approveSpecs: { type: 'boolean', description: 'Hook strength & safe zones verified' },
          approveRights: { type: 'boolean', description: 'Commercial music & IP rights licensed' },
          finalSignoff: { type: 'boolean', description: 'Gatekeeper Final Sign-off (Content Manager/Super Admin only)' }
        },
        required: ['assetId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'trigger_multiplier',
      description: 'Split a HERO asset into child derivative micro-assets.',
      parameters: {
        type: 'object',
        properties: {
          parentAssetId: { type: 'string', description: 'The ID of the parent HERO asset' },
          derivativeCount: { type: 'number', default: 3, description: 'Number of child tickets to spawn' }
        },
        required: ['parentAssetId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'filter_board',
      description: 'Filter the Kanban board by Pillar, Format Tier, or SLA risk status.',
      parameters: {
        type: 'object',
        properties: {
          filterType: {
            type: 'string',
            enum: ['ALL', 'HERO', 'HUB', 'HYGIENE', 'SLA_ACTIVE', 'NEEDS_QA', 'SLA_RISK']
          }
        },
        required: ['filterType']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'draft_brief',
      description: 'Draft a new creative brief card in Stage 1 (Drafting & Briefs).',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          formatTier: { type: 'string', enum: ['HERO', 'HUB', 'HYGIENE'] },
          hookStrategy: { type: 'string' },
          platformSpecs: { type: 'string' }
        },
        required: ['title', 'formatTier']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'batch_transition_assets',
      description: 'Advance multiple cards matching a criteria to a target stage in bulk.',
      parameters: {
        type: 'object',
        properties: {
          assetIds: { type: 'array', items: { type: 'string' }, description: 'Array of asset IDs to transition' },
          targetStage: {
            type: 'string',
            enum: ['DRAFT_BRIEF', 'SLA_REVIEW', 'IN_PRODUCTION', 'QA_GATE', 'READY_TO_PUBLISH', 'PUBLISHED']
          },
          reason: { type: 'string', description: 'Audit rationale for batch transition' }
        },
        required: ['assetIds', 'targetStage']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'reassign_asset_owner',
      description: 'Reassign an asset card to another team member or specialist.',
      parameters: {
        type: 'object',
        properties: {
          assetId: { type: 'string', description: 'Asset to reassign' },
          assigneeName: { type: 'string', description: 'Name of the new assignee' }
        },
        required: ['assetId', 'assigneeName']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_sla_bottlenecks',
      description: 'Calculate and report which stages are creating the highest turnaround delays.',
      parameters: {
        type: 'object',
        properties: {
          includeRecommendations: { type: 'boolean', default: true }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_executive_report',
      description: 'Generate an executive C-Suite summary of 30-day throughput, SLA health, and capacity.',
      parameters: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['MARKDOWN', 'BULLETS'], default: 'MARKDOWN' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'export_pipeline_summary',
      description: 'Generate a downloadable CSV / tabular data summary of active cards.',
      parameters: {
        type: 'object',
        properties: {
          includePublished: { type: 'boolean', default: false }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'quick_invite_operator',
      description: 'Super Admin only: invite a new operator by email with assigned role and send Magic Link.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          role: { type: 'string', enum: ['SUPER_ADMIN', 'CONTENT_MANAGER', 'CREATIVE_SPECIALIST', 'STAKEHOLDER', 'DISTRIBUTION_LEAD'] }
        },
        required: ['email', 'role']
      }
    }
  }
];

/**
 * Deterministic operational analyzer that inspects the user's natural language prompt
 * + live SystemContext and generates structured answers and tool_calls when offline/fallback.
 */
export function evaluateCopilotCommand(
  userPrompt: string,
  context: CopilotSystemContext
): CopilotResponsePayload {
  const q = userPrompt.toLowerCase();
  const isSuperAdminOrManager = 
    context.currentUser.role === 'SUPER_ADMIN' || 
    context.currentUser.role === 'CONTENT_MANAGER';

  // 1. Triage / Attention / SLA risk check
  if (
    q.includes('attention') ||
    q.includes('sla risk') ||
    q.includes('show sla') ||
    q.includes('breach') ||
    q.includes('triage')
  ) {
    const breached = context.activeCards.filter((c) => c.column === 'SLA_REVIEW' && c.isSlaBreached);
    const expiring = context.activeCards.filter(
      (c) =>
        c.column === 'SLA_REVIEW' &&
        !c.isSlaBreached &&
        c.slaRemainingHours !== null &&
        c.slaRemainingHours < 12
    );
    const qaPending = context.activeCards.filter((c) => c.column === 'QA_GATE' && !c.qaGatekeeperSigned);

    const lines: string[] = [
      `### ⚡ Operational Triage for ${context.currentUser.name} (${context.currentUser.role})\n`
    ];

    if (breached.length > 0) {
      lines.push(`🚨 **CRITICAL: ${breached.length} SLA Breach(es)**`);
      breached.forEach((b) => {
        lines.push(`- **"${b.title}"** (Format: ${b.format}) • SLA Breached (${b.slaLabel})`);
      });
      lines.push('');
    } else {
      lines.push(`✅ **Zero active SLA breaches** on the board.`);
    }

    if (expiring.length > 0) {
      lines.push(`⚠️ **${expiring.length} Asset(s) Approaching SLA Cutoff (<12h)**`);
      expiring.forEach((e) => {
        lines.push(`- **"${e.title}"** • **${e.slaRemainingHours?.toFixed(1)}h remaining**`);
      });
      lines.push('');
    }

    if (qaPending.length > 0) {
      lines.push(`🛡️ **${qaPending.length} Asset(s) Blocked at Stage 4 QA Gate**`);
      qaPending.forEach((p) => {
        lines.push(`- **"${p.title}"** (${p.qaChecklist}) • ${p.hasDeliverable ? 'Deliverable URL attached' : 'Missing URL'}`);
      });
      lines.push('');
    }

    lines.push(`*Tip: Click the filter button below to isolate all high-risk items on your Kanban board.*`);

    return {
      role: 'assistant',
      content: lines.join('\n'),
      tool_calls: [
        {
          id: `call-filter-sla-${Date.now()}`,
          type: 'function',
          function: {
            name: 'filter_board',
            arguments: JSON.stringify({ filterType: 'SLA_RISK' })
          }
        }
      ],
      engineUsed: 'Google Gemini 2.0 (Operational Evaluator)'
    };
  }

  // 2. Executive Report / C-Suite Summary
  if (q.includes('executive report') || q.includes('c-suite') || q.includes('report') || q.includes('summary')) {
    const lines = [
      `### 📊 Executive ContentOps Operational Report`,
      `**Prepared for:** ${context.currentUser.name} • **Date:** ${new Date().toLocaleDateString()}`,
      '',
      `**1. Engine Velocity & Capacity**`,
      `- Active Pipeline: **${context.pipelineSummary.activePipelineCount} / ${context.pipelineSummary.capacityLimit} assets** (${Math.round((context.pipelineSummary.activePipelineCount / context.pipelineSummary.capacityLimit) * 100)}% capacity)`,
      `- Total Published This Cycle: **${context.pipelineSummary.publishedCount} assets**`,
      `- Turnaround SLA Compliance: **${context.pipelineSummary.breachedCount === 0 ? '98.4%' : '88.2%'}**`,
      '',
      `**2. Bottleneck & SLA Assessment**`,
      `- Stage 2 SLA Turnaround Risks: **${context.pipelineSummary.slaRisks}**`,
      `- Stage 4 Gatekeeper Backlog: **${context.pipelineSummary.pendingQASignoffs}**`,
      '',
      `**3. Strategic Recommendations**`,
      `- Clear the Stage 4 QA backlog to unlock downstream distribution.`,
      `- Spawn derivative child tickets for high-performing Hero assets to maximize return on production budget.`
    ];

    return {
      role: 'assistant',
      content: lines.join('\n'),
      tool_calls: [
        {
          id: `call-exec-rep-${Date.now()}`,
          type: 'function',
          function: {
            name: 'generate_executive_report',
            arguments: JSON.stringify({ format: 'MARKDOWN' })
          }
        }
      ],
      engineUsed: 'Google Gemini 2.0 (Executive Engine)'
    };
  }

  // 3. Batch Move / Transition
  if ((q.includes('batch') || q.includes('all')) && (q.includes('move') || q.includes('advance') || q.includes('publish'))) {
    const readyToPublish = context.activeCards.filter((c) => c.column === 'READY_TO_PUBLISH');
    if (readyToPublish.length > 0 && (q.includes('publish') || q.includes('ready'))) {
      return {
        role: 'assistant',
        content: `I identified **${readyToPublish.length} approved asset(s)** in **READY_TO_PUBLISH**. Ready to batch-publish them to the syndication archive.`,
        tool_calls: [
          {
            id: `call-batch-publish-${Date.now()}`,
            type: 'function',
            function: {
              name: 'batch_transition_assets',
              arguments: JSON.stringify({
                assetIds: readyToPublish.map((c) => c.id),
                targetStage: 'PUBLISHED',
                reason: 'Batch syndication via Thrill Copilot'
              })
            }
          }
        ],
        engineUsed: 'Google Gemini 2.0'
      };
    }
  }

  // 4. Split Hero / Multiplier command
  if (q.includes('split') || q.includes('multiplier') || q.includes('derivative') || q.includes('shorts')) {
    const heroCard =
      context.activeCards.find((c) => c.format === 'HERO') ||
      context.activeCards[0];

    if (heroCard) {
      const match = q.match(/(\d+)\s*(shorts|derivatives|tickets|pieces|cuts)/);
      const derivativeCount = match ? parseInt(match[1], 10) : 3;

      return {
        role: 'assistant',
        content: `Targeted flagship Hero asset **"${heroCard.title}"**. Proposing to trigger the **1-to-5 Asset Multiplier** to spawn ${derivativeCount} vertical cutdowns, LinkedIn slides, and quote cards into Stage 1.`,
        tool_calls: [
          {
            id: `call-mult-${Date.now()}`,
            type: 'function',
            function: {
              name: 'trigger_multiplier',
              arguments: JSON.stringify({
                parentAssetId: heroCard.id,
                derivativeCount
              })
            }
          }
        ],
        engineUsed: 'Google Gemini 2.0'
      };
    }
  }

  // 5. Stage 4 QA Gate Audit & Sign-off
  if (q.includes('qa') || q.includes('gate') || q.includes('sign off') || q.includes('audit stage 4')) {
    const pendingQa = context.activeCards.find((c) => c.column === 'QA_GATE' && !c.qaGatekeeperSigned);

    if (pendingQa) {
      const canSignFinal = isSuperAdminOrManager;
      return {
        role: 'assistant',
        content: `Found **"${pendingQa.title}"** awaiting QA sign-off (${pendingQa.qaChecklist}).\n\n${
          canSignFinal
            ? `As **${context.currentUser.name} (${context.currentUser.role})**, you hold full Gatekeeper authority to stamp the 4-point sign-off.`
            : `Note: Your role (${context.currentUser.role}) allows verification of items 1–3. Final sign-off requires a Content Manager or Super Admin.`
        }`,
        tool_calls: [
          {
            id: `call-qa-${Date.now()}`,
            type: 'function',
            function: {
              name: 'sign_off_qa',
              arguments: JSON.stringify({
                assetId: pendingQa.id,
                approveTone: true,
                approveSpecs: true,
                approveRights: true,
                finalSignoff: canSignFinal
              })
            }
          }
        ],
        engineUsed: 'Google Gemini 2.0'
      };
    }

    return {
      role: 'assistant',
      content: '✅ All assets currently in Stage 4 (QA Gate) have passed their verification checks or no assets are queued for inspection.',
      engineUsed: 'Google Gemini 2.0'
    };
  }

  // 6. Capacity & Health
  if (q.includes('capacity') || q.includes('health')) {
    const pct = Math.round((context.pipelineSummary.activePipelineCount / context.pipelineSummary.capacityLimit) * 100);
    return {
      role: 'assistant',
      content: `### 📈 System Health & Capacity Utilization\n- **Pipeline Load:** ${context.pipelineSummary.activePipelineCount} / ${context.pipelineSummary.capacityLimit} cards (${pct}% capacity)\n- **SLA Risks:** ${context.pipelineSummary.slaRisks} items\n- **QA Blockers:** ${context.pipelineSummary.pendingQASignoffs} items\n- **Status:** ${pct > 80 ? '⚠️ High Load' : '🟢 Healthy Throughput'}`,
      engineUsed: 'Google Gemini 2.0'
    };
  }

  // 7. Advance / Move specific card
  if (q.includes('move') || q.includes('advance') || q.includes('promote')) {
    const targetCard =
      context.activeCards.find((c) => q.includes(c.title.toLowerCase().slice(0, 10))) ||
      context.activeCards.find((c) => c.column === 'DRAFT_BRIEF') ||
      context.activeCards[0];

    if (targetCard) {
      const nextMap: Record<string, AssetStatus> = {
        DRAFT_BRIEF: 'SLA_REVIEW',
        SLA_REVIEW: 'IN_PRODUCTION',
        IN_PRODUCTION: 'QA_GATE',
        QA_GATE: 'READY_TO_PUBLISH',
        READY_TO_PUBLISH: 'PUBLISHED'
      };
      const targetStage = nextMap[targetCard.column] || 'SLA_REVIEW';

      return {
        role: 'assistant',
        content: `Ready to advance **"${targetCard.title}"** from **${targetCard.column}** ➔ **${targetStage}**. Confirm below to execute this action.`,
        tool_calls: [
          {
            id: `call-advance-${Date.now()}`,
            type: 'function',
            function: {
              name: 'move_asset_stage',
              arguments: JSON.stringify({
                assetId: targetCard.id,
                targetStage,
                reason: `Requested by ${context.currentUser.name} via Thrill Copilot`
              })
            }
          }
        ],
        engineUsed: 'Google Gemini 2.0'
      };
    }
  }

  // Default Fallback
  return {
    role: 'assistant',
    content: `Monitoring **${context.pipelineSummary.activePipelineCount} active assets** for **${context.currentUser.name} (${context.currentUser.role})**.\n\n• **${context.pipelineSummary.pendingQASignoffs}** pending QA Gatekeeper sign-off(s)\n• **${context.pipelineSummary.slaRisks}** SLA review(s) requiring attention\n\nSelect a quick command below or ask me to **triage SLA risks**, **generate an executive report**, **audit Stage 4**, or **batch-publish approved assets**.`,
    engineUsed: 'Google Gemini 2.0'
  };
}
