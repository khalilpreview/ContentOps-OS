import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generate30DayVelocityTrends,
  calculateSlaPerformanceMetrics,
  calculateDashboardSummaryStats
} from './dashboardMetrics';
import { ContentAsset } from '../types';

test('generate30DayVelocityTrends returns correct number of days and valid data points', () => {
  const dummyAssets: ContentAsset[] = [
    {
      id: 'asset-1',
      title: 'Hero Keynote',
      pillar: 'STRATEGY_SERIES',
      formatTier: 'HERO',
      status: 'PUBLISHED',
      priority: 'HIGH',
      slaHours: 48,
      isSlaBreached: false,
      qaToneApproved: true,
      qaSpecsValidated: true,
      qaRightsCleared: true,
      qaGatekeeperSigned: true,
      isWinningFormat: false,
      paidEligible: false,
      createdById: 'u-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const points30 = generate30DayVelocityTrends(dummyAssets, 30);
  assert.equal(points30.length, 30);

  const lastPoint = points30[points30.length - 1];
  assert.ok(typeof lastPoint.created === 'number');
  assert.ok(typeof lastPoint.completed === 'number');
  assert.ok(typeof lastPoint.published === 'number');
  assert.ok(typeof lastPoint.velocityRate === 'number');

  const points7 = generate30DayVelocityTrends(dummyAssets, 7);
  assert.equal(points7.length, 7);
});

test('calculateSlaPerformanceMetrics calculates compliance and distribution slices', () => {
  const dummyAssets: ContentAsset[] = [
    {
      id: 'asset-2',
      title: 'SLA Review Asset',
      pillar: 'CONTENT_OPS',
      formatTier: 'HUB',
      status: 'SLA_REVIEW',
      priority: 'URGENT',
      slaHours: 48,
      slaStartedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
      slaExpiresAt: new Date(Date.now() + 28 * 3600000).toISOString(),
      isSlaBreached: false,
      qaToneApproved: false,
      qaSpecsValidated: false,
      qaRightsCleared: false,
      qaGatekeeperSigned: false,
      isWinningFormat: false,
      paidEligible: false,
      createdById: 'u-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const metrics = calculateSlaPerformanceMetrics(dummyAssets, 30);

  assert.equal(metrics.dailySlaData.length, 30);
  assert.ok(metrics.overallComplianceRate > 80 && metrics.overallComplianceRate <= 100);
  assert.ok(metrics.avgTurnaroundOverall < 48);
  assert.ok(metrics.hoursAheadOfCeiling > 0);

  // Distribution slices
  assert.equal(metrics.distribution.length, 3);
  assert.equal(metrics.distribution[0].name, 'On-Time Cleared');
  assert.equal(metrics.distribution[1].name, 'At-Risk (<12h remaining)');
  assert.equal(metrics.distribution[2].name, 'Breached SLAs');

  // Stage Latency has 5 key stages
  assert.equal(metrics.stageLatency.length, 5);
});

test('calculateDashboardSummaryStats outputs valid KPI stats', () => {
  const stats = calculateDashboardSummaryStats([]);
  assert.ok(stats.totalAssetsProcessed > 0);
  assert.ok(stats.velocityOutputPerDay > 0);
  assert.ok(stats.slaComplianceRate > 85);
  assert.ok(stats.avgTurnaroundHours < 48);
});
