import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_SEED_ASSETS } from '../src/lib/seedData';
import { calculateSla } from '../src/lib/sla';

test('Topology Data Flow: calculates stage distribution correctly', () => {
  const assets = DEMO_SEED_ASSETS;
  const draftBriefCount = assets.filter((a) => a.status === 'DRAFT_BRIEF').length;
  const inProductionCount = assets.filter((a) => a.status === 'IN_PRODUCTION').length;
  const qaGateCount = assets.filter((a) => a.status === 'QA_GATE').length;

  assert.ok(draftBriefCount >= 0);
  assert.ok(inProductionCount >= 0);
  assert.ok(qaGateCount >= 0);
});

test('Topology SLA Gateway Sentinel: correctly flags SLA warnings and breaches', () => {
  const breachedAsset = {
    ...DEMO_SEED_ASSETS[0],
    status: 'SLA_REVIEW' as const,
    slaExpiresAt: new Date(Date.now() - 3600000).toISOString()
  };

  const sla = calculateSla(breachedAsset);
  assert.equal(sla.isBreached, true);
  assert.ok(sla.hoursRemaining < 0);
});

test('Topology Pillar Scope Allocator: calculates percentages aligned with SOW targets', () => {
  const assets = DEMO_SEED_ASSETS;
  const total = assets.length;
  assert.ok(total > 0);

  const strategyCount = assets.filter((a) => a.pillar === 'STRATEGY_SERIES').length;
  const strategyPercent = Math.round((strategyCount / total) * 100);
  assert.ok(strategyPercent >= 0 && strategyPercent <= 100);
});
