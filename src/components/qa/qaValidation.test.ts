import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSignOffQa,
  formatPlaybackTime,
  isVideoDeliverable,
  isImageDeliverable,
  createRevisionPayload
} from './qaValidation';
import { ContentAsset, User } from '../../types';

test('formatPlaybackTime correctly converts seconds to mm:ss', () => {
  assert.equal(formatPlaybackTime(0), '00:00');
  assert.equal(formatPlaybackTime(4), '00:04');
  assert.equal(formatPlaybackTime(59), '00:59');
  assert.equal(formatPlaybackTime(60), '01:00');
  assert.equal(formatPlaybackTime(75), '01:15');
  assert.equal(formatPlaybackTime(360), '06:00');
  assert.equal(formatPlaybackTime(-10), '00:00');
});

test('isVideoDeliverable accurately detects video URLs', () => {
  assert.equal(isVideoDeliverable('https://example.com/video.mp4'), true);
  assert.equal(isVideoDeliverable('https://example.com/stream.webm'), true);
  assert.equal(isVideoDeliverable('https://assets.mixkit.co/videos/preview/123.mp4'), true);
  assert.equal(isVideoDeliverable('https://example.com/image.png'), false);
  assert.equal(isVideoDeliverable('https://example.com/doc.pdf'), false);
  assert.equal(isVideoDeliverable(null), false);
  assert.equal(isVideoDeliverable(undefined), false);
});

test('isImageDeliverable accurately detects image URLs', () => {
  assert.equal(isImageDeliverable('https://example.com/proof.png'), true);
  assert.equal(isImageDeliverable('https://example.com/asset.jpg'), true);
  assert.equal(isImageDeliverable('https://images.unsplash.com/photo-1540575467063'), true);
  assert.equal(isImageDeliverable('https://example.com/clip.mp4'), false);
  assert.equal(isImageDeliverable(null), false);
});

test('canSignOffQa allows sign-off only when CONTENT_MANAGER and all 4 checks are true', () => {
  const contentManager: Pick<User, 'id' | 'name' | 'role'> = {
    id: 'u-cm',
    name: 'Elena Vance',
    role: 'CONTENT_MANAGER'
  };

  const creative: Pick<User, 'id' | 'name' | 'role'> = {
    id: 'u-cs',
    name: 'Marcus Vance',
    role: 'CREATIVE_SPECIALIST'
  };

  const allChecked = {
    qaToneApproved: true,
    qaSpecsValidated: true,
    qaRightsCleared: true,
    qaGatekeeperSigned: true
  };

  const partialChecked = {
    qaToneApproved: true,
    qaSpecsValidated: true,
    qaRightsCleared: false,
    qaGatekeeperSigned: true
  };

  // Content Manager with all 4 checks
  const cmPass = canSignOffQa(allChecked, contentManager);
  assert.equal(cmPass.canSignOff, true);
  assert.equal(cmPass.missingChecks.length, 0);

  // Content Manager with missing checks
  const cmFail = canSignOffQa(partialChecked, contentManager);
  assert.equal(cmFail.canSignOff, false);
  assert.deepEqual(cmFail.missingChecks, ['Commercial Music & IP Rights']);

  // Non-Content Manager even with all 4 checks
  const creativeFail = canSignOffQa(allChecked, creative);
  assert.equal(creativeFail.canSignOff, false);
  assert.equal(creativeFail.isContentManager, false);
});

test('createRevisionPayload resets status to IN_PRODUCTION, clears gatekeeper signoff, and logs history', () => {
  const dummyAsset: ContentAsset = {
    id: 'asset-test-1',
    title: 'Test Asset for QA Revision',
    pillar: 'CONTENT_OPS',
    formatTier: 'HUB',
    status: 'QA_GATE',
    priority: 'HIGH',
    slaHours: 24,
    isSlaBreached: false,
    qaToneApproved: true,
    qaSpecsValidated: true,
    qaRightsCleared: true,
    qaGatekeeperSigned: true,
    isWinningFormat: false,
    paidEligible: false,
    createdById: 'u-cs',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: []
  };

  const user: User = {
    id: 'u-cm',
    name: 'Elena Vance',
    email: 'elena@thrill.ai',
    role: 'CONTENT_MANAGER'
  };

  const payload = createRevisionPayload(dummyAsset, user, 'Audio levels exceed -14 LUFS', 4);

  assert.equal(payload.status, 'IN_PRODUCTION');
  assert.equal(payload.qaGatekeeperSigned, false);
  assert.ok(payload.history && payload.history.length === 1);
  assert.equal(payload.history[0].action, 'REVISION_REQUESTED');
  assert.equal(payload.history[0].fromStatus, 'QA_GATE');
  assert.equal(payload.history[0].toStatus, 'IN_PRODUCTION');
  assert.ok(payload.history[0].note?.includes('[At 00:04]'));
  assert.ok(payload.history[0].note?.includes('Audio levels exceed -14 LUFS'));
});
