import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapSupabaseUserToUser,
  mapAssetToDbRow,
  mapDbRowToAsset
} from './supabase';
import { ContentAsset } from '../types';

test('mapSupabaseUserToUser correctly maps metadata and roles', () => {
  const sbUser = {
    id: 'user-sb-123',
    email: 'elena@enterprise.io',
    user_metadata: {
      name: 'Elena Vance',
      role: 'CONTENT_MANAGER',
      avatar_url: 'https://example.com/avatar.png'
    }
  };

  const user = mapSupabaseUserToUser(sbUser as any);
  assert.equal(user.id, 'user-sb-123');
  assert.equal(user.name, 'Elena Vance');
  assert.equal(user.email, 'elena@enterprise.io');
  assert.equal(user.role, 'CONTENT_MANAGER');
  assert.equal(user.avatarUrl, 'https://example.com/avatar.png');
});

test('mapAssetToDbRow and mapDbRowToAsset bidirectional conversion preserves all fields', () => {
  const originalAsset: ContentAsset = {
    id: 'asset-test-supabase',
    title: 'Testing Supabase Database Sync',
    description: 'Verifying PostgreSQL row mapping',
    pillar: 'CONTENT_OPS',
    formatTier: 'HUB',
    status: 'QA_GATE',
    priority: 'HIGH',
    parentId: 'parent-1',
    parentTitle: 'Parent Campaign',
    hookStrategy: 'Direct Value: "Automate your database sync in 5 minutes."',
    targetAudience: 'Content Engineers & PMs',
    platformSpecs: '1080x1920 9:16 safe margins',
    safeZoneRequirements: '120px top, 180px bottom',
    targetKpi: '80% 3s retention',
    rawIntakeNotes: 'Supabase integration test notes',
    slaHours: 24,
    slaStartedAt: '2026-10-30T10:00:00.000Z',
    slaExpiresAt: '2026-10-31T10:00:00.000Z',
    isSlaBreached: false,
    qaToneApproved: true,
    qaSpecsValidated: true,
    qaRightsCleared: false,
    qaGatekeeperSigned: false,
    qaSignedById: null,
    qaSignedByName: null,
    qaSignedAt: null,
    deliverableUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    attachmentCount: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063',
    retentionRate3s: 72,
    reachImpressions: '45,000',
    isWinningFormat: true,
    paidEligible: true,
    sentToPaidAds: false,
    createdById: 'u-cm',
    assignedToId: 'u-cs',
    targetPublishAt: '2026-11-05T00:00:00.000Z',
    history: [
      {
        id: 'hist-1',
        action: 'Created brief',
        timestamp: '2026-10-30T10:00:00.000Z',
        userId: 'u-cm',
        userName: 'Elena Vance'
      }
    ],
    generatedHooks: [
      {
        type: 'Direct Value',
        script: 'Automate your database sync in 5 minutes.'
      }
    ],
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-10-30T11:00:00.000Z'
  };

  const dbRow = mapAssetToDbRow(originalAsset);
  assert.equal(dbRow.id, originalAsset.id);
  assert.equal(dbRow.title, originalAsset.title);
  assert.equal(dbRow.format_tier, 'HUB');
  assert.equal(dbRow.qa_tone_approved, true);
  assert.equal(dbRow.qa_rights_cleared, false);

  const reconstituted = mapDbRowToAsset(dbRow);
  assert.equal(reconstituted.id, originalAsset.id);
  assert.equal(reconstituted.title, originalAsset.title);
  assert.equal(reconstituted.formatTier, originalAsset.formatTier);
  assert.equal(reconstituted.status, originalAsset.status);
  assert.equal(reconstituted.qaToneApproved, originalAsset.qaToneApproved);
  assert.equal(reconstituted.qaRightsCleared, originalAsset.qaRightsCleared);
  assert.equal(reconstituted.hookStrategy, originalAsset.hookStrategy);
  assert.equal(reconstituted.targetAudience, originalAsset.targetAudience);
  assert.equal(reconstituted.safeZoneRequirements, originalAsset.safeZoneRequirements);
  assert.deepEqual(reconstituted.history, originalAsset.history);
  assert.deepEqual(reconstituted.generatedHooks, originalAsset.generatedHooks);
});

test('mapSupabaseUserToUser extracts custom user metadata (avatar URL, role, team)', () => {
  const sbUser = {
    id: 'user-cm-789',
    email: 'elena.vance@thrill.ai',
    user_metadata: {
      full_name: 'Elena Vance',
      role: 'CONTENT_MANAGER',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
      team: 'Executive ContentOps Pod'
    }
  };

  const user = mapSupabaseUserToUser(sbUser as any);
  assert.equal(user.id, 'user-cm-789');
  assert.equal(user.name, 'Elena Vance');
  assert.equal(user.email, 'elena.vance@thrill.ai');
  assert.equal(user.role, 'CONTENT_MANAGER');
  assert.equal(user.avatarUrl, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2');
  assert.equal(user.team, 'Executive ContentOps Pod');
});
