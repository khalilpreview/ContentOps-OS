import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStatusTransition, canToggleGatekeeperSignOff } from './stateMachine';
import { calculateSla, isSlaRiskAsset, isNeedsMySignOffAsset, evaluatePostLaunchRetention } from './sla';
import { buildCopilotContext } from '../hooks/useCopilotContext';
import { evaluateCopilotCommand } from './ai/tools';
import { INITIAL_ASSETS } from './seedData';
import { ContentAsset, User } from '../types';

const contentManager: User = {
  id: 'u1',
  name: 'Elena Vance',
  email: 'elena@enterprise.internal',
  role: 'CONTENT_MANAGER'
};

const creativeSpecialist: User = {
  id: 'u2',
  name: 'Marcus Chen',
  email: 'marcus@enterprise.internal',
  role: 'CREATIVE_SPECIALIST'
};

const stakeholder: User = {
  id: 'u3',
  name: 'Sarah Sterling',
  email: 'sarah@enterprise.internal',
  role: 'STAKEHOLDER'
};

const sampleAsset: ContentAsset = {
  id: 'asset-1',
  title: 'AI Workflows Keynote 2026',
  pillar: 'STRATEGY_SERIES',
  formatTier: 'HERO',
  status: 'DRAFT_BRIEF',
  priority: 'HIGH',
  hookStrategy: 'Contrarian: Stop automating low-value tasks',
  platformSpecs: '1080x1920, 9:16 safe margins, -14 LUFS',
  targetKpi: '65% Retention, >50k shares',
  rawIntakeNotes: 'Enterprise architecture shift notes',
  slaHours: 48,
  isSlaBreached: false,
  qaToneApproved: false,
  qaSpecsValidated: false,
  qaRightsCleared: false,
  qaGatekeeperSigned: false,
  deliverableUrl: null,
  isWinningFormat: false,
  paidEligible: false,
  createdById: 'u1',
  assignedToId: 'u2',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

test('Transition 1: DRAFT_BRIEF -> SLA_REVIEW requires mandatory brief fields', () => {
  const incompleteAsset = { ...sampleAsset, hookStrategy: '' };
  const resFail = validateStatusTransition(incompleteAsset, 'SLA_REVIEW', creativeSpecialist);
  assert.equal(resFail.allowed, false);
  assert.match(resFail.reason || '', /Hook Strategy/);

  const now = new Date('2026-10-30T12:00:00Z');
  const resSuccess = validateStatusTransition(sampleAsset, 'SLA_REVIEW', creativeSpecialist, now);
  assert.equal(resSuccess.allowed, true);
  assert.ok(resSuccess.updatedAsset?.slaExpiresAt);
  const expires = new Date(resSuccess.updatedAsset!.slaExpiresAt!);
  assert.equal(expires.toISOString(), '2026-11-01T12:00:00.000Z');
});

test('Transition 2: SLA_REVIEW -> IN_PRODUCTION requires STAKEHOLDER or CONTENT_MANAGER', () => {
  const reviewingAsset = {
    ...sampleAsset,
    status: 'SLA_REVIEW' as const,
    slaStartedAt: '2026-10-30T10:00:00Z',
    slaExpiresAt: '2026-11-01T10:00:00Z'
  };

  const fail = validateStatusTransition(reviewingAsset, 'IN_PRODUCTION', creativeSpecialist);
  assert.equal(fail.allowed, false);
  assert.match(fail.reason || '', /RACI Gate Block/);

  const passStakeholder = validateStatusTransition(reviewingAsset, 'IN_PRODUCTION', stakeholder);
  assert.equal(passStakeholder.allowed, true);
  assert.equal(passStakeholder.updatedAsset?.status, 'IN_PRODUCTION');

  const passManager = validateStatusTransition(reviewingAsset, 'IN_PRODUCTION', contentManager);
  assert.equal(passManager.allowed, true);
});

test('Transition 3: IN_PRODUCTION -> QA_GATE requires deliverable URL', () => {
  const inProdAsset = { ...sampleAsset, status: 'IN_PRODUCTION' as const, deliverableUrl: null };
  const fail = validateStatusTransition(inProdAsset, 'QA_GATE', creativeSpecialist);
  assert.equal(fail.allowed, false);
  assert.match(fail.reason || '', /Deliverable link missing/);

  const withUrl = { ...inProdAsset, deliverableUrl: 'https://figma.com/file/xyz' };
  const pass = validateStatusTransition(withUrl, 'QA_GATE', creativeSpecialist);
  assert.equal(pass.allowed, true);
  assert.equal(pass.updatedAsset?.status, 'QA_GATE');
});

test('Transition 4: QA_GATE -> READY_TO_PUBLISH enforces 4-point VETO BLOCK and CONTENT_MANAGER role', () => {
  assert.equal(canToggleGatekeeperSignOff(contentManager), true);
  assert.equal(canToggleGatekeeperSignOff(creativeSpecialist), false);
  assert.equal(canToggleGatekeeperSignOff(stakeholder), false);

  const qaAsset = {
    ...sampleAsset,
    status: 'QA_GATE' as const,
    deliverableUrl: 'https://figma.com/file/xyz',
    qaToneApproved: true,
    qaSpecsValidated: false,
    qaRightsCleared: true,
    qaGatekeeperSigned: true
  };

  const failChecklist = validateStatusTransition(qaAsset, 'READY_TO_PUBLISH', contentManager);
  assert.equal(failChecklist.allowed, false);
  assert.match(failChecklist.reason || '', /VETO BLOCK/);
  assert.match(failChecklist.reason || '', /Safe Zones/);

  const unsignedAsset = { ...qaAsset, qaSpecsValidated: true, qaGatekeeperSigned: false };
  const failUnsigned = validateStatusTransition(unsignedAsset, 'READY_TO_PUBLISH', contentManager);
  assert.equal(failUnsigned.allowed, false);
  assert.match(failUnsigned.reason || '', /Gatekeeper Final Sign-off/);

  const completeChecks = { ...qaAsset, qaSpecsValidated: true, qaGatekeeperSigned: true };
  const failRole = validateStatusTransition(completeChecks, 'READY_TO_PUBLISH', creativeSpecialist);
  assert.equal(failRole.allowed, false);
  assert.match(failRole.reason || '', /Only a CONTENT_MANAGER/);

  const pass = validateStatusTransition(completeChecks, 'READY_TO_PUBLISH', contentManager);
  assert.equal(pass.allowed, true);
  assert.equal(pass.updatedAsset?.status, 'READY_TO_PUBLISH');
  assert.equal(pass.updatedAsset?.qaSignedById, 'u1');
});

test('SLA clock calculations: >24h green, 1h-24h gold warning, and <0h breached states', () => {
  const baseAsset: ContentAsset = {
    ...sampleAsset,
    status: 'SLA_REVIEW',
    slaStartedAt: '2026-10-30T00:00:00Z',
    slaExpiresAt: '2026-11-01T00:00:00Z'
  };

  const clock1 = calculateSla(baseAsset, new Date('2026-10-30T10:00:00Z'));
  assert.equal(clock1.status, 'ON_TRACK');
  assert.equal(clock1.isBreached, false);
  assert.equal(clock1.hoursRemaining, 38);
  assert.equal(clock1.label, '38h remaining');

  const clock2 = calculateSla(baseAsset, new Date('2026-10-31T12:00:00Z'));
  assert.equal(clock2.status, 'WARNING');
  assert.equal(clock2.isBreached, false);
  assert.equal(clock2.hoursRemaining, 12);
  assert.equal(clock2.label, '12h remaining');

  const clock3 = calculateSla(baseAsset, new Date('2026-11-01T03:00:00Z'));
  assert.equal(clock3.status, 'BREACHED');
  assert.equal(clock3.isBreached, true);
  assert.equal(clock3.label, 'SLA BREACHED: -3h');
});

test('Quick filters and Phase 5 post-launch retention evaluation', () => {
  const qaUnsigned: ContentAsset = {
    ...sampleAsset,
    status: 'QA_GATE',
    qaGatekeeperSigned: false
  };
  assert.equal(isNeedsMySignOffAsset(qaUnsigned, contentManager), true);
  assert.equal(isNeedsMySignOffAsset(qaUnsigned, creativeSpecialist), false);

  const slaRiskAsset: ContentAsset = {
    ...sampleAsset,
    status: 'SLA_REVIEW',
    slaExpiresAt: '2026-10-30T18:00:00Z'
  };
  assert.equal(isSlaRiskAsset(slaRiskAsset, new Date('2026-10-30T10:00:00Z')), true);

  const winEval = evaluatePostLaunchRetention(72);
  assert.equal(winEval.isWinningFormat, true);
  assert.equal(winEval.paidEligible, true);
  assert.equal(winEval.badgeLabel, '🏆 WINNING FORMAT');

  const normalEval = evaluatePostLaunchRetention(55);
  assert.equal(normalEval.isWinningFormat, false);
  assert.equal(normalEval.paidEligible, false);
  assert.equal(normalEval.badgeLabel, null);
});

test('Thrill Copilot context hydration & tool-calling command evaluation', () => {
  const ctx = buildCopilotContext({ assets: INITIAL_ASSETS }, contentManager);
  assert.equal(ctx.currentUser.role, 'CONTENT_MANAGER');
  assert.equal(ctx.pipelineSummary.activePipelineCount, 8);
  assert.equal(ctx.pipelineSummary.capacityLimit, 25);
  assert.equal(ctx.pipelineSummary.pendingQASignoffs, 1);
  assert.ok(ctx.pipelineSummary.slaRisks >= 2);

  // Test 1: "What requires my attention right now?"
  const resAttention = evaluateCopilotCommand('⚠️ What requires my attention right now?', ctx);
  assert.ok(resAttention.tool_calls && resAttention.tool_calls.length > 0);
  assert.equal(resAttention.tool_calls![0].function.name, 'filter_board');

  // Test 2: "Split 'Executive Briefing' into 3 shorts"
  const resSplit = evaluateCopilotCommand("⚡ Split 'Executive Briefing' into 3 shorts", ctx);
  assert.ok(resSplit.tool_calls && resSplit.tool_calls.length > 0);
  assert.equal(resSplit.tool_calls![0].function.name, 'trigger_multiplier');
  const splitArgs = JSON.parse(resSplit.tool_calls![0].function.arguments);
  assert.equal(splitArgs.derivativeCount, 3);

  // Test 3: "Audit Stage 4 QA"
  const resQa = evaluateCopilotCommand('🛡️ Audit Stage 4 QA', ctx);
  assert.ok(resQa.tool_calls && resQa.tool_calls.length > 0);
  assert.equal(resQa.tool_calls![0].function.name, 'sign_off_qa');
});
