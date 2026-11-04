import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSLA, computeSLADeadline } from '../src/lib/sla/calculator';
import { syncUser, getUserById, promoteUserToRole } from '../src/lib/auth/sync-user';
import { assertRole } from '../src/lib/auth/guard';
import { transitionAssetStage, getAsset } from '../src/lib/actions/transition-stage';
import { logAssetActivity, getAssetActivities, clearInMemoryActivities } from '../src/lib/audit/logger';
import { ForbiddenError, BadRequestError } from '../src/lib/auth/types';

describe('Prompt 1: User Management, Session Context & Server-Side RBAC', () => {
  it('synchronizes a regular specialist user with default role CREATIVE_SPECIALIST', async () => {
    const user = await syncUser({
      id: 'test-spec-1',
      email: 'jane.specialist@test.com',
      user_metadata: { name: 'Jane Specialist' },
    });
    assert.equal(user.id, 'test-spec-1');
    assert.equal(user.role, 'CREATIVE_SPECIALIST');
    assert.equal(user.email, 'jane.specialist@test.com');
  });

  it('promotes designated email to SUPER_ADMIN upon registration', async () => {
    const admin = await syncUser({
      id: 'test-admin-1',
      email: 'elena@thrill.com',
    });
    assert.equal(admin.role, 'SUPER_ADMIN');

    const primarySuperAdmin = await syncUser({
      id: 'test-primary-superadmin',
      email: 'previewsites40@gmail.com',
    });
    assert.equal(primarySuperAdmin.role, 'SUPER_ADMIN');

    const yanlingSuperAdmin = await syncUser({
      id: 'test-yanling-superadmin',
      email: 'yanling.lin@pradym.io',
    });
    assert.equal(yanlingSuperAdmin.role, 'SUPER_ADMIN');
  });

  it('promotes designated email to CONTENT_MANAGER upon registration', async () => {
    const manager = await syncUser({
      id: 'test-cm-1',
      email: 'content.manager@thrill.com',
    });
    assert.equal(manager.role, 'CONTENT_MANAGER');
  });

  it('assertRole permits authorized roles and throws ForbiddenError for unauthorized roles', async () => {
    const fakeReq: any = {
      headers: {
        'x-dev-user-id': 'u-cs', // Marcus Chen (CREATIVE_SPECIALIST)
      },
    };

    // Creative Specialist cannot execute CONTENT_MANAGER action
    await assert.rejects(
      async () => {
        await assertRole(fakeReq, ['CONTENT_MANAGER']);
      },
      (err: any) => err instanceof ForbiddenError
    );

    // Creative Specialist CAN execute CREATIVE_SPECIALIST action
    const user = await assertRole(fakeReq, ['CREATIVE_SPECIALIST', 'CONTENT_MANAGER']);
    assert.equal(user.role, 'CREATIVE_SPECIALIST');
  });
});

describe('Prompt 2: Deterministic State Machine Engine', () => {
  it('blocks transition to READY_TO_PUBLISH if performed by non-CONTENT_MANAGER', async () => {
    const fakeReq: any = {
      headers: {
        'x-dev-user-id': 'u-cs', // Marcus Chen (CREATIVE_SPECIALIST)
      },
    };

    await assert.rejects(
      async () => {
        await transitionAssetStage(fakeReq, {
          assetId: 'asset-qa-401',
          targetStage: 'READY_TO_PUBLISH',
        });
      },
      (err: any) => err instanceof ForbiddenError
    );
  });

  it('blocks submission to QA_GATE if deliverableUrl is missing', async () => {
    const fakeReq: any = {
      headers: {
        'x-dev-user-id': 'u-cs',
      },
    };

    await assert.rejects(
      async () => {
        await transitionAssetStage(fakeReq, {
          assetId: 'asset-draft-501',
          targetStage: 'QA_GATE',
          metadata: { deliverableUrl: '' },
        });
      },
      (err: any) => err instanceof BadRequestError
    );
  });

  it('blocks revision rejections without explanatory revisionNotes', async () => {
    const fakeReq: any = {
      headers: {
        'x-dev-user-id': 'u-cm', // Elena Vance
      },
    };

    await assert.rejects(
      async () => {
        await transitionAssetStage(fakeReq, {
          assetId: 'asset-qa-401',
          targetStage: 'IN_PRODUCTION',
          metadata: { revisionNotes: '' },
        });
      },
      (err: any) => err instanceof BadRequestError
    );
  });
});

describe('Prompt 3: SLA Calculation & Urgency Level Logic', () => {
  it('returns NORMAL when more than 4 hours remain', () => {
    const future = new Date(Date.now() + 10 * 3600 * 1000).toISOString();
    const result = calculateSLA(future);
    assert.equal(result.isBreached, false);
    assert.equal(result.urgencyLevel, 'NORMAL');
    assert.ok(result.hoursRemaining > 4);
  });

  it('returns WARNING when 4 hours or fewer remain', () => {
    const warningTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const result = calculateSLA(warningTime);
    assert.equal(result.isBreached, false);
    assert.equal(result.urgencyLevel, 'WARNING');
  });

  it('returns BREACHED when deadline is in the past', () => {
    const past = new Date(Date.now() - 3600 * 1000).toISOString();
    const result = calculateSLA(past);
    assert.equal(result.isBreached, true);
    assert.equal(result.urgencyLevel, 'BREACHED');
  });
});

describe('Prompt 4: Enterprise Audit Trail & Revision History', () => {
  it('logs immutable activity and fetches chronological history', async () => {
    clearInMemoryActivities();
    await logAssetActivity({
      assetId: 'asset-test-audit',
      performedBy: 'u-cm',
      performerName: 'Elena Vance',
      performerRole: 'CONTENT_MANAGER',
      action: 'STAGE_TRANSITION',
      previousStage: 'DRAFT_BRIEF',
      newStage: 'SLA_REVIEW',
      reason: 'Brief validated and ready for SLA review',
    });

    const activities = await getAssetActivities('asset-test-audit');
    assert.equal(activities.length, 1);
    assert.equal(activities[0].performedBy, 'u-cm');
    assert.equal(activities[0].newStage, 'SLA_REVIEW');
    assert.equal(activities[0].action, 'STAGE_TRANSITION');
  });
});

describe('Prompt 5: Super Admin Invite & Magic Link Integration', () => {
  it('pre-provisions invited user and flags magicLinkSent', async () => {
    const { inviteUser, getAllUsers } = await import('../src/lib/auth/sync-user');
    const result = await inviteUser({
      email: 'newoperator@agency.com',
      name: 'New Operator',
      role: 'DISTRIBUTION_LEAD',
      team: 'Growth Syndication Pod',
      invitedBy: 'Elena Vance',
    });

    assert.equal(result.user.email, 'newoperator@agency.com');
    assert.equal(result.user.role, 'DISTRIBUTION_LEAD');
    assert.equal(result.user.status, 'invited');
    assert.ok(result.magicLinkSent);

    const users = await getAllUsers();
    const found = users.find((u) => u.email === 'newoperator@agency.com');
    assert.ok(found);
    assert.equal(found.role, 'DISTRIBUTION_LEAD');
  });

  it('isTransitionPermittedForRole permits Super Admin across all transitions', async () => {
    const { isTransitionPermittedForRole } = await import('../src/lib/stateMachine');
    assert.equal(isTransitionPermittedForRole('DRAFT_BRIEF', 'SLA_REVIEW', 'SUPER_ADMIN'), true);
    assert.equal(isTransitionPermittedForRole('SLA_REVIEW', 'IN_PRODUCTION', 'SUPER_ADMIN'), true);
    assert.equal(isTransitionPermittedForRole('IN_PRODUCTION', 'QA_GATE', 'SUPER_ADMIN'), true);
    assert.equal(isTransitionPermittedForRole('QA_GATE', 'READY_TO_PUBLISH', 'SUPER_ADMIN'), true);
    assert.equal(isTransitionPermittedForRole('READY_TO_PUBLISH', 'PUBLISHED', 'SUPER_ADMIN'), true);
  });

  it('isTransitionPermittedForRole restricts Specialist from QA_GATE to READY_TO_PUBLISH', async () => {
    const { isTransitionPermittedForRole } = await import('../src/lib/stateMachine');
    assert.equal(isTransitionPermittedForRole('QA_GATE', 'READY_TO_PUBLISH', 'CREATIVE_SPECIALIST'), false);
    assert.equal(isTransitionPermittedForRole('QA_GATE', 'READY_TO_PUBLISH', 'CONTENT_MANAGER'), true);
  });
});
