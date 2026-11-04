import { CopilotSystemContext } from '../../hooks/useCopilotContext';
import { AssetStatus } from '../../types';

export interface CopilotToolCall {
  id: string;
  type: 'function';
  function: {
    name: 'move_asset_stage' | 'sign_off_qa' | 'trigger_multiplier' | 'filter_board' | 'draft_brief';
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
      description: 'Sign off QA checklist items for an asset in Stage 4. Can only be fully signed by Content Manager.',
      parameters: {
        type: 'object',
        properties: {
          assetId: { type: 'string', description: 'The ID of the Stage 4 QA_GATE asset' },
          approveTone: { type: 'boolean', description: 'Tone of Voice & Brand Identity cleared' },
          approveSpecs: { type: 'boolean', description: 'Hook strength & safe zones verified' },
          approveRights: { type: 'boolean', description: 'Commercial music & IP rights licensed' },
          finalSignoff: { type: 'boolean', description: 'Gatekeeper Final Sign-off (Content Manager only)' }
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
      description: 'Draft a new creative brief card in Stage 1 (Drafting & Briefs) with K2 Horizon.',
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
  }
];

/**
 * Deterministic operational analyzer that inspects the user's natural language prompt
 * + live SystemContext and generates structured answers and tool_calls when K2 Horizon
 * is running in local/emulated mode or when the user clicks quick-action chips.
 */
export function evaluateCopilotCommand(
  userPrompt: string,
  context: CopilotSystemContext
): CopilotResponsePayload {
  const q = userPrompt.toLowerCase();
  const isContentManager = context.currentUser.role === 'CONTENT_MANAGER';

  // 1. Check for "What requires my attention" / "SLA risk" / "attention"
  if (
    q.includes('attention') ||
    q.includes('sla risk') ||
    q.includes('show sla') ||
    q.includes('breach')
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
      `**Operational Triage for ${context.currentUser.name} (${context.currentUser.role}):**`
    ];

    if (breached.length > 0) {
      lines.push(
        `• 🔴 **SLA Breached (${breached.length}):** "${breached[0].title}" (${breached[0].slaLabel}) requires immediate stakeholder escalation or sign-off.`
      );
    }
    if (expiring.length > 0) {
      lines.push(
        `• 🟡 **Expiring Today (${expiring.length}):** "${expiring[0].title}" has **${expiring[0].slaLabel}** before SLA breach.`
      );
    }
    if (qaPending.length > 0) {
      lines.push(
        `• 🛡️ **Stage 4 QA Gate (${qaPending.length}):** "${qaPending[0].title}" is at **${qaPending[0].qaChecklist}** awaiting Gatekeeper sign-off.`
      );
    }

    const toolCalls: CopilotToolCall[] = [
      {
        id: `call-filter-${Date.now()}`,
        type: 'function',
        function: {
          name: 'filter_board',
          arguments: JSON.stringify({ filterType: 'SLA_RISK' })
        }
      }
    ];

    if (breached.length > 0 && (isContentManager || context.currentUser.role === 'STAKEHOLDER')) {
      toolCalls.push({
        id: `call-move-${Date.now() + 1}`,
        type: 'function',
        function: {
          name: 'move_asset_stage',
          arguments: JSON.stringify({
            assetId: breached[0].id,
            targetStage: 'IN_PRODUCTION',
            reason: 'Clear breached SLA review window and advance to Production Pod'
          })
        }
      });
    }

    return {
      role: 'assistant',
      content: lines.join('\n'),
      tool_calls: toolCalls,
      engineUsed: 'IFM.ai K2 Horizon'
    };
  }

  // 2. Check for "Split" / "Multiplier" / "shorts" / "clips"
  if (q.includes('split') || q.includes('multiplier') || q.includes('shorts') || q.includes('clips')) {
    const matchedHero =
      context.activeCards.find(
        (c) =>
          c.format === 'HERO' &&
          (q.includes('executive') ? c.title.toLowerCase().includes('executive') : true)
      ) ||
      context.activeCards.find((c) => c.format === 'HERO') ||
      context.activeCards[0];

    if (matchedHero) {
      return {
        role: 'assistant',
        content: `I've prepared a **3-ticket Derivative Split** for **"${matchedHero.title}"** using K2 Horizon:\n• **Short-form Reel (9:16)** — 1080x1920, -14 LUFS\n• **LinkedIn Carousel summary (1:1)** — 8-slide visual breakdown\n• **Quote card / X thread** — Contrarian executive hooks\n\nConfirm below to spawn all 3 child tickets in **Stage 1 (Drafting & Briefs)**.`,
        tool_calls: [
          {
            id: `call-split-${Date.now()}`,
            type: 'function',
            function: {
              name: 'trigger_multiplier',
              arguments: JSON.stringify({
                parentAssetId: matchedHero.id,
                derivativeCount: 3
              })
            }
          }
        ],
        engineUsed: 'IFM.ai K2 Horizon'
      };
    }
  }

  // 3. Check for "Audit Stage 4 QA" / "QA" / "Sign off" / "Gatekeeper"
  if (q.includes('qa') || q.includes('audit') || q.includes('sign') || q.includes('gatekeeper')) {
    const qaCard =
      context.activeCards.find((c) => c.column === 'QA_GATE') || context.activeCards[0];

    if (qaCard) {
      const roleNote = isContentManager
        ? `As **Content Manager**, you have full RACI authority to clear the remaining checks and stamp the **Gatekeeper Final Sign-off**.`
        : `⚠️ **RACI Lock Notice:** Your active role is **${context.currentUser.role}**. You can verify items 1–3, but **Gatekeeper Final Sign-off** requires an authorized **Content Manager** or **Super Administrator**.`;

      return {
        role: 'assistant',
        content: `**Stage 4 QA Gatekeeper Audit — "${qaCard.title}":**\n• Current Progress: **${qaCard.qaChecklist}**\n• Deliverable Attached: **${qaCard.hasDeliverable ? 'Verified ✓' : 'Missing'}**\n\n${roleNote}`,
        tool_calls: [
          {
            id: `call-qa-${Date.now()}`,
            type: 'function',
            function: {
              name: 'sign_off_qa',
              arguments: JSON.stringify({
                assetId: qaCard.id,
                approveTone: true,
                approveSpecs: true,
                approveRights: true,
                finalSignoff: isContentManager
              })
            }
          }
        ],
        engineUsed: 'IFM.ai K2 Horizon'
      };
    }
  }

  // 4. Check for "capacity" / "health" / "status" / "summary"
  if (q.includes('capacity') || q.includes('health') || q.includes('status') || q.includes('summary')) {
    const { activePipelineCount, capacityLimit, slaRisks, breachedCount, pendingQASignoffs, publishedCount } =
      context.pipelineSummary;
    const utilization = Math.round((activePipelineCount / capacityLimit) * 100);

    return {
      role: 'assistant',
      content: `**Thrill ContentOps Engine Telemetry:**\n• **Sprint Capacity:** ${activePipelineCount} / ${capacityLimit} Active Assets (${utilization}% load)\n• **SLA Health:** ${slaRisks} at risk (${breachedCount} breached, ${Math.max(0, slaRisks - breachedCount)} expiring <12h)\n• **QA Gatekeeper Queue:** ${pendingQASignoffs} awaiting Content Manager sign-off\n• **Syndication Archive:** ${publishedCount} published deliverables`,
      tool_calls: [
        {
          id: `call-filter-all-${Date.now()}`,
          type: 'function',
          function: {
            name: 'filter_board',
            arguments: JSON.stringify({ filterType: 'ALL' })
          }
        }
      ],
      engineUsed: 'IFM.ai K2 Horizon'
    };
  }

  // 5. Check for "Draft Brief" / "Create" / "New Brief"
  if (q.includes('draft') || q.includes('brief') || q.includes('launch')) {
    return {
      role: 'assistant',
      content: `I've structured a new high-retention brief for **"Thrill Q4 VIP Tournament Launch"** with K2 Horizon hooks and 9:16 vertical specs (` + '`1080x1920, 9:16 safe margins, -14 LUFS`' + `). Confirm below to insert it into **Stage 1: Drafting & Briefs**.`,
      tool_calls: [
        {
          id: `call-draft-${Date.now()}`,
          type: 'function',
          function: {
            name: 'draft_brief',
            arguments: JSON.stringify({
              title: 'Thrill Q4 VIP Tournament: Sub-Second Settlement Reel',
              formatTier: 'HERO',
              hookStrategy: 'Contrarian: "90% of gaming platforms fake instant payouts. Here is live on-chain settlement telemetry."',
              platformSpecs: '1080x1920, 9:16 safe margins, -14 LUFS'
            })
          }
        }
      ],
      engineUsed: 'IFM.ai K2 Horizon'
    };
  }

  // 6. Check for moving/advancing a card
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
        content: `Ready to advance **"${targetCard.title}"** from **${targetCard.column}** to **${targetStage}**. Confirm below to execute the state transition.`,
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
        engineUsed: 'IFM.ai K2 Horizon'
      };
    }
  }

  // Default contextual response
  return {
    role: 'assistant',
    content: `Monitoring **${context.pipelineSummary.activePipelineCount} active assets** as **${context.currentUser.name} (${context.currentUser.role})**.\n\n• **${context.pipelineSummary.pendingQASignoffs}** asset(s) in Stage 4 awaiting QA sign-off\n• **${context.pipelineSummary.slaRisks}** SLA review(s) requiring attention\n\nAsk me to **audit Stage 4 QA**, **split a HERO asset into 3 shorts**, **filter by SLA risks**, or **advance a card**.`,
    engineUsed: 'IFM.ai K2 Horizon'
  };
}
