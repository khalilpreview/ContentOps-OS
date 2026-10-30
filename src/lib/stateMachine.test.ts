import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStatusTransition } from './stateMachine';
import { calculateSla } from './sla';
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

const distributionLead: User = {
  id: 'u4',
  name: 'Devon Ross',
  email: 'devon@enterprise.internal',
  role: 'DISTRIBUTION_LEAD'
};

const sampleAsset: ContentAsset = {
  id: 'asset-1',
  title: 'AI Workflows Keynote 2026',
  pillar: 'STRATEGY_SERIES',
  formatTier: 'HERO',
  status: 'DRAFT_BRIEF',
  priority: 'HIGH',
  hookStrategy: 'Contrarian: Stop automating low-value tasks',
  platformSpecs: '16:9 4K 60fps & 9:16 cutdowns',
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
  // Incomplete brief
  const incompleteAsset = { ...sampleAsset, hookStrategy: '' };
  const resFail = validateStatusTransition(incompleteAsset, 'SLA_REVIEW', creativeSpecialist);
  assert.equal(resFail.allowed, false);
  assert.match(resFail.reason || '', /Hook Strategy/);

  // Complete brief
  const now = new Date('2026-10-30T12:00:00Z');
  const resSuccess = validateStatusTransition(sampleAsset, 'SLA_REVIEW', creativeSpecialist, now);
  assert.equal(resSuccess.allowed, true);
  assert.ok(resSuccess.updatedAsset?.slaExpiresAt);
  // 48 hours later
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

  // Creative specialist cannot approve SLA
  const fail = validateStatusTransition(reviewingAsset, 'IN_PRODUCTION', creativeSpecialist);
  assert.equal(fail.allowed, false);
  assert.match(fail.reason || '', /RACI Gate Block/);

  // Stakeholder can approve
  const passStakeholder = validateStatusTransition(reviewingAsset, 'IN_PRODUCTION', stakeholder);
  assert.equal(passStakeholder.allowed, true);
  assert.equal(passStakeholder.updatedAsset?.status, 'IN_PRODUCTION');

  // Content Manager can approve
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

test('Transition 4: QA_GATE -> READY_TO_PUBLISH enforces VETO BLOCK and CONTENT_MANAGER role', () => {
  const qaAsset = {
    ...sampleAsset,
    status: 'QA_GATE' as const,
    deliverableUrl: 'https://figma.com/file/xyz',
    qaToneApproved: true,
    qaSpecsValidated: false, // missing!
    qaRightsCleared: true,
    qaGatekeeperSigned: true
  };

  // Blocked due to incomplete checklist
  const failChecklist = validateStatusTransition(qaAsset, 'READY_TO_PUBLISH', contentManager);
  assert.equal(failChecklist.allowed, false);
  assert.match(failChecklist.reason || '', /VETO BLOCK/);
  assert.match(failChecklist.reason || '', /Platform Specs/);

  // All checks satisfied, but non-manager user attempts to sign off
  const completeChecks = { ...qaAsset, qaSpecsValidated: true };
  const failRole = validateStatusTransition(completeChecks, 'READY_TO_PUBLISH', creativeSpecialist);
  assert.equal(failRole.allowed, false);
  assert.match(failRole.reason || '', /Only a CONTENT_MANAGER/);

  // Satisfied by Content Manager
  const pass = validateStatusTransition(completeChecks, 'READY_TO_PUBLISH', contentManager);
  assert.equal(pass.allowed, true);
  assert.equal(pass.updatedAsset?.status, 'READY_TO_PUBLISH');
  assert.equal(pass.updatedAsset?.qaSignedById, 'u1');
});

test('SLA clock calculations: on track, warning, and breached states', () => {
  const baseAsset: ContentAsset = {
    ...sampleAsset,
    status: 'SLA_REVIEW',
    slaStartedAt: '2026-10-30T00:00:00Z',
    slaExpiresAt: '2026-11-01T00:00:00Z' // 48h from start
  };

  // Current time: 10h after start -> 38h remaining (>24h = ON_TRACK)
  const clock1 = calculateSla(baseAsset, new Date('2026-10-30T10:00:00Z'));
  assert.equal(clock1.status, 'ON_TRACK');
  assert.equal(clock1.isBreached, false);
  assert.equal(clock1.hoursRemaining, 38);

  // Current time: 40h after start -> 8h remaining (<12h = WARNING)
  const clock2 = calculateSla(baseAsset, new Date('2026-10-31T16:00:00Z'));
  assert.equal(clock2.status, 'WARNING');
  assert.equal(clock2.isBreached, false);
  assert.equal(clock2.hoursRemaining, 8);

  // Current time: 50h after start -> past expiry = BREACHED
  const clock3 = calculateSla(baseAsset, new Date('2026-11-01T02:00:00Z'));
  assert.equal(clock3.status, 'BREACHED');
  assert.equal(clock3.isBreached, true);
});
